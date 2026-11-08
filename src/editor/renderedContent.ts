import { renderPluginMarkdown } from '../plugins/host/markdown'
import { decodeDiagramLabel } from './diagramEditing'
import { diagramDirection } from './diagramDirection'
import { languages } from '@codemirror/language-data'
import { highlightTree, classHighlighter } from '@lezer/highlight'
import DOMPurify from 'dompurify'

export const syntaxPalette: Record<string, string> = {
  'tok-keyword': '#a62871', 'tok-operator': '#a62871', 'tok-string': '#286c46', 'tok-regexp': '#286c46',
  'tok-number': '#97522b', 'tok-bool': '#97522b', 'tok-atom': '#97522b', 'tok-comment': '#8c938f', 'tok-typeName': '#8659a6', 'tok-className': '#8659a6'
}
export const calloutPalette: Record<string, { color: string; background: string }> = {
  tip: { color: '#1f9d55', background: '#edf7f1' }, note: { color: '#0969da', background: '#ebf3fc' },
  important: { color: '#8e66c7', background: '#f6f3fb' }, warning: { color: '#e29c21', background: '#fdf7ed' }, caution: { color: '#c15454', background: '#fbf1f1' }
}
let mermaid: Promise<typeof import('mermaid')['default']> | undefined, sequence = 0
async function highlight(code: HTMLElement, name: string, inlineColors: boolean) {
  const description = languages.find(item => item.name.toLowerCase() === name.toLowerCase() || item.alias.includes(name.toLowerCase()))
  if (!description) return
  const support = await description.load(), source = code.textContent || '', fragment = document.createDocumentFragment(); let at = 0
  highlightTree(support.language.parser.parse(source), classHighlighter, (from, to, classes) => {
    if (from > at) fragment.append(document.createTextNode(source.slice(at, from)))
    const span = document.createElement('span'); span.className = classes; span.textContent = source.slice(from, to)
    const color = classes.split(' ').map(name => syntaxPalette[name]).find(Boolean); if (color && inlineColors) span.style.color = color
    fragment.append(span); at = to
  })
  fragment.append(document.createTextNode(source.slice(at))); code.replaceChildren(fragment)
}
type MindmapNode = { descr: string; children: MindmapNode[] }
async function simpleMindmap(engine: Awaited<NonNullable<typeof mermaid>>, source: string): Promise<string> {
  const diagram = await engine.mermaidAPI.getDiagramFromText(source)
  const root = (diagram.db as { getMindmap(): MindmapNode | null }).getMindmap()
  if (!root) throw new Error('脑图没有根节点')
  const lines = [`flowchart ${diagramDirection('mindmap\n' + source)}`], edges: string[] = []; let count = 0
  const visit = (node: MindmapNode, parent?: string) => {
    const id = `node${count++}`, label = decodeDiagramLabel(node.descr).replace(/\\/g, '#92;').replace(/"/g, '#quot;').replace(/\r?\n/g, '<br/>')
    lines.push(`${id}["${label}"]`)
    if (parent) edges.push(`${parent} --- ${id}`)
    for (const child of node.children) visit(child, id)
  }
  visit(root)
  return [...lines, ...edges, 'classDef default fill:#f6f6f4,stroke:#daddd7,color:#242926,stroke-width:1px;', 'linkStyle default stroke:#aab6ad,stroke-width:1px;'].join('\n')
}
export async function prepareRenderedContent(root: HTMLElement, { strict = false, inlineColors = false }: { strict?: boolean; inlineColors?: boolean } = {}) {
  await renderPluginMarkdown(root, strict)
  await Promise.all([...root.querySelectorAll<HTMLElement>('pre > code')].map(async code => {
    const pre = code.parentElement!, language = pre.dataset.language || [...code.classList].find(value => value.startsWith('language-'))?.slice(9) || ''
    try {
      if (['mermaid', 'mindmap'].includes(language.toLowerCase())) {
        const engine = await (mermaid ||= import('mermaid').then(({ default: engine }) => {
          engine.initialize({ startOnLoad: false, securityLevel: 'strict', suppressErrorRendering: true, htmlLabels: false }); return engine
        }))
        let source = code.textContent || ''
        const mindmap = language.toLowerCase() === 'mindmap' || /^\s*mindmap\b/.test(source)
        if (mindmap && !/^\s*mindmap\b/.test(source)) source = 'mindmap\n' + source
        const { svg } = await engine.render(`markart-render-${++sequence}`, mindmap ? await simpleMindmap(engine, source) : source)
        const diagram = document.createElement('div'); diagram.className = 'cm-mermaid-preview'; if (mindmap) diagram.dataset.diagram = 'mindmap'; diagram.innerHTML = DOMPurify.sanitize(svg, { USE_PROFILES: { svg: true, svgFilters: true } })
        const walker = document.createTreeWalker(diagram, NodeFilter.SHOW_TEXT)
        for (let node = walker.nextNode(); node; node = walker.nextNode()) if (node.parentElement?.closest('text')) node.textContent = decodeDiagramLabel(node.textContent || '')
        pre.replaceWith(diagram)
      } else if (language) await highlight(code, language, inlineColors)
    } catch (error) {
      if (strict) throw new Error(`${language || '代码'} 渲染失败：${String(error)}`)
    }
  }))
}
export async function svgToPng(svg: SVGElement): Promise<string> {
  const values = (svg.getAttribute('viewBox') || '').split(/[ ,]+/).map(Number)
  const width = Math.ceil(values[2] || Number.parseFloat(svg.getAttribute('width') || '') || 800)
  const height = Math.ceil(values[3] || Number.parseFloat(svg.getAttribute('height') || '') || 500)
  const clone = svg.cloneNode(true) as SVGElement; clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg'); clone.setAttribute('width', String(width)); clone.setAttribute('height', String(height))
  const image = new Image(); image.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(new XMLSerializer().serializeToString(clone)); await image.decode()
  const scale = Math.min(2, 4000 / Math.max(width, height)), canvas = document.createElement('canvas'); canvas.width = Math.ceil(width * scale); canvas.height = Math.ceil(height * scale)
  const context = canvas.getContext('2d'); if (!context) throw new Error('无法转换图表图片')
  context.fillStyle = '#ffffff'; context.fillRect(0, 0, canvas.width, canvas.height); context.drawImage(image, 0, 0, canvas.width, canvas.height)
  return canvas.toDataURL('image/png')
}
