<script setup lang="ts">
import { t } from '../i18n'
import { permissionLabels, describeDenial, addedPermissions } from './permissions/declaration'
import { confirmUninstall, clearPluginData } from './ui/uninstall'
import { confirmUpdate } from './ui/update'
import { sidebarLayout } from './ui/sidebarLayout'
import { pluginGrants } from './permissions/grants'
import { pluginServices } from './host/services'
import { rendererChoices, selectRenderer } from './host/markdown'
import { importLocalPlugin } from './local'
import { computed, onMounted, ref } from 'vue'
import { pluginRuntime } from './runtime'
import PluginViews from './PluginViews.vue'
import { downloadPlugin, checkPluginUpdate, removePlugin, savedPlugins, savePlugin, pluginKey, publicGithubUrl, type CommunityPlugin, type DownloadedPlugin, type PluginSource } from './community'
import { pluginDirectoryKey, defaultPluginDirectory, fetchPluginCatalog } from './catalogs'
const runtime = pluginRuntime.state
const packages = ref<DownloadedPlugin[]>([])
const error = ref(''), status = ref(''), busy = ref(false), tab = ref('catalogs')
const directoryUrl = ref(localStorage.getItem(pluginDirectoryKey) || defaultPluginDirectory)
const directory = ref<CommunityPlugin[]>([]), updates = ref<Record<string, string>>({}), updateStatus = ref<Record<string, string>>({}), loadedUrl = ref('')
const denials = computed(() => Object.fromEntries(Object.entries(pluginGrants.denials).map(([id, list]) => [id, list.map(item => { const { label, origin } = describeDenial(item.key); return origin ? `${t(label)}（${origin}）` : t(label) }).join('、')])))
function sourceLabel(pkg: DownloadedPlugin) { return pkg.directoryUrl || t('本地导入') }
function isEnabled(pkg: DownloadedPlugin) { return runtime.sources[pkg.manifest.id] === pkg.key }
function hasPermissions(pkg: DownloadedPlugin) { const value = pkg.manifest.permissions; return Boolean(value.required.length || value.optional.length) }
function catalogKey(id: string) { try { return `${publicGithubUrl(loadedUrl.value)}::${id}` } catch { return '' } }
async function run(action: () => Promise<void>) {
  if (busy.value) return
  busy.value = true; error.value = ''; status.value = ''
  try { await action() } catch (reason) { if((reason as any)?.code!=='cancelled')error.value = String(reason) } finally { busy.value = false }
}
async function loadCatalog() {
  const url = directoryUrl.value.trim()
  const plugins = await fetchPluginCatalog(url)
  directory.value = plugins; loadedUrl.value = url
  localStorage.setItem(pluginDirectoryKey, url)
  status.value = `已加载 ${plugins.length} 个插件`
}
async function refresh() { await run(loadCatalog) }
async function install(result: DownloadedPlugin) {
  const previous = packages.value.find(item => item.key === result.key)
  const wasEnabled = isEnabled(result)
  if (wasEnabled) await pluginRuntime.disable(result.manifest.id)
  try { await savePlugin(result); if (wasEnabled) await pluginRuntime.enable(result) }
  catch (error) { if (previous) { await savePlugin(previous); try { if (wasEnabled) await pluginRuntime.enable(previous) } catch { /* Runtime error remains visible. */ } } throw error }
  finally { packages.value = await savedPlugins() }
  delete updates.value[result.key]; delete updateStatus.value[result.key]
}
async function getPlugin(repo: string, id?: string, source: PluginSource = {}) {
  await run(async () => {
    const result = await downloadPlugin(repo, id, source)
    await install(result)
    const conflict = packages.value.some(item => item.manifest.id === result.manifest.id && item.key !== result.key)
    status.value = conflict ? `已安装 ${result.manifest.name} ${result.manifest.version}；同一 ID 的插件另有来源，同一时间只能启用其中一个` : `已安装 ${result.manifest.name} ${result.manifest.version}`
  })
}
async function importPlugin() {
  await run(async () => {
    const pkg = await importLocalPlugin()
    if (!pkg) return
    if (packages.value.some(item => item.key === pluginKey(pkg))) throw new Error(t('此插件已存在，请卸载后重新导入'))
    await savePlugin(pkg)
    packages.value = await savedPlugins()
    tab.value = 'downloaded'
  })
}
const packageAt = (key: string) => packages.value.find(item => item.key === key)
async function checkUpdate(key: string) {
  await run(async () => {
    const item = packageAt(key); if (!item) return
    try {
      const latest = await checkPluginUpdate(item)
      if (latest) updates.value[key] = latest.version
      else delete updates.value[key]
      updateStatus.value[key] = latest ? `可更新至 ${latest.version}` : '已是最新版本'
    } catch (reason) {
      delete updates.value[key]
      updateStatus.value[key] = `检查失败：${String(reason)}`
    }
  })
}
async function updatePlugin(key: string) {
  const item = packageAt(key)
  if (!item) return
  await run(async () => {
    const next = await downloadPlugin(item.repo, item.manifest.id, { directoryUrl: item.directoryUrl, author: item.author })
    const added = addedPermissions(item.manifest.permissions, next.manifest.permissions)
    if (added.permissions.length) {
      const accepted = await confirmUpdate({ name: next.manifest.name, version: next.manifest.version, permissions: added.permissions.map(permission => t(permissionLabels[permission])) })
      if (!accepted) return
    }
    await install(next)
    status.value = `已更新 ${next.manifest.name} ${next.manifest.version}`
  })
}
async function remove(key: string) {
  await run(async () => {
    const pkg = packageAt(key); if (!pkg) return
    const id = pkg.manifest.id
    const answer = await confirmUninstall(id, pkg.manifest.name || id); if (!answer) return
    const enabled = isEnabled(pkg), shared = packages.value.some(item => item.key !== key && item.manifest.id === id)
    if (enabled) await pluginRuntime.disable(id)
    await removePlugin(key); if (!runtime.sources[id]) pluginGrants.revoke(id)
    // Data and views are namespaced by manifest id, so keep them while another source still uses that id.
    if (answer.clearData && !shared) { clearPluginData(id); for (const item of Object.values(sidebarLayout.state.items)) if (item.viewId.startsWith(id + ':')) sidebarLayout.close(item.id) }
    delete updates.value[key]; delete updateStatus.value[key]
    packages.value = await savedPlugins()
    if (answer.clearData && shared) status.value = '已卸载此来源；另一来源仍使用相同 ID，已保留其插件数据'
  })
}
async function togglePlugin(key: string) {
  await run(async () => {
    const pkg = packageAt(key); if (!pkg) return
    if (isEnabled(pkg)) await pluginRuntime.disable(pkg.manifest.id); else await pluginRuntime.enable(pkg)
  })
}
onMounted(() => { void run(async () => { packages.value = await savedPlugins(); if (directoryUrl.value.trim()) await loadCatalog() }) })
</script>
<template>
  <section class="plugin-settings" :aria-busy="busy">
    <div class="plugin-header">
      <div class="plugin-tabs" role="tablist" :aria-label="$t('插件类别')"><button role="tab" :aria-selected="tab === 'catalogs'" @click="tab = 'catalogs'">{{ $t('社区插件') }}</button><button role="tab" :aria-selected="tab === 'downloaded'" @click="tab = 'downloaded'">{{ $t('本地') }} · {{ packages.length }}</button></div>
      <button v-if="tab === 'downloaded'" :disabled="busy" @click="importPlugin">{{ $t('导入插件') }}</button>
    </div>
    <p v-if="error" role="alert">{{ error }}</p><p v-if="status" role="status">{{ status }}</p>
    <template v-if="tab === 'catalogs'">
      <form class="plugin-directory-form" @submit.prevent="refresh">
        <label for="plugin-directory-url">{{ $t('插件目录') }}</label>
        <div><input id="plugin-directory-url" v-model="directoryUrl" type="url" placeholder="https://example.com/plugins.json" :disabled="busy" required><button :disabled="busy || !directoryUrl.trim()">{{ busy ? $t('加载中…') : $t('加载列表') }}</button></div>
      </form>
      <div class="plugin-list" role="region" :aria-label="$t('社区插件列表')" tabindex="0">
        <p v-if="!directory.length" class="plugin-empty">{{ loadedUrl ? $t('此插件目录为空，可更换目录地址') : $t('填写插件目录地址，加载可安装的插件') }}</p>
        <article v-for="plugin in directory" :key="plugin.id" class="plugin-card"><div class="plugin-card-content"><strong>{{ plugin.name }}</strong><small>{{ $t('作者：') }}{{ plugin.author || plugin.repo.split('/')[0] }}</small><p>{{ plugin.description }}</p></div><button :disabled="busy || packages.some(item => item.key === catalogKey(plugin.id))" @click="getPlugin(plugin.repo, plugin.id, { directoryUrl: loadedUrl, author: plugin.author })">{{ packages.some(item => item.key === catalogKey(plugin.id)) ? $t('已安装') : $t('安装') }}</button></article>
      </div>
    </template>
    <template v-else>
      <div class="plugin-list" role="region" :aria-label="$t('本地插件列表')" tabindex="0">
        <p v-if="!packages.length" class="plugin-empty">{{ $t('可从社区安装或导入本地插件') }}</p>
        <article v-for="pkg in packages" :key="pkg.key" class="plugin-card plugin-local-card">
          <div class="plugin-card-content">
            <div class="plugin-title"><strong :title="pkg.manifest.id">{{ pkg.manifest.name }}</strong><small>{{ pkg.manifest.version }}</small><small>{{ isEnabled(pkg) ? $t('已启用') : $t('已停用') }}</small></div>
            <p v-if="pkg.manifest.description" class="plugin-description">{{ pkg.manifest.description }}</p>
            <details v-if="hasPermissions(pkg)" class="plugin-permission-details"><summary>{{ $t('权限说明') }}</summary><ul><li v-for="permission in [...new Set([...pkg.manifest.permissions.required,...pkg.manifest.permissions.optional])]" :key="permission">{{ $t(permissionLabels[permission]) }}</li></ul></details>
            <p v-if="denials[pkg.manifest.id]" class="plugin-feedback" role="status">{{ $t('该插件尝试使用未声明的权限：{0}。未声明的能力不会被授予，请联系作者更新插件', { 0: denials[pkg.manifest.id] }) }}</p>
            <small class="plugin-author">{{ $t('来源：{0}', { 0: sourceLabel(pkg) }) }}<template v-if="pkg.author"> · {{ pkg.author }}</template></small>
            <p v-if="runtime.errors[pkg.manifest.id]" class="plugin-feedback" role="alert">{{ runtime.errors[pkg.manifest.id] }}</p>
            <p v-if="updateStatus[pkg.key]" class="plugin-feedback" role="status">{{ updateStatus[pkg.key] }}</p>
          </div>
          <div class="plugin-actions">
            <button v-if="pkg.repo" :disabled="busy || runtime.busy.includes(pkg.manifest.id)" @click="checkUpdate(pkg.key)">{{ $t('检查更新') }}</button>
            <button v-if="updates[pkg.key]" :disabled="busy" @click="updatePlugin(pkg.key)">{{ $t('更新至') }} {{ updates[pkg.key] }}</button>
            <button :disabled="busy || runtime.busy.includes(pkg.manifest.id)" @click="togglePlugin(pkg.key)">{{ isEnabled(pkg) ? $t('停用') : $t('启用') }}</button>
            <button :disabled="busy" :title="$t('卸载并删除此插件的本地文件')" @click="remove(pkg.key)">{{ $t('卸载') }}</button>
          </div>
        </article>
      </div>
    </template>
    <section v-if="pluginServices.blocks.some(item=>['mermaid','mindmap','math'].includes(item.language||''))" class="plugin-renderer-choices"><h3>{{$t('渲染器')}}</h3><label v-for="language in ['mermaid','mindmap','math'].filter(language=>pluginServices.blocks.some(item=>item.language===language))" :key="language">{{language}}<select :value="rendererChoices[language]||''" @change="selectRenderer(language,($event.target as HTMLSelectElement).value)"><option value="">{{$t('内置')}}</option><option v-for="renderer in pluginServices.blocks.filter(item=>item.language===language)" :key="renderer.id" :value="renderer.id">{{runtime.pluginNames[renderer.owner]||renderer.owner}}</option></select></label></section>
    <PluginViews location="settings"/>
  </section>
</template>
<style scoped>
.plugin-settings{display:flex;flex-direction:column;flex:1;min-height:0;color:var(--ink);line-height:1.7}.plugin-header{flex:none;display:flex;align-items:center;justify-content:space-between;gap:16px;margin-bottom:16px}.plugin-tabs,.plugin-actions{display:flex;align-items:center;gap:8px;flex-wrap:wrap}.plugin-tabs{gap:4px}.plugin-settings button{font:inherit;color:inherit;padding:5px 12px;border:1px solid var(--line);border-radius:6px;background:var(--paper);cursor:pointer}.plugin-tabs [aria-selected=true]{background:var(--accent-soft,var(--paper));font-weight:600}.plugin-settings button:disabled{opacity:.5;cursor:default}.plugin-note,small{color:var(--muted)}.plugin-settings article{padding:16px 0;border-bottom:1px solid var(--line)}small{margin-left:12px}.plugin-settings [role=alert]{color:#b13b3b}
.plugin-directory-form{flex:none;margin-bottom:16px}.plugin-directory-form label{display:block;margin-bottom:6px}.plugin-directory-form>div{display:flex;gap:8px}.plugin-directory-form input{flex:1;min-width:0;color:var(--ink);background:var(--paper);font:inherit;padding:7px 9px;border:1px solid var(--line);border-radius:6px}.plugin-list{flex:1;min-height:0;overflow-y:auto;overscroll-behavior:contain;scrollbar-gutter:stable;border:1px solid var(--line);border-radius:8px;padding:0 14px}.plugin-card{display:flex;align-items:center;gap:16px}.plugin-card-content{flex:1;min-width:0}.plugin-card-content small{display:block;margin:3px 0 0}.plugin-card-content p{margin:6px 0 0;overflow-wrap:anywhere}.plugin-card button{flex:none}.plugin-empty{color:var(--muted);padding:24px 8px;text-align:center;margin:0;min-height:100%;display:flex;align-items:center;justify-content:center}
.plugin-local-card{min-height:84px}.plugin-title{display:flex;align-items:baseline;gap:10px;flex-wrap:wrap}.plugin-title strong{font-weight:600;overflow-wrap:anywhere}.plugin-title small{display:inline;margin:0;white-space:nowrap;font-variant-numeric:tabular-nums}.plugin-card-content .plugin-description{margin:4px 0 0;color:var(--muted);font-size:12px;line-height:1.5}.plugin-card-content .plugin-author{margin:4px 0 0;font-size:11px;overflow-wrap:anywhere}.plugin-actions{flex:none;justify-content:flex-end;max-width:52%;margin:0}.plugin-settings .plugin-actions button{white-space:nowrap}.plugin-card-content .plugin-feedback{margin:6px 0 0;font-size:12px;line-height:1.5}
@media(max-width:640px){.plugin-local-card{align-items:flex-start;flex-direction:column;gap:10px}.plugin-actions{max-width:100%;justify-content:flex-start}}
.plugin-permission-details{margin-top:7px;color:var(--muted);font-size:11px}.plugin-permission-details summary{width:max-content;cursor:pointer}.plugin-permission-details ul{margin:6px 0 0;padding-left:18px}.plugin-permission-details code{font:inherit;overflow-wrap:anywhere}
</style>
