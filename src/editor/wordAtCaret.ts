const segmenter = new Intl.Segmenter('zh-CN', { granularity: 'word' })

/** Offsets use UTF-16, matching CodeMirror and the browser selection. */
export function wordAtCaret(text: string, offset: number): { from: number; to: number } | null {
  if (offset < 0 || offset > text.length) return null
  let previous: { from: number; to: number } | null = null
  for (const part of segmenter.segment(text)) {
    const from = part.index, to = from + part.segment.length
    if (part.isWordLike && from <= offset && offset < to) return { from, to }
    if (part.isWordLike && to === offset) previous = { from, to }
    if (from > offset) break
  }
  return previous
}
