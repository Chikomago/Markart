import { shallowReactive } from "vue";
import type {
  Completion,
  Decoration,
  Diagnostic,
  EditorContext,
  View,
} from "../sdk/index";
import type { TreeNode } from "../ui/tree";
import { PluginError } from "../sdk/protocol";
export type Owned<T> = T & { owner: string; id: string };
export type EditorProvider = {
  id: string;
  provide: (context: EditorContext) => Promise<unknown[]>;
};
export type MarkdownProvider = {
  id: string;
  language?: string;
  pattern?: string;
  render: (context: any) => Promise<TreeNode>;
};
export type ExportFormat = {
  id: string;
  title: string;
  extension: string;
  export: (snapshot: any) => Promise<string | number[]>;
  preview?: (snapshot: any) => Promise<TreeNode>;
};
export const pluginServices = shallowReactive({
  completion: [] as Owned<EditorProvider>[],
  decoration: [] as Owned<EditorProvider>[],
  diagnostic: [] as Owned<EditorProvider>[],
  blocks: [] as Owned<MarkdownProvider>[],
  inlines: [] as Owned<MarkdownProvider>[],
  beforeExport: [] as Owned<{ run: (snapshot: any) => Promise<boolean> }>[],
  transformAst: [] as Owned<{ run: (snapshot: any) => Promise<any> }>[],
  formats: [] as Owned<ExportFormat>[],
});
export const sidebarInstances = new Map<
  string,
  {
    refresh: () => Promise<void>;
    visibility: (visible: boolean) => void;
    context: () => void;
  }
>();
export function registerService(
  kind: keyof typeof pluginServices,
  owner: string,
  entry: any,
): () => void {
  const id = `${owner}:${entry.id}`;
  if (
    !entry.id ||
    typeof entry.id !== "string" ||
    entry.id.length > 120 ||
    (pluginServices[kind] as any[]).some((item) => item.id === id)
  )
    throw new PluginError("invalid-argument", "扩展 ID 无效或重复");
  const item = { ...entry, id, owner };
  (pluginServices[kind] as any) = [...pluginServices[kind], item];
  return () => {
    (pluginServices[kind] as any) = (pluginServices[kind] as any[]).filter(
      (value) => value !== item,
    );
  };
}
