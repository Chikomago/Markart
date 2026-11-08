import { isMap, isScalar, parseDocument, stringify } from 'yaml'

export function frontmatterSection(source: string) {
  const match = /^(?:\uFEFF)?---[ \t]*\r?\n([\s\S]*?)\r?\n(?:---|\.\.\.)[ \t]*(?:\r?\n|$)/.exec(source)
  return match ? { from: 0, to: match[0].length, yaml: match[1] } : null
}
export function frontmatterFields(source: string) {
  const section = frontmatterSection(source)
  if (!section) return { section, fields: [], error: '' }
  const document = parseDocument(section.yaml, { keepSourceTokens: true })
  if (document.errors.length) return { section, fields: [], error: 'YAML 格式有误，请在源代码视图修改' }
  if (document.contents && !isMap(document.contents)) return { section, fields: [], error: '属性需要使用键值格式' }
  const fields = isMap(document.contents) ? document.contents.items.map(pair => ({ key: String(isScalar(pair.key) ? pair.key.value : pair.key), value: isScalar(pair.value) ? String(pair.value.value ?? '') : JSON.stringify(pair.value?.toJSON() ?? null) })) : []
  return { section, fields, error: '' }
}
export function updateFrontmatter(source: string, key: string, value: string | null, rename?: string) {
  const section = frontmatterSection(source)
  if (!section) throw new Error('文件属性区已移除')
  const document = parseDocument(section.yaml, { keepSourceTokens: true })
  if (document.errors.length || (document.contents && !isMap(document.contents))) throw new Error('请先在源代码视图修正 YAML')
  const ending = source.includes('\r\n') ? '\r\n' : '\n'
  const yamlStart = source.indexOf('\n') + 1
  const pair = isMap(document.contents) ? document.contents.items.find(item => isScalar(item.key) && String(item.key.value) === key) : undefined
  const scalar = (text: string) => stringify(text).trimEnd()
  if (rename !== undefined) {
    if (!rename.trim()) throw new Error('属性名不能为空')
    if (rename !== key && document.has(rename)) throw new Error('已有同名属性')
    if (isScalar(pair?.key) && pair.key.range) return { from: yamlStart + pair.key.range[0], to: yamlStart + pair.key.range[1], insert: scalar(rename) }
  } else if (value === null) {
    if (isMap(document.contents) && !document.contents.flow && isScalar(pair?.key) && pair.key.range && pair.value && 'range' in pair.value && pair.value.range) {
      const start = section.yaml.lastIndexOf('\n', pair.key.range[0] - 1) + 1
      return { from: yamlStart + start, to: yamlStart + pair.value.range[2], insert: '' }
    }
    document.delete(key)
  } else {
    const parsed = parseDocument(value)
    if (parsed.errors.length) throw new Error('属性值的 YAML 格式有误')
    const insert = (parsed.contents ? String(parsed).trimEnd() : scalar('')).replace(/\r?\n/g, ending)
    if (pair?.value && 'range' in pair.value && pair.value.range) return { from: yamlStart + pair.value.range[0], to: yamlStart + pair.value.range[1], insert }
    if (!pair && (!document.contents || (isMap(document.contents) && !document.contents.flow))) {
      return { from: yamlStart + section.yaml.length, to: yamlStart + section.yaml.length, insert: `${section.yaml.trim() ? ending : ''}${scalar(key)}: ${insert}` }
    }
    document.set(key, parsed.contents ?? '')
  }
  const yaml = String(document).trimEnd().replace(/\r?\n/g, ending)
  return { from: section.from, to: section.to, insert: `${source.startsWith('\uFEFF') ? '\uFEFF' : ''}---${ending}${yaml}${ending}---${ending}` }
}
