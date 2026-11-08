import { cleanupPluginMarkdown } from '../plugins/host/markdown'
import DOMPurify from 'dompurify'
import { renderMarkdown } from '../editor/renderMarkdown'
import { calloutPalette, prepareRenderedContent, svgToPng } from '../editor/renderedContent'

export const exportStyles = `
*{box-sizing:border-box}body{color:#242926;background:#fff}h1,h2,h3,h4,h5,h6{color:inherit;line-height:1.4;margin:1.4em 0 .65em}p{margin:var(--export-paragraph-spacing,12px) 0}a{color:#315fbd;text-decoration:underline}img,svg{max-width:100%;height:auto}table{width:max-content;max-width:100%;border-collapse:collapse;table-layout:auto}body.table-full table{width:100%;table-layout:fixed}th,td{border:1px solid #daddd7;padding:8px 10px;overflow-wrap:anywhere}th{background:#f6f6f4;font-weight:600}blockquote{margin:12px 0;padding:12px 18px;border-left:3px solid #daddd7;border-radius:0 7px 7px 0;background:#f6f6f4}blockquote p{margin:.55em 0}blockquote>:first-child{margin-top:0}blockquote>:last-child{margin-bottom:0}.callout{border-left-width:4px}.callout-title{font-weight:600;margin:0 0 .55em}.cm-mermaid-preview{padding:12px 0;text-align:center}.cm-mermaid-preview svg{display:block;margin:auto}pre{white-space:pre-wrap;overflow-wrap:anywhere;margin:12px 0;padding:14px;border:1px solid #e8eae6;border-radius:6px;background:#f6f6f4;font:1em/var(--export-line-height,1.85) ui-monospace,Menlo,monospace;color:#242926}pre code{font:inherit;background:transparent;padding:0}.export-code-language{display:block;margin-top:8px;color:#8c938f;text-align:right;white-space:normal;font:.8em/1.4 ui-monospace,Menlo,monospace;user-select:none}code{font:0.9em ui-monospace,Menlo,monospace;background:#f6f6f4;padding:2px 4px;border-radius:3px}ul,ol{padding-left:1.7em}li{margin:.25em 0}li.task-list-item{list-style:none}input[type=checkbox]{margin:0 .5em 0 0;vertical-align:middle}hr{border:0;border-top:1px solid #daddd7;margin:1.5em 0}.footnotes{border-top:1px solid #daddd7;margin-top:24px;padding-top:12px;font-size:.85em;color:#8c938f}.footnotes h2{display:none}.footnotes p{margin:0}sup{margin-inline:.15em;font-size:.78em}.markart-display-math{margin:14px 0;text-align:center}.markart-comment{display:none}
${Object.entries(calloutPalette).map(([kind, colors]) => `.callout-${kind}{border-color:${colors.color};background:${colors.background}}`).join('\n')}
@media print{body{max-width:none!important;padding:0!important;-webkit-print-color-adjust:exact;print-color-adjust:exact}pre,img,svg,table,blockquote{break-inside:avoid}}
`
export async function renderStaticFragment(source: string, strict = false, html?: string): Promise<HTMLElement> {
  const root = document.createElement('div'); root.innerHTML = DOMPurify.sanitize(html ?? renderMarkdown(source))
  await prepareRenderedContent(root, { strict, inlineColors: true })
  root.querySelectorAll('.markart-comment,.footnotes h2').forEach(node => node.remove())
  root.querySelectorAll<HTMLElement>('pre[data-language]').forEach(pre => {
    const language = pre.dataset.language?.trim()
    if (!language || !pre.querySelector(':scope > code')) return
    const label = document.createElement('span'); label.className = 'export-code-language'; label.textContent = language
    pre.append(label)
  })
  root.querySelectorAll('li').forEach(item => { if (item.querySelector(':scope > input[type=checkbox],:scope > p > input[type=checkbox]')) item.classList.add('task-list-item') })
  cleanupPluginMarkdown(root)
  return root
}
export async function exportFragment(source: string, word = false, html?: string): Promise<HTMLElement> {
  const root = await renderStaticFragment(source, true, html)
  if (word) for (const svg of root.querySelectorAll<SVGElement>('.cm-mermaid-preview svg')) {
    const image = document.createElement('img'); image.src = await svgToPng(svg); image.alt = '图表'; const box = (svg.getAttribute('viewBox') || '').split(/[ ,]+/).map(Number); if (box[2] && box[3]) { image.setAttribute('width', String(Math.round(box[2]))); image.setAttribute('height', String(Math.round(box[3]))) } svg.replaceWith(image)
  }
  return root
}
