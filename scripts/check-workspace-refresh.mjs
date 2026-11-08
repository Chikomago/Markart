import { build } from 'esbuild'
import assert from 'node:assert/strict'
import { mockIPC } from '@tauri-apps/api/mocks'
const result = await build({ stdin: { contents: "export { useLocalWorkspace } from './src/files/useLocalWorkspace'; export { ref } from 'vue'", resolveDir: process.cwd(), loader: 'ts' }, bundle: true, platform: 'node', format: 'esm', write: false })
const { useLocalWorkspace, ref } = await import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString('base64')}`)
globalThis.window = {}
let snapshot, barrier
mockIPC(async command => { assert.equal(command, 'refresh_workspace'); const value = snapshot; if (barrier) await barrier; return value })
const original = { id: 'a', relativePath: 'a.md', path: 'Folder/a.md', content: 'Unsaved text', loaded: true, version: 'v1' }
const docs = ref([original]), dirtyIds = ref(['a']), root = ref('/Folder'), directories = ref([]), tabs = ref(['a'])
const notices = []; const questions = []; let confirmations = 0
const workspace = useLocalWorkspace({ notify: text => notices.push(text), askFileAction: async title => { questions.push(title); confirmations++; return null }, isTauri: true, docs, dirtyIds, currentWorkspaceRoot: root, workspaceDirectories: directories, openTabs: tabs })
snapshot = { name: 'Folder', root: '/Folder', directories: ['sub'], files: [{ relativePath: 'a.md', updated: 2, excerpt: 'Disk' }, { relativePath: 'sub/b.md', updated: 2, excerpt: 'New' }] }
await workspace.refreshWorkspace()
assert.equal(docs.value[0].content, 'Unsaved text'); assert.equal(docs.value[0].version, 'v1'); assert.equal(docs.value[0].id, 'a')
assert.ok(docs.value.some(doc => doc.relativePath === 'sub/b.md')); assert.deepEqual(directories.value, ['sub'])
snapshot = { ...snapshot, files: [] }; await workspace.refreshWorkspace()
assert.equal(docs.value.length, 1); assert.equal(docs.value[0].temporary, true); assert.equal(docs.value[0].relativePath, undefined); assert.equal(docs.value[0].content, 'Unsaved text')
snapshot = { ...snapshot, files: [{ relativePath: 'a.md', updated: 3, excerpt: 'Recreated' }] }; await workspace.refreshWorkspace()
assert.equal(docs.value.length, 2); assert.notEqual(docs.value[0].id, 'a')
let release; barrier = new Promise(resolve => { release = resolve }); const pending = workspace.refreshWorkspace(); root.value = '/Other'; release(); await pending
assert.equal(docs.value.length, 2); assert.equal(root.value, '/Other')
console.log('PASS external file creation, deletion, recreation and folder switch preserve current editing')

// Deleting an unrelated file must reach confirmation even when another tab is dirty.
docs.value = [{ id: 'dirty', relativePath: 'draft.md', content: 'Unsaved' }, { id: 'clean', relativePath: 'other.md', content: 'Saved' }]; dirtyIds.value = ['dirty']
await workspace.manageItem('other.md', 'trash'); assert.equal(confirmations, 1); assert.equal(notices.length, 0)
await workspace.manageItem('draft.md', 'trash'); assert.equal(confirmations, 2); assert.equal(notices.length, 0); assert.ok(questions[1].includes('未保存的修改将丢弃'))
directories.value = ['notes']; docs.value[0].relativePath = 'notes/draft.md'
await workspace.manageItem('notes', 'trash'); assert.equal(confirmations, 3); assert.equal(notices.length, 0); assert.ok(questions[2].includes('未保存的修改将丢弃'))
await workspace.manageItem('note', 'trash'); assert.equal(confirmations, 4); assert.ok(!questions[3].includes('未保存的修改将丢弃'))
assert.equal(dirtyIds.value[0], 'dirty'); assert.equal(docs.value[0].content, 'Unsaved')
console.log('PASS deletion confirms discarding target edits, leaves unrelated edits intact, and cancellation changes nothing')
