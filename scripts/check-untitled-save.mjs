import { build } from 'esbuild'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
const directory = mkdtempSync(join(tmpdir(), 'markart-untitled-'))
try {
  const output = join(directory, 'check.mjs')
  await build({ stdin: { resolveDir: process.cwd() + '/src', loader: 'ts', contents: `
    import { ref, computed } from 'vue'
    import { useLocalWorkspace } from './files/useLocalWorkspace'
    import { createUntitledDocument } from './documents/untitledDocument'
    import { fileKind } from './files/fileFormats'
    import { settingRegistry } from './settings/settings'
    if (fileKind('a.docx') !== 'convertible' || fileKind('a.pdf') !== 'convertible' || ['rtf','ppt','pptx','xls','xlsx','csv'].some(ext=>fileKind('a.'+ext) !== 'unsupported')) throw Error('Unexpected conversion format')
    if (['config.yaml','config.yml','CONFIG.YAML'].some(path=>fileKind(path)!=='text')) throw Error('YAML must open as plain text')
    const first = createUntitledDocument()
    if (first.content || !first.loaded || !first.temporary || first.relativePath || settingRegistry.startupBehavior.default !== 'blank') throw Error('Startup document is not editable and unsaved')
    first.content = 'A new document'
    const docs = ref([first]), dirtyIds = ref([first.id]), activeId = ref(first.id), root = ref(''), tabs = ref([first.id])
    const activeDoc = computed(()=>docs.value.find(doc=>doc.id===activeId.value)), noop=()=>{}
    const workspace = useLocalWorkspace({ isTauri:true,docs,dirtyIds,activeId,activeDoc,activeKind:computed(()=>'markdown'),content:computed({get:()=>activeDoc.value?.content||'',set:noop}),currentWorkspaceRoot:root,currentDirectory:ref('未打开目录'),workspaceDirectories:ref([]),openTabs:tabs,folderExpanded:ref({}),folderInput:ref(null),nativeRecentDirs:ref([]),recentFiles:ref([]),mode:ref('wysiwyg'),selectedText:ref(''),showNewMenu:ref(false),getTabPaths:()=>[],getMarkdownMode:()=> 'wysiwyg',resetHistoryForWorkspace:noop,closeHistory:noop,clearScrollSync:noop,resetConflicts:noop,reportConflict:noop,recordRecentFile:noop,markDirty:noop,askFileAction:async()=>null,moveWithLinks:async()=>{},notify:noop})
    globalThis.cancelSave=true
    if (await workspace.saveAs() || docs.value[0].content!=='A new document' || root.value) throw Error('Cancel loses draft')
    globalThis.cancelSave=false
    if (!await workspace.saveAs()) throw Error('First save failed')
    await new Promise(resolve=>setTimeout(resolve,0))
    if(root.value!=='/Notes' || activeDoc.value?.relativePath!=='new.md' || activeDoc.value?.content!=='A new document' || dirtyIds.value.length) throw Error('Saved folder/document not opened')
    const saves = globalThis.saveCalls
    workspace.applyWorkspace({ name:'Notes',root:'/Notes',directories:[],files:[{relativePath:'source.docx',updated:1,excerpt:''}] },'source.docx')
    await new Promise(resolve=>setTimeout(resolve,0))
    if (!activeDoc.value?.temporary || activeDoc.value?.relativePath || activeDoc.value?.content!=='Converted document' || globalThis.saveCalls!==saves) throw Error('Conversion must remain a temporary document until save')
    console.log('PASS editable untitled startup; cancelled save retains draft; save opens parent directory; conversion stays temporary')
  ` }, plugins: [{name:'native-save-dialog',setup(build){build.onResolve({filter:/^@tauri-apps\/api\/core$/},()=>({path:'native',namespace:'mock'}));build.onLoad({filter:/.*/,namespace:'mock'},()=>({contents:`export async function invoke(command,args){if(command==='convert_workspace_document')return {text:'Converted document'};if(command==='save_document_as'){globalThis.saveCalls=(globalThis.saveCalls||0)+1;if(globalThis.cancelSave)return null;if(args.content!=='A new document'||!args.markdownOnly)throw Error('Wrong save payload');return {workspace:{name:'Notes',root:'/Notes',directories:[],files:[{relativePath:'new.md',updated:1,excerpt:''}]},relativePath:'new.md'}}if(command==='read_document')return {content:'A new document',version:'v1',encoding:'UTF-8'};if(command==='load_draft')return null;if(command==='list_recent_workspaces')return ['/Notes'];throw Error(command)}` ,loader:'js'}))}}],bundle:true,platform:'node',format:'esm',outfile:output})
  await import(output)
} finally { rmSync(directory, { recursive:true,force:true }) }
