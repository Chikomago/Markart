import { shallowReactive, watch } from 'vue'
import { pluginServices } from '../plugins/host/services'
import { t } from '../i18n'
export type ExportKind = 'html' | 'pdf' | 'docx' | 'png' | 'txt' | `plugin:${string}`
export type ExportArtifact = { kind: ExportKind; body: string; bytes?: Uint8Array; previewHtml?: string; extension?: string }
export const exportFormats = shallowReactive<{ kind: ExportKind; label: string }[]>([
  { kind: 'html', label: 'HTML' }, { kind: 'pdf', label: 'PDF' },
  { kind: 'docx', label: 'Word' }, { kind: 'png', label: 'PNG' }, { kind: 'txt', label: '纯文本' },
])
watch(()=>pluginServices.formats,formats=>{exportFormats.splice(5,exportFormats.length-5,...formats.map(format=>({kind:`plugin:${format.id}` as ExportKind,label:format.title})))},{immediate:true})
export function exportFilename(path: string, kind: ExportKind) {
  const name = path.split(/[\\/]/).pop() || '文件'
  return `${name.replace(/\.[^.]+$/, '')}.${kind.startsWith('plugin:')?pluginServices.formats.find(format=>`plugin:${format.id}`===kind)?.extension||'txt':kind}`
}

export type ExportDimensions = { width: number; height: number; unit: 'mm' | 'px' }
export function formatExportDimensions(size?: ExportDimensions): string {
  if (!size || ![size.width, size.height].every(value => Number.isFinite(value) && value > 0)) return ''
  if (size.unit === 'px') return `${size.width} × ${size.height} px`
  const papers = [{ name: 'A4', width: 210, height: 297 }, { name: 'Letter', width: 215.9, height: 279.4 }]
  for (const paper of papers) {
    for (const [width, height] of [[paper.width, paper.height], [paper.height, paper.width]]) {
      if (Math.abs(size.width - width!) < .5 && Math.abs(size.height - height!) < .5) return `${paper.name} · ${width} × ${height} mm`
    }
  }
  return `${t('自定义')} · ${Number(size.width.toFixed(1))} × ${Number(size.height.toFixed(1))} mm`
}
