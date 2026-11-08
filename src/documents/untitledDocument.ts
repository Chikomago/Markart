import type { Doc } from '../workspace/sample'

export function createUntitledDocument(content = ''): Doc {
  const now = Date.now()
  return { id: `untitled:${crypto.randomUUID()}`, path: '未命名文件.md', content, loaded: true, temporary: true, created: now, updated: now }
}
