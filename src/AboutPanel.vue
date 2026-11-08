<script setup lang="ts">
import { ref } from 'vue'
import { invoke, isTauri } from '@tauri-apps/api/core'
import appIcon from '../src-tauri/icons/128x128.png'
import packageInfo from '../package.json'
import { t } from './i18n'

const projectUrl = 'https://github.com/Chikomago/Markart'
const licenseUrl = `${projectUrl}/blob/main/LICENSE`
const error = ref('')
defineProps<{ updateVersion: string; updateStatus: string; updateBusy: boolean }>()
const emit = defineEmits<{ check: []; install: [] }>()

async function openLink(url: string) {
  error.value = ''
  try {
    if (isTauri()) await invoke('open_external_url', { url })
    else window.open(url, '_blank', 'noopener,noreferrer')
  } catch (cause) { error.value = t('打开链接失败：{0}', { '0': String(cause) }) }
}
</script>

<template>
  <section class="about-panel">
    <img class="about-icon" :src="appIcon" alt="Markart" width="96" height="96"/>
    <h4>Markart</h4>
    <p class="about-version">{{ packageInfo.version }}</p>
    <dl>
      <div><dt>{{ t('项目地址') }}</dt><dd><button type="button" @click="openLink(projectUrl)">github.com/Chikomago/Markart</button></dd></div>
      <div><dt>{{ t('协议') }}</dt><dd><button type="button" @click="openLink(licenseUrl)">GPL-3.0-only</button></dd></div>
      <div><dt>{{ t('作者') }}</dt><dd>chikomago</dd></div>
    </dl>
    <div v-if="isTauri()" class="about-update">
      <button type="button" :disabled="updateBusy" @click="emit('check')">{{ t('检查更新') }}</button>
      <button v-if="updateVersion" type="button" :disabled="updateBusy" @click="emit('install')">{{ t('更新至') }} {{ updateVersion }}</button>
      <p v-if="updateStatus" role="status">{{ updateStatus }}</p>
    </div>
    <p v-if="error" class="about-error" role="alert">{{ error }}</p>
  </section>
</template>

<style scoped>
.about-panel{display:flex;flex-direction:column;align-items:center;max-width:520px;margin:42px auto;color:var(--ink)}
.about-icon{width:96px;height:96px;object-fit:contain}
.about-panel h4{margin:15px 0 3px;font-size:19px;font-weight:650}
.about-version{margin:0 0 28px;color:var(--muted);font-size:12px}
.about-panel dl{width:100%;margin:0;border-top:1px solid var(--line)}
.about-panel dl>div{display:flex;align-items:center;justify-content:space-between;gap:16px;min-height:44px;border-bottom:1px solid var(--line);font-size:12px}
.about-panel dt{color:var(--muted)}
.about-panel dd{margin:0;text-align:right;overflow-wrap:anywhere}
.about-panel button{padding:2px 0;border:0;background:transparent;color:var(--accent);font:inherit;cursor:pointer}
.about-panel dd button{color:var(--ink)}
.about-panel button:hover{text-decoration:underline}
.about-update{display:flex;align-items:center;justify-content:center;flex-wrap:wrap;gap:8px;margin-top:25px}
.about-update button{padding:7px 12px;border:1px solid var(--line-strong);border-radius:6px;background:var(--paper);color:var(--ink)}
.about-update button:hover{background:var(--hover);text-decoration:none}
.about-update button:disabled{opacity:.55;cursor:default}
.about-update p{flex-basis:100%;margin:3px 0 0;color:var(--muted);font-size:11px;text-align:center}
.about-error{color:var(--danger,#c15454);font-size:12px}
</style>
