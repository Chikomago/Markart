<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref, watch } from 'vue'
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import type { ExportDimensions } from './exportPreview'
import type { PDFDocumentLoadingTask, PDFDocumentProxy, RenderTask } from 'pdfjs-dist'
const props = withDefaults(defineProps<{ bytes: Uint8Array; active?: boolean }>(), { active: true })
const emit = defineEmits<{ ready: []; dimensions: [value: ExportDimensions]; error: [message: string] }>()
const scroller = ref<HTMLElement>(), pageCount = ref(0), aspectRatio = ref('1 / 1.414')
let document: PDFDocumentProxy | undefined, loading: PDFDocumentLoadingTask | undefined
let visibility: IntersectionObserver | undefined, resize: ResizeObserver | undefined
let generation = 0, ready = false, resizeFrame = 0, lastWidth = 0
const renderedWidths = new Map<HTMLElement, number>()
const visible = new Set<HTMLElement>(), tasks = new Map<HTMLElement, RenderTask>(), pending = new Set<HTMLElement>()
function release() {
  generation++; visibility?.disconnect(); resize?.disconnect(); cancelAnimationFrame(resizeFrame)
  tasks.forEach(task => task.cancel()); tasks.clear(); pending.clear(); visible.clear(); renderedWidths.clear()
  void loading?.destroy().catch(() => {}); loading = undefined; document = undefined
}
async function renderPage(element: HTMLElement) {
  const pdf = document, ticket = generation
  if (!pdf || pending.has(element) || (element.querySelector('canvas')!.width > 0 && renderedWidths.get(element) === element.clientWidth)) return
  pending.add(element)
  try {
    const page = await pdf.getPage(Number(element.dataset.page))
    if (ticket !== generation || !visible.has(element)) return
    const canvas = element.querySelector('canvas')!, context = canvas.getContext('2d')!
    const base = page.getViewport({ scale: 1 })
    const viewport = page.getViewport({ scale: element.clientWidth / base.width })
    const pixelRatio = Math.min(devicePixelRatio || 1, 2)
    canvas.width = Math.ceil(viewport.width * pixelRatio); canvas.height = Math.ceil(viewport.height * pixelRatio)
    const task = page.render({ canvas, canvasContext: context, viewport, intent: 'print', transform: [pixelRatio, 0, 0, pixelRatio, 0, 0] })
    tasks.set(element, task)
    await task.promise
    renderedWidths.set(element, element.clientWidth)
    if (ticket === generation && !ready) { ready = true; emit('ready') }
  } catch (error) {
    if (ticket === generation && (error as Error).name !== 'RenderingCancelledException') emit('error', String(error))
  } finally { if (ticket === generation) { pending.delete(element); tasks.delete(element); if (visible.has(element) && element.querySelector('canvas')?.width === 0) void renderPage(element) } }
}
watch(() => props.bytes, async bytes => {
  release(); ready = false; pageCount.value = 0
  const ticket = generation
  try {
    const pdfjs = await import('pdfjs-dist')
    if (ticket !== generation) return
    pdfjs.GlobalWorkerOptions.workerSrc = workerUrl
    // PDF.js transfers its input buffer to the worker; keep the export bytes intact.
    loading = pdfjs.getDocument({ data: bytes.slice(), isEvalSupported: false })
    const pdf = await loading.promise
    if (ticket !== generation) return
    document = pdf
    const first = await pdf.getPage(1), viewport = first.getViewport({ scale: 1 })
    if (ticket !== generation) return
    emit('dimensions', { width: viewport.width * 25.4 / 72, height: viewport.height * 25.4 / 72, unit: 'mm' })
    aspectRatio.value = `${viewport.width} / ${viewport.height}`; pageCount.value = pdf.numPages
    await nextTick()
    if (ticket !== generation || !scroller.value) return
    visibility = new IntersectionObserver(entries => {
      if (!props.active) return
      for (const entry of entries) {
        const element = entry.target as HTMLElement
        if (entry.isIntersecting) { visible.add(element); void renderPage(element) }
        else {
          visible.delete(element); tasks.get(element)?.cancel()
          const canvas = element.querySelector('canvas')!
          canvas.width = 0; canvas.height = 0
        }
      }
    }, { root: scroller.value, rootMargin: '600px 0px' })
    scroller.value.querySelectorAll('.export-pdf-page').forEach(element => visibility!.observe(element))
    lastWidth = scroller.value.clientWidth
    resize = new ResizeObserver(() => {
      if (!props.active || !scroller.value || scroller.value.clientWidth === lastWidth) return
      lastWidth = scroller.value.clientWidth
      cancelAnimationFrame(resizeFrame)
      resizeFrame = requestAnimationFrame(() => {
        for (const element of visible) {
          const task = tasks.get(element)
          if (task) { task.cancel(); void task.promise.catch(() => {}).finally(() => { void renderPage(element) }) }
          else void renderPage(element)
        }
      })
    })
    resize.observe(scroller.value)
  } catch (error) { if (ticket === generation) emit('error', String(error)) }
}, { immediate: true })
onBeforeUnmount(release)
</script>
<template>
  <div ref="scroller" class="export-pages-preview export-pdf-preview">
    <div v-for="page in pageCount" :key="page" class="export-pdf-page" :data-page="page" :style="{ aspectRatio }"><canvas :aria-label="String(page)"/></div>
  </div>
</template>
