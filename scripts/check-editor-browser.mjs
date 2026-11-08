import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { execFileSync } from 'node:child_process'
import { parse, compileScript } from '@vue/compiler-sfc'
import { build } from 'esbuild'

// Exercise the real Vue editor without touching an open Markart window.
const directory = mkdtempSync(join(tmpdir(), 'markart-editor-check-'))
const browser = process.env.MARKART_TEST_BROWSER || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const { descriptor } = parse(readFileSync('src/CodeEditor.vue', 'utf8'))
const component = compileScript(descriptor, { id: 'editor-check', inlineTemplate: true, genDefaultAs: 'TestEditor' }).content
const tests = readFileSync('scripts/fixtures/editor-browser.ts', 'utf8')
const documentImage = process.env.MARKART_TEST_IMAGE ? 'data:image/png;base64,' + readFileSync(process.env.MARKART_TEST_IMAGE).toString('base64') : ''
const documentSource = process.env.MARKART_TEST_DOCUMENT ? readFileSync(process.env.MARKART_TEST_DOCUMENT, 'utf8') : null
try {
  await build({ stdin: { contents: component + '\nconst documentSource = ' + JSON.stringify(documentSource) + ';\nconst documentImage = ' + JSON.stringify(documentImage) + ';\nconst testFilter = ' + JSON.stringify(process.env.MARKART_TEST_FILTER || '') + ';\n' + tests, resolveDir: `${process.cwd()}/src`, loader: 'ts' }, bundle: true, external: ['buffer'], format: 'iife', outfile: join(directory, 'check.js') })
  const bundle = readFileSync(join(directory, 'check.js'), 'utf8')
  writeFileSync(join(directory, 'check.js'), 'try {\n' + bundle + '\n} catch(error) { document.querySelector("#result").textContent=JSON.stringify([{name:"startup",pass:false,error:String(error.stack||error)}]) }')
  const styles = process.env.MARKART_TEST_STYLES ? '<style>' + readFileSync('src/style.css', 'utf8').replace(/@import[^;]+;/g, '') + readFileSync(`src/themes/${process.env.MARKART_TEST_THEME || 'white'}/theme.css`, 'utf8') + '</style>' : ''
  writeFileSync(join(directory, 'check.html'), '<!doctype html><html><head><meta charset="utf-8">' + styles + '</head><body><div id="app" class="app-shell" style="height:600px;--ui-zoom:1;--editor-font-size:16px;--editor-line-height:1.8"></div><pre id="result">WAIT</pre><script>window.onerror=(message,source,line,column,error)=>{if(document.querySelector("#result").textContent==="WAIT")document.querySelector("#result").textContent=JSON.stringify([{name:"startup",pass:false,error:String(error?.stack||message)}])}</script><script src="check.js"></script></body></html>')
  let html
  if (process.env.MARKART_TEST_ENGINE === 'webkit') {
    const executable = join(directory, 'webkit-runner')
    execFileSync('xcrun', ['swiftc', '-module-cache-path', join(directory, 'swift-cache'), 'scripts/fixtures/webkit-runner.swift', '-o', executable], { timeout: 120000 })
    html = execFileSync(executable, [join(directory, 'check.html')], { encoding: 'utf8', timeout: 40000, stdio: ['ignore', 'pipe', 'inherit'] })
  } else html = execFileSync(browser, ['--headless', '--no-sandbox', '--allow-file-access-from-files', '--disable-gpu', '--window-size=1280,16000', `--user-data-dir=${directory}/profile`, '--virtual-time-budget=16000', '--dump-dom', `file://${directory}/check.html`], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], timeout: 30000 })
  if (process.env.MARKART_EXPORT_FIXTURE) { const fixture = html.match(/<pre id="export-fixture">([^<]*)<\/pre>/)?.[1]; if (fixture) writeFileSync(process.env.MARKART_EXPORT_FIXTURE, Buffer.from(fixture, 'base64').toString('utf8')) }
  if (process.env.MARKART_WORD_FIXTURE) { const fixture = html.match(/<pre id="word-fixture">([^<]*)<\/pre>/)?.[1]; if (fixture) writeFileSync(process.env.MARKART_WORD_FIXTURE, Buffer.from(fixture, 'base64')) }
  const raw = html.match(/<pre id="result">([\s\S]*?)<\/pre>/)?.[1]
  const results = JSON.parse(raw?.replaceAll('&amp;', '&').replaceAll('&lt;', '<').replaceAll('&gt;', '>') || 'null')
  if (!Array.isArray(results)) throw Error('Browser tests did not complete')
  for (const result of results) console.log(`${result.pass ? 'PASS' : 'FAIL'} ${result.name}${result.error ? ': ' + result.error : ''}`)
  console.log(`${results.filter(result => result.pass).length}/${results.length} passed`)
  if (results.some(result => !result.pass)) process.exitCode = 1
} finally {
  rmSync(directory, { recursive: true, force: true })
}
