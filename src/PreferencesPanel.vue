<script lang="ts">
import { t } from './i18n'

import SidebarManager from './plugins/ui/SidebarManager.vue'
import AboutPanel from './AboutPanel.vue'
import ThemeCards from './settings/ThemeCards.vue'
import PluginShortcutSettings from './plugins/PluginShortcutSettings.vue'
import PluginSettings from './plugins/PluginSettings.vue'
import PluginPreferenceItems from './plugins/PluginPreferenceItems.vue'
import FontPicker from './settings/FontPicker.vue'
import SettingSelect from './settings/SettingSelect.vue'
import CodeEditor from './CodeEditor.vue'
import { defineComponent, type PropType } from 'vue'
import { LayoutDashboard, Check, Sun, ArrowUp, FolderOpen, Cloud, PenLine, FilePlus2, ListFilter, Command, Keyboard, Puzzle, SpellCheck, Search, ChevronRight, Trash2, Plus, Minus, X, Info } from 'lucide-vue-next'

// The parent owns shared editor preferences and actions; this component owns their UI.
export default defineComponent({
  name: 'PreferencesPanel',
  components: { AboutPanel, SidebarManager, LayoutDashboard, PluginShortcutSettings, PluginPreferenceItems, ThemeCards, CodeEditor, SettingSelect, FontPicker, PluginSettings, Check, Sun, ArrowUp, FolderOpen, Cloud, PenLine, FilePlus2, ListFilter, Command, Keyboard, Puzzle, SpellCheck, Search, ChevronRight, Trash2, Plus, Minus, X, Info },
  props: { context: { type: Object as PropType<Record<string, any>>, required: true } },
  setup(props) { return Object.assign({}, props.context, {
    insertTemplateVariable(this: any, key: string) {
      const renaming = !!this.personalRenamingId
      const target = renaming ? this.$refs.personalRenameInput : this.$refs.personalContentInput
      const input = (Array.isArray(target) ? target[0] : target) as HTMLInputElement | HTMLTextAreaElement | undefined
      if (!input || !this.selectedPersonalId) return
      const text = this.variableSyntax(key), start = input.selectionStart ?? 0, end = input.selectionEnd ?? start
      const next = input.value.slice(0, start) + text + input.value.slice(end)
      if (renaming) this.personalRenameDraft = next
      else { this.personalContent = next; this.updatePersonalItemContent(next) }
      this.$nextTick(() => { input.focus(); input.setSelectionRange(start + text.length, start + text.length) })
    }, editorPreviewText: "<div class=\"settings-preview-heading-row\"><h1>标题</h1><h2>标题</h2><h3>标题</h3><h4>标题</h4><h5>标题</h5><h6>标题</h6></div>\n\n这是正文预览。中文、English、数字 123，展示当前字体与排版。\n同一段的下一行保留正常换行。\n\n这是另一个段落，可查看首行缩进、行高与段落间距。" ,
    fontSizeOptions: Array.from({ length: 12 }, (_, index) => ({ value: index + 13, label: `${index + 13} px` })),
    lineHeightOptions: Array.from({ length: 23 }, (_, index) => { const value = Number((1.3 + index * 0.05).toFixed(2)); return { value, get label() { return t('{0} 倍', { '0': value }) } } }),
    paragraphSpacingOptions: Array.from({ length: 49 }, (_, value) => ({ value, label: `${value} px` })),
    indentOptions: Array.from({ length: 7 }, (_, index) => ({ value: index / 2, label: `${index / 2} em` })),
  }) }
})
</script>

<template>
    <div v-if="showSettings" class="modal-backdrop" @click.self="showSettings = false"><div class="settings-modal" role="dialog" aria-modal="true" :aria-label="$t('偏好设置')">
      <div class="settings-body"><nav :aria-label="$t('设置类别')"><button :class="{ active: settingTab === 'appearance' }" @click="settingTab = 'appearance'; loadSystemFonts()"><Sun :size="16"/> {{ $t('外观') }}</button><button :class="{ active: settingTab === 'layout' }" @click="settingTab = 'layout'"><LayoutDashboard :size="16"/> {{ $t('布局') }}</button><button :class="{ active: settingTab === 'startup' }" @click="settingTab = 'startup'"><ArrowUp :size="16"/> {{ $t('系统') }}</button><button :class="{ active: settingTab === 'quickCapture' }" @click="settingTab = 'quickCapture'"><PenLine :size="16"/> {{ $t('快速记录') }}</button><button :class="{ active: settingTab === 'storage' }" @click="settingTab = 'storage'"><FolderOpen :size="16"/> {{ $t('存储') }}</button><button :class="{ active: settingTab === 'sync' }" @click="settingTab = 'sync'"><Cloud :size="16"/> {{ $t('同步') }}</button><button :class="{ active: settingTab === 'editor' }" @click="settingTab = 'editor'; loadSystemFonts()"><PenLine :size="16"/> {{ $t('编辑器') }}</button><button :class="{ active: settingTab === 'templates' }" @click="settingTab = 'templates'"><FilePlus2 :size="16"/> {{ $t('模板') }}</button><button :class="{ active: settingTab === 'snippets' }" @click="settingTab = 'snippets'"><ListFilter :size="16"/> {{ $t('片段') }}</button><button :class="{ active: settingTab === 'shortcuts' }" @click="settingTab = 'shortcuts'"><Keyboard :size="16"/> {{ $t('快捷键') }}</button><button :class="{ active: settingTab === 'spellcheck' }" @click="settingTab = 'spellcheck'; refreshSpellDictionaries()"><SpellCheck :size="16"/> {{ $t('拼写检查') }}</button><button :class="{ active: settingTab === 'export' }" @click="settingTab = 'export'; loadSystemFonts()"><ArrowUp :size="16"/> {{ $t('导出') }}</button><button v-for="category in pluginSettingCategories" :key="category.id" :class="{ active: settingTab === category.id }" @click="settingTab = category.id"><Command :size="16"/> {{ category.title }}</button><button :class="{ active: settingTab === 'plugins' }" @click="settingTab = 'plugins'"><Puzzle :size="16"/> {{ $t('插件') }}</button><button :class="{ active: settingTab === 'about' }" @click="settingTab = 'about'"><Info :size="16"/> {{ $t('关于 Markart') }}</button></nav>
        <div class="settings-content" :class="{'settings-layout-content':settingTab === 'layout' && !settingSearch.trim(),'settings-plugins-content':settingTab === 'plugins' && !settingSearch.trim()}"><div class="settings-section-head"><h3>{{ settingSearch.trim() ? $t('搜索结果') : settingTab === 'appearance' ? $t('外观与主题') : settingCategoryTitle(settingTab) }}</h3><div class="settings-search-row"><Search :size="15"/><input ref="settingsSearchInput" v-model="settingSearch" :placeholder="$t('搜索设置')" :aria-label="$t('搜索设置')"/></div></div>
          <template v-if="settingSearch.trim()"><div class="settings-global-results"><button v-for="item in settingSearchResults" :key="item.id || `${item.tab}-${item.label}`" @click="openSettingSearchResult(item.tab)"><span>{{ item.custom ? item.label : $t(item.label) }}</span><small>{{ settingCategoryTitle(item.tab) }}</small><ChevronRight :size="15"/></button><p v-if="!settingSearchResults.length">{{ $t('未找到匹配设置，请换个关键词') }}</p></div></template>
          <template v-else-if="settingTab === 'layout'"><SidebarManager :context="$props.context"/></template>
          <template v-else-if="settingTab === 'plugins'"><PluginSettings/></template>
          <template v-else-if="settingTab === 'about'"><AboutPanel :update-version="appUpdateVersion" :update-status="appUpdateStatus" :update-busy="appUpdateBusy" @check="checkAppUpdate(true)" @install="installAppUpdate"/></template>
          <template v-else-if="settingTab === 'appearance'">
            <div v-if="settingVisible('主题')" class="setting-item"><div><strong>{{ $t('主题') }}</strong></div></div>
            <ThemeCards v-if="settingVisible('主题')" v-model="themeNameInput" :themes="allThemes" @remove="removeTheme" @add="addTheme"/>
            <FontPicker v-model="uiFontFamily" :fonts="systemFonts" :loading="fontsLoading" :label="$t('UI 字体')" @open="loadSystemFonts" @preview="uiFontPreview = $event"/>
            <div v-if="settingVisible('界面缩放')" class="setting-row">{{ $t('界面缩放') }} <SettingSelect v-model="zoomInput" :label="$t('界面缩放')" :options="zoomOptions.map((value: number) => ({ value, label: `${value}%` }))"/></div>
            <div v-if="settingVisible('文件操作栏常驻')" class="setting-row">{{ $t('文件操作栏常驻') }} <input :aria-label="$t('文件操作栏常驻')" v-model="fileActionsAlwaysVisible" type="checkbox"/></div>
            <div class="setting-row">{{ $t('显示侧栏') }} <input :aria-label="$t('显示侧栏')" v-model="sidebarOpenInput" type="checkbox"/></div>
          </template>
          <template v-else-if="settingTab === 'startup'">
            <div class="setting-row">{{ $t('语言') }}<SettingSelect v-model="language" :label="$t('语言')" :options="localeOptions.map((option: any) => ({ ...option, label: $t(option.label) }))"/></div>
            <div class="setting-row">{{ $t('启动时') }} <SettingSelect v-model="startupBehavior" :label="$t('启动时')" :options="[{ value: 'restore', label: $t('打开上次目录和文件') }, { value: 'blank', label: $t('新建未命名文件') }]"/></div>
            <div class="setting-row">{{ $t('默认编辑器') }}<button :disabled="defaultEditorBusy" @click="setDefaultEditor">{{ defaultEditorBusy ? $t('正在设置…') : $t('设为默认编辑器') }}</button></div>
            <div class="setting-row">{{ $t('自动检测更新') }} <input :aria-label="$t('自动检测更新')" v-model="autoCheckUpdates" type="checkbox"/></div>
            <div class="setting-row">{{ $t('显示菜单栏图标') }} <input :aria-label="$t('显示菜单栏图标')" v-model="menuBarIconVisible" type="checkbox" :disabled="!isTauri"/></div>
            <div class="setting-row settings-reset-row">{{ $t('恢复默认设置') }}<button @click="resetAllSettings">{{ $t('全部恢复默认') }}</button></div>
          </template>
          <template v-else-if="settingTab === 'quickCapture'">
            <div class="setting-row"><span>{{ $t('启用快速记录') }}</span><input v-model="quickCaptureEnabled" type="checkbox" :disabled="!isTauri" :aria-label="$t('启用快速记录')"/></div>
            <p v-if="!isTauri" class="workflow-settings-intro">{{ $t('快速记录需要桌面版') }}</p>
            <template v-if="quickCaptureEnabled">
              <div class="setting-row"><span>{{ $t('鼠标触发区') }}</span><SettingSelect v-model="quickCaptureCorner" :label="$t('鼠标触发区')" :options="[{ value: 'top-left', label: $t('左上角') }, { value: 'top-right', label: $t('右上角') }, { value: 'bottom-left', label: $t('左下角') }, { value: 'bottom-right', label: $t('右下角') }]"/></div>
            </template>
          </template>
          <template v-else-if="settingTab === 'storage'">
            <div class="setting-row">{{ $t('图片附件目录') }} <input :aria-label="$t('图片附件目录')" v-model.trim="attachmentDirectoryInput" type="text" placeholder="assets"/></div>
            <div class="setting-row">{{ $t('剪贴板图片目录') }} <input :aria-label="$t('剪贴板图片目录')" v-model.trim="clipboardDirectory" type="text" placeholder="assets/clipboard"/></div>
            <div class="setting-row setting-row-borderless image-naming-row"><label for="attachment-naming">{{ $t('图片文件命名') }}</label><div class="image-naming-controls"><input id="attachment-naming" v-model.trim="attachmentNaming" type="text" placeholder="pasted-image-{date}-{time}" aria-describedby="attachment-naming-variables"/><small id="attachment-naming-variables">{{ $t('命名变量：{date}、{time}、{timestamp}、{uuid}') }}</small></div></div>
            <div class="storage-actions"><button @click="openStorageDirectory(attachmentDirectoryInput)">{{ $t('打开附件目录') }}</button><button @click="openStorageDirectory(clipboardDirectory)">{{ $t('打开剪贴板图片目录') }}</button></div>
            <section class="storage-subsection"><h4>{{ $t('历史版本') }}</h4>
            
            <div class="setting-row setting-row-borderless">{{ $t('启用历史版本') }} <input :aria-label="$t('启用历史版本')" v-model="gitEnabled" type="checkbox" :disabled="!gitAvailable && !gitEnabled"/></div>
            <p v-if="!gitAvailable">{{ gitStatus }}</p>
            <template v-if="gitEnabled">
            <div class="setting-row">{{ $t('每个文件保留版本数') }} <input :aria-label="$t('每个文件保留版本数')" v-model.number="gitMaxVersions" type="number" min="1" max="200"/></div>
            <div class="setting-row">{{ $t('版本保留天数') }}<small>{{ $t('设为 0 时不自动清理') }}</small> <input :aria-label="$t('版本保留天数')" v-model.number="gitRetentionDays" type="number" min="0" max="3650"/></div>
            <p v-if="lastGitFailure" class="git-error">{{ $t('上次备份失败：') }}{{ lastGitFailure }}</p>
            </template>
            </section>
          </template>
          <template v-else-if="settingTab === 'sync'">
            <div class="setting-row sync-auto-row">{{ $t('自动同步') }} <input :aria-label="$t('自动同步')" v-model="autoSyncEnabled" type="checkbox"/></div>
            <div class="setting-row sync-conflict-row">{{ $t('冲突处理') }} <small class="sync-conflict-description">{{ syncConflictPolicy === 'remote' ? $t('双方都修改时，使用远端版本，覆盖本地修改。') : $t('自动合并双方修改；无法合并时保留两份。') }}</small><SettingSelect v-model="syncConflictPolicy" :label="$t('冲突处理')" :options="[{ value: 'merge', label: $t('自动合并') }, { value: 'remote', label: $t('远端优先') }]"/></div>
            <section class="storage-subsection"><h4>GitHub</h4>
              <div class="setting-row sync-auth-row sync-credential-row"><span>{{ githubHasToken ? $t('GitHub 账号') : $t('访问令牌') }}</span><span class="sync-auth-controls"><span v-if="githubHasToken" class="sync-account-name" :title="githubUsername || '已登录 GitHub'">{{ githubUsername || '已登录 GitHub' }}</span><input v-else v-model="githubTokenDraft" type="password" placeholder="GitHub Personal Access Token" :aria-label="$t('GitHub 访问令牌')" autocomplete="new-password" @keyup.enter="storeGithubToken"/></span></div><div class="sync-auth-actions"><button v-if="githubHasToken" :disabled="githubBusy || githubRepoBusy" @click="logoutGithub">{{ $t('退出登录') }}</button><button v-else :disabled="!githubTokenDraft" @click="storeGithubToken">{{ $t('登录') }}</button></div>
              <template v-if="githubEnabled"><div class="setting-row">{{ $t('同步间隔') }} <span class="setting-number-control"><input :aria-label="$t('同步间隔')" v-model.number="githubSyncIntervalSeconds" type="number" min="10" max="3600" step="1"/> {{ $t('秒') }}</span></div><div class="setting-row">{{ $t('失败后自动重试') }} <input :aria-label="$t('失败后自动重试')" v-model="githubRetryOnFailure" type="checkbox"/></div></template>
            </section>
            <section class="storage-subsection"><h4>WebDAV</h4>
              <template v-if="!webdavHasPassword"><div class="setting-row sync-credential-row">{{ $t('服务器地址') }} <input :aria-label="$t('服务器地址')" v-model.trim="webdavUrl" type="url" placeholder="https://example.com/dav/" autocomplete="url"/></div><div class="setting-row sync-credential-row">{{ $t('用户名') }} <input :aria-label="$t('用户名')" v-model.trim="webdavUsername" type="text" autocomplete="username"/></div></template>
              <div class="setting-row sync-auth-row sync-credential-row"><span>{{ webdavHasPassword ? $t('WebDAV 账号') : $t('密码') }}</span><span class="sync-auth-controls"><span v-if="webdavHasPassword" class="sync-account-name" :title="webdavUsername">{{ webdavUsername }}</span><input v-else v-model="webdavPasswordDraft" type="password" :placeholder="$t('输入密码或应用密码')" :aria-label="$t('WebDAV 密码或应用密码')" autocomplete="new-password" @keyup.enter="storeWebdavPassword"/></span></div><div class="sync-auth-actions"><button v-if="webdavHasPassword" :disabled="webdavBusy || webdavBindingBusy" @click="logoutWebdav">{{ $t('退出登录') }}</button><button v-else :disabled="!webdavUrl || !webdavUsername || !webdavPasswordDraft" @click="storeWebdavPassword">{{ $t('登录') }}</button></div>
              <template v-if="webdavEnabled"><div class="setting-row">{{ $t('同步间隔') }} <span class="setting-number-control"><input :aria-label="$t('同步间隔')" v-model.number="webdavSyncIntervalSeconds" type="number" min="10" max="3600" step="1"/> {{ $t('秒') }}</span></div><div class="setting-row">{{ $t('失败后自动重试') }} <input :aria-label="$t('失败后自动重试')" v-model="webdavRetryOnFailure" type="checkbox"/></div></template>
            </section>
          </template>
          <template v-else-if="settingTab === 'editor'">
            <FontPicker v-model="editorFontFamilyInput" :fonts="systemFonts" :loading="fontsLoading" :label="$t('编辑器字体')" @open="loadSystemFonts" @preview="editorFontPreview = $event"><template #preview><div class="settings-editor-preview" :style="{ '--editor-font-size': `${editorLayoutPreview.fontSize ?? fontSizeInput}px`, '--editor-line-height': editorLayoutPreview.lineHeight ?? lineHeightInput, '--editor-indent': `${editorLayoutPreview.indent ?? indentInput}em`, '--editor-paragraph-spacing': `${editorLayoutPreview.paragraphSpacing ?? paragraphSpacing}px` }" :class="{ 'settings-preview-centered': editorAlignment === 'center' }" :aria-label="$t('正文排版预览')"><CodeEditor :body-line-numbers="bodyLineNumbers" :model-value="editorPreviewText" doc-id="settings-editor-preview" file-kind="markdown" :rich="true" :read-only="true" :preview-only="true" :keep-preview-rendered="true" :show-block-controls="false" :class="{ 'no-line-wrap': !wrapLinesInput }" :layout-key="[fontSizeInput,lineHeightInput,paragraphSpacing,indentInput,editorAlignment,wrapLinesInput,editorFontFamilyInput,editorFontPreview,JSON.stringify(editorLayoutPreview)].join(':')"/></div></template></FontPicker><div v-if="settingVisible('正文字号')" class="setting-row">{{ $t('正文字号') }}<SettingSelect v-model="fontSizeInput" :label="$t('正文字号')" :options="fontSizeOptions" @preview="previewEditorLayout('fontSize', $event)"/></div>
            <div v-if="settingVisible('行高')" class="setting-row">{{ $t('行高') }}<SettingSelect v-model="lineHeightInput" :label="$t('行高')" :options="lineHeightOptions" @preview="previewEditorLayout('lineHeight', $event)"/></div>
            <div v-if="settingVisible('段落间距')" class="setting-row">{{ $t('段落间距') }}<SettingSelect v-model="paragraphSpacing" :label="$t('段落间距')" :options="paragraphSpacingOptions" @preview="previewEditorLayout('paragraphSpacing', $event)"/></div>
            <div v-if="settingVisible('首行缩进')" class="setting-row">{{ $t('首行缩进') }}<SettingSelect v-model="indentInput" :label="$t('首行缩进')" :options="indentOptions" @preview="previewEditorLayout('indent', $event)"/></div>
            <div v-if="settingVisible('正文布局')" class="setting-row"><span class="setting-row-title">{{ $t('正文布局') }}</span><div class="setting-segmented" role="group" :aria-label="$t('正文布局')"><button type="button" :class="{ active: editorAlignment === 'left' }" :aria-pressed="editorAlignment === 'left'" @click="editorAlignment = 'left'">{{ $t('铺满') }}</button><button type="button" :class="{ active: editorAlignment === 'center' }" :aria-pressed="editorAlignment === 'center'" @click="editorAlignment = 'center'">{{ $t('居中') }}</button></div></div>
            <div v-if="settingVisible('表格宽度')" class="setting-row"><span class="setting-row-title">{{ $t('表格宽度') }}</span><div class="setting-segmented" role="group" :aria-label="$t('表格宽度')"><button type="button" :class="{ active: tableWidth === 'full' }" :aria-pressed="tableWidth === 'full'" @click="tableWidth = 'full'">{{ $t('铺满') }}</button><button type="button" :class="{ active: tableWidth === 'content' }" :aria-pressed="tableWidth === 'content'" @click="tableWidth = 'content'">{{ $t('内容自适应') }}</button></div></div>
            <div v-if="settingVisible('自动换行')" class="setting-row">{{ $t('自动换行') }} <input :aria-label="$t('自动换行')" v-model="wrapLinesInput" type="checkbox"/></div>
            <div v-if="settingVisible('显示正文行号')" class="setting-row">{{ $t('显示正文行号') }} <input :aria-label="$t('显示正文行号')" v-model="bodyLineNumbers" type="checkbox"/></div>
            <div v-if="settingVisible('代码、图表与公式行号')" class="setting-row">{{ $t('代码、图表与公式行号') }} <input :aria-label="$t('代码、图表与公式行号')" v-model="codeBlockLineNumbers" type="checkbox"/></div>
            <div v-if="settingVisible('图表可视化编辑')" class="setting-row">{{ $t('图表可视化编辑') }} <input :aria-label="$t('图表可视化编辑')" v-model="diagramVisualEditing" type="checkbox"/></div>
            <div v-if="settingVisible('外部文件修改')" class="setting-row"><span class="setting-row-title">{{ $t('外部文件修改') }}</span><div class="setting-segmented" role="group" :aria-label="$t('外部文件修改')"><button type="button" :class="{ active: externalFileChanges === 'auto' }" :aria-pressed="externalFileChanges === 'auto'" @click="externalFileChanges = 'auto'">{{ $t('自动加载') }}</button><button type="button" :class="{ active: externalFileChanges === 'confirm' }" :aria-pressed="externalFileChanges === 'confirm'" @click="externalFileChanges = 'confirm'">{{ $t('弹窗确认') }}</button></div></div>
          </template>
          <template v-else-if="settingTab === 'templates' || settingTab === 'snippets'">
            <p class="workflow-settings-intro">{{ settingTab === 'templates' ? $t('用于创建新文件。变量支持文件名和内容。') : $t('用于插入片段') }}</p>
            <div class="template-variables"><button type="button" v-for="variable in templateVariables" :key="variable.key" :disabled="!selectedPersonalId" @mousedown.prevent @click="insertTemplateVariable(variable.key)">{{ variableSyntax(variable.key) }} · {{ $t(variable.label) }}</button></div>
            <div class="personal-item-layout">
              <div class="personal-item-sidebar">
                <div class="personal-item-list bounded-personal-list">
                  <div v-for="item in personalItems" :key="item.id" class="personal-list-entry" :class="{ active: selectedPersonalId === item.id }">
                    <input v-if="personalRenamingId === item.id" ref="personalRenameInput" v-model="personalRenameDraft" :aria-label="`重命名${item.name}`" maxlength="80" @click.stop @keydown.enter.prevent="commitPersonalRename" @keydown.esc.prevent="personalRenamingId = ''" @blur="commitPersonalRename"/>
                    <button v-else :title="`编辑${item.name}`" @click="startPersonalRename(item)">{{ item.name }}</button>
                  </div>
                  <p v-if="!personalItems.length" class="personal-list-empty">{{ $t('还未添加') }}{{ settingTab === 'templates' ? $t('模板') : $t('片段') }}{{ $t('，点击下方 + 新建。') }}</p>
                </div>
                <div class="personal-list-actions"><button :aria-label="`新建${settingTab === 'templates' ? $t('模板') : $t('片段')}`" :title="$t('新建')" @click="addPersonalItem"><Plus :size="16"/></button><button :disabled="!selectedPersonalId" :aria-label="`删除选中的${settingTab === 'templates' ? $t('模板') : $t('片段')}`" :title="$t('删除选中项')" @click="removePersonalItem(personalItems.find((item: any) => item.id === selectedPersonalId)!)"><Minus :size="16"/></button></div>
              </div>
              <div class="personal-item-editor"><textarea ref="personalContentInput" v-model="personalContent" :aria-label="$t('内容')" :disabled="!selectedPersonalId" :placeholder="selectedPersonalId ? settingTab === 'templates' ? '# {{title}}' : $t('输入要插入的片段') : $t('在左侧选择或新建内容')" rows="10" @input="updatePersonalItemContent(($event.target as HTMLTextAreaElement).value)"/></div>
            </div>
          </template>
          <template v-else-if="settingTab === 'shortcuts'">
            <p class="workflow-settings-intro">{{ $t('快捷键设置') }}</p>
            <section v-for="group in shortcutGroups" :key="group.category" class="shortcut-group"><h4>{{ $t(group.category) }}</h4><div class="shortcut-list"><div v-for="item in group.items" :key="item.id" class="shortcut-row"><span>{{ item.custom ? item.label : $t(item.label) }}</span><div class="shortcut-actions"><button class="shortcut-record" :class="{ recording: recordingShortcutId === item.id }" :aria-label="`设置${item.label}快捷键`" @click="startShortcutRecording(item.id)" @keydown="recordShortcut(item.id, $event)">{{ recordingShortcutId === item.id ? $t('请按组合键…') : formatChord(assignedChord(item.id)) || '未设置' }}</button><button v-if="recordingShortcutId === item.id" class="shortcut-action" :aria-label="`取消设置${item.label}快捷键`" :title="$t('取消')" @pointerdown.prevent @click="cancelShortcutRecording"><X :size="14"/></button><button v-else class="shortcut-action" :disabled="!assignedChord(item.id)" :aria-label="`清除${item.label}快捷键`" :title="$t('清除快捷键')" @click="clearShortcut(item.id)"><Trash2 :size="14"/></button></div></div></div></section>
          <PluginShortcutSettings :prepare="suspendNativeShortcuts" :finish="syncNativeMenuShortcuts"/>
          </template>
          <template v-else-if="settingTab === 'spellcheck'">
            
            <div class="setting-row setting-row-borderless">{{ $t('启用拼写检查') }} <input :aria-label="$t('启用拼写检查')" v-model="spellcheckEnabled" type="checkbox"/></div>
            <template v-if="spellcheckEnabled">
            <div class="dictionary-list"><div v-for="dictionary in spellDictionaries" :key="dictionary.id"><span><strong>{{ dictionary.name }}</strong><small>{{ dictionary.source === 'local' ? $t('离线文件') : $t('下载地址') }}</small></span><button :aria-label="`删除词典${dictionary.name}`" @click="deleteSpellDictionary(dictionary.id)"><Trash2 :size="14"/></button></div><p v-if="!spellDictionaries.length">{{ $t('添加词典后即可检查拼写。') }}</p></div>
            <div class="dictionary-source-card"><strong>{{ $t('离线词典') }}</strong><p>{{ $t('选择同名的 .dic 和 .aff 文件。') }}</p><input ref="dictionaryFiles" class="visually-hidden" type="file" accept=".dic,.aff" multiple @change="importSpellDictionary"/><button :disabled="dictionaryBusy" @click="dictionaryFiles?.click()">{{ $t('选择 .dic 与 .aff 文件') }}</button></div>
            <div class="dictionary-source-card"><strong>{{ $t('从 下载地址添加') }}</strong><input v-model.trim="dictionaryRawDic" :placeholder="$t('.dic 下载地址')"/><input v-model.trim="dictionaryRawAff" :placeholder="$t('.aff 下载地址')"/><button :disabled="dictionaryBusy" @click="downloadSpellDictionary">{{ $t('下载并添加') }}</button></div>
            </template>
          </template>
          <template v-else-if="settingTab === 'export'">
            <p>{{ $t('PDF 与 Word') }}</p>
            <FontPicker v-model="exportFontFamily" :fonts="systemFonts" :loading="fontsLoading" default-value="-apple-system" :label="$t('导出字体')" @open="loadSystemFonts"/>
            <div class="setting-row">{{ $t('纸张大小') }} <SettingSelect v-model="exportPageSize" :label="$t('纸张尺寸')" :options="[{ value: 'A4', label: 'A4' }, { value: 'Letter', label: 'Letter' }, { value: 'custom', label: $t('自定义') }]"/></div>
            <div class="export-size-grid"><span>{{ $t('纸张尺寸（宽 × 高，mm）') }}</span><label><input :value="exportPageWidth || ''" type="number" :disabled="exportPageSize !== 'custom'" min="50" max="1000" @input="exportPageWidth = ($event.target as HTMLInputElement).value ? Number(($event.target as HTMLInputElement).value) : 0"/></label><label>x</label><label><input :value="exportPageHeight || ''" type="number" :disabled="exportPageSize !== 'custom'" min="50" max="1000" @input="exportPageHeight = ($event.target as HTMLInputElement).value ? Number(($event.target as HTMLInputElement).value) : 0"/></label></div>
            <div class="setting-row">{{ $t('页边距') }} <SettingSelect v-model="exportMarginPreset" :label="$t('页边距')" :options="[{ value: 'normal', label: $t('常规（18 mm）') }, { value: 'narrow', label: $t('窄（10 mm）') }, { value: 'wide', label: $t('宽（25 mm）') }, { value: 'custom', label: $t('自定义') }]"/></div><div v-if="exportMarginPreset === 'custom'" class="setting-row">{{ $t('自定义页边距（mm）') }} <input :aria-label="$t('自定义页边距（mm）')" :value="exportMargin || ''" type="number" min="0" max="100" @input="exportMargin = ($event.target as HTMLInputElement).value ? Number(($event.target as HTMLInputElement).value) : 0"/></div>
          </template>

          <PluginPreferenceItems v-if="!settingSearch.trim()" :category="settingTab"/>
        </div>
      </div>
    </div></div>

</template>

<style scoped>
.settings-modal .settings-layout-content,.settings-modal .settings-plugins-content{display:flex;flex-direction:column;min-height:0;overflow:hidden}
.settings-layout-content>.settings-section-head,.settings-plugins-content>.settings-section-head{flex:none}
</style>
