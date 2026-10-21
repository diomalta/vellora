# Fidelity gate report

**Verdict: PASS** (0 gating item(s)). Local macOS runs are INDICATIVE.

| field | value |
|---|---|
| date | 2026-10-21T07:49:02Z |
| command | `node fidelity/run-all.mjs --gate --baseline fidelity/baselines/beta4-gated --chrome-from ~/.cache/vellora-fidelity/run-all-beta4-20261021T054809Z/wpt/results.json --tools-image vellora-fidelity-tools:baseline-beta4 --out fidelity/results/run-all/s1c-00-start` |
| baseline | fidelity/baselines/beta4-gated (vellora-fidelity/baseline/2) |
| run | fidelity/results/run-all/s1c-00-start (vellora-fidelity/run-all/1) |
| os / cpu | darwin 27.0.0 arm64 (macOS 27.0.1) / Apple M5 Pro |
| node / rustc | v22.23.2 / rustc 1.96.0 (ac68faa20 2026-05-25) |
| chrome | Google Chrome 155.0.8059.85 |
| blitz | 0.3.0-beta.4 registry+https://github.com/rust-lang/crates.io-index |
| git | phaseb/stage1 509980803243bb19701777c8503a70c27f38cc5e (0 dirty) |

Counts: improvement 13, gating 0, unchanged 15466, withinTolerance 0.

## Absolute failures of the run (gate, cannot be accepted)

none

## Regressions beyond tolerance (gate)

none outside WPT

## Accepted regressions (acceptedRegressions, with evidence)

none

## Reported, not gating (0)

none

## Improvements (13)

none outside WPT

WPT/crashtest improvements: 13 (listed in gate-report.json).

## WPT per directory (pass / clean pass)

| directory | pass before | pass after | clean before | clean after |
|---|---|---|---|---|
| css/CSS2/backgrounds | 152 | 152 | 67 | 67 |
| css/CSS2/borders | 332 | 332 | 302 | 302 |
| css/CSS2/box | 4 | 4 | 0 | 0 |
| css/CSS2/box-display | 47 | 47 | 47 | 47 |
| css/CSS2/colors | 6 | 6 | 6 | 6 |
| css/CSS2/floats | 20 | 20 | 18 | 18 |
| css/CSS2/floats-clear | 25 | 25 | 22 | 22 |
| css/CSS2/fonts | 120 | 120 | 120 | 120 |
| css/CSS2/generated-content | 41 | 41 | 38 | 38 |
| css/CSS2/linebox | 45 | 45 | 33 | 33 |
| css/CSS2/lists | 67 | 67 | 40 | 40 |
| css/CSS2/margin-padding-clear | 409 | 409 | 396 | 396 |
| css/CSS2/normal-flow | 392 | 392 | 368 | 368 |
| css/CSS2/pagination | 19 | 19 | 17 | 17 |
| css/CSS2/positioning | 175 | 175 | 173 | 173 |
| css/CSS2/tables | 19 | 19 | 17 | 17 |
| css/CSS2/text | 223 | 223 | 215 | 215 |
| css/CSS2/visudet | 10 | 10 | 7 | 7 |
| css/CSS2/visufx | 1 | 1 | 1 | 1 |
| css/CSS2/visuren | 1 | 1 | 1 | 1 |
| css/css-break | 101 | 101 | 73 | 73 |
| css/css-page | 63 | 63 | 47 | 47 |
| css/css-tables | 36 | 36 | 27 | 27 |
| css/css-text | 421 | 434 | 178 | 182 |

## Per group

| group | classes |
|---|---|
| wpt css/css-text | improvement 13 |

## Tolerances

| class | tolerance | label | rationale |
|---|---|---|---|
| position-mm | 0.1 mm | DESIGN TARGET | word/anchor position error vs a reference (REF-W max/p95, REF-R worst anchor, DANFE-L1, LET-1). 0.1 mm (0.28 pt, 0.38 CSS px) is 10x the 0.01 mm the values are reported with and below one CSS px (0.26 mm), the smallest step a px-snapping layout can move; the measurement is deterministic for one build and one reference (CONFIRMED: equal inputs gave equal values in the Phase A repeat run). |
| geometry-excess-mm | 0.05 mm | DESIGN TARGET | distance OUTSIDE a specification window (BOL-G*, DANFE-B*, DANFE-M1, TXT-A1). Inside the window the spec admits any value, so only the excess is ratcheted; 0.05 mm is about one 600 dpi raster pixel (0.042 mm), the measurement quantum of measure_bars.py / the page ink box. |
| font-excess-pt | 0.05 pt | SPEC-derived tolerance unit | font-size excess outside a window; 0.05 pt is the tolerance ACCEPTANCE.md already applies to every font-size criterion (BOL-T*, DANFE-F*). |
| count | 0 count | DESIGN TARGET | integer counts from deterministic tools (required strings found, extractor missing/extra tokens, segments/glyphs attributed, decoded symbols): any loss is a real change of the document. |
| page-delta | 0 pages | DESIGN TARGET | \|vellora pages - reference pages\|: a page break moving is never noise. |
| pdf-probe-pt | 1 pt | DESIGN TARGET | per-word \|dx\| / \|dy\| of vellora's PDF vs Chrome's PDF (pdftotext -bbox, same-page pairs). 1 pt (0.35 mm) is an order of magnitude below the Phase A regressions it must catch (invoice price column +9 pt, notification signature -14 pt) and above glyph-bbox rounding of pdftotext (0.01 pt) and sub-px snapping differences. |

