# Fidelity gate report

**Verdict: FAIL** (524 gating item(s)). Local macOS runs are INDICATIVE.

| field | value |
|---|---|
| date | 2026-10-21T21:04:15.734Z |
| command | `node fidelity/gate/run.mjs --baseline fidelity/baselines/beta4 --run fidelity/results/run-all/09-review-fixes --out fidelity/results/run-all/09-review-fixes/gate-vs-beta4` |
| baseline | fidelity/baselines/beta4 (vellora-fidelity/baseline-beta4/1/manifest) |
| run | fidelity/results/run-all/09-review-fixes (vellora-fidelity/run-all/1) |
| os / cpu | darwin 27.0.0 arm64 (macOS 27.0.1) / Apple M5 Pro |
| node / rustc | v22.23.2 / rustc 1.96.0 (ac68faa20 2026-05-25) |
| chrome | Google Chrome 155.0.8059.85 |
| blitz | 0.3.0-beta.4 registry+https://github.com/rust-lang/crates.io-index |
| git | phaseb/09-review-fixes 6176d398490b3d9effc192cd77c25241d2342644 (0 dirty) |

Counts: improvement 1754, newly-measured 1, added 13, regression 524, reported 5, changed 21, not-comparable 6, gating 524, unchanged 8548, withinTolerance 0.

## Absolute failures of the run (gate, cannot be accepted)

none

## Regressions beyond tolerance (gate)

| group | key | before | after | tolerance | detail |
|---|---|---|---|---|---|
| corpus DANFE-L | `danfe\|DANFE-L1a\|corpus\|\|criterion#1\|posErrMm` | 1.56 | 2.09 | 0.1 position-mm | 1.56 -> 2.09 (tolerance 0.1 mm) |
| corpus DANFE-L | `danfe\|DANFE-L1b\|corpus\|\|criterion#1\|posErrMm` | 3.15 | 3.68 | 0.1 position-mm | 3.15 -> 3.68 (tolerance 0.1 mm) |
| corpus DANFE-L | `danfe\|DANFE-L1c\|corpus\|\|criterion#1\|posErrMm` | 4.71 | 5.24 | 0.1 position-mm | 4.71 -> 5.24 (tolerance 0.1 mm) |
| corpus DANFE-L | `danfe\|DANFE-L1d\|corpus\|\|criterion#1\|posErrMm` | 5.96 | 6.49 | 0.1 position-mm | 5.96 -> 6.49 (tolerance 0.1 mm) |
| corpus INV-R | `oss-postmark-receipt\|INV-R1\|corpus\|\|criterion#1\|worstMm` | 9.2 | 10.26 | 0.1 position-mm | 9.2 -> 10.26 (tolerance 0.1 mm) |
| corpus INV-R | `oss-sparksuite-invoice\|INV-R1\|corpus\|\|criterion#1\|worstMm` | 2.74 | 4.15 | 0.1 position-mm | 2.74 -> 4.15 (tolerance 0.1 mm) |
| pdf-probe | `pdf-probe\|boleto\|Corte#1\|dy` | -0.81 | 2.35 | 1 pdf-probe-pt | "Corte" \|dy\| 0.81 -> 2.35 pt vs Chrome |
| pdf-probe | `pdf-probe\|boleto\|na#1\|dy` | -0.81 | 2.35 | 1 pdf-probe-pt | "na" \|dy\| 0.81 -> 2.35 pt vs Chrome |
| pdf-probe | `pdf-probe\|boleto\|linha#1\|dy` | -0.81 | 2.35 | 1 pdf-probe-pt | "linha" \|dy\| 0.81 -> 2.35 pt vs Chrome |
| pdf-probe | `pdf-probe\|boleto\|pontilhada#1\|dy` | -0.81 | 2.35 | 1 pdf-probe-pt | "pontilhada" \|dy\| 0.81 -> 2.35 pt vs Chrome |
| pdf-probe | `pdf-probe\|boleto\|—#1\|dy` | -0.81 | 2.35 | 1 pdf-probe-pt | "—" \|dy\| 0.81 -> 2.35 pt vs Chrome |
| pdf-probe | `pdf-probe\|boleto\|Ficha#1\|dy` | -0.81 | 2.35 | 1 pdf-probe-pt | "Ficha" \|dy\| 0.81 -> 2.35 pt vs Chrome |
| pdf-probe | `pdf-probe\|boleto\|de#1\|dy` | -0.81 | 2.35 | 1 pdf-probe-pt | "de" \|dy\| 0.81 -> 2.35 pt vs Chrome |
| pdf-probe | `pdf-probe\|boleto\|Compensação#1\|dy` | -0.81 | 2.35 | 1 pdf-probe-pt | "Compensação" \|dy\| 0.81 -> 2.35 pt vs Chrome |
| pdf-probe | `pdf-probe\|boleto\|99990.00001#2\|dy` | -0.68 | 4.86 | 1 pdf-probe-pt | "99990.00001" \|dy\| 0.68 -> 4.86 pt vs Chrome |
| pdf-probe | `pdf-probe\|boleto\|23456.700001#2\|dy` | -0.68 | 4.86 | 1 pdf-probe-pt | "23456.700001" \|dy\| 0.68 -> 4.86 pt vs Chrome |
| pdf-probe | `pdf-probe\|boleto\|00000.000420#2\|dy` | -0.68 | 4.86 | 1 pdf-probe-pt | "00000.000420" \|dy\| 0.68 -> 4.86 pt vs Chrome |
| pdf-probe | `pdf-probe\|boleto\|1#2\|dy` | -0.68 | 4.86 | 1 pdf-probe-pt | "1" \|dy\| 0.68 -> 4.86 pt vs Chrome |
| pdf-probe | `pdf-probe\|boleto\|99990000012345#2\|dy` | -0.68 | 4.86 | 1 pdf-probe-pt | "99990000012345" \|dy\| 0.68 -> 4.86 pt vs Chrome |
| pdf-probe | `pdf-probe\|boleto\|LOCAL#1\|dy` | -0.07 | 3 | 1 pdf-probe-pt | "LOCAL" \|dy\| 0.07 -> 3 pt vs Chrome |
| pdf-probe | `pdf-probe\|boleto\|DE#1\|dy` | -0.07 | 3 | 1 pdf-probe-pt | "DE" \|dy\| 0.07 -> 3 pt vs Chrome |
| pdf-probe | `pdf-probe\|boleto\|PAGAMENTO#1\|dy` | -0.07 | 3 | 1 pdf-probe-pt | "PAGAMENTO" \|dy\| 0.07 -> 3 pt vs Chrome |
| pdf-probe | `pdf-probe\|boleto\|VENCIMENTO#2\|dy` | -0.07 | 3 | 1 pdf-probe-pt | "VENCIMENTO" \|dy\| 0.07 -> 3 pt vs Chrome |
| pdf-probe | `pdf-probe\|boleto\|Pagável#1\|dy` | -0.37 | 2.7 | 1 pdf-probe-pt | "Pagável" \|dy\| 0.37 -> 2.7 pt vs Chrome |
| pdf-probe | `pdf-probe\|boleto\|em#1\|dy` | -0.37 | 2.7 | 1 pdf-probe-pt | "em" \|dy\| 0.37 -> 2.7 pt vs Chrome |
| pdf-probe | `pdf-probe\|boleto\|qualquer#1\|dy` | -0.37 | 2.7 | 1 pdf-probe-pt | "qualquer" \|dy\| 0.37 -> 2.7 pt vs Chrome |
| pdf-probe | `pdf-probe\|boleto\|banco#1\|dy` | -0.37 | 2.7 | 1 pdf-probe-pt | "banco" \|dy\| 0.37 -> 2.7 pt vs Chrome |
| pdf-probe | `pdf-probe\|boleto\|até#1\|dy` | -0.37 | 2.7 | 1 pdf-probe-pt | "até" \|dy\| 0.37 -> 2.7 pt vs Chrome |
| pdf-probe | `pdf-probe\|boleto\|o#1\|dy` | -0.37 | 2.7 | 1 pdf-probe-pt | "o" \|dy\| 0.37 -> 2.7 pt vs Chrome |
| pdf-probe | `pdf-probe\|boleto\|vencimento#1\|dy` | -0.37 | 2.7 | 1 pdf-probe-pt | "vencimento" \|dy\| 0.37 -> 2.7 pt vs Chrome |
| pdf-probe | `pdf-probe\|boleto\|(boleto#1\|dy` | -0.37 | 2.7 | 1 pdf-probe-pt | "(boleto" \|dy\| 0.37 -> 2.7 pt vs Chrome |
| pdf-probe | `pdf-probe\|boleto\|fictício#1\|dy` | -0.37 | 2.7 | 1 pdf-probe-pt | "fictício" \|dy\| 0.37 -> 2.7 pt vs Chrome |
| pdf-probe | `pdf-probe\|boleto\|de#2\|dy` | -0.37 | 2.7 | 1 pdf-probe-pt | "de" \|dy\| 0.37 -> 2.7 pt vs Chrome |
| pdf-probe | `pdf-probe\|boleto\|teste).#1\|dy` | -0.37 | 2.7 | 1 pdf-probe-pt | "teste)." \|dy\| 0.37 -> 2.7 pt vs Chrome |
| pdf-probe | `pdf-probe\|boleto\|15/07/2026#2\|dy` | -0.02 | 3.05 | 1 pdf-probe-pt | "15/07/2026" \|dy\| 0.02 -> 3.05 pt vs Chrome |
| pdf-probe | `pdf-probe\|boleto\|BENEFICIÁRIO#3\|dy` | 0.68 | 3.75 | 1 pdf-probe-pt | "BENEFICIÁRIO" \|dy\| 0.68 -> 3.75 pt vs Chrome |
| pdf-probe | `pdf-probe\|boleto\|AGÊNCIA#2\|dy` | 0.68 | 3.75 | 1 pdf-probe-pt | "AGÊNCIA" \|dy\| 0.68 -> 3.75 pt vs Chrome |
| pdf-probe | `pdf-probe\|boleto\|/#3\|dy` | 0.68 | 3.75 | 1 pdf-probe-pt | "/" \|dy\| 0.68 -> 3.75 pt vs Chrome |
| pdf-probe | `pdf-probe\|boleto\|CÓDIGO#2\|dy` | 0.68 | 3.75 | 1 pdf-probe-pt | "CÓDIGO" \|dy\| 0.68 -> 3.75 pt vs Chrome |
| pdf-probe | `pdf-probe\|boleto\|DO#4\|dy` | 0.68 | 3.75 | 1 pdf-probe-pt | "DO" \|dy\| 0.68 -> 3.75 pt vs Chrome |
| pdf-probe | `pdf-probe\|boleto\|BENEFICIÁRIO#4\|dy` | 0.68 | 3.75 | 1 pdf-probe-pt | "BENEFICIÁRIO" \|dy\| 0.68 -> 3.75 pt vs Chrome |
| pdf-probe | `pdf-probe\|boleto\|Acme#2\|dy` | 1.13 | 4.2 | 1 pdf-probe-pt | "Acme" \|dy\| 1.13 -> 4.2 pt vs Chrome |
| pdf-probe | `pdf-probe\|boleto\|Widgets#2\|dy` | 1.13 | 4.2 | 1 pdf-probe-pt | "Widgets" \|dy\| 1.13 -> 4.2 pt vs Chrome |
| pdf-probe | `pdf-probe\|boleto\|Comércio#2\|dy` | 1.13 | 4.2 | 1 pdf-probe-pt | "Comércio" \|dy\| 1.13 -> 4.2 pt vs Chrome |
| pdf-probe | `pdf-probe\|boleto\|LTDA#2\|dy` | 1.13 | 4.2 | 1 pdf-probe-pt | "LTDA" \|dy\| 1.13 -> 4.2 pt vs Chrome |
| pdf-probe | `pdf-probe\|boleto\|—#2\|dy` | 1.13 | 4.2 | 1 pdf-probe-pt | "—" \|dy\| 1.13 -> 4.2 pt vs Chrome |
| pdf-probe | `pdf-probe\|boleto\|CNPJ#1\|dy` | 1.13 | 4.2 | 1 pdf-probe-pt | "CNPJ" \|dy\| 1.13 -> 4.2 pt vs Chrome |
| pdf-probe | `pdf-probe\|boleto\|12.345.678/0001-90#1\|dy` | 1.13 | 4.2 | 1 pdf-probe-pt | "12.345.678/0001-90" \|dy\| 1.13 -> 4.2 pt vs Chrome |
| pdf-probe | `pdf-probe\|boleto\|0042#2\|dy` | 1.88 | 4.95 | 1 pdf-probe-pt | "0042" \|dy\| 1.88 -> 4.95 pt vs Chrome |
| pdf-probe | `pdf-probe\|boleto\|/#4\|dy` | 1.88 | 4.95 | 1 pdf-probe-pt | "/" \|dy\| 1.88 -> 4.95 pt vs Chrome |
| pdf-probe | `pdf-probe\|boleto\|00012345-6#2\|dy` | 1.88 | 4.95 | 1 pdf-probe-pt | "00012345-6" \|dy\| 1.88 -> 4.95 pt vs Chrome |
| pdf-probe | `pdf-probe\|boleto\|DATA#1\|dy` | 2.18 | 5.25 | 1 pdf-probe-pt | "DATA" \|dy\| 2.18 -> 5.25 pt vs Chrome |
| pdf-probe | `pdf-probe\|boleto\|DO#5\|dy` | 2.18 | 5.25 | 1 pdf-probe-pt | "DO" \|dy\| 2.18 -> 5.25 pt vs Chrome |
| pdf-probe | `pdf-probe\|boleto\|DOCUMENTO#2\|dy` | 2.18 | 5.25 | 1 pdf-probe-pt | "DOCUMENTO" \|dy\| 2.18 -> 5.25 pt vs Chrome |
| pdf-probe | `pdf-probe\|boleto\|NÚMERO#2\|dy` | 2.18 | 5.25 | 1 pdf-probe-pt | "NÚMERO" \|dy\| 2.18 -> 5.25 pt vs Chrome |
| pdf-probe | `pdf-probe\|boleto\|DO#6\|dy` | 2.18 | 5.25 | 1 pdf-probe-pt | "DO" \|dy\| 2.18 -> 5.25 pt vs Chrome |
| pdf-probe | `pdf-probe\|boleto\|DOCUMENTO#3\|dy` | 2.18 | 5.25 | 1 pdf-probe-pt | "DOCUMENTO" \|dy\| 2.18 -> 5.25 pt vs Chrome |
| pdf-probe | `pdf-probe\|boleto\|ESPÉCIE#1\|dy` | 2.18 | 5.25 | 1 pdf-probe-pt | "ESPÉCIE" \|dy\| 2.18 -> 5.25 pt vs Chrome |
| pdf-probe | `pdf-probe\|boleto\|DOC.#1\|dy` | 2.18 | 5.25 | 1 pdf-probe-pt | "DOC." \|dy\| 2.18 -> 5.25 pt vs Chrome |
| pdf-probe | `pdf-probe\|boleto\|22/06/2026#1\|dy` | 3.38 | 6.45 | 1 pdf-probe-pt | "22/06/2026" \|dy\| 3.38 -> 6.45 pt vs Chrome |
| pdf-probe | `pdf-probe\|boleto\|DOC-00042#1\|dy` | 3.38 | 6.45 | 1 pdf-probe-pt | "DOC-00042" \|dy\| 3.38 -> 6.45 pt vs Chrome |
| pdf-probe | `pdf-probe\|boleto\|DM#1\|dy` | 3.38 | 6.45 | 1 pdf-probe-pt | "DM" \|dy\| 3.38 -> 6.45 pt vs Chrome |
| pdf-probe | `pdf-probe\|boleto\|CARTEIRA#1\|dy` | 3.68 | 6.75 | 1 pdf-probe-pt | "CARTEIRA" \|dy\| 3.68 -> 6.75 pt vs Chrome |
| pdf-probe | `pdf-probe\|boleto\|ESPÉCIE#2\|dy` | 3.68 | 6.75 | 1 pdf-probe-pt | "ESPÉCIE" \|dy\| 3.68 -> 6.75 pt vs Chrome |
| pdf-probe | `pdf-probe\|boleto\|MOEDA#1\|dy` | 3.68 | 6.75 | 1 pdf-probe-pt | "MOEDA" \|dy\| 3.68 -> 6.75 pt vs Chrome |
| pdf-probe | `pdf-probe\|boleto\|QUANTIDADE#1\|dy` | 3.68 | 6.75 | 1 pdf-probe-pt | "QUANTIDADE" \|dy\| 3.68 -> 6.75 pt vs Chrome |
| pdf-probe | `pdf-probe\|boleto\|17#1\|dy` | 4.88 | 7.95 | 1 pdf-probe-pt | "17" \|dy\| 4.88 -> 7.95 pt vs Chrome |
| pdf-probe | `pdf-probe\|boleto\|R$#2\|dy` | 4.88 | 7.95 | 1 pdf-probe-pt | "R$" \|dy\| 4.88 -> 7.95 pt vs Chrome |
| pdf-probe | `pdf-probe\|boleto\|1#3\|dy` | 4.88 | 7.95 | 1 pdf-probe-pt | "1" \|dy\| 4.88 -> 7.95 pt vs Chrome |
| pdf-probe | `pdf-probe\|boleto\|NOSSO#2\|dy` | 2.18 | 5.25 | 1 pdf-probe-pt | "NOSSO" \|dy\| 2.18 -> 5.25 pt vs Chrome |
| pdf-probe | `pdf-probe\|boleto\|NÚMERO#3\|dy` | 2.18 | 5.25 | 1 pdf-probe-pt | "NÚMERO" \|dy\| 2.18 -> 5.25 pt vs Chrome |
| pdf-probe | `pdf-probe\|boleto\|00000000000123456-7#2\|dy` | 3.38 | 6.45 | 1 pdf-probe-pt | "00000000000123456-7" \|dy\| 3.38 -> 6.45 pt vs Chrome |
| pdf-probe | `pdf-probe\|boleto\|(=)#1\|dy` | 3.68 | 6.75 | 1 pdf-probe-pt | "(=)" \|dy\| 3.68 -> 6.75 pt vs Chrome |
| pdf-probe | `pdf-probe\|boleto\|VALOR#2\|dy` | 3.68 | 6.75 | 1 pdf-probe-pt | "VALOR" \|dy\| 3.68 -> 6.75 pt vs Chrome |
| pdf-probe | `pdf-probe\|boleto\|DO#7\|dy` | 3.68 | 6.75 | 1 pdf-probe-pt | "DO" \|dy\| 3.68 -> 6.75 pt vs Chrome |
| pdf-probe | `pdf-probe\|boleto\|DOCUMENTO#4\|dy` | 3.68 | 6.75 | 1 pdf-probe-pt | "DOCUMENTO" \|dy\| 3.68 -> 6.75 pt vs Chrome |
| pdf-probe | `pdf-probe\|boleto\|R$#3\|dy` | 4.88 | 7.95 | 1 pdf-probe-pt | "R$" \|dy\| 4.88 -> 7.95 pt vs Chrome |
| pdf-probe | `pdf-probe\|boleto\|1.842,50#2\|dy` | 4.88 | 7.95 | 1 pdf-probe-pt | "1.842,50" \|dy\| 4.88 -> 7.95 pt vs Chrome |
| pdf-probe | `pdf-probe\|boleto\|INSTRUÇÕES#1\|dy` | 5.18 | 8.25 | 1 pdf-probe-pt | "INSTRUÇÕES" \|dy\| 5.18 -> 8.25 pt vs Chrome |
| pdf-probe | `pdf-probe\|boleto\|(TEXTO#1\|dy` | 5.18 | 8.25 | 1 pdf-probe-pt | "(TEXTO" \|dy\| 5.18 -> 8.25 pt vs Chrome |
| pdf-probe | `pdf-probe\|boleto\|DE#2\|dy` | 5.18 | 8.25 | 1 pdf-probe-pt | "DE" \|dy\| 5.18 -> 8.25 pt vs Chrome |
| pdf-probe | `pdf-probe\|boleto\|RESPONSABILIDADE#1\|dy` | 5.18 | 8.25 | 1 pdf-probe-pt | "RESPONSABILIDADE" \|dy\| 5.18 -> 8.25 pt vs Chrome |
| pdf-probe | `pdf-probe\|boleto\|DO#8\|dy` | 5.18 | 8.25 | 1 pdf-probe-pt | "DO" \|dy\| 5.18 -> 8.25 pt vs Chrome |
| pdf-probe | `pdf-probe\|boleto\|BENEFICIÁRIO)#1\|dy` | 5.18 | 8.25 | 1 pdf-probe-pt | "BENEFICIÁRIO)" \|dy\| 5.18 -> 8.25 pt vs Chrome |
| pdf-probe | `pdf-probe\|boleto\|(-)#1\|dy` | 5.18 | 8.25 | 1 pdf-probe-pt | "(-)" \|dy\| 5.18 -> 8.25 pt vs Chrome |
| pdf-probe | `pdf-probe\|boleto\|DESCONTO#1\|dy` | 5.18 | 8.25 | 1 pdf-probe-pt | "DESCONTO" \|dy\| 5.18 -> 8.25 pt vs Chrome |
| pdf-probe | `pdf-probe\|boleto\|/#5\|dy` | 5.18 | 8.25 | 1 pdf-probe-pt | "/" \|dy\| 5.18 -> 8.25 pt vs Chrome |
| pdf-probe | `pdf-probe\|boleto\|ABATIMENTO#1\|dy` | 5.18 | 8.25 | 1 pdf-probe-pt | "ABATIMENTO" \|dy\| 5.18 -> 8.25 pt vs Chrome |
| pdf-probe | `pdf-probe\|boleto\|•#1\|dy` | 6.38 | 9.45 | 1 pdf-probe-pt | "•" \|dy\| 6.38 -> 9.45 pt vs Chrome |
| pdf-probe | `pdf-probe\|boleto\|Não#1\|dy` | 6.38 | 9.45 | 1 pdf-probe-pt | "Não" \|dy\| 6.38 -> 9.45 pt vs Chrome |
| pdf-probe | `pdf-probe\|boleto\|receber#1\|dy` | 6.38 | 9.45 | 1 pdf-probe-pt | "receber" \|dy\| 6.38 -> 9.45 pt vs Chrome |
| pdf-probe | `pdf-probe\|boleto\|após#1\|dy` | 6.38 | 9.45 | 1 pdf-probe-pt | "após" \|dy\| 6.38 -> 9.45 pt vs Chrome |
| pdf-probe | `pdf-probe\|boleto\|30#1\|dy` | 6.38 | 9.45 | 1 pdf-probe-pt | "30" \|dy\| 6.38 -> 9.45 pt vs Chrome |
| pdf-probe | `pdf-probe\|boleto\|dias#1\|dy` | 6.38 | 9.45 | 1 pdf-probe-pt | "dias" \|dy\| 6.38 -> 9.45 pt vs Chrome |
| pdf-probe | `pdf-probe\|boleto\|do#1\|dy` | 6.38 | 9.45 | 1 pdf-probe-pt | "do" \|dy\| 6.38 -> 9.45 pt vs Chrome |
| pdf-probe | `pdf-probe\|boleto\|vencimento.#1\|dy` | 6.38 | 9.45 | 1 pdf-probe-pt | "vencimento." \|dy\| 6.38 -> 9.45 pt vs Chrome |
| pdf-probe | `pdf-probe\|boleto\|•#2\|dy` | 5.63 | 8.7 | 1 pdf-probe-pt | "•" \|dy\| 5.63 -> 8.7 pt vs Chrome |
| pdf-probe | `pdf-probe\|boleto\|Após#1\|dy` | 5.63 | 8.7 | 1 pdf-probe-pt | "Após" \|dy\| 5.63 -> 8.7 pt vs Chrome |
| pdf-probe | `pdf-probe\|boleto\|o#2\|dy` | 5.63 | 8.7 | 1 pdf-probe-pt | "o" \|dy\| 5.63 -> 8.7 pt vs Chrome |
| pdf-probe | `pdf-probe\|boleto\|vencimento,#1\|dy` | 5.63 | 8.7 | 1 pdf-probe-pt | "vencimento," \|dy\| 5.63 -> 8.7 pt vs Chrome |
| pdf-probe | `pdf-probe\|boleto\|cobrar#1\|dy` | 5.63 | 8.7 | 1 pdf-probe-pt | "cobrar" \|dy\| 5.63 -> 8.7 pt vs Chrome |
| pdf-probe | `pdf-probe\|boleto\|multa#1\|dy` | 5.63 | 8.7 | 1 pdf-probe-pt | "multa" \|dy\| 5.63 -> 8.7 pt vs Chrome |
| pdf-probe | `pdf-probe\|boleto\|de#3\|dy` | 5.63 | 8.7 | 1 pdf-probe-pt | "de" \|dy\| 5.63 -> 8.7 pt vs Chrome |
| pdf-probe | `pdf-probe\|boleto\|2%#1\|dy` | 5.63 | 8.7 | 1 pdf-probe-pt | "2%" \|dy\| 5.63 -> 8.7 pt vs Chrome |
| pdf-probe | `pdf-probe\|boleto\|e#1\|dy` | 5.63 | 8.7 | 1 pdf-probe-pt | "e" \|dy\| 5.63 -> 8.7 pt vs Chrome |
| pdf-probe | `pdf-probe\|boleto\|mora#1\|dy` | 5.63 | 8.7 | 1 pdf-probe-pt | "mora" \|dy\| 5.63 -> 8.7 pt vs Chrome |
| pdf-probe | `pdf-probe\|boleto\|de#4\|dy` | 5.63 | 8.7 | 1 pdf-probe-pt | "de" \|dy\| 5.63 -> 8.7 pt vs Chrome |
| pdf-probe | `pdf-probe\|boleto\|1%#1\|dy` | 5.63 | 8.7 | 1 pdf-probe-pt | "1%" \|dy\| 5.63 -> 8.7 pt vs Chrome |
| pdf-probe | `pdf-probe\|boleto\|ao#1\|dy` | 5.63 | 8.7 | 1 pdf-probe-pt | "ao" \|dy\| 5.63 -> 8.7 pt vs Chrome |
| pdf-probe | `pdf-probe\|boleto\|mês.#1\|dy` | 5.63 | 8.7 | 1 pdf-probe-pt | "mês." \|dy\| 5.63 -> 8.7 pt vs Chrome |
| pdf-probe | `pdf-probe\|boleto\|•#3\|dy` | 5.63 | 8.7 | 1 pdf-probe-pt | "•" \|dy\| 5.63 -> 8.7 pt vs Chrome |
| pdf-probe | `pdf-probe\|boleto\|Em#1\|dy` | 5.63 | 8.7 | 1 pdf-probe-pt | "Em" \|dy\| 5.63 -> 8.7 pt vs Chrome |
| pdf-probe | `pdf-probe\|boleto\|caso#1\|dy` | 5.63 | 8.7 | 1 pdf-probe-pt | "caso" \|dy\| 5.63 -> 8.7 pt vs Chrome |
| pdf-probe | `pdf-probe\|boleto\|de#5\|dy` | 5.63 | 8.7 | 1 pdf-probe-pt | "de" \|dy\| 5.63 -> 8.7 pt vs Chrome |
| pdf-probe | `pdf-probe\|boleto\|dúvida#1\|dy` | 5.63 | 8.7 | 1 pdf-probe-pt | "dúvida" \|dy\| 5.63 -> 8.7 pt vs Chrome |
| pdf-probe | `pdf-probe\|boleto\|sobre#1\|dy` | 5.63 | 8.7 | 1 pdf-probe-pt | "sobre" \|dy\| 5.63 -> 8.7 pt vs Chrome |
| pdf-probe | `pdf-probe\|boleto\|este#1\|dy` | 5.63 | 8.7 | 1 pdf-probe-pt | "este" \|dy\| 5.63 -> 8.7 pt vs Chrome |
| pdf-probe | `pdf-probe\|boleto\|documento#1\|dy` | 5.63 | 8.7 | 1 pdf-probe-pt | "documento" \|dy\| 5.63 -> 8.7 pt vs Chrome |
| pdf-probe | `pdf-probe\|boleto\|de#6\|dy` | 5.63 | 8.7 | 1 pdf-probe-pt | "de" \|dy\| 5.63 -> 8.7 pt vs Chrome |
| pdf-probe | `pdf-probe\|boleto\|teste,#1\|dy` | 5.63 | 8.7 | 1 pdf-probe-pt | "teste," \|dy\| 5.63 -> 8.7 pt vs Chrome |
| pdf-probe | `pdf-probe\|boleto\|contate#1\|dy` | 5.63 | 8.7 | 1 pdf-probe-pt | "contate" \|dy\| 5.63 -> 8.7 pt vs Chrome |
| pdf-probe | `pdf-probe\|boleto\|o#3\|dy` | 5.63 | 8.7 | 1 pdf-probe-pt | "o" \|dy\| 5.63 -> 8.7 pt vs Chrome |
| pdf-probe | `pdf-probe\|boleto\|emissor#1\|dy` | 5.63 | 8.7 | 1 pdf-probe-pt | "emissor" \|dy\| 5.63 -> 8.7 pt vs Chrome |
| pdf-probe | `pdf-probe\|boleto\|fictício.#1\|dy` | 5.63 | 8.7 | 1 pdf-probe-pt | "fictício." \|dy\| 5.63 -> 8.7 pt vs Chrome |
| pdf-probe | `pdf-probe\|boleto\|Desconto#1\|dy` | 6.38 | 9.45 | 1 pdf-probe-pt | "Desconto" \|dy\| 6.38 -> 9.45 pt vs Chrome |
| pdf-probe | `pdf-probe\|boleto\|de#7\|dy` | 6.38 | 9.45 | 1 pdf-probe-pt | "de" \|dy\| 6.38 -> 9.45 pt vs Chrome |
| pdf-probe | `pdf-probe\|boleto\|R$#4\|dy` | 6.38 | 9.45 | 1 pdf-probe-pt | "R$" \|dy\| 6.38 -> 9.45 pt vs Chrome |
| pdf-probe | `pdf-probe\|boleto\|92,13#1\|dy` | 6.38 | 9.45 | 1 pdf-probe-pt | "92,13" \|dy\| 6.38 -> 9.45 pt vs Chrome |
| pdf-probe | `pdf-probe\|boleto\|para#1\|dy` | 6.38 | 9.45 | 1 pdf-probe-pt | "para" \|dy\| 6.38 -> 9.45 pt vs Chrome |
| pdf-probe | `pdf-probe\|boleto\|pagamento#1\|dy` | 6.38 | 9.45 | 1 pdf-probe-pt | "pagamento" \|dy\| 6.38 -> 9.45 pt vs Chrome |
| pdf-probe | `pdf-probe\|boleto\|até#2\|dy` | 6.38 | 9.45 | 1 pdf-probe-pt | "até" \|dy\| 6.38 -> 9.45 pt vs Chrome |
| pdf-probe | `pdf-probe\|boleto\|05/07/2026.#1\|dy` | 6.38 | 9.45 | 1 pdf-probe-pt | "05/07/2026." \|dy\| 6.38 -> 9.45 pt vs Chrome |
| pdf-probe | `pdf-probe\|boleto\|R$#5\|dy` | 6.38 | 9.45 | 1 pdf-probe-pt | "R$" \|dy\| 6.38 -> 9.45 pt vs Chrome |
| pdf-probe | `pdf-probe\|boleto\|0,00#1\|dy` | 6.38 | 9.45 | 1 pdf-probe-pt | "0,00" \|dy\| 6.38 -> 9.45 pt vs Chrome |
| pdf-probe | `pdf-probe\|boleto\|(-)#2\|dy` | 7.43 | 10.5 | 1 pdf-probe-pt | "(-)" \|dy\| 7.43 -> 10.5 pt vs Chrome |
| pdf-probe | `pdf-probe\|boleto\|OUTRAS#1\|dy` | 7.43 | 10.5 | 1 pdf-probe-pt | "OUTRAS" \|dy\| 7.43 -> 10.5 pt vs Chrome |
| pdf-probe | `pdf-probe\|boleto\|DEDUÇÕES#1\|dy` | 7.43 | 10.5 | 1 pdf-probe-pt | "DEDUÇÕES" \|dy\| 7.43 -> 10.5 pt vs Chrome |
| pdf-probe | `pdf-probe\|boleto\|R$#6\|dy` | 7.13 | 10.2 | 1 pdf-probe-pt | "R$" \|dy\| 7.13 -> 10.2 pt vs Chrome |
| pdf-probe | `pdf-probe\|boleto\|0,00#2\|dy` | 7.13 | 10.2 | 1 pdf-probe-pt | "0,00" \|dy\| 7.13 -> 10.2 pt vs Chrome |
| pdf-probe | `pdf-probe\|boleto\|(+)#1\|dy` | 8.93 | 12 | 1 pdf-probe-pt | "(+)" \|dy\| 8.93 -> 12 pt vs Chrome |
| pdf-probe | `pdf-probe\|boleto\|MORA#1\|dy` | 8.93 | 12 | 1 pdf-probe-pt | "MORA" \|dy\| 8.93 -> 12 pt vs Chrome |
| pdf-probe | `pdf-probe\|boleto\|/#6\|dy` | 8.93 | 12 | 1 pdf-probe-pt | "/" \|dy\| 8.93 -> 12 pt vs Chrome |
| pdf-probe | `pdf-probe\|boleto\|MULTA#1\|dy` | 8.93 | 12 | 1 pdf-probe-pt | "MULTA" \|dy\| 8.93 -> 12 pt vs Chrome |
| pdf-probe | `pdf-probe\|boleto\|R$#7\|dy` | 8.63 | 11.7 | 1 pdf-probe-pt | "R$" \|dy\| 8.63 -> 11.7 pt vs Chrome |
| pdf-probe | `pdf-probe\|boleto\|0,00#3\|dy` | 8.63 | 11.7 | 1 pdf-probe-pt | "0,00" \|dy\| 8.63 -> 11.7 pt vs Chrome |
| pdf-probe | `pdf-probe\|boleto\|(=)#2\|dy` | 10.43 | 13.5 | 1 pdf-probe-pt | "(=)" \|dy\| 10.43 -> 13.5 pt vs Chrome |
| pdf-probe | `pdf-probe\|boleto\|VALOR#3\|dy` | 10.43 | 13.5 | 1 pdf-probe-pt | "VALOR" \|dy\| 10.43 -> 13.5 pt vs Chrome |
| pdf-probe | `pdf-probe\|boleto\|COBRADO#1\|dy` | 10.43 | 13.5 | 1 pdf-probe-pt | "COBRADO" \|dy\| 10.43 -> 13.5 pt vs Chrome |
| pdf-probe | `pdf-probe\|boleto\|R$#8\|dy` | 10.13 | 13.2 | 1 pdf-probe-pt | "R$" \|dy\| 10.13 -> 13.2 pt vs Chrome |
| pdf-probe | `pdf-probe\|boleto\|1.842,50#3\|dy` | 10.13 | 13.2 | 1 pdf-probe-pt | "1.842,50" \|dy\| 10.13 -> 13.2 pt vs Chrome |
| pdf-probe | `pdf-probe\|boleto\|PAGADOR#2\|dy` | 11.93 | 15 | 1 pdf-probe-pt | "PAGADOR" \|dy\| 11.93 -> 15 pt vs Chrome |
| pdf-probe | `pdf-probe\|boleto\|Maria#1\|dy` | 12.38 | 15.45 | 1 pdf-probe-pt | "Maria" \|dy\| 12.38 -> 15.45 pt vs Chrome |
| pdf-probe | `pdf-probe\|boleto\|das#1\|dy` | 12.38 | 15.45 | 1 pdf-probe-pt | "das" \|dy\| 12.38 -> 15.45 pt vs Chrome |
| pdf-probe | `pdf-probe\|boleto\|Couves#1\|dy` | 12.38 | 15.45 | 1 pdf-probe-pt | "Couves" \|dy\| 12.38 -> 15.45 pt vs Chrome |
| pdf-probe | `pdf-probe\|boleto\|Exemplo#1\|dy` | 12.38 | 15.45 | 1 pdf-probe-pt | "Exemplo" \|dy\| 12.38 -> 15.45 pt vs Chrome |
| pdf-probe | `pdf-probe\|boleto\|—#3\|dy` | 12.38 | 15.45 | 1 pdf-probe-pt | "—" \|dy\| 12.38 -> 15.45 pt vs Chrome |
| pdf-probe | `pdf-probe\|boleto\|CPF#1\|dy` | 12.38 | 15.45 | 1 pdf-probe-pt | "CPF" \|dy\| 12.38 -> 15.45 pt vs Chrome |
| pdf-probe | `pdf-probe\|boleto\|123.456.789-09#1\|dy` | 12.38 | 15.45 | 1 pdf-probe-pt | "123.456.789-09" \|dy\| 12.38 -> 15.45 pt vs Chrome |
| pdf-probe | `pdf-probe\|boleto\|Rua#1\|dy` | 12.38 | 15.45 | 1 pdf-probe-pt | "Rua" \|dy\| 12.38 -> 15.45 pt vs Chrome |
| pdf-probe | `pdf-probe\|boleto\|das#2\|dy` | 12.38 | 15.45 | 1 pdf-probe-pt | "das" \|dy\| 12.38 -> 15.45 pt vs Chrome |
| pdf-probe | `pdf-probe\|boleto\|Flores,#1\|dy` | 12.38 | 15.45 | 1 pdf-probe-pt | "Flores," \|dy\| 12.38 -> 15.45 pt vs Chrome |
| pdf-probe | `pdf-probe\|boleto\|123#1\|dy` | 12.38 | 15.45 | 1 pdf-probe-pt | "123" \|dy\| 12.38 -> 15.45 pt vs Chrome |
| pdf-probe | `pdf-probe\|boleto\|—#4\|dy` | 12.38 | 15.45 | 1 pdf-probe-pt | "—" \|dy\| 12.38 -> 15.45 pt vs Chrome |
| pdf-probe | `pdf-probe\|boleto\|Jardim#1\|dy` | 12.38 | 15.45 | 1 pdf-probe-pt | "Jardim" \|dy\| 12.38 -> 15.45 pt vs Chrome |
| pdf-probe | `pdf-probe\|boleto\|Sintético#1\|dy` | 12.38 | 15.45 | 1 pdf-probe-pt | "Sintético" \|dy\| 12.38 -> 15.45 pt vs Chrome |
| pdf-probe | `pdf-probe\|boleto\|Cidade#1\|dy` | 12.38 | 15.45 | 1 pdf-probe-pt | "Cidade" \|dy\| 12.38 -> 15.45 pt vs Chrome |
| pdf-probe | `pdf-probe\|boleto\|Exemplo#2\|dy` | 12.38 | 15.45 | 1 pdf-probe-pt | "Exemplo" \|dy\| 12.38 -> 15.45 pt vs Chrome |
| pdf-probe | `pdf-probe\|boleto\|/#7\|dy` | 12.38 | 15.45 | 1 pdf-probe-pt | "/" \|dy\| 12.38 -> 15.45 pt vs Chrome |
| pdf-probe | `pdf-probe\|boleto\|SP#1\|dy` | 12.38 | 15.45 | 1 pdf-probe-pt | "SP" \|dy\| 12.38 -> 15.45 pt vs Chrome |
| pdf-probe | `pdf-probe\|boleto\|—#5\|dy` | 12.38 | 15.45 | 1 pdf-probe-pt | "—" \|dy\| 12.38 -> 15.45 pt vs Chrome |
| pdf-probe | `pdf-probe\|boleto\|CEP#1\|dy` | 12.38 | 15.45 | 1 pdf-probe-pt | "CEP" \|dy\| 12.38 -> 15.45 pt vs Chrome |
| pdf-probe | `pdf-probe\|boleto\|01234-567#1\|dy` | 12.38 | 15.45 | 1 pdf-probe-pt | "01234-567" \|dy\| 12.38 -> 15.45 pt vs Chrome |
| pdf-probe | `pdf-probe\|boleto\|REFERÊNCIA#1\|dy` | 13.43 | 16.5 | 1 pdf-probe-pt | "REFERÊNCIA" \|dy\| 13.43 -> 16.5 pt vs Chrome |
| pdf-probe | `pdf-probe\|boleto\|DESCRIÇÃO#1\|dy` | 13.43 | 16.5 | 1 pdf-probe-pt | "DESCRIÇÃO" \|dy\| 13.43 -> 16.5 pt vs Chrome |
| pdf-probe | `pdf-probe\|boleto\|VALOR#4\|dy` | 13.43 | 16.5 | 1 pdf-probe-pt | "VALOR" \|dy\| 13.43 -> 16.5 pt vs Chrome |
| pdf-probe | `pdf-probe\|boleto\|06/2026#1\|dy` | 13.79 | 16.86 | 1 pdf-probe-pt | "06/2026" \|dy\| 13.79 -> 16.86 pt vs Chrome |
| pdf-probe | `pdf-probe\|boleto\|Assinatura#1\|dy` | 13.79 | 16.86 | 1 pdf-probe-pt | "Assinatura" \|dy\| 13.79 -> 16.86 pt vs Chrome |
| pdf-probe | `pdf-probe\|boleto\|plano#1\|dy` | 13.79 | 16.86 | 1 pdf-probe-pt | "plano" \|dy\| 13.79 -> 16.86 pt vs Chrome |
| pdf-probe | `pdf-probe\|boleto\|Widget#1\|dy` | 13.79 | 16.86 | 1 pdf-probe-pt | "Widget" \|dy\| 13.79 -> 16.86 pt vs Chrome |
| pdf-probe | `pdf-probe\|boleto\|Pro#1\|dy` | 13.79 | 16.86 | 1 pdf-probe-pt | "Pro" \|dy\| 13.79 -> 16.86 pt vs Chrome |
| pdf-probe | `pdf-probe\|boleto\|R$#9\|dy` | 13.79 | 16.86 | 1 pdf-probe-pt | "R$" \|dy\| 13.79 -> 16.86 pt vs Chrome |
| pdf-probe | `pdf-probe\|boleto\|1.499,00#1\|dy` | 13.79 | 16.86 | 1 pdf-probe-pt | "1.499,00" \|dy\| 13.79 -> 16.86 pt vs Chrome |
| pdf-probe | `pdf-probe\|boleto\|06/2026#2\|dy` | 14.54 | 17.61 | 1 pdf-probe-pt | "06/2026" \|dy\| 14.54 -> 17.61 pt vs Chrome |
| pdf-probe | `pdf-probe\|boleto\|Usuários#1\|dy` | 14.54 | 17.61 | 1 pdf-probe-pt | "Usuários" \|dy\| 14.54 -> 17.61 pt vs Chrome |
| pdf-probe | `pdf-probe\|boleto\|adicionais#1\|dy` | 14.54 | 17.61 | 1 pdf-probe-pt | "adicionais" \|dy\| 14.54 -> 17.61 pt vs Chrome |
| pdf-probe | `pdf-probe\|boleto\|(3x)#1\|dy` | 14.54 | 17.61 | 1 pdf-probe-pt | "(3x)" \|dy\| 14.54 -> 17.61 pt vs Chrome |
| pdf-probe | `pdf-probe\|boleto\|R$#10\|dy` | 14.54 | 17.61 | 1 pdf-probe-pt | "R$" \|dy\| 14.54 -> 17.61 pt vs Chrome |
| pdf-probe | `pdf-probe\|boleto\|297,00#1\|dy` | 14.54 | 17.61 | 1 pdf-probe-pt | "297,00" \|dy\| 14.54 -> 17.61 pt vs Chrome |
| pdf-probe | `pdf-probe\|boleto\|06/2026#3\|dy` | 15.29 | 18.36 | 1 pdf-probe-pt | "06/2026" \|dy\| 15.29 -> 18.36 pt vs Chrome |
| pdf-probe | `pdf-probe\|boleto\|Taxa#1\|dy` | 15.29 | 18.36 | 1 pdf-probe-pt | "Taxa" \|dy\| 15.29 -> 18.36 pt vs Chrome |
| pdf-probe | `pdf-probe\|boleto\|de#8\|dy` | 15.29 | 18.36 | 1 pdf-probe-pt | "de" \|dy\| 15.29 -> 18.36 pt vs Chrome |
| pdf-probe | `pdf-probe\|boleto\|processamento#1\|dy` | 15.29 | 18.36 | 1 pdf-probe-pt | "processamento" \|dy\| 15.29 -> 18.36 pt vs Chrome |
| pdf-probe | `pdf-probe\|boleto\|R$#11\|dy` | 15.29 | 18.36 | 1 pdf-probe-pt | "R$" \|dy\| 15.29 -> 18.36 pt vs Chrome |
| pdf-probe | `pdf-probe\|boleto\|46,50#1\|dy` | 15.29 | 18.36 | 1 pdf-probe-pt | "46,50" \|dy\| 15.29 -> 18.36 pt vs Chrome |
| pdf-probe | `pdf-probe\|boleto\|CÓDIGO#3\|dy` | 18.21 | 21.28 | 1 pdf-probe-pt | "CÓDIGO" \|dy\| 18.21 -> 21.28 pt vs Chrome |
| pdf-probe | `pdf-probe\|boleto\|DE#3\|dy` | 18.21 | 21.28 | 1 pdf-probe-pt | "DE" \|dy\| 18.21 -> 21.28 pt vs Chrome |
| pdf-probe | `pdf-probe\|boleto\|BARRAS#1\|dy` | 18.21 | 21.28 | 1 pdf-probe-pt | "BARRAS" \|dy\| 18.21 -> 21.28 pt vs Chrome |
| pdf-probe | `pdf-probe\|boleto\|(REPRESENTAÇÃO#1\|dy` | 18.21 | 21.28 | 1 pdf-probe-pt | "(REPRESENTAÇÃO" \|dy\| 18.21 -> 21.28 pt vs Chrome |
| pdf-probe | `pdf-probe\|boleto\|TEXTUAL#1\|dy` | 18.21 | 21.28 | 1 pdf-probe-pt | "TEXTUAL" \|dy\| 18.21 -> 21.28 pt vs Chrome |
| pdf-probe | `pdf-probe\|boleto\|—#6\|dy` | 18.21 | 21.28 | 1 pdf-probe-pt | "—" \|dy\| 18.21 -> 21.28 pt vs Chrome |
| pdf-probe | `pdf-probe\|boleto\|NÃO#1\|dy` | 18.21 | 21.28 | 1 pdf-probe-pt | "NÃO" \|dy\| 18.21 -> 21.28 pt vs Chrome |
| pdf-probe | `pdf-probe\|boleto\|ESCANEÁVEL)#1\|dy` | 18.21 | 21.28 | 1 pdf-probe-pt | "ESCANEÁVEL)" \|dy\| 18.21 -> 21.28 pt vs Chrome |
| pdf-probe | `pdf-probe\|boleto\|99991999900000123459990000012345670000004200#1\|dy` | 19.12 | 21.61 | 1 pdf-probe-pt | "99991999900000123459990000012345670000004200" \|dy\| 19.12 -> 21.61 pt vs Chrome |
| pdf-probe | `pdf-probe\|boleto\|Documento#1\|dy` | 18.7 | 21.18 | 1 pdf-probe-pt | "Documento" \|dy\| 18.7 -> 21.18 pt vs Chrome |
| pdf-probe | `pdf-probe\|boleto\|de#9\|dy` | 18.7 | 21.18 | 1 pdf-probe-pt | "de" \|dy\| 18.7 -> 21.18 pt vs Chrome |
| pdf-probe | `pdf-probe\|boleto\|cobrança#1\|dy` | 18.7 | 21.18 | 1 pdf-probe-pt | "cobrança" \|dy\| 18.7 -> 21.18 pt vs Chrome |
| pdf-probe | `pdf-probe\|boleto\|fictício#2\|dy` | 18.7 | 21.18 | 1 pdf-probe-pt | "fictício" \|dy\| 18.7 -> 21.18 pt vs Chrome |
| pdf-probe | `pdf-probe\|boleto\|gerado#1\|dy` | 18.7 | 21.18 | 1 pdf-probe-pt | "gerado" \|dy\| 18.7 -> 21.18 pt vs Chrome |
| pdf-probe | `pdf-probe\|boleto\|por#1\|dy` | 18.7 | 21.18 | 1 pdf-probe-pt | "por" \|dy\| 18.7 -> 21.18 pt vs Chrome |
| pdf-probe | `pdf-probe\|boleto\|vellora#1\|dy` | 18.7 | 21.18 | 1 pdf-probe-pt | "vellora" \|dy\| 18.7 -> 21.18 pt vs Chrome |
| pdf-probe | `pdf-probe\|boleto\|para#2\|dy` | 18.7 | 21.18 | 1 pdf-probe-pt | "para" \|dy\| 18.7 -> 21.18 pt vs Chrome |
| pdf-probe | `pdf-probe\|boleto\|fins#1\|dy` | 18.7 | 21.18 | 1 pdf-probe-pt | "fins" \|dy\| 18.7 -> 21.18 pt vs Chrome |
| pdf-probe | `pdf-probe\|boleto\|de#10\|dy` | 18.7 | 21.18 | 1 pdf-probe-pt | "de" \|dy\| 18.7 -> 21.18 pt vs Chrome |
| pdf-probe | `pdf-probe\|boleto\|teste#1\|dy` | 18.7 | 21.18 | 1 pdf-probe-pt | "teste" \|dy\| 18.7 -> 21.18 pt vs Chrome |
| pdf-probe | `pdf-probe\|boleto\|—#7\|dy` | 18.7 | 21.18 | 1 pdf-probe-pt | "—" \|dy\| 18.7 -> 21.18 pt vs Chrome |
| pdf-probe | `pdf-probe\|boleto\|Acme#3\|dy` | 18.7 | 21.18 | 1 pdf-probe-pt | "Acme" \|dy\| 18.7 -> 21.18 pt vs Chrome |
| pdf-probe | `pdf-probe\|boleto\|Widgets#3\|dy` | 18.7 | 21.18 | 1 pdf-probe-pt | "Widgets" \|dy\| 18.7 -> 21.18 pt vs Chrome |
| pdf-probe | `pdf-probe\|boleto\|Comércio#3\|dy` | 18.7 | 21.18 | 1 pdf-probe-pt | "Comércio" \|dy\| 18.7 -> 21.18 pt vs Chrome |
| pdf-probe | `pdf-probe\|boleto\|LTDA.#1\|dy` | 18.7 | 21.18 | 1 pdf-probe-pt | "LTDA." \|dy\| 18.7 -> 21.18 pt vs Chrome |
| pdf-probe | `pdf-probe\|boleto\|Autenticação#1\|dy` | 18.7 | 21.18 | 1 pdf-probe-pt | "Autenticação" \|dy\| 18.7 -> 21.18 pt vs Chrome |
| pdf-probe | `pdf-probe\|boleto\|mecânica:#1\|dy` | 18.7 | 21.18 | 1 pdf-probe-pt | "mecânica:" \|dy\| 18.7 -> 21.18 pt vs Chrome |
| pdf-probe | `pdf-probe\|boleto\|FAKE-AUTH-0000-#1\|dy` | 18.7 | 21.18 | 1 pdf-probe-pt | "FAKE-AUTH-0000-" \|dy\| 18.7 -> 21.18 pt vs Chrome |
| pdf-probe | `pdf-probe\|boleto\|XXXX-TESTE.#1\|dy` | 18.7 | 21.18 | 1 pdf-probe-pt | "XXXX-TESTE." \|dy\| 18.7 -> 21.18 pt vs Chrome |
| pdf-probe | `pdf-probe\|invoice\|FATURA#1\|dy` | 0.18 | 3.18 | 1 pdf-probe-pt | "FATURA" \|dy\| 0.18 -> 3.18 pt vs Chrome |
| pdf-probe | `pdf-probe\|invoice\|Número#1\|dy` | -0.87 | 2.13 | 1 pdf-probe-pt | "Número" \|dy\| 0.87 -> 2.13 pt vs Chrome |
| pdf-probe | `pdf-probe\|invoice\|INV-2026-00417#1\|dy` | -0.87 | 2.13 | 1 pdf-probe-pt | "INV-2026-00417" \|dy\| 0.87 -> 2.13 pt vs Chrome |
| pdf-probe | `pdf-probe\|invoice\|Emissão#1\|dy` | -0.87 | 2.13 | 1 pdf-probe-pt | "Emissão" \|dy\| 0.87 -> 2.13 pt vs Chrome |
| pdf-probe | `pdf-probe\|invoice\|22/06/2026#1\|dy` | -0.87 | 2.13 | 1 pdf-probe-pt | "22/06/2026" \|dy\| 0.87 -> 2.13 pt vs Chrome |
| pdf-probe | `pdf-probe\|invoice\|Acme#1\|dy` | 0.54 | 3.54 | 1 pdf-probe-pt | "Acme" \|dy\| 0.54 -> 3.54 pt vs Chrome |
| pdf-probe | `pdf-probe\|invoice\|Widgets#1\|dy` | 0.54 | 3.54 | 1 pdf-probe-pt | "Widgets" \|dy\| 0.54 -> 3.54 pt vs Chrome |
| pdf-probe | `pdf-probe\|invoice\|LON#1\|dy` | 0.54 | 3.54 | 1 pdf-probe-pt | "LON" \|dy\| 0.54 -> 3.54 pt vs Chrome |
| pdf-probe | `pdf-probe\|invoice\|Vencimento#1\|dy` | -0.87 | 2.13 | 1 pdf-probe-pt | "Vencimento" \|dy\| 0.87 -> 2.13 pt vs Chrome |
| pdf-probe | `pdf-probe\|invoice\|22/07/2026#1\|dy` | -0.87 | 2.13 | 1 pdf-probe-pt | "22/07/2026" \|dy\| 0.87 -> 2.13 pt vs Chrome |
| pdf-probe | `pdf-probe\|invoice\|Soluções#1\|dy` | -0.97 | 2.03 | 1 pdf-probe-pt | "Soluções" \|dy\| 0.97 -> 2.03 pt vs Chrome |
| pdf-probe | `pdf-probe\|invoice\|industriais#1\|dy` | -0.97 | 2.03 | 1 pdf-probe-pt | "industriais" \|dy\| 0.97 -> 2.03 pt vs Chrome |
| pdf-probe | `pdf-probe\|invoice\|sob#1\|dy` | -0.97 | 2.03 | 1 pdf-probe-pt | "sob" \|dy\| 0.97 -> 2.03 pt vs Chrome |
| pdf-probe | `pdf-probe\|invoice\|medida#1\|dy` | -0.97 | 2.03 | 1 pdf-probe-pt | "medida" \|dy\| 0.97 -> 2.03 pt vs Chrome |
| pdf-probe | `pdf-probe\|invoice\|40#1\|dy` | -0.26 | 2.88 | 1 pdf-probe-pt | "40" \|dy\| 0.26 -> 2.88 pt vs Chrome |
| pdf-probe | `pdf-probe\|invoice\|R$#1\|dy` | -0.26 | 2.88 | 1 pdf-probe-pt | "R$" \|dy\| 0.26 -> 2.88 pt vs Chrome |
| pdf-probe | `pdf-probe\|invoice\|32,50#1\|dy` | -0.26 | 2.88 | 1 pdf-probe-pt | "32,50" \|dy\| 0.26 -> 2.88 pt vs Chrome |
| pdf-probe | `pdf-probe\|invoice\|R$#2\|dy` | -0.26 | 2.88 | 1 pdf-probe-pt | "R$" \|dy\| 0.26 -> 2.88 pt vs Chrome |
| pdf-probe | `pdf-probe\|invoice\|1.300,00#1\|dy` | -0.26 | 2.88 | 1 pdf-probe-pt | "1.300,00" \|dy\| 0.26 -> 2.88 pt vs Chrome |
| pdf-probe | `pdf-probe\|invoice\|25#1\|dy` | -1.01 | 2.13 | 1 pdf-probe-pt | "25" \|dy\| 1.01 -> 2.13 pt vs Chrome |
| pdf-probe | `pdf-probe\|invoice\|R$#3\|dy` | -1.01 | 2.13 | 1 pdf-probe-pt | "R$" \|dy\| 1.01 -> 2.13 pt vs Chrome |
| pdf-probe | `pdf-probe\|invoice\|18,90#1\|dy` | -1.01 | 2.13 | 1 pdf-probe-pt | "18,90" \|dy\| 1.01 -> 2.13 pt vs Chrome |
| pdf-probe | `pdf-probe\|invoice\|R$#4\|dy` | -1.01 | 2.13 | 1 pdf-probe-pt | "R$" \|dy\| 1.01 -> 2.13 pt vs Chrome |
| pdf-probe | `pdf-probe\|invoice\|472,50#1\|dy` | -1.01 | 2.13 | 1 pdf-probe-pt | "472,50" \|dy\| 1.01 -> 2.13 pt vs Chrome |
| pdf-probe | `pdf-probe\|invoice\|18#1\|dy` | -1.01 | 2.13 | 1 pdf-probe-pt | "18" \|dy\| 1.01 -> 2.13 pt vs Chrome |
| pdf-probe | `pdf-probe\|invoice\|R$#5\|dy` | -1.01 | 2.13 | 1 pdf-probe-pt | "R$" \|dy\| 1.01 -> 2.13 pt vs Chrome |
| pdf-probe | `pdf-probe\|invoice\|9,75#1\|dy` | -1.01 | 2.13 | 1 pdf-probe-pt | "9,75" \|dy\| 1.01 -> 2.13 pt vs Chrome |
| pdf-probe | `pdf-probe\|invoice\|R$#6\|dy` | -1.01 | 2.13 | 1 pdf-probe-pt | "R$" \|dy\| 1.01 -> 2.13 pt vs Chrome |
| pdf-probe | `pdf-probe\|invoice\|175,50#1\|dy` | -1.01 | 2.13 | 1 pdf-probe-pt | "175,50" \|dy\| 1.01 -> 2.13 pt vs Chrome |
| pdf-probe | `pdf-probe\|invoice\|60#1\|dy` | -0.26 | 2.88 | 1 pdf-probe-pt | "60" \|dy\| 0.26 -> 2.88 pt vs Chrome |
| pdf-probe | `pdf-probe\|invoice\|R$#7\|dy` | -0.26 | 2.88 | 1 pdf-probe-pt | "R$" \|dy\| 0.26 -> 2.88 pt vs Chrome |
| pdf-probe | `pdf-probe\|invoice\|47,20#1\|dy` | -0.26 | 2.88 | 1 pdf-probe-pt | "47,20" \|dy\| 0.26 -> 2.88 pt vs Chrome |
| pdf-probe | `pdf-probe\|invoice\|R$#8\|dy` | -0.26 | 2.88 | 1 pdf-probe-pt | "R$" \|dy\| 0.26 -> 2.88 pt vs Chrome |
| pdf-probe | `pdf-probe\|invoice\|2.832,00#1\|dy` | -0.26 | 2.88 | 1 pdf-probe-pt | "2.832,00" \|dy\| 0.26 -> 2.88 pt vs Chrome |
| pdf-probe | `pdf-probe\|invoice\|120#1\|dy` | -1.01 | 2.13 | 1 pdf-probe-pt | "120" \|dy\| 1.01 -> 2.13 pt vs Chrome |
| pdf-probe | `pdf-probe\|invoice\|R$#9\|dy` | -1.01 | 2.13 | 1 pdf-probe-pt | "R$" \|dy\| 1.01 -> 2.13 pt vs Chrome |
| pdf-probe | `pdf-probe\|invoice\|6,40#1\|dy` | -1.01 | 2.13 | 1 pdf-probe-pt | "6,40" \|dy\| 1.01 -> 2.13 pt vs Chrome |
| pdf-probe | `pdf-probe\|invoice\|R$#10\|dy` | -1.01 | 2.13 | 1 pdf-probe-pt | "R$" \|dy\| 1.01 -> 2.13 pt vs Chrome |
| pdf-probe | `pdf-probe\|invoice\|768,00#1\|dy` | -1.01 | 2.13 | 1 pdf-probe-pt | "768,00" \|dy\| 1.01 -> 2.13 pt vs Chrome |
| pdf-probe | `pdf-probe\|invoice\|30#1\|dy` | -0.26 | 2.88 | 1 pdf-probe-pt | "30" \|dy\| 0.26 -> 2.88 pt vs Chrome |
| pdf-probe | `pdf-probe\|invoice\|R$#11\|dy` | -0.26 | 2.88 | 1 pdf-probe-pt | "R$" \|dy\| 0.26 -> 2.88 pt vs Chrome |
| pdf-probe | `pdf-probe\|invoice\|28,00#1\|dy` | -0.26 | 2.88 | 1 pdf-probe-pt | "28,00" \|dy\| 0.26 -> 2.88 pt vs Chrome |
| pdf-probe | `pdf-probe\|invoice\|R$#12\|dy` | -0.26 | 2.88 | 1 pdf-probe-pt | "R$" \|dy\| 0.26 -> 2.88 pt vs Chrome |
| pdf-probe | `pdf-probe\|invoice\|840,00#1\|dy` | -0.26 | 2.88 | 1 pdf-probe-pt | "840,00" \|dy\| 0.26 -> 2.88 pt vs Chrome |
| pdf-probe | `pdf-probe\|invoice\|22#1\|dy` | -1.01 | 2.13 | 1 pdf-probe-pt | "22" \|dy\| 1.01 -> 2.13 pt vs Chrome |
| pdf-probe | `pdf-probe\|invoice\|R$#13\|dy` | -1.01 | 2.13 | 1 pdf-probe-pt | "R$" \|dy\| 1.01 -> 2.13 pt vs Chrome |
| pdf-probe | `pdf-probe\|invoice\|89,90#1\|dy` | -1.01 | 2.13 | 1 pdf-probe-pt | "89,90" \|dy\| 1.01 -> 2.13 pt vs Chrome |
| pdf-probe | `pdf-probe\|invoice\|R$#14\|dy` | -1.01 | 2.13 | 1 pdf-probe-pt | "R$" \|dy\| 1.01 -> 2.13 pt vs Chrome |
| pdf-probe | `pdf-probe\|invoice\|1.977,80#1\|dy` | -1.01 | 2.13 | 1 pdf-probe-pt | "1.977,80" \|dy\| 1.01 -> 2.13 pt vs Chrome |
| pdf-probe | `pdf-probe\|invoice\|44#1\|dy` | -0.26 | 2.88 | 1 pdf-probe-pt | "44" \|dy\| 0.26 -> 2.88 pt vs Chrome |
| pdf-probe | `pdf-probe\|invoice\|R$#15\|dy` | -0.26 | 2.88 | 1 pdf-probe-pt | "R$" \|dy\| 0.26 -> 2.88 pt vs Chrome |
| pdf-probe | `pdf-probe\|invoice\|34,50#1\|dy` | -0.26 | 2.88 | 1 pdf-probe-pt | "34,50" \|dy\| 0.26 -> 2.88 pt vs Chrome |
| pdf-probe | `pdf-probe\|invoice\|R$#16\|dy` | -0.26 | 2.88 | 1 pdf-probe-pt | "R$" \|dy\| 0.26 -> 2.88 pt vs Chrome |
| pdf-probe | `pdf-probe\|invoice\|1.518,00#1\|dy` | -0.26 | 2.88 | 1 pdf-probe-pt | "1.518,00" \|dy\| 0.26 -> 2.88 pt vs Chrome |
| pdf-probe | `pdf-probe\|invoice\|12#2\|dy` | -0.26 | 2.88 | 1 pdf-probe-pt | "12" \|dy\| 0.26 -> 2.88 pt vs Chrome |
| pdf-probe | `pdf-probe\|invoice\|R$#17\|dy` | -0.26 | 2.88 | 1 pdf-probe-pt | "R$" \|dy\| 0.26 -> 2.88 pt vs Chrome |
| pdf-probe | `pdf-probe\|invoice\|156,00#1\|dy` | -0.26 | 2.88 | 1 pdf-probe-pt | "156,00" \|dy\| 0.26 -> 2.88 pt vs Chrome |
| pdf-probe | `pdf-probe\|invoice\|R$#18\|dy` | -0.26 | 2.88 | 1 pdf-probe-pt | "R$" \|dy\| 0.26 -> 2.88 pt vs Chrome |
| pdf-probe | `pdf-probe\|invoice\|1.872,00#1\|dy` | -0.26 | 2.88 | 1 pdf-probe-pt | "1.872,00" \|dy\| 0.26 -> 2.88 pt vs Chrome |
| pdf-probe | `pdf-probe\|invoice\|24#1\|dy` | -1.01 | 2.13 | 1 pdf-probe-pt | "24" \|dy\| 1.01 -> 2.13 pt vs Chrome |
| pdf-probe | `pdf-probe\|invoice\|R$#19\|dy` | -1.01 | 2.13 | 1 pdf-probe-pt | "R$" \|dy\| 1.01 -> 2.13 pt vs Chrome |
| pdf-probe | `pdf-probe\|invoice\|21,30#1\|dy` | -1.01 | 2.13 | 1 pdf-probe-pt | "21,30" \|dy\| 1.01 -> 2.13 pt vs Chrome |
| pdf-probe | `pdf-probe\|invoice\|R$#20\|dy` | -1.01 | 2.13 | 1 pdf-probe-pt | "R$" \|dy\| 1.01 -> 2.13 pt vs Chrome |
| pdf-probe | `pdf-probe\|invoice\|511,20#1\|dy` | -1.01 | 2.13 | 1 pdf-probe-pt | "511,20" \|dy\| 1.01 -> 2.13 pt vs Chrome |
| pdf-probe | `pdf-probe\|invoice\|8#1\|dy` | -0.26 | 2.88 | 1 pdf-probe-pt | "8" \|dy\| 0.26 -> 2.88 pt vs Chrome |
| pdf-probe | `pdf-probe\|invoice\|R$#21\|dy` | -0.26 | 2.88 | 1 pdf-probe-pt | "R$" \|dy\| 0.26 -> 2.88 pt vs Chrome |
| pdf-probe | `pdf-probe\|invoice\|142,50#1\|dy` | -0.26 | 2.88 | 1 pdf-probe-pt | "142,50" \|dy\| 0.26 -> 2.88 pt vs Chrome |
| pdf-probe | `pdf-probe\|invoice\|R$#22\|dy` | -0.26 | 2.88 | 1 pdf-probe-pt | "R$" \|dy\| 0.26 -> 2.88 pt vs Chrome |
| pdf-probe | `pdf-probe\|invoice\|1.140,00#1\|dy` | -0.26 | 2.88 | 1 pdf-probe-pt | "1.140,00" \|dy\| 0.26 -> 2.88 pt vs Chrome |
| pdf-probe | `pdf-probe\|invoice\|Suporte#1\|dy` | -0.26 | 2.88 | 1 pdf-probe-pt | "Suporte" \|dy\| 0.26 -> 2.88 pt vs Chrome |
| pdf-probe | `pdf-probe\|invoice\|de#1\|dy` | -0.26 | 2.88 | 1 pdf-probe-pt | "de" \|dy\| 0.26 -> 2.88 pt vs Chrome |
| pdf-probe | `pdf-probe\|invoice\|fixação#1\|dy` | -0.26 | 2.88 | 1 pdf-probe-pt | "fixação" \|dy\| 0.26 -> 2.88 pt vs Chrome |
| pdf-probe | `pdf-probe\|invoice\|em#1\|dy` | -0.26 | 2.88 | 1 pdf-probe-pt | "em" \|dy\| 0.26 -> 2.88 pt vs Chrome |
| pdf-probe | `pdf-probe\|invoice\|alumínio#1\|dy` | -0.26 | 2.88 | 1 pdf-probe-pt | "alumínio" \|dy\| 0.26 -> 2.88 pt vs Chrome |
| pdf-probe | `pdf-probe\|invoice\|A20#1\|dy` | -0.26 | 2.88 | 1 pdf-probe-pt | "A20" \|dy\| 0.26 -> 2.88 pt vs Chrome |
| pdf-probe | `pdf-probe\|invoice\|Parafuso#1\|dy` | -1.01 | 2.13 | 1 pdf-probe-pt | "Parafuso" \|dy\| 1.01 -> 2.13 pt vs Chrome |
| pdf-probe | `pdf-probe\|invoice\|sextavado#1\|dy` | -1.01 | 2.13 | 1 pdf-probe-pt | "sextavado" \|dy\| 1.01 -> 2.13 pt vs Chrome |
| pdf-probe | `pdf-probe\|invoice\|M8#1\|dy` | -1.01 | 2.13 | 1 pdf-probe-pt | "M8" \|dy\| 1.01 -> 2.13 pt vs Chrome |
| pdf-probe | `pdf-probe\|invoice\|(caixa#1\|dy` | -1.01 | 2.13 | 1 pdf-probe-pt | "(caixa" \|dy\| 1.01 -> 2.13 pt vs Chrome |
| pdf-probe | `pdf-probe\|invoice\|100)#1\|dy` | -1.01 | 2.13 | 1 pdf-probe-pt | "100)" \|dy\| 1.01 -> 2.13 pt vs Chrome |
| pdf-probe | `pdf-probe\|invoice\|Arruela#1\|dy` | -1.01 | 2.13 | 1 pdf-probe-pt | "Arruela" \|dy\| 1.01 -> 2.13 pt vs Chrome |
| pdf-probe | `pdf-probe\|invoice\|de#2\|dy` | -1.01 | 2.13 | 1 pdf-probe-pt | "de" \|dy\| 1.01 -> 2.13 pt vs Chrome |
| pdf-probe | `pdf-probe\|invoice\|pressão#1\|dy` | -1.01 | 2.13 | 1 pdf-probe-pt | "pressão" \|dy\| 1.01 -> 2.13 pt vs Chrome |
| pdf-probe | `pdf-probe\|invoice\|M8#2\|dy` | -1.01 | 2.13 | 1 pdf-probe-pt | "M8" \|dy\| 1.01 -> 2.13 pt vs Chrome |
| pdf-probe | `pdf-probe\|invoice\|(caixa#2\|dy` | -1.01 | 2.13 | 1 pdf-probe-pt | "(caixa" \|dy\| 1.01 -> 2.13 pt vs Chrome |
| pdf-probe | `pdf-probe\|invoice\|200)#1\|dy` | -1.01 | 2.13 | 1 pdf-probe-pt | "200)" \|dy\| 1.01 -> 2.13 pt vs Chrome |
| pdf-probe | `pdf-probe\|invoice\|SKU#3\|dy` | -0.63 | 2.51 | 1 pdf-probe-pt | "SKU" \|dy\| 0.63 -> 2.51 pt vs Chrome |
| pdf-probe | `pdf-probe\|invoice\|FS-W8-200#1\|dy` | -0.63 | 2.51 | 1 pdf-probe-pt | "FS-W8-200" \|dy\| 0.63 -> 2.51 pt vs Chrome |
| pdf-probe | `pdf-probe\|invoice\|Perfil#1\|dy` | -0.26 | 2.88 | 1 pdf-probe-pt | "Perfil" \|dy\| 0.26 -> 2.88 pt vs Chrome |
| pdf-probe | `pdf-probe\|invoice\|estrutural#1\|dy` | -0.26 | 2.88 | 1 pdf-probe-pt | "estrutural" \|dy\| 0.26 -> 2.88 pt vs Chrome |
| pdf-probe | `pdf-probe\|invoice\|40x40#1\|dy` | -0.26 | 2.88 | 1 pdf-probe-pt | "40x40" \|dy\| 0.26 -> 2.88 pt vs Chrome |
| pdf-probe | `pdf-probe\|invoice\|—#5\|dy` | -0.26 | 2.88 | 1 pdf-probe-pt | "—" \|dy\| 0.26 -> 2.88 pt vs Chrome |
| pdf-probe | `pdf-probe\|invoice\|barra#1\|dy` | -0.26 | 2.88 | 1 pdf-probe-pt | "barra" \|dy\| 0.26 -> 2.88 pt vs Chrome |
| pdf-probe | `pdf-probe\|invoice\|3m#1\|dy` | -0.26 | 2.88 | 1 pdf-probe-pt | "3m" \|dy\| 0.26 -> 2.88 pt vs Chrome |
| pdf-probe | `pdf-probe\|invoice\|Conector#1\|dy` | -1.01 | 2.13 | 1 pdf-probe-pt | "Conector" \|dy\| 1.01 -> 2.13 pt vs Chrome |
| pdf-probe | `pdf-probe\|invoice\|de#3\|dy` | -1.01 | 2.13 | 1 pdf-probe-pt | "de" \|dy\| 1.01 -> 2.13 pt vs Chrome |
| pdf-probe | `pdf-probe\|invoice\|canto#1\|dy` | -1.01 | 2.13 | 1 pdf-probe-pt | "canto" \|dy\| 1.01 -> 2.13 pt vs Chrome |
| pdf-probe | `pdf-probe\|invoice\|reforçado#1\|dy` | -1.01 | 2.13 | 1 pdf-probe-pt | "reforçado" \|dy\| 1.01 -> 2.13 pt vs Chrome |
| pdf-probe | `pdf-probe\|invoice\|SKU#5\|dy` | -0.63 | 2.51 | 1 pdf-probe-pt | "SKU" \|dy\| 0.63 -> 2.51 pt vs Chrome |
| pdf-probe | `pdf-probe\|invoice\|CN-RF-01#1\|dy` | -0.63 | 2.51 | 1 pdf-probe-pt | "CN-RF-01" \|dy\| 0.63 -> 2.51 pt vs Chrome |
| pdf-probe | `pdf-probe\|invoice\|Roldana#1\|dy` | -0.26 | 2.88 | 1 pdf-probe-pt | "Roldana" \|dy\| 0.26 -> 2.88 pt vs Chrome |
| pdf-probe | `pdf-probe\|invoice\|industrial#1\|dy` | -0.26 | 2.88 | 1 pdf-probe-pt | "industrial" \|dy\| 0.26 -> 2.88 pt vs Chrome |
| pdf-probe | `pdf-probe\|invoice\|Ø50mm#1\|dy` | -0.26 | 2.88 | 1 pdf-probe-pt | "Ø50mm" \|dy\| 0.26 -> 2.88 pt vs Chrome |
| pdf-probe | `pdf-probe\|invoice\|Trilho#1\|dy` | -1.01 | 2.13 | 1 pdf-probe-pt | "Trilho" \|dy\| 1.01 -> 2.13 pt vs Chrome |
| pdf-probe | `pdf-probe\|invoice\|linear#1\|dy` | -1.01 | 2.13 | 1 pdf-probe-pt | "linear" \|dy\| 1.01 -> 2.13 pt vs Chrome |
| pdf-probe | `pdf-probe\|invoice\|500mm#1\|dy` | -1.01 | 2.13 | 1 pdf-probe-pt | "500mm" \|dy\| 1.01 -> 2.13 pt vs Chrome |
| pdf-probe | `pdf-probe\|invoice\|Bloco#1\|dy` | -0.26 | 2.88 | 1 pdf-probe-pt | "Bloco" \|dy\| 0.26 -> 2.88 pt vs Chrome |
| pdf-probe | `pdf-probe\|invoice\|deslizante#1\|dy` | -0.26 | 2.88 | 1 pdf-probe-pt | "deslizante" \|dy\| 0.26 -> 2.88 pt vs Chrome |
| pdf-probe | `pdf-probe\|invoice\|para#1\|dy` | -0.26 | 2.88 | 1 pdf-probe-pt | "para" \|dy\| 0.26 -> 2.88 pt vs Chrome |
| pdf-probe | `pdf-probe\|invoice\|trilho#1\|dy` | -0.26 | 2.88 | 1 pdf-probe-pt | "trilho" \|dy\| 0.26 -> 2.88 pt vs Chrome |
| pdf-probe | `pdf-probe\|invoice\|linear#2\|dy` | -0.26 | 2.88 | 1 pdf-probe-pt | "linear" \|dy\| 0.26 -> 2.88 pt vs Chrome |
| pdf-probe | `pdf-probe\|invoice\|SKU#8\|dy` | -0.63 | 2.51 | 1 pdf-probe-pt | "SKU" \|dy\| 0.63 -> 2.51 pt vs Chrome |
| pdf-probe | `pdf-probe\|invoice\|BD-TL#1\|dy` | -0.63 | 2.51 | 1 pdf-probe-pt | "BD-TL" \|dy\| 0.63 -> 2.51 pt vs Chrome |
| pdf-probe | `pdf-probe\|invoice\|Motor#1\|dy` | -0.26 | 2.88 | 1 pdf-probe-pt | "Motor" \|dy\| 0.26 -> 2.88 pt vs Chrome |
| pdf-probe | `pdf-probe\|invoice\|de#4\|dy` | -0.26 | 2.88 | 1 pdf-probe-pt | "de" \|dy\| 0.26 -> 2.88 pt vs Chrome |
| pdf-probe | `pdf-probe\|invoice\|passo#1\|dy` | -0.26 | 2.88 | 1 pdf-probe-pt | "passo" \|dy\| 0.26 -> 2.88 pt vs Chrome |
| pdf-probe | `pdf-probe\|invoice\|NEMA#1\|dy` | -0.26 | 2.88 | 1 pdf-probe-pt | "NEMA" \|dy\| 0.26 -> 2.88 pt vs Chrome |
| pdf-probe | `pdf-probe\|invoice\|23#1\|dy` | -0.26 | 2.88 | 1 pdf-probe-pt | "23" \|dy\| 0.26 -> 2.88 pt vs Chrome |
| pdf-probe | `pdf-probe\|invoice\|Acoplamento#1\|dy` | -1.01 | 2.13 | 1 pdf-probe-pt | "Acoplamento" \|dy\| 1.01 -> 2.13 pt vs Chrome |
| pdf-probe | `pdf-probe\|invoice\|flexível#1\|dy` | -1.01 | 2.13 | 1 pdf-probe-pt | "flexível" \|dy\| 1.01 -> 2.13 pt vs Chrome |
| pdf-probe | `pdf-probe\|invoice\|6.35x8mm#1\|dy` | -1.01 | 2.13 | 1 pdf-probe-pt | "6.35x8mm" \|dy\| 1.01 -> 2.13 pt vs Chrome |
| pdf-probe | `pdf-probe\|invoice\|SKU#10\|dy` | -0.63 | 2.51 | 1 pdf-probe-pt | "SKU" \|dy\| 0.63 -> 2.51 pt vs Chrome |
| pdf-probe | `pdf-probe\|invoice\|AC-FL-68#1\|dy` | -0.63 | 2.51 | 1 pdf-probe-pt | "AC-FL-68" \|dy\| 0.63 -> 2.51 pt vs Chrome |
| pdf-probe | `pdf-probe\|invoice\|Fonte#1\|dy` | -0.26 | 2.88 | 1 pdf-probe-pt | "Fonte" \|dy\| 0.26 -> 2.88 pt vs Chrome |
| pdf-probe | `pdf-probe\|invoice\|chaveada#1\|dy` | -0.26 | 2.88 | 1 pdf-probe-pt | "chaveada" \|dy\| 0.26 -> 2.88 pt vs Chrome |
| pdf-probe | `pdf-probe\|invoice\|24V#1\|dy` | -0.26 | 2.88 | 1 pdf-probe-pt | "24V" \|dy\| 0.26 -> 2.88 pt vs Chrome |
| pdf-probe | `pdf-probe\|invoice\|10A#1\|dy` | -0.26 | 2.88 | 1 pdf-probe-pt | "10A" \|dy\| 0.26 -> 2.88 pt vs Chrome |
| pdf-probe | `pdf-probe\|invoice\|Desconto#1\|dy` | -0.87 | 2.13 | 1 pdf-probe-pt | "Desconto" \|dy\| 0.87 -> 2.13 pt vs Chrome |
| pdf-probe | `pdf-probe\|invoice\|-#1\|dy` | -0.87 | 2.13 | 1 pdf-probe-pt | "-" \|dy\| 0.87 -> 2.13 pt vs Chrome |
| pdf-probe | `pdf-probe\|invoice\|R$#70\|dy` | -0.87 | 2.13 | 1 pdf-probe-pt | "R$" \|dy\| 0.87 -> 2.13 pt vs Chrome |
| pdf-probe | `pdf-probe\|invoice\|1.250,00#1\|dy` | -0.87 | 2.13 | 1 pdf-probe-pt | "1.250,00" \|dy\| 0.87 -> 2.13 pt vs Chrome |
| pdf-probe | `pdf-probe\|invoice\|Imposto#1\|dy` | -0.87 | 2.13 | 1 pdf-probe-pt | "Imposto" \|dy\| 0.87 -> 2.13 pt vs Chrome |
| pdf-probe | `pdf-probe\|invoice\|(8%)#1\|dy` | -0.87 | 2.13 | 1 pdf-probe-pt | "(8%)" \|dy\| 0.87 -> 2.13 pt vs Chrome |
| pdf-probe | `pdf-probe\|invoice\|R$#71\|dy` | -0.87 | 2.13 | 1 pdf-probe-pt | "R$" \|dy\| 0.87 -> 2.13 pt vs Chrome |
| pdf-probe | `pdf-probe\|invoice\|3.757,40#1\|dy` | -0.87 | 2.13 | 1 pdf-probe-pt | "3.757,40" \|dy\| 0.87 -> 2.13 pt vs Chrome |
| pdf-probe | `pdf-probe\|notification\|Acme#1\|dy` | 1.52 | 4.52 | 1 pdf-probe-pt | "Acme" \|dy\| 1.52 -> 4.52 pt vs Chrome |
| pdf-probe | `pdf-probe\|notification\|Serviços#1\|dy` | 1.52 | 4.52 | 1 pdf-probe-pt | "Serviços" \|dy\| 1.52 -> 4.52 pt vs Chrome |
| pdf-probe | `pdf-probe\|notification\|Prediais#1\|dy` | 1.52 | 4.52 | 1 pdf-probe-pt | "Prediais" \|dy\| 1.52 -> 4.52 pt vs Chrome |
| pdf-probe | `pdf-probe\|notification\|Ltda.#1\|dy` | 1.52 | 4.52 | 1 pdf-probe-pt | "Ltda." \|dy\| 1.52 -> 4.52 pt vs Chrome |
| pdf-probe | `pdf-probe\|notification\|Avenida#1\|dy` | -0.87 | 2.13 | 1 pdf-probe-pt | "Avenida" \|dy\| 0.87 -> 2.13 pt vs Chrome |
| pdf-probe | `pdf-probe\|notification\|das#1\|dy` | -0.87 | 2.13 | 1 pdf-probe-pt | "das" \|dy\| 0.87 -> 2.13 pt vs Chrome |
| pdf-probe | `pdf-probe\|notification\|Laranjeiras,#1\|dy` | -0.87 | 2.13 | 1 pdf-probe-pt | "Laranjeiras," \|dy\| 0.87 -> 2.13 pt vs Chrome |
| pdf-probe | `pdf-probe\|notification\|1200,#1\|dy` | -0.87 | 2.13 | 1 pdf-probe-pt | "1200," \|dy\| 0.87 -> 2.13 pt vs Chrome |
| pdf-probe | `pdf-probe\|notification\|Sala#1\|dy` | -0.87 | 2.13 | 1 pdf-probe-pt | "Sala" \|dy\| 0.87 -> 2.13 pt vs Chrome |
| pdf-probe | `pdf-probe\|notification\|45,#1\|dy` | -0.87 | 2.13 | 1 pdf-probe-pt | "45," \|dy\| 0.87 -> 2.13 pt vs Chrome |
| pdf-probe | `pdf-probe\|notification\|Bairro#1\|dy` | -0.87 | 2.13 | 1 pdf-probe-pt | "Bairro" \|dy\| 0.87 -> 2.13 pt vs Chrome |
| pdf-probe | `pdf-probe\|notification\|Centro#1\|dy` | -0.87 | 2.13 | 1 pdf-probe-pt | "Centro" \|dy\| 0.87 -> 2.13 pt vs Chrome |
| pdf-probe | `pdf-probe\|notification\|CNPJ#1\|dy` | -0.87 | 2.13 | 1 pdf-probe-pt | "CNPJ" \|dy\| 0.87 -> 2.13 pt vs Chrome |
| pdf-probe | `pdf-probe\|notification\|12.345.678/0001-90#1\|dy` | -0.87 | 2.13 | 1 pdf-probe-pt | "12.345.678/0001-90" \|dy\| 0.87 -> 2.13 pt vs Chrome |
| pdf-probe | `pdf-probe\|notification\|·#1\|dy` | -0.87 | 2.13 | 1 pdf-probe-pt | "·" \|dy\| 0.87 -> 2.13 pt vs Chrome |
| pdf-probe | `pdf-probe\|notification\|cobranca@exemplo-acme.test#1\|dy` | -0.87 | 2.13 | 1 pdf-probe-pt | "cobranca@exemplo-acme.test" \|dy\| 0.87 -> 2.13 pt vs Chrome |
| pdf-probe | `pdf-probe\|notification\|·#2\|dy` | -0.87 | 2.13 | 1 pdf-probe-pt | "·" \|dy\| 0.87 -> 2.13 pt vs Chrome |
| pdf-probe | `pdf-probe\|notification\|(11)#1\|dy` | -0.87 | 2.13 | 1 pdf-probe-pt | "(11)" \|dy\| 0.87 -> 2.13 pt vs Chrome |
| pdf-probe | `pdf-probe\|notification\|4000-0000#1\|dy` | -0.87 | 2.13 | 1 pdf-probe-pt | "4000-0000" \|dy\| 0.87 -> 2.13 pt vs Chrome |
| pdf-probe | `pdf-probe\|notification\|Ref.:#1\|dy` | -0.87 | 2.13 | 1 pdf-probe-pt | "Ref.:" \|dy\| 0.87 -> 2.13 pt vs Chrome |
| pdf-probe | `pdf-probe\|notification\|NOT-2026-00187#1\|dy` | -0.87 | 2.13 | 1 pdf-probe-pt | "NOT-2026-00187" \|dy\| 0.87 -> 2.13 pt vs Chrome |
| pdf-probe | `pdf-probe\|notification\|Processo#1\|dy` | -0.87 | 2.13 | 1 pdf-probe-pt | "Processo" \|dy\| 0.87 -> 2.13 pt vs Chrome |
| pdf-probe | `pdf-probe\|notification\|nº#1\|dy` | -0.87 | 2.13 | 1 pdf-probe-pt | "nº" \|dy\| 0.87 -> 2.13 pt vs Chrome |
| pdf-probe | `pdf-probe\|notification\|PROC-2026-0432#1\|dy` | -0.87 | 2.13 | 1 pdf-probe-pt | "PROC-2026-0432" \|dy\| 0.87 -> 2.13 pt vs Chrome |
| pdf-probe | `pdf-probe\|notification\|São#1\|dy` | -0.67 | 2.33 | 1 pdf-probe-pt | "São" \|dy\| 0.67 -> 2.33 pt vs Chrome |
| pdf-probe | `pdf-probe\|notification\|Paulo,#1\|dy` | -0.67 | 2.33 | 1 pdf-probe-pt | "Paulo," \|dy\| 0.67 -> 2.33 pt vs Chrome |
| pdf-probe | `pdf-probe\|notification\|22/06/2026#1\|dy` | -0.67 | 2.33 | 1 pdf-probe-pt | "22/06/2026" \|dy\| 0.67 -> 2.33 pt vs Chrome |
| pdf-probe | `pdf-probe\|notification\|AO(À)#1\|dy` | -0.82 | 1.93 | 1 pdf-probe-pt | "AO(À)" \|dy\| 0.82 -> 1.93 pt vs Chrome |
| pdf-probe | `pdf-probe\|notification\|DESTINATÁRIO(A)#1\|dy` | -0.82 | 1.93 | 1 pdf-probe-pt | "DESTINATÁRIO(A)" \|dy\| 0.82 -> 1.93 pt vs Chrome |
| pdf-probe | `pdf-probe\|notification\|Comércio#1\|dy` | -0.26 | 2.49 | 1 pdf-probe-pt | "Comércio" \|dy\| 0.26 -> 2.49 pt vs Chrome |
| pdf-probe | `pdf-probe\|notification\|Faro#1\|dy` | -0.26 | 2.49 | 1 pdf-probe-pt | "Faro" \|dy\| 0.26 -> 2.49 pt vs Chrome |
| pdf-probe | `pdf-probe\|notification\|Azul#1\|dy` | -0.26 | 2.49 | 1 pdf-probe-pt | "Azul" \|dy\| 0.26 -> 2.49 pt vs Chrome |
| pdf-probe | `pdf-probe\|notification\|Ltda.#2\|dy` | -0.26 | 2.49 | 1 pdf-probe-pt | "Ltda." \|dy\| 0.26 -> 2.49 pt vs Chrome |
| pdf-probe | `pdf-probe\|notification\|ME#1\|dy` | -0.26 | 2.49 | 1 pdf-probe-pt | "ME" \|dy\| 0.26 -> 2.49 pt vs Chrome |
| pdf-probe | `pdf-probe\|notification\|CNPJ:#1\|dy` | -0.42 | 2.33 | 1 pdf-probe-pt | "CNPJ:" \|dy\| 0.42 -> 2.33 pt vs Chrome |
| pdf-probe | `pdf-probe\|notification\|98.765.432/0001-21#1\|dy` | -0.42 | 2.33 | 1 pdf-probe-pt | "98.765.432/0001-21" \|dy\| 0.42 -> 2.33 pt vs Chrome |
| pdf-probe | `pdf-probe\|notification\|Rua#1\|dy` | -0.42 | 2.33 | 1 pdf-probe-pt | "Rua" \|dy\| 0.42 -> 2.33 pt vs Chrome |
| pdf-probe | `pdf-probe\|notification\|das#2\|dy` | -0.42 | 2.33 | 1 pdf-probe-pt | "das" \|dy\| 0.42 -> 2.33 pt vs Chrome |
| pdf-probe | `pdf-probe\|notification\|Flores,#1\|dy` | -0.42 | 2.33 | 1 pdf-probe-pt | "Flores," \|dy\| 0.42 -> 2.33 pt vs Chrome |
| pdf-probe | `pdf-probe\|notification\|123,#1\|dy` | -0.42 | 2.33 | 1 pdf-probe-pt | "123," \|dy\| 0.42 -> 2.33 pt vs Chrome |
| pdf-probe | `pdf-probe\|notification\|Conjunto#1\|dy` | -0.42 | 2.33 | 1 pdf-probe-pt | "Conjunto" \|dy\| 0.42 -> 2.33 pt vs Chrome |
| pdf-probe | `pdf-probe\|notification\|7#1\|dy` | -0.42 | 2.33 | 1 pdf-probe-pt | "7" \|dy\| 0.42 -> 2.33 pt vs Chrome |
| pdf-probe | `pdf-probe\|notification\|Campinas#1\|dy` | -0.42 | 2.33 | 1 pdf-probe-pt | "Campinas" \|dy\| 0.42 -> 2.33 pt vs Chrome |
| pdf-probe | `pdf-probe\|notification\|—#1\|dy` | -0.42 | 2.33 | 1 pdf-probe-pt | "—" \|dy\| 0.42 -> 2.33 pt vs Chrome |
| pdf-probe | `pdf-probe\|notification\|SP,#1\|dy` | -0.42 | 2.33 | 1 pdf-probe-pt | "SP," \|dy\| 0.42 -> 2.33 pt vs Chrome |
| pdf-probe | `pdf-probe\|notification\|CEP#1\|dy` | -0.42 | 2.33 | 1 pdf-probe-pt | "CEP" \|dy\| 0.42 -> 2.33 pt vs Chrome |
| pdf-probe | `pdf-probe\|notification\|13010-000#1\|dy` | -0.42 | 2.33 | 1 pdf-probe-pt | "13010-000" \|dy\| 0.42 -> 2.33 pt vs Chrome |
| pdf-probe | `pdf-probe\|notification\|Permanecendo#1\|dy` | -0.98 | 7.02 | 1 pdf-probe-pt | "Permanecendo" \|dy\| 0.98 -> 7.02 pt vs Chrome |
| pdf-probe | `pdf-probe\|notification\|a#4\|dy` | -0.98 | 7.02 | 1 pdf-probe-pt | "a" \|dy\| 0.98 -> 7.02 pt vs Chrome |
| pdf-probe | `pdf-probe\|notification\|situação#1\|dy` | -0.98 | 7.02 | 1 pdf-probe-pt | "situação" \|dy\| 0.98 -> 7.02 pt vs Chrome |
| pdf-probe | `pdf-probe\|notification\|sem#1\|dy` | -0.98 | 7.02 | 1 pdf-probe-pt | "sem" \|dy\| 0.98 -> 7.02 pt vs Chrome |
| pdf-probe | `pdf-probe\|notification\|a#5\|dy` | -0.98 | 7.02 | 1 pdf-probe-pt | "a" \|dy\| 0.98 -> 7.02 pt vs Chrome |
| pdf-probe | `pdf-probe\|notification\|devida#1\|dy` | -0.98 | 7.02 | 1 pdf-probe-pt | "devida" \|dy\| 0.98 -> 7.02 pt vs Chrome |
| pdf-probe | `pdf-probe\|notification\|regularização#3\|dy` | -0.98 | 7.02 | 1 pdf-probe-pt | "regularização" \|dy\| 0.98 -> 7.02 pt vs Chrome |
| pdf-probe | `pdf-probe\|notification\|após#1\|dy` | -0.98 | 7.02 | 1 pdf-probe-pt | "após" \|dy\| 0.98 -> 7.02 pt vs Chrome |
| pdf-probe | `pdf-probe\|notification\|o#2\|dy` | -0.98 | 7.02 | 1 pdf-probe-pt | "o" \|dy\| 0.98 -> 7.02 pt vs Chrome |
| pdf-probe | `pdf-probe\|notification\|prazo#2\|dy` | -0.98 | 7.02 | 1 pdf-probe-pt | "prazo" \|dy\| 0.98 -> 7.02 pt vs Chrome |
| pdf-probe | `pdf-probe\|notification\|acima#1\|dy` | -0.98 | 7.02 | 1 pdf-probe-pt | "acima" \|dy\| 0.98 -> 7.02 pt vs Chrome |
| pdf-probe | `pdf-probe\|notification\|indicado,#1\|dy` | -0.98 | 7.02 | 1 pdf-probe-pt | "indicado," \|dy\| 0.98 -> 7.02 pt vs Chrome |
| pdf-probe | `pdf-probe\|notification\|informamos#1\|dy` | -0.98 | 7.02 | 1 pdf-probe-pt | "informamos" \|dy\| 0.98 -> 7.02 pt vs Chrome |
| pdf-probe | `pdf-probe\|notification\|que#1\|dy` | -0.98 | 7.02 | 1 pdf-probe-pt | "que" \|dy\| 0.98 -> 7.02 pt vs Chrome |
| pdf-probe | `pdf-probe\|notification\|serão#1\|dy` | -0.98 | 7.02 | 1 pdf-probe-pt | "serão" \|dy\| 0.98 -> 7.02 pt vs Chrome |
| pdf-probe | `pdf-probe\|notification\|adotadas#1\|dy` | -0.98 | 7.02 | 1 pdf-probe-pt | "adotadas" \|dy\| 0.98 -> 7.02 pt vs Chrome |
| pdf-probe | `pdf-probe\|notification\|as#2\|dy` | -0.98 | 7.02 | 1 pdf-probe-pt | "as" \|dy\| 0.98 -> 7.02 pt vs Chrome |
| pdf-probe | `pdf-probe\|notification\|providências#1\|dy` | -0.98 | 7.02 | 1 pdf-probe-pt | "providências" \|dy\| 0.98 -> 7.02 pt vs Chrome |
| pdf-probe | `pdf-probe\|notification\|cabíveis#1\|dy` | -0.98 | 7.02 | 1 pdf-probe-pt | "cabíveis" \|dy\| 0.98 -> 7.02 pt vs Chrome |
| pdf-probe | `pdf-probe\|notification\|previstas#1\|dy` | -0.98 | 7.02 | 1 pdf-probe-pt | "previstas" \|dy\| 0.98 -> 7.02 pt vs Chrome |
| pdf-probe | `pdf-probe\|notification\|em#5\|dy` | -0.98 | 7.02 | 1 pdf-probe-pt | "em" \|dy\| 0.98 -> 7.02 pt vs Chrome |
| pdf-probe | `pdf-probe\|notification\|contrato#2\|dy` | -0.98 | 7.02 | 1 pdf-probe-pt | "contrato" \|dy\| 0.98 -> 7.02 pt vs Chrome |
| pdf-probe | `pdf-probe\|notification\|e#2\|dy` | -0.98 | 7.02 | 1 pdf-probe-pt | "e" \|dy\| 0.98 -> 7.02 pt vs Chrome |
| pdf-probe | `pdf-probe\|notification\|na#2\|dy` | -0.98 | 7.02 | 1 pdf-probe-pt | "na" \|dy\| 0.98 -> 7.02 pt vs Chrome |
| pdf-probe | `pdf-probe\|notification\|legislação#1\|dy` | -0.98 | 7.02 | 1 pdf-probe-pt | "legislação" \|dy\| 0.98 -> 7.02 pt vs Chrome |
| pdf-probe | `pdf-probe\|notification\|aplicável,#1\|dy` | -0.98 | 7.02 | 1 pdf-probe-pt | "aplicável," \|dy\| 0.98 -> 7.02 pt vs Chrome |
| pdf-probe | `pdf-probe\|notification\|sem#2\|dy` | -0.98 | 7.02 | 1 pdf-probe-pt | "sem" \|dy\| 0.98 -> 7.02 pt vs Chrome |
| pdf-probe | `pdf-probe\|notification\|prejuízo#1\|dy` | -0.98 | 7.02 | 1 pdf-probe-pt | "prejuízo" \|dy\| 0.98 -> 7.02 pt vs Chrome |
| pdf-probe | `pdf-probe\|notification\|de#7\|dy` | -0.98 | 7.02 | 1 pdf-probe-pt | "de" \|dy\| 0.98 -> 7.02 pt vs Chrome |
| pdf-probe | `pdf-probe\|notification\|quaisquer#1\|dy` | -0.98 | 7.02 | 1 pdf-probe-pt | "quaisquer" \|dy\| 0.98 -> 7.02 pt vs Chrome |
| pdf-probe | `pdf-probe\|notification\|outras#1\|dy` | -0.98 | 7.02 | 1 pdf-probe-pt | "outras" \|dy\| 0.98 -> 7.02 pt vs Chrome |
| pdf-probe | `pdf-probe\|notification\|medidas.#1\|dy` | -0.98 | 7.02 | 1 pdf-probe-pt | "medidas." \|dy\| 0.98 -> 7.02 pt vs Chrome |
| pdf-probe | `pdf-probe\|notification\|Em#1\|dy` | -0.98 | 7.02 | 1 pdf-probe-pt | "Em" \|dy\| 0.98 -> 7.02 pt vs Chrome |
| pdf-probe | `pdf-probe\|notification\|caso#1\|dy` | -0.98 | 7.02 | 1 pdf-probe-pt | "caso" \|dy\| 0.98 -> 7.02 pt vs Chrome |
| pdf-probe | `pdf-probe\|notification\|de#8\|dy` | -0.98 | 7.02 | 1 pdf-probe-pt | "de" \|dy\| 0.98 -> 7.02 pt vs Chrome |
| pdf-probe | `pdf-probe\|notification\|pagamento#1\|dy` | -0.98 | 7.02 | 1 pdf-probe-pt | "pagamento" \|dy\| 0.98 -> 7.02 pt vs Chrome |
| pdf-probe | `pdf-probe\|notification\|já#1\|dy` | -0.98 | 7.02 | 1 pdf-probe-pt | "já" \|dy\| 0.98 -> 7.02 pt vs Chrome |
| pdf-probe | `pdf-probe\|notification\|efetuado,#1\|dy` | -0.98 | 7.02 | 1 pdf-probe-pt | "efetuado," \|dy\| 0.98 -> 7.02 pt vs Chrome |
| pdf-probe | `pdf-probe\|notification\|favor#1\|dy` | -0.98 | 7.02 | 1 pdf-probe-pt | "favor" \|dy\| 0.98 -> 7.02 pt vs Chrome |
| pdf-probe | `pdf-probe\|notification\|desconsiderar#1\|dy` | -0.98 | 7.02 | 1 pdf-probe-pt | "desconsiderar" \|dy\| 0.98 -> 7.02 pt vs Chrome |
| pdf-probe | `pdf-probe\|notification\|esta#1\|dy` | -0.98 | 7.02 | 1 pdf-probe-pt | "esta" \|dy\| 0.98 -> 7.02 pt vs Chrome |
| pdf-probe | `pdf-probe\|notification\|comunicação#1\|dy` | -0.98 | 7.02 | 1 pdf-probe-pt | "comunicação" \|dy\| 0.98 -> 7.02 pt vs Chrome |
| pdf-probe | `pdf-probe\|notification\|e#3\|dy` | -0.98 | 7.02 | 1 pdf-probe-pt | "e" \|dy\| 0.98 -> 7.02 pt vs Chrome |
| pdf-probe | `pdf-probe\|notification\|encaminhar#1\|dy` | -0.98 | 7.02 | 1 pdf-probe-pt | "encaminhar" \|dy\| 0.98 -> 7.02 pt vs Chrome |
| pdf-probe | `pdf-probe\|notification\|o#3\|dy` | -0.98 | 7.02 | 1 pdf-probe-pt | "o" \|dy\| 0.98 -> 7.02 pt vs Chrome |
| pdf-probe | `pdf-probe\|notification\|respectivo#1\|dy` | -0.98 | 7.02 | 1 pdf-probe-pt | "respectivo" \|dy\| 0.98 -> 7.02 pt vs Chrome |
| pdf-probe | `pdf-probe\|notification\|comprovante#1\|dy` | -0.98 | 7.02 | 1 pdf-probe-pt | "comprovante" \|dy\| 0.98 -> 7.02 pt vs Chrome |
| pdf-probe | `pdf-probe\|notification\|para#2\|dy` | -0.98 | 7.02 | 1 pdf-probe-pt | "para" \|dy\| 0.98 -> 7.02 pt vs Chrome |
| pdf-probe | `pdf-probe\|notification\|cobranca@exemplo-acme.test.#1\|dy` | -0.98 | 7.02 | 1 pdf-probe-pt | "cobranca@exemplo-acme.test." \|dy\| 0.98 -> 7.02 pt vs Chrome |
| pdf-probe | `pdf-probe\|notification\|Segue,#1\|dy` | -0.48 | 7.02 | 1 pdf-probe-pt | "Segue," \|dy\| 0.48 -> 7.02 pt vs Chrome |
| pdf-probe | `pdf-probe\|notification\|em#6\|dy` | -0.48 | 7.02 | 1 pdf-probe-pt | "em" \|dy\| 0.48 -> 7.02 pt vs Chrome |
| pdf-probe | `pdf-probe\|notification\|anexo,#1\|dy` | -0.48 | 7.02 | 1 pdf-probe-pt | "anexo," \|dy\| 0.48 -> 7.02 pt vs Chrome |
| pdf-probe | `pdf-probe\|notification\|demonstrativo#1\|dy` | -0.48 | 7.02 | 1 pdf-probe-pt | "demonstrativo" \|dy\| 0.48 -> 7.02 pt vs Chrome |
| pdf-probe | `pdf-probe\|notification\|detalhado#1\|dy` | -0.48 | 7.02 | 1 pdf-probe-pt | "detalhado" \|dy\| 0.48 -> 7.02 pt vs Chrome |
| pdf-probe | `pdf-probe\|notification\|do#2\|dy` | -0.48 | 7.02 | 1 pdf-probe-pt | "do" \|dy\| 0.48 -> 7.02 pt vs Chrome |
| pdf-probe | `pdf-probe\|notification\|débito#1\|dy` | -0.48 | 7.02 | 1 pdf-probe-pt | "débito" \|dy\| 0.48 -> 7.02 pt vs Chrome |
| pdf-probe | `pdf-probe\|notification\|para#3\|dy` | -0.48 | 7.02 | 1 pdf-probe-pt | "para" \|dy\| 0.48 -> 7.02 pt vs Chrome |
| pdf-probe | `pdf-probe\|notification\|sua#1\|dy` | -0.48 | 7.02 | 1 pdf-probe-pt | "sua" \|dy\| 0.48 -> 7.02 pt vs Chrome |
| pdf-probe | `pdf-probe\|notification\|conferência.#1\|dy` | -0.48 | 7.02 | 1 pdf-probe-pt | "conferência." \|dy\| 0.48 -> 7.02 pt vs Chrome |
| pdf-probe | `pdf-probe\|notification\|Sendo#1\|dy` | -0.73 | 7.02 | 1 pdf-probe-pt | "Sendo" \|dy\| 0.73 -> 7.02 pt vs Chrome |
| pdf-probe | `pdf-probe\|notification\|o#4\|dy` | -0.73 | 7.02 | 1 pdf-probe-pt | "o" \|dy\| 0.73 -> 7.02 pt vs Chrome |
| pdf-probe | `pdf-probe\|notification\|que#2\|dy` | -0.73 | 7.02 | 1 pdf-probe-pt | "que" \|dy\| 0.73 -> 7.02 pt vs Chrome |
| pdf-probe | `pdf-probe\|notification\|se#1\|dy` | -0.73 | 7.02 | 1 pdf-probe-pt | "se" \|dy\| 0.73 -> 7.02 pt vs Chrome |
| pdf-probe | `pdf-probe\|notification\|apresenta#1\|dy` | -0.73 | 7.02 | 1 pdf-probe-pt | "apresenta" \|dy\| 0.73 -> 7.02 pt vs Chrome |
| pdf-probe | `pdf-probe\|notification\|para#4\|dy` | -0.73 | 7.02 | 1 pdf-probe-pt | "para" \|dy\| 0.73 -> 7.02 pt vs Chrome |
| pdf-probe | `pdf-probe\|notification\|o#5\|dy` | -0.73 | 7.02 | 1 pdf-probe-pt | "o" \|dy\| 0.73 -> 7.02 pt vs Chrome |
| pdf-probe | `pdf-probe\|notification\|momento,#1\|dy` | -0.73 | 7.02 | 1 pdf-probe-pt | "momento," \|dy\| 0.73 -> 7.02 pt vs Chrome |
| pdf-probe | `pdf-probe\|notification\|colocamo-nos#1\|dy` | -0.73 | 7.02 | 1 pdf-probe-pt | "colocamo-nos" \|dy\| 0.73 -> 7.02 pt vs Chrome |
| pdf-probe | `pdf-probe\|notification\|à#2\|dy` | -0.73 | 7.02 | 1 pdf-probe-pt | "à" \|dy\| 0.73 -> 7.02 pt vs Chrome |
| pdf-probe | `pdf-probe\|notification\|disposição#1\|dy` | -0.73 | 7.02 | 1 pdf-probe-pt | "disposição" \|dy\| 0.73 -> 7.02 pt vs Chrome |
| pdf-probe | `pdf-probe\|notification\|para#5\|dy` | -0.73 | 7.02 | 1 pdf-probe-pt | "para" \|dy\| 0.73 -> 7.02 pt vs Chrome |
| pdf-probe | `pdf-probe\|notification\|os#2\|dy` | -0.73 | 7.02 | 1 pdf-probe-pt | "os" \|dy\| 0.73 -> 7.02 pt vs Chrome |
| pdf-probe | `pdf-probe\|notification\|esclarecimentos#1\|dy` | -0.73 | 7.02 | 1 pdf-probe-pt | "esclarecimentos" \|dy\| 0.73 -> 7.02 pt vs Chrome |
| pdf-probe | `pdf-probe\|notification\|que#3\|dy` | -0.73 | 7.02 | 1 pdf-probe-pt | "que" \|dy\| 0.73 -> 7.02 pt vs Chrome |
| pdf-probe | `pdf-probe\|notification\|se#2\|dy` | -0.73 | 7.02 | 1 pdf-probe-pt | "se" \|dy\| 0.73 -> 7.02 pt vs Chrome |
| pdf-probe | `pdf-probe\|notification\|fizerem#1\|dy` | -0.73 | 7.02 | 1 pdf-probe-pt | "fizerem" \|dy\| 0.73 -> 7.02 pt vs Chrome |
| pdf-probe | `pdf-probe\|notification\|necessários.#1\|dy` | -0.73 | 7.02 | 1 pdf-probe-pt | "necessários." \|dy\| 0.73 -> 7.02 pt vs Chrome |
| pdf-probe | `pdf-probe\|receipt\|Obrigado#1\|dy` | -0.35 | 2.65 | 1 pdf-probe-pt | "Obrigado" \|dy\| 0.35 -> 2.65 pt vs Chrome |
| pdf-probe | `pdf-probe\|receipt\|pela#1\|dy` | -0.35 | 2.65 | 1 pdf-probe-pt | "pela" \|dy\| 0.35 -> 2.65 pt vs Chrome |
| pdf-probe | `pdf-probe\|receipt\|sua#1\|dy` | -0.35 | 2.65 | 1 pdf-probe-pt | "sua" \|dy\| 0.35 -> 2.65 pt vs Chrome |
| pdf-probe | `pdf-probe\|receipt\|compra!#1\|dy` | -0.35 | 2.65 | 1 pdf-probe-pt | "compra!" \|dy\| 0.35 -> 2.65 pt vs Chrome |

### WPT / crashtest regressions (38)

| group | key | before | after | tolerance | detail |
|---|---|---|---|---|---|
| wpt css/CSS2/floats-clear | `wpt\|css/CSS2/floats-clear/floats-153.xht` | pass | fail |  | pass -> fail (clean pass lost) |
| wpt css/CSS2/floats | `wpt\|css/CSS2/floats/floats-placement-vertical-003.xht` | pass | fail |  | pass -> fail (clean pass lost) |
| wpt css/CSS2/floats | `wpt\|css/CSS2/floats/floats-placement-vertical-004.xht` | pass | fail |  | pass -> fail (clean pass lost) |
| wpt css/CSS2/floats | `wpt\|css/CSS2/floats/zero-width-floats.html` | pass | fail |  | pass -> fail (clean pass lost) |
| wpt css/CSS2/linebox | `wpt\|css/CSS2/linebox/baseline-block-with-overflow-001.html` | pass | fail |  | pass -> fail (clean pass lost) |
| wpt css/CSS2/linebox | `wpt\|css/CSS2/linebox/inline-formatting-context-001.xht` | pass | fail |  | pass -> fail (clean pass lost) |
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
| wpt css/css-break | `wpt\|css/css-break/flexbox/flex-fragmented-with-float-descendant-001.html` | pass | fail |  | pass -> fail (clean pass lost) |
| wpt css/css-page | `wpt\|css/css-page/monolithic-overflow-014-print.html` | pass | fail |  | pass -> fail (clean pass lost) |

## Accepted regressions (acceptedRegressions, with evidence)

none

## Reported, not gating (5)

| group | key | before | after | tolerance | detail |
|---|---|---|---|---|---|
| wpt css/CSS2/backgrounds | `wpt\|css/CSS2/backgrounds/background-position-002.xht` | pass | fail |  | pass[css-url-resource,ink-displaced-vs-chrome] -> fail (flagged pass: reported, not gated) |
| wpt css/CSS2/linebox | `wpt\|css/CSS2/linebox/line-height-072.xht` | pass | fail |  | pass[ink-displaced-vs-chrome] -> fail (flagged pass: reported, not gated) |
| wpt css/CSS2/linebox | `wpt\|css/CSS2/linebox/line-height-073.xht` | pass | fail |  | pass[ink-displaced-vs-chrome] -> fail (flagged pass: reported, not gated) |
| wpt css/css-page | `wpt\|css/css-page/page-name-001-print.html` | pass | fail |  | pass[ink-missing-vs-chrome] -> fail (flagged pass: reported, not gated) |
| wpt css/css-page | `wpt\|css/css-page/page-name-orthogonal-writing-002-print.html` | pass | fail |  | pass[ink-displaced-vs-chrome] -> fail (flagged pass: reported, not gated) |

## Improvements (1754)

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
| oracles:text EXT-2 | `danfe\|EXT-2\|oracles:text\|plain\|criterion#1` | FAIL | WARN |  | pdftotext fail (missing 15, extra 10); pdfminer.six warn (missing 0, extra 0); pymupdf fail (missing 5, extra 5) -> pdftotext warn (missing 0, extra 0); pdfminer.six warn (missing 0, extra 0); pymupdf pass (missing 0, extra 0) |
| oracles:text EXT-2 | `receipt\|EXT-2\|oracles:text\|plain\|criterion#1` | WARN | PASS |  | pdftotext warn (missing 0, extra 0); pdfminer.six pass (missing 0, extra 0); pymupdf pass (missing 0, extra 0) -> pdftotext pass (missing 0, extra 0); pdfminer.six pass (missing 0, extra 0); pymupdf pass (missing 0, extra 0) |
| corpus TXT-R | `text-stress-ptbr\|TXT-R1\|corpus\|\|criterion#1` | FAIL | PASS |  | worst TXT-S5 11.86 mm (tol 1) -> worst TXT-S3 0.38 mm (tol 1) |
| oracles:text EXT-2 | `text-stress-ptbr\|EXT-2\|oracles:text\|plain\|criterion#1` | FAIL | WARN |  | pdftotext fail (missing 82, extra 50); pdfminer.six warn (missing 0, extra 9); pymupdf warn (missing 0, extra 9) -> pdftotext warn (missing 0, extra 9); pdfminer.six warn (missing 0, extra 9); pymupdf warn (missing 0, extra 9) |
| corpus BOL-X | `boleto-febraban\|BOL-X1\|corpus\|\|criterion#1\|found` | 11 | 16 | 0 count | 11 -> 16 |
| corpus BOL-X | `boleto-febraban\|BOL-X2\|corpus\|\|criterion#1\|found.pdftotext` | 11 | 16 | 0 count | 11 -> 16 |
| corpus BOL-B | `boleto-febraban\|BOL-B2\|corpus\|\|criterion#1\|printedTextFound` | 0 | 1 | 0 count | 0 -> 1 |
| corpus BOL-R | `boleto-febraban\|BOL-R1\|corpus\|\|criterion#1\|worstMm` | 86.02 | 1.82 | 0.1 position-mm | 86.02 -> 1.82 |
| oracles:text EXT-2 | `boleto-febraban\|EXT-2\|oracles:text\|plain\|criterion#1\|missing.pdftotext` | 12 | 0 | 0 count | 12 -> 0 |
| oracles:text EXT-2 | `boleto-febraban\|EXT-2\|oracles:text\|plain\|criterion#1\|extra.pdftotext` | 8 | 0 | 0 count | 8 -> 0 |
| oracles:text EXT-2 | `boleto-febraban\|EXT-2\|oracles:text\|plain\|criterion#1\|statusRank.pdftotext` | 1 | 3 | 0 count | 1 -> 3 |
| oracles:text EXT-2 | `boleto-febraban\|EXT-2\|oracles:text\|plain\|criterion#1\|missing.pymupdf` | 12 | 0 | 0 count | 12 -> 0 |
| oracles:text EXT-2 | `boleto-febraban\|EXT-2\|oracles:text\|plain\|criterion#1\|extra.pymupdf` | 8 | 0 | 0 count | 8 -> 0 |
| oracles:text EXT-2 | `boleto-febraban\|EXT-2\|oracles:text\|plain\|criterion#1\|statusRank.pymupdf` | 1 | 3 | 0 count | 1 -> 3 |
| oracles:layout REF-W | `boleto-febraban\|REF-W\|oracles:layout\|plain\|criterion#1\|maxMm` | 120.78 | 2.31 | 0.1 position-mm | 120.78 -> 2.31 |
| oracles:layout REF-W | `boleto-febraban\|REF-W\|oracles:layout\|plain\|criterion#1\|p95Mm` | 83.01 | 1.95 | 0.1 position-mm | 83.01 -> 1.95 |
| corpus BOL-X | `boleto-febraban.px-grid\|BOL-X1\|corpus\|\|criterion#1\|found` | 11 | 16 | 0 count | 11 -> 16 |
| corpus BOL-X | `boleto-febraban.px-grid\|BOL-X2\|corpus\|\|criterion#1\|found.pdftotext` | 11 | 16 | 0 count | 11 -> 16 |
| corpus BOL-B | `boleto-febraban.px-grid\|BOL-B2\|corpus\|\|criterion#1\|printedTextFound` | 0 | 1 | 0 count | 0 -> 1 |
| corpus BOL-R | `boleto-febraban.px-grid\|BOL-R1\|corpus\|\|criterion#1\|worstMm` | 86.02 | 1.82 | 0.1 position-mm | 86.02 -> 1.82 |
| oracles:text EXT-2 | `boleto-febraban.px-grid\|EXT-2\|oracles:text\|plain\|criterion#1\|missing.pdftotext` | 12 | 0 | 0 count | 12 -> 0 |
| oracles:text EXT-2 | `boleto-febraban.px-grid\|EXT-2\|oracles:text\|plain\|criterion#1\|extra.pdftotext` | 8 | 0 | 0 count | 8 -> 0 |
| oracles:text EXT-2 | `boleto-febraban.px-grid\|EXT-2\|oracles:text\|plain\|criterion#1\|statusRank.pdftotext` | 1 | 3 | 0 count | 1 -> 3 |
| oracles:text EXT-2 | `boleto-febraban.px-grid\|EXT-2\|oracles:text\|plain\|criterion#1\|missing.pymupdf` | 12 | 0 | 0 count | 12 -> 0 |
| oracles:text EXT-2 | `boleto-febraban.px-grid\|EXT-2\|oracles:text\|plain\|criterion#1\|extra.pymupdf` | 8 | 0 | 0 count | 8 -> 0 |
| oracles:text EXT-2 | `boleto-febraban.px-grid\|EXT-2\|oracles:text\|plain\|criterion#1\|statusRank.pymupdf` | 1 | 3 | 0 count | 1 -> 3 |
| oracles:layout REF-W | `boleto-febraban.px-grid\|REF-W\|oracles:layout\|plain\|criterion#1\|maxMm` | 120.78 | 2.31 | 0.1 position-mm | 120.78 -> 2.31 |
| oracles:layout REF-W | `boleto-febraban.px-grid\|REF-W\|oracles:layout\|plain\|criterion#1\|p95Mm` | 83.01 | 1.95 | 0.1 position-mm | 83.01 -> 1.95 |
| oracles:layout REF-W | `boleto\|REF-W\|oracles:layout\|plain\|criterion#1\|maxMm` | 4.64 | 2.62 | 0.1 position-mm | 4.64 -> 2.62 |
| oracles:layout REF-W | `boleto\|REF-W\|oracles:layout\|plain\|criterion#1\|p95Mm` | 2.48 | 2.36 | 0.1 position-mm | 2.48 -> 2.36 |
| corpus DANFE-X | `danfe\|DANFE-X1\|corpus\|\|criterion#1\|found` | 22 | 26 | 0 count | 22 -> 26 |
| corpus DANFE-X | `danfe\|DANFE-X2\|corpus\|\|criterion#1\|found.pdftotext` | 22 | 26 | 0 count | 22 -> 26 |
| corpus DANFE-X | `danfe\|DANFE-X2\|corpus\|\|criterion#1\|found.pdfminer` | 25 | 26 | 0 count | 25 -> 26 |
| corpus DANFE-B | `danfe\|DANFE-B1\|corpus\|\|criterion#1\|decodes` | 0 | 1 | 0 count | 0 -> 1 |
| corpus DANFE-B | `danfe\|DANFE-B1\|corpus\|\|criterion#1\|validates` | 0 | 1 | 0 count | 0 -> 1 |
| corpus DANFE-B | `danfe\|DANFE-B5\|corpus\|\|criterion#1\|excess` | 2.6077 | 0 | 0.05 geometry-excess-mm | 2.6077 -> 0 |
| corpus DANFE-M | `danfe\|DANFE-M1\|corpus\|\|criterion#1\|excessB` | 24.724 | 24.173 | 0.05 geometry-excess-mm | 24.724 -> 24.173 |
| corpus DANFE-F | `danfe\|DANFE-F4c\|corpus\|\|criterion#1\|segments` | 2 | 3 | 0 count | 2 -> 3 |
| corpus DANFE-F | `danfe\|DANFE-F11\|corpus\|\|criterion#1\|glyphsAttributed` | 3472 | 3511 | 0 count | 3472 -> 3511 |
| oracles:text EXT-2 | `danfe\|EXT-2\|oracles:text\|plain\|criterion#1\|missing.pdftotext` | 15 | 0 | 0 count | 15 -> 0 |
| oracles:text EXT-2 | `danfe\|EXT-2\|oracles:text\|plain\|criterion#1\|extra.pdftotext` | 10 | 0 | 0 count | 10 -> 0 |
| oracles:text EXT-2 | `danfe\|EXT-2\|oracles:text\|plain\|criterion#1\|statusRank.pdftotext` | 1 | 2 | 0 count | 1 -> 2 |
| oracles:text EXT-2 | `danfe\|EXT-2\|oracles:text\|plain\|criterion#1\|missing.pymupdf` | 5 | 0 | 0 count | 5 -> 0 |
| oracles:text EXT-2 | `danfe\|EXT-2\|oracles:text\|plain\|criterion#1\|extra.pymupdf` | 5 | 0 | 0 count | 5 -> 0 |
| oracles:text EXT-2 | `danfe\|EXT-2\|oracles:text\|plain\|criterion#1\|statusRank.pymupdf` | 1 | 3 | 0 count | 1 -> 3 |
| oracles:layout REF-W | `danfe\|REF-W\|oracles:layout\|plain\|criterion#1\|maxMm` | 45.69 | 5.42 | 0.1 position-mm | 45.69 -> 5.42 |
| oracles:layout REF-W | `danfe\|REF-W\|oracles:layout\|plain\|criterion#1\|p95Mm` | 33.25 | 4.49 | 0.1 position-mm | 33.25 -> 4.49 |
| oracles:layout REF-W | `invoice\|REF-W\|oracles:layout\|plain\|criterion#1\|maxMm` | 3.91 | 2.53 | 0.1 position-mm | 3.91 -> 2.53 |
| oracles:layout REF-W | `invoice\|REF-W\|oracles:layout\|plain\|criterion#1\|p95Mm` | 3.78 | 2.51 | 0.1 position-mm | 3.78 -> 2.51 |
| oracles:text EXT-2 | `notification\|EXT-2\|oracles:text\|plain\|criterion#1\|statusRank.pdfminer.six` | 2 | 3 | 0 count | 2 -> 3 |
| oracles:text EXT-2 | `notification\|EXT-2\|oracles:text\|plain\|criterion#1\|statusRank.pymupdf` | 2 | 3 | 0 count | 2 -> 3 |
| oracles:layout REF-W | `notification\|REF-W\|oracles:layout\|plain\|criterion#1\|maxMm` | 8.54 | 1.81 | 0.1 position-mm | 8.54 -> 1.81 |
| oracles:layout REF-W | `notification\|REF-W\|oracles:layout\|plain\|criterion#1\|p95Mm` | 8.42 | 1.7 | 0.1 position-mm | 8.42 -> 1.7 |
| oracles:text EXT-2 | `receipt\|EXT-2\|oracles:text\|plain\|criterion#1\|statusRank.pdftotext` | 2 | 3 | 0 count | 2 -> 3 |
| oracles:layout REF-W | `receipt\|REF-W\|oracles:layout\|plain\|criterion#1\|maxMm` | 101.15 | 0.77 | 0.1 position-mm | 101.15 -> 0.77 |
| oracles:layout REF-W | `receipt\|REF-W\|oracles:layout\|plain\|criterion#1\|p95Mm` | 4.06 | 0.7 | 0.1 position-mm | 4.06 -> 0.7 |
| corpus TXT-R | `text-stress-ptbr\|TXT-R1\|corpus\|\|criterion#1\|worstMm` | 11.86 | 0.38 | 0.1 position-mm | 11.86 -> 0.38 |
| oracles:text EXT-2 | `text-stress-ptbr\|EXT-2\|oracles:text\|plain\|criterion#1\|missing.pdftotext` | 82 | 0 | 0 count | 82 -> 0 |
| oracles:text EXT-2 | `text-stress-ptbr\|EXT-2\|oracles:text\|plain\|criterion#1\|extra.pdftotext` | 50 | 9 | 0 count | 50 -> 9 |
| oracles:text EXT-2 | `text-stress-ptbr\|EXT-2\|oracles:text\|plain\|criterion#1\|statusRank.pdftotext` | 1 | 2 | 0 count | 1 -> 2 |
| oracles:layout REF-W | `text-stress-ptbr\|REF-W\|oracles:layout\|plain\|criterion#1\|maxMm` | 101.6 | 97.79 | 0.1 position-mm | 101.6 -> 97.79 |
| oracles:layout REF-W | `text-stress-ptbr\|REF-W\|oracles:layout\|plain\|criterion#1\|p95Mm` | 97.36 | 97.02 | 0.1 position-mm | 97.36 -> 97.02 |
| pdf-probe | `pdf-probe\|boleto\|99990.00001#1\|dy` | -4.52 | 1.11 | 1 pdf-probe-pt | "99990.00001" \|dy\| 4.52 -> 1.11 pt |
| pdf-probe | `pdf-probe\|boleto\|23456.700001#1\|dy` | -4.52 | 1.11 | 1 pdf-probe-pt | "23456.700001" \|dy\| 4.52 -> 1.11 pt |
| pdf-probe | `pdf-probe\|boleto\|00000.000420#1\|dy` | -4.52 | 1.11 | 1 pdf-probe-pt | "00000.000420" \|dy\| 4.52 -> 1.11 pt |
| pdf-probe | `pdf-probe\|boleto\|1#1\|dy` | -4.52 | 1.11 | 1 pdf-probe-pt | "1" \|dy\| 4.52 -> 1.11 pt |
| pdf-probe | `pdf-probe\|boleto\|99990000012345#1\|dy` | -4.52 | 1.11 | 1 pdf-probe-pt | "99990000012345" \|dy\| 4.52 -> 1.11 pt |
| pdf-probe | `pdf-probe\|boleto\|999-9#1\|dy` | -9.07 | 1.96 | 1 pdf-probe-pt | "999-9" \|dy\| 9.07 -> 1.96 pt |
| pdf-probe | `pdf-probe\|boleto\|BENEFICIÁRIO#1\|dy` | -3.91 | -0.75 | 1 pdf-probe-pt | "BENEFICIÁRIO" \|dy\| 3.91 -> 0.75 pt |
| pdf-probe | `pdf-probe\|boleto\|AGÊNCIA#1\|dy` | -3.91 | -0.75 | 1 pdf-probe-pt | "AGÊNCIA" \|dy\| 3.91 -> 0.75 pt |
| pdf-probe | `pdf-probe\|boleto\|/#1\|dy` | -3.91 | -0.75 | 1 pdf-probe-pt | "/" \|dy\| 3.91 -> 0.75 pt |
| pdf-probe | `pdf-probe\|boleto\|CÓDIGO#1\|dy` | -3.91 | -0.75 | 1 pdf-probe-pt | "CÓDIGO" \|dy\| 3.91 -> 0.75 pt |
| pdf-probe | `pdf-probe\|boleto\|DO#2\|dy` | -3.91 | -0.75 | 1 pdf-probe-pt | "DO" \|dy\| 3.91 -> 0.75 pt |
| pdf-probe | `pdf-probe\|boleto\|BENEFICIÁRIO#2\|dy` | -3.91 | -0.75 | 1 pdf-probe-pt | "BENEFICIÁRIO" \|dy\| 3.91 -> 0.75 pt |
| pdf-probe | `pdf-probe\|boleto\|Acme#1\|dy` | -3.46 | -0.3 | 1 pdf-probe-pt | "Acme" \|dy\| 3.46 -> 0.3 pt |
| pdf-probe | `pdf-probe\|boleto\|Widgets#1\|dy` | -3.46 | -0.3 | 1 pdf-probe-pt | "Widgets" \|dy\| 3.46 -> 0.3 pt |
| pdf-probe | `pdf-probe\|boleto\|Comércio#1\|dy` | -3.46 | -0.3 | 1 pdf-probe-pt | "Comércio" \|dy\| 3.46 -> 0.3 pt |
| pdf-probe | `pdf-probe\|boleto\|LTDA#1\|dy` | -3.46 | -0.3 | 1 pdf-probe-pt | "LTDA" \|dy\| 3.46 -> 0.3 pt |
| pdf-probe | `pdf-probe\|boleto\|0042#1\|dy` | -3.46 | -0.3 | 1 pdf-probe-pt | "0042" \|dy\| 3.46 -> 0.3 pt |
| pdf-probe | `pdf-probe\|boleto\|/#2\|dy` | -3.46 | -0.3 | 1 pdf-probe-pt | "/" \|dy\| 3.46 -> 0.3 pt |
| pdf-probe | `pdf-probe\|boleto\|00012345-6#1\|dy` | -3.46 | -0.3 | 1 pdf-probe-pt | "00012345-6" \|dy\| 3.46 -> 0.3 pt |
| pdf-probe | `pdf-probe\|boleto\|NOSSO#1\|dy` | -2.41 | 0.75 | 1 pdf-probe-pt | "NOSSO" \|dy\| 2.41 -> 0.75 pt |
| pdf-probe | `pdf-probe\|boleto\|NÚMERO#1\|dy` | -2.41 | 0.75 | 1 pdf-probe-pt | "NÚMERO" \|dy\| 2.41 -> 0.75 pt |
| pdf-probe | `pdf-probe\|boleto\|VENCIMENTO#1\|dy` | -2.41 | 0.75 | 1 pdf-probe-pt | "VENCIMENTO" \|dy\| 2.41 -> 0.75 pt |
| pdf-probe | `pdf-probe\|boleto\|VALOR#1\|dy` | -2.41 | 0.75 | 1 pdf-probe-pt | "VALOR" \|dy\| 2.41 -> 0.75 pt |
| pdf-probe | `pdf-probe\|boleto\|DO#3\|dy` | -2.41 | 0.75 | 1 pdf-probe-pt | "DO" \|dy\| 2.41 -> 0.75 pt |
| pdf-probe | `pdf-probe\|boleto\|DOCUMENTO#1\|dy` | -2.41 | 0.75 | 1 pdf-probe-pt | "DOCUMENTO" \|dy\| 2.41 -> 0.75 pt |
| pdf-probe | `pdf-probe\|boleto\|999-9#2\|dy` | -5.98 | 4.96 | 1 pdf-probe-pt | "999-9" \|dy\| 5.98 -> 4.96 pt |
| pdf-probe | `pdf-probe\|boleto\|1#4\|dx` | -12.27 | -0.11 | 1 pdf-probe-pt | "1" \|dx\| 12.27 -> 0.11 pt |
| pdf-probe | `pdf-probe\|boleto\|de#11\|dx` | -15.65 | -0.11 | 1 pdf-probe-pt | "de" \|dx\| 15.65 -> 0.11 pt |
| pdf-probe | `pdf-probe\|boleto\|1#5\|dx` | -20.59 | -0.11 | 1 pdf-probe-pt | "1" \|dx\| 20.59 -> 0.11 pt |
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
| … | 639 more in gate-report.json | | | | |

WPT/crashtest improvements: 995 (listed in gate-report.json).

## newly-measured (1)

| group | key | before | after | tolerance | detail |
|---|---|---|---|---|---|
| oracles:barcode DANFE-B1 | `danfe\|DANFE-B1\|oracles:barcode\|plain\|criterion#1` | NOT-RUN | PASS |  | now measured:  |

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

## changed (21)

| group | key | before | after | tolerance | detail |
|---|---|---|---|---|---|
| wpt css/CSS2/normal-flow | `wpt\|css/CSS2/normal-flow/inline-table-width-001a.xht` | pass-blank | fail |  | pass-blank -> fail |
| wpt css/CSS2/normal-flow | `wpt\|css/CSS2/normal-flow/inline-table-width-001b.xht` | pass-blank | fail |  | pass-blank -> fail |
| wpt css/CSS2/normal-flow | `wpt\|css/CSS2/normal-flow/inline-table-width-002a.xht` | pass-blank | fail |  | pass-blank -> fail |
| wpt css/CSS2/text | `wpt\|css/CSS2/text/text-transform-cap-002.xht` | pass-blank | fail |  | pass-blank -> fail |
| wpt css/css-break | `wpt\|css/css-break/overflowed-abs-pos-with-percentage-height-print.html` | pass-blank | fail |  | pass-blank -> fail |
| wpt css/css-page | `wpt\|css/css-page/layers-003-print.html` | fail | unsupported |  | fail -> unsupported |
| wpt css/css-page | `wpt\|css/css-page/layers-004-print.html` | fail | unsupported |  | fail -> unsupported |
| wpt css/css-page | `wpt\|css/css-page/page-box-011-print.html` | pass-blank | fail |  | pass-blank -> fail |
| wpt css/css-page | `wpt\|css/css-page/page-margin-007-print.html` | fail | unsupported |  | fail -> unsupported |
| wpt css/css-page | `wpt\|css/css-page/page-size-004-print.html` | fail | unsupported |  | fail -> unsupported |
| wpt css/css-page | `wpt\|css/css-page/page-size-005-print.html` | fail | unsupported |  | fail -> unsupported |
| wpt css/css-page | `wpt\|css/css-page/page-size-009-print.html` | fail | unsupported |  | fail -> unsupported |
| wpt css/css-page | `wpt\|css/css-page/page-size-015-print.tentative.html` | pass-blank | fail |  | pass-blank -> fail |
| wpt css/css-page | `wpt\|css/css-page/pseudo-first-margin-001-print.html` | fail | unsupported |  | fail -> unsupported |
| wpt css/css-page | `wpt\|css/css-page/pseudo-first-margin-002-print.html` | fail | unsupported |  | fail -> unsupported |
| wpt css/css-page | `wpt\|css/css-page/pseudo-first-margin-003-print.html` | fail | unsupported |  | fail -> unsupported |
| wpt css/css-page | `wpt\|css/css-page/pseudo-first-margin-004-print.html` | fail | unsupported |  | fail -> unsupported |
| wpt css/css-text | `wpt\|css/css-text/boundary-shaping/boundary-shaping-001.html` | pass-blank | fail |  | pass-blank -> fail |
| wpt css/css-text | `wpt\|css/css-text/boundary-shaping/boundary-shaping-003.html` | pass-blank | fail |  | pass-blank -> fail |
| wpt css/css-text | `wpt\|css/css-text/boundary-shaping/boundary-shaping-004.html` | pass-blank | fail |  | pass-blank -> fail |
| wpt css/css-text | `wpt\|css/css-text/boundary-shaping/boundary-shaping-005.html` | pass-blank | fail |  | pass-blank -> fail |

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
| css/CSS2/abspos | 0 | 2 | 0 | 2 |
| css/CSS2/backgrounds | 152 | 175 | 67 | 67 |
| css/CSS2/borders | 332 | 383 | 302 | 354 |
| css/CSS2/box | 4 | 4 | 0 | 0 |
| css/CSS2/box-display | 47 | 65 | 47 | 65 |
| css/CSS2/colors | 6 | 10 | 6 | 10 |
| css/CSS2/floats | 20 | 19 | 18 | 16 |
| css/CSS2/floats-clear | 25 | 38 | 22 | 33 |
| css/CSS2/fonts | 120 | 135 | 120 | 135 |
| css/CSS2/generated-content | 41 | 82 | 38 | 78 |
| css/CSS2/linebox | 45 | 126 | 33 | 124 |
| css/CSS2/lists | 67 | 67 | 40 | 40 |
| css/CSS2/margin-padding-clear | 409 | 525 | 396 | 508 |
| css/CSS2/normal-flow | 392 | 431 | 368 | 405 |
| css/CSS2/pagination | 19 | 33 | 17 | 31 |
| css/CSS2/positioning | 175 | 361 | 173 | 359 |
| css/CSS2/tables | 19 | 77 | 17 | 74 |
| css/CSS2/text | 223 | 247 | 215 | 238 |
| css/CSS2/visudet | 10 | 14 | 7 | 9 |
| css/CSS2/visufx | 1 | 2 | 1 | 2 |
| css/CSS2/visuren | 1 | 6 | 1 | 6 |
| css/css-break | 101 | 115 | 73 | 81 |
| css/css-page | 63 | 70 | 47 | 55 |
| css/css-tables | 36 | 47 | 27 | 38 |
| css/css-text | 421 | 630 | 178 | 377 |

## Per group

| group | classes |
|---|---|
| canaries | added 6 |
| corpus BOL-B | improvement 4 |
| corpus BOL-R | improvement 2 |
| corpus BOL-X | improvement 8 |
| corpus DANFE-B | improvement 5 |
| corpus DANFE-F | improvement 4 |
| corpus DANFE-L | regression 4 |
| corpus DANFE-M | improvement 1 |
| corpus DANFE-X | improvement 4 |
| corpus INV-R | regression 2 |
| corpus LET- | added 1 |
| corpus TXT-R | improvement 2 |
| oracles:barcode DANFE-B1 | newly-measured 1 |
| oracles:layout LET-1 | added 2 |
| oracles:layout LET-2 | added 2 |
| oracles:layout LET-3 | added 1 |
| oracles:layout REF-W | improvement 16 |
| oracles:layout TXT-B1 | added 1 |
| oracles:text EXT-2 | improvement 29 |
| pdf-probe | improvement 684, regression 480, not-comparable 5 |
| wpt crashtests | not-comparable 1 |
| wpt css/CSS2/abspos | improvement 2 |
| wpt css/CSS2/backgrounds | improvement 24, reported 1 |
| wpt css/CSS2/borders | improvement 52 |
| wpt css/CSS2/box-display | improvement 18 |
| wpt css/CSS2/colors | improvement 4 |
| wpt css/CSS2/floats | improvement 2, regression 3 |
| wpt css/CSS2/floats-clear | improvement 14, regression 1 |
| wpt css/CSS2/fonts | improvement 15 |
| wpt css/CSS2/generated-content | improvement 41 |
| wpt css/CSS2/linebox | improvement 112, regression 20, reported 2 |
| wpt css/CSS2/margin-padding-clear | improvement 116 |
| wpt css/CSS2/normal-flow | improvement 52, regression 12, changed 3 |
| wpt css/CSS2/pagination | improvement 14 |
| wpt css/CSS2/positioning | improvement 186 |
| wpt css/CSS2/tables | improvement 58 |
| wpt css/CSS2/text | improvement 24, changed 1 |
| wpt css/CSS2/visudet | improvement 5 |
| wpt css/CSS2/visufx | improvement 1 |
| wpt css/CSS2/visuren | improvement 5 |
| wpt css/css-break | improvement 15, regression 1, changed 1 |
| wpt css/css-page | changed 12, improvement 11, regression 1, reported 2 |
| wpt css/css-tables | improvement 11 |
| wpt css/css-text | changed 4, improvement 213 |

## Tolerances

| class | tolerance | label | rationale |
|---|---|---|---|
| position-mm | 0.1 mm | DESIGN TARGET | word/anchor position error vs a reference (REF-W max/p95, REF-R worst anchor, DANFE-L1, LET-1). 0.1 mm (0.28 pt, 0.38 CSS px) is 10x the 0.01 mm the values are reported with and below one CSS px (0.26 mm), the smallest step a px-snapping layout can move; the measurement is deterministic for one build and one reference (CONFIRMED: equal inputs gave equal values in the Phase A repeat run). |
| geometry-excess-mm | 0.05 mm | DESIGN TARGET | distance OUTSIDE a specification window (BOL-G*, DANFE-B*, DANFE-M1, TXT-A1). Inside the window the spec admits any value, so only the excess is ratcheted; 0.05 mm is about one 600 dpi raster pixel (0.042 mm), the measurement quantum of measure_bars.py / the page ink box. |
| font-excess-pt | 0.05 pt | SPEC-derived tolerance unit | font-size excess outside a window; 0.05 pt is the tolerance ACCEPTANCE.md already applies to every font-size criterion (BOL-T*, DANFE-F*). |
| count | 0 count | DESIGN TARGET | integer counts from deterministic tools (required strings found, extractor missing/extra tokens, segments/glyphs attributed, decoded symbols): any loss is a real change of the document. |
| page-delta | 0 pages | DESIGN TARGET | \|vellora pages - reference pages\|: a page break moving is never noise. |
| pdf-probe-pt | 1 pt | DESIGN TARGET | per-word \|dx\| / \|dy\| of vellora's PDF vs Chrome's PDF (pdftotext -bbox, same-page pairs). 1 pt (0.35 mm) is an order of magnitude below the Phase A regressions it must catch (invoice price column +9 pt, notification signature -14 pt) and above glyph-bbox rounding of pdftotext (0.01 pt) and sub-px snapping differences. |

