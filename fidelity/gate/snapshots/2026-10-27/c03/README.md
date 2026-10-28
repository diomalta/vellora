# Phase C step 03: pin (c) causes other than text-stress and postmark pagination

Branch `phasec/03-pin-c` from `phasec/02-verify` (9e06be6). Environment for every number below:
darwin 27.0.0 arm64 (macOS 27.0.1), Apple M5 Pro, Node v22.23.2, rustc 1.96.0, Chrome for Testing
155.0.8059.85, tools image `vellora-fidelity-tools:baseline-beta4` (c405e06c), PyMuPDF 1.28.2,
2026-10-27/28. Local macOS: INDICATIVE.

## Causes found and fixed

### 1. Page origin and layout width (vellora-owned, commit 6ff0413)

CONFIRMED by `repro/chrome-page-box.mjs` + `repro/pdf-geometry.py` (`page-box-ltr.txt`, 19 page/margin
cases; `page-box-rtl.txt`, 9): Chrome's print lays the document out at
`ceil(W - ml - mr)` where `W` is the AUTHORED page width (210 mm = 793.7008 px for `size: A4`, not the
594.96 pt MediaBox), and places it at `(round(ml), round(mt))`; an rtl root's layout is anchored at
`W - round(mr)`. vellora used the exact margins and `floor(793.28 - ml - mr)`.

- A4 16 mm: Chrome 60 + 673, vellora 60.472 + 672. This is the constant +1.467 px dy (1.1 pt) /
  -0.31 px dx `run` step of the c02 pin (c) words (boleto 30, invoice 13, receipt 6, part of
  text-stress), and the 1 px right-aligned / 0.5 px centred dx.
- oss-sparksuite (task b), 15 mm: Chrome 57 + 681, vellora 56.693 + 679. Chrome DOM at a 681 px
  viewport equals Chrome PDF - 57 to 0.001 px for left- and right-aligned words ("Invoice #" 530.375
  both, "Sparksuite," 51 both); the c02 DOM reference was laid out at 679 px like vellora. So Chrome's
  PDF is NOT offset from its own layout: the -1.73 pt was vellora at a 2 px narrower width, not an
  oracle artefact (not class a). Fixed: all 46 sparksuite words now dx 0 / dy 0.
- Code: `PageBox::layout_content_width`, `PageBox::content_origin(rtl)` (page_css.rs), used by
  `lib.rs` (layout viewport) and both pagination lowering paths. Tests: `tests/page_geometry.rs`
  (the table), and the tests whose "Chrome" numbers were a DOM at the old floor viewport now carry the
  print numbers (walk 641 -> 642, percent cells 649 -> 650, party table content box).

### 2. Auto-table spare width (Blitz-owned, compensated; commits 5c128d2, 29142a4)

CONFIRMED: blitz-dom 0.3.0-beta.4 `src/layout/table.rs` 249-255 / 293-297 make every auto-table
column an `auto` grid track; taffy 0.15.0 `src/compute/grid/track_sizing.rs` 1415-1442 stretches auto
tracks EQUALLY. Chrome distributes the excess in proportion to max-content: invoice items max-content
267.922 / 53.328 / 104.172 / 95.297 (table at `width: max-content`, `repro/chrome-table-widths.mjs`)
-> 346.266 / 68.922 / 134.625 / 123.188 at 673 px = each x 673/520.719; raw Blitz 306 / 92 / 142 / 133.
`auto_table_compact_columns` (name kept for tooling) now applies that rule from Blitz's own
max-content widths (`LaidOutBox::max_content_width`: Parley content widths + padding/border, block
children recursively), only when every column already exceeds its max-content by more than the
rounding bound (0.5 px x columns + 0.5; the first version moved WPT
`css-tables/baseline-empty-cell-001` and was tightened). Comment with the delete list in
`layout_normalize.rs`; canary `raw_blitz_tests::blitz_still_shares_auto_table_excess_width_equally`
(raw 298 / 99 / 104 / 157 vs Chrome 383.828 / 57.266 / 64.563 / 152.344) and product test
`auto_table_compensation_gives_chromes_columns`. This closes invoice 35 + 2 none (QTD. dx
4.42 pt) and the heuristic's other column offsets.

## Gated run (one, `--main --raw`)

```
node fidelity/run-all.mjs --gate --main --raw --chrome <CfT 155.0.8059.85> \
  --baseline fidelity/baselines/port/10-integration --chrome-from <10-tip copy>/wpt/results.json \
  --tools-image vellora-fidelity-tools:baseline-beta4 --out fidelity/results/run-all/c03-pinc
# runId 20261028T004913Z, git 5325678 (clean), exit 3 -> gate-report-c03.json.gz
node fidelity/gate/run.mjs --baseline fidelity/baselines/port/10-integration --run <RUN> \
  --head fidelity/baselines/port/00-start --pin fidelity/baselines/pin --layout-from <RUN> \
  --debt fidelity/baselines/port/DEBT.json --step 12-pin-c \
  --doc-aggregate <RUN>/doc-aggregate/summary.json --contract --out <RUN>/gate-contract
# exit 3 -> gate-report-c03-contract.{json.gz,md}
```

Durable copy: `~/Repositories/vellora-fidelity-runs/run-all-c03-pinc-20261028T004913Z`.

| view | c02-tip | c03 |
|---|---|---|
| pin (c) | 193 | **47** = 32 WPT + 10 text-stress-ptbr + 5 danfe words |
| vs 10-integration regressions | 127 (text-stress) | **44** (text-stress-ptbr pdf-probe dy, all end at +1.5 pt) |
| head (00-start) gating | 88 | **29** = text-stress 17, WPT 8, postmark 3 (step-10 class-a artefacts), danfe 1 |
| ledger | no problem | 180 GATE-D7 failures: the 10-entry ledger's `measured` values describe c02; every one of its words moved (e.g. boleto `Corte` 1.1 -> 0.75 pt). Shrinking it is a DEBT step (rule iii decision pending) |
| doc aggregate condition 2 | MET 9/9 | MET 9/9 (`doc-aggregate-c03.json`) |
| condition 3 (pages) | 8/9 | 8/9 (oss-postmark-receipt 1 vs 2) |
| WPT | 46.84 % | 46.84 %; per test identical to c02-tip (0 lost, 0 gained); 17 flagged passes lost vs 10-integration (unchanged) |
| canaries | 35/35, gate 29/29 | 35/35 detection |

Doc aggregate medians (mm) c02-tip -> c03: invoice 0.19 -> 0.23 (<=1 mm 93.2 -> 100 %), receipt
0.15 -> 0.10, boleto 0.39 -> 0.26, notification 0.17 -> 0.01, boleto-febraban 0.07 -> 0.07, danfe 0.26
-> 0.22, text-stress 0.40 -> 0.26, sparksuite 0.61 -> 0, postmark 0.19 -> 0.13.

DANFE-M1 (task d): at c02 already PASS (`L 2.498 T 4.191 R 2.074 B 3.09`, 1 page); the 8.552 ->
24.173 excessB was the 10-integration 2-page layout. c03: `L 2.371 T 4.233 R 2.201 B 3.048`, Chrome
`L 2.371 T 4.233 R 2.498 B 3.344` (L and T now equal Chrome's). Fixed by step 02, no excess.

## Pin (c) 47, item by item (`pin-classification-c03.json`, `wpt-34-classification.json`)

- text-stress-ptbr 10 words (+ the 44 regressions): owner = the LayoutUnit task (rows ~0.03-0.04 px
  taller than Chrome's 1/64 px-floored lengths; now uniformly +1.5 pt = 2 px). Not touched here.
- danfe 5 dy words (1.34-1.38 pt): CONFIRMED components: 0.714 px accumulated sub-px excess above the
  item table in N0u (rows 14.752 vs Chrome 14.719 px: LayoutUnit family) plus Taffy whole-px row
  rounding (N0 dy 0.62, -0.09, 0.19, 0.47, 0.75, ...: +0.28 px per row, -1 px at each rounding flip);
  the remaining ~0.7-1 px intra-cell baseline offset is HYPOTHESIS (Chrome's flooring of the 0.05 cm
  padding and its border snapping). The baseline offset within a line itself matches Chrome on 103 of
  108 font/size/line-height cases at integer positions (Liberation Serif 8pt: +1 px, 5 cases).
  Owner: LayoutUnit / sub-px task.
- 32 WPT (+3 head-only): all fail in the product AND in raw Blitz at this commit. Families: floats 13
  (Blitz float layout; upstream), css-break flex 4 + ruby-003 + monolithic-overflow-014 (fragmentation
  task; monolithic is vellora's paginator: raw page counts [4,1] vs product [2,2]), generated content
  `display: table-column(-group)` 4 (Blitz renders the pseudo inline; candidate vellora route: set
  `display: none` on such pseudos between `resolve_stylist` and `resolve`, not attempted), css-text 8
  (Parley: tab-size 26 px AA diff, justification, hanging punctuation, balance), linebox 2, paint order
  1. Chrome itself fails 4 (float-nowrap-8, floats-placement-vertical-001a,
  inline-formatting-context-001, hanging-punctuation-first-002). Blitz's own WPT report (23b9b26)
  passes 12 of them: re-check on a Blitz bump before compensating. Product WORSE than raw (vellora-
  owned worsening, cause not located): between-float-and-text (79536 vs 8940 px: the paginator moves
  the negative-margin float and the abspos box), float-nowrap-2/8 (~2x), floats-placement-vertical-004.
