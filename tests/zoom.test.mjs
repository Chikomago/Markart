import test from 'node:test'
import assert from 'node:assert/strict'
import { build } from 'esbuild'

async function load(entryPoint) {
  const bundle = await build({ entryPoints: [entryPoint], bundle: true, platform: 'node', format: 'esm', write: false })
  return import(`data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString('base64')}`)
}

test('⌘+ 和 ⌘− 按 5% 缩放并遵守边界', async () => {
  const { zoomShortcutDirection, stepZoom } = await load('src/settings/zoomControls.ts')
  assert.equal(zoomShortcutDirection({ metaKey: true, ctrlKey: false, altKey: false, key: '+', code: 'Equal' }), 1)
  assert.equal(zoomShortcutDirection({ metaKey: true, ctrlKey: false, altKey: false, key: '-', code: 'Minus' }), -1)
  assert.equal(zoomShortcutDirection({ metaKey: false, ctrlKey: false, altKey: false, key: '+', code: 'Equal' }), 0)
  assert.equal(stepZoom(100, 1), 105)
  assert.equal(stepZoom(150, 1), 150)
  assert.equal(stepZoom(75, -1), 75)
})
