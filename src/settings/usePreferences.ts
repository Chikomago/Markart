import { t, setLanguage, localeOptions, localeMessages } from '../i18n'
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch, type Ref } from 'vue'
import { convertFileSrc, invoke } from '@tauri-apps/api/core'
import { SettingsStore, type SettingKey } from './settings'
import { builtinThemes } from './themes'
import { DEFAULT_THEME } from './defaults'
import { shortcuts } from './shortcuts'
import { pluginRuntime } from '../plugins/runtime'

export type Theme = { name: string; css: string; custom?: boolean; label?: string; pluginId?: string; description?: string; preview?: string[]; folderId?: string }
type BuiltinSettingTab = 'plugins' | 'layout' | 'appearance' | 'startup' | 'quickCapture' | 'storage' | 'sync' | 'editor' | 'templates' | 'snippets' | 'shortcuts' | 'spellcheck' | 'export' | 'about'
export type SettingTab = BuiltinSettingTab | `${string}:${string}`

export function usePreferences(deps: {
  store: SettingsStore
  revision: Ref<number>
  applyLayoutSettings: () => void
  isTauri: boolean
  notify: (message: string) => void
}) {
  const { store, revision, applyLayoutSettings, isTauri, notify } = deps
  function useSetting<K extends SettingKey>(key: K) {
    return computed({
      get: () => { revision.value; return store.get(key) },
      set: value => { if (store.set(key, value)) revision.value++; else notify(t('设置未保存，请检查填写内容和存储权限')) },
    })
  }
  function useLayoutInput<K extends 'sidebarOpen' | 'outlineOpen' | 'sidebarWidth' | 'previewWidth'>(key: K) {
    return computed({
      get: () => { revision.value; const value = store.get(key); return key === 'previewWidth' && typeof value === 'number' ? Math.round(value) : value },
      set: value => { const normalized = key === 'previewWidth' && typeof value === 'number' ? Math.round(value) : value; if (store.set(key, normalized)) { revision.value++; applyLayoutSettings() } else notify(t('布局设置未保存')) },
    })
  }

  const language = useSetting('language')
  watch(language, value => setLanguage(value), { immediate: true })
  const onSystemLanguageChange = () => { if (language.value === 'system') setLanguage('system') }
  onMounted(() => window.addEventListener('languagechange', onSystemLanguageChange))
  onBeforeUnmount(() => window.removeEventListener('languagechange', onSystemLanguageChange))
  watch(() => localeMessages(), messages => { if (isTauri) void invoke('set_ui_language', { messages }).catch(error => console.error('Native menu language:', error)) }, { immediate: true })

  const showSettings = ref(false)
  const showThemes = ref(false)
  const settingsSearchInput = ref<HTMLInputElement | null>(null)
  watch(showSettings, open => { if (open) void nextTick(() => settingsSearchInput.value?.focus()) })
  const settingTab = ref<SettingTab>('appearance')
  const settingSearch = ref('')
  const settingCategoryNames: Record<BuiltinSettingTab, string> = { plugins: '插件', layout: '布局', appearance: '外观', startup: '系统', quickCapture: '快速记录', storage: '存储', sync: '同步', editor: '编辑器', templates: '模板', snippets: '片段', shortcuts: '快捷键', spellcheck: '拼写检查', export: '导出', about: '关于' }
  const pluginSettingCategories = computed(() => pluginRuntime.state.settingsCategories.slice().sort((a, b) => (a.order || 0) - (b.order || 0)))
  function settingCategoryTitle(tab: SettingTab) {
    return tab.includes(':') ? pluginSettingCategories.value.find(item => item.id === tab)?.title || '' : t(settingCategoryNames[tab as BuiltinSettingTab])
  }
  watch(pluginSettingCategories, categories => {
    if (settingTab.value.includes(':') && !categories.some(item => item.id === settingTab.value)) settingTab.value = 'plugins'
  })
  const settingSearchCatalog = computed<{ tab: SettingTab; label: string; keywords: string; custom?: boolean; id?: string }[]>(() => [
    { tab: 'layout' as const, label: '布局', keywords: '侧栏 大纲 面板 位置 拖动 排序 sidebar panel layout' },
    { tab: 'startup' as const, get label() { return t('语言') }, keywords: '语言 language locale 简体 繁體 English 日本語 한국어 Deutsch Français Español Português Русский' },
    { tab: 'plugins' as const, get label() { return t('社区插件') }, keywords: '插件 第三方 扩展 MCP CLI Agent' },
    { tab: 'appearance' as const, get label() { return t('文件操作栏常驻') }, keywords: '文件 操作栏 工具栏 常驻 悬停 隐藏' },
    { tab: 'appearance' as const, get label() { return t('主题') }, keywords: '主题 外观 CSS 晴空 陶纸 深海' }, { tab: 'appearance' as const, get label() { return t('界面字体与缩放') }, keywords: 'UI 字体 预览 缩放 比例' },
    { tab: 'quickCapture' as const, label: '快速记录', keywords: '快捷键 触发区 常驻' },
    { tab: 'startup' as const, get label() { return t('启动时') }, keywords: '启动 上次目录 文件 空白窗口' },
    { tab: 'startup' as const, get label() { return t('默认编辑器') }, keywords: '默认应用 Markdown 文件关联 打开方式' },
    { tab: 'startup' as const, get label() { return t('自动检测更新') }, keywords: '系统 更新 检测 自动' },
    { tab: 'startup' as const, get label() { return t('显示菜单栏图标') }, keywords: '菜单栏 托盘 图标' },
    { tab: 'editor' as const, get label() { return t('折叠大纲时折叠内容') }, keywords: '大纲 标题 折叠 正文 内容' },
    { tab: 'about' as const, get label() { return t('关于 Markart') }, keywords: '项目地址 作者 协议 版本 GitHub GPL about license' },
    { tab: 'startup' as const, get label() { return t('恢复默认设置') }, keywords: '系统 全部 恢复 默认 重置' },
    { tab: 'storage' as const, get label() { return t('图片与附件存储') }, keywords: '图片附件目录 剪贴板图片目录 文件命名 变量' },
    { tab: 'editor' as const, get label() { return t('编辑器字体与排版') }, keywords: '字体 正文字号 表格宽度 铺满 内容自适应 行高 段落间距 首行缩进 正文布局 铺满 居中' }, { tab: 'editor' as const, get label() { return t('编辑行为') }, keywords: '图表可视化编辑 流程图 脑图 Mermaid 代码、图表与公式行号 正文行号 自动换行 所见即所得 外部文件修改 自动加载 弹窗确认' },
    { tab: 'appearance' as const, get label() { return t('界面布局') }, keywords: '标签页 侧栏' },
    { tab: 'templates' as const, get label() { return t('文件模板') }, keywords: '模板 变量 新建文件' }, { tab: 'snippets' as const, get label() { return t('文本片段') }, keywords: '片段 插入' },
    { tab: 'shortcuts' as const, get label() { return t('快捷键设置') }, keywords: `快捷键 录入 冲突 清除 重置 ${shortcuts.map(item => item.label).join(' ')}` },
    { tab: 'spellcheck' as const, get label() { return t('拼写检查与词典') }, keywords: '拼写检查 词典 dic aff raw 下载 离线' },
    { tab: 'export' as const, get label() { return t('导出设置') }, keywords: '导出 字体 PDF 纸张 尺寸 页边距' },
    { tab: 'storage' as const, get label() { return t('历史版本') }, keywords: 'Git 保存 版本数量 自动清理周期 差异 恢复' },
    { tab: 'sync' as const, get label() { return t('冲突处理') }, keywords: '远端优先 自动合并 副本 保留两份' },
    { tab: 'sync' as const, get label() { return t('GitHub 同步') }, keywords: 'GitHub 自动 同步 私有仓库 访问令牌 登录 定时 周期 失败 重试' },
    { tab: 'sync' as const, get label() { return t('WebDAV 同步') }, keywords: 'WebDAV 自动 双向 同步 远端 地址 账号 密码 冲突 删除 定时 周期 失败 重试' },
    ...pluginSettingCategories.value.map(item => ({ id: item.id, tab: item.id as SettingTab, label: item.title, keywords: '', custom: true })),
    ...pluginRuntime.state.settings.map(item => ({ id: item.id, tab: item.category as SettingTab, label: item.title, keywords: item.description || '', custom: true })),
  ])
  const settingSearchResults = computed(() => {
    const term = settingSearch.value.trim().toLowerCase()
    return term ? settingSearchCatalog.value.filter(item => `${settingCategoryTitle(item.tab)} ${item.label} ${item.keywords}`.toLowerCase().includes(term)) : []
  })
  function openSettingSearchResult(tab: SettingTab) { settingTab.value = tab; settingSearch.value = '' }
  function settingVisible(label: string) { return !settingSearch.value.trim() || label.toLowerCase().includes(settingSearch.value.trim().toLowerCase()) }

  const themeName = useSetting('themeName')
  const themeNameInput = themeName
  const customThemes = computed({
    get: () => { revision.value; return store.get('customThemes') },
    set: value => { if (store.set('customThemes', value)) revision.value++; else notify(t('主题设置未保存')) },
  })
  const customThemesInput = customThemes
  type FolderTheme = { id: string; name: string; styles: string[]; description?: string; preview?: string[] }
  const folderThemes = ref<FolderTheme[]>([])
  onMounted(async () => { if (isTauri) { try { folderThemes.value = await invoke<FolderTheme[]>('list_installed_themes') } catch (error) { notify(t('主题读取失败：{0}', { "0": String(error) })) } } })
  const allThemes = computed<Theme[]>(() => [...builtinThemes, ...folderThemes.value.map(theme => ({ name: `folder:${theme.id}`, label: theme.name, description: theme.description, preview: theme.preview, custom: true, folderId: theme.id, css: theme.styles.map(path => `@import url(${JSON.stringify(convertFileSrc(path))});`).join('\n') })), ...customThemes.value, ...pluginRuntime.state.themes.map(theme => ({ name: theme.id, label: theme.name, css: theme.css, pluginId: theme.pluginId }))])
  const selectableThemes = allThemes
  function restoreDefaultTheme() { store.set('themeName', DEFAULT_THEME); revision.value++; showThemes.value = false }
  function selectTheme(name: string) { if (store.set('themeName', name)) revision.value++ }
  async function addTheme() {
    showThemes.value = false
    if (!isTauri) return notify(t('请在桌面版中添加主题'))
    try {
      const path = await invoke<string | null>('pick_open_target', { folder: true })
      if (!path) return
      const theme = await invoke<FolderTheme>('install_theme_folder', { path })
      folderThemes.value = [...folderThemes.value, theme]
      themeName.value = `folder:${theme.id}`
    } catch (error) { notify(t('主题添加失败：{0}', { "0": String(error) })) }
  }
  async function removeTheme(name: string) {
    const theme = allThemes.value.find(theme => theme.name === name)
    if (!window.confirm(t('删除主题“{0}”？应用中的主题副本将被删除，原文件夹不受影响。', { "0": theme?.label || name }))) return
    try {
      if (theme?.folderId) {
        await invoke('remove_installed_theme', { id: theme.folderId })
        folderThemes.value = folderThemes.value.filter(item => item.id !== theme.folderId)
      } else customThemesInput.value = customThemesInput.value.filter(theme => theme.name !== name)
      if (themeName.value === name) restoreDefaultTheme()
    } catch (error) { notify(t('主题删除失败：{0}', { "0": String(error) })) }
  }
  function resetAllSettings() { if (!window.confirm(t('恢复全部默认设置？主题、快捷键等偏好将被重置。'))) return; store.resetAll(); revision.value++; applyLayoutSettings() }

  const fontSize = useSetting('fontSize')
  const uiFontFamily = useSetting('uiFontFamily')
  const uiFontPreview = ref<string | null>(null)
  const editorFontPreview = ref<string | null>(null)
  const effectiveUiFontFamily = computed(() => uiFontPreview.value || uiFontFamily.value)
  const editorFontFamily = useSetting('editorFontFamily')
  const effectiveEditorFontFamily = computed(() => editorFontPreview.value || editorFontFamily.value)
  const editorAlignment = useSetting('editorAlignment')
  const tableWidth = useSetting('tableWidth')
  const paragraphSpacing = useSetting('paragraphSpacing')
  const lineHeight = useSetting('lineHeight')
  const indent = useSetting('indent')
  const editorLayoutPreview = ref<Partial<Record<'fontSize' | 'lineHeight' | 'paragraphSpacing' | 'indent', number>>>({})
  function previewEditorLayout(key: 'fontSize' | 'lineHeight' | 'paragraphSpacing' | 'indent', value: string | number | null) {
    if (value === null) { const next = { ...editorLayoutPreview.value }; delete next[key]; editorLayoutPreview.value = next }
    else if (typeof value === 'number') editorLayoutPreview.value = { ...editorLayoutPreview.value, [key]: value }
  }
  const effectiveFontSize = computed(() => editorLayoutPreview.value.fontSize ?? fontSize.value)
  const effectiveLineHeight = computed(() => editorLayoutPreview.value.lineHeight ?? lineHeight.value)
  const effectiveParagraphSpacing = computed(() => editorLayoutPreview.value.paragraphSpacing ?? paragraphSpacing.value)
  const effectiveIndent = computed(() => editorLayoutPreview.value.indent ?? indent.value)
  const attachmentDirectory = useSetting('attachmentDirectory')
  const gitEnabled = useSetting('gitEnabled')
  const gitMaxVersions = useSetting('gitMaxVersions')
  const gitRetentionDays = useSetting('gitRetentionDays')
  const zoom = useSetting('zoom')
  const focusMode = useSetting('focusMode')
  const typewriter = useSetting('typewriter')
  const wrapLines = useSetting('wrapLines')
  const externalFileChanges = useSetting('externalFileChanges')
  const diagramVisualEditing = useSetting('diagramVisualEditing')
  const bodyLineNumbers = useSetting('bodyLineNumbers')
  const codeBlockLineNumbers = useSetting('codeBlockLineNumbers')
  const foldContentWithOutline = useSetting('foldContentWithOutline')
  const exportFontFamily = useSetting('exportFontFamily')
  const exportPageSize = useSetting('exportPageSize')
  const exportPageWidth = useSetting('exportPageWidth')
  const exportPageHeight = useSetting('exportPageHeight')
  const exportMarginPreset = useSetting('exportMarginPreset')
  const exportMargin = useSetting('exportMargin')
  watch(exportPageSize, value => {
    if (value === 'A4') { exportPageWidth.value = 210; exportPageHeight.value = 297 }
    else if (value === 'Letter') { exportPageWidth.value = 216; exportPageHeight.value = 279 }
    else { exportPageWidth.value = 0; exportPageHeight.value = 0 }
  })
  watch(exportMarginPreset, value => {
    if (value === 'normal') exportMargin.value = 18
    else if (value === 'narrow') exportMargin.value = 10
    else if (value === 'wide') exportMargin.value = 25
    else exportMargin.value = 0
  })
  const systemFonts = ref<string[]>([])
  const fontsLoading = ref(false)
  async function loadSystemFonts() {
    if (!isTauri || fontsLoading.value || systemFonts.value.length) return
    fontsLoading.value = true
    try { systemFonts.value = [...new Set((await invoke<string[]>('list_system_fonts')).filter(name => name && !name.startsWith('.')))] }
    catch (error) { notify(t('本机字体读取失败：{0}', { "0": String(error) })) }
    finally { fontsLoading.value = false }
  }

  const templates = useSetting('templates')
  const snippets = useSetting('snippets')
  const shortcutOverrides = useSetting('shortcutOverrides')
  const spellcheckEnabled = useSetting('spellcheckEnabled')
  const clipboardDirectory = useSetting('clipboardDirectory')
  const attachmentNaming = useSetting('attachmentNaming')
  const startupBehavior = useSetting('startupBehavior')
  const defaultEditorBusy = ref(false)
  async function setDefaultEditor() {
    if (defaultEditorBusy.value) return
    if (!isTauri) { notify(t('请在桌面版中设置默认编辑器')); return }
    defaultEditorBusy.value = true
    try {
      const applied = await invoke<boolean>('set_default_editor')
      notify(applied ? t('已设为 Markdown 默认编辑器') : t('请在系统设置中选择 Markart'))
    } catch (error) { notify(String(error)) }
    finally { defaultEditorBusy.value = false }
  }
  const quickCaptureEnabled = useSetting('quickCaptureEnabled')
  const menuBarIconVisible = useSetting('menuBarIconVisible')
  const quickCaptureCorner = useSetting('quickCaptureCorner')
  const autoCheckUpdates = useSetting('autoCheckUpdates')
  const sidebarOpenInput = useLayoutInput('sidebarOpen')
  const tabViewEnabled = computed(() => true)
  const toolbarEnabled = useSetting('toolbarEnabled')
  const outlineOpenInput = useLayoutInput('outlineOpen')
  const sidebarLayout = useSetting('sidebarLayout')
  const sidebarTop = useSetting('sidebarTop')
  const editorTop = useSetting('editorTop')
  const zoomOptions = Array.from({ length: 16 }, (_, index) => 75 + index * 5)
  return {
    useSetting, quickCaptureEnabled, quickCaptureCorner, menuBarIconVisible, showSettings, showThemes, settingsSearchInput, settingTab, settingSearch,
    settingCategoryNames, settingCategoryTitle, pluginSettingCategories, settingSearchResults, openSettingSearchResult, settingVisible,
    themeName, themeNameInput, customThemes, customThemesInput, allThemes, selectableThemes,
    restoreDefaultTheme, selectTheme, addTheme, removeTheme,
    editorLayoutPreview, previewEditorLayout, effectiveFontSize, effectiveLineHeight, effectiveParagraphSpacing, effectiveIndent,
    uiFontFamily, uiFontPreview, editorFontPreview, effectiveUiFontFamily, effectiveEditorFontFamily, fontsLoading,
    resetAllSettings, loadSystemFonts, systemFonts, templates, snippets, shortcutOverrides,
    spellcheckEnabled, fontSize, editorFontFamily, editorAlignment, lineHeight, paragraphSpacing, tableWidth, indent, attachmentDirectory,
    gitEnabled, gitMaxVersions, gitRetentionDays, zoom, focusMode, typewriter,
    wrapLines, externalFileChanges, diagramVisualEditing, bodyLineNumbers, codeBlockLineNumbers, foldContentWithOutline, exportFontFamily, exportPageSize, exportPageWidth, exportPageHeight, exportMarginPreset,
    exportMargin, fontSizeInput: fontSize, editorFontFamilyInput: editorFontFamily,
    lineHeightInput: lineHeight, indentInput: indent, attachmentDirectoryInput: attachmentDirectory,
    language, localeOptions, clipboardDirectory, attachmentNaming, startupBehavior, autoCheckUpdates, zoomInput: zoom,
    wrapLinesInput: wrapLines, sidebarOpenInput,
    tabViewEnabled, toolbarEnabled, outlineOpenInput, sidebarLayout, sidebarTop, editorTop,
    defaultEditorBusy, setDefaultEditor, zoomOptions,
  }
}
