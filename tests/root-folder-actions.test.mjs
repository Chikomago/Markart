import test from 'node:test'
import assert from 'node:assert/strict'
import {build} from 'esbuild'
import {writeFileSync,unlinkSync} from 'node:fs'
import {ref} from 'vue'
const output=await build({entryPoints:['src/files/useFileTreeActions.ts'],bundle:true,platform:'node',format:'esm',write:false,external:['vue'],plugins:[{name:'native',setup(builder){builder.onResolve({filter:/^@tauri-apps\/api\/(core|webviewWindow)$/},args=>({path:args.path,namespace:'native'}));builder.onLoad({filter:/.*/,namespace:'native'},()=>({contents:'export const invoke=(...args)=>globalThis.__rootNative(...args);export class WebviewWindow{constructor(id,options){globalThis.__rootWindow(options)}}',loader:'js'}))}}]})
const path=new URL('../.root-actions-test.mjs',import.meta.url);writeFileSync(path,output.outputFiles[0].text);const {useFileTreeActions}=await import(path.href);unlinkSync(path)
test('root and nested folder utilities open folders, while files open their document',async()=>{
 const calls=[],windows=[];globalThis.__rootNative=async(...args)=>calls.push(args);globalThis.__rootWindow=options=>windows.push(options)
 const actions=useFileTreeActions({isTauri:true,dirtyIds:ref([]),docs:ref([]),currentWorkspaceRoot:ref('/Notes'),workspaceDirectories:ref(['Sub']),moveWithLinks:async()=>{},applyWorkspaceMove(){},manageItem:async()=>{},notify(){}})
 for(const utility of ['reveal','info']){actions.itemActions.value={path:'',x:0,y:0};await actions.runItemUtility(utility)}
 assert.deepEqual(calls.map(call=>call[1]),[{workspaceRoot:'/Notes',relativePath:''},{workspaceRoot:'/Notes',relativePath:''}])
 for(const path of ['','Sub','Sub/a.md']){actions.itemActions.value={path,x:0,y:0};await actions.runItemUtility('window')}
 const created=calls.filter(call=>call[0]==='create_workspace_window').map(call=>call[1])
 assert.deepEqual(created,[{root:'/Notes',path:null},{root:'/Notes/Sub',path:null},{root:'/Notes',path:'Sub/a.md'}])
})
