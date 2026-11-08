<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch, type Component } from 'vue'
import { NotebookPen, Check } from 'lucide-vue-next'
const props=defineProps<{active:(id:string)=>boolean;icon:(id:string)=>Component;titleFor:(id:string)=>string;run:(event:MouseEvent,id:string)=>void}>()
const ids=['readOnly','focus','typewriter'] as const
const labels={readOnly:'只读模式',focus:'专注模式',typewriter:'打字机模式'}
type Mode = typeof ids[number]
const enabledModes=computed(()=>ids.filter(id=>props.active(id)))
const activationOrder=ref<Mode[]>([])
watch(enabledModes,(active,previous=[])=>{
 activationOrder.value=[...activationOrder.value.filter(id=>active.includes(id)),...active.filter(id=>!previous.includes(id))]
},{immediate:true})
const selectedMode=computed(()=>activationOrder.value.at(-1))
const triggerIcon=computed(()=>selectedMode.value?props.icon(selectedMode.value):NotebookPen)
const enabled=computed(()=>enabledModes.value.length>0)
const open=ref(false),trigger=ref<HTMLElement>(),menu=ref<HTMLElement>(),position=ref({left:'0px',top:'0px'})
function dismiss(event:Event){
 if(event instanceof KeyboardEvent){if(event.key==='Escape'&&open.value){open.value=false;trigger.value?.focus()}return}
 if(event.target instanceof Node&&!trigger.value?.contains(event.target)&&!menu.value?.contains(event.target))open.value=false
}
async function toggle(){
 open.value=!open.value;if(!open.value)return
 await nextTick();const anchor=trigger.value!.getBoundingClientRect(),shell=trigger.value!.closest('.app-shell'),scale=shell?parseFloat(getComputedStyle(shell).zoom)||1:1
 position.value={left:`${Math.max(8,Math.min(anchor.right/scale-180,innerWidth/scale-188))}px`,top:`${Math.max(8,anchor.top/scale-(menu.value?.offsetHeight||110)-7)}px`}
}
onMounted(()=>{document.addEventListener('pointerdown',dismiss);document.addEventListener('keydown',dismiss)})
onBeforeUnmount(()=>{document.removeEventListener('pointerdown',dismiss);document.removeEventListener('keydown',dismiss)})
</script>
<template>
<button ref="trigger" class="writing-mode-trigger" :class="{active:enabled}" :title="enabledModes.length ? enabledModes.map(id=>$t(labels[id])).join(' · ') : $t('写作模式')" :aria-label="$t('写作模式')" :aria-expanded="open" aria-haspopup="menu" @mousedown.prevent @click="toggle"><component :is="triggerIcon" :size="14"/></button>
<Teleport defer to=".app-shell"><div v-if="open" ref="menu" class="writing-mode-menu" role="menu" :aria-label="$t('写作模式')" :style="position"><button v-for="id in ids" :key="id" role="menuitemcheckbox" :aria-checked="active(id)" :title="titleFor(id)" @mousedown.prevent @click="run($event,id)"><component :is="icon(id)" :size="14"/><span>{{$t(labels[id])}}</span><Check v-if="active(id)" :size="13"/></button></div></Teleport>
</template>
<style scoped>
.writing-mode-trigger{display:flex;align-items:center;justify-content:center;width:24px;height:24px;padding:0;border:0;border-radius:5px;background:none;color:var(--muted);cursor:pointer}.writing-mode-trigger:hover{background:var(--hover);color:var(--ink)}.writing-mode-trigger.active{color:var(--accent);background:var(--accent-soft)}.writing-mode-menu{position:fixed;z-index:90;width:180px;padding:5px;border:1px solid var(--line-strong);border-radius:8px;background:var(--paper);box-shadow:var(--shadow)}.writing-mode-menu button{display:flex;align-items:center;gap:9px;width:100%;height:32px;padding:0 9px;border:0;border-radius:5px;background:none;color:var(--ink);font:inherit;font-size:12px;text-align:left;cursor:pointer}.writing-mode-menu button span{flex:1}.writing-mode-menu button:hover{background:var(--hover)}.writing-mode-trigger:focus-visible,.writing-mode-menu button:focus-visible{outline:2px solid var(--accent);outline-offset:1px}
</style>
