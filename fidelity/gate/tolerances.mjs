// Per-metric tolerances of the value ratchet (fidelity/ACCEPTANCE.md "Gate: value ratchet").
// A metric REGRESSES when it moves in its bad direction by MORE than its tolerance versus the
// baseline. Every entry carries its rationale and an evidence label (DESIGN TARGET unless the
// number comes from a specification). Kept in one table so ACCEPTANCE.md, the gate report and the
// self-tests cite the same numbers.

/** 1 CSS px in mm (1/96 in). */
export const CSS_PX_MM = 25.4 / 96;

// `resolution`: the rounding of the reported value (pdf-probe words 0.01 pt, layout-diff/lib/
// pdf-probe-v2.mjs round2; REF-W / REF-R / DANFE-L1 0.01 mm as printed by the oracles; geometry
// excess 0.001 mm, the 3 decimals measure_bars / the corpus print; counts and page deltas are
// integers). GATE-D7 ties a NEW DEBT.json key to the run with it: ceiling <= |measured| +
// resolution (no tolerance slack) and |layerVector.run| in the gate's unit = measured within it.
export const TOLERANCES = Object.freeze({
  "position-mm": {
    tol: 0.1,
    resolution: 0.01,
    unit: "mm",
    label: "DESIGN TARGET",
    why: "word/anchor position error vs a reference (REF-W max/p95, REF-R worst anchor, DANFE-L1, LET-1). 0.1 mm (0.28 pt, 0.38 CSS px) is 10x the 0.01 mm the values are reported with and below one CSS px (0.26 mm), the smallest step a px-snapping layout can move; the measurement is deterministic for one build and one reference (CONFIRMED: equal inputs gave equal values in the Phase A repeat run).",
  },
  "geometry-excess-mm": {
    tol: 0.05,
    resolution: 0.001,
    unit: "mm",
    label: "DESIGN TARGET",
    why: "distance OUTSIDE a specification window (BOL-G*, DANFE-B*, DANFE-M1, TXT-A1). Inside the window the spec admits any value, so only the excess is ratcheted; 0.05 mm is about one 600 dpi raster pixel (0.042 mm), the measurement quantum of measure_bars.py / the page ink box.",
  },
  "font-excess-pt": {
    tol: 0.05,
    resolution: 0.01,
    unit: "pt",
    label: "SPEC-derived tolerance unit",
    why: "font-size excess outside a window; 0.05 pt is the tolerance ACCEPTANCE.md already applies to every font-size criterion (BOL-T*, DANFE-F*).",
  },
  count: {
    tol: 0,
    resolution: 0,
    unit: "count",
    label: "DESIGN TARGET",
    why: "integer counts from deterministic tools (required strings found, extractor missing/extra tokens, segments/glyphs attributed, decoded symbols): any loss is a real change of the document.",
  },
  "page-delta": {
    tol: 0,
    resolution: 0,
    unit: "pages",
    label: "DESIGN TARGET",
    why: "|vellora pages - reference pages|: a page break moving is never noise.",
  },
  "pdf-probe-pt": {
    tol: 1.0,
    resolution: 0.01,
    unit: "pt",
    label: "DESIGN TARGET",
    why: "per-word |dx| / |dy| of vellora's PDF vs Chrome's PDF (pdf-probe semantics 2: PyMuPDF pen origin and baseline, same-page position pairs keyed by the Chrome word). 1 pt (0.35 mm) is an order of magnitude below the Phase A regressions it must catch (invoice price column +9 pt, notification signature -14 pt) and above the 0.01 pt rounding of the probe and sub-px snapping differences. The per-fixture unpaired-word counts use the count class.",
  },
});

/**
 * Layer-vector step tolerance (fidelity/gate/layer-vector.mjs, DEBT.json relaxed (b) rule): a layer
 * step at most this large is not a layer MOVE (it need not be a named compensator, and |run| may
 * exceed |N0| by it). 0.5 CSS px is layout-diff's own attribution tolerance (config.tolerance);
 * on page 1 the PDF-level word baselines sit within -0.61..+1.11 px of layer P across the step-07
 * head-gating words (median per fixture -0.31..+0.48 px; layer-vector.mjs on the step-07 run copy,
 * 2026-10-21), i.e. the Chrome DOM-vs-PDF rounding the vector cannot remove. DESIGN TARGET.
 */
export const LAYER_STEP_TOLERANCE = Object.freeze({ px: 0.5 });
export const layerStepTolerance = (unit) => LAYER_STEP_TOLERANCE[unit] ?? 0.01;

const PX_PER = Object.freeze({ pt: 4 / 3, mm: 96 / 25.4, px: 1 });

/**
 * The ONE run tolerance of a layer vector's PDF-level step (P -> run) and of |run| <= |N0| + it, in
 * CSS px, shared by every tolClass a layer vector is built for (VECTOR_RUN_TOL_CLASSES): the
 * pdf-probe word gate tolerance (1 pt = 1.333 px). N0..P are deltas vs Chrome's continuous DOM
 * layout, run is the delta vs Chrome's PDF; the two references differ by Chrome's own DOM-vs-PDF
 * offset, which no vellora layer causes. Rule (ii) of Phase B integration 5 (2026-10-27): the
 * position-mm vectors (DANFE-L1 posErrMm spec anchors) used max(0.5 px, 0.1 mm = 0.378 px) = 0.5 px,
 * BELOW that measured offset, so a title no vellora layer moves (DANFE-L1d, only step P -> run
 * +0.626 px) could not be (b). Measured (CONFIRMED, fidelity/gate/snapshots/2026-10-27/10-final/
 * scripts/run_p_spread.mjs on the committed 10-debt head vectors of run 20261023T004510Z,
 * 2026-10-27): run - P over the 459 danfe page-1 words, dy median +0.557, range -0.284..+1.113 px
 * (dx +0.447..+1.233 px); over all 7 fixtures and both axes |run - P| <= 1.233 px. The largest,
 * + the 0.01 pt (0.013 px) probe resolution, is 1.246 px < 1.333 px, so the pdf-probe value covers
 * it and is kept: one value, not two. A step above it (e.g. +1.5 px) still gates. DESIGN TARGET
 * (the bound is measured on one run and one Chrome, 155.0.8059.85).
 */
export const VECTOR_RUN_TOLERANCE_PX = TOLERANCES["pdf-probe-pt"].tol * PX_PER.pt;
/** tolClasses whose layer vectors use VECTOR_RUN_TOLERANCE_PX (the only ones with vectors). */
export const VECTOR_RUN_TOL_CLASSES = Object.freeze(["pdf-probe-pt", "position-mm"]);

/**
 * Tolerance of the PDF-level step (P -> run) and of |run| <= |N0| in a layer vector, in `unit`:
 * VECTOR_RUN_TOLERANCE_PX for pdf-probe-pt and position-mm (never below the layer step
 * tolerance); any other class keeps max(layer step tolerance, its own gate tolerance in `unit`).
 * DESIGN TARGET.
 */
export function vectorRunTolerance(tolClass, unit = "px") {
  if (VECTOR_RUN_TOL_CLASSES.includes(tolClass) && PX_PER[unit]) {
    return Math.max(layerStepTolerance(unit), VECTOR_RUN_TOLERANCE_PX / PX_PER[unit]);
  }
  const t = TOLERANCES[tolClass];
  const conv = t && PX_PER[t.unit] && PX_PER[unit] ? (t.tol * PX_PER[t.unit]) / PX_PER[unit] : 0;
  return Math.max(layerStepTolerance(unit), conv);
}

/** Status rank for the status ratchet: higher is better. N/A and NOT-RUN are "not measured". */
export const STATUS_RANK = Object.freeze({ PASS: 3, INFO: 2, WARN: 2, FAIL: 1 });
export const UNMEASURED = Object.freeze(["NOT-RUN", "N/A"]);

/** WPT outcomes that mean "the engine broke" (robustness), whatever the comparison said before. */
export const WPT_BROKEN = Object.freeze(["error", "timeout"]);
/** WPT flags computed from vellora's own rendering vs Chrome (the deterministic ones depend on the input). */
export const WPT_INK_FLAGS = Object.freeze(["ink-missing-vs-chrome", "ink-displaced-vs-chrome"]);

/** Crashtest outcomes that gate when the baseline was "ok". */
export const CRASH_BAD = Object.freeze(["panic", "crash", "timeout"]);

/** Units a layer vector converts between (CSS px per unit). */
export const PX_PER_UNIT = PX_PER;

/** A value in vector unit `from` expressed in unit `to` (null when not convertible). */
export function convertUnit(v, from, to) {
  if (from === to) return v;
  if (!PX_PER[from] || !PX_PER[to]) return null;
  return (v * PX_PER[from]) / PX_PER[to];
}
