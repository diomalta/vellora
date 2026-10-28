# Fidelity gate report

**Verdict: FAIL** (5 gating item(s) vs the previous link, 0 vs the chain head fidelity/baselines/port/00-start; 27 flagged WPT pass(es) lost, reported, not gating; 1573 value(s) worse within tolerance, listed, not gating; pin view: merge to main BLOCKED, 5 (c) item(s)). Local macOS runs are INDICATIVE.

| field | value |
|---|---|
| date | 2026-10-28T04:35:04.235Z |
| command | `node fidelity/gate/run.mjs --baseline fidelity/baselines/port/10-integration --run ~/Repositories/vellora-fidelity-runs/c05-float-rule/whatif-run --head fidelity/baselines/port/00-start --pin fidelity/baselines/pin --layout-from ~/Repositories/vellora-fidelity-runs/c05-float-rule/whatif-run --debt fidelity/baselines/port/DEBT.json --step 14-c05-float-rule --accept ~/Repositories/vellora-fidelity-runs/c05-float-rule/accepted-c04+float.json --doc-aggregate ~/Repositories/vellora-fidelity-runs/c05-float-rule/whatif-run/doc-aggregate/summary.json --contract --out ~/Repositories/vellora-fidelity-runs/c05-float-rule/regate-float` |
| baseline | fidelity/baselines/port/10-integration (vellora-fidelity/baseline/2) |
| run | ~/Repositories/vellora-fidelity-runs/c05-float-rule/whatif-run (vellora-fidelity/run-all/1) |
| os / cpu | darwin 27.0.0 arm64 (macOS 27.0.1) / Apple M5 Pro |
| node / rustc | v22.23.2 / rustc 1.96.0 (ac68faa20 2026-05-25) |
| chrome | Google Chrome for Testing 155.0.8059.85 |
| blitz | 0.3.0-beta.4 registry+https://github.com/rust-lang/crates.io-index |
| git | phasec/04-tip 45af35f7912c89b5112a66fea627d15b1818be18 (0 dirty) |

Counts: improvement 3057, newly-measured 1272, reported 27, changed 2, accepted 4, within-tolerance 1573, pin-c 5, gating 5, headGating 0, debt 5, flaggedPassLost 27, unchanged 8477, withinTolerance 1573, withinToleranceBetter 2721, missingTokensNotComparable 0, pinA 5, pinB 4, pinC 5, docRegressions 0, contractPagesFailing 0.

## Absolute failures of the run (gate, cannot be accepted)

none

## Regressions beyond tolerance (gate)

none outside WPT

### WPT / crashtest regressions (5)

| group | key | before | after | tolerance | detail |
|---|---|---|---|---|---|
| wpt css/css-break | `pin\|wpt\|css/css-break/flexbox/multi-line-column-flex-fragmentation-054.html` | pass | fail |  | worse than the shipped main (pin) and neither an artefact nor ledger debt: worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): pass -> fail (clean pass lost) |
| wpt css/css-break | `pin\|wpt\|css/css-break/flexbox/multi-line-column-flex-fragmentation-055.html` | pass | fail |  | worse than the shipped main (pin) and neither an artefact nor ledger debt: worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): pass -> fail (clean pass lost) |
| wpt css/css-break | `pin\|wpt\|css/css-break/flexbox/multi-line-column-flex-fragmentation-058.html` | pass | fail |  | worse than the shipped main (pin) and neither an artefact nor ledger debt: worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): pass -> fail (clean pass lost) |
| wpt css/css-break | `pin\|wpt\|css/css-break/ruby-003.html` | pass | fail |  | worse than the shipped main (pin) and neither an artefact nor ledger debt: worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): pass -> fail (clean pass lost) |
| wpt css/css-text | `pin\|wpt\|css/css-text/hanging-punctuation/hanging-punctuation-first-002.html` | pass | fail |  | worse than the shipped main (pin) and neither an artefact nor ledger debt: worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): pass -> fail (clean pass lost) |

## Accepted regressions (acceptedRegressions, with evidence)

| group | key | before | after | tolerance | detail |
|---|---|---|---|---|---|
| wpt css/css-break | `wpt\|css/css-break/table/table-border-007.html` | pass | fail |  | pass -> fail (clean pass lost) — ACCEPTED: pass -> fail. The OLD pass was false: the test (a 180px-tall display:table in a 2-column multicol, which vellora does not implement) and its reference (two side-by-side floats drawing the two column fragments) were BOTH wrong in the same way while Blitz's floats feature was off: the reference's floats were stacked in-flow blocks, which looked exactly like the unfragmented table (c03-tip: maxDifference 0, ink bboxShift 100 vs Chrome). With floats on (phasec/04-floats 045498f), vellora's reference now draws Chrome's two fragments rect for rect, while the test still draws one unfragmented table (no multicol), so the two differ. Fixing the test needs multicol fragmentation, not a float change. (evidence: (1) ~/Repositories/vellora-fidelity-runs/run-all-c03-tip-20261028T013052Z-blitz-0.3.0-beta.4-vellora-25c3f85/wpt/results.json: outcome pass, pageCounts [1, 1], maxDifference 0, inkCheck {missingFrac 0.006, bboxShift 100}. (2) ~/Repositories/vellora-fidelity-runs/c04-floats-iter/r7-tb007 (node fidelity/wpt/run.mjs css/css-break --filter table-border-007 --chrome <CfT 155.0.8059.85> --raw --artifacts all --keep-pdf, phasec/04-floats 75fac30, 2026-10-28, local macOS, INDICATIVE), PyMuPDF 1.28.2 fills of the PDFs: vellora rhs.pdf = Chrome rhs.pdf = Chrome lhs.pdf, 8 rects, pink (6.0,37.5)-(58.5,112.5) and (81.0,37.5)-(133.5,112.5) pt with their black borders; vellora lhs.pdf: one pink (6.0,37.5)-(58.5,187.5) pt table with 4 black borders (unfragmented). Raw Blitz fails it the same way (rawOutcome fail).) |
| wpt css/css-page | `wpt\|css/css-page/page-name-flex-001-print.html` | pass | fail |  | pass -> fail (clean pass lost) — ACCEPTED: pass -> fail. The OLD pass was false by page count (GATE-A3 (a)): vellora's old test and reference each printed 1 page(s) and matched, while Chrome prints 4 pages for both. The test forces its page breaks with named pages (`page: <name>` on flex items, CSS Page 3 §4.1), which vellora ignored until Phase C step 04. vellora now breaks at each change of page name, so the test prints 4 page(s) (Chrome 4); the reference prints 1 (Chrome 1). Chrome fails this test itself (chrome outcome fail): its test and reference page counts differ too. (evidence: (1) ~/Repositories/vellora-fidelity-runs/run-all-c03-tip-20261028T013052Z-blitz-0.3.0-beta.4-vellora-25c3f85/wpt/results.json (runId 20261028T013052Z, c03-tip 25c3f85, 2026-10-28): outcome pass, comparisons pageCounts [1, 1], chrome.comparisons pageCounts [4, 1]. (2) ~/Repositories/vellora-fidelity-runs/c04-frag-iter/full-4/results.json (full default WPT run, --raw, --chrome-from the 10-tip run, phasec/04-frag with named-page breaks (the commit after 9553fce), 2026-10-28, Chrome for Testing 155.0.8059.85, local macOS, INDICATIVE): outcome fail, pageCounts [4, 1], chrome pageCounts [4, 1].) |
| wpt css/css-page | `wpt\|css/css-page/page-name-flex-002-print.html` | pass | fail |  | pass -> fail (clean pass lost) — ACCEPTED: pass -> fail. The OLD pass was false by page count (GATE-A3 (a)): vellora's old test and reference each printed 1 page(s) and matched, while Chrome prints 3 pages for both. The test forces its page breaks with named pages (`page: <name>` on flex items, CSS Page 3 §4.1), which vellora ignored until Phase C step 04. vellora now breaks at each change of page name, so the test prints 3 page(s) (Chrome 3); the reference prints 1 (Chrome 1). Chrome fails this test itself (chrome outcome fail): its test and reference page counts differ too. (evidence: (1) ~/Repositories/vellora-fidelity-runs/run-all-c03-tip-20261028T013052Z-blitz-0.3.0-beta.4-vellora-25c3f85/wpt/results.json (runId 20261028T013052Z, c03-tip 25c3f85, 2026-10-28): outcome pass, comparisons pageCounts [1, 1], chrome.comparisons pageCounts [3, 1]. (2) ~/Repositories/vellora-fidelity-runs/c04-frag-iter/full-4/results.json (full default WPT run, --raw, --chrome-from the 10-tip run, phasec/04-frag with named-page breaks (the commit after 9553fce), 2026-10-28, Chrome for Testing 155.0.8059.85, local macOS, INDICATIVE): outcome fail, pageCounts [3, 1], chrome pageCounts [3, 1].) |
| wpt css/css-page | `wpt\|css/css-page/page-name-flex-004-print.html` | pass | fail |  | pass -> fail (clean pass lost) — ACCEPTED: pass -> fail. The OLD pass was false by page count (GATE-A3 (a)): vellora's old test and reference each printed 1 page(s) and matched, while Chrome prints 4 pages for both. The test forces its page breaks with named pages (`page: <name>` on flex items, CSS Page 3 §4.1), which vellora ignored until Phase C step 04. vellora now breaks at each change of page name, so the test prints 3 page(s) (Chrome 4); the reference prints 1 (Chrome 2). Chrome fails this test itself (chrome outcome fail): its test and reference page counts differ too. (evidence: (1) ~/Repositories/vellora-fidelity-runs/run-all-c03-tip-20261028T013052Z-blitz-0.3.0-beta.4-vellora-25c3f85/wpt/results.json (runId 20261028T013052Z, c03-tip 25c3f85, 2026-10-28): outcome pass, comparisons pageCounts [1, 1], chrome.comparisons pageCounts [4, 2]. (2) ~/Repositories/vellora-fidelity-runs/c04-frag-iter/full-4/results.json (full default WPT run, --raw, --chrome-from the 10-tip run, phasec/04-frag with named-page breaks (the commit after 9553fce), 2026-10-28, Chrome for Testing 155.0.8059.85, local macOS, INDICATIVE): outcome fail, pageCounts [3, 1], chrome pageCounts [4, 2].) |

Acceptance entries that matched nothing (stale or mistyped):

- `pdf-probe\|oss-postmark-receipt\|p1\|[Product#2\|pairing`: The OLD pair was an oracle artefact: Chrome's PDF draws the masthead "[Product Name]" twice, the text (#1, #A8AAAF, baseline 57.75 pt) and its `text-shadow: 0 1px 0 white` copy (#2, #FFFFFF, baseline 58.50 pt, 1 px = 0.75 pt lower); vellora draws no text-shadow, so it has one instance. At 09 that instance (baseline 61.35 pt) paired with the white shadow copy #2; at 10-spark the cellspacing/cellpadding hints put it at 57.60 pt and it pairs with the text #1 (dy -0.15 pt, newly measured). No text was lost.
- `pdf-probe\|oss-postmark-receipt\|p1\|Name]#2\|pairing`: Same word as [Product#2: the second half of the masthead "[Product Name]", whose Chrome #2 instance is the white text-shadow copy (baseline 58.50 pt). vellora's single instance now pairs with the text #1 (p1\|Name]#1, dx -0.90 dy -0.15 pt, newly measured).
- `wpt\|css/CSS2/pagination/float-page-break-inside-avoid-1-print.html`: pass -> fail. The OLD pass was false by page count (GATE-A3 (a)): vellora's old test and reference each printed 2 page(s) and matched, while Chrome prints 3 pages for both. Before Phase C step 03 a fragment taller than a page was moved whole onto its own page and bled past it, which happened to look like the reference's forced break. Now the test prints Chrome's 3 pages (the oversize `break-inside: avoid` table/row starts a fresh page and is cut there); the reference table-page-break-inside-avoid-print-ref.html (`<p style="page-break-after:always">`) relies on `page-break-after`, which vellora does not implement (COMPATIBILITY.md), so it still prints 2 pages (1 for row-...-2) and the two differ. Next step: break-after.
- `wpt\|css/CSS2/pagination/row-page-break-inside-avoid-2-print.html`: pass -> fail. The OLD pass was false by page count (GATE-A3 (a)): vellora's old test and reference each printed 1 page(s) and matched, while Chrome prints 3 pages for both. Before Phase C step 03 a fragment taller than a page was moved whole onto its own page and bled past it, which happened to look like the reference's forced break. Now the test prints Chrome's 3 pages (the oversize `break-inside: avoid` table/row starts a fresh page and is cut there); the reference rowgroup-page-break-inside-avoid-5-print-ref.html (`thead { page-break-after:always }`) relies on `page-break-after`, which vellora does not implement (COMPATIBILITY.md), so it still prints 2 pages (1 for row-...-2) and the two differ. Next step: break-after.
- `wpt\|css/CSS2/pagination/rowgroup-page-break-inside-avoid-2-print.html`: pass -> fail. The OLD pass was false by page count (GATE-A3 (a)): vellora's old test and reference each printed 2 page(s) and matched, while Chrome prints 3 pages for both. Before Phase C step 03 a fragment taller than a page was moved whole onto its own page and bled past it, which happened to look like the reference's forced break. Now the test prints Chrome's 3 pages (the oversize `break-inside: avoid` table/row starts a fresh page and is cut there); the reference table-page-break-inside-avoid-print-ref.html (`<p style="page-break-after:always">`) relies on `page-break-after`, which vellora does not implement (COMPATIBILITY.md), so it still prints 2 pages (1 for row-...-2) and the two differ. Next step: break-after.
- `wpt\|css/CSS2/pagination/rowgroup-page-break-inside-avoid-3-print.html`: pass -> fail. The OLD pass was false by page count (GATE-A3 (a)): vellora's old test and reference each printed 2 page(s) and matched, while Chrome prints 3 pages for both. Before Phase C step 03 a fragment taller than a page was moved whole onto its own page and bled past it, which happened to look like the reference's forced break. Now the test prints Chrome's 3 pages (the oversize `break-inside: avoid` table/row starts a fresh page and is cut there); the reference table-page-break-inside-avoid-print-ref.html (`<p style="page-break-after:always">`) relies on `page-break-after`, which vellora does not implement (COMPATIBILITY.md), so it still prints 2 pages (1 for row-...-2) and the two differ. Next step: break-after.
- `wpt\|css/CSS2/pagination/table-page-break-inside-avoid-1-print.html`: pass -> fail. The OLD pass was false by page count (GATE-A3 (a)): vellora's old test and reference each printed 2 page(s) and matched, while Chrome prints 3 pages for both. Before Phase C step 03 a fragment taller than a page was moved whole onto its own page and bled past it, which happened to look like the reference's forced break. Now the test prints Chrome's 3 pages (the oversize `break-inside: avoid` table/row starts a fresh page and is cut there); the reference table-page-break-inside-avoid-print-ref.html (`<p style="page-break-after:always">`) relies on `page-break-after`, which vellora does not implement (COMPATIBILITY.md), so it still prints 2 pages (1 for row-...-2) and the two differ. Next step: break-after.
- `wpt\|css/CSS2/pagination/table-page-break-inside-avoid-2-print.html`: pass -> fail. The OLD pass was false by page count (GATE-A3 (a)): vellora's old test and reference each printed 2 page(s) and matched, while Chrome prints 3 pages for both. Before Phase C step 03 a fragment taller than a page was moved whole onto its own page and bled past it, which happened to look like the reference's forced break. Now the test prints Chrome's 3 pages (the oversize `break-inside: avoid` table/row starts a fresh page and is cut there); the reference table-page-break-inside-avoid-2-print-ref.html (`<div style="page-break-after: always">`) relies on `page-break-after`, which vellora does not implement (COMPATIBILITY.md), so it still prints 2 pages (1 for row-...-2) and the two differ. Next step: break-after.
- `wpt\|css/CSS2/floats/float-nowrap-8.html`: Pin view only: pass at the pin (published v0.2.0, 5810062), fail on this branch. NOT a ratchet regression: the test FAILED at port/10-integration (fidelity/baselines/port/10-integration/wpt/expectations-blitz-0.3.0-beta.4.json: "fail"; its run 20261023T004510Z, copy run-all-10-tip-..., outcome fail, rawOutcome fail) and at the head port/00-start ("fail"); it passed only at the c04 tip, which is not a baseline. (1) Chrome itself fails the test: Chrome 155 keeps the float on the line when the text before it fits beside it ('Some ' + a 5ch float in a 10ch line), while the reference float-nowrap-1 has it below the line (Gecko's rule). vellora now follows Chrome (orchestrator decision (b), product target = Chrome) and fails it the same way: maxDifference 255 / 1169 px vs Chrome's 255 / 1159 px, ink bbox [8,8,277,46] vs Chrome's [9,8,278,46]. (2) The OLD pin pass was false: Blitz's floats cargo feature was off at the pin, and the pin build renders the test, its reference float-nowrap-1.html AND float-nowrap-1-notref.html (the reference float-nowrap-1 must DIFFER from) byte-identically, the blue box drawn over the start of the line in all three, so the pin could not place the float at all.

## Declared strict-gate rejections (declaredRejections, 0)

none

## Reported, not gating (27)

| group | key | before | after | tolerance | detail |
|---|---|---|---|---|---|
| wpt css/CSS2/backgrounds | `wpt\|css/CSS2/backgrounds/background-root-007.xht` | pass | fail |  | pass[css-url-resource,ink-missing-vs-chrome] -> fail (flagged pass: reported, not gated) |
| wpt css/CSS2/borders | `wpt\|css/CSS2/borders/border-bottom-width-applies-to-001.xht` | pass | fail |  | pass[ink-missing-vs-chrome] -> fail (flagged pass: reported, not gated) |
| wpt css/CSS2/borders | `wpt\|css/CSS2/borders/border-bottom-width-applies-to-002.xht` | pass | fail |  | pass[ink-missing-vs-chrome] -> fail (flagged pass: reported, not gated) |
| wpt css/CSS2/borders | `wpt\|css/CSS2/borders/border-bottom-width-applies-to-003.xht` | pass | fail |  | pass[ink-missing-vs-chrome] -> fail (flagged pass: reported, not gated) |
| wpt css/CSS2/borders | `wpt\|css/CSS2/borders/border-bottom-width-applies-to-004.xht` | pass | fail |  | pass[ink-missing-vs-chrome] -> fail (flagged pass: reported, not gated) |
| wpt css/CSS2/borders | `wpt\|css/CSS2/borders/border-left-width-applies-to-001.xht` | pass | fail |  | pass[ink-missing-vs-chrome] -> fail (flagged pass: reported, not gated) |
| wpt css/CSS2/borders | `wpt\|css/CSS2/borders/border-left-width-applies-to-002.xht` | pass | fail |  | pass[ink-missing-vs-chrome] -> fail (flagged pass: reported, not gated) |
| wpt css/CSS2/borders | `wpt\|css/CSS2/borders/border-left-width-applies-to-003.xht` | pass | fail |  | pass[ink-missing-vs-chrome] -> fail (flagged pass: reported, not gated) |
| wpt css/CSS2/borders | `wpt\|css/CSS2/borders/border-left-width-applies-to-004.xht` | pass | fail |  | pass[ink-missing-vs-chrome] -> fail (flagged pass: reported, not gated) |
| wpt css/CSS2/borders | `wpt\|css/CSS2/borders/border-right-width-applies-to-001.xht` | pass | fail |  | pass[ink-missing-vs-chrome] -> fail (flagged pass: reported, not gated) |
| wpt css/CSS2/borders | `wpt\|css/CSS2/borders/border-right-width-applies-to-002.xht` | pass | fail |  | pass[ink-missing-vs-chrome] -> fail (flagged pass: reported, not gated) |
| wpt css/CSS2/borders | `wpt\|css/CSS2/borders/border-right-width-applies-to-003.xht` | pass | fail |  | pass[ink-missing-vs-chrome] -> fail (flagged pass: reported, not gated) |
| wpt css/CSS2/borders | `wpt\|css/CSS2/borders/border-right-width-applies-to-004.xht` | pass | fail |  | pass[ink-missing-vs-chrome] -> fail (flagged pass: reported, not gated) |
| wpt css/CSS2/borders | `wpt\|css/CSS2/borders/border-top-width-applies-to-001.xht` | pass | fail |  | pass[ink-missing-vs-chrome] -> fail (flagged pass: reported, not gated) |
| wpt css/CSS2/borders | `wpt\|css/CSS2/borders/border-top-width-applies-to-002.xht` | pass | fail |  | pass[ink-missing-vs-chrome] -> fail (flagged pass: reported, not gated) |
| wpt css/CSS2/borders | `wpt\|css/CSS2/borders/border-top-width-applies-to-003.xht` | pass | fail |  | pass[ink-missing-vs-chrome] -> fail (flagged pass: reported, not gated) |
| wpt css/CSS2/borders | `wpt\|css/CSS2/borders/border-top-width-applies-to-004.xht` | pass | fail |  | pass[ink-missing-vs-chrome] -> fail (flagged pass: reported, not gated) |
| wpt css/CSS2/floats | `wpt\|css/CSS2/floats/float-root.html` | pass | fail |  | pass[ink-displaced-vs-chrome] -> fail (flagged pass: reported, not gated) |
| wpt css/CSS2/text | `wpt\|css/CSS2/text/text-indent-wrap-001-ref-inline-margin.xht` | pass | fail |  | pass[ink-missing-vs-chrome] -> fail (flagged pass: reported, not gated) |
| wpt css/css-break | `wpt\|css/css-break/flexbox/single-line-column-flex-fragmentation-060-print.html` | pass | fail |  | pass[ink-missing-vs-chrome] -> fail (flagged pass: reported, not gated) |
| wpt css/css-break | `wpt\|css/css-break/relpos-inline.html` | pass | fail |  | pass[ink-missing-vs-chrome] -> fail (flagged pass: reported, not gated) |
| wpt css/css-page | `wpt\|css/css-page/media-queries-001-print.html` | pass | fail |  | pass[ink-missing-vs-chrome] -> fail (flagged pass: reported, not gated) |
| wpt css/css-tables | `wpt\|css/css-tables/out-of-order-elements-collapsed-border.html` | pass | fail |  | pass[ink-missing-vs-chrome] -> fail (flagged pass: reported, not gated) |
| wpt css/css-text | `wpt\|css/css-text/word-space-transform/word-space-transform-010.html` | pass | fail |  | pass[uncovered-glyphs,ink-displaced-vs-chrome] -> fail (flagged pass: reported, not gated) |
| wpt css/css-text | `wpt\|css/css-text/word-space-transform/word-space-transform-011.html` | pass | fail |  | pass[uncovered-glyphs,ink-displaced-vs-chrome] -> fail (flagged pass: reported, not gated) |
| wpt css/css-text | `wpt\|css/css-text/word-space-transform/word-space-transform-012.html` | pass | fail |  | pass[uncovered-glyphs,ink-displaced-vs-chrome] -> fail (flagged pass: reported, not gated) |
| wpt css/css-text | `wpt\|css/css-text/word-space-transform/word-space-transform-018.html` | pass | fail |  | pass[uncovered-glyphs,ink-missing-vs-chrome] -> fail (flagged pass: reported, not gated) |

## Improvements (3057)

| group | key | before | after | tolerance | detail |
|---|---|---|---|---|---|
| corpus BOL-G | `boleto-febraban\|BOL-G4\|corpus\|\|criterion#1` | FAIL | PASS |  | ficha_relative_mm.barcode_centre_above_ficha_bottom not measurable (no dashed cut line detected) -> 11.9937 (target 12 ± 0.5) |
| corpus BOL-G | `boleto-febraban\|BOL-G6\|corpus\|\|criterion#1` | FAIL | PASS |  | ficha_relative_mm.ficha_top not measurable (no dashed cut line detected) -> 186.0127 (target 186 ± 0.5) |
| corpus BOL-R | `boleto-febraban\|BOL-R1\|corpus\|\|criterion#1` | FAIL | PASS |  | worst BOL-T3 1.82 mm (tol 1) -> worst BOL-T1 0.28 mm (tol 1) |
| oracles:text EXT-2 | `boleto-febraban\|EXT-2\|oracles:text\|plain\|criterion#1` | WARN | PASS |  | pdftotext pass (missing 0, extra 0); pdfminer.six warn (missing 0, extra 0); pymupdf pass (missing 0, extra 0) -> pdftotext pass (missing 0, extra 0); pdfminer.six pass (missing 0, extra 0); pymupdf pass (missing 0, extra 0) |
| oracles:layout REF-W | `boleto-febraban\|REF-W\|oracles:layout\|plain\|criterion#1` | FAIL | PASS |  | max 2.31 mm, p95 1.95 mm over 315 consensus words (Chrome and WeasyPrint within 2 pt; coverage 1) -> max 0.42 mm, p95 0.37 mm over 315 consensus words (Chrome and WeasyPrint within 2 pt; coverage 1) |
| corpus BOL-G | `boleto-febraban.px-grid\|BOL-G4\|corpus\|\|criterion#1` | FAIL | PASS |  | ficha_relative_mm.barcode_centre_above_ficha_bottom not measurable (no dashed cut line detected) -> 11.9937 (target 12 ± 0.5) |
| corpus BOL-G | `boleto-febraban.px-grid\|BOL-G6\|corpus\|\|criterion#1` | FAIL | PASS |  | ficha_relative_mm.ficha_top not measurable (no dashed cut line detected) -> 186.0127 (target 186 ± 0.5) |
| corpus BOL-R | `boleto-febraban.px-grid\|BOL-R1\|corpus\|\|criterion#1` | FAIL | PASS |  | worst BOL-T3 1.82 mm (tol 1) -> worst BOL-T1 0.28 mm (tol 1) |
| oracles:text EXT-2 | `boleto-febraban.px-grid\|EXT-2\|oracles:text\|plain\|criterion#1` | WARN | PASS |  | pdftotext pass (missing 0, extra 0); pdfminer.six warn (missing 0, extra 0); pymupdf pass (missing 0, extra 0) -> pdftotext pass (missing 0, extra 0); pdfminer.six pass (missing 0, extra 0); pymupdf pass (missing 0, extra 0) |
| oracles:layout REF-W | `boleto-febraban.px-grid\|REF-W\|oracles:layout\|plain\|criterion#1` | FAIL | PASS |  | max 2.31 mm, p95 1.95 mm over 315 consensus words (Chrome and WeasyPrint within 2 pt; coverage 1) -> max 0.42 mm, p95 0.37 mm over 315 consensus words (Chrome and WeasyPrint within 2 pt; coverage 1) |
| oracles:layout REF-W | `boleto\|REF-W\|oracles:layout\|plain\|criterion#1` | FAIL | PASS |  | max 2.62 mm, p95 2.36 mm over 106 consensus words (Chrome and WeasyPrint within 2 pt; coverage 0.357) -> max 0.35 mm, p95 0.35 mm over 106 consensus words (Chrome and WeasyPrint within 2 pt; coverage 0.357) |
| corpus DANFE-P | `danfe\|DANFE-P1\|corpus\|\|criterion#1` | FAIL | PASS |  | 2 (expected 1) -> 1 (expected 1) |
| corpus DANFE-M | `danfe\|DANFE-M1\|corpus\|\|criterion#1` | FAIL | PASS |  | L 2.498 T 4.445 R 0 B 32.173 (each in [2, 8]) -> L 2.371 T 4.233 R 2.201 B 3.048 (each in [2, 8]) |
| corpus DANFE-L | `danfe\|DANFE-L1b\|corpus\|\|criterion#1` | FAIL | PASS |  | 6pt SWPJVR+LiberationSerif-Bold; pos Δ(0, 3.68) mm -> 6pt SWPJVR+LiberationSerif-Bold; pos Δ(-0.12, 2.39) mm |
| corpus DANFE-R | `danfe\|DANFE-R1\|corpus\|\|criterion#1` | FAIL | PASS |  | DANFE-A4: anchor text not found in vellora -> worst DANFE-A4 0.27 mm (tol 1) |
| oracles:layout REF-P | `danfe\|REF-P\|oracles:layout\|plain\|criterion#1` | FAIL | PASS |  | 2 pages vs Chrome 1 (WeasyPrint 1) -> 1 pages vs Chrome 1 (WeasyPrint 1) |
| oracles:layout REF-W | `invoice\|REF-W\|oracles:layout\|plain\|criterion#1` | FAIL | PASS |  | max 1.68 mm, p95 1.55 mm over 230 consensus words (Chrome and WeasyPrint within 2 pt; coverage 0.429) -> max 0.36 mm, p95 0.33 mm over 230 consensus words (Chrome and WeasyPrint within 2 pt; coverage 0.429) |
| oracles:layout REF-W | `notification\|REF-W\|oracles:layout\|plain\|criterion#1` | FAIL | PASS |  | max 1.81 mm, p95 1.7 mm over 245 consensus words (Chrome and WeasyPrint within 2 pt; coverage 0.988) -> max 0.18 mm, p95 0.15 mm over 245 consensus words (Chrome and WeasyPrint within 2 pt; coverage 0.988) |
| oracles:layout LET-1 | `notification\|LET-1\|oracles:layout\|plain\|criterion#1` | FAIL | PASS |  | worst "Gerente do Departamento de Cobra" dy 1.81 mm (tol 1; 4 anchors: last paragraph + signature lines; 0 disputed) -> worst "Gerente do Departamento de Cobra" dy 0.1 mm (tol 1; 4 anchors: last paragraph + signature lines; 0 disputed) |
| corpus INV-P | `oss-postmark-receipt\|INV-P2\|corpus\|\|criterion#1` | FAIL | PASS |  | 1 vs reference 2 -> 2 vs reference 2 |
| oracles:layout REF-P | `oss-postmark-receipt\|REF-P\|oracles:layout\|plain\|criterion#1` | FAIL | PASS |  | 1 pages vs Chrome 2 (WeasyPrint 2) -> 2 pages vs Chrome 2 (WeasyPrint 2) |
| oracles:layout REF-W | `receipt\|REF-W\|oracles:layout\|plain\|criterion#1` | FAIL | PASS |  | max 0.77 mm, p95 0.68 mm over 145 consensus words (Chrome and WeasyPrint within 2 pt; coverage 0.96) -> max 0.36 mm, p95 0.29 mm over 145 consensus words (Chrome and WeasyPrint within 2 pt; coverage 0.96) |
| corpus TXT-P | `text-stress-ptbr\|TXT-P1\|corpus\|\|criterion#1` | FAIL | PASS |  | 8 vs reference 7 -> 7 vs reference 7 |
| oracles:layout REF-P | `text-stress-ptbr\|REF-P\|oracles:layout\|plain\|criterion#1` | FAIL | PASS |  | 8 pages vs Chrome 7 (WeasyPrint 7) -> 7 pages vs Chrome 7 (WeasyPrint 7) |
| oracles:layout REF-W | `text-stress-ptbr\|REF-W\|oracles:layout\|plain\|criterion#1` | FAIL | PASS |  | max 97.79 mm, p95 97.02 mm over 736 consensus words (Chrome and WeasyPrint within 2 pt; coverage 0.818) -> max 0.48 mm, p95 0.38 mm over 1300 consensus words (Chrome and WeasyPrint within 2 pt; coverage 0.76) |
| corpus LET- | `text-stress-ptbr\|LET-3\|corpus\|\|criterion#1` | FAIL | PASS |  | 8 vs reference 7 (= TXT-P1) -> 7 vs reference 7 (= TXT-P1) |
| corpus BOL-R | `boleto-febraban\|BOL-R1\|corpus\|\|criterion#1\|worstMm` | 1.82 | 0.28 | 0.1 position-mm | 1.82 -> 0.28 |
| oracles:text EXT-2 | `boleto-febraban\|EXT-2\|oracles:text\|plain\|criterion#1\|statusRank.pdfminer.six` | 2 | 3 | 0 count | 2 -> 3 |
| oracles:layout REF-W | `boleto-febraban\|REF-W\|oracles:layout\|plain\|criterion#1\|maxMm` | 2.31 | 0.42 | 0.1 position-mm | 2.31 -> 0.42 |
| oracles:layout REF-W | `boleto-febraban\|REF-W\|oracles:layout\|plain\|criterion#1\|p95Mm` | 1.95 | 0.37 | 0.1 position-mm | 1.95 -> 0.37 |
| corpus BOL-R | `boleto-febraban.px-grid\|BOL-R1\|corpus\|\|criterion#1\|worstMm` | 1.82 | 0.28 | 0.1 position-mm | 1.82 -> 0.28 |
| oracles:text EXT-2 | `boleto-febraban.px-grid\|EXT-2\|oracles:text\|plain\|criterion#1\|statusRank.pdfminer.six` | 2 | 3 | 0 count | 2 -> 3 |
| oracles:layout REF-W | `boleto-febraban.px-grid\|REF-W\|oracles:layout\|plain\|criterion#1\|maxMm` | 2.31 | 0.42 | 0.1 position-mm | 2.31 -> 0.42 |
| oracles:layout REF-W | `boleto-febraban.px-grid\|REF-W\|oracles:layout\|plain\|criterion#1\|p95Mm` | 1.95 | 0.37 | 0.1 position-mm | 1.95 -> 0.37 |
| oracles:text EXT-2 | `boleto\|EXT-2\|oracles:text\|plain\|criterion#1\|statusRank.pdfminer.six` | 2 | 3 | 0 count | 2 -> 3 |
| oracles:layout REF-W | `boleto\|REF-W\|oracles:layout\|plain\|criterion#1\|maxMm` | 2.62 | 0.35 | 0.1 position-mm | 2.62 -> 0.35 |
| oracles:layout REF-W | `boleto\|REF-W\|oracles:layout\|plain\|criterion#1\|p95Mm` | 2.36 | 0.35 | 0.1 position-mm | 2.36 -> 0.35 |
| corpus DANFE-P | `danfe\|DANFE-P1\|corpus\|\|criterion#1\|pageDelta` | 1 | 0 | 0 page-delta | 1 -> 0 |
| corpus DANFE-M | `danfe\|DANFE-M1\|corpus\|\|criterion#1\|excessR` | 2 | 0 | 0.05 geometry-excess-mm | 2 -> 0 |
| corpus DANFE-M | `danfe\|DANFE-M1\|corpus\|\|criterion#1\|excessB` | 24.173 | 0 | 0.05 geometry-excess-mm | 24.173 -> 0 |
| corpus DANFE-L | `danfe\|DANFE-L1a\|corpus\|\|criterion#1\|posErrMm` | 2.09 | 1.59 | 0.1 position-mm | 2.09 -> 1.59 |
| corpus DANFE-L | `danfe\|DANFE-L1b\|corpus\|\|criterion#1\|posErrMm` | 3.68 | 2.39 | 0.1 position-mm | 3.68 -> 2.39 |
| corpus DANFE-L | `danfe\|DANFE-L1c\|corpus\|\|criterion#1\|posErrMm` | 5.24 | 3.15 | 0.1 position-mm | 5.24 -> 3.15 |
| corpus DANFE-L | `danfe\|DANFE-L1d\|corpus\|\|criterion#1\|posErrMm` | 6.49 | 3.35 | 0.1 position-mm | 6.49 -> 3.35 |
| oracles:layout REF-P | `danfe\|REF-P\|oracles:layout\|plain\|criterion#1\|pageDelta` | 1 | 0 | 0 page-delta | 1 -> 0 |
| oracles:layout REF-W | `danfe\|REF-W\|oracles:layout\|plain\|criterion#1\|maxMm` | 5.42 | 0.58 | 0.1 position-mm | 5.42 -> 0.58 |
| oracles:layout REF-W | `danfe\|REF-W\|oracles:layout\|plain\|criterion#1\|p95Mm` | 4.49 | 0.55 | 0.1 position-mm | 4.49 -> 0.55 |
| oracles:layout REF-W | `invoice\|REF-W\|oracles:layout\|plain\|criterion#1\|maxMm` | 1.68 | 0.36 | 0.1 position-mm | 1.68 -> 0.36 |
| oracles:layout REF-W | `invoice\|REF-W\|oracles:layout\|plain\|criterion#1\|p95Mm` | 1.55 | 0.33 | 0.1 position-mm | 1.55 -> 0.33 |
| oracles:layout REF-W | `notification\|REF-W\|oracles:layout\|plain\|criterion#1\|maxMm` | 1.81 | 0.18 | 0.1 position-mm | 1.81 -> 0.18 |
| oracles:layout REF-W | `notification\|REF-W\|oracles:layout\|plain\|criterion#1\|p95Mm` | 1.7 | 0.15 | 0.1 position-mm | 1.7 -> 0.15 |
| oracles:layout LET-1 | `notification\|LET-1\|oracles:layout\|plain\|criterion#1\|worstMm` | 1.81 | 0.1 | 0.1 position-mm | 1.81 -> 0.1 |
| corpus INV-P | `oss-postmark-receipt\|INV-P2\|corpus\|\|criterion#1\|pageDelta` | 1 | 0 | 0 page-delta | 1 -> 0 |
| oracles:text EXT-2 | `oss-postmark-receipt\|EXT-2\|oracles:text\|plain\|criterion#1\|missing.pdftotext` | 35 | 0 | 0 count | 35 -> 0 |
| oracles:text EXT-2 | `oss-postmark-receipt\|EXT-2\|oracles:text\|plain\|criterion#1\|statusRank.pdftotext` | 1 | 3 | 0 count | 1 -> 3 |
| oracles:text EXT-2 | `oss-postmark-receipt\|EXT-2\|oracles:text\|plain\|criterion#1\|missing.pymupdf` | 37 | 2 | 0 count | 37 -> 2 |
| oracles:layout REF-P | `oss-postmark-receipt\|REF-P\|oracles:layout\|plain\|criterion#1\|pageDelta` | 1 | 0 | 0 page-delta | 1 -> 0 |
| corpus INV-R | `oss-sparksuite-invoice\|INV-R1\|corpus\|\|criterion#1\|worstMm` | 0.61 | 0.01 | 0.1 position-mm | 0.61 -> 0.01 |
| oracles:layout REF-W | `receipt\|REF-W\|oracles:layout\|plain\|criterion#1\|maxMm` | 0.77 | 0.36 | 0.1 position-mm | 0.77 -> 0.36 |
| oracles:layout REF-W | `receipt\|REF-W\|oracles:layout\|plain\|criterion#1\|p95Mm` | 0.68 | 0.29 | 0.1 position-mm | 0.68 -> 0.29 |
| corpus TXT-A | `text-stress-ptbr\|TXT-A1\|corpus\|\|criterion#1\|tokens` | 46 | 69 | 0 count | 46 -> 69 |
| corpus TXT-P | `text-stress-ptbr\|TXT-P1\|corpus\|\|criterion#1\|pageDelta` | 1 | 0 | 0 page-delta | 1 -> 0 |
| corpus TXT-R | `text-stress-ptbr\|TXT-R1\|corpus\|\|criterion#1\|worstMm` | 0.38 | 0.01 | 0.1 position-mm | 0.38 -> 0.01 |
| oracles:text EXT-2 | `text-stress-ptbr\|EXT-2\|oracles:text\|plain\|criterion#1\|extra.pdftotext` | 9 | 0 | 0 count | 9 -> 0 |
| oracles:text EXT-2 | `text-stress-ptbr\|EXT-2\|oracles:text\|plain\|criterion#1\|extra.pdfminer.six` | 9 | 0 | 0 count | 9 -> 0 |
| oracles:text EXT-2 | `text-stress-ptbr\|EXT-2\|oracles:text\|plain\|criterion#1\|extra.pymupdf` | 9 | 0 | 0 count | 9 -> 0 |
| oracles:text EXT-2 | `text-stress-ptbr\|EXT-2\|oracles:text\|plain\|criterion#1\|statusRank.pymupdf` | 2 | 3 | 0 count | 2 -> 3 |
| oracles:layout REF-P | `text-stress-ptbr\|REF-P\|oracles:layout\|plain\|criterion#1\|pageDelta` | 1 | 0 | 0 page-delta | 1 -> 0 |
| oracles:layout REF-W | `text-stress-ptbr\|REF-W\|oracles:layout\|plain\|criterion#1\|maxMm` | 97.79 | 0.48 | 0.1 position-mm | 97.79 -> 0.48 |
| oracles:layout REF-W | `text-stress-ptbr\|REF-W\|oracles:layout\|plain\|criterion#1\|p95Mm` | 97.02 | 0.38 | 0.1 position-mm | 97.02 -> 0.38 |
| pdf-probe | `pdf-probe\|boleto\|p1\|99990.00001#1\|dy` | -1.01 | 0 | 1 pdf-probe-pt | "99990.00001" \|dy\| 1.01 -> 0 pt |
| pdf-probe | `pdf-probe\|boleto\|p1\|23456.700001#1\|dy` | -1.01 | 0 | 1 pdf-probe-pt | "23456.700001" \|dy\| 1.01 -> 0 pt |
| pdf-probe | `pdf-probe\|boleto\|p1\|00000.000420#1\|dy` | -1.01 | 0 | 1 pdf-probe-pt | "00000.000420" \|dy\| 1.01 -> 0 pt |
| pdf-probe | `pdf-probe\|boleto\|p1\|1#1\|dy` | -1.01 | 0 | 1 pdf-probe-pt | "1" \|dy\| 1.01 -> 0 pt |
| pdf-probe | `pdf-probe\|boleto\|p1\|99990000012345#1\|dy` | -1.01 | 0 | 1 pdf-probe-pt | "99990000012345" \|dy\| 1.01 -> 0 pt |
| pdf-probe | `pdf-probe\|boleto\|p1\|BENEFICIÁRIO#1\|dx` | 1.44 | 0.34 | 1 pdf-probe-pt | "BENEFICIÁRIO" \|dx\| 1.44 -> 0.34 pt |
| pdf-probe | `pdf-probe\|boleto\|p1\|BENEFICIÁRIO#1\|dy` | -1.9 | 0 | 1 pdf-probe-pt | "BENEFICIÁRIO" \|dy\| 1.9 -> 0 pt |
| pdf-probe | `pdf-probe\|boleto\|p1\|AGÊNCIA#1\|dy` | -1.9 | 0 | 1 pdf-probe-pt | "AGÊNCIA" \|dy\| 1.9 -> 0 pt |
| pdf-probe | `pdf-probe\|boleto\|p1\|/#1\|dy` | -1.9 | 0 | 1 pdf-probe-pt | "/" \|dy\| 1.9 -> 0 pt |
| pdf-probe | `pdf-probe\|boleto\|p1\|CÓDIGO#1\|dy` | -1.9 | 0 | 1 pdf-probe-pt | "CÓDIGO" \|dy\| 1.9 -> 0 pt |
| pdf-probe | `pdf-probe\|boleto\|p1\|DO#2\|dy` | -1.9 | 0 | 1 pdf-probe-pt | "DO" \|dy\| 1.9 -> 0 pt |
| pdf-probe | `pdf-probe\|boleto\|p1\|BENEFICIÁRIO#2\|dy` | -1.9 | 0 | 1 pdf-probe-pt | "BENEFICIÁRIO" \|dy\| 1.9 -> 0 pt |
| pdf-probe | `pdf-probe\|boleto\|p1\|Acme#1\|dx` | 1.44 | 0.34 | 1 pdf-probe-pt | "Acme" \|dx\| 1.44 -> 0.34 pt |
| pdf-probe | `pdf-probe\|boleto\|p1\|Acme#1\|dy` | -1.9 | 0 | 1 pdf-probe-pt | "Acme" \|dy\| 1.9 -> 0 pt |
| pdf-probe | `pdf-probe\|boleto\|p1\|Widgets#1\|dx` | 1.44 | 0.34 | 1 pdf-probe-pt | "Widgets" \|dx\| 1.44 -> 0.34 pt |
| pdf-probe | `pdf-probe\|boleto\|p1\|Widgets#1\|dy` | -1.9 | 0 | 1 pdf-probe-pt | "Widgets" \|dy\| 1.9 -> 0 pt |
| pdf-probe | `pdf-probe\|boleto\|p1\|Comércio#1\|dx` | 1.44 | 0.34 | 1 pdf-probe-pt | "Comércio" \|dx\| 1.44 -> 0.34 pt |
| pdf-probe | `pdf-probe\|boleto\|p1\|Comércio#1\|dy` | -1.9 | 0 | 1 pdf-probe-pt | "Comércio" \|dy\| 1.9 -> 0 pt |
| pdf-probe | `pdf-probe\|boleto\|p1\|LTDA#1\|dx` | 1.44 | 0.34 | 1 pdf-probe-pt | "LTDA" \|dx\| 1.44 -> 0.34 pt |
| pdf-probe | `pdf-probe\|boleto\|p1\|LTDA#1\|dy` | -1.9 | 0 | 1 pdf-probe-pt | "LTDA" \|dy\| 1.9 -> 0 pt |
| pdf-probe | `pdf-probe\|boleto\|p1\|0042#1\|dy` | -1.9 | 0 | 1 pdf-probe-pt | "0042" \|dy\| 1.9 -> 0 pt |
| pdf-probe | `pdf-probe\|boleto\|p1\|/#2\|dy` | -1.9 | 0 | 1 pdf-probe-pt | "/" \|dy\| 1.9 -> 0 pt |
| pdf-probe | `pdf-probe\|boleto\|p1\|00012345-6#1\|dy` | -1.9 | 0 | 1 pdf-probe-pt | "00012345-6" \|dy\| 1.9 -> 0 pt |
| pdf-probe | `pdf-probe\|boleto\|p1\|NOSSO#1\|dx` | 1.44 | 0.34 | 1 pdf-probe-pt | "NOSSO" \|dx\| 1.44 -> 0.34 pt |
| pdf-probe | `pdf-probe\|boleto\|p1\|NÚMERO#1\|dx` | 1.48 | 0.38 | 1 pdf-probe-pt | "NÚMERO" \|dx\| 1.48 -> 0.38 pt |
| pdf-probe | `pdf-probe\|boleto\|p1\|00000000000123456-7#1\|dx` | 1.44 | 0.34 | 1 pdf-probe-pt | "00000000000123456-7" \|dx\| 1.44 -> 0.34 pt |
| pdf-probe | `pdf-probe\|boleto\|p1\|Corte#1\|dy` | 1.1 | 0 | 1 pdf-probe-pt | "Corte" \|dy\| 1.1 -> 0 pt |
| pdf-probe | `pdf-probe\|boleto\|p1\|na#1\|dy` | 1.1 | 0 | 1 pdf-probe-pt | "na" \|dy\| 1.1 -> 0 pt |
| pdf-probe | `pdf-probe\|boleto\|p1\|linha#1\|dy` | 1.1 | 0 | 1 pdf-probe-pt | "linha" \|dy\| 1.1 -> 0 pt |
| pdf-probe | `pdf-probe\|boleto\|p1\|pontilhada#1\|dy` | 1.1 | 0 | 1 pdf-probe-pt | "pontilhada" \|dy\| 1.1 -> 0 pt |
| pdf-probe | `pdf-probe\|boleto\|p1\|—#1\|dy` | 1.1 | 0 | 1 pdf-probe-pt | "—" \|dy\| 1.1 -> 0 pt |
| pdf-probe | `pdf-probe\|boleto\|p1\|Ficha#1\|dy` | 1.1 | 0 | 1 pdf-probe-pt | "Ficha" \|dy\| 1.1 -> 0 pt |
| pdf-probe | `pdf-probe\|boleto\|p1\|de#1\|dy` | 1.1 | 0 | 1 pdf-probe-pt | "de" \|dy\| 1.1 -> 0 pt |
| pdf-probe | `pdf-probe\|boleto\|p1\|Compensação#1\|dy` | 1.1 | 0 | 1 pdf-probe-pt | "Compensação" \|dy\| 1.1 -> 0 pt |
| pdf-probe | `pdf-probe\|boleto\|p1\|99990.00001#2\|dy` | 2.74 | 0 | 1 pdf-probe-pt | "99990.00001" \|dy\| 2.74 -> 0 pt |
| pdf-probe | `pdf-probe\|boleto\|p1\|23456.700001#2\|dy` | 2.74 | 0 | 1 pdf-probe-pt | "23456.700001" \|dy\| 2.74 -> 0 pt |
| pdf-probe | `pdf-probe\|boleto\|p1\|00000.000420#2\|dy` | 2.74 | 0 | 1 pdf-probe-pt | "00000.000420" \|dy\| 2.74 -> 0 pt |
| pdf-probe | `pdf-probe\|boleto\|p1\|1#2\|dy` | 2.74 | 0 | 1 pdf-probe-pt | "1" \|dy\| 2.74 -> 0 pt |
| pdf-probe | `pdf-probe\|boleto\|p1\|99990000012345#2\|dy` | 2.74 | 0 | 1 pdf-probe-pt | "99990000012345" \|dy\| 2.74 -> 0 pt |
| pdf-probe | `pdf-probe\|boleto\|p1\|LOCAL#1\|dx` | 1.44 | 0.34 | 1 pdf-probe-pt | "LOCAL" \|dx\| 1.44 -> 0.34 pt |
| pdf-probe | `pdf-probe\|boleto\|p1\|LOCAL#1\|dy` | 1.85 | 0 | 1 pdf-probe-pt | "LOCAL" \|dy\| 1.85 -> 0 pt |
| pdf-probe | `pdf-probe\|boleto\|p1\|DE#1\|dx` | 1.47 | 0.37 | 1 pdf-probe-pt | "DE" \|dx\| 1.47 -> 0.37 pt |
| pdf-probe | `pdf-probe\|boleto\|p1\|DE#1\|dy` | 1.85 | 0 | 1 pdf-probe-pt | "DE" \|dy\| 1.85 -> 0 pt |
| pdf-probe | `pdf-probe\|boleto\|p1\|PAGAMENTO#1\|dx` | 1.49 | 0.39 | 1 pdf-probe-pt | "PAGAMENTO" \|dx\| 1.49 -> 0.39 pt |
| pdf-probe | `pdf-probe\|boleto\|p1\|PAGAMENTO#1\|dy` | 1.85 | 0 | 1 pdf-probe-pt | "PAGAMENTO" \|dy\| 1.85 -> 0 pt |
| pdf-probe | `pdf-probe\|boleto\|p1\|VENCIMENTO#2\|dy` | 1.85 | 0 | 1 pdf-probe-pt | "VENCIMENTO" \|dy\| 1.85 -> 0 pt |
| pdf-probe | `pdf-probe\|boleto\|p1\|Pagável#1\|dx` | 1.44 | 0.34 | 1 pdf-probe-pt | "Pagável" \|dx\| 1.44 -> 0.34 pt |
| pdf-probe | `pdf-probe\|boleto\|p1\|Pagável#1\|dy` | 1.1 | 0 | 1 pdf-probe-pt | "Pagável" \|dy\| 1.1 -> 0 pt |
| pdf-probe | `pdf-probe\|boleto\|p1\|em#1\|dx` | 1.44 | 0.34 | 1 pdf-probe-pt | "em" \|dx\| 1.44 -> 0.34 pt |
| pdf-probe | `pdf-probe\|boleto\|p1\|em#1\|dy` | 1.1 | 0 | 1 pdf-probe-pt | "em" \|dy\| 1.1 -> 0 pt |
| … | 2430 more in gate-report.json | | | | |

WPT/crashtest improvements: 507 (listed in gate-report.json).

## Worse within tolerance (1573; not gating, counted; the head ratchet sums them)

| group | key | before | after | tolerance | detail |
|---|---|---|---|---|---|
| pdf-probe | `pdf-probe\|boleto\|p1\|999-9#1\|dx` | -0.86 | 0.29 | 1 pdf-probe-pt | "999-9" dx -0.86 -> 0.29 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto\|p1\|AGÊNCIA#1\|dx` | -1.23 | 0.18 | 1 pdf-probe-pt | "AGÊNCIA" dx -1.23 -> 0.18 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto\|p1\|/#1\|dx` | -1.19 | 0.23 | 1 pdf-probe-pt | "/" dx -1.19 -> 0.23 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto\|p1\|CÓDIGO#1\|dx` | -1.18 | 0.24 | 1 pdf-probe-pt | "CÓDIGO" dx -1.18 -> 0.24 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto\|p1\|DO#2\|dx` | -1.14 | 0.28 | 1 pdf-probe-pt | "DO" dx -1.14 -> 0.28 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto\|p1\|BENEFICIÁRIO#2\|dx` | -1.12 | 0.29 | 1 pdf-probe-pt | "BENEFICIÁRIO" dx -1.12 -> 0.29 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto\|p1\|VALOR#1\|dx` | -1.17 | 0.24 | 1 pdf-probe-pt | "VALOR" dx -1.17 -> 0.24 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto\|p1\|DO#3\|dx` | -1.14 | 0.27 | 1 pdf-probe-pt | "DO" dx -1.14 -> 0.27 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto\|p1\|DOCUMENTO#1\|dx` | -1.12 | 0.29 | 1 pdf-probe-pt | "DOCUMENTO" dx -1.12 -> 0.29 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto\|p1\|Corte#1\|dx` | -0.36 | 0.03 | 1 pdf-probe-pt | "Corte" dx -0.36 -> 0.03 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto\|p1\|na#1\|dx` | -0.37 | 0.03 | 1 pdf-probe-pt | "na" dx -0.37 -> 0.03 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto\|p1\|linha#1\|dx` | -0.37 | 0.03 | 1 pdf-probe-pt | "linha" dx -0.37 -> 0.03 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto\|p1\|pontilhada#1\|dx` | -0.38 | 0.02 | 1 pdf-probe-pt | "pontilhada" dx -0.38 -> 0.02 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto\|p1\|999-9#2\|dx` | -0.86 | 0.29 | 1 pdf-probe-pt | "999-9" dx -0.86 -> 0.29 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto\|p1\|999-9#2\|dy` | 2.13 | -0.75 | 1 pdf-probe-pt | "999-9" dy 2.13 -> -0.75 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto\|p1\|VENCIMENTO#2\|dx` | -1.06 | 0.29 | 1 pdf-probe-pt | "VENCIMENTO" dx -1.06 -> 0.29 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto\|p1\|AGÊNCIA#2\|dx` | -1.1 | 0.25 | 1 pdf-probe-pt | "AGÊNCIA" dx -1.1 -> 0.25 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto\|p1\|/#3\|dx` | -1.06 | 0.29 | 1 pdf-probe-pt | "/" dx -1.06 -> 0.29 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto\|p1\|CÓDIGO#2\|dx` | -1.05 | 0.3 | 1 pdf-probe-pt | "CÓDIGO" dx -1.05 -> 0.3 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto\|p1\|DO#4\|dx` | -1.01 | 0.34 | 1 pdf-probe-pt | "DO" dx -1.01 -> 0.34 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto\|p1\|BENEFICIÁRIO#4\|dx` | -1.06 | 0.29 | 1 pdf-probe-pt | "BENEFICIÁRIO" dx -1.06 -> 0.29 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto\|p1\|NOSSO#2\|dx` | -1.07 | 0.28 | 1 pdf-probe-pt | "NOSSO" dx -1.07 -> 0.28 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto\|p1\|NÚMERO#3\|dx` | -1.04 | 0.31 | 1 pdf-probe-pt | "NÚMERO" dx -1.04 -> 0.31 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto\|p1\|(=)#1\|dx` | -1.12 | 0.23 | 1 pdf-probe-pt | "(=)" dx -1.12 -> 0.23 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto\|p1\|VALOR#2\|dx` | -1.11 | 0.25 | 1 pdf-probe-pt | "VALOR" dx -1.11 -> 0.25 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto\|p1\|DO#7\|dx` | -1.07 | 0.28 | 1 pdf-probe-pt | "DO" dx -1.07 -> 0.28 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto\|p1\|DOCUMENTO#4\|dx` | -1.06 | 0.3 | 1 pdf-probe-pt | "DOCUMENTO" dx -1.06 -> 0.3 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto\|p1\|(-)#1\|dx` | -1.13 | 0.22 | 1 pdf-probe-pt | "(-)" dx -1.13 -> 0.22 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto\|p1\|DESCONTO#1\|dx` | -1.12 | 0.23 | 1 pdf-probe-pt | "DESCONTO" dx -1.12 -> 0.23 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto\|p1\|/#5\|dx` | -1.07 | 0.28 | 1 pdf-probe-pt | "/" dx -1.07 -> 0.28 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto\|p1\|ABATIMENTO#1\|dx` | -1.06 | 0.29 | 1 pdf-probe-pt | "ABATIMENTO" dx -1.06 -> 0.29 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto\|p1\|•#2\|dy` | 7.1 | -0.75 | 1 pdf-probe-pt | "•" dy 7.1 -> -0.75 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto\|p1\|Após#1\|dy` | 7.1 | -0.75 | 1 pdf-probe-pt | "Após" dy 7.1 -> -0.75 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto\|p1\|o#2\|dy` | 7.1 | -0.75 | 1 pdf-probe-pt | "o" dy 7.1 -> -0.75 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto\|p1\|vencimento,#1\|dy` | 7.1 | -0.75 | 1 pdf-probe-pt | "vencimento," dy 7.1 -> -0.75 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto\|p1\|cobrar#1\|dy` | 7.1 | -0.75 | 1 pdf-probe-pt | "cobrar" dy 7.1 -> -0.75 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto\|p1\|multa#1\|dy` | 7.1 | -0.75 | 1 pdf-probe-pt | "multa" dy 7.1 -> -0.75 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto\|p1\|de#3\|dy` | 7.1 | -0.75 | 1 pdf-probe-pt | "de" dy 7.1 -> -0.75 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto\|p1\|2%#1\|dy` | 7.1 | -0.75 | 1 pdf-probe-pt | "2%" dy 7.1 -> -0.75 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto\|p1\|e#1\|dy` | 7.1 | -0.75 | 1 pdf-probe-pt | "e" dy 7.1 -> -0.75 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto\|p1\|mora#1\|dy` | 7.1 | -0.75 | 1 pdf-probe-pt | "mora" dy 7.1 -> -0.75 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto\|p1\|de#4\|dy` | 7.1 | -0.75 | 1 pdf-probe-pt | "de" dy 7.1 -> -0.75 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto\|p1\|1%#1\|dy` | 7.1 | -0.75 | 1 pdf-probe-pt | "1%" dy 7.1 -> -0.75 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto\|p1\|ao#1\|dy` | 7.1 | -0.75 | 1 pdf-probe-pt | "ao" dy 7.1 -> -0.75 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto\|p1\|mês.#1\|dy` | 7.1 | -0.75 | 1 pdf-probe-pt | "mês." dy 7.1 -> -0.75 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto\|p1\|(-)#2\|dx` | -1.1 | 0.25 | 1 pdf-probe-pt | "(-)" dx -1.1 -> 0.25 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto\|p1\|OUTRAS#1\|dx` | -1.09 | 0.26 | 1 pdf-probe-pt | "OUTRAS" dx -1.09 -> 0.26 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto\|p1\|DEDUÇÕES#1\|dx` | -1.05 | 0.3 | 1 pdf-probe-pt | "DEDUÇÕES" dx -1.05 -> 0.3 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto\|p1\|•#3\|dy` | 7.1 | -0.75 | 1 pdf-probe-pt | "•" dy 7.1 -> -0.75 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto\|p1\|Em#1\|dy` | 7.1 | -0.75 | 1 pdf-probe-pt | "Em" dy 7.1 -> -0.75 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto\|p1\|caso#1\|dy` | 7.1 | -0.75 | 1 pdf-probe-pt | "caso" dy 7.1 -> -0.75 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto\|p1\|de#5\|dy` | 7.1 | -0.75 | 1 pdf-probe-pt | "de" dy 7.1 -> -0.75 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto\|p1\|dúvida#1\|dy` | 7.1 | -0.75 | 1 pdf-probe-pt | "dúvida" dy 7.1 -> -0.75 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto\|p1\|sobre#1\|dy` | 7.1 | -0.75 | 1 pdf-probe-pt | "sobre" dy 7.1 -> -0.75 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto\|p1\|este#1\|dy` | 7.1 | -0.75 | 1 pdf-probe-pt | "este" dy 7.1 -> -0.75 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto\|p1\|documento#1\|dy` | 7.1 | -0.75 | 1 pdf-probe-pt | "documento" dy 7.1 -> -0.75 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto\|p1\|de#6\|dy` | 7.1 | -0.75 | 1 pdf-probe-pt | "de" dy 7.1 -> -0.75 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto\|p1\|teste,#1\|dy` | 7.1 | -0.75 | 1 pdf-probe-pt | "teste," dy 7.1 -> -0.75 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto\|p1\|contate#1\|dy` | 7.1 | -0.75 | 1 pdf-probe-pt | "contate" dy 7.1 -> -0.75 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto\|p1\|o#3\|dy` | 7.1 | -0.75 | 1 pdf-probe-pt | "o" dy 7.1 -> -0.75 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto\|p1\|emissor#1\|dy` | 7.1 | -0.75 | 1 pdf-probe-pt | "emissor" dy 7.1 -> -0.75 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto\|p1\|fictício.#1\|dy` | 7.1 | -0.75 | 1 pdf-probe-pt | "fictício." dy 7.1 -> -0.75 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto\|p1\|(+)#1\|dx` | -1.08 | 0.28 | 1 pdf-probe-pt | "(+)" dx -1.08 -> 0.28 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto\|p1\|MORA#1\|dx` | -1.06 | 0.29 | 1 pdf-probe-pt | "MORA" dx -1.06 -> 0.29 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto\|p1\|/#6\|dx` | -1.03 | 0.32 | 1 pdf-probe-pt | "/" dx -1.03 -> 0.32 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto\|p1\|MULTA#1\|dx` | -1.02 | 0.33 | 1 pdf-probe-pt | "MULTA" dx -1.02 -> 0.33 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto\|p1\|(=)#2\|dx` | -1.1 | 0.25 | 1 pdf-probe-pt | "(=)" dx -1.1 -> 0.25 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto\|p1\|VALOR#3\|dx` | -1.09 | 0.26 | 1 pdf-probe-pt | "VALOR" dx -1.09 -> 0.26 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto\|p1\|COBRADO#1\|dx` | -1.05 | 0.3 | 1 pdf-probe-pt | "COBRADO" dx -1.05 -> 0.3 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto\|p1\|VALOR#4\|dx` | -1.1 | 0.31 | 1 pdf-probe-pt | "VALOR" dx -1.1 -> 0.31 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto\|p1\|Assinatura#1\|dx` | -0.06 | 0.34 | 1 pdf-probe-pt | "Assinatura" dx -0.06 -> 0.34 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto\|p1\|plano#1\|dx` | -0.07 | 0.33 | 1 pdf-probe-pt | "plano" dx -0.07 -> 0.33 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto\|p1\|Widget#1\|dx` | -0.08 | 0.32 | 1 pdf-probe-pt | "Widget" dx -0.08 -> 0.32 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto\|p1\|Pro#1\|dx` | -0.08 | 0.31 | 1 pdf-probe-pt | "Pro" dx -0.08 -> 0.31 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto\|p1\|R$#9\|dx` | -0.06 | 0.34 | 1 pdf-probe-pt | "R$" dx -0.06 -> 0.34 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto\|p1\|1.499,00#1\|dx` | -0.06 | 0.34 | 1 pdf-probe-pt | "1.499,00" dx -0.06 -> 0.34 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto\|p1\|Usuários#1\|dx` | -0.06 | 0.34 | 1 pdf-probe-pt | "Usuários" dx -0.06 -> 0.34 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto\|p1\|adicionais#1\|dx` | -0.07 | 0.33 | 1 pdf-probe-pt | "adicionais" dx -0.07 -> 0.33 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto\|p1\|(3x)#1\|dx` | -0.08 | 0.31 | 1 pdf-probe-pt | "(3x)" dx -0.08 -> 0.31 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto\|p1\|R$#10\|dx` | -0.06 | 0.34 | 1 pdf-probe-pt | "R$" dx -0.06 -> 0.34 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto\|p1\|297,00#1\|dx` | -0.06 | 0.34 | 1 pdf-probe-pt | "297,00" dx -0.06 -> 0.34 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto\|p1\|Taxa#1\|dx` | -0.06 | 0.34 | 1 pdf-probe-pt | "Taxa" dx -0.06 -> 0.34 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto\|p1\|de#8\|dx` | -0.06 | 0.34 | 1 pdf-probe-pt | "de" dx -0.06 -> 0.34 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto\|p1\|processamento#1\|dx` | -0.06 | 0.33 | 1 pdf-probe-pt | "processamento" dx -0.06 -> 0.33 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto\|p1\|R$#11\|dx` | -0.06 | 0.34 | 1 pdf-probe-pt | "R$" dx -0.06 -> 0.34 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto\|p1\|46,50#1\|dx` | -0.06 | 0.34 | 1 pdf-probe-pt | "46,50" dx -0.06 -> 0.34 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto\|p1\|XXXX-TESTE.#1\|dx` | -0.01 | 0.01 | 1 pdf-probe-pt | "XXXX-TESTE." dx -0.01 -> 0.01 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|Recibo#1\|dx` | -0.82 | 0.01 | 1 pdf-probe-pt | "Recibo" dx -0.82 -> 0.01 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|do#1\|dx` | -0.82 | 0.01 | 1 pdf-probe-pt | "do" dx -0.82 -> 0.01 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|Pagador#1\|dx` | -0.82 | 0.01 | 1 pdf-probe-pt | "Pagador" dx -0.82 -> 0.01 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|10492.46810#1\|dy` | -0.25 | 0.75 | 1 pdf-probe-pt | "10492.46810" dy -0.25 -> 0.75 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|31000.100045#1\|dy` | -0.25 | 0.75 | 1 pdf-probe-pt | "31000.100045" dy -0.25 -> 0.75 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|00041.700139#1\|dy` | -0.25 | 0.75 | 1 pdf-probe-pt | "00041.700139" dy -0.25 -> 0.75 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|7#1\|dy` | -0.25 | 0.75 | 1 pdf-probe-pt | "7" dy -0.25 -> 0.75 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|16460000184250#1\|dy` | -0.25 | 0.75 | 1 pdf-probe-pt | "16460000184250" dy -0.25 -> 0.75 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|BANCO#1\|dx` | 0.1 | 0.18 | 1 pdf-probe-pt | "BANCO" \|dx\| 0.1 -> 0.18 pt (worse, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|EXEMPLO#1\|dx` | 0.1 | 0.18 | 1 pdf-probe-pt | "EXEMPLO" \|dx\| 0.1 -> 0.18 pt (worse, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|Nr.#1\|dx` | 1.32 | -0.11 | 1 pdf-probe-pt | "Nr." dx 1.32 -> -0.11 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|do#6\|dx` | 1.32 | -0.11 | 1 pdf-probe-pt | "do" dx 1.32 -> -0.11 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|documento#2\|dx` | 1.32 | -0.11 | 1 pdf-probe-pt | "documento" dx 1.32 -> -0.11 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|NF-2026/00417#1\|dx` | 1.32 | -0.11 | 1 pdf-probe-pt | "NF-2026/00417" dx 1.32 -> -0.11 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|CPF/CNPJ#2\|dx` | 3.45 | -0.22 | 1 pdf-probe-pt | "CPF/CNPJ" dx 3.45 -> -0.22 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|do#8\|dx` | 3.45 | -0.22 | 1 pdf-probe-pt | "do" dx 3.45 -> -0.22 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|Pagador#3\|dx` | 3.45 | -0.22 | 1 pdf-probe-pt | "Pagador" dx 3.45 -> -0.22 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|123.456.789-09#1\|dx` | 3.45 | -0.22 | 1 pdf-probe-pt | "123.456.789-09" dx 3.45 -> -0.22 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|Espécie#1\|dx` | 1.32 | -0.11 | 1 pdf-probe-pt | "Espécie" dx 1.32 -> -0.11 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|R$#1\|dx` | 1.32 | -0.11 | 1 pdf-probe-pt | "R$" dx 1.32 -> -0.11 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|Referência#1\|dx` | 0.1 | 0.18 | 1 pdf-probe-pt | "Referência" \|dx\| 0.1 -> 0.18 pt (worse, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|Valor#3\|dx` | 0.3 | -0.36 | 1 pdf-probe-pt | "Valor" dx 0.3 -> -0.36 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|(R$)#1\|dx` | 0.3 | -0.36 | 1 pdf-probe-pt | "(R$)" dx 0.3 -> -0.36 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|10/2026#1\|dx` | 0.1 | 0.18 | 1 pdf-probe-pt | "10/2026" \|dx\| 0.1 -> 0.18 pt (worse, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|10/2026#1\|dy` | 3.67 | -0.75 | 1 pdf-probe-pt | "10/2026" dy 3.67 -> -0.75 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|Revisão#1\|dy` | 3.67 | -0.75 | 1 pdf-probe-pt | "Revisão" dy 3.67 -> -0.75 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|programada#1\|dy` | 3.67 | -0.75 | 1 pdf-probe-pt | "programada" dy 3.67 -> -0.75 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|—#4\|dy` | 3.67 | -0.75 | 1 pdf-probe-pt | "—" dy 3.67 -> -0.75 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|mão#1\|dy` | 3.67 | -0.75 | 1 pdf-probe-pt | "mão" dy 3.67 -> -0.75 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|de#2\|dy` | 3.67 | -0.75 | 1 pdf-probe-pt | "de" dy 3.67 -> -0.75 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|obra#1\|dx` | -0.07 | 0.01 | 1 pdf-probe-pt | "obra" dx -0.07 -> 0.01 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|obra#1\|dy` | 3.67 | -0.75 | 1 pdf-probe-pt | "obra" dy 3.67 -> -0.75 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|980,00#1\|dx` | 0.27 | -0.38 | 1 pdf-probe-pt | "980,00" dx 0.27 -> -0.38 pt (crossed Chrome, within 1 pt) |
| … | 1453 more in gate-report.json | | | | |

## newly-measured (1272)

| group | key | before | after | tolerance | detail |
|---|---|---|---|---|---|
| corpus BOL-G | `boleto-febraban\|BOL-G4\|corpus\|\|criterion#1\|excess` |  | 0 | 0.05 geometry-excess-mm | was ficha_relative_mm.barcode_centre_above_ficha_bottom not measurable (no dashed cut line detected) |
| corpus BOL-G | `boleto-febraban\|BOL-G6\|corpus\|\|criterion#1\|excess` |  | 0 | 0.05 geometry-excess-mm | was ficha_relative_mm.ficha_top not measurable (no dashed cut line detected) |
| corpus BOL-G | `boleto-febraban.px-grid\|BOL-G4\|corpus\|\|criterion#1\|excess` |  | 0 | 0.05 geometry-excess-mm | was ficha_relative_mm.barcode_centre_above_ficha_bottom not measurable (no dashed cut line detected) |
| corpus BOL-G | `boleto-febraban.px-grid\|BOL-G6\|corpus\|\|criterion#1\|excess` |  | 0 | 0.05 geometry-excess-mm | was ficha_relative_mm.ficha_top not measurable (no dashed cut line detected) |
| corpus DANFE-R | `danfe\|DANFE-R1\|corpus\|\|criterion#1\|worstMm` |  | 0.27 | 0.1 position-mm | was DANFE-A4 not found in vellora |
| pdf-probe | `pdf-probe\|danfe\|p1\|INFORMAÇÕES#1\|pairing` | unpaired | dx -0.01 dy 0.76 |  | Chrome's "INFORMAÇÕES" (page 1) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|danfe\|p1\|COMPLEMENTARES#1\|pairing` | unpaired | dx 0.04 dy 0.76 |  | Chrome's "COMPLEMENTARES" (page 1) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|danfe\|p1\|RESERVADO#1\|pairing` | unpaired | dx 0.04 dy 0.76 |  | Chrome's "RESERVADO" (page 1) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|danfe\|p1\|AO#2\|pairing` | unpaired | dx 0.07 dy 0.76 |  | Chrome's "AO" (page 1) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|danfe\|p1\|FISCO#1\|pairing` | unpaired | dx 0.08 dy 0.76 |  | Chrome's "FISCO" (page 1) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|danfe\|p1\|SEM#1\|pairing` | unpaired | dx -0.01 dy 0.77 |  | Chrome's "SEM" (page 1) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|danfe\|p1\|VALOR#15\|pairing` | unpaired | dx 0 dy 0.77 |  | Chrome's "VALOR" (page 1) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|danfe\|p1\|FISCAL#3\|pairing` | unpaired | dx 0.02 dy 0.77 |  | Chrome's "FISCAL" (page 1) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|danfe\|p1\|—#12\|pairing` | unpaired | dx 0.04 dy 0.77 |  | Chrome's "—" (page 1) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|danfe\|p1\|NF-e#3\|pairing` | unpaired | dx 0.05 dy 0.77 |  | Chrome's "NF-e" (page 1) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|danfe\|p1\|emitida#1\|pairing` | unpaired | dx 0.06 dy 0.77 |  | Chrome's "emitida" (page 1) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|danfe\|p1\|em#2\|pairing` | unpaired | dx 0.09 dy 0.77 |  | Chrome's "em" (page 1) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|danfe\|p1\|ambiente#1\|pairing` | unpaired | dx 0.1 dy 0.77 |  | Chrome's "ambiente" (page 1) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|danfe\|p1\|de#8\|pairing` | unpaired | dx 0.13 dy 0.77 |  | Chrome's "de" (page 1) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|danfe\|p1\|homologação#1\|pairing` | unpaired | dx 0.13 dy 0.77 |  | Chrome's "homologação" (page 1) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|danfe\|p1\|(fixture#1\|pairing` | unpaired | dx 0.17 dy 0.77 |  | Chrome's "(fixture" (page 1) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|danfe\|p1\|sintética#1\|pairing` | unpaired | dx 0.19 dy 0.77 |  | Chrome's "sintética" (page 1) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|danfe\|p1\|do#1\|pairing` | unpaired | dx 0.22 dy 0.77 |  | Chrome's "do" (page 1) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|danfe\|p1\|vellora,#1\|pairing` | unpaired | dx 0.23 dy 0.77 |  | Chrome's "vellora," (page 1) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|danfe\|p1\|fidelity/corpus).#1\|pairing` | unpaired | dx 0.25 dy 0.77 |  | Chrome's "fidelity/corpus)." (page 1) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|danfe\|p1\|Pedido#1\|pairing` | unpaired | dx -0.01 dy 0.78 |  | Chrome's "Pedido" (page 1) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|danfe\|p1\|de#9\|pairing` | unpaired | dx 0.01 dy 0.78 |  | Chrome's "de" (page 1) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|danfe\|p1\|compra#1\|pairing` | unpaired | dx 0.02 dy 0.78 |  | Chrome's "compra" (page 1) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|danfe\|p1\|nº#1\|pairing` | unpaired | dx 0.04 dy 0.78 |  | Chrome's "nº" (page 1) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|danfe\|p1\|PC-2026-0815.#1\|pairing` | unpaired | dx 0.05 dy 0.78 |  | Chrome's "PC-2026-0815." (page 1) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|danfe\|p1\|Entrega#1\|pairing` | unpaired | dx 0.08 dy 0.78 |  | Chrome's "Entrega" (page 1) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|danfe\|p1\|no#3\|pairing` | unpaired | dx 0.11 dy 0.78 |  | Chrome's "no" (page 1) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|danfe\|p1\|horário#1\|pairing` | unpaired | dx 0.11 dy 0.78 |  | Chrome's "horário" (page 1) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|danfe\|p1\|comercial.#1\|pairing` | unpaired | dx 0.13 dy 0.78 |  | Chrome's "comercial." (page 1) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|danfe\|p1\|Valor#1\|pairing` | unpaired | dx -0.01 dy 0.79 |  | Chrome's "Valor" (page 1) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|danfe\|p1\|aproximado#1\|pairing` | unpaired | dx 0.01 dy 0.79 |  | Chrome's "aproximado" (page 1) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|danfe\|p1\|dos#2\|pairing` | unpaired | dx 0.04 dy 0.79 |  | Chrome's "dos" (page 1) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|danfe\|p1\|tributos:#1\|pairing` | unpaired | dx 0.05 dy 0.79 |  | Chrome's "tributos:" (page 1) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|danfe\|p1\|R$#4\|pairing` | unpaired | dx 0.07 dy 0.79 |  | Chrome's "R$" (page 1) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|danfe\|p1\|4.203,37#1\|pairing` | unpaired | dx 0.08 dy 0.79 |  | Chrome's "4.203,37" (page 1) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|danfe\|p1\|(Fonte:#1\|pairing` | unpaired | dx 0.1 dy 0.79 |  | Chrome's "(Fonte:" (page 1) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|danfe\|p1\|IBPT)#1\|pairing` | unpaired | dx 0.12 dy 0.79 |  | Chrome's "IBPT)" (page 1) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|danfe\|p1\|—#13\|pairing` | unpaired | dx 0.14 dy 0.79 |  | Chrome's "—" (page 1) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|danfe\|p1\|valor#1\|pairing` | unpaired | dx 0.15 dy 0.79 |  | Chrome's "valor" (page 1) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|danfe\|p1\|fictício.#1\|pairing` | unpaired | dx 0.16 dy 0.79 |  | Chrome's "fictício." (page 1) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p2\|Download#1\|pairing` | unpaired | dx 0.01 dy 0 |  | Chrome's "Download" (page 2) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p2\|as#1\|pairing` | unpaired | dx 0.01 dy 0 |  | Chrome's "as" (page 2) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p2\|PDF#1\|pairing` | unpaired | dx 0.01 dy 0 |  | Chrome's "PDF" (page 2) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p2\|Need#1\|pairing` | unpaired | dx 0.38 dy 0 |  | Chrome's "Need" (page 2) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p2\|a#1\|pairing` | unpaired | dx 0.38 dy 0 |  | Chrome's "a" (page 2) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p2\|printable#1\|pairing` | unpaired | dx 0.38 dy 0 |  | Chrome's "printable" (page 2) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p2\|copy#1\|pairing` | unpaired | dx 0.38 dy 0 |  | Chrome's "copy" (page 2) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p2\|for#1\|pairing` | unpaired | dx 0.38 dy 0 |  | Chrome's "for" (page 2) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p2\|your#1\|pairing` | unpaired | dx 0.38 dy 0 |  | Chrome's "your" (page 2) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p2\|records?#1\|pairing` | unpaired | dx 0.38 dy 0 |  | Chrome's "records?" (page 2) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p2\|You#1\|pairing` | unpaired | dx 0.37 dy 0 |  | Chrome's "You" (page 2) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p2\|can#1\|pairing` | unpaired | dx 0.37 dy 0 |  | Chrome's "can" (page 2) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p2\|download#1\|pairing` | unpaired | dx 0.37 dy 0 |  | Chrome's "download" (page 2) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p2\|a#2\|pairing` | unpaired | dx 0.37 dy 0 |  | Chrome's "a" (page 2) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p2\|PDF#2\|pairing` | unpaired | dx 0.37 dy 0 |  | Chrome's "PDF" (page 2) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p2\|version#1\|pairing` | unpaired | dx 0.37 dy 0 |  | Chrome's "version" (page 2) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p2\|.#1\|pairing` | unpaired | dx 0.36 dy 0 |  | Chrome's "." (page 2) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p2\|Moved#1\|pairing` | unpaired | dx 0.38 dy 0 |  | Chrome's "Moved" (page 2) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p2\|recently?#1\|pairing` | unpaired | dx 0.38 dy 0 |  | Chrome's "recently?" (page 2) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p2\|Have#1\|pairing` | unpaired | dx 0.38 dy 0 |  | Chrome's "Have" (page 2) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p2\|a#3\|pairing` | unpaired | dx 0.38 dy 0 |  | Chrome's "a" (page 2) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p2\|new#1\|pairing` | unpaired | dx 0.38 dy 0 |  | Chrome's "new" (page 2) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p2\|credit#1\|pairing` | unpaired | dx 0.38 dy 0 |  | Chrome's "credit" (page 2) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p2\|card?#1\|pairing` | unpaired | dx 0.38 dy 0 |  | Chrome's "card?" (page 2) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p2\|You#2\|pairing` | unpaired | dx 0.36 dy 0 |  | Chrome's "You" (page 2) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p2\|can#2\|pairing` | unpaired | dx 0.36 dy 0 |  | Chrome's "can" (page 2) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p2\|easily#1\|pairing` | unpaired | dx 0.36 dy 0 |  | Chrome's "easily" (page 2) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p2\|update#1\|pairing` | unpaired | dx 0.37 dy 0 |  | Chrome's "update" (page 2) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p2\|your#2\|pairing` | unpaired | dx 0.37 dy 0 |  | Chrome's "your" (page 2) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p2\|billing#1\|pairing` | unpaired | dx 0.37 dy 0 |  | Chrome's "billing" (page 2) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p2\|information#1\|pairing` | unpaired | dx 0.38 dy 0 |  | Chrome's "information" (page 2) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p2\|.#2\|pairing` | unpaired | dx 0.37 dy 0 |  | Chrome's "." (page 2) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p2\|[Company#1\|pairing` | unpaired | dx 0.39 dy 0 |  | Chrome's "[Company" (page 2) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p2\|Name,#1\|pairing` | unpaired | dx 0.38 dy 0 |  | Chrome's "Name," (page 2) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p2\|LLC]#1\|pairing` | unpaired | dx 0.39 dy 0 |  | Chrome's "LLC]" (page 2) now has a vellora counterpart |
| … | 1192 more in gate-report.json | | | | |

## changed (2)

| group | key | before | after | tolerance | detail |
|---|---|---|---|---|---|
| wpt css/CSS2/box-display | `wpt\|css/CSS2/box-display/root-box-003.xht` | pass-blank | fail |  | pass-blank -> fail |
| wpt css/css-break | `wpt\|css/css-break/overflowed-abs-pos-with-percentage-height-print.html` | fail | pass-blank |  | fail -> pass-blank |

## Head ratchet vs fidelity/baselines/port/00-start (GATE-H1): PASS

Every item worse than the chain head beyond its tolerance gates unless a class-a acceptance of this step (13 counted, 0 legacy/other ignored) or a DEBT.json entry within its ceiling covers it. Counts: debt 5, accepted 6, declared 10, gating 0, improvement 4159, withinTolerance 1163, flaggedPassLost 27.

### debt: covered by DEBT.json (class b, not gating) (5)

| group | key | before | after | tolerance | detail |
|---|---|---|---|---|---|
| wpt css/CSS2/floats | `wpt\|css/CSS2/floats/floats-placement-vertical-003.xht` | pass | fail |  | DEBT-10-wpt-1 (class b, owner blitz:wpt-raw-fail, closes at -): pass -> fail (clean pass lost) — DEBT DEBT-10-wpt-1 |
| wpt css/CSS2/floats | `wpt\|css/CSS2/floats/floats-placement-vertical-004.xht` | pass | fail |  | DEBT-10-wpt-1 (class b, owner blitz:wpt-raw-fail, closes at -): pass -> fail (clean pass lost) — DEBT DEBT-10-wpt-1 |
| wpt css/CSS2/floats | `wpt\|css/CSS2/floats/zero-width-floats.html` | pass | fail |  | DEBT-10-wpt-2 (class b, owner blitz:wpt-raw-fail, closes at -): pass -> fail (clean pass lost) — DEBT DEBT-10-wpt-2 |
| wpt css/CSS2/linebox | `wpt\|css/CSS2/linebox/baseline-block-with-overflow-001.html` | pass | fail |  | DEBT-10-wpt-1 (class b, owner blitz:wpt-raw-fail, closes at -): pass -> fail (clean pass lost) — DEBT DEBT-10-wpt-1 |
| wpt css/css-break | `wpt\|css/css-break/flexbox/flex-fragmented-with-float-descendant-001.html` | pass | fail |  | DEBT-10-wpt-1 (class b, owner blitz:wpt-raw-fail, closes at -): pass -> fail (clean pass lost) — DEBT DEBT-10-wpt-1 |

## Debt ledger (2 entries; transition checked; passes auto_table_compact_columns, table_percent_widths)

no problem

## Gate canaries (32/32 caught; an uncaught one is an absolute failure)

| canary | must report | observed | caught |
|---|---|---|---|
| head ratchet: \|dy\| +0.6 pt per step over two steps | real word boleto p1\|RECIBO#1: vs previous link within-tolerance (listed, not gating); vs head regression; no DEBT entry -> head-regression | previous within-tolerance; head regression; ledger head-regression | true |
| WPT fail -> unsupported (new strict-gate rejection) | real test css/CSS2/abspos/abspos-containing-block-initial-004a.xht: gating rejection; declared with its feature -> declared | undeclared rejection/true; declared declared/false | true |
| verdict row -> strict gate rejected | real row invoice PDF-Q1 oracles:qpdf: gating rejection with its feature | rejection:canary:planted-rejection | true |
| verdict row measured -> NOT-RUN | real row invoice PDF-Q1 oracles:qpdf: gating regression | regression | true |
| WPT flagged pass lost | real flagged pass css/CSS2/backgrounds/background-applies-to-015.xht: reported, not gating, counts.flaggedPassLost 1 | reported/false; flaggedPassLost 1; verdict PASS | true |
| DEBT rules i/ii: uncovered, within ceiling, beyond ceiling | no entry -> head-regression (gates); ceiling = value -> debt (not gating); ceiling below value -> debt-exceeded (gates) | head-regression/true; debt/false; debt-exceeded/true | true |
| DEBT rule v: compensator pass deleted | entry names a pass absent from the run's passes (auto_table_compact_columns, table_percent_widths) -> debt-regate (gates) | debt-regate/true | true |
| DEBT rule iii: ceiling raised, entry added, entry dropped early | each transition reports a problem; removal at closesAt (control) reports none | raised 2, grown 4, dropped 1, closed-at-closesAt 0 | true |
| DEBT rule iii: a still-failing key removed | a key whose head item still gates, removed as fixed or at its closesAt -> problem (never removed, only its ceiling lowered) | as fixed 1, at closesAt 1 | true |
| DEBT rule iii: a fixed key removed with evidence | closed[] fixed: true + runId + headComparison and no gating head item -> none; without runId, without headComparison, or without the run's head comparison -> problem | with evidence 0; no runId 1, no headComparison 1, no head comparison 1 | true |
| DEBT rule iii: an id reused | an id the base has naming another key -> problem; an id the base closed -> problem; a closed key back in the ledger -> problem; closed[] losing a base record -> problem; a fresh id (control) -> no id problem | fresh 0; reused 1, closed id 1, re-entered 1, history 1 | true |
| DEBT rule iv: vellora-owned entry without a retirement step | a problem naming closesAt | CANARY-1: owner vellora:pagination is vellora's: closesAt must name a retirement step (NN-name) | true |
| DEBT rule vi: displaced words not collapsed | two entries on one page-count criterion -> problem; a per-word entry inside a page scope -> problem; a page-1 word next to a scope from page 2 (control) -> none | twice 2, per-word 1, control 0 | true |
| relaxed (b): \|run\| > \|N0\|, unnamed compensator, no owner | each reports a problem; a valid entry (control) reports none | good 0, worse 2, unnamed 1, no owner 1 | true |
| layer-vector: word mapping misaligned by three fragments | position check share within 3 px: control >= 0.95, misaligned < 0.5 (a shift by one fragment reads 0.55 on this fixture: neighbouring lines share x; the check catches shifts of two or more) | control 1, misaligned 0.233 | true |
| layer-vector: planted +3 px pass step | the planted pass (table_percent_widths) appears as a non-zero vellora step of the word; the unplanted word (control) has none | planted [table_percent_widths, run], control [] | true |
| pdf-probe: a word crosses Chrome (I1) | real word boleto p1\|RECIBO#1: dy 0.35 -> -1.15 pt regression (gates); 0.9 -> -0.9 within-tolerance, withinToleranceBetter 0; control 3 -> 1.5 improvement | through regression/true; flip within-tolerance, better 0; control improvement | true |
| DEBT rule iii without --debt-base (I2) | base = DEBT.json at the merge base; a raised ceiling -> problem; no merge-base -> refusal; no ledger there -> first population | problems 2; no merge-base refused; absent first population | true |
| GATE-D7: new ledger key tied to the measured value (I3) | real word boleto p1\|RECIBO#1: ceiling 99 -> problem; layerVector.run != measured -> problem; measured != the run's value -> problem; exact entry (control) -> none | exact 0; ceiling 99 1; vector 1; measured 1 | true |
| declared rejection carried to the head comparison (I4) | real test css/CSS2/abspos/abspos-containing-block-initial-004a.xht rejected and declared at link 01: vs head 00 at link 02 -> declared; a declaration outside (head, current] (control) -> rejection | carried declared/false; control rejection/true | true |
| EXT-2 missing-token set: one token swapped for another | real row invoice EXT-2 pdftotext: [CanaryA, CanaryB] -> [CanaryA, CanaryC] (same count) -> CanaryC gates; unchanged list (control) -> nothing | swapped [CanaryC]; control 0 | true |
| pdf-probe: a word moved below the page (off-page) | real word boleto p1\|RECIBO#1 section: an unpaired vellora word drawn at y 900 pt (outside the page) -> pdf-probe\|boleto\|off-page\|CanaryOff gates; the same off-page word on both sides (control) -> nothing | moved regression/true; control 0 | true |
| WPT pass -> fail route (GATE-A3) | real clean pass css/CSS2/abspos/between-float-and-text.html -> fail: raw Blitz fails the same way -> b; raw passes -> c; no raw outcome -> c; old page count != Chrome's -> a; a DEBT key with the run's rawOutcome passes GATE-D7, one with another does not | routes {"b":"b","c1":"c","c2":"c","a":"a"}; D7 ok 0, D7 wrong rawOutcome 1 | true |
| DEBT rule vi': listed page scope on an unchanged page metric (rule i, 2026-10-27) | page delta 1 (= head): listed p2 word -> debt; page-1 word -> head-regression; page delta 1 -> 2 -> metric and word debt-exceeded; page delta 0 -> listed word head-regression; D7: exact entry none, head 1 / run 2 a problem, ceiling 2 a problem; ledger shape none | p2 debt/false; p1 head-regression/true; 1->2 word debt-exceeded/true metric debt-exceeded/true; 0 head-regression/true; D7 ok 0, moved 3, slack 1; shape 0 | true |
| DEBT rule vi': a listed page scope binds no moved page metric and no page-1 word | page metric a head item (1 -> 2) entered with measured = ceiling = 2 -> a problem; fromPage 1 listing the page-1 word -> a ledger problem; exact entry -> none | moved metric 1; fromPage 1 1; exact D7 0, shape 0 | true |
| rule (ii): shared run tolerance on a DANFE-L1 position-mm vector | DANFE-L1d as measured (P -> run +0.626 px) -> none; +0.6 px layout step unnamed -> problem; named -> problem (\|P\| > \|N0\| + 0.5); +1.5 px P -> run with run named -> problem (\|run\| > \|N0\| + 1.333) | control 0; layout unnamed 2, named 1; P->run +1.5 1 | true |
| DOC-1 median word distance worse than the published engine | real row invoice: +0.01 mm (= tolerance) passes; +0.02 mm gates under --main; +1 mm without --main is listed, not gating | at tolerance gating []; over [doc-aggregate\|invoice\|medianMm]; no --main listed true gating false | true |
| DOC-1 share of words within 1 mm below the published engine | real row invoice: -0.1 pp passes; -0.2 pp gates under --main | at tolerance gating []; over [doc-aggregate\|invoice\|within1mmPct] | true |
| DOC-1 one more missing word than the published engine | real row invoice: missingWords +1 gates under --main | gating [doc-aggregate\|invoice\|missingWords] | true |
| DOC-3 a fixture (or the whole aggregate) absent from the run | real row invoice: the fixture removed gates; no run aggregate refuses under --main | removed gating [doc-aggregate\|invoice]; no aggregate REFUSED | true |
| DOC-2 the pin scored on another input, Chrome geometry or above its noise | real row invoice: native.html sha changed, Chrome geometry sha changed, pin noise 2x the median tolerance: each REFUSED under --main | html REFUSED; geometry REFUSED; noise REFUSED | true |
| DOC-4 page count differs from Chrome's (contract condition 3) | real row invoice: pages = Chrome + 1 is reported (not gating) under --main, gating under --contract | --main listed true gating false condition3 FAIL; --contract gating [doc-aggregate\|invoice\|pages] | true |

## Pin view vs fidelity/baselines/pin (GATE-H3): merge to main BLOCKED (gating: --main)

(a) accepted artefacts 5, (b) ledger debt 4, (c) neither 5, declared rejections 10.

| group | key | before | after | tolerance | detail |
|---|---|---|---|---|---|
| wpt css/css-break | `wpt\|css/css-break/flexbox/multi-line-column-flex-fragmentation-054.html` | pass | fail |  | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): pass -> fail (clean pass lost) |
| wpt css/css-break | `wpt\|css/css-break/flexbox/multi-line-column-flex-fragmentation-055.html` | pass | fail |  | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): pass -> fail (clean pass lost) |
| wpt css/css-break | `wpt\|css/css-break/flexbox/multi-line-column-flex-fragmentation-058.html` | pass | fail |  | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): pass -> fail (clean pass lost) |
| wpt css/css-break | `wpt\|css/css-break/ruby-003.html` | pass | fail |  | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): pass -> fail (clean pass lost) |
| wpt css/css-text | `wpt\|css/css-text/hanging-punctuation/hanging-punctuation-first-002.html` | pass | fail |  | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): pass -> fail (clean pass lost) |

## Document aggregate vs the published engine (DOC-1..DOC-4)

Verdict PASS; contract condition 2 PASS, condition 3 PASS; --main true, --contract true; tolerance median 0.01 mm, <=1 mm share 0.1 pp, missing 0.


| fixture | median mm pin → run | p90 mm pin → run | <=1 mm % pin → run | missing pin → run | pages run / Chrome | worse |
|---|---|---|---|---|---|---|
| invoice | 1.46 → 0.1 | 1.73 → 0.28 | 36 → 100 | 0 → 0 | 3 / 3 | - |
| receipt | 5.18 → 0.05 | 77 → 0.11 | 7.9 → 100 | 0 → 0 | 2 / 2 | - |
| boleto | 1.77 → 0.12 | 14.09 → 0.2 | 32 → 100 | 0 → 0 | 1 / 1 | - |
| notification | 0.41 → 0.01 | 1.02 → 0.09 | 86.7 → 100 | 4 → 0 | 1 / 1 | - |
| boleto-febraban | 80.7 → 0.08 | 82.32 → 0.28 | 15.6 → 100 | 8 → 0 | 1 / 1 | - |
| danfe | 17.68 → 0.21 | 37.17 → 0.27 | 8.9 → 100 | 1 → 0 | 1 / 1 | - |
| text-stress-ptbr | 106.22 → 0.02 | 221.05 → 0.27 | 1.4 → 100 | 7 → 0 | 7 / 7 | - |
| oss-sparksuite-invoice | 9.87 → 0 | 10.95 → 0 | 0 → 100 | 0 → 0 | 1 / 1 | - |
| oss-postmark-receipt | 0.66 → 0.13 | 18.19 → 0.14 | 40 → 97.2 | 39 → 2 | 2 / 2 | - |

## WPT per directory (pass / clean pass)

| directory | pass before | pass after | clean before | clean after |
|---|---|---|---|---|
| css/CSS2/abspos | 2 | 4 | 2 | 4 |
| css/CSS2/backgrounds | 175 | 176 | 67 | 69 |
| css/CSS2/borders | 383 | 417 | 354 | 404 |
| css/CSS2/box | 4 | 4 | 0 | 0 |
| css/CSS2/box-display | 66 | 66 | 66 | 66 |
| css/CSS2/colors | 10 | 10 | 10 | 10 |
| css/CSS2/floats | 19 | 61 | 16 | 56 |
| css/CSS2/floats-clear | 38 | 146 | 33 | 132 |
| css/CSS2/fonts | 135 | 135 | 135 | 135 |
| css/CSS2/generated-content | 82 | 86 | 78 | 83 |
| css/CSS2/linebox | 150 | 157 | 148 | 154 |
| css/CSS2/lists | 67 | 67 | 40 | 40 |
| css/CSS2/margin-padding-clear | 527 | 645 | 510 | 626 |
| css/CSS2/normal-flow | 443 | 451 | 417 | 427 |
| css/CSS2/pagination | 34 | 36 | 32 | 36 |
| css/CSS2/positioning | 361 | 371 | 359 | 369 |
| css/CSS2/tables | 77 | 103 | 74 | 98 |
| css/CSS2/text | 250 | 257 | 241 | 249 |
| css/CSS2/visudet | 14 | 15 | 9 | 10 |
| css/CSS2/visufx | 2 | 2 | 2 | 2 |
| css/CSS2/visuren | 6 | 8 | 6 | 8 |
| css/css-break | 115 | 115 | 81 | 93 |
| css/css-page | 70 | 87 | 55 | 77 |
| css/css-tables | 47 | 64 | 38 | 59 |
| css/css-text | 632 | 672 | 379 | 416 |

## Per group

| group | classes |
|---|---|
| corpus BOL-G | improvement 4, newly-measured 4 |
| corpus BOL-R | improvement 4 |
| corpus DANFE-L | improvement 5 |
| corpus DANFE-M | improvement 3 |
| corpus DANFE-P | improvement 2 |
| corpus DANFE-R | improvement 1, newly-measured 1 |
| corpus INV-P | improvement 2 |
| corpus INV-R | improvement 1 |
| corpus LET- | improvement 1 |
| corpus TXT-A | improvement 1 |
| corpus TXT-P | improvement 2 |
| corpus TXT-R | improvement 1 |
| oracles:layout LET-1 | improvement 2 |
| oracles:layout REF-P | improvement 6 |
| oracles:layout REF-W | improvement 23 |
| oracles:text EXT-2 | improvement 12 |
| pdf-probe | improvement 2480, within-tolerance 1573, newly-measured 1267 |
| wpt css/CSS2/abspos | improvement 2 |
| wpt css/CSS2/backgrounds | improvement 2, reported 1 |
| wpt css/CSS2/borders | improvement 50, reported 16 |
| wpt css/CSS2/box-display | changed 1 |
| wpt css/CSS2/floats | improvement 44, reported 1 |
| wpt css/CSS2/floats-clear | improvement 108 |
| wpt css/CSS2/generated-content | improvement 5 |
| wpt css/CSS2/linebox | improvement 7 |
| wpt css/CSS2/margin-padding-clear | improvement 118 |
| wpt css/CSS2/normal-flow | improvement 10 |
| wpt css/CSS2/pagination | improvement 4 |
| wpt css/CSS2/positioning | improvement 10 |
| wpt css/CSS2/tables | improvement 26 |
| wpt css/CSS2/text | improvement 8, reported 1 |
| wpt css/CSS2/visudet | improvement 1 |
| wpt css/CSS2/visuren | improvement 2 |
| wpt css/css-break | improvement 15, reported 2, changed 1, accepted 1, pin-c 4 |
| wpt css/css-page | improvement 26, reported 1, accepted 3 |
| wpt css/css-tables | improvement 21, reported 1 |
| wpt css/css-text | improvement 48, reported 4, pin-c 1 |

## Tolerances

| class | tolerance | label | rationale |
|---|---|---|---|
| position-mm | 0.1 mm | DESIGN TARGET | word/anchor position error vs a reference (REF-W max/p95, REF-R worst anchor, DANFE-L1, LET-1). 0.1 mm (0.28 pt, 0.38 CSS px) is 10x the 0.01 mm the values are reported with and below one CSS px (0.26 mm), the smallest step a px-snapping layout can move; the measurement is deterministic for one build and one reference (CONFIRMED: equal inputs gave equal values in the Phase A repeat run). |
| geometry-excess-mm | 0.05 mm | DESIGN TARGET | distance OUTSIDE a specification window (BOL-G*, DANFE-B*, DANFE-M1, TXT-A1). Inside the window the spec admits any value, so only the excess is ratcheted; 0.05 mm is about one 600 dpi raster pixel (0.042 mm), the measurement quantum of measure_bars.py / the page ink box. |
| font-excess-pt | 0.05 pt | SPEC-derived tolerance unit | font-size excess outside a window; 0.05 pt is the tolerance ACCEPTANCE.md already applies to every font-size criterion (BOL-T*, DANFE-F*). |
| count | 0 count | DESIGN TARGET | integer counts from deterministic tools (required strings found, extractor missing/extra tokens, segments/glyphs attributed, decoded symbols): any loss is a real change of the document. |
| page-delta | 0 pages | DESIGN TARGET | \|vellora pages - reference pages\|: a page break moving is never noise. |
| pdf-probe-pt | 1 pt | DESIGN TARGET | per-word \|dx\| / \|dy\| of vellora's PDF vs Chrome's PDF (pdf-probe semantics 2: PyMuPDF pen origin and baseline, same-page position pairs keyed by the Chrome word). 1 pt (0.35 mm) is an order of magnitude below the Phase A regressions it must catch (invoice price column +9 pt, notification signature -14 pt) and above the 0.01 pt rounding of the probe and sub-px snapping differences. The per-fixture unpaired-word counts use the count class. |

