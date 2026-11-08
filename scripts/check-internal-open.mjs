import {build} from 'esbuild'
import {mkdtempSync,rmSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
const dir=mkdtempSync(join(tmpdir(),'markart-internal-open-'))
try {
const out=join(dir,'test.mjs')
await build({stdin:{resolveDir:process.cwd()+'/src',loader:'ts',contents:`
import {ref,computed,effectScope} from 'vue'
import {useFileNavigator} from './files/useFileNavigator'
globalThis.localStorage={setItem(){}};let prompts=0,switched=0,selected='',revealed='';const noop=()=>{}
const docs=ref([{id:'a',path:'Notes/a.md',relativePath:'a.md',content:'unsaved',updated:1},{id:'b',path:'Notes/sub/b.md',relativePath:'sub/b.md',updated:1}]),dirtyIds=ref(['a']),expanded=ref({}),root=ref('/Notes')
const scope=effectScope(),warn=console.warn;console.warn=noop
const nav=scope.run(()=>useFileNavigator({isTauri:true,docs,activeDoc:computed(()=>docs.value[0]),recentFiles:ref([]),pinnedRecentFolders:ref([]),nativeRecentDirs:ref([]),currentWorkspaceRoot:root,currentDirectory:ref('Notes'),search:ref(''),sortMode:ref('nameAsc'),workspaceDirectories:ref(['sub']),folderExpanded:expanded,dirtyIds,showRecentFiles:ref(false),showNewMenu:ref(true),showSortMenu:ref(false),fileHubPosition:ref({left:0,top:0}),confirmUnsaved:async()=>{prompts++;return false},revealFolder:path=>{revealed=path},flushDrafts:async()=>{},applyWorkspace:()=>{switched++},selectDoc:async id=>{selected=id},notify:message=>{throw Error(message)}}))
console.warn=warn
docs.value.push({id:'hidden',path:'Notes/.env',relativePath:'.env',content:'KEY=value',updated:1,openable:true},{id:'binary',path:'Notes/.DS_Store',relativePath:'.DS_Store',content:'',updated:1,openable:false});
if(!nav.treeRows.value.some(row=>row.kind==='file'&&row.doc.id==='hidden')||nav.treeRows.value.some(row=>row.kind==='file'&&row.doc.id==='binary'))throw Error('File tree must show hidden text files and filter unopenable files');
await nav.openRecentFile('/Notes/sub/b.md');if(selected!=='b'||prompts)throw Error('Internal existing file prompted')
await nav.openRecentFile('/Notes/new.md');if(!selected.includes('new.md')||prompts||switched)throw Error('Internal indexed target replaced workspace')
await nav.selectDirectory('/Notes/sub');if(revealed!=='sub'||!expanded.value.sub||prompts||switched)throw Error('Internal folder lost workspace')
await nav.openRecentFile('/Other/out.md');await nav.selectDirectory('/Notes-other');if(prompts!==2||switched)throw Error('External path bypassed confirmation')
if(dirtyIds.value[0]!=='a'||docs.value[0].content!=='unsaved')throw Error('Unsaved content changed')
dirtyIds.value=[];root.value='';await nav.selectDirectory('/Notes');if(switched!==1)throw Error('Stale backend root prevented folder opening');
scope.stop();console.log('PASS internal files and folders preserve drafts without prompt; external targets and similarly named sibling require confirmation')
`},plugins:[{name:'native',setup(b){b.onResolve({filter:/^@tauri-apps\/api\/core$/},()=>({path:'native',namespace:'mock'}));b.onLoad({filter:/.*/,namespace:'mock'},()=>({loader:'js',contents:`export async function invoke(command,args){if(command==='workspace_relative_target')return args.path.startsWith('/Notes/')?args.path.slice(7):args.path==='/Notes'?'':null;if(command==='open_workspace_path')return {name:'Notes',root:args.path,directories:[],files:[]};if(command==='list_recent_workspaces')return [];if(command==='sync_recent_menus')return;throw Error(command)}`}))}}],bundle:true,platform:'node',format:'esm',outfile:out})
await import(out)
}finally{rmSync(dir,{recursive:true,force:true})}
