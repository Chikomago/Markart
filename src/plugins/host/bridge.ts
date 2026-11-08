import { webDocument } from '../webview/content';
import { mountWebView } from '../webview/mount';
import { hasWorkspaceRoot, requireWorkspaceRoot } from './workspaceScope';
import { invoke } from "@tauri-apps/api/core";
import { nextTick, watch } from "vue";
import { version } from "../../../package.json";
import { ResourceScope } from "../runtime/scope";
import { PluginError, supportedCapabilities, type Json } from "../sdk/protocol";
import { initializePluginPermissions } from "../permissions/declaration";
import { pluginGrants } from "../permissions/grants";
import type { DownloadedPlugin } from "../community";
import type { PluginHost, PluginEvent, Dispose } from "./types";
import type { PluginAdapter } from "../runtime";
import type { View, SidebarItem, SidebarContext } from "../sdk/index";
import { sidebarLayout } from "../ui/sidebarLayout";
import { groupLabel } from "../ui/sidebarRegistry";
import { pluginSidebar } from "../sidebarState";
import { mountPanelView } from "../ui/sidebarView";
import { mountViewTree } from "../ui/tree";
import { sidebarInstances, pluginServices, registerService } from "./services";
import { PluginFiles } from "./files";
import { listen } from "@tauri-apps/api/event";
export function createPluginBridge(
  pkg: DownloadedPlugin,
  host: PluginHost,
  adapter: PluginAdapter,
  onFault: (error: unknown) => void,
) {
  const id = pkg.manifest.id,
    scope = new ResourceScope(),
    views = new Map<string, View>();
  const full = (key: string) =>
    key.startsWith(id + ":") ? key : `${id}:${key}`;
  const requireRead = (root = host.workspace.root()) => {
    pluginGrants.require(id, "editor.read");
    if (root) requireWorkspaceRoot(host, root);
  };
  const requireWrite = (documentId?: string) => {
    const root = documentId
      ? host.documents.get(documentId)?.root
      : host.workspace.root();
    pluginGrants.require(id, "editor.write");
    if (root) requireWorkspaceRoot(host, root);
  };
  const getSnapshot = () => {
    requireRead();
    const doc = host.documents.active();
    return doc
      ? { ...host.documents.get(doc.id), root: host.workspace.root() }
      : null;
  };
  const safeContext = () => {
    const grant = pluginGrants.state[id],
      root = host.workspace.root();
    return {
      root: root && hasWorkspaceRoot(host, root) ? root : "",
      file:
        grant?.permissions.includes("editor.read") &&
        (!root || hasWorkspaceRoot(host, root))
          ? getSnapshot()
          : null,
    };
  };
  const files = new PluginFiles(id, host, {
    openFile: (root, path) => {
      if (!adapter.openFile)
        throw new PluginError("not-ready", "文件服务未就绪");
      return adapter.openFile(root, path);
    },
    openedFile: (root, path) => adapter.openedFile?.(root, path) || null,
    fileOperation: (...args) => {
      if (!adapter.fileOperation)
        throw new PluginError("not-ready", "文件服务未就绪");
      return adapter.fileOperation(...args);
    },
    fileView: () => adapter.fileView?.(),
  });
  function ownItem(itemId: string) {
    const item = sidebarLayout.item(itemId);
    if (!views.has(item.viewId))
      throw new PluginError("permission-denied", "不能操作其他插件的面板");
    return item;
  }
  function reveal(itemId: string) {
    const item = ownItem(itemId);
    sidebarLayout.select(itemId);
    const group = sidebarLayout.group(item.groupId);
    if (group.slot.startsWith("right")) pluginSidebar.setOpen(true);
    else adapter.openSidebar?.();
  }
  function itemHandle(itemId: string) {
    const item = ownItem(itemId);
    return {
      id: item.id,
      viewId: item.viewId,
      getInfo: () => {
        const item = ownItem(itemId);
        return {
          groupId: item.groupId,
          state: item.state,
          root: item.root,
          pinned: item.pinned,
        };
      },
      reveal: () => reveal(itemId),
      moveTo: (groupId: string) => {
        ownItem(itemId);
        sidebarLayout.move(itemId, groupId);
        reveal(itemId);
      },
      close: () => {
        ownItem(itemId);
        sidebarLayout.close(itemId);
      },
      refresh: () => {
        ownItem(itemId);
        return sidebarInstances.get(itemId)?.refresh();
      },
      setState: (state: Json) => {
        const item = ownItem(itemId);
        sidebarLayout.setState(
          itemId,
          state,
          views.get(item.viewId)?.stateVersion || 1,
        );
        return sidebarInstances.get(itemId)?.refresh();
      },
    };
  }
  const register = (kind: keyof typeof pluginServices, input: any) =>
    scope.track(registerService(kind, id, input));
  async function dispatch(method: string, args: any[]): Promise<any> {
    if (scope.signal.aborted) throw new PluginError("cancelled", "插件已停用");
    const [a, b, c] = args;
    switch (method) {
      case "permissions.request":
        initializePluginPermissions(pkg,scope.signal);
        return true;
      case "app.version":
        return version;
      case "app.apiVersion":
        return 2;
      case "app.supports":
        return supportedCapabilities.includes(a);
      case "commands.register":
        return host.commands.register({
          ...a,
          run: (context: any) => {
            const grant = pluginGrants.state[id],
              root = context.root,
              allowed = !root || hasWorkspaceRoot(host, root),
              read = allowed && grant?.permissions.includes("editor.read");
            return a.run({
              ...context,
              root: allowed ? root : "",
              document: read ? context.document : null,
              selection: read ? context.selection : null,
              target: allowed ? context.target : undefined,
            });
          },
        });
      case "commands.execute":
        return host.commands.execute(full(a));
      case "commands.list":
        return host.commands.list();
      case "editor.getSnapshot":
        return getSnapshot();
      case "editor.getMode":
        return adapter.mode?.() || "source";
      case "editor.getSelection":
        requireRead();
        return host.editor.getSelection();
      case "editor.getCursor":
        requireRead();
        return host.editor.getSelection().to;
      case "editor.setCursor":
        requireRead();
        return host.editor.setSelection(a, a);
      case "editor.setSelection":
        requireRead();
        return host.editor.setSelection(a, b);
      case "editor.applyEdits":
      case "editor.transaction": {
        requireWrite(a.documentId);
        const result = await host.documents.applyEdits(a);
        if (!result.ok)
          throw new PluginError(
            result.reason === "stale-revision"
              ? "stale-revision"
              : result.reason === "not-editable"
                ? "read-only"
                : "not-ready",
            "文件版本、编辑状态或修改范围已变化",
          );
        return {
          ...result.document,
          root: host.documents.get(a.documentId)?.root || "",
        };
      }
      case "editor.onChange":
        return host.events.on("document:change", () => {
          try {
            const doc = getSnapshot();
            if (doc) return a(doc);
          } catch {
            /* Unauthorized context is not delivered. */
          }
        });
      case "editor.extensions.registerCompletionProvider":
        requireRead();
        return register("completion", {
          ...a,
          provide: (context: any) => {
            requireRead(context.root);
            return a.provide(context);
          },
        });
      case "editor.extensions.registerDecorationProvider":
        requireRead();
        return register("decoration", {
          ...a,
          provide: (context: any) => {
            requireRead(context.root);
            return a.provide(context);
          },
        });
      case "editor.extensions.registerDiagnosticProvider":
        requireRead();
        return register("diagnostic", {
          ...a,
          provide: (context: any) => {
            requireRead(context.root);
            return a.provide(context);
          },
        });
      case "ui.notify":
        return host.ui.notify(String(a).slice(0, 500));
      case "ui.prompt":
        return host.ui.prompt(String(a).slice(0, 200), b);
      case "ui.registerAction":
        if (a.when)
          throw new PluginError(
            "invalid-argument",
            "菜单显示条件请使用可序列化描述",
          );
        return host.ui.registerAction(a);
      case "ui.openWebView": {
        if (!a || typeof a.title !== 'string' || !a.title.trim() || typeof a.entry !== 'string') throw new PluginError('invalid-argument', '需要界面标题和 HTML 入口')
        const width = a.width ?? 680, height = a.height ?? 420
        if (![width,height].every(value => Number.isFinite(value) && value >= 80 && value <= 4096) || [a.x,a.y].some(value => value !== undefined && !Number.isFinite(value))) throw new PluginError('invalid-argument','界面位置或尺寸无效')
        if(a.shadow !== undefined && !['none','soft','floating'].includes(a.shadow))throw new PluginError('invalid-argument','阴影样式无效')
        webDocument(a.entry, pkg.resources || {})
        let close: () => void = () => {}
        const dispose = host.ui.openDialog({ title: a.title, width, persistent: a.persistent !== false, webview: {height,x:a.x,y:a.y,transparent:a.transparent === true,shadow:a.shadow ?? 'none'}, mount: element => mountWebView(element,a.entry,pkg.resources || {},dispatch,()=>close()) })
        close = () => { void dispose() }
        return {close}
      }
      case "ui.openDialog": {
        if (typeof a.render !== "function")
          throw new PluginError("invalid-argument", "弹窗需要 render 函数");
        let repaint: (() => void) | undefined;
        const dispose = host.ui.openDialog({
          ...a,
          mount: (element: HTMLElement) => {
            let active = true,
              generation = 0,
              clear: (() => void) | undefined;
            const paint = () => {
              const current = ++generation;
              void a
                .render(safeContext())
                .then((tree: any) => {
                  if (!active || current !== generation) return;
                  clear?.();
                  clear = mountViewTree(element, tree, pkg.styles, onFault);
                })
                .catch(onFault);
            };
            paint();
            repaint = () => {
              if (active) paint();
            };
            return () => {
              active = false;
              clear?.();
            };
          },
        });
        return {
          close: () => void dispose(),
          refresh: () => repaint?.(),
        } as const;
      }
      case "ui.sidebar.register": {
        if (
          !a ||
          typeof a.id !== "string" ||
          typeof a.title !== "string" ||
          !a.title.trim() ||
          typeof a.render !== "function" ||
          (a.defaultPlacement !== undefined && !["left-top", "left-bottom", "right-top", "right-bottom"].includes(a.defaultPlacement))
        )
          throw new PluginError("invalid-argument", "面板定义无效");
        const key = full(a.id);
        if (views.has(key))
          throw new PluginError("invalid-argument", "面板 ID 重复");
        views.set(key, a);
        const dispose = host.ui.registerView({
          id: a.id,
          title: a.title,
          multiple: a.multiple,
          mount: () => {},
          createMount: (itemId: string) => (element: HTMLElement) =>
            mountPanelView(
              a,
              itemId,
              element,
              () => safeContext() as any,
              onFault,
              pkg.styles,
            ),
        });
        return scope.track(() => {
          views.delete(key);
          return dispose();
        });
      }
      case "ui.sidebar.open": {
        const key = full(a),
          view = views.get(key);
        if (!view) throw new PluginError("not-found", "请先注册面板");
        const item = sidebarLayout.open(key, {
          groupId: b?.groupId,
          defaultPlacement: view.defaultPlacement,
          multiple: view.multiple === true && b?.newInstance === true,
          state: b?.state,
          stateVersion: view.stateVersion,
        });
        reveal(item.id);
        return itemHandle(item.id);
      }
      case "ui.sidebar.getItem":
        return sidebarLayout.state.items[a] ? itemHandle(a) : null;
      case "ui.sidebar.listItems":
        return Object.values(sidebarLayout.state.items)
          .filter((item) => views.has(item.viewId))
          .map((item) => itemHandle(item.id));
      case "ui.sidebar.listGroups":
        return sidebarLayout.state.groups.map((group) => ({
          id: group.id,
          title: groupLabel(group),
          placement: group.slot,
          itemIds: group.items.filter((id) =>
            views.has(sidebarLayout.item(id).viewId),
          ),
          activeItemId:
            group.active && views.has(sidebarLayout.item(group.active).viewId)
              ? group.active
              : null,
        }));
      case "settings.registerCategory":
        return host.ui.registerSettingsCategory(a);
      case "settings.registerControl":
        return host.ui.registerSetting(a);
      case "secrets.get":
      case "secrets.set":
      case "secrets.remove": {
        pluginGrants.require(id, 'secrets')
        if(typeof a!=='string'||!/^[a-zA-Z0-9._-]{1,120}$/.test(a)||method==='secrets.set'&&typeof b!=='string')throw new PluginError('invalid-argument','密钥名称或内容无效')
        return invoke('plugin_secret',{pluginId:id,key:a,operation:method.split('.')[1],value:method==='secrets.set'?b:null})
      }
      case "storage.get":
        return host.storage.get(a, b) ?? null;
      case "storage.set":
        if (JSON.stringify(b).length > 1024 * 1024)
          throw new PluginError("invalid-argument", "单项插件数据超过 1 MB");
        return host.storage.set(a, b);
      case "storage.remove":
        return host.storage.remove(a);
      case "clipboard.readText":
        pluginGrants.require(id, "clipboard.read");
        return host.clipboard.readText();
      case "clipboard.writeText":
        pluginGrants.require(id, "clipboard.write");
        return host.clipboard.writeText(a);
      case "network.request": {
        const url = pluginGrants.network(id, a);
        return invoke("plugin_request_scoped", {
          url: url.href,
          options: b || {},
        });
      }
      case "events.on": {
        const allowed = [
          "document:open",
          "document:change",
          "document:save",
          "workspace:change",
          "selection:change",
          "theme:change",
        ];
        if (!allowed.includes(a))
          throw new PluginError("invalid-argument", "不支持的事件");
        return host.events.on(a, (payload: any) => {
          if (a.startsWith("document:") || a === "selection:change") {
            requireRead();
            return b(payload);
          }
          if (a === "workspace:change") {
            if (hasWorkspaceRoot(host, payload.root))
              return b(payload);
            return;
          }
          return b(payload);
        });
      }
      case "events.whenReady":
        if (a === "layout") {
          await nextTick();
          return null;
        }
        if (!["app", "index"].includes(a))
          throw new PluginError("invalid-argument", "就绪阶段无效");
        if (a === "index") {
          pluginGrants.require(id, "index.read");
          requireWorkspaceRoot(host, b);
          let attempts = 0;
          while (!scope.signal.aborted && attempts++ < 200) {
            try {
              return await invoke("query_file_index", {
                root: b,
                operation: "watch",
              });
            } catch {
              await new Promise((resolve) => setTimeout(resolve, 100));
            }
          }
          throw new PluginError("not-ready", "文件索引尚未就绪");
        }
        return null;
      case "lifecycle.track":
        return scope.track(a);
      case "lifecycle.setTimeout":
        return host.setTimeout(
          () => {
            void Promise.resolve(a()).catch(onFault);
          },
          Math.max(1, Math.min(Number(b) || 1, 2147483647)),
        );
      case "lifecycle.setInterval":
        pluginGrants.require(id, "background");
        return host.setInterval(
          () => {
            void Promise.resolve(a()).catch(onFault);
          },
          Math.max(100, Math.min(Number(b) || 100, 2147483647)),
        );
      case "markdown.registerBlockRenderer":
        if (
          typeof a.language !== "string" ||
          !/^[\w-]{1,80}$/.test(a.language) ||
          typeof a.render !== "function"
        )
          throw new PluginError("invalid-argument", "块渲染器定义无效");
        return register("blocks", a);
      case "markdown.registerInlineRenderer":
        if (
          typeof a.pattern !== "string" ||
          !/^[^A-Za-z0-9\s<>]{1,8}$/.test(a.pattern) ||
          ["**", "*", "`", "$", "~~", "[", "]", "!"].includes(a.pattern) ||
          typeof a.render !== "function"
        )
          throw new PluginError("invalid-argument", "行内渲染器定义无效");
        return register("inlines", a);
      case "exports.beforeExport":
        return register("beforeExport", { id: crypto.randomUUID(), run: a });
      case "exports.transformAst":
        return register("transformAst", { id: crypto.randomUUID(), run: a });
      case "exports.registerFormat":
        if (
          !/^[a-z0-9]{1,12}$/.test(a.extension) ||
          typeof a.export !== "function" ||
          !a.title?.trim()
        )
          throw new PluginError("invalid-argument", "导出格式定义无效");
        return register("formats", a);
    }
    if (method.startsWith("files.")) {
      const key = method.slice(6);
      const allowed = [
        "list",
        "get",
        "view",
        "open",
        "readText",
        "writeText",
        "readBytes",
        "writeBytes",
        "create",
        "mkdir",
        "move",
        "rename",
        "trash",
        "readFrontmatter",
        "updateFrontmatter",
        "watch",
      ];
      if (allowed.includes(key)) return (files as any)[key](...args);
    }
    if (method.startsWith("index.")) {
      const operation = method.slice(6);
      if (
        ![
          "files",
          "changes",
          "content",
          "metadata",
          "links",
          "tagged",
          "subscribe",
        ].includes(operation)
      )
        throw new PluginError("invalid-argument", "索引操作无效");
      const root = ["subscribe", "changes"].includes(operation) ? a : a.root;
      pluginGrants.require(id, "index.read");
      requireWorkspaceRoot(host, root);
      if (operation === "subscribe") {
        const stop = await listen("markart-index-changed", (event) => {
          if ((event.payload as any)?.root === root) {
            try {
              pluginGrants.require(id, "index.read");
              requireWorkspaceRoot(host, root);
              void Promise.resolve(b(event.payload)).catch(onFault);
            } catch {
              /* Grant revoked. */
            }
          }
        });
        return scope.track(stop);
      }
      const options =
        operation === "changes" ? { cursor: b, limit: c } : { ...a };
      delete options.root;
      if (options.after != null) options.after = String(options.after);
      else delete options.after;
      return invoke("query_file_index", { ...options, root, operation });
    }
    throw new PluginError("invalid-argument", `不支持的插件接口：${method}`);
  }
  return {
    dispatch: async (method: string, args: any[]) => {
      try {
        return await dispatch(method, args);
      } catch (error) {
        if (error instanceof PluginError) throw error;
        const text = String(error);
        throw new PluginError(
          /版本|冲突|覆盖/.test(text)
            ? "stale-revision"
            : /取消/.test(text)
              ? "cancelled"
              : "invalid-argument",
          text,
        );
      }
    },
    close: () => scope.close(),
  };
}
