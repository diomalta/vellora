# Phase C 07 tip: merge of the step-07 branches + one gated run (2026-10-28)

Branch `phasec/07-tip` from `phasec/06-verify` b81811a. Local macOS (darwin 27.0.0 arm64, macOS
27.0.1, Apple M5 Pro), Node v22.23.2, rustc 1.96.0, Chrome for Testing 155.0.8059.85, tools image
`vellora-fidelity-tools:baseline-beta4` (c405e06c), veraPDF image 45b2f7cd, WPT 9d8aceec, Blitz
crates.io 0.3.0-beta.4. Every number here is INDICATIVE.

> **Pruned paths.** After this step the keep-latest prune (`fidelity/scripts/prune-evidence.mjs`)
> removed `../c07-pin-b/README.md`, `../c06/` (incl. `DEBT-c06-tip.json`, the base of the ledger
> check below) and `port/10-integration`; they are at the git tag `fidelity-archive-2026-10-28-c07`
> (commit `99b05156e0ea7c69d7ec9b8f80bd9f2797170c9a`). `c03/scripts/shrink-ledger.mjs` is now
> `fidelity/gate/shrink-ledger.mjs`, and `c06-svg/scripts/cmp-fixtures.py` is at the tag
> `fidelity-archive-2026-10-28`. The `c07-pin-b/...` paths other than its README, and `c07-tip/...`,
> are in the run store, not in the tree. The text below is the record as written.

The branch records stay where their workers wrote them: `../c07-pin-b/README.md` (in this tree)
and the run stores `~/Repositories/vellora-fidelity-runs/c07-pin-b/` and `.../c07-svgfonts/`. This
step's tools and logs: `~/Repositories/vellora-fidelity-runs/c07-tip/`.

**Verdict: PASS, exit 0, on the gated run and on the post-hoc `--contract` re-gate. All four
conditions of the strict exit contract are met; pin (b) went from 4 to 1** (table below).

## Merges (each `--no-ff`, in this order)

| branch | tip | what it brings | conflicts and how they were resolved |
|---|---|---|---|
| `phasec/07-svg-fonts` | 789359d | inline SVG layout never reads host fonts (the `<svg>` is hidden from Blitz's box construction and laid out from a size-only tree; DET-1 / no system-font fallback); `gen-compatibility.mjs` synced and `compat:check` added to `npm run lint` | none (fb3e4d0) |
| `phasec/07-pin-b` | 68274db | the four pin (b) keys fixed by rendering: inline-block last baseline, a float that does not fit beside its line's text goes below it, negative margins past zero-width floats, per-line float max-content and first lines with no room beside a float | none in the text (`blitz_engine.rs`, `raw_blitz_tests.rs`, `COMPATIBILITY.md` auto-merged). The branch's 4 hand-added `COMPATIBILITY.md` rows were moved into `scripts/gen-compatibility.mjs` `allowedRows` in the merge commit, so the new `compat:check` lint passes (17148f2) |

Interaction check (code read, CONFIRMED): every `resolve` pin-b adds (the float fix-up pass and
the inline-block baseline rounds in `resolve_and_walk`) and the multicol resolves run between
`hide_svgs_from_blitz` and `restore_hidden_svgs`, so Blitz never re-parses an SVG with host fonts.

`npm run build`, `npm test`, `npm run lint` and `npm --prefix fidelity test` were green after each
merge commit (logs `c07-tip/logs/{build,test,lint,ftest}-m{1,2}.log`; at 17148f2 cargo 460 passed,
0 failed, vitest 287 passed, fidelity 0 failures).

## Pre-run (measured before spending the gated run)

`fidelity/wpt/run.mjs --raw --expectations none --chrome-from <10-tip run>/wpt/results.json` on
the merged tree (`c07-tip/wpt-pre-default`): 4553 passes of 8047, **0 outcome or suspect-flag
changes** against the pin-b branch alone (`c07-pin-b/wpt-default-fix9`), so the union of the two
branches adds nothing unmeasured. Against the c06 gated run: 8 gains (below), 0 losses.

## accepted.json (step 16-phase-c-07-tip)

c06's 13 class-a entries verbatim (`scripts/build-accepted.py`). No step-07 branch proposed an
entry. **Not entered:** flex-fragmented-with-float-descendant-001 (see "pin (b) 1"): its old
records (pin, 00-start) are bare `"pass"` outcomes with no Chrome ink flag and no page count, so
the GATE-A3 (a) evidence ("the OLD pass was false") does not exist.

## The gated run

```sh
node fidelity/run-all.mjs --gate --main --contract --raw --chrome <Chrome for Testing 155.0.8059.85> \
  --baseline fidelity/baselines/port/11-phase-c \
  --chrome-from ~/Repositories/vellora-fidelity-runs/run-all-10-tip-20261023T004536Z-blitz-0.3.0-beta.4-vellora-a293cf5/wpt/results.json \
  --tools-image vellora-fidelity-tools:baseline-beta4 \
  --accept fidelity/gate/snapshots/2026-10-28/c07/accepted.json --step 16-phase-c-07-tip \
  --out fidelity/results/run-all/c07-tip
```

- **runId 20261028T110750Z**, git aa41259 (0 dirty), **exit 0**. All 11 preflight lines ok, all
  23 steps ok. Crashtests 239/239 ok. Canaries 35/35 detection caught (+8 measurement-only).
  Addon sha256 959bb5eb…. Copy:
  `~/Repositories/vellora-fidelity-runs/run-all-c07-tip-20261028T110750Z-blitz-0.3.0-beta.4-vellora-aa41259`
  (with `gate-contract/`).
- WPT **4553** passes of 8047 (c06 4545): outcomes and suspect flags identical to the pre-run
  (0 changes). Gate vs 11-phase-c: improvement 8, gating 0, unchanged 18392, flaggedPassLost 0.
  The 8 gains: floats-placement-vertical-003 / -004, zero-width-floats,
  baseline-block-with-overflow-001, inline-block-baseline-011, break-at-end-container-edge-003,
  pre-wrap-float-001 (all clean), flex-fragmented-with-float-descendant-001
  (`ink-displaced-vs-chrome`).
- PDFs (`c06-svg/scripts/cmp-fixtures.py`): 52 of 52 vellora PDFs byte-identical to the c06 gated
  run's. doc-aggregate (`doc-aggregate-c07-tip.json`) and paint-probe (`paint-probe-c07-tip.json`):
  equal to c06 in every metric; only paths, the command and the Chrome PDF hashes differ.
- Verdict rows: PASS 143, FAIL 12, WARN 5, NOT-RUN 3 (the same counts as c06).

## Ledger

- `c03/scripts/shrink-ledger.mjs --run <RUN> --step 16-phase-c-07-tip --label "Phase C 07 tip
  (svg-fonts + pin-b merge: ...)" --accept .../c07/accepted.json --ledger
  fidelity/baselines/port/DEBT.json --out fidelity/baselines/port/DEBT.json` -> **1 entry / 1 key
  kept, 4 keys closed as fixed** (rule iii fixed route, `closed[]` records with run id and head
  comparison class `none`):
  - `DEBT-10-wpt-1`: floats-placement-vertical-003, floats-placement-vertical-004,
    baseline-block-with-overflow-001;
  - `DEBT-10-wpt-2`: zero-width-floats (the entry empties and leaves the ledger).
  - Kept: `DEBT-10-wpt-1` flex-fragmented-with-float-descendant-001 (still a head `debt` item).
- Before shrinking, `DEBT.json` was byte-identical to the frozen `c06/DEBT-c06-tip.json`
  (sha256 c932107e…); the c04/c05/c06 ledger tests in `gate/test/debt-populate.test.mjs` now read
  that frozen copy, and a new c07 test reads `DEBT.json` and this step's contract report. The
  shrunk ledger is frozen here as `DEBT-c07-tip.json`.
- `debt.mjs check --base fidelity/gate/snapshots/2026-10-28/c06/DEBT-c06-tip.json --report
  <RUN>/gate/gate-report.json --head-dir fidelity/baselines/port/00-start --run <RUN>`:
  **0 problems**.
- Post-hoc contract re-gate (`gate/run.mjs --baseline .../11-phase-c --run <RUN> --head
  .../00-start --pin fidelity/baselines/pin --layout-from <RUN> --debt .../DEBT.json --step
  16-phase-c-07-tip --accept .../c07/accepted.json --doc-aggregate
  <RUN>/doc-aggregate/summary.json --contract`): **exit 0**, counts identical to the run's own
  gate. Reports `gate-report-c07-tip-{contract.json.gz,contract.md}`; the run's own
  `gate-report-c07-tip-run.json.gz`.

## Exit contract, per condition (post-hoc contract re-gate)

| condition | status | numbers |
|---|---|---|
| (1) pin --main: 0 (c) | **MET** | pin (a) 5, (b) **1**, **(c) 0**, declared 10; merge to main OK. 0 fixture words |
| (2) doc aggregate >= pin per fixture | **MET 9/9** | docRegressions 0 |
| (3) pages == Chrome | **MET 9/9** | contractPagesFailing 0 |
| (4) previous-link ratchets | **MET** | vs 11-phase-c: gating 0 (improvement 8, flaggedPassLost 0); head vs 00-start: PASS, gating 0, debt 1, accepted 5, declared 10 |

- pin (a) 5: the class-a acceptances float-nowrap-8, page-name-flex-001/002/004,
  hanging-punctuation-first-002 (carried verbatim).
- pin (b) 4 -> 1: floats-placement-vertical-003, baseline-block-with-overflow-001 and
  zero-width-floats now pass clean, by rendering (pin-b's fixes, each a Blitz/Taffy compensation
  with a code comment and a raw-Blitz canary). Their pin passes were coincidental (CONFIRMED with
  the v0.2.0 build: no floats feature, inline-blocks laid out as blocks).

### pin (b) 1: flex-fragmented-with-float-descendant-001, explained

`wpt|css/css-break/flexbox/flex-fragmented-with-float-descendant-001.html` now **passes** (test ==
reference, maxDifference 0) but its pass is flagged `ink-displaced-vs-chrome` (`bboxShift` 426 px
> the 100 px threshold of `wpt/lib/report.mjs`; `missingFrac` 0.128). It was a clean pass at the
pin and at 00-start, so "clean pass became suspect" keeps it a head `debt` item and a pin (b)
item (raw Blitz fails it: `rawOutcome` fail). Mechanism (CONFIRMED):

- The test is a screen-mode reftest: the harness rasterizes and compares page 1 only
  (`wpt/lib/loader.mjs` 91-93, `refgraph.mjs` `comparedPages`), which is why every record shows
  `pageCounts [1, 1]`.
- Chrome's page-1 ink (the `--chrome-from` record) spans x 7..313, y 7..599: Chrome PRINTS this
  multicol-with-`max-height` as two columns on page 1 plus 1 px slivers of the remaining column
  fragments at y = 600, and continues on later pages (a live print at 800x600 has 96 pages for
  test and reference alike, `c07-pin-b/flexfrag/chrome-800x600/{test,ref}.pdf`).
- vellora's page-1 ink spans x 8..598, y 8..173: all four columns side by side on one page, which
  is Chrome's SCREEN layout (`getClientRects`: 4 column fragments, flex item 114 px, the float and
  the inline-block at (489, 41); vellora matches these for test and reference).
- To clear the flag vellora would have to model how Chrome fragments a multicol container across
  pages in print (nested fragmentation, the known "multicol across pages" gap in
  COMPATIBILITY.md) and paint `outline` (not painted). Neither is in this step. No tolerance,
  threshold or oracle was changed, and no acceptance was written.

## Render cost

Interleaved A/B with both addons (`c07-tip/scripts/ab-time.mjs 6`, `c07-tip/ab-time.json`; c06
addon from the c06 merge worktree, built from 897875d whose Rust differs from the gated 7e6b028
only by a comment): 48 inputs (the 9 fixtures, the layout-diff probes, pin-b's probe inputs),
6 rounds alternating the order, 5 timed renders per input after a warm-up, median of medians. Sum
c07/c06 0.98; median per-input ratio 1.02, p90 1.08 (the small float probes, 0.2 ms each). Every
fixture within 0.92..1.03. The WPT `renderMs` sum of the gated run is 69.3 s vs 59.7 s at c06,
but it grew by a similar share in every suite (CSS2 +16 %, css-text +18 %, css-break +17 %),
including tests the fixes do not touch; HYPOTHESIS: machine load during the parallel WPT run, not
the code (the A/B shows no such cost).

## DET-1

- All 52 vellora PDFs of the run byte-identical to the c06 run (the 9 fixtures among them).
- pin-b: 37 probe inputs rendered in two separate processes, byte-identical
  (`c07-pin-b/` det-a/det-b). svg-fonts: the host-font repro (a host-only font vs an unknown
  family vs a bundled family) now gives equal sizes and equal PDF bytes in separate processes
  (`c07-svgfonts/`).

## Still open (carried; none gates)

- flex-fragmented-with-float-descendant-001 (above): `DEBT-10-wpt-1`, 1 key.
- `vellora-float-run` (pin-b's wrapper element) is not in pagination's transparent-wrapper list;
  no fixture produces one, so its effect in a paginated document is unmeasured.
- Known gaps listed by pin-b in COMPATIBILITY.md (a float with wrapping text after it on its line,
  zero-width floats on both sides, a later line with no room beside a float, inline-blocks ending
  in flex/grid, `sub`/`super` inline-blocks), and svg-fonts' viewBox-less SVG with a non-300 px
  width and an indefinite percentage height (100x50 vs Chrome 100x150, deterministic).
- Head view flagged passes lost: 40 (reported, not gated).

## After the run

The contract passed and the one remaining pin (b) key is explained above, so **baseline
`port/12-phase-c-final` was written** from the run copy as-is (its own gate report is PASS with
`--contract`; 65 files, the re-gate report attached) and **`DEBT-BASE.json` now names the frozen
`c07/DEBT-c07-tip.json`** (sha256 1d8fc8eb…, byte-identical to `DEBT.json`). Re-gate with the
moved base: exit 0, counts identical; `debt.mjs check --base c07/DEBT-c07-tip.json`: 0 problems.
The run gated against the new baseline itself: exit 0, gating 0, unchanged 18400. Write-up: port
README section `12-phase-c-final` (`fidelity/baselines/port/README.md`); the committed-pointer
assertion in `gate/test/debt.test.mjs` now expects 1 entry / 1 key.
