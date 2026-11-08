import {build} from 'esbuild'
import assert from 'node:assert/strict'
import {webcrypto} from 'node:crypto'
import {mockIPC,clearMocks} from '@tauri-apps/api/mocks'
import {emit} from '@tauri-apps/api/event'
const {outputFiles}=await build({entryPoints:['src/plugins/runtime.ts'],bundle:true,platform:'node',format:'esm',write:false})
const {PluginRuntime}=await import('data:text/javascript;base64,'+Buffer.from(outputFiles[0].text).toString('base64'))
const saved=new Map();globalThis.localStorage={getItem:key=>saved.get(key)||null,setItem:(key,value)=>saved.set(key,value)}
if(!globalThis.crypto)globalThis.crypto=webcrypto
globalThis.window={crypto:webcrypto,addEventListener(){},removeEventListener(){},setTimeout,clearTimeout,setInterval,clearInterval}
const watching=new Map(),stopped=[],errors=[];let failStart=false,delayStart=false,releaseStart,host
mockIPC(async(cmd,args)=>{
 if(cmd==='plugin_data_directory')return '/app/plugin-data/'+args.pluginId
 if(cmd==='plugin_watch_start'){
  if(failStart)throw Error('not a valid path')
  if(delayStart)await new Promise(resolve=>releaseStart=resolve)
  watching.set(args.id,args);return
 }
 if(cmd==='plugin_watch_stop'){stopped.push(args.id);watching.delete(args.id);return}
 throw Error('Unexpected command '+cmd)
},{shouldMockEvents:true})
const pkg={manifest:{apiVersion:1,id:'test.rag',name:'RAG',version:'1.0.0'},main:'',downloadedAt:'',repo:'test/plugin'}
const adapter={active:()=>null,list:()=>[],open:async()=>{},save:async()=>{},selection:()=>({from:0,to:0,text:''}),replace(){},select(){},format(){},undo(){},redo(){},root:()=>'/docs',notify:error=>errors.push(error),prompt:async()=>null}
const runtime=new PluginRuntime(async()=>({activate(api){host=api}}));runtime.bind(adapter);await runtime.enable(pkg)
assert.equal(await host.storage.dataDir(),'/app/plugin-data/test.rag')
let received=[],finishFirst,startedFirst=false
const stop=await host.filesystem.watch('/docs',async events=>{
 received.push(events[0].paths[0]);if(!startedFirst){startedFirst=true;await new Promise(resolve=>finishFirst=resolve)}
},{recursive:true,debounceMs:50})
const id=[...watching.keys()][0];assert.deepEqual(watching.get(id).options,{recursive:true,debounceMs:50})
await emit('markart-plugin-files:'+id,[{kind:'create',paths:['/docs/a.md']}]);await Promise.resolve();await Promise.resolve()
await emit('markart-plugin-files:'+id,[{kind:'modify',paths:['/docs/b.md']}]);await Promise.resolve()
assert.deepEqual(received,['/docs/a.md']);finishFirst();await new Promise(resolve=>setTimeout(resolve,0));assert.deepEqual(received,['/docs/a.md','/docs/b.md'])
await stop();await stop();assert.equal(stopped.filter(value=>value===id).length,1);assert.equal(watching.size,0)
assert.equal(window.__TAURI_INTERNALS__.callbacks.size,0);assert.equal(received.length,2)
failStart=true;await assert.rejects(host.filesystem.watch('/bad',()=>{}),/valid path/);failStart=false
assert.equal(window.__TAURI_INTERNALS__.callbacks.size,0,'failed watch left an event listener')
await host.filesystem.watch('/docs',()=>{});assert.equal(watching.size,1);await runtime.disable('test.rag');assert.equal(watching.size,0);assert.equal(window.__TAURI_INTERNALS__.callbacks.size,0)
await assert.rejects(host.storage.dataDir(),/停用/)
await runtime.enable(pkg);delayStart=true
const pending=host.filesystem.watch('/docs',()=>{});const rejected=assert.rejects(pending,/停用/)
while(!releaseStart)await new Promise(resolve=>setTimeout(resolve,0))
await runtime.disable('test.rag');releaseStart();await rejected;assert.equal(watching.size,0);assert.equal(window.__TAURI_INTERNALS__.callbacks.size,0)
await runtime.dispose();delayStart=false
const failed=new PluginRuntime(async()=>({async activate(api){await api.filesystem.watch('/docs',()=>{});throw Error('activation failed')}}));failed.bind(adapter)
await assert.rejects(failed.enable(pkg),/activation failed/);assert.equal(watching.size,0);assert.equal(window.__TAURI_INTERNALS__.callbacks.size,0);await failed.dispose()
assert.deepEqual(errors,[]);clearMocks()
console.log('PASS plugin data path, serialized watch callbacks, manual stop, failed start cleanup, disable cleanup pending-start cancellation and activation rollback')
