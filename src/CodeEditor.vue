<script setup lang="ts">
import { pluginServices } from './plugins/host/services'
import { rendererChoices } from './plugins/host/markdown'

import { linkCompletion, linkRange } from './editor/linkCompletion'
import { pluginRuntime } from './plugins/runtime'
import { pluginEditorExtensions } from './editor/pluginExtensions'
import { applyPluginChanges } from './editor/pluginEdits'
import type { PluginTextEdit } from './plugins/host/types'
import type { PluginAction } from './plugins/host/types'
import { t, activeLocale } from './i18n'

import { onBeforeUnmount, onMounted, ref, watch, nextTick } from 'vue'
import { EditorView, lineNumbers } from '@codemirror/view'
import { editorSetup } from './editor/editorSetup'
import { EditorState, Compartment, Transaction, StateEffect, Prec } from '@codemirror/state'
import { undo as cmUndo, redo as cmRedo } from '@codemirror/commands'
import { markdown } from '@codemirror/lang-markdown'
import { search } from '@codemirror/search'
import { documentMatches, type FindMatch } from './editor/documentSearch'
import { languages } from '@codemirror/language-data'
import { syntaxTree, forceParsing, foldable, foldedRanges, foldEffect, unfoldEffect, codeFolding } from '@codemirror/language'
import { GFM } from '@lezer/markdown'
import DOMPurify from 'dompurify'
import TurndownService from 'turndown'
import { invoke, isTauri } from '@tauri-apps/api/core'
import { ChevronRight, ArrowUp, ArrowDown, RotateCcw, X } from 'lucide-vue-next'
import FormatIcon from './editor/FormatIcon'
import { markdownMarkers } from './editor/formatPresentation'
import { liveMarkdown, markdownBlocks, nativeSelection } from './editor/liveMarkdown'
import { retainedDocument, retainDocument } from './editor/documentStates'
import { headingsOf } from './editor/markdownCore'
import { matchingSlashCommands as builtinSlashCommands, slashRange, slashCommandChange, slashKeywordMatches, type SlashCommand } from './editor/slashCommands'
import { wordAtCaret } from './editor/wordAtCaret'
import { defaultTable } from './editor/tableDefaults'
import { frontmatterSection } from './documents/frontmatter'
import type { FileKind } from './files/fileFormats'
const props = withDefaults(defineProps<{
  layoutKey?: string; docId: string; modelValue: string; rich: boolean; fileKind: FileKind
  typewriter?: boolean; focusMode?: boolean; readOnly?: boolean
  showBlockControls?: boolean; keepPreviewRendered?: boolean; previewOnly?: boolean; bodyLineNumbers?: boolean; codeBlockLineNumbers?: boolean; diagramVisualEditing?: boolean
  linkFiles?: string[]; linkDirectories?: string[]; workspaceRoot?: string
  relativePath?: string; attachmentDirectory?: string; clipboardDirectory?: string
  attachmentNaming?: string; imageData?: Record<string, string>; imageWidths?: Record<string, number>
}>(), { showBlockControls: true })
const emit = defineEmits<{
  'update:modelValue': [value: string]; scroll: [element: HTMLElement]; 'user-scroll': []
  selection: [info: { text: string; from: number; to: number; block: string; bold: boolean; italic: boolean; formatIds: string[] }]
  'fold-change': [info: { collapsed: number[]; foldable: number[] }]
  focus: []; blur: []; error: [message: string]; 'open-link': [target: string]
}>()
const host = ref<HTMLElement | null>(null)
const findOpen = ref(false), findText = ref(''), replaceText = ref('')
const findCase = ref(false), findRegexp = ref(false), findWildcard = ref(false), findIgnoreSpaces = ref(false), findIgnorePunctuation = ref(false), findWidth = ref(false), findStatus = ref('')
let findMatches: FindMatch[] = []
const findInput = ref<HTMLInputElement | null>(null)
const slashMenu = ref<HTMLElement | null>(null), slashPosition = ref({ left: '0px', top: '0px' })
const slashOpen = ref(false), slashQuery = ref(''), slashIndex = ref(0)
const previewImageSrc = ref(''), previewImageZoom = ref(1), previewImageSize = ref('')
const readOnly = new Compartment(), editable = new Compartment(), language = new Compartment(), rendering = new Compartment()
let view: EditorView | null = null
let insertedSyntax: { from: number; to: number } | undefined
function revealInsertion(from: number, to: number) { insertedSyntax = { from, to }; view?.dispatch({ effects: rendering.reconfigure(richExtension()) }) }
function openResource(url: string, image = false) {
  if (image || /\.(?:png|jpe?g|gif|webp|svg|avif|bmp)(?:[?#]|$)/i.test(url)) {
    previewImageSrc.value = props.imageData?.[url] || url; previewImageZoom.value = 1; previewImageSize.value = ''; return
  }
  if (!/^https?:\/\//i.test(url)) { emit('open-link', url); return }
  if (isTauri()) void invoke('open_external_url', { url }).catch(error => emit('error', t('打开链接失败：{0}', { '0': String(error) })))
  else window.open(url, '_blank', 'noopener,noreferrer')
}
function localLinkEntries() {
  return [...(props.linkDirectories || []).map(path => ({ path, directory: true })), ...(props.linkFiles || []).map(path => ({ path }))]
}
let linkIndexUnavailable = false
async function queryLinkEntries(request: { query: string; folder?: string }, source: string, root: string) {
  if (!isTauri() || !root) return localLinkEntries()
  try {
    const result = await invoke<import('./editor/linkCompletion').LinkEntry[]>('query_link_completions', { root, source, query: request.query, folder: request.folder ?? null })
    linkIndexUnavailable = false
    return result
  } catch (error) {
    if (!linkIndexUnavailable) console.warn('Link index query:', error)
    linkIndexUnavailable = true
    return localLinkEntries()
  }
}
function richExtension() {
  return props.rich && props.fileKind === 'markdown' ? liveMarkdown({ preview: !!props.previewOnly, diagramEditing: !!props.diagramVisualEditing,
    editingSyntax: () => insertedSyntax, numbered: !!props.codeBlockLineNumbers, readOnly: !!props.readOnly, images: props.imageData || {}, widths: props.imageWidths || {}, open: openResource }) : []
}
function markdownLanguage() { return props.fileKind === 'markdown' ? markdown({ extensions: [GFM], codeLanguages: languages }) : [] }
function currentBlock() { return view && markdownBlocks(view.state.doc.toString()).find(block => view!.state.selection.main.head >= block.from && view!.state.selection.main.head <= block.to) }
function onEmbeddedFocus(event: FocusEvent) {
  if (!(event.target instanceof Element) || !event.target.closest('.cm-table-cell-input,.cm-table-link-panel,.cm-diagram-editable-node,.cm-diagram-editable-edge,.cm-diagram-label-editor input')) return
  emit('focus'); reportSelection()
}
function reportSelection() {
  if (!view || props.previewOnly) return
  emit('selection', nativeSelection(view.state))
  const slash = linkRange(view.state.doc.toString(), view.state.selection.main.head) ? null : slashRange(view.state.doc.toString(), view.state.selection.main.head)
  if (slashQuery.value !== (slash?.query || '')) slashIndex.value = 0
  slashOpen.value = !!slash && !props.readOnly; slashQuery.value = slash?.query || ''; if (slashOpen.value) positionSlashMenu()
}
let pointerStart: { x: number; y: number } | null = null
function onSourceClick(event: MouseEvent) {
  if ((!event.metaKey && !event.ctrlKey) || !view || !props.rich || props.previewOnly || !view.state.selection.main.empty || !document.getSelection()?.isCollapsed) return false
  if (pointerStart && Math.hypot(event.clientX - pointerStart.x, event.clientY - pointerStart.y) > 4) return false
  if (!(event.target as Element).closest('.cm-native-link')) return false
  const at = view.posAtCoords({ x: event.clientX, y: event.clientY }); if (at == null) return false
  const line = view.state.doc.lineAt(at)
  for (const match of line.text.matchAll(/!?\[([^\]]*)\]\(([^\s)]+)(?:\s+"[^"]*")?\)/g)) {
    if (at >= line.from + match.index! && at <= line.from + match.index! + match[0].length) {
      event.preventDefault(); openResource(match[2], match[0].startsWith('!')); return true
    }
  }
  return false
}
function onSourceMouseDown(event: MouseEvent) {
  pointerStart = { x: event.clientX, y: event.clientY }
  if (!view || !props.rich || props.previewOnly || props.readOnly || event.button !== 0) return false
  const source = view.state.doc.toString(), block = markdownBlocks(source).at(-1)
  if (block?.type !== 'table' || source.slice(block.to).includes('\n\n')) return false
  const table = [...view.dom.querySelectorAll('table')].at(-1)
  if (!table || event.clientY <= table.getBoundingClientRect().bottom || (event.target as Element).closest('.cm-table-toolbar,.cm-table-delete')) return false
  event.preventDefault()
  const insert = source.endsWith('\n') ? '\n' : '\n\n'
  view.dispatch({ changes: { from: source.length, insert }, selection: { anchor: source.length + insert.length }, userEvent: 'input', scrollIntoView: true })
  view.contentDOM.classList.remove('cm-table-editing'); view.focus(); return true
}
function selectRange(from: number, length: number) {
  if (!view) return
  const at = Math.max(0, Math.min(from, view.state.doc.length))
  view.dispatch({ selection: { anchor: at, head: Math.min(at + length, view.state.doc.length) }, scrollIntoView: true })
  view.focus(); reportSelection()
}

function applyPluginEdits(documentId: string, expectedContent: string, edits: PluginTextEdit[], selection?: {from:number;to:number}): true | 'not-active' | 'not-editable' | 'stale-revision' {
  if (props.docId !== documentId) return 'not-active'
  if (!view || props.readOnly || props.previewOnly) return 'not-editable'
  return applyPluginChanges(view, expectedContent, edits, selection)
}

function replaceRange(from: number, to: number, text: string) {
  if (!view || props.readOnly || props.previewOnly) return
  view.dispatch({ userEvent: 'input', changes: { from, to, insert: text }, selection: { anchor: from + text.length }, scrollIntoView: true })
}
function insertSnippet(text: string) {
  if (!view || props.readOnly || props.previewOnly) return
  const selection = view.state.selection.main
  replaceRange(selection.from, selection.to, text)
}

function currentLine() { return view?.state.doc.lineAt(view.state.selection.main.head) }
function currentBlockText() { return currentBlock()?.text || currentLine()?.text || '' }

function insertParagraph(where: 'before' | 'after') {
  const block = currentBlock(), line = currentLine(); if (!line) return
  const at = where === 'before' ? block?.from ?? line.from : block?.to ?? line.to
  replaceRange(at, at, '\n\n')
}

function deleteCurrentBlock() {
  const block = currentBlock(), line = currentLine(); if (!view || !line) return
  replaceRange(block?.from ?? line.from, Math.min((block?.to ?? line.to) + 1, view.state.doc.length), '')
}

function deleteSelection() { insertSnippet('') }

function wrap(left: string, right = left) {
  if (!view) return
  let { from, to } = view.state.selection.main
  const originalCaret = from
  let expandedWord = false
  const source = view.state.doc.toString()
  if (left === '<u>') {
    const underline = [...source.matchAll(/<u>([^\n]*?)<\/u>/g)].find(match => match.index! <= from && match.index! + match[0].length >= to)
    if (underline) {
      const start = underline.index!, end = start + underline[0].length, length = underline[1].length
      view.dispatch({ changes: [{ from: start, to: start + 3, insert: '' }, { from: end - 4, to: end, insert: '' }], selection: { anchor: Math.min(start + length, Math.max(start, from - 3)), head: Math.min(start + length, Math.max(start, to - 3)) }, userEvent: 'input' }); return
    }
  }
  if (left === '$') {
    const math = [...source.matchAll(/(?<!\$)\$(?!\$)[^\n$]+\$/g)].find(match => match.index! <= from && match.index! + match[0].length >= to)
    if (math) {
      const start = math.index!, end = start + math[0].length
      view.dispatch({ changes: [{ from: start, to: start + 1, insert: '' }, { from: end - 1, to: end, insert: '' }], selection: { anchor: Math.max(start, from - 1), head: Math.min(end - 2, Math.max(start, to - 1)) }, userEvent: 'input' }); return
    }
  }
  const types: Record<string, string> = { '**': 'StrongEmphasis', '*': 'Emphasis', '~~': 'Strikethrough', '`': 'InlineCode' }
  let node = syntaxTree(view.state).resolveInner(from, 1)
  while (node.parent && node.name !== types[left]) node = node.parent
  if (types[left] && node.name === types[left] && node.to >= to) {
    const text = source.slice(node.from + left.length, node.to - right.length)
    view.dispatch({ changes: { from: node.from, to: node.to, insert: text }, selection: { anchor: Math.max(node.from, from - left.length), head: Math.min(node.from + text.length, Math.max(node.from, to - left.length)) }, userEvent: 'input' }); return
  }
  if (!types[left] && source.slice(from - left.length, from) === left && source.slice(to, to + right.length) === right) {
    view.dispatch({ changes: [{ from: from - left.length, to: from, insert: '' }, { from: to, to: to + right.length, insert: '' }], selection: { anchor: from - left.length, head: to - left.length }, userEvent: 'input' }); return
  }
  if (from === to && (types[left] || left === '<u>')) {
    let context = syntaxTree(view.state).resolveInner(from, -1), plain = true
    for (let current: typeof context | null = context; current; current = current.parent) {
      if (['FencedCode', 'CodeBlock', 'Image', 'URL', 'HTMLTag', 'ProcessingInstruction'].includes(current.name)) { plain = false; break }
    }
    if (plain) {
      const line = view.state.doc.lineAt(from), word = wordAtCaret(line.text, from - line.from)
      if (word) { from = line.from + word.from; to = line.from + word.to; expandedWord = true }
    }
  }
  const text = source.slice(from, to)
  view.dispatch({ changes: { from, to, insert: left + text + right }, selection: expandedWord ? { anchor: originalCaret + left.length } : { anchor: from + left.length, head: from + left.length + text.length }, userEvent: 'input' })
  revealInsertion(from, from + left.length + text.length + right.length)
}
async function format(command: string, value?: string) {
  if (props.readOnly || props.previewOnly) return
  if (command === 'bold') wrap('**')
  else if (command === 'italic') wrap('*')
  else if (command === 'strikethrough') wrap('~~')
  else if (command === 'code') wrap('`')
  else if (command === 'underline') wrap('<u>', '</u>')
  else if (command === 'comment') wrap('<!-- ', ' -->')
  else if (command === 'inline-formula') wrap('$')
  else if (command === 'format-document' && view) {
    const target = view, original = target.state.doc.toString()
    try {
      const [{ format }, markdownPlugin, yamlPlugin] = await Promise.all([import('prettier/standalone'), import('prettier/plugins/markdown'), import('prettier/plugins/yaml')])
      const formatted = await format(original, { parser: 'markdown', plugins: [markdownPlugin, yamlPlugin], proseWrap: 'preserve', tabWidth: 2 })
      if (view !== target || target.state.doc.toString() !== original || formatted === original) return
      target.dispatch({ changes: { from: 0, to: original.length, insert: formatted }, selection: { anchor: Math.min(target.state.selection.main.head, formatted.length) }, effects: target.scrollSnapshot(), userEvent: 'input' })
    } catch (error) { emit('error', t('格式化失败：{0}', { '0': String(error) })) }
  }
  else if ((command === 'link' || command === 'image') && view) {
    const { from, to } = view.state.selection.main
    const text = view.state.sliceDoc(from, to)
    const prefix = command === 'image' ? '![' : '['
    const insert = `${prefix}${text}](${value || ''})`
    view.dispatch({ changes: { from, to, insert }, selection: { anchor: from + prefix.length, head: from + prefix.length + text.length }, userEvent: 'input' })
    revealInsertion(from, from + insert.length)
    view.focus()
  }
  else if (command === 'quote') applyBlock('quote')
}
function applyBlock(style: string) {
  if (props.readOnly || props.previewOnly) return
  if (style === 'frontmatter' && view) {
    if (!frontmatterSection(view.state.doc.toString())) replaceRange(0, 0, '---\ntitle: \"\"\n---\n\n')
    void nextTick(() => view?.dom.querySelector<HTMLInputElement>('.frontmatter-input')?.focus())
    return
  }
  if (style === 'footnote' && view) {
    const source = view.state.doc.toString(), selection = view.state.selection.main
    let number = 1; while (source.includes(`[^${number}]`)) number++
    const reference = `[^${number}]`, definition = `\n\n[^${number}]: 脚注内容`
    const insert = selection.to === source.length ? reference + definition : reference
    const changes = [{ from: selection.from, to: selection.to, insert }]
    if (selection.to !== source.length) changes.push({ from: source.length, to: source.length, insert: definition })
    view.dispatch({ changes, selection: { anchor: selection.from + reference.length }, userEvent: 'input' }); return
  }
  const line = currentLine(); if (!line || props.readOnly) return
  const clean = line.text.replace(/^\s{0,3}(?:#{1,6}\s+|>\s*|[-*+]\s+|\d+\.\s+)/, '')
  const inserts: Record<string, string> = {
    quote: '> ' + clean, list: '- ' + clean, 'ordered-list': '1. ' + clean, 'task-list': '- [ ] ' + clean,
    table: defaultTable + '\n\n', code: '```\n代码\n```', mermaid: '```mermaid\ngraph TD\n  A[开始] --> B[结束]\n```', mindmap: '```mindmap\n  root((主题))\n    分支一\n    分支二\n```', formula: '$$\n公式\n$$',
    footnote: '[^1]\n\n[^1]: 脚注内容', hr: '---',
    'callout-tip': '> [!TIP]\n> 提示内容', 'callout-note': '> [!NOTE]\n> 备注内容',
    'callout-important': '> [!IMPORTANT]\n> 重要内容', 'callout-warning': '> [!WARNING]\n> 警告内容',
    'callout-caution': '> [!CAUTION]\n> 注意内容'
  }
  const next = /^h[1-6]$/.test(style) ? `${'#'.repeat(Number(style[1]))} ${clean}` : style === 'p' || style === 'clear' ? clean : inserts[style]
  if (next !== undefined) replaceRange(line.from, line.to, next)
}
function jumpHeading(index: number) { const heading = headingsOf(view?.state.doc.toString() || '')[index]; if (heading) selectRange(heading.offset, 0) }
function headingFoldRanges() {
  if (!view) return []
  forceParsing(view, view.state.doc.length, 100)
  return headingsOf(view.state.doc.toString()).map(heading => {
    const line = view!.state.doc.lineAt(heading.offset)
    return foldable(view!.state, line.from, line.to)
  })
}
function reportHeadingFolds(state: EditorState) {
  const collapsed: number[] = [], available: number[] = []
  const folded = new Map<number, number>()
  foldedRanges(state).between(0, state.doc.length, (from, to) => { folded.set(from, to) })
  headingsOf(state.doc.toString()).forEach((heading, index) => {
    const line = state.doc.lineAt(heading.offset), range = foldable(state, line.from, line.to)
    if (!range) return
    available.push(index)
    if (folded.get(range.from) === range.to) collapsed.push(index)
  })
  emit('fold-change', { collapsed, foldable: available })
}
function toggleHeadingFold(index: number) {
  if (!view) return
  const range = headingFoldRanges()[index]
  if (!range) return
  let folded = false
  foldedRanges(view.state).between(range.from, range.from, (from, to) => { if (from === range.from && to === range.to) folded = true })
  setHeadingFold(index, !folded)
}
function setHeadingFold(index: number, folded: boolean) {
  if (!view) return
  const range = headingFoldRanges()[index]
  if (!range) return
  let current = false
  foldedRanges(view.state).between(range.from, range.from, (from, to) => { if (from === range.from && to === range.to) current = true })
  if (current !== folded) view.dispatch({ effects: (folded ? foldEffect : unfoldEffect).of(range) })
}
function setHeadingFolds(indices: number[]) {
  if (!view) return
  const wanted = new Set(indices), current = new Map<number, number>()
  foldedRanges(view.state).between(0, view.state.doc.length, (from, to) => { current.set(from, to) })
  const effects = headingFoldRanges().flatMap((range, index) => {
    if (!range || (current.get(range.from) === range.to) === wanted.has(index)) return []
    return [(wanted.has(index) ? foldEffect : unfoldEffect).of(range)]
  })
  if (effects.length) view.dispatch({ effects })
}
function setAllHeadingsFolded(folded: boolean) {
  setHeadingFolds(folded ? headingFoldRanges().map((_, index) => index) : [])
}
function jumpLine(line: number) { if (view) selectRange(view.state.doc.line(Math.max(1, Math.min(line, view.state.doc.lines))).from, 0) }
function scrollTopForOffset(position: number) {
  if (!view) return 0
  const at = Math.max(0, Math.min(position, view.state.doc.length))
  return Math.max(0, Math.min(view.scrollDOM.scrollHeight - view.scrollDOM.clientHeight, view.lineBlockAt(at).top))
}

function setScrollTop(position: number) { if (view) view.scrollDOM.scrollTop = position }
function focus() { view?.focus() }
function applyHistory(command: typeof cmUndo) { if (view && !props.readOnly && !props.previewOnly) { command(view); view.focus() } }

function undo() { applyHistory(cmUndo) }
function redo() { applyHistory(cmRedo) }
function syncSearch() {
  if (!view) return false
  try {
    findMatches = documentMatches(view.state.doc.toString(), findText.value, replaceText.value, { caseSensitive: findCase.value, regexp: findRegexp.value, wildcard: findWildcard.value, ignoreSpaces: findIgnoreSpaces.value, ignorePunctuation: findIgnorePunctuation.value, distinguishWidth: findWidth.value })
    findStatus.value = findText.value ? `${findMatches.length} 处匹配` : ''
    return findMatches.length > 0
  } catch { findMatches = []; findStatus.value = '正则表达式无效'; return false }
}
async function openFind() {
  if (view && !view.state.selection.main.empty) findText.value = view.state.sliceDoc(view.state.selection.main.from, view.state.selection.main.to)
  findOpen.value = true; syncSearch(); await nextTick(); findInput.value?.focus(); findInput.value?.select()
}
function closeFind() { findOpen.value = false; view?.focus() }
function findNext(backward = false) {
  if (!view || !syncSearch()) return
  const selected = view.state.selection.main
  const match = backward ? [...findMatches].reverse().find(item => item.to <= selected.from && item.from < selected.from) || findMatches.at(-1)! : findMatches.find(item => item.from >= selected.to && item.to > selected.to) || findMatches[0]
  view.dispatch({ selection: { anchor: match.from, head: match.to }, scrollIntoView: true })
}
function replaceFound(all = false) {
  if (!view || props.readOnly || props.previewOnly || !syncSearch()) return
  const selection = view.state.selection.main
  const match = findMatches.find(item => item.from === selection.from && item.to === selection.to)
  if (!all && !match) { findNext(); return }
  const changes = (all ? findMatches : [match!]).map(item => ({ from: item.from, to: item.to, insert: item.replacement }))
  view.dispatch({ changes, userEvent: 'input.replace', selection: all ? undefined : { anchor: match!.from + match!.replacement.length }, effects: view.scrollSnapshot() })
  syncSearch(); if (!all) findNext()
}
watch([findText, replaceText, findCase, findRegexp, findWildcard, findIgnoreSpaces, findIgnorePunctuation, findWidth], () => { if (findOpen.value) syncSearch() })

type EditorSlashCommand = SlashCommand | { id: string; label: string; pluginAction: PluginAction }
function matchingSlashCommands(query: string): EditorSlashCommand[] {
  const context = pluginRuntime.context({ location: 'slash' })
  const extra = pluginRuntime.actionsAt('slash', context).map(action => ({ id: action.id, label: action.title || pluginRuntime.state.commands.find(command => command.id === action.commandId)?.title || action.id, pluginAction: action })).filter(command => slashKeywordMatches(query, command.label, command.id, command.pluginAction.icon || ''))
  return [...builtinSlashCommands(query), ...extra]
}
function chooseSlash(command: EditorSlashCommand) {
  if (!view) return
  if ('pluginAction' in command) {
    const range = slashRange(view.state.doc.toString(), view.state.selection.main.head)
    if (!range) return
    replaceRange(range.from, range.to, '')
    const selection = view.state.selection.main
    const context = { ...pluginRuntime.context({ location: 'slash' }), document: { id: props.docId, path: props.relativePath, content: view.state.doc.toString() }, selection: { from: selection.from, to: selection.to, text: view.state.sliceDoc(selection.from, selection.to) } }
    slashOpen.value = false; void pluginRuntime.runAction(command.pluginAction, context); return
  }
  if (command.id === 'frontmatter') {
    const source = view.state.doc.toString(), range = slashRange(source, view.state.selection.main.head)
    if (!range) return
    const prefix = frontmatterSection(source) ? '' : '---\ntitle: \"\"\n---\n\n'
    const changes = range.from === 0 ? [{ from: 0, to: range.to, insert: prefix }] : [{ from: 0, insert: prefix }, { from: range.from, to: range.to, insert: '' }]
    view.dispatch({ changes, userEvent: 'input' }); slashOpen.value = false
    void nextTick(() => view?.dom.querySelector<HTMLInputElement>('.frontmatter-input')?.focus()); return
  }
  const change = slashCommandChange(view.state.doc.toString(), view.state.selection.main.head, command)
  if (!change) return
  replaceRange(change.from, change.to, command.id === 'table' ? change.insert + '\n\n' : change.insert)
  if ('select' in command) revealInsertion(change.from, change.from + change.insert.length)
  if (view && 'selection' in change && change.selection) { view.dispatch({ selection: change.selection }); view.focus() }
  slashOpen.value = false
}
async function onPaste(event: ClipboardEvent) {
  if (!view || props.readOnly || props.fileKind !== 'markdown') return
  const image = [...(event.clipboardData?.files || [])].find(file => file.type.startsWith('image/'))
  if (image && props.relativePath) {
    event.preventDefault()
    try {
      const bytes = Array.from(new Uint8Array(await image.arrayBuffer()))
      const path = await invoke<string>('import_image_bytes', { document: props.relativePath, directory: props.clipboardDirectory || 'assets', naming: props.attachmentNaming || null, mime: image.type, bytes })
      insertSnippet(`![图片](${path})`)
    } catch (error) { emit('error', t('粘贴图片失败：{0}', { '0': String(error) })) }
    return
  }
  const html = event.clipboardData?.getData('text/html') || ''
  if (html && !event.clipboardData?.getData('text/plain')?.includes('```')) {
    event.preventDefault()
    insertSnippet(new TurndownService({ headingStyle: 'atx', codeBlockStyle: 'fenced', emDelimiter: '*' }).turndown(DOMPurify.sanitize(html)))
  }
}
function positionSlashMenu() {
  if (!view || !slashOpen.value) return
  void nextTick(() => {
    if (!view || !slashOpen.value) return
    const root = host.value?.parentElement, coords = view.coordsAtPos(view.state.selection.main.head)
    if (!root || !coords) return
    const rect = root.getBoundingClientRect(), scaleX = rect.width / root.offsetWidth || 1, scaleY = rect.height / root.offsetHeight || 1
    const width = slashMenu.value?.offsetWidth || 240, height = slashMenu.value?.offsetHeight || 240
    const left = Math.max(8, Math.min((coords.left - rect.left) / scaleX, root.clientWidth - width - 8))
    const bottom = (coords.bottom - rect.top) / scaleY + 5
    const top = bottom + height < root.clientHeight ? bottom : Math.max(4, (coords.top - rect.top) / scaleY - height - 5)
    slashPosition.value = { left: `${left}px`, top: `${top}px` }
  })
}
function onKeydown(event: KeyboardEvent) {
  if (event.isComposing || view?.composing || event.keyCode === 229) return false
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'f') { event.preventDefault(); event.stopPropagation(); void openFind(); return true }
  if (event.key === 'F3' || ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'g')) { event.preventDefault(); if (!findText.value) void openFind(); else findNext(event.shiftKey); return true }
  if (event.key === 'Escape') { findOpen.value = false; if (!slashOpen.value) return false; slashOpen.value = false; event.preventDefault(); return true }
  if (!slashOpen.value) return false
  const options = matchingSlashCommands(slashQuery.value)
  if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
    event.preventDefault(); event.stopPropagation()
    slashIndex.value = (slashIndex.value + (event.key === 'ArrowDown' ? 1 : -1) + options.length) % Math.max(1, options.length)
    void nextTick(() => slashMenu.value?.querySelector('.active')?.scrollIntoView({ block: 'nearest' }))
    return true
  }
  if ((event.key === 'Enter' || (event.key === 'Tab' && !event.shiftKey)) && options.length) { event.preventDefault(); event.stopPropagation(); chooseSlash(options[slashIndex.value]!); return true }
  return false
}
const documentGutter = new Compartment()
function gutterExtension() { return props.bodyLineNumbers ? lineNumbers() : [] }
watch(() => props.bodyLineNumbers, () => { view?.dispatch({ effects: [documentGutter.reconfigure(gutterExtension()), view.scrollSnapshot()] }) })
function onWindowKeydown(event: KeyboardEvent) { if (event.key === 'Escape') previewImageSrc.value = '' }
onMounted(() => {
  window.addEventListener('keydown', onWindowKeydown)
  if (!host.value) return
  const extensions = [
    Prec.highest(EditorView.domEventHandlers({ keydown: onKeydown })), editorSetup, pluginEditorExtensions(() => ({id:props.docId,root:props.workspaceRoot||'',mode:props.rich?'wysiwyg':'source'})),
    linkCompletion({ enabled: () => props.rich && props.fileKind === 'markdown' && !props.previewOnly && !props.readOnly,
      source: () => props.relativePath || '', root: () => props.workspaceRoot || '', onAccept: () => { insertedSyntax = undefined },
      entries: localLinkEntries, queryEntries: queryLinkEntries }), documentGutter.of(gutterExtension()), codeFolding({ placeholderDOM: (view, onclick) => {
      const marker = document.createElement('button')
      marker.type = 'button'; marker.className = 'cm-heading-fold-placeholder'
      marker.textContent = '···'; marker.setAttribute('aria-label', t('展开折叠内容')); marker.title = t('展开折叠内容')
      marker.onmousedown = event => event.preventDefault()
      marker.onclick = onclick
      return marker
    } }), search(), language.of(markdownLanguage()), rendering.of(richExtension()), EditorView.lineWrapping,
    readOnly.of(EditorState.readOnly.of(!!props.readOnly || !!props.previewOnly)), editable.of(EditorView.editable.of(!props.previewOnly && !props.readOnly)),
    EditorView.updateListener.of(update => {
      if (insertedSyntax) {
        if (update.docChanged) insertedSyntax = { from: update.changes.mapPos(insertedSyntax.from, -1), to: update.changes.mapPos(insertedSyntax.to, 1) }
        const head = update.state.selection.main.head
        if (head < insertedSyntax.from || head > insertedSyntax.to) {
          insertedSyntax = undefined; const current = view
          queueMicrotask(() => { if (view === current && !insertedSyntax) view?.dispatch({ effects: rendering.reconfigure(richExtension()) }) })
        }
      }
      if (update.docChanged) emit('update:modelValue', update.state.doc.toString())
      if (update.docChanged || foldedRanges(update.startState) !== foldedRanges(update.state)) reportHeadingFolds(update.state)
      if (update.geometryChanged && !update.docChanged && !update.selectionSet) positionSlashMenu()
      if (update.selectionSet || update.docChanged) {
        reportSelection()
        if (update.selectionSet && props.typewriter && update.transactions.some(transaction => transaction.isUserEvent('select'))) requestAnimationFrame(() => view?.dispatch({ effects: EditorView.scrollIntoView(update.state.selection.main.head, { y: 'center' }) }))
      }
    }),
    EditorView.domEventHandlers({ focus: () => { emit('focus'); reportSelection() }, blur: () => emit('blur'),
      paste: event => { void onPaste(event) }, mousedown: onSourceMouseDown, click: onSourceClick }),
    EditorView.theme({ '&': { height: '100%' }, '&.cm-focused': { outline: 'none' }, '.cm-scroller': { overflow: 'auto' } })
  ]
  const retained = !props.previewOnly && retainedDocument(props.docId, props.modelValue)
  const state = retained ? retained.update({ effects: StateEffect.reconfigure.of(extensions) }).state : EditorState.create({ doc: props.modelValue, extensions })
  view = new EditorView({ parent: host.value, state })
  reportHeadingFolds(view.state)
  view.scrollDOM.addEventListener('scroll', () => { emit('scroll', view!.scrollDOM); positionSlashMenu() }, { passive: true })
  view.scrollDOM.addEventListener('wheel', () => emit('user-scroll'), { passive: true })
  view.scrollDOM.addEventListener('pointerdown', () => emit('user-scroll'), { passive: true })
})
onBeforeUnmount(() => { window.removeEventListener('keydown', onWindowKeydown); if (view && !props.previewOnly) retainDocument(props.docId, view.state); view?.destroy(); view = null })
watch([()=>pluginServices.blocks,()=>pluginServices.inlines,()=>JSON.stringify(rendererChoices)],()=>{view?.dispatch({effects:rendering.reconfigure(richExtension())})})
watch(activeLocale, () => { if (view) view.dispatch({ effects: [rendering.reconfigure(richExtension()), view.scrollSnapshot()] }) })
watch(() => props.modelValue, value => {
  if (!view) return
  const current = view.state.doc.toString(); if (value === current) return
  let from = 0
  while (from < current.length && from < value.length && current[from] === value[from]) from++
  let oldEnd = current.length, newEnd = value.length
  while (oldEnd > from && newEnd > from && current[oldEnd - 1] === value[newEnd - 1]) { oldEnd--; newEnd-- }
  view.dispatch({ changes: { from, to: oldEnd, insert: value.slice(from, newEnd) }, annotations: Transaction.addToHistory.of(false), effects: view.scrollSnapshot() })
})
watch(() => [props.rich, props.diagramVisualEditing, props.previewOnly, props.readOnly, props.codeBlockLineNumbers, props.imageData, props.imageWidths, props.fileKind], () => {
  if (!props.rich) insertedSyntax = undefined
  if (!view) return
  view.dispatch({ effects: [rendering.reconfigure(richExtension()), language.reconfigure(markdownLanguage()),
    readOnly.reconfigure(EditorState.readOnly.of(!!props.readOnly || !!props.previewOnly)), editable.reconfigure(EditorView.editable.of(!props.previewOnly && !props.readOnly))] })
})
watch(slashOpen, () => { void nextTick(positionSlashMenu) })
watch(() => props.layoutKey, () => view?.requestMeasure())
function pluginSelection() { const selection = view?.state.selection.main; return selection && view ? { from: selection.from, to: selection.to, text: view.state.sliceDoc(selection.from, selection.to) } : { from: 0, to: 0, text: '' } }
defineExpose({ applyPluginEdits, pluginSelection, focus, undo, redo, openFind, currentBlockText, insertParagraph, deleteCurrentBlock, deleteSelection, applyBlock, format, jumpHeading, toggleHeadingFold, setHeadingFold, setHeadingFolds, setAllHeadingsFolded, jumpLine, selectRange, replaceRange, scrollTopForOffset, setScrollTop, insertSnippet })
</script>
<template>
  <div class="code-editor-wrap cm-document-editor" :class="{ 'cm-rich-mode': rich, 'show-body-line-numbers': bodyLineNumbers, 'markart-focus-mode': focusMode, 'typewriter-mode': typewriter }">
    <div ref="host" class="code-editor" @focusin="onEmbeddedFocus"/>
    <div v-if="findOpen" class="editor-find" role="search" :aria-label="$t('文件查找与替换')" @keydown.stop @keydown.esc.prevent="closeFind">
      <div class="editor-find-row"><input ref="findInput" v-model="findText" :aria-label="$t('查找')" :placeholder="$t('查找')" @keydown.enter.prevent="findNext($event.shiftKey)"><span class="editor-find-actions"><button :title="$t('上一个')" :aria-label="$t('上一个匹配')" @click="findNext(true)"><ArrowUp :size="15"/></button><button :title="$t('下一个')" :aria-label="$t('下一个匹配')" @click="findNext()"><ArrowDown :size="15"/></button><button :title="$t('关闭查找')" :aria-label="$t('关闭查找')" @click="closeFind"><X :size="15"/></button></span></div>

      <div v-if="!props.readOnly && !props.previewOnly" class="editor-find-row"><input v-model="replaceText" :aria-label="$t('替换为')" :placeholder="$t('替换为')" @keydown.enter.prevent="replaceFound()"><span class="editor-find-actions"><button @click="replaceFound()">{{ $t('替换') }}</button><button @click="replaceFound(true)">{{ $t('全部替换') }}</button></span></div>
      <details class="editor-find-advanced"><summary><ChevronRight :size="13" aria-hidden="true"/>{{ $t('高级搜索') }}<span class="editor-find-status" role="status">{{ findStatus }}</span></summary><div class="editor-find-options">
        <label><input v-model="findCase" type="checkbox">{{ $t('区分大小写') }}</label>
        <label><input v-model="findRegexp" type="checkbox" @change="findRegexp && (findWildcard = false)">{{ $t('正则表达式') }}</label>
        <label><input v-model="findWildcard" type="checkbox" @change="findWildcard && (findRegexp = false)">{{ $t('使用通配符') }}</label>
        <label><input v-model="findIgnoreSpaces" type="checkbox">{{ $t('忽略空格') }}</label>
        <label><input v-model="findIgnorePunctuation" type="checkbox">{{ $t('忽略标点符号') }}</label>
        <label><input v-model="findWidth" type="checkbox">{{ $t('区分全角/半角') }}</label>
      </div></details>
    </div>
    <div v-if="slashOpen && matchingSlashCommands(slashQuery).length" ref="slashMenu" class="slash-menu cm-slash-menu" :style="slashPosition"><button v-for="(command, index) in matchingSlashCommands(slashQuery)" :key="command.id" :class="{ active: index === slashIndex }" @mousedown.prevent="chooseSlash(command)"><FormatIcon :name="'pluginAction' in command ? command.pluginAction.icon || 'settings' : command.id"/><span class="command-label">{{ 'pluginAction' in command ? command.label : $t(command.label) }}</span><code class="command-markdown">{{ markdownMarkers[command.id] }}</code></button></div>
    <div v-if="previewImageSrc" class="image-preview-overlay" @click.self="previewImageSrc = ''"><div class="image-preview-size">{{ previewImageSize }}</div><button type="button" class="image-preview-close" :aria-label="$t('关闭图片预览')" @click="previewImageSrc = ''"><X :size="19"/></button><div class="image-preview-stage"><img :src="previewImageSrc" :alt="$t('图片预览')" :style="{ transform: `scale(${previewImageZoom})` }" @load="previewImageSize = `${($event.target as HTMLImageElement).naturalWidth}x${($event.target as HTMLImageElement).naturalHeight}`"></div><div class="image-preview-controls"><button type="button" :aria-label="$t('缩小图片')" @click="previewImageZoom = Math.max(0.25, previewImageZoom - 0.25)">−</button><span>{{ Math.round(previewImageZoom * 100) }}%</span><button type="button" :aria-label="$t('放大图片')" @click="previewImageZoom = Math.min(4, previewImageZoom + 0.25)">＋</button><button type="button" :aria-label="$t('重置图片大小')" @click="previewImageZoom = 1"><RotateCcw :size="16"/></button></div></div>
  </div>
</template>
