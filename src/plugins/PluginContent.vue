<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref, watch } from 'vue'
import type { Dispose } from './host/types'
const props = defineProps<{ mount: (element: HTMLElement) => void | Dispose }>()
const root = ref<HTMLElement | null>(null), error = ref('')
let cleanup: Dispose | undefined, generation = 0
async function clear() { const dispose = cleanup; cleanup = undefined; try { await dispose?.() } catch (reason) { console.error('Plugin content cleanup:', reason) } }
watch(() => props.mount, async mount => {
  const current = ++generation; await clear(); await nextTick()
  if (current !== generation || !root.value) return
  root.value.replaceChildren(); error.value = ''
  try { const dispose = mount(root.value); if (typeof dispose === 'function') cleanup = dispose } catch (reason) { error.value = String(reason) }
}, { immediate: true, flush: 'post' })
onBeforeUnmount(() => { generation++; void clear() })
</script>
<template><div class="plugin-content"><div ref="root" v-show="!error" class="plugin-content-mount"/><p v-if="error" role="alert">{{ error }}</p></div></template>
<style scoped>.plugin-content,.plugin-content-mount{height:100%;min-height:0;min-width:0;overflow:hidden}.plugin-content p{margin:4px;color:var(--ink);overflow-wrap:anywhere}</style>
