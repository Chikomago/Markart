import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
const dir = mkdtempSync('/tmp/markart-sidebar-menu-')
const css = readFileSync('src/style.css', 'utf8').replace(/@import[^;]+;/g, '') + readFileSync('src/themes/white/theme.css', 'utf8')
const test = `
const results=[];
for (const width of [205,320]) for (const kind of ['file-filter-menu','sort-menu']) {
 document.querySelector('#fixture').innerHTML='<div class="workspace" style="display:flex;width:900px;height:600px"><aside class="sidebar" style="width:'+width+'px"><div class="side-tools"><span class="side-tools-folder">Notes</span><span class="file-menu-anchor"><button class="icon-button" style="width:30px;height:30px">Menu</button><div class="'+kind+'" style="height:180px"><button>Option</button></div></span></div></aside><main class="editor-pane" style="flex:1;background:white"></main></div>';
 const menu=document.querySelector('.'+kind), anchor=document.querySelector('.file-menu-anchor'),rect=menu.getBoundingClientRect(),button=anchor.getBoundingClientRect();
 const hit=document.elementFromPoint(rect.right-10,rect.top+20);
 results.push({name:kind+' at '+width+'px',pass:menu.contains(hit)&&Math.abs(rect.left-button.left)<1&&rect.top>=button.bottom,error:menu.contains(hit)?undefined:'Panel clipped or covered beyond sidebar'});
}
document.querySelector('#result').textContent=JSON.stringify(results);
`
writeFileSync(dir+'/test.html', '<!doctype html><meta charset="utf-8"><style>'+css+'</style><div id="fixture" class="app-shell" style="width:1000px;height:700px;--ui-zoom:1"></div><pre id="result">WAIT</pre><script>'+test+'</script>')
execFileSync('swiftc',['-module-cache-path','/tmp/markart-swift-cache','scripts/fixtures/webkit-runner.swift','-o',dir+'/runner'])
const html=execFileSync(dir+'/runner',[dir+'/test.html'],{encoding:'utf8',timeout:40000,maxBuffer:8*1024*1024})
const raw=html.match(/<pre id="result">([\s\S]*?)<\/pre>/)?.[1]
const results=JSON.parse(raw?.replaceAll('&amp;','&').replaceAll('&lt;','<').replaceAll('&gt;','>')||'null')
if(!Array.isArray(results))throw Error('Browser check did not complete')
for(const result of results)console.log((result.pass?'PASS ':'FAIL ')+result.name+(result.error?': '+result.error:''))
if(results.some(result=>!result.pass))process.exitCode=1
