// Runs entirely inside QuickJS. No browser objects or native bridge are installed.
export const vmBootstrap = String.raw`
(() => {
  const pending = new Map(), callbacks = new Map(), signals = new Map();
  let sequence = 0, callbackSequence = 0, plugin;
  function makeSignal(id, aborted=false) {
    if(signals.has(id))return signals.get(id).signal;
    let stopped=aborted;const listeners=new Set();
    const signal=Object.freeze({get aborted(){return stopped},addEventListener(type,fn){if(type==='abort')listeners.add(fn)},removeEventListener(type,fn){if(type==='abort')listeners.delete(fn)},throwIfAborted(){if(stopped){const error=new Error('任务已取消');error.code='cancelled';throw error}}});
    signals.set(id,{signal,abort(){if(stopped)return;stopped=true;for(const fn of listeners){try{fn()}catch{}}listeners.clear()}});return signal;
  }
  const pluginSignal=makeSignal(0),tracked=new Set();
  const encode = (value, depth = 0) => {
    if (depth > 32) throw new Error('消息嵌套过深');
    if (typeof value === 'function') { const id = ++callbackSequence; callbacks.set(id, value); return {$callback:id}; }
    if (value === undefined) return null;
    if (Array.isArray(value)) return value.map(item => encode(item, depth+1));
    if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).filter(([,item])=>item!==undefined).map(([key,item])=>[key,encode(item,depth+1)]));
    return value;
  };
  const decode = value => {
    if (!value || typeof value !== 'object') return value;
    if(Number.isInteger(value.$signal)&&Object.keys(value).every(key=>['$signal','aborted'].includes(key)))return makeSignal(value.$signal,value.aborted===true);
    if (Number.isInteger(value.$host) && Object.keys(value).length === 1) return (...args) => request('$host', [value.$host, ...args]);
    if (Array.isArray(value)) return value.map(decode);
    return Object.fromEntries(Object.entries(value).map(([key,item])=>[key,decode(item)]));
  };
  function request(method, args) {
    const id = ++sequence;
    return new Promise((resolve,reject)=>{ pending.set(id,{resolve,reject}); __send(JSON.stringify({type:'request',id,method,args:encode(args)})); });
  }
  function proxy(path) { return new Proxy(function(){}, {get(_target,key){ if(key==='then')return undefined;if(path==='lifecycle'&&key==='signal')return pluginSignal; return proxy(path ? path+'.'+String(key) : String(key)); },apply(_target,_self,args){if(path==='lifecycle.track'){const dispose=args[0];if(typeof dispose!=='function')return Promise.reject(new Error('清理函数无效'));tracked.add(dispose);return Promise.resolve(()=>{if(tracked.delete(dispose))return dispose()});}return request(path,args);} }); }
  const api = proxy('');
  const report = (id, value, error) => __send(JSON.stringify({type:'complete',id,value:error?undefined:encode(value),error:error?{code:error.code||'plugin-fault',message:String(error.message||error)}:undefined}));
  globalThis.__receive = raw => {
    const message = JSON.parse(raw);
    if(message.type==='cancel-signal'){signals.get(message.signal)?.abort();signals.delete(message.signal);return;}
    if(message.type==='release'){for(const id of message.callbacks||[])callbacks.delete(id);return;}
    if (message.type === 'result') {
      const job=pending.get(message.id); if(!job)return;pending.delete(message.id);
      if(message.error){const error=new Error(message.error.message);error.code=message.error.code;job.reject(error);}else job.resolve(decode(message.value));
    } else if (message.type === 'invoke') {
      const callback=callbacks.get(message.callback);
      if(!callback){report(message.id,null,{code:'cancelled',message:'回调已释放'});return;}
      Promise.resolve().then(()=>callback(...decode(message.args))).then(value=>report(message.id,value),error=>report(message.id,null,error));
    } else if (message.type === 'start') {
      plugin=globalThis.__module.default||globalThis.__module;
      if(typeof plugin.activate !== 'function')throw new Error('插件需导出 activate(api)');
      Promise.resolve().then(()=>plugin.activate(api)).then(value=>report(message.id,value),error=>report(message.id,null,error));
    } else if (message.type === 'stop') {
      signals.get(0).abort();
      Promise.resolve().then(()=>plugin && plugin.deactivate && plugin.deactivate()).then(async()=>{for(const dispose of [...tracked].reverse()){try{await dispose()}catch{}}tracked.clear()}).then(()=>report(message.id,null),error=>report(message.id,null,error));
    }
  };
})();`;
