# Fidelity gate report

**Verdict: FAIL** (206 gating item(s) vs the previous link; 98 flagged WPT pass(es) lost, reported, not gating; 394 value(s) worse within tolerance, listed, not gating; pin view: merge to main BLOCKED, 206 (c) item(s)). Local macOS runs are INDICATIVE.

| field | value |
|---|---|
| date | 2026-10-22T22:14:38.700Z |
| command | `node fidelity/gate/run.mjs --baseline fidelity/baselines/pin --run fidelity/baselines/port/09-review-fixes --accept fidelity/baselines/port/09-review-fixes/manifest.json --no-head --pin fidelity/baselines/pin --main --layout-from ~/.cache/vellora-fidelity/run-all-09-review-fixes-20261021T205223Z --step 09-review-fixes --out <scratch>/09-vs-pin-main` |
| baseline | fidelity/baselines/pin (vellora-fidelity/baseline-pin/1/manifest) |
| run | fidelity/baselines/port/09-review-fixes (vellora-fidelity/baseline/2) |

Counts: improvement 1792, newly-measured 5, added 13, regression 196, within-tolerance 394, reported 98, changed 20, rejection 10, not-comparable 8, gating 206, headGating 0, debt 0, flaggedPassLost 98, unchanged 7202, withinTolerance 394, withinToleranceBetter 334, pinA 0, pinB 0, pinC 206.

## Absolute failures of the run (gate, cannot be accepted)

none

## Regressions beyond tolerance (gate)

| group | key | before | after | tolerance | detail |
|---|---|---|---|---|---|
| corpus DANFE-M | `danfe\|DANFE-M1\|corpus\|\|criterion#1\|excessB` | 8.552 | 24.173 | 0.05 geometry-excess-mm | 8.552 -> 24.173 (tolerance 0.05 mm) |
| corpus DANFE-L | `danfe\|DANFE-L1a\|corpus\|\|criterion#1\|posErrMm` | 1.56 | 2.09 | 0.1 position-mm | 1.56 -> 2.09 (tolerance 0.1 mm) |
| corpus DANFE-L | `danfe\|DANFE-L1b\|corpus\|\|criterion#1\|posErrMm` | 3.15 | 3.68 | 0.1 position-mm | 3.15 -> 3.68 (tolerance 0.1 mm) |
| corpus DANFE-L | `danfe\|DANFE-L1c\|corpus\|\|criterion#1\|posErrMm` | 4.71 | 5.24 | 0.1 position-mm | 4.71 -> 5.24 (tolerance 0.1 mm) |
| corpus DANFE-L | `danfe\|DANFE-L1d\|corpus\|\|criterion#1\|posErrMm` | 5.96 | 6.49 | 0.1 position-mm | 5.96 -> 6.49 (tolerance 0.1 mm) |
| oracles:text EXT-2 | `invoice\|EXT-2\|oracles:text\|plain\|criterion#1\|statusRank.pdfminer.six` | 3 | 2 | 0 count | 3 -> 2 (tolerance 0 count) |
| oracles:layout REF-W | `invoice\|REF-W\|oracles:layout\|plain\|criterion#1\|p95Mm` | 1.78 | 2.51 | 0.1 position-mm | 1.78 -> 2.51 (tolerance 0.1 mm) |
| corpus INV-R | `oss-postmark-receipt\|INV-R1\|corpus\|\|criterion#1\|worstMm` | 5.5 | 10.26 | 0.1 position-mm | 5.5 -> 10.26 (tolerance 0.1 mm) |
| oracles:text EXT-2 | `oss-postmark-receipt\|EXT-2\|oracles:text\|plain\|criterion#1\|missing.pdftotext` | 35 | 38 | 0 count | 35 -> 38 (tolerance 0 count) |
| oracles:text EXT-2 | `oss-postmark-receipt\|EXT-2\|oracles:text\|plain\|criterion#1\|missing.pymupdf` | 37 | 40 | 0 count | 37 -> 40 (tolerance 0 count) |
| pdf-probe | `pdf-probe\|invoice\|p1\|DESTINATÁRIO#1\|dx` | 1.19 | -7.06 | 1 pdf-probe-pt | "DESTINATÁRIO" \|dx\| 1.19 -> 7.06 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|invoice\|p1\|Borges#1\|dx` | 1.19 | -7.06 | 1 pdf-probe-pt | "Borges" \|dx\| 1.19 -> 7.06 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|invoice\|p1\|&#1\|dx` | 1.19 | -7.07 | 1 pdf-probe-pt | "&" \|dx\| 1.19 -> 7.07 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|invoice\|p1\|Pinto#1\|dx` | 1.2 | -7.07 | 1 pdf-probe-pt | "Pinto" \|dx\| 1.2 -> 7.07 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|invoice\|p1\|Comércio#1\|dx` | 1.21 | -7.07 | 1 pdf-probe-pt | "Comércio" \|dx\| 1.21 -> 7.07 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|invoice\|p1\|Ltda.#1\|dx` | 1.22 | -7.08 | 1 pdf-probe-pt | "Ltda." \|dx\| 1.22 -> 7.08 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|invoice\|p1\|Cliente#1\|dx` | 1.19 | -7.06 | 1 pdf-probe-pt | "Cliente" \|dx\| 1.19 -> 7.06 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|invoice\|p1\|CUST-00042#1\|dx` | 1.2 | -7.04 | 1 pdf-probe-pt | "CUST-00042" \|dx\| 1.2 -> 7.04 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|invoice\|p1\|Avenida#1\|dx` | 1.19 | -7.06 | 1 pdf-probe-pt | "Avenida" \|dx\| 1.19 -> 7.06 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|invoice\|p1\|Central,#1\|dx` | 1.2 | -7.04 | 1 pdf-probe-pt | "Central," \|dx\| 1.2 -> 7.04 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|invoice\|p1\|4500#1\|dx` | 1.22 | -7 | 1 pdf-probe-pt | "4500" \|dx\| 1.22 -> 7 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|invoice\|p1\|—#3\|dx` | 1.23 | -6.99 | 1 pdf-probe-pt | "—" \|dx\| 1.23 -> 6.99 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|invoice\|p1\|Conjunto#1\|dx` | 1.23 | -6.97 | 1 pdf-probe-pt | "Conjunto" \|dx\| 1.23 -> 6.97 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|invoice\|p1\|12#1\|dx` | 1.25 | -6.94 | 1 pdf-probe-pt | "12" \|dx\| 1.25 -> 6.94 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|invoice\|p1\|Campinas#1\|dx` | 1.19 | -7.06 | 1 pdf-probe-pt | "Campinas" \|dx\| 1.19 -> 7.06 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|invoice\|p1\|—#4\|dx` | 1.2 | -7.03 | 1 pdf-probe-pt | "—" \|dx\| 1.2 -> 7.03 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|invoice\|p1\|SP#2\|dx` | 1.21 | -7.01 | 1 pdf-probe-pt | "SP" \|dx\| 1.21 -> 7.01 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|invoice\|p1\|13010-111,#1\|dx` | 1.19 | -7.06 | 1 pdf-probe-pt | "13010-111," \|dx\| 1.19 -> 7.06 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|invoice\|p1\|Brasil#2\|dx` | 1.2 | -7.03 | 1 pdf-probe-pt | "Brasil" \|dx\| 1.2 -> 7.03 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|invoice\|p1\|CNPJ#2\|dx` | 1.19 | -7.06 | 1 pdf-probe-pt | "CNPJ" \|dx\| 1.19 -> 7.06 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|invoice\|p1\|98.765.432/0001-21#1\|dx` | 1.2 | -7.04 | 1 pdf-probe-pt | "98.765.432/0001-21" \|dx\| 1.2 -> 7.04 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|invoice\|p1\|QTD.#1\|dx` | 1.21 | 4.42 | 1 pdf-probe-pt | "QTD." \|dx\| 1.21 -> 4.42 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|invoice\|p1\|40#1\|dx` | 1.2 | 4.42 | 1 pdf-probe-pt | "40" \|dx\| 1.2 -> 4.42 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|invoice\|p1\|25#1\|dx` | 1.2 | 4.42 | 1 pdf-probe-pt | "25" \|dx\| 1.2 -> 4.42 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|invoice\|p1\|18#1\|dx` | 1.2 | 4.42 | 1 pdf-probe-pt | "18" \|dx\| 1.2 -> 4.42 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|invoice\|p1\|60#1\|dx` | 1.2 | 4.42 | 1 pdf-probe-pt | "60" \|dx\| 1.2 -> 4.42 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|invoice\|p1\|120#1\|dx` | 1.2 | 4.43 | 1 pdf-probe-pt | "120" \|dx\| 1.2 -> 4.43 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|invoice\|p1\|30#1\|dx` | 1.2 | 4.42 | 1 pdf-probe-pt | "30" \|dx\| 1.2 -> 4.42 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|invoice\|p1\|22#1\|dx` | 1.2 | 4.42 | 1 pdf-probe-pt | "22" \|dx\| 1.2 -> 4.42 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|invoice\|p1\|44#1\|dx` | 1.2 | 4.42 | 1 pdf-probe-pt | "44" \|dx\| 1.2 -> 4.42 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|invoice\|p1\|12#2\|dx` | 1.2 | 4.42 | 1 pdf-probe-pt | "12" \|dx\| 1.2 -> 4.42 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|invoice\|p1\|24#1\|dx` | 1.2 | 4.42 | 1 pdf-probe-pt | "24" \|dx\| 1.2 -> 4.42 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|invoice\|p1\|8#1\|dx` | 1.21 | 4.42 | 1 pdf-probe-pt | "8" \|dx\| 1.21 -> 4.42 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|invoice\|p2\|QTD.#1\|dx` | 1.21 | 4.42 | 1 pdf-probe-pt | "QTD." \|dx\| 1.21 -> 4.42 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|invoice\|p2\|10#1\|dx` | 1.2 | 4.42 | 1 pdf-probe-pt | "10" \|dx\| 1.2 -> 4.42 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|invoice\|p2\|6#1\|dx` | 1.21 | 4.42 | 1 pdf-probe-pt | "6" \|dx\| 1.21 -> 4.42 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|invoice\|p2\|30#1\|dx` | 1.2 | 4.42 | 1 pdf-probe-pt | "30" \|dx\| 1.2 -> 4.42 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|invoice\|p2\|14#1\|dx` | 1.2 | 4.42 | 1 pdf-probe-pt | "14" \|dx\| 1.2 -> 4.42 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|invoice\|p2\|20#1\|dx` | 1.2 | 4.42 | 1 pdf-probe-pt | "20" \|dx\| 1.2 -> 4.42 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|invoice\|p2\|5#1\|dx` | 1.21 | 4.42 | 1 pdf-probe-pt | "5" \|dx\| 1.21 -> 4.42 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|invoice\|p2\|35#1\|dx` | 1.2 | 4.42 | 1 pdf-probe-pt | "35" \|dx\| 1.2 -> 4.42 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|invoice\|p2\|50#1\|dx` | 1.2 | 4.42 | 1 pdf-probe-pt | "50" \|dx\| 1.2 -> 4.42 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|invoice\|p2\|28#1\|dx` | 1.2 | 4.42 | 1 pdf-probe-pt | "28" \|dx\| 1.2 -> 4.42 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|invoice\|p2\|56#1\|dx` | 1.2 | 4.42 | 1 pdf-probe-pt | "56" \|dx\| 1.2 -> 4.42 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|invoice\|p2\|16#1\|dx` | 1.2 | 4.42 | 1 pdf-probe-pt | "16" \|dx\| 1.2 -> 4.42 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|invoice\|p2\|64#1\|dx` | 1.2 | 4.42 | 1 pdf-probe-pt | "64" \|dx\| 1.2 -> 4.42 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|invoice\|p2\|18#1\|dx` | 1.2 | 4.42 | 1 pdf-probe-pt | "18" \|dx\| 1.2 -> 4.42 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|invoice\|p2\|22#1\|dx` | 1.2 | 4.42 | 1 pdf-probe-pt | "22" \|dx\| 1.2 -> 4.42 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|invoice\|p2\|22#2\|dx` | 1.2 | 4.42 | 1 pdf-probe-pt | "22" \|dx\| 1.2 -> 4.42 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|invoice\|p2\|15#1\|dx` | 1.2 | 4.42 | 1 pdf-probe-pt | "15" \|dx\| 1.2 -> 4.42 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|invoice\|p2\|40#1\|dx` | 1.2 | 4.42 | 1 pdf-probe-pt | "40" \|dx\| 1.2 -> 4.42 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|invoice\|p2\|8#1\|dx` | 1.21 | 4.42 | 1 pdf-probe-pt | "8" \|dx\| 1.21 -> 4.42 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|invoice\|p3\|QTD.#1\|dx` | 1.21 | 4.42 | 1 pdf-probe-pt | "QTD." \|dx\| 1.21 -> 4.42 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|invoice\|p3\|30#1\|dx` | 1.2 | 4.42 | 1 pdf-probe-pt | "30" \|dx\| 1.2 -> 4.42 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|invoice\|p3\|12#1\|dx` | 1.2 | 4.42 | 1 pdf-probe-pt | "12" \|dx\| 1.2 -> 4.42 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|invoice\|p3\|5#1\|dx` | 1.21 | 4.42 | 1 pdf-probe-pt | "5" \|dx\| 1.21 -> 4.42 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|invoice\|p3\|1#1\|dx` | 1.21 | 4.42 | 1 pdf-probe-pt | "1" \|dx\| 1.21 -> 4.42 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|invoice\|p3\|2#1\|dx` | 1.21 | 4.42 | 1 pdf-probe-pt | "2" \|dx\| 1.21 -> 4.42 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|invoice\|p3\|Total#1\|dy` | 1.1 | -2.65 | 1 pdf-probe-pt | "Total" \|dy\| 1.1 -> 2.65 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|invoice\|p3\|a#1\|dy` | 1.1 | -2.65 | 1 pdf-probe-pt | "a" \|dy\| 1.1 -> 2.65 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|invoice\|p3\|pagar#1\|dy` | 1.1 | -2.65 | 1 pdf-probe-pt | "pagar" \|dy\| 1.1 -> 2.65 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|invoice\|p3\|R$#14\|dy` | 1.1 | -2.65 | 1 pdf-probe-pt | "R$" \|dy\| 1.1 -> 2.65 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|invoice\|p3\|50.724,90#1\|dy` | 1.1 | -2.65 | 1 pdf-probe-pt | "50.724,90" \|dy\| 1.1 -> 2.65 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|notification\|p1\|Permanecendo#1\|dy` | -0.15 | 4.85 | 1 pdf-probe-pt | "Permanecendo" \|dy\| 0.15 -> 4.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|notification\|p1\|a#4\|dy` | -0.15 | 4.85 | 1 pdf-probe-pt | "a" \|dy\| 0.15 -> 4.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|notification\|p1\|situação#1\|dy` | -0.15 | 4.85 | 1 pdf-probe-pt | "situação" \|dy\| 0.15 -> 4.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|notification\|p1\|sem#1\|dy` | -0.15 | 4.85 | 1 pdf-probe-pt | "sem" \|dy\| 0.15 -> 4.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|notification\|p1\|a#5\|dy` | -0.15 | 4.85 | 1 pdf-probe-pt | "a" \|dy\| 0.15 -> 4.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|notification\|p1\|devida#1\|dy` | -0.15 | 4.85 | 1 pdf-probe-pt | "devida" \|dy\| 0.15 -> 4.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|notification\|p1\|regularização#3\|dy` | -0.15 | 4.85 | 1 pdf-probe-pt | "regularização" \|dy\| 0.15 -> 4.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|notification\|p1\|após#1\|dy` | -0.15 | 4.85 | 1 pdf-probe-pt | "após" \|dy\| 0.15 -> 4.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|notification\|p1\|o#2\|dy` | -0.15 | 4.85 | 1 pdf-probe-pt | "o" \|dy\| 0.15 -> 4.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|notification\|p1\|prazo#2\|dy` | -0.15 | 4.85 | 1 pdf-probe-pt | "prazo" \|dy\| 0.15 -> 4.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|notification\|p1\|acima#1\|dy` | -0.15 | 4.85 | 1 pdf-probe-pt | "acima" \|dy\| 0.15 -> 4.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|notification\|p1\|indicado,#1\|dy` | -0.15 | 4.85 | 1 pdf-probe-pt | "indicado," \|dy\| 0.15 -> 4.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|notification\|p1\|informamos#1\|dy` | -0.15 | 4.85 | 1 pdf-probe-pt | "informamos" \|dy\| 0.15 -> 4.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|notification\|p1\|que#1\|dy` | -0.15 | 4.85 | 1 pdf-probe-pt | "que" \|dy\| 0.15 -> 4.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|notification\|p1\|serão#1\|dy` | -0.15 | 4.85 | 1 pdf-probe-pt | "serão" \|dy\| 0.15 -> 4.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|notification\|p1\|adotadas#1\|dy` | -0.15 | 4.85 | 1 pdf-probe-pt | "adotadas" \|dy\| 0.15 -> 4.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|notification\|p1\|as#2\|dy` | -0.15 | 4.85 | 1 pdf-probe-pt | "as" \|dy\| 0.15 -> 4.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|notification\|p1\|providências#1\|dy` | -0.15 | 4.85 | 1 pdf-probe-pt | "providências" \|dy\| 0.15 -> 4.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|notification\|p1\|cabíveis#1\|dy` | -0.15 | 4.85 | 1 pdf-probe-pt | "cabíveis" \|dy\| 0.15 -> 4.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|notification\|p1\|previstas#1\|dy` | -0.15 | 4.85 | 1 pdf-probe-pt | "previstas" \|dy\| 0.15 -> 4.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|notification\|p1\|em#5\|dy` | -0.15 | 4.85 | 1 pdf-probe-pt | "em" \|dy\| 0.15 -> 4.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|notification\|p1\|contrato#2\|dy` | -0.15 | 4.85 | 1 pdf-probe-pt | "contrato" \|dy\| 0.15 -> 4.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|notification\|p1\|e#2\|dy` | -0.15 | 4.85 | 1 pdf-probe-pt | "e" \|dy\| 0.15 -> 4.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|notification\|p1\|na#2\|dy` | -0.15 | 4.85 | 1 pdf-probe-pt | "na" \|dy\| 0.15 -> 4.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|notification\|p1\|legislação#1\|dy` | -0.15 | 4.85 | 1 pdf-probe-pt | "legislação" \|dy\| 0.15 -> 4.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|notification\|p1\|aplicável,#1\|dy` | -0.15 | 4.85 | 1 pdf-probe-pt | "aplicável," \|dy\| 0.15 -> 4.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|notification\|p1\|sem#2\|dy` | -0.15 | 4.85 | 1 pdf-probe-pt | "sem" \|dy\| 0.15 -> 4.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|notification\|p1\|prejuízo#1\|dy` | -0.15 | 4.85 | 1 pdf-probe-pt | "prejuízo" \|dy\| 0.15 -> 4.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|notification\|p1\|de#7\|dy` | -0.15 | 4.85 | 1 pdf-probe-pt | "de" \|dy\| 0.15 -> 4.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|notification\|p1\|quaisquer#1\|dy` | -0.15 | 4.85 | 1 pdf-probe-pt | "quaisquer" \|dy\| 0.15 -> 4.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|notification\|p1\|outras#1\|dy` | -0.15 | 4.85 | 1 pdf-probe-pt | "outras" \|dy\| 0.15 -> 4.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|notification\|p1\|medidas.#1\|dy` | -0.15 | 4.85 | 1 pdf-probe-pt | "medidas." \|dy\| 0.15 -> 4.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|notification\|p1\|Em#1\|dy` | -0.15 | 4.85 | 1 pdf-probe-pt | "Em" \|dy\| 0.15 -> 4.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|notification\|p1\|caso#1\|dy` | -0.15 | 4.85 | 1 pdf-probe-pt | "caso" \|dy\| 0.15 -> 4.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|notification\|p1\|de#8\|dy` | -0.15 | 4.85 | 1 pdf-probe-pt | "de" \|dy\| 0.15 -> 4.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|notification\|p1\|pagamento#1\|dy` | -0.15 | 4.85 | 1 pdf-probe-pt | "pagamento" \|dy\| 0.15 -> 4.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|notification\|p1\|já#1\|dy` | -0.15 | 4.85 | 1 pdf-probe-pt | "já" \|dy\| 0.15 -> 4.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|notification\|p1\|efetuado,#1\|dy` | -0.15 | 4.85 | 1 pdf-probe-pt | "efetuado," \|dy\| 0.15 -> 4.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|notification\|p1\|favor#1\|dy` | -0.15 | 4.85 | 1 pdf-probe-pt | "favor" \|dy\| 0.15 -> 4.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|notification\|p1\|desconsiderar#1\|dy` | -0.15 | 4.85 | 1 pdf-probe-pt | "desconsiderar" \|dy\| 0.15 -> 4.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|notification\|p1\|esta#1\|dy` | -0.15 | 4.85 | 1 pdf-probe-pt | "esta" \|dy\| 0.15 -> 4.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|notification\|p1\|comunicação#1\|dy` | -0.15 | 4.85 | 1 pdf-probe-pt | "comunicação" \|dy\| 0.15 -> 4.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|notification\|p1\|e#3\|dy` | -0.15 | 4.85 | 1 pdf-probe-pt | "e" \|dy\| 0.15 -> 4.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|notification\|p1\|encaminhar#1\|dy` | -0.15 | 4.85 | 1 pdf-probe-pt | "encaminhar" \|dy\| 0.15 -> 4.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|notification\|p1\|o#3\|dy` | -0.15 | 4.85 | 1 pdf-probe-pt | "o" \|dy\| 0.15 -> 4.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|notification\|p1\|respectivo#1\|dy` | -0.15 | 4.85 | 1 pdf-probe-pt | "respectivo" \|dy\| 0.15 -> 4.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|notification\|p1\|comprovante#1\|dy` | -0.15 | 4.85 | 1 pdf-probe-pt | "comprovante" \|dy\| 0.15 -> 4.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|notification\|p1\|para#2\|dy` | -0.15 | 4.85 | 1 pdf-probe-pt | "para" \|dy\| 0.15 -> 4.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|notification\|p1\|cobranca@exemplo-acme.test.#1\|dy` | -0.15 | 4.85 | 1 pdf-probe-pt | "cobranca@exemplo-acme.test." \|dy\| 0.15 -> 4.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|notification\|p1\|Segue,#1\|dy` | 0.35 | 4.85 | 1 pdf-probe-pt | "Segue," \|dy\| 0.35 -> 4.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|notification\|p1\|em#6\|dy` | 0.35 | 4.85 | 1 pdf-probe-pt | "em" \|dy\| 0.35 -> 4.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|notification\|p1\|anexo,#1\|dy` | 0.35 | 4.85 | 1 pdf-probe-pt | "anexo," \|dy\| 0.35 -> 4.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|notification\|p1\|demonstrativo#1\|dy` | 0.35 | 4.85 | 1 pdf-probe-pt | "demonstrativo" \|dy\| 0.35 -> 4.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|notification\|p1\|detalhado#1\|dy` | 0.35 | 4.85 | 1 pdf-probe-pt | "detalhado" \|dy\| 0.35 -> 4.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|notification\|p1\|do#2\|dy` | 0.35 | 4.85 | 1 pdf-probe-pt | "do" \|dy\| 0.35 -> 4.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|notification\|p1\|débito#1\|dy` | 0.35 | 4.85 | 1 pdf-probe-pt | "débito" \|dy\| 0.35 -> 4.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|notification\|p1\|para#3\|dy` | 0.35 | 4.85 | 1 pdf-probe-pt | "para" \|dy\| 0.35 -> 4.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|notification\|p1\|sua#1\|dy` | 0.35 | 4.85 | 1 pdf-probe-pt | "sua" \|dy\| 0.35 -> 4.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|notification\|p1\|conferência.#1\|dy` | 0.35 | 4.85 | 1 pdf-probe-pt | "conferência." \|dy\| 0.35 -> 4.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|notification\|p1\|Sendo#1\|dy` | 0.1 | 4.85 | 1 pdf-probe-pt | "Sendo" \|dy\| 0.1 -> 4.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|notification\|p1\|o#4\|dy` | 0.1 | 4.85 | 1 pdf-probe-pt | "o" \|dy\| 0.1 -> 4.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|notification\|p1\|que#2\|dy` | 0.1 | 4.85 | 1 pdf-probe-pt | "que" \|dy\| 0.1 -> 4.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|notification\|p1\|se#1\|dy` | 0.1 | 4.85 | 1 pdf-probe-pt | "se" \|dy\| 0.1 -> 4.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|notification\|p1\|apresenta#1\|dy` | 0.1 | 4.85 | 1 pdf-probe-pt | "apresenta" \|dy\| 0.1 -> 4.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|notification\|p1\|para#4\|dy` | 0.1 | 4.85 | 1 pdf-probe-pt | "para" \|dy\| 0.1 -> 4.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|notification\|p1\|o#5\|dy` | 0.1 | 4.85 | 1 pdf-probe-pt | "o" \|dy\| 0.1 -> 4.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|notification\|p1\|momento,#1\|dy` | 0.1 | 4.85 | 1 pdf-probe-pt | "momento," \|dy\| 0.1 -> 4.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|notification\|p1\|colocamo-nos#1\|dy` | 0.1 | 4.85 | 1 pdf-probe-pt | "colocamo-nos" \|dy\| 0.1 -> 4.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|notification\|p1\|à#2\|dy` | 0.1 | 4.85 | 1 pdf-probe-pt | "à" \|dy\| 0.1 -> 4.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|notification\|p1\|disposição#1\|dy` | 0.1 | 4.85 | 1 pdf-probe-pt | "disposição" \|dy\| 0.1 -> 4.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|notification\|p1\|para#5\|dy` | 0.1 | 4.85 | 1 pdf-probe-pt | "para" \|dy\| 0.1 -> 4.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|notification\|p1\|os#2\|dy` | 0.1 | 4.85 | 1 pdf-probe-pt | "os" \|dy\| 0.1 -> 4.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|notification\|p1\|esclarecimentos#1\|dy` | 0.1 | 4.85 | 1 pdf-probe-pt | "esclarecimentos" \|dy\| 0.1 -> 4.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|notification\|p1\|que#3\|dy` | 0.1 | 4.85 | 1 pdf-probe-pt | "que" \|dy\| 0.1 -> 4.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|notification\|p1\|se#2\|dy` | 0.1 | 4.85 | 1 pdf-probe-pt | "se" \|dy\| 0.1 -> 4.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|notification\|p1\|fizerem#1\|dy` | 0.1 | 4.85 | 1 pdf-probe-pt | "fizerem" \|dy\| 0.1 -> 4.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|notification\|p1\|necessários.#1\|dy` | 0.1 | 4.85 | 1 pdf-probe-pt | "necessários." \|dy\| 0.1 -> 4.85 pt vs Chrome (baseline) |

### WPT / crashtest regressions (56)

| group | key | before | after | tolerance | detail |
|---|---|---|---|---|---|
| wpt css/CSS2/abspos | `wpt\|css/CSS2/abspos/between-float-and-text.html` | pass | fail |  | pass -> fail (clean pass lost) |
| wpt css/CSS2/floats-clear | `wpt\|css/CSS2/floats-clear/clear-applies-to-009.xht` | pass | fail |  | pass -> fail (clean pass lost) |
| wpt css/CSS2/floats-clear | `wpt\|css/CSS2/floats-clear/clear-float-005.xht` | pass | fail |  | pass -> fail (clean pass lost) |
| wpt css/CSS2/floats-clear | `wpt\|css/CSS2/floats-clear/floats-153.xht` | pass | fail |  | pass -> fail (clean pass lost) |
| wpt css/CSS2/floats | `wpt\|css/CSS2/floats/float-in-inline-anonymous-block-with-overflow-hidden.html` | pass | fail |  | pass -> fail (clean pass lost) |
| wpt css/CSS2/floats | `wpt\|css/CSS2/floats/float-nowrap-2.html` | pass | fail |  | pass -> fail (clean pass lost) |
| wpt css/CSS2/floats | `wpt\|css/CSS2/floats/float-nowrap-8.html` | pass | fail |  | pass -> fail (clean pass lost) |
| wpt css/CSS2/floats | `wpt\|css/CSS2/floats/floats-placement-vertical-001a.xht` | pass | fail |  | pass -> fail (clean pass lost) |
| wpt css/CSS2/floats | `wpt\|css/CSS2/floats/floats-placement-vertical-003.xht` | pass | fail |  | pass -> fail (clean pass lost) |
| wpt css/CSS2/floats | `wpt\|css/CSS2/floats/zero-width-floats.html` | pass | fail |  | pass -> fail (clean pass lost) |
| wpt css/CSS2/generated-content | `wpt\|css/CSS2/generated-content/after-content-display-012.xht` | pass | fail |  | pass -> fail (clean pass lost) |
| wpt css/CSS2/generated-content | `wpt\|css/CSS2/generated-content/after-content-display-013.xht` | pass | fail |  | pass -> fail (clean pass lost) |
| wpt css/CSS2/generated-content | `wpt\|css/CSS2/generated-content/before-content-display-012.xht` | pass | fail |  | pass -> fail (clean pass lost) |
| wpt css/CSS2/generated-content | `wpt\|css/CSS2/generated-content/before-content-display-013.xht` | pass | fail |  | pass -> fail (clean pass lost) |
| wpt css/CSS2/linebox | `wpt\|css/CSS2/linebox/baseline-block-with-overflow-001.html` | pass | fail |  | pass -> fail (clean pass lost) |
| wpt css/CSS2/linebox | `wpt\|css/CSS2/linebox/line-height-061.xht` | pass | fail |  | pass -> fail (clean pass lost) |
| wpt css/CSS2/linebox | `wpt\|css/CSS2/linebox/line-height-062.xht` | pass | fail |  | pass -> fail (clean pass lost) |
| wpt css/CSS2/normal-flow | `wpt\|css/CSS2/normal-flow/block-in-inline-float-between-001.xht` | pass | fail |  | pass -> fail (clean pass lost) |
| wpt css/CSS2/normal-flow | `wpt\|css/CSS2/normal-flow/height-061.xht` | pass | fail |  | pass -> fail (clean pass lost) |
| wpt css/CSS2/normal-flow | `wpt\|css/CSS2/normal-flow/height-062.xht` | pass | fail |  | pass -> fail (clean pass lost) |
| wpt css/CSS2/normal-flow | `wpt\|css/CSS2/normal-flow/height-072.xht` | pass | fail |  | pass -> fail (clean pass lost) |
| wpt css/CSS2/normal-flow | `wpt\|css/CSS2/normal-flow/height-073.xht` | pass | fail |  | pass -> fail (clean pass lost) |
| wpt css/CSS2/normal-flow | `wpt\|css/CSS2/normal-flow/inline-table-zorder-001.xht` | pass | fail |  | pass -> fail (clean pass lost) |
| wpt css/CSS2/normal-flow | `wpt\|css/CSS2/normal-flow/max-height-061.xht` | pass | fail |  | pass -> fail (clean pass lost) |
| wpt css/CSS2/normal-flow | `wpt\|css/CSS2/normal-flow/max-height-062.xht` | pass | fail |  | pass -> fail (clean pass lost) |
| wpt css/CSS2/normal-flow | `wpt\|css/CSS2/normal-flow/max-height-072.xht` | pass | fail |  | pass -> fail (clean pass lost) |
| wpt css/CSS2/normal-flow | `wpt\|css/CSS2/normal-flow/max-height-073.xht` | pass | fail |  | pass -> fail (clean pass lost) |
| wpt css/CSS2/normal-flow | `wpt\|css/CSS2/normal-flow/min-height-061.xht` | pass | fail |  | pass -> fail (clean pass lost) |
| wpt css/CSS2/normal-flow | `wpt\|css/CSS2/normal-flow/min-height-062.xht` | pass | fail |  | pass -> fail (clean pass lost) |
| wpt css/CSS2/normal-flow | `wpt\|css/CSS2/normal-flow/min-height-072.xht` | pass | fail |  | pass -> fail (clean pass lost) |
| wpt css/CSS2/normal-flow | `wpt\|css/CSS2/normal-flow/min-height-073.xht` | pass | fail |  | pass -> fail (clean pass lost) |
| wpt css/CSS2/visuren | `wpt\|css/CSS2/visuren/float-inside-inline-between-blocks-1.html` | pass | fail |  | pass -> fail (clean pass lost) |
| wpt css/css-break | `wpt\|css/css-break/flexbox/flex-fragmented-with-float-descendant-001.html` | pass | fail |  | pass -> fail (clean pass lost) |
| wpt css/css-break | `wpt\|css/css-break/flexbox/multi-line-column-flex-fragmentation-054.html` | pass | fail |  | pass -> fail (clean pass lost) |
| wpt css/css-break | `wpt\|css/css-break/flexbox/multi-line-column-flex-fragmentation-055.html` | pass | fail |  | pass -> fail (clean pass lost) |
| wpt css/css-break | `wpt\|css/css-break/flexbox/multi-line-column-flex-fragmentation-058.html` | pass | fail |  | pass -> fail (clean pass lost) |
| wpt css/css-break | `wpt\|css/css-break/ruby-003.html` | pass | fail |  | pass -> fail (clean pass lost) |
| wpt css/css-page | `wpt\|css/css-page/layers-003-print.html` | fail | unsupported |  | fail -> unsupported (new strict-gate rejection, feature not recorded) |
| wpt css/css-page | `wpt\|css/css-page/layers-004-print.html` | fail | unsupported |  | fail -> unsupported (new strict-gate rejection, feature not recorded) |
| wpt css/css-page | `wpt\|css/css-page/monolithic-overflow-014-print.html` | pass | fail |  | pass -> fail (clean pass lost) |
| wpt css/css-page | `wpt\|css/css-page/page-margin-007-print.html` | fail | unsupported |  | fail -> unsupported (new strict-gate rejection, feature not recorded) |
| wpt css/css-page | `wpt\|css/css-page/page-size-004-print.html` | fail | unsupported |  | fail -> unsupported (new strict-gate rejection, feature not recorded) |
| wpt css/css-page | `wpt\|css/css-page/page-size-005-print.html` | fail | unsupported |  | fail -> unsupported (new strict-gate rejection, feature not recorded) |
| wpt css/css-page | `wpt\|css/css-page/page-size-009-print.html` | fail | unsupported |  | fail -> unsupported (new strict-gate rejection, feature not recorded) |
| wpt css/css-page | `wpt\|css/css-page/pseudo-first-margin-001-print.html` | fail | unsupported |  | fail -> unsupported (new strict-gate rejection, feature not recorded) |
| wpt css/css-page | `wpt\|css/css-page/pseudo-first-margin-002-print.html` | fail | unsupported |  | fail -> unsupported (new strict-gate rejection, feature not recorded) |
| wpt css/css-page | `wpt\|css/css-page/pseudo-first-margin-003-print.html` | fail | unsupported |  | fail -> unsupported (new strict-gate rejection, feature not recorded) |
| wpt css/css-page | `wpt\|css/css-page/pseudo-first-margin-004-print.html` | fail | unsupported |  | fail -> unsupported (new strict-gate rejection, feature not recorded) |
| wpt css/css-text | `wpt\|css/css-text/hanging-punctuation/hanging-punctuation-first-002.html` | pass | fail |  | pass -> fail (clean pass lost) |
| wpt css/css-text | `wpt\|css/css-text/tab-size/tab-size-integer-001.html` | pass | fail |  | pass -> fail (clean pass lost) |
| wpt css/css-text | `wpt\|css/css-text/tab-size/tab-size-integer-002.html` | pass | fail |  | pass -> fail (clean pass lost) |
| wpt css/css-text | `wpt\|css/css-text/tab-size/tab-size-integer-003.html` | pass | fail |  | pass -> fail (clean pass lost) |
| wpt css/css-text | `wpt\|css/css-text/text-align/text-align-end-006.html` | pass | fail |  | pass -> fail (clean pass lost) |
| wpt css/css-text | `wpt\|css/css-text/text-justify/text-justify-and-trailing-spaces-003.html` | pass | fail |  | pass -> fail (clean pass lost) |
| wpt css/css-text | `wpt\|css/css-text/text-justify/text-justify-and-trailing-spaces-004.html` | pass | fail |  | pass -> fail (clean pass lost) |
| wpt css/css-text | `wpt\|css/css-text/white-space/text-wrap-balance-text-indent-001.html` | pass | fail |  | pass -> fail (clean pass lost) |

## Accepted regressions (acceptedRegressions, with evidence)

none

## Declared strict-gate rejections (declaredRejections, 0)

none

## Reported, not gating (98)

| group | key | before | after | tolerance | detail |
|---|---|---|---|---|---|
| wpt css/CSS2/backgrounds | `wpt\|css/CSS2/backgrounds/background-002.xht` | pass | fail |  | pass[css-url-resource,ink-missing-vs-chrome] -> fail (flagged pass: reported, not gated) |
| wpt css/CSS2/backgrounds | `wpt\|css/CSS2/backgrounds/background-003.xht` | pass | fail |  | pass[css-url-resource,ink-missing-vs-chrome] -> fail (flagged pass: reported, not gated) |
| wpt css/CSS2/backgrounds | `wpt\|css/CSS2/backgrounds/background-090.xht` | pass | fail |  | pass[css-url-resource] -> fail (flagged pass: reported, not gated) |
| wpt css/CSS2/backgrounds | `wpt\|css/CSS2/backgrounds/background-093.xht` | pass | fail |  | pass[css-url-resource] -> fail (flagged pass: reported, not gated) |
| wpt css/CSS2/backgrounds | `wpt\|css/CSS2/backgrounds/background-096.xht` | pass | fail |  | pass[css-url-resource] -> fail (flagged pass: reported, not gated) |
| wpt css/CSS2/backgrounds | `wpt\|css/CSS2/backgrounds/background-104.xht` | pass | fail |  | pass[css-url-resource] -> fail (flagged pass: reported, not gated) |
| wpt css/CSS2/backgrounds | `wpt\|css/CSS2/backgrounds/background-106.xht` | pass | fail |  | pass[css-url-resource] -> fail (flagged pass: reported, not gated) |
| wpt css/CSS2/backgrounds | `wpt\|css/CSS2/backgrounds/background-111.xht` | pass | fail |  | pass[css-url-resource] -> fail (flagged pass: reported, not gated) |
| wpt css/CSS2/backgrounds | `wpt\|css/CSS2/backgrounds/background-114.xht` | pass | fail |  | pass[css-url-resource] -> fail (flagged pass: reported, not gated) |
| wpt css/CSS2/backgrounds | `wpt\|css/CSS2/backgrounds/background-117.xht` | pass | fail |  | pass[css-url-resource] -> fail (flagged pass: reported, not gated) |
| wpt css/CSS2/backgrounds | `wpt\|css/CSS2/backgrounds/background-120.xht` | pass | fail |  | pass[css-url-resource] -> fail (flagged pass: reported, not gated) |
| wpt css/CSS2/backgrounds | `wpt\|css/CSS2/backgrounds/background-128.xht` | pass | fail |  | pass[css-url-resource] -> fail (flagged pass: reported, not gated) |
| wpt css/CSS2/backgrounds | `wpt\|css/CSS2/backgrounds/background-130.xht` | pass | fail |  | pass[css-url-resource] -> fail (flagged pass: reported, not gated) |
| wpt css/CSS2/backgrounds | `wpt\|css/CSS2/backgrounds/background-135.xht` | pass | fail |  | pass[css-url-resource] -> fail (flagged pass: reported, not gated) |
| wpt css/CSS2/backgrounds | `wpt\|css/CSS2/backgrounds/background-138.xht` | pass | fail |  | pass[css-url-resource] -> fail (flagged pass: reported, not gated) |
| wpt css/CSS2/backgrounds | `wpt\|css/CSS2/backgrounds/background-141.xht` | pass | fail |  | pass[css-url-resource] -> fail (flagged pass: reported, not gated) |
| wpt css/CSS2/backgrounds | `wpt\|css/CSS2/backgrounds/background-144.xht` | pass | fail |  | pass[css-url-resource] -> fail (flagged pass: reported, not gated) |
| wpt css/CSS2/backgrounds | `wpt\|css/CSS2/backgrounds/background-152.xht` | pass | fail |  | pass[css-url-resource] -> fail (flagged pass: reported, not gated) |
| wpt css/CSS2/backgrounds | `wpt\|css/CSS2/backgrounds/background-154.xht` | pass | fail |  | pass[css-url-resource] -> fail (flagged pass: reported, not gated) |
| wpt css/CSS2/backgrounds | `wpt\|css/CSS2/backgrounds/background-184.xht` | pass | fail |  | pass[css-url-resource] -> fail (flagged pass: reported, not gated) |
| wpt css/CSS2/backgrounds | `wpt\|css/CSS2/backgrounds/background-188.xht` | pass | fail |  | pass[css-url-resource] -> fail (flagged pass: reported, not gated) |
| wpt css/CSS2/backgrounds | `wpt\|css/CSS2/backgrounds/background-190.xht` | pass | fail |  | pass[css-url-resource] -> fail (flagged pass: reported, not gated) |
| wpt css/CSS2/backgrounds | `wpt\|css/CSS2/backgrounds/background-194.xht` | pass | fail |  | pass[css-url-resource] -> fail (flagged pass: reported, not gated) |
| wpt css/CSS2/backgrounds | `wpt\|css/CSS2/backgrounds/background-196.xht` | pass | fail |  | pass[css-url-resource] -> fail (flagged pass: reported, not gated) |
| wpt css/CSS2/backgrounds | `wpt\|css/CSS2/backgrounds/background-attachment-applies-to-007.xht` | pass | fail |  | pass[css-url-resource] -> fail (flagged pass: reported, not gated) |
| wpt css/CSS2/backgrounds | `wpt\|css/CSS2/backgrounds/background-attachment-applies-to-009.xht` | pass | fail |  | pass[css-url-resource] -> fail (flagged pass: reported, not gated) |
| wpt css/CSS2/backgrounds | `wpt\|css/CSS2/backgrounds/background-attachment-applies-to-012.xht` | pass | fail |  | pass[css-url-resource] -> fail (flagged pass: reported, not gated) |
| wpt css/CSS2/backgrounds | `wpt\|css/CSS2/backgrounds/background-attachment-applies-to-013.xht` | pass | fail |  | pass[css-url-resource] -> fail (flagged pass: reported, not gated) |
| wpt css/CSS2/backgrounds | `wpt\|css/CSS2/backgrounds/background-attachment-applies-to-014.xht` | pass | fail |  | pass[css-url-resource] -> fail (flagged pass: reported, not gated) |
| wpt css/CSS2/backgrounds | `wpt\|css/CSS2/backgrounds/background-image-cover-002.xht` | pass | fail |  | pass[css-url-resource,ink-missing-vs-chrome] -> fail (flagged pass: reported, not gated) |
| wpt css/CSS2/backgrounds | `wpt\|css/CSS2/backgrounds/background-image-cover-004.xht` | pass | fail |  | pass[css-url-resource,ink-missing-vs-chrome] -> fail (flagged pass: reported, not gated) |
| wpt css/CSS2/backgrounds | `wpt\|css/CSS2/backgrounds/background-image-cover-attachment-001.xht` | pass | fail |  | pass[css-url-resource,ink-missing-vs-chrome] -> fail (flagged pass: reported, not gated) |
| wpt css/CSS2/backgrounds | `wpt\|css/CSS2/backgrounds/background-repeat-001.xht` | pass | fail |  | pass[css-url-resource,ink-missing-vs-chrome] -> fail (flagged pass: reported, not gated) |
| wpt css/CSS2/backgrounds | `wpt\|css/CSS2/backgrounds/background-repeat-002.xht` | pass | fail |  | pass[css-url-resource] -> fail (flagged pass: reported, not gated) |
| wpt css/CSS2/backgrounds | `wpt\|css/CSS2/backgrounds/background-repeat-003.xht` | pass | fail |  | pass[css-url-resource] -> fail (flagged pass: reported, not gated) |
| wpt css/CSS2/backgrounds | `wpt\|css/CSS2/backgrounds/background-repeat-005.xht` | pass | fail |  | pass[css-url-resource] -> fail (flagged pass: reported, not gated) |
| wpt css/CSS2/floats-clear | `wpt\|css/CSS2/floats-clear/clear-002.xht` | pass | fail |  | pass[ink-displaced-vs-chrome] -> fail (flagged pass: reported, not gated) |
| wpt css/CSS2/normal-flow | `wpt\|css/CSS2/normal-flow/height-applies-to-004.xht` | pass | fail |  | pass[ink-missing-vs-chrome] -> fail (flagged pass: reported, not gated) |
| wpt css/CSS2/normal-flow | `wpt\|css/CSS2/normal-flow/height-percentage-003.xht` | pass | fail |  | pass[ink-missing-vs-chrome] -> fail (flagged pass: reported, not gated) |
| wpt css/CSS2/positioning | `wpt\|css/CSS2/positioning/position-relative-nested-001.xht` | pass | fail |  | pass[css-url-resource] -> fail (flagged pass: reported, not gated) |
| wpt css/CSS2/visudet | `wpt\|css/CSS2/visudet/content-height-004.html` | pass | fail |  | pass[webfont-not-supplied,ink-missing-vs-chrome] -> fail (flagged pass: reported, not gated) |
| wpt css/CSS2/visudet | `wpt\|css/CSS2/visudet/line-height-205.html` | pass | fail |  | pass[webfont-not-supplied] -> fail (flagged pass: reported, not gated) |
| wpt css/css-page | `wpt\|css/css-page/page-name-001-print.html` | pass | fail |  | pass[ink-missing-vs-chrome] -> fail (flagged pass: reported, not gated) |
| wpt css/css-page | `wpt\|css/css-page/page-name-orthogonal-writing-002-print.html` | pass | fail |  | pass[ink-displaced-vs-chrome] -> fail (flagged pass: reported, not gated) |
| wpt css/css-text | `wpt\|css/css-text/letter-spacing/letter-spacing-ligatures-002.html` | pass | fail |  | pass[webfont-not-supplied,ink-displaced-vs-chrome] -> fail (flagged pass: reported, not gated) |
| wpt css/css-text | `wpt\|css/css-text/line-break/line-break-loose-011.xht` | pass | fail |  | pass[uncovered-glyphs,webfont-not-supplied,ink-missing-vs-chrome] -> fail (flagged pass: reported, not gated) |
| wpt css/css-text | `wpt\|css/css-text/line-break/line-break-loose-012.xht` | pass | fail |  | pass[uncovered-glyphs,webfont-not-supplied,ink-missing-vs-chrome] -> fail (flagged pass: reported, not gated) |
| wpt css/css-text | `wpt\|css/css-text/line-break/line-break-loose-013.xht` | pass | fail |  | pass[uncovered-glyphs,webfont-not-supplied,ink-missing-vs-chrome] -> fail (flagged pass: reported, not gated) |
| wpt css/css-text | `wpt\|css/css-text/line-break/line-break-loose-014.xht` | pass | fail |  | pass[uncovered-glyphs,webfont-not-supplied,ink-missing-vs-chrome] -> fail (flagged pass: reported, not gated) |
| wpt css/css-text | `wpt\|css/css-text/line-break/line-break-loose-015.xht` | pass | fail |  | pass[uncovered-glyphs,webfont-not-supplied,ink-missing-vs-chrome] -> fail (flagged pass: reported, not gated) |
| wpt css/css-text | `wpt\|css/css-text/line-break/line-break-loose-016a.xht` | pass | fail |  | pass[uncovered-glyphs,webfont-not-supplied,ink-missing-vs-chrome] -> fail (flagged pass: reported, not gated) |
| wpt css/css-text | `wpt\|css/css-text/line-break/line-break-loose-016b.xht` | pass | fail |  | pass[uncovered-glyphs,webfont-not-supplied,ink-missing-vs-chrome] -> fail (flagged pass: reported, not gated) |
| wpt css/css-text | `wpt\|css/css-text/line-break/line-break-loose-017a.xht` | pass | fail |  | pass[uncovered-glyphs,webfont-not-supplied,ink-missing-vs-chrome] -> fail (flagged pass: reported, not gated) |
| wpt css/css-text | `wpt\|css/css-text/line-break/line-break-loose-017b.xht` | pass | fail |  | pass[uncovered-glyphs,webfont-not-supplied,ink-missing-vs-chrome] -> fail (flagged pass: reported, not gated) |
| wpt css/css-text | `wpt\|css/css-text/line-break/line-break-loose-018.xht` | pass | fail |  | pass[uncovered-glyphs,webfont-not-supplied,ink-missing-vs-chrome] -> fail (flagged pass: reported, not gated) |
| wpt css/css-text | `wpt\|css/css-text/line-break/line-break-normal-011.xht` | pass | fail |  | pass[uncovered-glyphs,webfont-not-supplied,ink-missing-vs-chrome] -> fail (flagged pass: reported, not gated) |
| wpt css/css-text | `wpt\|css/css-text/line-break/line-break-normal-012.xht` | pass | fail |  | pass[uncovered-glyphs,webfont-not-supplied,ink-missing-vs-chrome] -> fail (flagged pass: reported, not gated) |
| wpt css/css-text | `wpt\|css/css-text/line-break/line-break-normal-013.xht` | pass | fail |  | pass[uncovered-glyphs,webfont-not-supplied,ink-missing-vs-chrome] -> fail (flagged pass: reported, not gated) |
| wpt css/css-text | `wpt\|css/css-text/line-break/line-break-normal-014.xht` | pass | fail |  | pass[uncovered-glyphs,webfont-not-supplied,ink-missing-vs-chrome] -> fail (flagged pass: reported, not gated) |
| wpt css/css-text | `wpt\|css/css-text/line-break/line-break-normal-015a.xht` | pass | fail |  | pass[uncovered-glyphs,webfont-not-supplied,ink-missing-vs-chrome] -> fail (flagged pass: reported, not gated) |
| … | 38 more in gate-report.json | | | | |

## Improvements (1792)

| group | key | before | after | tolerance | detail |
|---|---|---|---|---|---|
| corpus BOL-X | `boleto-febraban\|BOL-X1\|corpus\|\|criterion#1` | FAIL | PASS |  | 13/16 missing @linhaDigitavel.formatada, @titulo.nossoNumero (1/2×), @beneficiario.agenciaCodigo (1/2×) -> 16/16 |
| corpus BOL-X | `boleto-febraban\|BOL-X2\|corpus\|\|criterion#1` | FAIL | PASS |  | pdftotext 13/16; pypdf 16/16; pdfminer 16/16 -> pdftotext 16/16; pypdf 16/16; pdfminer 16/16 |
| corpus BOL-B | `boleto-febraban\|BOL-B2\|corpus\|\|criterion#1` | FAIL | PASS |  | DVs true, rebuilds barcode true, printed text found false -> DVs true, rebuilds barcode true, printed text found true |
| oracles:text EXT-2 | `boleto-febraban\|EXT-2\|oracles:text\|plain\|criterion#1` | FAIL | WARN |  | pdftotext fail (missing 8, extra 2); pdfminer.six warn (missing 0, extra 0); pymupdf fail (missing 8, extra 2) -> pdftotext pass (missing 0, extra 0); pdfminer.six warn (missing 0, extra 0); pymupdf pass (missing 0, extra 0) |
| corpus BOL-X | `boleto-febraban.px-grid\|BOL-X1\|corpus\|\|criterion#1` | FAIL | PASS |  | 13/16 missing @linhaDigitavel.formatada, @titulo.nossoNumero (1/2×), @beneficiario.agenciaCodigo (1/2×) -> 16/16 |
| corpus BOL-X | `boleto-febraban.px-grid\|BOL-X2\|corpus\|\|criterion#1` | FAIL | PASS |  | pdftotext 13/16; pypdf 16/16; pdfminer 16/16 -> pdftotext 16/16; pypdf 16/16; pdfminer 16/16 |
| corpus BOL-B | `boleto-febraban.px-grid\|BOL-B2\|corpus\|\|criterion#1` | FAIL | PASS |  | DVs true, rebuilds barcode true, printed text found false -> DVs true, rebuilds barcode true, printed text found true |
| oracles:text EXT-2 | `boleto-febraban.px-grid\|EXT-2\|oracles:text\|plain\|criterion#1` | FAIL | WARN |  | pdftotext fail (missing 8, extra 2); pdfminer.six warn (missing 0, extra 0); pymupdf fail (missing 8, extra 2) -> pdftotext pass (missing 0, extra 0); pdfminer.six warn (missing 0, extra 0); pymupdf pass (missing 0, extra 0) |
| corpus DANFE-X | `danfe\|DANFE-X1\|corpus\|\|criterion#1` | FAIL | PASS |  | 24/26 missing @chave.formatada, DESCRIÇÃO DO PRODUTO/SERVIÇO -> 26/26 |
| corpus DANFE-B | `danfe\|DANFE-B1\|corpus\|\|criterion#1` | FAIL | PASS |  | decodes false, validates false -> decodes true, validates true |
| corpus DANFE-B | `danfe\|DANFE-B3\|corpus\|\|criterion#1` | FAIL | PASS |  | 39.1583 (in [8, 14.8]) -> 10.0753 (in [8, 14.8]) |
| corpus DANFE-B | `danfe\|DANFE-B5\|corpus\|\|criterion#1` | FAIL | PASS |  | 0.5927 (min 2.65) -> 2.8787 (min 2.65) |
| oracles:text EXT-2 | `danfe\|EXT-2\|oracles:text\|plain\|criterion#1` | FAIL | WARN |  | pdftotext fail (missing 10, extra 5); pdfminer.six warn (missing 0, extra 0); pymupdf fail (missing 1, extra 1) -> pdftotext warn (missing 0, extra 0); pdfminer.six warn (missing 0, extra 0); pymupdf pass (missing 0, extra 0) |
| corpus INV-I | `oss-sparksuite-invoice\|INV-I1\|corpus\|\|criterion#1` | FAIL | PASS |  | 0 (expected >= 1) -> 1 (expected >= 1) |
| oracles:text EXT-2 | `receipt\|EXT-2\|oracles:text\|plain\|criterion#1` | WARN | PASS |  | pdftotext warn (missing 0, extra 0); pdfminer.six warn (missing 0, extra 0); pymupdf pass (missing 0, extra 0) -> pdftotext pass (missing 0, extra 0); pdfminer.six pass (missing 0, extra 0); pymupdf pass (missing 0, extra 0) |
| corpus TXT-R | `text-stress-ptbr\|TXT-R1\|corpus\|\|criterion#1` | FAIL | PASS |  | worst TXT-S4 11.24 mm (tol 1) -> worst TXT-S3 0.38 mm (tol 1) |
| oracles:text EXT-2 | `text-stress-ptbr\|EXT-2\|oracles:text\|plain\|criterion#1` | FAIL | WARN |  | pdftotext fail (missing 78, extra 48); pdfminer.six warn (missing 0, extra 9); pymupdf warn (missing 0, extra 9) -> pdftotext warn (missing 0, extra 9); pdfminer.six warn (missing 0, extra 9); pymupdf warn (missing 0, extra 9) |
| corpus BOL-X | `boleto-febraban\|BOL-X1\|corpus\|\|criterion#1\|found` | 13 | 16 | 0 count | 13 -> 16 |
| corpus BOL-X | `boleto-febraban\|BOL-X2\|corpus\|\|criterion#1\|found.pdftotext` | 13 | 16 | 0 count | 13 -> 16 |
| corpus BOL-B | `boleto-febraban\|BOL-B2\|corpus\|\|criterion#1\|printedTextFound` | 0 | 1 | 0 count | 0 -> 1 |
| corpus BOL-R | `boleto-febraban\|BOL-R1\|corpus\|\|criterion#1\|worstMm` | 88.36 | 1.82 | 0.1 position-mm | 88.36 -> 1.82 |
| oracles:text EXT-2 | `boleto-febraban\|EXT-2\|oracles:text\|plain\|criterion#1\|missing.pdftotext` | 8 | 0 | 0 count | 8 -> 0 |
| oracles:text EXT-2 | `boleto-febraban\|EXT-2\|oracles:text\|plain\|criterion#1\|extra.pdftotext` | 2 | 0 | 0 count | 2 -> 0 |
| oracles:text EXT-2 | `boleto-febraban\|EXT-2\|oracles:text\|plain\|criterion#1\|statusRank.pdftotext` | 1 | 3 | 0 count | 1 -> 3 |
| oracles:text EXT-2 | `boleto-febraban\|EXT-2\|oracles:text\|plain\|criterion#1\|missing.pymupdf` | 8 | 0 | 0 count | 8 -> 0 |
| oracles:text EXT-2 | `boleto-febraban\|EXT-2\|oracles:text\|plain\|criterion#1\|extra.pymupdf` | 2 | 0 | 0 count | 2 -> 0 |
| oracles:text EXT-2 | `boleto-febraban\|EXT-2\|oracles:text\|plain\|criterion#1\|statusRank.pymupdf` | 1 | 3 | 0 count | 1 -> 3 |
| oracles:layout REF-W | `boleto-febraban\|REF-W\|oracles:layout\|plain\|criterion#1\|maxMm` | 122.27 | 2.31 | 0.1 position-mm | 122.27 -> 2.31 |
| oracles:layout REF-W | `boleto-febraban\|REF-W\|oracles:layout\|plain\|criterion#1\|p95Mm` | 83.01 | 1.95 | 0.1 position-mm | 83.01 -> 1.95 |
| corpus BOL-X | `boleto-febraban.px-grid\|BOL-X1\|corpus\|\|criterion#1\|found` | 13 | 16 | 0 count | 13 -> 16 |
| corpus BOL-X | `boleto-febraban.px-grid\|BOL-X2\|corpus\|\|criterion#1\|found.pdftotext` | 13 | 16 | 0 count | 13 -> 16 |
| corpus BOL-B | `boleto-febraban.px-grid\|BOL-B2\|corpus\|\|criterion#1\|printedTextFound` | 0 | 1 | 0 count | 0 -> 1 |
| corpus BOL-R | `boleto-febraban.px-grid\|BOL-R1\|corpus\|\|criterion#1\|worstMm` | 88.36 | 1.82 | 0.1 position-mm | 88.36 -> 1.82 |
| oracles:text EXT-2 | `boleto-febraban.px-grid\|EXT-2\|oracles:text\|plain\|criterion#1\|missing.pdftotext` | 8 | 0 | 0 count | 8 -> 0 |
| oracles:text EXT-2 | `boleto-febraban.px-grid\|EXT-2\|oracles:text\|plain\|criterion#1\|extra.pdftotext` | 2 | 0 | 0 count | 2 -> 0 |
| oracles:text EXT-2 | `boleto-febraban.px-grid\|EXT-2\|oracles:text\|plain\|criterion#1\|statusRank.pdftotext` | 1 | 3 | 0 count | 1 -> 3 |
| oracles:text EXT-2 | `boleto-febraban.px-grid\|EXT-2\|oracles:text\|plain\|criterion#1\|missing.pymupdf` | 8 | 0 | 0 count | 8 -> 0 |
| oracles:text EXT-2 | `boleto-febraban.px-grid\|EXT-2\|oracles:text\|plain\|criterion#1\|extra.pymupdf` | 2 | 0 | 0 count | 2 -> 0 |
| oracles:text EXT-2 | `boleto-febraban.px-grid\|EXT-2\|oracles:text\|plain\|criterion#1\|statusRank.pymupdf` | 1 | 3 | 0 count | 1 -> 3 |
| oracles:layout REF-W | `boleto-febraban.px-grid\|REF-W\|oracles:layout\|plain\|criterion#1\|maxMm` | 122.27 | 2.31 | 0.1 position-mm | 122.27 -> 2.31 |
| oracles:layout REF-W | `boleto-febraban.px-grid\|REF-W\|oracles:layout\|plain\|criterion#1\|p95Mm` | 83.01 | 1.95 | 0.1 position-mm | 83.01 -> 1.95 |
| oracles:layout REF-W | `boleto\|REF-W\|oracles:layout\|plain\|criterion#1\|maxMm` | 15.15 | 2.62 | 0.1 position-mm | 15.15 -> 2.62 |
| oracles:layout REF-W | `boleto\|REF-W\|oracles:layout\|plain\|criterion#1\|p95Mm` | 15.03 | 2.36 | 0.1 position-mm | 15.03 -> 2.36 |
| corpus DANFE-X | `danfe\|DANFE-X1\|corpus\|\|criterion#1\|found` | 24 | 26 | 0 count | 24 -> 26 |
| corpus DANFE-X | `danfe\|DANFE-X2\|corpus\|\|criterion#1\|found.pdftotext` | 24 | 26 | 0 count | 24 -> 26 |
| corpus DANFE-B | `danfe\|DANFE-B1\|corpus\|\|criterion#1\|decodes` | 0 | 1 | 0 count | 0 -> 1 |
| corpus DANFE-B | `danfe\|DANFE-B1\|corpus\|\|criterion#1\|validates` | 0 | 1 | 0 count | 0 -> 1 |
| corpus DANFE-B | `danfe\|DANFE-B3\|corpus\|\|criterion#1\|excess` | 24.3583 | 0 | 0.05 geometry-excess-mm | 24.3583 -> 0 |
| corpus DANFE-B | `danfe\|DANFE-B5\|corpus\|\|criterion#1\|excess` | 2.0573 | 0 | 0.05 geometry-excess-mm | 2.0573 -> 0 |
| oracles:text EXT-2 | `danfe\|EXT-2\|oracles:text\|plain\|criterion#1\|missing.pdftotext` | 10 | 0 | 0 count | 10 -> 0 |
| oracles:text EXT-2 | `danfe\|EXT-2\|oracles:text\|plain\|criterion#1\|extra.pdftotext` | 5 | 0 | 0 count | 5 -> 0 |
| oracles:text EXT-2 | `danfe\|EXT-2\|oracles:text\|plain\|criterion#1\|statusRank.pdftotext` | 1 | 2 | 0 count | 1 -> 2 |
| oracles:text EXT-2 | `danfe\|EXT-2\|oracles:text\|plain\|criterion#1\|missing.pymupdf` | 1 | 0 | 0 count | 1 -> 0 |
| oracles:text EXT-2 | `danfe\|EXT-2\|oracles:text\|plain\|criterion#1\|extra.pymupdf` | 1 | 0 | 0 count | 1 -> 0 |
| oracles:text EXT-2 | `danfe\|EXT-2\|oracles:text\|plain\|criterion#1\|statusRank.pymupdf` | 1 | 3 | 0 count | 1 -> 3 |
| oracles:layout REF-W | `danfe\|REF-W\|oracles:layout\|plain\|criterion#1\|maxMm` | 157.01 | 5.42 | 0.1 position-mm | 157.01 -> 5.42 |
| oracles:layout REF-W | `danfe\|REF-W\|oracles:layout\|plain\|criterion#1\|p95Mm` | 40.23 | 4.49 | 0.1 position-mm | 40.23 -> 4.49 |
| oracles:text EXT-2 | `notification\|EXT-2\|oracles:text\|plain\|criterion#1\|statusRank.pdfminer.six` | 2 | 3 | 0 count | 2 -> 3 |
| oracles:text EXT-2 | `notification\|EXT-2\|oracles:text\|plain\|criterion#1\|statusRank.pymupdf` | 2 | 3 | 0 count | 2 -> 3 |
| oracles:layout REF-W | `notification\|REF-W\|oracles:layout\|plain\|criterion#1\|maxMm` | 3.6 | 1.81 | 0.1 position-mm | 3.6 -> 1.81 |
| oracles:layout REF-W | `notification\|REF-W\|oracles:layout\|plain\|criterion#1\|p95Mm` | 3.48 | 1.7 | 0.1 position-mm | 3.48 -> 1.7 |
| corpus INV-I | `oss-sparksuite-invoice\|INV-I1\|corpus\|\|criterion#1\|shortfall` | 1 | 0 | 0 count | 1 -> 0 |
| corpus INV-R | `oss-sparksuite-invoice\|INV-R1\|corpus\|\|criterion#1\|worstMm` | 11.47 | 4.15 | 0.1 position-mm | 11.47 -> 4.15 |
| oracles:text EXT-2 | `receipt\|EXT-2\|oracles:text\|plain\|criterion#1\|statusRank.pdftotext` | 2 | 3 | 0 count | 2 -> 3 |
| oracles:text EXT-2 | `receipt\|EXT-2\|oracles:text\|plain\|criterion#1\|statusRank.pdfminer.six` | 2 | 3 | 0 count | 2 -> 3 |
| oracles:layout REF-W | `receipt\|REF-W\|oracles:layout\|plain\|criterion#1\|maxMm` | 117.48 | 0.77 | 0.1 position-mm | 117.48 -> 0.77 |
| oracles:layout REF-W | `receipt\|REF-W\|oracles:layout\|plain\|criterion#1\|p95Mm` | 55.29 | 0.7 | 0.1 position-mm | 55.29 -> 0.7 |
| corpus TXT-R | `text-stress-ptbr\|TXT-R1\|corpus\|\|criterion#1\|worstMm` | 11.24 | 0.38 | 0.1 position-mm | 11.24 -> 0.38 |
| oracles:text EXT-2 | `text-stress-ptbr\|EXT-2\|oracles:text\|plain\|criterion#1\|missing.pdftotext` | 78 | 0 | 0 count | 78 -> 0 |
| oracles:text EXT-2 | `text-stress-ptbr\|EXT-2\|oracles:text\|plain\|criterion#1\|extra.pdftotext` | 48 | 9 | 0 count | 48 -> 9 |
| oracles:text EXT-2 | `text-stress-ptbr\|EXT-2\|oracles:text\|plain\|criterion#1\|statusRank.pdftotext` | 1 | 2 | 0 count | 1 -> 2 |
| oracles:layout REF-W | `text-stress-ptbr\|REF-W\|oracles:layout\|plain\|criterion#1\|maxMm` | 112.6 | 97.79 | 0.1 position-mm | 112.6 -> 97.79 |
| oracles:layout REF-W | `text-stress-ptbr\|REF-W\|oracles:layout\|plain\|criterion#1\|p95Mm` | 108.17 | 97.02 | 0.1 position-mm | 108.17 -> 97.02 |
| pdf-probe | `pdf-probe\|invoice\|p1\|Acme#1\|dy` | -4.9 | 0.35 | 1 pdf-probe-pt | "Acme" \|dy\| 4.9 -> 0.35 pt |
| pdf-probe | `pdf-probe\|invoice\|p1\|Widgets#1\|dy` | -4.9 | 0.35 | 1 pdf-probe-pt | "Widgets" \|dy\| 4.9 -> 0.35 pt |
| pdf-probe | `pdf-probe\|invoice\|p1\|LON#1\|dy` | -4.9 | 0.35 | 1 pdf-probe-pt | "LON" \|dy\| 4.9 -> 0.35 pt |
| pdf-probe | `pdf-probe\|invoice\|p1\|Soluções#1\|dy` | -4.15 | 0.35 | 1 pdf-probe-pt | "Soluções" \|dy\| 4.15 -> 0.35 pt |
| pdf-probe | `pdf-probe\|invoice\|p1\|industriais#1\|dy` | -4.15 | 0.35 | 1 pdf-probe-pt | "industriais" \|dy\| 4.15 -> 0.35 pt |
| pdf-probe | `pdf-probe\|invoice\|p1\|sob#1\|dy` | -4.15 | 0.35 | 1 pdf-probe-pt | "sob" \|dy\| 4.15 -> 0.35 pt |
| pdf-probe | `pdf-probe\|invoice\|p1\|medida#1\|dy` | -4.15 | 0.35 | 1 pdf-probe-pt | "medida" \|dy\| 4.15 -> 0.35 pt |
| pdf-probe | `pdf-probe\|invoice\|p1\|Página#1\|dx` | 6.19 | -0.11 | 1 pdf-probe-pt | "Página" \|dx\| 6.19 -> 0.11 pt |
| pdf-probe | `pdf-probe\|invoice\|p1\|Página#1\|dy` | -3.51 | 0.24 | 1 pdf-probe-pt | "Página" \|dy\| 3.51 -> 0.24 pt |
| pdf-probe | `pdf-probe\|invoice\|p1\|1#1\|dx` | -5.46 | -0.1 | 1 pdf-probe-pt | "1" \|dx\| 5.46 -> 0.1 pt |
| pdf-probe | `pdf-probe\|invoice\|p1\|1#1\|dy` | -3.51 | 0.24 | 1 pdf-probe-pt | "1" \|dy\| 3.51 -> 0.24 pt |
| pdf-probe | `pdf-probe\|invoice\|p1\|de#5\|dx` | -8.84 | -0.1 | 1 pdf-probe-pt | "de" \|dx\| 8.84 -> 0.1 pt |
| pdf-probe | `pdf-probe\|invoice\|p1\|de#5\|dy` | -3.51 | 0.24 | 1 pdf-probe-pt | "de" \|dy\| 3.51 -> 0.24 pt |
| pdf-probe | `pdf-probe\|invoice\|p1\|3#1\|dx` | -13.41 | -0.11 | 1 pdf-probe-pt | "3" \|dx\| 13.41 -> 0.11 pt |
| pdf-probe | `pdf-probe\|invoice\|p1\|3#1\|dy` | -3.51 | 0.24 | 1 pdf-probe-pt | "3" \|dy\| 3.51 -> 0.24 pt |
| pdf-probe | `pdf-probe\|invoice\|p2\|ITEM#1\|dy` | -4.15 | -1.15 | 1 pdf-probe-pt | "ITEM" \|dy\| 4.15 -> 1.15 pt |
| pdf-probe | `pdf-probe\|invoice\|p2\|QTD.#1\|dy` | -4.15 | -1.15 | 1 pdf-probe-pt | "QTD." \|dy\| 4.15 -> 1.15 pt |
| pdf-probe | `pdf-probe\|invoice\|p2\|PREÇO#1\|dy` | -4.15 | -1.15 | 1 pdf-probe-pt | "PREÇO" \|dy\| 4.15 -> 1.15 pt |
| pdf-probe | `pdf-probe\|invoice\|p2\|UNIT.#1\|dy` | -4.15 | -1.15 | 1 pdf-probe-pt | "UNIT." \|dy\| 4.15 -> 1.15 pt |
| pdf-probe | `pdf-probe\|invoice\|p2\|TOTAL#1\|dy` | -4.15 | -1.15 | 1 pdf-probe-pt | "TOTAL" \|dy\| 4.15 -> 1.15 pt |
| pdf-probe | `pdf-probe\|invoice\|p2\|Cabo#1\|dy` | -4.9 | -1.9 | 1 pdf-probe-pt | "Cabo" \|dy\| 4.9 -> 1.9 pt |
| pdf-probe | `pdf-probe\|invoice\|p2\|flexível#1\|dy` | -4.9 | -1.9 | 1 pdf-probe-pt | "flexível" \|dy\| 4.9 -> 1.9 pt |
| pdf-probe | `pdf-probe\|invoice\|p2\|1.5mm²#1\|dy` | -4.9 | -1.9 | 1 pdf-probe-pt | "1.5mm²" \|dy\| 4.9 -> 1.9 pt |
| pdf-probe | `pdf-probe\|invoice\|p2\|—#1\|dy` | -4.9 | -1.9 | 1 pdf-probe-pt | "—" \|dy\| 4.9 -> 1.9 pt |
| pdf-probe | `pdf-probe\|invoice\|p2\|rolo#1\|dy` | -4.9 | -1.9 | 1 pdf-probe-pt | "rolo" \|dy\| 4.9 -> 1.9 pt |
| pdf-probe | `pdf-probe\|invoice\|p2\|100m#1\|dy` | -4.9 | -1.9 | 1 pdf-probe-pt | "100m" \|dy\| 4.9 -> 1.9 pt |
| pdf-probe | `pdf-probe\|invoice\|p2\|10#1\|dy` | -4.9 | -1.9 | 1 pdf-probe-pt | "10" \|dy\| 4.9 -> 1.9 pt |
| pdf-probe | `pdf-probe\|invoice\|p2\|R$#1\|dy` | -4.9 | -1.9 | 1 pdf-probe-pt | "R$" \|dy\| 4.9 -> 1.9 pt |
| pdf-probe | `pdf-probe\|invoice\|p2\|98,00#1\|dy` | -4.9 | -1.9 | 1 pdf-probe-pt | "98,00" \|dy\| 4.9 -> 1.9 pt |
| pdf-probe | `pdf-probe\|invoice\|p2\|R$#2\|dy` | -4.9 | -1.9 | 1 pdf-probe-pt | "R$" \|dy\| 4.9 -> 1.9 pt |
| pdf-probe | `pdf-probe\|invoice\|p2\|980,00#1\|dy` | -4.9 | -1.9 | 1 pdf-probe-pt | "980,00" \|dy\| 4.9 -> 1.9 pt |
| pdf-probe | `pdf-probe\|invoice\|p2\|SKU#1\|dy` | -4.15 | -1.15 | 1 pdf-probe-pt | "SKU" \|dy\| 4.15 -> 1.15 pt |
| pdf-probe | `pdf-probe\|invoice\|p2\|CB-15-100#1\|dy` | -4.15 | -1.15 | 1 pdf-probe-pt | "CB-15-100" \|dy\| 4.15 -> 1.15 pt |
| pdf-probe | `pdf-probe\|invoice\|p2\|Terminal#1\|dy` | -4.9 | -1.15 | 1 pdf-probe-pt | "Terminal" \|dy\| 4.9 -> 1.15 pt |
| pdf-probe | `pdf-probe\|invoice\|p2\|tubular#1\|dy` | -4.9 | -1.15 | 1 pdf-probe-pt | "tubular" \|dy\| 4.9 -> 1.15 pt |
| pdf-probe | `pdf-probe\|invoice\|p2\|1.5mm#1\|dy` | -4.9 | -1.15 | 1 pdf-probe-pt | "1.5mm" \|dy\| 4.9 -> 1.15 pt |
| pdf-probe | `pdf-probe\|invoice\|p2\|(caixa#1\|dy` | -4.9 | -1.15 | 1 pdf-probe-pt | "(caixa" \|dy\| 4.9 -> 1.15 pt |
| pdf-probe | `pdf-probe\|invoice\|p2\|500)#1\|dy` | -4.9 | -1.15 | 1 pdf-probe-pt | "500)" \|dy\| 4.9 -> 1.15 pt |
| pdf-probe | `pdf-probe\|invoice\|p2\|6#1\|dy` | -4.15 | -1.15 | 1 pdf-probe-pt | "6" \|dy\| 4.15 -> 1.15 pt |
| pdf-probe | `pdf-probe\|invoice\|p2\|R$#3\|dy` | -4.15 | -1.15 | 1 pdf-probe-pt | "R$" \|dy\| 4.15 -> 1.15 pt |
| pdf-probe | `pdf-probe\|invoice\|p2\|27,40#1\|dy` | -4.15 | -1.15 | 1 pdf-probe-pt | "27,40" \|dy\| 4.15 -> 1.15 pt |
| pdf-probe | `pdf-probe\|invoice\|p2\|R$#4\|dy` | -4.15 | -1.15 | 1 pdf-probe-pt | "R$" \|dy\| 4.15 -> 1.15 pt |
| pdf-probe | `pdf-probe\|invoice\|p2\|164,40#1\|dy` | -4.15 | -1.15 | 1 pdf-probe-pt | "164,40" \|dy\| 4.15 -> 1.15 pt |
| pdf-probe | `pdf-probe\|invoice\|p2\|SKU#2\|dy` | -4.9 | -1.9 | 1 pdf-probe-pt | "SKU" \|dy\| 4.9 -> 1.9 pt |
| pdf-probe | `pdf-probe\|invoice\|p2\|TM-15-500#1\|dy` | -4.9 | -1.9 | 1 pdf-probe-pt | "TM-15-500" \|dy\| 4.9 -> 1.9 pt |
| pdf-probe | `pdf-probe\|invoice\|p2\|Sensor#1\|dy` | -4.9 | -1.9 | 1 pdf-probe-pt | "Sensor" \|dy\| 4.9 -> 1.9 pt |
| pdf-probe | `pdf-probe\|invoice\|p2\|indutivo#1\|dy` | -4.9 | -1.9 | 1 pdf-probe-pt | "indutivo" \|dy\| 4.9 -> 1.9 pt |
| … | 419 more in gate-report.json | | | | |

WPT/crashtest improvements: 1253 (listed in gate-report.json).

## Worse within tolerance (394; not gating, counted; the head ratchet sums them)

| group | key | before | after | tolerance | detail |
|---|---|---|---|---|---|
| oracles:layout REF-W | `invoice\|REF-W\|oracles:layout\|plain\|criterion#1\|maxMm` | 2.44 | 2.53 | 0.1 position-mm | 2.44 -> 2.53 (worse, within tolerance 0.1 mm) |
| pdf-probe | `pdf-probe\|invoice\|p1\|FATURA#1\|dx` | -0.03 | -0.43 | 1 pdf-probe-pt | "FATURA" \|dx\| 0.03 -> 0.43 pt (worse, within 1 pt) |
| pdf-probe | `pdf-probe\|invoice\|p1\|Número#1\|dx` | -0.04 | -0.37 | 1 pdf-probe-pt | "Número" \|dx\| 0.04 -> 0.37 pt (worse, within 1 pt) |
| pdf-probe | `pdf-probe\|invoice\|p1\|INV-2026-00417#1\|dx` | -0.03 | -0.38 | 1 pdf-probe-pt | "INV-2026-00417" \|dx\| 0.03 -> 0.38 pt (worse, within 1 pt) |
| pdf-probe | `pdf-probe\|invoice\|p1\|Emissão#1\|dx` | -0.04 | -0.38 | 1 pdf-probe-pt | "Emissão" \|dx\| 0.04 -> 0.38 pt (worse, within 1 pt) |
| pdf-probe | `pdf-probe\|invoice\|p1\|22/06/2026#1\|dx` | -0.03 | -0.39 | 1 pdf-probe-pt | "22/06/2026" \|dx\| 0.03 -> 0.39 pt (worse, within 1 pt) |
| pdf-probe | `pdf-probe\|invoice\|p1\|Vencimento#1\|dx` | -0.04 | -0.37 | 1 pdf-probe-pt | "Vencimento" \|dx\| 0.04 -> 0.37 pt (worse, within 1 pt) |
| pdf-probe | `pdf-probe\|invoice\|p1\|22/07/2026#1\|dx` | -0.03 | -0.39 | 1 pdf-probe-pt | "22/07/2026" \|dx\| 0.03 -> 0.39 pt (worse, within 1 pt) |
| pdf-probe | `pdf-probe\|invoice\|p1\|industriais#1\|dx` | 0.37 | 0.39 | 1 pdf-probe-pt | "industriais" \|dx\| 0.37 -> 0.39 pt (worse, within 1 pt) |
| pdf-probe | `pdf-probe\|invoice\|p1\|sob#1\|dx` | 0.39 | 0.42 | 1 pdf-probe-pt | "sob" \|dx\| 0.39 -> 0.42 pt (worse, within 1 pt) |
| pdf-probe | `pdf-probe\|invoice\|p1\|medida#1\|dx` | 0.4 | 0.44 | 1 pdf-probe-pt | "medida" \|dx\| 0.4 -> 0.44 pt (worse, within 1 pt) |
| pdf-probe | `pdf-probe\|invoice\|p1\|das#1\|dx` | 1.19 | 1.2 | 1 pdf-probe-pt | "das" \|dx\| 1.19 -> 1.2 pt (worse, within 1 pt) |
| pdf-probe | `pdf-probe\|invoice\|p1\|Flores,#1\|dx` | 1.2 | 1.22 | 1 pdf-probe-pt | "Flores," \|dx\| 1.2 -> 1.22 pt (worse, within 1 pt) |
| pdf-probe | `pdf-probe\|invoice\|p1\|123#1\|dx` | 1.22 | 1.25 | 1 pdf-probe-pt | "123" \|dx\| 1.22 -> 1.25 pt (worse, within 1 pt) |
| pdf-probe | `pdf-probe\|invoice\|p1\|—#1\|dx` | 1.23 | 1.26 | 1 pdf-probe-pt | "—" \|dx\| 1.23 -> 1.26 pt (worse, within 1 pt) |
| pdf-probe | `pdf-probe\|invoice\|p1\|Sala#1\|dx` | 1.23 | 1.28 | 1 pdf-probe-pt | "Sala" \|dx\| 1.23 -> 1.28 pt (worse, within 1 pt) |
| pdf-probe | `pdf-probe\|invoice\|p1\|4B#1\|dx` | 1.24 | 1.29 | 1 pdf-probe-pt | "4B" \|dx\| 1.24 -> 1.29 pt (worse, within 1 pt) |
| pdf-probe | `pdf-probe\|invoice\|p1\|—#2\|dx` | 1.2 | 1.22 | 1 pdf-probe-pt | "—" \|dx\| 1.2 -> 1.22 pt (worse, within 1 pt) |
| pdf-probe | `pdf-probe\|invoice\|p1\|SP#1\|dx` | 1.21 | 1.24 | 1 pdf-probe-pt | "SP" \|dx\| 1.21 -> 1.24 pt (worse, within 1 pt) |
| pdf-probe | `pdf-probe\|invoice\|p1\|Brasil#1\|dx` | 1.2 | 1.23 | 1 pdf-probe-pt | "Brasil" \|dx\| 1.2 -> 1.23 pt (worse, within 1 pt) |
| pdf-probe | `pdf-probe\|invoice\|p1\|12.345.678/0001-90#1\|dx` | 1.2 | 1.21 | 1 pdf-probe-pt | "12.345.678/0001-90" \|dx\| 1.2 -> 1.21 pt (worse, within 1 pt) |
| pdf-probe | `pdf-probe\|invoice\|p1\|PREÇO#1\|dx` | 0.93 | 1.76 | 1 pdf-probe-pt | "PREÇO" \|dx\| 0.93 -> 1.76 pt (worse, within 1 pt) |
| pdf-probe | `pdf-probe\|invoice\|p1\|UNIT.#1\|dx` | 0.93 | 1.76 | 1 pdf-probe-pt | "UNIT." \|dx\| 0.93 -> 1.76 pt (worse, within 1 pt) |
| pdf-probe | `pdf-probe\|invoice\|p1\|TOTAL#1\|dx` | 0.09 | -0.65 | 1 pdf-probe-pt | "TOTAL" \|dx\| 0.09 -> 0.65 pt (worse, within 1 pt) |
| pdf-probe | `pdf-probe\|invoice\|p1\|Suporte#1\|dy` | -0.54 | 1.1 | 1 pdf-probe-pt | "Suporte" \|dy\| 0.54 -> 1.1 pt (worse, within 1 pt) |
| pdf-probe | `pdf-probe\|invoice\|p1\|de#1\|dy` | -0.54 | 1.1 | 1 pdf-probe-pt | "de" \|dy\| 0.54 -> 1.1 pt (worse, within 1 pt) |
| pdf-probe | `pdf-probe\|invoice\|p1\|fixação#1\|dy` | -0.54 | 1.1 | 1 pdf-probe-pt | "fixação" \|dy\| 0.54 -> 1.1 pt (worse, within 1 pt) |
| pdf-probe | `pdf-probe\|invoice\|p1\|em#1\|dy` | -0.54 | 1.1 | 1 pdf-probe-pt | "em" \|dy\| 0.54 -> 1.1 pt (worse, within 1 pt) |
| pdf-probe | `pdf-probe\|invoice\|p1\|alumínio#1\|dy` | -0.54 | 1.1 | 1 pdf-probe-pt | "alumínio" \|dy\| 0.54 -> 1.1 pt (worse, within 1 pt) |
| pdf-probe | `pdf-probe\|invoice\|p1\|A20#1\|dy` | -0.54 | 1.1 | 1 pdf-probe-pt | "A20" \|dy\| 0.54 -> 1.1 pt (worse, within 1 pt) |
| pdf-probe | `pdf-probe\|invoice\|p1\|40#1\|dy` | 0.21 | 1.1 | 1 pdf-probe-pt | "40" \|dy\| 0.21 -> 1.1 pt (worse, within 1 pt) |
| pdf-probe | `pdf-probe\|invoice\|p1\|R$#1\|dx` | 0.92 | 1.77 | 1 pdf-probe-pt | "R$" \|dx\| 0.92 -> 1.77 pt (worse, within 1 pt) |
| pdf-probe | `pdf-probe\|invoice\|p1\|R$#1\|dy` | 0.21 | 1.1 | 1 pdf-probe-pt | "R$" \|dy\| 0.21 -> 1.1 pt (worse, within 1 pt) |
| pdf-probe | `pdf-probe\|invoice\|p1\|32,50#1\|dx` | 0.92 | 1.76 | 1 pdf-probe-pt | "32,50" \|dx\| 0.92 -> 1.76 pt (worse, within 1 pt) |
| pdf-probe | `pdf-probe\|invoice\|p1\|32,50#1\|dy` | 0.21 | 1.1 | 1 pdf-probe-pt | "32,50" \|dy\| 0.21 -> 1.1 pt (worse, within 1 pt) |
| pdf-probe | `pdf-probe\|invoice\|p1\|R$#2\|dx` | 0.08 | -0.64 | 1 pdf-probe-pt | "R$" \|dx\| 0.08 -> 0.64 pt (worse, within 1 pt) |
| pdf-probe | `pdf-probe\|invoice\|p1\|R$#2\|dy` | 0.21 | 1.1 | 1 pdf-probe-pt | "R$" \|dy\| 0.21 -> 1.1 pt (worse, within 1 pt) |
| pdf-probe | `pdf-probe\|invoice\|p1\|1.300,00#1\|dx` | 0.08 | -0.65 | 1 pdf-probe-pt | "1.300,00" \|dx\| 0.08 -> 0.65 pt (worse, within 1 pt) |
| pdf-probe | `pdf-probe\|invoice\|p1\|1.300,00#1\|dy` | 0.21 | 1.1 | 1 pdf-probe-pt | "1.300,00" \|dy\| 0.21 -> 1.1 pt (worse, within 1 pt) |
| pdf-probe | `pdf-probe\|invoice\|p1\|WX-A20#1\|dx` | 0.12 | 0.13 | 1 pdf-probe-pt | "WX-A20" \|dx\| 0.12 -> 0.13 pt (worse, within 1 pt) |
| pdf-probe | `pdf-probe\|invoice\|p1\|R$#3\|dx` | 0.92 | 1.77 | 1 pdf-probe-pt | "R$" \|dx\| 0.92 -> 1.77 pt (worse, within 1 pt) |
| pdf-probe | `pdf-probe\|invoice\|p1\|18,90#1\|dx` | 0.92 | 1.76 | 1 pdf-probe-pt | "18,90" \|dx\| 0.92 -> 1.76 pt (worse, within 1 pt) |
| pdf-probe | `pdf-probe\|invoice\|p1\|R$#4\|dx` | 0.08 | -0.65 | 1 pdf-probe-pt | "R$" \|dx\| 0.08 -> 0.65 pt (worse, within 1 pt) |
| pdf-probe | `pdf-probe\|invoice\|p1\|472,50#1\|dx` | 0.08 | -0.65 | 1 pdf-probe-pt | "472,50" \|dx\| 0.08 -> 0.65 pt (worse, within 1 pt) |
| pdf-probe | `pdf-probe\|invoice\|p1\|SKU#2\|dy` | 0.21 | 0.35 | 1 pdf-probe-pt | "SKU" \|dy\| 0.21 -> 0.35 pt (worse, within 1 pt) |
| pdf-probe | `pdf-probe\|invoice\|p1\|FS-M8-100#1\|dx` | 0.12 | 0.13 | 1 pdf-probe-pt | "FS-M8-100" \|dx\| 0.12 -> 0.13 pt (worse, within 1 pt) |
| pdf-probe | `pdf-probe\|invoice\|p1\|FS-M8-100#1\|dy` | 0.21 | 0.35 | 1 pdf-probe-pt | "FS-M8-100" \|dy\| 0.21 -> 0.35 pt (worse, within 1 pt) |
| pdf-probe | `pdf-probe\|invoice\|p1\|R$#5\|dx` | 0.91 | 1.76 | 1 pdf-probe-pt | "R$" \|dx\| 0.91 -> 1.76 pt (worse, within 1 pt) |
| pdf-probe | `pdf-probe\|invoice\|p1\|9,75#1\|dx` | 0.92 | 1.76 | 1 pdf-probe-pt | "9,75" \|dx\| 0.92 -> 1.76 pt (worse, within 1 pt) |
| pdf-probe | `pdf-probe\|invoice\|p1\|R$#6\|dx` | 0.08 | -0.65 | 1 pdf-probe-pt | "R$" \|dx\| 0.08 -> 0.65 pt (worse, within 1 pt) |
| pdf-probe | `pdf-probe\|invoice\|p1\|175,50#1\|dx` | 0.08 | -0.65 | 1 pdf-probe-pt | "175,50" \|dx\| 0.08 -> 0.65 pt (worse, within 1 pt) |
| pdf-probe | `pdf-probe\|invoice\|p1\|SKU#3\|dy` | 0.21 | 1.1 | 1 pdf-probe-pt | "SKU" \|dy\| 0.21 -> 1.1 pt (worse, within 1 pt) |
| pdf-probe | `pdf-probe\|invoice\|p1\|FS-W8-200#1\|dx` | 0.12 | 0.13 | 1 pdf-probe-pt | "FS-W8-200" \|dx\| 0.12 -> 0.13 pt (worse, within 1 pt) |
| pdf-probe | `pdf-probe\|invoice\|p1\|FS-W8-200#1\|dy` | 0.21 | 1.1 | 1 pdf-probe-pt | "FS-W8-200" \|dy\| 0.21 -> 1.1 pt (worse, within 1 pt) |
| pdf-probe | `pdf-probe\|invoice\|p1\|Perfil#1\|dy` | 0.21 | 1.1 | 1 pdf-probe-pt | "Perfil" \|dy\| 0.21 -> 1.1 pt (worse, within 1 pt) |
| pdf-probe | `pdf-probe\|invoice\|p1\|estrutural#1\|dy` | 0.21 | 1.1 | 1 pdf-probe-pt | "estrutural" \|dy\| 0.21 -> 1.1 pt (worse, within 1 pt) |
| pdf-probe | `pdf-probe\|invoice\|p1\|40x40#1\|dy` | 0.21 | 1.1 | 1 pdf-probe-pt | "40x40" \|dy\| 0.21 -> 1.1 pt (worse, within 1 pt) |
| pdf-probe | `pdf-probe\|invoice\|p1\|—#5\|dy` | 0.21 | 1.1 | 1 pdf-probe-pt | "—" \|dy\| 0.21 -> 1.1 pt (worse, within 1 pt) |
| pdf-probe | `pdf-probe\|invoice\|p1\|barra#1\|dy` | 0.21 | 1.1 | 1 pdf-probe-pt | "barra" \|dy\| 0.21 -> 1.1 pt (worse, within 1 pt) |
| pdf-probe | `pdf-probe\|invoice\|p1\|3m#1\|dy` | 0.21 | 1.1 | 1 pdf-probe-pt | "3m" \|dy\| 0.21 -> 1.1 pt (worse, within 1 pt) |
| pdf-probe | `pdf-probe\|invoice\|p1\|60#1\|dy` | 0.21 | 1.1 | 1 pdf-probe-pt | "60" \|dy\| 0.21 -> 1.1 pt (worse, within 1 pt) |
| pdf-probe | `pdf-probe\|invoice\|p1\|R$#7\|dx` | 0.92 | 1.77 | 1 pdf-probe-pt | "R$" \|dx\| 0.92 -> 1.77 pt (worse, within 1 pt) |
| pdf-probe | `pdf-probe\|invoice\|p1\|R$#7\|dy` | 0.21 | 1.1 | 1 pdf-probe-pt | "R$" \|dy\| 0.21 -> 1.1 pt (worse, within 1 pt) |
| pdf-probe | `pdf-probe\|invoice\|p1\|47,20#1\|dx` | 0.92 | 1.76 | 1 pdf-probe-pt | "47,20" \|dx\| 0.92 -> 1.76 pt (worse, within 1 pt) |
| pdf-probe | `pdf-probe\|invoice\|p1\|47,20#1\|dy` | 0.21 | 1.1 | 1 pdf-probe-pt | "47,20" \|dy\| 0.21 -> 1.1 pt (worse, within 1 pt) |
| pdf-probe | `pdf-probe\|invoice\|p1\|R$#8\|dx` | 0.08 | -0.64 | 1 pdf-probe-pt | "R$" \|dx\| 0.08 -> 0.64 pt (worse, within 1 pt) |
| pdf-probe | `pdf-probe\|invoice\|p1\|R$#8\|dy` | 0.21 | 1.1 | 1 pdf-probe-pt | "R$" \|dy\| 0.21 -> 1.1 pt (worse, within 1 pt) |
| pdf-probe | `pdf-probe\|invoice\|p1\|2.832,00#1\|dx` | 0.08 | -0.65 | 1 pdf-probe-pt | "2.832,00" \|dx\| 0.08 -> 0.65 pt (worse, within 1 pt) |
| pdf-probe | `pdf-probe\|invoice\|p1\|2.832,00#1\|dy` | 0.21 | 1.1 | 1 pdf-probe-pt | "2.832,00" \|dy\| 0.21 -> 1.1 pt (worse, within 1 pt) |
| pdf-probe | `pdf-probe\|invoice\|p1\|SKU#4\|dy` | 0.21 | 0.35 | 1 pdf-probe-pt | "SKU" \|dy\| 0.21 -> 0.35 pt (worse, within 1 pt) |
| pdf-probe | `pdf-probe\|invoice\|p1\|PR-4040-3#1\|dx` | 0.12 | 0.13 | 1 pdf-probe-pt | "PR-4040-3" \|dx\| 0.12 -> 0.13 pt (worse, within 1 pt) |
| pdf-probe | `pdf-probe\|invoice\|p1\|PR-4040-3#1\|dy` | 0.21 | 0.35 | 1 pdf-probe-pt | "PR-4040-3" \|dy\| 0.21 -> 0.35 pt (worse, within 1 pt) |
| pdf-probe | `pdf-probe\|invoice\|p1\|R$#9\|dx` | 0.91 | 1.76 | 1 pdf-probe-pt | "R$" \|dx\| 0.91 -> 1.76 pt (worse, within 1 pt) |
| pdf-probe | `pdf-probe\|invoice\|p1\|6,40#1\|dx` | 0.92 | 1.76 | 1 pdf-probe-pt | "6,40" \|dx\| 0.92 -> 1.76 pt (worse, within 1 pt) |
| pdf-probe | `pdf-probe\|invoice\|p1\|R$#10\|dx` | 0.08 | -0.65 | 1 pdf-probe-pt | "R$" \|dx\| 0.08 -> 0.65 pt (worse, within 1 pt) |
| pdf-probe | `pdf-probe\|invoice\|p1\|768,00#1\|dx` | 0.08 | -0.65 | 1 pdf-probe-pt | "768,00" \|dx\| 0.08 -> 0.65 pt (worse, within 1 pt) |
| pdf-probe | `pdf-probe\|invoice\|p1\|SKU#5\|dy` | 0.21 | 1.1 | 1 pdf-probe-pt | "SKU" \|dy\| 0.21 -> 1.1 pt (worse, within 1 pt) |
| pdf-probe | `pdf-probe\|invoice\|p1\|CN-RF-01#1\|dx` | 0.12 | 0.13 | 1 pdf-probe-pt | "CN-RF-01" \|dx\| 0.12 -> 0.13 pt (worse, within 1 pt) |
| pdf-probe | `pdf-probe\|invoice\|p1\|CN-RF-01#1\|dy` | 0.21 | 1.1 | 1 pdf-probe-pt | "CN-RF-01" \|dy\| 0.21 -> 1.1 pt (worse, within 1 pt) |
| pdf-probe | `pdf-probe\|invoice\|p1\|Roldana#1\|dy` | -0.54 | 1.1 | 1 pdf-probe-pt | "Roldana" \|dy\| 0.54 -> 1.1 pt (worse, within 1 pt) |
| pdf-probe | `pdf-probe\|invoice\|p1\|industrial#1\|dy` | -0.54 | 1.1 | 1 pdf-probe-pt | "industrial" \|dy\| 0.54 -> 1.1 pt (worse, within 1 pt) |
| pdf-probe | `pdf-probe\|invoice\|p1\|Ø50mm#1\|dy` | -0.54 | 1.1 | 1 pdf-probe-pt | "Ø50mm" \|dy\| 0.54 -> 1.1 pt (worse, within 1 pt) |
| pdf-probe | `pdf-probe\|invoice\|p1\|30#1\|dy` | 0.21 | 1.1 | 1 pdf-probe-pt | "30" \|dy\| 0.21 -> 1.1 pt (worse, within 1 pt) |
| pdf-probe | `pdf-probe\|invoice\|p1\|R$#11\|dx` | 0.92 | 1.77 | 1 pdf-probe-pt | "R$" \|dx\| 0.92 -> 1.77 pt (worse, within 1 pt) |
| pdf-probe | `pdf-probe\|invoice\|p1\|R$#11\|dy` | 0.21 | 1.1 | 1 pdf-probe-pt | "R$" \|dy\| 0.21 -> 1.1 pt (worse, within 1 pt) |
| pdf-probe | `pdf-probe\|invoice\|p1\|28,00#1\|dx` | 0.92 | 1.76 | 1 pdf-probe-pt | "28,00" \|dx\| 0.92 -> 1.76 pt (worse, within 1 pt) |
| pdf-probe | `pdf-probe\|invoice\|p1\|28,00#1\|dy` | 0.21 | 1.1 | 1 pdf-probe-pt | "28,00" \|dy\| 0.21 -> 1.1 pt (worse, within 1 pt) |
| pdf-probe | `pdf-probe\|invoice\|p1\|R$#12\|dx` | 0.08 | -0.65 | 1 pdf-probe-pt | "R$" \|dx\| 0.08 -> 0.65 pt (worse, within 1 pt) |
| pdf-probe | `pdf-probe\|invoice\|p1\|R$#12\|dy` | 0.21 | 1.1 | 1 pdf-probe-pt | "R$" \|dy\| 0.21 -> 1.1 pt (worse, within 1 pt) |
| pdf-probe | `pdf-probe\|invoice\|p1\|840,00#1\|dx` | 0.08 | -0.65 | 1 pdf-probe-pt | "840,00" \|dx\| 0.08 -> 0.65 pt (worse, within 1 pt) |
| pdf-probe | `pdf-probe\|invoice\|p1\|840,00#1\|dy` | 0.21 | 1.1 | 1 pdf-probe-pt | "840,00" \|dy\| 0.21 -> 1.1 pt (worse, within 1 pt) |
| pdf-probe | `pdf-probe\|invoice\|p1\|RL-50#1\|dx` | 0.12 | 0.13 | 1 pdf-probe-pt | "RL-50" \|dx\| 0.12 -> 0.13 pt (worse, within 1 pt) |
| pdf-probe | `pdf-probe\|invoice\|p1\|R$#13\|dx` | 0.92 | 1.77 | 1 pdf-probe-pt | "R$" \|dx\| 0.92 -> 1.77 pt (worse, within 1 pt) |
| pdf-probe | `pdf-probe\|invoice\|p1\|89,90#1\|dx` | 0.92 | 1.76 | 1 pdf-probe-pt | "89,90" \|dx\| 0.92 -> 1.76 pt (worse, within 1 pt) |
| pdf-probe | `pdf-probe\|invoice\|p1\|R$#14\|dx` | 0.08 | -0.64 | 1 pdf-probe-pt | "R$" \|dx\| 0.08 -> 0.64 pt (worse, within 1 pt) |
| pdf-probe | `pdf-probe\|invoice\|p1\|1.977,80#1\|dx` | 0.08 | -0.65 | 1 pdf-probe-pt | "1.977,80" \|dx\| 0.08 -> 0.65 pt (worse, within 1 pt) |
| pdf-probe | `pdf-probe\|invoice\|p1\|SKU#7\|dy` | 0.21 | 0.35 | 1 pdf-probe-pt | "SKU" \|dy\| 0.21 -> 0.35 pt (worse, within 1 pt) |
| pdf-probe | `pdf-probe\|invoice\|p1\|TL-500#1\|dx` | 0.12 | 0.13 | 1 pdf-probe-pt | "TL-500" \|dx\| 0.12 -> 0.13 pt (worse, within 1 pt) |
| pdf-probe | `pdf-probe\|invoice\|p1\|TL-500#1\|dy` | 0.21 | 0.35 | 1 pdf-probe-pt | "TL-500" \|dy\| 0.21 -> 0.35 pt (worse, within 1 pt) |
| pdf-probe | `pdf-probe\|invoice\|p1\|Bloco#1\|dy` | -0.54 | 1.1 | 1 pdf-probe-pt | "Bloco" \|dy\| 0.54 -> 1.1 pt (worse, within 1 pt) |
| pdf-probe | `pdf-probe\|invoice\|p1\|deslizante#1\|dy` | -0.54 | 1.1 | 1 pdf-probe-pt | "deslizante" \|dy\| 0.54 -> 1.1 pt (worse, within 1 pt) |
| pdf-probe | `pdf-probe\|invoice\|p1\|para#1\|dy` | -0.54 | 1.1 | 1 pdf-probe-pt | "para" \|dy\| 0.54 -> 1.1 pt (worse, within 1 pt) |
| pdf-probe | `pdf-probe\|invoice\|p1\|trilho#1\|dy` | -0.54 | 1.1 | 1 pdf-probe-pt | "trilho" \|dy\| 0.54 -> 1.1 pt (worse, within 1 pt) |
| pdf-probe | `pdf-probe\|invoice\|p1\|linear#2\|dy` | -0.54 | 1.1 | 1 pdf-probe-pt | "linear" \|dy\| 0.54 -> 1.1 pt (worse, within 1 pt) |
| pdf-probe | `pdf-probe\|invoice\|p1\|44#1\|dy` | 0.21 | 1.1 | 1 pdf-probe-pt | "44" \|dy\| 0.21 -> 1.1 pt (worse, within 1 pt) |
| pdf-probe | `pdf-probe\|invoice\|p1\|R$#15\|dx` | 0.92 | 1.77 | 1 pdf-probe-pt | "R$" \|dx\| 0.92 -> 1.77 pt (worse, within 1 pt) |
| pdf-probe | `pdf-probe\|invoice\|p1\|R$#15\|dy` | 0.21 | 1.1 | 1 pdf-probe-pt | "R$" \|dy\| 0.21 -> 1.1 pt (worse, within 1 pt) |
| pdf-probe | `pdf-probe\|invoice\|p1\|34,50#1\|dx` | 0.92 | 1.76 | 1 pdf-probe-pt | "34,50" \|dx\| 0.92 -> 1.76 pt (worse, within 1 pt) |
| pdf-probe | `pdf-probe\|invoice\|p1\|34,50#1\|dy` | 0.21 | 1.1 | 1 pdf-probe-pt | "34,50" \|dy\| 0.21 -> 1.1 pt (worse, within 1 pt) |
| pdf-probe | `pdf-probe\|invoice\|p1\|R$#16\|dx` | 0.08 | -0.64 | 1 pdf-probe-pt | "R$" \|dx\| 0.08 -> 0.64 pt (worse, within 1 pt) |
| pdf-probe | `pdf-probe\|invoice\|p1\|R$#16\|dy` | 0.21 | 1.1 | 1 pdf-probe-pt | "R$" \|dy\| 0.21 -> 1.1 pt (worse, within 1 pt) |
| pdf-probe | `pdf-probe\|invoice\|p1\|1.518,00#1\|dx` | 0.08 | -0.65 | 1 pdf-probe-pt | "1.518,00" \|dx\| 0.08 -> 0.65 pt (worse, within 1 pt) |
| pdf-probe | `pdf-probe\|invoice\|p1\|1.518,00#1\|dy` | 0.21 | 1.1 | 1 pdf-probe-pt | "1.518,00" \|dy\| 0.21 -> 1.1 pt (worse, within 1 pt) |
| pdf-probe | `pdf-probe\|invoice\|p1\|SKU#8\|dy` | 0.21 | 1.1 | 1 pdf-probe-pt | "SKU" \|dy\| 0.21 -> 1.1 pt (worse, within 1 pt) |
| pdf-probe | `pdf-probe\|invoice\|p1\|BD-TL#1\|dx` | 0.12 | 0.13 | 1 pdf-probe-pt | "BD-TL" \|dx\| 0.12 -> 0.13 pt (worse, within 1 pt) |
| pdf-probe | `pdf-probe\|invoice\|p1\|BD-TL#1\|dy` | 0.21 | 1.1 | 1 pdf-probe-pt | "BD-TL" \|dy\| 0.21 -> 1.1 pt (worse, within 1 pt) |
| pdf-probe | `pdf-probe\|invoice\|p1\|Motor#1\|dy` | 0.21 | 1.1 | 1 pdf-probe-pt | "Motor" \|dy\| 0.21 -> 1.1 pt (worse, within 1 pt) |
| pdf-probe | `pdf-probe\|invoice\|p1\|de#4\|dy` | 0.21 | 1.1 | 1 pdf-probe-pt | "de" \|dy\| 0.21 -> 1.1 pt (worse, within 1 pt) |
| pdf-probe | `pdf-probe\|invoice\|p1\|passo#1\|dy` | 0.21 | 1.1 | 1 pdf-probe-pt | "passo" \|dy\| 0.21 -> 1.1 pt (worse, within 1 pt) |
| pdf-probe | `pdf-probe\|invoice\|p1\|NEMA#1\|dy` | 0.21 | 1.1 | 1 pdf-probe-pt | "NEMA" \|dy\| 0.21 -> 1.1 pt (worse, within 1 pt) |
| … | 274 more in gate-report.json | | | | |

## newly-measured (5)

| group | key | before | after | tolerance | detail |
|---|---|---|---|---|---|
| oracles:barcode DANFE-B1 | `danfe\|DANFE-B1\|oracles:barcode\|plain\|criterion#1` | NOT-RUN | PASS |  | now measured:  |
| pdf-probe | `pdf-probe\|notification\|p1\|Página#1\|pairing` | unpaired | dx -0.11 dy 0.24 |  | Chrome's "Página" (page 1) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|notification\|p1\|1#1\|pairing` | unpaired | dx -0.1 dy 0.24 |  | Chrome's "1" (page 1) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|notification\|p1\|de#10\|pairing` | unpaired | dx -0.1 dy 0.24 |  | Chrome's "de" (page 1) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|notification\|p1\|1#2\|pairing` | unpaired | dx -0.11 dy 0.24 |  | Chrome's "1" (page 1) now has a vellora counterpart |

## added (13)

| group | key | before | after | tolerance | detail |
|---|---|---|---|---|---|
| oracles:layout LET-1 | `notification\|LET-1\|oracles:layout\|plain\|criterion#1` | absent | FAIL |  | worst "Gerente do Departamento de Cobra" dy 1.81 mm (tol 1; 4 anchors: last paragraph + signature lines; 0 disputed) |
| oracles:layout LET-2 | `notification\|LET-2\|oracles:layout\|plain\|criterion#1` | absent | PASS |  | 0 of 6 paragraphs differ in line count (0 disputed/not located in the references) |
| oracles:layout LET-3 | `notification\|LET-3\|oracles:layout\|plain\|criterion#1` | absent | PASS |  | 1 pages vs Chrome 1 (WeasyPrint 1) (= REF-P) |
| oracles:layout LET-1 | `text-stress-ptbr\|LET-1\|oracles:layout\|plain\|criterion#1` | absent | NOT-RUN |  | no anchor with a reference consensus (1 disputed) |
| oracles:layout LET-2 | `text-stress-ptbr\|LET-2\|oracles:layout\|plain\|criterion#1` | absent | PASS |  | 0 of 2 paragraphs differ in line count (1 disputed/not located in the references) |
| corpus LET- | `text-stress-ptbr\|LET-3\|corpus\|\|criterion#1` | absent | FAIL |  | 8 vs reference 7 (= TXT-P1) |
| oracles:layout TXT-B1 | `text-stress-ptbr\|TXT-B1\|oracles:layout\|\|criterion#1` | absent | PASS |  | 6 pages with statement rows, header missing on none; months split across pages none (a split the Chrome reference also makes is allowed: taller than a page) |
| canaries | `canary\|verapdf\|veraPDF: PDF/A-2b claim kept, /OutputIntents renamed /OutputIntentz (OutputIntent removed)` | absent | true |  | new detection canary, caught |
| canaries | `canary\|verapdf\|veraPDF: PDF/A-2b claim kept, /FontFile2 renamed /FontFilf2 (font program not embedded)` | absent | true |  | new detection canary, caught |
| canaries | `canary\|barcode\|code128c-valid-px rendered by vellora` | absent | true |  | new detection canary, caught |
| canaries | `canary\|barcode\|code128c-valid-px rendered by chrome` | absent | true |  | new detection canary, caught |
| canaries | `canary\|barcode\|code128c-bad-cdv-px rendered by vellora` | absent | true |  | new detection canary, caught |
| canaries | `canary\|barcode\|code128c-bad-cdv-px rendered by chrome` | absent | true |  | new detection canary, caught |

## changed (20)

| group | key | before | after | tolerance | detail |
|---|---|---|---|---|---|
| wpt css/CSS2/box-display | `wpt\|css/CSS2/box-display/root-box-003.xht` | error | pass-blank |  | error -> pass-blank |
| wpt css/CSS2/normal-flow | `wpt\|css/CSS2/normal-flow/inline-block-zorder-001.xht` | pass-blank | fail |  | pass-blank -> fail |
| wpt css/CSS2/normal-flow | `wpt\|css/CSS2/normal-flow/inline-block-zorder-002.xht` | pass-blank | fail |  | pass-blank -> fail |
| wpt css/CSS2/normal-flow | `wpt\|css/CSS2/normal-flow/inline-table-width-001a.xht` | pass-blank | fail |  | pass-blank -> fail |
| wpt css/CSS2/normal-flow | `wpt\|css/CSS2/normal-flow/inline-table-width-001b.xht` | pass-blank | fail |  | pass-blank -> fail |
| wpt css/CSS2/normal-flow | `wpt\|css/CSS2/normal-flow/inline-table-width-002a.xht` | pass-blank | fail |  | pass-blank -> fail |
| wpt css/CSS2/text | `wpt\|css/CSS2/text/text-transform-cap-002.xht` | pass-blank | fail |  | pass-blank -> fail |
| wpt css/CSS2/visudet | `wpt\|css/CSS2/visudet/replaced-elements-min-height-20.html` | unsupported | fail |  | unsupported -> fail |
| wpt css/CSS2/visudet | `wpt\|css/CSS2/visudet/replaced-elements-min-height-40.html` | unsupported | fail |  | unsupported -> fail |
| wpt css/css-break | `wpt\|css/css-break/overflowed-abs-pos-with-percentage-height-print.html` | pass-blank | fail |  | pass-blank -> fail |
| wpt css/css-page | `wpt\|css/css-page/page-box-011-print.html` | pass-blank | fail |  | pass-blank -> fail |
| wpt css/css-page | `wpt\|css/css-page/page-size-015-print.tentative.html` | pass-blank | fail |  | pass-blank -> fail |
| wpt css/css-text | `wpt\|css/css-text/boundary-shaping/boundary-shaping-001.html` | pass-blank | fail |  | pass-blank -> fail |
| wpt css/css-text | `wpt\|css/css-text/boundary-shaping/boundary-shaping-002.html` | pass-blank | fail |  | pass-blank -> fail |
| wpt css/css-text | `wpt\|css/css-text/boundary-shaping/boundary-shaping-003.html` | pass-blank | fail |  | pass-blank -> fail |
| wpt css/css-text | `wpt\|css/css-text/boundary-shaping/boundary-shaping-004.html` | pass-blank | fail |  | pass-blank -> fail |
| wpt css/css-text | `wpt\|css/css-text/boundary-shaping/boundary-shaping-005.html` | pass-blank | fail |  | pass-blank -> fail |
| wpt css/css-text | `wpt\|css/css-text/boundary-shaping/boundary-shaping-006.html` | pass-blank | fail |  | pass-blank -> fail |
| wpt css/css-text | `wpt\|css/css-text/boundary-shaping/boundary-shaping-007.html` | pass-blank | fail |  | pass-blank -> fail |
| wpt css/css-text | `wpt\|css/css-text/boundary-shaping/boundary-shaping-008.html` | pass-blank | fail |  | pass-blank -> fail |

## not-comparable (8)

| group | key | before | after | tolerance | detail |
|---|---|---|---|---|---|
| wpt crashtests | `wpt-crash` | absent | 0 panic/crash/timeout |  | baseline has no crashtest record; the run has 0 non-ok:  |
| pdf-probe | `pdf-probe\|boleto-febraban` | absent | 315 pairs |  | baseline has no pdf-probe for this fixture |
| pdf-probe | `pdf-probe\|boleto` | absent | 297 pairs |  | baseline has no pdf-probe for this fixture |
| pdf-probe | `pdf-probe\|danfe` | absent | 590 pairs |  | baseline has no pdf-probe for this fixture |
| pdf-probe | `pdf-probe\|oss-postmark-receipt` | absent | 138 pairs |  | baseline has no pdf-probe for this fixture |
| pdf-probe | `pdf-probe\|oss-sparksuite-invoice` | absent | 46 pairs |  | baseline has no pdf-probe for this fixture |
| pdf-probe | `pdf-probe\|receipt` | absent | 151 pairs |  | baseline has no pdf-probe for this fixture |
| pdf-probe | `pdf-probe\|text-stress-ptbr` | absent | 751 pairs |  | baseline has no pdf-probe for this fixture |

## Debt ledger (0 entries; transition not checked (no --debt-base); passes auto_table_compact_columns, painted_table_cell_text_baselines, table_percent_widths)

no problem

## Gate canaries (13/13 caught; an uncaught one is an absolute failure)

| canary | must report | observed | caught |
|---|---|---|---|
| head ratchet: \|dy\| +0.6 pt per step over two steps | real word boleto-febraban p1\|Recibo#1: vs previous link within-tolerance (listed, not gating); vs head regression; no DEBT entry -> head-regression | previous within-tolerance; head regression; ledger head-regression | true |
| WPT fail -> unsupported (new strict-gate rejection) | real test css/CSS2/abspos/abspos-containing-block-initial-004a.xht: gating rejection; declared with its feature -> declared | undeclared rejection/true; declared declared/false | true |
| verdict row -> strict gate rejected | real row boleto-febraban BOL-P1 corpus: gating rejection with its feature | rejection:canary:planted-rejection | true |
| verdict row measured -> NOT-RUN | real row boleto-febraban BOL-P1 corpus: gating regression | regression | true |
| WPT flagged pass lost | real flagged pass css/CSS2/backgrounds/background-applies-to-015.xht: reported, not gating, counts.flaggedPassLost 1 | reported/false; flaggedPassLost 1; verdict PASS | true |
| DEBT rules i/ii: uncovered, within ceiling, beyond ceiling | no entry -> head-regression (gates); ceiling = value -> debt (not gating); ceiling below value -> debt-exceeded (gates) | head-regression/true; debt/false; debt-exceeded/true | true |
| DEBT rule v: compensator pass deleted | entry names a pass absent from the run's passes (auto_table_compact_columns, painted_table_cell_text_baselines, table_percent_widths) -> debt-regate (gates) | debt-regate/true | true |
| DEBT rule iii: ceiling raised, entry added, entry dropped early | each transition reports a problem; removal at closesAt (control) reports none | raised 2, grown 2, dropped 1, closed-at-closesAt 0 | true |
| DEBT rule iv: vellora-owned entry without a retirement step | a problem naming closesAt | CANARY-1: owner vellora:pagination is vellora's: closesAt must name a retirement step (NN-name) | true |
| DEBT rule vi: displaced words not collapsed | two entries on one page-count criterion -> problem; a per-word entry inside a page scope -> problem; a page-1 word next to a scope from page 2 (control) -> none | twice 1, per-word 1, control 0 | true |
| relaxed (b): \|run\| > \|N0\|, unnamed compensator, no owner | each reports a problem; a valid entry (control) reports none | good 0, worse 1, unnamed 1, no owner 1 | true |
| layer-vector: word mapping misaligned by three fragments | position check share within 3 px: control >= 0.95, misaligned < 0.5 (a shift by one fragment reads 0.55 on this fixture: neighbouring lines share x; the check catches shifts of two or more) | control 1, misaligned 0.233 | true |
| layer-vector: planted +3 px pass step | the planted pass (table_percent_widths) appears as a non-zero vellora step of the word; the unplanted word (control) has none | planted [table_percent_widths, run], control [] | true |

## Pin view vs fidelity/baselines/pin (GATE-H3): merge to main BLOCKED (gating: --main)

(a) accepted artefacts 0, (b) ledger debt 0, (c) neither 206, declared rejections 0.

| group | key | before | after | tolerance | detail |
|---|---|---|---|---|---|
| corpus DANFE-M | `danfe\|DANFE-M1\|corpus\|\|criterion#1\|excessB` | 8.552 | 24.173 | 0.05 geometry-excess-mm | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): 8.552 -> 24.173 (tolerance 0.05 mm) |
| corpus DANFE-L | `danfe\|DANFE-L1a\|corpus\|\|criterion#1\|posErrMm` | 1.56 | 2.09 | 0.1 position-mm | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): 1.56 -> 2.09 (tolerance 0.1 mm) |
| corpus DANFE-L | `danfe\|DANFE-L1b\|corpus\|\|criterion#1\|posErrMm` | 3.15 | 3.68 | 0.1 position-mm | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): 3.15 -> 3.68 (tolerance 0.1 mm) |
| corpus DANFE-L | `danfe\|DANFE-L1c\|corpus\|\|criterion#1\|posErrMm` | 4.71 | 5.24 | 0.1 position-mm | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): 4.71 -> 5.24 (tolerance 0.1 mm) |
| corpus DANFE-L | `danfe\|DANFE-L1d\|corpus\|\|criterion#1\|posErrMm` | 5.96 | 6.49 | 0.1 position-mm | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): 5.96 -> 6.49 (tolerance 0.1 mm) |
| oracles:text EXT-2 | `invoice\|EXT-2\|oracles:text\|plain\|criterion#1\|statusRank.pdfminer.six` | 3 | 2 | 0 count | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): 3 -> 2 (tolerance 0 count) |
| oracles:layout REF-W | `invoice\|REF-W\|oracles:layout\|plain\|criterion#1\|p95Mm` | 1.78 | 2.51 | 0.1 position-mm | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): 1.78 -> 2.51 (tolerance 0.1 mm) |
| corpus INV-R | `oss-postmark-receipt\|INV-R1\|corpus\|\|criterion#1\|worstMm` | 5.5 | 10.26 | 0.1 position-mm | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): 5.5 -> 10.26 (tolerance 0.1 mm) |
| oracles:text EXT-2 | `oss-postmark-receipt\|EXT-2\|oracles:text\|plain\|criterion#1\|missing.pdftotext` | 35 | 38 | 0 count | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): 35 -> 38 (tolerance 0 count) |
| oracles:text EXT-2 | `oss-postmark-receipt\|EXT-2\|oracles:text\|plain\|criterion#1\|missing.pymupdf` | 37 | 40 | 0 count | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): 37 -> 40 (tolerance 0 count) |
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
| wpt css/CSS2/linebox | `wpt\|css/CSS2/linebox/line-height-061.xht` | pass | fail |  | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): pass -> fail (clean pass lost) |
| wpt css/CSS2/linebox | `wpt\|css/CSS2/linebox/line-height-062.xht` | pass | fail |  | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): pass -> fail (clean pass lost) |
| wpt css/CSS2/normal-flow | `wpt\|css/CSS2/normal-flow/block-in-inline-float-between-001.xht` | pass | fail |  | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): pass -> fail (clean pass lost) |
| wpt css/CSS2/normal-flow | `wpt\|css/CSS2/normal-flow/height-061.xht` | pass | fail |  | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): pass -> fail (clean pass lost) |
| wpt css/CSS2/normal-flow | `wpt\|css/CSS2/normal-flow/height-062.xht` | pass | fail |  | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): pass -> fail (clean pass lost) |
| wpt css/CSS2/normal-flow | `wpt\|css/CSS2/normal-flow/height-072.xht` | pass | fail |  | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): pass -> fail (clean pass lost) |
| wpt css/CSS2/normal-flow | `wpt\|css/CSS2/normal-flow/height-073.xht` | pass | fail |  | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): pass -> fail (clean pass lost) |
| wpt css/CSS2/normal-flow | `wpt\|css/CSS2/normal-flow/inline-table-zorder-001.xht` | pass | fail |  | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): pass -> fail (clean pass lost) |
| wpt css/CSS2/normal-flow | `wpt\|css/CSS2/normal-flow/max-height-061.xht` | pass | fail |  | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): pass -> fail (clean pass lost) |
| wpt css/CSS2/normal-flow | `wpt\|css/CSS2/normal-flow/max-height-062.xht` | pass | fail |  | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): pass -> fail (clean pass lost) |
| wpt css/CSS2/normal-flow | `wpt\|css/CSS2/normal-flow/max-height-072.xht` | pass | fail |  | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): pass -> fail (clean pass lost) |
| wpt css/CSS2/normal-flow | `wpt\|css/CSS2/normal-flow/max-height-073.xht` | pass | fail |  | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): pass -> fail (clean pass lost) |
| wpt css/CSS2/normal-flow | `wpt\|css/CSS2/normal-flow/min-height-061.xht` | pass | fail |  | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): pass -> fail (clean pass lost) |
| wpt css/CSS2/normal-flow | `wpt\|css/CSS2/normal-flow/min-height-062.xht` | pass | fail |  | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): pass -> fail (clean pass lost) |
| wpt css/CSS2/normal-flow | `wpt\|css/CSS2/normal-flow/min-height-072.xht` | pass | fail |  | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): pass -> fail (clean pass lost) |
| wpt css/CSS2/normal-flow | `wpt\|css/CSS2/normal-flow/min-height-073.xht` | pass | fail |  | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): pass -> fail (clean pass lost) |
| wpt css/CSS2/visuren | `wpt\|css/CSS2/visuren/float-inside-inline-between-blocks-1.html` | pass | fail |  | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): pass -> fail (clean pass lost) |
| wpt css/css-break | `wpt\|css/css-break/flexbox/flex-fragmented-with-float-descendant-001.html` | pass | fail |  | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): pass -> fail (clean pass lost) |
| wpt css/css-break | `wpt\|css/css-break/flexbox/multi-line-column-flex-fragmentation-054.html` | pass | fail |  | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): pass -> fail (clean pass lost) |
| wpt css/css-break | `wpt\|css/css-break/flexbox/multi-line-column-flex-fragmentation-055.html` | pass | fail |  | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): pass -> fail (clean pass lost) |
| wpt css/css-break | `wpt\|css/css-break/flexbox/multi-line-column-flex-fragmentation-058.html` | pass | fail |  | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): pass -> fail (clean pass lost) |
| wpt css/css-break | `wpt\|css/css-break/ruby-003.html` | pass | fail |  | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): pass -> fail (clean pass lost) |
| wpt css/css-page | `wpt\|css/css-page/layers-003-print.html` | fail | unsupported |  | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): fail -> unsupported (new strict-gate rejection, feature not recorded) |
| wpt css/css-page | `wpt\|css/css-page/layers-004-print.html` | fail | unsupported |  | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): fail -> unsupported (new strict-gate rejection, feature not recorded) |
| wpt css/css-page | `wpt\|css/css-page/monolithic-overflow-014-print.html` | pass | fail |  | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): pass -> fail (clean pass lost) |
| wpt css/css-page | `wpt\|css/css-page/page-margin-007-print.html` | fail | unsupported |  | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): fail -> unsupported (new strict-gate rejection, feature not recorded) |
| wpt css/css-page | `wpt\|css/css-page/page-size-004-print.html` | fail | unsupported |  | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): fail -> unsupported (new strict-gate rejection, feature not recorded) |
| wpt css/css-page | `wpt\|css/css-page/page-size-005-print.html` | fail | unsupported |  | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): fail -> unsupported (new strict-gate rejection, feature not recorded) |
| wpt css/css-page | `wpt\|css/css-page/page-size-009-print.html` | fail | unsupported |  | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): fail -> unsupported (new strict-gate rejection, feature not recorded) |
| wpt css/css-page | `wpt\|css/css-page/pseudo-first-margin-001-print.html` | fail | unsupported |  | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): fail -> unsupported (new strict-gate rejection, feature not recorded) |
| wpt css/css-page | `wpt\|css/css-page/pseudo-first-margin-002-print.html` | fail | unsupported |  | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): fail -> unsupported (new strict-gate rejection, feature not recorded) |
| wpt css/css-page | `wpt\|css/css-page/pseudo-first-margin-003-print.html` | fail | unsupported |  | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): fail -> unsupported (new strict-gate rejection, feature not recorded) |
| wpt css/css-page | `wpt\|css/css-page/pseudo-first-margin-004-print.html` | fail | unsupported |  | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): fail -> unsupported (new strict-gate rejection, feature not recorded) |
| wpt css/css-text | `wpt\|css/css-text/hanging-punctuation/hanging-punctuation-first-002.html` | pass | fail |  | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): pass -> fail (clean pass lost) |
| wpt css/css-text | `wpt\|css/css-text/tab-size/tab-size-integer-001.html` | pass | fail |  | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): pass -> fail (clean pass lost) |
| wpt css/css-text | `wpt\|css/css-text/tab-size/tab-size-integer-002.html` | pass | fail |  | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): pass -> fail (clean pass lost) |
| wpt css/css-text | `wpt\|css/css-text/tab-size/tab-size-integer-003.html` | pass | fail |  | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): pass -> fail (clean pass lost) |
| wpt css/css-text | `wpt\|css/css-text/text-align/text-align-end-006.html` | pass | fail |  | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): pass -> fail (clean pass lost) |
| wpt css/css-text | `wpt\|css/css-text/text-justify/text-justify-and-trailing-spaces-003.html` | pass | fail |  | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): pass -> fail (clean pass lost) |
| wpt css/css-text | `wpt\|css/css-text/text-justify/text-justify-and-trailing-spaces-004.html` | pass | fail |  | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): pass -> fail (clean pass lost) |
| wpt css/css-text | `wpt\|css/css-text/white-space/text-wrap-balance-text-indent-001.html` | pass | fail |  | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): pass -> fail (clean pass lost) |
| pdf-probe | `pdf-probe\|invoice\|p1\|DESTINATÁRIO#1\|dx` | 1.19 | -7.06 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "DESTINATÁRIO" \|dx\| 1.19 -> 7.06 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|invoice\|p1\|Borges#1\|dx` | 1.19 | -7.06 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "Borges" \|dx\| 1.19 -> 7.06 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|invoice\|p1\|&#1\|dx` | 1.19 | -7.07 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "&" \|dx\| 1.19 -> 7.07 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|invoice\|p1\|Pinto#1\|dx` | 1.2 | -7.07 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "Pinto" \|dx\| 1.2 -> 7.07 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|invoice\|p1\|Comércio#1\|dx` | 1.21 | -7.07 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "Comércio" \|dx\| 1.21 -> 7.07 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|invoice\|p1\|Ltda.#1\|dx` | 1.22 | -7.08 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "Ltda." \|dx\| 1.22 -> 7.08 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|invoice\|p1\|Cliente#1\|dx` | 1.19 | -7.06 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "Cliente" \|dx\| 1.19 -> 7.06 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|invoice\|p1\|CUST-00042#1\|dx` | 1.2 | -7.04 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "CUST-00042" \|dx\| 1.2 -> 7.04 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|invoice\|p1\|Avenida#1\|dx` | 1.19 | -7.06 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "Avenida" \|dx\| 1.19 -> 7.06 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|invoice\|p1\|Central,#1\|dx` | 1.2 | -7.04 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "Central," \|dx\| 1.2 -> 7.04 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|invoice\|p1\|4500#1\|dx` | 1.22 | -7 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "4500" \|dx\| 1.22 -> 7 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|invoice\|p1\|—#3\|dx` | 1.23 | -6.99 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "—" \|dx\| 1.23 -> 6.99 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|invoice\|p1\|Conjunto#1\|dx` | 1.23 | -6.97 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "Conjunto" \|dx\| 1.23 -> 6.97 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|invoice\|p1\|12#1\|dx` | 1.25 | -6.94 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "12" \|dx\| 1.25 -> 6.94 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|invoice\|p1\|Campinas#1\|dx` | 1.19 | -7.06 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "Campinas" \|dx\| 1.19 -> 7.06 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|invoice\|p1\|—#4\|dx` | 1.2 | -7.03 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "—" \|dx\| 1.2 -> 7.03 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|invoice\|p1\|SP#2\|dx` | 1.21 | -7.01 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "SP" \|dx\| 1.21 -> 7.01 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|invoice\|p1\|13010-111,#1\|dx` | 1.19 | -7.06 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "13010-111," \|dx\| 1.19 -> 7.06 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|invoice\|p1\|Brasil#2\|dx` | 1.2 | -7.03 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "Brasil" \|dx\| 1.2 -> 7.03 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|invoice\|p1\|CNPJ#2\|dx` | 1.19 | -7.06 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "CNPJ" \|dx\| 1.19 -> 7.06 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|invoice\|p1\|98.765.432/0001-21#1\|dx` | 1.2 | -7.04 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "98.765.432/0001-21" \|dx\| 1.2 -> 7.04 pt vs Chrome (baseline) |
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
| pdf-probe | `pdf-probe\|invoice\|p3\|Total#1\|dy` | 1.1 | -2.65 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "Total" \|dy\| 1.1 -> 2.65 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|invoice\|p3\|a#1\|dy` | 1.1 | -2.65 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "a" \|dy\| 1.1 -> 2.65 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|invoice\|p3\|pagar#1\|dy` | 1.1 | -2.65 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "pagar" \|dy\| 1.1 -> 2.65 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|invoice\|p3\|R$#14\|dy` | 1.1 | -2.65 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "R$" \|dy\| 1.1 -> 2.65 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|invoice\|p3\|50.724,90#1\|dy` | 1.1 | -2.65 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "50.724,90" \|dy\| 1.1 -> 2.65 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|notification\|p1\|Permanecendo#1\|dy` | -0.15 | 4.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "Permanecendo" \|dy\| 0.15 -> 4.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|notification\|p1\|a#4\|dy` | -0.15 | 4.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "a" \|dy\| 0.15 -> 4.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|notification\|p1\|situação#1\|dy` | -0.15 | 4.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "situação" \|dy\| 0.15 -> 4.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|notification\|p1\|sem#1\|dy` | -0.15 | 4.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "sem" \|dy\| 0.15 -> 4.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|notification\|p1\|a#5\|dy` | -0.15 | 4.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "a" \|dy\| 0.15 -> 4.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|notification\|p1\|devida#1\|dy` | -0.15 | 4.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "devida" \|dy\| 0.15 -> 4.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|notification\|p1\|regularização#3\|dy` | -0.15 | 4.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "regularização" \|dy\| 0.15 -> 4.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|notification\|p1\|após#1\|dy` | -0.15 | 4.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "após" \|dy\| 0.15 -> 4.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|notification\|p1\|o#2\|dy` | -0.15 | 4.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "o" \|dy\| 0.15 -> 4.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|notification\|p1\|prazo#2\|dy` | -0.15 | 4.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "prazo" \|dy\| 0.15 -> 4.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|notification\|p1\|acima#1\|dy` | -0.15 | 4.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "acima" \|dy\| 0.15 -> 4.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|notification\|p1\|indicado,#1\|dy` | -0.15 | 4.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "indicado," \|dy\| 0.15 -> 4.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|notification\|p1\|informamos#1\|dy` | -0.15 | 4.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "informamos" \|dy\| 0.15 -> 4.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|notification\|p1\|que#1\|dy` | -0.15 | 4.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "que" \|dy\| 0.15 -> 4.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|notification\|p1\|serão#1\|dy` | -0.15 | 4.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "serão" \|dy\| 0.15 -> 4.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|notification\|p1\|adotadas#1\|dy` | -0.15 | 4.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "adotadas" \|dy\| 0.15 -> 4.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|notification\|p1\|as#2\|dy` | -0.15 | 4.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "as" \|dy\| 0.15 -> 4.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|notification\|p1\|providências#1\|dy` | -0.15 | 4.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "providências" \|dy\| 0.15 -> 4.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|notification\|p1\|cabíveis#1\|dy` | -0.15 | 4.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "cabíveis" \|dy\| 0.15 -> 4.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|notification\|p1\|previstas#1\|dy` | -0.15 | 4.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "previstas" \|dy\| 0.15 -> 4.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|notification\|p1\|em#5\|dy` | -0.15 | 4.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "em" \|dy\| 0.15 -> 4.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|notification\|p1\|contrato#2\|dy` | -0.15 | 4.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "contrato" \|dy\| 0.15 -> 4.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|notification\|p1\|e#2\|dy` | -0.15 | 4.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "e" \|dy\| 0.15 -> 4.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|notification\|p1\|na#2\|dy` | -0.15 | 4.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "na" \|dy\| 0.15 -> 4.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|notification\|p1\|legislação#1\|dy` | -0.15 | 4.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "legislação" \|dy\| 0.15 -> 4.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|notification\|p1\|aplicável,#1\|dy` | -0.15 | 4.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "aplicável," \|dy\| 0.15 -> 4.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|notification\|p1\|sem#2\|dy` | -0.15 | 4.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "sem" \|dy\| 0.15 -> 4.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|notification\|p1\|prejuízo#1\|dy` | -0.15 | 4.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "prejuízo" \|dy\| 0.15 -> 4.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|notification\|p1\|de#7\|dy` | -0.15 | 4.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "de" \|dy\| 0.15 -> 4.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|notification\|p1\|quaisquer#1\|dy` | -0.15 | 4.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "quaisquer" \|dy\| 0.15 -> 4.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|notification\|p1\|outras#1\|dy` | -0.15 | 4.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "outras" \|dy\| 0.15 -> 4.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|notification\|p1\|medidas.#1\|dy` | -0.15 | 4.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "medidas." \|dy\| 0.15 -> 4.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|notification\|p1\|Em#1\|dy` | -0.15 | 4.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "Em" \|dy\| 0.15 -> 4.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|notification\|p1\|caso#1\|dy` | -0.15 | 4.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "caso" \|dy\| 0.15 -> 4.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|notification\|p1\|de#8\|dy` | -0.15 | 4.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "de" \|dy\| 0.15 -> 4.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|notification\|p1\|pagamento#1\|dy` | -0.15 | 4.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "pagamento" \|dy\| 0.15 -> 4.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|notification\|p1\|já#1\|dy` | -0.15 | 4.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "já" \|dy\| 0.15 -> 4.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|notification\|p1\|efetuado,#1\|dy` | -0.15 | 4.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "efetuado," \|dy\| 0.15 -> 4.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|notification\|p1\|favor#1\|dy` | -0.15 | 4.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "favor" \|dy\| 0.15 -> 4.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|notification\|p1\|desconsiderar#1\|dy` | -0.15 | 4.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "desconsiderar" \|dy\| 0.15 -> 4.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|notification\|p1\|esta#1\|dy` | -0.15 | 4.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "esta" \|dy\| 0.15 -> 4.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|notification\|p1\|comunicação#1\|dy` | -0.15 | 4.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "comunicação" \|dy\| 0.15 -> 4.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|notification\|p1\|e#3\|dy` | -0.15 | 4.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "e" \|dy\| 0.15 -> 4.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|notification\|p1\|encaminhar#1\|dy` | -0.15 | 4.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "encaminhar" \|dy\| 0.15 -> 4.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|notification\|p1\|o#3\|dy` | -0.15 | 4.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "o" \|dy\| 0.15 -> 4.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|notification\|p1\|respectivo#1\|dy` | -0.15 | 4.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "respectivo" \|dy\| 0.15 -> 4.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|notification\|p1\|comprovante#1\|dy` | -0.15 | 4.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "comprovante" \|dy\| 0.15 -> 4.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|notification\|p1\|para#2\|dy` | -0.15 | 4.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "para" \|dy\| 0.15 -> 4.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|notification\|p1\|cobranca@exemplo-acme.test.#1\|dy` | -0.15 | 4.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "cobranca@exemplo-acme.test." \|dy\| 0.15 -> 4.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|notification\|p1\|Segue,#1\|dy` | 0.35 | 4.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "Segue," \|dy\| 0.35 -> 4.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|notification\|p1\|em#6\|dy` | 0.35 | 4.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "em" \|dy\| 0.35 -> 4.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|notification\|p1\|anexo,#1\|dy` | 0.35 | 4.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "anexo," \|dy\| 0.35 -> 4.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|notification\|p1\|demonstrativo#1\|dy` | 0.35 | 4.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "demonstrativo" \|dy\| 0.35 -> 4.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|notification\|p1\|detalhado#1\|dy` | 0.35 | 4.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "detalhado" \|dy\| 0.35 -> 4.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|notification\|p1\|do#2\|dy` | 0.35 | 4.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "do" \|dy\| 0.35 -> 4.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|notification\|p1\|débito#1\|dy` | 0.35 | 4.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "débito" \|dy\| 0.35 -> 4.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|notification\|p1\|para#3\|dy` | 0.35 | 4.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "para" \|dy\| 0.35 -> 4.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|notification\|p1\|sua#1\|dy` | 0.35 | 4.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "sua" \|dy\| 0.35 -> 4.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|notification\|p1\|conferência.#1\|dy` | 0.35 | 4.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "conferência." \|dy\| 0.35 -> 4.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|notification\|p1\|Sendo#1\|dy` | 0.1 | 4.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "Sendo" \|dy\| 0.1 -> 4.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|notification\|p1\|o#4\|dy` | 0.1 | 4.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "o" \|dy\| 0.1 -> 4.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|notification\|p1\|que#2\|dy` | 0.1 | 4.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "que" \|dy\| 0.1 -> 4.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|notification\|p1\|se#1\|dy` | 0.1 | 4.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "se" \|dy\| 0.1 -> 4.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|notification\|p1\|apresenta#1\|dy` | 0.1 | 4.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "apresenta" \|dy\| 0.1 -> 4.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|notification\|p1\|para#4\|dy` | 0.1 | 4.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "para" \|dy\| 0.1 -> 4.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|notification\|p1\|o#5\|dy` | 0.1 | 4.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "o" \|dy\| 0.1 -> 4.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|notification\|p1\|momento,#1\|dy` | 0.1 | 4.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "momento," \|dy\| 0.1 -> 4.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|notification\|p1\|colocamo-nos#1\|dy` | 0.1 | 4.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "colocamo-nos" \|dy\| 0.1 -> 4.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|notification\|p1\|à#2\|dy` | 0.1 | 4.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "à" \|dy\| 0.1 -> 4.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|notification\|p1\|disposição#1\|dy` | 0.1 | 4.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "disposição" \|dy\| 0.1 -> 4.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|notification\|p1\|para#5\|dy` | 0.1 | 4.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "para" \|dy\| 0.1 -> 4.85 pt vs Chrome (baseline) |
| … | 6 more in gate-report.json | | | | |

## WPT per directory (pass / clean pass)

| directory | pass before | pass after | clean before | clean after |
|---|---|---|---|---|
| css/CSS2/abspos | 3 | 2 | 3 | 2 |
| css/CSS2/backgrounds | 179 | 175 | 60 | 67 |
| css/CSS2/borders | 322 | 383 | 292 | 354 |
| css/CSS2/box | 4 | 4 | 0 | 0 |
| css/CSS2/box-display | 49 | 65 | 49 | 65 |
| css/CSS2/colors | 6 | 10 | 6 | 10 |
| css/CSS2/floats | 21 | 19 | 17 | 16 |
| css/CSS2/floats-clear | 28 | 38 | 24 | 33 |
| css/CSS2/fonts | 108 | 135 | 106 | 135 |
| css/CSS2/generated-content | 23 | 82 | 20 | 78 |
| css/CSS2/linebox | 15 | 126 | 14 | 124 |
| css/CSS2/lists | 67 | 67 | 39 | 40 |
| css/CSS2/margin-padding-clear | 404 | 525 | 391 | 508 |
| css/CSS2/normal-flow | 383 | 431 | 360 | 405 |
| css/CSS2/pagination | 19 | 33 | 17 | 31 |
| css/CSS2/positioning | 172 | 361 | 169 | 359 |
| css/CSS2/tables | 18 | 77 | 17 | 74 |
| css/CSS2/text | 170 | 247 | 161 | 238 |
| css/CSS2/visudet | 13 | 14 | 6 | 9 |
| css/CSS2/visufx | 1 | 2 | 1 | 2 |
| css/CSS2/visuren | 2 | 6 | 2 | 6 |
| css/css-break | 86 | 115 | 66 | 81 |
| css/css-page | 62 | 70 | 46 | 55 |
| css/css-tables | 31 | 47 | 23 | 38 |
| css/css-text | 392 | 630 | 99 | 377 |

## Per group

| group | classes |
|---|---|
| canaries | added 6 |
| corpus BOL-B | improvement 4 |
| corpus BOL-R | improvement 2 |
| corpus BOL-X | improvement 8 |
| corpus DANFE-B | improvement 7 |
| corpus DANFE-L | regression 4 |
| corpus DANFE-M | regression 1 |
| corpus DANFE-X | improvement 3 |
| corpus INV-I | improvement 2 |
| corpus INV-R | regression 1, improvement 1 |
| corpus LET- | added 1 |
| corpus TXT-R | improvement 2 |
| oracles:barcode DANFE-B1 | newly-measured 1 |
| oracles:layout LET-1 | added 2 |
| oracles:layout LET-2 | added 2 |
| oracles:layout LET-3 | added 1 |
| oracles:layout REF-W | improvement 14, within-tolerance 1, regression 1 |
| oracles:layout TXT-B1 | added 1 |
| oracles:text EXT-2 | improvement 30, regression 3 |
| pdf-probe | not-comparable 7, within-tolerance 393, improvement 466, regression 140, newly-measured 4 |
| wpt crashtests | not-comparable 1 |
| wpt css/CSS2/abspos | regression 1 |
| wpt css/CSS2/backgrounds | improvement 32, reported 36 |
| wpt css/CSS2/borders | improvement 62 |
| wpt css/CSS2/box-display | improvement 16, changed 1 |
| wpt css/CSS2/colors | improvement 4 |
| wpt css/CSS2/floats | regression 6, improvement 5 |
| wpt css/CSS2/floats-clear | reported 1, regression 3, improvement 14 |
| wpt css/CSS2/fonts | improvement 29 |
| wpt css/CSS2/generated-content | improvement 63, regression 4 |
| wpt css/CSS2/linebox | improvement 114, regression 3 |
| wpt css/CSS2/lists | improvement 1 |
| wpt css/CSS2/margin-padding-clear | improvement 121 |
| wpt css/CSS2/normal-flow | improvement 65, regression 14, reported 2, changed 5 |
| wpt css/CSS2/pagination | improvement 14 |
| wpt css/CSS2/positioning | improvement 190, reported 1 |
| wpt css/CSS2/tables | improvement 59 |
| wpt css/CSS2/text | improvement 78, changed 1 |
| wpt css/CSS2/visudet | improvement 4, reported 2, changed 2 |
| wpt css/CSS2/visufx | improvement 1 |
| wpt css/CSS2/visuren | improvement 5, regression 1 |
| wpt css/css-break | improvement 34, regression 5, changed 1 |
| wpt css/css-page | rejection 10, improvement 12, regression 1, changed 2, reported 2 |
| wpt css/css-tables | improvement 16 |
| wpt css/css-text | changed 8, regression 8, improvement 314, reported 54 |

## Tolerances

| class | tolerance | label | rationale |
|---|---|---|---|
| position-mm | 0.1 mm | DESIGN TARGET | word/anchor position error vs a reference (REF-W max/p95, REF-R worst anchor, DANFE-L1, LET-1). 0.1 mm (0.28 pt, 0.38 CSS px) is 10x the 0.01 mm the values are reported with and below one CSS px (0.26 mm), the smallest step a px-snapping layout can move; the measurement is deterministic for one build and one reference (CONFIRMED: equal inputs gave equal values in the Phase A repeat run). |
| geometry-excess-mm | 0.05 mm | DESIGN TARGET | distance OUTSIDE a specification window (BOL-G*, DANFE-B*, DANFE-M1, TXT-A1). Inside the window the spec admits any value, so only the excess is ratcheted; 0.05 mm is about one 600 dpi raster pixel (0.042 mm), the measurement quantum of measure_bars.py / the page ink box. |
| font-excess-pt | 0.05 pt | SPEC-derived tolerance unit | font-size excess outside a window; 0.05 pt is the tolerance ACCEPTANCE.md already applies to every font-size criterion (BOL-T*, DANFE-F*). |
| count | 0 count | DESIGN TARGET | integer counts from deterministic tools (required strings found, extractor missing/extra tokens, segments/glyphs attributed, decoded symbols): any loss is a real change of the document. |
| page-delta | 0 pages | DESIGN TARGET | \|vellora pages - reference pages\|: a page break moving is never noise. |
| pdf-probe-pt | 1 pt | DESIGN TARGET | per-word \|dx\| / \|dy\| of vellora's PDF vs Chrome's PDF (pdf-probe semantics 2: PyMuPDF pen origin and baseline, same-page position pairs keyed by the Chrome word). 1 pt (0.35 mm) is an order of magnitude below the Phase A regressions it must catch (invoice price column +9 pt, notification signature -14 pt) and above the 0.01 pt rounding of the probe and sub-px snapping differences. The per-fixture unpaired-word counts use the count class. |

