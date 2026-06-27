export class UsageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UsageError";
  }
}

export function messageOf(reason: unknown): string {
  return reason instanceof Error ? reason.message : String(reason);
}

export function formatRuntimeError(reason: unknown): string {
  const record =
    typeof reason === "object" && reason !== null ? (reason as Record<string, unknown>) : {};
  const code = typeof record.code === "string" ? `${record.code}: ` : "";
  const feature = typeof record.feature === "string" ? ` feature=${record.feature}` : "";
  return `${code}${messageOf(reason)}${feature}`;
}

export function isParseArgsError(reason: unknown): boolean {
  if (!(reason instanceof TypeError)) {
    return false;
  }
  const code = (reason as { code?: unknown }).code;
  return typeof code === "string" && code.startsWith("ERR_PARSE_ARGS");
}
