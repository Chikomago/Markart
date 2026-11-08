import { EditorState, Compartment } from '@codemirror/state'
import { history, undo, redo } from '@codemirror/commands'
import { markdown } from '@codemirror/lang-markdown'
import { syntaxTree } from '@codemirror/language'

export function createProbe(source) {
  const viewMode = new Compartment()
  const separator = source.includes('\r\n') ? '\r\n' : '\n'
  let state = EditorState.create({
    doc: source,
    extensions: [history(), markdown(), EditorState.lineSeparator.of(separator), viewMode.of([])]
  })
  const text = () => state.sliceDoc(0, state.doc.length)
  return {
    get state() { return state },
    set state(next) { state = next },
    edit(from, to, insert) {
      state = state.update({ changes: { from, to, insert } }).state
      return text()
    },
    toggle(mode) {
      state = state.update({ effects: viewMode.reconfigure(mode === 'rich' ? EditorState.readOnly.of(false) : []) }).state
      return text()
    },
    undo() { undo({ state, dispatch: transaction => { state = transaction.state } }); return text() },
    redo() { redo({ state, dispatch: transaction => { state = transaction.state } }); return text() },
    nodes() {
      const names = []
      syntaxTree(state).iterate({ enter: node => { if (node.name !== 'Document') names.push(node.name) } })
      return names
    }
  }
}
