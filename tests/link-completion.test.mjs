import test from 'node:test'
import assert from 'node:assert/strict'
import { build } from 'esbuild'
const bundle = await build({ entryPoints: ['src/editor/linkCompletion.ts'], bundle: true, platform: 'node', format: 'esm', write: false })
const { linkRange, linkSuggestions, linkCompletionChange, resolveLinkPath, linkCompletion } = await import(`data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString('base64')}`)
const files = [{ path: 'notes/link-test-a.md' }, { path: 'notes/link-test-b.md' }, { path: 'notes/QuickStart.md' }, { path: 'notes/归档', directory: true }, { path: 'assets', directory: true }, { path: 'assets/my picture(1).png' }, { path: 'archive/manual.pdf' }]
const source = 'notes/link-test-a.md'

test('detects typing in labels and destinations without treating normal prose as a link', () => {
  assert.equal(linkRange('hello ht', 8), null)
  assert.equal(linkRange('[ht]()', 3).part, 'label')
  assert.equal(linkRange('[label](ht)', 10).part, 'destination')
  assert.equal(linkRange('[label](ht)', 3), null)
  assert.equal(linkRange('\\[ht]()', 4), null)
})
test('directory scopes follow the source file and parent navigation', () => {
  assert.equal(linkSuggestions('../', source, [...files, { path: 'notes', directory: true }]).find(item => item.path === 'notes').destination, './')
  const near = linkSuggestions('./', source, files)
  assert.deepEqual(near.map(item => item.path).sort(), ['notes/QuickStart.md', 'notes/link-test-b.md', 'notes/归档'].sort())
  const parent = linkSuggestions('../as', source, files)
  assert.deepEqual(parent.map(item => item.path), ['assets'])
  const image = linkSuggestions('../assets/', source, files)[0]
  assert.equal(image.destination, '../assets/my picture(1).png')
  assert.equal(image.image, true)
  assert.equal(linkSuggestions('../../', source, files).length, 0)
})
test('filename prefixes, initials and Chinese prefixes work across folders', () => {
  assert.equal(linkSuggestions('qs', source, files)[0].path, 'notes/QuickStart.md')
  assert.equal(linkSuggestions('ltb', source, files)[0].path, 'notes/link-test-b.md')
  assert.equal(linkSuggestions('归', source, files)[0].path, 'notes/归档')
  assert.equal(linkSuggestions('manual', source, files)[0].destination, '../archive/manual.pdf')
})
test('absolute paths inside the workspace become portable relative links', () => {
  const item = linkSuggestions('/workspace/assets/my', source, files, '/workspace')[0]
  assert.equal(item.destination, '../assets/my picture(1).png')
})
test('http intent suggests https and does not silently replace typed text', () => {
  const range = linkRange('[ht]()', 3)
  const item = linkSuggestions(range.query, source, files)[0]
  assert.equal(item.destination, 'https://')
  const change = linkCompletionChange(range, item)
  assert.equal(change.insert, '[](https://)')
  assert.equal(change.anchor, change.insert.length - 1)
  assert.equal(linkSuggestions('www.example.com', source, files)[0].destination, 'https://www.example.com')
  const completed = linkCompletionChange(linkRange('[](https://example.com)', 21), linkSuggestions('https://example.com', source, files)[0])
  assert.equal(completed.insert, '[https://example.com](https://example.com)')
  assert.equal(completed.anchor, completed.insert.length)
  assert.equal(linkSuggestions('https://example.com/a.png', source, files)[0].image, true)
})
test('choosing an image embeds it and percent-encodes spaces and parentheses', () => {
  const item = linkSuggestions('../assets/', source, files)[0]
  const range = linkRange('[图片](../assets/)', 15)
  const change = linkCompletionChange(range, item)
  assert.equal(change.insert, '![图片](../assets/my%20picture%281%29.png)')
  assert.equal(resolveLinkPath(source, '../assets/my%20picture%281%29.png'), item.path)
})
test('normal files stay links and choosing a folder continues destination entry', () => {
  const range = linkRange('[手册](manual)', 10)
  assert.equal(linkCompletionChange(range, linkSuggestions('manual', source, files)[0]).insert, '[手册](../archive/manual.pdf)')
  const folder = linkCompletionChange(linkRange('[as]()', 3), linkSuggestions('as', source, files)[0])
  assert.equal(folder.insert, '[](../assets/)')
  assert.equal(folder.anchor, folder.insert.length - 1)
  assert.equal(folder.again, true)
  assert.equal(resolveLinkPath(source, '#heading'), source)
  assert.equal(resolveLinkPath(source, '../../outside'), null)
  assert.equal(resolveLinkPath(source, 'javascript:alert(1)'), null)
})

test('bare dots navigate directories instead of fuzzily matching dotted filenames', () => {
  const entries = [...files, { path: 'archive', directory: true }, { path: 'notes', directory: true }]
  assert.deepEqual(linkSuggestions('..', source, entries), linkSuggestions('../', source, entries))
  assert.deepEqual(linkSuggestions('.', source, entries), linkSuggestions('./', source, entries))
  assert.deepEqual(linkSuggestions('../notes/..', source, entries), linkSuggestions('../', source, entries))
  assert.equal(linkSuggestions('..', 'root.md', entries).length, 0)
})

test('directory listing does not drop later folders after the first forty matches', () => {
  const entries = Array.from({ length: 55 }, (_, index) => ({ path: `folder-${String(index).padStart(2, '0')}`, directory: true }))
  assert.equal(linkSuggestions('../', source, entries).length, 55)
  assert.ok(linkSuggestions('..', source, entries).some(item => item.path === 'folder-54'))
})
