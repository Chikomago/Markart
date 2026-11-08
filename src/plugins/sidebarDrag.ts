export type SidebarDragPoint = { x: number; y: number }
type DragCallbacks = { start(): void; move(point: SidebarDragPoint): void; drop(point: SidebarDragPoint): void; end(): void }

export function startSidebarPointerDrag(event: PointerEvent, callbacks: DragCallbacks, target: EventTarget = window): () => void {
  if (event.button !== 0) return () => {}
  const id = event.pointerId, origin = { x: event.clientX, y: event.clientY }
  const element = event.currentTarget as HTMLElement | null
  let active = false, ended = false
  const point = (event: PointerEvent) => ({ x: event.clientX, y: event.clientY })
  const finish = () => {
    if (ended) return
    ended = true
    target.removeEventListener('pointermove', move); target.removeEventListener('pointerup', up)
    target.removeEventListener('pointercancel', cancel); target.removeEventListener('keydown', key); target.removeEventListener('blur', finish)
    try { if (element?.hasPointerCapture(id)) element.releasePointerCapture(id) } catch { /* Capture may already be released by the WebView. */ }
    callbacks.end()
  }
  const move = (raw: Event) => {
    const next = raw as PointerEvent
    if (next.pointerId !== id) return
    if (!active && Math.hypot(next.clientX - origin.x, next.clientY - origin.y) < 6) return
    next.preventDefault()
    if (!active) { active = true; callbacks.start() }
    callbacks.move(point(next))
  }
  const up = (raw: Event) => {
    const next = raw as PointerEvent
    if (next.pointerId !== id) return
    try { if (active) { next.preventDefault(); callbacks.drop(point(next)) } } finally { finish() }
  }
  const cancel = (raw: Event) => { if ((raw as PointerEvent).pointerId === id) finish() }
  const key = (raw: Event) => { if ((raw as KeyboardEvent).key === 'Escape') { raw.preventDefault(); finish() } }
  try { element?.setPointerCapture(id) } catch { /* Window listeners also handle WebViews without pointer capture. */ }
  target.addEventListener('pointermove', move, { passive: false }); target.addEventListener('pointerup', up)
  target.addEventListener('pointercancel', cancel); target.addEventListener('keydown', key); target.addEventListener('blur', finish)
  return finish
}

export function sidebarDropTarget(point: SidebarDragPoint, bounds: { left: number; right: number; top: number; bottom: number }, blocks: { id: string; top: number; bottom: number }[], moving?: string): { before: string | undefined; line: number } | null {
  if (point.x < bounds.left || point.x > bounds.right || point.y < bounds.top || point.y > bounds.bottom) return null
  const remaining = blocks.filter(block => block.id !== moving)
  const before = remaining.find(block => point.y < (block.top + block.bottom) / 2)
  return { before: before?.id, line: (before?.top ?? remaining.at(-1)?.bottom ?? bounds.top) - bounds.top }
}
