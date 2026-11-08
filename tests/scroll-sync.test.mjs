import test from 'node:test'
import assert from 'node:assert/strict'
import { build } from 'esbuild'

const bundle = await build({ entryPoints: ['src/editor/scrollSyncGate.ts'], bundle: true, platform: 'node', format: 'esm', write: false })
const { ScrollSyncGate } = await import(`data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString('base64')}`)

test('延迟到来的程序化滚动不会被误认为反向用户滚动', () => {
  const gate = new ScrollSyncGate()
  let source = 500; let preview = 0
  const onScroll = (pane, position) => {
    if (gate.consume(pane, position)) return
    if (pane === 'source') { preview = 480; gate.expect('preview', preview) }
    else { source = 450; gate.expect('source', source) }
  }
  onScroll('source', source)
  assert.equal(preview, 480)
  // The browser delivers this event after the old one-frame guard would expire.
  onScroll('preview', preview)
  assert.equal(source, 500)
})

test('连续的同步目标可以合并，真正的另一栏滚动仍能接管', () => {
  const gate = new ScrollSyncGate()
  gate.expect('preview', 120)
  gate.expect('preview', 240)
  assert.equal(gate.consume('preview', 240), true)
  assert.equal(gate.consume('preview', 320), false)
  gate.expect('source', 700)
  gate.clear()
  assert.equal(gate.consume('source', 700), false)
})

test('编辑器把目标滚动位置微调到整行后，右侧连续滚动不能被反向写回', () => {
  const gate = new ScrollSyncGate()
  let preview = 101
  const targetSource = 50
  gate.claim('preview', 100)
  gate.expect('source', targetSource)
  const actualSource = 58 // CodeMirror 测量或滚动边界可使最终坐标偏离设置值
  if (!gate.consume('source', actualSource, 116)) preview = 120 // 旧逻辑把整行位置映射回右侧，形成台阶
  assert.equal(preview, 101)
  gate.claim('source', 130) // 用户转而滚动左侧时立即取得控制权
  assert.equal(gate.consume('source', 65, 140), false)
})
