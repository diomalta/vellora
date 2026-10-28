# Fidelity gate report

**Verdict: PASS** (0 gating item(s) vs the previous link, 0 vs the chain head fidelity/baselines/port/00-start; 0 flagged WPT pass(es) lost, reported, not gating; 0 value(s) worse within tolerance, listed, not gating; pin view: merge to main OK, 0 (c) item(s)). Local macOS runs are INDICATIVE.

| field | value |
|---|---|
| date | 2026-10-28T11:19:27.811Z |
| command | `node fidelity/gate/run.mjs --baseline fidelity/baselines/port/11-phase-c --run ~/Repositories/vellora-fidelity-runs/run-all-c07-tip-20261028T110750Z-blitz-0.3.0-beta.4-vellora-aa41259 --head fidelity/baselines/port/00-start --pin fidelity/baselines/pin --layout-from ~/Repositories/vellora-fidelity-runs/run-all-c07-tip-20261028T110750Z-blitz-0.3.0-beta.4-vellora-aa41259 --debt fidelity/baselines/port/DEBT.json --step 16-phase-c-07-tip --accept fidelity/gate/snapshots/2026-10-28/c07/accepted.json --doc-aggregate ~/Repositories/vellora-fidelity-runs/run-all-c07-tip-20261028T110750Z-blitz-0.3.0-beta.4-vellora-aa41259/doc-aggregate/summary.json --contract --out ~/Repositories/vellora-fidelity-runs/c07-tip/regate-contract` |
| baseline | fidelity/baselines/port/11-phase-c (vellora-fidelity/baseline/2) |
| run | ~/Repositories/vellora-fidelity-runs/run-all-c07-tip-20261028T110750Z-blitz-0.3.0-beta.4-vellora-aa41259 (vellora-fidelity/run-all/1) |
| os / cpu | darwin 27.0.0 arm64 (macOS 27.0.1) / Apple M5 Pro |
| node / rustc | v22.23.2 / rustc 1.96.0 (ac68faa20 2026-05-25) |
| chrome | Google Chrome for Testing 155.0.8059.85 |
| blitz | 0.3.0-beta.4 registry+https://github.com/rust-lang/crates.io-index |
| git | phasec/07-tip aa4125931fd60c30faba8b1f9b988ebef76daa48 (0 dirty) |

Counts: improvement 8, gating 0, headGating 0, debt 1, flaggedPassLost 0, unchanged 18392, withinTolerance 0, withinToleranceBetter 0, missingTokensNotComparable 0, pinA 5, pinB 1, pinC 0, docRegressions 0, contractPagesFailing 0.

## Absolute failures of the run (gate, cannot be accepted)

none

## Regressions beyond tolerance (gate)

none outside WPT

## Accepted regressions (acceptedRegressions, with evidence)

none

Acceptance entries that matched nothing (stale or mistyped):

- `pdf-probe\|oss-postmark-receipt\|p1\|[Product#2\|pairing`: The OLD pair was an oracle artefact: Chrome's PDF draws the masthead "[Product Name]" twice, the text (#1, #A8AAAF, baseline 57.75 pt) and its `text-shadow: 0 1px 0 white` copy (#2, #FFFFFF, baseline 58.50 pt, 1 px = 0.75 pt lower); vellora draws no text-shadow, so it has one instance. At 09 that instance (baseline 61.35 pt) paired with the white shadow copy #2; at 10-spark the cellspacing/cellpadding hints put it at 57.60 pt and it pairs with the text #1 (dy -0.15 pt, newly measured). No text was lost.
- `pdf-probe\|oss-postmark-receipt\|p1\|Name]#2\|pairing`: Same word as [Product#2: the second half of the masthead "[Product Name]", whose Chrome #2 instance is the white text-shadow copy (baseline 58.50 pt). vellora's single instance now pairs with the text #1 (p1\|Name]#1, dx -0.90 dy -0.15 pt, newly measured).
- `wpt\|css/CSS2/pagination/float-page-break-inside-avoid-1-print.html`: pass -> fail. The OLD pass was false by page count (GATE-A3 (a)): vellora's old test and reference each printed 2 page(s) and matched, while Chrome prints 3 pages for both. Before Phase C step 03 a fragment taller than a page was moved whole onto its own page and bled past it, which happened to look like the reference's forced break. Now the test prints Chrome's 3 pages (the oversize `break-inside: avoid` table/row starts a fresh page and is cut there); the reference table-page-break-inside-avoid-print-ref.html (`<p style="page-break-after:always">`) relies on `page-break-after`, which vellora does not implement (COMPATIBILITY.md), so it still prints 2 pages (1 for row-...-2) and the two differ. Next step: break-after.
- `wpt\|css/CSS2/pagination/row-page-break-inside-avoid-2-print.html`: pass -> fail. The OLD pass was false by page count (GATE-A3 (a)): vellora's old test and reference each printed 1 page(s) and matched, while Chrome prints 3 pages for both. Before Phase C step 03 a fragment taller than a page was moved whole onto its own page and bled past it, which happened to look like the reference's forced break. Now the test prints Chrome's 3 pages (the oversize `break-inside: avoid` table/row starts a fresh page and is cut there); the reference rowgroup-page-break-inside-avoid-5-print-ref.html (`thead { page-break-after:always }`) relies on `page-break-after`, which vellora does not implement (COMPATIBILITY.md), so it still prints 2 pages (1 for row-...-2) and the two differ. Next step: break-after.
- `wpt\|css/CSS2/pagination/rowgroup-page-break-inside-avoid-2-print.html`: pass -> fail. The OLD pass was false by page count (GATE-A3 (a)): vellora's old test and reference each printed 2 page(s) and matched, while Chrome prints 3 pages for both. Before Phase C step 03 a fragment taller than a page was moved whole onto its own page and bled past it, which happened to look like the reference's forced break. Now the test prints Chrome's 3 pages (the oversize `break-inside: avoid` table/row starts a fresh page and is cut there); the reference table-page-break-inside-avoid-print-ref.html (`<p style="page-break-after:always">`) relies on `page-break-after`, which vellora does not implement (COMPATIBILITY.md), so it still prints 2 pages (1 for row-...-2) and the two differ. Next step: break-after.
- `wpt\|css/CSS2/pagination/rowgroup-page-break-inside-avoid-3-print.html`: pass -> fail. The OLD pass was false by page count (GATE-A3 (a)): vellora's old test and reference each printed 2 page(s) and matched, while Chrome prints 3 pages for both. Before Phase C step 03 a fragment taller than a page was moved whole onto its own page and bled past it, which happened to look like the reference's forced break. Now the test prints Chrome's 3 pages (the oversize `break-inside: avoid` table/row starts a fresh page and is cut there); the reference table-page-break-inside-avoid-print-ref.html (`<p style="page-break-after:always">`) relies on `page-break-after`, which vellora does not implement (COMPATIBILITY.md), so it still prints 2 pages (1 for row-...-2) and the two differ. Next step: break-after.
- `wpt\|css/CSS2/pagination/table-page-break-inside-avoid-1-print.html`: pass -> fail. The OLD pass was false by page count (GATE-A3 (a)): vellora's old test and reference each printed 2 page(s) and matched, while Chrome prints 3 pages for both. Before Phase C step 03 a fragment taller than a page was moved whole onto its own page and bled past it, which happened to look like the reference's forced break. Now the test prints Chrome's 3 pages (the oversize `break-inside: avoid` table/row starts a fresh page and is cut there); the reference table-page-break-inside-avoid-print-ref.html (`<p style="page-break-after:always">`) relies on `page-break-after`, which vellora does not implement (COMPATIBILITY.md), so it still prints 2 pages (1 for row-...-2) and the two differ. Next step: break-after.
- `wpt\|css/CSS2/pagination/table-page-break-inside-avoid-2-print.html`: pass -> fail. The OLD pass was false by page count (GATE-A3 (a)): vellora's old test and reference each printed 2 page(s) and matched, while Chrome prints 3 pages for both. Before Phase C step 03 a fragment taller than a page was moved whole onto its own page and bled past it, which happened to look like the reference's forced break. Now the test prints Chrome's 3 pages (the oversize `break-inside: avoid` table/row starts a fresh page and is cut there); the reference table-page-break-inside-avoid-2-print-ref.html (`<div style="page-break-after: always">`) relies on `page-break-after`, which vellora does not implement (COMPATIBILITY.md), so it still prints 2 pages (1 for row-...-2) and the two differ. Next step: break-after.
- `wpt\|css/css-page/page-name-flex-001-print.html`: pass -> fail. The OLD pass was false by page count (GATE-A3 (a)): vellora's old test and reference each printed 1 page and matched, while Chrome prints 4 page(s) for the test and 1 for the reference (Chrome pageCounts [4, 1]). The test forces its page breaks with named pages (`page: <name>` on flex items, CSS Page 3 §4.1), which vellora ignored until Phase C step 04. vellora now breaks at each change of page name: the test prints 4 page(s) (Chrome 4) and the reference 1 (Chrome 1). vellora now matches Chrome's page count on both sides. Chrome fails this test itself (chrome outcome fail): its test and reference page counts differ. Reason text corrected in Phase C step 05 (step-4 verify finding 5: it said "Chrome prints N pages for both", contradicting its own evidence).
- `wpt\|css/css-page/page-name-flex-002-print.html`: pass -> fail. The OLD pass was false by page count (GATE-A3 (a)): vellora's old test and reference each printed 1 page and matched, while Chrome prints 3 page(s) for the test and 1 for the reference (Chrome pageCounts [3, 1]). The test forces its page breaks with named pages (`page: <name>` on flex items, CSS Page 3 §4.1), which vellora ignored until Phase C step 04. vellora now breaks at each change of page name: the test prints 3 page(s) (Chrome 3) and the reference 1 (Chrome 1). vellora now matches Chrome's page count on both sides. Chrome fails this test itself (chrome outcome fail): its test and reference page counts differ. Reason text corrected in Phase C step 05 (step-4 verify finding 5: it said "Chrome prints N pages for both", contradicting its own evidence).
- `wpt\|css/css-page/page-name-flex-004-print.html`: pass -> fail. The OLD pass was false by page count (GATE-A3 (a)): vellora's old test and reference each printed 1 page and matched, while Chrome prints 4 page(s) for the test and 2 for the reference (Chrome pageCounts [4, 2]). The test forces its page breaks with named pages (`page: <name>` on flex items, CSS Page 3 §4.1), which vellora ignored until Phase C step 04. vellora now breaks at each change of page name: the test prints 3 page(s) (Chrome 4) and the reference 1 (Chrome 2). This is still a real gap: vellora [3, 1] vs Chrome [4, 2] (the remaining difference is not part of this acceptance; the acceptance binds only the outcome `fail`). Chrome fails this test itself (chrome outcome fail): its test and reference page counts differ. Reason text corrected in Phase C step 05 (step-4 verify finding 5: it said "Chrome prints N pages for both", contradicting its own evidence).
- `wpt\|css/css-text/hanging-punctuation/hanging-punctuation-first-002.html`: pass -> fail vs the pin (shipped main). The OLD pass was false: the published engine drops a U+3000 IDEOGRAPHIC SPACE that starts a line, whatever `hanging-punctuation` says (U+3000 is not collapsible white space, CSS Text 3 §4.1), so the down arrow sat at the reference's x without anything hanging; removing the property from the test does not change the pin's render. Neither engine supports the property: `hanging-punctuation` is absent from Stylo 0.18.0 (the pin's) and 0.22.0 (beta.4's), so the declaration is dropped in both. A 1 em ideographic space that does not hang is what the spec gives without the property, and Chrome 155 (which does not implement hanging-punctuation) renders exactly that and fails the test too. The tip lays out U+3000 with its 40 px advance and the arrow 40 px to the right, like Chrome. Accepted as class a by orchestrator decision (a), 2026-10-28; the pin behaviour was UNVERIFIED by the step-4 verifier and is CONFIRMED by Phase C step 05 (evidence 5, 6).
- `wpt\|css/CSS2/floats/float-nowrap-8.html`: Pin view only: pass at the pin (published v0.2.0, 5810062), fail on this branch. NOT a ratchet regression: the test FAILED at port/10-integration (fidelity/baselines/port/10-integration/wpt/expectations-blitz-0.3.0-beta.4.json: "fail"; its run 20261023T004510Z, copy run-all-10-tip-..., outcome fail, rawOutcome fail) and at the head port/00-start ("fail"); it passed only at the c04 tip, which is not a baseline. (1) Chrome itself fails the test: Chrome 155 keeps the float on the line when the text before it fits beside it ('Some ' + a 5ch float in a 10ch line), while the reference float-nowrap-1 has it below the line (Gecko's rule). vellora now follows Chrome (orchestrator decision (b), product target = Chrome) and fails it the same way: maxDifference 255 / 1169 px vs Chrome's 255 / 1159 px, ink bbox [8,8,277,46] vs Chrome's [9,8,278,46]. (2) The OLD pin pass was false: Blitz's floats cargo feature was off at the pin, and the pin build renders the test, its reference float-nowrap-1.html AND float-nowrap-1-notref.html (the reference float-nowrap-1 must DIFFER from) byte-identically, the blue box drawn over the start of the line in all three, so the pin could not place the float at all.

## Declared strict-gate rejections (declaredRejections, 0)

none

## Reported, not gating (0)

none

## Improvements (8)

none outside WPT

WPT/crashtest improvements: 8 (listed in gate-report.json).

## Worse within tolerance (0; not gating, counted; the head ratchet sums them)

none

## Head ratchet vs fidelity/baselines/port/00-start (GATE-H1): PASS

Every item worse than the chain head beyond its tolerance gates unless a class-a acceptance of this step (13 counted, 0 legacy/other ignored) or a DEBT.json entry within its ceiling covers it. Counts: debt 1, declared 10, accepted 5, gating 0, improvement 4570, withinTolerance 1163, flaggedPassLost 40.

### debt: covered by DEBT.json (class b, not gating) (1)

| group | key | before | after | tolerance | detail |
|---|---|---|---|---|---|
| wpt css/css-break | `wpt\|css/css-break/flexbox/flex-fragmented-with-float-descendant-001.html` | pass | pass |  | DEBT-10-wpt-1 (class b, owner blitz:wpt-raw-fail, closes at -): pass -> pass[ink-displaced-vs-chrome] (clean pass became suspect: vellora lost/moved Chrome's ink) — DEBT DEBT-10-wpt-1 |

## Debt ledger (1 entries; transition checked; passes auto_table_compact_columns, table_percent_widths)

no problem

## Gate canaries (32/32 caught; an uncaught one is an absolute failure)

| canary | must report | observed | caught |
|---|---|---|---|
| head ratchet: \|dy\| +0.6 pt per step over two steps | real word boleto p1\|RECIBO#1: vs previous link within-tolerance (listed, not gating); vs head regression; no DEBT entry -> head-regression | previous within-tolerance; head regression; ledger head-regression | true |
| WPT fail -> unsupported (new strict-gate rejection) | real test css/CSS2/abspos/abspos-containing-block-initial-004a.xht: gating rejection; declared with its feature -> declared | undeclared rejection/true; declared declared/false | true |
| verdict row -> strict gate rejected | real row invoice PDF-Q1 oracles:qpdf: gating rejection with its feature | rejection:canary:planted-rejection | true |
| verdict row measured -> NOT-RUN | real row invoice PDF-Q1 oracles:qpdf: gating regression | regression | true |
| WPT flagged pass lost | real flagged pass css/CSS2/backgrounds/background-attachment-009.xht: reported, not gating, counts.flaggedPassLost 1 | reported/false; flaggedPassLost 1; verdict PASS | true |
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

## Pin view vs fidelity/baselines/pin (GATE-H3): merge to main OK (gating: --main)

(a) accepted artefacts 5, (b) ledger debt 1, (c) neither 0, declared rejections 10.


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
| css/CSS2/abspos | 6 | 6 | 6 | 6 |
| css/CSS2/backgrounds | 174 | 174 | 69 | 69 |
| css/CSS2/borders | 424 | 424 | 415 | 415 |
| css/CSS2/box | 4 | 4 | 0 | 0 |
| css/CSS2/box-display | 67 | 67 | 67 | 67 |
| css/CSS2/colors | 10 | 10 | 10 | 10 |
| css/CSS2/floats | 62 | 65 | 58 | 61 |
| css/CSS2/floats-clear | 161 | 161 | 147 | 147 |
| css/CSS2/fonts | 138 | 138 | 138 | 138 |
| css/CSS2/generated-content | 86 | 86 | 83 | 83 |
| css/CSS2/linebox | 160 | 161 | 157 | 158 |
| css/CSS2/lists | 67 | 67 | 40 | 40 |
| css/CSS2/margin-padding-clear | 652 | 652 | 633 | 633 |
| css/CSS2/normal-flow | 458 | 458 | 442 | 442 |
| css/CSS2/pagination | 39 | 39 | 39 | 39 |
| css/CSS2/positioning | 397 | 397 | 395 | 395 |
| css/CSS2/tables | 121 | 121 | 113 | 113 |
| css/CSS2/text | 262 | 262 | 254 | 254 |
| css/CSS2/visudet | 15 | 16 | 10 | 11 |
| css/CSS2/visufx | 2 | 2 | 2 | 2 |
| css/CSS2/visuren | 10 | 10 | 10 | 10 |
| css/css-break | 395 | 397 | 371 | 372 |
| css/css-page | 90 | 90 | 80 | 80 |
| css/css-tables | 70 | 70 | 63 | 63 |
| css/css-text | 675 | 676 | 419 | 420 |

## Per group

| group | classes |
|---|---|
| wpt css/CSS2/floats | improvement 3 |
| wpt css/CSS2/linebox | improvement 1 |
| wpt css/CSS2/visudet | improvement 1 |
| wpt css/css-break | improvement 2 |
| wpt css/css-text | improvement 1 |

## Tolerances

| class | tolerance | label | rationale |
|---|---|---|---|
| position-mm | 0.1 mm | DESIGN TARGET | word/anchor position error vs a reference (REF-W max/p95, REF-R worst anchor, DANFE-L1, LET-1). 0.1 mm (0.28 pt, 0.38 CSS px) is 10x the 0.01 mm the values are reported with and below one CSS px (0.26 mm), the smallest step a px-snapping layout can move; the measurement is deterministic for one build and one reference (CONFIRMED: equal inputs gave equal values in the Phase A repeat run). |
| geometry-excess-mm | 0.05 mm | DESIGN TARGET | distance OUTSIDE a specification window (BOL-G*, DANFE-B*, DANFE-M1, TXT-A1). Inside the window the spec admits any value, so only the excess is ratcheted; 0.05 mm is about one 600 dpi raster pixel (0.042 mm), the measurement quantum of measure_bars.py / the page ink box. |
| font-excess-pt | 0.05 pt | SPEC-derived tolerance unit | font-size excess outside a window; 0.05 pt is the tolerance ACCEPTANCE.md already applies to every font-size criterion (BOL-T*, DANFE-F*). |
| count | 0 count | DESIGN TARGET | integer counts from deterministic tools (required strings found, extractor missing/extra tokens, segments/glyphs attributed, decoded symbols): any loss is a real change of the document. |
| page-delta | 0 pages | DESIGN TARGET | \|vellora pages - reference pages\|: a page break moving is never noise. |
| pdf-probe-pt | 1 pt | DESIGN TARGET | per-word \|dx\| / \|dy\| of vellora's PDF vs Chrome's PDF (pdf-probe semantics 2: PyMuPDF pen origin and baseline, same-page position pairs keyed by the Chrome word). 1 pt (0.35 mm) is an order of magnitude below the Phase A regressions it must catch (invoice price column +9 pt, notification signature -14 pt) and above the 0.01 pt rounding of the probe and sub-px snapping differences. The per-fixture unpaired-word counts use the count class. |

