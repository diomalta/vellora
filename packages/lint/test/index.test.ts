import { expect, test, vi } from "vitest";
import * as lint from "../src/index";

const SVG_DETERMINISM_FIXTURE =
  '<!DOCTYPE html><html><body><svg width="8" height="8" viewBox="0 0 8 8" xmlns="http://www.w3.org/2000/svg"><rect width="8" height="8" fill="#fff"/><circle cx="4" cy="4" r="3" fill="#222"/></svg></body></html>';

const EXPECTED_SVG_PNG_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAYAAADED76LAAAAeElEQVR4nH2OQRHFIAxE9+sAEaAFAygABZxQAArwwQkkgYDfpHRaLu07JZs3mf39CXxwCmMM5JxRa6UIMMbAOUfTJcQYUUrBjrUWIYQlaK3BX3aklGitLUEphTknxQ9CCPTel5BSOjvscAfv/RJoB/fYS/KRuYU3Dk5FRulo0BsmAAAAAElFTkSuQmCC";

test("exposes the package name", () => {
  expect(lint.name).toBe("@vellora/lint");
});

test("exposes the public diagnose + fix surface", () => {
  expect(typeof lint.diagnose).toBe("function");
  expect(typeof lint.fix).toBe("function");
  expect(typeof lint.COMPAT_LINKS).toBe("object");
});

test("public entry diagnose + fix return the documented report shape", () => {
  const html =
    '<!DOCTYPE html><html><body><svg width="8" height="8"><rect width="8" height="8"/></svg></body></html>';
  const report = lint.diagnose(html);
  expect(report.conformant).toBe(false);
  expect(report.findings[0]).toMatchObject({
    rule: "inline-svg",
    severity: "error",
    autoFixable: true,
    location: { line: 1, col: 28 },
  });
  expect(typeof report.findings[0]?.suggestedFix).toBe("string");
  expect(typeof report.findings[0]?.snippet).toBe("string");
  expect(typeof report.findings[0]?.compatLink).toBe("string");

  const result = lint.fix(html);
  expect(result.html).toContain("data:image/png;base64,");
  expect(result.report.findings.some((f) => f.rule === "inline-svg" && f.applied)).toBe(true);
});

test("public entry does not import @vellora/native", async () => {
  vi.resetModules();
  vi.doMock("@vellora/native", () => {
    throw new Error("@vellora/native must not be imported by @vellora/lint");
  });
  const mod = await import("../src/index");
  expect(mod.diagnose("<p>ok</p>").conformant).toBe(true);
  expect(mod.fix("<p>ok</p>").report.conformant).toBe(true);
  vi.doUnmock("@vellora/native");
});

test("inline SVG fixture rasterizes to committed PNG bytes", () => {
  const fixed = lint.fix(SVG_DETERMINISM_FIXTURE).html;
  const base64 = fixed.match(/data:image\/png;base64,([^"]+)/)?.[1];
  expect(base64).toBe(EXPECTED_SVG_PNG_BASE64);
});
