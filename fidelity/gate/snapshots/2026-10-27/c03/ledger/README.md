# Phase C 03: ledger rule iii (branch phasec/03-ledger), 2026-10-27

Local macOS data: INDICATIVE (darwin 27.0.0 arm64, Node v22.23.2, rustc 1.96.0, Chrome for Testing
155.0.8059.85 for the run, tools image vellora-fidelity-tools:baseline-beta4 c405e06c).

## Why

Verify of phasec/02 (finding 1, CONFIRMED): the step-02 shrink of DEBT.json (27 entries / 1026 keys
-> 10 / 180) was never checked by rule iii. The gate's base was DEBT.json at `git merge-base HEAD
main`; main has no ledger, so it was a "first population" and nothing was checked. Checked against the
10-integration ledger it gave 855 problems: 848 removed keys whose items were fixed, plus 7 WPT keys
(DEBT-10-wpt-1/2/3) removed while they still failed. The step-02 populate also reused DEBT-10-* ids
for other keys (for example, DEBT-10-danfe-1 then held the keys of the old DEBT-10-danfe-2).

## What changed (gate/debt.mjs, GATE-D3; ACCEPTANCE.md)

- **Fixed removal.** A key may now leave before its closesAt if it is FIXED. It needs a closed[]
  record `{ id, key, step, reason, fixed: true, runId, headComparison: { class, before, after } }`.
  The record is evidence. The proof is the run's own head comparison, checked again on every gated
  run.
- **Still failing.** A key whose item still gates against the head is never removed by any route,
  closesAt included. Only its ceiling may be lowered when the value is better.
- **Ids.** An id is never reused for a different thing:
  - an id the base has may hold only keys (and listed scope keys) that the base entry of that id
    held;
  - an id the base closed stays retired.
- **History.** closed[] is append-only, and a closed key never re-enters (ledgerProblems).
- **Base.** The base is DEBT.json at the merge base. When main has no ledger, it is the frozen
  ledger named by the committed pointer `fidelity/baselines/port/DEBT-BASE.json`, which is
  sha256-checked; a mismatch REFUSES. Only when neither exists is it a first population. The
  pointer names `10-final/DEBT-10-integration.json` (sha256 929ba96d...). That file is
  byte-identical to DEBT.json at phaseb/10-final-verify af1bd4f (CONFIRMED,
  `git show af1bd4f:fidelity/baselines/port/DEBT.json | shasum -a 256`).
- **debt-populate.mjs.** Ids derive from `--step` (`DEBT-<NN>-*`). They skip every id the base or
  the committed ledger has used (entries and closed[]). Keys the base holds keep their base id.
- **DEBT.json** was rebuilt by `scripts/rebuild-ledger.mjs` over the c02 run copy
  (run-all-c02-20261027T231548Z):
  - Kept keys are back under their 10-integration ids.
  - The 9 keys that were listed scope keys of DEBT-10-text-stress-ptbr-page-scope take fresh ids,
    DEBT-11-text-stress-ptbr-1 (5 keys) and DEBT-11-text-stress-ptbr-2 (4 keys).
  - DEBT-10-wpt-1/2/3 (7 keys) are restored verbatim. Their raw-Blitz evidence is still the 10-tip
    run's; it was not re-measured at c02.
  - The 848 closed[] records carry fixed: true, run 20261027T231548Z, and the head comparison item
    from that run. Their classes: improvement 456, within-tolerance 321, none 71.
  - Result: 15 entries, 187 keys, 848 closed.
- **Canaries (GATE-K2): 29 -> 32.** The new ones are: a still-failing key removed, a fixed key
  removed with evidence, and a reused id. Each is shown uncaught when its rule is broken
  (gate/test/canaries.test.mjs).
- **`accepted.json`.** It holds the step-11 class-a acceptances: the 3 oss-postmark-receipt
  acceptances of 10-integration, re-checked with PyMuPDF rawdict on the c02-tip PDFs (same spans
  as at 10-integration). The WPT acceptance monolithic-overflow-014 is NOT carried, so it still
  gates.

## Post-hoc re-gate of run 20261027T233913Z (c02-tip copy), no new run

```sh
node fidelity/gate/run.mjs --baseline fidelity/baselines/port/10-integration --run <RUN> \
  --head fidelity/baselines/port/00-start --pin fidelity/baselines/pin --layout-from <RUN> \
  --debt fidelity/baselines/port/DEBT.json --step 11-collapse-comp \
  --accept fidelity/gate/snapshots/2026-10-27/c03/ledger/accepted.json \
  --doc-aggregate <RUN>/doc-aggregate/summary.json --contract --out <out>    # exit 3
```

Here `<RUN>` = `~/Repositories/vellora-fidelity-runs/run-all-c02-tip-20261027T233913Z-blitz-0.3.0-beta.4-vellora-4b7bcd8`.
The report is `gate-report-c03-contract.{json.gz,md}`, and the uncompressed copy is in
`~/Repositories/vellora-fidelity-runs/c03-ledger-regate-20261027/`. The ledger base was resolved
through the pointer (no `--debt-base`). The step-02 numbers come from
`c02/gate-report-c02-tip-contract.json.gz` (step-02 code, no accept file).

| | step 02 (9e06be6) | step 03 (this) |
|---|---|---|
| ledger | 10 entries / 180 keys; base "first population" (unchecked) | 15 / 187; base = pointer -> 10-integration; 0 problems |
| gating | 295 | 290 |
| vs 10-integration: regression | 127 (all text-stress-ptbr I1) | 127 (unchanged) |
| head (00-start): head-regression | 88 | 78 |
| head: debt / accepted | 180 / 0 | 187 / 3 |
| pin (a) / (b) / (c) | 0 / 93 / 193 | 0 / 98 / 188 |
| doc aggregate | condition 2 PASS, condition 3 FAIL | same |
| gate canaries | 29/29 | 32/32 |

Notes on the changes:

- **Head-regression, 88 -> 78.** 7 WPT keys are debt again, and 3 postmark items are class-a
  accepted.
  - Left: text-stress-ptbr 50, receipt 14, invoice 13, and WPT monolithic-overflow-014 (1).
- **Pin (c), 193 -> 188.** 5 of the 7 restored WPT keys are also pin items. They move to (b). That
  is pre-existing debt restored, NOT a fix.
  - Left by route: WPT 27, invoice 50, text-stress-ptbr 53, boleto 30, oss-sparksuite 16, danfe 6,
    receipt 6.
- **Control.** The step-02 ledger fails under the new rule (`node fidelity/gate/debt.mjs check
  --ledger <9e06be6 DEBT.json> --base 10-final/DEBT-10-integration.json --step 11-collapse-comp
  --report <c02-tip contract report>`):
  - 848 removals with no fixed evidence;
  - 7 "still fails";
  - 6 "id reused" (danfe-1, danfe-2, danfe-3, notification-2, receipt-1, text-stress-ptbr-1).
