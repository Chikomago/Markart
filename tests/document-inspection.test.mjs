import test from 'node:test'
import assert from 'node:assert/strict'
import { build } from 'esbuild'
const output = await build({ entryPoints: ['src/files/useDocumentSafety.ts'], bundle: true, platform: 'node', format: 'esm', write: false, external: ['vue'], plugins: [{ name: 'native-inspection', setup(builder) {
  builder.onResolve({filter:/^@tauri-apps\/api\/(core|event)$/}, args=>({path:args.path,namespace:'native'}))
  builder.onLoad({filter:/.*/,namespace:'native'},()=>({contents:'export const invoke=(...args)=>globalThis.__inspectionNative(...args);export const emit=async()=>{};export const listen=async()=>()=>{};',loader:'js'}))
}}] })
// Keep Vue shared with the composable; resolve the generated module in the project.
const {writeFileSync,unlinkSync}=await import('node:fs');const path=new URL('../.inspection-test.mjs',import.meta.url);writeFileSync(path,output.outputFiles[0].text)
const {useDocumentSafety}=await import(path.href);unlinkSync(path)
const {computed,effectScope,ref}=await import('vue')
function fixture(invoke){
 globalThis.__inspectionNative=invoke
 const scope=effectScope(),doc=ref({id:'a',relativePath:'a.md',path:'Notes/a.md',loaded:true,content:'unsaved edit',diskContent:'disk text',version:'baseline'}),root=ref('/Notes'),activeId=ref('a'),notices=[]
 const deps={isTauri:true,docs:ref([doc.value]),dirtyIds:ref(['a']),activeDoc:computed(()=>doc.value),activeId,currentWorkspaceRoot:root,externalFileChanges:ref('confirm'),gitEnabled:computed(()=>false),gitMaxVersions:computed(()=>20),gitRetentionDays:computed(()=>0),lastGitFailure:ref(''),scheduleWebdavSync(){},scheduleGithubSync(){},saveTemporaryDoc:async()=>false,persist(){},notify:message=>notices.push(message)}
 const safety=scope.run(()=>useDocumentSafety(deps));return {scope,doc,root,activeId,notices,...safety}
}
test('inspection restores a missing native baseline without overwriting unsaved edits',async()=>{
 let ready=false,reads=0
 const f=fixture(async command=>{if(command==='inspect_document'){if(!ready)throw '请先读取文件';return {changed:false,missing:false,content:null}}if(command==='read_document'){reads++;ready=true;return {content:'disk text',version:'baseline',encoding:'utf-8'}}})
 await f.inspectActiveDocument();await f.inspectActiveDocument()
 assert.equal(reads,1);assert.deepEqual(f.notices,[]);assert.equal(f.doc.value.content,'unsaved edit');assert.equal(f.conflict.value,null);f.scope.stop()
})
test('recovered baseline still reports external changes instead of silently accepting the disk',async()=>{
 const f=fixture(async command=>{if(command==='inspect_document')throw '请先读取文件';if(command==='read_document')return {content:'external edit',version:'new-version',encoding:'utf-8'}})
 await f.inspectActiveDocument();assert.equal(f.doc.value.content,'unsaved edit');assert.equal(f.conflict.value?.disk.content,'external edit');assert.deepEqual(f.notices,[]);f.scope.stop()
})
test('old inspection failures after switching workspaces are discarded',async()=>{
 let reject;const f=fixture(()=>new Promise((_resolve,fail)=>{reject=fail}));const task=f.inspectActiveDocument();f.root.value='/Other';reject('请先读取文件');await task
 assert.deepEqual(f.notices,[]);f.scope.stop()
})

test('unrelated inspection errors remain visible and do not trigger baseline recovery',async()=>{
 let reads=0;const f=fixture(async command=>{if(command==='inspect_document')throw '读取磁盘版本失败：没有权限';if(command==='read_document')reads++})
 await f.inspectActiveDocument();assert.equal(reads,0);assert.equal(f.notices.length,1);assert.match(f.notices[0],/没有权限/);f.scope.stop()
})
