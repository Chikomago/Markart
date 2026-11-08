import test from 'node:test'
import assert from 'node:assert/strict'
import { build } from 'esbuild'
const bundle=await build({stdin:{contents:"export {useFileNavigator} from './src/files/useFileNavigator'; export {ref,computed,createRenderer,nextTick} from 'vue'",resolveDir:process.cwd(),loader:'ts'},bundle:true,platform:'node',format:'esm',write:false,plugins:[{name:'native-search',setup(build){build.onResolve({filter:/^@tauri-apps\/api\/core$/},()=>({path:'native',namespace:'search-test'}));build.onLoad({filter:/.*/,namespace:'search-test'},()=>({contents:'export const invoke=(command,args)=>globalThis.__fileSearchInvoke(command,args)',loader:'js'}))}}]})
const {useFileNavigator,ref,computed,createRenderer,nextTick}=await import(`data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString('base64')}`)
const renderer=createRenderer({createElement:()=>({}),createText:()=>({}),createComment:()=>({}),insert(){},remove(){},setText(){},setElementText(){},parentNode:()=>null,nextSibling:()=>null,patchProp(){}})
function mount(t,invoke){
 globalThis.localStorage={setItem(){}}
 globalThis.__fileSearchInvoke=(command,args)=>command==='search_documents'?invoke(args):Promise.resolve([])
 const docs=ref([{id:'draft',path:'测试/draft.md',relativePath:'draft.md',loaded:true,content:'local unsaved',updated:1},{id:'disk',path:'测试/disk.md',relativePath:'disk.md',loaded:false,content:'',updated:1}]),search=ref(''),root=ref('/test')
 let navigator
 const app=renderer.createApp({setup(){navigator=useFileNavigator({isTauri:true,docs,activeDoc:computed(()=>docs.value[0]),recentFiles:ref([]),pinnedRecentFolders:ref([]),nativeRecentDirs:ref([]),currentWorkspaceRoot:root,currentDirectory:ref('测试'),search,sortMode:ref('nameAsc'),workspaceDirectories:ref([]),folderExpanded:ref({}),dirtyIds:ref(['draft']),showRecentFiles:ref(false),showNewMenu:ref(false),showSortMenu:ref(false),fileHubPosition:ref({left:0,top:0}),flushDrafts:async()=>{},applyWorkspace(){},selectDoc:async()=>{},notify(message){throw new Error(message)}});return()=>null}})
 app.mount({});assert.equal(navigator.utf8Only.value,true);navigator.utf8Only.value=false;t.after(()=>app.unmount())
 return {docs,search,root,navigator,get files(){return navigator.filteredDocs.value.map(doc=>doc.id)}}
}
async function flush(t){await nextTick();t.mock.timers.tick(181);await new Promise(resolve=>setImmediate(resolve));await nextTick()}

test('indexed results respect unsaved buffers and rerun after external file-list updates',async t=>{
 t.mock.timers.enable({apis:['setTimeout']})
 const calls=[]
 const results={keyword:[{relativePath:'draft.md',snippet:'old keyword'},{relativePath:'disk.md',snippet:'disk keyword'}],local:[],second:[]}
 const state=mount(t,async request=>{calls.push(request);return results[request.query]||[]})
 state.search.value='keyword';await flush(t)
 assert.deepEqual(state.files,['disk'])
 assert.equal(calls[0].root,'/test')
 state.search.value='local';await flush(t)
 assert.deepEqual(state.files,['draft'])
 state.search.value='keyword';await flush(t)
 results.keyword.push({relativePath:'new.md',snippet:'keyword second'})
 results.second=[{relativePath:'new.md',snippet:'keyword second'}]
 state.docs.value=[...state.docs.value,{id:'new',path:'测试/new.md',relativePath:'new.md',loaded:false,content:'',updated:2}]
 await flush(t)
 assert.deepEqual(state.files,['disk','new'])
 state.search.value='keyword && second';await flush(t)
 assert.deepEqual(state.files,['new'])
 state.search.value='local || keyword';await flush(t)
 assert.deepEqual(state.files,['disk','draft','new'])
})
test('an outdated indexed response cannot overwrite a newer keyword result',async t=>{
 t.mock.timers.enable({apis:['setTimeout']})
 let finish
 const slow=new Promise(resolve=>{finish=resolve})
 const state=mount(t,request=>request.query==='slow'?slow:Promise.resolve([{relativePath:'disk.md',snippet:'fast'}]))
 state.search.value='slow';await flush(t)
 state.search.value='fast';await flush(t)
 assert.deepEqual(state.files,['disk'])
 finish([{relativePath:'draft.md',snippet:'slow'}]);await new Promise(resolve=>setImmediate(resolve));await nextTick()
 assert.deepEqual(state.files,['disk'])
})

test('UTF-8 filter defaults on, can be disabled to show all files, and combines with extension filters', t => {
 const state=mount(t,async()=>[])
 state.docs.value=[
  {id:'text',path:'测试/notes.md',relativePath:'notes.md',utf8:true,openable:true,content:'',updated:1},
  {id:'binary',path:'测试/image.png',relativePath:'image.png',utf8:false,openable:false,content:'',updated:1},
  {id:'pdf',path:'测试/report.pdf',relativePath:'report.pdf',utf8:false,openable:true,content:'',updated:1},
  {id:'unknown',path:'测试/unknown.txt',relativePath:'unknown.txt',utf8:null,openable:true,content:'',updated:1},
  {id:'empty',path:'测试/empty',relativePath:'empty',utf8:true,openable:true,content:'',updated:1}
 ]
 assert.deepEqual(state.files,['empty','binary','text','pdf','unknown'])
 state.navigator.utf8Only.value=true
 assert.deepEqual(state.files,['empty','text'])
 assert.equal(state.navigator.filterActive.value,true)
 state.navigator.fileExtensions.value='md'
 assert.deepEqual(state.files,['text'])
 state.navigator.utf8Only.value=false
 state.navigator.fileExtensions.value=''
 assert.equal(state.files.length,5)
})
