import test from 'node:test'
import assert from 'node:assert/strict'
import { build } from 'esbuild'
const bundle = await build({ entryPoints: ['src/workspace/desktopKeyboard.ts'], bundle: true, platform: 'node', format: 'esm', write: false })
const { installDesktopKeyboardPolicy, isInspectorShortcut } = await import(`data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString('base64')}`)
function key(name, values = {}) {
  const event = new Event('keydown', { cancelable: true })
  Object.assign(event, { key: name, metaKey: false, ctrlKey: false, shiftKey: false, altKey: false, isComposing: false }, values)
  return event
}
test('desktop Tab prevents browser focus traversal, without blocking handled editor actions', () => {
  const target = new EventTarget(), stop = installDesktopKeyboardPolicy(target, true)
  const tab = key('Tab'); target.dispatchEvent(tab); assert.equal(tab.defaultPrevented, true)
  const shiftTab = key('Tab', { shiftKey: true }); target.dispatchEvent(shiftTab); assert.equal(shiftTab.defaultPrevented, true)
  const handled = key('Tab'); handled.preventDefault(); target.dispatchEvent(handled); assert.equal(handled.defaultPrevented, true)
  const arrow = key('ArrowDown'); target.dispatchEvent(arrow); assert.equal(arrow.defaultPrevented, false)
  const enter = key('Enter'); target.dispatchEvent(enter); assert.equal(enter.defaultPrevented, false)
  stop(); const after = key('Tab'); target.dispatchEvent(after); assert.equal(after.defaultPrevented, false)
})
test('inspector shortcuts are blocked only in desktop windows', () => {
  assert.equal(isInspectorShortcut(key('F12')), true)
  assert.equal(isInspectorShortcut(key('I', { metaKey: true, altKey: true })), true)
  assert.equal(isInspectorShortcut(key('I', { ctrlKey: true, shiftKey: true })), true)
  assert.equal(isInspectorShortcut(key('i', { metaKey: true })), false)
  const target = new EventTarget(), stop = installDesktopKeyboardPolicy(target, false)
  const browser = key('F12'); target.dispatchEvent(browser); assert.equal(browser.defaultPrevented, false); stop()
  const release = installDesktopKeyboardPolicy(target, true)
  const desktop = key('F12'); target.dispatchEvent(desktop); assert.equal(desktop.defaultPrevented, true); release()
})
