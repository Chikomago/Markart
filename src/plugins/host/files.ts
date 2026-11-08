import { requireWorkspaceRoot } from './workspaceScope';
import { invoke } from "@tauri-apps/api/core";
import { parseDocument, stringify } from "yaml";
import { frontmatterSection } from "../../documents/frontmatter";
import { PluginError } from "../sdk/protocol";
import { pluginGrants } from "../permissions/grants";
import type { FileRef, FileView } from "../sdk/index";
import type { PluginHost } from "./types";
export type FileAdapter = {
  openFile(root: string, path: string): Promise<void>;
  openedFile(
    root: string,
    path: string,
  ): { id: string; content: string; revision: number; active: boolean } | null;
  fileOperation(
    operation: string,
    root: string,
    path: string,
    value?: unknown,
  ): Promise<unknown>;
  fileView?(): Omit<FileView, "root"> | undefined;
};
export class PluginFiles {
  private versions = new Map<string, { version: number; disk: string }>();
  constructor(
    private id: string,
    private host: PluginHost,
    private adapter: FileAdapter,
  ) {}
  private check(root: string, write = false, attachment = false) {
    pluginGrants.require(
      this.id,
      attachment
        ? write
          ? "attachments.write"
          : "attachments.read"
        : write
          ? "files.write"
          : "files.read",
    );
    requireWorkspaceRoot(this.host, root);
  }
  async list(root: string): Promise<FileRef[]> {
    this.check(root);
    let after: string | undefined, cursor: string | undefined;
    const files: FileRef[] = [];
    do {
      const page = await invoke<any>("query_file_index", {
        root,
        operation: "files",
        after,
        cursor,
        limit: 500,
      });
      cursor = page.cursor;
      for (const file of page.files)
        files.push({
          ...file,
          root,
          version:
            this.adapter.openedFile(root, file.path)?.revision ?? file.version,
        });
      after = page.next || undefined;
    } while (after);
    return files;
  }
  async get(root: string, id: string) {
    return (await this.list(root)).find((file) => file.id === id) || null;
  }
  /** Read-only snapshot of what the file tree currently shows. Never exposes paths outside the root. */
  async view(): Promise<FileView> {
    const root = this.host.workspace.root();
    this.check(root);
    const value = this.adapter.fileView?.();
    return {
      root,
      files: value?.files || [],
      folders: value?.folders || [],
      selected: value?.selected || null,
      filter: value?.filter || { extensions: [], search: "", active: false },
    };
  }
  private async resolve(input: FileRef, write = false, attachment = false) {
    if (
      !input ||
      typeof input.root !== "string" ||
      typeof input.id !== "string"
    )
      throw new PluginError("invalid-argument", "文件标识无效");
    this.check(input.root, write, attachment);
    let file: FileRef | null;
    if (attachment) {
      pluginGrants.require(this.id, "index.read");
      let after: string | undefined;
      file = null;
      do {
        const page = await invoke<any>("query_file_index", {
          root: input.root,
          operation: "files",
          after,
          limit: 500,
        });
        file = page.files.find((item: FileRef) => item.id === input.id) || null;
        after = page.next || undefined;
      } while (!file && after);
      if (file) file = { ...file, root: input.root };
    } else file = await this.get(input.root, input.id);
    if (!file) throw new PluginError("not-found", "文件不存在");
    return file;
  }
  async open(input: FileRef) {
    const file = await this.resolve(input);
    await this.adapter.openFile(file.root, file.path);
  }
  async readText(input: FileRef) {
    const file = await this.resolve(input),
      opened = this.adapter.openedFile(file.root, file.path);
    if (opened) return opened.content;
    const value = await invoke<any>("plugin_workspace_file", {
      root: file.root,
      path: file.path,
      operation: "readText",
    });
    this.versions.set(file.id, { version: file.version!, disk: value.version });
    return value.content as string;
  }
  async writeText(input: FileRef, text: string, expected: string | number) {
    const file = await this.resolve(input, true);
    const opened = this.adapter.openedFile(file.root, file.path);
    if (opened) {
      if (expected !== opened.revision)
        throw new PluginError("stale-revision", "文件版本已变化");
      const result = await this.host.documents.applyEdits({
        documentId: opened.id,
        expectedRevision: opened.revision,
        edits: [{ from: 0, to: opened.content.length, text }],
      });
      if (!result.ok) throw new PluginError("stale-revision", "文件版本已变化");
      return;
    }
    const previous = this.versions.get(file.id);
    if (
      !previous ||
      expected !== previous.version ||
      file.version !== previous.version
    )
      throw new PluginError("stale-revision", "请先读取当前文件版本再修改");
    await invoke("plugin_workspace_file", {
      root: file.root,
      path: file.path,
      operation: "writeText",
      content: text,
      expectedVersion: previous.disk,
    });
    this.versions.delete(file.id);
  }
  async readBytes(input: FileRef) {
    const file = await this.resolve(input, false, true),
      value = await invoke<any>("plugin_workspace_file", {
        root: file.root,
        path: file.path,
        operation: "readBytes",
      });
    this.versions.set(file.id, { version: file.version!, disk: value.version });
    return value.bytes as number[];
  }
  async writeBytes(input: FileRef, bytes: number[], expected: number | string) {
    const file = await this.resolve(input, true, true);
    if (this.adapter.openedFile(file.root, file.path))
      throw new PluginError("read-only", "已打开的文件不能通过附件接口覆盖");
    const previous = this.versions.get(file.id);
    if (
      !previous ||
      expected !== previous.version ||
      file.version !== previous.version
    )
      throw new PluginError("stale-revision", "请先读取当前文件版本再修改");
    await invoke("plugin_workspace_file", {
      root: file.root,
      path: file.path,
      operation: "writeBytes",
      bytes,
      expectedVersion: previous.disk,
    });
    this.versions.delete(file.id);
  }
  async create(root: string, path: string, text = "") {
    this.check(root, true);
    await this.adapter.fileOperation("create", root, path, text);
    const files = await this.list(root);
    const file = files.find((file) => file.path === path);
    if (!file) throw new PluginError("not-ready", "文件已创建，索引正在更新");
    return file;
  }
  async mkdir(root: string, path: string) {
    this.check(root, true);
    await this.adapter.fileOperation("mkdir", root, path);
  }
  async move(input: FileRef, path: string) {
    const file = await this.resolve(input, true);
    await this.adapter.fileOperation("move", file.root, file.path, path);
  }
  async rename(input: FileRef, name: string) {
    if (!name || /[\\/]/.test(name) || name === "." || name === "..")
      throw new PluginError("invalid-argument", "文件名称无效");
    return this.move(
      input,
      [...input.path.split("/").slice(0, -1), name].join("/"),
    );
  }
  async trash(input: FileRef) {
    const file = await this.resolve(input, true);
    await this.adapter.fileOperation("trash", file.root, file.path);
  }
  async readFrontmatter(input: FileRef) {
    const text = await this.readText(input),
      section = frontmatterSection(text);
    if (!section) return {};
    const doc = parseDocument(section.yaml);
    if (doc.errors.length)
      throw new PluginError("invalid-argument", "文件属性中的 YAML 格式有误");
    const value = doc.toJSON();
    if (!value || Array.isArray(value) || typeof value !== "object")
      throw new PluginError("invalid-argument", "文件属性需要使用键值格式");
    return value;
  }
  async updateFrontmatter(
    input: FileRef,
    properties: Record<string, unknown>,
    expected: string | number,
  ) {
    const text = await this.readText(input),
      section = frontmatterSection(text);
    const body = `---\n${stringify(properties)}---\n${text.slice(section?.to || 0)}`;
    return this.writeText(input, body, expected);
  }
  async watch(root: string, callback: (event: unknown) => void) {
    this.check(root);
    return this.host.filesystem.watch(root, (events) => {
      this.check(root);
      callback(
        events.map((event) => ({
          ...event,
          paths: event.paths
            .map((path) =>
              path.startsWith(root + "/") ? path.slice(root.length + 1) : "",
            )
            .filter(Boolean),
        })),
      );
    });
  }
}
