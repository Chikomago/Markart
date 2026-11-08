import { pathIdentity, relativeToRoot } from './documentIdentity'
import { t } from '../i18n'
import { watch, getCurrentScope, onScopeDispose, type ComputedRef, type Ref, type WritableComputedRef } from 'vue'
import { invoke } from '@tauri-apps/api/core'
import { listen } from '@tauri-apps/api/event'
import { fileKind } from './fileFormats'
import { renderTemplate, templateFilename, type PersonalItem } from '../documents/personalItems'
import type { Doc } from '../workspace/sample'
import { createUntitledDocument } from '../documents/untitledDocument'

type Mode = 'wysiwyg' | 'source' | 'split'
type RecentFile = { path: string; openedAt: number; pinned?: boolean }
export type WorkspaceInfo = { name: string; root: string; directories: string[]; files: { relativePath: string; openable?: boolean; utf8?: boolean | null; hidden?: boolean; created?: number; updated: number; excerpt: string }[] }
type OpenedFile = { content: string; encoding: string; version: string }
type DraftPreview = { content: string; updated: number; baselineHash: string; diskChanged: boolean }
type ConvertedDocument = { text: string }

export function useLocalWorkspace(deps: {
  isTauri: boolean
  syncBusy?: Readonly<Ref<boolean>>
  contextChanging?: Readonly<Ref<boolean>>
  beforeWorkspaceChange?: () => Promise<void>
  afterWorkspaceChange?: () => void
  flushDrafts?: () => Promise<void>
  waitWorkspaceReady?: () => Promise<void>
  docs: Ref<Doc[]>
  dirtyIds: Ref<string[]>
  activeId: Ref<string>
  activeDoc: ComputedRef<Doc>
  activeKind: ComputedRef<string>
  content: WritableComputedRef<string>
  currentWorkspaceRoot: Ref<string>
  currentDirectory: Ref<string>
  workspaceDirectories: Ref<string[]>
  openTabs: Ref<string[]>
  folderExpanded: Ref<Record<string, boolean>>
  folderInput: Ref<HTMLInputElement | null>
  nativeRecentDirs: Ref<string[]>
  recentFiles: Ref<RecentFile[]>
  mode: Ref<Mode>
  selectedFolder: Ref<string | null>
  selectedText: Ref<string>
  showNewMenu: Ref<boolean>
  getTabPaths: (root: string) => string[]
  getMarkdownMode: () => Mode
  resetHistoryForWorkspace: () => void
  closeHistory: () => void
  clearScrollSync: () => void
  resetConflicts: () => void
  reportConflict: (id: string, disk: { changed: boolean; missing: boolean; content: string | null }) => void
  recordRecentFile: (doc: Doc) => void
  markDirty: (id: string) => void
  askFileAction: (title: string, value?: string, confirm?: boolean) => Promise<string | null>
  askCreationName?: (kind: 'file' | 'folder', parent: string, name: string) => Promise<string | null>
  moveWithLinks: (from: string, to: string, root?: string) => Promise<unknown>
  openTarget?: (path: string, folder: boolean) => Promise<void>
  clearDraftFor?: (doc: Doc) => void
  confirmUnsaved?: (ids?: string[]) => Promise<boolean>
  notify: (message: string) => void
}) {
const { isTauri, docs, dirtyIds, activeId, activeDoc, activeKind, content,
  currentWorkspaceRoot, currentDirectory, workspaceDirectories, openTabs,
  folderExpanded, folderInput, nativeRecentDirs, recentFiles, mode,
  selectedText, showNewMenu, selectedFolder, getTabPaths, getMarkdownMode, resetHistoryForWorkspace,
  closeHistory, clearScrollSync, resetConflicts, reportConflict,
  recordRecentFile, markDirty, askFileAction, moveWithLinks, notify } = deps
let workspaceEpoch = 0
let selectionRequest = 0
const directoryViews = new Map<string, { expanded: Record<string, boolean>; selected: string | null }>()
function rememberDirectoryView() {
  if (!currentWorkspaceRoot.value) return
  directoryViews.set(currentWorkspaceRoot.value, { expanded: { ...folderExpanded.value }, selected: selectedFolder.value })
  while (directoryViews.size > 16) directoryViews.delete(directoryViews.keys().next().value!)
}
function applyWorkspace(workspace: WorkspaceInfo, preferredPath?: string, activate = true) {
  const previousRoot = currentWorkspaceRoot.value
  const tabPaths = getTabPaths(workspace.root)
  if (previousRoot !== workspace.root) rememberDirectoryView()
  workspaceEpoch++
  selectionRequest++
  closeHistory(); clearScrollSync()
  for (const doc of docs.value) {
    if (doc.relativePath && previousRoot) {
      doc.workspaceRoot = previousRoot; doc.workspaceRelativePath = doc.relativePath
      doc.absolutePath = `${previousRoot}/${doc.relativePath}`
    }
    if (doc.workspaceRoot && doc.workspaceRoot !== workspace.root) doc.relativePath = undefined
  }
  const kept = docs.value.filter(doc => !(doc.startupPlaceholder && !doc.content && !dirtyIds.value.includes(doc.id)) && (openTabs.value.includes(doc.id) || dirtyIds.value.includes(doc.id) || doc.temporary))
  const byPath = new Map(docs.value.filter(doc => doc.workspaceRoot === workspace.root).map(doc => [doc.workspaceRelativePath, doc]))
  const byAbsolute = new Map(docs.value.filter(doc => doc.absolutePath).map(doc => [pathIdentity(doc.absolutePath!), doc]))
  const files = workspace.files.map(file => {
    const existing = byPath.get(file.relativePath) || byAbsolute.get(pathIdentity(`${workspace.root}/${file.relativePath}`))
    if (existing) {
      existing.workspaceRoot = workspace.root; existing.workspaceRelativePath = file.relativePath; existing.absolutePath = `${workspace.root}/${file.relativePath}`
      existing.relativePath = file.relativePath; existing.path = `${workspace.name}/${file.relativePath}`
      existing.openable = file.openable; existing.utf8 = file.utf8; existing.hidden = file.hidden; existing.updated = file.updated
      return existing
    }
    return { id: `local:${crypto.randomUUID()}`, workspaceRoot: workspace.root, workspaceRelativePath: file.relativePath, absolutePath: `${workspace.root}/${file.relativePath}`, path: `${workspace.name}/${file.relativePath}`, relativePath: file.relativePath, openable: file.openable, utf8: file.utf8, hidden: file.hidden, content: '', excerpt: file.excerpt, loaded: false, created: file.created, updated: file.updated } as Doc
  })
  const present = new Set(files.map(doc => doc.id))
  docs.value = [...files, ...kept.filter(doc => !present.has(doc.id))]
  openTabs.value = [...new Set([...openTabs.value.filter(id => docs.value.some(doc => doc.id === id)), ...tabPaths.map(path => files.find(doc => doc.relativePath === path)?.id).filter((id): id is string => !!id)])]
  currentWorkspaceRoot.value = workspace.root
  currentDirectory.value = workspace.name
  workspaceDirectories.value = workspace.directories
  const view = directoryViews.get(workspace.root)
  folderExpanded.value = { ...view?.expanded }
  selectedFolder.value = view?.selected ?? null
  const selected = files.find(doc => doc.relativePath === preferredPath && doc.openable !== false) || files.find(doc => doc.openable !== false && fileKind(doc.path) === 'markdown') || files.find(doc => doc.openable !== false && fileKind(doc.path) !== 'convertible')
  if (activate) {
    if (selected) void selectDoc(selected.id)
    else if (!docs.value.some(doc => doc.id === activeId.value)) activeId.value = ''
  }
}

function updateWorkspaceFiles(workspace: WorkspaceInfo) {
  if (workspace.root !== currentWorkspaceRoot.value) return false
  const existing = new Map(docs.value.filter(doc => doc.relativePath).map(doc => [doc.relativePath, doc]))
  const paths = new Set(workspace.files.map(file => file.relativePath))
  const retained = docs.value.filter(doc => {
    if (!doc.relativePath || paths.has(doc.relativePath)) return !doc.relativePath
    if (!openTabs.value.includes(doc.id) && !dirtyIds.value.includes(doc.id)) return false
    // Keep an externally removed open document available for Save As.
    doc.relativePath = undefined; doc.workspaceRoot = undefined; doc.workspaceRelativePath = undefined; doc.absolutePath = undefined; doc.temporary = true
    if (!dirtyIds.value.includes(doc.id)) dirtyIds.value = [...dirtyIds.value, doc.id]
    return true
  })
  const files = workspace.files.map(file => {
    const doc = existing.get(file.relativePath)
    if (doc) { doc.openable = file.openable; doc.utf8 = file.utf8; doc.hidden = file.hidden; doc.updated = file.updated; doc.excerpt = file.excerpt; return doc }
    return { id: `local:${workspaceEpoch}:${crypto.randomUUID()}`, path: `${workspace.name}/${file.relativePath}`, workspaceRoot: workspace.root, workspaceRelativePath: file.relativePath, absolutePath: `${workspace.root}/${file.relativePath}`, relativePath: file.relativePath, openable: file.openable, utf8: file.utf8, hidden: file.hidden, content: '', excerpt: file.excerpt, loaded: false, created: file.created, updated: file.updated }
  })
  const next = [...files, ...retained]
  if (next.length !== docs.value.length || next.some((doc, index) => doc !== docs.value[index])) docs.value = next
  if (workspace.directories.length !== workspaceDirectories.value.length || workspace.directories.some((path, index) => path !== workspaceDirectories.value[index])) workspaceDirectories.value = workspace.directories
  return true
}
async function refreshIndexedFiles(root: string, requiredPath?: string) {
  if (root !== currentWorkspaceRoot.value) return true
  const epoch = workspaceEpoch
  try {
    const info = await invoke<WorkspaceInfo>('refresh_workspace', { workspaceRoot: root, indexedOnly: true })
    if (epoch !== workspaceEpoch || root !== currentWorkspaceRoot.value) return true
    if (deps.contextChanging?.value || requiredPath && !info.files.some(file => file.relativePath === requiredPath)) return false
    updateWorkspaceFiles(info)
    return true
  } catch { /* The next file event or focus refresh retries the directory listing. */ }
}
if (isTauri && getCurrentScope()) {
  let disposed = false
  let unlisten: (() => void) | undefined
  void listen<string>('markart-workspace-indexed', event => { void refreshIndexedFiles(event.payload) }).then(stop => { if (disposed) stop(); else unlisten = stop }).catch(() => {})
  onScopeDispose(() => { disposed = true; unlisten?.() })
}
if (deps.contextChanging) watch(deps.contextChanging, changing => {
  if (!changing && isTauri && currentWorkspaceRoot.value) void refreshIndexedFiles(currentWorkspaceRoot.value)
})
let refreshing = false, refreshAgain = false
let syncRefreshPending = false
let syncSettleTimer: ReturnType<typeof setTimeout> | undefined
function cancelSyncSettle() { if (syncSettleTimer) clearTimeout(syncSettleTimer); syncSettleTimer = undefined }
if (getCurrentScope()) onScopeDispose(cancelSyncSettle)
watch(currentWorkspaceRoot, () => { cancelSyncSettle(); syncRefreshPending = false }, { flush: 'sync' })
if (deps.syncBusy) watch(deps.syncBusy, busy => {
  cancelSyncSettle()
  if (busy) { syncRefreshPending = true; return }
  if (!syncRefreshPending) return
  const root = currentWorkspaceRoot.value
  syncSettleTimer = setTimeout(() => {
    syncSettleTimer = undefined
    if (root !== currentWorkspaceRoot.value) return
    syncRefreshPending = false
    void refreshWorkspace().catch(error => notify(t('文件列表更新失败：{0}', { '0': String(error) })))
  }, 240)
}, { flush: 'sync' })

async function refreshWorkspace() {
  const root = currentWorkspaceRoot.value, epoch = workspaceEpoch
  if (!isTauri || !root) return
  if (deps.syncBusy?.value || syncSettleTimer) { syncRefreshPending = true; return }
  if (refreshing) { refreshAgain = true; return }
  refreshing = true
  try {
    const workspace = await invoke<WorkspaceInfo>('refresh_workspace', { workspaceRoot: root })
    if (currentWorkspaceRoot.value !== root || workspaceEpoch !== epoch || workspace.root !== root) return
    if (deps.syncBusy?.value || syncSettleTimer) { syncRefreshPending = true; return }
    updateWorkspaceFiles(workspace)
  } finally {
    refreshing = false
    if (refreshAgain) { refreshAgain = false; void refreshWorkspace().catch(() => {}) }
  }
}
function applyWorkspaceMove(from: string, to: string, root = currentWorkspaceRoot.value) {
  closeHistory()
  const remap = (path: string) => path === from || path.startsWith(`${from}/`) ? `${to}${path.slice(from.length)}` : path
  for (const doc of docs.value) {
    if (doc.workspaceRoot && doc.workspaceRoot !== root) continue
    const path = doc.workspaceRelativePath || doc.relativePath
    if (!path) continue
    const next = remap(path)
    if (next === path) continue
    if (root === currentWorkspaceRoot.value) doc.relativePath = next
    doc.workspaceRelativePath = next; doc.absolutePath = `${root}/${next}`
    doc.path = `${root.replace(/\\/g, '/').split('/').pop()}/${next}`
  }
  if (root === currentWorkspaceRoot.value) {
    workspaceDirectories.value = workspaceDirectories.value.map(remap).sort()
    folderExpanded.value = Object.fromEntries(Object.entries(folderExpanded.value).map(([path, expanded]) => [remap(path), expanded]))
    const parts = to.split('/')
    for (let index = 1; index < parts.length; index++) folderExpanded.value[parts.slice(0, index).join('/')] = true
  }
  const oldAbsolute = `${root}/${from}`, newAbsolute = `${root}/${to}`
  recentFiles.value = recentFiles.value.map(item => item.path === oldAbsolute || item.path.startsWith(`${oldAbsolute}/`) ? { ...item, path: `${newAbsolute}${item.path.slice(oldAbsolute.length)}` } : item)
}

async function closeWorkspace(): Promise<boolean> {
  const root = currentWorkspaceRoot.value
  const affected = new Set(docs.value.filter(doc => doc.workspaceRoot === root || !!doc.relativePath && !doc.workspaceRoot).map(doc => doc.id))
  const dirty = dirtyIds.value.filter(id => affected.has(id))
  if (dirty.length && !await (deps.confirmUnsaved?.(dirty) ?? Promise.resolve(false))) return false
  try {
    await deps.beforeWorkspaceChange?.()
    if (isTauri) await invoke('close_workspace', { workspaceRoot: root })
    workspaceEpoch++; selectionRequest++
    closeHistory(); resetHistoryForWorkspace(); clearScrollSync()
    docs.value = docs.value.filter(doc => !affected.has(doc.id)); openTabs.value = openTabs.value.filter(id => !affected.has(id))
    dirtyIds.value = dirtyIds.value.filter(id => !affected.has(id)); activeId.value = ''
    workspaceDirectories.value = []; folderExpanded.value = {}; selectedText.value = ''
    selectedFolder.value = null; currentWorkspaceRoot.value = ''; currentDirectory.value = '未打开文件夹'; showNewMenu.value = false
    directoryViews.delete(root)
    const next = openTabs.value[0]
    if (next) await selectDocNow(next, true)
    else resetConflicts()
    return true
  } catch (error) { notify(t('关闭文件夹失败：{0}', { "0": String(error) })); return false }
  finally { deps.afterWorkspaceChange?.() }
}

async function chooseFolder() {
  if (!isTauri) { folderInput.value?.click(); return }
  try {
    const path = await invoke<string | null>('pick_open_target', { folder: true })
    if (path) await deps.openTarget?.(path, true)
  } catch (error) { notify(t('打开文件夹失败：{0}', { "0": String(error) })) }
}
async function openStorageDirectory(directory: string) {
  if (!isTauri || !currentWorkspaceRoot.value) return notify(t('请先打开文件夹'))
  try { await invoke('open_workspace_directory', { directory }) }
  catch (error) { notify(t('打开文件夹失败：{0}', { "0": String(error) })) }
}
async function chooseFile() {
  if (!isTauri) return notify(t('打开本地文件需要桌面版'))
  try {
    const path = await invoke<string | null>('pick_open_target', { folder: false })
    if (path) await deps.openTarget?.(path, false)
  } catch (error) { notify(t('打开文件失败：{0}', { "0": String(error) })) }
}
async function saveAs(): Promise<boolean> {
  if (!isTauri) { notify(t('另存为需要桌面版')); return false }
  try {
    await deps.beforeWorkspaceChange?.()
    const doc = activeDoc.value
    const filename = doc.temporary && doc.sourceRelativePath ? doc.sourceRelativePath.split('/').pop()!.replace(/\.[^.]+$/, '.md') : doc.path.split('/').pop() || '未命名文件.md'
    const submitted = doc.content
    const result = await invoke<{ workspace: WorkspaceInfo; relativePath: string } | null>('save_document_as', { content: submitted, filename, markdownOnly: !!doc.temporary && fileKind(doc.path) === 'markdown' })
    if (!result) return false
    if (doc.id.startsWith('external:')) { try { localStorage.removeItem('markart-external-draft:' + doc.id) } catch { /* Saved document remains available on disk. */ } }
    const disk = await invoke<OpenedFile>('read_document', { workspaceRoot: result.workspace.root, relativePath: result.relativePath })
    doc.workspaceRoot = result.workspace.root; doc.workspaceRelativePath = result.relativePath
    doc.absolutePath = `${result.workspace.root}/${result.relativePath}`
    doc.relativePath = undefined; doc.temporary = false; doc.sourceRelativePath = undefined
    doc.loaded = true; doc.baselineRoot = result.workspace.root; doc.diskContent = disk.content; doc.version = disk.version; doc.encoding = disk.encoding
    if (doc.content === submitted) dirtyIds.value = dirtyIds.value.filter(id => id !== doc.id)
    else markDirty(doc.id)
    applyWorkspace(result.workspace, result.relativePath)
    await selectDocNow(doc.id, true)
    nativeRecentDirs.value = await invoke<string[]>('list_recent_workspaces')
    const savedRoot = result.workspace.root, savedPath = result.relativePath, savedEpoch = workspaceEpoch
    let retries = 0
    const finishListing = async () => {
      if (savedEpoch !== workspaceEpoch || savedRoot !== currentWorkspaceRoot.value) return
      if (!await refreshIndexedFiles(savedRoot, savedPath) && ++retries < 20) setTimeout(() => { void finishListing() }, 250)
    }
    setTimeout(() => { void finishListing() }, 0)
    notify(t('已保存'))
    return true
  } catch (error) { notify(t('另存为失败：{0}', { "0": String(error) })); return false }
  finally { deps.afterWorkspaceChange?.() }
}
async function openFolder(event: Event) {
  const input = event.target as HTMLInputElement
  if (dirtyIds.value.length && !await (deps.confirmUnsaved?.() ?? Promise.resolve(false))) { input.value = ''; return }
  const files = Array.from(input.files || []).filter(file => ['markdown', 'text'].includes(fileKind(file.name)))
  if (!files.length) { input.value = ''; return notify(t('所选文件夹中没有可编辑的文件')) }
  const imported = await Promise.all(files.map(async (file, index) => ({
    id: `folder-${Date.now()}-${index}`,
    path: file.webkitRelativePath || file.name,
    content: await file.text(),
    created: Date.now(),
    updated: file.lastModified || Date.now()
  })))
  const paths = new Set(imported.map(doc => doc.path))
  docs.value = [...imported, ...docs.value.filter(doc => !paths.has(doc.path))]
  currentDirectory.value = imported[0].path.split('/')[0]
  activeId.value = imported[0].id
  mode.value = fileKind(imported[0].path) === 'markdown' ? getMarkdownMode() : 'source'
  recordRecentFile(imported[0])
  folderExpanded.value[currentDirectory.value] = true
  input.value = ''
  notify(t('已打开 {0} 个文件', { "0": files.length }))
}
let documentSelectionQueue = Promise.resolve()
function selectDoc(id: string): Promise<void> {
  const next = documentSelectionQueue.then(() => selectDocNow(id))
  documentSelectionQueue = next.catch(() => {})
  return next
}
async function restoreOpenTabs(entries: { root: string; path: string }[], activePath?: string) {
  const restored: Doc[] = []
  const seen = new Set<string>()
  for (const entry of entries) {
    if (!entry || typeof entry.root !== 'string' || typeof entry.path !== 'string' || !entry.root || !entry.path || entry.path.split(/[\\/]/).includes('..') || /^[\\/]/.test(entry.path)) continue
    const absolutePath = `${entry.root}/${entry.path}`, identity = pathIdentity(absolutePath)
    if (seen.has(identity)) continue
    seen.add(identity)
    restored.push({ id: `local:${crypto.randomUUID()}`, workspaceRoot: entry.root, workspaceRelativePath: entry.path, absolutePath, path: `${entry.root.replace(/\\/g, '/').split('/').pop()}/${entry.path}`, content: '', loaded: false, updated: 0 })
  }
  if (!restored.length) return false
  docs.value = [...docs.value.filter(doc => dirtyIds.value.includes(doc.id)), ...restored]
  openTabs.value = [...docs.value.filter(doc => dirtyIds.value.includes(doc.id)).map(doc => doc.id), ...restored.map(doc => doc.id)]
  const selected = restored.find(doc => pathIdentity(doc.absolutePath!) === pathIdentity(activePath || '')) || restored[0]
  await selectDoc(selected.id)
  return true
}
function openFileAtPath(path: string): Promise<void> {
  const task = documentSelectionQueue.then(async () => {
    await deps.waitWorkspaceReady?.()
    const existing = docs.value.find(doc => pathIdentity(doc.absolutePath || (doc.relativePath ? `${currentWorkspaceRoot.value}/${doc.relativePath}` : doc.path)) === pathIdentity(path))
    if (existing) { await selectDocNow(existing.id); return }
    await deps.beforeWorkspaceChange?.()
    try {
      const roots = [...new Set([currentWorkspaceRoot.value, ...docs.value.map(doc => doc.workspaceRoot || '')].filter(Boolean))].filter(root => relativeToRoot(path, root) !== null).sort((a, b) => b.length - a.length)
      let workspace: WorkspaceInfo, relativePath: string
      if (roots.length) {
        workspace = await invoke<WorkspaceInfo>('activate_workspace', { path: roots[0] })
        const relative = await invoke<string | null>('workspace_relative_target', { path })
        if (relative === null) throw new Error(t('文件不在当前文件夹中，请重新打开所在文件夹'))
        relativePath = relative
        if (!workspace.files.some(file => file.relativePath === relativePath)) workspace = await invoke<WorkspaceInfo>('refresh_workspace', { workspaceRoot: workspace.root })
      } else {
        const opened = await invoke<{ workspace: WorkspaceInfo; relativePath: string }>('open_document_path', { path })
        workspace = opened.workspace; relativePath = opened.relativePath
      }
      applyWorkspace(workspace, relativePath, false)
      const doc = docs.value.find(item => item.relativePath === relativePath)
      if (!doc) throw new Error(t('文件不可用，可从最近打开记录中移除'))
      await selectDocNow(doc.id, true)
      nativeRecentDirs.value = await invoke<string[]>('list_recent_workspaces')
    } finally { deps.afterWorkspaceChange?.() }
  })
  documentSelectionQueue = task.catch(() => {})
  return task
}
function openDirectoryPath(path: string): Promise<void> {
  const task = documentSelectionQueue.then(async () => {
    await deps.beforeWorkspaceChange?.()
    try {
      const info = await invoke<WorkspaceInfo>('activate_workspace', { path })
      applyWorkspace(info, undefined, false)
      const doc = docs.value.find(item => item.relativePath && item.openable !== false && fileKind(item.path) === 'markdown')
      if (doc) await selectDocNow(doc.id, true)
      else activeId.value = ''
      nativeRecentDirs.value = await invoke<string[]>('list_recent_workspaces')
    } finally { deps.afterWorkspaceChange?.() }
  })
  documentSelectionQueue = task.catch(() => {})
  return task
}
async function selectDocNow(id: string, internal = false) {
  if (!internal) await deps.waitWorkspaceReady?.()
  closeHistory()
  clearScrollSync()
  const doc = docs.value.find(item => item.id === id)
  if (!doc) return
  let changedWhileAway: string | undefined
  if (isTauri && doc.workspaceRoot && doc.workspaceRoot !== currentWorkspaceRoot.value) {
    try {
      if (!internal) await deps.beforeWorkspaceChange?.()
      const info = await invoke<WorkspaceInfo>('activate_workspace', { path: doc.workspaceRoot })
      applyWorkspace(info, doc.workspaceRelativePath, false)
      // Initialize the native disk baseline before editing in this directory.
      if (doc.workspaceRelativePath) {
        doc.relativePath = doc.workspaceRelativePath
        const disk = await invoke<OpenedFile>('read_document', { relativePath: doc.relativePath, workspaceRoot: doc.workspaceRoot || currentWorkspaceRoot.value })
        if (!dirtyIds.value.includes(doc.id)) { doc.content = disk.content; doc.diskContent = disk.content; doc.version = disk.version; doc.encoding = disk.encoding }
        else if (doc.version && disk.version !== doc.version) changedWhileAway = disk.content
        doc.loaded = true; doc.baselineRoot = doc.workspaceRoot
      }
    } catch (error) { notify(t('打开文件失败：{0}', { '0': String(error) })); return }
    finally { if (!internal) deps.afterWorkspaceChange?.() }
  }
  if (doc.openable === false) return notify(t('此文件无法作为文本打开'))
  const request = ++selectionRequest
  if (isTauri && doc.relativePath && fileKind(doc.relativePath) === 'convertible') {
    const existing = docs.value.find(item => item.temporary && item.workspaceRoot === doc.workspaceRoot && item.sourceRelativePath === doc.relativePath)
    if (existing) return selectDocNow(existing.id, true)
    try {
      const preview = await invoke<ConvertedDocument>('convert_workspace_document', { relativePath: doc.relativePath, workspaceRoot: doc.workspaceRoot || currentWorkspaceRoot.value })
      if (request !== selectionRequest) return
      const markdown = preview.text
      if (!markdown.trim()) return notify(t('未提取到文字，请检查文件内容'))
      const base = doc.relativePath.replace(/\.[^.]+$/, '')
      const temporary: Doc = { workspaceRoot: currentWorkspaceRoot.value, id: `import:${workspaceEpoch}:${doc.relativePath}`, path: `${currentDirectory.value}/${base}.md`, content: markdown, loaded: true, temporary: true, sourceRelativePath: doc.relativePath, updated: Date.now() }
      docs.value = [...docs.value, temporary]
      recordRecentFile(doc)
      markDirty(temporary.id)
      await selectDocNow(temporary.id, true)
    } catch (error) { notify(t('导入失败：{0}', { "0": String(error) })) }
    return
  }
  if (isTauri && doc.relativePath && (!doc.loaded || !!doc.workspaceRoot && doc.baselineRoot !== doc.workspaceRoot)) {
    try {
      const opened = await invoke<OpenedFile>('read_document', { relativePath: doc.relativePath, workspaceRoot: doc.workspaceRoot || currentWorkspaceRoot.value })
      if (!dirtyIds.value.includes(doc.id)) {
        doc.content = opened.content; doc.diskContent = opened.content; doc.encoding = opened.encoding; doc.version = opened.version
      } else if (doc.version && opened.version !== doc.version) changedWhileAway = opened.content
      doc.loaded = true; doc.baselineRoot = doc.workspaceRoot
    } catch (error) { notify(t('读取失败：{0}', { "0": String(error) })); return }
  }
  if (request !== selectionRequest) return
  activeId.value = id
  selectedFolder.value = null
  if (!openTabs.value.includes(id)) openTabs.value = [...openTabs.value, id]
  mode.value = fileKind(doc.path) === 'markdown' ? getMarkdownMode() : 'source'
  if (doc.relativePath) {
    const parts = doc.relativePath.split('/')
    for (let index = 1; index < parts.length; index++) folderExpanded.value[parts.slice(0, index).join('/')] = true
  }
  selectedText.value = ''
  if (!doc.temporary) recordRecentFile(doc)
  if (changedWhileAway !== undefined) reportConflict(id, { changed: true, missing: false, content: changedWhileAway })
  if (isTauri && doc.relativePath && !dirtyIds.value.includes(id)) {
    try {
      const draft = await invoke<DraftPreview | null>('load_draft', { relativePath: doc.relativePath, workspaceRoot: doc.workspaceRoot || currentWorkspaceRoot.value })
      if (request !== selectionRequest || activeId.value !== id || !draft) return
      if (draft.content === doc.content) await invoke('clear_draft', { relativePath: doc.relativePath, workspaceRoot: doc.workspaceRoot || currentWorkspaceRoot.value })
      else {
        const diskContent = doc.content
        doc.content = draft.content
        doc.version = draft.baselineHash
        markDirty(id)
        if (draft.diskChanged) {
          reportConflict(id, { changed: true, missing: false, content: diskContent })
        }
      }
    } catch (error) { notify(t('草稿读取失败：{0}', { "0": String(error) })) }
  }
}
function creationParent(): string | null {
  if (selectedFolder.value !== null) return selectedFolder.value
  const path = activeDoc.value?.relativePath || activeDoc.value?.sourceRelativePath
  return path ? path.split('/').slice(0, -1).join('/') : null
}
function newTemporaryDoc(template?: PersonalItem) {
  if (deps.contextChanging?.value) return
  showNewMenu.value = false
  const name = template ? templateFilename(template.name) : '未命名文件.md'
  const doc = createUntitledDocument(template ? renderTemplate(template.content, name) : '')
  doc.path = name
  docs.value = [...docs.value, doc]
  activeId.value = doc.id
  selectedFolder.value = null
  openTabs.value = [...openTabs.value, doc.id]
  if (doc.content) markDirty(doc.id)
  mode.value = 'wysiwyg'
}
async function newDoc(template?: PersonalItem, targetParent?: string) {
  if (deps.contextChanging?.value) return
  const parent = typeof targetParent === 'string' ? targetParent : creationParent()
  const creationRoot = currentWorkspaceRoot.value
  if (isTauri && currentWorkspaceRoot.value && parent === null) return
  showNewMenu.value = false
  const templateName = template ? templateFilename(template.name) : '未命名文件.md'
  if (isTauri) {
    if (!currentWorkspaceRoot.value) {
      newTemporaryDoc(template)
      return
    }
    let name = template ? templateName : await (deps.askCreationName ? deps.askCreationName('file', parent || '', '未命名文件.md') : askFileAction(t('新建 Markdown 文件名称'), '未命名文件.md'))
    if (template) {
      const exists = (candidate: string) => {
        const path = `${parent ? `${parent}/` : ''}${candidate}`
        return docs.value.some(doc => doc.relativePath === path) || workspaceDirectories.value.includes(path)
      }
      const base = templateName.replace(/(\.[^.]+)$/, ''), extension = templateName.slice(base.length)
      for (let index = 2; exists(name!); index++) name = `${base} (${index})${extension}`
    }
    if (!name) return
    const relativePath = `${parent ? `${parent}/` : ''}${name}`
    try {
      const workspace = await invoke<WorkspaceInfo>('create_markdown', { workspaceRoot: creationRoot, relativePath, content: template ? renderTemplate(template.content, name) : '' })
      if (!updateWorkspaceFiles(workspace)) return
      const created = docs.value.find(doc => doc.relativePath === relativePath)
      if (created) await selectDoc(created.id)
    }
    catch (error) { notify(t('新建失败：{0}', { "0": String(error) })) }
    return
  }
  const folder = currentDirectory.value === '我的文件' ? activeDoc.value?.path.split('/').slice(0, -1).join('/') || '未分类' : currentDirectory.value
  const id = String(Date.now())
  docs.value.unshift({ id, path: `${folder}/${templateName}`, content: template ? renderTemplate(template.content, templateName) : '# 未命名文件\n\n开始写作…\n', created: Date.now(), updated: Date.now() })
  markDirty(id); activeId.value = id; recordRecentFile(docs.value[0]); mode.value = 'wysiwyg'
}
async function convertCurrentText() {
  const doc = activeDoc.value
  if (!isTauri || !doc.relativePath || activeKind.value !== 'text') return notify(t('仅本地纯文本文件可以另存为 Markdown'))
  if (dirtyIds.value.includes(doc.id)) return notify(t('请先保存当前文本，再另存为 Markdown'))
  const target = await askFileAction(t('另存为 Markdown'), doc.relativePath.replace(/\.(txt|text)$/i, '.md'))
  if (!target) return
  try { applyWorkspace(await invoke<WorkspaceInfo>('convert_text_to_markdown', { source: doc.relativePath, target }), target) }
  catch (error) { notify(t('另存失败：{0}', { "0": String(error) })) }
}
async function newFolder(targetParent?: string) {
  if (deps.contextChanging?.value) return
  if (!isTauri || !currentWorkspaceRoot.value) return notify(t('请先打开文件夹'))
  const parent = typeof targetParent === 'string' ? targetParent : creationParent()
  if (parent === null) return
  const creationRoot = currentWorkspaceRoot.value
  const name = await (deps.askCreationName ? deps.askCreationName('folder', parent, '新建文件夹') : askFileAction(t('新建文件夹路径（相对于当前目录）'), '新建文件夹'))
  if (!name) return
  try {
    if (updateWorkspaceFiles(await invoke<WorkspaceInfo>('create_folder', { workspaceRoot: creationRoot, relativePath: `${parent ? `${parent}/` : ''}${name}` }))) {
      const parts = parent.split('/').filter(Boolean)
      for (let index = 1; index <= parts.length; index++) folderExpanded.value[parts.slice(0, index).join('/')] = true
    }
  }
  catch (error) { notify(t('新建文件夹失败：{0}', { "0": String(error) })) }
}
async function manageItem(relativePath: string, action: 'rename' | 'move' | 'trash') {
  if (!isTauri) return
  const operationRoot = currentWorkspaceRoot.value
  const isFolder = workspaceDirectories.value.includes(relativePath)
  const affected = docs.value.filter(doc => doc.relativePath === relativePath || (isFolder && doc.relativePath?.startsWith(`${relativePath}/`)))
  try {
    if (action === 'trash') {
      const unsaved = affected.some(doc => dirtyIds.value.includes(doc.id))
      const question = (isFolder ? t('删除文件夹“{0}”及其内容？', { '0': relativePath }) : t('删除文件“{0}”？', { '0': relativePath })) + (unsaved ? t('其中未保存的修改将丢弃。') : '')
      if (await askFileAction(question, '', true) === null) return
      const workspace = await invoke<WorkspaceInfo>('trash_item', { workspaceRoot: operationRoot, relativePath })
      for (const doc of affected) deps.clearDraftFor?.(doc)
      const removedIds = new Set(affected.map(doc => doc.id))
      dirtyIds.value = dirtyIds.value.filter(id => !removedIds.has(id))
      recentFiles.value = recentFiles.value.filter(item => item.path !== `${operationRoot}/${relativePath}` && !item.path.startsWith(`${operationRoot}/${relativePath}/`))
      const wasActive = removedIds.has(activeId.value)
      docs.value = docs.value.filter(doc => !removedIds.has(doc.id))
      openTabs.value = openTabs.value.filter(id => docs.value.some(doc => doc.id === id))
      if (currentWorkspaceRoot.value === operationRoot) workspaceDirectories.value = workspace.directories
      if (wasActive) {
        const next = docs.value[0]
        activeId.value = ''
        if (next) void selectDoc(next.id)
      }
    } else {
      const suggested = action === 'rename' ? relativePath.split('/').pop() || relativePath : relativePath
      const input = await askFileAction(action === 'rename' ? t('新名称') : t('移动到当前目录内的相对路径'), suggested)
      if (!input) return
      const parent = relativePath.split('/').slice(0, -1).join('/')
      const to = action === 'rename' ? `${parent ? `${parent}/` : ''}${input}` : input
      if (to === relativePath) return
      await moveWithLinks(relativePath, to, operationRoot)
    }
  } catch (error) { notify(t('文件操作失败：{0}', { "0": String(error) })) }
}

return { refreshWorkspace, closeWorkspace, applyWorkspace, applyWorkspaceMove, chooseFolder, openStorageDirectory,
  chooseFile, saveAs, openFolder, openFileAtPath, openDirectoryPath, restoreOpenTabs, selectDoc, newDoc, newTemporaryDoc, convertCurrentText,
  newFolder, manageItem }
}
