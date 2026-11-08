import { t } from '../i18n'
import { computed, ref, type ComputedRef, type Ref } from 'vue'
import DOMPurify from 'dompurify'
import { invoke } from '@tauri-apps/api/core'
import CodeEditor from '../CodeEditor.vue'
import { renderMarkdown } from './renderMarkdown'
import { exportFragment, exportStyles } from '../documents/exportRendering'
import type { Doc } from '../workspace/sample'
import { ScrollSyncGate } from './scrollSyncGate'

type Mode = 'wysiwyg' | 'source' | 'split'

export function useEditorActions(deps: {
  isTauri: boolean
  editor: Ref<InstanceType<typeof CodeEditor> | null>
  formattingEditor: ComputedRef<InstanceType<typeof CodeEditor> | null>
  activeEditingPane: Ref<'source' | 'preview'>
  selectedText: Ref<string>
  selectionOffset: Ref<number>
  selectedBlock: Ref<string>
  boldActive: Ref<boolean>
  italicActive: Ref<boolean>
  editorFocused: Ref<boolean>
  showBlockMenu: Ref<boolean>
  showBlockActions: Ref<boolean>
  mode: Ref<Mode>
  markdownActive: ComputedRef<boolean>
  activeDoc: ComputedRef<Doc>
  attachmentNaming: ComputedRef<string>
  attachmentDirectory: ComputedRef<string>
  scrollSyncGate: ScrollSyncGate
  setMarkdownMode: (mode: Mode) => void
  notify: (message: string) => void
}) {
const { isTauri, editor, formattingEditor, activeEditingPane, selectedText,
  selectionOffset, selectedBlock, boldActive, italicActive, editorFocused,
  showBlockMenu, showBlockActions, mode, markdownActive, activeDoc,
  attachmentNaming, attachmentDirectory, scrollSyncGate,
  setMarkdownMode, notify } = deps
function onEditorBlur() { requestAnimationFrame(() => { if (!document.activeElement?.closest('.editor-toolbar,.code-editor')) editorFocused.value = false }) }
const activeFormatIds = ref<string[]>([])
function onEditorSelection(info: { text: string; from: number; to: number; block: string; bold: boolean; italic: boolean; formatIds: string[] }, pane: 'source' | 'preview') {
  if (pane !== activeEditingPane.value) return
  selectedText.value = info.text
  selectionOffset.value = info.from
  selectedBlock.value = info.block
  boldActive.value = info.bold
  italicActive.value = info.italic
  activeFormatIds.value = info.formatIds
}
function onToolbarMouseDown(event: MouseEvent) { if ((event.target as HTMLElement).closest('button')) event.preventDefault() }
async function copyCurrentBlock(kind: 'markdown' | 'html' | 'plain' | 'image') {
  const source = formattingEditor.value?.currentBlockText() || ''
  if (!source) return notify(t('当前段落没有可复制的内容'))
  if (kind === 'image') {
    try {
      if (!isTauri) throw new Error('请在桌面版复制为图片')
      const image = (async () => {
        const fragment = await exportFragment(source)
        for (const img of fragment.querySelectorAll('img')) {
          const target = img.getAttribute('src') || ''
          if (!target.startsWith('data:')) img.setAttribute('src', await invoke<string>('read_image', { workspaceRoot: activeDoc.value.workspaceRoot, document: activeDoc.value.relativePath, target }))
        }
        const size = getComputedStyle(document.querySelector('.cm-content') || document.body).fontSize
        const html = `<!doctype html><meta charset="utf-8"><style>${exportStyles}body{margin:0;padding:24px;font:${size}/1.7 -apple-system,BlinkMacSystemFont,"PingFang SC",sans-serif}</style><body>${fragment.innerHTML}</body>`
        const bytes = await invoke<number[]>('render_clipboard_image', { content: html })
        return new Blob([new Uint8Array(bytes)], { type: 'image/png' })
      })()
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': image })]); showBlockActions.value = false; notify(t('已复制'))
    } catch (error) { notify(t('复制失败：{0}', { "0": String(error) })) }
    return
  }
  let value = source
  if (kind === 'html') value = DOMPurify.sanitize(renderMarkdown(source))
  if (kind === 'plain') { const node = document.createElement('div'); node.innerHTML = DOMPurify.sanitize(renderMarkdown(source)); value = node.textContent || '' }
  try { await navigator.clipboard.writeText(value); showBlockActions.value = false; notify(t('已复制')) }
  catch (error) { notify(t('复制失败：{0}', { "0": String(error) })) }
}
async function pastePlainBlock() {
  try { formattingEditor.value?.insertSnippet(await navigator.clipboard.readText()); showBlockActions.value = false }
  catch (error) { notify(t('粘贴失败：{0}', { "0": String(error) })) }
}
function pasteBlock() { void pastePlainBlock() }
function applyBlockStyle(value: string) {
  showBlockMenu.value = false
  formattingEditor.value?.applyBlock(value)
}
async function format(command: string, value?: string) {
  if (!markdownActive.value) return
  if (command === 'image-local') command = 'image'
  if (command === 'image-url') { await formattingEditor.value?.format('image'); return }
  if (command === 'image') {
    if (isTauri) {
      if (!activeDoc.value.relativePath || !activeDoc.value.loaded) return notify(t('请先打开本地 Markdown 文件'))
      const now = new Date()
      const naming = attachmentNaming.value.replaceAll('{date}', now.toISOString().slice(0, 10)).replaceAll('{time}', now.toTimeString().slice(0, 8).replaceAll(':', '-')).replaceAll('{timestamp}', String(now.getTime())).replaceAll('{uuid}', crypto.randomUUID())
      try { value = await invoke<string | null>('import_image', { workspaceRoot: activeDoc.value.workspaceRoot, document: activeDoc.value.relativePath, directory: attachmentDirectory.value, naming }) || undefined }
      catch (error) { return notify(t('插入图片失败：{0}', { "0": String(error) })) }
    }
  }
  if (command === 'image' && isTauri && !value) return
  await formattingEditor.value?.format(command, value)
}
function setMode(value: Mode) { scrollSyncGate.clear(); if (value !== 'split') activeEditingPane.value = 'source'; if (markdownActive.value) { mode.value = value; setMarkdownMode(value) } else mode.value = 'source' }
const modeLabel = computed(() => mode.value === 'wysiwyg' ? t('所见即所得') : mode.value === 'source' ? t('源代码') : t('分栏'))
const nextModeLabel = computed(() => mode.value === 'wysiwyg' ? t('源代码') : mode.value === 'source' ? t('分栏') : t('所见即所得'))
function cycleMode() { if (markdownActive.value) setMode(mode.value === 'wysiwyg' ? 'source' : mode.value === 'source' ? 'split' : 'wysiwyg') }
function jumpHeading(index: number) {
  editor.value?.jumpHeading(index)
  if (mode.value === 'split') document.querySelectorAll('.preview-body h1,.preview-body h2,.preview-body h3,.preview-body h4,.preview-body h5,.preview-body h6')[index]?.scrollIntoView({ behavior: 'smooth', block: 'center' })
}

return { activeFormatIds, onEditorBlur, onEditorSelection, onToolbarMouseDown,
  copyCurrentBlock, pastePlainBlock, pasteBlock, applyBlockStyle,
  format, setMode, modeLabel, nextModeLabel, cycleMode, jumpHeading }
}
