import { EditorState, Compartment, RangeSetBuilder } from '@codemirror/state'
import { EditorView, Decoration, keymap } from '@codemirror/view'
import { markdown } from '@codemirror/lang-markdown'
import { history, historyKeymap, defaultKeymap, undo } from '@codemirror/commands'

const original = '# 标题\n\n未编辑的 **强调** 与 [链接](./图片.png) 保持原样。\n\n目标段落\n\n```js\nconst a = 1\n```\n'
const mode = new Compartment()
let rich = true
const richDecorations = EditorView.decorations.compute(['doc', 'selection'], state => {
  const builder = new RangeSetBuilder()
  for (let number = 1; number <= state.doc.lines; number++) {
    const line = state.doc.line(number)
    const marker = /^(#{1,6})\s/.exec(line.text)
    if (!marker) continue
    builder.add(line.from, line.from, Decoration.line({ class: 'probe-heading' }))
    if (state.selection.main.head < line.from || state.selection.main.head > line.to) {
      builder.add(line.from, line.from + marker[0].length, Decoration.replace({}))
    }
  }
  return builder.finish()
})
const source = document.querySelector('#source')
const editor = new EditorView({
  parent: document.querySelector('#editor'),
  state: EditorState.create({
    doc: original,
    extensions: [history(), markdown(), keymap.of([...defaultKeymap, ...historyKeymap]), mode.of(richDecorations), EditorView.updateListener.of(update => {
      if (update.docChanged) source.textContent = update.state.sliceDoc(0, update.state.doc.length)
    })]
  })
})
source.textContent = original
document.querySelector('#mode').addEventListener('click', event => {
  rich = !rich
  editor.dispatch({ effects: mode.reconfigure(rich ? richDecorations : []) })
  event.currentTarget.textContent = rich ? '切换到源码视图' : '切换到排版视图'
})
document.querySelector('#replace').addEventListener('click', () => {
  const from = editor.state.doc.toString().indexOf('目标段落')
  if (from >= 0) editor.dispatch({ changes: { from, to: from + 4, insert: '改写段落' } })
})
document.querySelector('#undo').addEventListener('click', () => undo(editor))
