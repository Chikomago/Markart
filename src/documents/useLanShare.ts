import { t } from '../i18n'
import { ref, watch, onBeforeUnmount, type Ref } from 'vue'
import { invoke } from '@tauri-apps/api/core'
import QRCode from 'qrcode'
import { renderStaticFragment, exportStyles } from './exportRendering'
import { localImageSources } from './imageProperties'

const escapeHtml = (value: string) => value.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!)

export async function sharedPage(title: string, source: string, markdown: boolean, images: Record<string, string>) {
  const body = markdown ? await renderStaticFragment(source) : document.createElement('div')
  if (!markdown) { const pre = document.createElement('pre'); pre.className = 'plain-text'; pre.textContent = source; body.append(pre) }
  for (const image of body.querySelectorAll('img')) {
    const original = image.getAttribute('src') || ''
    if (images[original]) image.src = images[original]
    else if (!/^(https?:|data:image\/)/i.test(original)) image.removeAttribute('src')
  }
  const safeTitle = escapeHtml(title)
  return `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>${safeTitle} · Markart</title><style>
  ${exportStyles}
  :root{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#242926;background:#fff}body{margin:0;font-size:16px;line-height:1.8}main{max-width:860px;margin:auto;padding:28px 22px 70px;overflow-wrap:anywhere}table{display:block;overflow-x:auto}pre{overflow-x:auto}.plain-text{white-space:pre-wrap}
  </style></head><body><main><article>${body.innerHTML}</article></main></body></html>`
}

export function useLanShare(options: {
  workspaceRoot?: Readonly<Ref<string>>; isTauri: boolean; activeId: Readonly<Ref<string>>; content: Readonly<Ref<string>>; title: Readonly<Ref<string>>;
  markdown: Readonly<Ref<boolean>>; relativePath: Readonly<Ref<string>>;
  imageData: Readonly<Ref<Record<string, string>>>; notify: (message: string) => void
}) {
  const showShare = ref(false)
  const shareBusy = ref(false)
  const shareUrl = ref('')
  const shareQr = ref('')
  let generation = 0

  async function stopShare() {
    generation++
    showShare.value = false
    shareUrl.value = ''
    shareQr.value = ''
    if (options.isTauri) await invoke('stop_lan_share').catch(() => {})
  }
  async function toggleShare() {
    if (shareBusy.value) return
    if (showShare.value) { await stopShare(); return }
    if (!options.isTauri || !options.activeId.value) return
    showShare.value = true
    shareBusy.value = true
    const request = ++generation
    try {
      const token = Array.from(crypto.getRandomValues(new Uint8Array(32)), byte => byte.toString(16).padStart(2, '0')).join('')
      const images = { ...options.imageData.value }
      if (options.markdown.value && options.relativePath.value) {
        await Promise.all(localImageSources(options.content.value).filter(source => !images[source]).map(async source => {
          try { images[source] = await invoke<string>('read_image', { workspaceRoot: options.workspaceRoot?.value, document: options.relativePath.value, target: source }) }
          catch { /* missing images remain absent from the shared page */ }
        }))
      }
      const html = await sharedPage(options.title.value, options.content.value, options.markdown.value, images)
      if (request !== generation) return
      shareUrl.value = await invoke<string>('start_lan_share', { html, token })
      if (request !== generation) { await invoke('stop_lan_share').catch(() => {}); return }
      shareQr.value = await QRCode.toDataURL(shareUrl.value, { width: 224, margin: 1, color: { dark: '#242824', light: '#ffffff' } })
    } catch (error) {
      await stopShare()
      options.notify(t('分享失败：{0}', { "0": String(error) }))
    } finally { shareBusy.value = false }
  }
  async function copyShareUrl() {
    if (!shareUrl.value) return
    try { await navigator.clipboard.writeText(shareUrl.value); options.notify(t('已复制')) }
    catch { options.notify(t('链接复制失败，请手动复制地址')) }
  }
  watch(options.activeId, () => { if (showShare.value) void stopShare() })
  onBeforeUnmount(() => { if (showShare.value || shareBusy.value) void stopShare() })
  return { showShare, shareBusy, shareUrl, shareQr, toggleShare, stopShare, copyShareUrl }
}
