import { t } from '../i18n'
export const shortcuts = [
  { id: 'quickCapture', get label() { return t('打开快速记录') }, get category() { return t('快速记录') }, defaultChord: 'Meta+Shift+Space' },
  { id: 'sidebar', get label() { return t('切换侧栏') }, get category() { return t('界面与视图') }, defaultChord: 'Meta+Backslash' },
  { id: 'settings', get label() { return t('偏好设置') }, get category() { return t('界面与视图') }, defaultChord: 'Meta+Comma' },
  { id: 'openFile', get label() { return t('打开文件') }, get category() { return t('文件') }, defaultChord: 'Meta+Shift+KeyO' },
  { id: 'openFolder', get label() { return t('打开文件夹') }, get category() { return t('文件') }, defaultChord: 'Meta+KeyO' },
  { id: 'recentFolders', get label() { return t('最近打开文件夹') }, get category() { return t('文件') }, defaultChord: 'Meta+Alt+KeyO' },
  { id: 'history', get label() { return t('历史版本') }, get category() { return t('文件') }, defaultChord: 'Meta+Shift+KeyH' },
  { id: 'recentFiles', get label() { return t('最近打开文件') }, get category() { return t('文件') }, defaultChord: 'Meta+Shift+KeyR' },
  { id: 'workspaceSearch', get label() { return t('搜索文件与内容') }, get category() { return t('搜索与校对') }, defaultChord: 'Meta+Shift+KeyF' },
  { id: 'find', get label() { return t('文内查找') }, get category() { return t('搜索与校对') }, defaultChord: 'Meta+KeyF' },
  { id: 'spellcheck', get label() { return t('检查当前文件拼写') }, get category() { return t('搜索与校对') }, defaultChord: 'Meta+Shift+KeyP' },
  { id: 'sort', get label() { return t('文件排序') }, get category() { return t('文件') }, defaultChord: 'Meta+Alt+KeyS' },
  { id: 'new', get label() { return t('新建文件或文件夹') }, get category() { return t('文件') }, defaultChord: 'Meta+KeyN' },
  { id: 'newWindow', get label() { return t('新建窗口') }, get category() { return t('文件') }, defaultChord: 'Meta+Shift+KeyN' },
  { id: 'closeFile', get label() { return t('关闭当前文件') }, get category() { return t('文件') }, defaultChord: 'Meta+KeyW' },
  { id: 'saveAs', get label() { return t('另存为') }, get category() { return t('文件') }, defaultChord: 'Meta+Shift+KeyS' },
  { id: 'mode', get label() { return t('切换编辑视图') }, get category() { return t('界面与视图') }, defaultChord: 'Meta+Shift+KeyM' },
  { id: 'wysiwygView', get label() { return t('切换到所见即所得') }, get category() { return t('界面与视图') }, defaultChord: '' },
  { id: 'sourceView', get label() { return t('切换到源代码') }, get category() { return t('界面与视图') }, defaultChord: '' },
  { id: 'splitView', get label() { return t('切换到分栏视图') }, get category() { return t('界面与视图') }, defaultChord: '' },
  { id: 'sideView', get label() { return t('切换文件视图') }, get category() { return t('界面与视图') }, defaultChord: 'Meta+Shift+KeyL' },
  { id: 'theme', get label() { return t('主题') }, get category() { return t('界面与视图') }, defaultChord: 'Meta+Shift+KeyT' },
  { id: 'reference', get label() { return t('Markdown 速查') }, get category() { return t('辅助工具') }, defaultChord: 'Meta+Slash' },
  { id: 'export', get label() { return t('导出') }, get category() { return t('文件') }, defaultChord: 'Meta+KeyE' },
  { id: 'focus', get label() { return t('专注模式') }, get category() { return t('界面与视图') }, defaultChord: 'Meta+Shift+KeyD' },
  { id: 'commands', get label() { return t('命令菜单') }, get category() { return t('界面与视图') }, defaultChord: 'Meta+KeyK' },
  { id: 'save', get label() { return t('保存') }, get category() { return t('文件') }, defaultChord: 'Meta+KeyS' },
  { id: 'toggleToolbar', get label() { return t('显示或隐藏工具栏') }, get category() { return t('界面与视图') }, defaultChord: '' },
  { id: 'bold', get label() { return t('粗体') }, get category() { return t('编辑与格式') }, defaultChord: 'Meta+KeyB' },
  { id: 'italic', get label() { return t('斜体') }, get category() { return t('编辑与格式') }, defaultChord: 'Meta+KeyI' },
  { id: 'strikethrough', get label() { return t('删除线') }, get category() { return t('编辑与格式') }, defaultChord: 'Meta+Shift+KeyX' },
  { id: 'underline', get label() { return t('下划线') }, get category() { return t('编辑与格式') }, defaultChord: 'Meta+KeyU' },
  { id: 'inlineCode', get label() { return t('行内代码') }, get category() { return t('编辑与格式') }, defaultChord: '' },
  { id: 'clearFormat', get label() { return t('清除格式') }, get category() { return t('编辑与格式') }, defaultChord: '' },
  { id: 'link', get label() { return t('链接') }, get category() { return t('插入') }, defaultChord: 'Meta+KeyL' },
  { id: 'image', get label() { return t('图片') }, get category() { return t('插入') }, defaultChord: '' },
  { id: 'table', get label() { return t('表格') }, get category() { return t('插入') }, defaultChord: '' },
  { id: 'codeBlock', get label() { return t('代码块') }, get category() { return t('插入') }, defaultChord: '' },
  { id: 'formula', get label() { return t('公式块') }, get category() { return t('插入') }, defaultChord: '' },
  { id: 'calloutTip', get label() { return t('提示框') }, get category() { return t('插入') }, defaultChord: '' },
  { id: 'calloutNote', get label() { return t('备注框') }, get category() { return t('插入') }, defaultChord: '' },
  { id: 'calloutImportant', get label() { return t('重要框') }, get category() { return t('插入') }, defaultChord: '' },
  { id: 'calloutWarning', get label() { return t('警告框') }, get category() { return t('插入') }, defaultChord: '' },
  { id: 'calloutCaution', get label() { return t('注意框') }, get category() { return t('插入') }, defaultChord: '' },
  { id: 'quote', get label() { return t('引用') }, get category() { return t('段落') }, defaultChord: 'Meta+Shift+KeyQ' },
  { id: 'unorderedList', get label() { return t('无序列表') }, get category() { return t('段落') }, defaultChord: 'Meta+Shift+Digit7' },
  { id: 'orderedList', get label() { return t('有序列表') }, get category() { return t('段落') }, defaultChord: 'Meta+Shift+Digit8' },
  { id: 'taskList', get label() { return t('任务列表') }, get category() { return t('段落') }, defaultChord: 'Meta+Shift+Digit9' },
  { id: 'indentList', get label() { return t('增加列表缩进') }, get category() { return t('段落') }, defaultChord: 'Meta+BracketRight' },
  { id: 'outdentList', get label() { return t('减少列表缩进') }, get category() { return t('段落') }, defaultChord: 'Meta+BracketLeft' },
  { id: 'headingIncrease', get label() { return t('增加标题级别') }, get category() { return t('段落') }, defaultChord: 'Alt+ArrowDown' },
  { id: 'headingDecrease', get label() { return t('降低标题级别') }, get category() { return t('段落') }, defaultChord: 'Alt+ArrowUp' },
  { id: 'footnote', get label() { return t('插入脚注') }, get category() { return t('插入') }, defaultChord: 'Meta+Alt+KeyF' },
  { id: 'horizontalRule', get label() { return t('水平分割线') }, get category() { return t('插入') }, defaultChord: 'Meta+Alt+KeyR' },
  { id: 'comment', get label() { return t('注释') }, get category() { return t('编辑与格式') }, defaultChord: 'Meta+Alt+Slash' },
  { id: 'typewriter', get label() { return t('打字机模式') }, get category() { return t('界面与视图') }, defaultChord: '' },
  { id: 'readOnly', get label() { return t('切换只读模式') }, get category() { return t('界面与视图') }, defaultChord: '' },
  { id: 'outline', get label() { return t('显示或隐藏大纲') }, get category() { return t('界面与视图') }, defaultChord: '' },
  { id: 'inlineFormula', get label() { return t('插入行内公式') }, get category() { return t('插入') }, defaultChord: '' },
  { id: 'insertMermaid', get label() { return t('插入流程图') }, get category() { return t('插入') }, defaultChord: '' },
  { id: 'insertMindmap', get label() { return t('插入脑图') }, get category() { return t('插入') }, defaultChord: '' },
  { id: 'frontmatter', get label() { return t('Front matter') }, get category() { return t('插入') }, defaultChord: '' },
  { id: 'imageUrl', get label() { return t('图片链接') }, get category() { return t('插入') }, defaultChord: '' },
  { id: 'formatDocument', get label() { return t('格式化') }, get category() { return t('编辑与格式') }, defaultChord: '' },
  { id: 'copyMarkdown', get label() { return t('复制为 Markdown') }, get category() { return t('编辑与格式') }, defaultChord: '' },
  { id: 'copyHtml', get label() { return t('复制为 HTML') }, get category() { return t('编辑与格式') }, defaultChord: '' },
  { id: 'copyImage', get label() { return t('复制为图片') }, get category() { return t('编辑与格式') }, defaultChord: '' },
  { id: 'copyPlain', get label() { return t('复制为纯文本') }, get category() { return t('编辑与格式') }, defaultChord: '' },
  ...Array.from({ length: 7 }, (_, index) => ({ id: `heading${index}`, label: index === 0 ? '普通段落' : `${index} 级标题`, get category() { return t('段落') }, defaultChord: `Meta+Digit${index}` }))
] as const

export type ShortcutId = (typeof shortcuts)[number]['id']
export type ShortcutOverrides = Partial<Record<ShortcutId, string | null>>
const ids = new Set<string>(shortcuts.map(item => item.id))
const reserved = new Set(['Meta+KeyQ', 'Meta+KeyH', 'Meta+KeyM', 'Meta+Tab', 'Meta+Space', 'Meta+Equal', 'Meta+Shift+Equal', 'Meta+Minus', 'Meta+Shift+Minus', 'Meta+Shift+Digit3', 'Meta+Shift+Digit4'])
const chordPattern = /^(?:(?:Meta|Control|Alt|Shift)\+)+(?:Key[A-Z]|Digit[0-9]|Backslash|Comma|Slash|BracketLeft|BracketRight|ArrowUp|ArrowDown|Space)$/

export function eventChord(event: Pick<KeyboardEvent, 'metaKey' | 'ctrlKey' | 'altKey' | 'shiftKey' | 'code'>): string | null {
  if (!event.metaKey && !event.ctrlKey && !event.altKey) return null
  if (/^(Meta|Control|Alt|Shift)(Left|Right)$/.test(event.code)) return null
  return [event.metaKey && 'Meta', event.ctrlKey && 'Control', event.altKey && 'Alt', event.shiftKey && 'Shift', event.code].filter(Boolean).join('+')
}
export function formatChord(chord: string): string {
  return chord.replace('Meta+', '⌘').replace('Control+', '⌃').replace('Alt+', '⌥').replace('Shift+', '⇧').replace('Key', '').replace('Digit', '').replace('Backslash', '\\').replace('Comma', ',').replace('Slash', '/').replace('BracketLeft', '[').replace('BracketRight', ']').replace('ArrowUp', '↑').replace('ArrowDown', '↓').replace('Space', '空格')
}
export function isValidShortcutOverrides(value: unknown): value is ShortcutOverrides {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  const entries = Object.entries(value)
  if (entries.length > shortcuts.length || !entries.every(([id, chord]) => ids.has(id) && (chord === null || (typeof chord === 'string' && chordPattern.test(chord))))) return false
  const overrides = value as ShortcutOverrides
  return entries.every(([id, chord]) => chord === null || shortcutConflict(id as ShortcutId, chord as string, overrides) === null)
}
function assignedShortcut(id: ShortcutId, overrides: ShortcutOverrides): string {
  return Object.prototype.hasOwnProperty.call(overrides, id) ? overrides[id] || '' : shortcuts.find(item => item.id === id)?.defaultChord || ''
}
export function shortcutConflict(id: ShortcutId, chord: string, overrides: ShortcutOverrides): string | null {
  if (reserved.has(chord)) return '此快捷键由 macOS 或窗口操作保留'
  if (!chordPattern.test(chord) || !/^(?:(?:Meta|Control|Alt|Shift)\+)*(?:Meta|Control|Alt)\+/.test(chord)) return '快捷键需要 ⌘、⌃ 或 ⌥'
  const clash = shortcuts.find(item => item.id !== id && assignedShortcut(item.id, overrides) === chord)
  return clash ? `与「${clash.label}」冲突` : null
}
export function matchingShortcut(chord: string, overrides: ShortcutOverrides): ShortcutId | null {
  return shortcuts.find(item => assignedShortcut(item.id, overrides) === chord)?.id || null
}
