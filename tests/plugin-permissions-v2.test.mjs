import { pathToFileURL } from 'node:url'
import test from 'node:test'
import assert from 'node:assert/strict'
import {build} from 'esbuild'
import {mkdtempSync} from 'node:fs'
import {join} from 'node:path'
import {tmpdir} from 'node:os'
const dir=mkdtempSync(join(tmpdir(),'markart-grants-test-')),output=join(dir,'grants.mjs')
await build({entryPoints:['src/plugins/permissions/grants.ts'],bundle:true,platform:'node',format:'esm',outfile:output})
const declarationOutput=join(dir,'declaration.mjs')
await build({entryPoints:['src/plugins/permissions/declaration.ts'],bundle:true,platform:'node',format:'esm',outfile:declarationOutput})
const {PluginGrants}=await import(pathToFileURL(output).href)
const {addedPermissions}=await import(pathToFileURL(declarationOutput).href)
const declaration={required:['files.read','network'],optional:['files.write']}
test('capability grants survive directory changes while optional permissions stay denied',()=>{
 const grants=new PluginGrants();grants.approve('demo',declaration);assert.doesNotThrow(()=>grants.require('demo','files.read'));assert.throws(()=>grants.require('demo','files.write'));assert.equal('roots' in grants.state.demo,false);grants.revoke('demo');assert.throws(()=>grants.require('demo','files.read'))
})
test('network permission allows any host, with protocol safety rules only',()=>{
 const grants=new PluginGrants();grants.approve('demo',declaration)
 for(const url of ['https://api.example.com/v1/chat','https://example.com:8443/path','http://127.0.0.1:11434/api','http://localhost:8080','http://192.168.1.5:11434','http://172.16.0.9/api','http://[::1]:11434'])assert.doesNotThrow(()=>grants.network('demo',url),url)
 for(const url of ['http://api.example.com/v1','http://172.32.0.1/api','file:///etc/passwd','https://user@example.com'])assert.throws(()=>grants.network('demo',url),url)
 assert.equal(grants.matches('demo',{...declaration,required:[...declaration.required,'editor.read']}),false)
})
test('saved capability permissions no longer depend on legacy directory lists',()=>{
 let saved;const grant={permissions:['files.read'],roots:['/A'],domains:[],localServices:[],fingerprint:'old'}
 const grants=new PluginGrants({getItem:()=>JSON.stringify({demo:grant}),setItem:(_key,value)=>{saved=value}})
 assert.doesNotThrow(()=>grants.require('demo','files.read'));assert.equal('roots' in grants.state.demo,false)
 grants.approve('demo',declaration,['files.write']);assert.ok(grants.state.demo.permissions.includes('files.write'));assert.equal(saved.includes('roots'),false)
})
test('undeclared capabilities are refused and recorded for diagnostics',()=>{
 const grants=new PluginGrants();grants.approve('demo',declaration)
 assert.throws(()=>grants.require('demo','clipboard.read'),/未声明权限/)
 assert.deepEqual(grants.denials.demo,[{key:'clipboard.read',count:1}])
 assert.throws(()=>grants.require('demo','clipboard.read'))
 assert.equal(grants.denials.demo[0].count,2)
 const other=new PluginGrants();other.approve('demo',{required:['files.read'],optional:[]})
 assert.throws(()=>other.network('demo','https://evil.test'),/未声明权限/)
 assert.deepEqual(other.denials.demo,[{key:'network',count:1}])
 grants.approve('demo',{...declaration,required:[...declaration.required,'clipboard.read']})
 assert.equal(grants.denials.demo,undefined)
 assert.doesNotThrow(()=>grants.require('demo','clipboard.read'))
})
test('re-enabling a plugin clears diagnostics from the previous session',()=>{
 const grants=new PluginGrants();grants.approve('demo',declaration);const id='demo'
 assert.throws(()=>grants.require(id,'editor.write'))
 assert.ok(grants.denials[id].length)
 grants.revoke(id);assert.equal(grants.denials[id],undefined)
})
test('updates report only added capabilities',()=>{
 const before={required:['editor.read'],optional:['files.write']}
 assert.deepEqual(addedPermissions(before,{...before}),{permissions:[]})
 assert.deepEqual(addedPermissions(before,{...before,required:['editor.read','network'],optional:['files.write']}),{permissions:['network']})
 assert.deepEqual(addedPermissions(before,{...before,optional:[]}).permissions,[],'shrinking a declaration is not a new capability')
 assert.deepEqual(addedPermissions(before,{required:['network','editor.read'],optional:['files.write']}).permissions,['network'])
})
