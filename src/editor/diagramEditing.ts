/** Local source edits keep the user's diagram syntax, comments and styling. */
export type DiagramNode = { id: string; label: string }
type Occurrence = { id: string; from: number; to: number; open?: string; close?: string; metadata?: string }
const wrappers = [['(((', ')))'], ['([', '])'], ['[[', ']]'], ['((', '))'], ['{{', '}}'], ['[(', ')]'], ['[/', '/]'], ['[\\', '\\]'], ['[/', '\\]'], ['[\\', '/]'], ['[', ']'], ['(', ')'], ['{', '}'], ['>', ']']]
export const decodeDiagramLabel = (text: string) => text.replace(/&?#(\d+);/g, (_, code: string) => { const value = Number(code); return value <= 0x10ffff ? String.fromCodePoint(value) : _ }).replace(/(?:&|#)(quot|amp|lt|gt);/g, (_, name: string) => ({ quot: '"', amp: '&', lt: '<', gt: '>' })[name] || _)
const escapeLabel = (text: string) => text.replace(/\\/g, '#92;').replace(/"/g, '#quot;').replace(/</g, '#lt;').replace(/>/g, '#gt;').replace(/\r?\n/g, '<br/>')
const escapeMindmapLabel = (text: string) => {
  const escaped = text.replace(/[&"<>\\()[\]{}:%`]/g, char => `#${char.charCodeAt(0)};`).replace(/\r?\n/g, '<br/>')
  return /^mindmap$/i.test(escaped) ? '#109;' + escaped.slice(1) : escaped
}
function lines(source: string) {
  let from = 0
  return source.split('\n').map(text => { const line = { text, from, to: from + text.length }; from += text.length + 1; return line })
}
function occurrences(line: string, ids: Set<string>): Occurrence[] {
  if (/^\s*(?:%%|graph\b|flowchart\b|style\b|classDef\b|class\b|click\b|linkStyle\b|subgraph\b|end\b|direction\b|accTitle\b|accDescr\b)/i.test(line)) return []
  const found: Occurrence[] = []
  for (let at = 0; at < line.length;) {
    if (line.slice(at).startsWith('%%')) break
    if (line[at] === '"' || line[at] === "'" || line[at] === '|') { const quote = line[at++]; while (at < line.length && line[at] !== quote) { if (line[at] === '\\') at++; at++ } at++; continue }
    const match = /^[\p{L}\p{N}_][\p{L}\p{N}_.-]*/u.exec(line.slice(at))
    if (!match) { at++; continue }
    const from = at
    let id = match[0]
    if (!ids.has(id)) id = [...ids].sort((a, b) => b.length - a.length).find(value => id.startsWith(value) && /^[-.]+$/.test(id.slice(value.length))) || id
    at += id.length
    let shapeAt = at; while (line[shapeAt] === ' ' || line[shapeAt] === '\t') shapeAt++
    if (line.startsWith('@{', shapeAt)) {
      let end = shapeAt + 2, depth = 1, quote = ''
      for (; end < line.length; end++) {
        const char = line[end]
        if (char === '\\') { end++; continue }
        if (quote) { if (char === quote) quote = ''; continue }
        if (char === '"' || char === "'") { quote = char; continue }
        if (char === '{') depth++
        if (char === '}' && !--depth) break
      }
      if (end < line.length) { at = end + 1; if (ids.has(id)) found.push({ id, from, to: at, metadata: line.slice(shapeAt, at) }); continue }
    }
    const candidates = wrappers.filter(([open]) => line.startsWith(open, shapeAt))
    const wrapper = candidates.find(([open, close]) => {
      let quoted = false
      for (let i = shapeAt + open.length; i < line.length; i++) {
        if (line[i] === '\\') { if (line.startsWith(close, i) && !quoted) return true; i++; continue }
        if (line[i] === '"') quoted = !quoted
        if (!quoted && line.startsWith(close, i)) return true
        if (!quoted && /[\]})]/.test(line[i])) return false
      }
      return false
    })
    if (wrapper) {
      const [open, close] = wrapper
      let end = shapeAt + open.length, quote = false
      for (; end < line.length; end++) {
        if (!quote && line.startsWith(close, end)) break
        if (line[end] === '\\') { end++; continue }
        if (line[end] === '"') quote = !quote
      }
      if (end < line.length) {
        at = end + close.length
        if (ids.has(id)) found.push({ id, from, to: at, open, close })
        continue
      }
    }
    if (ids.has(id)) found.push({ id, from, to: at })
  }
  return found
}
function insertBeforeFence(source: string, text: string) {
  const end = /\n[ \t]*(?:`{3,}|~{3,})[ \t]*$/.exec(source)?.index ?? source.length
  return source.slice(0, end).replace(/\n*$/, '') + '\n' + text + source.slice(end)
}
export function editFlowNode(source: string, id: string, label: string, nodes: DiagramNode[]): string {
  const ids = new Set(nodes.map(node => node.id)), edits: { from: number; to: number; text: string }[] = []
  for (const line of lines(source)) for (const node of occurrences(line.text, ids)) if (node.id === id && (node.open || node.metadata)) {
    let text = `${id}${node.open}"${escapeLabel(label)}"${node.close}`
    if (node.metadata) {
      const field = /\blabel\s*:\s*(?:"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|[^,}]+)/
      const value = `label: "${escapeLabel(label)}"`
      const metadata = field.test(node.metadata) ? node.metadata.replace(field, value) : node.metadata.slice(0, -1).trimEnd() + (node.metadata.slice(2, -1).trim() ? ', ' : '') + value + '}'
      text = id + metadata
    }
    edits.push({ from: line.from + node.from, to: line.from + node.to, text })
  }
  if (!edits.length) return insertBeforeFence(source, `${id}["${escapeLabel(label)}"]`)
  for (const edit of edits.reverse()) source = source.slice(0, edit.from) + edit.text + source.slice(edit.to)
  return source
}
export const flowNodeShapes = [
  ['rect', '矩形'], ['rounded', '圆角矩形'], ['stadium', '起止'], ['diam', '判断'],
  ['circle', '圆形'], ['dbl-circ', '双圆'], ['subproc', '子流程'], ['cyl', '数据库'],
  ['hex', '六边形'], ['lean-r', '平行四边形'], ['lean-l', '反向平行四边形'],
  ['trap-b', '梯形'], ['trap-t', '倒梯形'], ['odd', '旗形'],
  ['doc', '文件'], ['docs', '多文件'], ['cloud', '云形'], ['delay', '延迟'], ['tri', '三角形'], ['sl-rect', '手动输入'],
] as const
export function flowNodeShape(source: string, id: string) {
  let shape = 'rect'
  const legacy: Record<string, string> = { '[': 'rect', '(': 'rounded', '([': 'stadium', '{': 'diam', '((': 'circle', '(((': 'dbl-circ', '[[': 'subproc', '[(': 'cyl', '{{': 'hex', '[/': 'lean-r', '[\\': 'lean-l', '>': 'odd' }
  for (const line of lines(source)) for (const node of occurrences(line.text, new Set([id]))) {
    if (node.metadata) shape = /\bshape\s*:\s*["']?([\w-]+)/.exec(node.metadata)?.[1] || shape
    else if (node.open) shape = node.open === '[/' && node.close === '\\]' ? 'trap-b' : node.open === '[\\' && node.close === '/]' ? 'trap-t' : legacy[node.open] || shape
  }
  return shape
}
export function setFlowNodeShape(source: string, id: string, shape: string, nodes: DiagramNode[]) {
  if (!flowNodeShapes.some(item => item[0] === shape)) return source
  const edits: { from: number; to: number; text: string }[] = []
  for (const line of lines(source)) for (const node of occurrences(line.text, new Set(nodes.map(item => item.id)))) {
    if (node.id !== id || (!node.open && !node.metadata)) continue
    let metadata = node.metadata
    if (metadata) {
      const field = /\bshape\s*:\s*(?:"[^"\n]*"|'[^'\n]*'|[^,}]+)/
      metadata = field.test(metadata) ? metadata.replace(field, `shape: ${shape}`) : metadata.slice(0, -1).trimEnd() + (metadata.slice(2, -1).trim() ? ', ' : '') + `shape: ${shape}}`
    } else {
      metadata = `@{shape: ${shape}, label: "${escapeLabel(diagramNodeLabel(source, id, false, id))}"}`
    }
    edits.push({ from: line.from + node.from, to: line.from + node.to, text: id + metadata })
  }
  if (!edits.length) return insertBeforeFence(source, `${id}@{shape: ${shape}, label: "${escapeLabel(nodes.find(node => node.id === id)?.label || id)}"}`)
  for (const edit of edits.reverse()) source = source.slice(0, edit.from) + edit.text + source.slice(edit.to)
  return source
}
export function addFlowNode(source: string, label: string, nodes: DiagramNode[], parent?: string) {
  const ids = new Set(nodes.map(node => node.id)); let index = 1
  while (ids.has(`node_${index}`)) index++
  const id = `node_${index}`
  return { id, source: insertBeforeFence(source, `${id}["${escapeLabel(label)}"]${parent ? `\n${parent} --> ${id}` : ''}`) }
}
/** Keep node definitions when disconnecting a chain or grouped edge. */
export function flowConnections(source: string, nodes: DiagramNode[]) {
  const ids = new Set(nodes.map(node => node.id))
  return lines(source).flatMap(line => {
    const items = occurrences(line.text, ids), groups: Occurrence[][] = []
    for (const item of items) {
      const group = groups[groups.length - 1], previous = group?.[group.length - 1]
      if (previous && line.text.slice(previous.to, item.from).trim() === '&') group.push(item)
      else groups.push([item])
    }
    return groups.slice(1).flatMap((right, index) => {
      const left = groups[index], connector = line.text.slice(left[left.length - 1].to, right[0].from)
      if (!/^\s*(?:(?:[<ox]?[=-]+[>ox]?)|(?:[<ox]?-[.]+-[>ox]?))(?:\s*\|[^|]*\|)?\s*$/.test(connector) && !/^\s*--\s+.+?\s+-->\s*$/.test(connector)) return []
      return left.flatMap(start => right.map(end => ({ start: start.id, end: end.id, connector, line, items })))
    })
  })
}
export function connectFlowNodes(source: string, start: string, end: string, nodes: DiagramNode[]) {
  if (!nodes.some(node => node.id === start) || !nodes.some(node => node.id === end)) return source
  if (flowConnections(source, nodes).some(edge => edge.start === start && edge.end === end)) return source
  return insertBeforeFence(source, `${start} --> ${end}`)
}
export function disconnectFlowNodes(source: string, start: string, end: string, nodes: DiagramNode[]) {
  const edges = flowConnections(source, nodes), affected = new Set(edges.filter(edge => edge.start === start && edge.end === end).map(edge => edge.line.from))
  if (!affected.size) return source
  if (/^\s*linkStyle\s+/m.test(source)) throw Error('indexed-edge-style')
  return lines(source).map(line => {
    if (!affected.has(line.from)) return line.text
    const onLine = edges.filter(edge => edge.line.from === line.from), items = onLine[0].items
    // Leave unsupported mixed statements intact rather than discard user syntax.
    if (items.some((item, index) => index && /;|:::/.test(line.text.slice(items[index - 1].to, item.from)))) throw Error('mixed-edge-statement')
    const definitions = items.map(item => line.text.slice(item.from, item.to))
    const remaining = onLine.filter(edge => edge.start !== start || edge.end !== end).map(edge => edge.start + edge.connector + edge.end)
    const tail = line.text.slice(items[items.length - 1].to), comment = tail.indexOf('%%')
    if (tail.replace(/%%.*$/, '').trim().replace(/;$/, '').trim()) throw Error('mixed-edge-statement')
    return [...new Set(definitions), ...remaining, ...(comment >= 0 ? [tail.slice(comment)] : [])].map(text => (line.text.match(/^\s*/)?.[0] || '') + text).join('\n')
  }).join('\n')
}
export function deleteFlowNode(source: string, id: string, nodes: DiagramNode[]): string {
  const ids = new Set(nodes.map(node => node.id))
  return lines(source).flatMap(line => {
    if (new RegExp(`^\\s*(?:style|click)\\s+${id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?:\\s|$)`).test(line.text)) return []
    const classLine = /^(\s*class\s+)([^\s]+)(\s+.*)$/.exec(line.text)
    if (classLine) { const remaining = classLine[2].split(',').filter(value => value !== id); return remaining.length ? [classLine[1] + remaining.join(',') + classLine[3]] : [] }
    let text = line.text
    const original = occurrences(text, ids), groupEdits: { from: number; to: number }[] = []
    original.forEach((node, index) => {
      if (node.id !== id) return
      const previous = original[index - 1], next = original[index + 1]
      if (previous && text.slice(previous.to, node.from).trim() === '&') groupEdits.push({ from: previous.to, to: node.to })
      else if (next && text.slice(node.to, next.from).trim() === '&') groupEdits.push({ from: node.from, to: next.from })
    })
    for (const edit of groupEdits.reverse()) text = text.slice(0, edit.from) + text.slice(edit.to)
    const nodes = occurrences(text, ids)
    if (!nodes.some(node => node.id === id)) return [text]
    // Removing a middle node removes its incident edges, rather than joining its neighbours.
    const chunks: string[] = []; let start = -1, last: Occurrence | undefined
    for (const node of nodes) {
      if (node.id === id) { if (start >= 0 && last) chunks.push(text.slice(start, last.to)); start = -1; last = undefined }
      else { if (start < 0) start = node.from; last = node }
    }
    if (start >= 0 && last) chunks.push(text.slice(start, last.to))
    return chunks.flatMap(chunk => {
      const items = occurrences(chunk, ids), grouped = items.length > 1 && items.slice(1).every((node, index) => chunk.slice(items[index].to, node.from).trim() === '&')
      return (grouped ? items.map(node => chunk.slice(node.from, node.to)) : [chunk]).map(value => (text.match(/^\s*/)?.[0] || '') + value)
    })
  }).join('\n')
}
export function mindmapNodes(source: string) {
  return lines(source).filter(line => line.text.trim() && !/^\s*(?:`{3,}|~{3,}|mindmap\s*$|%%|::)/.test(line.text)).map((line, index) => ({ ...line, id: `node${index}`, indent: line.text.match(/^[ \t]*/)?.[0] || '' }))
}
export function editMindmapNode(source: string, id: string, label: string) {
  const node = mindmapNodes(source).find(node => node.id === id)
  if (!node) return source
  const value = node.text.slice(node.indent.length), openAt = value.search(/[\[({]/)
  const wrapper = openAt >= 0 ? wrappers.find(([open, close]) => value.startsWith(open, openAt) && value.endsWith(close)) : undefined
  const text = wrapper ? value.slice(0, openAt) + wrapper[0] + escapeMindmapLabel(label) + wrapper[1] : escapeMindmapLabel(label)
  return source.slice(0, node.from) + node.indent + text + source.slice(node.to)
}
export function addMindmapNode(source: string, id: string, label: string, sibling = false) {
  const nodes = mindmapNodes(source), index = nodes.findIndex(node => node.id === id), node = nodes[index]
  if (!node) return { source, id }
  let next = index + 1
  while (next < nodes.length && nodes[next].indent.length > node.indent.length) next++
  const at = next < nodes.length ? nodes[next].from : (/\n[ \t]*(?:`{3,}|~{3,})[ \t]*$/.exec(source)?.index ?? source.length)
  const indent = sibling ? node.indent : nodes[index + 1]?.indent.length > node.indent.length ? nodes[index + 1].indent : node.indent + '  '
  const before = source.slice(0, at), prefix = before.endsWith('\n') ? '' : '\n'
  return { source: before + prefix + indent + escapeMindmapLabel(label) + '\n' + source.slice(at).replace(/^\n/, ''), id: `node${next}` }
}
export function deleteMindmapNode(source: string, id: string) {
  const nodes = mindmapNodes(source), index = nodes.findIndex(node => node.id === id), node = nodes[index]
  if (!node) return source
  if (!index) return ''
  let next = index + 1
  while (next < nodes.length && nodes[next].indent.length > node.indent.length) next++
  const end = next < nodes.length ? nodes[next].from : (/\n[ \t]*(?:`{3,}|~{3,})[ \t]*$/.exec(source)?.index ?? source.length)
  return source.slice(0, node.from).replace(/\n?$/, '\n') + source.slice(end).replace(/^\n/, '')
}

export async function validateDiagramEdit(source: string): Promise<void> {
  if (!source.trim()) return
  const opening = /^\s*(`{3,}|~{3,})([^\n]*)\n/.exec(source)
  let body = opening ? source.slice(opening[0].length).replace(/\n[ \t]*(?:`{3,}|~{3,})[ \t]*$/, '') : source
  if (opening?.[2].trim().toLowerCase() === 'mindmap' && !/^\s*mindmap\b/.test(body)) body = 'mindmap\n' + body
  const { default: engine } = await import('mermaid')
  await engine.parse(body, { suppressErrors: false })
}

export function diagramNodeLabel(source: string, id: string, mindmap: boolean, fallback: string): string {
  const unquote = (text: string) => text.trim().replace(/^(['"])([\s\S]*)\1$/, '$2').replace(/<br\s*\/?>(?:\n)?/gi, '\n')
  if (mindmap) {
    const node = mindmapNodes(source).find(node => node.id === id)
    if (!node) return fallback
    const value = node.text.trim(), start = value.search(/[\[({]/), wrapper = start >= 0 ? wrappers.find(([open, close]) => value.startsWith(open, start) && value.endsWith(close)) : undefined
    return decodeDiagramLabel(unquote(wrapper ? value.slice(start + wrapper[0].length, -wrapper[1].length) : value))
  }
  let label: string | undefined
  for (const line of lines(source)) for (const node of occurrences(line.text, new Set([id]))) if (node.id === id) {
    if (node.metadata) label = /\blabel\s*:\s*("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|[^,}]+)/.exec(node.metadata)?.[1] || label
    else if (node.open) { const value = line.text.slice(node.from + id.length, node.to).trimStart(); label = value.slice(node.open.length, -node.close!.length) }
  }
  return label === undefined ? fallback : decodeDiagramLabel(unquote(label))
}
