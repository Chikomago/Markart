export type Json =
  null | boolean | number | string | Json[] | { [key: string]: Json };
export type ErrorCode =
  | "permission-denied"
  | "not-found"
  | "read-only"
  | "stale-revision"
  | "cancelled"
  | "timeout"
  | "not-ready"
  | "invalid-argument"
  | "plugin-fault";
export class PluginError extends Error {
  constructor(
    readonly code: ErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "PluginError";
  }
}
export type BridgeRequest = {
  type: "request";
  id: number;
  method: string;
  args: Json[];
};
export type BridgeResult = {
  type: "result";
  id: number;
  value?: Json;
  error?: { code: ErrorCode; message: string };
};
export type CallbackRef = { $callback: number };
export type HostRef = { $host: number };
export const API_VERSION = 2 as const;
export const supportedCapabilities = [
  "commands",
  "editor",
  "editor.extensions",
  "files",
  "index",
  "markdown",
  "exports",
  "ui",
  "ui.sidebar",
  "ui.webview",
  "settings",
  "clipboard",
  "network",
  "storage",
  "secrets",
  "events",
  "lifecycle",
] as const;
export type Capability = (typeof supportedCapabilities)[number];
export function errorValue(error: unknown): {
  code: ErrorCode;
  message: string;
} {
  return {
    code: error instanceof PluginError ? error.code : "plugin-fault",
    message: error instanceof Error ? error.message : String(error),
  };
}
