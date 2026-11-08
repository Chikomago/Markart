import { t } from '../i18n'
import { onBeforeUnmount, onMounted, ref, watch, type ComputedRef, type Ref } from 'vue'
import { invoke } from '@tauri-apps/api/core'
import { emit, listen } from '@tauri-apps/api/event'
import type { Doc } from '../workspace/sample'

export type DiskStatus = { changed: boolean; missing: boolean; content: string | null }
type OpenedFile = { content: string; encoding: string; version: string }

export function useDocumentSafety(deps: {
  refreshWorkspace?: () => Promise<void>
  isTauri: boolean
  docs: Ref<Doc[]>
  dirtyIds: Ref<string[]>
  activeDoc: ComputedRef<Doc>
  activeId: Ref<string>
  externalFileChanges?: Readonly<Ref<'auto' | 'confirm'>>
  openTabs?: Ref<string[]>
  notify: (message: string) => void
  currentWorkspaceRoot: Ref<string>
  gitEnabled: ComputedRef<boolean>
  gitMaxVersions: ComputedRef<number>
  gitRetentionDays: ComputedRef<number>
  lastGitFailure: Ref<string>
  scheduleWebdavSync: () => void
  scheduleGithubSync: () => void
  saveTemporaryDoc: () => Promise<boolean>
  persist: () => void
}) {
const { isTauri, docs, dirtyIds, activeDoc, activeId, notify,
  currentWorkspaceRoot, gitEnabled, gitMaxVersions, gitRetentionDays,
  lastGitFailure, scheduleWebdavSync, scheduleGithubSync, saveTemporaryDoc, persist } = deps
const conflict = ref<{ docId: string; disk: DiskStatus } | null>(null)
const conflictedIds = ref<string[]>([])
const ignoredConflicts = new Map<string, string | null>()
const draftWriteTimers = new Map<string, ReturnType<typeof setTimeout>>()
let draftWriteQueue = Promise.resolve()
async function flushDrafts() {
  const pending: Promise<void>[] = []
  for (const doc of docs.value.filter(doc => dirtyIds.value.includes(doc.id) && doc.relativePath && doc.version)) {
    const timer = draftWriteTimers.get(doc.id)
    if (timer) { clearTimeout(timer); draftWriteTimers.delete(doc.id) }
    const relativePath = doc.relativePath!
    const workspaceRoot = doc.workspaceRoot || currentWorkspaceRoot.value
    const content = doc.content
    const expectedVersion = doc.version!
    const write = draftWriteQueue.then(() => invoke<void>('write_draft', { relativePath, content, expectedVersion, workspaceRoot }))
    draftWriteQueue = write.catch(() => {})
    pending.push(write)
  }
  await Promise.all(pending)
}
function queueDraft(doc: Doc) {
  if (!isTauri || !doc.relativePath || !doc.loaded || !doc.version) return
  const existing = draftWriteTimers.get(doc.id)
  if (existing) clearTimeout(existing)
  const relativePath = doc.relativePath
  const workspaceRoot = doc.workspaceRoot || currentWorkspaceRoot.value
  const content = doc.content
  const expectedVersion = doc.version
  draftWriteTimers.set(doc.id, setTimeout(() => {
    draftWriteTimers.delete(doc.id)
    draftWriteQueue = draftWriteQueue.then(() => invoke<void>('write_draft', { relativePath, content, expectedVersion, workspaceRoot })).catch(error => notify(t('草稿暂存失败：{0}', { "0": String(error) })))
  }, 500)
  )
}
const externalDraftPrefix = 'markart-external-draft:'
let inspecting = false
function preserveExternalDraft(doc: Doc) {
  const id = `external:${crypto.randomUUID()}`
  const filename = doc.path.split('/').pop() || '文件.md'
  const backup: Doc = { id, path: filename.replace(/(\.[^.]+)$/, '（未保存）$1'), content: doc.content, loaded: true, temporary: true, updated: Date.now() }
  localStorage.setItem(externalDraftPrefix + id, JSON.stringify(backup))
  docs.value = [...docs.value, backup]; dirtyIds.value = [...dirtyIds.value, id]
  if (deps.openTabs) deps.openTabs.value = [...deps.openTabs.value, id]
}
function restoreExternalDrafts() {
  try {
    for (let index = 0; index < localStorage.length; index++) {
      const key = localStorage.key(index); if (!key?.startsWith(externalDraftPrefix)) continue
      const saved: unknown = JSON.parse(localStorage.getItem(key) || 'null')
      if (!saved || typeof saved !== 'object') continue
      const doc = saved as Doc
      if (typeof doc.id !== 'string' || !doc.id.startsWith('external:') || typeof doc.content !== 'string' || typeof doc.path !== 'string' || docs.value.some(item => item.id === doc.id)) continue
      docs.value = [...docs.value, { id: doc.id, path: doc.path, content: doc.content, updated: Number(doc.updated) || Date.now(), loaded: true, temporary: true }]; dirtyIds.value = [...dirtyIds.value, doc.id]
      if (deps.openTabs) deps.openTabs.value = [...deps.openTabs.value, doc.id]
    }
  } catch (error) { notify(t('未保存内容恢复失败：{0}', { "0": String(error) })) }
}
watch([docs, dirtyIds], () => {
  for (const doc of docs.value) if (doc.id.startsWith('external:') && dirtyIds.value.includes(doc.id)) {
    try { localStorage.setItem(externalDraftPrefix + doc.id, JSON.stringify(doc)) } catch (error) { notify(t('未保存内容暂存失败：{0}', { "0": String(error) })) }
  }
}, { deep: true })
async function inspectActiveDocument() {
  const doc = activeDoc.value
  if (!isTauri || !doc.relativePath || !doc.loaded || conflict.value || inspecting) return
  inspecting = true
  const inspectedRoot = currentWorkspaceRoot.value, inspectedPath = doc.relativePath
  const inspectedVersion = doc.version, baseline = doc.diskContent ?? doc.content
  const stillCurrent = () => inspectedRoot === currentWorkspaceRoot.value && doc.id === activeId.value && doc.relativePath === inspectedPath && doc.version === inspectedVersion && docs.value.includes(doc)
  try {
    let disk: DiskStatus
    try { disk = await invoke<DiskStatus>('inspect_document', { relativePath: inspectedPath, workspaceRoot: inspectedRoot }) }
    catch (error) {
      if (!stillCurrent()) return
      if (!String(error).includes('请先读取文件')) throw error
      // Rebuild the native baseline without replacing the editor or accepting a changed disk version.
      const opened = await invoke<OpenedFile>('read_document', { relativePath: inspectedPath, workspaceRoot: inspectedRoot })
      if (!stillCurrent()) return
      disk = { changed: inspectedVersion ? opened.version !== inspectedVersion : opened.content !== baseline, missing: false, content: opened.content }
    }
    if (disk.changed && stillCurrent() && (!ignoredConflicts.has(doc.id) || ignoredConflicts.get(doc.id) !== disk.content)) {
      if (disk.missing) return
      if ((deps.externalFileChanges?.value || 'auto') === 'auto') {
        await reloadAfterConflict({ docId: doc.id, disk }, true)
      } else { conflictedIds.value = [...new Set([...conflictedIds.value, doc.id])]; conflict.value = { docId: doc.id, disk } }
    }
  } catch (error) { if (stillCurrent()) notify(t('文件更新失败：{0}', { "0": String(error) })) }
  finally { inspecting = false }
}
async function reloadAfterConflict(item = conflict.value, preserve = false) {
  const root = currentWorkspaceRoot.value
  const doc = docs.value.find(candidate => candidate.id === item?.docId)
  if (!doc?.relativePath) return
  try {
    const timer = draftWriteTimers.get(doc.id)
    if (timer) { clearTimeout(timer); draftWriteTimers.delete(doc.id) }
    await draftWriteQueue
    const opened = await invoke<OpenedFile>('read_document', { workspaceRoot: doc.workspaceRoot || currentWorkspaceRoot.value, relativePath: doc.relativePath })
    if (root !== currentWorkspaceRoot.value || !docs.value.includes(doc)) return
    if (preserve && dirtyIds.value.includes(doc.id) && doc.content !== opened.content) preserveExternalDraft(doc)
    doc.content = opened.content
    doc.loaded = true
    doc.excerpt = opened.content.split(/\r?\n/).slice(0, 2).join(' ')
    doc.diskContent = opened.content
    doc.version = opened.version
    doc.encoding = opened.encoding
    doc.updated = Date.now()
    dirtyIds.value = dirtyIds.value.filter(id => id !== doc.id)
    conflictedIds.value = conflictedIds.value.filter(id => id !== doc.id)
    await invoke('clear_draft', { workspaceRoot: doc.workspaceRoot || currentWorkspaceRoot.value, relativePath: doc.relativePath })
    conflict.value = null
    ignoredConflicts.delete(doc.id)
  } catch (error) { if (preserve && item) conflict.value = item; notify(t('重新加载失败：{0}', { "0": String(error) })) }
}
function keepCurrentEditing() {
  if (conflict.value) ignoredConflicts.set(conflict.value.docId, conflict.value.disk.content)
  conflict.value = null
}

function cancelDraft(id: string) {
  const timer = draftWriteTimers.get(id)
  if (timer) { clearTimeout(timer); draftWriteTimers.delete(id) }
}
function pendingDrafts() { return draftWriteQueue }
function clearDraftFor(doc: Doc) {
  cancelDraft(doc.id)
  if (!(doc.workspaceRelativePath || doc.relativePath)) return
  const relativePath = doc.workspaceRelativePath || doc.relativePath!
  const workspaceRoot = doc.workspaceRoot || currentWorkspaceRoot.value
  draftWriteQueue = draftWriteQueue.then(() => invoke<void>('clear_draft', { relativePath, workspaceRoot })).catch(error => notify(t('草稿清理失败：{0}', { "0": String(error) })))
}
function resetConflicts() { conflictedIds.value = []; conflict.value = null; ignoredConflicts.clear() }
function reportConflict(id: string, disk: DiskStatus) {
  conflictedIds.value = [...new Set([...conflictedIds.value, id])]
  if ((deps.externalFileChanges?.value || 'auto') === 'auto' && !disk.missing) void reloadAfterConflict({ docId: id, disk }, true)
  else conflict.value = { docId: id, disk }
}
async function discardDoc(id: string): Promise<boolean> {
  const doc = docs.value.find(item => item.id === id)
  if (!doc) return false
  cancelDraft(id)
  try {
    await pendingDrafts()
    if (isTauri && doc.relativePath && !doc.temporary) {
      const opened = await invoke<OpenedFile>('read_document', { workspaceRoot: doc.workspaceRoot || currentWorkspaceRoot.value, relativePath: doc.relativePath })
      await invoke('clear_draft', { workspaceRoot: doc.workspaceRoot || currentWorkspaceRoot.value, relativePath: doc.relativePath })
      doc.content = opened.content; doc.diskContent = opened.content
      doc.version = opened.version; doc.encoding = opened.encoding
    } else doc.content = doc.diskContent || ''
    if (id.startsWith('external:')) localStorage.removeItem(externalDraftPrefix + id)
    dirtyIds.value = dirtyIds.value.filter(item => item !== id)
    conflictedIds.value = conflictedIds.value.filter(item => item !== id)
    if (conflict.value?.docId === id) conflict.value = null
    ignoredConflicts.delete(id)
    return true
  } catch (error) { notify(t('无法丢弃修改：{0}', { "0": String(error) })); queueDraft(doc); return false }
}
const saveBusy = ref(false)
async function saveDoc() {
  if (saveBusy.value) return
  saveBusy.value = true
  try { await saveDocNow() } finally { saveBusy.value = false }
}
async function saveDocNow() {
  const doc = activeDoc.value
  if (isTauri) {
    if (doc.temporary) { if (await saveTemporaryDoc()) localStorage.removeItem(externalDraftPrefix + doc.id); return }
    if (!doc.relativePath || !doc.loaded) { notify(t('请先打开本地文件')); return }
    const submitted = doc.content
    try {
      cancelDraft(doc.id)
      await pendingDrafts()
      const result = await invoke<{ updated: number; version: string; gitWarning?: string }>('save_document', { workspaceRoot: doc.workspaceRoot || currentWorkspaceRoot.value, relativePath: doc.relativePath, content: submitted, expectedVersion: doc.version, gitEnabled: gitEnabled.value, gitMaxVersions: gitMaxVersions.value, gitRetentionDays: gitRetentionDays.value })
      if (doc.content === submitted) dirtyIds.value = dirtyIds.value.filter(id => id !== doc.id)
      doc.updated = result.updated
      doc.version = result.version
      doc.diskContent = submitted
      void emit('markart-document-saved', { root: currentWorkspaceRoot.value, relativePath: doc.relativePath })
      conflictedIds.value = conflictedIds.value.filter(id => id !== doc.id)
      if (doc.content === submitted) {
        try { await invoke('clear_draft', { workspaceRoot: doc.workspaceRoot || currentWorkspaceRoot.value, relativePath: doc.relativePath }) }
        catch (error) { notify(t('文件已保存，草稿清理失败：{0}', { "0": String(error) })); return }
      } else queueDraft(doc)
      lastGitFailure.value = result.gitWarning || ''
      notify(result.gitWarning ? `文件已保存，历史版本记录失败：${result.gitWarning}` : '已保存')
      scheduleWebdavSync()
      scheduleGithubSync()
    } catch (error) {
      queueDraft(doc)
      notify(t('保存失败：{0}', { "0": String(error) }))
      try {
        const disk = await invoke<DiskStatus>('inspect_document', { workspaceRoot: doc.workspaceRoot || currentWorkspaceRoot.value, relativePath: doc.relativePath })
        if (disk.changed || String(error).includes('旧磁盘版本')) { reportConflict(doc.id, disk.changed ? disk : { changed: true, missing: false, content: doc.diskContent || null }) }
      } catch { /* 保留当前编辑和未保存标记 */ }
    }
    return
  }
  dirtyIds.value = dirtyIds.value.filter(id => id !== doc.id)
  persist()
  notify(t('已保存'))
}
if (isTauri) {
  watch(activeId, () => { void inspectActiveDocument() })
  let diskCheckTimer: ReturnType<typeof setInterval> | undefined
  const refreshOnFocus = () => { void deps.refreshWorkspace?.().catch(() => {}) }
  onMounted(() => { window.addEventListener('focus', refreshOnFocus); diskCheckTimer = setInterval(inspectActiveDocument, 1000); window.addEventListener('focus', inspectActiveDocument) })
  onBeforeUnmount(() => { window.removeEventListener('focus', refreshOnFocus); if (diskCheckTimer) clearInterval(diskCheckTimer); window.removeEventListener('focus', inspectActiveDocument) })
  watch(currentWorkspaceRoot, async (root, _previous, onCleanup) => {
    if (!root) return
    const id = crypto.randomUUID(); let disposed = false, started = false
    let unlisten: (() => void) | undefined
    onCleanup(() => { disposed = true; unlisten?.(); if (started) void invoke('plugin_watch_stop', { id }).catch(() => {}) })
    try {
      unlisten = await listen(`markart-plugin-files:${id}`, () => { void deps.refreshWorkspace?.().catch(() => {}); void inspectActiveDocument() })
      if (disposed) { unlisten(); return }
      await invoke('plugin_watch_start', { id, path: root, options: { recursive: true, debounceMs: 150 } }); started = true
      if (disposed) await invoke('plugin_watch_stop', { id })
    } catch { unlisten?.() /* Polling remains available if native watching cannot start. */ }
  }, { immediate: true })
}
onBeforeUnmount(() => { for (const timer of draftWriteTimers.values()) clearTimeout(timer) })
return { saveBusy, restoreExternalDrafts, conflict, conflictedIds, flushDrafts, queueDraft, inspectActiveDocument,
  reloadAfterConflict, keepCurrentEditing, cancelDraft, pendingDrafts,
  clearDraftFor, resetConflicts, reportConflict, saveDoc, discardDoc }
}
