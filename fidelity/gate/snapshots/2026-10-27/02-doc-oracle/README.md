# Phase C step 02: document-level aggregate, re-score of the 10-integration run

Local macOS arm64 run, so these numbers are INDICATIVE. Node v22.23.2, PyMuPDF 1.28.2, dated 2026-10-27.

- Run: tip run 20261023T004510Z, phaseb/10-tip a293cf5 with Blitz 0.3.0-beta.4. Its run-store copy is
  `run-all-10-tip-20261023T004536Z-blitz-0.3.0-beta.4-vellora-a293cf5`. Chrome 155.0.8059.85 printed its
  reference PDFs.
- Run side: `node fidelity/oracles/doc-aggregate.mjs --run <tip copy> --out <file>`. The output is
  `tip-10-integration.doc-aggregate.json`.
- Pin side: `fidelity/baselines/pin/doc-aggregate.json`, rendered by the published engine v0.2.0
  (5810062). Its provenance and noise data are in that file.
- Gate: `node fidelity/gate/run.mjs --baseline fidelity/baselines/port/09-review-fixes --run <tip copy>
  --accept fidelity/gate/snapshots/2026-10-27/10-debt/accepted.json --head fidelity/baselines/port/00-start
  --pin fidelity/baselines/pin --layout-from <tip copy> --debt fidelity/baselines/port/DEBT.json --step
  10-integration --doc-aggregate <file> --contract`. The DOC section of its report is in
  `gate-contract.doc-aggregate.md`.

Results (CONFIRMED by these commands):

| flag | verdict | gating |
|---|---|---|
| none | PASS (DOC items are only reported) | 0 |
| `--main` | FAIL | 168 = 165 pin-c + 3 DOC-1 |
| `--contract` | FAIL | 171 = 165 pin-c + 3 DOC-1 + 3 DOC-4 |

Exit-contract condition 2 fails on 3 items in 2 fixtures:
- boleto: the median goes from 1.77 to 2.78 mm, and the share within 1 mm drops from 32 to 22.9 %.
- notification: the share within 1 mm drops from 86.7 to 63.7 %.

Condition 3 fails on 3 fixtures:
- danfe: 2 pages, Chrome has 1.
- text-stress-ptbr: 8 pages, Chrome has 7.
- oss-postmark-receipt: 1 page, Chrome has 2.

The boleto and notification failures come from the collapsed-table row drift that phasec/01 diagnosed. That is the target of the next step, not a defect of this oracle.
