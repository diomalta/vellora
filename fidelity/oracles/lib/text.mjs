// Text oracle: three independent extractors (poppler pdftotext, pdfminer.six, PyMuPDF) read the
// subject PDF; each token sequence is compared with Chrome's print-media innerText of the same
// HTML. Every extractor ALSO reads Chrome's own PDF of that HTML (the control), so tokens that an
// extractor loses or invents for both producers (e.g. @page margin-box text that innerText never
// contains, letter-spaced digits split into single characters) are reported as explained rather
// than blamed on the subject.
import { join } from "node:path";
import { findExecutable, run, versionLine } from "./exec.mjs";
import { PY_DIR, venvPython } from "./paths.mjs";
import {
  againstControl,
  compareTokens,
  copyPasteCheck,
  multisetSplit,
  normalizeText,
  tokenize,
} from "./tokens.mjs";

const EXAMPLES = 40;

async function popplerText(pdfPath) {
  const pdftotext = await findExecutable("pdftotext", "PDFTOTEXT_BIN");
  if (!pdftotext) {
    return { name: "pdftotext", error: "pdftotext not found (install poppler or PDFTOTEXT_BIN)" };
  }
  const result = await run(pdftotext, ["-enc", "UTF-8", pdfPath, "-"]);
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
    return [
      { name: "pdfminer.six", error: "fidelity/.venv missing" },
      { name: "pymupdf", error: "fidelity/.venv missing" },
    ];
  }
  const result = await run(python, ["-I", join(PY_DIR, "extract_text.py"), pdfPath]);
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
    scatteredSplitCount: comparison.scatteredSplits.length,
    missing: head(comparison.missing),
    extra: head(comparison.extra),
    reordered: head(comparison.reordered),
    scatteredSplits: head(comparison.scatteredSplits),
  };
}

/**
 * @param pdfPath subject PDF; @param controlPdfPath Chrome's PDF of the same HTML (optional but
 * strongly recommended); @param expectedText Chrome innerText (print media).
 * Verdict per extractor: "fail" when the subject loses content the control keeps (subject-only
 * missing tokens, attributed on unaligned candidates BEFORE pairing; see tokens.mjs
 * againstControl) or fails the copy-paste round trip where the control passes; "warn" for
 * subject-only extra / reordered / scattered-split tokens and for control-generated content
 * (e.g. @page margin boxes) absent from the subject; "pass" otherwise.
 */
export async function textOracle({ pdfPath, controlPdfPath, expectedText }) {
  const expectedTokens = tokenize(expectedText);
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
    const control = controlExtractions.find((c) => c.name === extraction.name && !c.error);
    const subjectComparison = compareTokens(expectedTokens, tokenize(extraction.text));
    const controlComparison = control
      ? compareTokens(expectedTokens, tokenize(control.text))
      : null;
    const attribution = againstControl(subjectComparison, controlComparison);
    const copyPaste = copyPasteCheck(extraction.text, expectedTokens);
    const controlCopyPaste = control ? copyPasteCheck(control.text, expectedTokens) : null;
    const copyPasteSubjectOnly = {
      diacriticWords: multisetSplit(
        copyPaste.diacriticWords.missing,
        controlCopyPaste?.diacriticWords.missing ?? [],
      ).onlyA,
      ligatureWords: multisetSplit(
        copyPaste.ligatureWords.missing,
        controlCopyPaste?.ligatureWords.missing ?? [],
      ).onlyA,
      codepointDefects:
        copyPaste.ligatureCodepoints.count +
        copyPaste.combiningMarks.count +
        copyPaste.replacementChars.count +
        copyPaste.privateUse.count +
        copyPaste.controlChars.count,
    };
    const copyPasteFail =
      copyPasteSubjectOnly.codepointDefects > 0 ||
      copyPasteSubjectOnly.diacriticWords.length > 0 ||
      copyPasteSubjectOnly.ligatureWords.length > 0;
    // Tokens Chrome's PDF has beyond innerText (paginator-generated content such as @page
    // margin boxes) that the subject does not produce: invisible to the innerText comparison,
    // so reported separately (see againstControl).
    const generatedAbsent = attribution.generatedAbsent;
    let status = "pass";
    if (attribution.missing.subjectOnly.length > 0 || copyPasteFail) {
      status = "fail";
    } else if (
      attribution.extra.subjectOnly.length > 0 ||
      attribution.reordered.subjectOnly.length > 0 ||
      attribution.scatteredSplits.subjectOnly.length > 0 ||
      generatedAbsent.length > 0
    ) {
      status = "warn";
    }
    extractors.push({
      name: extraction.name,
      version: extraction.version,
      status,
      subject: summarizeComparison(subjectComparison),
      control: controlComparison ? summarizeComparison(controlComparison) : null,
      subjectOnly: {
        missing: head(attribution.missing.subjectOnly),
        missingCount: attribution.missing.subjectOnly.length,
        extra: head(attribution.extra.subjectOnly),
        extraCount: attribution.extra.subjectOnly.length,
        reordered: head(attribution.reordered.subjectOnly),
        reorderedCount: attribution.reordered.subjectOnly.length,
        scatteredSplits: head(attribution.scatteredSplits.subjectOnly),
        scatteredSplitCount: attribution.scatteredSplits.subjectOnly.length,
      },
      controlGeneratedAbsentFromSubject: {
        count: generatedAbsent.length,
        tokens: head(generatedAbsent),
      },
      subjectOnlyBoundaryGroups: multisetSplit(
        subjectComparison.boundaryOnlyAll.map((g) => `${g.expected} => ${g.actual}`),
        (controlComparison?.boundaryOnlyAll ?? []).map((g) => `${g.expected} => ${g.actual}`),
      ).onlyA.slice(0, EXAMPLES),
      explainedByControl: {
        missingCount: attribution.missing.explained.length,
        extraCount: attribution.extra.explained.length,
        reorderedCount: attribution.reordered.explained.length,
      },
      copyPaste: {
        pass: !copyPasteFail,
        subject: copyPaste,
        control: controlCopyPaste,
        subjectOnly: copyPasteSubjectOnly,
      },
    });
  }
  const ran = extractors.filter((e) => e.status !== "not-run");
  let status = "not-run";
  if (ran.length > 0) {
    status = ran.some((e) => e.status === "fail")
      ? "fail"
      : ran.some((e) => e.status === "warn")
        ? "warn"
        : "pass";
  }
  return {
    oracle: "text",
    status,
    expected: {
      source:
        "Chrome document.body.innerText under emulated print media, NFC + whitespace collapse",
      tokens: expectedTokens.length,
      normalizedPreview: normalizeText(expectedText).slice(0, 400),
    },
    control: controlPdfPath
      ? "Chrome print-to-PDF of the same HTML"
      : "none (attribution disabled)",
    extractors,
  };
}
