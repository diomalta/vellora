/**
 * Issue #60: `vellora lint` must not call a template conformant when a strict `renderPdf` rejects
 * it. These tests keep `@vellora/lint` in step with the strict core gate
 * (`crates/vellora-core/src/validation.rs`):
 *
 * 1. the denylists copied into `src/gate.ts` equal the Rust ones;
 * 2. every feature the gate can emit is reported by a lint rule, or is listed in `NOT_LINTED` with
 *    the reason lint cannot see it;
 * 3. one probe per denied construct (built from the Rust lists) yields a finding with the gate's
 *    `feature`, and the gate's near misses yield none.
 *
 * `packages/vellora/test/real-stack.test.ts` runs the same probes through the real addon and checks
 * that the gate rejects each with exactly that feature.
 */
import {
  acceptedGateProbes,
  coreGateLists,
  rejectedGateProbes,
  resolveById,
} from "@vellora/test-harness";
import { describe, expect, test } from "vitest";
import { diagnose } from "../src/diagnose";
import { fix } from "../src/fix";
import { DENIED_CSS_PROPERTIES, DENIED_CSS_TOKENS, DENIED_ELEMENTS } from "../src/gate";

/** Gate features lint does not report, and why. Keep this list short and justified. */
const NOT_LINTED: Record<string, string> = {
  // Needs the full `@page` cascade (selectors, layers, `!important`, `@media print`) to compute each
  // page's content width; the strict render is the check.
  "css:page-varying-width": "computed from the @page cascade",
  // Depends on the `images` / `fonts` render options, which lint never sees.
  "image:unresolved": "depends on the images/baseUrl options",
  "font:invalid": "depends on the fonts option",
  // Measured on Blitz's parse; lint guards its own (deeper) recursion limit instead.
  "max-nesting-depth": "measured on the engine's own parse",
};

const lists = coreGateLists();

describe("lint's copy of the gate denylists matches validation.rs", () => {
  test("DENIED_ELEMENTS", () => {
    expect([...DENIED_ELEMENTS]).toEqual(lists.deniedElements);
  });
  test("DENIED_CSS_PROPERTIES", () => {
    expect(DENIED_CSS_PROPERTIES.map(([p, f]) => [p, f])).toEqual(lists.deniedCssProperties);
  });
  test("DENIED_CSS_TOKENS", () => {
    expect(DENIED_CSS_TOKENS.map(([t, f]) => [t, f])).toEqual(lists.deniedCssTokens);
  });
});

describe("every gate feature is linted or explicitly exempt", () => {
  const probed = new Set(rejectedGateProbes(lists).map((p) => p.feature));
  test.each(lists.features)("%s", (feature) => {
    if (feature in NOT_LINTED) {
      expect(probed.has(feature)).toBe(false);
      return;
    }
    expect(probed.has(feature), `no lint probe for gate feature ${feature}`).toBe(true);
  });

  test("the exemption list names only features the gate still emits", () => {
    for (const feature of Object.keys(NOT_LINTED)) {
      expect(lists.features).toContain(feature);
    }
  });
});

describe("a construct the gate rejects is a lint finding with the same feature", () => {
  test.each(rejectedGateProbes(lists).map((p) => [p.name, p] as const))("%s", (_name, probe) => {
    const report = diagnose(probe.html);
    expect(report.conformant).toBe(false);
    const finding = report.findings.find((f) => f.feature === probe.feature);
    expect(finding, JSON.stringify(report.findings)).toBeDefined();
    // Every gate rejection is an error, except `display:grid` on a cell, which `fix` rewrites.
    if (finding?.rule !== "flex-grid-in-td") {
      expect(finding).toMatchObject({ severity: "error", autoFixable: false });
    }
  });
});

describe("a near miss the gate accepts carries no gate feature", () => {
  test.each(acceptedGateProbes().map((p) => [p.name, p] as const))("%s", (_name, probe) => {
    const featured = diagnose(probe.html).findings.filter((f) => f.feature !== undefined);
    expect(featured).toEqual([]);
  });
});

describe("issue #60 inputs", () => {
  test.each([
    ['<p style="transform:rotate(1deg)">x</p>', "css:transform", { line: 1, col: 4 }],
    ["<style>p{transform:rotate(1deg)}</style>", "css:transform", { line: 1, col: 10 }],
    ['<div style="display:grid">x</div>', "css:grid", { line: 1, col: 6 }],
    ["<script>1</script>", "element:script", { line: 1, col: 1 }],
    ["<style>@keyframes k{}</style>", "css:keyframes", { line: 1, col: 8 }],
  ] as const)("%s → %s", (html, feature, location) => {
    const finding = diagnose(html).findings.find((f) => f.feature === feature);
    expect(finding).toMatchObject({ severity: "error", feature, location });
  });

  test("a <style> match is located on its own line inside the stylesheet", () => {
    const html = "<style>\n  p { color: red; }\n  .r { filter: blur(1px); }\n</style>";
    const finding = diagnose(html).findings.find((f) => f.feature === "css:filter");
    expect(finding).toMatchObject({ location: { line: 3, col: 8 }, snippet: "filter: blur(1px)" });
  });

  test("display:grid on a <td> stays an auto-fixable flex-grid-in-td warning, not a second error", () => {
    const html = '<table><tr><td style="display:grid"><span>a</span></td></tr></table>';
    const findings = diagnose(html).findings.filter((f) => f.feature === "css:grid");
    expect(findings).toHaveLength(1);
    expect(findings[0]).toMatchObject({ rule: "flex-grid-in-td", severity: "warning" });
    expect(fix(html).report.findings.filter((f) => !f.applied)).toEqual([]);
  });

  test("fix leaves the non-fixable constructs and reports them", () => {
    const result = fix('<p style="transform:rotate(1deg)">x</p><canvas></canvas>');
    const remaining = result.report.findings.filter((f) => !f.applied).map((f) => f.feature);
    expect(remaining.sort()).toEqual(["css:transform", "element:canvas"]);
  });
});

describe("owned conformant fixtures stay conformant to the gate", () => {
  test.each(["invoice", "receipt", "boleto", "notification"])("%s", (id) => {
    const featured = diagnose(resolveById(id).html).findings.filter((f) => f.feature);
    expect(featured).toEqual([]);
  });
});
