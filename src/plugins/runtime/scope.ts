import { PluginError } from "../sdk/protocol";
export type Dispose = () => void | Promise<void>;
export class ResourceScope {
  readonly controller = new AbortController();
  readonly signal = this.controller.signal;
  private resources = new Set<Dispose>();
  private children = new Set<ResourceScope>();
  private closing?: Promise<void>;
  track(dispose: Dispose): Dispose {
    if (this.signal.aborted) {
      void Promise.resolve()
        .then(dispose)
        .catch(() => {});
      throw new PluginError("cancelled", "资源已关闭");
    }
    let done = false;
    const once = () => {
      if (done) return;
      done = true;
      this.resources.delete(once);
      return dispose();
    };
    this.resources.add(once);
    return once;
  }
  child() {
    const scope = new ResourceScope();
    this.children.add(scope);
    scope.track(() => {
      this.children.delete(scope);
    });
    return scope;
  }
  close(): Promise<void> {
    if (this.closing) return this.closing;
    this.controller.abort();
    this.closing = (async () => {
      for (const child of [...this.children].reverse()) await child.close();
      for (const dispose of [...this.resources].reverse()) {
        let timer: ReturnType<typeof setTimeout> | undefined;
        try {
          await Promise.race([
            Promise.resolve().then(dispose),
            new Promise<void>((resolve) => {
              timer = setTimeout(resolve, 1000);
            }),
          ]);
        } catch (error) {
          console.error("Plugin cleanup:", error);
        } finally {
          clearTimeout(timer);
        }
      }
      this.resources.clear();
      this.children.clear();
    })();
    return this.closing;
  }
}
