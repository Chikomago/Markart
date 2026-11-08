import test from 'node:test'
import assert from 'node:assert/strict'
import {build} from 'esbuild'
import {writeFileSync,unlinkSync} from 'node:fs'
import {ref,computed} from 'vue'
const bundle=await build({entryPoints:['src/files/useLocalWorkspace.ts'],bundle:true,platform:'node',format:'esm',write:false,external:['vue'],plugins:[{name:'native',setup(b){b.onResolve({filter:/^@tauri-apps\/api\/core$/},()=>({path:'native',namespace:'native'}));b.onLoad({filter:/.*/,namespace:'native'},()=>({contents:'export const invoke=(...args)=>globalThis.__multiNative(...args)',loader:'js'}))}}]})
const modulePath=new URL('../.multidirectory-test.mjs',import.meta.url);writeFileSync(modulePath,bundle.outputFiles[0].text);const {useLocalWorkspace}=await import(modulePath.href);unlinkSync(modulePath)
function fixture(){
 const roots={'/A':{'note.md':'A original','Sub/other.md':'A child'},'/B':{'note.md':'B original'}},calls=[],conflicts=[],catalog={stale:false};let nativeRoot='';
 const info=root=>({root,name:root.slice(1),directories:root==='/A'?['Sub']:[],files:Object.entries(roots[root]).map(([relativePath,content])=>({relativePath,utf8:true,openable:true,updated:1,excerpt:content}))})
 globalThis.__multiNative=async(command,args={})=>{calls.push([command,args]);if(command==='list_recent_workspaces')return Object.keys(roots);if(command==='activate_workspace'){nativeRoot=args.path;return info(nativeRoot)}if(command==='workspace_relative_target')return args.path.startsWith(nativeRoot+'/')?args.path.slice(nativeRoot.length+1):null;if(command==='open_document_path'){nativeRoot=args.path.slice(0,args.path.lastIndexOf('/'));return {workspace:info(nativeRoot),relativePath:args.path.split('/').pop()}}if(command==='refresh_workspace')return catalog.stale&&args.indexedOnly?{...info(nativeRoot),files:[]}:info(nativeRoot);if(command==='close_workspace'){nativeRoot='';return null;}if(command==='read_document'){assert.equal(args.workspaceRoot,nativeRoot);const content=roots[nativeRoot][args.relativePath];assert.notEqual(content,undefined);return {content,version:content,encoding:'UTF-8'}}if(command==='load_draft')return null;if(command==='save_document_as'){roots['/B']['saved.md']=args.content;nativeRoot='/B';return {workspace:info('/B'),relativePath:'saved.md'}}throw Error('Unexpected '+command)}
 const docs=ref([]),activeId=ref(''),openTabs=ref([]),dirtyIds=ref([]),currentWorkspaceRoot=ref(''),folderExpanded=ref({});const activeDoc=computed(()=>docs.value.find(d=>d.id===activeId.value)||{})
 const deps={isTauri:true,docs,activeId,activeDoc,activeKind:computed(()=>'markdown'),content:computed(()=>activeDoc.value.content),selectedFolder:ref(null),currentWorkspaceRoot,currentDirectory:ref(''),workspaceDirectories:ref([]),dirtyIds,openTabs,folderExpanded,folderInput:ref(null),nativeRecentDirs:ref([]),recentFiles:ref([]),mode:ref('wysiwyg'),selectedText:ref(''),showNewMenu:ref(false),getTabPaths:()=>[],getMarkdownMode:()=>'wysiwyg',resetHistoryForWorkspace(){},closeHistory(){},clearScrollSync(){},resetConflicts(){},reportConflict:(...args)=>conflicts.push(args),recordRecentFile(){},markDirty:id=>{if(!dirtyIds.value.includes(id))dirtyIds.value.push(id)},askFileAction:async()=>null,moveWithLinks:async()=>{},notify:message=>{if(message!=='已保存')assert.fail(message)}}
 return {roots,calls,conflicts,catalog,...deps,...useLocalWorkspace(deps)}
}
test('same-name files in different roots remain separate tabs and preserve dirty buffers',async()=>{
 const f=fixture();await f.openFileAtPath('/A/note.md');const first=f.activeDoc.value;first.content='A unsaved';f.dirtyIds.value.push(first.id);f.folderExpanded.value.Sub=true;
 await f.openFileAtPath('/B/note.md');const second=f.activeDoc.value;assert.notEqual(second.id,first.id);assert.equal(second.content,'B original');assert.equal(first.relativePath,undefined);assert.equal(f.openTabs.value.length,2);
 await f.selectDoc(first.id);assert.equal(f.currentWorkspaceRoot.value,'/A');assert.equal(f.activeDoc.value,first);assert.equal(first.content,'A unsaved');assert.equal(first.relativePath,'note.md');assert.equal(second.relativePath,undefined);assert.equal(f.folderExpanded.value.Sub,true);assert.ok(f.dirtyIds.value.includes(first.id));
 await f.openFileAtPath('/A/note.md');assert.equal(f.openTabs.value.length,2);
})
test('child files retain their known parent workspace and same-root tab switches do not reactivate indexes',async()=>{
 const f=fixture();await f.openFileAtPath('/A/note.md');const first=f.activeId.value;await f.openFileAtPath('/A/Sub/other.md');assert.equal(f.currentWorkspaceRoot.value,'/A');assert.equal(f.activeDoc.value.relativePath,'Sub/other.md');
 f.calls.length=0;await f.selectDoc(first);assert.equal(f.calls.filter(([name])=>name==='activate_workspace').length,0);
})
test('saving a temporary tab binds that tab without dropping other dirty tabs',async()=>{
 const f=fixture();await f.openFileAtPath('/A/note.md');const first=f.activeDoc.value;first.content='Keep me';f.dirtyIds.value.push(first.id);f.newTemporaryDoc();const temporary=f.activeDoc.value;temporary.content='Saved body';f.dirtyIds.value.push(temporary.id);
 assert.equal(await f.saveAs(),true);assert.equal(f.activeId.value,temporary.id);assert.equal(temporary.temporary,false);assert.equal(temporary.absolutePath,'/B/saved.md');assert.equal(f.openTabs.value.length,2);assert.equal(first.content,'Keep me');assert.ok(f.dirtyIds.value.includes(first.id));assert.ok(!f.dirtyIds.value.includes(temporary.id));
})
test('session restoration keeps roots separate and activates only the selected directory',async()=>{
 const f=fixture();assert.equal(await f.restoreOpenTabs([{root:'/A',path:'note.md'},{root:'/B',path:'note.md'}],'/B/note.md'),true);assert.equal(f.openTabs.value.length,2);assert.equal(f.currentWorkspaceRoot.value,'/B');assert.deepEqual(f.calls.filter(([name])=>name==='activate_workspace').map(([,args])=>args.path),['/B']);
 await f.selectDoc(f.openTabs.value[0]);assert.equal(f.currentWorkspaceRoot.value,'/A');assert.equal(f.activeDoc.value.content,'A original');
})
test('switching back detects changed disk content without replacing an unsaved buffer',async()=>{
 const f=fixture();await f.openFileAtPath('/A/note.md');const first=f.activeDoc.value;first.content='Unsaved';f.dirtyIds.value.push(first.id);await f.openFileAtPath('/B/note.md');f.roots['/A']['note.md']='External';await f.selectDoc(first.id);assert.equal(first.content,'Unsaved');assert.equal(f.conflicts[0][0],first.id);assert.equal(f.conflicts[0][1].content,'External');
})

test('closing one directory preserves tabs and dirty files belonging to another directory',async()=>{
 const f=fixture();await f.openFileAtPath('/A/note.md');const a=f.activeDoc.value; a.content='Keep A';f.dirtyIds.value.push(a.id);await f.openFileAtPath('/B/note.md');assert.equal(await f.closeWorkspace(),true);assert.equal(f.currentWorkspaceRoot.value,'/A');assert.equal(f.activeDoc.value,a);assert.equal(a.content,'Keep A');assert.ok(f.dirtyIds.value.includes(a.id));assert.equal(f.openTabs.value.length,1);
})

test('opening an overlapping parent directory reuses the absolute file identity without losing dirty text',async()=>{
 const f=fixture();f.roots['/A/Sub']={'other.md':'A child'};await f.openFileAtPath('/A/Sub/other.md');const original=f.activeDoc.value;original.content='Unsaved child';f.dirtyIds.value.push(original.id);
 await f.openDirectoryPath('/A');await f.openFileAtPath('/A/Sub/other.md');assert.equal(f.activeDoc.value,original);assert.equal(original.content,'Unsaved child');assert.equal(original.workspaceRoot,'/A');assert.equal(original.relativePath,'Sub/other.md');assert.equal(f.docs.value.filter(doc=>doc.absolutePath==='/A/Sub/other.md').length,1);
})

test('a pending background index does not turn the saved tab back into a temporary file',async()=>{
 const f=fixture();await f.openFileAtPath('/A/note.md');f.newTemporaryDoc();f.activeDoc.value.content='Saved';f.catalog.stale=true;
 assert.equal(await f.saveAs(),true);const saved=f.activeDoc.value;
 await new Promise(resolve=>setTimeout(resolve,30));assert.equal(saved.temporary,false);assert.equal(saved.absolutePath,'/B/saved.md');
 f.catalog.stale=false;await new Promise(resolve=>setTimeout(resolve,300));assert.equal(saved.temporary,false);assert.equal(f.activeDoc.value.id,saved.id);
})
