import { t } from '../i18n'
import { computed, onBeforeUnmount, onMounted, ref, watch, type Ref, type WritableComputedRef } from 'vue'
import { invoke } from '@tauri-apps/api/core'
import { mergeGithubRepos, type GithubRepo } from './githubRepoList'
import type { Doc } from '../workspace/sample'

export function useCloudSync(deps: {
  isTauri: boolean
  contextChanging?: Readonly<Ref<boolean>>
  settings: {
    syncConflictPolicy: WritableComputedRef<'merge' | 'remote'>
    webdavEnabled: WritableComputedRef<boolean>; webdavSyncIntervalSeconds: WritableComputedRef<number>; webdavRetryOnFailure: WritableComputedRef<boolean>; webdavUrl: WritableComputedRef<string>; webdavUsername: WritableComputedRef<string>
    githubEnabled: WritableComputedRef<boolean>; githubSyncIntervalSeconds: WritableComputedRef<number>; githubRetryOnFailure: WritableComputedRef<boolean>; githubUrl: WritableComputedRef<string>; githubUsername: WritableComputedRef<string>
  }
  currentWorkspaceRoot: Ref<string>
  docs: Ref<Doc[]>
  dirtyIds: Ref<string[]>
  getConflictedIds: () => string[]
  refreshAfterSync: () => Promise<void>
  notify: (message: string) => void
  showSettings: Ref<boolean>
  settingTab: Readonly<Ref<string>>
  showDirectorySync: Ref<boolean>
  githubCreatingRepo: Ref<boolean>
}) {
const { isTauri, currentWorkspaceRoot, docs, dirtyIds, getConflictedIds, refreshAfterSync, notify, showSettings, settingTab, showDirectorySync, githubCreatingRepo } = deps
const { webdavEnabled, webdavSyncIntervalSeconds, webdavRetryOnFailure, webdavUrl, webdavUsername, githubEnabled, githubSyncIntervalSeconds, githubRetryOnFailure, githubUrl, githubUsername } = deps.settings
const webdavBoundUrl = ref('')
const webdavBindingLoaded = ref(false)
const webdavFolderDraft = ref('')
const webdavFolders = ref<string[]>([])
const webdavFoldersBusy = ref(false)
const webdavBindingBusy = ref(false)
const webdavPasswordDraft = ref('')
const webdavHasPassword = ref(false)
const webdavBusy = ref(false)
const webdavUnbindPendingRoot = ref('')
const webdavStatus = ref('尚未同步')
const githubBoundUrl = ref('')
const githubBindingLoaded = ref(false)
const githubRepos = ref<GithubRepo[]>([])
const githubCreatedRepos = ref<GithubRepo[]>([])
const githubRepoDraft = ref('')
const githubRepoBusy = ref(false)
const githubTokenDraft = ref('')
const githubHasToken = ref(false)
const githubBusy = ref(false)
const githubUnbindPendingRoot = ref('')
const githubStatus = ref('尚未同步')
const syncTimesKey = 'markart-sync-times-v1'
const syncTimes = ref<Record<string, number>>({})
try {
  const stored = JSON.parse(localStorage.getItem(syncTimesKey) || '{}')
  if (stored && typeof stored === 'object' && !Array.isArray(stored)) syncTimes.value = Object.fromEntries(Object.entries(stored).filter((entry): entry is [string, number] => typeof entry[1] === 'number' && Number.isFinite(entry[1])))
} catch { /* Sync remains available when local storage is unavailable. */ }
function syncTimeKey(provider: string, url: string) { return JSON.stringify([currentWorkspaceRoot.value, provider, url]) }
function recordSyncTime(provider: string, url: string) {
  syncTimes.value[syncTimeKey(provider, url)] = Date.now()
  try { localStorage.setItem(syncTimesKey, JSON.stringify(syncTimes.value)) } catch { /* Keep the session timestamp. */ }
}
const directorySyncBusy = computed(() => githubBusy.value || webdavBusy.value)
const directorySyncBound = computed(() => !!(githubHasToken.value && githubBoundUrl.value || webdavHasPassword.value && webdavBoundUrl.value))
const directorySyncHint = computed(() => {
  const providers = [
    { name: 'GitHub', url: githubBoundUrl.value, authenticated: githubHasToken.value },
    { name: 'WebDAV', url: webdavBoundUrl.value, authenticated: webdavHasPassword.value },
  ].filter(provider => provider.url && provider.authenticated)
  return providers.map(provider => {
    const time = syncTimes.value[syncTimeKey(provider.name, provider.url)]
    return `${provider.name} · ${time ? t('最近同步：{0}', { '0': new Date(time).toLocaleString() }) : t('尚未同步')}`
  }).join('\n')
})
async function runDirectorySync() {
  if (directorySyncBusy.value) return
  const root = currentWorkspaceRoot.value
  await runGithubSync(true)
  if (root === currentWorkspaceRoot.value) await runWebdavSync(true)
}
const directorySyncAvailable = computed(() => githubHasToken.value || webdavHasPassword.value)
const directorySyncUnbound = computed(() => directorySyncAvailable.value
  && (!githubHasToken.value || githubBindingLoaded.value)
  && (!webdavHasPassword.value || webdavBindingLoaded.value)
  && !githubBoundUrl.value && !webdavBoundUrl.value)
watch(directorySyncAvailable, available => { if (!available) showDirectorySync.value = false })
const githubExplicitlyLoggedOutKey = 'markart-github-explicit-logout-v1'
let githubTimer: ReturnType<typeof setTimeout> | undefined
let githubInterval: ReturnType<typeof setInterval> | undefined
let githubRetryTimer: ReturnType<typeof setTimeout> | undefined
let githubRetryAttempt = 0
let githubNeedsRefresh = false
async function checkGithubToken() {
  if (!isTauri) { githubHasToken.value = false; return }
  try {
    githubHasToken.value = await invoke<boolean>('github_has_token')
    if (!githubHasToken.value && !localStorage.getItem(githubExplicitlyLoggedOutKey) && githubUrl.value && githubUsername.value) githubHasToken.value = await invoke<boolean>('github_migrate_token', { url: githubUrl.value, username: githubUsername.value })
  }
  catch { githubHasToken.value = false }
}
async function loadGithubRepos() {
  if (!isTauri || !githubHasToken.value) return
  try {
    const remote = await invoke<GithubRepo[]>('github_list_private_repos')
    const result = mergeGithubRepos(remote, githubCreatedRepos.value)
    githubRepos.value = result.repos
  }
  catch (error) { notify(t('仓库列表读取失败：{0}', { "0": String(error) })) }
}
async function logoutGithub() {
  if (!isTauri || githubBusy.value || githubRepoBusy.value) return
  try {
    await invoke('github_logout')
    localStorage.setItem(githubExplicitlyLoggedOutKey, '1')
    githubHasToken.value = false
    githubRepos.value = []
    githubCreatedRepos.value = []
    githubTokenDraft.value = ''
    githubStatus.value = '尚未同步'
  } catch (error) { notify(t('退出 GitHub 失败：{0}', { "0": String(error) })) }
}
async function loadGithubBinding() {
  githubBoundUrl.value = ''
  githubBindingLoaded.value = false
  const root = currentWorkspaceRoot.value
  if (!isTauri || !root) return
  try {
    const bound = await invoke<string | null>('github_get_binding')
    if (root === currentWorkspaceRoot.value) githubBoundUrl.value = bound || ''
  } catch (error) { if (root === currentWorkspaceRoot.value) notify(t('仓库关联读取失败：{0}', { "0": String(error) })) }
  finally { if (root === currentWorkspaceRoot.value) githubBindingLoaded.value = true }
}
async function bindGithubRepo(url: string) {
  if (!isTauri || !currentWorkspaceRoot.value || githubRepoBusy.value) return
  githubRepoBusy.value = true
  try {
    await invoke('github_bind_workspace', { url })
    await loadGithubBinding()
    githubStatus.value = githubEnabled.value ? '已绑定，正在同步…' : '已绑定，可手动同步'
    scheduleGithubSync()
  } catch (error) { notify(String(error).includes('HTTP 404') ? '绑定失败：当前令牌无法访问此仓库。请在 GitHub Token 的 Repository access 中加入该仓库后刷新。' : `绑定失败：${String(error)}`) }
  finally { githubRepoBusy.value = false }
}
async function createGithubRepo() {
  if (!isTauri || !githubRepoDraft.value.trim() || !currentWorkspaceRoot.value || githubRepoBusy.value) return
  githubRepoBusy.value = true
  try {
    const repo = await invoke<GithubRepo>('github_create_private_repo', { name: githubRepoDraft.value.trim() })
    githubCreatedRepos.value = [repo, ...githubCreatedRepos.value]
    githubRepos.value = [repo, ...githubRepos.value.filter(item => item.url !== repo.url)]
    githubRepoDraft.value = ''
    githubCreatingRepo.value = false
    githubStatus.value = '尚未同步'
    await loadGithubRepos()
  } catch (error) { notify(t('创建失败：{0}', { "0": String(error) })) }
  finally { githubRepoBusy.value = false }
}
async function unbindGithubRepo() {
  if (!isTauri || !githubBoundUrl.value || githubRepoBusy.value) return
  if (githubBusy.value) { githubUnbindPendingRoot.value = currentWorkspaceRoot.value || ''; return }
  githubRepoBusy.value = true
  try { await invoke('github_unbind_workspace'); githubBoundUrl.value = ''; githubStatus.value = '尚未同步' }
  catch (error) { notify(t('解除绑定失败：{0}', { "0": String(error) })) }
  finally { githubRepoBusy.value = false }
}
async function storeGithubToken() {
  if (!githubTokenDraft.value) return
  try {
    githubUsername.value = await invoke<string>('save_github_token', { token: githubTokenDraft.value })
    githubTokenDraft.value = ''; githubHasToken.value = true
    localStorage.removeItem(githubExplicitlyLoggedOutKey)
    await loadGithubRepos()
    scheduleGithubSync()
  } catch (error) { notify(t('令牌保存失败：{0}', { "0": String(error) })) }
}
async function runGithubSync(manual = false) {
  if (deps.contextChanging?.value || !isTauri || (!manual && !githubEnabled.value) || !githubHasToken.value || !currentWorkspaceRoot.value || !githubBoundUrl.value || githubBusy.value) return
  const root = currentWorkspaceRoot.value
  githubBusy.value = true
  githubStatus.value = '同步中…'
  try {
    const protectedPaths = docs.value.filter(doc => doc.relativePath && (dirtyIds.value.includes(doc.id) || getConflictedIds().includes(doc.id))).map(doc => doc.relativePath)
    const result = await invoke<{ uploaded: boolean; downloaded: number; conflicts: string[]; copies: string[]; changed: string[] }>('sync_github', { username: githubUsername.value || 'x-access-token', protected: protectedPaths, protectedAbsolute: docs.value.filter(doc => doc.absolutePath && (dirtyIds.value.includes(doc.id) || getConflictedIds().includes(doc.id))).map(doc => doc.absolutePath), conflictPolicy: deps.settings.syncConflictPolicy.value })
    if (root !== currentWorkspaceRoot.value || !githubBoundUrl.value) return
    if (!result.conflicts.length) recordSyncTime('GitHub', githubBoundUrl.value)
    githubRetryAttempt = 0
    if (githubRetryTimer) clearTimeout(githubRetryTimer)
    githubRetryTimer = undefined
    githubStatus.value = result.conflicts.length ? `冲突 ${result.conflicts.length} 项，已暂停` : `已同步 · ${result.uploaded ? '已推送' : '无待推送'} · 下载 ${result.downloaded}`
    if (result.conflicts.length) notify(t('GitHub 同步冲突：{0}', { "0": result.conflicts.slice(0, 3).join('、') }))
    if (result.copies?.length) notify(t('已另存 {0} 个版本副本', { "0": result.copies.length }))
    githubNeedsRefresh ||= result.changed.length > 0
    if (githubNeedsRefresh && !docs.value.some(doc => doc.relativePath && dirtyIds.value.includes(doc.id))) {
      await refreshAfterSync()
      if (root === currentWorkspaceRoot.value) githubNeedsRefresh = false
    }
  } catch (error) {
    if (root === currentWorkspaceRoot.value && githubBoundUrl.value) {
      githubStatus.value = `同步失败：${String(error)}`
      if (githubEnabled.value && githubRetryOnFailure.value && !githubUnbindPendingRoot.value && !githubRetryTimer) {
        const delay = Math.min(10000 * 2 ** githubRetryAttempt++, 300000)
        githubRetryTimer = setTimeout(() => { githubRetryTimer = undefined; void runGithubSync() }, delay)
      }
    }
  }
  finally {
    githubBusy.value = false
    if (githubUnbindPendingRoot.value) {
      const pendingRoot = githubUnbindPendingRoot.value
      githubUnbindPendingRoot.value = ''
      if (pendingRoot === root && pendingRoot === currentWorkspaceRoot.value) void unbindGithubRepo()
    }
  }
}
function scheduleGithubSync() {
  if (githubTimer) clearTimeout(githubTimer)
  if (!deps.contextChanging?.value && githubEnabled.value && githubHasToken.value && githubBoundUrl.value) githubTimer = setTimeout(() => { void runGithubSync() }, 2500)
}
watch([githubEnabled, githubBoundUrl, githubHasToken], scheduleGithubSync)
watch([githubEnabled, githubHasToken, githubBoundUrl, githubSyncIntervalSeconds, githubRetryOnFailure], () => {
  if (githubInterval) clearInterval(githubInterval)
  githubInterval = undefined
  if (githubRetryTimer) clearTimeout(githubRetryTimer)
  githubRetryTimer = undefined
  githubRetryAttempt = 0
  if (isTauri && githubEnabled.value && githubHasToken.value && githubBoundUrl.value) githubInterval = setInterval(() => { void runGithubSync() }, githubSyncIntervalSeconds.value * 1000)
}, { immediate: true })
watch(currentWorkspaceRoot, () => { void loadGithubBinding() })
watch([showSettings, settingTab], ([visible, tab]) => { if (visible && tab === 'sync') void checkGithubToken() })
onMounted(() => { if (isTauri) { void checkGithubToken().then(scheduleGithubSync); void loadGithubBinding() } })
onBeforeUnmount(() => { if (githubTimer) clearTimeout(githubTimer); if (githubInterval) clearInterval(githubInterval); if (githubRetryTimer) clearTimeout(githubRetryTimer) })
let webdavTimer: ReturnType<typeof setTimeout> | undefined
let webdavInterval: ReturnType<typeof setInterval> | undefined
let webdavRetryTimer: ReturnType<typeof setTimeout> | undefined
let webdavRetryAttempt = 0
let webdavNeedsRefresh = false
async function checkWebdavPassword() {
  if (!isTauri || !webdavUrl.value || !webdavUsername.value) { webdavHasPassword.value = false; return }
  try { webdavHasPassword.value = await invoke<boolean>('webdav_has_password', { url: webdavUrl.value, username: webdavUsername.value }) }
  catch { webdavHasPassword.value = false }
}
async function loadWebdavFolders() {
  if (!isTauri || !webdavHasPassword.value || !webdavUrl.value || !webdavUsername.value) return
  webdavFoldersBusy.value = true
  try { webdavFolders.value = await invoke<string[]>('webdav_list_folders', { url: webdavUrl.value, username: webdavUsername.value }) }
  catch (error) { notify(t('远端文件夹读取失败：{0}', { "0": String(error) })) }
  finally { webdavFoldersBusy.value = false }
}
async function logoutWebdav() {
  if (!isTauri || webdavBusy.value || webdavBindingBusy.value) return
  try {
    await invoke('webdav_logout', { url: webdavUrl.value, username: webdavUsername.value })
    webdavHasPassword.value = false
    webdavFolders.value = []
    webdavPasswordDraft.value = ''
    webdavStatus.value = '尚未同步'
  } catch (error) { notify(t('退出 WebDAV 失败：{0}', { "0": String(error) })) }
}
async function loadWebdavBinding() {
  webdavBoundUrl.value = ''
  webdavBindingLoaded.value = false
  const root = currentWorkspaceRoot.value
  if (!isTauri || !root) return
  try {
    const bound = await invoke<string | null>('webdav_get_binding')
    if (root === currentWorkspaceRoot.value) webdavBoundUrl.value = bound || ''
  } catch (error) { if (root === currentWorkspaceRoot.value) notify(t('远端文件夹读取失败：{0}', { "0": String(error) })) }
  finally { if (root === currentWorkspaceRoot.value) webdavBindingLoaded.value = true }
}
async function bindWebdavFolder(folder = webdavFolderDraft.value) {
  if (!isTauri || !webdavUrl.value || !webdavUsername.value || !webdavHasPassword.value || !folder || !currentWorkspaceRoot.value || webdavBindingBusy.value) return
  webdavBindingBusy.value = true
  try {
    webdavBoundUrl.value = await invoke<string>('webdav_bind_workspace', { url: webdavUrl.value, username: webdavUsername.value, folder })
    webdavFolderDraft.value = ''
    webdavStatus.value = webdavEnabled.value ? '已绑定，正在同步…' : '已绑定，可手动同步'
    scheduleWebdavSync()
  } catch (error) { notify(t('绑定失败：{0}', { "0": String(error) })) }
  finally { webdavBindingBusy.value = false }
}
async function unbindWebdavFolder() {
  if (!isTauri || !webdavBoundUrl.value || webdavBindingBusy.value) return
  if (webdavBusy.value) { webdavUnbindPendingRoot.value = currentWorkspaceRoot.value || ''; return }
  webdavBindingBusy.value = true
  try { await invoke('webdav_unbind_workspace'); webdavBoundUrl.value = ''; webdavStatus.value = '尚未同步' }
  catch (error) { notify(t('解除绑定失败：{0}', { "0": String(error) })) }
  finally { webdavBindingBusy.value = false }
}
async function storeWebdavPassword() {
  if (!webdavPasswordDraft.value) return
  try {
    await invoke('save_webdav_password', { url: webdavUrl.value, username: webdavUsername.value, password: webdavPasswordDraft.value })
    webdavPasswordDraft.value = ''; webdavHasPassword.value = true
    scheduleWebdavSync()
  } catch (error) { notify(t('凭据保存失败：{0}', { "0": String(error) })) }
}
async function runWebdavSync(manual = false) {
  if (deps.contextChanging?.value || !isTauri || (!manual && !webdavEnabled.value) || !webdavHasPassword.value || !currentWorkspaceRoot.value || !webdavBoundUrl.value || !webdavUrl.value || !webdavUsername.value || webdavBusy.value) return
  const root = currentWorkspaceRoot.value
  webdavBusy.value = true
  webdavStatus.value = '同步中…'
  try {
    const protectedPaths = docs.value.filter(doc => doc.relativePath && (dirtyIds.value.includes(doc.id) || getConflictedIds().includes(doc.id))).map(doc => doc.relativePath)
    const result = await invoke<{ uploaded: number; downloaded: number; deletedLocal: number; deletedRemote: number; conflicts: string[]; copies: string[]; changed: string[] }>('sync_webdav', { url: webdavUrl.value, username: webdavUsername.value, protected: protectedPaths, protectedAbsolute: docs.value.filter(doc => doc.absolutePath && (dirtyIds.value.includes(doc.id) || getConflictedIds().includes(doc.id))).map(doc => doc.absolutePath), conflictPolicy: deps.settings.syncConflictPolicy.value })
    if (root !== currentWorkspaceRoot.value || !webdavBoundUrl.value) return
    if (!result.conflicts.length) recordSyncTime('WebDAV', webdavBoundUrl.value)
    webdavRetryAttempt = 0
    if (webdavRetryTimer) clearTimeout(webdavRetryTimer)
    webdavRetryTimer = undefined
    webdavStatus.value = `已同步 · 上传 ${result.uploaded} · 下载 ${result.downloaded} · 删除 ${result.deletedLocal + result.deletedRemote}${result.conflicts.length ? ` · 冲突 ${result.conflicts.length}` : ''}`
    if (result.conflicts.length) notify(t('WebDAV 同步冲突：{0}', { "0": result.conflicts.slice(0, 3).join('、') }))
    if (result.copies?.length) notify(t('已另存 {0} 个版本副本', { "0": result.copies.length }))
    webdavNeedsRefresh ||= result.changed.length > 0
    if (webdavNeedsRefresh && !docs.value.some(doc => doc.relativePath && dirtyIds.value.includes(doc.id))) {
      await refreshAfterSync()
      if (root === currentWorkspaceRoot.value) webdavNeedsRefresh = false
    }
  } catch (error) {
    if (root === currentWorkspaceRoot.value && webdavBoundUrl.value) {
      webdavStatus.value = `同步失败：${String(error)}`
      if (webdavEnabled.value && webdavRetryOnFailure.value && !webdavUnbindPendingRoot.value && !webdavRetryTimer) {
        const delay = Math.min(10000 * 2 ** webdavRetryAttempt++, 300000)
        webdavRetryTimer = setTimeout(() => { webdavRetryTimer = undefined; void runWebdavSync() }, delay)
      }
    }
  }
  finally {
    webdavBusy.value = false
    if (webdavUnbindPendingRoot.value) {
      const pendingRoot = webdavUnbindPendingRoot.value
      webdavUnbindPendingRoot.value = ''
      if (pendingRoot === root && pendingRoot === currentWorkspaceRoot.value) void unbindWebdavFolder()
    }
  }
}
function scheduleWebdavSync() {
  if (webdavTimer) clearTimeout(webdavTimer)
  if (!deps.contextChanging?.value && webdavEnabled.value && webdavHasPassword.value && webdavBoundUrl.value) webdavTimer = setTimeout(() => { void runWebdavSync() }, 1500)
}
watch([webdavEnabled, webdavHasPassword, webdavBoundUrl, webdavUsername], scheduleWebdavSync)
watch([webdavEnabled, webdavHasPassword, webdavBoundUrl, webdavUsername, webdavUrl, webdavSyncIntervalSeconds, webdavRetryOnFailure], () => {
  if (webdavInterval) clearInterval(webdavInterval)
  webdavInterval = undefined
  if (webdavRetryTimer) clearTimeout(webdavRetryTimer)
  webdavRetryTimer = undefined
  webdavRetryAttempt = 0
  if (isTauri && webdavEnabled.value && webdavHasPassword.value && webdavBoundUrl.value && webdavUrl.value && webdavUsername.value) webdavInterval = setInterval(() => { void runWebdavSync() }, webdavSyncIntervalSeconds.value * 1000)
}, { immediate: true })
watch(currentWorkspaceRoot, () => { void loadWebdavBinding() })
watch([showSettings, settingTab, webdavUrl, webdavUsername], ([visible, tab]) => { if (visible && tab === 'sync') void checkWebdavPassword() })
onMounted(() => { if (isTauri) { void checkWebdavPassword(); void loadWebdavBinding() } })
onBeforeUnmount(() => { if (webdavTimer) clearTimeout(webdavTimer); if (webdavInterval) clearInterval(webdavInterval); if (webdavRetryTimer) clearTimeout(webdavRetryTimer) })

return {
  webdavEnabled, webdavSyncIntervalSeconds, webdavRetryOnFailure, webdavUrl, webdavUsername,
  webdavBoundUrl, webdavFolderDraft, webdavFolders, webdavFoldersBusy, webdavBindingBusy,
  webdavPasswordDraft, webdavHasPassword, webdavBusy, webdavUnbindPendingRoot, webdavStatus,
  githubEnabled, githubSyncIntervalSeconds, githubRetryOnFailure, githubUrl, githubUsername,
  githubBoundUrl, githubRepos, githubRepoDraft, githubRepoBusy, githubTokenDraft, githubHasToken,
  githubBusy, githubUnbindPendingRoot, githubStatus, directorySyncAvailable, directorySyncUnbound, directorySyncBusy, directorySyncBound, directorySyncHint, runDirectorySync,
  checkGithubToken, loadGithubRepos, logoutGithub, loadGithubBinding, bindGithubRepo,
  createGithubRepo, unbindGithubRepo, storeGithubToken, runGithubSync, scheduleGithubSync,
  checkWebdavPassword, loadWebdavFolders, logoutWebdav, loadWebdavBinding, bindWebdavFolder,
  unbindWebdavFolder, storeWebdavPassword, runWebdavSync, scheduleWebdavSync,
}
}
