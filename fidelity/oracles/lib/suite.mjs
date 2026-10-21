// Orchestrates every oracle over one subject PDF. Reference artifacts (Chrome innerText, Chrome
// PDF, WeasyPrint PDF) depend only on the HTML, so callers may pass a cache shared across modes.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { barcodeOracle } from "./barcode.mjs";
import { chromeInnerText, chromePdf } from "./chrome.mjs";
import {
  findLinhasDigitaveis,
  validateBoletoBarcode,
  validateLinhaDigitavel,
} from "./febraban.mjs";
import { referenceEngineHtml } from "./html-prep.mjs";
import { layoutOracle, renderWeasyPrint } from "./layout.mjs";
import { qpdfOracle } from "./qpdf.mjs";
import { portable } from "./record.mjs";
import { extractAll, textOracle } from "./text.mjs";
import { veraPdfOracle } from "./verapdf.mjs";

export const ORACLE_IDS = Object.freeze(["qpdf", "verapdf", "text", "barcode", "layout"]);
const BARCODE_CLASSES = new Set(["boleto"]);
/** Classes whose barcode symbology is known but not implemented: reported, never skipped. */
const UNIMPLEMENTED_BARCODE_CLASSES = new Map([
  [
    "danfe",
    "DANFE carries a Code 128 access-key barcode; only ITF (boleto) decoding is implemented",
  ],
]);

/** Produce (or reuse) the HTML-only reference artifacts in refDir. */
export async function referenceArtifacts({ templatedHtml, baseDir, refDir, chrome, injectFonts }) {
  mkdirSync(refDir, { recursive: true });
  const referenceHtml = referenceEngineHtml(templatedHtml, { baseDir, injectFonts });
  const innerTextPath = join(refDir, "chrome-innertext.txt");
  const chromePdfPath = join(refDir, "chrome.pdf");
  const artifacts = { refDir, referenceHtml, chromePdfPath, innerTextPath, errors: [] };
  if (!existsSync(innerTextPath) || !existsSync(chromePdfPath)) {
    if (!chrome) {
      artifacts.errors.push("Chrome unavailable");
    } else {
      writeFileSync(innerTextPath, await chromeInnerText(chrome, referenceHtml));
      writeFileSync(chromePdfPath, await chromePdf(chrome, referenceHtml));
    }
  }
  artifacts.expectedText = existsSync(innerTextPath) ? readFileSync(innerTextPath, "utf8") : null;
  if (!existsSync(chromePdfPath)) {
    artifacts.chromePdfPath = null;
  }
  const weasyPath = join(refDir, "weasyprint.pdf");
  const weasyRecord = join(refDir, "weasyprint.json");
  if (existsSync(weasyPath) && existsSync(weasyRecord)) {
    artifacts.weasy = { ...JSON.parse(readFileSync(weasyRecord, "utf8")), pdfPath: weasyPath };
  } else {
    artifacts.weasy = await renderWeasyPrint(referenceHtml, refDir);
    const { pdfPath: _local, ...shareable } = artifacts.weasy;
    writeFileSync(weasyRecord, JSON.stringify(portable(shareable), null, 2));
  }
  return artifacts;
}

async function boletoTextChecks(pdfPath, expect) {
  const extractions = await extractAll(pdfPath);
  const poppler = extractions.find((e) => e.name === "pdftotext" && !e.error);
  const found = poppler ? findLinhasDigitaveis(poppler.text) : [];
  return {
    note: "FEBRABAN/BCB check digits of the values printed in the document. A failure here is a finding about the DOCUMENT DATA (fixture values), not about rendering.",
    expectedBarcode: expect.barcode?.digits
      ? { digits: expect.barcode.digits, ...validateBoletoBarcode(expect.barcode.digits) }
      : null,
    expectedLinhaDigitavel: expect.linhaDigitavel
      ? { linha: expect.linhaDigitavel, ...validateLinhaDigitavel(expect.linhaDigitavel) }
      : null,
    linhasInExtractedText: found.map((linha) => ({ linha, ...validateLinhaDigitavel(linha) })),
    linhaMatchesBarcode:
      expect.barcode?.digits && expect.linhaDigitavel
        ? validateLinhaDigitavel(expect.linhaDigitavel).barcode === expect.barcode.digits
        : null,
  };
}

/**
 * @param opts.pdfPath subject PDF; opts.refs reference artifacts; opts.pdfa expected PDF/A
 * profile or null; opts.docClass e.g. "boleto"; opts.expect expectation object; opts.only
 * subset of ORACLE_IDS.
 */
export async function runOracles({ pdfPath, refs, pdfa, docClass, expect = {}, only, workDir }) {
  const selected = new Set(only ?? ORACLE_IDS);
  const results = {};
  const skip = (id, reason) => ({ oracle: id, status: "skipped", reason });

  results.qpdf = selected.has("qpdf")
    ? await qpdfOracle({ pdfPath })
    : skip("qpdf", "not selected");

  results.verapdf = selected.has("verapdf")
    ? await veraPdfOracle({
        pdfPath,
        expectCompliant: pdfa === undefined ? undefined : Boolean(pdfa),
      })
    : skip("verapdf", "not selected");

  if (!selected.has("text")) {
    results.text = skip("text", "not selected");
  } else if (refs.expectedText === null) {
    results.text = { oracle: "text", status: "not-run", reason: refs.errors.join("; ") };
  } else {
    results.text = await textOracle({
      pdfPath,
      controlPdfPath: refs.chromePdfPath,
      expectedText: refs.expectedText,
    });
  }

  const wantsBarcode = BARCODE_CLASSES.has(docClass) || Boolean(expect.barcode);
  if (!selected.has("barcode")) {
    results.barcode = skip("barcode", "not selected");
  } else if (UNIMPLEMENTED_BARCODE_CLASSES.has(docClass)) {
    results.barcode = {
      oracle: "barcode",
      status: "not-run",
      reason: UNIMPLEMENTED_BARCODE_CLASSES.get(docClass),
    };
  } else if (!wantsBarcode) {
    results.barcode = skip(
      "barcode",
      `class "${docClass ?? "unknown"}" carries no barcode and no --expect barcode`,
    );
  } else {
    results.barcode = await barcodeOracle({
      pdfPath,
      workDir: join(workDir, "barcode-raster"),
      expect: { digits: expect.barcode?.digits },
    });
    results.barcode.documentData = await boletoTextChecks(pdfPath, expect);
  }

  if (!selected.has("layout")) {
    results.layout = skip("layout-consensus", "not selected");
  } else if (refs.weasy?.notRun) {
    results.layout = {
      oracle: "layout-consensus",
      status: "not-run",
      reason: `WeasyPrint: ${refs.weasy.notRun}`,
    };
  } else {
    results.layout = await layoutOracle({
      pdfPath,
      chromePdfPath: refs.chromePdfPath,
      weasyPdfPath: refs.weasy.pdfPath,
      weasyTool: refs.weasy.tool,
      workDir: join(workDir, "layout"),
    });
  }
  return results;
}

/** One-line verdict per oracle for console tables. */
export function verdictLine(results) {
  return Object.values(results)
    .map((r) => `${r.oracle}=${r.status}`)
    .join(" ");
}
