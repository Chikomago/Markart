<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import PdfPreview from './PdfPreview.vue'
import type { ExportArtifact, ExportDimensions } from './exportPreview'
const props = defineProps<{ artifact: ExportArtifact; active: boolean }>()
const emit = defineEmits<{ ready: []; dimensions: [value: ExportDimensions]; error: [message: string]; close: [] }>()
const frame = ref<HTMLIFrameElement>(), wordHost = ref<HTMLElement>(), url = ref('')
let request = 0, observer: ResizeObserver | undefined, fitWord: (() => void) | undefined
if (props.artifact.kind === 'png' && props.artifact.bytes) url.value = URL.createObjectURL(new Blob([props.artifact.bytes as Uint8Array<ArrayBuffer>], { type: 'image/png' }))
function imageLoaded(event: Event) {
  const image = event.target as HTMLImageElement
  emit('dimensions', { width: image.naturalWidth, height: image.naturalHeight, unit: 'px' })
  emit('ready')
}
function frameLoaded() {
  emit('ready')
  try { frame.value?.contentDocument?.addEventListener('keydown', event => { if (event.key === 'Escape') emit('close') }) } catch { /* The preview frame may be unloading. */ }
}
async function renderWord(host: HTMLElement) {
  const result = props.artifact, ticket = request
  if (result?.kind !== 'docx' || !result.bytes) return

  try {
    const { renderAsync } = await import('docx-preview')
    if (ticket !== request || wordHost.value !== host) return
    const root = host.attachShadow({ mode: 'open' }), body = document.createElement('div'), styles = document.createElement('div')
    root.append(styles, body)
    await renderAsync(result.bytes, body, styles, { useBase64URL: true, renderFootnotes: true, renderEndnotes: true })
    if (ticket !== request) return
    const style = document.createElement('style')
    style.textContent = ':host{display:flex;justify-content:center;align-items:flex-start}.docx-wrapper{background:transparent!important;padding:0!important;width:max-content;gap:20px}.docx-wrapper>section{margin:0!important;box-shadow:0 2px 12px #00000014,0 0 1px #0000001f!important}'
    root.append(style)
    const paper = root.querySelector<HTMLElement>('section.docx'), wrapper = root.querySelector<HTMLElement>('.docx-wrapper')
    if (paper) emit('dimensions', { width: parseFloat(paper.style.width) * 25.4 / 72, height: parseFloat(paper.style.minHeight) * 25.4 / 72, unit: 'mm' })
    const fit = () => {
      const width = paper?.offsetWidth || 794
      if (wrapper && props.active && host.clientWidth > 0) wrapper.style.zoom = String(Math.min(1, Math.max(0.1, host.clientWidth / width)))
    }
    fitWord = fit; fit(); observer = new ResizeObserver(fit); observer.observe(host)
  } catch (cause) { if (ticket === request) emit('error', String(cause).replace(/^Error: /, '')) }
  finally { if (ticket === request) emit('ready') }
}
watch(wordHost, host => { if (host) void renderWord(host) })

watch(() => props.active, active => { if (active) void nextTick(() => fitWord?.()) })
onMounted(() => { if (props.artifact.kind === 'txt'||props.artifact.kind.startsWith('plugin:')&&!props.artifact.previewHtml) emit('ready') })
onBeforeUnmount(() => { request++; observer?.disconnect(); if (url.value) URL.revokeObjectURL(url.value) })
</script>
<template>
  <div class="export-preview-content" :data-export-kind="artifact.kind">
    <iframe v-if="artifact.kind === 'html' || artifact.previewHtml" ref="frame" @load="frameLoaded" class="export-preview-frame" :srcdoc="artifact.previewHtml || artifact.body" sandbox="allow-same-origin" :title="$t('导出预览')"/>
    <PdfPreview v-else-if="artifact.kind === 'pdf' && artifact.bytes" :bytes="artifact.bytes" :active="active" @ready="emit('ready')" @dimensions="emit('dimensions', $event)" @error="emit('error', $event)"/>
    <div v-else-if="artifact.kind === 'docx'" class="export-pages-preview"><div ref="wordHost" class="export-word-preview"/></div>
    <div v-else-if="artifact.kind === 'png'" class="export-pages-preview export-image-preview"><img :src="url" :alt="$t('导出预览')" @load="imageLoaded" @error="emit('error', $t('图片预览加载失败'))"/></div>
    <pre v-else class="export-text-preview">{{ artifact.body }}</pre>
  </div>
</template>
