import type {
  QuickJSWASMModule,
  QuickJSContext,
} from "quickjs-emscripten-core";
import { vmBootstrap } from "./vmBootstrap";
import { PluginError } from "../sdk/protocol";
export class PluginEngine {
  private context: QuickJSContext;
  private deadline = 0;
  private disposed = false;
  constructor(
    module: QuickJSWASMModule,
    private send: (message: string) => void,
    private budgetMs = 100,
  ) {
    const runtime = module.newRuntime();
    runtime.setMemoryLimit(32 * 1024 * 1024);
    runtime.setMaxStackSize(256 * 1024);
    runtime.setInterruptHandler(
      () => this.disposed || performance.now() > this.deadline,
    );
    this.context = runtime.newContext();
    const sender = this.context.newFunction("__send", (value) => {
      const text = this.context.getString(value);
      if (text.length > 2 * 1024 * 1024) throw new Error("插件消息超过 2 MB");
      this.send(text);
    });
    this.context.setProp(this.context.global, "__send", sender);
    sender.dispose();
    this.run(() =>
      this.context.unwrapResult(this.context.evalCode(vmBootstrap)).dispose(),
    );
  }
  private run(action: () => void) {
    if (this.disposed) throw new PluginError("cancelled", "插件已停用");
    this.deadline = performance.now() + this.budgetMs;
    try {
      action();
      let jobs = 0;
      while (this.context.runtime.hasPendingJob()) {
        this.context.unwrapResult(this.context.runtime.executePendingJobs(1));
        if (++jobs > 1000 || performance.now() > this.deadline)
          throw new PluginError("timeout", "插件执行超时");
      }
    } catch (error) {
      if (performance.now() >= this.deadline)
        throw new PluginError("timeout", "插件执行超时");
      throw error;
    }
  }
  load(source: string) {
    if (source.length > 5 * 1024 * 1024)
      throw new PluginError("invalid-argument", "插件代码超过 5 MB");
    this.run(() => {
      const result = this.context.unwrapResult(
        this.context.evalCode(source, "main.js", { type: "module" }),
      );
      this.context.setProp(this.context.global, "__module", result);
      result.dispose();
    });
  }
  receive(message: unknown) {
    const raw = JSON.stringify(message);
    this.run(() => {
      const receiver = this.context.getProp(this.context.global, "__receive"),
        arg = this.context.newString(raw);
      try {
        this.context
          .unwrapResult(
            this.context.callFunction(receiver, this.context.undefined, arg),
          )
          .dispose();
      } finally {
        receiver.dispose();
        arg.dispose();
      }
    });
  }
  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    const runtime = this.context.runtime;
    this.context.dispose();
    runtime.dispose();
  }
}
