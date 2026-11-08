import test from 'node:test'
import assert from 'node:assert/strict'
import { build } from 'esbuild'
const result = await build({ stdin: { contents: "export { PluginRuntime } from './plugins/runtime'", resolveDir: process.cwd() + '/src', loader: 'ts' }, bundle: true, platform: 'node', format: 'esm', write: false })
const { PluginRuntime } = await import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString('base64')}`)
globalThis.localStorage = { setItem() {} }
const pkg = id => ({ manifest: { id }, main: id })
test('preferences support owned categories, built-in categories, duplicate checks and owner isolation', async () => {
 const hosts = {}
 const runtime = new PluginRuntime(async id => ({ activate(host) { hosts[id] = host } }))
 runtime.bind({ notify() {} })
 await runtime.enable(pkg('first')); await runtime.enable(pkg('second'))
 const a = hosts.first.ui, b = hosts.second.ui
 const removeCategory = a.registerSettingsCategory({ id: 'general', title: 'General', order: 10 })
 a.registerSetting({ id: 'enabled', title: 'Enabled', category: 'general', mount() {} })
 b.registerSetting({ id: 'enabled', title: 'Enabled', category: 'editor', mount() {} })
 assert.deepEqual(runtime.state.settings.map(item => item.category), ['first:general', 'editor'])
 assert.throws(() => b.registerSetting({ id: 'other', title: 'Other', category: 'first:general', mount() {} }))
 assert.throws(() => a.registerSettingsCategory({ id: 'general', title: 'Duplicate' }))
 assert.throws(() => a.registerSetting({ id: 'enabled', title: 'Duplicate', category: 'general', mount() {} }))
 assert.throws(() => a.registerSettingsCategory({ id: 'bad', title: '', order: NaN }))
 removeCategory(); removeCategory()
 assert.equal(runtime.state.settingsCategories.length, 0)
 assert.equal(runtime.state.settings.length, 1)
 await runtime.disable('second')
 assert.equal(runtime.state.settings.length, 0)
 assert.throws(() => b.registerSettingsCategory({ id: 'late', title: 'Late' }))
 await runtime.dispose()
})
test('failed activation removes partial preference registrations', async () => {
 const runtime = new PluginRuntime(async () => ({ activate(host) {
  host.ui.registerSettingsCategory({ id: 'general', title: 'General' })
  host.ui.registerSetting({ id: 'enabled', title: 'Enabled', category: 'general', mount() {} })
  throw new Error('failed')
 } }))
 runtime.bind({ notify() {} })
 await assert.rejects(runtime.enable(pkg('failed')))
 assert.equal(runtime.state.settingsCategories.length, 0)
 assert.equal(runtime.state.settings.length, 0)
})

test('typed preference controls register without mount and preserve callbacks', async () => {
 let api, value = false
 const runtime = new PluginRuntime(async () => ({ activate(host) { api = host.ui } }))
 runtime.bind({ notify() {} }); await runtime.enable(pkg('typed'))
 api.registerSetting({ id: 'toggle', category: 'editor', title: 'Toggle', type: 'toggle', getValue: () => value, onChange: next => { value = next } })
 api.registerSetting({ id: 'select', category: 'editor', title: 'Select', type: 'select', options: [{ label: 'One', value: 1 }], getValue: () => 1, onChange() {} })
 api.registerSetting({ id: 'button', category: 'editor', title: 'Button', type: 'button', buttonText: 'Run', onClick() {} })
 assert.equal(runtime.state.settings.length, 3)
 await runtime.state.settings[0].onChange(true)
 assert.equal(value, true)
 assert.throws(() => api.registerSetting({ id: 'bad', category: 'editor', title: 'Bad', type: 'select', options: [], getValue: () => '', onChange() {} }))
 assert.throws(() => api.registerSetting({ id: 'bad', category: 'editor', title: 'Bad', type: 'number', min: 10, max: 1, getValue: () => 1, onChange() {} }))
 await runtime.disable('typed'); assert.equal(runtime.state.settings.length, 0)
})
