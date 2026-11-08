import { pathToFileURL } from 'node:url'
import test from 'node:test'
import assert from 'node:assert/strict'
import { build } from 'esbuild'
import { mkdtempSync,writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
const dir=mkdtempSync(join(tmpdir(),'markart-resource-test-')),entry=join(dir,'entry.ts'),output=join(dir,'bundle.mjs')
writeFileSync(entry,`export { ResourceScope } from '${join(process.cwd(),'src/plugins/runtime/scope.ts').replaceAll('\\','/')}';export { initializePluginPermissions } from '${join(process.cwd(),'src/plugins/permissions/declaration.ts').replaceAll('\\','/')}';export { pluginGrants } from '${join(process.cwd(),'src/plugins/permissions/grants.ts').replaceAll('\\','/')}';`)
await build({entryPoints:[entry],bundle:true,format:'esm',platform:'node',outfile:output})
const {ResourceScope,initializePluginPermissions,pluginGrants}=await import(pathToFileURL(output).href)
test('closing a plugin cancels signals and disposes children and listeners once',async()=>{
 const scope=new ResourceScope(),child=scope.child(),calls=[]
 scope.track(()=>calls.push('listener'));child.track(()=>calls.push('child'))
 await Promise.all([scope.close(),scope.close()])
 assert.equal(scope.signal.aborted,true);assert.equal(child.signal.aborted,true)
 assert.deepEqual(calls,['child','listener'])
})
test('stopped plugins cannot initialize declared permissions',()=>{
 const controller=new AbortController(),id='dev.markart.cancel-consent'
 controller.abort()
 assert.throws(()=>initializePluginPermissions({manifest:{id,permissions:{required:['files.read'],optional:[]}}},controller.signal),error=>error.code==='cancelled')
 assert.equal(pluginGrants.state[id],undefined)
})
test('manifest permissions initialize without consent and include declared optional capabilities',()=>{
 const pkg={manifest:{id:'test.declared',permissions:{required:['index.read'],optional:['files.read']}}}
 initializePluginPermissions(pkg)
 assert.doesNotThrow(()=>pluginGrants.require(pkg.manifest.id,'index.read'))
 assert.doesNotThrow(()=>pluginGrants.require(pkg.manifest.id,'files.read'))
 assert.throws(()=>pluginGrants.require(pkg.manifest.id,'files.write'),error=>error.code==='permission-denied')
 pkg.manifest.permissions.required=[];pkg.manifest.permissions.optional=[]
 initializePluginPermissions(pkg)
 assert.throws(()=>pluginGrants.require(pkg.manifest.id,'index.read'),error=>error.code==='permission-denied')
})
