import { build } from 'esbuild'
import assert from 'node:assert/strict'
import { mockIPC, clearMocks } from '@tauri-apps/api/mocks'
const bundle = await build({ stdin: { contents: "export { useDocumentSafety } from './src/files/useDocumentSafety'; export { ref, computed, effectScope, nextTick } from 'vue'", resolveDir: process.cwd(), loader: 'ts' }, bundle: true, platform: 'node', format: 'esm', write: false })
const { useDocumentSafety, ref, computed, effectScope, nextTick } = await import(`data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString('base64')}`)
globalThis.window = { addEventListener() {}, removeEventListener() {} }
const stored = new Map()
globalThis.localStorage = { get length() { return stored.size }, key: index => [...stored.keys()][index] ?? null, getItem: key => stored.get(key) ?? null, setItem: (key, value) => stored.set(key, value), removeItem: key => stored.delete(key) }
let disk, readBarrier, notices = []
mockIPC(async command => {
  if (command === 'inspect_document') return { ...disk }
  if (command === 'read_document') { if (readBarrier) await readBarrier; disk.changed = false; return { content: disk.content, version: 'v2', encoding: 'UTF-8' } }
  if (['clear_draft', 'write_draft'].includes(command)) return
  throw Error(command)
})
function setup(policy = 'auto', dirty = false) {
  disk = { changed: true, missing: false, content: 'Disk update' }; notices = []; readBarrier = null
  const doc = { id: 'doc', path: 'Note.md', relativePath: 'Note.md', content: dirty ? 'Unsaved local edit' : 'Original', diskContent: 'Original', loaded: true, version: 'v1', updated: 0 }
  const docs = ref([doc]), dirtyIds = ref(dirty ? ['doc'] : []), tabs = ref(['doc']), scope = effectScope(), root = ref('')
  const safety = scope.run(() => useDocumentSafety({ isTauri: true, docs, dirtyIds, activeDoc: computed(() => docs.value[0]), activeId: ref('doc'), currentWorkspaceRoot: root, externalFileChanges: ref(policy), openTabs: tabs, gitEnabled: computed(() => false), gitMaxVersions: computed(() => 20), gitRetentionDays: computed(() => 30), lastGitFailure: ref(''), notify: value => notices.push(value), scheduleWebdavSync() {}, scheduleGithubSync() {}, saveTemporaryDoc: async () => false, persist() {} }))
  return { safety, docs, dirtyIds, tabs, scope, root }
}
{
  const test = setup(); await test.safety.inspectActiveDocument()
  assert.equal(test.docs.value[0].content, 'Disk update'); assert.equal(test.docs.value[0].version, 'v2'); assert.equal(test.safety.conflict.value, null)
  test.scope.stop()
}
{
  stored.clear(); const test = setup('auto', true); await test.safety.inspectActiveDocument(); await nextTick()
  assert.equal(test.docs.value[0].content, 'Disk update')
  const backup = test.docs.value.find(doc => doc.temporary)
  assert.equal(backup.content, 'Unsaved local edit'); assert.ok(test.dirtyIds.value.includes(backup.id) && test.tabs.value.includes(backup.id)); assert.ok([...stored.values()].some(value => value.includes('Unsaved local edit')))
  assert.equal(test.safety.conflict.value, null); test.scope.stop()
}
{
  const test = setup(); test.safety.restoreExternalDrafts()
  assert.ok(test.docs.value.some(doc => doc.temporary && doc.content === 'Unsaved local edit'))
  test.scope.stop()
}
{
  const test = setup('auto', true), originalSet = localStorage.setItem
  localStorage.setItem = () => { throw Error('storage full') }
  await test.safety.inspectActiveDocument()
  assert.equal(test.docs.value[0].content, 'Unsaved local edit'); assert.ok(test.safety.conflict.value)
  localStorage.setItem = originalSet; test.scope.stop()
}
{
  const test = setup('confirm', true); await test.safety.inspectActiveDocument()
  assert.equal(test.docs.value[0].content, 'Unsaved local edit'); assert.ok(test.safety.conflict.value); assert.equal('comparing' in test.safety.conflict.value, false)
  test.safety.keepCurrentEditing(); await test.safety.inspectActiveDocument(); assert.equal(test.safety.conflict.value, null)
  disk.content = 'Another update'; await test.safety.inspectActiveDocument(); assert.ok(test.safety.conflict.value)
  await test.safety.reloadAfterConflict(); assert.equal(test.docs.value[0].content, 'Another update'); test.scope.stop()
}
{
  const test = setup(); let release
  readBarrier = new Promise(resolve => { release = resolve })
  const pending = test.safety.inspectActiveDocument(); await Promise.resolve(); await Promise.resolve(); test.root.value = '/different-workspace'; release(); await pending
  assert.equal(test.docs.value[0].content, 'Original'); test.scope.stop()
}
clearMocks()
assert.equal(notices.length, 0, notices.join('\n'))
console.log('PASS external auto reload, unsaved recovery copy, confirm/ignore/reconfirm, version refresh and workspace race protection')
