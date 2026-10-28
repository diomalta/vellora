# Layout diff — invoice (beta4)

> Continuous-flow comparison: Chromium lays the document out as ONE flow (no fragmentation) at the same viewport width vellora hands Blitz. It is comparable ONLY to vellora's PRE-pagination layers (N0, B0, L0, layout_normalize passes) and says nothing about pagination (page breaks, repeated thead, page-local offsets, margin boxes).

Deltas are vellora − Chromium in CSS px. Paths abbreviate `html>body:nth-child(2)` as `body`.

## Environment

- date_utc: `2026-10-21T06:05:12Z`
- os: `darwin 27.0.0 arm64`
- cpu: `Apple M5 Pro`
- node: `v22.23.2`
- command: `node <worktree>/fidelity/layout-diff/run.mjs --label beta4`
- repo: `<worktree>`
- rustc: `rustc 1.96.0 (ac68faa20 2026-05-25)`
- git_commit: `dc535e7f9e0a3291a539b3c8597ee03472ad1aaa`
- git_dirty: `clean`
- blitz: `blitz-0.3.0-beta.4`
- chrome_path: `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`
- chrome_version: `Google Chrome 155.0.8059.85`
- templating_repo: `<worktree>`
- chrome_user_agent: `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/155.0.0.0 Safari/537.36`
- crates: blitz-dom 0.3.0-beta.4, blitz-html 0.3.0-beta.4, blitz-traits 0.3.0-beta.4, krilla 0.8.2, parley 0.12.0, stylo 0.22.0, taffy 0.15.0
- tools: puppeteer-core 25.15.0

## Checks (input parity, dump self-consistency, coverage)

| check | class | status | detail |
| --- | --- | --- | --- |
| viewport_width | input-parity | pass | Blitz viewport width 672 px; Chromium documentElement.clientWidth 672, innerWidth 672 |
| viewport_height | input-parity | pass | Blitz viewport height 1001 px; Chromium innerHeight 1001 |
| font_block_injected | input-parity | pass | browser HTML carries the bundled @font-face block (<style data-vellora-fidelity-fonts>) |
| bundled_fonts_loaded | input-parity | pass | vellora shaped with 2 bundled face(s); Chromium document.fonts loaded: Inter 400 normal; Inter 700 normal; Helvetica Neue 400 normal; Helvetica Neue 700 normal; Arial 400 normal; Arial 700 normal |
| platform_fonts_custom | input-parity | pass | CSS.getPlatformFontsForNode over 209 text-bearing elements: 0/3255 glyphs rendered with SYSTEM fonts; vellora DejaVu fallback runs: 0 |
| source_html_layer | coverage | pass | N0 present: Blitz laid out the source HTML with html_normalize skipped; the N0 → B0 step is html_normalize's (DOM altered by html_normalize: YES) |
| normalize_wrappers_located | self-consistency | pass | html_normalize wrappers recorded 35, located in the Blitz DOM 35 |
| run_meta_alignment | self-consistency | pass | L0 boxes whose Parley runs could not be re-aligned to the walk: 0 |
| layer_order | self-consistency | pass | layers whose box sequence differs from L0: none |
| normalize_dom_roundtrip | self-consistency | pass | element keys of the source DOM (N0) vs html_normalize's output re-parsed by Blitz (B0, wrappers transparent): 269 common; only in source 0; only in normalized 0; same key, different tag/id/class 0 |
| source_dom_keys_vs_chromium | self-consistency | pass | element keys of Blitz's parse of the source HTML (N0) vs Chromium's DOM (head excluded): 269 common; only in vellora 0; only in Chromium 0; same key, different tag/id/class 0 |
| dom_key_alignment | self-consistency | pass | L0 boxes (vellora's render DOM) keyed only on the vellora side: 0; compared Chromium boxes whose path no vellora DOM node has: 0 |
| text_alignment | self-consistency | pass | matched 210 pairs; unmatched vellora runs 0, unmatched Chromium fragments 0, Chromium text with no vellora owner 0 |

## Input parity

- @page content box 672.3351 × 1001.6151 CSS px → Blitz viewport 672 × 1001 (`as u32` truncation in resolve_and_walk drops 0.3351 px of inline size; a KNOWN INPUT divergence vs Chromium print, not an engine difference). Chromium MEASURED: documentElement.clientWidth 672, innerWidth 672, innerHeight 1001 — MATCH.
- Media: Blitz evaluates stylesheets as `screen` (DocumentConfig::media_type default; build_document never sets it). Chromium emulates `print` (matchMedia('print') = true). Fixture contains @media rules: no (media type is inert here).
- Fonts: Chromium loaded Inter 400 normal; Inter 700 normal; Helvetica Neue 400 normal; Helvetica Neue 700 normal; Arial 400 normal; Arial 700 normal from the bundled files (sha256 in env.fonts_sha256). vellora runs by face: LiberationSans-Bold.ttf 11, LiberationSans-Regular.ttf 199. DejaVu fallback runs (no Chromium counterpart): 0.
- Baselines: Chromium ascent measured for 11/11 face/size specs.
- html_normalize: ALTERED the DOM (wrappers recorded 35, located in the Blitz DOM 35). N0 (Blitz on the source HTML) present: the N0 → B0 step is html_normalize's.
- Blitz anonymous blocks (B0 only): 0; anonymous inline roots holding text (text Blitz shaped that vellora's DOM-children walk never reads): 0.
- Dump self-checks: run-metadata misalignments 0, layer order violations 0 (both expected 0).
- Input sha256: native 99c85b4aaa8aa295…, browser b09272bd1c5e899f…

## Layers (attribution chain order)

| layer | kind | meaning |
| --- | --- | --- |
| N0 | blitz-source | Blitz's own layout tree of the SOURCE HTML (`layout_dump --no-html-normalize`: html_normalize skipped), keyed by the source DOM. **Raw Blitz.** |
| B0 | blitz | Blitz's own layout tree of html_normalize's OUTPUT (what the render path lays out): `layout_children` walk (incl. anonymous blocks), absolute border boxes from rounded `final_layout`. With N0 present, the N0 → B0 step is html_normalize's; without N0 it is NOT raw Blitz whenever html_normalize altered the DOM. |
| L0 | walk | vellora's box walk (`blitz_engine::walk`, DOM `children`, accumulating `final_layout`) before any pass; text = Parley glyph runs as read by `read_text_runs`. |
| vertical_margin_collapse | pass | after this `layout_normalize` pass |
| collapsed_table_medium_border_insets | pass | after this `layout_normalize` pass |
| painted_table_cell_text_baselines | pass | after this `layout_normalize` pass |
| fixed_table_widths | pass | after this `layout_normalize` pass |
| table_percent_widths | pass | after this `layout_normalize` pass |
| auto_table_compact_columns | pass | after this `layout_normalize` pass |
| collapsed_table_medium_border_insets_x | pass | after this `layout_normalize` pass |
| N0u | blitz-unrounded | Same N0 tree from `unrounded_layout` (Taffy before `round_layout`). Diagnostic only, not in the attribution chain. |
| B0u | blitz-unrounded | Same B0 tree from `unrounded_layout` (Taffy before `round_layout`). Diagnostic only, not in the attribution chain. |

Tolerance: box 0.5 px, text 0.5 px. Box events: ENTER checks x/y/width (top-down), EXIT checks height (bottom-up, so html/body are not 'first' just because they absorb descendants' error). Text runs are checked between a box's enter and exit.

Two attribution answers per item. **regressed by** = every layer that made the item WORSE than the previous layer, per checked coordinate: |Δ| grew by more than tolerance (`worsened`), the sign flipped with both sides over tolerance and |Δ| did not shrink by more than tolerance (`overshoot`, e.g. +6 → −6), or the layer lost the box (`LOST`); on the first layer of the chain it means 'already over tolerance vs Chromium'. This answers 'which layer changed the error', also after the document's first natural divergence. **first over tolerance** = the first layer of N0 → B0 → L0 → passes whose |Δ vs Chromium| exceeds tolerance: it answers 'is raw Blitz already off?' and NEVER blames a later layer — a pass that adds +10 px to a box already +6 px off at B0 still reads B0 there. **dominant layer** = the layer with the largest step (step = layer Δ − previous layer Δ; steps sum exactly to the final Δ). Limit: a layer that moves a box TOWARDS Chromium is an improvement by definition, whatever its cause; `compare.mjs` (build vs build) answers 'what did this code change do'.

## Headline: first divergent box in collapsed_table_medium_border_insets_x

- **enter (x/y/width) body>table:nth-child(1)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(1)** (event #3)
- first over tolerance: **N0** — RAW BLITZ: Blitz's layout of the SOURCE HTML (N0) already differs from Chromium
- regressed by (which layer made it worse, per coordinate): **N0 dw 0→-10.47 (first layer)**
- dominant layer (largest step of the final Δ): N0 (dw -10.47); step decomposition (sums to the final Δ): N0 dw -10.47

| layer | status | dx | dy | dw | dh | dy basis |
| --- | --- | --- | --- | --- | --- | --- |
| N0 | diverged | 0 | 0 | -10.47 |  |  |
| B0 | diverged | 0 | 0 | -10.47 |  |  |
| L0 | diverged | 0 | 0 | -10.47 |  |  |
| vertical_margin_collapse | diverged | 0 | 0 | -10.47 |  |  |
| collapsed_table_medium_border_insets | diverged | 0 | 0 | -10.47 |  |  |
| painted_table_cell_text_baselines | diverged | 0 | 0 | -10.47 |  |  |
| fixed_table_widths | diverged | 0 | 0 | -10.47 |  |  |
| table_percent_widths | diverged | 0 | 0 | -10.47 |  |  |
| auto_table_compact_columns | diverged | 0 | 0 | -10.47 |  |  |
| collapsed_table_medium_border_insets_x | diverged | 0 | 0 | -10.47 |  |  |
| N0u | diverged | 0 | 0 | -10.47 |  |  |
| B0u | diverged | 0 | 0 | -10.47 |  |  |

Ancestor chain (compared boxes, root first; deltas = vellora − Chromium, CSS px):

| ancestor | collapsed_table_medium_border_insets_x dx,dy,dw,dh | N0 dx,dy,dw,dh | B0 dx,dy,dw,dh | L0 dx,dy,dw,dh |
| --- | --- | --- | --- | --- |
| html | 0, 0, 0, 3.55 | 0, 0, 0, 3.55 | 0, 0, 0, 3.55 | 0, 0, 0, 3.55 |
| body | 0, 0, 0, 3.55 | 0, 0, 0, 3.55 | 0, 0, 0, 3.55 | 0, 0, 0, 3.55 |
| body>table:nth-child(1) | 0, 0, 0, -0.25 | 0, 0, 0, -0.25 | 0, 0, 0, -0.25 | 0, 0, 0, -0.25 |

## First divergent text run in collapsed_table_medium_border_insets_x

- **text "EMITENTE" in body>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(1)>div:nth-child(1)** (event #41)
- first over tolerance: **L0** — RAW BLITZ/PARLEY TEXT as read by vellora's walk (L0); no normalize pass involved
- regressed by (which layer made it worse, per coordinate): **L0 dx 0→1.11 (first layer); painted_table_cell_text_baselines overshoot dy 0.86→-1.14**
- dominant layer (largest step of the final Δ): painted_table_cell_text_baselines (dy -2); step decomposition (sums to the final Δ): L0 dx +1.11; painted_table_cell_text_baselines dy -2
- Chromium fragment: "EMITENTE" at x=19.89 y=197.14 w=63.69; vellora faces: LiberationSans-Regular.ttf

| layer | status | dx | dy | dw | dright | dy basis |
| --- | --- | --- | --- | --- | --- | --- |
| N0 | n/a |  |  |  |  |  |
| B0 | n/a |  |  |  |  |  |
| L0 | diverged | 1.11 | 0.86 | -0.02 | 1.09 | baseline |
| vertical_margin_collapse | diverged | 1.11 | 0.86 | -0.02 | 1.09 | baseline |
| collapsed_table_medium_border_insets | diverged | 1.11 | 0.86 | -0.02 | 1.09 | baseline |
| painted_table_cell_text_baselines | diverged | 1.11 | -1.14 | -0.02 | 1.09 | baseline |
| fixed_table_widths | diverged | 1.11 | -1.14 | -0.02 | 1.09 | baseline |
| table_percent_widths | diverged | 1.11 | -1.14 | -0.02 | 1.09 | baseline |
| auto_table_compact_columns | diverged | 1.11 | -1.14 | -0.02 | 1.09 | baseline |
| collapsed_table_medium_border_insets_x | diverged | 1.11 | -1.14 | -0.02 | 1.09 | baseline |

Ancestor chain (compared boxes, root first; deltas = vellora − Chromium, CSS px):

| ancestor | collapsed_table_medium_border_insets_x dx,dy,dw,dh | N0 dx,dy,dw,dh | B0 dx,dy,dw,dh | L0 dx,dy,dw,dh |
| --- | --- | --- | --- | --- |
| html | 0, 0, 0, 3.55 | 0, 0, 0, 3.55 | 0, 0, 0, 3.55 | 0, 0, 0, 3.55 |
| body | 0, 0, 0, 3.55 | 0, 0, 0, 3.55 | 0, 0, 0, 3.55 | 0, 0, 0, 3.55 |
| body>table:nth-child(2) | 0, -0.03, 0, 2.14 | 0, -0.03, 0, 2.14 | 0, -0.03, 0, 2.14 | 0, -0.03, 0, 2.14 |
| body>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(1) | 0.5, 0.47, -11.5, 1.14 | 0.5, 0.47, -11.5, 1.14 | 0.5, 0.47, -11.5, 1.14 | 0.5, 0.47, -11.5, 1.14 |

## First box event a layout_normalize pass regressed

None: no pass worsened, overshot or lost any box event by more than tolerance.

## First text run a layout_normalize pass regressed

- **text "EMITENTE" in body>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(1)>div:nth-child(1)** (event #41)
- first over tolerance: **L0** — RAW BLITZ/PARLEY TEXT as read by vellora's walk (L0); no normalize pass involved
- regressed by (which layer made it worse, per coordinate): **L0 dx 0→1.11 (first layer); painted_table_cell_text_baselines overshoot dy 0.86→-1.14**
- dominant layer (largest step of the final Δ): painted_table_cell_text_baselines (dy -2); step decomposition (sums to the final Δ): L0 dx +1.11; painted_table_cell_text_baselines dy -2
- Chromium fragment: "EMITENTE" at x=19.89 y=197.14 w=63.69; vellora faces: LiberationSans-Regular.ttf

| layer | status | dx | dy | dw | dright | dy basis |
| --- | --- | --- | --- | --- | --- | --- |
| N0 | n/a |  |  |  |  |  |
| B0 | n/a |  |  |  |  |  |
| L0 | diverged | 1.11 | 0.86 | -0.02 | 1.09 | baseline |
| vertical_margin_collapse | diverged | 1.11 | 0.86 | -0.02 | 1.09 | baseline |
| collapsed_table_medium_border_insets | diverged | 1.11 | 0.86 | -0.02 | 1.09 | baseline |
| painted_table_cell_text_baselines | diverged | 1.11 | -1.14 | -0.02 | 1.09 | baseline |
| fixed_table_widths | diverged | 1.11 | -1.14 | -0.02 | 1.09 | baseline |
| table_percent_widths | diverged | 1.11 | -1.14 | -0.02 | 1.09 | baseline |
| auto_table_compact_columns | diverged | 1.11 | -1.14 | -0.02 | 1.09 | baseline |
| collapsed_table_medium_border_insets_x | diverged | 1.11 | -1.14 | -0.02 | 1.09 | baseline |

Ancestor chain (compared boxes, root first; deltas = vellora − Chromium, CSS px):

| ancestor | collapsed_table_medium_border_insets_x dx,dy,dw,dh | N0 dx,dy,dw,dh | B0 dx,dy,dw,dh | L0 dx,dy,dw,dh |
| --- | --- | --- | --- | --- |
| html | 0, 0, 0, 3.55 | 0, 0, 0, 3.55 | 0, 0, 0, 3.55 | 0, 0, 0, 3.55 |
| body | 0, 0, 0, 3.55 | 0, 0, 0, 3.55 | 0, 0, 0, 3.55 | 0, 0, 0, 3.55 |
| body>table:nth-child(2) | 0, -0.03, 0, 2.14 | 0, -0.03, 0, 2.14 | 0, -0.03, 0, 2.14 | 0, -0.03, 0, 2.14 |
| body>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(1) | 0.5, 0.47, -11.5, 1.14 | 0.5, 0.47, -11.5, 1.14 | 0.5, 0.47, -11.5, 1.14 | 0.5, 0.47, -11.5, 1.14 |

## First box event vellora's walk (L0) regressed vs Blitz (B0)

None: L0 never worsened, overshot or lost a box event vs B0 by more than tolerance.

## First box event html_normalize regressed (B0 vs N0)

None: B0 never worsened, overshot or lost a box event vs N0 by more than tolerance.

## Compared Chromium boxes with no vellora box (final layer)

None: every compared Chromium box has a vellora box.

## Regressions by layer

Events each layer REGRESSED (worsened / overshoot by more than tolerance on any single checked coordinate, or lost the box) relative to the previous layer; for the first layer of the chain, vs Chromium (= already over tolerance). Independent of the first-over-tolerance label and of the headline, so a pass that worsens an already-divergent box, or any box after the first natural divergence, is listed here.

| layer | box events regressed (worsened/overshoot/lost) | text events regressed | first box regressed | largest box regression | first text regressed | largest text regression |
| --- | --- | --- | --- | --- | --- | --- |
| N0 | 309 (309/0/0) | n/a | enter (x/y/width) body>table:nth-child(1)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(1) (N0 dw 0→-10.47 (first layer)) | enter (x/y/width) body>table:nth-child(3)>thead:nth-child(1)>tr:nth-child(1)>th:nth-child(1) worsened dw 0→-39.75 | — | — |
| B0 | 0 (0/0/0) | n/a | — | — | — | — |
| L0 | 0 (200/0/0) | 200 | — | — | text "EMITENTE" in body>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(1)>div:nth-child(1) (L0 dx 0→1.11 (first layer)) | text "40" in body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(1)>td:nth-child(2) worsened dx 0→-17.91 |
| vertical_margin_collapse | 0 (0/0/0) | 0 | — | — | — | — |
| collapsed_table_medium_border_insets | 0 (0/0/0) | 0 | — | — | — | — |
| painted_table_cell_text_baselines | 0 (0/8/0) | 8 | — | — | text "EMITENTE" in body>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(1)>div:nth-child(1) (painted_table_cell_text_baselines overshoot dy 0.86→-1.14) | text "EMITENTE" in body>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(1)>div:nth-child(1) overshoot dy 0.86→-1.14 |
| fixed_table_widths | 0 (0/0/0) | 0 | — | — | — | — |
| table_percent_widths | 0 (0/0/0) | 0 | — | — | — | — |
| auto_table_compact_columns | 0 (70/0/0) | 70 | — | — | text "PREÇO UNIT." in body>table:nth-child(3)>thead:nth-child(1)>tr:nth-child(1)>th:nth-child(3) (auto_table_compact_columns dx -10.33→13.63) | text "R$ 1.300,00" in body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(1)>td:nth-child(4) worsened dx -0.33→12.7 |
| collapsed_table_medium_border_insets_x | 0 (0/0/0) | 0 | — | — | — | — |

Events regressed by each layer after N0, in document order (first 12 per layer here, 40 in diff.json; N0 omitted: it is the list of items already over tolerance in the first layer):

| layer | event | kind | coord | from → to | first over tol. | dominant |
| --- | --- | --- | --- | --- | --- | --- |
| painted_table_cell_text_baselines | text "EMITENTE" in body>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(1)>div:nth-child(1) | overshoot | dy | 0.86 → -1.14 | L0 | painted_table_cell_text_baselines |
| painted_table_cell_text_baselines | text "Acme Widgets LON" in body>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(1)>div:nth-child(2) | overshoot | dy | 0.89 → -1.11 | L0 | painted_table_cell_text_baselines |
| painted_table_cell_text_baselines | text "Rua das Flores, 123 — Sala 4B" in body>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(1)>p:nth-child(3) | overshoot | dy | 1.02 → -0.98 | L0 | painted_table_cell_text_baselines |
| painted_table_cell_text_baselines | text "CNPJ 12.345.678/0001-90" in body>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(1)>p:nth-child(6) | overshoot | dy | 0.94 → -1.06 | L0 | painted_table_cell_text_baselines |
| painted_table_cell_text_baselines | text "DESTINATÁRIO" in body>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(2)>div:nth-child(1) | overshoot | dy | 0.86 → -1.14 | L0 | L0 |
| painted_table_cell_text_baselines | text "Borges & Pinto Comércio Ltda." in body>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(2)>div:nth-child(2) | overshoot | dy | 0.89 → -1.11 | L0 | L0 |
| painted_table_cell_text_baselines | text "Cliente CUST-00042" in body>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(2)>p:nth-child(3) | overshoot | dy | 1.02 → -0.98 | L0 | L0 |
| painted_table_cell_text_baselines | text "13010-111, Brasil" in body>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(2)>p:nth-child(6) | overshoot | dy | 0.94 → -1.06 | L0 | L0 |
| auto_table_compact_columns | text "PREÇO UNIT." in body>table:nth-child(3)>thead:nth-child(1)>tr:nth-child(1)>th:nth-child(3) | worsened | dx | -10.33 → 13.63 | L0 | auto_table_compact_columns |
| auto_table_compact_columns | text "TOTAL" in body>table:nth-child(3)>thead:nth-child(1)>tr:nth-child(1)>th:nth-child(4) | worsened | dx | -0.34 → 12.69 | L0 | auto_table_compact_columns |
| auto_table_compact_columns | text "R$ 32,50" in body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(1)>td:nth-child(3) | worsened | dx | -10.32 → 13.64 | L0 | auto_table_compact_columns |
| auto_table_compact_columns | text "R$ 1.300,00" in body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(1)>td:nth-child(4) | worsened | dx | -0.33 → 12.7 | L0 | auto_table_compact_columns |
| auto_table_compact_columns | text "R$ 18,90" in body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(2)>td:nth-child(3) | worsened | dx | -10.32 → 13.64 | L0 | auto_table_compact_columns |
| auto_table_compact_columns | text "R$ 472,50" in body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(2)>td:nth-child(4) | worsened | dx | -0.34 → 12.69 | L0 | auto_table_compact_columns |
| auto_table_compact_columns | text "R$ 9,75" in body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(3)>td:nth-child(3) | worsened | dx | -10.33 → 13.63 | L0 | auto_table_compact_columns |
| auto_table_compact_columns | text "R$ 175,50" in body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(3)>td:nth-child(4) | worsened | dx | -0.34 → 12.69 | L0 | auto_table_compact_columns |
| auto_table_compact_columns | text "R$ 47,20" in body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(4)>td:nth-child(3) | worsened | dx | -10.32 → 13.64 | L0 | auto_table_compact_columns |
| auto_table_compact_columns | text "R$ 2.832,00" in body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(4)>td:nth-child(4) | worsened | dx | -0.33 → 12.7 | L0 | auto_table_compact_columns |
| auto_table_compact_columns | text "R$ 6,40" in body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(5)>td:nth-child(3) | worsened | dx | -10.33 → 13.63 | L0 | auto_table_compact_columns |
| auto_table_compact_columns | text "R$ 768,00" in body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(5)>td:nth-child(4) | worsened | dx | -0.34 → 12.69 | L0 | auto_table_compact_columns |

## First divergence per layer

The first event over tolerance (or lost) IN each layer. After the document's natural first divergence every layer usually repeats the same event; use `Regressions by layer` for what each layer changed.

| layer | first box | box Δ | first text | text Δ (dx, dy) |
| --- | --- | --- | --- | --- |
| N0 | enter (x/y/width) body>table:nth-child(1)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(1) | 0, 0, -10.47 | n/a (no text in Blitz trees) |  |
| B0 | enter (x/y/width) body>table:nth-child(1)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(1) | 0, 0, -10.47 | n/a (no text in Blitz trees) |  |
| L0 | enter (x/y/width) body>table:nth-child(1)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(1) | 0, 0, -10.47 | text "EMITENTE" in body>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(1)>div:nth-child(1) | 1.11, 0.86 |
| vertical_margin_collapse | enter (x/y/width) body>table:nth-child(1)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(1) | 0, 0, -10.47 | text "EMITENTE" in body>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(1)>div:nth-child(1) | 1.11, 0.86 |
| collapsed_table_medium_border_insets | enter (x/y/width) body>table:nth-child(1)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(1) | 0, 0, -10.47 | text "EMITENTE" in body>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(1)>div:nth-child(1) | 1.11, 0.86 |
| painted_table_cell_text_baselines | enter (x/y/width) body>table:nth-child(1)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(1) | 0, 0, -10.47 | text "EMITENTE" in body>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(1)>div:nth-child(1) | 1.11, -1.14 |
| fixed_table_widths | enter (x/y/width) body>table:nth-child(1)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(1) | 0, 0, -10.47 | text "EMITENTE" in body>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(1)>div:nth-child(1) | 1.11, -1.14 |
| table_percent_widths | enter (x/y/width) body>table:nth-child(1)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(1) | 0, 0, -10.47 | text "EMITENTE" in body>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(1)>div:nth-child(1) | 1.11, -1.14 |
| auto_table_compact_columns | enter (x/y/width) body>table:nth-child(1)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(1) | 0, 0, -10.47 | text "EMITENTE" in body>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(1)>div:nth-child(1) | 1.11, -1.14 |
| collapsed_table_medium_border_insets_x | enter (x/y/width) body>table:nth-child(1)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(1) | 0, 0, -10.47 | text "EMITENTE" in body>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(1)>div:nth-child(1) | 1.11, -1.14 |

## Per-layer error and layer effects

`moved` = boxes/runs whose geometry this layer changed vs the previous one; `better`/`worse` = max |Δ| per item moved closer to / further from Chromium; `Σ` = summed change of that max |Δ| (a few large improvements can make it negative while one box regresses); `regressed` = items this layer worsened or overshot on some coordinate by more than tolerance (classifyStep), NAMED: the first three in document order (boxes that only absorbed or followed a regressed box's change rank last) and the largest.

| layer | box events diverged | text events diverged | mean abs box Δ (px) | boxes moved/better/worse (Σ) | boxes regressed (largest) | runs moved/better/worse (Σ) | runs regressed (largest) |
| --- | --- | --- | --- | --- | --- | --- | --- |
| N0 | 309 | n/a | 24.59 |  |  |  |  |
| B0 | 309 | n/a | 24.59 | 0/0/0 (0) | 0 | 0/0/0 (0) | 0 |
| L0 | 309 | 200 | 24.59 | 0/0/0 (0) | 0 | 0/0/0 (0) | 0 |
| vertical_margin_collapse | 309 | 200 | 24.59 | 0/0/0 (0) | 0 | 0/0/0 (0) | 0 |
| collapsed_table_medium_border_insets | 309 | 200 | 24.59 | 0/0/0 (0) | 0 | 0/0/0 (0) | 0 |
| painted_table_cell_text_baselines | 309 | 165 | 24.59 | 0/0/0 (0) | 0 | 190/109/1 (-210.16) | 8: "EMITENTE" overshoot dy 0.86→-1.14; "Acme Widgets LON" overshoot dy 0.89→-1.11; "Rua das Flores, 123 " overshoot dy 1.02→-0.98 |
| fixed_table_widths | 309 | 165 | 24.59 | 0/0/0 (0) | 0 | 0/0/0 (0) | 0 |
| table_percent_widths | 309 | 165 | 24.59 | 0/0/0 (0) | 0 | 0/0/0 (0) | 0 |
| auto_table_compact_columns | 309 | 176 | 12.91 | 140/140/0 (-2568.2) | 0 | 105/35/70 (364.83) | 70: "PREÇO UNIT." dx -10.33→13.63; "TOTAL" dx -0.34→12.69; "R$ 32,50" dx -10.32→13.64; largest: "R$ 1.300,00" dx -0.33→12.7 |
| collapsed_table_medium_border_insets_x | 309 | 176 | 12.91 | 0/0/0 (0) | 0 | 0/0/0 (0) | 0 |

## Top 20 box divergences in collapsed_table_medium_border_insets_x (absolute)

| path | dx | dy | dw | dh | regressed by | first over tol. | dominant (step) | steps |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(1)>td:nth-child(1)>span:nth-child(1) | -0.33 | 2.45 | -39.09 | -0.47 | N0 dw 0→-39.09 (first layer) | N0 | N0 (dw -39.09) | N0 dw -39.09 |
| body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(2)>td:nth-child(1)>span:nth-child(1) | -0.33 | 2.05 | -39.09 | 0.53 | N0 dw 0→-39.09 (first layer) | N0 | N0 (dw -39.09) | N0 dw -39.09 |
| body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(3)>td:nth-child(1)>span:nth-child(1) | -0.33 | 2.64 | -39.09 | -0.47 | N0 dw 0→-39.09 (first layer) | N0 | N0 (dw -39.09) | N0 dw -39.09 |
| body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(4)>td:nth-child(1)>span:nth-child(1) | -0.33 | 2.23 | -39.09 | 0.53 | N0 dw 0→-39.09 (first layer) | N0 | N0 (dw -39.09) | N0 dw -39.09 |
| body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(5)>td:nth-child(1)>span:nth-child(1) | -0.33 | 2.83 | -39.09 | -0.47 | N0 dw 0→-39.09 (first layer) | N0 | N0 (dw -39.09) | N0 dw -39.09 |
| body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(6)>td:nth-child(1)>span:nth-child(1) | -0.33 | 2.42 | -39.09 | -0.47 | N0 dw 0→-39.09 (first layer) | N0 | N0 (dw -39.09) | N0 dw -39.09 |
| body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(7)>td:nth-child(1)>span:nth-child(1) | -0.33 | 2.02 | -39.09 | 0.53 | N0 dw 0→-39.09 (first layer) | N0 | N0 (dw -39.09) | N0 dw -39.09 |
| body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(8)>td:nth-child(1)>span:nth-child(1) | -0.33 | 2.61 | -39.09 | -0.47 | N0 dw 0→-39.09 (first layer) | N0 | N0 (dw -39.09) | N0 dw -39.09 |
| body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(9)>td:nth-child(1)>span:nth-child(1) | -0.33 | 2.2 | -39.09 | 0.53 | N0 dw 0→-39.09 (first layer) | N0 | N0 (dw -39.09) | N0 dw -39.09 |
| body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(10)>td:nth-child(1)>span:nth-child(1) | -0.33 | 2.8 | -39.09 | -0.47 | N0 dw 0→-39.09 (first layer) | N0 | N0 (dw -39.09) | N0 dw -39.09 |
| body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(11)>td:nth-child(1)>span:nth-child(1) | -0.33 | 2.39 | -39.09 | 0.53 | N0 dw 0→-39.09 (first layer) | N0 | N0 (dw -39.09) | N0 dw -39.09 |
| body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(12)>td:nth-child(1)>span:nth-child(1) | -0.33 | 2.98 | -39.09 | -0.47 | N0 dw 0→-39.09 (first layer) | N0 | N0 (dw -39.09) | N0 dw -39.09 |
| body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(13)>td:nth-child(1)>span:nth-child(1) | -0.33 | 2.58 | -39.09 | -0.47 | N0 dw 0→-39.09 (first layer) | N0 | N0 (dw -39.09) | N0 dw -39.09 |
| body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(14)>td:nth-child(1)>span:nth-child(1) | -0.33 | 2.17 | -39.09 | 0.53 | N0 dw 0→-39.09 (first layer) | N0 | N0 (dw -39.09) | N0 dw -39.09 |
| body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(15)>td:nth-child(1)>span:nth-child(1) | -0.33 | 2.77 | -39.09 | -0.47 | N0 dw 0→-39.09 (first layer) | N0 | N0 (dw -39.09) | N0 dw -39.09 |
| body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(16)>td:nth-child(1)>span:nth-child(1) | -0.33 | 2.36 | -39.09 | 0.53 | N0 dw 0→-39.09 (first layer) | N0 | N0 (dw -39.09) | N0 dw -39.09 |
| body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(17)>td:nth-child(1)>span:nth-child(1) | -0.33 | 2.95 | -39.09 | -0.47 | N0 dw 0→-39.09 (first layer) | N0 | N0 (dw -39.09) | N0 dw -39.09 |
| body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(18)>td:nth-child(1)>span:nth-child(1) | -0.33 | 2.55 | -39.09 | 0.53 | N0 dw 0→-39.09 (first layer) | N0 | N0 (dw -39.09) | N0 dw -39.09 |
| body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(19)>td:nth-child(1)>span:nth-child(1) | -0.33 | 3.14 | -39.09 | -0.47 | N0 dw 0→-39.09 (first layer) | N0 | N0 (dw -39.09) | N0 dw -39.09 |
| body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(20)>td:nth-child(1)>span:nth-child(1) | -0.33 | 2.73 | -39.09 | 0.53 | N0 dw 0→-39.09 (first layer) | N0 | N0 (dw -39.09) | N0 dw -39.09 |

## Top 20 LOCAL box divergences

rdx/rdy = the error a box ADDS to what it inherits: after a previous compared sibling in the same row, relative to that sibling's right edge (dx+dw) and dy; after a stacked sibling, relative to its bottom edge (dy+dh); a first child, relative to its parent's dx/dy. Isolates where cumulative drift originates.

| path | rdx | rdy | dw | dh | regressed by | first over tol. | dominant (step) |
| --- | --- | --- | --- | --- | --- | --- | --- |
| body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(1)>td:nth-child(1)>span:nth-child(1) | -0.33 | 0.38 | -39.09 | -0.47 | N0 dw 0→-39.09 (first layer) | N0 | N0 (dw -39.09) |
| body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(2)>td:nth-child(1)>span:nth-child(1) | -0.33 | -1.12 | -39.09 | 0.53 | N0 dw 0→-39.09 (first layer) | N0 | N0 (dw -39.09) |
| body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(3)>td:nth-child(1)>span:nth-child(1) | -0.33 | -0.12 | -39.09 | -0.47 | N0 dw 0→-39.09 (first layer) | N0 | N0 (dw -39.09) |
| body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(4)>td:nth-child(1)>span:nth-child(1) | -0.33 | -1.12 | -39.09 | 0.53 | N0 dw 0→-39.09 (first layer) | N0 | N0 (dw -39.09) |
| body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(5)>td:nth-child(1)>span:nth-child(1) | -0.33 | -0.12 | -39.09 | -0.47 | N0 dw 0→-39.09 (first layer) | N0 | N0 (dw -39.09) |
| body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(6)>td:nth-child(1)>span:nth-child(1) | -0.33 | -0.12 | -39.09 | -0.47 | N0 dw 0→-39.09 (first layer) | N0 | N0 (dw -39.09) |
| body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(7)>td:nth-child(1)>span:nth-child(1) | -0.33 | -1.12 | -39.09 | 0.53 | N0 dw 0→-39.09 (first layer) | N0 | N0 (dw -39.09) |
| body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(8)>td:nth-child(1)>span:nth-child(1) | -0.33 | -0.12 | -39.09 | -0.47 | N0 dw 0→-39.09 (first layer) | N0 | N0 (dw -39.09) |
| body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(9)>td:nth-child(1)>span:nth-child(1) | -0.33 | -1.12 | -39.09 | 0.53 | N0 dw 0→-39.09 (first layer) | N0 | N0 (dw -39.09) |
| body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(10)>td:nth-child(1)>span:nth-child(1) | -0.33 | -0.12 | -39.09 | -0.47 | N0 dw 0→-39.09 (first layer) | N0 | N0 (dw -39.09) |
| body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(11)>td:nth-child(1)>span:nth-child(1) | -0.33 | -1.12 | -39.09 | 0.53 | N0 dw 0→-39.09 (first layer) | N0 | N0 (dw -39.09) |
| body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(12)>td:nth-child(1)>span:nth-child(1) | -0.33 | -0.12 | -39.09 | -0.47 | N0 dw 0→-39.09 (first layer) | N0 | N0 (dw -39.09) |
| body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(13)>td:nth-child(1)>span:nth-child(1) | -0.33 | -0.12 | -39.09 | -0.47 | N0 dw 0→-39.09 (first layer) | N0 | N0 (dw -39.09) |
| body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(14)>td:nth-child(1)>span:nth-child(1) | -0.33 | -1.12 | -39.09 | 0.53 | N0 dw 0→-39.09 (first layer) | N0 | N0 (dw -39.09) |
| body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(15)>td:nth-child(1)>span:nth-child(1) | -0.33 | -0.12 | -39.09 | -0.47 | N0 dw 0→-39.09 (first layer) | N0 | N0 (dw -39.09) |
| body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(16)>td:nth-child(1)>span:nth-child(1) | -0.33 | -1.12 | -39.09 | 0.53 | N0 dw 0→-39.09 (first layer) | N0 | N0 (dw -39.09) |
| body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(17)>td:nth-child(1)>span:nth-child(1) | -0.33 | -0.12 | -39.09 | -0.47 | N0 dw 0→-39.09 (first layer) | N0 | N0 (dw -39.09) |
| body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(18)>td:nth-child(1)>span:nth-child(1) | -0.33 | -1.12 | -39.09 | 0.53 | N0 dw 0→-39.09 (first layer) | N0 | N0 (dw -39.09) |
| body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(19)>td:nth-child(1)>span:nth-child(1) | -0.33 | -0.12 | -39.09 | -0.47 | N0 dw 0→-39.09 (first layer) | N0 | N0 (dw -39.09) |
| body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(20)>td:nth-child(1)>span:nth-child(1) | -0.33 | -0.12 | -39.09 | 0.53 | N0 dw 0→-39.09 (first layer) | N0 | N0 (dw -39.09) |

## Top 20 text-run divergences in collapsed_table_medium_border_insets_x

| owner | text | dx | dy | dw | dright | faces | regressed by | first over tol. | dominant (step) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(33)>td:nth-child(3) | R$ 6.800,00 | 13.64 | 0.77 | -0.02 | 13.62 | LiberationSans-Regular.ttf | L0 dx 0→-10.31 (first layer); auto_table_compact_columns dx -10.31→13.64 | L0 | auto_table_compact_columns (dx +23.95) |
| body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(34)>td:nth-child(3) | R$ 1.450,00 | 13.64 | 1.36 | -0.02 | 13.62 | LiberationSans-Regular.ttf | L0 dx 0→-10.31 (first layer); auto_table_compact_columns dx -10.31→13.64 | L0 | auto_table_compact_columns (dx +23.95) |
| body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(1)>td:nth-child(3) | R$ 32,50 | 13.64 | 0.77 | -0.02 | 13.62 | LiberationSans-Regular.ttf | L0 dx 0→-10.32 (first layer); auto_table_compact_columns dx -10.32→13.64 | L0 | auto_table_compact_columns (dx +23.95) |
| body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(2)>td:nth-child(3) | R$ 18,90 | 13.64 | 0.36 | -0.02 | 13.62 | LiberationSans-Regular.ttf | L0 dx 0→-10.32 (first layer); auto_table_compact_columns dx -10.32→13.64 | L0 | auto_table_compact_columns (dx +23.95) |
| body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(4)>td:nth-child(3) | R$ 47,20 | 13.64 | 0.55 | -0.02 | 13.62 | LiberationSans-Regular.ttf | L0 dx 0→-10.32 (first layer); auto_table_compact_columns dx -10.32→13.64 | L0 | auto_table_compact_columns (dx +23.95) |
| body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(6)>td:nth-child(3) | R$ 28,00 | 13.64 | 0.73 | -0.02 | 13.62 | LiberationSans-Regular.ttf | L0 dx 0→-10.32 (first layer); auto_table_compact_columns dx -10.32→13.64 | L0 | auto_table_compact_columns (dx +23.95) |
| body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(7)>td:nth-child(3) | R$ 89,90 | 13.64 | 0.33 | -0.02 | 13.62 | LiberationSans-Regular.ttf | L0 dx 0→-10.32 (first layer); auto_table_compact_columns dx -10.32→13.64 | L0 | auto_table_compact_columns (dx +23.95) |
| body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(8)>td:nth-child(3) | R$ 34,50 | 13.64 | 0.92 | -0.02 | 13.62 | LiberationSans-Regular.ttf | L0 dx 0→-10.32 (first layer); auto_table_compact_columns dx -10.32→13.64 | L0 | auto_table_compact_columns (dx +23.95) |
| body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(10)>td:nth-child(3) | R$ 21,30 | 13.64 | 0.11 | -0.02 | 13.62 | LiberationSans-Regular.ttf | L0 dx 0→-10.32 (first layer); auto_table_compact_columns dx -10.32→13.64 | L0 | auto_table_compact_columns (dx +23.95) |
| body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(12)>td:nth-child(3) | R$ 98,00 | 13.64 | 0.3 | -0.02 | 13.62 | LiberationSans-Regular.ttf | L0 dx 0→-10.32 (first layer); auto_table_compact_columns dx -10.32→13.64 | L0 | auto_table_compact_columns (dx +23.95) |
| body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(13)>td:nth-child(3) | R$ 27,40 | 13.64 | 0.89 | -0.02 | 13.62 | LiberationSans-Regular.ttf | L0 dx 0→-10.32 (first layer); auto_table_compact_columns dx -10.32→13.64 | L0 | auto_table_compact_columns (dx +23.95) |
| body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(14)>td:nth-child(3) | R$ 38,90 | 13.64 | 0.48 | -0.02 | 13.62 | LiberationSans-Regular.ttf | L0 dx 0→-10.32 (first layer); auto_table_compact_columns dx -10.32→13.64 | L0 | auto_table_compact_columns (dx +23.95) |
| body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(15)>td:nth-child(3) | R$ 64,00 | 13.64 | 1.08 | -0.02 | 13.62 | LiberationSans-Regular.ttf | L0 dx 0→-10.32 (first layer); auto_table_compact_columns dx -10.32→13.64 | L0 | auto_table_compact_columns (dx +23.95) |
| body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(16)>td:nth-child(3) | R$ 33,70 | 13.64 | 0.67 | -0.02 | 13.62 | LiberationSans-Regular.ttf | L0 dx 0→-10.32 (first layer); auto_table_compact_columns dx -10.32→13.64 | L0 | auto_table_compact_columns (dx +23.95) |
| body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(18)>td:nth-child(3) | R$ 12,80 | 13.64 | 0.86 | -0.02 | 13.62 | LiberationSans-Regular.ttf | L0 dx 0→-10.32 (first layer); auto_table_compact_columns dx -10.32→13.64 | L0 | auto_table_compact_columns (dx +23.95) |
| body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(19)>td:nth-child(3) | R$ 19,60 | 13.64 | 0.45 | -0.02 | 13.62 | LiberationSans-Regular.ttf | L0 dx 0→-10.32 (first layer); auto_table_compact_columns dx -10.32→13.64 | L0 | auto_table_compact_columns (dx +23.95) |
| body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(20)>td:nth-child(3) | R$ 54,30 | 13.64 | 1.05 | -0.02 | 13.62 | LiberationSans-Regular.ttf | L0 dx 0→-10.32 (first layer); auto_table_compact_columns dx -10.32→13.64 | L0 | auto_table_compact_columns (dx +23.95) |
| body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(21)>td:nth-child(3) | R$ 22,90 | 13.64 | 0.64 | -0.02 | 13.62 | LiberationSans-Regular.ttf | L0 dx 0→-10.32 (first layer); auto_table_compact_columns dx -10.32→13.64 | L0 | auto_table_compact_columns (dx +23.95) |
| body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(22)>td:nth-child(3) | R$ 41,00 | 13.64 | 1.23 | -0.02 | 13.62 | LiberationSans-Regular.ttf | L0 dx 0→-10.32 (first layer); auto_table_compact_columns dx -10.32→13.64 | L0 | auto_table_compact_columns (dx +23.95) |
| body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(23)>td:nth-child(3) | R$ 14,50 | 13.64 | 0.83 | -0.02 | 13.62 | LiberationSans-Regular.ttf | L0 dx 0→-10.32 (first layer); auto_table_compact_columns dx -10.32→13.64 | L0 | auto_table_compact_columns (dx +23.95) |

## Top 20 LOCAL text-run divergences

rdx/rdy = the run's Δ minus its owner box's dx/dy (final layer), so runs that only ride along with a shifted owner rank low (de-duplicates cascades, like the local box table).

| owner | text | rdx | rdy | dx | dy | regressed by | first over tol. | dominant (step) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(5)>td:nth-child(2) | 120 | 21.85 | -2.81 | 13.05 | 0.14 | L0 dx 0→-17.9 (first layer) | L0 | auto_table_compact_columns (dx +30.95) |
| body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(11)>td:nth-child(2) | 8 | 21.85 | -2.81 | 13.05 | 0.7 | L0 dx 0→-17.9 (first layer) | L0 | auto_table_compact_columns (dx +30.95) |
| body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(13)>td:nth-child(2) | 6 | 21.85 | -1.81 | 13.05 | 0.89 | L0 dx 0→-17.9 (first layer) | L0 | auto_table_compact_columns (dx +30.95) |
| body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(17)>td:nth-child(2) | 5 | 21.85 | -2.81 | 13.05 | 0.27 | L0 dx 0→-17.9 (first layer) | L0 | auto_table_compact_columns (dx +30.95) |
| body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(29)>td:nth-child(2) | 8 | 21.85 | -1.81 | 13.05 | 1.39 | L0 dx 0→-17.9 (first layer) | L0 | auto_table_compact_columns (dx +30.95) |
| body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(32)>td:nth-child(2) | 5 | 21.85 | -2.81 | 13.05 | 1.17 | L0 dx 0→-17.9 (first layer) | L0 | auto_table_compact_columns (dx +30.95) |
| body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(33)>td:nth-child(2) | 1 | 21.85 | -2.81 | 13.05 | 0.77 | L0 dx 0→-17.9 (first layer) | L0 | auto_table_compact_columns (dx +30.95) |
| body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(34)>td:nth-child(2) | 2 | 21.85 | -1.81 | 13.05 | 1.36 | L0 dx 0→-17.9 (first layer) | L0 | auto_table_compact_columns (dx +30.95) |
| body>table:nth-child(3)>thead:nth-child(1)>tr:nth-child(1)>th:nth-child(2) | QTD. | 21.85 | -1.81 | 13.05 | 0.28 | L0 dx 0→-17.9 (first layer) | L0 | auto_table_compact_columns (dx +30.95) |
| body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(1)>td:nth-child(2) | 40 | 21.84 | -1.31 | 13.04 | 0.77 | L0 dx 0→-17.91 (first layer) | L0 | auto_table_compact_columns (dx +30.95) |
| body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(2)>td:nth-child(2) | 25 | 21.84 | -2.81 | 13.04 | 0.36 | L0 dx 0→-17.91 (first layer) | L0 | auto_table_compact_columns (dx +30.95) |
| body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(3)>td:nth-child(2) | 18 | 21.84 | -2.81 | 13.04 | -0.05 | L0 dx 0→-17.91 (first layer) | L0 | auto_table_compact_columns (dx +30.95) |
| body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(4)>td:nth-child(2) | 60 | 21.84 | -2.81 | 13.04 | 0.55 | L0 dx 0→-17.91 (first layer) | L0 | auto_table_compact_columns (dx +30.95) |
| body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(6)>td:nth-child(2) | 30 | 21.84 | -1.81 | 13.04 | 0.73 | L0 dx 0→-17.91 (first layer) | L0 | auto_table_compact_columns (dx +30.95) |
| body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(7)>td:nth-child(2) | 22 | 21.84 | -2.81 | 13.04 | 0.33 | L0 dx 0→-17.91 (first layer) | L0 | auto_table_compact_columns (dx +30.95) |
| body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(8)>td:nth-child(2) | 44 | 21.84 | -1.81 | 13.04 | 0.92 | L0 dx 0→-17.91 (first layer) | L0 | auto_table_compact_columns (dx +30.95) |
| body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(9)>td:nth-child(2) | 12 | 21.84 | -2.81 | 13.04 | 0.52 | L0 dx 0→-17.91 (first layer) | L0 | auto_table_compact_columns (dx +30.95) |
| body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(10)>td:nth-child(2) | 24 | 21.84 | -2.81 | 13.04 | 0.11 | L0 dx 0→-17.91 (first layer) | L0 | auto_table_compact_columns (dx +30.95) |
| body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(12)>td:nth-child(2) | 10 | 21.84 | -2.81 | 13.04 | 0.3 | L0 dx 0→-17.91 (first layer) | L0 | auto_table_compact_columns (dx +30.95) |
| body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(14)>td:nth-child(2) | 30 | 21.84 | -2.81 | 13.04 | 0.48 | L0 dx 0→-17.91 (first layer) | L0 | auto_table_compact_columns (dx +30.95) |

## Margins (not part of the x/y/w/h attribution)

vellora margins are Blitz's resolved layout.margin as read by the walk (L0) and after the passes; Chromium values are COMPUTED margins of the element itself (not collapsed through descendants). Not part of the x/y/w/h attribution.

- boxes with vellora margins: 220; changed by the passes (L0 → final): 0
- differ from Chromium COMPUTED margins by > tolerance (L0): 0


## Match counts and node policy

- Chromium elements under html (head excluded) by policy: compared 220, no-blitz-box 46, inline-text-only 3
- vellora L0 boxes (elements, head excluded): 304; matched to a compared Chromium box: 220; compared Chromium boxes present in N0: 220
- vellora-only — table row/group: not a Blitz layout node (zero box in walk): 46 (e.g. body>table:nth-child(1)>tbody:nth-child(1); body>table:nth-child(1)>tbody:nth-child(1)>tr:nth-child(1); body>table:nth-child(2)>tbody:nth-child(1))
- vellora-only — html_normalize wrapper (no source node): 35 (e.g. body>table:nth-child(1)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(1)>::vellora-wrapper(1); body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(1)>td:nth-child(1)>::vellora-wrapper(1); body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(2)>td:nth-child(1)>::vellora-wrapper(1))
- vellora-only — inline element (compared via text runs): 3 (e.g. body>table:nth-child(1)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(2)>div:nth-child(2)>div:nth-child(1)>span:nth-child(1); body>table:nth-child(1)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(2)>div:nth-child(2)>div:nth-child(2)>span:nth-child(1); body>table:nth-child(1)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(2)>div:nth-child(2)>div:nth-child(3)>span:nth-child(1))
- Chromium-only compared boxes (no vellora L0 box): 0
- Blitz layout-tree-only nodes (anonymous blocks / pseudo-elements the walk never visits): 0
- Policy: `inline-text-only` = Chromium `display:inline` non-replaced element (Blitz gives it no Taffy box; its text is compared as runs). `no-blitz-box` = table row/row-group that is not a Blitz layout node (zero box in the walk); listed, not scored. `no-layout` = Chromium has no layout object (display:none). Pseudo-elements are matched by `::before`/`::after` segments and never count toward `:nth-child`; their generated text is compared like any text. Anonymous boxes: Chromium's are not exposed by DOMSnapshot; Blitz's appear only in N0/B0 as `::blitz-anon(j)`. html_normalize wrappers are transparent in keys and listed as vellora-only.

## Text alignment

- vellora runs (non-blank, L0): 210; Chromium text fragments (non-blank): 213; matched pairs: 210 (2 joined across fragment/run boundaries)
- unmatched vellora runs: 0; unmatched Chromium fragments: 0; Chromium text with NO vellora owner (text vellora never shaped): 0

## Caveats

- Local macOS Chrome results are INDICATIVE; the authoritative run is the pinned Chrome for Testing on Linux CI (see fidelity/layout-diff/README.md).
- Text dy compares BASELINES when Chromium's ascent for the face/size was measured (probe page, zero-size inline-block on the baseline); otherwise vellora's text top (baseline − Parley ascent) vs Chromium's text-box top (`dy basis` column).
- L0 text positions already include `read_text_runs`' inline padding-right compensation, so 'raw Parley' text is not separated from vellora's reader.
- A layer that moves a box TOWARDS Chromium is an improvement here, whatever its cause; for 'what did this code change do', compare two builds with compare.mjs.
