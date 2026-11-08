import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { execFileSync } from 'node:child_process'
import { build } from 'esbuild'
import { parse, compileScript, compileTemplate } from '@vue/compiler-sfc'
const componentStyles = []
const dir = mkdtempSync('/tmp/markart-startup-')
await build({
  stdin: { contents: readFileSync(process.argv[2] || 'scripts/fixtures/multidirectory-browser.ts', 'utf8').replaceAll("'../src/", "'./"), resolveDir: process.cwd() + '/src', loader: 'ts' },
  external: ['buffer'],
  plugins: [{ name: 'app-fixture', setup(builder) {
    builder.onResolve({ filter: /\?url$/ }, args => ({ path: resolve(process.cwd(), 'node_modules', args.path.slice(0, -4)), namespace: 'worker-url' }))
    builder.onLoad({ filter: /.*/, namespace: 'worker-url' }, args => ({ contents: 'export default URL.createObjectURL(new Blob([' + JSON.stringify(readFileSync(args.path, 'utf8')) + '],{type:"text/javascript"}))', loader: 'js' }))
    builder.onResolve({ filter: /\?raw$/ }, args => ({ path: resolve(args.resolveDir, args.path.slice(0, -4)), namespace: 'raw' }))
    builder.onLoad({ filter: /.*/, namespace: 'raw' }, args => ({ contents: readFileSync(args.path, 'utf8'), loader: 'text' }))
    builder.onLoad({ filter: /\.css$/ }, () => ({ contents: '', loader: 'text' }))
    builder.onLoad({ filter: /\.vue$/ }, args => {
      const { descriptor } = parse(readFileSync(args.path, 'utf8'))
      componentStyles.push(...descriptor.styles.map(style => style.content))
      const script = compileScript(descriptor, { id: args.path, inlineTemplate: !!descriptor.scriptSetup, genDefaultAs: 'Component' })
      let code = script.content
      if (!descriptor.scriptSetup) code += '\n' + compileTemplate({ source: descriptor.template.content, id: args.path, filename: args.path }).code.replace('export function render', 'function render') + '\nComponent.render=render;'
      return { contents: code + '\nexport default Component', loader: 'ts', resolveDir: dirname(args.path) }
    })
  }}], define: { 'import.meta.env': '{}' }, bundle: true, format: 'iife', outfile: dir + '/test.js'
})
writeFileSync(dir + '/test.html', '<!doctype html><meta charset="utf-8"><style>' + readFileSync('src/style.css', 'utf8') + componentStyles.join('\n') + '</style><div id="app"></div><pre id="result">WAIT</pre><script>window.onerror=(message)=>document.querySelector("#result").textContent="FAIL "+message;window.onunhandledrejection=event=>document.querySelector("#result").textContent="FAIL "+event.reason;</script><script>' + readFileSync(dir + '/test.js', 'utf8').replaceAll('</script>', '<\\/script>') + '</script>')
const swift = readFileSync('scripts/fixtures/webkit-runner.swift', 'utf8').replace('result.hasPrefix("[")', '(result.hasPrefix("PASS") || result.hasPrefix("FAIL"))').replace('lastState = String(describing: value ?? error as Any)', 'lastState = "waiting for workspace"').replace(/print\(state\["html"\].*\n/, 'print(result)\n')
writeFileSync(dir + '/runner.swift', swift)
execFileSync('swiftc', ['-module-cache-path', '/tmp/markart-swift-cache', dir + '/runner.swift', '-o', dir + '/runner'])
const output = execFileSync(dir + '/runner', [dir + '/test.html'], { encoding: 'utf8', timeout: 40000, maxBuffer: 8 * 1024 * 1024 })
const result = output.match(/^(?:PASS|FAIL).*$/m)?.[0]
console.log(result)
if (!result?.startsWith('PASS')) process.exitCode = 1
