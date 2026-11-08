import {build} from 'esbuild'
import {writeFileSync} from 'node:fs'
import assert from 'node:assert/strict'
import {mockIPC} from '@tauri-apps/api/mocks'
const bundled=await build({stdin:{contents:"export {useLocalWorkspace} from './src/files/useLocalWorkspace';export {ref,computed} from 'vue'",resolveDir:process.cwd(),loader:'ts'},bundle:true,platform:'node',format:'esm',write:false})
writeFileSync('/tmp/markart-create-with-drafts.mjs',bundled.outputFiles[0].text)
const {useLocalWorkspace,ref,computed}=await import('file:///tmp/markart-create-with-drafts.mjs')
globalThis.window={}
const draft={id:'draft',path:'Notes/old.md',relativePath:'old.md',content:'Unsaved edits',loaded:true,version:'old-version'}
const docs=ref([draft]),dirty=ref(['draft']),tabs=ref(['draft']),active=ref('draft'),notices=[],created=[]
let answer='new.md',questions=0
mockIPC((command,args)=>{
 if(command==='create_markdown'){created.push(args);return {root:'/Notes',name:'Notes',directories:[],files:[{relativePath:'old.md',updated:1,excerpt:''},...created.map(item=>({relativePath:item.relativePath,updated:2,excerpt:''}))]}}
 if(command==='create_folder')return {root:'/Notes',name:'Notes',directories:[args.relativePath],files:[{relativePath:'old.md',updated:1,excerpt:''},...created.map(item=>({relativePath:item.relativePath,updated:2,excerpt:''}))]}
 if(command==='read_document')return {content:created.find(item=>item.relativePath===args.relativePath)?.content||'',encoding:'UTF-8',version:'new-version'}
 if(command==='load_draft')return null
 throw Error('Unexpected command '+command)
})
const workspace=useLocalWorkspace({isTauri:true,docs,dirtyIds:dirty,activeId:active,activeDoc:computed(()=>docs.value.find(item=>item.id===active.value)),currentWorkspaceRoot:ref('/Notes'),currentDirectory:ref('Notes'),workspaceDirectories:ref([]),openTabs:tabs,folderExpanded:ref({}),mode:ref('wysiwyg'),selectedText:ref(''),showNewMenu:ref(true),askFileAction:async()=>{questions++;return answer},notify:text=>notices.push(text),closeHistory(){},clearScrollSync(){},recordRecentFile(){},getMarkdownMode:()=> 'wysiwyg',markDirty:id=>dirty.value.push(id)})
for(const template of [undefined,{id:'template',name:'1792609774',content:'# {{title}}'}]){
 await workspace.newDoc(template)
 assert.equal(notices.length,0,notices.join('; '))
 assert.equal(docs.value.find(item=>item.id==='draft')?.content,'Unsaved edits')
 assert.equal(docs.value.find(item=>item.id==='draft')?.version,'old-version')
 assert.deepEqual(dirty.value,['draft'])
 assert.ok(tabs.value.includes('draft'))
 assert.equal(docs.value.find(item=>item.id===active.value)?.relativePath,template?'1792609774.md':answer)
 answer='template.md'
}
assert.equal(created[1].content,'# 1792609774')
assert.equal(questions,1,'Template creation must skip the filename dialog')
await workspace.newDoc({id:'template',name:'1792609774',content:'# {{title}}'})
assert.equal(created.at(-1).relativePath,'1792609774 (2).md')
assert.equal(questions,1)
await workspace.newDoc({id:'timestamp',name:'{{timestamp}}',content:'# {{title}}'})
assert.match(created.at(-1).relativePath,/^\d{10}\.md$/)
assert.equal(questions,1)
const previousActive=active.value,previousTabs=[...tabs.value]
answer='sub';await workspace.newFolder()
assert.equal(active.value,previousActive);assert.deepEqual(tabs.value,previousTabs);assert.deepEqual(dirty.value,['draft'])
assert.equal(docs.value.find(item=>item.id==='draft')?.content,'Unsaved edits');assert.equal(notices.length,0)
console.log('PASS folder creation preserves active document and drafts')
console.log('PASS file and template creation preserve unsaved content, versions and tabs')
