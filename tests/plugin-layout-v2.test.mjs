import test from 'node:test'
import assert from 'node:assert/strict'
import {build} from 'esbuild'
import {mkdtempSync,writeFileSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
const dir=mkdtempSync(join(tmpdir(),'markart-panel-test-')),output=join(dir,'layout.mjs')
await build({entryPoints:['src/plugins/ui/sidebarLayout.ts'],bundle:true,platform:'node',format:'esm',outfile:output})
const {SidebarLayout,filesView,outlineView}=await import(output)
function storage(){const values=new Map();return {getItem:key=>values.get(key)||null,setItem:(key,value)=>values.set(key,value)}}
test('panel instances move across all groups without changing identity or state',()=>{
 const disk=storage(),layout=new SidebarLayout(disk),groups=layout.state.groups
 layout.close(Object.values(layout.state.items).find(item=>item.viewId===filesView).id)
 const item=layout.open('demo:graph',{state:{query:'hello'}}),id=item.id
 for(const group of groups){layout.move(id,group.id);assert.equal(layout.item(id).groupId,group.id);assert.equal(layout.group(group.id).active,id);assert.deepEqual(layout.item(id).state,{query:'hello'})}
 const restored=new SidebarLayout(disk);assert.equal(restored.item(id).groupId,groups[3].id);assert.deepEqual(restored.item(id).state,{query:'hello'})
})
test('single-instance open reveals existing location; multiple instances remain independent',()=>{
 const layout=new SidebarLayout(),group=layout.state.groups[2],first=layout.open('demo:one',{groupId:group.id})
 assert.equal(layout.open('demo:one').id,first.id);assert.equal(first.groupId,group.id)
 const second=layout.open('demo:one',{multiple:true});assert.notEqual(first.id,second.id)
 layout.close(first.id);assert.throws(()=>layout.item(first.id));assert.equal(layout.item(second.id).viewId,'demo:one')
})
test('empty groups keep their identity and saved split ratio',()=>{
 const layout=new SidebarLayout(),group=layout.state.groups[1],outline=Object.values(layout.state.items).find(item=>item.viewId===outlineView)
 layout.setRatio('left',.72);layout.close(outline.id);assert.deepEqual(layout.group(group.id).items,[])
 layout.open(outlineView,{groupId:group.id});assert.equal(layout.state.ratios.left,.72);assert.equal(layout.group(group.id).items.length,1)
 assert.throws(()=>layout.move(Object.keys(layout.state.items)[0],'made-up-container'))
})

test('closing and reopening restores the user-selected group across sessions',()=>{
 const disk=storage(),layout=new SidebarLayout(disk),target=layout.state.groups[3]
 const item=layout.open('demo:remember');layout.move(item.id,target.id);layout.close(item.id)
 const restored=new SidebarLayout(disk),reopened=restored.open('demo:remember')
 assert.equal(reopened.groupId,target.id);assert.notEqual(reopened.id,item.id)
})

test('drag placement reorders and persists instances without losing their state',()=>{
 const disk=storage(),layout=new SidebarLayout(disk),group=layout.state.groups[2],other=layout.state.groups[3]
 const a=layout.open('demo:a',{groupId:group.id,state:{value:'kept'}}),b=layout.open('demo:b',{groupId:group.id}),c=layout.open('demo:c',{groupId:group.id})
 layout.place(c.id,group.id,a.id);assert.deepEqual(group.items,[c.id,a.id,b.id])
 layout.place(a.id,other.id);assert.deepEqual(group.items,[c.id,b.id]);assert.deepEqual(layout.item(a.id).state,{value:'kept'})
 layout.place(c.id,group.id);assert.deepEqual(group.items,[b.id,c.id])
 const restored=new SidebarLayout(disk);assert.deepEqual(restored.group(group.id).items,[b.id,c.id]);assert.equal(restored.item(a.id).groupId,other.id)
})
test('invalid drag targets never detach a sidebar item',()=>{
 const layout=new SidebarLayout(),group=layout.state.groups[2],item=layout.open('demo:drag',{groupId:group.id})
 assert.throws(()=>layout.place(item.id,'missing'));assert.deepEqual(group.items,[item.id])
 assert.throws(()=>layout.place(item.id,group.id,'missing'));assert.deepEqual(group.items,[item.id])
 layout.place(item.id,group.id,item.id);assert.deepEqual(group.items,[item.id])
})

test('files occupy a group exclusively for open, move and drag placement',()=>{
 const layout=new SidebarLayout(),files=Object.values(layout.state.items).find(item=>item.viewId===filesView),fileGroup=files.groupId,other=layout.state.groups[2]
 const panel=layout.open('demo:exclusive',{groupId:other.id})
 for(const operation of [()=>layout.open('demo:new',{groupId:fileGroup}),()=>layout.move(panel.id,fileGroup),()=>layout.place(panel.id,fileGroup),()=>layout.move(files.id,other.id),()=>layout.place(files.id,other.id)])assert.throws(operation,error=>error.code==='invalid-argument')
 assert.deepEqual(layout.group(fileGroup).items,[files.id]);assert.equal(layout.item(panel.id).groupId,other.id)
 const empty=layout.state.groups[3];layout.move(files.id,empty.id)
 assert.equal(layout.item(files.id).groupId,empty.id);layout.move(panel.id,fileGroup);assert.equal(layout.item(panel.id).groupId,fileGroup)
})

test('automatic placement finds another group when the default contains files',()=>{
 const layout=new SidebarLayout(),files=Object.values(layout.state.items).find(item=>item.viewId===filesView),group=layout.state.groups[2]
 layout.move(files.id,group.id);const panel=layout.open('demo:auto')
 assert.notEqual(panel.groupId,group.id);assert.deepEqual(group.items,[files.id])
})

test('view default placement applies only before a user location exists',()=>{
 const disk=storage(),layout=new SidebarLayout(disk)
 const first=layout.open('demo:default',{defaultPlacement:'right-bottom'})
 assert.equal(layout.group(first.groupId).slot,'right-bottom')
 const target=layout.state.groups.find(group=>group.slot==='left-bottom')
 layout.move(first.id,target.id)
 assert.equal(layout.open('demo:default',{defaultPlacement:'right-top'}).groupId,target.id)
 layout.close(first.id)
 const restored=new SidebarLayout(disk)
 assert.equal(restored.open('demo:default',{defaultPlacement:'right-top'}).groupId,target.id)
})
test('explicit group selection overrides default placement and occupied defaults fall back',()=>{
 const layout=new SidebarLayout(),target=layout.state.groups.find(group=>group.slot==='right-bottom')
 assert.equal(layout.open('demo:explicit',{groupId:target.id,defaultPlacement:'left-bottom'}).groupId,target.id)
 const item=layout.open('demo:blocked',{defaultPlacement:'left-top'})
 assert.notEqual(layout.group(item.groupId).slot,'left-top')
 assert.throws(()=>layout.open('demo:invalid',{defaultPlacement:'missing'}),error=>error.code==='invalid-argument')
})
