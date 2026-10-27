# c02: collapsed-border compensation, gated run and DEBT shrink (2026-10-27)

Branch `phasec/02-collapse-comp` (from `phasec/01-drift-cause` 195e950). Code at 6c0e2e3. Every
number below comes from ONE run, `run-all-c02-20261027T231548Z-blitz-0.3.0-beta.4-vellora-6c0e2e3`
(durable copy under `~/Repositories/vellora-fidelity-runs/`; `<RUN>` below). Environment: darwin
27.0.0 arm64 (macOS 27.0.1, Apple M5 Pro), Node v22.23.2, rustc 1.96.0, Chrome for Testing
155.0.8059.85, tools image `vellora-fidelity-tools:baseline-beta4` (c405e06c), WPT 9d8aceec.
Local macOS data: INDICATIVE.

```
node fidelity/run-all.mjs --gate --main --chrome <CfT 155.0.8059.85> \
  --baseline fidelity/baselines/port/10-integration \
  --chrome-from <10-tip run copy>/wpt/results.json \
  --tools-image vellora-fidelity-tools:baseline-beta4 --out fidelity/results/run-all/c02
# exit 3. Its own report used the 10-integration ledger: 911 GATE-D7 problems (every key's
# `measured` belonged to that run), so the ledger was shrunk from this run (below) and the run
# re-gated post-hoc (no re-render):
node fidelity/gate/run.mjs --baseline fidelity/baselines/port/10-integration --run <RUN> \
  --head fidelity/baselines/port/00-start --pin fidelity/baselines/pin --layout-from <RUN> \
  --debt fidelity/baselines/port/DEBT.json --step 11-collapse-comp --out <scratch>/regate
# exit 3 -> gate-report-c02.{json.gz,md}
```

Two earlier runs: on 6ca426d, stopped during the oracles step after WPT showed 3 lost clean passes
(RTL edge paint, unstretched-cell paint: fixed in 73b3737; only its WPT output was kept, not in
the durable store); and a complete run on 73b3737 (`run-all-c02a-20261027T225551Z-...`, durable
store), whose 769 pdf-probe regressions led to the whole-px edge shares and the cell-height
minimum of 6c0e2e3.

## Verdict: FAIL

| view | result |
|---|---|
| vs port/10-integration (previous link) | gating **127**: all `text-stress-ptbr` pdf-probe words, I1 crossings (dy from -0.4..-34.1 pt to +1.0..+1.9 pt); improvement 1911, within-tolerance 677, 17 lost FLAGGED WPT passes (reported) |
| head vs port/00-start | gating **88** (head-regression), debt 180, declared 10 |
| pin view vs baselines/pin | (a) 0, (b) 93, (c) **193**, declared 10: merge to main BLOCKED |
| ledger | 10 entries, 180 keys, 0 problems (`debt.mjs check`, base = merge base with main: absent) |
| gate canaries | caught (run-all summary: 35/35 detection canaries) |

The 127: CONFIRMED residual, not borders. Chrome floors each length to LayoutUnit (1/64 px): 10
table rows with `padding: 1mm` are 275.3125 px in Chrome 155 against 275.5905 in Blitz (probe, this
date). The `table.extrato` rows add about 0.04 px each, 6.5 px over the continuous flow and up to
1.9 pt within a page. The retired 2 px raise had pushed the same words 0.4 to 34 pt ABOVE Chrome.

## Pin view (c) 193, classified (`pin-classification.json`)

| route | items | what |
|---|---|---|
| b-provable | 80 | pdf-probe words whose vector passes (b): invoice 35, boleto 30, text-stress-ptbr 9, danfe 6 |
| b | 27 | words debt-populate would enter (invoice 13, text-stress 8, receipt 6): NEW keys, refused (the ledger may only shrink) |
| c | 16 | `oss-sparksuite-invoice` dx (PDF byte-identical to 10-integration's) |
| none | 70 | 32 WPT pass -> fail vs pin (this run records no raw-Blitz outcome; the 10-tip run's raw-Blitz render fails all 32 the same way, so they are b-provable by GATE-A3 (b) on that evidence, UNVERIFIED at this commit), 36 text-stress-ptbr words and 2 invoice words with no usable vector |

Of 10-final's 103 b-provable: 38 words are no longer worse than the pin, 39 words are still (c)
b-provable, and 26 WPT tests are unchanged (raw Blitz fails them).

## DEBT shrink (`debt-shrink.json`)

`debt-populate.mjs` over the no-ledger re-gate (`gate-report-c02-nodebt.json.gz`, head gating
268) with this run's vectors proposed 13 entries / 221 keys. That proposal was restricted to keys
the previous ledger covered, as a key or in its listed page scope, and no ceiling could rise. The
result: 27 -> 10 entries, 1026 -> 180 keys, 55 ceilings lowered, 0 raised, 41 new keys not entered.
Each removed key has a `closed[]` record in DEBT.json. 848 are no head item at all, and 7 have a
vector that no longer passes (b), so they stay gating. The text-stress page-scope entry is gone:
the fixture prints 7 pages like Chrome.

Rule tension, for the orchestrator: rule iii (`debt.mjs` transitionProblems) removes a key only
at its `closesAt` step or when the key vanished. Checked against the 10-integration ledger
(`--base`), the 855 removals are 855 problems. Against the configured base (merge base with main,
no ledger) the shrunk ledger has 0 problems and the old one 911. The removals follow the
instruction "remove keys now within tolerance".

## Per-document aggregate vs the published pin (`visual-compare-c02.json`)

The visual-compare-20261027 `compare.py` method (PyMuPDF words, k-th occurrence matching, mm),
on this run's PDFs. For every fixture, median ≤ pin and the ≤ 1 mm share ≥ pin:

| fixture | pin median / ≤1 mm | c02 median / ≤1 mm | pages (Chrome) |
|---|---|---|---|
| invoice | 1.42 / 36.0 % | 0.21 / 93.2 % | 3 (3) |
| receipt | 5.22 / 7.9 % | 0.20 / 100 % | 2 (2) |
| boleto | 1.74 / 33.3 % | 0.29 / 100 % | 1 (1) |
| notification | 0.33 / 89.9 % | 0.23 / 100 % | 1 (1) |
| boleto-febraban | 80.66 / 13.7 % | 0.06 / 100 % | 1 (1) |
| danfe | 17.73 / 8.3 % | 0.29 / 100 % | 1 (1) |
| text-stress-ptbr | 106.44 / 1.4 % | 0.43 / 100 % | 7 (7) |
| oss-postmark-receipt | 0.62 / 40.1 % | 0.19 / 75.7 % | 1 (2) |
| oss-sparksuite-invoice | 9.82 / 0.0 % | 0.61 / 100 % | 1 (1) |

## Files

| file | content |
|---|---|
| `gate-report-c02-nodebt.json.gz` | re-gate with an empty ledger: the builder's input |
| `gate-report-c02.{json.gz,md}` | the re-gate with the shrunk DEBT.json |
| `layer-vectors-head.json.gz` | `node fidelity/gate/layer-vector.mjs --run <RUN> --keys-from <the no-ledger report>` |
| `layer-vectors-danfe-l1.json.gz` | `... --spec-anchor danfe:DANFE-L1a ... danfe:DANFE-L1d` |
| `layer-vectors-pin.json.gz` | `... --keys-from pin-c-items.json` |
| `pin-c-items.json` | the 193 pin (c) items of the re-gate, marked gating (layer-vector input) |
| `pin-classification.json` | `debt-populate.mjs ... --pin-out` over the re-gate |
| `debt-shrink.json` | removed / lowered / refused keys of the shrink |
| `visual-compare-c02.json` | the per-document aggregate above |
