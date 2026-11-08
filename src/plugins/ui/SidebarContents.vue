<script setup lang="ts">
import { computed, ref, toRef, unref, watch } from 'vue'
import FileTreePanel from '../../files/FileTreePanel.vue'
import OutlinePanel from '../../workspace/OutlinePanel.vue'
import PluginContent from '../PluginContent.vue'
import { filesView, outlineView, sidebarLayout, type SidebarItemState } from './sidebarLayout'
import { pluginSidebar } from '../sidebarState'
import { activeItem, sidebarHeadingTargets, sidebarTargets, sidebarViews } from './sidebarRegistry'
import { pluginRuntime } from '../runtime'
import { sidebarInstances } from '../host/services'
const props=defineProps<{context:Record<string,any>}>(),parking=ref<HTMLElement>()
const outlineEnabled=toRef(props.context,'outlineOpenInput')
const opened=computed(()=>Object.values(sidebarLayout.state.items).filter(item=>sidebarViews.value.some(view=>view.id===item.viewId)))
const loaded=ref(new Set<string>())
function destination(item:SidebarItemState){return sidebarTargets.get(item.groupId)||parking.value}
function visible(item:SidebarItemState){return activeItem(sidebarLayout.group(item.groupId))?.id===item.id&&sidebarTargets.has(item.groupId)}
watch(()=>Object.values(sidebarLayout.state.items).map(item=>({id:item.id,groupId:item.groupId})),(items,previous)=>{for(const item of items){const before=previous?.find(entry=>entry.id===item.id);if(!before||before.groupId===item.groupId)continue;const group=sidebarLayout.group(item.groupId);if(group.slot.startsWith('right'))pluginSidebar.setOpen(true);else props.context.sidebar.value=true}})
const mounts=new Map<string,{view:unknown;mount:(element:HTMLElement)=>any}>()
function mountOf(item:SidebarItemState){const view=pluginRuntime.state.views.find(view=>view.id===item.viewId);if(!view)return;const cached=mounts.get(item.id);if(cached?.view===view)return cached.mount;const mount=view.createMount?.(item.id)||view.mount;mounts.set(item.id,{view,mount});return mount}
watch(()=>opened.value.map(item=>[item.id,visible(item)]),()=>{const next=new Set(loaded.value);for(const item of opened.value)if(visible(item))next.add(item.id);for(const id of next)if(!opened.value.some(item=>item.id===id))next.delete(id);loaded.value=next;for(const item of opened.value)sidebarInstances.get(item.id)?.visibility(visible(item));for(const id of mounts.keys())if(!opened.value.some(item=>item.id===id))mounts.delete(id)},{immediate:true})
watch(()=>[unref(props.context.currentWorkspaceRoot),unref(props.context.activeId),unref(props.context.fileViewRevision)],()=>{for(const instance of sidebarInstances.values())instance.context()})
watch(()=>unref(outlineEnabled),enabled=>{
 const existing=Object.values(sidebarLayout.state.items).find(item=>item.viewId===outlineView)
 if(enabled&&!existing){const preferred=sidebarLayout.state.groups.find(group=>group.slot==='left-bottom')!;sidebarLayout.open(outlineView,{groupId:sidebarLayout.canPlace(outlineView,preferred.id)?preferred.id:undefined})}
 if(enabled===false&&existing)sidebarLayout.close(existing.id)
},{immediate:true})
watch(()=>Object.values(sidebarLayout.state.items).some(item=>item.viewId===outlineView),(has,previous)=>{if(has!==previous&&typeof outlineEnabled.value==='boolean')outlineEnabled.value=has})
</script>
<template><div ref="parking" class="dock-parking" hidden/><template v-for="item in opened" :key="item.id"><Teleport v-if="destination(item)&&loaded.has(item.id)" :to="destination(item)!"><div v-show="visible(item)" class="dock-panel-content" :class="{'dock-plugin-content':item.viewId!==filesView&&item.viewId!==outlineView}" :data-panel-id="item.id" :data-view-id="item.viewId"><FileTreePanel v-if="item.viewId===filesView" :context="context" :heading-target="sidebarHeadingTargets.get(item.groupId)"/><OutlinePanel v-else-if="item.viewId===outlineView" :context="context"/><PluginContent v-else-if="mountOf(item)" :mount="mountOf(item)!"/></div></Teleport></template></template>
