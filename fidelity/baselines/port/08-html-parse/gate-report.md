# Fidelity gate report

**Verdict: PASS** (0 gating item(s)). Local macOS runs are INDICATIVE.

| field | value |
|---|---|
| date | 2026-10-21T19:17:37Z |
| command | `node fidelity/run-all.mjs --gate --baseline fidelity/baselines/port/07-media-print --chrome-from ~/.cache/vellora-fidelity/run-all-beta4-20261021T054809Z/wpt/results.json --tools-image vellora-fidelity-tools:baseline-beta4 --out fidelity/results/run-all/08-html-parse` |
| baseline | fidelity/baselines/port/07-media-print (vellora-fidelity/baseline/2) |
| run | fidelity/results/run-all/08-html-parse (vellora-fidelity/run-all/1) |
| os / cpu | darwin 27.0.0 arm64 (macOS 27.0.1) / Apple M5 Pro |
| node / rustc | v22.23.2 / rustc 1.96.0 (ac68faa20 2026-05-25) |
| chrome | Google Chrome 155.0.8059.85 |
| blitz | 0.3.0-beta.4 registry+https://github.com/rust-lang/crates.io-index |
| git | phaseb/08-html-parse 14dc2b1dd72406b3efff6d922cf4cca5ffe424a2 (0 dirty) |

Counts: improvement 9, changed 1, gating 0, unchanged 15504, withinTolerance 0.

## Absolute failures of the run (gate, cannot be accepted)

none

## Regressions beyond tolerance (gate)

none outside WPT

## Accepted regressions (acceptedRegressions, with evidence)

none

## Reported, not gating (0)

none

## Improvements (9)

| group | key | before | after | tolerance | detail |
|---|---|---|---|---|---|
| corpus INV-X | `oss-postmark-receipt\|INV-X1\|corpus\|\|criterion#1` | FAIL | PASS |  | 5/6 missing [Product Name] (2/3×) -> 6/6 |
| corpus INV-X | `oss-postmark-receipt\|INV-X2\|corpus\|\|criterion#1` | FAIL | PASS |  | pdftotext 5/6; pypdf 5/6; pdfminer 5/6 -> pdftotext 6/6; pypdf 6/6; pdfminer 6/6 |
| corpus INV-X | `oss-postmark-receipt\|INV-X1\|corpus\|\|criterion#1\|found` | 5 | 6 | 0 count | 5 -> 6 |
| corpus INV-X | `oss-postmark-receipt\|INV-X2\|corpus\|\|criterion#1\|found.pdftotext` | 5 | 6 | 0 count | 5 -> 6 |
| corpus INV-X | `oss-postmark-receipt\|INV-X2\|corpus\|\|criterion#1\|found.pypdf` | 5 | 6 | 0 count | 5 -> 6 |
| corpus INV-X | `oss-postmark-receipt\|INV-X2\|corpus\|\|criterion#1\|found.pdfminer` | 5 | 6 | 0 count | 5 -> 6 |
| oracles:text EXT-2 | `oss-postmark-receipt\|EXT-2\|oracles:text\|plain\|criterion#1\|missing.pdftotext` | 39 | 38 | 0 count | 39 -> 38 |
| oracles:text EXT-2 | `oss-postmark-receipt\|EXT-2\|oracles:text\|plain\|criterion#1\|missing.pdfminer.six` | 11 | 2 | 0 count | 11 -> 2 |
| oracles:text EXT-2 | `oss-postmark-receipt\|EXT-2\|oracles:text\|plain\|criterion#1\|missing.pymupdf` | 41 | 40 | 0 count | 41 -> 40 |

## changed (1)

| group | key | before | after | tolerance | detail |
|---|---|---|---|---|---|
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|unpaired` | 136 | 137 |  | 3 word(s) aligned in the baseline are no longer aligned with Chrome's (text or occurrence count changed) |

## WPT per directory (pass / clean pass)

| directory | pass before | pass after | clean before | clean after |
|---|---|---|---|---|
| css/CSS2/abspos | 2 | 2 | 2 | 2 |
| css/CSS2/backgrounds | 175 | 175 | 67 | 67 |
| css/CSS2/borders | 383 | 383 | 354 | 354 |
| css/CSS2/box | 4 | 4 | 0 | 0 |
| css/CSS2/box-display | 65 | 65 | 65 | 65 |
| css/CSS2/colors | 10 | 10 | 10 | 10 |
| css/CSS2/floats | 19 | 19 | 16 | 16 |
| css/CSS2/floats-clear | 38 | 38 | 33 | 33 |
| css/CSS2/fonts | 135 | 135 | 135 | 135 |
| css/CSS2/generated-content | 82 | 82 | 78 | 78 |
| css/CSS2/linebox | 126 | 126 | 124 | 124 |
| css/CSS2/lists | 67 | 67 | 40 | 40 |
| css/CSS2/margin-padding-clear | 525 | 525 | 508 | 508 |
| css/CSS2/normal-flow | 431 | 431 | 405 | 405 |
| css/CSS2/pagination | 33 | 33 | 31 | 31 |
| css/CSS2/positioning | 361 | 361 | 359 | 359 |
| css/CSS2/tables | 77 | 77 | 74 | 74 |
| css/CSS2/text | 247 | 247 | 238 | 238 |
| css/CSS2/visudet | 14 | 14 | 9 | 9 |
| css/CSS2/visufx | 2 | 2 | 2 | 2 |
| css/CSS2/visuren | 6 | 6 | 6 | 6 |
| css/css-break | 115 | 115 | 81 | 81 |
| css/css-page | 70 | 70 | 55 | 55 |
| css/css-tables | 47 | 47 | 38 | 38 |
| css/css-text | 630 | 630 | 377 | 377 |

## Per group

| group | classes |
|---|---|
| corpus INV-X | improvement 6 |
| oracles:text EXT-2 | improvement 3 |
| pdf-probe | changed 1 |

## Tolerances

| class | tolerance | label | rationale |
|---|---|---|---|
| position-mm | 0.1 mm | DESIGN TARGET | word/anchor position error vs a reference (REF-W max/p95, REF-R worst anchor, DANFE-L1, LET-1). 0.1 mm (0.28 pt, 0.38 CSS px) is 10x the 0.01 mm the values are reported with and below one CSS px (0.26 mm), the smallest step a px-snapping layout can move; the measurement is deterministic for one build and one reference (CONFIRMED: equal inputs gave equal values in the Phase A repeat run). |
| geometry-excess-mm | 0.05 mm | DESIGN TARGET | distance OUTSIDE a specification window (BOL-G*, DANFE-B*, DANFE-M1, TXT-A1). Inside the window the spec admits any value, so only the excess is ratcheted; 0.05 mm is about one 600 dpi raster pixel (0.042 mm), the measurement quantum of measure_bars.py / the page ink box. |
| font-excess-pt | 0.05 pt | SPEC-derived tolerance unit | font-size excess outside a window; 0.05 pt is the tolerance ACCEPTANCE.md already applies to every font-size criterion (BOL-T*, DANFE-F*). |
| count | 0 count | DESIGN TARGET | integer counts from deterministic tools (required strings found, extractor missing/extra tokens, segments/glyphs attributed, decoded symbols): any loss is a real change of the document. |
| page-delta | 0 pages | DESIGN TARGET | \|vellora pages - reference pages\|: a page break moving is never noise. |
| pdf-probe-pt | 1 pt | DESIGN TARGET | per-word \|dx\| / \|dy\| of vellora's PDF vs Chrome's PDF (pdftotext -bbox, same-page pairs). 1 pt (0.35 mm) is an order of magnitude below the Phase A regressions it must catch (invoice price column +9 pt, notification signature -14 pt) and above glyph-bbox rounding of pdftotext (0.01 pt) and sub-px snapping differences. |

