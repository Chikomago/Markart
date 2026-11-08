import {
  PluginError,
  errorValue,
  type Json,
  type BridgeRequest,
} from "../sdk/protocol";
export type WorkerLike = Pick<
  Worker,
  "postMessage" | "terminate" | "onmessage" | "onerror"
>;
export class PluginConnection {
  private sequence = 0;
  private hostRequests = 0;
  private pending = new Map<
    number,
    {
      resolve: (value: Json) => void;
      reject: (error: unknown) => void;
      timer: ReturnType<typeof setTimeout>;
      cleanup: (() => void)[];
    }
  >();
  private closed = false;
  private loadedResolve?: () => void;
  private loadedReject?: (error: unknown) => void;
  private refs = new Map<number, (...args: any[]) => unknown>();
  private refSequence = 0;
  constructor(
    private worker: WorkerLike,
    private dispatch: (
      method: string,
      args: any[],
    ) => unknown | Promise<unknown>,
    private onFault: (error: unknown) => void,
  ) {
    worker.onmessage = (event) => {
      void this.receive(event.data);
    };
    worker.onerror = (event) =>
      this.fail(
        new PluginError("plugin-fault", event.message || "插件运行失败"),
      );
  }
  async start(source: string) {
    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(
        () => this.fail(new PluginError("timeout", "插件初始化超时")),
        15000,
      );
      this.loadedResolve = () => {
        clearTimeout(timer);
        resolve();
      };
      this.loadedReject = (error) => {
        clearTimeout(timer);
        reject(error);
      };
      this.worker.postMessage({ type: "init", source });
    });
    return this.call({ type: "start" }, 35000);
  }
  private async receive(message: any) {
    if (this.closed) return;
    if (message.type === "loaded") {
      this.loadedResolve?.();
      this.loadedResolve = undefined;
      return;
    }
    if (message.type === "fault") {
      const error = new PluginError(
        message.error?.code || "plugin-fault",
        message.error?.message || "插件运行失败",
      );
      if (message.error?.stack) error.stack = message.error.stack;
      this.fail(error);
      return;
    }
    if (message.type === "complete") {
      const pending = this.pending.get(message.id);
      if (!pending) return;
      clearTimeout(pending.timer);
      for (const cleanup of pending.cleanup) cleanup();
      this.pending.delete(message.id);
      if (message.error) {
        const error = new PluginError(
          message.error.code,
          message.error.message,
        );
        pending.reject(error);
        if (message.error.code === "plugin-fault") this.fail(error);
      } else pending.resolve(this.decode(message.value ?? null));
    } else if (message.type === "request") {
      if(this.hostRequests>=64){this.fail(new PluginError('plugin-fault','插件并发请求过多'));return}
      this.hostRequests++
      try {
        const args = this.decode(message.args);
        const value =
          message.method === "$host"
            ? await this.invokeRef(args)
            : await this.dispatch(message.method, args);
        if (!this.closed)
          this.worker.postMessage({
            type: "result",
            id: message.id,
            value: this.encode(value),
          });
      } catch (error) {
        if (!this.closed)
          this.worker.postMessage({
            type: "result",
            id: message.id,
            error: errorValue(error),
          });
      } finally {this.hostRequests--}
    }
  }
  private invokeRef(args: any[]) {
    const [id, ...rest] = args,
      fn = this.refs.get(id);
    if (!fn) throw new PluginError("cancelled", "资源已释放");
    return fn(...rest);
  }
  private encode(value: any, depth = 0, cleanup: (() => void)[] = []): Json {
    if (typeof AbortSignal !== "undefined" && value instanceof AbortSignal) {
      const id = ++this.refSequence;
      const cancel = () => {
        if (!this.closed)
          this.worker.postMessage({ type: "cancel-signal", signal: id });
      };
      value.addEventListener("abort", cancel, { once: true });
      cleanup.push(() => value.removeEventListener("abort", cancel));
      return { $signal: id, aborted: value.aborted };
    }
    if (depth > 32) throw new PluginError("invalid-argument", "消息嵌套过深");
    if (typeof value === "function") {
      if (this.refs.size >= 10000)
        throw new PluginError("plugin-fault", "插件持有的接口资源过多");
      const id = ++this.refSequence;
      this.refs.set(id, value);
      return { $host: id };
    }
    if (value === undefined) return null;
    if (Array.isArray(value))
      return value.map((item) => this.encode(item, depth + 1, cleanup));
    if (value && typeof value === "object")
      return Object.fromEntries(
        Object.entries(value).map(([key, item]) => [
          key,
          this.encode(item, depth + 1, cleanup),
        ]),
      );
    return value;
  }
  private decode(value: any): any {
    if (!value || typeof value !== "object") return value;
    if (Number.isInteger(value.$callback) && Object.keys(value).length === 1) {
      const callback = (...args: Json[]) => this.invoke(value.$callback, args);
      callback.disposeRemote = () => {
        if (!this.closed)
          this.worker.postMessage({
            type: "release",
            callbacks: [value.$callback],
          });
      };
      return callback;
    }
    if (Array.isArray(value)) return value.map((item) => this.decode(item));
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, this.decode(item)]),
    );
  }
  private call(
    message: Record<string, unknown>,
    timeoutMs = 35000,
  ): Promise<Json> {
    if (this.closed)
      return Promise.reject(new PluginError("cancelled", "插件已停用"));
    const id = ++this.sequence;
    return new Promise((resolve, reject) => {
      const expire=()=>{
        const pending=this.pending.get(id);if(!pending)return
        if(this.hostRequests>0&&message.type!=='stop'){pending.timer=setTimeout(expire,timeoutMs);return}
        this.fail(new PluginError('timeout','插件响应超时'))
      }
      const timer=setTimeout(expire,timeoutMs);
      const cleanup: (() => void)[] = [];
      const encoded = message.args
        ? { ...message, args: this.encode(message.args, 0, cleanup) }
        : message;
      this.pending.set(id, { resolve, reject, timer, cleanup });
      this.worker.postMessage({ ...encoded, id });
    });
  }
  invoke(callback: number, args: Json[] = []) {
    return this.call({ type: "invoke", callback, args });
  }
  private fail(error: unknown) {
    if (this.closed) return;
    this.loadedReject?.(error);
    this.dispose(error);
    this.onFault(error);
  }
  async stop() {
    if (this.closed) return;
    try {
      await this.call({ type: "stop" }, 1000);
    } finally {
      this.dispose();
    }
  }
  dispose(reason: unknown = new PluginError("cancelled", "插件已停用")) {
    if (this.closed) return;
    this.closed = true;
    this.worker.terminate();
    this.worker.onmessage = null;
    this.worker.onerror = null;
    for (const job of this.pending.values()) {
      clearTimeout(job.timer);
      for (const cleanup of job.cleanup) cleanup();
      job.reject(reason);
    }
    this.pending.clear();
    this.refs.clear();
    this.loadedReject?.(reason);
    this.loadedResolve = this.loadedReject = undefined;
  }
}
