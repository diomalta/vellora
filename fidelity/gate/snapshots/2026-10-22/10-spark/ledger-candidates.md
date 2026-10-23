# Ledger candidates (fidelity/gate/ledger-candidates.mjs)

Command: `node fidelity/gate/ledger-candidates.mjs --report ~/.cache/vellora-fidelity/run-all-10-spark-20261023T002146Z/gate/gate-report.json --layout-from ~/.cache/vellora-fidelity/run-all-10-spark-20261023T002146Z --head-wpt ~/.cache/vellora-fidelity/run-all-s1c-00-start-20261021T074902Z/wpt/results.json --pin-wpt ~/.cache/vellora-fidelity/run-all-pin-20261021T054154Z/wpt/results.json --raw-wpt ~/.cache/vellora-fidelity/run-all-10-spark-20261023T002146Z/wpt/results.json --out <scratch>/candidates`; date 2026-10-23T00:40:26.130Z. Candidates, not verdicts: the gate's formal classes are (a) a class-a acceptance of the step, (b) a DEBT.json entry, (c) the rest. Local macOS data: INDICATIVE.

## head view vs fidelity/baselines/port/00-start: 1200 uncovered items

| candidate | items |
|---|---|
| none | 53 |
| b | 972 |
| c | 30 |
| a | 1 |
| b-page | 144 |

| check x candidate | items |
|---|---|
| value none | 4 |
| wpt b | 7 |
| wpt c | 30 |
| wpt a | 1 |
| pdf-probe b | 965 |
| pdf-probe none | 49 |
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
| receipt b | 31 |
| text-stress-ptbr b | 26 |
| text-stress-ptbr b-page | 144 |
| text-stress-ptbr none | 5 |
| wpt a | 1 |
| wpt b | 7 |
| wpt c | 30 |

### No possible (a)/(b) classification yet (83: c 30, none 53)

| candidate | item (or group) | n | before -> after | why |
|---|---|---|---|---|
| none | `danfe\|DANFE-L1a\|corpus\|\|criterion#1\|posErrMm` | 1 | 1.56 -> 2.09 | 04-block-offset compensating-drift: needs a per-item layer vector of the anchor behind this aggregate metric |
| none | `danfe\|DANFE-L1b\|corpus\|\|criterion#1\|posErrMm` | 1 | 3.15 -> 3.68 | 04-block-offset compensating-drift: needs a per-item layer vector of the anchor behind this aggregate metric |
| none | `danfe\|DANFE-L1c\|corpus\|\|criterion#1\|posErrMm` | 1 | 4.71 -> 5.24 | 04-block-offset compensating-drift: needs a per-item layer vector of the anchor behind this aggregate metric |
| none | `danfe\|DANFE-L1d\|corpus\|\|criterion#1\|posErrMm` | 1 | 5.96 -> 6.49 | 04-block-offset compensating-drift: needs a per-item layer vector of the anchor behind this aggregate metric |
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
| none | `text-stress-ptbr: 5 words` | 5 |  | the Chrome word maps to no layout-diff run (no layer vector) |

## pin view vs fidelity/baselines/pin: 873 uncovered items

| candidate | items |
|---|---|
| none | 56 |
| b | 697 |
| c | 30 |
| a | 1 |
| b-page | 89 |

| check x candidate | items |
|---|---|
| value none | 5 |
| wpt b | 31 |
| wpt c | 14 |
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
| wpt c | 14 |

### No possible (a)/(b) classification yet (86: c 30, none 56)

| candidate | item (or group) | n | before -> after | why |
|---|---|---|---|---|
| none | `danfe\|DANFE-M1\|corpus\|\|criterion#1\|excessB` | 1 | 8.552 -> 24.173 | 01-pagination-gaps value-compensating-drift: needs a per-item layer vector of the anchor behind this aggregate metric |
| none | `danfe\|DANFE-L1a\|corpus\|\|criterion#1\|posErrMm` | 1 | 1.56 -> 2.09 | 04-block-offset compensating-drift: needs a per-item layer vector of the anchor behind this aggregate metric |
| none | `danfe\|DANFE-L1b\|corpus\|\|criterion#1\|posErrMm` | 1 | 3.15 -> 3.68 | 04-block-offset compensating-drift: needs a per-item layer vector of the anchor behind this aggregate metric |
| none | `danfe\|DANFE-L1c\|corpus\|\|criterion#1\|posErrMm` | 1 | 4.71 -> 5.24 | 04-block-offset compensating-drift: needs a per-item layer vector of the anchor behind this aggregate metric |
| none | `danfe\|DANFE-L1d\|corpus\|\|criterion#1\|posErrMm` | 1 | 5.96 -> 6.49 | 04-block-offset compensating-drift: needs a per-item layer vector of the anchor behind this aggregate metric |
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

