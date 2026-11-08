import test from 'node:test'
import assert from 'node:assert/strict'
import { build } from 'esbuild'

const bundle = await build({ entryPoints: ['src/settings/settings.ts'], bundle: true, platform: 'node', format: 'esm', write: false })
const { SettingsStore, SETTINGS_KEY, SETTINGS_VERSION } = await import(`data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString('base64')}`)
function memory(initial = {}) {
  const data = new Map(Object.entries(initial))
  return { getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, value), data }
}

test('原型偏好迁移为全局设置，重启后保持', () => {
  const storage = memory()
  const first = new SettingsStore(storage, { fontSize: 20, themeName: '深夜' })
  assert.equal(first.get('fontSize'), 20)
  assert.equal(first.set('fontSize', 21), true)
  const next = new SettingsStore(storage)
  assert.equal(next.get('fontSize'), 21)
  next.resetAll()
  assert.equal(next.get('fontSize'), 17)
})

test('上一版目录覆盖不迁入新的全局配置', () => {
  const storage = memory({ 'markart-settings-v1': JSON.stringify({ version: 1, global: { fontSize: 18 }, workspaces: { '/tmp/book': { fontSize: 22 } } }) })
  const settings = new SettingsStore(storage)
  assert.equal(settings.get('fontSize'), 18)
  assert.deepEqual(JSON.parse(storage.getItem(SETTINGS_KEY)), { version: SETTINGS_VERSION, global: { fontSize: 18 } })
})

test('旧自动备份偏好迁移时不会自动开启新的保存历史', () => {
  const storage = memory({ 'markart-settings-v4': JSON.stringify({ version: 4, global: { autoBackup: true, backupKeepCount: 50, fontSize: 19 } }) })
  const settings = new SettingsStore(storage)
  assert.equal(settings.get('gitEnabled'), false)
  assert.equal(settings.get('gitMaxVersions'), 20)
  assert.equal(settings.get('fontSize'), 19)
  assert.equal('autoBackup' in JSON.parse(settings.exportSnapshot()).global, false)
  assert.equal('backupKeepCount' in JSON.parse(settings.exportSnapshot()).global, false)
})

test('坏配置保留恢复副本并回到安全默认值', () => {
  const storage = memory({ [SETTINGS_KEY]: '{broken' })
  const settings = new SettingsStore(storage)
  assert.equal(settings.recovered, true)
  assert.equal(settings.get('fontSize'), 17)
  assert.equal(storage.getItem(`${SETTINGS_KEY}-recovery`), '{broken')
  assert.equal(settings.set('fontSize', 900), false)
  assert.equal(settings.get('fontSize'), 17)
})

test('无效图标列表和附件目录不能覆盖有效设置', () => {
  const storage = memory()
  const settings = new SettingsStore(storage)
  assert.equal(settings.set('sidebarTop', ['sidebar', 'sidebar']), false)
  assert.deepEqual(settings.get('sidebarTop'), ['sidebar', 'settings', 'files'])
  assert.equal(settings.set('attachmentDirectory', '../outside'), false)
  assert.equal(settings.get('attachmentDirectory'), 'assets')
})

test('存储写入失败不会让界面显示未持久化的值', () => {
  let writable = true
  const data = new Map()
  const storage = { getItem: key => data.get(key) ?? null, setItem: (key, value) => { if (!writable) throw new Error('disk full'); data.set(key, value) } }
  const settings = new SettingsStore(storage)
  writable = false
  assert.equal(settings.set('fontSize', 21), false)
  assert.equal(settings.get('fontSize'), 17)
})

test('偏好快照只恢复已登记配置并拒绝密钥字段', () => {
  const source = new SettingsStore(memory())
  source.set('fontSize', 21)
  const target = new SettingsStore(memory())
  assert.equal(target.restoreSnapshot(source.exportSnapshot()), true)
  assert.equal(target.get('fontSize'), 21)
  const injected = JSON.parse(source.exportSnapshot())
  injected.global.serviceToken = 'secret'
  assert.equal(target.restoreSnapshot(JSON.stringify(injected)), false)
  assert.equal(target.get('fontSize'), 21)
})

test('external change preference defaults to auto and persists confirmation mode', () => {
  const storage = memory()
  const settings = new SettingsStore(storage)
  assert.equal(settings.get('externalFileChanges'), 'auto')
  assert.equal(settings.set('externalFileChanges', 'confirm'), true)
  assert.equal(new SettingsStore(storage).get('externalFileChanges'), 'confirm')
  assert.equal(settings.set('externalFileChanges', 'unknown'), false)
})

test('diagram visual editing defaults on and preserves an explicit opt-out', () => {
  const storage = memory(), settings = new SettingsStore(storage)
  assert.equal(settings.get('diagramVisualEditing'), true)
  assert.equal(settings.set('diagramVisualEditing', false), true)
  assert.equal(new SettingsStore(storage).get('diagramVisualEditing'), false)
  assert.equal(settings.set('diagramVisualEditing', 'yes'), false)
})

test('界面语言保存后可恢复，无效语言不会覆盖当前设置', () => {
  const storage = memory()
  const settings = new SettingsStore(storage)
  assert.equal(settings.get('language'), 'system')
  assert.equal(settings.set('language', 'ja'), true)
  assert.equal(new SettingsStore(storage).get('language'), 'ja')
  assert.equal(settings.set('language', 'not-a-language'), false)
  assert.equal(settings.get('language'), 'ja')
})
