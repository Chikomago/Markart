import test from 'node:test'
import assert from 'node:assert/strict'
import {build} from 'esbuild'
const result=await build({entryPoints:['src/files/documentIdentity.ts'],bundle:true,platform:'node',format:'esm',write:false})
const {pathIdentity,relativeToRoot}=await import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64'))
test('native Windows paths match stored directory-qualified tab identities',()=>{
 assert.equal(pathIdentity('C:\\Notes\\NOTE.md'),pathIdentity('\\\\?\\C:\\Notes/NOTE.md'))
 assert.equal(relativeToRoot('C:\\Notes\\Sub\\Note.md','\\\\?\\C:\\Notes'),'Sub/Note.md')
 assert.equal(relativeToRoot('C:\\NotesExtra\\a.md','C:\\Notes'),null)
 assert.notEqual(pathIdentity('/Notes/A.md'),pathIdentity('/Notes/a.md'))
})
