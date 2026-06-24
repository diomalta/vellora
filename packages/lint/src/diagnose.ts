/**
 * `diagnose(html)` — parse with parse5, run every rule's read-only `detect`, and return a structured
 * report ordered by `(line, col, rule)`. Read-only by contract: it never mutates or re-serializes the
 * input, never touches the network or filesystem, and must not run on the render hot path.
 */
import { exceedsMaxDepth, parseHtml } from "./dom.js";
import { orderFindings, toFinding, tooDeeplyNestedFinding } from "./engine.js";
import { RULES } from "./rules/index.js";
import type { Report } from "./types.js";

export function diagnose(html: string): Report {
  const doc = parseHtml(html);
  // A pathologically deep document surfaces a structured finding rather than risking a stack
  // overflow in any recursive downstream step.
  if (exceedsMaxDepth(doc.document)) {
    return { conformant: false, findings: [tooDeeplyNestedFinding()] };
  }
  const findings = RULES.flatMap((rule) =>
    rule.detect(doc).map((detection) => toFinding(rule, detection, doc.source)),
  );
  const ordered = orderFindings(findings);
  return { conformant: ordered.length === 0, findings: ordered };
}
