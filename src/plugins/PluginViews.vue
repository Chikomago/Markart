<script setup lang="ts">
import { t } from '../i18n'

import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { pluginRuntime } from './runtime'
import type { Dispose, PluginViewLocation } from './host/types'
const props = defineProps<{ location: PluginViewLocation }>()
const views = computed(() => pluginRuntime.state.views.filter(view => (view.location || 'right') === props.location))
const selected = ref(''), root = ref<HTMLElement | null>(null)
const currentView = computed(() => views.value.find(item => item.id === selected.value) || (!['settings'].includes(props.location) ? views.value[0] : undefined))
let cleanup: Dispose | undefined, generation = 0
function report(error: unknown) { console.error('Plugin view:', error) }
async function clear() { const previous = cleanup; cleanup = undefined; try { await previous?.() } catch (error) { report(error) } }
watch(currentView, async view => {
  const current = ++generation; await clear(); await nextTick()
  if (current !== generation || !root.value) return
  root.value.replaceChildren()
  if (!view) { selected.value = ''; return }
  try { const dispose = view.mount(root.value); if (typeof dispose === 'function') cleanup = dispose } catch (error) { root.value.textContent = t('插件视图打开失败：{0}', { '0': String(error) }) }
}, { flush: 'post', immediate: true })
onBeforeUnmount(() => { generation++; void clear() })
</script>
<template>
  <section v-if="views.length" class="plugin-views" :data-location="location"><nav :aria-label="$t('插件面板')"><button v-for="view in views" :key="view.id" :aria-pressed="currentView?.id === view.id" @click="selected = ['settings'].includes(location) && selected === view.id ? '' : view.id">{{ view.title }}</button></nav><div v-show="currentView" ref="root" class="plugin-view-content"/></section>
</template>
<style scoped>
nav{display:flex;gap:8px;flex-wrap:wrap}button{font:inherit;color:var(--ink);background:var(--paper);border:1px solid var(--line);padding:5px 10px;border-radius:5px;cursor:pointer}button[aria-pressed=true]{background:var(--accent-soft)}.plugin-view-content{padding:16px;max-height:360px;overflow:auto;border-top:1px solid var(--line);margin-top:8px}
</style>
