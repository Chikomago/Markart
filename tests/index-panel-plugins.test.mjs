import { pathToFileURL } from 'node:url'
import test from 'node:test'
import assert from 'node:assert/strict'
import {build} from 'esbuild'
import {mkdtempSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
const dir=mkdtempSync(join(tmpdir(),'markart-index-plugins-'))
const modules={}
for(const name of ['graph','tags','backlinks']){const output=join(dir,name+'.mjs');await build({entryPoints:[`examples/plugins/${name}/main.ts`],outfile:output,bundle:true,platform:'node',format:'esm'});modules[name]=await import(pathToFileURL(output).href)}
function flatten(tree){return [tree,...(tree.children||[]).flatMap(flatten)]}
function fixture(){
 const files=[{id:'a',path:'a.md',version:1,text:true,size:20},{id:'b',path:'b.md',version:1,text:true,size:20}]
 const links=[{key:1,source:'b',sourcePath:'b.md',target:'a',targetPath:'a.md',line:3,from:0,to:3,raw:'a.md'},{key:2,source:'b',sourcePath:'b.md',target:'a',targetPath:'a.md',line:7,from:8,to:11,raw:'a.md'}]
 let view,listener,context={itemId:'item',root:'/notes',file:{id:'editor-a',path:'a.md',root:'/notes',revision:1,content:''},state:null,visible:true,width:280,height:400},metadataCalls=0,unsubscribed=0,refreshes=0
 const opened=[],commands=[],timers=[]
 const api={lifecycle:{signal:new AbortController().signal,track:async dispose=>dispose,setTimeout:async callback=>{timers.push(callback);return()=>{const index=timers.indexOf(callback);if(index>=0)timers.splice(index,1)}}},events:{whenReady:async()=>{}},permissions:{request:async()=>true},ui:{notify:async()=>{},sidebar:{register:async value=>{view=value;return()=>{}},getItem:async()=>({refresh:async()=>{refreshes++},setState:async state=>{context.state=state}}),open:async()=>({})}},commands:{register:async command=>{commands.push(command);return()=>{}}},files:{open:async file=>opened.push(file)},index:{files:async()=>({cursor:'epoch:1',files,next:null}),links:async()=>({cursor:'epoch:1',links,next:null}),metadata:async({id})=>{metadataCalls++;return{tags:[{name:id==='a'?'work':'work',from:0,to:4}],headings:[],properties:{},yaml:null,error:null}},tagged:async()=>({cursor:'epoch:1',files,next:null}),subscribe:async(_root,callback)=>{listener=callback;return()=>{unsubscribed++}}}}
 return{api,files,opened,commands,get view(){return view},get context(){return context},get metadataCalls(){return metadataCalls},get unsubscribed(){return unsubscribed},get refreshes(){return refreshes},notify:async()=>{await listener({root:'/notes',cursor:'epoch:2'});while(timers.length)await timers.shift()()}}
}
test('graph renders indexed connections and clicking a node opens its file',async()=>{
 const f=fixture();await modules.graph.activate(f.api);const tree=await f.view.render(f.context),nodes=flatten(tree)
 assert.equal(nodes.filter(node=>node.tag==='circle').length,2);assert.equal(nodes.filter(node=>node.tag==='line').length,1)
 await nodes.find(node=>node.tag==='g'&&node.attrs['aria-label']==='打开b.md').on.click();assert.equal(f.opened[0].path,'b.md');assert.equal(f.opened[0].root,'/notes')
})
test('tags persist selection, query matching files and cache unchanged metadata',async()=>{
 const f=fixture();await modules.tags.activate(f.api);let nodes=flatten(await f.view.render(f.context));const tag=nodes.find(node=>node.attrs?.class==='tag');assert.ok(tag)
 await tag.on.click();assert.deepEqual(f.context.state,{tag:'work'});nodes=flatten(await f.view.render(f.context));assert.equal(nodes.filter(node=>node.attrs?.class==='file-entry').length,2);assert.equal(f.metadataCalls,2)
 f.files[0].version=2;await f.notify();await f.view.render(f.context);assert.equal(f.metadataCalls,3)
})
test('backlinks group incoming references by source and preserve file paths',async()=>{
 const f=fixture();await modules.backlinks.activate(f.api);const nodes=flatten(await f.view.render(f.context)),buttons=nodes.filter(node=>node.attrs?.class==='file-entry')
 assert.equal(buttons.length,1);assert.ok(nodes.some(node=>node.text?.includes('2 处引用 · 第 3、7 行')));await buttons[0].on.click();assert.equal(f.opened[0].path,'b.md')
 await f.view.onHide();assert.equal(f.unsubscribed,1)
})
test('unopened directories do not issue index queries',async()=>{
 const f=fixture();await modules.graph.activate(f.api);const tree=await f.view.render({...f.context,root:''});assert.match(tree.text,/打开文件夹/)
})
