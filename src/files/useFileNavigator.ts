import { t } from '../i18n'
import { computed, onBeforeUnmount, ref, watch, type ComputedRef, type Ref } from 'vue'
import { invoke } from '@tauri-apps/api/core'
import { searchGroups, extensionOf, requestedExtensions, hiddenPath } from './fileFilters'
import { fileKind } from './fileFormats'
import { documentExcerpt, type DocumentExcerpt } from './documentExcerpt'
import { compareDocuments, compareFolders } from './fileSort'
import type { Doc } from '../workspace/sample'

type SortMode = 'modifiedDesc' | 'createdDesc' | 'nameAsc' | 'nameDesc'
type RecentFile = { path: string; openedAt: number; pinned?: boolean }
type WorkspaceInfo = { name: string; root: string; directories: string[]; files: { relativePath: string; created?: number; updated: number; excerpt: string }[] }

export function useFileNavigator(deps: {
  isTauri: boolean
  docs: Ref<Doc[]>
  activeDoc: ComputedRef<Doc>
  recentFiles: Ref<RecentFile[]>
  pinnedRecentFolders: Ref<string[]>
  nativeRecentDirs: Ref<string[]>
  currentWorkspaceRoot: Ref<string>
  currentDirectory: Ref<string>
  search: Ref<string>
  sortMode: Ref<SortMode>
  workspaceDirectories: Ref<string[]>
  folderExpanded: Ref<Record<string, boolean>>
  dirtyIds: Ref<string[]>
  showRecentFiles: Ref<boolean>
  showNewMenu: Ref<boolean>
  showSortMenu: Ref<boolean>
  fileHubPosition: Ref<{ left: number; top: number }>
  openLocalFile?: (path: string) => Promise<void>
  openLocalDirectory?: (path: string) => Promise<void>
  beforeWorkspaceChange?: () => Promise<void>
  afterWorkspaceChange?: () => void
  revealFolder?: (relativePath: string) => void
  confirmUnsaved?: () => Promise<boolean>
  flushDrafts: () => Promise<void>
  applyWorkspace: (workspace: WorkspaceInfo, preferredPath?: string) => void
  selectDoc: (id: string) => Promise<void>
  notify: (message: string) => void
}) {
const { isTauri, docs, activeDoc, recentFiles, pinnedRecentFolders, nativeRecentDirs,
  currentWorkspaceRoot, currentDirectory, search, sortMode, workspaceDirectories,
  folderExpanded, dirtyIds, showRecentFiles, showNewMenu, showSortMenu, fileHubPosition,
  flushDrafts, applyWorkspace, selectDoc, notify } = deps
const searchResults = ref<Record<string, Record<string, string | null>>>({})
const showFileFilter = ref(false), excludeExtensionless = ref(false), excludeHidden = ref(false), hideEmptyFolders = ref(false), fileExtensions = ref('')
const includeExtensionless = ref(false), utf8Only = ref(true)
const commonFileExtensions = ['md', 'txt', 'json', 'yaml', 'yml', 'js', 'ts', 'html', 'css', 'py', 'pdf', 'doc', 'csv', 'xml', 'toml']
watch(excludeExtensionless, value => { if (value) includeExtensionless.value = false }, { flush: 'sync' })
watch(includeExtensionless, value => { if (value) excludeExtensionless.value = false }, { flush: 'sync' })
const selectedFileExtensions = computed(() => requestedExtensions(fileExtensions.value))
function toggleFileExtension(extension: string) {
  const selected = selectedFileExtensions.value
  fileExtensions.value = (selected.includes(extension) ? selected.filter(value => value !== extension) : [...selected, extension]).join(', ')
}
const filterActive = computed(() => utf8Only.value || includeExtensionless.value || excludeExtensionless.value || excludeHidden.value || hideEmptyFolders.value || requestedExtensions(fileExtensions.value).length > 0)
let searchRequest = 0
let searchTimer: ReturnType<typeof setTimeout> | undefined
const recentDirectories = computed(() => {
  if (isTauri) return [...new Set([...pinnedRecentFolders.value, ...nativeRecentDirs.value])]
  const names = [...new Set(docs.value.map(doc => doc.path.split('/')[0]))]
  return [...(isTauri ? [] : ['我的文件']), ...names.sort((a, b) => Math.max(...docs.value.filter(doc => doc.path.startsWith(b + '/')).map(doc => doc.updated)) - Math.max(...docs.value.filter(doc => doc.path.startsWith(a + '/')).map(doc => doc.updated)))]
})
const orderedRecentFiles = computed(() => {
  return [...recentFiles.value].sort((a, b) => Number(!!b.pinned) - Number(!!a.pinned) || b.openedAt - a.openedAt)
})
const activeAbsolutePath = computed(() => activeDoc.value.absolutePath || (isTauri && activeDoc.value.relativePath ? `${currentWorkspaceRoot.value}/${activeDoc.value.relativePath}` : activeDoc.value.path))
function recordRecentFile(doc: Doc) {
  const path = doc.absolutePath || (isTauri && doc.relativePath ? `${currentWorkspaceRoot.value}/${doc.relativePath}` : doc.path)
  const previous = recentFiles.value.find(item => item.path === path)
  recentFiles.value = [{ path, openedAt: Date.now(), pinned: previous?.pinned }, ...recentFiles.value.filter(item => item.path !== path)].slice(0, 10)
}
async function openRecentFile(path: string) {
  if (isTauri && deps.openLocalFile) {
    try { await deps.openLocalFile(path); showRecentFiles.value = false; showNewMenu.value = false }
    catch (error) { notify(t('打开文件失败：{0}', { '0': String(error) })) }
    return
  }
  let doc = docs.value.find(item => (item.absolutePath || (isTauri && item.relativePath ? `${currentWorkspaceRoot.value}/${item.relativePath}` : item.path)) === path)
  if (!doc && isTauri) {
    try {
      const relativePath = currentWorkspaceRoot.value ? await invoke<string | null>('workspace_relative_target', { path }) : null
      if (relativePath !== null) {
        if (fileKind(relativePath) === 'unsupported') { notify(t('不支持打开此格式，请选择 Markdown、纯文本、Word（DOCX）或 PDF')); return }
        const item: Doc = { id: `local:opened:${crypto.randomUUID()}`, workspaceRoot: currentWorkspaceRoot.value, workspaceRelativePath: relativePath, absolutePath: path, path: `${currentDirectory.value}/${relativePath}`, relativePath, content: '', loaded: false, updated: Date.now() }
        docs.value.push(item)
        await selectDoc(item.id)
        showRecentFiles.value = false; showNewMenu.value = false
        return
      }
    } catch (error) { notify(t('打开文件失败：{0}', { "0": String(error) })); return }
    try {
      await deps.beforeWorkspaceChange?.()
      await flushDrafts()
      const opened = await invoke<{ workspace: WorkspaceInfo; relativePath: string }>('open_document_path', { path })
      applyWorkspace(opened.workspace, opened.relativePath)
      nativeRecentDirs.value = await invoke<string[]>('list_recent_workspaces')
      showRecentFiles.value = false
      showNewMenu.value = false
      return
    } catch (error) { return notify(t('打开最近文件失败：{0}', { "0": String(error) })) }
    finally { deps.afterWorkspaceChange?.() }
  }
  if (!doc) return notify(t('文件不可用，可从最近打开记录中移除'))
  const directory = doc.path.split('/')[0]
  if (!isTauri && currentDirectory.value !== '我的文件' && currentDirectory.value !== directory) currentDirectory.value = directory
  await selectDoc(doc.id)
  showRecentFiles.value = false
  showNewMenu.value = false
}
function toggleRecentPin(path: string) { recentFiles.value = recentFiles.value.map(item => item.path === path ? { ...item, pinned: !item.pinned } : item) }
watch(recentFiles, files => localStorage.setItem('markart-recent-files', JSON.stringify(files)), { deep: true, immediate: true })
watch([recentDirectories, orderedRecentFiles], () => {
  if (isTauri) void invoke('sync_recent_menus', { folders: recentDirectories.value, files: orderedRecentFiles.value.map(item => item.path) }).catch(error => notify(t('最近打开菜单更新失败：{0}', { "0": String(error) })))
}, { immediate: true })
function clearRecentFiles() {
  recentFiles.value = recentFiles.value.filter(item => item.pinned)
}
async function clearRecentFolders() {
  if (isTauri) {
    try { await invoke('clear_recent_workspaces', { keep: pinnedRecentFolders.value }) }
    catch (error) { notify(t('清空最近文件夹失败：{0}', { "0": String(error) })); return }
  }
  nativeRecentDirs.value = nativeRecentDirs.value.filter(path => pinnedRecentFolders.value.includes(path))
}
async function clearRecentOpen() {
  clearRecentFiles()
  await clearRecentFolders()
  showNewMenu.value = false
}
async function toggleFileHub(anchor?: HTMLElement) {
  const trigger = anchor || document.querySelector<HTMLElement>('[data-topbar-id="files"]')
  if (trigger) {
    const bounds = trigger.getBoundingClientRect()
    fileHubPosition.value = { left: Math.max(8, Math.min(bounds.left, window.innerWidth - 346)), top: bounds.bottom + 6 }
  }
  showNewMenu.value = !showNewMenu.value
  showSortMenu.value = false
  if (showNewMenu.value && isTauri) {
    try { nativeRecentDirs.value = await invoke<string[]>('list_recent_workspaces') }
    catch (error) { notify(t('最近文件夹读取失败：{0}', { "0": String(error) })) }
  }
}
watch([search, currentWorkspaceRoot, docs], ([query, root], previous) => {
  if (searchTimer) clearTimeout(searchTimer)
  const request = ++searchRequest
  if (!previous || query !== previous[0] || root !== previous[1]) searchResults.value = {}
  if (!isTauri || !currentWorkspaceRoot.value || !query.trim()) return
  searchTimer = setTimeout(async () => {
    try {
      const terms = [...new Set(searchGroups(query).flat())]
      const results = await Promise.all(terms.map(async term => {
        const matches = await invoke<{ relativePath: string; snippet: string | null }[]>('search_documents', { query: term, root })
        return [term, Object.fromEntries(matches.map(item => [item.relativePath, item.snippet]))] as const
      }))
      if (request !== searchRequest) return
      searchResults.value = Object.fromEntries(results)
    } catch (error) { if (request === searchRequest) notify(t('搜索失败：{0}', { "0": String(error) })) }
  }, 180)
})
const filteredDocs = computed(() => docs.value.filter(d => {
  if (d.temporary || (isTauri && d.workspaceRoot && d.workspaceRoot !== currentWorkspaceRoot.value)) return false
  if (utf8Only.value && !(d.utf8 ?? (!isTauri && d.openable !== false))) return false
  if (currentDirectory.value !== '我的文件' && !d.path.startsWith(currentDirectory.value + '/')) return false
  const path = d.relativePath || relativePath(d), extension = extensionOf(path)
  if (excludeHidden.value && (d.hidden || hiddenPath(path))) return false
  if (excludeExtensionless.value && !extension) return false
  const extensions = requestedExtensions(fileExtensions.value)
  if (extensions.length || includeExtensionless.value) {
    const matches = extensions.includes(extension) || (extension === 'docx' && extensions.includes('doc'))
    if (!matches && !(includeExtensionless.value && !extension)) return false
  }
  const groups = searchGroups(search.value), haystack = `${d.path}\n${d.content || ''}`.toLowerCase()
  return !groups.length || groups.some(group => group.every(term => haystack.includes(term) || (!d.loaded && !!d.relativePath && d.relativePath in (searchResults.value[term] || {}))))
}).sort((a, b) => compareDocuments(a, b, sortMode.value)))
const documentExcerpts = computed<Record<string, DocumentExcerpt>>(() => Object.fromEntries(filteredDocs.value.map(doc => {
  const terms = searchGroups(search.value).flat(), term = terms.find(term => (doc.content || '').toLowerCase().includes(term) || !!doc.relativePath && doc.relativePath in (searchResults.value[term] || {})) || terms[0] || ''
  const snippet = !doc.loaded && doc.relativePath ? searchResults.value[term]?.[doc.relativePath] || undefined : undefined
  return [doc.id, documentExcerpt(doc.content, doc.loaded ? '' : doc.excerpt || '', term, snippet)]
})))
function relativePath(doc: Doc) { return currentDirectory.value === '我的文件' ? doc.path : doc.path.slice(currentDirectory.value.length + 1) }
type TreeRow = { kind: 'folder'; path: string; depth: number } | { kind: 'file'; path: string; depth: number; doc: Doc }
const treeRows = computed<TreeRow[]>(() => {
  const directoryPaths = new Set<string>(isTauri && !hideEmptyFolders.value ? workspaceDirectories.value.filter(path => !excludeHidden.value || !hiddenPath(path)) : [])
  for (const doc of filteredDocs.value) {
    const parts = relativePath(doc).split('/')
    for (let index = 1; index < parts.length; index++) directoryPaths.add(parts.slice(0, index).join('/'))
  }
  const rows: TreeRow[] = []
  function visit(parent: string, depth: number) {
    const children = [...directoryPaths]
      .filter(path => path.split('/').slice(0, -1).join('/') === parent)
      .sort((a, b) => compareFolders(a, b, filteredDocs.value, sortMode.value, doc => relativePath(doc as Doc)))
    for (const path of children) {
      rows.push({ kind: 'folder', path, depth })
      if (search.value.trim() || folderExpanded.value[path]) visit(path, depth + 1)
    }
    for (const doc of filteredDocs.value.filter(doc => relativePath(doc).split('/').slice(0, -1).join('/') === parent)) rows.push({ kind: 'file', path: relativePath(doc), depth, doc })
  }
  visit('', 0)
  return rows
})
async function selectDirectory(directory: string) {
  if (isTauri) {
    if (currentWorkspaceRoot.value && dirtyIds.value.length) try {
      const relativePath = await invoke<string | null>('workspace_relative_target', { path: directory })
      if (relativePath !== null) {
        const parts = relativePath.split('/').filter(Boolean)
        for (let index = 1; index <= parts.length; index++) folderExpanded.value[parts.slice(0, index).join('/')] = true
        deps.revealFolder?.(relativePath)
        showNewMenu.value = false
        return
      }
    } catch (error) { notify(t('打开文件夹失败：{0}', { "0": String(error) })); return }
    if (deps.openLocalDirectory) { try { await deps.openLocalDirectory(directory) } catch (error) { notify(t('打开文件夹失败：{0}', { '0': String(error) })) }; return }
    try { await deps.beforeWorkspaceChange?.(); applyWorkspace(await invoke<WorkspaceInfo>('activate_workspace', { path: directory })); nativeRecentDirs.value = await invoke<string[]>('list_recent_workspaces') }
    catch (error) { notify(t('重新打开文件夹失败：{0}', { "0": String(error) })) }
    finally { deps.afterWorkspaceChange?.() }
    return
  }
  currentDirectory.value = directory
  const first = docs.value.find(doc => directory === '我的文件' || doc.path.startsWith(directory + '/'))
  if (first) selectDoc(first.id)
  folderExpanded.value[directory] = true
}

onBeforeUnmount(() => { if (searchTimer) clearTimeout(searchTimer) })
return { recentDirectories, orderedRecentFiles, activeAbsolutePath, recordRecentFile,
  openRecentFile, toggleRecentPin, clearRecentFiles, clearRecentFolders, clearRecentOpen, toggleFileHub,
  showFileFilter, utf8Only, includeExtensionless, excludeExtensionless, excludeHidden, hideEmptyFolders, fileExtensions, commonFileExtensions, selectedFileExtensions, toggleFileExtension, filterActive, filteredDocs, documentExcerpts, treeRows, selectDirectory }
}
