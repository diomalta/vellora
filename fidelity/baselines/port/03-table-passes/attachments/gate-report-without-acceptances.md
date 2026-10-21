# Fidelity gate report

**Verdict: FAIL** (40 gating item(s)). Local macOS runs are INDICATIVE.

| field | value |
|---|---|
| date | 2026-10-21T11:56:07.339Z |
| command | `node fidelity/gate/run.mjs --baseline fidelity/baselines/port/02-delete-noop-passes --run fidelity/results/run-all/03-table-passes --out fidelity/results/run-all/03-table-passes/gate-without-acceptances` |
| baseline | fidelity/baselines/port/02-delete-noop-passes (vellora-fidelity/baseline/2) |
| run | fidelity/results/run-all/03-table-passes (vellora-fidelity/run-all/1) |
| os / cpu | darwin 27.0.0 arm64 (macOS 27.0.1) / Apple M5 Pro |
| node / rustc | v22.23.2 / rustc 1.96.0 (ac68faa20 2026-05-25) |
| chrome | Google Chrome 155.0.8059.85 |
| blitz | 0.3.0-beta.4 registry+https://github.com/rust-lang/crates.io-index |
| git | phaseb/03-table-passes 5ce90be792c5bd1bf3c9f71cffa25e29d24a37b6 (0 dirty) |

Counts: improvement 1529, regression 40, gating 40, unchanged 13910, withinTolerance 0.

## Absolute failures of the run (gate, cannot be accepted)

none

## Regressions beyond tolerance (gate)

| group | key | before | after | tolerance | detail |
|---|---|---|---|---|---|
| pdf-probe | `pdf-probe\|danfe\|1#1\|dx` | -32.79 | 58.46 | 1 pdf-probe-pt | "1" \|dx\| 32.79 -> 58.46 pt vs Chrome |
| pdf-probe | `pdf-probe\|danfe\|DA#3\|dx` | 0.36 | -505.14 | 1 pdf-probe-pt | "DA" \|dx\| 0.36 -> 505.14 pt vs Chrome |
| pdf-probe | `pdf-probe\|danfe\|DA#3\|dy` | -1.73 | 39.29 | 1 pdf-probe-pt | "DA" \|dy\| 1.73 -> 39.29 pt vs Chrome |
| pdf-probe | `pdf-probe\|danfe\|da#1\|dy` | -0.23 | -10.72 | 1 pdf-probe-pt | "da" \|dy\| 0.23 -> 10.72 pt vs Chrome |
| pdf-probe | `pdf-probe\|danfe\|da#2\|dx` | 32.71 | 501.92 | 1 pdf-probe-pt | "da" \|dx\| 32.71 -> 501.92 pt vs Chrome |
| pdf-probe | `pdf-probe\|danfe\|da#2\|dy` | 0.53 | -30 | 1 pdf-probe-pt | "da" \|dy\| 0.53 -> 30 pt vs Chrome |
| pdf-probe | `pdf-probe\|danfe\|INSCRIÇÃO#2\|dx` | -0.17 | 1.83 | 1 pdf-probe-pt | "INSCRIÇÃO" \|dx\| 0.17 -> 1.83 pt vs Chrome |
| pdf-probe | `pdf-probe\|danfe\|ESTADUAL#2\|dx` | -0.14 | 1.86 | 1 pdf-probe-pt | "ESTADUAL" \|dx\| 0.14 -> 1.86 pt vs Chrome |
| pdf-probe | `pdf-probe\|danfe\|DO#2\|dx` | -0.1 | 1.9 | 1 pdf-probe-pt | "DO" \|dx\| 0.1 -> 1.9 pt vs Chrome |
| pdf-probe | `pdf-probe\|danfe\|SUBST.#1\|dx` | -0.09 | 1.91 | 1 pdf-probe-pt | "SUBST." \|dx\| 0.09 -> 1.91 pt vs Chrome |
| pdf-probe | `pdf-probe\|danfe\|TRIB.#1\|dx` | -0.07 | 1.93 | 1 pdf-probe-pt | "TRIB." \|dx\| 0.07 -> 1.93 pt vs Chrome |
| pdf-probe | `pdf-probe\|danfe\|CNPJ#1\|dx` | -0.67 | 3.33 | 1 pdf-probe-pt | "CNPJ" \|dx\| 0.67 -> 3.33 pt vs Chrome |
| pdf-probe | `pdf-probe\|danfe\|12.345.678/0001-95#1\|dx` | -0.67 | 3.33 | 1 pdf-probe-pt | "12.345.678/0001-95" \|dx\| 0.67 -> 3.33 pt vs Chrome |
| pdf-probe | `pdf-probe\|danfe\|DATA#2\|dx` | -1.26 | 6.02 | 1 pdf-probe-pt | "DATA" \|dx\| 1.26 -> 6.02 pt vs Chrome |
| pdf-probe | `pdf-probe\|danfe\|DA#4\|dx` | -1.25 | 6.04 | 1 pdf-probe-pt | "DA" \|dx\| 1.25 -> 6.04 pt vs Chrome |
| pdf-probe | `pdf-probe\|danfe\|EMISSÃO#1\|dx` | -1.24 | 6.05 | 1 pdf-probe-pt | "EMISSÃO" \|dx\| 1.24 -> 6.05 pt vs Chrome |
| pdf-probe | `pdf-probe\|danfe\|15/10/2026#2\|dx` | -1.26 | 6.02 | 1 pdf-probe-pt | "15/10/2026" \|dx\| 1.26 -> 6.02 pt vs Chrome |
| pdf-probe | `pdf-probe\|danfe\|DATA#3\|dx` | -1.26 | 6.02 | 1 pdf-probe-pt | "DATA" \|dx\| 1.26 -> 6.02 pt vs Chrome |
| pdf-probe | `pdf-probe\|danfe\|DA#5\|dx` | -1.25 | 6.04 | 1 pdf-probe-pt | "DA" \|dx\| 1.25 -> 6.04 pt vs Chrome |
| pdf-probe | `pdf-probe\|danfe\|SAÍDA#2\|dx` | -1.24 | 6.05 | 1 pdf-probe-pt | "SAÍDA" \|dx\| 1.24 -> 6.05 pt vs Chrome |
| pdf-probe | `pdf-probe\|danfe\|15/10/2026#3\|dx` | -1.26 | 6.02 | 1 pdf-probe-pt | "15/10/2026" \|dx\| 1.26 -> 6.02 pt vs Chrome |
| pdf-probe | `pdf-probe\|danfe\|HORA#1\|dx` | -1.26 | 6.02 | 1 pdf-probe-pt | "HORA" \|dx\| 1.26 -> 6.02 pt vs Chrome |
| pdf-probe | `pdf-probe\|danfe\|DA#6\|dx` | -1.25 | 6.04 | 1 pdf-probe-pt | "DA" \|dx\| 1.25 -> 6.04 pt vs Chrome |
| pdf-probe | `pdf-probe\|danfe\|SAÍDA#3\|dx` | -1.24 | 6.05 | 1 pdf-probe-pt | "SAÍDA" \|dx\| 1.24 -> 6.05 pt vs Chrome |
| pdf-probe | `pdf-probe\|danfe\|14:00:00#1\|dx` | -1.26 | 6.02 | 1 pdf-probe-pt | "14:00:00" \|dx\| 1.26 -> 6.02 pt vs Chrome |
| pdf-probe | `pdf-probe\|danfe\|CNPJ/CPF#2\|dx` | -5.84 | 7.66 | 1 pdf-probe-pt | "CNPJ/CPF" \|dx\| 5.84 -> 7.66 pt vs Chrome |
| pdf-probe | `pdf-probe\|danfe\|44.555.666/0001-81#1\|dx` | -5.84 | 7.66 | 1 pdf-probe-pt | "44.555.666/0001-81" \|dx\| 5.84 -> 7.66 pt vs Chrome |
| pdf-probe | `pdf-probe\|danfe\|INSCRIÇÃO#4\|dx` | -5.84 | 7.66 | 1 pdf-probe-pt | "INSCRIÇÃO" \|dx\| 5.84 -> 7.66 pt vs Chrome |
| pdf-probe | `pdf-probe\|danfe\|ESTADUAL#4\|dx` | -5.81 | 7.69 | 1 pdf-probe-pt | "ESTADUAL" \|dx\| 5.81 -> 7.69 pt vs Chrome |
| pdf-probe | `pdf-probe\|danfe\|244.556.677.118#1\|dx` | -5.84 | 7.66 | 1 pdf-probe-pt | "244.556.677.118" \|dx\| 5.84 -> 7.66 pt vs Chrome |
| pdf-probe | `pdf-probe\|danfe\|000#12\|dy` | 4.84 | 16.09 | 1 pdf-probe-pt | "000" \|dy\| 4.84 -> 16.09 pt vs Chrome |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|débito#6\|dx` | -191.43 | -228.3 | 1 pdf-probe-pt | "débito" \|dx\| 191.43 -> 228.3 pt vs Chrome |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|crédito#3\|dx` | -169.3 | -206.18 | 1 pdf-probe-pt | "crédito" \|dx\| 169.3 -> 206.18 pt vs Chrome |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|débito#10\|dx` | -191.43 | -228.3 | 1 pdf-probe-pt | "débito" \|dx\| 191.43 -> 228.3 pt vs Chrome |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|débito#13\|dx` | -191.43 | -228.3 | 1 pdf-probe-pt | "débito" \|dx\| 191.43 -> 228.3 pt vs Chrome |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|crédito#5\|dx` | -169.3 | -206.18 | 1 pdf-probe-pt | "crédito" \|dx\| 169.3 -> 206.18 pt vs Chrome |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|crédito#6\|dx` | -169.3 | -206.18 | 1 pdf-probe-pt | "crédito" \|dx\| 169.3 -> 206.18 pt vs Chrome |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|débito#16\|dx` | -191.43 | -228.3 | 1 pdf-probe-pt | "débito" \|dx\| 191.43 -> 228.3 pt vs Chrome |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|Documento#6\|dx` | 92.89 | 181.14 | 1 pdf-probe-pt | "Documento" \|dx\| 92.89 -> 181.14 pt vs Chrome |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|Saldo#8\|dx` | 357.06 | 375.18 | 1 pdf-probe-pt | "Saldo" \|dx\| 357.06 -> 375.18 pt vs Chrome |

## Accepted regressions (acceptedRegressions, with evidence)

none

## Reported, not gating (0)

none

## Improvements (1529)

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
| oracles:barcode DANFE-B1 | `danfe\|DANFE-B1\|oracles:barcode\|plain\|criterion#1` | FAIL | PASS |  | zxing-cpp: no Code 128 symbol decoded (expected 35261012345678000195550010000123451705243180); zbar: no Code 128 symbol decoded (expected 35261012345678000195550010000123451705243180) ->  |
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
| oracles:layout REF-W | `boleto-febraban\|REF-W\|oracles:layout\|plain\|criterion#1\|maxMm` | 86.19 | 7.94 | 0.1 position-mm | 86.19 -> 7.94 |
| oracles:layout REF-W | `boleto-febraban\|REF-W\|oracles:layout\|plain\|criterion#1\|p95Mm` | 36.73 | 2.63 | 0.1 position-mm | 36.73 -> 2.63 |
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
| oracles:layout REF-W | `boleto-febraban.px-grid\|REF-W\|oracles:layout\|plain\|criterion#1\|maxMm` | 86.19 | 7.94 | 0.1 position-mm | 86.19 -> 7.94 |
| oracles:layout REF-W | `boleto-febraban.px-grid\|REF-W\|oracles:layout\|plain\|criterion#1\|p95Mm` | 36.73 | 2.63 | 0.1 position-mm | 36.73 -> 2.63 |
| corpus DANFE-X | `danfe\|DANFE-X1\|corpus\|\|criterion#1\|found` | 22 | 26 | 0 count | 22 -> 26 |
| corpus DANFE-X | `danfe\|DANFE-X2\|corpus\|\|criterion#1\|found.pdftotext` | 22 | 26 | 0 count | 22 -> 26 |
| corpus DANFE-X | `danfe\|DANFE-X2\|corpus\|\|criterion#1\|found.pdfminer` | 25 | 26 | 0 count | 25 -> 26 |
| corpus DANFE-B | `danfe\|DANFE-B1\|corpus\|\|criterion#1\|decodes` | 0 | 1 | 0 count | 0 -> 1 |
| corpus DANFE-B | `danfe\|DANFE-B1\|corpus\|\|criterion#1\|validates` | 0 | 1 | 0 count | 0 -> 1 |
| corpus DANFE-B | `danfe\|DANFE-B5\|corpus\|\|criterion#1\|excess` | 2.6077 | 0 | 0.05 geometry-excess-mm | 2.6077 -> 0 |
| corpus DANFE-F | `danfe\|DANFE-F4c\|corpus\|\|criterion#1\|segments` | 2 | 3 | 0 count | 2 -> 3 |
| corpus DANFE-F | `danfe\|DANFE-F11\|corpus\|\|criterion#1\|glyphsAttributed` | 3472 | 3511 | 0 count | 3472 -> 3511 |
| oracles:text EXT-2 | `danfe\|EXT-2\|oracles:text\|plain\|criterion#1\|missing.pdftotext` | 15 | 0 | 0 count | 15 -> 0 |
| oracles:text EXT-2 | `danfe\|EXT-2\|oracles:text\|plain\|criterion#1\|extra.pdftotext` | 10 | 0 | 0 count | 10 -> 0 |
| oracles:text EXT-2 | `danfe\|EXT-2\|oracles:text\|plain\|criterion#1\|statusRank.pdftotext` | 1 | 2 | 0 count | 1 -> 2 |
| oracles:text EXT-2 | `danfe\|EXT-2\|oracles:text\|plain\|criterion#1\|missing.pymupdf` | 5 | 0 | 0 count | 5 -> 0 |
| oracles:text EXT-2 | `danfe\|EXT-2\|oracles:text\|plain\|criterion#1\|extra.pymupdf` | 5 | 0 | 0 count | 5 -> 0 |
| oracles:text EXT-2 | `danfe\|EXT-2\|oracles:text\|plain\|criterion#1\|statusRank.pymupdf` | 1 | 3 | 0 count | 1 -> 3 |
| oracles:layout REF-W | `danfe\|REF-W\|oracles:layout\|plain\|criterion#1\|maxMm` | 45.66 | 4.71 | 0.1 position-mm | 45.66 -> 4.71 |
| oracles:layout REF-W | `danfe\|REF-W\|oracles:layout\|plain\|criterion#1\|p95Mm` | 33.22 | 3.43 | 0.1 position-mm | 33.22 -> 3.43 |
| oracles:layout REF-W | `invoice\|REF-W\|oracles:layout\|plain\|criterion#1\|maxMm` | 3.91 | 2.81 | 0.1 position-mm | 3.91 -> 2.81 |
| oracles:layout REF-W | `invoice\|REF-W\|oracles:layout\|plain\|criterion#1\|p95Mm` | 3.78 | 2.78 | 0.1 position-mm | 3.78 -> 2.78 |
| oracles:text EXT-2 | `text-stress-ptbr\|EXT-2\|oracles:text\|plain\|criterion#1\|missing.pdftotext` | 82 | 0 | 0 count | 82 -> 0 |
| oracles:text EXT-2 | `text-stress-ptbr\|EXT-2\|oracles:text\|plain\|criterion#1\|extra.pdftotext` | 50 | 9 | 0 count | 50 -> 9 |
| oracles:text EXT-2 | `text-stress-ptbr\|EXT-2\|oracles:text\|plain\|criterion#1\|statusRank.pdftotext` | 1 | 2 | 0 count | 1 -> 2 |
| oracles:layout REF-W | `text-stress-ptbr\|REF-W\|oracles:layout\|plain\|criterion#1\|maxMm` | 101.6 | 96.73 | 0.1 position-mm | 101.6 -> 96.73 |
| oracles:layout REF-W | `text-stress-ptbr\|REF-W\|oracles:layout\|plain\|criterion#1\|p95Mm` | 97.36 | 95.96 | 0.1 position-mm | 97.36 -> 95.96 |
| pdf-probe | `pdf-probe\|boleto-febraban\|104-0#1\|dx` | 114.8 | -0.7 | 1 pdf-probe-pt | "104-0" \|dx\| 114.8 -> 0.7 pt |
| pdf-probe | `pdf-probe\|boleto-febraban\|10492.46810#1\|dx` | 243.82 | -0.68 | 1 pdf-probe-pt | "10492.46810" \|dx\| 243.82 -> 0.68 pt |
| pdf-probe | `pdf-probe\|boleto-febraban\|31000.100045#1\|dx` | 243.89 | -0.61 | 1 pdf-probe-pt | "31000.100045" \|dx\| 243.89 -> 0.61 pt |
| pdf-probe | `pdf-probe\|boleto-febraban\|CPF/CNPJ#1\|dx` | 28.48 | 2.98 | 1 pdf-probe-pt | "CPF/CNPJ" \|dx\| 28.48 -> 2.98 pt |
| pdf-probe | `pdf-probe\|boleto-febraban\|do#2\|dx` | 28.48 | 2.98 | 1 pdf-probe-pt | "do" \|dx\| 28.48 -> 2.98 pt |
| pdf-probe | `pdf-probe\|boleto-febraban\|Beneficiário#2\|dx` | 28.48 | 2.98 | 1 pdf-probe-pt | "Beneficiário" \|dx\| 28.48 -> 2.98 pt |
| pdf-probe | `pdf-probe\|boleto-febraban\|11.222.333/0001-81#1\|dx` | 28.48 | 2.98 | 1 pdf-probe-pt | "11.222.333/0001-81" \|dx\| 28.48 -> 2.98 pt |
| pdf-probe | `pdf-probe\|boleto-febraban\|Agência#1\|dx` | 47.41 | 4.66 | 1 pdf-probe-pt | "Agência" \|dx\| 47.41 -> 4.66 pt |
| pdf-probe | `pdf-probe\|boleto-febraban\|/#1\|dx` | 47.41 | 4.66 | 1 pdf-probe-pt | "/" \|dx\| 47.41 -> 4.66 pt |
| pdf-probe | `pdf-probe\|boleto-febraban\|Código#1\|dx` | 47.41 | 4.66 | 1 pdf-probe-pt | "Código" \|dx\| 47.41 -> 4.66 pt |
| pdf-probe | `pdf-probe\|boleto-febraban\|do#3\|dx` | 47.41 | 4.66 | 1 pdf-probe-pt | "do" \|dx\| 47.41 -> 4.66 pt |
| pdf-probe | `pdf-probe\|boleto-febraban\|Beneficiário#3\|dx` | 47.41 | 4.66 | 1 pdf-probe-pt | "Beneficiário" \|dx\| 47.41 -> 4.66 pt |
| pdf-probe | `pdf-probe\|boleto-febraban\|1234#1\|dx` | 46.65 | 3.9 | 1 pdf-probe-pt | "1234" \|dx\| 46.65 -> 3.9 pt |
| pdf-probe | `pdf-probe\|boleto-febraban\|/#2\|dx` | 46.65 | 3.9 | 1 pdf-probe-pt | "/" \|dx\| 46.65 -> 3.9 pt |
| pdf-probe | `pdf-probe\|boleto-febraban\|Nr.#1\|dx` | 9.57 | 1.32 | 1 pdf-probe-pt | "Nr." \|dx\| 9.57 -> 1.32 pt |
| pdf-probe | `pdf-probe\|boleto-febraban\|do#6\|dx` | 9.57 | 1.32 | 1 pdf-probe-pt | "do" \|dx\| 9.57 -> 1.32 pt |
| pdf-probe | `pdf-probe\|boleto-febraban\|documento#2\|dx` | 9.57 | 1.32 | 1 pdf-probe-pt | "documento" \|dx\| 9.57 -> 1.32 pt |
| pdf-probe | `pdf-probe\|boleto-febraban\|Aceite#1\|dx` | 19.04 | 2.54 | 1 pdf-probe-pt | "Aceite" \|dx\| 19.04 -> 2.54 pt |
| pdf-probe | `pdf-probe\|boleto-febraban\|Data#2\|dx` | 28.48 | 2.98 | 1 pdf-probe-pt | "Data" \|dx\| 28.48 -> 2.98 pt |
| pdf-probe | `pdf-probe\|boleto-febraban\|do#7\|dx` | 28.48 | 2.98 | 1 pdf-probe-pt | "do" \|dx\| 28.48 -> 2.98 pt |
| pdf-probe | `pdf-probe\|boleto-febraban\|processamento#1\|dx` | 28.48 | 2.98 | 1 pdf-probe-pt | "processamento" \|dx\| 28.48 -> 2.98 pt |
| pdf-probe | `pdf-probe\|boleto-febraban\|NF-2026/00417#1\|dx` | 9.57 | 1.32 | 1 pdf-probe-pt | "NF-2026/00417" \|dx\| 9.57 -> 1.32 pt |
| pdf-probe | `pdf-probe\|boleto-febraban\|N#1\|dx` | 19.04 | 2.54 | 1 pdf-probe-pt | "N" \|dx\| 19.04 -> 2.54 pt |
| pdf-probe | `pdf-probe\|boleto-febraban\|15/10/2026#2\|dx` | 28.48 | 2.98 | 1 pdf-probe-pt | "15/10/2026" \|dx\| 28.48 -> 2.98 pt |
| pdf-probe | `pdf-probe\|boleto-febraban\|Nosso#1\|dx` | 47.41 | 4.66 | 1 pdf-probe-pt | "Nosso" \|dx\| 47.41 -> 4.66 pt |
| pdf-probe | `pdf-probe\|boleto-febraban\|Número#1\|dx` | 47.41 | 4.66 | 1 pdf-probe-pt | "Número" \|dx\| 47.41 -> 4.66 pt |
| pdf-probe | `pdf-probe\|boleto-febraban\|CPF/CNPJ#2\|dx` | 37.2 | 3.45 | 1 pdf-probe-pt | "CPF/CNPJ" \|dx\| 37.2 -> 3.45 pt |
| pdf-probe | `pdf-probe\|boleto-febraban\|do#8\|dx` | 37.2 | 3.45 | 1 pdf-probe-pt | "do" \|dx\| 37.2 -> 3.45 pt |
| pdf-probe | `pdf-probe\|boleto-febraban\|Pagador#3\|dx` | 37.2 | 3.45 | 1 pdf-probe-pt | "Pagador" \|dx\| 37.2 -> 3.45 pt |
| pdf-probe | `pdf-probe\|boleto-febraban\|123.456.789-09#1\|dx` | 37.2 | 3.45 | 1 pdf-probe-pt | "123.456.789-09" \|dx\| 37.2 -> 3.45 pt |
| pdf-probe | `pdf-probe\|boleto-febraban\|Espécie#1\|dx` | 9.57 | 1.32 | 1 pdf-probe-pt | "Espécie" \|dx\| 9.57 -> 1.32 pt |
| pdf-probe | `pdf-probe\|boleto-febraban\|Vencimento#1\|dx` | 19.04 | 2.54 | 1 pdf-probe-pt | "Vencimento" \|dx\| 19.04 -> 2.54 pt |
| pdf-probe | `pdf-probe\|boleto-febraban\|R$#1\|dx` | 9.57 | 1.32 | 1 pdf-probe-pt | "R$" \|dx\| 9.57 -> 1.32 pt |
| pdf-probe | `pdf-probe\|boleto-febraban\|30/11/2026#1\|dx` | 19.04 | 2.54 | 1 pdf-probe-pt | "30/11/2026" \|dx\| 19.04 -> 2.54 pt |
| pdf-probe | `pdf-probe\|boleto-febraban\|Valor#1\|dx` | 28.48 | 2.98 | 1 pdf-probe-pt | "Valor" \|dx\| 28.48 -> 2.98 pt |
| pdf-probe | `pdf-probe\|boleto-febraban\|do#9\|dx` | 28.48 | 2.98 | 1 pdf-probe-pt | "do" \|dx\| 28.48 -> 2.98 pt |
| pdf-probe | `pdf-probe\|boleto-febraban\|Documento#1\|dx` | 28.48 | 2.98 | 1 pdf-probe-pt | "Documento" \|dx\| 28.48 -> 2.98 pt |
| pdf-probe | `pdf-probe\|boleto-febraban\|Valor#2\|dx` | 47.41 | 4.66 | 1 pdf-probe-pt | "Valor" \|dx\| 47.41 -> 4.66 pt |
| pdf-probe | `pdf-probe\|boleto-febraban\|Cobrado#1\|dx` | 47.41 | 4.66 | 1 pdf-probe-pt | "Cobrado" \|dx\| 47.41 -> 4.66 pt |
| pdf-probe | `pdf-probe\|boleto-febraban\|Demonstrativo#1\|dx` | 104.07 | -0.18 | 1 pdf-probe-pt | "Demonstrativo" \|dx\| 104.07 -> 0.18 pt |
| pdf-probe | `pdf-probe\|boleto-febraban\|Valor#3\|dx` | -75.45 | 0.3 | 1 pdf-probe-pt | "Valor" \|dx\| 75.45 -> 0.3 pt |
| pdf-probe | `pdf-probe\|boleto-febraban\|(R$)#1\|dx` | -75.45 | 0.3 | 1 pdf-probe-pt | "(R$)" \|dx\| 75.45 -> 0.3 pt |
| pdf-probe | `pdf-probe\|boleto-febraban\|Revisão#1\|dx` | 104.07 | -0.18 | 1 pdf-probe-pt | "Revisão" \|dx\| 104.07 -> 0.18 pt |
| pdf-probe | `pdf-probe\|boleto-febraban\|programada#1\|dx` | 104.1 | -0.15 | 1 pdf-probe-pt | "programada" \|dx\| 104.1 -> 0.15 pt |
| pdf-probe | `pdf-probe\|boleto-febraban\|—#4\|dx` | 104.15 | -0.1 | 1 pdf-probe-pt | "—" \|dx\| 104.15 -> 0.1 pt |
| pdf-probe | `pdf-probe\|boleto-febraban\|mão#1\|dx` | 104.16 | -0.09 | 1 pdf-probe-pt | "mão" \|dx\| 104.16 -> 0.09 pt |
| pdf-probe | `pdf-probe\|boleto-febraban\|de#2\|dx` | 104.18 | -0.07 | 1 pdf-probe-pt | "de" \|dx\| 104.18 -> 0.07 pt |
| pdf-probe | `pdf-probe\|boleto-febraban\|obra#1\|dx` | 104.2 | -0.05 | 1 pdf-probe-pt | "obra" \|dx\| 104.2 -> 0.05 pt |
| pdf-probe | `pdf-probe\|boleto-febraban\|980,00#1\|dx` | -75.48 | 0.27 | 1 pdf-probe-pt | "980,00" \|dx\| 75.48 -> 0.27 pt |
| pdf-probe | `pdf-probe\|boleto-febraban\|Peças#1\|dx` | 104.07 | -0.18 | 1 pdf-probe-pt | "Peças" \|dx\| 104.07 -> 0.18 pt |
| pdf-probe | `pdf-probe\|boleto-febraban\|de#3\|dx` | 104.1 | -0.15 | 1 pdf-probe-pt | "de" \|dx\| 104.1 -> 0.15 pt |
| pdf-probe | `pdf-probe\|boleto-febraban\|reposição#1\|dx` | 104.11 | -0.14 | 1 pdf-probe-pt | "reposição" \|dx\| 104.11 -> 0.14 pt |
| pdf-probe | `pdf-probe\|boleto-febraban\|(filtros,#1\|dx` | 104.15 | -0.1 | 1 pdf-probe-pt | "(filtros," \|dx\| 104.15 -> 0.1 pt |
| pdf-probe | `pdf-probe\|boleto-febraban\|óleo#1\|dx` | 104.18 | -0.07 | 1 pdf-probe-pt | "óleo" \|dx\| 104.18 -> 0.07 pt |
| pdf-probe | `pdf-probe\|boleto-febraban\|sintético)#1\|dx` | 104.2 | -0.05 | 1 pdf-probe-pt | "sintético)" \|dx\| 104.2 -> 0.05 pt |
| pdf-probe | `pdf-probe\|boleto-febraban\|712,50#1\|dx` | -75.48 | 0.27 | 1 pdf-probe-pt | "712,50" \|dx\| 75.48 -> 0.27 pt |
| pdf-probe | `pdf-probe\|boleto-febraban\|Alinhamento#1\|dx` | 104.07 | -0.18 | 1 pdf-probe-pt | "Alinhamento" \|dx\| 104.07 -> 0.18 pt |
| … | 1408 more in gate-report.json | | | | |

WPT/crashtest improvements: 1 (listed in gate-report.json).

## WPT per directory (pass / clean pass)

| directory | pass before | pass after | clean before | clean after |
|---|---|---|---|---|
| css/CSS2/backgrounds | 176 | 176 | 67 | 67 |
| css/CSS2/borders | 377 | 377 | 348 | 348 |
| css/CSS2/box | 4 | 4 | 0 | 0 |
| css/CSS2/box-display | 53 | 53 | 52 | 52 |
| css/CSS2/colors | 7 | 7 | 7 | 7 |
| css/CSS2/floats | 19 | 19 | 17 | 17 |
| css/CSS2/floats-clear | 30 | 30 | 25 | 25 |
| css/CSS2/fonts | 121 | 121 | 121 | 121 |
| css/CSS2/generated-content | 43 | 43 | 38 | 38 |
| css/CSS2/linebox | 29 | 29 | 27 | 27 |
| css/CSS2/lists | 67 | 67 | 40 | 40 |
| css/CSS2/margin-padding-clear | 513 | 513 | 498 | 498 |
| css/CSS2/normal-flow | 396 | 396 | 373 | 373 |
| css/CSS2/pagination | 33 | 33 | 31 | 31 |
| css/CSS2/positioning | 298 | 298 | 272 | 272 |
| css/CSS2/tables | 20 | 21 | 17 | 18 |
| css/CSS2/text | 223 | 223 | 215 | 215 |
| css/CSS2/visudet | 14 | 14 | 8 | 8 |
| css/CSS2/visufx | 1 | 1 | 1 | 1 |
| css/CSS2/visuren | 3 | 3 | 3 | 3 |
| css/css-break | 104 | 104 | 75 | 75 |
| css/css-page | 64 | 64 | 49 | 49 |
| css/css-tables | 38 | 38 | 29 | 29 |
| css/css-text | 443 | 443 | 193 | 193 |

## Per group

| group | classes |
|---|---|
| corpus BOL-B | improvement 4 |
| corpus BOL-R | improvement 2 |
| corpus BOL-X | improvement 8 |
| corpus DANFE-B | improvement 5 |
| corpus DANFE-F | improvement 4 |
| corpus DANFE-X | improvement 4 |
| oracles:barcode DANFE-B1 | improvement 1 |
| oracles:layout REF-W | improvement 10 |
| oracles:text EXT-2 | improvement 25 |
| pdf-probe | improvement 1465, regression 40 |
| wpt css/CSS2/tables | improvement 1 |

## Tolerances

| class | tolerance | label | rationale |
|---|---|---|---|
| position-mm | 0.1 mm | DESIGN TARGET | word/anchor position error vs a reference (REF-W max/p95, REF-R worst anchor, DANFE-L1, LET-1). 0.1 mm (0.28 pt, 0.38 CSS px) is 10x the 0.01 mm the values are reported with and below one CSS px (0.26 mm), the smallest step a px-snapping layout can move; the measurement is deterministic for one build and one reference (CONFIRMED: equal inputs gave equal values in the Phase A repeat run). |
| geometry-excess-mm | 0.05 mm | DESIGN TARGET | distance OUTSIDE a specification window (BOL-G*, DANFE-B*, DANFE-M1, TXT-A1). Inside the window the spec admits any value, so only the excess is ratcheted; 0.05 mm is about one 600 dpi raster pixel (0.042 mm), the measurement quantum of measure_bars.py / the page ink box. |
| font-excess-pt | 0.05 pt | SPEC-derived tolerance unit | font-size excess outside a window; 0.05 pt is the tolerance ACCEPTANCE.md already applies to every font-size criterion (BOL-T*, DANFE-F*). |
| count | 0 count | DESIGN TARGET | integer counts from deterministic tools (required strings found, extractor missing/extra tokens, segments/glyphs attributed, decoded symbols): any loss is a real change of the document. |
| page-delta | 0 pages | DESIGN TARGET | \|vellora pages - reference pages\|: a page break moving is never noise. |
| pdf-probe-pt | 1 pt | DESIGN TARGET | per-word \|dx\| / \|dy\| of vellora's PDF vs Chrome's PDF (pdftotext -bbox, same-page pairs). 1 pt (0.35 mm) is an order of magnitude below the Phase A regressions it must catch (invoice price column +9 pt, notification signature -14 pt) and above glyph-bbox rounding of pdftotext (0.01 pt) and sub-px snapping differences. |

