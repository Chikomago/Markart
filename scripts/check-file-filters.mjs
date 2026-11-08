import { build } from 'esbuild'
import assert from 'node:assert/strict'
import {writeFileSync} from 'node:fs'
import { mockIPC } from '@tauri-apps/api/mocks'
const bundle = await build({ stdin: { contents: "export {useFileNavigator} from './src/files/useFileNavigator';export {searchGroups,extensionOf} from './src/files/fileFilters';export {dirtyMoveDocument} from './src/files/moveGuard';export {ref,computed,effectScope,nextTick} from 'vue'", resolveDir:process.cwd(),loader:'ts'},bundle:true,platform:'node',format:'esm',write:false })
writeFileSync('/tmp/markart-file-filter-test.mjs',bundle.outputFiles[0].text)
const {useFileNavigator,searchGroups,extensionOf,dirtyMoveDocument,ref,computed,effectScope,nextTick} = await import('file:///tmp/markart-file-filter-test.mjs')
globalThis.window={};globalThis.localStorage={setItem(){}}
assert.deepEqual(searchGroups('alpha && beta ｜｜ gamma'),[['alpha','beta'],['gamma']]);assert.equal(extensionOf('.env'),'');assert.equal(extensionOf('.config.JSON'),'json')
const fixture=[{id:'a',relativePath:'a.md',content:'alpha beta'},{id:'b',relativePath:'sub/b.txt',content:'',loaded:false},{id:'c',relativePath:'.env',content:'alpha'},{id:'d',relativePath:'secret.txt',content:'alpha beta',hidden:true},{id:'e',relativePath:'README',content:'gamma'},{id:'f',relativePath:'image.png',content:'',openable:false}]
const docs=ref(fixture.map(doc=>({path:'Notes/'+doc.relativePath,loaded:true,updated:1,...doc}))),search=ref(''),dirty=ref(['a']),root=ref('/Notes'),scope=effectScope()
mockIPC((command,args)=>{if(command==='sync_recent_menus')return;assert.equal(command,'search_documents');return args.query==='gamma'||args.query==='delta'?[{relativePath:'sub/b.txt',snippet:'gamma delta'}]:[]})
const warn=console.warn;console.warn=()=>{}
const nav=scope.run(()=>useFileNavigator({isTauri:true,docs,activeDoc:computed(()=>docs.value[0]),recentFiles:ref([]),pinnedRecentFolders:ref([]),nativeRecentDirs:ref([]),currentWorkspaceRoot:root,currentDirectory:ref('Notes'),search,sortMode:ref('nameAsc'),workspaceDirectories:ref(['sub','empty','sub/empty']),folderExpanded:ref({}),dirtyIds:dirty,showRecentFiles:ref(false),showNewMenu:ref(false),showSortMenu:ref(false),fileHubPosition:ref({left:0,top:0}),flushDrafts:async()=>{},applyWorkspace(){},selectDoc:async()=>{},notify:message=>{throw Error(message)}}));console.warn=warn
search.value='alpha&&beta';await nextTick();assert.deepEqual(nav.filteredDocs.value.map(doc=>doc.id),['a','d']);assert.ok(nav.treeRows.value.some(row=>row.path==='empty'));nav.hideEmptyFolders.value=true;assert.ok(!nav.treeRows.value.some(row=>row.kind==='folder'))
search.value='gamma && delta';await nextTick();await new Promise(resolve=>setTimeout(resolve,260));assert.deepEqual(nav.filteredDocs.value.map(doc=>doc.id),['b']);assert.deepEqual(nav.treeRows.value.map(row=>row.path),['sub','sub/b.txt'])
search.value='gamma || alpha&&beta';await nextTick();await new Promise(resolve=>setTimeout(resolve,260));assert.equal(nav.filteredDocs.value.length,4)
search.value='';nav.excludeExtensionless.value=true;await nextTick();assert.deepEqual(nav.filteredDocs.value.map(doc=>doc.id),['a','b','d'])
nav.excludeHidden.value=true;assert.deepEqual(nav.filteredDocs.value.map(doc=>doc.id),['a','b'])
nav.excludeExtensionless.value=false;nav.fileExtensions.value='.MD, txt';assert.deepEqual(nav.filteredDocs.value.map(doc=>doc.id),['a','b']);assert.ok(!nav.treeRows.value.some(row=>row.path.includes('empty')))
nav.toggleFileExtension('txt');assert.deepEqual(nav.filteredDocs.value.map(doc=>doc.id),['a']);nav.toggleFileExtension('txt');assert.deepEqual(nav.filteredDocs.value.map(doc=>doc.id),['a','b'])
nav.hideEmptyFolders.value=false;assert.ok(nav.treeRows.value.some(row=>row.path==='empty'));
assert.equal(dirtyMoveDocument(docs.value,['a'],'sub/b.txt'),undefined);assert.equal(dirtyMoveDocument(docs.value,['a'],'a.md')?.id,'a');assert.equal(dirtyMoveDocument(docs.value,['a'],'sub/b.txt',[{relativePath:'a.md'}])?.id,'a')
nav.fileExtensions.value='';nav.includeExtensionless.value=true;assert.deepEqual(nav.filteredDocs.value.map(doc=>doc.id),['e'])
nav.excludeExtensionless.value=true;assert.equal(nav.includeExtensionless.value,false)
nav.includeExtensionless.value=true;assert.equal(nav.excludeExtensionless.value,false)
nav.fileExtensions.value='md';assert.deepEqual(nav.filteredDocs.value.map(doc=>doc.id),['a','e'])
nav.includeExtensionless.value=false
for (const extension of ['doc','docx','csv','xml','toml']) docs.value.push({id:extension,path:'Notes/file.'+extension,relativePath:'file.'+extension,content:'',loaded:true,updated:1})
nav.fileExtensions.value='doc';assert.deepEqual(nav.filteredDocs.value.map(doc=>doc.id),['doc','docx'])
for (const extension of ['csv','xml','toml']) { assert.ok(nav.commonFileExtensions.includes(extension));nav.fileExtensions.value=extension;assert.deepEqual(nav.filteredDocs.value.map(doc=>doc.id),[extension]) }
scope.stop();console.log('PASS extensionless, hidden and extension filters; AND/OR disk search; matching ancestors only; scoped dirty move checks')
