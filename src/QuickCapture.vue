<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { invoke, isTauri } from '@tauri-apps/api/core'
import { listen, type UnlistenFn } from '@tauri-apps/api/event'
import { getCurrentWindow } from '@tauri-apps/api/window'
import CodeEditor from './CodeEditor.vue'
import { SettingsStore } from './settings/settings'
import { builtinThemes } from './settings/themes'
import { DEFAULT_THEME } from './settings/defaults'
import { setLanguage, t } from './i18n'
import { ExternalLink } from 'lucide-vue-next'

const store = new SettingsStore(localStorage)
const desktopRuntime = isTauri() || location.protocol === 'tauri:'
setLanguage(store.get('language'))
const editor = ref<InstanceType<typeof CodeEditor> | null>(null)
const content = ref('')
const saving = ref(false), error = ref('')
const dirty = ref(!!content.value)
const filename = ref(defaultFilename())
const savedPath = ref<string | null>(null)
const characterCount = computed(() => Array.from(content.value).length)
const selectedThemeName = store.get('themeName')
const sharedTheme = (() => { try { return JSON.parse(localStorage.getItem('markart-quick-capture-theme') || 'null') as { name: string; css: string } | null } catch { return null } })()
const theme = sharedTheme?.name === selectedThemeName ? sharedTheme : store.get('customThemes').find(item => item.name === selectedThemeName) || builtinThemes.find(item => item.name === selectedThemeName) || builtinThemes.find(item => item.name === DEFAULT_THEME)!
const editorStyle = computed(() => ({ '--editor-font-size': '15px', '--editor-line-height': '1.55', '--editor-font-family': store.get('editorFontFamily'), '--editor-indent': `${store.get('indent')}em`, '--editor-paragraph-spacing': '8px' }))
let themeStyle: HTMLStyleElement | null = null
let unlistenMenu: UnlistenFn | undefined
let unlistenClose: UnlistenFn | undefined
let closing = false
let nativeStatusTimer: ReturnType<typeof setInterval> | undefined
function defaultFilename() {
  return '未命名.md'
}
function updateContent(value: string) {
  content.value = value; dirty.value = true
  if (desktopRuntime) void invoke('set_quick_capture_native_content', { content: value }).catch(() => {})
}
function setSavedPath(path: string) {
  savedPath.value = path
  const separator = Math.max(path.lastIndexOf('/'), path.lastIndexOf('\\'))
  filename.value = path.slice(separator + 1)
}
async function save(): Promise<boolean> {
  if (saving.value || !desktopRuntime || !content.value.trim()) return false
  saving.value = true; error.value = ''
  const snapshot = content.value
  try {
    const name = filename.value.trim().toLowerCase().endsWith('.md') ? filename.value.trim() : `${filename.value.trim()}.md`
    if (savedPath.value) {
      await invoke('update_quick_capture', { path: savedPath.value, content: snapshot })
    } else {
      const path = await invoke<string | null>('save_quick_capture_as', { filename: name, content: snapshot })
      if (!path) return false
      setSavedPath(path)
    }
    if (savedPath.value) await invoke('set_quick_capture_native_path', { path: savedPath.value })
    dirty.value = content.value !== snapshot
    if (dirty.value) await invoke('set_quick_capture_native_content', { content: content.value })
    return true
  } catch (cause) { error.value = String(cause); return false }
  finally { saving.value = false }
}
async function openInMarkart() {
  if (!savedPath.value || dirty.value || saving.value) return
  try { await invoke('open_saved_quick_capture', { path: savedPath.value }) }
  catch (cause) { error.value = t('已保存，但无法用 Markart 打开：{0}', { '0': String(cause) }) }
}
function onKeydown(event: KeyboardEvent) {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 's') { event.preventDefault(); event.stopPropagation(); void save() }
}
function onWindowUnload() {
  localStorage.removeItem('markart-quick-capture-draft')
}
onMounted(() => {
  themeStyle = document.createElement('style'); themeStyle.textContent = theme.css; document.head.append(themeStyle)
  window.addEventListener('keydown', onKeydown, true)
  window.addEventListener('beforeunload', onWindowUnload)
  if (desktopRuntime) {
    const syncAppearance = () => {
      const shell = document.querySelector('.quick-capture-shell')
      if (shell) {
        const style = getComputedStyle(shell)
        const probe = document.createElement('span')
        probe.style.color = 'var(--accent)'
        shell.append(probe)
        const channels = getComputedStyle(probe).color.match(/\d+(?:\.\d+)?/g)?.slice(0, 3).map(Number)
        probe.remove()
        const accent = channels?.length === 3 ? `#${channels.map(value => Math.round(value).toString(16).padStart(2, '0')).join('')}` : '#52694b'
        void invoke('set_quick_capture_appearance', { dark: style.colorScheme.includes('dark'), accent }).catch(() => {})
      }
    }
    if (/@import\b/i.test(theme.css)) {
      themeStyle?.addEventListener('load', syncAppearance, { once: true })
      setTimeout(syncAppearance, 2000)
    } else void nextTick(syncAppearance)
    if (content.value) void invoke('set_quick_capture_native_content', { content: content.value }).catch(() => {})
    nativeStatusTimer = setInterval(() => { void invoke<[string | null, boolean, boolean]>('quick_capture_native_status').then(async ([path, edited, exists]) => {
      if (path && !exists && !edited && !dirty.value) {
        content.value = ''; savedPath.value = null; filename.value = defaultFilename()
        await invoke('set_quick_capture_native_content', { content: '' })
        await invoke('set_quick_capture_native_path', { path: '' })
        return
      }
      if (path && path !== savedPath.value) setSavedPath(path)
      if (path) dirty.value = edited
    }).catch(() => {}) }, 500)
  }
  if (desktopRuntime) void listen<string>('markart-menu-action', event => { if (event.payload === 'file-save') void save() }).then(stop => { unlistenMenu = stop })
  if (desktopRuntime && /Win/i.test(navigator.platform)) void getCurrentWindow().onCloseRequested(async event => {
    event.preventDefault()
    if (closing) return
    closing = true
    try {
      if (!dirty.value) { await getCurrentWindow().destroy(); return }
      const choice = await invoke<'save' | 'discard' | null>('confirm_discard_changes', {
        title: `${t('保存对“')}${filename.value}${t('”的修改？')}`,
        message: t('丢弃后，未保存的修改将丢失。'),
        saveLabel: t('保存'), discardLabel: t('丢弃'), cancelLabel: t('取消'), dark: false,
      })
      if (choice === 'discard' || (choice === 'save' && await save() && !dirty.value)) await getCurrentWindow().destroy()
    } catch (cause) { error.value = String(cause) }
    finally { closing = false }
  }).then(stop => { unlistenClose = stop })
  void nextTick(() => editor.value?.focus())
})
onBeforeUnmount(() => { themeStyle?.remove(); unlistenMenu?.(); unlistenClose?.(); clearInterval(nativeStatusTimer); window.removeEventListener('keydown', onKeydown, true); window.removeEventListener('beforeunload', onWindowUnload) })
</script>

<template>
  <main class="app-shell quick-capture-shell cm-document-editor cm-rich-mode" :style="editorStyle">
    <header class="quick-capture-header" data-tauri-drag-region>
      <button class="quick-open-markart" type="button" :disabled="!savedPath || dirty || saving" :aria-label="t('在 Markart 中打开')" :title="t('在 Markart 中打开')" @click="openInMarkart"><ExternalLink :size="16"/></button>
    </header>
    <CodeEditor ref="editor" doc-id="quick-capture" file-kind="markdown" :model-value="content" :rich="true" :show-block-controls="false" :body-line-numbers="false" :code-block-line-numbers="false" :diagram-visual-editing="false" @update:model-value="updateContent"/>
    <footer class="quick-capture-statusbar"><span>{{ characterCount }} {{ t('字') }}</span></footer>
    <p v-if="error" role="alert" class="quick-save-error">{{ error }}</p>
  </main>
</template>
<style scoped>
.quick-capture-shell{position:relative;display:flex;flex-direction:column;width:100%;height:100dvh;min-width:0;min-height:0;overflow:hidden;background:var(--paper)}
.quick-capture-header{position:relative;z-index:1;display:flex;align-items:center;justify-content:center;flex:none;height:52px;color:var(--ink);font:12px system-ui;user-select:none}
.quick-open-markart:hover{background:var(--hover)}
.quick-open-markart{position:absolute;top:11px;right:14px;display:grid;place-items:center;width:30px;height:30px;border:0;border-radius:6px;background:transparent;color:var(--muted);cursor:pointer}
.quick-open-markart:disabled{opacity:.35;cursor:default}
.quick-open-markart:disabled:hover{background:transparent}
.quick-capture-shell :deep(.code-editor){flex:1;min-height:0;height:auto}
.quick-capture-shell :deep(.cm-content){max-width:680px;padding:20px 58px 72px}
.quick-capture-shell :deep(.cm-scroller){scrollbar-width:none}
.quick-capture-shell :deep(.cm-scroller)::-webkit-scrollbar{display:none}
.quick-capture-shell :deep(.cm-line.cm-native-paragraph){padding-top:0;padding-bottom:0}
.quick-capture-statusbar{display:flex;align-items:center;justify-content:space-between;gap:12px;flex:none;min-width:0;height:28px;padding:0 14px;background:var(--paper);color:var(--muted);opacity:.65;font:10px system-ui}
.quick-capture-statusbar>span:first-child{flex:none}
.quick-save-error{position:absolute;right:20px;bottom:42px;left:20px;margin:0;padding:10px 12px;border:1px solid var(--line-strong);border-radius:6px;background:var(--panel);color:var(--danger,#c15454);font-size:12px}
</style>
