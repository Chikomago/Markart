import test from 'node:test'
import assert from 'node:assert/strict'
import { build } from 'esbuild'
const bundle = await build({ stdin: { contents: "export { parseLocalPlugin } from './plugins/local'", resolveDir: process.cwd() + '/src', loader: 'ts' }, bundle: true, platform: 'node', format: 'esm', write: false })
const { parseLocalPlugin } = await import(`data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString('base64')}`)
const manifest = JSON.stringify({ apiVersion: 2, id: 'example.local', name: 'Local', version: '1.0.0' })
test('local package validates metadata, preserves source and never executes it during import', () => {
 const main = 'throw new Error("must not execute")'
 const pkg = parseLocalPlugin({ manifest, main, styles: null })
 assert.equal(pkg.main, main)
 assert.equal(pkg.repo, '')
 assert.equal(pkg.manifest.id, 'example.local')
 assert.equal(pkg.styles, undefined)
 assert.throws(() => parseLocalPlugin({ manifest: '{}', main }))
 assert.throws(() => parseLocalPlugin({ manifest, main: ' ' }))
 assert.throws(() => parseLocalPlugin({ manifest, main: '中'.repeat(2 * 1024 * 1024) }))
})
