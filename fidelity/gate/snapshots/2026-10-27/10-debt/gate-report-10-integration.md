# Fidelity gate report

**Verdict: FAIL** (0 gating item(s) vs the previous link, 145 vs the chain head fidelity/baselines/port/00-start; 0 flagged WPT pass(es) lost, reported, not gating; 327 value(s) worse within tolerance, listed, not gating; pin view: merge to main BLOCKED, 217 (c) item(s)). Local macOS runs are INDICATIVE.

| field | value |
|---|---|
| date | 2026-10-27T13:14:00.728Z |
| command | `node fidelity/gate/run.mjs --baseline fidelity/baselines/port/09-review-fixes --run ~/Repositories/vellora-fidelity-runs/run-all-10-tip-20261023T004536Z-blitz-0.3.0-beta.4-vellora-a293cf5 --accept fidelity/gate/snapshots/2026-10-27/10-debt/accepted.json --head fidelity/baselines/port/00-start --pin fidelity/baselines/pin --layout-from ~/Repositories/vellora-fidelity-runs/run-all-10-tip-20261023T004536Z-blitz-0.3.0-beta.4-vellora-a293cf5 --debt fidelity/baselines/port/DEBT.json --step 10-integration --out <scratch>/regate3` |
| baseline | fidelity/baselines/port/09-review-fixes (vellora-fidelity/baseline/2) |
| run | ../../../../vellora-fidelity-runs/run-all-10-tip-20261023T004536Z-blitz-0.3.0-beta.4-vellora-a293cf5 (vellora-fidelity/run-all/1) |
| os / cpu | darwin 27.0.0 arm64 (macOS 27.0.1) / Apple M5 Pro |
| node / rustc | v22.23.2 / rustc 1.96.0 (ac68faa20 2026-05-25) |
| chrome | Google Chrome 155.0.8059.85 |
| blitz | 0.3.0-beta.4 registry+https://github.com/rust-lang/crates.io-index |
| git | phaseb/10-tip a293cf5913e07621758a2832cec1de019e44d278 (0 dirty) |

Counts: improvement 93, added 5, within-tolerance 327, newly-measured 39, accepted 3, gating 0, headGating 145, debt 1024, flaggedPassLost 0, unchanged 14486, withinTolerance 327, withinToleranceBetter 1, missingTokensNotComparable 0, pinA 1, pinB 641, pinC 217.

## Absolute failures of the run (gate, cannot be accepted)

none

## Regressions beyond tolerance (gate)

none outside WPT

## Accepted regressions (acceptedRegressions, with evidence)

| group | key | before | after | tolerance | detail |
|---|---|---|---|---|---|
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|[Product#2\|pairing` | dx -0.9 dy 2.85 | unpaired |  | Chrome's "[Product" (page 1) lost its vellora counterpart: missing, on another page, or more than 36 pt away — ACCEPTED: The OLD pair was an oracle artefact: Chrome's PDF draws the masthead "[Product Name]" twice, the text (#1, #A8AAAF, baseline 57.75 pt) and its `text-shadow: 0 1px 0 white` copy (#2, #FFFFFF, baseline 58.50 pt, 1 px = 0.75 pt lower); vellora draws no text-shadow, so it has one instance. At 09 that instance (baseline 61.35 pt) paired with the white shadow copy #2; at 10-spark the cellspacing/cellpadding hints put it at 57.60 pt and it pairs with the text #1 (dy -0.15 pt, newly measured). No text was lost. (evidence: PyMuPDF rawdict of ~/.cache/vellora-fidelity/run-all-10-spark-20261023T002146Z/layout-diff/oss-postmark-receipt/run-all/chrome.pdf: span '[Product Name]' at (253.453, 58.5) color 0xffffff and at (253.453, 57.75) color 0xa8aaaf; vellora.pdf: one span at (252.55, 57.596) color 0xa8aaaf; fixtures/oss-postmark-receipt/index.html .email-masthead_name { text-shadow: 0 1px 0 white }; the same run's pdf-probe pairs p1\|[Product#1 at dx -0.90 dy -0.15 (2026-10-22, darwin arm64, Chrome 155.0.8059.85, INDICATIVE) Re-checked 2026-10-27 on the 10-tip run copy (~/Repositories/vellora-fidelity-runs/run-all-10-tip-20261023T004536Z-blitz-0.3.0-beta.4-vellora-a293cf5/layout-diff/oss-postmark-receipt/run-all/, PyMuPDF 1.28.2 rawdict, fidelity/.venv): chrome.pdf p1 '[Product Name]' at (253.453, 58.5) #ffffff and (253.453, 57.75) #a8aaaf; vellora.pdf p1 one '[Product Name]' at (252.55, 57.596) #a8aaaf; 'Download as PDF' vellora p1 baseline 815.846 pt on an 841.92 pt page, Chrome p2 46.5 pt. The ~/.cache run copy cited above is gone (loss event, ~/Repositories/vellora-fidelity-runs/INTEGRATION-TODO.md).) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|Name]#2\|pairing` | dx -0.9 dy 2.85 | unpaired |  | Chrome's "Name]" (page 1) lost its vellora counterpart: missing, on another page, or more than 36 pt away — ACCEPTED: Same word as [Product#2: the second half of the masthead "[Product Name]", whose Chrome #2 instance is the white text-shadow copy (baseline 58.50 pt). vellora's single instance now pairs with the text #1 (p1\|Name]#1, dx -0.90 dy -0.15 pt, newly measured). (evidence: As for pdf-probe\|oss-postmark-receipt\|p1\|[Product#2\|pairing (same spans, same run). Re-checked 2026-10-27 on the 10-tip run copy (~/Repositories/vellora-fidelity-runs/run-all-10-tip-20261023T004536Z-blitz-0.3.0-beta.4-vellora-a293cf5/layout-diff/oss-postmark-receipt/run-all/, PyMuPDF 1.28.2 rawdict, fidelity/.venv): chrome.pdf p1 '[Product Name]' at (253.453, 58.5) #ffffff and (253.453, 57.75) #a8aaaf; vellora.pdf p1 one '[Product Name]' at (252.55, 57.596) #a8aaaf; 'Download as PDF' vellora p1 baseline 815.846 pt on an 841.92 pt page, Chrome p2 46.5 pt. The ~/.cache run copy cited above is gone (loss event, ~/Repositories/vellora-fidelity-runs/INTEGRATION-TODO.md).) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|unpaired-vellora` | 0 | 3 | 0 count | vellora words Chrome lacks: 0 -> 3 (e.g. "Download" p1, "as" p1, "PDF" p1) — ACCEPTED: The OLD count 0 was false: at 09 the 3 words "Download as PDF" were drawn below the page (baseline 855.60 pt on an 841.92 pt page), where PyMuPDF's page words do not report them (fidelity/ACCEPTANCE.md GATE-P1, the documented step-08 case). 09's own pdf-probe section lists them in offPage.vellora. At 10-spark they are inside page 1 (baseline 815.85 pt), visible, so they are counted; Chrome prints them on page 2 (the known oversize-block gap: vellora does not fragment the layout table). Off-page vellora words go 40 -> 37 (Download, as, PDF), none added. (evidence: fidelity/baselines/port/09-review-fixes/pdf-probe/oss-postmark-receipt.json offPage.vellora: Download/as/PDF at y 855.6; ~/.cache/vellora-fidelity/run-all-10-spark-20261023T002146Z/layout-diff/oss-postmark-receipt/run-all/pdf-probe.json unpairedVellora: Download/as/PDF at y 815.85 page 1, offPage.vellora 37 words, a per-text multiset that contains no text more often than 09's (2026-10-22, INDICATIVE) Re-checked 2026-10-27 on the 10-tip run copy (~/Repositories/vellora-fidelity-runs/run-all-10-tip-20261023T004536Z-blitz-0.3.0-beta.4-vellora-a293cf5/layout-diff/oss-postmark-receipt/run-all/, PyMuPDF 1.28.2 rawdict, fidelity/.venv): chrome.pdf p1 '[Product Name]' at (253.453, 58.5) #ffffff and (253.453, 57.75) #a8aaaf; vellora.pdf p1 one '[Product Name]' at (252.55, 57.596) #a8aaaf; 'Download as PDF' vellora p1 baseline 815.846 pt on an 841.92 pt page, Chrome p2 46.5 pt. The ~/.cache run copy cited above is gone (loss event, ~/Repositories/vellora-fidelity-runs/INTEGRATION-TODO.md).) |

Acceptance entries that matched nothing (stale or mistyped):

- `wpt\|css/css-page/monolithic-overflow-014-print.html`: pass -> fail vs the head (port/00-start). The OLD pass was false by page count (GATE-A3 (a)): vellora's old test and reference each printed 2 pages and matched, while Chrome prints 4 pages for both (the 350vh monolithic inline-block); same wrong picture on both sides (old ink 92160 px, bbox [48, 48, 431, 287] vs Chrome 73728 px, bbox [48, 48, 431, 239]). At 10-tip the test still prints 2 pages, now differs from the 2-page reference (maxDifference 255). Not route (b): raw Blitz fails differently (pages [4, 1], pageCountMismatch).

## Declared strict-gate rejections (declaredRejections, 0)

none

## Reported, not gating (0)

none

## Improvements (93)

| group | key | before | after | tolerance | detail |
|---|---|---|---|---|---|
| corpus INV-R | `oss-postmark-receipt\|INV-R1\|corpus\|\|criterion#1` | FAIL | PASS |  | worst RCP-S4 10.26 mm (tol 1) -> worst RCP-S1 0.18 mm (tol 1) |
| corpus INV-R | `oss-sparksuite-invoice\|INV-R1\|corpus\|\|criterion#1` | FAIL | PASS |  | worst INV-S4 4.15 mm (tol 1) -> worst INV-S4 0.61 mm (tol 1) |
| oracles:text EXT-2 | `invoice\|EXT-2\|oracles:text\|plain\|criterion#1\|statusRank.pdfminer.six` | 2 | 3 | 0 count | 2 -> 3 |
| oracles:layout REF-W | `invoice\|REF-W\|oracles:layout\|plain\|criterion#1\|maxMm` | 2.53 | 1.68 | 0.1 position-mm | 2.53 -> 1.68 |
| oracles:layout REF-W | `invoice\|REF-W\|oracles:layout\|plain\|criterion#1\|p95Mm` | 2.51 | 1.55 | 0.1 position-mm | 2.51 -> 1.55 |
| corpus INV-R | `oss-postmark-receipt\|INV-R1\|corpus\|\|criterion#1\|worstMm` | 10.26 | 0.18 | 0.1 position-mm | 10.26 -> 0.18 |
| oracles:text EXT-2 | `oss-postmark-receipt\|EXT-2\|oracles:text\|plain\|criterion#1\|missing.pdftotext` | 38 | 35 | 0 count | 38 -> 35 |
| oracles:text EXT-2 | `oss-postmark-receipt\|EXT-2\|oracles:text\|plain\|criterion#1\|missing.pymupdf` | 40 | 37 | 0 count | 40 -> 37 |
| corpus INV-R | `oss-sparksuite-invoice\|INV-R1\|corpus\|\|criterion#1\|worstMm` | 4.15 | 0.61 | 0.1 position-mm | 4.15 -> 0.61 |
| pdf-probe | `pdf-probe\|invoice\|p3\|Total#1\|dy` | -2.65 | -1.15 | 1 pdf-probe-pt | "Total" \|dy\| 2.65 -> 1.15 pt |
| pdf-probe | `pdf-probe\|invoice\|p3\|a#1\|dy` | -2.65 | -1.15 | 1 pdf-probe-pt | "a" \|dy\| 2.65 -> 1.15 pt |
| pdf-probe | `pdf-probe\|invoice\|p3\|pagar#1\|dy` | -2.65 | -1.15 | 1 pdf-probe-pt | "pagar" \|dy\| 2.65 -> 1.15 pt |
| pdf-probe | `pdf-probe\|invoice\|p3\|R$#14\|dy` | -2.65 | -1.15 | 1 pdf-probe-pt | "R$" \|dy\| 2.65 -> 1.15 pt |
| pdf-probe | `pdf-probe\|invoice\|p3\|50.724,90#1\|dy` | -2.65 | -1.15 | 1 pdf-probe-pt | "50.724,90" \|dy\| 2.65 -> 1.15 pt |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|October#1\|dx` | -4.28 | -0.53 | 1 pdf-probe-pt | "October" \|dx\| 4.28 -> 0.53 pt |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|15,#2\|dx` | -4.28 | -0.53 | 1 pdf-probe-pt | "15," \|dx\| 4.28 -> 0.53 pt |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|2026#1\|dx` | -4.28 | -0.53 | 1 pdf-probe-pt | "2026" \|dx\| 4.28 -> 0.53 pt |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|Amount#1\|dx` | -6.52 | -0.52 | 1 pdf-probe-pt | "Amount" \|dx\| 6.52 -> 0.52 pt |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|$49.00#1\|dx` | -6.53 | -0.53 | 1 pdf-probe-pt | "$49.00" \|dx\| 6.53 -> 0.53 pt |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|$27.00#1\|dx` | -6.53 | -0.53 | 1 pdf-probe-pt | "$27.00" \|dx\| 6.53 -> 0.53 pt |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|$15.00#1\|dx` | -6.53 | -0.53 | 1 pdf-probe-pt | "$15.00" \|dx\| 6.53 -> 0.53 pt |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|−$10.00#1\|dx` | -6.53 | -0.53 | 1 pdf-probe-pt | "−$10.00" \|dx\| 6.53 -> 0.53 pt |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|$81.00#1\|dx` | -6.53 | -0.53 | 1 pdf-probe-pt | "$81.00" \|dx\| 6.53 -> 0.53 pt |
| pdf-probe | `pdf-probe\|oss-sparksuite-invoice\|p1\|Invoice#1\|dx` | -3.23 | -1.73 | 1 pdf-probe-pt | "Invoice" \|dx\| 3.23 -> 1.73 pt |
| pdf-probe | `pdf-probe\|oss-sparksuite-invoice\|p1\|#:#1\|dx` | -3.23 | -1.73 | 1 pdf-probe-pt | "#:" \|dx\| 3.23 -> 1.73 pt |
| pdf-probe | `pdf-probe\|oss-sparksuite-invoice\|p1\|123#1\|dx` | -3.23 | -1.73 | 1 pdf-probe-pt | "123" \|dx\| 3.23 -> 1.73 pt |
| pdf-probe | `pdf-probe\|oss-sparksuite-invoice\|p1\|Created:#1\|dx` | -3.23 | -1.73 | 1 pdf-probe-pt | "Created:" \|dx\| 3.23 -> 1.73 pt |
| pdf-probe | `pdf-probe\|oss-sparksuite-invoice\|p1\|January#1\|dx` | -3.23 | -1.73 | 1 pdf-probe-pt | "January" \|dx\| 3.23 -> 1.73 pt |
| pdf-probe | `pdf-probe\|oss-sparksuite-invoice\|p1\|1,#1\|dx` | -3.23 | -1.73 | 1 pdf-probe-pt | "1," \|dx\| 3.23 -> 1.73 pt |
| pdf-probe | `pdf-probe\|oss-sparksuite-invoice\|p1\|2023#1\|dx` | -3.23 | -1.73 | 1 pdf-probe-pt | "2023" \|dx\| 3.23 -> 1.73 pt |
| pdf-probe | `pdf-probe\|oss-sparksuite-invoice\|p1\|Due:#1\|dx` | -3.23 | -1.73 | 1 pdf-probe-pt | "Due:" \|dx\| 3.23 -> 1.73 pt |
| pdf-probe | `pdf-probe\|oss-sparksuite-invoice\|p1\|February#1\|dx` | -3.23 | -1.73 | 1 pdf-probe-pt | "February" \|dx\| 3.23 -> 1.73 pt |
| pdf-probe | `pdf-probe\|oss-sparksuite-invoice\|p1\|1,#2\|dx` | -3.23 | -1.73 | 1 pdf-probe-pt | "1," \|dx\| 3.23 -> 1.73 pt |
| pdf-probe | `pdf-probe\|oss-sparksuite-invoice\|p1\|2023#2\|dx` | -3.23 | -1.73 | 1 pdf-probe-pt | "2023" \|dx\| 3.23 -> 1.73 pt |
| pdf-probe | `pdf-probe\|oss-sparksuite-invoice\|p1\|Acme#1\|dx` | -3.23 | -1.73 | 1 pdf-probe-pt | "Acme" \|dx\| 3.23 -> 1.73 pt |
| pdf-probe | `pdf-probe\|oss-sparksuite-invoice\|p1\|Corp.#1\|dx` | -3.23 | -1.73 | 1 pdf-probe-pt | "Corp." \|dx\| 3.23 -> 1.73 pt |
| pdf-probe | `pdf-probe\|oss-sparksuite-invoice\|p1\|John#1\|dx` | -3.22 | -1.72 | 1 pdf-probe-pt | "John" \|dx\| 3.22 -> 1.72 pt |
| pdf-probe | `pdf-probe\|oss-sparksuite-invoice\|p1\|Doe#1\|dx` | -3.22 | -1.72 | 1 pdf-probe-pt | "Doe" \|dx\| 3.22 -> 1.72 pt |
| pdf-probe | `pdf-probe\|oss-sparksuite-invoice\|p1\|john@example.com#1\|dx` | -3.23 | -1.73 | 1 pdf-probe-pt | "john@example.com" \|dx\| 3.23 -> 1.73 pt |
| pdf-probe | `pdf-probe\|oss-sparksuite-invoice\|p1\|Check#1\|dx` | -3.22 | -1.72 | 1 pdf-probe-pt | "Check" \|dx\| 3.22 -> 1.72 pt |
| pdf-probe | `pdf-probe\|oss-sparksuite-invoice\|p1\|##1\|dx` | -3.23 | -1.73 | 1 pdf-probe-pt | "#" \|dx\| 3.23 -> 1.73 pt |
| pdf-probe | `pdf-probe\|oss-sparksuite-invoice\|p1\|1000#1\|dx` | -3.23 | -1.73 | 1 pdf-probe-pt | "1000" \|dx\| 3.23 -> 1.73 pt |
| pdf-probe | `pdf-probe\|oss-sparksuite-invoice\|p1\|Price#1\|dx` | -3.23 | -1.73 | 1 pdf-probe-pt | "Price" \|dx\| 3.23 -> 1.73 pt |
| pdf-probe | `pdf-probe\|oss-sparksuite-invoice\|p1\|$300.00#1\|dx` | -3.22 | -1.72 | 1 pdf-probe-pt | "$300.00" \|dx\| 3.22 -> 1.72 pt |
| pdf-probe | `pdf-probe\|oss-sparksuite-invoice\|p1\|$75.00#1\|dx` | -3.23 | -1.73 | 1 pdf-probe-pt | "$75.00" \|dx\| 3.23 -> 1.73 pt |
| pdf-probe | `pdf-probe\|oss-sparksuite-invoice\|p1\|$10.00#1\|dx` | -3.23 | -1.73 | 1 pdf-probe-pt | "$10.00" \|dx\| 3.23 -> 1.73 pt |
| pdf-probe | `pdf-probe\|oss-sparksuite-invoice\|p1\|Total:#1\|dx` | -3.23 | -1.73 | 1 pdf-probe-pt | "Total:" \|dx\| 3.23 -> 1.73 pt |
| pdf-probe | `pdf-probe\|oss-sparksuite-invoice\|p1\|$385.00#1\|dx` | -3.23 | -1.73 | 1 pdf-probe-pt | "$385.00" \|dx\| 3.23 -> 1.73 pt |

WPT/crashtest improvements: 45 (listed in gate-report.json).

## Worse within tolerance (327; not gating, counted; the head ratchet sums them)

| group | key | before | after | tolerance | detail |
|---|---|---|---|---|---|
| pdf-probe | `pdf-probe\|invoice\|p1\|DESTINATÁRIO#1\|dx` | -7.06 | 0.44 | 1 pdf-probe-pt | "DESTINATÁRIO" dx -7.06 -> 0.44 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|invoice\|p1\|Borges#1\|dx` | -7.06 | 0.44 | 1 pdf-probe-pt | "Borges" dx -7.06 -> 0.44 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|invoice\|p1\|&#1\|dx` | -7.07 | 0.43 | 1 pdf-probe-pt | "&" dx -7.07 -> 0.43 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|invoice\|p1\|Pinto#1\|dx` | -7.07 | 0.43 | 1 pdf-probe-pt | "Pinto" dx -7.07 -> 0.43 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|invoice\|p1\|Comércio#1\|dx` | -7.07 | 0.43 | 1 pdf-probe-pt | "Comércio" dx -7.07 -> 0.43 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|invoice\|p1\|Ltda.#1\|dx` | -7.08 | 0.42 | 1 pdf-probe-pt | "Ltda." dx -7.08 -> 0.42 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|invoice\|p1\|Cliente#1\|dx` | -7.06 | 0.44 | 1 pdf-probe-pt | "Cliente" dx -7.06 -> 0.44 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|invoice\|p1\|CUST-00042#1\|dx` | -7.04 | 0.46 | 1 pdf-probe-pt | "CUST-00042" dx -7.04 -> 0.46 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|invoice\|p1\|Avenida#1\|dx` | -7.06 | 0.44 | 1 pdf-probe-pt | "Avenida" dx -7.06 -> 0.44 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|invoice\|p1\|Central,#1\|dx` | -7.04 | 0.46 | 1 pdf-probe-pt | "Central," dx -7.04 -> 0.46 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|invoice\|p1\|4500#1\|dx` | -7 | 0.5 | 1 pdf-probe-pt | "4500" dx -7 -> 0.5 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|invoice\|p1\|—#3\|dx` | -6.99 | 0.51 | 1 pdf-probe-pt | "—" dx -6.99 -> 0.51 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|invoice\|p1\|Conjunto#1\|dx` | -6.97 | 0.53 | 1 pdf-probe-pt | "Conjunto" dx -6.97 -> 0.53 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|invoice\|p1\|12#1\|dx` | -6.94 | 0.56 | 1 pdf-probe-pt | "12" dx -6.94 -> 0.56 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|invoice\|p1\|Campinas#1\|dx` | -7.06 | 0.44 | 1 pdf-probe-pt | "Campinas" dx -7.06 -> 0.44 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|invoice\|p1\|—#4\|dx` | -7.03 | 0.47 | 1 pdf-probe-pt | "—" dx -7.03 -> 0.47 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|invoice\|p1\|SP#2\|dx` | -7.01 | 0.49 | 1 pdf-probe-pt | "SP" dx -7.01 -> 0.49 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|invoice\|p1\|13010-111,#1\|dx` | -7.06 | 0.44 | 1 pdf-probe-pt | "13010-111," dx -7.06 -> 0.44 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|invoice\|p1\|Brasil#2\|dx` | -7.03 | 0.47 | 1 pdf-probe-pt | "Brasil" dx -7.03 -> 0.47 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|invoice\|p1\|CNPJ#2\|dx` | -7.06 | 0.44 | 1 pdf-probe-pt | "CNPJ" dx -7.06 -> 0.44 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|invoice\|p1\|98.765.432/0001-21#1\|dx` | -7.04 | 0.46 | 1 pdf-probe-pt | "98.765.432/0001-21" dx -7.04 -> 0.46 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|Hi#1\|dx` | 0.97 | -0.53 | 1 pdf-probe-pt | "Hi" dx 0.97 -> -0.53 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|Hi#1\|dy` | 6.6 | -0.15 | 1 pdf-probe-pt | "Hi" dy 6.6 -> -0.15 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|Maria#1\|dx` | 0.97 | -0.53 | 1 pdf-probe-pt | "Maria" dx 0.97 -> -0.53 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|Maria#1\|dy` | 6.6 | -0.15 | 1 pdf-probe-pt | "Maria" dy 6.6 -> -0.15 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|Exemplo,#1\|dx` | 0.97 | -0.53 | 1 pdf-probe-pt | "Exemplo," dx 0.97 -> -0.53 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|Exemplo,#1\|dy` | 6.6 | -0.15 | 1 pdf-probe-pt | "Exemplo," dy 6.6 -> -0.15 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|Thanks#1\|dx` | 0.97 | -0.53 | 1 pdf-probe-pt | "Thanks" dx 0.97 -> -0.53 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|Thanks#1\|dy` | 6.6 | -0.15 | 1 pdf-probe-pt | "Thanks" dy 6.6 -> -0.15 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|for#1\|dx` | 0.97 | -0.53 | 1 pdf-probe-pt | "for" dx 0.97 -> -0.53 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|for#1\|dy` | 6.6 | -0.15 | 1 pdf-probe-pt | "for" dy 6.6 -> -0.15 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|using#1\|dx` | 0.97 | -0.53 | 1 pdf-probe-pt | "using" dx 0.97 -> -0.53 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|using#1\|dy` | 6.6 | -0.15 | 1 pdf-probe-pt | "using" dy 6.6 -> -0.15 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|[Product#3\|dx` | 0.97 | -0.53 | 1 pdf-probe-pt | "[Product" dx 0.97 -> -0.53 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|[Product#3\|dy` | 6.6 | -0.15 | 1 pdf-probe-pt | "[Product" dy 6.6 -> -0.15 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|Name].#1\|dx` | 0.97 | -0.53 | 1 pdf-probe-pt | "Name]." dx 0.97 -> -0.53 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|Name].#1\|dy` | 6.6 | -0.15 | 1 pdf-probe-pt | "Name]." dy 6.6 -> -0.15 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|This#1\|dx` | 0.97 | -0.53 | 1 pdf-probe-pt | "This" dx 0.97 -> -0.53 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|This#1\|dy` | 6.6 | -0.15 | 1 pdf-probe-pt | "This" dy 6.6 -> -0.15 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|email#1\|dx` | 0.97 | -0.53 | 1 pdf-probe-pt | "email" dx 0.97 -> -0.53 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|email#1\|dy` | 6.6 | -0.15 | 1 pdf-probe-pt | "email" dy 6.6 -> -0.15 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|is#1\|dx` | 0.97 | -0.53 | 1 pdf-probe-pt | "is" dx 0.97 -> -0.53 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|is#1\|dy` | 6.6 | -0.15 | 1 pdf-probe-pt | "is" dy 6.6 -> -0.15 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|the#1\|dx` | 0.97 | -0.53 | 1 pdf-probe-pt | "the" dx 0.97 -> -0.53 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|the#1\|dy` | 6.6 | -0.15 | 1 pdf-probe-pt | "the" dy 6.6 -> -0.15 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|receipt#1\|dx` | 0.97 | -0.53 | 1 pdf-probe-pt | "receipt" dx 0.97 -> -0.53 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|receipt#1\|dy` | 6.6 | -0.15 | 1 pdf-probe-pt | "receipt" dy 6.6 -> -0.15 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|for#2\|dx` | 0.97 | -0.53 | 1 pdf-probe-pt | "for" dx 0.97 -> -0.53 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|for#2\|dy` | 6.6 | -0.15 | 1 pdf-probe-pt | "for" dy 6.6 -> -0.15 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|your#1\|dx` | 0.97 | -0.53 | 1 pdf-probe-pt | "your" dx 0.97 -> -0.53 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|your#1\|dy` | 6.6 | -0.15 | 1 pdf-probe-pt | "your" dy 6.6 -> -0.15 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|purchase.#1\|dx` | 0.97 | -0.53 | 1 pdf-probe-pt | "purchase." dx 0.97 -> -0.53 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|purchase.#1\|dy` | 6.6 | -0.15 | 1 pdf-probe-pt | "purchase." dy 6.6 -> -0.15 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|No#1\|dx` | 0.97 | -0.53 | 1 pdf-probe-pt | "No" dx 0.97 -> -0.53 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|No#1\|dy` | 6.6 | -0.15 | 1 pdf-probe-pt | "No" dy 6.6 -> -0.15 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|payment#1\|dx` | 0.97 | -0.53 | 1 pdf-probe-pt | "payment" dx 0.97 -> -0.53 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|payment#1\|dy` | 6.6 | -0.15 | 1 pdf-probe-pt | "payment" dy 6.6 -> -0.15 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|is#2\|dx` | 0.97 | -0.53 | 1 pdf-probe-pt | "is" dx 0.97 -> -0.53 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|is#2\|dy` | 6.6 | -0.15 | 1 pdf-probe-pt | "is" dy 6.6 -> -0.15 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|due.#1\|dx` | 0.97 | -0.53 | 1 pdf-probe-pt | "due." dx 0.97 -> -0.53 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|due.#1\|dy` | 6.6 | -0.15 | 1 pdf-probe-pt | "due." dy 6.6 -> -0.15 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|This#2\|dx` | 0.97 | -0.53 | 1 pdf-probe-pt | "This" dx 0.97 -> -0.53 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|This#2\|dy` | 6.6 | -0.15 | 1 pdf-probe-pt | "This" dy 6.6 -> -0.15 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|purchase#1\|dx` | 0.97 | -0.53 | 1 pdf-probe-pt | "purchase" dx 0.97 -> -0.53 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|purchase#1\|dy` | 6.6 | -0.15 | 1 pdf-probe-pt | "purchase" dy 6.6 -> -0.15 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|will#1\|dx` | 0.97 | -0.53 | 1 pdf-probe-pt | "will" dx 0.97 -> -0.53 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|will#1\|dy` | 6.6 | -0.15 | 1 pdf-probe-pt | "will" dy 6.6 -> -0.15 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|appear#1\|dx` | 0.97 | -0.53 | 1 pdf-probe-pt | "appear" dx 0.97 -> -0.53 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|appear#1\|dy` | 6.6 | -0.15 | 1 pdf-probe-pt | "appear" dy 6.6 -> -0.15 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|as#1\|dx` | 0.97 | -0.53 | 1 pdf-probe-pt | "as" dx 0.97 -> -0.53 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|as#1\|dy` | 6.6 | -0.15 | 1 pdf-probe-pt | "as" dy 6.6 -> -0.15 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|“[Credit#1\|dx` | 0.97 | -0.53 | 1 pdf-probe-pt | "“[Credit" dx 0.97 -> -0.53 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|“[Credit#1\|dy` | 6.6 | -0.15 | 1 pdf-probe-pt | "“[Credit" dy 6.6 -> -0.15 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|Card#1\|dx` | 0.97 | -0.53 | 1 pdf-probe-pt | "Card" dx 0.97 -> -0.53 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|Card#1\|dy` | 6.6 | -0.15 | 1 pdf-probe-pt | "Card" dy 6.6 -> -0.15 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|Statement#1\|dx` | 0.97 | -0.53 | 1 pdf-probe-pt | "Statement" dx 0.97 -> -0.53 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|Statement#1\|dy` | 6.6 | -0.15 | 1 pdf-probe-pt | "Statement" dy 6.6 -> -0.15 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|Name]”#1\|dx` | 0.97 | -0.53 | 1 pdf-probe-pt | "Name]”" dx 0.97 -> -0.53 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|Name]”#1\|dy` | 6.6 | -0.15 | 1 pdf-probe-pt | "Name]”" dy 6.6 -> -0.15 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|on#1\|dx` | 0.97 | -0.53 | 1 pdf-probe-pt | "on" dx 0.97 -> -0.53 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|on#1\|dy` | 6.6 | -0.15 | 1 pdf-probe-pt | "on" dy 6.6 -> -0.15 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|your#2\|dx` | 0.97 | -0.53 | 1 pdf-probe-pt | "your" dx 0.97 -> -0.53 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|your#2\|dy` | 6.6 | -0.15 | 1 pdf-probe-pt | "your" dy 6.6 -> -0.15 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|credit#1\|dx` | 0.97 | -0.53 | 1 pdf-probe-pt | "credit" dx 0.97 -> -0.53 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|credit#1\|dy` | 6.6 | -0.15 | 1 pdf-probe-pt | "credit" dy 6.6 -> -0.15 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|card#1\|dx` | 0.97 | -0.53 | 1 pdf-probe-pt | "card" dx 0.97 -> -0.53 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|card#1\|dy` | 6.6 | -0.15 | 1 pdf-probe-pt | "card" dy 6.6 -> -0.15 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|statement#1\|dx` | 0.97 | -0.53 | 1 pdf-probe-pt | "statement" dx 0.97 -> -0.53 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|statement#1\|dy` | 6.6 | -0.15 | 1 pdf-probe-pt | "statement" dy 6.6 -> -0.15 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|for#3\|dx` | 0.97 | -0.53 | 1 pdf-probe-pt | "for" dx 0.97 -> -0.53 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|for#3\|dy` | 6.6 | -0.15 | 1 pdf-probe-pt | "for" dy 6.6 -> -0.15 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|your#3\|dx` | 0.97 | -0.53 | 1 pdf-probe-pt | "your" dx 0.97 -> -0.53 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|your#3\|dy` | 6.6 | -0.15 | 1 pdf-probe-pt | "your" dy 6.6 -> -0.15 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|Visa#1\|dx` | 0.97 | -0.53 | 1 pdf-probe-pt | "Visa" dx 0.97 -> -0.53 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|Visa#1\|dy` | 6.6 | -0.15 | 1 pdf-probe-pt | "Visa" dy 6.6 -> -0.15 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|ending#1\|dx` | 0.97 | -0.53 | 1 pdf-probe-pt | "ending" dx 0.97 -> -0.53 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|ending#1\|dy` | 6.6 | -0.15 | 1 pdf-probe-pt | "ending" dy 6.6 -> -0.15 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|in#1\|dx` | 0.97 | -0.53 | 1 pdf-probe-pt | "in" dx 0.97 -> -0.53 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|in#1\|dy` | 6.6 | -0.15 | 1 pdf-probe-pt | "in" dy 6.6 -> -0.15 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|4242.#1\|dx` | 0.97 | -0.53 | 1 pdf-probe-pt | "4242." dx 0.97 -> -0.53 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|4242.#1\|dy` | 6.6 | -0.15 | 1 pdf-probe-pt | "4242." dy 6.6 -> -0.15 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|Need#1\|dx` | 0.97 | -0.53 | 1 pdf-probe-pt | "Need" dx 0.97 -> -0.53 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|Need#1\|dy` | 6.6 | -0.15 | 1 pdf-probe-pt | "Need" dy 6.6 -> -0.15 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|to#1\|dx` | 0.97 | -0.53 | 1 pdf-probe-pt | "to" dx 0.97 -> -0.53 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|to#1\|dy` | 6.6 | -0.15 | 1 pdf-probe-pt | "to" dy 6.6 -> -0.15 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|update#1\|dx` | 0.97 | -0.53 | 1 pdf-probe-pt | "update" dx 0.97 -> -0.53 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|update#1\|dy` | 6.6 | -0.15 | 1 pdf-probe-pt | "update" dy 6.6 -> -0.15 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|your#4\|dx` | 0.97 | -0.53 | 1 pdf-probe-pt | "your" dx 0.97 -> -0.53 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|your#4\|dy` | 6.6 | -0.15 | 1 pdf-probe-pt | "your" dy 6.6 -> -0.15 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|payment#2\|dx` | 0.97 | -0.53 | 1 pdf-probe-pt | "payment" dx 0.97 -> -0.53 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|payment#2\|dy` | 6.6 | -0.15 | 1 pdf-probe-pt | "payment" dy 6.6 -> -0.15 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|information#1\|dx` | 0.97 | -0.53 | 1 pdf-probe-pt | "information" dx 0.97 -> -0.53 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|information#1\|dy` | 6.6 | -0.15 | 1 pdf-probe-pt | "information" dy 6.6 -> -0.15 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|?#1\|dx` | 0.97 | -0.53 | 1 pdf-probe-pt | "?" dx 0.97 -> -0.53 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|?#1\|dy` | 6.6 | -0.15 | 1 pdf-probe-pt | "?" dy 6.6 -> -0.15 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|10%#1\|dy` | 8.85 | -0.15 | 1 pdf-probe-pt | "10%" dy 8.85 -> -0.15 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|off#1\|dy` | 8.85 | -0.15 | 1 pdf-probe-pt | "off" dy 8.85 -> -0.15 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|your#5\|dy` | 8.85 | -0.15 | 1 pdf-probe-pt | "your" dy 8.85 -> -0.15 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|next#1\|dy` | 8.85 | -0.15 | 1 pdf-probe-pt | "next" dy 8.85 -> -0.15 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|purchase!#1\|dy` | 8.85 | -0.15 | 1 pdf-probe-pt | "purchase!" dy 8.85 -> -0.15 pt (crossed Chrome, within 1 pt) |
| … | 207 more in gate-report.json | | | | |

## newly-measured (39)

| group | key | before | after | tolerance | detail |
|---|---|---|---|---|---|
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|[Product#1\|pairing` | unpaired | dx -0.9 dy -0.15 |  | Chrome's "[Product" (page 1) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|Name]#1\|pairing` | unpaired | dx -0.9 dy -0.15 |  | Chrome's "Name]" (page 1) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|probe-f3_avoid_feature` | absent | 13 pairs |  | baseline has no pdf-probe for this fixture: newly measured |
| pdf-probe | `pdf-probe\|probe-f3_feature_match` | absent | 2 pairs |  | baseline has no pdf-probe for this fixture: newly measured |
| pdf-probe | `pdf-probe\|probe-f3_feature_nomatch` | absent | 3 pairs |  | baseline has no pdf-probe for this fixture: newly measured |
| pdf-probe | `pdf-probe\|probe-f3_nested` | absent | 2 pairs |  | baseline has no pdf-probe for this fixture: newly measured |
| pdf-probe | `pdf-probe\|probe-f3_nested_nomatch` | absent | 2 pairs |  | baseline has no pdf-probe for this fixture: newly measured |
| pdf-probe | `pdf-probe\|probe-f3_not_feature` | absent | 2 pairs |  | baseline has no pdf-probe for this fixture: newly measured |
| pdf-probe | `pdf-probe\|probe-f3_orientation` | absent | 2 pairs |  | baseline has no pdf-probe for this fixture: newly measured |
| pdf-probe | `pdf-probe\|probe-f3_page_in_feature` | absent | 0 pairs |  | baseline has no pdf-probe for this fixture: newly measured |
| pdf-probe | `pdf-probe\|probe-f3_width_600` | absent | 2 pairs |  | baseline has no pdf-probe for this fixture: newly measured |
| pdf-probe | `pdf-probe\|probe-f3_width_750` | absent | 1 pairs |  | baseline has no pdf-probe for this fixture: newly measured |
| pdf-probe | `pdf-probe\|probe-f5_allowance_footer` | absent | 14 pairs |  | baseline has no pdf-probe for this fixture: newly measured |
| pdf-probe | `pdf-probe\|probe-f5_allowance_nofooter` | absent | 13 pairs |  | baseline has no pdf-probe for this fixture: newly measured |
| pdf-probe | `pdf-probe\|probe-f5_box_partial` | absent | 3 pairs |  | baseline has no pdf-probe for this fixture: newly measured |
| pdf-probe | `pdf-probe\|probe-f5_img_partial` | absent | 2 pairs |  | baseline has no pdf-probe for this fixture: newly measured |
| pdf-probe | `pdf-probe\|probe-f5_line_big_margin` | absent | 3 pairs |  | baseline has no pdf-probe for this fixture: newly measured |
| pdf-probe | `pdf-probe\|probe-f5_lines_partial` | absent | 12 pairs |  | baseline has no pdf-probe for this fixture: newly measured |
| pdf-probe | `pdf-probe\|probe-f5_ref` | absent | 2 pairs |  | baseline has no pdf-probe for this fixture: newly measured |
| pdf-probe | `pdf-probe\|probe-f5_table_partial` | absent | 9 pairs |  | baseline has no pdf-probe for this fixture: newly measured |
| pdf-probe | `pdf-probe\|probe-g_inline_body` | absent | 52 pairs |  | baseline has no pdf-probe for this fixture: newly measured |
| pdf-probe | `pdf-probe\|probe-g_p_body` | absent | 120 pairs |  | baseline has no pdf-probe for this fixture: newly measured |
| pdf-probe | `pdf-probe\|probe-g_postmark_raw` | absent | 120 pairs |  | baseline has no pdf-probe for this fixture: newly measured |
| pdf-probe | `pdf-probe\|probe-m_allneg` | absent | 2 pairs |  | baseline has no pdf-probe for this fixture: newly measured |
| pdf-probe | `pdf-probe\|probe-m_chain` | absent | 2 pairs |  | baseline has no pdf-probe for this fixture: newly measured |
| pdf-probe | `pdf-probe\|probe-m_dropped` | absent | 2 pairs |  | baseline has no pdf-probe for this fixture: newly measured |
| pdf-probe | `pdf-probe\|probe-m_dropped_neg` | absent | 2 pairs |  | baseline has no pdf-probe for this fixture: newly measured |
| pdf-probe | `pdf-probe\|probe-m_negroot_pos_child` | absent | 2 pairs |  | baseline has no pdf-probe for this fixture: newly measured |
| pdf-probe | `pdf-probe\|probe-m_posneg` | absent | 2 pairs |  | baseline has no pdf-probe for this fixture: newly measured |
| pdf-probe | `pdf-probe\|probe-m_pospos` | absent | 2 pairs |  | baseline has no pdf-probe for this fixture: newly measured |
| pdf-probe | `pdf-probe\|probe-m_ref` | absent | 2 pairs |  | baseline has no pdf-probe for this fixture: newly measured |
| pdf-probe | `pdf-probe\|probe-m_wrapper` | absent | 3 pairs |  | baseline has no pdf-probe for this fixture: newly measured |
| pdf-probe | `pdf-probe\|probe-r_ltr_end` | absent | 3 pairs |  | baseline has no pdf-probe for this fixture: newly measured |
| pdf-probe | `pdf-probe\|probe-r_ltr_start` | absent | 3 pairs |  | baseline has no pdf-probe for this fixture: newly measured |
| pdf-probe | `pdf-probe\|probe-r_rtl_end` | absent | 3 pairs |  | baseline has no pdf-probe for this fixture: newly measured |
| pdf-probe | `pdf-probe\|probe-r_rtl_left` | absent | 3 pairs |  | baseline has no pdf-probe for this fixture: newly measured |
| pdf-probe | `pdf-probe\|probe-r_rtl_right` | absent | 3 pairs |  | baseline has no pdf-probe for this fixture: newly measured |
| pdf-probe | `pdf-probe\|probe-r_rtl_root_start` | absent | 3 pairs |  | baseline has no pdf-probe for this fixture: newly measured |
| pdf-probe | `pdf-probe\|probe-r_rtl_start` | absent | 3 pairs |  | baseline has no pdf-probe for this fixture: newly measured |

## added (5)

| group | key | before | after | tolerance | detail |
|---|---|---|---|---|---|
| canaries | `canary\|pdf-probe\|notification: pdf-probe v2: body translated by +6pt in the subject only (layout-shift-6pt.pdf)` | absent | true |  | new detection canary, caught |
| canaries | `canary\|pdf-probe\|notification: pdf-probe v2: one word deleted from the subject PDF (PyMuPDF redaction)` | absent | true |  | new detection canary, caught |
| canaries | `canary\|pdf-probe\|notification: pdf-probe v2: one glyph run of the subject moved 2pt vertically, away from Chrome` | absent | true |  | new detection canary, caught |
| canaries | `canary\|pdf-probe\|notification: pdf-probe v2: same glyphs, every subject FontDescriptor /Ascent rewritten (must NOT be flagged)` | absent | true |  | new detection canary, caught |
| canaries | `canary\|pdf-probe\|notification: pdf-probe v2: one glyph run of the subject moved below the MediaBox (off-page text)` | absent | true |  | new detection canary, caught |

## Head ratchet vs fidelity/baselines/port/00-start (GATE-H1): FAIL

Every item worse than the chain head beyond its tolerance gates unless a class-a acceptance of this step (4 counted, 0 legacy/other ignored) or a DEBT.json entry within its ceiling covers it. Counts: debt 1024, head-regression 145, declared 10, accepted 4, gating 145, improvement 1987, withinTolerance 1259, flaggedPassLost 3.

### head-regression: worse than the head, no ledger entry (gate, rule i) (145)

| group | key | before | after | tolerance | detail |
|---|---|---|---|---|---|
| corpus DANFE-L | `danfe\|DANFE-L1d\|corpus\|\|criterion#1\|posErrMm` | 5.96 | 6.49 | 0.1 position-mm | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): 5.96 -> 6.49 (tolerance 0.1 mm) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p2\|06/01/2026#1\|dy` | -1.9 | 1.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "06/01/2026" dy -1.9 -> 1.1 pt: moved 3 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p2\|152.744,51#1\|dy` | -1.9 | 1.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "152.744,51" dy -1.9 -> 1.1 pt: moved 3 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p2\|10/01/2026#1\|dy` | -0.4 | 2.6 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "10/01/2026" \|dy\| 0.4 -> 2.6 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p2\|152.683,31#1\|dy` | -0.4 | 2.6 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "152.683,31" \|dy\| 0.4 -> 2.6 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p2\|11/01/2026#1\|dy` | 0.35 | 3.35 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "11/01/2026" \|dy\| 0.35 -> 3.35 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p2\|152.680,90#1\|dy` | 0.35 | 3.35 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "152.680,90" \|dy\| 0.35 -> 3.35 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p2\|15/01/2026#1\|dy` | 1.1 | 4.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "15/01/2026" \|dy\| 1.1 -> 4.1 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p2\|152.642,10#1\|dy` | 1.1 | 4.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "152.642,10" \|dy\| 1.1 -> 4.1 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p2\|17/01/2026#1\|dy` | 1.85 | 4.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "17/01/2026" \|dy\| 1.85 -> 4.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p2\|8,78#1\|dy` | 1.85 | 4.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "8,78" \|dy\| 1.85 -> 4.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p2\|152.650,88#1\|dy` | 1.85 | 4.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "152.650,88" \|dy\| 1.85 -> 4.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p2\|21/01/2026#1\|dy` | 2.6 | 5.6 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "21/01/2026" \|dy\| 2.6 -> 5.6 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p2\|10.331,50#1\|dy` | 2.6 | 5.6 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "10.331,50" \|dy\| 2.6 -> 5.6 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p2\|162.982,38#1\|dy` | 2.6 | 5.6 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "162.982,38" \|dy\| 2.6 -> 5.6 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p2\|22/01/2026#1\|dy` | 2.6 | 5.6 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "22/01/2026" \|dy\| 2.6 -> 5.6 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p2\|3,57#1\|dy` | 2.6 | 5.6 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "3,57" \|dy\| 2.6 -> 5.6 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p2\|162.985,95#1\|dy` | 2.6 | 5.6 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "162.985,95" \|dy\| 2.6 -> 5.6 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p2\|24/01/2026#1\|dy` | 3.35 | 6.35 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "24/01/2026" \|dy\| 3.35 -> 6.35 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p2\|de#11\|dy` | 3.35 | 6.35 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "de" \|dy\| 3.35 -> 6.35 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p2\|162.938,54#1\|dy` | 3.35 | 6.35 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "162.938,54" \|dy\| 3.35 -> 6.35 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p2\|28/01/2026#1\|dy` | 4.85 | 7.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "28/01/2026" \|dy\| 4.85 -> 7.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p2\|36,07#1\|dy` | 4.85 | 7.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "36,07" \|dy\| 4.85 -> 7.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p2\|162.974,61#2\|dy` | 4.85 | 7.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "162.974,61" \|dy\| 4.85 -> 7.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p2\|Lançamentos#2\|dy` | 4.85 | 7.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "Lançamentos" \|dy\| 4.85 -> 7.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p2\|de#12\|dy` | 4.85 | 7.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "de" \|dy\| 4.85 -> 7.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p2\|fevereiro#1\|dy` | 4.85 | 7.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "fevereiro" \|dy\| 4.85 -> 7.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p2\|de#13\|dy` | 4.85 | 7.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "de" \|dy\| 4.85 -> 7.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p2\|2026#2\|dy` | 4.85 | 7.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "2026" \|dy\| 4.85 -> 7.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p2\|143.441,44#1\|dy` | 4.85 | 7.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "143.441,44" \|dy\| 4.85 -> 7.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p2\|02/02/2026#1\|dy` | 5.6 | 8.6 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "02/02/2026" \|dy\| 5.6 -> 8.6 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p2\|—#6\|dy` | -31.15 | 8.6 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "—" dy -31.15 -> 8.6 pt: moved 39.75 pt (> 1) and ends 8.6 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p2\|160.841,76#1\|dy` | 5.6 | 8.6 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "160.841,76" \|dy\| 5.6 -> 8.6 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p2\|05/02/2026#1\|dy` | 6.35 | 9.35 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "05/02/2026" \|dy\| 6.35 -> 9.35 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p2\|160.692,55#1\|dy` | 6.35 | 9.35 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "160.692,55" \|dy\| 6.35 -> 9.35 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p2\|06/02/2026#1\|dy` | 7.1 | 10.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "06/02/2026" \|dy\| 7.1 -> 10.1 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p2\|1,63#1\|dy` | 7.1 | 10.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "1,63" \|dy\| 7.1 -> 10.1 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p2\|160.694,18#1\|dy` | 7.1 | 10.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "160.694,18" \|dy\| 7.1 -> 10.1 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p2\|08/02/2026#1\|dy` | 7.85 | 10.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "08/02/2026" \|dy\| 7.85 -> 10.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p2\|159.969,45#1\|dy` | 7.85 | 10.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "159.969,45" \|dy\| 7.85 -> 10.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p2\|11/02/2026#1\|dy` | 8.6 | 11.6 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "11/02/2026" \|dy\| 8.6 -> 11.6 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p2\|160.059,99#1\|dy` | 8.6 | 11.6 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "160.059,99" \|dy\| 8.6 -> 11.6 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p2\|14/02/2026#1\|dy` | 9.35 | 12.35 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "14/02/2026" \|dy\| 9.35 -> 12.35 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p2\|160.343,33#1\|dy` | 9.35 | 12.35 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "160.343,33" \|dy\| 9.35 -> 12.35 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p2\|17/02/2026#1\|dy` | 10.1 | 13.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "17/02/2026" \|dy\| 10.1 -> 13.1 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p2\|157.543,76#1\|dy` | 10.1 | 13.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "157.543,76" \|dy\| 10.1 -> 13.1 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p2\|19/02/2026#1\|dy` | 10.85 | 13.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "19/02/2026" \|dy\| 10.85 -> 13.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p2\|—#9\|dy` | -7.9 | 13.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "—" \|dy\| 7.9 -> 13.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p2\|de#20\|dy` | -7.9 | 13.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "de" \|dy\| 7.9 -> 13.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p2\|157.536,46#1\|dy` | 10.85 | 13.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "157.536,46" \|dy\| 10.85 -> 13.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p2\|21/02/2026#1\|dy` | 11.6 | 14.6 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "21/02/2026" \|dy\| 11.6 -> 14.6 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p2\|157.538,27#1\|dy` | 11.6 | 14.6 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "157.538,27" \|dy\| 11.6 -> 14.6 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p2\|24/02/2026#1\|dy` | 12.35 | 15.35 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "24/02/2026" \|dy\| 12.35 -> 15.35 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p2\|143.615,52#1\|dy` | 12.35 | 15.35 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "143.615,52" \|dy\| 12.35 -> 15.35 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p2\|27/02/2026#1\|dy` | 13.1 | 16.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "27/02/2026" \|dy\| 13.1 -> 16.1 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p2\|143.441,44#2\|dy` | 13.1 | 16.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "143.441,44" \|dy\| 13.1 -> 16.1 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p2\|de#26\|dx` | 33.43 | -3.44 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "de" dx 33.43 -> -3.44 pt: moved -36.87 pt (> 1) and ends 3.44 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p3\|de#4\|dx` | 13.98 | -22.89 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "de" \|dx\| 13.98 -> 22.89 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p3\|de#4\|dy` | 10.1 | 13.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "de" \|dy\| 10.1 -> 13.1 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p3\|—#2\|dx` | 26.7 | -10.17 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "—" dx 26.7 -> -10.17 pt: moved -36.87 pt (> 1) and ends 10.17 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p3\|de#6\|dx` | -9.17 | 9.68 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "de" dx -9.17 -> 9.68 pt: moved 18.85 pt (> 1) and ends 9.68 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p3\|de#6\|dy` | -19.15 | 2.6 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "de" dy -19.15 -> 2.6 pt: moved 21.75 pt (> 1) and ends 2.6 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p3\|de#10\|dx` | 8.8 | -28.08 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "de" \|dx\| 8.8 -> 28.08 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p3\|de#10\|dy` | 1.1 | 4.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "de" \|dy\| 1.1 -> 4.1 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p3\|de#14\|dy` | 21.35 | 24.35 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "de" \|dy\| 21.35 -> 24.35 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p3\|—#8\|dy` | -13.15 | 27.35 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "—" \|dy\| 13.15 -> 27.35 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p3\|de#17\|dx` | 26.7 | -10.17 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "de" dx 26.7 -> -10.17 pt: moved -36.87 pt (> 1) and ends 10.17 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p3\|de#18\|dx` | 6.92 | -29.96 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "de" \|dx\| 6.92 -> 29.96 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p3\|de#21\|dy` | 11.6 | -4.15 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "de" dy 11.6 -> -4.15 pt: moved -15.75 pt (> 1) and ends 4.15 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p3\|de#23\|dy` | 13.1 | -2.65 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "de" dy 13.1 -> -2.65 pt: moved -15.75 pt (> 1) and ends 2.65 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p3\|de#24\|dx` | 11.62 | 25.27 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "de" \|dx\| 11.62 -> 25.27 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p4\|de#4\|dx` | 11.15 | -25.72 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "de" \|dx\| 11.15 -> 25.72 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p4\|de#6\|dx` | -1.6 | -10.63 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "de" \|dx\| 1.6 -> 10.63 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p4\|de#6\|dy` | 16.85 | -17.65 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "de" dy 16.85 -> -17.65 pt: moved -34.5 pt (> 1) and ends 17.65 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p4\|de#8\|dy` | -29.65 | 3.35 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "de" dy -29.65 -> 3.35 pt: moved 33 pt (> 1) and ends 3.35 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p4\|de#10\|dx` | 20.13 | -16.75 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "de" dx 20.13 -> -16.75 pt: moved -36.88 pt (> 1) and ends 16.75 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p4\|de#12\|dx` | 11.62 | -25.25 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "de" \|dx\| 11.62 -> 25.25 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p4\|de#12\|dy` | 15.35 | 18.35 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "de" \|dy\| 15.35 -> 18.35 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p4\|Lançamentos#2\|dy` | 16.1 | 19.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "Lançamentos" \|dy\| 16.1 -> 19.1 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p4\|de#13\|dy` | 16.1 | 19.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "de" \|dy\| 16.1 -> 19.1 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p4\|de#14\|dx` | 2.85 | 4.12 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "de" \|dx\| 2.85 -> 4.12 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p4\|2026#2\|dy` | 16.1 | 19.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "2026" \|dy\| 16.1 -> 19.1 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p4\|—#5\|dx` | 23.41 | -13.47 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "—" dx 23.41 -> -13.47 pt: moved -36.88 pt (> 1) and ends 13.47 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p4\|—#5\|dy` | -0.4 | 2.6 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "—" \|dy\| 0.4 -> 2.6 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p4\|de#25\|dy` | 5.6 | -9.4 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "de" \|dy\| 5.6 -> 9.4 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p5\|de#3\|dx` | 6.92 | -29.96 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "de" \|dx\| 6.92 -> 29.96 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p5\|de#3\|dy` | 16.1 | 19.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "de" \|dy\| 16.1 -> 19.1 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p5\|de#7\|dy` | 7.85 | -26.65 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "de" \|dy\| 7.85 -> 26.65 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p5\|de#10\|dy` | -1.9 | -16.9 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "de" \|dy\| 1.9 -> 16.9 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p5\|de#11\|dx` | -19.1 | -20.54 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "de" \|dx\| 19.1 -> 20.54 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p5\|de#11\|dy` | -1.9 | -16.9 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "de" \|dy\| 1.9 -> 16.9 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p5\|de#12\|dy` | 6.35 | -8.65 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "de" \|dy\| 6.35 -> 8.65 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p5\|de#15\|dx` | 22.48 | -14.39 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "de" dx 22.48 -> -14.39 pt: moved -36.87 pt (> 1) and ends 14.39 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p5\|de#15\|dy` | 20.6 | 23.6 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "de" \|dy\| 20.6 -> 23.6 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p5\|de#23\|dx` | 34.3 | -2.58 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "de" dx 34.3 -> -2.58 pt: moved -36.88 pt (> 1) and ends 2.58 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p5\|de#23\|dy` | 0.35 | 3.35 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "de" \|dy\| 0.35 -> 3.35 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p5\|—#10\|dx` | 17.76 | -19.11 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "—" \|dx\| 17.76 -> 19.11 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p5\|—#11\|dx` | 17.76 | -19.11 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "—" \|dx\| 17.76 -> 19.11 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p5\|—#11\|dy` | 25.1 | 28.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "—" \|dy\| 25.1 -> 28.1 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p6\|—#1\|dx` | 26.7 | -10.17 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "—" dx 26.7 -> -10.17 pt: moved -36.87 pt (> 1) and ends 10.17 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p6\|—#1\|dy` | 16.1 | 19.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "—" \|dy\| 16.1 -> 19.1 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p6\|de#4\|dx` | 16.33 | -20.54 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "de" \|dx\| 16.33 -> 20.54 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p6\|de#11\|dy` | 0.35 | 3.35 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "de" \|dy\| 0.35 -> 3.35 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p6\|—#8\|dy` | -17.65 | 21.35 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "—" \|dy\| 17.65 -> 21.35 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p6\|de#12\|dx` | 26.7 | -10.17 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "de" dx 26.7 -> -10.17 pt: moved -36.87 pt (> 1) and ends 10.17 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p6\|59.590,02#2\|dy` | 0.35 | 3.35 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "59.590,02" \|dy\| 0.35 -> 3.35 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p6\|de#14\|dx` | 17.86 | -19.01 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "de" \|dx\| 17.86 -> 19.01 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p6\|de#17\|dx` | 22.48 | -14.39 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "de" dx 22.48 -> -14.39 pt: moved -36.87 pt (> 1) and ends 14.39 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p6\|—#9\|dx` | 16.82 | -1.17 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "—" dx 16.82 -> -1.17 pt: moved -17.99 pt (> 1) and ends 1.17 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p6\|—#9\|dy` | -8.65 | 13.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "—" \|dy\| 8.65 -> 13.1 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p6\|de#23\|dx` | 13.98 | -22.89 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "de" \|dx\| 13.98 -> 22.89 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p6\|de#24\|dx` | 1.21 | -35.66 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "de" \|dx\| 1.21 -> 35.66 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p6\|Lançamentos#3\|dy` | 25.1 | 28.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "Lançamentos" \|dy\| 25.1 -> 28.1 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p6\|de#27\|dy` | 25.1 | 28.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "de" \|dy\| 25.1 -> 28.1 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p6\|de#28\|dy` | -4.15 | 28.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "de" \|dy\| 4.15 -> 28.1 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p6\|2026#3\|dy` | 25.1 | 28.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "2026" \|dy\| 25.1 -> 28.1 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p6\|de#29\|dx` | 8.8 | -28.08 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "de" \|dx\| 8.8 -> 28.08 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p6\|de#29\|dy` | 8.6 | 11.6 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "de" \|dy\| 8.6 -> 11.6 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p6\|de#30\|dy` | -28.15 | 30.35 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "de" \|dy\| 28.15 -> 30.35 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p6\|de#31\|dx` | 16.33 | -20.54 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "de" \|dx\| 16.33 -> 20.54 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p6\|de#32\|dx` | 11.15 | -25.72 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "de" \|dx\| 11.15 -> 25.72 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p6\|de#32\|dy` | -0.4 | 2.6 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "de" \|dy\| 0.4 -> 2.6 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p6\|de#34\|dy` | 1.1 | 22.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "de" \|dy\| 1.1 -> 22.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p6\|de#35\|dx` | 34.3 | -2.58 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "de" dx 34.3 -> -2.58 pt: moved -36.88 pt (> 1) and ends 2.58 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p6\|de#35\|dy` | 2.6 | 5.6 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "de" \|dy\| 2.6 -> 5.6 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p6\|de#37\|dx` | 16.33 | -20.54 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "de" \|dx\| 16.33 -> 20.54 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p6\|de#37\|dy` | 3.35 | 6.35 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "de" \|dy\| 3.35 -> 6.35 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p6\|de#38\|dx` | 34.3 | -2.58 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "de" dx 34.3 -> -2.58 pt: moved -36.88 pt (> 1) and ends 2.58 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p6\|de#38\|dy` | 10.85 | 13.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "de" \|dy\| 10.85 -> 13.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p7\|de#5\|dx` | 13.62 | -23.26 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "de" \|dx\| 13.62 -> 23.26 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p2\|de#27\|pairing` | dx 26.26 dy -22.15 | unpaired |  | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): Chrome's "de" (page 2) lost its vellora counterpart: missing, on another page, or more than 36 pt away |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p3\|de#9\|pairing` | dx -1.6 dy -10.9 | unpaired |  | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): Chrome's "de" (page 3) lost its vellora counterpart: missing, on another page, or more than 36 pt away |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p4\|de#3\|pairing` | dx -19.57 dy 15.35 | unpaired |  | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): Chrome's "de" (page 4) lost its vellora counterpart: missing, on another page, or more than 36 pt away |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p4\|de#17\|pairing` | dx -3.01 dy -29.65 | unpaired |  | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): Chrome's "de" (page 4) lost its vellora counterpart: missing, on another page, or more than 36 pt away |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p4\|de#18\|pairing` | dx -9.17 dy -22.15 | unpaired |  | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): Chrome's "de" (page 4) lost its vellora counterpart: missing, on another page, or more than 36 pt away |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p4\|de#19\|pairing` | dx -5.37 dy -20.65 | unpaired |  | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): Chrome's "de" (page 4) lost its vellora counterpart: missing, on another page, or more than 36 pt away |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p4\|de#24\|pairing` | dx 0.75 dy 4.85 | unpaired |  | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): Chrome's "de" (page 4) lost its vellora counterpart: missing, on another page, or more than 36 pt away |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p5\|—#3\|pairing` | dx 4.52 dy 8.6 | unpaired |  | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): Chrome's "—" (page 5) lost its vellora counterpart: missing, on another page, or more than 36 pt away |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p5\|de#9\|pairing` | dx 16.33 dy 27.35 | unpaired |  | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): Chrome's "de" (page 5) lost its vellora counterpart: missing, on another page, or more than 36 pt away |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p5\|de#14\|pairing` | dx 6.51 dy 7.85 | unpaired |  | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): Chrome's "de" (page 5) lost its vellora counterpart: missing, on another page, or more than 36 pt away |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p5\|de#19\|pairing` | dx 11.15 dy -14.65 | unpaired |  | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): Chrome's "de" (page 5) lost its vellora counterpart: missing, on another page, or more than 36 pt away |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p5\|de#20\|pairing` | dx 8.8 dy 4.85 | unpaired |  | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): Chrome's "de" (page 5) lost its vellora counterpart: missing, on another page, or more than 36 pt away |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p6\|de#7\|pairing` | dx -29.5 dy 7.1 | unpaired |  | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): Chrome's "de" (page 6) lost its vellora counterpart: missing, on another page, or more than 36 pt away |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p6\|de#10\|pairing` | dx 0.75 dy -19.9 | unpaired |  | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): Chrome's "de" (page 6) lost its vellora counterpart: missing, on another page, or more than 36 pt away |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p6\|—#16\|pairing` | dx 4.52 dy 21.35 | unpaired |  | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): Chrome's "—" (page 6) lost its vellora counterpart: missing, on another page, or more than 36 pt away |

### debt: covered by DEBT.json (class b, not gating) (1024)

| group | key | before | after | tolerance | detail |
|---|---|---|---|---|---|
| corpus DANFE-L | `danfe\|DANFE-L1a\|corpus\|\|criterion#1\|posErrMm` | 1.56 | 2.09 | 0.1 position-mm | DEBT-10-danfe-1 (class b, owner blitz:block-offset, closes at -): 1.56 -> 2.09 (tolerance 0.1 mm) — DEBT DEBT-10-danfe-1 |
| corpus DANFE-L | `danfe\|DANFE-L1b\|corpus\|\|criterion#1\|posErrMm` | 3.15 | 3.68 | 0.1 position-mm | DEBT-10-danfe-1 (class b, owner blitz:block-offset, closes at -): 3.15 -> 3.68 (tolerance 0.1 mm) — DEBT DEBT-10-danfe-1 |
| corpus DANFE-L | `danfe\|DANFE-L1c\|corpus\|\|criterion#1\|posErrMm` | 4.71 | 5.24 | 0.1 position-mm | DEBT-10-danfe-1 (class b, owner blitz:block-offset, closes at -): 4.71 -> 5.24 (tolerance 0.1 mm) — DEBT DEBT-10-danfe-1 |
| wpt css/CSS2/floats-clear | `wpt\|css/CSS2/floats-clear/floats-153.xht` | pass | fail |  | DEBT-10-wpt-1 (class b, owner blitz:wpt-raw-fail, closes at -): pass -> fail (clean pass lost) — DEBT DEBT-10-wpt-1 |
| wpt css/CSS2/floats | `wpt\|css/CSS2/floats/floats-placement-vertical-003.xht` | pass | fail |  | DEBT-10-wpt-1 (class b, owner blitz:wpt-raw-fail, closes at -): pass -> fail (clean pass lost) — DEBT DEBT-10-wpt-1 |
| wpt css/CSS2/floats | `wpt\|css/CSS2/floats/floats-placement-vertical-004.xht` | pass | fail |  | DEBT-10-wpt-1 (class b, owner blitz:wpt-raw-fail, closes at -): pass -> fail (clean pass lost) — DEBT DEBT-10-wpt-1 |
| wpt css/CSS2/floats | `wpt\|css/CSS2/floats/zero-width-floats.html` | pass | fail |  | DEBT-10-wpt-2 (class b, owner blitz:wpt-raw-fail, closes at -): pass -> fail (clean pass lost) — DEBT DEBT-10-wpt-2 |
| wpt css/CSS2/linebox | `wpt\|css/CSS2/linebox/baseline-block-with-overflow-001.html` | pass | fail |  | DEBT-10-wpt-1 (class b, owner blitz:wpt-raw-fail, closes at -): pass -> fail (clean pass lost) — DEBT DEBT-10-wpt-1 |
| wpt css/CSS2/linebox | `wpt\|css/CSS2/linebox/inline-formatting-context-001.xht` | pass | fail |  | DEBT-10-wpt-3 (class b, owner blitz:wpt-raw-fail, closes at -): pass -> fail (clean pass lost) — DEBT DEBT-10-wpt-3 |
| wpt css/css-break | `wpt\|css/css-break/flexbox/flex-fragmented-with-float-descendant-001.html` | pass | fail |  | DEBT-10-wpt-1 (class b, owner blitz:wpt-raw-fail, closes at -): pass -> fail (clean pass lost) — DEBT DEBT-10-wpt-1 |
| pdf-probe | `pdf-probe\|boleto\|p1\|Corte#1\|dy` | -2.06 | 1.1 | 1 pdf-probe-pt | DEBT-10-boleto-1 (class b, owner blitz:text-position-dy, closes at -): "Corte" dy -2.06 -> 1.1 pt: moved 3.16 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) — DEBT DEBT-10-boleto-1 |
| pdf-probe | `pdf-probe\|boleto\|p1\|na#1\|dy` | -2.06 | 1.1 | 1 pdf-probe-pt | DEBT-10-boleto-1 (class b, owner blitz:text-position-dy, closes at -): "na" dy -2.06 -> 1.1 pt: moved 3.16 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) — DEBT DEBT-10-boleto-1 |
| pdf-probe | `pdf-probe\|boleto\|p1\|linha#1\|dy` | -2.06 | 1.1 | 1 pdf-probe-pt | DEBT-10-boleto-1 (class b, owner blitz:text-position-dy, closes at -): "linha" dy -2.06 -> 1.1 pt: moved 3.16 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) — DEBT DEBT-10-boleto-1 |
| pdf-probe | `pdf-probe\|boleto\|p1\|pontilhada#1\|dy` | -2.06 | 1.1 | 1 pdf-probe-pt | DEBT-10-boleto-1 (class b, owner blitz:text-position-dy, closes at -): "pontilhada" dy -2.06 -> 1.1 pt: moved 3.16 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) — DEBT DEBT-10-boleto-1 |
| pdf-probe | `pdf-probe\|boleto\|p1\|—#1\|dy` | -2.06 | 1.1 | 1 pdf-probe-pt | DEBT-10-boleto-1 (class b, owner blitz:text-position-dy, closes at -): "—" dy -2.06 -> 1.1 pt: moved 3.16 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) — DEBT DEBT-10-boleto-1 |
| pdf-probe | `pdf-probe\|boleto\|p1\|Ficha#1\|dy` | -2.06 | 1.1 | 1 pdf-probe-pt | DEBT-10-boleto-1 (class b, owner blitz:text-position-dy, closes at -): "Ficha" dy -2.06 -> 1.1 pt: moved 3.16 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) — DEBT DEBT-10-boleto-1 |
| pdf-probe | `pdf-probe\|boleto\|p1\|de#1\|dy` | -2.06 | 1.1 | 1 pdf-probe-pt | DEBT-10-boleto-1 (class b, owner blitz:text-position-dy, closes at -): "de" dy -2.06 -> 1.1 pt: moved 3.16 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) — DEBT DEBT-10-boleto-1 |
| pdf-probe | `pdf-probe\|boleto\|p1\|Compensação#1\|dy` | -2.06 | 1.1 | 1 pdf-probe-pt | DEBT-10-boleto-1 (class b, owner blitz:text-position-dy, closes at -): "Compensação" dy -2.06 -> 1.1 pt: moved 3.16 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) — DEBT DEBT-10-boleto-1 |
| pdf-probe | `pdf-probe\|boleto\|p1\|99990.00001#2\|dy` | -2.81 | 2.74 | 1 pdf-probe-pt | DEBT-10-boleto-1 (class b, owner blitz:text-position-dy, closes at -): "99990.00001" dy -2.81 -> 2.74 pt: moved 5.55 pt (> 1) and ends 2.74 pt from Chrome (> 1) (I1) — DEBT DEBT-10-boleto-1 |
| pdf-probe | `pdf-probe\|boleto\|p1\|23456.700001#2\|dy` | -2.81 | 2.74 | 1 pdf-probe-pt | DEBT-10-boleto-1 (class b, owner blitz:text-position-dy, closes at -): "23456.700001" dy -2.81 -> 2.74 pt: moved 5.55 pt (> 1) and ends 2.74 pt from Chrome (> 1) (I1) — DEBT DEBT-10-boleto-1 |
| pdf-probe | `pdf-probe\|boleto\|p1\|00000.000420#2\|dy` | -2.81 | 2.74 | 1 pdf-probe-pt | DEBT-10-boleto-1 (class b, owner blitz:text-position-dy, closes at -): "00000.000420" dy -2.81 -> 2.74 pt: moved 5.55 pt (> 1) and ends 2.74 pt from Chrome (> 1) (I1) — DEBT DEBT-10-boleto-1 |
| pdf-probe | `pdf-probe\|boleto\|p1\|1#2\|dy` | -2.81 | 2.74 | 1 pdf-probe-pt | DEBT-10-boleto-1 (class b, owner blitz:text-position-dy, closes at -): "1" dy -2.81 -> 2.74 pt: moved 5.55 pt (> 1) and ends 2.74 pt from Chrome (> 1) (I1) — DEBT DEBT-10-boleto-1 |
| pdf-probe | `pdf-probe\|boleto\|p1\|999-9#2\|dy` | -8.81 | 2.13 | 1 pdf-probe-pt | DEBT-10-boleto-1 (class b, owner blitz:text-position-dy, closes at -): "999-9" dy -8.81 -> 2.13 pt: moved 10.94 pt (> 1) and ends 2.13 pt from Chrome (> 1) (I1) — DEBT DEBT-10-boleto-1 |
| pdf-probe | `pdf-probe\|boleto\|p1\|99990000012345#2\|dy` | -2.81 | 2.74 | 1 pdf-probe-pt | DEBT-10-boleto-1 (class b, owner blitz:text-position-dy, closes at -): "99990000012345" dy -2.81 -> 2.74 pt: moved 5.55 pt (> 1) and ends 2.74 pt from Chrome (> 1) (I1) — DEBT DEBT-10-boleto-1 |
| pdf-probe | `pdf-probe\|boleto\|p1\|LOCAL#1\|dy` | -1.22 | 1.85 | 1 pdf-probe-pt | DEBT-10-boleto-1 (class b, owner blitz:text-position-dy, closes at -): "LOCAL" dy -1.22 -> 1.85 pt: moved 3.07 pt (> 1) and ends 1.85 pt from Chrome (> 1) (I1) — DEBT DEBT-10-boleto-1 |
| pdf-probe | `pdf-probe\|boleto\|p1\|DE#1\|dy` | -1.22 | 1.85 | 1 pdf-probe-pt | DEBT-10-boleto-1 (class b, owner blitz:text-position-dy, closes at -): "DE" dy -1.22 -> 1.85 pt: moved 3.07 pt (> 1) and ends 1.85 pt from Chrome (> 1) (I1) — DEBT DEBT-10-boleto-1 |
| pdf-probe | `pdf-probe\|boleto\|p1\|PAGAMENTO#1\|dy` | -1.22 | 1.85 | 1 pdf-probe-pt | DEBT-10-boleto-1 (class b, owner blitz:text-position-dy, closes at -): "PAGAMENTO" dy -1.22 -> 1.85 pt: moved 3.07 pt (> 1) and ends 1.85 pt from Chrome (> 1) (I1) — DEBT DEBT-10-boleto-1 |
| pdf-probe | `pdf-probe\|boleto\|p1\|VENCIMENTO#2\|dy` | -1.22 | 1.85 | 1 pdf-probe-pt | DEBT-10-boleto-1 (class b, owner blitz:text-position-dy, closes at -): "VENCIMENTO" dy -1.22 -> 1.85 pt: moved 3.07 pt (> 1) and ends 1.85 pt from Chrome (> 1) (I1) — DEBT DEBT-10-boleto-1 |
| pdf-probe | `pdf-probe\|boleto\|p1\|Pagável#1\|dy` | -1.97 | 1.1 | 1 pdf-probe-pt | DEBT-10-boleto-1 (class b, owner blitz:text-position-dy, closes at -): "Pagável" dy -1.97 -> 1.1 pt: moved 3.07 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) — DEBT DEBT-10-boleto-1 |
| pdf-probe | `pdf-probe\|boleto\|p1\|em#1\|dy` | -1.97 | 1.1 | 1 pdf-probe-pt | DEBT-10-boleto-1 (class b, owner blitz:text-position-dy, closes at -): "em" dy -1.97 -> 1.1 pt: moved 3.07 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) — DEBT DEBT-10-boleto-1 |
| pdf-probe | `pdf-probe\|boleto\|p1\|qualquer#1\|dy` | -1.97 | 1.1 | 1 pdf-probe-pt | DEBT-10-boleto-1 (class b, owner blitz:text-position-dy, closes at -): "qualquer" dy -1.97 -> 1.1 pt: moved 3.07 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) — DEBT DEBT-10-boleto-1 |
| pdf-probe | `pdf-probe\|boleto\|p1\|banco#1\|dy` | -1.97 | 1.1 | 1 pdf-probe-pt | DEBT-10-boleto-1 (class b, owner blitz:text-position-dy, closes at -): "banco" dy -1.97 -> 1.1 pt: moved 3.07 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) — DEBT DEBT-10-boleto-1 |
| pdf-probe | `pdf-probe\|boleto\|p1\|até#1\|dy` | -1.97 | 1.1 | 1 pdf-probe-pt | DEBT-10-boleto-1 (class b, owner blitz:text-position-dy, closes at -): "até" dy -1.97 -> 1.1 pt: moved 3.07 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) — DEBT DEBT-10-boleto-1 |
| pdf-probe | `pdf-probe\|boleto\|p1\|o#1\|dy` | -1.97 | 1.1 | 1 pdf-probe-pt | DEBT-10-boleto-1 (class b, owner blitz:text-position-dy, closes at -): "o" dy -1.97 -> 1.1 pt: moved 3.07 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) — DEBT DEBT-10-boleto-1 |
| pdf-probe | `pdf-probe\|boleto\|p1\|vencimento#1\|dy` | -1.97 | 1.1 | 1 pdf-probe-pt | DEBT-10-boleto-1 (class b, owner blitz:text-position-dy, closes at -): "vencimento" dy -1.97 -> 1.1 pt: moved 3.07 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) — DEBT DEBT-10-boleto-1 |
| pdf-probe | `pdf-probe\|boleto\|p1\|(boleto#1\|dy` | -1.97 | 1.1 | 1 pdf-probe-pt | DEBT-10-boleto-1 (class b, owner blitz:text-position-dy, closes at -): "(boleto" dy -1.97 -> 1.1 pt: moved 3.07 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) — DEBT DEBT-10-boleto-1 |
| pdf-probe | `pdf-probe\|boleto\|p1\|fictício#1\|dy` | -1.97 | 1.1 | 1 pdf-probe-pt | DEBT-10-boleto-1 (class b, owner blitz:text-position-dy, closes at -): "fictício" dy -1.97 -> 1.1 pt: moved 3.07 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) — DEBT DEBT-10-boleto-1 |
| pdf-probe | `pdf-probe\|boleto\|p1\|de#2\|dy` | -1.97 | 1.1 | 1 pdf-probe-pt | DEBT-10-boleto-1 (class b, owner blitz:text-position-dy, closes at -): "de" dy -1.97 -> 1.1 pt: moved 3.07 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) — DEBT DEBT-10-boleto-1 |
| pdf-probe | `pdf-probe\|boleto\|p1\|teste).#1\|dy` | -1.97 | 1.1 | 1 pdf-probe-pt | DEBT-10-boleto-1 (class b, owner blitz:text-position-dy, closes at -): "teste)." dy -1.97 -> 1.1 pt: moved 3.07 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) — DEBT DEBT-10-boleto-1 |
| pdf-probe | `pdf-probe\|boleto\|p1\|15/07/2026#2\|dy` | -1.97 | 1.1 | 1 pdf-probe-pt | DEBT-10-boleto-1 (class b, owner blitz:text-position-dy, closes at -): "15/07/2026" dy -1.97 -> 1.1 pt: moved 3.07 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) — DEBT DEBT-10-boleto-1 |
| pdf-probe | `pdf-probe\|boleto\|p1\|BENEFICIÁRIO#3\|dy` | -0.47 | 2.6 | 1 pdf-probe-pt | DEBT-10-boleto-1 (class b, owner blitz:text-position-dy, closes at -): "BENEFICIÁRIO" \|dy\| 0.47 -> 2.6 pt vs Chrome (baseline) — DEBT DEBT-10-boleto-1 |
| pdf-probe | `pdf-probe\|boleto\|p1\|AGÊNCIA#2\|dy` | -0.47 | 2.6 | 1 pdf-probe-pt | DEBT-10-boleto-1 (class b, owner blitz:text-position-dy, closes at -): "AGÊNCIA" \|dy\| 0.47 -> 2.6 pt vs Chrome (baseline) — DEBT DEBT-10-boleto-1 |
| pdf-probe | `pdf-probe\|boleto\|p1\|/#3\|dy` | -0.47 | 2.6 | 1 pdf-probe-pt | DEBT-10-boleto-1 (class b, owner blitz:text-position-dy, closes at -): "/" \|dy\| 0.47 -> 2.6 pt vs Chrome (baseline) — DEBT DEBT-10-boleto-1 |
| pdf-probe | `pdf-probe\|boleto\|p1\|CÓDIGO#2\|dy` | -0.47 | 2.6 | 1 pdf-probe-pt | DEBT-10-boleto-1 (class b, owner blitz:text-position-dy, closes at -): "CÓDIGO" \|dy\| 0.47 -> 2.6 pt vs Chrome (baseline) — DEBT DEBT-10-boleto-1 |
| pdf-probe | `pdf-probe\|boleto\|p1\|DO#4\|dy` | -0.47 | 2.6 | 1 pdf-probe-pt | DEBT-10-boleto-1 (class b, owner blitz:text-position-dy, closes at -): "DO" \|dy\| 0.47 -> 2.6 pt vs Chrome (baseline) — DEBT DEBT-10-boleto-1 |
| pdf-probe | `pdf-probe\|boleto\|p1\|BENEFICIÁRIO#4\|dy` | -0.47 | 2.6 | 1 pdf-probe-pt | DEBT-10-boleto-1 (class b, owner blitz:text-position-dy, closes at -): "BENEFICIÁRIO" \|dy\| 0.47 -> 2.6 pt vs Chrome (baseline) — DEBT DEBT-10-boleto-1 |
| pdf-probe | `pdf-probe\|boleto\|p1\|Acme#2\|dy` | -0.47 | 2.6 | 1 pdf-probe-pt | DEBT-10-boleto-1 (class b, owner blitz:text-position-dy, closes at -): "Acme" \|dy\| 0.47 -> 2.6 pt vs Chrome (baseline) — DEBT DEBT-10-boleto-1 |
| pdf-probe | `pdf-probe\|boleto\|p1\|Widgets#2\|dy` | -0.47 | 2.6 | 1 pdf-probe-pt | DEBT-10-boleto-1 (class b, owner blitz:text-position-dy, closes at -): "Widgets" \|dy\| 0.47 -> 2.6 pt vs Chrome (baseline) — DEBT DEBT-10-boleto-1 |
| pdf-probe | `pdf-probe\|boleto\|p1\|Comércio#2\|dy` | -0.47 | 2.6 | 1 pdf-probe-pt | DEBT-10-boleto-1 (class b, owner blitz:text-position-dy, closes at -): "Comércio" \|dy\| 0.47 -> 2.6 pt vs Chrome (baseline) — DEBT DEBT-10-boleto-1 |
| pdf-probe | `pdf-probe\|boleto\|p1\|LTDA#2\|dy` | -0.47 | 2.6 | 1 pdf-probe-pt | DEBT-10-boleto-1 (class b, owner blitz:text-position-dy, closes at -): "LTDA" \|dy\| 0.47 -> 2.6 pt vs Chrome (baseline) — DEBT DEBT-10-boleto-1 |
| pdf-probe | `pdf-probe\|boleto\|p1\|—#2\|dy` | -0.47 | 2.6 | 1 pdf-probe-pt | DEBT-10-boleto-1 (class b, owner blitz:text-position-dy, closes at -): "—" \|dy\| 0.47 -> 2.6 pt vs Chrome (baseline) — DEBT DEBT-10-boleto-1 |
| pdf-probe | `pdf-probe\|boleto\|p1\|CNPJ#1\|dy` | -0.47 | 2.6 | 1 pdf-probe-pt | DEBT-10-boleto-1 (class b, owner blitz:text-position-dy, closes at -): "CNPJ" \|dy\| 0.47 -> 2.6 pt vs Chrome (baseline) — DEBT DEBT-10-boleto-1 |
| pdf-probe | `pdf-probe\|boleto\|p1\|12.345.678/0001-90#1\|dy` | -0.47 | 2.6 | 1 pdf-probe-pt | DEBT-10-boleto-1 (class b, owner blitz:text-position-dy, closes at -): "12.345.678/0001-90" \|dy\| 0.47 -> 2.6 pt vs Chrome (baseline) — DEBT DEBT-10-boleto-1 |
| pdf-probe | `pdf-probe\|boleto\|p1\|0042#2\|dy` | 0.28 | 3.35 | 1 pdf-probe-pt | DEBT-10-boleto-1 (class b, owner blitz:text-position-dy, closes at -): "0042" \|dy\| 0.28 -> 3.35 pt vs Chrome (baseline) — DEBT DEBT-10-boleto-1 |
| pdf-probe | `pdf-probe\|boleto\|p1\|/#4\|dy` | 0.28 | 3.35 | 1 pdf-probe-pt | DEBT-10-boleto-1 (class b, owner blitz:text-position-dy, closes at -): "/" \|dy\| 0.28 -> 3.35 pt vs Chrome (baseline) — DEBT DEBT-10-boleto-1 |
| pdf-probe | `pdf-probe\|boleto\|p1\|00012345-6#2\|dy` | 0.28 | 3.35 | 1 pdf-probe-pt | DEBT-10-boleto-1 (class b, owner blitz:text-position-dy, closes at -): "00012345-6" \|dy\| 0.28 -> 3.35 pt vs Chrome (baseline) — DEBT DEBT-10-boleto-1 |
| pdf-probe | `pdf-probe\|boleto\|p1\|DATA#1\|dy` | 1.03 | 4.1 | 1 pdf-probe-pt | DEBT-10-boleto-1 (class b, owner blitz:text-position-dy, closes at -): "DATA" \|dy\| 1.03 -> 4.1 pt vs Chrome (baseline) — DEBT DEBT-10-boleto-1 |
| pdf-probe | `pdf-probe\|boleto\|p1\|DO#5\|dy` | 1.03 | 4.1 | 1 pdf-probe-pt | DEBT-10-boleto-1 (class b, owner blitz:text-position-dy, closes at -): "DO" \|dy\| 1.03 -> 4.1 pt vs Chrome (baseline) — DEBT DEBT-10-boleto-1 |
| pdf-probe | `pdf-probe\|boleto\|p1\|DOCUMENTO#2\|dy` | 1.03 | 4.1 | 1 pdf-probe-pt | DEBT-10-boleto-1 (class b, owner blitz:text-position-dy, closes at -): "DOCUMENTO" \|dy\| 1.03 -> 4.1 pt vs Chrome (baseline) — DEBT DEBT-10-boleto-1 |
| pdf-probe | `pdf-probe\|boleto\|p1\|NÚMERO#2\|dy` | 1.03 | 4.1 | 1 pdf-probe-pt | DEBT-10-boleto-1 (class b, owner blitz:text-position-dy, closes at -): "NÚMERO" \|dy\| 1.03 -> 4.1 pt vs Chrome (baseline) — DEBT DEBT-10-boleto-1 |
| pdf-probe | `pdf-probe\|boleto\|p1\|DO#6\|dy` | 1.03 | 4.1 | 1 pdf-probe-pt | DEBT-10-boleto-1 (class b, owner blitz:text-position-dy, closes at -): "DO" \|dy\| 1.03 -> 4.1 pt vs Chrome (baseline) — DEBT DEBT-10-boleto-1 |
| pdf-probe | `pdf-probe\|boleto\|p1\|DOCUMENTO#3\|dy` | 1.03 | 4.1 | 1 pdf-probe-pt | DEBT-10-boleto-1 (class b, owner blitz:text-position-dy, closes at -): "DOCUMENTO" \|dy\| 1.03 -> 4.1 pt vs Chrome (baseline) — DEBT DEBT-10-boleto-1 |
| pdf-probe | `pdf-probe\|boleto\|p1\|ESPÉCIE#1\|dy` | 1.03 | 4.1 | 1 pdf-probe-pt | DEBT-10-boleto-1 (class b, owner blitz:text-position-dy, closes at -): "ESPÉCIE" \|dy\| 1.03 -> 4.1 pt vs Chrome (baseline) — DEBT DEBT-10-boleto-1 |
| pdf-probe | `pdf-probe\|boleto\|p1\|DOC.#1\|dy` | 1.03 | 4.1 | 1 pdf-probe-pt | DEBT-10-boleto-1 (class b, owner blitz:text-position-dy, closes at -): "DOC." \|dy\| 1.03 -> 4.1 pt vs Chrome (baseline) — DEBT DEBT-10-boleto-1 |
| pdf-probe | `pdf-probe\|boleto\|p1\|NOSSO#2\|dy` | 1.03 | 4.1 | 1 pdf-probe-pt | DEBT-10-boleto-1 (class b, owner blitz:text-position-dy, closes at -): "NOSSO" \|dy\| 1.03 -> 4.1 pt vs Chrome (baseline) — DEBT DEBT-10-boleto-1 |
| pdf-probe | `pdf-probe\|boleto\|p1\|NÚMERO#3\|dy` | 1.03 | 4.1 | 1 pdf-probe-pt | DEBT-10-boleto-1 (class b, owner blitz:text-position-dy, closes at -): "NÚMERO" \|dy\| 1.03 -> 4.1 pt vs Chrome (baseline) — DEBT DEBT-10-boleto-1 |
| pdf-probe | `pdf-probe\|boleto\|p1\|22/06/2026#1\|dy` | 1.78 | 4.85 | 1 pdf-probe-pt | DEBT-10-boleto-1 (class b, owner blitz:text-position-dy, closes at -): "22/06/2026" \|dy\| 1.78 -> 4.85 pt vs Chrome (baseline) — DEBT DEBT-10-boleto-1 |
| pdf-probe | `pdf-probe\|boleto\|p1\|DOC-00042#1\|dy` | 1.78 | 4.85 | 1 pdf-probe-pt | DEBT-10-boleto-1 (class b, owner blitz:text-position-dy, closes at -): "DOC-00042" \|dy\| 1.78 -> 4.85 pt vs Chrome (baseline) — DEBT DEBT-10-boleto-1 |
| pdf-probe | `pdf-probe\|boleto\|p1\|DM#1\|dy` | 1.78 | 4.85 | 1 pdf-probe-pt | DEBT-10-boleto-1 (class b, owner blitz:text-position-dy, closes at -): "DM" \|dy\| 1.78 -> 4.85 pt vs Chrome (baseline) — DEBT DEBT-10-boleto-1 |
| pdf-probe | `pdf-probe\|boleto\|p1\|00000000000123456-7#2\|dy` | 1.78 | 4.85 | 1 pdf-probe-pt | DEBT-10-boleto-1 (class b, owner blitz:text-position-dy, closes at -): "00000000000123456-7" \|dy\| 1.78 -> 4.85 pt vs Chrome (baseline) — DEBT DEBT-10-boleto-1 |
| pdf-probe | `pdf-probe\|boleto\|p1\|CARTEIRA#1\|dy` | 2.53 | 5.6 | 1 pdf-probe-pt | DEBT-10-boleto-1 (class b, owner blitz:text-position-dy, closes at -): "CARTEIRA" \|dy\| 2.53 -> 5.6 pt vs Chrome (baseline) — DEBT DEBT-10-boleto-1 |
| pdf-probe | `pdf-probe\|boleto\|p1\|ESPÉCIE#2\|dy` | 2.53 | 5.6 | 1 pdf-probe-pt | DEBT-10-boleto-1 (class b, owner blitz:text-position-dy, closes at -): "ESPÉCIE" \|dy\| 2.53 -> 5.6 pt vs Chrome (baseline) — DEBT DEBT-10-boleto-1 |
| pdf-probe | `pdf-probe\|boleto\|p1\|MOEDA#1\|dy` | 2.53 | 5.6 | 1 pdf-probe-pt | DEBT-10-boleto-1 (class b, owner blitz:text-position-dy, closes at -): "MOEDA" \|dy\| 2.53 -> 5.6 pt vs Chrome (baseline) — DEBT DEBT-10-boleto-1 |
| pdf-probe | `pdf-probe\|boleto\|p1\|QUANTIDADE#1\|dy` | 2.53 | 5.6 | 1 pdf-probe-pt | DEBT-10-boleto-1 (class b, owner blitz:text-position-dy, closes at -): "QUANTIDADE" \|dy\| 2.53 -> 5.6 pt vs Chrome (baseline) — DEBT DEBT-10-boleto-1 |
| pdf-probe | `pdf-probe\|boleto\|p1\|(=)#1\|dy` | 2.53 | 5.6 | 1 pdf-probe-pt | DEBT-10-boleto-1 (class b, owner blitz:text-position-dy, closes at -): "(=)" \|dy\| 2.53 -> 5.6 pt vs Chrome (baseline) — DEBT DEBT-10-boleto-1 |
| pdf-probe | `pdf-probe\|boleto\|p1\|VALOR#2\|dy` | 2.53 | 5.6 | 1 pdf-probe-pt | DEBT-10-boleto-1 (class b, owner blitz:text-position-dy, closes at -): "VALOR" \|dy\| 2.53 -> 5.6 pt vs Chrome (baseline) — DEBT DEBT-10-boleto-1 |
| pdf-probe | `pdf-probe\|boleto\|p1\|DO#7\|dy` | 2.53 | 5.6 | 1 pdf-probe-pt | DEBT-10-boleto-1 (class b, owner blitz:text-position-dy, closes at -): "DO" \|dy\| 2.53 -> 5.6 pt vs Chrome (baseline) — DEBT DEBT-10-boleto-1 |
| pdf-probe | `pdf-probe\|boleto\|p1\|DOCUMENTO#4\|dy` | 2.53 | 5.6 | 1 pdf-probe-pt | DEBT-10-boleto-1 (class b, owner blitz:text-position-dy, closes at -): "DOCUMENTO" \|dy\| 2.53 -> 5.6 pt vs Chrome (baseline) — DEBT DEBT-10-boleto-1 |
| pdf-probe | `pdf-probe\|boleto\|p1\|17#1\|dy` | 3.28 | 6.35 | 1 pdf-probe-pt | DEBT-10-boleto-1 (class b, owner blitz:text-position-dy, closes at -): "17" \|dy\| 3.28 -> 6.35 pt vs Chrome (baseline) — DEBT DEBT-10-boleto-1 |
| pdf-probe | `pdf-probe\|boleto\|p1\|R$#2\|dy` | 3.28 | 6.35 | 1 pdf-probe-pt | DEBT-10-boleto-1 (class b, owner blitz:text-position-dy, closes at -): "R$" \|dy\| 3.28 -> 6.35 pt vs Chrome (baseline) — DEBT DEBT-10-boleto-1 |
| pdf-probe | `pdf-probe\|boleto\|p1\|1#3\|dy` | 3.28 | 6.35 | 1 pdf-probe-pt | DEBT-10-boleto-1 (class b, owner blitz:text-position-dy, closes at -): "1" \|dy\| 3.28 -> 6.35 pt vs Chrome (baseline) — DEBT DEBT-10-boleto-1 |
| pdf-probe | `pdf-probe\|boleto\|p1\|R$#3\|dy` | 3.28 | 6.35 | 1 pdf-probe-pt | DEBT-10-boleto-1 (class b, owner blitz:text-position-dy, closes at -): "R$" \|dy\| 3.28 -> 6.35 pt vs Chrome (baseline) — DEBT DEBT-10-boleto-1 |
| pdf-probe | `pdf-probe\|boleto\|p1\|1.842,50#2\|dy` | 3.28 | 6.35 | 1 pdf-probe-pt | DEBT-10-boleto-1 (class b, owner blitz:text-position-dy, closes at -): "1.842,50" \|dy\| 3.28 -> 6.35 pt vs Chrome (baseline) — DEBT DEBT-10-boleto-1 |
| pdf-probe | `pdf-probe\|boleto\|p1\|INSTRUÇÕES#1\|dy` | 4.03 | 7.1 | 1 pdf-probe-pt | DEBT-10-boleto-1 (class b, owner blitz:text-position-dy, closes at -): "INSTRUÇÕES" \|dy\| 4.03 -> 7.1 pt vs Chrome (baseline) — DEBT DEBT-10-boleto-1 |
| pdf-probe | `pdf-probe\|boleto\|p1\|(TEXTO#1\|dy` | 4.03 | 7.1 | 1 pdf-probe-pt | DEBT-10-boleto-1 (class b, owner blitz:text-position-dy, closes at -): "(TEXTO" \|dy\| 4.03 -> 7.1 pt vs Chrome (baseline) — DEBT DEBT-10-boleto-1 |
| pdf-probe | `pdf-probe\|boleto\|p1\|DE#2\|dy` | 4.03 | 7.1 | 1 pdf-probe-pt | DEBT-10-boleto-1 (class b, owner blitz:text-position-dy, closes at -): "DE" \|dy\| 4.03 -> 7.1 pt vs Chrome (baseline) — DEBT DEBT-10-boleto-1 |
| pdf-probe | `pdf-probe\|boleto\|p1\|RESPONSABILIDADE#1\|dy` | 4.03 | 7.1 | 1 pdf-probe-pt | DEBT-10-boleto-1 (class b, owner blitz:text-position-dy, closes at -): "RESPONSABILIDADE" \|dy\| 4.03 -> 7.1 pt vs Chrome (baseline) — DEBT DEBT-10-boleto-1 |
| pdf-probe | `pdf-probe\|boleto\|p1\|DO#8\|dy` | 4.03 | 7.1 | 1 pdf-probe-pt | DEBT-10-boleto-1 (class b, owner blitz:text-position-dy, closes at -): "DO" \|dy\| 4.03 -> 7.1 pt vs Chrome (baseline) — DEBT DEBT-10-boleto-1 |
| pdf-probe | `pdf-probe\|boleto\|p1\|BENEFICIÁRIO)#1\|dy` | 4.03 | 7.1 | 1 pdf-probe-pt | DEBT-10-boleto-1 (class b, owner blitz:text-position-dy, closes at -): "BENEFICIÁRIO)" \|dy\| 4.03 -> 7.1 pt vs Chrome (baseline) — DEBT DEBT-10-boleto-1 |
| pdf-probe | `pdf-probe\|boleto\|p1\|(-)#1\|dy` | 4.03 | 7.1 | 1 pdf-probe-pt | DEBT-10-boleto-1 (class b, owner blitz:text-position-dy, closes at -): "(-)" \|dy\| 4.03 -> 7.1 pt vs Chrome (baseline) — DEBT DEBT-10-boleto-1 |
| pdf-probe | `pdf-probe\|boleto\|p1\|DESCONTO#1\|dy` | 4.03 | 7.1 | 1 pdf-probe-pt | DEBT-10-boleto-1 (class b, owner blitz:text-position-dy, closes at -): "DESCONTO" \|dy\| 4.03 -> 7.1 pt vs Chrome (baseline) — DEBT DEBT-10-boleto-1 |
| pdf-probe | `pdf-probe\|boleto\|p1\|/#5\|dy` | 4.03 | 7.1 | 1 pdf-probe-pt | DEBT-10-boleto-1 (class b, owner blitz:text-position-dy, closes at -): "/" \|dy\| 4.03 -> 7.1 pt vs Chrome (baseline) — DEBT DEBT-10-boleto-1 |
| pdf-probe | `pdf-probe\|boleto\|p1\|ABATIMENTO#1\|dy` | 4.03 | 7.1 | 1 pdf-probe-pt | DEBT-10-boleto-1 (class b, owner blitz:text-position-dy, closes at -): "ABATIMENTO" \|dy\| 4.03 -> 7.1 pt vs Chrome (baseline) — DEBT DEBT-10-boleto-1 |
| pdf-probe | `pdf-probe\|boleto\|p1\|•#1\|dy` | 4.78 | 7.85 | 1 pdf-probe-pt | DEBT-10-boleto-1 (class b, owner blitz:text-position-dy, closes at -): "•" \|dy\| 4.78 -> 7.85 pt vs Chrome (baseline) — DEBT DEBT-10-boleto-1 |
| pdf-probe | `pdf-probe\|boleto\|p1\|Não#1\|dy` | 4.78 | 7.85 | 1 pdf-probe-pt | DEBT-10-boleto-1 (class b, owner blitz:text-position-dy, closes at -): "Não" \|dy\| 4.78 -> 7.85 pt vs Chrome (baseline) — DEBT DEBT-10-boleto-1 |
| pdf-probe | `pdf-probe\|boleto\|p1\|receber#1\|dy` | 4.78 | 7.85 | 1 pdf-probe-pt | DEBT-10-boleto-1 (class b, owner blitz:text-position-dy, closes at -): "receber" \|dy\| 4.78 -> 7.85 pt vs Chrome (baseline) — DEBT DEBT-10-boleto-1 |
| pdf-probe | `pdf-probe\|boleto\|p1\|após#1\|dy` | 4.78 | 7.85 | 1 pdf-probe-pt | DEBT-10-boleto-1 (class b, owner blitz:text-position-dy, closes at -): "após" \|dy\| 4.78 -> 7.85 pt vs Chrome (baseline) — DEBT DEBT-10-boleto-1 |
| pdf-probe | `pdf-probe\|boleto\|p1\|30#1\|dy` | 4.78 | 7.85 | 1 pdf-probe-pt | DEBT-10-boleto-1 (class b, owner blitz:text-position-dy, closes at -): "30" \|dy\| 4.78 -> 7.85 pt vs Chrome (baseline) — DEBT DEBT-10-boleto-1 |
| pdf-probe | `pdf-probe\|boleto\|p1\|dias#1\|dy` | 4.78 | 7.85 | 1 pdf-probe-pt | DEBT-10-boleto-1 (class b, owner blitz:text-position-dy, closes at -): "dias" \|dy\| 4.78 -> 7.85 pt vs Chrome (baseline) — DEBT DEBT-10-boleto-1 |
| pdf-probe | `pdf-probe\|boleto\|p1\|do#1\|dy` | 4.78 | 7.85 | 1 pdf-probe-pt | DEBT-10-boleto-1 (class b, owner blitz:text-position-dy, closes at -): "do" \|dy\| 4.78 -> 7.85 pt vs Chrome (baseline) — DEBT DEBT-10-boleto-1 |
| pdf-probe | `pdf-probe\|boleto\|p1\|vencimento.#1\|dy` | 4.78 | 7.85 | 1 pdf-probe-pt | DEBT-10-boleto-1 (class b, owner blitz:text-position-dy, closes at -): "vencimento." \|dy\| 4.78 -> 7.85 pt vs Chrome (baseline) — DEBT DEBT-10-boleto-1 |
| pdf-probe | `pdf-probe\|boleto\|p1\|R$#4\|dy` | 4.78 | 7.85 | 1 pdf-probe-pt | DEBT-10-boleto-1 (class b, owner blitz:text-position-dy, closes at -): "R$" \|dy\| 4.78 -> 7.85 pt vs Chrome (baseline) — DEBT DEBT-10-boleto-1 |
| pdf-probe | `pdf-probe\|boleto\|p1\|0,00#1\|dy` | 4.78 | 7.85 | 1 pdf-probe-pt | DEBT-10-boleto-1 (class b, owner blitz:text-position-dy, closes at -): "0,00" \|dy\| 4.78 -> 7.85 pt vs Chrome (baseline) — DEBT DEBT-10-boleto-1 |
| pdf-probe | `pdf-probe\|boleto\|p1\|•#2\|dy` | 4.03 | 7.1 | 1 pdf-probe-pt | DEBT-10-boleto-1 (class b, owner blitz:text-position-dy, closes at -): "•" \|dy\| 4.03 -> 7.1 pt vs Chrome (baseline) — DEBT DEBT-10-boleto-1 |
| pdf-probe | `pdf-probe\|boleto\|p1\|Após#1\|dy` | 4.03 | 7.1 | 1 pdf-probe-pt | DEBT-10-boleto-1 (class b, owner blitz:text-position-dy, closes at -): "Após" \|dy\| 4.03 -> 7.1 pt vs Chrome (baseline) — DEBT DEBT-10-boleto-1 |
| pdf-probe | `pdf-probe\|boleto\|p1\|o#2\|dy` | 4.03 | 7.1 | 1 pdf-probe-pt | DEBT-10-boleto-1 (class b, owner blitz:text-position-dy, closes at -): "o" \|dy\| 4.03 -> 7.1 pt vs Chrome (baseline) — DEBT DEBT-10-boleto-1 |
| pdf-probe | `pdf-probe\|boleto\|p1\|vencimento,#1\|dy` | 4.03 | 7.1 | 1 pdf-probe-pt | DEBT-10-boleto-1 (class b, owner blitz:text-position-dy, closes at -): "vencimento," \|dy\| 4.03 -> 7.1 pt vs Chrome (baseline) — DEBT DEBT-10-boleto-1 |
| pdf-probe | `pdf-probe\|boleto\|p1\|cobrar#1\|dy` | 4.03 | 7.1 | 1 pdf-probe-pt | DEBT-10-boleto-1 (class b, owner blitz:text-position-dy, closes at -): "cobrar" \|dy\| 4.03 -> 7.1 pt vs Chrome (baseline) — DEBT DEBT-10-boleto-1 |
| pdf-probe | `pdf-probe\|boleto\|p1\|multa#1\|dy` | 4.03 | 7.1 | 1 pdf-probe-pt | DEBT-10-boleto-1 (class b, owner blitz:text-position-dy, closes at -): "multa" \|dy\| 4.03 -> 7.1 pt vs Chrome (baseline) — DEBT DEBT-10-boleto-1 |
| pdf-probe | `pdf-probe\|boleto\|p1\|de#3\|dy` | 4.03 | 7.1 | 1 pdf-probe-pt | DEBT-10-boleto-1 (class b, owner blitz:text-position-dy, closes at -): "de" \|dy\| 4.03 -> 7.1 pt vs Chrome (baseline) — DEBT DEBT-10-boleto-1 |
| pdf-probe | `pdf-probe\|boleto\|p1\|2%#1\|dy` | 4.03 | 7.1 | 1 pdf-probe-pt | DEBT-10-boleto-1 (class b, owner blitz:text-position-dy, closes at -): "2%" \|dy\| 4.03 -> 7.1 pt vs Chrome (baseline) — DEBT DEBT-10-boleto-1 |
| pdf-probe | `pdf-probe\|boleto\|p1\|e#1\|dy` | 4.03 | 7.1 | 1 pdf-probe-pt | DEBT-10-boleto-1 (class b, owner blitz:text-position-dy, closes at -): "e" \|dy\| 4.03 -> 7.1 pt vs Chrome (baseline) — DEBT DEBT-10-boleto-1 |
| pdf-probe | `pdf-probe\|boleto\|p1\|mora#1\|dy` | 4.03 | 7.1 | 1 pdf-probe-pt | DEBT-10-boleto-1 (class b, owner blitz:text-position-dy, closes at -): "mora" \|dy\| 4.03 -> 7.1 pt vs Chrome (baseline) — DEBT DEBT-10-boleto-1 |
| pdf-probe | `pdf-probe\|boleto\|p1\|de#4\|dy` | 4.03 | 7.1 | 1 pdf-probe-pt | DEBT-10-boleto-1 (class b, owner blitz:text-position-dy, closes at -): "de" \|dy\| 4.03 -> 7.1 pt vs Chrome (baseline) — DEBT DEBT-10-boleto-1 |
| pdf-probe | `pdf-probe\|boleto\|p1\|1%#1\|dy` | 4.03 | 7.1 | 1 pdf-probe-pt | DEBT-10-boleto-1 (class b, owner blitz:text-position-dy, closes at -): "1%" \|dy\| 4.03 -> 7.1 pt vs Chrome (baseline) — DEBT DEBT-10-boleto-1 |
| pdf-probe | `pdf-probe\|boleto\|p1\|ao#1\|dy` | 4.03 | 7.1 | 1 pdf-probe-pt | DEBT-10-boleto-1 (class b, owner blitz:text-position-dy, closes at -): "ao" \|dy\| 4.03 -> 7.1 pt vs Chrome (baseline) — DEBT DEBT-10-boleto-1 |
| pdf-probe | `pdf-probe\|boleto\|p1\|mês.#1\|dy` | 4.03 | 7.1 | 1 pdf-probe-pt | DEBT-10-boleto-1 (class b, owner blitz:text-position-dy, closes at -): "mês." \|dy\| 4.03 -> 7.1 pt vs Chrome (baseline) — DEBT DEBT-10-boleto-1 |
| pdf-probe | `pdf-probe\|boleto\|p1\|(-)#2\|dy` | 6.28 | 9.35 | 1 pdf-probe-pt | DEBT-10-boleto-1 (class b, owner blitz:text-position-dy, closes at -): "(-)" \|dy\| 6.28 -> 9.35 pt vs Chrome (baseline) — DEBT DEBT-10-boleto-1 |
| pdf-probe | `pdf-probe\|boleto\|p1\|OUTRAS#1\|dy` | 6.28 | 9.35 | 1 pdf-probe-pt | DEBT-10-boleto-1 (class b, owner blitz:text-position-dy, closes at -): "OUTRAS" \|dy\| 6.28 -> 9.35 pt vs Chrome (baseline) — DEBT DEBT-10-boleto-1 |
| pdf-probe | `pdf-probe\|boleto\|p1\|DEDUÇÕES#1\|dy` | 6.28 | 9.35 | 1 pdf-probe-pt | DEBT-10-boleto-1 (class b, owner blitz:text-position-dy, closes at -): "DEDUÇÕES" \|dy\| 6.28 -> 9.35 pt vs Chrome (baseline) — DEBT DEBT-10-boleto-1 |
| pdf-probe | `pdf-probe\|boleto\|p1\|•#3\|dy` | 4.03 | 7.1 | 1 pdf-probe-pt | DEBT-10-boleto-1 (class b, owner blitz:text-position-dy, closes at -): "•" \|dy\| 4.03 -> 7.1 pt vs Chrome (baseline) — DEBT DEBT-10-boleto-1 |
| pdf-probe | `pdf-probe\|boleto\|p1\|Em#1\|dy` | 4.03 | 7.1 | 1 pdf-probe-pt | DEBT-10-boleto-1 (class b, owner blitz:text-position-dy, closes at -): "Em" \|dy\| 4.03 -> 7.1 pt vs Chrome (baseline) — DEBT DEBT-10-boleto-1 |
| pdf-probe | `pdf-probe\|boleto\|p1\|caso#1\|dy` | 4.03 | 7.1 | 1 pdf-probe-pt | DEBT-10-boleto-1 (class b, owner blitz:text-position-dy, closes at -): "caso" \|dy\| 4.03 -> 7.1 pt vs Chrome (baseline) — DEBT DEBT-10-boleto-1 |
| pdf-probe | `pdf-probe\|boleto\|p1\|de#5\|dy` | 4.03 | 7.1 | 1 pdf-probe-pt | DEBT-10-boleto-1 (class b, owner blitz:text-position-dy, closes at -): "de" \|dy\| 4.03 -> 7.1 pt vs Chrome (baseline) — DEBT DEBT-10-boleto-1 |
| pdf-probe | `pdf-probe\|boleto\|p1\|dúvida#1\|dy` | 4.03 | 7.1 | 1 pdf-probe-pt | DEBT-10-boleto-1 (class b, owner blitz:text-position-dy, closes at -): "dúvida" \|dy\| 4.03 -> 7.1 pt vs Chrome (baseline) — DEBT DEBT-10-boleto-1 |
| pdf-probe | `pdf-probe\|boleto\|p1\|sobre#1\|dy` | 4.03 | 7.1 | 1 pdf-probe-pt | DEBT-10-boleto-1 (class b, owner blitz:text-position-dy, closes at -): "sobre" \|dy\| 4.03 -> 7.1 pt vs Chrome (baseline) — DEBT DEBT-10-boleto-1 |
| pdf-probe | `pdf-probe\|boleto\|p1\|este#1\|dy` | 4.03 | 7.1 | 1 pdf-probe-pt | DEBT-10-boleto-1 (class b, owner blitz:text-position-dy, closes at -): "este" \|dy\| 4.03 -> 7.1 pt vs Chrome (baseline) — DEBT DEBT-10-boleto-1 |
| pdf-probe | `pdf-probe\|boleto\|p1\|documento#1\|dy` | 4.03 | 7.1 | 1 pdf-probe-pt | DEBT-10-boleto-1 (class b, owner blitz:text-position-dy, closes at -): "documento" \|dy\| 4.03 -> 7.1 pt vs Chrome (baseline) — DEBT DEBT-10-boleto-1 |
| pdf-probe | `pdf-probe\|boleto\|p1\|de#6\|dy` | 4.03 | 7.1 | 1 pdf-probe-pt | DEBT-10-boleto-1 (class b, owner blitz:text-position-dy, closes at -): "de" \|dy\| 4.03 -> 7.1 pt vs Chrome (baseline) — DEBT DEBT-10-boleto-1 |
| pdf-probe | `pdf-probe\|boleto\|p1\|teste,#1\|dy` | 4.03 | 7.1 | 1 pdf-probe-pt | DEBT-10-boleto-1 (class b, owner blitz:text-position-dy, closes at -): "teste," \|dy\| 4.03 -> 7.1 pt vs Chrome (baseline) — DEBT DEBT-10-boleto-1 |
| pdf-probe | `pdf-probe\|boleto\|p1\|contate#1\|dy` | 4.03 | 7.1 | 1 pdf-probe-pt | DEBT-10-boleto-1 (class b, owner blitz:text-position-dy, closes at -): "contate" \|dy\| 4.03 -> 7.1 pt vs Chrome (baseline) — DEBT DEBT-10-boleto-1 |
| pdf-probe | `pdf-probe\|boleto\|p1\|o#3\|dy` | 4.03 | 7.1 | 1 pdf-probe-pt | DEBT-10-boleto-1 (class b, owner blitz:text-position-dy, closes at -): "o" \|dy\| 4.03 -> 7.1 pt vs Chrome (baseline) — DEBT DEBT-10-boleto-1 |
| pdf-probe | `pdf-probe\|boleto\|p1\|emissor#1\|dy` | 4.03 | 7.1 | 1 pdf-probe-pt | DEBT-10-boleto-1 (class b, owner blitz:text-position-dy, closes at -): "emissor" \|dy\| 4.03 -> 7.1 pt vs Chrome (baseline) — DEBT DEBT-10-boleto-1 |
| pdf-probe | `pdf-probe\|boleto\|p1\|fictício.#1\|dy` | 4.03 | 7.1 | 1 pdf-probe-pt | DEBT-10-boleto-1 (class b, owner blitz:text-position-dy, closes at -): "fictício." \|dy\| 4.03 -> 7.1 pt vs Chrome (baseline) — DEBT DEBT-10-boleto-1 |
| pdf-probe | `pdf-probe\|boleto\|p1\|R$#5\|dy` | 5.53 | 8.6 | 1 pdf-probe-pt | DEBT-10-boleto-1 (class b, owner blitz:text-position-dy, closes at -): "R$" \|dy\| 5.53 -> 8.6 pt vs Chrome (baseline) — DEBT DEBT-10-boleto-1 |
| pdf-probe | `pdf-probe\|boleto\|p1\|0,00#2\|dy` | 5.53 | 8.6 | 1 pdf-probe-pt | DEBT-10-boleto-1 (class b, owner blitz:text-position-dy, closes at -): "0,00" \|dy\| 5.53 -> 8.6 pt vs Chrome (baseline) — DEBT DEBT-10-boleto-1 |
| pdf-probe | `pdf-probe\|boleto\|p1\|Desconto#1\|dy` | 4.78 | 7.85 | 1 pdf-probe-pt | DEBT-10-boleto-1 (class b, owner blitz:text-position-dy, closes at -): "Desconto" \|dy\| 4.78 -> 7.85 pt vs Chrome (baseline) — DEBT DEBT-10-boleto-1 |
| pdf-probe | `pdf-probe\|boleto\|p1\|de#7\|dy` | 4.78 | 7.85 | 1 pdf-probe-pt | DEBT-10-boleto-1 (class b, owner blitz:text-position-dy, closes at -): "de" \|dy\| 4.78 -> 7.85 pt vs Chrome (baseline) — DEBT DEBT-10-boleto-1 |
| pdf-probe | `pdf-probe\|boleto\|p1\|R$#6\|dy` | 4.78 | 7.85 | 1 pdf-probe-pt | DEBT-10-boleto-1 (class b, owner blitz:text-position-dy, closes at -): "R$" \|dy\| 4.78 -> 7.85 pt vs Chrome (baseline) — DEBT DEBT-10-boleto-1 |
| pdf-probe | `pdf-probe\|boleto\|p1\|92,13#1\|dy` | 4.78 | 7.85 | 1 pdf-probe-pt | DEBT-10-boleto-1 (class b, owner blitz:text-position-dy, closes at -): "92,13" \|dy\| 4.78 -> 7.85 pt vs Chrome (baseline) — DEBT DEBT-10-boleto-1 |
| pdf-probe | `pdf-probe\|boleto\|p1\|para#1\|dy` | 4.78 | 7.85 | 1 pdf-probe-pt | DEBT-10-boleto-1 (class b, owner blitz:text-position-dy, closes at -): "para" \|dy\| 4.78 -> 7.85 pt vs Chrome (baseline) — DEBT DEBT-10-boleto-1 |
| pdf-probe | `pdf-probe\|boleto\|p1\|pagamento#1\|dy` | 4.78 | 7.85 | 1 pdf-probe-pt | DEBT-10-boleto-1 (class b, owner blitz:text-position-dy, closes at -): "pagamento" \|dy\| 4.78 -> 7.85 pt vs Chrome (baseline) — DEBT DEBT-10-boleto-1 |
| pdf-probe | `pdf-probe\|boleto\|p1\|até#2\|dy` | 4.78 | 7.85 | 1 pdf-probe-pt | DEBT-10-boleto-1 (class b, owner blitz:text-position-dy, closes at -): "até" \|dy\| 4.78 -> 7.85 pt vs Chrome (baseline) — DEBT DEBT-10-boleto-1 |
| pdf-probe | `pdf-probe\|boleto\|p1\|05/07/2026.#1\|dy` | 4.78 | 7.85 | 1 pdf-probe-pt | DEBT-10-boleto-1 (class b, owner blitz:text-position-dy, closes at -): "05/07/2026." \|dy\| 4.78 -> 7.85 pt vs Chrome (baseline) — DEBT DEBT-10-boleto-1 |
| pdf-probe | `pdf-probe\|boleto\|p1\|(+)#1\|dy` | 7.78 | 10.85 | 1 pdf-probe-pt | DEBT-10-boleto-1 (class b, owner blitz:text-position-dy, closes at -): "(+)" \|dy\| 7.78 -> 10.85 pt vs Chrome (baseline) — DEBT DEBT-10-boleto-1 |
| pdf-probe | `pdf-probe\|boleto\|p1\|MORA#1\|dy` | 7.78 | 10.85 | 1 pdf-probe-pt | DEBT-10-boleto-1 (class b, owner blitz:text-position-dy, closes at -): "MORA" \|dy\| 7.78 -> 10.85 pt vs Chrome (baseline) — DEBT DEBT-10-boleto-1 |
| pdf-probe | `pdf-probe\|boleto\|p1\|/#6\|dy` | 7.78 | 10.85 | 1 pdf-probe-pt | DEBT-10-boleto-1 (class b, owner blitz:text-position-dy, closes at -): "/" \|dy\| 7.78 -> 10.85 pt vs Chrome (baseline) — DEBT DEBT-10-boleto-1 |
| pdf-probe | `pdf-probe\|boleto\|p1\|MULTA#1\|dy` | 7.78 | 10.85 | 1 pdf-probe-pt | DEBT-10-boleto-1 (class b, owner blitz:text-position-dy, closes at -): "MULTA" \|dy\| 7.78 -> 10.85 pt vs Chrome (baseline) — DEBT DEBT-10-boleto-1 |
| pdf-probe | `pdf-probe\|boleto\|p1\|R$#7\|dy` | 7.03 | 10.1 | 1 pdf-probe-pt | DEBT-10-boleto-1 (class b, owner blitz:text-position-dy, closes at -): "R$" \|dy\| 7.03 -> 10.1 pt vs Chrome (baseline) — DEBT DEBT-10-boleto-1 |
| pdf-probe | `pdf-probe\|boleto\|p1\|0,00#3\|dy` | 7.03 | 10.1 | 1 pdf-probe-pt | DEBT-10-boleto-1 (class b, owner blitz:text-position-dy, closes at -): "0,00" \|dy\| 7.03 -> 10.1 pt vs Chrome (baseline) — DEBT DEBT-10-boleto-1 |
| pdf-probe | `pdf-probe\|boleto\|p1\|(=)#2\|dy` | 9.28 | 12.35 | 1 pdf-probe-pt | DEBT-10-boleto-1 (class b, owner blitz:text-position-dy, closes at -): "(=)" \|dy\| 9.28 -> 12.35 pt vs Chrome (baseline) — DEBT DEBT-10-boleto-1 |
| pdf-probe | `pdf-probe\|boleto\|p1\|VALOR#3\|dy` | 9.28 | 12.35 | 1 pdf-probe-pt | DEBT-10-boleto-1 (class b, owner blitz:text-position-dy, closes at -): "VALOR" \|dy\| 9.28 -> 12.35 pt vs Chrome (baseline) — DEBT DEBT-10-boleto-1 |
| pdf-probe | `pdf-probe\|boleto\|p1\|COBRADO#1\|dy` | 9.28 | 12.35 | 1 pdf-probe-pt | DEBT-10-boleto-1 (class b, owner blitz:text-position-dy, closes at -): "COBRADO" \|dy\| 9.28 -> 12.35 pt vs Chrome (baseline) — DEBT DEBT-10-boleto-1 |
| pdf-probe | `pdf-probe\|boleto\|p1\|R$#8\|dy` | 8.53 | 11.6 | 1 pdf-probe-pt | DEBT-10-boleto-1 (class b, owner blitz:text-position-dy, closes at -): "R$" \|dy\| 8.53 -> 11.6 pt vs Chrome (baseline) — DEBT DEBT-10-boleto-1 |
| pdf-probe | `pdf-probe\|boleto\|p1\|1.842,50#3\|dy` | 8.53 | 11.6 | 1 pdf-probe-pt | DEBT-10-boleto-1 (class b, owner blitz:text-position-dy, closes at -): "1.842,50" \|dy\| 8.53 -> 11.6 pt vs Chrome (baseline) — DEBT DEBT-10-boleto-1 |
| pdf-probe | `pdf-probe\|boleto\|p1\|PAGADOR#2\|dy` | 10.78 | 13.85 | 1 pdf-probe-pt | DEBT-10-boleto-1 (class b, owner blitz:text-position-dy, closes at -): "PAGADOR" \|dy\| 10.78 -> 13.85 pt vs Chrome (baseline) — DEBT DEBT-10-boleto-1 |
| pdf-probe | `pdf-probe\|boleto\|p1\|Maria#1\|dy` | 10.78 | 13.85 | 1 pdf-probe-pt | DEBT-10-boleto-1 (class b, owner blitz:text-position-dy, closes at -): "Maria" \|dy\| 10.78 -> 13.85 pt vs Chrome (baseline) — DEBT DEBT-10-boleto-1 |
| pdf-probe | `pdf-probe\|boleto\|p1\|das#1\|dy` | 10.78 | 13.85 | 1 pdf-probe-pt | DEBT-10-boleto-1 (class b, owner blitz:text-position-dy, closes at -): "das" \|dy\| 10.78 -> 13.85 pt vs Chrome (baseline) — DEBT DEBT-10-boleto-1 |
| pdf-probe | `pdf-probe\|boleto\|p1\|Couves#1\|dy` | 10.78 | 13.85 | 1 pdf-probe-pt | DEBT-10-boleto-1 (class b, owner blitz:text-position-dy, closes at -): "Couves" \|dy\| 10.78 -> 13.85 pt vs Chrome (baseline) — DEBT DEBT-10-boleto-1 |
| pdf-probe | `pdf-probe\|boleto\|p1\|Exemplo#1\|dy` | 10.78 | 13.85 | 1 pdf-probe-pt | DEBT-10-boleto-1 (class b, owner blitz:text-position-dy, closes at -): "Exemplo" \|dy\| 10.78 -> 13.85 pt vs Chrome (baseline) — DEBT DEBT-10-boleto-1 |
| pdf-probe | `pdf-probe\|boleto\|p1\|—#3\|dy` | 10.78 | 13.85 | 1 pdf-probe-pt | DEBT-10-boleto-1 (class b, owner blitz:text-position-dy, closes at -): "—" \|dy\| 10.78 -> 13.85 pt vs Chrome (baseline) — DEBT DEBT-10-boleto-1 |
| pdf-probe | `pdf-probe\|boleto\|p1\|CPF#1\|dy` | 10.78 | 13.85 | 1 pdf-probe-pt | DEBT-10-boleto-1 (class b, owner blitz:text-position-dy, closes at -): "CPF" \|dy\| 10.78 -> 13.85 pt vs Chrome (baseline) — DEBT DEBT-10-boleto-1 |
| pdf-probe | `pdf-probe\|boleto\|p1\|123.456.789-09#1\|dy` | 10.78 | 13.85 | 1 pdf-probe-pt | DEBT-10-boleto-1 (class b, owner blitz:text-position-dy, closes at -): "123.456.789-09" \|dy\| 10.78 -> 13.85 pt vs Chrome (baseline) — DEBT DEBT-10-boleto-1 |
| pdf-probe | `pdf-probe\|boleto\|p1\|Rua#1\|dy` | 10.78 | 13.85 | 1 pdf-probe-pt | DEBT-10-boleto-1 (class b, owner blitz:text-position-dy, closes at -): "Rua" \|dy\| 10.78 -> 13.85 pt vs Chrome (baseline) — DEBT DEBT-10-boleto-1 |
| pdf-probe | `pdf-probe\|boleto\|p1\|das#2\|dy` | 10.78 | 13.85 | 1 pdf-probe-pt | DEBT-10-boleto-1 (class b, owner blitz:text-position-dy, closes at -): "das" \|dy\| 10.78 -> 13.85 pt vs Chrome (baseline) — DEBT DEBT-10-boleto-1 |
| pdf-probe | `pdf-probe\|boleto\|p1\|Flores,#1\|dy` | 10.78 | 13.85 | 1 pdf-probe-pt | DEBT-10-boleto-1 (class b, owner blitz:text-position-dy, closes at -): "Flores," \|dy\| 10.78 -> 13.85 pt vs Chrome (baseline) — DEBT DEBT-10-boleto-1 |
| pdf-probe | `pdf-probe\|boleto\|p1\|123#1\|dy` | 10.78 | 13.85 | 1 pdf-probe-pt | DEBT-10-boleto-1 (class b, owner blitz:text-position-dy, closes at -): "123" \|dy\| 10.78 -> 13.85 pt vs Chrome (baseline) — DEBT DEBT-10-boleto-1 |
| pdf-probe | `pdf-probe\|boleto\|p1\|—#4\|dy` | 10.78 | 13.85 | 1 pdf-probe-pt | DEBT-10-boleto-1 (class b, owner blitz:text-position-dy, closes at -): "—" \|dy\| 10.78 -> 13.85 pt vs Chrome (baseline) — DEBT DEBT-10-boleto-1 |
| pdf-probe | `pdf-probe\|boleto\|p1\|Jardim#1\|dy` | 10.78 | 13.85 | 1 pdf-probe-pt | DEBT-10-boleto-1 (class b, owner blitz:text-position-dy, closes at -): "Jardim" \|dy\| 10.78 -> 13.85 pt vs Chrome (baseline) — DEBT DEBT-10-boleto-1 |
| pdf-probe | `pdf-probe\|boleto\|p1\|Sintético#1\|dy` | 10.78 | 13.85 | 1 pdf-probe-pt | DEBT-10-boleto-1 (class b, owner blitz:text-position-dy, closes at -): "Sintético" \|dy\| 10.78 -> 13.85 pt vs Chrome (baseline) — DEBT DEBT-10-boleto-1 |
| pdf-probe | `pdf-probe\|boleto\|p1\|Cidade#1\|dy` | 10.78 | 13.85 | 1 pdf-probe-pt | DEBT-10-boleto-1 (class b, owner blitz:text-position-dy, closes at -): "Cidade" \|dy\| 10.78 -> 13.85 pt vs Chrome (baseline) — DEBT DEBT-10-boleto-1 |
| pdf-probe | `pdf-probe\|boleto\|p1\|Exemplo#2\|dy` | 10.78 | 13.85 | 1 pdf-probe-pt | DEBT-10-boleto-1 (class b, owner blitz:text-position-dy, closes at -): "Exemplo" \|dy\| 10.78 -> 13.85 pt vs Chrome (baseline) — DEBT DEBT-10-boleto-1 |
| pdf-probe | `pdf-probe\|boleto\|p1\|/#7\|dy` | 10.78 | 13.85 | 1 pdf-probe-pt | DEBT-10-boleto-1 (class b, owner blitz:text-position-dy, closes at -): "/" \|dy\| 10.78 -> 13.85 pt vs Chrome (baseline) — DEBT DEBT-10-boleto-1 |
| pdf-probe | `pdf-probe\|boleto\|p1\|SP#1\|dy` | 10.78 | 13.85 | 1 pdf-probe-pt | DEBT-10-boleto-1 (class b, owner blitz:text-position-dy, closes at -): "SP" \|dy\| 10.78 -> 13.85 pt vs Chrome (baseline) — DEBT DEBT-10-boleto-1 |
| pdf-probe | `pdf-probe\|boleto\|p1\|—#5\|dy` | 10.78 | 13.85 | 1 pdf-probe-pt | DEBT-10-boleto-1 (class b, owner blitz:text-position-dy, closes at -): "—" \|dy\| 10.78 -> 13.85 pt vs Chrome (baseline) — DEBT DEBT-10-boleto-1 |
| pdf-probe | `pdf-probe\|boleto\|p1\|CEP#1\|dy` | 10.78 | 13.85 | 1 pdf-probe-pt | DEBT-10-boleto-1 (class b, owner blitz:text-position-dy, closes at -): "CEP" \|dy\| 10.78 -> 13.85 pt vs Chrome (baseline) — DEBT DEBT-10-boleto-1 |
| pdf-probe | `pdf-probe\|boleto\|p1\|01234-567#1\|dy` | 10.78 | 13.85 | 1 pdf-probe-pt | DEBT-10-boleto-1 (class b, owner blitz:text-position-dy, closes at -): "01234-567" \|dy\| 10.78 -> 13.85 pt vs Chrome (baseline) — DEBT DEBT-10-boleto-1 |
| pdf-probe | `pdf-probe\|boleto\|p1\|REFERÊNCIA#1\|dy` | 12.28 | 15.35 | 1 pdf-probe-pt | DEBT-10-boleto-1 (class b, owner blitz:text-position-dy, closes at -): "REFERÊNCIA" \|dy\| 12.28 -> 15.35 pt vs Chrome (baseline) — DEBT DEBT-10-boleto-1 |
| pdf-probe | `pdf-probe\|boleto\|p1\|DESCRIÇÃO#1\|dy` | 12.28 | 15.35 | 1 pdf-probe-pt | DEBT-10-boleto-1 (class b, owner blitz:text-position-dy, closes at -): "DESCRIÇÃO" \|dy\| 12.28 -> 15.35 pt vs Chrome (baseline) — DEBT DEBT-10-boleto-1 |
| pdf-probe | `pdf-probe\|boleto\|p1\|VALOR#4\|dy` | 12.28 | 15.35 | 1 pdf-probe-pt | DEBT-10-boleto-1 (class b, owner blitz:text-position-dy, closes at -): "VALOR" \|dy\| 12.28 -> 15.35 pt vs Chrome (baseline) — DEBT DEBT-10-boleto-1 |
| pdf-probe | `pdf-probe\|boleto\|p1\|06/2026#1\|dy` | 12.28 | 15.35 | 1 pdf-probe-pt | DEBT-10-boleto-2 (class b, owner blitz:text-position-dy, closes at -): "06/2026" \|dy\| 12.28 -> 15.35 pt vs Chrome (baseline) — DEBT DEBT-10-boleto-2 |
| pdf-probe | `pdf-probe\|boleto\|p1\|Assinatura#1\|dy` | 12.28 | 15.35 | 1 pdf-probe-pt | DEBT-10-boleto-2 (class b, owner blitz:text-position-dy, closes at -): "Assinatura" \|dy\| 12.28 -> 15.35 pt vs Chrome (baseline) — DEBT DEBT-10-boleto-2 |
| pdf-probe | `pdf-probe\|boleto\|p1\|plano#1\|dy` | 12.28 | 15.35 | 1 pdf-probe-pt | DEBT-10-boleto-2 (class b, owner blitz:text-position-dy, closes at -): "plano" \|dy\| 12.28 -> 15.35 pt vs Chrome (baseline) — DEBT DEBT-10-boleto-2 |
| pdf-probe | `pdf-probe\|boleto\|p1\|Widget#1\|dy` | 12.28 | 15.35 | 1 pdf-probe-pt | DEBT-10-boleto-2 (class b, owner blitz:text-position-dy, closes at -): "Widget" \|dy\| 12.28 -> 15.35 pt vs Chrome (baseline) — DEBT DEBT-10-boleto-2 |
| pdf-probe | `pdf-probe\|boleto\|p1\|Pro#1\|dy` | 12.28 | 15.35 | 1 pdf-probe-pt | DEBT-10-boleto-2 (class b, owner blitz:text-position-dy, closes at -): "Pro" \|dy\| 12.28 -> 15.35 pt vs Chrome (baseline) — DEBT DEBT-10-boleto-2 |
| pdf-probe | `pdf-probe\|boleto\|p1\|R$#9\|dy` | 12.28 | 15.35 | 1 pdf-probe-pt | DEBT-10-boleto-2 (class b, owner blitz:text-position-dy, closes at -): "R$" \|dy\| 12.28 -> 15.35 pt vs Chrome (baseline) — DEBT DEBT-10-boleto-2 |
| pdf-probe | `pdf-probe\|boleto\|p1\|1.499,00#1\|dy` | 12.28 | 15.35 | 1 pdf-probe-pt | DEBT-10-boleto-2 (class b, owner blitz:text-position-dy, closes at -): "1.499,00" \|dy\| 12.28 -> 15.35 pt vs Chrome (baseline) — DEBT DEBT-10-boleto-2 |
| pdf-probe | `pdf-probe\|boleto\|p1\|06/2026#2\|dy` | 13.03 | 16.1 | 1 pdf-probe-pt | DEBT-10-boleto-2 (class b, owner blitz:text-position-dy, closes at -): "06/2026" \|dy\| 13.03 -> 16.1 pt vs Chrome (baseline) — DEBT DEBT-10-boleto-2 |
| pdf-probe | `pdf-probe\|boleto\|p1\|Usuários#1\|dy` | 13.03 | 16.1 | 1 pdf-probe-pt | DEBT-10-boleto-2 (class b, owner blitz:text-position-dy, closes at -): "Usuários" \|dy\| 13.03 -> 16.1 pt vs Chrome (baseline) — DEBT DEBT-10-boleto-2 |
| pdf-probe | `pdf-probe\|boleto\|p1\|adicionais#1\|dy` | 13.03 | 16.1 | 1 pdf-probe-pt | DEBT-10-boleto-2 (class b, owner blitz:text-position-dy, closes at -): "adicionais" \|dy\| 13.03 -> 16.1 pt vs Chrome (baseline) — DEBT DEBT-10-boleto-2 |
| pdf-probe | `pdf-probe\|boleto\|p1\|(3x)#1\|dy` | 13.03 | 16.1 | 1 pdf-probe-pt | DEBT-10-boleto-2 (class b, owner blitz:text-position-dy, closes at -): "(3x)" \|dy\| 13.03 -> 16.1 pt vs Chrome (baseline) — DEBT DEBT-10-boleto-2 |
| pdf-probe | `pdf-probe\|boleto\|p1\|R$#10\|dy` | 13.03 | 16.1 | 1 pdf-probe-pt | DEBT-10-boleto-2 (class b, owner blitz:text-position-dy, closes at -): "R$" \|dy\| 13.03 -> 16.1 pt vs Chrome (baseline) — DEBT DEBT-10-boleto-2 |
| pdf-probe | `pdf-probe\|boleto\|p1\|297,00#1\|dy` | 13.03 | 16.1 | 1 pdf-probe-pt | DEBT-10-boleto-2 (class b, owner blitz:text-position-dy, closes at -): "297,00" \|dy\| 13.03 -> 16.1 pt vs Chrome (baseline) — DEBT DEBT-10-boleto-2 |
| pdf-probe | `pdf-probe\|boleto\|p1\|06/2026#3\|dy` | 13.78 | 16.85 | 1 pdf-probe-pt | DEBT-10-boleto-2 (class b, owner blitz:text-position-dy, closes at -): "06/2026" \|dy\| 13.78 -> 16.85 pt vs Chrome (baseline) — DEBT DEBT-10-boleto-2 |
| pdf-probe | `pdf-probe\|boleto\|p1\|Taxa#1\|dy` | 13.78 | 16.85 | 1 pdf-probe-pt | DEBT-10-boleto-2 (class b, owner blitz:text-position-dy, closes at -): "Taxa" \|dy\| 13.78 -> 16.85 pt vs Chrome (baseline) — DEBT DEBT-10-boleto-2 |
| pdf-probe | `pdf-probe\|boleto\|p1\|de#8\|dy` | 13.78 | 16.85 | 1 pdf-probe-pt | DEBT-10-boleto-2 (class b, owner blitz:text-position-dy, closes at -): "de" \|dy\| 13.78 -> 16.85 pt vs Chrome (baseline) — DEBT DEBT-10-boleto-2 |
| pdf-probe | `pdf-probe\|boleto\|p1\|processamento#1\|dy` | 13.78 | 16.85 | 1 pdf-probe-pt | DEBT-10-boleto-2 (class b, owner blitz:text-position-dy, closes at -): "processamento" \|dy\| 13.78 -> 16.85 pt vs Chrome (baseline) — DEBT DEBT-10-boleto-2 |
| pdf-probe | `pdf-probe\|boleto\|p1\|R$#11\|dy` | 13.78 | 16.85 | 1 pdf-probe-pt | DEBT-10-boleto-2 (class b, owner blitz:text-position-dy, closes at -): "R$" \|dy\| 13.78 -> 16.85 pt vs Chrome (baseline) — DEBT DEBT-10-boleto-2 |
| pdf-probe | `pdf-probe\|boleto\|p1\|46,50#1\|dy` | 13.78 | 16.85 | 1 pdf-probe-pt | DEBT-10-boleto-2 (class b, owner blitz:text-position-dy, closes at -): "46,50" \|dy\| 13.78 -> 16.85 pt vs Chrome (baseline) — DEBT DEBT-10-boleto-2 |
| pdf-probe | `pdf-probe\|boleto\|p1\|CÓDIGO#3\|dy` | 16.78 | 19.85 | 1 pdf-probe-pt | DEBT-10-boleto-3 (class b, owner blitz:text-position-dy, closes at -): "CÓDIGO" \|dy\| 16.78 -> 19.85 pt vs Chrome (baseline) — DEBT DEBT-10-boleto-3 |
| … | 824 more in gate-report.json | | | | |

## Debt ledger (26 entries; transition checked; passes auto_table_compact_columns, painted_table_cell_text_baselines, table_percent_widths)

no problem

## Gate canaries (20/20 caught; an uncaught one is an absolute failure)

| canary | must report | observed | caught |
|---|---|---|---|
| head ratchet: \|dy\| +0.6 pt per step over two steps | real word boleto p1\|RECIBO#1: vs previous link within-tolerance (listed, not gating); vs head regression; no DEBT entry -> head-regression | previous within-tolerance; head regression; ledger head-regression | true |
| WPT fail -> unsupported (new strict-gate rejection) | real test css/CSS2/abspos/abspos-containing-block-initial-004a.xht: gating rejection; declared with its feature -> declared | undeclared rejection/true; declared declared/false | true |
| verdict row -> strict gate rejected | real row invoice PDF-Q1 oracles:qpdf: gating rejection with its feature | rejection:canary:planted-rejection | true |
| verdict row measured -> NOT-RUN | real row invoice PDF-Q1 oracles:qpdf: gating regression | regression | true |
| WPT flagged pass lost | real flagged pass css/CSS2/backgrounds/background-applies-to-015.xht: reported, not gating, counts.flaggedPassLost 1 | reported/false; flaggedPassLost 1; verdict PASS | true |
| DEBT rules i/ii: uncovered, within ceiling, beyond ceiling | no entry -> head-regression (gates); ceiling = value -> debt (not gating); ceiling below value -> debt-exceeded (gates) | head-regression/true; debt/false; debt-exceeded/true | true |
| DEBT rule v: compensator pass deleted | entry names a pass absent from the run's passes (auto_table_compact_columns, painted_table_cell_text_baselines, table_percent_widths) -> debt-regate (gates) | debt-regate/true | true |
| DEBT rule iii: ceiling raised, entry added, entry dropped early | each transition reports a problem; removal at closesAt (control) reports none | raised 2, grown 4, dropped 1, closed-at-closesAt 0 | true |
| DEBT rule iv: vellora-owned entry without a retirement step | a problem naming closesAt | CANARY-1: owner vellora:pagination is vellora's: closesAt must name a retirement step (NN-name) | true |
| DEBT rule vi: displaced words not collapsed | two entries on one page-count criterion -> problem; a per-word entry inside a page scope -> problem; a page-1 word next to a scope from page 2 (control) -> none | twice 2, per-word 1, control 0 | true |
| relaxed (b): \|run\| > \|N0\|, unnamed compensator, no owner | each reports a problem; a valid entry (control) reports none | good 0, worse 1, unnamed 1, no owner 1 | true |
| layer-vector: word mapping misaligned by three fragments | position check share within 3 px: control >= 0.95, misaligned < 0.5 (a shift by one fragment reads 0.55 on this fixture: neighbouring lines share x; the check catches shifts of two or more) | control 1, misaligned 0.233 | true |
| layer-vector: planted +3 px pass step | the planted pass (table_percent_widths) appears as a non-zero vellora step of the word; the unplanted word (control) has none | planted [table_percent_widths, run], control [] | true |
| pdf-probe: a word crosses Chrome (I1) | real word boleto p1\|RECIBO#1: dy 0.35 -> -1.15 pt regression (gates); 0.9 -> -0.9 within-tolerance, withinToleranceBetter 0; control 3 -> 1.5 improvement | through regression/true; flip within-tolerance, better 0; control improvement | true |
| DEBT rule iii without --debt-base (I2) | base = DEBT.json at the merge base; a raised ceiling -> problem; no merge-base -> refusal; no ledger there -> first population | problems 2; no merge-base refused; absent first population | true |
| GATE-D7: new ledger key tied to the measured value (I3) | real word boleto p1\|RECIBO#1: ceiling 99 -> problem; layerVector.run != measured -> problem; measured != the run's value -> problem; exact entry (control) -> none | exact 0; ceiling 99 1; vector 1; measured 1 | true |
| declared rejection carried to the head comparison (I4) | real test css/CSS2/abspos/abspos-containing-block-initial-004a.xht rejected and declared at link 01: vs head 00 at link 02 -> declared; a declaration outside (head, current] (control) -> rejection | carried declared/false; control rejection/true | true |
| EXT-2 missing-token set: one token swapped for another | real row invoice EXT-2 pdftotext: [CanaryA, CanaryB] -> [CanaryA, CanaryC] (same count) -> CanaryC gates; unchanged list (control) -> nothing | swapped [CanaryC]; control 0 | true |
| pdf-probe: a word moved below the page (off-page) | real word boleto p1\|RECIBO#1 section: an unpaired vellora word drawn at y 900 pt (outside the page) -> pdf-probe\|boleto\|off-page\|CanaryOff gates; the same off-page word on both sides (control) -> nothing | moved regression/true; control 0 | true |
| WPT pass -> fail route (GATE-A3) | real clean pass css/CSS2/abspos/static-fixed-inside-abspos.html -> fail: raw Blitz fails the same way -> b; raw passes -> c; no raw outcome -> c; old page count != Chrome's -> a; a DEBT key with the run's rawOutcome passes GATE-D7, one with another does not | routes {"b":"b","c1":"c","c2":"c","a":"a"}; D7 ok 0, D7 wrong rawOutcome 1 | true |

## Pin view vs fidelity/baselines/pin (GATE-H3): merge to main BLOCKED (reported; --main makes (c) gate)

(a) accepted artefacts 1, (b) ledger debt 641, (c) neither 217, declared rejections 10.

| group | key | before | after | tolerance | detail |
|---|---|---|---|---|---|
| corpus DANFE-M | `danfe\|DANFE-M1\|corpus\|\|criterion#1\|excessB` | 8.552 | 24.173 | 0.05 geometry-excess-mm | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): 8.552 -> 24.173 (tolerance 0.05 mm) |
| corpus DANFE-L | `danfe\|DANFE-L1d\|corpus\|\|criterion#1\|posErrMm` | 5.96 | 6.49 | 0.1 position-mm | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): 5.96 -> 6.49 (tolerance 0.1 mm) |
| wpt css/CSS2/abspos | `wpt\|css/CSS2/abspos/between-float-and-text.html` | pass | fail |  | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): pass -> fail (clean pass lost) |
| wpt css/CSS2/floats-clear | `wpt\|css/CSS2/floats-clear/clear-applies-to-009.xht` | pass | fail |  | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): pass -> fail (clean pass lost) |
| wpt css/CSS2/floats-clear | `wpt\|css/CSS2/floats-clear/clear-float-005.xht` | pass | fail |  | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): pass -> fail (clean pass lost) |
| wpt css/CSS2/floats | `wpt\|css/CSS2/floats/float-in-inline-anonymous-block-with-overflow-hidden.html` | pass | fail |  | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): pass -> fail (clean pass lost) |
| wpt css/CSS2/floats | `wpt\|css/CSS2/floats/float-nowrap-2.html` | pass | fail |  | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): pass -> fail (clean pass lost) |
| wpt css/CSS2/floats | `wpt\|css/CSS2/floats/float-nowrap-8.html` | pass | fail |  | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): pass -> fail (clean pass lost) |
| wpt css/CSS2/floats | `wpt\|css/CSS2/floats/floats-placement-vertical-001a.xht` | pass | fail |  | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): pass -> fail (clean pass lost) |
| wpt css/CSS2/generated-content | `wpt\|css/CSS2/generated-content/after-content-display-012.xht` | pass | fail |  | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): pass -> fail (clean pass lost) |
| wpt css/CSS2/generated-content | `wpt\|css/CSS2/generated-content/after-content-display-013.xht` | pass | fail |  | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): pass -> fail (clean pass lost) |
| wpt css/CSS2/generated-content | `wpt\|css/CSS2/generated-content/before-content-display-012.xht` | pass | fail |  | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): pass -> fail (clean pass lost) |
| wpt css/CSS2/generated-content | `wpt\|css/CSS2/generated-content/before-content-display-013.xht` | pass | fail |  | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): pass -> fail (clean pass lost) |
| wpt css/CSS2/normal-flow | `wpt\|css/CSS2/normal-flow/block-in-inline-float-between-001.xht` | pass | fail |  | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): pass -> fail (clean pass lost) |
| wpt css/CSS2/normal-flow | `wpt\|css/CSS2/normal-flow/inline-table-zorder-001.xht` | pass | fail |  | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): pass -> fail (clean pass lost) |
| wpt css/CSS2/visuren | `wpt\|css/CSS2/visuren/float-inside-inline-between-blocks-1.html` | pass | fail |  | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): pass -> fail (clean pass lost) |
| wpt css/css-break | `wpt\|css/css-break/flexbox/multi-line-column-flex-fragmentation-054.html` | pass | fail |  | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): pass -> fail (clean pass lost) |
| wpt css/css-break | `wpt\|css/css-break/flexbox/multi-line-column-flex-fragmentation-055.html` | pass | fail |  | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): pass -> fail (clean pass lost) |
| wpt css/css-break | `wpt\|css/css-break/flexbox/multi-line-column-flex-fragmentation-058.html` | pass | fail |  | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): pass -> fail (clean pass lost) |
| wpt css/css-break | `wpt\|css/css-break/ruby-003.html` | pass | fail |  | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): pass -> fail (clean pass lost) |
| wpt css/css-text | `wpt\|css/css-text/hanging-punctuation/hanging-punctuation-first-002.html` | pass | fail |  | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): pass -> fail (clean pass lost) |
| wpt css/css-text | `wpt\|css/css-text/tab-size/tab-size-integer-001.html` | pass | fail |  | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): pass -> fail (clean pass lost) |
| wpt css/css-text | `wpt\|css/css-text/tab-size/tab-size-integer-002.html` | pass | fail |  | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): pass -> fail (clean pass lost) |
| wpt css/css-text | `wpt\|css/css-text/tab-size/tab-size-integer-003.html` | pass | fail |  | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): pass -> fail (clean pass lost) |
| wpt css/css-text | `wpt\|css/css-text/text-align/text-align-end-006.html` | pass | fail |  | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): pass -> fail (clean pass lost) |
| wpt css/css-text | `wpt\|css/css-text/text-justify/text-justify-and-trailing-spaces-003.html` | pass | fail |  | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): pass -> fail (clean pass lost) |
| wpt css/css-text | `wpt\|css/css-text/text-justify/text-justify-and-trailing-spaces-004.html` | pass | fail |  | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): pass -> fail (clean pass lost) |
| wpt css/css-text | `wpt\|css/css-text/white-space/text-wrap-balance-text-indent-001.html` | pass | fail |  | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): pass -> fail (clean pass lost) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|1.842,50#1\|dx` | -5.67 | 2.97 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "1.842,50" dx -5.67 -> 2.97 pt: moved 8.64 pt (> 1) and ends 2.97 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|danfe\|p1\|DANFE#1\|dx` | -29.11 | 1.8 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "DANFE" dx -29.11 -> 1.8 pt: moved 30.91 pt (> 1) and ends 1.8 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|danfe\|p1\|AUXILIAR#1\|dx` | -28.84 | 1.99 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "AUXILIAR" dx -28.84 -> 1.99 pt: moved 30.83 pt (> 1) and ends 1.99 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|danfe\|p1\|AUXILIAR#1\|dy` | -9.75 | 1.5 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "AUXILIAR" dy -9.75 -> 1.5 pt: moved 11.25 pt (> 1) and ends 1.5 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|danfe\|p1\|DA#2\|dx` | -28.78 | 2.07 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "DA" dx -28.78 -> 2.07 pt: moved 30.85 pt (> 1) and ends 2.07 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|danfe\|p1\|DA#2\|dy` | -9.75 | 1.5 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "DA" dy -9.75 -> 1.5 pt: moved 11.25 pt (> 1) and ends 1.5 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|danfe\|p1\|ELETRÔNICA#2\|dx` | -29.11 | 1.78 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "ELETRÔNICA" dx -29.11 -> 1.78 pt: moved 30.89 pt (> 1) and ends 1.78 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|danfe\|p1\|ELETRÔNICA#2\|dy` | -17.23 | 1.52 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "ELETRÔNICA" dy -17.23 -> 1.52 pt: moved 18.75 pt (> 1) and ends 1.52 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|danfe\|p1\|Nº#2\|dx` | -29.11 | 1.8 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "Nº" dx -29.11 -> 1.8 pt: moved 30.91 pt (> 1) and ends 1.8 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|danfe\|p1\|000.012.345#2\|dx` | -29.1 | 1.81 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "000.012.345" dx -29.1 -> 1.81 pt: moved 30.91 pt (> 1) and ends 1.81 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|danfe\|p1\|SÉRIE#2\|dx` | -29.11 | 1.8 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "SÉRIE" dx -29.11 -> 1.8 pt: moved 30.91 pt (> 1) and ends 1.8 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|danfe\|p1\|001#2\|dx` | -29.07 | 1.82 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "001" dx -29.07 -> 1.82 pt: moved 30.89 pt (> 1) and ends 1.82 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|danfe\|p1\|no#2\|dx` | -4.76 | 2.94 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "no" dx -4.76 -> 2.94 pt: moved 7.7 pt (> 1) and ends 2.94 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|danfe\|p1\|FOLHA#1\|dx` | -29.11 | 1.8 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "FOLHA" dx -29.11 -> 1.8 pt: moved 30.91 pt (> 1) and ends 1.8 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|danfe\|p1\|1/1#1\|dx` | -29.06 | 1.83 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "1/1" dx -29.06 -> 1.83 pt: moved 30.89 pt (> 1) and ends 1.83 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|danfe\|p1\|0,00#4\|dx` | -1.25 | 1.45 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "0,00" dx -1.25 -> 1.45 pt: moved 2.7 pt (> 1) and ends 1.45 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|danfe\|p1\|0,00#7\|dx` | -2.29 | 3.87 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "0,00" \|dx\| 2.29 -> 3.87 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|danfe\|p1\|21.773,40#3\|dx` | -7.36 | 4.94 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "21.773,40" dx -7.36 -> 4.94 pt: moved 12.3 pt (> 1) and ends 4.94 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|danfe\|p1\|21.773,40#3\|dy` | 4.07 | 5.57 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "21.773,40" \|dy\| 4.07 -> 5.57 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|danfe\|p1\|48,600#1\|dx` | -21.69 | 6.48 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "48,600" dx -21.69 -> 6.48 pt: moved 28.17 pt (> 1) and ends 6.48 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|danfe\|p1\|48,600#1\|dy` | 5.65 | 7.15 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "48,600" \|dy\| 5.65 -> 7.15 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|danfe\|p1\|45,100#1\|dx` | -8.02 | 7.61 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "45,100" dx -8.02 -> 7.61 pt: moved 15.63 pt (> 1) and ends 7.61 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|danfe\|p1\|45,100#1\|dy` | 5.65 | 7.15 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "45,100" \|dy\| 5.65 -> 7.15 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|danfe\|p1\|CÓDIGO#2\|dx` | -0.51 | 1.28 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "CÓDIGO" dx -0.51 -> 1.28 pt: moved 1.79 pt (> 1) and ends 1.28 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|danfe\|p1\|ICMS#7\|dx` | -22.34 | 10.45 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "ICMS" dx -22.34 -> 10.45 pt: moved 32.79 pt (> 1) and ends 10.45 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|danfe\|p1\|ICMS#7\|dy` | 4.94 | 8.69 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "ICMS" \|dy\| 4.94 -> 8.69 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|danfe\|p1\|18,00#2\|dx` | -23.25 | 10.43 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "18,00" dx -23.25 -> 10.43 pt: moved 33.68 pt (> 1) and ends 10.43 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|danfe\|p1\|18,00#2\|dy` | -4.04 | 10.21 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "18,00" \|dy\| 4.04 -> 10.21 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|danfe\|p1\|18,00#4\|dx` | -23.25 | 10.43 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "18,00" dx -23.25 -> 10.43 pt: moved 33.68 pt (> 1) and ends 10.43 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|danfe\|p1\|18,00#4\|dy` | -5.52 | 10.98 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "18,00" \|dy\| 5.52 -> 10.98 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|danfe\|p1\|18,00#5\|dx` | -23.25 | 10.43 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "18,00" dx -23.25 -> 10.43 pt: moved 33.68 pt (> 1) and ends 10.43 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|danfe\|p1\|18,00#5\|dy` | -3.26 | 12.49 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "18,00" \|dy\| 3.26 -> 12.49 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|danfe\|p1\|18,00#6\|dx` | -23.25 | 10.43 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "18,00" dx -23.25 -> 10.43 pt: moved 33.68 pt (> 1) and ends 10.43 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|danfe\|p1\|18,00#6\|dy` | -1 | 13.25 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "18,00" \|dy\| 1 -> 13.25 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|danfe\|p1\|18,00#8\|dx` | -23.25 | 10.43 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "18,00" dx -23.25 -> 10.43 pt: moved 33.68 pt (> 1) and ends 10.43 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|danfe\|p1\|18,00#8\|dy` | -1.72 | 14.78 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "18,00" \|dy\| 1.72 -> 14.78 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|danfe\|p1\|18,00#10\|dx` | -23.25 | 10.43 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "18,00" dx -23.25 -> 10.43 pt: moved 33.68 pt (> 1) and ends 10.43 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|danfe\|p1\|18,00#10\|dy` | -3.2 | 16.3 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "18,00" \|dy\| 3.2 -> 16.3 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|danfe\|p1\|18,00#11\|dx` | -23.25 | 10.43 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "18,00" dx -23.25 -> 10.43 pt: moved 33.68 pt (> 1) and ends 10.43 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|danfe\|p1\|18,00#11\|dy` | 5.81 | 17.06 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "18,00" \|dy\| 5.81 -> 17.06 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|danfe\|p1\|18,00#12\|dx` | -23.25 | 10.43 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "18,00" dx -23.25 -> 10.43 pt: moved 33.68 pt (> 1) and ends 10.43 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|danfe\|p1\|18,00#12\|dy` | 8.82 | 17.82 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "18,00" \|dy\| 8.82 -> 17.82 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|invoice\|p1\|QTD.#1\|dx` | 1.21 | 4.42 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "QTD." \|dx\| 1.21 -> 4.42 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|invoice\|p1\|40#1\|dx` | 1.2 | 4.42 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "40" \|dx\| 1.2 -> 4.42 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|invoice\|p1\|25#1\|dx` | 1.2 | 4.42 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "25" \|dx\| 1.2 -> 4.42 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|invoice\|p1\|18#1\|dx` | 1.2 | 4.42 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "18" \|dx\| 1.2 -> 4.42 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|invoice\|p1\|60#1\|dx` | 1.2 | 4.42 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "60" \|dx\| 1.2 -> 4.42 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|invoice\|p1\|120#1\|dx` | 1.2 | 4.43 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "120" \|dx\| 1.2 -> 4.43 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|invoice\|p1\|30#1\|dx` | 1.2 | 4.42 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "30" \|dx\| 1.2 -> 4.42 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|invoice\|p1\|22#1\|dx` | 1.2 | 4.42 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "22" \|dx\| 1.2 -> 4.42 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|invoice\|p1\|44#1\|dx` | 1.2 | 4.42 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "44" \|dx\| 1.2 -> 4.42 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|invoice\|p1\|12#2\|dx` | 1.2 | 4.42 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "12" \|dx\| 1.2 -> 4.42 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|invoice\|p1\|24#1\|dx` | 1.2 | 4.42 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "24" \|dx\| 1.2 -> 4.42 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|invoice\|p1\|8#1\|dx` | 1.21 | 4.42 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "8" \|dx\| 1.21 -> 4.42 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|invoice\|p2\|QTD.#1\|dx` | 1.21 | 4.42 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "QTD." \|dx\| 1.21 -> 4.42 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|invoice\|p2\|10#1\|dx` | 1.2 | 4.42 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "10" \|dx\| 1.2 -> 4.42 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|invoice\|p2\|6#1\|dx` | 1.21 | 4.42 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "6" \|dx\| 1.21 -> 4.42 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|invoice\|p2\|30#1\|dx` | 1.2 | 4.42 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "30" \|dx\| 1.2 -> 4.42 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|invoice\|p2\|14#1\|dx` | 1.2 | 4.42 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "14" \|dx\| 1.2 -> 4.42 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|invoice\|p2\|20#1\|dx` | 1.2 | 4.42 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "20" \|dx\| 1.2 -> 4.42 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|invoice\|p2\|5#1\|dx` | 1.21 | 4.42 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "5" \|dx\| 1.21 -> 4.42 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|invoice\|p2\|35#1\|dx` | 1.2 | 4.42 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "35" \|dx\| 1.2 -> 4.42 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|invoice\|p2\|50#1\|dx` | 1.2 | 4.42 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "50" \|dx\| 1.2 -> 4.42 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|invoice\|p2\|28#1\|dx` | 1.2 | 4.42 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "28" \|dx\| 1.2 -> 4.42 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|invoice\|p2\|56#1\|dx` | 1.2 | 4.42 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "56" \|dx\| 1.2 -> 4.42 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|invoice\|p2\|16#1\|dx` | 1.2 | 4.42 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "16" \|dx\| 1.2 -> 4.42 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|invoice\|p2\|64#1\|dx` | 1.2 | 4.42 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "64" \|dx\| 1.2 -> 4.42 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|invoice\|p2\|18#1\|dx` | 1.2 | 4.42 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "18" \|dx\| 1.2 -> 4.42 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|invoice\|p2\|22#1\|dx` | 1.2 | 4.42 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "22" \|dx\| 1.2 -> 4.42 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|invoice\|p2\|22#2\|dx` | 1.2 | 4.42 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "22" \|dx\| 1.2 -> 4.42 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|invoice\|p2\|15#1\|dx` | 1.2 | 4.42 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "15" \|dx\| 1.2 -> 4.42 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|invoice\|p2\|40#1\|dx` | 1.2 | 4.42 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "40" \|dx\| 1.2 -> 4.42 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|invoice\|p2\|8#1\|dx` | 1.21 | 4.42 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "8" \|dx\| 1.21 -> 4.42 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|invoice\|p3\|QTD.#1\|dx` | 1.21 | 4.42 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "QTD." \|dx\| 1.21 -> 4.42 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|invoice\|p3\|30#1\|dx` | 1.2 | 4.42 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "30" \|dx\| 1.2 -> 4.42 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|invoice\|p3\|12#1\|dx` | 1.2 | 4.42 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "12" \|dx\| 1.2 -> 4.42 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|invoice\|p3\|5#1\|dx` | 1.21 | 4.42 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "5" \|dx\| 1.21 -> 4.42 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|invoice\|p3\|1#1\|dx` | 1.21 | 4.42 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "1" \|dx\| 1.21 -> 4.42 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|invoice\|p3\|2#1\|dx` | 1.21 | 4.42 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "2" \|dx\| 1.21 -> 4.42 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|invoice\|p3\|Total#1\|dy` | 1.1 | -1.15 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "Total" dy 1.1 -> -1.15 pt: moved -2.25 pt (> 1) and ends 1.15 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|invoice\|p3\|a#1\|dy` | 1.1 | -1.15 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "a" dy 1.1 -> -1.15 pt: moved -2.25 pt (> 1) and ends 1.15 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|invoice\|p3\|pagar#1\|dy` | 1.1 | -1.15 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "pagar" dy 1.1 -> -1.15 pt: moved -2.25 pt (> 1) and ends 1.15 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|invoice\|p3\|R$#14\|dy` | 1.1 | -1.15 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "R$" dy 1.1 -> -1.15 pt: moved -2.25 pt (> 1) and ends 1.15 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|invoice\|p3\|50.724,90#1\|dy` | 1.1 | -1.15 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "50.724,90" dy 1.1 -> -1.15 pt: moved -2.25 pt (> 1) and ends 1.15 pt from Chrome (> 1) (I1) |
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
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p2\|de#6\|dy` | -12.4 | 3.35 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "de" dy -12.4 -> 3.35 pt: moved 15.75 pt (> 1) and ends 3.35 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p2\|de#9\|dy` | -7.9 | 4.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "de" dy -7.9 -> 4.85 pt: moved 12.75 pt (> 1) and ends 4.85 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p2\|de#13\|dy` | -16.9 | 7.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "de" dy -16.9 -> 7.85 pt: moved 24.75 pt (> 1) and ends 7.85 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p2\|—#6\|dy` | -15.4 | 8.6 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "—" dy -15.4 -> 8.6 pt: moved 24 pt (> 1) and ends 8.6 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p2\|de#15\|dy` | -15.4 | 9.35 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "de" dy -15.4 -> 9.35 pt: moved 24.75 pt (> 1) and ends 9.35 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p2\|em#6\|dy` | -16.9 | 12.35 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "em" dy -16.9 -> 12.35 pt: moved 29.25 pt (> 1) and ends 12.35 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p2\|de#21\|dy` | 9.35 | 14.6 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "de" \|dy\| 9.35 -> 14.6 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p2\|de#24\|dy` | 5.6 | 16.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "de" \|dy\| 5.6 -> 16.1 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p3\|de#4\|dx` | 13.99 | -22.89 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "de" \|dx\| 13.99 -> 22.89 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p3\|—#2\|dx` | 26.74 | -10.17 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "—" dx 26.74 -> -10.17 pt: moved -36.91 pt (> 1) and ends 10.17 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p3\|de#6\|dx` | -9.13 | 9.68 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "de" dx -9.13 -> 9.68 pt: moved 18.81 pt (> 1) and ends 9.68 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p3\|de#6\|dy` | -15.4 | 2.6 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "de" dy -15.4 -> 2.6 pt: moved 18 pt (> 1) and ends 2.6 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p3\|de#11\|dy` | -4.9 | 5.6 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "de" dy -4.9 -> 5.6 pt: moved 10.5 pt (> 1) and ends 5.6 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p3\|de#16\|dy` | -15.4 | 27.35 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "de" \|dy\| 15.4 -> 27.35 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p3\|—#8\|dy` | 4.85 | 27.35 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "—" \|dy\| 4.85 -> 27.35 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p3\|de#17\|dx` | 26.76 | -10.17 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "de" dx 26.76 -> -10.17 pt: moved -36.93 pt (> 1) and ends 10.17 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p3\|de#17\|dy` | 4.85 | -10.15 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "de" \|dy\| 4.85 -> 10.15 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p3\|de#18\|dx` | 6.98 | -29.96 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "de" \|dx\| 6.98 -> 29.96 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p3\|de#18\|dy` | 15.35 | -1.9 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "de" dy 15.35 -> -1.9 pt: moved -17.25 pt (> 1) and ends 1.9 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p3\|—#11\|dy` | 1.85 | -4.15 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "—" \|dy\| 1.85 -> 4.15 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p3\|de#24\|dx` | 11.63 | 25.27 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "de" \|dx\| 11.63 -> 25.27 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p3\|de#24\|dy` | 6.35 | -1.9 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "de" dy 6.35 -> -1.9 pt: moved -8.25 pt (> 1) and ends 1.9 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p4\|de#4\|dx` | 11.17 | -25.72 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "de" \|dx\| 11.17 -> 25.72 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p4\|de#6\|dx` | -1.58 | -10.63 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "de" \|dx\| 1.58 -> 10.63 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p4\|de#6\|dy` | 22.1 | -17.65 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "de" dy 22.1 -> -17.65 pt: moved -39.75 pt (> 1) and ends 17.65 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p4\|de#8\|dy` | -24.4 | 3.35 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "de" dy -24.4 -> 3.35 pt: moved 27.75 pt (> 1) and ends 3.35 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p4\|de#10\|dx` | 20.14 | -16.75 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "de" dx 20.14 -> -16.75 pt: moved -36.89 pt (> 1) and ends 16.75 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p4\|de#10\|dy` | 5.6 | -1.15 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "de" dy 5.6 -> -1.15 pt: moved -6.75 pt (> 1) and ends 1.15 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p4\|de#14\|dy` | -5.65 | 1.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "de" dy -5.65 -> 1.1 pt: moved 6.75 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p4\|de#15\|dy` | -2.65 | -16.15 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "de" \|dy\| 2.65 -> 16.15 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p4\|—#5\|dx` | 23.44 | -13.47 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "—" dx 23.44 -> -13.47 pt: moved -36.91 pt (> 1) and ends 13.47 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p4\|de#26\|dy` | 17.6 | 21.35 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "de" \|dy\| 17.6 -> 21.35 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p5\|de#3\|dx` | 6.98 | -29.96 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "de" \|dx\| 6.98 -> 29.96 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p5\|de#3\|dy` | 17.6 | 19.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "de" \|dy\| 17.6 -> 19.1 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p5\|de#7\|dy` | -4.15 | -26.65 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "de" \|dy\| 4.15 -> 26.65 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p5\|de#10\|dy` | 10.1 | -16.9 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "de" \|dy\| 10.1 -> 16.9 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p5\|de#11\|dx` | 16.39 | -20.54 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "de" \|dx\| 16.39 -> 20.54 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p5\|de#11\|dy` | -9.4 | -16.9 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "de" \|dy\| 9.4 -> 16.9 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p5\|de#13\|dx` | 0.04 | 22.53 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "de" \|dx\| 0.04 -> 22.53 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p5\|de#13\|dy` | -25.15 | 10.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "de" dy -25.15 -> 10.85 pt: moved 36 pt (> 1) and ends 10.85 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p5\|de#15\|dx` | 22.5 | -14.39 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "de" dx 22.5 -> -14.39 pt: moved -36.89 pt (> 1) and ends 14.39 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p5\|de#15\|dy` | 9.35 | 23.6 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "de" \|dy\| 9.35 -> 23.6 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p5\|de#18\|dy` | -6.4 | 6.35 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "de" dy -6.4 -> 6.35 pt: moved 12.75 pt (> 1) and ends 6.35 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p5\|—#9\|dy` | -10.15 | -14.65 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "—" \|dy\| 10.15 -> 14.65 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p5\|—#11\|dx` | 17.78 | -19.11 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "—" \|dx\| 17.78 -> 19.11 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p5\|—#11\|dy` | 5.6 | 28.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "—" \|dy\| 5.6 -> 28.1 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p6\|—#1\|dx` | 26.74 | -10.17 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "—" dx 26.74 -> -10.17 pt: moved -36.91 pt (> 1) and ends 10.17 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p6\|—#1\|dy` | 17.6 | 19.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "—" \|dy\| 17.6 -> 19.1 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p6\|de#4\|dx` | 16.39 | -20.54 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "de" \|dx\| 16.39 -> 20.54 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p6\|—#7\|dx` | 35.74 | -1.17 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "—" dx 35.74 -> -1.17 pt: moved -36.91 pt (> 1) and ends 1.17 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p6\|—#7\|dy` | -4.15 | 3.35 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "—" dy -4.15 -> 3.35 pt: moved 7.5 pt (> 1) and ends 3.35 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p6\|—#8\|dy` | -2.65 | 21.35 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "—" \|dy\| 2.65 -> 21.35 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p6\|de#12\|dx` | 26.76 | -10.17 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "de" dx 26.76 -> -10.17 pt: moved -36.93 pt (> 1) and ends 10.17 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p6\|de#12\|dy` | -2.65 | -14.65 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "de" \|dy\| 2.65 -> 14.65 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p6\|Lançamentos#2\|dy` | -13.9 | -25.9 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "Lançamentos" \|dy\| 13.9 -> 25.9 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p6\|de#13\|dy` | -13.9 | -25.9 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "de" \|dy\| 13.9 -> 25.9 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p6\|de#14\|dx` | 17.88 | -19.01 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "de" \|dx\| 17.88 -> 19.01 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p6\|de#14\|dy` | 6.35 | -7.9 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "de" \|dy\| 6.35 -> 7.9 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p6\|2026#2\|dy` | -13.9 | -25.9 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "2026" \|dy\| 13.9 -> 25.9 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p6\|de#17\|dx` | 22.5 | -14.39 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "de" dx 22.5 -> -14.39 pt: moved -36.89 pt (> 1) and ends 14.39 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p6\|de#17\|dy` | 4.85 | -12.4 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "de" \|dy\| 4.85 -> 12.4 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p6\|de#19\|dx` | 34.32 | -2.58 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "de" dx 34.32 -> -2.58 pt: moved -36.9 pt (> 1) and ends 2.58 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p6\|de#19\|dy` | 0.35 | -17.65 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "de" \|dy\| 0.35 -> 17.65 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p6\|—#9\|dx` | 16.84 | -1.17 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "—" dx 16.84 -> -1.17 pt: moved -18.01 pt (> 1) and ends 1.17 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p6\|de#25\|dy` | -15.4 | 16.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "de" \|dy\| 15.4 -> 16.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p6\|de#26\|dx` | 1.25 | 20.06 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "de" \|dx\| 1.25 -> 20.06 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p6\|de#26\|dy` | -15.4 | 16.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "de" \|dy\| 15.4 -> 16.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p6\|de#29\|dx` | 8.82 | -28.08 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "de" \|dx\| 8.82 -> 28.08 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p6\|de#29\|dy` | -7.15 | 11.6 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "de" \|dy\| 7.15 -> 11.6 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p7\|de#5\|dx` | 13.64 | -23.26 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "de" \|dx\| 13.64 -> 23.26 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p2\|de#27\|pairing` | dx 26.32 dy 10.1 | unpaired |  | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): Chrome's "de" (page 2) lost its vellora counterpart: missing, on another page, or more than 36 pt away |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p2\|de#28\|pairing` | dx -2.95 dy -28.15 | unpaired |  | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): Chrome's "de" (page 2) lost its vellora counterpart: missing, on another page, or more than 36 pt away |
| … | 17 more in gate-report.json | | | | |

## WPT per directory (pass / clean pass)

| directory | pass before | pass after | clean before | clean after |
|---|---|---|---|---|
| css/CSS2/abspos | 2 | 2 | 2 | 2 |
| css/CSS2/backgrounds | 175 | 175 | 67 | 67 |
| css/CSS2/borders | 383 | 383 | 354 | 354 |
| css/CSS2/box | 4 | 4 | 0 | 0 |
| css/CSS2/box-display | 65 | 66 | 65 | 66 |
| css/CSS2/colors | 10 | 10 | 10 | 10 |
| css/CSS2/floats | 19 | 19 | 16 | 16 |
| css/CSS2/floats-clear | 38 | 38 | 33 | 33 |
| css/CSS2/fonts | 135 | 135 | 135 | 135 |
| css/CSS2/generated-content | 82 | 82 | 78 | 78 |
| css/CSS2/linebox | 126 | 150 | 124 | 148 |
| css/CSS2/lists | 67 | 67 | 40 | 40 |
| css/CSS2/margin-padding-clear | 525 | 527 | 508 | 510 |
| css/CSS2/normal-flow | 431 | 443 | 405 | 417 |
| css/CSS2/pagination | 33 | 34 | 31 | 32 |
| css/CSS2/positioning | 361 | 361 | 359 | 359 |
| css/CSS2/tables | 77 | 77 | 74 | 74 |
| css/CSS2/text | 247 | 250 | 238 | 241 |
| css/CSS2/visudet | 14 | 14 | 9 | 9 |
| css/CSS2/visufx | 2 | 2 | 2 | 2 |
| css/CSS2/visuren | 6 | 6 | 6 | 6 |
| css/css-break | 115 | 115 | 81 | 81 |
| css/css-page | 70 | 70 | 55 | 55 |
| css/css-tables | 47 | 47 | 38 | 38 |
| css/css-text | 630 | 632 | 377 | 379 |

## Per group

| group | classes |
|---|---|
| canaries | added 5 |
| corpus INV-R | improvement 4 |
| oracles:layout REF-W | improvement 2 |
| oracles:text EXT-2 | improvement 3 |
| pdf-probe | within-tolerance 327, improvement 39, newly-measured 39, accepted 3 |
| wpt css/CSS2/box-display | improvement 1 |
| wpt css/CSS2/linebox | improvement 24 |
| wpt css/CSS2/margin-padding-clear | improvement 2 |
| wpt css/CSS2/normal-flow | improvement 12 |
| wpt css/CSS2/pagination | improvement 1 |
| wpt css/CSS2/text | improvement 3 |
| wpt css/css-text | improvement 2 |

## Tolerances

| class | tolerance | label | rationale |
|---|---|---|---|
| position-mm | 0.1 mm | DESIGN TARGET | word/anchor position error vs a reference (REF-W max/p95, REF-R worst anchor, DANFE-L1, LET-1). 0.1 mm (0.28 pt, 0.38 CSS px) is 10x the 0.01 mm the values are reported with and below one CSS px (0.26 mm), the smallest step a px-snapping layout can move; the measurement is deterministic for one build and one reference (CONFIRMED: equal inputs gave equal values in the Phase A repeat run). |
| geometry-excess-mm | 0.05 mm | DESIGN TARGET | distance OUTSIDE a specification window (BOL-G*, DANFE-B*, DANFE-M1, TXT-A1). Inside the window the spec admits any value, so only the excess is ratcheted; 0.05 mm is about one 600 dpi raster pixel (0.042 mm), the measurement quantum of measure_bars.py / the page ink box. |
| font-excess-pt | 0.05 pt | SPEC-derived tolerance unit | font-size excess outside a window; 0.05 pt is the tolerance ACCEPTANCE.md already applies to every font-size criterion (BOL-T*, DANFE-F*). |
| count | 0 count | DESIGN TARGET | integer counts from deterministic tools (required strings found, extractor missing/extra tokens, segments/glyphs attributed, decoded symbols): any loss is a real change of the document. |
| page-delta | 0 pages | DESIGN TARGET | \|vellora pages - reference pages\|: a page break moving is never noise. |
| pdf-probe-pt | 1 pt | DESIGN TARGET | per-word \|dx\| / \|dy\| of vellora's PDF vs Chrome's PDF (pdf-probe semantics 2: PyMuPDF pen origin and baseline, same-page position pairs keyed by the Chrome word). 1 pt (0.35 mm) is an order of magnitude below the Phase A regressions it must catch (invoice price column +9 pt, notification signature -14 pt) and above the 0.01 pt rounding of the probe and sub-px snapping differences. The per-fixture unpaired-word counts use the count class. |

