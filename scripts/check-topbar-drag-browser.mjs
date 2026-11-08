import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs'
import { dirname } from 'node:path'
import { execFileSync } from 'node:child_process'
import { parse, compileScript, compileTemplate } from '@vue/compiler-sfc'
import { build } from 'esbuild'
const dir = mkdtempSync('/tmp/markart-topbar-drag-')
const controller = readFileSync('src/workspace/useWorkspaceController.ts', 'utf8')
const bindings = controller.slice(controller.indexOf('const pinnedTopbarCommands ='), controller.indexOf('const editor ='))
const test = `
import {createApp,h,ref,computed,nextTick} from 'vue'
import {installI18n,setLanguage} from './i18n'
import MenuBar from './MenuBar.vue'
import {useWorkspaceCommands} from './workspace/useWorkspaceCommands'
import {pluginRuntime} from './plugins/runtime'
import {useTopbarDrag,reorderTopbarItems} from './workspace/useTopbarDrag'
import * as topbar from './workspace/topbar'
const visiblePinnedTopbarItems=topbar.visiblePinnedTopbarItems
let clicks=0
window.pluginClicks=0
pluginRuntime.bind({root:()=>'/fixture',active:()=>null,list:()=>[],notify:message=>{throw Error(message)}})
localStorage.removeItem('markart-pinned-topbar-v1')
const side=ref(['sidebar','settings','files']),defaults=['theme','export']
let state
setLanguage('zh-CN')
const app=createApp({setup(){
  const topbarLayout=computed(()=>({sidebarTop:side.value,editorTop:defaults.filter(id=>id!=='theme')}))
  const topbarMoreCommands=[...defaults]
  const saveTopbar=layout=>{side.value=layout.sidebarTop}
  ${bindings}
  pinnedTopbarCommands.value=['theme','export']
  const showThemes=ref(false),showSettings=ref(false),settingTab=ref('editor'),selectedTheme=ref('light')
  const commands=useWorkspaceCommands({showThemes,showSettings,settingTab,topbarLayout})
  const showTopbarMore=ref(false)
  state={pinnedTopbarCommands,visibleTopbarCommands,toggleTopbarPin,showSettings,selectedTheme,showThemes}
  const context={startTopbarDrag,suppressTopbarClick,visibleTopbarCommands,pinnedTopbarCommands,topbarLayout,topbarMoreCommands,toggleTopbarPin,
    commandTitle:id=>id,commandInfo:id=>({label:id}),commandActive:()=>false,commandDisabled:()=>false,commandIcon:()=> 'span',onTopbarClick:(event,id)=>{clicks++;if(id==='theme')commands.activateTopbar(id,event.currentTarget)},onTopbarMoreClick:()=>{},
    mode:ref('source'),markdownActive:true,setMode:()=>clicks++,showThemes,showTopbarMore,showNewMenu:ref(false),toggleTopbarMore:()=>{showTopbarMore.value=!showTopbarMore.value},
    allThemes:[{name:'light',label:'Light'}],themeName:selectedTheme,selectTheme:name=>{selectedTheme.value=name},templates:[]}
  return()=>h('div',{class:'app-shell'},[h(MenuBar,{context,area:'sidebarTop'}),h(MenuBar,{context,area:'editorTop'})])
}})
installI18n(app);app.mount('#app')
const tick=async()=>{await nextTick();await new Promise(r=>setTimeout(r,25))}
function down(element,meta=true){const r=element.getBoundingClientRect();element.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,button:0,metaKey:meta,clientX:r.left+r.width/2,clientY:r.top+r.height/2}))}
function move(element){const r=element.getBoundingClientRect();window.dispatchEvent(new PointerEvent('pointermove',{bubbles:true,clientX:r.left+1,clientY:r.top+r.height/2}))}
function up(){window.dispatchEvent(new PointerEvent('pointerup',{bubbles:true}))}
function assert(value,message){if(!value)throw Error(message)}
const pluginId='test.topbar:inspect'
const pkg={manifest:{id:'test.topbar',name:'Fixture',version:'1.0.0'},main:"export function activate(api){api.commands.register({id:'inspect',title:'Plugin inspector',icon:'search',run(){window.pluginClicks++}});api.ui.registerAction({id:'inspect',commandId:'inspect',location:'topbar-menu'});api.ui.addMenuItem('inspect')}"}
;(async()=>{try{
  await tick()
  const themeButton=document.querySelector('.top-actions .theme-trigger')
  themeButton.click();await tick()
  assert(state.showThemes.value,'Pinned theme button did not request the theme dialog')
  assert(!state.showSettings.value,'Theme button redirected to preferences')
  assert(!document.querySelector('.top-actions .theme-popover'),'Old theme popover is still mounted')
  state.showThemes.value=false;await tick()
  assert(!document.querySelector('.mode-menu-trigger'),'View switch must be in the status bar');
  await pluginRuntime.enable(pkg);await tick()
  assert(!document.querySelector('[data-topbar-id="'+pluginId+'"]'),'Unpinned plugin appeared in topbar')
  document.querySelector('.topbar-overflow').click();await tick()
  let action=document.querySelector('.plugin-actions-menu button[role="menuitem"]')
  assert(action,'Registered topbar-menu action is missing')
  const row=action.closest('.topbar-more-row')
  assert(row?.querySelector('.topbar-more-pin'),'Plugin menu action has no pin control')
  row.querySelector('.topbar-more-pin').click();await tick()
  let plugin=document.querySelector('[data-topbar-id="'+pluginId+'"]')
  assert(plugin,'Pinned plugin icon is missing')
  const mode=document.querySelector('.top-actions [data-topbar-id="theme"]')
  down(plugin);move(mode)
  assert(document.querySelector('.topbar-drop-marker'),'Plugin drag has no insertion marker')
  up();plugin.querySelector('button').click();await tick()
  assert(window.pluginClicks===0,'Dragging activated the plugin command')
  assert(state.visibleTopbarCommands.value[0]===pluginId,'Plugin did not move before built-in icon')
  assert(JSON.parse(localStorage.getItem('markart-pinned-topbar-v1'))[0]===pluginId,'Plugin order was not saved')
  await tick();plugin=document.querySelector('[data-topbar-id="'+pluginId+'"]');plugin.querySelector('button').click();await tick()
  assert(window.pluginClicks===1,'Ordinary plugin click failed')
  const theme=document.querySelector('.top-actions [data-topbar-id="theme"]')
  down(theme,false);move(mode);assert(!document.querySelector('.topbar-drop-marker'),'Ordinary pointer starts dragging');up()
  down(theme);move(plugin);window.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape'}));await tick()
  assert(!document.querySelector('.topbar-drop-marker'),'Escape did not remove marker')
  assert(state.visibleTopbarCommands.value[0]===pluginId,'Escape committed a reorder')
  const files=document.querySelector('.sidebar-topbar-icons [data-topbar-id="files"]'),sidebar=document.querySelector('.sidebar-topbar-icons [data-topbar-id="sidebar"]')
  down(files);move(sidebar);up();await tick();assert(side.value[0]==='files','Built-in sidebar reorder failed')
  const pin=document.querySelector('.plugin-actions-menu .topbar-more-pin')
  pin.click();await tick();assert(!document.querySelector('[data-topbar-id="'+pluginId+'"]'),'Unpin left the plugin icon visible')
  pin.click();await tick();plugin=document.querySelector('[data-topbar-id="'+pluginId+'"]');assert(plugin,'Re-pin did not restore icon')
  down(plugin);move(mode);up();await tick()
  const saved=localStorage.getItem('markart-pinned-topbar-v1')
  await pluginRuntime.disable('test.topbar');await tick();assert(!document.querySelector('[data-topbar-id="'+pluginId+'"]'),'Disabled plugin icon remains')
  assert(localStorage.getItem('markart-pinned-topbar-v1')===saved,'Disabling discarded saved plugin order')
  await pluginRuntime.enable(pkg);await tick();assert(state.visibleTopbarCommands.value[0]===pluginId,'Re-enabled plugin lost position')
  app.unmount()
  // Re-create the controller bindings to verify persistence across mounting, not just enable/disable.
  const remount=createApp({setup(){const topbarLayout=computed(()=>({sidebarTop:side.value,editorTop:defaults}));const topbarMoreCommands=[...defaults];const saveTopbar=()=>{};${bindings};assert(visibleTopbarCommands.value[0]===pluginId,'Remount lost plugin position');return()=>h('div')}})
  remount.mount('#app');remount.unmount()
  await pluginRuntime.disable('test.topbar')
  document.querySelector('#result').textContent='PASS plugin menu pin/unpin, Cmd drag with built-ins, saved order, disable/re-enable/remount, Escape, click suppression and sidebar sorting'
}catch(e){document.querySelector('#result').textContent='FAIL '+e.message+' '+e.stack}})()
`
await build({ stdin: { contents: test, resolveDir: process.cwd() + '/src', loader: 'ts' }, plugins: [{ name: 'vue', setup(builder) {
  builder.onLoad({ filter: /\.vue$/ }, args => {
    const { descriptor } = parse(readFileSync(args.path, 'utf8'))
    const script = compileScript(descriptor, { id: args.path, inlineTemplate: !!descriptor.scriptSetup, genDefaultAs: 'Component' })
    let code = script.content
    if (!descriptor.scriptSetup) code += '\n' + compileTemplate({ source: descriptor.template.content, id: args.path, filename: args.path }).code.replace('export function render', 'function render') + '\nComponent.render=render;'
    return { contents: code + '\nexport default Component', loader: 'ts', resolveDir: dirname(args.path) }
  })
} }], define: { 'import.meta.env': '{}' }, bundle: true, format: 'iife', outfile: dir + '/test.js' })
writeFileSync(dir + '/test.html', '<!doctype html><meta charset="utf-8"><style>' + readFileSync('src/style.css', 'utf8') + readFileSync('src/themes/white/theme.css', 'utf8') + parse(readFileSync('src/MenuBar.vue','utf8')).descriptor.styles.map(style=>style.content.replace(/:deep\(([^)]+)\)/g,'$1')).join('\n') + '.app-shell{width:1100px;height:700px}.top-actions{position:absolute;right:30px;top:20px}.workspace-controls{position:absolute;left:20px;top:20px}.plugin-actions{display:inline-flex;align-items:center}.plugin-actions-menu{display:flex;flex-direction:column}</style><div id="app"></div><pre id="result">WAIT</pre><script>window.onerror=(m,s,l,c,e)=>document.querySelector("#result").textContent="FAIL "+(e?.stack||m)</script><script>' + readFileSync(dir + '/test.js', 'utf8').replaceAll('</script>', '<\\/script>') + '</script>')
const swift = readFileSync('scripts/fixtures/webkit-runner.swift', 'utf8').replace('result.hasPrefix("[")', '(result.hasPrefix("PASS") || result.hasPrefix("FAIL"))').replace('lastState = String(describing: value ?? error as Any)', 'lastState = "waiting for browser assertions"')
writeFileSync(dir + '/runner.swift', swift)
execFileSync('swiftc', ['-module-cache-path', '/tmp/markart-swift-cache', dir + '/runner.swift', '-o', dir + '/runner'])
const output = execFileSync(dir + '/runner', [dir + '/test.html'], { encoding: 'utf8', timeout: 40000, maxBuffer: 8 * 1024 * 1024 })
const result = output.match(/<pre id="result">(.*?)<\/pre>/s)?.[1]
console.log(result)
if (!result?.startsWith('PASS')) process.exitCode = 1
