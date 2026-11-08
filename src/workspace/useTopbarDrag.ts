import { onBeforeUnmount } from 'vue'
import type { TopbarArea } from './topbar'

export function reorderTopbarItems(items: string[], id: string, before?: string) {
  if (!items.includes(id) || before === id) return items
  const next = items.filter(item => item !== id)
  const index = before ? next.indexOf(before) : -1
  next.splice(index < 0 ? next.length : index, 0, id)
  return next
}

export function useTopbarDrag(commit: (area: TopbarArea, id: string, before?: string) => void) {
  let cleanup = () => {}
  let suppress = false
  let clearSuppression: ReturnType<typeof setTimeout> | undefined
  function startTopbarDrag(event: PointerEvent, area: TopbarArea) {
    if (!event.metaKey || event.button !== 0) return
    const source = (event.target as Element).closest<HTMLElement>('[data-topbar-id]')
    const group = source?.closest<HTMLElement>('.collapsible-topbar-icons')
    const shell = source?.closest<HTMLElement>('.app-shell')
    if (!source || !group || !shell) return
    event.preventDefault(); event.stopPropagation(); cleanup()
    const id = source.dataset.topbarId!, x = event.clientX, y = event.clientY
    let dragging = false, valid = false, before: string | undefined
    const marker = document.createElement('div'); marker.className = 'topbar-drop-marker'
    function move(pointer: PointerEvent) {
      if (!dragging && Math.hypot(pointer.clientX - x, pointer.clientY - y) < 4) return
      dragging = true; source!.classList.add('topbar-drag-source'); shell!.classList.add('topbar-reordering')
      const bounds = group!.getBoundingClientRect()
      valid = pointer.clientY >= bounds.top - 12 && pointer.clientY <= bounds.bottom + 12 && pointer.clientX >= bounds.left - 20 && pointer.clientX <= bounds.right + 20
      if (!valid) { marker.remove(); return }
      const items = [...group!.querySelectorAll<HTMLElement>(':scope > [data-topbar-id]')].filter(item => item !== source)
      const target = items.find(item => { const rect = item.getBoundingClientRect(); return pointer.clientX < rect.left + rect.width / 2 })
      before = target?.dataset.topbarId
      const edge = target?.getBoundingClientRect().left ?? items.at(-1)?.getBoundingClientRect().right ?? bounds.left
      const scale = Number.parseFloat(getComputedStyle(shell!).zoom) || 1
      Object.assign(marker.style, { left: `${(edge - 2) / scale}px`, top: `${(bounds.top + 2) / scale}px`, height: `${Math.max(16, bounds.height - 4) / scale}px` })
      shell!.append(marker)
    }
    function end(pointer: PointerEvent) {
      if (pointer.type === 'pointerup' && dragging && valid) commit(area, id, before)
      suppress = dragging
      clearTimeout(clearSuppression); clearSuppression = setTimeout(() => { suppress = false }, 0)
      cleanup()
    }
    function cancel() { valid = false; cleanup() }
    function key(keyboard: KeyboardEvent) { if (keyboard.key === 'Escape') { keyboard.preventDefault(); cancel() } }
    cleanup = () => {
      window.removeEventListener('pointermove', move, true); window.removeEventListener('pointerup', end, true); window.removeEventListener('pointercancel', end, true)
      window.removeEventListener('blur', cancel); window.removeEventListener('keydown', key, true)
      marker.remove(); source!.classList.remove('topbar-drag-source'); shell!.classList.remove('topbar-reordering')
    }
    window.addEventListener('pointermove', move, true); window.addEventListener('pointerup', end, true); window.addEventListener('pointercancel', end, true)
    window.addEventListener('blur', cancel); window.addEventListener('keydown', key, true)
  }
  function suppressTopbarClick(event: MouseEvent) { if (suppress) { event.preventDefault(); event.stopImmediatePropagation(); suppress = false } }
  onBeforeUnmount(() => { cleanup(); clearTimeout(clearSuppression) })
  return { startTopbarDrag, suppressTopbarClick }
}
