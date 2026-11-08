import type { PluginAPI, UiNode, FileView } from "../../../src/plugins/sdk/index";
import {
  registerIndexPanel,
  currentFile,
  openFile,
  scopeFiles,
  text,
} from "../shared/indexPanel";
export async function activate(api: PluginAPI) {
  await registerIndexPanel(api, {
    id: "graph",
    title: "图谱",
    links: true,
    async render(model, context) {
      if (!model.files.length) return text("此文件夹没有可索引的文本文件");
      let view: FileView | null = null;
      try {
        view = await api.files.view();
      } catch {
        /* 没有打开文件夹或未声明 files.read 时退回完整索引。 */
      }
      const candidates = scopeFiles(model.files, view);
      const scope =
        view?.selected?.kind === "folder" && view.selected.path
          ? `文件夹 ${view.selected.path}`
          : view?.filter.active
            ? "文件列表当前筛选"
            : "";
      if (!candidates.length)
        return text(`当前${scope || "筛选"}内没有可显示的文件`);
      const byId = new Map(candidates.map((file) => [file.id, file])),
        active = currentFile({ ...model, files: candidates }, context);
      const edges = model.links.filter(
        (link) => link.target && byId.has(link.source) && byId.has(link.target),
      );
      const connected = new Set(
        edges.flatMap((link) => [link.source, link.target!]),
      );
      const ordered = [
        ...(active ? [active] : []),
        ...candidates.filter(
          (file) => file.id !== active?.id && connected.has(file.id),
        ),
        ...candidates.filter(
          (file) => file.id !== active?.id && !connected.has(file.id),
        ),
      ];
      const files = ordered.slice(0, 60),
        positions = new Map<string, { x: number; y: number }>();
      files.forEach((file, index) => {
        const center = !!active && index === 0,
          angle =
            ((index - (active ? 1 : 0)) * Math.PI * 2) /
            Math.max(1, files.length - (active ? 1 : 0));
        positions.set(
          file.id,
          center
            ? { x: 200, y: 175 }
            : {
                x: 200 + Math.cos(angle) * 145,
                y: 175 + Math.sin(angle) * 130,
              },
        );
      });
      const seen = new Set<string>(),
        lines: UiNode[] = [];
      for (const edge of edges) {
        const a = positions.get(edge.source),
          b = positions.get(edge.target!),
          key = [edge.source, edge.target].sort().join(":");
        if (!a || !b || seen.has(key) || lines.length >= 300) continue;
        seen.add(key);
        lines.push({
          tag: "line",
          attrs: { x1: a.x, y1: a.y, x2: b.x, y2: b.y },
        });
      }
      const nodes: UiNode[] = files.map((file) => {
        const point = positions.get(file.id)!;
        return {
          tag: "g",
          attrs: {
            class: file.id === active?.id ? "graph-node current" : "graph-node",
            role: "button",
            "aria-label": `打开${file.path}`,
          },
          on: { click: () => openFile(api, model, file) },
          children: [
            {
              tag: "circle",
              attrs: {
                cx: point.x,
                cy: point.y,
                r: file.id === active?.id ? 7 : 5,
              },
            },
            {
              tag: "text",
              attrs: { x: point.x, y: point.y + 19 },
              text: file.path.split("/").pop()!.slice(0, 12),
            },
          ],
        };
      });
      return {
        tag: "div",
        attrs: { class: "index-panel graph-panel" },
        children: [
          {
            tag: "small",
            text: `${files.length} / ${candidates.length} 个文件 · ${edges.length} 条链接${scope ? ` · 范围：${scope}` : ""}`,
          },
          {
            tag: "svg",
            attrs: {
              viewBox: "0 0 400 350",
              role: "img",
              "aria-label": "文件关系图",
            },
            children: [...lines, ...nodes],
          },
          ...(candidates.length > 60
            ? [{ tag: "small", text: "仅展示前 60 个文件；当前文件优先显示" }]
            : []),
        ],
      };
    },
  });
}
export function deactivate() {}
