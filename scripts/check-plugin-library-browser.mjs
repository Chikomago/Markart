import {readFileSync,writeFileSync,mkdtempSync} from 'node:fs'
import {dirname} from 'node:path'
import {execFileSync} from 'node:child_process'
import {parse,compileScript,compileTemplate} from '@vue/compiler-sfc'
import {build} from 'esbuild'
const dir=mkdtempSync('/tmp/markart-preferences-')
const test=`import {installI18n} from './i18n';import {createApp,h,nextTick} from 'vue';import PluginSidebar from './plugins/PluginSidebar.vue';import {pluginRuntime} from './plugins/runtime';import {pluginSidebar} from './plugins/sidebarState';
pluginRuntime.bind({root:()=>'/fixture',active:()=>null,list:()=>[],notify(){}});
pluginRuntime.state.enabled=['test'];pluginRuntime.state.pluginNames={test:'Test plugin'};
pluginRuntime.state.views=['one','two','three'].map(id=>({id,owner:'test',title:id,location:'right',mount:el=>{el.textContent='Content '+id}}));
pluginSidebar.setWidth(280);pluginSidebar.state.selected=['one','two'];pluginSidebar.setOpen(true);
const app=createApp({render:()=>h('div',{class:'app-shell',style:{height:'700px',display:'flex',flexDirection:'row',justifyContent:'flex-end'}},[h('aside',{class:'sidebar',style:{width:'240px'}},[h('div',{class:'sidebar-top'}),h('div',{class:'side-tools'})]),h('div',{class:'pane-resizer sidebar-resizer'}),h('section',{class:'editing-workspace'},[h('div',{class:'editor-topbar'},[h('div',{class:'document-tabs'},'Tabs')])]),h(PluginSidebar)])});installI18n(app);app.mount('#app');
const tick=async()=>{await nextTick();await new Promise(r=>setTimeout(r,220))};
const point=(target,type,x,y)=>target.dispatchEvent(new PointerEvent(type,{button:0,pointerId:1,clientX:x,clientY:y,bubbles:true,cancelable:true}));
(async()=>{try{await tick();
const headers=['.sidebar-top','.editor-topbar','.plugin-sidebar-header'].map(selector=>document.querySelector(selector));
const edges=headers.map(element=>element.getBoundingClientRect().bottom);
if(Math.max(...edges)-Math.min(...edges)>.1)throw Error('Topbar borders do not align: '+JSON.stringify(edges));
if(parseFloat(getComputedStyle(document.querySelector('.side-tools')).borderTopWidth)>0)throw Error('Sidebar has a duplicate line below the topbar');
for(const selector of ['.sidebar-resizer','.plugin-sidebar-width-resizer']){
 const line=document.querySelector(selector);
 if(Math.abs(line.getBoundingClientRect().top-edges[0])>.1)throw Error('Resize hit area overlaps topbar: '+selector);
 if(parseFloat(getComputedStyle(line,'::after').opacity)>.36)throw Error('Resize line is too opaque: '+selector);
}
const panel=document.querySelector('.plugin-sidebar'),resizer=document.querySelector('.plugin-sidebar-width-resizer'),gripRect=resizer.getBoundingClientRect();
const originalWidth=panel.getBoundingClientRect().width;
point(resizer,'pointerdown',gripRect.x+2,gripRect.y+10);point(window,'pointermove',gripRect.x-78,gripRect.y+10);point(window,'pointerup',gripRect.x-78,gripRect.y+10);await tick();
if(Math.abs(panel.getBoundingClientRect().width-originalWidth-80)>1||pluginSidebar.state.width!==360)throw Error('Sidebar width drag did not commit');
const cancelRect=resizer.getBoundingClientRect();point(resizer,'pointerdown',cancelRect.x+2,cancelRect.y+10);point(window,'pointermove',cancelRect.x-38,cancelRect.y+10);window.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',cancelable:true}));await tick();
if(pluginSidebar.state.width!==360||Math.abs(panel.getBoundingClientRect().width-360)>1)throw Error('Escape did not cancel resize');
resizer.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowLeft',bubbles:true,cancelable:true}));await tick();
if(pluginSidebar.state.width!==370)throw Error('Keyboard resize failed');
document.querySelector('.plugin-sidebar-header button').click();await tick();
if(document.querySelector('.plugin-sidebar-library>header,.plugin-library-icon,.plugin-library-name small'))throw Error('Library still has expanded card content');
if(document.querySelector('.plugin-sidebar-block-header'))throw Error('Block still has host title or controls');
const list=document.querySelector('.plugin-library-list');if(!list)throw Error('Vertical library missing');
const rows=[...list.querySelectorAll('[data-library-view]')];if(rows[0].getBoundingClientRect().bottom>rows[1].getBoundingClientRect().top+1)throw Error('Library rows overlap');
if(rows.some(row=>row.getBoundingClientRect().height>36))throw Error('Plugin menu rows are not compact');
const grip=rows[1].querySelector('.plugin-library-grip'),a=grip.getBoundingClientRect(),b=rows[0].getBoundingClientRect();
point(grip,'pointerdown',a.x+5,a.y+5);point(window,'pointermove',b.x+10,b.y+2);point(window,'pointerup',b.x+10,b.y+2);await tick();
if(pluginSidebar.state.selected.join(',')!=='two,one')throw Error('Library reorder failed: '+pluginSidebar.state.selected);
const remove=list.querySelector('[data-library-view="two"] button[title="移出插件栏"]');remove.click();await tick();
if(pluginSidebar.state.selected.join(',')!=='one'||document.querySelector('[data-plugin-view="two"]'))throw Error('Remove from library failed');
const add=[...list.querySelectorAll('button[title="添加到插件栏"]')][0];if(!add)throw Error('Add control missing');add.click();await tick();
if(pluginSidebar.state.selected.length!==3)throw Error('Plugin add did not restore available views');
if(document.querySelectorAll('.plugin-sidebar-block').length!==3||document.querySelectorAll('.plugin-sidebar-separator').length!==2)throw Error('Blocks or resizers missing');
document.querySelector('#result').textContent='PASS sidebar width drag, cancel and keyboard adjustment; compact plugin menu reorders, unpins and pins views; blocks have no host title or controls and keep resizers';
}catch(e){document.querySelector('#result').textContent='FAIL '+e.message+' '+e.stack}})();`

await build({stdin:{contents:test,resolveDir:process.cwd()+'/src',loader:'ts'},plugins:[{name:'vue',setup(b){b.onLoad({filter:/\.vue$/},args=>{const{descriptor}=parse(readFileSync(args.path,'utf8'));const script=compileScript(descriptor,{id:args.path,inlineTemplate:!!descriptor.scriptSetup,genDefaultAs:'Component'});let code=script.content;if(!descriptor.scriptSetup){const template=compileTemplate({source:descriptor.template.content,id:args.path,filename:args.path}).code.replace('export function render','function render');code+='\n'+template+'\nComponent.render=render;'}return{contents:code+'\nexport default Component',loader:'ts',resolveDir:dirname(args.path)}})}}],define:{'import.meta.env':'{}'},bundle:true,external:['buffer'],format:'iife',outfile:dir+'/test.js'})
writeFileSync(dir+'/test.js','try{'+readFileSync(dir+'/test.js','utf8')+'}catch(e){document.querySelector("#result").textContent="FAIL "+e.stack}');
writeFileSync(dir+'/test.html','<!doctype html><meta charset="utf-8"><style>'+readFileSync('src/style.css','utf8')+readFileSync('src/themes/sky/theme.css','utf8')+['src/plugins/PluginSidebar.vue','src/plugins/PluginWorkspace.vue'].flatMap(path=>parse(readFileSync(path,'utf8')).descriptor.styles.map(style=>style.content.replace(/:deep\(([^)]+)\)/g,'$1'))).join('\n')+'.app-shell{height:800px;width:1100px;--ui-zoom:1}</style><div id="app"></div><pre id="result">WAIT</pre><script>window.onerror=(m,s,l,c,e)=>document.querySelector("#result").textContent="FAIL "+(e?.stack||m)</script><script>'+readFileSync(dir+'/test.js','utf8').replaceAll('</script>','<\\/script>')+'</script>')
const swift=readFileSync('scripts/fixtures/webkit-runner.swift','utf8').replace('result.hasPrefix("[")','(result.hasPrefix("PASS") || result.hasPrefix("FAIL"))');writeFileSync(dir+'/runner.swift',swift);execFileSync('swiftc',['-module-cache-path','/tmp/markart-swift-cache',dir+'/runner.swift','-o',dir+'/runner']);const output=execFileSync(dir+'/runner',[dir+'/test.html'],{encoding:'utf8',timeout:40000,maxBuffer:32*1024*1024});const result=output.match(/<pre id="result">(.*?)<\/pre>/s)?.[1];console.log(result);if(!result?.startsWith('PASS'))process.exitCode=1
