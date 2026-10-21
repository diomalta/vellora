# Fidelity gate report

**Verdict: FAIL** (8 gating item(s)). Local macOS runs are INDICATIVE.

| field | value |
|---|---|
| date | 2026-10-21T14:35:06Z |
| command | `node fidelity/run-all.mjs --gate --baseline fidelity/baselines/port/04-block-offset --chrome-from ~/.cache/vellora-fidelity/run-all-beta4-20261021T054809Z/wpt/results.json --tools-image vellora-fidelity-tools:baseline-beta4 --out fidelity/results/run-all/05-ablation-walk-only` |
| baseline | fidelity/baselines/port/04-block-offset (vellora-fidelity/baseline/2) |
| run | fidelity/results/run-all/05-ablation-walk-only (vellora-fidelity/run-all/1) |
| os / cpu | darwin 27.0.0 arm64 (macOS 27.0.1) / Apple M5 Pro |
| node / rustc | v22.23.2 / rustc 1.96.0 (ac68faa20 2026-05-25) |
| chrome | Google Chrome 155.0.8059.85 |
| blitz | 0.3.0-beta.4 registry+https://github.com/rust-lang/crates.io-index |
| git | phaseb/05-walk-rewrite e9dc7e4a53c75e3ed9a189c7119f60fef67f27ca (5 dirty) |

Counts: improvement 377, reported 26, regression 1, changed 6, failure 7, gating 8, unchanged 15103, withinTolerance 0.

## Absolute failures of the run (gate, cannot be accepted)

| group | key | before | after | tolerance | detail |
|---|---|---|---|---|---|
| code-checks | `code\|cargo-test` | - | fail |  | cargo test --workspace --no-fail-fast: exit 101; failing: keys_follow_the_source_dom_and_anonymous_blocks_are_walked, text_after_a_block_span_stays_in_its_paragraph, walk_reads_anonymous_block_runs_where_blitz_places_them, a_body_that_is_an_inline_root_reaches_the_page, text_after_a_block_span_inside_a_paragraph_keeps_the_paragraphs_styles, text_next_to_a_block_child_is_read_from_the_anonymous_blocks |
| layout-diff checks | `layout-diff\|invoice\|source_dom_keys_vs_chromium` | - | fail |  | layout-diff check failed and is not in fidelity/layout-diff/expected-check-failures.json |
| layout-diff checks | `layout-diff\|invoice\|dom_key_alignment` | - | fail |  | layout-diff check failed and is not in fidelity/layout-diff/expected-check-failures.json |
| layout-diff checks | `layout-diff\|receipt\|source_dom_keys_vs_chromium` | - | fail |  | layout-diff check failed and is not in fidelity/layout-diff/expected-check-failures.json |
| layout-diff checks | `layout-diff\|receipt\|dom_key_alignment` | - | fail |  | layout-diff check failed and is not in fidelity/layout-diff/expected-check-failures.json |
| layout-diff checks | `layout-diff\|boleto\|source_dom_keys_vs_chromium` | - | fail |  | layout-diff check failed and is not in fidelity/layout-diff/expected-check-failures.json |
| layout-diff checks | `layout-diff\|boleto\|dom_key_alignment` | - | fail |  | layout-diff check failed and is not in fidelity/layout-diff/expected-check-failures.json |

## Regressions beyond tolerance (gate)

none outside WPT

### WPT / crashtest regressions (1)

| group | key | before | after | tolerance | detail |
|---|---|---|---|---|---|
| wpt css/CSS2/floats-clear | `wpt\|css/CSS2/floats-clear/floats-153.xht` | pass | fail |  | pass -> fail (clean pass lost) |

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

## Improvements (377)

none outside WPT

WPT/crashtest improvements: 377 (listed in gate-report.json).

## changed (6)

| group | key | before | after | tolerance | detail |
|---|---|---|---|---|---|
| wpt css/CSS2/text | `wpt\|css/CSS2/text/text-transform-cap-002.xht` | pass-blank | fail |  | pass-blank -> fail |
| wpt css/css-page | `wpt\|css/css-page/page-box-011-print.html` | pass-blank | fail |  | pass-blank -> fail |
| wpt css/css-text | `wpt\|css/css-text/boundary-shaping/boundary-shaping-001.html` | pass-blank | fail |  | pass-blank -> fail |
| wpt css/css-text | `wpt\|css/css-text/boundary-shaping/boundary-shaping-003.html` | pass-blank | fail |  | pass-blank -> fail |
| wpt css/css-text | `wpt\|css/css-text/boundary-shaping/boundary-shaping-004.html` | pass-blank | fail |  | pass-blank -> fail |
| wpt css/css-text | `wpt\|css/css-text/boundary-shaping/boundary-shaping-005.html` | pass-blank | fail |  | pass-blank -> fail |

## WPT per directory (pass / clean pass)

| directory | pass before | pass after | clean before | clean after |
|---|---|---|---|---|
| css/CSS2/abspos | 0 | 2 | 0 | 2 |
| css/CSS2/backgrounds | 176 | 175 | 67 | 67 |
| css/CSS2/borders | 383 | 383 | 354 | 354 |
| css/CSS2/box | 4 | 4 | 0 | 0 |
| css/CSS2/box-display | 53 | 63 | 52 | 63 |
| css/CSS2/colors | 9 | 10 | 9 | 10 |
| css/CSS2/floats | 19 | 21 | 17 | 18 |
| css/CSS2/floats-clear | 39 | 39 | 34 | 34 |
| css/CSS2/fonts | 127 | 135 | 127 | 135 |
| css/CSS2/generated-content | 43 | 81 | 38 | 77 |
| css/CSS2/linebox | 125 | 127 | 123 | 125 |
| css/CSS2/lists | 67 | 67 | 40 | 40 |
| css/CSS2/margin-padding-clear | 517 | 525 | 502 | 508 |
| css/CSS2/normal-flow | 415 | 424 | 391 | 400 |
| css/CSS2/pagination | 33 | 33 | 31 | 31 |
| css/CSS2/positioning | 315 | 358 | 289 | 356 |
| css/CSS2/tables | 53 | 77 | 50 | 74 |
| css/CSS2/text | 237 | 245 | 229 | 236 |
| css/CSS2/visudet | 14 | 14 | 8 | 9 |
| css/CSS2/visufx | 1 | 2 | 1 | 2 |
| css/CSS2/visuren | 3 | 5 | 3 | 5 |
| css/css-break | 104 | 111 | 75 | 81 |
| css/css-page | 64 | 72 | 49 | 56 |
| css/css-tables | 38 | 45 | 29 | 36 |
| css/css-text | 464 | 631 | 214 | 378 |

## Per group

| group | classes |
|---|---|
| code-checks | failure 1 |
| layout-diff checks | failure 6 |
| wpt css/CSS2/abspos | improvement 2 |
| wpt css/CSS2/backgrounds | reported 1 |
| wpt css/CSS2/box-display | improvement 11, reported 1 |
| wpt css/CSS2/colors | improvement 1 |
| wpt css/CSS2/floats | improvement 2 |
| wpt css/CSS2/floats-clear | improvement 1, regression 1 |
| wpt css/CSS2/fonts | improvement 8 |
| wpt css/CSS2/generated-content | improvement 40 |
| wpt css/CSS2/linebox | improvement 2 |
| wpt css/CSS2/margin-padding-clear | improvement 8 |
| wpt css/CSS2/normal-flow | improvement 9 |
| wpt css/CSS2/positioning | improvement 67, reported 24 |
| wpt css/CSS2/tables | improvement 24 |
| wpt css/CSS2/text | improvement 8, changed 1 |
| wpt css/CSS2/visudet | improvement 1 |
| wpt css/CSS2/visufx | improvement 1 |
| wpt css/CSS2/visuren | improvement 2 |
| wpt css/css-break | improvement 7 |
| wpt css/css-page | improvement 9, changed 1 |
| wpt css/css-tables | improvement 7 |
| wpt css/css-text | changed 4, improvement 167 |

## Tolerances

| class | tolerance | label | rationale |
|---|---|---|---|
| position-mm | 0.1 mm | DESIGN TARGET | word/anchor position error vs a reference (REF-W max/p95, REF-R worst anchor, DANFE-L1, LET-1). 0.1 mm (0.28 pt, 0.38 CSS px) is 10x the 0.01 mm the values are reported with and below one CSS px (0.26 mm), the smallest step a px-snapping layout can move; the measurement is deterministic for one build and one reference (CONFIRMED: equal inputs gave equal values in the Phase A repeat run). |
| geometry-excess-mm | 0.05 mm | DESIGN TARGET | distance OUTSIDE a specification window (BOL-G*, DANFE-B*, DANFE-M1, TXT-A1). Inside the window the spec admits any value, so only the excess is ratcheted; 0.05 mm is about one 600 dpi raster pixel (0.042 mm), the measurement quantum of measure_bars.py / the page ink box. |
| font-excess-pt | 0.05 pt | SPEC-derived tolerance unit | font-size excess outside a window; 0.05 pt is the tolerance ACCEPTANCE.md already applies to every font-size criterion (BOL-T*, DANFE-F*). |
| count | 0 count | DESIGN TARGET | integer counts from deterministic tools (required strings found, extractor missing/extra tokens, segments/glyphs attributed, decoded symbols): any loss is a real change of the document. |
| page-delta | 0 pages | DESIGN TARGET | \|vellora pages - reference pages\|: a page break moving is never noise. |
| pdf-probe-pt | 1 pt | DESIGN TARGET | per-word \|dx\| / \|dy\| of vellora's PDF vs Chrome's PDF (pdftotext -bbox, same-page pairs). 1 pt (0.35 mm) is an order of magnitude below the Phase A regressions it must catch (invoice price column +9 pt, notification signature -14 pt) and above glyph-bbox rounding of pdftotext (0.01 pt) and sub-px snapping differences. |

