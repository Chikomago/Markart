import { build } from 'esbuild'
import { writeFileSync } from 'node:fs'
import assert from 'node:assert/strict'
const bundle = await build({ stdin: { contents: "export {useCommandPalette} from './src/workspace/useCommandPalette';export {ref} from 'vue';export {formatIcons} from './src/editor/FormatIcon';export {slashCommands} from './src/editor/slashCommands';export {shortcutFormatIcons} from './src/editor/formatPresentation';export {createSSRApp,h} from 'vue';export {renderToString} from 'vue/server-renderer'", resolveDir: process.cwd(), loader: 'ts' }, bundle: true, platform: 'node', format: 'esm', write: false })
writeFileSync('/tmp/markart-command-palette-test.mjs', bundle.outputFiles[0].text)
const { useCommandPalette, ref, formatIcons, slashCommands, shortcutFormatIcons, createSSRApp, h, renderToString } = await import('file:///tmp/markart-command-palette-test.mjs')
const calls = []
const deps = new Proxy({ format: action => calls.push(action) }, { get: (target, key) => key in target ? target[key] : ref(false) })
const { commands } = useCommandPalette(deps, action => calls.push(action))
const items = commands.value
for (const labels of [['代码块','插入代码块'],['公式块','插入公式块'],['切换到源代码','切换源代码'],['表格','插入表格'],['保存','保存当前文件']]) assert.equal(items.filter(item => labels.includes(item.label)).length, 1, 'Repeated command: '+labels.join(' / '))
assert.equal(new Set(items.map(item => item.id)).size, items.length, 'Command IDs must be unique')
const formula = items.find(item => /行内公式/.test(item.label))
assert.ok(formula, 'Inline formula command missing')
assert.equal(formula.icon, 'inline-formula')
assert.equal(formula.marker, '$ $')
formula.action();assert.equal(calls.pop(),'inline-formula')
items.find(item => item.id === 'sourceView').action();assert.equal(calls.pop(),'sourceView')
const usedIcons = new Map()
for (const item of items) {
  const component = formatIcons[item.icon]
  const svg = component && (await renderToString(createSSRApp({ render: () => h(component) }))).replace(/class="[^"]*"/g, '')
  assert.ok(svg, 'Unmapped icon for '+item.label+': '+item.icon)
  assert.ok(!usedIcons.has(svg), 'Shared SVG for different commands: '+usedIcons.get(svg)+' / '+item.label)
  usedIcons.set(svg,item.label)
}
for (const slash of slashCommands) {
  assert.ok(formatIcons[slash.id], 'Slash icon missing: '+slash.id)
  const command = items.find(item => (shortcutFormatIcons[item.id] || item.icon) === slash.id)
  if (command) assert.equal(command.icon, slash.id, 'Inconsistent format icon: '+slash.id)
}
console.log('PASS unique SVG shapes for all command actions, complete slash icons, shared format icons, Markdown hints and command dispatch')
