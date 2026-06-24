import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { beforeEach, describe, expect, test, vi } from "vitest";
import {
  MockNativeBridge,
  type RenderData,
  VelloraUnsupportedError,
  renderPdf,
} from "../src/index";

// Mock @vellora/lint so the best-effort path is hermetic (real fixers are owned by lint-diagnose-fix).
const fixMock = vi.fn((html: string) => ({ html, report: { findings: [] } }));
vi.mock("@vellora/lint", () => ({ fix: (html: string) => fixMock(html) }));

beforeEach(() => {
  fixMock.mockClear();
});

// `test/` sits one level under the package, so `../../../fixtures` reaches the repo-root fixtures.
const FIXTURES = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..", "fixtures");

function fixture(id: string): { html: string; data: RenderData } {
  const html = readFileSync(join(FIXTURES, id, "index.html"), "utf8");
  const data = JSON.parse(readFileSync(join(FIXTURES, id, "data.json"), "utf8")) as RenderData;
  return { html, data };
}

const decode = (b: Uint8Array): string => new TextDecoder().decode(b);

describe("end-to-end renderPdf(invoiceHtml, data) over the invoice fixture", () => {
  const { html, data } = fixture("invoice");

  test("produces deterministic PDF-shaped output", async () => {
    const a = await renderPdf(html, data);
    const b = await renderPdf(html, data);
    const text = decode(a);
    expect(text.startsWith("%PDF-")).toBe(true);
    expect(text.trimEnd().endsWith("%%EOF")).toBe(true);
    expect(Buffer.from(a).equals(Buffer.from(b))).toBe(true);
  });

  test("the templated HTML reaching the bridge has every token resolved", async () => {
    const bridge = new MockNativeBridge();
    await renderPdf(html, data, { _bridge: bridge } as never);
    const final = bridge.calls[0]?.html ?? "";
    expect(final).not.toMatch(/\{\{|\}\}|\{%|%\}/);
    expect(final).toContain("INV-2026-00417");
    expect(final).toContain("R$"); // currency helper output
    expect(final).toContain("22/06/2026"); // date("DD/MM/YYYY") of issueDate
  });

  test("strict mode does not invoke @vellora/lint; best-effort does", async () => {
    await renderPdf(html, data, { strict: true });
    expect(fixMock).not.toHaveBeenCalled();

    await renderPdf(html, data, { strict: false });
    expect(fixMock).toHaveBeenCalledTimes(1);
  });
});

describe("the broken fixture is rejected by the strict gate", () => {
  const { html, data } = fixture("invoice-broken");

  test("renderPdf rejects with a located VelloraUnsupportedError in strict mode", async () => {
    const err = await renderPdf(html, data).catch((e) => e);
    expect(err).toBeInstanceOf(VelloraUnsupportedError);
    // invoice-broken carries @keyframes/animation and an inline <script>.
    expect(["css-animation", "inline-script"]).toContain(err.feature);
    expect(typeof err.line).toBe("number");
    expect(err.hint).toContain("vellora fix");
  });
});
