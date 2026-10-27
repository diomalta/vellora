# Fidelity gate report

**Verdict: FAIL** (3 gating item(s) vs the previous link, 1173 vs the chain head fidelity/baselines/port/00-start; 0 flagged WPT pass(es) lost, reported, not gating; 327 value(s) worse within tolerance, listed, not gating; pin view: merge to main BLOCKED, 859 (c) item(s)). Local macOS runs are INDICATIVE.

| field | value |
|---|---|
| date | 2026-10-23T00:45:10Z |
| command | `node fidelity/run-all.mjs --gate --raw --baseline fidelity/baselines/port/09-review-fixes --chrome-from ~/.cache/vellora-fidelity/run-all-beta4-20261021T054809Z/wpt/results.json --tools-image vellora-fidelity-tools:baseline-beta4 --out fidelity/results/run-all/10-tip` |
| baseline | fidelity/baselines/port/09-review-fixes (vellora-fidelity/baseline/2) |
| run | fidelity/results/run-all/10-tip (vellora-fidelity/run-all/1) |
| os / cpu | darwin 27.0.0 arm64 (macOS 27.0.1) / Apple M5 Pro |
| node / rustc | v22.23.2 / rustc 1.96.0 (ac68faa20 2026-05-25) |
| chrome | Google Chrome 155.0.8059.85 |
| blitz | 0.3.0-beta.4 registry+https://github.com/rust-lang/crates.io-index |
| git | phaseb/10-tip a293cf5913e07621758a2832cec1de019e44d278 (0 dirty) |

Counts: improvement 93, added 5, within-tolerance 327, newly-measured 39, regression 3, gating 3, headGating 1173, debt 0, flaggedPassLost 0, unchanged 14486, withinTolerance 327, withinToleranceBetter 1, missingTokensNotComparable 0, pinA 0, pinB 0, pinC 859.

## Absolute failures of the run (gate, cannot be accepted)

none

## Regressions beyond tolerance (gate)

| group | key | before | after | tolerance | detail |
|---|---|---|---|---|---|
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|[Product#2\|pairing` | dx -0.9 dy 2.85 | unpaired |  | Chrome's "[Product" (page 1) lost its vellora counterpart: missing, on another page, or more than 36 pt away |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|Name]#2\|pairing` | dx -0.9 dy 2.85 | unpaired |  | Chrome's "Name]" (page 1) lost its vellora counterpart: missing, on another page, or more than 36 pt away |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|unpaired-vellora` | 0 | 3 | 0 count | vellora words Chrome lacks: 0 -> 3 (e.g. "Download" p1, "as" p1, "PDF" p1) |

## Accepted regressions (acceptedRegressions, with evidence)

none

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

Every item worse than the chain head beyond its tolerance gates unless a class-a acceptance of this step (0 counted, 0 legacy/other ignored) or a DEBT.json entry within its ceiling covers it. Counts: head-regression 1173, declared 10, gating 1173, improvement 1987, withinTolerance 1259, flaggedPassLost 3.

### head-regression: worse than the head, no ledger entry (gate, rule i) (1173)

| group | key | before | after | tolerance | detail |
|---|---|---|---|---|---|
| corpus DANFE-L | `danfe\|DANFE-L1a\|corpus\|\|criterion#1\|posErrMm` | 1.56 | 2.09 | 0.1 position-mm | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): 1.56 -> 2.09 (tolerance 0.1 mm) |
| corpus DANFE-L | `danfe\|DANFE-L1b\|corpus\|\|criterion#1\|posErrMm` | 3.15 | 3.68 | 0.1 position-mm | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): 3.15 -> 3.68 (tolerance 0.1 mm) |
| corpus DANFE-L | `danfe\|DANFE-L1c\|corpus\|\|criterion#1\|posErrMm` | 4.71 | 5.24 | 0.1 position-mm | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): 4.71 -> 5.24 (tolerance 0.1 mm) |
| corpus DANFE-L | `danfe\|DANFE-L1d\|corpus\|\|criterion#1\|posErrMm` | 5.96 | 6.49 | 0.1 position-mm | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): 5.96 -> 6.49 (tolerance 0.1 mm) |
| wpt css/CSS2/floats-clear | `wpt\|css/CSS2/floats-clear/floats-153.xht` | pass | fail |  | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): pass -> fail (clean pass lost) |
| wpt css/CSS2/floats | `wpt\|css/CSS2/floats/floats-placement-vertical-003.xht` | pass | fail |  | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): pass -> fail (clean pass lost) |
| wpt css/CSS2/floats | `wpt\|css/CSS2/floats/floats-placement-vertical-004.xht` | pass | fail |  | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): pass -> fail (clean pass lost) |
| wpt css/CSS2/floats | `wpt\|css/CSS2/floats/zero-width-floats.html` | pass | fail |  | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): pass -> fail (clean pass lost) |
| wpt css/CSS2/linebox | `wpt\|css/CSS2/linebox/baseline-block-with-overflow-001.html` | pass | fail |  | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): pass -> fail (clean pass lost) |
| wpt css/CSS2/linebox | `wpt\|css/CSS2/linebox/inline-formatting-context-001.xht` | pass | fail |  | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): pass -> fail (clean pass lost) |
| wpt css/css-break | `wpt\|css/css-break/flexbox/flex-fragmented-with-float-descendant-001.html` | pass | fail |  | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): pass -> fail (clean pass lost) |
| wpt css/css-page | `wpt\|css/css-page/monolithic-overflow-014-print.html` | pass | fail |  | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): pass -> fail (clean pass lost) |
| pdf-probe | `pdf-probe\|boleto\|p1\|Corte#1\|dy` | -2.06 | 1.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "Corte" dy -2.06 -> 1.1 pt: moved 3.16 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|boleto\|p1\|na#1\|dy` | -2.06 | 1.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "na" dy -2.06 -> 1.1 pt: moved 3.16 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|boleto\|p1\|linha#1\|dy` | -2.06 | 1.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "linha" dy -2.06 -> 1.1 pt: moved 3.16 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|boleto\|p1\|pontilhada#1\|dy` | -2.06 | 1.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "pontilhada" dy -2.06 -> 1.1 pt: moved 3.16 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|boleto\|p1\|—#1\|dy` | -2.06 | 1.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "—" dy -2.06 -> 1.1 pt: moved 3.16 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|boleto\|p1\|Ficha#1\|dy` | -2.06 | 1.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "Ficha" dy -2.06 -> 1.1 pt: moved 3.16 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|boleto\|p1\|de#1\|dy` | -2.06 | 1.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "de" dy -2.06 -> 1.1 pt: moved 3.16 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|boleto\|p1\|Compensação#1\|dy` | -2.06 | 1.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "Compensação" dy -2.06 -> 1.1 pt: moved 3.16 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|boleto\|p1\|99990.00001#2\|dy` | -2.81 | 2.74 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "99990.00001" dy -2.81 -> 2.74 pt: moved 5.55 pt (> 1) and ends 2.74 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|boleto\|p1\|23456.700001#2\|dy` | -2.81 | 2.74 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "23456.700001" dy -2.81 -> 2.74 pt: moved 5.55 pt (> 1) and ends 2.74 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|boleto\|p1\|00000.000420#2\|dy` | -2.81 | 2.74 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "00000.000420" dy -2.81 -> 2.74 pt: moved 5.55 pt (> 1) and ends 2.74 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|boleto\|p1\|1#2\|dy` | -2.81 | 2.74 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "1" dy -2.81 -> 2.74 pt: moved 5.55 pt (> 1) and ends 2.74 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|boleto\|p1\|999-9#2\|dy` | -8.81 | 2.13 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "999-9" dy -8.81 -> 2.13 pt: moved 10.94 pt (> 1) and ends 2.13 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|boleto\|p1\|99990000012345#2\|dy` | -2.81 | 2.74 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "99990000012345" dy -2.81 -> 2.74 pt: moved 5.55 pt (> 1) and ends 2.74 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|boleto\|p1\|LOCAL#1\|dy` | -1.22 | 1.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "LOCAL" dy -1.22 -> 1.85 pt: moved 3.07 pt (> 1) and ends 1.85 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|boleto\|p1\|DE#1\|dy` | -1.22 | 1.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "DE" dy -1.22 -> 1.85 pt: moved 3.07 pt (> 1) and ends 1.85 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|boleto\|p1\|PAGAMENTO#1\|dy` | -1.22 | 1.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "PAGAMENTO" dy -1.22 -> 1.85 pt: moved 3.07 pt (> 1) and ends 1.85 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|boleto\|p1\|VENCIMENTO#2\|dy` | -1.22 | 1.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "VENCIMENTO" dy -1.22 -> 1.85 pt: moved 3.07 pt (> 1) and ends 1.85 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|boleto\|p1\|Pagável#1\|dy` | -1.97 | 1.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "Pagável" dy -1.97 -> 1.1 pt: moved 3.07 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|boleto\|p1\|em#1\|dy` | -1.97 | 1.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "em" dy -1.97 -> 1.1 pt: moved 3.07 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|boleto\|p1\|qualquer#1\|dy` | -1.97 | 1.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "qualquer" dy -1.97 -> 1.1 pt: moved 3.07 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|boleto\|p1\|banco#1\|dy` | -1.97 | 1.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "banco" dy -1.97 -> 1.1 pt: moved 3.07 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|boleto\|p1\|até#1\|dy` | -1.97 | 1.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "até" dy -1.97 -> 1.1 pt: moved 3.07 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|boleto\|p1\|o#1\|dy` | -1.97 | 1.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "o" dy -1.97 -> 1.1 pt: moved 3.07 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|boleto\|p1\|vencimento#1\|dy` | -1.97 | 1.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "vencimento" dy -1.97 -> 1.1 pt: moved 3.07 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|boleto\|p1\|(boleto#1\|dy` | -1.97 | 1.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "(boleto" dy -1.97 -> 1.1 pt: moved 3.07 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|boleto\|p1\|fictício#1\|dy` | -1.97 | 1.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "fictício" dy -1.97 -> 1.1 pt: moved 3.07 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|boleto\|p1\|de#2\|dy` | -1.97 | 1.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "de" dy -1.97 -> 1.1 pt: moved 3.07 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|boleto\|p1\|teste).#1\|dy` | -1.97 | 1.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "teste)." dy -1.97 -> 1.1 pt: moved 3.07 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|boleto\|p1\|15/07/2026#2\|dy` | -1.97 | 1.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "15/07/2026" dy -1.97 -> 1.1 pt: moved 3.07 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|boleto\|p1\|BENEFICIÁRIO#3\|dy` | -0.47 | 2.6 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "BENEFICIÁRIO" \|dy\| 0.47 -> 2.6 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|AGÊNCIA#2\|dy` | -0.47 | 2.6 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "AGÊNCIA" \|dy\| 0.47 -> 2.6 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|/#3\|dy` | -0.47 | 2.6 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "/" \|dy\| 0.47 -> 2.6 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|CÓDIGO#2\|dy` | -0.47 | 2.6 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "CÓDIGO" \|dy\| 0.47 -> 2.6 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|DO#4\|dy` | -0.47 | 2.6 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "DO" \|dy\| 0.47 -> 2.6 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|BENEFICIÁRIO#4\|dy` | -0.47 | 2.6 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "BENEFICIÁRIO" \|dy\| 0.47 -> 2.6 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|Acme#2\|dy` | -0.47 | 2.6 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "Acme" \|dy\| 0.47 -> 2.6 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|Widgets#2\|dy` | -0.47 | 2.6 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "Widgets" \|dy\| 0.47 -> 2.6 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|Comércio#2\|dy` | -0.47 | 2.6 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "Comércio" \|dy\| 0.47 -> 2.6 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|LTDA#2\|dy` | -0.47 | 2.6 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "LTDA" \|dy\| 0.47 -> 2.6 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|—#2\|dy` | -0.47 | 2.6 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "—" \|dy\| 0.47 -> 2.6 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|CNPJ#1\|dy` | -0.47 | 2.6 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "CNPJ" \|dy\| 0.47 -> 2.6 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|12.345.678/0001-90#1\|dy` | -0.47 | 2.6 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "12.345.678/0001-90" \|dy\| 0.47 -> 2.6 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|0042#2\|dy` | 0.28 | 3.35 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "0042" \|dy\| 0.28 -> 3.35 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|/#4\|dy` | 0.28 | 3.35 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "/" \|dy\| 0.28 -> 3.35 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|00012345-6#2\|dy` | 0.28 | 3.35 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "00012345-6" \|dy\| 0.28 -> 3.35 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|DATA#1\|dy` | 1.03 | 4.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "DATA" \|dy\| 1.03 -> 4.1 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|DO#5\|dy` | 1.03 | 4.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "DO" \|dy\| 1.03 -> 4.1 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|DOCUMENTO#2\|dy` | 1.03 | 4.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "DOCUMENTO" \|dy\| 1.03 -> 4.1 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|NÚMERO#2\|dy` | 1.03 | 4.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "NÚMERO" \|dy\| 1.03 -> 4.1 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|DO#6\|dy` | 1.03 | 4.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "DO" \|dy\| 1.03 -> 4.1 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|DOCUMENTO#3\|dy` | 1.03 | 4.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "DOCUMENTO" \|dy\| 1.03 -> 4.1 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|ESPÉCIE#1\|dy` | 1.03 | 4.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "ESPÉCIE" \|dy\| 1.03 -> 4.1 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|DOC.#1\|dy` | 1.03 | 4.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "DOC." \|dy\| 1.03 -> 4.1 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|NOSSO#2\|dy` | 1.03 | 4.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "NOSSO" \|dy\| 1.03 -> 4.1 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|NÚMERO#3\|dy` | 1.03 | 4.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "NÚMERO" \|dy\| 1.03 -> 4.1 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|22/06/2026#1\|dy` | 1.78 | 4.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "22/06/2026" \|dy\| 1.78 -> 4.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|DOC-00042#1\|dy` | 1.78 | 4.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "DOC-00042" \|dy\| 1.78 -> 4.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|DM#1\|dy` | 1.78 | 4.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "DM" \|dy\| 1.78 -> 4.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|00000000000123456-7#2\|dy` | 1.78 | 4.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "00000000000123456-7" \|dy\| 1.78 -> 4.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|CARTEIRA#1\|dy` | 2.53 | 5.6 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "CARTEIRA" \|dy\| 2.53 -> 5.6 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|ESPÉCIE#2\|dy` | 2.53 | 5.6 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "ESPÉCIE" \|dy\| 2.53 -> 5.6 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|MOEDA#1\|dy` | 2.53 | 5.6 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "MOEDA" \|dy\| 2.53 -> 5.6 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|QUANTIDADE#1\|dy` | 2.53 | 5.6 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "QUANTIDADE" \|dy\| 2.53 -> 5.6 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|(=)#1\|dy` | 2.53 | 5.6 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "(=)" \|dy\| 2.53 -> 5.6 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|VALOR#2\|dy` | 2.53 | 5.6 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "VALOR" \|dy\| 2.53 -> 5.6 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|DO#7\|dy` | 2.53 | 5.6 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "DO" \|dy\| 2.53 -> 5.6 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|DOCUMENTO#4\|dy` | 2.53 | 5.6 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "DOCUMENTO" \|dy\| 2.53 -> 5.6 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|17#1\|dy` | 3.28 | 6.35 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "17" \|dy\| 3.28 -> 6.35 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|R$#2\|dy` | 3.28 | 6.35 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "R$" \|dy\| 3.28 -> 6.35 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|1#3\|dy` | 3.28 | 6.35 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "1" \|dy\| 3.28 -> 6.35 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|R$#3\|dy` | 3.28 | 6.35 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "R$" \|dy\| 3.28 -> 6.35 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|1.842,50#2\|dy` | 3.28 | 6.35 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "1.842,50" \|dy\| 3.28 -> 6.35 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|INSTRUÇÕES#1\|dy` | 4.03 | 7.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "INSTRUÇÕES" \|dy\| 4.03 -> 7.1 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|(TEXTO#1\|dy` | 4.03 | 7.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "(TEXTO" \|dy\| 4.03 -> 7.1 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|DE#2\|dy` | 4.03 | 7.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "DE" \|dy\| 4.03 -> 7.1 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|RESPONSABILIDADE#1\|dy` | 4.03 | 7.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "RESPONSABILIDADE" \|dy\| 4.03 -> 7.1 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|DO#8\|dy` | 4.03 | 7.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "DO" \|dy\| 4.03 -> 7.1 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|BENEFICIÁRIO)#1\|dy` | 4.03 | 7.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "BENEFICIÁRIO)" \|dy\| 4.03 -> 7.1 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|(-)#1\|dy` | 4.03 | 7.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "(-)" \|dy\| 4.03 -> 7.1 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|DESCONTO#1\|dy` | 4.03 | 7.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "DESCONTO" \|dy\| 4.03 -> 7.1 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|/#5\|dy` | 4.03 | 7.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "/" \|dy\| 4.03 -> 7.1 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|ABATIMENTO#1\|dy` | 4.03 | 7.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "ABATIMENTO" \|dy\| 4.03 -> 7.1 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|•#1\|dy` | 4.78 | 7.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "•" \|dy\| 4.78 -> 7.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|Não#1\|dy` | 4.78 | 7.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "Não" \|dy\| 4.78 -> 7.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|receber#1\|dy` | 4.78 | 7.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "receber" \|dy\| 4.78 -> 7.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|após#1\|dy` | 4.78 | 7.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "após" \|dy\| 4.78 -> 7.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|30#1\|dy` | 4.78 | 7.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "30" \|dy\| 4.78 -> 7.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|dias#1\|dy` | 4.78 | 7.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "dias" \|dy\| 4.78 -> 7.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|do#1\|dy` | 4.78 | 7.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "do" \|dy\| 4.78 -> 7.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|vencimento.#1\|dy` | 4.78 | 7.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "vencimento." \|dy\| 4.78 -> 7.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|R$#4\|dy` | 4.78 | 7.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "R$" \|dy\| 4.78 -> 7.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|0,00#1\|dy` | 4.78 | 7.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "0,00" \|dy\| 4.78 -> 7.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|•#2\|dy` | 4.03 | 7.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "•" \|dy\| 4.03 -> 7.1 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|Após#1\|dy` | 4.03 | 7.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "Após" \|dy\| 4.03 -> 7.1 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|o#2\|dy` | 4.03 | 7.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "o" \|dy\| 4.03 -> 7.1 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|vencimento,#1\|dy` | 4.03 | 7.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "vencimento," \|dy\| 4.03 -> 7.1 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|cobrar#1\|dy` | 4.03 | 7.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "cobrar" \|dy\| 4.03 -> 7.1 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|multa#1\|dy` | 4.03 | 7.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "multa" \|dy\| 4.03 -> 7.1 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|de#3\|dy` | 4.03 | 7.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "de" \|dy\| 4.03 -> 7.1 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|2%#1\|dy` | 4.03 | 7.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "2%" \|dy\| 4.03 -> 7.1 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|e#1\|dy` | 4.03 | 7.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "e" \|dy\| 4.03 -> 7.1 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|mora#1\|dy` | 4.03 | 7.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "mora" \|dy\| 4.03 -> 7.1 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|de#4\|dy` | 4.03 | 7.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "de" \|dy\| 4.03 -> 7.1 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|1%#1\|dy` | 4.03 | 7.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "1%" \|dy\| 4.03 -> 7.1 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|ao#1\|dy` | 4.03 | 7.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "ao" \|dy\| 4.03 -> 7.1 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|mês.#1\|dy` | 4.03 | 7.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "mês." \|dy\| 4.03 -> 7.1 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|(-)#2\|dy` | 6.28 | 9.35 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "(-)" \|dy\| 6.28 -> 9.35 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|OUTRAS#1\|dy` | 6.28 | 9.35 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "OUTRAS" \|dy\| 6.28 -> 9.35 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|DEDUÇÕES#1\|dy` | 6.28 | 9.35 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "DEDUÇÕES" \|dy\| 6.28 -> 9.35 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|•#3\|dy` | 4.03 | 7.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "•" \|dy\| 4.03 -> 7.1 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|Em#1\|dy` | 4.03 | 7.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "Em" \|dy\| 4.03 -> 7.1 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|caso#1\|dy` | 4.03 | 7.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "caso" \|dy\| 4.03 -> 7.1 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|de#5\|dy` | 4.03 | 7.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "de" \|dy\| 4.03 -> 7.1 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|dúvida#1\|dy` | 4.03 | 7.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "dúvida" \|dy\| 4.03 -> 7.1 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|sobre#1\|dy` | 4.03 | 7.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "sobre" \|dy\| 4.03 -> 7.1 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|este#1\|dy` | 4.03 | 7.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "este" \|dy\| 4.03 -> 7.1 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|documento#1\|dy` | 4.03 | 7.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "documento" \|dy\| 4.03 -> 7.1 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|de#6\|dy` | 4.03 | 7.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "de" \|dy\| 4.03 -> 7.1 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|teste,#1\|dy` | 4.03 | 7.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "teste," \|dy\| 4.03 -> 7.1 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|contate#1\|dy` | 4.03 | 7.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "contate" \|dy\| 4.03 -> 7.1 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|o#3\|dy` | 4.03 | 7.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "o" \|dy\| 4.03 -> 7.1 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|emissor#1\|dy` | 4.03 | 7.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "emissor" \|dy\| 4.03 -> 7.1 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|fictício.#1\|dy` | 4.03 | 7.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "fictício." \|dy\| 4.03 -> 7.1 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|R$#5\|dy` | 5.53 | 8.6 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "R$" \|dy\| 5.53 -> 8.6 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|0,00#2\|dy` | 5.53 | 8.6 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "0,00" \|dy\| 5.53 -> 8.6 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|Desconto#1\|dy` | 4.78 | 7.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "Desconto" \|dy\| 4.78 -> 7.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|de#7\|dy` | 4.78 | 7.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "de" \|dy\| 4.78 -> 7.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|R$#6\|dy` | 4.78 | 7.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "R$" \|dy\| 4.78 -> 7.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|92,13#1\|dy` | 4.78 | 7.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "92,13" \|dy\| 4.78 -> 7.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|para#1\|dy` | 4.78 | 7.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "para" \|dy\| 4.78 -> 7.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|pagamento#1\|dy` | 4.78 | 7.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "pagamento" \|dy\| 4.78 -> 7.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|até#2\|dy` | 4.78 | 7.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "até" \|dy\| 4.78 -> 7.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|05/07/2026.#1\|dy` | 4.78 | 7.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "05/07/2026." \|dy\| 4.78 -> 7.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|(+)#1\|dy` | 7.78 | 10.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "(+)" \|dy\| 7.78 -> 10.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|MORA#1\|dy` | 7.78 | 10.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "MORA" \|dy\| 7.78 -> 10.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|/#6\|dy` | 7.78 | 10.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "/" \|dy\| 7.78 -> 10.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|MULTA#1\|dy` | 7.78 | 10.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "MULTA" \|dy\| 7.78 -> 10.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|R$#7\|dy` | 7.03 | 10.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "R$" \|dy\| 7.03 -> 10.1 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|0,00#3\|dy` | 7.03 | 10.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "0,00" \|dy\| 7.03 -> 10.1 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|(=)#2\|dy` | 9.28 | 12.35 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "(=)" \|dy\| 9.28 -> 12.35 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|VALOR#3\|dy` | 9.28 | 12.35 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "VALOR" \|dy\| 9.28 -> 12.35 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|COBRADO#1\|dy` | 9.28 | 12.35 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "COBRADO" \|dy\| 9.28 -> 12.35 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|R$#8\|dy` | 8.53 | 11.6 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "R$" \|dy\| 8.53 -> 11.6 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|1.842,50#3\|dy` | 8.53 | 11.6 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "1.842,50" \|dy\| 8.53 -> 11.6 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|PAGADOR#2\|dy` | 10.78 | 13.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "PAGADOR" \|dy\| 10.78 -> 13.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|Maria#1\|dy` | 10.78 | 13.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "Maria" \|dy\| 10.78 -> 13.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|das#1\|dy` | 10.78 | 13.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "das" \|dy\| 10.78 -> 13.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|Couves#1\|dy` | 10.78 | 13.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "Couves" \|dy\| 10.78 -> 13.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|Exemplo#1\|dy` | 10.78 | 13.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "Exemplo" \|dy\| 10.78 -> 13.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|—#3\|dy` | 10.78 | 13.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "—" \|dy\| 10.78 -> 13.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|CPF#1\|dy` | 10.78 | 13.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "CPF" \|dy\| 10.78 -> 13.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|123.456.789-09#1\|dy` | 10.78 | 13.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "123.456.789-09" \|dy\| 10.78 -> 13.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|Rua#1\|dy` | 10.78 | 13.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "Rua" \|dy\| 10.78 -> 13.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|das#2\|dy` | 10.78 | 13.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "das" \|dy\| 10.78 -> 13.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|Flores,#1\|dy` | 10.78 | 13.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "Flores," \|dy\| 10.78 -> 13.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|123#1\|dy` | 10.78 | 13.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "123" \|dy\| 10.78 -> 13.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|—#4\|dy` | 10.78 | 13.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "—" \|dy\| 10.78 -> 13.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|Jardim#1\|dy` | 10.78 | 13.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "Jardim" \|dy\| 10.78 -> 13.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|Sintético#1\|dy` | 10.78 | 13.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "Sintético" \|dy\| 10.78 -> 13.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|Cidade#1\|dy` | 10.78 | 13.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "Cidade" \|dy\| 10.78 -> 13.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|Exemplo#2\|dy` | 10.78 | 13.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "Exemplo" \|dy\| 10.78 -> 13.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|/#7\|dy` | 10.78 | 13.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "/" \|dy\| 10.78 -> 13.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|SP#1\|dy` | 10.78 | 13.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "SP" \|dy\| 10.78 -> 13.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|—#5\|dy` | 10.78 | 13.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "—" \|dy\| 10.78 -> 13.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|CEP#1\|dy` | 10.78 | 13.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "CEP" \|dy\| 10.78 -> 13.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|01234-567#1\|dy` | 10.78 | 13.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "01234-567" \|dy\| 10.78 -> 13.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|REFERÊNCIA#1\|dy` | 12.28 | 15.35 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "REFERÊNCIA" \|dy\| 12.28 -> 15.35 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|DESCRIÇÃO#1\|dy` | 12.28 | 15.35 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "DESCRIÇÃO" \|dy\| 12.28 -> 15.35 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|VALOR#4\|dy` | 12.28 | 15.35 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "VALOR" \|dy\| 12.28 -> 15.35 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|06/2026#1\|dy` | 12.28 | 15.35 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "06/2026" \|dy\| 12.28 -> 15.35 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|Assinatura#1\|dy` | 12.28 | 15.35 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "Assinatura" \|dy\| 12.28 -> 15.35 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|plano#1\|dy` | 12.28 | 15.35 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "plano" \|dy\| 12.28 -> 15.35 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|Widget#1\|dy` | 12.28 | 15.35 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "Widget" \|dy\| 12.28 -> 15.35 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|Pro#1\|dy` | 12.28 | 15.35 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "Pro" \|dy\| 12.28 -> 15.35 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|R$#9\|dy` | 12.28 | 15.35 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "R$" \|dy\| 12.28 -> 15.35 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|1.499,00#1\|dy` | 12.28 | 15.35 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "1.499,00" \|dy\| 12.28 -> 15.35 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|06/2026#2\|dy` | 13.03 | 16.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "06/2026" \|dy\| 13.03 -> 16.1 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|Usuários#1\|dy` | 13.03 | 16.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "Usuários" \|dy\| 13.03 -> 16.1 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|adicionais#1\|dy` | 13.03 | 16.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "adicionais" \|dy\| 13.03 -> 16.1 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|(3x)#1\|dy` | 13.03 | 16.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "(3x)" \|dy\| 13.03 -> 16.1 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|R$#10\|dy` | 13.03 | 16.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "R$" \|dy\| 13.03 -> 16.1 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|297,00#1\|dy` | 13.03 | 16.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "297,00" \|dy\| 13.03 -> 16.1 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|06/2026#3\|dy` | 13.78 | 16.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "06/2026" \|dy\| 13.78 -> 16.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|Taxa#1\|dy` | 13.78 | 16.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "Taxa" \|dy\| 13.78 -> 16.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|de#8\|dy` | 13.78 | 16.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "de" \|dy\| 13.78 -> 16.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|processamento#1\|dy` | 13.78 | 16.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "processamento" \|dy\| 13.78 -> 16.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|R$#11\|dy` | 13.78 | 16.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "R$" \|dy\| 13.78 -> 16.85 pt vs Chrome (baseline) |
| … | 973 more in gate-report.json | | | | |

## Debt ledger (0 entries; transition checked; passes auto_table_compact_columns, painted_table_cell_text_baselines, table_percent_widths)

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

(a) accepted artefacts 0, (b) ledger debt 0, (c) neither 859, declared rejections 10.

| group | key | before | after | tolerance | detail |
|---|---|---|---|---|---|
| corpus DANFE-M | `danfe\|DANFE-M1\|corpus\|\|criterion#1\|excessB` | 8.552 | 24.173 | 0.05 geometry-excess-mm | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): 8.552 -> 24.173 (tolerance 0.05 mm) |
| corpus DANFE-L | `danfe\|DANFE-L1a\|corpus\|\|criterion#1\|posErrMm` | 1.56 | 2.09 | 0.1 position-mm | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): 1.56 -> 2.09 (tolerance 0.1 mm) |
| corpus DANFE-L | `danfe\|DANFE-L1b\|corpus\|\|criterion#1\|posErrMm` | 3.15 | 3.68 | 0.1 position-mm | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): 3.15 -> 3.68 (tolerance 0.1 mm) |
| corpus DANFE-L | `danfe\|DANFE-L1c\|corpus\|\|criterion#1\|posErrMm` | 4.71 | 5.24 | 0.1 position-mm | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): 4.71 -> 5.24 (tolerance 0.1 mm) |
| corpus DANFE-L | `danfe\|DANFE-L1d\|corpus\|\|criterion#1\|posErrMm` | 5.96 | 6.49 | 0.1 position-mm | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): 5.96 -> 6.49 (tolerance 0.1 mm) |
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
| pdf-probe | `pdf-probe\|boleto\|p1\|Corte#1\|dy` | -1.31 | 1.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "Corte" dy -1.31 -> 1.1 pt: moved 2.41 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|boleto\|p1\|na#1\|dy` | -1.31 | 1.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "na" dy -1.31 -> 1.1 pt: moved 2.41 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|boleto\|p1\|linha#1\|dy` | -1.31 | 1.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "linha" dy -1.31 -> 1.1 pt: moved 2.41 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|boleto\|p1\|pontilhada#1\|dy` | -1.31 | 1.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "pontilhada" dy -1.31 -> 1.1 pt: moved 2.41 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|boleto\|p1\|—#1\|dy` | -1.31 | 1.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "—" dy -1.31 -> 1.1 pt: moved 2.41 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|boleto\|p1\|Ficha#1\|dy` | -1.31 | 1.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "Ficha" dy -1.31 -> 1.1 pt: moved 2.41 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|boleto\|p1\|de#1\|dy` | -1.31 | 1.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "de" dy -1.31 -> 1.1 pt: moved 2.41 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|boleto\|p1\|Compensação#1\|dy` | -1.31 | 1.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "Compensação" dy -1.31 -> 1.1 pt: moved 2.41 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|boleto\|p1\|99990.00001#2\|dy` | 0.19 | 2.74 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "99990.00001" \|dy\| 0.19 -> 2.74 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|23456.700001#2\|dy` | 0.19 | 2.74 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "23456.700001" \|dy\| 0.19 -> 2.74 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|00000.000420#2\|dy` | 0.19 | 2.74 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "00000.000420" \|dy\| 0.19 -> 2.74 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|1#2\|dy` | 0.19 | 2.74 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "1" \|dy\| 0.19 -> 2.74 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|999-9#2\|dy` | -5.81 | 2.13 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "999-9" dy -5.81 -> 2.13 pt: moved 7.94 pt (> 1) and ends 2.13 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|boleto\|p1\|99990000012345#2\|dy` | 0.19 | 2.74 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "99990000012345" \|dy\| 0.19 -> 2.74 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|0042#2\|dy` | -6.47 | 3.35 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "0042" dy -6.47 -> 3.35 pt: moved 9.82 pt (> 1) and ends 3.35 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|boleto\|p1\|/#4\|dy` | -6.47 | 3.35 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "/" dy -6.47 -> 3.35 pt: moved 9.82 pt (> 1) and ends 3.35 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|boleto\|p1\|00012345-6#2\|dy` | -6.47 | 3.35 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "00012345-6" dy -6.47 -> 3.35 pt: moved 9.82 pt (> 1) and ends 3.35 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|boleto\|p1\|DATA#1\|dy` | -4.97 | 4.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "DATA" dy -4.97 -> 4.1 pt: moved 9.07 pt (> 1) and ends 4.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|boleto\|p1\|DO#5\|dy` | -4.97 | 4.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "DO" dy -4.97 -> 4.1 pt: moved 9.07 pt (> 1) and ends 4.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|boleto\|p1\|DOCUMENTO#2\|dy` | -4.97 | 4.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "DOCUMENTO" dy -4.97 -> 4.1 pt: moved 9.07 pt (> 1) and ends 4.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|boleto\|p1\|NÚMERO#2\|dy` | -4.97 | 4.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "NÚMERO" dy -4.97 -> 4.1 pt: moved 9.07 pt (> 1) and ends 4.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|boleto\|p1\|DO#6\|dy` | -4.97 | 4.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "DO" dy -4.97 -> 4.1 pt: moved 9.07 pt (> 1) and ends 4.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|boleto\|p1\|DOCUMENTO#3\|dy` | -4.97 | 4.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "DOCUMENTO" dy -4.97 -> 4.1 pt: moved 9.07 pt (> 1) and ends 4.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|boleto\|p1\|ESPÉCIE#1\|dy` | -4.97 | 4.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "ESPÉCIE" dy -4.97 -> 4.1 pt: moved 9.07 pt (> 1) and ends 4.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|boleto\|p1\|DOC.#1\|dy` | -4.97 | 4.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "DOC." dy -4.97 -> 4.1 pt: moved 9.07 pt (> 1) and ends 4.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|boleto\|p1\|22/06/2026#1\|dy` | -4.97 | 4.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "22/06/2026" dy -4.97 -> 4.85 pt: moved 9.82 pt (> 1) and ends 4.85 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|boleto\|p1\|DOC-00042#1\|dy` | -4.97 | 4.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "DOC-00042" dy -4.97 -> 4.85 pt: moved 9.82 pt (> 1) and ends 4.85 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|boleto\|p1\|DM#1\|dy` | -4.97 | 4.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "DM" dy -4.97 -> 4.85 pt: moved 9.82 pt (> 1) and ends 4.85 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|boleto\|p1\|00000000000123456-7#2\|dy` | -4.97 | 4.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "00000000000123456-7" dy -4.97 -> 4.85 pt: moved 9.82 pt (> 1) and ends 4.85 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|boleto\|p1\|CARTEIRA#1\|dy` | -3.47 | 5.6 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "CARTEIRA" \|dy\| 3.47 -> 5.6 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|ESPÉCIE#2\|dy` | -3.47 | 5.6 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "ESPÉCIE" \|dy\| 3.47 -> 5.6 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|MOEDA#1\|dy` | -3.47 | 5.6 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "MOEDA" \|dy\| 3.47 -> 5.6 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|QUANTIDADE#1\|dy` | -3.47 | 5.6 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "QUANTIDADE" \|dy\| 3.47 -> 5.6 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|17#1\|dy` | -3.47 | 6.35 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "17" \|dy\| 3.47 -> 6.35 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|R$#2\|dy` | -3.47 | 6.35 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "R$" \|dy\| 3.47 -> 6.35 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|1#3\|dy` | -3.47 | 6.35 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "1" \|dy\| 3.47 -> 6.35 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|R$#3\|dy` | -3.47 | 6.35 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "R$" \|dy\| 3.47 -> 6.35 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|1.842,50#2\|dy` | -3.47 | 6.35 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "1.842,50" \|dy\| 3.47 -> 6.35 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|INSTRUÇÕES#1\|dy` | -1.97 | 7.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "INSTRUÇÕES" \|dy\| 1.97 -> 7.1 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|(TEXTO#1\|dy` | -1.97 | 7.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "(TEXTO" \|dy\| 1.97 -> 7.1 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|DE#2\|dy` | -1.97 | 7.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "DE" \|dy\| 1.97 -> 7.1 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|RESPONSABILIDADE#1\|dy` | -1.97 | 7.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "RESPONSABILIDADE" \|dy\| 1.97 -> 7.1 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|DO#8\|dy` | -1.97 | 7.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "DO" \|dy\| 1.97 -> 7.1 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|BENEFICIÁRIO)#1\|dy` | -1.97 | 7.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "BENEFICIÁRIO)" \|dy\| 1.97 -> 7.1 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|•#1\|dy` | -1.97 | 7.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "•" \|dy\| 1.97 -> 7.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|Não#1\|dy` | -1.97 | 7.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "Não" \|dy\| 1.97 -> 7.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|receber#1\|dy` | -1.97 | 7.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "receber" \|dy\| 1.97 -> 7.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|após#1\|dy` | -1.97 | 7.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "após" \|dy\| 1.97 -> 7.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|30#1\|dy` | -1.97 | 7.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "30" \|dy\| 1.97 -> 7.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|dias#1\|dy` | -1.97 | 7.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "dias" \|dy\| 1.97 -> 7.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|do#1\|dy` | -1.97 | 7.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "do" \|dy\| 1.97 -> 7.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|vencimento.#1\|dy` | -1.97 | 7.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "vencimento." \|dy\| 1.97 -> 7.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|R$#4\|dy` | -1.97 | 7.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "R$" \|dy\| 1.97 -> 7.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|0,00#1\|dy` | -1.97 | 7.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "0,00" \|dy\| 1.97 -> 7.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|•#2\|dy` | -2.72 | 7.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "•" \|dy\| 2.72 -> 7.1 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|Após#1\|dy` | -2.72 | 7.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "Após" \|dy\| 2.72 -> 7.1 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|o#2\|dy` | -2.72 | 7.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "o" \|dy\| 2.72 -> 7.1 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|vencimento,#1\|dy` | -2.72 | 7.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "vencimento," \|dy\| 2.72 -> 7.1 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|cobrar#1\|dy` | -2.72 | 7.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "cobrar" \|dy\| 2.72 -> 7.1 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|multa#1\|dy` | -2.72 | 7.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "multa" \|dy\| 2.72 -> 7.1 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|de#3\|dy` | -2.72 | 7.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "de" \|dy\| 2.72 -> 7.1 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|2%#1\|dy` | -2.72 | 7.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "2%" \|dy\| 2.72 -> 7.1 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|e#1\|dy` | -2.72 | 7.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "e" \|dy\| 2.72 -> 7.1 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|mora#1\|dy` | -2.72 | 7.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "mora" \|dy\| 2.72 -> 7.1 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|de#4\|dy` | -2.72 | 7.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "de" \|dy\| 2.72 -> 7.1 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|1%#1\|dy` | -2.72 | 7.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "1%" \|dy\| 2.72 -> 7.1 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|ao#1\|dy` | -2.72 | 7.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "ao" \|dy\| 2.72 -> 7.1 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|mês.#1\|dy` | -2.72 | 7.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "mês." \|dy\| 2.72 -> 7.1 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|•#3\|dy` | -2.72 | 7.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "•" \|dy\| 2.72 -> 7.1 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|Em#1\|dy` | -2.72 | 7.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "Em" \|dy\| 2.72 -> 7.1 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|caso#1\|dy` | -2.72 | 7.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "caso" \|dy\| 2.72 -> 7.1 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|de#5\|dy` | -2.72 | 7.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "de" \|dy\| 2.72 -> 7.1 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|dúvida#1\|dy` | -2.72 | 7.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "dúvida" \|dy\| 2.72 -> 7.1 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|sobre#1\|dy` | -2.72 | 7.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "sobre" \|dy\| 2.72 -> 7.1 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|este#1\|dy` | -2.72 | 7.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "este" \|dy\| 2.72 -> 7.1 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|documento#1\|dy` | -2.72 | 7.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "documento" \|dy\| 2.72 -> 7.1 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|de#6\|dy` | -2.72 | 7.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "de" \|dy\| 2.72 -> 7.1 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|teste,#1\|dy` | -2.72 | 7.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "teste," \|dy\| 2.72 -> 7.1 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|contate#1\|dy` | -2.72 | 7.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "contate" \|dy\| 2.72 -> 7.1 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|o#3\|dy` | -2.72 | 7.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "o" \|dy\| 2.72 -> 7.1 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|emissor#1\|dy` | -2.72 | 7.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "emissor" \|dy\| 2.72 -> 7.1 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|fictício.#1\|dy` | -2.72 | 7.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "fictício." \|dy\| 2.72 -> 7.1 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|R$#5\|dy` | -1.22 | 8.6 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "R$" \|dy\| 1.22 -> 8.6 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|0,00#2\|dy` | -1.22 | 8.6 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "0,00" \|dy\| 1.22 -> 8.6 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|Desconto#1\|dy` | -1.97 | 7.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "Desconto" \|dy\| 1.97 -> 7.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|de#7\|dy` | -1.97 | 7.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "de" \|dy\| 1.97 -> 7.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|R$#6\|dy` | -1.97 | 7.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "R$" \|dy\| 1.97 -> 7.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|92,13#1\|dy` | -1.97 | 7.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "92,13" \|dy\| 1.97 -> 7.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|para#1\|dy` | -1.97 | 7.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "para" \|dy\| 1.97 -> 7.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|pagamento#1\|dy` | -1.97 | 7.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "pagamento" \|dy\| 1.97 -> 7.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|até#2\|dy` | -1.97 | 7.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "até" \|dy\| 1.97 -> 7.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|05/07/2026.#1\|dy` | -1.97 | 7.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "05/07/2026." \|dy\| 1.97 -> 7.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|R$#7\|dy` | 0.28 | 10.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "R$" \|dy\| 0.28 -> 10.1 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|0,00#3\|dy` | 0.28 | 10.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "0,00" \|dy\| 0.28 -> 10.1 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|R$#8\|dy` | 1.78 | 11.6 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "R$" \|dy\| 1.78 -> 11.6 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|1.842,50#3\|dy` | 1.78 | 11.6 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "1.842,50" \|dy\| 1.78 -> 11.6 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|PAGADOR#2\|dy` | 4.78 | 13.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "PAGADOR" \|dy\| 4.78 -> 13.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|Maria#1\|dy` | 4.03 | 13.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "Maria" \|dy\| 4.03 -> 13.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|das#1\|dy` | 4.03 | 13.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "das" \|dy\| 4.03 -> 13.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|Couves#1\|dy` | 4.03 | 13.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "Couves" \|dy\| 4.03 -> 13.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|Exemplo#1\|dy` | 4.03 | 13.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "Exemplo" \|dy\| 4.03 -> 13.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|—#3\|dy` | 4.03 | 13.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "—" \|dy\| 4.03 -> 13.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|CPF#1\|dy` | 4.03 | 13.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "CPF" \|dy\| 4.03 -> 13.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|123.456.789-09#1\|dy` | 4.03 | 13.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "123.456.789-09" \|dy\| 4.03 -> 13.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|Rua#1\|dy` | 4.03 | 13.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "Rua" \|dy\| 4.03 -> 13.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|das#2\|dy` | 4.03 | 13.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "das" \|dy\| 4.03 -> 13.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|Flores,#1\|dy` | 4.03 | 13.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "Flores," \|dy\| 4.03 -> 13.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|123#1\|dy` | 4.03 | 13.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "123" \|dy\| 4.03 -> 13.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|—#4\|dy` | 4.03 | 13.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "—" \|dy\| 4.03 -> 13.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|Jardim#1\|dy` | 4.03 | 13.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "Jardim" \|dy\| 4.03 -> 13.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|Sintético#1\|dy` | 4.03 | 13.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "Sintético" \|dy\| 4.03 -> 13.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|Cidade#1\|dy` | 4.03 | 13.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "Cidade" \|dy\| 4.03 -> 13.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|Exemplo#2\|dy` | 4.03 | 13.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "Exemplo" \|dy\| 4.03 -> 13.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|/#7\|dy` | 4.03 | 13.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "/" \|dy\| 4.03 -> 13.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|SP#1\|dy` | 4.03 | 13.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "SP" \|dy\| 4.03 -> 13.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|—#5\|dy` | 4.03 | 13.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "—" \|dy\| 4.03 -> 13.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|CEP#1\|dy` | 4.03 | 13.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "CEP" \|dy\| 4.03 -> 13.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|01234-567#1\|dy` | 4.03 | 13.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "01234-567" \|dy\| 4.03 -> 13.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|REFERÊNCIA#1\|dy` | 6.28 | 15.35 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "REFERÊNCIA" \|dy\| 6.28 -> 15.35 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|DESCRIÇÃO#1\|dy` | 6.28 | 15.35 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "DESCRIÇÃO" \|dy\| 6.28 -> 15.35 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|VALOR#4\|dy` | 6.28 | 15.35 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "VALOR" \|dy\| 6.28 -> 15.35 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|06/2026#1\|dy` | 5.53 | 15.35 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "06/2026" \|dy\| 5.53 -> 15.35 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|Assinatura#1\|dy` | 5.53 | 15.35 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "Assinatura" \|dy\| 5.53 -> 15.35 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|plano#1\|dy` | 5.53 | 15.35 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "plano" \|dy\| 5.53 -> 15.35 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|Widget#1\|dy` | 5.53 | 15.35 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "Widget" \|dy\| 5.53 -> 15.35 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|Pro#1\|dy` | 5.53 | 15.35 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "Pro" \|dy\| 5.53 -> 15.35 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|R$#9\|dy` | 5.53 | 15.35 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "R$" \|dy\| 5.53 -> 15.35 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|1.499,00#1\|dy` | 5.53 | 15.35 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "1.499,00" \|dy\| 5.53 -> 15.35 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|06/2026#2\|dy` | 7.03 | 16.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "06/2026" \|dy\| 7.03 -> 16.1 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|Usuários#1\|dy` | 7.03 | 16.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "Usuários" \|dy\| 7.03 -> 16.1 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|adicionais#1\|dy` | 7.03 | 16.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "adicionais" \|dy\| 7.03 -> 16.1 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|(3x)#1\|dy` | 7.03 | 16.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "(3x)" \|dy\| 7.03 -> 16.1 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|R$#10\|dy` | 7.03 | 16.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "R$" \|dy\| 7.03 -> 16.1 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|297,00#1\|dy` | 7.03 | 16.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "297,00" \|dy\| 7.03 -> 16.1 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|06/2026#3\|dy` | 7.03 | 16.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "06/2026" \|dy\| 7.03 -> 16.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|Taxa#1\|dy` | 7.03 | 16.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "Taxa" \|dy\| 7.03 -> 16.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|de#8\|dy` | 7.03 | 16.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "de" \|dy\| 7.03 -> 16.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|processamento#1\|dy` | 7.03 | 16.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "processamento" \|dy\| 7.03 -> 16.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|R$#11\|dy` | 7.03 | 16.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "R$" \|dy\| 7.03 -> 16.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|46,50#1\|dy` | 7.03 | 16.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "46,50" \|dy\| 7.03 -> 16.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|CÓDIGO#3\|dy` | 10.03 | 19.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "CÓDIGO" \|dy\| 10.03 -> 19.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|DE#3\|dy` | 10.03 | 19.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "DE" \|dy\| 10.03 -> 19.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|BARRAS#1\|dy` | 10.03 | 19.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "BARRAS" \|dy\| 10.03 -> 19.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|(REPRESENTAÇÃO#1\|dy` | 10.03 | 19.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "(REPRESENTAÇÃO" \|dy\| 10.03 -> 19.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|TEXTUAL#1\|dy` | 10.03 | 19.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "TEXTUAL" \|dy\| 10.03 -> 19.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|—#6\|dy` | 10.03 | 19.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "—" \|dy\| 10.03 -> 19.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|NÃO#1\|dy` | 10.03 | 19.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "NÃO" \|dy\| 10.03 -> 19.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|ESCANEÁVEL)#1\|dy` | 10.03 | 19.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "ESCANEÁVEL)" \|dy\| 10.03 -> 19.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|9#1\|dy` | 10.62 | 19.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "9" \|dy\| 10.62 -> 19.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|9#2\|dy` | 10.62 | 19.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "9" \|dy\| 10.62 -> 19.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|9#3\|dy` | 10.62 | 19.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "9" \|dy\| 10.62 -> 19.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|9#4\|dy` | 10.62 | 19.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "9" \|dy\| 10.62 -> 19.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|1#4\|dy` | 10.62 | 19.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "1" \|dy\| 10.62 -> 19.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|9#5\|dy` | 10.62 | 19.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "9" \|dy\| 10.62 -> 19.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|9#6\|dy` | 10.62 | 19.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "9" \|dy\| 10.62 -> 19.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|9#7\|dy` | 10.62 | 19.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "9" \|dy\| 10.62 -> 19.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|9#8\|dy` | 10.62 | 19.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "9" \|dy\| 10.62 -> 19.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|0#1\|dy` | 10.62 | 19.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "0" \|dy\| 10.62 -> 19.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|0#2\|dy` | 10.62 | 19.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "0" \|dy\| 10.62 -> 19.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|0#3\|dy` | 10.62 | 19.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "0" \|dy\| 10.62 -> 19.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|0#4\|dy` | 10.62 | 19.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "0" \|dy\| 10.62 -> 19.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|0#5\|dy` | 10.62 | 19.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "0" \|dy\| 10.62 -> 19.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|1#5\|dy` | 10.62 | 19.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "1" \|dy\| 10.62 -> 19.85 pt vs Chrome (baseline) |
| … | 659 more in gate-report.json | | | | |

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
| pdf-probe | within-tolerance 327, improvement 39, newly-measured 39, regression 3 |
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

