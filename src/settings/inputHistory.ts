type Editable = HTMLInputElement | HTMLTextAreaElement
type Snapshot = { value: string; start: number | null; end: number | null }
type History = { current: Snapshot; undo: Snapshot[]; redo: Snapshot[] }

const histories = new WeakMap<Editable, History>()
let applying = false

export function settingsEditable(target: EventTarget | null): Editable | null {
  if (!(target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement)) return null
  if (!target.closest('.settings-modal')) return null
  if (target instanceof HTMLInputElement && !['text', 'search', 'password', 'url', 'email', 'number', 'tel'].includes(target.type)) return null
  return target
}

function snapshot(input: Editable): Snapshot {
  return { value: input.value, start: input.selectionStart, end: input.selectionEnd }
}

export function rememberSettingsInput(event: Event) {
  const input = settingsEditable(event.target)
  if (!input || applying) return
  const next = snapshot(input)
  const history = histories.get(input)
  if (!history) { histories.set(input, { current: next, undo: [], redo: [] }); return }
  if (next.value === history.current.value) return
  history.undo.push(history.current)
  history.redo.length = 0
  history.current = next
}

export function runSettingsInputHistory(action: 'undo' | 'redo', target: EventTarget | null = document.activeElement): boolean {
  const input = settingsEditable(target)
  if (!input) return false
  const history = histories.get(input)
  const stack = action === 'undo' ? history?.undo : history?.redo
  if (!history || !stack?.length) return true
  const previous = stack.pop()!
  ;(action === 'undo' ? history.redo : history.undo).push(history.current)
  history.current = previous
  applying = true
  input.value = previous.value
  try { if (previous.start !== null) input.setSelectionRange(previous.start, previous.end) } catch { /* Number inputs have no text selection. */ }
  input.dispatchEvent(new Event('input', { bubbles: true }))
  applying = false
  return true
}
