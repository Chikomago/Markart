import test from 'node:test'
import assert from 'node:assert/strict'
import { build } from 'esbuild'
const bundle = await build({ entryPoints: ['src/sync/historyDiff.ts'], bundle: true, write: false, platform: 'node', format: 'esm' })
const { gitDiffRows, searchDiffRows } = await import(`data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString('base64')}`)
test('history diff keeps original line numbers across changes, blank lines and hunks', () => {
  const diff = ['diff --git a/version b/current', '--- a/version', '+++ b/current', '@@ -3,3 +3,4 @@', ' unchanged', '-before', '+after', '+', ' tail', '@@ -20 +21 @@', '-last', '+new last', '\\ No newline at end of file'].join('\n')
  assert.deepEqual(gitDiffRows(diff).map(({ oldLine, newLine }) => [oldLine, newLine]), [[3, 3], [4, null], [null, 4], [null, 5], [5, 6], [20, null], [null, 21]])
  assert.equal(gitDiffRows(diff)[3].text, '')
  assert.deepEqual(gitDiffRows(''), [])
  assert.deepEqual(gitDiffRows('@@ -0,0 +1 @@\n+first').map(row => [row.oldLine, row.newLine]), [[null, 1]])
})

test('search matches changed content only and respects added or removed scope', () => {
  const rows = gitDiffRows('@@ -10,2 +10,2 @@\n same keyword\n-Old KEYword keyword\n+New keyword')
  const all = searchDiffRows(rows, 'keyword', 'all')
  assert.equal(all.length, 2)
  assert.deepEqual(all[0].parts.filter(part => part.match).map(part => part.text), ['KEYword', 'keyword'])
  assert.equal(searchDiffRows(rows, 'keyword', 'removed')[0].oldLine, 11)
  assert.equal(searchDiffRows(rows, 'keyword', 'added')[0].newLine, 11)
  assert.equal(searchDiffRows(rows, 'missing', 'all').length, 0)
  assert.equal(searchDiffRows(rows, '', 'all').length, 3)
  assert.equal(searchDiffRows(rows, '', 'removed').length, 1)
})
