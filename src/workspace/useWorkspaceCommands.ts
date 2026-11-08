import { LockKeyhole } from 'lucide-vue-next'
import { t } from '../i18n'
import { computed, type Ref } from 'vue'
import { useCommandPalette } from './useCommandPalette'
import { invoke } from '@tauri-apps/api/core'
import type CodeEditor from '../CodeEditor.vue'
import type { Doc } from './sample'
import { formatChord, shortcuts, type ShortcutId } from '../settings/shortcuts'
import { topbarCommands } from './topbar'
import { PanelLeft, Search, Plus, FolderOpen, FilePlus2, Settings2, Palette, ArrowUp, Share2, Columns2, Code2, PenLine, History, Command, Focus, Type, CircleHelp, SpellCheck, PanelsTopLeft, ListCollapse } from 'lucide-vue-next'

type ViewMode = 'wysiwyg' | 'source' | 'split'
type SideView = 'tree' | 'list'
type ExportKind = 'html' | 'txt' | 'pdf' | 'docx' | 'png'

export type WorkspaceCommandDeps = {
  notify?: (message:string) => void
  outlineAvailable?: Readonly<Ref<boolean>>
  sidebarAvailable?: Readonly<Ref<boolean>>
  sidebar: Ref<boolean>; showSettings: Ref<boolean>; showNewMenu: Ref<boolean>
  showSortMenu: Ref<boolean>; showThemes: Ref<boolean>; showReference: Ref<boolean>
  referenceTab: Ref<'syntax' | 'shortcuts'>; showExport: Ref<boolean>
  focusMode: Ref<boolean>; showCommands: Ref<boolean>; toolbarEnabled: Ref<boolean>
  typewriter: Ref<boolean>; readOnlyMode: Ref<boolean>
  outlineOpen: Ref<boolean>; showSnippetMenu: Ref<boolean>
  showSpellcheck: Ref<boolean>; gitEnabled: Ref<boolean>
  spellcheckEnabled: Ref<boolean>; markdownActive: Readonly<Ref<boolean>>
  mode: Ref<ViewMode>; sideView: Ref<SideView>
  activeDoc: Readonly<Ref<Doc>>; activeId: Ref<string>
  editor: Ref<InstanceType<typeof CodeEditor> | null>
  formattingEditor: Readonly<Ref<InstanceType<typeof CodeEditor> | null>>
  closeFolder: () => Promise<unknown>
  openDocumentFind: () => void
  assignedChord: (id: ShortcutId) => string
  toggleFileHub: (anchor?: HTMLElement) => unknown
  chooseFile: () => unknown; chooseFolder: () => void
  toggleWorkspaceSearch: () => void; cycleMode: () => void
  openHistory: () => unknown; checkSpelling: () => unknown
  closeTab: (id: string) => void
  saveAs: () => unknown; setMode: (mode: ViewMode) => void; saveDoc: () => unknown
  copyCurrentBlock: (kind: 'markdown' | 'html' | 'image' | 'plain') => unknown
  format: (command: string) => unknown; applyBlockStyle: (style: string) => void
  newDoc: () => unknown; newFolder: () => unknown
  manageItem: (path: string, action: 'rename' | 'move' | 'trash') => unknown
  convertCurrentText: () => unknown; checkResources: (all: boolean) => unknown
    openImageProperties: () => void
  toggleAllOutlineSections: () => void; download: (kind: ExportKind) => unknown
  positionUtilityPopover: (anchor?: HTMLElement, width?: number) => void
  toggleShare: () => void; shareAvailable: Readonly<Ref<boolean>>
  selectDirectory: (path: string) => unknown; openRecentFile: (path: string) => unknown
}

export function useWorkspaceCommands(deps: WorkspaceCommandDeps) {
function newWindow() { void invoke('create_workspace_window').catch(error => deps.notify?.(t('新建窗口失败：{0}', { '0': String(error) }))) }
const {
  sidebar, showSettings, showNewMenu, showSortMenu, showThemes, showReference, referenceTab,
  showExport, focusMode, showCommands, toolbarEnabled, typewriter,
  readOnlyMode, outlineOpen, showSnippetMenu, gitEnabled, spellcheckEnabled, markdownActive,
  mode, sideView, activeId, editor, formattingEditor, openDocumentFind, assignedChord,
  toggleFileHub, chooseFile, chooseFolder, closeFolder, toggleWorkspaceSearch, cycleMode, openHistory,
  checkSpelling, closeTab, saveAs, setMode, saveDoc, format, applyBlockStyle,
  newDoc, download, positionUtilityPopover, selectDirectory,
  openRecentFile, toggleShare, shareAvailable,
} = deps
const topbarIcons: Record<string, unknown> = { sidebar: PanelLeft, settings: Settings2, files: FolderOpen, 'open-folder': FolderOpen, 'recent-files': History, search: Search, 'new-document': Plus, mode: PenLine, outline: ListCollapse, tabs: PanelsTopLeft, reference: CircleHelp, commands: Command, theme: Palette, export: ArrowUp, share: Share2, history: History, focus: Focus, typewriter: Type, readOnly: LockKeyhole, snippets: FilePlus2, spellcheck: SpellCheck,  }

function commandInfo(id: string) { return topbarCommands.find(item => item.id === id) }
function commandIcon(id: string) { return id === 'mode' ? mode.value === 'source' ? Code2 : mode.value === 'split' ? Columns2 : PenLine : topbarIcons[id] }
function commandActive(id: string) { return id === 'focus' ? focusMode.value : id === 'typewriter' ? typewriter.value : id === 'readOnly' ? readOnlyMode.value : false }
function commandTitle(id: string) {
  const item = commandInfo(id)
  const action = ({ 'open-folder': 'openFolder', 'recent-files': 'recentFiles', search: 'workspaceSearch', 'new-document': 'new' } as Record<string, ShortcutId>)[id] || id as ShortcutId
  const shortcut = shortcuts.some(entry => entry.id === action) ? formatChord(assignedChord(action)) : 'shortcut' in (item || {}) ? (item as { shortcut: string }).shortcut : ''
  return item ? `${id === 'sidebar' ? sidebar.value ? t('收起侧栏') : t('展开侧栏') : item.label}${shortcut ? ` ${shortcut}` : ''}` : id
}
function commandDisabled(id: string) {
  return (id === 'sidebar' && deps.sidebarAvailable?.value === false)
    || (id === 'mode' && !markdownActive.value)
    || (id === 'outline' && deps.outlineAvailable?.value === false)
    || (id === 'spellcheck' && !spellcheckEnabled.value)
    || (id === 'history' && !gitEnabled.value)
    || (id === 'share' && !shareAvailable.value)
}
function activateTopbar(id: string, anchor?: HTMLElement) {
  if (commandDisabled(id)) return
  if (['snippets', 'spellcheck'].includes(id)) positionUtilityPopover(anchor, 340)
  const actions: Record<string, () => void> = {
    sidebar: () => { sidebar.value = !sidebar.value }, settings: () => { showSettings.value = true }, files: () => { void toggleFileHub(anchor) },
    'open-folder': chooseFolder, 'recent-files': () => { sidebar.value = true; showNewMenu.value = !showNewMenu.value },
    search: toggleWorkspaceSearch, 'new-document': () => { sidebar.value = true; showNewMenu.value = !showNewMenu.value },
    mode: cycleMode, outline: () => { outlineOpen.value = !outlineOpen.value },  reference: () => { referenceTab.value = 'syntax'; showReference.value = true },
    commands: () => { showCommands.value = true }, theme: () => { showThemes.value = !showThemes.value },
    readOnly: () => { readOnlyMode.value = !readOnlyMode.value }, export: () => { showExport.value = true }, share: toggleShare, history: () => { void openHistory() }, focus: () => { focusMode.value = !focusMode.value }, typewriter: () => { typewriter.value = !typewriter.value },
    snippets: () => { showSnippetMenu.value = !showSnippetMenu.value }, spellcheck: () => { void checkSpelling() },
  }
  actions[id]?.()
}
function performShortcut(action: ShortcutId) {
  if (action === 'toggle-outline' && deps.outlineAvailable?.value === false) return
  if ((action === 'spellcheck' && !spellcheckEnabled.value)) return
  if (action.startsWith('heading')) { applyBlockStyle(action === 'heading0' ? 'p' : `h${action.slice(-1)}`); return }
  const actions: Partial<Record<ShortcutId, () => void>> = {
    sidebar: () => { sidebar.value = !sidebar.value }, settings: () => { showSettings.value = true }, openFile: () => { void chooseFile() }, openFolder: chooseFolder,
    history: () => { void openHistory() },
    recentFolders: () => { sidebar.value = true; showNewMenu.value = !showNewMenu.value }, recentFiles: () => { sidebar.value = true; showNewMenu.value = !showNewMenu.value },
    workspaceSearch: toggleWorkspaceSearch, find: openDocumentFind, sort: () => { showSortMenu.value = !showSortMenu.value }, new: () => { sidebar.value = true; showNewMenu.value = !showNewMenu.value }, newWindow: newWindow, closeFile: () => closeTab(activeId.value), saveAs: () => { void saveAs() }, mode: cycleMode, wysiwygView: () => setMode('wysiwyg'), sourceView: () => setMode('source'), splitView: () => setMode('split'),
    sideView: () => { sideView.value = sideView.value === 'tree' ? 'list' : 'tree' }, theme: () => { showThemes.value = !showThemes.value }, reference: () => { referenceTab.value = 'syntax'; showReference.value = true },
    export: () => { showExport.value = true }, focus: () => { focusMode.value = !focusMode.value }, commands: () => { showCommands.value = !showCommands.value }, save: () => { void saveDoc() }, spellcheck: () => { void checkSpelling() }, toggleToolbar: () => { toolbarEnabled.value = !toolbarEnabled.value },
    typewriter: () => { typewriter.value = !typewriter.value }, readOnly: () => { readOnlyMode.value = !readOnlyMode.value },
    outline: () => { if (deps.outlineAvailable?.value !== false) outlineOpen.value = !outlineOpen.value },
    inlineFormula: () => { void format('inline-formula') }, insertMermaid: () => applyBlockStyle('mermaid'), insertMindmap: () => applyBlockStyle('mindmap'),
    frontmatter: () => applyBlockStyle('frontmatter'), imageUrl: () => { void format('image-url') }, formatDocument: () => { void format('format-document') },
    copyMarkdown: () => { void deps.copyCurrentBlock('markdown') }, copyHtml: () => { void deps.copyCurrentBlock('html') },
    copyImage: () => { void deps.copyCurrentBlock('image') }, copyPlain: () => { void deps.copyCurrentBlock('plain') },
    bold: () => { void format('bold') }, italic: () => { void format('italic') }, strikethrough: () => { void format('strikethrough') }, underline: () => { void format('underline') }, inlineCode: () => { void format('code') }, clearFormat: () => applyBlockStyle('clear'), link: () => { void format('link') }, image: () => { void format('image') }, comment: () => { void format('comment') },
    quote: () => applyBlockStyle('quote'), unorderedList: () => applyBlockStyle('list'), orderedList: () => applyBlockStyle('ordered-list'), taskList: () => applyBlockStyle('task-list'), indentList: () => applyBlockStyle('indent'), outdentList: () => applyBlockStyle('outdent'), headingIncrease: () => applyBlockStyle('heading-increase'), headingDecrease: () => applyBlockStyle('heading-decrease'), table: () => applyBlockStyle('table'), codeBlock: () => applyBlockStyle('code'), formula: () => applyBlockStyle('formula'), footnote: () => applyBlockStyle('footnote'), calloutTip: () => applyBlockStyle('callout-tip'), calloutNote: () => applyBlockStyle('callout-note'), calloutImportant: () => applyBlockStyle('callout-important'), calloutWarning: () => applyBlockStyle('callout-warning'), calloutCaution: () => applyBlockStyle('callout-caution'), horizontalRule: () => applyBlockStyle('hr')
  }
  actions[action]?.()
}

const shortcutGuide = computed(() => [...shortcuts.map(item => ({ label: item.label, keys: formatChord(assignedChord(item.id)) })), { get label() { return t('插入块命令') }, keys: '/' }])

function handleNativeMenu(action: string) {
  if (action.startsWith('recent-folder:')) { void selectDirectory(action.slice('recent-folder:'.length)); return }
  if (action.startsWith('recent-file:')) { void openRecentFile(action.slice('recent-file:'.length)); return }
  if (action.startsWith('export-')) { void download(action.slice('export-'.length) as 'html' | 'txt' | 'pdf' | 'docx' | 'png'); return }
  const actions: Record<string, () => void> = {
    'file-new': () => newDoc(), 'file-open': () => { void chooseFile() }, 'folder-open': chooseFolder, 'folder-close': () => { void closeFolder() },
    'window-new': newWindow,
    'recent-folders': () => { sidebar.value = true; showNewMenu.value = true }, 'recent-files': () => { sidebar.value = true; showNewMenu.value = true },
    'file-close': () => closeTab(activeId.value), 'file-save': () => { void saveDoc() }, 'file-save-as': () => { void saveAs() },
    'file-export': () => { positionUtilityPopover(); showExport.value = true }, 'file-share': toggleShare, 'edit-search': openDocumentFind, 'edit-delete': () => formattingEditor.value?.deleteSelection(),
    'edit-format-document': () => { void format('format-document') },
    'edit-copy-markdown': () => { void deps.copyCurrentBlock('markdown') },
    'edit-copy-html': () => { void deps.copyCurrentBlock('html') },
    'edit-copy-image': () => { void deps.copyCurrentBlock('image') },
    'edit-copy-plain': () => { void deps.copyCurrentBlock('plain') },
    'edit-undo': () => formattingEditor.value?.undo(), 'edit-redo': () => formattingEditor.value?.redo(),
    'view-wysiwyg': () => setMode('wysiwyg'), 'view-source': () => setMode('source'), 'view-split': () => setMode('split'), 'toggle-sidebar': () => { sidebar.value = !sidebar.value },
    'toggle-outline': () => { if (deps.outlineAvailable?.value !== false) outlineOpen.value = !outlineOpen.value },
    'toggle-toolbar': () => { toolbarEnabled.value = !toolbarEnabled.value }, 'toggle-typewriter': () => { typewriter.value = !typewriter.value }, 'toggle-focus': () => { focusMode.value = !focusMode.value }, 'toggle-read-only': () => { readOnlyMode.value = !readOnlyMode.value },
    'edit-spellcheck': () => { positionUtilityPopover(); void checkSpelling() },
    'format-bold': () => format('bold'), 'format-italic': () => format('italic'), 'format-strikethrough': () => format('strikethrough'), 'format-underline': () => format('underline'), 'format-link': () => format('link'), 'format-image': () => format('image'), 'format-comment': () => format('comment'),
    'paragraph-normal': () => applyBlockStyle('p'), 'paragraph-h1': () => applyBlockStyle('h1'), 'paragraph-h2': () => applyBlockStyle('h2'), 'paragraph-h3': () => applyBlockStyle('h3'), 'paragraph-h4': () => applyBlockStyle('h4'), 'paragraph-h5': () => applyBlockStyle('h5'), 'paragraph-h6': () => applyBlockStyle('h6'),
    'format-heading-increase': () => applyBlockStyle('heading-increase'), 'format-heading-decrease': () => applyBlockStyle('heading-decrease'),
    'format-quote': () => applyBlockStyle('quote'), 'format-unordered-list': () => applyBlockStyle('list'),
    'format-ordered-list': () => applyBlockStyle('ordered-list'), 'format-task-list': () => applyBlockStyle('task-list'),
    'format-inline-formula': () => format('inline-formula'), 'format-code': () => format('code'), 'format-code-block': () => applyBlockStyle('code'), 'format-indent': () => applyBlockStyle('indent'), 'format-outdent': () => applyBlockStyle('outdent'),
    'paragraph-table': () => applyBlockStyle('table'), 'paragraph-formula': () => applyBlockStyle('formula'), 'paragraph-mindmap': () => applyBlockStyle('mindmap'), 'format-image-url': () => format('image-url'), 'paragraph-mermaid': () => applyBlockStyle('mermaid'),
    'insert-callout-tip': () => applyBlockStyle('callout-tip'), 'insert-callout-note': () => applyBlockStyle('callout-note'), 'insert-callout-important': () => applyBlockStyle('callout-important'),
    'insert-callout-warning': () => applyBlockStyle('callout-warning'), 'insert-callout-caution': () => applyBlockStyle('callout-caution'),
    'format-footnote': () => applyBlockStyle('footnote'), 'format-horizontal-rule': () => applyBlockStyle('hr'), 'format-clear': () => applyBlockStyle('clear')
  }
  actions[action]?.()
}

const { commands } = useCommandPalette(deps, performShortcut)
return { commandInfo, commandIcon, commandActive, commandTitle, commandDisabled,
  activateTopbar, performShortcut, handleNativeMenu, shortcutGuide, commands }
}
