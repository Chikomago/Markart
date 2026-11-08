import type { EditorState } from '@codemirror/state'

// Keep native selection and history when tabs temporarily unmount an editor.
// Render extensions are reconfigured by the new component on restoration.
const documents = new Map<string, EditorState>()
export function retainedDocument(id: string, source: string) {
  const state = documents.get(id)
  return state?.doc.toString() === source ? state : undefined
}
export function retainDocument(id: string, state: EditorState) {
  documents.delete(id); documents.set(id, state)
  if (documents.size > 20) documents.delete(documents.keys().next().value!)
}
