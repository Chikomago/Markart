import {test} from 'node:test'
import assert from 'node:assert/strict'
import {readFile} from 'node:fs/promises'
import vm from 'node:vm'
async function fixture(reply = 'new'){
 const state={snapshot:{id:'doc',root:'/notes',revision:1,content:'old'},edits:[],requests:0,indexReads:[],staleOnce:false}
 const handlers=new Map(); const elements=new Map();const el=id=>{if(!elements.has(id))elements.set(id,{value:'',textContent:'',hidden:false,children:[],classList:{toggle(){}},focus(){this.focused=true},getBoundingClientRect(){return {top:100,height:54}},replaceChildren(){this.children=[]},append(node){this.children.push(node)}});return elements.get(id)}
 const api=async(method,...args)=>{
  if(method==='files.readText')return 'reference content'
  if(method==='files.view')return{root:'/notes'}
  if(method==='files.list')return[{root:'/notes',id:'a',path:'a.md',version:1}]
  if(method==='index.files')return {cursor:'c',files:[{id:'a',path:'a.md',version:42,text:true}],next:null}
  if(method==='index.content'){state.indexReads.push(args[0].version);if(state.staleOnce){state.staleOnce=false;throw new Error('stale-index-version')}return'needle'}
  if(method==='secrets.get')return 'test'
  if(method==='storage.get')return args[0]==='config'?{apiKey:'test'}:null
  if(method==='editor.getSnapshot')return{...state.snapshot}
  if(method==='editor.getSelection')return{text:''}
  if(method==='editor.applyEdits'){state.edits.push(args[0]);return{}}
  if(method==='network.request'){state.requests++;return{status:200,body:JSON.stringify({choices:[{message:{content:Array.isArray(reply)?reply[state.requests-1]:reply}}]})}}
 }
 const context=vm.createContext({TextEncoder,innerHeight:156,parent:{postMessage(){}},setTimeout(){},MutationObserver:class{observe(){}},requestAnimationFrame(){},window:{addEventListener(name,handler){handlers.set(name,handler)},markart:{request:api}},document:{body:{classList:{toggle(){}}},getElementById:el,querySelector:el,querySelectorAll:()=>[],createElement:()=>({})}})
 vm.runInContext(await readFile('examples/plugins/ai-agent/views/app.js','utf8'),context)
 return {state,el,handlers,run:code=>vm.runInContext(code,context)}
}
test('webview rewrite previews and applies a revision-checked edit',async()=>{
 const f=await fixture();f.el('prompt').value='简洁';await f.run("mode='rewrite';run()");assert.equal(f.state.edits.length,0);await f.el('apply').onclick();assert.equal(f.state.edits[0].expectedRevision,1);assert.equal(f.state.edits[0].edits[0].text,'new')
})
test('webview rejects stale rewrite',async()=>{
 const f=await fixture();f.el('prompt').value='简洁';await f.run("mode='rewrite';run()");f.state.snapshot.revision++;await f.el('apply').onclick();assert.equal(f.state.edits.length,0);assert.match(f.el('status').textContent,/已变化/)
})
test('webview searches indexed content without calling model',async()=>{
 const f=await fixture();f.el('prompt').value='needle';await f.run("mode='find';run()");assert.equal(f.el('results').children[0].textContent,'a.md');assert.equal(f.state.requests,0)
})

test('natural language routes to indexed file lookup',async()=>{
 const f=await fixture(JSON.stringify({action:'search',query:'needle'}));f.el('prompt').value='帮我找相关文件';await f.run('run()');assert.equal(f.el('results').children[0].textContent,'a.md');assert.equal(f.state.requests,1);assert.equal(f.state.edits.length,0)
})
test('natural language rewrite still waits for explicit apply',async()=>{
 const f=await fixture(JSON.stringify({action:'rewrite',content:'rewritten'}));f.el('prompt').value='改写当前文件';await f.run('run()');assert.equal(f.state.edits.length,0);assert.equal(f.el('apply').hidden,false);await f.el('apply').onclick();assert.equal(f.state.edits[0].edits[0].text,'rewritten')
})

test('search uses index versions and retries a concurrent update',async()=>{
 const f=await fixture();f.state.staleOnce=true;f.el('prompt').value='needle';await f.run("mode='find';run()");assert.deepEqual(f.state.indexReads,[42,42]);assert.equal(f.el('results').children[0].textContent,'a.md')
})

test('submitted instruction remains in preview and clears composer',async()=>{
 const f=await fixture();f.el('prompt').value='帮我解释这份文件';await f.run('run()');assert.equal(f.el('prompt').value,'');assert.equal(f.el('instruction').textContent,'帮我解释这份文件')
})

test('copy shows a check mark after clipboard write',async()=>{
 const f=await fixture();f.el('prompt').value='问题';await f.run('run()');await f.el('copy').onclick();assert.equal(f.el('copy').textContent,'✓ 已复制')
})

test('first Escape clears preview; collapsed preview leaves Escape unhandled',async()=>{
 const f=await fixture();f.el('prompt').value='问题';await f.run('run()');let prevented=false
 f.handlers.get('markart-escape')({preventDefault(){prevented=true}})
 assert.equal(prevented,true);assert.equal(f.el('panel').hidden,true);assert.equal(f.el('reply').textContent,'');assert.equal(f.el('instruction').textContent,'')
 prevented=false;f.handlers.get('markart-escape')({preventDefault(){prevented=true}});assert.equal(prevented,false)
})

test('webview focus request focuses composer',async()=>{
 const f=await fixture();f.el('prompt').focused=false;f.handlers.get('markart-focus')();assert.equal(f.el('prompt').focused,true)
})

test('image payload adapts to provider protocols',async()=>{
 const f=await fixture()
 const openai=f.run("imageMessage('openai','question',[{data:'data:image/jpeg;base64,YWJj'}])")
 assert.equal(openai.content[1].type,'image_url');assert.equal(openai.content[1].image_url.url,'data:image/jpeg;base64,YWJj')
 const claude=f.run("imageMessage('claude','question',[{data:'data:image/jpeg;base64,YWJj'}])")
 assert.equal(claude.content[1].source.media_type,'image/jpeg');assert.equal(claude.content[1].source.data,'YWJj')
 const ollama=f.run("imageMessage('ollama','question',[{data:'data:image/jpeg;base64,YWJj'}])")
 assert.equal(ollama.images[0],'YWJj')
})

test('read intent fetches full source text before answering and lists sources',async()=>{
 const f=await fixture([JSON.stringify({action:'read',paths:['a.md']}),'根据文件的回答 [1]']);f.el('prompt').value='总结 a.md';await f.run('run()');assert.equal(f.state.requests,2);assert.equal(f.el('reply').textContent,'根据文件的回答 [1]');assert.equal(f.el('results').children[0].textContent,'a.md');assert.equal(f.state.edits.length,0)
})
test('paste routes image files to attachments and leaves text paste alone',async()=>{
 const f=await fixture();f.run('var pasted=[];addImages=async files=>{pasted=files}')
 let prevented=false;const file={type:'image/png',name:'clipboard.png'}
 f.handlers.get('paste')({clipboardData:{items:[{kind:'file',type:'image/png',getAsFile:()=>file}]},preventDefault(){prevented=true}})
 assert.equal(prevented,true);assert.equal(f.run('pasted.length'),1)
 prevented=false;f.handlers.get('paste')({clipboardData:{items:[{kind:'string',type:'text/plain'}]},preventDefault(){prevented=true}});assert.equal(prevented,false)
})
