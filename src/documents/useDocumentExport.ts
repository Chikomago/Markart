import { preparePluginExport, customExport } from '../plugins/host/exports'
import { pluginServices } from '../plugins/host/services'
import { t } from '../i18n'
import { computed, ref, watch, type ComputedRef, type Ref } from 'vue'
import DOMPurify from 'dompurify'
import { invoke } from '@tauri-apps/api/core'
import { renderMarkdown } from '../editor/renderMarkdown'
import type { Doc } from '../workspace/sample'
import { exportFragment, exportStyles } from './exportRendering'
import { htmlToDocx } from './wordExport'
import type { ExportKind, ExportArtifact } from './exportPreview'

export function useDocumentExport(deps: {
  isTauri: boolean
  activeDoc: ComputedRef<Doc>
  content: ComputedRef<string>
  markdownActive: ComputedRef<boolean>
  fontSize: ComputedRef<number>
  lineHeight: ComputedRef<number>
  paragraphSpacing: ComputedRef<number>
  tableWidth: ComputedRef<'content' | 'full'>
  exportFontFamily: ComputedRef<string>
  exportPageSize: ComputedRef<'A4' | 'Letter' | 'custom'>
  exportPageWidth: ComputedRef<number>
  exportPageHeight: ComputedRef<number>
  exportMargin: ComputedRef<number>
  showExport: Ref<boolean>
  notify: (message: string) => void
}) {
const { isTauri, activeDoc, content, markdownActive, fontSize, lineHeight, paragraphSpacing, tableWidth, exportFontFamily, exportPageSize, exportPageWidth, exportPageHeight, exportMargin, showExport, notify } = deps
const exportBusy = ref(false)
async function exportHtmlDocument(word = false, prepared?: {source:string;html?:string}): Promise<string> {
  const fragment = document.createElement('template')
  if (markdownActive.value) {
    const rendered = await exportFragment(prepared?.source ?? content.value, word, prepared?.html)
    fragment.innerHTML = rendered.innerHTML
  }
  else {
    const pre = document.createElement('pre')
    const code = document.createElement('code')
    code.textContent = content.value
    pre.append(code)
    fragment.content.append(pre)
  }
  for (const image of fragment.content.querySelectorAll('img')) {
    const source = image.getAttribute('src') || ''
    if (/^data:/i.test(source)) continue
    if (!source || /^(?:https?:|file:)/i.test(source)) throw new Error(`无法读取图片，请检查路径：${source || '空路径'}`)
    if (!activeDoc.value.relativePath || !isTauri) throw new Error('请在桌面版打开图片所在文件夹后导出')
    image.setAttribute('src', await invoke<string>('read_image', { workspaceRoot: activeDoc.value.workspaceRoot, document: activeDoc.value.relativePath, target: source }))
  }
  const title = activeDoc.value.path.split('/').pop() || '文件'
  const escapedTitle = title.replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]!)
  return `<!doctype html><html lang="zh"><head><meta charset="utf-8"><meta name="generator" content="Markart"><title>${escapedTitle}</title><style>${exportStyles}body{max-width:1020px;margin:0 auto;padding:48px 36px;font:${fontSize.value}px/${lineHeight.value} ${JSON.stringify(exportFontFamily.value)},-apple-system,BlinkMacSystemFont,"PingFang SC",sans-serif;--export-line-height:${lineHeight.value};--export-paragraph-spacing:${paragraphSpacing.value}px}</style></head><body class="${tableWidth.value === 'full' ? 'table-full' : ''}" data-export-font-size="${fontSize.value}" data-export-line-height="${lineHeight.value}" data-export-paragraph-spacing="${paragraphSpacing.value}" data-export-font="${exportFontFamily.value.replace(/"/g, '&quot;')}">${fragment.innerHTML}</body></html>`
}
async function exportPlainText(prepared?:{source:string;html?:string}): Promise<string> {
  if (!markdownActive.value) return content.value
  const fragment = document.createElement('template')
  fragment.innerHTML = DOMPurify.sanitize(prepared?.html ?? renderMarkdown(prepared?.source ?? content.value))
  for (const image of fragment.content.querySelectorAll('img')) image.replaceWith(document.createTextNode(image.getAttribute('alt') || ''))
  for (const formula of fragment.content.querySelectorAll<HTMLElement>('.language-math[data-math]')) {
    formula.replaceWith(document.createTextNode(formula.dataset.math || ''))
  }
  for (const table of fragment.content.querySelectorAll('table')) {
    const rows = Array.from(table.querySelectorAll('tr')).map(row => Array.from(row.querySelectorAll('th,td')).map(cell => cell.textContent?.trim() || '').join('\t'))
    table.replaceWith(document.createTextNode(`${rows.join('\n')}\n`))
  }
  for (const breakNode of fragment.content.querySelectorAll('br')) breakNode.replaceWith(document.createTextNode('\n'))
  for (const backref of fragment.content.querySelectorAll('.footnote-backref')) backref.remove()
  for (const block of fragment.content.querySelectorAll('h1,h2,h3,h4,h5,h6,p,li,pre,blockquote')) block.append(document.createTextNode('\n'))
  return (fragment.content.textContent || '').replace(/\t\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim() + '\n'
}
const exportRevision = computed(() => JSON.stringify([
  activeDoc.value.id, activeDoc.value.path, activeDoc.value.relativePath, content.value, markdownActive.value,
  fontSize.value, lineHeight.value, paragraphSpacing.value, tableWidth.value, exportFontFamily.value,
  exportPageSize.value, exportPageWidth.value, exportPageHeight.value, exportMargin.value, pluginServices.formats.map(item=>item.id), pluginServices.beforeExport.map(item=>item.id), pluginServices.transformAst.map(item=>item.id),
]))
let skippedPlugins:string[]=[]
let cacheKey = ''
let artifacts = new Map<ExportKind, Promise<ExportArtifact>>()
function pageSettings() {
  if (exportPageSize.value === 'custom' && (!exportPageWidth.value || !exportPageHeight.value)) throw new Error('请填写自定义纸张宽度和高度')
  return { pageSize: exportPageSize.value === 'custom' ? `${exportPageWidth.value}x${exportPageHeight.value}` : exportPageSize.value, marginMm: exportMargin.value }
}
async function prepareExport(kind: ExportKind, options?: {skipPlugins?:string[]}): Promise<ExportArtifact> {
  if(options?.skipPlugins)skippedPlugins=options.skipPlugins
  const key = exportRevision.value+JSON.stringify(skippedPlugins)
  if (cacheKey !== key) { cacheKey = key; artifacts = new Map() }
  const cache = artifacts
  if (!cache.has(kind)) {
    const preparation = (async () => {
      const snapshot={content:content.value,root:activeDoc.value.workspaceRoot||'',path:activeDoc.value.relativePath||'',format:kind}
      const prepared=await preparePluginExport(snapshot,skippedPlugins)
      if(kind.startsWith('plugin:'))return {kind,...await customExport(kind,{...snapshot,ast:prepared.ast})}
      if (kind === 'txt') return { kind, body: await exportPlainText(prepared) }
      const body = await exportHtmlDocument(kind === 'docx',prepared)
      if (kind === 'docx') {
        const bytes = await htmlToDocx(body, activeDoc.value.path, exportPageSize.value === 'Letter' ? 'Letter' : 'A4', exportMargin.value)
        return { kind, body, bytes }
      }
      if (kind === 'pdf' || kind === 'png') {
        if (!isTauri) throw new Error(t('此格式需要在桌面版导出'))
        let rendered: number[]
        try { rendered = await invoke<number[]>('render_export_preview', { kind, content: body, ...pageSettings() }) }
        catch (error) {
          if (/Command render_export_preview not found/.test(String(error))) throw new Error(t('导出组件已更新，请重启应用后预览'))
          throw error
        }
        const bytes = new Uint8Array(rendered)
        return { kind, body, bytes }
      }
      return { kind, body }
    })()
    cache.set(kind, preparation)
    void preparation.catch(() => { if (cache.get(kind) === preparation) cache.delete(kind) })
  }
  return cache.get(kind)!
}
watch(showExport, open => { if (!open) { cacheKey = ''; artifacts.clear();skippedPlugins=[] } })
async function download(kind: ExportKind) {
  if (exportBusy.value) return
  exportBusy.value = true
  try {
    const filename = activeDoc.value.path.split('/').pop() || '文件'
    if (['pdf', 'docx', 'png'].includes(kind) && !isTauri) throw new Error('此格式需要在桌面版导出')
    const artifact = await prepareExport(kind)
    if (isTauri) {
      const path = kind.startsWith('plugin:') ? await invoke<string|null>('export_plugin_file',{filename,extension:artifact.extension,bytes:artifact.bytes?Array.from(artifact.bytes):Array.from(new TextEncoder().encode(artifact.body))}) : await invoke<string | null>('export_document', { kind, filename, content: artifact.body, ...pageSettings(), binaryContent: artifact.bytes ? Array.from(artifact.bytes) : null })
      if (!path) return
    } else {
      const blob = new Blob([artifact.bytes as Uint8Array<ArrayBuffer> || artifact.body], { type: kind === 'html' ? 'text/html' : 'text/plain' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a'); link.href = url; link.download = `${filename.replace(/\.[^.]+$/, '')}.${artifact.extension||kind}`; link.click()
      setTimeout(() => URL.revokeObjectURL(url), 1000)
    }
    showExport.value = false; notify(t('已导出'))
  } catch (error) { notify(t('导出失败：{0}', { "0": String(error) })) }
  finally { exportBusy.value = false }
}

return { exportBusy, download, prepareExport, exportRevision }
}
