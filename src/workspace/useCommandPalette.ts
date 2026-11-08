import { pluginRuntime } from '../plugins/runtime'
import { t } from '../i18n'
import { computed } from 'vue'
import { markdownMarkers, shortcutFormatIcons, commandIcons } from '../editor/formatPresentation'
import { shortcuts, type ShortcutId } from '../settings/shortcuts'
import type { WorkspaceCommandDeps } from './useWorkspaceCommands'

type CommandPaletteDeps = Pick<WorkspaceCommandDeps,
  | 'closeFolder'
  | 'newFolder'
  | 'activeDoc'
  | 'manageItem'
  | 'editor'
  | 'convertCurrentText'
  | 'checkResources'
  | 'openImageProperties'
  | 'format'
  | 'typewriter'
  | 'readOnlyMode'
  | 'outlineAvailable'
  | 'outlineOpen'
  | 'markdownActive'
  | 'toggleAllOutlineSections'
  | 'gitEnabled'
  | 'openHistory'
  | 'download'
  | 'referenceTab'
  | 'showReference'
>

export function useCommandPalette(deps: CommandPaletteDeps, performShortcut: (action: ShortcutId) => void) {
const {
  closeFolder, newFolder, activeDoc, manageItem, editor, convertCurrentText, checkResources, openImageProperties, format, typewriter, readOnlyMode, outlineOpen, markdownActive, toggleAllOutlineSections, gitEnabled, openHistory, download, referenceTab, showReference
} = deps
const commandExtras = [
  { id: 'newFolder', get label() { return t('新建文件夹') }, action: newFolder },
  { id: 'closeFolder', get label() { return t('关闭文件夹') }, action: () => void closeFolder() },
  { id: 'renameDocument', get label() { return t('重命名当前文件') }, action: () => { if (activeDoc.value.relativePath) void manageItem(activeDoc.value.relativePath, 'rename') } },
  { id: 'moveDocument', get label() { return t('移动当前文件') }, action: () => { if (activeDoc.value.relativePath) void manageItem(activeDoc.value.relativePath, 'move') } },
  { id: 'deleteDocument', get label() { return t('删除当前文件到废纸篓') }, action: () => { if (activeDoc.value.relativePath) void manageItem(activeDoc.value.relativePath, 'trash') } },
  { id: 'convertMarkdown', get label() { return t('纯文本另存为 Markdown') }, action: convertCurrentText },
  { id: 'checkDocumentLinks', get label() { return t('检查当前文件失效链接') }, action: () => void checkResources(false) },
  { id: 'checkFolderLinks', get label() { return t('检查当前文件夹失效链接') }, action: () => void checkResources(true) },
  { id: 'imageProperties', get label() { return t('编辑当前图片属性') }, action: openImageProperties },
  { id: 'foldHeadings', get label() { return t('收起或展开全部章节') }, action: () => { if (markdownActive.value) toggleAllOutlineSections() } },
  { id: 'history', get label() { return t('查看历史版本') }, action: () => { if (!gitEnabled.value) return; void openHistory() } },
  { id: 'exportHtml', get label() { return t('导出为 HTML') }, action: () => void download('html') },
  { id: 'exportText', get label() { return t('导出为纯文本') }, action: () => void download('txt') },
  { id: 'exportWord', get label() { return t('导出为 Word') }, action: () => void download('docx') },
  { id: 'exportPng', get label() { return t('导出为 PNG') }, action: () => void download('png') },
  { id: 'exportPdf', get label() { return t('导出为 PDF') }, action: () => void download('pdf') },
  { id: 'shortcutReference', get label() { return t('打开快捷键速查') }, action: () => { referenceTab.value = 'shortcuts'; showReference.value = true } },
]
const commands = computed(() => {
  const shortcutsAsCommands = shortcuts.filter(item => item.id !== 'commands').map(item => {
    const icon = shortcutFormatIcons[item.id] || commandIcons[item.id] || item.id
    return { id: item.id, label: item.label, category: item.category, icon, marker: markdownMarkers[shortcutFormatIcons[item.id] || item.id], action: () => performShortcut(item.id) }
  })
  const seen = new Set<string>(shortcutsAsCommands.map(item => item.id))
  const plugins = pluginRuntime.state.commands.map(command => ({ id: command.id, label: command.title, custom: true, category: t('插件'), icon: command.icon || 'settings', marker: undefined, action: () => { void pluginRuntime.execute(command.id, pluginRuntime.context({ location: 'command-palette' })).catch(error => console.error('Plugin command:', error)) } }))
  return [...shortcutsAsCommands, ...commandExtras.filter(item => { if (seen.has(item.id)) return false; seen.add(item.id); return true }).map(item => {
    const icon = shortcutFormatIcons[item.id] || commandIcons[item.id] || item.id
    return { ...item, icon, marker: ['inlineFormula', 'insertMindmap', 'insertMermaid'].includes(item.id) ? markdownMarkers[icon] : undefined, get category() { return t('更多操作') } }
  }), ...plugins]
})
return { commands }
}
