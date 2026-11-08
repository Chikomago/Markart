export function zoomShortcutDirection(event: Pick<KeyboardEvent, 'metaKey' | 'ctrlKey' | 'altKey' | 'key' | 'code'>): -1 | 0 | 1 {
  if (!event.metaKey || event.ctrlKey || event.altKey) return 0
  if (event.code === 'Equal' || event.code === 'NumpadAdd' || event.key === '+' || event.key === '=') return 1
  if (event.code === 'Minus' || event.code === 'NumpadSubtract' || event.key === '-' || event.key === '_') return -1
  return 0
}

export function stepZoom(current: number, direction: -1 | 1): number {
  return Math.max(75, Math.min(150, Math.round(current / 5) * 5 + direction * 5))
}
