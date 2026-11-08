import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { execFileSync } from 'node:child_process'
import { build } from 'esbuild'
import { parse, compileScript, compileTemplate } from '@vue/compiler-sfc'
const desktop = process.env.MARKART_TEST_DESKTOP === '1'
const dir = mkdtempSync('/tmp/markart-startup-')
await build({
  stdin: { contents: `import {createApp,nextTick} from 'vue';${desktop ? `localStorage.clear();window.__TAURI_INTERNALS__={metadata:{currentWindow:{label:'main'},currentWebview:{label:'main'}},transformCallback:()=>1,invoke:async command=>{if(command==='list_recent_workspaces')return ['/Notes'];if(command==='open_recent_workspace')return {name:'Notes',root:'/Notes',directories:[],files:[{relativePath:'test.md',utf8:true,updated:1,excerpt:'Test'}]};if(command==='read_document')return {content:'# Test',encoding:'utf-8',version:'1'};if(command==='github_has_token'||command==='webdav_has_password')return true;if(command==='plugin:window|is_fullscreen')return false;if(command==='plugin:event|listen')return 1;if(command==='plugin_list_installed')return [];if(command==='github_get_binding'||command==='webdav_get_binding')return null;if(/list|take_system_files|check_local_resources/.test(command))return [];return null}};localStorage.setItem('markart-prototype-v1',JSON.stringify({startupBehavior:'restore',outlineOpen:true}));` : ''}import App from './App.vue';import {installI18n} from './i18n';const app=createApp(App);app.config.errorHandler=error=>{document.querySelector('#result').textContent='FAIL '+String(error)+' '+error.stack};installI18n(app);app.mount('#app');nextTick(()=>{setTimeout(()=>{if(document.querySelector('#result').textContent.startsWith('FAIL'))return;const editor=document.querySelector('.cm-editor');if(!editor||!document.querySelector('.app-shell')${desktop ? "||!document.querySelector('.file-tree-directory')" : ''}){document.querySelector('#result').textContent='FAIL workspace did not mount '+document.querySelector('.toast')?.textContent;return}window.dispatchEvent(new KeyboardEvent('keydown',{key:'T',code:'KeyT',metaKey:true,shiftKey:true,bubbles:true}));nextTick(async()=>{const modal=document.querySelector('.theme-modal');if(!modal){document.querySelector('#result').textContent='FAIL theme dialog missing';return}const cards=modal.querySelectorAll('.theme-grid-item>button:not(.theme-grid-delete)');if(cards.length<5){document.querySelector('#result').textContent='FAIL shared theme cards missing';return}const bounds=modal.getBoundingClientRect();if(Math.abs((bounds.top+bounds.bottom)/2-innerHeight/2)>2){document.querySelector('#result').textContent='FAIL theme dialog is not centered';return}if(modal.querySelector('.reference-esc').tagName!=='SPAN'){document.querySelector('#result').textContent='FAIL ESC should be noninteractive';return}cards[1].click();await nextTick();if(!cards[1].classList.contains('active')){document.querySelector('#result').textContent='FAIL theme card did not select';return}window.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}));await nextTick();document.querySelector('#result').textContent=document.querySelector('.theme-modal')?'FAIL Escape did not close themes':'PASS workspace and editor mounted; centered shared theme cards select and close with Escape'})},300)})`, resolveDir: process.cwd() + '/src', loader: 'ts' },
  external: ['buffer'],
  plugins: [{ name: 'app-fixture', setup(builder) {
    builder.onResolve({ filter: /\?url$/ }, args => ({ path: resolve(process.cwd(), 'node_modules', args.path.slice(0, -4)), namespace: 'worker-url' }))
    builder.onLoad({ filter: /.*/, namespace: 'worker-url' }, args => ({ contents: 'export default URL.createObjectURL(new Blob([' + JSON.stringify(readFileSync(args.path, 'utf8')) + '],{type:"text/javascript"}))', loader: 'js' }))
    builder.onResolve({ filter: /\?raw$/ }, args => ({ path: resolve(args.resolveDir, args.path.slice(0, -4)), namespace: 'raw' }))
    builder.onLoad({ filter: /.*/, namespace: 'raw' }, args => ({ contents: readFileSync(args.path, 'utf8'), loader: 'text' }))
    builder.onLoad({ filter: /\.css$/ }, () => ({ contents: '', loader: 'text' }))
    builder.onLoad({ filter: /\.vue$/ }, args => {
      const { descriptor } = parse(readFileSync(args.path, 'utf8'))
      const script = compileScript(descriptor, { id: args.path, inlineTemplate: !!descriptor.scriptSetup, genDefaultAs: 'Component' })
      let code = script.content
      if (!descriptor.scriptSetup) code += '\n' + compileTemplate({ source: descriptor.template.content, id: args.path, filename: args.path }).code.replace('export function render', 'function render') + '\nComponent.render=render;'
      return { contents: code + '\nexport default Component', loader: 'ts', resolveDir: dirname(args.path) }
    })
  }}], define: { 'import.meta.env': '{}' }, bundle: true, format: 'iife', outfile: dir + '/test.js'
})
writeFileSync(dir + '/test.html', '<!doctype html><meta charset="utf-8"><style>' + readFileSync('src/style.css', 'utf8') + '</style><div id="app"></div><pre id="result">WAIT</pre><script>window.onerror=(message)=>document.querySelector("#result").textContent="FAIL "+message;window.onunhandledrejection=event=>document.querySelector("#result").textContent="FAIL "+event.reason;</script><script>' + readFileSync(dir + '/test.js', 'utf8').replaceAll('</script>', '<\\/script>') + '</script>')
const swift = readFileSync('scripts/fixtures/webkit-runner.swift', 'utf8').replace('result.hasPrefix("[")', '(result.hasPrefix("PASS") || result.hasPrefix("FAIL"))').replace('lastState = String(describing: value ?? error as Any)', 'lastState = "waiting for workspace"').replace(/print\(state\["html"\].*\n/, 'print(result)\n')
writeFileSync(dir + '/runner.swift', swift)
execFileSync('swiftc', ['-module-cache-path', '/tmp/markart-swift-cache', dir + '/runner.swift', '-o', dir + '/runner'])
const output = execFileSync(dir + '/runner', [dir + '/test.html'], { encoding: 'utf8', timeout: 40000, maxBuffer: 8 * 1024 * 1024 })
const result = output.match(/^(?:PASS|FAIL).*$/m)?.[0]
console.log(result)
if (!result?.startsWith('PASS')) process.exitCode = 1
