export type FileSortMode = 'modifiedDesc' | 'createdDesc' | 'nameAsc' | 'nameDesc'

export type SortableDocument = {
  path: string
  relativePath?: string
  updated: number
  created?: number
}

function leafName(path: string): string { return path.split('/').pop() || path }

export function compareDocuments(a: SortableDocument, b: SortableDocument, mode: FileSortMode): number {
  if (mode === 'modifiedDesc') return b.updated - a.updated
  if (mode === 'createdDesc') return (b.created ?? b.updated) - (a.created ?? a.updated)
  const byName = leafName(a.path).localeCompare(leafName(b.path), 'zh')
  return mode === 'nameAsc' ? byName : -byName
}

export function compareFolders(a: string, b: string, documents: SortableDocument[], mode: FileSortMode, pathOf: (doc: SortableDocument) => string): number {
  if (mode === 'nameAsc' || mode === 'nameDesc') {
    const byName = leafName(a).localeCompare(leafName(b), 'zh')
    return mode === 'nameAsc' ? byName : -byName
  }
  const timestamp = (folder: string) => documents.reduce((latest, doc) => {
    const path = pathOf(doc)
    if (path !== folder && !path.startsWith(`${folder}/`)) return latest
    const value = mode === 'createdDesc' ? (doc.created ?? doc.updated) : doc.updated
    return Math.max(latest, value)
  }, 0)
  return timestamp(b) - timestamp(a) || leafName(a).localeCompare(leafName(b), 'zh')
}
