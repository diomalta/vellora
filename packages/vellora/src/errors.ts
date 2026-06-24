/**
 * Typed error contract for the public `vellora` API.
 *
 * Every failure path of `renderPdf` / `renderPdfToStream` rejects with one of these typed errors
 * (never a bare `Error`). `VelloraError` is the base; consumers branch on `instanceof` and on the
 * stable, machine-readable `code`. `VelloraUnsupportedError` surfaces the core's located
 * out-of-subset diagnostic verbatim — node location and remediation hint — and is the single
 * contract shape mapped from the bridge in `unsupportedFromDiagnostic`.
 */

/** Stable, machine-readable error codes. Consumers and CI branch on these. */
export type VelloraErrorCode =
  | "VELLORA_ERROR"
  | "VELLORA_TEMPLATE_ERROR"
  | "VELLORA_INPUT_ERROR"
  | "VELLORA_UNSUPPORTED";

/** Base class for every error thrown by the public API. */
export class VelloraError extends Error {
  /** Stable, machine-readable discriminator. */
  readonly code: VelloraErrorCode;

  constructor(message: string, code: VelloraErrorCode = "VELLORA_ERROR") {
    super(message);
    this.name = "VelloraError";
    this.code = code;
  }
}

/** A template syntax/semantic error (unclosed block, unknown helper). Carries token location. */
export class VelloraTemplateError extends VelloraError {
  /** 1-based line of the offending token, when known. */
  readonly line?: number;
  /** 1-based column of the offending token, when known. */
  readonly col?: number;

  constructor(message: string, location?: { line: number; col: number }) {
    super(message, "VELLORA_TEMPLATE_ERROR");
    this.name = "VelloraTemplateError";
    this.line = location?.line;
    this.col = location?.col;
  }
}

/** Bad input to the public API (wrong `html` type, or a `Readable` that errored). */
export class VelloraInputError extends VelloraError {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, "VELLORA_INPUT_ERROR");
    this.name = "VelloraInputError";
    if (options && "cause" in options) {
      (this as { cause?: unknown }).cause = options.cause;
    }
  }
}

/**
 * The located out-of-subset diagnostic the bridge/core emits, flattened across the FFI. This exact
 * shape is the contract with the napi binding.
 */
export interface UnsupportedDiagnostic {
  /** The out-of-subset feature in the core's colon-namespaced taxonomy, e.g. `"css:animation"` or
   * `"element:script"`. Best-effort mode normalizes `@vellora/lint` rule ids to this same vocabulary,
   * so a given construct yields one canonical `feature` regardless of which path reported it. */
  feature: string;
  /** 1-based source line of the offending node, or `null` when the source position is unknown. */
  line: number | null;
  /** 1-based source column of the offending node, or `null` when the source position is unknown. */
  col: number | null;
  /** Remediation hint from the core, e.g. `"run vellora fix"`. */
  hint: string;
}

/**
 * An out-of-subset construct reported by the core. Carries the located diagnostic verbatim so
 * consumers and CI can surface a precise, actionable message and branch on it.
 */
export class VelloraUnsupportedError extends VelloraError {
  /** The out-of-subset feature reported by the core. */
  readonly feature: string;
  /** 1-based source line of the offending node, or `null` when the source position is unknown. */
  readonly line: number | null;
  /** 1-based source column of the offending node, or `null` when the source position is unknown. */
  readonly col: number | null;
  /** Remediation hint from the core. */
  readonly hint: string;

  constructor(diagnostic: UnsupportedDiagnostic) {
    super(formatUnsupportedMessage(diagnostic), "VELLORA_UNSUPPORTED");
    this.name = "VelloraUnsupportedError";
    this.feature = diagnostic.feature;
    this.line = diagnostic.line;
    this.col = diagnostic.col;
    this.hint = diagnostic.hint;
  }
}

/** Render the located-diagnostic message, omitting the location when line/col are unknown (null). */
function formatUnsupportedMessage(diagnostic: UnsupportedDiagnostic): string {
  const location =
    diagnostic.line !== null && diagnostic.col !== null
      ? ` at line ${diagnostic.line}, column ${diagnostic.col}`
      : "";
  return `Unsupported construct "${diagnostic.feature}"${location}: ${diagnostic.hint}`;
}

/** Type guard: does an unknown value carry the structured located diagnostic fields? */
export function isUnsupportedDiagnostic(value: unknown): value is UnsupportedDiagnostic {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const v = value as Record<string, unknown>;
  return (
    typeof v.feature === "string" &&
    (typeof v.line === "number" || v.line === null) &&
    (typeof v.col === "number" || v.col === null) &&
    typeof v.hint === "string"
  );
}

/**
 * Adapter (the single seam): reconstruct a `VelloraUnsupportedError` from a core/native
 * located diagnostic, preserving node location + remediation hint verbatim. The bridge may reject
 * either with a `VelloraUnsupportedError` already, or with an error/object carrying the structured
 * `{ feature, line, col, hint }` fields; both map to the same typed error.
 */
export function unsupportedFromDiagnostic(reason: unknown): VelloraUnsupportedError | undefined {
  if (reason instanceof VelloraUnsupportedError) {
    return reason;
  }
  if (isUnsupportedDiagnostic(reason)) {
    return new VelloraUnsupportedError(reason);
  }
  // The error may carry the diagnostic on a nested property (FFI flattening).
  if (typeof reason === "object" && reason !== null) {
    const diagnostic = (reason as { diagnostic?: unknown }).diagnostic;
    if (isUnsupportedDiagnostic(diagnostic)) {
      return new VelloraUnsupportedError(diagnostic);
    }
  }
  return undefined;
}
