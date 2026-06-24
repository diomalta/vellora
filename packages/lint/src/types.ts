/**
 * Stable public contract for `@vellora/lint`. These shapes are consumed programmatically by AI
 * agents and by `public-api-templating`'s best-effort mode, so the field set is fixed and the `rule`
 * ids are stable kebab-case. Do not reshape without a versioned change.
 */

/** Stable kebab-case rule ids. The first four are auto-fixable codemods; the rest are diagnostics. */
export type RuleId =
  | "inline-svg"
  | "flex-grid-in-td"
  | "img-dimension-attrs"
  | "invalid-markup"
  | "script-element"
  | "css-animation";

export type Severity = "error" | "warning";

/** 1-based source position pointing at the offending node. */
export interface SourceLocation {
  line: number;
  col: number;
}

/**
 * A single detected subset violation. The field set is exactly this — humans read `suggestedFix`
 * and `snippet`; agents key off `rule`, `severity`, `autoFixable`, and `compatLink`.
 */
export interface Finding {
  /** Stable kebab-case rule id. */
  rule: RuleId;
  severity: Severity;
  /** True iff one of the four deterministic codemods can repair this finding. */
  autoFixable: boolean;
  /** 1-based `{ line, col }` of the offending node. */
  location: SourceLocation;
  /** Human- and agent-readable description of the recommended change. */
  suggestedFix: string;
  /** The offending source fragment for the node. */
  snippet: string;
  /** Stable URL/anchor into the compatibility table for this rule. */
  compatLink: string;
  /** True on a `fix()` report when this finding was repaired by a codemod. */
  applied?: boolean;
}

/** The structured report returned by `diagnose` and carried by `fix`. */
export interface Report {
  /** True when no findings were detected (input is within the subset). */
  conformant: boolean;
  /** Findings ordered deterministically by `(line, col, rule)`. */
  findings: Finding[];
}
