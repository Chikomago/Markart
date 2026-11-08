import { TraceMap, originalPositionFor } from "@jridgewell/trace-mapping";
export function mapPluginError(error: unknown, source: string) {
  const cause = (error as any)?.cause;
  const message =
    cause && typeof cause.message === "string"
      ? cause.message
      : error instanceof Error
        ? error.message
        : String(error);
  let stack: string =
    typeof cause?.stack === "string"
      ? cause.stack
      : error instanceof Error
        ? error.stack || ""
        : "";
  const encoded =
    /\/\/# sourceMappingURL=data:application\/json(?:;charset=utf-8)?;base64,([^\s]+)/.exec(
      source,
    )?.[1];
  if (encoded)
    try {
      const bytes = Uint8Array.from(atob(encoded), (value) =>
          value.charCodeAt(0),
        ),
        map = new TraceMap(JSON.parse(new TextDecoder().decode(bytes)));
      stack = stack.replace(/main\.js:(\d+):(\d+)/g, (match, line, column) => {
        const position = originalPositionFor(map, {
          line: Number(line),
          column: Math.max(0, Number(column) - 1),
        });
        return position.source && position.line
          ? `${position.source}:${position.line}:${(position.column || 0) + 1}`
          : match;
      });
    } catch {
      /* Keep the generated-source stack when a map is invalid. */
    }
  return { message, stack: stack.slice(0, 4000) };
}
