import type { Doc } from '../workspace/sample'
export function dirtyMoveDocument(docs: Doc[], dirtyIds: string[], from: string, references: { relativePath: string }[] = []): Doc | undefined {
  const rewrites = new Set(references.map(item => item.relativePath))
  return docs.find(doc => dirtyIds.includes(doc.id) && !!doc.relativePath && (doc.relativePath === from || doc.relativePath.startsWith(from + '/') || rewrites.has(doc.relativePath)))
}
export function externalMoveLinkCount(from: string, references: { relativePath: string; changes: unknown[] }[]): number {
  return references.reduce((total, item) => item.relativePath === from || item.relativePath.startsWith(`${from}/`) ? total : total + item.changes.length, 0)
}
