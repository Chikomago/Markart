import { tags } from '@lezer/highlight'
import { EditorState } from '@codemirror/state'
import { highlightSpecialChars, dropCursor, rectangularSelection, crosshairCursor, highlightActiveLine, keymap } from '@codemirror/view'
import { HighlightStyle, indentOnInput, syntaxHighlighting, defaultHighlightStyle, bracketMatching, foldKeymap } from '@codemirror/language'
import { history, defaultKeymap, historyKeymap, indentWithTab } from '@codemirror/commands'
import { highlightSelectionMatches, searchKeymap } from '@codemirror/search'
import { closeBrackets, autocompletion, closeBracketsKeymap, completionKeymap } from '@codemirror/autocomplete'

const markdownHighlightStyle = HighlightStyle.define(defaultHighlightStyle.specs.map(spec =>
  spec.tag === tags.heading ? { ...spec, textDecoration: 'none' } : spec))

// CodeMirror's basic setup without drawSelection: native selection is painted
// above Markdown block backgrounds, with no second layer across block gutters.
export const editorSetup = [
  highlightSpecialChars(), history(),
  dropCursor(), EditorState.allowMultipleSelections.of(true),
  indentOnInput(), syntaxHighlighting(markdownHighlightStyle, { fallback: true }),
  bracketMatching(), closeBrackets(), autocompletion(), rectangularSelection(),
  crosshairCursor(), highlightActiveLine(), highlightSelectionMatches(),
  keymap.of([...closeBracketsKeymap, indentWithTab, ...defaultKeymap, ...searchKeymap.filter(binding => !['Mod-f', 'Mod-g', 'F3', 'Escape'].includes(binding.key || '')),
    ...historyKeymap, ...foldKeymap, ...completionKeymap])
]
