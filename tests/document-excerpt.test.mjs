import test from 'node:test'
import assert from 'node:assert/strict'
import { build } from 'esbuild'

const bundle = await build({ entryPoints: ['src/files/documentExcerpt.ts'], bundle: true, platform: 'node', format: 'esm', write: false })
const { documentExcerpt } = await import(`data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString('base64')}`)

test('未搜索时显示文件开头两行内容', () => {
  assert.equal(documentExcerpt('# 标题\n\n第一行\n第二行', '', '').before, '标题 第一行')
})

test('内容搜索显示第一处命中附近并高亮原文字形', () => {
  const result = documentExcerpt('开头\n无关\n这一段包含 KeyWord 以及后文\n最后', '', 'keyword')
  assert.equal(result.match, 'KeyWord')
  assert.match(result.before, /这一段包含/)
  assert.doesNotMatch(result.after, /第二处/)
})

test('未打开的本地文件使用后端命中片段，文件名命中仍显示默认摘要', () => {
  assert.equal(documentExcerpt('', '开头摘要', '关键词', '附近 关键词 后面').match, '关键词')
  assert.equal(documentExcerpt('', '开头摘要', '标题').before, '开头摘要')
})
