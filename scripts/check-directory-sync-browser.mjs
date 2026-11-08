import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs'
import { dirname } from 'node:path'
import { execFileSync } from 'node:child_process'
import { build } from 'esbuild'
import { parse, compileScript, compileTemplate } from '@vue/compiler-sfc'
const dir = mkdtempSync('/tmp/markart-sync-reveal-')
const test = `
import {createApp,h,nextTick,ref} from 'vue';import SidebarPane from './SidebarPane.vue';import {installI18n,setLanguage} from './i18n'
const open=ref(false),root=ref('/Notes'),filter=ref(false),sort=ref(false);let selected='',drags=0
const docs=Array.from({length:40},(_,i)=>({id:String(i),relativePath:'file-'+i+'.md',path:'Notes/file-'+i+'.md',updated:1}))
docs[0].path='Notes/'+ 'long-file-name-'.repeat(20)+'.md'
const context={selectedFolder:ref(''),sidebar:ref(true),showRecentFiles:ref(false),sidebarLayout:ref('stack'),sidebarPanel:ref('files'),outlineOpen:ref(true),outline:ref([]),outlineAllCollapsed:ref(false),toggleAllOutlineSections(){},isTauri:true,isMac:true,currentWorkspaceRoot:root,currentDirectory:ref('Notes'),sidebarDisplayWidth:ref(260),directorySyncAvailable:ref(true),showDirectorySync:open,githubHasToken:ref(true),githubBoundUrl:ref('https://github.com/author/notes.git'),githubRepoBusy:ref(false),githubUnbindPendingRoot:ref(''),webdavHasPassword:ref(true),webdavBoundUrl:ref('https://example.test/notes'),webdavBindingBusy:ref(false),webdavUnbindPendingRoot:ref(''),unbindGithubRepo(){},unbindWebdavFolder(){},sideView:ref('tree'),showFileFilter:filter,showSortMenu:sort,showNewMenu:ref(false),filterActive:ref(false),utf8Only:ref(true),excludeExtensionless:ref(false),excludeHidden:ref(false),hideEmptyFolders:ref(false),fileExtensions:ref(''),includeExtensionless:ref(false),commonFileExtensions:['md','txt'],selectedFileExtensions:ref([]),toggleFileExtension(){},selectedSort:{label:'名称',icon:'span'},sortMode:ref('name'),sortOptions:[{label:'名称',value:'name',icon:'span'}],showSearch:ref(false),search:ref(''),toggleWorkspaceSearch(){},docs:ref(docs),treeRows:ref([{kind:'folder',path:'Projects',depth:0},...docs.map(doc=>({kind:'file',path:doc.relativePath,doc,depth:0}))]),filteredDocs:ref(docs),activeId:ref('0'),inlineRename:ref(null),dirtyIds:ref([]),itemActions:ref(null),fileDropTarget:ref(''),folderExpanded:ref({}),suppressFileClick:ref(false),selectDoc:id=>{selected=id},startFileDrag:()=>{drags++},showItemActions(path,event){context.itemActions.value={path,x:event.clientX||12,y:event.clientY||100}}}
setLanguage('zh-CN');const app=createApp({render:()=>h('div',{class:'app-shell',style:{width:'1000px',height:'700px',display:'flex',flexDirection:'row'}},[h(SidebarPane,{context}),h('main',{style:{flex:1,background:'white'}})])});installI18n(app);app.mount('#app')
const tick=async()=>{await nextTick();await new Promise(resolve=>setTimeout(resolve,30))}
function assert(value,message){if(!value)throw Error(message)}
async function until(probe,message){const stop=Date.now()+6000;while(Date.now()<stop){await tick();if(probe())return}throw Error(message)}
function wheel(target,deltaY){const event=new WheelEvent('wheel',{bubbles:true,cancelable:true,deltaY});target.dispatchEvent(event);return event}
function pointer(target,type,y){target.dispatchEvent(new PointerEvent(type,{bubbles:true,cancelable:true,pointerId:1,button:0,clientX:80,clientY:y}))}
;(async()=>{try{
  await tick()
  const area=document.querySelector('.file-area'),directory=document.querySelector('.file-tree-directory'),cloudInitial=document.querySelector('.directory-sync-trigger');let cloud=cloudInitial
  assert(directory.classList.contains('selected')&&directory.getAttribute('aria-current')==='location','Root selection is not identified')
  const folder=document.querySelector('.tree-folder:not(.file-tree-root) .folder-row');folder.click();await tick();assert(folder.classList.contains('selected')&&folder.getAttribute('aria-current')==='location'&&!directory.classList.contains('selected'),'Selected folder indication did not move')
  directory.click();directory.click();await tick();assert(directory.classList.contains('selected')&&!folder.classList.contains('selected'),'Root selection did not reset')
  const fileIcon=document.querySelector('.file-row>svg');assert(Math.abs(fileIcon.getBoundingClientRect().width-15)<.5,'File icon shrinks next to a long filename')
  const heading=document.querySelector('.file-tree-tools'),headingTop=heading.getBoundingClientRect().top
  area.scrollTop=200;await tick();assert(area.scrollTop>0,'File tree stopped scrolling');assert(Math.abs(heading.getBoundingClientRect().top-headingTop)<.5,'Workspace header scrolled with files');assert(getComputedStyle(area).scrollbarWidth==='none','File tree scrollbar is visible');area.scrollTop=0;await tick()
  assert(cloud&&cloud.closest('.file-tree-root')===directory.closest('.file-tree-root'),'Cloud is not on the root folder row')
  assert(cloud.getBoundingClientRect().right<directory.getBoundingClientRect().left+60,'Cloud should replace the leading folder icon');assert(!document.querySelector('.root-folder-icon-slot svg'),'Folder icon remains while signed in');document.querySelector('.root-menu-trigger').click();await tick();const rootMenu=document.querySelector('.item-actions-menu');assert(rootMenu,'Root actions menu is missing');const rootLabels=[...rootMenu.querySelectorAll('button')].map(button=>button.textContent);assert(rootMenu.querySelectorAll('button:disabled').length===2,'Root mutation actions should be disabled');context.itemActions.value=null;context.showItemActions('Projects',{clientX:12,clientY:100});await tick();const folderLabels=[...document.querySelector('.item-actions-menu').querySelectorAll('button')].map(button=>button.textContent);assert(JSON.stringify(rootLabels)===JSON.stringify(folderLabels),'Root and folder menus differ');context.itemActions.value=null;await tick();context.directorySyncAvailable.value=false;await tick();assert(!document.querySelector('.root-sync-icon')&&document.querySelector('.root-folder-icon-slot svg'),'Signed-out state does not show the folder icon');assert(document.querySelector('.root-menu-trigger'),'Root actions missing while signed out');context.directorySyncAvailable.value=true;await tick();cloud=document.querySelector('.directory-sync-trigger')
  assert(!document.querySelector('.workspace-sync-handle,.directory-sync-drawer,.directory-sync-popup'),'Old gesture or visible panel remains')
  directory.click();await tick();assert(directory.getAttribute('aria-expanded')==='false'&&!open.value,'Folder collapse opened sync')
  directory.click();cloud.click();await tick()
  const panel=document.querySelector('.directory-sync-popup')
  assert(panel&&!area.contains(panel),'Binding panel missing or clipped by file tree')
  assert(cloud.getAttribute('aria-expanded')==='true'&&directory.getAttribute('aria-expanded')==='true','Cloud click changed folder expansion')
  assert(panel.querySelectorAll('.directory-sync-heading').length===2,'GitHub or WebDAV binding controls missing')
  const bounds=panel.getBoundingClientRect();assert(panel.contains(document.elementFromPoint(bounds.right-8,bounds.top+25)),'Panel is covered outside sidebar')
  document.querySelector('.directory-sync-title').dispatchEvent(new PointerEvent('pointerdown',{bubbles:true}));await tick();assert(open.value,'Click inside panel dismissed it')
  window.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape'}));await tick();assert(!open.value&&!document.querySelector('.directory-sync-popup'),'Escape did not close panel')
  cloud.click();await tick();document.querySelector('main').dispatchEvent(new PointerEvent('pointerdown',{bubbles:true}));await tick();assert(!open.value,'Outside click did not close panel')
  cloud.click();await tick();root.value='/Other';await tick();assert(!open.value,'Folder change did not close panel')
  document.querySelector('.file-filter-trigger').click();await tick();assert(document.querySelector('.file-filter-menu'),'Filter menu regressed');filter.value=false
  document.querySelector('.file-row').click();assert(selected==='0','File selection regressed')
  directory.click();await tick();document.querySelector('.workspace-heading-trigger').click();await tick();assert(!document.querySelector('.workspace-create-menu button').disabled,'Opening menu lost folder selection');document.querySelector('main').dispatchEvent(new PointerEvent('pointerdown',{bubbles:true}));await tick();assert(context.selectedFolder.value===null&&!directory.classList.contains('selected'),'Outside click did not clear folder selection');document.querySelector('.workspace-heading-trigger').click();await tick();assert([...document.querySelectorAll('.workspace-create-menu button')].every(button=>button.disabled),'Creation remains enabled without folder selection')
  document.querySelector('#result').textContent='PASS root folder cloud opens binding panel; independent folder collapse, Escape, outside dismissal, folder reset, filtering and file selection'
}catch(error){document.querySelector('#result').textContent='FAIL '+error.message+' '+error.stack}})()

`
const styles=[]
await build({stdin:{contents:test,resolveDir:process.cwd()+'/src',loader:'ts'},bundle:true,format:'iife',external:['buffer'],define:{'import.meta.env':'{}'},outfile:dir+'/test.js',plugins:[{name:'vue',setup(builder){builder.onLoad({filter:/\.vue$/},args=>{
  const {descriptor}=parse(readFileSync(args.path,'utf8'));styles.push(...descriptor.styles.map(style=>style.content.replace(/:deep\(([^)]+)\)/g,'$1')))
  const script=compileScript(descriptor,{id:args.path,inlineTemplate:!!descriptor.scriptSetup,genDefaultAs:'Component'});let code=script.content
  if(!descriptor.scriptSetup)code+='\n'+compileTemplate({source:descriptor.template.content,id:args.path,filename:args.path}).code.replace('export function render','function render')+'\nComponent.render=render;'
  return {contents:code+'\nexport default Component',loader:'ts',resolveDir:dirname(args.path)}
})}}]})
writeFileSync(dir+'/test.html','<!doctype html><meta charset="utf-8"><style>'+readFileSync('src/style.css','utf8')+readFileSync('src/themes/white/theme.css','utf8')+styles.join('\n')+'#result{display:none}'+'</style><div id="app"></div><pre id="result">WAIT</pre><script>window.onerror=message=>document.querySelector("#result").textContent="FAIL "+message;</script><script>'+readFileSync(dir+'/test.js','utf8').replaceAll('</script>','<\\/script>')+'</script>')
let swift=readFileSync('scripts/fixtures/webkit-runner.swift','utf8').replace('result.hasPrefix("[")','(result.hasPrefix("PASS") || result.hasPrefix("FAIL"))').replace('lastState = String(describing: value ?? error as Any)','lastState = "waiting for pull gestures"').replace(/print\(state\["html"\].*\n/,'print(result)\n')
swift=swift.replace('print(result)\n            exit(0)', `let snapshot=WKSnapshotConfiguration();snapshot.rect=CGRect(x:0,y:0,width:350,height:700)
            web.takeSnapshot(with:snapshot){image,error in
                if let data=image?.tiffRepresentation,let bitmap=NSBitmapImageRep(data:data),let png=bitmap.representation(using:.png,properties:[:]){try? png.write(to:URL(fileURLWithPath:"${dir}/sidebar.png"))}
                print(result);exit(0)
            }`)
writeFileSync(dir+'/runner.swift',swift);execFileSync('swiftc',['-module-cache-path','/tmp/markart-swift-cache',dir+'/runner.swift','-o',dir+'/runner'])
const result=execFileSync(dir+'/runner',[dir+'/test.html'],{encoding:'utf8',timeout:40000});console.log(result.trim());console.log('Screenshot: '+dir+'/sidebar.png');if(!result.startsWith('PASS'))process.exitCode=1
