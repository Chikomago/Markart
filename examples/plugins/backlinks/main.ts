import type { PluginAPI, UiNode } from "../../../src/plugins/sdk/index";
import {
  registerIndexPanel,
  currentFile,
  fileButton,
  text,
} from "../shared/indexPanel";
export async function activate(api: PluginAPI) {
  await registerIndexPanel(api, {
    id: "backlinks",
    title: "反向链接",
    links: true,
    render(model, context) {
      const current = currentFile(model, context);
      if (!current) return text("打开文件后查看反向链接");
      const incoming = model.links.filter((link) => link.target === current.id),
        sources = new Map<string, typeof incoming>();
      for (const link of incoming) {
        const entries = sources.get(link.source) || [];
        entries.push(link);
        sources.set(link.source, entries);
      }
      if (!sources.size) return text("没有文件链接到当前文件");
      const children: UiNode[] = [
        {
          tag: "small",
          text: `${sources.size} 个文件 · ${incoming.length} 处引用`,
        },
      ];
      for (const [id, links] of [...sources].slice(0, 200)) {
        const file = model.files.find((file) => file.id === id);
        if (file)
          children.push(
            fileButton(
              api,
              model,
              file,
              `${links.length} 处引用 · 第 ${links
                .slice(0, 5)
                .map((link) => link.line)
                .join("、")} 行`,
            ),
          );
      }
      if (sources.size > 200) children.push(text("仅展示前 200 个引用文件"));
      return { tag: "div", attrs: { class: "index-panel" }, children };
    },
  });
}
export function deactivate() {}
