import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { execFileSync, spawn } from 'node:child_process'
import { build } from 'esbuild'
import { parse, compileScript, compileTemplate } from '@vue/compiler-sfc'
const componentStyles = []
const dir = mkdtempSync('/tmp/markart-ui-perf-')
await build({
  stdin: { contents: readFileSync('scripts/fixtures/file-tree-performance.ts', 'utf8').replaceAll("'../src/", "'./"), resolveDir: process.cwd() + '/src', loader: 'ts' },
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
writeFileSync(dir + '/test.html', '<!doctype html><meta charset="utf-8"><style>' + readFileSync('src/style.css', 'utf8') + componentStyles.join('\n') + '</style><div id="app"></div><pre id="result">WAIT</pre><script>window.__fileCount='+Number(process.argv[2]||10000)+';window.onerror=(message)=>document.querySelector("#result").textContent="FAIL "+message;window.onunhandledrejection=event=>document.querySelector("#result").textContent="FAIL "+event.reason;</script><script>' + readFileSync(dir + '/test.js', 'utf8').replaceAll('</script>', '<\\/script>') + '</script>')
let swift = readFileSync('scripts/fixtures/webkit-runner.swift','utf8')
 .replace(', html: document.documentElement.outerHTML','')
 .replace('window.contentView = web','window.contentView = web\nwindow.setFrameOrigin(NSPoint(x: 80, y: 80))\nwindow.orderFront(nil)')
 .replace('height: 16000','height: 900').replace('addingTimeInterval(30)','addingTimeInterval(120)')
 .replace('var lastState = "not loaded"','var lastState = "not loaded"\nvar lastStage = ""')
 .replace("result: document.querySelector", "stage: window.__perfStage, result: document.querySelector")
 .replace('checking = false\n        lastState', 'checking = false\n        if let state = value as? [String: Any], let stage = state["stage"] as? String, stage != lastStage { lastStage = stage; print("STAGE " + stage); fflush(stdout) }\n        lastState')
 .replace('lastState = String(describing: value ?? error as Any)','lastState = "performance test running"')
 .replace('result.hasPrefix("[")','(result.hasPrefix("PASS") || result.hasPrefix("FAIL"))')
 .replace(/print\(state\["html"\].*\n/,'print(result)\n')
writeFileSync(dir+'/runner.swift',swift)
execFileSync('swiftc',['-module-cache-path','/tmp/markart-swift-cache',dir+'/runner.swift','-o',dir+'/runner'])
const processes=()=>execFileSync('ps',['-axo','pid=,rss=,command='],{encoding:'utf8'}).trim().split('\n').map(line=>{const m=line.trim().match(/^(\d+)\s+(\d+)\s+(.*)$/);return m?{pid:+m[1],rssKB:+m[2],command:m[3]}:null}).filter(Boolean)
const existing=new Set(processes().map(p=>p.pid));let stage='startup',buffer='',result='',samples=[]
const runner=spawn(dir+'/runner',[dir+'/test.html'],{stdio:['ignore','pipe','pipe']})
const sample=()=>{const members=processes().filter(p=>p.pid===runner.pid||!existing.has(p.pid)&&/com.apple.WebKit.(WebContent|GPU|Networking)/.test(p.command));samples.push({stage,rssMB:members.reduce((sum,p)=>sum+p.rssKB,0)/1024,pids:members.map(p=>p.pid)})}
const interval=setInterval(sample,250)
runner.stdout.on('data',chunk=>{buffer+=chunk;let n;while((n=buffer.indexOf('\n'))>=0){const line=buffer.slice(0,n);buffer=buffer.slice(n+1);if(line.startsWith('STAGE ')){stage=line.slice(6);console.log(line);sample()}else if(/^(PASS|FAIL)/.test(line)){result=line;console.log(line)}}})
runner.stderr.on('data',()=>{})
const code=await new Promise(resolve=>runner.on('exit',resolve));clearInterval(interval)
const memory=Object.fromEntries([...new Set(samples.map(s=>s.stage))].map(key=>[key,{peakRssMB:Math.round(Math.max(...samples.filter(s=>s.stage===key).map(s=>s.rssMB))),pids:[...new Set(samples.filter(s=>s.stage===key).flatMap(s=>s.pids))]}]))
console.log('MEMORY '+JSON.stringify(memory));writeFileSync(dir+'/measurements.json',JSON.stringify({result,memory,samples},null,2));console.log('ARTIFACT '+dir+'/measurements.json')
if(code!==0||!result.startsWith('PASS'))process.exitCode=1
