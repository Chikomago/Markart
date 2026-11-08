<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch, nextTick } from 'vue'
import { t } from '../i18n'
import SettingSelect from '../settings/SettingSelect.vue'
import { updateSettingValue, validateSettingValue } from './settingControls'
import type { Dispose, PluginSetting } from './host/types'
const props = defineProps<{ setting: PluginSetting }>()
const root = ref<HTMLElement | null>(null), error = ref(''), busy = ref(false), failed = ref(false)
const value = ref<string | number | boolean>('')
const custom = computed(() => !props.setting.type || props.setting.type === 'custom')
const disabled = computed(() => !!props.setting.disabled || busy.value || failed.value)
let cleanup: Dispose | undefined, generation = 0
async function clear() { const dispose = cleanup; cleanup = undefined; try { await dispose?.() } catch (reason) { console.error('Plugin setting cleanup:', reason) } }
async function read(setting: PluginSetting) {
  if ('getValue' in setting) { const next = await setting.getValue(); validateSettingValue(setting, next); value.value = next }
}
watch(() => props.setting, async setting => {
  const current = ++generation; await clear(); await nextTick()
  if (current !== generation) return
  error.value = ''; busy.value = false; failed.value = false
  try {
    if ('mount' in setting && root.value) { root.value.replaceChildren(); const dispose = setting.mount(root.value); if (typeof dispose === 'function') cleanup = dispose }
    else await read(setting)
  } catch (reason) { failed.value = true; error.value = t('插件视图打开失败：{0}', { '0': String(reason) }) }
}, { immediate: true, flush: 'post' })
async function commit(next: string | number | boolean) {
  if (disabled.value) return
  const current = generation, previous = value.value, setting = props.setting
  busy.value = true; error.value = ''; value.value = next
  try { await updateSettingValue(setting, next); if (current === generation) await read(setting) }
  catch (reason) { if (current === generation) { value.value = previous; error.value = String(reason) } }
  finally { if (current === generation) busy.value = false }
}
async function click() {
  if (disabled.value || props.setting.type !== 'button') return
  const current = generation; busy.value = true; error.value = ''
  try { await props.setting.onClick() } catch (reason) { if (current === generation) error.value = String(reason) }
  finally { if (current === generation) busy.value = false }
}
function textChange(event: Event) {
  const input = event.target as HTMLInputElement
  void commit(props.setting.type === 'number' ? (input.value.trim() ? Number(input.value) : NaN) : input.value)
}
onBeforeUnmount(() => { generation++; void clear() })
</script>
<template>
  <div class="setting-row plugin-setting-row" :aria-busy="busy">
    <div class="plugin-setting-label"><div :id="`${setting.id}-label`">{{ setting.title }}</div><p v-if="setting.description">{{ setting.description }}</p></div>
    <fieldset class="plugin-setting-control" :disabled="disabled" :aria-labelledby="`${setting.id}-label`">
      <div v-if="custom" ref="root" role="group" :aria-labelledby="`${setting.id}-label`"/>
      <input v-else-if="setting.type === 'text' || setting.type === 'password'" :type="setting.type" :aria-label="setting.title" :value="value" :placeholder="setting.placeholder" :maxlength="setting.maxLength" @change="textChange"/>
      <textarea v-else-if="setting.type === 'textarea'" :aria-label="setting.title" :value="String(value)" :placeholder="setting.placeholder" :maxlength="setting.maxLength" :rows="setting.rows || 3" @change="textChange"/>
      <input v-else-if="setting.type === 'number'" type="number" :aria-label="setting.title" :value="value" :min="setting.min" :max="setting.max" :step="setting.step || 'any'" @change="textChange"/>
      <input v-else-if="setting.type === 'toggle'" class="plugin-setting-toggle" type="checkbox" role="switch" :aria-label="setting.title" :checked="value === true" @change="commit(($event.target as HTMLInputElement).checked)"/>
      <SettingSelect v-else-if="setting.type === 'select'" :label="setting.title" :model-value="value as string | number" :options="setting.options" :translate="false" @update:model-value="commit"/>
      <div v-else-if="setting.type === 'segmented'" class="setting-segmented" role="group" :aria-label="setting.title"><button v-for="option in setting.options" :key="option.value" type="button" :class="{ active: option.value === value }" :aria-pressed="option.value === value" @click="commit(option.value)">{{ option.label }}</button></div>
      <button v-else-if="setting.type === 'button'" class="plugin-setting-button" type="button" @click="click">{{ setting.buttonText }}</button>
    </fieldset>
    <p v-if="error" class="plugin-setting-error" role="alert">{{ error }}</p>
  </div>
</template>
<style scoped>
.plugin-setting-row{display:flex;align-items:center;gap:16px;flex-wrap:wrap;min-height:52px;padding:12px 0;border-bottom:1px solid var(--line)}
.plugin-setting-label{flex:1;min-width:140px;color:var(--ink)}
.plugin-setting-label p{margin:4px 0 0;color:var(--muted);font-size:12px;line-height:1.5}
.plugin-setting-control{max-width:100%;min-width:0;margin:0;padding:0;border:0;color:var(--ink)}
.plugin-setting-control>input:not([type=checkbox]),.plugin-setting-control>textarea{width:200px;max-width:100%;font:inherit;color:var(--ink);background:var(--paper);border:1px solid var(--line-strong);border-radius:6px;padding:5px 8px;box-sizing:border-box}
.plugin-setting-control>input:not([type=checkbox]){height:30px}.plugin-setting-control>input[type=number]{width:100px}
.plugin-setting-control>textarea{resize:none;height:auto;min-height:64px}
.plugin-setting-control .plugin-setting-toggle{appearance:none;width:30px;height:18px;margin:0;border:1px solid var(--line-strong);border-radius:10px;background:var(--muted);cursor:pointer;position:relative}
.plugin-setting-toggle::before{content:'';position:absolute;width:12px;height:12px;left:2px;top:2px;border-radius:50%;background:var(--paper)}
.plugin-setting-control .plugin-setting-toggle:checked{background:var(--accent)}.plugin-setting-toggle:checked::before{transform:translateX(12px)}
.plugin-setting-button{height:30px;padding:0 12px;border:1px solid var(--line);border-radius:6px;background:var(--paper);color:var(--ink);font:inherit;cursor:pointer}
.plugin-setting-control:disabled{opacity:.55}.plugin-setting-error{flex-basis:100%;margin:0;color:var(--ink)}
</style>
