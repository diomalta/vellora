# layout-diff — per-layer layout-tree diff (area A2)

Aligns Chromium's layout of a document with **every stage of vellora's layout** by source-DOM path
and reports where vellora diverges and **which layer made each item worse**: raw Blitz (on the
source HTML), vellora's `html_normalize` pre-pass, vellora's box walk, or one named
`layout_normalize` pass. Phase A instrumentation only: it measures, it does not change rendering.

> **Scope (read first).** Chromium is laid out as ONE continuous flow (no fragmentation) at the
> same viewport width vellora hands Blitz. That is comparable **only to vellora's pre-pagination
> layers**. Pagination (page breaks, repeated `<thead>`, page-local offsets, margin boxes) is out
> of scope of `run.mjs`; `pdf-probe.mjs` is the separate paginated probe.

## How vellora lays out (CONFIRMED from source, 2026-10-21, pin `2003ba5`)

- `lib.rs::render` → `validate_and_lay_out` (`lib.rs`): CSS gate → depth gate → font gate →
  `page_css::parse_page_box` → `blitz_engine::validate_then_lay_out_observed` → unresolved-image
  reject; then `pagination::paginate` → `pdf::emit`.
- `validate_then_lay_out_observed` first runs **`html_normalize::normalize_table_cell_mixed_flow`**
  (despite the name: any flow container with a block-like child gets its inline runs wrapped in an
  attribute-less `<div>`), SERIALIZES the result and lets Blitz re-parse it. The re-parse is not
  always faithful: a `<div>` inside a `<p>` is closed out of it by the HTML parser (see Results,
  receipt).
- Blitz lays out **one continuous flow** whose viewport is the `@page` **content box**, truncated
  to whole CSS px: `Viewport::new(content_width_px as u32, content_height_px as u32, 1.0, …)`
  (e.g. A4 − 2×16 mm = 672.3351 px → 672). Taffy output is rounded (`taffy::round_layout`,
  blitz-dom `resolve.rs:369`), and vellora reads the rounded `final_layout`.
- Blitz evaluates stylesheets as media **`screen`**: `build_document` never sets
  `DocumentConfig::media_type`, whose default is screen (blitz-dom `config.rs:51-52`). Chromium is
  run with `print`; the four fixtures have no `@media` rules, so this is inert for them (reported
  per fixture).
- `blitz_engine::walk` reads boxes by recursing **DOM `node.children`** and accumulating
  `final_layout.location` — not Blitz's `layout_children`/`layout_parent`, so anonymous blocks and
  pseudo-element boxes are never visited (CONFIRMED on a probe: a block `::before` Blitz lays out
  has no box in L0 and its generated text is never shaped). Table rows/row groups are not Blitz
  layout nodes: they come out of the walk as zero-size boxes.
- Post-layout passes, in this exact order (the single list `LAYOUT_NORMALIZE_PASSES` in
  `blitz_engine.rs`, iterated by `resolve_and_walk`):
  1. `vertical_margin_collapse` 2. `collapsed_table_medium_border_insets`
  3. `painted_table_cell_text_baselines` 4. `fixed_table_widths` 5. `table_percent_widths`
  6. `auto_table_compact_columns` 7. `collapsed_table_medium_border_insets_x` (runs LAST).
- Pagination re-stacks fragments instead of keeping flow y: `cursor += page_gap`
  (`pagination.rs:234`) where the gap is the top-level box's Blitz `margin_bottom`
  (`:419`) or, when that is 0, `next.top − bottom` (`:490`).

## Layers (attribution chain)

| layer | what it is |
|---|---|
| `N0` | Blitz's own layout tree of the **source HTML** (`layout_dump --no-html-normalize`: html_normalize skipped), keyed by the source DOM; `layout_children` walk incl. anonymous blocks, rounded `final_layout`. **Raw Blitz.** |
| `N0u` | Same N0 tree from `unrounded_layout`. Diagnostic only (flags "rounding" when N0 diverges but N0u does not). |
| `B0` | Blitz's own layout tree of **html_normalize's output** (what the render path lays out). With N0 present, **N0 → B0 is html_normalize's step**. Without N0, B0 is raw Blitz only if html_normalize changed nothing. |
| `B0u` | Same B0 tree from `unrounded_layout`. Diagnostic only. |
| `L0` | vellora's walk output before any pass. Text = Parley glyph runs as read by `read_text_runs` (incl. its inline padding-right compensation). |
| 7 pass layers | `LaidOutBox` list after each pass above, named after it. The last one is the final pre-pagination layer. |

N0 is optional: a `--dump-repo` whose `layout_dump` predates `--no-html-normalize` runs without it,
which is reported as the not-run check `source_html_layer` (never silently).

## Attribution: which layer made it worse (and which layer is merely first)

Every compared item (box ENTER = x/y/width, box EXIT = height, text run = x/baseline y) gets:

- **`regressed_by`** — every layer that made the item worse than the PREVIOUS layer, per checked
  coordinate (`classifyStep` in `lib/match.mjs`):
  - `worsened`: |Δ| grew by more than tolerance;
  - `overshoot`: the sign flipped with |Δ| over tolerance on both sides and |Δ| did not shrink by
    more than tolerance (+6 → −6 keeps |Δ|, so a magnitude test alone misses it; −1.31 → +0.69 is
    an improvement, not an overshoot);
  - `missing`: the layer lost a box an earlier layer had (e.g. the walk dropping a block `::before`).
  On the first layer of the chain, `worsened` means "already over tolerance vs Chromium" (`first`).
- **`regressions_by_layer[<layer>]`** — every event that layer regressed, in document order, with
  `first_box`/`first_text` (the first event that layer made worse, wherever it is in the document)
  and counts vs the previous layer. `headline.first_pass_regression`, `first_walk_regression` and
  `first_html_normalize_regression` are the first such events per layer kind.
- **`first_over_tolerance`** — the first layer whose |Δ vs Chromium| exceeds tolerance (or that
  lost the box). It answers "is raw Blitz already off?" and NEVER blames a later layer: a pass that
  adds +10 px to a box already +6 px off at B0 still reads B0 here. (It was called `introduced_by`
  before 2026-10-21 and was the only attribution: every regression after the first natural
  divergence was then charged to B0/L0. `compare.mjs` reads both names.)
- `steps`/`dominant_layer` — the exact decomposition of the final Δ (step = layer Δ − previous
  layer Δ; they sum to the final Δ) and the layer with the largest step.
- Pass-effect rows (`layer_stats[].effect_vs_previous`) count boxes/runs a layer regressed and
  NAME them (first three in document order, cascade-only boxes last, plus the largest), so a
  negative Σ of improvements can no longer hide a single regressed box.

Limit (DESIGN, not a bug): a layer that moves an item TOWARDS Chromium is an improvement by
definition, whatever its cause. "What did this code change do" is `compare.mjs` (build vs build).

The headline (`headline.box`/`headline.text`) is the **natural** first divergence of the final
layer (a box no vellora layer has, or that a layer lost, counts). Read it together with
`Regressions by layer`, never alone.

## Checks: when a run cannot be trusted (`lib/checks.mjs`)

Per fixture, printed at the top of each report and in the summary; any `fail` makes `run.mjs` exit
**2** after writing every report (`--allow-check-failures` exits 0 anyway).

| check | class | fails when |
|---|---|---|
| `viewport_width`, `viewport_height` | input parity | Chromium's measured `documentElement.clientWidth`/`innerWidth`/`innerHeight` ≠ Blitz viewport |
| `font_block_injected` | input parity | the browser HTML lacks the bundled `@font-face` block (`browserHtmlFor` also throws on HTML without `<head>`) |
| `bundled_fonts_loaded` | input parity | a face vellora shaped with is not in Chromium's loaded `document.fonts` |
| `platform_fonts_custom` | input parity | `CSS.getPlatformFontsForNode` reports glyphs drawn with SYSTEM fonts (warn if vellora itself used DejaVu fallback) |
| `source_html_layer` | coverage | not-run when there is no N0 dump |
| `normalize_wrappers_located` | self-consistency | html_normalize recorded more wrappers than are found in Blitz's re-parse |
| `normalize_dom_roundtrip` | self-consistency | element keys of N0 (source DOM) ≠ element keys of B0 (normalized + re-parsed, wrappers transparent) |
| `source_dom_keys_vs_chromium` | self-consistency | Blitz's parse of the source HTML (N0) keys any element differently from Chromium's DOM (tag/id/class per path) |
| `run_meta_alignment`, `layer_order` | self-consistency | dump records misaligned |
| `dom_key_alignment` | self-consistency | an L0 box has no Chromium node at its path, or a compared Chromium box's path exists in no vellora DOM node (a box vellora has but its walk drops is scored as LOST instead) |
| `text_alignment` | self-consistency | warn only: unmatched runs/fragments |

An input-parity failure marks attribution **INVALID** (`attribution_valid: false`; reports
prefix every attribution with "INVALID — input parity failed").

## The Rust hook (crates/vellora-core)

- `#[doc(hidden)] vellora_core::debug_layout_dump(html, opts)` runs **the same**
  `validate_and_lay_out` as `render` with a `LayoutObserver`; `render` passes `NoObserver`
  (no-op default methods, monomorphized away). The observer snapshots B0/B0u, L0 and every pass
  layer, plus per-run metadata (owner + brush node, Parley run/line metrics, bundled face file).
- `#[doc(hidden)] vellora_core::debug_layout_dump_source_html(html, opts)` is the same with
  `LayoutObserver::skip_html_normalize` → `true` (`DumpCapture::source_html`); the default, and
  `NoObserver`, return `false`, so the render path always normalizes. Its `blitz_tree` is N0.
- Keys: `html>body:nth-child(2)>div:nth-child(1)>…` — `:nth-child(k)` counts element siblings in the
  **source** DOM: `html_normalize` records the element-index chain of each wrapper it inserts
  (`normalize_table_cell_mixed_flow_traced`; `None` on the render path) and wrappers are made
  transparent. Same scheme on the Chromium side (`lib/chrome-snapshot.mjs`). When the re-parse
  moves a wrapper (receipt), B0 keys after it shift; N0 keeps the source keys, and the shift fails
  `normalize_wrappers_located` / `normalize_dom_roundtrip` / `dom_key_alignment`.
- `crates/vellora-core/examples/layout_dump.rs --html <f> --out <dump.json> [--pdf <f.pdf>]
  [--no-html-normalize]` writes the dump as JSON (hand-rolled writer: no serde added to the
  shipped crate). `run.mjs` calls it twice per fixture (`vellora-dump.json`,
  `vellora-dump-source.json`).
- **Determinism (CONFIRMED):** sha256 of the four fixture PDFs rendered through the real addon
  (`pdf-sha.mjs`, production `renderPdf` path) are identical before the hook, after the hook and
  after the N0 change: invoice `b9df68f2…`, receipt `a1a1787c…`, boleto `a46be81b…`, notification
  `b228240a…` (`snapshots/2026-10-21/determinism/pdf-sha-{before,after}-hook.json`,
  `pdf-sha-n0-hook.json`; the addon binary changed, the PDFs did not). At Blitz 0.3.0-beta.4 the
  hooked tree (incl. N0) renders the same bytes as the bump-only tree for all four
  (`beta4-hook-vs-bump-only.json`, re-checked in `beta4-n0-hook-recheck.json`).
  `tests/layout_dump.rs` asserts the final dump layer equals `validate_then_lay_out`'s boxes and
  that both dump variants leave `render` bytes unchanged.

## Running

```sh
export PATH="$HOME/.nvm/versions/node/v22.23.2/bin:$PATH"   # Node 22 (.nvmrc)
npm ci && npm run build                                      # vellora dist + addon (templating)
PUPPETEER_SKIP_DOWNLOAD=1 npm --prefix fidelity ci           # puppeteer-core 25.15.0 (no browser download)
node fidelity/layout-diff/run.mjs --label pin                # all 4 fixtures, local Chrome; exit 2 = a check failed
node fidelity/layout-diff/run.mjs --label beta4 --dump-repo <checkout-with-bump-and-port>
node fidelity/layout-diff/pdf-probe.mjs --label pin          # paginated probe (needs poppler pdftotext)
node fidelity/layout-diff/compare.mjs --a pin --b beta4      # attribute build-to-build changes
npm --prefix fidelity run test:layout-diff                   # node --test self-tests
```

Options: `--fixtures a,b`, `--tolerance 0.5` (CSS px, boxes), `--text-tolerance` (defaults to
`--tolerance`), `--top 20`, `--include-inline`, `--chrome <path>` (or `VELLORA_FIDELITY_CHROME`),
`--out <dir>`, `--no-build`, `--allow-check-failures`. Templating always uses THIS checkout's
built `vellora` package, so two `--dump-repo` builds are compared on byte-identical HTML.

Output: `fidelity/results/layout-diff/<fixture>/<label>/{native.html, browser.html,
vellora-dump.json, vellora-dump-source.json, chrome-snapshot.json, diff.json, report.md,
report.html}` and `summary-<label>.{md,json}`; `compare-<a>-vs-<b>.{md,json}`; `pdf-probe.json`
per fixture/label. Every file records date (`date -u`), OS/CPU, node, rustc, Chrome, crate versions
(from Cargo.lock), puppeteer-core, git commit/dirty and the exact command. A dated copy of the
2026-10-21 run is committed under `snapshots/2026-10-21/`.

## Chromium side and input parity

- puppeteer-core with an explicit executable; `emulateMediaType('print')`; viewport = the dump's
  Blitz viewport (same truncated integer width/height, DPR 1); scrollbars hidden (flag + CDP),
  MEASURED via `documentElement.clientWidth`/`innerWidth`/`innerHeight` (check `viewport_*`).
- Fonts: the `FONT_ALIASES` table of `benchmarks/visual-fidelity.mjs` (copied; a test fails on
  drift) injected as `@font-face` data URLs of the **same files** vellora embeds
  (`crates/vellora-core/src/fonts/`, sha256 recorded); `document.fonts.ready` awaited; what Chromium
  actually drew with is read back with `CSS.getPlatformFontsForNode` (check `platform_fonts_custom`;
  CONFIRMED necessary: without the font block, receipt/boleto fall back to Helvetica/Arial, which
  are metric-compatible with Liberation Sans, so geometry alone cannot reveal the loss).
- `DOMSnapshot.captureSnapshot({computedStyles: ['display','position','margin-top',
  'margin-bottom'], includeDOMRects: true})`: layout bounds per node and `textBoxes` per text
  fragment. A pseudo-element's generated `content:` text is an extra layout object of the pseudo
  node (CONFIRMED on a block `::before`); it is attached to the pseudo record and compared.
- Text y is compared **baseline to baseline**: Chromium's ascent per (face, size) is measured on a
  probe page (an empty zero-size inline-block's bottom edge sits on the baseline, CSS 2.2 §10.8.1).

## Matching rules

- Events in pre-order of the Chromium tree: ENTER (x, y, width) → the box's text runs → children
  → EXIT (height). So a parent's height never pre-empts the child that actually grew.
- Node policy (all counted in every report): `<head>` excluded; text nodes are never boxes;
  `display:inline` non-replaced elements have no Blitz box → compared via their text runs only
  (`--include-inline` overrides); table rows/row groups absent from Blitz's layout trees and
  zero-size in the walk → `no-blitz-box` (listed, not scored; their cells are scored);
  `display:none` → Chromium has no layout object; pseudo-elements keyed `::before`/`::after`,
  never counted by `:nth-child`; Chromium anonymous boxes are not exposed by DOMSnapshot; Blitz
  anonymous blocks appear only in N0/B0 as `::blitz-anon(j)`; html_normalize wrappers are
  `::vellora-wrapper(j)` (vellora-only).
- A compared Chromium box with no box in a layer COUNTS as a divergence there when an earlier layer
  had it (that layer lost it) or when no vellora layer has it at all; a box absent from Blitz's
  trees but present in the walk is not "lost". All of them are listed in `missing_boxes`.
- Text runs are aligned to Chromium fragments by whitespace-collapsed, case-folded text within the
  same owner (nearest vellora inline root; wrappers fold into their parent), joining consecutive
  same-line fragments/runs when Chromium and Parley split differently. Unmatched runs/fragments
  (generated ones flagged) and Chromium text with no vellora owner are reported.

## Self-tests (`node --test`, not picked up by the root vitest include)

42 tests (`npm --prefix fidelity run test:layout-diff`). Per fidelity/README.md's trust rule, every
attribution path is shown to catch a planted defect:

- synthetic trees: pass-only shift → that pass; raw Blitz shift → B0/N0; walk-only shift → L0;
  child growth → child EXIT before ancestors; text moved by a pass; tolerance; sign flip →
  `overshoot`; box lost by the walk; Chromium-only box; N0 present → html_normalize charged to B0;
  N0 absent and html_normalize altered the DOM → B0 not called raw Blitz;
- the **validator's injections replayed on the real notification snapshot**
  (`test/data/notification-pin.*.json.gz`; `plantBoxShift`/`plantFlowGrowth` reproduce the
  validator's injected dumps exactly, CONFIRMED layer by layer at 1e-4 px): A2 (+10 px y by
  `table_percent_widths` on a box already +6.05 px off at B0, after the headline), C3 (flow growth
  by the same pass after the headline: its EXIT is named first and the pass-effect row names it),
  C2 (runs pushed down by `fixed_table_widths` name that pass, not L0), plus the control (no
  `table_percent_widths` regression without the injection);
- real receipt snapshot with N0 (`test/data/receipt-pin.*`): the html_normalize hoist fails
  self-consistency, `p.thanks` (−46 px height) is html_normalize's, the footer is LOST at B0;
- real probe snapshot (`test/data/pseudo-anon-probe.*`): block `::before` LOST at L0, its generated
  text captured, N0 `::blitz-anon(j)` keys;
- checks: viewport mismatch and font-injection loss invalidate attribution;
- path keys vs CDP snapshot structure, `FONT_ALIASES` drift guard, pdftotext parsing, word
  alignment and build-to-build attribution.

Rust (`cargo test -p vellora-core --test layout_dump`, 6 tests): final layer == render's boxes,
layer names/order, both dump variants leave PDF bytes unchanged, keys through wrappers, source
dump keys `::blitz-anon(j)`, hoisted-wrapper detection.

## CI design (DESIGN TARGET; not run in CI yet)

Local macOS Chrome results are **INDICATIVE**. The authoritative run is a pinned **Chrome for
Testing** on a pinned Linux runner:

```sh
CHROME="$(node fidelity/layout-diff/install-chrome.mjs --build-id 155.0.8059.84)"
node fidelity/layout-diff/run.mjs --chrome "$CHROME" --label ci
```

`install-chrome.mjs` uses `@puppeteer/browsers` (already a dependency of the pinned
puppeteer-core) to install into `fidelity/.cache/chrome-for-testing/`; the version lands in every
result's `env.chrome_version`. CONFIRMED locally (re-run 2026-10-21T04:35Z with this tool
version): Chrome for Testing 155.0.8059.84 (mac-arm64) gives Chromium geometry identical to local
Chrome 155.0.8059.85 for all four fixtures (`compare-pin-vs-pin-cft-155.0.8059.84.md`: 0 changed
boxes, 0 changed runs). NOT RUN: a Linux Chrome for Testing run (FreeType vs CoreText text metrics
may differ; that run is what should become the baseline). A CI job must treat exit 2 as failure
once the receipt html_normalize defect is fixed (today receipt fails by design, see Known gaps).

## Results, 2026-10-21 (local, INDICATIVE; Chrome 155.0.8059.85, macOS 27 arm64)

Run `2026-10-21T04:35:50Z`, commit `75f8833`, node v22.23.2, rustc 1.96.0; files in
`snapshots/2026-10-21/`. Natural first divergence in the final pre-pagination layer (tolerance
0.5 px; Δ = vellora − Chromium). Every first box is already over tolerance in **N0** (raw Blitz on
the source HTML):

| fixture | pin (`2003ba5`) first box | beta.4 first box |
|---|---|---|
| invoice | header `td:nth-child(1)` enter, Δw −11.09 px (N0 −14.47) | same cell, Δw −10.47 px |
| receipt | `header>address:nth-child(4)` exit, Δh −0.56 px (rounding: N0u within tolerance) | same |
| boleto | `table:nth-child(2)` first cell enter, Δ(3, 2.94, 3.86); `auto_table_compact_columns` regressed dw 0.39 → 3.86 | same cell exit, Δh −1.08 |
| notification | meta-table `td:nth-child(1)` enter, Δw −48.72 (N0 −51.56) | same cell, Δw −18.56 |

**html_normalize's effect (CONFIRMED with N0):** for invoice (35 wrappers), boleto (24) and
notification (0) N0 and B0 are identical for every compared box (220/82/34 boxes, ≤ 0.01 px) at
both pin and beta.4 — so the earlier "B0 = raw Blitz" readings for those three were right in
effect. **receipt is the exception (production defect, Phase B):** `.thanks .big {display:block}`
makes html_normalize wrap the trailing inline run of `<p class="thanks">` in a `<div>`; Blitz's
re-parse closes the `<p>` before it (5 wrappers recorded, 4 located; B0 has `div:nth-child(7)`,
`p:nth-child(8)`, `footer:nth-child(9)` where the source and Chromium have `footer:nth-child(7)`).
`p.thanks` loses its second line: exit Δh −0.30 px in N0 → −46.30 px in B0 (html_normalize
regression), the footer is LOST at B0, and the hoisted "Volte sempre" text sits −11.52 pt in x
from Chromium in the PDF (validator's measurement). The PDF bytes are what the render path
produces today; fixing it changes receipt's PDF, so it is out of scope for Phase A.

Pass regressions after the natural first divergence are now visible per layer (summary table
"Regressions per layer"); e.g. at the pin `collapsed_table_medium_border_insets_x` regresses 71
invoice box events and `auto_table_compact_columns` 35, `painted_table_cell_text_baselines` 25
boleto runs.

**Phase B gate question** (are the beta.4 regressions raw Blitz or vellora's post-layout code?),
re-run with this tool version (`compare-pin-vs-beta4.md`):

- **invoice, price columns (+9.95 pt x):** reproduced at PDF level by `pdf-probe`. In the layers:
  raw Blitz text x (L0) of the unit-price column is unchanged by the bump (Δ +0.02 px); the change
  enters at **`auto_table_compact_columns`** (+9.03 px more shift than at pin, reacting to beta.4's
  changed raw column widths: all 217 changed boxes change first in **N0**, i.e. raw Blitz) and
  **`collapsed_table_medium_border_insets_x`** (its −3 px correction no longer fires). Over the
  118 runs whose x changed: Σ|part| L0 298.8 px, compact columns 922.7 px, inset_x 321.0 px.
  ⇒ **vellora post-layout passes**, triggered by a raw-Blitz column-width change.
- **notification, bottom text (~22.5 pt too high):** reproduced at PDF level (last line −21.61 pt
  at beta.4 vs −7.62 pt at pin). Every pre-pagination layer places the signature block identically
  at pin and beta.4 (+4.89 pt LOWER than Chromium in both). The extra −14 pt appears between the
  final layout layer and the PDF ⇒ **neither raw Blitz nor a layout_normalize pass:
  pagination/emit.** Supporting evidence: Blitz's `margin_bottom` of the top-level
  `body>div:nth-child(5)` changes 14.67 px → 0 at beta.4, and pagination re-stacks fragments from
  top-level margins (HYPOTHESIS for the mechanism; next measurement: dump pagination fragments
  `top/bottom/trailing_gap/cursor` at pin vs beta.4).

**Injected-defect re-check (2026-10-21, `snapshots/2026-10-21/injected-defects-recheck.json`):**
the validator's in-pipeline injections re-created as a temporary env-gated patch in a scratch
clone (never committed) and run live: A2, C2, C3 each named by `regressions_by_layer[<pass>]`
(first box = the injected box, kind `worsened`, Δ 10 px), control has no such regression; a 1 px
viewport mismatch and a dropped font block fail input parity (exit 2, attribution INVALID; the
font loss also via system glyphs on sans-serif receipt); the `::before` probe box is LOST at L0
and its generated text is captured.

## Beta.4 port of the hook

`patches/blitz-0.3.0-beta.4-dump-hook-port.patch` (generated by
`patches/port-dump-hook-to-blitz-beta4.py`, 16 exact-match edits, blitz_engine.rs only) applies on
top of this branch + `dff3bc6` without `benchmarks/package-lock.json` — CONFIRMED unchanged after
the N0 change (`git apply --check` clean on `f8fb391` + `dff3bc6`; the patched tree builds, is
clippy/fmt clean and passes the 6 `tests/layout_dump.rs` tests at beta.4):

```sh
git cherry-pick -n dff3bc6 && git rm -q --cached benchmarks/package-lock.json && rm benchmarks/package-lock.json
git apply fidelity/layout-diff/patches/blitz-0.3.0-beta.4-dump-hook-port.patch
```

Changes: `NodeId` (versioned `u64`) instead of `usize` — converted with `as_u64() as usize`,
same as dff3bc6's walk, and `NodeId::from_u64` for lookups; `final_layout()`/`unrounded_layout()`
accessors (they panic for text/comment nodes, so the B0 walk skips nodes without layout data);
`before()`/`after()` accessors; Parley 0.12 `Run::metrics()` → `Run::font_metrics()`.

## Known gaps

- **receipt fails self-consistency by design until html_normalize is fixed** (Phase B; it changes
  receipt's PDF bytes): `normalize_wrappers_located`, `normalize_dom_roundtrip`,
  `dom_key_alignment` fail and `run.mjs` exits 2. B0/L0/pass keys after the hoisted wrapper are
  shifted (`div:nth-child(7)`, `p:nth-child(8)`, `footer:nth-child(9)` vellora-only;
  `footer:nth-child(7)` LOST from B0 on), so the footer and its text are compared only in N0. No
  re-keying of B0 is attempted: guessing which re-parsed node "is" the source footer would hide
  the defect the check exists to expose.
- N0 is a Blitz tree only (boxes, no text): text attribution starts at L0, so html_normalize's
  effect on TEXT is not separated from the walk (L0 runs come from html_normalize's output).
- A layer that moves an item towards Chromium is never reported as a regression (by definition);
  use `compare.mjs` for build-vs-build questions.
- Pre-pagination only; the paginated probe aligns PDF words by text occurrence, not by box.
- No Linux / Chrome for Testing baseline yet (see CI design). macOS numbers are indicative.
- L0 text includes vellora's inline padding-right compensation (not separable from raw Parley).
- Text alignment is text-based; identical repeated strings in one owner rely on order.
- Media type differs by design (Blitz screen vs Chromium print); inert for these fixtures only.
- vellora's walk drops pseudo-element boxes and their generated text (CONFIRMED on a probe, no
  fixture uses `content:`); reported as LOST boxes / unmatched generated fragments.
