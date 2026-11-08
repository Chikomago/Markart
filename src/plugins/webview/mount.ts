import {invoke,isTauri} from '@tauri-apps/api/core'
import { isWebViewMethod } from './methods'
import { contentBoundsRequest } from './bounds'
import { webDocument, type WebResources } from './content'
export function mountWebView(element: HTMLElement, entry: string, resources: WebResources, request: (method:string,args:any[])=>Promise<any>, close:()=>void) {
  const frame = document.createElement('iframe')
  frame.setAttribute('scrolling','no')
  frame.setAttribute('allowtransparency','true')
  frame.setAttribute('sandbox','allow-scripts');frame.setAttribute('referrerpolicy','no-referrer');frame.title='插件界面'
  frame.style.cssText='display:block;box-sizing:border-box;width:100%;height:100%;min-width:0;min-height:0;border:0;background:transparent;color-scheme:normal;pointer-events:auto'
  const focusToken=crypto.randomUUID()
  frame.srcdoc=webDocument(entry,resources,focusToken)
  let active=true, pending=0
  const syncTheme=()=>{
    if(!active)return
    const source=document.querySelector('.app-shell') || document.documentElement
    const style=getComputedStyle(source)
    const variables=Object.fromEntries(['paper','ink','muted','line','bg','hover','accent'].map(name=>['--markart-'+name,style.getPropertyValue('--'+name).trim()]))
    frame.contentWindow?.postMessage({type:'markart-web-theme',variables,colorScheme:style.colorScheme},'*')
  }
  if(isTauri())void invoke<boolean>('plugin_focus_token',{token:focusToken,enabled:true}).then(registered=>{if(!registered)return;if(active)frame.contentWindow?.postMessage({type:'markart-web-focus'},'*');else void invoke('plugin_focus_token',{token:focusToken,enabled:false}).catch(()=>{})}).catch(()=>{})
  const loaded=()=>{syncTheme();frame.focus();frame.contentWindow?.postMessage({type:'markart-web-focus'},'*')}
  frame.addEventListener('load',loaded)
  const themeObserver=new MutationObserver(syncTheme)
  themeObserver.observe(document.documentElement,{attributes:true})
  const shell=document.querySelector('.app-shell')
  if(shell)themeObserver.observe(shell,{attributes:true})
  themeObserver.observe(document.head,{childList:true,subtree:true,characterData:true,attributes:true})

  const receive=async(event:MessageEvent)=>{
    if (!active || event.source!==frame.contentWindow) return
    const data=event.data
    if(data?.type==='markart-web-content-bounds') {
      const detail=contentBoundsRequest(data)
      if(detail)element.dispatchEvent(new CustomEvent('plugin-webview-height',{bubbles:true,detail:{...detail,width:data.width}}))
      return
    }
    if(data?.type==='markart-web-close'){close();return}
    if(data?.type!=='markart-web-request'||!Number.isSafeInteger(data.id)||!Array.isArray(data.args))return
    if(pending>=32){frame.contentWindow?.postMessage({type:'markart-web-result',id:data.id,error:{code:'not-ready',message:'并发请求过多，请等待当前请求完成'}},'*');return}
    pending++
    try {
      if(!isWebViewMethod(data.method))throw new Error('此接口不支持从自定义界面调用')
      const value=await request(data.method,data.args)
      if(active)frame.contentWindow?.postMessage({type:'markart-web-result',id:data.id,value},'*')
    }catch(error){if(active)frame.contentWindow?.postMessage({type:'markart-web-result',id:data.id,error:{code:(error as any)?.code || 'invalid-argument',message:error instanceof Error?error.message:String(error)}},'*')}
    finally{pending--}
  }
  window.addEventListener('message',receive);element.replaceChildren(frame)
  return ()=>{active=false;if(isTauri())void invoke('plugin_focus_token',{token:focusToken,enabled:false}).catch(()=>{});window.removeEventListener('message',receive);themeObserver.disconnect();frame.removeEventListener('load',loaded);frame.remove()}
}
