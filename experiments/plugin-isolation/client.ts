import {webDocument} from '../../src/plugins/webview/content'
const run=document.querySelector<HTMLButtonElement>('#run')!, result=document.querySelector<HTMLElement>('#result')!
run.onclick=async()=>{
 run.disabled=true;result.textContent='正在验证…'
 document.querySelector('#frames')!.replaceChildren()
 await fetch('/reset',{method:'POST'})
 const statuses:Record<string,string>={}
 const frames:HTMLIFrameElement[]=[]
 const listener=(event:MessageEvent)=>{
  if(!frames.some(frame=>frame.contentWindow===event.source)||event.data?.type!=='probe')return
  statuses[event.data.kind]=event.data.status
  void render()
 }
 window.addEventListener('message',listener)
 for(const kind of ['fetch','image','navigation']){
  const url=location.origin+'/probe/'+kind
  const code=kind==='fetch'?`fetch(${JSON.stringify(url)}).then(()=>parent.postMessage({type:'probe',kind:'fetch',status:'请求完成'},'*')).catch(()=>parent.postMessage({type:'probe',kind:'fetch',status:'浏览器拒绝'},'*'))`:kind==='image'?`const img=new Image();img.onload=()=>parent.postMessage({type:'probe',kind:'image',status:'图片加载'},'*');img.onerror=()=>parent.postMessage({type:'probe',kind:'image',status:'图片被拒绝'},'*');img.src=${JSON.stringify(url)}`:`location.href=${JSON.stringify(url)}`
  const html=`<!doctype html><html><body><script>${code}<\/script></body></html>`
  const frame=document.createElement('iframe');frame.setAttribute('sandbox','allow-scripts');frame.title=kind+' 测试'
  frame.srcdoc=webDocument('views/test.html',{'views/test.html':Array.from(new TextEncoder().encode(html))})
  if(kind==='navigation')frame.onload=()=>void render()
  frames.push(frame);document.querySelector('#frames')!.append(frame)
 }
 async function render(){const counts=await fetch('/results').then(response=>response.json());result.textContent=JSON.stringify({environment:'独立浏览器验证，不代表 macOS/Windows 原生端结论',requests:counts,signals:statuses},null,2)}
 document.querySelector<HTMLButtonElement>('#refresh')!.onclick=()=>void render()
 run.disabled=false
}
const fault=document.querySelector<HTMLButtonElement>('#fault')!
fault.onclick=()=>{
 fault.disabled=true;result.textContent='正在测量 750ms 有界计算…'
 let previous=performance.now(),maxGap=0
 const heartbeat=setInterval(()=>{const now=performance.now();maxGap=Math.max(maxGap,now-previous);previous=now},16)
 const frame=document.createElement('iframe');frame.setAttribute('sandbox','allow-scripts');frame.title='有界脚本故障测试'
 const finish=(event:MessageEvent)=>{
  if(event.source!==frame.contentWindow||event.data?.type!=='bounded-fault-finished')return
  setTimeout(()=>{
   clearInterval(heartbeat);window.removeEventListener('message',finish);frame.remove();fault.disabled=false
   result.textContent=JSON.stringify({test:'有界同步计算，不等于无限循环测试',requestedBlockMs:750,iframeBlockMs:Math.round(event.data.elapsed),hostMaxHeartbeatGapMs:Math.round(maxGap),hostDelayed:maxGap>200},null,2)
  },100)
 }
 window.addEventListener('message',finish)
 const html=`<!doctype html><script>setTimeout(()=>{const start=performance.now();while(performance.now()-start<750){}parent.postMessage({type:'bounded-fault-finished',elapsed:performance.now()-start},'*')},100)<\/script>`
 frame.srcdoc=webDocument('views/test.html',{'views/test.html':Array.from(new TextEncoder().encode(html))})
 document.querySelector('#frames')!.append(frame)
}
const role=new URLSearchParams(location.search).get('role'),pid=new URLSearchParams(location.search).get('pid')
if(role==='worker'){
 document.querySelector('h1')!.textContent='独立 Worker 测试进程'
 let lastJob=0,running=false
 setInterval(async()=>{
  if(running)return
  running=true
  try{
   const job=await fetch('/worker-poll').then(response=>response.json())
   if(!job.id||job.id<=lastJob||job.done)return
   lastJob=job.id
   const frame=document.createElement('iframe');frame.setAttribute('sandbox','allow-scripts')
   const finished=async(event:MessageEvent)=>{
    if(event.source!==frame.contentWindow||event.data?.type!=='worker-finished')return
    window.removeEventListener('message',finished);frame.remove()
    await fetch(`/finish-job?id=${job.id}&pid=${pid}&elapsed=${Math.round(event.data.elapsed)}`,{method:'POST'})
    result.textContent=`进程 ${pid} 已完成 ${Math.round(event.data.elapsed)}ms 模拟计算`
   }
   window.addEventListener('message',finished)
   const html=`<!doctype html><script>setTimeout(()=>{const t=performance.now();while(performance.now()-t<750){}parent.postMessage({type:'worker-finished',elapsed:performance.now()-t},'*')},100)<\/script>`
   frame.srcdoc=webDocument('views/test.html',{'views/test.html':Array.from(new TextEncoder().encode(html))});document.querySelector('#frames')!.append(frame)
  }finally{running=false}
 },100)
}
document.querySelector<HTMLButtonElement>('#process')!.onclick=async()=>{
 const response=await fetch('/start-job',{method:'POST'})
 if(!response.ok){result.textContent=await response.text();return}
 const job=await response.json();let previous=performance.now(),maxGap=0,polling=false
 const heartbeat=setInterval(()=>{const now=performance.now();maxGap=Math.max(maxGap,now-previous);previous=now},16)
 const deadline=performance.now()+10000
 result.textContent='正在等待独立进程完成有界计算…'
 const poll=setInterval(async()=>{
  if(polling)return;polling=true
  try{
   const current=await fetch('/job').then(value=>value.json())
   if(current.id===job.id&&current.done){clearInterval(heartbeat);clearInterval(poll);result.textContent=JSON.stringify({test:'两个独立原生进程',hostPid:pid,workerPid:current.workerPid,workerBlockMs:current.elapsed,hostMaxHeartbeatGapMs:Math.round(maxGap),hostDelayed:maxGap>200},null,2)}
   else if(performance.now()>deadline){clearInterval(heartbeat);clearInterval(poll);result.textContent='独立进程测试超时，未判定通过'}
  }finally{polling=false}
 },100)
}
