# Phase C 05 tip: merge of the step-05 branches + one gated run (2026-10-28)

Branch `phasec/05-tip` from `phasec/04-verify` 3545ce4. Local macOS (darwin 27.0.0 arm64, macOS
27.0.1, Apple M5 Pro), Node v22.23.2, rustc 1.96.0, Chrome for Testing 155.0.8059.85, tools image
`vellora-fidelity-tools:baseline-beta4` (c405e06c), veraPDF image 45b2f7cd, WPT 9d8aceec, Blitz
crates.io 0.3.0-beta.4. Every number here is INDICATIVE.

The step-05 branch records stay where their workers wrote them: the probe's record is the second
half of this file (unchanged, from "Phase C 05 probe" on), `float-rule/` and `../c05-multicol/`.
The probe's acceptance file, committed by it as `c05/accepted.json`, is now
`accepted-probe.json`. The step's `accepted.json` is built from it (below).

## Merges (each `--no-ff`, in this order)

| branch | tip | what it brings | conflicts |
|---|---|---|---|
| `phasec/05-probe` | bf092bb | pin false-pass probe of the last 5 pin (c) items, the hanging-punctuation class-a entry, `shrink-ledger.mjs --label`, the multicol strict-mode record | none |
| `phasec/05-float-rule` | 5f94e19 | the no-wrap half of `float_avoidance_fixups` follows Chrome 155's rule (orchestrator decision (b)); float-nowrap-8 proposal | none |
| `phasec/05-multicol` | 8eb9d3c | multi-column layout in vellora (`lay_out_multicol` in blitz_engine.rs, `multicol.rs`, column breaks in `break_css`, COMPATIBILITY.md row) | none (auto-merged `blitz_engine.rs`, `raw_blitz_tests.rs`) |

Not merged: `phasec/05-multicol-reject-proposal` (be7a503, gate-facing, superseded by the
multicol layout; the probe's section 5 below has its measured effect).

Checks: `npm run build`, `npm test` (cargo 409 passed, vitest 286 passed at a17ee21), `npm run
lint`, `npm --prefix fidelity test` all green after each merge commit (1014ccb, eebb0ec, a17ee21)
and at 16fa504.

**Composition check, floats x multicol (CONFIRMED).** The multicol passes run before the float
fix-ups in `resolve_and_walk`. The float-rule branch's 24 Chrome repros
(`~/Repositories/vellora-fidelity-runs/c05-float-rule/repro`), rendered with `renderPdf` strict
by the float-rule build and by the merged build: 24/24 PDFs byte-identical.

## Measured before the run (not gated)

Full WPT `node fidelity/wpt/run.mjs --raw --chrome-from <10-tip>/wpt/results.json --expectations
none` on a17ee21 (copy `~/Repositories/vellora-fidelity-runs/c05-tip/w1`, run
20261028T061824Z): **4414** passes (c04 4157). Against the c04 gated run: 265 fail -> pass (exactly
the multicol branch's 265 gains) and 8 pass -> fail (exactly float-nowrap-7/-8 from float-rule
plus the multicol branch's 6), nothing else. table-border-007 passes (rawOutcome fail, no ink
flag), so its class-a entry was dropped from this step's acceptance file (precedent:
monolithic-overflow-014 at c04).

## accepted.json (step 14-phase-c-05-tip)

13 class-a entries, built by `scripts/build-accepted.py` from `accepted-probe.json` (13: c04's 12
with the page-name-flex reason text corrected, plus hanging-punctuation-first-002) plus
`float-rule/accepted-proposed.json` (float-nowrap-8), entries verbatim, minus table-border-007.
Nothing entered for ruby-003 or the lost css/css-break passes (below). Unused against the
previous link: 10 (the 2 postmark pairing entries, the 6 css/CSS2/pagination entries,
hanging-punctuation-first-002 and float-nowrap-8; the last two are used in the pin view).

## The gated run

```sh
node fidelity/run-all.mjs --gate --main --contract --raw --chrome <Chrome for Testing 155.0.8059.85> \
  --baseline fidelity/baselines/port/10-integration \
  --chrome-from ~/Repositories/vellora-fidelity-runs/run-all-10-tip-20261023T004536Z-blitz-0.3.0-beta.4-vellora-a293cf5/wpt/results.json \
  --tools-image vellora-fidelity-tools:baseline-beta4 \
  --accept fidelity/gate/snapshots/2026-10-28/c05/accepted.json --step 14-phase-c-05-tip \
  --out fidelity/results/run-all/c05-tip
```

- **A first launch was REFUSED (disclosed).** Run 20261028T062149Z on the same commit: this fresh
  worktree had no `fidelity/.venv` and no `fidelity/wpt` / `fidelity/oracles` node_modules, so
  3 preflight lines failed, the oracle, pdf-probe, doc-aggregate and paint-probe steps did not
  run, and the gate REFUSED ("a gated run must not skip them"). There was no verdict. Copy:
  `~/Repositories/vellora-fidelity-runs/run-all-c05-tip-20261028T062149Z-REFUSED-env-incomplete`
  (the c03 tip had the same kind of refusal). The venv was then installed from the two hash-locked
  requirements files (its `uv pip freeze` equals the c04 merge worktree's) and the npm packages
  with `npm ci`. All 11 preflight lines were ok before the run below.
- **runId 20261028T062527Z**, git 16fa504 (0 dirty), exit 3. Every step ok (23/23): code-checks,
  wpt (exit 1 = the ratchet against 10-integration, decided by the gate), crashtests 239/239,
  corpus, oracles-fixtures, oracles-corpus incl. PDF/A-2b qpdf + veraPDF, layout-diff, pdf-probe,
  pdf-probe-suite, doc-aggregate, paint-probe. Canaries 35/35 detection caught (+8
  measurement-only). Copy:
  `~/Repositories/vellora-fidelity-runs/run-all-c05-tip-20261028T062527Z-blitz-0.3.0-beta.4-vellora-16fa504`
  (with `gate-contract/`).
- WPT 4414 passes; outcomes identical to the pre-run `w1` (0 changes over 8047).
- PDFs (CONFIRMED by sha256, `c05-tip/tools/pdfcmp.py`): 94 of the 98 vellora PDFs under the run
  outside `wpt/` (every fixture, corpus, probe and oracle render) are byte-identical to the c04 run
  copy's. The other 4 are derived canary PDFs
  (`oracles/fixtures/canaries/pdf-probe/pdf-probe-{ascent,delete-word,off-page,shift-line}.pdf`,
  mutations of an identical input) differ in bytes; all 43 canary result rows equal c04's.
  HYPOTHESIS: the mutation writer is not byte-deterministic (c03 -> c04 also changed them).
- doc-aggregate (`doc-aggregate-c05-tip.json`) and paint-probe (`paint-probe-c05-tip.json`):
  equal to c04 in every metric on 9/9 (input hashes aside).
- Ledger: `shrink-ledger.mjs --run <RUN> --step 14-phase-c-05-tip --label "Phase C 05 tip (probe +
  float-rule + multicol merge)" --accept .../c05/accepted.json --ledger <DEBT.json at 3545ce4>
  --out fidelity/baselines/port/DEBT.json` -> 2 entries / 5 keys, all kept (still gating against
  port/00-start), 0 closed, 0 ceilings lowered; only the note grew. Entries and closed[] are
  deep-equal to the c04 ledger, so it was not frozen again. `debt.mjs check --base
  .../10-final/DEBT-10-integration.json --report <RUN>/gate/gate-report.json --head-dir
  fidelity/baselines/port/00-start --run <RUN>`: **0 problems**.
- Post-hoc contract re-gate (c03/c04 command, `--step 14-phase-c-05-tip`, this directory's
  accepted.json, the shrunk ledger): exit 3, counts identical to the run's own gate. Reports
  `gate-report-c05-tip-contract.{json.gz,md}`; the run's own `gate-report-c05-tip-run.json.gz`.

## Exit contract, per condition (post-hoc contract re-gate)

| condition | status | numbers |
|---|---|---|
| (1) pin --main: 0 (c) | **NOT MET** | pin (a) 5, (b) 4, (c) **6**, declared 10. 0 fixture words. The 6 are listed below |
| (2) doc aggregate >= pin per fixture | MET 9/9 | docRegressions 0; table below |
| (3) pages == Chrome | MET 9/9 | contractPagesFailing 0 |
| (4) previous-link ratchets | **NOT MET** | vs 10-integration: gating 6 = 5 regressions + ruby-003 (pin-c); head vs 00-start: **FAIL**, 4 head-regressions, debt 5, accepted 5 (c04: head PASS) |

Verdict FAIL, so **no baseline 11-phase-c was written** and `DEBT-BASE.json` was not moved.

**What still blocks, by key.** Chrome for Testing 155 passes all six. None is class a by GATE-A3:
each old pass is a clean pass (no ink flag, page counts equal), and no evidence shows it false.
None is in DEBT or in accepted.json.

| key | pin | 10-integration | 00-start | c05 | cause (from the branch records) |
|---|---|---|---|---|---|
| `wpt\|css/css-break/ruby-003.html` | pass | fail | fail | fail | needs ruby layout as well as multicol; Blitz has no ruby layout (probe section 1) |
| `wpt\|css/css-break/flexbox/multi-line-row-flex-fragmentation-045.html` | pass | pass | fail | fail | five forced column breaks at one flow y; the geometric slicer cuts once per y (KNOWN GAP) |
| `wpt\|css/css-break/svg-with-transform.html` | pass | pass | pass | fail | inline SVG is not painted at render time; the one-column render hid it |
| `wpt\|css/css-break/table/caption-margin-002.html` | pass | pass | pass | fail | Blitz lays `display: table-caption` out 0x0 (CONFIRMED by walk) |
| `wpt\|css/css-break/table/caption-margin-005.html` | pass | pass | pass | fail | the same markup in a wrapper (UNVERIFIED by a separate dump) |
| `wpt\|css/css-break/table/monolithic-overflow-001.tentative.html` | pass | pass | pass | fail | Blitz gives the non-cell child of a `display: table` box a 0x0 layout (CONFIRMED by walk) |

The last five are lost by the multicol merge: the pin view counts all five, the previous link all
five, the head the four that passed at 00-start. Their old passes came from the one-column layout
coinciding with Chrome's picture (`../c05-multicol/README.md`). The sixth multicol loss,
widows-orphans-021, failed at the pin, 00-start and 10-integration, so no view gates it.

Against c04 (pin (c) 5 = 054/055/058, ruby-003, hanging-punctuation-first-002):

- 054/055/058 now pass by rendering (multicol);
- hanging-punctuation-first-002 is accepted as class a (decision (a));
- float-nowrap-8 is accepted as class a (decision (b));
- table-border-007 passes by rendering.

Net: (1) went from 5 to 6 items; (4) went from "MET outside (1)" to 5 previous-link regressions
plus a head FAIL. WPT went from 4157 to 4414 passes.

## Doc aggregate (`doc-aggregate-c05-tip.json`; equal to c04 in every metric)

| fixture | pages (Chrome) | median mm | <=1 mm share | missing words |
|---|---|---|---|---|
| invoice | 3 (3) | 0.1 | 100 % | 0 |
| receipt | 2 (2) | 0.05 | 100 % | 0 |
| boleto | 1 (1) | 0.12 | 100 % | 0 |
| boleto-febraban | 1 (1) | 0.08 | 100 % | 0 |
| danfe | 1 (1) | 0.21 | 100 % | 0 |
| notification | 1 (1) | 0.01 | 100 % | 0 |
| text-stress-ptbr | 7 (7) | 0.02 | 100 % | 0 |
| oss-postmark-receipt | 2 (2) | 0.13 | 97.2 % | 2 (class-a text-shadow copy) |
| oss-sparksuite-invoice | 1 (1) | 0 | 100 % | 0 |

Visual comparison (Chrome | pin v0.2.0 | c05 tip): `~/Repositories/vellora-fidelity-runs/visual-compare-c05/out`
(+ `metrics.json`), from `fidelity/report/visual-compare.mjs` of `docs/fidelity-results` 18da08c
(`--new-key c05`, pin PDFs `doc-aggregate-20261027/pin-pdfs-v0.2.0`, sha256-checked against the
pin reference). The fixture PDFs equal c04's, so the c05 images show c04's renders.

---

# Phase C 05 probe: what the last 5 pin (c) items are (2026-10-28)

Branch `phasec/05-probe` from `phasec/04-verify` 3545ce4. No gated run was made in this step. Every
number below is from local macOS (darwin 27.0.0 arm64), Node v22.23.2, Chrome for Testing
155.0.8059.85, PyMuPDF 1.28.2, 2026-10-28, and is INDICATIVE. Probe store:
`~/Repositories/vellora-fidelity-runs/c05-probe/` (scripts, inputs, PDFs, PNGs).

The renders:

- **Published engine (pin):** v0.2.0 = 5810062, Blitz rev 2003ba5 (blitz-dom 0.3.0-alpha.5, taffy
  0.11.0-experimental-cache-fix.3, parley 0.10, stylo 0.18). It is a `git archive` export built
  with a fresh `target/` (`c05-probe/pin-src`).
- **Tip:** `phasec/04-verify` 3545ce4 (blitz 0.3.0-beta.4, taffy 0.15, parley 0.12, stylo 0.22).
- **Chrome:** CfT 155.

The WPT renders come from `fidelity/wpt/run.mjs --chrome <CfT 155> --artifacts all --keep-pdf`,
filtered to the 5 tests. The pin run used `--vellora <pin dist> --xhtml-parser html`
(`c05-probe/wpt-pin`); the tip run used the product path (`c05-probe/wpt-tip`). The pin run passed
5/5 with 0 ink flags. That equals the committed pin expectations
`baselines/wpt/blitz-2003ba5fc2d8.json`, which were produced from vellora 985b112 on the same Blitz
rev: 5/5 clean passes (CONFIRMED).

The feature-ablation variants (`c05-probe/inputs/*-nocol.html`, `*-noruby*.html`) were rendered
with `c05-probe/scripts/render-variants.mjs` (renderPdf strict, 800x600 px page, margin 0) and
`chrome-print.mjs` (the harness's screen print settings).

The pin draws every page 11.25 pt higher than Chrome and the tip: its leading `<p>` margin is lost
on the test and the reference alike. Below, "rect for rect" means after that shift.

## 1. The four multicol items: pin passes are genuine by GATE-A3, coincidental by mechanism

| test | pin test vs Chrome test | tip test | pin with the feature removed | Chrome with the feature removed | tip with the feature removed |
|---|---|---|---|---|---|
| multi-line-column-flex-fragmentation-054 | equal rect for rect: green 50x100 + 50x90 + abspos 50x10 | one flex line, 100 px wide: 100 + 10 px red gap + 90 (fail, 10000 px) | `columns` removed: same as with it (2 flex lines) | `columns` removed: one line, 100x100, gap, 100x90 | equal to Chrome rect for rect |
| ...-055 | equal rect for rect (5 green pieces) | one line (fail, 9500 px) | same as with it | one line | equal to Chrome |
| ...-058 | equal: 3 items at x 6-30.75 / 30.75-56.25 / 56.25-81 pt | 3 items stacked with 100 px gaps (fail, 40000 px) | same as with it | stacked | equal to Chrome |
| ruby-003 | equal: two contiguous 50 px inline-blocks from the box top | a 3 pt (4 px) red gap between them (fail, 800 px) | `columns` and/or `ruby`/`rt` removed: unchanged | ruby removed: second block in an overflow column (x 93-168 pt); multicol removed: annotation overflows the box top (y 25.5 pt) | ruby + multicol removed: 37.5-75 and 78-115.5 pt = Chrome rect for rect |

Notes on the table:

- 058: the pin's single green rect is three items merged by the display-list rect merge.
  CONFIRMED by a variant with items 2 and 3 in `#008001` / `#008002`: three rects at Chrome's x
  ranges.

**What the table shows (CONFIRMED on these renders):**

- The pin's test render equals Chrome's test render. It has no ink flags and equal page counts. So
  GATE-A3 (a) ("the old test render equalled the reference but not Chrome") does not apply, and no
  class-a entry is written for these four.
- The pin's render does not depend on the feature under test. Remove `columns` (or `ruby`) and
  the pin draws the same rects.
- Chrome on the same ablated markup draws what the tip draws, rect for rect.
- So the pin passed through two of its own defects, which coincide with Chrome's fragmented
  picture:
  - flex: a `flex-flow: column wrap` box with `height: auto` breaks lines at its parent's 100 px
    height. HYPOTHESIS: Taffy 0.11-experimental uses the definite available height as the line
    limit.
  - inline: no strut descent below a line of inline-blocks.
- The tip fixed both toward Chrome. That is why these tests regressed.

**Consequence:**

- To pass these four tests as Chrome does, vellora needs multi-column fragmentation:
  - column boxes;
  - `column-fill: auto`;
  - `break-before: column` (054);
  - flex fragmentation with the csswg-drafts#11520 gap suppression (054/055/058).
- ruby-003 also needs ruby layout, and needs it together with multicol: neither alone reproduces
  Chrome's picture.
- Bringing back the pin's flex or strut behaviour would make vellora differ from Chrome on content
  without multicol. That is not an option under "product target = Chrome".

## 2. hanging-punctuation-first-002: class a entered

The pin drops a line-start U+3000 whether or not the property is there (CONFIRMED). The step-4
verifier had left this UNVERIFIED.

Pin (PyMuPDF rawdict, `c05-probe/scripts/chars.py`):

- The test, the test with `hanging-punctuation: first;` deleted, and the reference all emit **no**
  U+3000 glyph.
- In all three, U+2193 is at x0 6.00 pt.

Tip:

- U+3000 at 6.00-13.50 pt, U+2193 at 36.00 pt, with and without the property.

Chrome 155:

- U+3000 at 6.00-36.00 pt, U+2193 at 36.00 pt.
- Outcome fail (265 px). CONFIRMED in this probe and in the c04 run copy.

The entry is in `accepted.json` here (orchestrator decision (a)). It starts from
`c04-text/accepted-proposed-hanging-punctuation.json` and adds the evidence above.

## 3. accepted.json

`accepted.json` (step `14-phase-c-05`) has 13 entries:

- **Carried:** the 12 entries of `c04/accepted.json`.
- **Corrected:** the page-name-flex-001/002/004 reason text. Chrome's page counts are [4, 1],
  [3, 1] and [4, 2]. The old text said "N pages for both" (step-4 verify finding 5). 004 remains a
  real gap: vellora [3, 1].
- **New:** hanging-punctuation-first-002.

`c05-probe/scripts/build-accepted.py` builds the file from the c04 inputs.

With it, pin (c) is expected to be 4 (UNVERIFIED until a re-gate): 054/055/058/ruby-003. It is
not 0.

## 4. shrink-ledger.mjs

`c03/scripts/shrink-ledger.mjs` now requires `--label "<step name>"`. The label goes into every
`closed[]` reason and into the note; the text used to be hard-coded to "Phase C 03 tip (...)". The
logic is now an exported pure `shrinkLedger()`, tested in `gate/test/shrink-ledger.test.mjs`.

Equivalence check (CONFIRMED): the c04 shrink was re-run with the new script, using:

- `--ledger c04/DEBT-c03-tip.json`
- `--run <c04 run copy>`
- `--step 13-phase-c-04`
- `--label "Phase C 04 tip (floats + text + paint + frag merge; Blitz \`floats\` feature on)"`

Its `entries` and `closed` are deep-equal to the committed `baselines/port/DEBT.json`. Only the
note's wording differs.

## 5. Multicol in strict mode, and the exact effect of rejecting it

**Today (CONFIRMED):** strict mode accepts multicol and prints it in one column.

- Neither `COMPATIBILITY.md` nor `docs/compatibility.md` mentions `columns`, `column-count` or
  `column-width`, and none of them is on a denylist.
- `COMPATIBILITY.md` defines the subset as a denylist: anything not denied is "rendered
  best-effort".
- `docs/compatibility.md` says out-of-subset input "is rejected ... rather than rendered
  incorrectly".
- Probe `c05-probe/inputs/multicol-strict.html`: the tip renders `columns: 2` on a 400 px box with
  lines running to x 292 pt, the full width.

**How the gate would classify a rejection** (`gate/wpt.mjs`):

- A test that rendered and is now `unsupported` is class `rejection`. It gates against the
  previous link and the head unless a `declaredRejections` entry of the step covers it (GATE-A2).
- This holds for pass -> unsupported and for fail -> unsupported (D5).
- `wpt/run.mjs` marks a test `unsupported` when the test *or any reference* is rejected.

**The proposal:** branch `phasec/05-multicol-reject-proposal`, not merged. It rejects the
declarations in three places:

- the core gate (`css:multicol`, value-aware: `auto` and CSS-wide keywords pass, `column-gap` etc.
  stay in the subset);
- the `multicol` lint rule;
- `RULE_ID_TO_CORE_FEATURE`.

**Measured effect:** a full default WPT run of that build (`--chrome-from` the 10-tip run).
`multicol-reject-wpt-diff.json` here holds the full list.

- 775 tests change, **all** to `unsupported` / `css:multicol`. No other test changed.
- 76 c04 passes -> unsupported.
- 699 c04 fails -> unsupported.
- In the pin view, 54 pin clean passes would become `unsupported`, including the 4 items above
  and table-border-007.
- Chrome passes 755 of the 775.
- No fixture, corpus or probe HTML uses multicol (the 33 HTML inputs of the c04 run copy and the
  repo fixtures), so no verdict row changes.

**What it would mean for the gate:**

- Landing it would add 775 gating rejections.
- Declaring them (GATE-A2) would also turn the 4 pin (c) items into declared rejections. That
  would resolve contract (1) by declaration instead of by rendering, so it is an orchestrator
  decision.
- It would hide 699 real failures under one feature id and drop 76 clean passes.
- For that reason it is reported here and not committed on this branch.
