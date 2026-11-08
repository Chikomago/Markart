import {test} from 'node:test'
import assert from 'node:assert/strict'
import {build} from 'esbuild'
const bundle=await build({entryPoints:['examples/plugins/ai-agent/secrets.ts'],bundle:true,write:false,format:'esm',platform:'node'})
const {migrateKey}=await import('data:text/javascript;base64,'+Buffer.from(bundle.outputFiles[0].text).toString('base64'))
test('migration verifies safe storage before deleting plaintext',async()=>{
 const events=[];let secret
 const api={secrets:{set:async(key,value)=>{events.push('set');secret=value},get:async()=>{events.push('get');return secret}},storage:{set:async(key,value)=>{events.push('persist');assert.equal('apiKey' in value,false);assert.equal(value.model,'model')}}}
 assert.equal(await migrateKey(api,{apiKey:'fake-key',model:'model'}),'fake-key');assert.deepEqual(events,['set','get','persist'])
})
test('failed credential write preserves old configuration',async()=>{
 let modified=false
 const api={secrets:{set:async()=>{throw new Error('locked')},get:async()=>null},storage:{set:async()=>{modified=true}}}
 await assert.rejects(migrateKey(api,{apiKey:'fake-key'}),/locked/);assert.equal(modified,false)
})
test('failed readback preserves plaintext for retry',async()=>{
 let modified=false
 const api={secrets:{set:async()=>{},get:async()=>null},storage:{set:async()=>{modified=true}}}
 await assert.rejects(migrateKey(api,{apiKey:'fake-key'}),/迁移未完成/);assert.equal(modified,false)
})
