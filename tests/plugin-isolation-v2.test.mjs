import test from 'node:test'
import assert from 'node:assert/strict'
import {build} from 'esbuild'
import {getQuickJS} from 'quickjs-emscripten'
const result=await build({entryPoints:['src/plugins/runtime/engine.ts'],bundle:true,platform:'node',format:'esm',write:false})
const {PluginEngine}=await import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString('base64')}`)
const module=await getQuickJS()
test('plugin code has no browser, process, filesystem or host globals',()=>{
 const messages=[];const vm=new PluginEngine(module,text=>messages.push(JSON.parse(text)),1000)
 try{vm.load(`export async function activate(api){await api.ui.notify([typeof window,typeof document,typeof fetch,typeof process,typeof require,typeof __TAURI_INTERNALS__].join(','))}`);vm.receive({type:'start',id:1});assert.equal(messages[0].method,'ui.notify');assert.equal(messages[0].args[0],'undefined,undefined,undefined,undefined,undefined,undefined');vm.receive({type:'result',id:messages[0].id,value:null});assert.equal(messages.at(-1).type,'complete')}finally{vm.dispose()}
})
test('infinite loops are interrupted within a bounded execution turn',()=>{
 const vm=new PluginEngine(module,()=>{},30);const before=performance.now()
 try{assert.throws(()=>vm.load('while(true){}'),/超时/);assert.ok(performance.now()-before<1000)}finally{vm.dispose()}
})
test('memory limit prevents unbounded plugin heap growth',()=>{
 const vm=new PluginEngine(module,()=>{},500)
 try{assert.throws(()=>vm.load('const chunks=[]; for(let i=0;i<10000;i++)chunks.push(new Array(100000).fill(i))'))}finally{vm.dispose()}
})
test('plugin callback references survive calls and are cancelled after disposal',()=>{
 const messages=[];const vm=new PluginEngine(module,text=>messages.push(JSON.parse(text)),1000)
 vm.load(`export async function activate(api){await api.commands.register({id:'test',title:'Test',run:()=>42})}`);vm.receive({type:'start',id:1})
 const request=messages[0];assert.ok(request.args[0].run.$callback)
 vm.receive({type:'invoke',id:2,callback:request.args[0].run.$callback,args:[]});assert.equal(messages.at(-1).value,42)
 vm.dispose();assert.throws(()=>vm.receive({type:'invoke'}),/停用/)
})
test('index panel plugins activate inside the isolated engine',async()=>{
 const {readFile}=await import('node:fs/promises')
 for(const name of ['graph','tags','backlinks']){
  const messages=[];const vm=new PluginEngine(module,text=>messages.push(JSON.parse(text)),1000)
  try{
   vm.load(await readFile(`examples/plugins/${name}/main.js`,'utf8'));vm.receive({type:'start',id:1})
   for(let i=0;i<messages.length;i++){
    const message=messages[i]
    if(message.type==='request')vm.receive({type:'result',id:message.id,value:null})
   }
   assert.ok(messages.some(message=>message.method==='ui.sidebar.register'),name)
   assert.ok(messages.some(message=>message.method==='commands.register'),name)
   assert.ok(messages.some(message=>message.type==='complete'),name)
   assert.ok(!messages.some(message=>message.type==='error'),name)
  }finally{vm.dispose()}
 }
})
test('optional index pagination fields stay absent across the plugin boundary',()=>{
 const messages=[];const vm=new PluginEngine(module,text=>messages.push(JSON.parse(text)),1000)
 try{
  vm.load(`export async function activate(api){let cursor,after;await api.index.files({root:'/notes',cursor,after,limit:500})}`)
  vm.receive({type:'start',id:1});const query=messages.find(message=>message.method==='index.files').args[0]
  // The host stringifies present offsets before invoking Rust. An absent offset
  // must not arrive as null and become the literal string "null".
  const native={...query};if(native.after!==undefined)native.after=String(native.after)
  assert.equal(native.after,undefined,'first-page query would produce invalid-index-cursor')
  assert.equal(Object.hasOwn(query,'cursor'),false)
 }finally{vm.dispose()}
})
