<script setup lang="ts">
import { computed, onBeforeUnmount } from 'vue'
import { sidebarLayout, type SidebarGroup } from './sidebarLayout'
import { activeItem, groupItems, groupLabel, sidebarHeadingTargets, sidebarTargets } from './sidebarRegistry'
const props=defineProps<{group:SidebarGroup;root?:string}>()
const items=computed(()=>groupItems(props.group)),current=computed(()=>activeItem(props.group))
function headingTarget(element:unknown){if(element instanceof HTMLElement)sidebarHeadingTargets.set(props.group.id,element);else sidebarHeadingTargets.delete(props.group.id)}
function target(element:unknown){if(element instanceof HTMLElement)sidebarTargets.set(props.group.id,element);else sidebarTargets.delete(props.group.id)}
function switchKey(event:KeyboardEvent,id:string){
 if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return
 const list=items.value,index=list.findIndex(item=>item.id===id),next=event.key==='Home'?0:event.key==='End'?list.length-1:(index+(event.key==='ArrowRight'?1:-1)+list.length)%list.length
 event.preventDefault();sidebarLayout.select(list[next].id);(event.currentTarget as HTMLElement).parentElement?.querySelectorAll<HTMLButtonElement>('[role=tab]')[next]?.focus()
}
onBeforeUnmount(()=>{sidebarTargets.delete(props.group.id);sidebarHeadingTargets.delete(props.group.id)})
</script>
<template><section class="dock-region" :data-panel-group="group.id" :aria-label="groupLabel(group)"><header v-if="items.length" class="dock-region-heading" :class="{'has-file-actions':current?.viewId==='builtin:files'}"><div v-if="current?.viewId==='builtin:files'" :ref="headingTarget" class="dock-file-heading"/><div v-else class="dock-panel-switches" role="tablist" :aria-label="groupLabel(group)"><button v-for="item in items" :key="item.id" role="tab" :class="{active:current?.id===item.id}" :aria-selected="current?.id===item.id" :tabindex="current?.id===item.id?0:-1" :title="item.title" @click="sidebarLayout.select(item.id)" @keydown="switchKey($event,item.id)">{{item.title}}</button></div></header><div :ref="target" class="dock-region-content"/></section></template>
<style>
.dock-region{position:relative;display:flex;flex-direction:column;min-width:0;min-height:0;overflow:hidden}.dock-region-heading{height:30px;min-height:30px;display:flex;align-items:center;gap:2px;padding:0 15px;color:var(--muted)}.dock-region-heading.has-file-actions{padding-right:139px}.dock-file-heading{display:flex;align-items:center;min-width:0;flex:1}.dock-panel-switches{display:flex;align-items:center;gap:13px;flex:1;min-width:0;overflow:auto;scrollbar-width:none}.dock-panel-switches::-webkit-scrollbar{display:none}.dock-panel-switches>button{flex:none;max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;padding:5px 0;border:0;background:none;color:var(--muted);font:inherit;font-size:13px}.dock-panel-switches>button+button{position:relative;padding-left:13px}.dock-panel-switches>button+button:before{content:'';position:absolute;left:0;top:50%;transform:translateY(-50%);width:1px;height:12px;background:var(--line-strong)}.dock-panel-switches>button.active{font-weight:600;color:var(--ink)}.dock-region-heading .icon-button{width:22px;min-width:22px;height:24px;border-radius:4px;color:var(--muted)}.dock-region-content{display:flex;flex:1;min-height:0;min-width:0;overflow:visible}.dock-panel-content{display:flex;flex-direction:column;flex:1;min-height:0;min-width:0;overflow:visible}.dock-plugin-content{padding:10px 12px}.dock-plugin-content>.plugin-content{flex:1}.dock-panel-switches>button:focus-visible{outline:2px solid var(--accent);outline-offset:1px}
</style>
