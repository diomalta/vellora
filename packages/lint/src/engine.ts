/**
 * The shared rule-engine interface. Every rule exposes `detect` (read-only, used by both `diagnose`
 * and `fix`) and, for auto-fixable rules, `apply` (mutates the parse5 tree in place). Sharing one
 * detection path guarantees `diagnose` and `fix` never drift on what counts as a violation.
 */
import { compatLink } from "./compat.js";
import type { Element, ParsedDocument } from "./dom.js";
import { snippetFor, startLocation } from "./dom.js";
import type { Finding, RuleId, Severity } from "./types.js";

/** A detection hit: the offending element plus the human/agent-facing suggestion. */
export interface Detection {
  element: Element;
  suggestedFix: string;
  /** Override the element's source location (used by `invalid-markup` parse-error locations). */
  location?: { line: number; col: number };
  /** Override the snippet (used when the faithful fragment is not the element's serialization). */
  snippet?: string;
}

export interface Rule {
  id: RuleId;
  severity: Severity;
  autoFixable: boolean;
  /** Read-only: return every offending element in this document (no mutation). */
  detect(doc: ParsedDocument): Detection[];
  /** Mutate the tree to repair one detected element. Only present on auto-fixable rules. */
  apply?(element: Element): void;
}

/** Build a `Finding` from a rule and one of its detections. */
export function toFinding(rule: Rule, detection: Detection, source: string): Finding {
  const location = detection.location ?? startLocation(detection.element);
  const snippet = detection.snippet ?? snippetFor(detection.element, source);
  return {
    rule: rule.id,
    severity: rule.severity,
    autoFixable: rule.autoFixable,
    location,
    suggestedFix: detection.suggestedFix,
    snippet,
    compatLink: compatLink(rule.id),
  };
}

/**
 * A structured finding for a document nested past `MAX_NESTING_DEPTH`. Surfaced by `diagnose`/`fix`
 * instead of recursing into parse5's serializer and overflowing the stack with a raw `RangeError`.
 * Reuses the `invalid-markup` rule id (a depth-pathological document is structurally invalid) to
 * avoid reshaping the stable public `RuleId` set.
 */
export function tooDeeplyNestedFinding(): Finding {
  return {
    rule: "invalid-markup",
    severity: "warning",
    autoFixable: false,
    location: { line: 1, col: 1 },
    suggestedFix:
      "The document nests elements too deeply to process safely. Flatten the markup so nesting stays well below the supported limit.",
    snippet: "",
    compatLink: compatLink("invalid-markup"),
  };
}

/** Deterministic ordering: by line, then column, then `rule` id as a stable tie-break. */
export function orderFindings(findings: Finding[]): Finding[] {
  return [...findings].sort((a, b) => {
    if (a.location.line !== b.location.line) {
      return a.location.line - b.location.line;
    }
    if (a.location.col !== b.location.col) {
      return a.location.col - b.location.col;
    }
    return compareRuleId(a.rule, b.rule);
  });
}

function compareRuleId(a: RuleId, b: RuleId): number {
  if (a < b) {
    return -1;
  }
  if (a > b) {
    return 1;
  }
  return 0;
}
