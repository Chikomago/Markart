import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { parse, compileScript } from '@vue/compiler-sfc'
import { build } from 'esbuild'
const { descriptor } = parse(readFileSync('src/EditorWorkspace.vue', 'utf8'), { filename: 'EditorWorkspace.vue' })
const script = compileScript(descriptor, { id: 'toolbar-i18n', genDefaultAs: 'WorkspaceOptions' }).content
const bundle = await build({ stdin: { contents: script + '\nexport default WorkspaceOptions', resolveDir: process.cwd() + '/src', loader: 'ts' }, bundle: true, platform: 'node', format: 'esm', write: false,
  plugins: [{ name: 'child-components', setup(build) { build.onLoad({ filter: /\.vue$/ }, () => ({ contents: 'export default {}', loader: 'js' })) } }] })
const { default: component } = await import(`data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString('base64')}`)
test('real formatting toolbar title helper resolves its translation import at runtime', () => {
  const setup = component.setup({ context: { assignedChord: () => '' } })
  assert.equal(setup.toolbarTitle('粗体', 'bold'), '粗体')
  assert.equal(setup.toolbarTitle('行内公式', 'inline-formula'), '行内公式')
})
