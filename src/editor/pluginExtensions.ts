import { StateEffect, StateField, type Extension } from "@codemirror/state";
import {
  Decoration,
  EditorView,
  ViewPlugin,
  type DecorationSet,
  type ViewUpdate,
} from "@codemirror/view";
import { linter, type Diagnostic as CmDiagnostic } from "@codemirror/lint";
import type { CompletionContext } from "@codemirror/autocomplete";
import { watch } from "vue";
import { pluginServices } from "../plugins/host/services";
import { pluginGrants } from "../plugins/permissions/grants";
import type {
  EditorContext,
  Completion,
  Decoration as PluginDecoration,
  Diagnostic,
} from "../plugins/sdk/index";
import { pluginRuntime } from "../plugins/runtime";
const effects = StateEffect.define<DecorationSet>();
const field = StateField.define<DecorationSet>({
  create: () => Decoration.none,
  update: (value, transaction) => {
    value = value.map(transaction.changes);
    for (const effect of transaction.effects)
      if (effect.is(effects)) value = effect.value;
    return value;
  },
  provide: (field) => EditorView.decorations.from(field),
});
export function pluginEditorExtensions(
  info: () => {
    id: string;
    root: string;
    mode: "wysiwyg" | "source" | "split";
  },
): Extension {
  function context(view: EditorView): EditorContext {
    const value = info(),
      snapshot = pluginRuntime.documentSnapshot(value.id),
      selection = view.state.selection.main;
    return {
      id: value.id,
      root: value.root,
      content: view.state.doc.toString(),
      revision: snapshot?.revision || 0,
      path: snapshot?.path,
      mode: value.mode,
      composing: view.composing,
      selection: {
        from: selection.from,
        to: selection.to,
        text: view.state.sliceDoc(selection.from, selection.to),
      },
    };
  }
  function permitted(owner: string) {
    try {
      pluginGrants.require(owner, "editor.read");
      return true;
    } catch {
      return false;
    }
  }
  function validRange(value: { from: number; to: number }, length: number) {
    return (
      Number.isInteger(value.from) &&
      Number.isInteger(value.to) &&
      value.from >= 0 &&
      value.to >= value.from &&
      value.to <= length
    );
  }
  const completion = async (input: CompletionContext) => {
    if (!input.view || input.view.composing || input.state.readOnly)
      return null;
    const snapshot = context(input.view),
      state = input.state,
      results: Completion[] = [],
      controller = new AbortController();
    snapshot.signal = controller.signal;
    input.addEventListener("abort", () => controller.abort(), {
      onDocChange: true,
    });
    await Promise.all(
      pluginServices.completion
        .filter((provider) => permitted(provider.owner))
        .map(async (provider) => {
          try {
            const values = await provider.provide(snapshot);
            if (input.aborted || input.view?.state.doc !== state.doc) return;
            for (const value of values.slice(0, 100) as Completion[])
              if (
                validRange(value, state.doc.length) &&
                typeof value.label === "string" &&
                typeof value.insertText === "string" &&
                value.to === input.pos
              )
                results.push(value);
          } catch (error) {
            console.error("Plugin completion:", error);
          }
        }),
    );
    if (input.aborted || !results.length) return null;
    const from = results[0].from;
    return {
      from,
      options: results
        .filter((value) => value.from === from)
        .slice(0, 100)
        .map((value) => ({
          label: value.label,
          detail: value.detail,
          apply: value.insertText,
        })),
    };
  };
  const diagnostics = linter(
    async (view) => {
      const snapshot = context(view),
        doc = view.state.doc,
        values: CmDiagnostic[] = [];
      await Promise.all(
        pluginServices.diagnostic
          .filter((provider) => permitted(provider.owner))
          .map(async (provider) => {
            try {
              for (const item of (await provider.provide(snapshot)).slice(
                0,
                200,
              ) as Diagnostic[]) {
                if (
                  view.state.doc !== doc ||
                  !validRange(item, doc.length) ||
                  !["info", "warning", "error"].includes(item.severity) ||
                  typeof item.message !== "string"
                )
                  continue;
                values.push({
                  from: item.from,
                  to: item.to,
                  severity: item.severity,
                  message: item.message.slice(0, 1000),
                  source: provider.id,
                  actions: item.fix
                    ? [
                        {
                          name: item.fix.title,
                          apply: (target) => {
                            if (
                              target.state.doc !== doc ||
                              target.state.readOnly
                            )
                              return;
                            void pluginRuntime
                              .applyExternalEdits({
                                documentId: snapshot.id,
                                expectedRevision: snapshot.revision,
                                edits: item.fix!.edits,
                              })
                              .catch(console.error);
                          },
                        },
                      ]
                    : undefined,
                });
              }
            } catch (error) {
              console.error("Plugin diagnostic:", error);
            }
          }),
      );
      return view.state.doc === doc ? values : [];
    },
    { delay: 300 },
  );
  const decoration = ViewPlugin.fromClass(
    class {
      timer: ReturnType<typeof setTimeout> | undefined;
      controller?: AbortController;
      ticket = 0;
      stopped = false;
      unwatch: () => void;
      constructor(readonly view: EditorView) {
        this.unwatch = watch(
          () => pluginServices.decoration,
          () => this.schedule(),
        );
        this.schedule();
      }
      update(update: ViewUpdate) {
        if (update.docChanged || update.selectionSet) this.schedule();
      }
      schedule() {
        clearTimeout(this.timer);
        this.controller?.abort();
        this.ticket++;
        this.timer = setTimeout(() => {
          void this.render(this.ticket);
        }, 120);
      }
      async render(ticket: number) {
        if (this.stopped || this.view.composing) return;
        const snapshot = context(this.view),
          doc = this.view.state.doc;
        this.controller = new AbortController();
        snapshot.signal = this.controller.signal;
        const ranges: ReturnType<
          ReturnType<typeof Decoration.mark>["range"]
        >[] = [];
        await Promise.all(
          pluginServices.decoration
            .filter((provider) => permitted(provider.owner))
            .map(async (provider) => {
              try {
                for (const item of (await provider.provide(snapshot)).slice(
                  0,
                  1000,
                ) as PluginDecoration[]) {
                  if (
                    !validRange(item, doc.length) ||
                    item.from === item.to ||
                    !["highlight", "underline", "muted", "strong"].includes(
                      item.kind,
                    )
                  )
                    continue;
                  ranges.push(
                    Decoration.mark({
                      class: `plugin-decoration-${item.kind}`,
                      attributes: item.title
                        ? { title: item.title.slice(0, 200) }
                        : undefined,
                    }).range(item.from, item.to),
                  );
                }
              } catch (error) {
                console.error("Plugin decoration:", error);
              }
            }),
        );
        if (
          !this.stopped &&
          this.ticket === ticket &&
          this.view.state.doc === doc
        )
          this.view.dispatch({
            effects: effects.of(Decoration.set(ranges, true)),
          });
      }
      destroy() {
        this.controller?.abort();
        this.stopped = true;
        this.ticket++;
        clearTimeout(this.timer);
        this.unwatch();
      }
    },
  );
  return [
    field,
    decoration,
    diagnostics,
    EditorView.baseTheme({
      ".plugin-decoration-highlight": { backgroundColor: "var(--accent-soft)" },
      ".plugin-decoration-underline": { textDecoration: "underline" },
      ".plugin-decoration-muted": { opacity: ".65" },
      ".plugin-decoration-strong": { fontWeight: "600" },
    }),
    // A language-data provider adds completions without replacing built-in sources.
    importLanguageData(completion),
  ];
}
import { EditorState } from "@codemirror/state";
function importLanguageData(
  source: (context: CompletionContext) => Promise<any>,
) {
  return EditorState.languageData.of(() => [{ autocomplete: source }]);
}
