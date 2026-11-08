import type { PluginAPI, UiNode } from "../../../src/plugins/sdk/index";
import { registerIndexPanel, fileButton, text } from "../shared/indexPanel";
export async function activate(api: PluginAPI) {
  await registerIndexPanel(api, {
    id: "tags",
    title: "标签",
    metadata: true,
    async render(model, context) {
      const counts = new Map<string, number>();
      for (const metadata of model.metadata.values())
        for (const tag of new Set(metadata.tags.map((tag) => tag.name)))
          counts.set(tag, (counts.get(tag) || 0) + 1);
      const selected =
        typeof (context.state as { tag?: string })?.tag === "string"
          ? (context.state as { tag: string }).tag
          : "";
      const select = async (tag: string) => {
        const item = await api.ui.sidebar.getItem(context.itemId);
        await item?.setState({ tag });
      };
      const tags = [...counts].sort(
        (a, b) => b[1] - a[1] || a[0].localeCompare(b[0]),
      );
      if (!tags.length) return text("在正文或 Frontmatter 中添加标签后显示");
      const children: UiNode[] = [
        {
          tag: "div",
          attrs: { class: "tag-list" },
          children: tags.slice(0, 300).map(([tag, count]) => ({
            tag: "button",
            attrs: {
              class: selected === tag ? "tag active" : "tag",
              "aria-pressed": selected === tag,
            },
            children: [
              { tag: "span", text: "#" + tag },
              { tag: "small", text: String(count) },
            ],
            on: { click: () => select(selected === tag ? "" : tag) },
          })),
        },
      ];
      if (tags.length > 300)
        children.push(text(`显示前 300 个标签，共 ${tags.length} 个`));
      if (selected) {
        children.push({ tag: "h3", text: "#" + selected });
        let after: string | undefined, cursor: string | undefined;
        const matches = [];
        do {
          const page = await api.index.tagged({
            root: model.root,
            tag: selected,
            cursor,
            after,
            limit: 100,
          });
          cursor = page.cursor;
          matches.push(...page.files);
          after = page.next || undefined;
        } while (after && matches.length < 200);
        children.push(
          ...matches.slice(0, 200).map((file) => fileButton(api, model, file)),
        );
        if (after) children.push(text("仅展示前 200 个匹配文件"));
      }
      return { tag: "div", attrs: { class: "index-panel" }, children };
    },
  });
}
export function deactivate() {}
