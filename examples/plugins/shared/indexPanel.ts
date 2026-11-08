import type {
  PluginAPI,
  SidebarContext,
  IndexedFile,
  IndexMetadata,
  IndexLinks,
  FileView,
  UiNode,
  Dispose,
} from "../../../src/plugins/sdk/index";
export type Model = {
  root: string;
  files: IndexedFile[];
  metadata: Map<string, IndexMetadata>;
  links: IndexLinks["links"];
};
export const text = (value: string): UiNode => ({
  tag: "p",
  attrs: { class: "panel-message" },
  text: value,
});
/**
 * Follows the file list: when a folder is selected or a filter is on, only files the
 * list currently shows stay in scope. Otherwise everything indexed remains visible.
 */
export function scopeFiles(files: IndexedFile[], view: FileView | null) {
  if (!view) return files;
  const folder =
    view.selected?.kind === "folder" ? view.selected.path : "";
  if (!folder && !view.filter.active) return files;
  const visible = new Set(view.files);
  return files.filter(
    (file) =>
      visible.has(file.path) &&
      (!folder || file.path === folder || file.path.startsWith(`${folder}/`)),
  );
}
export function currentFile(model: Model, context: SidebarContext) {
  return model.files.find(
    (file) => file.path === context.file?.path || file.id === context.file?.id,
  );
}
export async function openFile(
  api: PluginAPI,
  model: Model,
  file: IndexedFile,
) {
  try {
    await api.files.open({ ...file, root: model.root });
  } catch (error) {
    await api.ui.notify(
      `无法打开文件：${error instanceof Error ? error.message : String(error)}`,
    );
  }
}
export function fileButton(
  api: PluginAPI,
  model: Model,
  file: IndexedFile,
  detail?: string,
): UiNode {
  return {
    tag: "button",
    attrs: { class: "file-entry", title: file.path },
    children: [
      { tag: "span", text: file.path },
      ...(detail ? [{ tag: "small", text: detail }] : []),
    ],
    on: { click: () => openFile(api, model, file) },
  };
}
export async function readFiles(
  api: PluginAPI,
  root: string,
): Promise<{ cursor: string; files: IndexedFile[] }> {
  let after: string | undefined, cursor: string | undefined;
  const files: IndexedFile[] = [];
  do {
    const page = await api.index.files({ root, cursor, after, limit: 500 });
    cursor = page.cursor;
    files.push(...page.files.filter((file) => file.text));
    after = page.next || undefined;
  } while (after);
  return { cursor: cursor || "", files };
}
export async function readLinks(
  api: PluginAPI,
  root: string,
): Promise<IndexLinks["links"]> {
  let after: number | undefined, cursor: string | undefined;
  const links: IndexLinks["links"] = [];
  do {
    const page = await api.index.links({ root, cursor, after, limit: 500 });
    cursor = page.cursor;
    links.push(...page.links);
    after = page.next ?? undefined;
  } while (after !== undefined);
  return links;
}
export function registerIndexPanel(
  api: PluginAPI,
  options: {
    id: string;
    title: string;
    metadata?: boolean;
    links?: boolean;
    render: (model: Model, context: SidebarContext) => UiNode | Promise<UiNode>;
  },
) {
  const metadata = new Map<string, { version: number; value: IndexMetadata }>();
  let model: Model = { root: "", files: [], metadata: new Map(), links: [] },
    dirty = true,
    generation = 0,
    cacheRoot = "",
    stop: Dispose | undefined,
    watching = "",
    latest: SidebarContext | undefined,
    scheduled: Dispose | undefined,
    loading: Promise<Model> | undefined;
  async function refresh() {
    if (!latest || api.lifecycle.signal.aborted) return;
    const item = await api.ui.sidebar.getItem(latest.itemId);
    await item?.refresh();
  }
  async function unsubscribe() {
    await scheduled?.();
    scheduled = undefined;
    const dispose = stop;
    stop = undefined;
    watching = "";
    await dispose?.();
  }
  async function subscribe(root: string) {
    if (watching === root) return;
    await unsubscribe();
    watching = root;
    try {
      const dispose = await api.index.subscribe(root, async () => {
        dirty = true;
        generation += 1;
        if (!scheduled)
          scheduled = await api.lifecycle.setTimeout(async () => {
            scheduled = undefined;
            await refresh();
          }, 100);
      });
      if (watching !== root) await dispose();
      else stop = dispose;
    } catch (error) {
      watching = "";
      throw error;
    }
  }
  async function load(root: string) {
    if (model.root !== root) {
      metadata.clear();
      dirty = true;
    }
    if (!dirty) return model;
    if (loading) {
      await loading;
      if (model.root === root && !dirty) return model;
    }
    if (cacheRoot !== root) {
      metadata.clear();
      cacheRoot = root;
    }
    const started = generation;
    loading = (async () => {
      await api.events.whenReady("index", root);
      const page = await readFiles(api, root),
        next: Model = {
          root,
          files: page.files,
          metadata: new Map(),
          links: [],
        };
      if (options.metadata) {
        for (let index = 0; index < page.files.length; index += 4) {
          await Promise.all(
            page.files.slice(index, index + 4).map(async (file) => {
              const previous = metadata.get(file.id);
              const value =
                previous?.version === file.version
                  ? previous.value
                  : await api.index.metadata({
                      root,
                      id: file.id,
                      version: file.version,
                    });
              next.metadata.set(file.id, value);
              metadata.set(file.id, { version: file.version, value });
            }),
          );
        }
        const retained = new Set(page.files.map((file) => file.id));
        for (const id of metadata.keys())
          if (!retained.has(id)) metadata.delete(id);
      }
      if (options.links) next.links = await readLinks(api, root);
      model = next;
      dirty = generation !== started;
      return next;
    })();
    try {
      return await loading;
    } finally {
      loading = undefined;
    }
  }
  async function render(context: SidebarContext): Promise<UiNode> {
    latest = context;
    if (!context.root) {
      await unsubscribe();
      return text("打开文件夹后查看");
    }
    try {
      await subscribe(context.root);
      const data = await load(context.root);
      if (context.signal?.aborted) return text("");
      return await options.render(data, context);
    } catch (error) {
      const code = (error as { code?: string })?.code;
      if (code === "cancelled" || api.lifecycle.signal.aborted) return text("");
      const retry: UiNode = {
        tag: "button",
        text: "刷新",
        on: {
          click: async () => {
            try {
              dirty = true;
              await refresh();
            } catch (error) {
              if ((error as { code?: string })?.code !== "cancelled")
                await api.ui.notify(String(error));
            }
          },
        },
      };
      return {
        tag: "div",
        children: [
          text(
            code === "permission-denied"
              ? "插件权限或文件访问范围不符合清单声明"
              : `无法读取索引：${error instanceof Error ? error.message : String(error)}`,
          ),
          retry,
        ],
      };
    }
  }
  return (async () => {
    await api.ui.sidebar.register({
      id: options.id,
      title: options.title,
      render,
      onContextChange() {},
      async onHide() {
        await unsubscribe();
      },
      async onClose() {
        await unsubscribe();
        await scheduled?.();
        scheduled = undefined;
        metadata.clear();
      },
    });
    await api.commands.register({
      id: "open",
      title: `打开${options.title}`,
      run: () => api.ui.sidebar.open(options.id),
    });
    await api.lifecycle.track(async () => {
      await unsubscribe();
      await scheduled?.();
      metadata.clear();
    });
  })();
}
