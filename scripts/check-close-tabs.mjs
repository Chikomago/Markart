import { build } from 'esbuild'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
const directory=mkdtempSync(join(tmpdir(),'markart-close-tabs-'))
try {
 const output=join(directory,'check.mjs')
 await build({stdin:{resolveDir:process.cwd()+'/src',loader:'ts',contents:`
 import {ref,computed,effectScope} from 'vue'
 import {useWorkspaceTabs} from './workspace/useWorkspaceShell'
 import {useDocumentSafety} from './files/useDocumentSafety'
 const doc={id:'a',path:'a.md',relativePath:'a.md',loaded:true,content:'unsaved',diskContent:'old',version:'old'}, docs=ref([doc,{id:'b',path:'b.md'}]),dirtyIds=ref(['a']),activeId=ref('a'),noop=()=>{}
 let choice=null
 const tabs=useWorkspaceTabs({docs,dirtyIds,activeId,sidebar:ref(false),sideView:ref('tree'),folderExpanded:ref({}),selectDoc:async id=>{activeId.value=id},confirmClose:async()=>choice})
 tabs.openTabs.value=['a','b']
 await tabs.closeTab('a');if(tabs.openTabs.value.length!==2)throw Error('Cancel closed tab')
 // A cancelled or failed save returns null and must keep the tab.
 await tabs.closeTab('a');if(!tabs.openTabs.value.includes('a'))throw Error('Failed save closed tab')
 const scope=effectScope(),warn=console.warn;console.warn=noop
 const safety=scope.run(()=>useDocumentSafety({isTauri:true,docs,dirtyIds,activeId,activeDoc:computed(()=>docs.value.find(d=>d.id===activeId.value)),notify:noop,currentWorkspaceRoot:ref('/notes'),gitEnabled:ref(false),gitMaxVersions:ref(10),gitRetentionDays:ref(0),lastGitFailure:ref(''),scheduleWebdavSync:noop,scheduleGithubSync:noop,saveTemporaryDoc:async()=>false,persist:noop}))
 console.warn=warn
 if(!await safety.discardDoc('a')||docs.value[0].content!=='disk'||dirtyIds.value.length||!globalThis.cleared)throw Error('Discard did not restore disk and clear draft')
 await tabs.closeTab('a');if(tabs.openTabs.value.includes('a'))throw Error('Discard did not close tab')
 docs.value.push({id:'temp',temporary:true,path:'untitled',content:'draft'});tabs.openTabs.value.push('temp');dirtyIds.value=['temp'];choice='saved'
 // Saving an unnamed document can replace its id.
 docs.value.push({id:'saved',path:'saved.md'});tabs.openTabs.value.push('saved');activeId.value='saved';await tabs.closeTab('temp')
 if(tabs.openTabs.value.includes('saved'))throw Error('Newly saved document tab stayed open')
 scope.stop();console.log('PASS cancelled/failed save retains tab; discard restores disk and clears draft; renamed save closes correct tab')
 `},plugins:[{name:'native',setup(b){b.onResolve({filter:/^@tauri-apps\/api\/(core|event)$/},args=>({path:args.path,namespace:'mock'}));b.onLoad({filter:/.*/,namespace:'mock'},()=>({loader:'js',contents:`export const emit=async()=>{};export async function invoke(cmd){if(cmd==='read_document')return {content:'disk',version:'disk-v',encoding:'UTF-8'};if(cmd==='clear_draft'){globalThis.cleared=true;return}throw Error(cmd)}` }))}}],bundle:true,platform:'node',format:'esm',outfile:output})
 await import(output)
} finally {rmSync(directory,{recursive:true,force:true})}
