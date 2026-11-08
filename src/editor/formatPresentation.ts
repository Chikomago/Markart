/** Shared Markdown hints for command menus. */
export const markdownMarkers: Record<string, string> = {
  h1: '#', h2: '##', h3: '###', h4: '####', h5: '#####', h6: '######',
  bold: '** **', italic: '* *', strikethrough: '~~ ~~', underline: '<u></u>',
  'inline-code': '` `', code: '``` ```', 'inline-formula': '$ $', formula: '$$ $$',
  link: '[]()', image: '![]()', comment: '<!-- -->', frontmatter: '--- ---',
  list: '-', 'ordered-list': '1.', task: '- [ ]', quote: '>', table: '| |',
  mermaid: '```mermaid', mindmap: '```mindmap', footnote: '[^1]', hr: '---',
  ...Object.fromEntries(['tip', 'note', 'important', 'warning', 'caution'].map(kind => [`callout-${kind}`, `> [!${kind.toUpperCase()}]`]))
}
export const shortcutFormatIcons: Record<string, string> = {
  formatDocument: 'format-document', imageUrl: 'image', copyMarkdown: 'copy-markdown', copyHtml: 'copy-html', copyImage: 'copy-image', copyPlain: 'copy-plain',
  inlineCode: 'inline-code', inlineFormula: 'inline-formula', codeBlock: 'code', unorderedList: 'list', orderedList: 'ordered-list',
  taskList: 'task', horizontalRule: 'hr', clearFormat: 'clear', indentList: 'indent', outdentList: 'outdent',
  headingIncrease: 'heading-up', headingDecrease: 'heading-down',
  ...Object.fromEntries(['Tip', 'Note', 'Important', 'Warning', 'Caution'].map(kind => [`callout${kind}`, `callout-${kind.toLowerCase()}`])),
  ...Object.fromEntries(Array.from({ length: 7 }, (_, index) => [`heading${index}`, index ? `h${index}` : 'paragraph']))
}

/** Non-format commands use distinct icons; formatting aliases above are shared by all menus. */
export const commandIcons: Record<string, string> = {
  openFile: 'open-file', openFolder: 'folder', newFolder: 'new-folder', closeFolder: 'close-folder',
  recentFiles: 'recent-files', recentFolders: 'recent-folders', history: 'history',
  workspaceSearch: 'workspace-search', find: 'search', sort: 'sort', newWindow: 'new-window',
  closeFile: 'close-file', saveAs: 'save-as', mode: 'view-mode', wysiwygView: 'wysiwyg-view',
  sourceView: 'source-view', splitView: 'split-view', sideView: 'file-view', reference: 'help',
  toggleToolbar: 'toolbar', toggleTabs: 'tabs', renameDocument: 'rename', moveDocument: 'move',
  deleteDocument: 'delete', convertMarkdown: 'convert-markdown', checkDocumentLinks: 'check-document-links',
  checkFolderLinks: 'check-folder-links', imageProperties: 'image-properties', insertMindmap: 'mindmap',
  insertMermaid: 'mermaid', readOnly: 'readonly', foldHeadings: 'fold-headings',
  exportHtml: 'export-html', exportText: 'export-text', exportWord: 'export-word',
  exportPng: 'export-png', exportPdf: 'export-pdf', shortcutReference: 'shortcuts'
}
