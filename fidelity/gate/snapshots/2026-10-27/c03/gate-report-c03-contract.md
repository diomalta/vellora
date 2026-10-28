# Fidelity gate report

**Verdict: FAIL** (88 gating item(s) vs the previous link, 8 vs the chain head fidelity/baselines/port/00-start; 17 flagged WPT pass(es) lost, reported, not gating; 527 value(s) worse within tolerance, listed, not gating; pin view: merge to main BLOCKED, 87 (c) item(s)). Local macOS runs are INDICATIVE.

| field | value |
|---|---|
| date | 2026-10-28T00:58:42.450Z |
| command | `node fidelity/gate/run.mjs --baseline fidelity/baselines/port/10-integration --run fidelity/results/run-all/c03-lu --step 12-layoutunit --accept fidelity/gate/snapshots/2026-10-22/10-spark/accepted.json --doc-aggregate fidelity/results/run-all/c03-lu/doc-aggregate/summary.json --contract --out fidelity/results/c03-regate/contract` |
| baseline | fidelity/baselines/port/10-integration (vellora-fidelity/baseline/2) |
| run | fidelity/results/run-all/c03-lu (vellora-fidelity/run-all/1) |
| os / cpu | darwin 27.0.0 arm64 (macOS 27.0.1) / Apple M5 Pro |
| node / rustc | v22.23.2 / rustc 1.96.0 (ac68faa20 2026-05-25) |
| chrome | Google Chrome for Testing 155.0.8059.85 |
| blitz | 0.3.0-beta.4 registry+https://github.com/rust-lang/crates.io-index |
| git | phasec/03-layoutunit 8a7c6867737b91fcf1f7d3d847d32f50688a8c82 (0 dirty) |

Counts: improvement 2362, newly-measured 1123, reported 17, within-tolerance 527, contract-pages 1, pin-c 87, gating 88, headGating 8, debt 11, flaggedPassLost 17, unchanged 10851, withinTolerance 527, withinToleranceBetter 2108, missingTokensNotComparable 0, pinA 0, pinB 11, pinC 87, docRegressions 0, contractPagesFailing 1.

## Absolute failures of the run (gate, cannot be accepted)

none

## Regressions beyond tolerance (gate)

| group | key | before | after | tolerance | detail |
|---|---|---|---|---|---|
| doc-aggregate | `doc-aggregate\|oss-postmark-receipt\|pages` | 2 | 1 |  | DOC-4 (contract condition 3, REF-P) oss-postmark-receipt: 1 pages vs Chrome's 2 |
| pdf-probe | `pin\|pdf-probe\|danfe\|p1\|no#2\|dx` | -4.76 | 1.09 | 1 pdf-probe-pt | worse than the shipped main (pin) and neither an artefact nor ledger debt: worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "no" dx -4.76 -> 1.09 pt: moved 5.85 pt (> 1) and ends 1.09 pt from Chrome (> 1) (I1) |
| pdf-probe | `pin\|pdf-probe\|danfe\|p1\|21.773,40#3\|dx` | -7.36 | 1.2 | 1 pdf-probe-pt | worse than the shipped main (pin) and neither an artefact nor ledger debt: worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "21.773,40" dx -7.36 -> 1.2 pt: moved 8.56 pt (> 1) and ends 1.2 pt from Chrome (> 1) (I1) |
| pdf-probe | `pin\|pdf-probe\|invoice\|p1\|QTD.#1\|dx` | 1.21 | 4.52 | 1 pdf-probe-pt | worse than the shipped main (pin) and neither an artefact nor ledger debt: worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "QTD." \|dx\| 1.21 -> 4.52 pt vs Chrome (baseline) |
| pdf-probe | `pin\|pdf-probe\|invoice\|p1\|40#1\|dx` | 1.2 | 4.51 | 1 pdf-probe-pt | worse than the shipped main (pin) and neither an artefact nor ledger debt: worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "40" \|dx\| 1.2 -> 4.51 pt vs Chrome (baseline) |
| pdf-probe | `pin\|pdf-probe\|invoice\|p1\|25#1\|dx` | 1.2 | 4.51 | 1 pdf-probe-pt | worse than the shipped main (pin) and neither an artefact nor ledger debt: worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "25" \|dx\| 1.2 -> 4.51 pt vs Chrome (baseline) |
| pdf-probe | `pin\|pdf-probe\|invoice\|p1\|18#1\|dx` | 1.2 | 4.51 | 1 pdf-probe-pt | worse than the shipped main (pin) and neither an artefact nor ledger debt: worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "18" \|dx\| 1.2 -> 4.51 pt vs Chrome (baseline) |
| pdf-probe | `pin\|pdf-probe\|invoice\|p1\|60#1\|dx` | 1.2 | 4.51 | 1 pdf-probe-pt | worse than the shipped main (pin) and neither an artefact nor ledger debt: worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "60" \|dx\| 1.2 -> 4.51 pt vs Chrome (baseline) |
| pdf-probe | `pin\|pdf-probe\|invoice\|p1\|120#1\|dx` | 1.2 | 4.52 | 1 pdf-probe-pt | worse than the shipped main (pin) and neither an artefact nor ledger debt: worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "120" \|dx\| 1.2 -> 4.52 pt vs Chrome (baseline) |
| pdf-probe | `pin\|pdf-probe\|invoice\|p1\|30#1\|dx` | 1.2 | 4.51 | 1 pdf-probe-pt | worse than the shipped main (pin) and neither an artefact nor ledger debt: worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "30" \|dx\| 1.2 -> 4.51 pt vs Chrome (baseline) |
| pdf-probe | `pin\|pdf-probe\|invoice\|p1\|22#1\|dx` | 1.2 | 4.51 | 1 pdf-probe-pt | worse than the shipped main (pin) and neither an artefact nor ledger debt: worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "22" \|dx\| 1.2 -> 4.51 pt vs Chrome (baseline) |
| pdf-probe | `pin\|pdf-probe\|invoice\|p1\|44#1\|dx` | 1.2 | 4.51 | 1 pdf-probe-pt | worse than the shipped main (pin) and neither an artefact nor ledger debt: worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "44" \|dx\| 1.2 -> 4.51 pt vs Chrome (baseline) |
| pdf-probe | `pin\|pdf-probe\|invoice\|p1\|12#2\|dx` | 1.2 | 4.51 | 1 pdf-probe-pt | worse than the shipped main (pin) and neither an artefact nor ledger debt: worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "12" \|dx\| 1.2 -> 4.51 pt vs Chrome (baseline) |
| pdf-probe | `pin\|pdf-probe\|invoice\|p1\|24#1\|dx` | 1.2 | 4.51 | 1 pdf-probe-pt | worse than the shipped main (pin) and neither an artefact nor ledger debt: worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "24" \|dx\| 1.2 -> 4.51 pt vs Chrome (baseline) |
| pdf-probe | `pin\|pdf-probe\|invoice\|p1\|8#1\|dx` | 1.21 | 4.52 | 1 pdf-probe-pt | worse than the shipped main (pin) and neither an artefact nor ledger debt: worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "8" \|dx\| 1.21 -> 4.52 pt vs Chrome (baseline) |
| pdf-probe | `pin\|pdf-probe\|invoice\|p2\|QTD.#1\|dx` | 1.21 | 4.52 | 1 pdf-probe-pt | worse than the shipped main (pin) and neither an artefact nor ledger debt: worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "QTD." \|dx\| 1.21 -> 4.52 pt vs Chrome (baseline) |
| pdf-probe | `pin\|pdf-probe\|invoice\|p2\|10#1\|dx` | 1.2 | 4.51 | 1 pdf-probe-pt | worse than the shipped main (pin) and neither an artefact nor ledger debt: worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "10" \|dx\| 1.2 -> 4.51 pt vs Chrome (baseline) |
| pdf-probe | `pin\|pdf-probe\|invoice\|p2\|6#1\|dx` | 1.21 | 4.52 | 1 pdf-probe-pt | worse than the shipped main (pin) and neither an artefact nor ledger debt: worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "6" \|dx\| 1.21 -> 4.52 pt vs Chrome (baseline) |
| pdf-probe | `pin\|pdf-probe\|invoice\|p2\|30#1\|dx` | 1.2 | 4.51 | 1 pdf-probe-pt | worse than the shipped main (pin) and neither an artefact nor ledger debt: worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "30" \|dx\| 1.2 -> 4.51 pt vs Chrome (baseline) |
| pdf-probe | `pin\|pdf-probe\|invoice\|p2\|14#1\|dx` | 1.2 | 4.51 | 1 pdf-probe-pt | worse than the shipped main (pin) and neither an artefact nor ledger debt: worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "14" \|dx\| 1.2 -> 4.51 pt vs Chrome (baseline) |
| pdf-probe | `pin\|pdf-probe\|invoice\|p2\|20#1\|dx` | 1.2 | 4.51 | 1 pdf-probe-pt | worse than the shipped main (pin) and neither an artefact nor ledger debt: worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "20" \|dx\| 1.2 -> 4.51 pt vs Chrome (baseline) |
| pdf-probe | `pin\|pdf-probe\|invoice\|p2\|5#1\|dx` | 1.21 | 4.52 | 1 pdf-probe-pt | worse than the shipped main (pin) and neither an artefact nor ledger debt: worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "5" \|dx\| 1.21 -> 4.52 pt vs Chrome (baseline) |
| pdf-probe | `pin\|pdf-probe\|invoice\|p2\|35#1\|dx` | 1.2 | 4.51 | 1 pdf-probe-pt | worse than the shipped main (pin) and neither an artefact nor ledger debt: worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "35" \|dx\| 1.2 -> 4.51 pt vs Chrome (baseline) |
| pdf-probe | `pin\|pdf-probe\|invoice\|p2\|50#1\|dx` | 1.2 | 4.51 | 1 pdf-probe-pt | worse than the shipped main (pin) and neither an artefact nor ledger debt: worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "50" \|dx\| 1.2 -> 4.51 pt vs Chrome (baseline) |
| pdf-probe | `pin\|pdf-probe\|invoice\|p2\|28#1\|dx` | 1.2 | 4.51 | 1 pdf-probe-pt | worse than the shipped main (pin) and neither an artefact nor ledger debt: worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "28" \|dx\| 1.2 -> 4.51 pt vs Chrome (baseline) |
| pdf-probe | `pin\|pdf-probe\|invoice\|p2\|56#1\|dx` | 1.2 | 4.51 | 1 pdf-probe-pt | worse than the shipped main (pin) and neither an artefact nor ledger debt: worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "56" \|dx\| 1.2 -> 4.51 pt vs Chrome (baseline) |
| pdf-probe | `pin\|pdf-probe\|invoice\|p2\|16#1\|dx` | 1.2 | 4.51 | 1 pdf-probe-pt | worse than the shipped main (pin) and neither an artefact nor ledger debt: worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "16" \|dx\| 1.2 -> 4.51 pt vs Chrome (baseline) |
| pdf-probe | `pin\|pdf-probe\|invoice\|p2\|64#1\|dx` | 1.2 | 4.51 | 1 pdf-probe-pt | worse than the shipped main (pin) and neither an artefact nor ledger debt: worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "64" \|dx\| 1.2 -> 4.51 pt vs Chrome (baseline) |
| pdf-probe | `pin\|pdf-probe\|invoice\|p2\|18#1\|dx` | 1.2 | 4.51 | 1 pdf-probe-pt | worse than the shipped main (pin) and neither an artefact nor ledger debt: worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "18" \|dx\| 1.2 -> 4.51 pt vs Chrome (baseline) |
| pdf-probe | `pin\|pdf-probe\|invoice\|p2\|22#1\|dx` | 1.2 | 4.51 | 1 pdf-probe-pt | worse than the shipped main (pin) and neither an artefact nor ledger debt: worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "22" \|dx\| 1.2 -> 4.51 pt vs Chrome (baseline) |
| pdf-probe | `pin\|pdf-probe\|invoice\|p2\|22#2\|dx` | 1.2 | 4.51 | 1 pdf-probe-pt | worse than the shipped main (pin) and neither an artefact nor ledger debt: worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "22" \|dx\| 1.2 -> 4.51 pt vs Chrome (baseline) |
| pdf-probe | `pin\|pdf-probe\|invoice\|p2\|15#1\|dx` | 1.2 | 4.51 | 1 pdf-probe-pt | worse than the shipped main (pin) and neither an artefact nor ledger debt: worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "15" \|dx\| 1.2 -> 4.51 pt vs Chrome (baseline) |
| pdf-probe | `pin\|pdf-probe\|invoice\|p2\|40#1\|dx` | 1.2 | 4.51 | 1 pdf-probe-pt | worse than the shipped main (pin) and neither an artefact nor ledger debt: worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "40" \|dx\| 1.2 -> 4.51 pt vs Chrome (baseline) |
| pdf-probe | `pin\|pdf-probe\|invoice\|p2\|8#1\|dx` | 1.21 | 4.52 | 1 pdf-probe-pt | worse than the shipped main (pin) and neither an artefact nor ledger debt: worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "8" \|dx\| 1.21 -> 4.52 pt vs Chrome (baseline) |
| pdf-probe | `pin\|pdf-probe\|invoice\|p3\|QTD.#1\|dx` | 1.21 | 4.52 | 1 pdf-probe-pt | worse than the shipped main (pin) and neither an artefact nor ledger debt: worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "QTD." \|dx\| 1.21 -> 4.52 pt vs Chrome (baseline) |
| pdf-probe | `pin\|pdf-probe\|invoice\|p3\|30#1\|dx` | 1.2 | 4.51 | 1 pdf-probe-pt | worse than the shipped main (pin) and neither an artefact nor ledger debt: worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "30" \|dx\| 1.2 -> 4.51 pt vs Chrome (baseline) |
| pdf-probe | `pin\|pdf-probe\|invoice\|p3\|12#1\|dx` | 1.2 | 4.51 | 1 pdf-probe-pt | worse than the shipped main (pin) and neither an artefact nor ledger debt: worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "12" \|dx\| 1.2 -> 4.51 pt vs Chrome (baseline) |
| pdf-probe | `pin\|pdf-probe\|invoice\|p3\|5#1\|dx` | 1.21 | 4.52 | 1 pdf-probe-pt | worse than the shipped main (pin) and neither an artefact nor ledger debt: worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "5" \|dx\| 1.21 -> 4.52 pt vs Chrome (baseline) |
| pdf-probe | `pin\|pdf-probe\|invoice\|p3\|1#1\|dx` | 1.21 | 4.52 | 1 pdf-probe-pt | worse than the shipped main (pin) and neither an artefact nor ledger debt: worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "1" \|dx\| 1.21 -> 4.52 pt vs Chrome (baseline) |
| pdf-probe | `pin\|pdf-probe\|invoice\|p3\|2#1\|dx` | 1.21 | 4.52 | 1 pdf-probe-pt | worse than the shipped main (pin) and neither an artefact nor ledger debt: worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "2" \|dx\| 1.21 -> 4.52 pt vs Chrome (baseline) |
| pdf-probe | `pin\|pdf-probe\|oss-sparksuite-invoice\|p1\|Invoice#1\|dx` | -0.23 | -1.73 | 1 pdf-probe-pt | worse than the shipped main (pin) and neither an artefact nor ledger debt: worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "Invoice" \|dx\| 0.23 -> 1.73 pt vs Chrome (baseline) |
| pdf-probe | `pin\|pdf-probe\|oss-sparksuite-invoice\|p1\|#:#1\|dx` | -0.23 | -1.73 | 1 pdf-probe-pt | worse than the shipped main (pin) and neither an artefact nor ledger debt: worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "#:" \|dx\| 0.23 -> 1.73 pt vs Chrome (baseline) |
| pdf-probe | `pin\|pdf-probe\|oss-sparksuite-invoice\|p1\|123#1\|dx` | -0.23 | -1.73 | 1 pdf-probe-pt | worse than the shipped main (pin) and neither an artefact nor ledger debt: worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "123" \|dx\| 0.23 -> 1.73 pt vs Chrome (baseline) |
| pdf-probe | `pin\|pdf-probe\|oss-sparksuite-invoice\|p1\|Created:#1\|dx` | -0.23 | -1.73 | 1 pdf-probe-pt | worse than the shipped main (pin) and neither an artefact nor ledger debt: worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "Created:" \|dx\| 0.23 -> 1.73 pt vs Chrome (baseline) |
| pdf-probe | `pin\|pdf-probe\|oss-sparksuite-invoice\|p1\|January#1\|dx` | -0.23 | -1.73 | 1 pdf-probe-pt | worse than the shipped main (pin) and neither an artefact nor ledger debt: worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "January" \|dx\| 0.23 -> 1.73 pt vs Chrome (baseline) |
| pdf-probe | `pin\|pdf-probe\|oss-sparksuite-invoice\|p1\|1,#1\|dx` | -0.23 | -1.73 | 1 pdf-probe-pt | worse than the shipped main (pin) and neither an artefact nor ledger debt: worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "1," \|dx\| 0.23 -> 1.73 pt vs Chrome (baseline) |
| pdf-probe | `pin\|pdf-probe\|oss-sparksuite-invoice\|p1\|2023#1\|dx` | -0.23 | -1.73 | 1 pdf-probe-pt | worse than the shipped main (pin) and neither an artefact nor ledger debt: worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "2023" \|dx\| 0.23 -> 1.73 pt vs Chrome (baseline) |
| pdf-probe | `pin\|pdf-probe\|oss-sparksuite-invoice\|p1\|Due:#1\|dx` | -0.23 | -1.73 | 1 pdf-probe-pt | worse than the shipped main (pin) and neither an artefact nor ledger debt: worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "Due:" \|dx\| 0.23 -> 1.73 pt vs Chrome (baseline) |
| pdf-probe | `pin\|pdf-probe\|oss-sparksuite-invoice\|p1\|February#1\|dx` | -0.23 | -1.73 | 1 pdf-probe-pt | worse than the shipped main (pin) and neither an artefact nor ledger debt: worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "February" \|dx\| 0.23 -> 1.73 pt vs Chrome (baseline) |
| pdf-probe | `pin\|pdf-probe\|oss-sparksuite-invoice\|p1\|1,#2\|dx` | -0.23 | -1.73 | 1 pdf-probe-pt | worse than the shipped main (pin) and neither an artefact nor ledger debt: worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "1," \|dx\| 0.23 -> 1.73 pt vs Chrome (baseline) |
| pdf-probe | `pin\|pdf-probe\|oss-sparksuite-invoice\|p1\|2023#2\|dx` | -0.23 | -1.73 | 1 pdf-probe-pt | worse than the shipped main (pin) and neither an artefact nor ledger debt: worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "2023" \|dx\| 0.23 -> 1.73 pt vs Chrome (baseline) |
| pdf-probe | `pin\|pdf-probe\|oss-sparksuite-invoice\|p1\|Acme#1\|dx` | -0.23 | -1.73 | 1 pdf-probe-pt | worse than the shipped main (pin) and neither an artefact nor ledger debt: worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "Acme" \|dx\| 0.23 -> 1.73 pt vs Chrome (baseline) |
| pdf-probe | `pin\|pdf-probe\|oss-sparksuite-invoice\|p1\|Corp.#1\|dx` | -0.23 | -1.73 | 1 pdf-probe-pt | worse than the shipped main (pin) and neither an artefact nor ledger debt: worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "Corp." \|dx\| 0.23 -> 1.73 pt vs Chrome (baseline) |
| pdf-probe | `pin\|pdf-probe\|oss-sparksuite-invoice\|p1\|John#1\|dx` | -0.22 | -1.72 | 1 pdf-probe-pt | worse than the shipped main (pin) and neither an artefact nor ledger debt: worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "John" \|dx\| 0.22 -> 1.72 pt vs Chrome (baseline) |
| pdf-probe | `pin\|pdf-probe\|oss-sparksuite-invoice\|p1\|Doe#1\|dx` | -0.22 | -1.72 | 1 pdf-probe-pt | worse than the shipped main (pin) and neither an artefact nor ledger debt: worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "Doe" \|dx\| 0.22 -> 1.72 pt vs Chrome (baseline) |
| pdf-probe | `pin\|pdf-probe\|oss-sparksuite-invoice\|p1\|john@example.com#1\|dx` | -0.23 | -1.73 | 1 pdf-probe-pt | worse than the shipped main (pin) and neither an artefact nor ledger debt: worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "john@example.com" \|dx\| 0.23 -> 1.73 pt vs Chrome (baseline) |

### WPT / crashtest regressions (32)

| group | key | before | after | tolerance | detail |
|---|---|---|---|---|---|
| wpt css/CSS2/abspos | `pin\|wpt\|css/CSS2/abspos/between-float-and-text.html` | pass | fail |  | worse than the shipped main (pin) and neither an artefact nor ledger debt: worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): pass -> fail (clean pass lost) |
| wpt css/CSS2/floats-clear | `pin\|wpt\|css/CSS2/floats-clear/clear-applies-to-009.xht` | pass | fail |  | worse than the shipped main (pin) and neither an artefact nor ledger debt: worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): pass -> fail (clean pass lost) |
| wpt css/CSS2/floats-clear | `pin\|wpt\|css/CSS2/floats-clear/clear-float-005.xht` | pass | fail |  | worse than the shipped main (pin) and neither an artefact nor ledger debt: worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): pass -> fail (clean pass lost) |
| wpt css/CSS2/floats-clear | `pin\|wpt\|css/CSS2/floats-clear/floats-153.xht` | pass | fail |  | worse than the shipped main (pin) and neither an artefact nor ledger debt: worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): pass -> fail (clean pass lost) |
| wpt css/CSS2/floats | `pin\|wpt\|css/CSS2/floats/float-in-inline-anonymous-block-with-overflow-hidden.html` | pass | fail |  | worse than the shipped main (pin) and neither an artefact nor ledger debt: worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): pass -> fail (clean pass lost) |
| wpt css/CSS2/floats | `pin\|wpt\|css/CSS2/floats/float-nowrap-2.html` | pass | fail |  | worse than the shipped main (pin) and neither an artefact nor ledger debt: worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): pass -> fail (clean pass lost) |
| wpt css/CSS2/floats | `pin\|wpt\|css/CSS2/floats/float-nowrap-8.html` | pass | fail |  | worse than the shipped main (pin) and neither an artefact nor ledger debt: worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): pass -> fail (clean pass lost) |
| wpt css/CSS2/floats | `pin\|wpt\|css/CSS2/floats/floats-placement-vertical-001a.xht` | pass | fail |  | worse than the shipped main (pin) and neither an artefact nor ledger debt: worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): pass -> fail (clean pass lost) |
| wpt css/CSS2/floats | `pin\|wpt\|css/CSS2/floats/floats-placement-vertical-003.xht` | pass | fail |  | worse than the shipped main (pin) and neither an artefact nor ledger debt: worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): pass -> fail (clean pass lost) |
| wpt css/CSS2/floats | `pin\|wpt\|css/CSS2/floats/zero-width-floats.html` | pass | fail |  | worse than the shipped main (pin) and neither an artefact nor ledger debt: worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): pass -> fail (clean pass lost) |
| wpt css/CSS2/generated-content | `pin\|wpt\|css/CSS2/generated-content/after-content-display-012.xht` | pass | fail |  | worse than the shipped main (pin) and neither an artefact nor ledger debt: worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): pass -> fail (clean pass lost) |
| wpt css/CSS2/generated-content | `pin\|wpt\|css/CSS2/generated-content/after-content-display-013.xht` | pass | fail |  | worse than the shipped main (pin) and neither an artefact nor ledger debt: worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): pass -> fail (clean pass lost) |
| wpt css/CSS2/generated-content | `pin\|wpt\|css/CSS2/generated-content/before-content-display-012.xht` | pass | fail |  | worse than the shipped main (pin) and neither an artefact nor ledger debt: worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): pass -> fail (clean pass lost) |
| wpt css/CSS2/generated-content | `pin\|wpt\|css/CSS2/generated-content/before-content-display-013.xht` | pass | fail |  | worse than the shipped main (pin) and neither an artefact nor ledger debt: worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): pass -> fail (clean pass lost) |
| wpt css/CSS2/linebox | `pin\|wpt\|css/CSS2/linebox/baseline-block-with-overflow-001.html` | pass | fail |  | worse than the shipped main (pin) and neither an artefact nor ledger debt: worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): pass -> fail (clean pass lost) |
| wpt css/CSS2/normal-flow | `pin\|wpt\|css/CSS2/normal-flow/block-in-inline-float-between-001.xht` | pass | fail |  | worse than the shipped main (pin) and neither an artefact nor ledger debt: worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): pass -> fail (clean pass lost) |
| wpt css/CSS2/normal-flow | `pin\|wpt\|css/CSS2/normal-flow/inline-table-zorder-001.xht` | pass | fail |  | worse than the shipped main (pin) and neither an artefact nor ledger debt: worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): pass -> fail (clean pass lost) |
| wpt css/CSS2/visuren | `pin\|wpt\|css/CSS2/visuren/float-inside-inline-between-blocks-1.html` | pass | fail |  | worse than the shipped main (pin) and neither an artefact nor ledger debt: worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): pass -> fail (clean pass lost) |
| wpt css/css-break | `pin\|wpt\|css/css-break/flexbox/flex-fragmented-with-float-descendant-001.html` | pass | fail |  | worse than the shipped main (pin) and neither an artefact nor ledger debt: worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): pass -> fail (clean pass lost) |
| wpt css/css-break | `pin\|wpt\|css/css-break/flexbox/multi-line-column-flex-fragmentation-054.html` | pass | fail |  | worse than the shipped main (pin) and neither an artefact nor ledger debt: worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): pass -> fail (clean pass lost) |
| wpt css/css-break | `pin\|wpt\|css/css-break/flexbox/multi-line-column-flex-fragmentation-055.html` | pass | fail |  | worse than the shipped main (pin) and neither an artefact nor ledger debt: worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): pass -> fail (clean pass lost) |
| wpt css/css-break | `pin\|wpt\|css/css-break/flexbox/multi-line-column-flex-fragmentation-058.html` | pass | fail |  | worse than the shipped main (pin) and neither an artefact nor ledger debt: worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): pass -> fail (clean pass lost) |
| wpt css/css-break | `pin\|wpt\|css/css-break/ruby-003.html` | pass | fail |  | worse than the shipped main (pin) and neither an artefact nor ledger debt: worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): pass -> fail (clean pass lost) |
| wpt css/css-page | `pin\|wpt\|css/css-page/monolithic-overflow-014-print.html` | pass | fail |  | worse than the shipped main (pin) and neither an artefact nor ledger debt: worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): pass -> fail (clean pass lost) |
| wpt css/css-text | `pin\|wpt\|css/css-text/hanging-punctuation/hanging-punctuation-first-002.html` | pass | fail |  | worse than the shipped main (pin) and neither an artefact nor ledger debt: worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): pass -> fail (clean pass lost) |
| wpt css/css-text | `pin\|wpt\|css/css-text/tab-size/tab-size-integer-001.html` | pass | fail |  | worse than the shipped main (pin) and neither an artefact nor ledger debt: worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): pass -> fail (clean pass lost) |
| wpt css/css-text | `pin\|wpt\|css/css-text/tab-size/tab-size-integer-002.html` | pass | fail |  | worse than the shipped main (pin) and neither an artefact nor ledger debt: worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): pass -> fail (clean pass lost) |
| wpt css/css-text | `pin\|wpt\|css/css-text/tab-size/tab-size-integer-003.html` | pass | fail |  | worse than the shipped main (pin) and neither an artefact nor ledger debt: worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): pass -> fail (clean pass lost) |
| wpt css/css-text | `pin\|wpt\|css/css-text/text-align/text-align-end-006.html` | pass | fail |  | worse than the shipped main (pin) and neither an artefact nor ledger debt: worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): pass -> fail (clean pass lost) |
| wpt css/css-text | `pin\|wpt\|css/css-text/text-justify/text-justify-and-trailing-spaces-003.html` | pass | fail |  | worse than the shipped main (pin) and neither an artefact nor ledger debt: worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): pass -> fail (clean pass lost) |
| wpt css/css-text | `pin\|wpt\|css/css-text/text-justify/text-justify-and-trailing-spaces-004.html` | pass | fail |  | worse than the shipped main (pin) and neither an artefact nor ledger debt: worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): pass -> fail (clean pass lost) |
| wpt css/css-text | `pin\|wpt\|css/css-text/white-space/text-wrap-balance-text-indent-001.html` | pass | fail |  | worse than the shipped main (pin) and neither an artefact nor ledger debt: worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): pass -> fail (clean pass lost) |

## Accepted regressions (acceptedRegressions, with evidence)

none

Acceptance entries that matched nothing (stale or mistyped):

- `pdf-probe\|oss-postmark-receipt\|p1\|[Product#2\|pairing`: The OLD pair was an oracle artefact: Chrome's PDF draws the masthead "[Product Name]" twice, the text (#1, #A8AAAF, baseline 57.75 pt) and its `text-shadow: 0 1px 0 white` copy (#2, #FFFFFF, baseline 58.50 pt, 1 px = 0.75 pt lower); vellora draws no text-shadow, so it has one instance. At 09 that instance (baseline 61.35 pt) paired with the white shadow copy #2; at 10-spark the cellspacing/cellpadding hints put it at 57.60 pt and it pairs with the text #1 (dy -0.15 pt, newly measured). No text was lost.
- `pdf-probe\|oss-postmark-receipt\|p1\|Name]#2\|pairing`: Same word as [Product#2: the second half of the masthead "[Product Name]", whose Chrome #2 instance is the white text-shadow copy (baseline 58.50 pt). vellora's single instance now pairs with the text #1 (p1\|Name]#1, dx -0.90 dy -0.15 pt, newly measured).
- `pdf-probe\|oss-postmark-receipt\|unpaired-vellora`: The OLD count 0 was false: at 09 the 3 words "Download as PDF" were drawn below the page (baseline 855.60 pt on an 841.92 pt page), where PyMuPDF's page words do not report them (fidelity/ACCEPTANCE.md GATE-P1, the documented step-08 case). 09's own pdf-probe section lists them in offPage.vellora. At 10-spark they are inside page 1 (baseline 815.85 pt), visible, so they are counted; Chrome prints them on page 2 (the known oversize-block gap: vellora does not fragment the layout table). Off-page vellora words go 40 -> 37 (Download, as, PDF), none added.

## Declared strict-gate rejections (declaredRejections, 0)

none

## Reported, not gating (17)

| group | key | before | after | tolerance | detail |
|---|---|---|---|---|---|
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
| wpt css/css-tables | `wpt\|css/css-tables/out-of-order-elements-collapsed-border.html` | pass | fail |  | pass[ink-missing-vs-chrome] -> fail (flagged pass: reported, not gated) |

## Improvements (2362)

| group | key | before | after | tolerance | detail |
|---|---|---|---|---|---|
| corpus BOL-R | `boleto-febraban\|BOL-R1\|corpus\|\|criterion#1` | FAIL | PASS |  | worst BOL-T3 1.82 mm (tol 1) -> worst BOL-T1 0.28 mm (tol 1) |
| oracles:text EXT-2 | `boleto-febraban\|EXT-2\|oracles:text\|plain\|criterion#1` | WARN | PASS |  | pdftotext pass (missing 0, extra 0); pdfminer.six warn (missing 0, extra 0); pymupdf pass (missing 0, extra 0) -> pdftotext pass (missing 0, extra 0); pdfminer.six pass (missing 0, extra 0); pymupdf pass (missing 0, extra 0) |
| oracles:layout REF-W | `boleto-febraban\|REF-W\|oracles:layout\|plain\|criterion#1` | FAIL | PASS |  | max 2.31 mm, p95 1.95 mm over 315 consensus words (Chrome and WeasyPrint within 2 pt; coverage 1) -> max 0.41 mm, p95 0.36 mm over 315 consensus words (Chrome and WeasyPrint within 2 pt; coverage 1) |
| corpus BOL-R | `boleto-febraban.px-grid\|BOL-R1\|corpus\|\|criterion#1` | FAIL | PASS |  | worst BOL-T3 1.82 mm (tol 1) -> worst BOL-T1 0.28 mm (tol 1) |
| oracles:text EXT-2 | `boleto-febraban.px-grid\|EXT-2\|oracles:text\|plain\|criterion#1` | WARN | PASS |  | pdftotext pass (missing 0, extra 0); pdfminer.six warn (missing 0, extra 0); pymupdf pass (missing 0, extra 0) -> pdftotext pass (missing 0, extra 0); pdfminer.six pass (missing 0, extra 0); pymupdf pass (missing 0, extra 0) |
| oracles:layout REF-W | `boleto-febraban.px-grid\|REF-W\|oracles:layout\|plain\|criterion#1` | FAIL | PASS |  | max 2.31 mm, p95 1.95 mm over 315 consensus words (Chrome and WeasyPrint within 2 pt; coverage 1) -> max 0.41 mm, p95 0.36 mm over 315 consensus words (Chrome and WeasyPrint within 2 pt; coverage 1) |
| oracles:layout REF-W | `boleto\|REF-W\|oracles:layout\|plain\|criterion#1` | FAIL | PASS |  | max 2.62 mm, p95 2.36 mm over 106 consensus words (Chrome and WeasyPrint within 2 pt; coverage 0.357) -> max 0.47 mm, p95 0.41 mm over 106 consensus words (Chrome and WeasyPrint within 2 pt; coverage 0.357) |
| corpus DANFE-P | `danfe\|DANFE-P1\|corpus\|\|criterion#1` | FAIL | PASS |  | 2 (expected 1) -> 1 (expected 1) |
| corpus DANFE-M | `danfe\|DANFE-M1\|corpus\|\|criterion#1` | FAIL | PASS |  | L 2.498 T 4.445 R 0 B 32.173 (each in [2, 8]) -> L 2.498 T 4.191 R 2.074 B 3.09 (each in [2, 8]) |
| corpus DANFE-L | `danfe\|DANFE-L1b\|corpus\|\|criterion#1` | FAIL | PASS |  | 6pt SWPJVR+LiberationSerif-Bold; pos Δ(0, 3.68) mm -> 6pt SWPJVR+LiberationSerif-Bold; pos Δ(0, 2.39) mm |
| corpus DANFE-R | `danfe\|DANFE-R1\|corpus\|\|criterion#1` | FAIL | PASS |  | DANFE-A4: anchor text not found in vellora -> worst DANFE-A2 0.27 mm (tol 1) |
| oracles:layout REF-P | `danfe\|REF-P\|oracles:layout\|plain\|criterion#1` | FAIL | PASS |  | 2 pages vs Chrome 1 (WeasyPrint 1) -> 1 pages vs Chrome 1 (WeasyPrint 1) |
| oracles:layout REF-W | `notification\|REF-W\|oracles:layout\|plain\|criterion#1` | FAIL | PASS |  | max 1.81 mm, p95 1.7 mm over 245 consensus words (Chrome and WeasyPrint within 2 pt; coverage 0.988) -> max 0.27 mm, p95 0.21 mm over 245 consensus words (Chrome and WeasyPrint within 2 pt; coverage 0.988) |
| oracles:layout LET-1 | `notification\|LET-1\|oracles:layout\|plain\|criterion#1` | FAIL | PASS |  | worst "Gerente do Departamento de Cobra" dy 1.81 mm (tol 1; 4 anchors: last paragraph + signature lines; 0 disputed) -> worst "Gerente do Departamento de Cobra" dy 0.1 mm (tol 1; 4 anchors: last paragraph + signature lines; 0 disputed) |
| oracles:layout REF-W | `receipt\|REF-W\|oracles:layout\|plain\|criterion#1` | FAIL | PASS |  | max 0.77 mm, p95 0.68 mm over 145 consensus words (Chrome and WeasyPrint within 2 pt; coverage 0.96) -> max 0.46 mm, p95 0.33 mm over 145 consensus words (Chrome and WeasyPrint within 2 pt; coverage 0.96) |
| corpus TXT-P | `text-stress-ptbr\|TXT-P1\|corpus\|\|criterion#1` | FAIL | PASS |  | 8 vs reference 7 -> 7 vs reference 7 |
| oracles:layout REF-P | `text-stress-ptbr\|REF-P\|oracles:layout\|plain\|criterion#1` | FAIL | PASS |  | 8 pages vs Chrome 7 (WeasyPrint 7) -> 7 pages vs Chrome 7 (WeasyPrint 7) |
| oracles:layout REF-W | `text-stress-ptbr\|REF-W\|oracles:layout\|plain\|criterion#1` | FAIL | PASS |  | max 97.79 mm, p95 97.02 mm over 736 consensus words (Chrome and WeasyPrint within 2 pt; coverage 0.818) -> max 0.48 mm, p95 0.38 mm over 1300 consensus words (Chrome and WeasyPrint within 2 pt; coverage 0.76) |
| corpus LET- | `text-stress-ptbr\|LET-3\|corpus\|\|criterion#1` | FAIL | PASS |  | 8 vs reference 7 (= TXT-P1) -> 7 vs reference 7 (= TXT-P1) |
| corpus BOL-R | `boleto-febraban\|BOL-R1\|corpus\|\|criterion#1\|worstMm` | 1.82 | 0.28 | 0.1 position-mm | 1.82 -> 0.28 |
| oracles:text EXT-2 | `boleto-febraban\|EXT-2\|oracles:text\|plain\|criterion#1\|statusRank.pdfminer.six` | 2 | 3 | 0 count | 2 -> 3 |
| oracles:layout REF-W | `boleto-febraban\|REF-W\|oracles:layout\|plain\|criterion#1\|maxMm` | 2.31 | 0.41 | 0.1 position-mm | 2.31 -> 0.41 |
| oracles:layout REF-W | `boleto-febraban\|REF-W\|oracles:layout\|plain\|criterion#1\|p95Mm` | 1.95 | 0.36 | 0.1 position-mm | 1.95 -> 0.36 |
| corpus BOL-R | `boleto-febraban.px-grid\|BOL-R1\|corpus\|\|criterion#1\|worstMm` | 1.82 | 0.28 | 0.1 position-mm | 1.82 -> 0.28 |
| oracles:text EXT-2 | `boleto-febraban.px-grid\|EXT-2\|oracles:text\|plain\|criterion#1\|statusRank.pdfminer.six` | 2 | 3 | 0 count | 2 -> 3 |
| oracles:layout REF-W | `boleto-febraban.px-grid\|REF-W\|oracles:layout\|plain\|criterion#1\|maxMm` | 2.31 | 0.41 | 0.1 position-mm | 2.31 -> 0.41 |
| oracles:layout REF-W | `boleto-febraban.px-grid\|REF-W\|oracles:layout\|plain\|criterion#1\|p95Mm` | 1.95 | 0.36 | 0.1 position-mm | 1.95 -> 0.36 |
| oracles:text EXT-2 | `boleto\|EXT-2\|oracles:text\|plain\|criterion#1\|statusRank.pdfminer.six` | 2 | 3 | 0 count | 2 -> 3 |
| oracles:layout REF-W | `boleto\|REF-W\|oracles:layout\|plain\|criterion#1\|maxMm` | 2.62 | 0.47 | 0.1 position-mm | 2.62 -> 0.47 |
| oracles:layout REF-W | `boleto\|REF-W\|oracles:layout\|plain\|criterion#1\|p95Mm` | 2.36 | 0.41 | 0.1 position-mm | 2.36 -> 0.41 |
| corpus DANFE-P | `danfe\|DANFE-P1\|corpus\|\|criterion#1\|pageDelta` | 1 | 0 | 0 page-delta | 1 -> 0 |
| corpus DANFE-M | `danfe\|DANFE-M1\|corpus\|\|criterion#1\|excessR` | 2 | 0 | 0.05 geometry-excess-mm | 2 -> 0 |
| corpus DANFE-M | `danfe\|DANFE-M1\|corpus\|\|criterion#1\|excessB` | 24.173 | 0 | 0.05 geometry-excess-mm | 24.173 -> 0 |
| corpus DANFE-L | `danfe\|DANFE-L1a\|corpus\|\|criterion#1\|posErrMm` | 2.09 | 1.59 | 0.1 position-mm | 2.09 -> 1.59 |
| corpus DANFE-L | `danfe\|DANFE-L1b\|corpus\|\|criterion#1\|posErrMm` | 3.68 | 2.39 | 0.1 position-mm | 3.68 -> 2.39 |
| corpus DANFE-L | `danfe\|DANFE-L1c\|corpus\|\|criterion#1\|posErrMm` | 5.24 | 3.15 | 0.1 position-mm | 5.24 -> 3.15 |
| corpus DANFE-L | `danfe\|DANFE-L1d\|corpus\|\|criterion#1\|posErrMm` | 6.49 | 3.35 | 0.1 position-mm | 6.49 -> 3.35 |
| oracles:layout REF-P | `danfe\|REF-P\|oracles:layout\|plain\|criterion#1\|pageDelta` | 1 | 0 | 0 page-delta | 1 -> 0 |
| oracles:layout REF-W | `danfe\|REF-W\|oracles:layout\|plain\|criterion#1\|maxMm` | 5.42 | 0.59 | 0.1 position-mm | 5.42 -> 0.59 |
| oracles:layout REF-W | `danfe\|REF-W\|oracles:layout\|plain\|criterion#1\|p95Mm` | 4.49 | 0.55 | 0.1 position-mm | 4.49 -> 0.55 |
| oracles:layout REF-W | `notification\|REF-W\|oracles:layout\|plain\|criterion#1\|maxMm` | 1.81 | 0.27 | 0.1 position-mm | 1.81 -> 0.27 |
| oracles:layout REF-W | `notification\|REF-W\|oracles:layout\|plain\|criterion#1\|p95Mm` | 1.7 | 0.21 | 0.1 position-mm | 1.7 -> 0.21 |
| oracles:layout LET-1 | `notification\|LET-1\|oracles:layout\|plain\|criterion#1\|worstMm` | 1.81 | 0.1 | 0.1 position-mm | 1.81 -> 0.1 |
| oracles:layout REF-W | `receipt\|REF-W\|oracles:layout\|plain\|criterion#1\|maxMm` | 0.77 | 0.46 | 0.1 position-mm | 0.77 -> 0.46 |
| oracles:layout REF-W | `receipt\|REF-W\|oracles:layout\|plain\|criterion#1\|p95Mm` | 0.68 | 0.33 | 0.1 position-mm | 0.68 -> 0.33 |
| corpus TXT-A | `text-stress-ptbr\|TXT-A1\|corpus\|\|criterion#1\|tokens` | 46 | 69 | 0 count | 46 -> 69 |
| corpus TXT-P | `text-stress-ptbr\|TXT-P1\|corpus\|\|criterion#1\|pageDelta` | 1 | 0 | 0 page-delta | 1 -> 0 |
| corpus TXT-R | `text-stress-ptbr\|TXT-R1\|corpus\|\|criterion#1\|worstMm` | 0.38 | 0.08 | 0.1 position-mm | 0.38 -> 0.08 |
| oracles:text EXT-2 | `text-stress-ptbr\|EXT-2\|oracles:text\|plain\|criterion#1\|extra.pdftotext` | 9 | 0 | 0 count | 9 -> 0 |
| oracles:text EXT-2 | `text-stress-ptbr\|EXT-2\|oracles:text\|plain\|criterion#1\|extra.pdfminer.six` | 9 | 0 | 0 count | 9 -> 0 |
| oracles:text EXT-2 | `text-stress-ptbr\|EXT-2\|oracles:text\|plain\|criterion#1\|extra.pymupdf` | 9 | 0 | 0 count | 9 -> 0 |
| oracles:text EXT-2 | `text-stress-ptbr\|EXT-2\|oracles:text\|plain\|criterion#1\|statusRank.pymupdf` | 2 | 3 | 0 count | 2 -> 3 |
| oracles:layout REF-P | `text-stress-ptbr\|REF-P\|oracles:layout\|plain\|criterion#1\|pageDelta` | 1 | 0 | 0 page-delta | 1 -> 0 |
| oracles:layout REF-W | `text-stress-ptbr\|REF-W\|oracles:layout\|plain\|criterion#1\|maxMm` | 97.79 | 0.48 | 0.1 position-mm | 97.79 -> 0.48 |
| oracles:layout REF-W | `text-stress-ptbr\|REF-W\|oracles:layout\|plain\|criterion#1\|p95Mm` | 97.02 | 0.38 | 0.1 position-mm | 97.02 -> 0.38 |
| pdf-probe | `pdf-probe\|boleto\|p1\|BENEFICIÁRIO#1\|dy` | -1.9 | 0 | 1 pdf-probe-pt | "BENEFICIÁRIO" \|dy\| 1.9 -> 0 pt |
| pdf-probe | `pdf-probe\|boleto\|p1\|AGÊNCIA#1\|dy` | -1.9 | 0 | 1 pdf-probe-pt | "AGÊNCIA" \|dy\| 1.9 -> 0 pt |
| pdf-probe | `pdf-probe\|boleto\|p1\|/#1\|dy` | -1.9 | 0 | 1 pdf-probe-pt | "/" \|dy\| 1.9 -> 0 pt |
| pdf-probe | `pdf-probe\|boleto\|p1\|CÓDIGO#1\|dy` | -1.9 | 0 | 1 pdf-probe-pt | "CÓDIGO" \|dy\| 1.9 -> 0 pt |
| pdf-probe | `pdf-probe\|boleto\|p1\|DO#2\|dy` | -1.9 | 0 | 1 pdf-probe-pt | "DO" \|dy\| 1.9 -> 0 pt |
| pdf-probe | `pdf-probe\|boleto\|p1\|BENEFICIÁRIO#2\|dy` | -1.9 | 0 | 1 pdf-probe-pt | "BENEFICIÁRIO" \|dy\| 1.9 -> 0 pt |
| pdf-probe | `pdf-probe\|boleto\|p1\|Acme#1\|dy` | -1.9 | 0 | 1 pdf-probe-pt | "Acme" \|dy\| 1.9 -> 0 pt |
| pdf-probe | `pdf-probe\|boleto\|p1\|Widgets#1\|dy` | -1.9 | 0 | 1 pdf-probe-pt | "Widgets" \|dy\| 1.9 -> 0 pt |
| pdf-probe | `pdf-probe\|boleto\|p1\|Comércio#1\|dy` | -1.9 | 0 | 1 pdf-probe-pt | "Comércio" \|dy\| 1.9 -> 0 pt |
| pdf-probe | `pdf-probe\|boleto\|p1\|LTDA#1\|dy` | -1.9 | 0 | 1 pdf-probe-pt | "LTDA" \|dy\| 1.9 -> 0 pt |
| pdf-probe | `pdf-probe\|boleto\|p1\|0042#1\|dy` | -1.9 | 0 | 1 pdf-probe-pt | "0042" \|dy\| 1.9 -> 0 pt |
| pdf-probe | `pdf-probe\|boleto\|p1\|/#2\|dy` | -1.9 | 0 | 1 pdf-probe-pt | "/" \|dy\| 1.9 -> 0 pt |
| pdf-probe | `pdf-probe\|boleto\|p1\|00012345-6#1\|dy` | -1.9 | 0 | 1 pdf-probe-pt | "00012345-6" \|dy\| 1.9 -> 0 pt |
| pdf-probe | `pdf-probe\|boleto\|p1\|Corte#1\|dy` | 1.1 | 0 | 1 pdf-probe-pt | "Corte" \|dy\| 1.1 -> 0 pt |
| pdf-probe | `pdf-probe\|boleto\|p1\|na#1\|dy` | 1.1 | 0 | 1 pdf-probe-pt | "na" \|dy\| 1.1 -> 0 pt |
| pdf-probe | `pdf-probe\|boleto\|p1\|linha#1\|dy` | 1.1 | 0 | 1 pdf-probe-pt | "linha" \|dy\| 1.1 -> 0 pt |
| pdf-probe | `pdf-probe\|boleto\|p1\|pontilhada#1\|dy` | 1.1 | 0 | 1 pdf-probe-pt | "pontilhada" \|dy\| 1.1 -> 0 pt |
| pdf-probe | `pdf-probe\|boleto\|p1\|—#1\|dy` | 1.1 | 0 | 1 pdf-probe-pt | "—" \|dy\| 1.1 -> 0 pt |
| pdf-probe | `pdf-probe\|boleto\|p1\|Ficha#1\|dy` | 1.1 | 0 | 1 pdf-probe-pt | "Ficha" \|dy\| 1.1 -> 0 pt |
| pdf-probe | `pdf-probe\|boleto\|p1\|de#1\|dy` | 1.1 | 0 | 1 pdf-probe-pt | "de" \|dy\| 1.1 -> 0 pt |
| pdf-probe | `pdf-probe\|boleto\|p1\|Compensação#1\|dy` | 1.1 | 0 | 1 pdf-probe-pt | "Compensação" \|dy\| 1.1 -> 0 pt |
| pdf-probe | `pdf-probe\|boleto\|p1\|99990.00001#2\|dy` | 2.74 | 0.75 | 1 pdf-probe-pt | "99990.00001" \|dy\| 2.74 -> 0.75 pt |
| pdf-probe | `pdf-probe\|boleto\|p1\|23456.700001#2\|dy` | 2.74 | 0.75 | 1 pdf-probe-pt | "23456.700001" \|dy\| 2.74 -> 0.75 pt |
| pdf-probe | `pdf-probe\|boleto\|p1\|00000.000420#2\|dy` | 2.74 | 0.75 | 1 pdf-probe-pt | "00000.000420" \|dy\| 2.74 -> 0.75 pt |
| pdf-probe | `pdf-probe\|boleto\|p1\|1#2\|dy` | 2.74 | 0.75 | 1 pdf-probe-pt | "1" \|dy\| 2.74 -> 0.75 pt |
| pdf-probe | `pdf-probe\|boleto\|p1\|999-9#2\|dy` | 2.13 | 0 | 1 pdf-probe-pt | "999-9" \|dy\| 2.13 -> 0 pt |
| pdf-probe | `pdf-probe\|boleto\|p1\|99990000012345#2\|dy` | 2.74 | 0.75 | 1 pdf-probe-pt | "99990000012345" \|dy\| 2.74 -> 0.75 pt |
| pdf-probe | `pdf-probe\|boleto\|p1\|LOCAL#1\|dy` | 1.85 | 0 | 1 pdf-probe-pt | "LOCAL" \|dy\| 1.85 -> 0 pt |
| pdf-probe | `pdf-probe\|boleto\|p1\|DE#1\|dy` | 1.85 | 0 | 1 pdf-probe-pt | "DE" \|dy\| 1.85 -> 0 pt |
| pdf-probe | `pdf-probe\|boleto\|p1\|PAGAMENTO#1\|dy` | 1.85 | 0 | 1 pdf-probe-pt | "PAGAMENTO" \|dy\| 1.85 -> 0 pt |
| pdf-probe | `pdf-probe\|boleto\|p1\|VENCIMENTO#2\|dy` | 1.85 | 0 | 1 pdf-probe-pt | "VENCIMENTO" \|dy\| 1.85 -> 0 pt |
| pdf-probe | `pdf-probe\|boleto\|p1\|Pagável#1\|dy` | 1.1 | 0 | 1 pdf-probe-pt | "Pagável" \|dy\| 1.1 -> 0 pt |
| pdf-probe | `pdf-probe\|boleto\|p1\|em#1\|dy` | 1.1 | 0 | 1 pdf-probe-pt | "em" \|dy\| 1.1 -> 0 pt |
| pdf-probe | `pdf-probe\|boleto\|p1\|qualquer#1\|dy` | 1.1 | 0 | 1 pdf-probe-pt | "qualquer" \|dy\| 1.1 -> 0 pt |
| pdf-probe | `pdf-probe\|boleto\|p1\|banco#1\|dy` | 1.1 | 0 | 1 pdf-probe-pt | "banco" \|dy\| 1.1 -> 0 pt |
| pdf-probe | `pdf-probe\|boleto\|p1\|até#1\|dy` | 1.1 | 0 | 1 pdf-probe-pt | "até" \|dy\| 1.1 -> 0 pt |
| pdf-probe | `pdf-probe\|boleto\|p1\|o#1\|dy` | 1.1 | 0 | 1 pdf-probe-pt | "o" \|dy\| 1.1 -> 0 pt |
| pdf-probe | `pdf-probe\|boleto\|p1\|vencimento#1\|dy` | 1.1 | 0 | 1 pdf-probe-pt | "vencimento" \|dy\| 1.1 -> 0 pt |
| pdf-probe | `pdf-probe\|boleto\|p1\|(boleto#1\|dy` | 1.1 | 0 | 1 pdf-probe-pt | "(boleto" \|dy\| 1.1 -> 0 pt |
| pdf-probe | `pdf-probe\|boleto\|p1\|fictício#1\|dy` | 1.1 | 0 | 1 pdf-probe-pt | "fictício" \|dy\| 1.1 -> 0 pt |
| pdf-probe | `pdf-probe\|boleto\|p1\|de#2\|dy` | 1.1 | 0 | 1 pdf-probe-pt | "de" \|dy\| 1.1 -> 0 pt |
| pdf-probe | `pdf-probe\|boleto\|p1\|teste).#1\|dy` | 1.1 | 0 | 1 pdf-probe-pt | "teste)." \|dy\| 1.1 -> 0 pt |
| pdf-probe | `pdf-probe\|boleto\|p1\|15/07/2026#2\|dy` | 1.1 | 0 | 1 pdf-probe-pt | "15/07/2026" \|dy\| 1.1 -> 0 pt |
| pdf-probe | `pdf-probe\|boleto\|p1\|BENEFICIÁRIO#3\|dy` | 2.6 | 0 | 1 pdf-probe-pt | "BENEFICIÁRIO" \|dy\| 2.6 -> 0 pt |
| pdf-probe | `pdf-probe\|boleto\|p1\|AGÊNCIA#2\|dy` | 2.6 | 0 | 1 pdf-probe-pt | "AGÊNCIA" \|dy\| 2.6 -> 0 pt |
| pdf-probe | `pdf-probe\|boleto\|p1\|/#3\|dy` | 2.6 | 0 | 1 pdf-probe-pt | "/" \|dy\| 2.6 -> 0 pt |
| pdf-probe | `pdf-probe\|boleto\|p1\|CÓDIGO#2\|dy` | 2.6 | 0 | 1 pdf-probe-pt | "CÓDIGO" \|dy\| 2.6 -> 0 pt |
| pdf-probe | `pdf-probe\|boleto\|p1\|DO#4\|dy` | 2.6 | 0 | 1 pdf-probe-pt | "DO" \|dy\| 2.6 -> 0 pt |
| pdf-probe | `pdf-probe\|boleto\|p1\|BENEFICIÁRIO#4\|dy` | 2.6 | 0 | 1 pdf-probe-pt | "BENEFICIÁRIO" \|dy\| 2.6 -> 0 pt |
| pdf-probe | `pdf-probe\|boleto\|p1\|Acme#2\|dy` | 2.6 | 0 | 1 pdf-probe-pt | "Acme" \|dy\| 2.6 -> 0 pt |
| pdf-probe | `pdf-probe\|boleto\|p1\|Widgets#2\|dy` | 2.6 | 0 | 1 pdf-probe-pt | "Widgets" \|dy\| 2.6 -> 0 pt |
| pdf-probe | `pdf-probe\|boleto\|p1\|Comércio#2\|dy` | 2.6 | 0 | 1 pdf-probe-pt | "Comércio" \|dy\| 2.6 -> 0 pt |
| pdf-probe | `pdf-probe\|boleto\|p1\|LTDA#2\|dy` | 2.6 | 0 | 1 pdf-probe-pt | "LTDA" \|dy\| 2.6 -> 0 pt |
| pdf-probe | `pdf-probe\|boleto\|p1\|—#2\|dy` | 2.6 | 0 | 1 pdf-probe-pt | "—" \|dy\| 2.6 -> 0 pt |
| pdf-probe | `pdf-probe\|boleto\|p1\|CNPJ#1\|dy` | 2.6 | 0 | 1 pdf-probe-pt | "CNPJ" \|dy\| 2.6 -> 0 pt |
| pdf-probe | `pdf-probe\|boleto\|p1\|12.345.678/0001-90#1\|dy` | 2.6 | 0 | 1 pdf-probe-pt | "12.345.678/0001-90" \|dy\| 2.6 -> 0 pt |
| pdf-probe | `pdf-probe\|boleto\|p1\|0042#2\|dy` | 3.35 | 0 | 1 pdf-probe-pt | "0042" \|dy\| 3.35 -> 0 pt |
| pdf-probe | `pdf-probe\|boleto\|p1\|/#4\|dy` | 3.35 | 0 | 1 pdf-probe-pt | "/" \|dy\| 3.35 -> 0 pt |
| pdf-probe | `pdf-probe\|boleto\|p1\|00012345-6#2\|dy` | 3.35 | 0 | 1 pdf-probe-pt | "00012345-6" \|dy\| 3.35 -> 0 pt |
| pdf-probe | `pdf-probe\|boleto\|p1\|DATA#1\|dy` | 4.1 | 0 | 1 pdf-probe-pt | "DATA" \|dy\| 4.1 -> 0 pt |
| pdf-probe | `pdf-probe\|boleto\|p1\|DO#5\|dy` | 4.1 | 0 | 1 pdf-probe-pt | "DO" \|dy\| 4.1 -> 0 pt |
| pdf-probe | `pdf-probe\|boleto\|p1\|DOCUMENTO#2\|dy` | 4.1 | 0 | 1 pdf-probe-pt | "DOCUMENTO" \|dy\| 4.1 -> 0 pt |
| pdf-probe | `pdf-probe\|boleto\|p1\|NÚMERO#2\|dy` | 4.1 | 0 | 1 pdf-probe-pt | "NÚMERO" \|dy\| 4.1 -> 0 pt |
| pdf-probe | `pdf-probe\|boleto\|p1\|DO#6\|dy` | 4.1 | 0 | 1 pdf-probe-pt | "DO" \|dy\| 4.1 -> 0 pt |
| pdf-probe | `pdf-probe\|boleto\|p1\|DOCUMENTO#3\|dy` | 4.1 | 0 | 1 pdf-probe-pt | "DOCUMENTO" \|dy\| 4.1 -> 0 pt |
| … | 2162 more in gate-report.json | | | | |

WPT/crashtest improvements: 80 (listed in gate-report.json).

## Worse within tolerance (527; not gating, counted; the head ratchet sums them)

| group | key | before | after | tolerance | detail |
|---|---|---|---|---|---|
| pdf-probe | `pdf-probe\|boleto\|p1\|99990.00001#1\|dy` | -1.01 | 0.75 | 1 pdf-probe-pt | "99990.00001" dy -1.01 -> 0.75 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto\|p1\|23456.700001#1\|dy` | -1.01 | 0.75 | 1 pdf-probe-pt | "23456.700001" dy -1.01 -> 0.75 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto\|p1\|00000.000420#1\|dy` | -1.01 | 0.75 | 1 pdf-probe-pt | "00000.000420" dy -1.01 -> 0.75 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto\|p1\|1#1\|dy` | -1.01 | 0.75 | 1 pdf-probe-pt | "1" dy -1.01 -> 0.75 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto\|p1\|999-9#1\|dx` | -0.86 | 0.64 | 1 pdf-probe-pt | "999-9" dx -0.86 -> 0.64 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto\|p1\|999-9#1\|dy` | -0.87 | 0.75 | 1 pdf-probe-pt | "999-9" dy -0.87 -> 0.75 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto\|p1\|99990000012345#1\|dy` | -1.01 | 0.75 | 1 pdf-probe-pt | "99990000012345" dy -1.01 -> 0.75 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto\|p1\|0042#1\|dx` | 0.69 | -0.06 | 1 pdf-probe-pt | "0042" dx 0.69 -> -0.06 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto\|p1\|/#2\|dx` | 0.69 | -0.06 | 1 pdf-probe-pt | "/" dx 0.69 -> -0.06 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto\|p1\|00012345-6#1\|dx` | 0.69 | -0.06 | 1 pdf-probe-pt | "00012345-6" dx 0.69 -> -0.06 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto\|p1\|VENCIMENTO#1\|dx` | 0.69 | -0.06 | 1 pdf-probe-pt | "VENCIMENTO" dx 0.69 -> -0.06 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto\|p1\|15/07/2026#1\|dx` | 0.69 | -0.06 | 1 pdf-probe-pt | "15/07/2026" dx 0.69 -> -0.06 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto\|p1\|R$#1\|dx` | 0.69 | -0.06 | 1 pdf-probe-pt | "R$" dx 0.69 -> -0.06 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto\|p1\|1.842,50#1\|dx` | 0.69 | -0.06 | 1 pdf-probe-pt | "1.842,50" dx 0.69 -> -0.06 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto\|p1\|999-9#2\|dx` | -0.86 | 0.64 | 1 pdf-probe-pt | "999-9" dx -0.86 -> 0.64 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto\|p1\|15/07/2026#2\|dx` | 0.69 | -0.06 | 1 pdf-probe-pt | "15/07/2026" dx 0.69 -> -0.06 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto\|p1\|0042#2\|dx` | 0.69 | -0.06 | 1 pdf-probe-pt | "0042" dx 0.69 -> -0.06 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto\|p1\|/#4\|dx` | 0.69 | -0.06 | 1 pdf-probe-pt | "/" dx 0.69 -> -0.06 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto\|p1\|00012345-6#2\|dx` | 0.69 | -0.06 | 1 pdf-probe-pt | "00012345-6" dx 0.69 -> -0.06 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto\|p1\|NÚMERO#2\|dx` | 0.69 | -0.06 | 1 pdf-probe-pt | "NÚMERO" dx 0.69 -> -0.06 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto\|p1\|DO#6\|dx` | 0.74 | -0.01 | 1 pdf-probe-pt | "DO" dx 0.74 -> -0.01 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto\|p1\|ESPÉCIE#1\|dx` | 0.69 | -0.06 | 1 pdf-probe-pt | "ESPÉCIE" dx 0.69 -> -0.06 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto\|p1\|DOC.#1\|dx` | 0.74 | -0.01 | 1 pdf-probe-pt | "DOC." dx 0.74 -> -0.01 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto\|p1\|DOC-00042#1\|dx` | 0.69 | -0.06 | 1 pdf-probe-pt | "DOC-00042" dx 0.69 -> -0.06 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto\|p1\|DM#1\|dx` | 0.69 | -0.06 | 1 pdf-probe-pt | "DM" dx 0.69 -> -0.06 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto\|p1\|00000000000123456-7#2\|dx` | 0.69 | -0.06 | 1 pdf-probe-pt | "00000000000123456-7" dx 0.69 -> -0.06 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto\|p1\|ESPÉCIE#2\|dx` | 0.69 | -0.06 | 1 pdf-probe-pt | "ESPÉCIE" dx 0.69 -> -0.06 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto\|p1\|MOEDA#1\|dx` | 0.74 | -0.01 | 1 pdf-probe-pt | "MOEDA" dx 0.74 -> -0.01 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto\|p1\|QUANTIDADE#1\|dx` | 0.69 | -0.06 | 1 pdf-probe-pt | "QUANTIDADE" dx 0.69 -> -0.06 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto\|p1\|R$#2\|dx` | 0.69 | -0.06 | 1 pdf-probe-pt | "R$" dx 0.69 -> -0.06 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto\|p1\|1#3\|dx` | 0.69 | -0.06 | 1 pdf-probe-pt | "1" dx 0.69 -> -0.06 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto\|p1\|R$#3\|dx` | 0.69 | -0.06 | 1 pdf-probe-pt | "R$" dx 0.69 -> -0.06 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto\|p1\|1.842,50#2\|dx` | 0.69 | -0.06 | 1 pdf-probe-pt | "1.842,50" dx 0.69 -> -0.06 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto\|p1\|R$#4\|dx` | 0.69 | -0.06 | 1 pdf-probe-pt | "R$" dx 0.69 -> -0.06 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto\|p1\|0,00#1\|dx` | 0.69 | -0.06 | 1 pdf-probe-pt | "0,00" dx 0.69 -> -0.06 pt (crossed Chrome, within 1 pt) |
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
| pdf-probe | `pdf-probe\|boleto\|p1\|R$#5\|dx` | 0.69 | -0.06 | 1 pdf-probe-pt | "R$" dx 0.69 -> -0.06 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto\|p1\|0,00#2\|dx` | 0.69 | -0.06 | 1 pdf-probe-pt | "0,00" dx 0.69 -> -0.06 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto\|p1\|R$#7\|dx` | 0.69 | -0.06 | 1 pdf-probe-pt | "R$" dx 0.69 -> -0.06 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto\|p1\|0,00#3\|dx` | 0.69 | -0.06 | 1 pdf-probe-pt | "0,00" dx 0.69 -> -0.06 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto\|p1\|R$#8\|dx` | 0.69 | -0.06 | 1 pdf-probe-pt | "R$" dx 0.69 -> -0.06 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto\|p1\|1.842,50#3\|dx` | 0.69 | -0.06 | 1 pdf-probe-pt | "1.842,50" dx 0.69 -> -0.06 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto\|p1\|DESCRIÇÃO#1\|dx` | 0.69 | -0.06 | 1 pdf-probe-pt | "DESCRIÇÃO" dx 0.69 -> -0.06 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|10492.46810#1\|dy` | -0.25 | 0.75 | 1 pdf-probe-pt | "10492.46810" dy -0.25 -> 0.75 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|31000.100045#1\|dy` | -0.25 | 0.75 | 1 pdf-probe-pt | "31000.100045" dy -0.25 -> 0.75 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|00041.700139#1\|dy` | -0.25 | 0.75 | 1 pdf-probe-pt | "00041.700139" dy -0.25 -> 0.75 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|7#1\|dy` | -0.25 | 0.75 | 1 pdf-probe-pt | "7" dy -0.25 -> 0.75 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|16460000184250#1\|dy` | -0.25 | 0.75 | 1 pdf-probe-pt | "16460000184250" dy -0.25 -> 0.75 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|CPF/CNPJ#1\|dx` | 2.98 | -0.02 | 1 pdf-probe-pt | "CPF/CNPJ" dx 2.98 -> -0.02 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|do#2\|dx` | 2.98 | -0.02 | 1 pdf-probe-pt | "do" dx 2.98 -> -0.02 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|Beneficiário#2\|dx` | 2.98 | -0.02 | 1 pdf-probe-pt | "Beneficiário" dx 2.98 -> -0.02 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|11.222.333/0001-81#1\|dx` | 2.98 | -0.02 | 1 pdf-probe-pt | "11.222.333/0001-81" dx 2.98 -> -0.02 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|Nr.#1\|dx` | 1.32 | -0.18 | 1 pdf-probe-pt | "Nr." dx 1.32 -> -0.18 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|do#6\|dx` | 1.32 | -0.18 | 1 pdf-probe-pt | "do" dx 1.32 -> -0.18 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|documento#2\|dx` | 1.32 | -0.18 | 1 pdf-probe-pt | "documento" dx 1.32 -> -0.18 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|Data#2\|dx` | 2.98 | -0.02 | 1 pdf-probe-pt | "Data" dx 2.98 -> -0.02 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|do#7\|dx` | 2.98 | -0.02 | 1 pdf-probe-pt | "do" dx 2.98 -> -0.02 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|processamento#1\|dx` | 2.98 | -0.02 | 1 pdf-probe-pt | "processamento" dx 2.98 -> -0.02 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|NF-2026/00417#1\|dx` | 1.32 | -0.18 | 1 pdf-probe-pt | "NF-2026/00417" dx 1.32 -> -0.18 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|15/10/2026#2\|dx` | 2.98 | -0.02 | 1 pdf-probe-pt | "15/10/2026" dx 2.98 -> -0.02 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|CPF/CNPJ#2\|dx` | 3.45 | -0.3 | 1 pdf-probe-pt | "CPF/CNPJ" dx 3.45 -> -0.3 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|do#8\|dx` | 3.45 | -0.3 | 1 pdf-probe-pt | "do" dx 3.45 -> -0.3 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|Pagador#3\|dx` | 3.45 | -0.3 | 1 pdf-probe-pt | "Pagador" dx 3.45 -> -0.3 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|123.456.789-09#1\|dx` | 3.45 | -0.3 | 1 pdf-probe-pt | "123.456.789-09" dx 3.45 -> -0.3 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|Espécie#1\|dx` | 1.32 | -0.18 | 1 pdf-probe-pt | "Espécie" dx 1.32 -> -0.18 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|Valor#1\|dx` | 2.98 | -0.02 | 1 pdf-probe-pt | "Valor" dx 2.98 -> -0.02 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|do#9\|dx` | 2.98 | -0.02 | 1 pdf-probe-pt | "do" dx 2.98 -> -0.02 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|Documento#1\|dx` | 2.98 | -0.02 | 1 pdf-probe-pt | "Documento" dx 2.98 -> -0.02 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|R$#1\|dx` | 1.32 | -0.18 | 1 pdf-probe-pt | "R$" dx 1.32 -> -0.18 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|1.842,50#1\|dx` | 2.97 | -0.01 | 1 pdf-probe-pt | "1.842,50" dx 2.97 -> -0.01 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|Valor#3\|dx` | 0.3 | -0.43 | 1 pdf-probe-pt | "Valor" dx 0.3 -> -0.43 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|(R$)#1\|dx` | 0.3 | -0.43 | 1 pdf-probe-pt | "(R$)" dx 0.3 -> -0.43 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|10/2026#1\|dy` | 3.67 | -0.75 | 1 pdf-probe-pt | "10/2026" dy 3.67 -> -0.75 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|Revisão#1\|dy` | 3.67 | -0.75 | 1 pdf-probe-pt | "Revisão" dy 3.67 -> -0.75 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|programada#1\|dy` | 3.67 | -0.75 | 1 pdf-probe-pt | "programada" dy 3.67 -> -0.75 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|—#4\|dy` | 3.67 | -0.75 | 1 pdf-probe-pt | "—" dy 3.67 -> -0.75 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|mão#1\|dy` | 3.67 | -0.75 | 1 pdf-probe-pt | "mão" dy 3.67 -> -0.75 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|de#2\|dy` | 3.67 | -0.75 | 1 pdf-probe-pt | "de" dy 3.67 -> -0.75 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|obra#1\|dy` | 3.67 | -0.75 | 1 pdf-probe-pt | "obra" dy 3.67 -> -0.75 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|980,00#1\|dx` | 0.27 | -0.46 | 1 pdf-probe-pt | "980,00" dx 0.27 -> -0.46 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|980,00#1\|dy` | 3.67 | -0.75 | 1 pdf-probe-pt | "980,00" dy 3.67 -> -0.75 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|10/2026#2\|dy` | 3.67 | -0.75 | 1 pdf-probe-pt | "10/2026" dy 3.67 -> -0.75 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|Peças#1\|dy` | 3.67 | -0.75 | 1 pdf-probe-pt | "Peças" dy 3.67 -> -0.75 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|de#3\|dy` | 3.67 | -0.75 | 1 pdf-probe-pt | "de" dy 3.67 -> -0.75 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|reposição#1\|dy` | 3.67 | -0.75 | 1 pdf-probe-pt | "reposição" dy 3.67 -> -0.75 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|(filtros,#1\|dy` | 3.67 | -0.75 | 1 pdf-probe-pt | "(filtros," dy 3.67 -> -0.75 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|óleo#1\|dy` | 3.67 | -0.75 | 1 pdf-probe-pt | "óleo" dy 3.67 -> -0.75 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|sintético)#1\|dy` | 3.67 | -0.75 | 1 pdf-probe-pt | "sintético)" dy 3.67 -> -0.75 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|712,50#1\|dx` | 0.27 | -0.46 | 1 pdf-probe-pt | "712,50" dx 0.27 -> -0.46 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|712,50#1\|dy` | 3.67 | -0.75 | 1 pdf-probe-pt | "712,50" dy 3.67 -> -0.75 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|150,00#1\|dx` | 0.27 | -0.46 | 1 pdf-probe-pt | "150,00" dx 0.27 -> -0.46 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|10492.46810#2\|dy` | -2.5 | 0.75 | 1 pdf-probe-pt | "10492.46810" dy -2.5 -> 0.75 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|31000.100045#2\|dy` | -2.5 | 0.75 | 1 pdf-probe-pt | "31000.100045" dy -2.5 -> 0.75 pt (crossed Chrome, within 1 pt) |
| … | 407 more in gate-report.json | | | | |

## newly-measured (1123)

| group | key | before | after | tolerance | detail |
|---|---|---|---|---|---|
| corpus DANFE-R | `danfe\|DANFE-R1\|corpus\|\|criterion#1\|worstMm` |  | 0.27 | 0.1 position-mm | was DANFE-A4 not found in vellora |
| pdf-probe | `pdf-probe\|danfe\|p1\|INFORMAÇÕES#1\|pairing` | unpaired | dx 0.33 dy 0.76 |  | Chrome's "INFORMAÇÕES" (page 1) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|danfe\|p1\|COMPLEMENTARES#1\|pairing` | unpaired | dx 0.37 dy 0.76 |  | Chrome's "COMPLEMENTARES" (page 1) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|danfe\|p1\|RESERVADO#1\|pairing` | unpaired | dx 0.38 dy 0.76 |  | Chrome's "RESERVADO" (page 1) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|danfe\|p1\|AO#2\|pairing` | unpaired | dx 0.41 dy 0.76 |  | Chrome's "AO" (page 1) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|danfe\|p1\|FISCO#1\|pairing` | unpaired | dx 0.42 dy 0.76 |  | Chrome's "FISCO" (page 1) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|danfe\|p1\|SEM#1\|pairing` | unpaired | dx 0.33 dy 0.77 |  | Chrome's "SEM" (page 1) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|danfe\|p1\|VALOR#15\|pairing` | unpaired | dx 0.34 dy 0.77 |  | Chrome's "VALOR" (page 1) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|danfe\|p1\|FISCAL#3\|pairing` | unpaired | dx 0.36 dy 0.77 |  | Chrome's "FISCAL" (page 1) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|danfe\|p1\|—#12\|pairing` | unpaired | dx 0.38 dy 0.77 |  | Chrome's "—" (page 1) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|danfe\|p1\|NF-e#3\|pairing` | unpaired | dx 0.38 dy 0.77 |  | Chrome's "NF-e" (page 1) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|danfe\|p1\|emitida#1\|pairing` | unpaired | dx 0.4 dy 0.77 |  | Chrome's "emitida" (page 1) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|danfe\|p1\|em#2\|pairing` | unpaired | dx 0.42 dy 0.77 |  | Chrome's "em" (page 1) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|danfe\|p1\|ambiente#1\|pairing` | unpaired | dx 0.43 dy 0.77 |  | Chrome's "ambiente" (page 1) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|danfe\|p1\|de#8\|pairing` | unpaired | dx 0.46 dy 0.77 |  | Chrome's "de" (page 1) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|danfe\|p1\|homologação#1\|pairing` | unpaired | dx 0.47 dy 0.77 |  | Chrome's "homologação" (page 1) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|danfe\|p1\|(fixture#1\|pairing` | unpaired | dx 0.51 dy 0.77 |  | Chrome's "(fixture" (page 1) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|danfe\|p1\|sintética#1\|pairing` | unpaired | dx 0.53 dy 0.77 |  | Chrome's "sintética" (page 1) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|danfe\|p1\|do#1\|pairing` | unpaired | dx 0.56 dy 0.77 |  | Chrome's "do" (page 1) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|danfe\|p1\|vellora,#1\|pairing` | unpaired | dx 0.57 dy 0.77 |  | Chrome's "vellora," (page 1) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|danfe\|p1\|fidelity/corpus).#1\|pairing` | unpaired | dx 0.59 dy 0.77 |  | Chrome's "fidelity/corpus)." (page 1) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|danfe\|p1\|Pedido#1\|pairing` | unpaired | dx 0.33 dy 0.78 |  | Chrome's "Pedido" (page 1) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|danfe\|p1\|de#9\|pairing` | unpaired | dx 0.35 dy 0.78 |  | Chrome's "de" (page 1) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|danfe\|p1\|compra#1\|pairing` | unpaired | dx 0.36 dy 0.78 |  | Chrome's "compra" (page 1) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|danfe\|p1\|nº#1\|pairing` | unpaired | dx 0.38 dy 0.78 |  | Chrome's "nº" (page 1) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|danfe\|p1\|PC-2026-0815.#1\|pairing` | unpaired | dx 0.38 dy 0.78 |  | Chrome's "PC-2026-0815." (page 1) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|danfe\|p1\|Entrega#1\|pairing` | unpaired | dx 0.42 dy 0.78 |  | Chrome's "Entrega" (page 1) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|danfe\|p1\|no#3\|pairing` | unpaired | dx 0.44 dy 0.78 |  | Chrome's "no" (page 1) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|danfe\|p1\|horário#1\|pairing` | unpaired | dx 0.45 dy 0.78 |  | Chrome's "horário" (page 1) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|danfe\|p1\|comercial.#1\|pairing` | unpaired | dx 0.47 dy 0.78 |  | Chrome's "comercial." (page 1) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|danfe\|p1\|Valor#1\|pairing` | unpaired | dx 0.33 dy 0.79 |  | Chrome's "Valor" (page 1) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|danfe\|p1\|aproximado#1\|pairing` | unpaired | dx 0.34 dy 0.79 |  | Chrome's "aproximado" (page 1) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|danfe\|p1\|dos#2\|pairing` | unpaired | dx 0.38 dy 0.79 |  | Chrome's "dos" (page 1) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|danfe\|p1\|tributos:#1\|pairing` | unpaired | dx 0.39 dy 0.79 |  | Chrome's "tributos:" (page 1) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|danfe\|p1\|R$#4\|pairing` | unpaired | dx 0.41 dy 0.79 |  | Chrome's "R$" (page 1) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|danfe\|p1\|4.203,37#1\|pairing` | unpaired | dx 0.42 dy 0.79 |  | Chrome's "4.203,37" (page 1) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|danfe\|p1\|(Fonte:#1\|pairing` | unpaired | dx 0.44 dy 0.79 |  | Chrome's "(Fonte:" (page 1) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|danfe\|p1\|IBPT)#1\|pairing` | unpaired | dx 0.46 dy 0.79 |  | Chrome's "IBPT)" (page 1) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|danfe\|p1\|—#13\|pairing` | unpaired | dx 0.48 dy 0.79 |  | Chrome's "—" (page 1) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|danfe\|p1\|valor#1\|pairing` | unpaired | dx 0.48 dy 0.79 |  | Chrome's "valor" (page 1) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|danfe\|p1\|fictício.#1\|pairing` | unpaired | dx 0.5 dy 0.79 |  | Chrome's "fictício." (page 1) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p1\|7#1\|pairing` | unpaired | dx -0.56 dy 0 |  | Chrome's "7" (page 1) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p2\|de#23\|pairing` | unpaired | dx -0.22 dy -0.75 |  | Chrome's "de" (page 2) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p2\|Lançamentos#3\|pairing` | unpaired | dx 0.03 dy 0 |  | Chrome's "Lançamentos" (page 2) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p2\|de#25\|pairing` | unpaired | dx 0.02 dy 0 |  | Chrome's "de" (page 2) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p2\|março#1\|pairing` | unpaired | dx 0.02 dy 0 |  | Chrome's "março" (page 2) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p2\|2026#3\|pairing` | unpaired | dx 0.01 dy 0 |  | Chrome's "2026" (page 2) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p2\|120.466,81#1\|pairing` | unpaired | dx -0.92 dy 0 |  | Chrome's "120.466,81" (page 2) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p2\|852357#1\|pairing` | unpaired | dx -0.17 dy 0 |  | Chrome's "852357" (page 2) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p2\|03/03/2026#1\|pairing` | unpaired | dx 0.03 dy 0 |  | Chrome's "03/03/2026" (page 2) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p2\|Compra#5\|pairing` | unpaired | dx -0.21 dy 0 |  | Chrome's "Compra" (page 2) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p2\|no#5\|pairing` | unpaired | dx -0.22 dy 0 |  | Chrome's "no" (page 2) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p2\|débito#5\|pairing` | unpaired | dx -0.22 dy 0 |  | Chrome's "débito" (page 2) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p2\|—#11\|pairing` | unpaired | dx -0.23 dy 0 |  | Chrome's "—" (page 2) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p2\|Padaria#5\|pairing` | unpaired | dx -0.23 dy 0 |  | Chrome's "Padaria" (page 2) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p2\|Pão#5\|pairing` | unpaired | dx -0.24 dy 0 |  | Chrome's "Pão" (page 2) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p2\|de#27\|pairing` | unpaired | dx -0.24 dy 0 |  | Chrome's "de" (page 2) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p2\|Açúcar#5\|pairing` | unpaired | dx -0.24 dy 0 |  | Chrome's "Açúcar" (page 2) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p2\|&#5\|pairing` | unpaired | dx -0.25 dy 0 |  | Chrome's "&" (page 2) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p2\|Cia.#5\|pairing` | unpaired | dx -0.25 dy 0 |  | Chrome's "Cia." (page 2) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p2\|−321,66#1\|pairing` | unpaired | dx -0.46 dy 0 |  | Chrome's "−321,66" (page 2) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p2\|143.119,78#1\|pairing` | unpaired | dx -0.93 dy 0 |  | Chrome's "143.119,78" (page 2) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p2\|917939#1\|pairing` | unpaired | dx -0.17 dy 0 |  | Chrome's "917939" (page 2) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p2\|05/03/2026#1\|pairing` | unpaired | dx 0.03 dy 0 |  | Chrome's "05/03/2026" (page 2) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p2\|Transferência#1\|pairing` | unpaired | dx -0.21 dy 0 |  | Chrome's "Transferência" (page 2) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p2\|TED#1\|pairing` | unpaired | dx -0.22 dy 0 |  | Chrome's "TED" (page 2) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p2\|—#12\|pairing` | unpaired | dx -0.22 dy 0 |  | Chrome's "—" (page 2) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p2\|Distribuidora#1\|pairing` | unpaired | dx -0.22 dy 0 |  | Chrome's "Distribuidora" (page 2) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p2\|Exemplo#1\|pairing` | unpaired | dx -0.24 dy 0 |  | Chrome's "Exemplo" (page 2) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p2\|de#28\|pairing` | unpaired | dx -0.25 dy 0 |  | Chrome's "de" (page 2) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p2\|−1.931,80#1\|pairing` | unpaired | dx -0.45 dy 0 |  | Chrome's "−1.931,80" (page 2) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p2\|141.187,98#1\|pairing` | unpaired | dx -0.92 dy 0 |  | Chrome's "141.187,98" (page 2) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p2\|Componentes#1\|pairing` | unpaired | dx -0.21 dy 0 |  | Chrome's "Componentes" (page 2) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p2\|Ltda.#1\|pairing` | unpaired | dx -0.22 dy 0 |  | Chrome's "Ltda." (page 2) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p2\|982804#1\|pairing` | unpaired | dx -0.17 dy 0 |  | Chrome's "982804" (page 2) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p2\|08/03/2026#1\|pairing` | unpaired | dx 0.03 dy 0 |  | Chrome's "08/03/2026" (page 2) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p2\|Tarifa#2\|pairing` | unpaired | dx -0.21 dy 0 |  | Chrome's "Tarifa" (page 2) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p2\|de#29\|pairing` | unpaired | dx -0.21 dy 0 |  | Chrome's "de" (page 2) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p2\|manutenção#2\|pairing` | unpaired | dx -0.21 dy 0 |  | Chrome's "manutenção" (page 2) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p2\|de#30\|pairing` | unpaired | dx -0.23 dy 0 |  | Chrome's "de" (page 2) now has a vellora counterpart |
| … | 1043 more in gate-report.json | | | | |

## Head ratchet vs fidelity/baselines/port/00-start (GATE-H1): FAIL

Every item worse than the chain head beyond its tolerance gates unless a class-a acceptance of this step (3 counted, 0 legacy/other ignored) or a DEBT.json entry within its ceiling covers it. Counts: head-regression 8, debt 11, declared 10, accepted 3, gating 8, improvement 3509, withinTolerance 762, flaggedPassLost 20.

### head-regression: worse than the head, no ledger entry (gate, rule i) (8)

| group | key | before | after | tolerance | detail |
|---|---|---|---|---|---|
| wpt css/CSS2/floats-clear | `wpt\|css/CSS2/floats-clear/floats-153.xht` | pass | fail |  | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): pass -> fail (clean pass lost) |
| wpt css/CSS2/floats | `wpt\|css/CSS2/floats/floats-placement-vertical-003.xht` | pass | fail |  | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): pass -> fail (clean pass lost) |
| wpt css/CSS2/floats | `wpt\|css/CSS2/floats/floats-placement-vertical-004.xht` | pass | fail |  | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): pass -> fail (clean pass lost) |
| wpt css/CSS2/floats | `wpt\|css/CSS2/floats/zero-width-floats.html` | pass | fail |  | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): pass -> fail (clean pass lost) |
| wpt css/CSS2/linebox | `wpt\|css/CSS2/linebox/baseline-block-with-overflow-001.html` | pass | fail |  | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): pass -> fail (clean pass lost) |
| wpt css/CSS2/linebox | `wpt\|css/CSS2/linebox/inline-formatting-context-001.xht` | pass | fail |  | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): pass -> fail (clean pass lost) |
| wpt css/css-break | `wpt\|css/css-break/flexbox/flex-fragmented-with-float-descendant-001.html` | pass | fail |  | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): pass -> fail (clean pass lost) |
| wpt css/css-page | `wpt\|css/css-page/monolithic-overflow-014-print.html` | pass | fail |  | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): pass -> fail (clean pass lost) |

### debt: covered by DEBT.json (class b, not gating) (11)

| group | key | before | after | tolerance | detail |
|---|---|---|---|---|---|
| pdf-probe | `pdf-probe\|danfe\|p1\|CNPJ#1\|dx` | -0.67 | 1.08 | 1 pdf-probe-pt | DEBT-10-danfe-1 (class b, owner blitz:text-position-dx, closes at -): "CNPJ" dx -0.67 -> 1.08 pt: moved 1.75 pt (> 1) and ends 1.08 pt from Chrome (> 1) (I1) — DEBT DEBT-10-danfe-1 |
| pdf-probe | `pdf-probe\|danfe\|p1\|12.345.678/0001-95#1\|dx` | -0.67 | 1.08 | 1 pdf-probe-pt | DEBT-10-danfe-1 (class b, owner blitz:text-position-dx, closes at -): "12.345.678/0001-95" dx -0.67 -> 1.08 pt: moved 1.75 pt (> 1) and ends 1.08 pt from Chrome (> 1) (I1) — DEBT DEBT-10-danfe-1 |
| pdf-probe | `pdf-probe\|danfe\|p1\|CEP#2\|dx` | -8.98 | 1.09 | 1 pdf-probe-pt | DEBT-10-danfe-1 (class b, owner blitz:text-position-dx, closes at -): "CEP" dx -8.98 -> 1.09 pt: moved 10.07 pt (> 1) and ends 1.09 pt from Chrome (> 1) (I1) — DEBT DEBT-10-danfe-1 |
| pdf-probe | `pdf-probe\|danfe\|p1\|04578-000#1\|dx` | -8.98 | 1.09 | 1 pdf-probe-pt | DEBT-10-danfe-1 (class b, owner blitz:text-position-dx, closes at -): "04578-000" dx -8.98 -> 1.09 pt: moved 10.07 pt (> 1) and ends 1.09 pt from Chrome (> 1) (I1) — DEBT DEBT-10-danfe-1 |
| pdf-probe | `pdf-probe\|danfe\|p1\|7.185,22#1\|dx` | -1.24 | 1.01 | 1 pdf-probe-pt | DEBT-10-danfe-2 (class b, owner blitz:text-position-dx, closes at -): "7.185,22" dx -1.24 -> 1.01 pt: moved 2.25 pt (> 1) and ends 1.01 pt from Chrome (> 1) (I1) — DEBT DEBT-10-danfe-2 |
| pdf-probe | `pdf-probe\|danfe\|p1\|003#1\|dx` | -1.13 | 1.12 | 1 pdf-probe-pt | DEBT-10-danfe-2 (class b, owner blitz:text-position-dx, closes at -): "003" dx -1.13 -> 1.12 pt: moved 2.25 pt (> 1) and ends 1.12 pt from Chrome (> 1) (I1) — DEBT DEBT-10-danfe-2 |
| pdf-probe | `pdf-probe\|danfe\|p1\|—#10\|dx` | -1.12 | 1.13 | 1 pdf-probe-pt | DEBT-10-danfe-2 (class b, owner blitz:text-position-dx, closes at -): "—" dx -1.12 -> 1.13 pt: moved 2.25 pt (> 1) and ends 1.13 pt from Chrome (> 1) (I1) — DEBT DEBT-10-danfe-2 |
| pdf-probe | `pdf-probe\|danfe\|p1\|13/01/2027#1\|dx` | -1.11 | 1.14 | 1 pdf-probe-pt | DEBT-10-danfe-2 (class b, owner blitz:text-position-dx, closes at -): "13/01/2027" dx -1.11 -> 1.14 pt: moved 2.25 pt (> 1) and ends 1.14 pt from Chrome (> 1) (I1) — DEBT DEBT-10-danfe-2 |
| pdf-probe | `pdf-probe\|danfe\|p1\|—#11\|dx` | -1.06 | 1.19 | 1 pdf-probe-pt | DEBT-10-danfe-2 (class b, owner blitz:text-position-dx, closes at -): "—" dx -1.06 -> 1.19 pt: moved 2.25 pt (> 1) and ends 1.19 pt from Chrome (> 1) (I1) — DEBT DEBT-10-danfe-2 |
| pdf-probe | `pdf-probe\|danfe\|p1\|R$#3\|dx` | -1.05 | 1.2 | 1 pdf-probe-pt | DEBT-10-danfe-2 (class b, owner blitz:text-position-dx, closes at -): "R$" dx -1.05 -> 1.2 pt: moved 2.25 pt (> 1) and ends 1.2 pt from Chrome (> 1) (I1) — DEBT DEBT-10-danfe-2 |
| pdf-probe | `pdf-probe\|danfe\|p1\|7.185,22#2\|dx` | -1.03 | 1.22 | 1 pdf-probe-pt | DEBT-10-danfe-2 (class b, owner blitz:text-position-dx, closes at -): "7.185,22" dx -1.03 -> 1.22 pt: moved 2.25 pt (> 1) and ends 1.22 pt from Chrome (> 1) (I1) — DEBT DEBT-10-danfe-2 |

## Debt ledger (2 entries; transition checked; passes auto_table_compact_columns, table_percent_widths)

no problem

## Gate canaries (29/29 caught; an uncaught one is an absolute failure)

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
| WPT pass -> fail route (GATE-A3) | real clean pass css/CSS2/abspos/static-fixed-inside-abspos.html -> fail: raw Blitz fails the same way -> b; raw passes -> c; no raw outcome -> c; old page count != Chrome's -> a; a DEBT key with the run's rawOutcome passes GATE-D7, one with another does not | routes {"b":"b","c1":"c","c2":"c","a":"a"}; D7 ok 0, D7 wrong rawOutcome 1 | true |
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

(a) accepted artefacts 0, (b) ledger debt 11, (c) neither 87, declared rejections 10.

| group | key | before | after | tolerance | detail |
|---|---|---|---|---|---|
| wpt css/CSS2/abspos | `wpt\|css/CSS2/abspos/between-float-and-text.html` | pass | fail |  | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): pass -> fail (clean pass lost) |
| wpt css/CSS2/floats-clear | `wpt\|css/CSS2/floats-clear/clear-applies-to-009.xht` | pass | fail |  | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): pass -> fail (clean pass lost) |
| wpt css/CSS2/floats-clear | `wpt\|css/CSS2/floats-clear/clear-float-005.xht` | pass | fail |  | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): pass -> fail (clean pass lost) |
| wpt css/CSS2/floats-clear | `wpt\|css/CSS2/floats-clear/floats-153.xht` | pass | fail |  | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): pass -> fail (clean pass lost) |
| wpt css/CSS2/floats | `wpt\|css/CSS2/floats/float-in-inline-anonymous-block-with-overflow-hidden.html` | pass | fail |  | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): pass -> fail (clean pass lost) |
| wpt css/CSS2/floats | `wpt\|css/CSS2/floats/float-nowrap-2.html` | pass | fail |  | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): pass -> fail (clean pass lost) |
| wpt css/CSS2/floats | `wpt\|css/CSS2/floats/float-nowrap-8.html` | pass | fail |  | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): pass -> fail (clean pass lost) |
| wpt css/CSS2/floats | `wpt\|css/CSS2/floats/floats-placement-vertical-001a.xht` | pass | fail |  | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): pass -> fail (clean pass lost) |
| wpt css/CSS2/floats | `wpt\|css/CSS2/floats/floats-placement-vertical-003.xht` | pass | fail |  | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): pass -> fail (clean pass lost) |
| wpt css/CSS2/floats | `wpt\|css/CSS2/floats/zero-width-floats.html` | pass | fail |  | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): pass -> fail (clean pass lost) |
| wpt css/CSS2/generated-content | `wpt\|css/CSS2/generated-content/after-content-display-012.xht` | pass | fail |  | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): pass -> fail (clean pass lost) |
| wpt css/CSS2/generated-content | `wpt\|css/CSS2/generated-content/after-content-display-013.xht` | pass | fail |  | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): pass -> fail (clean pass lost) |
| wpt css/CSS2/generated-content | `wpt\|css/CSS2/generated-content/before-content-display-012.xht` | pass | fail |  | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): pass -> fail (clean pass lost) |
| wpt css/CSS2/generated-content | `wpt\|css/CSS2/generated-content/before-content-display-013.xht` | pass | fail |  | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): pass -> fail (clean pass lost) |
| wpt css/CSS2/linebox | `wpt\|css/CSS2/linebox/baseline-block-with-overflow-001.html` | pass | fail |  | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): pass -> fail (clean pass lost) |
| wpt css/CSS2/normal-flow | `wpt\|css/CSS2/normal-flow/block-in-inline-float-between-001.xht` | pass | fail |  | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): pass -> fail (clean pass lost) |
| wpt css/CSS2/normal-flow | `wpt\|css/CSS2/normal-flow/inline-table-zorder-001.xht` | pass | fail |  | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): pass -> fail (clean pass lost) |
| wpt css/CSS2/visuren | `wpt\|css/CSS2/visuren/float-inside-inline-between-blocks-1.html` | pass | fail |  | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): pass -> fail (clean pass lost) |
| wpt css/css-break | `wpt\|css/css-break/flexbox/flex-fragmented-with-float-descendant-001.html` | pass | fail |  | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): pass -> fail (clean pass lost) |
| wpt css/css-break | `wpt\|css/css-break/flexbox/multi-line-column-flex-fragmentation-054.html` | pass | fail |  | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): pass -> fail (clean pass lost) |
| wpt css/css-break | `wpt\|css/css-break/flexbox/multi-line-column-flex-fragmentation-055.html` | pass | fail |  | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): pass -> fail (clean pass lost) |
| wpt css/css-break | `wpt\|css/css-break/flexbox/multi-line-column-flex-fragmentation-058.html` | pass | fail |  | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): pass -> fail (clean pass lost) |
| wpt css/css-break | `wpt\|css/css-break/ruby-003.html` | pass | fail |  | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): pass -> fail (clean pass lost) |
| wpt css/css-page | `wpt\|css/css-page/monolithic-overflow-014-print.html` | pass | fail |  | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): pass -> fail (clean pass lost) |
| wpt css/css-text | `wpt\|css/css-text/hanging-punctuation/hanging-punctuation-first-002.html` | pass | fail |  | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): pass -> fail (clean pass lost) |
| wpt css/css-text | `wpt\|css/css-text/tab-size/tab-size-integer-001.html` | pass | fail |  | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): pass -> fail (clean pass lost) |
| wpt css/css-text | `wpt\|css/css-text/tab-size/tab-size-integer-002.html` | pass | fail |  | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): pass -> fail (clean pass lost) |
| wpt css/css-text | `wpt\|css/css-text/tab-size/tab-size-integer-003.html` | pass | fail |  | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): pass -> fail (clean pass lost) |
| wpt css/css-text | `wpt\|css/css-text/text-align/text-align-end-006.html` | pass | fail |  | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): pass -> fail (clean pass lost) |
| wpt css/css-text | `wpt\|css/css-text/text-justify/text-justify-and-trailing-spaces-003.html` | pass | fail |  | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): pass -> fail (clean pass lost) |
| wpt css/css-text | `wpt\|css/css-text/text-justify/text-justify-and-trailing-spaces-004.html` | pass | fail |  | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): pass -> fail (clean pass lost) |
| wpt css/css-text | `wpt\|css/css-text/white-space/text-wrap-balance-text-indent-001.html` | pass | fail |  | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): pass -> fail (clean pass lost) |
| pdf-probe | `pdf-probe\|danfe\|p1\|no#2\|dx` | -4.76 | 1.09 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "no" dx -4.76 -> 1.09 pt: moved 5.85 pt (> 1) and ends 1.09 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|danfe\|p1\|21.773,40#3\|dx` | -7.36 | 1.2 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "21.773,40" dx -7.36 -> 1.2 pt: moved 8.56 pt (> 1) and ends 1.2 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|invoice\|p1\|QTD.#1\|dx` | 1.21 | 4.52 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "QTD." \|dx\| 1.21 -> 4.52 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|invoice\|p1\|40#1\|dx` | 1.2 | 4.51 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "40" \|dx\| 1.2 -> 4.51 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|invoice\|p1\|25#1\|dx` | 1.2 | 4.51 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "25" \|dx\| 1.2 -> 4.51 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|invoice\|p1\|18#1\|dx` | 1.2 | 4.51 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "18" \|dx\| 1.2 -> 4.51 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|invoice\|p1\|60#1\|dx` | 1.2 | 4.51 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "60" \|dx\| 1.2 -> 4.51 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|invoice\|p1\|120#1\|dx` | 1.2 | 4.52 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "120" \|dx\| 1.2 -> 4.52 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|invoice\|p1\|30#1\|dx` | 1.2 | 4.51 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "30" \|dx\| 1.2 -> 4.51 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|invoice\|p1\|22#1\|dx` | 1.2 | 4.51 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "22" \|dx\| 1.2 -> 4.51 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|invoice\|p1\|44#1\|dx` | 1.2 | 4.51 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "44" \|dx\| 1.2 -> 4.51 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|invoice\|p1\|12#2\|dx` | 1.2 | 4.51 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "12" \|dx\| 1.2 -> 4.51 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|invoice\|p1\|24#1\|dx` | 1.2 | 4.51 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "24" \|dx\| 1.2 -> 4.51 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|invoice\|p1\|8#1\|dx` | 1.21 | 4.52 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "8" \|dx\| 1.21 -> 4.52 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|invoice\|p2\|QTD.#1\|dx` | 1.21 | 4.52 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "QTD." \|dx\| 1.21 -> 4.52 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|invoice\|p2\|10#1\|dx` | 1.2 | 4.51 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "10" \|dx\| 1.2 -> 4.51 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|invoice\|p2\|6#1\|dx` | 1.21 | 4.52 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "6" \|dx\| 1.21 -> 4.52 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|invoice\|p2\|30#1\|dx` | 1.2 | 4.51 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "30" \|dx\| 1.2 -> 4.51 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|invoice\|p2\|14#1\|dx` | 1.2 | 4.51 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "14" \|dx\| 1.2 -> 4.51 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|invoice\|p2\|20#1\|dx` | 1.2 | 4.51 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "20" \|dx\| 1.2 -> 4.51 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|invoice\|p2\|5#1\|dx` | 1.21 | 4.52 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "5" \|dx\| 1.21 -> 4.52 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|invoice\|p2\|35#1\|dx` | 1.2 | 4.51 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "35" \|dx\| 1.2 -> 4.51 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|invoice\|p2\|50#1\|dx` | 1.2 | 4.51 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "50" \|dx\| 1.2 -> 4.51 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|invoice\|p2\|28#1\|dx` | 1.2 | 4.51 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "28" \|dx\| 1.2 -> 4.51 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|invoice\|p2\|56#1\|dx` | 1.2 | 4.51 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "56" \|dx\| 1.2 -> 4.51 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|invoice\|p2\|16#1\|dx` | 1.2 | 4.51 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "16" \|dx\| 1.2 -> 4.51 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|invoice\|p2\|64#1\|dx` | 1.2 | 4.51 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "64" \|dx\| 1.2 -> 4.51 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|invoice\|p2\|18#1\|dx` | 1.2 | 4.51 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "18" \|dx\| 1.2 -> 4.51 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|invoice\|p2\|22#1\|dx` | 1.2 | 4.51 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "22" \|dx\| 1.2 -> 4.51 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|invoice\|p2\|22#2\|dx` | 1.2 | 4.51 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "22" \|dx\| 1.2 -> 4.51 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|invoice\|p2\|15#1\|dx` | 1.2 | 4.51 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "15" \|dx\| 1.2 -> 4.51 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|invoice\|p2\|40#1\|dx` | 1.2 | 4.51 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "40" \|dx\| 1.2 -> 4.51 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|invoice\|p2\|8#1\|dx` | 1.21 | 4.52 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "8" \|dx\| 1.21 -> 4.52 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|invoice\|p3\|QTD.#1\|dx` | 1.21 | 4.52 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "QTD." \|dx\| 1.21 -> 4.52 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|invoice\|p3\|30#1\|dx` | 1.2 | 4.51 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "30" \|dx\| 1.2 -> 4.51 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|invoice\|p3\|12#1\|dx` | 1.2 | 4.51 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "12" \|dx\| 1.2 -> 4.51 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|invoice\|p3\|5#1\|dx` | 1.21 | 4.52 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "5" \|dx\| 1.21 -> 4.52 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|invoice\|p3\|1#1\|dx` | 1.21 | 4.52 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "1" \|dx\| 1.21 -> 4.52 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|invoice\|p3\|2#1\|dx` | 1.21 | 4.52 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "2" \|dx\| 1.21 -> 4.52 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|oss-sparksuite-invoice\|p1\|Invoice#1\|dx` | -0.23 | -1.73 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "Invoice" \|dx\| 0.23 -> 1.73 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|oss-sparksuite-invoice\|p1\|#:#1\|dx` | -0.23 | -1.73 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "#:" \|dx\| 0.23 -> 1.73 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|oss-sparksuite-invoice\|p1\|123#1\|dx` | -0.23 | -1.73 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "123" \|dx\| 0.23 -> 1.73 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|oss-sparksuite-invoice\|p1\|Created:#1\|dx` | -0.23 | -1.73 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "Created:" \|dx\| 0.23 -> 1.73 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|oss-sparksuite-invoice\|p1\|January#1\|dx` | -0.23 | -1.73 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "January" \|dx\| 0.23 -> 1.73 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|oss-sparksuite-invoice\|p1\|1,#1\|dx` | -0.23 | -1.73 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "1," \|dx\| 0.23 -> 1.73 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|oss-sparksuite-invoice\|p1\|2023#1\|dx` | -0.23 | -1.73 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "2023" \|dx\| 0.23 -> 1.73 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|oss-sparksuite-invoice\|p1\|Due:#1\|dx` | -0.23 | -1.73 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "Due:" \|dx\| 0.23 -> 1.73 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|oss-sparksuite-invoice\|p1\|February#1\|dx` | -0.23 | -1.73 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "February" \|dx\| 0.23 -> 1.73 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|oss-sparksuite-invoice\|p1\|1,#2\|dx` | -0.23 | -1.73 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "1," \|dx\| 0.23 -> 1.73 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|oss-sparksuite-invoice\|p1\|2023#2\|dx` | -0.23 | -1.73 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "2023" \|dx\| 0.23 -> 1.73 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|oss-sparksuite-invoice\|p1\|Acme#1\|dx` | -0.23 | -1.73 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "Acme" \|dx\| 0.23 -> 1.73 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|oss-sparksuite-invoice\|p1\|Corp.#1\|dx` | -0.23 | -1.73 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "Corp." \|dx\| 0.23 -> 1.73 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|oss-sparksuite-invoice\|p1\|John#1\|dx` | -0.22 | -1.72 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "John" \|dx\| 0.22 -> 1.72 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|oss-sparksuite-invoice\|p1\|Doe#1\|dx` | -0.22 | -1.72 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "Doe" \|dx\| 0.22 -> 1.72 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|oss-sparksuite-invoice\|p1\|john@example.com#1\|dx` | -0.23 | -1.73 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "john@example.com" \|dx\| 0.23 -> 1.73 pt vs Chrome (baseline) |

## Document aggregate vs the published engine (DOC-1..DOC-4)

Verdict FAIL; contract condition 2 PASS, condition 3 FAIL; --main true, --contract true; tolerance median 0.01 mm, <=1 mm share 0.1 pp, missing 0.


| fixture | median mm pin → run | p90 mm pin → run | <=1 mm % pin → run | missing pin → run | pages run / Chrome | worse |
|---|---|---|---|---|---|---|
| invoice | 1.46 → 0.22 | 1.73 → 0.64 | 36 → 93.2 | 0 → 0 | 3 / 3 | - |
| receipt | 5.18 → 0.08 | 77 → 0.16 | 7.9 → 100 | 0 → 0 | 2 / 2 | - |
| boleto | 1.77 → 0.16 | 14.09 → 0.36 | 32 → 100 | 0 → 0 | 1 / 1 | - |
| notification | 0.41 → 0.12 | 1.02 → 0.22 | 86.7 → 100 | 4 → 0 | 1 / 1 | - |
| boleto-febraban | 80.7 → 0.06 | 82.32 → 0.28 | 15.6 → 100 | 8 → 0 | 1 / 1 | - |
| danfe | 17.68 → 0.25 | 37.17 → 0.35 | 8.9 → 100 | 1 → 0 | 1 / 1 | - |
| text-stress-ptbr | 106.22 → 0.08 | 221.05 → 0.31 | 1.4 → 100 | 7 → 0 | 7 / 7 | - |
| oss-sparksuite-invoice | 9.87 → 0.61 | 10.95 → 0.61 | 0 → 100 | 0 → 0 | 1 / 1 | - |
| oss-postmark-receipt | 0.66 → 0.19 | 18.19 → 0.32 | 40 → 75 | 39 → 39 | 1 / 2 | - |

## WPT per directory (pass / clean pass)

| directory | pass before | pass after | clean before | clean after |
|---|---|---|---|---|
| css/CSS2/abspos | 2 | 2 | 2 | 2 |
| css/CSS2/backgrounds | 175 | 175 | 67 | 67 |
| css/CSS2/borders | 383 | 409 | 354 | 396 |
| css/CSS2/box | 4 | 4 | 0 | 0 |
| css/CSS2/box-display | 66 | 66 | 66 | 66 |
| css/CSS2/colors | 10 | 10 | 10 | 10 |
| css/CSS2/floats | 19 | 19 | 16 | 16 |
| css/CSS2/floats-clear | 38 | 38 | 33 | 33 |
| css/CSS2/fonts | 135 | 135 | 135 | 135 |
| css/CSS2/generated-content | 82 | 82 | 78 | 78 |
| css/CSS2/linebox | 150 | 151 | 148 | 149 |
| css/CSS2/lists | 67 | 67 | 40 | 40 |
| css/CSS2/margin-padding-clear | 527 | 527 | 510 | 510 |
| css/CSS2/normal-flow | 443 | 444 | 417 | 418 |
| css/CSS2/pagination | 34 | 34 | 32 | 32 |
| css/CSS2/positioning | 361 | 361 | 359 | 359 |
| css/CSS2/tables | 77 | 94 | 74 | 89 |
| css/CSS2/text | 250 | 250 | 241 | 241 |
| css/CSS2/visudet | 14 | 14 | 9 | 9 |
| css/CSS2/visufx | 2 | 2 | 2 | 2 |
| css/CSS2/visuren | 6 | 6 | 6 | 6 |
| css/css-break | 115 | 115 | 81 | 81 |
| css/css-page | 70 | 70 | 55 | 55 |
| css/css-tables | 47 | 60 | 38 | 55 |
| css/css-text | 632 | 634 | 379 | 379 |

## Per group

| group | classes |
|---|---|
| corpus BOL-R | improvement 4 |
| corpus DANFE-L | improvement 5 |
| corpus DANFE-M | improvement 3 |
| corpus DANFE-P | improvement 2 |
| corpus DANFE-R | improvement 1, newly-measured 1 |
| corpus LET- | improvement 1 |
| corpus TXT-A | improvement 1 |
| corpus TXT-P | improvement 2 |
| corpus TXT-R | improvement 1 |
| doc-aggregate | contract-pages 1 |
| oracles:layout LET-1 | improvement 2 |
| oracles:layout REF-P | improvement 4 |
| oracles:layout REF-W | improvement 20 |
| oracles:text EXT-2 | improvement 9 |
| pdf-probe | within-tolerance 527, improvement 2227, newly-measured 1122, pin-c 55 |
| wpt css/CSS2/abspos | pin-c 1 |
| wpt css/CSS2/borders | improvement 42, reported 16 |
| wpt css/CSS2/floats | pin-c 6 |
| wpt css/CSS2/floats-clear | pin-c 3 |
| wpt css/CSS2/generated-content | pin-c 4 |
| wpt css/CSS2/linebox | improvement 1, pin-c 1 |
| wpt css/CSS2/normal-flow | improvement 1, pin-c 2 |
| wpt css/CSS2/tables | improvement 17 |
| wpt css/CSS2/visuren | pin-c 1 |
| wpt css/css-break | pin-c 5 |
| wpt css/css-page | pin-c 1 |
| wpt css/css-tables | improvement 17, reported 1 |
| wpt css/css-text | improvement 2, pin-c 8 |

## Tolerances

| class | tolerance | label | rationale |
|---|---|---|---|
| position-mm | 0.1 mm | DESIGN TARGET | word/anchor position error vs a reference (REF-W max/p95, REF-R worst anchor, DANFE-L1, LET-1). 0.1 mm (0.28 pt, 0.38 CSS px) is 10x the 0.01 mm the values are reported with and below one CSS px (0.26 mm), the smallest step a px-snapping layout can move; the measurement is deterministic for one build and one reference (CONFIRMED: equal inputs gave equal values in the Phase A repeat run). |
| geometry-excess-mm | 0.05 mm | DESIGN TARGET | distance OUTSIDE a specification window (BOL-G*, DANFE-B*, DANFE-M1, TXT-A1). Inside the window the spec admits any value, so only the excess is ratcheted; 0.05 mm is about one 600 dpi raster pixel (0.042 mm), the measurement quantum of measure_bars.py / the page ink box. |
| font-excess-pt | 0.05 pt | SPEC-derived tolerance unit | font-size excess outside a window; 0.05 pt is the tolerance ACCEPTANCE.md already applies to every font-size criterion (BOL-T*, DANFE-F*). |
| count | 0 count | DESIGN TARGET | integer counts from deterministic tools (required strings found, extractor missing/extra tokens, segments/glyphs attributed, decoded symbols): any loss is a real change of the document. |
| page-delta | 0 pages | DESIGN TARGET | \|vellora pages - reference pages\|: a page break moving is never noise. |
| pdf-probe-pt | 1 pt | DESIGN TARGET | per-word \|dx\| / \|dy\| of vellora's PDF vs Chrome's PDF (pdf-probe semantics 2: PyMuPDF pen origin and baseline, same-page position pairs keyed by the Chrome word). 1 pt (0.35 mm) is an order of magnitude below the Phase A regressions it must catch (invoice price column +9 pt, notification signature -14 pt) and above the 0.01 pt rounding of the probe and sub-px snapping differences. The per-fixture unpaired-word counts use the count class. |

