/**
 * End-to-end integration over the REAL stack (the real-stack integration target).
 *
 * `renderPdf(invoiceHtml, data)` → templating → strict gate → Blitz layout → pagination → krilla,
 * in-process via the real `@vellora/native` addon (NO subprocess, NO mock). Proves the napi-native
 * differentiator on the hardest fixture: the multi-page invoice. Rigorous PDF-structure assertions
 * (page count, repeated <thead>, selectable text, subset fonts) are covered by the Rust suite in
 * `vellora-core`; here we prove the full TypeScript→native→core path works and is deterministic.
 */
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { compareGolden, fixtureFont, fixtureImages, resolveById } from "@vellora/test-harness";
import { afterAll, beforeAll, describe, expect, test } from "vitest";
import { NativeAddonBridge, renderPdf } from "../src/index";

// The invoice fixture carries `<img src="assets/logo.png">`; supply its bytes so the strict gate
// resolves the image instead of rejecting it. Image source resolution is exercised end-to-end here.
const INVOICE_IMAGES = fixtureImages("invoice");

const realStack = (extra: Record<string, unknown> = {}): Record<string, unknown> => ({
  _bridge: new NativeAddonBridge(),
  images: INVOICE_IMAGES,
  ...extra,
});
const latin1 = (bytes: Uint8Array): string => Buffer.from(bytes).toString("latin1");

describe("renderPdf over the real @vellora/native stack", () => {
  test("renders the conformant invoice fixture to a real, valid PDF in-process", async () => {
    const { html, data } = resolveById("invoice");
    const pdf = await renderPdf(html, data as Record<string, unknown>, realStack() as never);

    const text = latin1(pdf);
    expect(text.startsWith("%PDF-")).toBe(true);
    expect(text.includes("%%EOF")).toBe(true);
    // A real multi-page invoice render is far larger than the ~300-byte mock stub.
    expect(pdf.length).toBeGreaterThan(3000);
  });

  // Regression: the only end-to-end test asserted just magic + size. This proves the TS layer
  // (resolveOptions → isoToYmd → napi to_render_options) actually threads metadata into the PDF: a
  // TS-supplied title lands in the Info dict and the creationDate maps to the expected y/m/d.
  test("TS-supplied metadata.title and creationDate land in the produced PDF", async () => {
    const { html, data } = resolveById("invoice");
    const opts = realStack({
      metadata: { title: "SENTINEL-TITLE-XYZ", creationDate: "2021-07-15T00:00:00.000Z" },
    });
    const pdf = await renderPdf(html, data as Record<string, unknown>, opts as never);
    const text = latin1(pdf);
    expect(text.includes("SENTINEL-TITLE-XYZ")).toBe(true);
    // krilla writes /CreationDate as (D:YYYYMMDD...); the y/m/d from isoToYmd must appear.
    expect(text.includes("20210715")).toBe(true);
  });

  test("is deterministic: two real renders with a fixed creation date are byte-identical", async () => {
    const { html, data } = resolveById("invoice");
    const opts = realStack({ metadata: { creationDate: "2020-05-01T00:00:00.000Z" } });
    const a = await renderPdf(html, data as Record<string, unknown>, opts as never);
    const b = await renderPdf(html, data as Record<string, unknown>, opts as never);
    expect(Buffer.from(a).equals(Buffer.from(b))).toBe(true);
  });

  test("a renderable <img> with no matching images entry rejects with a located image:unresolved", async () => {
    const html =
      '<!DOCTYPE html><html><head><style>@page{size:A4;margin:10mm}img{width:24px;height:24px}</style></head><body><img src="missing-logo.png" alt="x" /></body></html>';
    // The invoice images map has no "missing-logo.png" key, so resolution fails and the strict gate
    // rejects — proving the reject path surfaces across the real native boundary with its location.
    await expect(renderPdf(html, {}, realStack() as never)).rejects.toMatchObject({
      feature: "image:unresolved",
      line: expect.any(Number),
    });
  });

  // A document naming a family the bundled context does NOT provide ("DejaVu Sans Mono"). Supplying
  // that face via `fonts` must change the rendered bytes — proving the TS→napi→core thread actually
  // registers the caller's face (not just forwards it inertly, as the mock does).
  const fontDoc = (family: string): string =>
    `<!DOCTYPE html><html><head><style>@page{size:A4;margin:10mm}p{font-family:${family};font-size:16px}</style></head><body><p>Sphinx of black quartz 0123456789</p></body></html>`;

  test("a custom `fonts` face changes the rendered output over the real stack", async () => {
    const html = fontDoc('"DejaVu Sans Mono"');
    const bridge = new NativeAddonBridge();
    const without = await renderPdf(html, {}, { _bridge: bridge } as never);
    const withFont = await renderPdf(html, {}, {
      _bridge: bridge,
      fonts: [fixtureFont()],
    } as never);
    expect(latin1(without).startsWith("%PDF-")).toBe(true);
    expect(Buffer.from(withFont).equals(Buffer.from(without))).toBe(false);
  });

  // The first diagnostic to cross napi with NO source location: `font:invalid` (an option-level
  // failure, not a DOM node). Proves `line`/`col` cross the boundary as `null` (so the located-
  // diagnostic contract still maps it to a VelloraUnsupportedError) rather than as `undefined`.
  test("an unparseable `fonts` face rejects with font:invalid and a null source location", async () => {
    const html = fontDoc("sans-serif");
    await expect(
      renderPdf(html, {}, {
        _bridge: new NativeAddonBridge(),
        fonts: [new Uint8Array([0x00, 0x01, 0x02, 0x03])],
      } as never),
    ).rejects.toMatchObject({ feature: "font:invalid", line: null, col: null });
  });
});

// Regression: the golden primitive was exercised only on synthetic toy strings; no real
// rendered PDF was ever fed through it. This drives an actual invoice render through `compareGolden`
// in a temp dir (record the first render, then match the second), enforcing the "same input ⇒
// byte-stable PDF" invariant through the golden harness WITHOUT committing an ICU-pinned artifact.
describe("golden harness over a real rendered PDF", () => {
  let goldenDir: string;
  beforeAll(() => {
    goldenDir = mkdtempSync(join(tmpdir(), "vellora-real-golden-"));
  });
  afterAll(() => {
    rmSync(goldenDir, { recursive: true, force: true });
  });

  test("a real invoice render round-trips through compareGolden byte-exactly", async () => {
    const { html, data } = resolveById("invoice");
    const opts = realStack({ metadata: { creationDate: "2020-05-01T00:00:00.000Z" } });
    const first = await renderPdf(html, data as Record<string, unknown>, opts as never);
    // Record the first render as the golden. The `update` branch returns `{ pass: true }`
    // unconditionally, so assert the record side-effect (the golden file now exists) rather than the
    // tautological `.pass`.
    compareGolden("invoice", first, { goldenDir, update: true });
    expect(existsSync(join(goldenDir, "invoice.golden"))).toBe(true);
    // A second render with the SAME input must match the recorded golden byte-for-byte.
    const second = await renderPdf(html, data as Record<string, unknown>, opts as never);
    const cmp = compareGolden("invoice", second, { goldenDir, update: false });
    expect(cmp.pass).toBe(true);
    expect(cmp.diff).toBeUndefined();
  });

  // Regression: drive a real rendered PDF through compareGolden's MISMATCH path so the
  // structured-diff branch is actually exercised on real renderer output, not just toy strings. A
  // render with a DIFFERENT creationDate must NOT match the golden recorded above.
  test("a real render with different input does not match the golden (structured diff)", async () => {
    const { html, data } = resolveById("invoice");
    const different = await renderPdf(
      html,
      data as Record<string, unknown>,
      realStack({ metadata: { creationDate: "2021-09-30T00:00:00.000Z" } }) as never,
    );
    const cmp = compareGolden("invoice", different, { goldenDir, update: false });
    expect(cmp.pass).toBe(false);
    expect(cmp.diff).toMatch(/offset|size/);
  });
});
