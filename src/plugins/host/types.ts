/** Internal host adapter types. Public plugin types are exported from ../sdk/index. */
export type IndexedFile = { id: string; path: string; version: number; size: number; text: boolean }
export type IndexPage = { cursor: string; files: IndexedFile[]; next: string | null }
export type IndexChange = { sequence: number; id: string; path: string; version: number; kind: 'upsert' | 'remove' }
export type IndexChanges = { cursor: string; changes: IndexChange[]; more: boolean }
export type IndexNotice = { root: string; cursor: string }
export type IndexMetadata = { headings: { level: number; text: string; line: number; from: number; to: number }[]; tags: { name: string; from: number | null; to: number | null }[]; properties: Record<string, unknown>; yaml: string | null; error: string | null }
export type IndexedLink = { key: number; source: string; sourcePath: string; target: string | null; targetPath: string; raw: string; line: number; from: number; to: number }
export type IndexLinks = { cursor: string; links: IndexedLink[]; next: number | null }
export type Dispose = () => void | Promise<void>
export type PluginDocument = { id: string; root?: string; path?: string; content: string }
export type PluginDocumentSnapshot = PluginDocument & { revision: number }
export type PluginTextEdit = { from: number; to: number; text: string }
export type PluginEditRequest = { documentId: string; expectedRevision: number; edits: PluginTextEdit[]; selection?: {from:number;to:number} }
export type PluginEditResult = { ok: true; document: PluginDocumentSnapshot } | { ok: false; reason: 'not-found' | 'not-active' | 'stale-revision' | 'not-editable' | 'invalid-edits' }
export type FileWatchEvent = { kind: 'create' | 'modify' | 'remove' | 'rename' | 'rescan' | 'error'; paths: string[]; message?: string }
export type FileWatchOptions = { recursive?: boolean; debounceMs?: number }
export type PluginSelection = { from: number; to: number; text: string }
export type PluginTheme = { id: string; name: string; css: string }
export type ThemeInfo = PluginTheme & { pluginId?: string }
export type PluginEvent = 'document:open' | 'document:change' | 'document:save' | 'workspace:change' | 'selection:change' | 'theme:change'
export type PluginActionLocation = 'file-tree' | 'topbar-menu' | 'tab' | 'tab-context' | 'format-toolbar' | 'slash'
export type PluginActionContext = { location?: PluginActionLocation | 'command-palette' | 'shortcut'; root: string; document: PluginDocument | null; selection: PluginSelection | null; target?: { path: string; kind: 'file' | 'folder' }; anchor?: { left: number; top: number; right: number; bottom: number } }
export type PluginCommand = { id: string; title: string; shortcut?: string; icon?: string; run: (context: PluginActionContext) => unknown | Promise<unknown> }
export type PluginViewLocation = 'settings' | 'right'
export type PluginView = { id: string; title: string; location?: PluginViewLocation; multiple?: boolean; createMount?: (itemId: string) => (element: HTMLElement) => void | Dispose; order?: number; mount: (element: HTMLElement) => void | Dispose }
export type PluginAction = { id: string; commandId: string; location: PluginActionLocation; title?: string; icon?: string; order?: number; when?: (context: PluginActionContext) => boolean }
export type PluginDialog = { webview?: { height: number; x?: number; y?: number; transparent?: boolean; shadow?: 'none' | 'soft' | 'floating' };  title: string; mode?: 'popover' | 'modal'; width?: number; persistent?: boolean; context?: PluginActionContext; mount(element: HTMLElement, context: PluginActionContext): void | Dispose }
export type BuiltinSettingsCategory = 'layout' | 'appearance' | 'startup' | 'storage' | 'sync' | 'editor' | 'templates' | 'snippets' | 'shortcuts' | 'spellcheck' | 'export' | 'plugins'
export type PluginSettingsCategory = { id: string; title: string; order?: number }
export type PluginSettingBase = { id: string; category: string; title: string; description?: string; order?: number; disabled?: boolean }
export type PluginSettingOption = { value: string | number; label: string }
export type PluginValueSetting<T> = PluginSettingBase & { getValue(): T; onChange(value: T): void | Promise<void> }
export type PluginSetting =
  | (PluginSettingBase & { type?: 'custom'; mount(element: HTMLElement): void | Dispose })
  | (PluginValueSetting<string> & { type: 'text' | 'password' | 'textarea'; placeholder?: string; maxLength?: number; rows?: number })
  | (PluginValueSetting<number> & { type: 'number'; min?: number; max?: number; step?: number })
  | (PluginValueSetting<string | number> & { type: 'select' | 'segmented'; options: PluginSettingOption[] })
  | (PluginValueSetting<boolean> & { type: 'toggle' })
  | (PluginSettingBase & { type: 'button'; buttonText: string; onClick(): void | Promise<void> })
export type ToolProvider = { id: string; title: string; description?: string; inputSchema?: Record<string, unknown>; run: (input: unknown, signal?: AbortSignal) => unknown | Promise<unknown> }
export interface PluginHost {
  readonly apiVersion: 1
  readonly signal: AbortSignal
  readonly pluginId: string
  readonly appVersion: string
  registerCommand(id: string, title: string, run: (context: PluginActionContext) => unknown | Promise<unknown>): Dispose
  commands: { register(command: PluginCommand): Dispose; execute(id: string, context?: PluginActionContext): Promise<unknown>; list(): { id: string; title: string }[] }
  editor: { getSelection(): PluginSelection; replaceRange(from: number, to: number, text: string): void; insertText(text: string): void; setSelection(from: number, to: number): void; format(command: string, value?: string): void; undo(): void; redo(): void }
  documents: { get(id: string): PluginDocumentSnapshot | null; applyEdits(request: PluginEditRequest): Promise<PluginEditResult>; active(): PluginDocument | null; list(): PluginDocument[]; open(id: string): Promise<void>; setContent(text: string): void; save(): Promise<void> }
  workspace: { root(): string }
  index: {
    files(options?: { cursor?: string; after?: string; limit?: number }): Promise<IndexPage>
    changes(cursor: string, limit?: number): Promise<IndexChanges>
    content(id: string, version: number): Promise<string | null>
    metadata(id: string, version: number): Promise<IndexMetadata>
    links(options?: { id?: string; direction?: 'incoming' | 'outgoing' | 'both'; cursor?: string; after?: number; limit?: number }): Promise<IndexLinks>
    tagged(tag: string, options?: { cursor?: string; after?: string; limit?: number }): Promise<IndexPage>
    subscribe(callback: (notice: IndexNotice) => void | Promise<void>): Promise<Dispose>
  }
  ui: { sidebar: { isOpen(): boolean; open(): void; close(): void }; notify(message: string): void; prompt(title: string, initial?: string): Promise<string | null>; registerView(view: PluginView): Dispose; registerAction(action: PluginAction): Dispose; openDialog(dialog: PluginDialog): Dispose; registerSettingsCategory(category: PluginSettingsCategory): Dispose; registerSetting(setting: PluginSetting): Dispose; addMenuItem(commandId: string): Dispose; addStyle(css: string): Dispose }
  themes: { register(theme: PluginTheme): Dispose; unregister(id: string): void; list(): ThemeInfo[]; current(): ThemeInfo; select(id: string): void }
  events: { on(event: PluginEvent, callback: (payload: unknown) => unknown): Dispose }
  storage: { dataDir(): Promise<string>; get<T>(key: string, fallback?: T): T | undefined; set(key: string, value: unknown): void; remove(key: string): void }
  clipboard: { readText(): Promise<string>; writeText(text: string): Promise<void> }
  filesystem: { watch(path: string, callback: (events: FileWatchEvent[]) => void | Promise<void>, options?: FileWatchOptions): Promise<Dispose>; readText(path: string): Promise<string>; writeText(path: string, text: string): Promise<void>; readBytes(path: string): Promise<number[]>; writeBytes(path: string, bytes: number[]): Promise<void>; list(path: string): Promise<{ name: string; path: string; directory: boolean }[]>; mkdir(path: string): Promise<void>; rename(from: string, to: string): Promise<void>; remove(path: string, recursive?: boolean): Promise<void> }
  network: { request(url: string, options?: { method?: string; headers?: Record<string, string>; body?: string }): Promise<{ status: number; headers: Record<string, string>; body: string }> }
  providers: { register(kind: 'mcp' | 'cli' | 'agent', provider: ToolProvider): Dispose; list(kind: 'mcp' | 'cli' | 'agent'): { id: string; title: string; description?: string; inputSchema?: Record<string, unknown> }[]; call(kind: 'mcp' | 'cli' | 'agent', id: string, input: unknown, signal?: AbortSignal): Promise<unknown> }
  track(dispose: Dispose): Dispose
  setTimeout(callback: () => void, milliseconds: number): Dispose
  setInterval(callback: () => void, milliseconds: number): Dispose
}
export interface MarkartPlugin { activate(host: PluginHost): void | Promise<void>; deactivate?(): void | Promise<void> }
