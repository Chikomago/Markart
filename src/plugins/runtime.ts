import { initializePluginPermissions } from './permissions/declaration'
import { pluginGrants } from './permissions/grants'
import { pluginSidebar } from './sidebarState'
import { pluginShortcutChord } from './shortcuts'
import { eventChord, shortcutConflict, type ShortcutOverrides, type ShortcutId } from '../settings/shortcuts'
import { t } from '../i18n'
import { validateSettingControl } from './settingControls'
import type { PluginSettingsCategory, PluginSetting, PluginAction, PluginActionContext, PluginDialog } from './host/types'
import { version as appVersion } from '../../package.json'
import { DEFAULT_THEME } from '../settings/defaults'
import { shallowReactive } from 'vue'
import { invoke } from '@tauri-apps/api/core'
import { listen } from '@tauri-apps/api/event'
import { pluginKey, savedPlugins, type DownloadedPlugin } from './community'
import type { Dispose, PluginCommand, PluginDocument, PluginEvent, PluginHost, PluginSelection, PluginView, ToolProvider, MarkartPlugin, ThemeInfo, FileWatchEvent, PluginDocumentSnapshot, PluginEditRequest, PluginEditResult, PluginTextEdit, IndexNotice } from './host/types'
import type { FileView } from './sdk/index'
export type PluginAdapter = {
  mode?(): 'wysiwyg' | 'source' | 'split'
  openSidebar?(): void
  openFile?(root: string, path: string): Promise<void>
  openedFile?(root: string, path: string): {id:string;content:string;revision:number;active:boolean}|null
  fileOperation?(operation:string,root:string,path:string,value?:unknown):Promise<unknown>
  fileView?():Omit<FileView,'root'>
  active(): PluginDocument | null; list(): PluginDocument[]; open(id: string): Promise<void>; save(): Promise<void>
  applyEdits?(documentId: string, expectedContent: string, edits: PluginTextEdit[], selection?: {from:number;to:number}): true | 'stale-revision' | 'not-editable' | 'not-active'
  selection(): PluginSelection; replace(from: number, to: number, text: string): void; select(from: number, to: number): void
  format(command: string, value?: string): void; undo(): void; redo(): void; root(): string
  listThemes?(): ThemeInfo[]; currentTheme?(): string; selectTheme?(id: string): void
  shortcutOverrides?(): ShortcutOverrides; notify(message: string): void; prompt(title: string, initial?: string): Promise<string | null>
}
type Owned<T> = T & { owner: string }
type ProviderKind = 'mcp' | 'cli' | 'agent'
type Session = { controller: AbortController; cleanups: Dispose[]; module?: MarkartPlugin; closed: boolean }
const enabledKey = 'markart-enabled-plugins-v2'
const enabledSourcesKey = 'markart-enabled-plugin-sources-v2'
const errorsKey = 'markart-plugin-errors-v2'
/** Restores the exact package that was enabled when several catalogs share one plugin id. */
export function selectRestorablePlugins(packages: DownloadedPlugin[], wanted: string[], sources: Record<string, string>) {
  const selected = new Set<string>(), result: DownloadedPlugin[] = []
  for (const pkg of packages) {
    const id = pkg.manifest.id
    if (!wanted.includes(id) || selected.has(id)) continue
    if (sources[id] && sources[id] !== (pkg.key || pluginKey(pkg))) continue
    selected.add(id); result.push(pkg)
  }
  return result
}
export class PluginRuntime {
  state = shallowReactive({ enabled: [] as string[], busy: [] as string[], sources: {} as Record<string, string>, errors: {} as Record<string, string>, shortcutOverrides: {} as Record<string, string>, commands: [] as Owned<PluginCommand>[], settingsCategories: [] as Owned<PluginSettingsCategory>[], settings: [] as Owned<PluginSetting>[], actions: [] as Owned<PluginAction>[], dialogs: [] as Owned<PluginDialog & { id: string; context: PluginActionContext }>[], views: [] as Owned<PluginView>[], pluginNames: {} as Record<string, string>, themes: [] as ThemeInfo[], providers: [] as Owned<ToolProvider & { kind: ProviderKind }>[] })
  private adapter: PluginAdapter | null = null
  private revisions = new Map<string, PluginDocumentSnapshot>()
  private revision = 0
  private snapshot(doc: PluginDocument): PluginDocumentSnapshot {
    const previous = this.revisions.get(doc.id)
    const revision = previous && previous.content === doc.content ? previous.revision : ++this.revision
    const result = { ...doc, revision }
    this.revisions.set(doc.id, result)
    return { ...result }
  }
  async applyExternalEdits(request: PluginEditRequest) { return this.applyEdits(request) }
  documentSnapshot(id: string) { return this.adapter ? this.document(id) : null }
  private document(id: string): PluginDocumentSnapshot | null {
    const app = this.app(), active = app.active()
    const doc = active?.id === id ? active : app.list().find(item => item.id === id)
    return doc ? this.snapshot(doc) : null
  }
  private applyEdits(request: PluginEditRequest): PluginEditResult {
    const doc = this.document(request.documentId)
    if (!doc) return { ok: false, reason: 'not-found' }
    if (request.expectedRevision !== doc.revision) return { ok: false, reason: 'stale-revision' }
    if (!Array.isArray(request.edits) || !request.edits.length || request.edits.some(edit => !edit || !Number.isInteger(edit.from) || !Number.isInteger(edit.to))) return { ok: false, reason: 'invalid-edits' }
    const edits = [...request.edits].sort((a, b) => a.from - b.from || a.to - b.to)
    let end = -1
    for (const edit of edits) {
      if (!Number.isInteger(edit.from) || !Number.isInteger(edit.to) || edit.from < 0 || edit.to < edit.from || edit.to > doc.content.length || typeof edit.text !== 'string' || edit.from <= end) return { ok: false, reason: 'invalid-edits' }
      end = edit.to === edit.from ? edit.to : edit.to - 1
    }
    if (request.selection) {
      const length=doc.content.length+edits.reduce((total,edit)=>total+edit.text.length-(edit.to-edit.from),0)
      const {from,to}=request.selection
      if(!Number.isInteger(from)||!Number.isInteger(to)||from<0||to<from||to>length)return {ok:false,reason:'invalid-edits'}
    }
    const applied = this.app().applyEdits?.(doc.id, doc.content, edits, request.selection) ?? 'not-editable'
    if (applied !== true) return { ok: false, reason: applied }
    return { ok: true, document: this.document(doc.id)! }
  }
  private sessions = new Map<string, Session>()
  private listeners = new Map<PluginEvent, Set<(payload: unknown) => unknown>>()
  constructor(private loader?: (source: string) => Promise<MarkartPlugin>) {
    try {const errors=JSON.parse(localStorage.getItem(errorsKey)||'{}');if(errors&&typeof errors==='object')this.state.errors=Object.fromEntries(Object.entries(errors).filter((entry):entry is [string,string]=>typeof entry[1]==='string'))}catch{/* No previous faults. */}
    try { const data = JSON.parse(localStorage.getItem('markart-plugin-shortcuts-v1') || '{}'); if (data && typeof data === 'object' && !Array.isArray(data)) this.state.shortcutOverrides = Object.fromEntries(Object.entries(data).filter((entry): entry is [string, string] => typeof entry[1] === 'string')) } catch { /* No saved overrides. */ }
  }
  assignedShortcut(id: string) { return this.state.shortcutOverrides[id] ?? pluginShortcutChord(this.state.commands.find(command => command.id === id)?.shortcut || '') }
  shortcutError(id: string, chord: string) {
    if (!chord) return null
    if (/^(?:Meta|Control)\+(?:Shift\+)?Key[ACVXYZ]$/.test(chord)) return '此快捷键用于基础编辑操作'
    const builtin = shortcutConflict(id as ShortcutId, chord, this.adapter?.shortcutOverrides?.() || {})
    if (builtin) return builtin
    const duplicate = this.state.commands.find(command => command.id !== id && this.assignedShortcut(command.id) === chord)
    return duplicate ? `与「${duplicate.title}」冲突` : null
  }
  setShortcut(id: string, chord: string) {
    if (!this.state.commands.some(command => command.id === id)) throw new Error('命令不存在')
    const error = this.shortcutError(id, chord); if (error) throw new Error(error)
    const next = { ...this.state.shortcutOverrides, [id]: chord }
    localStorage.setItem('markart-plugin-shortcuts-v1', JSON.stringify(next)); this.state.shortcutOverrides = next
  }
  bind(adapter: PluginAdapter) { this.adapter = adapter; return () => { if (this.adapter === adapter) this.adapter = null } }
  activeRoot() { return this.adapter?.root() || '' }
  private app() { if (!this.adapter) throw new Error('编辑器尚未就绪，请打开文件后操作'); return this.adapter }
  private report(error: unknown) { this.adapter?.notify(t('插件错误：{0}', { "0": String(error) })) }
  emit(event: PluginEvent, payload: unknown) { if ((event === 'document:open' || event === 'document:change') && payload && typeof (payload as PluginDocument).id === 'string' && typeof (payload as PluginDocument).content === 'string') this.snapshot(payload as PluginDocument); for (const listener of this.listeners.get(event) || []) { try { Promise.resolve(listener(payload)).catch(error => this.report(error)) } catch (error) { this.report(error) } } }
  private persist() { localStorage.setItem(enabledKey, JSON.stringify(this.state.enabled));localStorage.setItem(enabledSourcesKey,JSON.stringify(this.state.sources));localStorage.setItem(errorsKey,JSON.stringify(this.state.errors)) }
  async restore() {
    let wanted: string[] = [], sources: Record<string, string> = {}
    try { const value: unknown = JSON.parse(localStorage.getItem(enabledKey) || '[]'); if (Array.isArray(value)) wanted = value.filter(id => typeof id === 'string') } catch { /* Invalid enabled list is ignored. */ }
    try { const value: unknown = JSON.parse(localStorage.getItem(enabledSourcesKey) || '{}'); if (value && typeof value === 'object' && !Array.isArray(value)) sources = Object.fromEntries(Object.entries(value).filter((entry): entry is [string, string] => typeof entry[1] === 'string')) } catch { /* Legacy installs have no saved package source. */ }
    for (const pkg of selectRestorablePlugins(await savedPlugins(), wanted, sources)) { try { await this.enable(pkg) } catch (error) { this.report(error) } }
  }
  async enable(pkg: DownloadedPlugin) {
    const id = pkg.manifest.id, source = pkg.key || pluginKey(pkg)
    this.state.pluginNames = { ...this.state.pluginNames, [id]: pkg.manifest.name || id }
    if (this.sessions.has(id) || this.state.busy.includes(id)) {
      // The same id may be installed from several catalogs; only one package can own the id at a time.
      if (this.sessions.has(id) && this.state.sources[id] !== source) throw new Error('同一 ID 的插件已从另一个目录启用，请先停用它')
      return
    }
    this.app(); this.state.busy = [...this.state.busy, id]
    const session: Session = { controller: new AbortController(), cleanups: [], closed: false }; this.sessions.set(id, session); this.state.sources = { ...this.state.sources, [id]: source }
    try {
      const host = this.host(id, session)
      if (this.loader) {
        session.module = await this.loader(pkg.main)
      } else {
        if (pkg.manifest.apiVersion !== 2) throw new Error('此插件需要按 API v2 重新构建')
        if(pkg.manifest.minAppVersion && pkg.manifest.minAppVersion.split('.').reduce((result,part,index)=>result||Number(part)-Number(appVersion.split('.')[index]||0),0)>0)throw new Error('此插件需要更新版本的 Markart')
        initializePluginPermissions(pkg,session.controller.signal)
        const { isolatedPlugin } = await import('./runtime/isolated')
        session.module = isolatedPlugin(pkg, host, this.app(), error => {
          console.error('Plugin runtime', {pluginId:id,error})
          this.state.errors = { ...this.state.errors, [id]: String(error) }
          if (!session.closed) void this.cleanup(id, session).then(() => this.persist())
        })
      }
      if (session.closed) throw new Error('插件加载已取消')
      if (typeof session.module.activate !== 'function') throw new Error('插件需导出 activate(api)')
      await session.module.activate(host)
      if (session.closed) throw new Error('插件加载已取消')
      this.state.enabled = [...this.state.enabled, id]; this.persist(); this.state.errors = { ...this.state.errors, [id]: '' }
    } catch (error) {
      this.state.errors = { ...this.state.errors, [id]: String(error) }
      await this.cleanup(id, session); throw error
    } finally { this.state.busy = this.state.busy.filter(item => item !== id) }
  }
  private async cleanup(id: string, session: Session) {
    if (session.closed) return
    session.closed = true; session.controller.abort()
    try { await session.module?.deactivate?.() } catch (error) { this.report(error) }
    for (const dispose of session.cleanups.reverse()) { try { await dispose() } catch (error) { this.report(error) } }
    pluginGrants.revoke(id)
    this.sessions.delete(id); this.state.enabled = this.state.enabled.filter(item => item !== id)
    const sources = { ...this.state.sources }; delete sources[id]; this.state.sources = sources
  }
  async disable(id: string) {
    if (this.state.busy.includes(id)) throw new Error('插件正在加载，请稍后操作')
    const session = this.sessions.get(id); if (!session) return
    this.state.busy = [...this.state.busy, id]
    try { await this.cleanup(id, session); this.persist() } finally { this.state.busy = this.state.busy.filter(item => item !== id) }
  }
  async dispose() { for (const [id, session] of this.sessions) await this.cleanup(id, session); this.adapter = null }
  context(patch: { location?: PluginActionContext['location']; documentId?: string; target?: PluginActionContext['target']; anchor?: PluginActionContext['anchor'] } = {}): PluginActionContext {
    const active = this.adapter?.active() || null
    const doc = patch.documentId ? this.adapter?.list().find(item => item.id === patch.documentId) || null : patch.target ? this.adapter?.list().find(item => item.path === patch.target?.path) || null : active
    let selection = null
    if (doc && doc.id === active?.id) { try { selection = this.adapter?.selection() || null } catch { /* No editable view. */ } }
    return { root: this.adapter?.root() || '', document: doc ? { ...doc } : null, selection: selection ? { ...selection } : null, location: patch.location, target: patch.target ? { ...patch.target, kind: doc ? 'file' : 'folder' } : undefined, anchor: patch.anchor ? { ...patch.anchor } : undefined }
  }
  async execute(id: string, context = this.context()) { const command = this.state.commands.find(item => item.id === id); if (!command) throw new Error(`命令不存在：${id}`); return command.run(context) }
  actionsAt(location: PluginAction['location'], context: PluginActionContext) {
    return this.state.actions.filter(item => item.location === location && this.state.commands.some(command => command.id === item.commandId) && (() => { try { return !item.when || item.when(context) } catch { return false } })()).slice().sort((a, b) => (a.order || 0) - (b.order || 0))
  }
  async runAction(action: PluginAction, context: PluginActionContext) { try { await this.execute(action.commandId, context) } catch (error) { this.report(error) } }
  closeDialog(id: string) { this.state.dialogs = this.state.dialogs.filter(item => item.id !== id) }

  private host(id: string, session: Session): PluginHost {
    const alive = () => { if (session.closed) throw new Error('插件已停用') }
    const track = (dispose: Dispose): Dispose => {
      alive(); let done = false
      const once = () => { if (done) return; done = true; return dispose() }; session.cleanups.push(once); return once
    }
    const fullId = (value: string) => { if (!value.trim()) throw new Error('扩展 ID 不能为空'); return value.startsWith(id + ':') ? value : `${id}:${value}` }
    const registerCommand = (command: PluginCommand): Dispose => {
      alive(); const key = fullId(command.id)
      if (!command.title?.trim() || typeof command.run !== 'function' || command.shortcut !== undefined && typeof command.shortcut !== 'string') throw new Error('命令名称、快捷键或回调无效')
      if (this.state.commands.some(item => item.id === key)) throw new Error('命令 ID 重复')
      const item = { ...command, id: key, owner: id, run: (context: PluginActionContext) => { alive(); return command.run(context) } }
      this.state.commands = [...this.state.commands, item]
      if (typeof window !== 'undefined') {
        const handler = (event: KeyboardEvent) => {
          const chord = this.assignedShortcut(key)
          if (!event.defaultPrevented && !event.isComposing && chord && eventChord(event) === chord && !this.shortcutError(key, chord)) { event.preventDefault(); Promise.resolve(item.run(this.context({ location: 'shortcut' }))).catch(error => this.report(error)) }
        }
        window.addEventListener('keydown', handler); track(() => window.removeEventListener('keydown', handler))
      }
      return track(() => { this.state.commands = this.state.commands.filter(value => value !== item) })
    }
    const native = <T>(operation: string, payload: Record<string, unknown>) => { alive(); return invoke<T>('plugin_native', { operation, payload }) }
    const readSelection = () => { alive(); return this.app().selection() }
    const replace = (from: number, to: number, text: string) => {
      alive(); const doc = this.app().active(); if (!doc || !Number.isInteger(from) || !Number.isInteger(to) || from < 0 || to < from || to > doc.content.length) throw new Error('文件编辑范围无效')
      this.app().replace(from, to, text)
    }
    const storageAlive = () => { if (this.sessions.get(id) !== session) throw new Error('插件已停用') }
    const storageKey = (key: string) => `markart-plugin:${id}:${key}`
    const registerAction = (input: PluginAction): Dispose => {
      // Existing API v1 plugins also enter the menu; icons are now user-pinned only.
      const action: PluginAction = { ...input, location: (input.location as string) === 'topbar' ? 'topbar-menu' : input.location }
      alive(); const key = fullId(action.id)
      if (action.when !== undefined && typeof action.when !== 'function') throw new Error('操作项条件需要函数')
      if (!['file-tree', 'topbar-menu', 'tab', 'tab-context', 'format-toolbar', 'slash'].includes(action.location) || (action.order !== undefined && !Number.isFinite(action.order))) throw new Error('扩展入口或排序无效')
      if (this.state.actions.some(item => item.id === key)) throw new Error('操作项 ID 重复')
      const commandId = fullId(action.commandId)
      if (!this.state.commands.some(item => item.id === commandId && item.owner === id)) throw new Error('请先注册本插件的命令')
      const item = { ...action, id: key, commandId, owner: id }
      this.state.actions = [...this.state.actions, item]
      return track(() => { this.state.actions = this.state.actions.filter(value => value !== item) })
    }
    const themeDisposers = new Map<string, Dispose>()
    const queryIndex = async <T>(operation: string, options: Record<string, unknown> = {}): Promise<T> => {
      alive()
      const root = this.app().root()
      const result = await invoke<T>('query_file_index', { root, operation, ...options })
      alive()
      if (this.app().root() !== root) throw new Error('workspace-changed')
      return result
    }
    const host: PluginHost = {
      apiVersion: 1, signal: session.controller.signal, pluginId: id, appVersion, track,
      registerCommand: (key, title, run) => registerCommand({ id: key, title, run }),
      commands: { register: registerCommand, execute: (key, context) => { alive(); return this.execute(key.includes(':') ? key : fullId(key), context) }, list: () => this.state.commands.map(({ id, title }) => ({ id, title })) },
      editor: { getSelection: readSelection, replaceRange: replace, insertText: text => { const selection = readSelection(); replace(selection.from, selection.to, text) }, setSelection: (from, to) => { alive(); this.app().select(from, to) }, format: (command, value) => { alive(); this.app().format(command, value) }, undo: () => { alive(); this.app().undo() }, redo: () => { alive(); this.app().redo() } },
      documents: { get: key => { alive(); return this.document(key) }, applyEdits: async request => { alive(); return this.applyEdits(request) }, active: () => { alive(); return this.app().active() }, list: () => { alive(); return this.app().list() }, open: async key => { alive(); await this.app().open(key) }, setContent: text => { const doc = this.app().active(); if (!doc) throw new Error('请先打开文件'); replace(0, doc.content.length, text) }, save: async () => { alive(); await this.app().save() } },
      index: {
        files: (options = {}) => queryIndex('files', options),
        changes: (cursor, limit) => queryIndex('changes', { cursor, limit }),
        content: (id, version) => queryIndex('content', { id, version }),
        metadata: (id, version) => queryIndex('metadata', { id, version }),
        links: (options = {}) => queryIndex('links', { ...options, after: options.after === undefined ? undefined : String(options.after) }),
        tagged: (tag, options = {}) => queryIndex('tagged', { ...options, tag }),
        subscribe: async callback => {
          alive()
          if (typeof callback !== 'function') throw new Error('invalid-index-callback')
          const root = this.app().root()
          let stopped = false, running = false, last = '', pending: IndexNotice | undefined
          let offNative: (() => void) | undefined, offWorkspace: Dispose | undefined
          const stop = track(() => { stopped = true; pending = undefined; offNative?.(); offWorkspace?.() })
          const drain = async () => {
            if (running) return
            running = true
            try {
              while (pending && !stopped && !session.closed) {
                const notice = pending; pending = undefined
                if (this.app().root() !== root) { stop(); break }
                try { await callback(notice) } catch (error) { this.report(error) }
              }
            } finally { running = false }
          }
          const deliver = (notice: IndexNotice) => {
            if (stopped || session.closed) return
            if (this.app().root() !== root) { stop(); return }
            if (notice?.root !== root || typeof notice.cursor !== 'string' || notice.cursor === last) return
            const split = (cursor: string) => cursor.split(':')
            const [epoch, sequence] = split(notice.cursor), [previous, number] = split(last)
            if (epoch === previous && Number(sequence) <= Number(number)) return
            last = notice.cursor; pending = notice; void drain()
          }
          offWorkspace = host.events.on('workspace:change', () => { stop() })
          try {
            const off = await listen<IndexNotice>('markart-index-changed', event => deliver(event.payload))
            if (stopped || session.closed) { off(); return stop }
            offNative = off
            const initial = await queryIndex<IndexNotice>('watch')
            if (!last) deliver(initial)
            return stop
          } catch (error) { stop(); throw error }
        },
      },
      workspace: { root: () => { alive(); return this.app().root() } },
      ui: {
        sidebar: { isOpen: () => { alive(); return pluginSidebar.state.open }, open: () => { alive(); pluginSidebar.setOpen(true) }, close: () => { alive(); pluginSidebar.setOpen(false) } }, notify: message => { alive(); this.app().notify(message) }, prompt: (title, initial) => { alive(); return this.app().prompt(title, initial) },
        registerView: view => { alive(); const key = fullId(view.id); if (this.state.views.some(item => item.id === key)) throw new Error('视图 ID 重复'); if (view.location && !['settings', 'right'].includes(view.location)) throw new Error('视图位置无效'); if (!view.title?.trim() || typeof view.mount !== 'function' || view.order !== undefined && !Number.isFinite(view.order)) throw new Error('视图名称、挂载函数或排序无效'); const item = { ...view, location: view.location || 'right' as const, id: key, owner: id }; this.state.views = [...this.state.views, item]; return track(() => { this.state.views = this.state.views.filter(value => value !== item) }) },
        registerAction,
        openDialog: dialog => {
          alive(); if (!dialog.title?.trim() || typeof dialog.mount !== 'function' || dialog.mode && !['modal', 'popover'].includes(dialog.mode) || dialog.width !== undefined && (!Number.isFinite(dialog.width) || dialog.width < (dialog.webview ? 80 : 240) || dialog.width > (dialog.webview ? 4096 : 800)) || dialog.persistent !== undefined && typeof dialog.persistent !== 'boolean') throw new Error('弹窗标题、尺寸或挂载函数无效')
          const item = { ...dialog, id: fullId(crypto.randomUUID()), owner: id, context: dialog.context || this.context() }
          this.state.dialogs = [...this.state.dialogs, item]
          return track(() => this.closeDialog(item.id))
        },
        registerSettingsCategory: category => {
          alive(); const key = fullId(category.id)
          if (!category.title?.trim() || (category.order !== undefined && !Number.isFinite(category.order))) throw new Error('设置分类名称或排序无效')
          if (this.state.settingsCategories.some(item => item.id === key)) throw new Error('设置分类 ID 重复')
          const item = { ...category, id: key, owner: id }
          this.state.settingsCategories = [...this.state.settingsCategories, item]
          return track(() => { this.state.settingsCategories = this.state.settingsCategories.filter(value => value !== item); this.state.settings = this.state.settings.filter(value => value.category !== key) })
        },
        registerSetting: setting => {
          alive(); const key = fullId(setting.id)
          const builtin = ['layout', 'appearance', 'startup', 'storage', 'sync', 'editor', 'templates', 'snippets', 'shortcuts', 'spellcheck', 'export', 'plugins']
          const category = builtin.includes(setting.category) ? setting.category : fullId(setting.category)
          if (!builtin.includes(category) && !this.state.settingsCategories.some(item => item.id === category && item.owner === id)) throw new Error('请先注册本插件的设置分类')
          if (!setting.title?.trim() || (setting.order !== undefined && !Number.isFinite(setting.order))) throw new Error('设置项名称、挂载函数或排序无效')
          if (this.state.settings.some(item => item.id === key)) throw new Error('设置项 ID 重复')
          validateSettingControl(setting)
          const item = { ...setting, category, id: key, owner: id }
          this.state.settings = [...this.state.settings, item]
          return track(() => { this.state.settings = this.state.settings.filter(value => value !== item) })
        },
        addMenuItem: commandId => registerAction({ id: `menu:${commandId}`, commandId, location: 'topbar-menu' }),
        addStyle: css => { alive(); const style = document.createElement('style'); style.dataset.markartPlugin = id; style.textContent = css; document.head.append(style); return track(() => style.remove()) } },
      themes: {
        register: theme => {
          alive(); const key = fullId(theme.id)
          if (!theme.name?.trim() || theme.name.length > 80 || key.length > 80 || typeof theme.css !== 'string' || theme.css.length > 100000) throw new Error('主题 ID、名称或 CSS 无效（ID/名称上限 80 字符，CSS 上限 100000 字符）')
          if (/@import\b|url\s*\(|image-set\s*\(|expression\s*\(/i.test(theme.css)) throw new Error('主题 CSS 不支持加载外部资源')
          if ([...this.state.themes, ...(this.app().listThemes?.() || [])].some(item => item.id === key)) throw new Error('主题 ID 重复')
          const item: ThemeInfo = { id: key, name: theme.name.trim(), css: theme.css, pluginId: id }
          this.state.themes = [...this.state.themes, item]
          const remove = track(() => {
            themeDisposers.delete(key)
            if (this.adapter?.currentTheme?.() === key) this.adapter.selectTheme?.(DEFAULT_THEME)
            this.state.themes = this.state.themes.filter(value => value !== item)
          })
          themeDisposers.set(key, remove); return remove
        },
        unregister: key => { alive(); const remove = themeDisposers.get(fullId(key)); if (remove) void remove() },
        list: () => { alive(); return [...(this.app().listThemes?.() || []), ...this.state.themes].map(item => ({ ...item })) },
        current: () => {
          alive(); const key = this.app().currentTheme?.()
          const theme = [...(this.app().listThemes?.() || []), ...this.state.themes].find(item => item.id === key)
          if (!theme) throw new Error('当前主题不可用')
          return { ...theme }
        },
        select: key => {
          alive(); const complete = this.state.themes.some(item => item.id === key) ? key : fullId(key)
          const theme = [...(this.app().listThemes?.() || []), ...this.state.themes].find(item => item.id === key || item.id === complete)
          if (!theme || !this.app().selectTheme) throw new Error('主题不可用，请打开文件后重新选择主题')
          this.app().selectTheme!(theme.id)
        }
      },
      events: { on: (event, callback) => { alive(); const listeners = this.listeners.get(event) || new Set(); listeners.add(callback); this.listeners.set(event, listeners); return track(() => { listeners.delete(callback) }) } },
      storage: { dataDir: async () => { alive(); const path = await invoke<string>('plugin_data_directory', { pluginId: id }); alive(); return path }, get: <T>(key: string, fallback?: T) => { storageAlive(); const value = localStorage.getItem(storageKey(key)); return value === null ? fallback : JSON.parse(value) as T }, set: (key, value) => { storageAlive(); const encoded = JSON.stringify(value); if (encoded === undefined) localStorage.removeItem(storageKey(key)); else localStorage.setItem(storageKey(key), encoded) }, remove: key => { storageAlive(); localStorage.removeItem(storageKey(key)) } },
      clipboard: { readText: () => { alive(); return navigator.clipboard.readText() }, writeText: text => { alive(); return navigator.clipboard.writeText(text) } },
      filesystem: { watch: async (path, callback, options = {}) => {
        alive()
        const watchId = crypto.randomUUID()
        let stopped = false, started = false, queue = Promise.resolve()
        const unlisten = await listen<FileWatchEvent[]>(`markart-plugin-files:${watchId}`, event => {
          queue = queue.then(async () => { if (!stopped && !session.closed) await callback(event.payload) }).catch(error => { if (!stopped && !session.closed) this.report(error) })
        })
        if (session.closed) { await unlisten(); throw new Error('插件已停用') }
        const stop = track(async () => {
          stopped = true
          try { await unlisten() } finally { if (started) await invoke('plugin_watch_stop', { id: watchId }) }
        })
        try {
          await invoke('plugin_watch_start', { id: watchId, path, options })
          started = true
          if (stopped || session.closed) { await invoke('plugin_watch_stop', { id: watchId }); throw new Error('插件已停用') }
          return stop
        } catch (error) { await stop(); throw error }
      }, readText: path => native('readText', { path }), writeText: (path, text) => native('writeText', { path, text }), readBytes: path => native('readBytes', { path }), writeBytes: (path, bytes) => native('writeBytes', { path, bytes }), list: path => native('list', { path }), mkdir: path => native('mkdir', { path }), rename: (from, to) => native('rename', { from, to }), remove: (path, recursive = false) => native('remove', { path, recursive }) },
      network: { request: (url, options = {}) => native('request', { url, ...options }) },
      providers: { register: (kind, provider) => { alive(); const key = fullId(provider.id); if (this.state.providers.some(item => item.kind === kind && item.id === key)) throw new Error('提供者 ID 重复'); const item = { ...provider, id: key, kind, owner: id }; this.state.providers = [...this.state.providers, item]; return track(() => { this.state.providers = this.state.providers.filter(value => value !== item) }) }, list: kind => this.state.providers.filter(item => item.kind === kind).map(({ id, title, description, inputSchema }) => ({ id, title, description, inputSchema })), call: async (kind, key, input, signal) => { alive(); const provider = this.state.providers.find(item => item.kind === kind && item.id === (key.includes(':') ? key : fullId(key))); if (!provider) throw new Error('提供者不存在'); return provider.run(input, signal) } },
      setTimeout: (callback, ms) => { alive(); const timer = window.setTimeout(() => { if (!session.closed) { try { callback() } catch (error) { this.report(error) } } }, ms); return track(() => window.clearTimeout(timer)) },
      setInterval: (callback, ms) => { alive(); const timer = window.setInterval(() => { if (!session.closed) { try { callback() } catch (error) { this.report(error) } } }, ms); return track(() => window.clearInterval(timer)) }
    }
    Object.defineProperty(host.ui, 'addToolbarButton', { value: (commandId: string) => registerAction({ id: `toolbar:${commandId}`, commandId, location: 'topbar-menu' }) })
    return host
  }
}
export const pluginRuntime = new PluginRuntime()
