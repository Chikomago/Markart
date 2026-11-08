import type { DownloadedPlugin } from "../community";
import type { PluginHost, MarkartPlugin } from "../host/types";
import type { PluginAdapter } from "../runtime";
import { PluginConnection } from "./connection";
import { createPluginBridge } from "../host/bridge";
export function isolatedPlugin(
  pkg: DownloadedPlugin,
  host: PluginHost,
  adapter: PluginAdapter,
  onFault: (error: unknown) => void,
): MarkartPlugin {
  const bridge = createPluginBridge(pkg, host, adapter, onFault);
  let connection: PluginConnection | undefined;
  return {
    activate: async () => {
      const worker = new Worker(
        new URL("./plugin.worker.ts", import.meta.url),
        { type: "module", name: `Markart plugin ${pkg.manifest.id}` },
      );
      connection = new PluginConnection(worker, bridge.dispatch, onFault);
      try {
        await connection.start(pkg.main);
      } catch (error) {
        connection.dispose();
        await bridge.close();
        throw error;
      }
    },
    deactivate: async () => {
      try {
        await bridge.close();
        await connection?.stop();
      } finally {
        connection?.dispose();
      }
    },
  };
}
