// Text oracle: three independent extractors (poppler pdftotext, pdfminer.six, PyMuPDF) read the
// subject PDF and Chrome's own PDF of the same HTML (the control).
//
// Verdict basis (since 2026-10-21): the subject is compared with the control DIRECTLY, by the
// same extractor, by token COUNT (LCS alignment + order-free pairing of the rest), after
// removing @page margin-box runs from both by position (lib/margin-boxes.mjs). A token the
// subject has fewer copies of than the control is lost content. Chrome's innerText (print
// media) is the expected text for the recall metrics, and the comparison target only when there
// is no control. The earlier design compared each PDF with innerText and cancelled the
// subject's buckets against the control's by token identity; a deleted body "de" then paired
// with the footer "de" of "Página 1 de 3" and was hidden (validator finding, CONFIRMED).
import { join } from "node:path";
import { findExecutable, run, versionLine } from "./exec.mjs";
import { compareMarginBoxes, marginBoxTemplates, stripMarginBoxes } from "./margin-boxes.mjs";
import { PY_DIR, pythonUnavailableReason, venvPython } from "./paths.mjs";
import {
  compareTokens,
  copyPasteCheck,
  foldLigatures,
  normalizeText,
  tokenize,
} from "./tokens.mjs";

const EXAMPLES = 40;

async function popplerText(pdfPath) {
  const pdftotext = await findExecutable("pdftotext", "PDFTOTEXT_BIN");
  if (!pdftotext) {
    return { name: "pdftotext", error: "pdftotext not found (install poppler or PDFTOTEXT_BIN)" };
  }
  let result;
  try {
    result = await run(pdftotext, ["-enc", "UTF-8", pdfPath, "-"]);
  } catch (error) {
    return { name: "pdftotext", error: `cannot run ${pdftotext}: ${error.message}` };
  }
  return {
    name: "pdftotext",
    version: await versionLine(pdftotext, ["-v"]),
    path: pdftotext,
    ...(result.code === 0 ? { text: result.stdout } : { error: result.stderr.trim() }),
  };
}

async function pythonTexts(pdfPath) {
  const python = venvPython();
  if (!python) {
    const reason = pythonUnavailableReason();
    return [
      { name: "pdfminer.six", error: reason },
      { name: "pymupdf", error: reason },
    ];
  }
  let result;
  try {
    result = await run(python, ["-I", join(PY_DIR, "extract_text.py"), pdfPath]);
  } catch (error) {
    result = {
      code: error.code ?? "spawn-error",
      stderr: `cannot run ${python}: ${error.message}`,
    };
  }
  if (result.code !== 0) {
    return [
      { name: "pdfminer.six", error: result.stderr.trim() },
      { name: "pymupdf", error: result.stderr.trim() },
    ];
  }
  return JSON.parse(result.stdout).extractors;
}

export async function extractAll(pdfPath) {
  return [await popplerText(pdfPath), ...(await pythonTexts(pdfPath))];
}

const head = (tokens) => tokens.slice(0, EXAMPLES);

function summarizeComparison(comparison) {
  return {
    expectedTokens: comparison.expectedTokens,
    actualTokens: comparison.actualTokens,
    inOrder: comparison.inOrder,
    orderedRecall: comparison.orderedRecall,
    bagRecall: comparison.bagRecall,
    bagPrecision: comparison.bagPrecision,
    charBagRecall: comparison.charBagRecall,
    boundaryOnlyGroups: comparison.boundaryOnlyGroups,
    boundaryOnlyExamples: comparison.boundaryOnly,
    missingCount: comparison.missing.length,
    extraCount: comparison.extra.length,
    reorderedCount: comparison.reordered.length,
    missing: head(comparison.missing),
    extra: head(comparison.extra),
    reordered: head(comparison.reordered),
  };
}

/** Worst-first verdict of a list of per-extractor statuses (not-run entries ignored). */
export function aggregateStatus(statuses) {
  const ran = statuses.filter((s) => s !== "not-run");
  if (ran.length === 0) {
    return "not-run";
  }
  if (ran.includes("fail")) return "fail";
  if (ran.includes("warn")) return "warn";
  return "pass";
}

/**
 * Score one extractor's reading of the subject (and of the control, when it has one).
 * Pure: exported so test/text-verdict.test.mjs proves each verdict on crafted extractions.
 * - fail: the subject has fewer copies of a token than the reference (control body, else
 *   innerText), after boundary absorption; or a copy-paste defect (code points in the raw text,
 *   or fewer occurrences of a diacritic / ff-fi-fl word than the reference).
 * - warn: extra or reordered tokens against the reference, or fewer margin-box runs than the
 *   control (generated @page text the subject did not produce).
 */
export function scoreExtraction({ subjectText, controlText, expectedTokens, templates }) {
  const subjectBody = stripMarginBoxes(subjectText, templates);
  const controlBody = controlText === null ? null : stripMarginBoxes(controlText, templates);
  const referenceTokens = controlBody ? controlBody.bodyTokens : expectedTokens;
  const verdict = compareTokens(
    referenceTokens.map(foldLigatures),
    subjectBody.bodyTokens.map(foldLigatures),
  );
  const subjectVsExpected = compareTokens(expectedTokens, subjectBody.bodyTokens);
  const controlVsExpected = controlBody
    ? compareTokens(expectedTokens, controlBody.bodyTokens)
    : null;
  const marginBoxes = compareMarginBoxes(templates, controlBody, subjectBody);
  const copyPaste = copyPasteCheck(subjectText, {
    expectedTokens,
    subjectBodyTokens: subjectBody.bodyTokens,
    referenceBodyTokens: referenceTokens,
  });
  const controlCopyPaste =
    controlBody === null
      ? null
      : copyPasteCheck(controlText, {
          expectedTokens,
          subjectBodyTokens: controlBody.bodyTokens,
          referenceBodyTokens: expectedTokens,
        });
  let status = "pass";
  if (verdict.missing.length > 0 || !copyPaste.pass) {
    status = "fail";
  } else if (
    verdict.extra.length > 0 ||
    verdict.reordered.length > 0 ||
    marginBoxes.absent.length > 0
  ) {
    status = "warn";
  }
  return {
    status,
    reference: controlBody ? "control" : "innerText",
    subjectOnly: {
      missing: head(verdict.missing),
      missingCount: verdict.missing.length,
      // The full list (additive, 2026-10-22): the gate ratchets the SET of missing tokens per
      // extractor (fidelity/gate/compare.mjs compareMissingTokens); `missing` stays the first
      // 40 for the report.
      missingAll: verdict.missing,
      extra: head(verdict.extra),
      extraCount: verdict.extra.length,
      reordered: head(verdict.reordered),
      reorderedCount: verdict.reordered.length,
      boundaryOnlyGroups: verdict.boundaryOnlyGroups ?? 0,
      boundaryOnlyExamples: (verdict.boundaryOnlyAll ?? []).slice(0, EXAMPLES),
    },
    marginBoxes: {
      pages: { subject: subjectBody.pages, control: controlBody?.pages ?? null },
      perTemplate: marginBoxes.perTemplate,
      absent: marginBoxes.absent,
    },
    subject: summarizeComparison(subjectVsExpected),
    control: controlVsExpected ? summarizeComparison(controlVsExpected) : null,
    copyPaste: {
      pass: copyPaste.pass,
      subject: copyPaste,
      control: controlCopyPaste,
    },
  };
}

/**
 * @param pdfPath subject PDF; @param controlPdfPath Chrome's PDF of the same HTML (optional but
 * strongly recommended); @param expectedText Chrome innerText (print media); @param html the
 * HTML both PDFs were printed from (its @page margin-box templates; optional).
 */
export async function textOracle({ pdfPath, controlPdfPath, expectedText, html }) {
  const expectedTokens = tokenize(expectedText);
  const templates = html ? marginBoxTemplates(html) : [];
  const subjectExtractions = await extractAll(pdfPath);
  const controlExtractions = controlPdfPath ? await extractAll(controlPdfPath) : [];
  const extractors = [];
  for (const extraction of subjectExtractions) {
    if (extraction.error) {
      extractors.push({
        name: extraction.name,
        version: extraction.version,
        status: "not-run",
        reason: extraction.error,
      });
      continue;
    }
    const control = controlExtractions.find((c) => c.name === extraction.name);
    const scored = scoreExtraction({
      subjectText: extraction.text,
      controlText: control && !control.error ? control.text : null,
      expectedTokens,
      templates,
    });
    let referenceNote = "Chrome's PDF of the same HTML, read by the same extractor";
    if (!controlPdfPath) {
      referenceNote = "innerText (no control PDF)";
    } else if (!control || control.error) {
      referenceNote = `innerText (control extraction failed: ${control?.error ?? "missing"})`;
    }
    extractors.push({
      name: extraction.name,
      version: extraction.version,
      referenceNote,
      ...scored,
    });
  }
  return {
    oracle: "text",
    status: aggregateStatus(extractors.map((e) => e.status)),
    expected: {
      source:
        "Chrome document.body.innerText under emulated print media, NFC + whitespace collapse",
      tokens: expectedTokens.length,
      normalizedPreview: normalizeText(expectedText).slice(0, 400),
    },
    control: controlPdfPath
      ? "Chrome print-to-PDF of the same HTML (verdict reference)"
      : "none (innerText is the verdict reference)",
    marginBoxTemplates: html
      ? templates.map(({ parts: _parts, ...rest }) => rest)
      : "not provided (no html): margin-box runs are not removed",
    extractors,
  };
}
