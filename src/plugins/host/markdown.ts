import { reactive } from "vue";
import { pluginServices } from "./services";
import { pluginGrants } from "../permissions/grants";
import { pluginRuntime } from "../runtime";
import { mountTree, releaseUiCallbacks } from "../ui/tree";
const key = "markart-plugin-renderers-v2";
let stored: Record<string, string> = {};
try {
  stored = JSON.parse(localStorage.getItem(key) || "{}");
} catch {
  /* Use built-in renderers. */
}
export const rendererChoices = reactive<Record<string, string>>(stored);
export function selectRenderer(language: string, id: string) {
  rendererChoices[language] = id;
  localStorage.setItem(key, JSON.stringify(rendererChoices));
}
const scopes = new WeakMap<
  HTMLElement,
  { controller: AbortController; release: (() => void)[] }
>();
export function cleanupPluginMarkdown(root: HTMLElement) {
  const scope = scopes.get(root);
  if (scope) {
    scope.controller.abort();
    for (const release of scope.release) release();
    scopes.delete(root);
  }
}
export async function renderPluginMarkdown(root: HTMLElement, strict = false) {
  cleanupPluginMarkdown(root);
  const scope = {
    controller: new AbortController(),
    release: [] as (() => void)[],
  };
  scopes.set(root, scope);
  const context = pluginRuntime.context(),
    rootPath = context.root,
    source = context.document?.path || "";
  const permitted = (owner: string) => {
    try {
      pluginGrants.require(owner, "editor.read");
      return true;
    } catch {
      return false;
    }
  };
  for (const code of root.querySelectorAll<HTMLElement>("pre>code")) {
    const language =
      [...code.classList]
        .find((name) => name.startsWith("language-"))
        ?.slice(9) || "";
    const candidates = pluginServices.blocks.filter(
      (provider) => provider.language === language && permitted(provider.owner),
    );
    const selected = rendererChoices[language],
      provider = selected
        ? candidates.find((item) => item.id === selected)
        : ["mermaid", "mindmap", "math"].includes(language)
          ? undefined
          : candidates[0];
    if (!provider) continue;
    const pre = code.parentElement!,
      text = code.textContent || "",
      output = document.createElement("div");
    output.className = "plugin-markdown-block";
    try {
      const tree = await provider.render({
        text,
        language,
        root: rootPath,
        source,
        signal: scope.controller.signal,
      });
      if (scope.controller.signal.aborted) {
        releaseUiCallbacks(tree);
        return;
      }
      scope.release.push(mountTree(output, tree).release);
      pre.replaceWith(output);
    } catch (error) {
      if (strict) throw new Error(`${provider.owner}: ${String(error)}`);
      console.error("Plugin block renderer:", error);
    }
  }
  for (const provider of pluginServices.inlines.filter((item) =>
    permitted(item.owner),
  )) {
    const marker = provider.pattern || "";
    if (!marker) continue;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT),
      nodes: Text[] = [];
    while (walker.nextNode()) {
      const text = walker.currentNode as Text;
      if (
        !text.parentElement?.closest(
          "pre,code,svg,.katex,.plugin-markdown-block,.plugin-markdown-inline",
        ) &&
        text.data.includes(marker)
      )
        nodes.push(text);
      if (nodes.length >= 200) break;
    }
    for (const text of nodes) {
      let remaining = text.data;
      const fragment = document.createDocumentFragment();
      let count = 0;
      while (count++ < 50) {
        const from = remaining.indexOf(marker),
          to = from >= 0 ? remaining.indexOf(marker, from + marker.length) : -1;
        if (from < 0 || to < 0) break;
        fragment.append(document.createTextNode(remaining.slice(0, from)));
        const value = remaining.slice(from + marker.length, to),
          span = document.createElement("span");
        span.className = "plugin-markdown-inline";
        try {
          const tree = await provider.render({
            text: value,
            root: rootPath,
            source,
            signal: scope.controller.signal,
          });
          if (scope.controller.signal.aborted) {
            releaseUiCallbacks(tree);
            return;
          }
          scope.release.push(mountTree(span, tree).release);
          fragment.append(span);
        } catch (error) {
          if (strict) throw new Error(`${provider.owner}: ${String(error)}`);
          fragment.append(
            document.createTextNode(remaining.slice(from, to + marker.length)),
          );
        }
        remaining = remaining.slice(to + marker.length);
      }
      fragment.append(document.createTextNode(remaining));
      text.replaceWith(fragment);
    }
  }
}
