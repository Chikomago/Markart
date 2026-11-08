import assert from 'node:assert/strict'
import test from 'node:test'
import { build } from 'esbuild'

const bundle = await build({ entryPoints: [new URL('../src/editor/slashCommands.ts', import.meta.url).pathname], bundle: true, platform: 'node', format: 'esm', write: false })
const { slashCommands, slashRange, slashCommandChange, matchingSlashCommands, slashKeywordMatches } = await import(`data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString('base64')}`)

test('slash before existing text opens commands and formats without removing text', () => {
  assert.deepEqual(slashRange('/已有内容', 1), { from: 0, to: 1, query: '' })
  assert.deepEqual(slashCommandChange('/已有内容', 1, slashCommands.find(command => command.id === 'h1')), { from: 0, to: 1, insert: '# ' })
})

test('slash query before existing text only replaces the command prefix', () => {
  assert.deepEqual(slashRange('/h2已有内容', 3), { from: 0, to: 3, query: 'h2' })
  assert.deepEqual(slashCommandChange('/h2已有内容', 3, slashCommands.find(command => command.id === 'h2')), { from: 0, to: 3, insert: '## ' })
})

test('multiline slash command inserts before existing text on a separate line', () => {
  const table = slashCommands.find(command => command.id === 'table')
  assert.deepEqual(slashCommandChange('/已有内容', 1, table), { from: 0, to: 1, insert: `${table.snippet}\n` })
})

test('slash in the middle of existing text does not open block commands', () => {
  assert.equal(slashRange('正文/内容', 3), null)
})

test('inline commands are available inside prose but URLs do not open the menu', () => {
  assert.deepEqual(slashRange('正文 /bold', 8), { from: 3, to: 8, query: 'bold' })
  assert.equal(slashRange('https://example.com/path', 23), null)
  for (const id of ['bold', 'italic', 'strikethrough', 'underline', 'inline-code', 'inline-formula', 'link', 'image', 'comment', 'footnote']) assert.ok(slashCommands.some(command => command.id === id))
  const link = slashCommands.find(command => command.id === 'link')
  assert.deepEqual(slashCommandChange('/link', 5, link), { from: 0, to: 5, insert: '[]()', selection: { anchor: 1, head: 1 } })
})


test('slash completion matches Chinese, English, pinyin, initials and multiple keywords', () => {
  for (const [query, id] of [['代码', 'code'], ['CODE', 'code'], ['daima', 'code'], ['dm', 'code'], ['bg', 'table'], ['lct', 'mermaid'], ['nt', 'mindmap'], ['h2', 'h2'], ['inline formula', 'inline-formula'], ['  code inline  ', 'inline-code']]) {
    assert.ok(matchingSlashCommands(query).some(command => command.id === id), query)
  }
  assert.equal(matchingSlashCommands('no-such-command').length, 0)
  assert.deepEqual(matchingSlashCommands('').slice(0, 6).map(command => command.id), ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'])
  assert.equal(slashKeywordMatches('my tool', 'My plugin tool', 'plugin:action'), true)
})

test('completing a keyword replaces slash and keyword while keeping following content', () => {
  const source = '/bg后面的文字'
  const command = matchingSlashCommands('bg').find(command => command.id === 'table')
  const change = slashCommandChange(source, 3, command)
  assert.equal(change.from, 0)
  assert.equal(change.to, 3)
  assert.equal(source.slice(change.to), '后面的文字')
})
