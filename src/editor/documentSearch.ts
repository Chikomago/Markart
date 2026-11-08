export type FindOptions = { caseSensitive: boolean; regexp: boolean; wildcard: boolean; ignoreSpaces: boolean; ignorePunctuation: boolean; distinguishWidth: boolean }
export type FindMatch = { from: number; to: number; replacement: string }
export function documentMatches(source: string, query: string, replace: string, options: FindOptions): FindMatch[] {
  const normalize = (text: string, pattern = false) => {
    let result = ''
    for (let char of text) {
      if (!options.distinguishWidth) char = char.replace(/[！-～]/g, value => String.fromCharCode(value.charCodeAt(0) - 0xfee0)).replace(/　/g, ' ')
      if (!pattern && ((options.ignoreSpaces && /\s/u.test(char)) || (options.ignorePunctuation && /\p{P}/u.test(char)))) continue
      result += char
    }
    return result
  }
  let text = ''; const starts: number[] = [], ends: number[] = []
  let offset = 0
  for (const char of source) { const part = normalize(char); for (let i = 0; i < part.length; i++) { starts.push(offset); ends.push(offset + char.length) }; text += part; offset += char.length }
  let pattern = options.wildcard && !options.regexp ? query.split(/([*?])/).map(part => part === '*' || part === '?' ? part : normalize(part)).join('') : normalize(query, options.regexp)
  if (!options.regexp) pattern = [...pattern].map(char => options.wildcard && char === '*' ? '[^\\n]*' : options.wildcard && char === '?' ? '[^\\n]' : char.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('')
  if (!pattern) return []
  const regex = new RegExp(pattern, options.caseSensitive ? 'gmu' : 'gimu'), matches: FindMatch[] = []
  for (const match of text.matchAll(regex)) {
    if (!match[0].length) continue
    const from = starts[match.index!], to = ends[match.index! + match[0].length - 1]
    const replacement = options.regexp ? replace.replace(/\$(\$|&|\d{1,2})/g, (token, group) => group === '$' ? '$' : group === '&' ? source.slice(from, to) : match[Number(group)] ?? token) : replace
    matches.push({ from, to, replacement })
  }
  return matches
}
