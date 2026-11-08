<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import SidebarGroup from './SidebarGroup.vue'
import { sidebarLayout, type SidebarSide } from './sidebarLayout'
import { groupItems } from './sidebarRegistry'
const props=defineProps<{side:SidebarSide;root?:string}>(),area=ref<HTMLElement>()
const groups=computed(()=>{const candidates=sidebarLayout.state.groups.filter(group=>group.slot.startsWith(props.side)),occupied=candidates.filter(group=>groupItems(group).length);return occupied.length?occupied:[candidates[0]]})
const rows=computed(()=>groups.value.length===1?'minmax(0,1fr)':`minmax(0,${sidebarLayout.state.ratios[props.side]}fr) 1px minmax(0,${1-sidebarLayout.state.ratios[props.side]}fr)`)
let stop:(()=>void)|undefined
function resize(event:PointerEvent){if(event.button!==0||!area.value)return;event.preventDefault();stop?.();const rect=area.value.getBoundingClientRect()
 const move=(next:PointerEvent)=>{if(next.pointerId===event.pointerId)sidebarLayout.setRatio(props.side,(next.clientY-rect.top-6)/Math.max(1,rect.height-6))}
 const finish=()=>{window.removeEventListener('pointermove',move);window.removeEventListener('pointerup',up);window.removeEventListener('pointercancel',finish);window.removeEventListener('blur',finish);document.body.classList.remove('resizing-outline');stop=undefined}
 const up=(next:PointerEvent)=>{if(next.pointerId===event.pointerId)finish()};window.addEventListener('pointermove',move);window.addEventListener('pointerup',up);window.addEventListener('pointercancel',finish);window.addEventListener('blur',finish);document.body.classList.add('resizing-outline');stop=finish
}
onBeforeUnmount(()=>stop?.())
</script>
<template><div ref="area" class="dock-side" :style="{gridTemplateRows:rows}"><template v-for="(group,index) in groups" :key="group.id"><div v-if="index" class="dock-height-resizer" role="separator" tabindex="0" aria-orientation="horizontal" :aria-label="$t('调整面板高度')" :aria-valuenow="Math.round(sidebarLayout.state.ratios[side]*100)" :aria-valuemin="15" :aria-valuemax="85" @pointerdown="resize" @keydown.up.prevent="sidebarLayout.setRatio(side,sidebarLayout.state.ratios[side]-.03)" @keydown.down.prevent="sidebarLayout.setRatio(side,sidebarLayout.state.ratios[side]+.03)"/><SidebarGroup :group="group" :root="root"/></template></div></template>
<style>.dock-side{display:grid;flex:1;min-height:0;min-width:0;overflow:hidden;padding-top:6px;box-sizing:border-box}.dock-height-resizer+.dock-region{padding-top:6px;box-sizing:border-box}.dock-height-resizer{position:relative;z-index:2;background:var(--line);cursor:row-resize}.dock-height-resizer:before{content:'';position:absolute;inset:-3px 0}.dock-height-resizer:hover{background:var(--line-strong)}.dock-height-resizer:focus-visible{outline:1px solid var(--accent)}</style>
