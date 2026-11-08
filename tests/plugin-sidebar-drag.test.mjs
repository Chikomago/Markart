import test from 'node:test'
import assert from 'node:assert/strict'
import { build } from 'esbuild'
const result = await build({ stdin: { contents: "export * from './plugins/sidebarDrag'; export { PluginSidebarState } from './plugins/sidebarState'", resolveDir: process.cwd() + '/src', loader: 'ts' }, bundle: true, platform: 'node', format: 'esm', write: false })
const { startSidebarPointerDrag, sidebarDropTarget, PluginSidebarState } = await import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString('base64')}`)
function pointer(type,x,y,id=1) { const event=new Event(type,{cancelable:true});Object.assign(event,{clientX:x,clientY:y,pointerId:id,button:0});return event }
test('pointer drag works without native drag events or DataTransfer and cancels click-sized movement',()=>{
 const target=new EventTarget(),seen=[]
 const start=()=>startSidebarPointerDrag(pointer('pointerdown',0,0),{start(){seen.push('start')},move(p){seen.push(['move',p.x,p.y])},drop(p){seen.push(['drop',p.x,p.y])},end(){seen.push('end')}},target)
 start();target.dispatchEvent(pointer('pointermove',2,1));target.dispatchEvent(pointer('pointerup',2,1));assert.deepEqual(seen,['end'])
 seen.length=0;start();target.dispatchEvent(pointer('pointermove',40,20,2));assert.deepEqual(seen,[])
 target.dispatchEvent(pointer('pointermove',40,20));target.dispatchEvent(pointer('pointerup',80,60));assert.deepEqual(seen,['start',['move',40,20],['drop',80,60],'end'])
 target.dispatchEvent(pointer('pointerup',80,60));assert.equal(seen.length,4)
})
test('Escape, lost window focus and pointer cancellation cancel instead of dropping',()=>{
 for(const kind of ['keydown','blur','pointercancel']){
  const target=new EventTarget();let dropped=0,ended=0
  startSidebarPointerDrag(pointer('pointerdown',0,0),{start(){},move(){},drop(){dropped++},end(){ended++}},target)
  target.dispatchEvent(pointer('pointermove',10,10));const cancel=kind==='pointercancel'?pointer(kind,10,10):new Event(kind);if(kind==='keydown')Object.assign(cancel,{key:'Escape'});target.dispatchEvent(cancel);target.dispatchEvent(pointer('pointerup',20,20));assert.equal(dropped,0);assert.equal(ended,1)
 }
})
test('drop targets choose insertion before midpoint, exclude moving block, and reject outside',()=>{
 const bounds={left:100,right:300,top:0,bottom:400}
 const blocks=[{id:'a',top:0,bottom:200},{id:'b',top:207,bottom:400}]
 assert.deepEqual(sidebarDropTarget({x:150,y:50},bounds,blocks),{before:'a',line:0})
 assert.deepEqual(sidebarDropTarget({x:150,y:350},bounds,blocks),{before:undefined,line:400})
 assert.deepEqual(sidebarDropTarget({x:150,y:250},bounds,blocks,'b'),{before:undefined,line:200})
 assert.equal(sidebarDropTarget({x:50,y:50},bounds,blocks),null)
})
test('insert and reorder persist without duplicates; moving to itself is a no-op',()=>{
 const values=new Map(),disk={getItem:k=>values.get(k)||null,setItem:(k,v)=>values.set(k,v)}
 const state=new PluginSidebarState(disk);state.add(['a','b']);state.add(['c','d'],'b');assert.deepEqual(state.state.selected,['a','c','d','b'])
 state.move('b','a');assert.deepEqual(state.state.selected,['b','a','c','d']);state.move('b');assert.deepEqual(state.state.selected,['a','c','d','b'])
 state.move('c','c');assert.deepEqual(state.state.selected,['a','c','d','b']);state.add(['a','e'],'d');assert.deepEqual(state.state.selected,['a','c','e','d','b'])
 assert.deepEqual(new PluginSidebarState(disk).state.selected,state.state.selected)
})
