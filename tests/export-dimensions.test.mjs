import test from 'node:test'
import assert from 'node:assert/strict'
import { build } from 'esbuild'
const bundle = await build({ entryPoints: ['src/documents/exportPreview.ts'], bundle: true, write: false, platform: 'node', format: 'esm' })
const { formatExportDimensions } = await import(`data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString('base64')}`)
test('export dimensions identify actual paper sizes and preserve pixel resolution', () => {
  assert.equal(formatExportDimensions({ width: 595 * 25.4 / 72, height: 842 * 25.4 / 72, unit: 'mm' }), 'A4 · 210 × 297 mm')
  assert.equal(formatExportDimensions({ width: 297, height: 210, unit: 'mm' }), 'A4 · 297 × 210 mm')
  assert.equal(formatExportDimensions({ width: 215.9, height: 279.4, unit: 'mm' }), 'Letter · 215.9 × 279.4 mm')
  assert.equal(formatExportDimensions({ width: 180, height: 240, unit: 'mm' }), '自定义 · 180 × 240 mm')
  assert.equal(formatExportDimensions({ width: 1191, height: 4023, unit: 'px' }), '1191 × 4023 px')
  assert.equal(formatExportDimensions(), '')
  assert.equal(formatExportDimensions({ width: NaN, height: 240, unit: 'mm' }), '')
})
