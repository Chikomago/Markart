import { newQuickJSWASMModuleFromVariant } from "quickjs-emscripten-core";
import variant from "@jitl/quickjs-wasmfile-release-sync";
import wasmUrl from "@jitl/quickjs-wasmfile-release-sync/wasm?url";
import { mapPluginError } from "./sourceMap";
import { PluginEngine } from "./engine";
import { errorValue } from "../sdk/protocol";
let engine: PluginEngine | undefined;
let source = "";
self.onmessage = async (event) => {
  try {
    if (event.data.type === "init") {
      source = event.data.source;
      const module = await newQuickJSWASMModuleFromVariant({
        ...variant,
        importModuleLoader: async () => {
          const { default: loader } =
            await import("@jitl/quickjs-wasmfile-release-sync/emscripten-module");
          return (options) => loader({ ...options, locateFile: () => wasmUrl });
        },
      });
      engine = new PluginEngine(module, (message) =>
        self.postMessage(JSON.parse(message)),
      );
      engine.load(event.data.source);
      self.postMessage({ type: "loaded" });
    } else if (event.data.type === "dispose") {
      engine?.dispose();
      engine = undefined;
      self.close();
    } else engine?.receive(event.data);
  } catch (error) {
    self.postMessage({
      type: "fault",
      error: { ...errorValue(error), ...mapPluginError(error, source) },
    });
    engine?.dispose();
    engine = undefined;
    self.close();
  }
};
