# Phase C 05: multi-column layout (2026-10-28)

Branch `phasec/05-multicol`, from `phasec/04-verify` 3545ce4. No gated run was made in this step
(the full gated run belongs to the merge step). Every number below is from local macOS (darwin
27.0.1 arm64, Apple M5 Pro), Node v22.23.2, rustc 1.96.0, Chrome for Testing 155.0.8059.85,
2026-10-28, and is INDICATIVE.

Run store: `~/Repositories/vellora-fidelity-runs/c05-multicol/` (results, artifacts, scripts,
probes). The two summaries in this directory are copied from there.

## What changed

Blitz 0.3.0-beta.4 / Taffy 0.15.0 have no multi-column layout. Stylo computes `column-count` and
`column-width`; nothing reads them (CONFIRMED: the raw-Blitz canary
`raw_blitz_tests.rs` `blitz_still_lays_multicol_out_in_one_column`). vellora now lays the
columns out itself:

- `blitz_engine::lay_out_multicol` (the only Blitz contact): the column count and width
  (CSS Multi-column §3.4), the container's content box narrowed to one column width through its
  inline-end padding (border box unchanged), and a content-sized container given its balanced
  height, each step a computed-style edit and a full re-layout.
- `multicol.rs` (no Blitz types): the one tall column cut into columns with the paginator's
  slicer (`pagination::fragment_columns`), then moved into place, each edge rounded as Taffy
  rounds the column's own position.
- `break_css`: `break-before/after: column`, `break-before/after: avoid`, `column-fill`,
  `orphans`, `widows` (Stylo has none of the last four in Servo mode). They are read for the
  column breaks only. The page breaks are unchanged.
- `COMPATIBILITY.md` row "Multi-column layout" (Partial), added by hand. The generator
  `scripts/gen-compatibility.mjs` got the same row, but it is still stale against the committed
  file (c05-probe finding 6), so it was not run.

Strict mode: multi-column input was accepted before and is accepted now. It is now laid out in
columns. No rejection was added, so there is no GATE-A2 declaration and no change to the core
gate, the lint rules or `RULE_ID_TO_CORE_FEATURE`. The side branch
`phasec/05-multicol-reject-proposal` is superseded and not merged.

## Measurements

The before build is 3545ce4. The after build is this branch at the commit named in the
summaries' `afterRunId`.

**Default WPT suites (the gated set), `fidelity/wpt/run.mjs --chrome-from <c04 run copy>`**,
compared against the c04 run copy's `wpt/results.json` (45af35f, the same engine as 3545ce4):

- passes 4157 -> 4416;
- 265 gained;
- 6 lost (below);
- no other outcome change.

Details: `default-suites-vs-c04.json`.

**css/css-multicol + css/css-break, live Chrome for Testing 155.** css/css-multicol is not a
default suite. Its tests were added to a private sparse checkout of the pinned WPT commit. The
after run reuses the before run's Chrome outcomes (`--chrome-from`):

| suite | passes before | passes after |
|---|---|---|
| css/css-break | 115 | 371 |
| css/css-multicol | 60 | 122 |

344 gained, 26 lost (below). Details: `dirs-vs-3545ce4.json`.

**The step-5 targets (`run.mjs css/css-break --filter ...`):**

- multi-line-column-flex-fragmentation-054, -055 and -058 pass, with no ink flags;
- ruby-003 still fails. It needs ruby layout as well as multicol (c05-probe section 1). The
  tip's render keeps a 4 px strut gap between the two inline-blocks (c05-probe). HYPOTHESIS:
  Blitz lays `<rt>` out as a plain inline; its UA stylesheet was not read.
- multi-line-column-flex-fragmentation-060 and table/table-border-007 pass now. The step-4 notes
  listed both as needing multicol. The class-a acceptance that `c04/accepted.json` /
  `c05/accepted.json` carry for table-border-007 has nothing left to accept.

**Fixtures.** `c03-verify-det/det.mjs` (layout_dump) re-rendered the 9 layout-diff fixtures of
the c04 run copy. All 9 PDFs are byte-identical to the c04 run copy's `vellora.pdf` (CONFIRMED).
No fixture uses multicol.

**Performance.** `perf/perf.mjs`: renderPdf, strict, 5 runs, median.

| document | median |
|---|---|
| 300 paragraphs, no multicol | 10.0 ms |
| the same in `columns: 3` (balanced) | 30.6 ms |
| 60 paragraphs, 3 fixed-height `column-fill: auto` columns | 3.6 ms |
| 1000 `break-before: column` | 106.1 ms |
| a 100000 px box in 200 px columns | 1.1 ms |

`MAX_COLUMNS` (1000) bounds the columns per container.

## The lost passes

### Default suites: 6, all css/css-break

None is class a under GATE-A3. Chrome passes each. In each, the c04 pass was clean
(CONFIRMED from the c04 run copy's `inkCheck`):

- candidate ink within 0.8 % of Chrome's oracle ink (missingFrac 0.005-0.008);
- bbox shift 1 px;
- no `ink-missing-vs-chrome` / `ink-displaced-vs-chrome` flag (`fidelity/wpt/lib/report.mjs`:
  missingFrac >= 0.5).

The ink check is coarse (ink count and bbox), not a pixel comparison of the c04 render with
Chrome's. Nothing shows the old passes to be false. Each old pass came from the
one-column layout coinciding with Chrome's picture. Each now fails because of something the
columns expose, not because of a wrong column.

- **multi-line-row-flex-fragmentation-045.** Five row-flex items have `margin-top: -100px` and
  `break-before: column`, so all of them are laid out at the same flow y. One break line per
  flow y cannot separate them. Each needs its own column, which needs fragmentation in flow
  order. KNOWN GAP of the geometric slicer.
- **svg-with-transform.** The `<svg>` that fills column 2 in Chrome is not painted. vellora does
  not render inline SVG at render time (COMPATIBILITY.md: Dev-time-fixable, lint `inline-svg`).
  Before, the green block covered the whole box.
- **table/caption-margin-002 and -005.** Blitz lays the `display: table-caption` boxes out with
  zero size. CONFIRMED for -002: the walked caption boxes are 0x0, so the green caption Chrome
  puts at the top of column 2 is never drawn. -005 has the same markup inside an extra wrapper
  (UNVERIFIED by a separate dump).
- **table/monolithic-overflow-001.tentative.** Blitz gives the `contain: size` child of a
  `display: table` box (no anonymous cell) a 0x0 layout (CONFIRMED by the walk). Nothing
  monolithic is left inside the table, so its 100 px box is cut at the 60 px column end. Chrome
  keeps it whole.
- **widows-orphans-021.** Blitz lays the `&nbsp;` line out at the same y as a full-width float
  above it (float 100-125 px, line box 100-125 px in the walk), where Chrome moves the line below
  the float. The column content is 25 px short, so column 2 stays empty. HYPOTHESIS: a
  float-avoidance case that `float_avoidance_fixups` does not cover.

These 6 gate as lost clean passes at the merge step unless they are fixed or the orchestrator
decides otherwise. They are not entered anywhere: no `accepted.json`, no DEBT.

### css/css-multicol: 20 (not a gated suite)

- **Chrome fails too, 5:** overflow-unsplittable-001/002/003, spanner-in-opacity,
  with-custom-layout-on-same-element.https. Class a by GATE-A3's "Chrome itself fails" if this
  suite were gated.
- **`column-span: all`, 9:** multicol-span-all-006/007/008/011, -fieldset-001/002/003,
  -margin-003, -rule-001. Not implemented (the spanner stays in the column flow).
- **Other, 6, not analysed:** balance-break-avoidance-001,
  column-fill-balance-orthog-block-001 (orthogonal flow), column-height-019,
  intrinsic-size-002/003 (intrinsic sizes of a multicol box), and
  multicol-rule-nested-balancing-002 (nested).

## Known gaps

All of these are also in COMPATIBILITY.md.

- `column-span: all`.
- `column-rule` (not painted).
- Nested multi-column containers.
- Vertical writing modes.
- RTL column order (right to left) is implemented, but no test or measurement covers it
  (UNVERIFIED).
- Parallel flows: row-flex items, the lines of a column flex container and table cells share
  one break line, where Chrome breaks each on its own.
- A multi-column container longer than a page: the paginator cuts it as one block, across all
  its columns at once. Chrome fills the columns of each page in turn. This matters for real
  documents. It is the next thing to do for multicol in print.

## DET-1

Every `HashMap` / `HashSet` the multicol code adds is lookup-only. No output order depends on
iterating one.

CONFIRMED on multicol input: 5 documents were rendered twice in two separate node processes
(`probe/det2.sh` in the run store). All 5 PDFs were byte-identical. The documents:

- the two balancing probes (block paragraphs, `<br>` lines);
- WPT multi-line-column-flex-fragmentation-058;
- WPT out-of-flow-in-multicolumn-094;
- WPT multi-line-row-flex-fragmentation-037.

## Commands

The scripts are in the run store.

```sh
# build: npm run build; plus cargo build --release -p vellora-core --example xhtml_render
c05-multicol/run-dirs.sh <worktree> <out> [--chrome-from <before>/results.json]  # multicol + break
c05-multicol/run-default.sh <worktree> <out>          # default suites, --chrome-from the c04 copy
python3 c05-multicol/summarize.py <before results.json> <after results.json> <label> <out.json>
node c03-verify-det/det.mjs target/release/examples/layout_dump <c04 copy>/layout-diff <out>
node c05-multicol/perf/perf.mjs packages/vellora/dist/index.js
```
