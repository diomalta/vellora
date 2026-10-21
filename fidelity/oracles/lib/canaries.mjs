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

/** Corrupt a PDF: shift the startxref offset by 17 bytes (it no longer points at "xref"). */
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

/** Drop the final %%EOF marker (and anything after it); every offset stays valid. */
export function stripEofMarker(bytes) {
  const buffer = Buffer.from(bytes);
  const at = buffer.lastIndexOf("%%EOF");
  if (at === -1) {
    throw new Error("no %%EOF to strip");
  }
  return buffer.subarray(0, at);
}

/**
 * XOR 64 bytes in the middle of the largest FlateDecode stream: /Length, xref and every offset
 * stay intact, only the compressed data (and so its Adler-32) is wrong. In a vellora PDF the
 * largest stream is an embedded font (FontFile2), which `qpdf --check` does not decode.
 */
export function corruptLargestFlateStream(bytes) {
  const buffer = Buffer.from(bytes);
  const text = buffer.toString("latin1");
  let best = null;
  for (const m of text.matchAll(/<<([^>]*?)\/Length (\d+)([^>]*?)>>\s*stream\r?\n/g)) {
    if (!/FlateDecode/.test(m[1] + m[3])) {
      continue;
    }
    const length = Number(m[2]);
    if (!best || length > best.length) {
      best = { start: m.index + m[0].length, length };
    }
  }
  if (!best || best.length < 128) {
    throw new Error("no FlateDecode stream of >= 128 bytes to corrupt");
  }
  const out = Buffer.from(buffer);
  const from = best.start + Math.floor(best.length / 2);
  for (let k = 0; k < 64; k += 1) out[from + k] ^= 0x5a;
  return out;
}

const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * DELETE (not replace) the first body-text occurrence of `word` as a whole word, plus one
 * following separator (space, NBSP, &nbsp;). Tags, comments, <style> and <script> are never
 * touched. Used for the validator's deletion cases: a token that ALSO appears in the @page
 * footer ("de" of "Página 1 de 3") and one that repeats in reading-order-sensitive columns
 * ("R$"); both were hidden by the old identity-based attribution.
 */
export function deleteBodyWord(html, word) {
  const bodyStart = html.search(/<body[^>]*>/i);
  if (bodyStart === -1) {
    return { html, deleted: null };
  }
  const markup = [];
  const body = html.slice(bodyStart);
  for (const m of body.matchAll(/<!--[\s\S]*?-->|<(script|style)\b[\s\S]*?<\/\1\s*>|<[^>]*>/gi)) {
    markup.push([bodyStart + m.index, bodyStart + m.index + m[0].length]);
  }
  markup.push([html.length, html.length]);
  const pattern = new RegExp(`(^|[\\s\\xA0])(${escapeRegex(word)})(?=$|[\\s\\xA0]|&nbsp;|&#160;)`);
  let cursor = bodyStart;
  for (const [start, end] of markup) {
    if (start > cursor) {
      const match = pattern.exec(html.slice(cursor, start));
      if (match) {
        const at = cursor + match.index + match[1].length;
        let cut = at + word.length;
        const separator = html.slice(cut).match(/^(?:[ \xA0]|&nbsp;|&#160;)/);
        if (separator) {
          cut += separator[0].length;
        }
        return { html: html.slice(0, at) + html.slice(cut), deleted: word, offset: at };
      }
    }
    cursor = Math.max(cursor, end);
  }
  return { html, deleted: null };
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
/** A canary that could not run, with the reason (never dropped from the list). */
function notRun(oracle, canary, reason) {
  return { oracle, canary, mustReport: "n/a", observed: reason, caught: false, ran: false, reason };
}

/** Is `token` (case-insensitively: text-transform may upper-case it) in the list? */
const listsToken = (list, token) =>
  (list ?? []).some((t) => t.toUpperCase() === token.toUpperCase());

/**
 * Run every canary. `textFixture` / `layoutFixture` / `deletionFixture` are fixtures already
 * processed by the suite: { fixtureId, templatedHtml, refs, velloraPlainPdfBytes, ... }.
 * `chrome` may be null (then every Chrome-dependent canary is reported not-run with
 * `chromeError`).
 */
export async function runCanaries({
  outDir,
  chrome,
  chromeError,
  textFixture,
  layoutFixture,
  deletionFixture = textFixture,
}) {
  mkdirSync(outDir, { recursive: true });
  const canaries = [];
  const noChrome = `Chrome unavailable${chromeError ? `: ${chromeError}` : ""}`;

  // 1. qpdf: each structural defect must FAIL (not merely warn).
  {
    const source = textFixture.velloraPlainPdfBytes;
    const cases = [
      ["qpdf: startxref offset shifted by 17 bytes", "qpdf-bad-startxref.pdf", corruptXref],
      ["qpdf: file truncated to 60%", "qpdf-truncated.pdf", (b) => truncatePdf(b)],
      ["qpdf: trailing %%EOF removed (offsets intact)", "qpdf-no-eof.pdf", stripEofMarker],
      [
        "qpdf: 64 bytes XORed inside the largest FlateDecode stream (offsets intact)",
        "qpdf-bad-flate.pdf",
        corruptLargestFlateStream,
      ],
    ];
    for (const [name, file, build] of cases) {
      const pdfPath = await write(join(outDir, file), build(source));
      const result = await qpdfOracle({ pdfPath });
      canaries.push({
        oracle: "qpdf",
        canary: name,
        mustReport: "status = fail",
        observed: `status=${result.status} exit=${result.check?.exitCode} problems=${JSON.stringify((result.structuralProblems ?? []).slice(0, 2))} damage=${JSON.stringify((result.check?.damage ?? []).slice(0, 1))}`,
        caught: result.status === "fail",
        ran: result.status !== "not-run",
      });
    }
  }

  // 2. text: a vellora render of the fixture with one body word replaced, scored against the
  //    ORIGINAL reference (expected text + Chrome control) => subject-only missing + extra.
  if (textFixture.refs.expectedText === null) {
    canaries.push(notRun("text", `${textFixture.fixtureId}: word replaced by a marker`, noChrome));
  } else {
    const mutation = mutateFirstWord(textFixture.templatedHtml);
    const pdfPath = await write(
      join(outDir, "text-mutated.pdf"),
      await renderNative(mutation.html),
    );
    const result = await textOracle({
      pdfPath,
      controlPdfPath: textFixture.refs.chromePdfPath,
      expectedText: textFixture.refs.expectedText,
      html: textFixture.refs.referenceHtml,
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

  // 2b. text: DELETE a body word whose token also exists elsewhere unaligned: "de" (also in the
  //     @page footer "Página X de Y") and "R$" (repeats in the price columns). Both were hidden
  //     by the old identity-based attribution (validator finding, 2026-10-21).
  for (const word of ["de", "R$"]) {
    const label = `${deletionFixture.fixtureId}: first body "${word}" deleted in the subject only`;
    if (deletionFixture.refs.expectedText === null) {
      canaries.push(notRun("text", label, noChrome));
      continue;
    }
    const deletion = deleteBodyWord(deletionFixture.templatedHtml, word);
    if (!deletion.deleted) {
      canaries.push(notRun("text", label, `no body occurrence of "${word}"`));
      continue;
    }
    const safe = word.replace(/[^a-z0-9]/gi, "_");
    const pdfPath = await write(
      join(outDir, `text-deleted-${safe}.pdf`),
      await renderNative(deletion.html),
    );
    const result = await textOracle({
      pdfPath,
      controlPdfPath: deletionFixture.refs.chromePdfPath,
      expectedText: deletionFixture.refs.expectedText,
      html: deletionFixture.refs.referenceHtml,
    });
    for (const extractor of result.extractors) {
      const missing = extractor.subjectOnly?.missing ?? [];
      canaries.push({
        oracle: `text/${extractor.name}`,
        canary: label,
        mustReport: `status=fail with "${word}" subject-only missing`,
        observed: `status=${extractor.status} missing=${JSON.stringify(missing.slice(0, 6))}`,
        caught: extractor.status === "fail" && listsToken(missing, word),
        ran: extractor.status !== "not-run",
      });
    }
  }

  // 3. copy-paste: ligature presentation forms / NFD accents baked into the subject's text.
  if (!chrome) {
    canaries.push(notRun("copy-paste", "U+FB01 / NFD written into the subject text", noChrome));
  } else {
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
      const result = await textOracle({
        pdfPath,
        controlPdfPath: referencePdf,
        expectedText,
        html: LIGATURE_REFERENCE,
      });
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
        html: LIGATURE_REFERENCE,
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
        if (engine === "chrome" && !chrome) {
          canaries.push(notRun("barcode", `${testCase.id} rendered by chrome`, noChrome));
          continue;
        }
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
  if (!layoutFixture?.refs?.weasy?.pdfPath || !layoutFixture?.refs?.chromePdfPath) {
    canaries.push(
      notRun(
        "layout-consensus",
        `${layoutFixture?.fixtureId ?? "layout fixture"}: body translated by +6pt in the subject only`,
        layoutFixture?.refs?.chromePdfPath
          ? `WeasyPrint reference unavailable: ${layoutFixture?.refs?.weasy?.notRun ?? "not rendered"}`
          : noChrome,
      ),
    );
  } else {
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
