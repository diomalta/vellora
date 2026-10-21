# Layout diff — notification (pin)

> Continuous-flow comparison: Chromium lays the document out as ONE flow (no fragmentation) at the same viewport width vellora hands Blitz. It is comparable ONLY to vellora's PRE-pagination layers (N0, B0, L0, layout_normalize passes) and says nothing about pagination (page breaks, repeated thead, page-local offsets, margin boxes).

Deltas are vellora − Chromium in CSS px. Paths abbreviate `html>body:nth-child(2)` as `body`.

## Environment

- date_utc: `2026-10-21T04:35:50Z`
- os: `darwin 27.0.0 arm64`
- cpu: `Apple M5 Pro`
- node: `v22.23.2`
- command: `node /Users/diomalta/Repositories/vellora/.claude/worktrees/wf_e3d702d1-528-2/fidelity/layout-diff/run.mjs --label pin`
- repo: `/Users/diomalta/Repositories/vellora/.claude/worktrees/wf_e3d702d1-528-2`
- rustc: `rustc 1.96.0 (ac68faa20 2026-05-25)`
- git_commit: `75f8833ab47a04928d8c5f73f5c422481c2bc993`
- git_dirty: `clean`
- blitz: `blitz-0.3.0-alpha.5+2003ba5`
- chrome_path: `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`
- chrome_version: `Google Chrome 155.0.8059.85`
- templating_repo: `/Users/diomalta/Repositories/vellora/.claude/worktrees/wf_e3d702d1-528-2`
- chrome_user_agent: `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/155.0.0.0 Safari/537.36`
- crates: blitz-dom 0.3.0-alpha.5, blitz-html 0.3.0-alpha.5, blitz-traits 0.3.0-alpha.5, krilla 0.8.2, parley 0.10.0, stylo 0.18.0, taffy 0.11.0-experimental-cache-fix.3
- tools: puppeteer-core 25.15.0

## Checks (input parity, dump self-consistency, coverage)

| check | class | status | detail |
| --- | --- | --- | --- |
| viewport_width | input-parity | pass | Blitz viewport width 672 px; Chromium documentElement.clientWidth 672, innerWidth 672 |
| viewport_height | input-parity | pass | Blitz viewport height 1001 px; Chromium innerHeight 1001 |
| font_block_injected | input-parity | pass | browser HTML carries the bundled @font-face block (<style data-vellora-fidelity-fonts>) |
| bundled_fonts_loaded | input-parity | pass | vellora shaped with 2 bundled face(s); Chromium document.fonts loaded: Liberation Serif 400 normal; Liberation Serif 700 normal; Georgia 400 normal; Georgia 700 normal |
| platform_fonts_custom | input-parity | pass | CSS.getPlatformFontsForNode over 25 text-bearing elements: 0/1751 glyphs rendered with SYSTEM fonts; vellora DejaVu fallback runs: 0 |
| source_html_layer | coverage | pass | N0 present: Blitz laid out the source HTML with html_normalize skipped; the N0 → B0 step is html_normalize's (DOM altered by html_normalize: no) |
| normalize_wrappers_located | self-consistency | pass | html_normalize wrappers recorded 0, located in the Blitz DOM 0 |
| run_meta_alignment | self-consistency | pass | L0 boxes whose Parley runs could not be re-aligned to the walk: 0 |
| layer_order | self-consistency | pass | layers whose box sequence differs from L0: none |
| normalize_dom_roundtrip | self-consistency | pass | element keys of the source DOM (N0) vs html_normalize's output re-parsed by Blitz (B0, wrappers transparent): 42 common; only in source 0; only in normalized 0; same key, different tag/id/class 0 |
| source_dom_keys_vs_chromium | self-consistency | pass | element keys of Blitz's parse of the source HTML (N0) vs Chromium's DOM (head excluded): 42 common; only in vellora 0; only in Chromium 0; same key, different tag/id/class 0 |
| dom_key_alignment | self-consistency | pass | L0 boxes (vellora's render DOM) keyed only on the vellora side: 0; compared Chromium boxes whose path no vellora DOM node has: 0 |
| text_alignment | self-consistency | pass | matched 35 pairs; unmatched vellora runs 0, unmatched Chromium fragments 0, Chromium text with no vellora owner 0 |

## Input parity

- @page content box 672.3351 × 1001.6151 CSS px → Blitz viewport 672 × 1001 (`as u32` truncation in resolve_and_walk drops 0.3351 px of inline size; a KNOWN INPUT divergence vs Chromium print, not an engine difference). Chromium MEASURED: documentElement.clientWidth 672, innerWidth 672, innerHeight 1001 — MATCH.
- Media: Blitz evaluates stylesheets as `screen` (DocumentConfig::media_type default; build_document never sets it). Chromium emulates `print` (matchMedia('print') = true). Fixture contains @media rules: no (media type is inert here).
- Fonts: Chromium loaded Liberation Serif 400 normal; Liberation Serif 700 normal; Georgia 400 normal; Georgia 700 normal from the bundled files (sha256 in env.fonts_sha256). vellora runs by face: LiberationSerif-Bold.ttf 7, LiberationSerif-Regular.ttf 28. DejaVu fallback runs (no Chromium counterpart): 0.
- Baselines: Chromium ascent measured for 7/7 face/size specs.
- html_normalize: changed nothing (wrappers recorded 0, located in the Blitz DOM 0). N0 (Blitz on the source HTML) present: the N0 → B0 step is html_normalize's.
- Blitz anonymous blocks (B0 only): 0; anonymous inline roots holding text (text Blitz shaped that vellora's DOM-children walk never reads): 0.
- Dump self-checks: run-metadata misalignments 0, layer order violations 0 (both expected 0).
- Input sha256: native e644692f09436522…, browser 5223c72b4fa5e97b…

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

- **enter (x/y/width) body>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(1)** (event #12)
- first over tolerance: **N0** — RAW BLITZ: Blitz's layout of the SOURCE HTML (N0) already differs from Chromium
- regressed by (which layer made it worse, per coordinate): **N0 dw 0→-51.56 (first layer)**
- dominant layer (largest step of the final Δ): N0 (dw -51.56); step decomposition (sums to the final Δ): N0 dw -51.56; collapsed_table_medium_border_insets dy -3; collapsed_table_medium_border_insets_x dx -3

| layer | status | dx | dy | dw | dh | dy basis |
| --- | --- | --- | --- | --- | --- | --- |
| N0 | diverged | 3 | 3.09 | -51.56 |  |  |
| B0 | diverged | 3 | 3.09 | -51.56 |  |  |
| L0 | diverged | 3 | 3.09 | -51.56 |  |  |
| vertical_margin_collapse | diverged | 3 | 3.09 | -51.56 |  |  |
| collapsed_table_medium_border_insets | diverged | 3 | 0.09 | -51.56 |  |  |
| painted_table_cell_text_baselines | diverged | 3 | 0.09 | -51.56 |  |  |
| fixed_table_widths | diverged | 3 | 0.09 | -51.56 |  |  |
| table_percent_widths | diverged | 3 | 0.09 | -51.56 |  |  |
| auto_table_compact_columns | diverged | 3 | 0.09 | -51.56 |  |  |
| collapsed_table_medium_border_insets_x | diverged | 0 | 0.09 | -48.72 |  |  |
| N0u | diverged | 3 | 3.03 | -52.06 |  |  |
| B0u | diverged | 3 | 3.03 | -52.06 |  |  |

Ancestor chain (compared boxes, root first; deltas = vellora − Chromium, CSS px):

| ancestor | collapsed_table_medium_border_insets_x dx,dy,dw,dh | N0 dx,dy,dw,dh | B0 dx,dy,dw,dh | L0 dx,dy,dw,dh |
| --- | --- | --- | --- | --- |
| html | 0, 0, 0, 12.52 | 0, 0, 0, 12.52 | 0, 0, 0, 12.52 | 0, 0, 0, 12.52 |
| body | 0, 0, 0, 12.52 | 0, 0, 0, 12.52 | 0, 0, 0, 12.52 | 0, 0, 0, 12.52 |
| body>table:nth-child(2) | 0, 0.09, 0, 0 | 0, 0.09, 0, 6 | 0, 0.09, 0, 6 | 0, 0.09, 0, 6 |

## First divergent text run in collapsed_table_medium_border_insets_x

- **text "Acme Serviços Prediais Ltda." in body>div:nth-child(1)>div:nth-child(1)** (event #4)
- first over tolerance: **L0** — RAW BLITZ/PARLEY TEXT as read by vellora's walk (L0); no normalize pass involved
- regressed by (which layer made it worse, per coordinate): **L0 dy 0→1 (first layer)**
- dominant layer (largest step of the final Δ): L0 (dy +1); step decomposition (sums to the final Δ): L0 dy +1
- Chromium fragment: "Acme Serviços Prediais Ltda." at x=0 y=3 w=286.05; vellora faces: LiberationSerif-Bold.ttf

| layer | status | dx | dy | dw | dright | dy basis |
| --- | --- | --- | --- | --- | --- | --- |
| N0 | n/a |  |  |  |  |  |
| B0 | n/a |  |  |  |  |  |
| L0 | diverged | 0 | 1 | 0.04 | 0.04 | baseline |
| vertical_margin_collapse | diverged | 0 | 1 | 0.04 | 0.04 | baseline |
| collapsed_table_medium_border_insets | diverged | 0 | 1 | 0.04 | 0.04 | baseline |
| painted_table_cell_text_baselines | diverged | 0 | 1 | 0.04 | 0.04 | baseline |
| fixed_table_widths | diverged | 0 | 1 | 0.04 | 0.04 | baseline |
| table_percent_widths | diverged | 0 | 1 | 0.04 | 0.04 | baseline |
| auto_table_compact_columns | diverged | 0 | 1 | 0.04 | 0.04 | baseline |
| collapsed_table_medium_border_insets_x | diverged | 0 | 1 | 0.04 | 0.04 | baseline |

Ancestor chain (compared boxes, root first; deltas = vellora − Chromium, CSS px):

| ancestor | collapsed_table_medium_border_insets_x dx,dy,dw,dh | N0 dx,dy,dw,dh | B0 dx,dy,dw,dh | L0 dx,dy,dw,dh |
| --- | --- | --- | --- | --- |
| html | 0, 0, 0, 12.52 | 0, 0, 0, 12.52 | 0, 0, 0, 12.52 | 0, 0, 0, 12.52 |
| body | 0, 0, 0, 12.52 | 0, 0, 0, 12.52 | 0, 0, 0, 12.52 | 0, 0, 0, 12.52 |
| body>div:nth-child(1) | 0, 0, 0, 0.09 | 0, 0, 0, 0.09 | 0, 0, 0, 0.09 | 0, 0, 0, 0.09 |

## First box event a layout_normalize pass regressed

- **enter (x/y/width) body>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(2)** (event #16)
- first over tolerance: **N0** — RAW BLITZ: Blitz's layout of the SOURCE HTML (N0) already differs from Chromium
- regressed by (which layer made it worse, per coordinate): **N0 dx 0→-45.56 (first layer); collapsed_table_medium_border_insets_x dw 42.56→45.7**
- dominant layer (largest step of the final Δ): N0 (dx -45.56); step decomposition (sums to the final Δ): N0 dx -45.56; collapsed_table_medium_border_insets dy -3; collapsed_table_medium_border_insets_x dw +3.14

| layer | status | dx | dy | dw | dh | dy basis |
| --- | --- | --- | --- | --- | --- | --- |
| N0 | diverged | -45.56 | 3.09 | 42.56 |  |  |
| B0 | diverged | -45.56 | 3.09 | 42.56 |  |  |
| L0 | diverged | -45.56 | 3.09 | 42.56 |  |  |
| vertical_margin_collapse | diverged | -45.56 | 3.09 | 42.56 |  |  |
| collapsed_table_medium_border_insets | diverged | -45.56 | 0.09 | 42.56 |  |  |
| painted_table_cell_text_baselines | diverged | -45.56 | 0.09 | 42.56 |  |  |
| fixed_table_widths | diverged | -45.56 | 0.09 | 42.56 |  |  |
| table_percent_widths | diverged | -45.56 | 0.09 | 42.56 |  |  |
| auto_table_compact_columns | diverged | -45.56 | 0.09 | 42.56 |  |  |
| collapsed_table_medium_border_insets_x | diverged | -45.7 | 0.09 | 45.7 |  |  |
| N0u | diverged | -46.06 | 3.03 | 43.06 |  |  |
| B0u | diverged | -46.06 | 3.03 | 43.06 |  |  |

Ancestor chain (compared boxes, root first; deltas = vellora − Chromium, CSS px):

| ancestor | collapsed_table_medium_border_insets_x dx,dy,dw,dh | N0 dx,dy,dw,dh | B0 dx,dy,dw,dh | L0 dx,dy,dw,dh |
| --- | --- | --- | --- | --- |
| html | 0, 0, 0, 12.52 | 0, 0, 0, 12.52 | 0, 0, 0, 12.52 | 0, 0, 0, 12.52 |
| body | 0, 0, 0, 12.52 | 0, 0, 0, 12.52 | 0, 0, 0, 12.52 | 0, 0, 0, 12.52 |
| body>table:nth-child(2) | 0, 0.09, 0, 0 | 0, 0.09, 0, 6 | 0, 0.09, 0, 6 | 0, 0.09, 0, 6 |

## First text run a layout_normalize pass regressed

- **text "Valor em aberto" in body>div:nth-child(5)>table:nth-child(3)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(1)** (event #53)
- first over tolerance: **L0** — RAW BLITZ/PARLEY TEXT as read by vellora's walk (L0); no normalize pass involved
- regressed by (which layer made it worse, per coordinate): **L0 dy 0→6.08 (first layer); painted_table_cell_text_baselines dy 0.08→-1.92**
- dominant layer (largest step of the final Δ): L0 (dy +6.08); step decomposition (sums to the final Δ): L0 dy +6.08; collapsed_table_medium_border_insets dy -6; painted_table_cell_text_baselines dy -2
- Chromium fragment: "Valor em aberto" at x=11.66 y=500.92 w=91.83; vellora faces: LiberationSerif-Bold.ttf

| layer | status | dx | dy | dw | dright | dy basis |
| --- | --- | --- | --- | --- | --- | --- |
| N0 | n/a |  |  |  |  |  |
| B0 | n/a |  |  |  |  |  |
| L0 | diverged | 0.34 | 6.08 | 0.01 | 0.35 | baseline |
| vertical_margin_collapse | diverged | 0.34 | 6.08 | 0.01 | 0.35 | baseline |
| collapsed_table_medium_border_insets | ok | 0.34 | 0.08 | 0.01 | 0.35 | baseline |
| painted_table_cell_text_baselines | diverged | 0.34 | -1.92 | 0.01 | 0.35 | baseline |
| fixed_table_widths | diverged | 0.34 | -1.92 | 0.01 | 0.35 | baseline |
| table_percent_widths | diverged | 0.34 | -1.92 | 0.01 | 0.35 | baseline |
| auto_table_compact_columns | diverged | 0.34 | -1.92 | 0.01 | 0.35 | baseline |
| collapsed_table_medium_border_insets_x | diverged | 0.34 | -1.92 | 0.01 | 0.35 | baseline |

Ancestor chain (compared boxes, root first; deltas = vellora − Chromium, CSS px):

| ancestor | collapsed_table_medium_border_insets_x dx,dy,dw,dh | N0 dx,dy,dw,dh | B0 dx,dy,dw,dh | L0 dx,dy,dw,dh |
| --- | --- | --- | --- | --- |
| html | 0, 0, 0, 12.52 | 0, 0, 0, 12.52 | 0, 0, 0, 12.52 | 0, 0, 0, 12.52 |
| body | 0, 0, 0, 12.52 | 0, 0, 0, 12.52 | 0, 0, 0, 12.52 | 0, 0, 0, 12.52 |
| body>div:nth-child(5) | 0, 0.39, 0, 5.77 | 0, 6.39, 0, 5.77 | 0, 6.39, 0, 5.77 | 0, 6.39, 0, 5.77 |
| body>div:nth-child(5)>table:nth-child(3) | 0, 0.08, 0, 6.05 | 0, 6.08, 0, 6.05 | 0, 6.08, 0, 6.05 | 0, 6.08, 0, 6.05 |

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
| N0 | 41 (41/0/0) | n/a | enter (x/y/width) body>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(1) (N0 dw 0→-51.56 (first layer)) | enter (x/y/width) body>div:nth-child(5)>table:nth-child(3)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(2) worsened dw 0→-120.03 | — | — |
| B0 | 0 (0/0/0) | n/a | — | — | — | — |
| L0 | 0 (33/0/0) | 33 | — | — | text "Acme Serviços Prediais Ltda." in body>div:nth-child(1)>div:nth-child(1) (L0 dy 0→1 (first layer)) | text "R$ 4.875,50" in body>div:nth-child(5)>table:nth-child(3)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(2) worsened dx 0→119.38 |
| vertical_margin_collapse | 0 (0/0/0) | 0 | — | — | — | — |
| collapsed_table_medium_border_insets | 0 (0/0/0) | 0 | — | — | — | — |
| painted_table_cell_text_baselines | 0 (2/0/0) | 2 | — | — | text "Valor em aberto" in body>div:nth-child(5)>table:nth-child(3)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(1) (painted_table_cell_text_baselines dy 0.08→-1.92) | text "Valor em aberto" in body>div:nth-child(5)>table:nth-child(3)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(1) worsened dy 0.08→-1.92 |
| fixed_table_widths | 0 (0/0/0) | 0 | — | — | — | — |
| table_percent_widths | 0 (0/0/0) | 0 | — | — | — | — |
| auto_table_compact_columns | 0 (0/0/0) | 0 | — | — | — | — |
| collapsed_table_medium_border_insets_x | 1 (1/0/0) | 0 | enter (x/y/width) body>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(2) (collapsed_table_medium_border_insets_x dw 42.56→45.7) | enter (x/y/width) body>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(2) worsened dw 42.56→45.7 | — | — |

Events regressed by each layer after N0, in document order (first 12 per layer here, 40 in diff.json; N0 omitted: it is the list of items already over tolerance in the first layer):

| layer | event | kind | coord | from → to | first over tol. | dominant |
| --- | --- | --- | --- | --- | --- | --- |
| painted_table_cell_text_baselines | text "Valor em aberto" in body>div:nth-child(5)>table:nth-child(3)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(1) | worsened | dy | 0.08 → -1.92 | L0 | L0 |
| painted_table_cell_text_baselines | text "R$ 4.875,50" in body>div:nth-child(5)>table:nth-child(3)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(2) | worsened | dy | 0.08 → -1.92 | L0 | table_percent_widths |
| collapsed_table_medium_border_insets_x | enter (x/y/width) body>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(2) | worsened | dw | 42.56 → 45.7 | N0 | N0 |

## First divergence per layer

The first event over tolerance (or lost) IN each layer. After the document's natural first divergence every layer usually repeats the same event; use `Regressions by layer` for what each layer changed.

| layer | first box | box Δ | first text | text Δ (dx, dy) |
| --- | --- | --- | --- | --- |
| N0 | enter (x/y/width) body>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(1) | 3, 3.09, -51.56 | n/a (no text in Blitz trees) |  |
| B0 | enter (x/y/width) body>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(1) | 3, 3.09, -51.56 | n/a (no text in Blitz trees) |  |
| L0 | enter (x/y/width) body>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(1) | 3, 3.09, -51.56 | text "Acme Serviços Prediais Ltda." in body>div:nth-child(1)>div:nth-child(1) | 0, 1 |
| vertical_margin_collapse | enter (x/y/width) body>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(1) | 3, 3.09, -51.56 | text "Acme Serviços Prediais Ltda." in body>div:nth-child(1)>div:nth-child(1) | 0, 1 |
| collapsed_table_medium_border_insets | enter (x/y/width) body>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(1) | 3, 0.09, -51.56 | text "Acme Serviços Prediais Ltda." in body>div:nth-child(1)>div:nth-child(1) | 0, 1 |
| painted_table_cell_text_baselines | enter (x/y/width) body>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(1) | 3, 0.09, -51.56 | text "Acme Serviços Prediais Ltda." in body>div:nth-child(1)>div:nth-child(1) | 0, 1 |
| fixed_table_widths | enter (x/y/width) body>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(1) | 3, 0.09, -51.56 | text "Acme Serviços Prediais Ltda." in body>div:nth-child(1)>div:nth-child(1) | 0, 1 |
| table_percent_widths | enter (x/y/width) body>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(1) | 3, 0.09, -51.56 | text "Acme Serviços Prediais Ltda." in body>div:nth-child(1)>div:nth-child(1) | 0, 1 |
| auto_table_compact_columns | enter (x/y/width) body>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(1) | 3, 0.09, -51.56 | text "Acme Serviços Prediais Ltda." in body>div:nth-child(1)>div:nth-child(1) | 0, 1 |
| collapsed_table_medium_border_insets_x | enter (x/y/width) body>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(1) | 0, 0.09, -48.72 | text "Acme Serviços Prediais Ltda." in body>div:nth-child(1)>div:nth-child(1) | 0, 1 |

## Per-layer error and layer effects

`moved` = boxes/runs whose geometry this layer changed vs the previous one; `better`/`worse` = max |Δ| per item moved closer to / further from Chromium; `Σ` = summed change of that max |Δ| (a few large improvements can make it negative while one box regresses); `regressed` = items this layer worsened or overshot on some coordinate by more than tolerance (classifyStep), NAMED: the first three in document order (boxes that only absorbed or followed a regressed box's change rank last) and the largest.

| layer | box events diverged | text events diverged | mean abs box Δ (px) | boxes moved/better/worse (Σ) | boxes regressed (largest) | runs moved/better/worse (Σ) | runs regressed (largest) |
| --- | --- | --- | --- | --- | --- | --- | --- |
| N0 | 41 | n/a | 30.03 |  |  |  |  |
| B0 | 41 | n/a | 30.03 | 0/0/0 (0) | 0 | 0/0/0 (0) | 0 |
| L0 | 41 | 33 | 30.03 | 0/0/0 (0) | 0 | 0/0/0 (0) | 0 |
| vertical_margin_collapse | 41 | 33 | 30.03 | 0/0/0 (0) | 0 | 0/0/0 (0) | 0 |
| collapsed_table_medium_border_insets | 32 | 25 | 26.82 | 29/21/0 (-109.25) | 0 | 32/29/0 (-152.65) | 0 |
| painted_table_cell_text_baselines | 32 | 25 | 26.82 | 0/0/0 (0) | 0 | 6/2/1 (-2.17) | 2: "Valor em aberto" dy 0.08→-1.92; "R$ 4.875,50" dy 0.08→-1.92 |
| fixed_table_widths | 32 | 25 | 26.82 | 0/0/0 (0) | 0 | 0/0/0 (0) | 0 |
| table_percent_widths | 32 | 24 | 6.3 | 6/6/0 (-697.75) | 0 | 3/3/0 (-354) | 0 |
| auto_table_compact_columns | 32 | 24 | 6.3 | 0/0/0 (0) | 0 | 0/0/0 (0) | 0 |
| collapsed_table_medium_border_insets_x | 32 | 21 | 6.22 | 2/1/1 (-2.7) | 1: body>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(2) dw 42.56→45.7 | 3/3/0 (-7.85) | 0 |

## Top 20 box divergences in collapsed_table_medium_border_insets_x (absolute)

| path | dx | dy | dw | dh | regressed by | first over tol. | dominant (step) | steps |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| body>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(1) | 0 | 0.09 | -48.72 | 0 | N0 dw 0→-51.56 (first layer) | N0 | N0 (dw -51.56) | N0 dw -51.56; collapsed_table_medium_border_insets dy -3; collapsed_table_medium_border_insets_x dx -3 |
| body>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(2) | -45.7 | 0.09 | 45.7 | 0 | N0 dx 0→-45.56 (first layer); collapsed_table_medium_border_insets_x dw 42.56→45.7 | N0 | N0 (dx -45.56) | N0 dx -45.56; collapsed_table_medium_border_insets dy -3; collapsed_table_medium_border_insets_x dw +3.14 |
| html | 0 | 0 | 0 | 12.52 | N0 dh 0→12.52 (first layer) | N0 | N0 (dh +12.52) | N0 dh +12.52 |
| body | 0 | 0 | 0 | 12.52 | N0 dh 0→12.52 (first layer) | N0 | N0 (dh +12.52) | N0 dh +12.52 |
| body>div:nth-child(6)>div:nth-child(2) | 0 | 6.84 | 0.23 | 0 | N0 dy 0→12.84 (first layer) | N0 | N0 (dy +12.84) | N0 dy +12.84; collapsed_table_medium_border_insets dy -6 |
| body>div:nth-child(5)>p:nth-child(5) | 0 | 6.81 | 0 | 0 | N0 dy 0→12.81 (first layer) | N0 | N0 (dy +12.81) | N0 dy +12.81; collapsed_table_medium_border_insets dy -6 |
| body>div:nth-child(6)>div:nth-child(3) | 0 | 6.52 | 0 | 0 | N0 dy 0→12.52 (first layer) | N0 | N0 (dy +12.52) | N0 dy +12.52; collapsed_table_medium_border_insets dy -6 |
| body>div:nth-child(6)>div:nth-child(4) | 0 | 6.52 | 0 | 0 | N0 dy 0→12.52 (first layer) | N0 | N0 (dy +12.52) | N0 dy +12.52; collapsed_table_medium_border_insets dy -6 |
| body>div:nth-child(6)>div:nth-child(5) | 0 | 6.52 | 0 | 0 | N0 dy 0→12.52 (first layer) | N0 | N0 (dy +12.52) | N0 dy +12.52; collapsed_table_medium_border_insets dy -6 |
| body>div:nth-child(6) | 0 | 6.5 | 0 | 0.02 | N0 dy 0→12.5 (first layer) | N0 | N0 (dy +12.5) | N0 dy +12.5; collapsed_table_medium_border_insets dy -6 |
| body>div:nth-child(6)>p:nth-child(1) | 0 | 6.5 | 0 | 0 | N0 dy 0→12.5 (first layer) | N0 | N0 (dy +12.5) | N0 dy +12.5; collapsed_table_medium_border_insets dy -6 |
| body>div:nth-child(5)>p:nth-child(4) | 0 | 6.47 | 0 | 0 | N0 dy 0→12.47 (first layer) | N0 | N0 (dy +12.47) | N0 dy +12.47; collapsed_table_medium_border_insets dy -6 |
| body>div:nth-child(5)>p:nth-child(6) | 0 | 6.16 | 0 | 0 | N0 dy 0→12.16 (first layer) | N0 | N0 (dy +12.16) | N0 dy +12.16; collapsed_table_medium_border_insets dy -6 |
| body>div:nth-child(5)>table:nth-child(3) | 0 | 0.08 | 0 | 6.05 | N0 dy 0→6.08 (first layer) | N0 | N0 (dy +6.08) | N0 dy +6.08; collapsed_table_medium_border_insets dy -6 |
| body>div:nth-child(5) | 0 | 0.39 | 0 | 5.77 | N0 dy 0→6.39 (first layer) | N0 | N0 (dy +6.39) | N0 dy +6.39; collapsed_table_medium_border_insets dy -6 |
| body>div:nth-child(5)>table:nth-child(3)>tbody:nth-child(1)>tr:nth-child(3)>td:nth-child(1) | 0.5 | 4.61 | -0.37 | 1.02 | N0 dw 0→118.03 (first layer) | N0 | table_percent_widths (dw -118.4) | N0 dw +118.03; collapsed_table_medium_border_insets dy -6; table_percent_widths dw -118.4 |
| body>div:nth-child(5)>table:nth-child(3)>tbody:nth-child(1)>tr:nth-child(3)>td:nth-child(2) | 0.13 | 4.61 | -0.63 | 1.02 | N0 dw 0→-120.03 (first layer) | N0 | N0 (dw -120.03) | N0 dw -120.03; collapsed_table_medium_border_insets dy -6; table_percent_widths dx -119.4 |
| body>div:nth-child(5)>table:nth-child(3)>tbody:nth-child(1)>tr:nth-child(2)>td:nth-child(1) | 0.5 | 2.59 | -0.37 | 1.02 | N0 dw 0→118.03 (first layer) | N0 | table_percent_widths (dw -118.4) | N0 dw +118.03; collapsed_table_medium_border_insets dy -6; table_percent_widths dw -118.4 |
| body>div:nth-child(5)>table:nth-child(3)>tbody:nth-child(1)>tr:nth-child(2)>td:nth-child(2) | 0.13 | 2.59 | -0.63 | 1.02 | N0 dw 0→-120.03 (first layer) | N0 | N0 (dw -120.03) | N0 dw -120.03; collapsed_table_medium_border_insets dy -6; table_percent_widths dx -119.4 |
| body>div:nth-child(5)>table:nth-child(3)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(1) | 0.5 | 0.58 | -0.37 | 1.02 | N0 dw 0→118.03 (first layer) | N0 | table_percent_widths (dw -118.4) | N0 dw +118.03; collapsed_table_medium_border_insets dy -6; table_percent_widths dw -118.4 |

## Top 20 LOCAL box divergences

rdx/rdy = the error a box ADDS to what it inherits: after a previous compared sibling in the same row, relative to that sibling's right edge (dx+dw) and dy; after a stacked sibling, relative to its bottom edge (dy+dh); a first child, relative to its parent's dx/dy. Isolates where cumulative drift originates.

| path | rdx | rdy | dw | dh | regressed by | first over tol. | dominant (step) |
| --- | --- | --- | --- | --- | --- | --- | --- |
| body>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(1) | 0 | 0 | -48.72 | 0 | N0 dw 0→-51.56 (first layer) | N0 | N0 (dw -51.56) |
| body>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(2) | 3.03 | 0 | 45.7 | 0 | N0 dx 0→-45.56 (first layer); collapsed_table_medium_border_insets_x dw 42.56→45.7 | N0 | N0 (dx -45.56) |
| html | 0 | 0 | 0 | 12.52 | N0 dh 0→12.52 (first layer) | N0 | N0 (dh +12.52) |
| body | 0 | 0 | 0 | 12.52 | N0 dh 0→12.52 (first layer) | N0 | N0 (dh +12.52) |
| body>div:nth-child(5)>table:nth-child(3) | 0 | -0.66 | 0 | 6.05 | N0 dy 0→6.08 (first layer) | N0 | N0 (dy +6.08) |
| body>div:nth-child(5) | 0 | 0.34 | 0 | 5.77 | N0 dy 0→6.39 (first layer) | N0 | N0 (dy +6.39) |
| body>div:nth-child(5)>table:nth-child(3)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(1) | 0.5 | 0.5 | -0.37 | 1.02 | N0 dw 0→118.03 (first layer) | N0 | table_percent_widths (dw -118.4) |
| body>div:nth-child(5)>table:nth-child(3)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(2) | 0 | 0 | -0.63 | 1.02 | N0 dw 0→-120.03 (first layer) | N0 | N0 (dw -120.03) |
| body>div:nth-child(5)>table:nth-child(3)>tbody:nth-child(1)>tr:nth-child(2)>td:nth-child(1) | 0.5 | 1 | -0.37 | 1.02 | N0 dw 0→118.03 (first layer) | N0 | table_percent_widths (dw -118.4) |
| body>div:nth-child(5)>table:nth-child(3)>tbody:nth-child(1)>tr:nth-child(2)>td:nth-child(2) | 0 | 0 | -0.63 | 1.02 | N0 dw 0→-120.03 (first layer) | N0 | N0 (dw -120.03) |
| body>div:nth-child(5)>table:nth-child(3)>tbody:nth-child(1)>tr:nth-child(3)>td:nth-child(1) | 0.5 | 1 | -0.37 | 1.02 | N0 dw 0→118.03 (first layer) | N0 | table_percent_widths (dw -118.4) |
| body>div:nth-child(5)>table:nth-child(3)>tbody:nth-child(1)>tr:nth-child(3)>td:nth-child(2) | 0 | 0 | -0.63 | 1.02 | N0 dw 0→-120.03 (first layer) | N0 | N0 (dw -120.03) |
| body>div:nth-child(3)>div:nth-child(5) | 0 | -1 | 0 | -0.31 | N0 dy 0→5.36 (first layer) | N0 | collapsed_table_medium_border_insets (dy -6) |
| body>div:nth-child(3)>div:nth-child(2) | 0 | -1 | 0 | -0.31 | N0 dy 0→5.3 (first layer) | N0 | collapsed_table_medium_border_insets (dy -6) |
| body>div:nth-child(3)>div:nth-child(3) | 0 | 1 | 0 | -0.31 | N0 dy 0→5.98 (first layer) | N0 | collapsed_table_medium_border_insets (dy -6) |
| body>div:nth-child(3)>div:nth-child(4) | 0 | 0 | 0 | 0.69 | N0 dy 0→5.67 (first layer) | N0 | collapsed_table_medium_border_insets (dy -6) |
| body>div:nth-child(5)>p:nth-child(6) | 0 | -0.66 | 0 | 0 | N0 dy 0→12.16 (first layer) | N0 | N0 (dy +12.16) |
| body>div:nth-child(3)>div:nth-child(1) | 0 | 0 | 0 | 0.53 | N0 dy 0→5.77 (first layer) | N0 | collapsed_table_medium_border_insets (dy -6) |
| body>div:nth-child(1)>div:nth-child(2) | 0 | 0 | 0 | 0.41 |  |  | N0 (dh +0.41) |
| body>div:nth-child(5)>p:nth-child(4) | 0 | 0.34 | 0 | 0 | N0 dy 0→12.47 (first layer) | N0 | N0 (dy +12.47) |

## Top 20 text-run divergences in collapsed_table_medium_border_insets_x

| owner | text | dx | dy | dw | dright | faces | regressed by | first over tol. | dominant (step) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| body>div:nth-child(5)>p:nth-child(5) | Segue, em anexo, demonstrativo detalhado do d... | 0 | 6.81 | 0.19 | 0.19 | LiberationSerif-Regular.ttf | L0 dy 0→12.81 (first layer) | L0 | L0 (dy +12.81) |
| body>div:nth-child(6)>div:nth-child(3) | Mariana Oliveira Souza | 0 | 6.52 | -0.01 | -0.01 | LiberationSerif-Bold.ttf | L0 dy 0→12.52 (first layer) | L0 | L0 (dy +12.52) |
| body>div:nth-child(6)>div:nth-child(4) | Gerente do Departamento de Cobrança | 0 | 6.52 | 0 | 0 | LiberationSerif-Regular.ttf | L0 dy 0→12.52 (first layer) | L0 | L0 (dy +12.52) |
| body>div:nth-child(6)>div:nth-child(5) | Acme Serviços Prediais Ltda. | 0 | 6.52 | -0.01 | -0.01 | LiberationSerif-Regular.ttf | L0 dy 0→12.52 (first layer) | L0 | L0 (dy +12.52) |
| body>div:nth-child(6)>p:nth-child(1) | Atenciosamente, | 0 | 6.5 | 0.04 | 0.04 | LiberationSerif-Regular.ttf | L0 dy 0→12.5 (first layer) | L0 | L0 (dy +12.5) |
| body>div:nth-child(5)>p:nth-child(4) | Permanecendo a situação sem a devida regulari... | 0 | 6.47 | 3.67 | 3.67 | LiberationSerif-Regular.ttf | L0 dy 0→12.47 (first layer) | L0 | L0 (dy +12.47) |
| body>div:nth-child(5)>p:nth-child(4) | adotadas as providências cabíveis previstas e... | 0 | 6.47 | 3.67 | 3.67 | LiberationSerif-Regular.ttf | L0 dy 0→12.47 (first layer) | L0 | L0 (dy +12.47) |
| body>div:nth-child(5)>p:nth-child(4) | outras medidas. Em caso de pagamento já efetu... | 0 | 6.47 | 3.67 | 3.67 | LiberationSerif-Regular.ttf | L0 dy 0→12.47 (first layer) | L0 | L0 (dy +12.47) |
| body>div:nth-child(5)>p:nth-child(4) | respectivo comprovante para cobranca@exemplo-... | 0 | 6.47 | 0.15 | 0.15 | LiberationSerif-Regular.ttf | L0 dy 0→12.47 (first layer) | L0 | L0 (dy +12.47) |
| body>div:nth-child(5)>p:nth-child(6) | Sendo o que se apresenta para o momento, colo... | 0 | 6.16 | 3.67 | 3.67 | LiberationSerif-Regular.ttf | L0 dy 0→12.16 (first layer) | L0 | L0 (dy +12.16) |
| body>div:nth-child(5)>p:nth-child(6) | necessários. | 0 | 6.16 | 0.02 | 0.02 | LiberationSerif-Regular.ttf | L0 dy 0→12.16 (first layer) | L0 | L0 (dy +12.16) |
| body>div:nth-child(5)>table:nth-child(3)>tbody:nth-child(1)>tr:nth-child(3)>td:nth-child(1) | Prazo para regularização | 0.34 | 2.11 | 0.03 | 0.37 | LiberationSerif-Bold.ttf | L0 dy 0→10.11 (first layer) | L0 | L0 (dy +10.11) |
| body>div:nth-child(5)>table:nth-child(3)>tbody:nth-child(1)>tr:nth-child(3)>td:nth-child(2) | 15 dias corridos (até 07/07/2026) | -0.02 | 2.11 | 0.03 | 0.01 | LiberationSerif-Regular.ttf | L0 dx 0→119.38 (first layer) | L0 | table_percent_widths (dx -119.4) |
| body>div:nth-child(5)>table:nth-child(3)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(1) | Valor em aberto | 0.34 | -1.92 | 0.01 | 0.35 | LiberationSerif-Bold.ttf | L0 dy 0→6.08 (first layer); painted_table_cell_text_baselines dy 0.08→-1.92 | L0 | L0 (dy +6.08) |
| body>div:nth-child(5)>table:nth-child(3)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(2) | R$ 4.875,50 | -0.02 | -1.92 | 0.01 | -0.01 | LiberationSerif-Regular.ttf | L0 dx 0→119.38 (first layer); painted_table_cell_text_baselines dy 0.08→-1.92 | L0 | table_percent_widths (dx -119.4) |
| body>div:nth-child(1)>div:nth-child(1) | Acme Serviços Prediais Ltda. | 0 | 1 | 0.04 | 0.04 | LiberationSerif-Bold.ttf | L0 dy 0→1 (first layer) | L0 | L0 (dy +1) |
| body>div:nth-child(5)>p:nth-child(2) | Conforme os registros em nosso poder, encontr... | 0 | 0.73 | 3.67 | 3.67 | LiberationSerif-Regular.ttf | L0 dy 0→6.73 (first layer) | L0 | L0 (dy +6.73) |
| body>div:nth-child(5)>p:nth-child(2) | 15/05/2026. Solicitamos a regularização da re... | 0 | 0.73 | 3.67 | 3.67 | LiberationSerif-Regular.ttf | L0 dy 0→6.73 (first layer) | L0 | L0 (dy +6.73) |
| body>div:nth-child(5)>p:nth-child(2) | corridos, contados a partir do recebimento de... | 0 | 0.73 | 0.15 | 0.15 | LiberationSerif-Regular.ttf | L0 dy 0→6.73 (first layer) | L0 | L0 (dy +6.73) |
| body>div:nth-child(3)>div:nth-child(2) | Comércio Faro Azul Ltda. ME | 0 | -0.7 | 0.04 | 0.04 | LiberationSerif-Bold.ttf | L0 dy 0→5.3 (first layer) | L0 | collapsed_table_medium_border_insets (dy -6) |

## Top 20 LOCAL text-run divergences

rdx/rdy = the run's Δ minus its owner box's dx/dy (final layer), so runs that only ride along with a shifted owner rank low (de-duplicates cascades, like the local box table).

| owner | text | rdx | rdy | dx | dy | regressed by | first over tol. | dominant (step) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| body>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(2) | São Paulo, 22/06/2026 | 46.18 | 0 | 0.48 | 0.09 | L0 dy 0→3.09 (first layer) | L0 | L0 (dy +3.09) |
| body>div:nth-child(5)>table:nth-child(3)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(1) | Valor em aberto | -0.16 | -2.5 | 0.34 | -1.92 | L0 dy 0→6.08 (first layer); painted_table_cell_text_baselines dy 0.08→-1.92 | L0 | L0 (dy +6.08) |
| body>div:nth-child(5)>table:nth-child(3)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(2) | R$ 4.875,50 | -0.16 | -2.5 | -0.02 | -1.92 | L0 dx 0→119.38 (first layer); painted_table_cell_text_baselines dy 0.08→-1.92 | L0 | table_percent_widths (dx -119.4) |
| body>div:nth-child(5)>table:nth-child(3)>tbody:nth-child(1)>tr:nth-child(2)>td:nth-child(1) | Vencimento original | -0.16 | -2.5 | 0.34 | 0.09 | L0 dy 0→8.09 (first layer) | L0 | L0 (dy +8.09) |
| body>div:nth-child(5)>table:nth-child(3)>tbody:nth-child(1)>tr:nth-child(2)>td:nth-child(2) | 15/05/2026 | -0.16 | -2.5 | -0.02 | 0.09 | L0 dx 0→119.38 (first layer) | L0 | table_percent_widths (dx -119.4) |
| body>div:nth-child(5)>table:nth-child(3)>tbody:nth-child(1)>tr:nth-child(3)>td:nth-child(1) | Prazo para regularização | -0.16 | -2.5 | 0.34 | 2.11 | L0 dy 0→10.11 (first layer) | L0 | L0 (dy +10.11) |
| body>div:nth-child(5)>table:nth-child(3)>tbody:nth-child(1)>tr:nth-child(3)>td:nth-child(2) | 15 dias corridos (até 07/07/2026) | -0.16 | -2.5 | -0.02 | 2.11 | L0 dx 0→119.38 (first layer) | L0 | table_percent_widths (dx -119.4) |
| body>div:nth-child(1)>div:nth-child(1) | Acme Serviços Prediais Ltda. | 0 | 1 | 0 | 1 | L0 dy 0→1 (first layer) | L0 | L0 (dy +1) |
| body>div:nth-child(1)>div:nth-child(2) | CNPJ 12.345.678/0001-90 · cobranca@exemplo-ac... | 0 | 0.2 | 0 | 0.22 |  |  | L0 (dy +0.22) |
| body>div:nth-child(1)>div:nth-child(2) | Avenida das Laranjeiras, 1200, Sala 45, Bairr... | 0 | 0 | 0 | 0.02 |  |  | L0 (dy +0.02) |
| body>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(1) | Ref.: NOT-2026-00187 | 0 | 0 | 0 | 0.09 | L0 dy 0→3.09 (first layer) | L0 | L0 (dy +3.09) |
| body>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(1) | Processo nº PROC-2026-0432 | 0 | 0 | 0 | 0.09 | L0 dy 0→3.09 (first layer) | L0 | L0 (dy +3.09) |
| body>div:nth-child(3)>div:nth-child(1) | AO(À) DESTINATÁRIO(A) | 0 | 0 | 0 | -0.23 | L0 dy 0→5.77 (first layer) | L0 | collapsed_table_medium_border_insets (dy -6) |
| body>div:nth-child(3)>div:nth-child(2) | Comércio Faro Azul Ltda. ME | 0 | 0 | 0 | -0.7 | L0 dy 0→5.3 (first layer) | L0 | collapsed_table_medium_border_insets (dy -6) |
| body>div:nth-child(3)>div:nth-child(3) | CNPJ: 98.765.432/0001-21 | 0 | 0 | 0 | -0.02 | L0 dy 0→5.98 (first layer) | L0 | collapsed_table_medium_border_insets (dy -6) |
| body>div:nth-child(3)>div:nth-child(4) | Rua das Flores, 123, Conjunto 7 | 0 | 0 | 0 | -0.33 | L0 dy 0→5.67 (first layer) | L0 | collapsed_table_medium_border_insets (dy -6) |
| body>div:nth-child(3)>div:nth-child(5) | Campinas — SP, CEP 13010-000 | 0 | 0 | 0 | -0.64 | L0 dy 0→5.36 (first layer) | L0 | collapsed_table_medium_border_insets (dy -6) |
| body>div:nth-child(4) | ASSUNTO: NOTIFICAÇÃO PARA REGULARIZAÇÃO DE DÉ... | 0 | 0 | 0 | 0.05 | L0 dy 0→6.05 (first layer) | L0 | L0 (dy +6.05) |
| body>div:nth-child(5)>p:nth-child(1) | Prezado(a) Comércio Faro Azul Ltda. ME, na qu... | 0 | 0 | 0 | 0.39 | L0 dy 0→6.39 (first layer) | L0 | L0 (dy +6.39) |
| body>div:nth-child(5)>p:nth-child(1) | desta NOTIFICAR Vossa Senhoria a respeito de ... | 0 | 0 | 0 | 0.39 | L0 dy 0→6.39 (first layer) | L0 | L0 (dy +6.39) |

## Margins (not part of the x/y/w/h attribution)

vellora margins are Blitz's resolved layout.margin as read by the walk (L0) and after the passes; Chromium values are COMPUTED margins of the element itself (not collapsed through descendants). Not part of the x/y/w/h attribution.

- boxes with vellora margins: 34; changed by the passes (L0 → final): 0
- differ from Chromium COMPUTED margins by > tolerance (L0): 1

| path | vellora L0 mt / mb | Chromium computed mt / mb |
| --- | --- | --- |
| body>div:nth-child(5) | 0 / 14.67 | 0 / 0 |


## Match counts and node policy

- Chromium elements under html (head excluded) by policy: compared 34, inline-text-only 2, no-blitz-box 6
- vellora L0 boxes (elements, head excluded): 42; matched to a compared Chromium box: 34; compared Chromium boxes present in N0: 34
- vellora-only — inline element (compared via text runs): 2 (e.g. body>div:nth-child(1)>div:nth-child(2)>br:nth-child(1); body>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(1)>br:nth-child(1))
- vellora-only — table row/group: not a Blitz layout node (zero box in walk): 6 (e.g. body>table:nth-child(2)>tbody:nth-child(1); body>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(1); body>div:nth-child(5)>table:nth-child(3)>tbody:nth-child(1))
- Chromium-only compared boxes (no vellora L0 box): 0
- Blitz layout-tree-only nodes (anonymous blocks / pseudo-elements the walk never visits): 0
- Policy: `inline-text-only` = Chromium `display:inline` non-replaced element (Blitz gives it no Taffy box; its text is compared as runs). `no-blitz-box` = table row/row-group that is not a Blitz layout node (zero box in the walk); listed, not scored. `no-layout` = Chromium has no layout object (display:none). Pseudo-elements are matched by `::before`/`::after` segments and never count toward `:nth-child`; their generated text is compared like any text. Anonymous boxes: Chromium's are not exposed by DOMSnapshot; Blitz's appear only in N0/B0 as `::blitz-anon(j)`. html_normalize wrappers are transparent in keys and listed as vellora-only.

## Text alignment

- vellora runs (non-blank, L0): 35; Chromium text fragments (non-blank): 48; matched pairs: 35 (11 joined across fragment/run boundaries)
- unmatched vellora runs: 0; unmatched Chromium fragments: 0; Chromium text with NO vellora owner (text vellora never shaped): 0

## Caveats

- Local macOS Chrome results are INDICATIVE; the authoritative run is the pinned Chrome for Testing on Linux CI (see fidelity/layout-diff/README.md).
- Text dy compares BASELINES when Chromium's ascent for the face/size was measured (probe page, zero-size inline-block on the baseline); otherwise vellora's text top (baseline − Parley ascent) vs Chromium's text-box top (`dy basis` column).
- L0 text positions already include `read_text_runs`' inline padding-right compensation, so 'raw Parley' text is not separated from vellora's reader.
- A layer that moves a box TOWARDS Chromium is an improvement here, whatever its cause; for 'what did this code change do', compare two builds with compare.mjs.
