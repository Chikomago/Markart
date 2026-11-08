import test from 'node:test'
import assert from 'node:assert/strict'
import {build} from 'esbuild'
import {writeFileSync,unlinkSync} from 'node:fs'
import {ref,computed} from 'vue'
const result=await build({entryPoints:['src/files/useLocalWorkspace.ts'],bundle:true,platform:'node',format:'esm',write:false,external:['vue'],plugins:[{name:'native',setup(builder){builder.onResolve({filter:/^@tauri-apps\/api\/core$/},()=>({path:'native',namespace:'native'}));builder.onLoad({filter:/.*/,namespace:'native'},()=>({contents:'export const invoke=(...args)=>globalThis.__creationNative(...args)',loader:'js'}))}}]})
const path=new URL('../.creation-test.mjs',import.meta.url);writeFileSync(path,result.outputFiles[0].text);const {useLocalWorkspace}=await import(path.href);unlinkSync(path)
function fixture(overrides={}){
 const calls=[],selectedFolder=ref('Chosen/Sub'),docs=ref([{id:'a',path:'Notes/Elsewhere/a.md',relativePath:'Elsewhere/a.md',content:'Original',loaded:true,updated:1}]),activeId=ref('a'),activeDoc=computed(()=>docs.value.find(doc=>doc.id===activeId.value)||{}),directories=['Chosen','Chosen/Sub','Elsewhere']
 globalThis.__creationNative=async(command,args)=>{calls.push([command,args]);if(command==='load_draft')return null;return {root:'/Notes',name:'Notes',directories,files:[{relativePath:'Elsewhere/a.md',utf8:true,updated:1,excerpt:''}]}}
 const deps={isTauri:true,docs,activeId,activeDoc,activeKind:computed(()=>'markdown'),content:computed(()=>activeDoc.value.content),selectedFolder,currentWorkspaceRoot:ref('/Notes'),currentDirectory:ref('Notes'),workspaceDirectories:ref(directories),dirtyIds:ref([]),openTabs:ref(['a']),folderExpanded:ref({}),folderInput:ref(null),nativeRecentDirs:ref([]),recentFiles:ref([]),mode:ref('wysiwyg'),selectedText:ref(''),showNewMenu:ref(false),getTabPaths:()=>[],getMarkdownMode:()=>'wysiwyg',resetHistoryForWorkspace(){},closeHistory(){},clearScrollSync(){},resetConflicts(){},reportConflict(){},recordRecentFile(){},markDirty(){},askFileAction:async(_title,value)=>value,moveWithLinks:async()=>{},notify(){}}
 return {calls,selectedFolder,docs,activeId,openTabs:deps.openTabs,workspaceDirectories:deps.workspaceDirectories,...useLocalWorkspace({...deps,...overrides})}
}
test('workspace creation uses the selected folder for files, folders and templates',async()=>{
 const f=fixture();await f.newDoc();assert.equal(f.calls.find(([command])=>command==='create_markdown')[1].relativePath,'Chosen/Sub/未命名文件.md')
 f.calls.length=0;await f.newFolder();assert.equal(f.calls.find(([command])=>command==='create_folder')[1].relativePath,'Chosen/Sub/新建文件夹')
 f.calls.length=0;await f.newDoc({id:'t',name:'Template',content:'# Example'});const args=f.calls.find(([command])=>command==='create_markdown')[1];assert.equal(args.relativePath,'Chosen/Sub/Template.md');assert.equal(args.content,'# Example')
})
test('selecting a file clears folder selection; root remains an explicit creation target',async()=>{
 const f=fixture();await f.selectDoc('a');assert.equal(f.selectedFolder.value,null);f.selectedFolder.value='';await f.newFolder();assert.equal(f.calls.find(([command])=>command==='create_folder')[1].relativePath,'新建文件夹')
})

test('creation falls back to the current file directory',async()=>{const f=fixture();f.selectedFolder.value=null;await f.newDoc();await f.newFolder();assert.equal(f.calls.find(([command])=>command==='create_markdown')[1].relativePath,'Elsewhere/未命名文件.md');assert.equal(f.calls.find(([command])=>command==='create_folder')[1].relativePath,'Elsewhere/新建文件夹')})
test('context-menu targets override selection without changing workspace-menu targets',async()=>{
 const f=fixture();await f.newDoc(undefined,'Elsewhere');await f.newFolder('');
 assert.equal(f.calls.find(([command])=>command==='create_markdown')[1].relativePath,'Elsewhere/未命名文件.md');assert.equal(f.calls.find(([command])=>command==='create_folder')[1].relativePath,'新建文件夹');
 f.calls.length=0;await f.newFolder();assert.equal(f.calls.find(([command])=>command==='create_folder')[1].relativePath,'Chosen/Sub/新建文件夹');
})

test('inline creation waits for a name and cancellation creates nothing',async()=>{
 let resolveName;const prompts=[];
 const f=fixture({askCreationName:(kind,parent,name)=>{prompts.push({kind,parent,name});return new Promise(resolve=>{resolveName=resolve})}});
 const file=f.newDoc(undefined,'Elsewhere');assert.equal(f.calls.length,0);resolveName('Inline.md');await file;
 assert.equal(f.calls.find(([command])=>command==='create_markdown')[1].relativePath,'Elsewhere/Inline.md');
 f.calls.length=0;const folder=f.newFolder('Chosen');assert.equal(f.calls.length,0);resolveName(null);await folder;assert.equal(f.calls.length,0);
 assert.deepEqual(prompts.map(({kind,parent})=>({kind,parent})),[{kind:'file',parent:'Elsewhere'},{kind:'folder',parent:'Chosen'}]);
})

test('unchanged workspace refresh preserves file objects, arrays and directory state',async()=>{
 const f=fixture();await f.refreshWorkspace();const files=f.docs.value,doc=files[0],directories=f.workspaceDirectories.value;
 await f.refreshWorkspace();assert.equal(f.docs.value,files);assert.equal(f.docs.value[0],doc);assert.equal(f.workspaceDirectories.value,directories);
})

test('sync holds the visible tree and coalesces watcher refreshes after settling',async()=>{
 const syncBusy=ref(false),f=fixture({syncBusy});const visible=f.docs.value;
 syncBusy.value=true;
 await Promise.all([f.refreshWorkspace(),f.refreshWorkspace(),f.refreshWorkspace()]);
 assert.equal(f.calls.length,0);assert.equal(f.docs.value,visible);
 syncBusy.value=false;await f.refreshWorkspace();assert.equal(f.calls.length,0);assert.equal(f.docs.value,visible);
 await new Promise(resolve=>setTimeout(resolve,300));assert.equal(f.calls.filter(([command])=>command==='refresh_workspace').length,1);
})
test('a refresh already in flight cannot replace the visible tree during sync',async()=>{
 const syncBusy=ref(false),f=fixture({syncBusy});const visible=f.docs.value;let finish;
 globalThis.__creationNative=()=>new Promise(resolve=>{finish=resolve});
 const refresh=f.refreshWorkspace();syncBusy.value=true;
 finish({root:'/Notes',name:'Notes',directories:[],files:[]});await refresh;assert.equal(f.docs.value,visible);
 // End the hold with a complete snapshot, rather than publishing the transient empty result.
 globalThis.__creationNative=async()=>({root:'/Notes',name:'Notes',directories:['Elsewhere'],files:[{relativePath:'Elsewhere/a.md',utf8:true,updated:1,excerpt:''}]});
 syncBusy.value=false;await new Promise(resolve=>setTimeout(resolve,300));assert.equal(f.docs.value[0].relativePath,'Elsewhere/a.md');
})

test('new tab creates independent temporary files without writing to the workspace',()=>{
 const f=fixture();f.newTemporaryDoc();const first=f.activeId.value;f.newTemporaryDoc();const second=f.activeId.value;
 assert.notEqual(first,second);assert.equal(f.calls.length,0);
 for(const id of [first,second]){const doc=f.docs.value.find(item=>item.id===id);assert.equal(doc.temporary,true);assert.equal(doc.loaded,true);assert.equal(doc.relativePath,undefined);assert.ok(f.openTabs.value.includes(id))}
 assert.ok(f.docs.value.some(doc=>doc.id==='a'));
})
