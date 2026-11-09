import { t } from '../i18n'
import { computed, onBeforeUnmount, ref, watch, type Ref } from 'vue'
import { invoke } from '@tauri-apps/api/core'
import type CodeEditor from '../CodeEditor.vue'
import { previewSectionMove, type SectionMove } from './outlineMove'
import { imageAt, renderImageProperties, type ImagePropertyDraft } from './imageProperties'
import type { Doc } from '../workspace/sample'
import { headingsOf } from '../editor/markdownCore'

export function useDocumentTools({ isTauri, currentWorkspaceRoot, activeDoc, activeId,
  content, markdownActive, selectionOffset, editor, previewEditor, foldContentWithOutline,
  jumpHeading, notify,
}: {
  isTauri: boolean
  currentWorkspaceRoot: Ref<string>
  docs: Ref<Doc[]>
  activeDoc: Readonly<Ref<Doc>>
  activeId: Ref<string>
  content: Readonly<Ref<string>>
  markdownActive: Readonly<Ref<boolean>>
  selectedText: Ref<string>
  selectionOffset: Ref<number>
  editor: Ref<InstanceType<typeof CodeEditor> | null>
  previewEditor: Ref<InstanceType<typeof CodeEditor> | null>
  foldContentWithOutline: Readonly<Ref<boolean>>
  selectDoc: (id: string) => Promise<unknown>
  jumpHeading: (index: number) => void
  notify: (message: string) => void
}) {
const outlineAllCollapsed = ref(false)
const collapsedOutlineHeadings = ref<number[]>([])
function onHeadingFoldsChange(info: { collapsed: number[]; foldable: number[] }) {
  if (!foldContentWithOutline.value) return
  collapsedOutlineHeadings.value = info.collapsed
  outlineAllCollapsed.value = info.foldable.length > 0 && info.foldable.every(index => info.collapsed.includes(index))
}
function toggleAllOutlineSections() {
  const folded = !outlineAllCollapsed.value
  outlineAllCollapsed.value = folded
  collapsedOutlineHeadings.value = outlineAllCollapsed.value ? headingsOf(content.value).map((_, index) => index) : []
  if (foldContentWithOutline.value) {
    editor.value?.setAllHeadingsFolded(folded)
    previewEditor.value?.setAllHeadingsFolded(folded)
  }
}
function toggleOutlineHeading(index: number) {
  const collapsed = new Set(collapsedOutlineHeadings.value.filter(item => item >= 0))
  if (collapsed.has(index)) collapsed.delete(index); else collapsed.add(index)
  collapsedOutlineHeadings.value = [...collapsed]
  outlineAllCollapsed.value = false
  if (foldContentWithOutline.value) {
    editor.value?.setHeadingFold(index, collapsed.has(index))
    previewEditor.value?.setHeadingFold(index, collapsed.has(index))
  }
}
watch(foldContentWithOutline, enabled => {
  const collapsed = enabled ? collapsedOutlineHeadings.value : []
  editor.value?.setHeadingFolds(collapsed)
  previewEditor.value?.setHeadingFolds(collapsed)
})
function documentPath(doc: Doc) { return isTauri && doc.relativePath ? `${currentWorkspaceRoot.value}/${doc.relativePath}` : doc.path }
const imagePropertyDraft = ref<ImagePropertyDraft | null>(null)
const imagePropertyDocId = ref('')
function readImageWidths(): Record<string, Record<string, number>> { try { const value = JSON.parse(localStorage.getItem('markart-image-widths-v1') || '{}'); return value && typeof value === 'object' && !Array.isArray(value) ? value : {} } catch { return {} } }
const displayImageWidths = ref<Record<string, Record<string, number>>>(readImageWidths())
const activeImageWidths = computed(() => displayImageWidths.value[documentPath(activeDoc.value)] || {})
watch(displayImageWidths, value => { try { localStorage.setItem('markart-image-widths-v1', JSON.stringify(value)) } catch { notify(t('图片显示设置保存失败')) } }, { deep: true })
function openImageProperties() {
  if (!markdownActive.value) return notify(t('请先选择 Markdown 文件'))
  const draft = imageAt(content.value, selectionOffset.value)
  if (!draft) return notify(t('请将光标放在图片所在行；复杂图片语法可在源代码中修改'))
  imagePropertyDraft.value = { ...draft, width: draft.width || activeImageWidths.value[draft.path] || null }
  imagePropertyDocId.value = activeId.value
}
async function saveImageProperties() {
  const draft = imagePropertyDraft.value
  if (!draft || imagePropertyDocId.value !== activeId.value || content.value.slice(draft.from, draft.to) !== draft.original) return notify(t('文件已修改，请重新打开图片属性'))
  try {
    const next = renderImageProperties(draft)
    if (isTauri && activeDoc.value.relativePath && !/^(?:https?:|data:)/i.test(draft.path)) await invoke('read_image', { document: activeDoc.value.relativePath, target: draft.path })
    const docPath = documentPath(activeDoc.value)
    const widths = { ...activeImageWidths.value }
    delete widths[imageAt(draft.original, 0)?.path || draft.path]
    if (draft.width) widths[draft.path] = draft.width
    displayImageWidths.value = { ...displayImageWidths.value, [docPath]: widths }
    editor.value?.replaceRange(draft.from, draft.to, next)
    imagePropertyDraft.value = null
  } catch (error) { notify(t('图片属性修改失败：{0}', { "0": String(error) })) }
}
const draggedHeadingIndex = ref<number | null>(null)
const outlineDropTarget = ref<number | null>(null)
let outlinePointer: { index: number; x: number; y: number; moved: boolean } | null = null
let suppressOutlineClick = false
const sectionMovePreview = ref<SectionMove | null>(null)
const sectionMoveSource = ref('')
const sectionMoveDocId = ref('')
function previewOutlineDrop(target: number) {
  const source = draggedHeadingIndex.value
  draggedHeadingIndex.value = null
  outlineDropTarget.value = null
  if (source === null) return
  const preview = previewSectionMove(content.value, source, target)
  if (!preview) return notify(t('只能在同级章节之间移动'))
  sectionMovePreview.value = preview
  sectionMoveSource.value = content.value
  sectionMoveDocId.value = activeId.value
  applyOutlineMove()
}
function startOutlineDrag(event: PointerEvent, index: number) {
  if (event.button !== 0 || (event.target as HTMLElement).closest('.outline-fold')) return
  outlinePointer = { index, x: event.clientX, y: event.clientY, moved: false }
  document.addEventListener('pointermove', moveOutlineDrag)
  document.addEventListener('pointerup', finishOutlineDrag, { once: true })
  document.addEventListener('pointercancel', cancelOutlineDrag, { once: true })
}
function moveOutlineDrag(event: PointerEvent) {
  if (!outlinePointer) return
  if (!outlinePointer.moved && Math.hypot(event.clientX - outlinePointer.x, event.clientY - outlinePointer.y) < 5) return
  outlinePointer.moved = true
  draggedHeadingIndex.value = outlinePointer.index
  const target = document.elementFromPoint(event.clientX, event.clientY)?.closest<HTMLElement>('[data-outline-index]')
  outlineDropTarget.value = target ? Number(target.dataset.outlineIndex) : null
}
function cancelOutlineDrag() {
  document.removeEventListener('pointermove', moveOutlineDrag)
  document.removeEventListener('pointerup', finishOutlineDrag)
  document.removeEventListener('pointercancel', cancelOutlineDrag)
  outlinePointer = null
  draggedHeadingIndex.value = null
  outlineDropTarget.value = null
}
function finishOutlineDrag(event: PointerEvent) {
  const from = outlinePointer
  const target = document.elementFromPoint(event.clientX, event.clientY)?.closest<HTMLElement>('[data-outline-index]')
  const to = target ? Number(target.dataset.outlineIndex) : null
  cancelOutlineDrag()
  if (!from?.moved) return
  suppressOutlineClick = true
  window.setTimeout(() => { suppressOutlineClick = false }, 0)
  if (to !== null) { draggedHeadingIndex.value = from.index; previewOutlineDrop(to) }
}
function clickOutlineHeading(index: number) { if (!suppressOutlineClick) jumpHeading(index) }
onBeforeUnmount(cancelOutlineDrag)
function applyOutlineMove() {
  if (!sectionMovePreview.value || sectionMoveDocId.value !== activeId.value || sectionMoveSource.value !== content.value) return notify(t('文件已修改，请重新拖动章节'))
  editor.value?.replaceRange(0, content.value.length, sectionMovePreview.value.result)
  sectionMovePreview.value = null
}

  return {
    outlineAllCollapsed, collapsedOutlineHeadings, onHeadingFoldsChange, toggleAllOutlineSections, toggleOutlineHeading,
    imagePropertyDraft, activeImageWidths, openImageProperties, saveImageProperties,
    draggedHeadingIndex, outlineDropTarget, startOutlineDrag, clickOutlineHeading,
  }
}
