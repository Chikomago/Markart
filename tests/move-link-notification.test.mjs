import test from 'node:test'
import assert from 'node:assert/strict'
import { build } from 'esbuild'
const result = await build({entryPoints:['src/files/moveGuard.ts'],bundle:true,platform:'node',format:'esm',write:false})
const {externalMoveLinkCount}=await import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64'))
const changed=(relativePath,count)=>({relativePath,changes:Array.from({length:count},()=>({before:'old',after:'new'}))})
test('moving an unreferenced file does not count rebasing its own outgoing links',()=>{
 assert.equal(externalMoveLinkCount('notes/a.md',[changed('notes/a.md',12)]),0)
})
test('counts only links updated in files outside the moved item',()=>{
 assert.equal(externalMoveLinkCount('notes/a.md',[changed('notes/a.md',12),changed('index.md',2),changed('notes/b.md',1)]),3)
})
test('moving a folder excludes its internal files but includes similarly named siblings',()=>{
 assert.equal(externalMoveLinkCount('notes',[changed('notes/a.md',5),changed('notes/sub/b.md',4),changed('notes-other/index.md',2)]),2)
 assert.equal(externalMoveLinkCount('a.md',[]),0)
})
