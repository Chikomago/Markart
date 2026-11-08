import { PluginError } from "../sdk/protocol";
const tags = new Set([
  "img",
  "div",
  "span",
  "p",
  "h1",
  "h2",
  "h3",
  "h4",
  "strong",
  "em",
  "small",
  "code",
  "pre",
  "blockquote",
  "ul",
  "ol",
  "li",
  "button",
  "input",
  "textarea",
  "label",
  "select",
  "option",
  "hr",
  "br",
  "svg",
  "g",
  "path",
  "circle",
  "rect",
  "line",
  "polyline",
  "polygon",
  "text",
]);
const attributes = new Set([
  "src",
  "alt",
  "class",
  "type",
  "value",
  "checked",
  "disabled",
  "placeholder",
  "title",
  "role",
  "aria-label",
  "aria-pressed",
  "tabindex",
  "min",
  "max",
  "step",
  "rows",
  "viewBox",
  "d",
  "cx",
  "cy",
  "r",
  "x",
  "y",
  "x1",
  "y1",
  "x2",
  "y2",
  "width",
  "height",
  "rx",
  "ry",
  "points",
  "fill",
  "stroke",
  "stroke-width",
]);
export type TreeNode = {
  tag?: string;
  text?: string;
  attrs?: Record<string, unknown>;
  children?: TreeNode[];
  on?: Record<string, ((value: any) => unknown) | undefined>;
};
export function mountTree(
  root: HTMLElement,
  tree: TreeNode,
  onError: (error: unknown) => void = console.error,
): (() => void) & { release: () => void } {
  let count = 0;
  const disposers: (() => void)[] = [];
  function node(value: TreeNode, depth = 0, svg = false): Node {
    if (++count > 2000 || depth > 24 || !value || typeof value !== "object")
      throw new PluginError("invalid-argument", "插件界面内容过多或格式无效");
    const tag = value.tag || "div";
    if (!tags.has(tag))
      throw new PluginError("invalid-argument", "插件界面包含不支持的元素");
    svg = svg || tag === "svg";
    const element = svg
      ? document.createElementNS("http://www.w3.org/2000/svg", tag)
      : document.createElement(tag);
    if (typeof value.text === "string")
      element.textContent = value.text.slice(0, 100000);
    for (const [key, input] of Object.entries(value.attrs || {})) {
      if (
        key === "src" &&
        (typeof input !== "string" ||
          !/^data:image\/(?:png|jpeg|gif|webp);base64,[A-Za-z0-9+/=]+$/.test(
            input,
          ))
      )
        continue;
      if (
        key === "class" &&
        (typeof input !== "string" || !/^[-\w ]{1,200}$/.test(input))
      )
        continue;
      if (
        !attributes.has(key) ||
        !["string", "number", "boolean"].includes(typeof input)
      )
        continue;
      const text = String(input);
      if (
        text.length > 200000 ||
        /url\s*\(|javascript:|expression\s*\(/i.test(text)
      )
        continue;
      if (
        ["fill", "stroke"].includes(key) &&
        !/^([#\w(),.%\s-]+|var\(--[\w-]+\))$/.test(text)
      )
        continue;
      if (key === "checked" || key === "disabled") {
        if (input === true) element.setAttribute(key, "");
        continue;
      }
      element.setAttribute(key, text);
    }
    for (const [event, callback] of Object.entries(value.on || {})) {
      if (
        !["click", "change"].includes(event) ||
        typeof callback !== "function"
      )
        continue;
      const listener = (e: Event) => {
        const target = e.target as HTMLInputElement;
        void Promise.resolve(
          callback({
            value: typeof target.value === "string" ? target.value : undefined,
            checked:
              typeof target.checked === "boolean" ? target.checked : undefined,
          }),
        ).catch(onError);
      };
      element.addEventListener(event, listener);
      disposers.push(() => {
        element.removeEventListener(event, listener);
        (callback as any).disposeRemote?.();
      });
    }
    for (const child of value.children || [])
      element.append(node(child, depth + 1, svg));
    return element;
  }
  const fragment = document.createDocumentFragment();
  fragment.append(node(tree));
  root.replaceChildren(fragment);
  let released = false;
  const release = () => {
    if (released) return;
    released = true;
    for (const dispose of disposers.reverse()) dispose();
  };
  const dispose = () => {
    release();
    root.replaceChildren();
  };
  dispose.release = release;
  return dispose;
}

/** Plugin logic returns data; DOM creation and style containment stay with the host. */
export function mountViewTree(
  element: HTMLElement,
  tree: TreeNode,
  styles = "",
  onError: (error: unknown) => void = console.error,
) {
  const frame = document.createElement("div");
  frame.className = "plugin-view-frame";
  frame.style.cssText =
    "contain:layout paint style;isolation:isolate;position:relative;overflow:hidden;min-width:0;min-height:0;width:100%;height:100%";
  const host = document.createElement("div");
  host.style.cssText = "width:100%;height:100%;overflow:auto";
  frame.append(host);
  const shadow = host.attachShadow({ mode: "closed" }),
    style = document.createElement("style"),
    content = document.createElement("div");
  content.className = "plugin-view-content";
  style.textContent =
    ":host{display:block;color:var(--ink);font:inherit}*{box-sizing:border-box}button,input,textarea,select{font:inherit;color:var(--ink);background:var(--paper);border:1px solid var(--line);border-radius:5px;padding:5px 8px}button{cursor:pointer}svg,img{max-width:100%}.plugin-view-content{min-height:100%;overflow-wrap:anywhere}" +
    (styles.length <= 100000 &&
    !/url\s*\(|@|\\|image-set|expression|behavior|binding/i.test(styles)
      ? styles
      : "");
  shadow.append(style, content);
  element.replaceChildren(frame);
  const clear = mountTree(content, tree, onError);
  return () => {
    clear();
    frame.remove();
  };
}

export function releaseUiCallbacks(tree: TreeNode) {
  for (const callback of Object.values(tree.on || {}))
    (callback as any)?.disposeRemote?.();
  for (const child of tree.children || []) releaseUiCallbacks(child);
}
