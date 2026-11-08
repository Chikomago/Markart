import { t } from '../i18n'
import { nextTick, ref, type Ref } from 'vue'
import { invoke } from '@tauri-apps/api/core'


export function useFileTreeActions(deps: {
  isTauri: boolean
  currentWorkspaceRoot: Ref<string>
  workspaceDirectories: Ref<string[]>
  moveWithLinks: (from: string, to: string, root?: string) => Promise<unknown>
  manageItem: (path: string, action: 'rename' | 'trash') => Promise<void>
  notify: (message: string) => void
}) {
const { isTauri, currentWorkspaceRoot, workspaceDirectories, moveWithLinks, manageItem, notify } = deps
let filePointerDrag: { root: string; path: string; x: number; y: number; moved: boolean } | null = null
const fileDropTarget = ref<string | null>(null)
const fileDragGhost = ref<{ name: string; x: number; y: number } | null>(null)
const suppressFileClick = ref(false)
function startFileDrag(event: PointerEvent, path: string) {
  if (!isTauri || event.button !== 0) return
  event.preventDefault()
  const target = event.currentTarget as HTMLElement
  target.setPointerCapture(event.pointerId)
  filePointerDrag = { root: currentWorkspaceRoot.value, path, x: event.clientX, y: event.clientY, moved: false }
  document.addEventListener('pointermove', moveFileDrag)
  document.addEventListener('pointerup', finishFileDrag, { once: true })
  document.addEventListener('pointercancel', cancelFileDrag, { once: true })
}
function folderAtPointer(event: PointerEvent): string | null {
  const target = document.elementFromPoint(event.clientX, event.clientY)?.closest<HTMLElement>('[data-file-path], [data-folder-target]')
  if (!target) return null
  const file = target.dataset.filePath
  const folder = file !== undefined ? file.split('/').slice(0, -1).join('/') : target.dataset.folderTarget ?? null
  if (folder !== null && filePointerDrag && `${folder ? `${folder}/` : ''}${filePointerDrag.path.split('/').pop()}` === filePointerDrag.path) return null
  return folder
}
function moveFileDrag(event: PointerEvent) {
  if (!filePointerDrag) return
  if (!filePointerDrag.moved && Math.hypot(event.clientX - filePointerDrag.x, event.clientY - filePointerDrag.y) < 5) return
  filePointerDrag.moved = true
  fileDragGhost.value = { name: filePointerDrag.path.split('/').pop() || filePointerDrag.path, x: event.clientX + 12, y: event.clientY + 12 }
  fileDropTarget.value = folderAtPointer(event)
}
function cancelFileDrag() {
  document.removeEventListener('pointermove', moveFileDrag)
  document.removeEventListener('pointerup', finishFileDrag)
  document.removeEventListener('pointercancel', cancelFileDrag)
  filePointerDrag = null
  fileDropTarget.value = null
  fileDragGhost.value = null
}
function finishFileDrag(event: PointerEvent) {
  const root = filePointerDrag?.root
  const path = filePointerDrag?.path
  const moved = filePointerDrag?.moved
  const target = folderAtPointer(event)
  cancelFileDrag()
  if (!moved || !path || root !== currentWorkspaceRoot.value) return
  suppressFileClick.value = true
  window.setTimeout(() => { suppressFileClick.value = false }, 0)
  if (target !== null) void moveFileToFolder(path, target)
}
async function moveFileToFolder(from: string, folder: string) {
  const to = `${folder ? `${folder}/` : ''}${from.split('/').pop()}`
  if (to === from) return
  try {
    await moveWithLinks(from, to)
  } catch (error) { notify(t('移动失败：{0}', { "0": String(error) })) }
}
const itemActions = ref<{ path: string; x: number; y: number } | null>(null)
async function runItemUtility(action: 'window' | 'reveal' | 'copy' | 'info') {
  const path = itemActions.value?.path
  itemActions.value = null
  if (path === undefined) return
  try {
    if (action === 'reveal') await invoke('reveal_workspace_item', { workspaceRoot: currentWorkspaceRoot.value, relativePath: path })
    else if (action === 'copy') { await navigator.clipboard.writeText(`${currentWorkspaceRoot.value}${path ? `/${path}` : ''}`); notify(t('已复制')) }
    else if (action === 'info') await invoke('show_workspace_item_info', { workspaceRoot: currentWorkspaceRoot.value, relativePath: path })
    else { const folder = path === '' || workspaceDirectories.value.includes(path); const root = folder && path ? `${currentWorkspaceRoot.value}/${path}` : currentWorkspaceRoot.value; await invoke('create_workspace_window', { root, path: folder ? null : path }) }
  } catch (error) { notify(t('文件操作失败：{0}', { "0": String(error) })) }
}
const inlineRename = ref<{ path: string; name: string; root: string; extension: string } | null>(null)
function startInlineRename(path: string) {
  const original = path.split('/').pop() || path
  const extension = workspaceDirectories.value.includes(path) ? '' : original.match(/\.[^.]+$/)?.[0] || ''
  inlineRename.value = { root: currentWorkspaceRoot.value, extension, path, name: original.slice(0, original.length - extension.length) }
  void nextTick(() => { const input = document.querySelector<HTMLInputElement>('.tree-inline-rename input'); input?.focus(); input?.select() })
}
async function commitInlineRename() {
  const current = inlineRename.value
  inlineRename.value = null
  if (!current) return
  const original = current.path.split('/').pop() || current.path
  const extension = current.extension
  if (!current.name.trim()) return notify(t('请输入文件名'))
  const name = extension && current.name.trim().endsWith(extension) ? current.name.trim() : `${current.name.trim()}${extension}`
  if (!name || name === current.path.split('/').pop()) return
  if (name.includes('/') || name === '.' || name === '..') return notify(t('文件名不能是 . 或 ..，也不能包含 /'))
  const parent = current.path.split('/').slice(0, -1).join('/')
  try {
    const to = `${parent ? `${parent}/` : ''}${name}`
    await moveWithLinks(current.path, to, current.root)
  }
  catch (error) { notify(t('重命名失败：{0}', { "0": String(error) })) }
}
function showItemActions(relativePath: string, event: MouseEvent) {
  itemActions.value = { path: relativePath, x: Math.max(8, Math.min(event.clientX, window.innerWidth - 198)), y: Math.max(8, Math.min(event.clientY, window.innerHeight - 350)) }
}
function runItemAction(action: 'rename' | 'trash') {
  const path = itemActions.value?.path
  itemActions.value = null
  if (path && action === 'rename') startInlineRename(path)
  else if (path) void manageItem(path, action)
}

return { fileDropTarget, fileDragGhost, suppressFileClick, startFileDrag,
  itemActions, runItemUtility, inlineRename, commitInlineRename,
  showItemActions, runItemAction }
}
