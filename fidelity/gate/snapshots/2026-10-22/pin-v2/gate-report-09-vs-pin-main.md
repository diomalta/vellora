# Fidelity gate report

**Verdict: FAIL** (809 gating item(s) vs the previous link; 98 flagged WPT pass(es) lost, reported, not gating; 1054 value(s) worse within tolerance, listed, not gating; pin view: merge to main BLOCKED, 809 (c) item(s)). Local macOS runs are INDICATIVE.

| field | value |
|---|---|
| date | 2026-10-22T22:32:32.413Z |
| command | `node fidelity/gate/run.mjs --baseline fidelity/baselines/pin --run fidelity/baselines/port/09-review-fixes --accept fidelity/baselines/port/09-review-fixes/manifest.json --no-head --pin fidelity/baselines/pin --main --layout-from ~/.cache/vellora-fidelity/run-all-09-review-fixes-20261021T205223Z --step 09-review-fixes --out <scratch>/09-vs-pin-main` |
| baseline | fidelity/baselines/pin (vellora-fidelity/baseline-pin/1/manifest) |
| run | fidelity/baselines/port/09-review-fixes (vellora-fidelity/baseline/2) |

Counts: improvement 2685, newly-measured 1057, added 13, regression 799, within-tolerance 1054, reported 98, changed 20, rejection 10, not-comparable 1, gating 809, headGating 0, debt 0, flaggedPassLost 98, unchanged 7432, withinTolerance 1054, withinToleranceBetter 455, pinA 0, pinB 0, pinC 809.

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
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|Data#1\|dy` | -0.24 | 2.17 | 1 pdf-probe-pt | "Data" \|dy\| 0.24 -> 2.17 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|do#5\|dy` | -0.24 | 2.17 | 1 pdf-probe-pt | "do" \|dy\| 0.24 -> 2.17 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|documento#1\|dy` | -0.24 | 2.17 | 1 pdf-probe-pt | "documento" \|dy\| 0.24 -> 2.17 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|Nr.#1\|dy` | -0.24 | 2.17 | 1 pdf-probe-pt | "Nr." \|dy\| 0.24 -> 2.17 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|do#6\|dy` | -0.24 | 2.17 | 1 pdf-probe-pt | "do" \|dy\| 0.24 -> 2.17 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|documento#2\|dy` | -0.24 | 2.17 | 1 pdf-probe-pt | "documento" \|dy\| 0.24 -> 2.17 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|Aceite#1\|dy` | -0.24 | 2.17 | 1 pdf-probe-pt | "Aceite" \|dy\| 0.24 -> 2.17 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|Data#2\|dy` | -0.24 | 2.17 | 1 pdf-probe-pt | "Data" \|dy\| 0.24 -> 2.17 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|do#7\|dy` | -0.24 | 2.17 | 1 pdf-probe-pt | "do" \|dy\| 0.24 -> 2.17 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|processamento#1\|dy` | -0.24 | 2.17 | 1 pdf-probe-pt | "processamento" \|dy\| 0.24 -> 2.17 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|15/10/2026#1\|dy` | -0.24 | 2.17 | 1 pdf-probe-pt | "15/10/2026" \|dy\| 0.24 -> 2.17 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|NF-2026/00417#1\|dy` | -0.24 | 2.17 | 1 pdf-probe-pt | "NF-2026/00417" \|dy\| 0.24 -> 2.17 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|N#1\|dy` | -0.24 | 2.17 | 1 pdf-probe-pt | "N" \|dy\| 0.24 -> 2.17 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|15/10/2026#2\|dy` | -0.24 | 2.17 | 1 pdf-probe-pt | "15/10/2026" \|dy\| 0.24 -> 2.17 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|Pagador#2\|dy` | 0.51 | 2.92 | 1 pdf-probe-pt | "Pagador" \|dy\| 0.51 -> 2.92 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|Maria#1\|dy` | 0.51 | 2.92 | 1 pdf-probe-pt | "Maria" \|dy\| 0.51 -> 2.92 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|da#1\|dy` | 0.51 | 2.92 | 1 pdf-probe-pt | "da" \|dy\| 0.51 -> 2.92 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|Conceição#1\|dy` | 0.51 | 2.92 | 1 pdf-probe-pt | "Conceição" \|dy\| 0.51 -> 2.92 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|Exemplo#2\|dy` | 0.51 | 2.92 | 1 pdf-probe-pt | "Exemplo" \|dy\| 0.51 -> 2.92 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|Carteira#1\|dy` | 1.26 | 3.67 | 1 pdf-probe-pt | "Carteira" \|dy\| 1.26 -> 3.67 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|Espécie#1\|dy` | 1.26 | 3.67 | 1 pdf-probe-pt | "Espécie" \|dy\| 1.26 -> 3.67 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|Vencimento#1\|dy` | 1.26 | 3.67 | 1 pdf-probe-pt | "Vencimento" \|dy\| 1.26 -> 3.67 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|Valor#1\|dy` | 1.26 | 3.67 | 1 pdf-probe-pt | "Valor" \|dy\| 1.26 -> 3.67 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|do#9\|dy` | 1.26 | 3.67 | 1 pdf-probe-pt | "do" \|dy\| 1.26 -> 3.67 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|Documento#1\|dy` | 1.26 | 3.67 | 1 pdf-probe-pt | "Documento" \|dy\| 1.26 -> 3.67 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|RG#1\|dy` | 1.26 | 3.67 | 1 pdf-probe-pt | "RG" \|dy\| 1.26 -> 3.67 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|R$#1\|dy` | 1.26 | 3.67 | 1 pdf-probe-pt | "R$" \|dy\| 1.26 -> 3.67 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|30/11/2026#1\|dy` | 1.26 | 3.67 | 1 pdf-probe-pt | "30/11/2026" \|dy\| 1.26 -> 3.67 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|1.842,50#1\|dy` | 1.26 | 3.67 | 1 pdf-probe-pt | "1.842,50" \|dy\| 1.26 -> 3.67 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|Referência#1\|dy` | 1.26 | 4.42 | 1 pdf-probe-pt | "Referência" \|dy\| 1.26 -> 4.42 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|10/2026#1\|dy` | 0.51 | 3.67 | 1 pdf-probe-pt | "10/2026" \|dy\| 0.51 -> 3.67 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|10/2026#2\|dy` | 0.51 | 3.67 | 1 pdf-probe-pt | "10/2026" \|dy\| 0.51 -> 3.67 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|10/2026#3\|dy` | 1.26 | 4.42 | 1 pdf-probe-pt | "10/2026" \|dy\| 1.26 -> 4.42 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|Autenticação#1\|dy` | 2.76 | 6.67 | 1 pdf-probe-pt | "Autenticação" \|dy\| 2.76 -> 6.67 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|Mecânica#1\|dy` | 2.76 | 6.67 | 1 pdf-probe-pt | "Mecânica" \|dy\| 2.76 -> 6.67 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|—#5\|dy` | 2.76 | 6.67 | 1 pdf-probe-pt | "—" \|dy\| 2.76 -> 6.67 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|Recibo#2\|dy` | 2.76 | 6.67 | 1 pdf-probe-pt | "Recibo" \|dy\| 2.76 -> 6.67 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|do#10\|dy` | 2.76 | 6.67 | 1 pdf-probe-pt | "do" \|dy\| 2.76 -> 6.67 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|Pagador#4\|dy` | 2.76 | 6.67 | 1 pdf-probe-pt | "Pagador" \|dy\| 2.76 -> 6.67 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|99990.00001#2\|dy` | 0.19 | 2.74 | 1 pdf-probe-pt | "99990.00001" \|dy\| 0.19 -> 2.74 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|23456.700001#2\|dy` | 0.19 | 2.74 | 1 pdf-probe-pt | "23456.700001" \|dy\| 0.19 -> 2.74 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|00000.000420#2\|dy` | 0.19 | 2.74 | 1 pdf-probe-pt | "00000.000420" \|dy\| 0.19 -> 2.74 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|1#2\|dy` | 0.19 | 2.74 | 1 pdf-probe-pt | "1" \|dy\| 0.19 -> 2.74 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|99990000012345#2\|dy` | 0.19 | 2.74 | 1 pdf-probe-pt | "99990000012345" \|dy\| 0.19 -> 2.74 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|CARTEIRA#1\|dy` | -3.47 | 5.6 | 1 pdf-probe-pt | "CARTEIRA" \|dy\| 3.47 -> 5.6 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|ESPÉCIE#2\|dy` | -3.47 | 5.6 | 1 pdf-probe-pt | "ESPÉCIE" \|dy\| 3.47 -> 5.6 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|MOEDA#1\|dy` | -3.47 | 5.6 | 1 pdf-probe-pt | "MOEDA" \|dy\| 3.47 -> 5.6 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|QUANTIDADE#1\|dy` | -3.47 | 5.6 | 1 pdf-probe-pt | "QUANTIDADE" \|dy\| 3.47 -> 5.6 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|17#1\|dy` | -3.47 | 6.35 | 1 pdf-probe-pt | "17" \|dy\| 3.47 -> 6.35 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|R$#2\|dy` | -3.47 | 6.35 | 1 pdf-probe-pt | "R$" \|dy\| 3.47 -> 6.35 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|1#3\|dy` | -3.47 | 6.35 | 1 pdf-probe-pt | "1" \|dy\| 3.47 -> 6.35 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|R$#3\|dy` | -3.47 | 6.35 | 1 pdf-probe-pt | "R$" \|dy\| 3.47 -> 6.35 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|1.842,50#2\|dy` | -3.47 | 6.35 | 1 pdf-probe-pt | "1.842,50" \|dy\| 3.47 -> 6.35 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|INSTRUÇÕES#1\|dy` | -1.97 | 7.1 | 1 pdf-probe-pt | "INSTRUÇÕES" \|dy\| 1.97 -> 7.1 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|(TEXTO#1\|dy` | -1.97 | 7.1 | 1 pdf-probe-pt | "(TEXTO" \|dy\| 1.97 -> 7.1 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|DE#2\|dy` | -1.97 | 7.1 | 1 pdf-probe-pt | "DE" \|dy\| 1.97 -> 7.1 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|RESPONSABILIDADE#1\|dy` | -1.97 | 7.1 | 1 pdf-probe-pt | "RESPONSABILIDADE" \|dy\| 1.97 -> 7.1 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|DO#8\|dy` | -1.97 | 7.1 | 1 pdf-probe-pt | "DO" \|dy\| 1.97 -> 7.1 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|BENEFICIÁRIO)#1\|dy` | -1.97 | 7.1 | 1 pdf-probe-pt | "BENEFICIÁRIO)" \|dy\| 1.97 -> 7.1 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|•#1\|dy` | -1.97 | 7.85 | 1 pdf-probe-pt | "•" \|dy\| 1.97 -> 7.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|Não#1\|dy` | -1.97 | 7.85 | 1 pdf-probe-pt | "Não" \|dy\| 1.97 -> 7.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|receber#1\|dy` | -1.97 | 7.85 | 1 pdf-probe-pt | "receber" \|dy\| 1.97 -> 7.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|após#1\|dy` | -1.97 | 7.85 | 1 pdf-probe-pt | "após" \|dy\| 1.97 -> 7.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|30#1\|dy` | -1.97 | 7.85 | 1 pdf-probe-pt | "30" \|dy\| 1.97 -> 7.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|dias#1\|dy` | -1.97 | 7.85 | 1 pdf-probe-pt | "dias" \|dy\| 1.97 -> 7.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|do#1\|dy` | -1.97 | 7.85 | 1 pdf-probe-pt | "do" \|dy\| 1.97 -> 7.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|vencimento.#1\|dy` | -1.97 | 7.85 | 1 pdf-probe-pt | "vencimento." \|dy\| 1.97 -> 7.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|R$#4\|dy` | -1.97 | 7.85 | 1 pdf-probe-pt | "R$" \|dy\| 1.97 -> 7.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|0,00#1\|dy` | -1.97 | 7.85 | 1 pdf-probe-pt | "0,00" \|dy\| 1.97 -> 7.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|•#2\|dy` | -2.72 | 7.1 | 1 pdf-probe-pt | "•" \|dy\| 2.72 -> 7.1 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|Após#1\|dy` | -2.72 | 7.1 | 1 pdf-probe-pt | "Após" \|dy\| 2.72 -> 7.1 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|o#2\|dy` | -2.72 | 7.1 | 1 pdf-probe-pt | "o" \|dy\| 2.72 -> 7.1 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|vencimento,#1\|dy` | -2.72 | 7.1 | 1 pdf-probe-pt | "vencimento," \|dy\| 2.72 -> 7.1 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|cobrar#1\|dy` | -2.72 | 7.1 | 1 pdf-probe-pt | "cobrar" \|dy\| 2.72 -> 7.1 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|multa#1\|dy` | -2.72 | 7.1 | 1 pdf-probe-pt | "multa" \|dy\| 2.72 -> 7.1 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|de#3\|dy` | -2.72 | 7.1 | 1 pdf-probe-pt | "de" \|dy\| 2.72 -> 7.1 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|2%#1\|dy` | -2.72 | 7.1 | 1 pdf-probe-pt | "2%" \|dy\| 2.72 -> 7.1 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|e#1\|dy` | -2.72 | 7.1 | 1 pdf-probe-pt | "e" \|dy\| 2.72 -> 7.1 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|mora#1\|dy` | -2.72 | 7.1 | 1 pdf-probe-pt | "mora" \|dy\| 2.72 -> 7.1 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|de#4\|dy` | -2.72 | 7.1 | 1 pdf-probe-pt | "de" \|dy\| 2.72 -> 7.1 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|1%#1\|dy` | -2.72 | 7.1 | 1 pdf-probe-pt | "1%" \|dy\| 2.72 -> 7.1 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|ao#1\|dy` | -2.72 | 7.1 | 1 pdf-probe-pt | "ao" \|dy\| 2.72 -> 7.1 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|mês.#1\|dy` | -2.72 | 7.1 | 1 pdf-probe-pt | "mês." \|dy\| 2.72 -> 7.1 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|•#3\|dy` | -2.72 | 7.1 | 1 pdf-probe-pt | "•" \|dy\| 2.72 -> 7.1 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|Em#1\|dy` | -2.72 | 7.1 | 1 pdf-probe-pt | "Em" \|dy\| 2.72 -> 7.1 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|caso#1\|dy` | -2.72 | 7.1 | 1 pdf-probe-pt | "caso" \|dy\| 2.72 -> 7.1 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|de#5\|dy` | -2.72 | 7.1 | 1 pdf-probe-pt | "de" \|dy\| 2.72 -> 7.1 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|dúvida#1\|dy` | -2.72 | 7.1 | 1 pdf-probe-pt | "dúvida" \|dy\| 2.72 -> 7.1 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|sobre#1\|dy` | -2.72 | 7.1 | 1 pdf-probe-pt | "sobre" \|dy\| 2.72 -> 7.1 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|este#1\|dy` | -2.72 | 7.1 | 1 pdf-probe-pt | "este" \|dy\| 2.72 -> 7.1 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|documento#1\|dy` | -2.72 | 7.1 | 1 pdf-probe-pt | "documento" \|dy\| 2.72 -> 7.1 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|de#6\|dy` | -2.72 | 7.1 | 1 pdf-probe-pt | "de" \|dy\| 2.72 -> 7.1 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|teste,#1\|dy` | -2.72 | 7.1 | 1 pdf-probe-pt | "teste," \|dy\| 2.72 -> 7.1 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|contate#1\|dy` | -2.72 | 7.1 | 1 pdf-probe-pt | "contate" \|dy\| 2.72 -> 7.1 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|o#3\|dy` | -2.72 | 7.1 | 1 pdf-probe-pt | "o" \|dy\| 2.72 -> 7.1 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|emissor#1\|dy` | -2.72 | 7.1 | 1 pdf-probe-pt | "emissor" \|dy\| 2.72 -> 7.1 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|fictício.#1\|dy` | -2.72 | 7.1 | 1 pdf-probe-pt | "fictício." \|dy\| 2.72 -> 7.1 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|R$#5\|dy` | -1.22 | 8.6 | 1 pdf-probe-pt | "R$" \|dy\| 1.22 -> 8.6 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|0,00#2\|dy` | -1.22 | 8.6 | 1 pdf-probe-pt | "0,00" \|dy\| 1.22 -> 8.6 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|Desconto#1\|dy` | -1.97 | 7.85 | 1 pdf-probe-pt | "Desconto" \|dy\| 1.97 -> 7.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|de#7\|dy` | -1.97 | 7.85 | 1 pdf-probe-pt | "de" \|dy\| 1.97 -> 7.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|R$#6\|dy` | -1.97 | 7.85 | 1 pdf-probe-pt | "R$" \|dy\| 1.97 -> 7.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|92,13#1\|dy` | -1.97 | 7.85 | 1 pdf-probe-pt | "92,13" \|dy\| 1.97 -> 7.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|para#1\|dy` | -1.97 | 7.85 | 1 pdf-probe-pt | "para" \|dy\| 1.97 -> 7.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|pagamento#1\|dy` | -1.97 | 7.85 | 1 pdf-probe-pt | "pagamento" \|dy\| 1.97 -> 7.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|até#2\|dy` | -1.97 | 7.85 | 1 pdf-probe-pt | "até" \|dy\| 1.97 -> 7.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|05/07/2026.#1\|dy` | -1.97 | 7.85 | 1 pdf-probe-pt | "05/07/2026." \|dy\| 1.97 -> 7.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|R$#7\|dy` | 0.28 | 10.1 | 1 pdf-probe-pt | "R$" \|dy\| 0.28 -> 10.1 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|0,00#3\|dy` | 0.28 | 10.1 | 1 pdf-probe-pt | "0,00" \|dy\| 0.28 -> 10.1 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|R$#8\|dy` | 1.78 | 11.6 | 1 pdf-probe-pt | "R$" \|dy\| 1.78 -> 11.6 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|1.842,50#3\|dy` | 1.78 | 11.6 | 1 pdf-probe-pt | "1.842,50" \|dy\| 1.78 -> 11.6 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|PAGADOR#2\|dy` | 4.78 | 13.85 | 1 pdf-probe-pt | "PAGADOR" \|dy\| 4.78 -> 13.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|Maria#1\|dy` | 4.03 | 13.85 | 1 pdf-probe-pt | "Maria" \|dy\| 4.03 -> 13.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|das#1\|dy` | 4.03 | 13.85 | 1 pdf-probe-pt | "das" \|dy\| 4.03 -> 13.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|Couves#1\|dy` | 4.03 | 13.85 | 1 pdf-probe-pt | "Couves" \|dy\| 4.03 -> 13.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|Exemplo#1\|dy` | 4.03 | 13.85 | 1 pdf-probe-pt | "Exemplo" \|dy\| 4.03 -> 13.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|—#3\|dy` | 4.03 | 13.85 | 1 pdf-probe-pt | "—" \|dy\| 4.03 -> 13.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|CPF#1\|dy` | 4.03 | 13.85 | 1 pdf-probe-pt | "CPF" \|dy\| 4.03 -> 13.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|123.456.789-09#1\|dy` | 4.03 | 13.85 | 1 pdf-probe-pt | "123.456.789-09" \|dy\| 4.03 -> 13.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|Rua#1\|dy` | 4.03 | 13.85 | 1 pdf-probe-pt | "Rua" \|dy\| 4.03 -> 13.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|das#2\|dy` | 4.03 | 13.85 | 1 pdf-probe-pt | "das" \|dy\| 4.03 -> 13.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|Flores,#1\|dy` | 4.03 | 13.85 | 1 pdf-probe-pt | "Flores," \|dy\| 4.03 -> 13.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|123#1\|dy` | 4.03 | 13.85 | 1 pdf-probe-pt | "123" \|dy\| 4.03 -> 13.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|—#4\|dy` | 4.03 | 13.85 | 1 pdf-probe-pt | "—" \|dy\| 4.03 -> 13.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|Jardim#1\|dy` | 4.03 | 13.85 | 1 pdf-probe-pt | "Jardim" \|dy\| 4.03 -> 13.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|Sintético#1\|dy` | 4.03 | 13.85 | 1 pdf-probe-pt | "Sintético" \|dy\| 4.03 -> 13.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|Cidade#1\|dy` | 4.03 | 13.85 | 1 pdf-probe-pt | "Cidade" \|dy\| 4.03 -> 13.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|Exemplo#2\|dy` | 4.03 | 13.85 | 1 pdf-probe-pt | "Exemplo" \|dy\| 4.03 -> 13.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|/#7\|dy` | 4.03 | 13.85 | 1 pdf-probe-pt | "/" \|dy\| 4.03 -> 13.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|SP#1\|dy` | 4.03 | 13.85 | 1 pdf-probe-pt | "SP" \|dy\| 4.03 -> 13.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|—#5\|dy` | 4.03 | 13.85 | 1 pdf-probe-pt | "—" \|dy\| 4.03 -> 13.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|CEP#1\|dy` | 4.03 | 13.85 | 1 pdf-probe-pt | "CEP" \|dy\| 4.03 -> 13.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|01234-567#1\|dy` | 4.03 | 13.85 | 1 pdf-probe-pt | "01234-567" \|dy\| 4.03 -> 13.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|REFERÊNCIA#1\|dy` | 6.28 | 15.35 | 1 pdf-probe-pt | "REFERÊNCIA" \|dy\| 6.28 -> 15.35 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|DESCRIÇÃO#1\|dy` | 6.28 | 15.35 | 1 pdf-probe-pt | "DESCRIÇÃO" \|dy\| 6.28 -> 15.35 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|VALOR#4\|dy` | 6.28 | 15.35 | 1 pdf-probe-pt | "VALOR" \|dy\| 6.28 -> 15.35 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|06/2026#1\|dy` | 5.53 | 15.35 | 1 pdf-probe-pt | "06/2026" \|dy\| 5.53 -> 15.35 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|Assinatura#1\|dy` | 5.53 | 15.35 | 1 pdf-probe-pt | "Assinatura" \|dy\| 5.53 -> 15.35 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|plano#1\|dy` | 5.53 | 15.35 | 1 pdf-probe-pt | "plano" \|dy\| 5.53 -> 15.35 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|Widget#1\|dy` | 5.53 | 15.35 | 1 pdf-probe-pt | "Widget" \|dy\| 5.53 -> 15.35 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|Pro#1\|dy` | 5.53 | 15.35 | 1 pdf-probe-pt | "Pro" \|dy\| 5.53 -> 15.35 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|R$#9\|dy` | 5.53 | 15.35 | 1 pdf-probe-pt | "R$" \|dy\| 5.53 -> 15.35 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|1.499,00#1\|dy` | 5.53 | 15.35 | 1 pdf-probe-pt | "1.499,00" \|dy\| 5.53 -> 15.35 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|06/2026#2\|dy` | 7.03 | 16.1 | 1 pdf-probe-pt | "06/2026" \|dy\| 7.03 -> 16.1 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|Usuários#1\|dy` | 7.03 | 16.1 | 1 pdf-probe-pt | "Usuários" \|dy\| 7.03 -> 16.1 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|adicionais#1\|dy` | 7.03 | 16.1 | 1 pdf-probe-pt | "adicionais" \|dy\| 7.03 -> 16.1 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|(3x)#1\|dy` | 7.03 | 16.1 | 1 pdf-probe-pt | "(3x)" \|dy\| 7.03 -> 16.1 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|R$#10\|dy` | 7.03 | 16.1 | 1 pdf-probe-pt | "R$" \|dy\| 7.03 -> 16.1 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|297,00#1\|dy` | 7.03 | 16.1 | 1 pdf-probe-pt | "297,00" \|dy\| 7.03 -> 16.1 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|06/2026#3\|dy` | 7.03 | 16.85 | 1 pdf-probe-pt | "06/2026" \|dy\| 7.03 -> 16.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|Taxa#1\|dy` | 7.03 | 16.85 | 1 pdf-probe-pt | "Taxa" \|dy\| 7.03 -> 16.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|de#8\|dy` | 7.03 | 16.85 | 1 pdf-probe-pt | "de" \|dy\| 7.03 -> 16.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|processamento#1\|dy` | 7.03 | 16.85 | 1 pdf-probe-pt | "processamento" \|dy\| 7.03 -> 16.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|R$#11\|dy` | 7.03 | 16.85 | 1 pdf-probe-pt | "R$" \|dy\| 7.03 -> 16.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|46,50#1\|dy` | 7.03 | 16.85 | 1 pdf-probe-pt | "46,50" \|dy\| 7.03 -> 16.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|CÓDIGO#3\|dy` | 10.03 | 19.85 | 1 pdf-probe-pt | "CÓDIGO" \|dy\| 10.03 -> 19.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|DE#3\|dy` | 10.03 | 19.85 | 1 pdf-probe-pt | "DE" \|dy\| 10.03 -> 19.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|BARRAS#1\|dy` | 10.03 | 19.85 | 1 pdf-probe-pt | "BARRAS" \|dy\| 10.03 -> 19.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|(REPRESENTAÇÃO#1\|dy` | 10.03 | 19.85 | 1 pdf-probe-pt | "(REPRESENTAÇÃO" \|dy\| 10.03 -> 19.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|TEXTUAL#1\|dy` | 10.03 | 19.85 | 1 pdf-probe-pt | "TEXTUAL" \|dy\| 10.03 -> 19.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|—#6\|dy` | 10.03 | 19.85 | 1 pdf-probe-pt | "—" \|dy\| 10.03 -> 19.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|NÃO#1\|dy` | 10.03 | 19.85 | 1 pdf-probe-pt | "NÃO" \|dy\| 10.03 -> 19.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|ESCANEÁVEL)#1\|dy` | 10.03 | 19.85 | 1 pdf-probe-pt | "ESCANEÁVEL)" \|dy\| 10.03 -> 19.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|9#1\|dy` | 10.62 | 19.85 | 1 pdf-probe-pt | "9" \|dy\| 10.62 -> 19.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|9#2\|dy` | 10.62 | 19.85 | 1 pdf-probe-pt | "9" \|dy\| 10.62 -> 19.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|9#3\|dy` | 10.62 | 19.85 | 1 pdf-probe-pt | "9" \|dy\| 10.62 -> 19.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|9#4\|dy` | 10.62 | 19.85 | 1 pdf-probe-pt | "9" \|dy\| 10.62 -> 19.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|1#4\|dy` | 10.62 | 19.85 | 1 pdf-probe-pt | "1" \|dy\| 10.62 -> 19.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|9#5\|dy` | 10.62 | 19.85 | 1 pdf-probe-pt | "9" \|dy\| 10.62 -> 19.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|9#6\|dy` | 10.62 | 19.85 | 1 pdf-probe-pt | "9" \|dy\| 10.62 -> 19.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|9#7\|dy` | 10.62 | 19.85 | 1 pdf-probe-pt | "9" \|dy\| 10.62 -> 19.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|9#8\|dy` | 10.62 | 19.85 | 1 pdf-probe-pt | "9" \|dy\| 10.62 -> 19.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|0#1\|dy` | 10.62 | 19.85 | 1 pdf-probe-pt | "0" \|dy\| 10.62 -> 19.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|0#2\|dy` | 10.62 | 19.85 | 1 pdf-probe-pt | "0" \|dy\| 10.62 -> 19.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|0#3\|dy` | 10.62 | 19.85 | 1 pdf-probe-pt | "0" \|dy\| 10.62 -> 19.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|0#4\|dy` | 10.62 | 19.85 | 1 pdf-probe-pt | "0" \|dy\| 10.62 -> 19.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|0#5\|dy` | 10.62 | 19.85 | 1 pdf-probe-pt | "0" \|dy\| 10.62 -> 19.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|1#5\|dy` | 10.62 | 19.85 | 1 pdf-probe-pt | "1" \|dy\| 10.62 -> 19.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|2#1\|dy` | 10.62 | 19.85 | 1 pdf-probe-pt | "2" \|dy\| 10.62 -> 19.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|3#1\|dy` | 10.62 | 19.85 | 1 pdf-probe-pt | "3" \|dy\| 10.62 -> 19.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|4#1\|dy` | 10.62 | 19.85 | 1 pdf-probe-pt | "4" \|dy\| 10.62 -> 19.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|5#1\|dy` | 10.62 | 19.85 | 1 pdf-probe-pt | "5" \|dy\| 10.62 -> 19.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|9#9\|dy` | 10.62 | 19.85 | 1 pdf-probe-pt | "9" \|dy\| 10.62 -> 19.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|9#10\|dy` | 10.62 | 19.85 | 1 pdf-probe-pt | "9" \|dy\| 10.62 -> 19.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|9#11\|dy` | 10.62 | 19.85 | 1 pdf-probe-pt | "9" \|dy\| 10.62 -> 19.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|0#6\|dy` | 10.62 | 19.85 | 1 pdf-probe-pt | "0" \|dy\| 10.62 -> 19.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|0#7\|dy` | 10.62 | 19.85 | 1 pdf-probe-pt | "0" \|dy\| 10.62 -> 19.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|0#8\|dy` | 10.62 | 19.85 | 1 pdf-probe-pt | "0" \|dy\| 10.62 -> 19.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|0#9\|dy` | 10.62 | 19.85 | 1 pdf-probe-pt | "0" \|dy\| 10.62 -> 19.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|0#10\|dy` | 10.62 | 19.85 | 1 pdf-probe-pt | "0" \|dy\| 10.62 -> 19.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|1#6\|dy` | 10.62 | 19.85 | 1 pdf-probe-pt | "1" \|dy\| 10.62 -> 19.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|2#2\|dy` | 10.62 | 19.85 | 1 pdf-probe-pt | "2" \|dy\| 10.62 -> 19.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|3#2\|dy` | 10.62 | 19.85 | 1 pdf-probe-pt | "3" \|dy\| 10.62 -> 19.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|4#2\|dy` | 10.62 | 19.85 | 1 pdf-probe-pt | "4" \|dy\| 10.62 -> 19.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|5#2\|dy` | 10.62 | 19.85 | 1 pdf-probe-pt | "5" \|dy\| 10.62 -> 19.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|6#1\|dy` | 10.62 | 19.85 | 1 pdf-probe-pt | "6" \|dy\| 10.62 -> 19.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|7#1\|dy` | 10.62 | 19.85 | 1 pdf-probe-pt | "7" \|dy\| 10.62 -> 19.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|0#11\|dy` | 10.62 | 19.85 | 1 pdf-probe-pt | "0" \|dy\| 10.62 -> 19.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|0#12\|dy` | 10.62 | 19.85 | 1 pdf-probe-pt | "0" \|dy\| 10.62 -> 19.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|0#13\|dy` | 10.62 | 19.85 | 1 pdf-probe-pt | "0" \|dy\| 10.62 -> 19.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|0#14\|dy` | 10.62 | 19.85 | 1 pdf-probe-pt | "0" \|dy\| 10.62 -> 19.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|0#15\|dy` | 10.62 | 19.85 | 1 pdf-probe-pt | "0" \|dy\| 10.62 -> 19.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|0#16\|dy` | 10.62 | 19.85 | 1 pdf-probe-pt | "0" \|dy\| 10.62 -> 19.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|4#3\|dy` | 10.62 | 19.85 | 1 pdf-probe-pt | "4" \|dy\| 10.62 -> 19.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|2#3\|dy` | 10.62 | 19.85 | 1 pdf-probe-pt | "2" \|dy\| 10.62 -> 19.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|0#17\|dy` | 10.62 | 19.85 | 1 pdf-probe-pt | "0" \|dy\| 10.62 -> 19.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|0#18\|dy` | 10.62 | 19.85 | 1 pdf-probe-pt | "0" \|dy\| 10.62 -> 19.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|Documento#1\|dy` | 11.37 | 19.85 | 1 pdf-probe-pt | "Documento" \|dy\| 11.37 -> 19.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|de#9\|dy` | 11.37 | 19.85 | 1 pdf-probe-pt | "de" \|dy\| 11.37 -> 19.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|cobrança#1\|dy` | 11.37 | 19.85 | 1 pdf-probe-pt | "cobrança" \|dy\| 11.37 -> 19.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|fictício#2\|dy` | 11.37 | 19.85 | 1 pdf-probe-pt | "fictício" \|dy\| 11.37 -> 19.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|gerado#1\|dy` | 11.37 | 19.85 | 1 pdf-probe-pt | "gerado" \|dy\| 11.37 -> 19.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|por#1\|dy` | 11.37 | 19.85 | 1 pdf-probe-pt | "por" \|dy\| 11.37 -> 19.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|vellora#1\|dy` | 11.37 | 19.85 | 1 pdf-probe-pt | "vellora" \|dy\| 11.37 -> 19.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|para#2\|dy` | 11.37 | 19.85 | 1 pdf-probe-pt | "para" \|dy\| 11.37 -> 19.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|fins#1\|dy` | 11.37 | 19.85 | 1 pdf-probe-pt | "fins" \|dy\| 11.37 -> 19.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|de#10\|dy` | 11.37 | 19.85 | 1 pdf-probe-pt | "de" \|dy\| 11.37 -> 19.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|teste#1\|dy` | 11.37 | 19.85 | 1 pdf-probe-pt | "teste" \|dy\| 11.37 -> 19.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|—#7\|dy` | 11.37 | 19.85 | 1 pdf-probe-pt | "—" \|dy\| 11.37 -> 19.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|Acme#3\|dy` | 11.37 | 19.85 | 1 pdf-probe-pt | "Acme" \|dy\| 11.37 -> 19.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|Widgets#3\|dy` | 11.37 | 19.85 | 1 pdf-probe-pt | "Widgets" \|dy\| 11.37 -> 19.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|Comércio#3\|dy` | 11.37 | 19.85 | 1 pdf-probe-pt | "Comércio" \|dy\| 11.37 -> 19.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|LTDA.#1\|dy` | 11.37 | 19.85 | 1 pdf-probe-pt | "LTDA." \|dy\| 11.37 -> 19.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|Autenticação#1\|dy` | 11.37 | 19.85 | 1 pdf-probe-pt | "Autenticação" \|dy\| 11.37 -> 19.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|mecânica:#1\|dy` | 11.37 | 19.85 | 1 pdf-probe-pt | "mecânica:" \|dy\| 11.37 -> 19.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|FAKE-AUTH-0000-#1\|dy` | 11.37 | 19.85 | 1 pdf-probe-pt | "FAKE-AUTH-0000-" \|dy\| 11.37 -> 19.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|XXXX-TESTE.#1\|dy` | 11.37 | 19.85 | 1 pdf-probe-pt | "XXXX-TESTE." \|dy\| 11.37 -> 19.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|danfe\|p1\|INSCRIÇÃO#2\|dx` | -0.17 | 1.83 | 1 pdf-probe-pt | "INSCRIÇÃO" \|dx\| 0.17 -> 1.83 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|danfe\|p1\|ESTADUAL#2\|dx` | -0.14 | 1.86 | 1 pdf-probe-pt | "ESTADUAL" \|dx\| 0.14 -> 1.86 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|danfe\|p1\|DO#2\|dx` | -0.11 | 1.89 | 1 pdf-probe-pt | "DO" \|dx\| 0.11 -> 1.89 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|danfe\|p1\|SUBST.#1\|dx` | -0.1 | 1.9 | 1 pdf-probe-pt | "SUBST." \|dx\| 0.1 -> 1.9 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|danfe\|p1\|TRIB.#1\|dx` | -0.08 | 1.92 | 1 pdf-probe-pt | "TRIB." \|dx\| 0.08 -> 1.92 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|danfe\|p1\|CNPJ#1\|dx` | -0.67 | 3.33 | 1 pdf-probe-pt | "CNPJ" \|dx\| 0.67 -> 3.33 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|danfe\|p1\|12.345.678/0001-95#1\|dx` | -0.67 | 3.33 | 1 pdf-probe-pt | "12.345.678/0001-95" \|dx\| 0.67 -> 3.33 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|danfe\|p1\|DESTINATÁRIO/REMETENTE#1\|dy` | 0.15 | 1.65 | 1 pdf-probe-pt | "DESTINATÁRIO/REMETENTE" \|dy\| 0.15 -> 1.65 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|danfe\|p1\|NOME/RAZÃO#1\|dy` | 0.16 | 1.66 | 1 pdf-probe-pt | "NOME/RAZÃO" \|dy\| 0.16 -> 1.66 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|danfe\|p1\|SOCIAL#1\|dy` | 0.16 | 1.66 | 1 pdf-probe-pt | "SOCIAL" \|dy\| 0.16 -> 1.66 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|danfe\|p1\|CNPJ/CPF#1\|dy` | 0.16 | 1.66 | 1 pdf-probe-pt | "CNPJ/CPF" \|dy\| 0.16 -> 1.66 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|danfe\|p1\|DATA#2\|dx` | -1.26 | 6.02 | 1 pdf-probe-pt | "DATA" \|dx\| 1.26 -> 6.02 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|danfe\|p1\|DATA#2\|dy` | 0.16 | 1.66 | 1 pdf-probe-pt | "DATA" \|dy\| 0.16 -> 1.66 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|danfe\|p1\|DA#4\|dx` | -1.25 | 6.04 | 1 pdf-probe-pt | "DA" \|dx\| 1.25 -> 6.04 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|danfe\|p1\|DA#4\|dy` | 0.16 | 1.66 | 1 pdf-probe-pt | "DA" \|dy\| 0.16 -> 1.66 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|danfe\|p1\|EMISSÃO#1\|dx` | -1.24 | 6.05 | 1 pdf-probe-pt | "EMISSÃO" \|dx\| 1.24 -> 6.05 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|danfe\|p1\|EMISSÃO#1\|dy` | 0.16 | 1.66 | 1 pdf-probe-pt | "EMISSÃO" \|dy\| 0.16 -> 1.66 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|danfe\|p1\|Comércio#1\|dy` | -0.58 | 1.67 | 1 pdf-probe-pt | "Comércio" \|dy\| 0.58 -> 1.67 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|danfe\|p1\|Fictício#1\|dy` | -0.58 | 1.67 | 1 pdf-probe-pt | "Fictício" \|dy\| 0.58 -> 1.67 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|danfe\|p1\|de#3\|dy` | -0.58 | 1.67 | 1 pdf-probe-pt | "de" \|dy\| 0.58 -> 1.67 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|danfe\|p1\|Eletrônicos#1\|dy` | -0.58 | 1.67 | 1 pdf-probe-pt | "Eletrônicos" \|dy\| 0.58 -> 1.67 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|danfe\|p1\|São#1\|dy` | -0.58 | 1.67 | 1 pdf-probe-pt | "São" \|dy\| 0.58 -> 1.67 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|danfe\|p1\|João#1\|dy` | -0.58 | 1.67 | 1 pdf-probe-pt | "João" \|dy\| 0.58 -> 1.67 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|danfe\|p1\|Ltda.#2\|dy` | -0.58 | 1.67 | 1 pdf-probe-pt | "Ltda." \|dy\| 0.58 -> 1.67 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|danfe\|p1\|98.765.432/0001-98#1\|dy` | -0.58 | 1.67 | 1 pdf-probe-pt | "98.765.432/0001-98" \|dy\| 0.58 -> 1.67 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|danfe\|p1\|15/10/2026#2\|dx` | -1.26 | 6.02 | 1 pdf-probe-pt | "15/10/2026" \|dx\| 1.26 -> 6.02 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|danfe\|p1\|15/10/2026#2\|dy` | -0.58 | 1.67 | 1 pdf-probe-pt | "15/10/2026" \|dy\| 0.58 -> 1.67 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|danfe\|p1\|ENDEREÇO#1\|dy` | 0.93 | 2.43 | 1 pdf-probe-pt | "ENDEREÇO" \|dy\| 0.93 -> 2.43 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|danfe\|p1\|CEP#2\|dy` | 0.93 | 2.43 | 1 pdf-probe-pt | "CEP" \|dy\| 0.93 -> 2.43 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|danfe\|p1\|DATA#3\|dx` | -1.26 | 6.02 | 1 pdf-probe-pt | "DATA" \|dx\| 1.26 -> 6.02 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|danfe\|p1\|DATA#3\|dy` | 0.93 | 2.43 | 1 pdf-probe-pt | "DATA" \|dy\| 0.93 -> 2.43 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|danfe\|p1\|DA#5\|dx` | -1.25 | 6.04 | 1 pdf-probe-pt | "DA" \|dx\| 1.25 -> 6.04 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|danfe\|p1\|DA#5\|dy` | 0.93 | 2.43 | 1 pdf-probe-pt | "DA" \|dy\| 0.93 -> 2.43 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|danfe\|p1\|SAÍDA#2\|dx` | -1.24 | 6.05 | 1 pdf-probe-pt | "SAÍDA" \|dx\| 1.24 -> 6.05 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|danfe\|p1\|SAÍDA#2\|dy` | 0.93 | 2.43 | 1 pdf-probe-pt | "SAÍDA" \|dy\| 0.93 -> 2.43 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|danfe\|p1\|Avenida#1\|dy` | 0.19 | 2.44 | 1 pdf-probe-pt | "Avenida" \|dy\| 0.19 -> 2.44 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|danfe\|p1\|das#1\|dy` | 0.19 | 2.44 | 1 pdf-probe-pt | "das" \|dy\| 0.19 -> 2.44 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|danfe\|p1\|Nações#1\|dy` | 0.19 | 2.44 | 1 pdf-probe-pt | "Nações" \|dy\| 0.19 -> 2.44 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|danfe\|p1\|Unidas,#1\|dy` | 0.19 | 2.44 | 1 pdf-probe-pt | "Unidas," \|dy\| 0.19 -> 2.44 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|danfe\|p1\|12901#1\|dy` | 0.19 | 2.44 | 1 pdf-probe-pt | "12901" \|dy\| 0.19 -> 2.44 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|danfe\|p1\|04578-000#1\|dy` | 0.19 | 2.44 | 1 pdf-probe-pt | "04578-000" \|dy\| 0.19 -> 2.44 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|danfe\|p1\|15/10/2026#3\|dx` | -1.26 | 6.02 | 1 pdf-probe-pt | "15/10/2026" \|dx\| 1.26 -> 6.02 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|danfe\|p1\|15/10/2026#3\|dy` | 0.19 | 2.44 | 1 pdf-probe-pt | "15/10/2026" \|dy\| 0.19 -> 2.44 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|danfe\|p1\|MUNICÍPIO#1\|dy` | 0.95 | 2.45 | 1 pdf-probe-pt | "MUNICÍPIO" \|dy\| 0.95 -> 2.45 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|danfe\|p1\|INSCRIÇÃO#3\|dy` | 0.95 | 2.45 | 1 pdf-probe-pt | "INSCRIÇÃO" \|dy\| 0.95 -> 2.45 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|danfe\|p1\|ESTADUAL#3\|dy` | 0.95 | 2.45 | 1 pdf-probe-pt | "ESTADUAL" \|dy\| 0.95 -> 2.45 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|danfe\|p1\|HORA#1\|dx` | -1.26 | 6.02 | 1 pdf-probe-pt | "HORA" \|dx\| 1.26 -> 6.02 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|danfe\|p1\|HORA#1\|dy` | 0.95 | 2.45 | 1 pdf-probe-pt | "HORA" \|dy\| 0.95 -> 2.45 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|danfe\|p1\|DA#6\|dx` | -1.25 | 6.04 | 1 pdf-probe-pt | "DA" \|dx\| 1.25 -> 6.04 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|danfe\|p1\|DA#6\|dy` | 0.95 | 2.45 | 1 pdf-probe-pt | "DA" \|dy\| 0.95 -> 2.45 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|danfe\|p1\|SAÍDA#3\|dx` | -1.24 | 6.04 | 1 pdf-probe-pt | "SAÍDA" \|dx\| 1.24 -> 6.04 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|danfe\|p1\|SAÍDA#3\|dy` | 0.95 | 2.45 | 1 pdf-probe-pt | "SAÍDA" \|dy\| 0.95 -> 2.45 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|danfe\|p1\|São#2\|dy` | 0.97 | 3.22 | 1 pdf-probe-pt | "São" \|dy\| 0.97 -> 3.22 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|danfe\|p1\|Paulo#1\|dy` | 0.97 | 3.22 | 1 pdf-probe-pt | "Paulo" \|dy\| 0.97 -> 3.22 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|danfe\|p1\|407.112.348.110#1\|dy` | 0.97 | 3.22 | 1 pdf-probe-pt | "407.112.348.110" \|dy\| 0.97 -> 3.22 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|danfe\|p1\|14:00:00#1\|dx` | -1.26 | 6.02 | 1 pdf-probe-pt | "14:00:00" \|dx\| 1.26 -> 6.02 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|danfe\|p1\|14:00:00#1\|dy` | 0.97 | 3.22 | 1 pdf-probe-pt | "14:00:00" \|dy\| 0.97 -> 3.22 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|danfe\|p1\|FATURA/DUPLICATAS#1\|dy` | 2.48 | 3.98 | 1 pdf-probe-pt | "FATURA/DUPLICATAS" \|dy\| 2.48 -> 3.98 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|danfe\|p1\|CÁLCULO#1\|dy` | 3.27 | 4.77 | 1 pdf-probe-pt | "CÁLCULO" \|dy\| 3.27 -> 4.77 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|danfe\|p1\|DO#3\|dy` | 3.27 | 4.77 | 1 pdf-probe-pt | "DO" \|dy\| 3.27 -> 4.77 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|danfe\|p1\|IMPOSTO#1\|dy` | 3.27 | 4.77 | 1 pdf-probe-pt | "IMPOSTO" \|dy\| 3.27 -> 4.77 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|danfe\|p1\|21.773,40#1\|dy` | 3.29 | 4.79 | 1 pdf-probe-pt | "21.773,40" \|dy\| 3.29 -> 4.79 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|danfe\|p1\|0,00#1\|dy` | 3.29 | 4.79 | 1 pdf-probe-pt | "0,00" \|dy\| 3.29 -> 4.79 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|danfe\|p1\|0,00#2\|dy` | 3.29 | 4.79 | 1 pdf-probe-pt | "0,00" \|dy\| 3.29 -> 4.79 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|danfe\|p1\|21.773,40#2\|dy` | 3.29 | 4.79 | 1 pdf-probe-pt | "21.773,40" \|dy\| 3.29 -> 4.79 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|danfe\|p1\|0,00#3\|dy` | 4.07 | 5.57 | 1 pdf-probe-pt | "0,00" \|dy\| 4.07 -> 5.57 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|danfe\|p1\|0,00#4\|dy` | 4.07 | 5.57 | 1 pdf-probe-pt | "0,00" \|dy\| 4.07 -> 5.57 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|danfe\|p1\|0,00#7\|dx` | -2.29 | 3.87 | 1 pdf-probe-pt | "0,00" \|dx\| 2.29 -> 3.87 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|danfe\|p1\|0,00#7\|dy` | 4.07 | 5.57 | 1 pdf-probe-pt | "0,00" \|dy\| 4.07 -> 5.57 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|danfe\|p1\|21.773,40#3\|dy` | 4.07 | 5.57 | 1 pdf-probe-pt | "21.773,40" \|dy\| 4.07 -> 5.57 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|danfe\|p1\|TRANSPORTADOR/VOLUMES#1\|dy` | 4.83 | 6.33 | 1 pdf-probe-pt | "TRANSPORTADOR/VOLUMES" \|dy\| 4.83 -> 6.33 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|danfe\|p1\|TRANSPORTADOS#1\|dy` | 4.83 | 6.33 | 1 pdf-probe-pt | "TRANSPORTADOS" \|dy\| 4.83 -> 6.33 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|danfe\|p1\|CNPJ/CPF#2\|dx` | -5.84 | 7.66 | 1 pdf-probe-pt | "CNPJ/CPF" \|dx\| 5.84 -> 7.66 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|danfe\|p1\|Transportes#1\|dy` | 4.85 | 6.35 | 1 pdf-probe-pt | "Transportes" \|dy\| 4.85 -> 6.35 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|danfe\|p1\|Exemplares#1\|dy` | 4.85 | 6.35 | 1 pdf-probe-pt | "Exemplares" \|dy\| 4.85 -> 6.35 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|danfe\|p1\|S.A.#1\|dy` | 4.85 | 6.35 | 1 pdf-probe-pt | "S.A." \|dy\| 4.85 -> 6.35 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|danfe\|p1\|44.555.666/0001-81#1\|dx` | -5.84 | 7.66 | 1 pdf-probe-pt | "44.555.666/0001-81" \|dx\| 5.84 -> 7.66 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|danfe\|p1\|44.555.666/0001-81#1\|dy` | 4.85 | 6.35 | 1 pdf-probe-pt | "44.555.666/0001-81" \|dy\| 4.85 -> 6.35 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|danfe\|p1\|INSCRIÇÃO#4\|dx` | -5.84 | 7.66 | 1 pdf-probe-pt | "INSCRIÇÃO" \|dx\| 5.84 -> 7.66 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|danfe\|p1\|ESTADUAL#4\|dx` | -5.81 | 7.69 | 1 pdf-probe-pt | "ESTADUAL" \|dx\| 5.81 -> 7.69 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|danfe\|p1\|Rodovia#1\|dy` | 4.88 | 6.38 | 1 pdf-probe-pt | "Rodovia" \|dy\| 4.88 -> 6.38 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|danfe\|p1\|Anhanguera,#1\|dy` | 4.88 | 6.38 | 1 pdf-probe-pt | "Anhanguera," \|dy\| 4.88 -> 6.38 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|danfe\|p1\|km#1\|dy` | 4.88 | 6.38 | 1 pdf-probe-pt | "km" \|dy\| 4.88 -> 6.38 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|danfe\|p1\|98#1\|dy` | 4.88 | 6.38 | 1 pdf-probe-pt | "98" \|dy\| 4.88 -> 6.38 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|danfe\|p1\|244.556.677.118#1\|dx` | -5.84 | 7.66 | 1 pdf-probe-pt | "244.556.677.118" \|dx\| 5.84 -> 7.66 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|danfe\|p1\|244.556.677.118#1\|dy` | 4.88 | 6.38 | 1 pdf-probe-pt | "244.556.677.118" \|dy\| 4.88 -> 6.38 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|danfe\|p1\|QUANTIDADE#1\|dy` | 6.39 | 7.89 | 1 pdf-probe-pt | "QUANTIDADE" \|dy\| 6.39 -> 7.89 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|danfe\|p1\|ESPÉCIE#1\|dy` | 6.39 | 7.89 | 1 pdf-probe-pt | "ESPÉCIE" \|dy\| 6.39 -> 7.89 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|danfe\|p1\|PESO#2\|dy` | 6.39 | 7.89 | 1 pdf-probe-pt | "PESO" \|dy\| 6.39 -> 7.89 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|danfe\|p1\|LÍQUIDO#1\|dy` | 6.39 | 7.89 | 1 pdf-probe-pt | "LÍQUIDO" \|dy\| 6.39 -> 7.89 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|danfe\|p1\|6#1\|dy` | 5.65 | 7.15 | 1 pdf-probe-pt | "6" \|dy\| 5.65 -> 7.15 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|danfe\|p1\|CAIXA#1\|dy` | 5.65 | 7.15 | 1 pdf-probe-pt | "CAIXA" \|dy\| 5.65 -> 7.15 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|danfe\|p1\|48,600#1\|dy` | 5.65 | 7.15 | 1 pdf-probe-pt | "48,600" \|dy\| 5.65 -> 7.15 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|danfe\|p1\|45,100#1\|dy` | 5.65 | 7.15 | 1 pdf-probe-pt | "45,100" \|dy\| 5.65 -> 7.15 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|danfe\|p1\|DADOS#1\|dy` | 7.92 | 9.42 | 1 pdf-probe-pt | "DADOS" \|dy\| 7.92 -> 9.42 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|danfe\|p1\|DOS#2\|dy` | 7.92 | 9.42 | 1 pdf-probe-pt | "DOS" \|dy\| 7.92 -> 9.42 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|danfe\|p1\|PRODUTOS/SERVIÇOS#1\|dy` | 7.92 | 9.42 | 1 pdf-probe-pt | "PRODUTOS/SERVIÇOS" \|dy\| 7.92 -> 9.42 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|danfe\|p1\|ALÍQ.#1\|dx` | 1.93 | 10.45 | 1 pdf-probe-pt | "ALÍQ." \|dx\| 1.93 -> 10.45 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|danfe\|p1\|PRODUTO#1\|dy` | 4.94 | 8.69 | 1 pdf-probe-pt | "PRODUTO" \|dy\| 4.94 -> 8.69 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|danfe\|p1\|ICMS#7\|dy` | 4.94 | 8.69 | 1 pdf-probe-pt | "ICMS" \|dy\| 4.94 -> 8.69 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|danfe\|p1\|IPI#3\|dx` | -8.73 | 11.05 | 1 pdf-probe-pt | "IPI" \|dx\| 8.73 -> 11.05 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|danfe\|p1\|IPI#3\|dy` | 4.94 | 8.69 | 1 pdf-probe-pt | "IPI" \|dy\| 4.94 -> 8.69 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|danfe\|p1\|CMP-0001#1\|dy` | 7.2 | 9.45 | 1 pdf-probe-pt | "CMP-0001" \|dy\| 7.2 -> 9.45 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|danfe\|p1\|Placa-mãe#1\|dy` | 7.2 | 9.45 | 1 pdf-probe-pt | "Placa-mãe" \|dy\| 7.2 -> 9.45 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|danfe\|p1\|micro-ATX#1\|dy` | 7.2 | 9.45 | 1 pdf-probe-pt | "micro-ATX" \|dy\| 7.2 -> 9.45 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|danfe\|p1\|com#1\|dy` | 7.2 | 9.45 | 1 pdf-probe-pt | "com" \|dy\| 7.2 -> 9.45 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|danfe\|p1\|chipset#1\|dy` | 7.2 | 9.45 | 1 pdf-probe-pt | "chipset" \|dy\| 7.2 -> 9.45 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|danfe\|p1\|3.599,60#1\|dy` | 7.2 | 9.45 | 1 pdf-probe-pt | "3.599,60" \|dy\| 7.2 -> 9.45 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|danfe\|p1\|DDR5#2\|dy` | 3.46 | 10.21 | 1 pdf-probe-pt | "DDR5" \|dy\| 3.46 -> 10.21 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|danfe\|p1\|18,00#2\|dy` | -4.04 | 10.21 | 1 pdf-probe-pt | "18,00" \|dy\| 4.04 -> 10.21 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|danfe\|p1\|0,00#11\|dy` | -4.04 | 10.21 | 1 pdf-probe-pt | "0,00" \|dy\| 4.04 -> 10.21 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|danfe\|p1\|18,00#4\|dy` | -5.52 | 10.98 | 1 pdf-probe-pt | "18,00" \|dy\| 5.52 -> 10.98 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|danfe\|p1\|0,00#15\|dy` | -5.52 | 10.98 | 1 pdf-probe-pt | "0,00" \|dy\| 5.52 -> 10.98 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|danfe\|p1\|18,00#5\|dy` | -3.26 | 12.49 | 1 pdf-probe-pt | "18,00" \|dy\| 3.26 -> 12.49 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|danfe\|p1\|0,00#17\|dy` | -3.26 | 12.49 | 1 pdf-probe-pt | "0,00" \|dy\| 3.26 -> 12.49 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|danfe\|p1\|18,00#6\|dy` | -1 | 13.25 | 1 pdf-probe-pt | "18,00" \|dy\| 1 -> 13.25 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|danfe\|p1\|0,00#19\|dy` | -1 | 13.25 | 1 pdf-probe-pt | "0,00" \|dy\| 1 -> 13.25 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|danfe\|p1\|18,00#8\|dy` | -1.72 | 14.78 | 1 pdf-probe-pt | "18,00" \|dy\| 1.72 -> 14.78 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|danfe\|p1\|0,00#23\|dy` | -1.72 | 14.78 | 1 pdf-probe-pt | "0,00" \|dy\| 1.72 -> 14.78 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|danfe\|p1\|com#3\|dy` | -12.96 | 15.54 | 1 pdf-probe-pt | "com" \|dy\| 12.96 -> 15.54 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|danfe\|p1\|18,00#10\|dy` | -3.2 | 16.3 | 1 pdf-probe-pt | "18,00" \|dy\| 3.2 -> 16.3 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|danfe\|p1\|0,00#27\|dy` | -3.2 | 16.3 | 1 pdf-probe-pt | "0,00" \|dy\| 3.2 -> 16.3 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|danfe\|p1\|18,00#11\|dy` | 5.81 | 17.06 | 1 pdf-probe-pt | "18,00" \|dy\| 5.81 -> 17.06 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|danfe\|p1\|0,00#29\|dy` | 5.81 | 17.06 | 1 pdf-probe-pt | "0,00" \|dy\| 5.81 -> 17.06 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|danfe\|p1\|0,00#30\|dy` | 8.82 | 17.82 | 1 pdf-probe-pt | "0,00" \|dy\| 8.82 -> 17.82 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|danfe\|p1\|18,00#12\|dy` | 8.82 | 17.82 | 1 pdf-probe-pt | "18,00" \|dy\| 8.82 -> 17.82 pt vs Chrome (baseline) |
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
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|Hi#1\|dy` | -0.15 | 6.6 | 1 pdf-probe-pt | "Hi" \|dy\| 0.15 -> 6.6 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|Maria#1\|dy` | -0.15 | 6.6 | 1 pdf-probe-pt | "Maria" \|dy\| 0.15 -> 6.6 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|Exemplo,#1\|dy` | -0.15 | 6.6 | 1 pdf-probe-pt | "Exemplo," \|dy\| 0.15 -> 6.6 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|Thanks#1\|dy` | -0.15 | 6.6 | 1 pdf-probe-pt | "Thanks" \|dy\| 0.15 -> 6.6 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|for#1\|dy` | -0.15 | 6.6 | 1 pdf-probe-pt | "for" \|dy\| 0.15 -> 6.6 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|using#1\|dy` | -0.15 | 6.6 | 1 pdf-probe-pt | "using" \|dy\| 0.15 -> 6.6 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|[Product#3\|dy` | -0.15 | 6.6 | 1 pdf-probe-pt | "[Product" \|dy\| 0.15 -> 6.6 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|Name].#1\|dy` | -0.15 | 6.6 | 1 pdf-probe-pt | "Name]." \|dy\| 0.15 -> 6.6 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|This#1\|dy` | -0.15 | 6.6 | 1 pdf-probe-pt | "This" \|dy\| 0.15 -> 6.6 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|email#1\|dy` | -0.15 | 6.6 | 1 pdf-probe-pt | "email" \|dy\| 0.15 -> 6.6 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|is#1\|dy` | -0.15 | 6.6 | 1 pdf-probe-pt | "is" \|dy\| 0.15 -> 6.6 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|the#1\|dy` | -0.15 | 6.6 | 1 pdf-probe-pt | "the" \|dy\| 0.15 -> 6.6 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|receipt#1\|dy` | -0.15 | 6.6 | 1 pdf-probe-pt | "receipt" \|dy\| 0.15 -> 6.6 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|for#2\|dy` | -0.15 | 6.6 | 1 pdf-probe-pt | "for" \|dy\| 0.15 -> 6.6 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|your#1\|dy` | -0.15 | 6.6 | 1 pdf-probe-pt | "your" \|dy\| 0.15 -> 6.6 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|purchase.#1\|dy` | -0.15 | 6.6 | 1 pdf-probe-pt | "purchase." \|dy\| 0.15 -> 6.6 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|No#1\|dy` | -0.15 | 6.6 | 1 pdf-probe-pt | "No" \|dy\| 0.15 -> 6.6 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|payment#1\|dy` | -0.15 | 6.6 | 1 pdf-probe-pt | "payment" \|dy\| 0.15 -> 6.6 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|is#2\|dy` | -0.15 | 6.6 | 1 pdf-probe-pt | "is" \|dy\| 0.15 -> 6.6 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|due.#1\|dy` | -0.15 | 6.6 | 1 pdf-probe-pt | "due." \|dy\| 0.15 -> 6.6 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|This#2\|dy` | -0.15 | 6.6 | 1 pdf-probe-pt | "This" \|dy\| 0.15 -> 6.6 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|purchase#1\|dy` | -0.15 | 6.6 | 1 pdf-probe-pt | "purchase" \|dy\| 0.15 -> 6.6 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|will#1\|dy` | -0.15 | 6.6 | 1 pdf-probe-pt | "will" \|dy\| 0.15 -> 6.6 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|appear#1\|dy` | -0.15 | 6.6 | 1 pdf-probe-pt | "appear" \|dy\| 0.15 -> 6.6 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|as#1\|dy` | -0.15 | 6.6 | 1 pdf-probe-pt | "as" \|dy\| 0.15 -> 6.6 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|“[Credit#1\|dy` | -0.15 | 6.6 | 1 pdf-probe-pt | "“[Credit" \|dy\| 0.15 -> 6.6 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|Card#1\|dy` | -0.15 | 6.6 | 1 pdf-probe-pt | "Card" \|dy\| 0.15 -> 6.6 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|Statement#1\|dy` | -0.15 | 6.6 | 1 pdf-probe-pt | "Statement" \|dy\| 0.15 -> 6.6 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|Name]”#1\|dy` | -0.15 | 6.6 | 1 pdf-probe-pt | "Name]”" \|dy\| 0.15 -> 6.6 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|on#1\|dy` | -0.15 | 6.6 | 1 pdf-probe-pt | "on" \|dy\| 0.15 -> 6.6 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|your#2\|dy` | -0.15 | 6.6 | 1 pdf-probe-pt | "your" \|dy\| 0.15 -> 6.6 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|credit#1\|dy` | -0.15 | 6.6 | 1 pdf-probe-pt | "credit" \|dy\| 0.15 -> 6.6 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|card#1\|dy` | -0.15 | 6.6 | 1 pdf-probe-pt | "card" \|dy\| 0.15 -> 6.6 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|statement#1\|dy` | -0.15 | 6.6 | 1 pdf-probe-pt | "statement" \|dy\| 0.15 -> 6.6 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|for#3\|dy` | -0.15 | 6.6 | 1 pdf-probe-pt | "for" \|dy\| 0.15 -> 6.6 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|your#3\|dy` | -0.15 | 6.6 | 1 pdf-probe-pt | "your" \|dy\| 0.15 -> 6.6 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|Visa#1\|dy` | -0.15 | 6.6 | 1 pdf-probe-pt | "Visa" \|dy\| 0.15 -> 6.6 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|ending#1\|dy` | -0.15 | 6.6 | 1 pdf-probe-pt | "ending" \|dy\| 0.15 -> 6.6 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|in#1\|dy` | -0.15 | 6.6 | 1 pdf-probe-pt | "in" \|dy\| 0.15 -> 6.6 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|4242.#1\|dy` | -0.15 | 6.6 | 1 pdf-probe-pt | "4242." \|dy\| 0.15 -> 6.6 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|Need#1\|dy` | -0.15 | 6.6 | 1 pdf-probe-pt | "Need" \|dy\| 0.15 -> 6.6 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|to#1\|dy` | -0.15 | 6.6 | 1 pdf-probe-pt | "to" \|dy\| 0.15 -> 6.6 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|update#1\|dy` | -0.15 | 6.6 | 1 pdf-probe-pt | "update" \|dy\| 0.15 -> 6.6 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|your#4\|dy` | -0.15 | 6.6 | 1 pdf-probe-pt | "your" \|dy\| 0.15 -> 6.6 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|payment#2\|dy` | -0.15 | 6.6 | 1 pdf-probe-pt | "payment" \|dy\| 0.15 -> 6.6 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|information#1\|dy` | -0.15 | 6.6 | 1 pdf-probe-pt | "information" \|dy\| 0.15 -> 6.6 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|?#1\|dy` | -0.15 | 6.6 | 1 pdf-probe-pt | "?" \|dy\| 0.15 -> 6.6 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|10%#1\|dy` | 0.6 | 8.85 | 1 pdf-probe-pt | "10%" \|dy\| 0.6 -> 8.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|off#1\|dy` | 0.6 | 8.85 | 1 pdf-probe-pt | "off" \|dy\| 0.6 -> 8.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|your#5\|dy` | 0.6 | 8.85 | 1 pdf-probe-pt | "your" \|dy\| 0.6 -> 8.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|next#1\|dy` | 0.6 | 8.85 | 1 pdf-probe-pt | "next" \|dy\| 0.6 -> 8.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|purchase!#1\|dy` | 0.6 | 8.85 | 1 pdf-probe-pt | "purchase!" \|dy\| 0.6 -> 8.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|Thanks#2\|dy` | 1.35 | 8.85 | 1 pdf-probe-pt | "Thanks" \|dy\| 1.35 -> 8.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|for#4\|dy` | 1.35 | 8.85 | 1 pdf-probe-pt | "for" \|dy\| 1.35 -> 8.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|your#6\|dy` | 1.35 | 8.85 | 1 pdf-probe-pt | "your" \|dy\| 1.35 -> 8.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|support!#1\|dy` | 1.35 | 8.85 | 1 pdf-probe-pt | "support!" \|dy\| 1.35 -> 8.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|Here's#1\|dy` | 1.35 | 8.85 | 1 pdf-probe-pt | "Here's" \|dy\| 1.35 -> 8.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|a#1\|dy` | 1.35 | 8.85 | 1 pdf-probe-pt | "a" \|dy\| 1.35 -> 8.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|coupon#1\|dy` | 1.35 | 8.85 | 1 pdf-probe-pt | "coupon" \|dy\| 1.35 -> 8.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|for#5\|dy` | 1.35 | 8.85 | 1 pdf-probe-pt | "for" \|dy\| 1.35 -> 8.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|10%#2\|dy` | 1.35 | 8.85 | 1 pdf-probe-pt | "10%" \|dy\| 1.35 -> 8.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|off#2\|dy` | 1.35 | 8.85 | 1 pdf-probe-pt | "off" \|dy\| 1.35 -> 8.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|your#7\|dy` | 1.35 | 8.85 | 1 pdf-probe-pt | "your" \|dy\| 1.35 -> 8.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|next#2\|dy` | 1.35 | 8.85 | 1 pdf-probe-pt | "next" \|dy\| 1.35 -> 8.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|purchase#2\|dy` | 0.6 | 8.1 | 1 pdf-probe-pt | "purchase" \|dy\| 0.6 -> 8.1 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|if#1\|dy` | 0.6 | 8.1 | 1 pdf-probe-pt | "if" \|dy\| 0.6 -> 8.1 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|used#1\|dy` | 0.6 | 8.1 | 1 pdf-probe-pt | "used" \|dy\| 0.6 -> 8.1 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|by#1\|dy` | 0.6 | 8.1 | 1 pdf-probe-pt | "by" \|dy\| 0.6 -> 8.1 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|November#1\|dy` | 0.6 | 8.1 | 1 pdf-probe-pt | "November" \|dy\| 0.6 -> 8.1 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|15,#1\|dy` | 0.6 | 8.1 | 1 pdf-probe-pt | "15," \|dy\| 0.6 -> 8.1 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|2026.#1\|dy` | 0.6 | 8.1 | 1 pdf-probe-pt | "2026." \|dy\| 0.6 -> 8.1 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|Use#1\|dy` | 2.85 | 11.1 | 1 pdf-probe-pt | "Use" \|dy\| 2.85 -> 11.1 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|this#1\|dy` | 2.85 | 11.1 | 1 pdf-probe-pt | "this" \|dy\| 2.85 -> 11.1 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|discount#1\|dy` | 2.85 | 11.1 | 1 pdf-probe-pt | "discount" \|dy\| 2.85 -> 11.1 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|now...#1\|dy` | 2.85 | 11.1 | 1 pdf-probe-pt | "now..." \|dy\| 2.85 -> 11.1 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|#RCPT-2026-000417#1\|dx` | 0.22 | 3.22 | 1 pdf-probe-pt | "#RCPT-2026-000417" \|dx\| 0.22 -> 3.22 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|#RCPT-2026-000417#1\|dy` | 5.1 | 17.85 | 1 pdf-probe-pt | "#RCPT-2026-000417" \|dy\| 5.1 -> 17.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|Description#1\|dx` | 0.97 | 5.47 | 1 pdf-probe-pt | "Description" \|dx\| 0.97 -> 5.47 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|Description#1\|dy` | 9.6 | 23.1 | 1 pdf-probe-pt | "Description" \|dy\| 9.6 -> 23.1 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|Pro#1\|dx` | 0.22 | 4.72 | 1 pdf-probe-pt | "Pro" \|dx\| 0.22 -> 4.72 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|Pro#1\|dy` | 11.1 | 24.6 | 1 pdf-probe-pt | "Pro" \|dy\| 11.1 -> 24.6 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|plan#1\|dx` | 0.22 | 4.72 | 1 pdf-probe-pt | "plan" \|dx\| 0.22 -> 4.72 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|plan#1\|dy` | 11.1 | 24.6 | 1 pdf-probe-pt | "plan" \|dy\| 11.1 -> 24.6 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|—#1\|dx` | 0.22 | 4.72 | 1 pdf-probe-pt | "—" \|dx\| 0.22 -> 4.72 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|—#1\|dy` | 11.1 | 24.6 | 1 pdf-probe-pt | "—" \|dy\| 11.1 -> 24.6 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|monthly#1\|dx` | 0.22 | 4.72 | 1 pdf-probe-pt | "monthly" \|dx\| 0.22 -> 4.72 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|monthly#1\|dy` | 11.1 | 24.6 | 1 pdf-probe-pt | "monthly" \|dy\| 11.1 -> 24.6 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|subscription#1\|dx` | 0.22 | 4.72 | 1 pdf-probe-pt | "subscription" \|dx\| 0.22 -> 4.72 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|subscription#1\|dy` | 11.1 | 24.6 | 1 pdf-probe-pt | "subscription" \|dy\| 11.1 -> 24.6 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|(Oct#1\|dx` | 0.22 | 4.72 | 1 pdf-probe-pt | "(Oct" \|dx\| 0.22 -> 4.72 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|(Oct#1\|dy` | 11.1 | 24.6 | 1 pdf-probe-pt | "(Oct" \|dy\| 11.1 -> 24.6 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|15#1\|dx` | 0.22 | 4.72 | 1 pdf-probe-pt | "15" \|dx\| 0.22 -> 4.72 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|15#1\|dy` | 11.1 | 24.6 | 1 pdf-probe-pt | "15" \|dy\| 11.1 -> 24.6 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|–#1\|dx` | 0.22 | 4.72 | 1 pdf-probe-pt | "–" \|dx\| 0.22 -> 4.72 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|–#1\|dy` | 11.1 | 24.6 | 1 pdf-probe-pt | "–" \|dy\| 11.1 -> 24.6 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|Nov#1\|dx` | 0.22 | 4.72 | 1 pdf-probe-pt | "Nov" \|dx\| 0.22 -> 4.72 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|Nov#1\|dy` | 11.1 | 24.6 | 1 pdf-probe-pt | "Nov" \|dy\| 11.1 -> 24.6 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|14,#1\|dx` | 0.22 | 4.72 | 1 pdf-probe-pt | "14," \|dx\| 0.22 -> 4.72 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|14,#1\|dy` | 11.1 | 24.6 | 1 pdf-probe-pt | "14," \|dy\| 11.1 -> 24.6 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|2026)#1\|dx` | 0.22 | 4.72 | 1 pdf-probe-pt | "2026)" \|dx\| 0.22 -> 4.72 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|2026)#1\|dy` | 11.1 | 24.6 | 1 pdf-probe-pt | "2026)" \|dy\| 11.1 -> 24.6 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|Additional#1\|dx` | 0.22 | 4.72 | 1 pdf-probe-pt | "Additional" \|dx\| 0.22 -> 4.72 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|Additional#1\|dy` | 12.6 | 26.1 | 1 pdf-probe-pt | "Additional" \|dy\| 12.6 -> 26.1 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|seats#1\|dx` | 0.22 | 4.72 | 1 pdf-probe-pt | "seats" \|dx\| 0.22 -> 4.72 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|seats#1\|dy` | 12.6 | 26.1 | 1 pdf-probe-pt | "seats" \|dy\| 12.6 -> 26.1 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|×#1\|dx` | 0.22 | 4.72 | 1 pdf-probe-pt | "×" \|dx\| 0.22 -> 4.72 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|×#1\|dy` | 12.6 | 26.1 | 1 pdf-probe-pt | "×" \|dy\| 12.6 -> 26.1 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|3#1\|dx` | 0.22 | 4.72 | 1 pdf-probe-pt | "3" \|dx\| 0.22 -> 4.72 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|3#1\|dy` | 12.6 | 26.1 | 1 pdf-probe-pt | "3" \|dy\| 12.6 -> 26.1 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|Priority#1\|dx` | 0.22 | 4.72 | 1 pdf-probe-pt | "Priority" \|dx\| 0.22 -> 4.72 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|Priority#1\|dy` | 14.1 | 27.6 | 1 pdf-probe-pt | "Priority" \|dy\| 14.1 -> 27.6 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|support#1\|dx` | 0.22 | 4.72 | 1 pdf-probe-pt | "support" \|dx\| 0.22 -> 4.72 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|support#1\|dy` | 14.1 | 27.6 | 1 pdf-probe-pt | "support" \|dy\| 14.1 -> 27.6 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|add-on#1\|dx` | 0.22 | 4.72 | 1 pdf-probe-pt | "add-on" \|dx\| 0.22 -> 4.72 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|add-on#1\|dy` | 14.1 | 27.6 | 1 pdf-probe-pt | "add-on" \|dy\| 14.1 -> 27.6 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|Credit#1\|dx` | 0.22 | 4.72 | 1 pdf-probe-pt | "Credit" \|dx\| 0.22 -> 4.72 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|Credit#1\|dy` | 15.6 | 29.1 | 1 pdf-probe-pt | "Credit" \|dy\| 15.6 -> 29.1 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|applied#1\|dx` | 0.22 | 4.72 | 1 pdf-probe-pt | "applied" \|dx\| 0.22 -> 4.72 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|applied#1\|dy` | 15.6 | 29.1 | 1 pdf-probe-pt | "applied" \|dy\| 15.6 -> 29.1 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|from#1\|dx` | 0.22 | 4.72 | 1 pdf-probe-pt | "from" \|dx\| 0.22 -> 4.72 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|from#1\|dy` | 15.6 | 29.1 | 1 pdf-probe-pt | "from" \|dy\| 15.6 -> 29.1 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|referral#1\|dx` | 0.22 | 4.72 | 1 pdf-probe-pt | "referral" \|dx\| 0.22 -> 4.72 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|referral#1\|dy` | 15.6 | 29.1 | 1 pdf-probe-pt | "referral" \|dy\| 15.6 -> 29.1 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|If#1\|dy` | 18.6 | 35.1 | 1 pdf-probe-pt | "If" \|dy\| 18.6 -> 35.1 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|you#1\|dy` | 18.6 | 35.1 | 1 pdf-probe-pt | "you" \|dy\| 18.6 -> 35.1 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|have#1\|dy` | 18.6 | 35.1 | 1 pdf-probe-pt | "have" \|dy\| 18.6 -> 35.1 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|any#1\|dy` | 18.6 | 35.1 | 1 pdf-probe-pt | "any" \|dy\| 18.6 -> 35.1 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|questions#1\|dy` | 18.6 | 35.1 | 1 pdf-probe-pt | "questions" \|dy\| 18.6 -> 35.1 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|about#1\|dy` | 18.6 | 35.1 | 1 pdf-probe-pt | "about" \|dy\| 18.6 -> 35.1 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|this#2\|dy` | 18.6 | 35.1 | 1 pdf-probe-pt | "this" \|dy\| 18.6 -> 35.1 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|receipt,#1\|dy` | 18.6 | 35.1 | 1 pdf-probe-pt | "receipt," \|dy\| 18.6 -> 35.1 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|simply#1\|dy` | 18.6 | 35.1 | 1 pdf-probe-pt | "simply" \|dy\| 18.6 -> 35.1 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|reply#1\|dy` | 18.6 | 35.1 | 1 pdf-probe-pt | "reply" \|dy\| 18.6 -> 35.1 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|to#2\|dy` | 18.6 | 35.1 | 1 pdf-probe-pt | "to" \|dy\| 18.6 -> 35.1 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|this#3\|dy` | 18.6 | 35.1 | 1 pdf-probe-pt | "this" \|dy\| 18.6 -> 35.1 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|email#2\|dy` | 18.6 | 35.1 | 1 pdf-probe-pt | "email" \|dy\| 18.6 -> 35.1 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|or#1\|dy` | 18.6 | 35.1 | 1 pdf-probe-pt | "or" \|dy\| 18.6 -> 35.1 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|reach#1\|dy` | 18.6 | 35.1 | 1 pdf-probe-pt | "reach" \|dy\| 18.6 -> 35.1 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|out#1\|dy` | 18.6 | 35.1 | 1 pdf-probe-pt | "out" \|dy\| 18.6 -> 35.1 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|to#3\|dy` | 18.6 | 35.1 | 1 pdf-probe-pt | "to" \|dy\| 18.6 -> 35.1 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|our#1\|dy` | 18.6 | 35.1 | 1 pdf-probe-pt | "our" \|dy\| 18.6 -> 35.1 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|support#2\|dy` | 18.6 | 35.1 | 1 pdf-probe-pt | "support" \|dy\| 18.6 -> 35.1 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|team#1\|dy` | 18.6 | 35.1 | 1 pdf-probe-pt | "team" \|dy\| 18.6 -> 35.1 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|for#6\|dy` | 18.6 | 35.1 | 1 pdf-probe-pt | "for" \|dy\| 18.6 -> 35.1 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|help.#1\|dy` | 18.6 | 35.1 | 1 pdf-probe-pt | "help." \|dy\| 18.6 -> 35.1 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|Cheers,#1\|dy` | 18.6 | 35.1 | 1 pdf-probe-pt | "Cheers," \|dy\| 18.6 -> 35.1 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|The#1\|dy` | 18.6 | 35.1 | 1 pdf-probe-pt | "The" \|dy\| 18.6 -> 35.1 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|[Product#4\|dy` | 18.6 | 35.1 | 1 pdf-probe-pt | "[Product" \|dy\| 18.6 -> 35.1 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|Name]#3\|dy` | 18.6 | 35.1 | 1 pdf-probe-pt | "Name]" \|dy\| 18.6 -> 35.1 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|team#2\|dy` | 18.6 | 35.1 | 1 pdf-probe-pt | "team" \|dy\| 18.6 -> 35.1 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|[Product#1\|pairing` | dx -0.9 dy -1.65 | unpaired |  | Chrome's "[Product" (page 1) lost its vellora counterpart: missing, on another page, or more than 36 pt away |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|Name]#1\|pairing` | dx -0.9 dy -1.65 | unpaired |  | Chrome's "Name]" (page 1) lost its vellora counterpart: missing, on another page, or more than 36 pt away |
| pdf-probe | `pdf-probe\|oss-sparksuite-invoice\|p1\|Invoice#1\|dx` | -0.23 | -3.23 | 1 pdf-probe-pt | "Invoice" \|dx\| 0.23 -> 3.23 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|oss-sparksuite-invoice\|p1\|#:#1\|dx` | -0.23 | -3.23 | 1 pdf-probe-pt | "#:" \|dx\| 0.23 -> 3.23 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|oss-sparksuite-invoice\|p1\|123#1\|dx` | -0.23 | -3.23 | 1 pdf-probe-pt | "123" \|dx\| 0.23 -> 3.23 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|oss-sparksuite-invoice\|p1\|Created:#1\|dx` | -0.23 | -3.23 | 1 pdf-probe-pt | "Created:" \|dx\| 0.23 -> 3.23 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|oss-sparksuite-invoice\|p1\|January#1\|dx` | -0.23 | -3.23 | 1 pdf-probe-pt | "January" \|dx\| 0.23 -> 3.23 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|oss-sparksuite-invoice\|p1\|1,#1\|dx` | -0.23 | -3.23 | 1 pdf-probe-pt | "1," \|dx\| 0.23 -> 3.23 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|oss-sparksuite-invoice\|p1\|2023#1\|dx` | -0.23 | -3.23 | 1 pdf-probe-pt | "2023" \|dx\| 0.23 -> 3.23 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|oss-sparksuite-invoice\|p1\|Due:#1\|dx` | -0.23 | -3.23 | 1 pdf-probe-pt | "Due:" \|dx\| 0.23 -> 3.23 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|oss-sparksuite-invoice\|p1\|February#1\|dx` | -0.23 | -3.23 | 1 pdf-probe-pt | "February" \|dx\| 0.23 -> 3.23 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|oss-sparksuite-invoice\|p1\|1,#2\|dx` | -0.23 | -3.23 | 1 pdf-probe-pt | "1," \|dx\| 0.23 -> 3.23 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|oss-sparksuite-invoice\|p1\|2023#2\|dx` | -0.23 | -3.23 | 1 pdf-probe-pt | "2023" \|dx\| 0.23 -> 3.23 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|oss-sparksuite-invoice\|p1\|Acme#1\|dx` | -0.23 | -3.23 | 1 pdf-probe-pt | "Acme" \|dx\| 0.23 -> 3.23 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|oss-sparksuite-invoice\|p1\|Corp.#1\|dx` | -0.23 | -3.23 | 1 pdf-probe-pt | "Corp." \|dx\| 0.23 -> 3.23 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|oss-sparksuite-invoice\|p1\|John#1\|dx` | -0.22 | -3.22 | 1 pdf-probe-pt | "John" \|dx\| 0.22 -> 3.22 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|oss-sparksuite-invoice\|p1\|Doe#1\|dx` | -0.22 | -3.22 | 1 pdf-probe-pt | "Doe" \|dx\| 0.22 -> 3.22 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|oss-sparksuite-invoice\|p1\|john@example.com#1\|dx` | -0.23 | -3.23 | 1 pdf-probe-pt | "john@example.com" \|dx\| 0.23 -> 3.23 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|oss-sparksuite-invoice\|p1\|Payment#1\|dx` | -0.23 | 1.27 | 1 pdf-probe-pt | "Payment" \|dx\| 0.23 -> 1.27 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|oss-sparksuite-invoice\|p1\|Method#1\|dx` | -0.23 | 1.27 | 1 pdf-probe-pt | "Method" \|dx\| 0.23 -> 1.27 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|oss-sparksuite-invoice\|p1\|Check#1\|dx` | -1.72 | -3.22 | 1 pdf-probe-pt | "Check" \|dx\| 1.72 -> 3.22 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|oss-sparksuite-invoice\|p1\|##1\|dx` | -1.73 | -3.23 | 1 pdf-probe-pt | "#" \|dx\| 1.73 -> 3.23 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|oss-sparksuite-invoice\|p1\|Check#2\|dx` | -0.23 | 1.27 | 1 pdf-probe-pt | "Check" \|dx\| 0.23 -> 1.27 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|oss-sparksuite-invoice\|p1\|1000#1\|dx` | -1.73 | -3.23 | 1 pdf-probe-pt | "1000" \|dx\| 1.73 -> 3.23 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|oss-sparksuite-invoice\|p1\|Item#1\|dx` | -0.23 | 1.27 | 1 pdf-probe-pt | "Item" \|dx\| 0.23 -> 1.27 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|oss-sparksuite-invoice\|p1\|Price#1\|dx` | -1.73 | -3.23 | 1 pdf-probe-pt | "Price" \|dx\| 1.73 -> 3.23 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|oss-sparksuite-invoice\|p1\|Website#1\|dx` | -0.23 | 1.27 | 1 pdf-probe-pt | "Website" \|dx\| 0.23 -> 1.27 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|oss-sparksuite-invoice\|p1\|design#1\|dx` | -0.23 | 1.27 | 1 pdf-probe-pt | "design" \|dx\| 0.23 -> 1.27 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|oss-sparksuite-invoice\|p1\|$300.00#1\|dx` | -1.72 | -3.22 | 1 pdf-probe-pt | "$300.00" \|dx\| 1.72 -> 3.22 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|oss-sparksuite-invoice\|p1\|Hosting#1\|dx` | -0.23 | 1.27 | 1 pdf-probe-pt | "Hosting" \|dx\| 0.23 -> 1.27 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|oss-sparksuite-invoice\|p1\|(3#1\|dx` | -0.23 | 1.27 | 1 pdf-probe-pt | "(3" \|dx\| 0.23 -> 1.27 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|oss-sparksuite-invoice\|p1\|months)#1\|dx` | -0.23 | 1.27 | 1 pdf-probe-pt | "months)" \|dx\| 0.23 -> 1.27 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|oss-sparksuite-invoice\|p1\|$75.00#1\|dx` | -1.73 | -3.23 | 1 pdf-probe-pt | "$75.00" \|dx\| 1.73 -> 3.23 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|oss-sparksuite-invoice\|p1\|Domain#1\|dx` | -0.23 | 1.27 | 1 pdf-probe-pt | "Domain" \|dx\| 0.23 -> 1.27 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|oss-sparksuite-invoice\|p1\|name#1\|dx` | -0.23 | 1.27 | 1 pdf-probe-pt | "name" \|dx\| 0.23 -> 1.27 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|oss-sparksuite-invoice\|p1\|(1#1\|dx` | -0.23 | 1.27 | 1 pdf-probe-pt | "(1" \|dx\| 0.23 -> 1.27 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|oss-sparksuite-invoice\|p1\|year)#1\|dx` | -0.23 | 1.27 | 1 pdf-probe-pt | "year)" \|dx\| 0.23 -> 1.27 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|oss-sparksuite-invoice\|p1\|$10.00#1\|dx` | -1.73 | -3.23 | 1 pdf-probe-pt | "$10.00" \|dx\| 1.73 -> 3.23 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|oss-sparksuite-invoice\|p1\|Total:#1\|dx` | -1.73 | -3.23 | 1 pdf-probe-pt | "Total:" \|dx\| 1.73 -> 3.23 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|oss-sparksuite-invoice\|p1\|$385.00#1\|dx` | -1.73 | -3.23 | 1 pdf-probe-pt | "$385.00" \|dx\| 1.73 -> 3.23 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p2\|de#21\|dy` | 9.35 | 14.6 | 1 pdf-probe-pt | "de" \|dy\| 9.35 -> 14.6 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p2\|de#24\|dy` | 5.6 | 16.1 | 1 pdf-probe-pt | "de" \|dy\| 5.6 -> 16.1 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p3\|de#4\|dx` | 13.99 | -22.89 | 1 pdf-probe-pt | "de" \|dx\| 13.99 -> 22.89 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p3\|de#16\|dy` | -15.4 | 27.35 | 1 pdf-probe-pt | "de" \|dy\| 15.4 -> 27.35 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p3\|—#8\|dy` | 4.85 | 27.35 | 1 pdf-probe-pt | "—" \|dy\| 4.85 -> 27.35 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p3\|de#17\|dy` | 4.85 | -10.15 | 1 pdf-probe-pt | "de" \|dy\| 4.85 -> 10.15 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p3\|de#18\|dx` | 6.98 | -29.96 | 1 pdf-probe-pt | "de" \|dx\| 6.98 -> 29.96 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p3\|—#11\|dy` | 1.85 | -4.15 | 1 pdf-probe-pt | "—" \|dy\| 1.85 -> 4.15 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p3\|de#24\|dx` | 11.63 | 25.27 | 1 pdf-probe-pt | "de" \|dx\| 11.63 -> 25.27 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p4\|de#4\|dx` | 11.17 | -25.72 | 1 pdf-probe-pt | "de" \|dx\| 11.17 -> 25.72 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p4\|de#6\|dx` | -1.58 | -10.63 | 1 pdf-probe-pt | "de" \|dx\| 1.58 -> 10.63 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p4\|de#15\|dy` | -2.65 | -16.15 | 1 pdf-probe-pt | "de" \|dy\| 2.65 -> 16.15 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p4\|de#26\|dy` | 17.6 | 21.35 | 1 pdf-probe-pt | "de" \|dy\| 17.6 -> 21.35 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p5\|de#3\|dx` | 6.98 | -29.96 | 1 pdf-probe-pt | "de" \|dx\| 6.98 -> 29.96 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p5\|de#3\|dy` | 17.6 | 19.1 | 1 pdf-probe-pt | "de" \|dy\| 17.6 -> 19.1 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p5\|de#7\|dy` | -4.15 | -26.65 | 1 pdf-probe-pt | "de" \|dy\| 4.15 -> 26.65 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p5\|de#10\|dy` | 10.1 | -16.9 | 1 pdf-probe-pt | "de" \|dy\| 10.1 -> 16.9 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p5\|de#11\|dx` | 16.39 | -20.54 | 1 pdf-probe-pt | "de" \|dx\| 16.39 -> 20.54 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p5\|de#11\|dy` | -9.4 | -16.9 | 1 pdf-probe-pt | "de" \|dy\| 9.4 -> 16.9 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p5\|de#13\|dx` | 0.04 | 22.53 | 1 pdf-probe-pt | "de" \|dx\| 0.04 -> 22.53 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p5\|de#15\|dy` | 9.35 | 23.6 | 1 pdf-probe-pt | "de" \|dy\| 9.35 -> 23.6 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p5\|—#9\|dy` | -10.15 | -14.65 | 1 pdf-probe-pt | "—" \|dy\| 10.15 -> 14.65 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p5\|—#11\|dx` | 17.78 | -19.11 | 1 pdf-probe-pt | "—" \|dx\| 17.78 -> 19.11 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p5\|—#11\|dy` | 5.6 | 28.1 | 1 pdf-probe-pt | "—" \|dy\| 5.6 -> 28.1 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p6\|—#1\|dy` | 17.6 | 19.1 | 1 pdf-probe-pt | "—" \|dy\| 17.6 -> 19.1 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p6\|de#4\|dx` | 16.39 | -20.54 | 1 pdf-probe-pt | "de" \|dx\| 16.39 -> 20.54 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p6\|—#8\|dy` | -2.65 | 21.35 | 1 pdf-probe-pt | "—" \|dy\| 2.65 -> 21.35 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p6\|de#12\|dy` | -2.65 | -14.65 | 1 pdf-probe-pt | "de" \|dy\| 2.65 -> 14.65 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p6\|Lançamentos#2\|dy` | -13.9 | -25.9 | 1 pdf-probe-pt | "Lançamentos" \|dy\| 13.9 -> 25.9 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p6\|de#13\|dy` | -13.9 | -25.9 | 1 pdf-probe-pt | "de" \|dy\| 13.9 -> 25.9 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p6\|de#14\|dx` | 17.88 | -19.01 | 1 pdf-probe-pt | "de" \|dx\| 17.88 -> 19.01 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p6\|de#14\|dy` | 6.35 | -7.9 | 1 pdf-probe-pt | "de" \|dy\| 6.35 -> 7.9 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p6\|2026#2\|dy` | -13.9 | -25.9 | 1 pdf-probe-pt | "2026" \|dy\| 13.9 -> 25.9 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p6\|de#17\|dy` | 4.85 | -12.4 | 1 pdf-probe-pt | "de" \|dy\| 4.85 -> 12.4 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p6\|de#19\|dy` | 0.35 | -17.65 | 1 pdf-probe-pt | "de" \|dy\| 0.35 -> 17.65 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p6\|de#25\|dy` | -15.4 | 16.85 | 1 pdf-probe-pt | "de" \|dy\| 15.4 -> 16.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p6\|de#26\|dx` | 1.25 | 20.06 | 1 pdf-probe-pt | "de" \|dx\| 1.25 -> 20.06 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p6\|de#26\|dy` | -15.4 | 16.85 | 1 pdf-probe-pt | "de" \|dy\| 15.4 -> 16.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p6\|de#29\|dx` | 8.82 | -28.08 | 1 pdf-probe-pt | "de" \|dx\| 8.82 -> 28.08 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p6\|de#29\|dy` | -7.15 | 11.6 | 1 pdf-probe-pt | "de" \|dy\| 7.15 -> 11.6 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p7\|de#5\|dx` | 13.64 | -23.26 | 1 pdf-probe-pt | "de" \|dx\| 13.64 -> 23.26 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p2\|de#27\|pairing` | dx 26.32 dy 10.1 | unpaired |  | Chrome's "de" (page 2) lost its vellora counterpart: missing, on another page, or more than 36 pt away |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p2\|de#28\|pairing` | dx -2.95 dy -28.15 | unpaired |  | Chrome's "de" (page 2) lost its vellora counterpart: missing, on another page, or more than 36 pt away |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p3\|de#9\|pairing` | dx -1.58 dy -1.15 | unpaired |  | Chrome's "de" (page 3) lost its vellora counterpart: missing, on another page, or more than 36 pt away |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p4\|de#3\|pairing` | dx -19.53 dy 18.35 | unpaired |  | Chrome's "de" (page 4) lost its vellora counterpart: missing, on another page, or more than 36 pt away |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p4\|de#17\|pairing` | dx -2.95 dy -12.4 | unpaired |  | Chrome's "de" (page 4) lost its vellora counterpart: missing, on another page, or more than 36 pt away |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p4\|de#18\|pairing` | dx -9.13 dy -2.65 | unpaired |  | Chrome's "de" (page 4) lost its vellora counterpart: missing, on another page, or more than 36 pt away |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p4\|de#19\|pairing` | dx -13.87 dy -19.9 | unpaired |  | Chrome's "de" (page 4) lost its vellora counterpart: missing, on another page, or more than 36 pt away |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p4\|de#20\|pairing` | dx -5.36 dy -16.9 | unpaired |  | Chrome's "de" (page 4) lost its vellora counterpart: missing, on another page, or more than 36 pt away |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p4\|de#24\|pairing` | dx 0.77 dy 31.85 | unpaired |  | Chrome's "de" (page 4) lost its vellora counterpart: missing, on another page, or more than 36 pt away |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p5\|—#3\|pairing` | dx 4.54 dy 17.6 | unpaired |  | Chrome's "—" (page 5) lost its vellora counterpart: missing, on another page, or more than 36 pt away |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p5\|de#9\|pairing` | dx -29.46 dy -2.65 | unpaired |  | Chrome's "de" (page 5) lost its vellora counterpart: missing, on another page, or more than 36 pt away |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p5\|Lançamentos#2\|pairing` | dx 0.03 dy -25.15 | unpaired |  | Chrome's "Lançamentos" (page 5) lost its vellora counterpart: missing, on another page, or more than 36 pt away |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p5\|de#14\|pairing` | dx -10.34 dy -25.15 | unpaired |  | Chrome's "de" (page 5) lost its vellora counterpart: missing, on another page, or more than 36 pt away |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p5\|2026#2\|pairing` | dx -10.33 dy -25.15 | unpaired |  | Chrome's "2026" (page 5) lost its vellora counterpart: missing, on another page, or more than 36 pt away |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p5\|de#19\|pairing` | dx 11.17 dy 6.35 | unpaired |  | Chrome's "de" (page 5) lost its vellora counterpart: missing, on another page, or more than 36 pt away |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p5\|de#20\|pairing` | dx 8.82 dy 29.6 | unpaired |  | Chrome's "de" (page 5) lost its vellora counterpart: missing, on another page, or more than 36 pt away |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p6\|de#7\|pairing` | dx -29.46 dy -7.15 | unpaired |  | Chrome's "de" (page 6) lost its vellora counterpart: missing, on another page, or more than 36 pt away |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p6\|de#10\|pairing` | dx 0.77 dy -8.65 | unpaired |  | Chrome's "de" (page 6) lost its vellora counterpart: missing, on another page, or more than 36 pt away |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p7\|do#2\|pairing` | dx -13.07 dy 13.1 | unpaired |  | Chrome's "do" (page 7) lost its vellora counterpart: missing, on another page, or more than 36 pt away |

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

## Improvements (2685)

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
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|Recibo#1\|dy` | -3.08 | -0.08 | 1 pdf-probe-pt | "Recibo" \|dy\| 3.08 -> 0.08 pt |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|do#1\|dy` | -3.08 | -0.08 | 1 pdf-probe-pt | "do" \|dy\| 3.08 -> 0.08 pt |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|Pagador#1\|dy` | -3.08 | -0.08 | 1 pdf-probe-pt | "Pagador" \|dy\| 3.08 -> 0.08 pt |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|BANCO#1\|dy` | -18.99 | -1.19 | 1 pdf-probe-pt | "BANCO" \|dy\| 18.99 -> 1.19 pt |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|EXEMPLO#1\|dy` | -18.99 | -1.19 | 1 pdf-probe-pt | "EXEMPLO" \|dy\| 18.99 -> 1.19 pt |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|Beneficiário#1\|dy` | -1.74 | 0.67 | 1 pdf-probe-pt | "Beneficiário" \|dy\| 1.74 -> 0.67 pt |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|CPF/CNPJ#1\|dx` | 28.48 | 2.98 | 1 pdf-probe-pt | "CPF/CNPJ" \|dx\| 28.48 -> 2.98 pt |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|CPF/CNPJ#1\|dy` | -1.74 | 0.67 | 1 pdf-probe-pt | "CPF/CNPJ" \|dy\| 1.74 -> 0.67 pt |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|do#2\|dx` | 28.48 | 2.98 | 1 pdf-probe-pt | "do" \|dx\| 28.48 -> 2.98 pt |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|do#2\|dy` | -1.74 | 0.67 | 1 pdf-probe-pt | "do" \|dy\| 1.74 -> 0.67 pt |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|Beneficiário#2\|dx` | 28.48 | 2.98 | 1 pdf-probe-pt | "Beneficiário" \|dx\| 28.48 -> 2.98 pt |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|Beneficiário#2\|dy` | -1.74 | 0.67 | 1 pdf-probe-pt | "Beneficiário" \|dy\| 1.74 -> 0.67 pt |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|Oficina#1\|dy` | -1.74 | 0.67 | 1 pdf-probe-pt | "Oficina" \|dy\| 1.74 -> 0.67 pt |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|Exemplo#1\|dy` | -1.74 | 0.67 | 1 pdf-probe-pt | "Exemplo" \|dy\| 1.74 -> 0.67 pt |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|de#1\|dy` | -1.74 | 0.67 | 1 pdf-probe-pt | "de" \|dy\| 1.74 -> 0.67 pt |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|Testes#1\|dy` | -1.74 | 0.67 | 1 pdf-probe-pt | "Testes" \|dy\| 1.74 -> 0.67 pt |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|Ltda.#1\|dy` | -1.74 | 0.67 | 1 pdf-probe-pt | "Ltda." \|dy\| 1.74 -> 0.67 pt |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|11.222.333/0001-81#1\|dx` | 28.48 | 2.98 | 1 pdf-probe-pt | "11.222.333/0001-81" \|dx\| 28.48 -> 2.98 pt |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|11.222.333/0001-81#1\|dy` | -1.74 | 0.67 | 1 pdf-probe-pt | "11.222.333/0001-81" \|dy\| 1.74 -> 0.67 pt |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|1234#1\|dx` | 32.65 | 3.9 | 1 pdf-probe-pt | "1234" \|dx\| 32.65 -> 3.9 pt |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|1234#1\|dy` | -1.74 | 0.67 | 1 pdf-probe-pt | "1234" \|dy\| 1.74 -> 0.67 pt |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|/#2\|dx` | -21.53 | 3.9 | 1 pdf-probe-pt | "/" \|dx\| 21.53 -> 3.9 pt |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|/#2\|dy` | -12.24 | 0.67 | 1 pdf-probe-pt | "/" \|dy\| 12.24 -> 0.67 pt |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|Nr.#1\|dx` | 9.57 | 1.32 | 1 pdf-probe-pt | "Nr." \|dx\| 9.57 -> 1.32 pt |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|do#6\|dx` | 9.57 | 1.32 | 1 pdf-probe-pt | "do" \|dx\| 9.57 -> 1.32 pt |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|documento#2\|dx` | 9.57 | 1.32 | 1 pdf-probe-pt | "documento" \|dx\| 9.57 -> 1.32 pt |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|Aceite#1\|dx` | 19.04 | 2.54 | 1 pdf-probe-pt | "Aceite" \|dx\| 19.04 -> 2.54 pt |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|Data#2\|dx` | 28.48 | 2.98 | 1 pdf-probe-pt | "Data" \|dx\| 28.48 -> 2.98 pt |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|do#7\|dx` | 28.48 | 2.98 | 1 pdf-probe-pt | "do" \|dx\| 28.48 -> 2.98 pt |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|processamento#1\|dx` | 28.48 | 2.98 | 1 pdf-probe-pt | "processamento" \|dx\| 28.48 -> 2.98 pt |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|NF-2026/00417#1\|dx` | 9.57 | 1.32 | 1 pdf-probe-pt | "NF-2026/00417" \|dx\| 9.57 -> 1.32 pt |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|N#1\|dx` | 19.04 | 2.54 | 1 pdf-probe-pt | "N" \|dx\| 19.04 -> 2.54 pt |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|15/10/2026#2\|dx` | 28.48 | 2.98 | 1 pdf-probe-pt | "15/10/2026" \|dx\| 28.48 -> 2.98 pt |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|Espécie#1\|dx` | 9.57 | 1.32 | 1 pdf-probe-pt | "Espécie" \|dx\| 9.57 -> 1.32 pt |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|Vencimento#1\|dx` | 19.04 | 2.54 | 1 pdf-probe-pt | "Vencimento" \|dx\| 19.04 -> 2.54 pt |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|Valor#1\|dx` | 28.48 | 2.98 | 1 pdf-probe-pt | "Valor" \|dx\| 28.48 -> 2.98 pt |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|do#9\|dx` | 28.48 | 2.98 | 1 pdf-probe-pt | "do" \|dx\| 28.48 -> 2.98 pt |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|Documento#1\|dx` | 28.48 | 2.98 | 1 pdf-probe-pt | "Documento" \|dx\| 28.48 -> 2.98 pt |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|R$#1\|dx` | 9.57 | 1.32 | 1 pdf-probe-pt | "R$" \|dx\| 9.57 -> 1.32 pt |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|30/11/2026#1\|dx` | 19.04 | 2.54 | 1 pdf-probe-pt | "30/11/2026" \|dx\| 19.04 -> 2.54 pt |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|1.842,50#1\|dx` | -5.67 | 2.97 | 1 pdf-probe-pt | "1.842,50" \|dx\| 5.67 -> 2.97 pt |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|de#2\|dx` | 24.1 | -0.08 | 1 pdf-probe-pt | "de" \|dx\| 24.1 -> 0.08 pt |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|de#2\|dy` | 14.76 | 3.67 | 1 pdf-probe-pt | "de" \|dy\| 14.76 -> 3.67 pt |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|de#4\|dx` | 10.93 | 0.85 | 1 pdf-probe-pt | "de" \|dx\| 10.93 -> 0.85 pt |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|de#4\|dy` | 33.76 | -2.33 | 1 pdf-probe-pt | "de" \|dy\| 33.76 -> 2.33 pt |
| pdf-probe | `pdf-probe\|boleto-febraban\|unpaired-chrome` | 235 | 0 | 0 count | Chrome words vellora lacks: 235 -> 0 |
| pdf-probe | `pdf-probe\|boleto-febraban\|unpaired-vellora` | 229 | 0 | 0 count | vellora words Chrome lacks: 229 -> 0 |
| … | 1312 more in gate-report.json | | | | |

WPT/crashtest improvements: 1253 (listed in gate-report.json).

## Worse within tolerance (1054; not gating, counted; the head ratchet sums them)

| group | key | before | after | tolerance | detail |
|---|---|---|---|---|---|
| oracles:layout REF-W | `invoice\|REF-W\|oracles:layout\|plain\|criterion#1\|maxMm` | 2.44 | 2.53 | 0.1 position-mm | 2.44 -> 2.53 (worse, within tolerance 0.1 mm) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|Beneficiário#1\|dx` | 0.1 | 0.85 | 1 pdf-probe-pt | "Beneficiário" \|dx\| 0.1 -> 0.85 pt (worse, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|Oficina#1\|dx` | 0.1 | 0.85 | 1 pdf-probe-pt | "Oficina" \|dx\| 0.1 -> 0.85 pt (worse, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|Exemplo#1\|dx` | 0.1 | 0.85 | 1 pdf-probe-pt | "Exemplo" \|dx\| 0.1 -> 0.85 pt (worse, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|de#1\|dx` | 0.1 | 0.85 | 1 pdf-probe-pt | "de" \|dx\| 0.1 -> 0.85 pt (worse, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|Testes#1\|dx` | 0.1 | 0.85 | 1 pdf-probe-pt | "Testes" \|dx\| 0.1 -> 0.85 pt (worse, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|Ltda.#1\|dx` | 0.11 | 0.86 | 1 pdf-probe-pt | "Ltda." \|dx\| 0.11 -> 0.86 pt (worse, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|Endereço#1\|dx` | 0.1 | 0.85 | 1 pdf-probe-pt | "Endereço" \|dx\| 0.1 -> 0.85 pt (worse, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|Endereço#1\|dy` | -0.99 | 1.42 | 1 pdf-probe-pt | "Endereço" \|dy\| 0.99 -> 1.42 pt (worse, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|do#4\|dx` | 0.1 | 0.85 | 1 pdf-probe-pt | "do" \|dx\| 0.1 -> 0.85 pt (worse, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|do#4\|dy` | -0.99 | 1.42 | 1 pdf-probe-pt | "do" \|dy\| 0.99 -> 1.42 pt (worse, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|Beneficiário#4\|dx` | 0.1 | 0.85 | 1 pdf-probe-pt | "Beneficiário" \|dx\| 0.1 -> 0.85 pt (worse, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|Beneficiário#4\|dy` | -0.99 | 1.42 | 1 pdf-probe-pt | "Beneficiário" \|dy\| 0.99 -> 1.42 pt (worse, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|Rua#1\|dx` | 0.1 | 0.85 | 1 pdf-probe-pt | "Rua" \|dx\| 0.1 -> 0.85 pt (worse, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|Rua#1\|dy` | -0.99 | 1.42 | 1 pdf-probe-pt | "Rua" \|dy\| 0.99 -> 1.42 pt (worse, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|das#1\|dx` | 0.1 | 0.85 | 1 pdf-probe-pt | "das" \|dx\| 0.1 -> 0.85 pt (worse, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|das#1\|dy` | -0.99 | 1.42 | 1 pdf-probe-pt | "das" \|dy\| 0.99 -> 1.42 pt (worse, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|Acácias,#1\|dx` | 0.09 | 0.84 | 1 pdf-probe-pt | "Acácias," \|dx\| 0.09 -> 0.84 pt (worse, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|Acácias,#1\|dy` | -0.99 | 1.42 | 1 pdf-probe-pt | "Acácias," \|dy\| 0.99 -> 1.42 pt (worse, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|1500,#1\|dx` | 0.09 | 0.84 | 1 pdf-probe-pt | "1500," \|dx\| 0.09 -> 0.84 pt (worse, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|1500,#1\|dy` | -0.99 | 1.42 | 1 pdf-probe-pt | "1500," \|dy\| 0.99 -> 1.42 pt (worse, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|Sala#1\|dx` | 0.09 | 0.84 | 1 pdf-probe-pt | "Sala" \|dx\| 0.09 -> 0.84 pt (worse, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|Sala#1\|dy` | -0.99 | 1.42 | 1 pdf-probe-pt | "Sala" \|dy\| 0.99 -> 1.42 pt (worse, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|42#1\|dx` | 0.09 | 0.84 | 1 pdf-probe-pt | "42" \|dx\| 0.09 -> 0.84 pt (worse, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|42#1\|dy` | -0.99 | 1.42 | 1 pdf-probe-pt | "42" \|dy\| 0.99 -> 1.42 pt (worse, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|—#1\|dx` | 0.09 | 0.84 | 1 pdf-probe-pt | "—" \|dx\| 0.09 -> 0.84 pt (worse, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|—#1\|dy` | -0.99 | 1.42 | 1 pdf-probe-pt | "—" \|dy\| 0.99 -> 1.42 pt (worse, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|Jardim#1\|dx` | 0.09 | 0.84 | 1 pdf-probe-pt | "Jardim" \|dx\| 0.09 -> 0.84 pt (worse, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|Jardim#1\|dy` | -0.99 | 1.42 | 1 pdf-probe-pt | "Jardim" \|dy\| 0.99 -> 1.42 pt (worse, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|Sintético#1\|dx` | 0.09 | 0.84 | 1 pdf-probe-pt | "Sintético" \|dx\| 0.09 -> 0.84 pt (worse, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|Sintético#1\|dy` | -0.99 | 1.42 | 1 pdf-probe-pt | "Sintético" \|dy\| 0.99 -> 1.42 pt (worse, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|—#2\|dx` | 0.09 | 0.84 | 1 pdf-probe-pt | "—" \|dx\| 0.09 -> 0.84 pt (worse, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|—#2\|dy` | -0.99 | 1.42 | 1 pdf-probe-pt | "—" \|dy\| 0.99 -> 1.42 pt (worse, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|São#1\|dx` | 0.09 | 0.84 | 1 pdf-probe-pt | "São" \|dx\| 0.09 -> 0.84 pt (worse, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|São#1\|dy` | -0.99 | 1.42 | 1 pdf-probe-pt | "São" \|dy\| 0.99 -> 1.42 pt (worse, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|José#1\|dx` | 0.1 | 0.85 | 1 pdf-probe-pt | "José" \|dx\| 0.1 -> 0.85 pt (worse, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|José#1\|dy` | -0.99 | 1.42 | 1 pdf-probe-pt | "José" \|dy\| 0.99 -> 1.42 pt (worse, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|dos#1\|dx` | 0.1 | 0.85 | 1 pdf-probe-pt | "dos" \|dx\| 0.1 -> 0.85 pt (worse, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|dos#1\|dy` | -0.99 | 1.42 | 1 pdf-probe-pt | "dos" \|dy\| 0.99 -> 1.42 pt (worse, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|Exemplos#1\|dx` | 0.1 | 0.85 | 1 pdf-probe-pt | "Exemplos" \|dx\| 0.1 -> 0.85 pt (worse, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|Exemplos#1\|dy` | -0.99 | 1.42 | 1 pdf-probe-pt | "Exemplos" \|dy\| 0.99 -> 1.42 pt (worse, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|/#3\|dx` | 0.1 | 0.85 | 1 pdf-probe-pt | "/" \|dx\| 0.1 -> 0.85 pt (worse, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|/#3\|dy` | -0.99 | 1.42 | 1 pdf-probe-pt | "/" \|dy\| 0.99 -> 1.42 pt (worse, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|SP#1\|dx` | 0.1 | 0.85 | 1 pdf-probe-pt | "SP" \|dx\| 0.1 -> 0.85 pt (worse, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|SP#1\|dy` | -0.99 | 1.42 | 1 pdf-probe-pt | "SP" \|dy\| 0.99 -> 1.42 pt (worse, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|—#3\|dx` | 0.08 | 0.83 | 1 pdf-probe-pt | "—" \|dx\| 0.08 -> 0.83 pt (worse, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|—#3\|dy` | -0.99 | 1.42 | 1 pdf-probe-pt | "—" \|dy\| 0.99 -> 1.42 pt (worse, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|CEP#1\|dx` | 0.08 | 0.83 | 1 pdf-probe-pt | "CEP" \|dx\| 0.08 -> 0.83 pt (worse, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|CEP#1\|dy` | -0.99 | 1.42 | 1 pdf-probe-pt | "CEP" \|dy\| 0.99 -> 1.42 pt (worse, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|01310-930#1\|dx` | 0.08 | 0.83 | 1 pdf-probe-pt | "01310-930" \|dx\| 0.08 -> 0.83 pt (worse, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|01310-930#1\|dy` | -0.99 | 1.42 | 1 pdf-probe-pt | "01310-930" \|dy\| 0.99 -> 1.42 pt (worse, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|Data#1\|dx` | 0.1 | 0.85 | 1 pdf-probe-pt | "Data" \|dx\| 0.1 -> 0.85 pt (worse, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|do#5\|dx` | 0.1 | 0.85 | 1 pdf-probe-pt | "do" \|dx\| 0.1 -> 0.85 pt (worse, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|documento#1\|dx` | 0.1 | 0.85 | 1 pdf-probe-pt | "documento" \|dx\| 0.1 -> 0.85 pt (worse, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|15/10/2026#1\|dx` | 0.1 | 0.85 | 1 pdf-probe-pt | "15/10/2026" \|dx\| 0.1 -> 0.85 pt (worse, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|Pagador#2\|dx` | 0.1 | 0.85 | 1 pdf-probe-pt | "Pagador" \|dx\| 0.1 -> 0.85 pt (worse, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|Maria#1\|dx` | 0.1 | 0.85 | 1 pdf-probe-pt | "Maria" \|dx\| 0.1 -> 0.85 pt (worse, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|da#1\|dx` | 0.1 | 0.85 | 1 pdf-probe-pt | "da" \|dx\| 0.1 -> 0.85 pt (worse, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|Conceição#1\|dx` | 0.1 | 0.85 | 1 pdf-probe-pt | "Conceição" \|dx\| 0.1 -> 0.85 pt (worse, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|Exemplo#2\|dx` | 0.1 | 0.85 | 1 pdf-probe-pt | "Exemplo" \|dx\| 0.1 -> 0.85 pt (worse, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|Carteira#1\|dx` | 0.1 | 0.85 | 1 pdf-probe-pt | "Carteira" \|dx\| 0.1 -> 0.85 pt (worse, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|RG#1\|dx` | 0.1 | 0.85 | 1 pdf-probe-pt | "RG" \|dx\| 0.1 -> 0.85 pt (worse, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|Mecânica#1\|dx` | -0.07 | -0.09 | 1 pdf-probe-pt | "Mecânica" \|dx\| 0.07 -> 0.09 pt (worse, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|—#5\|dx` | -0.06 | -0.1 | 1 pdf-probe-pt | "—" \|dx\| 0.06 -> 0.1 pt (worse, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|Recibo#2\|dx` | -0.05 | -0.1 | 1 pdf-probe-pt | "Recibo" \|dx\| 0.05 -> 0.1 pt (worse, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|do#10\|dx` | -0.05 | -0.11 | 1 pdf-probe-pt | "do" \|dx\| 0.05 -> 0.11 pt (worse, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|Pagador#4\|dx` | -0.05 | -0.11 | 1 pdf-probe-pt | "Pagador" \|dx\| 0.05 -> 0.11 pt (worse, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto\|p1\|DO#1\|dx` | 0.38 | 0.39 | 1 pdf-probe-pt | "DO" \|dx\| 0.38 -> 0.39 pt (worse, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto\|p1\|PAGADOR#1\|dx` | 0.39 | 0.41 | 1 pdf-probe-pt | "PAGADOR" \|dx\| 0.39 -> 0.41 pt (worse, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto\|p1\|BENEFICIÁRIO#1\|dx` | 0.69 | 1.44 | 1 pdf-probe-pt | "BENEFICIÁRIO" \|dx\| 0.69 -> 1.44 pt (worse, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto\|p1\|Acme#1\|dx` | 0.69 | 1.44 | 1 pdf-probe-pt | "Acme" \|dx\| 0.69 -> 1.44 pt (worse, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto\|p1\|Widgets#1\|dx` | 0.69 | 1.44 | 1 pdf-probe-pt | "Widgets" \|dx\| 0.69 -> 1.44 pt (worse, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto\|p1\|Comércio#1\|dx` | 0.69 | 1.44 | 1 pdf-probe-pt | "Comércio" \|dx\| 0.69 -> 1.44 pt (worse, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto\|p1\|LTDA#1\|dx` | 0.69 | 1.44 | 1 pdf-probe-pt | "LTDA" \|dx\| 0.69 -> 1.44 pt (worse, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto\|p1\|NOSSO#1\|dx` | 0.69 | 1.44 | 1 pdf-probe-pt | "NOSSO" \|dx\| 0.69 -> 1.44 pt (worse, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto\|p1\|NÚMERO#1\|dx` | 0.72 | 1.48 | 1 pdf-probe-pt | "NÚMERO" \|dx\| 0.72 -> 1.48 pt (worse, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto\|p1\|00000000000123456-7#1\|dx` | 0.69 | 1.44 | 1 pdf-probe-pt | "00000000000123456-7" \|dx\| 0.69 -> 1.44 pt (worse, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto\|p1\|LOCAL#1\|dx` | 0.69 | 1.44 | 1 pdf-probe-pt | "LOCAL" \|dx\| 0.69 -> 1.44 pt (worse, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto\|p1\|LOCAL#1\|dy` | 1.03 | 1.85 | 1 pdf-probe-pt | "LOCAL" \|dy\| 1.03 -> 1.85 pt (worse, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto\|p1\|DE#1\|dx` | 0.71 | 1.47 | 1 pdf-probe-pt | "DE" \|dx\| 0.71 -> 1.47 pt (worse, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto\|p1\|DE#1\|dy` | 1.03 | 1.85 | 1 pdf-probe-pt | "DE" \|dy\| 1.03 -> 1.85 pt (worse, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto\|p1\|PAGAMENTO#1\|dx` | 0.72 | 1.49 | 1 pdf-probe-pt | "PAGAMENTO" \|dx\| 0.72 -> 1.49 pt (worse, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto\|p1\|PAGAMENTO#1\|dy` | 1.03 | 1.85 | 1 pdf-probe-pt | "PAGAMENTO" \|dy\| 1.03 -> 1.85 pt (worse, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto\|p1\|Pagável#1\|dx` | 0.69 | 1.44 | 1 pdf-probe-pt | "Pagável" \|dx\| 0.69 -> 1.44 pt (worse, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto\|p1\|Pagável#1\|dy` | 0.28 | 1.1 | 1 pdf-probe-pt | "Pagável" \|dy\| 0.28 -> 1.1 pt (worse, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto\|p1\|em#1\|dx` | 0.69 | 1.44 | 1 pdf-probe-pt | "em" \|dx\| 0.69 -> 1.44 pt (worse, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto\|p1\|em#1\|dy` | 0.28 | 1.1 | 1 pdf-probe-pt | "em" \|dy\| 0.28 -> 1.1 pt (worse, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto\|p1\|qualquer#1\|dx` | 0.69 | 1.44 | 1 pdf-probe-pt | "qualquer" \|dx\| 0.69 -> 1.44 pt (worse, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto\|p1\|qualquer#1\|dy` | 0.28 | 1.1 | 1 pdf-probe-pt | "qualquer" \|dy\| 0.28 -> 1.1 pt (worse, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto\|p1\|banco#1\|dx` | 0.69 | 1.44 | 1 pdf-probe-pt | "banco" \|dx\| 0.69 -> 1.44 pt (worse, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto\|p1\|banco#1\|dy` | 0.28 | 1.1 | 1 pdf-probe-pt | "banco" \|dy\| 0.28 -> 1.1 pt (worse, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto\|p1\|até#1\|dx` | 0.69 | 1.44 | 1 pdf-probe-pt | "até" \|dx\| 0.69 -> 1.44 pt (worse, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto\|p1\|até#1\|dy` | 0.28 | 1.1 | 1 pdf-probe-pt | "até" \|dy\| 0.28 -> 1.1 pt (worse, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto\|p1\|o#1\|dx` | 0.69 | 1.44 | 1 pdf-probe-pt | "o" \|dx\| 0.69 -> 1.44 pt (worse, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto\|p1\|o#1\|dy` | 0.28 | 1.1 | 1 pdf-probe-pt | "o" \|dy\| 0.28 -> 1.1 pt (worse, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto\|p1\|vencimento#1\|dx` | 0.69 | 1.44 | 1 pdf-probe-pt | "vencimento" \|dx\| 0.69 -> 1.44 pt (worse, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto\|p1\|vencimento#1\|dy` | 0.28 | 1.1 | 1 pdf-probe-pt | "vencimento" \|dy\| 0.28 -> 1.1 pt (worse, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto\|p1\|(boleto#1\|dx` | 0.69 | 1.44 | 1 pdf-probe-pt | "(boleto" \|dx\| 0.69 -> 1.44 pt (worse, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto\|p1\|(boleto#1\|dy` | 0.28 | 1.1 | 1 pdf-probe-pt | "(boleto" \|dy\| 0.28 -> 1.1 pt (worse, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto\|p1\|fictício#1\|dx` | 0.69 | 1.44 | 1 pdf-probe-pt | "fictício" \|dx\| 0.69 -> 1.44 pt (worse, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto\|p1\|fictício#1\|dy` | 0.28 | 1.1 | 1 pdf-probe-pt | "fictício" \|dy\| 0.28 -> 1.1 pt (worse, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto\|p1\|de#2\|dx` | 0.69 | 1.44 | 1 pdf-probe-pt | "de" \|dx\| 0.69 -> 1.44 pt (worse, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto\|p1\|de#2\|dy` | 0.28 | 1.1 | 1 pdf-probe-pt | "de" \|dy\| 0.28 -> 1.1 pt (worse, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto\|p1\|teste).#1\|dx` | 0.69 | 1.44 | 1 pdf-probe-pt | "teste)." \|dx\| 0.69 -> 1.44 pt (worse, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto\|p1\|teste).#1\|dy` | 0.28 | 1.1 | 1 pdf-probe-pt | "teste)." \|dy\| 0.28 -> 1.1 pt (worse, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto\|p1\|15/07/2026#2\|dy` | 0.28 | 1.1 | 1 pdf-probe-pt | "15/07/2026" \|dy\| 0.28 -> 1.1 pt (worse, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto\|p1\|BENEFICIÁRIO#3\|dx` | 0.69 | 1.44 | 1 pdf-probe-pt | "BENEFICIÁRIO" \|dx\| 0.69 -> 1.44 pt (worse, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto\|p1\|BENEFICIÁRIO#3\|dy` | 2.53 | 2.6 | 1 pdf-probe-pt | "BENEFICIÁRIO" \|dy\| 2.53 -> 2.6 pt (worse, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto\|p1\|AGÊNCIA#2\|dy` | 2.53 | 2.6 | 1 pdf-probe-pt | "AGÊNCIA" \|dy\| 2.53 -> 2.6 pt (worse, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto\|p1\|/#3\|dy` | 2.53 | 2.6 | 1 pdf-probe-pt | "/" \|dy\| 2.53 -> 2.6 pt (worse, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto\|p1\|CÓDIGO#2\|dy` | 2.53 | 2.6 | 1 pdf-probe-pt | "CÓDIGO" \|dy\| 2.53 -> 2.6 pt (worse, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto\|p1\|DO#4\|dy` | 2.53 | 2.6 | 1 pdf-probe-pt | "DO" \|dy\| 2.53 -> 2.6 pt (worse, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto\|p1\|Acme#2\|dx` | 0.69 | 1.44 | 1 pdf-probe-pt | "Acme" \|dx\| 0.69 -> 1.44 pt (worse, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto\|p1\|Acme#2\|dy` | 1.78 | 2.6 | 1 pdf-probe-pt | "Acme" \|dy\| 1.78 -> 2.6 pt (worse, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto\|p1\|Widgets#2\|dx` | 0.69 | 1.44 | 1 pdf-probe-pt | "Widgets" \|dx\| 0.69 -> 1.44 pt (worse, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto\|p1\|Widgets#2\|dy` | 1.78 | 2.6 | 1 pdf-probe-pt | "Widgets" \|dy\| 1.78 -> 2.6 pt (worse, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto\|p1\|Comércio#2\|dx` | 0.69 | 1.44 | 1 pdf-probe-pt | "Comércio" \|dx\| 0.69 -> 1.44 pt (worse, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto\|p1\|Comércio#2\|dy` | 1.78 | 2.6 | 1 pdf-probe-pt | "Comércio" \|dy\| 1.78 -> 2.6 pt (worse, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto\|p1\|LTDA#2\|dx` | 0.69 | 1.44 | 1 pdf-probe-pt | "LTDA" \|dx\| 0.69 -> 1.44 pt (worse, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto\|p1\|LTDA#2\|dy` | 1.78 | 2.6 | 1 pdf-probe-pt | "LTDA" \|dy\| 1.78 -> 2.6 pt (worse, within 1 pt) |
| … | 934 more in gate-report.json | | | | |

## newly-measured (1057)

| group | key | before | after | tolerance | detail |
|---|---|---|---|---|---|
| oracles:barcode DANFE-B1 | `danfe\|DANFE-B1\|oracles:barcode\|plain\|criterion#1` | NOT-RUN | PASS |  | now measured:  |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|104-0#1\|pairing` | unpaired | dx -0.7 dy -1.26 |  | Chrome's "104-0" (page 1) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|10492.46810#1\|pairing` | unpaired | dx -0.68 dy -0.25 |  | Chrome's "10492.46810" (page 1) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|31000.100045#1\|pairing` | unpaired | dx -0.63 dy -0.25 |  | Chrome's "31000.100045" (page 1) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|00041.700139#1\|pairing` | unpaired | dx -0.58 dy -0.25 |  | Chrome's "00041.700139" (page 1) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|7#1\|pairing` | unpaired | dx -0.53 dy -0.25 |  | Chrome's "7" (page 1) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|16460000184250#1\|pairing` | unpaired | dx -0.51 dy -0.25 |  | Chrome's "16460000184250" (page 1) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|Agência#1\|pairing` | unpaired | dx 4.66 dy 0.67 |  | Chrome's "Agência" (page 1) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|/#1\|pairing` | unpaired | dx 4.66 dy 0.67 |  | Chrome's "/" (page 1) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|Código#1\|pairing` | unpaired | dx 4.66 dy 0.67 |  | Chrome's "Código" (page 1) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|do#3\|pairing` | unpaired | dx 4.66 dy 0.67 |  | Chrome's "do" (page 1) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|Beneficiário#3\|pairing` | unpaired | dx 4.66 dy 0.67 |  | Chrome's "Beneficiário" (page 1) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|246813-1#1\|pairing` | unpaired | dx 3.9 dy 0.67 |  | Chrome's "246813-1" (page 1) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|Nosso#1\|pairing` | unpaired | dx 4.66 dy 2.17 |  | Chrome's "Nosso" (page 1) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|Número#1\|pairing` | unpaired | dx 4.66 dy 2.17 |  | Chrome's "Número" (page 1) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|14/000000000417001-1#1\|pairing` | unpaired | dx 3.9 dy 2.17 |  | Chrome's "14/000000000417001-1" (page 1) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|CPF/CNPJ#2\|pairing` | unpaired | dx 3.45 dy 2.92 |  | Chrome's "CPF/CNPJ" (page 1) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|do#8\|pairing` | unpaired | dx 3.45 dy 2.92 |  | Chrome's "do" (page 1) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|Pagador#3\|pairing` | unpaired | dx 3.45 dy 2.92 |  | Chrome's "Pagador" (page 1) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|123.456.789-09#1\|pairing` | unpaired | dx 3.45 dy 2.92 |  | Chrome's "123.456.789-09" (page 1) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|Valor#2\|pairing` | unpaired | dx 4.66 dy 3.67 |  | Chrome's "Valor" (page 1) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|Cobrado#1\|pairing` | unpaired | dx 4.66 dy 3.67 |  | Chrome's "Cobrado" (page 1) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|Demonstrativo#1\|pairing` | unpaired | dx -0.18 dy 4.42 |  | Chrome's "Demonstrativo" (page 1) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|Valor#3\|pairing` | unpaired | dx 0.3 dy 4.42 |  | Chrome's "Valor" (page 1) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|(R$)#1\|pairing` | unpaired | dx 0.3 dy 4.42 |  | Chrome's "(R$)" (page 1) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|Revisão#1\|pairing` | unpaired | dx -0.18 dy 3.67 |  | Chrome's "Revisão" (page 1) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|programada#1\|pairing` | unpaired | dx -0.15 dy 3.67 |  | Chrome's "programada" (page 1) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|—#4\|pairing` | unpaired | dx -0.11 dy 3.67 |  | Chrome's "—" (page 1) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|mão#1\|pairing` | unpaired | dx -0.1 dy 3.67 |  | Chrome's "mão" (page 1) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|obra#1\|pairing` | unpaired | dx -0.07 dy 3.67 |  | Chrome's "obra" (page 1) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|980,00#1\|pairing` | unpaired | dx 0.27 dy 3.67 |  | Chrome's "980,00" (page 1) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|Peças#1\|pairing` | unpaired | dx -0.18 dy 3.67 |  | Chrome's "Peças" (page 1) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|de#3\|pairing` | unpaired | dx -0.16 dy 3.67 |  | Chrome's "de" (page 1) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|reposição#1\|pairing` | unpaired | dx -0.14 dy 3.67 |  | Chrome's "reposição" (page 1) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|(filtros,#1\|pairing` | unpaired | dx -0.11 dy 3.67 |  | Chrome's "(filtros," (page 1) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|óleo#1\|pairing` | unpaired | dx -0.08 dy 3.67 |  | Chrome's "óleo" (page 1) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|sintético)#1\|pairing` | unpaired | dx -0.06 dy 3.67 |  | Chrome's "sintético)" (page 1) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|712,50#1\|pairing` | unpaired | dx 0.27 dy 3.67 |  | Chrome's "712,50" (page 1) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|Alinhamento#1\|pairing` | unpaired | dx -0.18 dy 4.42 |  | Chrome's "Alinhamento" (page 1) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|e#1\|pairing` | unpaired | dx -0.14 dy 4.42 |  | Chrome's "e" (page 1) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|balanceamento#1\|pairing` | unpaired | dx -0.13 dy 4.42 |  | Chrome's "balanceamento" (page 1) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|150,00#1\|pairing` | unpaired | dx 0.27 dy 4.42 |  | Chrome's "150,00" (page 1) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|Corte#1\|pairing` | unpaired | dx -0.83 dy -2.33 |  | Chrome's "Corte" (page 1) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|na#1\|pairing` | unpaired | dx -0.83 dy -2.33 |  | Chrome's "na" (page 1) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|linha#1\|pairing` | unpaired | dx -0.83 dy -2.33 |  | Chrome's "linha" (page 1) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|pontilhada#1\|pairing` | unpaired | dx -0.83 dy -2.33 |  | Chrome's "pontilhada" (page 1) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|104-0#2\|pairing` | unpaired | dx -0.7 dy -3.51 |  | Chrome's "104-0" (page 1) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|10492.46810#2\|pairing` | unpaired | dx -0.68 dy -2.5 |  | Chrome's "10492.46810" (page 1) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|31000.100045#2\|pairing` | unpaired | dx -0.63 dy -2.5 |  | Chrome's "31000.100045" (page 1) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|00041.700139#2\|pairing` | unpaired | dx -0.58 dy -2.5 |  | Chrome's "00041.700139" (page 1) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|7#2\|pairing` | unpaired | dx -0.53 dy -2.5 |  | Chrome's "7" (page 1) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|16460000184250#2\|pairing` | unpaired | dx -0.51 dy -2.5 |  | Chrome's "16460000184250" (page 1) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|BANCO#2\|pairing` | unpaired | dx 0.1 dy -3.44 |  | Chrome's "BANCO" (page 1) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|EXEMPLO#2\|pairing` | unpaired | dx 0.1 dy -3.44 |  | Chrome's "EXEMPLO" (page 1) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|Local#1\|pairing` | unpaired | dx 0.85 dy -2.33 |  | Chrome's "Local" (page 1) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|pagamento#1\|pairing` | unpaired | dx 0.85 dy -2.33 |  | Chrome's "pagamento" (page 1) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|Vencimento#2\|pairing` | unpaired | dx 4.68 dy -2.33 |  | Chrome's "Vencimento" (page 1) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|EM#1\|pairing` | unpaired | dx 0.85 dy -2.33 |  | Chrome's "EM" (page 1) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|TODA#1\|pairing` | unpaired | dx 0.85 dy -2.33 |  | Chrome's "TODA" (page 1) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|A#1\|pairing` | unpaired | dx 0.85 dy -2.33 |  | Chrome's "A" (page 1) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|REDE#1\|pairing` | unpaired | dx 0.85 dy -2.33 |  | Chrome's "REDE" (page 1) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|BANCÁRIA#1\|pairing` | unpaired | dx 0.85 dy -2.33 |  | Chrome's "BANCÁRIA" (page 1) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|E#1\|pairing` | unpaired | dx 0.85 dy -2.33 |  | Chrome's "E" (page 1) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|SEUS#1\|pairing` | unpaired | dx 0.85 dy -2.33 |  | Chrome's "SEUS" (page 1) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|CORRESPONDENTES#1\|pairing` | unpaired | dx 0.85 dy -2.33 |  | Chrome's "CORRESPONDENTES" (page 1) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|ATÉ#1\|pairing` | unpaired | dx 0.85 dy -2.33 |  | Chrome's "ATÉ" (page 1) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|O#1\|pairing` | unpaired | dx 0.85 dy -2.33 |  | Chrome's "O" (page 1) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|VALOR#1\|pairing` | unpaired | dx 0.85 dy -2.33 |  | Chrome's "VALOR" (page 1) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|LIMITE#1\|pairing` | unpaired | dx 0.86 dy -2.33 |  | Chrome's "LIMITE" (page 1) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|30/11/2026#2\|pairing` | unpaired | dx 3.92 dy -2.33 |  | Chrome's "30/11/2026" (page 1) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|Beneficiário#5\|pairing` | unpaired | dx 0.85 dy -0.83 |  | Chrome's "Beneficiário" (page 1) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|Agência#2\|pairing` | unpaired | dx 4.68 dy -0.83 |  | Chrome's "Agência" (page 1) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|/#4\|pairing` | unpaired | dx 4.68 dy -0.83 |  | Chrome's "/" (page 1) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|Código#2\|pairing` | unpaired | dx 4.68 dy -0.83 |  | Chrome's "Código" (page 1) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|do#11\|pairing` | unpaired | dx 4.68 dy -0.83 |  | Chrome's "do" (page 1) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|Beneficiário#6\|pairing` | unpaired | dx 4.68 dy -0.83 |  | Chrome's "Beneficiário" (page 1) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|Oficina#2\|pairing` | unpaired | dx 0.85 dy -0.83 |  | Chrome's "Oficina" (page 1) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|Exemplo#3\|pairing` | unpaired | dx 0.85 dy -0.83 |  | Chrome's "Exemplo" (page 1) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|de#5\|pairing` | unpaired | dx 0.85 dy -0.83 |  | Chrome's "de" (page 1) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|Testes#2\|pairing` | unpaired | dx 0.84 dy -0.83 |  | Chrome's "Testes" (page 1) now has a vellora counterpart |
| … | 977 more in gate-report.json | | | | |

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

## not-comparable (1)

| group | key | before | after | tolerance | detail |
|---|---|---|---|---|---|
| wpt crashtests | `wpt-crash` | absent | 0 panic/crash/timeout |  | baseline has no crashtest record; the run has 0 non-ok:  |

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

(a) accepted artefacts 0, (b) ledger debt 0, (c) neither 809, declared rejections 0.

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
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|Data#1\|dy` | -0.24 | 2.17 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "Data" \|dy\| 0.24 -> 2.17 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|do#5\|dy` | -0.24 | 2.17 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "do" \|dy\| 0.24 -> 2.17 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|documento#1\|dy` | -0.24 | 2.17 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "documento" \|dy\| 0.24 -> 2.17 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|Nr.#1\|dy` | -0.24 | 2.17 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "Nr." \|dy\| 0.24 -> 2.17 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|do#6\|dy` | -0.24 | 2.17 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "do" \|dy\| 0.24 -> 2.17 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|documento#2\|dy` | -0.24 | 2.17 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "documento" \|dy\| 0.24 -> 2.17 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|Aceite#1\|dy` | -0.24 | 2.17 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "Aceite" \|dy\| 0.24 -> 2.17 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|Data#2\|dy` | -0.24 | 2.17 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "Data" \|dy\| 0.24 -> 2.17 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|do#7\|dy` | -0.24 | 2.17 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "do" \|dy\| 0.24 -> 2.17 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|processamento#1\|dy` | -0.24 | 2.17 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "processamento" \|dy\| 0.24 -> 2.17 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|15/10/2026#1\|dy` | -0.24 | 2.17 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "15/10/2026" \|dy\| 0.24 -> 2.17 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|NF-2026/00417#1\|dy` | -0.24 | 2.17 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "NF-2026/00417" \|dy\| 0.24 -> 2.17 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|N#1\|dy` | -0.24 | 2.17 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "N" \|dy\| 0.24 -> 2.17 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|15/10/2026#2\|dy` | -0.24 | 2.17 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "15/10/2026" \|dy\| 0.24 -> 2.17 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|Pagador#2\|dy` | 0.51 | 2.92 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "Pagador" \|dy\| 0.51 -> 2.92 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|Maria#1\|dy` | 0.51 | 2.92 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "Maria" \|dy\| 0.51 -> 2.92 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|da#1\|dy` | 0.51 | 2.92 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "da" \|dy\| 0.51 -> 2.92 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|Conceição#1\|dy` | 0.51 | 2.92 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "Conceição" \|dy\| 0.51 -> 2.92 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|Exemplo#2\|dy` | 0.51 | 2.92 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "Exemplo" \|dy\| 0.51 -> 2.92 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|Carteira#1\|dy` | 1.26 | 3.67 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "Carteira" \|dy\| 1.26 -> 3.67 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|Espécie#1\|dy` | 1.26 | 3.67 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "Espécie" \|dy\| 1.26 -> 3.67 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|Vencimento#1\|dy` | 1.26 | 3.67 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "Vencimento" \|dy\| 1.26 -> 3.67 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|Valor#1\|dy` | 1.26 | 3.67 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "Valor" \|dy\| 1.26 -> 3.67 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|do#9\|dy` | 1.26 | 3.67 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "do" \|dy\| 1.26 -> 3.67 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|Documento#1\|dy` | 1.26 | 3.67 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "Documento" \|dy\| 1.26 -> 3.67 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|RG#1\|dy` | 1.26 | 3.67 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "RG" \|dy\| 1.26 -> 3.67 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|R$#1\|dy` | 1.26 | 3.67 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "R$" \|dy\| 1.26 -> 3.67 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|30/11/2026#1\|dy` | 1.26 | 3.67 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "30/11/2026" \|dy\| 1.26 -> 3.67 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|1.842,50#1\|dy` | 1.26 | 3.67 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "1.842,50" \|dy\| 1.26 -> 3.67 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|Referência#1\|dy` | 1.26 | 4.42 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "Referência" \|dy\| 1.26 -> 4.42 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|10/2026#1\|dy` | 0.51 | 3.67 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "10/2026" \|dy\| 0.51 -> 3.67 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|10/2026#2\|dy` | 0.51 | 3.67 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "10/2026" \|dy\| 0.51 -> 3.67 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|10/2026#3\|dy` | 1.26 | 4.42 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "10/2026" \|dy\| 1.26 -> 4.42 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|Autenticação#1\|dy` | 2.76 | 6.67 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "Autenticação" \|dy\| 2.76 -> 6.67 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|Mecânica#1\|dy` | 2.76 | 6.67 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "Mecânica" \|dy\| 2.76 -> 6.67 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|—#5\|dy` | 2.76 | 6.67 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "—" \|dy\| 2.76 -> 6.67 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|Recibo#2\|dy` | 2.76 | 6.67 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "Recibo" \|dy\| 2.76 -> 6.67 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|do#10\|dy` | 2.76 | 6.67 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "do" \|dy\| 2.76 -> 6.67 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|Pagador#4\|dy` | 2.76 | 6.67 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "Pagador" \|dy\| 2.76 -> 6.67 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|99990.00001#2\|dy` | 0.19 | 2.74 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "99990.00001" \|dy\| 0.19 -> 2.74 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|23456.700001#2\|dy` | 0.19 | 2.74 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "23456.700001" \|dy\| 0.19 -> 2.74 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|00000.000420#2\|dy` | 0.19 | 2.74 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "00000.000420" \|dy\| 0.19 -> 2.74 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|1#2\|dy` | 0.19 | 2.74 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "1" \|dy\| 0.19 -> 2.74 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto\|p1\|99990000012345#2\|dy` | 0.19 | 2.74 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "99990000012345" \|dy\| 0.19 -> 2.74 pt vs Chrome (baseline) |
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
| … | 609 more in gate-report.json | | | | |

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
| pdf-probe | improvement 1359, newly-measured 1056, within-tolerance 1053, regression 743 |
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

