import { Document, HeadingLevel, ImageRun, LevelFormat, Packer, Paragraph, Table, TableCell, TableRow, TextRun, ExternalHyperlink, FootnoteReferenceRun, WidthType, TableLayoutType, LineRuleType, AlignmentType, ShadingType, BorderStyle, Math as WordMath, MathRun, MathFraction, MathSuperScript, MathSubScript, MathSubSuperScript, MathRadical, type MathComponent, type ParagraphChild, type IRunStylePropertiesOptions } from 'docx'
import { calloutPalette } from '../editor/renderedContent'

type Block = Paragraph | Table
type Context = { size: number; line: number; spacing: number; font: string; full: boolean; width: number; footnotes: Map<string, number> }
const color = (value: string) => { const hex = /^#([0-9a-f]{6})$/i.exec(value); if (hex) return hex[1]; const rgb = /rgba?\((\d+),\s*(\d+),\s*(\d+)/.exec(value); return rgb ? rgb.slice(1, 4).map(value => Number(value).toString(16).padStart(2, '0')).join('') : undefined }
async function imageRun(element: Element): Promise<ImageRun | TextRun> {
  const source = element.getAttribute('src') || '', probe = new Image(); probe.src = source
  if (!source.startsWith('data:image/')) return new TextRun(element.getAttribute('alt') || '[图片]')
  await probe.decode()
  let uri = source
  if (!/^data:image\/(png|jpeg|gif|bmp);base64,/i.test(uri)) {
    const canvas = document.createElement('canvas'); canvas.width = probe.naturalWidth; canvas.height = probe.naturalHeight; canvas.getContext('2d')!.drawImage(probe, 0, 0); uri = canvas.toDataURL('image/png')
  }
  const match = /^data:image\/(png|jpeg|gif|bmp);base64,(.+)$/i.exec(uri)!
  const bytes = Uint8Array.from(atob(match[2]), character => character.charCodeAt(0))
  const specified = Number(element.getAttribute('width')) || parseFloat((element as HTMLElement).style.width || '') || probe.naturalWidth || 520
  const ratio = probe.naturalHeight / probe.naturalWidth, width = Math.min(520, specified, 640 / ratio)
  return new ImageRun({ type: match[1] === 'jpeg' ? 'jpg' : match[1] as 'png' | 'gif' | 'bmp', data: bytes, transformation: { width: Math.round(width), height: Math.round(width * ratio) } })
}
function equation(node: Node): MathComponent[] {
  if (node.nodeType === Node.TEXT_NODE) return node.textContent?.trim() ? [new MathRun(node.textContent)] : []
  if (!(node instanceof Element) || node.localName === 'annotation') return []
  if (node.localName === 'math' || node.localName === 'semantics') return [...node.children].flatMap(equation)
  const parts = [...node.children], part = (i: number) => parts[i] ? equation(parts[i]) : []
  if (node.localName === 'mfrac') return [new MathFraction({ numerator: part(0), denominator: part(1) })]
  if (node.localName === 'msup') return [new MathSuperScript({ children: part(0), superScript: part(1) })]
  if (node.localName === 'msub') return [new MathSubScript({ children: part(0), subScript: part(1) })]
  if (node.localName === 'msubsup' || node.localName === 'munderover') return [new MathSubSuperScript({ children: part(0), subScript: part(1), superScript: part(2) })]
  if (node.localName === 'msqrt' || node.localName === 'mroot') return [new MathRadical({ children: node.localName === 'mroot' ? part(0) : parts.flatMap(equation), degree: node.localName === 'mroot' ? part(1) : undefined })]
  return [...node.childNodes].flatMap(equation)
}
async function inline(node: Node, ctx: Context, style: IRunStylePropertiesOptions = {}): Promise<ParagraphChild[]> {
  if (node.nodeType === Node.TEXT_NODE) return node.textContent ? [new TextRun({ text: node.textContent, font: ctx.font, ...style })] : []
  if (!(node instanceof Element)) return []
  const tag = node.tagName.toLowerCase()
  if (node.matches('.footnote-backref,[data-footnote-backref],annotation,ul,ol')) return []
  if (tag === 'br') return [new TextRun({ break: 1 })]
  if (tag === 'input') return node.hasAttribute('checked') ? [new TextRun('☑ ')] : [new TextRun('☐ ')]
  if (tag === 'img') return [await imageRun(node)]
  if (tag === 'math') return [new WordMath({ children: equation(node) })]
  if (tag === 'a' && node.hasAttribute('data-footnote-ref')) { const id = ctx.footnotes.get((node.getAttribute('href') || '').slice(1)); return id ? [new FootnoteReferenceRun(id)] : [] }
  const childStyle: IRunStylePropertiesOptions = { ...style,
    bold: style.bold || tag === 'strong' || tag === 'b', italics: style.italics || tag === 'em' || tag === 'i',
    strike: style.strike || tag === 'del' || tag === 's', underline: tag === 'u' || tag === 'a' ? {} : style.underline,
    font: tag === 'code' ? 'Menlo' : style.font,
    color: color((node as HTMLElement).style?.color || '') || (tag === 'a' ? '315FBD' : style.color)
  }
  const runs: ParagraphChild[] = []
  for (const child of node.childNodes) runs.push(...await inline(child, ctx, childStyle))
  if (tag === 'a' && /^(https?:|mailto:)/i.test(node.getAttribute('href') || '')) return [new ExternalHyperlink({ children: runs, link: node.getAttribute('href')! })]
  return runs
}
function paragraphSpacing(ctx: Context) { return { before: 0, after: ctx.spacing, line: ctx.line, lineRule: LineRuleType.EXACT } }
function blockBox(children: Block[], fill: string, border?: string): Table {
  const none = { style: BorderStyle.NIL, size: 0, color: 'FFFFFF' }
  return new Table({ width: { size: 100, type: WidthType.PERCENTAGE },
    borders: { top: none, bottom: none, left: border ? { style: BorderStyle.SINGLE, size: 12, color: border } : none, right: none, insideHorizontal: none, insideVertical: none },
    rows: [new TableRow({ children: [new TableCell({ margins: { top: 180, bottom: 180, left: 210, right: 210 }, shading: { type: ShadingType.CLEAR, fill }, children: children.length ? children : [new Paragraph('')] })] })] })
}
function blockGap(ctx: Context) { return new Paragraph({ children: [], spacing: { before: 0, after: 0, line: Math.max(1, ctx.spacing), lineRule: LineRuleType.EXACT } }) }
async function blocks(parent: ParentNode, ctx: Context, level = 0): Promise<Block[]> {
  const result: Block[] = []
  for (const node of parent.childNodes) {
    if (node.nodeType === Node.TEXT_NODE) { if (node.textContent?.trim()) result.push(new Paragraph({ children: await inline(node, ctx) })); continue }
    if (!(node instanceof Element) || node.matches('.footnotes,.markart-comment')) continue
    const tag = node.tagName.toLowerCase()
    if (tag === 'table') {
      const rows: TableRow[] = [], columns = node.querySelector('tr')?.children.length || 1
      const widths = Array.from({ length: columns }, (_, index) => Math.max(600, ...[...node.querySelectorAll('tr')].map(row => {
        const text = row.children[index]?.textContent || ''
        const units = [...text].reduce((sum, character) => sum + (/[^\x00-\xff]/.test(character) ? 1 : 0.6), 0)
        return Math.ceil(units * ctx.size * 12 + 500)
      })))
      const total = widths.reduce((sum, width) => sum + width, 0)
      const columnWidths = widths.map(width => Math.round(ctx.full ? ctx.width / columns : width * Math.min(1, ctx.width / total)))
      for (const row of node.querySelectorAll('tr')) {
        const cells: TableCell[] = []
        for (const [index, cell] of [...row.children].entries()) {
          const align = ((cell as HTMLElement).style.textAlign || cell.getAttribute('align') || 'left') as 'left' | 'center' | 'right'
          cells.push(new TableCell({ margins: { top: 120, bottom: 120, left: 150, right: 150 }, width: { size: columnWidths[index], type: WidthType.DXA },
            shading: cell.tagName === 'TH' ? { type: ShadingType.CLEAR, fill: 'F6F6F4' } : undefined,
            children: [new Paragraph({ children: await inline(cell, ctx, { bold: cell.tagName === 'TH' }), alignment: ['left', 'center', 'right'].includes(align) ? align : undefined, spacing: { ...paragraphSpacing(ctx), before: 0, after: 0 } })] }))
        }
        rows.push(new TableRow({ children: cells, tableHeader: !!row.querySelector('th') }))
      }
      result.push(new Table({ rows, columnWidths, width: { size: columnWidths.reduce((sum, width) => sum + width, 0), type: WidthType.DXA }, layout: ctx.full ? TableLayoutType.FIXED : TableLayoutType.AUTOFIT,
        borders: Object.fromEntries(['top', 'bottom', 'left', 'right', 'insideHorizontal', 'insideVertical'].map(side => [side, { style: 'single', size: 4, color: 'DADDD7' }])) }))
    } else if (tag === 'ul' || tag === 'ol') {
      for (const item of node.children) {
        if (item.tagName !== 'LI') continue
        const task = !!item.querySelector(':scope > input[type=checkbox],:scope > p > input[type=checkbox]')
        result.push(new Paragraph({ children: await inline(item, ctx), ...(task ? { indent: { left: 360 * (level + 1) } } : tag === 'ol' ? { numbering: { reference: 'ordered', level: Math.min(level, 8) } } : { bullet: { level: Math.min(level, 8) } }), spacing: { after: 80 } }))
        for (const list of item.querySelectorAll(':scope > ul,:scope > ol')) result.push(...await blocks({ childNodes: [list] } as unknown as ParentNode, ctx, level + 1))
      }
    } else if (tag === 'pre') {
      // Split highlighted nodes into lines without discarding their colors.
      const temporary = document.createElement('div'); temporary.append(node.cloneNode(true))
      const runs: ParagraphChild[][] = [[]]
      const walk = async (child: Node, style: IRunStylePropertiesOptions = {}): Promise<void> => {
        if (child.nodeType === Node.TEXT_NODE) {
          const lines = (child.textContent || '').split('\n')
          lines.forEach((line, i) => { if (i) runs.push([]); if (line) runs[runs.length - 1].push(new TextRun({ text: line, font: 'Menlo', size: ctx.size, ...style })) })
        } else if (child instanceof Element) {
          const next = { ...style, color: color((child as HTMLElement).style?.color || '') || style.color }
          for (const item of child.childNodes) await walk(item, next)
        }
      }
      await walk(temporary.querySelector('code') || temporary)
      if (!runs[runs.length - 1].length) runs.pop()
      const paragraphs = runs.map(children => new Paragraph({ children: children.length ? children : [new TextRun(' ')], alignment: AlignmentType.LEFT, spacing: { before: 0, after: 0, line: ctx.line, lineRule: LineRuleType.EXACT } }))
      const language = (node as HTMLElement).dataset.language?.trim()
      if (language) paragraphs.push(new Paragraph({ children: [new TextRun({ text: language, font: 'Menlo', size: Math.max(16, Math.round(ctx.size * .8)), color: '8C938F' })], alignment: AlignmentType.RIGHT, spacing: { before: 100, after: 0 } }))
      result.push(blockBox(paragraphs, 'F6F6F4'), blockGap(ctx))
    } else if (tag === 'blockquote') {
      const kind = Object.keys(calloutPalette).find(kind => node.classList.contains(`callout-${kind}`)), palette = kind ? calloutPalette[kind] : { color: '#daddd7', background: '#f6f6f4' }
      const children: Block[] = []
      for (const child of node.children) {
        if (child.tagName === 'BLOCKQUOTE') { children.push(...await blocks({ childNodes: [child] } as unknown as ParentNode, ctx, level + 1)); continue }
        children.push(new Paragraph({ children: await inline(child, ctx, { bold: child.classList.contains('callout-title') }), alignment: AlignmentType.LEFT, spacing: { ...paragraphSpacing(ctx), after: Math.round(ctx.spacing / 2) } }))
      }
      result.push(blockBox(children, palette.background.slice(1), palette.color.slice(1)), blockGap(ctx))
    } else if (/^h[1-6]$/.test(tag)) {
      result.push(new Paragraph({ heading: [HeadingLevel.HEADING_1, HeadingLevel.HEADING_2, HeadingLevel.HEADING_3, HeadingLevel.HEADING_4, HeadingLevel.HEADING_5, HeadingLevel.HEADING_6][Number(tag[1]) - 1], children: await inline(node, ctx, { color: '242926' }) }))
    } else if (tag === 'hr') result.push(new Paragraph({ border: { bottom: { style: 'single', size: 4, color: 'DADDD7' } } }))
    else if (tag === 'img' || node.classList.contains('markart-display-math') || (tag === 'p' && node.querySelector('img'))) result.push(new Paragraph({ children: await inline(node, ctx), alignment: AlignmentType.CENTER, spacing: { ...paragraphSpacing(ctx), line: ctx.line, lineRule: LineRuleType.AT_LEAST } }))
    else if (tag === 'p') result.push(new Paragraph({ children: await inline(node, ctx), alignment: AlignmentType.LEFT, spacing: paragraphSpacing(ctx) }))
    else result.push(...await blocks(node, ctx, level))
  }
  return result
}
export async function htmlToDocx(html: string, title: string, pageSize: 'A4' | 'Letter', marginMm: number): Promise<Uint8Array> {
  const parsed = new DOMParser().parseFromString(html, 'text/html'), preferredFont = parsed.body.dataset.exportFont || 'Arial'
  const font = ['-apple-system', 'system-ui'].includes(preferredFont) ? 'PingFang SC' : preferredFont === 'ui-monospace' ? 'Menlo' : preferredFont
  const ctx: Context = { size: Math.round(Number(parsed.body.dataset.exportFontSize || 16) * 1.5), line: Math.round(Number(parsed.body.dataset.exportFontSize || 16) * 15 * Number(parsed.body.dataset.exportLineHeight || 1.85)), spacing: Math.round(Number(parsed.body.dataset.exportParagraphSpacing || 12) * 15), font, full: parsed.body.classList.contains('table-full'), width: (pageSize === 'A4' ? 11906 : 12240) - Math.round(marginMm * 56.6929) * 2, footnotes: new Map() }, notes: Record<string, { children: Paragraph[] }> = {}
  const items = [...parsed.querySelectorAll('.footnotes li[id]')]
  items.forEach((item, i) => ctx.footnotes.set(item.id, i + 1))
  for (const [i, item] of items.entries()) notes[i + 1] = { children: [new Paragraph({ children: await inline(item, ctx), style: 'FootnoteText', alignment: AlignmentType.LEFT, spacing: { before: 0, after: 0, line: 240, lineRule: LineRuleType.AUTO } })] }
  const children = await blocks(parsed.body, ctx), margin = Math.round(marginMm * 56.6929)
  const document = new Document({ title, creator: 'Markart', footnotes: notes,
    styles: { default: { document: { run: { font, size: ctx.size, color: '242926', snapToGrid: false }, paragraph: { alignment: AlignmentType.LEFT, contextualSpacing: false, spacing: { before: 0, after: ctx.spacing, line: ctx.line, lineRule: LineRuleType.EXACT, beforeAutoSpacing: false, afterAutoSpacing: false } } } }, paragraphStyles: [
      ...Array.from({ length: 6 }, (_, i) => ({ id: `Heading${i + 1}`, name: `Heading ${i + 1}`, basedOn: 'Normal', next: 'Normal', paragraph: { spacing: { before: ctx.spacing, after: ctx.spacing, line: Math.round(ctx.size * [2, 1.6, 1.3, 1.15, 1, 1][i] * 10 * 1.4), lineRule: LineRuleType.EXACT } }, run: { font, bold: true, color: '242926', size: Math.round(ctx.size * [2, 1.6, 1.3, 1.15, 1, 1][i]) } })),
      { id: 'FootnoteText', name: 'Footnote Text', basedOn: 'Normal', run: { font, size: 20, color: '8C938F' } }
    ] },
    numbering: { config: [{ reference: 'ordered', levels: Array.from({ length: 9 }, (_, level) => ({ level, format: LevelFormat.DECIMAL, text: `%${level + 1}.`, style: { paragraph: { indent: { left: (level + 1) * 360, hanging: 240 } } } })) }] },
    sections: [{ properties: { page: { size: { width: pageSize === 'A4' ? 11906 : 12240, height: pageSize === 'A4' ? 16838 : 15840 }, margin: { top: margin, right: margin, bottom: margin, left: margin } } }, children: children.length ? children : [new Paragraph('')] }] })
  return new Uint8Array(await Packer.toArrayBuffer(document))
}
