import {createApp,h,nextTick} from 'vue'
import WorkspaceView from '../src/WorkspaceView.vue'
import {useWorkspaceController} from '../src/workspace/useWorkspaceController'
import {pluginSidebar} from '../src/plugins/sidebarState'
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
let copiedPath=''
Object.defineProperty(navigator,'clipboard',{value:{writeText:async(value:string)=>{copiedPath=value}},configurable:true})
let context:any
const app=createApp({setup(){context=useWorkspaceController();return()=>h(WorkspaceView,{context})}})
app.config.errorHandler=error=>{document.querySelector('#result')!.textContent='FAIL '+String(error)}
installI18n(app);app.mount('#app')
function assert(value:unknown,message:string){if(!value)throw Error(message)}
async function waitFor(probe:()=>boolean,message:string){const until=Date.now()+8000;while(Date.now()<until){await new Promise(resolve=>setTimeout(resolve,30));if(probe())return}throw Error(message+' '+document.querySelector('.toast')?.textContent)}
;(async()=>{try{
 await waitFor(()=>context.currentWorkspaceRoot.value==='/B'&&context.workspaceUiContext.tabDocs.value.length===2,'startup files missing')
 const c=context.workspaceUiContext,tick=async()=>{await nextTick();await new Promise(resolve=>setTimeout(resolve,200))}
 const status=document.querySelector('.statusbar')!.textContent||'';assert(!/Markdown|unknown|纯文本/.test(status),'file type remains in status bar')
 c.githubHasToken.value=true;c.githubBoundUrl.value='';await tick()
 assert(document.querySelector('.root-sync-icon g'),'unbound repository icon missing')
 c.githubBoundUrl.value='https://github.com/test/repo.git';await tick()
 assert(document.querySelector('.root-sync-icon svg>path')?.getAttribute('d')?.startsWith('M811.4 418.7'),'bound cloud icon missing')
 const tab=document.querySelector<HTMLElement>('.document-tab.active')!,before=tab.getBoundingClientRect()
 tab.querySelector<HTMLButtonElement>('.tab-label')!.click();await tick()
 assert(Math.abs(before.top-tab.getBoundingClientRect().top)<.5,'active tab moves vertically')
 assert(getComputedStyle(tab).transform==='none','active tab has transform')
 assert(tab.querySelector('.tab-label svg'),'tab file icon missing')
 assert(tab.querySelector('.tab-close svg')!.getBoundingClientRect().width<=11.5,'close icon was not reduced')
 const other=c.tabDocs.value.find((doc:any)=>doc.workspaceRoot==='/A')
 tab.dispatchEvent(new MouseEvent('contextmenu',{bubbles:true,clientX:300,clientY:50}));await tick()
 assert(document.querySelector('.tab-context-menu')?.textContent?.includes('复制路径'),'copy path menu missing')
 assert(document.querySelector('.tab-context-menu')?.textContent?.includes(context.workspaceUiContext.isMac?'在 Finder 中显示':'在资源管理器中显示'),'platform reveal menu missing')
 await c.runTabFileAction('copy',other.id);assert(copiedPath==='/A/note.md','copied path uses current directory instead of target tab')
 await c.runTabFileAction('reveal',other.id)
 const reveal=calls.find(call=>call.command==='reveal_workspace_item');assert(reveal?.args.workspaceRoot==='/A'&&reveal.args.relativePath==='note.md','reveal does not use the tab directory')
 assert(context.currentWorkspaceRoot.value==='/B','tab utility switches current workspace')
 context.mode.value='split';await tick()
 const body=document.querySelector<HTMLElement>('.editing-body')!
 context.previewWidthCustomized.value=true;context.previewWidth.value=body.clientWidth*.6;await tick()
 const ratio=()=>document.querySelector<HTMLElement>('.preview-pane')!.getBoundingClientRect().width/body.getBoundingClientRect().width
 const original=ratio();assert(Math.abs(original-.6)<.02,'custom split ratio not applied '+original)
 pluginSidebar.setOpen(true);await tick();assert(Math.abs(ratio()-original)<.02,'opening plugin sidebar changes split ratio '+ratio())
 pluginSidebar.setWidth(340);await tick();assert(Math.abs(ratio()-original)<.02,'resizing plugin sidebar changes split ratio '+ratio())
 pluginSidebar.setOpen(false);await tick();assert(Math.abs(ratio()-original)<.02,'closing plugin sidebar changes split ratio '+ratio())
 c.newTemporaryDoc();await tick();assert(!c.tabFilePath(context.activeId.value),'unsaved temporary file exposes a disk path')
 document.querySelector('#result')!.textContent='PASS repository cloud states, tab appearance, root-qualified reveal/copy, temporary tab guards, hidden file types and proportional split resizing'
}catch(error){document.querySelector('#result')!.textContent='FAIL '+String(error)}})()
