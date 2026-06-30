/**
 * Tests for `diagnose(html)` — the `lint-diagnostics` capability. Each `describe`/`test` maps to a
 * `#### Scenario` in specs/lint-diagnostics/spec.md. Driven off the owned fixtures via the shared
 * test-harness fixture loader.
 */
import { resolveById } from "@vellora/test-harness";
import { describe, expect, test } from "vitest";
import { COMPAT_LINKS } from "../src/compat";
import { diagnose } from "../src/diagnose";
import { fix } from "../src/fix";
import type { Finding } from "../src/types";

const CONFORMANT_IDS = ["invoice", "receipt", "boleto", "notification"] as const;

function broken(): string {
  return resolveById("invoice-broken").html;
}

function rulesOf(findings: Finding[]): string[] {
  return findings.map((f) => f.rule);
}

describe("Conformant HTML yields an empty report", () => {
  for (const id of CONFORMANT_IDS) {
    test(`fixture ${id} is conformant`, () => {
      const report = diagnose(resolveById(id).html);
      expect(report.findings).toEqual([]);
      expect(report.conformant).toBe(true);
    });
  }
});

describe("Out-of-subset HTML yields findings", () => {
  test("synthetic input: one svg, one flex td, one img[width], one mis-nested tag", () => {
    const html = [
      "<!DOCTYPE html><html><head><title>t</title></head><body>",
      '<svg width="10" height="10"><rect x="0" y="0" width="5" height="5"/></svg>',
      "<table><tbody><tr>",
      '<td style="display:flex"><span>a</span><span>b</span></td>',
      "</tr></tbody></table>",
      '<img src="x.png" width="120">',
      "<p><b><i>text</b></i></p>",
      "</body></html>",
    ].join("\n");
    const report = diagnose(html);
    const rules = rulesOf(report.findings);
    expect(rules).toContain("inline-svg");
    expect(rules).toContain("flex-grid-in-td");
    expect(rules).toContain("img-dimension-attrs");
    expect(rules).toContain("invalid-markup");
    expect(rules.filter((r) => r === "inline-svg")).toHaveLength(1);
    expect(rules.filter((r) => r === "flex-grid-in-td")).toHaveLength(1);
    expect(rules.filter((r) => r === "img-dimension-attrs")).toHaveLength(1);
    expect(rules.filter((r) => r === "invalid-markup")).toHaveLength(1);
  });

  test("diagnose does not rewrite the input (caller's string is unchanged)", () => {
    const html = broken();
    const before = html;
    diagnose(html);
    expect(html).toBe(before);
  });
});

describe("Broken fixture: one finding per violation", () => {
  test("each violation in invoice-broken is reported exactly once", () => {
    const report = diagnose(broken());
    const counts = new Map<string, number>();
    for (const r of rulesOf(report.findings)) {
      counts.set(r, (counts.get(r) ?? 0) + 1);
    }
    expect(counts.get("inline-svg")).toBe(1);
    expect(counts.get("flex-grid-in-td")).toBe(1);
    expect(counts.get("img-dimension-attrs")).toBe(1);
    expect(counts.get("invalid-markup")).toBe(1);
    expect(counts.get("script-element")).toBe(1);
    expect(counts.get("css-animation")).toBe(1);
    expect(report.conformant).toBe(false);
  });
});

describe("No network or filesystem access", () => {
  test("remote references are reported as findings, not fetched", () => {
    const html =
      '<!DOCTYPE html><html><head><link rel="stylesheet" href="https://cdn.example/x.css">' +
      "<title>t</title></head><body>" +
      '<img src="https://cdn.example/logo.png" width="40" height="40"></body></html>';
    const report = diagnose(html);
    expect(rulesOf(report.findings)).toContain("img-dimension-attrs");
    // The snippet/src still references the remote URL — proof it was read, not fetched/rewritten.
    expect(report.findings.some((f) => f.snippet.includes("cdn.example"))).toBe(true);
  });
});

describe("Finding carries a precise source location", () => {
  test("svg/img/td/script locations are 1-based and accurate in the broken fixture", () => {
    const findings = diagnose(broken()).findings;
    const byRule = (rule: string) => findings.find((f) => f.rule === rule);
    expect(byRule("inline-svg")?.location).toEqual({ line: 37, col: 7 });
    expect(byRule("img-dimension-attrs")?.location).toEqual({ line: 45, col: 7 });
    expect(byRule("flex-grid-in-td")?.location).toEqual({ line: 82, col: 9 });
    expect(byRule("invalid-markup")?.location).toEqual({ line: 63, col: 9 });
    expect(byRule("script-element")?.location).toEqual({ line: 106, col: 3 });
  });

  test("snippet contains the offending source fragment", () => {
    const findings = diagnose(broken()).findings;
    const svg = findings.find((f) => f.rule === "inline-svg");
    expect(svg?.snippet).toContain("<svg");
    const img = findings.find((f) => f.rule === "img-dimension-attrs");
    expect(img?.snippet).toContain('width="80"');
  });
});

describe("autoFixable flag matches available codemods", () => {
  test("the four codemod rules are autoFixable; diagnostics are not", () => {
    const findings = diagnose(broken()).findings;
    const auto = new Set([
      "inline-svg",
      "flex-grid-in-td",
      "img-dimension-attrs",
      "invalid-markup",
    ]);
    for (const f of findings) {
      if (auto.has(f.rule)) {
        expect(f.autoFixable).toBe(true);
      } else {
        expect(f.autoFixable).toBe(false);
      }
    }
    expect(findings.some((f) => !f.autoFixable)).toBe(true);
  });
});

describe("Every finding links to the compatibility table", () => {
  test("compatLink is non-empty and stable per rule", () => {
    const findings = diagnose(broken()).findings;
    for (const f of findings) {
      expect(f.compatLink.length).toBeGreaterThan(0);
      expect(f.compatLink).toBe(COMPAT_LINKS[f.rule]);
    }
  });

  test("two findings with the same rule carry the same compatLink", () => {
    const html =
      "<!DOCTYPE html><html><head><title>t</title></head><body>" +
      '<img src="a.png" width="10"><img src="b.png" height="20"></body></html>';
    const findings = diagnose(html).findings.filter((f) => f.rule === "img-dimension-attrs");
    expect(findings).toHaveLength(2);
    expect(findings[0]?.compatLink).toBe(findings[1]?.compatLink);
  });
});

describe("Detected violation rules", () => {
  test("inline svg is flagged with rule inline-svg, autoFixable", () => {
    const html = "<!DOCTYPE html><html><body><svg><rect/></svg></body></html>";
    const f = diagnose(html).findings.find((x) => x.rule === "inline-svg");
    expect(f?.autoFixable).toBe(true);
  });

  test("flex/grid inside a td is flagged with rule flex-grid-in-td, autoFixable", () => {
    const flexHtml =
      "<!DOCTYPE html><html><body><table><tbody><tr>" +
      '<td style="display:flex">x</td></tr></tbody></table></body></html>';
    const gridHtml = flexHtml.replace("display:flex", "display:grid");
    for (const html of [flexHtml, gridHtml]) {
      const f = diagnose(html).findings.find((x) => x.rule === "flex-grid-in-td");
      expect(f?.autoFixable).toBe(true);
    }
  });

  test("presentational image dims are flagged with rule img-dimension-attrs, autoFixable", () => {
    const html = '<!DOCTYPE html><html><body><img src="x.png" height="40"></body></html>';
    const f = diagnose(html).findings.find((x) => x.rule === "img-dimension-attrs");
    expect(f?.autoFixable).toBe(true);
  });

  test("malformed style attribute is flagged with rule invalid-markup", () => {
    const html = '<!DOCTYPE html><html><body><p style="display flex">x</p></body></html>';
    const f = diagnose(html).findings.find((x) => x.rule === "invalid-markup");
    expect(f).toBeDefined();
  });
});

// Regression: the element walk is iterative, so a pathologically deep document returns a
// structured report instead of overflowing the JS call stack with an uncaught RangeError.
describe("Deeply-nested HTML does not overflow the stack", () => {
  const deep = `${"<div>".repeat(20000)}x${"</div>".repeat(20000)}`;

  test("diagnose returns a Report without throwing", () => {
    let report: ReturnType<typeof diagnose> | undefined;
    expect(() => {
      report = diagnose(deep);
    }).not.toThrow();
    expect(report).toBeDefined();
    expect(Array.isArray(report?.findings)).toBe(true);
  }, 15_000);

  test("fix returns a result without throwing", () => {
    expect(() => fix(deep)).not.toThrow();
  }, 15_000);
});

describe("Deterministic report ordering", () => {
  test("repeated runs are deeply equal", () => {
    const html = broken();
    expect(diagnose(html)).toEqual(diagnose(html));
  });

  test("findings are ordered by source position (line, then col)", () => {
    const findings = diagnose(broken()).findings;
    const lines = findings.map((f) => f.location.line);
    const sorted = [...lines].sort((a, b) => a - b);
    expect(lines).toEqual(sorted);
  });
});
