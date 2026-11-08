import {readFileSync,writeFileSync,mkdtempSync} from 'node:fs'
import {dirname} from 'node:path'
import {execFileSync} from 'node:child_process'
import {parse,compileScript,compileTemplate} from '@vue/compiler-sfc'
import {build} from 'esbuild'
const dir=mkdtempSync('/tmp/markart-preferences-')
const controller=readFileSync('src/workspace/useWorkspaceController.ts','utf8')
const handler=controller.slice(controller.indexOf('function onKeydown(e: KeyboardEvent)'),controller.indexOf('function closePopoversOutside'))
const capture=/window\.addEventListener\('keydown', onKeydown, true\)/.test(controller)
const test=`import { installI18n } from './i18n';
import {createApp,ref,h,nextTick} from 'vue';import CodeEditor from './CodeEditor.vue';
import {EditorView} from '@codemirror/view';
import {eventChord,matchingShortcut} from './settings/shortcuts';
const editor=ref(null), text=ref('first word\\nsecond target'), shortcutOverrides=ref({});
const zoomShortcutDirection=()=>null;
const performShortcut=(action)=>{if(action==='underline')void editor.value.format('underline')};
${handler}
const app=createApp({render:()=>h(CodeEditor,{ref:editor,modelValue:text.value,'onUpdate:modelValue':value=>text.value=value,docId:'underline-fixture',fileKind:'markdown',rich:true})});installI18n(app);app.mount('#app');
window.addEventListener('keydown',onKeydown,${capture});
const tick=async()=>{await nextTick();await new Promise(r=>setTimeout(r,80))};
(async()=>{try{await tick();const cm=EditorView.findFromDOM(document.querySelector('.cm-editor'));
cm.dispatch({selection:{anchor:1},userEvent:'select.pointer'});await tick();
cm.dispatch({selection:{anchor:20},userEvent:'select.pointer'});cm.focus();await tick();
const before=cm.state.selection.main.head;
cm.contentDOM.dispatchEvent(new KeyboardEvent('keydown',{key:'u',code:'KeyU',metaKey:true,bubbles:true,cancelable:true}));await tick();
if(text.value!=='first word\\nsecond <u>target</u>')throw Error('Underline used another position: '+JSON.stringify({before,after:cm.state.selection.main.head,text:text.value}));
document.querySelector('#result').textContent='PASS Cmd+U underlines current word after changing caret position';
}catch(e){document.querySelector('#result').textContent='FAIL '+e.message+' '+e.stack}})();`

await build({stdin:{contents:test,resolveDir:process.cwd()+'/src',loader:'ts'},plugins:[{name:'vue',setup(b){b.onLoad({filter:/\.vue$/},args=>{const{descriptor}=parse(readFileSync(args.path,'utf8'));const script=compileScript(descriptor,{id:args.path,inlineTemplate:!!descriptor.scriptSetup,genDefaultAs:'Component'});let code=script.content;if(!descriptor.scriptSetup){const template=compileTemplate({source:descriptor.template.content,id:args.path,filename:args.path}).code.replace('export function render','function render');code+='\n'+template+'\nComponent.render=render;'}return{contents:code+'\nexport default Component',loader:'ts',resolveDir:dirname(args.path)}})}}],define:{'import.meta.env':'{}'},bundle:true,external:['buffer'],format:'iife',outfile:dir+'/test.js'})
writeFileSync(dir+'/test.js','try{'+readFileSync(dir+'/test.js','utf8')+'}catch(e){document.querySelector("#result").textContent="FAIL "+e.stack}');
writeFileSync(dir+'/test.html','<!doctype html><meta charset="utf-8"><style>'+readFileSync('src/style.css','utf8')+'.app-shell{height:800px;width:1100px;--ui-zoom:1}</style><div id="app"></div><pre id="result">WAIT</pre><script>window.onerror=(m,s,l,c,e)=>document.querySelector("#result").textContent="FAIL "+(e?.stack||m)</script><script>'+readFileSync(dir+'/test.js','utf8').replaceAll('</script>','<\\/script>')+'</script>')
const swift=readFileSync('scripts/fixtures/webkit-runner.swift','utf8').replace('result.hasPrefix("[")','(result.hasPrefix("PASS") || result.hasPrefix("FAIL"))');writeFileSync(dir+'/runner.swift',swift);execFileSync('swiftc',['-module-cache-path','/tmp/markart-swift-cache',dir+'/runner.swift','-o',dir+'/runner']);const output=execFileSync(dir+'/runner',[dir+'/test.html'],{encoding:'utf8',timeout:40000,maxBuffer:32*1024*1024});const result=output.match(/<pre id="result">(.*?)<\/pre>/s)?.[1];console.log(result);if(!result?.startsWith('PASS'))process.exitCode=1
