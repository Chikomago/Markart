export type FileKind = 'markdown' | 'text' | 'convertible' | 'unsupported'

const extensions: Record<string, FileKind> = {
  md: 'markdown', markdown: 'markdown', mdown: 'markdown', mkd: 'markdown',
  txt: 'text', text: 'text', css: 'text', scss: 'text', less: 'text',
  js: 'text', mjs: 'text', cjs: 'text', jsx: 'text', ts: 'text', mts: 'text', cts: 'text', tsx: 'text',
  json: 'text', jsonc: 'text', html: 'text', htm: 'text', yaml: 'text', yml: 'text', xml: 'text', svg: 'text',
  py: 'text', rs: 'text', sh: 'text', bash: 'text', zsh: 'text', sql: 'text',
  java: 'text', c: 'text', cc: 'text', cpp: 'text', h: 'text', hpp: 'text', cs: 'text', go: 'text',
  rb: 'text', php: 'text', swift: 'text', kt: 'text', kts: 'text', lua: 'text', toml: 'text', ini: 'text', cfg: 'text', log: 'text',
  docx: 'convertible', pdf: 'convertible'
}
export function fileKind(path: string): FileKind {
  const extension = path.split('/').pop()?.split('.').pop()?.toLowerCase() || ''
  return extensions[extension] || 'text'
}

export function formatLabel(kind: FileKind, path?: string): string {
  if (path && !extensions[path.split('/').pop()?.split('.').pop()?.toLowerCase() || '']) return 'unknown'
  return { markdown: 'Markdown', text: '纯文本', convertible: '转换为 Markdown', unsupported: '不支持' }[kind]
}
