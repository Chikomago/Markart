<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { LayoutDashboard, File, ListTree, Network, Tags, Link, GripVertical, Puzzle } from 'lucide-vue-next'
import { t } from '../../i18n'
const props=defineProps<{open?:boolean;embedded?:boolean;groups:Record<string,string[]>;regions:{id:string;label:string}[];titles:Record<string,string>;iconKinds?:Record<string,string>;canDrop?:(id:string,target:string)=>boolean}>()
const emit=defineEmits<{close:[];place:[id:string,target:string,before?:string]}>()
const dialog=ref<HTMLElement>(),dragging=ref(''),hover=ref(''),point=ref({x:0,y:0})
const ghostStyle=computed(()=>{
 const element=dialog.value;if(!element)return {}
 const rect=element.getBoundingClientRect(),scale=element.clientWidth?rect.width/element.offsetWidth:1
 return {left:`${(point.value.x-rect.left)/scale+12}px`,top:`${(point.value.y-rect.top)/scale+12}px`}
})
const icons:Record<string,any>={files:File,outline:ListTree,graph:Network,tags:Tags,backlinks:Link}
function icon(id:string){return icons[props.iconKinds?.[id]||id]||Puzzle}
const panels=computed(()=>Object.keys(props.titles).filter(id=>!Object.values(props.groups).some(items=>items.includes(id))))
function allowed(id:string,target:string){
 if(target==='library')return true
 if(props.canDrop)return props.canDrop(id,target)
 const files=(key:string)=>(props.iconKinds?.[key]||key)==='files'
 const others=(props.groups[target]||[]).filter(key=>key!==id)
 return files(id)?!others.length:!others.some(files)
}
function place(target:string,before?:string){const id=dragging.value;if(id&&id!==before&&allowed(id,target))emit('place',id,target,before)}
watch(()=>props.open,async open=>{if(props.embedded)return;await nextTick();const element=dialog.value as HTMLDialogElement|undefined;if(open&&!element?.open)element?.showModal();else if(!open&&element?.open)element?.close()},{immediate:true})
let cleanup:(()=>void)|undefined
function start(event:PointerEvent,id:string){
 if(event.button!==0)return;event.preventDefault();cleanup?.()
 const previousUserSelect=document.body.style.userSelect,previousWebkitUserSelect=document.body.style.webkitUserSelect
 document.body.style.userSelect='none';document.body.style.webkitUserSelect='none'
 const origin={x:event.clientX,y:event.clientY};point.value=origin
 const move=(e:PointerEvent)=>{if(e.pointerId!==event.pointerId)return;if(Math.hypot(e.clientX-origin.x,e.clientY-origin.y)>5){dragging.value=id;e.preventDefault();point.value={x:e.clientX,y:e.clientY};hover.value=document.elementFromPoint(e.clientX,e.clientY)?.closest<HTMLElement>('[data-manager-zone]')?.dataset.managerZone||''}}
 const stop=()=>{window.removeEventListener('pointermove',move);window.removeEventListener('pointerup',up);window.removeEventListener('pointercancel',cancel);window.removeEventListener('blur',cancel);document.body.style.userSelect=previousUserSelect;document.body.style.webkitUserSelect=previousWebkitUserSelect;dragging.value='';hover.value='';cleanup=undefined}
 const up=(e:PointerEvent)=>{if(e.pointerId!==event.pointerId)return;try{if(dragging.value){const element=document.elementFromPoint(e.clientX,e.clientY),zone=element?.closest<HTMLElement>('[data-manager-zone]');if(zone)place(zone.dataset.managerZone!,element?.closest<HTMLElement>('[data-before]')?.dataset.before)}}finally{stop()}}
 const cancel=()=>stop();window.addEventListener('pointermove',move,{passive:false});window.addEventListener('pointerup',up);window.addEventListener('pointercancel',cancel);window.addEventListener('blur',cancel);cleanup=stop
}
watch(()=>props.open,open=>{if(!open)cleanup?.()})
onBeforeUnmount(()=>cleanup?.())
</script>
<template>
<component :is="embedded ? 'section' : 'dialog'" ref="dialog" class="sidebar-manager-dialog" :class="{'sidebar-manager-embedded':embedded}" :aria-label="embedded ? t('布局') : undefined" :aria-labelledby="embedded ? undefined : 'sidebar-manager-title'" @keydown.tab.prevent @cancel="emit('close')" @close="emit('close')" @click="($event.target===dialog)&&emit('close')">
 <div class="sidebar-manager-surface">
 <header v-if="!embedded"><LayoutDashboard :size="18"/><h2 id="sidebar-manager-title">{{t('布局')}}</h2><span class="reference-esc">ESC</span></header>
 <div class="sidebar-manager-canvas">
  <section v-for="(region,index) in regions" :key="region.id" class="sidebar-manager-zone" :class="{'is-target':hover===region.id&&allowed(dragging,region.id),'is-unavailable':!!dragging&&!allowed(dragging,region.id)}" :style="{gridArea:['lt','lb','rt','rb'][index]}" :data-manager-zone="region.id" :aria-label="region.label">
   <header><span>{{region.label}}</span></header>
   <div class="sidebar-manager-zone-list" role="list"><div v-for="id in groups[region.id]" role="listitem" :key="id" class="sidebar-manager-chip" :data-before="id" @pointerdown="start($event,id)"><GripVertical :size="12"/><component :is="icon(id)" :size="15"/><span>{{titles[id]}}</span></div>
   </div>
  </section>
  <section class="sidebar-manager-library" data-manager-zone="library" :class="{'is-target':hover==='library'}" :aria-label="t('面板列表')"><h3>{{t('面板列表')}}</h3>
   <p v-if="!panels.length" class="sidebar-manager-library-empty">{{t('无未放置面板')}}</p>
   <div class="sidebar-manager-library-list" role="list"><div v-for="id in panels" role="listitem" :key="id" class="sidebar-manager-row" @pointerdown="start($event,id)"><GripVertical :size="12"/><component :is="icon(id)" :size="17"/><span>{{titles[id]}}</span></div></div>
  </section>
 </div>
 <footer v-if="!embedded"><button @click="emit('close')">{{t('完成')}}</button></footer>
 <div v-if="dragging" class="sidebar-manager-ghost" :style="ghostStyle"><component :is="icon(dragging)" :size="15"/>{{titles[dragging]}}</div>
 </div>
</component>
</template>
<style>
.sidebar-manager-dialog{width:min(900px,calc(100vw - 32px));max-width:none;max-height:calc(100dvh - 32px);padding:0;box-sizing:border-box;border:1px solid var(--line-strong);border-radius:14px;background:var(--paper);color:var(--ink);box-shadow:var(--shadow);overflow:auto;font:inherit}.sidebar-manager-dialog::backdrop{background:#17223840}.sidebar-manager-surface{display:flex;flex-direction:column;max-height:calc(100dvh - 34px)}.sidebar-manager-surface>header{flex:none;display:flex;align-items:center;gap:12px;padding:20px 24px;border-bottom:1px solid var(--line)}.sidebar-manager-surface h2{margin:0;font-size:14px;font-weight:500}.sidebar-manager-surface .reference-esc{margin-left:auto;color:var(--muted);pointer-events:none}.sidebar-manager-canvas{min-height:0;overflow:auto;display:grid;grid-template-areas:'lt library rt' 'lb library rb';grid-template-columns:minmax(0,1fr) minmax(200px,1.15fr) minmax(0,1fr);gap:16px;padding:24px}.sidebar-manager-zone{min-width:0;aspect-ratio:1;display:flex;flex-direction:column;box-sizing:border-box;border:1px solid var(--line);border-radius:9px;background:var(--panel);padding:13px}.sidebar-manager-zone>header{display:flex;gap:8px;align-items:center;font-size:11px;color:var(--muted);padding-bottom:12px}.sidebar-manager-zone-list{flex:1;min-height:0;overflow:auto}.sidebar-manager-dialog button{font:inherit;color:inherit;cursor:pointer}.sidebar-manager-chip{display:flex;align-items:center;gap:7px;width:100%;padding:9px 7px;margin-bottom:5px;border:1px solid var(--line);border-radius:6px;background:var(--paper);font-size:12px!important;text-align:left;box-sizing:border-box;touch-action:none;user-select:none;-webkit-user-select:none;cursor:grab}.sidebar-manager-chip>svg:first-child,.sidebar-manager-row>svg:first-child{color:var(--muted);flex-shrink:0}.sidebar-manager-chip span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.sidebar-manager-library{grid-area:library;display:flex;flex-direction:column;min-width:0;padding:14px 12px;border:1px solid var(--line);border-radius:9px;box-sizing:border-box}.sidebar-manager-library h3{font-size:13px;margin:0 0 18px;font-weight:600;text-align:center}.sidebar-manager-library p{font-size:11px;line-height:1.7;color:var(--muted);margin:0 0 18px}.sidebar-manager-library .sidebar-manager-library-empty{flex:1;display:flex;align-items:center;justify-content:center;margin:0;text-align:center}.sidebar-manager-library-list{display:flex;flex-direction:column;gap:7px}.sidebar-manager-row{display:flex;align-items:center;gap:10px;width:100%;padding:11px 9px;border:1px solid transparent;border-radius:7px;background:none;text-align:left;box-sizing:border-box;touch-action:none;user-select:none;-webkit-user-select:none;cursor:grab}.sidebar-manager-row>span{flex:1;font-size:12px}.sidebar-manager-row small{display:block;margin-top:4px;font-size:10px;color:var(--muted)}.sidebar-manager-dialog .is-target{outline:2px solid var(--accent);outline-offset:2px}.sidebar-manager-zone.is-unavailable{opacity:.45;cursor:not-allowed}.sidebar-manager-zone.is-unavailable *{cursor:not-allowed}.sidebar-manager-row:hover,.sidebar-manager-chip:hover{background:var(--hover)}.sidebar-manager-surface>footer{flex:none;display:flex;align-items:center;justify-content:flex-end;padding:14px 24px;border-top:1px solid var(--line);font-size:11px;color:var(--muted)}.sidebar-manager-surface>footer button{min-width:96px;height:32px;padding:0 14px;background:var(--paper);color:var(--ink);border:1px solid var(--line-strong);border-radius:6px;font-size:12px}.sidebar-manager-ghost{position:absolute;z-index:2;pointer-events:none;display:flex;gap:8px;align-items:center;padding:10px 14px;background:var(--paper);border:1px solid var(--line-strong);border-radius:7px;box-shadow:var(--shadow);font-size:12px}.sidebar-manager-dialog{user-select:none;-webkit-user-select:none;-webkit-tap-highlight-color:transparent}.sidebar-manager-dialog button:focus{outline:none;box-shadow:none}.sidebar-manager-surface>footer button:hover{background:var(--hover)}@media(max-width:640px){.sidebar-manager-canvas{padding:14px;gap:9px;grid-template-columns:minmax(0,1fr) minmax(150px,1.1fr) minmax(0,1fr)}.sidebar-manager-zone{padding:8px;aspect-ratio:auto;min-height:175px}.sidebar-manager-chip{gap:4px;padding:8px 3px}.sidebar-manager-chip>svg:first-child{display:none}}
.sidebar-manager-embedded{position:relative;display:flex;flex:1;min-height:0;width:100%;max-height:none;margin:0;border:0;border-radius:0;box-shadow:none;overflow:visible;background:transparent}
.sidebar-manager-embedded .sidebar-manager-surface{flex:1;min-width:0;min-height:0;max-height:none}
.sidebar-manager-embedded .sidebar-manager-canvas{flex:1;padding:0;gap:12px;overflow:visible;grid-template-columns:minmax(0,1fr) minmax(0,1.1fr) minmax(0,1fr);grid-template-rows:repeat(2,minmax(0,1fr))}
.sidebar-manager-embedded .sidebar-manager-zone{aspect-ratio:auto;min-height:0;padding:12px;background:var(--panel);border-color:var(--line)}
.sidebar-manager-embedded .sidebar-manager-library{min-height:0;padding:12px;background:var(--panel);border-color:var(--line)}
.sidebar-manager-embedded .sidebar-manager-row{padding:9px 5px;gap:6px;background:var(--paper);border-color:var(--line)}
.sidebar-manager-embedded .sidebar-manager-chip{font-size:11px!important;padding:8px 5px;gap:5px}
.sidebar-manager-embedded .sidebar-manager-library h3{font-size:12px}
.sidebar-manager-embedded .sidebar-manager-library-list:not(:empty){flex:1;min-height:0;overflow:auto}
</style>
