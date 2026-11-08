<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { pluginSidebar } from './sidebarState'
import SidebarArea from './ui/SidebarArea.vue'
defineProps<{root?:string}>()
const sidebar = pluginSidebar.state
const shell = ref<HTMLElement>(), draftWidth = ref<number | null>(null), maxWidth = ref(560)
const width = computed(() => Math.min(draftWidth.value ?? sidebar.width, maxWidth.value))
let stopWidthResize: ((commit?: boolean) => void) | undefined
function updateWidthLimit() {
  const parent = shell.value?.parentElement
  if (!parent) return
  const left = parent.querySelector<HTMLElement>('.sidebar')?.offsetWidth || 0
  const minimumEditor = parent.querySelector('.preview-pane') ? 446 : 340
  maxWidth.value = Math.max(220, Math.min(560, parent.clientWidth - left - minimumEditor))
}
function resizeWidth(event: PointerEvent) {
  if (event.button !== 0) return
  event.preventDefault(); stopWidthResize?.(false); updateWidthLimit()
  const start = width.value, x = event.clientX, parent = shell.value?.parentElement
  const scale = parent && parent.clientWidth ? parent.getBoundingClientRect().width / parent.clientWidth : 1
  document.body.classList.add('resizing-panes')
  const move = (next: PointerEvent) => {
    if (next.pointerId !== event.pointerId) return
    draftWidth.value = Math.max(220, Math.min(maxWidth.value, start + (x - next.clientX) / scale))
  }
  const finish = (commit = false) => {
    if (commit && draftWidth.value !== null) pluginSidebar.setWidth(width.value)
    draftWidth.value = null
    window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); window.removeEventListener('pointercancel', cancel); window.removeEventListener('blur', cancel); window.removeEventListener('keydown', key)
    document.body.classList.remove('resizing-panes'); stopWidthResize = undefined
  }
  const up = (next: PointerEvent) => { if (next.pointerId === event.pointerId) finish(true) }
  const cancel = () => finish(false)
  const key = (next: KeyboardEvent) => { if (next.key === 'Escape') { next.preventDefault(); finish(false) } }
  window.addEventListener('pointermove', move); window.addEventListener('pointerup', up); window.addEventListener('pointercancel', cancel); window.addEventListener('blur', cancel); window.addEventListener('keydown', key)
  stopWidthResize = finish
}
function stepWidth(delta: number) { updateWidthLimit(); pluginSidebar.setWidth(Math.max(220, Math.min(maxWidth.value, width.value + delta))) }
const widthObserver = new ResizeObserver(updateWidthLimit)
function syncLayoutWidth() {
  shell.value?.parentElement?.style.setProperty('--right-sidebar-width', `${width.value}px`)
}
watch(width, syncLayoutWidth)
onMounted(() => {
  const parent = shell.value?.parentElement
  if (parent) { widthObserver.observe(parent); const editor = parent.querySelector('.editing-workspace'); if (editor) widthObserver.observe(editor) }
  syncLayoutWidth()
  updateWidthLimit()
})
onBeforeUnmount(()=>{stopWidthResize?.(false);widthObserver.disconnect();shell.value?.parentElement?.style.removeProperty('--right-sidebar-width')})
</script>
<template><div ref="shell" class="plugin-sidebar-shell" :class="{'is-open':sidebar.open}"><div v-if="sidebar.open" class="pane-resizer plugin-sidebar-width-resizer" role="separator" tabindex="0" aria-orientation="vertical" :aria-label="$t('调整侧栏宽度')" :aria-valuenow="Math.round(width)" :aria-valuemin="220" :aria-valuemax="maxWidth" @pointerdown="resizeWidth" @keydown.left.prevent="stepWidth(10)" @keydown.right.prevent="stepWidth(-10)"/><Transition name="right-sidebar"><aside v-if="sidebar.open" id="plugin-sidebar" class="plugin-sidebar" :style="{'--plugin-sidebar-width':`${width}px`}" :aria-label="$t('右侧栏')" @contextmenu="($event.target as HTMLElement).closest('input,textarea,[contenteditable]') || $event.preventDefault()"><header class="plugin-sidebar-header" data-tauri-drag-region="deep"></header><SidebarArea side="right" :root="root"/></aside></Transition></div></template>
<style scoped>.plugin-sidebar-shell{width:calc(var(--right-sidebar-width,280px) * var(--right-sidebar-progress,0));position:relative;flex:none;display:flex;min-height:0;z-index:20}.plugin-sidebar-width-resizer{position:absolute;left:-3px;top:var(--workspace-topbar-height,49px);bottom:0;margin:0}.plugin-sidebar-width-resizer::after{left:3px}.plugin-sidebar{flex:none;width:var(--plugin-sidebar-width,280px);min-width:0;min-height:0;height:100%;box-sizing:border-box;display:flex;flex-direction:column;overflow:hidden;background:var(--paper);color:var(--ink);border-left:1px solid var(--line)}.plugin-sidebar-header{background:var(--tabbar-bg,var(--paper));flex:none;height:var(--workspace-topbar-height,49px);border-bottom:1px solid var(--line)}.right-sidebar-enter-active,.right-sidebar-leave-active{transition:opacity .2s ease-out}.right-sidebar-enter-from,.right-sidebar-leave-to{opacity:0}@media(prefers-reduced-motion:reduce){.right-sidebar-enter-active,.right-sidebar-leave-active{transition:none}}</style>
