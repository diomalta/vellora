/**
 * Tests for `fix(html)` and the four codemod rules — the `lint-autofix` capability. Each
 * `describe`/`test` maps to a `#### Scenario` in specs/lint-autofix/spec.md. Driven off the owned
 * fixtures plus minimal synthetic inputs that isolate a single rule.
 */
import { resolveById } from "@vellora/test-harness";
import { describe, expect, test } from "vitest";
import { diagnose } from "../src/diagnose";
import { fix } from "../src/fix";
import type { Finding } from "../src/types";

function broken(): string {
  return resolveById("invoice-broken").html;
}

function appliedRules(findings: Finding[]): string[] {
  return findings.filter((f) => f.applied).map((f) => f.rule);
}

function remainingRules(findings: Finding[]): string[] {
  return findings.filter((f) => !f.applied).map((f) => f.rule);
}

describe("fix returns rewritten HTML and a report", () => {
  test("auto-fixable violations are rewritten; report lists applied + remaining", () => {
    const result = fix(broken());
    expect(appliedRules(result.report.findings).sort()).toEqual(
      ["flex-grid-in-td", "img-dimension-attrs", "inline-svg", "invalid-markup"].sort(),
    );
    expect(remainingRules(result.report.findings).sort()).toEqual(
      ["css-animation", "script-element"].sort(),
    );
    expect(result.html).not.toContain("<svg");
    expect(result.html).toContain("data:image/png;base64,");
  });
});

describe("Conformant input is returned unchanged", () => {
  for (const id of ["invoice", "receipt", "boleto", "notification"] as const) {
    test(`fixture ${id}: no applied fixes, output is its own fixed point`, () => {
      const html = resolveById(id).html;
      const result = fix(html);
      expect(appliedRules(result.report.findings)).toEqual([]);
      expect(result.report.conformant).toBe(true);
      // Re-fixing is a no-op (semantic stability of conformant input).
      expect(fix(result.html).html).toBe(result.html);
    });
  }
});

describe("Inline SVG to PNG codemod", () => {
  test("svg is replaced by an <img> with a data:image/png;base64 src", () => {
    const html =
      '<!DOCTYPE html><html><body><svg width="10" height="10"><rect width="5" height="5"/></svg></body></html>';
    const result = fix(html);
    expect(result.html).not.toContain("<svg");
    expect(result.html).toMatch(/<img[^>]*src="data:image\/png;base64,[A-Za-z0-9+/=]+"/);
    const entry = result.report.findings.find((f) => f.rule === "inline-svg");
    expect(entry?.applied).toBe(true);
  });

  test("rasterization is in-process and deterministic (same PNG bytes twice)", () => {
    const html = "<!DOCTYPE html><html><body><svg><rect width='4' height='4'/></svg></body></html>";
    const a = fix(html).html;
    const b = fix(html).html;
    expect(a).toBe(b);
    const dataUriA = a.match(/data:image\/png;base64,([A-Za-z0-9+/=]+)/)?.[1];
    const dataUriB = b.match(/data:image\/png;base64,([A-Za-z0-9+/=]+)/)?.[1];
    expect(dataUriA).toBeDefined();
    expect(dataUriA).toBe(dataUriB);
  });

  // Regression: an SVG resvg cannot render (here, a zero-size SVG resvg rejects as an
  // "invalid size") must NOT crash fix(); the <svg> is left unconverted so a downstream strict
  // re-detect surfaces a located diagnostic instead of a raw resvg Error escaping the render.
  test("an unrenderable SVG leaves the <svg> unconverted instead of throwing", () => {
    const html = '<!DOCTYPE html><html><body><svg width="0" height="0"><rect/></svg></body></html>';
    let result: ReturnType<typeof fix> | undefined;
    expect(() => {
      result = fix(html);
    }).not.toThrow();
    expect(result?.html).toContain("<svg");
    expect(result?.html).not.toContain("data:image/png;base64,");
    expect(diagnose(result?.html ?? "").findings.some((f) => f.rule === "inline-svg")).toBe(true);
  });
});

describe("Flex/grid in table cell codemod", () => {
  test("flex cell becomes a nested table; display:flex removed", () => {
    const html =
      "<!DOCTYPE html><html><body><table><tbody><tr>" +
      '<td style="display:flex"><span>a</span><span>b</span></td>' +
      "</tr></tbody></table></body></html>";
    const result = fix(html);
    expect(result.html).not.toMatch(/<td[^>]*display:flex/);
    expect(result.html).toContain(
      "<td><table><tbody><tr><td><span>a</span></td><td><span>b</span></td></tr></tbody></table></td>",
    );
    expect(result.report.findings.find((f) => f.rule === "flex-grid-in-td")?.applied).toBe(true);
  });

  test("grid cell is also converted", () => {
    const html =
      "<!DOCTYPE html><html><body><table><tbody><tr>" +
      '<td style="display:grid"><span>x</span></td>' +
      "</tr></tbody></table></body></html>";
    const result = fix(html);
    expect(result.html).not.toMatch(/display:grid/);
    expect(result.html).toContain(
      "<td><table><tbody><tr><td><span>x</span></td></tr></tbody></table></td>",
    );
  });

  test("child content (text + elements) is preserved in original order", () => {
    const html =
      "<!DOCTYPE html><html><body><table><tbody><tr>" +
      '<td style="display:flex; gap:4px;">A<span>B</span>C</td>' +
      "</tr></tbody></table></body></html>";
    const result = fix(html);
    // Other style declarations (gap) are kept; display is dropped.
    expect(result.html).toMatch(/<td style="gap:4px">/);
    expect(result.html).toContain(
      '<td style="gap:4px"><table><tbody><tr><td>A</td><td><span>B</span></td><td>C</td></tr></tbody></table></td>',
    );
  });
});

describe("Image dimension attributes to CSS codemod", () => {
  test("width/height attributes become CSS; attributes removed", () => {
    const html =
      '<!DOCTYPE html><html><body><img src="logo.png" width="120" height="80"></body></html>';
    const result = fix(html);
    expect(result.html).toContain('style="width:120px;height:80px"');
    expect(result.html).not.toMatch(/<img[^>]*\swidth=/);
    expect(result.html).not.toMatch(/<img[^>]*\sheight=/);
    expect(result.report.findings.find((f) => f.rule === "img-dimension-attrs")?.applied).toBe(
      true,
    );
  });

  test("existing inline styles are preserved", () => {
    const html =
      '<!DOCTYPE html><html><body><img src="x.png" style="border:1px solid" width="120"></body></html>';
    const result = fix(html);
    expect(result.html).toContain('style="border:1px solid;width:120px"');
  });
});

describe("Invalid markup sanitization codemod", () => {
  test("mis-nested tags are normalized and text is preserved", () => {
    const html = "<!DOCTYPE html><html><body><p><b><i>text</b></i></p></body></html>";
    const result = fix(html);
    expect(result.html).toContain("<b><i>text</i></b>");
    expect(result.html).toContain("text");
  });

  test("malformed style attribute is repaired and recorded", () => {
    const html =
      '<!DOCTYPE html><html><body><p style="display flex; color:red">x</p></body></html>';
    const result = fix(html);
    expect(result.html).toContain('style="color:red"');
    expect(result.html).not.toContain("display flex");
    expect(result.report.findings.some((f) => f.rule === "invalid-markup")).toBe(true);
  });
});

describe("Idempotent fixes", () => {
  test("fix is a fixed point on the broken fixture", () => {
    const first = fix(broken());
    const second = fix(first.html);
    expect(second.html).toBe(first.html);
    expect(appliedRules(second.report.findings)).toEqual([]);
  });
});

describe("Deterministic output", () => {
  test("repeated runs are byte-identical, including PNG data URIs", () => {
    const html = broken();
    const a = fix(html);
    const b = fix(html);
    expect(a.html).toBe(b.html);
    expect(a.report).toEqual(b.report);
  });
});

describe("Integration: fix produces a document diagnose finds free of auto-fixable issues", () => {
  test("after fix, no auto-fixable findings remain (only diagnostics)", () => {
    const result = fix(broken());
    const after = diagnose(result.html);
    const auto = new Set([
      "inline-svg",
      "flex-grid-in-td",
      "img-dimension-attrs",
      "invalid-markup",
    ]);
    expect(after.findings.every((f) => !auto.has(f.rule))).toBe(true);
    expect(after.findings.map((f) => f.rule).sort()).toEqual(
      ["css-animation", "script-element"].sort(),
    );
  });

  test("a document with only auto-fixable violations fixes to an empty diagnose report", () => {
    // The broken fixture deliberately also carries non-auto-fixable violations (script, animation);
    // remove them so this exercise covers the "fix -> conformant -> empty report" path.
    const html = broken()
      .replace(/<script>[\s\S]*?<\/script>/, "")
      .replace(/@keyframes[\s\S]*?\n {4}}/, "")
      .replace(/animation:[^;]*;/, "");
    // Sanity: the trimmed input still has the four auto-fixable violations and no diagnostics.
    const before = diagnose(html);
    expect(before.findings.map((f) => f.rule).sort()).toEqual(
      ["flex-grid-in-td", "img-dimension-attrs", "inline-svg", "invalid-markup"].sort(),
    );
    const result = fix(html);
    const after = diagnose(result.html);
    expect(after.findings).toEqual([]);
    expect(after.conformant).toBe(true);
  });
});
