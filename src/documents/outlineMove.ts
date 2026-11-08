import { headingsOf } from '../editor/markdownCore'

export type SectionMove = { source: string; target: string; sourceFrom: number; sourceTo: number; targetFrom: number; result: string }

function parentOf(headings: ReturnType<typeof headingsOf>, index: number): number {
  const level = headings[index]?.level
  if (!level) return -1
  for (let previous = index - 1; previous >= 0; previous--) if (headings[previous].level < level) return previous
  return -1
}

export function previewSectionMove(content: string, sourceIndex: number, targetIndex: number): SectionMove | null {
  const headings = headingsOf(content)
  const source = headings[sourceIndex]
  const target = headings[targetIndex]
  if (!source || !target || sourceIndex === targetIndex || source.level !== target.level || parentOf(headings, sourceIndex) !== parentOf(headings, targetIndex)) return null
  let sourceTo = content.length
  for (let next = sourceIndex + 1; next < headings.length; next++) if (headings[next].level <= source.level) { sourceTo = headings[next].offset; break }
  if (target.offset > source.offset && target.offset === sourceTo) return null
  const segment = content.slice(source.offset, sourceTo)
  const without = content.slice(0, source.offset) + content.slice(sourceTo)
  const insertion = target.offset - (source.offset < target.offset ? segment.length : 0)
  const result = without.slice(0, insertion) + segment + without.slice(insertion)
  return { source: source.text, target: target.text, sourceFrom: source.offset, sourceTo, targetFrom: target.offset, result }
}
