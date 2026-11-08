import { t } from '../i18n'
export const topbarCommands = [
  { id: 'sidebar', get label() { return t('侧栏') }, shortcut: '⌘\\' },
  { id: 'settings', get label() { return t('偏好设置') }, shortcut: '⌘,' },
  { id: 'files', get label() { return t('文件') }, shortcut: '' },
  { id: 'search', get label() { return t('搜索文件与内容') }, shortcut: '⌘⇧F' },
  { id: 'mode', get label() { return t('切换编辑视图') }, shortcut: '⌘⇧M' },
  { id: 'outline', get label() { return t('显示或隐藏大纲') }, shortcut: '' },
  { id: 'reference', get label() { return t('Markdown 速查') }, shortcut: '⌘/' },
  { id: 'commands', get label() { return t('命令菜单') }, shortcut: '⌘K' },
  { id: 'theme', get label() { return t('主题') }, shortcut: '⌘⇧T' },
  { id: 'export', get label() { return t('导出') }, shortcut: '⌘E' },
  { id: 'share', get label() { return t('分享') }, shortcut: '' },
  { id: 'history', get label() { return t('历史版本') }, shortcut: '' },
  { id: 'focus', get label() { return t('专注模式') }, shortcut: '⌘⇧D' },
  { id: 'readOnly', get label() { return t('只读模式') }, shortcut: '' },
  { id: 'typewriter', get label() { return t('打字机模式') }, shortcut: '' },
  { id: 'spellcheck', get label() { return t('拼写检查') }, shortcut: '⌘⇧P' },
  { id: 'snippets', get label() { return t('片段') }, shortcut: '' }
] as const
export type TopbarId = (typeof topbarCommands)[number]['id']
export type TopbarArea = 'sidebarTop' | 'editorTop'
export type TopbarLayout = Record<TopbarArea, string[]>
const ids = new Set<string>(topbarCommands.map(item => item.id))
export function normalizeTopbar(layout: TopbarLayout): TopbarLayout {
  const seen = new Set<string>()
  const clean = (items: string[]) => items.filter(id => ids.has(id) && !seen.has(id) && !!seen.add(id))
  return { sidebarTop: clean(layout.sidebarTop), editorTop: clean(layout.editorTop) }
}
export function placeTopbar(layout: TopbarLayout, id: string, area: TopbarArea, before?: string): TopbarLayout {
  if (!ids.has(id)) return layout
  const next = normalizeTopbar({ sidebarTop: layout.sidebarTop.filter(item => item !== id), editorTop: layout.editorTop.filter(item => item !== id) })
  const target = next[area]
  const position = before ? target.indexOf(before) : -1
  target.splice(position < 0 ? target.length : position, 0, id)
  return next
}

export function visiblePinnedTopbarItems(saved: string[], builtins: readonly string[], plugins: readonly string[]): string[] {
  const available = new Set([...builtins, ...plugins])
  return [...new Set(saved.filter(id => available.has(id)))]
}
