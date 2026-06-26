# Geometric Fidelity: horizontal de-inset + size-correct baseline — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the two deterministic geometry errors vs the Puppeteer reference — a uniform horizontal inset on borderless collapsed tables, and a size-proportional baseline fudge — without touching text shaping or adding fixture-specific logic.

**Architecture:** Two surgical changes. (1) `pdf.rs` emit: replace the `0.30em` baseline compensation with a constant px raise (the residual is constant in pt, not proportional to size). (2) `layout_normalize.rs`: add an alignment-aware horizontal twin of the existing collapsed-table inset pass, expanding each cell band to fill the table's content box, wired in before the column-distribution passes.

**Tech Stack:** Rust (`vellora-core`), `cargo test`, Parley/Blitz box model, krilla emit. Benchmarks in Node (`pdftoppm`/`pdftotext`, Puppeteer).

## Global Constraints

- Determinism: same input ⇒ byte-identical PDF. No wall-clock/`Math.random`/system fonts. Both fixes are pure deterministic float geometry. (verbatim from CLAUDE.md invariants)
- Goldens are compared byte-for-byte and are NEVER auto-written; regenerate intentionally with `UPDATE_GOLDENS=1`.
- All Blitz contact stays funneled through `blitz_engine.rs`; post-layout corrections live in `layout_normalize.rs` (operate on `LaidOutBox` only).
- Comparison reference is **Puppeteer** only. No other engine referenced in code, comments, or commits.
- No document-/fixture-specific selectors or constants; corrections must be general (gated on generic geometry, like the existing passes).
- Node 22, Rust 1.96.0. Run all commands from repo root.

---

### Task 1: Constant-pt baseline compensation (Fix B)

**Files:**
- Modify: `crates/vellora-core/src/pdf.rs:26-30` (constant), `:376-378` (application), add unit test in the existing `#[cfg(test)] mod tests` (`:415-437`).

**Interfaces:**
- Produces: `fn compensated_baseline_y(origin_y_px: f64, font_size_px: f64) -> f64` (module-private in `pdf.rs`), and `const TEXT_BASELINE_COMPENSATION_PX: f64`.
- Consumes: nothing new.

**Why this shape:** The true baseline residual is ~constant in pt across font sizes; `0.30em` over-raises large text (`0.30 × 18pt = 5.4pt` lift → the doubled title). `4.0px` (= 3.0pt, the pre-`d9cb15a` value) leaves a flat residual: it keeps 10pt body identical (`0.30 × 10pt = 3.0pt = 4.0px`) and pulls the 18pt title from `dy −4.11pt` to `≈ −1.71pt`. The compensation lives only in emit and is applied to the emitted baseline, not `run.origin_y`, so no layout test depends on it (verified: the badge/painted tests read `run.origin_y`).

- [ ] **Step 1: Write the failing test**

Add to `crates/vellora-core/src/pdf.rs` inside `mod tests`:

```rust
    use super::{compensated_baseline_y, TEXT_BASELINE_COMPENSATION_PX};

    // Regression for d9cb15a: the baseline compensation must be a CONSTANT raise,
    // not proportional to font size. The size-proportional 0.30em form over-raised
    // large text (e.g. an 18pt title lifted 5.4pt), doubling the heading vs Chromium.
    #[test]
    fn baseline_compensation_is_constant_not_size_proportional() {
        let small = 100.0 - compensated_baseline_y(100.0, 10.0);
        let large = 100.0 - compensated_baseline_y(100.0, 30.0);
        assert!(
            (small - large).abs() < 1e-9,
            "baseline raise must not depend on font size, got small={small}, large={large}"
        );
        assert!(
            (small - TEXT_BASELINE_COMPENSATION_PX).abs() < 1e-9,
            "raise must equal the constant compensation, got {small}"
        );
    }
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cargo test -p vellora-core --lib pdf::tests::baseline_compensation_is_constant_not_size_proportional`
Expected: FAIL to compile — `compensated_baseline_y` / `TEXT_BASELINE_COMPENSATION_PX` not found.

- [ ] **Step 3: Write minimal implementation**

In `crates/vellora-core/src/pdf.rs`, replace the constant doc + definition (currently `:26-30`):

```rust
/// Parley exposes the line baseline used for layout. When the bundled faces are
/// rasterized (Poppler) vs Chromium's print rasterizer, bulk text sits ~3pt
/// lower; raise it by a CONSTANT amount. The residual is constant in pt, NOT
/// proportional to font size — a size-proportional fudge (the former `0.30em`)
/// over-raised large headings. 4.0px = 3.0pt keeps 10pt body unchanged.
const TEXT_BASELINE_COMPENSATION_PX: f64 = 4.0;

/// Raise a layout baseline (CSS px) by the constant compensation. `font_size_px`
/// is accepted to document that the correction is deliberately size-independent.
fn compensated_baseline_y(origin_y_px: f64, _font_size_px: f64) -> f64 {
    origin_y_px - TEXT_BASELINE_COMPENSATION_PX
}
```

Then replace the application site (currently `:377`):

```rust
    // Baseline origin in krilla's top-left space (px->pt, no flip).
    let baseline_y = compensated_baseline_y(run.origin_y, run.font_size as f64);
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cargo test -p vellora-core --lib pdf::tests::baseline_compensation_is_constant_not_size_proportional`
Expected: PASS.

- [ ] **Step 5: Verify no layout-test regression**

Run: `cargo test -p vellora-core --test layout_fidelity`
Expected: PASS (these read `run.origin_y`, not the emitted baseline, so they are unaffected).

- [ ] **Step 6: Commit**

```bash
git add crates/vellora-core/src/pdf.rs
git commit -m "Use a constant baseline compensation instead of a size-proportional one"
```

---

### Task 2: Alignment-aware horizontal de-inset for borderless collapsed tables (Fix A)

**Files:**
- Modify: `crates/vellora-core/src/layout_normalize.rs` (add new pass + helper, after the Y inset pass at `:114-169`).
- Modify: `crates/vellora-core/src/blitz_engine.rs:369` (wire the new pass in, before the column passes at `:371-373`).
- Test: `crates/vellora-core/tests/layout_fidelity.rs` (new X-mirror test next to `collapsed_borderless_table_does_not_keep_medium_border_inset` at `:127`).

**Interfaces:**
- Produces: `pub(crate) fn normalize_collapsed_table_medium_border_insets_x(boxes: &mut [LaidOutBox])`.
- Consumes (existing helpers in the same file): `subtree_end_by_depth`, `table_has_visible_edge_border`, `is_fake_medium_border_inset`, `adjust_subtree_inline_geometry`.
- Consumes (existing `LaidOutBox` fields): `tag`, `x`, `width`, `depth`, `table_border_collapse`, `text_align_right`, `text_runs[].origin_x`.

**Why this shape:** Blitz fabricates a ~3px synthetic border on borderless `border-collapse: collapse` tables, insetting cell content ~2.25pt on each side. The content band is squeezed *symmetrically* (left edge moves right, right edge moves left), so the correction is an **expansion** of the cell band to fill `[table.x, table.x + table.width]`, not a translation. `adjust_subtree_inline_geometry` shifts text by the cell's left-edge delta only; right-aligned text must additionally follow the right edge (the width delta), or `right_aligned_table_text_ends_at_cell_content_edge` would drift by `dw`. Running before the column passes lets them re-flow on a corrected `row_left`/`row_right`.

- [ ] **Step 1: Write the failing test**

Add to `crates/vellora-core/tests/layout_fidelity.rs` after `collapsed_borderless_table_does_not_keep_medium_border_inset` (after `:166`):

```rust
#[test]
fn collapsed_borderless_table_cells_fill_table_inline_box() {
    let html = r#"<!DOCTYPE html><html><head><style>
        @page { size: A4; margin: 18mm; }
        body { margin: 0; font-family: sans-serif; font-size: 10pt; }
        table { width: 300px; border-collapse: collapse; }
        td { padding: 0; border: 0 none transparent; }
    </style></head><body>
        <table><tr><td>Cell text</td></tr></table>
    </body></html>"#;

    let (laid, _pb) = lay_out_for_render(html);
    let table = laid
        .boxes
        .iter()
        .find(|b| b.tag.as_deref() == Some("table"))
        .expect("table exists");
    let cell = laid
        .boxes
        .iter()
        .find(|b| b.tag.as_deref() == Some("td"))
        .expect("cell exists");

    assert!(
        (cell.x - table.x).abs() <= 0.5,
        "collapsed borderless cell should start at the table inline edge, table_x={}, cell_x={}",
        table.x,
        cell.x
    );
    assert!(
        ((table.x + table.width) - (cell.x + cell.width)).abs() <= 0.5,
        "collapsed borderless cell should fill to the table inline edge, table_right={}, cell_right={}",
        table.x + table.width,
        cell.x + cell.width
    );
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cargo test -p vellora-core --test layout_fidelity collapsed_borderless_table_cells_fill_table_inline_box`
Expected: FAIL — `cell.x` is ~2.25pt right of `table.x` and `cell.x + cell.width` is ~2.25pt left of the table edge (the surviving synthetic inset).

- [ ] **Step 3: Write the implementation**

In `crates/vellora-core/src/layout_normalize.rs`, add after `normalize_collapsed_table_medium_border_inset` (after `:169`):

```rust
pub(crate) fn normalize_collapsed_table_medium_border_insets_x(boxes: &mut [LaidOutBox]) {
    for i in 0..boxes.len() {
        if boxes[i].tag.as_deref() == Some("table") && boxes[i].table_border_collapse {
            let end = subtree_end_by_depth(boxes, i);
            normalize_collapsed_table_medium_border_inset_x(boxes, i, end);
        }
    }
}

fn normalize_collapsed_table_medium_border_inset_x(
    boxes: &mut [LaidOutBox],
    table_idx: usize,
    end: usize,
) {
    if table_has_visible_edge_border(&boxes[table_idx]) {
        return;
    }

    let table_depth = boxes[table_idx].depth;
    let table_x = boxes[table_idx].x;
    let table_right = boxes[table_idx].x + boxes[table_idx].width;

    let mut cells: Vec<usize> = Vec::new();
    let mut cells_left = f64::INFINITY;
    let mut cells_right = f64::NEG_INFINITY;
    let mut i = table_idx + 1;
    while i < end {
        match boxes[i].tag.as_deref() {
            Some("table") if boxes[i].depth > table_depth => {
                i = subtree_end_by_depth(boxes, i).min(end);
            }
            Some("td" | "th") => {
                cells_left = cells_left.min(boxes[i].x);
                cells_right = cells_right.max(boxes[i].x + boxes[i].width);
                cells.push(i);
                i += 1;
            }
            _ => i += 1,
        }
    }

    if !cells_left.is_finite() || !cells_right.is_finite() {
        return;
    }
    let left_inset = cells_left - table_x;
    let right_inset = table_right - cells_right;
    if !is_fake_medium_border_inset(left_inset) || !is_fake_medium_border_inset(right_inset) {
        return;
    }
    let band = cells_right - cells_left;
    if !band.is_finite() || band <= 0.0 {
        return;
    }
    let scale = (table_right - table_x) / band;

    // Each cell subtree is disjoint, so per-cell transforms are order-independent;
    // capture each cell's pre-transform geometry from immutable inputs.
    for &idx in &cells {
        let old_x = boxes[idx].x;
        let old_width = boxes[idx].width;
        let new_x = table_x + (old_x - cells_left) * scale;
        let new_width = old_width * scale;
        let right_aligned = boxes[idx].text_align_right;
        adjust_subtree_inline_geometry(boxes, idx, new_x, new_width);
        if right_aligned {
            // adjust_subtree_inline_geometry shifts text by the left-edge delta;
            // right-aligned text must track the right edge, so add the width delta.
            let dw = new_width - old_width;
            let cell_end = subtree_end_by_depth(boxes, idx);
            for b in &mut boxes[idx..cell_end] {
                for run in &mut b.text_runs {
                    run.origin_x += dw;
                }
            }
        }
    }
}
```

- [ ] **Step 4: Wire the pass in before the column-distribution passes**

In `crates/vellora-core/src/blitz_engine.rs`, after `:369` (the Y inset pass), add:

```rust
    crate::layout_normalize::normalize_collapsed_table_medium_border_insets_x(&mut boxes);
```

Resulting order (369 → new → 370…): `…medium_border_insets` (Y), `…medium_border_insets_x` (X), `normalize_painted_table_cell_text_baselines`, `normalize_fixed_table_widths`, `normalize_table_percent_widths`, `normalize_auto_table_compact_columns`.

- [ ] **Step 5: Run the new test + the right-alignment regression to verify both pass**

Run: `cargo test -p vellora-core --test layout_fidelity collapsed_borderless_table_cells_fill_table_inline_box`
Expected: PASS.

Run: `cargo test -p vellora-core --test layout_fidelity right_aligned_table_text_ends_at_cell_content_edge`
Expected: PASS (the width-delta correction keeps right-aligned text on the cell content edge).

- [ ] **Step 6: Run the full layout-fidelity suite**

Run: `cargo test -p vellora-core --test layout_fidelity`
Expected: PASS. If a table test that uses a borderless collapsed table now drifts (e.g. `table_header_background_merges_across_adjacent_cells`, `auto_table_*`), inspect whether the change reflects the corrected (Chromium-matching) geometry; update the assertion's expected coordinate to the corrected value only when the new value is the geometrically-correct one, never to mask a real regression.

- [ ] **Step 7: Commit**

```bash
git add crates/vellora-core/src/layout_normalize.rs crates/vellora-core/src/blitz_engine.rs crates/vellora-core/tests/layout_fidelity.rs
git commit -m "Expand borderless collapsed-table cells to the table inline edges"
```

---

### Task 3: Full validation, fidelity measurement, and golden regeneration

**Files:**
- Modify (regenerated artifacts): golden PDFs under the test-harness, `benchmarks/results/**` (local only).

**Interfaces:** none (validation task).

- [ ] **Step 1: Lint + format (Rust)**

Run: `cargo fmt --check && cargo clippy -p vellora-core --all-targets -- -D warnings`
Expected: clean.

- [ ] **Step 2: Full Rust test suite**

Run: `cargo test -p vellora-core`
Expected: PASS.

- [ ] **Step 3: Build the full chain (Rust → addon → TS)**

Run: `npm run build`
Expected: builds `.node` + TS with no errors.

- [ ] **Step 4: Run TS tests; regenerate goldens intentionally**

Run: `npx vitest run` first to see which golden(s) changed.
Expected: golden byte-comparison tests FAIL where the PDF moved (expected — both fixes change text/table geometry).

Then regenerate deliberately and review:

Run: `UPDATE_GOLDENS=1 npx vitest run`
Then: `git status` and inspect the regenerated golden + `git diff --stat` to confirm only intended fixtures changed.
Expected: goldens updated; re-running `npx vitest run` now PASSES.

- [ ] **Step 5: Measure visual fidelity across ALL fixtures (no regression gate)**

Run: `npm run visual:fidelity`
Expected: capture per-fixture `overall.mismatchRatio`. Acceptance: invoice p1 drops from 8.59%; receipt/notification do not regress; **boleto p1 ≤ 11.36%** (hard gate — boleto must not get worse). If boleto regresses, confirm whether its field-grid tables have real borders (they should be excluded by `table_has_visible_edge_border`); if a borderless boleto table is being over-corrected, that is a bug to fix before proceeding.

- [ ] **Step 6: Measure geometry fidelity (invoice)**

Run: `npm run geometry:fidelity -- --fixture invoice --page 1 --top 20`
Expected: `meanAbsX` drops from 2.28pt toward ~0.5pt; the title `dy` magnitude drops from ~4.11pt to ≲2pt. Note: `meanAbsY` will NOT reach 0 — it carries a `~0.177×size` FontDescriptor (OS/2 sTypo vs hhea) measurement artifact that moves no pixels; judge the baseline by the visual metric, not `meanAbsY`.

- [ ] **Step 7: Whitespace + determinism sanity**

Run: `git diff --check`
Expected: no whitespace errors.

- [ ] **Step 8: Commit regenerated goldens**

```bash
git add -A
git commit -m "Regenerate goldens after geometric fidelity fixes"
```

---

## Self-Review

**Spec coverage:**
- Fix A (horizontal twin, post-pass, alignment-aware) → Task 2. ✓
- Fix B (constant-pt baseline) → Task 1. ✓
- Deferred items (compact-column residual, descriptor/benchmark honesty, 18pt image-adjacent brand outlier) → not implemented by design; Task 3 Step 6 explicitly notes the `meanAbsY` measurement artifact. ✓
- Success criteria (meanAbsX→~0.5pt, title dy→≲2pt, visual invoice drop, boleto ≤11.36%) → Task 3 Steps 5-6. ✓
- Risks (goldens, real-bordered tables, layout_fidelity assertions, pass ordering, determinism) → Tasks 2-3 steps + Global Constraints. ✓

**Placeholder scan:** No TBD/TODO; all code blocks complete; the `4.0px` constant and `scale` transform are concrete (validated by tests + benchmark). ✓

**Type consistency:** `normalize_collapsed_table_medium_border_insets_x` / `..._inset_x` naming mirrors the existing Y pair; `compensated_baseline_y(f64, f64) -> f64` and `TEXT_BASELINE_COMPENSATION_PX: f64` used identically in impl and test; reused helpers match their definitions in `layout_normalize.rs`. ✓
