import test from 'node:test'
import assert from 'node:assert/strict'
import { createProbe } from './fidelity.mjs'

const cases = [
  ['CRLF、空格与围栏', '# 标题\r\n\r\n- [x] 项目  \r\n\r\n```js\r\nconst x = 1\r\n```\r\n\r\n目标段落\r\n'],
  ['表格与引用式链接', '| a  | b |\n|:---|---:|\n| 一 | 二 |\n\n[名称][ref]\n\n[ref]: ./图 片.png\n\n目标段落\n'],
  ['YAML、HTML 与中文', '---\ntitle: 示例\n---\n\n<div data-x="1">保留</div>\n\n目标段落\n'],
  ['脚注、公式与尾随空行', '脚注[^a]  \n\n[^a]: 原样保留\n\n$$\na+b=c\n$$\n\n目标段落\n\n']
]

for (const [name, source] of cases) {
  test(`${name}：局部编辑、视图切换、撤销与重做`, () => {
    const probe = createProbe(source)
    const target = '目标段落'
    const rawFrom = source.indexOf(target)
    const from = probe.state.doc.toString().indexOf(target)
    assert.ok(from >= 0 && rawFrom >= 0)
    assert.ok(probe.nodes().length > 0)
    const edited = probe.edit(from, from + target.length, '改写段落')
    assert.equal(edited.slice(0, rawFrom), source.slice(0, rawFrom))
    assert.equal(edited.slice(rawFrom + '改写段落'.length), source.slice(rawFrom + target.length))
    assert.equal(probe.toggle('rich'), edited)
    assert.equal(probe.toggle('source'), edited)
    assert.equal(probe.undo(), source)
    assert.equal(probe.redo(), edited)
  })
}

test('换行符不会被局部事务自动改写', () => {
  const source = '第一行\r\n第二行\r\n第三行\r\n'
  const probe = createProbe(source)
  const from = probe.state.doc.toString().indexOf('第二')
  assert.equal(probe.edit(from, from + 2, '中间'), '第一行\r\n中间行\r\n第三行\r\n')
})

test('混合换行符在未编辑区域维持原样', () => {
  const source = '首行\r\n第二行\n末行\r\n'
  const probe = createProbe(source)
  const from = probe.state.doc.toString().indexOf('第二')
  assert.equal(probe.edit(from, from + 2, '中间'), '首行\r\n中间行\n末行\r\n')
})
