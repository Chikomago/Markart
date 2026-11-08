<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { X } from 'lucide-vue-next'
import { pluginRuntime } from './runtime'
import PluginContent from './PluginContent.vue'
import type { PluginDialog, PluginActionContext } from './host/types'
const props = defineProps<{ dialog: PluginDialog & { id: string; context: PluginActionContext }; top: boolean }>()
const contentHeight = ref<number | null>(null)
const contentWidth = ref<number | null>(null)
let initialBoundsFocused = false
function contentBounds(event: Event) {
  const value=(event as CustomEvent).detail
  if(!props.dialog.webview || !Number.isFinite(value?.height))return
  contentWidth.value=value.expanded || !Number.isFinite(value.width) ? null : Math.max(240,value.width)
  contentHeight.value=value.expanded ? null : Math.max(40,value.height)
  if(!initialBoundsFocused){
    initialBoundsFocused=true
    void nextTick(()=>{const iframe=frame.value?.querySelector('iframe');iframe?.focus();iframe?.contentWindow?.postMessage({type:'markart-web-focus'},'*')})
  }
}
const viewport = ref({ width: window.innerWidth, height: window.innerHeight })
function resize() { viewport.value = { width: window.innerWidth, height: window.innerHeight } }
const frame = ref<HTMLElement | null>(null), previous = document.activeElement as HTMLElement | null
const mount = (element: HTMLElement) => props.dialog.mount(element, props.dialog.context)
const popover = computed(() => props.dialog.mode === 'popover')
const style = computed(() => {
  const scale = props.dialog.webview ? 1 : Number.parseFloat(getComputedStyle(document.querySelector('.app-shell')!).zoom) || 1
  const width = Math.min(props.dialog.width || (popover.value ? 320 : 480), viewport.value.width / scale - 24)
  if (props.dialog.webview) {
    const width = Math.min(contentWidth.value ?? props.dialog.width ?? 680,viewport.value.width-24)
    const view = props.dialog.webview, baseHeight = Math.min(view.height, viewport.value.height / scale - 24), height = Math.min(contentHeight.value ?? baseHeight,baseHeight)
    return {width: `${width}px`,height: `${height}px`,position:'fixed' as const,left:`${Math.max(12,Math.min(view.x ?? (viewport.value.width / scale-width)/2,viewport.value.width / scale-width-12))}px`,top:`${Math.max(12,Math.min((view.y ?? (viewport.value.height / scale-baseHeight)/2) + baseHeight-height,viewport.value.height / scale-height-12))}px`}
  }
  const anchor = props.dialog.context.anchor
  const top = Math.max(12, Math.min((anchor?.bottom || 60) / scale + 6, viewport.value.height / scale - 180))
  return { width: `${width}px`, ...(popover.value ? { position: 'fixed' as const, left: `${Math.max(12, Math.min((anchor?.right || window.innerWidth / 2) / scale - width, viewport.value.width / scale - width - 12))}px`, top: `${top}px`, maxHeight: `${Math.max(0, viewport.value.height / scale - top - 12)}px` } : {}) }
})
function close() { pluginRuntime.closeDialog(props.dialog.id) }
function onBackdrop() { if (!props.dialog.persistent) close() }
function key(event: KeyboardEvent) {
  if (!props.top) return
  if (event.key === 'Escape') { event.preventDefault(); event.stopImmediatePropagation(); if(props.dialog.webview)frame.value?.querySelector('iframe')?.contentWindow?.postMessage({type:'markart-web-escape'},'*');else close() }
  if (event.key === 'Tab' && !props.dialog.webview) {
    const nodes = [...(frame.value?.querySelectorAll<HTMLElement>('button:not(:disabled),input:not(:disabled),textarea:not(:disabled),select:not(:disabled),[tabindex="0"]') || [])].filter(node => node.getClientRects().length)
    const index = nodes.indexOf(document.activeElement as HTMLElement), next = event.shiftKey ? (index <= 0 ? nodes.length - 1 : index - 1) : (index + 1) % nodes.length
    event.preventDefault(); event.stopImmediatePropagation(); (nodes[next] || frame.value)?.focus()
  }
}
onMounted(async () => { window.addEventListener('resize', resize); window.addEventListener('keydown', key, true); await nextTick(); if(!props.dialog.webview)frame.value?.focus() })
onBeforeUnmount(() => { window.removeEventListener('resize', resize); window.removeEventListener('keydown', key, true); if (previous?.isConnected) previous.focus({ preventScroll: true }) })
</script>
<template><Teleport to="body" :disabled="!dialog.webview"><div class="plugin-dialog-backdrop" :inert="!top ? true : undefined" :class="{ 'plugin-popover-backdrop': popover, 'plugin-webview-backdrop': dialog.webview }" @pointerdown.self="onBackdrop"><section ref="frame" class="plugin-dialog-frame" @plugin-webview-height="contentBounds" :class="{'plugin-webview-frame': dialog.webview, 'plugin-webview-transparent': dialog.webview?.transparent, 'plugin-webview-compact': dialog.webview?.transparent && contentHeight !== null && contentWidth !== null, 'plugin-webview-compact-card': contentHeight !== null && contentHeight > 70, 'plugin-webview-shadow-soft': dialog.webview?.shadow === 'soft' && (!dialog.webview.transparent || contentHeight !== null && contentHeight <= 70), 'plugin-webview-shadow-floating': dialog.webview?.shadow === 'floating' && (!dialog.webview.transparent || contentHeight !== null && contentHeight <= 70)}" :style="style" role="dialog" :aria-modal="dialog.webview ? false : true" :aria-label="dialog.title" tabindex="-1"><header v-if="!dialog.webview"><strong>{{ dialog.title }}</strong><button type="button" :aria-label="$t('关闭')" @click="close"><X :size="16"/></button></header><div class="plugin-dialog-body"><PluginContent :mount="mount"/></div></section></div></Teleport></template>
<style scoped>.plugin-dialog-backdrop{position:absolute;inset:0;z-index:120;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.2);padding:12px}.plugin-popover-backdrop{background:transparent}.plugin-dialog-frame{max-width:100%;max-height:80%;display:flex;flex-direction:column;overflow:hidden;border:1px solid var(--line);border-radius:9px;background:var(--paper);color:var(--ink);box-shadow:var(--shadow);outline:none;animation:plugin-dialog-appear .18s ease-out}.plugin-dialog-frame header{flex:none;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:10px 12px;border-bottom:1px solid var(--line);font-size:13px}.plugin-dialog-frame header button{border:0;background:transparent;color:var(--muted);display:grid;place-items:center;width:24px;height:24px;cursor:pointer}.plugin-dialog-body{min-height:0;overflow:auto;padding:12px}.plugin-dialog-body :deep(.plugin-content){height:auto}.plugin-dialog-body :deep(.plugin-content-mount){height:auto}@keyframes plugin-dialog-appear{from{opacity:0;transform:translateY(8px) scale(.98)}to{opacity:1;transform:translateY(0) scale(1)}}@media(prefers-reduced-motion:reduce){.plugin-dialog-frame{animation:none}}.plugin-webview-frame{box-shadow:none;max-height:calc(100% - 24px);border:0;border-radius:0}.plugin-webview-frame .plugin-dialog-body{padding:0;flex:1;overflow:hidden}.plugin-webview-frame .plugin-dialog-body :deep(.plugin-content),.plugin-webview-frame .plugin-dialog-body :deep(.plugin-content-mount){height:100%}.plugin-webview-transparent{background:transparent;box-shadow:none;pointer-events:none!important}.plugin-webview-backdrop{position:fixed;zoom:1;box-sizing:border-box;background:transparent;pointer-events:none}.plugin-webview-backdrop .plugin-dialog-frame{pointer-events:auto}.plugin-webview-backdrop .plugin-dialog-frame{color:var(--ink,#303641);background:var(--paper,#fff)}.plugin-webview-backdrop .plugin-webview-transparent{background:transparent}.plugin-webview-compact{border-radius:999px}.plugin-webview-shadow-soft{box-shadow:0 1px 3px rgba(0,0,0,.06),0 3px 8px rgba(0,0,0,.08)!important}.plugin-webview-shadow-floating{box-shadow:0 4px 10px rgba(0,0,0,.12),0 16px 40px rgba(0,0,0,.24)!important}.plugin-webview-compact.plugin-webview-compact-card{border-radius:0}</style>
