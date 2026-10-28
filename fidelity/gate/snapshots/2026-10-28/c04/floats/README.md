# Phase C step 04, floats / abspos / inline-block group

Branch `phasec/04-floats` (from `phasec/03-verify` ee7f86b). Local macOS (darwin 27.0.0 arm64,
Node v22.23.2, rustc 1.96.0, Chrome for Testing 155.0.8059.85), 2026-10-28. INDICATIVE.

Scope: the 9 pin-(c) WPT tests of this group (c03 `pin-c-routes-c03-tip.json`):
between-float-and-text, clear-applies-to-009, clear-float-005,
float-in-inline-anonymous-block-with-overflow-hidden, float-nowrap-2, float-nowrap-8,
floats-placement-vertical-001a, block-in-inline-float-between-001,
float-inside-inline-between-blocks-1.

## 1. Blitz's `floats` cargo feature was off (commit "enable Blitz floats")

CONFIRMED causes, read in the cargo registry sources:

- blitz-dom 0.3.0-beta.4 `Cargo.toml` `[features]`: `default = [svg, woff, accessibility,
  system-fonts, file-input, custom-widget, text-transform-icu]`; `floats = ["taffy/float_layout",
  "stylo_taffy/floats"]` is opt-in. vellora-core depended on it with `default-features = false`
  and no `features`, so `cargo tree -e features -i taffy` listed no `float_layout`.
- Without it, blitz-dom `layout/inline.rs` compiles `is_floated = false` (lines 405-408, 944-947)
  and taffy's block layout has no float context: a `float: left|right` box is an in-flow block.
- The shipped main (5810062, Blitz git 2003ba5) had the same: `default-features = false` and
  2003ba5's `packages/blitz-dom/Cargo.toml` `default` has no `floats`. Rendered at main with a
  one-off example (`vellora_core::render`, not committed):
  - clear-float-005: orange and blue squares both at the left edge (Chrome: right edge);
  - float-inside-inline-between-blocks-1 and its reference: identical PDFs, `bbb` on its own
    line under the first `aaa` in both (Chrome: `bbb` floats left, the second `aaa` beside it).
  So main's passes of this group were references that degraded the same way as the tests.

Fix: `features = ["floats"]` (crates.io feature, no fork). Not a Blitz-bug compensation, so no
raw canary; raw-Blitz mode (`--raw`) is the same crate and now lays floats out too.

Measured with the flip alone (run copies under `vellora-fidelity-runs/c04-floats-iter/`):

- 9 group tests (`node fidelity/wpt/run.mjs css/CSS2 --filter <9> --chrome <CfT 155> --raw`):
  4 pass (clear-applies-to-009, clear-float-005, float-in-inline-anonymous-block-with-overflow-hidden,
  float-nowrap-2), 5 still fail (product = raw).
- Full WPT (`run-all.mjs --only wpt,... --raw --chrome-from <10-tip>/wpt/results.json`), vs the
  c03-tip run 20261028T013052Z: passes 3762 -> 4051 (+299, -10); outcome counts: error 0,
  timeout 0 (unchanged), unsupported 877 (unchanged). Crashtests 239/239 ok.
- The 9 fixtures and 37 probe fixtures: all 46 `vellora.pdf` byte-identical to the c03-tip run
  (no fixture uses `float`; the only UA float rules are `table[align=left|right]`, and the
  fixtures' tables use `align="center"`).

The 10 pass->fail tests (against the 10-integration expectations' suspect flags):

| test | baseline flag | handling |
|---|---|---|
| css/CSS2/floats/float-root.html | ink-displaced-vs-chrome | reported (flagged pass) |
| css/CSS2/text/text-indent-wrap-001-ref-inline-margin.xht | ink-missing-vs-chrome | reported |
| css/css-break/relpos-inline.html | ink-missing-vs-chrome | reported |
| css/css-text/word-space-transform/word-space-transform-010/011/012.html | uncovered-glyphs, ink-displaced | reported (Chrome fails all three) |
| css/css-break/table/table-border-007.html | clean | see below |
| css/CSS2/floats/floats-wrap-bfc-003-left-table.xht, -right-table.xht | clean | see below |
| css/CSS2/floats/float-nowrap-1.html | clean (pin: fail) | see below |
