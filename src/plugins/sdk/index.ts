export {
  API_VERSION,
  PluginError,
  type ErrorCode,
  type Capability,
  type Json,
} from "./protocol";
import type { Capability, Json } from "./protocol";
export type Dispose = () => void | Promise<void>;
export type FileRef = {
  root: string;
  id: string;
  path: string;
  version?: number;
};
export type FileView = {
  root: string;
  /** 文件列表当前可见的文件，已应用筛选与搜索，均为工作区相对路径。 */
  files: string[];
  folders: string[];
  /** 文件树里选中的文件夹；没有选中文件夹时为当前打开的文件。 */
  selected: { path: string; kind: "file" | "folder" } | null;
  filter: { extensions: string[]; search: string; active: boolean };
};
export type Snapshot = {
  id: string;
  root: string;
  path?: string;
  revision: number;
  content: string;
};
export type IndexedFile={id:string;path:string;version:number;size:number;text:boolean}
export type IndexPage={cursor:string;files:IndexedFile[];next:string|null}
export type IndexChanges={cursor:string;changes:{sequence:number;id:string;path:string;version:number;kind:'upsert'|'remove'}[];more:boolean}
export type IndexNotice={root:string;cursor:string}
export type IndexMetadata={headings:{level:number;text:string;line:number;from:number;to:number}[];tags:{name:string;from:number|null;to:number|null}[];properties:Record<string,Json>;yaml:string|null;error:string|null}
export type IndexLinks={cursor:string;links:{key:number;source:string;sourcePath:string;target:string|null;targetPath:string;raw:string;line:number;from:number;to:number}[];next:number|null}
export type CommandContext={root:string;document:Snapshot|null;selection:{from:number;to:number;text:string}|null;location?:string;target?:{path:string;kind:'file'|'folder'};anchor?:{left:number;top:number;right:number;bottom:number}}
export type TextEdit = { from: number; to: number; text: string };
export type SidebarContext = {
  itemId: string;
  root: string;
  file: Snapshot | null;
  visible: boolean;
  width: number;
  height: number;
  state: Json;
  signal?: AbortSignal;
};
export type UiNode = {
  tag?: string;
  text?: string;
  attrs?: Record<string, string | number | boolean>;
  children?: UiNode[];
  on?: {
    click?: (event: { value?: string; checked?: boolean }) => unknown;
    change?: (event: { value?: string; checked?: boolean }) => unknown;
  };
};
export type SidebarPlacement = "left-top" | "left-bottom" | "right-top" | "right-bottom";
/** 弹窗句柄：close 关闭弹窗；refresh 用最新状态重画内容（persistent 弹窗更新回复用）。 */
export type DialogHandle = {
  close(): Promise<void> | void;
  refresh(): void;
};
export type View = {
  id: string;
  title: string;
  multiple?: boolean;
  defaultPlacement?: SidebarPlacement;
  stateVersion?: number;
  render(context: SidebarContext): UiNode | Promise<UiNode>;
  onOpen?(context: SidebarContext): void | Promise<void>;
  onClose?(): void | Promise<void>;
  onShow?(): void | Promise<void>;
  onHide?(): void | Promise<void>;
  onResize?(size: { width: number; height: number }): void | Promise<void>;
  onContextChange?(context: SidebarContext): void | Promise<void>;
  getState?(): Json | Promise<Json>;
  setState?(state: Json): void | Promise<void>;
  migrateState?(state: Json, fromVersion: number): Json | Promise<Json>;
};
export type SidebarItem = {
  id: string;
  viewId: string;
  getInfo(): Promise<{
    groupId: string;
    state: Json;
    root: string | null;
    pinned: boolean;
  }>;
  reveal(): Promise<void>;
  moveTo(groupId: string): Promise<void>;
  close(): Promise<void>;
  refresh(): Promise<void>;
  setState(state: Json): Promise<void>;
};
export type SidebarGroup = {
  id: string;
  placement: SidebarPlacement;
  title: string;
  itemIds: string[];
  activeItemId: string | null;
};
export type EditorContext = Snapshot & {
  selection: { from: number; to: number; text: string };
  mode: "wysiwyg" | "source" | "split";
  composing: boolean;
  signal?: AbortSignal;
};
export type Completion = {
  label: string;
  detail?: string;
  insertText: string;
  from: number;
  to: number;
};
export type Decoration = {
  from: number;
  to: number;
  kind: "highlight" | "underline" | "muted" | "strong";
  title?: string;
};
export type Diagnostic = {
  from: number;
  to: number;
  severity: "info" | "warning" | "error";
  message: string;
  fix?: { title: string; edits: TextEdit[] };
};
export interface PluginAPI {
  /** @deprecated 权限由 manifest 声明，启用时自动提供；无需调用。 */
  permissions: { request(): Promise<boolean> };
  app: {
    version(): Promise<string>;
    apiVersion(): Promise<2>;
    supports(capability: Capability): Promise<boolean>;
  };
  commands: {
    register(command: {
      id: string;
      title: string;
      shortcut?: string;
      icon?: string;
      run(context: CommandContext): unknown;
    }): Promise<Dispose>;
    execute(id: string): Promise<unknown>;
    list(): Promise<{ id: string; title: string }[]>;
  };
  editor: {
    getSnapshot(): Promise<Snapshot | null>;
    getSelection(): Promise<{ from: number; to: number; text: string }>;
    setSelection(from: number, to: number): Promise<void>;
    getCursor(): Promise<number>;
    setCursor(position: number): Promise<void>;
    getMode(): Promise<EditorContext["mode"]>;
    applyEdits(request: {
      documentId: string;
      expectedRevision: number;
      edits: TextEdit[];
    }): Promise<Snapshot>;
    transaction(request: {
      documentId: string;
      expectedRevision: number;
      edits: TextEdit[];
      selection?: { from: number; to: number };
    }): Promise<Snapshot>;
    onChange(callback: (snapshot: Snapshot) => void): Promise<Dispose>;
    extensions: {
      registerCompletionProvider(provider: {
        id: string;
        provide(context: EditorContext): Completion[] | Promise<Completion[]>;
      }): Promise<Dispose>;
      registerDecorationProvider(provider: {
        id: string;
        provide(context: EditorContext): Decoration[] | Promise<Decoration[]>;
      }): Promise<Dispose>;
      registerDiagnosticProvider(provider: {
        id: string;
        provide(context: EditorContext): Diagnostic[] | Promise<Diagnostic[]>;
      }): Promise<Dispose>;
    };
  };
  files: {
    list(root: string): Promise<FileRef[]>;
    /** 用户当前的选择与筛选结果，只读；与文件列表所见一致，需 `files.read`。 */
    view(): Promise<FileView>;
    get(root: string, id: string): Promise<FileRef | null>;
    open(file: FileRef): Promise<void>;
    readText(file: FileRef): Promise<string>;
    writeText(
      file: FileRef,
      text: string,
      expectedVersion: string | number,
    ): Promise<void>;
    readBytes(file: FileRef): Promise<number[]>;
    writeBytes(
      file: FileRef,
      bytes: number[],
      expectedVersion: string | number,
    ): Promise<void>;
    create(root: string, path: string, text?: string): Promise<FileRef>;
    mkdir(root: string, path: string): Promise<void>;
    move(file: FileRef, path: string): Promise<void>;
    rename(file: FileRef, name: string): Promise<void>;
    trash(file: FileRef): Promise<void>;
    readFrontmatter(file: FileRef): Promise<Record<string, Json>>;
    updateFrontmatter(
      file: FileRef,
      properties: Record<string, Json>,
      expectedVersion: string | number,
    ): Promise<void>;
    watch(root: string, callback: (event: Json) => void): Promise<Dispose>;
  };
  index: {
    files(options:{root:string;cursor?:string;after?:string;limit?:number}):Promise<IndexPage>
    changes(root:string,cursor:string,limit?:number):Promise<IndexChanges>
    content(options:{root:string;id:string;version:number}):Promise<string|null>
    metadata(options:{root:string;id:string;version:number}):Promise<IndexMetadata>
    links(options:{root:string;id?:string;direction?:'incoming'|'outgoing'|'both';cursor?:string;after?:number;limit?:number}):Promise<IndexLinks>
    tagged(options:{root:string;tag:string;cursor?:string;after?:string;limit?:number}):Promise<IndexPage>
    subscribe(root:string,callback:(event:IndexNotice)=>void):Promise<Dispose>
  };
  ui: {
    notify(message: string): Promise<void>;
    prompt(title: string, initial?: string): Promise<string | null>;
    registerAction(action: {
      id: string;
      commandId: string;
      location:
        | "file-tree"
        | "topbar-menu"
        | "tab"
        | "tab-context"
        | "format-toolbar"
        | "slash";
      title?: string;
      icon?: string;
      order?: number;
    }): Promise<Dispose>;
    openWebView(options: { title: string; entry: string; width?: number; height?: number; x?: number; y?: number; transparent?: boolean; persistent?: boolean; shadow?: "none" | "soft" | "floating" }): Promise<{ close(): Promise<void> }>;
    openDialog(dialog: {
      title: string;
      mode?: "modal" | "popover";
      width?: number;
      /** 为 true 时点击弹窗外部（如正文）不会关闭，只能通过句柄 close 或右上角按钮关闭。 */
      persistent?: boolean;
      render(context: Json): UiNode | Promise<UiNode>;
    }): Promise<DialogHandle>;
    sidebar: {
      register(view: View): Promise<Dispose>;
      open(
        viewId: string,
        options?: { groupId?: string; newInstance?: boolean; state?: Json },
      ): Promise<SidebarItem>;
      getItem(id: string): Promise<SidebarItem | null>;
      listItems(): Promise<SidebarItem[]>;
      listGroups(): Promise<SidebarGroup[]>;
    };
  };
  settings: {
    registerCategory(category: {
      id: string;
      title: string;
      order?: number;
    }): Promise<Dispose>;
    registerControl(control: {
      id: string;
      category: string;
      title: string;
      type:
        | "text"
        | "password"
        | "textarea"
        | "number"
        | "select"
        | "segmented"
        | "toggle"
        | "button";
      description?: string;
      options?: { value: string | number; label: string }[];
      getValue?(): unknown;
      onChange?(value: unknown): unknown;
      onClick?(): unknown;
      buttonText?: string;
      min?: number;
      max?: number;
      step?: number;
    }): Promise<Dispose>;
  };
  clipboard: {
    readText(): Promise<string>;
    writeText(text: string): Promise<void>;
  };
  network: {
    request(
      url: string,
      options?: {
        method?: string;
        headers?: Record<string, string>;
        body?: string;
      },
    ): Promise<{
      status: number;
      headers: Record<string, string>;
      body: string;
    }>;
  };
  secrets: { get(key: string): Promise<string | null>; set(key: string, value: string): Promise<void>; remove(key: string): Promise<void> };
  storage: {
    get<T extends Json>(key: string, fallback?: T): Promise<T | null>;
    set(key: string, value: Json): Promise<void>;
    remove(key: string): Promise<void>;
  };
  events: {
    on(event: string, callback: (event: Json) => unknown): Promise<Dispose>;
    whenReady(stage: "app" | "layout" | "index", root?: string): Promise<void>;
  };
  lifecycle: {
    readonly signal: AbortSignal;
    track(dispose: Dispose): Promise<Dispose>;
    setTimeout(callback: () => unknown, milliseconds: number): Promise<Dispose>;
    setInterval(
      callback: () => unknown,
      milliseconds: number,
    ): Promise<Dispose>;
  };
  markdown: {
    registerBlockRenderer(renderer: {
      id: string;
      language: string;
      render(context: {
        text: string;
        language: string;
        root: string;
        source: string;
      }): UiNode | Promise<UiNode>;
    }): Promise<Dispose>;
    registerInlineRenderer(renderer: {
      id: string;
      pattern: string;
      render(context: {
        text: string;
        root: string;
        source: string;
      }): UiNode | Promise<UiNode>;
    }): Promise<Dispose>;
  };
  exports: {
    beforeExport(
      hook: (snapshot: Json) => boolean | Promise<boolean>,
    ): Promise<Dispose>;
    transformAst(hook: (ast: Json) => Json | Promise<Json>): Promise<Dispose>;
    registerFormat(format: {
      id: string;
      title: string;
      extension: string;
      export(snapshot: Json): string | number[] | Promise<string | number[]>;
      preview?(snapshot: Json): UiNode | Promise<UiNode>;
    }): Promise<Dispose>;
  };
}
export interface MarkartPlugin {
  activate(api: PluginAPI): void | Promise<void>;
  deactivate?(): void | Promise<void>;
}
