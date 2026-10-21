// Per-metric tolerances of the value ratchet (fidelity/ACCEPTANCE.md "Gate: value ratchet").
// A metric REGRESSES when it moves in its bad direction by MORE than its tolerance versus the
// baseline. Every entry carries its rationale and an evidence label (DESIGN TARGET unless the
// number comes from a specification). Kept in one table so ACCEPTANCE.md, the gate report and the
// self-tests cite the same numbers.

/** 1 CSS px in mm (1/96 in). */
export const CSS_PX_MM = 25.4 / 96;

export const TOLERANCES = Object.freeze({
  "position-mm": {
    tol: 0.1,
    unit: "mm",
    label: "DESIGN TARGET",
    why: "word/anchor position error vs a reference (REF-W max/p95, REF-R worst anchor, DANFE-L1, LET-1). 0.1 mm (0.28 pt, 0.38 CSS px) is 10x the 0.01 mm the values are reported with and below one CSS px (0.26 mm), the smallest step a px-snapping layout can move; the measurement is deterministic for one build and one reference (CONFIRMED: equal inputs gave equal values in the Phase A repeat run).",
  },
  "geometry-excess-mm": {
    tol: 0.05,
    unit: "mm",
    label: "DESIGN TARGET",
    why: "distance OUTSIDE a specification window (BOL-G*, DANFE-B*, DANFE-M1, TXT-A1). Inside the window the spec admits any value, so only the excess is ratcheted; 0.05 mm is about one 600 dpi raster pixel (0.042 mm), the measurement quantum of measure_bars.py / the page ink box.",
  },
  "font-excess-pt": {
    tol: 0.05,
    unit: "pt",
    label: "SPEC-derived tolerance unit",
    why: "font-size excess outside a window; 0.05 pt is the tolerance ACCEPTANCE.md already applies to every font-size criterion (BOL-T*, DANFE-F*).",
  },
  count: {
    tol: 0,
    unit: "count",
    label: "DESIGN TARGET",
    why: "integer counts from deterministic tools (required strings found, extractor missing/extra tokens, segments/glyphs attributed, decoded symbols): any loss is a real change of the document.",
  },
  "page-delta": {
    tol: 0,
    unit: "pages",
    label: "DESIGN TARGET",
    why: "|vellora pages - reference pages|: a page break moving is never noise.",
  },
  "pdf-probe-pt": {
    tol: 1.0,
    unit: "pt",
    label: "DESIGN TARGET",
    why: "per-word |dx| / |dy| of vellora's PDF vs Chrome's PDF (pdf-probe semantics 2: PyMuPDF pen origin and baseline, same-page position pairs keyed by the Chrome word). 1 pt (0.35 mm) is an order of magnitude below the Phase A regressions it must catch (invoice price column +9 pt, notification signature -14 pt) and above the 0.01 pt rounding of the probe and sub-px snapping differences. The per-fixture unpaired-word counts use the count class.",
  },
});

/** Status rank for the status ratchet: higher is better. N/A and NOT-RUN are "not measured". */
export const STATUS_RANK = Object.freeze({ PASS: 3, INFO: 2, WARN: 2, FAIL: 1 });
export const UNMEASURED = Object.freeze(["NOT-RUN", "N/A"]);

/** WPT outcomes that mean "the engine broke" (robustness), whatever the comparison said before. */
export const WPT_BROKEN = Object.freeze(["error", "timeout"]);
/** WPT flags computed from vellora's own rendering vs Chrome (the deterministic ones depend on the input). */
export const WPT_INK_FLAGS = Object.freeze(["ink-missing-vs-chrome", "ink-displaced-vs-chrome"]);

/** Crashtest outcomes that gate when the baseline was "ok". */
export const CRASH_BAD = Object.freeze(["panic", "crash", "timeout"]);
