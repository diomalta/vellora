// Orchestrates every oracle over one subject PDF. Reference artifacts (Chrome innerText, Chrome
// PDF, WeasyPrint PDF) depend only on the HTML and the reference engines, so callers may reuse a
// reference directory; the reuse is keyed on content (refDir/meta.json), never on the directory.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { barcodeOracle } from "./barcode.mjs";
import { chromeInnerText, chromePdf } from "./chrome.mjs";
import { TOOLS_IMAGE, inspectImage } from "./docker.mjs";
import {
  findLinhasDigitaveis,
  validateBoletoBarcode,
  validateLinhaDigitavel,
} from "./febraban.mjs";
import { referenceEngineHtml } from "./html-prep.mjs";
import { layoutOracle, renderWeasyPrint } from "./layout.mjs";
import { qpdfOracle } from "./qpdf.mjs";
import { fileFacts, portable, sha256 } from "./record.mjs";
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

/** Bump when the meaning of a cached reference artifact changes. */
export const REFERENCE_CACHE_VERSION = 1;

const DEFAULT_RENDERERS = Object.freeze({
  innerText: chromeInnerText,
  pdf: chromePdf,
  weasyprint: renderWeasyPrint,
  toolsImage: () => inspectImage(TOOLS_IMAGE),
});

function readMeta(path) {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch {
    return null;
  }
}

const sameKey = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const fileSha = (path) => (existsSync(path) ? sha256(readFileSync(path)) : null);

/**
 * Produce (or reuse) the HTML-only reference artifacts in refDir.
 *
 * Cache key (refDir/meta.json): sha256 of the exact reference HTML (which includes the injected
 * fonts and <base>), REFERENCE_CACHE_VERSION, and the engine that produced each artifact: Chrome
 * version + executable for innerText/chrome.pdf, the tools image ID for WeasyPrint. A cached file
 * is reused only when its key matches AND its bytes still hash to what meta.json recorded; any
 * mismatch re-renders. Without a usable Chrome nothing is reused (the cached Chrome version
 * cannot be confirmed) and text/layout are reported not-run. `artifacts.cache` records what
 * happened, and `artifacts.facts` the sha256 of every reference file, for the result record.
 * `withWeasyPrint: false` skips WeasyPrint (only the layout oracle uses it). `renderers` is
 * injectable for tests.
 */
export async function referenceArtifacts({
  templatedHtml,
  baseDir,
  refDir,
  chrome,
  chromeError,
  injectFonts = true,
  withWeasyPrint = true,
  renderers = DEFAULT_RENDERERS,
}) {
  mkdirSync(refDir, { recursive: true });
  const referenceHtml = referenceEngineHtml(templatedHtml, { baseDir, injectFonts });
  const htmlSha256 = sha256(referenceHtml);
  const metaPath = join(refDir, "meta.json");
  const previous = readMeta(metaPath);
  const innerTextPath = join(refDir, "chrome-innertext.txt");
  const chromePdfPath = join(refDir, "chrome.pdf");
  const weasyPath = join(refDir, "weasyprint.pdf");
  const weasyRecord = join(refDir, "weasyprint.json");
  const meta = { cacheVersion: REFERENCE_CACHE_VERSION, htmlSha256, injectFonts };
  const artifacts = {
    refDir,
    referenceHtml,
    referenceHtmlSha256: htmlSha256,
    chromePdfPath: null,
    innerTextPath,
    expectedText: null,
    errors: [],
    cache: {},
  };
  const previousBase =
    previous &&
    previous.cacheVersion === REFERENCE_CACHE_VERSION &&
    previous.htmlSha256 === htmlSha256 &&
    previous.injectFonts === injectFonts;

  // Chrome: expected text + control/first layout reference.
  if (!chrome) {
    artifacts.errors.push(`Chrome unavailable${chromeError ? `: ${chromeError}` : ""}`);
    artifacts.cache.chrome = "not used: Chrome unavailable";
  } else {
    const key = { version: chrome.version, executablePath: chrome.executablePath };
    const cached =
      previousBase &&
      previous.chrome &&
      sameKey(previous.chrome.key, key) &&
      fileSha(innerTextPath) === previous.chrome.innerTextSha256 &&
      fileSha(chromePdfPath) === previous.chrome.pdfSha256;
    if (!cached) {
      writeFileSync(innerTextPath, await renderers.innerText(chrome, referenceHtml));
      writeFileSync(chromePdfPath, await renderers.pdf(chrome, referenceHtml));
    }
    artifacts.cache.chrome = cached ? "hit" : previous ? "stale: re-rendered" : "miss: rendered";
    meta.chrome = {
      key,
      innerTextSha256: fileSha(innerTextPath),
      pdfSha256: fileSha(chromePdfPath),
    };
    artifacts.expectedText = readFileSync(innerTextPath, "utf8");
    artifacts.chromePdfPath = chromePdfPath;
  }

  // WeasyPrint: second layout reference. Only useful next to a Chrome PDF.
  if (!withWeasyPrint) {
    artifacts.weasy = { notRun: "layout oracle not selected" };
    artifacts.cache.weasyprint = "not used: layout oracle not selected";
    if (previousBase && previous.weasyprint) {
      meta.weasyprint = previous.weasyprint;
    }
  } else if (!artifacts.chromePdfPath) {
    artifacts.weasy = { notRun: "no Chrome reference PDF (layout consensus needs both)" };
    artifacts.cache.weasyprint = "not used: no Chrome reference";
  } else {
    const image = await renderers.toolsImage();
    if (!image.available) {
      artifacts.weasy = { notRun: image.reason };
      artifacts.cache.weasyprint = "not used: tools image unavailable";
    } else {
      const key = { image: TOOLS_IMAGE, imageId: image.id };
      const cached =
        previousBase &&
        previous.weasyprint &&
        sameKey(previous.weasyprint.key, key) &&
        fileSha(weasyPath) === previous.weasyprint.pdfSha256 &&
        existsSync(weasyRecord);
      if (cached) {
        artifacts.weasy = { ...JSON.parse(readFileSync(weasyRecord, "utf8")), pdfPath: weasyPath };
      } else {
        artifacts.weasy = await renderers.weasyprint(referenceHtml, refDir);
        const { pdfPath: _local, ...shareable } = artifacts.weasy;
        writeFileSync(weasyRecord, JSON.stringify(portable(shareable), null, 2));
      }
      artifacts.cache.weasyprint = cached
        ? "hit"
        : previous
          ? "stale: re-rendered"
          : "miss: rendered";
      if (!artifacts.weasy.notRun) {
        meta.weasyprint = { key, pdfSha256: fileSha(weasyPath) };
      }
    }
  }
  writeFileSync(metaPath, `${JSON.stringify(meta, null, 2)}\n`);
  artifacts.facts = {
    referenceHtmlSha256: htmlSha256,
    chromeInnerText: artifacts.chromePdfPath ? fileFacts(innerTextPath) : null,
    chromePdf: artifacts.chromePdfPath ? fileFacts(chromePdfPath) : null,
    weasyprintPdf: artifacts.weasy?.pdfPath ? fileFacts(artifacts.weasy.pdfPath) : null,
    weasyprint: artifacts.weasy?.tool ?? { notRun: artifacts.weasy?.notRun ?? null },
    cache: artifacts.cache,
  };
  return artifacts;
}

/** Run one oracle; an exception becomes a "not-run" verdict with the reason, never a crash. */
export async function guarded(id, fn) {
  try {
    return await fn();
  } catch (error) {
    return { oracle: id, status: "not-run", reason: `oracle error: ${error?.message ?? error}` };
  }
}

/**
 * Boleto document data: FEBRABAN/BCB check digits of the printed values. The linha digitável
 * is searched in EVERY extractor that ran; with none, the search is `not-run` (never an empty
 * list, which would read as "the PDF has no linha").
 */
export async function boletoTextChecks(pdfPath, expect, { extract = extractAll } = {}) {
  const extractions = await extract(pdfPath);
  const perExtractor = extractions.map((e) =>
    e.error
      ? { extractor: e.name, status: "not-run", reason: e.error }
      : {
          extractor: e.name,
          version: e.version,
          status: "ran",
          linhas: findLinhasDigitaveis(e.text).map((linha) => ({
            linha,
            ...validateLinhaDigitavel(linha),
          })),
        },
  );
  const ran = perExtractor.filter((p) => p.status === "ran");
  const distinct = [...new Set(ran.flatMap((p) => p.linhas.map((l) => l.linha)))];
  return {
    note: "FEBRABAN/BCB check digits of the values printed in the document. A failure here is a finding about the DOCUMENT DATA (fixture values), not about rendering.",
    expectedBarcode: expect.barcode?.digits
      ? { digits: expect.barcode.digits, ...validateBoletoBarcode(expect.barcode.digits) }
      : null,
    expectedLinhaDigitavel: expect.linhaDigitavel
      ? { linha: expect.linhaDigitavel, ...validateLinhaDigitavel(expect.linhaDigitavel) }
      : null,
    linhasInExtractedText:
      ran.length === 0
        ? {
            status: "not-run",
            reason: `no text extractor ran: ${perExtractor.map((p) => `${p.extractor}: ${p.reason}`).join("; ")}`,
            perExtractor,
          }
        : {
            status: "ran",
            // Occurrences per extractor (a boleto prints its linha on the recibo AND the ficha).
            maxOccurrences: Math.max(...ran.map((p) => p.linhas.length)),
            distinct: distinct.map((linha) => ({ linha, ...validateLinhaDigitavel(linha) })),
            perExtractor,
          },
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
    ? await guarded("qpdf", () => qpdfOracle({ pdfPath }))
    : skip("qpdf", "not selected");

  results.verapdf = selected.has("verapdf")
    ? await guarded("verapdf", () =>
        veraPdfOracle({
          pdfPath,
          expectCompliant: pdfa === undefined ? undefined : Boolean(pdfa),
        }),
      )
    : skip("verapdf", "not selected");

  if (!selected.has("text")) {
    results.text = skip("text", "not selected");
  } else if (refs.expectedText === null) {
    results.text = { oracle: "text", status: "not-run", reason: refs.errors.join("; ") };
  } else {
    results.text = await guarded("text", () =>
      textOracle({
        pdfPath,
        controlPdfPath: refs.chromePdfPath,
        expectedText: refs.expectedText,
        html: refs.referenceHtml,
      }),
    );
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
    results.barcode = await guarded("barcode", () =>
      barcodeOracle({
        pdfPath,
        workDir: join(workDir, "barcode-raster"),
        expect: { digits: expect.barcode?.digits },
      }),
    );
    results.barcode.documentData = await guarded("barcode-document-data", () =>
      boletoTextChecks(pdfPath, expect),
    );
  }

  if (!selected.has("layout")) {
    results.layout = skip("layout-consensus", "not selected");
  } else if (!refs.chromePdfPath) {
    results.layout = {
      oracle: "layout-consensus",
      status: "not-run",
      reason: `no Chrome reference PDF: ${refs.errors.join("; ")}`,
    };
  } else if (refs.weasy?.notRun) {
    results.layout = {
      oracle: "layout-consensus",
      status: "not-run",
      reason: `WeasyPrint: ${refs.weasy.notRun}`,
    };
  } else {
    results.layout = await guarded("layout-consensus", () =>
      layoutOracle({
        pdfPath,
        chromePdfPath: refs.chromePdfPath,
        weasyPdfPath: refs.weasy.pdfPath,
        weasyTool: refs.weasy.tool,
        workDir: join(workDir, "layout"),
      }),
    );
  }
  return results;
}

/** One-line verdict per oracle for console tables. */
export function verdictLine(results) {
  return Object.values(results)
    .map((r) => `${r.oracle}=${r.status}`)
    .join(" ");
}
