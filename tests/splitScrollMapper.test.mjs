import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import ts from 'typescript'

const source = readFileSync(new URL('../src/editor/splitScrollMapper.ts', import.meta.url), 'utf8')
const output = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText
const { SplitScrollMapper } = await import(`data:text/javascript;base64,${Buffer.from(output).toString('base64')}`)

test('source bottom reaches preview bottom', () => {
  const mapper = new SplitScrollMapper(700, 1200)
  assert.equal(mapper.fromSource(700), 1200)
  assert.equal(mapper.fromPreview(1200), 700)
  assert.ok(mapper.fromSource(699) < 1200)
  assert.ok(mapper.fromSource(699) > 680)
})

test('scroll progress stays proportional despite headings with different heights', () => {
  const mapper = new SplitScrollMapper(800, 1200)
  for (const fraction of [0.25, 0.5, 0.75]) {
    assert.equal(mapper.fromSource(800 * fraction), 1200 * fraction)
    assert.equal(mapper.fromPreview(1200 * fraction), 800 * fraction)
  }
})

test('small source and preview scroll increments remain continuous', () => {
  const mapper = new SplitScrollMapper(2000, 1200)
  for (const direction of ['fromSource', 'fromPreview']) {
    const positions = [101, 102, 103, 104].map(pixel => mapper[direction](pixel))
    assert.ok(positions.every((value, index) => !index || value > positions[index - 1]))
  }
})
