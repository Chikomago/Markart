export function searchGroups(query: string): string[][] {
  return query.replace(/｜｜/g, '||').replace(/＆＆/g, '&&').split('||').map(group => group.split('&&').map(term => term.trim().toLowerCase()).filter(Boolean)).filter(group => group.length)
}
export function extensionOf(path: string): string {
  const name = path.split('/').pop() || '', dot = name.lastIndexOf('.')
  return dot > 0 ? name.slice(dot + 1).toLowerCase() : ''
}
export function requestedExtensions(value: string): string[] { return [...new Set(value.toLowerCase().split(/[\s,;，；]+/).map(part => part.replace(/^\*?\./, '')).filter(Boolean))] }
export function hiddenPath(path: string): boolean { return path.split('/').some(part => part.startsWith('.')) }
