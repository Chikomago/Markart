import { t, activeLocale } from '../i18n'
import { WidgetType, type EditorView } from '@codemirror/view'
import { stringify } from 'yaml'
import { frontmatterFields, updateFrontmatter } from '../documents/frontmatter'

export class FrontmatterWidget extends WidgetType {
  readonly locale = activeLocale.value
  constructor(readonly source: string, readonly readOnly: boolean) { super() }
  eq(other: FrontmatterWidget) { if (this.locale !== other.locale) return false; return this.source === other.source && this.readOnly === other.readOnly }
  updateDOM(dom: HTMLElement) { return dom.contains(document.activeElement) && dom.dataset.pendingSource === this.source }
  toDOM(view: EditorView) {
    const root = document.createElement('section')
    root.className = 'cm-frontmatter-panel'; root.contentEditable = 'false'; root.setAttribute('aria-label', 'Front matter')
    const heading = document.createElement('strong'); heading.textContent = t('元数据'); root.append(heading)
    const parsed = frontmatterFields(this.source)
    const error = document.createElement('p'); error.className = 'frontmatter-error'; error.setAttribute('role', 'status'); error.textContent = parsed.error
    for (const field of parsed.fields) {
      const row = document.createElement('div'); row.className = 'frontmatter-row'
      let name = field.key
      const key = document.createElement('input'); key.className = 'frontmatter-key frontmatter-input'; key.value = name; key.setAttribute('aria-label', t('{0} 的字段名', { "0": name })); key.readOnly = this.readOnly
      const value = document.createElement('span'); value.className = 'frontmatter-value'
      let items: unknown
      try { items = JSON.parse(field.value) } catch { /* Scalar values remain plain text. */ }
      const collection = Array.isArray(items) || (items !== null && typeof items === 'object')
      const display = document.createElement('span'); display.className = 'frontmatter-display'
      const paint = (text: string) => {
        display.replaceChildren()
        let tags: unknown; try { tags = JSON.parse(text) } catch { /* Show invalid input as text until corrected. */ }
        if (Array.isArray(tags)) for (const item of tags) { const chip = document.createElement('span'); chip.className = 'frontmatter-tag'; chip.textContent = typeof item === 'object' ? JSON.stringify(item) : String(item); display.append(chip) }
        else display.textContent = text
      }
      paint(field.value)
      const input = document.createElement('input'); input.className = 'frontmatter-input'; input.value = field.value; input.setAttribute('aria-label', t('{0} 的值', { "0": field.key })); input.readOnly = this.readOnly
      if (collection) { input.hidden = true; value.append(display) }
      value.append(input); row.append(key, value); root.append(row)
      const save = () => {
        try {
          const text = collection || /^(?:true|false|null|-?\d+(?:\.\d+)?)$/.test(input.value) ? input.value : stringify(input.value).trimEnd()
          const source = view.state.doc.toString(), change = updateFrontmatter(source, name, text)
          const next = source.slice(0, change.from) + change.insert + source.slice(change.to)
          root.dataset.pendingSource = next.slice(0, frontmatterFields(next).section?.to || 0)
          view.dispatch({ changes: change, userEvent: 'input', effects: view.scrollSnapshot() }); error.textContent = ''; paint(input.value)
        } catch (reason) { error.textContent = reason instanceof Error ? reason.message : String(reason) }
      }
      input.addEventListener('input', () => { if (!collection) save() })
      input.addEventListener('blur', () => { if (collection) { save(); if (!error.textContent) { input.hidden = true; display.hidden = false } } })
      input.addEventListener('keydown', event => { if (event.key === 'Enter') { event.preventDefault(); input.blur() } else if (!(event.metaKey || event.ctrlKey)) event.stopPropagation() })
      if (collection && !this.readOnly) value.addEventListener('mousedown', event => { if (event.target === input) return; event.preventDefault(); input.hidden = false; display.hidden = true; input.focus() })
      key.addEventListener('change', () => {
        if (this.readOnly || key.value === name) return
        try {
          const source = view.state.doc.toString(), change = updateFrontmatter(source, name, '', key.value)
          const next = source.slice(0, change.from) + change.insert + source.slice(change.to)
          root.dataset.pendingSource = next.slice(0, frontmatterFields(next).section?.to || 0)
          view.dispatch({ changes: change, userEvent: 'input', effects: view.scrollSnapshot() })
          name = key.value; error.textContent = ''
        } catch (reason) { error.textContent = reason instanceof Error ? reason.message : String(reason); key.value = name }
      })
      key.addEventListener('keydown', event => { if (event.key === 'Enter') { event.preventDefault(); key.blur() } else if (!(event.metaKey || event.ctrlKey)) event.stopPropagation() })
    }
    root.append(error); root.addEventListener('mousedown', event => event.stopPropagation())
    return root
  }
  ignoreEvent() { return true }
}
