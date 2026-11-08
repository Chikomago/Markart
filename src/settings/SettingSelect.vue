<script setup lang="ts">
import { t } from '../i18n'
import { computed, nextTick, onBeforeUnmount, ref } from 'vue'
import { Check, ChevronDown } from 'lucide-vue-next'
type Value = string | number
type Option = { value: Value; label: string }
const props = withDefaults(defineProps<{ modelValue: Value; options: Option[]; label: string; translate?: boolean }>(), { translate: true })
const optionLabel = (label: string) => props.translate ? t(label) : label
const emit = defineEmits<{ 'update:modelValue': [value: Value]; preview: [value: Value | null] }>()
const opened = ref(false), active = ref(0)
const trigger = ref<HTMLElement | null>(null), panel = ref<HTMLElement | null>(null)
const position = ref({ left: 0, top: 0, width: 160, maxHeight: 280 })
const current = computed(() => optionLabel(props.options.find(item => item.value === props.modelValue)?.label || String(props.modelValue)))
function close(focus = false) {
  opened.value = false
  emit('preview', null)
  window.removeEventListener('pointerdown', outside, true); window.removeEventListener('scroll', scroll, true); window.removeEventListener('resize', dismiss)
  if (focus) trigger.value?.focus({ preventScroll: true })
}
function dismiss() { close() }
function outside(event: Event) { const node = event.target as Node; if (!trigger.value?.contains(node) && !panel.value?.contains(node)) close() }
function scroll(event: Event) {
  // Only moving the trigger's own container dismisses the menu. Editor preview
  // measurements may scroll unrelated panes while an option is being previewed.
  const container = event.target
  if (container instanceof Element && trigger.value && container.contains(trigger.value) && !panel.value?.contains(container)) close()
}
async function focusOption() { await nextTick(); const item = panel.value?.querySelector<HTMLElement>('[tabindex="0"]'); item?.focus({ preventScroll: true }); if (item && panel.value) { const top = item.offsetTop, bottom = top + item.offsetHeight; if (top < panel.value.scrollTop) panel.value.scrollTop = top; else if (bottom > panel.value.scrollTop + panel.value.clientHeight) panel.value.scrollTop = bottom - panel.value.clientHeight } }
async function toggle() {
  if (opened.value) { close(); return }
  const rect = trigger.value!.getBoundingClientRect(), shell = trigger.value!.closest('.app-shell')!
  const scale = Number.parseFloat(getComputedStyle(shell).zoom) || 1
  const measure = document.createElement('canvas').getContext('2d')
  if (measure) measure.font = getComputedStyle(trigger.value!).font
  const textWidth = Math.max(0, ...props.options.map(option => measure?.measureText(optionLabel(option.label)).width || 0))
  const width = Math.min(window.innerWidth / scale - 16, Math.max(160, rect.width / scale, textWidth + 48))
  const height = Math.min(280, props.options.length * 34 + 12, window.innerHeight / scale - 16)
  const below = window.innerHeight / scale - rect.bottom / scale - 8
  position.value = { left: Math.max(8, Math.min(rect.right / scale - width, window.innerWidth / scale - width - 8)), top: below >= height ? rect.bottom / scale + 4 : Math.max(8, rect.top / scale - height - 4), width, maxHeight: height }
  active.value = Math.max(0, props.options.findIndex(item => item.value === props.modelValue))
  opened.value = true
  window.addEventListener('pointerdown', outside, true); window.addEventListener('scroll', scroll, true); window.addEventListener('resize', dismiss)
  await focusOption()
}
function choose(value: Value) { emit('update:modelValue', value); close(true) }
async function key(event: KeyboardEvent) {
  if (event.key === 'Tab') { close(true); return }
  if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); close(true); return }
  if (!['ArrowDown', 'ArrowUp', 'Home', 'End', 'Enter', ' '].includes(event.key)) return
  event.preventDefault(); event.stopPropagation()
  if (!opened.value) { await toggle(); return }
  if (!props.options.length) return
  if (event.key === 'Enter' || event.key === ' ') { choose(props.options[active.value].value); return }
  active.value = event.key === 'Home' ? 0 : event.key === 'End' ? props.options.length - 1 : (active.value + (event.key === 'ArrowDown' ? 1 : -1) + props.options.length) % props.options.length
  emit('preview', props.options[active.value].value)
  await focusOption()
}
onBeforeUnmount(() => close())
</script>

<template>
  <button ref="trigger" type="button" class="setting-select-trigger" :aria-label="`${label}：${current}`" aria-haspopup="listbox" :aria-expanded="opened" @click="toggle" @keydown="key"><span>{{ current }}</span><ChevronDown :size="14"/></button>
  <Teleport defer to=".app-shell"><div v-if="opened" ref="panel" class="setting-select-menu" role="listbox" :aria-label="label" @mouseleave="emit('preview', null)" :style="{ left: `${position.left}px`, top: `${position.top}px`, width: `${position.width}px`, maxHeight: `${position.maxHeight}px` }" @keydown="key"><button v-for="(option, index) in options" :key="option.value" type="button" role="option" :aria-selected="modelValue === option.value" :tabindex="active === index ? 0 : -1" :class="{ selected: modelValue === option.value }" @mouseenter="active = index; emit('preview', option.value)" @click="choose(option.value)"><span>{{ optionLabel(option.label) }}</span><Check v-if="modelValue === option.value" :size="14"/></button></div></Teleport>
</template>
