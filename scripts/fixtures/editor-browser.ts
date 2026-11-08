import { installI18n, setLanguage } from './i18n'
import { foldedRanges as testFoldedRanges } from '@codemirror/language'
import { createApp as testApp, h as testH, ref as testRef, nextTick as testTick, computed as testComputed } from 'vue'
import { deleteCharBackward as nativeBackspace, insertNewline as nativeNewline, cursorCharRight as nativeRight } from '@codemirror/commands'
import { renderMarkdown } from './editor/renderMarkdown'
import { rememberSettingsInput, runSettingsInputHistory } from './settings/inputHistory'
import { exportFragment, exportStyles } from './documents/exportRendering'
import { sharedPage } from './documents/useLanShare'
import { useDocumentExport } from './documents/useDocumentExport'
import { htmlToDocx } from './documents/wordExport'
import JSZip from 'jszip'
import { parsePluginManifest } from './plugins/manifest'
import { savePlugin, savedPlugins, removePlugin } from './plugins/community'
import { PluginRuntime } from './plugins/runtime'
import { useDocumentTools } from './documents/useDocumentTools'
import { useMarkdownPreview } from './editor/useMarkdownPreview'
const results = []
const wait = () => new Promise(resolve => setTimeout(resolve, 80))
let app, editor, latest, selectionInfo, model, settings, outlineTools
async function mount(source, options = {}) {
  app?.unmount(); document.querySelector('#app').innerHTML = ''
  latest = source; selectionInfo = null; outlineTools = null; editor = testRef(null); model = testRef(source); settings = testRef(options)
  app = testApp({ setup() {
    if (options.fixtureOutlineSync) outlineTools = useDocumentTools({ isTauri: false, currentWorkspaceRoot: testRef(''), docs: testRef([]), activeDoc: testRef({ id: 'fixture', path: 'note.md' }), activeId: testRef('fixture'), content: model, markdownActive: testRef(true), selectedText: testRef(''), selectionOffset: testRef(0), editor, previewEditor: testRef(null), selectDoc: async () => {}, jumpHeading: () => {}, notify: () => {} })
    const preview = options.fixturePreviewCache ? useMarkdownPreview({ isTauri: false, activeDoc: testComputed(() => ({ id: 'fixture', loaded: true, relativePath: 'note.md' })), activeId: testRef('fixture'), content: model }) : null
    return () => testH(TestEditor, {
    ref: editor, docId: 'fixture', modelValue: model.value, rich: true, fileKind: 'markdown', diagramVisualEditing: true, codeBlockLineNumbers: true, ...settings.value, ...(preview ? { imageData: preview.imageData.value } : {}),
    'onUpdate:modelValue': value => { latest = value; model.value = value }, onSelection: value => selectionInfo = value, onFoldChange: info => outlineTools?.onHeadingFoldsChange?.(info)
  }) } })
  setLanguage('zh-CN'); installI18n(app); app.mount('#app'); await wait()
}
function assert(condition, message) { if (!condition) throw Error(message) }
function nativeView() { return EditorView.findFromDOM(document.querySelector('.cm-editor')) }
async function test(name, run) {
  if (testFilter && !new RegExp(testFilter).test(name)) return
  document.body.dataset.testProgress = name
  try { await run(); results.push({ name, pass: true }) } catch (error) { results.push({ name, pass: false, error: error.message + '\n' + (error.stack || '') }) }
}
async function run() {
  await test('HTML text wraps within a narrow editor', async () => {
    const parent=document.querySelector('#app');parent.style.width='420px'
    await mount('<div data-value="'+'abcdefghij'.repeat(120)+'">'+'正文内容'.repeat(80)+'</div>', {rich:false,fileKind:'text'})
    await wait();const scroller=document.querySelector('.cm-scroller'),line=document.querySelector('.cm-line')
    assert(scroller.scrollWidth<=scroller.clientWidth+2,'HTML exceeds visible editor width: '+scroller.scrollWidth+'/'+scroller.clientWidth)
    assert(line.getBoundingClientRect().height>60,'HTML did not wrap')
    parent.style.width=''
  })

  await test('editor unfold updates outline collapsed headings', async () => {
    await mount('# Root\n\nIntro\n\n## Child\n\nChild body\n\n# Last\n\nLast body', { fixtureOutlineSync: true })
    outlineTools.toggleAllOutlineSections(); await wait()
    assert(outlineTools.outlineAllCollapsed.value, 'outline did not show all collapsed')
    document.querySelector('.cm-heading-fold-placeholder').click(); await wait()
    assert(!outlineTools.outlineAllCollapsed.value && !outlineTools.collapsedOutlineHeadings.value.includes(0), 'outline kept root collapsed after editor unfolded it')
    assert(outlineTools.collapsedOutlineHeadings.value.includes(1), 'nested fold state was lost')
  })
  await test('collapse all headings keeps parent sections folded and preserves caret', async () => {
    const source = '# Root\n\nIntro\n\n## First\n\nFirst body\n\n### Nested\n\nNested body\n\n## Second\n\nSecond body\n\n# Last\n\nLast body'
    await mount(source)
    const view = nativeView(), before = view.state.selection.main.head
    editor.value.setAllHeadingsFolded(true); await wait()
    const ranges = []; testFoldedRanges(view.state).between(0, view.state.doc.length, (from, to) => ranges.push({ from, to }))
    assert(ranges.some(range => range.from === source.indexOf('\n') && range.to >= source.indexOf('# Last') - 2), 'root section was reopened while folding nested headings: ' + JSON.stringify(ranges))
    assert(view.state.selection.main.head === before, 'collapse all moved the caret')
    assert(!view.contentDOM.textContent.includes('First body') && !view.contentDOM.textContent.includes('Last body'), 'folded body remains visible')
    const marker = view.dom.querySelector('.cm-heading-fold-placeholder')
    assert(marker && getComputedStyle(marker).borderTopWidth === '0px' && parseFloat(getComputedStyle(marker).height) <= 20, 'fold marker still has an oversized frame')
    marker.click(); await wait()
    assert(view.contentDOM.textContent.includes('Intro'), 'fold marker did not expand its section')
    editor.value.setAllHeadingsFolded(false); await wait()
    assert(testFoldedRanges(view.state).size === 0, 'expand all left folded sections')
    editor.value.toggleHeadingFold(1); await wait()
    assert(testFoldedRanges(view.state).size === 1, 'individual heading fold failed')
    const longSource = Array.from({ length: 60 }, (_, index) => `# Section ${index}\n\n${'Paragraph content. '.repeat(60)}\n\n`).join('')
    await mount(longSource)
    editor.value.setAllHeadingsFolded(true); await wait()
    assert(testFoldedRanges(nativeView().state).size === 60, 'offscreen headings were not all folded')
  })
  await test('inline formatting identifies the word at an unselected caret', async () => {
    for(const [command,left,right] of [['bold','**','**'],['italic','*','*'],['strikethrough','~~','~~'],['underline','<u>','</u>'],['code','`','`']]){
      await mount('Hello world!');editor.value.selectRange(8,0);await editor.value.format(command);await wait()
      assert(latest==='Hello '+left+'world'+right+'!','Word was not formatted: '+command+' '+latest)
      assert(nativeView().state.selection.main.empty&&nativeView().state.selection.main.head===8+left.length,'Formatting moved or selected the caret word')
      await editor.value.format(command);await wait();assert(latest==='Hello world!','Repeated word formatting did not toggle off: '+command)
      editor.value.undo();await wait()
      editor.value.undo();await wait();assert(latest==='Hello world!','Word formatting is not undoable')
    }
    await mount('这是中文示例。');editor.value.selectRange(3,0);await editor.value.format('bold');await wait()
    assert(latest==='这是**中文**示例。','Chinese phrase segmentation failed: '+latest)
    await mount('Hello world!');editor.value.selectRange(11,0);await editor.value.format('bold');await wait()
    assert(latest==='Hello **world**!','Word-end caret was not recognized')
    await mount('Hello world!');editor.value.selectRange(0,5);await editor.value.format('bold');await wait()
    assert(latest==='**Hello** world!','Explicit selection was ignored')
    await mount('');await editor.value.format('bold');await wait();assert(latest==='****','Empty insertion no longer works')
  })
  await test('new inline actions insert placeholders and share native history', async () => {
    await mount('text')
    editor.value.selectRange(0, 4); await editor.value.format('inline-formula'); await wait()
    assert(latest === '$text$', 'inline formula not inserted')
    editor.value.undo(); await wait(); assert(latest === 'text', 'formula undo failed')
    editor.value.selectRange(4, 0); await editor.value.format('link'); await wait()
    assert(latest === 'text[](url)' && nativeView().state.selection.main.head === 5, 'link placeholder or caret incorrect: ' + latest)
    assert(nativeView().contentDOM.textContent.includes('[](url)'), 'new link markers hidden while typing')
    await mount(''); await editor.value.format('image'); await wait()
    assert(latest === '![](src)' && nativeView().state.selection.main.head === 2, 'image placeholder or caret incorrect: ' + latest)
    for (const [command, markers, caret] of [['bold', '****', 2], ['italic', '**', 1], ['strikethrough', '~~~~', 2], ['underline', '<u></u>', 3], ['code', '``', 1], ['inline-formula', '$$', 1]]) {
      await mount(''); await editor.value.format(command); await wait()
      assert(latest === markers && nativeView().state.selection.main.head === caret, 'empty inline markers incorrect: ' + command + latest)
      assert(!document.querySelector('.cm-markdown-block'), 'empty inline markers replaced by block: ' + command)
      const view = nativeView(); view.dispatch(view.state.replaceSelection('x')); await wait()
      assert(latest === markers.slice(0, caret) + 'x' + markers.slice(caret), 'inline typing misplaced: ' + command)
    }
    await mount(''); editor.value.applyBlock('mermaid'); await wait()
    assert(latest.includes('graph TD') && !latest.includes('flowchart LR'), 'wrong Mermaid default')
  })
  await test('document find has one panel with case word regex and replacement controls', async () => {
    const source = 'cat Cat scatter cat42 dog'
    await mount(source)
    nativeView().contentDOM.dispatchEvent(new KeyboardEvent('keydown', { key: 'f', metaKey: true, bubbles: true, cancelable: true })); await wait()
    assert(document.querySelectorAll('.editor-find').length === 1 && !document.querySelector('.cm-search'), 'duplicate native search panel opened')
    if (getComputedStyle(document.querySelector('.editor-find')).position === 'absolute') {
      const findBox = document.querySelector('[aria-label="查找"]').getBoundingClientRect(), replaceBox = document.querySelector('[aria-label="替换为"]').getBoundingClientRect()
      assert(Math.abs(findBox.left - replaceBox.left) < 1 && Math.abs(findBox.width - replaceBox.width) < 1 && Math.abs(findBox.height - replaceBox.height) < 1 && replaceBox.top - findBox.bottom <= 9, 'search input rows are not aligned or have excess spacing')
    }
    const type = async (label, value) => { const input = document.querySelector(`[aria-label="${label}"]`); input.value = value; input.dispatchEvent(new Event('input', { bubbles: true })); await wait() }
    await type('查找', 'cat'); assert(document.querySelector('[role="status"]').textContent.includes('4 处'), 'default case insensitive search wrong')
    assert(!document.querySelector('.editor-find-advanced').open, 'advanced search should start collapsed')
    assert(document.querySelector('.editor-find-advanced summary svg'), 'advanced search SVG missing')
    assert(document.querySelector('[aria-label="替换为"]').parentElement.compareDocumentPosition(document.querySelector('.editor-find-advanced')) & Node.DOCUMENT_POSITION_FOLLOWING, 'advanced search should follow replacement')
    document.querySelector('.editor-find-advanced summary').click(); await wait()
    const option = text => [...document.querySelectorAll('.editor-find-options label')].find(label => label.textContent.trim() === text)
    assert(!option('全词匹配') && option('忽略空格') && option('忽略标点符号') && option('使用通配符') && option('区分全角/半角'), 'advanced options missing')
    option('区分大小写').click(); await wait(); assert(document.querySelector('[role="status"]').textContent.includes('3 处'), 'case sensitive search wrong')
    option('正则表达式').click(); await type('查找', 'cat[0-9]+'); await type('替换为', 'bird')
    const all = [...document.querySelectorAll('.editor-find button')].find(button => button.textContent === '全部替换'); all.click(); await wait()
    assert(latest === 'cat Cat scatter bird dog', 'regex replacement failed: ' + latest)
    editor.value.undo(); await wait(); assert(latest === source, 'search replacement not undoable')
    await type('查找', '['); assert(document.querySelector('[role="status"]').textContent.includes('无效'), 'invalid regexp not indicated')
    assert(!document.querySelector('.cm-search'), 'native search panel appeared')
    document.querySelector('[aria-label="关闭查找"]').click(); await wait(); assert(!document.querySelector('.editor-find'), 'search did not close')
  })
  await test('front matter panel edits values directly without revealing YAML', async () => {
    const source = '---\ntitle: Original\ntags: [one, two]\n---\n\n# Body\n\nText **bold**'
    await mount(source); await wait()
    const panel = document.querySelector('.cm-frontmatter-panel')
    assert(panel && !panel.querySelector('button'), 'metadata panel should remain compact')
    assert(panel.querySelectorAll('.frontmatter-tag').length === 2, 'array tags missing')
    const key = panel.querySelector('[aria-label="title 的字段名"]'); key.focus(); key.value = 'heading'; key.dispatchEvent(new Event('change', { bubbles: true })); await wait()
    assert(latest.includes('heading: Original') && !latest.includes('title:'), 'field rename failed')
    key.blur(); editor.value.undo(); await wait(); assert(latest === source, 'field rename not undoable')
    const currentPanel = document.querySelector('.cm-frontmatter-panel')
    const input = currentPanel.querySelector('[aria-label="title 的值"]'); input.focus(); input.value = 'Changed'; input.dispatchEvent(new Event('input', { bubbles: true })); await wait()
    assert(document.activeElement === input, 'property edit lost focus')
    assert(document.querySelector('.cm-frontmatter-panel') && !nativeView().contentDOM.textContent.includes('title:'), 'property click revealed YAML')
    assert(latest.includes('title: Changed') && latest.endsWith('# Body\n\nText **bold**'), 'property edit changed body')
    input.blur(); editor.value.undo(); await wait(); assert(latest === source, 'property edit not undoable')
    const tags = document.querySelector('[aria-label="tags 的值"]'); tags.parentElement.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, button: 0 })); tags.value = '[one, three]'; tags.blur(); await wait()
    assert(latest.includes('[ one, three ]') || latest.includes('[one, three]'), 'tag edit did not save')
    assert(document.querySelectorAll('.frontmatter-tag')[1]?.textContent === 'three', 'tag display not restored')
    await mount('Body'); editor.value.applyBlock('frontmatter'); await wait()
    assert(latest.startsWith('---\n') && latest.endsWith('Body') && document.activeElement?.classList.contains('frontmatter-input'), 'insertion did not focus property')
  })
  await test('format document uses one undoable native edit and preserves manual breaks', async () => {
    const source = '#Title\n\n|A|B|\n|-|-|\n|one|two|\n\nFirst line\nSecond line'
    await mount(source); await editor.value.format('format-document'); await wait()
    assert(latest.includes('| A') && latest.includes('First line\nSecond line'), 'formatting failed or reflowed manual lines: ' + latest)
    editor.value.undo(); await wait(); assert(latest === source, 'format undo failed')
  })

  await test('one native editing surface owns prose, code and history', async () => {
    await mount('# Heading\n\nText **bold**\n\n```javascript\nconst x = 1\n```')
    assert(document.querySelectorAll('[contenteditable="true"]').length === 1, 'extra editable HTML surfaces remain')
    assert(!document.querySelector('.cm-rich-editable,.cm-code-editor,textarea'), 'legacy mirrored editor remains')
    assert(document.querySelector('.cm-native-h1') && document.querySelector('.cm-native-bold'), 'native decorations missing')
    assert(document.querySelector('input[aria-label="代码语言"]')?.value === 'javascript', 'language control missing')
  })
  await test('consecutive deletion retains the native caret and undo redo', async () => {
    await mount('First paragraph\n\nSecond paragraph')
    editor.value.selectRange(latest.length, 0)
    const view = nativeView(); view.focus()
    nativeBackspace(view); nativeBackspace(view); nativeBackspace(view); await wait()
    assert(latest === 'First paragraph\n\nSecond paragr', 'deletion affected wrong text: ' + latest)
    assert(view.state.selection.main.head === latest.length && document.activeElement === view.contentDOM, 'native caret lost focus')
    editor.value.undo(); await wait(); assert(latest === 'First paragraph\n\nSecond paragraph', 'undo failed: ' + latest)
    editor.value.redo(); await wait(); assert(latest === 'First paragraph\n\nSecond paragr', 'redo failed')
  })
  await test('native DOM typing and deletion preserve formatted source', async () => {
    await mount('Before **bold** after\n\nOther paragraph')
    editor.value.selectRange(11, 0); await wait()
    const view = nativeView(); view.focus()
    document.execCommand('insertText', false, 'XYZ'); await wait()
    nativeBackspace(view); nativeBackspace(view); await wait()
    assert(latest === 'Before **boXld** after\n\nOther paragraph', 'DOM input changed another block: ' + latest)
    editor.value.undo(); await wait(); assert(latest.includes('XYZ') || latest === 'Before **bold** after\n\nOther paragraph', 'native input has no undo history')
  })
  await test('toolbar applies and removes formatting with native transactions', async () => {
    await mount('First\n\nSecond text')
    editor.value.selectRange(7, 6); editor.value.format('bold'); await wait()
    assert(latest === 'First\n\n**Second** text' && selectionInfo.bold, 'bold or selection state failed')
    editor.value.format('bold'); await wait(); assert(latest === 'First\n\nSecond text', 'format toggle double wrapped source')
    editor.value.undo(); await wait(); assert(latest.includes('**Second**'), 'format undo failed')
  })
  for (const [source, offset, format] of [['**bold**', 4, 'bold'], ['*italic*', 4, 'italic'], ['~~strike~~', 4, 'strikethrough'], ['`code`', 3, 'code'], ['[link](https://example.com)', 3, 'link'], ['<u>text</u>', 5, 'underline'], ['text[^note]', 8, 'footnote']]) {
    await test('toolbar recognizes ' + format, async () => {
      await mount(source + '\n\nEnd'); editor.value.selectRange(offset, 0); await wait()
      assert(selectionInfo.formatIds.includes(format), 'missing format ' + JSON.stringify(selectionInfo))
    })
  }
  for (const [source, block] of [['```js\nconst a = 1\n```', 'code-block'], ['```mermaid\ngraph TD\nA-->B\n```', 'mermaid'], ['> quote', 'quote'], ['> [!WARNING]\n> text', 'callout-warning'], ['- [ ] task', 'task-list'], ['- item', 'list'], ['1. item', 'ordered-list'], ['| A | B |\n|---|---|\n| 1 | 2 |', 'table'], ['$$\nx^2\n$$', 'formula'], ['---', 'hr']]) {
    await test('native selection recognizes ' + block, async () => { await mount(source + '\n\nEnd'); editor.value.selectRange(Math.min(3, source.length), 0); await wait(); assert(selectionInfo.block === block, JSON.stringify(selectionInfo)) })
  }
  await test('settings undo stays in the focused input', async () => {
    await mount('Body')
    editor.value.replaceRange(0, 0, 'Changed ')
    await wait()
    const body = latest
    const modal = document.createElement('div'); modal.className = 'settings-modal'
    const input = document.createElement('textarea'); modal.append(input); document.body.append(modal)
    try {
      input.focus(); rememberSettingsInput({ target: input } as Event)
      input.value = 'setting'; rememberSettingsInput({ target: input } as Event)
      assert(runSettingsInputHistory('undo', input), 'settings undo not handled')
      assert(input.value === '', 'settings input was not undone')
      assert(latest === body, 'settings undo changed document')
      assert(runSettingsInputHistory('redo', input), 'settings redo not handled')
      assert(input.value === 'setting' && latest === body, 'settings redo changed document')
      input.value = ''; rememberSettingsInput({ target: input } as Event)
      runSettingsInputHistory('undo', input)
      assert(latest === body, 'empty settings history changed document')
    } finally { modal.remove() }
  })
  await test('rich lists show visible bullets and ordered markers', async () => {
    await mount('- first\n- second\n\n1. third\n2. fourth')
    await wait()
    const lines = [...document.querySelectorAll('.cm-native-list')]
    assert(lines.length >= 4, 'list lines missing')
    assert(!lines[0].textContent.trimStart().startsWith('-'), 'unordered list still shows dash')
    assert(lines[0].querySelector('.cm-native-list-marker')?.textContent === '•', 'unordered bullet missing')
    assert(lines[2].querySelector('.cm-native-list-marker')?.textContent === '1.', 'ordered number missing')
    const marker = lines[2].querySelector('.cm-native-list-marker')
    assert(getComputedStyle(marker).color === getComputedStyle(document.querySelector('.cm-document-editor')).color, 'ordered marker color differs from text')
  })
  await test('table click shows controls without revealing Markdown', async () => {
    await mount('Intro\n\n| A | B |\n|---|---|\n| 1 | 2 |\n\nEnd')
    const table = document.querySelector('.cm-native-preview table'); assert(table, 'table not rendered')
    table.querySelector('td').click(); await wait()
    assert(document.querySelector('table') && document.querySelector('.cm-table-toolbar:not([hidden])'), 'table controls missing')
    nativeView().dispatch({ changes: { from: 9, to: 10, insert: 'X' } }); await wait()
    editor.value.selectRange(latest.length, 0); await wait(); assert(document.querySelector('table')?.textContent.includes('X'), 'table preview stale')
  })
  await test('display math retains source above live preview', async () => {
    await mount('Intro\n\n$$\nx^2\n$$\n\nEnd'); editor.value.selectRange(11, 0); await wait()
    assert(document.querySelector('.markart-display-math') && nativeView().state.doc.toString().includes('$$'), 'math source or preview missing')
    const lines=[...document.querySelectorAll('.cm-native-math-source')]
    assert(lines.length===3&&lines.every(line=>line.classList.contains('cm-native-code-line')),'Math source does not use code block styling')
    assert(lines[0].textContent==='$$'&&lines[2].textContent==='$$','Math delimiters are not editable source')
    assert(getComputedStyle(lines[1]).backgroundColor===getComputedStyle(lines[0]).backgroundColor,'Math source background is inconsistent')
    assert(document.querySelector('.cm-native-code-copy-anchor button'),'Math source has no copy button')

    editor.value.replaceRange(10, 13, 'y^3'); await wait(); assert(document.querySelector('.markart-display-math')?.textContent.includes('y'), 'math preview not updated')
  })
  await test('deleting image syntax never duplicates its Markdown text', async () => {
    const image='![图片](../assets/clipboard/pasted-image.png)'
    await mount('Intro\n\n'+image+'\n\nEnd')
    editor.value.selectRange(7+image.length,0);await wait()
    const view=nativeView()
    for(let i=1;i<=6;i++){
      nativeBackspace(view);await wait()
      const expected=image.slice(0,-i)
      assert(latest==='Intro\n\n'+expected+'\n\nEnd','Deletion duplicated document source')
      const text=view.contentDOM.textContent
      assert(text.split(expected).length-1===1,'Incomplete image Markdown displayed twice: '+text)
      assert(!view.dom.querySelector('.cm-markdown-block img'),'Broken image syntax retained an image preview')
    }
    editor.value.undo();await wait()
    assert(latest.includes('![图片]('),'Image deletion undo lost source')
  })
  await test('images preserve preview while editing Markdown source', async () => {
    await mount('Intro\n\n![Alt](assets/pic.png)\n\nEnd', { imageData: { 'assets/pic.png': 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="128" height="128"/%3E' } })
    editor.value.selectRange(10, 0); await wait()
    assert(document.querySelector('img') && !document.querySelector('textarea'), 'image disappeared during source editing')
    document.querySelector('img').click(); await wait(); assert(document.querySelector('.image-preview-overlay'), 'image viewer failed')
  })
  await test('task toggle below the caret preserves the reading position', async () => {
    const source = Array.from({ length: 60 }, (_, i) => `Paragraph ${i} with text.`).join('\n\n') + '\n\n> Keep this quote stable.\n\n- [ ] Task here\n\nEnd'
    await mount(source, { fixturePreviewCache: true })
    const view = nativeView(); view.dom.style.height = '600px'; view.scrollDOM.style.height = '600px'; editor.value.selectRange(0, 0); await wait()
    view.dispatch({ effects: EditorView.scrollIntoView(source.indexOf('- [ ]'), { y: 'center' }) })
    await wait(); await wait()
    const checkbox = document.querySelector('.cm-native-task'); assert(checkbox, `scrolled task not rendered: top=${view.scrollDOM.scrollTop} height=${view.scrollDOM.clientHeight} content=${view.contentHeight}`)
    const before = view.scrollDOM.scrollTop, rect = checkbox.getBoundingClientRect(), quote = document.querySelector('blockquote')
    assert(before > 300, 'fixture did not scroll')
    checkbox.focus({ preventScroll: true }); checkbox.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true })); checkbox.click()
    await wait(); await wait()
    assert(latest.includes('- [x] Task here'), 'task not toggled')
    assert(document.querySelector('.cm-native-task') === checkbox, 'checkbox was rebuilt and lost its focus')
    assert(quote && document.querySelector('blockquote') === quote, 'task toggle rebuilt unrelated rendered blocks')
    assert(Math.abs(view.scrollDOM.scrollTop - before) < 2, `task jumped from ${before} to ${view.scrollDOM.scrollTop}`)
    const after = document.querySelector('.cm-native-task').getBoundingClientRect()
    assert(Math.abs(after.top - rect.top) < 2, 'task position moved after toggle')
    assert(document.activeElement === checkbox, 'checkbox lost browser focus after toggle')
    checkbox.click(); await wait(); assert(latest.includes('- [ ] Task here'), 'reused checkbox cannot uncheck')
    checkbox.click(); await wait(); assert(latest.includes('- [x] Task here'), 'reused checkbox cannot check again')
    editor.value.undo(); await wait(); assert(latest.includes('- [ ] Task here'), 'task undo failed')
  })
  await test('task checkbox updates source and uses main history', async () => {
    await mount('Intro\n\n- [ ] Task\n\nEnd'); document.querySelector('.cm-native-task').click(); await wait()
    assert(latest.includes('- [x] Task'), 'task checkbox not saved')
    editor.value.undo(); await wait(); assert(latest.includes('- [ ] Task'), 'task checkbox not undoable')
  })
  await test('code newline grows numbering and shares main history', async () => {
    await mount('Intro\n\n```javascript\nconst a = 1\n```\n\nEnd'); editor.value.selectRange(32, 0)
    nativeNewline(nativeView()); await wait()
    assert(document.querySelectorAll('.cm-native-code-line[data-code-line]').length >= 2, 'line numbers did not grow')
    const copy = document.querySelector('.cm-native-code-copy-anchor'), code = document.querySelector('.cm-native-code-line')
    assert(copy && (copy.compareDocumentPosition(code) & Node.DOCUMENT_POSITION_FOLLOWING), 'copy control is not above code')
    assert(!document.querySelector('.cm-native-code-tools button'), 'copy control left in language footer')
    editor.value.undo(); await wait(); assert(latest === 'Intro\n\n```javascript\nconst a = 1\n```\n\nEnd', 'code edit has separate history')
    const language = document.querySelector('.cm-native-language'); language.value = 'python'; language.dispatchEvent(new Event('blur')); await wait()
    assert(latest.includes('```python'), 'language did not update source')
    assert([...document.querySelectorAll('datalist option')].some(option => option.value === 'javascript'), 'JavaScript missing from language list')
  })
  await test('preview is strictly readonly and footnotes have no duplicate body', async () => {
    const source = '## Heading\n\nBody[^n]\n\n[^n]: Footnote\n\nLast paragraph'
    await mount(source, { previewOnly: true, readOnly: true })
    assert(!document.querySelector('[contenteditable="true"]'), 'preview editable')
    assert(document.querySelectorAll('.footnotes').length === 1 && !document.querySelector('.footnotes h2'), 'duplicate footnotes or heading')
    const text = document.querySelector('.cm-content').textContent; assert(text.split('Last paragraph').length === 2, 'body duplicated')
    document.querySelector('h2').click(); editor.value.insertSnippet('bad'); editor.value.format('bold'); await wait(); assert(latest === source, 'readonly content modified')
  })
  await test('view shortcut does not open the CodeMirror diagnostics panel', async () => {
    for(const rich of [true,false]){
      await mount('正文内容',{rich});const view=nativeView();view.focus()
      view.contentDOM.dispatchEvent(new KeyboardEvent('keydown',{key:'M',code:'KeyM',keyCode:77,which:77,metaKey:true,shiftKey:true,bubbles:true,cancelable:true}));await wait()
      assert(!view.dom.querySelector('.cm-panel-lint'),'Cmd+Shift+M opened CodeMirror diagnostics in '+(rich?'rendered':'source')+' view')
    }
  })
  await test('view changes preserve native document and history', async () => {
    await mount('First\n\nSecond'); editor.value.selectRange(latest.length, 0); editor.value.insertSnippet('!'); await wait()
    settings.value = { rich: false }; await wait(); assert(!document.querySelector('.cm-native-preview'), 'source view still renders widgets')
    settings.value = { rich: true }; await wait(); editor.value.undo(); await wait(); assert(latest === 'First\n\nSecond', 'mode switch reset history')
    assert(document.querySelectorAll('.cm-editor').length === 1, 'mode switch recreated extra editors')
  })
  await test('inline markers follow the caret while headings remain rendered', async () => {
    await mount('# Heading\n\n**bold**')
    editor.value.selectRange(0, 0); await wait(); assert(!document.querySelector('.cm-native-heading').textContent.includes('#'), 'heading markers exposed')
    editor.value.selectRange(15, 0); await wait()
    assert(document.querySelector('.cm-content').textContent.includes('**bold**'), 'Caret did not reveal inline markers')
    editor.value.selectRange(0, 0); await wait()
    assert(!document.querySelector('.cm-content').textContent.includes('**'), 'Inline markers stayed visible after caret left')
  })
  await test('Mermaid stays rendered when its source range is selected', async () => {
    await mount('Intro\n\n```mermaid\ngraph TD\nA[Start] --> B[End]\n```\n\nEnd')
    for (let i = 0; i < 15 && !document.querySelector('.cm-mermaid-preview svg'); i++) await wait()
    assert(document.querySelector('.cm-mermaid-preview svg')?.textContent.includes('Start'), 'Mermaid node labels missing')
    editor.value.selectRange(30, 0); await wait()
    for (let i = 0; i < 15 && !document.querySelector('.cm-mermaid-preview svg'); i++) await wait()
    assert(!document.querySelector('.cm-native-code-line') && document.querySelector('.cm-mermaid-preview svg'), 'selecting the diagram revealed source markers')
  })
  await test('indented code remains editable without a fenced language control', async () => {
    await mount('    plain code\n\nEnd'); editor.value.selectRange(8, 0); editor.value.insertSnippet('!'); await wait()
    assert(latest.startsWith('    plai!n code'), 'indented code edit failed: ' + latest)
  })
  await test('links open on click but never from a noncollapsed selection', async () => {
    await mount('[Label](https://example.com)\n\nEnd')
    const opened = []; const original = window.open; window.open = url => { opened.push(url); return null }
    try {
      editor.value.selectRange(latest.length, 0); await wait()
      let link = document.querySelector('.cm-native-link'); const rect = link.getBoundingClientRect()
      link.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, ctrlKey: true, clientX: rect.left + 8, clientY: rect.top + 5 })); await wait()
      assert(opened.length === 1 && opened[0] === 'https://example.com', 'ordinary link click did not open')
      editor.value.selectRange(1, 3); await wait(); link = document.querySelector('.cm-native-link')
      link.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, ctrlKey: true, clientX: rect.left + 8, clientY: rect.top + 5 })); await wait()
      assert(opened.length === 1, 'selection unexpectedly opened URL')
    } finally { window.open = original }
  })
  await test('undo keeps the viewport near the edited paragraph', async () => {
    const source = Array.from({ length: 120 }, (_, i) => `Paragraph ${i} with enough text`).join('\n\n')
    await mount(source)
    const view = nativeView(); view.dom.style.height = '600px'; view.scrollDOM.style.height = '600px'
    const at = source.indexOf('Paragraph 70') + 15
    editor.value.selectRange(at, 0); await wait()
    view.scrollDOM.scrollTop = view.lineBlockAt(at).top; await wait()
    const before = view.scrollDOM.scrollTop
    assert(before > 100, 'viewport test did not scroll')
    nativeBackspace(view); await wait(); editor.value.undo(); await wait()
    assert(Math.abs(view.scrollDOM.scrollTop - before) < 80, 'undo jumped viewport: ' + before + ' -> ' + view.scrollDOM.scrollTop)
  })
  await test('tab remount retains the native undo history', async () => {
    await mount('Tab content', { docId: 'tab-history' })
    editor.value.selectRange(latest.length, 0); editor.value.insertSnippet('!'); await wait()
    const edited = latest
    await mount('Other tab', { docId: 'other-tab' })
    await mount(edited, { docId: 'tab-history' }); editor.value.undo(); await wait()
    assert(latest === 'Tab content', 'tab switch discarded history')
  })
  await test('italic on bold selection preserves both formats', async () => {
    await mount('**bold**')
    editor.value.selectRange(2, 4); editor.value.format('italic'); await wait()
    assert(latest === '***bold***', 'italic command removed bold: ' + latest)
  })
  for (const [kind, block] of [['code', '```javascript\nconst a = 1\n```'], ['quote', '> Quote\n> second line'], ['callout', '> [!NOTE]\n> Note text'], ['mermaid', '```mermaid\ngraph TD\nA[Start] --> B[End]\n```']]) {
    await test('caret coordinates after styled ' + kind, async () => {
      const source = 'Intro\n\n' + (kind === 'code' ? [block, block, block].join('\n\n') : block) + '\n\nTarget paragraph after block\n\nTail'
      await mount(source)
      const view = nativeView(), at = source.indexOf('Target paragraph') + 5
      if (kind === 'mermaid') for (let i = 0; i < 15 && !document.querySelector('.cm-mermaid-preview svg'); i++) await wait()
      await wait()
      const line = [...view.contentDOM.querySelectorAll('.cm-line')].find(element => element.textContent.includes('Target paragraph'))
      const walker = document.createTreeWalker(line, NodeFilter.SHOW_TEXT); const node = walker.nextNode()
      const range = document.createRange(); range.setStart(node, 5); range.setEnd(node, 6)
      const actual = range.getBoundingClientRect(), coords = view.coordsAtPos(at)
      const hit = view.posAtCoords({ x: actual.left + 1, y: (actual.top + actual.bottom) / 2 })
      assert(coords && Math.abs(coords.top - actual.top) < 3 && Math.abs(hit - at) <= 1, 'caret geometry shifted after ' + kind + ': expected ' + at + ', hit ' + hit + ', visual top ' + actual.top + ', CM top ' + coords?.top)
      // Replacing a previously active block must also invalidate native measurements.
      editor.value.selectRange(10, 0); await wait()
      editor.value.selectRange(at, 0); await wait()
      if (kind === 'mermaid') for (let i = 0; i < 15 && !document.querySelector('.cm-mermaid-preview svg'); i++) await wait()
      const nextLine = [...view.contentDOM.querySelectorAll('.cm-line')].find(element => element.textContent.includes('Target paragraph'))
      const nextNode = document.createTreeWalker(nextLine, NodeFilter.SHOW_TEXT).nextNode()
      const nextRange = document.createRange(); nextRange.setStart(nextNode, 5); nextRange.setEnd(nextNode, 6)
      const after = nextRange.getBoundingClientRect()
      const nextHit = view.posAtCoords({ x: after.left + 1, y: (after.top + after.bottom) / 2 })
      assert(Math.abs(nextHit - at) <= 1, 'caret shifted after leaving active ' + kind + ': ' + nextHit)

    })
  }
  for (const rich of [true, false]) await test('single click after switching view keeps collapsed selection ' + rich, async () => {
    const source = 'First paragraph\n\nTarget **bold text** here\n\nTail'
    await mount(source, { rich: !rich })
    editor.value.selectRange(2, 0); settings.value = { rich }; await wait()
    const view = nativeView(), at = source.indexOf('bold text') + 3, rect = view.coordsAtPos(at)
    const x = rect.left + 1, y = (rect.top + rect.bottom) / 2
    const target = document.elementFromPoint(x, y)
    target.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, button: 0, buttons: 1, detail: 1, clientX: x, clientY: y }))
    await wait()
    document.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, buttons: 1, clientX: x + 1, clientY: y }))
    document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, button: 0, buttons: 0, clientX: x + 1, clientY: y }))
    await wait()
    assert(view.state.selection.main.empty, 'stationary click selected text: ' + JSON.stringify(view.state.selection.main))
  })
  await test('rendered text still supports real dragging and Shift selection', async () => {
    await mount('First paragraph\n\nTarget **bold text** here\n\nTail')
    editor.value.selectRange(2, 0)
    const view = nativeView(), at = latest.indexOf('Target'), rect = view.coordsAtPos(at)
    const x = rect.left + 1, y = (rect.top + rect.bottom) / 2
    document.elementFromPoint(x, y).dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, button: 0, buttons: 1, detail: 1, clientX: x, clientY: y }))
    await wait()
    document.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, buttons: 1, clientX: x + 40, clientY: y }))
    document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, button: 0, buttons: 0, clientX: x + 40, clientY: y }))
    assert(!view.state.selection.main.empty, 'real drag no longer selects text')
    editor.value.selectRange(at, 0); await wait()
    const end = view.coordsAtPos(latest.indexOf('Tail'))
    document.elementFromPoint(end.left + 1, (end.top + end.bottom) / 2).dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, button: 0, buttons: 1, detail: 1, shiftKey: true, clientX: end.left + 1, clientY: (end.top + end.bottom) / 2 }))
    document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, button: 0, buttons: 0 }))
    assert(!view.state.selection.main.empty && view.state.selection.main.from === at, 'Shift click no longer extends selection')
  })



  for (const [name, block, text] of [['code', '```js\nconst value = 123\n```', 'const value'], ['mermaid', '```mermaid\ngraph TD\nA[Start] --> B[End]\n```', 'graph TD'], ['callout', '> [!NOTE]\n> Warning content', 'Warning content']]) await test('drag selection inside ' + name, async () => {
    const source = 'Intro\n\n' + block + '\n\nEnd'
    await mount(source); editor.value.selectRange(source.indexOf(text) + 2, 0); await wait()
    const view = nativeView(), from = source.indexOf(text) + 1, to = source.indexOf(text) + 6
    const first = view.coordsAtPos(from), last = view.coordsAtPos(to)
    const x = first.left + 1, y = (first.top + first.bottom) / 2
    const target = document.elementFromPoint(x, y)
    assert(target?.closest('.cm-line'), 'content obscured by ' + target?.className)
    target.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, button: 0, buttons: 1, detail: 1, clientX: x, clientY: y }))
    document.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, buttons: 1, clientX: last.left + 1, clientY: (last.top + last.bottom) / 2 }))
    document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, button: 0 }))
    await wait(); assert(!view.state.selection.main.empty, 'drag did not select code content')
    const row = target.closest('.cm-line'), highlight = getComputedStyle(row, '::selection').backgroundColor
    assert(highlight !== 'transparent' && highlight !== 'rgba(0, 0, 0, 0)', 'block background hides transparent native selection: ' + highlight)
    assert(!document.querySelector('.cm-selectionLayer'), 'native and drawn selection layers overlap')
  })
  await test('Enter creates an editable paragraph before existing text', async () => {
    await mount('First paragraph\n\nSecond paragraph')
    const view = nativeView(), at = latest.indexOf('\n')
    editor.value.selectRange(at, 0)
    view.contentDOM.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: 'Enter', code: 'Enter' })); await wait()
    assert(view.state.doc.lineAt(view.state.selection.main.head).text === '', 'new paragraph caret skipped into existing text')
    view.focus(); document.execCommand('insertText', false, 'New paragraph'); await wait()
    assert(latest === 'First paragraph\n\nNew paragraph\n\nSecond paragraph', 'new paragraph entered wrong location: ' + latest)
    editor.value.undo(); await wait(); assert(!latest.includes('New paragraph'), 'new paragraph typing is not undoable')
  })
  await test('Shift Enter preserves a hard line break inside a paragraph', async () => {
    await mount('FirstSecond')
    const view = nativeView(); editor.value.selectRange(5, 0)
    view.contentDOM.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: 'Enter', code: 'Enter', shiftKey: true })); await wait()
    assert(latest === 'First  \nSecond', 'Shift Enter did not insert a Markdown hard break: ' + latest)
    assert(!document.querySelector('.cm-ignored-blank-lines'), 'normal hard break was treated as a blank gap')
    assert(renderMarkdown(latest).includes('<br>'), 'hard break not preserved in preview')
  })
  await test('Enter in code keeps the native single newline', async () => {
    await mount('```js\nabc\n```')
    const view = nativeView(); editor.value.selectRange(8, 0)
    view.contentDOM.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: 'Enter', code: 'Enter' })); await wait()
    assert(!latest.includes('ab\n\nc'), 'paragraph Enter handler ran inside code')
    assert(/ab\n[ \t]*c/.test(latest), 'native code newline failed: ' + latest)
  })
  await test('empty default table remains stable and alignment retains input focus', async () => {
    await mount(''); editor.value.applyBlock('table'); await wait()
    const table = document.querySelector('table')
    assert(table?.rows.length === 3 && [...table.rows].every(row => row.cells.length === 3), 'default table is not 3x3')
    assert([...table.querySelectorAll('th,td')].every(cell => !cell.textContent.trim() && getComputedStyle(cell).textAlign.includes('center')), 'default cells should be blank and centered: ' + JSON.stringify([...table.querySelectorAll('th,td')].map(cell => ({ text: cell.textContent, align: getComputedStyle(cell).textAlign, html: cell.outerHTML }))))
    const cell = table.rows[1].cells[1], before = cell.getBoundingClientRect()
    cell.click(); await wait(); let input = document.querySelector('.cm-table-cell-input')
    assert(document.activeElement === input, 'empty cell did not focus')
    const after = cell.getBoundingClientRect(); assert(Math.abs(before.width - after.width) < 1 && Math.abs(before.height - after.height) < 1, 'empty cell changes size on editing: ' + JSON.stringify({before:before.toJSON(), after:after.toJSON()}))
    assert(document.querySelector('[aria-label="表格居中"]').getAttribute('aria-pressed') === 'true', 'centered column not marked')
    input.value = 'Hello'; input.setSelectionRange(2, 2)
    document.querySelector('[aria-label="表格右对齐"]').click(); await wait()
    input = document.querySelector('.cm-table-cell-input')
    assert(document.activeElement === input && input.value === 'Hello' && input.selectionStart === 2, 'alignment lost cell content or caret')
    assert(document.querySelector('[aria-label="表格右对齐"]').getAttribute('aria-pressed') === 'true', 'right alignment not marked')
  })
  await test('table allows paragraphs below and delete control follows content width', async () => {
    await mount(''); editor.value.applyBlock('table'); await wait()
    let view = nativeView(), table = document.querySelector('table')
    assert(latest.endsWith('\n\n') && view.state.selection.main.head === latest.length, 'table insertion lacks following paragraph')
    const caret = view.coordsAtPos(view.state.selection.main.head); assert(caret.top >= table.getBoundingClientRect().bottom - 1, 'caret remains above table')
    table.style.width = 'max-content'; await wait()
    const remove = document.querySelector('[aria-label="删除表格"]')
    assert(Math.abs(remove.getBoundingClientRect().right - table.getBoundingClientRect().right) < 2, 'delete control does not follow table width')
    const cell = table.rows[1].cells[0]
    cell.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, button: 0 })); assert(view.contentDOM.classList.contains('cm-table-editing'), 'cell mousedown leaves visible document caret')
    cell.click(); await wait(); const input = document.querySelector('.cm-table-cell-input'); input.value = 'Cell'
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })); await wait()
    view = nativeView(); table = document.querySelector('table')
    assert(document.activeElement === view.contentDOM && view.coordsAtPos(view.state.selection.main.head).top >= table.getBoundingClientRect().bottom - 1, 'Enter does not exit below table')
    view.dispatch(view.state.replaceSelection('Paragraph')); await wait(); assert(latest.endsWith('Paragraph') && document.querySelector('table'), 'cannot type paragraph after table')
  })
  await test('table controls align, resize and edit cells without duplicate formatting', async () => {
    await mount('Intro\n\n| A | B |\n| --- | --- |\n| One | Two |\n\nEnd')
    document.querySelector('td').click(); await wait()
    assert(document.querySelector('.cm-table-toolbar:not([hidden])'), 'toolbar not shown')
    assert(!document.querySelector('[aria-label="表格加粗"],[aria-label="表格斜体"],[aria-label="表格行内代码"],[aria-label="表格链接"]'), 'duplicate formatting controls remain')
    document.querySelector('[aria-label="表格居中"]').click(); await wait()
    assert(latest.includes(':---:'), 'column alignment failed')
    document.querySelector('[aria-label="调整表格尺寸"]').click()
    document.querySelector('[aria-label="3 行 3 列"]').click(); await wait()
    assert(document.querySelectorAll('tr').length === 3 && document.querySelector('tr').children.length === 3, 'size picker did not resize')
    const cell = document.querySelectorAll('tr')[2].cells[2]
    cell.click(); await wait()
    const input = document.querySelector('.cm-table-cell-input'); assert(input, 'cell editor missing')
    input.value = 'New value'; input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })); await wait()
    assert(latest.includes('New value') && document.querySelector('table'), 'cell text edit failed')
    editor.value.undo(); await wait(); assert(!latest.includes('New value'), 'table edit not in native history')
  })
  await test('horizontal rule stays rendered and can be selected and deleted', async () => {
    await mount('Before\n\n---\n\nAfter')
    document.querySelector('hr').click(); await wait()
    assert(document.querySelector('hr') && document.querySelector('.cm-selected-rule'), 'rule revealed source instead of selecting')
    assert(!nativeView().state.selection.main.empty && selectionInfo.block === 'hr', 'rule not selected')
    editor.value.deleteSelection(); await wait(); assert(!latest.includes('---'), 'selected rule not deleted')
    editor.value.undo(); await wait(); assert(document.querySelector('hr'), 'rule undo failed')
  })
  await test('slash commands do not indent and task checkbox hides the list dash', async () => {
    await mount('/\n\n- [ ] Task')
    document.querySelector('.cm-content').style.setProperty('--editor-indent', '2em')
    const line = document.querySelector('.cm-native-command-line')
    assert(line && getComputedStyle(line).textIndent === '0px', 'slash command line inherited paragraph indent')
    const task = document.querySelector('.cm-native-task').closest('.cm-line')
    assert(!task.textContent.includes('-'), 'task list still shows dash')
    document.querySelector('.cm-native-task').click(); await wait(); assert(latest.includes('- [x]'), 'task toggle no longer updates Markdown')
  })
  await test('ordinary link click edits while modifier click opens', async () => {
    await mount('[Label](https://example.com)\n\nEnd')
    editor.value.selectRange(latest.length, 0); await wait()
    const opened = [], original = window.open; window.open = url => { opened.push(url); return null }
    try {
      const link = document.querySelector('.cm-native-link'), rect = link.getBoundingClientRect()
      const options = { bubbles: true, cancelable: true, clientX: rect.left + 8, clientY: rect.top + 5 }
      link.dispatchEvent(new MouseEvent('click', options)); await wait(); assert(!opened.length, 'plain click opened URL')
      link.dispatchEvent(new MouseEvent('click', { ...options, ctrlKey: true })); await wait(); assert(opened[0] === 'https://example.com', 'modifier did not open URL')
    } finally { window.open = original }
  })
  await test('line height and paragraph spacing are independent', async () => {
    await mount('First line\nSecond line\n\nNext paragraph')
    const content = document.querySelector('.cm-content'), paragraph = document.querySelector('.cm-native-paragraph'), space = document.querySelector('.cm-native-paragraph-space')
    const lineBefore = getComputedStyle(paragraph).lineHeight
    content.style.setProperty('--editor-paragraph-spacing', '24px')
    assert(Math.abs(space.getBoundingClientRect().height - 24) < 1, 'paragraph spacing is not connected')
    assert(getComputedStyle(paragraph).lineHeight === lineBefore, 'paragraph spacing changed text line height')
    content.style.setProperty('--editor-line-height', '2.2')
    assert(getComputedStyle(paragraph).lineHeight !== lineBefore && Math.abs(space.getBoundingClientRect().height - 24) < 1, 'line height changed paragraph spacing')
  })
  await test('enabled plugin module edits through CodeMirror undo and cleans UI resources', async () => {
    await mount('Original text')
    const runtime = new PluginRuntime()
    runtime.bind({ active: () => ({ id: 'fixture', content: latest }), list: () => [], open: async () => {}, save: async () => {}, selection: () => editor.value.pluginSelection(), replace: (from, to, text) => editor.value.replaceRange(from, to, text), select: (from, to) => editor.value.selectRange(from, to - from), format: (command, value) => editor.value.format(command, value), undo: () => editor.value.undo(), redo: () => editor.value.redo(), root: () => '', notify: () => {}, prompt: async () => null })
    const pkg = { manifest: { apiVersion: 1, id: 'fixture.runtime', name: 'Fixture', version: '1.0.0' }, repo: 'fixture/plugin', downloadedAt: '', main: `export function activate(api) { api.registerCommand('edit', 'Edit', () => api.editor.replaceRange(0, 8, 'Plugin')); api.ui.addStyle('.plugin-fixture{color:red}'); api.ui.addMenuItem('edit'); api.events.on('document:change', () => {}); }` }
    await runtime.enable(pkg); await runtime.execute('fixture.runtime:edit'); await wait()
    assert(latest === 'Plugin text', 'plugin did not edit the real document')
    editor.value.undo(); await wait(); assert(latest === 'Original text', 'plugin edit bypassed native undo')
    editor.value.redo(); await wait(); assert(latest === 'Plugin text', 'plugin edit bypassed native redo')
    assert(document.querySelector('style[data-markart-plugin="fixture.runtime"]'), 'plugin style not attached')
    await runtime.disable(pkg.manifest.id)
    assert(!document.querySelector('style[data-markart-plugin="fixture.runtime"]') && !runtime.state.commands.length && !runtime.state.toolbar.length, 'plugin resources remain after disable')
    await runtime.dispose()
  })
  await test('online plugin package persists and removes without executing assets', async () => {
    const manifest = parsePluginManifest({ apiVersion: 1, id: 'fixture.plugin', name: 'Fixture', version: '1.0.0' })
    await savePlugin({ manifest, repo: 'fixture/plugin', directoryUrl: 'https://raw.githubusercontent.com/fixture/catalog/main/plugins.json', releaseUrl: 'https://github.com/fixture/plugin/releases/download/1.0.0', main: 'throw new Error("must not run")', downloadedAt: new Date().toISOString() })
    assert((await savedPlugins()).some(item => item.manifest.id === manifest.id && item.main.includes('must not run') && item.directoryUrl === 'https://raw.githubusercontent.com/fixture/catalog/main/plugins.json' && item.repo === 'fixture/plugin'), 'plugin package or source did not persist')
    await removePlugin(manifest.id)
    assert(!(await savedPlugins()).some(item => item.manifest.id === manifest.id), 'removed package remains in local storage')
  })
  await test('flowchart and mindmap nodes edit directly without showing Markdown', async () => {
    const ready=async()=>{for(let i=0;i<40&&!document.querySelector('.cm-diagram-node-tools');i++)await wait()}
    const clickNode=(label)=>{const node=[...document.querySelectorAll('g.node')].find(node=>node.textContent.includes(label));assert(node,'Node missing: '+label);node.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true}));return node}
    const enter=async(value)=>{for(let i=0;i<40&&!document.querySelector('.cm-diagram-label-editor input');i++)await wait();const input=document.querySelector('.cm-diagram-label-editor input');assert(input,'Node input missing');input.value=value;input.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true,cancelable:true}));await wait();await ready()}
    for (const source of ['```mermaid\ngraph TD\nA[Start] --> B{End}\n%% keep comment\n```', '```mindmap\nroot((Start))\n  End\n```']) {
      await mount('Intro\n\n'+source+'\n\nAfter');await ready()
      clickNode('Start').dispatchEvent(new MouseEvent('dblclick',{bubbles:true,cancelable:true}));await enter('Updated')
      assert(latest.includes('Updated')&&document.querySelector('.cm-mermaid-preview')?.textContent.includes('Updated')&&document.querySelectorAll('g.node').length===2,'Node rename did not preserve node identity: '+latest)
      assert(!document.querySelector('.cm-native-code-line'),'Graph source was revealed')
      clickNode('Updated');document.querySelector('.cm-diagram-add-child').click();await enter('New child')
      assert(document.querySelector('.cm-mermaid-preview')?.textContent.includes('New child'),'New node not rendered')
      clickNode('New child');document.querySelector('.cm-diagram-remove-node').click();await wait();await ready()
      assert(!document.querySelector('.cm-mermaid-preview')?.textContent.includes('New child'),'Deleted node remains: '+latest)
      editor.value.undo();await wait();await ready();assert(document.querySelector('.cm-mermaid-preview')?.textContent.includes('New child'),'Node deletion undo failed')
      const exported=await exportFragment(latest);assert(exported.querySelector('svg')?.textContent.includes('Updated')&&exported.querySelector('svg')?.textContent.includes('New child'),'Export did not reflect graph edits')
      if(source.includes('graph TD'))assert(latest.includes('B{End}')&&latest.includes('%% keep comment'),'Unrelated shape or comment lost')
      clickNode('Updated').dispatchEvent(new MouseEvent('dblclick',{bubbles:true,cancelable:true}));await enter('A & B [test] C:\\notes')
      assert([...document.querySelectorAll('g.node')].some(node=>node.textContent.replace(/\s/g,'').includes('A&B[test]C:\\notes')),'Special characters were interpreted as diagram syntax: '+JSON.stringify([...document.querySelectorAll('g.node')].map(node=>node.textContent)))
    }
  })
  await test('diagram keyboard editing stays in graph and root deletion is undoable', async () => {
    const ready=async()=>{for(let i=0;i<40&&!document.querySelector('.cm-diagram-node-tools');i++)await wait()}
    await mount('Before\n\n```mindmap\nroot((Topic))\n  First\n```\n\nAfter');await ready()
    const root=[...document.querySelectorAll('g.node')].find(node=>node.textContent.includes('Topic'))
    root.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true}));assert(selectionInfo.block==='mindmap','graph selection did not update format toolbar context')
    root.dispatchEvent(new MouseEvent('dblclick',{bubbles:true,cancelable:true}));await wait()
    const input=document.querySelector('.cm-diagram-label-editor input');input.value='Discarded';input.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true,cancelable:true}));await wait();assert(!latest.includes('Discarded'),'Escape committed an edit')
    const confirm=window.confirm;window.confirm=()=>true
    try{root.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true}));document.querySelector('[aria-label="删除整个脑图"]').click();await wait();assert(!latest.includes('```mindmap')&&latest.includes('Before')&&latest.includes('After'),'root deletion damaged surrounding text');editor.value.undo();await wait();await ready();assert(document.querySelector('.cm-mermaid-preview')?.textContent.includes('Topic'),'root deletion undo failed')}
    finally{window.confirm=confirm}
    const first=[...document.querySelectorAll('g.node')].find(node=>node.textContent.includes('First'));first.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true}));first.dispatchEvent(new KeyboardEvent('keydown',{key:'Delete',bubbles:true,cancelable:true}));await wait();await ready();assert(!document.querySelector('.cm-mermaid-preview')?.textContent.includes('First')&&latest.includes('Before')&&latest.includes('After'),'Delete key modified the document outside the graph')
  })
  await test('diagram labels edit without a box and flowchart shapes remain editable', async () => {
    await mount('```mermaid\ngraph TD\nA[Topic] --> B[End]\n```')
    for(let i=0;i<40&&!document.querySelector('.cm-diagram-node-tools');i++)await wait()
    const node=[...document.querySelectorAll('g.node')].find(node=>node.textContent.includes('Topic'))
    node.dispatchEvent(new MouseEvent('dblclick',{bubbles:true,cancelable:true}));await wait()
    const input=document.querySelector('.cm-diagram-label-editor input')
    assert(input && getComputedStyle(input).borderTopWidth==='0px' && getComputedStyle(input.parentElement).boxShadow==='none','Label editor still has a box')
    const box=input.getBoundingClientRect(), nodeBox=node.getBoundingClientRect()
    assert(Math.abs(box.left+box.width/2-nodeBox.left-nodeBox.width/2)<2,'Editor is not centered on node')
    input.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true,cancelable:true}));await wait()
    document.querySelector('.cm-diagram-actions [aria-label="节点形状"]').click()
    assert(!document.querySelector('.cm-diagram-shape-menu').hidden,'Shape picker did not open')
    document.querySelector('[data-shape="cyl"]').click()
    for(let i=0;i<40&&!latest.includes('shape: cyl');i++)await wait()
    assert(latest.includes('shape: cyl')&&latest.includes('label: "Topic"')&&latest.includes(' --> B[End]'),'Shape change damaged label or edge')
    for(let i=0;i<40&&!document.querySelector('.cm-diagram-node-tools');i++)await wait()
    assert(document.querySelector('g.node path'),'Database shape did not render')
    editor.value.undo();await wait()
    assert(latest.includes('A[Topic] --> B[End]'),'Shape change did not undo')
  })
  await test('diagram editing preference switches between source editing and visual controls', async () => {
    for(const graph of ['```mermaid\ngraph TD\nA[Start] --> B[End]\n```','```mindmap\nroot((Topic))\n  Child\n```']){
      const source='Before\n\n'+graph+'\n\nAfter'
      await mount(source,{diagramVisualEditing:false})
      editor.value.selectRange(source.indexOf('Before'),0);await wait()
      for(let i=0;i<40&&!document.querySelector('.cm-mermaid-preview svg');i++)await wait()
      assert(document.querySelector('.cm-mermaid-preview svg')&&!document.querySelector('.cm-diagram-node-tools'),'Disabled preference should still render diagram without controls')
      document.querySelector('.cm-mermaid-preview svg').dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true}));await wait()
      assert(document.querySelector('.cm-native-code-line'),'Disabled preference did not reveal Markdown source')
      settings.value={diagramVisualEditing:true};await wait()
      for(let i=0;i<40&&!document.querySelector('.cm-diagram-node-tools');i++)await wait()
      assert(document.querySelector('.cm-diagram-node-tools')&&!document.querySelector('.cm-native-code-line'),'Enabling preference did not restore visual editing')
      settings.value={diagramVisualEditing:false};await wait()
      assert(!document.querySelector('.cm-diagram-node-tools')&&document.querySelector('.cm-native-code-line'),'Disabling preference left graph controls behind')
      assert(latest===source,'Changing preference modified Markdown')
    }
  })
  await test('diagram controls appear on selection and connect nodes by clicking', async () => {
    const ready=async()=>{for(let i=0;i<40&&!document.querySelector('.cm-diagram-node-tools');i++)await wait()}
    const clickNode=label=>{const node=[...document.querySelectorAll('g.node')].find(node=>node.textContent.includes(label));assert(node,'Missing node '+label);node.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true}));return node}
    for(const source of ['```mindmap\nroot((Topic))\n  First\n```','```mermaid\ngraph TD\nA[Topic] --> B[First]\nC[Other]\n```']){
      await mount('Before\n\n'+source+'\n\nAfter');await ready()
      const directions=document.querySelector('.cm-diagram-directions'),shape=document.querySelector('.cm-diagram-actions [aria-label="节点形状"]'),remove=document.querySelector('.cm-diagram-delete')
      assert(directions.hidden&&shape.hidden,'Node controls appear without selection')
      assert(remove.classList.contains('cm-table-delete')&&getComputedStyle(remove).width==='25px'&&getComputedStyle(remove).height==='25px'&&remove.querySelector('svg').getAttribute('width')==='16','Delete does not match table button')
      assert(!document.querySelector('.cm-diagram-connector'),'Drag handle remains')
      clickNode('Topic');assert(!directions.hidden,'Directions did not appear on node selection')
      const graphBox=document.querySelector('.cm-diagram-block').getBoundingClientRect(),directionBox=directions.getBoundingClientRect(),removeBox=remove.getBoundingClientRect()
      assert(Math.abs(directionBox.left-graphBox.left)<2&&Math.abs(removeBox.right-graphBox.right)<2&&Math.abs(directionBox.top-removeBox.top)<2,'Directions and delete are not aligned to diagram edges')
      if(source.includes('mindmap')){assert(shape.hidden,'Mindmap exposes flowchart shapes');continue}
      assert(!shape.hidden&&!document.querySelector('[aria-label="连接节点"]').hidden,'Flowchart node tools did not appear')
      const nodeBox=[...document.querySelectorAll('g.node')].find(node=>node.textContent.includes('Topic')).getBoundingClientRect(),actionsBox=document.querySelector('.cm-diagram-actions').getBoundingClientRect()
      assert(Math.abs(actionsBox.left+actionsBox.width/2-nodeBox.left-nodeBox.width/2)<3,'Node tools do not follow the selected node')
      assert(Math.min(Math.abs(actionsBox.bottom-nodeBox.top),Math.abs(actionsBox.top-nodeBox.bottom))<60,'Node tools are too far from the node')

      const before=latest
      document.querySelector('[aria-label="连接节点"]').click()
      assert(document.querySelector('[aria-label="连接节点"]').getAttribute('aria-pressed')==='true','Link button has no active feedback')
      clickNode('Topic').dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true,cancelable:true}));await wait()
      assert(latest===before,'Cancelling a connection changed source')
      clickNode('Topic');document.querySelector('[aria-label="连接节点"]').click();clickNode('Other')
      for(let i=0;i<40&&!latest.includes('A --> C');i++)await wait();await ready()
      assert(latest.includes('A --> C')&&!latest.includes('%%'),'Connection is not pure Mermaid')
      clickNode('Topic');document.querySelector('[aria-label="连接节点"]').click();clickNode('Other');await wait()
      assert((latest.match(/A --> C/g)||[]).length===1,'Duplicate connection added')
      const edge=document.querySelector('path.cm-diagram-editable-edge[data-id*="L_A_B_"]');assert(edge,'Connection not selectable');edge.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true}));edge.dispatchEvent(new KeyboardEvent('keydown',{key:'Delete',bubbles:true,cancelable:true}))
      for(let i=0;i<40&&latest.includes('A[Topic] --> B[First]');i++)await wait();await ready()
      assert(latest.includes('A[Topic]')&&latest.includes('B[First]')&&!latest.includes('A[Topic] --> B[First]')&&latest.includes('A --> C'),'Disconnect damaged nodes or unrelated edges')
      editor.value.undo();await wait();await ready();assert(latest.includes('A[Topic] --> B[First]'),'Connection undo failed')
      document.querySelector('.cm-mermaid-preview').dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true}));assert(document.querySelector('.cm-diagram-directions').hidden&&document.querySelector('.cm-diagram-actions [aria-label="节点形状"]').hidden,'Background click did not hide node controls')
    }
  })
  await test('mindmap uses node-side minus and a compact diagram toolbar', async () => {
    await mount('Before\n\n```mindmap\nroot((Topic))\n  First\n    Child\n  Second\n```\n\nAfter')
    const ready=async()=>{for(let i=0;i<40&&!document.querySelector('.cm-diagram-node-tools');i++)await wait()};await ready()
    const toolbar=document.querySelector('.cm-diagram-node-tools')
    const visible=[...toolbar.querySelectorAll('button')].filter(button=>!button.hidden)
    assert(visible.length===4&&document.querySelector('.cm-diagram-delete'),'Mindmap should have four directions and a separate delete button')
    assert(visible.every(button=>button.querySelector('svg')),'Toolbar has non-SVG buttons')
    const node=[...document.querySelectorAll('g.node')].find(node=>node.textContent.includes('First'))
    node.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true}));await wait()
    const minus=document.querySelector('.cm-diagram-remove-node'),plus=document.querySelector('.cm-diagram-add-child')
    assert(!minus.hidden&&!minus.disabled&&!plus.hidden,'Selected node has no plus/minus controls')
    const oldConfirm=window.confirm;window.confirm=()=>true
    try{
      minus.click();for(let i=0;i<40&&latest.includes('First');i++)await wait()
      assert(!latest.includes('First')&&!latest.includes('Child')&&latest.includes('Second')&&latest.includes('Before')&&latest.includes('After'),'Node deletion damaged other content')
      editor.value.undo();await wait();await ready()
      assert(latest.includes('First')&&latest.includes('Child'),'Node deletion is not undoable')
      document.querySelector('[aria-label="删除整个脑图"]').click()
      for(let i=0;i<40&&latest.includes('mindmap');i++)await wait()
      assert(!latest.includes('Topic')&&latest.includes('Before')&&latest.includes('After'),'Delete diagram did not remove only the graph')
      editor.value.undo();await wait();await ready();assert(latest.includes('Topic')&&latest.includes('Child'),'Delete diagram is not undoable')
    }finally{window.confirm=oldConfirm}
  })
  await test('selected diagram node Tab creates and edits a child in one combined toolbar', async () => {
    for(const source of ['```mindmap\nroot((Topic))\n  First\n```','```mermaid\ngraph LR\nA[Topic] --> B[First]\n```']){
      await mount('Intro\n\n'+source+'\n\nAfter')
      for(let i=0;i<40&&!document.querySelector('.cm-diagram-node-tools');i++)await wait()
      const node=[...document.querySelectorAll('g.node')].find(node=>node.textContent.includes('Topic'))
      node.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true}))
      assert(!document.querySelector('.cm-diagram-add-child').hidden,'Selected node has no add button')
      const event=new KeyboardEvent('keydown',{key:'Tab',bubbles:true,cancelable:true});node.dispatchEvent(event)
      assert(event.defaultPrevented,'Tab moved browser focus')
      for(let i=0;i<40&&!document.querySelector('.cm-diagram-label-editor input');i++)await wait()
      const input=document.querySelector('.cm-diagram-label-editor input');assert(input&&input.value==='新节点','Tab did not create and start editing a new child');assert(document.activeElement===input,'New child is not focused')
      input.value='Tab child';input.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true,cancelable:true}));await wait()
      for(let i=0;i<40&&!document.querySelector('.cm-diagram-node-tools');i++)await wait()
      assert(latest.includes('Tab child')&&latest.includes('Intro')&&latest.includes('After'),'Tab child missing or surrounding document modified')
      assert(document.querySelectorAll('[role="toolbar"]').length===1&&!document.querySelector('.cm-diagram-toolbar'),'Direction controls remain in a separate toolbar')
      assert(document.querySelector('.cm-diagram-node-tools [aria-label="向左展开"]'),'Direction control missing from combined toolbar')
      const selected=document.querySelector('g.node.cm-diagram-node-selected');assert(selected&&document.activeElement===selected,'Focus did not return to the new child')
      selected.dispatchEvent(new KeyboardEvent('keydown',{key:'F2',bubbles:true,cancelable:true}));await wait()
      document.querySelector('.cm-diagram-label-editor input').dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true,cancelable:true}));await wait()
      assert(document.activeElement===selected,'Confirming an unchanged name lost node focus')
    }
  })
  await test('diagram toolbar changes flowchart and mindmap direction in source and exports', async () => {
    for (const source of ['```mermaid\ngraph TD\nA[Start] --> B[End]\n```', '```mindmap\nroot((Topic))\n  First\n```', '```mermaid\nmindmap\n  root((Topic))\n    First\n```']) {
      await mount('Intro\n\n' + source + '\n\nEnd')
      editor.value.selectRange(0, 0); await wait()
      for (let i=0;i<30&&!document.querySelector('.cm-mermaid-preview svg');i++) await wait()
      const initial=latest
      for (const [label,direction] of [['向左展开','RL'],['向下展开','TD'],['向上展开','BT'],['向右展开','LR']]) {
        const button=document.querySelector('.cm-diagram-node-tools [aria-label="'+label+'"]')
        assert(button,'diagram direction toolbar missing');button.click();await wait()
        assert(latest.includes(source.includes('graph TD')?'graph '+direction:'%% direction: '+direction),'direction was not saved')
        for (let i=0;i<30&&!document.querySelector('.cm-mermaid-preview svg');i++) await wait()
        const exported=await exportFragment(latest),nodes=[...exported.querySelectorAll('g.node')]
        const points=nodes.slice(0,2).map(node=>(node.getAttribute('transform')||'').match(/translate\(\s*([\d.-]+)[ ,]+([\d.-]+)/)?.slice(1).map(Number))
        assert(points.length===2&&points.every(Boolean),'diagram did not render after direction change')
        const [a,b]=points
        assert(direction==='RL'?a[0]>b[0]:direction==='LR'?a[0]<b[0]:direction==='TD'?a[1]<b[1]:a[1]>b[1],'export does not follow '+direction+': '+JSON.stringify(points))
      }
      editor.value.undo();await wait();assert(latest.includes('BT'),'direction change cannot be undone')
    }
  })
  await test('mindmap is selectable as a code language and renders in editor and exports', async () => {
    await mount('```text\nroot((Topic))\n  First\n  Second\n```\n\nEnd')
    const language = document.querySelector('.cm-native-language')
    assert(document.querySelector(`datalist#${language.getAttribute('list')} option[value="mindmap"]`), 'mindmap language option missing')
    language.value = 'mindmap'; language.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }))
    for (let i = 0; i < 30 && !document.querySelector('[data-diagram="mindmap"] svg'); i++) await wait()
    assert(latest.startsWith('```mindmap\n'), 'code language change not persisted')
    assert(document.querySelector('[data-diagram="mindmap"] svg')?.textContent.includes('Topic'), 'mindmap fence did not render')
    editor.value.selectRange(15, 0); await wait(); assert(selectionInfo.block === 'mindmap', 'mindmap toolbar context missing')
    const root = await exportFragment(latest)
    assert(root.querySelector('[data-diagram="mindmap"] svg')?.textContent.includes('First'), 'mindmap fence missing from export')
  })
  await test('mindmap renders and plugin manifests validate metadata only', async () => {
    await mount('Intro\n\n```mermaid\nmindmap\n  root((Topic))\n    First\n    Second\n```\n\nEnd')
    for (let i = 0; i < 25 && !document.querySelector('.cm-mermaid-preview svg'); i++) await wait()
    assert(document.querySelector('.cm-mermaid-preview[data-diagram="mindmap"] svg')?.textContent.includes('Topic'), 'mindmap labels missing')
    const nodes = [...document.querySelectorAll('.cm-mermaid-preview g.node')]
    const root = nodes.find(node => node.textContent.includes('Topic')), branch = nodes.find(node => node.textContent.includes('First'))
    assert(root && branch && root.getBoundingClientRect().left < branch.getBoundingClientRect().left, 'mindmap does not flow left to right')
    const manifest = parsePluginManifest({ apiVersion: 1, id: 'example.plugin', name: 'Example', version: '1.0.0', entry: 'ignored.js' })
    assert(manifest.id === 'example.plugin' && !('entry' in manifest), 'manifest retained executable metadata')
    let rejected = false
    try { parsePluginManifest({ ...manifest, id: 'invalid/id' }) } catch { rejected = true }
    assert(rejected, 'invalid plugin ID accepted')
  })
  await test('table cell focus keeps the format toolbar in table context', async () => {
    await mount('Intro\n\n| A | B |\n| --- | --- |\n| One | Two |\n\nEnd')
    editor.value.selectRange(2, 0); await wait()
    assert(selectionInfo.block === 'p', 'initial paragraph context missing')
    document.querySelector('td').click(); await wait()
    assert(selectionInfo.block === 'table' && selectionInfo.formatIds.includes('table'), 'table click left toolbar in ' + selectionInfo.block)
    assert(document.activeElement.classList.contains('cm-table-cell-input'), 'table context update stole cell input focus')
    document.querySelectorAll('td')[1].click(); await wait()
    assert(selectionInfo.block === 'table', 'switching cells lost table context')
    document.querySelector('[aria-label="调整表格尺寸"]').click(); await wait()
    assert(selectionInfo.block === 'table', 'table controls lost table context')
    editor.value.selectRange(latest.length, 0); await wait()
    assert(selectionInfo.block === 'p', 'table context did not clear on paragraph focus')
  })
  await test('table editing retains center and right alignment without moving the table', async () => {
    await mount('Intro\n\n| Centered | Right aligned |\n| :---: | ---: |\n| Center content | Right content |\n\nEnd')
    const table = document.querySelector('table'), before = table.getBoundingClientRect()
    for (const [column, expected] of [[0, 'center'], [1, 'right']]) {
      const cell = document.querySelectorAll('td')[column]
      assert(getComputedStyle(cell).textAlign.includes(expected), `rendered cell has wrong alignment: ${getComputedStyle(cell).textAlign} ${cell.outerHTML}`)
      cell.click(); await wait()
      const input = document.querySelector('.cm-table-cell-input')
      assert(getComputedStyle(input).textAlign.includes(expected), `editing ${expected} cell becomes ${getComputedStyle(input).textAlign}`)
      const after = table.getBoundingClientRect()
      assert(Math.abs(after.left - before.left) < 1 && Math.abs(after.width - before.width) < 1, 'table shifted or resized on focus')
    }
    assert(latest.includes('| :---: | ---: |'), 'clicking a cell modified source alignment')
  })
  await test('table single click edits and delete is undoable', async () => {
    await mount('Intro\n\n| A | B |\n| --- | --- |\n| One | Two |\n\nEnd')
    document.querySelector('td').click(); await wait()
    let input = document.querySelector('.cm-table-cell-input'); assert(input && document.activeElement === input, 'single click did not enter cell editing')
    assert(getComputedStyle(document.querySelector('.cm-content')).caretColor === 'rgba(0, 0, 0, 0)', 'table selection leaves a visible document caret')
    const remove = document.querySelector('[aria-label="删除表格"]'); assert(remove?.querySelector('svg'), 'table delete SVG missing')
    remove.click(); await wait(); assert(!document.querySelector('table') && !latest.includes('| A |'), 'table not deleted')
    editor.value.undo(); await wait(); assert(document.querySelector('table'), 'table delete not undoable')
  })
  await test('slash menu is anchored to caret and arrow keys select commands', async () => {
    await mount('Intro\n\n/')
    const view = nativeView(); editor.value.selectRange(latest.length, 0); await wait()
    const before = view.state.selection.main.head, menu = document.querySelector('.cm-slash-menu'), caret = view.coordsAtPos(before)
    assert(menu?.querySelector('button .command-label')?.textContent.trim() === '一级标题', 'headings are not first')
    assert([...menu.querySelectorAll('button')].every(button => button.querySelector('svg')), 'slash icon missing')
    assert(menu.querySelector('button .command-markdown')?.textContent === '#', 'Markdown hint missing')
    assert(menu && menu.getBoundingClientRect().top >= caret.top && Math.abs(menu.getBoundingClientRect().left - caret.left) < 30, 'slash menu is not near the caret: ' + JSON.stringify({ menu: menu?.getBoundingClientRect().toJSON(), caret, style: menu?.getAttribute('style') }))
    view.contentDOM.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: 'ArrowDown', code: 'ArrowDown' })); await wait()
    assert(view.state.selection.main.head === before, 'ArrowDown moved the document caret')
    assert([...menu.querySelectorAll('button')].indexOf(menu.querySelector('.active')) === 1, 'ArrowDown did not change menu selection')
    const label = menu.querySelector('.active').textContent
    view.contentDOM.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: 'Enter', code: 'Enter' })); await wait()
    assert(!latest.endsWith('/') && !document.querySelector('.cm-slash-menu'), 'Enter did not apply slash command ' + label)
  })
  await test('comments display in editor, stay out of exports, and footnotes have space', async () => {
    const source = 'Intro\n\n<!-- editor-only comment -->\n\nAfter[^n]\n\n[^n]: Note'
    await mount(source, { previewOnly: true, readOnly: true })
    assert(document.querySelector('.markart-comment')?.textContent === '<!-- editor-only comment -->', 'comment not displayed')
    assert(document.querySelector('.cm-content').textContent.includes('After'), 'comment shifted following blocks')
    const footnote = document.querySelector('sup'); assert(footnote && parseFloat(getComputedStyle(footnote).marginLeft) > 0, 'footnote has no separation')
    assert(!renderMarkdown(source).includes('editor-only comment'), 'export leaked comment')
  })
  await test('exports preserve explicit line breaks in paragraphs lists and Word', async () => {
    const source = 'First line\nSecond line\n\nSeparate paragraph\n\nHard break  \nNext line\n\n> Quote first\n> Quote second\n\n- Item first\n  Item continuation\n\n```text\ncode first\ncode second\n```'
    const root = await exportFragment(source)
    assert(root.querySelector('p').querySelectorAll('br').length === 1, 'plain newline lost in export')
    assert([...root.querySelectorAll('p')].find(node => node.textContent.includes('Hard break')).querySelectorAll('br').length === 1, 'hard break doubled')
    assert(root.querySelector('blockquote br') && root.querySelector('li br'), 'quote or list line break lost')
    assert(!root.querySelector('pre br') && root.querySelector('pre code').textContent.includes('code first\ncode second'), 'code block newlines changed')
    const bytes = await htmlToDocx('<body>' + root.innerHTML + '</body>', 'Line breaks', 'A4', 18)
    const zip = await JSZip.loadAsync(bytes), xml = await zip.file('word/document.xml').async('string')
    assert((xml.match(/<w:br(?:\s[^>]*)?\/>/g) || []).length >= 4, 'Word is missing explicit line breaks')
  })
  await test('shared static page uses export rendering and preserves mobile layout', async () => {
    const source = '> [!TIP]\n> Shared tip\n\n- [x] Task\n\n```javascript\nconst value = "hello";\n```\n\n```mermaid\nflowchart LR\nA[Start] --> B[End]\n```\n\n![Local](assets/image.png)\n\n![Remote](https://example.com/a.png)\n\n<!-- private comment -->'
    const html = await sharedPage('<Unsafe & title>', source, true, { 'assets/image.png': 'data:image/png;base64,aGVsbG8=' })
    const page = new DOMParser().parseFromString(html, 'text/html')
    assert(page.title === '<Unsafe & title> · Markart', 'share title not escaped')
    assert(page.querySelector('code .tok-keyword')?.style.color, 'share code colors missing')
    assert(page.querySelector('.cm-mermaid-preview svg')?.textContent.includes('Start'), 'share Mermaid missing')
    assert(page.querySelector('li.task-list-item') && html.includes('.callout-tip{border-color:#1f9d55'), 'share task or callout differs from export')
    assert(page.querySelector('img[alt="Local"]').src.startsWith('data:image/png'), 'local share image missing')
    assert(page.querySelector('img[alt="Remote"]').src === 'https://example.com/a.png', 'remote image removed')
    assert(!page.body.textContent.includes('private comment'), 'comment leaked into share')
    assert(page.querySelector('meta[name="viewport"]') && html.includes('max-width:860px'), 'mobile share layout lost')
    const plain = new DOMParser().parseFromString(await sharedPage('Plain', '<script>text</script>\nnext', false, {}), 'text/html')
    assert(!plain.querySelector('script') && plain.querySelector('pre').textContent === '<script>text</script>\nnext', 'plain share escaped incorrectly')
    const invalidDiagram = '```mermaid\nthis is not a diagram\n```'
    const fallback = new DOMParser().parseFromString(await sharedPage('Fallback', invalidDiagram, true, {}), 'text/html')
    assert(fallback.querySelector('pre code')?.textContent.includes('this is not a diagram'), 'share discarded invalid diagram source')
    let rejected = false
    try { await exportFragment(invalidDiagram) } catch { rejected = true }
    assert(rejected, 'export silently accepted an invalid diagram')
  })
  await test('exports show code language only for labelled code fences', async () => {
    const root = await exportFragment('```javascript\nconst value = 1;\n```\n\n```\nplain content\n```')
    const blocks = root.querySelectorAll('pre')
    assert(blocks[0].querySelector('.export-code-language')?.textContent === 'javascript', 'language label missing')
    assert(!blocks[1].querySelector('.export-code-language'), 'unlabelled code has a language label')
    assert(!blocks[0].querySelector('code').textContent.includes('javascript'), 'language label inserted into code content')
    const blob = await htmlToDocx('<html><body>' + root.innerHTML + '</body></html>', 'Code languages', 'A4', 18)
    const zip = await JSZip.loadAsync(blob), xml = await zip.file('word/document.xml').async('string')
    assert((xml.match(/>javascript</g) || []).length === 1 && xml.includes('w:val="right"'), 'Word language label missing or duplicated')
  })
  await test('static exports contain highlighted code, Mermaid, tables, alerts and tasks', async () => {
    const source = '# Export test\n\n<!-- hidden comment -->\n\n> [!WARNING]\n> Warning body\n\n| A | B |\n| --- | --- |\n| One | Two |\n\n- [x] Done\n- [ ] Todo\n\n```javascript\nconst value = "hello";\n```\n\n```mermaid\ngraph TD\nA[Start] --> B[End]\n```\n\n$$\n\\frac{1}{3} + x^2\n$$\n\n[Link](https://example.com) Note[^n]\n\n[^n]: Footnote content'
    const root = await exportFragment(source)
    assert(root.querySelector('code .tok-keyword')?.style.color, 'export has no syntax colors')
    assert(root.querySelector('.cm-mermaid-preview svg')?.textContent.includes('Start'), 'export Mermaid labels missing')
    assert(root.querySelector('table th') && root.querySelectorAll('li.task-list-item').length === 2, 'table or task structure missing')
    assert(exportStyles.includes('li.task-list-item{list-style:none}') && exportStyles.includes('.callout-warning{border-color:#e29c21'), 'export styles do not match task or warning rendering')
    assert(!root.textContent.includes('hidden comment'), 'comment leaked into export')
    const fixture = document.createElement('pre'); fixture.id = 'export-fixture'
    fixture.textContent = btoa(unescape(encodeURIComponent('<!doctype html><meta charset="utf-8"><style>' + exportStyles + 'body{font:16px/1.85 Arial;padding:30px}</style>' + root.innerHTML)))
    document.body.append(fixture)
    const word = await exportFragment(source, true)
    assert(word.querySelector('.cm-mermaid-preview img')?.src.startsWith('data:image/png'), 'Word Mermaid image was not embedded')
    const bytes = await htmlToDocx('<body data-export-font="PingFang SC" class="table-full">' + word.innerHTML + '</body>', 'Export test', 'A4', 18)
    const zip = await JSZip.loadAsync(bytes), xml = await zip.file('word/document.xml').async('string'), relations = await zip.file('word/_rels/document.xml.rels').async('string')
    assert(xml.includes('<w:gridCol w:w="') && !xml.includes('<w:tblGrid><w:gridCol w:w="100"/><w:gridCol w:w="100"/>') && xml.includes('One') && xml.includes('Two'), 'Word table widths or cell text invalid')
    assert(xml.includes('w:tbl') && xml.includes('a62871') && xml.includes('fdf7ed'), 'Word lost table, code colors or warning shading')
    assert(xml.includes('m:f') && xml.includes('m:sSup'), 'Word equation structure missing')
    assert(relations.includes('https://example.com') && Object.keys(zip.files).some(name => name.startsWith('word/media/')), 'Word hyperlinks or embedded image missing')
    assert((await zip.file('word/styles.xml').async('string')).includes('PingFang SC'), 'Word font preference missing')
    assert((await zip.file('word/footnotes.xml').async('string')).includes('Footnote content'), 'Word native footnote missing')
  })
  await test('switching between table cells preserves drafts and formatting', async () => {
    await mount('Intro\n\n| A | B |\n| --- | --- |\n| **One** | Two |\n\nEnd')
    const first = document.querySelector('td'); first.click(); await wait()
    const input = document.querySelector('.cm-table-cell-input'); input.value = '**Changed**'
    document.querySelectorAll('td')[1].click(); await wait()
    document.querySelector('.cm-table-cell-input').value = 'Other'
    document.querySelector('.cm-table-cell-input').dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'Enter' })); await wait()
    assert(latest.includes('**Changed**') && latest.includes('Other') && document.querySelector('td strong'), 'cell drafts lost during single-click switching')
    document.querySelector('td').click(); await wait()
    document.querySelector('.cm-table-cell-input').dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'Escape' })); await wait()
    assert(document.querySelector('td strong'), 'unchanged cell editing removed formatting')
  })
  await test('table width adapts to content or fills equally', async () => {
    await mount('| A | B |\n| --- | --- |\n| A much longer text value | X |')
    const root = document.querySelector('#app'), table = document.querySelector('table')
    const cells = table.querySelectorAll('th')
    assert(cells[0].getBoundingClientRect().width > cells[1].getBoundingClientRect().width * 2, 'content width did not fit longest value')
    root.classList.add('editor-table-full')
    assert(Math.abs(cells[0].getBoundingClientRect().width - cells[1].getBoundingClientRect().width) < 2, 'full table columns are not equal')
    assert(Math.abs(table.getBoundingClientRect().width - table.parentElement.getBoundingClientRect().width) < 2, 'full table does not fill Markdown width')
    root.classList.remove('editor-table-full')
  })
  await test('export uses current typography and table width preferences', async () => {
    let blob, error
    const create = URL.createObjectURL, click = HTMLAnchorElement.prototype.click
    URL.createObjectURL = value => { blob = value; return 'blob:export-fixture' }; HTMLAnchorElement.prototype.click = () => {}
    try {
      const exporter = useDocumentExport({ isTauri: false, activeDoc: testComputed(() => ({ path: 'test.md' })), content: testComputed(() => '这是普通段落。中文、English、数字 123 和标点符号应保持正常间距。\n同一段中的下一行用于检查换行显示。\n\n| A | B |\n| --- | --- |\n| One | Two |'), markdownActive: testComputed(() => true),
        fontSize: testComputed(() => 22), lineHeight: testComputed(() => 2.1), paragraphSpacing: testComputed(() => 20), tableWidth: testComputed(() => 'full'), exportFontFamily: testComputed(() => 'PingFang SC'), exportPageSize: testComputed(() => 'A4'), exportPageWidth: testComputed(() => 210), exportPageHeight: testComputed(() => 297), exportMargin: testComputed(() => 18), showExport: testRef(true), notify: message => { if (message.startsWith('导出失败')) error = message } })
      await exporter.download('html')
      assert(!error && blob, 'export hook failed: ' + error)
      const html = await blob.text()
      const exported = new DOMParser().parseFromString(html, 'text/html')
      assert(exported.querySelector('p br') && exported.querySelector('p').textContent.includes('同一段中的下一行'), 'downloaded HTML merged the supplied paragraph lines')
      const word = await htmlToDocx(html, 'Spacing', 'A4', 18), zip = await JSZip.loadAsync(word), styles = await zip.file('word/styles.xml').async('string')
      assert(styles.includes('w:line="693"') && styles.includes('w:lineRule="exact"') && styles.includes('w:after="300"'), 'Word line/paragraph units do not match 22px, 2.1, 20px')
      assert(styles.includes('w:snapToGrid w:val="false"') || styles.includes('w:snapToGrid w:val="0"'), 'Word inherits document grid')
      assert(html.includes('font:22px/2.1') && html.includes('--export-paragraph-spacing:20px') && html.includes('class="table-full"'), 'export preferences not connected')
    } finally { URL.createObjectURL = create; HTMLAnchorElement.prototype.click = click }
  })
  if (documentSource) await test('actual document export produces inspectable HTML and Word files', async () => {
    let blob, error
    const create = URL.createObjectURL, click = HTMLAnchorElement.prototype.click
    const source = documentImage ? documentSource.replaceAll('assets/format-test.png', documentImage) : documentSource
    URL.createObjectURL = value => { blob = value; return 'blob:actual-export' }; HTMLAnchorElement.prototype.click = () => {}
    try {
      const exporter = useDocumentExport({ isTauri: false, activeDoc: testComputed(() => ({ path: 'test-note.md' })), content: testComputed(() => source), markdownActive: testComputed(() => true),
        fontSize: testComputed(() => 17), lineHeight: testComputed(() => 1.85), paragraphSpacing: testComputed(() => 12), tableWidth: testComputed(() => 'content'), exportFontFamily: testComputed(() => 'PingFang SC'), exportPageSize: testComputed(() => 'A4'), exportPageWidth: testComputed(() => 210), exportPageHeight: testComputed(() => 297), exportMargin: testComputed(() => 18), showExport: testRef(true), notify: message => { if (message.startsWith('导出失败')) error = message } })
      await exporter.download('html'); assert(!error && blob, error || 'HTML not generated')
    } finally { URL.createObjectURL = create; HTMLAnchorElement.prototype.click = click }
    const html = await blob.text(), parsed = new DOMParser().parseFromString(html, 'text/html')
    const paragraph = [...parsed.querySelectorAll('p')].find(node => node.textContent.includes('这是普通段落'))
    assert(paragraph?.querySelector('br'), 'actual document lost the supplied line break')
    const fragment = await exportFragment(source, true)
    const wordHtml = html.replace(/<body([^>]*)>[\s\S]*<\/body>/, `<body$1>${fragment.innerHTML}</body>`)
    const bytes = await htmlToDocx(wordHtml, 'Markart 导出验证', 'A4', 18)
    document.getElementById('export-fixture')?.remove()
    const output = document.createElement('pre'); output.id = 'export-fixture'; output.textContent = btoa(unescape(encodeURIComponent(html))); document.body.append(output)
    const word = document.createElement('pre'); word.id = 'word-fixture'; word.textContent = btoa(String.fromCharCode(...bytes)); document.body.append(word)
  })
  if (documentSource) await test('actual document readonly rendering matches parser', async () => {
    await mount(documentSource, { previewOnly: true, readOnly: true })
    const root = document.createElement('div'); root.innerHTML = renderMarkdown(documentSource)
    assert(document.querySelectorAll('.cm-native-preview .callout').length === root.querySelectorAll('.callout').length, 'callouts shifted or missing')
    assert(!document.querySelector('.katex-error'), 'invalid formulas')
  })
  app?.unmount(); document.querySelector('#result').textContent = JSON.stringify(results)
}
run().catch(error => document.querySelector('#result').textContent = JSON.stringify([{ name: 'harness', pass: false, error: error.stack }]))
