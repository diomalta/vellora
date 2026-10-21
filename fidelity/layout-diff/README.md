# layout-diff — per-layer layout-tree diff (area A2)

Aligns Chromium's layout of a document with **every stage of vellora's layout** by source-DOM path
and reports where vellora first diverges and **which layer introduced it**: raw Blitz, vellora's box
walk, or one named `layout_normalize` pass. Phase A instrumentation only: it measures, it does not
change rendering.

> **Scope (read first).** Chromium is laid out as ONE continuous flow (no fragmentation) at the
> same viewport width vellora hands Blitz. That is comparable **only to vellora's pre-pagination
> layers**. Pagination (page breaks, repeated `<thead>`, page-local offsets, margin boxes) is out
> of scope of `run.mjs`; `pdf-probe.mjs` is the separate paginated probe.

## How vellora lays out (CONFIRMED from source, 2026-10-21, pin `2003ba5`)

- `lib.rs::render` → `validate_and_lay_out` (`lib.rs:125`): CSS gate → depth gate → font gate →
  `page_css::parse_page_box` (`lib.rs:151`) → `blitz_engine::validate_then_lay_out_observed` →
  unresolved-image reject; then `pagination::paginate` (`lib.rs:88`) → `pdf::emit`.
- Blitz lays out **one continuous flow** whose viewport is the `@page` **content box**, truncated
  to whole CSS px: `Viewport::new(content_width_px as u32, content_height_px as u32, 1.0, …)`
  (`blitz_engine.rs:494-495`; e.g. A4 − 2×16 mm = 672.3351 px → 672). Taffy output is rounded
  (`taffy::round_layout`, blitz-dom `resolve.rs:369`), and vellora reads the rounded `final_layout`.
- Blitz evaluates stylesheets as media **`screen`**: `build_document` never sets
  `DocumentConfig::media_type`, whose default is screen (blitz-dom `config.rs:51-52`). Chromium is
  run with `print`; the four fixtures have no `@media` rules, so this is inert for them (reported
  per fixture).
- `blitz_engine::walk` reads boxes by recursing **DOM `node.children`** and accumulating
  `final_layout.location` — not Blitz's `layout_children`/`layout_parent`, so anonymous blocks are
  never visited (their text would be lost; `html_normalize` pre-wraps such inline runs in
  attribute-less `<div>`s for that reason). Table rows/row groups are not Blitz layout nodes:
  they come out of the walk as zero-size boxes.
- Post-layout passes, in this exact order (now the single list `LAYOUT_NORMALIZE_PASSES`,
  `blitz_engine.rs:422`, iterated by `resolve_and_walk` at `:538`):
  1. `vertical_margin_collapse` 2. `collapsed_table_medium_border_insets`
  3. `painted_table_cell_text_baselines` 4. `fixed_table_widths` 5. `table_percent_widths`
  6. `auto_table_compact_columns` 7. `collapsed_table_medium_border_insets_x` (runs LAST).
- Pagination re-stacks fragments instead of keeping flow y: `cursor += page_gap`
  (`pagination.rs:234`) where the gap is the top-level box's Blitz `margin_bottom`
  (`:419`) or, when that is 0, `next.top − bottom` (`:490`).

## Layers (attribution chain)

| layer | what it is |
|---|---|
| `B0` | Blitz's own layout tree: walk of `layout_children` (incl. anonymous blocks) from the root element, absolute border boxes from rounded `final_layout`. **Raw Blitz.** |
| `B0u` | Same tree from `unrounded_layout`. Diagnostic only (flags "rounding" when B0 diverges but B0u does not). |
| `L0` | vellora's walk output before any pass. Text = Parley glyph runs as read by `read_text_runs` (incl. its inline padding-right compensation). |
| 7 pass layers | `LaidOutBox` list after each pass above, named after it. The last one is the final pre-pagination layer. |

Attribution of a divergence = the first layer of `B0 → L0 → passes` where it exceeds tolerance
(text starts at `L0`: B0 has no text).

## The Rust hook (crates/vellora-core)

- `#[doc(hidden)] vellora_core::debug_layout_dump(html, opts)` runs **the same**
  `validate_and_lay_out` as `render` with a `LayoutObserver`; `render` passes `NoObserver`
  (no-op default methods, monomorphized away). The observer snapshots B0/B0u, L0 and every pass
  layer, plus per-run metadata (owner + brush node, Parley run/line metrics, bundled face file).
- Keys: `html>body:nth-child(2)>div:nth-child(1)>…` — `:nth-child(k)` counts element siblings in the
  **source** DOM: `html_normalize` records the element-index chain of each wrapper it inserts
  (`normalize_table_cell_mixed_flow_traced`; `None` on the render path) and wrappers are made
  transparent. Same scheme on the Chromium side (`lib/chrome-snapshot.mjs`).
- `crates/vellora-core/examples/layout_dump.rs --html <f> --out <dump.json> [--pdf <f.pdf>]`
  writes the dump as JSON (hand-rolled writer: no serde added to the shipped crate).
- **Determinism (CONFIRMED):** sha256 of the four fixture PDFs rendered through the real addon
  (`pdf-sha.mjs`, production `renderPdf` path) are identical before and after the hook:
  invoice `b9df68f2…`, receipt `a1a1787c…`, boleto `a46be81b…`, notification `b228240a…`
  (`fidelity/results/layout-diff/determinism/pdf-sha-{before,after}-hook.json`). At Blitz
  0.3.0-beta.4 the hooked tree and the bump-only tree also render byte-identical PDFs for all four
  (`determinism/beta4-hook-vs-bump-only.json`). `tests/layout_dump.rs` asserts the final dump layer
  equals `validate_then_lay_out`'s boxes and that dumping leaves `render` bytes unchanged.

## Running

```sh
export PATH="$HOME/.nvm/versions/node/v22.23.2/bin:$PATH"   # Node 22 (.nvmrc)
npm ci && npm run build                                      # vellora dist + addon (templating)
PUPPETEER_SKIP_DOWNLOAD=1 npm --prefix fidelity ci           # puppeteer-core 25.15.0 (no browser download)
node fidelity/layout-diff/run.mjs --label pin                # all 4 fixtures, local Chrome
node fidelity/layout-diff/run.mjs --label beta4 --dump-repo <checkout-with-bump-and-port>
node fidelity/layout-diff/pdf-probe.mjs --label pin          # paginated probe (needs poppler pdftotext)
node fidelity/layout-diff/compare.mjs --a pin --b beta4      # attribute build-to-build changes
npm --prefix fidelity run test:layout-diff                   # node --test self-tests
```

Options: `--fixtures a,b`, `--tolerance 0.5` (CSS px, boxes), `--text-tolerance` (defaults to
`--tolerance`), `--top 20`, `--include-inline`, `--chrome <path>` (or `VELLORA_FIDELITY_CHROME`),
`--out <dir>`, `--no-build`. Templating always uses THIS checkout's built `vellora` package, so two
`--dump-repo` builds are compared on byte-identical HTML.

Output: `fidelity/results/layout-diff/<fixture>/<label>/{native.html, browser.html,
vellora-dump.json, chrome-snapshot.json, diff.json, report.md, report.html}` and
`summary-<label>.{md,json}`; `compare-<a>-vs-<b>.{md,json}`; `pdf-probe.json` per fixture/label.
Every file records date (`date -u`), OS/CPU, node, rustc, Chrome, crate versions (from Cargo.lock),
puppeteer-core, git commit/dirty and the exact command. A dated copy of the 2026-10-21 run is
committed under `snapshots/2026-10-21/`.

## Chromium side and input parity

- puppeteer-core with an explicit executable; `emulateMediaType('print')`; viewport = the dump's
  Blitz viewport (same truncated integer width/height, DPR 1); scrollbars hidden (flag + CDP),
  verified by `documentElement.clientWidth`.
- Fonts: the `FONT_ALIASES` table of `benchmarks/visual-fidelity.mjs` (copied; a test fails on
  drift) injected as `@font-face` data URLs of the **same files** vellora embeds
  (`crates/vellora-core/src/fonts/`, sha256 recorded); `document.fonts.ready` awaited.
- `DOMSnapshot.captureSnapshot({computedStyles: ['display','position'], includeDOMRects: true})`:
  layout bounds per node and `textBoxes` per text fragment.
- Text y is compared **baseline to baseline**: Chromium's ascent per (face, size) is measured on a
  probe page (an empty zero-size inline-block's bottom edge sits on the baseline, CSS 2.2 §10.8.1).
  Without that, Chromium's integer ascent rounding would masquerade as divergence.

## Matching rules

- Events in pre-order of the Chromium tree: ENTER (x, y, width) → the box's text runs → children
  → EXIT (height). So a parent's height never pre-empts the child that actually grew.
- Node policy (all counted in every report): `<head>` excluded; text nodes are never boxes;
  `display:inline` non-replaced elements have no Blitz box → compared via their text runs only
  (`--include-inline` overrides); table rows/row groups absent from Blitz's layout tree and
  zero-size in the walk → `no-blitz-box` (listed, not scored; their cells are scored);
  `display:none` → Chromium has no layout object; pseudo-elements keyed `::before`/`::after`,
  never counted by `:nth-child`; Chromium anonymous boxes are not exposed by DOMSnapshot; Blitz
  anonymous blocks appear only in B0 as `::blitz-anon(j)`; html_normalize wrappers are
  `::vellora-wrapper(j)` (vellora-only).
- Text runs are aligned to Chromium fragments by whitespace-collapsed, case-folded text within the
  same owner (nearest vellora inline root; wrappers fold into their parent), joining consecutive
  same-line fragments/runs when Chromium and Parley split differently. Unmatched runs/fragments and
  Chromium text with no vellora owner (text vellora never shaped) are reported.

## Self-tests (`node --test`, not picked up by the root vitest include)

17 tests: path keys vs CDP snapshot structure, `FONT_ALIASES` drift guard, every attribution path
with planted defects on synthetic trees (pass-only shift → that pass; B0 shift → B0; walk-only
shift → L0; child growth → child EXIT before ancestors; text moved by a pass; tolerance), and —
per fidelity/README.md's trust rule — planted defects on a **real** snapshot (notification @ pin,
`test/data/*.json.gz`): a 3px Chromium perturbation and a 3px shift planted in one pass layer are
both found at the exact path and attributed to the right layer. Plus pdftotext parsing, word
alignment and build-to-build attribution.

## CI design (DESIGN TARGET; not run in CI yet)

Local macOS Chrome results are **INDICATIVE**. The authoritative run is a pinned **Chrome for
Testing** on a pinned Linux runner:

```sh
CHROME="$(node fidelity/layout-diff/install-chrome.mjs --build-id 155.0.8059.84)"
node fidelity/layout-diff/run.mjs --chrome "$CHROME" --label ci
```

`install-chrome.mjs` uses `@puppeteer/browsers` (already a dependency of the pinned
puppeteer-core) to install into `fidelity/.cache/chrome-for-testing/`; the version lands in every
result's `env.chrome_version`. CONFIRMED locally: Chrome for Testing 155.0.8059.84 (mac-arm64)
gives Chromium geometry identical to local Chrome 155.0.8059.85 for all four fixtures
(`compare-pin-vs-pin-cft-155.0.8059.84.md`: 0 changed boxes, 0 changed runs). NOT RUN: a Linux
Chrome for Testing run (FreeType vs CoreText text metrics may differ; that run is what should
become the baseline).

## Results, 2026-10-21 (local, INDICATIVE; Chrome 155.0.8059.85, macOS 27 arm64)

First divergence in the final pre-pagination layer (tolerance 0.5 px; Δ = vellora − Chromium):

| fixture | pin (`2003ba5`) first box / layer | beta.4 first box / layer |
|---|---|---|
| invoice | header `td:nth-child(1)` enter, Δw −11.09 px, **B0** | same cell, Δw −10.47 px, **B0** |
| receipt | `header>address:nth-child(4)` exit, Δh −0.56 px, **B0 (rounding: B0u within tol.)** | same |
| boleto | `table:nth-child(2)` first cell enter, Δ(3, 2.94, 3.86), **B0** | same cell exit, Δh −1.08, **B0** |
| notification | meta-table `td:nth-child(1)` enter, Δw −48.72, **B0** | same cell, Δw −18.56, **B0** |

The first divergent text run is introduced at `L0` (raw Blitz/Parley text as read by the walk) in
all 8 runs. Example: notification's first line has its baseline +1 px below Chromium's (measured);
HYPOTHESIS for the mechanism: Chromium floors the half-leading while Blitz/Parley rounds the line
box. Per-fixture details, pass effects and top-N tables are in each `report.md`.

**Phase B gate question** (are the beta.4 regressions raw Blitz or vellora's post-layout code?):

- **invoice, price columns (+9.95 pt x):** reproduced at PDF level by `pdf-probe` ("UNIT." +9.95 pt,
  "32,50" +9.96 pt at beta.4 vs +0.93 / +0.92 pt at pin). In the layers: raw Blitz text x (L0) of
  the unit-price column is unchanged by the bump (Δ +0.02 px); the change enters at
  **`auto_table_compact_columns`** (+9.03 px more shift than at pin, reacting to beta.4's changed raw
  column widths) and **`collapsed_table_medium_border_insets_x`** (its −3 px correction no longer
  fires: beta.4 has no synthetic 3 px "medium" inset). Total column change +12.06 px in the final
  layer. TOTAL column: L0 +3.03, compact pass +6.04, inset_x +3.00. Over all 118 runs whose x
  changed: Σ|part| L0 298.8 px, compact columns 922.7 px, inset_x 321.0 px. ⇒ **vellora
  post-layout passes**, triggered by a raw-Blitz column-width change.
- **notification, bottom text (~22.5 pt too high):** reproduced at PDF level (last line −21.61 pt at
  beta.4 vs −7.62 pt at pin). But every pre-pagination layer places the signature block
  identically at pin and beta.4 (+6.52 px = +4.89 pt LOWER than Chromium in both). The whole extra
  −14 pt appears between the final layout layer and the PDF ⇒ **neither raw Blitz nor a
  layout_normalize pass: pagination/emit.** Supporting evidence: Blitz's reported `margin_bottom`
  of the top-level `body>div:nth-child(5)` changes 14.67 px → 0 at beta.4, and pagination
  re-stacks fragments from top-level margins (HYPOTHESIS for the mechanism; next measurement: dump
  pagination fragments `top/bottom/trailing_gap/cursor` at pin vs beta.4).

## Beta.4 port of the hook

`patches/blitz-0.3.0-beta.4-dump-hook-port.patch` (generated by
`patches/port-dump-hook-to-blitz-beta4.py`, 16 exact-match edits, blitz_engine.rs only) applies on
top of this branch + `dff3bc6` without `benchmarks/package-lock.json`:

```sh
git cherry-pick -n dff3bc6 && git rm -q --cached benchmarks/package-lock.json && rm benchmarks/package-lock.json
git apply fidelity/layout-diff/patches/blitz-0.3.0-beta.4-dump-hook-port.patch
```

Changes: `NodeId` (versioned `u64`) instead of `usize` — converted with `as_u64() as usize`,
same as dff3bc6's walk, and `NodeId::from_u64` for lookups; `final_layout()`/`unrounded_layout()`
accessors (they panic for text/comment nodes, so the B0 walk skips nodes without layout data);
`before()`/`after()` accessors; Parley 0.12 `Run::metrics()` → `Run::font_metrics()`. The port
builds, is clippy/fmt clean and passes `tests/layout_dump.rs` at beta.4.

## Known gaps

- Pre-pagination only; the paginated probe aligns PDF words by text occurrence, not by box.
- No Linux / Chrome for Testing baseline yet (see CI design). macOS numbers are indicative.
- L0 text includes vellora's inline padding-right compensation (not separable from raw Parley).
- Text alignment is text-based; identical repeated strings in one owner rely on order.
- Media type differs by design (Blitz screen vs Chromium print); inert for these fixtures only.
