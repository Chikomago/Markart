export function pluginShortcutChord(shortcut: string): string {
  if (!shortcut) return ''
  if (/^(?:(?:Meta|Control|Alt|Shift)\+)+/.test(shortcut)) return shortcut
  const parts = shortcut.toLowerCase().split('+'), key = parts.pop() || ''
  const mac = typeof navigator !== 'undefined' && /mac/i.test(navigator.platform)
  const meta = parts.includes('meta') || parts.includes('cmd') || parts.includes('mod') && mac
  const ctrl = parts.includes('ctrl') || parts.includes('control') || parts.includes('mod') && !mac
  const code = /^[a-z]$/.test(key) ? `Key${key.toUpperCase()}` : /^\d$/.test(key) ? `Digit${key}` : ({ '/': 'Slash', ',': 'Comma', '[': 'BracketLeft', ']': 'BracketRight' } as Record<string, string>)[key] || key
  return [meta && 'Meta', ctrl && 'Control', parts.includes('alt') && 'Alt', parts.includes('shift') && 'Shift', code].filter(Boolean).join('+')
}
