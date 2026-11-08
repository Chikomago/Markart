import { ref, watch, type Ref } from 'vue'
import { invoke } from '@tauri-apps/api/core'
import { localImageSources } from '../documents/imageProperties'
import type { Doc } from '../workspace/sample'

export function useMarkdownPreview({ isTauri, activeDoc, activeId, content }: {
  isTauri: boolean
  activeDoc: Readonly<Ref<Doc>>
  activeId: Ref<string>
  content: Readonly<Ref<string>>
}) {
  const imageData = ref<Record<string, string>>({})
  let imageLoadRequest = 0, documentKey = ''
  let pending = new Map<string, Promise<string | null>>()
  const publish = (next: Record<string, string>) => {
    const current = imageData.value
    if (Object.keys(current).length !== Object.keys(next).length || Object.keys(next).some(key => current[key] !== next[key])) imageData.value = next
  }
  watch([content, activeId, () => activeDoc.value.loaded, () => activeDoc.value.relativePath], async () => {
    const request = ++imageLoadRequest, doc = activeDoc.value
    const key = `${doc.id}\0${doc.relativePath || ''}\0${doc.loaded}`
    if (key !== documentKey) { documentKey = key; pending = new Map(); publish({}) }
    if (!isTauri || !doc.relativePath || !doc.loaded) return
    const sources = localImageSources(content.value), loaded: Record<string, string> = {}, requests = pending
    await Promise.all(sources.map(async source => {
      if (imageData.value[source]) { loaded[source] = imageData.value[source]; return }
      let task = requests.get(source)
      if (!task) {
        task = invoke<string>('read_image', { workspaceRoot: doc.workspaceRoot, document: doc.relativePath, target: source }).catch(() => null)
        requests.set(source, task)
      }
      const value = await task
      if (value) loaded[source] = value
      else requests.delete(source)
    }))
    // Unchanged images keep their object identity and loaded DOM. A task toggle
    // must not reconfigure every rendered block or temporarily collapse images.
    if (request === imageLoadRequest && doc.id === activeId.value) publish(loaded)
  }, { immediate: true })
  return { imageData }
}
