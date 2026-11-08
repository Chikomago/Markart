<script lang="ts">
import PluginActions from './plugins/PluginActions.vue'
import { defineComponent, onBeforeUnmount, ref, unref, watch, type PropType } from 'vue'
import { X, Plus, File, FolderOpen, ChevronRight } from 'lucide-vue-next'

export default defineComponent({
  name: 'TabBar',
  components: { PluginActions, X, Plus, File, FolderOpen, ChevronRight },
  props: { context: { type: Object as PropType<Record<string, any>>, required: true } },
  setup(props) {
    const tabsElement = ref<HTMLElement | null>(null)
    const suppressNewButtonHover = ref(false)
    const revealActiveTab = () => {
      const container = tabsElement.value
      const active = container?.querySelector<HTMLElement>('.document-tab.active')
      if (!container || !active) return
      const bounds = container.getBoundingClientRect()
      const tab = active.getBoundingClientRect()
      if (tab.left < bounds.left) container.scrollLeft -= bounds.left - tab.left
      else if (tab.right > bounds.right) container.scrollLeft += tab.right - bounds.right
    }
    const observer = new ResizeObserver(revealActiveTab)
    watch(tabsElement, (element, previous) => {
      if (previous) observer.unobserve(previous)
      if (element) { observer.observe(element); revealActiveTab() }
    }, { flush: 'post' })
    watch(() => [unref(props.context.activeId), ...unref(props.context.tabDocs).map((doc: { id: string }) => doc.id)], revealActiveTab, { flush: 'post' })
    onBeforeUnmount(() => observer.disconnect())
    return { ...props.context, tabsElement, suppressNewButtonHover } as Record<string, any>
  }
})
</script>

<template>
<div v-if="tabViewEnabled" class="document-tabs-group"><div ref="tabsElement" class="document-tabs" role="tablist" :aria-label="$t('打开的文件')"><div v-for="doc in tabDocs" :key="doc.id" class="document-tab" @mousedown.right.prevent :class="{ active: doc.id === activeId, dragging: draggedTabId === doc.id }" role="tab" :aria-selected="doc.id === activeId" :title="doc.path" draggable="true" @contextmenu.prevent="tabContext = { id: doc.id, x: $event.clientX, y: $event.clientY }" @dragstart="draggedTabId = doc.id" @dragover.prevent @drop.prevent="dropTab(doc.id)" @dragend="draggedTabId = ''"><button class="tab-label" @click="selectDoc(doc.id)"><File :size="14" aria-hidden="true"/><span class="tab-name">{{ doc.path.split('/').pop() }}</span><span v-if="doc.temporary || dirtyIds.includes(doc.id)" class="tab-status-dot" :title="doc.temporary ? $t('待保存') : $t('未保存')" :aria-label="doc.temporary ? $t('待保存') : $t('未保存')"/><span v-else-if="conflictedIds.includes(doc.id)" class="document-edit-state"> {{ $t('· 磁盘冲突') }}</span></button><PluginActions location="tab" :document-id="doc.id"/><button class="tab-close" :aria-label="`关闭${doc.path}`" @click="closeTab(doc.id)"><X :size="11"/></button></div><span v-if="!tabDocs.length" class="tab-empty">{{ $t('未打开文件') }}</span><button type="button" class="icon-button tab-new" :class="{ 'suppress-hover': suppressNewButtonHover }" :title="$t('新建文件')" :aria-label="$t('新建文件')" @pointerdown="suppressNewButtonHover = true" @pointermove="suppressNewButtonHover = false" @pointerleave="suppressNewButtonHover = false" @click="newTemporaryDoc()"><Plus :size="12"/></button></div></div>
<div v-else class="document-location" data-tauri-drag-region="deep"><FolderOpen :size="14"/><span>{{ activeDoc.path.split('/').slice(0, -1).join('/') }}</span><ChevronRight :size="13"/><strong :title="activeDoc.path.split('/').pop()">{{ activeDoc.path.split('/').pop() }}</strong><span v-if="activeDoc.temporary" class="document-edit-state">{{ $t('待保存') }}</span><span v-else-if="dirtyIds.includes(activeId)" class="document-edit-state">{{ $t('未保存') }}</span><span v-else-if="conflictedIds.includes(activeId)" class="document-edit-state">{{ $t('磁盘冲突') }}</span></div>
<div v-if="tabContext" class="tab-context-menu" :style="{ left: `${tabContext.x}px`, top: `${tabContext.y}px` }"><button @click="closeTab(tabContext.id); tabContext = null">{{ $t('关闭标签页') }}</button><button :disabled="openTabs.indexOf(tabContext.id) <= 0" @click="closeTabs('left')">{{ $t('关闭左侧标签页') }}</button><button :disabled="openTabs.indexOf(tabContext.id) >= openTabs.length - 1" @click="closeTabs('right')">{{ $t('关闭右侧标签页') }}</button><button :disabled="openTabs.length <= 1" @click="closeTabs('others')">{{ $t('关闭其他标签页') }}</button><div/><button :disabled="!canReloadTab(tabContext.id)" @click="reloadTab(tabContext.id)">{{ $t('重新载入') }}</button><button @click="locateTabFile(tabContext.id)">{{ $t('定位当前文件') }}</button><button :disabled="!tabFilePath(tabContext.id)" @click="runTabFileAction('reveal', tabContext.id)">{{ isMac ? $t('在 Finder 中显示') : $t('在资源管理器中显示') }}</button><button :disabled="!tabFilePath(tabContext.id)" @click="runTabFileAction('copy', tabContext.id)">{{ $t('复制路径') }}</button><PluginActions location="tab-context" :document-id="tabContext.id" @execute="tabContext = null"/></div>
</template>
<style scoped>
.document-tabs-group { display:flex;align-items:center;flex:1;min-width:0;height:100%;gap:4px; }
.icon-button.tab-new { flex:none;width:26px;height:33px;padding:0;transform:none;display:flex;align-items:center;justify-content:center;color:var(--muted);border-radius:5px; }
.tab-new svg,.tab-close svg { display:block;flex:none; }
.document-tab .tab-close svg { width:11px;height:11px; }
.document-tab .tab-label { display:flex;align-items:center;gap:6px; }
.tab-label>svg { flex:none;width:14px;height:14px; }
.tab-name { overflow:hidden;text-overflow:ellipsis;white-space:nowrap; }
.tab-status-dot { flex:none;width:6px;height:6px;border-radius:50%;background:var(--accent); }
.document-tab .tab-close { height:33px;align-items:center;padding:0 5px;box-sizing:border-box;justify-content:center; }
.icon-button.tab-new:hover { background:var(--hover);color:var(--ink); }
.icon-button.tab-new.suppress-hover:hover { background:transparent; }
.document-tabs { flex:0 1 auto;width:max-content;max-width:100%;min-width:0;scrollbar-width:none; }
.document-tabs::-webkit-scrollbar { display: none; }
.document-tab { min-width:160px;max-width:180px;flex:1 1 180px; }
.document-tab{user-select:none;-webkit-user-select:none}</style>
