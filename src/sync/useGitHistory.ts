import { t } from '../i18n'
import { gitDiffRows, searchDiffRows } from './historyDiff'
import { computed, ref, watch, type ComputedRef, type Ref } from 'vue'
import { invoke } from '@tauri-apps/api/core'
import type { Doc } from '../workspace/sample'

export function useGitHistory(deps: {
  isTauri: boolean
  activeDoc: ComputedRef<Doc>
  dirtyIds: Ref<string[]>
  conflictedIds: Ref<string[]>
  gitEnabled: ComputedRef<boolean>
  gitMaxVersions: ComputedRef<number>
  gitRetentionDays: ComputedRef<number>
  notify: (message: string) => void
}) {
const { isTauri, activeDoc, dirtyIds, conflictedIds, gitEnabled, gitMaxVersions, gitRetentionDays, notify } = deps
type GitVersion = { id: string; created: number }
const historyVersions = ref<GitVersion[]>([])
const selectedHistory = ref<{ id: string; diff: string } | null>(null)
const selectedHistoryDiff = computed(() => gitDiffRows(selectedHistory.value?.diff || ''))
const historySearch = ref('')
const historySearchScope = ref<'all' | 'removed' | 'added'>('all')
const filteredHistoryDiff = computed(() => searchDiffRows(selectedHistoryDiff.value, historySearch.value, historySearchScope.value))
const historySearchBusy = ref(false)
const historySearchError = ref('')
const diffCache = ref<Record<string, string>>({})
const filteredHistoryVersions = computed(() => {
  if (!historySearch.value && historySearchScope.value === 'all') return historyVersions.value
  return historyVersions.value.filter(version => {
    const diff = diffCache.value[version.id]
    return diff !== undefined && searchDiffRows(gitDiffRows(diff), historySearch.value, historySearchScope.value).length > 0
  })
})
const showHistory = ref(false)
const historyBusy = ref(false)
const lastGitFailure = ref('')
watch([showHistory, () => showHistory.value ? activeDoc.value.relativePath : null, () => showHistory.value ? activeDoc.value.content : null], () => { diffCache.value = {} }, { flush: 'sync' })
watch([historySearch, historySearchScope, historyVersions, () => showHistory.value ? activeDoc.value.content : null, () => showHistory.value ? activeDoc.value.relativePath : null, showHistory], (_, __, onCleanup) => {
  let cancelled = false
  let timer: ReturnType<typeof setTimeout> | undefined
  onCleanup(() => { cancelled = true; clearTimeout(timer) })
  historySearchError.value = ''
  historySearchBusy.value = false
  if (!showHistory.value || (!historySearch.value && historySearchScope.value === 'all')) return
  historySearchBusy.value = true
  const cache = diffCache.value
  const versions = [...historyVersions.value]
  const workspaceRoot = activeDoc.value.workspaceRoot
  const relativePath = activeDoc.value.relativePath, currentContent = activeDoc.value.content
  timer = setTimeout(async () => {
    try {
      for (let offset = 0; offset < versions.length && !cancelled; offset += 4) {
        await Promise.all(versions.slice(offset, offset + 4).map(async version => {
          if (cache[version.id] !== undefined) return
          const diff = await invoke<string>('diff_git_version', { workspaceRoot, relativePath, id: version.id, currentContent })
          if (!cancelled) cache[version.id] = diff
        }))
      }
    } catch (error) {
      if (!cancelled) historySearchError.value = t('版本差异读取失败：{0}', { '0': String(error) })
    } finally { if (!cancelled) historySearchBusy.value = false }
  }, 150)
})
async function openHistory() {
  if (!gitEnabled.value) return
  if (!isTauri || !activeDoc.value.relativePath) { notify(t('请先打开文件')); return }
  if (showHistory.value) { showHistory.value = false; return }
  showHistory.value = true
  selectedHistory.value = null
  historySearch.value = ''
  historySearchScope.value = 'all'
  historyVersions.value = []
  try { historyVersions.value = await invoke<GitVersion[]>('list_git_versions', { workspaceRoot: activeDoc.value.workspaceRoot, relativePath: activeDoc.value.relativePath, gitMaxVersions: gitMaxVersions.value, gitRetentionDays: gitRetentionDays.value }) }
  catch (error) { notify(t('历史版本读取失败：{0}', { "0": String(error) })) }
}
async function compareHistory(id: string) {
  if (selectedHistory.value?.id === id) { selectedHistory.value = null; return }
  try { selectedHistory.value = { id, diff: await invoke<string>('diff_git_version', { workspaceRoot: activeDoc.value.workspaceRoot, relativePath: activeDoc.value.relativePath, id, currentContent: activeDoc.value.content }) } }
  catch (error) { notify(t('版本差异读取失败：{0}', { "0": String(error) })) }
}
async function restoreHistory(id: string) {
  const doc = activeDoc.value
  if (!doc.relativePath) return
  if (dirtyIds.value.includes(doc.id) || conflictedIds.value.includes(doc.id)) { notify(t('请先处理当前文件的未保存内容或磁盘冲突')); return }
  if (!window.confirm(t('确认恢复此历史版本？将替换当前文件内容'))) return
  historyBusy.value = true
  try {
    const restored = await invoke<{ content: string; version: string; encoding: string }>('restore_git_version', { workspaceRoot: doc.workspaceRoot, relativePath: doc.relativePath, id, expectedVersion: doc.version, gitMaxVersions: gitMaxVersions.value, gitRetentionDays: gitRetentionDays.value })
    doc.content = restored.content
    doc.diskContent = restored.content
    doc.version = restored.version
    doc.encoding = restored.encoding
    doc.updated = Date.now()
    dirtyIds.value = dirtyIds.value.filter(value => value !== doc.id)
    showHistory.value = false
    selectedHistory.value = null
  } catch (error) { notify(t('恢复失败：{0}', { "0": String(error) })) }
  finally { historyBusy.value = false }
}

return { filteredHistoryVersions, historySearchBusy, historySearchError, historySearch, historySearchScope, filteredHistoryDiff, historyVersions, selectedHistory, selectedHistoryDiff, showHistory,
  historyBusy, lastGitFailure, openHistory, compareHistory, restoreHistory }
}
