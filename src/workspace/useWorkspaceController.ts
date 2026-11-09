import { rememberSettingsInput, runSettingsInputHistory, settingsEditable } from '../settings/inputHistory'
import { applyRetainedPluginChanges } from '../editor/pluginEdits'
import { resolveLinkPath } from '../editor/linkCompletion'
import { t } from '../i18n'
import { dirtyMoveDocument, externalMoveLinkCount } from '../files/moveGuard'
import { computed, nextTick, onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue'
import { invoke } from '@tauri-apps/api/core'
import { check, type Update } from '@tauri-apps/plugin-updater'
import { listen, type UnlistenFn } from '@tauri-apps/api/event'
import { getAllWindows, getCurrentWindow } from '@tauri-apps/api/window'
import CodeEditor from '../CodeEditor.vue'
import { pluginRuntime } from '../plugins/runtime'
import { headingsOf } from '../editor/markdownCore'
import { fileKind, formatLabel } from '../files/fileFormats'
import { SettingsStore } from '../settings/settings'
import { DEFAULT_THEME } from '../settings/defaults'
import { useTopbarDrag, reorderTopbarItems } from './useTopbarDrag'
import { usePreferences } from '../settings/usePreferences'
import { useMarkdownPreview } from '../editor/useMarkdownPreview'
import { zoomShortcutDirection, stepZoom } from '../settings/zoomControls'
import { templateVariables } from '../documents/personalItems'
import { eventChord, formatChord, matchingShortcut } from '../settings/shortcuts'
import { useShortcutSettings } from '../settings/useShortcutSettings'
import { normalizeTopbar, placeTopbar, topbarCommands, visiblePinnedTopbarItems, type TopbarLayout } from './topbar'
import { useDocumentExport } from '../documents/useDocumentExport'
import { usePersonalItems } from '../documents/usePersonalItems'
import { useGitHistory } from '../sync/useGitHistory'
import { useFileResources } from '../files/useFileResources'
import { useDocumentSafety } from '../files/useDocumentSafety'
import { useFileTreeActions } from '../files/useFileTreeActions'
import { useFileNavigator } from '../files/useFileNavigator'
import { useLocalWorkspace, type WorkspaceInfo } from '../files/useLocalWorkspace'
import { useSplitScroll } from '../editor/useSplitScroll'
import { useEditorActions } from '../editor/useEditorActions'
import { useDocumentTools } from '../documents/useDocumentTools'
import { useSpellcheck } from '../documents/useSpellcheck'
import { useWorkspaceLayout, useWorkspaceTabs } from './useWorkspaceShell'
import { useCloudSync } from '../sync/useCloudSync'
import { type Doc } from './sample'
import { createUntitledDocument } from '../documents/untitledDocument'
import { RecentModifiedIcon } from '../files/icons'
import { ArrowDownAZ, ArrowUpZA, FilePlus2 } from 'lucide-vue-next'
import { useWorkspaceCommands } from './useWorkspaceCommands'
import { useLanShare } from '../documents/useLanShare'

export function useWorkspaceController() {
type Mode = 'wysiwyg' | 'source' | 'split'
type SideView = 'tree' | 'list'
type SortMode = 'modifiedDesc' | 'createdDesc' | 'nameAsc' | 'nameDesc'
const isTauri = '__TAURI_INTERNALS__' in window || location.protocol === 'tauri:'
const detachedFileWindow = isTauri && (getCurrentWindow().label !== 'main' || new URLSearchParams(location.search).has('openFile'))
const storeKey = detachedFileWindow ? `markart-window-${getCurrentWindow().label}` : 'markart-prototype-v1'
const windowStateStorage = detachedFileWindow ? sessionStorage : localStorage
const isMac = /Mac/i.test(navigator.platform)
const saved = (() => { if (detachedFileWindow) return {}; try { return JSON.parse(windowStateStorage.getItem(storeKey) || '{}') } catch { return {} } })()
const settingsStore = new SettingsStore(localStorage, saved)
const settingsRevision = ref(0)
const workspaceSwitching = ref(false)
const startupDocument = { ...createUntitledDocument(), startupPlaceholder: true }
const docs = ref<Doc[]>(isTauri ? [startupDocument] : saved.docs?.length ? saved.docs : [startupDocument])
const dirtyIds = ref<string[]>(isTauri ? [] : saved.dirtyIds || [])
const folderInput = ref<HTMLInputElement | null>(null)
const activeId = ref<string>(isTauri ? startupDocument.id : saved.activeId || docs.value[0].id)
const mode = ref<Mode>(isTauri && settingsStore.get('startupBehavior') === 'blank' ? 'wysiwyg' : saved.mode || 'wysiwyg')
let markdownMode: Mode = saved.markdownMode || mode.value
const { sidebar, sidebarWidth, previewWidth, previewWidthCustomized, outlineOpen, startResize, stopResize,
  applyLayoutSettings } = useWorkspaceLayout({ settingsStore, settingsRevision, mode, notify })
const sideView = ref<SideView>(saved.sideView || 'tree')
const currentDirectory = ref<string>(isTauri ? '未打开文件夹' : saved.currentDirectory || '我的文件')
const currentWorkspaceRoot = ref('')
const folderExpanded = ref<Record<string, boolean>>({ '写作计划': true, '随笔': true })
const { openTabs, draggedTabId, tabContext, tabDocs, closeTab, dropTab, closeTabs,
  locateTabFile } = useWorkspaceTabs({ docs, dirtyIds, activeId, sidebar, sideView, folderExpanded,
  selectDoc: id => selectDoc(id), confirmClose: id => confirmCloseTab(id) })
if (docs.value.some(doc => doc.id === startupDocument.id)) openTabs.value = [startupDocument.id]
const nativeRecentDirs = ref<string[]>([])
const pinnedRecentFolders = ref<string[]>((() => { try { const value = JSON.parse(localStorage.getItem('markart-pinned-folders') || '[]'); return Array.isArray(value) ? value.filter((path): path is string => typeof path === 'string') : [] } catch { return [] } })())
watch(pinnedRecentFolders, paths => localStorage.setItem('markart-pinned-folders', JSON.stringify(paths)), { deep: true })
function toggleRecentFolderPin(path: string) { pinnedRecentFolders.value = pinnedRecentFolders.value.includes(path) ? pinnedRecentFolders.value.filter(item => item !== path) : [...pinnedRecentFolders.value, path] }
type RecentFile = { path: string; openedAt: number; pinned?: boolean }
const persistedRecentFiles = (() => { try { const value = localStorage.getItem('markart-recent-files'); return value === null ? null : JSON.parse(value) } catch { return null } })()
const recentFiles = ref<RecentFile[]>((Array.isArray(persistedRecentFiles) ? persistedRecentFiles : Array.isArray(saved.recentFiles) ? saved.recentFiles : []).filter((item: RecentFile) => typeof item.path === 'string' && (!isTauri || item.path.startsWith('/'))).slice(0, 10))
const showRecentFiles = ref(false)
const showSortMenu = ref(false)
const {
  useSetting, quickCaptureEnabled, quickCaptureCorner, menuBarIconVisible, showSettings, showThemes, settingsSearchInput, settingTab, settingSearch,
  settingCategoryNames, settingCategoryTitle, pluginSettingCategories, settingSearchResults, openSettingSearchResult, settingVisible,
  themeName, themeNameInput, allThemes,
  restoreDefaultTheme, selectTheme, addTheme, removeTheme, resetAllSettings,
  templates, snippets, shortcutOverrides, spellcheckEnabled, fontSize, editorAlignment,
  lineHeight, paragraphSpacing, tableWidth, attachmentDirectory, gitEnabled, gitMaxVersions, gitRetentionDays,
  zoom, focusMode, typewriter, wrapLines, externalFileChanges, diagramVisualEditing, bodyLineNumbers, codeBlockLineNumbers, exportFontFamily, exportPageSize,
  exportPageWidth, exportPageHeight, exportMarginPreset, exportMargin, systemFonts,
  loadSystemFonts, fontSizeInput, editorFontFamilyInput, lineHeightInput, indentInput,
  attachmentDirectoryInput, clipboardDirectory, attachmentNaming, startupBehavior,
  language, localeOptions, autoCheckUpdates, zoomInput, wrapLinesInput, sidebarOpenInput,
  tabViewEnabled, toolbarEnabled, outlineOpenInput, sidebarLayout, sidebarTop, editorTop,
  editorLayoutPreview, previewEditorLayout, effectiveFontSize, effectiveLineHeight, effectiveParagraphSpacing, effectiveIndent,
  uiFontFamily, uiFontPreview, editorFontPreview, effectiveUiFontFamily, effectiveEditorFontFamily, fontsLoading,
  defaultEditorBusy, setDefaultEditor, zoomOptions,
} = usePreferences({ store: settingsStore, revision: settingsRevision,
  applyLayoutSettings, isTauri, notify })
const search = ref('')
const showSearch = ref(false)
const searchInput = ref<HTMLInputElement | null>(null)
function toggleWorkspaceSearch() {
  showSearch.value = !showSearch.value
  if (showSearch.value) void nextTick(() => searchInput.value?.focus())
}
const showCommands = ref(false)
const showExport = ref(false)
const showReference = ref(false)
const referenceTab = ref<'syntax' | 'shortcuts'>('syntax')
const showNewMenu = ref(false)
const showDirectorySync = ref(false)
const githubCreatingRepo = ref(false)
watch(showDirectorySync, open => {
  if (!open) { githubCreatingRepo.value = false; githubRepoDraft.value = ''; return }
  void loadGithubBinding(); void loadWebdavBinding()
  if (githubHasToken.value) void loadGithubRepos()
  if (webdavHasPassword.value) void loadWebdavFolders()
})
const fileHubPosition = ref({ left: 10, top: 44 })
const showSnippetMenu = ref(false)
const showInlineSnippetMenu = ref(false)
const { selectedPersonalId, personalContent, personalRenamingId, personalRenameDraft,
  personalRenameInput, personalItems, variableSyntax,
  editPersonalItem, addPersonalItem, updatePersonalItemContent, startPersonalRename,
  commitPersonalRename, removePersonalItem
} = usePersonalItems({ settingTab, templates, snippets })
const { shortcutGroups, recordingShortcutId, assignedChord, syncNativeMenuShortcuts,
  suspendNativeShortcuts, startShortcutRecording, cancelShortcutRecording, clearShortcut, recordShortcut, onShortcutRecordingKeydown
} = useShortcutSettings({ isTauri, shortcutOverrides, showSettings, settingTab, notify })
const { filteredHistoryVersions, historySearchBusy, historySearchError, historySearch, historySearchScope, filteredHistoryDiff, historyVersions, selectedHistory, selectedHistoryDiff, showHistory,
  historyBusy, lastGitFailure, openHistory, compareHistory, restoreHistory
} = useGitHistory({
  isTauri, activeDoc: computed(() => activeDoc.value), dirtyIds,
  conflictedIds: computed({ get: () => conflictedIds.value, set: value => { conflictedIds.value = value } }),
  gitEnabled: computed(() => gitEnabled.value), gitMaxVersions: computed(() => gitMaxVersions.value),
  gitRetentionDays: computed(() => gitRetentionDays.value), notify,
})
const utilityPopoverPosition = ref({ top: 58, left: 16 })
function positionUtilityPopover(anchor?: HTMLElement, width = 340) {
  if (!anchor) { utilityPopoverPosition.value = { top: 58, left: Math.max(8, window.innerWidth - width - 18) }; return }
  const rect = anchor.getBoundingClientRect()
  const scale = zoom.value / 100
  const viewportWidth = window.innerWidth / scale
  utilityPopoverPosition.value = { top: rect.bottom / scale + 8, left: Math.max(8, Math.min(rect.left / scale, viewportWidth - width - 8)) }
}
const syncConflictPolicy = useSetting('syncConflictPolicy')
const autoSyncEnabled = computed({
  get: () => { settingsRevision.value; return settingsStore.get('githubEnabled') || settingsStore.get('webdavEnabled') },
  set: (value: boolean) => {
    if (settingsStore.setMany({ githubEnabled: value, webdavEnabled: value })) settingsRevision.value++
    else notify(t('自动同步设置未保存'))
  },
})
const gitAvailable = ref(false)
const gitStatus = ref('')
const {
  webdavEnabled, webdavSyncIntervalSeconds, webdavRetryOnFailure, webdavUrl, webdavUsername,
  webdavBoundUrl, webdavFolderDraft, webdavFolders, webdavFoldersBusy, webdavBindingBusy,
  webdavPasswordDraft, webdavHasPassword, webdavBusy, webdavUnbindPendingRoot, webdavStatus,
  githubEnabled, githubSyncIntervalSeconds, githubRetryOnFailure, githubUsername,
  githubBoundUrl, githubRepos, githubRepoDraft, githubRepoBusy, githubTokenDraft, githubHasToken,
  githubBusy, githubUnbindPendingRoot, githubStatus, directorySyncAvailable, directorySyncUnbound, directorySyncBusy, directorySyncBound, directorySyncHint, runDirectorySync,
  loadGithubRepos, logoutGithub, loadGithubBinding, bindGithubRepo, createGithubRepo,
  unbindGithubRepo, storeGithubToken, runGithubSync, scheduleGithubSync,
  loadWebdavFolders, logoutWebdav, loadWebdavBinding, bindWebdavFolder,
  unbindWebdavFolder, storeWebdavPassword, runWebdavSync, scheduleWebdavSync,
} = useCloudSync({
  isTauri, contextChanging: workspaceSwitching, settings: { syncConflictPolicy, webdavEnabled: autoSyncEnabled, webdavSyncIntervalSeconds: useSetting('webdavSyncIntervalSeconds'), webdavRetryOnFailure: useSetting('webdavRetryOnFailure'), webdavUrl: useSetting('webdavUrl'), webdavUsername: useSetting('webdavUsername'), githubEnabled: autoSyncEnabled, githubSyncIntervalSeconds: useSetting('githubSyncIntervalSeconds'), githubRetryOnFailure: useSetting('githubRetryOnFailure'), githubUrl: useSetting('githubUrl'), githubUsername: useSetting('githubUsername') }, currentWorkspaceRoot, docs, dirtyIds,
  getConflictedIds: () => conflictedIds.value,
  refreshAfterSync: async () => { await refreshWorkspace(); await inspectActiveDocument() }, notify, showSettings, settingTab, showDirectorySync, githubCreatingRepo,
})
watch([quickCaptureEnabled, quickCaptureCorner, shortcutOverrides, recordingShortcutId], async ([enabled, corner, , recording]) => {
  if (!isTauri) return
  const chord = recording ? '' : assignedChord('quickCapture')
  const shortcut = chord ? chord.split('+').map(part => part === 'Meta' ? 'CommandOrControl' : part === 'Control' ? 'Ctrl' : part.replace(/^Key/, '').replace(/^Digit/, '')).join('+') : ''
  try { await invoke('set_quick_capture', { enabled, corner, shortcut }) }
  catch (error) { notify(t('快速记录启用失败：{0}', { '0': String(error) })); if (enabled) quickCaptureEnabled.value = false }
}, { immediate: true })
watch(menuBarIconVisible, async visible => {
  if (!isTauri) return
  try { await invoke('set_menu_bar_icon', { visible }) }
  catch (error) { notify(t('菜单栏图标设置失败：{0}', { '0': String(error) })); if (visible) menuBarIconVisible.value = false }
}, { immediate: true })
async function openQuickCapture() {
  if (!isTauri) { window.open('?quickCapture=1', '_blank'); return }
  try { await invoke('open_quick_capture') }
  catch (error) { notify(t('快速记录无法打开：{0}', { '0': String(error) })) }
}
watch([showSettings, settingTab], async ([visible, tab]) => {
  if (!visible || tab !== 'storage') return
  if (!isTauri) { gitStatus.value = '历史版本需要桌面版'; return }
  try { gitStatus.value = await invoke<string>('git_available'); gitAvailable.value = true }
  catch (error) { gitAvailable.value = false; gitStatus.value = `内置 Git 初始化失败：${String(error)}` }
})
const readOnlyMode = ref(false)
const effectiveReadOnlyMode = computed(() => readOnlyMode.value || workspaceSwitching.value)
const sidebarPanel = ref<'files' | 'outline'>('files')
const showTopbarMore = ref(false)
function collapseTopbars() { showTopbarMore.value = false }
function toggleTopbarMore() { showTopbarMore.value = !showTopbarMore.value }
const topbarLayout = computed(() => normalizeTopbar({ sidebarTop: [...sidebarTop.value, 'sidebar', 'settings', 'files'], editorTop: editorTop.value.filter(id => !['sidebar', 'settings', 'files'].includes(id)) }))
const trafficLightInset = ref(0)
async function updateTrafficLightInset() {
  if (!isTauri || !/Mac/i.test(navigator.platform)) return
  const window = getCurrentWindow()
  try {
    const fullscreen = await window.isFullscreen()
    trafficLightInset.value = fullscreen ? 0 : 95
  } catch { trafficLightInset.value = 0 }
}
const sidebarIconCount = computed(() => topbarLayout.value.sidebarTop.length)
const sidebarDisplayWidth = computed(() => Math.max(sidebarWidth.value, trafficLightInset.value + sidebarIconCount.value * 34 + 30))
const collapsedTopbarInset = computed(() => 10 + trafficLightInset.value + sidebarIconCount.value * 34 + 20)
let workspaceCommands: ReturnType<typeof useWorkspaceCommands>
function commandInfo(id: string) { return workspaceCommands.commandInfo(id) }
function commandIcon(id: string) { return workspaceCommands.commandIcon(id) }
function commandActive(id: string) { return workspaceCommands.commandActive(id) }
function commandTitle(id: string) { return workspaceCommands.commandTitle(id) }
function commandDisabled(id: string) { return workspaceCommands.commandDisabled(id) }
function activateTopbar(id: string, anchor?: HTMLElement) { workspaceCommands.activateTopbar(id, anchor) }
function performShortcut(action: Parameters<typeof workspaceCommands.performShortcut>[0]) { if (action === 'quickCapture') { if (quickCaptureEnabled.value) void openQuickCapture(); return } workspaceCommands.performShortcut(action) }
function handleNativeMenu(action: string) {
  if (showSettings.value && (action === 'edit-undo' || action === 'edit-redo')) {
    runSettingsInputHistory(action === 'edit-undo' ? 'undo' : 'redo')
    return
  }
  if (action === 'toggle-sidebar' && !sidebarAvailable.value) { syncNativeMenuChecks(); return }
  if (action === 'recent-files-clear') { clearRecentFiles(); return }
  if (action === 'recent-folders-clear') { void clearRecentFolders(); return }
  workspaceCommands.handleNativeMenu(action)
}
function saveTopbar(layout: TopbarLayout) {
  if (settingsStore.setMany(layout)) settingsRevision.value++
  else notify(t('菜单栏设置未保存'))
}
function onTopbarClick(event: MouseEvent, id: string) { activateTopbar(id, event.currentTarget as HTMLElement) }
const topbarMoreCommands = topbarCommands.filter(item => !['sidebar', 'settings', 'files', 'mode', 'snippets', 'search', 'tabs', 'outline', 'share', 'readOnly', 'focus', 'typewriter'].includes(item.id)).map(item => item.id)
function onTopbarMoreClick(event: MouseEvent, id: string) {
  if (commandDisabled(id)) return
  showTopbarMore.value = false
  if (id === 'files') sidebar.value = true
  activateTopbar(id, event.currentTarget as HTMLElement)
}
const pinnedTopbarCommands = ref<string[]>((() => {
  try {
    const saved = localStorage.getItem('markart-pinned-topbar-v1')
    if (saved === null) return [...topbarLayout.value.editorTop]
    const parsed = JSON.parse(saved)
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string' && (topbarMoreCommands.includes(id as typeof topbarMoreCommands[number]) || id.includes(':'))) : [...topbarLayout.value.editorTop]
  } catch { return [...topbarLayout.value.editorTop] }
})())
const pluginTopbarCommands = computed(() => pluginRuntime.actionsAt('topbar-menu', pluginRuntime.context({ location: 'topbar-menu' })).map(action => action.id))
const visiblePinnedTopbar = computed(() => visiblePinnedTopbarItems(pinnedTopbarCommands.value, topbarMoreCommands, pluginTopbarCommands.value))
const visibleTopbarCommands = computed(() => visiblePinnedTopbar.value.filter(id => !['readOnly','focus','typewriter'].includes(id)))
const { startTopbarDrag, suppressTopbarClick } = useTopbarDrag((area, id, before) => {
  if (area === 'editorTop') {
    pinnedTopbarCommands.value = reorderTopbarItems(pinnedTopbarCommands.value, id, before)
    localStorage.setItem('markart-pinned-topbar-v1', JSON.stringify(pinnedTopbarCommands.value))
  } else saveTopbar({ ...topbarLayout.value, sidebarTop: reorderTopbarItems(topbarLayout.value.sidebarTop, id, before) })
})
function toggleTopbarPin(id: string) {
  pinnedTopbarCommands.value = pinnedTopbarCommands.value.includes(id) ? pinnedTopbarCommands.value.filter(item => item !== id) : [...pinnedTopbarCommands.value, id]
  localStorage.setItem('markart-pinned-topbar-v1', JSON.stringify(pinnedTopbarCommands.value))
}
const editor = ref<InstanceType<typeof CodeEditor> | null>(null)
const previewEditor = ref<InstanceType<typeof CodeEditor> | null>(null)
function openDocumentFind() { editor.value?.openFind() }
const activeEditingPane = ref<'source' | 'preview'>('source')
const formattingEditor = computed(() => mode.value === 'split' ? editor.value : activeEditingPane.value === 'preview' ? previewEditor.value : editor.value)
const selectedText = ref('')
const selectionOffset = ref(0)
const selectedBlock = ref('p')
const selectedBlockLabel = computed(() => {
  if (selectedBlock.value === 'p') return '段落'
  if (/^h[1-6]$/.test(selectedBlock.value)) return t('标题 {0}', { '0': selectedBlock.value.slice(1) })
  return ({ 'code-block': '代码块', quote: '引用', list: '无序列表', 'ordered-list': '有序列表', 'task-list': '任务列表', table: '表格', formula: '公式块', mindmap: '脑图', mermaid: '流程图', footnote: '脚注', hr: '分割线', 'callout-tip': '提示框', 'callout-note': '备注框', 'callout-important': '重要提示框', 'callout-warning': '警告框', 'callout-caution': '注意框' } as Record<string, string>)[selectedBlock.value] || '段落'
})
const showBlockMenu = ref(false)
const showCalloutMenu = ref(false)
const showBlockActions = ref(false)
const showTextStyleMenu = ref(false)
const showQuoteMenu = ref(false)
const showListMenu = ref(false)
const showImageMenu = ref(false)
let unlistenThemeReset: UnlistenFn | undefined
let unlistenViewMode: UnlistenFn | undefined
let unlistenMenuAction: UnlistenFn | undefined
const boldActive = ref(false)
const italicActive = ref(false)
const editorFocused = ref(false)
const workspaceDirectories = ref<string[]>([])
const selectedFolder = ref<string | null>(null)
const sortMode = ref<SortMode>(saved.sortMode === 'name' ? 'nameAsc' : saved.sortMode === 'updated' ? 'modifiedDesc' : saved.sortMode === 'modifiedAsc' ? 'createdDesc' : saved.sortMode || 'nameAsc')
const toast = ref('')

const emptyDoc: Doc = { id: '', path: '未打开文件夹/请选择文件夹', content: '', updated: 0 }
const activeDoc = computed(() => docs.value.find(d => d.id === activeId.value) || (tabViewEnabled.value && !activeId.value ? emptyDoc : docs.value[0] || emptyDoc))
const activeKind = computed(() => fileKind(activeDoc.value.path))
const markdownActive = computed(() => activeKind.value === 'markdown')
const outlineAvailable = computed(() => !!currentWorkspaceRoot.value || markdownActive.value)
const outlineVisible = computed(() => outlineAvailable.value && outlineOpen.value)
const sidebarAvailable = computed(() => !isTauri || !!currentWorkspaceRoot.value || outlineVisible.value)
const visibleSidebar = computed({
  get: () => sidebarAvailable.value && sidebar.value,
  set: (value: boolean) => { if (sidebarAvailable.value) sidebar.value = value },
})
watch(markdownActive, active => { if (!active) sidebarPanel.value = 'files' })
const content = computed({ get: () => activeDoc.value.content, set: value => {
  const doc = docs.value.find(d => d.id === activeDoc.value.id)
  if (!doc || doc.content === value) return
  doc.content = value
  doc.updated = Date.now()
  if (isTauri && doc.loaded && doc.relativePath && doc.diskContent === value) {
    dirtyIds.value = dirtyIds.value.filter(id => id !== doc.id)
    clearDraftFor(doc)
  } else { markDirty(doc.id); queueDraft(doc) }
} })
const {
  outlineAllCollapsed, collapsedOutlineHeadings, onHeadingFoldsChange, toggleAllOutlineSections, toggleOutlineHeading,
  imagePropertyDraft, activeImageWidths, openImageProperties, saveImageProperties,
  draggedHeadingIndex, outlineDropTarget, startOutlineDrag, clickOutlineHeading,
} = useDocumentTools({
  isTauri, currentWorkspaceRoot, docs, activeDoc, activeId, content, markdownActive,
  selectedText, selectionOffset, editor, previewEditor,
  selectDoc: id => selectDoc(id), jumpHeading: index => jumpHeading(index), notify,
})
const { spellDictionaries, dictionaryFiles, dictionaryRawDic, dictionaryRawAff,
  dictionaryBusy, refreshSpellDictionaries, importSpellDictionary, downloadSpellDictionary,
  deleteSpellDictionary, spellResults, showSpellcheck, checkSpelling, locateMisspelling
} = useSpellcheck({ spellcheckEnabled, activeId, content, editor, notify })
const { imageData } = useMarkdownPreview({ isTauri, activeDoc, activeId, content })
const { showShare, shareBusy, shareUrl, shareQr, toggleShare, stopShare, copyShareUrl } = useLanShare({
  workspaceRoot: computed(() => activeDoc.value.workspaceRoot || ''), isTauri, activeId, content, title: computed(() => activeDoc.value.path.split('/').pop() || '未命名文件'),
  markdown: markdownActive, relativePath: computed(() => activeDoc.value.relativePath || ''), imageData, notify,
})
watch(showExport, open => { if (!open && (showShare.value || shareBusy.value)) void stopShare() })
const shareAvailable = computed(() => isTauri && !!activeId.value)
const outline = computed(() => markdownActive.value ? headingsOf(content.value).map((heading, id) => ({ ...heading, id })) : [])
const hiddenOutlineHeadings = computed(() => {
  const hidden = new Set<number>()
  const folded = new Set(collapsedOutlineHeadings.value)
  const parents: { level: number; collapsed: boolean }[] = []
  outline.value.forEach((heading, index) => {
    while (parents.length && parents[parents.length - 1].level >= heading.level) parents.pop()
    if (parents.some(parent => parent.collapsed)) hidden.add(index)
    parents.push({ level: heading.level, collapsed: folded.has(index) })
  })
  return hidden
})
const words = computed(() => content.value.replace(/[#*`>\[\]()!|\-]/g, '').trim().replace(/\s+/g, '').length)
const customCss = computed(() => {
  const selectedTheme = allThemes.value.find(t => t.name === themeName.value) || allThemes.value.find(theme => theme.name === DEFAULT_THEME)
  const css = selectedTheme?.css || ''
  if (selectedTheme?.folderId) return css
  return /@import\b|url\s*\(|image-set\s*\(|expression\s*\(/i.test(css) ? '' : css
})
watch([themeName, allThemes], () => {
  const selected = allThemes.value.find(theme => theme.name === themeName.value)
  if (selected) localStorage.setItem('markart-quick-capture-theme', JSON.stringify({ name: selected.name, css: customCss.value }))
}, { immediate: true })
const { scrollSyncGate, claimUserScroll, syncScroll, onPreviewEditorScroll } = useSplitScroll({ mode })
const { activeFormatIds, onEditorBlur, onEditorSelection, onToolbarMouseDown,
  copyCurrentBlock, pastePlainBlock, pasteBlock, applyBlockStyle,
  format, setMode, modeLabel, nextModeLabel, cycleMode, jumpHeading
} = useEditorActions({ isTauri, editor, formattingEditor, activeEditingPane,
  selectedText, selectionOffset, selectedBlock, boldActive, italicActive,
  editorFocused, showBlockMenu, showBlockActions, mode, markdownActive,
  activeDoc, attachmentNaming, attachmentDirectory, scrollSyncGate,
  setMarkdownMode: value => { markdownMode = value }, notify })
let customStyle: HTMLStyleElement | undefined
const sortOptions = [
  { value: 'modifiedDesc' as const, get label() { return t('最近修改') }, icon: RecentModifiedIcon },
  { value: 'createdDesc' as const, get label() { return t('创建时间') }, icon: FilePlus2 },
  { value: 'nameAsc' as const, get label() { return t('名称 A → Z') }, icon: ArrowDownAZ },
  { value: 'nameDesc' as const, get label() { return t('名称 Z → A') }, icon: ArrowUpZA }
]
const selectedSort = computed(() => sortOptions.find(option => option.value === sortMode.value) || sortOptions[0])
const { recentDirectories, orderedRecentFiles, activeAbsolutePath, recordRecentFile,
  openRecentFile, toggleRecentPin, clearRecentFiles, clearRecentFolders, clearRecentOpen, toggleFileHub,
  showFileFilter, utf8Only, includeExtensionless, excludeExtensionless, excludeHidden, hideEmptyFolders, fileExtensions, commonFileExtensions, selectedFileExtensions, toggleFileExtension, filterActive, filteredDocs, documentExcerpts, treeRows, selectDirectory
} = useFileNavigator({ isTauri, docs, activeDoc, recentFiles, pinnedRecentFolders, nativeRecentDirs,
  currentWorkspaceRoot, currentDirectory, search, sortMode, workspaceDirectories,
  folderExpanded, dirtyIds, showRecentFiles, showNewMenu, showSortMenu, fileHubPosition,
  openLocalFile: path => openFileAtPath(path), openLocalDirectory: path => openDirectoryPath(path), beforeWorkspaceChange, afterWorkspaceChange, revealFolder: () => { sidebar.value = true; sideView.value = 'tree' }, confirmUnsaved: confirmUnsavedDocuments, flushDrafts: () => flushDrafts(), applyWorkspace: (workspace, path) => applyWorkspace(workspace, path), selectDoc: id => selectDoc(id), notify })
type MovePreview = { token: string; links: { relativePath: string; changes: { line: number; before: string; after: string }[] }[] }
type MoveResult = { updated: { relativePath: string; content: string; version: string }[] }
const { missingResources, repairPreview, previewResourceRepair,
  applyResourceRepair, checkResources, locateMissingResource
} = useFileResources({ isTauri, currentWorkspaceRoot, activeDoc, activeId, docs, content, editor,
  askFileAction, selectDoc: id => selectDoc(id), notify })
async function waitWorkspaceReady() { while (workspaceSwitching.value) await new Promise(resolve => setTimeout(resolve, 20)) }
async function beforeWorkspaceChange() {
  await waitWorkspaceReady()
  workspaceSwitching.value = true
  while (directorySyncBusy.value || saveBusy.value && !activeDoc.value.temporary) await new Promise(resolve => setTimeout(resolve, 20))
  await flushDrafts()
  conflict.value = null
}
function afterWorkspaceChange() { workspaceSwitching.value = false }
const { conflict, conflictedIds, flushDrafts, queueDraft, reloadAfterConflict,
  keepCurrentEditing, clearDraftFor, resetConflicts, reportConflict, saveDoc, discardDoc, restoreExternalDrafts, inspectActiveDocument, saveBusy
} = useDocumentSafety({ refreshWorkspace: () => refreshWorkspace(), isTauri, docs, dirtyIds, activeDoc, activeId, notify, externalFileChanges, openTabs,
  currentWorkspaceRoot, gitEnabled, gitMaxVersions, gitRetentionDays, lastGitFailure,
  scheduleWebdavSync, scheduleGithubSync, saveTemporaryDoc: () => saveAs(), persist })
const closeTabDialog = ref<{ name: string; resolve: (choice: 'save' | 'discard' | null) => void } | null>(null)
let confirmingCloseTab = false
function finishCloseTab(choice: 'save' | 'discard' | null) {
  const dialog = closeTabDialog.value
  closeTabDialog.value = null
  dialog?.resolve(choice)
}
function tabFilePath(id: string) {
  const doc = docs.value.find(item => item.id === id)
  if (!doc || doc.temporary) return ''
  return doc.absolutePath || (doc.workspaceRoot && doc.workspaceRelativePath ? `${doc.workspaceRoot}/${doc.workspaceRelativePath}` : doc.relativePath && currentWorkspaceRoot.value ? `${currentWorkspaceRoot.value}/${doc.relativePath}` : '')
}
async function runTabFileAction(action: 'reveal' | 'copy', id: string) {
  tabContext.value = null
  const path = tabFilePath(id), doc = docs.value.find(item => item.id === id)
  if (!path || !doc) return
  try {
    if (action === 'copy') { await navigator.clipboard.writeText(path); notify(t('已复制')) }
    else {
      const root = doc.workspaceRoot || path.slice(0, path.lastIndexOf('/'))
      const relativePath = doc.workspaceRelativePath || doc.relativePath || path.slice(path.lastIndexOf('/') + 1)
      await invoke('reveal_workspace_item', { workspaceRoot: root, relativePath })
    }
  } catch (error) { notify(t('文件操作失败：{0}', { '0': String(error) })) }
}
function canReloadTab(id: string) { const doc = docs.value.find(item => item.id === id); return isTauri && !!(doc?.relativePath || doc?.workspaceRelativePath) && !doc?.temporary }
async function reloadTab(id: string) {
  tabContext.value = null
  const doc = docs.value.find(item => item.id === id)
  if (!isTauri || !doc || doc.temporary || !(doc.relativePath || doc.workspaceRelativePath)) return
  await selectDoc(id)
  if (!doc.relativePath || activeId.value !== id) return
  const item = { docId: id, disk: { changed: true, missing: false, content: null } }
  if (dirtyIds.value.includes(id)) { conflict.value = item; return }
  await reloadAfterConflict(item)
}
async function confirmCloseTab(id: string): Promise<string | null> {
  if (confirmingCloseTab || closeTabDialog.value) return null
  const doc = docs.value.find(item => item.id === id)
  if (!doc) return null
  showNewMenu.value = false
  showRecentFiles.value = false
  tabContext.value = null
  const name = doc.path.split('/').pop() || '未命名文件'
  confirmingCloseTab = true
  let choice: 'save' | 'discard' | null
  try {
    choice = isTauri && (isMac || /Win/i.test(navigator.platform))
      ? await invoke<'save' | 'discard' | null>('confirm_discard_changes', {
          title: `${t('保存对“')}${name}${t('”的修改？')}`,
          message: t('丢弃后，未保存的修改将丢失。'),
          saveLabel: t('保存'), cancelLabel: t('取消'), discardLabel: t('丢弃'),
          dark: getComputedStyle(document.querySelector('.app-shell') || document.documentElement).colorScheme.includes('dark'),
        })
      : await new Promise<'save' | 'discard' | null>(resolve => { closeTabDialog.value = { name, resolve } })
  } catch (error) { notify(t('关闭保护不可用：{0}', { '0': String(error) })); return null }
  finally { confirmingCloseTab = false }
  if (choice === 'discard') { await selectDoc(id); return await discardDoc(id) ? id : null }
  if (choice !== 'save') return null
  await selectDoc(id)
  if (activeId.value !== id) return null
  await saveDoc()
  const savedId = doc.temporary ? activeId.value : id
  return dirtyIds.value.includes(savedId) || (doc.temporary && savedId === id) ? null : savedId
}
let confirmingUnsaved = false
async function confirmUnsavedDocuments(onlyIds?: string[]): Promise<boolean> {
  if (confirmingUnsaved || confirmingCloseTab || closeTabDialog.value) return false
  confirmingUnsaved = true
  try {
    const ids = [...(onlyIds || dirtyIds.value)].sort((a, b) => Number(!!docs.value.find(doc => doc.id === a)?.temporary) - Number(!!docs.value.find(doc => doc.id === b)?.temporary))
    for (const id of ids) {
      if (!dirtyIds.value.includes(id)) continue
      if (!await confirmCloseTab(id)) return false
    }
    return !(onlyIds || dirtyIds.value).some(id => dirtyIds.value.includes(id))
  } finally { confirmingUnsaved = false }
}
const appUpdate = shallowRef<Update | null>(null)
const appUpdateStatus = ref('')
const appUpdateBusy = ref(false)
const appUpdateVersion = computed(() => appUpdate.value?.version || '')
async function checkAppUpdate(manual = false) {
  if (!isTauri || appUpdateBusy.value) return
  appUpdateBusy.value = true
  if (manual) appUpdateStatus.value = t('正在检查更新…')
  try {
    appUpdate.value = await check()
    appUpdateStatus.value = appUpdate.value ? t('发现新版本 {0}', { '0': appUpdate.value.version }) : manual ? t('已是最新版本') : ''
    if (appUpdate.value && !manual) notify(appUpdateStatus.value)
  } catch (error) {
    if (manual) appUpdateStatus.value = t('检查更新失败：{0}', { '0': String(error) })
  } finally { appUpdateBusy.value = false }
}
async function installAppUpdate() {
  const update = appUpdate.value
  if (!update || appUpdateBusy.value) return
  appUpdateBusy.value = true
  try {
    if ((await getAllWindows()).length > 1) {
      appUpdateStatus.value = t('请先关闭其他窗口，再安装更新')
      return
    }
    appUpdateStatus.value = t('正在下载更新…')
    await update.download()
    if (!await confirmUnsavedDocuments()) { appUpdateStatus.value = t('更新已下载'); return }
    await flushDrafts()
    persist()
    appUpdateStatus.value = t('正在安装更新…')
    await update.install()
    await invoke('restart_after_update')
  } catch (error) { appUpdateStatus.value = t('安装更新失败：{0}', { '0': String(error) }) }
  finally { appUpdateBusy.value = false }
}
onMounted(() => { if (isTauri && !detachedFileWindow && autoCheckUpdates.value) void checkAppUpdate() })
const fileDialog = ref<{ title: string; value: string; confirm: boolean; resolve: (value: string | null) => void } | null>(null)
async function moveWithLinks(from: string, to: string, root = currentWorkspaceRoot.value) {
  if (from === to) return
  const preview = await invoke<MovePreview>('preview_move_item', { workspaceRoot: root, from, to })
  const dirty = dirtyMoveDocument(docs.value.map(doc => ({ ...doc, relativePath: (!doc.workspaceRoot || doc.workspaceRoot === root) ? doc.workspaceRelativePath || doc.relativePath : undefined })), dirtyIds.value, from, preview.links)
  if (dirty) { notify(t('请先保存或丢弃“{0}”的修改，再移动文件', { "0": dirty.path.split('/').pop() })); return false }
  const result = await invoke<MoveResult>('move_item_with_links', { workspaceRoot: root, from, to, token: preview.token })
  applyWorkspaceMove(from, to, root)
  for (const updated of result.updated) {
    const doc = docs.value.find(item => (!item.workspaceRoot || item.workspaceRoot === root) && (item.workspaceRelativePath || item.relativePath) === updated.relativePath)
    if (!doc) continue
    doc.content = updated.content
    doc.diskContent = updated.content
    doc.version = updated.version
    doc.excerpt = updated.content.split(/\r?\n/).slice(0, 2).join(' ')
  }
  const rewrittenLinks = externalMoveLinkCount(from, preview.links)
  if (rewrittenLinks > 0) notify(t('已移动；更新 {0} 处本地引用', { "0": rewrittenLinks }))
  return true
}
async function openFileLink(target: string) {
  const source = activeDoc.value.relativePath || ''
  const path = resolveLinkPath(source, target)
  if (path === null) return
  const file = docs.value.find(doc => doc.relativePath === path)
  if (file && file.openable !== false) {
    try { await selectDoc(file.id) } catch (error) { notify(t('打开链接失败：{0}', { '0': String(error) })) }
    return
  }
  if (!isTauri) return
  try { await invoke('open_workspace_resource', { source, target }) }
  catch (error) { notify(t('打开链接失败：{0}', { '0': String(error) })) }
}
const inlineCreation = ref<{ kind: 'file' | 'folder'; parent: string; name: string; resolve: (name: string | null) => void } | null>(null)
function finishInlineCreation(accepted: boolean) {
  const pending = inlineCreation.value
  if (!pending) return
  inlineCreation.value = null
  pending.resolve(accepted ? pending.name.trim() || null : null)
}
watch(currentWorkspaceRoot, () => finishInlineCreation(false), { flush: 'sync' })
onBeforeUnmount(() => finishInlineCreation(false))
function askCreationName(kind: 'file' | 'folder', parent: string, name: string): Promise<string | null> {
  finishInlineCreation(false)
  sideView.value = 'tree'
  search.value = ''
  const parts = parent.split('/').filter(Boolean)
  for (let index = 1; index <= parts.length; index++) folderExpanded.value[parts.slice(0, index).join('/')] = true
  return new Promise(resolve => { inlineCreation.value = { kind, parent, name, resolve } })
}
function askFileAction(title: string, value = '', confirm = false): Promise<string | null> {
  return new Promise(resolve => { fileDialog.value = { title, value, confirm, resolve } })
}
function finishFileAction(accepted: boolean) {
  const dialog = fileDialog.value
  if (!dialog) return
  fileDialog.value = null
  dialog.resolve(accepted ? dialog.value.trim() : null)
}
let unlistenSystemFiles: (() => void) | undefined
let unlistenQuickCaptureFile: (() => void) | undefined
let systemFilesQueue = Promise.resolve()
function openSystemFiles() {
  systemFilesQueue = systemFilesQueue.then(async () => {
    const paths = await invoke<string[]>('take_system_files')
    for (const path of paths) await openRecentFile(path)
  }).catch(error => notify(t('打开文件失败：{0}', { "0": String(error) })))
  return systemFilesQueue
}
async function initializeSystemFiles() {
  if (startupBehavior.value === 'restore' || new URLSearchParams(location.search).has('openFile') || new URLSearchParams(location.search).has('openRoot')) await restoreRecentWorkspace()
  unlistenQuickCaptureFile = await listen<string>('markart-open-quick-capture-document', event => {
    void openFileAtPath(event.payload).catch(error => notify(t('打开文件失败：{0}', { '0': String(error) })))
  })
  unlistenSystemFiles = await listen('markart-open-files', () => { void openSystemFiles() })
  await openSystemFiles()
}
let unlistenClose: (() => void) | undefined
let closing = false
const { refreshWorkspace, closeWorkspace, applyWorkspace, applyWorkspaceMove, chooseFolder, openStorageDirectory,
  chooseFile, saveAs, openFolder, openFileAtPath, openDirectoryPath, restoreOpenTabs, selectDoc, newDoc, newTemporaryDoc, convertCurrentText,
  newFolder, manageItem
} = useLocalWorkspace({
  syncBusy: directorySyncBusy, contextChanging: workspaceSwitching, beforeWorkspaceChange, afterWorkspaceChange, waitWorkspaceReady, flushDrafts: () => flushDrafts(),
  isTauri, docs, dirtyIds, activeId, activeDoc, activeKind, content,
  currentWorkspaceRoot, currentDirectory, workspaceDirectories, openTabs,
  folderExpanded, folderInput, nativeRecentDirs, recentFiles, mode,
  selectedText, showNewMenu, selectedFolder,
  getTabPaths: root => currentWorkspaceRoot.value === root
    ? tabDocs.value.filter(doc => !doc.workspaceRoot || doc.workspaceRoot === root).map(doc => doc.workspaceRelativePath || doc.relativePath || '')
    : saved.tabRoot === root && Array.isArray(saved.tabPaths) ? saved.tabPaths : [],
  getMarkdownMode: () => markdownMode,
  resetHistoryForWorkspace: () => { historyVersions.value = []; selectedHistory.value = null; lastGitFailure.value = '' },
  closeHistory: () => { showHistory.value = false; selectedHistory.value = null },
  clearScrollSync: () => scrollSyncGate.clear(), resetConflicts, reportConflict,
  openTarget: async (path, folder) => { if (folder) await selectDirectory(path); else await openRecentFile(path) },
  recordRecentFile, markDirty, askFileAction, askCreationName, moveWithLinks, clearDraftFor, confirmUnsaved: confirmUnsavedDocuments, notify,
})
const workspaceClosed = ref(saved.workspaceClosed === true)
watch(currentWorkspaceRoot, root => { if (root) workspaceClosed.value = false })
async function closeFolder() {
  if (githubBusy.value || webdavBusy.value) return notify(t('同步完成后才能关闭文件夹'))
  if (await closeWorkspace()) { workspaceClosed.value = !currentWorkspaceRoot.value; search.value = ''; showDirectorySync.value = false; persist() }
}
let saveTimer: ReturnType<typeof setTimeout> | undefined
function markDirty(id: string) { if (!dirtyIds.value.includes(id)) dirtyIds.value = [...dirtyIds.value, id] }
function persist() {
  if (saveTimer) clearTimeout(saveTimer)
  saveTimer = undefined
  try {
    windowStateStorage.setItem(storeKey, JSON.stringify({ workspaceClosed: workspaceClosed.value, docs: isTauri ? [] : docs.value, dirtyIds: isTauri ? [] : dirtyIds.value, activeId: isTauri ? '' : activeId.value, lastFile: isTauri && activeDoc.value.relativePath ? `${currentWorkspaceRoot.value}/${activeDoc.value.relativePath}` : '', recentFiles: recentFiles.value, tabEntries: tabDocs.value.filter(doc => doc.workspaceRoot && doc.workspaceRelativePath && !doc.temporary).map(doc => ({ root: doc.workspaceRoot, path: doc.workspaceRelativePath })), activePath: activeDoc.value.absolutePath || '', tabRoot: currentWorkspaceRoot.value, tabPaths: tabDocs.value.map(doc => doc.relativePath).filter(Boolean), mode: mode.value, markdownMode, sidebar: sidebar.value, sidebarWidth: sidebarWidth.value, previewWidth: previewWidth.value, outlineOpen: outlineOpen.value, sideView: sideView.value, currentDirectory: isTauri ? '' : currentDirectory.value, sortMode: sortMode.value }))
  } catch { notify(t('窗口状态未保存，请检查可用存储空间')) }
}
watch([docs, dirtyIds, activeId, recentFiles, openTabs, mode, sidebar, sidebarWidth, previewWidth, outlineOpen, sideView, currentDirectory, sortMode], () => {
  if (saveTimer) clearTimeout(saveTimer)
  saveTimer = setTimeout(persist, 900)
}, { deep: true })

onMounted(() => { if (settingsStore.recovered) notify(t('偏好配置已恢复默认，原文件已保留')); window.addEventListener('keydown', onShortcutRecordingKeydown, true); window.addEventListener('keydown', onKeydown, true); window.addEventListener('focusin', rememberSettingsInput, true); window.addEventListener('input', rememberSettingsInput, true); window.addEventListener('pointerdown', closePopoversOutside, true); window.addEventListener('beforeunload', persist); if (isTauri) { void syncNativeMenuShortcuts(); syncNativeMenuChecks(); void initializeSystemFiles().catch(error => notify(t('文件打开入口不可用：{0}', { "0": String(error) }))).finally(restoreExternalDrafts); void listen('markart-reset-theme', restoreDefaultTheme).then(unlisten => { unlistenThemeReset = unlisten }).catch(error => notify(t('主题恢复入口不可用：{0}', { "0": String(error) }))); void listen<string>('markart-view-mode', event => setMode(event.payload as Mode)).then(unlisten => { unlistenViewMode = unlisten }).catch(error => notify(t('编辑视图菜单不可用：{0}', { "0": String(error) }))); void listen<string>('markart-menu-action', event => handleNativeMenu(event.payload)).then(unlisten => { unlistenMenuAction = unlisten }).catch(error => notify(t('系统菜单不可用：{0}', { "0": String(error) }))); void getCurrentWindow().onCloseRequested(async event => { event.preventDefault(); if (closing) return; closing = true; try { if (!await confirmUnsavedDocuments()) { closing = false; return } await flushDrafts(); persist(); await getCurrentWindow().destroy() } catch (error) { closing = false; notify(t('关闭前暂存失败：{0}', { "0": String(error) })) } }).then(unlisten => { unlistenClose = unlisten }).catch(error => notify(t('关闭保护不可用：{0}', { "0": String(error) }))) } customStyle = document.createElement('style'); customStyle.dataset.markartTheme = 'custom'; document.head.appendChild(customStyle); customStyle.textContent = customCss.value })
async function restoreRecentWorkspace() {
  if (new URLSearchParams(location.search).has('newWindow') && !new URLSearchParams(location.search).has('openRoot')) return
  if (saved.workspaceClosed && !new URLSearchParams(location.search).has('openRoot') && !new URLSearchParams(location.search).has('openFile')) return
  try {
    nativeRecentDirs.value = await invoke<string[]>('list_recent_workspaces')
    if (!new URLSearchParams(location.search).has('openRoot') && !new URLSearchParams(location.search).has('openFile') && Array.isArray(saved.tabEntries) && await restoreOpenTabs(saved.tabEntries, saved.activePath)) return
    const root = new URLSearchParams(location.search).get('openRoot') || nativeRecentDirs.value[0]
    if (root) { const workspace = await invoke<WorkspaceInfo>(new URLSearchParams(location.search).has('openRoot') ? 'open_workspace_path' : 'open_recent_workspace', { path: root }); applyWorkspace(workspace, new URLSearchParams(location.search).get('openFile') || (typeof saved.lastFile === 'string' && saved.lastFile.startsWith(workspace.root + '/') ? saved.lastFile.slice(workspace.root.length + 1) : undefined)) }
  } catch (error) { notify(t('最近文件夹无法打开：{0}', { "0": String(error) })) }
}
watch(customCss, css => { if (customStyle) customStyle.textContent = css })
onBeforeUnmount(() => { clearTimeout(menuChecksTimer); persist(); stopResize(); unlistenClose?.(); unlistenSystemFiles?.(); unlistenQuickCaptureFile?.(); unlistenThemeReset?.(); unlistenViewMode?.(); unlistenMenuAction?.(); window.removeEventListener('keydown', onShortcutRecordingKeydown, true); window.removeEventListener('keydown', onKeydown, true); window.removeEventListener('focusin', rememberSettingsInput, true); window.removeEventListener('input', rememberSettingsInput, true); window.removeEventListener('beforeunload', persist); window.removeEventListener('pointerdown', closePopoversOutside, true); customStyle?.remove() })
// Capture app shortcuts before CodeMirror keymaps (Mod-u otherwise undoes the selection).
function onKeydown(e: KeyboardEvent) {
  if (e.defaultPrevented || e.isComposing || e.key === 'Process') return
  if (showSettings.value && (e.metaKey || e.ctrlKey) && !e.altKey && e.code === 'KeyZ') {
    e.preventDefault(); e.stopPropagation()
    if (settingsEditable(e.target)) runSettingsInputHistory(e.shiftKey ? 'redo' : 'undo', e.target)
    return
  }
  const zoomDirection = zoomShortcutDirection(e)
  if (zoomDirection) { e.preventDefault(); zoom.value = stepZoom(zoom.value, zoomDirection); return }
  const chord = eventChord(e)
  const action = chord ? matchingShortcut(chord, shortcutOverrides.value) : null
  if (action) { e.preventDefault(); e.stopPropagation(); performShortcut(action); return }
  if (e.ctrlKey && !e.metaKey && !e.altKey && !e.shiftKey && e.code === 'KeyS') { e.preventDefault(); void saveDoc(); return }
  if (e.ctrlKey && !e.metaKey && !e.altKey && !e.shiftKey && e.code === 'KeyK') { e.preventDefault(); showCommands.value = !showCommands.value; return }
  if (e.key === 'Escape') { showTextStyleMenu.value = false; showFileFilter.value = false; showQuoteMenu.value = false; showImageMenu.value = false; if (showShare.value) void stopShare(); showTopbarMore.value = false; showDirectorySync.value = false; showBlockMenu.value = false; showCalloutMenu.value = false; showBlockActions.value = false; showListMenu.value = false; showSnippetMenu.value = false; showInlineSnippetMenu.value = false; showNewMenu.value = false; showCommands.value = false; showSettings.value = false; showExport.value = false; showReference.value = false; showSpellcheck.value = false; imagePropertyDraft.value = null; showThemes.value = false; showHistory.value = false; showRecentFiles.value = false; showSortMenu.value = false; itemActions.value = null }
}
function closePopoversOutside(event: PointerEvent) {
  const target = event.target as HTMLElement
  if (!target.closest('.file-filter-menu,.file-filter-trigger')) showFileFilter.value = false
  if (!target.closest('.tab-context-menu,.document-tab')) tabContext.value = null
  if (!target.closest('.new-item-menu,.new-menu-trigger')) showNewMenu.value = false
  if (!target.closest('.snippet-menu,.snippet-anchor')) showInlineSnippetMenu.value = false
  if (!target.closest('.block-style-menu,.block-style-wrap')) showBlockMenu.value = false
  if (!target.closest('.block-actions-menu,.block-actions-anchor')) showBlockActions.value = false
  if (!target.closest('.image-insert-anchor')) showImageMenu.value = false
  if (!target.closest('.text-style-anchor')) showTextStyleMenu.value = false
  if (!target.closest('.quote-style-anchor')) showQuoteMenu.value = false
  if (!target.closest('.list-style-menu,.list-style-anchor')) showListMenu.value = false
  if (!target.closest('.utility-popover,[data-topbar-id="snippets"],[data-topbar-id="spellcheck"],[data-topbar-id="export"]')) { showSnippetMenu.value = false; showSpellcheck.value = false }
  if (!target.closest('.item-actions-menu,.tree-manage')) itemActions.value = null
  if (!target.closest('.recent-files-menu,.recent-files-trigger')) showRecentFiles.value = false
  if (!target.closest('.sort-menu,.sort-trigger')) showSortMenu.value = false
  if (!target.closest('.topbar-more-menu,.topbar-overflow,.topbar-left-submenu')) collapseTopbars()
}
function notify(message: string) { toast.value = message; setTimeout(() => toast.value = '', 2600) }
const checkedMenuIds = computed(() => {
  const ids = new Set<string>([
    `view-${mode.value}`, ...(visibleSidebar.value ? ['toggle-sidebar'] : []), ...(outlineVisible.value ? ['toggle-outline'] : []),

    ...(toolbarEnabled.value ? ['toggle-toolbar'] : []), ...(typewriter.value ? ['toggle-typewriter'] : []),
    ...(focusMode.value ? ['toggle-focus'] : []), ...(readOnlyMode.value ? ['toggle-read-only'] : [])
  ])
  if (markdownActive.value) {
    const block = selectedBlock.value
    ids.add(/^h[1-6]$/.test(block) ? `paragraph-${block}` : block === 'p' ? 'paragraph-normal' : block.startsWith('callout-') ? `insert-${block}` : ({ quote: 'format-quote', list: 'format-unordered-list', 'ordered-list': 'format-ordered-list', 'task-list': 'format-task-list', 'code-block': 'format-code-block', table: 'paragraph-table', formula: 'paragraph-formula', mermaid: 'paragraph-mermaid' } as Record<string, string>)[block] || 'paragraph-normal')
    activeFormatIds.value.forEach(id => ids.add(id === 'inline-formula' ? 'format-inline-formula' : id))
  }
  return [...ids]
})
let menuChecksTimer: ReturnType<typeof setTimeout> | undefined
function syncNativeMenuChecks() {
  if (!isTauri) return
  clearTimeout(menuChecksTimer)
  menuChecksTimer = setTimeout(() => { void invoke('set_menu_checks', { checkedIds: checkedMenuIds.value, outlineEnabled: outlineAvailable.value }) }, 30)
}
watch([checkedMenuIds, outlineAvailable], syncNativeMenuChecks, { immediate: true })
const { fileDropTarget, fileDragGhost, suppressFileClick, startFileDrag,
  itemActions, runItemUtility, inlineRename, commitInlineRename,
  showItemActions, runItemAction
} = useFileTreeActions({ isTauri, currentWorkspaceRoot, workspaceDirectories,
  moveWithLinks, manageItem, notify })
const { exportBusy, download, prepareExport, exportRevision } = useDocumentExport({
  isTauri, activeDoc, content, markdownActive, fontSize, lineHeight, paragraphSpacing, tableWidth, exportFontFamily, exportPageSize,
  exportPageWidth, exportPageHeight, exportMargin, showExport, notify,
})

workspaceCommands = useWorkspaceCommands({
  notify,
  sidebar: visibleSidebar, sidebarAvailable, outlineAvailable, showSettings, showNewMenu, showSortMenu, showThemes, showReference, referenceTab,
  showExport, focusMode, showCommands, toolbarEnabled, typewriter,
  readOnlyMode, outlineOpen, showSnippetMenu, showSpellcheck, gitEnabled, spellcheckEnabled, markdownActive,
  mode, sideView, activeDoc, activeId, editor, formattingEditor, openDocumentFind, assignedChord,
  toggleFileHub, chooseFile, chooseFolder, closeFolder, toggleWorkspaceSearch, cycleMode, openHistory,
  checkSpelling, closeTab, saveAs, setMode, saveDoc, format, applyBlockStyle, copyCurrentBlock,
  newDoc, newFolder, manageItem, convertCurrentText, checkResources,
  openImageProperties,
  toggleAllOutlineSections, download, positionUtilityPopover, selectDirectory,
  openRecentFile, toggleShare: () => { showExport.value = true; if (!showShare.value) void toggleShare() }, shareAvailable,
})
const { shortcutGuide, commands } = workspaceCommands

onMounted(() => {
  if (!localStorage.getItem('markart-files-entry-migrated-v1')) {
    if (!topbarLayout.value.sidebarTop.includes('files') && !topbarLayout.value.editorTop.includes('files')) saveTopbar(placeTopbar(topbarLayout.value, 'files', 'sidebarTop'))
    localStorage.setItem('markart-files-entry-migrated-v1', '1')
  }
  void updateTrafficLightInset()
  window.addEventListener('resize', updateTrafficLightInset)
  window.addEventListener('blur', collapseTopbars)
  if (isTauri && startupBehavior.value !== 'restore') {
    void nextTick(() => editor.value?.focus())
    void invoke<string[]>('list_recent_workspaces').then(paths => { nativeRecentDirs.value = paths }).catch(error => notify(t('读取最近文件夹失败：{0}', { "0": String(error) })))
  }
})
onBeforeUnmount(() => { window.removeEventListener('resize', updateTrafficLightInset); window.removeEventListener('blur', collapseTopbars) })
// Context consumed by the preferences panel.
const preferencesContext = {
  isTauri,
  appUpdateBusy, appUpdateStatus, appUpdateVersion, checkAppUpdate, installAppUpdate,
  fileActionsAlwaysVisible: useSetting('fileActionsAlwaysVisible'),
  addTheme,
  editorLayoutPreview, previewEditorLayout,
  uiFontFamily, uiFontPreview, editorFontPreview, fontsLoading,
  defaultEditorBusy, setDefaultEditor, quickCaptureEnabled, quickCaptureCorner, menuBarIconVisible, openQuickCapture,
  autoSyncEnabled, syncConflictPolicy,
  templateVariables, addPersonalItem, allThemes, assignedChord, attachmentDirectoryInput,
  language, localeOptions, attachmentNaming, autoCheckUpdates, cancelShortcutRecording, clearShortcut, clipboardDirectory,
  commitPersonalRename, deleteSpellDictionary, dictionaryBusy,
  dictionaryFiles, dictionaryRawAff, dictionaryRawDic, downloadSpellDictionary,
  editPersonalItem, editorFontFamilyInput, editorAlignment, exportFontFamily, exportMargin, exportMarginPreset, exportPageHeight,
  exportPageSize, exportPageWidth, fontSizeInput, formatChord, gitAvailable,
  gitEnabled, gitMaxVersions, gitRetentionDays, gitStatus, githubBusy, githubEnabled,
  githubHasToken, githubRepoBusy, githubRetryOnFailure, githubSyncIntervalSeconds, githubTokenDraft, githubUsername,
  importSpellDictionary, paragraphSpacing, tableWidth, indentInput, externalFileChanges, diagramVisualEditing, bodyLineNumbers, codeBlockLineNumbers, lastGitFailure, lineHeightInput, loadSystemFonts,
  logoutGithub, logoutWebdav, openSettingSearchResult, openStorageDirectory, outlineOpenInput,
  personalContent, personalItems, personalRenameDraft, personalRenameInput, personalRenamingId,
  recordShortcut, recordingShortcutId, refreshSpellDictionaries, removePersonalItem, removeTheme, resetAllSettings,
  selectedPersonalId, settingCategoryTitle, pluginSettingCategories, settingCategoryNames, settingSearch, settingSearchResults, settingTab, settingVisible,
  suspendNativeShortcuts, syncNativeMenuShortcuts, settingsSearchInput, shortcutGroups, showSettings, sidebarLayout,
  sidebarOpenInput, spellDictionaries, spellcheckEnabled, startPersonalRename, startShortcutRecording, startupBehavior,
  storeGithubToken, storeWebdavPassword, systemFonts, tabViewEnabled, themeNameInput,
  updatePersonalItemContent, variableSyntax, webdavBindingBusy, webdavBusy, webdavEnabled, webdavHasPassword,
  webdavPasswordDraft, webdavRetryOnFailure, webdavSyncIntervalSeconds, webdavUrl, webdavUsername, wrapLinesInput,
  zoomInput, zoomOptions,
}
// Context consumed by the workspace regions.
const fileViewRevision = ref(0)
const workspaceUiContext = {
  fileActionsAlwaysVisible: useSetting('fileActionsAlwaysVisible'),
  notify,
  outlineRatio: useSetting('outlineRatio'),
  startTopbarDrag, suppressTopbarClick, selectedFolder,
  addTheme,
  download, exportBusy, activeAbsolutePath, activeDoc, activeId, activeKind, allThemes,
  tabFilePath, runTabFileAction, bindGithubRepo, bindWebdavFolder, chooseFile, chooseFolder, closeFolder, clearRecentOpen, clickOutlineHeading,
  closeTab, closeTabs, commandActive, commandDisabled, commandIcon, commandInfo, commandTitle,
  commitInlineRename, conflictedIds, createGithubRepo, currentDirectory, currentWorkspaceRoot, directorySyncAvailable, directorySyncUnbound,
  dirtyIds, docs, documentExcerpts, draggedHeadingIndex, directorySyncBusy, directorySyncBound, directorySyncHint, runDirectorySync,
  draggedTabId, dropTab, fileDropTarget, fileHubPosition,
  showFileFilter, utf8Only, includeExtensionless, excludeExtensionless, excludeHidden, hideEmptyFolders, fileExtensions, commonFileExtensions, selectedFileExtensions, toggleFileExtension, filterActive, filteredDocs, folderExpanded, folderInput, formatLabel, githubBoundUrl, githubBusy,
  githubCreatingRepo, githubEnabled, githubHasToken, githubRepoBusy, githubRepoDraft, githubRepos,
  githubStatus, githubUnbindPendingRoot, inlineRename, inlineCreation, finishInlineCreation, isMac, isTauri, itemActions,
  loadGithubRepos, loadWebdavFolders, locateTabFile, markdownActive, mode, readOnlyMode, modeLabel, newDoc, newTemporaryDoc, newFolder,
  nextModeLabel, onTopbarClick, onTopbarMoreClick, openFolder, openRecentFile, openTabs,
  orderedRecentFiles, outline, outlineAllCollapsed, collapsedOutlineHeadings, hiddenOutlineHeadings, outlineDropTarget, outlineOpen: outlineVisible, pinnedRecentFolders, pinnedTopbarCommands, topbarMoreCommands, visibleTopbarCommands, toggleTopbarPin,
  recentDirectories, recentFiles, removeTheme, runGithubSync, runItemAction, runItemUtility,
  runWebdavSync, search, searchInput, toggleWorkspaceSearch, selectDirectory, selectDoc, openFileLink, selectTheme,
  selectedSort, setMode, showDirectorySync, showItemActions: (path: string, event: MouseEvent) => { selectedFolder.value = path === '' || workspaceDirectories.value.includes(path) ? path : null; showItemActions(path, event) }, showNewMenu, showRecentFiles,
  showSearch, showSortMenu, showThemes, showTopbarMore, showShare, sideView, sidebar: visibleSidebar,
  sidebarDisplayWidth, sidebarLayout, sidebarPanel, outlineOpenInput, sortMode, sortOptions, startFileDrag,
  startOutlineDrag, suppressFileClick, canReloadTab, reloadTab, tabContext, tabDocs, tabViewEnabled, templates,
  focusMode, typewriter, themeName, toggleAllOutlineSections, toggleOutlineHeading, toggleRecentFolderPin, toggleRecentPin, toggleTopbarMore,
  topbarLayout, treeRows, unbindGithubRepo, unbindWebdavFolder, webdavBindingBusy, webdavBoundUrl,
  webdavBusy, webdavEnabled, webdavFolderDraft, webdavFolders, webdavFoldersBusy, webdavHasPassword,
  webdavStatus, webdavUnbindPendingRoot, webdavUsername, words, zoom, zoomOptions,
  fileViewRevision,
}

const pluginDocument = () => activeDoc.value.id ? { id: activeDoc.value.id, root: activeDoc.value.workspaceRoot||'', path: activeDoc.value.workspaceRelativePath||activeDoc.value.relativePath, content: content.value } : null
const pluginEditor = () => { const target = formattingEditor.value; if (!target) throw new Error('请先打开可编辑的文件'); return target }
/** What the file list currently shows, so plugins can follow the same scope instead of re-implementing filters. */
const pluginFileView = () => {
  const docsInView = (filteredDocs.value || []) as { path: string; relativePath?: string; workspaceRelativePath?: string }[]
  const files = docsInView.map(doc => doc.workspaceRelativePath || doc.relativePath || doc.path)
  const folders = [...new Set(files.flatMap(path => path.split('/').slice(0, -1).map((_, index, parts) => parts.slice(0, index + 1).join('/'))))]
  const activePath = activeDoc.value.workspaceRelativePath || activeDoc.value.relativePath || ''
  return {
    files,
    folders,
    selected: selectedFolder.value !== null
      ? { path: String(selectedFolder.value), kind: 'folder' as const }
      : activePath ? { path: activePath, kind: 'file' as const } : null,
    filter: { extensions: selectedFileExtensions.value, search: search.value.trim(), active: filterActive.value },
  }
}
// Only filter inputs and the file set matter here: watching filteredDocs would re-render plugin panels on every keystroke in the editor.
watch([docs, selectedFolder, currentWorkspaceRoot, search, utf8Only, includeExtensionless, excludeExtensionless, excludeHidden, hideEmptyFolders, fileExtensions], () => { fileViewRevision.value++ })
const unbindPluginHost = pluginRuntime.bind({
  mode: () => mode.value,
  openSidebar: () => { sidebar.value = true },
  openFile: (root, path) => openFileAtPath(`${root}/${path}`),
  openedFile: (root, path) => {
    const doc=docs.value.find(doc=>doc.loaded&&doc.workspaceRoot===root&&(doc.workspaceRelativePath||doc.relativePath)===path)
    if(!doc)return null
    const snapshot=pluginRuntime.documentSnapshot(doc.id)
    return snapshot?{...snapshot,active:doc.id===activeId.value}:null
  },
  fileOperation: async (operation, root, path, value) => {
    if(operation==='move'){if(!await moveWithLinks(path,String(value),root))throw new Error('目标文件或关联文件存在未保存的修改');return}
    if(operation==='trash'){
      const affected=docs.value.filter(doc=>doc.workspaceRoot===root&&(doc.workspaceRelativePath||doc.relativePath)===path)
      if(affected.some(doc=>dirtyIds.value.includes(doc.id)))throw new Error('请先保存或丢弃目标文件的修改')
      if(await askFileAction(`删除文件“${path}”？`,'',true)===null)throw new Error('已取消删除')
      await invoke('trash_item',{workspaceRoot:root,relativePath:path})
      const removed=new Set(affected.map(doc=>doc.id));docs.value=docs.value.filter(doc=>!removed.has(doc.id));openTabs.value=openTabs.value.filter(id=>!removed.has(id));if(removed.has(activeId.value))activeId.value=''
    }else if(operation==='mkdir')await invoke('create_folder',{workspaceRoot:root,relativePath:path})
    else if(operation==='create')await invoke('plugin_workspace_file',{root,path,operation:'create',content:String(value||'')})
    else throw new Error('不支持的文件操作')
    if(root===currentWorkspaceRoot.value)await refreshWorkspace()
  },
  fileView: pluginFileView,
  active: pluginDocument, list: () => docs.value.map(doc => ({ id: doc.id, root: doc.workspaceRoot||'', path: doc.workspaceRelativePath||doc.relativePath, content: doc.content })),
  open: async id => { if (!docs.value.some(doc => doc.id === id)) throw new Error('文件不存在，请刷新文件夹'); await selectDoc(id); await nextTick() },
  save: async () => { await saveDoc() }, selection: () => pluginEditor().pluginSelection(),
  applyEdits: (id, expectedContent, edits, selection) => {
    if(id===activeId.value)return formattingEditor.value?.applyPluginEdits(id,expectedContent,edits,selection)??'not-editable'
    const doc=docs.value.find(doc=>doc.id===id)
    if(!doc||doc.loaded===false||readOnlyMode.value)return 'not-editable'
    if(doc.content!==expectedContent)return 'stale-revision'
    const next=applyRetainedPluginChanges(id,expectedContent,edits,selection)
    if(next===null)return 'not-editable'
    doc.content=next;markDirty(id);queueDraft(doc);pluginRuntime.emit('document:change',{id:doc.id,root:doc.workspaceRoot||'',path:doc.workspaceRelativePath||doc.relativePath,content:next});return true
  },
  replace: (from, to, text) => pluginEditor().replaceRange(from, to, text), select: (from, to) => pluginEditor().selectRange(from, to - from),
  format: (command, value) => pluginEditor().format(command, value), undo: () => pluginEditor().undo(), redo: () => pluginEditor().redo(),
  root: () => currentWorkspaceRoot.value, shortcutOverrides: () => shortcutOverrides.value, notify, prompt: askFileAction,
  listThemes: () => allThemes.value.filter(theme => !theme.pluginId).map(theme => ({ id: theme.name, name: theme.name, css: theme.css })),
  currentTheme: () => themeName.value, selectTheme
})
watch(() => activeDoc.value.id, () => pluginRuntime.emit('document:open', pluginDocument()))
watch(content, () => pluginRuntime.emit('document:change', pluginDocument()), { flush: 'sync' })
watch(themeName, () => { try { const theme = allThemes.value.find(item => item.name === themeName.value); if (theme) pluginRuntime.emit('theme:change', { id: theme.name, name: theme.label || theme.name, css: theme.css, pluginId: theme.pluginId }) } catch { /* A removed theme is replaced during cleanup. */ } })
watch(currentWorkspaceRoot, root => pluginRuntime.emit('workspace:change', { root }))
watch([selectedText, selectionOffset], () => pluginRuntime.emit('selection:change', { from: selectionOffset.value, to: selectionOffset.value + selectedText.value.length, text: selectedText.value }))
watch(() => activeDoc.value.diskContent, () => { if (activeDoc.value.diskContent === content.value) pluginRuntime.emit('document:save', pluginDocument()) })
onMounted(() => { void pluginRuntime.restore().catch(error => notify(t('插件恢复失败：{0}', { "0": String(error) }))) })
onBeforeUnmount(() => { unbindPluginHost(); void pluginRuntime.dispose() })

  return {
    allThemes, selectTheme, removeTheme, showThemes, assignedChord, activeDoc, activeEditingPane, activeFormatIds, activeId, activeImageWidths, activeKind, addTheme, applyBlockStyle, applyResourceRepair,
    attachmentDirectory, attachmentNaming, boldActive, clipboardDirectory,
    collapsedTopbarInset, commandIcon, commandInfo, commands, compareHistory, conflict, conflictedIds, content, copyCurrentBlock, currentWorkspaceRoot, dirtyIds, docs, download,
    editor, editorFocused, editorFontFamily: effectiveEditorFontFamily, uiFontFamily: effectiveUiFontFamily, editorAlignment, exportBusy, prepareExport, exportRevision, fileDialog, fileDragGhost,
    closeTabDialog, finishCloseTab, finishFileAction, focusMode, fontSize: effectiveFontSize, format, formattingEditor,
    filteredHistoryVersions, historySearchBusy, historySearchError, historySearch, historySearchScope, filteredHistoryDiff, historyBusy, historyVersions, imageData, imagePropertyDraft,
    indent: effectiveIndent,
    isTauri, italicActive, keepCurrentEditing, lineHeight: effectiveLineHeight, paragraphSpacing: effectiveParagraphSpacing, tableWidth, diagramVisualEditing, bodyLineNumbers, codeBlockLineNumbers, locateMissingResource, locateMisspelling, markdownActive, missingResources, mode,
    workspaceDirectories, openFileLink, notify, onEditorBlur, onEditorSelection, onHeadingFoldsChange, onPreviewEditorScroll,
    onToolbarMouseDown, pasteBlock, pastePlainBlock, preferencesContext, previewEditor, previewResourceRepair,
    previewWidth, previewWidthCustomized, readOnlyMode: effectiveReadOnlyMode, referenceTab, reloadAfterConflict, repairPreview, restoreHistory, saveImageProperties, scrollSyncGate, claimUserScroll, selectedBlock, selectedBlockLabel, selectedHistory, selectedHistoryDiff, setMode, shortcutGuide, showBlockActions, showBlockMenu, showCalloutMenu,
    showCommands, showExport, showHistory, showInlineSnippetMenu, showShare, toggleShare, shareBusy, shareUrl, shareQr, stopShare, copyShareUrl,
    showTextStyleMenu, showQuoteMenu, showImageMenu, showListMenu, showReference, showSettings, showSnippetMenu, showSpellcheck,
    sidebar: visibleSidebar, snippets, spellResults, startResize, syncScroll, themeName, toast, toolbarEnabled,
    trafficLightInset, typewriter, utilityPopoverPosition, workspaceUiContext, wrapLines, zoom,
  }
}
