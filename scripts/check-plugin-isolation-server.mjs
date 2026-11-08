import {createServer} from 'node:http'
import {readFile} from 'node:fs/promises'
import {build} from 'esbuild'
const bundle=await build({entryPoints:['experiments/plugin-isolation/client.ts'],bundle:true,write:false,format:'esm',platform:'browser'})
let job={id:0,done:false,workerPid:null,elapsed:null};let workerSeen=0
let counts={fetch:0,image:0,navigation:0}
const server=createServer(async(req,res)=>{
 const path=(req.url||'').split('?')[0]
 res.setHeader('Cache-Control','no-store')
 res.setHeader('Access-Control-Allow-Origin','*');res.setHeader('Access-Control-Allow-Headers','content-type')
 if(req.method==='OPTIONS'){res.end();return}
 if(path==='/worker-poll'){workerSeen=Date.now();res.setHeader('Content-Type','application/json');res.end(JSON.stringify(job));return}
 if(path==='/start-job'&&req.method==='POST'){if(Date.now()-workerSeen>2000){res.writeHead(409);res.end('先启动独立 Worker 测试窗口');return}job={id:job.id+1,done:false,workerPid:null,elapsed:null};res.setHeader('Content-Type','application/json');res.end(JSON.stringify(job));return}
 if(path==='/finish-job'&&req.method==='POST'){const query=new URL(req.url,'http://localhost').searchParams;if(Number(query.get('id'))===job.id){job.done=true;job.workerPid=Number(query.get('pid'));job.elapsed=Number(query.get('elapsed'))}res.end('ok');return}
 if(path==='/job'){res.setHeader('Content-Type','application/json');res.end(JSON.stringify(job));return}
 if(path==='/reset'&&req.method==='POST'){counts={fetch:0,image:0,navigation:0};res.end('ok');return}
 if(path==='/results'){res.setHeader('Content-Type','application/json');res.end(JSON.stringify(counts));return}
 if(path.startsWith('/probe/')){const name=path.slice(7);if(name in counts)counts[name]++;res.setHeader('Content-Type','text/html; charset=utf-8');res.end('<!doctype html><p>模拟导航已到达本机端点</p>');return}
 if(path==='/client.js'){res.setHeader('Content-Type','text/javascript');res.end(bundle.outputFiles[0].text);return}
 if(path==='/'){res.setHeader('Content-Type','text/html; charset=utf-8');res.end(await readFile('experiments/plugin-isolation/index.html'));return}
 res.writeHead(404);res.end()
})
server.listen(5189,'127.0.0.1',()=>console.log('隔离验证：http://127.0.0.1:5189/'))
