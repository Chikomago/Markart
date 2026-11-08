import { Lexer } from "marked";
import { pluginServices } from "./services";
import { pluginGrants } from "../permissions/grants";
import { renderMarkdown } from "../../editor/renderMarkdown";
import { mountTree, releaseUiCallbacks } from "../ui/tree";
import { PluginError } from "../sdk/protocol";
export class PluginExportError extends Error {
  constructor(
    readonly owner: string,
    message: string,
  ) {
    super(message);
    this.name = "PluginExportError";
  }
}
export async function preparePluginExport(
  snapshot: { content: string; root: string; path: string; format: string },
  skipOwners: string[] = [],
) {
  const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value));
  const permitted = (owner: string) => {
    pluginGrants.require(owner, "editor.read");
  };
  for (const hook of pluginServices.beforeExport.filter(
    (hook) => !skipOwners.includes(hook.owner),
  )) {
    try {
      permitted(hook.owner);
      if ((await hook.run(clone(snapshot))) === false)
        throw new Error("已取消本次导出");
    } catch (error) {
      throw new PluginExportError(
        hook.owner,
        `${hook.owner}: ${String(error)}`,
      );
    }
  }
  if (!pluginServices.transformAst.length)
    return { source: snapshot.content, html: undefined };
  const tokens = Lexer.lex(snapshot.content);
  let ast: any = { type: "root", children: tokens, links: tokens.links };
  for (const hook of pluginServices.transformAst.filter(
    (hook) => !skipOwners.includes(hook.owner),
  )) {
    permitted(hook.owner);
    try {
      ast = await hook.run(clone(ast));
      if (
        !ast ||
        ast.type !== "root" ||
        !Array.isArray(ast.children) ||
        JSON.stringify(ast).length > 20 * 1024 * 1024
      )
        throw new Error("AST 格式无效");
    } catch (error) {
      throw new PluginExportError(
        hook.owner,
        `${hook.owner}: ${String(error)}`,
      );
    }
  }
  return {
    source: snapshot.content,
    ast,
    html: renderMarkdown(snapshot.content, {
      ast: ast.children,
      links: ast.links,
    }),
  };
}
export async function customExport(
  kind: string,
  snapshot: { content: string; root: string; path: string; ast?: unknown },
) {
  const format = pluginServices.formats.find(
    (format) => `plugin:${format.id}` === kind,
  );
  if (!format) throw new PluginError("not-found", "导出格式已停用");
  pluginGrants.require(format.owner, "editor.read");
  let output: string | number[], previewHtml: string | undefined;
  try {
    output = await format.export({ ...snapshot });
    if (
      typeof output !== "string" &&
      (!Array.isArray(output) ||
        output.some(
          (value) => !Number.isInteger(value) || value < 0 || value > 255,
        ))
    )
      throw new Error("导出内容需为文本或字节数组");
    if (output.length > 20 * 1024 * 1024) throw new Error("导出内容超过 20 MB");
    if (format.preview) {
      const root = document.createElement("div");
      const tree = await format.preview({ ...snapshot });
      mountTree(root, tree).release();
      previewHtml = root.innerHTML;
    }
  } catch (error) {
    throw new Error(`${format.owner}: ${String(error)}`);
  }
  return {
    extension: format.extension,
    body: typeof output === "string" ? output : "",
    bytes: typeof output === "string" ? undefined : new Uint8Array(output),
    previewHtml,
  };
}
