import { readFileSync, writeFileSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'
import ts from 'typescript'
import { parse, NodeTypes } from '@vue/compiler-dom'

const entries = []
const chinese = /[\u3400-\u9fff]/
function files(directory) { return readdirSync(directory, { withFileTypes: true }).flatMap(item => item.isDirectory() ? files(`${directory}/${item.name}`) : [`${directory}/${item.name}`]) }
function record(file, source, offset, text, category) {
  if (!text.trim()) return
  const line = source.slice(0, offset).split('\n').length
  const start = source.lastIndexOf('\n', offset - 1) + 1
  const stop = source.indexOf('\n', offset)
  const lineCode = source.slice(start, stop < 0 ? source.length : stop)
  const at = offset - start
  const code = lineCode.length <= 280 ? lineCode.trim() : (at > 110 ? '…' : '') + lineCode.slice(Math.max(0, at - 110), Math.min(lineCode.length, at + text.length + 110)).trim() + (at + text.length + 110 < lineCode.length ? '…' : '')
  entries.push({ file, line, category, text: text.trim(), code })
}
function inspectTs(file, source, fragment = source, base = 0, mode = 'code') {
  const ast = ts.createSourceFile(file + '.ts', fragment, ts.ScriptTarget.Latest, true)
  function visit(node) {
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node) || ts.isTemplateExpression(node)) {
      const raw = node.getText(ast)
      const text = ts.isTemplateExpression(node) ? raw.slice(1, -1) : node.text
      const parent = node.parent
      const property = ts.isPropertyAssignment(parent) ? parent.name.getText(ast) : ts.isBinaryExpression(parent) ? parent.left.getText(ast).split('.').pop() : ''
      const uiProperty = /^(label|title|placeholder|description|message|textContent|ariaLabel)$/.test(property.replace(/['"]/g, ''))
      if (chinese.test(text) || uiProperty) {
        let call = node.parent
        while (call && !ts.isCallExpression(call) && !ts.isSourceFile(call)) call = call.parent
        const context = call && ts.isCallExpression(call) ? call.expression.getText(ast) : ''
        const codeLine = fragment.slice(fragment.lastIndexOf('\n', node.getStart(ast)) + 1, fragment.indexOf('\n', node.getStart(ast)) < 0 ? fragment.length : fragment.indexOf('\n', node.getStart(ast)))
        const category = mode === 'template' ? '界面文案' : /(?:askFileAction|window\.confirm|window\.alert)$/.test(context) ? '弹窗／确认' : /(?:notify|Error|emit)$/.test(context) ? '提示／错误' : /(?:status|Status|Warning)/.test(codeLine) ? '状态文案' : '文案定义／其他'
        record(file, source, base + node.getStart(ast), text, category)
      }
      if (ts.isTemplateExpression(node)) return
    }
    ts.forEachChild(node, visit)
  }
  visit(ast)
}
for (const file of files('src')) {
  if (file.endsWith('.vue')) {
    const source = readFileSync(file, 'utf8')
    // Parse the template by itself so text offsets remain relative to the source file.
    const start = source.indexOf('<template>'), end = source.lastIndexOf('</template>')
    if (start >= 0) {
      const base = start + '<template>'.length
      const ast = parse(source.slice(base, end))
      function visit(node) {
        if (node.type === NodeTypes.TEXT) record(file, source, base + node.loc.start.offset, node.content, '界面文案')
        if (node.type === NodeTypes.INTERPOLATION) inspectTs(file, source, node.content.content, base + node.content.loc.start.offset, 'template')
        if (node.props) for (const prop of node.props) {
          if (prop.type === NodeTypes.ATTRIBUTE && prop.value && ['title', 'placeholder', 'aria-label', 'alt', 'label'].includes(prop.name)) record(file, source, base + prop.value.loc.start.offset, prop.value.content, '界面文案')
          if (prop.type === NodeTypes.DIRECTIVE && prop.exp) inspectTs(file, source, prop.exp.content, base + prop.exp.loc.start.offset, 'template')
        }
        node.children?.forEach(visit)
      }
      visit(ast)
    }
    for (const match of source.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)) inspectTs(file, source, match[1], match.index + match[0].indexOf('>') + 1)
  } else if (file.endsWith('.ts') && !file.endsWith('sample.ts')) inspectTs(file, readFileSync(file, 'utf8'))
}
for (const file of files('src-tauri/src').filter(file => file.endsWith('.rs'))) {
  const fullSource = readFileSync(file, 'utf8')
  const testModule = /#\[cfg\(test\)\]\s*mod tests\b/.exec(fullSource)
  const source = testModule ? fullSource.slice(0, testModule.index) : fullSource
  for (const match of source.matchAll(/"(?:\\.|[^"\\])*"/g)) {
    const text = match[0].slice(1, -1)
    if (!chinese.test(text)) continue
    const line = source.slice(0, match.index).split('\n').pop()
    if (line.trimStart().startsWith('//')) continue
    const context = source.slice(Math.max(0, match.index - 100), match.index)
    const category = /(?:MenuItem|Submenu|PredefinedMenuItem)::/.test(context) ? '系统菜单' : /(?:Err\(|error|map_err|format!)/.test(context) ? '提示／错误' : '原生文案／其他'
    record(file, source, match.index, text, category)
  }
}
const unique = [...new Map(entries.map(item => [[item.file,item.line,item.text].join('\0'),item])).values()].sort((a,b)=>a.file.localeCompare(b.file)||a.line-b.line)
const escape = text => text.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('|','&#124;').replaceAll('`','&#96;').replaceAll('\n','<br>')
const grouped = new Map()
for(const entry of unique) { if (!grouped.has(entry.file)) grouped.set(entry.file, []); grouped.get(entry.file).push(entry) }
const counts = Object.fromEntries([...new Set(unique.map(item=>item.category))].map(category=>[category,unique.filter(item=>item.category===category).length]))
let markdown = '# 界面与提示文案清单\n\n'
markdown += `共 ${unique.length} 处，涉及 ${grouped.size} 个文件。\n\n`
markdown += '按源码静态提取，排除测试模块和示例正文：包含按钮、菜单、设置、占位文字、辅助说明、提示、确认和原生错误。动态文件名、用户正文、插件提供的文字不在清单中。条件分支中的提示及未清理的旧代码也可能收录，不能据此判断某条文案当前一定可达。\n\n'
markdown += '`${…}`、`{…}` 是动态值，修改文案时保留占位表达式。行号对应生成清单时的源码；同一行有多条文案时，每条分别列出。\n\n'
markdown += '重新生成：`node scripts/list-ui-copy.mjs`。\n\n## 类型统计\n\n| 类型 | 数量 |\n|---|---:|\n' + Object.entries(counts).map(([category,count])=>`| ${category} | ${count} |`).join('\n')+'\n\n'
markdown += '## 弹窗与确认速查\n\n| 位置 | 当前文案 | 对应代码 |\n|---|---|---|\n' + unique.filter(item => item.category === '弹窗／确认').map(item => `| [${item.file}:${item.line}](${resolve(item.file)}:${item.line}) | ${escape(item.text)} | <code>${escape(item.code)}</code> |`).join('\n') + '\n\n'
markdown += '## 文件索引\n\n'+[...grouped].map(([file,items])=>`- [${file}](#${file.replace(/[^a-zA-Z0-9]/g,'-').toLowerCase()})：${items.length} 处`).join('\n')+'\n\n'
for(const [file,items] of grouped) {
  markdown += `<a id="${file.replace(/[^a-zA-Z0-9]/g,'-').toLowerCase()}"></a>\n\n## ${file}\n\n| 位置 | 类型 | 当前文案 | 对应代码（长行截取） |\n|---|---|---|---|\n`
  markdown += items.map(item=>`| [${item.line}](${resolve(file)}:${item.line}) | ${item.category} | ${escape(item.text)} | <code>${escape(item.code)}</code> |`).join('\n')+'\n\n'
}
writeFileSync('docs/ui-copy-inventory.md',markdown)
writeFileSync('docs/ui-copy-inventory.json',JSON.stringify(unique,null,2)+'\n')
console.log(JSON.stringify({entries:unique.length,files:grouped.size,categories:counts},null,2))
