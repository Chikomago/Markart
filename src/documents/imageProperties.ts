import { parser } from '@lezer/markdown'

export type ImagePropertyDraft = { from: number; to: number; alt: string; path: string; title: string; width: number | null; original: string }

const imagePattern = /!\[([^\]\n]*)\]\((<[^>\n]+>|[^()\s]+)(?:\s+"([^"\n]*)")?\)(?:\{width=(\d{1,4})px\})?/g

export function localImageSources(source: string): string[] {
  const images = new Set<string>()
  const tree = parser.parse(source)
  tree.iterate({ enter(node) {
    if (node.name !== 'Image') return
    const draft = imageAt(source, node.from)
    if (draft?.from === node.from && draft.path) images.add(draft.path)
  } })
  for (const match of source.matchAll(/<img\b[^>]*\bsrc\s*=\s*(?:"([^"]+)"|'([^']+)')/gi)) images.add(match[1] || match[2])
  return [...images].filter(path => !/^(?:https?:|data:)/i.test(path))
}

export function imageAt(content: string, offset: number): ImagePropertyDraft | null {
  for (const match of content.matchAll(imagePattern)) {
    const from = match.index
    const to = from + match[0].length
    if (offset < from || offset > to) continue
    const path = match[2].startsWith('<') ? match[2].slice(1, -1) : match[2]
    return { from, to, alt: match[1], path, title: match[3] || '', width: match[4] ? Number(match[4]) : null, original: match[0] }
  }
  return null
}

export function renderImageProperties(draft: Pick<ImagePropertyDraft, 'alt' | 'path' | 'title' | 'width'>): string {
  if (draft.alt.includes(']') || /[\r\n]/.test(draft.alt)) throw new Error('图片说明不能包含 ] 或换行')
  if (!draft.path || /[)\r\n]/.test(draft.path)) throw new Error('请填写可用的图片路径')
  if (draft.title.includes('"') || /[\r\n]/.test(draft.title)) throw new Error('图片标题不能包含引号或换行')
  if (draft.width !== null && (!Number.isInteger(draft.width) || draft.width < 16 || draft.width > 2000)) throw new Error('图片宽度需在 16–2000 px 之间')
  const path = /\s/.test(draft.path) ? `<${draft.path}>` : draft.path
  return `![${draft.alt}](${path}${draft.title ? ` "${draft.title}"` : ''})`
}

export function widthExtensionImages(source: string): string {
  const replacements: { from: number; to: number; html: string }[] = []
  const escape = (value: string) => value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  const tree = parser.parse(source)
  tree.iterate({ enter(node) {
    if (node.name !== 'Image') return
    const width = /^\{width=(\d{1,4})px\}/.exec(source.slice(node.to))
    if (!width) return
    const draft = imageAt(source, node.from)
    if (!draft || draft.from !== node.from || draft.to !== node.to + width[0].length) return
    const pixels = Number(width[1])
    if (pixels < 16 || pixels > 2000) return
    replacements.push({ from: node.from, to: draft.to, html: `<img src="${escape(draft.path)}" alt="${escape(draft.alt)}"${draft.title ? ` title="${escape(draft.title)}"` : ''} width="${pixels}">` })
  } })
  for (const replacement of replacements.reverse()) source = source.slice(0, replacement.from) + replacement.html + source.slice(replacement.to)
  return source
}
