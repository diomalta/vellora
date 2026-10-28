# Phase C 06 tip: merge of the step-06 branches + one gated run (2026-10-28)

Branch `phasec/06-tip` from `phasec/05-verify` 1ae3508. Local macOS (darwin 27.0.0 arm64, macOS
27.0.1, Apple M5 Pro), Node v22.23.2, rustc 1.96.0, Chrome for Testing 155.0.8059.85, tools image
`vellora-fidelity-tools:baseline-beta4` (c405e06c), veraPDF image 45b2f7cd, WPT 9d8aceec, Blitz
crates.io 0.3.0-beta.4. Every number here is INDICATIVE.

The step-06 branch records stay where their workers wrote them: `../c06-svg/`,
`../c06-col-breaks/`, `../c06-ruby/` (the table branch kept its record in its run store,
`~/Repositories/vellora-fidelity-runs/c06-table-anon/`).

**Verdict: PASS, exit 0, on the gated run and on the post-hoc `--contract` re-gate. All four
conditions of the strict exit contract are met** (table below).

## Merges (each `--no-ff`, in this order)

| branch | tip | what it brings | conflicts and how they were resolved |
|---|---|---|---|
| `phasec/06-svg` | ed5c389 | inline `<svg>` laid out by Blitz (`svg` feature) and painted by vellora (krilla-svg), Chrome's SVG sizes, the SVG image-source gate | none (4fef742) |
| `phasec/06-table-anon` | d9c5f46 | anonymous table objects and the caption wrapper Blitz drops; margin truncation at column breaks through empty boxes; table break properties on the wrapper | `COMPATIBILITY.md` (table-anon's multicol row + svg's inline-SVG row), `raw_blitz_tests.rs` (both appended tests kept) (10eb198) |
| `phasec/06-col-breaks` | 611bfd1 | forced column breaks taken in document order (045) | `pagination.rs`: `split_fragment` takes both new parameters, table-anon's `truncate: f64` then col-breaks' `tail_from: Option<usize>`; in `fragment_columns` the `taken` set is extended first, then `truncate` is computed from the `(position, index)` forced tuple (`0.0` when the cut is the forced break). `tail_from` is only `Some` for a break taken in flow order, whose cut is that forced position, so `truncate` is always `0.0` with it: the two never apply together (documented on `split_fragment`). The other two call sites pass `0.0, None`. `multicol.rs` tests (both kept), `COMPATIBILITY.md` (both branches' multicol wording) (5a0d182) |
| `phasec/06-ruby` | e6f02ab | ruby layout; a line taller than its column is never cut | `lib.rs` (`mod ruby` + `mod svg`), `blitz_engine.rs` `WalkSink` fields `svg_fonts` + `line_spans` at both construction sites, `raw_blitz_tests.rs` (both kept), `COMPATIBILITY.md` (ruby row between the multicol and inline-SVG rows) (16cec44) |

`npm run build`, `npm test`, `npm run lint` and `npm --prefix fidelity test` were green after each
merge commit (logs `~/Repositories/vellora-fidelity-runs/c06-tip/{build,test,lint,ftest}-m{1..4}.log`;
at 16cec44 cargo 446 passed, vitest 287 passed, fidelity 0 failures).

## Found in the pre-run and fixed: image paint order (2b24dee)

Full default WPT on the merged tree (`node fidelity/wpt/run.mjs --raw --chrome-from <c05 run
copy>/wpt/results.json --expectations none`; copy `c06-tip/pre-default`): 4535 passes. Against
the c05 run, every change was predicted by the union of the four branch records (gains: the
table branch's 95, 045, ruby's 6, svg-with-transform; losses: the table branch's 15 flagged
passes) except **43 CSS2 changes that no branch had measured** (`c06-tip/tools/union.py`,
`pre-default-union.txt`): XHTML tests whose replaced element is `<svg:svg>`. The svg branch had
reported svg-with-transform as the only reftest of the 8047 with an inline `<svg>` and had run
css/css-break + css/css-multicol only (how it searched is not recorded; HYPOTHESIS: a search for
`<svg`, which a prefixed `<svg:svg>` does not match). Inline SVG drawn gained 38 of
them and lost 5 that were CLEAN passes of 10-integration (fail at the pin and at 00-start), so they
would have gated condition (4):

- css/CSS2/normal-flow/inline-replaced-width-009, inline-block-replaced-width-008;
- css/CSS2/positioning/absolute-replaced-width-003a/b/c.

Cause (CONFIRMED from the artifact `pre-default/artifacts/.../inline-replaced-width-009.xht/lhs-p1.png`:
the 300x300 red SVG is drawn at the right size and the green box is under it): `pdf::emit` drew
every image of a page after every rect, so a later positioned box (`position: relative` /
`absolute`) never covered an image. Their 10-integration passes were the SVG not being drawn at
all. Chrome 155 passes all five.

Fix (vellora's painter, not a Blitz bug, so no raw canary): `ImageRun` and the rects carry
`blitz_engine::paint_stack` (the tree order of the positioned box they paint with, CSS 2.2
Appendix E step 8) and `ImageRun` its `paint_tier`; `pdf::paint_sequence` draws each image right
after the last rect whose key is at most its own. Rect order is unchanged; pages without a
positioned rect emit the same content as before. Tests: `tests/paint_order.rs`
(`a_later_positioned_box_paints_over_an_svg`,
`images_keep_their_layer_against_positioned_and_in_flow_rects`).

- A first version also regrouped the positioned rects per positioned box in tree order. It gained
  26 tests but lost `css/css-tables/collapsed-border-positioned-tr-td.html`, a CLEAN pass in all
  three views (`pre-default-ps1`): the later positioned cells' backgrounds then covered the
  earlier cells' collapsed borders, which Chrome paints over them. It was reverted; the regrouping
  is left for a later step together with collapsed-border painting.
- With the final version (`pre-default-ps2`): 4545 passes, 10 gained over 4535, 0 lost; the 5
  recovered. css/css-break 395 and css/css-multicol 122 (unchanged) with live Chrome
  (`dirs-ps2`).

## accepted.json (step 15-phase-c-06-tip)

c05's 13 class-a entries verbatim (`scripts/build-accepted.py`). No step-06 branch proposed an
entry. Nothing entered for the 15 flagged losses (below): a lost flagged pass is reported, not
gated.

## The gated run

```sh
node fidelity/run-all.mjs --gate --main --contract --raw --chrome <Chrome for Testing 155.0.8059.85> \
  --baseline fidelity/baselines/port/10-integration \
  --chrome-from ~/Repositories/vellora-fidelity-runs/run-all-10-tip-20261023T004536Z-blitz-0.3.0-beta.4-vellora-a293cf5/wpt/results.json \
  --tools-image vellora-fidelity-tools:baseline-beta4 \
  --accept fidelity/gate/snapshots/2026-10-28/c06/accepted.json --step 15-phase-c-06-tip \
  --out fidelity/results/run-all/c06-tip
```

- **runId 20261028T084519Z**, git 7e6b028 (0 dirty), **exit 0**. All 11 preflight lines ok, all
  23 steps ok (wpt exit 1 is the ratchet output, decided by the gate). Crashtests 239/239 ok.
  Canaries 35/35 detection caught (+8 measurement-only). Copy:
  `~/Repositories/vellora-fidelity-runs/run-all-c06-tip-20261028T084519Z-blitz-0.3.0-beta.4-vellora-7e6b028`
  (with `gate-contract/`).
- WPT **4545** passes of 8047 (c05 4414): outcomes identical to the pre-run `pre-default-ps2`
  (0 changes).
- PDFs (`c05-tip/tools/pdfcmp.py`, sha256): 94 of the 98 vellora PDFs outside `wpt/` (every
  fixture, corpus, probe and oracle render) are byte-identical to the c05 run copy's. The other 4
  are the same 4 pdf-probe canary mutation PDFs that also differed c03 -> c04 -> c05 (all canary
  rows caught; the non-deterministic mutation writer is still a HYPOTHESIS).
- doc-aggregate (`doc-aggregate-c06-tip.json`) and paint-probe (`paint-probe-c06-tip.json`): equal
  to c05 in every metric on 9/9 (input hashes aside; the subject PDF hashes are equal too).
- Verdict rows: PASS 143, FAIL 12, WARN 5, NOT-RUN 3, the same FAIL/WARN rows as c05 (the 5 WARN
  are pdftotext/pdfminer EXT-2 warnings with 0 missing and 0 extra words).
- "changed 2" (never gating, the same two items as c05): root-box-003 pass-blank -> fail,
  overflowed-abs-pos-with-percentage-height-print fail -> pass-blank.
- Ledger: `c03/scripts/shrink-ledger.mjs --run <RUN> --step 15-phase-c-06-tip --label "Phase C 06
  tip (svg + table-anon + col-breaks + ruby merge, image paint order)" --accept
  .../c06/accepted.json --ledger fidelity/baselines/port/DEBT.json --out
  fidelity/baselines/port/DEBT.json` -> 2 entries / 5 keys kept, 0 closed, 0 ceilings lowered;
  only the note grew. `debt.mjs check --base
  .../2026-10-27/10-final/DEBT-10-integration.json --report <RUN>/gate/gate-report.json --head-dir
  fidelity/baselines/port/00-start --run <RUN>`: **0 problems**.
- Post-hoc contract re-gate (`gate/run.mjs --baseline .../10-integration --run <RUN> --head
  .../00-start --pin fidelity/baselines/pin --layout-from <RUN> --debt .../DEBT.json --step
  15-phase-c-06-tip --accept .../c06/accepted.json --doc-aggregate <RUN>/doc-aggregate/summary.json
  --contract`): **exit 0**, counts identical to the run's own gate. Reports
  `gate-report-c06-tip-{contract.json.gz,contract.md}`; the run's own `gate-report-c06-tip-run.json.gz`.

## Exit contract, per condition (post-hoc contract re-gate)

| condition | status | numbers |
|---|---|---|
| (1) pin --main: 0 (c) | **MET** | pin (a) 5, (b) 4, **(c) 0**, declared 10; merge to main OK. 0 fixture words |
| (2) doc aggregate >= pin per fixture | **MET 9/9** | docRegressions 0; table below |
| (3) pages == Chrome | **MET 9/9** | contractPagesFailing 0 |
| (4) previous-link ratchets | **MET** | vs 10-integration: gating 0 (improvement 3469, accepted 3, reported 42); head vs 00-start: PASS, gating 0, debt 5, accepted 5, declared 10 |

- pin (a) 5: the class-a acceptances float-nowrap-8, page-name-flex-001/002/004,
  hanging-punctuation-first-002 (c05/accepted.json evidence, carried verbatim).
- **pin (b) 4 = DEBT keys** of the step-10 ledger (`DEBT-10-wpt-1`: floats-placement-vertical-003,
  baseline-block-with-overflow-001, flex-fragmented-with-float-descendant-001; `DEBT-10-wpt-2`:
  zero-width-floats): raw Blitz fails them the same way (GATE-A3 (b)). They were in the ledger
  before the strict contract was set and are not among the 103 b-provable pin (c) items of
  10-final (`../../2026-10-27/10-final/pin-classification.json` lists none of them; CONFIRMED).
  The fifth DEBT key, floats-placement-vertical-004, is head-only. Whether the contract's "the
  103 b-provable FIXED not DEBT" should also cover these step-10 (b) keys is for the
  orchestrator/user to confirm; every contract table since c03 has scored (1) on (c) alone.

The six step-05 blockers, all passing by rendering (ink check missingFrac <= 0.008):

| key | c05 | c06 | fixed by |
|---|---|---|---|
| `wpt\|css/css-break/ruby-003.html` | fail | pass | ruby layout + monolithic lines in columns (06-ruby) |
| `wpt\|css/css-break/flexbox/multi-line-row-flex-fragmentation-045.html` | fail | pass | forced column breaks in document order (06-col-breaks) |
| `wpt\|css/css-break/svg-with-transform.html` | fail | pass | inline SVG painted (06-svg) |
| `wpt\|css/css-break/table/caption-margin-002.html` | fail | pass | caption wrapper + margin truncation at a column break (06-table-anon) |
| `wpt\|css/css-break/table/caption-margin-005.html` | fail | pass | same |
| `wpt\|css/css-break/table/monolithic-overflow-001.tentative.html` | fail | pass | anonymous table objects (06-table-anon) |

widows-orphans-021 (lost by multicol at c05) still fails; it failed at the pin, 00-start and
10-integration, so no view gates it.

**Flagged passes lost: 42** = c05's 27 (same keys) + the table branch's 15, all reported, none
gating (each was an ink-flagged pass, `ink-missing-vs-chrome`, in every view that passed it).
Per-key evidence: `~/Repositories/vellora-fidelity-runs/c06-table-anon/flagged-losses.json`.
12 are CSS2 `*-applies-to-015` (the reference's dimensionless `<img>` is not drawn; at c05 the test
and the reference were both blank), 3 are inline-table-002a / inline-table-width-002b /
inline-table-zorder-003 (002a: `visibility: hidden` painted, CONFIRMED; the other two causes
UNVERIFIED). They are candidates for a class-a entry; none was written.

## Doc aggregate (`doc-aggregate-c06-tip.json`; equal to c05 in every metric)

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

## DET-1

- The 9 fixtures' `native.html` from the run copy, rendered twice in separate processes with
  `layout_dump` (`c03-verify-det/det.mjs`): 9/9 byte-identical to each other and to the run's
  `vellora.pdf`.
- The image paint-order change: HTML versions of the recovered tests (inline-replaced-width-009,
  inline-block-replaced-width-008, absolute-replaced-width-003a/b/c; plus
  inline-replaced-width-014, rejected `image:unresolved` both times) rendered with `renderPdf`
  strict twice in separate processes (`c06-tip/detimg`): byte-identical. `paint_stack`'s map is
  lookup-only; `paint_sequence` uses a stable sort.

## After the run

- The record commit (6d64367) adds one doc sentence to `pdf::FilledRect::stack` (comment only; the
  gated source is 7e6b028).
- The contract passed, so **baseline `port/11-phase-c` was written** from the run copy as-is
  (bfc73b0; its own gate report is already PASS with `--contract`) and **`DEBT-BASE.json` now names
  the frozen `c06/DEBT-c06-tip.json`** (byte-identical to `DEBT.json`). Re-gate with the moved
  base: exit 0, counts identical; `debt.mjs check --base c06/DEBT-c06-tip.json`: 0 problems. The
  run against the new baseline itself: exit 0, gating 0, unchanged 18400. Write-up: port README
  section `11-phase-c` (`fidelity/baselines/port/README.md`).
