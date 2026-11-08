import { ref, type Ref } from 'vue'
import { ScrollSyncGate } from './scrollSyncGate'
import { SplitScrollMapper } from './splitScrollMapper'

type Mode = 'wysiwyg' | 'source' | 'split'

export function useSplitScroll({ mode }: { mode: Ref<Mode> }) {
  const previewScroll = ref<HTMLElement | null>(null)
  const scrollSyncGate = new ScrollSyncGate()
  let gesture: { pane: 'source' | 'preview'; at: number; source: HTMLElement; preview: HTMLElement; mapper: SplitScrollMapper } | null = null

  function panes(origin: 'source' | 'preview', element: HTMLElement) {
    const source = origin === 'source' ? element : document.querySelector<HTMLElement>('.editor-pane .cm-scroller')
    const preview = origin === 'preview' ? element : document.querySelector<HTMLElement>('.preview-pane .cm-scroller')
    return source && preview ? { source, preview } : null
  }

  function claimUserScroll(pane: 'source' | 'preview') {
    scrollSyncGate.claim(pane)
    const now = performance.now()
    const element = document.querySelector<HTMLElement>(pane === 'source' ? '.editor-pane .cm-scroller' : '.preview-pane .cm-scroller')
    const pair = element && panes(pane, element)
    if (gesture?.pane === pane && pair && gesture.source === pair.source && gesture.preview === pair.preview && now - gesture.at < 500) { gesture.at = now; return }
    gesture = pair ? {
      pane, at: now, source: pair.source, preview: pair.preview,
      mapper: new SplitScrollMapper(
        Math.max(0, pair.source.scrollHeight - pair.source.clientHeight),
        Math.max(0, pair.preview.scrollHeight - pair.preview.clientHeight)
      )
    } : null
  }

  function syncScroll(origin: 'source' | 'preview', element: HTMLElement) {
    if (mode.value !== 'split' || scrollSyncGate.consume(origin, element.scrollTop)) return
    if (origin === 'preview' && (!gesture || gesture.pane !== 'preview' || performance.now() - gesture.at >= 500)) return
    const pair = panes(origin, element)
    if (!pair) return
    const { source, preview } = pair
    if (previewScroll.value !== preview) previewScroll.value = preview
    const mapper = gesture?.pane === origin && gesture.source === source && gesture.preview === preview && performance.now() - gesture.at < 500 ? gesture.mapper : new SplitScrollMapper(
      Math.max(0, source.scrollHeight - source.clientHeight),
      Math.max(0, preview.scrollHeight - preview.clientHeight)
    )
    if (origin === 'source') {
      const target = source.scrollTop >= source.scrollHeight - source.clientHeight - 1
        ? preview.scrollHeight - preview.clientHeight : mapper.fromSource(source.scrollTop)
      if (Math.abs(preview.scrollTop - target) > 0.5) { scrollSyncGate.expect('preview', target); preview.scrollTop = target }
    } else {
      const target = preview.scrollTop >= preview.scrollHeight - preview.clientHeight - 1
        ? source.scrollHeight - source.clientHeight : mapper.fromPreview(preview.scrollTop)
      if (Math.abs(source.scrollTop - target) > 0.5) { scrollSyncGate.expect('source', target); source.scrollTop = target }
    }
  }

  function onPreviewEditorScroll(element: HTMLElement) { syncScroll('preview', element) }

  return { previewScroll, scrollSyncGate, claimUserScroll, syncScroll, onPreviewEditorScroll }
}
