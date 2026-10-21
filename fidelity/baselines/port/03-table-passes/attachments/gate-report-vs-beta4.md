# Fidelity gate report

**Verdict: FAIL** (110 gating item(s)). Local macOS runs are INDICATIVE.

| field | value |
|---|---|
| date | 2026-10-21T11:56:07.411Z |
| command | `node fidelity/gate/run.mjs --baseline fidelity/baselines/beta4 --run fidelity/results/run-all/03-table-passes --out fidelity/results/run-all/03-table-passes/gate-vs-beta4` |
| baseline | fidelity/baselines/beta4 (vellora-fidelity/baseline-beta4/1/manifest) |
| run | fidelity/results/run-all/03-table-passes (vellora-fidelity/run-all/1) |
| os / cpu | darwin 27.0.0 arm64 (macOS 27.0.1) / Apple M5 Pro |
| node / rustc | v22.23.2 / rustc 1.96.0 (ac68faa20 2026-05-25) |
| chrome | Google Chrome 155.0.8059.85 |
| blitz | 0.3.0-beta.4 registry+https://github.com/rust-lang/crates.io-index |
| git | phaseb/03-table-passes 5ce90be792c5bd1bf3c9f71cffa25e29d24a37b6 (0 dirty) |

Counts: improvement 881, newly-measured 1, added 13, regression 110, reported 3, changed 1, not-comparable 6, gating 110, unchanged 9857, withinTolerance 1.

## Absolute failures of the run (gate, cannot be accepted)

none

## Regressions beyond tolerance (gate)

| group | key | before | after | tolerance | detail |
|---|---|---|---|---|---|
| corpus DANFE-M | `danfe\|DANFE-M1\|corpus\|\|criterion#1\|excessB` | 24.724 | 25.232 | 0.05 geometry-excess-mm | 24.724 -> 25.232 (tolerance 0.05 mm) |
| corpus INV-R | `oss-sparksuite-invoice\|INV-R1\|corpus\|\|criterion#1\|worstMm` | 2.74 | 3.09 | 0.1 position-mm | 2.74 -> 3.09 (tolerance 0.1 mm) |
| pdf-probe | `pdf-probe\|notification\|Permanecendo#1\|dy` | -0.98 | 4.02 | 1 pdf-probe-pt | "Permanecendo" \|dy\| 0.98 -> 4.02 pt vs Chrome |
| pdf-probe | `pdf-probe\|notification\|a#4\|dy` | -0.98 | 4.02 | 1 pdf-probe-pt | "a" \|dy\| 0.98 -> 4.02 pt vs Chrome |
| pdf-probe | `pdf-probe\|notification\|situação#1\|dy` | -0.98 | 4.02 | 1 pdf-probe-pt | "situação" \|dy\| 0.98 -> 4.02 pt vs Chrome |
| pdf-probe | `pdf-probe\|notification\|sem#1\|dy` | -0.98 | 4.02 | 1 pdf-probe-pt | "sem" \|dy\| 0.98 -> 4.02 pt vs Chrome |
| pdf-probe | `pdf-probe\|notification\|a#5\|dy` | -0.98 | 4.02 | 1 pdf-probe-pt | "a" \|dy\| 0.98 -> 4.02 pt vs Chrome |
| pdf-probe | `pdf-probe\|notification\|devida#1\|dy` | -0.98 | 4.02 | 1 pdf-probe-pt | "devida" \|dy\| 0.98 -> 4.02 pt vs Chrome |
| pdf-probe | `pdf-probe\|notification\|regularização#3\|dy` | -0.98 | 4.02 | 1 pdf-probe-pt | "regularização" \|dy\| 0.98 -> 4.02 pt vs Chrome |
| pdf-probe | `pdf-probe\|notification\|após#1\|dy` | -0.98 | 4.02 | 1 pdf-probe-pt | "após" \|dy\| 0.98 -> 4.02 pt vs Chrome |
| pdf-probe | `pdf-probe\|notification\|o#2\|dy` | -0.98 | 4.02 | 1 pdf-probe-pt | "o" \|dy\| 0.98 -> 4.02 pt vs Chrome |
| pdf-probe | `pdf-probe\|notification\|prazo#2\|dy` | -0.98 | 4.02 | 1 pdf-probe-pt | "prazo" \|dy\| 0.98 -> 4.02 pt vs Chrome |
| pdf-probe | `pdf-probe\|notification\|acima#1\|dy` | -0.98 | 4.02 | 1 pdf-probe-pt | "acima" \|dy\| 0.98 -> 4.02 pt vs Chrome |
| pdf-probe | `pdf-probe\|notification\|indicado,#1\|dy` | -0.98 | 4.02 | 1 pdf-probe-pt | "indicado," \|dy\| 0.98 -> 4.02 pt vs Chrome |
| pdf-probe | `pdf-probe\|notification\|informamos#1\|dy` | -0.98 | 4.02 | 1 pdf-probe-pt | "informamos" \|dy\| 0.98 -> 4.02 pt vs Chrome |
| pdf-probe | `pdf-probe\|notification\|que#1\|dy` | -0.98 | 4.02 | 1 pdf-probe-pt | "que" \|dy\| 0.98 -> 4.02 pt vs Chrome |
| pdf-probe | `pdf-probe\|notification\|serão#1\|dy` | -0.98 | 4.02 | 1 pdf-probe-pt | "serão" \|dy\| 0.98 -> 4.02 pt vs Chrome |
| pdf-probe | `pdf-probe\|notification\|adotadas#1\|dy` | -0.98 | 4.02 | 1 pdf-probe-pt | "adotadas" \|dy\| 0.98 -> 4.02 pt vs Chrome |
| pdf-probe | `pdf-probe\|notification\|as#2\|dy` | -0.98 | 4.02 | 1 pdf-probe-pt | "as" \|dy\| 0.98 -> 4.02 pt vs Chrome |
| pdf-probe | `pdf-probe\|notification\|providências#1\|dy` | -0.98 | 4.02 | 1 pdf-probe-pt | "providências" \|dy\| 0.98 -> 4.02 pt vs Chrome |
| pdf-probe | `pdf-probe\|notification\|cabíveis#1\|dy` | -0.98 | 4.02 | 1 pdf-probe-pt | "cabíveis" \|dy\| 0.98 -> 4.02 pt vs Chrome |
| pdf-probe | `pdf-probe\|notification\|previstas#1\|dy` | -0.98 | 4.02 | 1 pdf-probe-pt | "previstas" \|dy\| 0.98 -> 4.02 pt vs Chrome |
| pdf-probe | `pdf-probe\|notification\|em#5\|dy` | -0.98 | 4.02 | 1 pdf-probe-pt | "em" \|dy\| 0.98 -> 4.02 pt vs Chrome |
| pdf-probe | `pdf-probe\|notification\|contrato#2\|dy` | -0.98 | 4.02 | 1 pdf-probe-pt | "contrato" \|dy\| 0.98 -> 4.02 pt vs Chrome |
| pdf-probe | `pdf-probe\|notification\|e#2\|dy` | -0.98 | 4.02 | 1 pdf-probe-pt | "e" \|dy\| 0.98 -> 4.02 pt vs Chrome |
| pdf-probe | `pdf-probe\|notification\|na#2\|dy` | -0.98 | 4.02 | 1 pdf-probe-pt | "na" \|dy\| 0.98 -> 4.02 pt vs Chrome |
| pdf-probe | `pdf-probe\|notification\|legislação#1\|dy` | -0.98 | 4.02 | 1 pdf-probe-pt | "legislação" \|dy\| 0.98 -> 4.02 pt vs Chrome |
| pdf-probe | `pdf-probe\|notification\|aplicável,#1\|dy` | -0.98 | 4.02 | 1 pdf-probe-pt | "aplicável," \|dy\| 0.98 -> 4.02 pt vs Chrome |
| pdf-probe | `pdf-probe\|notification\|sem#2\|dy` | -0.98 | 4.02 | 1 pdf-probe-pt | "sem" \|dy\| 0.98 -> 4.02 pt vs Chrome |
| pdf-probe | `pdf-probe\|notification\|prejuízo#1\|dy` | -0.98 | 4.02 | 1 pdf-probe-pt | "prejuízo" \|dy\| 0.98 -> 4.02 pt vs Chrome |
| pdf-probe | `pdf-probe\|notification\|de#7\|dy` | -0.98 | 4.02 | 1 pdf-probe-pt | "de" \|dy\| 0.98 -> 4.02 pt vs Chrome |
| pdf-probe | `pdf-probe\|notification\|quaisquer#1\|dy` | -0.98 | 4.02 | 1 pdf-probe-pt | "quaisquer" \|dy\| 0.98 -> 4.02 pt vs Chrome |
| pdf-probe | `pdf-probe\|notification\|outras#1\|dy` | -0.98 | 4.02 | 1 pdf-probe-pt | "outras" \|dy\| 0.98 -> 4.02 pt vs Chrome |
| pdf-probe | `pdf-probe\|notification\|medidas.#1\|dy` | -0.98 | 4.02 | 1 pdf-probe-pt | "medidas." \|dy\| 0.98 -> 4.02 pt vs Chrome |
| pdf-probe | `pdf-probe\|notification\|Em#1\|dy` | -0.98 | 4.02 | 1 pdf-probe-pt | "Em" \|dy\| 0.98 -> 4.02 pt vs Chrome |
| pdf-probe | `pdf-probe\|notification\|caso#1\|dy` | -0.98 | 4.02 | 1 pdf-probe-pt | "caso" \|dy\| 0.98 -> 4.02 pt vs Chrome |
| pdf-probe | `pdf-probe\|notification\|de#8\|dy` | -0.98 | 4.02 | 1 pdf-probe-pt | "de" \|dy\| 0.98 -> 4.02 pt vs Chrome |
| pdf-probe | `pdf-probe\|notification\|pagamento#1\|dy` | -0.98 | 4.02 | 1 pdf-probe-pt | "pagamento" \|dy\| 0.98 -> 4.02 pt vs Chrome |
| pdf-probe | `pdf-probe\|notification\|já#1\|dy` | -0.98 | 4.02 | 1 pdf-probe-pt | "já" \|dy\| 0.98 -> 4.02 pt vs Chrome |
| pdf-probe | `pdf-probe\|notification\|efetuado,#1\|dy` | -0.98 | 4.02 | 1 pdf-probe-pt | "efetuado," \|dy\| 0.98 -> 4.02 pt vs Chrome |
| pdf-probe | `pdf-probe\|notification\|favor#1\|dy` | -0.98 | 4.02 | 1 pdf-probe-pt | "favor" \|dy\| 0.98 -> 4.02 pt vs Chrome |
| pdf-probe | `pdf-probe\|notification\|desconsiderar#1\|dy` | -0.98 | 4.02 | 1 pdf-probe-pt | "desconsiderar" \|dy\| 0.98 -> 4.02 pt vs Chrome |
| pdf-probe | `pdf-probe\|notification\|esta#1\|dy` | -0.98 | 4.02 | 1 pdf-probe-pt | "esta" \|dy\| 0.98 -> 4.02 pt vs Chrome |
| pdf-probe | `pdf-probe\|notification\|comunicação#1\|dy` | -0.98 | 4.02 | 1 pdf-probe-pt | "comunicação" \|dy\| 0.98 -> 4.02 pt vs Chrome |
| pdf-probe | `pdf-probe\|notification\|e#3\|dy` | -0.98 | 4.02 | 1 pdf-probe-pt | "e" \|dy\| 0.98 -> 4.02 pt vs Chrome |
| pdf-probe | `pdf-probe\|notification\|encaminhar#1\|dy` | -0.98 | 4.02 | 1 pdf-probe-pt | "encaminhar" \|dy\| 0.98 -> 4.02 pt vs Chrome |
| pdf-probe | `pdf-probe\|notification\|o#3\|dy` | -0.98 | 4.02 | 1 pdf-probe-pt | "o" \|dy\| 0.98 -> 4.02 pt vs Chrome |
| pdf-probe | `pdf-probe\|notification\|respectivo#1\|dy` | -0.98 | 4.02 | 1 pdf-probe-pt | "respectivo" \|dy\| 0.98 -> 4.02 pt vs Chrome |
| pdf-probe | `pdf-probe\|notification\|comprovante#1\|dy` | -0.98 | 4.02 | 1 pdf-probe-pt | "comprovante" \|dy\| 0.98 -> 4.02 pt vs Chrome |
| pdf-probe | `pdf-probe\|notification\|para#2\|dy` | -0.98 | 4.02 | 1 pdf-probe-pt | "para" \|dy\| 0.98 -> 4.02 pt vs Chrome |
| pdf-probe | `pdf-probe\|notification\|cobranca@exemplo-acme.test.#1\|dy` | -0.98 | 4.02 | 1 pdf-probe-pt | "cobranca@exemplo-acme.test." \|dy\| 0.98 -> 4.02 pt vs Chrome |
| pdf-probe | `pdf-probe\|notification\|Segue,#1\|dy` | -0.48 | 4.02 | 1 pdf-probe-pt | "Segue," \|dy\| 0.48 -> 4.02 pt vs Chrome |
| pdf-probe | `pdf-probe\|notification\|em#6\|dy` | -0.48 | 4.02 | 1 pdf-probe-pt | "em" \|dy\| 0.48 -> 4.02 pt vs Chrome |
| pdf-probe | `pdf-probe\|notification\|anexo,#1\|dy` | -0.48 | 4.02 | 1 pdf-probe-pt | "anexo," \|dy\| 0.48 -> 4.02 pt vs Chrome |
| pdf-probe | `pdf-probe\|notification\|demonstrativo#1\|dy` | -0.48 | 4.02 | 1 pdf-probe-pt | "demonstrativo" \|dy\| 0.48 -> 4.02 pt vs Chrome |
| pdf-probe | `pdf-probe\|notification\|detalhado#1\|dy` | -0.48 | 4.02 | 1 pdf-probe-pt | "detalhado" \|dy\| 0.48 -> 4.02 pt vs Chrome |
| pdf-probe | `pdf-probe\|notification\|do#2\|dy` | -0.48 | 4.02 | 1 pdf-probe-pt | "do" \|dy\| 0.48 -> 4.02 pt vs Chrome |
| pdf-probe | `pdf-probe\|notification\|débito#1\|dy` | -0.48 | 4.02 | 1 pdf-probe-pt | "débito" \|dy\| 0.48 -> 4.02 pt vs Chrome |
| pdf-probe | `pdf-probe\|notification\|para#3\|dy` | -0.48 | 4.02 | 1 pdf-probe-pt | "para" \|dy\| 0.48 -> 4.02 pt vs Chrome |
| pdf-probe | `pdf-probe\|notification\|sua#1\|dy` | -0.48 | 4.02 | 1 pdf-probe-pt | "sua" \|dy\| 0.48 -> 4.02 pt vs Chrome |
| pdf-probe | `pdf-probe\|notification\|conferência.#1\|dy` | -0.48 | 4.02 | 1 pdf-probe-pt | "conferência." \|dy\| 0.48 -> 4.02 pt vs Chrome |
| pdf-probe | `pdf-probe\|notification\|Sendo#1\|dy` | -0.73 | 4.02 | 1 pdf-probe-pt | "Sendo" \|dy\| 0.73 -> 4.02 pt vs Chrome |
| pdf-probe | `pdf-probe\|notification\|o#4\|dy` | -0.73 | 4.02 | 1 pdf-probe-pt | "o" \|dy\| 0.73 -> 4.02 pt vs Chrome |
| pdf-probe | `pdf-probe\|notification\|que#2\|dy` | -0.73 | 4.02 | 1 pdf-probe-pt | "que" \|dy\| 0.73 -> 4.02 pt vs Chrome |
| pdf-probe | `pdf-probe\|notification\|se#1\|dy` | -0.73 | 4.02 | 1 pdf-probe-pt | "se" \|dy\| 0.73 -> 4.02 pt vs Chrome |
| pdf-probe | `pdf-probe\|notification\|apresenta#1\|dy` | -0.73 | 4.02 | 1 pdf-probe-pt | "apresenta" \|dy\| 0.73 -> 4.02 pt vs Chrome |
| pdf-probe | `pdf-probe\|notification\|para#4\|dy` | -0.73 | 4.02 | 1 pdf-probe-pt | "para" \|dy\| 0.73 -> 4.02 pt vs Chrome |
| pdf-probe | `pdf-probe\|notification\|o#5\|dy` | -0.73 | 4.02 | 1 pdf-probe-pt | "o" \|dy\| 0.73 -> 4.02 pt vs Chrome |
| pdf-probe | `pdf-probe\|notification\|momento,#1\|dy` | -0.73 | 4.02 | 1 pdf-probe-pt | "momento," \|dy\| 0.73 -> 4.02 pt vs Chrome |
| pdf-probe | `pdf-probe\|notification\|colocamo-nos#1\|dy` | -0.73 | 4.02 | 1 pdf-probe-pt | "colocamo-nos" \|dy\| 0.73 -> 4.02 pt vs Chrome |
| pdf-probe | `pdf-probe\|notification\|à#2\|dy` | -0.73 | 4.02 | 1 pdf-probe-pt | "à" \|dy\| 0.73 -> 4.02 pt vs Chrome |
| pdf-probe | `pdf-probe\|notification\|disposição#1\|dy` | -0.73 | 4.02 | 1 pdf-probe-pt | "disposição" \|dy\| 0.73 -> 4.02 pt vs Chrome |
| pdf-probe | `pdf-probe\|notification\|para#5\|dy` | -0.73 | 4.02 | 1 pdf-probe-pt | "para" \|dy\| 0.73 -> 4.02 pt vs Chrome |
| pdf-probe | `pdf-probe\|notification\|os#2\|dy` | -0.73 | 4.02 | 1 pdf-probe-pt | "os" \|dy\| 0.73 -> 4.02 pt vs Chrome |
| pdf-probe | `pdf-probe\|notification\|esclarecimentos#1\|dy` | -0.73 | 4.02 | 1 pdf-probe-pt | "esclarecimentos" \|dy\| 0.73 -> 4.02 pt vs Chrome |
| pdf-probe | `pdf-probe\|notification\|que#3\|dy` | -0.73 | 4.02 | 1 pdf-probe-pt | "que" \|dy\| 0.73 -> 4.02 pt vs Chrome |
| pdf-probe | `pdf-probe\|notification\|se#2\|dy` | -0.73 | 4.02 | 1 pdf-probe-pt | "se" \|dy\| 0.73 -> 4.02 pt vs Chrome |
| pdf-probe | `pdf-probe\|notification\|fizerem#1\|dy` | -0.73 | 4.02 | 1 pdf-probe-pt | "fizerem" \|dy\| 0.73 -> 4.02 pt vs Chrome |
| pdf-probe | `pdf-probe\|notification\|necessários.#1\|dy` | -0.73 | 4.02 | 1 pdf-probe-pt | "necessários." \|dy\| 0.73 -> 4.02 pt vs Chrome |

### WPT / crashtest regressions (31)

| group | key | before | after | tolerance | detail |
|---|---|---|---|---|---|
| wpt css/CSS2/floats | `wpt\|css/CSS2/floats/zero-width-floats.html` | pass | fail |  | pass -> fail (clean pass lost) |
| wpt css/CSS2/linebox | `wpt\|css/CSS2/linebox/line-height-006.xht` | pass | fail |  | pass -> fail (clean pass lost) |
| wpt css/CSS2/linebox | `wpt\|css/CSS2/linebox/line-height-007.xht` | pass | fail |  | pass -> fail (clean pass lost) |
| wpt css/CSS2/linebox | `wpt\|css/CSS2/linebox/line-height-017.xht` | pass | fail |  | pass -> fail (clean pass lost) |
| wpt css/CSS2/linebox | `wpt\|css/CSS2/linebox/line-height-018.xht` | pass | fail |  | pass -> fail (clean pass lost) |
| wpt css/CSS2/linebox | `wpt\|css/CSS2/linebox/line-height-028.xht` | pass | fail |  | pass -> fail (clean pass lost) |
| wpt css/CSS2/linebox | `wpt\|css/CSS2/linebox/line-height-029.xht` | pass | fail |  | pass -> fail (clean pass lost) |
| wpt css/CSS2/linebox | `wpt\|css/CSS2/linebox/line-height-039.xht` | pass | fail |  | pass -> fail (clean pass lost) |
| wpt css/CSS2/linebox | `wpt\|css/CSS2/linebox/line-height-040.xht` | pass | fail |  | pass -> fail (clean pass lost) |
| wpt css/CSS2/linebox | `wpt\|css/CSS2/linebox/line-height-050.xht` | pass | fail |  | pass -> fail (clean pass lost) |
| wpt css/CSS2/linebox | `wpt\|css/CSS2/linebox/line-height-051.xht` | pass | fail |  | pass -> fail (clean pass lost) |
| wpt css/CSS2/linebox | `wpt\|css/CSS2/linebox/line-height-058.xht` | pass | fail |  | pass -> fail (clean pass lost) |
| wpt css/CSS2/linebox | `wpt\|css/CSS2/linebox/line-height-061.xht` | pass | fail |  | pass -> fail (clean pass lost) |
| wpt css/CSS2/linebox | `wpt\|css/CSS2/linebox/line-height-062.xht` | pass | fail |  | pass -> fail (clean pass lost) |
| wpt css/CSS2/linebox | `wpt\|css/CSS2/linebox/line-height-083.xht` | pass | fail |  | pass -> fail (clean pass lost) |
| wpt css/CSS2/linebox | `wpt\|css/CSS2/linebox/line-height-084.xht` | pass | fail |  | pass -> fail (clean pass lost) |
| wpt css/CSS2/linebox | `wpt\|css/CSS2/linebox/line-height-105.xht` | pass | fail |  | pass -> fail (clean pass lost) |
| wpt css/CSS2/linebox | `wpt\|css/CSS2/linebox/line-height-106.xht` | pass | fail |  | pass -> fail (clean pass lost) |
| wpt css/CSS2/linebox | `wpt\|css/CSS2/linebox/line-height-112.xht` | pass | fail |  | pass -> fail (clean pass lost) |
| wpt css/CSS2/normal-flow | `wpt\|css/CSS2/normal-flow/height-061.xht` | pass | fail |  | pass -> fail (clean pass lost) |
| wpt css/CSS2/normal-flow | `wpt\|css/CSS2/normal-flow/height-062.xht` | pass | fail |  | pass -> fail (clean pass lost) |
| wpt css/CSS2/normal-flow | `wpt\|css/CSS2/normal-flow/height-072.xht` | pass | fail |  | pass -> fail (clean pass lost) |
| wpt css/CSS2/normal-flow | `wpt\|css/CSS2/normal-flow/height-073.xht` | pass | fail |  | pass -> fail (clean pass lost) |
| wpt css/CSS2/normal-flow | `wpt\|css/CSS2/normal-flow/max-height-061.xht` | pass | fail |  | pass -> fail (clean pass lost) |
| wpt css/CSS2/normal-flow | `wpt\|css/CSS2/normal-flow/max-height-062.xht` | pass | fail |  | pass -> fail (clean pass lost) |
| wpt css/CSS2/normal-flow | `wpt\|css/CSS2/normal-flow/max-height-072.xht` | pass | fail |  | pass -> fail (clean pass lost) |
| wpt css/CSS2/normal-flow | `wpt\|css/CSS2/normal-flow/max-height-073.xht` | pass | fail |  | pass -> fail (clean pass lost) |
| wpt css/CSS2/normal-flow | `wpt\|css/CSS2/normal-flow/min-height-061.xht` | pass | fail |  | pass -> fail (clean pass lost) |
| wpt css/CSS2/normal-flow | `wpt\|css/CSS2/normal-flow/min-height-062.xht` | pass | fail |  | pass -> fail (clean pass lost) |
| wpt css/CSS2/normal-flow | `wpt\|css/CSS2/normal-flow/min-height-072.xht` | pass | fail |  | pass -> fail (clean pass lost) |
| wpt css/CSS2/normal-flow | `wpt\|css/CSS2/normal-flow/min-height-073.xht` | pass | fail |  | pass -> fail (clean pass lost) |

## Accepted regressions (acceptedRegressions, with evidence)

none

## Reported, not gating (3)

| group | key | before | after | tolerance | detail |
|---|---|---|---|---|---|
| wpt css/CSS2/linebox | `wpt\|css/CSS2/linebox/line-height-072.xht` | pass | fail |  | pass[ink-displaced-vs-chrome] -> fail (flagged pass: reported, not gated) |
| wpt css/CSS2/linebox | `wpt\|css/CSS2/linebox/line-height-073.xht` | pass | fail |  | pass[ink-displaced-vs-chrome] -> fail (flagged pass: reported, not gated) |
| wpt css/css-page | `wpt\|css/css-page/page-name-orthogonal-writing-002-print.html` | pass | fail |  | pass[ink-displaced-vs-chrome] -> fail (flagged pass: reported, not gated) |

## Improvements (881)

| group | key | before | after | tolerance | detail |
|---|---|---|---|---|---|
| corpus BOL-X | `boleto-febraban\|BOL-X1\|corpus\|\|criterion#1` | FAIL | PASS |  | 11/16 missing @linhaDigitavel.formatada, @titulo.vencimento (1/2×), @titulo.valor (1/2×), @titulo.nossoNumero, @beneficiario.agenciaCodigo -> 16/16 |
| corpus BOL-X | `boleto-febraban\|BOL-X2\|corpus\|\|criterion#1` | FAIL | PASS |  | pdftotext 11/16; pypdf 16/16; pdfminer 16/16 -> pdftotext 16/16; pypdf 16/16; pdfminer 16/16 |
| corpus BOL-B | `boleto-febraban\|BOL-B2\|corpus\|\|criterion#1` | FAIL | PASS |  | DVs true, rebuilds barcode true, printed text found false -> DVs true, rebuilds barcode true, printed text found true |
| oracles:text EXT-2 | `boleto-febraban\|EXT-2\|oracles:text\|plain\|criterion#1` | FAIL | WARN |  | pdftotext fail (missing 12, extra 8); pdfminer.six warn (missing 0, extra 0); pymupdf fail (missing 12, extra 8) -> pdftotext pass (missing 0, extra 0); pdfminer.six warn (missing 0, extra 0); pymupdf pass (missing 0, extra 0) |
| corpus BOL-X | `boleto-febraban.px-grid\|BOL-X1\|corpus\|\|criterion#1` | FAIL | PASS |  | 11/16 missing @linhaDigitavel.formatada, @titulo.vencimento (1/2×), @titulo.valor (1/2×), @titulo.nossoNumero, @beneficiario.agenciaCodigo -> 16/16 |
| corpus BOL-X | `boleto-febraban.px-grid\|BOL-X2\|corpus\|\|criterion#1` | FAIL | PASS |  | pdftotext 11/16; pypdf 16/16; pdfminer 16/16 -> pdftotext 16/16; pypdf 16/16; pdfminer 16/16 |
| corpus BOL-B | `boleto-febraban.px-grid\|BOL-B2\|corpus\|\|criterion#1` | FAIL | PASS |  | DVs true, rebuilds barcode true, printed text found false -> DVs true, rebuilds barcode true, printed text found true |
| oracles:text EXT-2 | `boleto-febraban.px-grid\|EXT-2\|oracles:text\|plain\|criterion#1` | FAIL | WARN |  | pdftotext fail (missing 12, extra 8); pdfminer.six warn (missing 0, extra 0); pymupdf fail (missing 12, extra 8) -> pdftotext pass (missing 0, extra 0); pdfminer.six warn (missing 0, extra 0); pymupdf pass (missing 0, extra 0) |
| corpus DANFE-X | `danfe\|DANFE-X1\|corpus\|\|criterion#1` | FAIL | PASS |  | 22/26 missing DOCUMENTO AUXILIAR DA NOTA FISCAL ELETRÔNICA, @chave.formatada, @imposto.vNF (2/3×), DESCRIÇÃO DO PRODUTO/SERVIÇO -> 26/26 |
| corpus DANFE-B | `danfe\|DANFE-B1\|corpus\|\|criterion#1` | FAIL | PASS |  | decodes false, validates false -> decodes true, validates true |
| corpus DANFE-B | `danfe\|DANFE-B5\|corpus\|\|criterion#1` | FAIL | PASS |  | 0.0423 (min 2.65) -> 2.8787 (min 2.65) |
| corpus DANFE-F | `danfe\|DANFE-F4c\|corpus\|\|criterion#1` | FAIL | PASS |  | 2/3 segments; min 8pt "0 - ENTRADA"; missing "DOCUMENTO AUXILIAR DA NOTA FISCAL ELETRÔ" -> 3/3 segments; min 8pt "DOCUMENTO AUXILIAR DA NOTA FISCAL ELETRÔNICA" |
| corpus DANFE-F | `danfe\|DANFE-F11\|corpus\|\|criterion#1` | FAIL | PASS |  | 3472/3511 glyphs attributed; sample "DOCUMENTOAUXILIARDANOTAFISCALELETRÔNICA" -> 3511/3511 glyphs attributed |
| corpus DANFE-L | `danfe\|DANFE-L1b\|corpus\|\|criterion#1` | FAIL | PASS |  | 6pt SWPJVR+LiberationSerif-Bold; pos Δ(0, 3.15) mm -> 6pt SWPJVR+LiberationSerif-Bold; pos Δ(0, 2.62) mm |
| oracles:text EXT-2 | `danfe\|EXT-2\|oracles:text\|plain\|criterion#1` | FAIL | WARN |  | pdftotext fail (missing 15, extra 10); pdfminer.six warn (missing 0, extra 0); pymupdf fail (missing 5, extra 5) -> pdftotext warn (missing 0, extra 0); pdfminer.six warn (missing 0, extra 0); pymupdf pass (missing 0, extra 0) |
| corpus TXT-R | `text-stress-ptbr\|TXT-R1\|corpus\|\|criterion#1` | FAIL | PASS |  | worst TXT-S5 11.86 mm (tol 1) -> worst TXT-S1 0.94 mm (tol 1) |
| oracles:text EXT-2 | `text-stress-ptbr\|EXT-2\|oracles:text\|plain\|criterion#1` | FAIL | WARN |  | pdftotext fail (missing 82, extra 50); pdfminer.six warn (missing 0, extra 9); pymupdf warn (missing 0, extra 9) -> pdftotext warn (missing 0, extra 9); pdfminer.six warn (missing 0, extra 9); pymupdf warn (missing 0, extra 9) |
| corpus BOL-X | `boleto-febraban\|BOL-X1\|corpus\|\|criterion#1\|found` | 11 | 16 | 0 count | 11 -> 16 |
| corpus BOL-X | `boleto-febraban\|BOL-X2\|corpus\|\|criterion#1\|found.pdftotext` | 11 | 16 | 0 count | 11 -> 16 |
| corpus BOL-B | `boleto-febraban\|BOL-B2\|corpus\|\|criterion#1\|printedTextFound` | 0 | 1 | 0 count | 0 -> 1 |
| corpus BOL-R | `boleto-febraban\|BOL-R1\|corpus\|\|criterion#1\|worstMm` | 86.02 | 4.8 | 0.1 position-mm | 86.02 -> 4.8 |
| oracles:text EXT-2 | `boleto-febraban\|EXT-2\|oracles:text\|plain\|criterion#1\|missing.pdftotext` | 12 | 0 | 0 count | 12 -> 0 |
| oracles:text EXT-2 | `boleto-febraban\|EXT-2\|oracles:text\|plain\|criterion#1\|extra.pdftotext` | 8 | 0 | 0 count | 8 -> 0 |
| oracles:text EXT-2 | `boleto-febraban\|EXT-2\|oracles:text\|plain\|criterion#1\|statusRank.pdftotext` | 1 | 3 | 0 count | 1 -> 3 |
| oracles:text EXT-2 | `boleto-febraban\|EXT-2\|oracles:text\|plain\|criterion#1\|missing.pymupdf` | 12 | 0 | 0 count | 12 -> 0 |
| oracles:text EXT-2 | `boleto-febraban\|EXT-2\|oracles:text\|plain\|criterion#1\|extra.pymupdf` | 8 | 0 | 0 count | 8 -> 0 |
| oracles:text EXT-2 | `boleto-febraban\|EXT-2\|oracles:text\|plain\|criterion#1\|statusRank.pymupdf` | 1 | 3 | 0 count | 1 -> 3 |
| oracles:layout REF-W | `boleto-febraban\|REF-W\|oracles:layout\|plain\|criterion#1\|maxMm` | 120.78 | 7.94 | 0.1 position-mm | 120.78 -> 7.94 |
| oracles:layout REF-W | `boleto-febraban\|REF-W\|oracles:layout\|plain\|criterion#1\|p95Mm` | 83.01 | 2.63 | 0.1 position-mm | 83.01 -> 2.63 |
| corpus BOL-X | `boleto-febraban.px-grid\|BOL-X1\|corpus\|\|criterion#1\|found` | 11 | 16 | 0 count | 11 -> 16 |
| corpus BOL-X | `boleto-febraban.px-grid\|BOL-X2\|corpus\|\|criterion#1\|found.pdftotext` | 11 | 16 | 0 count | 11 -> 16 |
| corpus BOL-B | `boleto-febraban.px-grid\|BOL-B2\|corpus\|\|criterion#1\|printedTextFound` | 0 | 1 | 0 count | 0 -> 1 |
| corpus BOL-R | `boleto-febraban.px-grid\|BOL-R1\|corpus\|\|criterion#1\|worstMm` | 86.02 | 4.8 | 0.1 position-mm | 86.02 -> 4.8 |
| oracles:text EXT-2 | `boleto-febraban.px-grid\|EXT-2\|oracles:text\|plain\|criterion#1\|missing.pdftotext` | 12 | 0 | 0 count | 12 -> 0 |
| oracles:text EXT-2 | `boleto-febraban.px-grid\|EXT-2\|oracles:text\|plain\|criterion#1\|extra.pdftotext` | 8 | 0 | 0 count | 8 -> 0 |
| oracles:text EXT-2 | `boleto-febraban.px-grid\|EXT-2\|oracles:text\|plain\|criterion#1\|statusRank.pdftotext` | 1 | 3 | 0 count | 1 -> 3 |
| oracles:text EXT-2 | `boleto-febraban.px-grid\|EXT-2\|oracles:text\|plain\|criterion#1\|missing.pymupdf` | 12 | 0 | 0 count | 12 -> 0 |
| oracles:text EXT-2 | `boleto-febraban.px-grid\|EXT-2\|oracles:text\|plain\|criterion#1\|extra.pymupdf` | 8 | 0 | 0 count | 8 -> 0 |
| oracles:text EXT-2 | `boleto-febraban.px-grid\|EXT-2\|oracles:text\|plain\|criterion#1\|statusRank.pymupdf` | 1 | 3 | 0 count | 1 -> 3 |
| oracles:layout REF-W | `boleto-febraban.px-grid\|REF-W\|oracles:layout\|plain\|criterion#1\|maxMm` | 120.78 | 7.94 | 0.1 position-mm | 120.78 -> 7.94 |
| oracles:layout REF-W | `boleto-febraban.px-grid\|REF-W\|oracles:layout\|plain\|criterion#1\|p95Mm` | 83.01 | 2.63 | 0.1 position-mm | 83.01 -> 2.63 |
| corpus DANFE-X | `danfe\|DANFE-X1\|corpus\|\|criterion#1\|found` | 22 | 26 | 0 count | 22 -> 26 |
| corpus DANFE-X | `danfe\|DANFE-X2\|corpus\|\|criterion#1\|found.pdftotext` | 22 | 26 | 0 count | 22 -> 26 |
| corpus DANFE-X | `danfe\|DANFE-X2\|corpus\|\|criterion#1\|found.pdfminer` | 25 | 26 | 0 count | 25 -> 26 |
| corpus DANFE-B | `danfe\|DANFE-B1\|corpus\|\|criterion#1\|decodes` | 0 | 1 | 0 count | 0 -> 1 |
| corpus DANFE-B | `danfe\|DANFE-B1\|corpus\|\|criterion#1\|validates` | 0 | 1 | 0 count | 0 -> 1 |
| corpus DANFE-B | `danfe\|DANFE-B5\|corpus\|\|criterion#1\|excess` | 2.6077 | 0 | 0.05 geometry-excess-mm | 2.6077 -> 0 |
| corpus DANFE-F | `danfe\|DANFE-F4c\|corpus\|\|criterion#1\|segments` | 2 | 3 | 0 count | 2 -> 3 |
| corpus DANFE-F | `danfe\|DANFE-F11\|corpus\|\|criterion#1\|glyphsAttributed` | 3472 | 3511 | 0 count | 3472 -> 3511 |
| corpus DANFE-L | `danfe\|DANFE-L1a\|corpus\|\|criterion#1\|posErrMm` | 1.56 | 1.03 | 0.1 position-mm | 1.56 -> 1.03 |
| corpus DANFE-L | `danfe\|DANFE-L1b\|corpus\|\|criterion#1\|posErrMm` | 3.15 | 2.62 | 0.1 position-mm | 3.15 -> 2.62 |
| corpus DANFE-L | `danfe\|DANFE-L1c\|corpus\|\|criterion#1\|posErrMm` | 4.71 | 4.18 | 0.1 position-mm | 4.71 -> 4.18 |
| corpus DANFE-L | `danfe\|DANFE-L1d\|corpus\|\|criterion#1\|posErrMm` | 5.96 | 5.43 | 0.1 position-mm | 5.96 -> 5.43 |
| oracles:text EXT-2 | `danfe\|EXT-2\|oracles:text\|plain\|criterion#1\|missing.pdftotext` | 15 | 0 | 0 count | 15 -> 0 |
| oracles:text EXT-2 | `danfe\|EXT-2\|oracles:text\|plain\|criterion#1\|extra.pdftotext` | 10 | 0 | 0 count | 10 -> 0 |
| oracles:text EXT-2 | `danfe\|EXT-2\|oracles:text\|plain\|criterion#1\|statusRank.pdftotext` | 1 | 2 | 0 count | 1 -> 2 |
| oracles:text EXT-2 | `danfe\|EXT-2\|oracles:text\|plain\|criterion#1\|missing.pymupdf` | 5 | 0 | 0 count | 5 -> 0 |
| oracles:text EXT-2 | `danfe\|EXT-2\|oracles:text\|plain\|criterion#1\|extra.pymupdf` | 5 | 0 | 0 count | 5 -> 0 |
| oracles:text EXT-2 | `danfe\|EXT-2\|oracles:text\|plain\|criterion#1\|statusRank.pymupdf` | 1 | 3 | 0 count | 1 -> 3 |
| oracles:layout REF-W | `danfe\|REF-W\|oracles:layout\|plain\|criterion#1\|maxMm` | 45.69 | 4.71 | 0.1 position-mm | 45.69 -> 4.71 |
| oracles:layout REF-W | `danfe\|REF-W\|oracles:layout\|plain\|criterion#1\|p95Mm` | 33.25 | 3.43 | 0.1 position-mm | 33.25 -> 3.43 |
| oracles:layout REF-W | `invoice\|REF-W\|oracles:layout\|plain\|criterion#1\|maxMm` | 3.91 | 2.81 | 0.1 position-mm | 3.91 -> 2.81 |
| oracles:layout REF-W | `invoice\|REF-W\|oracles:layout\|plain\|criterion#1\|p95Mm` | 3.78 | 2.78 | 0.1 position-mm | 3.78 -> 2.78 |
| oracles:layout REF-W | `notification\|REF-W\|oracles:layout\|plain\|criterion#1\|maxMm` | 8.54 | 1.63 | 0.1 position-mm | 8.54 -> 1.63 |
| oracles:layout REF-W | `notification\|REF-W\|oracles:layout\|plain\|criterion#1\|p95Mm` | 8.42 | 1.07 | 0.1 position-mm | 8.42 -> 1.07 |
| oracles:layout REF-W | `receipt\|REF-W\|oracles:layout\|plain\|criterion#1\|p95Mm` | 4.06 | 2.03 | 0.1 position-mm | 4.06 -> 2.03 |
| corpus TXT-R | `text-stress-ptbr\|TXT-R1\|corpus\|\|criterion#1\|worstMm` | 11.86 | 0.94 | 0.1 position-mm | 11.86 -> 0.94 |
| oracles:text EXT-2 | `text-stress-ptbr\|EXT-2\|oracles:text\|plain\|criterion#1\|missing.pdftotext` | 82 | 0 | 0 count | 82 -> 0 |
| oracles:text EXT-2 | `text-stress-ptbr\|EXT-2\|oracles:text\|plain\|criterion#1\|extra.pdftotext` | 50 | 9 | 0 count | 50 -> 9 |
| oracles:text EXT-2 | `text-stress-ptbr\|EXT-2\|oracles:text\|plain\|criterion#1\|statusRank.pdftotext` | 1 | 2 | 0 count | 1 -> 2 |
| oracles:layout REF-W | `text-stress-ptbr\|REF-W\|oracles:layout\|plain\|criterion#1\|maxMm` | 101.6 | 96.73 | 0.1 position-mm | 101.6 -> 96.73 |
| oracles:layout REF-W | `text-stress-ptbr\|REF-W\|oracles:layout\|plain\|criterion#1\|p95Mm` | 97.36 | 95.96 | 0.1 position-mm | 97.36 -> 95.96 |
| pdf-probe | `pdf-probe\|invoice\|QTD.#1\|dx` | 9.67 | 4.42 | 1 pdf-probe-pt | "QTD." \|dx\| 9.67 -> 4.42 pt |
| pdf-probe | `pdf-probe\|invoice\|PREÇO#1\|dx` | 9.95 | 1.76 | 1 pdf-probe-pt | "PREÇO" \|dx\| 9.95 -> 1.76 pt |
| pdf-probe | `pdf-probe\|invoice\|UNIT.#1\|dx` | 9.95 | 1.76 | 1 pdf-probe-pt | "UNIT." \|dx\| 9.95 -> 1.76 pt |
| pdf-probe | `pdf-probe\|invoice\|TOTAL#1\|dx` | 9.12 | -0.65 | 1 pdf-probe-pt | "TOTAL" \|dx\| 9.12 -> 0.65 pt |
| pdf-probe | `pdf-probe\|invoice\|40#1\|dx` | 9.67 | 4.42 | 1 pdf-probe-pt | "40" \|dx\| 9.67 -> 4.42 pt |
| pdf-probe | `pdf-probe\|invoice\|R$#1\|dx` | 9.96 | 1.77 | 1 pdf-probe-pt | "R$" \|dx\| 9.96 -> 1.77 pt |
| pdf-probe | `pdf-probe\|invoice\|32,50#1\|dx` | 9.96 | 1.77 | 1 pdf-probe-pt | "32,50" \|dx\| 9.96 -> 1.77 pt |
| pdf-probe | `pdf-probe\|invoice\|R$#2\|dx` | 9.13 | -0.64 | 1 pdf-probe-pt | "R$" \|dx\| 9.13 -> 0.64 pt |
| pdf-probe | `pdf-probe\|invoice\|1.300,00#1\|dx` | 9.13 | -0.65 | 1 pdf-probe-pt | "1.300,00" \|dx\| 9.13 -> 0.65 pt |
| pdf-probe | `pdf-probe\|invoice\|25#1\|dx` | 9.67 | 4.42 | 1 pdf-probe-pt | "25" \|dx\| 9.67 -> 4.42 pt |
| pdf-probe | `pdf-probe\|invoice\|R$#3\|dx` | 9.96 | 1.77 | 1 pdf-probe-pt | "R$" \|dx\| 9.96 -> 1.77 pt |
| pdf-probe | `pdf-probe\|invoice\|18,90#1\|dx` | 9.96 | 1.77 | 1 pdf-probe-pt | "18,90" \|dx\| 9.96 -> 1.77 pt |
| pdf-probe | `pdf-probe\|invoice\|R$#4\|dx` | 9.12 | -0.65 | 1 pdf-probe-pt | "R$" \|dx\| 9.12 -> 0.65 pt |
| pdf-probe | `pdf-probe\|invoice\|472,50#1\|dx` | 9.12 | -0.65 | 1 pdf-probe-pt | "472,50" \|dx\| 9.12 -> 0.65 pt |
| pdf-probe | `pdf-probe\|invoice\|18#1\|dx` | 9.67 | 4.42 | 1 pdf-probe-pt | "18" \|dx\| 9.67 -> 4.42 pt |
| pdf-probe | `pdf-probe\|invoice\|R$#5\|dx` | 9.95 | 1.76 | 1 pdf-probe-pt | "R$" \|dx\| 9.95 -> 1.76 pt |
| pdf-probe | `pdf-probe\|invoice\|9,75#1\|dx` | 9.95 | 1.76 | 1 pdf-probe-pt | "9,75" \|dx\| 9.95 -> 1.76 pt |
| pdf-probe | `pdf-probe\|invoice\|R$#6\|dx` | 9.12 | -0.65 | 1 pdf-probe-pt | "R$" \|dx\| 9.12 -> 0.65 pt |
| pdf-probe | `pdf-probe\|invoice\|175,50#1\|dx` | 9.12 | -0.65 | 1 pdf-probe-pt | "175,50" \|dx\| 9.12 -> 0.65 pt |
| pdf-probe | `pdf-probe\|invoice\|60#1\|dx` | 9.67 | 4.42 | 1 pdf-probe-pt | "60" \|dx\| 9.67 -> 4.42 pt |
| pdf-probe | `pdf-probe\|invoice\|R$#7\|dx` | 9.96 | 1.77 | 1 pdf-probe-pt | "R$" \|dx\| 9.96 -> 1.77 pt |
| pdf-probe | `pdf-probe\|invoice\|47,20#1\|dx` | 9.96 | 1.77 | 1 pdf-probe-pt | "47,20" \|dx\| 9.96 -> 1.77 pt |
| pdf-probe | `pdf-probe\|invoice\|R$#8\|dx` | 9.13 | -0.64 | 1 pdf-probe-pt | "R$" \|dx\| 9.13 -> 0.64 pt |
| pdf-probe | `pdf-probe\|invoice\|2.832,00#1\|dx` | 9.13 | -0.65 | 1 pdf-probe-pt | "2.832,00" \|dx\| 9.13 -> 0.65 pt |
| pdf-probe | `pdf-probe\|invoice\|120#1\|dx` | 9.68 | 4.43 | 1 pdf-probe-pt | "120" \|dx\| 9.68 -> 4.43 pt |
| pdf-probe | `pdf-probe\|invoice\|R$#9\|dx` | 9.95 | 1.76 | 1 pdf-probe-pt | "R$" \|dx\| 9.95 -> 1.76 pt |
| pdf-probe | `pdf-probe\|invoice\|6,40#1\|dx` | 9.95 | 1.76 | 1 pdf-probe-pt | "6,40" \|dx\| 9.95 -> 1.76 pt |
| pdf-probe | `pdf-probe\|invoice\|R$#10\|dx` | 9.12 | -0.65 | 1 pdf-probe-pt | "R$" \|dx\| 9.12 -> 0.65 pt |
| pdf-probe | `pdf-probe\|invoice\|768,00#1\|dx` | 9.12 | -0.65 | 1 pdf-probe-pt | "768,00" \|dx\| 9.12 -> 0.65 pt |
| pdf-probe | `pdf-probe\|invoice\|30#1\|dx` | 9.67 | 4.42 | 1 pdf-probe-pt | "30" \|dx\| 9.67 -> 4.42 pt |
| pdf-probe | `pdf-probe\|invoice\|R$#11\|dx` | 9.96 | 1.77 | 1 pdf-probe-pt | "R$" \|dx\| 9.96 -> 1.77 pt |
| pdf-probe | `pdf-probe\|invoice\|28,00#1\|dx` | 9.96 | 1.77 | 1 pdf-probe-pt | "28,00" \|dx\| 9.96 -> 1.77 pt |
| pdf-probe | `pdf-probe\|invoice\|R$#12\|dx` | 9.12 | -0.65 | 1 pdf-probe-pt | "R$" \|dx\| 9.12 -> 0.65 pt |
| pdf-probe | `pdf-probe\|invoice\|840,00#1\|dx` | 9.12 | -0.65 | 1 pdf-probe-pt | "840,00" \|dx\| 9.12 -> 0.65 pt |
| pdf-probe | `pdf-probe\|invoice\|22#1\|dx` | 9.67 | 4.42 | 1 pdf-probe-pt | "22" \|dx\| 9.67 -> 4.42 pt |
| pdf-probe | `pdf-probe\|invoice\|R$#13\|dx` | 9.96 | 1.77 | 1 pdf-probe-pt | "R$" \|dx\| 9.96 -> 1.77 pt |
| pdf-probe | `pdf-probe\|invoice\|89,90#1\|dx` | 9.96 | 1.77 | 1 pdf-probe-pt | "89,90" \|dx\| 9.96 -> 1.77 pt |
| pdf-probe | `pdf-probe\|invoice\|R$#14\|dx` | 9.13 | -0.64 | 1 pdf-probe-pt | "R$" \|dx\| 9.13 -> 0.64 pt |
| pdf-probe | `pdf-probe\|invoice\|1.977,80#1\|dx` | 9.13 | -0.65 | 1 pdf-probe-pt | "1.977,80" \|dx\| 9.13 -> 0.65 pt |
| pdf-probe | `pdf-probe\|invoice\|44#1\|dx` | 9.67 | 4.42 | 1 pdf-probe-pt | "44" \|dx\| 9.67 -> 4.42 pt |
| pdf-probe | `pdf-probe\|invoice\|R$#15\|dx` | 9.96 | 1.77 | 1 pdf-probe-pt | "R$" \|dx\| 9.96 -> 1.77 pt |
| pdf-probe | `pdf-probe\|invoice\|34,50#1\|dx` | 9.96 | 1.77 | 1 pdf-probe-pt | "34,50" \|dx\| 9.96 -> 1.77 pt |
| pdf-probe | `pdf-probe\|invoice\|R$#16\|dx` | 9.13 | -0.64 | 1 pdf-probe-pt | "R$" \|dx\| 9.13 -> 0.64 pt |
| pdf-probe | `pdf-probe\|invoice\|1.518,00#1\|dx` | 9.13 | -0.65 | 1 pdf-probe-pt | "1.518,00" \|dx\| 9.13 -> 0.65 pt |
| pdf-probe | `pdf-probe\|invoice\|12#2\|dx` | 9.67 | 4.42 | 1 pdf-probe-pt | "12" \|dx\| 9.67 -> 4.42 pt |
| pdf-probe | `pdf-probe\|invoice\|R$#17\|dx` | 9.95 | 1.76 | 1 pdf-probe-pt | "R$" \|dx\| 9.95 -> 1.76 pt |
| pdf-probe | `pdf-probe\|invoice\|156,00#1\|dx` | 9.95 | 1.76 | 1 pdf-probe-pt | "156,00" \|dx\| 9.95 -> 1.76 pt |
| pdf-probe | `pdf-probe\|invoice\|R$#18\|dx` | 9.13 | -0.64 | 1 pdf-probe-pt | "R$" \|dx\| 9.13 -> 0.64 pt |
| … | 365 more in gate-report.json | | | | |

WPT/crashtest improvements: 396 (listed in gate-report.json).

## newly-measured (1)

| group | key | before | after | tolerance | detail |
|---|---|---|---|---|---|
| oracles:barcode DANFE-B1 | `danfe\|DANFE-B1\|oracles:barcode\|plain\|criterion#1` | NOT-RUN | PASS |  | now measured:  |

## added (13)

| group | key | before | after | tolerance | detail |
|---|---|---|---|---|---|
| oracles:layout LET-1 | `notification\|LET-1\|oracles:layout\|plain\|criterion#1` | absent | PASS |  | worst "Gerente do Departamento de Cobra" dy 0.75 mm (tol 1; 4 anchors: last paragraph + signature lines; 0 disputed) |
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

## changed (1)

| group | key | before | after | tolerance | detail |
|---|---|---|---|---|---|
| wpt css/css-break | `wpt\|css/css-break/overflowed-abs-pos-with-percentage-height-print.html` | pass-blank | fail |  | pass-blank -> fail |

## not-comparable (6)

| group | key | before | after | tolerance | detail |
|---|---|---|---|---|---|
| wpt crashtests | `wpt-crash` | absent | 0 panic/crash/timeout |  | baseline has no crashtest record; the run has 0 non-ok:  |
| pdf-probe | `pdf-probe\|boleto-febraban` | absent | 315 pairs |  | baseline has no pdf-probe for this fixture |
| pdf-probe | `pdf-probe\|danfe` | absent | 630 pairs |  | baseline has no pdf-probe for this fixture |
| pdf-probe | `pdf-probe\|oss-postmark-receipt` | absent | 137 pairs |  | baseline has no pdf-probe for this fixture |
| pdf-probe | `pdf-probe\|oss-sparksuite-invoice` | absent | 46 pairs |  | baseline has no pdf-probe for this fixture |
| pdf-probe | `pdf-probe\|text-stress-ptbr` | absent | 1820 pairs |  | baseline has no pdf-probe for this fixture |

## WPT per directory (pass / clean pass)

| directory | pass before | pass after | clean before | clean after |
|---|---|---|---|---|
| css/CSS2/backgrounds | 152 | 176 | 67 | 67 |
| css/CSS2/borders | 332 | 377 | 302 | 348 |
| css/CSS2/box | 4 | 4 | 0 | 0 |
| css/CSS2/box-display | 47 | 53 | 47 | 52 |
| css/CSS2/colors | 6 | 7 | 6 | 7 |
| css/CSS2/floats | 20 | 19 | 18 | 17 |
| css/CSS2/floats-clear | 25 | 30 | 22 | 25 |
| css/CSS2/fonts | 120 | 121 | 120 | 121 |
| css/CSS2/generated-content | 41 | 43 | 38 | 38 |
| css/CSS2/linebox | 45 | 29 | 33 | 27 |
| css/CSS2/lists | 67 | 67 | 40 | 40 |
| css/CSS2/margin-padding-clear | 409 | 513 | 396 | 498 |
| css/CSS2/normal-flow | 392 | 396 | 368 | 373 |
| css/CSS2/pagination | 19 | 33 | 17 | 31 |
| css/CSS2/positioning | 175 | 298 | 173 | 272 |
| css/CSS2/tables | 19 | 21 | 17 | 18 |
| css/CSS2/text | 223 | 223 | 215 | 215 |
| css/CSS2/visudet | 10 | 14 | 7 | 8 |
| css/CSS2/visufx | 1 | 1 | 1 | 1 |
| css/CSS2/visuren | 1 | 3 | 1 | 3 |
| css/css-break | 101 | 104 | 73 | 75 |
| css/css-page | 63 | 64 | 47 | 49 |
| css/css-tables | 36 | 38 | 27 | 29 |
| css/css-text | 421 | 443 | 178 | 193 |

## Per group

| group | classes |
|---|---|
| canaries | added 6 |
| corpus BOL-B | improvement 4 |
| corpus BOL-R | improvement 2 |
| corpus BOL-X | improvement 8 |
| corpus DANFE-B | improvement 5 |
| corpus DANFE-F | improvement 4 |
| corpus DANFE-L | improvement 5 |
| corpus DANFE-M | regression 1 |
| corpus DANFE-X | improvement 4 |
| corpus INV-R | regression 1 |
| corpus LET- | added 1 |
| corpus TXT-R | improvement 2 |
| oracles:barcode DANFE-B1 | newly-measured 1 |
| oracles:layout LET-1 | added 2 |
| oracles:layout LET-2 | added 2 |
| oracles:layout LET-3 | added 1 |
| oracles:layout REF-W | improvement 13 |
| oracles:layout TXT-B1 | added 1 |
| oracles:text EXT-2 | improvement 25 |
| pdf-probe | not-comparable 5, improvement 413, regression 77 |
| wpt crashtests | not-comparable 1 |
| wpt css/CSS2/backgrounds | improvement 24 |
| wpt css/CSS2/borders | improvement 46 |
| wpt css/CSS2/box-display | improvement 6 |
| wpt css/CSS2/colors | improvement 1 |
| wpt css/CSS2/floats | regression 1 |
| wpt css/CSS2/floats-clear | improvement 5 |
| wpt css/CSS2/fonts | improvement 1 |
| wpt css/CSS2/generated-content | improvement 2 |
| wpt css/CSS2/linebox | regression 18, reported 2, improvement 13 |
| wpt css/CSS2/margin-padding-clear | improvement 104 |
| wpt css/CSS2/normal-flow | improvement 17, regression 12 |
| wpt css/CSS2/pagination | improvement 14 |
| wpt css/CSS2/positioning | improvement 123 |
| wpt css/CSS2/tables | improvement 2 |
| wpt css/CSS2/visudet | improvement 4 |
| wpt css/CSS2/visuren | improvement 2 |
| wpt css/css-break | improvement 3, changed 1 |
| wpt css/css-page | improvement 2, reported 1 |
| wpt css/css-tables | improvement 2 |
| wpt css/css-text | improvement 25 |

## Tolerances

| class | tolerance | label | rationale |
|---|---|---|---|
| position-mm | 0.1 mm | DESIGN TARGET | word/anchor position error vs a reference (REF-W max/p95, REF-R worst anchor, DANFE-L1, LET-1). 0.1 mm (0.28 pt, 0.38 CSS px) is 10x the 0.01 mm the values are reported with and below one CSS px (0.26 mm), the smallest step a px-snapping layout can move; the measurement is deterministic for one build and one reference (CONFIRMED: equal inputs gave equal values in the Phase A repeat run). |
| geometry-excess-mm | 0.05 mm | DESIGN TARGET | distance OUTSIDE a specification window (BOL-G*, DANFE-B*, DANFE-M1, TXT-A1). Inside the window the spec admits any value, so only the excess is ratcheted; 0.05 mm is about one 600 dpi raster pixel (0.042 mm), the measurement quantum of measure_bars.py / the page ink box. |
| font-excess-pt | 0.05 pt | SPEC-derived tolerance unit | font-size excess outside a window; 0.05 pt is the tolerance ACCEPTANCE.md already applies to every font-size criterion (BOL-T*, DANFE-F*). |
| count | 0 count | DESIGN TARGET | integer counts from deterministic tools (required strings found, extractor missing/extra tokens, segments/glyphs attributed, decoded symbols): any loss is a real change of the document. |
| page-delta | 0 pages | DESIGN TARGET | \|vellora pages - reference pages\|: a page break moving is never noise. |
| pdf-probe-pt | 1 pt | DESIGN TARGET | per-word \|dx\| / \|dy\| of vellora's PDF vs Chrome's PDF (pdftotext -bbox, same-page pairs). 1 pt (0.35 mm) is an order of magnitude below the Phase A regressions it must catch (invoice price column +9 pt, notification signature -14 pt) and above glyph-bbox rounding of pdftotext (0.01 pt) and sub-px snapping differences. |

