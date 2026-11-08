import { EditorState, Prec, type Extension } from '@codemirror/state'
import { syntaxTree } from '@codemirror/language'
import { h, render } from 'vue'
import { keymap } from '@codemirror/view'
import { formatIcons } from './FormatIcon'
import { autocompletion, completionStatus, acceptCompletion, startCompletion, type Completion, type CompletionContext, type CompletionResult, type CompletionSource } from '@codemirror/autocomplete'

export type LinkEntry = { path: string; directory?: boolean }
export type LinkRange = { from: number; to: number; label: string; destination: string; image: boolean; part: 'label' | 'destination'; query: string }
export type LinkSuggestion = LinkEntry & { label: string; destination: string; image?: boolean; website?: boolean }

export function linkRange(source: string, pos: number): LinkRange | null {
  const lineFrom = source.lastIndexOf('\n', pos - 1) + 1
  const lineTo = source.indexOf('\n', pos)
  const line = source.slice(lineFrom, lineTo < 0 ? undefined : lineTo)
  for (const match of line.matchAll(/(!?)\[((?:\\.|[^\]\\\n])*)\]\(([^)\n]*)\)/g)) {
    const from = lineFrom + match.index!, to = from + match[0].length
    // Escaped Markdown and inline code must not trigger suggestions.
    if (from > 0 && source[from - 1] === '\\') continue
    const labelFrom = from + match[1].length + 1, labelTo = labelFrom + match[2].length
    const targetFrom = labelTo + 2, targetTo = to - 1
    if (pos >= labelFrom && pos <= labelTo && !match[3]) {
      return { from, to, label: match[2], destination: match[3], image: !!match[1], part: 'label', query: source.slice(labelFrom, pos) }
    }
    if (pos >= targetFrom && pos <= targetTo) {
      return { from, to, label: match[2], destination: match[3], image: !!match[1], part: 'destination', query: source.slice(targetFrom, pos) }
    }
  }
  return null
}
export function resolveLinkPath(source: string, destination: string): string | null {
  if (/^[a-z][\w+.-]*:/i.test(destination) || destination.startsWith('//')) return null
  let path: string
  try { path = decodeURIComponent(destination.split(/[?#]/)[0]) } catch { return null }
  if (!path) return source
  if (path.includes('\\') || path.includes('\0')) return null
  const parts = path.startsWith('/') ? [] : source.split('/').slice(0, -1)
  for (const part of path.split('/')) {
    if (!part || part === '.') continue
    if (part === '..') { if (!parts.length) return null; parts.pop() } else parts.push(part)
  }
  return parts.join('/')
}
function relativePath(source: string, target: string): string {
  const base = source.split('/').slice(0, -1), parts = target.split('/')
  let common = 0
  while (common < base.length && common < parts.length && base[common] === parts[common]) common++
  return [...Array(base.length - common).fill('..'), ...parts.slice(common)].join('/') || './'
}
function score(query: string, name: string): number {
  const q = query.toLowerCase(), value = name.toLowerCase()
  if (value === q) return 100
  if (value.startsWith(q)) return 80
  const initials = name.replace(/([a-z])([A-Z])/g, '$1 $2').split(/[\s/_.-]+/).map(s => s[0] || '').join('').toLowerCase()
  if (initials.startsWith(q)) return 60
  if (value.includes(q)) return 40
  let at = 0
  for (const char of value) if (q[at] === char) at++
  return at === q.length ? 20 : -1
}
export type LinkSearchRequest = { query: string; folder?: string }
export function linkSearchRequest(query: string, source: string, root = ''): LinkSearchRequest | null {
  if (/^ht(?:t(?:ps?)?)?:?\/{0,2}$/i.test(query) || /^[a-z][\w+.-]*:/i.test(query) || query.startsWith('//')) return null
  let decoded: string
  try { decoded = decodeURIComponent(query) } catch { decoded = query }
  const workspaceRoot = root.replace(/\\/g, '/').replace(/\/$/, '')
  if (workspaceRoot && decoded.startsWith(`${workspaceRoot}/`)) decoded = `/${decoded.slice(workspaceRoot.length + 1)}`
  // A trailing dot segment is navigation even before the user types its slash.
  if (/(?:^|\/)\.{1,2}$/.test(decoded)) decoded += '/'
  const slash = decoded.lastIndexOf('/'), scoped = slash >= 0
  const folder = scoped ? resolveLinkPath(source, decoded.slice(0, slash + 1)) : null
  if (scoped && folder === null) return null
  return { query: scoped ? decoded.slice(slash + 1) : decoded, ...(scoped ? { folder: folder! } : {}) }
}
export function linkSuggestions(query: string, source: string, entries: readonly LinkEntry[], root = ''): LinkSuggestion[] {
  const result: LinkSuggestion[] = []
  if (/^ht(?:t(?:ps?)?)?:?\/{0,2}$/i.test(query)) {
    result.push({ path: 'https://', label: 'https://', destination: 'https://', website: true })
  } else if (/^(?:https?:\/\/|www\.)\S+$/i.test(query) || /^[\w-]+\.[a-z]{2,}(?:\/\S*)?$/i.test(query)) {
    const destination = /^https?:\/\//i.test(query) ? query : `https://${query}`
    result.push({ path: destination, label: destination, destination, website: true, image: /\.(?:png|jpe?g|gif|webp|svg|avif|bmp|ico)(?:[?#]|$)/i.test(destination) })
  }
  const request = linkSearchRequest(query, source, root)
  if (!request) return result
  const scoped = request.folder !== undefined, folder = request.folder, needle = request.query
  const ranked: { item: LinkSuggestion; score: number }[] = []
  const seen = new Set<string>()
  for (const entry of entries) {
    if (entry.path === source || seen.has(entry.path)) continue
    seen.add(entry.path)
    const parts = entry.path.split('/'), name = parts.at(-1) || entry.path
    const parent = parts.slice(0, -1).join('/')
    if (scoped && parent !== folder) continue
    const rank = Math.max(score(needle, name), scoped ? -1 : score(needle, entry.path) - 10)
    if (rank < 0) continue
    const relative = relativePath(source, entry.path)
    ranked.push({ item: { ...entry, label: name, destination: relative + (entry.directory && !relative.endsWith('/') ? '/' : ''), image: !entry.directory && /\.(?:png|jpe?g|gif|webp|svg|avif|bmp|ico)$/i.test(name) }, score: rank + (parent === source.split('/').slice(0, -1).join('/') ? 5 : 0) })
  }
  ranked.sort((a, b) => b.score - a.score || Number(!!b.item.directory) - Number(!!a.item.directory) || a.item.path.localeCompare(b.item.path))
  return [...result, ...ranked.map(({ item }) => item)]
}
function escapeLabel(label: string) { return label.replace(/[\\\[\]]/g, '\\$&') }
function encodeDestination(path: string) {
  if (/^https?:\/\//i.test(path)) return path.replace(/[\s()<>]/g, char => encodeURIComponent(char).replace('(', '%28').replace(')', '%29'))
  return path.split('/').map(part => encodeURIComponent(part).replace(/[()]/g, char => char === '(' ? '%28' : '%29')).join('/')
}
export function linkCompletionChange(range: LinkRange, option: LinkSuggestion) {
  const label = range.part === 'destination' ? range.label : ''
  const editingDestination = !!option.directory || !!option.website && /^https?:\/\/$/i.test(option.destination)
  const title = label || (editingDestination ? '' : escapeLabel(option.label))
  const image = range.image || !!option.image
  const destination = encodeDestination(option.destination)
  const insert = `${image ? '!' : ''}[${title}](${destination})`
  return { from: range.from, to: range.to, insert, anchor: range.from + insert.length - (editingDestination ? 1 : 0), again: !!option.directory }
}
export type LinkCompletionConfig = {
  enabled: () => boolean; source: () => string; entries: () => LinkEntry[]; root: () => string; onAccept?: () => void
  queryEntries?: (request: LinkSearchRequest, source: string, root: string) => Promise<LinkEntry[]>
}
export function createLinkCompletionSource(config: LinkCompletionConfig): CompletionSource {
  let generation = 0
  return function complete(context: CompletionContext): CompletionResult | null | Promise<CompletionResult | null> {
    const requestId = ++generation
    if (!config.enabled() || context.state.readOnly || !context.state.selection.main.empty) return null
    for (let node = syntaxTree(context.state).resolveInner(context.pos, -1); node; node = node.parent!) {
      if (['InlineCode', 'FencedCode', 'CodeBlock', 'CommentBlock', 'HTMLBlock'].includes(node.name)) return null
    }
    const range = linkRange(context.state.doc.toString(), context.pos)
    if (!range || (!range.query && !context.explicit)) return null
    const source = config.source(), root = config.root()
    const current = () => !context.aborted && requestId === generation && config.enabled() && config.source() === source && config.root() === root
    const build = (entries: LinkEntry[]): CompletionResult | null => {
      if (!current()) return null
      const suggestions = linkSuggestions(range.query, source, entries, root)
      if (!suggestions.length) return null
      const options: Completion[] = suggestions.map(option => ({
        label: option.label + (option.directory ? '/' : ''), detail: option.website ? undefined : option.destination,
        type: option.website ? 'url' : option.directory ? 'folder' : option.image ? 'image' : 'file',
        apply(view) {
          const at = linkRange(view.state.doc.toString(), view.state.selection.main.head)
          if (!at || at.from !== range.from || at.query !== range.query || config.source() !== source || config.root() !== root) return
          const change = linkCompletionChange(at, option)
          config.onAccept?.()
          view.dispatch({ changes: { from: change.from, to: change.to, insert: change.insert }, selection: { anchor: change.anchor }, userEvent: 'input.complete' })
          if (change.again) queueMicrotask(() => startCompletion(view))
        }
      }))
      return { from: context.pos - range.query.length, to: context.pos, options, filter: false }
    }
    const request = linkSearchRequest(range.query, source, root)
    if (!request) return build([])
    if (!config.queryEntries) return build(config.entries())
    context.addEventListener('abort', () => {}, { onDocChange: true })
    return config.queryEntries(request, source, root).then(build).catch(() => build([]))
  }
}
export function linkCompletion(config: LinkCompletionConfig): Extension {
  const complete = createLinkCompletionSource(config)
  return [EditorState.languageData.of(() => [{ autocomplete: complete }]),
    autocompletion({ icons: false, addToOptions: [{ position: 10, render(completion) {
      const holder = document.createElement('span')
      const name = ({ url: 'link', folder: 'folder', image: 'image', file: 'open-file' } as Record<string, string>)[completion.type || ''] || 'code'
      render(h(formatIcons[name], { size: 15, 'aria-hidden': true }), holder)
      const icon = holder.firstElementChild!.cloneNode(true) as HTMLElement
      render(null, holder)
      icon.classList.add('link-completion-icon')
      return icon
    } }] }),
    Prec.highest(keymap.of([{ key: 'Tab', run(view) {
      if (!config.enabled()) return false
      if (completionStatus(view.state) === 'active' && acceptCompletion(view)) return true
      const range = linkRange(view.state.doc.toString(), view.state.selection.main.head)
      if (!range || range.part !== 'label') return false
      view.dispatch({ selection: { anchor: range.to - range.destination.length - 1 } })
      return true
    } }]))]

}
