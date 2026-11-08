import { pathToFileURL } from 'node:url'
import test from 'node:test'
import assert from 'node:assert/strict'
import {build} from 'esbuild'
import {mkdtempSync} from 'node:fs'
import {join} from 'node:path'
import {tmpdir} from 'node:os'
const dir=mkdtempSync(join(tmpdir(),'markart-plugin-source-')),output=join(dir,'community.mjs')
await build({entryPoints:['src/plugins/community.ts'],bundle:true,platform:'node',format:'esm',outfile:output})
const {pluginKey,parseCommunityDirectory}=await import(pathToFileURL(output).href)
const runtimeOutput=join(dir,'runtime.mjs')
await build({entryPoints:['src/plugins/runtime.ts'],bundle:true,platform:'node',format:'esm',outfile:runtimeOutput})
const stored=new Map()
globalThis.localStorage={getItem:key=>stored.get(key)||null,setItem:(key,value)=>stored.set(key,value)}
const {PluginRuntime,selectRestorablePlugins}=await import(pathToFileURL(runtimeOutput).href)

test('the same plugin id from two catalogs keeps two separate packages',()=>{
 const manifest={id:'example.notes'}
 const first=pluginKey({manifest,directoryUrl:'https://raw.githubusercontent.com/one/main/plugins.json'})
 const second=pluginKey({manifest,directoryUrl:'https://raw.githubusercontent.com/two/main/plugins.json'})
 assert.notEqual(first,second)
 assert.equal(pluginKey({manifest}),'local::example.notes')
 assert.equal(first,'https://raw.githubusercontent.com/one/main/plugins.json::example.notes')
})
test('a catalog rejects duplicate plugin ids inside itself',()=>{
 const entry={id:'example.notes',name:'Notes',description:'Test',repo:'author/notes'}
 assert.deepEqual(parseCommunityDirectory([entry]).map(item=>item.repo),['author/notes'])
 assert.throws(()=>parseCommunityDirectory([entry,{...entry,repo:'other/notes'}]),/重复插件 ID：example\.notes/)
 assert.equal(parseCommunityDirectory([entry,{...entry,id:'example.tags'}]).length,2)
})
test('catalog entries keep repo and author but never carry a version',()=>{
 const [entry]=parseCommunityDirectory([{id:'example.notes',name:'Notes',description:'Test',repo:'https://github.com/author/notes',author:'Alan'}])
 assert.equal(entry.repo,'author/notes')
 assert.equal(entry.author,'Alan')
 assert.equal('version' in entry,false)
})
test('startup restores the previously enabled source instead of the first matching id',()=>{
 const packages=[{key:'one::example.notes',manifest:{id:'example.notes'}},{key:'two::example.notes',manifest:{id:'example.notes'}}]
 assert.deepEqual(selectRestorablePlugins(packages,['example.notes'],{'example.notes':'two::example.notes'}),[packages[1]])
 assert.deepEqual(selectRestorablePlugins(packages,['example.notes'],{}),[packages[0]],'legacy state without a source still restores')
 assert.deepEqual(selectRestorablePlugins(packages,['example.notes'],{'example.notes':'missing::example.notes'}),[],'never silently switch to another source')
})
test('only one source can own a running plugin id',async()=>{
 const runtime=new PluginRuntime(async()=>({activate(){}}));runtime.bind({notify(){}})
 const first={key:'one::example.notes',manifest:{id:'example.notes',name:'One'},main:'one'}
 const second={key:'two::example.notes',manifest:{id:'example.notes',name:'Two'},main:'two'}
 await runtime.enable(first)
 await assert.rejects(runtime.enable(second),/另一个目录/)
 assert.equal(runtime.state.sources['example.notes'],first.key)
 await runtime.disable('example.notes');await runtime.enable(second)
 assert.equal(runtime.state.sources['example.notes'],second.key)
 await runtime.dispose()
})
