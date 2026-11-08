/** Compare native file-manager paths with stored canonical paths, including Windows separators. */
export function pathIdentity(path: string): string {
  const normalized = path.replace(/\\/g, '/').replace(/^\/\/\?\/UNC\//i, '//').replace(/^\/\/\?\//, '').replace(/\/$/, '')
  return /^[a-z]:\//i.test(normalized) || normalized.startsWith('//') ? normalized.toLowerCase() : normalized
}
export function relativeToRoot(path: string, root: string): string | null {
  const normalized = path.replace(/\\/g, '/').replace(/^\/\/\?\/UNC\//i, '//').replace(/^\/\/\?\//, '')
  const prefix = root.replace(/\\/g, '/').replace(/^\/\/\?\/UNC\//i, '//').replace(/^\/\/\?\//, '').replace(/\/$/, '')
  return pathIdentity(normalized).startsWith(`${pathIdentity(prefix)}/`) ? normalized.slice(prefix.length + 1) : null
}
