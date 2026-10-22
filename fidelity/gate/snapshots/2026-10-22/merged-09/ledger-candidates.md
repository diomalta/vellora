# Ledger candidates (fidelity/gate/ledger-candidates.mjs)

Command: `node fidelity/gate/ledger-candidates.mjs --report <scratch>/09-vs-08-head-00-start/gate-report.json --layout-from ~/.cache/vellora-fidelity/run-all-09-review-fixes-20261021T205223Z --head-wpt ~/.cache/vellora-fidelity/run-all-s1c-00-start-20261021T074902Z/wpt/results.json --pin-wpt ~/.cache/vellora-fidelity/run-all-pin-20261021T054154Z/wpt/results.json --raw-wpt ~/.cache/vellora-fidelity/wpt-raw-10base-98368b3-20261022/results.json --out <scratch>/candidates`; date 2026-10-22T23:36:27.155Z. Candidates, not verdicts: the gate's formal classes are (a) a class-a acceptance of the step, (b) a DEBT.json entry, (c) the rest. Local macOS data: INDICATIVE.

## head view vs fidelity/baselines/port/00-start: 1386 uncovered items

| candidate | items |
|---|---|
| none | 57 |
| b | 1154 |
| c | 30 |
| a | 1 |
| b-page | 144 |

| check x candidate | items |
|---|---|
| value none | 6 |
| wpt b | 7 |
| wpt c | 30 |
| wpt a | 1 |
| pdf-probe b | 1147 |
| pdf-probe none | 51 |
| pdf-probe b-page | 144 |

| fixture x candidate | items |
|---|---|
| boleto b | 217 |
| boleto none | 44 |
| boleto-febraban b | 63 |
| danfe b | 459 |
| danfe none | 4 |
| invoice b | 67 |
| notification b | 102 |
| oss-postmark-receipt b | 136 |
| oss-postmark-receipt none | 3 |
| oss-sparksuite-invoice b | 46 |
| oss-sparksuite-invoice none | 1 |
| receipt b | 31 |
| text-stress-ptbr b | 26 |
| text-stress-ptbr b-page | 144 |
| text-stress-ptbr none | 5 |
| wpt a | 1 |
| wpt b | 7 |
| wpt c | 30 |

### No possible (a)/(b) classification yet (87: c 30, none 57)

| candidate | item (or group) | n | before -> after | why |
|---|---|---|---|---|
| none | `danfe\|DANFE-L1a\|corpus\|\|criterion#1\|posErrMm` | 1 | 1.56 -> 2.09 | 04-block-offset compensating-drift: needs a per-item layer vector of the anchor behind this aggregate metric |
| none | `danfe\|DANFE-L1b\|corpus\|\|criterion#1\|posErrMm` | 1 | 3.15 -> 3.68 | 04-block-offset compensating-drift: needs a per-item layer vector of the anchor behind this aggregate metric |
| none | `danfe\|DANFE-L1c\|corpus\|\|criterion#1\|posErrMm` | 1 | 4.71 -> 5.24 | 04-block-offset compensating-drift: needs a per-item layer vector of the anchor behind this aggregate metric |
| none | `danfe\|DANFE-L1d\|corpus\|\|criterion#1\|posErrMm` | 1 | 5.96 -> 6.49 | 04-block-offset compensating-drift: needs a per-item layer vector of the anchor behind this aggregate metric |
| none | `oss-postmark-receipt\|INV-R1\|corpus\|\|criterion#1\|worstMm` | 1 | 9.2 -> 10.26 | 04-block-offset compensating-drift: needs a per-item layer vector of the anchor behind this aggregate metric |
| none | `oss-sparksuite-invoice\|INV-R1\|corpus\|\|criterion#1\|worstMm` | 1 | 2.74 -> 4.15 | 01-pagination-gaps value-compensating-drift; 04-block-offset compensating-drift: needs a per-item layer vector of the anchor behind this aggregate metric |
| c | `wpt\|css/CSS2/linebox/line-height-006.xht` | 1 | pass -> fail | raw Blitz pass, vellora fail: a vellora layer broke the test [chain: 01-pagination-gaps wpt-false-pass-rect-merge; an artefact label, not evidence by itself (GATE-A1)] |
| c | `wpt\|css/CSS2/linebox/line-height-007.xht` | 1 | pass -> fail | raw Blitz pass, vellora fail: a vellora layer broke the test [chain: 01-pagination-gaps wpt-false-pass-rect-merge; an artefact label, not evidence by itself (GATE-A1)] |
| c | `wpt\|css/CSS2/linebox/line-height-017.xht` | 1 | pass -> fail | raw Blitz pass, vellora fail: a vellora layer broke the test [chain: 01-pagination-gaps wpt-false-pass-rect-merge; an artefact label, not evidence by itself (GATE-A1)] |
| c | `wpt\|css/CSS2/linebox/line-height-018.xht` | 1 | pass -> fail | raw Blitz pass, vellora fail: a vellora layer broke the test [chain: 01-pagination-gaps wpt-false-pass-rect-merge; an artefact label, not evidence by itself (GATE-A1)] |
| c | `wpt\|css/CSS2/linebox/line-height-028.xht` | 1 | pass -> fail | raw Blitz pass, vellora fail: a vellora layer broke the test [chain: 01-pagination-gaps wpt-false-pass-rect-merge; an artefact label, not evidence by itself (GATE-A1)] |
| c | `wpt\|css/CSS2/linebox/line-height-029.xht` | 1 | pass -> fail | raw Blitz pass, vellora fail: a vellora layer broke the test [chain: 01-pagination-gaps wpt-false-pass-rect-merge; an artefact label, not evidence by itself (GATE-A1)] |
| c | `wpt\|css/CSS2/linebox/line-height-039.xht` | 1 | pass -> fail | raw Blitz pass, vellora fail: a vellora layer broke the test [chain: 01-pagination-gaps wpt-false-pass-rect-merge; an artefact label, not evidence by itself (GATE-A1)] |
| c | `wpt\|css/CSS2/linebox/line-height-040.xht` | 1 | pass -> fail | raw Blitz pass, vellora fail: a vellora layer broke the test [chain: 01-pagination-gaps wpt-false-pass-rect-merge; an artefact label, not evidence by itself (GATE-A1)] |
| c | `wpt\|css/CSS2/linebox/line-height-050.xht` | 1 | pass -> fail | raw Blitz pass, vellora fail: a vellora layer broke the test [chain: 01-pagination-gaps wpt-false-pass-rect-merge; an artefact label, not evidence by itself (GATE-A1)] |
| c | `wpt\|css/CSS2/linebox/line-height-051.xht` | 1 | pass -> fail | raw Blitz pass, vellora fail: a vellora layer broke the test [chain: 01-pagination-gaps wpt-false-pass-rect-merge; an artefact label, not evidence by itself (GATE-A1)] |
| c | `wpt\|css/CSS2/linebox/line-height-058.xht` | 1 | pass -> fail | raw Blitz pass, vellora fail: a vellora layer broke the test [chain: 01-pagination-gaps wpt-false-pass-rect-merge; an artefact label, not evidence by itself (GATE-A1)] |
| c | `wpt\|css/CSS2/linebox/line-height-061.xht` | 1 | pass -> fail | raw Blitz pass, vellora fail: a vellora layer broke the test [chain: 01-pagination-gaps wpt-false-pass-rect-merge; an artefact label, not evidence by itself (GATE-A1)] |
| c | `wpt\|css/CSS2/linebox/line-height-062.xht` | 1 | pass -> fail | raw Blitz pass, vellora fail: a vellora layer broke the test [chain: 01-pagination-gaps wpt-false-pass-rect-merge; an artefact label, not evidence by itself (GATE-A1)] |
| c | `wpt\|css/CSS2/linebox/line-height-083.xht` | 1 | pass -> fail | raw Blitz pass, vellora fail: a vellora layer broke the test [chain: 01-pagination-gaps wpt-false-pass-rect-merge; an artefact label, not evidence by itself (GATE-A1)] |
| c | `wpt\|css/CSS2/linebox/line-height-084.xht` | 1 | pass -> fail | raw Blitz pass, vellora fail: a vellora layer broke the test [chain: 01-pagination-gaps wpt-false-pass-rect-merge; an artefact label, not evidence by itself (GATE-A1)] |
| c | `wpt\|css/CSS2/linebox/line-height-105.xht` | 1 | pass -> fail | raw Blitz pass, vellora fail: a vellora layer broke the test [chain: 01-pagination-gaps wpt-false-pass-rect-merge; an artefact label, not evidence by itself (GATE-A1)] |
| c | `wpt\|css/CSS2/linebox/line-height-106.xht` | 1 | pass -> fail | raw Blitz pass, vellora fail: a vellora layer broke the test [chain: 01-pagination-gaps wpt-false-pass-rect-merge; an artefact label, not evidence by itself (GATE-A1)] |
| c | `wpt\|css/CSS2/linebox/line-height-112.xht` | 1 | pass -> fail | raw Blitz pass, vellora fail: a vellora layer broke the test [chain: 01-pagination-gaps wpt-false-pass-rect-merge; an artefact label, not evidence by itself (GATE-A1)] |
| c | `wpt\|css/CSS2/normal-flow/height-061.xht` | 1 | pass -> fail | raw Blitz pass, vellora fail: a vellora layer broke the test [chain: 01-pagination-gaps wpt-false-pass-rect-merge; an artefact label, not evidence by itself (GATE-A1)] |
| c | `wpt\|css/CSS2/normal-flow/height-062.xht` | 1 | pass -> fail | raw Blitz pass, vellora fail: a vellora layer broke the test [chain: 01-pagination-gaps wpt-false-pass-rect-merge; an artefact label, not evidence by itself (GATE-A1)] |
| c | `wpt\|css/CSS2/normal-flow/height-072.xht` | 1 | pass -> fail | raw Blitz pass, vellora fail: a vellora layer broke the test [chain: 01-pagination-gaps wpt-false-pass-rect-merge; an artefact label, not evidence by itself (GATE-A1)] |
| c | `wpt\|css/CSS2/normal-flow/height-073.xht` | 1 | pass -> fail | raw Blitz pass, vellora fail: a vellora layer broke the test [chain: 01-pagination-gaps wpt-false-pass-rect-merge; an artefact label, not evidence by itself (GATE-A1)] |
| c | `wpt\|css/CSS2/normal-flow/max-height-061.xht` | 1 | pass -> fail | raw Blitz pass, vellora fail: a vellora layer broke the test [chain: 01-pagination-gaps wpt-false-pass-rect-merge; an artefact label, not evidence by itself (GATE-A1)] |
| c | `wpt\|css/CSS2/normal-flow/max-height-062.xht` | 1 | pass -> fail | raw Blitz pass, vellora fail: a vellora layer broke the test [chain: 01-pagination-gaps wpt-false-pass-rect-merge; an artefact label, not evidence by itself (GATE-A1)] |
| c | `wpt\|css/CSS2/normal-flow/max-height-072.xht` | 1 | pass -> fail | raw Blitz pass, vellora fail: a vellora layer broke the test [chain: 01-pagination-gaps wpt-false-pass-rect-merge; an artefact label, not evidence by itself (GATE-A1)] |
| c | `wpt\|css/CSS2/normal-flow/max-height-073.xht` | 1 | pass -> fail | raw Blitz pass, vellora fail: a vellora layer broke the test [chain: 01-pagination-gaps wpt-false-pass-rect-merge; an artefact label, not evidence by itself (GATE-A1)] |
| c | `wpt\|css/CSS2/normal-flow/min-height-061.xht` | 1 | pass -> fail | raw Blitz pass, vellora fail: a vellora layer broke the test [chain: 01-pagination-gaps wpt-false-pass-rect-merge; an artefact label, not evidence by itself (GATE-A1)] |
| c | `wpt\|css/CSS2/normal-flow/min-height-062.xht` | 1 | pass -> fail | raw Blitz pass, vellora fail: a vellora layer broke the test [chain: 01-pagination-gaps wpt-false-pass-rect-merge; an artefact label, not evidence by itself (GATE-A1)] |
| c | `wpt\|css/CSS2/normal-flow/min-height-072.xht` | 1 | pass -> fail | raw Blitz pass, vellora fail: a vellora layer broke the test [chain: 01-pagination-gaps wpt-false-pass-rect-merge; an artefact label, not evidence by itself (GATE-A1)] |
| c | `wpt\|css/CSS2/normal-flow/min-height-073.xht` | 1 | pass -> fail | raw Blitz pass, vellora fail: a vellora layer broke the test [chain: 01-pagination-gaps wpt-false-pass-rect-merge; an artefact label, not evidence by itself (GATE-A1)] |
| none | `boleto: 44 words` | 44 |  | the Chrome word maps to no layout-diff run (no layer vector) |
| none | `oss-postmark-receipt: 2 words` | 2 |  | the Chrome word maps to no layout-diff run (no layer vector) |
| none | `text-stress-ptbr: 5 words` | 5 |  | the Chrome word maps to no layout-diff run (no layer vector) |

## pin view vs fidelity/baselines/pin: 1140 uncovered items

| candidate | items |
|---|---|
| none | 59 |
| c | 57 |
| b | 934 |
| a | 1 |
| b-page | 89 |

| check x candidate | items |
|---|---|
| value none | 8 |
| value c | 8 |
| wpt b | 31 |
| wpt c | 14 |
| wpt a | 1 |
| pdf-probe b | 903 |
| pdf-probe none | 51 |
| pdf-probe c | 35 |
| pdf-probe b-page | 89 |

| fixture x candidate | items |
|---|---|
| boleto b | 168 |
| boleto none | 44 |
| boleto-febraban b | 64 |
| danfe b | 248 |
| danfe none | 5 |
| invoice b | 70 |
| invoice c | 5 |
| invoice none | 4 |
| notification b | 102 |
| oss-postmark-receipt b | 150 |
| oss-postmark-receipt c | 13 |
| oss-postmark-receipt none | 1 |
| oss-sparksuite-invoice b | 67 |
| oss-sparksuite-invoice c | 25 |
| receipt b | 8 |
| text-stress-ptbr b | 26 |
| text-stress-ptbr b-page | 89 |
| text-stress-ptbr none | 5 |
| wpt a | 1 |
| wpt b | 31 |
| wpt c | 14 |

### No possible (a)/(b) classification yet (116: c 57, none 59)

| candidate | item (or group) | n | before -> after | why |
|---|---|---|---|---|
| none | `danfe\|DANFE-M1\|corpus\|\|criterion#1\|excessB` | 1 | 8.552 -> 24.173 | 01-pagination-gaps value-compensating-drift: needs a per-item layer vector of the anchor behind this aggregate metric |
| none | `danfe\|DANFE-L1a\|corpus\|\|criterion#1\|posErrMm` | 1 | 1.56 -> 2.09 | 04-block-offset compensating-drift: needs a per-item layer vector of the anchor behind this aggregate metric |
| none | `danfe\|DANFE-L1b\|corpus\|\|criterion#1\|posErrMm` | 1 | 3.15 -> 3.68 | 04-block-offset compensating-drift: needs a per-item layer vector of the anchor behind this aggregate metric |
| none | `danfe\|DANFE-L1c\|corpus\|\|criterion#1\|posErrMm` | 1 | 4.71 -> 5.24 | 04-block-offset compensating-drift: needs a per-item layer vector of the anchor behind this aggregate metric |
| none | `danfe\|DANFE-L1d\|corpus\|\|criterion#1\|posErrMm` | 1 | 5.96 -> 6.49 | 04-block-offset compensating-drift: needs a per-item layer vector of the anchor behind this aggregate metric |
| none | `invoice\|EXT-2\|oracles:text\|plain\|criterion#1\|statusRank.pdfminer.six` | 1 | 3 -> 2 | no historical label and no per-item layer vector |
| none | `invoice\|REF-W\|oracles:layout\|plain\|criterion#1\|p95Mm` | 1 | 1.78 -> 2.51 | no historical label and no per-item layer vector |
| none | `oss-postmark-receipt\|INV-R1\|corpus\|\|criterion#1\|worstMm` | 1 | 5.5 -> 10.26 | 04-block-offset compensating-drift: needs a per-item layer vector of the anchor behind this aggregate metric |
| c | `oss-postmark-receipt\|EXT-2\|oracles:text\|plain\|criterion#1\|missing.pdftotext` | 1 | 35 -> 38 | text lost: 3 text(s) of this fixture newly drawn off the page (Download as PDF); the OLD value was right |
| c | `oss-postmark-receipt\|EXT-2\|oracles:text\|plain\|criterion#1\|missing.pymupdf` | 1 | 37 -> 40 | text lost: 3 text(s) of this fixture newly drawn off the page (Download as PDF); the OLD value was right |
| c | `oss-postmark-receipt\|EXT-2\|oracles:text\|plain\|criterion#1\|missingTokens.pdftotext\|Download` | 1 | 0 -> 1 | "Download" newly missing from pdftotext: the same text is newly drawn off the page (lost text, the OLD value was right) |
| c | `oss-postmark-receipt\|EXT-2\|oracles:text\|plain\|criterion#1\|missingTokens.pdftotext\|as` | 1 | 0 -> 1 | "as" newly missing from pdftotext: the same text is newly drawn off the page (lost text, the OLD value was right) |
| c | `oss-postmark-receipt\|EXT-2\|oracles:text\|plain\|criterion#1\|missingTokens.pdftotext\|PDF` | 1 | 1 -> 2 | "PDF" newly missing from pdftotext: the same text is newly drawn off the page (lost text, the OLD value was right) |
| c | `oss-postmark-receipt\|EXT-2\|oracles:text\|plain\|criterion#1\|missingTokens.pymupdf\|Download` | 1 | 0 -> 1 | "Download" newly missing from pymupdf: the same text is newly drawn off the page (lost text, the OLD value was right) |
| c | `oss-postmark-receipt\|EXT-2\|oracles:text\|plain\|criterion#1\|missingTokens.pymupdf\|as` | 1 | 0 -> 1 | "as" newly missing from pymupdf: the same text is newly drawn off the page (lost text, the OLD value was right) |
| c | `oss-postmark-receipt\|EXT-2\|oracles:text\|plain\|criterion#1\|missingTokens.pymupdf\|PDF` | 1 | 1 -> 2 | "PDF" newly missing from pymupdf: the same text is newly drawn off the page (lost text, the OLD value was right) |
| c | `wpt\|css/CSS2/linebox/line-height-061.xht` | 1 | pass -> fail | raw Blitz pass, vellora fail: a vellora layer broke the test [chain: 01-pagination-gaps wpt-false-pass-rect-merge; an artefact label, not evidence by itself (GATE-A1)] |
| c | `wpt\|css/CSS2/linebox/line-height-062.xht` | 1 | pass -> fail | raw Blitz pass, vellora fail: a vellora layer broke the test [chain: 01-pagination-gaps wpt-false-pass-rect-merge; an artefact label, not evidence by itself (GATE-A1)] |
| c | `wpt\|css/CSS2/normal-flow/height-061.xht` | 1 | pass -> fail | raw Blitz pass, vellora fail: a vellora layer broke the test [chain: 01-pagination-gaps wpt-false-pass-rect-merge; an artefact label, not evidence by itself (GATE-A1)] |
| c | `wpt\|css/CSS2/normal-flow/height-062.xht` | 1 | pass -> fail | raw Blitz pass, vellora fail: a vellora layer broke the test [chain: 01-pagination-gaps wpt-false-pass-rect-merge; an artefact label, not evidence by itself (GATE-A1)] |
| c | `wpt\|css/CSS2/normal-flow/height-072.xht` | 1 | pass -> fail | raw Blitz pass, vellora fail: a vellora layer broke the test [chain: 01-pagination-gaps wpt-false-pass-rect-merge; an artefact label, not evidence by itself (GATE-A1)] |
| c | `wpt\|css/CSS2/normal-flow/height-073.xht` | 1 | pass -> fail | raw Blitz pass, vellora fail: a vellora layer broke the test [chain: 01-pagination-gaps wpt-false-pass-rect-merge; an artefact label, not evidence by itself (GATE-A1)] |
| c | `wpt\|css/CSS2/normal-flow/max-height-061.xht` | 1 | pass -> fail | raw Blitz pass, vellora fail: a vellora layer broke the test [chain: 01-pagination-gaps wpt-false-pass-rect-merge; an artefact label, not evidence by itself (GATE-A1)] |
| c | `wpt\|css/CSS2/normal-flow/max-height-062.xht` | 1 | pass -> fail | raw Blitz pass, vellora fail: a vellora layer broke the test [chain: 01-pagination-gaps wpt-false-pass-rect-merge; an artefact label, not evidence by itself (GATE-A1)] |
| c | `wpt\|css/CSS2/normal-flow/max-height-072.xht` | 1 | pass -> fail | raw Blitz pass, vellora fail: a vellora layer broke the test [chain: 01-pagination-gaps wpt-false-pass-rect-merge; an artefact label, not evidence by itself (GATE-A1)] |
| c | `wpt\|css/CSS2/normal-flow/max-height-073.xht` | 1 | pass -> fail | raw Blitz pass, vellora fail: a vellora layer broke the test [chain: 01-pagination-gaps wpt-false-pass-rect-merge; an artefact label, not evidence by itself (GATE-A1)] |
| c | `wpt\|css/CSS2/normal-flow/min-height-061.xht` | 1 | pass -> fail | raw Blitz pass, vellora fail: a vellora layer broke the test [chain: 01-pagination-gaps wpt-false-pass-rect-merge; an artefact label, not evidence by itself (GATE-A1)] |
| c | `wpt\|css/CSS2/normal-flow/min-height-062.xht` | 1 | pass -> fail | raw Blitz pass, vellora fail: a vellora layer broke the test [chain: 01-pagination-gaps wpt-false-pass-rect-merge; an artefact label, not evidence by itself (GATE-A1)] |
| c | `wpt\|css/CSS2/normal-flow/min-height-072.xht` | 1 | pass -> fail | raw Blitz pass, vellora fail: a vellora layer broke the test [chain: 01-pagination-gaps wpt-false-pass-rect-merge; an artefact label, not evidence by itself (GATE-A1)] |
| c | `wpt\|css/CSS2/normal-flow/min-height-073.xht` | 1 | pass -> fail | raw Blitz pass, vellora fail: a vellora layer broke the test [chain: 01-pagination-gaps wpt-false-pass-rect-merge; an artefact label, not evidence by itself (GATE-A1)] |
| none | `boleto: 44 words` | 44 |  | the Chrome word maps to no layout-diff run (no layer vector) |
| none | `invoice: 2 words` | 2 |  | the Chrome word maps to no layout-diff run (no layer vector) |
| c | `pdf-probe\|invoice\|p3\|Total#1\|dy` | 1 | 1.1 -> -2.65 | \|run\| 3.533 > \|N0\| 1.984: vellora's layers made the word worse than raw Blitz |
| c | `pdf-probe\|invoice\|p3\|a#1\|dy` | 1 | 1.1 -> -2.65 | \|run\| 3.533 > \|N0\| 1.984: vellora's layers made the word worse than raw Blitz |
| c | `pdf-probe\|invoice\|p3\|pagar#1\|dy` | 1 | 1.1 -> -2.65 | \|run\| 3.533 > \|N0\| 1.984: vellora's layers made the word worse than raw Blitz |
| c | `pdf-probe\|invoice\|p3\|R$#14\|dy` | 1 | 1.1 -> -2.65 | \|run\| 3.533 > \|N0\| 1.984: vellora's layers made the word worse than raw Blitz |
| c | `pdf-probe\|invoice\|p3\|50.724,90#1\|dy` | 1 | 1.1 -> -2.65 | \|run\| 3.533 > \|N0\| 1.984: vellora's layers made the word worse than raw Blitz |
| c | `pdf-probe\|oss-postmark-receipt\|p1\|[Product#1\|pairing` | 1 | dx -0.9 dy -1.65 -> unpaired | Chrome's "[Product" has no vellora partner and is not drawn on another page: text lost (the OLD value was right) |
| c | `pdf-probe\|oss-postmark-receipt\|p1\|Name]#1\|pairing` | 1 | dx -0.9 dy -1.65 -> unpaired | Chrome's "Name]" has no vellora partner and is not drawn on another page: text lost (the OLD value was right) |
| c | `pdf-probe\|oss-sparksuite-invoice\|p1\|Invoice#1\|dx` | 1 | -0.23 -> -3.23 | \|run\| 4.307 > \|N0\| 2: vellora's layers made the word worse than raw Blitz |
| c | `pdf-probe\|oss-sparksuite-invoice\|p1\|#:#1\|dx` | 1 | -0.23 -> -3.23 | \|run\| 4.307 > \|N0\| 2: vellora's layers made the word worse than raw Blitz |
| c | `pdf-probe\|oss-sparksuite-invoice\|p1\|123#1\|dx` | 1 | -0.23 -> -3.23 | \|run\| 4.307 > \|N0\| 2: vellora's layers made the word worse than raw Blitz |
| c | `pdf-probe\|oss-sparksuite-invoice\|p1\|Created:#1\|dx` | 1 | -0.23 -> -3.23 | \|run\| 4.307 > \|N0\| 2: vellora's layers made the word worse than raw Blitz |
| c | `pdf-probe\|oss-sparksuite-invoice\|p1\|January#1\|dx` | 1 | -0.23 -> -3.23 | \|run\| 4.307 > \|N0\| 2: vellora's layers made the word worse than raw Blitz |
| c | `pdf-probe\|oss-sparksuite-invoice\|p1\|1,#1\|dx` | 1 | -0.23 -> -3.23 | \|run\| 4.307 > \|N0\| 2: vellora's layers made the word worse than raw Blitz |
| c | `pdf-probe\|oss-sparksuite-invoice\|p1\|2023#1\|dx` | 1 | -0.23 -> -3.23 | \|run\| 4.307 > \|N0\| 2: vellora's layers made the word worse than raw Blitz |
| c | `pdf-probe\|oss-sparksuite-invoice\|p1\|Due:#1\|dx` | 1 | -0.23 -> -3.23 | \|run\| 4.307 > \|N0\| 2: vellora's layers made the word worse than raw Blitz |
| c | `pdf-probe\|oss-sparksuite-invoice\|p1\|February#1\|dx` | 1 | -0.23 -> -3.23 | \|run\| 4.307 > \|N0\| 2: vellora's layers made the word worse than raw Blitz |
| c | `pdf-probe\|oss-sparksuite-invoice\|p1\|1,#2\|dx` | 1 | -0.23 -> -3.23 | \|run\| 4.307 > \|N0\| 2: vellora's layers made the word worse than raw Blitz |
| c | `pdf-probe\|oss-sparksuite-invoice\|p1\|2023#2\|dx` | 1 | -0.23 -> -3.23 | \|run\| 4.307 > \|N0\| 2: vellora's layers made the word worse than raw Blitz |
| c | `pdf-probe\|oss-sparksuite-invoice\|p1\|Acme#1\|dx` | 1 | -0.23 -> -3.23 | \|run\| 4.307 > \|N0\| 2: vellora's layers made the word worse than raw Blitz |
| c | `pdf-probe\|oss-sparksuite-invoice\|p1\|Corp.#1\|dx` | 1 | -0.23 -> -3.23 | \|run\| 4.307 > \|N0\| 2: vellora's layers made the word worse than raw Blitz |
| c | `pdf-probe\|oss-sparksuite-invoice\|p1\|John#1\|dx` | 1 | -0.22 -> -3.22 | \|run\| 4.293 > \|N0\| 1.992: vellora's layers made the word worse than raw Blitz |
| c | `pdf-probe\|oss-sparksuite-invoice\|p1\|Doe#1\|dx` | 1 | -0.22 -> -3.22 | \|run\| 4.293 > \|N0\| 1.992: vellora's layers made the word worse than raw Blitz |
| c | `pdf-probe\|oss-sparksuite-invoice\|p1\|john@example.com#1\|dx` | 1 | -0.23 -> -3.23 | \|run\| 4.307 > \|N0\| 2: vellora's layers made the word worse than raw Blitz |
| c | `pdf-probe\|oss-sparksuite-invoice\|p1\|Check#1\|dx` | 1 | -1.72 -> -3.22 | \|run\| 4.293 > \|N0\| 1.992: vellora's layers made the word worse than raw Blitz |
| c | `pdf-probe\|oss-sparksuite-invoice\|p1\|##1\|dx` | 1 | -1.73 -> -3.23 | \|run\| 4.307 > \|N0\| 1.992: vellora's layers made the word worse than raw Blitz |
| c | `pdf-probe\|oss-sparksuite-invoice\|p1\|1000#1\|dx` | 1 | -1.73 -> -3.23 | \|run\| 4.307 > \|N0\| 2: vellora's layers made the word worse than raw Blitz |
| c | `pdf-probe\|oss-sparksuite-invoice\|p1\|Price#1\|dx` | 1 | -1.73 -> -3.23 | \|run\| 4.307 > \|N0\| 2: vellora's layers made the word worse than raw Blitz |
| c | `pdf-probe\|oss-sparksuite-invoice\|p1\|$300.00#1\|dx` | 1 | -1.72 -> -3.22 | \|run\| 4.293 > \|N0\| 1.992: vellora's layers made the word worse than raw Blitz |
| c | `pdf-probe\|oss-sparksuite-invoice\|p1\|$75.00#1\|dx` | 1 | -1.73 -> -3.23 | \|run\| 4.307 > \|N0\| 2: vellora's layers made the word worse than raw Blitz |
| c | `pdf-probe\|oss-sparksuite-invoice\|p1\|$10.00#1\|dx` | 1 | -1.73 -> -3.23 | \|run\| 4.307 > \|N0\| 2: vellora's layers made the word worse than raw Blitz |
| c | `pdf-probe\|oss-sparksuite-invoice\|p1\|Total:#1\|dx` | 1 | -1.73 -> -3.23 | \|run\| 4.307 > \|N0\| 2: vellora's layers made the word worse than raw Blitz |
| c | `pdf-probe\|oss-sparksuite-invoice\|p1\|$385.00#1\|dx` | 1 | -1.73 -> -3.23 | \|run\| 4.307 > \|N0\| 2: vellora's layers made the word worse than raw Blitz |
| none | `text-stress-ptbr: 5 words` | 5 |  | the Chrome word maps to no layout-diff run (no layer vector) |
| c | `pdf-probe\|oss-postmark-receipt\|off-page\|Download` | 1 | 0 -> 1 | "Download" is newly drawn off the page (outside the MediaBox; MuPDF and poppler clip it): lost text, never acceptable |
| c | `pdf-probe\|oss-postmark-receipt\|off-page\|as` | 1 | 0 -> 1 | "as" is newly drawn off the page (outside the MediaBox; MuPDF and poppler clip it): lost text, never acceptable |
| c | `pdf-probe\|oss-postmark-receipt\|off-page\|PDF` | 1 | 1 -> 2 | "PDF" is newly drawn off the page (outside the MediaBox; MuPDF and poppler clip it): lost text, never acceptable |

