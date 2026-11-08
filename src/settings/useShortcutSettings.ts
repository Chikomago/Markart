import { t } from '../i18n'
import { computed, ref, watch, type Ref, type WritableComputedRef } from 'vue'
import { invoke } from '@tauri-apps/api/core'
import { eventChord, shortcutConflict, shortcuts, type ShortcutId, type ShortcutOverrides } from './shortcuts'

export function useShortcutSettings(deps: {
  isTauri: boolean
  shortcutOverrides: WritableComputedRef<ShortcutOverrides>
  showSettings: Ref<boolean>
  settingTab: Readonly<Ref<string>>
  notify: (message: string) => void
}) {
const { isTauri, shortcutOverrides, showSettings, settingTab, notify } = deps
const shortcutGroups = computed(() => [...new Set(shortcuts.map(item => item.category))].map(category => ({ category, items: shortcuts.filter(item => item.category === category) })))
const recordingShortcutId = ref<ShortcutId | null>(null)
function assignedChord(id: ShortcutId) { return Object.prototype.hasOwnProperty.call(shortcutOverrides.value, id) ? shortcutOverrides.value[id] || '' : shortcuts.find(item => item.id === id)?.defaultChord || '' }
const nativeMenuShortcutMap: Partial<Record<ShortcutId, string>> = {
  new: 'file-new', openFile: 'file-open', openFolder: 'folder-open', newWindow: 'window-new', recentFolders: 'recent-folders', recentFiles: 'recent-files', closeFile: 'file-close', save: 'file-save', saveAs: 'file-save-as', export: 'file-export',
  focus: 'toggle-focus', typewriter: 'toggle-typewriter', readOnly: 'toggle-read-only', outline: 'toggle-outline',
  inlineFormula: 'format-inline-formula', insertMermaid: 'paragraph-mermaid', insertMindmap: 'paragraph-mindmap', imageUrl: 'format-image-url', formatDocument: 'edit-format-document',
  copyMarkdown: 'edit-copy-markdown', copyHtml: 'edit-copy-html', copyImage: 'edit-copy-image', copyPlain: 'edit-copy-plain',
  find: 'edit-search', spellcheck: 'edit-spellcheck', sidebar: 'toggle-sidebar', wysiwygView: 'view-wysiwyg', sourceView: 'view-source', splitView: 'view-split', toggleToolbar: 'toggle-toolbar',
  bold: 'format-bold', italic: 'format-italic', strikethrough: 'format-strikethrough', underline: 'format-underline', inlineCode: 'format-code', comment: 'format-comment', clearFormat: 'format-clear',
  heading0: 'paragraph-normal', heading1: 'paragraph-h1', heading2: 'paragraph-h2', heading3: 'paragraph-h3', heading4: 'paragraph-h4', heading5: 'paragraph-h5', heading6: 'paragraph-h6',
  headingIncrease: 'format-heading-increase', headingDecrease: 'format-heading-decrease', quote: 'format-quote', unorderedList: 'format-unordered-list', orderedList: 'format-ordered-list', taskList: 'format-task-list', indentList: 'format-indent', outdentList: 'format-outdent',
  link: 'format-link', image: 'format-image', table: 'paragraph-table', codeBlock: 'format-code-block', formula: 'paragraph-formula', footnote: 'format-footnote', calloutTip: 'insert-callout-tip', calloutNote: 'insert-callout-note', calloutImportant: 'insert-callout-important', calloutWarning: 'insert-callout-warning', calloutCaution: 'insert-callout-caution', horizontalRule: 'format-horizontal-rule'
}
function tauriAccelerator(chord: string): string | null {
  if (!chord) return null
  const keys: Record<string, string> = { Meta: 'CmdOrCtrl', Control: 'Ctrl', Backslash: '\\', Comma: ',', Slash: '/', BracketLeft: '[', BracketRight: ']', ArrowUp: 'Up', ArrowDown: 'Down' }
  return chord.split('+').map(part => keys[part] || part.replace(/^Key/, '').replace(/^Digit/, '')).join('+')
}
async function syncNativeMenuShortcuts() {
  if (!isTauri) return
  const menuShortcuts = Object.entries(nativeMenuShortcutMap).map(([id, menuId]) => ({ menuId, accelerator: tauriAccelerator(assignedChord(id as ShortcutId)) }))
  try { await invoke('set_menu_shortcuts', { shortcuts: menuShortcuts }) }
  catch (error) { notify(t('顶部菜单快捷键同步失败：{0}', { "0": String(error) })) }
}
async function suspendNativeShortcuts() {
  if (isTauri) {
    const menuShortcuts = Object.values(nativeMenuShortcutMap).map(menuId => ({ menuId, accelerator: null }))
    try { await invoke('set_menu_shortcuts', { shortcuts: menuShortcuts }) }
    catch (error) { notify(t('快捷键录入准备失败：{0}', { "0": String(error) })) }
  }
}
async function startShortcutRecording(id: ShortcutId) {
  await suspendNativeShortcuts()
  recordingShortcutId.value = id
}
function cancelShortcutRecording() {
  if (!recordingShortcutId.value) return
  recordingShortcutId.value = null
  void syncNativeMenuShortcuts()
}
function clearShortcut(id: ShortcutId) {
  shortcutOverrides.value = { ...shortcutOverrides.value, [id]: null }
  if (recordingShortcutId.value === id) recordingShortcutId.value = null
  void syncNativeMenuShortcuts()
}
watch([showSettings, settingTab], ([visible, tab]) => {
  if (!visible || tab !== 'shortcuts') cancelShortcutRecording()
})
function recordShortcut(id: ShortcutId, event: KeyboardEvent) {
  event.preventDefault(); event.stopPropagation()
  if (event.key === 'Escape') { cancelShortcutRecording(); return }
  const chord = eventChord(event)
  if (!chord) return
  const conflict = shortcutConflict(id, chord, shortcutOverrides.value)
  if (conflict) return notify(conflict)
  shortcutOverrides.value = { ...shortcutOverrides.value, [id]: chord }
  recordingShortcutId.value = null
  void syncNativeMenuShortcuts()
}
function onShortcutRecordingKeydown(event: KeyboardEvent) {
  const id = recordingShortcutId.value
  if (id) recordShortcut(id, event)
}

return { suspendNativeShortcuts, shortcutGroups, recordingShortcutId, assignedChord, syncNativeMenuShortcuts,
  startShortcutRecording, cancelShortcutRecording, clearShortcut, recordShortcut, onShortcutRecordingKeydown }
}
