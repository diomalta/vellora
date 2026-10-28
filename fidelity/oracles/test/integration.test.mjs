// End-to-end oracle checks against REAL tools and a REAL vellora render. Opt-in because they
// need the native addon, fidelity/.venv, poppler and Docker images:
//   VELLORA_ORACLE_INTEGRATION=1 node --test fidelity/oracles/test/
// Without the variable every test is reported as SKIPPED with the reason (never silently).
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, test } from "node:test";
import { barcodeOracle } from "../lib/barcode.mjs";
import { VALID_BOLETO_BARCODE, truncatePdf } from "../lib/canaries.mjs";
import { itfCanaryHtml } from "../lib/itf.mjs";
import { qpdfOracle } from "../lib/qpdf.mjs";
import { renderNative } from "../lib/vellora.mjs";

const enabled = process.env.VELLORA_ORACLE_INTEGRATION === "1";
const skip = enabled
  ? false
  : "set VELLORA_ORACLE_INTEGRATION=1 (needs addon, .venv, poppler, docker)";
const dir = enabled ? mkdtempSync(join(tmpdir(), "vellora-oracles-")) : null;

after(() => {
  if (dir) rmSync(dir, { recursive: true, force: true });
});

test("qpdf passes a vellora render and fails a truncated copy", { skip }, async () => {
  const pdf = await renderNative(itfCanaryHtml(VALID_BOLETO_BARCODE, { narrow: 1, unit: "px" }));
  const good = join(dir, "good.pdf");
  const bad = join(dir, "bad.pdf");
  writeFileSync(good, pdf);
  writeFileSync(bad, truncatePdf(pdf));
  assert.equal((await qpdfOracle({ pdfPath: good })).status, "pass");
  assert.equal((await qpdfOracle({ pdfPath: bad })).status, "fail");
});

test("an ITF symbol rendered by vellora decodes and validates", { skip }, async () => {
  const pdf = await renderNative(itfCanaryHtml(VALID_BOLETO_BARCODE, { narrow: 1, unit: "px" }));
  const pdfPath = join(dir, "itf.pdf");
  writeFileSync(pdfPath, pdf);
  const result = await barcodeOracle({
    pdfPath,
    workDir: join(dir, "itf-raster"),
    expect: { digits: VALID_BOLETO_BARCODE },
  });
  assert.equal(result.status, "pass", JSON.stringify(result.problems));
  assert.ok(result.decodedTexts.includes(VALID_BOLETO_BARCODE));
});

test("rendering through the oracle helpers is byte-deterministic", { skip }, async () => {
  const html = itfCanaryHtml(VALID_BOLETO_BARCODE, { narrow: 1, unit: "px" });
  const [a, b] = [await renderNative(html), await renderNative(html)];
  assert.deepEqual(Buffer.from(a), Buffer.from(b));
});
