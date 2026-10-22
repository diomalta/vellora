# Fidelity gate report

**Verdict: FAIL** (0 gating item(s) vs the previous link, 974 vs the chain head fidelity/baselines/port/00-start; 0 flagged WPT pass(es) lost, reported, not gating; 0 value(s) worse within tolerance, listed, not gating; pin view: merge to main BLOCKED, 809 (c) item(s)). Local macOS runs are INDICATIVE.

| field | value |
|---|---|
| date | 2026-10-22T22:32:32.202Z |
| command | `node fidelity/gate/run.mjs --baseline fidelity/baselines/port/08-html-parse --run fidelity/baselines/port/09-review-fixes --accept fidelity/baselines/port/09-review-fixes/manifest.json --head fidelity/baselines/port/00-start --pin fidelity/baselines/pin --layout-from ~/.cache/vellora-fidelity/run-all-09-review-fixes-20261021T205223Z --step 09-review-fixes --out <scratch>/09-vs-08-head-00-start` |
| baseline | fidelity/baselines/port/08-html-parse (vellora-fidelity/baseline/2) |
| run | fidelity/baselines/port/09-review-fixes (vellora-fidelity/baseline/2) |

Counts: gating 0, headGating 974, debt 0, flaggedPassLost 0, unchanged 14903, withinTolerance 0, withinToleranceBetter 0, pinA 0, pinB 0, pinC 809.

## Absolute failures of the run (gate, cannot be accepted)

none

## Regressions beyond tolerance (gate)

none outside WPT

## Accepted regressions (acceptedRegressions, with evidence)

none

## Declared strict-gate rejections (declaredRejections, 0)

none

## Reported, not gating (0)

none

## Improvements (0)

none outside WPT

## Worse within tolerance (0; not gating, counted; the head ratchet sums them)

none

## Head ratchet vs fidelity/baselines/port/00-start (GATE-H1): FAIL

Every item worse than the chain head beyond its tolerance gates unless a class-a acceptance of this step (0 counted, 0 legacy/other ignored) or a DEBT.json entry within its ceiling covers it. Counts: head-regression 974, gating 974, improvement 2849, withinTolerance 317, flaggedPassLost 5.

### head-regression: worse than the head, no ledger entry (gate, rule i) (974)

| group | key | before | after | tolerance | detail |
|---|---|---|---|---|---|
| corpus DANFE-L | `danfe\|DANFE-L1a\|corpus\|\|criterion#1\|posErrMm` | 1.56 | 2.09 | 0.1 position-mm | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): 1.56 -> 2.09 (tolerance 0.1 mm) |
| corpus DANFE-L | `danfe\|DANFE-L1b\|corpus\|\|criterion#1\|posErrMm` | 3.15 | 3.68 | 0.1 position-mm | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): 3.15 -> 3.68 (tolerance 0.1 mm) |
| corpus DANFE-L | `danfe\|DANFE-L1c\|corpus\|\|criterion#1\|posErrMm` | 4.71 | 5.24 | 0.1 position-mm | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): 4.71 -> 5.24 (tolerance 0.1 mm) |
| corpus DANFE-L | `danfe\|DANFE-L1d\|corpus\|\|criterion#1\|posErrMm` | 5.96 | 6.49 | 0.1 position-mm | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): 5.96 -> 6.49 (tolerance 0.1 mm) |
| corpus INV-R | `oss-postmark-receipt\|INV-R1\|corpus\|\|criterion#1\|worstMm` | 9.2 | 10.26 | 0.1 position-mm | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): 9.2 -> 10.26 (tolerance 0.1 mm) |
| corpus INV-R | `oss-sparksuite-invoice\|INV-R1\|corpus\|\|criterion#1\|worstMm` | 2.74 | 4.15 | 0.1 position-mm | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): 2.74 -> 4.15 (tolerance 0.1 mm) |
| wpt css/CSS2/floats-clear | `wpt\|css/CSS2/floats-clear/floats-153.xht` | pass | fail |  | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): pass -> fail (clean pass lost) |
| wpt css/CSS2/floats | `wpt\|css/CSS2/floats/floats-placement-vertical-003.xht` | pass | fail |  | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): pass -> fail (clean pass lost) |
| wpt css/CSS2/floats | `wpt\|css/CSS2/floats/floats-placement-vertical-004.xht` | pass | fail |  | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): pass -> fail (clean pass lost) |
| wpt css/CSS2/floats | `wpt\|css/CSS2/floats/zero-width-floats.html` | pass | fail |  | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): pass -> fail (clean pass lost) |
| wpt css/CSS2/linebox | `wpt\|css/CSS2/linebox/baseline-block-with-overflow-001.html` | pass | fail |  | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): pass -> fail (clean pass lost) |
| wpt css/CSS2/linebox | `wpt\|css/CSS2/linebox/inline-formatting-context-001.xht` | pass | fail |  | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): pass -> fail (clean pass lost) |
| wpt css/CSS2/linebox | `wpt\|css/CSS2/linebox/line-height-006.xht` | pass | fail |  | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): pass -> fail (clean pass lost) |
| wpt css/CSS2/linebox | `wpt\|css/CSS2/linebox/line-height-007.xht` | pass | fail |  | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): pass -> fail (clean pass lost) |
| wpt css/CSS2/linebox | `wpt\|css/CSS2/linebox/line-height-017.xht` | pass | fail |  | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): pass -> fail (clean pass lost) |
| wpt css/CSS2/linebox | `wpt\|css/CSS2/linebox/line-height-018.xht` | pass | fail |  | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): pass -> fail (clean pass lost) |
| wpt css/CSS2/linebox | `wpt\|css/CSS2/linebox/line-height-028.xht` | pass | fail |  | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): pass -> fail (clean pass lost) |
| wpt css/CSS2/linebox | `wpt\|css/CSS2/linebox/line-height-029.xht` | pass | fail |  | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): pass -> fail (clean pass lost) |
| wpt css/CSS2/linebox | `wpt\|css/CSS2/linebox/line-height-039.xht` | pass | fail |  | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): pass -> fail (clean pass lost) |
| wpt css/CSS2/linebox | `wpt\|css/CSS2/linebox/line-height-040.xht` | pass | fail |  | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): pass -> fail (clean pass lost) |
| wpt css/CSS2/linebox | `wpt\|css/CSS2/linebox/line-height-050.xht` | pass | fail |  | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): pass -> fail (clean pass lost) |
| wpt css/CSS2/linebox | `wpt\|css/CSS2/linebox/line-height-051.xht` | pass | fail |  | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): pass -> fail (clean pass lost) |
| wpt css/CSS2/linebox | `wpt\|css/CSS2/linebox/line-height-058.xht` | pass | fail |  | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): pass -> fail (clean pass lost) |
| wpt css/CSS2/linebox | `wpt\|css/CSS2/linebox/line-height-061.xht` | pass | fail |  | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): pass -> fail (clean pass lost) |
| wpt css/CSS2/linebox | `wpt\|css/CSS2/linebox/line-height-062.xht` | pass | fail |  | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): pass -> fail (clean pass lost) |
| wpt css/CSS2/linebox | `wpt\|css/CSS2/linebox/line-height-083.xht` | pass | fail |  | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): pass -> fail (clean pass lost) |
| wpt css/CSS2/linebox | `wpt\|css/CSS2/linebox/line-height-084.xht` | pass | fail |  | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): pass -> fail (clean pass lost) |
| wpt css/CSS2/linebox | `wpt\|css/CSS2/linebox/line-height-105.xht` | pass | fail |  | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): pass -> fail (clean pass lost) |
| wpt css/CSS2/linebox | `wpt\|css/CSS2/linebox/line-height-106.xht` | pass | fail |  | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): pass -> fail (clean pass lost) |
| wpt css/CSS2/linebox | `wpt\|css/CSS2/linebox/line-height-112.xht` | pass | fail |  | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): pass -> fail (clean pass lost) |
| wpt css/CSS2/normal-flow | `wpt\|css/CSS2/normal-flow/height-061.xht` | pass | fail |  | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): pass -> fail (clean pass lost) |
| wpt css/CSS2/normal-flow | `wpt\|css/CSS2/normal-flow/height-062.xht` | pass | fail |  | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): pass -> fail (clean pass lost) |
| wpt css/CSS2/normal-flow | `wpt\|css/CSS2/normal-flow/height-072.xht` | pass | fail |  | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): pass -> fail (clean pass lost) |
| wpt css/CSS2/normal-flow | `wpt\|css/CSS2/normal-flow/height-073.xht` | pass | fail |  | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): pass -> fail (clean pass lost) |
| wpt css/CSS2/normal-flow | `wpt\|css/CSS2/normal-flow/max-height-061.xht` | pass | fail |  | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): pass -> fail (clean pass lost) |
| wpt css/CSS2/normal-flow | `wpt\|css/CSS2/normal-flow/max-height-062.xht` | pass | fail |  | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): pass -> fail (clean pass lost) |
| wpt css/CSS2/normal-flow | `wpt\|css/CSS2/normal-flow/max-height-072.xht` | pass | fail |  | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): pass -> fail (clean pass lost) |
| wpt css/CSS2/normal-flow | `wpt\|css/CSS2/normal-flow/max-height-073.xht` | pass | fail |  | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): pass -> fail (clean pass lost) |
| wpt css/CSS2/normal-flow | `wpt\|css/CSS2/normal-flow/min-height-061.xht` | pass | fail |  | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): pass -> fail (clean pass lost) |
| wpt css/CSS2/normal-flow | `wpt\|css/CSS2/normal-flow/min-height-062.xht` | pass | fail |  | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): pass -> fail (clean pass lost) |
| wpt css/CSS2/normal-flow | `wpt\|css/CSS2/normal-flow/min-height-072.xht` | pass | fail |  | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): pass -> fail (clean pass lost) |
| wpt css/CSS2/normal-flow | `wpt\|css/CSS2/normal-flow/min-height-073.xht` | pass | fail |  | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): pass -> fail (clean pass lost) |
| wpt css/css-break | `wpt\|css/css-break/flexbox/flex-fragmented-with-float-descendant-001.html` | pass | fail |  | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): pass -> fail (clean pass lost) |
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
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|Data#1\|dy` | -0.99 | 2.17 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "Data" \|dy\| 0.99 -> 2.17 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|do#5\|dy` | -0.99 | 2.17 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "do" \|dy\| 0.99 -> 2.17 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|documento#1\|dy` | -0.99 | 2.17 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "documento" \|dy\| 0.99 -> 2.17 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|Nr.#1\|dy` | -0.99 | 2.17 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "Nr." \|dy\| 0.99 -> 2.17 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|do#6\|dy` | -0.99 | 2.17 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "do" \|dy\| 0.99 -> 2.17 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|documento#2\|dy` | -0.99 | 2.17 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "documento" \|dy\| 0.99 -> 2.17 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|Aceite#1\|dy` | -0.99 | 2.17 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "Aceite" \|dy\| 0.99 -> 2.17 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|Data#2\|dy` | -0.99 | 2.17 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "Data" \|dy\| 0.99 -> 2.17 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|do#7\|dy` | -0.99 | 2.17 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "do" \|dy\| 0.99 -> 2.17 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|processamento#1\|dy` | -0.99 | 2.17 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "processamento" \|dy\| 0.99 -> 2.17 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|15/10/2026#1\|dy` | -0.99 | 2.17 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "15/10/2026" \|dy\| 0.99 -> 2.17 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|NF-2026/00417#1\|dy` | -0.99 | 2.17 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "NF-2026/00417" \|dy\| 0.99 -> 2.17 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|N#1\|dy` | -0.99 | 2.17 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "N" \|dy\| 0.99 -> 2.17 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|15/10/2026#2\|dy` | -0.99 | 2.17 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "15/10/2026" \|dy\| 0.99 -> 2.17 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|Pagador#2\|dy` | -0.24 | 2.92 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "Pagador" \|dy\| 0.24 -> 2.92 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|Maria#1\|dy` | -0.24 | 2.92 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "Maria" \|dy\| 0.24 -> 2.92 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|da#1\|dy` | -0.24 | 2.92 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "da" \|dy\| 0.24 -> 2.92 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|Conceição#1\|dy` | -0.24 | 2.92 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "Conceição" \|dy\| 0.24 -> 2.92 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|Exemplo#2\|dy` | -0.24 | 2.92 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "Exemplo" \|dy\| 0.24 -> 2.92 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|Carteira#1\|dy` | 0.51 | 3.67 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "Carteira" \|dy\| 0.51 -> 3.67 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|Espécie#1\|dy` | 0.51 | 3.67 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "Espécie" \|dy\| 0.51 -> 3.67 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|Vencimento#1\|dy` | 0.51 | 3.67 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "Vencimento" \|dy\| 0.51 -> 3.67 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|Valor#1\|dy` | 0.51 | 3.67 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "Valor" \|dy\| 0.51 -> 3.67 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|do#9\|dy` | 0.51 | 3.67 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "do" \|dy\| 0.51 -> 3.67 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|Documento#1\|dy` | 0.51 | 3.67 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "Documento" \|dy\| 0.51 -> 3.67 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|RG#1\|dy` | 0.51 | 3.67 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "RG" \|dy\| 0.51 -> 3.67 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|R$#1\|dy` | 0.51 | 3.67 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "R$" \|dy\| 0.51 -> 3.67 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|30/11/2026#1\|dy` | 0.51 | 3.67 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "30/11/2026" \|dy\| 0.51 -> 3.67 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|1.842,50#1\|dy` | 0.51 | 3.67 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "1.842,50" \|dy\| 0.51 -> 3.67 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|Referência#1\|dy` | 1.26 | 4.42 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "Referência" \|dy\| 1.26 -> 4.42 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|10/2026#1\|dy` | 0.51 | 3.67 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "10/2026" \|dy\| 0.51 -> 3.67 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|10/2026#2\|dy` | 0.51 | 3.67 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "10/2026" \|dy\| 0.51 -> 3.67 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|10/2026#3\|dy` | 1.26 | 4.42 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "10/2026" \|dy\| 1.26 -> 4.42 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|Autenticação#1\|dy` | 3.51 | 6.67 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "Autenticação" \|dy\| 3.51 -> 6.67 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|Mecânica#1\|dy` | 3.51 | 6.67 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "Mecânica" \|dy\| 3.51 -> 6.67 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|—#5\|dy` | 3.51 | 6.67 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "—" \|dy\| 3.51 -> 6.67 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|Recibo#2\|dy` | 3.51 | 6.67 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "Recibo" \|dy\| 3.51 -> 6.67 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|do#10\|dy` | 3.51 | 6.67 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "do" \|dy\| 3.51 -> 6.67 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|Pagador#4\|dy` | 3.51 | 6.67 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "Pagador" \|dy\| 3.51 -> 6.67 pt vs Chrome (baseline) |
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
| … | 774 more in gate-report.json | | | | |

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

## Pin view vs fidelity/baselines/pin (GATE-H3): merge to main BLOCKED (reported; --main makes (c) gate)

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

## Tolerances

| class | tolerance | label | rationale |
|---|---|---|---|
| position-mm | 0.1 mm | DESIGN TARGET | word/anchor position error vs a reference (REF-W max/p95, REF-R worst anchor, DANFE-L1, LET-1). 0.1 mm (0.28 pt, 0.38 CSS px) is 10x the 0.01 mm the values are reported with and below one CSS px (0.26 mm), the smallest step a px-snapping layout can move; the measurement is deterministic for one build and one reference (CONFIRMED: equal inputs gave equal values in the Phase A repeat run). |
| geometry-excess-mm | 0.05 mm | DESIGN TARGET | distance OUTSIDE a specification window (BOL-G*, DANFE-B*, DANFE-M1, TXT-A1). Inside the window the spec admits any value, so only the excess is ratcheted; 0.05 mm is about one 600 dpi raster pixel (0.042 mm), the measurement quantum of measure_bars.py / the page ink box. |
| font-excess-pt | 0.05 pt | SPEC-derived tolerance unit | font-size excess outside a window; 0.05 pt is the tolerance ACCEPTANCE.md already applies to every font-size criterion (BOL-T*, DANFE-F*). |
| count | 0 count | DESIGN TARGET | integer counts from deterministic tools (required strings found, extractor missing/extra tokens, segments/glyphs attributed, decoded symbols): any loss is a real change of the document. |
| page-delta | 0 pages | DESIGN TARGET | \|vellora pages - reference pages\|: a page break moving is never noise. |
| pdf-probe-pt | 1 pt | DESIGN TARGET | per-word \|dx\| / \|dy\| of vellora's PDF vs Chrome's PDF (pdf-probe semantics 2: PyMuPDF pen origin and baseline, same-page position pairs keyed by the Chrome word). 1 pt (0.35 mm) is an order of magnitude below the Phase A regressions it must catch (invoice price column +9 pt, notification signature -14 pt) and above the 0.01 pt rounding of the probe and sub-px snapping differences. The per-fixture unpaired-word counts use the count class. |

