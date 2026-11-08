import { build } from 'esbuild'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
const directory = mkdtempSync(join(tmpdir(), 'markart-sync-policy-'))
try {
  const output = join(directory, 'check.mjs')
  await build({ stdin: { resolveDir: process.cwd() + '/src', loader: 'ts', contents: `
    import { ref, computed, effectScope } from 'vue'
    import { SettingsStore, settingRegistry } from './settings/settings'
    import { useCloudSync } from './sync/useCloudSync'
    const values = new Map(), storage = { getItem:k=>values.get(k)||null, setItem:(k,v)=>values.set(k,v) }
    const store = new SettingsStore(storage)
    if (store.get('syncConflictPolicy') !== 'merge') throw Error('Wrong default')
    if (!store.set('syncConflictPolicy','remote') || store.set('syncConflictPolicy','invalid')) throw Error('Policy validation failed')
    if (new SettingsStore(storage).get('syncConflictPolicy') !== 'remote') throw Error('Policy not persisted')
    const policy = ref(store.get('syncConflictPolicy'))
    const settings = Object.fromEntries(Object.entries(settingRegistry).filter(([,v])=>v.category==='sync').map(([k,v])=>[k,ref(v.default)]))
    settings.syncConflictPolicy = policy
    settings.webdavUrl.value = 'https://example.com/dav/'
    settings.webdavUsername.value = 'writer'
    const scope = effectScope(), noop=()=>{}, notices=[]
    // Lifecycle hooks are inert in this isolated fixture; invoke only explicit manual sync.
    const warn = console.warn; console.warn = noop
    const sync = scope.run(()=>useCloudSync({isTauri:true, settings, currentWorkspaceRoot:ref('/notes'), docs:ref([{id:'a',relativePath:'note.md'}]), dirtyIds:ref(['a']), getConflictedIds:()=>[],getActiveRelativePath:()=>'',applyWorkspace:noop,notify:m=>notices.push(m),showSettings:ref(false),settingTab:ref('sync'),showDirectorySync:ref(false),githubCreatingRepo:ref(false)}))
    console.warn=warn
    sync.githubHasToken.value=true; sync.githubBoundUrl.value='https://example.com/repo.git'
    sync.webdavHasPassword.value=true; sync.webdavBoundUrl.value='https://example.com/dav/notes/'
    await sync.runGithubSync(true); await sync.runWebdavSync(true)
    policy.value='merge'
    await sync.runGithubSync(true); await sync.runWebdavSync(true)
    if (globalThis.syncCalls.length!==4 || globalThis.syncCalls.some(([,args],i)=>args.conflictPolicy!==(i<2?'remote':'merge') || args.protected[0]!=='note.md')) throw Error('Policy or unsaved protection not forwarded')
    if (notices.length!==4 || notices.some(m=>!m.includes('版本副本'))) throw Error('Copy feedback missing')
    scope.stop()
    console.log('PASS conflict policy default, validation, persistence, both sync commands, unsaved paths and copy feedback')
  ` }, plugins:[{name:'sync-native',setup(build){build.onResolve({filter:/^@tauri-apps\/api\/core$/},()=>({path:'native',namespace:'mock'}));build.onLoad({filter:/.*/,namespace:'mock'},()=>({contents:`globalThis.syncCalls=[]; export async function invoke(command,args){if(!['sync_github','sync_webdav'].includes(command))throw Error(command);globalThis.syncCalls.push([command,args]);return {uploaded:0,downloaded:0,deletedLocal:0,deletedRemote:0,conflicts:[],copies:['note.conflict.md'],changed:[]}}`,loader:'js'}))}}],bundle:true,platform:'node',format:'esm',outfile:output})
  await import(output)
} finally { rmSync(directory,{recursive:true,force:true}) }
