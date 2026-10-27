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
| gate canaries (GATE-K2) | 23/23 caught in the re-gate (the run's oracle canaries: 35/35 detection caught) |

The 127 are not border-related. CONFIRMED: the `table.extrato` rows are each about 0.04 px
taller than Chrome's (layout-diff N0u dh), 6.5 px over the continuous flow and up to 1.9 pt within
a page. CONFIRMED mechanism for part of it: Chrome floors lengths to LayoutUnit (1/64 px); 10 table
rows with `padding: 1mm` are 275.3125 px in Chrome 155 against 275.5905 in Blitz (probe, this
date), 0.028 px per row. The remaining ~0.01 px per row is UNVERIFIED. The retired 2 px raise had
put the same words 0.4 to 34 pt ABOVE Chrome.

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

## c02-tip: compensation + document-level oracle, one gated run (2026-10-27)

Branch `phasec/02-tip` = `phasec/02-collapse-comp` f4da7fc merged (`--no-ff`) with
`phasec/02-doc-oracle` e5bf699: merge commit 4b7bcd8. The merge changes only `fidelity/`; product
code is still 6c0e2e3's and `fidelity/baselines/port/DEBT.json` is unchanged. Run
`20261027T233913Z` (durable copy `run-all-c02-tip-20261027T233913Z-blitz-0.3.0-beta.4-vellora-4b7bcd8`
under `~/Repositories/vellora-fidelity-runs/`; `<RUN>` below). Same environment as above (darwin
27.0.0 arm64, Apple M5 Pro, Node v22.23.2, rustc 1.96.0, Chrome for Testing 155.0.8059.85, tools image
c405e06c, PyMuPDF 1.28.2). Local macOS data: INDICATIVE.

```
node fidelity/run-all.mjs --gate --main --chrome <CfT 155.0.8059.85> \
  --baseline fidelity/baselines/port/10-integration \
  --chrome-from <10-tip run copy>/wpt/results.json \
  --tools-image vellora-fidelity-tools:baseline-beta4 --out fidelity/results/run-all/c02-tip
# exit 3 -> gate-report-c02-tip.json.gz (the run's own gate, committed ledger, no --step)
node fidelity/gate/run.mjs --baseline fidelity/baselines/port/10-integration --run <RUN> \
  --head fidelity/baselines/port/00-start --pin fidelity/baselines/pin --layout-from <RUN> \
  --debt fidelity/baselines/port/DEBT.json --step 11-collapse-comp \
  --doc-aggregate <RUN>/doc-aggregate/summary.json --contract --out <RUN>/gate-contract
# exit 3 -> gate-report-c02-tip-contract.{json.gz,md}
```

Reproduction check (CONFIRMED): all 94 product PDFs of the run (layout-diff, pdf-probe, corpus,
oracles, PDF/A) are byte-identical (sha256) to the c02 run's. The only 4 differing PDFs are the
pdf-probe detection canaries' mutated copies (`oracles/fixtures/canaries/pdf-probe/*`); why their
bytes differ is UNVERIFIED (they are PyMuPDF rewrites, not renders). Every non-DOC gate count
below equals the c02 re-gate's.

### Verdict: FAIL

| view | `--main` (run's own gate) | `--contract` (re-gate) |
|---|---|---|
| gating total | **294** = 127 regression + 167 pin-c | **295** = 127 + 167 + 1 DOC-4 |
| vs port/10-integration | regression 127 (all `text-stress-ptbr` pdf-probe dy, I1 crossings, see above); improvement 1911, newly-measured 1123, within-tolerance 677, 17 lost FLAGGED WPT passes (reported) | same |
| head vs port/00-start | head-regression **88**, debt 180, declared 10 | same |
| pin view | (a) 0, (b) 93, (c) **193**, declared 10: merge to main BLOCKED | same |
| ledger | 10 entries, "no problem" | 10 entries, "no problem" |
| doc-aggregate (DOC-1..4) | PASS: DOC-1/2/3 0 items; DOC-4 listed, not gating | FAIL: condition 2 PASS, condition 3 FAIL (`doc-aggregate\|oss-postmark-receipt\|pages` 1 vs Chrome 2) |
| gate canaries (GATE-K2) | 29/29 caught (23 + 6 DOC) | 29/29 |
| oracle canaries | 35/35 detection caught (+8 measurement-only) | - |
| WPT | 46.84 % of 8047 pass (same as c02) | - |

The 167 pin-c gating items are the 193 pin (c) items minus the 26 that are already counted as
vs-10-integration regressions: 135 pdf-probe words and 32 WPT tests.

### Pin view (c) 193 by kind (`pin-classification-c02-tip.json`)

`layer-vector.mjs --run fidelity/results/run-all/c02-tip --keys-from <the 193 (c) items of the
contract re-gate>` then `debt-populate.mjs --report <RUN>/gate-contract/gate-report.json --run
fidelity/results/run-all/c02-tip --vectors <lv-pin> --step 11-collapse-comp --pin-out ...`. The
193 keys, their values and every item's route are identical to `pin-classification.json` above
(CONFIRMED, key-by-key comparison):

| route | items | by fixture |
|---|---|---|
| b-provable | 80 | invoice 35, boleto 30, text-stress-ptbr 9, danfe 6 |
| b | 27 | invoice 13, text-stress-ptbr 8, receipt 6 (new keys: the ledger may only shrink) |
| c | 16 | oss-sparksuite-invoice dx |
| none | 70 | 32 WPT (no raw-Blitz outcome in this run), 36 text-stress-ptbr + 2 invoice words without a usable vector |

Contract condition 1 (pin `--main` 0 (c), the b-provable fixed rather than entered) is NOT met.

### DEBT changes

None. `fidelity/baselines/port/DEBT.json` is the shrunk ledger committed at f4da7fc (10 entries,
180 keys); this run raises no ledger problem in either gate.

### Per-document aggregate: pin vs 10-integration vs c02-tip

The committed oracle (`fidelity/oracles/doc-aggregate.mjs`, ACCEPTANCE.md section 9; NOT the
compare.py method of the table above, so the numbers differ slightly). Pin =
`fidelity/baselines/pin/doc-aggregate.json` (v0.2.0, 5810062, Blitz 2003ba5; the run's 9 native.html
match its recorded sha256). 10-integration = `../02-doc-oracle/tip-10-integration.doc-aggregate.json`.
c02-tip = `doc-aggregate-c02-tip.json`. Each cell is pin / 10-integration / c02-tip.

| fixture | median mm | p90 mm | <= 1 mm % | missing words | pages (Chrome) |
|---|---|---|---|---|---|
| invoice | 1.46 / 0.41 / 0.19 | 1.73 / 0.91 / 0.64 | 36 / 93.2 / 93.2 | 0 / 0 / 0 | 3 / 3 / 3 (3) |
| receipt | 5.18 / 0.16 / 0.15 | 77 / 0.92 / 0.4 | 7.9 / 100 / 100 | 0 / 0 / 0 | 2 / 2 / 2 (2) |
| boleto | 1.77 / 2.78 / 0.39 | 14.09 / 7.01 / 0.46 | 32 / 22.9 / 100 | 0 / 0 / 0 | 1 / 1 / 1 (1) |
| notification | 0.41 / 0.2 / 0.17 | 1.02 / 1.72 / 0.25 | 86.7 / 63.7 / 100 | 4 / 0 / 0 | 1 / 1 / 1 (1) |
| boleto-febraban | 80.7 / 0.9 / 0.07 | 82.32 / 1.68 / 0.3 | 15.6 / 52.4 / 100 | 8 / 0 / 0 | 1 / 1 / 1 (1) |
| danfe | 17.68 / 3.19 / 0.26 | 37.17 / 6.44 / 0.46 | 8.9 / 19 / 100 | 1 / 0 / 0 | 2 / 2 / 1 (1) |
| text-stress-ptbr | 106.22 / 95.11 / 0.4 | 221.05 / 218.29 / 0.66 | 1.4 / 16.3 / 100 | 7 / 7 / 0 | 8 / 8 / 7 (7) |
| oss-sparksuite-invoice | 9.87 / 0.61 / 0.61 | 10.95 / 0.62 / 0.62 | 0 / 100 / 100 | 0 / 0 / 0 | 1 / 1 / 1 (1) |
| oss-postmark-receipt | 0.66 / 0.19 / 0.19 | 18.19 / 0.32 / 0.32 | 40 / 75 / 75 | 39 / 39 / 39 | 1 / 1 / 1 (2) |

Contract condition 2: MET on all 9 fixtures (DOC-1 0 items; tolerance median 0.01 mm, share 0.1 pp,
missing 0). Condition 3: 8 of 9; `oss-postmark-receipt` prints 1 page, Chrome 2 (PyMuPDF words
per page: Chrome 139 + 38, vellora 140; how the 39 missing words split between the pages is
UNVERIFIED). Side-by-side images of all pages (Chrome | pin | c02-tip,
`pdftoppm -r 55 -jpeg`) are in the run store's `visual-compare-c02/out/compare.html` (not committed).

### Files (c02-tip)

| file | content |
|---|---|
| `gate-report-c02-tip.json.gz` | the run's own gate (`--main`) |
| `gate-report-c02-tip-contract.{json.gz,md}` | the `--contract` re-gate |
| `doc-aggregate-c02-tip.json` | `<RUN>/doc-aggregate/summary.json` |
| `pin-classification-c02-tip.json` | `debt-populate.mjs ... --pin-out` over the contract re-gate |
