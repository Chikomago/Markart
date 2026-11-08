import test from 'node:test'
import assert from 'node:assert/strict'
import { build } from 'esbuild'

const bundle = await build({ stdin: { contents: "export { retainDocument, retainedDocument } from './src/editor/documentStates'; export { EditorState } from '@codemirror/state'; export { history, undo, redo } from '@codemirror/commands'", resolveDir: process.cwd(), loader: 'ts' }, bundle: true, platform: 'node', format: 'esm', write: false })
const { retainDocument, retainedDocument, EditorState, history, undo, redo } = await import(`data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString('base64')}`)

test('tab state restoration retains native selection and undo redo history', () => {
  let state = EditorState.create({ doc: 'before\ntext', extensions: [history()] })
  state = state.update({ changes: { from: 7, to: 11, insert: 'changed' }, selection: { anchor: 10 } }).state
  retainDocument('restored-tab', state)
  const restored = retainedDocument('restored-tab', 'before\nchanged')
  assert.equal(restored, state)
  assert.equal(restored.selection.main.head, 10)
  const target = { get state() { return state }, dispatch(transaction) { state = transaction.state } }
  assert.equal(undo(target), true)
  assert.equal(state.doc.toString(), 'before\ntext')
  assert.equal(redo(target), true)
  assert.equal(state.doc.toString(), 'before\nchanged')
})

test('external content changes invalidate retained document state', () => {
  retainDocument('external-change', EditorState.create({ doc: 'original' }))
  assert.equal(retainedDocument('external-change', 'external edit'), undefined)
  assert.equal(retainedDocument('missing-tab', 'original'), undefined)
})

test('retaining a document refreshes its position in the bounded state cache', () => {
  for (let index = 0; index < 20; index++) retainDocument(`bounded-${index}`, EditorState.create({ doc: String(index) }))
  const oldest = retainedDocument('bounded-0', '0')
  retainDocument('bounded-0', oldest)
  retainDocument('bounded-new', EditorState.create({ doc: 'new' }))
  assert.equal(retainedDocument('bounded-0', '0'), oldest)
  assert.equal(retainedDocument('bounded-1', '1'), undefined)
})
