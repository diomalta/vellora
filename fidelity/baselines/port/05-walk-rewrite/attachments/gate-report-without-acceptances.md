# Fidelity gate report

**Verdict: FAIL** (18 gating item(s)). Local macOS runs are INDICATIVE.

| field | value |
|---|---|
| date | 2026-10-21T14:22:01Z |
| command | `node fidelity/run-all.mjs --gate --baseline fidelity/baselines/port/04-block-offset --chrome-from ~/.cache/vellora-fidelity/run-all-beta4-20261021T054809Z/wpt/results.json --tools-image vellora-fidelity-tools:baseline-beta4 --out fidelity/results/run-all/05-walk-rewrite` |
| baseline | fidelity/baselines/port/04-block-offset (vellora-fidelity/baseline/2) |
| run | fidelity/results/run-all/05-walk-rewrite (vellora-fidelity/run-all/1) |
| os / cpu | darwin 27.0.0 arm64 (macOS 27.0.1) / Apple M5 Pro |
| node / rustc | v22.23.2 / rustc 1.96.0 (ac68faa20 2026-05-25) |
| chrome | Google Chrome 155.0.8059.85 |
| blitz | 0.3.0-beta.4 registry+https://github.com/rust-lang/crates.io-index |
| git | phaseb/05-walk-rewrite e9dc7e4a53c75e3ed9a189c7119f60fef67f27ca (0 dirty) |

Counts: regression 18, improvement 444, reported 26, changed 10, gating 18, unchanged 15008, withinTolerance 0.

## Absolute failures of the run (gate, cannot be accepted)

none

## Regressions beyond tolerance (gate)

| group | key | before | after | tolerance | detail |
|---|---|---|---|---|---|
| corpus INV-X | `oss-postmark-receipt\|INV-X1\|corpus\|\|criterion#1` | PASS | FAIL |  | 6/6 -> 5/6 missing [Product Name] (2/3×) |
| corpus INV-X | `oss-postmark-receipt\|INV-X2\|corpus\|\|criterion#1` | PASS | FAIL |  | pdftotext 6/6; pypdf 6/6; pdfminer 6/6 -> pdftotext 5/6; pypdf 5/6; pdfminer 5/6 |
| corpus INV-X | `oss-postmark-receipt\|INV-X1\|corpus\|\|criterion#1\|found` | 6 | 5 | 0 count | 6 -> 5 (tolerance 0 count) |
| corpus INV-X | `oss-postmark-receipt\|INV-X2\|corpus\|\|criterion#1\|found.pdftotext` | 6 | 5 | 0 count | 6 -> 5 (tolerance 0 count) |
| corpus INV-X | `oss-postmark-receipt\|INV-X2\|corpus\|\|criterion#1\|found.pypdf` | 6 | 5 | 0 count | 6 -> 5 (tolerance 0 count) |
| corpus INV-X | `oss-postmark-receipt\|INV-X2\|corpus\|\|criterion#1\|found.pdfminer` | 6 | 5 | 0 count | 6 -> 5 (tolerance 0 count) |
| oracles:text EXT-2 | `oss-postmark-receipt\|EXT-2\|oracles:text\|plain\|criterion#1\|missing.pdftotext` | 38 | 39 | 0 count | 38 -> 39 (tolerance 0 count) |
| oracles:text EXT-2 | `oss-postmark-receipt\|EXT-2\|oracles:text\|plain\|criterion#1\|missing.pdfminer.six` | 2 | 11 | 0 count | 2 -> 11 (tolerance 0 count) |
| oracles:text EXT-2 | `oss-postmark-receipt\|EXT-2\|oracles:text\|plain\|criterion#1\|missing.pymupdf` | 40 | 41 | 0 count | 40 -> 41 (tolerance 0 count) |

### WPT / crashtest regressions (9)

| group | key | before | after | tolerance | detail |
|---|---|---|---|---|---|
| wpt css/CSS2/floats-clear | `wpt\|css/CSS2/floats-clear/floats-132.xht` | pass | fail |  | pass -> fail (clean pass lost) |
| wpt css/CSS2/floats-clear | `wpt\|css/CSS2/floats-clear/floats-153.xht` | pass | fail |  | pass -> fail (clean pass lost) |
| wpt css/CSS2/floats | `wpt\|css/CSS2/floats/floats-placement-vertical-003.xht` | pass | fail |  | pass -> fail (clean pass lost) |
| wpt css/CSS2/floats | `wpt\|css/CSS2/floats/floats-placement-vertical-004.xht` | pass | fail |  | pass -> fail (clean pass lost) |
| wpt css/CSS2/linebox | `wpt\|css/CSS2/linebox/baseline-block-with-overflow-001.html` | pass | fail |  | pass -> fail (clean pass lost) |
| wpt css/css-break | `wpt\|css/css-break/flexbox/flex-fragmented-with-float-descendant-001.html` | pass | fail |  | pass -> fail (clean pass lost) |
| wpt css/css-page | `wpt\|css/css-page/monolithic-overflow-014-print.html` | pass | fail |  | pass -> fail (clean pass lost) |
| wpt css/css-text | `wpt\|css/css-text/text-indent/below-float.html` | pass | fail |  | pass -> fail (clean pass lost) |
| wpt css/css-text | `wpt\|css/css-text/text-indent/below-float2.html` | pass | fail |  | pass -> fail (clean pass lost) |

## Accepted regressions (acceptedRegressions, with evidence)

none

## Reported, not gating (26)

| group | key | before | after | tolerance | detail |
|---|---|---|---|---|---|
| wpt css/CSS2/backgrounds | `wpt\|css/CSS2/backgrounds/background-position-002.xht` | pass | fail |  | pass[css-url-resource,ink-displaced-vs-chrome] -> fail (flagged pass: reported, not gated) |
| wpt css/CSS2/box-display | `wpt\|css/CSS2/box-display/containing-block-023.xht` | pass | fail |  | pass[ink-missing-vs-chrome] -> fail (flagged pass: reported, not gated) |
| wpt css/CSS2/positioning | `wpt\|css/CSS2/positioning/bottom-applies-to-001.xht` | pass | fail |  | pass[ink-missing-vs-chrome] -> fail (flagged pass: reported, not gated) |
| wpt css/CSS2/positioning | `wpt\|css/CSS2/positioning/bottom-applies-to-002.xht` | pass | fail |  | pass[ink-missing-vs-chrome] -> fail (flagged pass: reported, not gated) |
| wpt css/CSS2/positioning | `wpt\|css/CSS2/positioning/bottom-applies-to-003.xht` | pass | fail |  | pass[ink-missing-vs-chrome] -> fail (flagged pass: reported, not gated) |
| wpt css/CSS2/positioning | `wpt\|css/CSS2/positioning/bottom-applies-to-004.xht` | pass | fail |  | pass[ink-missing-vs-chrome] -> fail (flagged pass: reported, not gated) |
| wpt css/CSS2/positioning | `wpt\|css/CSS2/positioning/bottom-applies-to-005.xht` | pass | fail |  | pass[ink-missing-vs-chrome] -> fail (flagged pass: reported, not gated) |
| wpt css/CSS2/positioning | `wpt\|css/CSS2/positioning/bottom-applies-to-006.xht` | pass | fail |  | pass[ink-missing-vs-chrome] -> fail (flagged pass: reported, not gated) |
| wpt css/CSS2/positioning | `wpt\|css/CSS2/positioning/bottom-applies-to-007.xht` | pass | fail |  | pass[ink-missing-vs-chrome] -> fail (flagged pass: reported, not gated) |
| wpt css/CSS2/positioning | `wpt\|css/CSS2/positioning/bottom-applies-to-009.xht` | pass | fail |  | pass[ink-missing-vs-chrome] -> fail (flagged pass: reported, not gated) |
| wpt css/CSS2/positioning | `wpt\|css/CSS2/positioning/bottom-applies-to-012.xht` | pass | fail |  | pass[ink-missing-vs-chrome] -> fail (flagged pass: reported, not gated) |
| wpt css/CSS2/positioning | `wpt\|css/CSS2/positioning/bottom-applies-to-013.xht` | pass | fail |  | pass[ink-missing-vs-chrome] -> fail (flagged pass: reported, not gated) |
| wpt css/CSS2/positioning | `wpt\|css/CSS2/positioning/bottom-applies-to-014.xht` | pass | fail |  | pass[ink-missing-vs-chrome] -> fail (flagged pass: reported, not gated) |
| wpt css/CSS2/positioning | `wpt\|css/CSS2/positioning/bottom-applies-to-015.xht` | pass | fail |  | pass[ink-missing-vs-chrome] -> fail (flagged pass: reported, not gated) |
| wpt css/CSS2/positioning | `wpt\|css/CSS2/positioning/position-applies-to-001.xht` | pass | fail |  | pass[ink-missing-vs-chrome] -> fail (flagged pass: reported, not gated) |
| wpt css/CSS2/positioning | `wpt\|css/CSS2/positioning/position-applies-to-002.xht` | pass | fail |  | pass[ink-missing-vs-chrome] -> fail (flagged pass: reported, not gated) |
| wpt css/CSS2/positioning | `wpt\|css/CSS2/positioning/position-applies-to-003.xht` | pass | fail |  | pass[ink-missing-vs-chrome] -> fail (flagged pass: reported, not gated) |
| wpt css/CSS2/positioning | `wpt\|css/CSS2/positioning/position-applies-to-004.xht` | pass | fail |  | pass[ink-missing-vs-chrome] -> fail (flagged pass: reported, not gated) |
| wpt css/CSS2/positioning | `wpt\|css/CSS2/positioning/position-applies-to-005.xht` | pass | fail |  | pass[ink-missing-vs-chrome] -> fail (flagged pass: reported, not gated) |
| wpt css/CSS2/positioning | `wpt\|css/CSS2/positioning/position-applies-to-006.xht` | pass | fail |  | pass[ink-missing-vs-chrome] -> fail (flagged pass: reported, not gated) |
| wpt css/CSS2/positioning | `wpt\|css/CSS2/positioning/position-applies-to-007.xht` | pass | fail |  | pass[ink-missing-vs-chrome] -> fail (flagged pass: reported, not gated) |
| wpt css/CSS2/positioning | `wpt\|css/CSS2/positioning/position-applies-to-009.xht` | pass | fail |  | pass[ink-missing-vs-chrome] -> fail (flagged pass: reported, not gated) |
| wpt css/CSS2/positioning | `wpt\|css/CSS2/positioning/position-applies-to-012.xht` | pass | fail |  | pass[ink-missing-vs-chrome] -> fail (flagged pass: reported, not gated) |
| wpt css/CSS2/positioning | `wpt\|css/CSS2/positioning/position-applies-to-013.xht` | pass | fail |  | pass[ink-missing-vs-chrome] -> fail (flagged pass: reported, not gated) |
| wpt css/CSS2/positioning | `wpt\|css/CSS2/positioning/position-applies-to-014.xht` | pass | fail |  | pass[ink-missing-vs-chrome] -> fail (flagged pass: reported, not gated) |
| wpt css/CSS2/positioning | `wpt\|css/CSS2/positioning/position-applies-to-015.xht` | pass | fail |  | pass[ink-missing-vs-chrome] -> fail (flagged pass: reported, not gated) |

## Improvements (444)

| group | key | before | after | tolerance | detail |
|---|---|---|---|---|---|
| oracles:layout REF-W | `receipt\|REF-W\|oracles:layout\|plain\|criterion#1\|maxMm` | 101.22 | 1.37 | 0.1 position-mm | 101.22 -> 1.37 |
| oracles:layout REF-W | `receipt\|REF-W\|oracles:layout\|plain\|criterion#1\|p95Mm` | 2.55 | 0.7 | 0.1 position-mm | 2.55 -> 0.7 |
| pdf-probe | `pdf-probe\|receipt\|Volte#1\|dx` | -11.52 | -0.08 | 1 pdf-probe-pt | "Volte" \|dx\| 11.52 -> 0.08 pt |
| pdf-probe | `pdf-probe\|receipt\|Volte#1\|dy` | 5.89 | 2.13 | 1 pdf-probe-pt | "Volte" \|dy\| 5.89 -> 2.13 pt |
| pdf-probe | `pdf-probe\|receipt\|sempre#1\|dx` | -9 | -0.08 | 1 pdf-probe-pt | "sempre" \|dx\| 9 -> 0.08 pt |
| pdf-probe | `pdf-probe\|receipt\|sempre#1\|dy` | 5.89 | 2.13 | 1 pdf-probe-pt | "sempre" \|dy\| 5.89 -> 2.13 pt |
| pdf-probe | `pdf-probe\|receipt\|—#2\|dx` | -5.36 | -0.09 | 1 pdf-probe-pt | "—" \|dx\| 5.36 -> 0.09 pt |
| pdf-probe | `pdf-probe\|receipt\|—#2\|dy` | 5.89 | 2.13 | 1 pdf-probe-pt | "—" \|dy\| 5.89 -> 2.13 pt |
| pdf-probe | `pdf-probe\|receipt\|seu#1\|dx` | -4.08 | -0.09 | 1 pdf-probe-pt | "seu" \|dx\| 4.08 -> 0.09 pt |
| pdf-probe | `pdf-probe\|receipt\|seu#1\|dy` | 5.89 | 2.13 | 1 pdf-probe-pt | "seu" \|dy\| 5.89 -> 2.13 pt |
| pdf-probe | `pdf-probe\|receipt\|próximo#1\|dx` | -2.17 | -0.09 | 1 pdf-probe-pt | "próximo" \|dx\| 2.17 -> 0.09 pt |
| pdf-probe | `pdf-probe\|receipt\|próximo#1\|dy` | 5.89 | 2.13 | 1 pdf-probe-pt | "próximo" \|dy\| 5.89 -> 2.13 pt |
| pdf-probe | `pdf-probe\|receipt\|café#1\|dx` | 1.68 | -0.1 | 1 pdf-probe-pt | "café" \|dx\| 1.68 -> 0.1 pt |
| pdf-probe | `pdf-probe\|receipt\|café#1\|dy` | 5.89 | 2.13 | 1 pdf-probe-pt | "café" \|dy\| 5.89 -> 2.13 pt |
| pdf-probe | `pdf-probe\|receipt\|especial#1\|dx` | 3.87 | -0.1 | 1 pdf-probe-pt | "especial" \|dx\| 3.87 -> 0.1 pt |
| pdf-probe | `pdf-probe\|receipt\|especial#1\|dy` | 5.89 | 2.13 | 1 pdf-probe-pt | "especial" \|dy\| 5.89 -> 2.13 pt |
| pdf-probe | `pdf-probe\|receipt\|já#1\|dx` | 7.84 | -0.11 | 1 pdf-probe-pt | "já" \|dx\| 7.84 -> 0.11 pt |
| pdf-probe | `pdf-probe\|receipt\|já#1\|dy` | 5.89 | 2.13 | 1 pdf-probe-pt | "já" \|dy\| 5.89 -> 2.13 pt |
| pdf-probe | `pdf-probe\|receipt\|está#1\|dx` | 8.9 | -0.11 | 1 pdf-probe-pt | "está" \|dx\| 8.9 -> 0.11 pt |
| pdf-probe | `pdf-probe\|receipt\|está#1\|dy` | 5.89 | 2.13 | 1 pdf-probe-pt | "está" \|dy\| 5.89 -> 2.13 pt |
| pdf-probe | `pdf-probe\|receipt\|esperando#1\|dx` | 11.08 | -0.11 | 1 pdf-probe-pt | "esperando" \|dx\| 11.08 -> 0.11 pt |
| pdf-probe | `pdf-probe\|receipt\|esperando#1\|dy` | 5.89 | 2.13 | 1 pdf-probe-pt | "esperando" \|dy\| 5.89 -> 2.13 pt |
| pdf-probe | `pdf-probe\|receipt\|por#1\|dx` | -286.04 | -0.12 | 1 pdf-probe-pt | "por" \|dx\| 286.04 -> 0.12 pt |
| pdf-probe | `pdf-probe\|receipt\|por#1\|dy` | 21.64 | 2.13 | 1 pdf-probe-pt | "por" \|dy\| 21.64 -> 2.13 pt |
| pdf-probe | `pdf-probe\|receipt\|você.#1\|dx` | -125.09 | -0.1 | 1 pdf-probe-pt | "você." \|dx\| 125.09 -> 0.1 pt |
| pdf-probe | `pdf-probe\|receipt\|você.#1\|dy` | 7.39 | 2.13 | 1 pdf-probe-pt | "você." \|dy\| 7.39 -> 2.13 pt |
| pdf-probe | `pdf-probe\|receipt\|Este#1\|dy` | 8.51 | 1.76 | 1 pdf-probe-pt | "Este" \|dy\| 8.51 -> 1.76 pt |
| pdf-probe | `pdf-probe\|receipt\|recibo#1\|dy` | 8.51 | 1.76 | 1 pdf-probe-pt | "recibo" \|dy\| 8.51 -> 1.76 pt |
| pdf-probe | `pdf-probe\|receipt\|é#1\|dy` | 8.51 | 1.76 | 1 pdf-probe-pt | "é" \|dy\| 8.51 -> 1.76 pt |
| pdf-probe | `pdf-probe\|receipt\|um#1\|dy` | 8.51 | 1.76 | 1 pdf-probe-pt | "um" \|dy\| 8.51 -> 1.76 pt |
| pdf-probe | `pdf-probe\|receipt\|comprovante#1\|dy` | 8.51 | 1.76 | 1 pdf-probe-pt | "comprovante" \|dy\| 8.51 -> 1.76 pt |
| pdf-probe | `pdf-probe\|receipt\|simplificado#1\|dy` | 8.51 | 1.76 | 1 pdf-probe-pt | "simplificado" \|dy\| 8.51 -> 1.76 pt |
| pdf-probe | `pdf-probe\|receipt\|e#2\|dy` | 8.51 | 1.76 | 1 pdf-probe-pt | "e" \|dy\| 8.51 -> 1.76 pt |
| pdf-probe | `pdf-probe\|receipt\|não#1\|dy` | 8.51 | 1.76 | 1 pdf-probe-pt | "não" \|dy\| 8.51 -> 1.76 pt |
| pdf-probe | `pdf-probe\|receipt\|substitui#1\|dy` | 8.51 | 1.76 | 1 pdf-probe-pt | "substitui" \|dy\| 8.51 -> 1.76 pt |
| pdf-probe | `pdf-probe\|receipt\|documento#1\|dy` | 8.51 | 1.76 | 1 pdf-probe-pt | "documento" \|dy\| 8.51 -> 1.76 pt |
| pdf-probe | `pdf-probe\|receipt\|fiscal.#1\|dy` | 8.51 | 1.76 | 1 pdf-probe-pt | "fiscal." \|dy\| 8.51 -> 1.76 pt |
| pdf-probe | `pdf-probe\|receipt\|Cafeteria#2\|dy` | 8.51 | 1.76 | 1 pdf-probe-pt | "Cafeteria" \|dy\| 8.51 -> 1.76 pt |
| pdf-probe | `pdf-probe\|receipt\|Aurora#3\|dy` | 8.51 | 1.76 | 1 pdf-probe-pt | "Aurora" \|dy\| 8.51 -> 1.76 pt |
| pdf-probe | `pdf-probe\|receipt\|Ltda#2\|dy` | 8.51 | 1.76 | 1 pdf-probe-pt | "Ltda" \|dy\| 8.51 -> 1.76 pt |
| pdf-probe | `pdf-probe\|receipt\|·#1\|dy` | 8.51 | 1.76 | 1 pdf-probe-pt | "·" \|dy\| 8.51 -> 1.76 pt |
| pdf-probe | `pdf-probe\|receipt\|www.cafeteria-aurora.example#1\|dy` | 8.51 | 1.76 | 1 pdf-probe-pt | "www.cafeteria-aurora.example" \|dy\| 8.51 -> 1.76 pt |

WPT/crashtest improvements: 402 (listed in gate-report.json).

## changed (10)

| group | key | before | after | tolerance | detail |
|---|---|---|---|---|---|
| wpt css/CSS2/normal-flow | `wpt\|css/CSS2/normal-flow/inline-table-width-001a.xht` | pass-blank | fail |  | pass-blank -> fail |
| wpt css/CSS2/normal-flow | `wpt\|css/CSS2/normal-flow/inline-table-width-001b.xht` | pass-blank | fail |  | pass-blank -> fail |
| wpt css/CSS2/normal-flow | `wpt\|css/CSS2/normal-flow/inline-table-width-002a.xht` | pass-blank | fail |  | pass-blank -> fail |
| wpt css/CSS2/text | `wpt\|css/CSS2/text/text-transform-cap-002.xht` | pass-blank | fail |  | pass-blank -> fail |
| wpt css/css-page | `wpt\|css/css-page/page-box-011-print.html` | pass-blank | fail |  | pass-blank -> fail |
| wpt css/css-text | `wpt\|css/css-text/boundary-shaping/boundary-shaping-001.html` | pass-blank | fail |  | pass-blank -> fail |
| wpt css/css-text | `wpt\|css/css-text/boundary-shaping/boundary-shaping-003.html` | pass-blank | fail |  | pass-blank -> fail |
| wpt css/css-text | `wpt\|css/css-text/boundary-shaping/boundary-shaping-004.html` | pass-blank | fail |  | pass-blank -> fail |
| wpt css/css-text | `wpt\|css/css-text/boundary-shaping/boundary-shaping-005.html` | pass-blank | fail |  | pass-blank -> fail |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|unpaired` | 137 | 136 |  | 4 word(s) aligned in the baseline are no longer aligned with Chrome's (text or occurrence count changed) |

## WPT per directory (pass / clean pass)

| directory | pass before | pass after | clean before | clean after |
|---|---|---|---|---|
| css/CSS2/abspos | 0 | 2 | 0 | 2 |
| css/CSS2/backgrounds | 176 | 175 | 67 | 67 |
| css/CSS2/borders | 383 | 383 | 354 | 354 |
| css/CSS2/box | 4 | 4 | 0 | 0 |
| css/CSS2/box-display | 53 | 65 | 52 | 65 |
| css/CSS2/colors | 9 | 10 | 9 | 10 |
| css/CSS2/floats | 19 | 19 | 17 | 16 |
| css/CSS2/floats-clear | 39 | 38 | 34 | 33 |
| css/CSS2/fonts | 127 | 135 | 127 | 135 |
| css/CSS2/generated-content | 43 | 82 | 38 | 78 |
| css/CSS2/linebox | 125 | 126 | 123 | 124 |
| css/CSS2/lists | 67 | 67 | 40 | 40 |
| css/CSS2/margin-padding-clear | 517 | 525 | 502 | 508 |
| css/CSS2/normal-flow | 415 | 431 | 391 | 405 |
| css/CSS2/pagination | 33 | 33 | 31 | 31 |
| css/CSS2/positioning | 315 | 361 | 289 | 359 |
| css/CSS2/tables | 53 | 77 | 50 | 74 |
| css/CSS2/text | 237 | 247 | 229 | 238 |
| css/CSS2/visudet | 14 | 14 | 8 | 9 |
| css/CSS2/visufx | 1 | 2 | 1 | 2 |
| css/CSS2/visuren | 3 | 6 | 3 | 6 |
| css/css-break | 104 | 115 | 75 | 81 |
| css/css-page | 64 | 71 | 49 | 55 |
| css/css-tables | 38 | 47 | 29 | 38 |
| css/css-text | 464 | 630 | 214 | 377 |

## Per group

| group | classes |
|---|---|
| corpus INV-X | regression 6 |
| oracles:layout REF-W | improvement 2 |
| oracles:text EXT-2 | regression 3 |
| pdf-probe | changed 1, improvement 40 |
| wpt css/CSS2/abspos | improvement 2 |
| wpt css/CSS2/backgrounds | reported 1 |
| wpt css/CSS2/box-display | improvement 13, reported 1 |
| wpt css/CSS2/colors | improvement 1 |
| wpt css/CSS2/floats | improvement 2, regression 2 |
| wpt css/CSS2/floats-clear | improvement 1, regression 2 |
| wpt css/CSS2/fonts | improvement 8 |
| wpt css/CSS2/generated-content | improvement 41 |
| wpt css/CSS2/linebox | improvement 2, regression 1 |
| wpt css/CSS2/margin-padding-clear | improvement 8 |
| wpt css/CSS2/normal-flow | improvement 16, changed 3 |
| wpt css/CSS2/positioning | improvement 70, reported 24 |
| wpt css/CSS2/tables | improvement 24 |
| wpt css/CSS2/text | improvement 10, changed 1 |
| wpt css/CSS2/visudet | improvement 1 |
| wpt css/CSS2/visufx | improvement 1 |
| wpt css/CSS2/visuren | improvement 3 |
| wpt css/css-break | improvement 12, regression 1 |
| wpt css/css-page | improvement 9, regression 1, changed 1 |
| wpt css/css-tables | improvement 9 |
| wpt css/css-text | changed 4, improvement 169, regression 2 |

## Tolerances

| class | tolerance | label | rationale |
|---|---|---|---|
| position-mm | 0.1 mm | DESIGN TARGET | word/anchor position error vs a reference (REF-W max/p95, REF-R worst anchor, DANFE-L1, LET-1). 0.1 mm (0.28 pt, 0.38 CSS px) is 10x the 0.01 mm the values are reported with and below one CSS px (0.26 mm), the smallest step a px-snapping layout can move; the measurement is deterministic for one build and one reference (CONFIRMED: equal inputs gave equal values in the Phase A repeat run). |
| geometry-excess-mm | 0.05 mm | DESIGN TARGET | distance OUTSIDE a specification window (BOL-G*, DANFE-B*, DANFE-M1, TXT-A1). Inside the window the spec admits any value, so only the excess is ratcheted; 0.05 mm is about one 600 dpi raster pixel (0.042 mm), the measurement quantum of measure_bars.py / the page ink box. |
| font-excess-pt | 0.05 pt | SPEC-derived tolerance unit | font-size excess outside a window; 0.05 pt is the tolerance ACCEPTANCE.md already applies to every font-size criterion (BOL-T*, DANFE-F*). |
| count | 0 count | DESIGN TARGET | integer counts from deterministic tools (required strings found, extractor missing/extra tokens, segments/glyphs attributed, decoded symbols): any loss is a real change of the document. |
| page-delta | 0 pages | DESIGN TARGET | \|vellora pages - reference pages\|: a page break moving is never noise. |
| pdf-probe-pt | 1 pt | DESIGN TARGET | per-word \|dx\| / \|dy\| of vellora's PDF vs Chrome's PDF (pdftotext -bbox, same-page pairs). 1 pt (0.35 mm) is an order of magnitude below the Phase A regressions it must catch (invoice price column +9 pt, notification signature -14 pt) and above glyph-bbox rounding of pdftotext (0.01 pt) and sub-px snapping differences. |

