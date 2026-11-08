export function contentBoundsRequest(data: { expanded?: unknown; top?: unknown; bottom?: unknown }) {
  // Expanding restores the configured height; a stale iframe viewport must not block it.
  if (data.expanded === true) return { height: 0, expanded: true }
  const { top, bottom } = data
  if (typeof top !== 'number' || typeof bottom !== 'number' || !Number.isFinite(top) || !Number.isFinite(bottom) || top < 0 || bottom <= top || bottom > 4096) return null
  return { height: bottom - top, expanded: false }
}
