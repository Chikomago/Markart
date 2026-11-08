import { shallowRef } from "vue";
export type UpdateConfirmation = {
  name: string;
  version: string;
  permissions: string[];
};
export const updateRequest = shallowRef<{
  detail: UpdateConfirmation;
  resolve: (value: boolean) => void;
} | null>(null);
/** Asks before an update widens the plugin's declared capabilities. Closing the dialog counts as a refusal. */
export function confirmUpdate(detail: UpdateConfirmation) {
  if (updateRequest.value) return Promise.resolve(false);
  return new Promise<boolean>((resolve) => {
    updateRequest.value = {
      detail,
      resolve: (value) => {
        updateRequest.value = null;
        resolve(value);
      },
    };
  });
}
