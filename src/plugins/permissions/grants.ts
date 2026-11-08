import { reactive } from "vue";
import { PluginError } from "../sdk/protocol";
export type Permission =
  | "editor.read"
  | "editor.write"
  | "files.read"
  | "files.write"
  | "attachments.read"
  | "attachments.write"
  | "index.read"
  | "network"
  | "clipboard.read"
  | "clipboard.write"
  | "background"
  | "secrets";
export const permissionNames: Permission[] = [
  "secrets",
  "editor.read",
  "editor.write",
  "files.read",
  "files.write",
  "attachments.read",
  "attachments.write",
  "index.read",
  "network",
  "clipboard.read",
  "clipboard.write",
  "background",
];
export type PermissionDeclaration = {
  required: Permission[];
  optional: Permission[];
};
export type Grant = {
  permissions: Permission[];
  fingerprint: string;
};
/** A capability the plugin called without declaring it. Recorded by the host, so plugins cannot hide it. */
export type Denial = { key: string; count: number };
const key = "markart-plugin-grants-v2";
export class PluginGrants {
  readonly state = reactive<Record<string, Grant>>({});
  /** Session-only diagnostics: capabilities requested but not declared. */
  readonly denials = reactive<Record<string, Denial[]>>({});
  constructor(private storage?: Pick<Storage, "getItem" | "setItem">) {
    try {
      const value = JSON.parse(storage?.getItem(key) || "{}");
      for (const [id, grant] of Object.entries(value)) {
        const g = grant as Grant;
        if (
          g &&
          Array.isArray(g.permissions) &&
          typeof g.fingerprint === "string"
        )
          this.state[id] = { permissions: g.permissions, fingerprint: g.fingerprint };
      }
    } catch {
      /* Start without permissions. */
    }
  }
  fingerprint(value: PermissionDeclaration) {
    return JSON.stringify({
      required: [...value.required].sort(),
      optional: [...value.optional].sort(),
    });
  }
  matches(id: string, value: PermissionDeclaration) {
    return this.state[id]?.fingerprint === this.fingerprint(value);
  }
  approve(
    id: string,
    value: PermissionDeclaration,
    optional: Permission[] = [],
  ) {
    this.clearDenials(id);
    this.state[id] = {
      permissions: [
        ...new Set([
          ...value.required,
          ...optional.filter((item) => value.optional.includes(item)),
        ]),
      ],
      fingerprint: this.fingerprint(value),
    };
    this.save();
  }
  revoke(id: string) {
    delete this.state[id];
    this.clearDenials(id);
    this.save();
  }
  deny(id: string, key: string) {
    const list = (this.denials[id] ??= []);
    const known = list.find((item) => item.key === key);
    if (known) known.count += 1;
    else list.push({ key, count: 1 });
  }
  clearDenials(id: string) {
    delete this.denials[id];
  }
  require(id: string, permission: Permission) {
    const grant = this.state[id];
    if (
      !grant?.permissions.includes(permission)
    ) {
      this.deny(id, permission);
      throw new PluginError(
        "permission-denied",
        `插件未声明权限：${permission}，请在 manifest.json 中声明后重新安装`,
      );
    }
  }
  network(id: string, input: string) {
    this.require(id, "network");
    const url = new URL(input);
    if (
      !["http:", "https:"].includes(url.protocol) ||
      url.username ||
      url.password
    )
      throw new PluginError(
        "permission-denied",
        "仅允许 http/https 请求，且地址不能携带账号密码",
      );
    const local =
      /^(localhost|127\.|\[?::1\]?|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/i.test(
        url.hostname,
      );
    if (url.protocol === "http:" && !local)
      throw new PluginError(
        "permission-denied",
        "非本机/内网地址必须使用 https",
      );
    return url;
  }
  private save() {
    try {
      this.storage?.setItem(key, JSON.stringify(this.state));
    } catch {
      throw new PluginError("not-ready", "权限无法保存，请检查本地储存");
    }
  }
}
export const pluginGrants = new PluginGrants(
  typeof localStorage === "undefined" ? undefined : localStorage,
);
