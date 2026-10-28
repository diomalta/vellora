# Layout diff — boleto (beta4)

> Continuous-flow comparison: Chromium lays the document out as ONE flow (no fragmentation) at the same viewport width vellora hands Blitz. It is comparable ONLY to vellora's PRE-pagination layers (N0, B0, L0, layout_normalize passes) and says nothing about pagination (page breaks, repeated thead, page-local offsets, margin boxes).

Deltas are vellora − Chromium in CSS px. Paths abbreviate `html>body:nth-child(2)` as `body`.

## Environment

- date_utc: `2026-10-21T04:35:55Z`
- os: `darwin 27.0.0 arm64`
- cpu: `Apple M5 Pro`
- node: `v22.23.2`
- command: `node <worktree>/fidelity/layout-diff/run.mjs --label beta4 --dump-repo /tmp/lfix/beta4`
- repo: `/tmp/lfix/beta4`
- rustc: `rustc 1.96.0 (ac68faa20 2026-05-25)`
- git_commit: `f8fb39180b25502305a4b8bfb4c841c302549923`
- git_dirty: `dirty`
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
| bundled_fonts_loaded | input-parity | pass | vellora shaped with 3 bundled face(s); Chromium document.fonts loaded: Vellora Sans 400 normal; Vellora Sans 700 normal; Arial 400 normal; Arial 700 normal; Vellora Mono 400 normal |
| platform_fonts_custom | input-parity | pass | CSS.getPlatformFontsForNode over 74 text-bearing elements: 0/1704 glyphs rendered with SYSTEM fonts; vellora DejaVu fallback runs: 0 |
| source_html_layer | coverage | pass | N0 present: Blitz laid out the source HTML with html_normalize skipped; the N0 → B0 step is html_normalize's (DOM altered by html_normalize: YES) |
| normalize_wrappers_located | self-consistency | pass | html_normalize wrappers recorded 24, located in the Blitz DOM 24 |
| run_meta_alignment | self-consistency | pass | L0 boxes whose Parley runs could not be re-aligned to the walk: 0 |
| layer_order | self-consistency | pass | layers whose box sequence differs from L0: none |
| normalize_dom_roundtrip | self-consistency | pass | element keys of the source DOM (N0) vs html_normalize's output re-parsed by Blitz (B0, wrappers transparent): 151 common; only in source 0; only in normalized 0; same key, different tag/id/class 0 |
| source_dom_keys_vs_chromium | self-consistency | pass | element keys of Blitz's parse of the source HTML (N0) vs Chromium's DOM (head excluded): 151 common; only in vellora 0; only in Chromium 0; same key, different tag/id/class 0 |
| dom_key_alignment | self-consistency | pass | L0 boxes (vellora's render DOM) keyed only on the vellora side: 0; compared Chromium boxes whose path no vellora DOM node has: 0 |
| text_alignment | self-consistency | pass | matched 78 pairs; unmatched vellora runs 0, unmatched Chromium fragments 0, Chromium text with no vellora owner 0 |

## Input parity

- @page content box 672.3351 × 1001.6151 CSS px → Blitz viewport 672 × 1001 (`as u32` truncation in resolve_and_walk drops 0.3351 px of inline size; a KNOWN INPUT divergence vs Chromium print, not an engine difference). Chromium MEASURED: documentElement.clientWidth 672, innerWidth 672, innerHeight 1001 — MATCH.
- Media: Blitz evaluates stylesheets as `screen` (DocumentConfig::media_type default; build_document never sets it). Chromium emulates `print` (matchMedia('print') = true). Fixture contains @media rules: no (media type is inert here).
- Fonts: Chromium loaded Vellora Sans 400 normal; Vellora Sans 700 normal; Arial 400 normal; Arial 700 normal; Vellora Mono 400 normal from the bundled files (sha256 in env.fonts_sha256). vellora runs by face: LiberationSans-Regular.ttf 63, LiberationSans-Bold.ttf 15, LiberationMono-Regular.ttf 2. DejaVu fallback runs (no Chromium counterpart): 0.
- Baselines: Chromium ascent measured for 12/12 face/size specs.
- html_normalize: ALTERED the DOM (wrappers recorded 24, located in the Blitz DOM 24). N0 (Blitz on the source HTML) present: the N0 → B0 step is html_normalize's.
- Blitz anonymous blocks (B0 only): 0; anonymous inline roots holding text (text Blitz shaped that vellora's DOM-children walk never reads): 0.
- Dump self-checks: run-metadata misalignments 0, layer order violations 0 (both expected 0).
- Input sha256: native 6cc266116374eef1…, browser 14b2f9840bd48f35…

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

- **exit (height) body>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(1)** (event #9)
- first over tolerance: **N0** — RAW BLITZ: Blitz's layout of the SOURCE HTML (N0) already differs from Chromium
- regressed by (which layer made it worse, per coordinate): **N0 dh 0→-1.08 (first layer)**
- dominant layer (largest step of the final Δ): N0 (dh -1.08); step decomposition (sums to the final Δ): N0 dh -1.08

| layer | status | dx | dy | dw | dh | dy basis |
| --- | --- | --- | --- | --- | --- | --- |
| N0 | diverged |  |  |  | -1.08 |  |
| B0 | diverged |  |  |  | -1.08 |  |
| L0 | diverged |  |  |  | -1.08 |  |
| vertical_margin_collapse | diverged |  |  |  | -1.08 |  |
| collapsed_table_medium_border_insets | diverged |  |  |  | -1.08 |  |
| painted_table_cell_text_baselines | diverged |  |  |  | -1.08 |  |
| fixed_table_widths | diverged |  |  |  | -1.08 |  |
| table_percent_widths | diverged |  |  |  | -1.08 |  |
| auto_table_compact_columns | diverged |  |  |  | -1.08 |  |
| collapsed_table_medium_border_insets_x | diverged |  |  |  | -1.08 |  |
| N0u | diverged |  |  |  | -0.96 |  |
| B0u | diverged |  |  |  | -0.96 |  |

Ancestor chain (compared boxes, root first; deltas = vellora − Chromium, CSS px):

| ancestor | collapsed_table_medium_border_insets_x dx,dy,dw,dh | N0 dx,dy,dw,dh | B0 dx,dy,dw,dh | L0 dx,dy,dw,dh |
| --- | --- | --- | --- | --- |
| html | 0, 0, 0, 28.91 | 0, 0, 0, 28.91 | 0, 0, 0, 28.91 | 0, 0, 0, 28.91 |
| body | 0, 0, 0, 28.91 | 0, 0, 0, 28.91 | 0, 0, 0, 28.91 | 0, 0, 0, 28.91 |
| body>table:nth-child(2) | 0, -0.06, 0, -2.08 | 0, -0.06, 0, -2.08 | 0, -0.06, 0, -2.08 | 0, -0.06, 0, -2.08 |

## First divergent text run in collapsed_table_medium_border_insets_x

- **text "999-9" in body>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(2)** (event #11)
- first over tolerance: **L0** — RAW BLITZ/PARLEY TEXT as read by vellora's walk (L0); no normalize pass involved
- regressed by (which layer made it worse, per coordinate): **L0 dy 0→-10.44 (first layer); painted_table_cell_text_baselines dy -10.44→-12.44**
- dominant layer (largest step of the final Δ): L0 (dy -10.44); step decomposition (sums to the final Δ): L0 dy -10.44; painted_table_cell_text_baselines dy -2
- Chromium fragment: "999-9" at x=166.73 y=32.44 w=59.56; vellora faces: LiberationSans-Bold.ttf

| layer | status | dx | dy | dw | dright | dy basis |
| --- | --- | --- | --- | --- | --- | --- |
| N0 | n/a |  |  |  |  |  |
| B0 | n/a |  |  |  |  |  |
| L0 | diverged | -1.62 | -10.44 | 0.03 | -1.59 | baseline |
| vertical_margin_collapse | diverged | -1.62 | -10.44 | 0.03 | -1.59 | baseline |
| collapsed_table_medium_border_insets | diverged | -1.62 | -10.44 | 0.03 | -1.59 | baseline |
| painted_table_cell_text_baselines | diverged | -1.62 | -12.44 | 0.03 | -1.59 | baseline |
| fixed_table_widths | diverged | -1.62 | -12.44 | 0.03 | -1.59 | baseline |
| table_percent_widths | diverged | -1.62 | -12.44 | 0.03 | -1.59 | baseline |
| auto_table_compact_columns | diverged | -1.62 | -12.44 | 0.03 | -1.59 | baseline |
| collapsed_table_medium_border_insets_x | diverged | -1.62 | -12.44 | 0.03 | -1.59 | baseline |

Ancestor chain (compared boxes, root first; deltas = vellora − Chromium, CSS px):

| ancestor | collapsed_table_medium_border_insets_x dx,dy,dw,dh | N0 dx,dy,dw,dh | B0 dx,dy,dw,dh | L0 dx,dy,dw,dh |
| --- | --- | --- | --- | --- |
| html | 0, 0, 0, 28.91 | 0, 0, 0, 28.91 | 0, 0, 0, 28.91 | 0, 0, 0, 28.91 |
| body | 0, 0, 0, 28.91 | 0, 0, 0, 28.91 | 0, 0, 0, 28.91 | 0, 0, 0, 28.91 |
| body>table:nth-child(2) | 0, -0.06, 0, -2.08 | 0, -0.06, 0, -2.08 | 0, -0.06, 0, -2.08 | 0, -0.06, 0, -2.08 |

## First box event a layout_normalize pass regressed

- **enter (x/y/width) body>table:nth-child(6)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(1)** (event #69)
- first over tolerance: **N0** — RAW BLITZ: Blitz's layout of the SOURCE HTML (N0) already differs from Chromium
- regressed by (which layer made it worse, per coordinate): **N0 dy 0→3 (first layer); fixed_table_widths overshoot dw -1.25→0.75**
- dominant layer (largest step of the final Δ): N0 (dy +3); step decomposition (sums to the final Δ): N0 dy +3; fixed_table_widths dw +2

| layer | status | dx | dy | dw | dh | dy basis |
| --- | --- | --- | --- | --- | --- | --- |
| N0 | diverged | 0.5 | 3 | -1.25 |  |  |
| B0 | diverged | 0.5 | 3 | -1.25 |  |  |
| L0 | diverged | 0.5 | 3 | -1.25 |  |  |
| vertical_margin_collapse | diverged | 0.5 | 3 | -1.25 |  |  |
| collapsed_table_medium_border_insets | diverged | 0.5 | 3 | -1.25 |  |  |
| painted_table_cell_text_baselines | diverged | 0.5 | 3 | -1.25 |  |  |
| fixed_table_widths | diverged | -0.5 | 3 | 0.75 |  |  |
| table_percent_widths | diverged | -0.5 | 3 | 0.75 |  |  |
| auto_table_compact_columns | diverged | -0.5 | 3 | 0.75 |  |  |
| collapsed_table_medium_border_insets_x | diverged | -0.5 | 3 | 0.75 |  |  |
| N0u | diverged | 0.5 | 2.76 | -1 |  |  |
| B0u | diverged | 0.5 | 2.76 | -1 |  |  |

Ancestor chain (compared boxes, root first; deltas = vellora − Chromium, CSS px):

| ancestor | collapsed_table_medium_border_insets_x dx,dy,dw,dh | N0 dx,dy,dw,dh | B0 dx,dy,dw,dh | L0 dx,dy,dw,dh |
| --- | --- | --- | --- | --- |
| html | 0, 0, 0, 28.91 | 0, 0, 0, 28.91 | 0, 0, 0, 28.91 | 0, 0, 0, 28.91 |
| body | 0, 0, 0, 28.91 | 0, 0, 0, 28.91 | 0, 0, 0, 28.91 | 0, 0, 0, 28.91 |
| body>table:nth-child(6) | 0, 2.5, 0, 18.61 | 0, 2.5, 0, 18.61 | 0, 2.5, 0, 18.61 | 0, 2.5, 0, 18.61 |

## First text run a layout_normalize pass regressed

- **text "999-9" in body>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(2)** (event #11)
- first over tolerance: **L0** — RAW BLITZ/PARLEY TEXT as read by vellora's walk (L0); no normalize pass involved
- regressed by (which layer made it worse, per coordinate): **L0 dy 0→-10.44 (first layer); painted_table_cell_text_baselines dy -10.44→-12.44**
- dominant layer (largest step of the final Δ): L0 (dy -10.44); step decomposition (sums to the final Δ): L0 dy -10.44; painted_table_cell_text_baselines dy -2
- Chromium fragment: "999-9" at x=166.73 y=32.44 w=59.56; vellora faces: LiberationSans-Bold.ttf

| layer | status | dx | dy | dw | dright | dy basis |
| --- | --- | --- | --- | --- | --- | --- |
| N0 | n/a |  |  |  |  |  |
| B0 | n/a |  |  |  |  |  |
| L0 | diverged | -1.62 | -10.44 | 0.03 | -1.59 | baseline |
| vertical_margin_collapse | diverged | -1.62 | -10.44 | 0.03 | -1.59 | baseline |
| collapsed_table_medium_border_insets | diverged | -1.62 | -10.44 | 0.03 | -1.59 | baseline |
| painted_table_cell_text_baselines | diverged | -1.62 | -12.44 | 0.03 | -1.59 | baseline |
| fixed_table_widths | diverged | -1.62 | -12.44 | 0.03 | -1.59 | baseline |
| table_percent_widths | diverged | -1.62 | -12.44 | 0.03 | -1.59 | baseline |
| auto_table_compact_columns | diverged | -1.62 | -12.44 | 0.03 | -1.59 | baseline |
| collapsed_table_medium_border_insets_x | diverged | -1.62 | -12.44 | 0.03 | -1.59 | baseline |

Ancestor chain (compared boxes, root first; deltas = vellora − Chromium, CSS px):

| ancestor | collapsed_table_medium_border_insets_x dx,dy,dw,dh | N0 dx,dy,dw,dh | B0 dx,dy,dw,dh | L0 dx,dy,dw,dh |
| --- | --- | --- | --- | --- |
| html | 0, 0, 0, 28.91 | 0, 0, 0, 28.91 | 0, 0, 0, 28.91 | 0, 0, 0, 28.91 |
| body | 0, 0, 0, 28.91 | 0, 0, 0, 28.91 | 0, 0, 0, 28.91 | 0, 0, 0, 28.91 |
| body>table:nth-child(2) | 0, -0.06, 0, -2.08 | 0, -0.06, 0, -2.08 | 0, -0.06, 0, -2.08 | 0, -0.06, 0, -2.08 |

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
| N0 | 129 (129/0/0) | n/a | exit (height) body>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(1) (N0 dh 0→-1.08 (first layer)) | enter (x/y/width) body>div:nth-child(9) worsened dy 0→29.45 | — | — |
| B0 | 0 (0/0/0) | n/a | — | — | — | — |
| L0 | 0 (77/0/0) | 77 | — | — | text "999-9" in body>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(2) (L0 dy 0→-10.44 (first layer)) | text "XXXX-TESTE." in body>div:nth-child(9) worsened dy 0→29.41 |
| vertical_margin_collapse | 0 (0/0/0) | 0 | — | — | — | — |
| collapsed_table_medium_border_insets | 0 (0/0/0) | 0 | — | — | — | — |
| painted_table_cell_text_baselines | 0 (8/3/0) | 11 | — | — | text "999-9" in body>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(2) (painted_table_cell_text_baselines dy -10.44→-12.44) | text "999-9" in body>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(2) worsened dy -10.44→-12.44 |
| fixed_table_widths | 4 (3/4/0) | 3 | enter (x/y/width) body>table:nth-child(6)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(1) (fixed_table_widths overshoot dw -1.25→0.75) | enter (x/y/width) body>table:nth-child(6)>tbody:nth-child(1)>tr:nth-child(9)>td:nth-child(1) overshoot dw -1→1 | text "Assinatura plano Widget Pro" in body>table:nth-child(7)>tbody:nth-child(2)>tr:nth-child(1)>td:nth-child(2) (fixed_table_widths dx -0.2→-1.2) | text "Assinatura plano Widget Pro" in body>table:nth-child(7)>tbody:nth-child(2)>tr:nth-child(1)>td:nth-child(2) worsened dx -0.2→-1.2 |
| table_percent_widths | 0 (0/0/0) | 0 | — | — | — | — |
| auto_table_compact_columns | 0 (0/0/0) | 0 | — | — | — | — |
| collapsed_table_medium_border_insets_x | 0 (0/0/0) | 0 | — | — | — | — |

Events regressed by each layer after N0, in document order (first 12 per layer here, 40 in diff.json; N0 omitted: it is the list of items already over tolerance in the first layer):

| layer | event | kind | coord | from → to | first over tol. | dominant |
| --- | --- | --- | --- | --- | --- | --- |
| painted_table_cell_text_baselines | text "999-9" in body>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(2) | worsened | dy | -10.44 → -12.44 | L0 | L0 |
| painted_table_cell_text_baselines | text "99990.00001 23456.700001 00000.000420 1 " in body>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(3) | worsened | dy | -3.23 → -5.23 | L0 | L0 |
| painted_table_cell_text_baselines | text "99990000012345" in body>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(3) | worsened | dy | -2.83 → -4.83 | L0 | L0 |
| painted_table_cell_text_baselines | text "Acme Widgets Comércio LTDA" in body>table:nth-child(3)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(1) | worsened | dy | -0.59 → -2.59 | L0 | painted_table_cell_text_baselines |
| painted_table_cell_text_baselines | text "BENEFICIÁRIO" in body>table:nth-child(3)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(1)>span:nth-child(1) | worsened | dy | -1.02 → -3.02 | L0 | painted_table_cell_text_baselines |
| painted_table_cell_text_baselines | text "0042 / 00012345-6" in body>table:nth-child(3)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(2) | worsened | dy | -0.59 → -2.59 | L0 | painted_table_cell_text_baselines |
| painted_table_cell_text_baselines | text "AGÊNCIA / CÓDIGO DO BENEFICIÁRIO" in body>table:nth-child(3)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(2)>span:nth-child(1) | worsened | dy | -1.02 → -3.02 | L0 | painted_table_cell_text_baselines |
| painted_table_cell_text_baselines | text "NOSSO NÚMERO" in body>table:nth-child(3)>tbody:nth-child(1)>tr:nth-child(2)>td:nth-child(1)>span:nth-child(1) | overshoot | dy | 0.91 → -1.09 | L0 | painted_table_cell_text_baselines |
| painted_table_cell_text_baselines | text "VENCIMENTO" in body>table:nth-child(3)>tbody:nth-child(1)>tr:nth-child(2)>td:nth-child(2)>span:nth-child(1) | overshoot | dy | 0.91 → -1.09 | L0 | painted_table_cell_text_baselines |
| painted_table_cell_text_baselines | text "VALOR DO DOCUMENTO" in body>table:nth-child(3)>tbody:nth-child(1)>tr:nth-child(2)>td:nth-child(3)>span:nth-child(1) | overshoot | dy | 0.91 → -1.09 | L0 | painted_table_cell_text_baselines |
| painted_table_cell_text_baselines | text "999-9" in body>table:nth-child(5)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(2) | worsened | dy | -5.69 → -7.69 | L0 | L0 |
| fixed_table_widths | enter (x/y/width) body>table:nth-child(6)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(1) | overshoot | dw | -1.25 → 0.75 | N0 | N0 |
| fixed_table_widths | enter (x/y/width) body>table:nth-child(6)>tbody:nth-child(1)>tr:nth-child(2)>td:nth-child(1) | overshoot | dw | -1.25 → 0.75 | N0 | N0 |
| fixed_table_widths | enter (x/y/width) body>table:nth-child(6)>tbody:nth-child(1)>tr:nth-child(5)>td:nth-child(1) | overshoot | dw | -1.25 → 0.75 | N0 | N0 |
| fixed_table_widths | enter (x/y/width) body>table:nth-child(6)>tbody:nth-child(1)>tr:nth-child(9)>td:nth-child(1) | overshoot | dw | -1 → 1 | N0 | N0 |
| fixed_table_widths | text "Assinatura plano Widget Pro" in body>table:nth-child(7)>tbody:nth-child(2)>tr:nth-child(1)>td:nth-child(2) | worsened | dx | -0.2 → -1.2 | L0 | L0 |
| fixed_table_widths | text "Usuários adicionais (3x)" in body>table:nth-child(7)>tbody:nth-child(2)>tr:nth-child(2)>td:nth-child(2) | worsened | dx | -0.2 → -1.2 | L0 | L0 |
| fixed_table_widths | text "Taxa de processamento" in body>table:nth-child(7)>tbody:nth-child(2)>tr:nth-child(3)>td:nth-child(2) | worsened | dx | -0.2 → -1.2 | L0 | L0 |

## First divergence per layer

The first event over tolerance (or lost) IN each layer. After the document's natural first divergence every layer usually repeats the same event; use `Regressions by layer` for what each layer changed.

| layer | first box | box Δ | first text | text Δ (dx, dy) |
| --- | --- | --- | --- | --- |
| N0 | exit (height) body>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(1) | -1.08 | n/a (no text in Blitz trees) |  |
| B0 | exit (height) body>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(1) | -1.08 | n/a (no text in Blitz trees) |  |
| L0 | exit (height) body>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(1) | -1.08 | text "999-9" in body>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(2) | -1.62, -10.44 |
| vertical_margin_collapse | exit (height) body>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(1) | -1.08 | text "999-9" in body>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(2) | -1.62, -10.44 |
| collapsed_table_medium_border_insets | exit (height) body>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(1) | -1.08 | text "999-9" in body>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(2) | -1.62, -10.44 |
| painted_table_cell_text_baselines | exit (height) body>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(1) | -1.08 | text "999-9" in body>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(2) | -1.62, -12.44 |
| fixed_table_widths | exit (height) body>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(1) | -1.08 | text "999-9" in body>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(2) | -1.62, -12.44 |
| table_percent_widths | exit (height) body>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(1) | -1.08 | text "999-9" in body>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(2) | -1.62, -12.44 |
| auto_table_compact_columns | exit (height) body>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(1) | -1.08 | text "999-9" in body>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(2) | -1.62, -12.44 |
| collapsed_table_medium_border_insets_x | exit (height) body>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(1) | -1.08 | text "999-9" in body>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(2) | -1.62, -12.44 |

## Per-layer error and layer effects

`moved` = boxes/runs whose geometry this layer changed vs the previous one; `better`/`worse` = max |Δ| per item moved closer to / further from Chromium; `Σ` = summed change of that max |Δ| (a few large improvements can make it negative while one box regresses); `regressed` = items this layer worsened or overshot on some coordinate by more than tolerance (classifyStep), NAMED: the first three in document order (boxes that only absorbed or followed a regressed box's change rank last) and the largest.

| layer | box events diverged | text events diverged | mean abs box Δ (px) | boxes moved/better/worse (Σ) | boxes regressed (largest) | runs moved/better/worse (Σ) | runs regressed (largest) |
| --- | --- | --- | --- | --- | --- | --- | --- |
| N0 | 129 | n/a | 11.46 |  |  |  |  |
| B0 | 129 | n/a | 11.46 | 0/0/0 (0) | 0 | 0/0/0 (0) | 0 |
| L0 | 129 | 77 | 11.46 | 0/0/0 (0) | 0 | 0/0/0 (0) | 0 |
| vertical_margin_collapse | 129 | 77 | 11.46 | 0/0/0 (0) | 0 | 0/0/0 (0) | 0 |
| collapsed_table_medium_border_insets | 129 | 77 | 11.46 | 0/0/0 (0) | 0 | 0/0/0 (0) | 0 |
| painted_table_cell_text_baselines | 129 | 75 | 11.46 | 0/0/0 (0) | 0 | 73/61/10 (-102.57) | 11: "999-9" dy -10.44→-12.44; "99990.00001 23456.70" dy -3.23→-5.23; "99990000012345" dy -2.83→-4.83 |
| fixed_table_widths | 126 | 75 | 11.46 | 50/0/0 (0) | 4: body>table:nth-child(6)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(1) overshoot dw -1.25→0.75; body>table:nth-child(6)>tbody:nth-child(1)>tr:nth-child(2)>td:nth-child(1) overshoot dw -1.25→0.75; body>table:nth-child(6)>tbody:nth-child(1)>tr:nth-child(5)>td:nth-child(1) overshoot dw -1.25→0.75; largest: body>table:nth-child(6)>tbody:nth-child(1)>tr:nth-child(9)>td:nth-child(1) overshoot dw -1→1 | 41/4/0 (-1.56) | 3: "Assinatura plano Wid" dx -0.2→-1.2; "Usuários adicionais " dx -0.2→-1.2; "Taxa de processament" dx -0.2→-1.2 |
| table_percent_widths | 126 | 75 | 11.46 | 0/0/0 (0) | 0 | 0/0/0 (0) | 0 |
| auto_table_compact_columns | 126 | 75 | 11.46 | 0/0/0 (0) | 0 | 0/0/0 (0) | 0 |
| collapsed_table_medium_border_insets_x | 126 | 75 | 11.46 | 0/0/0 (0) | 0 | 0/0/0 (0) | 0 |

## Top 20 box divergences in collapsed_table_medium_border_insets_x (absolute)

| path | dx | dy | dw | dh | regressed by | first over tol. | dominant (step) | steps |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| body>div:nth-child(9) | 0 | 29.45 | 0 | -0.55 | N0 dy 0→29.45 (first layer) | N0 | N0 (dy +29.45) | N0 dy +29.45 |
| body>div:nth-child(8) | 0 | 29 | 0 | 0.13 | N0 dy 0→29 (first layer) | N0 | N0 (dy +29) | N0 dy +29 |
| body>div:nth-child(8)>span:nth-child(1) | 0 | 29 | 0 | 0.3 | N0 dy 0→29 (first layer) | N0 | N0 (dy +29) | N0 dy +29 |
| html | 0 | 0 | 0 | 28.91 | N0 dh 0→28.91 (first layer) | N0 | N0 (dh +28.91) | N0 dh +28.91 |
| body | 0 | 0 | 0 | 28.91 | N0 dh 0→28.91 (first layer) | N0 | N0 (dh +28.91) | N0 dh +28.91 |
| body>table:nth-child(7)>tbody:nth-child(2)>tr:nth-child(3)>td:nth-child(1) | -0.5 | 27.42 | 0.34 | 1.41 | N0 dy 0→27.42 (first layer) | N0 | N0 (dy +27.42) | N0 dy +27.42; fixed_table_widths dx -1 |
| body>table:nth-child(7)>tbody:nth-child(2)>tr:nth-child(3)>td:nth-child(2) | -0.16 | 27.42 | 0.34 | 1.41 | N0 dy 0→27.42 (first layer) | N0 | N0 (dy +27.42) | N0 dy +27.42; fixed_table_widths dw +2 |
| body>table:nth-child(7)>tbody:nth-child(2)>tr:nth-child(3)>td:nth-child(3) | 0.19 | 27.42 | 0.31 | 1.41 | N0 dy 0→27.42 (first layer) | N0 | N0 (dy +27.42) | N0 dy +27.42; fixed_table_widths dw +1 |
| body>table:nth-child(7)>tbody:nth-child(2)>tr:nth-child(2)>td:nth-child(1) | -0.5 | 25.02 | 0.34 | 1.41 | N0 dy 0→25.02 (first layer) | N0 | N0 (dy +25.02) | N0 dy +25.02; fixed_table_widths dx -1 |
| body>table:nth-child(7)>tbody:nth-child(2)>tr:nth-child(2)>td:nth-child(2) | -0.16 | 25.02 | 0.34 | 1.41 | N0 dy 0→25.02 (first layer) | N0 | N0 (dy +25.02) | N0 dy +25.02; fixed_table_widths dw +2 |
| body>table:nth-child(7)>tbody:nth-child(2)>tr:nth-child(2)>td:nth-child(3) | 0.19 | 25.02 | 0.31 | 1.41 | N0 dy 0→25.02 (first layer) | N0 | N0 (dy +25.02) | N0 dy +25.02; fixed_table_widths dw +1 |
| body>table:nth-child(7)>tbody:nth-child(2)>tr:nth-child(1)>td:nth-child(1) | -0.5 | 23.61 | 0.34 | 0.41 | N0 dy 0→23.61 (first layer) | N0 | N0 (dy +23.61) | N0 dy +23.61; fixed_table_widths dx -1 |
| body>table:nth-child(7)>tbody:nth-child(2)>tr:nth-child(1)>td:nth-child(2) | -0.16 | 23.61 | 0.34 | 0.41 | N0 dy 0→23.61 (first layer) | N0 | N0 (dy +23.61) | N0 dy +23.61; fixed_table_widths dw +2 |
| body>table:nth-child(7)>tbody:nth-child(2)>tr:nth-child(1)>td:nth-child(3) | 0.19 | 23.61 | 0.31 | 0.41 | N0 dy 0→23.61 (first layer) | N0 | N0 (dy +23.61) | N0 dy +23.61; fixed_table_widths dw +1 |
| body>table:nth-child(7)>thead:nth-child(1)>tr:nth-child(1)>td:nth-child(1)>span:nth-child(1) | 0.45 | 22.23 | -2.56 | -0.7 | N0 dy 0→22.23 (first layer) | N0 | N0 (dy +22.23) | N0 dy +22.23; fixed_table_widths dx -1 |
| body>table:nth-child(7)>thead:nth-child(1)>tr:nth-child(1)>td:nth-child(2)>span:nth-child(1) | -0.2 | 22.23 | -1.56 | -0.7 | N0 dy 0→22.23 (first layer) | N0 | N0 (dy +22.23) | N0 dy +22.23; fixed_table_widths dx -1 |
| body>table:nth-child(7)>thead:nth-child(1)>tr:nth-child(1)>td:nth-child(3)>span:nth-child(1) | 1.14 | 22.23 | -2.59 | -0.7 | N0 dy 0→22.23 (first layer) | N0 | N0 (dy +22.23) | N0 dy +22.23 |
| body>table:nth-child(7)>thead:nth-child(1)>tr:nth-child(1)>td:nth-child(1) | -0.5 | 21.5 | 0.34 | 1.11 | N0 dy 0→21.5 (first layer) | N0 | N0 (dy +21.5) | N0 dy +21.5; fixed_table_widths dx -1 |
| body>table:nth-child(7)>thead:nth-child(1)>tr:nth-child(1)>td:nth-child(2) | -0.16 | 21.5 | 0.34 | 1.11 | N0 dy 0→21.5 (first layer) | N0 | N0 (dy +21.5) | N0 dy +21.5; fixed_table_widths dw +2 |
| body>table:nth-child(7)>thead:nth-child(1)>tr:nth-child(1)>td:nth-child(3) | 0.19 | 21.5 | 0.31 | 1.11 | N0 dy 0→21.5 (first layer) | N0 | N0 (dy +21.5) | N0 dy +21.5; fixed_table_widths dw +1 |

## Top 20 LOCAL box divergences

rdx/rdy = the error a box ADDS to what it inherits: after a previous compared sibling in the same row, relative to that sibling's right edge (dx+dw) and dy; after a stacked sibling, relative to its bottom edge (dy+dh); a first child, relative to its parent's dx/dy. Isolates where cumulative drift originates.

| path | rdx | rdy | dw | dh | regressed by | first over tol. | dominant (step) |
| --- | --- | --- | --- | --- | --- | --- | --- |
| html | 0 | 0 | 0 | 28.91 | N0 dh 0→28.91 (first layer) | N0 | N0 (dh +28.91) |
| body | 0 | 0 | 0 | 28.91 | N0 dh 0→28.91 (first layer) | N0 | N0 (dh +28.91) |
| body>table:nth-child(6) | 0 | -0.11 | 0 | 18.61 | N0 dh 0→18.61 (first layer) | N0 | N0 (dh +18.61) |
| body>table:nth-child(7) | 0 | -0.11 | 0 | 8.33 | N0 dy 0→21 (first layer) | N0 | N0 (dy +21) |
| body>table:nth-child(6)>tbody:nth-child(1)>tr:nth-child(5)>td:nth-child(1) | -0.5 | 1 | 0.75 | 6.69 | N0 dy 0→11.38 (first layer); fixed_table_widths overshoot dw -1.25→0.75 | N0 | N0 (dy +11.38) |
| body>table:nth-child(3) | 0 | -0.11 | 0 | 4.84 | N0 dh 0→4.84 (first layer) | N0 | N0 (dh +4.84) |
| body>table:nth-child(6)>tbody:nth-child(1)>tr:nth-child(9)>td:nth-child(1)>span:nth-child(1) | 0.95 | 0.73 | -2.91 | 0.3 | N0 dy 0→19.8 (first layer) | N0 | N0 (dy +19.8) |
| body>table:nth-child(6)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(2)>span:nth-child(1) | 0.95 | 0.73 | -2.66 | -0.7 | N0 dy 0→3.73 (first layer) | N0 | N0 (dy +3.73) |
| body>table:nth-child(6)>tbody:nth-child(1)>tr:nth-child(2)>td:nth-child(2)>span:nth-child(1) | 0.95 | 0.73 | -2.66 | 0.59 | N0 dy 0→5.05 (first layer) | N0 | N0 (dy +5.05) |
| body>table:nth-child(6)>tbody:nth-child(1)>tr:nth-child(3)>td:nth-child(1)>span:nth-child(1) | 0.95 | 0.74 | -2.66 | 0.3 | N0 dy 0→7.27 (first layer) | N0 | N0 (dy +7.27) |
| body>table:nth-child(6)>tbody:nth-child(1)>tr:nth-child(3)>td:nth-child(4)>span:nth-child(1) | 0.95 | 0.74 | -2.66 | 0.3 | N0 dy 0→7.27 (first layer) | N0 | N0 (dy +7.27) |
| body>table:nth-child(6)>tbody:nth-child(1)>tr:nth-child(4)>td:nth-child(1)>span:nth-child(1) | 0.95 | 0.74 | -2.66 | 0.3 | N0 dy 0→9.19 (first layer) | N0 | N0 (dy +9.19) |
| body>table:nth-child(6)>tbody:nth-child(1)>tr:nth-child(4)>td:nth-child(4)>span:nth-child(1) | 0.95 | 0.74 | -2.66 | 0.3 | N0 dy 0→9.19 (first layer) | N0 | N0 (dy +9.19) |
| body>table:nth-child(6)>tbody:nth-child(1)>tr:nth-child(5)>td:nth-child(2)>span:nth-child(1) | 0.95 | -0.27 | -2.66 | 0.3 | N0 dy 0→11.11 (first layer) | N0 | N0 (dy +11.11) |
| body>table:nth-child(6)>tbody:nth-child(1)>tr:nth-child(6)>td:nth-child(1)>span:nth-child(1) | 0.95 | 0.73 | -2.66 | -0.7 | N0 dy 0→14.03 (first layer) | N0 | N0 (dy +14.03) |
| body>table:nth-child(6)>tbody:nth-child(1)>tr:nth-child(7)>td:nth-child(1)>span:nth-child(1) | 0.95 | 0.73 | -2.66 | -0.7 | N0 dy 0→15.95 (first layer) | N0 | N0 (dy +15.95) |
| body>table:nth-child(6)>tbody:nth-child(1)>tr:nth-child(8)>td:nth-child(1)>span:nth-child(1) | 0.95 | 0.73 | -2.66 | 0.3 | N0 dy 0→17.88 (first layer) | N0 | N0 (dy +17.88) |
| body>table:nth-child(3)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(2)>span:nth-child(1) | 0.95 | 0.73 | -2.59 | 0.3 | N0 dw 0→-2.59 (first layer) | N0 | N0 (dw -2.59) |
| body>table:nth-child(3)>tbody:nth-child(1)>tr:nth-child(2)>td:nth-child(3)>span:nth-child(1) | 0.95 | 0.73 | -2.59 | 0.3 | N0 dw 0→-2.59 (first layer) | N0 | N0 (dw -2.59) |
| body>table:nth-child(7)>thead:nth-child(1)>tr:nth-child(1)>td:nth-child(3)>span:nth-child(1) | 0.95 | 0.73 | -2.59 | -0.7 | N0 dy 0→22.23 (first layer) | N0 | N0 (dy +22.23) |

## Top 20 text-run divergences in collapsed_table_medium_border_insets_x

| owner | text | dx | dy | dw | dright | faces | regressed by | first over tol. | dominant (step) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| body>div:nth-child(9) | XXXX-TESTE. | 0.01 | 29.41 | 0 | 0.01 | LiberationSans-Regular.ttf | L0 dy 0→29.41 (first layer) | L0 | L0 (dy +29.41) |
| body>div:nth-child(8)>span:nth-child(1) | CÓDIGO DE BARRAS (REPRESENTAÇÃO TEXTUAL — NÃO... | 0 | 29 | 0.39 | 0.39 | LiberationMono-Regular.ttf | L0 dy 0→29 (first layer) | L0 | L0 (dy +29) |
| body>div:nth-child(9) | Documento de cobrança fictício gerado por vel... | 0 | 28.91 | 0 | 0 | LiberationSans-Regular.ttf | L0 dy 0→28.91 (first layer) | L0 | L0 (dy +28.91) |
| body>div:nth-child(8) | 99991999900000123459990000012345670000004200 | 0 | 28.53 | 0.3 | 0.3 | LiberationMono-Regular.ttf | L0 dy 0→28.53 (first layer) | L0 | L0 (dy +28.53) |
| body>table:nth-child(7)>tbody:nth-child(2)>tr:nth-child(3)>td:nth-child(1) | 06/2026 | -0.55 | 25.16 | -0.02 | -0.57 | LiberationSans-Regular.ttf | L0 dy 0→27.16 (first layer) | L0 | L0 (dy +27.16) |
| body>table:nth-child(7)>tbody:nth-child(2)>tr:nth-child(3)>td:nth-child(2) | Taxa de processamento | -1.2 | 25.16 | -0.02 | -1.23 | LiberationSans-Regular.ttf | L0 dy 0→27.16 (first layer); fixed_table_widths dx -0.2→-1.2 | L0 | L0 (dy +27.16) |
| body>table:nth-child(7)>tbody:nth-child(2)>tr:nth-child(3)>td:nth-child(3) | R$ 46,50 | 0.14 | 25.16 | -0.01 | 0.13 | LiberationSans-Regular.ttf | L0 dy 0→27.16 (first layer) | L0 | L0 (dy +27.16) |
| body>table:nth-child(7)>tbody:nth-child(2)>tr:nth-child(2)>td:nth-child(1) | 06/2026 | -0.55 | 22.75 | -0.02 | -0.57 | LiberationSans-Regular.ttf | L0 dy 0→24.75 (first layer) | L0 | L0 (dy +24.75) |
| body>table:nth-child(7)>tbody:nth-child(2)>tr:nth-child(2)>td:nth-child(2) | Usuários adicionais (3x) | -1.2 | 22.75 | -0.02 | -1.23 | LiberationSans-Regular.ttf | L0 dy 0→24.75 (first layer); fixed_table_widths dx -0.2→-1.2 | L0 | L0 (dy +24.75) |
| body>table:nth-child(7)>tbody:nth-child(2)>tr:nth-child(2)>td:nth-child(3) | R$ 297,00 | 0.14 | 22.75 | -0.02 | 0.12 | LiberationSans-Regular.ttf | L0 dy 0→24.75 (first layer) | L0 | L0 (dy +24.75) |
| body>table:nth-child(7)>tbody:nth-child(2)>tr:nth-child(1)>td:nth-child(1) | 06/2026 | -0.55 | 21.34 | -0.02 | -0.57 | LiberationSans-Regular.ttf | L0 dy 0→23.34 (first layer) | L0 | L0 (dy +23.34) |
| body>table:nth-child(7)>tbody:nth-child(2)>tr:nth-child(1)>td:nth-child(2) | Assinatura plano Widget Pro | -1.2 | 21.34 | -0.03 | -1.23 | LiberationSans-Regular.ttf | L0 dy 0→23.34 (first layer); fixed_table_widths dx -0.2→-1.2 | L0 | L0 (dy +23.34) |
| body>table:nth-child(7)>tbody:nth-child(2)>tr:nth-child(1)>td:nth-child(3) | R$ 1.499,00 | 0.14 | 21.34 | -0.01 | 0.13 | LiberationSans-Regular.ttf | L0 dy 0→23.34 (first layer) | L0 | L0 (dy +23.34) |
| body>table:nth-child(7)>thead:nth-child(1)>tr:nth-child(1)>td:nth-child(1)>span:nth-child(1) | REFERÊNCIA | 0.45 | 20.23 | 0.07 | 0.52 | LiberationSans-Regular.ttf | L0 dy 0→22.23 (first layer) | L0 | L0 (dy +22.23) |
| body>table:nth-child(7)>thead:nth-child(1)>tr:nth-child(1)>td:nth-child(2)>span:nth-child(1) | DESCRIÇÃO | -0.2 | 20.23 | 0.06 | -0.15 | LiberationSans-Regular.ttf | L0 dy 0→22.23 (first layer) | L0 | L0 (dy +22.23) |
| body>table:nth-child(7)>thead:nth-child(1)>tr:nth-child(1)>td:nth-child(3)>span:nth-child(1) | VALOR | -0.94 | 20.23 | 0.04 | -0.9 | LiberationSans-Regular.ttf | L0 dy 0→22.23 (first layer) | L0 | L0 (dy +22.23) |
| body>table:nth-child(6)>tbody:nth-child(1)>tr:nth-child(9)>td:nth-child(1) | Maria das Couves Exemplo | 0.45 | 18.22 | 0 | 0.45 | LiberationSans-Bold.ttf | L0 dy 0→20.22 (first layer) | L0 | L0 (dy +20.22) |
| body>table:nth-child(6)>tbody:nth-child(1)>tr:nth-child(9)>td:nth-child(1) | — CPF 123.456.789-09 | 0.44 | 18.22 | -0.01 | 0.44 | LiberationSans-Regular.ttf | L0 dy 0→20.22 (first layer) | L0 | L0 (dy +20.22) |
| body>table:nth-child(6)>tbody:nth-child(1)>tr:nth-child(9)>td:nth-child(1) | Rua das Flores, 123 — Jardim Sintético | 0.45 | 18.03 | 0 | 0.45 | LiberationSans-Regular.ttf | L0 dy 0→20.03 (first layer) | L0 | L0 (dy +20.03) |
| body>table:nth-child(6)>tbody:nth-child(1)>tr:nth-child(9)>td:nth-child(1) | Cidade Exemplo / SP — CEP 01234-567 | 0.45 | 17.84 | 0 | 0.45 | LiberationSans-Regular.ttf | L0 dy 0→19.84 (first layer) | L0 | L0 (dy +19.84) |

## Top 20 LOCAL text-run divergences

rdx/rdy = the run's Δ minus its owner box's dx/dy (final layer), so runs that only ride along with a shifted owner rank low (de-duplicates cascades, like the local box table).

| owner | text | rdx | rdy | dx | dy | regressed by | first over tol. | dominant (step) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| body>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(2) | 999-9 | -2.01 | -12.37 | -1.62 | -12.44 | L0 dy 0→-10.44 (first layer); painted_table_cell_text_baselines dy -10.44→-12.44 | L0 | L0 (dy -10.44) |
| body>table:nth-child(5)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(2) | 999-9 | -2.01 | -12.37 | -1.62 | -7.69 | L0 dy 0→-5.69 (first layer); painted_table_cell_text_baselines dy -5.69→-7.69 | L0 | L0 (dy -5.69) |
| body>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(3) | 99990.00001 23456.700001 00000.000420 1  | -0.02 | -5.17 | -0.44 | -5.23 | L0 dy 0→-3.23 (first layer); painted_table_cell_text_baselines dy -3.23→-5.23 | L0 | L0 (dy -3.23) |
| body>table:nth-child(5)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(3) | 99990.00001 23456.700001 00000.000420 1  | -0.02 | -5.17 | -0.44 | -0.48 | L0 dy 0→1.52 (first layer) | L0 | painted_table_cell_text_baselines (dy -2) |
| body>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(3) | 99990000012345 | -0.03 | -4.77 | -0.45 | -4.83 | L0 dy 0→-2.83 (first layer); painted_table_cell_text_baselines dy -2.83→-4.83 | L0 | L0 (dy -2.83) |
| body>table:nth-child(5)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(3) | 99990000012345 | -0.03 | -4.77 | -0.45 | -0.08 | L0 dy 0→1.92 (first layer) | L0 | painted_table_cell_text_baselines (dy -2) |
| body>table:nth-child(7)>tbody:nth-child(2)>tr:nth-child(2)>td:nth-child(1) | 06/2026 | -0.05 | -2.27 | -0.55 | 22.75 | L0 dy 0→24.75 (first layer) | L0 | L0 (dy +24.75) |
| body>table:nth-child(7)>tbody:nth-child(2)>tr:nth-child(2)>td:nth-child(2) | Usuários adicionais (3x) | -1.05 | -2.27 | -1.2 | 22.75 | L0 dy 0→24.75 (first layer); fixed_table_widths dx -0.2→-1.2 | L0 | L0 (dy +24.75) |
| body>table:nth-child(7)>tbody:nth-child(2)>tr:nth-child(2)>td:nth-child(3) | R$ 297,00 | -0.05 | -2.27 | 0.14 | 22.75 | L0 dy 0→24.75 (first layer) | L0 | L0 (dy +24.75) |
| body>table:nth-child(7)>tbody:nth-child(2)>tr:nth-child(3)>td:nth-child(1) | 06/2026 | -0.05 | -2.27 | -0.55 | 25.16 | L0 dy 0→27.16 (first layer) | L0 | L0 (dy +27.16) |
| body>table:nth-child(7)>tbody:nth-child(2)>tr:nth-child(3)>td:nth-child(2) | Taxa de processamento | -1.05 | -2.27 | -1.2 | 25.16 | L0 dy 0→27.16 (first layer); fixed_table_widths dx -0.2→-1.2 | L0 | L0 (dy +27.16) |
| body>table:nth-child(7)>tbody:nth-child(2)>tr:nth-child(3)>td:nth-child(3) | R$ 46,50 | -0.05 | -2.27 | 0.14 | 25.16 | L0 dy 0→27.16 (first layer) | L0 | L0 (dy +27.16) |
| body>table:nth-child(4)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(1) | Corte na linha pontilhada — Ficha de Compensação | 0.05 | -2.26 | 0.05 | 0.59 | L0 dy 0→2.59 (first layer) | L0 | L0 (dy +2.59) |
| body>table:nth-child(7)>tbody:nth-child(2)>tr:nth-child(1)>td:nth-child(1) | 06/2026 | -0.05 | -2.26 | -0.55 | 21.34 | L0 dy 0→23.34 (first layer) | L0 | L0 (dy +23.34) |
| body>table:nth-child(7)>tbody:nth-child(2)>tr:nth-child(1)>td:nth-child(2) | Assinatura plano Widget Pro | -1.05 | -2.26 | -1.2 | 21.34 | L0 dy 0→23.34 (first layer); fixed_table_widths dx -0.2→-1.2 | L0 | L0 (dy +23.34) |
| body>table:nth-child(7)>tbody:nth-child(2)>tr:nth-child(1)>td:nth-child(3) | R$ 1.499,00 | -0.05 | -2.26 | 0.14 | 21.34 | L0 dy 0→23.34 (first layer) | L0 | L0 (dy +23.34) |
| body>table:nth-child(3)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(2)>span:nth-child(1) | AGÊNCIA / CÓDIGO DO BENEFICIÁRIO | -2.25 | -2 | -1.11 | -3.02 | L0 dx 0→-1.11 (first layer); painted_table_cell_text_baselines dy -1.02→-3.02 | L0 | painted_table_cell_text_baselines (dy -2) |
| body>table:nth-child(6)>tbody:nth-child(1)>tr:nth-child(5)>td:nth-child(1) | • Em caso de dúvida sobre este documento de t... | 0.95 | -2.22 | 0.45 | 9.16 | L0 dy 0→11.16 (first layer) | L0 | L0 (dy +11.16) |
| body>table:nth-child(6)>tbody:nth-child(1)>tr:nth-child(5)>td:nth-child(2)>span:nth-child(1) | (-) DESCONTO / ABATIMENTO | -2.19 | -2 | -0.98 | 9.11 | L0 dy 0→11.11 (first layer) | L0 | L0 (dy +11.11) |
| body>table:nth-child(3)>tbody:nth-child(1)>tr:nth-child(2)>td:nth-child(3)>span:nth-child(1) | VALOR DO DOCUMENTO | -2.18 | -2 | -1.03 | -1.09 | L0 dx 0→-1.03 (first layer); painted_table_cell_text_baselines overshoot dy 0.91→-1.09 | L0 | painted_table_cell_text_baselines (dy -2) |

## Margins (not part of the x/y/w/h attribution)

vellora margins are Blitz's resolved layout.margin as read by the walk (L0) and after the passes; Chromium values are COMPUTED margins of the element itself (not collapsed through descendants). Not part of the x/y/w/h attribution.

- boxes with vellora margins: 82; changed by the passes (L0 → final): 0
- differ from Chromium COMPUTED margins by > tolerance (L0): 0


## Match counts and node policy

- Chromium elements under html (head excluded) by policy: compared 82, no-blitz-box 25, inline-text-only 44
- vellora L0 boxes (elements, head excluded): 175; matched to a compared Chromium box: 82; compared Chromium boxes present in N0: 82
- vellora-only — table row/group: not a Blitz layout node (zero box in walk): 25 (e.g. body>table:nth-child(2)>tbody:nth-child(1); body>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(1); body>table:nth-child(3)>tbody:nth-child(1))
- vellora-only — html_normalize wrapper (no source node): 24 (e.g. body>table:nth-child(3)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(1)>::vellora-wrapper(1); body>table:nth-child(3)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(2)>::vellora-wrapper(1); body>table:nth-child(3)>tbody:nth-child(1)>tr:nth-child(2)>td:nth-child(1)>::vellora-wrapper(1))
- vellora-only — inline element (compared via text runs): 44 (e.g. body>table:nth-child(3)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(1)>span:nth-child(2); body>table:nth-child(3)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(2)>span:nth-child(2); body>table:nth-child(3)>tbody:nth-child(1)>tr:nth-child(2)>td:nth-child(1)>span:nth-child(2))
- Chromium-only compared boxes (no vellora L0 box): 0
- Blitz layout-tree-only nodes (anonymous blocks / pseudo-elements the walk never visits): 0
- Policy: `inline-text-only` = Chromium `display:inline` non-replaced element (Blitz gives it no Taffy box; its text is compared as runs). `no-blitz-box` = table row/row-group that is not a Blitz layout node (zero box in the walk); listed, not scored. `no-layout` = Chromium has no layout object (display:none). Pseudo-elements are matched by `::before`/`::after` segments and never count toward `:nth-child`; their generated text is compared like any text. Anonymous boxes: Chromium's are not exposed by DOMSnapshot; Blitz's appear only in N0/B0 as `::blitz-anon(j)`. html_normalize wrappers are transparent in keys and listed as vellora-only.

## Text alignment

- vellora runs (non-blank, L0): 78; Chromium text fragments (non-blank): 79; matched pairs: 78 (1 joined across fragment/run boundaries)
- unmatched vellora runs: 0; unmatched Chromium fragments: 0; Chromium text with NO vellora owner (text vellora never shaped): 0

## Caveats

- Local macOS Chrome results are INDICATIVE; the authoritative run is the pinned Chrome for Testing on Linux CI (see fidelity/layout-diff/README.md).
- Text dy compares BASELINES when Chromium's ascent for the face/size was measured (probe page, zero-size inline-block on the baseline); otherwise vellora's text top (baseline − Parley ascent) vs Chromium's text-box top (`dy basis` column).
- L0 text positions already include `read_text_runs`' inline padding-right compensation, so 'raw Parley' text is not separated from vellora's reader.
- A layer that moves a box TOWARDS Chromium is an improvement here, whatever its cause; for 'what did this code change do', compare two builds with compare.mjs.
