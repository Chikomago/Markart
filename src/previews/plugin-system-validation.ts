import { createApp, h, onMounted } from 'vue'
import WorkspaceView from '../WorkspaceView.vue'
import { useWorkspaceController } from '../workspace/useWorkspaceController'
import { installI18n } from '../i18n'
import { pluginRuntime } from '../plugins/runtime'
import { pluginKey, savePlugin } from '../plugins/community'
import { parsePluginManifest } from '../plugins/manifest'
import '../style.css'
const source=`let api, item, count=0;
export async function activate(host){
 api=host;
 await api.ui.sidebar.register({id:'counter',title:'计数器',multiple:true,render:()=>({tag:'div',children:[{tag:'h3',text:'隔离面板'},{tag:'p',text:'计数 '+count},{tag:'button',text:'增加',on:{click:async()=>{count++;await item.refresh()}}}]})});
 await api.ui.sidebar.register({id:'notes',title:'便笺',render:()=>({tag:'div',children:[{tag:'p',text:'切换面板或移动到其他区域'},{tag:'textarea',attrs:{'aria-label':'便笺',rows:5,placeholder:'输入文字，移动后仍保留'}}]})});
 await api.commands.register({id:'inspect',title:'隔离环境检查',run:()=>api.ui.notify([typeof document,typeof fetch,typeof process].join('/'))});
 await api.ui.registerAction({id:'inspect',commandId:'inspect',location:'topbar-menu'});
 item=await api.ui.sidebar.open('counter');
 await api.ui.sidebar.open('notes');
}
`
const app=createApp({setup(){
 const context=useWorkspaceController()
 onMounted(()=>{void (async()=>{
  const manifest=parsePluginManifest({apiVersion:2,id:'dev.markart.validation',name:'侧栏面板验证',version:'0.1.0',permissions:{required:['editor.read','index.read'],optional:['background']}})
  const pkg={key:pluginKey({manifest}),manifest,repo:'',main:source,downloadedAt:new Date().toISOString()}
  await savePlugin(pkg)
  await pluginRuntime.enable(pkg)
 })().catch(error=>{console.error(error);document.body.dataset.validationError=String(error)})})
 return()=>h(WorkspaceView,{context})
}})
installI18n(app);app.mount('#app')
