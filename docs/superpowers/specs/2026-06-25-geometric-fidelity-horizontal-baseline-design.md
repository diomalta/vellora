# Design — Geometric fidelity: horizontal inset + size-correct baseline

Date: 2026-06-25
Branch: `release/prepare-alpha1-release`
Status: proposed (awaiting user review)
Comparison reference: **Puppeteer** (Chromium print) only.

## Goal

Close the two remaining *deterministic geometry* errors between Vellora and the
Puppeteer reference on the document fixtures, without touching text shaping and
without any document-/fixture-specific logic. Both errors are visible in the
invoice diff (text echoed ~6px to the right; large title doubled vertically).

Out of scope by decision: glyph-level shaping/kerning parity (same bundled TTF
both sides — advances already match), and measurement-honesty fixes.

## Root cause (confirmed, with evidence)

### E1 — Horizontal: a synthetic "medium" border, only stripped on Y

Blitz fabricates a ~3px `medium` border on the box of any
`border-collapse: collapse` table that has **no explicit edge border**, insetting
cell content by 3px (= **2.25pt**) on each side. Vellora already removes this inset
**only on the vertical axis** in
`normalize_collapsed_table_medium_border_insets` (`crates/vellora-core/src/layout_normalize.rs:114-169`):
it computes `top_inset`/`bottom_inset` and corrects with `shift_range_y` (Y only).
There is **no horizontal counterpart**, so the 3px **left** inset survives and
enters the X pipeline at `crates/vellora-core/src/blitz_engine.rs:410`
(`content_x = abs_x + layout.border.left + layout.padding.left`).

Secondary component: Vellora applies the 16mm `@page` margin **unrounded** =
`45.354pt`; Chromium rounds 16mm → 60 device-px = `45.0pt`, adding **+0.354pt**.

Evidence:
- `2.25 + 0.354 = 2.604pt` = exactly the title `dx` (`Acme/Widgets/LON` = +2.6043pt,
  identical to 4 decimals → pure translation).
- `dx`-vs-`x` regression over 189/189 matched words: slope ≈ 0 (R² = 0.013),
  intercept +2.275pt → **uniform offset, zero advance drift**. Within-line slope
  +0.00023 confirms no per-glyph drift (same TTF, same advances).
- Decisive control: the `parties` table has a **real** 0.4pt border → Blitz does
  **not** synthesize the fake border → its `dx` is the smallest of all (+1.20pt).
- Page width/MediaBox is identical (594.96pt), so this is not a centering issue.

### E2 — Vertical: `0.30em` is the wrong shape and regressed the large title

`TEXT_BASELINE_COMPENSATION_EM = 0.30` (`crates/vellora-core/src/pdf.rs:30`,
applied at `:377` as `baseline_y = run.origin_y - run.font_size * 0.30`) is
proportional to font size, but the true residual is **~constant in pt (~3pt)**, not
proportional. Commit `d9cb15a` replaced the previous constant (`4.0px` = 3.0pt) with
`0.30em` "to be proportional" — and thereby **over-raises large text**:
`0.30 × 18pt = 5.4pt` lift on the title → the doubled title in the diff.

Evidence:
- True-baseline residual (bbox bottom, where descents match) is roughly constant
  per size with `0.30em` applied: 8pt +0.67, 10pt −0.24, 16pt −2.22, 18pt −7.32 —
  i.e. larger fonts are lifted progressively too high.
- With the old `4.0px` constant the residual is flat: 8pt +0.07, 16pt −0.42.
- Measurement caveat (do NOT chase `meanAbsY` to zero): krilla writes the PDF
  FontDescriptor `/Ascent` from OS/2 **typographic** metrics (sTypo, 0.9385em on
  Liberation Sans) while Chromium/Skia uses **hhea/usWin** (1.117em). `pdftotext
  -bbox` derives word *top* = baseline − Ascent×size, so the reported top carries a
  `0.177×size` artifact that **moves no pixels**. The visual (pixel) metric is the
  source of truth for the baseline.

## Approach (approved: A + B, post-pass)

### Fix A — horizontal twin of the collapsed-border inset normalizer

> **Implementation note (revised during execution).** The original single-strategy
> "stretch the band" plan was found, by measurement, to be correct only for
> *simple* tables. For auto/compact tables it **regressed** the right-aligned
> columns (PREÇO/TOTAL drifted from +3.2pt to +6.34pt). Root cause, measured: the
> two table classes carry *different* inline errors, so the fix branches by class.

`normalize_collapsed_table_medium_border_insets_x` in
`crates/vellora-core/src/layout_normalize.rs`, run **after** the column passes:

- Skip if `table_has_visible_edge_border` (parties/boleto rules) or
  `table_layout_fixed` or any cell has `width_pct_hint` (percent pass owns those).
- Compute `left_inset`/`right_inset` from the cell band; both must fall in
  `is_fake_medium_border_inset` (`2.0..=4.5px`) to confirm the synthetic border.
- **Branch by column count:**
  - **`column_count >= 3` (auto/compact tables, e.g. items):** the cells are
    *uniformly* shifted right because `normalize_auto_table_compact_columns`
    anchors its cursor at the inset `row_left`. Correct with a **pure left
    translation** by `left_inset` (`shift_range_x`) — **no width change**, so the
    compact distribution is not amplified.
  - **else (simple tables, e.g. the 2-column header):** the band is squeezed
    *symmetrically* (left edge in, right edge in). **Stretch** it to
    `[table_x, table_right]` (per-cell `adjust_subtree_inline_geometry` with a
    scale), and for right-aligned cells add the width delta to the text runs so
    they track the right edge.
- **Ordering:** runs **after** `normalize_auto_table_compact_columns` so the
  translation sees the final (compacted) column positions; simple tables are
  untouched by the column passes, so order is irrelevant for them.

Generality: keyed on the generic Blitz quirk + table shape, not on any fixture.
The compact-distribution-vs-browser divergence itself is *not* fixed here — only
the synthetic inset shift it baked in is translated out (see Deferred).

### Fix B — constant-pt baseline correction

In `crates/vellora-core/src/pdf.rs`, replace the `font_size`-proportional
`TEXT_BASELINE_COMPENSATION_EM = 0.30` with a **constant** correction in the px
coordinate space (start at `4.0px` ≈ 3.0pt, the pre-`d9cb15a` value), applied at
`:377`. Calibrate the exact constant during implementation to minimize the
true-baseline (bbox-bottom) residual across font sizes; keep any non-formula
improvements from `d9cb15a` intact. The evidence says a constant is the **honest**
model here — `0.30em` was the actual fudge.

## Explicitly deferred (recorded, not in this round)

- Per-column residual from `normalize_auto_table_compact_columns` (right-aligned
  numeric columns, ~0.6pt) — a different normalizer with its own risk profile.
- Measurement honesty (emit hhea-based FontDescriptor, or compare bbox-bottoms in
  `geometry-fidelity.mjs`) — would need a krilla fork; integrity-of-metric, not a
  visible defect.
- The 18pt `<img>`-adjacent brand outlier (−1.9pt) — image-adjacency/positional,
  not a baseline issue; a baseline change won't fix it.

## Success criteria (measurable) — ACHIEVED (measured on final build)

- `geometry:fidelity` invoice p1 `meanAbsX`: **2.28pt → 0.53pt** ✓ (target ~0.5pt;
  −77%). `mean |dy|` 1.42 → 1.30pt. The largest remaining deltas are now *vertical*
  (tagline/FATURA `dy ≈ ±2.4pt`), not horizontal.
- Items columns vs Chromium (was +2.36/+3.45/+3.17/+2.34pt):
  **ITEM +0.11, QTD +1.20, PREÇO +0.92, TOTAL +0.09pt** ✓.
- `visual:fidelity` `mismatchRatio` (per page): invoice p1 **8.59% → 7.35%**,
  notification **7.75% → 7.24%**, receipt p1 4.85% → 4.77%, invoice p2/p3 −0.12/−0.08.
- **No regression anywhere** — **boleto 11.36% → 11.33%** ✓ (the prior regression is
  gone). Harness reports "no page regressed".
- Visual inspection (rendered PNGs): the heavy horizontal glyph echo in the original
  diff is gone; residual red is rasterizer AA + the ~2pt vertical residual.

## Risks & mitigations (outcome)

- **Goldens:** no committed byte-exact golden artifacts exist (the harness records
  to a tmpdir per run — see `real-stack.test.ts`), so nothing needed regeneration.
  All 191 TS tests pass, including the golden round-trip and the cross-TZ/LANG
  determinism gate.
- **Real-bordered tables (boleto field grid, parties).** Stayed untouched: parties
  is excluded by `width_pct_hint` (50% cells) **and** its 1px inset is outside the
  `2.0..=4.5px` window; boleto visual held flat (11.36 → 11.33%). ✓
- **`layout_fidelity` tests:** Fix B is emit-only (reads `run.origin_y`, not the
  emitted baseline), so the badge/painted vertical tests were unaffected — verified
  green. Fix A added 2 tests (header stretch, items translation).
- **Pass ordering:** Fix A runs **after** the column passes (revised from the plan)
  so the compact translation sees final positions — verified by measurement.
- **Determinism invariant** holds: both fixes are pure deterministic float geometry
  (no wall-clock/random/system fonts); cross-TZ/LANG byte-identity test passes.

## Validation plan

1. `cargo test -p vellora-core --test layout_fidelity -- --nocapture` (update encoded assertions).
2. `cargo fmt --check` · `cargo clippy -p vellora-core --all-targets -- -D warnings` · `npm run lint:ts`.
3. `npm run build`.
4. `npm run visual:fidelity` (all fixtures) — before/after, assert no regression (esp. boleto).
5. `npm run geometry:fidelity -- --fixture invoice --page 1 --top 20` — meanAbsX/title dy targets.
6. Regenerate goldens (`UPDATE_GOLDENS=1`), review.
7. `git diff --check`.
