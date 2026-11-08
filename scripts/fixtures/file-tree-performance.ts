import {createApp,h,nextTick,watch} from 'vue'
import WorkspaceView from '../src/WorkspaceView.vue'
import {useWorkspaceController} from '../src/workspace/useWorkspaceController'
import {installI18n} from '../src/i18n'
const fileCount=Number((window as any).__fileCount||10000)
const files=Array.from({length:fileCount},(_,n)=>({relativePath:`group${n%10}/note${String(n).padStart(5,'0')}.md`,updated:1,utf8:true,openable:true,excerpt:''}))
let root='';const info=()=>({name:'Perf',root:'/Perf',directories:Array.from({length:10},(_,n)=>`group${n}`),files})
localStorage.clear()
;(window as any).__TAURI_EVENT_PLUGIN_INTERNALS__={unregisterListener(){},registerListener(){}}
;(window as any).__TAURI_INTERNALS__={metadata:{currentWindow:{label:'main'},currentWebview:{label:'main'}},transformCallback:()=>1,invoke:async(command:string,args:any={})=>{
 if(command==='take_system_files'||command==='list_recent_workspaces')return []
 if(command==='activate_workspace'){root=args.path;return info()}
 if(command==='refresh_workspace')return info()
 if(command==='read_document')return {content:'# Performance test\nA short file.',version:'a'.repeat(64),encoding:'UTF-8'}
 if(command==='inspect_document')return {changed:false,missing:false,content:null}
 if(command==='load_draft')return null
 if(command==='github_has_token'||command==='webdav_has_password'||command==='plugin:window|is_fullscreen')return false
 if(command==='plugin:event|listen')return 1
 if(command==='plugin_list_installed'||command.includes('list_')||command==='check_local_resources')return []
 return null
}}
let context:any
const app=createApp({setup(){context=useWorkspaceController();return()=>h(WorkspaceView,{context})}})
app.config.errorHandler=error=>{document.querySelector('#result')!.textContent='FAIL '+String(error)}
installI18n(app);app.mount('#app')
function assert(value:unknown,message:string){if(!value)throw Error(message)}
async function waitFor(probe:()=>boolean,message:string){const until=Date.now()+8000;while(Date.now()<until){await new Promise(resolve=>setTimeout(resolve,30));if(probe())return}throw Error(message+' '+document.querySelector('.toast')?.textContent)}

const sleep=(ms:number)=>new Promise(resolve=>setTimeout(resolve,ms))
const metrics:any={}
async function selectByClick(button:HTMLButtonElement,path:string){
 if(context.activeDoc.value.relativePath===path){button.click();return}
 let stop=()=>{}
 const selected=new Promise<void>(resolve=>{stop=watch(()=>context.activeDoc.value.relativePath,value=>{if(value===path){stop();resolve()}},{flush:'post'})})
 button.click();await selected
}
async function measure(name:string,action:()=>unknown|Promise<unknown>){
 ;(window as any).__perfStage=name;await sleep(400)
 const start=performance.now();await action();await nextTick();document.body.getBoundingClientRect()
 const elapsed=performance.now()-start
 metrics[name]={elapsedMs:Math.round(elapsed),renderedFiles:document.querySelectorAll('.tree-file').length,domNodes:document.querySelectorAll('*').length}
 await sleep(1300)
}
;(async()=>{try{
 await sleep(1000);(window as any).__perfStage='baseline';await sleep(1300)
 const c=context.workspaceUiContext
 await measure(`open${fileCount}`,()=>c.selectDirectory('/Perf'))
 await measure(`expandAll${fileCount}`,()=>{c.folderExpanded.value=Object.fromEntries(Array.from({length:10},(_,n)=>[`group${n}`,true]))})
 await measure(`openSecondFile${fileCount}`,async()=>{const row=document.querySelectorAll<HTMLButtonElement>('.tree-file .file-row')[fileCount-1];assert(row,'missing final file');await selectByClick(row,files[fileCount-1].relativePath)})
 await measure(`switchExistingTab${fileCount}`,async()=>{await selectByClick(document.querySelector<HTMLButtonElement>('.document-tab>button:first-child')!,files[0].relativePath)})
 await measure('collapseAll',()=>{c.folderExpanded.value={}})
 document.querySelector('#result')!.textContent='PASS '+JSON.stringify(metrics)
}catch(error){document.querySelector('#result')!.textContent='FAIL '+String(error)}})()
