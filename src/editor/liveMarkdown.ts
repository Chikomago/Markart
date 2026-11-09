import { cleanupPluginMarkdown } from '../plugins/host/markdown'
import { pluginServices } from '../plugins/host/services'
import { t, activeLocale } from '../i18n'
import { mountDiagramNodeControls } from './diagramNodeControls'
import { mountDiagramControls } from './diagramControls'
import { frontmatterSection } from '../documents/frontmatter'
import { FrontmatterWidget } from './frontmatterWidget'
import { EditorState, EditorSelection, StateField, Prec, type Range, type Extension } from '@codemirror/state'
import { Decoration, EditorView, WidgetType, keymap, type DecorationSet } from '@codemirror/view'
import { syntaxTree } from '@codemirror/language'
import { languages } from '@codemirror/language-data'
import { prepareRenderedContent } from './renderedContent'
import DOMPurify from 'dompurify'
import katex from 'katex'
import { mountTableControls } from './tableControls'
import { lexMarkdownBlocks, renderMarkdown } from './renderMarkdown'

export type MarkdownBlock = { from: number; to: number; text: string; type: string }
export function markdownBlocks(source: string): MarkdownBlock[] {
  let offset = 0
  const result: MarkdownBlock[] = []
  for (const token of lexMarkdownBlocks(source)) {
    const from = offset; offset += token.raw?.length || 0
    if (token.type === 'space') continue
    const text = token.raw?.replace(/\n+$/, '') || ''
    if (text) result.push({ from, to: from + text.length, text, type: token.type })
  }
  return result
}
export function isEmptyFencedCode(block: MarkdownBlock): boolean {
  if (block.type !== 'code') return false
  const lines = block.text.split('\n')
  const opening = /^[ \t]*(`{3,}|~{3,})[^\n]*$/.exec(lines[0])
  const closing = /^[ \t]*(`{3,}|~{3,})[ \t]*$/.exec(lines.at(-1) || '')
  return !!opening && !!closing && opening[1][0] === closing[1][0]
    && closing[1].length >= opening[1].length && lines.slice(1, -1).every(line => !line.trim())
}
export function visibleCodePosition(state: EditorState, position: number, previous?: number): number {
  const block = markdownBlocks(state.doc.toString()).find(item => item.type === 'code' && position >= item.from && position <= item.to)
  if (!block || !/^\s*(`{3,}|~{3,})/.test(block.text)) return position
  const start = state.doc.lineAt(block.from), end = state.doc.lineAt(block.to)
  const line = state.doc.lineAt(position)
  if (line.number !== start.number && line.number !== end.number) return position
  if (end.number <= start.number + 1) return block.to < state.doc.length ? block.to + 1 : Math.max(0, block.from - 1)
  if (line.number === start.number) {
    if (previous !== undefined && previous > position && previous <= block.to && block.from > 0) return block.from - 1
    return state.doc.line(start.number + 1).from
  }
  if (previous !== undefined && previous < position && previous >= block.from && block.to < state.doc.length) return block.to + 1
  return state.doc.line(end.number - 1).to
}
export interface LiveOptions {
  editingSyntax?: () => { from: number; to: number } | undefined
  diagramEditing?: boolean
  preview: boolean; numbered: boolean; readOnly: boolean
  images: Record<string, string>; widths: Record<string, number>
  open: (url: string, image?: boolean) => void
}
let diagramSequence = 0
const tableCleanups = new WeakMap<HTMLElement, () => void>()
class HtmlWidget extends WidgetType {
  readonly locale = activeLocale.value
  constructor(readonly block: MarkdownBlock, readonly html: string, readonly options: LiveOptions, readonly supplemental = false, readonly active = false) { super() }
  eq(other: HtmlWidget) { if (this.locale !== other.locale) return false; return this.html === other.html && this.block.from === other.block.from && this.options === other.options && this.supplemental === other.supplemental && this.active === other.active }
  toDOM(view: EditorView) {
    const root = document.createElement('div'); root.className = 'cm-markdown-block cm-native-preview'
    const diagramBlock = this.block.type === 'code' && /^\s*(?:`{3,}|~{3,})(?:mermaid|mindmap)\b/i.test(this.block.text)
    if (diagramBlock) { root.classList.add('cm-diagram-block', 'cm-diagram-pending'); root.setAttribute('aria-busy', 'true') }
    root.contentEditable = 'false'; if (this.active && this.block.type === 'hr') root.classList.add('cm-selected-rule'); root.innerHTML = DOMPurify.sanitize(this.html)
    for (const image of root.querySelectorAll('img')) {
      const source = image.getAttribute('src') || ''
      if (this.options.images[source]) image.src = this.options.images[source]
      if (this.options.widths[source]) image.style.width = `${this.options.widths[source]}px`
      image.addEventListener('load', () => view.requestMeasure())
    }
    root.querySelectorAll<HTMLElement>('pre').forEach(pre => {
      const code = pre.querySelector('code'); if (!code) return
      const copy = document.createElement('button'); copy.className = 'cm-code-copy'; copy.textContent = t('复制')
      copy.addEventListener('click', event => { event.stopPropagation(); void navigator.clipboard.writeText(code.textContent || '').then(() => { copy.textContent = t('已复制') }).catch(() => { copy.textContent = t('复制失败') }) })
      pre.append(copy)
      const label = document.createElement('span'); label.className = 'cm-code-language'; label.textContent = pre.dataset.language || '代码语言'; pre.append(label)
      if (this.options.numbered) {
        const rail = document.createElement('span'); rail.className = 'cm-code-line-numbers'; rail.setAttribute('aria-hidden', 'true')
        for (let i = 1; i <= (code.textContent || '').replace(/\n$/, '').split('\n').length; i++) { const row = document.createElement('span'); row.textContent = String(i); rail.append(row) }
        pre.prepend(rail); pre.classList.add('with-line-numbers')
      }
    })
    for (const table of root.querySelectorAll('table')) { const scroll = document.createElement('div'); scroll.className = 'cm-table-scroll'; table.replaceWith(scroll); scroll.append(table) }
    const markers = [...this.block.text.matchAll(/^\s*(?:[-*+]|\d+\.)\s+\[([ xX])\]/gm)]
    root.querySelectorAll<HTMLInputElement>('input[type="checkbox"]').forEach((checkbox, i) => {
      checkbox.disabled = this.options.readOnly || this.options.preview
      const match = markers[i]; if (!match) return
      checkbox.addEventListener('click', event => {
        event.stopPropagation()
        const from = this.block.from + match.index! + match[0].lastIndexOf('[') + 1
        view.dispatch({ changes: { from, to: from + 1, insert: checkbox.checked ? 'x' : ' ' }, effects: view.scrollSnapshot(), userEvent: 'input' })
      })
    })
    root.addEventListener('click', event => {
      const target = event.target as Element
      if (target.closest('button,input')) return
      const image = target.closest('img'), link = target.closest<HTMLAnchorElement>('a[href]')
      if (!document.getSelection()?.isCollapsed) { event.preventDefault(); return }
      if (image || link) {
        if (link && !image && !event.metaKey && !event.ctrlKey && !link.getAttribute('href')?.startsWith('#')) { event.preventDefault(); return }
        event.preventDefault(); event.stopPropagation()
        const url = image?.src || link!.getAttribute('href') || ''
        if (url.startsWith('#')) {
          const id = decodeURIComponent(url.slice(1)); const destination = view.dom.querySelector<HTMLElement>(`[id="${CSS.escape(id)}"]`)
          destination?.scrollIntoView({ block: 'center' }); return
        }
        this.options.open(url, !!image); return
      }
      if (!this.options.preview && !this.options.readOnly) {
        event.preventDefault()
        if (this.block.type === 'table') {
          const end = this.block.to, source = view.state.doc.toString(), suffix = source.slice(end)
          if (!suffix.trim()) {
            const insert = suffix.endsWith('\n\n') ? '' : suffix.endsWith('\n') ? '\n' : '\n\n'
            view.dispatch({ changes: { from: source.length, insert }, selection: { anchor: source.length + insert.length }, userEvent: 'input', scrollIntoView: true })
          } else view.dispatch({ selection: { anchor: Math.min(end + (source[end] === '\n' ? 1 : 0), source.length) }, scrollIntoView: true })
          view.contentDOM.classList.remove('cm-table-editing'); view.focus(); return
        }
        if (target.closest('hr')) { view.dispatch({ selection: { anchor: this.block.from, head: this.block.to } }); view.focus(); return }
        view.dispatch({ selection: { anchor: this.block.from }, scrollIntoView: true }); view.focus()
      }
    })
    if (this.block.type === 'table' && !this.options.preview && !this.options.readOnly) { const cleanup = mountTableControls(root, this.block.text, this.block.from, view); if (cleanup) tableCleanups.set(root, cleanup) }
    if (this.options.diagramEditing && this.block.type === 'code' && !this.options.preview && !this.options.readOnly) mountDiagramControls(root, this.block.text, this.block.from, view)
    void prepareRenderedContent(root).then(() => {
      if (!root.isConnected) return
      if (diagramBlock) {
        root.classList.remove('cm-diagram-pending'); root.removeAttribute('aria-busy')
        if (!root.querySelector('.cm-mermaid-preview svg')) {
          const error = document.createElement('div'); error.className = 'cm-diagram-error'; error.textContent = t('图表无法渲染，请切换到源码视图检查语法。')
          root.querySelector('pre')?.replaceWith(error)
        }
      }
      if (this.options.diagramEditing && !this.options.preview && !this.options.readOnly) {
        const cleanup = mountDiagramNodeControls(root, this.block.text, this.block.from, view)
        if (cleanup) tableCleanups.set(root, cleanup)
      }
      view.requestMeasure()
    })
    return root
  }
  ignoreEvent() { return true }
  destroy(dom: HTMLElement) { cleanupPluginMarkdown(dom); tableCleanups.get(dom)?.(); tableCleanups.delete(dom) }
}
class InlineWidget extends WidgetType {
  readonly locale = activeLocale.value
  constructor(readonly source: string, readonly from: number, readonly html: string) { super() }
  eq(other: InlineWidget) { if (this.locale !== other.locale) return false; return this.source === other.source && this.from === other.from && this.html === other.html }
  toDOM(view: EditorView) {
    const span = document.createElement('span'); span.className = 'cm-native-inline-widget'; span.innerHTML = DOMPurify.sanitize(this.html); span.contentEditable = 'false'
    span.addEventListener('mousedown', event => { event.preventDefault(); view.dispatch({ selection: { anchor: this.from + 1 } }); view.focus() })
    return span
  }
  ignoreEvent() { return true }
}
class ListMarkerWidget extends WidgetType {
  constructor(readonly marker: string) { super() }
  eq(other: ListMarkerWidget) { return this.marker === other.marker }
  toDOM() {
    const span = document.createElement('span')
    span.className = 'cm-native-list-marker'
    span.textContent = /^[-*+]$/.test(this.marker) ? '•' : this.marker
    span.setAttribute('aria-hidden', 'true')
    return span
  }
  ignoreEvent() { return true }
}
class TaskWidget extends WidgetType {
  readonly locale = activeLocale.value
  constructor(readonly from: number, readonly checked: boolean, readonly disabled: boolean) { super() }
  eq(other: TaskWidget) { if (this.locale !== other.locale) return false; return this.from === other.from && this.checked === other.checked && this.disabled === other.disabled }
  updateDOM(dom: HTMLElement) {
    if (!(dom instanceof HTMLInputElement)) return false
    dom.checked = this.checked; dom.disabled = this.disabled; dom.dataset.taskFrom = String(this.from)
    return true
  }
  toDOM(view: EditorView) {
    const input = document.createElement('input'); input.type = 'checkbox'; input.className = 'cm-native-task'
    this.updateDOM(input)
    input.addEventListener('mousedown', event => event.preventDefault())
    input.addEventListener('click', event => {
      event.stopPropagation()
      const from = Number(input.dataset.taskFrom)
      view.dispatch({ changes: { from: from + 1, to: from + 2, insert: input.checked ? 'x' : ' ' }, effects: view.scrollSnapshot(), userEvent: 'input' })
    })
    return input
  }
  ignoreEvent() { return true }
}
class CodeCopy extends WidgetType {
  readonly locale = activeLocale.value
  constructor(readonly block: MarkdownBlock) { super() }
  eq(other: CodeCopy) { if (this.locale !== other.locale) return false; return this.block.text === other.block.text && this.block.from === other.block.from }
  toDOM() {
    const root = document.createElement('div'); root.className = 'cm-native-code-copy-anchor'; root.contentEditable = 'false'
    const copy = document.createElement('button'); copy.textContent = t('复制'); copy.className = 'cm-native-copy'
    copy.addEventListener('click', () => {
      const lines = this.block.text.split('\n'); lines.shift()
      if (/^\s*(`{3,}|~{3,})\s*$/.test(lines.at(-1) || '') || (this.block.type === 'displayMath' && /^\s*\$\$\s*$/.test(lines.at(-1) || ''))) lines.pop()
      void navigator.clipboard.writeText(lines.join('\n')).then(() => { copy.textContent = t('已复制') }).catch(() => { copy.textContent = t('复制失败') })
    })
    root.append(copy); return root
  }
  ignoreEvent() { return true }
}
class CodeTools extends WidgetType {
  readonly locale = activeLocale.value
  constructor(readonly block: MarkdownBlock, readonly options: LiveOptions) { super() }
  eq(other: CodeTools) { if (this.locale !== other.locale) return false; return this.block.text === other.block.text && this.block.from === other.block.from && this.options === other.options }
  toDOM(view: EditorView) {
    const root = document.createElement('div'); root.className = 'cm-native-code-tools'; root.contentEditable = 'false'
    const match = /^([ \t]*)(`{3,}|~{3,})([^\n]*)/.exec(this.block.text)!
    const language = document.createElement('input'); language.className = 'cm-native-language'; language.value = match[3].trim(); language.placeholder = '代码语言'; language.setAttribute('aria-label', t('代码语言')); language.disabled = this.options.readOnly
    const list = document.createElement('datalist'); list.id = `markart-languages-${++diagramSequence}`
    for (const name of [...new Set(['mermaid', 'mindmap', ...languages.flatMap(item => [item.name.toLowerCase(), ...item.alias])])].sort()) { const option = document.createElement('option'); option.value = name; list.append(option) }
    language.setAttribute('list', list.id)
    // Commit once on blur/Enter so typing a language never destroys the focused input.
    const commit = () => {
      const from = this.block.from + match[1].length + match[2].length
      const value = language.value.trim().replace(/[\r\n]/g, '')
      if (value !== match[3]) view.dispatch({ changes: { from, to: from + match[3].length, insert: value }, userEvent: 'input' })
    }
    language.addEventListener('blur', commit)
    language.addEventListener('keydown', event => { event.stopPropagation(); if (event.key === 'Enter') { event.preventDefault(); commit(); view.focus() } })
    const remove = document.createElement('button'); remove.type = 'button'; remove.className = 'cm-native-code-delete'; remove.textContent = t('删除'); remove.setAttribute('aria-label', t('删除代码块')); remove.disabled = this.options.readOnly
    remove.addEventListener('mousedown', event => event.preventDefault())
    remove.addEventListener('click', event => {
      event.stopPropagation()
      view.dispatch({ changes: { from: this.block.from, to: Math.min(this.block.to + 1, view.state.doc.length), insert: '' }, selection: { anchor: this.block.from }, userEvent: 'delete', scrollIntoView: true })
      view.focus()
    })
    root.append(language, list, remove); return root
  }
  ignoreEvent() { return true }
}
export function nativeSelection(state: EditorState) {
  const { from, to, head } = state.selection.main
  const source = state.doc.toString(), line = state.doc.lineAt(head)
  const block = markdownBlocks(source).find(item => head >= item.from && head <= item.to)
  let kind = /^\s*(#{1,6})\s/.exec(line.text)?.[1].length
  let name = kind ? `h${kind}` : 'p'
  const ids = new Set<string>()
  syntaxTree(state).iterate({ from, to, enter(node) {
    if (node.from > from || node.to < to) return
    const format: Record<string, string> = { StrongEmphasis: 'bold', Emphasis: 'italic', Strikethrough: 'strikethrough', InlineCode: 'code', Link: 'link', Image: 'image', Table: 'table', Blockquote: 'quote', BulletList: 'list', OrderedList: 'ordered-list', HorizontalRule: 'hr', FencedCode: 'code-block' }
    if (format[node.name]) ids.add(format[node.name])
  } })
  if (block) {
    if (block.type === 'code') name = /^\s*(?:`{3,}|~{3,})mindmap\b/i.test(block.text) ? 'mindmap' : /^\s*(?:`{3,}|~{3,})mermaid\b/i.test(block.text) ? (/\bmindmap\s*\n/.test(block.text) ? 'mindmap' : 'mermaid') : 'code-block'
    else if (block.type === 'table') name = 'table'
    else if (block.type === 'displayMath') name = 'formula'
    else if (/^\[\^.+?\]:/.test(block.text)) name = 'footnote'
    else if (block.type === 'blockquote') name = /^>\s*\[!([A-Z]+)\]/.exec(block.text)?.[1] ? `callout-${/^>\s*\[!([A-Z]+)\]/.exec(block.text)![1].toLowerCase()}` : 'quote'
    else if (block.type === 'hr') name = 'hr'
    else if (block.type === 'list') name = /^\s*[-*+]\s+\[[ xX]\]/.test(line.text) ? 'task-list' : /^\s*\d+[.)]\s/.test(line.text) ? 'ordered-list' : 'list'
  }
  for (const match of source.matchAll(/<u>([\s\S]*?)<\/u>|\[\^[^\]\n]+\]|(?<!\$)\$(?!\$)[^\n$]+\$/g)) {
    if (match.index! <= from && match.index! + match[0].length >= to && block?.type !== 'code') { const id = match[0].startsWith('<u>') ? 'underline' : match[0].startsWith('[^') ? 'footnote' : 'formula'; ids.add(id); if (id === 'formula') ids.add('inline-formula') }
  }
  if (name !== 'p') ids.add(name)
  return { text: state.sliceDoc(from, to), from, to, block: name, bold: ids.has('bold'), italic: ids.has('italic'), formatIds: [...ids] }
}

export function liveMarkdown(options: LiveOptions): Extension {
  const visibleSelection = EditorState.transactionFilter.of(transaction => {
    if (options.preview || transaction.docChanged || !transaction.selection || !transaction.newSelection.main.empty) return transaction
    const position = transaction.newSelection.main.head
    const visible = visibleCodePosition(transaction.startState, position, transaction.startState.selection.main.head)
    return visible === position ? transaction : [transaction, { selection: { anchor: visible }, sequential: true }]
  })
  const breaks = Prec.highest(keymap.of([
    { key: 'Backspace', run: deleteEmptyCodeBlock },
    { key: 'Delete', run: deleteEmptyCodeBlock },
    { key: 'Enter', run: view => insertBreak(view, false) },
    { key: 'Shift-Enter', run: view => insertBreak(view, true) }
  ]))
  function deleteEmptyCodeBlock(view: EditorView) {
    if (options.preview || options.readOnly || view.composing) return false
    const source = view.state.doc.toString(), selection = view.state.selection.main
    const block = markdownBlocks(source).find(item => selection.from >= item.from && selection.to <= item.to && isEmptyFencedCode(item))
    if (!block || source.slice(selection.from, selection.to).trim()) return false
    view.dispatch({ changes: { from: block.from, to: Math.min(block.to + 1, source.length), insert: '' }, selection: { anchor: block.from }, userEvent: 'delete', scrollIntoView: true })
    return true
  }
  function insertBreak(view: EditorView, soft: boolean) {
    if (options.preview || options.readOnly || view.composing) return false
    const metadata = frontmatterSection(view.state.doc.toString())
    if (metadata && view.state.selection.main.from < metadata.to) return false
    const kind = nativeSelection(view.state).block
    if (kind !== 'p' && !/^h[1-6]$/.test(kind)) return false
    const { from, to } = view.state.selection.main, insert = soft ? '  \n' : '\n\n'
    const head = from + insert.length
    view.dispatch({ changes: { from, to, insert }, selection: { anchor: head }, userEvent: 'input.type', scrollIntoView: true })
    return true
  }
  function build(state: EditorState): DecorationSet {
    const source = state.doc.toString(), selection = state.selection.main
    const focused = (from: number, to: number) => selection.from <= to && selection.to >= from
    const decorations: Range<Decoration>[] = [], replaced: { from: number; to: number }[] = []
    const add = (from: number, to: number, decoration: Decoration) => { if (to > from) decorations.push(decoration.range(from, to)) }
    const hide = (from: number, to: number) => add(from, to, Decoration.replace({}))
    const mark = (from: number, to: number, className: string, attributes?: Record<string, string>) => add(from, to, Decoration.mark({ class: className, attributes }))
    const frontmatter = frontmatterSection(source)
    if (frontmatter) {
      replaced.push({ from: 0, to: frontmatter.to })
      decorations.push(Decoration.replace({ widget: new FrontmatterWidget(source.slice(0, frontmatter.to), options.readOnly || options.preview), block: true }).range(0, Math.max(0, frontmatter.to - 1)))
    }
    const blocks = markdownBlocks(source)
    for (let index = 1; index < blocks.length; index++) {
      const previous = state.doc.lineAt(blocks[index - 1].to).number
      const next = state.doc.lineAt(blocks[index].from).number
      for (let number = previous + 1; number < next; number++) {
        const line = state.doc.line(number)
        if (!line.text.trim()) decorations.push(Decoration.line({ class: 'cm-native-paragraph-space' }).range(line.from))
      }
    }
    const footnoteLabels = [...new Set([...source.matchAll(/\[\^([^\]\n]+)\](?!:)/g)].map(match => match[1]))]
    if (options.preview) {
      const rendered = document.createElement('div'); rendered.innerHTML = DOMPurify.sanitize(renderMarkdown(source, { showComments: true }))
      const footnotes = rendered.querySelector('section.footnotes'); footnotes?.remove()
      const children = [...rendered.children]; let index = 0, footnoteIndex = 0
      for (const block of blocks) {
        const definition = /^\[[^\]]+\]:/.test(block.text)
        let html = ''
        if (/^\[\^/.test(block.text) && footnotes) {
          if (!footnoteIndex++) { const section = footnotes.cloneNode(true) as HTMLElement; section.querySelector('h2')?.remove(); html = section.outerHTML }
        } else if (!definition) html = children[index++]?.outerHTML || renderMarkdown(block.text, { showComments: true })
        decorations.push(Decoration.replace({ widget: new HtmlWidget(block, html, options), block: true }).range(block.from, block.to))
      }
      return Decoration.set(decorations, true)
    }
    for (const block of blocks) {
      if (frontmatter && block.from < frontmatter.to) continue
      const editing = options.editingSyntax?.()
      if (editing && editing.from < block.to && editing.to > block.from) continue
      if (block.type === 'html' && /^\s*<!--/.test(block.text)) continue
      const active = focused(block.from, block.to)
      const imageHtml = /^\s*!\[[^\]]*\]\(/.test(block.text) ? renderMarkdown(block.text, { showComments: true }) : ''
      const image = /<img\b/i.test(imageHtml)
      const mermaidBlock = /^\s*(?:`{3,}|~{3,})(?:mermaid|mindmap)\b/i.test(block.text)
      const customLanguage=/^\s*(?:`{3,}|~{3,})([\w-]+)/.exec(block.text)?.[1]
      const customBlock=!!customLanguage&&pluginServices.blocks.some(provider=>provider.language===customLanguage)
      const customInline=pluginServices.inlines.some(provider=>provider.pattern&&block.text.includes(provider.pattern))
      const persistent = block.type === 'table' || block.type === 'hr' || (mermaidBlock && options.diagramEditing)
      const complex = customBlock || customInline || ['table', 'blockquote', 'hr', 'html', 'displayMath'].includes(block.type) || image || /^\[\^.+?\]:/.test(block.text)
      if ((complex || mermaidBlock) && (!active || persistent)) {
        let html = renderMarkdown(block.text, { showComments: true })
        if (/^\[\^.+?\]:/.test(block.text)) { const root = document.createElement('div'); root.innerHTML = renderMarkdown(source, { showComments: true }); const section = root.querySelector('.footnotes'); section?.querySelector('h2')?.remove(); const label = /^\[\^(.+?)\]:/.exec(block.text)![1]; const item = section?.querySelector(`[id="footnote-${CSS.escape(encodeURIComponent(label))}"]`); if (section && item) { section.querySelector('ol')!.replaceChildren(item); html = section.outerHTML } }
        decorations.push(Decoration.replace({ widget: new HtmlWidget(block, html, options, false, block.type === 'hr' && active), block: true }).range(block.from, block.to)); replaced.push(block); continue
      }
      if (active && (image || block.type === 'displayMath' || mermaidBlock || customBlock)) {
        decorations.push(Decoration.widget({ widget: new HtmlWidget(block, image ? imageHtml : renderMarkdown(block.text, { showComments: true }), options, true), block: true, side: 2 }).range(block.to))
      }
      if (active && block.type === 'displayMath') {
        const start = state.doc.lineAt(block.from), end = state.doc.lineAt(block.to)
        decorations.push(Decoration.widget({ widget: new CodeCopy(block), block: true, side: -1 }).range(block.from))
        for (let number = start.number; number <= end.number; number++) {
          const line = state.doc.line(number), fence = number === start.number || number === end.number
          decorations.push(Decoration.line({ class: 'cm-native-code-line cm-native-math-source' + (fence ? ' cm-native-math-delimiter' : '') + (number === start.number ? ' cm-native-math-first' : '') + (number === end.number ? ' cm-native-math-last' : ''), attributes: !fence && options.numbered ? { 'data-code-line': String(number - start.number) } : {} }).range(line.from))
        }
        replaced.push(block)
      }
      if (block.type === 'code' && /^\s*(`{3,}|~{3,})/.test(block.text)) {
        const start = state.doc.lineAt(block.from), end = state.doc.lineAt(block.to)
        decorations.push(Decoration.widget({ widget: new CodeCopy(block), block: true, side: -1 }).range(block.from))
        for (let number = start.number; number <= end.number; number++) {
          const line = state.doc.line(number), fence = number === start.number || (number === end.number && /^\s*(`{3,}|~{3,})\s*$/.test(line.text))
          decorations.push(Decoration.line({ class: (fence ? 'cm-native-fence' : 'cm-native-code-line') + (active ? ' cm-native-focused-code' : '') + (number === start.number + 1 ? ' cm-native-code-first' : ''), attributes: !fence && options.numbered ? { 'data-code-line': String(number - start.number) } : {} }).range(line.from))
          if (fence) hide(line.from, line.to)
        }
        decorations.push(Decoration.widget({ widget: new CodeTools(block, options), block: true, side: 1 }).range(block.to))
      }
    }
    const blocked = (from: number, to: number) => replaced.some(range => from >= range.from && to <= range.to)
    syntaxTree(state).iterate({ enter(node) {
      if (blocked(node.from, node.to)) return false
      if (node.name === 'FencedCode' || node.name === 'CodeBlock') return false
      const heading = /^ATXHeading([1-6])$/.exec(node.name)
      if (heading) {
        decorations.push(Decoration.line({ class: `cm-native-heading cm-native-h${heading[1]}` }).range(state.doc.lineAt(node.from).from))
        for (let child = node.node.firstChild; child; child = child.nextSibling) if (child.name === 'HeaderMark') { const end = child.to + (source[child.to] === ' ' ? 1 : 0); hide(child.from, end) }
        return
      }
      const classes: Record<string, string> = { StrongEmphasis: 'cm-native-bold', Emphasis: 'cm-native-italic', Strikethrough: 'cm-native-strike', InlineCode: 'cm-native-inline-code', Link: 'cm-native-link', Image: 'cm-native-image-source' }
      const style = classes[node.name]
      if (style) {
        mark(node.from, node.to, style, node.name === 'Link' ? { get title() { return t('⌘/Ctrl + 单击打开链接') } } : undefined)
        const reveal = !options.readOnly && focused(node.from, node.to)
        if (!reveal && node.name !== 'Image') {
          if (node.name === 'Link') {
            const label = /^\[([^\]]*)\]\(/.exec(source.slice(node.from, node.to))
            if (label) { hide(node.from, node.from + 1); hide(node.from + label[1].length + 1, node.to) }
          } else for (let child = node.node.firstChild; child; child = child.nextSibling) if (['EmphasisMark', 'StrikethroughMark', 'CodeMark'].includes(child.name)) hide(child.from, child.to)
        }
      }
      if (node.name === 'TaskMarker') {
        const line = state.doc.lineAt(node.from), prefix = /^\s*[-*+]\s+/.exec(line.text)
        if (prefix) hide(line.from + (prefix[0].match(/^\s*/)?.[0].length || 0), node.from)
        decorations.push(Decoration.replace({ widget: new TaskWidget(node.from, /x/i.test(source.slice(node.from, node.to)), options.readOnly) }).range(node.from, node.to))
      }
    } })
    for (const block of blocks) {
      if (blocked(block.from, block.to) || block.type === 'code') continue
      if (block.type === 'list') {
        for (let number = state.doc.lineAt(block.from).number; number <= state.doc.lineAt(block.to).number; number++) {
          const line = state.doc.line(number)
          const marker = /^(\s*)([-*+]|\d+[.)])(?=\s)/.exec(line.text)
          if (!marker || /^\s*[-*+]\s+\[[ xX]\]/.test(line.text)) continue
          const from = line.from + marker[1].length
          add(from, from + marker[2].length, Decoration.replace({ widget: new ListMarkerWidget(marker[2]) }))
        }
      }
      for (const match of block.text.matchAll(/<u>([^\n]*?)<\/u>|(?<!\$)\$(?!\$)([^\n$]+)\$|\[\^([^\]\n]+)\]/g)) {
        const from = block.from + match.index!, to = from + match[0].length
        if (!options.readOnly && focused(from, to)) continue
        // Never replace inline syntax inside a code span or a link destination.
        const node = syntaxTree(state).resolveInner(from, 1)
        let code = false
        for (let current = node; current; current = current.parent!) if (['InlineCode', 'URL', 'Image'].includes(current.name)) code = true
        if (code) continue
        if (match[1] !== undefined) { mark(from, to, 'cm-native-underline'); hide(from, from + 3); hide(to - 4, to) }
        else {
          const html = match[2] !== undefined ? katex.renderToString(match[2], { output: 'mathml', throwOnError: false }) : `<sup>${footnoteLabels.indexOf(match[3]) + 1 || DOMPurify.sanitize(match[3])}</sup>`
          add(from, to, Decoration.replace({ widget: new InlineWidget(match[0], from, html) }))
        }
      }
      for (let number = state.doc.lineAt(block.from).number; number <= state.doc.lineAt(block.to).number; number++) {
        const line = state.doc.line(number)
        const className = block.type === 'blockquote' ? 'cm-native-quote' : block.type === 'paragraph' ? 'cm-native-paragraph' : block.type === 'list' ? 'cm-native-list' : ''
        if (className) decorations.push(Decoration.line({ class: className + (/^\s*\//.test(line.text) ? ' cm-native-command-line' : '') }).range(line.from))
      }
    }
    return Decoration.set(decorations, true)
  }
  const presentation = StateField.define<DecorationSet>({
    create: build,
    update(value, transaction) { return transaction.docChanged || transaction.selection || syntaxTree(transaction.startState) !== syntaxTree(transaction.state) ? build(transaction.state) : value },
    provide: field => EditorView.decorations.from(field)
  })
  // Revealing syntax can move text under a stationary pointer. CM's default
  // mouse style compares source positions at the old and new layout, which
  // turns that reflow into a drag. Keep the source anchor until an actual drag.
  const mouse = EditorView.mouseSelectionStyle.of((view, start) => {
    if (options.preview || start.button !== 0 || start.detail !== 1 || start.shiftKey || start.metaKey || start.ctrlKey || start.altKey) return null
    let anchor = view.posAtCoords({ x: start.clientX, y: start.clientY }, false)
    if (anchor == null) return null
    anchor = visibleCodePosition(view.state, anchor)
    let dragging = false
    return {
      get(event) {
        if (Math.hypot(event.clientX - start.clientX, event.clientY - start.clientY) >= 4) dragging = true
        const head = dragging ? visibleCodePosition(view.state, view.posAtCoords({ x: event.clientX, y: event.clientY }, false) ?? anchor!) : anchor!
        return EditorSelection.create([EditorSelection.range(anchor!, head)])
      },
      update(update) { if (update.docChanged) anchor = update.changes.mapPos(anchor!) }
    }
  })
  return [presentation, mouse, visibleSelection, breaks]
}
