import test from 'node:test'
import assert from 'node:assert/strict'
import { build } from 'esbuild'
const bundle = await build({ entryPoints: ['src/documents/frontmatter.ts'], bundle: true, platform: 'browser', format: 'esm', write: false })
const { frontmatterFields, frontmatterSection, updateFrontmatter } = await import(`data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString('base64')}`)
const apply = (source, edit) => source.slice(0, edit.from) + edit.insert + source.slice(edit.to)

test('front matter recognizes BOM and CRLF without consuming body', () => {
  const source = '\uFEFF---\r\ntitle: Example\r\n---\r\n\r\n# Body'
  assert.equal(frontmatterFields(source).fields[0].value, 'Example')
  assert.equal(source.slice(frontmatterSection(source).to), '\r\n# Body')
  assert.equal(frontmatterSection('Body\n---\ntitle: Example\n---'), null)
})
test('property changes preserve unrelated YAML comments and body', () => {
  const source = '---\n# Note\ntitle: Before\ntags: [one, two]\n---\n\nBody **unchanged**'
  const next = apply(source, updateFrontmatter(source, 'title', 'After'))
  assert.ok(next.includes('# Note') && next.includes('tags: [one, two]'))
  assert.ok(next.endsWith('\n\nBody **unchanged**'))
  assert.equal(frontmatterFields(next).fields[0].value, 'After')
})
test('properties can be added renamed removed and cannot overwrite another key', () => {
  let source = '---\ntitle: Before\n---\nBody'
  source = apply(source, updateFrontmatter(source, 'draft', 'true'))
  source = apply(source, updateFrontmatter(source, 'draft', '', 'published'))
  assert.equal(frontmatterFields(source).fields.find(field => field.key === 'published').value, 'true')
  assert.throws(() => updateFrontmatter(source, 'published', '', 'title'), /同名/)
  source = apply(source, updateFrontmatter(source, 'published', null))
  assert.equal(frontmatterFields(source).fields.length, 1)
})
test('invalid YAML is reported and preserved rather than rewritten', () => {
  const source = '---\ntitle: [unfinished\n---\nBody'
  assert.ok(frontmatterFields(source).error)
  assert.throws(() => updateFrontmatter(source, 'title', 'New'), /修正/)
})
