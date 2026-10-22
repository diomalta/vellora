# Ledger candidates (fidelity/gate/ledger-candidates.mjs)

Command: `node fidelity/gate/ledger-candidates.mjs --report <scratch>/07-vs-06-head-00-start/gate-report.json --layout-from ~/.cache/vellora-fidelity/run-all-07-media-print-20261021T162148Z --head-wpt ~/.cache/vellora-fidelity/run-all-s1c-00-start-20261021T074902Z/wpt/results.json --pin-wpt ~/.cache/vellora-fidelity/run-all-pin-20261021T054154Z/wpt/results.json --out <scratch>/candidates`; date 2026-10-21T21:04:00.757Z. Candidates, not verdicts: the gate's formal classes are (a) a class-a acceptance of the step, (b) a DEBT.json entry, (c) the rest. Local macOS data: INDICATIVE.

## head view vs fidelity/baselines/port/00-start: 985 uncovered items

| candidate | items |
|---|---|
| c | 15 |
| none | 185 |
| a | 37 |
| declare | 10 |
| b | 616 |
| b-page | 122 |

| check x candidate | items |
|---|---|
| status c | 2 |
| value none | 6 |
| value c | 7 |
| wpt a | 37 |
| wpt none | 1 |
| wpt declare | 10 |
| pdf-probe b | 616 |
| pdf-probe none | 178 |
| pdf-probe c | 6 |
| pdf-probe b-page | 122 |

| fixture x candidate | items |
|---|---|
| boleto b | 187 |
| boleto none | 44 |
| boleto-febraban b | 39 |
| danfe b | 295 |
| danfe none | 4 |
| notification b | 77 |
| oss-postmark-receipt c | 15 |
| oss-postmark-receipt none | 135 |
| oss-sparksuite-invoice b | 18 |
| oss-sparksuite-invoice none | 1 |
| text-stress-ptbr b-page | 122 |
| wpt a | 37 |
| wpt declare | 10 |
| wpt none | 1 |

### No possible (a)/(b) classification yet (200: c 15, none 185)

| candidate | item (or group) | n | before -> after | why |
|---|---|---|---|---|
| c | `oss-postmark-receipt\|INV-X1\|corpus\|\|criterion#1` | 1 | PASS -> FAIL | 05-walk-rewrite html-normalize-compensation: text lost (XHTML doctype parsed as XML drops the text after each <br>); the OLD value was right |
| c | `oss-postmark-receipt\|INV-X2\|corpus\|\|criterion#1` | 1 | PASS -> FAIL | 05-walk-rewrite html-normalize-compensation: text lost (XHTML doctype parsed as XML drops the text after each <br>); the OLD value was right |
| none | `danfe\|DANFE-L1a\|corpus\|\|criterion#1\|posErrMm` | 1 | 1.56 -> 2.09 | 04-block-offset compensating-drift: needs a per-item layer vector of the anchor behind this aggregate metric |
| none | `danfe\|DANFE-L1b\|corpus\|\|criterion#1\|posErrMm` | 1 | 3.15 -> 3.68 | 04-block-offset compensating-drift: needs a per-item layer vector of the anchor behind this aggregate metric |
| none | `danfe\|DANFE-L1c\|corpus\|\|criterion#1\|posErrMm` | 1 | 4.71 -> 5.24 | 04-block-offset compensating-drift: needs a per-item layer vector of the anchor behind this aggregate metric |
| none | `danfe\|DANFE-L1d\|corpus\|\|criterion#1\|posErrMm` | 1 | 5.96 -> 6.49 | 04-block-offset compensating-drift: needs a per-item layer vector of the anchor behind this aggregate metric |
| c | `oss-postmark-receipt\|INV-X1\|corpus\|\|criterion#1\|found` | 1 | 6 -> 5 | 05-walk-rewrite html-normalize-compensation: text lost (XHTML doctype parsed as XML drops the text after each <br>); the OLD value was right |
| c | `oss-postmark-receipt\|INV-X2\|corpus\|\|criterion#1\|found.pdftotext` | 1 | 6 -> 5 | 05-walk-rewrite html-normalize-compensation: text lost (XHTML doctype parsed as XML drops the text after each <br>); the OLD value was right |
| c | `oss-postmark-receipt\|INV-X2\|corpus\|\|criterion#1\|found.pypdf` | 1 | 6 -> 5 | 05-walk-rewrite html-normalize-compensation: text lost (XHTML doctype parsed as XML drops the text after each <br>); the OLD value was right |
| c | `oss-postmark-receipt\|INV-X2\|corpus\|\|criterion#1\|found.pdfminer` | 1 | 6 -> 5 | 05-walk-rewrite html-normalize-compensation: text lost (XHTML doctype parsed as XML drops the text after each <br>); the OLD value was right |
| none | `oss-postmark-receipt\|INV-R1\|corpus\|\|criterion#1\|worstMm` | 1 | 9.2 -> 10.26 | 04-block-offset compensating-drift: needs a per-item layer vector of the anchor behind this aggregate metric |
| c | `oss-postmark-receipt\|EXT-2\|oracles:text\|plain\|criterion#1\|missing.pdftotext` | 1 | 38 -> 39 | 05-walk-rewrite html-normalize-compensation: text lost (XHTML doctype parsed as XML drops the text after each <br>); the OLD value was right |
| c | `oss-postmark-receipt\|EXT-2\|oracles:text\|plain\|criterion#1\|missing.pdfminer.six` | 1 | 2 -> 11 | 05-walk-rewrite html-normalize-compensation: text lost (XHTML doctype parsed as XML drops the text after each <br>); the OLD value was right |
| c | `oss-postmark-receipt\|EXT-2\|oracles:text\|plain\|criterion#1\|missing.pymupdf` | 1 | 40 -> 41 | 05-walk-rewrite html-normalize-compensation: text lost (XHTML doctype parsed as XML drops the text after each <br>); the OLD value was right |
| none | `oss-sparksuite-invoice\|INV-R1\|corpus\|\|criterion#1\|worstMm` | 1 | 2.74 -> 4.15 | 01-pagination-gaps value-compensating-drift; 04-block-offset compensating-drift: needs a per-item layer vector of the anchor behind this aggregate metric |
| none | `wpt\|css/CSS2/floats/zero-width-floats.html` | 1 | pass -> fail | 01-pagination-gaps wpt-two-errors-cancelling: not an artefact label, and WPT tests have no layer vector |
| none | `boleto: 44 words` | 44 |  | the Chrome word maps to no layout-diff run (no layer vector) |
| none | `oss-postmark-receipt: 134 words` | 134 |  | no layer vector: layout-diff aligned no text run of this fixture |
| c | `pdf-probe\|oss-postmark-receipt\|p1\|The#1\|pairing` | 1 | dx 0.97 dy 32.1 -> unpaired | Chrome's "The" has no vellora partner and is not drawn on another page: text lost (the OLD value was right) |
| c | `pdf-probe\|oss-postmark-receipt\|p1\|[Product#4\|pairing` | 1 | dx 0.97 dy 32.1 -> unpaired | Chrome's "[Product" has no vellora partner and is not drawn on another page: text lost (the OLD value was right) |
| c | `pdf-probe\|oss-postmark-receipt\|p1\|Name]#3\|pairing` | 1 | dx 0.97 dy 32.1 -> unpaired | Chrome's "Name]" has no vellora partner and is not drawn on another page: text lost (the OLD value was right) |
| c | `pdf-probe\|oss-postmark-receipt\|p1\|team#2\|pairing` | 1 | dx 0.97 dy 32.1 -> unpaired | Chrome's "team" has no vellora partner and is not drawn on another page: text lost (the OLD value was right) |
| c | `pdf-probe\|oss-postmark-receipt\|unpaired-chrome` | 1 | 42 -> 46 | unpaired-word count grew with 4 lost Chrome word(s) of this fixture (text lost, not displaced) |
| c | `pdf-probe\|oss-postmark-receipt\|unpaired-vellora` | 1 | 0 -> 3 | unpaired-word count grew with 4 lost Chrome word(s) of this fixture (text lost, not displaced) |

## pin view vs fidelity/baselines/pin: 213 uncovered items

| candidate | items |
|---|---|
| c | 14 |
| none | 37 |
| a | 19 |
| declare | 10 |
| b | 133 |

| check x candidate | items |
|---|---|
| status c | 2 |
| value none | 8 |
| value c | 7 |
| wpt none | 27 |
| wpt a | 19 |
| wpt declare | 10 |
| pdf-probe b | 133 |
| pdf-probe none | 2 |
| pdf-probe c | 5 |

| fixture x candidate | items |
|---|---|
| danfe none | 5 |
| invoice b | 56 |
| invoice c | 5 |
| invoice none | 4 |
| notification b | 77 |
| oss-postmark-receipt c | 9 |
| oss-postmark-receipt none | 1 |
| wpt a | 19 |
| wpt declare | 10 |
| wpt none | 27 |

### No possible (a)/(b) classification yet (51: c 14, none 37)

| candidate | item (or group) | n | before -> after | why |
|---|---|---|---|---|
| c | `oss-postmark-receipt\|INV-X1\|corpus\|\|criterion#1` | 1 | PASS -> FAIL | 05-walk-rewrite html-normalize-compensation: text lost (XHTML doctype parsed as XML drops the text after each <br>); the OLD value was right |
| c | `oss-postmark-receipt\|INV-X2\|corpus\|\|criterion#1` | 1 | PASS -> FAIL | 05-walk-rewrite html-normalize-compensation: text lost (XHTML doctype parsed as XML drops the text after each <br>); the OLD value was right |
| none | `danfe\|DANFE-M1\|corpus\|\|criterion#1\|excessB` | 1 | 8.552 -> 24.173 | 01-pagination-gaps value-compensating-drift: needs a per-item layer vector of the anchor behind this aggregate metric |
| none | `danfe\|DANFE-L1a\|corpus\|\|criterion#1\|posErrMm` | 1 | 1.56 -> 2.09 | 04-block-offset compensating-drift: needs a per-item layer vector of the anchor behind this aggregate metric |
| none | `danfe\|DANFE-L1b\|corpus\|\|criterion#1\|posErrMm` | 1 | 3.15 -> 3.68 | 04-block-offset compensating-drift: needs a per-item layer vector of the anchor behind this aggregate metric |
| none | `danfe\|DANFE-L1c\|corpus\|\|criterion#1\|posErrMm` | 1 | 4.71 -> 5.24 | 04-block-offset compensating-drift: needs a per-item layer vector of the anchor behind this aggregate metric |
| none | `danfe\|DANFE-L1d\|corpus\|\|criterion#1\|posErrMm` | 1 | 5.96 -> 6.49 | 04-block-offset compensating-drift: needs a per-item layer vector of the anchor behind this aggregate metric |
| none | `invoice\|EXT-2\|oracles:text\|plain\|criterion#1\|statusRank.pdfminer.six` | 1 | 3 -> 2 | no historical label and no per-item layer vector |
| none | `invoice\|REF-W\|oracles:layout\|plain\|criterion#1\|p95Mm` | 1 | 1.78 -> 2.51 | no historical label and no per-item layer vector |
| c | `oss-postmark-receipt\|INV-X1\|corpus\|\|criterion#1\|found` | 1 | 6 -> 5 | 05-walk-rewrite html-normalize-compensation: text lost (XHTML doctype parsed as XML drops the text after each <br>); the OLD value was right |
| c | `oss-postmark-receipt\|INV-X2\|corpus\|\|criterion#1\|found.pdftotext` | 1 | 6 -> 5 | 05-walk-rewrite html-normalize-compensation: text lost (XHTML doctype parsed as XML drops the text after each <br>); the OLD value was right |
| c | `oss-postmark-receipt\|INV-X2\|corpus\|\|criterion#1\|found.pypdf` | 1 | 6 -> 5 | 05-walk-rewrite html-normalize-compensation: text lost (XHTML doctype parsed as XML drops the text after each <br>); the OLD value was right |
| c | `oss-postmark-receipt\|INV-X2\|corpus\|\|criterion#1\|found.pdfminer` | 1 | 6 -> 5 | 05-walk-rewrite html-normalize-compensation: text lost (XHTML doctype parsed as XML drops the text after each <br>); the OLD value was right |
| none | `oss-postmark-receipt\|INV-R1\|corpus\|\|criterion#1\|worstMm` | 1 | 5.5 -> 10.26 | 04-block-offset compensating-drift: needs a per-item layer vector of the anchor behind this aggregate metric |
| c | `oss-postmark-receipt\|EXT-2\|oracles:text\|plain\|criterion#1\|missing.pdftotext` | 1 | 35 -> 39 | 05-walk-rewrite html-normalize-compensation: text lost (XHTML doctype parsed as XML drops the text after each <br>); the OLD value was right |
| c | `oss-postmark-receipt\|EXT-2\|oracles:text\|plain\|criterion#1\|missing.pdfminer.six` | 1 | 2 -> 11 | 05-walk-rewrite html-normalize-compensation: text lost (XHTML doctype parsed as XML drops the text after each <br>); the OLD value was right |
| c | `oss-postmark-receipt\|EXT-2\|oracles:text\|plain\|criterion#1\|missing.pymupdf` | 1 | 37 -> 41 | 05-walk-rewrite html-normalize-compensation: text lost (XHTML doctype parsed as XML drops the text after each <br>); the OLD value was right |
| none | `wpt\|css/CSS2/abspos/between-float-and-text.html` | 1 | pass -> fail | no artefact evidence (old render's page count equals Chrome's) and no layer vector for WPT tests |
| none | `wpt\|css/CSS2/floats-clear/clear-applies-to-009.xht` | 1 | pass -> fail | no artefact evidence (old render's page count equals Chrome's) and no layer vector for WPT tests |
| none | `wpt\|css/CSS2/floats-clear/clear-float-005.xht` | 1 | pass -> fail | no artefact evidence (old render's page count equals Chrome's) and no layer vector for WPT tests |
| none | `wpt\|css/CSS2/floats/float-in-inline-anonymous-block-with-overflow-hidden.html` | 1 | pass -> fail | no artefact evidence (old render's page count equals Chrome's) and no layer vector for WPT tests |
| none | `wpt\|css/CSS2/floats/float-nowrap-2.html` | 1 | pass -> fail | no artefact evidence (old render's page count equals Chrome's) and no layer vector for WPT tests |
| none | `wpt\|css/CSS2/floats/float-nowrap-8.html` | 1 | pass -> fail | no artefact evidence (old render's page count equals Chrome's) and no layer vector for WPT tests |
| none | `wpt\|css/CSS2/floats/floats-placement-vertical-001a.xht` | 1 | pass -> fail | no artefact evidence (old render's page count equals Chrome's) and no layer vector for WPT tests |
| none | `wpt\|css/CSS2/floats/zero-width-floats.html` | 1 | pass -> fail | 01-pagination-gaps wpt-two-errors-cancelling: not an artefact label, and WPT tests have no layer vector |
| none | `wpt\|css/CSS2/generated-content/after-content-display-012.xht` | 1 | pass -> fail | no artefact evidence (old render's page count equals Chrome's) and no layer vector for WPT tests |
| none | `wpt\|css/CSS2/generated-content/after-content-display-013.xht` | 1 | pass -> fail | no artefact evidence (old render's page count equals Chrome's) and no layer vector for WPT tests |
| none | `wpt\|css/CSS2/generated-content/before-content-display-012.xht` | 1 | pass -> fail | no artefact evidence (old render's page count equals Chrome's) and no layer vector for WPT tests |
| none | `wpt\|css/CSS2/generated-content/before-content-display-013.xht` | 1 | pass -> fail | no artefact evidence (old render's page count equals Chrome's) and no layer vector for WPT tests |
| none | `wpt\|css/CSS2/normal-flow/block-in-inline-float-between-001.xht` | 1 | pass -> fail | no artefact evidence (old render's page count equals Chrome's) and no layer vector for WPT tests |
| none | `wpt\|css/CSS2/normal-flow/inline-table-zorder-001.xht` | 1 | pass -> fail | no artefact evidence (old render's page count equals Chrome's) and no layer vector for WPT tests |
| none | `wpt\|css/CSS2/visuren/float-inside-inline-between-blocks-1.html` | 1 | pass -> fail | no artefact evidence (old render's page count equals Chrome's) and no layer vector for WPT tests |
| none | `wpt\|css/css-break/flexbox/multi-line-column-flex-fragmentation-054.html` | 1 | pass -> fail | no artefact evidence (old render's page count equals Chrome's) and no layer vector for WPT tests |
| none | `wpt\|css/css-break/flexbox/multi-line-column-flex-fragmentation-055.html` | 1 | pass -> fail | no artefact evidence (old render's page count equals Chrome's) and no layer vector for WPT tests |
| none | `wpt\|css/css-break/flexbox/multi-line-column-flex-fragmentation-058.html` | 1 | pass -> fail | no artefact evidence (old render's page count equals Chrome's) and no layer vector for WPT tests |
| none | `wpt\|css/css-break/ruby-003.html` | 1 | pass -> fail | no artefact evidence (old render's page count equals Chrome's) and no layer vector for WPT tests |
| none | `wpt\|css/css-text/hanging-punctuation/hanging-punctuation-first-002.html` | 1 | pass -> fail | no artefact evidence (old render's page count equals Chrome's) and no layer vector for WPT tests |
| none | `wpt\|css/css-text/tab-size/tab-size-integer-001.html` | 1 | pass -> fail | no artefact evidence (old render's page count equals Chrome's) and no layer vector for WPT tests |
| none | `wpt\|css/css-text/tab-size/tab-size-integer-002.html` | 1 | pass -> fail | no artefact evidence (old render's page count equals Chrome's) and no layer vector for WPT tests |
| none | `wpt\|css/css-text/tab-size/tab-size-integer-003.html` | 1 | pass -> fail | no artefact evidence (old render's page count equals Chrome's) and no layer vector for WPT tests |
| none | `wpt\|css/css-text/text-align/text-align-end-006.html` | 1 | pass -> fail | no artefact evidence (old render's page count equals Chrome's) and no layer vector for WPT tests |
| none | `wpt\|css/css-text/text-justify/text-justify-and-trailing-spaces-003.html` | 1 | pass -> fail | no artefact evidence (old render's page count equals Chrome's) and no layer vector for WPT tests |
| none | `wpt\|css/css-text/text-justify/text-justify-and-trailing-spaces-004.html` | 1 | pass -> fail | no artefact evidence (old render's page count equals Chrome's) and no layer vector for WPT tests |
| none | `wpt\|css/css-text/white-space/text-wrap-balance-text-indent-001.html` | 1 | pass -> fail | no artefact evidence (old render's page count equals Chrome's) and no layer vector for WPT tests |
| none | `invoice: 2 words` | 2 |  | the Chrome word maps to no layout-diff run (no layer vector) |
| c | `pdf-probe\|invoice\|p3\|Total#1\|dy` | 1 | 1.1 -> -2.65 | \|run\| 3.533 > \|N0\| 1.984: vellora's layers made the word worse than raw Blitz |
| c | `pdf-probe\|invoice\|p3\|a#1\|dy` | 1 | 1.1 -> -2.65 | \|run\| 3.533 > \|N0\| 1.984: vellora's layers made the word worse than raw Blitz |
| c | `pdf-probe\|invoice\|p3\|pagar#1\|dy` | 1 | 1.1 -> -2.65 | \|run\| 3.533 > \|N0\| 1.984: vellora's layers made the word worse than raw Blitz |
| c | `pdf-probe\|invoice\|p3\|R$#14\|dy` | 1 | 1.1 -> -2.65 | \|run\| 3.533 > \|N0\| 1.984: vellora's layers made the word worse than raw Blitz |
| c | `pdf-probe\|invoice\|p3\|50.724,90#1\|dy` | 1 | 1.1 -> -2.65 | \|run\| 3.533 > \|N0\| 1.984: vellora's layers made the word worse than raw Blitz |

