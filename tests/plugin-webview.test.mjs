import {test} from 'node:test'
import assert from 'node:assert/strict'
import {build} from 'esbuild'
const result=await build({entryPoints:['src/plugins/webview/content.ts'],bundle:true,write:false,format:'esm',platform:'node'})
const {resourcePath,webDocument}=await import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64'))
test('webview entry paths stay inside plugin package',()=>{
 assert.equal(resourcePath('views/index.html'),'views/index.html')
 for(const path of ['../secret','views/../secret','/etc/passwd','https://example.com','views\\index.html','views//x','views/x?foo',''])assert.throws(()=>resourcePath(path))
})
test('missing and non-html entries are rejected before rendering',()=>{
 assert.throws(()=>webDocument('views/missing.html',{}),/HTML/)
 assert.throws(()=>webDocument('views/main.js',{'views/main.js':[]}),/HTML/)
})

const boundsBundle=await build({entryPoints:['src/plugins/webview/bounds.ts'],bundle:true,write:false,format:'esm',platform:'node'})
const {contentBoundsRequest}=await import('data:text/javascript;base64,'+Buffer.from(boundsBundle.outputFiles[0].text).toString('base64'))
test('expand restores configured height even with stale iframe dimensions',()=>{
 assert.deepEqual(contentBoundsRequest({expanded:true,top:0,bottom:560}),{height:0,expanded:true})
 assert.deepEqual(contentBoundsRequest({expanded:false,top:420,bottom:560}),{height:140,expanded:false})
 assert.equal(contentBoundsRequest({expanded:false,top:-10,bottom:560}),null)
})
test('injected webview bridge script remains valid JavaScript',async()=>{
 const {readFile}=await import('node:fs/promises')
 const source=await readFile('src/plugins/webview/content.ts','utf8')
 const script=source.match(/bridge\.textContent\s*=\s*`([^`]+)`/)
 assert.ok(script)
 assert.doesNotThrow(()=>new Function(script[1].replaceAll("${JSON.stringify(focusToken||'')}",JSON.stringify('test-focus-token'))))
})
