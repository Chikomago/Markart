import { t } from '../i18n'
import { nextTick, ref, type ComputedRef, type Ref, type WritableComputedRef } from 'vue'
import { invoke } from '@tauri-apps/api/core'
import CodeEditor from '../CodeEditor.vue'
import { fileKind } from './fileFormats'
import type { Doc } from '../workspace/sample'

export type MissingResource = { source: string; line: number; target: string; resolved: string }

export function useFileResources(deps: {
  isTauri: boolean
  currentWorkspaceRoot: Ref<string>
  activeDoc: ComputedRef<Doc>
  activeId: Ref<string>
  docs: Ref<Doc[]>
  content: WritableComputedRef<string>
  editor: Ref<InstanceType<typeof CodeEditor> | null>
  askFileAction: (title: string, value?: string, confirm?: boolean) => Promise<string | null>
  selectDoc: (id: string) => Promise<void>
  notify: (message: string) => void
}) {
const { isTauri, currentWorkspaceRoot, activeDoc, activeId, docs, content, editor, askFileAction, selectDoc, notify } = deps
const missingResources = ref<MissingResource[] | null>(null)
const repairPreview = ref<{ docId: string; beforeDocument: string; afterDocument: string; beforeLine: string; afterLine: string; line: number } | null>(null)
async function previewResourceRepair(item: MissingResource) {
  const replacement = await askFileAction(t('修复 {0}:{1} · 新相对路径', { '0': item.source, '1': item.line }), item.target)
  if (!replacement || replacement === item.target) return
  try { await invoke('validate_local_resource_target', { source: item.source, target: replacement }) }
  catch (error) { notify(t('目标无效：{0}', { "0": String(error) })); return }
  const doc = docs.value.find(doc => doc.relativePath === item.source)
  if (!doc) return
  await selectDoc(doc.id)
  const lines = doc.content.split(/(?<=\n)/)
  const beforeLine = lines[item.line - 1]
  if (!beforeLine) return notify(t('原位置已修改，请重新检查链接'))
  const markers = [`](${item.target}`, `](<${item.target}>`, `]: ${item.target}`, `]:${item.target}`, `]: <${item.target}>`]
  const marker = markers.find(value => beforeLine.includes(value))
  if (!marker) return notify(t('原链接已修改，请重新检查链接'))
  const afterLine = beforeLine.replace(marker, marker.replace(item.target, replacement))
  lines[item.line - 1] = afterLine
  repairPreview.value = { docId: doc.id, beforeDocument: doc.content, afterDocument: lines.join(''), beforeLine: beforeLine.trimEnd(), afterLine: afterLine.trimEnd(), line: item.line }
  missingResources.value = null
}
function applyResourceRepair() {
  const preview = repairPreview.value
  if (!preview) return
  const doc = docs.value.find(item => item.id === preview.docId)
  if (!doc || doc.content !== preview.beforeDocument) return notify(t('文件已修改，请重新预览修复结果'))
  activeId.value = doc.id
  content.value = preview.afterDocument
  repairPreview.value = null
  missingResources.value = null
  void nextTick(() => editor.value?.jumpLine(preview.line))
  notify(t('链接已修改，保存文件后生效'))
}
async function checkResources(all: boolean) {
  if (!isTauri || !currentWorkspaceRoot.value) return notify(t('请先打开文件夹'))
  if (!all && (!activeDoc.value.relativePath || fileKind(activeDoc.value.path) !== 'markdown')) return notify(t('请先选择 Markdown 文件'))
  try {
    missingResources.value = await invoke<MissingResource[]>('check_local_resources', {
      relativePath: all ? null : activeDoc.value.relativePath,
      currentContent: all ? null : activeDoc.value.content
    })
  } catch (error) { notify(t('链接检查失败：{0}', { "0": String(error) })) }
}
async function locateMissingResource(item: MissingResource) {
  const doc = docs.value.find(doc => doc.relativePath === item.source)
  if (!doc) return
  missingResources.value = null
  await selectDoc(doc.id)
  await nextTick()
  editor.value?.jumpLine(item.line)
}

return { missingResources, repairPreview, previewResourceRepair,
  applyResourceRepair, checkResources, locateMissingResource }
}
