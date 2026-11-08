import test from 'node:test'
import assert from 'node:assert/strict'
import { build } from 'esbuild'
const bundle = await build({stdin:{contents:`export * from './src/editor/linkCompletion'; export {EditorState} from '@codemirror/state'; export {CompletionContext} from '@codemirror/autocomplete';`,resolveDir:process.cwd(),loader:'ts'}, bundle:true,platform:'node',format:'esm',write:false})
const {createLinkCompletionSource, EditorState, CompletionContext} = await import(`data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString('base64')}`)
function context(query) {const doc=`[${query}]()`;return new CompletionContext(EditorState.create({doc,selection:{anchor:query.length+1}}),query.length+1,false)}
const defaults={enabled:()=>true,source:()=> 'notes/current.md',root:()=>'/workspace',entries:()=>{throw new Error('frontend file list must not be used for an indexed request')}}
function deferred(){let resolve;const promise=new Promise(done=>{resolve=done});return{promise,resolve}}

test('completion sends normalized scope to the index and uses only returned paths',async()=>{
 const calls=[]
 const complete=createLinkCompletionSource({...defaults,queryEntries:async(...args)=>{calls.push(args);return[{path:'assets',directory:true}]}})
 const result=await complete(context('..'))
 assert.deepEqual(calls,[[{query:'',folder:''},'notes/current.md','/workspace']])
 assert.deepEqual(result.options.map(item=>item.label),['assets/'])
})
test('https intent completes locally without asking SQLite',async()=>{
 const complete=createLinkCompletionSource({...defaults,queryEntries:async()=>{throw new Error('must not query for URL schemes')}})
 assert.equal((await complete(context('ht'))).options[0].label,'https://')
 assert.equal((await complete(context('https://example.com'))).options[0].label,'https://example.com')
})
test('out of order responses cannot replace the latest completion list',async()=>{
 const a=deferred(),b=deferred()
 const complete=createLinkCompletionSource({...defaults,queryEntries:request=>request.query==='a'?a.promise:b.promise})
 const first=complete(context('a')),last=complete(context('b'))
 b.resolve([{path:'notes/b.md'}])
 assert.equal((await last).options[0].label,'b.md')
 a.resolve([{path:'notes/a.md'}])
 assert.equal(await first,null)
})
test('workspace and document changes invalidate pending results',async()=>{
 for(const field of ['root','source']){
  const pending=deferred();let value=field==='root'?'/workspace':'notes/current.md'
  const complete=createLinkCompletionSource({...defaults,[field]:()=>value,queryEntries:()=>pending.promise})
  const result=complete(context('a'));value='changed';pending.resolve([{path:'notes/a.md'}])
  assert.equal(await result,null)
 }
})
test('aborted completion does not publish results and requests abort on edits',async()=>{
 const pending=deferred(),real=context('a');let aborted=false,options
 const ctx={state:real.state,pos:real.pos,explicit:false,get aborted(){return aborted},addEventListener(type,listener,config){options=config}}
 const complete=createLinkCompletionSource({...defaults,queryEntries:()=>pending.promise})
 const result=complete(ctx);aborted=true;pending.resolve([{path:'notes/a.md'}])
 assert.equal(await result,null)
 assert.deepEqual(options,{onDocChange:true})
})
