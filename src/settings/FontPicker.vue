<script setup lang="ts">
import { t } from '../i18n'

import { computed, nextTick, onBeforeUnmount, ref } from 'vue'
import { Check, ChevronDown, Search } from 'lucide-vue-next'
const props = withDefaults(defineProps<{ modelValue: string; fonts: string[]; label: string; defaultValue?: string; loading?: boolean }>(), { defaultValue: 'system-ui' })
const emit = defineEmits<{ 'update:modelValue': [value: string]; preview: [value: string | null]; open: [] }>()
const opened = ref(false), query = ref(''), hovered = ref<string | null>(null), active = ref(0)
const trigger = ref<HTMLElement | null>(null), panel = ref<HTMLElement | null>(null), search = ref<HTMLInputElement | null>(null)
const position = ref({ left: 0, top: 0, maxHeight: 300 })
const menuFontFamily = ref('system-ui')
const defaults = computed(() => [{ value: props.defaultValue, get label() { return t('系统默认') } }, { value: 'ui-monospace', get label() { return t('等宽字体') } }])
const options = computed(() => [...defaults.value, ...[...new Set([props.modelValue, ...props.fonts])].filter(value => value && !defaults.value.some(item => item.value === value)).map(value => ({ value, label: value }))].filter(item => item.label.toLowerCase().includes(query.value.trim().toLowerCase())))
const displayName = computed(() => defaults.value.find(item => item.value === props.modelValue)?.label || props.modelValue)
const previewFont = computed(() => hovered.value || props.modelValue)
function cssFont(value: string) { return ['system-ui', '-apple-system', 'ui-monospace'].includes(value) ? value : `${JSON.stringify(value)}, system-ui` }
function preview(value: string | null) { hovered.value = value; emit('preview', value) }
function close() { opened.value = false; preview(null); window.removeEventListener('pointerdown', outside, true); window.removeEventListener('scroll', scroll, true); window.removeEventListener('resize', close) }
function outside(event: Event) { const target = event.target as Node; if (!trigger.value?.contains(target) && !panel.value?.contains(target)) close() }
function scroll(event: Event) {
  // Only moving the trigger's own container dismisses the menu. Editor preview
  // measurements may scroll unrelated panes while an option is being previewed.
  const container = event.target
  if (container instanceof Element && trigger.value && container.contains(trigger.value) && !panel.value?.contains(container)) close()
}
async function toggle() {
  if (opened.value) { close(); return }
  emit('open'); query.value = ''; active.value = 0
  const rect = trigger.value!.getBoundingClientRect(), shell = trigger.value!.closest('.app-shell')!
  menuFontFamily.value = getComputedStyle(shell).fontFamily
  const scale = Number.parseFloat(getComputedStyle(shell).zoom) || 1
  const height = Math.min(300, window.innerHeight / scale - 24)
  const below = window.innerHeight / scale - rect.bottom / scale - 8
  position.value = { left: Math.max(8, Math.min(rect.right / scale - 300, window.innerWidth / scale - 308)), top: below >= height ? rect.bottom / scale + 4 : Math.max(8, rect.top / scale - height - 4), maxHeight: height }
  opened.value = true
  window.addEventListener('pointerdown', outside, true); window.addEventListener('scroll', scroll, true); window.addEventListener('resize', close)
  await nextTick(); search.value?.focus({ preventScroll: true })
}
function choose(value: string) { emit('update:modelValue', value); close(); trigger.value?.focus({ preventScroll: true }) }
async function key(event: KeyboardEvent) {
  if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); close(); trigger.value?.focus({ preventScroll: true }); return }
  if (!['ArrowDown', 'ArrowUp', 'Enter'].includes(event.key) || !options.value.length) return
  event.preventDefault(); event.stopPropagation()
  if (event.key === 'Enter') { choose(options.value[active.value]?.value || options.value[0].value); return }
  active.value = (active.value + (event.key === 'ArrowDown' ? 1 : -1) + options.value.length) % options.value.length
  preview(options.value[active.value].value)
  await nextTick(); const item = panel.value?.querySelector<HTMLElement>('[data-active="true"]'), list = item?.parentElement; if (item && list) { const top = item.getBoundingClientRect().top - list.getBoundingClientRect().top + list.scrollTop; if (top < list.scrollTop) list.scrollTop = top; else if (top + item.offsetHeight > list.scrollTop + list.clientHeight) list.scrollTop = top + item.offsetHeight - list.clientHeight }
}
onBeforeUnmount(close)
</script>

<template>
  <div class="font-picker-setting">
    <div class="setting-row font-setting"><span class="setting-row-title">{{ label }}</span><button ref="trigger" class="setting-select-trigger font-picker-trigger" type="button" :aria-label="label" aria-haspopup="listbox" :aria-expanded="opened" @click="toggle"><span>{{ displayName }}</span><ChevronDown :size="14"/></button></div>
    <div v-if="$slots.preview" class="font-picker-custom-preview" :style="{ fontFamily: cssFont(previewFont) }"><slot name="preview"/></div>
    <div v-else class="font-picker-preview" :style="{ fontFamily: cssFont(previewFont) }" :aria-label="$t('字体预览')"><div>{{ $t('文字预览，让阅读更舒适。') }}</div><div>The quick brown fox · 0123456789</div></div>
    <Teleport defer to=".app-shell"><div v-if="opened" ref="panel" class="setting-select-menu font-picker-popover" :style="{ left: `${position.left}px`, top: `${position.top}px`, maxHeight: `${position.maxHeight}px`, fontFamily: menuFontFamily }" @keydown="key"><div class="font-picker-search"><Search :size="14"/><input ref="search" v-model="query" :placeholder="$t('搜索字体')" :aria-label="`搜索${label}`" @input="active = 0; preview(null)"/></div><div class="font-picker-options" role="listbox" :aria-label="label" @mouseleave="preview(null)"><button v-for="(item, index) in options" :key="item.value" type="button" role="option" :aria-selected="modelValue === item.value" :data-active="active === index" :class="{ active: hovered === item.value, selected: modelValue === item.value }" @mouseenter="active = index; preview(item.value)" @click="choose(item.value)"><span>{{ $t(item.label) }}</span><Check v-if="modelValue === item.value" :size="14"/></button><div v-if="!options.length" class="font-picker-empty">{{ $t('未找到匹配字体') }}</div><div v-if="loading" class="font-picker-empty">{{ $t('正在读取本机字体…') }}</div></div></div></Teleport>
  </div>
</template>
