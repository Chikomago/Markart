import test from 'node:test'
import assert from 'node:assert/strict'
import { build } from 'esbuild'

const bundled = await build({
  stdin: { contents: "export * from './settings/shortcuts'; export { useWorkspaceCommands } from './workspace/useWorkspaceCommands'", resolveDir: process.cwd() + '/src', loader: 'ts' },
  bundle: true, platform: 'node', format: 'esm', write: false, define: { 'import.meta.env': '{}' }
})
const { shortcuts, matchingShortcut, isValidShortcutOverrides, useWorkspaceCommands } = await import(`data:text/javascript;base64,${Buffer.from(bundled.outputFiles[0].text).toString('base64')}`)

test('new built-in actions can be assigned, matched, and cleared without changing focus defaults', () => {
  for (const id of ['typewriter', 'inlineFormula', 'insertMermaid', 'insertMindmap', 'frontmatter', 'imageUrl', 'formatDocument', 'copyMarkdown', 'copyHtml', 'copyImage', 'copyPlain']) {
    assert.ok(shortcuts.some(item => item.id === id), id)
    const overrides = { [id]: 'Meta+Alt+Shift+KeyY' }
    assert.equal(isValidShortcutOverrides(overrides), true)
    assert.equal(matchingShortcut('Meta+Alt+Shift+KeyY', overrides), id)
    assert.equal(matchingShortcut('Meta+Alt+Shift+KeyY', { [id]: null }), null)
  }
  assert.equal(matchingShortcut('Meta+Shift+KeyD', {}), 'focus')
})

test('assigned shortcuts execute modes, diagram insertion, formatting and copy actions', () => {
  const calls = []
  const deps = {
    focusMode: { value: false }, typewriter: { value: false },
    applyBlockStyle: value => calls.push(['block', value]),
    format: value => calls.push(['format', value]),
    copyCurrentBlock: value => calls.push(['copy', value])
  }
  const { performShortcut } = useWorkspaceCommands(deps)
  performShortcut('focus'); performShortcut('typewriter')
  assert.equal(deps.focusMode.value, true)
  assert.equal(deps.typewriter.value, true)
  for (const id of ['insertMermaid', 'insertMindmap', 'frontmatter', 'inlineFormula', 'imageUrl', 'formatDocument', 'copyMarkdown', 'copyHtml', 'copyImage', 'copyPlain']) performShortcut(id)
  assert.deepEqual(calls, [
    ['block', 'mermaid'], ['block', 'mindmap'], ['block', 'frontmatter'],
    ['format', 'inline-formula'], ['format', 'image-url'], ['format', 'format-document'],
    ['copy', 'markdown'], ['copy', 'html'], ['copy', 'image'], ['copy', 'plain']
  ])
})

test('pinned theme button opens theme menu even when absent from legacy layout', () => {
  const deps = {
    topbarLayout: { value: { sidebarTop: ['sidebar', 'settings', 'files'], editorTop: ['mode'] } },
    showThemes: { value: false }, showSettings: { value: false }, settingTab: { value: 'editor' }
  }
  const { activateTopbar } = useWorkspaceCommands(deps)
  activateTopbar('theme', {})
  assert.equal(deps.showThemes.value, true)
  assert.equal(deps.showSettings.value, false)
  activateTopbar('theme', {})
  assert.equal(deps.showThemes.value, false)
})

 test('version history has a default shortcut, supports reassignment and opens the existing panel', () => {
  assert.equal(matchingShortcut('Meta+Shift+KeyH', {}), 'history')
  assert.equal(matchingShortcut('Meta+Shift+KeyH', { history: null }), null)
  assert.equal(matchingShortcut('Meta+Alt+Shift+KeyY', { history: 'Meta+Alt+Shift+KeyY' }), 'history')
  let opened = 0
  const { performShortcut } = useWorkspaceCommands({ openHistory: () => { opened++ } })
  performShortcut('history')
  assert.equal(opened, 1)
})
