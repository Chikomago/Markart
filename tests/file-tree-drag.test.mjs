import test from 'node:test'
import assert from 'node:assert/strict'
import { build } from 'esbuild'
const bundle=await build({stdin:{contents:"export { useFileTreeActions } from './files/useFileTreeActions'; export { ref } from 'vue'",resolveDir:process.cwd()+'/src',loader:'ts'},bundle:true,platform:'node',format:'esm',write:false})
const {useFileTreeActions,ref}=await import('data:text/javascript;base64,'+Buffer.from(bundle.outputFiles[0].text).toString('base64'))
function event(type,x=20,y=20){const e=new Event(type,{cancelable:true});Object.assign(e,{clientX:x,clientY:y,pointerId:1,button:0});return e}
function target(file,folder=''){
 const root={dataset:{folderTarget:folder},hasAttribute:attribute=>attribute==='data-folder-target'}
 const row={dataset:{filePath:file},hasAttribute:attribute=>attribute==='data-file-path'}
 return {closest(selector){return file && selector.includes('[data-file-path]')?row:root}}
}
async function drop(from,hit,switchRoot=false){
 const doc=new EventTarget();doc.elementFromPoint=()=>hit;globalThis.document=doc;globalThis.window={setTimeout}
 const calls=[],currentWorkspaceRoot=ref('/test')
 const actions=useFileTreeActions({isTauri:true,dirtyIds:ref([]),docs:ref([]),currentWorkspaceRoot,workspaceDirectories:ref([]),moveWithLinks:async(...args)=>calls.push(args),applyWorkspaceMove(){},manageItem:async()=>{},notify(){}})
 const start=event('pointerdown');Object.defineProperty(start,'currentTarget',{value:{setPointerCapture(){}}});actions.startFileDrag(start,from)
 if(switchRoot)currentWorkspaceRoot.value='/other'
 doc.dispatchEvent(event('pointermove',40,40));doc.dispatchEvent(event('pointerup',40,40));await Promise.resolve()
 return calls
}
test('releasing on the source or sibling in its folder does not move to root',async()=>{
 assert.deepEqual(await drop('notes/a.md',target('notes/a.md')),[])
 assert.deepEqual(await drop('notes/a.md',target('notes/b.md')),[])
 assert.deepEqual(await drop('notes/a.md',target(null,'notes')),[])
})
test('releasing on a different folder or root moves once to the intended path',async()=>{
 assert.deepEqual(await drop('notes/a.md',target(null,'archive')),[['notes/a.md','archive/a.md']])
 assert.deepEqual(await drop('notes/a.md',target('archive/b.md')),[['notes/a.md','archive/a.md']])
 assert.deepEqual(await drop('notes/a.md',target(null,'')),[['notes/a.md','a.md']])
 assert.deepEqual(await drop('a.md',target(null,'')),[])
 assert.deepEqual(await drop('notes/a.md',null),[])
})

test('a directory change during drag never moves a same-name file in the new directory',async()=>{assert.deepEqual(await drop('notes/a.md',target(null,'archive'),true),[])})
