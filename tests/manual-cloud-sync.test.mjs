import test from 'node:test'
import assert from 'node:assert/strict'
import {build} from 'esbuild'
import {writeFileSync,unlinkSync} from 'node:fs'
import {ref,effectScope} from 'vue'
const output=await build({entryPoints:['src/sync/useCloudSync.ts'],bundle:true,platform:'node',format:'esm',write:false,external:['vue'],plugins:[{name:'native',setup(builder){builder.onResolve({filter:/^@tauri-apps\/api\/core$/},()=>({path:'native',namespace:'native'}));builder.onLoad({filter:/.*/,namespace:'native'},()=>({contents:'export const invoke=(...args)=>globalThis.__manualSyncNative(...args)',loader:'js'}))}}]})
const path=new URL('../.manual-sync-test.mjs',import.meta.url);writeFileSync(path,output.outputFiles[0].text);const {useCloudSync}=await import(path.href);unlinkSync(path)
test('manual sync bypasses auto-sync preference, records successful providers and preserves timestamps on failure',async()=>{
 const storage=new Map();globalThis.localStorage={getItem:key=>storage.get(key)||null,setItem:(key,value)=>storage.set(key,value)}
 const settings={};for(const key of ['webdavEnabled','githubEnabled','webdavRetryOnFailure','githubRetryOnFailure'])settings[key]=ref(false)
 for(const key of ['webdavSyncIntervalSeconds','githubSyncIntervalSeconds'])settings[key]=ref(60)
 for(const key of ['webdavUrl','webdavUsername','githubUrl','githubUsername'])settings[key]=ref('example')
 settings.syncConflictPolicy=ref('merge');const calls=[];let fail=false;let refreshes=0
 globalThis.__manualSyncNative=async(command)=>{calls.push(command);if(fail)throw Error('offline');return {uploaded:0,downloaded:0,deletedLocal:0,deletedRemote:0,conflicts:[],copies:[],changed:['note.md']}}
 const scope=effectScope();const warn=console.warn;console.warn=()=>{};let sync
 try{sync=scope.run(()=>useCloudSync({isTauri:true,settings,currentWorkspaceRoot:ref('/Notes'),docs:ref([]),dirtyIds:ref([]),getConflictedIds:()=>[],refreshAfterSync:async()=>{refreshes++},notify(){},showSettings:ref(false),settingTab:ref(''),showDirectorySync:ref(false),githubCreatingRepo:ref(false)}))}finally{console.warn=warn}
 try{
 sync.githubHasToken.value=true;sync.githubBoundUrl.value='repo';sync.webdavHasPassword.value=true;sync.webdavBoundUrl.value='remote'
 assert.equal(sync.directorySyncBound.value,true);assert.match(sync.directorySyncHint.value,/尚未同步/)
 await sync.runDirectorySync();assert.deepEqual(calls,['sync_github','sync_webdav']);assert.equal(refreshes,2);assert.match(sync.directorySyncHint.value,/最近同步/)
 const saved=storage.get('markart-sync-times-v1');assert.equal(Object.keys(JSON.parse(saved)).length,2)
 fail=true;await sync.runDirectorySync();assert.equal(storage.get('markart-sync-times-v1'),saved)
 calls.length=0;sync.githubBusy.value=true;await sync.runDirectorySync();assert.equal(calls.length,0)
 }finally{scope.stop()}
})
