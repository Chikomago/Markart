<script setup lang="ts">
import { ref, nextTick, onMounted, onBeforeUnmount, watch } from 'vue'
import { Eye, Code2, Columns2, Check } from 'lucide-vue-next'
const props = defineProps<{ mode: string; markdownActive: boolean; setMode: (mode: 'wysiwyg' | 'source' | 'split') => void }>()
const open = ref(false), trigger = ref<HTMLElement>(), menu = ref<HTMLElement>()
const position = ref({ left: '0px', top: '0px' })
const items = [{ value: 'wysiwyg', label: '所见即所得', icon: Eye }, { value: 'source', label: '源代码', icon: Code2 }, { value: 'split', label: '分栏', icon: Columns2 }] as const
function dismiss(event: Event) {
  if (event instanceof KeyboardEvent) { if (event.key === 'Escape') open.value = false; return }
  if (event.target instanceof Node && !trigger.value?.contains(event.target) && !menu.value?.contains(event.target)) open.value = false
}
async function toggle() {
  open.value = !open.value
  if (!open.value) return
  await nextTick()
  const anchor = trigger.value!.getBoundingClientRect(), shell = trigger.value!.closest('.app-shell')!
  const scale = parseFloat(getComputedStyle(shell).zoom) || 1
  position.value = { left: `${Math.max(8, (anchor.right / scale) - 170)}px`, top: `${Math.max(8, anchor.top / scale - (menu.value?.offsetHeight || 110) - 7)}px` }
}
watch(() => props.mode, () => { open.value = false })
onMounted(() => { document.addEventListener('pointerdown', dismiss); document.addEventListener('keydown', dismiss) })
onBeforeUnmount(() => { document.removeEventListener('pointerdown', dismiss); document.removeEventListener('keydown', dismiss) })
</script>
<template>
<button ref="trigger" type="button" class="status-view-mode" :title="$t('编辑视图')" :aria-label="$t('编辑视图')" :aria-expanded="open" aria-haspopup="menu" @click="toggle"><Eye v-if="mode === 'wysiwyg'" :size="14"/><Code2 v-else-if="mode === 'source'" :size="14"/><Columns2 v-else :size="14"/></button>
<Teleport defer to=".app-shell"><div v-if="open" ref="menu" class="status-view-menu" :style="position" role="menu" :aria-label="$t('编辑视图')"><button v-for="item in items" :key="item.value" role="menuitemradio" :aria-checked="mode === item.value" :disabled="!markdownActive && item.value !== 'source'" @click="setMode(item.value); open = false"><component :is="item.icon" :size="15"/><span>{{ $t(item.label) }}</span><Check v-if="mode === item.value" :size="13"/></button></div></Teleport>
</template>
<style scoped>
.status-view-mode{display:flex;align-items:center;justify-content:center;width:24px;height:24px;padding:0;border:0;border-radius:5px;background:transparent;color:var(--muted);cursor:pointer}
.status-view-mode:hover{background:var(--hover);color:var(--ink)}
.status-view-menu{position:fixed;z-index:90;width:170px;padding:5px;border:1px solid var(--line-strong);border-radius:8px;background:var(--paper);box-shadow:var(--shadow)}
.status-view-menu button{display:flex;align-items:center;gap:9px;width:100%;height:32px;padding:0 9px;border:0;border-radius:5px;background:transparent;color:var(--ink);font:inherit;font-size:12px;text-align:left}
.status-view-menu button span{flex:1}.status-view-menu button:hover:not(:disabled){background:var(--hover)}.status-view-menu button:disabled{opacity:.4}
</style>
