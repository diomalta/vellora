# Ledger candidates (fidelity/gate/ledger-candidates.mjs)

Command: `node fidelity/gate/ledger-candidates.mjs --report <scratch>/run-gate-report.json --layout-from fidelity/results/run-all/10-tip --head-wpt ~/.cache/vellora-fidelity/run-all-s1c-00-start-20261021T074902Z/wpt/results.json --pin-wpt ~/.cache/vellora-fidelity/run-all-pin-20261021T054154Z/wpt/results.json --raw-wpt fidelity/results/run-all/10-tip/wpt/results.json --out <scratch>/cand-run`; date 2026-10-23T00:57:49.560Z. Candidates, not verdicts: the gate's formal classes are (a) a class-a acceptance of the step, (b) a DEBT.json entry, (c) the rest. Local macOS data: INDICATIVE.

## head view vs fidelity/baselines/port/00-start: 1173 uncovered items

| candidate | items |
|---|---|
| none | 53 |
| b | 972 |
| a | 1 |
| c | 3 |
| b-page | 144 |

| check x candidate | items |
|---|---|
| value none | 4 |
| wpt b | 7 |
| wpt a | 1 |
| pdf-probe b | 965 |
| pdf-probe none | 49 |
| pdf-probe c | 3 |
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
| oss-postmark-receipt c | 3 |
| receipt b | 31 |
| text-stress-ptbr b | 26 |
| text-stress-ptbr b-page | 144 |
| text-stress-ptbr none | 5 |
| wpt a | 1 |
| wpt b | 7 |

### No possible (a)/(b) classification yet (56: c 3, none 53)

| candidate | item (or group) | n | before -> after | why |
|---|---|---|---|---|
| none | `danfe\|DANFE-L1a\|corpus\|\|criterion#1\|posErrMm` | 1 | 1.56 -> 2.09 | 04-block-offset compensating-drift: needs a per-item layer vector of the anchor behind this aggregate metric |
| none | `danfe\|DANFE-L1b\|corpus\|\|criterion#1\|posErrMm` | 1 | 3.15 -> 3.68 | 04-block-offset compensating-drift: needs a per-item layer vector of the anchor behind this aggregate metric |
| none | `danfe\|DANFE-L1c\|corpus\|\|criterion#1\|posErrMm` | 1 | 4.71 -> 5.24 | 04-block-offset compensating-drift: needs a per-item layer vector of the anchor behind this aggregate metric |
| none | `danfe\|DANFE-L1d\|corpus\|\|criterion#1\|posErrMm` | 1 | 5.96 -> 6.49 | 04-block-offset compensating-drift: needs a per-item layer vector of the anchor behind this aggregate metric |
| none | `boleto: 44 words` | 44 |  | the Chrome word maps to no layout-diff run (no layer vector) |
| c | `pdf-probe\|oss-postmark-receipt\|p1\|[Product#2\|pairing` | 1 | dx -0.9 dy -0.15 -> unpaired | Chrome's "[Product" has no vellora partner and is not drawn on another page: text lost (the OLD value was right) |
| c | `pdf-probe\|oss-postmark-receipt\|p1\|Name]#2\|pairing` | 1 | dx -0.9 dy -0.15 -> unpaired | Chrome's "Name]" has no vellora partner and is not drawn on another page: text lost (the OLD value was right) |
| none | `text-stress-ptbr: 5 words` | 5 |  | the Chrome word maps to no layout-diff run (no layer vector) |
| c | `pdf-probe\|oss-postmark-receipt\|unpaired-vellora` | 1 | 0 -> 3 | unpaired-word count grew with 2 lost Chrome word(s) of this fixture (text lost, not displaced) |

## pin view vs fidelity/baselines/pin: 859 uncovered items

| candidate | items |
|---|---|
| none | 56 |
| b | 697 |
| a | 1 |
| c | 16 |
| b-page | 89 |

| check x candidate | items |
|---|---|
| value none | 5 |
| wpt b | 31 |
| wpt a | 1 |
| pdf-probe b | 666 |
| pdf-probe none | 51 |
| pdf-probe c | 16 |
| pdf-probe b-page | 89 |

| fixture x candidate | items |
|---|---|
| boleto b | 168 |
| boleto none | 44 |
| boleto-febraban b | 64 |
| danfe b | 248 |
| danfe none | 5 |
| invoice b | 54 |
| invoice none | 2 |
| notification b | 102 |
| oss-sparksuite-invoice c | 16 |
| receipt b | 4 |
| text-stress-ptbr b | 26 |
| text-stress-ptbr b-page | 89 |
| text-stress-ptbr none | 5 |
| wpt a | 1 |
| wpt b | 31 |

### No possible (a)/(b) classification yet (72: c 16, none 56)

| candidate | item (or group) | n | before -> after | why |
|---|---|---|---|---|
| none | `danfe\|DANFE-M1\|corpus\|\|criterion#1\|excessB` | 1 | 8.552 -> 24.173 | 01-pagination-gaps value-compensating-drift: needs a per-item layer vector of the anchor behind this aggregate metric |
| none | `danfe\|DANFE-L1a\|corpus\|\|criterion#1\|posErrMm` | 1 | 1.56 -> 2.09 | 04-block-offset compensating-drift: needs a per-item layer vector of the anchor behind this aggregate metric |
| none | `danfe\|DANFE-L1b\|corpus\|\|criterion#1\|posErrMm` | 1 | 3.15 -> 3.68 | 04-block-offset compensating-drift: needs a per-item layer vector of the anchor behind this aggregate metric |
| none | `danfe\|DANFE-L1c\|corpus\|\|criterion#1\|posErrMm` | 1 | 4.71 -> 5.24 | 04-block-offset compensating-drift: needs a per-item layer vector of the anchor behind this aggregate metric |
| none | `danfe\|DANFE-L1d\|corpus\|\|criterion#1\|posErrMm` | 1 | 5.96 -> 6.49 | 04-block-offset compensating-drift: needs a per-item layer vector of the anchor behind this aggregate metric |
| none | `boleto: 44 words` | 44 |  | the Chrome word maps to no layout-diff run (no layer vector) |
| none | `invoice: 2 words` | 2 |  | the Chrome word maps to no layout-diff run (no layer vector) |
| c | `pdf-probe\|oss-sparksuite-invoice\|p1\|Invoice#1\|dx` | 1 | -0.23 -> -1.73 | \|run\| 2.307 > \|N0\| 0: vellora's layers made the word worse than raw Blitz |
| c | `pdf-probe\|oss-sparksuite-invoice\|p1\|#:#1\|dx` | 1 | -0.23 -> -1.73 | \|run\| 2.307 > \|N0\| 0: vellora's layers made the word worse than raw Blitz |
| c | `pdf-probe\|oss-sparksuite-invoice\|p1\|123#1\|dx` | 1 | -0.23 -> -1.73 | \|run\| 2.307 > \|N0\| 0: vellora's layers made the word worse than raw Blitz |
| c | `pdf-probe\|oss-sparksuite-invoice\|p1\|Created:#1\|dx` | 1 | -0.23 -> -1.73 | \|run\| 2.307 > \|N0\| 0: vellora's layers made the word worse than raw Blitz |
| c | `pdf-probe\|oss-sparksuite-invoice\|p1\|January#1\|dx` | 1 | -0.23 -> -1.73 | \|run\| 2.307 > \|N0\| 0: vellora's layers made the word worse than raw Blitz |
| c | `pdf-probe\|oss-sparksuite-invoice\|p1\|1,#1\|dx` | 1 | -0.23 -> -1.73 | \|run\| 2.307 > \|N0\| 0: vellora's layers made the word worse than raw Blitz |
| c | `pdf-probe\|oss-sparksuite-invoice\|p1\|2023#1\|dx` | 1 | -0.23 -> -1.73 | \|run\| 2.307 > \|N0\| 0: vellora's layers made the word worse than raw Blitz |
| c | `pdf-probe\|oss-sparksuite-invoice\|p1\|Due:#1\|dx` | 1 | -0.23 -> -1.73 | \|run\| 2.307 > \|N0\| 0: vellora's layers made the word worse than raw Blitz |
| c | `pdf-probe\|oss-sparksuite-invoice\|p1\|February#1\|dx` | 1 | -0.23 -> -1.73 | \|run\| 2.307 > \|N0\| 0: vellora's layers made the word worse than raw Blitz |
| c | `pdf-probe\|oss-sparksuite-invoice\|p1\|1,#2\|dx` | 1 | -0.23 -> -1.73 | \|run\| 2.307 > \|N0\| 0: vellora's layers made the word worse than raw Blitz |
| c | `pdf-probe\|oss-sparksuite-invoice\|p1\|2023#2\|dx` | 1 | -0.23 -> -1.73 | \|run\| 2.307 > \|N0\| 0: vellora's layers made the word worse than raw Blitz |
| c | `pdf-probe\|oss-sparksuite-invoice\|p1\|Acme#1\|dx` | 1 | -0.23 -> -1.73 | \|run\| 2.307 > \|N0\| 0: vellora's layers made the word worse than raw Blitz |
| c | `pdf-probe\|oss-sparksuite-invoice\|p1\|Corp.#1\|dx` | 1 | -0.23 -> -1.73 | \|run\| 2.307 > \|N0\| 0: vellora's layers made the word worse than raw Blitz |
| c | `pdf-probe\|oss-sparksuite-invoice\|p1\|John#1\|dx` | 1 | -0.22 -> -1.72 | \|run\| 2.293 > \|N0\| 0.008: vellora's layers made the word worse than raw Blitz |
| c | `pdf-probe\|oss-sparksuite-invoice\|p1\|Doe#1\|dx` | 1 | -0.22 -> -1.72 | \|run\| 2.293 > \|N0\| 0.008: vellora's layers made the word worse than raw Blitz |
| c | `pdf-probe\|oss-sparksuite-invoice\|p1\|john@example.com#1\|dx` | 1 | -0.23 -> -1.73 | \|run\| 2.307 > \|N0\| 0: vellora's layers made the word worse than raw Blitz |
| none | `text-stress-ptbr: 5 words` | 5 |  | the Chrome word maps to no layout-diff run (no layer vector) |

