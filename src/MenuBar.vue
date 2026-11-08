<script lang="ts">
import PluginActions from './plugins/PluginActions.vue'
import { pluginSidebar } from './plugins/sidebarState'
import { computed, defineComponent, nextTick, onMounted, onBeforeUnmount, ref, unref, watch, type PropType } from 'vue'
import { renderTemplate } from './documents/personalItems'
import { Palette, X, Plus, FileText, FolderOpen, FilePlus2, Pin, Trash2, MoreHorizontal, Check, Eye, Code2, Columns2, ChevronRight, ChevronDown, Clock3 } from 'lucide-vue-next'

export default defineComponent({
  name: 'MenuBar',
  components: { PluginActions, Palette, X, Plus, FileText, FolderOpen, FilePlus2, Pin, Trash2, MoreHorizontal, Check, Eye, Code2, Columns2, ChevronRight, ChevronDown, Clock3 },
  props: { context: { type: Object as PropType<Record<string, any>>, required: true }, area: { type: String as PropType<'sidebarTop' | 'editorTop'>, required: true } },
  setup(props) {
    const topbarActions = ref<HTMLElement>()
    const topbarWidth = ref(0)
    const sidebarHeaderWidth = ref(pluginSidebar.state.width)
    const sidebarState = pluginSidebar.state
    let toolbarObserver: ResizeObserver | undefined
    onMounted(() => {
      if (props.area !== 'editorTop') return
      const measure = () => {
        const element = topbarActions.value
        if (!element) return
        const sidebar = element.parentElement?.querySelector<HTMLElement>('.plugin-sidebar')
        if (sidebar) sidebarHeaderWidth.value = parseFloat(sidebar.style.getPropertyValue('--plugin-sidebar-width')) || pluginSidebar.state.width
        const icons = element.querySelector<HTMLElement>('.collapsible-topbar-icons')
        topbarWidth.value = (icons?.scrollWidth || 0) + 40
      }
      toolbarObserver = new ResizeObserver(measure)
      if (topbarActions.value) {
        toolbarObserver.observe(topbarActions.value)
        const shell = topbarActions.value.parentElement?.querySelector('.plugin-sidebar-shell')
        if (shell) toolbarObserver.observe(shell)
        const icons = topbarActions.value.querySelector('.collapsible-topbar-icons')
        if (icons) toolbarObserver.observe(icons)
      }
      measure()
    })
    onBeforeUnmount(() => toolbarObserver?.disconnect())
    const topbarMoreAnchor = ref<HTMLElement>()
    const topbarMorePosition = ref<Record<string,string>>({})
    watch([() => unref(props.context.showTopbarMore), () => sidebarState.open], async ([open]) => {
      if (!open || props.area !== 'editorTop') return
      await nextTick()
      const button=topbarMoreAnchor.value
      if (!button) return
      const rect=button.getBoundingClientRect(),shell=button.closest('.app-shell')
      const scale=shell?Number.parseFloat(getComputedStyle(shell).zoom)||1:1
      topbarMorePosition.value={position:'fixed',left:`${Math.max(8,Math.min(rect.right/scale-218,innerWidth/scale-226))}px`,top:`${rect.bottom/scale+7}px`,right:'auto'}
    })
    const fileSubmenu = ref<'' | 'templates' | 'recent'>('')
    const fileSubmenuPosition = ref({ left: 0, top: 0 })
    const templateMenuDate = ref(new Date())
    const templateMenuItems = computed(() => (unref(props.context.templates) || []).map((item: { id: string; name: string; content: string }) => ({ ...item, name: renderTemplate(item.name, '未命名文件.md', templateMenuDate.value) })))
    watch(() => unref(props.context.showNewMenu), () => { fileSubmenu.value = '' })
    function toggleFileSubmenu(event: MouseEvent, kind: 'templates' | 'recent') {
      if (kind === 'templates') templateMenuDate.value = new Date()
      const button = event.currentTarget as HTMLElement
      const rect = button.getBoundingClientRect()
      const menu = button.closest('.file-hub-menu')?.getBoundingClientRect() || rect
      const shell = button.closest('.app-shell') as HTMLElement | null
      const scale = shell ? Number.parseFloat(getComputedStyle(shell).zoom) || 1 : 1
      const width = kind === 'recent' ? 330 : 240
      const height = kind === 'recent' ? 480 : Math.min(320, unref(props.context.templates).length * 34 + 14)
      fileSubmenuPosition.value = { left: Math.max(8, Math.min(menu.right / scale + 6, window.innerWidth / scale - width - 8)), top: Math.max(8, Math.min(rect.top / scale, window.innerHeight / scale - height - 8)) }
      fileSubmenu.value = fileSubmenu.value === kind ? '' : kind
    }
    return Object.assign({}, props.context, { area: props.area, sidebarState, topbarActions, topbarWidth, sidebarHeaderWidth, topbarMoreAnchor, topbarMorePosition, fileSubmenu, fileSubmenuPosition, templateMenuItems, toggleFileSubmenu })
  }
})
</script>

<template>
  <template v-if="area === 'sidebarTop'"><div class="workspace-controls" ><div class="collapsible-topbar-icons sidebar-topbar-icons" @pointerdown="startTopbarDrag($event, area)" @click.capture="suppressTopbarClick"><template v-for="id in topbarLayout.sidebarTop.filter((id: string) => !['readOnly','focus','typewriter'].includes(id))" :key="id"><span v-if="id === 'theme'" class="theme-anchor" :data-topbar-id="id"><button class="icon-button theme-trigger" :title="commandTitle(id)" :aria-label="commandTitle(id)" @click="onTopbarClick($event, id)"><Palette :size="16"/></button></span><button v-else class="icon-button" :data-topbar-id="id" :class="{ 'new-menu-trigger': id === 'files', 'mode-active': commandActive(id) }" :aria-pressed="id === 'focus' || id === 'typewriter' ? commandActive(id) : undefined" :disabled="commandDisabled(id)" :title="commandTitle(id)" :aria-label="commandTitle(id)" @click="onTopbarClick($event, id)"><component :is="commandIcon(id)" :size="16"/></button></template><div v-if="showNewMenu" class="file-hub-menu new-item-menu file-hub-main-menu" @scroll="fileSubmenu = ''" :style="{ left: `${fileHubPosition.left}px`, top: `${fileHubPosition.top}px` }"><template v-if="!currentWorkspaceRoot"><div class="menu-heading">{{ $t('新建') }}</div><button @click="newDoc()"><FileText :size="15"/> {{ $t('新建文件') }}</button><button v-if="templates.length" :aria-expanded="fileSubmenu === 'templates'" aria-haspopup="menu" @click="toggleFileSubmenu($event, 'templates')"><FilePlus2 :size="15"/> {{ $t('从模板创建') }}<ChevronRight class="template-submenu-arrow" :size="14"/></button></template><div class="menu-heading">{{ $t('打开') }}</div><button @click="showNewMenu = false; chooseFile()"><FileText :size="15"/> {{ $t('打开文件') }}</button><button @click="showNewMenu = false; chooseFolder()"><FolderOpen :size="15"/> {{ $t('打开文件夹') }}</button><button v-if="recentDirectories.length || orderedRecentFiles.length" :aria-expanded="fileSubmenu === 'recent'" aria-haspopup="menu" @click="toggleFileSubmenu($event, 'recent')"><Clock3 :size="15"/> {{ $t('最近打开') }}<ChevronRight class="template-submenu-arrow" :size="14"/></button><button v-if="currentWorkspaceRoot || (!isTauri && docs.length)" @click="closeFolder()"><X :size="15"/> {{ $t('关闭文件夹') }}</button></div></div></div></template>
  <template v-else>
    <div class="top-actions-placeholder" :style="{'--topbar-controls-width':`${topbarWidth + 51}px`}" aria-hidden="true"/>
    <Teleport defer to=".plugin-workspace">
    <div ref="topbarActions" class="top-actions floating-top-actions" :class="{'in-right-sidebar':sidebarState.open}" :style="{'--topbar-sidebar-width':`${sidebarHeaderWidth}px`}" :inert="showSettings ? true : undefined">
      <div class="collapsible-topbar-icons" @pointerdown="startTopbarDrag($event, area)" @click.capture="suppressTopbarClick">
        <template v-for="id in visibleTopbarCommands" :key="id">
          <PluginActions v-if="id.includes(':')" location="topbar-menu" :action-id="id" presentation="icon"/>
          <span v-else-if="id === 'theme'" class="theme-anchor" :data-topbar-id="id">
            <button class="icon-button theme-trigger" :title="commandTitle(id)" :aria-label="commandTitle(id)" :aria-expanded="showThemes" @click="onTopbarClick($event, id)"><Palette :size="17"/></button>

          </span>
          <button v-else class="icon-button" :data-topbar-id="id" :class="{ 'new-menu-trigger': id === 'files', 'mode-cycle': id === 'mode', 'mode-active': commandActive(id) }" :aria-pressed="id === 'focus' || id === 'typewriter' ? commandActive(id) : undefined" :disabled="commandDisabled(id)" :title="id === 'mode' ? $t('{0} · 切换到{1} ⌘⇧M', { '0': modeLabel, '1': nextModeLabel }) : commandTitle(id)" :aria-label="commandTitle(id)" @click="onTopbarClick($event, id)"><component :is="commandIcon(id)" :size="16"/></button>
        </template>
      </div>
      <button ref="topbarMoreAnchor" class="icon-button topbar-overflow" :title="$t('更多功能')" :aria-label="$t('更多功能')" :aria-expanded="showTopbarMore" aria-haspopup="menu" @click="toggleTopbarMore"><MoreHorizontal :size="16"/></button>
      <Teleport defer to=".app-shell"><div v-if="showTopbarMore" :style="topbarMorePosition" class="topbar-more-menu" role="menu" :aria-label="$t('编辑器快捷入口')">
        <div v-for="id in topbarMoreCommands" :key="id" class="topbar-more-entry">
          <div class="topbar-more-row">
            <button class="topbar-more-item" role="menuitem" :disabled="commandDisabled(id)" :title="commandTitle(id)" @click="onTopbarMoreClick($event, id)"><span>{{ commandInfo(id)?.label }}</span><small v-if="commandActive(id)">{{ $t('已开启') }}</small></button>
            <button class="topbar-more-pin" :title="pinnedTopbarCommands.includes(id) ? $t('取消固定') : $t('固定到菜单栏')" :aria-label="pinnedTopbarCommands.includes(id) ? $t('取消固定{0}', { '0': commandInfo(id)?.label }) : $t('固定{0}到菜单栏', { '0': commandInfo(id)?.label })" @click="toggleTopbarPin(id)"><Pin :size="13" :fill="pinnedTopbarCommands.includes(id) ? 'currentColor' : 'none'"/></button>
          </div>

        </div>
        <PluginActions location="topbar-menu" :pinned="pinnedTopbarCommands" @pin="toggleTopbarPin" @execute="showTopbarMore = false"/>
      </div></Teleport>

    </div>
    </Teleport>
  </template>
  <Teleport defer to=".app-shell"><div v-if="area === 'sidebarTop' && showNewMenu && fileSubmenu === 'templates'" class="file-hub-menu new-item-menu template-create-submenu" role="menu" :aria-label="$t('从模板创建')" :style="{ left: `${fileSubmenuPosition.left}px`, top: `${fileSubmenuPosition.top}px` }" @keydown.esc.stop="fileSubmenu = ''"><button v-for="item in templateMenuItems" :key="item.id" role="menuitem" @click="fileSubmenu = ''; newDoc(item)"><FilePlus2 :size="15"/>{{ item.name }}</button></div></Teleport>
  <Teleport defer to=".app-shell"><div v-if="area === 'sidebarTop' && showNewMenu && fileSubmenu === 'recent'" class="file-hub-menu new-item-menu recent-open-submenu" role="menu" :aria-label="$t('最近打开')" :style="{ left: `${fileSubmenuPosition.left}px`, top: `${fileSubmenuPosition.top}px` }" @keydown.esc.stop="fileSubmenu = ''"><div v-if="recentDirectories.length" class="menu-heading">{{ $t('最近文件夹') }}</div><div v-for="directory in recentDirectories" :key="directory" class="recent-file-entry" :class="{ selected: isTauri ? currentWorkspaceRoot === directory : currentDirectory === directory }"><button class="recent-file-main" :title="directory" :aria-current="(isTauri ? currentWorkspaceRoot === directory : currentDirectory === directory) ? 'true' : undefined" @click="selectDirectory(directory); showNewMenu = false"><FolderOpen :size="15"/><span><strong>{{ isTauri ? directory.split('/').pop() : directory }}</strong><small>{{ directory }}</small></span></button><button class="recent-file-action" :title="pinnedRecentFolders.includes(directory) ? $t('取消固定') : $t('固定文件夹')" :aria-label="pinnedRecentFolders.includes(directory) ? $t('取消固定') : $t('固定文件夹')" @click="toggleRecentFolderPin(directory)"><Pin :size="14" :fill="pinnedRecentFolders.includes(directory) ? 'currentColor' : 'none'"/></button></div><div v-if="orderedRecentFiles.length" class="menu-heading">{{ $t('最近文件') }}</div><div v-for="item in orderedRecentFiles" :key="item.path" class="recent-file-entry" :class="{ selected: activeAbsolutePath === item.path }"><button class="recent-file-main" :title="item.path" :aria-current="activeAbsolutePath === item.path ? 'true' : undefined" @click="openRecentFile(item.path)"><FileText :size="15"/><span><strong>{{ item.path.split('/').pop() }}</strong><small>{{ item.path.split('/').slice(0, -1).join('/') }}</small></span></button><button class="recent-file-action" :title="item.pinned ? $t('取消固定') : $t('固定文件')" :aria-label="item.pinned ? $t('取消固定') : $t('固定文件')" @click="toggleRecentPin(item.path)"><Pin :size="14" :fill="item.pinned ? 'currentColor' : 'none'"/></button></div><button v-if="recentDirectories.length || recentFiles.length" class="clear-recent-button" @click="clearRecentOpen"><Trash2 :size="14"/> {{ $t('清空最近打开') }}</button></div></Teleport>
</template>
<style scoped>
.topbar-section-divider{flex:none;width:1px;height:var(--topbar-divider-height);margin:0 4px;background:var(--topbar-divider-color)}

.top-actions{min-width:0;flex-shrink:1}.top-actions :deep(.icon-button){width:29px;min-width:29px;height:30px;flex:none;transform:translateY(1px)}.top-actions :deep(.icon-button svg){width:14px;height:14px}
.top-actions>.collapsible-topbar-icons{gap:2px;min-width:0;overflow:hidden;flex-shrink:1}
.top-actions>:deep(.plugin-actions),.top-actions>.topbar-overflow{flex-shrink:0}
.top-actions-placeholder{flex:none;width:max(0px,calc(var(--topbar-controls-width) - (var(--right-sidebar-width,280px) * var(--right-sidebar-progress,0))));height:100%}
.floating-top-actions{position:absolute;right:51px;top:0;height:var(--workspace-topbar-height,49px);z-index:31;width:max-content;max-width:calc(100% - 200px);margin:0!important;padding-left:10px;transform:translateX(0);transition:transform .2s ease-out,max-width .2s ease-out}
.floating-top-actions.in-right-sidebar{transform:translateX(1px);max-width:calc(var(--topbar-sidebar-width) - 57px);padding-left:0}
.floating-top-actions::before{content:'';position:absolute;left:0;top:50%;width:1px;height:var(--topbar-divider-height);transform:translateY(-50%);background:var(--topbar-divider-color);pointer-events:none}
.floating-top-actions.in-right-sidebar::before{display:none}
@media(prefers-reduced-motion:reduce){.floating-top-actions{transition:none}}
</style>
