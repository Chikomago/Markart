import { retainedDocument, retainDocument } from './documentStates'
import { EditorState, Transaction } from '@codemirror/state'
import { history, isolateHistory } from '@codemirror/commands'
import type { EditorView } from '@codemirror/view'
import type { PluginTextEdit } from '../plugins/host/types'

export function applyPluginChanges(view: Pick<EditorView, 'state' | 'dispatch'>, expectedContent: string, edits: PluginTextEdit[], selection?: {from:number;to:number}): true | 'not-editable' | 'stale-revision' {
  if (view.state.readOnly) return 'not-editable'
  if (view.state.doc.toString() !== expectedContent) return 'stale-revision'
  view.dispatch({
    selection: selection ? {anchor:selection.from,head:selection.to} : undefined,
    changes: edits.map(({ from, to, text }) => ({ from, to, insert: text })),
    annotations: [Transaction.userEvent.of('input.plugin'), isolateHistory.of('full')],
  })
  return true
}

/** Apply to a parked tab while preserving its undo history. */
export function applyRetainedPluginChanges(id:string,source:string,edits:PluginTextEdit[],selection?:{from:number;to:number}) {
  const previous=retainedDocument(id,source)||EditorState.create({doc:source,extensions:[history()]})
  if(previous.readOnly)return null
  const transaction=previous.update({changes:edits.map(edit=>({from:edit.from,to:edit.to,insert:edit.text})),selection:selection?{anchor:selection.from,head:selection.to}:undefined,annotations:[Transaction.userEvent.of('input.plugin'),isolateHistory.of('full')]})
  retainDocument(id,transaction.state)
  return transaction.state.doc.toString()
}
