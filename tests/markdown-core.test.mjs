import test from 'node:test'
import assert from 'node:assert/strict'
import { build } from 'esbuild'

async function load(entry) {
  const bundle = await build({ entryPoints: [entry], bundle: true, platform: 'browser', format: 'esm', write: false })
  return import(`data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString('base64')}`)
}

const { headingsOf } = await load('src/editor/markdownCore.ts')
const { localImageSources, widthExtensionImages, imageAt, renderImageProperties } = await load('src/documents/imageProperties.ts')

test('大纲按语法树识别 ATX 和 Setext，忽略 YAML 与代码围栏', () => {
  const source = '---\ntitle: Metadata\n---\n# 一级\n\n```md\n# 不是标题\n```\n\n二级 *强调*\n----\n'
  const outline = headingsOf(source)
  assert.deepEqual(outline.map(item => [item.level, item.text, item.line]), [[1, '一级', 4], [2, '二级 强调', 10]])
})

test('读取正文中的本地图片，并兼容已有宽度标记', () => {
  const source = '![图](assets/a.png){width=128px}\n\n```md\n![忽略](code.png)\n```\n\n<img src="assets/b.png">'
  assert.deepEqual(localImageSources(source), ['assets/a.png', 'assets/b.png'])
  assert.match(widthExtensionImages(source), /<img src="assets\/a.png" alt="图" width="128">/)
})


test('修改图片属性只输出标准 Markdown，并移除已有宽度标记', () => {
  const source = '![图](assets/a.png "标题"){width=128px}'
  const draft = imageAt(source, 5)
  assert.equal(draft.width, 128)
  assert.equal(draft.to, source.length)
  assert.equal(renderImageProperties(draft), '![图](assets/a.png "标题")')
  assert.equal(renderImageProperties({ ...draft, width: 256 }), '![图](assets/a.png "标题")')
})
