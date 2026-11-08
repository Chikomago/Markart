import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { execFileSync, spawn } from 'node:child_process'
import { build } from 'esbuild'
import { parse, compileScript, compileTemplate } from '@vue/compiler-sfc'
const dir = mkdtempSync('/tmp/markart-export-tabs-')
writeFileSync(dir + '/source.html', '<!doctype html><meta charset="utf-8"><style>body{font:16px/1.8 sans-serif;color:#242926}table{border-collapse:collapse}td,th{border:1px solid #ddd;padding:8px}</style><h1>导出预览 Preview</h1><p>第一行<br>第二行</p><pre>const answer = 42</pre><table><tr><th>项目</th><th>状态</th></tr><tr><td>预览</td><td>正常</td></tr></table>')
for (const kind of ['pdf', 'png']) execFileSync(resolve('src-tauri/resources/pdf-export'), [dir + '/source.html', dir + '/preview.' + kind, 'A4', '18'])
const pdf = Array.from(readFileSync(dir + '/preview.pdf'))
const png = Array.from(readFileSync(dir + '/preview.png'))
const fixture = `
import {createApp,computed,ref,nextTick,h} from 'vue'
import ExportDialog from './documents/ExportDialog.vue'
import {useDocumentExport} from './documents/useDocumentExport'
import {installI18n,setLanguage} from './i18n'
const calls=[],notices=[]
const source=ref('# Preview\\n\\nFirst line\\nSecond line\\n\\n**Bold** and a note[^1]\\n\\n[^1]: Footnote text\\n\\n| Header | Status |\\n| --- | --- |\\n| Preview | Ready |\\n\\n\`\`\`js\\nconst answer = 42\\n\`\`\`')
const show=ref(true),saved=ref(''),sharing=ref(false);let shareStarts=0,shareStops=0
window.__TAURI_INTERNALS__={invoke:async(command,args)=>{calls.push({command,args});if(command==='render_export_preview')return args.kind==='pdf'?${JSON.stringify(pdf)}:${JSON.stringify(png)};if(command==='export_document'){saved.value=args.kind;return '/tmp/fixture.'+args.kind}throw Error('Unexpected '+command)}}
let api
setLanguage('zh-CN')
const app=createApp({setup(){api=useDocumentExport({isTauri:true,activeDoc:computed(()=>({id:'fixture',path:'preview.md',content:source.value})),content:computed(()=>source.value),markdownActive:computed(()=>true),fontSize:computed(()=>16),lineHeight:computed(()=>1.85),paragraphSpacing:computed(()=>12),tableWidth:computed(()=>'full'),exportFontFamily:computed(()=>'Arial'),exportPageSize:computed(()=>'A4'),exportPageWidth:computed(()=>210),exportPageHeight:computed(()=>297),exportMargin:computed(()=>18),showExport:show,notify:value=>notices.push(value)});return ()=>h(ExportDialog,{open:show.value,shareOpen:sharing.value,filename:'preview.md',revision:api.exportRevision.value,busy:api.exportBusy.value,isTauri:true,prepare:api.prepareExport,onDownload:api.download,onClose:()=>{show.value=false},onShare:()=>{sharing.value=true;shareStarts++},onStopShare:()=>{sharing.value=false;shareStops++}},{share:()=>h('div',{class:'fixture-share'},'Share QR')})}})
app.config.errorHandler=error=>{document.querySelector('#result').textContent='FAIL '+error.message+' '+error.stack+' '+document.querySelector('.export-preview-pane')?.outerHTML.slice(0,1000)}
installI18n(app);app.mount('#app')
function assert(value,message){if(!value)throw Error(message)}
async function waitFor(probe,message){const deadline=Date.now()+8000;while(Date.now()<deadline){await new Promise(resolve=>setTimeout(resolve,30));if(probe())return}throw Error(message+' '+document.querySelector('.export-preview-status')?.textContent)}
async function select(kind){document.body.dataset.testProgress=kind;document.querySelector('#export-tab-'+kind).click();await nextTick();await waitFor(()=>!document.querySelector('.export-preview-loading'),'Preview did not finish: '+kind);assert(!document.querySelector('.export-preview-status'),'Preview failed: '+document.querySelector('.export-preview-status')?.textContent)}
;(async()=>{try{
  document.body.dataset.testProgress='html-first';await waitFor(()=>document.querySelector('.export-preview-frame')?.contentDocument?.querySelector('h1'),'HTML preview did not render')
  assert(document.querySelectorAll('[role=tab]').length===6,'Five formats and share tab required')
  const dialog=document.querySelector('.export-preview-modal'),bounds=dialog.getBoundingClientRect()
  assert(Math.abs((bounds.top+bounds.bottom)/2-innerHeight/2)<2,'Export dialog is not centered')
  assert(dialog.querySelector('.reference-esc').tagName==='SPAN','ESC must be noninteractive')
  document.querySelector('#export-tab-share').click();await nextTick();
  assert(shareStarts===1&&sharing.value,'Share tab did not start sharing');
  assert(document.querySelector('.fixture-share'),'Share content is missing');
  assert(document.querySelector('.export-preview-footer'),'Share footer is missing');
  document.querySelector('#export-tab-html').click();await nextTick();
  assert(shareStops===1&&!sharing.value,'Leaving share tab did not stop sharing');
  assert(document.querySelector('.export-format-tabs').classList.contains('reference-tabs'),'Tabs do not reuse quick-reference styling');
  const htmlFrame=document.querySelector('[data-export-kind=html] iframe')
  let htmlLoads=0;htmlFrame.addEventListener('load',()=>{htmlLoads++})
  await select('txt')
  assert(document.querySelector('.export-text-preview').textContent.includes('First line\\nSecond line'),'Text preview lost line breaks')
  assert(!document.querySelector('.export-text-preview').textContent.includes('**Bold**'),'Text preview contains Markdown')
  await select('pdf')
  await waitFor(()=>document.querySelector('.export-pdf-page canvas')?.width>0,'PDF page canvas did not render')
  assert(!document.querySelector('[data-export-kind=pdf] iframe'),'PDF must not use the system viewer')
  assert(!document.querySelector('.export-pdf-preview button'),'PDF preview has unexpected controls')
  assert(document.querySelector('.export-preview-details').textContent==='A4 · 210 × 297 mm','PDF paper dimensions are incorrect')
  const pdfScroll=document.querySelector('.export-pdf-preview')
  assert(pdfScroll.scrollHeight>pdfScroll.clientHeight,'PDF page should scroll inside the preview')
  pdfScroll.scrollTop=120;assert(pdfScroll.scrollTop===120,'PDF scroll area did not scroll')
  assert(pdfScroll.scrollWidth<=pdfScroll.clientWidth+1,'PDF has a horizontal scrollbar')
  const pdfCanvas=document.querySelector('.export-pdf-page canvas')
  let pdfRenders=0;const context=pdfCanvas.getContext.bind(pdfCanvas);pdfCanvas.getContext=(...args)=>{pdfRenders++;return context(...args)}
  const pdfBackground=getComputedStyle(document.querySelector('.export-pdf-preview')).backgroundColor
  assert(pdfBackground==='rgb(255, 255, 255)','Paper preview background must be white')
  assert(getComputedStyle(document.querySelector('.export-pdf-page')).boxShadow!=='none','PDF paper shadow missing')
  assert((await api.prepareExport('pdf')).bytes.byteLength===${pdf.length},'PDF worker detached cached export bytes')
  await select('png')
  await waitFor(()=>document.querySelector('.export-image-preview img')?.naturalWidth>0,'PNG image did not decode')
  assert(getComputedStyle(document.querySelector('.export-image-preview')).backgroundColor===pdfBackground,'PNG and PDF backgrounds differ')
  const pngImage=document.querySelector('.export-image-preview img'),pngUrl=pngImage.src
  assert(document.querySelector('.export-preview-details').textContent===pngImage.naturalWidth+' × '+pngImage.naturalHeight+' px','PNG resolution is not the real image size')
  const pngCalls=calls.filter(call=>call.command==='render_export_preview'&&call.args.kind==='png').length
  await select('docx')
  await waitFor(()=>document.querySelector('.export-word-preview')?.shadowRoot?.querySelector('section.docx'),'Word file did not render')
  const word=document.querySelector('.export-word-preview').shadowRoot
  assert(word.textContent.includes('Footnote text'),'Word preview lost footnotes')
  assert(word.querySelector('table'),'Word preview lost table')
  assert(getComputedStyle(document.querySelector('.export-word-preview').parentElement).backgroundColor===pdfBackground,'Word and PDF backgrounds differ')
  assert(!document.querySelector('[data-export-kind=docx] iframe'),'Word must use the shared scrolling region')
  assert(document.querySelector('.export-preview-details').textContent==='A4 · 210 × 297 mm','Word paper dimensions are incorrect')
  const wordScroll=document.querySelector('.export-word-preview').parentElement
  assert(wordScroll.scrollWidth<=wordScroll.clientWidth+1,'Word has a horizontal scrollbar')
  wordScroll.scrollTop=90;const wordPosition=wordScroll.scrollTop
  await select('html')
  assert(document.querySelector('[data-export-kind=html] iframe')===htmlFrame,'HTML frame was recreated')
  assert(document.querySelector('.export-preview-details').textContent==='','HTML shows stale paper dimensions')
  assert(htmlLoads===0,'Switching views reloaded HTML')
  await select('pdf');await new Promise(resolve=>setTimeout(resolve,120))
  assert(document.querySelector('.export-pdf-page canvas')===pdfCanvas,'PDF page was recreated')
  assert(document.querySelector('.export-pdf-preview').scrollTop===120,'PDF scroll position was lost')
  assert(pdfRenders===0,'Cached PDF canvas was redrawn')
  await select('docx')
  assert(document.querySelector('.export-word-preview').shadowRoot===word,'Word file was rendered again')
  assert(document.querySelector('.export-word-preview').parentElement.scrollTop===wordPosition,'Word scroll position was lost')
  await select('png')
  assert(document.querySelector('.export-image-preview img')===pngImage&&pngImage.src===pngUrl,'PNG image was recreated')
  assert(calls.filter(call=>call.command==='render_export_preview'&&call.args.kind==='png').length===pngCalls,'Switching tabs regenerated cached PNG')
  document.querySelector('.export-preview-footer button').click()
  await waitFor(()=>saved.value==='png','Export button did not export selected format')
  const output=calls.find(call=>call.command==='export_document')
  assert(output.args.binaryContent.length===${png.length},'Saved PNG differs from preview bytes')
  assert(!show.value,'Export did not close after save')
  show.value=true;await nextTick();await select('html')
  source.value='# Updated preview';await nextTick()
  await waitFor(()=>document.querySelector('.export-preview-frame')?.contentDocument?.querySelector('h1')?.textContent==='Updated preview','Preview did not update after file changes')
  await select('pdf')
  const pixels=document.querySelector('.export-pdf-page canvas').getContext('2d').getImageData(0,0,200,200).data
  assert(pixels.some((value,index)=>index%4!==3&&value<200),'PDF page rendered blank')
  document.querySelector('#result').textContent='PASS five formats plus integrated sharing, quick-reference tabs, centered dialog, HTML/text/Word rendering, PDF pages without viewer controls, shared backgrounds/scroll region, retained HTML/PDF/PNG/Word previews and scroll positions, selected export and live refresh'
}catch(error){document.querySelector('#result').textContent='FAIL '+error.message+' '+error.stack+' '+document.querySelector('.export-preview-pane')?.outerHTML.slice(0,1000)}})()
`
await build({ stdin: { contents: fixture, resolveDir: process.cwd() + '/src', loader: 'ts' }, external: ['buffer'],
  plugins: [{ name: 'fixture-vue', setup(builder) {
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
  }}], define: { 'import.meta.env': '{}' }, bundle: true, format: 'iife', outfile: dir + '/test.js' })
writeFileSync(dir + '/test.html', '<!doctype html><meta charset="utf-8"><style>' + readFileSync('src/style.css', 'utf8') + readFileSync('src/themes/white/theme.css', 'utf8') + '#result{display:none}</style><div id="app" class="app-shell" style="position:fixed;inset:0"></div><pre id="result">WAIT</pre><script>window.onerror=(message)=>document.querySelector("#result").textContent="FAIL "+message;window.onunhandledrejection=event=>document.querySelector("#result").textContent="FAIL "+event.reason;</script><script>' + readFileSync(dir + '/test.js', 'utf8').replaceAll('</script>', '<\\/script>') + '</script>')
let swift = readFileSync('scripts/fixtures/webkit-runner.swift', 'utf8').replace('width: 1280, height: 16000', 'width: 1100, height: 900').replace('progress: document.body?.dataset.testProgress, html:', 'progress: document.body?.dataset.testProgress, preview: document.querySelector(\'.export-preview-pane\')?.outerHTML.slice(0,1200), frameReady: document.querySelector(\'iframe\')?.contentDocument?.readyState, html:').replace('result.hasPrefix("[")', '(result.hasPrefix("PASS") || result.hasPrefix("FAIL"))').replace('lastState = String(describing: value ?? error as Any)', 'lastState = String(describing: (value as? [String: Any])?.filter { $0.key != "html" } ?? [:])').replace(/print\(state\["html"\].*\n/, 'print(result)\n')
swift = swift.replace('print(result)\n            exit(0)', `web.takeSnapshot(with: nil) { image, error in
                if let data = image?.tiffRepresentation, let bitmap = NSBitmapImageRep(data: data), let png = bitmap.representation(using: .png, properties: [:]) { try? png.write(to: URL(fileURLWithPath: "${dir}/preview-ui.png")) }
                print(result)
                exit(0)
            }`)
swift = swift.replace('web.loadFileURL(page, allowingReadAccessTo: page.deletingLastPathComponent())', 'web.load(URLRequest(url: URL(string: CommandLine.arguments[1])!))')
writeFileSync(dir + '/runner.swift', swift)
execFileSync('swiftc', ['-module-cache-path', '/tmp/markart-swift-cache', dir + '/runner.swift', '-o', dir + '/runner'])
const server = spawn('python3', ['-u', '-c', 'import http.server,sys; handler=lambda *a,**kw:http.server.SimpleHTTPRequestHandler(*a,directory=sys.argv[1],**kw); server=http.server.ThreadingHTTPServer(("127.0.0.1",0),handler); print(server.server_port,flush=True); server.serve_forever()', dir], { stdio: ['ignore', 'pipe', 'ignore'] })
try {
  const port = await new Promise((resolve, reject) => { server.stdout.once('data', data => resolve(Number(String(data).trim()))); server.once('error', reject); server.once('exit', code => reject(Error('Fixture server exited '+code))) })
  const output = execFileSync(dir + '/runner', ['http://127.0.0.1:' + port + '/test.html'], { encoding: 'utf8', timeout: 40000, maxBuffer: 2 * 1024 * 1024 })
  console.log(output.trim()); console.log('Screenshot: ' + dir + '/preview-ui.png')
  if (!output.startsWith('PASS')) process.exitCode = 1
} finally { server.kill() }
