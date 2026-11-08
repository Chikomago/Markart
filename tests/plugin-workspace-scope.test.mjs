import test from 'node:test'
import assert from 'node:assert/strict'
import {build} from 'esbuild'
const result=await build({entryPoints:['src/plugins/host/workspaceScope.ts'],bundle:true,platform:'node',format:'esm',write:false})
const {requireWorkspaceRoot}=await import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString('base64')}`)
test('directory access follows current folder and open tabs without a stored grant list',()=>{
 let root='/A';const docs=[{id:'one',root:'/B'}],host={workspace:{root:()=>root},documents:{list:()=>docs}}
 assert.doesNotThrow(()=>requireWorkspaceRoot(host,'/A'));assert.doesNotThrow(()=>requireWorkspaceRoot(host,'/B'))
 assert.throws(()=>requireWorkspaceRoot(host,'/outside'),error=>error.code==='permission-denied')
 root='/C';assert.doesNotThrow(()=>requireWorkspaceRoot(host,'/C'));assert.throws(()=>requireWorkspaceRoot(host,'/A'))
 docs.length=0;assert.throws(()=>requireWorkspaceRoot(host,'/B'));assert.throws(()=>requireWorkspaceRoot(host,''))
})
