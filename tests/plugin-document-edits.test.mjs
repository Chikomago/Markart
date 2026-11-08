import test from 'node:test'
import assert from 'node:assert/strict'
import { build } from 'esbuild'
const result = await build({ stdin: { contents: `export { PluginRuntime } from './plugins/runtime'; export { applyPluginChanges } from './editor/pluginEdits'; export { EditorState } from '@codemirror/state'; export { history, undo, redo } from '@codemirror/commands'`, resolveDir: process.cwd() + '/src', loader: 'ts' }, bundle: true, platform: 'node', format: 'esm', write: false })
const { PluginRuntime, applyPluginChanges, EditorState, history, undo, redo } = await import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString('base64')}`)
globalThis.localStorage = { getItem: () => null, setItem() {}, removeItem() {} }
async function fixture() {
  let api, active = 'a', calls = 0
  const docs = [{ id: 'a', content: 'one two' }, { id: 'b', content: 'other' }]
  const view = { state: EditorState.create({ doc: docs[0].content, extensions: [history()] }), dispatch(spec) { this.state = this.state.update(spec).state; docs[0].content = this.state.doc.toString(); runtime.emit('document:change', docs[0]) } }
  const runtime = new PluginRuntime(async () => ({ activate(host) { api = host } }))
  runtime.bind({ active: () => docs.find(doc => doc.id === active), list: () => docs, applyEdits(id, expected, edits) { if(id!==active)return 'not-active';calls++; return applyPluginChanges(view, expected, edits) } })
  await runtime.enable({ manifest: { id: 'test.edits' }, main: '' })
  return { api, docs, view, runtime, switchTo(id) { active = id }, calls: () => calls }
}
test('asynchronous edits reject changed target, stale content, and edit-then-undo revisions', async () => {
  const f = await fixture(), snapshot = f.api.documents.get('a')
  f.switchTo('b')
  const request = { documentId: 'a', expectedRevision: snapshot.revision, edits: [{ from: 0, to: 3, text: 'ONE' }] }
  assert.deepEqual(await f.api.documents.applyEdits(request), { ok: false, reason: 'not-active' })
  assert.equal(f.docs[1].content, 'other'); assert.equal(f.calls(), 0)
  f.switchTo('a'); f.view.dispatch({ changes: { from: 0, insert: '!' } })
  assert.deepEqual(await f.api.documents.applyEdits(request), { ok: false, reason: 'stale-revision' })
  f.view.dispatch({ changes: { from: 0, to: 1, insert: '' } })
  assert.equal(f.docs[0].content, snapshot.content)
  assert.deepEqual(await f.api.documents.applyEdits(request), { ok: false, reason: 'stale-revision' })
  assert.equal(f.calls(), 0)
})
test('batch changes use snapshot positions and undo and redo as one isolated operation', async () => {
  const f = await fixture()
  f.view.dispatch({ changes: { from: 7, insert: '!' }, userEvent: 'input.type' })
  const snapshot = f.api.documents.get('a')
  const result = await f.api.documents.applyEdits({ documentId: 'a', expectedRevision: snapshot.revision, edits: [{ from: 4, to: 7, text: 'TWO' }, { from: 0, to: 3, text: 'ONE' }] })
  assert.equal(result.ok, true); assert.equal(result.document.content, 'ONE TWO!')
  assert.ok(result.document.revision > snapshot.revision)
  assert.ok(undo({ state: f.view.state, dispatch: transaction => f.view.dispatch(transaction) }))
  assert.equal(f.docs[0].content, 'one two!')
  assert.ok(redo({ state: f.view.state, dispatch: transaction => f.view.dispatch(transaction) }))
  assert.equal(f.docs[0].content, 'ONE TWO!')
})
test('invalid batches, missing documents and read-only editors leave content unchanged', async () => {
  const f = await fixture(), snapshot = f.api.documents.get('a')
  const apply = edits => f.api.documents.applyEdits({ documentId: 'a', expectedRevision: snapshot.revision, edits })
  for (const edits of [[], [null], [{ from: 0, to: 4, text: 'a' }, { from: 3, to: 5, text: 'b' }], [{ from: 0, to: 99, text: '' }], [{ from: 0, to: 1, text: 2 }]]) assert.equal((await apply(edits)).reason, 'invalid-edits')
  assert.equal((await f.api.documents.applyEdits({ documentId: 'missing', expectedRevision: 0, edits: [] })).reason, 'not-found')
  assert.equal(f.calls(), 0)
  f.view.state = EditorState.create({ doc: snapshot.content, extensions: [EditorState.readOnly.of(true)] })
  assert.equal((await apply([{ from: 0, to: 1, text: 'X' }])).reason, 'not-editable')
  assert.equal(f.docs[0].content, snapshot.content)
})
