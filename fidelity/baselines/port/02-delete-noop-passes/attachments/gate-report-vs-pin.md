# Fidelity gate report

**Verdict: FAIL** (100 gating item(s)). Local macOS runs are INDICATIVE.

| field | value |
|---|---|
| date | 2026-10-21T10:41:14.722Z |
| command | `node fidelity/gate/run.mjs --baseline fidelity/baselines/pin --run fidelity/results/run-all/02-delete-noop-passes --out fidelity/results/run-all/02-delete-noop-passes/gate-vs-pin` |
| baseline | fidelity/baselines/pin (vellora-fidelity/baseline-pin/1/manifest) |
| run | fidelity/results/run-all/02-delete-noop-passes (vellora-fidelity/run-all/1) |
| os / cpu | darwin 27.0.0 arm64 (macOS 27.0.1) / Apple M5 Pro |
| node / rustc | v22.23.2 / rustc 1.96.0 (ac68faa20 2026-05-25) |
| chrome | Google Chrome 155.0.8059.85 |
| blitz | 0.3.0-beta.4 registry+https://github.com/rust-lang/crates.io-index |
| git | phaseb/02-delete-noop-passes 6e5cb8d67fc82032dd07a50e1b678a3719c1a030 (0 dirty) |

Counts: improvement 715, regression 100, newly-measured 1, added 13, reported 100, changed 10, not-comparable 10, gating 100, unchanged 7547, withinTolerance 0.

## Absolute failures of the run (gate, cannot be accepted)

none

## Regressions beyond tolerance (gate)

| group | key | before | after | tolerance | detail |
|---|---|---|---|---|---|
| corpus DANFE-F | `danfe\|DANFE-F4c\|corpus\|\|criterion#1` | PASS | FAIL |  | 3/3 segments; min 8pt "DOCUMENTO AUXILIAR DA NOTA FISCAL ELETRÔNICA" -> 2/3 segments; min 8pt "0 - ENTRADA"; missing "DOCUMENTO AUXILIAR DA NOTA FISCAL ELETRÔ" |
| corpus DANFE-F | `danfe\|DANFE-F11\|corpus\|\|criterion#1` | PASS | FAIL |  | 3511/3511 glyphs attributed -> 3472/3511 glyphs attributed; sample "DOCUMENTOAUXILIARDANOTAFISCALELETRÔNICA" |
| corpus BOL-X | `boleto-febraban\|BOL-X1\|corpus\|\|criterion#1\|found` | 13 | 11 | 0 count | 13 -> 11 (tolerance 0 count) |
| corpus BOL-X | `boleto-febraban\|BOL-X2\|corpus\|\|criterion#1\|found.pdftotext` | 13 | 11 | 0 count | 13 -> 11 (tolerance 0 count) |
| oracles:text EXT-2 | `boleto-febraban\|EXT-2\|oracles:text\|plain\|criterion#1\|missing.pdftotext` | 8 | 12 | 0 count | 8 -> 12 (tolerance 0 count) |
| oracles:text EXT-2 | `boleto-febraban\|EXT-2\|oracles:text\|plain\|criterion#1\|extra.pdftotext` | 2 | 8 | 0 count | 2 -> 8 (tolerance 0 count) |
| oracles:text EXT-2 | `boleto-febraban\|EXT-2\|oracles:text\|plain\|criterion#1\|missing.pymupdf` | 8 | 12 | 0 count | 8 -> 12 (tolerance 0 count) |
| oracles:text EXT-2 | `boleto-febraban\|EXT-2\|oracles:text\|plain\|criterion#1\|extra.pymupdf` | 2 | 8 | 0 count | 2 -> 8 (tolerance 0 count) |
| corpus BOL-X | `boleto-febraban.px-grid\|BOL-X1\|corpus\|\|criterion#1\|found` | 13 | 11 | 0 count | 13 -> 11 (tolerance 0 count) |
| corpus BOL-X | `boleto-febraban.px-grid\|BOL-X2\|corpus\|\|criterion#1\|found.pdftotext` | 13 | 11 | 0 count | 13 -> 11 (tolerance 0 count) |
| oracles:text EXT-2 | `boleto-febraban.px-grid\|EXT-2\|oracles:text\|plain\|criterion#1\|missing.pdftotext` | 8 | 12 | 0 count | 8 -> 12 (tolerance 0 count) |
| oracles:text EXT-2 | `boleto-febraban.px-grid\|EXT-2\|oracles:text\|plain\|criterion#1\|extra.pdftotext` | 2 | 8 | 0 count | 2 -> 8 (tolerance 0 count) |
| oracles:text EXT-2 | `boleto-febraban.px-grid\|EXT-2\|oracles:text\|plain\|criterion#1\|missing.pymupdf` | 8 | 12 | 0 count | 8 -> 12 (tolerance 0 count) |
| oracles:text EXT-2 | `boleto-febraban.px-grid\|EXT-2\|oracles:text\|plain\|criterion#1\|extra.pymupdf` | 2 | 8 | 0 count | 2 -> 8 (tolerance 0 count) |
| corpus DANFE-X | `danfe\|DANFE-X1\|corpus\|\|criterion#1\|found` | 24 | 22 | 0 count | 24 -> 22 (tolerance 0 count) |
| corpus DANFE-X | `danfe\|DANFE-X2\|corpus\|\|criterion#1\|found.pdftotext` | 24 | 22 | 0 count | 24 -> 22 (tolerance 0 count) |
| corpus DANFE-X | `danfe\|DANFE-X2\|corpus\|\|criterion#1\|found.pdfminer` | 26 | 25 | 0 count | 26 -> 25 (tolerance 0 count) |
| corpus DANFE-B | `danfe\|DANFE-B5\|corpus\|\|criterion#1\|excess` | 2.0573 | 2.6077 | 0.05 geometry-excess-mm | 2.0573 -> 2.6077 (tolerance 0.05 mm) |
| corpus DANFE-M | `danfe\|DANFE-M1\|corpus\|\|criterion#1\|excessB` | 8.552 | 25.232 | 0.05 geometry-excess-mm | 8.552 -> 25.232 (tolerance 0.05 mm) |
| corpus DANFE-F | `danfe\|DANFE-F4c\|corpus\|\|criterion#1\|segments` | 3 | 2 | 0 count | 3 -> 2 (tolerance 0 count) |
| corpus DANFE-F | `danfe\|DANFE-F11\|corpus\|\|criterion#1\|glyphsAttributed` | 3511 | 3472 | 0 count | 3511 -> 3472 (tolerance 0 count) |
| oracles:text EXT-2 | `danfe\|EXT-2\|oracles:text\|plain\|criterion#1\|missing.pdftotext` | 10 | 15 | 0 count | 10 -> 15 (tolerance 0 count) |
| oracles:text EXT-2 | `danfe\|EXT-2\|oracles:text\|plain\|criterion#1\|extra.pdftotext` | 5 | 10 | 0 count | 5 -> 10 (tolerance 0 count) |
| oracles:text EXT-2 | `danfe\|EXT-2\|oracles:text\|plain\|criterion#1\|missing.pymupdf` | 1 | 5 | 0 count | 1 -> 5 (tolerance 0 count) |
| oracles:text EXT-2 | `danfe\|EXT-2\|oracles:text\|plain\|criterion#1\|extra.pymupdf` | 1 | 5 | 0 count | 1 -> 5 (tolerance 0 count) |
| oracles:text EXT-2 | `invoice\|EXT-2\|oracles:text\|plain\|criterion#1\|statusRank.pdfminer.six` | 3 | 2 | 0 count | 3 -> 2 (tolerance 0 count) |
| oracles:layout REF-W | `invoice\|REF-W\|oracles:layout\|plain\|criterion#1\|maxMm` | 2.44 | 3.91 | 0.1 position-mm | 2.44 -> 3.91 (tolerance 0.1 mm) |
| oracles:layout REF-W | `invoice\|REF-W\|oracles:layout\|plain\|criterion#1\|p95Mm` | 1.78 | 3.78 | 0.1 position-mm | 1.78 -> 3.78 (tolerance 0.1 mm) |
| corpus INV-R | `oss-postmark-receipt\|INV-R1\|corpus\|\|criterion#1\|worstMm` | 5.5 | 9.2 | 0.1 position-mm | 5.5 -> 9.2 (tolerance 0.1 mm) |
| oracles:text EXT-2 | `oss-postmark-receipt\|EXT-2\|oracles:text\|plain\|criterion#1\|missing.pdftotext` | 35 | 38 | 0 count | 35 -> 38 (tolerance 0 count) |
| oracles:text EXT-2 | `oss-postmark-receipt\|EXT-2\|oracles:text\|plain\|criterion#1\|missing.pymupdf` | 37 | 40 | 0 count | 37 -> 40 (tolerance 0 count) |
| oracles:text EXT-2 | `text-stress-ptbr\|EXT-2\|oracles:text\|plain\|criterion#1\|missing.pdftotext` | 78 | 82 | 0 count | 78 -> 82 (tolerance 0 count) |
| oracles:text EXT-2 | `text-stress-ptbr\|EXT-2\|oracles:text\|plain\|criterion#1\|extra.pdftotext` | 48 | 50 | 0 count | 48 -> 50 (tolerance 0 count) |

### WPT / crashtest regressions (67)

| group | key | before | after | tolerance | detail |
|---|---|---|---|---|---|
| wpt css/CSS2/abspos | `wpt\|css/CSS2/abspos/between-float-and-text.html` | pass | fail |  | pass -> fail (clean pass lost) |
| wpt css/CSS2/abspos | `wpt\|css/CSS2/abspos/static-fixed-inside-abspos.html` | pass | fail |  | pass -> fail (clean pass lost) |
| wpt css/CSS2/abspos | `wpt\|css/CSS2/abspos/static-inside-inline-block.html` | pass | fail |  | pass -> fail (clean pass lost) |
| wpt css/CSS2/box-display | `wpt\|css/CSS2/box-display/containing-block-019.xht` | pass | fail |  | pass -> fail (clean pass lost) |
| wpt css/CSS2/box-display | `wpt\|css/CSS2/box-display/containing-block-020.xht` | pass | fail |  | pass -> fail (clean pass lost) |
| wpt css/CSS2/box-display | `wpt\|css/CSS2/box-display/containing-block-021.xht` | pass | fail |  | pass -> fail (clean pass lost) |
| wpt css/CSS2/box-display | `wpt\|css/CSS2/box-display/containing-block-022.xht` | pass | fail |  | pass -> fail (clean pass lost) |
| wpt css/CSS2/floats-clear | `wpt\|css/CSS2/floats-clear/clear-applies-to-009.xht` | pass | fail |  | pass -> fail (clean pass lost) |
| wpt css/CSS2/floats-clear | `wpt\|css/CSS2/floats-clear/clear-float-005.xht` | pass | fail |  | pass -> fail (clean pass lost) |
| wpt css/CSS2/floats-clear | `wpt\|css/CSS2/floats-clear/floats-142.xht` | pass | fail |  | pass -> fail (clean pass lost) |
| wpt css/CSS2/floats | `wpt\|css/CSS2/floats/float-in-inline-anonymous-block-with-overflow-hidden.html` | pass | fail |  | pass -> fail (clean pass lost) |
| wpt css/CSS2/floats | `wpt\|css/CSS2/floats/float-nowrap-2.html` | pass | fail |  | pass -> fail (clean pass lost) |
| wpt css/CSS2/floats | `wpt\|css/CSS2/floats/float-nowrap-8.html` | pass | fail |  | pass -> fail (clean pass lost) |
| wpt css/CSS2/floats | `wpt\|css/CSS2/floats/floats-placement-vertical-001a.xht` | pass | fail |  | pass -> fail (clean pass lost) |
| wpt css/CSS2/floats | `wpt\|css/CSS2/floats/zero-width-floats.html` | pass | fail |  | pass -> fail (clean pass lost) |
| wpt css/CSS2/generated-content | `wpt\|css/CSS2/generated-content/after-content-display-012.xht` | pass | fail |  | pass -> fail (clean pass lost) |
| wpt css/CSS2/generated-content | `wpt\|css/CSS2/generated-content/after-content-display-013.xht` | pass | fail |  | pass -> fail (clean pass lost) |
| wpt css/CSS2/generated-content | `wpt\|css/CSS2/generated-content/before-content-display-012.xht` | pass | fail |  | pass -> fail (clean pass lost) |
| wpt css/CSS2/generated-content | `wpt\|css/CSS2/generated-content/before-content-display-013.xht` | pass | fail |  | pass -> fail (clean pass lost) |
| wpt css/CSS2/linebox | `wpt\|css/CSS2/linebox/line-height-061.xht` | pass | fail |  | pass -> fail (clean pass lost) |
| wpt css/CSS2/linebox | `wpt\|css/CSS2/linebox/line-height-062.xht` | pass | fail |  | pass -> fail (clean pass lost) |
| wpt css/CSS2/margin-padding-clear | `wpt\|css/CSS2/margin-padding-clear/margin-collapse-115.xht` | pass | fail |  | pass -> fail (clean pass lost) |
| wpt css/CSS2/margin-padding-clear | `wpt\|css/CSS2/margin-padding-clear/margin-collapse-116.xht` | pass | fail |  | pass -> fail (clean pass lost) |
| wpt css/CSS2/normal-flow | `wpt\|css/CSS2/normal-flow/block-formatting-context-height-003.xht` | pass | fail |  | pass -> fail (clean pass lost) |
| wpt css/CSS2/normal-flow | `wpt\|css/CSS2/normal-flow/block-formatting-contexts-009.xht` | pass | fail |  | pass -> fail (clean pass lost) |
| wpt css/CSS2/normal-flow | `wpt\|css/CSS2/normal-flow/block-in-inline-float-between-001.xht` | pass | fail |  | pass -> fail (clean pass lost) |
| wpt css/CSS2/normal-flow | `wpt\|css/CSS2/normal-flow/block-non-replaced-width-004.xht` | pass | fail |  | pass -> fail (clean pass lost) |
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
| wpt css/CSS2/positioning | `wpt\|css/CSS2/positioning/absolute-non-replaced-max-001.html` | pass | fail |  | pass -> fail (clean pass lost) |
| wpt css/CSS2/positioning | `wpt\|css/CSS2/positioning/absolute-non-replaced-min-001.html` | pass | fail |  | pass -> fail (clean pass lost) |
| wpt css/CSS2/positioning | `wpt\|css/CSS2/positioning/absolute-non-replaced-min-max-001.html` | pass | fail |  | pass -> fail (clean pass lost) |
| wpt css/CSS2/positioning | `wpt\|css/CSS2/positioning/abspos-002.xht` | pass | fail |  | pass -> fail (clean pass lost) |
| wpt css/CSS2/positioning | `wpt\|css/CSS2/positioning/abspos-027.xht` | pass | fail |  | pass -> fail (clean pass lost) |
| wpt css/CSS2/positioning | `wpt\|css/CSS2/positioning/auto-position-rtl-child-viewport-scrollbar.html` | pass | fail |  | pass -> fail (clean pass lost) |
| wpt css/CSS2/positioning | `wpt\|css/CSS2/positioning/position-relative-005.xht` | pass | fail |  | pass -> fail (clean pass lost) |
| wpt css/CSS2/positioning | `wpt\|css/CSS2/positioning/position-relative-014.xht` | pass | fail |  | pass -> fail (clean pass lost) |
| wpt css/CSS2/positioning | `wpt\|css/CSS2/positioning/position-relative-019.xht` | pass | fail |  | pass -> fail (clean pass lost) |
| wpt css/CSS2/visuren | `wpt\|css/CSS2/visuren/float-inside-inline-between-blocks-1.html` | pass | fail |  | pass -> fail (clean pass lost) |
| wpt css/css-break | `wpt\|css/css-break/flexbox/flex-container-fragmentation-008.html` | pass | fail |  | pass -> fail (clean pass lost) |
| wpt css/css-break | `wpt\|css/css-break/flexbox/multi-line-column-flex-fragmentation-054.html` | pass | fail |  | pass -> fail (clean pass lost) |
| wpt css/css-break | `wpt\|css/css-break/flexbox/multi-line-column-flex-fragmentation-055.html` | pass | fail |  | pass -> fail (clean pass lost) |
| wpt css/css-break | `wpt\|css/css-break/flexbox/multi-line-column-flex-fragmentation-058.html` | pass | fail |  | pass -> fail (clean pass lost) |
| wpt css/css-break | `wpt\|css/css-break/flexbox/multi-line-row-flex-fragmentation-045.html` | pass | fail |  | pass -> fail (clean pass lost) |
| wpt css/css-break | `wpt\|css/css-break/out-of-flow-in-multicolumn-026.html` | pass | fail |  | pass -> fail (clean pass lost) |
| wpt css/css-break | `wpt\|css/css-break/out-of-flow-in-multicolumn-083.html` | pass | fail |  | pass -> fail (clean pass lost) |
| wpt css/css-break | `wpt\|css/css-break/ruby-003.html` | pass | fail |  | pass -> fail (clean pass lost) |
| wpt css/css-tables | `wpt\|css/css-tables/table-cell-baseline-static-position.html` | pass | fail |  | pass -> fail (clean pass lost) |
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

## Reported, not gating (100)

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
| wpt css/CSS2/floats | `wpt\|css/CSS2/floats/float-with-absolutely-positioned-child-with-static-inset.html` | pass | fail |  | pass[ink-displaced-vs-chrome] -> fail (flagged pass: reported, not gated) |
| wpt css/CSS2/margin-padding-clear | `wpt\|css/CSS2/margin-padding-clear/margin-collapse-012.xht` | pass | fail |  | pass[css-url-resource] -> fail (flagged pass: reported, not gated) |
| wpt css/CSS2/normal-flow | `wpt\|css/CSS2/normal-flow/height-applies-to-004.xht` | pass | fail |  | pass[ink-missing-vs-chrome] -> fail (flagged pass: reported, not gated) |
| wpt css/CSS2/normal-flow | `wpt\|css/CSS2/normal-flow/height-percentage-003.xht` | pass | fail |  | pass[ink-missing-vs-chrome] -> fail (flagged pass: reported, not gated) |
| wpt css/CSS2/positioning | `wpt\|css/CSS2/positioning/position-relative-nested-001.xht` | pass | fail |  | pass[css-url-resource] -> fail (flagged pass: reported, not gated) |
| wpt css/CSS2/visudet | `wpt\|css/CSS2/visudet/content-height-004.html` | pass | fail |  | pass[webfont-not-supplied,ink-missing-vs-chrome] -> fail (flagged pass: reported, not gated) |
| wpt css/CSS2/visudet | `wpt\|css/CSS2/visudet/line-height-205.html` | pass | fail |  | pass[webfont-not-supplied] -> fail (flagged pass: reported, not gated) |
| wpt css/css-break | `wpt\|css/css-break/abspos-in-opacity-000.html` | pass | fail |  | pass[ink-missing-vs-chrome] -> fail (flagged pass: reported, not gated) |
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
| … | 40 more in gate-report.json | | | | |

## Improvements (715)

| group | key | before | after | tolerance | detail |
|---|---|---|---|---|---|
| corpus DANFE-B | `danfe\|DANFE-B3\|corpus\|\|criterion#1` | FAIL | PASS |  | 39.1583 (in [8, 14.8]) -> 10.0753 (in [8, 14.8]) |
| corpus DANFE-L | `danfe\|DANFE-L1b\|corpus\|\|criterion#1` | FAIL | PASS |  | 6pt SWPJVR+LiberationSerif-Bold; pos Δ(0, 3.15) mm -> 6pt SWPJVR+LiberationSerif-Bold; pos Δ(0, 2.62) mm |
| corpus INV-I | `oss-sparksuite-invoice\|INV-I1\|corpus\|\|criterion#1` | FAIL | PASS |  | 0 (expected >= 1) -> 1 (expected >= 1) |
| corpus TXT-R | `text-stress-ptbr\|TXT-R1\|corpus\|\|criterion#1` | FAIL | PASS |  | worst TXT-S4 11.24 mm (tol 1) -> worst TXT-S1 0.94 mm (tol 1) |
| corpus BOL-R | `boleto-febraban\|BOL-R1\|corpus\|\|criterion#1\|worstMm` | 88.36 | 86.02 | 0.1 position-mm | 88.36 -> 86.02 |
| oracles:layout REF-W | `boleto-febraban\|REF-W\|oracles:layout\|plain\|criterion#1\|maxMm` | 122.27 | 86.19 | 0.1 position-mm | 122.27 -> 86.19 |
| oracles:layout REF-W | `boleto-febraban\|REF-W\|oracles:layout\|plain\|criterion#1\|p95Mm` | 83.01 | 36.73 | 0.1 position-mm | 83.01 -> 36.73 |
| corpus BOL-R | `boleto-febraban.px-grid\|BOL-R1\|corpus\|\|criterion#1\|worstMm` | 88.36 | 86.02 | 0.1 position-mm | 88.36 -> 86.02 |
| oracles:layout REF-W | `boleto-febraban.px-grid\|REF-W\|oracles:layout\|plain\|criterion#1\|maxMm` | 122.27 | 86.19 | 0.1 position-mm | 122.27 -> 86.19 |
| oracles:layout REF-W | `boleto-febraban.px-grid\|REF-W\|oracles:layout\|plain\|criterion#1\|p95Mm` | 83.01 | 36.73 | 0.1 position-mm | 83.01 -> 36.73 |
| oracles:layout REF-W | `boleto\|REF-W\|oracles:layout\|plain\|criterion#1\|maxMm` | 15.15 | 4.64 | 0.1 position-mm | 15.15 -> 4.64 |
| oracles:layout REF-W | `boleto\|REF-W\|oracles:layout\|plain\|criterion#1\|p95Mm` | 15.03 | 2.4 | 0.1 position-mm | 15.03 -> 2.4 |
| corpus DANFE-B | `danfe\|DANFE-B3\|corpus\|\|criterion#1\|excess` | 24.3583 | 0 | 0.05 geometry-excess-mm | 24.3583 -> 0 |
| corpus DANFE-L | `danfe\|DANFE-L1a\|corpus\|\|criterion#1\|posErrMm` | 1.56 | 1.03 | 0.1 position-mm | 1.56 -> 1.03 |
| corpus DANFE-L | `danfe\|DANFE-L1b\|corpus\|\|criterion#1\|posErrMm` | 3.15 | 2.62 | 0.1 position-mm | 3.15 -> 2.62 |
| corpus DANFE-L | `danfe\|DANFE-L1c\|corpus\|\|criterion#1\|posErrMm` | 4.71 | 4.18 | 0.1 position-mm | 4.71 -> 4.18 |
| corpus DANFE-L | `danfe\|DANFE-L1d\|corpus\|\|criterion#1\|posErrMm` | 5.96 | 5.43 | 0.1 position-mm | 5.96 -> 5.43 |
| oracles:layout REF-W | `danfe\|REF-W\|oracles:layout\|plain\|criterion#1\|maxMm` | 157.01 | 45.66 | 0.1 position-mm | 157.01 -> 45.66 |
| oracles:layout REF-W | `danfe\|REF-W\|oracles:layout\|plain\|criterion#1\|p95Mm` | 40.23 | 33.22 | 0.1 position-mm | 40.23 -> 33.22 |
| oracles:layout REF-W | `notification\|REF-W\|oracles:layout\|plain\|criterion#1\|maxMm` | 3.6 | 1.63 | 0.1 position-mm | 3.6 -> 1.63 |
| oracles:layout REF-W | `notification\|REF-W\|oracles:layout\|plain\|criterion#1\|p95Mm` | 3.48 | 1.07 | 0.1 position-mm | 3.48 -> 1.07 |
| corpus INV-I | `oss-sparksuite-invoice\|INV-I1\|corpus\|\|criterion#1\|shortfall` | 1 | 0 | 0 count | 1 -> 0 |
| corpus INV-R | `oss-sparksuite-invoice\|INV-R1\|corpus\|\|criterion#1\|worstMm` | 11.47 | 3.09 | 0.1 position-mm | 11.47 -> 3.09 |
| oracles:text EXT-2 | `receipt\|EXT-2\|oracles:text\|plain\|criterion#1\|statusRank.pdfminer.six` | 2 | 3 | 0 count | 2 -> 3 |
| oracles:layout REF-W | `receipt\|REF-W\|oracles:layout\|plain\|criterion#1\|maxMm` | 117.48 | 101.15 | 0.1 position-mm | 117.48 -> 101.15 |
| oracles:layout REF-W | `receipt\|REF-W\|oracles:layout\|plain\|criterion#1\|p95Mm` | 55.29 | 2.03 | 0.1 position-mm | 55.29 -> 2.03 |
| corpus TXT-R | `text-stress-ptbr\|TXT-R1\|corpus\|\|criterion#1\|worstMm` | 11.24 | 0.94 | 0.1 position-mm | 11.24 -> 0.94 |
| oracles:layout REF-W | `text-stress-ptbr\|REF-W\|oracles:layout\|plain\|criterion#1\|maxMm` | 112.6 | 101.6 | 0.1 position-mm | 112.6 -> 101.6 |
| oracles:layout REF-W | `text-stress-ptbr\|REF-W\|oracles:layout\|plain\|criterion#1\|p95Mm` | 108.17 | 97.36 | 0.1 position-mm | 108.17 -> 97.36 |

WPT/crashtest improvements: 686 (listed in gate-report.json).

## newly-measured (1)

| group | key | before | after | tolerance | detail |
|---|---|---|---|---|---|
| oracles:barcode DANFE-B1 | `danfe\|DANFE-B1\|oracles:barcode\|plain\|criterion#1` | NOT-RUN | FAIL |  | now measured: zxing-cpp: no Code 128 symbol decoded (expected 35261012345678000195550010000123451705243180); zbar: no Code 128 symbol decoded (expected 35261012345678000195550010000123451705243180) |

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

## changed (10)

| group | key | before | after | tolerance | detail |
|---|---|---|---|---|---|
| wpt css/CSS2/box-display | `wpt\|css/CSS2/box-display/root-box-003.xht` | error | pass-blank |  | error -> pass-blank |
| wpt css/CSS2/normal-flow | `wpt\|css/CSS2/normal-flow/inline-block-zorder-001.xht` | pass-blank | fail |  | pass-blank -> fail |
| wpt css/CSS2/normal-flow | `wpt\|css/CSS2/normal-flow/inline-block-zorder-002.xht` | pass-blank | fail |  | pass-blank -> fail |
| wpt css/CSS2/visudet | `wpt\|css/CSS2/visudet/replaced-elements-min-height-20.html` | unsupported | fail |  | unsupported -> fail |
| wpt css/CSS2/visudet | `wpt\|css/CSS2/visudet/replaced-elements-min-height-40.html` | unsupported | fail |  | unsupported -> fail |
| wpt css/css-break | `wpt\|css/css-break/overflowed-abs-pos-with-percentage-height-print.html` | pass-blank | fail |  | pass-blank -> fail |
| wpt css/css-text | `wpt\|css/css-text/boundary-shaping/boundary-shaping-002.html` | pass-blank | fail |  | pass-blank -> fail |
| wpt css/css-text | `wpt\|css/css-text/boundary-shaping/boundary-shaping-006.html` | pass-blank | fail |  | pass-blank -> fail |
| wpt css/css-text | `wpt\|css/css-text/boundary-shaping/boundary-shaping-007.html` | pass-blank | fail |  | pass-blank -> fail |
| wpt css/css-text | `wpt\|css/css-text/boundary-shaping/boundary-shaping-008.html` | pass-blank | fail |  | pass-blank -> fail |

## not-comparable (10)

| group | key | before | after | tolerance | detail |
|---|---|---|---|---|---|
| wpt crashtests | `wpt-crash` | absent | 0 panic/crash/timeout |  | baseline has no crashtest record; the run has 0 non-ok:  |
| pdf-probe | `pdf-probe\|boleto` | absent | 254 pairs |  | baseline has no pdf-probe for this fixture |
| pdf-probe | `pdf-probe\|boleto-febraban` | absent | 303 pairs |  | baseline has no pdf-probe for this fixture |
| pdf-probe | `pdf-probe\|danfe` | absent | 625 pairs |  | baseline has no pdf-probe for this fixture |
| pdf-probe | `pdf-probe\|invoice` | absent | 541 pairs |  | baseline has no pdf-probe for this fixture |
| pdf-probe | `pdf-probe\|notification` | absent | 244 pairs |  | baseline has no pdf-probe for this fixture |
| pdf-probe | `pdf-probe\|oss-postmark-receipt` | absent | 137 pairs |  | baseline has no pdf-probe for this fixture |
| pdf-probe | `pdf-probe\|oss-sparksuite-invoice` | absent | 46 pairs |  | baseline has no pdf-probe for this fixture |
| pdf-probe | `pdf-probe\|receipt` | absent | 151 pairs |  | baseline has no pdf-probe for this fixture |
| pdf-probe | `pdf-probe\|text-stress-ptbr` | absent | 1820 pairs |  | baseline has no pdf-probe for this fixture |

## WPT per directory (pass / clean pass)

| directory | pass before | pass after | clean before | clean after |
|---|---|---|---|---|
| css/CSS2/abspos | 3 | 0 | 3 | 0 |
| css/CSS2/backgrounds | 179 | 176 | 60 | 67 |
| css/CSS2/borders | 322 | 377 | 292 | 348 |
| css/CSS2/box | 4 | 4 | 0 | 0 |
| css/CSS2/box-display | 49 | 53 | 49 | 52 |
| css/CSS2/colors | 6 | 7 | 6 | 7 |
| css/CSS2/floats | 21 | 19 | 17 | 17 |
| css/CSS2/floats-clear | 28 | 30 | 24 | 25 |
| css/CSS2/fonts | 108 | 121 | 106 | 121 |
| css/CSS2/generated-content | 23 | 43 | 20 | 38 |
| css/CSS2/linebox | 15 | 29 | 14 | 27 |
| css/CSS2/lists | 67 | 67 | 39 | 40 |
| css/CSS2/margin-padding-clear | 404 | 513 | 391 | 498 |
| css/CSS2/normal-flow | 383 | 396 | 360 | 373 |
| css/CSS2/pagination | 19 | 33 | 17 | 31 |
| css/CSS2/positioning | 172 | 298 | 169 | 272 |
| css/CSS2/tables | 18 | 20 | 17 | 17 |
| css/CSS2/text | 170 | 223 | 161 | 215 |
| css/CSS2/visudet | 13 | 14 | 6 | 8 |
| css/CSS2/visufx | 1 | 1 | 1 | 1 |
| css/CSS2/visuren | 2 | 3 | 2 | 3 |
| css/css-break | 86 | 104 | 66 | 75 |
| css/css-page | 62 | 64 | 46 | 49 |
| css/css-tables | 31 | 38 | 23 | 29 |
| css/css-text | 392 | 443 | 99 | 193 |

## Per group

| group | classes |
|---|---|
| canaries | added 6 |
| corpus BOL-R | improvement 2 |
| corpus BOL-X | regression 4 |
| corpus DANFE-B | improvement 2, regression 1 |
| corpus DANFE-F | regression 4 |
| corpus DANFE-L | improvement 5 |
| corpus DANFE-M | regression 1 |
| corpus DANFE-X | regression 3 |
| corpus INV-I | improvement 2 |
| corpus INV-R | regression 1, improvement 1 |
| corpus LET- | added 1 |
| corpus TXT-R | improvement 2 |
| oracles:barcode DANFE-B1 | newly-measured 1 |
| oracles:layout LET-1 | added 2 |
| oracles:layout LET-2 | added 2 |
| oracles:layout LET-3 | added 1 |
| oracles:layout REF-W | improvement 14, regression 2 |
| oracles:layout TXT-B1 | added 1 |
| oracles:text EXT-2 | regression 17, improvement 1 |
| pdf-probe | not-comparable 9 |
| wpt crashtests | not-comparable 1 |
| wpt css/CSS2/abspos | regression 3 |
| wpt css/CSS2/backgrounds | improvement 33, reported 36 |
| wpt css/CSS2/borders | improvement 56 |
| wpt css/CSS2/box-display | improvement 8, regression 4, changed 1 |
| wpt css/CSS2/colors | improvement 1 |
| wpt css/CSS2/floats | regression 5, improvement 5, reported 1 |
| wpt css/CSS2/floats-clear | reported 1, regression 3, improvement 6 |
| wpt css/CSS2/fonts | improvement 15 |
| wpt css/CSS2/generated-content | improvement 24, regression 4 |
| wpt css/CSS2/linebox | improvement 16, regression 2 |
| wpt css/CSS2/lists | improvement 1 |
| wpt css/CSS2/margin-padding-clear | improvement 112, reported 1, regression 2 |
| wpt css/CSS2/normal-flow | regression 17, improvement 33, reported 2, changed 2 |
| wpt css/CSS2/pagination | improvement 14 |
| wpt css/CSS2/positioning | improvement 136, regression 9, reported 1 |
| wpt css/CSS2/tables | improvement 2 |
| wpt css/CSS2/text | improvement 54 |
| wpt css/CSS2/visudet | improvement 3, reported 2, changed 2 |
| wpt css/CSS2/visuren | improvement 2, regression 1 |
| wpt css/css-break | reported 1, improvement 27, regression 8, changed 1 |
| wpt css/css-page | improvement 3, reported 1 |
| wpt css/css-tables | improvement 8, regression 1 |
| wpt css/css-text | changed 4, regression 8, improvement 127, reported 54 |

## Tolerances

| class | tolerance | label | rationale |
|---|---|---|---|
| position-mm | 0.1 mm | DESIGN TARGET | word/anchor position error vs a reference (REF-W max/p95, REF-R worst anchor, DANFE-L1, LET-1). 0.1 mm (0.28 pt, 0.38 CSS px) is 10x the 0.01 mm the values are reported with and below one CSS px (0.26 mm), the smallest step a px-snapping layout can move; the measurement is deterministic for one build and one reference (CONFIRMED: equal inputs gave equal values in the Phase A repeat run). |
| geometry-excess-mm | 0.05 mm | DESIGN TARGET | distance OUTSIDE a specification window (BOL-G*, DANFE-B*, DANFE-M1, TXT-A1). Inside the window the spec admits any value, so only the excess is ratcheted; 0.05 mm is about one 600 dpi raster pixel (0.042 mm), the measurement quantum of measure_bars.py / the page ink box. |
| font-excess-pt | 0.05 pt | SPEC-derived tolerance unit | font-size excess outside a window; 0.05 pt is the tolerance ACCEPTANCE.md already applies to every font-size criterion (BOL-T*, DANFE-F*). |
| count | 0 count | DESIGN TARGET | integer counts from deterministic tools (required strings found, extractor missing/extra tokens, segments/glyphs attributed, decoded symbols): any loss is a real change of the document. |
| page-delta | 0 pages | DESIGN TARGET | \|vellora pages - reference pages\|: a page break moving is never noise. |
| pdf-probe-pt | 1 pt | DESIGN TARGET | per-word \|dx\| / \|dy\| of vellora's PDF vs Chrome's PDF (pdftotext -bbox, same-page pairs). 1 pt (0.35 mm) is an order of magnitude below the Phase A regressions it must catch (invoice price column +9 pt, notification signature -14 pt) and above glyph-bbox rounding of pdftotext (0.01 pt) and sub-px snapping differences. |

