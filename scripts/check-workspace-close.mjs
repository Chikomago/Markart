import { build } from 'esbuild'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
const directory = mkdtempSync(join(tmpdir(), 'markart-close-'))
try {
  const output = join(directory, 'check.mjs')
  await build({ stdin: { resolveDir: process.cwd() + '/src', loader: 'ts', contents: `
    import { ref, computed } from 'vue'
    import { useLocalWorkspace } from './files/useLocalWorkspace'
    const document = { id: 'a', path: 'Notes/a.md', relativePath: 'a.md', content: 'unchanged', loaded: true }
    const docs = ref([document]), dirtyIds = ref(['a']), root = ref('/Notes'), tabs = ref(['a']), activeId = ref('a'), directory = ref('Notes')
    let notices = []
    const noop = () => {}
    const workspace = useLocalWorkspace({ isTauri: false, docs, dirtyIds, activeId, activeDoc: computed(() => docs.value[0]), activeKind: computed(() => 'markdown'), content: computed({get:()=>docs.value[0]?.content || '', set:noop}), currentWorkspaceRoot: root, currentDirectory: directory, workspaceDirectories: ref(['assets']), openTabs: tabs, folderExpanded: ref({assets:true}), folderInput: ref(null), nativeRecentDirs:ref([]),recentFiles:ref([]),mode:ref('source'),selectedText:ref(''),showNewMenu:ref(true),getTabPaths:()=>[],getMarkdownMode:()=> 'source',resetHistoryForWorkspace:noop,closeHistory:noop,clearScrollSync:noop,resetConflicts:noop,reportConflict:noop,recordRecentFile:noop,markDirty:noop,askFileAction:async()=>null,moveWithLinks:async()=>{},notify:message=>notices.push(message) })
    if (await workspace.closeWorkspace() || root.value !== '/Notes' || docs.value.length !== 1) throw Error('Unsaved document protection failed')
    dirtyIds.value = []
    if (!await workspace.closeWorkspace() || root.value || docs.value.length || tabs.value.length || activeId.value) throw Error('Folder state not cleared')
    if (document.content !== 'unchanged' || directory.value !== '未打开文件夹') throw Error('Document changed or empty state missing')
    console.log('PASS close folder clears workspace; unsaved edits protected; document content unchanged')
  ` }, bundle: true, platform: 'node', format: 'esm', outfile: output })
  await import(output)
} finally { rmSync(directory, { recursive: true, force: true }) }
