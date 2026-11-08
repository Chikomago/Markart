<script setup lang="ts">
import { PanelRight } from 'lucide-vue-next'
import { pluginSidebar } from './sidebarState'
import PluginSidebar from './PluginSidebar.vue'
import SidebarContents from './ui/SidebarContents.vue'
import {unref} from 'vue'
defineProps<{context:Record<string,any>}>()
</script>
<template>
  <div class="plugin-workspace" :class="{ 'plugin-sidebar-open': pluginSidebar.state.open }" :style="{'--right-sidebar-progress': pluginSidebar.state.open ? 1 : 0}">
    <div class="plugin-workspace-editor"><slot/></div>
    <PluginSidebar :root="unref(context.currentWorkspaceRoot)"/>
    <SidebarContents :context="context"/>
    <button class="icon-button plugin-sidebar-toggle" :class="{ 'mode-active': pluginSidebar.state.open }" :title="$t('右侧栏')" :aria-label="$t('右侧栏')" :aria-expanded="pluginSidebar.state.open" aria-controls="plugin-sidebar" @click="pluginSidebar.toggle()"><PanelRight :size="14"/></button>
  </div>
</template>
<style>
@property --right-sidebar-progress{syntax:'<number>';inherits:true;initial-value:0}
</style>
<style scoped>
.plugin-workspace{isolation:isolate;position:relative;flex:1;display:flex;min-width:0;min-height:0;overflow:hidden;transition:--right-sidebar-progress .2s ease-out}
.plugin-workspace-editor{flex:1;display:flex;min-width:0;min-height:0;overflow:hidden}
.plugin-workspace-editor :deep(.workspace){flex:1;min-width:0;min-height:0}
.plugin-sidebar-toggle{position:absolute;right:10px;top:9px;z-index:30;width:30px;height:30px;min-width:30px}
.plugin-sidebar-toggle::before{content:'';position:absolute;left:-5px;top:50%;transform:translateY(-50%);width:1px;height:var(--topbar-divider-height);background:var(--topbar-divider-color);pointer-events:none}
.plugin-workspace:has(.document-tabs) :deep(.plugin-sidebar-header){background:var(--tabbar-bg,var(--paper))}
@media(prefers-reduced-motion:reduce){.plugin-workspace{transition:none}}
</style>
