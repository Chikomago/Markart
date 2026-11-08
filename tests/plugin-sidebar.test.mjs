import test from 'node:test'
import assert from 'node:assert/strict'
import { build } from 'esbuild'
const result = await build({ stdin: { contents: "export * from './plugins/sidebarState'; export { PluginRuntime } from './plugins/runtime'", resolveDir: process.cwd() + '/src', loader: 'ts' }, bundle: true, platform: 'node', format: 'esm', write: false })
const { PluginSidebarState, pluginSidebar, PluginRuntime } = await import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString('base64')}`)
function storage() { const values = new Map(); return { getItem: key => values.get(key) ?? null, setItem: (key,value) => values.set(key,value) } }
globalThis.localStorage = storage()
test('sidebar exists independently of registered views; selection and open state persist', () => {
 const disk = storage(), first = new PluginSidebarState(disk)
 assert.equal(first.state.open, false); assert.deepEqual(first.state.selected, [])
 first.setOpen(true); first.add(['one:a','one:b']); first.add(['one:a','two:a'])
 assert.deepEqual(first.state.selected,['one:a','one:b','two:a'])
 first.remove('one:b'); first.setOpen(false)
 const restored = new PluginSidebarState(disk)
 assert.equal(restored.state.open,false); assert.deepEqual(restored.state.selected,['one:a','two:a'])
 restored.toggle(); assert.equal(restored.state.open,true)
})
test('invalid saved state and unavailable storage do not break the workspace', () => {
 const broken = new PluginSidebarState({ getItem(){return '{'},setItem(){throw new Error('blocked')} })
 assert.deepEqual(broken.state.selected,[]); assert.doesNotThrow(()=>broken.toggle())
 const dirty = new PluginSidebarState({getItem(){return JSON.stringify({open:1,selected:['one',null,'one',2]})},setItem(){}})
 assert.equal(dirty.state.open,false); assert.deepEqual(dirty.state.selected,['one'])
})
test('registering a right view does not open or place it; host controls visibility separately', async () => {
 let api
 const runtime = new PluginRuntime(async ()=>({activate(host){api=host;host.ui.registerView({id:'panel',title:'Panel',mount(){}})}}))
 runtime.bind({notify(){}})
 pluginSidebar.setOpen(false)
 const before=[...pluginSidebar.state.selected]
 await runtime.enable({manifest:{id:'example.sidebar',name:'Sidebar'},main:''})
 assert.equal(api.ui.sidebar.isOpen(),false)
 assert.deepEqual(pluginSidebar.state.selected,before)
 assert.equal(runtime.state.views.length,1)
 api.ui.sidebar.open();assert.equal(pluginSidebar.state.open,true)
 api.ui.sidebar.close();assert.equal(pluginSidebar.state.open,false)
 await runtime.disable('example.sidebar')
 assert.equal(runtime.state.views.length,0)
 assert.throws(()=>api.ui.sidebar.open(),/停用/)
})

test('sidebar width persists, clamps bounds, and ignores invalid values', () => {
 const disk=storage(), state=new PluginSidebarState(disk)
 assert.equal(state.state.width,280)
 state.setWidth(376.6)
 assert.equal(new PluginSidebarState(disk).state.width,377)
 state.setWidth(100);assert.equal(state.state.width,220)
 state.setWidth(999);assert.equal(state.state.width,560)
 state.setWidth(NaN);assert.equal(state.state.width,560)
 const invalid=new PluginSidebarState({getItem(){return JSON.stringify({width:'huge'})},setItem(){}})
 assert.equal(invalid.state.width,280)
})
