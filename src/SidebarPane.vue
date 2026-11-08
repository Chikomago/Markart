<script lang="ts">
import { defineComponent, unref, type PropType } from 'vue'
import SidebarArea from './plugins/ui/SidebarArea.vue'
export default defineComponent({name:'SidebarPane',components:{SidebarArea},props:{context:{type:Object as PropType<Record<string,any>>,required:true}},setup(props){return {...props.context,unref} as Record<string,any>}})
</script>
<template><aside v-if="sidebar" class="sidebar" :style="{width:`${sidebarDisplayWidth}px`}" @contextmenu="($event.target as HTMLElement).closest('input,textarea,[contenteditable]') || $event.preventDefault()"><div class="sidebar-top" data-tauri-drag-region="deep"><span class="sidebar-drag" data-tauri-drag-region="deep"/></div><SidebarArea side="left" :root="currentWorkspaceRoot"/></aside></template>

<style scoped>.sidebar-top{background:var(--tabbar-bg,var(--paper))}</style>
