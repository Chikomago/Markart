<script setup lang="ts">
import { onBeforeUnmount, ref } from 'vue'
import { t } from '../i18n'
import { eventChord, formatChord } from '../settings/shortcuts'
import { pluginRuntime } from './runtime'
const props = defineProps<{ prepare?: () => Promise<void>; finish?: () => Promise<void> }>()
let mounted = true
function finish() { recording.value = ''; void props.finish?.() }
const recording = ref(''), error = ref('')
function record(event: KeyboardEvent) {
  if (!recording.value) return
  event.preventDefault(); event.stopImmediatePropagation()
  if (event.key === 'Escape') { finish(); return }
  const chord = eventChord(event); if (!chord) return
  try { pluginRuntime.setShortcut(recording.value, chord); finish(); error.value = '' } catch (reason) { error.value = String(reason) }
}
async function start(id: string) { try { await props.prepare?.(); if (mounted) { recording.value = id; error.value = '' } else void props.finish?.() } catch (reason) { error.value = String(reason) } }
function clear(id: string) { try { pluginRuntime.setShortcut(id, ''); error.value = '' } catch (reason) { error.value = String(reason) } }
window.addEventListener('keydown', record, true)
onBeforeUnmount(() => { mounted = false; window.removeEventListener('keydown', record, true); if (recording.value) finish() })
</script>
<template><section v-if="pluginRuntime.state.commands.length" class="shortcut-group"><h4>{{ t('插件') }}</h4><div class="shortcut-list"><div v-for="command in pluginRuntime.state.commands" :key="command.id" class="shortcut-row"><span>{{ command.title }}</span><div class="shortcut-actions"><button class="shortcut-record" :class="{ recording: recording === command.id }" @click="start(command.id)">{{ recording === command.id ? t('请按组合键…') : formatChord(pluginRuntime.assignedShortcut(command.id)) || t('未设置') }}</button><button class="shortcut-action" :disabled="!pluginRuntime.assignedShortcut(command.id)" @click="clear(command.id)">{{ t('清除') }}</button></div></div></div><p v-if="error" role="alert">{{ error }}</p></section></template>
