import { PluginError } from '../sdk/protocol'
export type WebResources = Record<string, number[]>
export function resourcePath(path: string) {
  if (!path || path.startsWith('/') || /[\\:#?\x00]/.test(path) || path.split('/').some(part => !part || part === '.' || part === '..')) throw new PluginError('invalid-argument', '资源路径必须是插件包内的相对路径')
  return path
}
export function webDocument(entry: string, resources: WebResources, focusToken?: string) {
  resourcePath(entry)
  const bytes = resources[entry]
  if (!bytes || !entry.endsWith('.html')) throw new PluginError('not-found', '找不到 HTML 入口')
  const doc = new DOMParser().parseFromString(new TextDecoder().decode(new Uint8Array(bytes)), 'text/html')
  doc.querySelectorAll('base,meta[http-equiv]').forEach(node => node.remove())
  const prefix = entry.slice(0, entry.lastIndexOf('/') + 1)
  const mime: Record<string,string> = {js:'text/javascript',css:'text/css',svg:'image/svg+xml',png:'image/png',jpg:'image/jpeg',jpeg:'image/jpeg',webp:'image/webp',woff2:'font/woff2',json:'application/json',mp3:'audio/mpeg',mp4:'video/mp4'}
  const asset = (input: string) => {
    if (/^(data:|#)/.test(input)) return input
    const path = resourcePath(prefix + input.replace(/^\.\//,'')), data = resources[path]
    if (!data) throw new PluginError('not-found', `找不到界面资源：${path}`)
    let binary = ''; for (const byte of data) binary += String.fromCharCode(byte)
    return `data:${mime[path.split('.').pop()!] || 'application/octet-stream'};base64,${btoa(binary)}`
  }
  // Build tools must bundle script imports and CSS dependencies into their entry assets.
  doc.querySelectorAll('[src],link[href]').forEach(node => {
    const key = node.hasAttribute('src') ? 'src' : 'href'
    node.setAttribute(key, asset(node.getAttribute(key)!))
  })
  const csp = doc.createElement('meta');csp.httpEquiv='Content-Security-Policy'
  csp.content="default-src 'none'; script-src 'unsafe-inline' data:; style-src 'unsafe-inline' data:; img-src data: blob:; font-src data:; media-src data: blob:; connect-src 'none'; frame-src 'none'; form-action 'none'; base-uri 'none'"
  doc.head.prepend(csp)
  const viewportStyle = doc.createElement('style')
  viewportStyle.textContent = 'html{width:100%;height:100%;margin:0;overflow:hidden;background:transparent!important;color-scheme:normal!important}body{box-sizing:border-box;max-width:100%;min-height:100%;margin:0;background:transparent}'
  doc.head.append(viewportStyle)
  const bridge = doc.createElement('script')
  bridge.textContent=`(()=>{let seq=0;const jobs=new Map();window.markart=Object.freeze({request(method,...args){const id=++seq;return new Promise((resolve,reject)=>{jobs.set(id,{resolve,reject});parent.postMessage({type:'markart-web-request',id,method,args},'*')})}});window.addEventListener('message',e=>{if(e.source!==parent)return;if(e.data?.type==='markart-web-focus'){window.dispatchEvent(new Event('markart-focus'));if(${JSON.stringify(focusToken||'')} && window.webkit?.messageHandlers?.markartPluginFocus)window.webkit.messageHandlers.markartPluginFocus.postMessage(${JSON.stringify(focusToken||'')});const target=document.querySelector('[autofocus]');if(target && (document.activeElement===document.body || document.activeElement===document.documentElement))target.focus({preventScroll:true});return}if(e.data?.type==='markart-web-escape'){handleEscape();return}if(e.data?.type==='markart-web-theme'){for(const [name,value] of Object.entries(e.data.variables||{})){if(/^--markart-(paper|ink|muted|line|bg|hover|accent)$/.test(name)&&typeof value==='string')document.documentElement.style.setProperty(name,value)}if(['light','dark','normal'].includes(e.data.colorScheme))document.documentElement.dataset.markartColorScheme=e.data.colorScheme;window.dispatchEvent(new Event('markart-theme-change'));return}if(e.data?.type!=='markart-web-result')return;const job=jobs.get(e.data.id);if(!job)return;jobs.delete(e.data.id);if(e.data.error){const detail=e.data.error;const error=new Error(typeof detail==='string'?detail:detail.message);error.code=detail.code||'invalid-argument';job.reject(error)}else job.resolve(e.data.value)});function handleEscape(){const event=new Event('markart-escape',{cancelable:true});if(window.dispatchEvent(event))parent.postMessage({type:'markart-web-close'},'*')}window.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();handleEscape()}},true)})();`
  doc.head.insertBefore(bridge,csp.nextSibling)
  return '<!doctype html>'+doc.documentElement.outerHTML
}
