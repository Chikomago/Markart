import { shallowRef } from "vue";
export const uninstallRequest = shallowRef<{
  id: string;
  name: string;
  resolve: (value: { clearData: boolean } | null) => void;
} | null>(null);
export function confirmUninstall(id: string, name: string) {
  if (uninstallRequest.value) return Promise.resolve(null);
  return new Promise<{ clearData: boolean } | null>((resolve) => {
    uninstallRequest.value = {
      id,
      name,
      resolve: (value) => {
        uninstallRequest.value = null;
        resolve(value);
      },
    };
  });
}
export function clearPluginData(id: string) {
  const prefix = `markart-plugin:${id}:`;
  for (let index = localStorage.length - 1; index >= 0; index--) {
    const key = localStorage.key(index);
    if (key?.startsWith(prefix)) localStorage.removeItem(key);
  }
}
