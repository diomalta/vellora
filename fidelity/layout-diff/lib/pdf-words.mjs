// PDF word extraction for pdf-probe v2: the layout oracle's own PyMuPDF extractor
// (fidelity/oracles/py/words.py, character ORIGINS: pen x + baseline), so REF-W and pdf-probe read
// the same words the same way. Runs the fidelity/.venv interpreter in isolated mode (-I).
import { execFileSync } from "node:child_process";
import { join } from "node:path";
import { PY_DIR, pythonUnavailableReason, venvPython } from "../../oracles/lib/paths.mjs";
import { flattenWordsPayload } from "./pdf-probe-v2.mjs";

export const WORDS_PY = join(PY_DIR, "words.py");
export const MUTATE_PY = join(PY_DIR, "pdf_mutate.py");

/** Python of fidelity/.venv, or throw with the reason it is unavailable. */
export function requirePython() {
  const python = venvPython();
  if (!python) throw new Error(pythonUnavailableReason());
  return python;
}

/** words.py payload of one PDF: { tool, version, pages: [{ page, width, height, words }] }. */
export function wordsPayload(pdfPath, python = requirePython()) {
  return JSON.parse(
    execFileSync(python, ["-I", WORDS_PY, pdfPath], { encoding: "utf8", maxBuffer: 1 << 28 }),
  );
}

/** Flat v2 words of one PDF ({ page, text, key, x, y = baseline, size, font }) + tool version. */
export function pdfWordsV2(pdfPath, python = requirePython()) {
  const payload = wordsPayload(pdfPath, python);
  return { words: flattenWordsPayload(payload), tool: `${payload.tool} ${payload.version}` };
}
