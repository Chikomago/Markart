<script setup lang="ts">
import { computed } from 'vue'
import SidebarManagerDialog from './SidebarManagerDialog.vue'
import { sidebarLayout, filesView, outlineView } from './sidebarLayout'
import { sidebarViews, groupItems, groupLabel } from './sidebarRegistry'
import { pluginSidebar } from '../sidebarState'
const props=defineProps<{context:Record<string,any>}>()
const regions=computed(()=>sidebarLayout.state.groups.map(group=>({id:group.id,label:groupLabel(group)})))
const groups=computed(()=>Object.fromEntries(sidebarLayout.state.groups.map(group=>[group.id,groupItems(group).map(item=>item.id)])))
const titles=computed(()=>{
 const result:Record<string,string>={}
 for(const view of sidebarViews.value){
  const items=Object.values(sidebarLayout.state.items).filter(item=>item.viewId===view.id)
  if(items.length)for(const item of items)result[item.id]=view.title
  else result[`view:${view.id}`]=view.title
 }
 return result
})
const iconKinds=computed(()=>Object.fromEntries(Object.keys(titles.value).map(id=>{const view=id.startsWith('view:')?id.slice(5):sidebarLayout.state.items[id]?.viewId;return[id,view===filesView?'files':view===outlineView?'outline':'plugin']})))
function canDrop(id:string,target:string){
 if(target==='library')return true
 const viewId=id.startsWith('view:')?id.slice(5):sidebarLayout.state.items[id]?.viewId
 return !!viewId&&sidebarLayout.state.groups.some(group=>group.id===target)&&sidebarLayout.canPlace(viewId,target,id.startsWith('view:')?undefined:id)
}
function place(id:string,target:string,before?:string){
 if(!canDrop(id,target))return
 if(!(id in titles.value))return
 if(target==='library'){
  if(!id.startsWith('view:')&&sidebarLayout.state.items[id])sidebarLayout.close(id)
  return
 }
 const group=sidebarLayout.state.groups.find(group=>group.id===target)
 if(!group)return
 let itemId=id
 if(id.startsWith('view:')){
  const view=sidebarViews.value.find(view=>view.id===id.slice(5));if(!view)return
  itemId=sidebarLayout.open(view.id,{groupId:target}).id
 }
 if(before&&!group.items.includes(before))before=undefined
 sidebarLayout.place(itemId,target,before)
 if(group.slot.startsWith('right'))pluginSidebar.setOpen(true)
 else props.context.sidebarOpenInput.value=true
}
</script>
<template>
 <SidebarManagerDialog embedded :groups="groups" :regions="regions" :titles="titles" :icon-kinds="iconKinds" :can-drop="canDrop" @place="place"/>
</template>
