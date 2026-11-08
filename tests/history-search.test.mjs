import test from 'node:test'
import assert from 'node:assert/strict'
import { build } from 'esbuild'
const bundle = await build({
  stdin: { contents: "export {useGitHistory} from './sync/useGitHistory'; export {ref, computed, nextTick, effectScope} from 'vue'", resolveDir: process.cwd() + '/src', loader: 'ts' },
  bundle: true, platform: 'node', format: 'esm', write: false,
  plugins: [{ name: 'native-fixture', setup(builder) { builder.onResolve({ filter: /^@tauri-apps\/api\/core$/ }, () => ({ path: 'native', namespace: 'fixture' })); builder.onLoad({ filter: /.*/, namespace: 'fixture' }, () => ({ contents: 'export const invoke = (...args) => globalThis.historyInvoke(...args)' })) } }]
})
const { useGitHistory, ref, computed, nextTick, effectScope } = await import(`data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString('base64')}`)
test('top search filters all versions by changed content and reuses cached diffs for scope changes', async () => {
  const diffs = { a: '@@ -1 +1 @@\n-old apple\n+new pear', b: '@@ -1 +1 @@\n-old pear\n+new apple', c: '@@ -1 +1 @@\n apple unchanged' }
  let requests = 0
  globalThis.historyInvoke = async (command, args) => {
    if (command === 'list_git_versions') return Object.keys(diffs).map(id => ({ id, created: 0 }))
    requests++
    return diffs[args.id]
  }
  const scope = effectScope()
  try {
    const history = scope.run(() => useGitHistory({ isTauri: true, activeDoc: computed(() => ({ relativePath: 'file.md', content: 'current' })), dirtyIds: ref([]), conflictedIds: ref([]), gitEnabled: computed(() => true), gitMaxVersions: computed(() => 10), gitRetentionDays: computed(() => 30), notify: message => assert.fail(message) }))
    await history.openHistory()
    history.historySearch.value = 'apple'
    await nextTick(); await new Promise(resolve => setTimeout(resolve, 190))
    assert.deepEqual(history.filteredHistoryVersions.value.map(item => item.id), ['a', 'b'])
    assert.equal(requests, 3)
    history.historySearchScope.value = 'removed'
    await nextTick()
    assert.deepEqual(history.filteredHistoryVersions.value.map(item => item.id), ['a'])
    history.historySearchScope.value = 'added'
    await nextTick(); await new Promise(resolve => setTimeout(resolve, 190))
    assert.deepEqual(history.filteredHistoryVersions.value.map(item => item.id), ['b'])
    assert.equal(requests, 3)
    history.historySearch.value = ''; history.historySearchScope.value = 'all'
    await nextTick()
    assert.equal(history.filteredHistoryVersions.value.length, 3)
  } finally { scope.stop(); delete globalThis.historyInvoke }
})

test('history initialization does not read the controller document before it exists', () => {
  const errors = []
  const warn = console.warn
  console.warn = (...args) => { errors.push(args.join(' ')) }
  const scope = effectScope()
  try {
    scope.run(() => {
      useGitHistory({ isTauri: false, activeDoc: computed(() => activeDoc.value), dirtyIds: ref([]), conflictedIds: ref([]), gitEnabled: computed(() => true), gitMaxVersions: computed(() => 10), gitRetentionDays: computed(() => 30), notify: () => {} })
      const activeDoc = ref({ relativePath: 'file.md', content: 'current' })
    })
    assert.deepEqual(errors, [])
  } finally { scope.stop(); console.warn = warn }
})
