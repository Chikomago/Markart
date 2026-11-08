import { pathToFileURL } from 'node:url'
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { build } from 'esbuild'

const dir = mkdtempSync(join(tmpdir(), 'markart-view-test-')), output = join(dir, 'panel.mjs')
await build({ entryPoints: ['examples/plugins/shared/indexPanel.ts'], bundle: true, platform: 'node', format: 'esm', outfile: output })
const { scopeFiles } = await import(pathToFileURL(output).href)

const files = [
  { id: '1', path: 'a/x.md', version: 1, size: 1, text: true },
  { id: '2', path: 'b/y.md', version: 1, size: 1, text: true },
  { id: '3', path: 'a/z.txt', version: 1, size: 1, text: true },
]
const view = (patch = {}) => ({ root: '/w', files: ['a/x.md', 'b/y.md', 'a/z.txt'], folders: ['a', 'b'], selected: null, filter: { extensions: [], search: '', active: false }, ...patch })
const paths = list => list.map(file => file.path)

test('without a view the whole index stays visible', () => {
  assert.deepEqual(paths(scopeFiles(files, null)), ['a/x.md', 'b/y.md', 'a/z.txt'])
})

test('an inactive filter keeps every file', () => {
  assert.equal(scopeFiles(files, view()).length, 3)
})

test('an active filter follows the paths the file list shows', () => {
  assert.deepEqual(paths(scopeFiles(files, view({ files: ['a/x.md'], filter: { extensions: ['md', 'txt'], search: 'x', active: true } }))), ['a/x.md'])
})

test('a selected folder narrows the graph to that subtree', () => {
  assert.deepEqual(paths(scopeFiles(files, view({ selected: { path: 'a', kind: 'folder' } }))), ['a/x.md', 'a/z.txt'])
})

test('a selected file does not narrow the graph', () => {
  assert.deepEqual(paths(scopeFiles(files, view({ selected: { path: 'a/x.md', kind: 'file' } }))), ['a/x.md', 'b/y.md', 'a/z.txt'])
})

test('an empty filter result yields an empty graph instead of falling back', () => {
  assert.deepEqual(scopeFiles(files, view({ files: [], filter: { extensions: ['csv'], search: '', active: true } })), [])
})
