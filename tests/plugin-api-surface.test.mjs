import {test} from 'node:test'
import assert from 'node:assert/strict'
import {readFile} from 'node:fs/promises'
import ts from 'typescript'
const sdk=ts.createSourceFile('sdk.ts',await readFile('src/plugins/sdk/index.ts','utf8'),ts.ScriptTarget.Latest,true)
const bridge=await readFile('src/plugins/host/bridge.ts','utf8')
const api=sdk.statements.find(node=>ts.isInterfaceDeclaration(node)&&node.name.text==='PluginAPI')
function methods(members,prefix=''){
 const names=[]
 for(const member of members){
  const name=member.name?.getText(sdk).replace(/["']/g,'');if(!name)continue
  const path=prefix?prefix+'.'+name:name
  if(ts.isMethodSignature(member)||member.type&&ts.isFunctionTypeNode(member.type))names.push(path)
  else if(member.type&&ts.isTypeLiteralNode(member.type))names.push(...methods(member.type.members,path))
 }
 return names
}
const declared=methods(api.members)
const implemented=new Set([...bridge.matchAll(/case "([^"]+)"/g)].map(match=>match[1]))
for(const [prefix,pattern]of [['files',/const allowed = \[([\s\S]*?)\];/],['index',/!\[([\s\S]*?)\]\.includes\(operation\)/]]){
 const fragment=bridge.slice(bridge.indexOf(`if (method.startsWith("${prefix}."))`));const match=fragment.match(pattern);assert.ok(match,prefix)
 for(const item of match[1].matchAll(/"([^"]+)"/g))implemented.add(prefix+'.'+item[1])
}
test('public PluginAPI methods have host routes',()=>{
 assert.deepEqual(declared.filter(path=>!implemented.has(path)),[])
})
test('host routes are declared in PluginAPI',()=>{
 assert.deepEqual([...implemented].filter(path=>!declared.includes(path)),[])
})
