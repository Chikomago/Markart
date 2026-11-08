import test from 'node:test'
import assert from 'node:assert/strict'
import { build } from 'esbuild'
const result = await build({
  stdin: { contents: `export { PluginRuntime } from './plugins/runtime'`, resolveDir: process.cwd() + '/src', loader: 'ts' },
  bundle: true, platform: 'node', format: 'esm', write: false,
  plugins: [{ name: 'native-index', setup(build) {
    build.onResolve({ filter: /^@tauri-apps\/api\/(core|event)$/ }, args => ({ path: args.path, namespace: 'native-index' }))
    build.onLoad({ filter: /.*/, namespace: 'native-index' }, ({ path }) => ({ contents: path.endsWith('/core') ? `export const isTauri=()=>false; export const invoke=(...args)=>globalThis.indexFixture.invoke(...args)` : `export const listen=(...args)=>globalThis.indexFixture.listen(...args)`, loader: 'js' }))
  } }],
})
const { PluginRuntime } = await import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString('base64')}`)
globalThis.localStorage = { getItem: () => null, setItem() {}, removeItem() {} }
const tick = () => new Promise(resolve => setImmediate(resolve))
function deferred() { let resolve; const promise = new Promise(done => { resolve = done }); return { promise, resolve } }
async function fixture() {
  let api, root = '/root', listener, count = 0
  const calls = []
  const native = {
    invoke: async (command, args) => { calls.push({ command, args }); return args.operation === 'watch' ? { root, cursor: 'epoch:0' } : { value: args.operation } },
    listen: async (event, callback) => { assert.equal(event, 'markart-index-changed'); listener = callback; count++; return () => { count--; if (listener === callback) listener = undefined } },
  }
  globalThis.indexFixture = native
  const runtime = new PluginRuntime(async () => ({ activate(host) { api = host } }))
  runtime.bind({ root: () => root, active: () => null, list: () => [] })
  await runtime.enable({ manifest: { id: 'test.index' }, main: '' })
  return { api, runtime, native, calls, emit(cursor, eventRoot = root) { listener?.({ payload: { root: eventRoot, cursor } }) }, count: () => count, changeRoot(value) { root = value; runtime.emit('workspace:change', { root }) } }
}
test('index methods route typed queries through native scope and reject late workspace results', async () => {
  const f = await fixture()
  await f.api.index.metadata('file', 2)
  await f.api.index.links({ id: 'file', direction: 'incoming', after: 20, limit: 50 })
  await f.api.index.tagged('work', { cursor: 'epoch:0' })
  assert.deepEqual(f.calls.map(call => call.args.operation), ['metadata', 'links', 'tagged'])
  assert.equal(f.calls[1].args.after, '20'); assert.equal(f.calls[1].args.root, '/root')
  const pending = deferred(); f.native.invoke = () => pending.promise
  const request = f.api.index.files(); f.changeRoot('/other'); pending.resolve({ files: [] })
  await assert.rejects(request, /workspace-changed/)
  await f.runtime.disable('test.index')
})
test('subscription coalesces notices, serializes callbacks and stops on workspace change', async () => {
  const f = await fixture(), received = [], initial = deferred()
  let active = 0, maximum = 0
  const stop = await f.api.index.subscribe(async notice => {
    active++; maximum = Math.max(active, maximum); received.push(notice.cursor)
    if (notice.cursor === 'epoch:0') await initial.promise
    active--
  })
  f.emit('epoch:1', '/other'); f.emit('epoch:1'); f.emit('epoch:2'); f.emit('epoch:1')
  initial.resolve(); await tick()
  assert.deepEqual(received, ['epoch:0', 'epoch:2']); assert.equal(maximum, 1)
  f.changeRoot('/other'); assert.equal(f.count(), 0)
  f.changeRoot('/root'); f.emit('epoch:3'); await tick()
  assert.deepEqual(received, ['epoch:0', 'epoch:2'])
  stop(); await f.runtime.disable('test.index'); assert.equal(f.count(), 0)
})
test('disabling while native listener registration is pending releases the late listener', async () => {
  const f = await fixture(), pending = deferred()
  let cleanup = 0
  f.native.listen = () => pending.promise
  const subscription = f.api.index.subscribe(() => assert.fail('disabled callback'))
  await f.runtime.disable('test.index'); pending.resolve(() => { cleanup++ })
  const stop = await subscription; stop(); assert.equal(cleanup, 1)
  assert.equal(f.calls.length, 0)
})
test('subscription listens before arming and does not deliver an older initial cursor', async () => {
  const f = await fixture(), received = []
  f.native.invoke = async () => { f.emit('epoch:3'); return { root: '/root', cursor: 'epoch:2' } }
  const stop = await f.api.index.subscribe(notice => { received.push(notice.cursor) })
  await tick(); assert.deepEqual(received, ['epoch:3'])
  stop(); assert.equal(f.count(), 0); await f.runtime.disable('test.index')
})
