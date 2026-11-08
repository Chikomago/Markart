export function gitDiffRows(diff: string) {
  const rows: { kind: 'added' | 'removed' | 'context'; text: string; oldLine: number | null; newLine: number | null }[] = []
  let oldLine = 0, newLine = 0, inHunk = false
  for (const line of diff.split('\n')) {
    const hunk = /^@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/.exec(line)
    if (hunk) { oldLine = Number(hunk[1]); newLine = Number(hunk[2]); inHunk = true; continue }
    if (!inHunk || !/^[ +\-]/.test(line)) continue
    if (line[0] === '+') rows.push({ kind: 'added', text: line.slice(1), oldLine: null, newLine: newLine++ })
    else if (line[0] === '-') rows.push({ kind: 'removed', text: line.slice(1), oldLine: oldLine++, newLine: null })
    else rows.push({ kind: 'context', text: line.slice(1), oldLine: oldLine++, newLine: newLine++ })
  }
  return rows
}

export function searchDiffRows(rows: ReturnType<typeof gitDiffRows>, query: string, scope: 'all' | 'removed' | 'added') {
  const keyword = query.toLocaleLowerCase()
  return rows.filter(row => {
    if (scope !== 'all' && row.kind !== scope) return false
    return !keyword || (row.kind !== 'context' && row.text.toLocaleLowerCase().includes(keyword))
  }).map(row => {
    const parts: { text: string; match: boolean }[] = []
    let start = 0
    if (keyword) {
      const lower = row.text.toLocaleLowerCase()
      for (let index = lower.indexOf(keyword); index !== -1; index = lower.indexOf(keyword, start)) {
        if (index > start) parts.push({ text: row.text.slice(start, index), match: false })
        parts.push({ text: row.text.slice(index, index + query.length), match: true })
        start = index + query.length
      }
    }
    if (start < row.text.length || !parts.length) parts.push({ text: row.text.slice(start) || ' ', match: false })
    return { ...row, parts }
  })
}
