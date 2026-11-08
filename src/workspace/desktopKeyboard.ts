import { isTauri } from '@tauri-apps/api/core'

export function isInspectorShortcut(event: Pick<KeyboardEvent, 'key' | 'metaKey' | 'ctrlKey' | 'altKey' | 'shiftKey'>) {
  return event.key === 'F12' || ['i', 'j', 'c'].includes(event.key.toLowerCase()) && (
    event.metaKey && event.altKey || event.ctrlKey && event.shiftKey
  )
}

export function preventButtonTabNavigation(event: KeyboardEvent) {
  // Editor widgets can handle Tab first (completion, indentation, diagram nodes).
  if (event.key === 'Tab' && !event.defaultPrevented && !event.isComposing) event.preventDefault()
}

export function installDesktopKeyboardPolicy(target: Window = window, desktop = isTauri()) {
  if (!desktop) return () => {}
  const inspector = (event: KeyboardEvent) => {
    if (isInspectorShortcut(event)) { event.preventDefault(); event.stopImmediatePropagation() }
  }
  target.addEventListener('keydown', inspector, true)
  target.addEventListener('keydown', preventButtonTabNavigation)
  return () => {
    target.removeEventListener('keydown', inspector, true)
    target.removeEventListener('keydown', preventButtonTabNavigation)
  }
}
