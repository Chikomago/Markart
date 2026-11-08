import {createApp,h,nextTick} from 'vue'
import WorkspaceView from '../src/WorkspaceView.vue'
import {useWorkspaceController} from '../src/workspace/useWorkspaceController'
import {installI18n} from '../src/i18n'
const roots: Record<string,Record<string,string>>={'/A':{'note.md':'# A file'},'/B':{'note.md':'# B file'},'/C':{}}
let root='',pending=['/A/note.md','/B/note.md'];const calls: {command:string;args:any}[]=[]
const info=(path:string)=>({name:path.slice(1),root:path,directories:[],files:Object.entries(roots[path]).map(([relativePath,content])=>({relativePath,updated:1,utf8:true,openable:true,excerpt:content}))})
localStorage.clear()
;(window as any).__TAURI_EVENT_PLUGIN_INTERNALS__={unregisterListener(){},registerListener(){}}
;(window as any).__TAURI_INTERNALS__={metadata:{currentWindow:{label:'main'},currentWebview:{label:'main'}},transformCallback:()=>1,invoke:async(command:string,args:any={})=>{
 calls.push({command,args})
 if(command==='take_system_files'){const paths=pending;pending=[];return paths}
 if(command==='list_recent_workspaces')return root?Object.keys(roots):[]
 if(command==='open_document_path'){root=args.path.slice(0,args.path.lastIndexOf('/'));return {workspace:info(root),relativePath:args.path.split('/').pop()}}
 if(command==='activate_workspace'){root=args.path;return info(root)}
 if(command==='workspace_relative_target')return args.path.startsWith(root+'/')?args.path.slice(root.length+1):null
 if(command==='refresh_workspace')return info(root)
 if(command==='read_document')return {content:roots[args.workspaceRoot||root][args.relativePath],version:'a'.repeat(64),encoding:'UTF-8'}
 if(command==='inspect_document')return {changed:false,missing:false,content:null}
 if(command==='load_draft')return null
 if(command==='save_document_as'){root='/C';roots[root]['saved.md']=args.content;return {workspace:info(root),relativePath:'saved.md'}}
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
;(async()=>{try{
 await waitFor(()=>context.currentWorkspaceRoot.value==='/B'&&context.workspaceUiContext.tabDocs.value.length===2,'OS-opened files did not become two tabs')
 const c=context.workspaceUiContext;assert(!document.querySelector('.mode-menu-trigger'),'View switch still in topbar');assert(document.querySelector('.status-view-mode'),'Status view switch missing')
 document.querySelector<HTMLButtonElement>('.document-tab>button')!.click()
 await waitFor(()=>context.currentWorkspaceRoot.value==='/A'&&context.activeDoc.value.absolutePath==='/A/note.md','First directory did not restore')
 assert(document.querySelector('.file-tree-directory')?.textContent?.includes('A'),'File tree did not follow the tab')
 context.content.value='# Unsaved A';await nextTick()
 document.querySelectorAll<HTMLButtonElement>('.document-tab>button:first-child')[1].click()
 await waitFor(()=>context.currentWorkspaceRoot.value==='/B','Second directory did not restore')
 assert(calls.some(call=>call.command==='write_draft'&&call.args.workspaceRoot==='/A'),'Source draft was not saved with its root')
 document.querySelector<HTMLButtonElement>('.tab-new')!.click();await nextTick()
 const temporaryId=context.activeId.value;context.content.value='# Saved C';await nextTick();window.dispatchEvent(new KeyboardEvent('keydown',{key:'s',code:'KeyS',metaKey:true,bubbles:true}));await waitFor(()=>context.currentWorkspaceRoot.value==='/C'&&context.activeDoc.value.absolutePath==='/C/saved.md','Temporary save did not complete');await nextTick()
 assert(context.currentWorkspaceRoot.value==='/C','Saved temporary tab did not follow destination')
 assert(context.activeId.value===temporaryId,'Saving replaced the tab identity')
 assert(c.tabDocs.value.length===3,'Saving dropped previous tabs')
 const original=context.docs.value.find((doc:any)=>doc.absolutePath==='/A/note.md');assert(original.content==='# Unsaved A'&&context.dirtyIds.value.includes(original.id),'Saving discarded the other dirty file')
 document.querySelector<HTMLButtonElement>('.document-tab>button')!.click();await waitFor(()=>context.currentWorkspaceRoot.value==='/A','Dirty tab could not reopen');assert(context.content.value==='# Unsaved A','Dirty text was lost')
 const plus=document.querySelector<HTMLElement>('.tab-new')!.getBoundingClientRect(),close=document.querySelector<HTMLElement>('.document-tab.active .tab-close')!.getBoundingClientRect();assert(Math.abs((plus.top+plus.bottom)/2-(close.top+close.bottom)/2)<1,'Tab controls do not align '+JSON.stringify({plus:plus.toJSON(),close:close.toJSON(),group:document.querySelector('.document-tabs-group')!.getBoundingClientRect().toJSON(),tabs:document.querySelector('.document-tabs')!.getBoundingClientRect().toJSON()}))
 document.querySelector('#result')!.textContent='PASS external files in separate tabs, directory switching, scoped drafts, temporary save, dirty buffer preservation, status view menu and aligned tab controls'
}catch(error){document.querySelector('#result')!.textContent='FAIL '+String(error)}})()
