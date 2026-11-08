import test from 'node:test'
import assert from 'node:assert/strict'
import { build } from 'esbuild'

const bundle = await build({ entryPoints: ['src/workspace/topbar.ts'], bundle: true, platform: 'node', format: 'esm', write: false })
const { topbarCommands, normalizeTopbar, placeTopbar, visiblePinnedTopbarItems } = await import(`data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString('base64')}`)

test('图标注册 ID 在两个区域唯一，未知项不会占据页面', () => {
  assert.deepEqual(normalizeTopbar({ sidebarTop: ['sidebar', 'unknown'], editorTop: ['sidebar', 'mode'] }), { sidebarTop: ['sidebar'], editorTop: ['mode'] })
})

test('布局迁移将同一图标移到目标区域且不修改原布局', () => {
  const initial = { sidebarTop: ['sidebar', 'settings'], editorTop: ['mode', 'theme'] }
  const moved = placeTopbar(initial, 'theme', 'sidebarTop', 'settings')
  assert.deepEqual(moved.sidebarTop, ['sidebar', 'theme', 'settings'])
  assert.deepEqual(moved.editorTop, ['mode'])
  assert.deepEqual(initial.editorTop, ['mode', 'theme'])
})

test('功能注册包含打字机模式并可加入布局', () => {
  assert.equal(topbarCommands.find(item => item.id === 'typewriter')?.label, '打字机模式')
  assert.deepEqual(placeTopbar({ sidebarTop: [], editorTop: [] }, 'typewriter', 'editorTop').editorTop, ['typewriter'])
})

const dragBundle = await build({ entryPoints: ['src/workspace/useTopbarDrag.ts'], bundle: true, platform: 'node', format: 'esm', write: false })
const { reorderTopbarItems } = await import(`data:text/javascript;base64,${Buffer.from(dragBundle.outputFiles[0].text).toString('base64')}`)

test('当前拖拽排序只移动已有图标并保留原数组', () => {
  const original = ['mode', 'theme', 'export']
  assert.deepEqual(reorderTopbarItems(original, 'export', 'mode'), ['export', 'mode', 'theme'])
  assert.deepEqual(reorderTopbarItems(original, 'mode'), ['theme', 'export', 'mode'])
  assert.equal(reorderTopbarItems(original, 'unknown'), original)
  assert.equal(reorderTopbarItems(original, 'mode', 'mode'), original)
  assert.deepEqual(original, ['mode', 'theme', 'export'])
})

test('pinned plugin IDs share built-in ordering without losing disabled plugin positions', () => {
  const saved = ['plugin.test:inspect', 'theme', 'plugin.off:action', 'mode']
  assert.deepEqual(visiblePinnedTopbarItems(saved, ['mode', 'theme', 'export'], ['plugin.test:inspect']), ['plugin.test:inspect', 'theme', 'mode'])
  assert.deepEqual(visiblePinnedTopbarItems(saved, ['mode', 'theme'], []), ['theme', 'mode'])
  const reordered = reorderTopbarItems(saved, 'mode', 'plugin.test:inspect')
  assert.deepEqual(reordered, ['mode', 'plugin.test:inspect', 'theme', 'plugin.off:action'])
  assert.deepEqual(visiblePinnedTopbarItems(reordered, ['mode', 'theme'], ['plugin.test:inspect', 'plugin.off:action']), reordered)
  assert.deepEqual(visiblePinnedTopbarItems(['theme'], ['theme'], ['plugin.new:action']), ['theme'])
})
