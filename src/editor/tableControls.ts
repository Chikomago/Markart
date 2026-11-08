import { t } from '../i18n'
import { isolateHistory } from '@codemirror/commands'
import DOMPurify from 'dompurify'
import { renderMarkdown, lexMarkdownBlocks } from './renderMarkdown'
import type { EditorView } from '@codemirror/view'

type Cell = { text: string; from: number; to: number }
// Split pipes outside escapes and inline code. Offsets always refer to Markdown.
function cells(line: string, offset: number): Cell[] {
  const boundaries = [-1]; let ticks = 0
  for (let i = 0; i < line.length; i++) {
    if (line[i] === '\\') { i++; continue }
    if (line[i] === '`') { let count = 1; while (line[i + count] === '`') count++; ticks = ticks === count ? 0 : ticks || count; i += count - 1; continue }
    if (line[i] === '|' && !ticks) boundaries.push(i)
  }
  boundaries.push(line.length)
  const result: Cell[] = []
  for (let i = 1; i < boundaries.length; i++) {
    const start = boundaries[i - 1] + 1, end = boundaries[i], raw = line.slice(start, end)
    if ((!raw.trim() && i === 1 && line.trimStart().startsWith('|')) || (!raw.trim() && i === boundaries.length - 1 && line.trimEnd().endsWith('|'))) continue
    const from = start + (raw.match(/^\s*/)?.[0].length || 0), to = Math.max(from, end - (raw.match(/\s*$/)?.[0].length || 0))
    result.push({ text: line.slice(from, to), from: offset + from, to: offset + to })
  }
  return result
}
const selections = new WeakMap<EditorView, { table: number; row: number; column: number; resume?: { start: number; end: number } }>()
export function mountTableControls(root: HTMLElement, source: string, from: number, view: EditorView) {
  const table = root.querySelector('table'); if (!table) return
  const snapshot = () => {
    let at = 0, raw = source
    for (const token of lexMarkdownBlocks(view.state.doc.toString())) {
      if (at === from && token.type === 'table') { raw = token.raw.replace(/\n+$/, ''); break }
      at += token.raw?.length || 0
    }
    let offset = from
    const parsed = raw.split('\n').map(line => { const row = cells(line, offset); offset += line.length + 1; return row })
    return { raw, data: [parsed[0], ...parsed.slice(2)], separator: parsed[1] }
  }
  let { data, separator } = snapshot()
  let editing: { input: HTMLInputElement; target: HTMLTableCellElement; original: Cell; html: string } | null = null
  const drafts = new Map<number, { cell: Cell; value: string }>()
  const stage = () => {
    if (!editing) return
    drafts.set(editing.original.from, { cell: editing.original, value: editing.input.value })
    const fragment = document.createElement('div'); fragment.innerHTML = DOMPurify.sanitize(renderMarkdown(editing.input.value))
    const body = fragment.firstElementChild?.tagName === 'P' ? fragment.firstElementChild : fragment
    editing.target.replaceChildren(...body.childNodes); editing = null
  }
  const toolbar = document.createElement('div'); toolbar.className = 'cm-table-toolbar'; toolbar.contentEditable = 'false'; toolbar.hidden = true; toolbar.setAttribute('role', 'toolbar'); toolbar.setAttribute('aria-label', t('表格工具栏'))
  const retained = selections.get(view)
  let row = retained?.table === from ? retained.row : 0, column = retained?.table === from ? retained.column : 0
  const current = () => { const cell = snapshot().data[row]?.[column]; return cell && { ...cell, text: editing?.input.value ?? drafts.get(cell.from)?.value ?? cell.text } }
  const change = (start: number, end: number, insert: string) => {
    stage()
    const changes = [...drafts.values()].filter(({ cell }) => cell.to <= start || cell.from >= end).map(({ cell, value }) => ({ from: cell.from, to: cell.to, insert: value.replace(/(?<!\\)\|/g, '\\|') }))
    changes.push({ from: start, to: end, insert })
    view.dispatch({ changes, userEvent: 'input', annotations: isolateHistory.of('full') })
  }
  const control = (label: string, text: string, action: () => void) => {
    const button = document.createElement('button'); button.type = 'button'; button.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${text}</svg>`; button.title = t(label); button.setAttribute('aria-label', t(label))
    button.addEventListener('mousedown', event => event.preventDefault())
    button.addEventListener('click', event => { event.stopPropagation(); action() }); toolbar.append(button); return button
  }
  const picker = document.createElement('div'); picker.className = 'cm-table-grid-picker'; picker.hidden = true
  control('调整表格尺寸', '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 3v18M15 3v18"/>', () => { picker.hidden = !picker.hidden })
  const size = document.createElement('span'); size.textContent = `${data.length} × ${data[0]?.length || 0}`; picker.append(size)
  const matrix = document.createElement('div'); matrix.className = 'cm-table-grid'; picker.append(matrix)
  const resize = (rows: number, columns: number) => {
    const latest = snapshot(); data = latest.data; separator = latest.separator
    for (const cells of data) for (const cell of cells) cell.text = drafts.get(cell.from)?.value ?? cell.text
    if (editing && data[row]?.[column]) data[row][column].text = editing.input.value
    const removed = data.some((cells, r) => cells.some((cell, c) => (r >= rows || c >= columns) && cell.text))
    if (removed && !window.confirm(t('缩小表格将删除超出范围的内容，是否继续？'))) return
    const line = (values: string[]) => '| ' + values.join(' | ') + ' |'
    const result = Array.from({ length: rows }, (_, r) => line(Array.from({ length: columns }, (_, c) => data[r]?.[c]?.text || '')))
    result.splice(1, 0, line(Array.from({ length: columns }, (_, c) => separator[c]?.text || '---')))
    change(from, from + latest.raw.length, result.join('\n'))
  }
  for (let r = 1; r <= 8; r++) for (let c = 1; c <= 8; c++) {
    const button = document.createElement('button'); button.type = 'button'; button.setAttribute('aria-label', t('{0} 行 {1} 列', { "0": r, "1": c }))
    button.addEventListener('mouseenter', () => { size.textContent = `${r} × ${c}`; [...matrix.children].forEach((item, i) => item.classList.toggle('active', Math.floor(i / 8) < r && i % 8 < c)) })
    button.addEventListener('click', event => { event.stopPropagation(); resize(r, c) }); matrix.append(button)
  }
  const alignButtons: { button: HTMLButtonElement; value: string }[] = []
  const updateAlignment = () => {
    const value = snapshot().separator[column]?.text || '---'
    const alignment = value.startsWith(':') && value.endsWith(':') ? ':---:' : value.endsWith(':') ? '---:' : ':---'
    for (const item of alignButtons) { const selected = item.value === alignment; item.button.setAttribute('aria-pressed', String(selected)); item.button.classList.toggle('selected', selected) }
  }
  for (const [label, text, value] of [['左对齐', '<path d="M3 6h18M3 10h12M3 14h18M3 18h12"/>', ':---'], ['居中', '<path d="M3 6h18M6 10h12M3 14h18M6 18h12"/>', ':---:'], ['右对齐', '<path d="M3 6h18M9 10h12M3 14h18M9 18h12"/>', '---:']]) {
    const button = control(`表格${label}`, text, () => {
      const cell = snapshot().separator[column]
      if (!cell || cell.text === value) return
      if (editing) selections.set(view, { table: from, row, column, resume: { start: editing.input.selectionStart ?? 0, end: editing.input.selectionEnd ?? 0 } })
      change(cell.from, cell.to, value)
      updateAlignment()
    })
    alignButtons.push({ button, value })
  }
  updateAlignment()
  toolbar.append(picker); root.prepend(toolbar)
  const renderedRows = [...table.rows]
  const focus = (target: HTMLTableCellElement) => {
    row = renderedRows.indexOf(target.parentElement as HTMLTableRowElement); column = target.cellIndex
    root.querySelectorAll('.cm-table-cell-selected').forEach(cell => cell.classList.remove('cm-table-cell-selected')); target.classList.add('cm-table-cell-selected')
    toolbar.hidden = false
    updateAlignment()
    selections.set(view, { table: from, row, column })
    view.contentDOM.classList.add('cm-table-editing')
    const cell = snapshot().data[row]?.[column]
    if (cell) view.dispatch({ selection: { anchor: cell.from } })
  }
  if (retained?.table === from) { queueMicrotask(() => { if (root.isConnected && selections.get(view)?.table === from) view.contentDOM.classList.add('cm-table-editing') }); const cell = renderedRows[row]?.cells[column]; if (cell) { cell.classList.add('cm-table-cell-selected'); toolbar.hidden = false } }
  const commit = () => {
    stage()
    const changes = [...drafts.values()].filter(({ cell, value }) => value !== cell.text).map(({ cell, value }) => ({ from: cell.from, to: cell.to, insert: value.replace(/(?<!\\)\|/g, '\\|') }))
    if (changes.length) view.dispatch({ changes, userEvent: 'input', annotations: isolateHistory.of('full') })
  }
  table.addEventListener('mousedown', event => {
    const target = event.target as Element
    if (!target.closest('th,td') || target.closest('input') || ((event.metaKey || event.ctrlKey) && target.closest('a'))) return
    event.preventDefault(); event.stopPropagation(); view.contentDOM.classList.add('cm-table-editing')
  })
  table.addEventListener('click', event => {
    const target = (event.target as Element).closest<HTMLTableCellElement>('th,td'); if (!target || (event.target as Element).closest('input')) return
    if ((event.metaKey || event.ctrlKey) && (event.target as Element).closest('a')) return
    event.preventDefault(); event.stopPropagation()
    stage(); focus(target)
    const cell = current(); if (!cell) return
    const style = getComputedStyle(target)
    const width = Math.max(1, target.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight))
    const input = document.createElement('input'); input.className = 'cm-table-cell-input'; input.value = cell.text; input.setAttribute('aria-label', t('编辑表格单元格')); input.style.width = `${width}px`
    editing = { input, target, original: snapshot().data[row][column], html: target.innerHTML }
    target.replaceChildren(input); input.focus(); input.setSelectionRange(input.value.length, input.value.length)
    input.addEventListener('click', event => event.stopPropagation())
    input.addEventListener('keydown', event => { event.stopPropagation(); if (event.key === 'Enter') {
      event.preventDefault(); commit()
      const latest = snapshot(), end = from + latest.raw.length, source = view.state.doc.toString()
      const after = source.slice(end), padding = after.startsWith('\n\n') ? '' : after.startsWith('\n') ? '\n' : '\n\n'
      const anchor = end + (padding ? padding.length + (after.startsWith('\n') ? 1 : 0) : 2)
      view.dispatch({ changes: padding ? { from: end, insert: padding } : undefined, selection: { anchor: Math.min(anchor, source.length + padding.length) }, userEvent: 'input', scrollIntoView: true })
      selections.delete(view); view.contentDOM.classList.remove('cm-table-editing'); view.focus()
    } if (event.key === 'Escape') { const html = editing?.html; editing = null; if (html !== undefined) target.innerHTML = html } })
    input.addEventListener('blur', () => { setTimeout(() => { if (root.isConnected && !root.contains(document.activeElement)) commit() }, 0) })
  })
  if (retained?.resume) queueMicrotask(() => {
    if (!root.isConnected || selections.get(view)?.table !== from) return
    const target = renderedRows[row]?.cells[column]
    target?.click()
    const input = target?.querySelector<HTMLInputElement>('.cm-table-cell-input')
    if (input) input.setSelectionRange(Math.min(retained.resume!.start, input.value.length), Math.min(retained.resume!.end, input.value.length))
  })
  const remove = document.createElement('button'); remove.type = 'button'; remove.className = 'cm-table-delete'; remove.title = t('删除表格'); remove.setAttribute('aria-label', t('删除表格'))
  remove.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 6h18M9 6V4h6v2M5 6l1 14h12l1-14M10 10v6M14 10v6"/></svg>'
  remove.addEventListener('mousedown', event => event.preventDefault())
  remove.addEventListener('click', event => { event.preventDefault(); event.stopPropagation(); const value = snapshot(); change(from, from + value.raw.length, ''); view.contentDOM.classList.remove('cm-table-editing'); view.focus() })
  root.append(remove)
  const positionDelete = () => {
    if (!root.isConnected) return
    const box = root.getBoundingClientRect(), tableBox = table.getBoundingClientRect(), scroll = table.closest('.cm-table-scroll')?.getBoundingClientRect()
    const scale = box.width / (root.offsetWidth || box.width) || 1
    remove.style.left = `${Math.max(0, (Math.min(tableBox.right, scroll?.right ?? tableBox.right) - box.left) / scale - 25)}px`; remove.style.right = 'auto'
  }
  const observer = new ResizeObserver(positionDelete); observer.observe(table); observer.observe(root)
  const scroll = table.closest('.cm-table-scroll'); scroll?.addEventListener('scroll', positionDelete)
  queueMicrotask(positionDelete)
  const outside = (event: MouseEvent) => {
    if (root.contains(event.target as Node)) return
    commit()
    view.contentDOM.classList.remove('cm-table-editing')
    toolbar.hidden = true
    root.querySelectorAll('.cm-table-cell-selected').forEach(cell => cell.classList.remove('cm-table-cell-selected'))
    if (selections.get(view)?.table === from) selections.delete(view)
  }
  root.ownerDocument.addEventListener('mousedown', outside)
  return () => { observer.disconnect(); scroll?.removeEventListener('scroll', positionDelete); root.ownerDocument.removeEventListener('mousedown', outside); view.contentDOM.classList.remove('cm-table-editing') }

}
