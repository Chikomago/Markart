<script setup lang="ts">
import { ref } from 'vue'
import { MoreHorizontal, Plus, ArrowRight, X } from 'lucide-vue-next'
defineProps<{ id: string; label: string; panels: string[]; active: string; titles: Record<string, string>; regions: { id: string; label: string }[]; available: string[] }>()
const emit = defineEmits<{ select: [id: string]; move: [panel: string, target: string]; close: [panel: string]; add: [panel: string] }>()
const menu = ref(false), adding = ref(false)
function dismiss(event: FocusEvent) { if (!(event.currentTarget as HTMLElement).contains(event.relatedTarget as Node)) { menu.value = adding.value = false } }
</script>
<template>
  <section class="preview-dock-region" :aria-label="label" @keydown.esc="menu = adding = false" @focusout="dismiss">
    <header class="preview-region-heading">
      <div class="preview-region-switches" role="tablist" :aria-label="`${label}面板`">
        <button v-for="panel in panels" :key="panel" role="tab" :aria-selected="active === panel" :class="{active:active === panel}" @click="emit('select',panel)">{{ titles[panel] }}</button>
      </div>
    </header>
    <div class="preview-region-content"><slot v-if="active"/><div v-else class="preview-empty"><p>在“管理侧栏”中添加面板</p></div></div>
  </section>
</template>
