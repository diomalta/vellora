// Paint probe (Phase C step 04, REPORT-ONLY): per page, vellora's paint vs Chrome's for the three
// paint facts no other oracle measures: the canvas background, dashed/dotted border segments and
// text-decoration underlines. Facts come from fidelity/oracles/py/paint.py (vector paint only,
// method in its docstring); this module compares them. Nothing here gates: the gate does not
// read the paint-probe section (fidelity/gate/* never imports this module).
import { execFileSync } from "node:child_process";
import { join } from "node:path";
import { PY_DIR, pythonUnavailableReason, venvPython } from "./paths.mjs";

export const PAINT_PROBE_SCHEMA = 1;
export const PAINT_PY = join(PY_DIR, "paint.py");

/**
 * How two pages compare. Canvas: the same colour (each channel within CANVAS_CHANNEL_TOLERANCE of
 * 255) and coverage within CANVAS_COVERAGE_TOLERANCE, or neither page has one. Counts are only
 * reported (Chrome and vellora split the same paint into different sub-paths only for the
 * dashes, which both draw one sub-path per dash).
 */
export const CANVAS_CHANNEL_TOLERANCE = 2;
export const CANVAS_COVERAGE_TOLERANCE = 0.02;

export const METHOD = Object.freeze({
  facts: "fidelity/oracles/py/paint.py (PyMuPDF get_drawings + text spans; docstring)",
  canvasChannelTolerance: CANVAS_CHANNEL_TOLERANCE,
  canvasCoverageTolerance: CANVAS_COVERAGE_TOLERANCE,
  gating: false,
});

/** paint.py payload of one PDF: { tool, version, pages: [...] }. */
export function paintFacts(pdfPath, python = venvPython()) {
  if (!python) throw new Error(pythonUnavailableReason());
  return JSON.parse(
    execFileSync(python, ["-I", PAINT_PY, pdfPath], { encoding: "utf8", maxBuffer: 1 << 26 }),
  );
}

const rgb = (hex) => [1, 3, 5].map((i) => Number.parseInt(hex.slice(i, i + 2), 16));

/** Whether two `canvas` facts (null or { color, coverage }) agree. */
export function canvasMatches(a, b) {
  if (!a || !b) return !a && !b;
  const [ca, cb] = [rgb(a.color), rgb(b.color)];
  return (
    ca.every((v, i) => Math.abs(v - cb[i]) <= CANVAS_CHANNEL_TOLERANCE) &&
    Math.abs(a.coverage - b.coverage) <= CANVAS_COVERAGE_TOLERANCE
  );
}

/**
 * Compare Chrome's and vellora's paint facts page by page. Returns { pages, chromePages,
 * perPage: [...], canvasMismatchPages: [page numbers], dashSegments: { chrome, vellora },
 * underlines: { chrome, vellora }, flags: [...] }. A page only one side has counts as a canvas
 * mismatch when the other side's canvas is not null. `flags` names the paint differences this
 * probe exists for: "canvas", "dashes-missing", "underlines-missing" (and "dashes-extra",
 * "underlines-extra" when vellora paints some Chrome does not).
 */
export function comparePaint(chrome, vellora) {
  const n = Math.max(chrome.pages.length, vellora.pages.length);
  const perPage = [];
  const canvasMismatchPages = [];
  const total = { dc: 0, dv: 0, uc: 0, uv: 0 };
  for (let i = 0; i < n; i++) {
    const c = chrome.pages[i] ?? null;
    const v = vellora.pages[i] ?? null;
    const match = canvasMatches(c?.canvas ?? null, v?.canvas ?? null);
    if (!match) canvasMismatchPages.push(i + 1);
    total.dc += c?.dashSegments ?? 0;
    total.dv += v?.dashSegments ?? 0;
    total.uc += c?.underlines ?? 0;
    total.uv += v?.underlines ?? 0;
    perPage.push({
      page: i + 1,
      canvas: { chrome: c?.canvas ?? null, vellora: v?.canvas ?? null, match },
      dashSegments: { chrome: c?.dashSegments ?? null, vellora: v?.dashSegments ?? null },
      underlines: { chrome: c?.underlines ?? null, vellora: v?.underlines ?? null },
      underlineLengthPt: {
        chrome: c?.underlineLengthPt ?? null,
        vellora: v?.underlineLengthPt ?? null,
      },
    });
  }
  const flags = [];
  if (canvasMismatchPages.length) flags.push("canvas");
  if (total.dc > 0 && total.dv === 0) flags.push("dashes-missing");
  if (total.dv > 0 && total.dc === 0) flags.push("dashes-extra");
  if (total.uc > total.uv) flags.push("underlines-missing");
  if (total.uv > total.uc) flags.push("underlines-extra");
  return {
    pages: vellora.pages.length,
    chromePages: chrome.pages.length,
    perPage,
    canvasMismatchPages,
    dashSegments: { chrome: total.dc, vellora: total.dv },
    underlines: { chrome: total.uc, vellora: total.uv },
    flags,
  };
}
