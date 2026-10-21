// Deliberately broken inputs. fidelity/README.md: "An oracle is only trusted after it has been
// shown to catch a deliberately broken input." Each canary states what the oracle MUST report;
// `caught` is computed from the oracle's own output, never assumed.
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { barcodeOracle } from "./barcode.mjs";
import { chromePdf } from "./chrome.mjs";
import { mod11BarcodeDv } from "./febraban.mjs";
import { itfCanaryHtml } from "./itf.mjs";
import { layoutOracle } from "./layout.mjs";
import { qpdfOracle } from "./qpdf.mjs";
import { textOracle } from "./text.mjs";
import { renderNative } from "./vellora.mjs";

/** Santander v36 worked example (p.6-14): a barcode with a valid mod-11 DV (8). */
export const VALID_BOLETO_BARCODE = "03398204600000273719028203356661245780020101";

/** Same barcode with position 5 changed so the mod-11 DV no longer matches. */
export function invalidDvBarcode(barcode = VALID_BOLETO_BARCODE) {
  const dv = mod11BarcodeDv(barcode.slice(0, 4) + barcode.slice(5));
  const wrong = dv === 9 ? 1 : dv + 1;
  return `${barcode.slice(0, 4)}${wrong}${barcode.slice(5)}`;
}

/** Corrupt a PDF: shift every xref offset digit run of object 1 and break startxref. */
export function corruptXref(bytes) {
  const text = Buffer.from(bytes).toString("latin1");
  const startxref = text.lastIndexOf("startxref");
  if (startxref === -1) {
    throw new Error("no startxref to corrupt");
  }
  const tail = text
    .slice(startxref)
    .replace(/startxref\s+(\d+)/, (_, n) => `startxref\n${Number(n) + 17}`);
  return Buffer.from(text.slice(0, startxref) + tail, "latin1");
}

export function truncatePdf(bytes, keep = 0.6) {
  return Buffer.from(bytes).subarray(0, Math.floor(bytes.length * keep));
}

/** Replace the first body text word of >= 5 letters with a marker word (subject-only edit). */
export function mutateFirstWord(html, marker = "VELLORACANARY") {
  const bodyStart = html.search(/<body[^>]*>/i);
  let replaced = null;
  const head = html.slice(0, bodyStart);
  const body = html
    .slice(bodyStart)
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/>([^<>]*?)(\p{L}{5,})/u, (match, before, word) => {
      replaced = word;
      return `>${before}${marker}`;
    });
  return { html: head + body, replaced, marker };
}

const LIGATURE_REFERENCE = `<!DOCTYPE html>
<html lang="pt-BR"><head><meta charset="utf-8"><title>copy-paste canary</title>
<style>@page { size: A4; margin: 20mm; } body { font-family: "Vellora Sans", sans-serif; font-size: 12pt; }</style>
</head><body>
<p>Ficha financeira: fim do perfil, conclusão da ação e atenção ao prazo.</p>
</body></html>
`;

/** Subject variants of the reference paragraph with copy-paste defects baked into the TEXT. */
export function copyPasteCanaryHtml(kind) {
  if (kind === "ligature") {
    return LIGATURE_REFERENCE.replace("financeira", "\uFB01nanceira").replace(
      "perfil",
      "per\uFB01l",
    );
  }
  if (kind === "nfd") {
    return LIGATURE_REFERENCE.replace("conclusão", "conclusa\u0303o").replace(
      "ação",
      "ac\u0327a\u0303o",
    );
  }
  return LIGATURE_REFERENCE;
}

async function write(path, bytes) {
  writeFileSync(path, bytes);
  return path;
}

/**
 * Run every canary. `context` provides a fixture already processed by the suite:
 * { fixtureId, templatedHtml, refs (reference artifacts), velloraPlainPdf, chrome }.
 */
export async function runCanaries({ outDir, chrome, textFixture, layoutFixture }) {
  mkdirSync(outDir, { recursive: true });
  const canaries = [];

  // 1. qpdf: broken startxref and a truncated file must not "pass".
  {
    const source = textFixture.velloraPlainPdfBytes;
    const broken = await write(join(outDir, "qpdf-bad-startxref.pdf"), corruptXref(source));
    const truncated = await write(join(outDir, "qpdf-truncated.pdf"), truncatePdf(source));
    for (const [name, pdfPath] of [
      ["qpdf: startxref offset shifted by 17 bytes", broken],
      ["qpdf: file truncated to 60%", truncated],
    ]) {
      const result = await qpdfOracle({ pdfPath });
      canaries.push({
        oracle: "qpdf",
        canary: name,
        mustReport: "status != pass",
        observed: `status=${result.status} exit=${result.check?.exitCode} warnings=${result.check?.warnings?.length ?? 0}`,
        caught: result.status !== "pass" && result.status !== "not-run",
        ran: result.status !== "not-run",
      });
    }
  }

  // 2. text: a vellora render of the fixture with one body word replaced, scored against the
  //    ORIGINAL reference (expected text + Chrome control) => subject-only missing + extra.
  {
    const mutation = mutateFirstWord(textFixture.templatedHtml);
    const pdfPath = await write(
      join(outDir, "text-mutated.pdf"),
      await renderNative(mutation.html),
    );
    const result = await textOracle({
      pdfPath,
      controlPdfPath: textFixture.refs.chromePdfPath,
      expectedText: textFixture.refs.expectedText,
    });
    for (const extractor of result.extractors) {
      const missing = extractor.subjectOnly?.missing ?? [];
      const extra = extractor.subjectOnly?.extra ?? [];
      const caught =
        missing.some((t) => t.toUpperCase().includes(mutation.replaced.toUpperCase())) &&
        extra.some((t) => t.includes(mutation.marker));
      canaries.push({
        oracle: `text/${extractor.name}`,
        canary: `${textFixture.fixtureId}: word "${mutation.replaced}" replaced by "${mutation.marker}" in the subject only`,
        mustReport: "subject-only missing contains the word and extra contains the marker",
        observed: `status=${extractor.status} missing=${JSON.stringify(missing.slice(0, 4))} extra=${JSON.stringify(extra.slice(0, 4))}`,
        caught,
        ran: extractor.status !== "not-run",
      });
    }
  }

  // 3. copy-paste: ligature presentation forms / NFD accents baked into the subject's text.
  {
    const referencePdf = await write(
      join(outDir, "copypaste-reference-chrome.pdf"),
      await chromePdf(chrome, LIGATURE_REFERENCE),
    );
    const { chromeInnerText } = await import("./chrome.mjs");
    const expectedText = await chromeInnerText(chrome, LIGATURE_REFERENCE);
    for (const kind of ["ligature", "nfd"]) {
      const pdfPath = await write(
        join(outDir, `copypaste-${kind}.pdf`),
        await renderNative(copyPasteCanaryHtml(kind)),
      );
      const result = await textOracle({ pdfPath, controlPdfPath: referencePdf, expectedText });
      const label =
        kind === "ligature"
          ? "U+FB01 written into the subject text"
          : "NFD (decomposed) accents in the subject text";
      for (const extractor of result.extractors) {
        const cp = extractor.copyPaste;
        canaries.push({
          oracle: `copy-paste/${extractor.name}`,
          canary: `${label} (vellora)`,
          mustReport: "copyPaste.pass === false",
          observed: cp
            ? `pass=${cp.pass} failures=${JSON.stringify(cp.subject.failures)}`
            : extractor.reason,
          caught: cp ? cp.pass === false : false,
          ran: extractor.status !== "not-run",
        });
      }
      // Same defective HTML printed by Chrome: shows what a browser keeps in its text layer for
      // the identical input (measurement, not a pass/fail canary).
      const chromeSubject = await write(
        join(outDir, `copypaste-${kind}.chrome.pdf`),
        await chromePdf(chrome, copyPasteCanaryHtml(kind)),
      );
      const chromeResult = await textOracle({
        pdfPath: chromeSubject,
        controlPdfPath: referencePdf,
        expectedText,
      });
      for (const extractor of chromeResult.extractors) {
        const cp = extractor.copyPaste;
        canaries.push({
          oracle: `copy-paste/${extractor.name}`,
          canary: `${label} (Chrome, measurement)`,
          mustReport: "measurement only",
          observed: cp
            ? `pass=${cp.pass} failures=${JSON.stringify(cp.subject.failures)}`
            : extractor.reason,
          caught: null,
          ran: extractor.status !== "not-run",
        });
      }
    }
  }

  // 4. barcode: valid ITF (pixel-aligned modules) must decode and validate; a wrong DV must be
  //    rejected by the BCB-2926 check; sub-pixel modules are a measured finding for BOTH engines.
  {
    const cases = [
      {
        id: "itf-valid-px",
        digits: VALID_BOLETO_BARCODE,
        opts: { narrow: 1, unit: "px" },
        expectStatus: "pass",
      },
      {
        id: "itf-bad-dv-px",
        digits: invalidDvBarcode(),
        opts: { narrow: 1, unit: "px" },
        expectStatus: "fail",
      },
      { id: "itf-valid-0.254mm", digits: VALID_BOLETO_BARCODE, opts: {}, expectStatus: null },
    ];
    for (const testCase of cases) {
      const html = itfCanaryHtml(testCase.digits, testCase.opts);
      for (const engine of ["vellora", "chrome"]) {
        const bytes =
          engine === "vellora" ? await renderNative(html) : await chromePdf(chrome, html);
        const pdfPath = await write(join(outDir, `${testCase.id}.${engine}.pdf`), bytes);
        const result = await barcodeOracle({
          pdfPath,
          workDir: join(outDir, `${testCase.id}.${engine}-raster`),
          expect: { digits: testCase.digits },
        });
        const decoded = result.decodedTexts ?? [];
        canaries.push({
          oracle: "barcode",
          canary: `${testCase.id} rendered by ${engine}`,
          mustReport:
            testCase.expectStatus === null
              ? "measurement only (sub-CSS-px modules)"
              : `status=${testCase.expectStatus}${testCase.expectStatus === "fail" ? " with the digits decoded and the DV rejected" : ""}`,
          observed: `status=${result.status} decoded=${JSON.stringify(decoded)} problems=${JSON.stringify(result.problems ?? [])}`,
          caught:
            testCase.expectStatus === null
              ? null
              : testCase.expectStatus === "pass"
                ? result.status === "pass"
                : result.status === "fail" && decoded.includes(testCase.digits),
          ran: result.status !== "not-run",
        });
      }
    }
  }

  // 5. layout: the fixture rendered by vellora with its body translated by +6pt must show a
  //    ~+6pt shift of the median signed dx against the consensus.
  if (layoutFixture?.refs?.weasy?.pdfPath) {
    const shiftCss =
      "<style>body { margin-left: 6pt !important; margin-right: -6pt !important; }</style>";
    const shifted = layoutFixture.templatedHtml.replace(/<\/head>/i, `${shiftCss}</head>`);
    const pdfPath = await write(join(outDir, "layout-shift-6pt.pdf"), await renderNative(shifted));
    const base = await layoutOracle({
      pdfPath: layoutFixture.velloraPlainPdfPath,
      chromePdfPath: layoutFixture.refs.chromePdfPath,
      weasyPdfPath: layoutFixture.refs.weasy.pdfPath,
      workDir: join(outDir, "layout-base"),
    });
    const moved = await layoutOracle({
      pdfPath,
      chromePdfPath: layoutFixture.refs.chromePdfPath,
      weasyPdfPath: layoutFixture.refs.weasy.pdfPath,
      workDir: join(outDir, "layout-shift"),
    });
    const before = base.primary?.subjectError?.medianDx;
    const after = moved.primary?.subjectError?.medianDx;
    const shift = before === null || after === null || before === undefined ? null : after - before;
    canaries.push({
      oracle: "layout-consensus",
      canary: `${layoutFixture.fixtureId}: body translated by +6pt in the subject only`,
      mustReport: "median signed dx shifts by 6 +/- 1 pt",
      observed: `medianDx ${before} -> ${after} (shift ${shift === null ? "n/a" : shift.toFixed(3)}pt); consensus words ${base.primary?.consensus} -> ${moved.primary?.consensus}`,
      caught: shift !== null && Math.abs(shift - 6) <= 1,
      ran: base.status !== "not-run" && moved.status !== "not-run",
    });
  }

  return canaries;
}
