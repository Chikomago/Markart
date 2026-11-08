export type DocumentExcerpt = { before: string; match: string; after: string }

function firstMatch(text: string, query: string): RegExpExecArray | null {
  if (!query.trim()) return null
  const escaped = query.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return new RegExp(escaped, 'iu').exec(text)
}

function clean(text: string): string { return text.replace(/\s+/g, ' ').trim() }

export function documentExcerpt(content: string, fallback: string, query: string, searchSnippet?: string): DocumentExcerpt {
  const source = content || fallback
  const matchSource = firstMatch(content, query) ? content : firstMatch(searchSnippet || '', query) ? searchSnippet! : ''
  const match = firstMatch(matchSource, query)
  if (match) {
    const start = Math.max(0, match.index - 16)
    const end = Math.min(matchSource.length, match.index + match[0].length + 48)
    return {
      before: `${start ? '…' : ''}${clean(matchSource.slice(start, match.index))}`,
      match: match[0],
      after: `${clean(matchSource.slice(match.index + match[0].length, end))}${end < matchSource.length ? '…' : ''}`
    }
  }
  const lines = source.split(/\r\n|\r|\n/).map(line => line.replace(/[#*`>\[\]]/g, '').trim()).filter(Boolean).slice(0, 2)
  const plain = lines.join(' ')
  return { before: plain.length > 180 ? `${plain.slice(0, 180)}…` : plain, match: '', after: '' }
}
