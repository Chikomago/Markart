import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { JSDOM } from 'jsdom'

const dom = new JSDOM('<!doctype html><div id="editor"></div>', { pretendToBeVisual: true })
for (const key of ['window', 'Window', 'document', 'navigator', 'HTMLElement', 'SVGElement', 'Element', 'Node', 'MutationObserver', 'DOMParser', 'Event', 'CustomEvent']) {
  Object.defineProperty(globalThis, key, { configurable: true, value: key === 'window' ? dom.window : dom.window[key] })
}
globalThis.getComputedStyle = dom.window.getComputedStyle.bind(dom.window)
globalThis.requestAnimationFrame = dom.window.requestAnimationFrame.bind(dom.window)
globalThis.cancelAnimationFrame = dom.window.cancelAnimationFrame.bind(dom.window)
globalThis.addEventListener = dom.window.addEventListener.bind(dom.window)
globalThis.removeEventListener = dom.window.removeEventListener.bind(dom.window)
globalThis.dispatchEvent = dom.window.dispatchEvent.bind(dom.window)
dom.window.Range.prototype.getClientRects = () => []
dom.window.Range.prototype.getBoundingClientRect = () => ({ left: 0, top: 0, right: 0, bottom: 0, width: 0, height: 0 })
globalThis.IntersectionObserver = class {
  constructor(callback) { this.callback = callback }
  observe(target) { queueMicrotask(() => this.callback([{ target, isIntersecting: true }], this)) }
  unobserve() {}
  disconnect() {}
}

const { Editor, rootCtx, defaultValueCtx } = await import('@milkdown/kit/core')
const { editorViewCtx } = await import('@milkdown/kit/core')
const { commonmark } = await import('@milkdown/kit/preset/commonmark')
const { gfm } = await import('@milkdown/kit/preset/gfm')
const { codeBlockComponent } = await import('@milkdown/kit/component/code-block')
const { getMarkdown, replaceAll } = await import('@milkdown/kit/utils')
const { EditorState } = await import('@codemirror/state')
const { EditorView: CodeMirrorView } = await import('@codemirror/view')

const path = process.argv[2] || fileURLToPath(new URL('./fixture.md', import.meta.url))
const original = await readFile(path, 'utf8')
const editor = await Editor.make()
  .config(ctx => {
    ctx.set(rootCtx, document.querySelector('#editor'))
    ctx.set(defaultValueCtx, original)
  })
  .use(commonmark)
  .use(gfm)
  .use(codeBlockComponent)
  .create()
try {
  const saved = editor.action(getMarkdown())
  const firstDifference = [...original].findIndex((character, index) => character !== saved[index])
  const images = [...document.querySelectorAll('img[src^="assets/"]')]
  const codeEditors = [...document.querySelectorAll('.cm-editor')]
  const codeView = codeEditors[0] ? CodeMirrorView.findFromDOM(codeEditors[0]) : null
  if (codeView) {
    codeView.focus()
    codeView.dispatch({ changes: { from: codeView.state.doc.length, insert: '\n// Milkdown code block edit probe' } })
  }
  await new Promise(resolve => setTimeout(resolve, 50))
  const afterCodeBlockEdit = editor.action(getMarkdown())
  const sourceState = EditorState.create({ doc: original })
  const sourceEdited = sourceState.update({ changes: { from: original.length, insert: '\nMarkart source edit probe\n' } }).state.doc.toString()
  editor.action(replaceAll(sourceEdited))
  const afterSourceEdit = editor.action(getMarkdown())
  const prefixSurvivedSourceEdit = afterSourceEdit.startsWith(original)
  const prosemirrorEdit = editor.action(ctx => {
    const view = ctx.get(editorViewCtx)
    view.dispatch(view.state.tr.insertText('Milkdown edit probe', view.state.doc.content.size))
    return view.state.doc.textContent.includes('Milkdown edit probe')
  })
  const afterMilkdownEdit = editor.action(getMarkdown())
  const mirroredSource = EditorState.create({ doc: afterSourceEdit }).update({ changes: { from: 0, to: afterSourceEdit.length, insert: afterMilkdownEdit } }).state.doc.toString()
  console.log(JSON.stringify({
    source: path,
    originalBytes: Buffer.byteLength(original),
    savedBytes: Buffer.byteLength(saved),
    byteIdentical: original === saved,
    firstDifference,
    originalContext: original.slice(Math.max(0, firstDifference - 30), firstDifference + 90),
    savedContext: saved.slice(Math.max(0, firstDifference - 30), firstDifference + 90),
    sourceHasImageWidth: original.includes('{width=128px}'),
    savedHasImageWidth: saved.includes('{width=128px}'),
    sourceHasCodeLanguage: original.includes('```javascript'),
    savedHasCodeLanguage: saved.includes('```javascript'),
    codeBlockEditors: codeEditors.length,
    editableCodeBlockEditors: codeEditors.filter(element => element.querySelector('[contenteditable="true"]')).length,
    codeBlockViewFound: !!codeView,
    codeBlockEditReachedMarkdown: afterCodeBlockEdit.includes('Milkdown code block edit probe'),
    renderedImages: images.length,
    renderedImageWidths: images.map(image => image.getAttribute('width')),
    testImageHTML: images.find(image => image.getAttribute('alt') === 'Markart 测试图片')?.outerHTML || null,
    testImageParentText: images.find(image => image.getAttribute('alt') === 'Markart 测试图片')?.parentElement?.textContent || null,
    sourceEditReachedMilkdown: afterSourceEdit.includes('Markart source edit probe'),
    sourceEditPreservedOriginalPrefix: prefixSurvivedSourceEdit,
    milkdownEditApplied: prosemirrorEdit,
    milkdownEditSerialized: afterMilkdownEdit.includes('Milkdown edit probe'),
    milkdownEditReachedSource: mirroredSource.includes('Milkdown edit probe'),
  }, null, 2))
} finally {
  await editor.destroy()
  dom.window.close()
}
