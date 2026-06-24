/**
 * `fix(html)` — parse with parse5, apply the deterministic codemods, re-serialize, and return the
 * rewritten HTML plus a report. The report lists every applied fix (located in the *original* source)
 * and every remaining, non-auto-fixable finding (located in the *fixed* output). Dev-time/CI only;
 * never runs on the render hot path.
 *
 * Determinism + idempotence: every codemod is a no-op on its own output, and the final step always
 * re-serializes through parse5 — a parse→serialize fixed point — so `fix(fix(x).html).html` is
 * byte-identical to `fix(x).html` and that second report lists no applied fixes.
 */
import { exceedsMaxDepth, parseHtml, serializeDocument } from "./dom.js";
import { type Rule, orderFindings, toFinding, tooDeeplyNestedFinding } from "./engine.js";
import { RULES } from "./rules/index.js";
import type { Finding, Report } from "./types.js";

function isAutoFixable(rule: Rule): boolean {
  return rule.autoFixable;
}

export function fix(html: string): { html: string; report: Report } {
  const doc = parseHtml(html);

  // A pathologically deep document is left unchanged with a structured finding: parse5's recursive
  // serializer would otherwise overflow the stack. The input is returned verbatim (no mutation).
  if (exceedsMaxDepth(doc.document)) {
    return { html, report: { conformant: false, findings: [tooDeeplyNestedFinding()] } };
  }

  // 1. Detect + apply every auto-fixable rule on the original tree. Findings are recorded with their
  //    original-source locations and marked `applied`. `invalid-markup` has no `apply` — its repair
  //    is the re-serialization below — but it is still recorded as applied.
  const applied: Finding[] = [];
  for (const rule of RULES) {
    if (!isAutoFixable(rule)) {
      continue;
    }
    for (const detection of rule.detect(doc)) {
      applied.push({ ...toFinding(rule, detection, doc.source), applied: true });
      rule.apply?.(detection.element);
    }
  }

  // 2. Re-serialize the normalized, codemod'd tree. This also repairs mis-nested markup.
  const fixedHtml = serializeDocument(doc.document);

  // 3. Re-detect on the fixed output to collect remaining non-auto-fixable findings (located in the
  //    fixed source). Auto-fixable rules no longer match their own output, so only diagnostics remain.
  const fixedDoc = parseHtml(fixedHtml);
  const remaining: Finding[] = RULES.filter((rule) => !isAutoFixable(rule)).flatMap((rule) =>
    rule.detect(fixedDoc).map((detection) => toFinding(rule, detection, fixedDoc.source)),
  );

  const findings = orderFindings([...applied, ...remaining]);
  return {
    html: fixedHtml,
    report: { conformant: findings.length === 0, findings },
  };
}
