# Layout diff — invoice (pin)

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
- Input sha256: native 99c85b4aaa8aa295…, browser ab6bbb49c6d838bb…

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
- regressed by (which layer made it worse, per coordinate): **N0 dw 0→-14.47 (first layer)**
- dominant layer (largest step of the final Δ): N0 (dw -14.47); step decomposition (sums to the final Δ): N0 dw -14.47; collapsed_table_medium_border_insets dy -3; collapsed_table_medium_border_insets_x dw +3.38

| layer | status | dx | dy | dw | dh | dy basis |
| --- | --- | --- | --- | --- | --- | --- |
| N0 | diverged | 3 | 3 | -14.47 |  |  |
| B0 | diverged | 3 | 3 | -14.47 |  |  |
| L0 | diverged | 3 | 3 | -14.47 |  |  |
| vertical_margin_collapse | diverged | 3 | 3 | -14.47 |  |  |
| collapsed_table_medium_border_insets | diverged | 3 | 0 | -14.47 |  |  |
| painted_table_cell_text_baselines | diverged | 3 | 0 | -14.47 |  |  |
| fixed_table_widths | diverged | 3 | 0 | -14.47 |  |  |
| table_percent_widths | diverged | 3 | 0 | -14.47 |  |  |
| auto_table_compact_columns | diverged | 3 | 0 | -14.47 |  |  |
| collapsed_table_medium_border_insets_x | diverged | 0 | 0 | -11.09 |  |  |
| N0u | diverged | 3 | 3 | -14.97 |  |  |
| B0u | diverged | 3 | 3 | -14.97 |  |  |

Ancestor chain (compared boxes, root first; deltas = vellora − Chromium, CSS px):

| ancestor | collapsed_table_medium_border_insets_x dx,dy,dw,dh | N0 dx,dy,dw,dh | B0 dx,dy,dw,dh | L0 dx,dy,dw,dh |
| --- | --- | --- | --- | --- |
| html | 0, 0, 0, 132.55 | 0, 0, 0, 132.55 | 0, 0, 0, 132.55 | 0, 0, 0, 132.55 |
| body | 0, 0, 0, 132.55 | 0, 0, 0, 132.55 | 0, 0, 0, 132.55 | 0, 0, 0, 132.55 |
| body>table:nth-child(1) | 0, 0, 0, -0.25 | 0, 0, 0, 5.75 | 0, 0, 0, 5.75 | 0, 0, 0, 5.75 |

## First divergent text run in collapsed_table_medium_border_insets_x

- **text "Acme Widgets LON" in body>table:nth-child(1)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(1)>div:nth-child(2)** (event #7)
- first over tolerance: **L0** — RAW BLITZ/PARLEY TEXT as read by vellora's walk (L0); no normalize pass involved
- regressed by (which layer made it worse, per coordinate): **L0 dx 0→3 (first layer); collapsed_table_medium_border_insets dy -2.53→-5.53**
- dominant layer (largest step of the final Δ): L0 (dx +3); step decomposition (sums to the final Δ): L0 dx +3; collapsed_table_medium_border_insets dy -3; collapsed_table_medium_border_insets_x dx -3
- Chromium fragment: "Acme Widgets LON" at x=0 y=72.53 w=230.48; vellora faces: LiberationSans-Bold.ttf

| layer | status | dx | dy | dw | dright | dy basis |
| --- | --- | --- | --- | --- | --- | --- |
| N0 | n/a |  |  |  |  |  |
| B0 | n/a |  |  |  |  |  |
| L0 | diverged | 3 | -2.53 | 0 | 3 | baseline |
| vertical_margin_collapse | diverged | 3 | -2.53 | 0 | 3 | baseline |
| collapsed_table_medium_border_insets | diverged | 3 | -5.53 | 0 | 3 | baseline |
| painted_table_cell_text_baselines | diverged | 3 | -5.53 | 0 | 3 | baseline |
| fixed_table_widths | diverged | 3 | -5.53 | 0 | 3 | baseline |
| table_percent_widths | diverged | 3 | -5.53 | 0 | 3 | baseline |
| auto_table_compact_columns | diverged | 3 | -5.53 | 0 | 3 | baseline |
| collapsed_table_medium_border_insets_x | diverged | 0 | -5.53 | 0 | 0 | baseline |

Ancestor chain (compared boxes, root first; deltas = vellora − Chromium, CSS px):

| ancestor | collapsed_table_medium_border_insets_x dx,dy,dw,dh | N0 dx,dy,dw,dh | B0 dx,dy,dw,dh | L0 dx,dy,dw,dh |
| --- | --- | --- | --- | --- |
| html | 0, 0, 0, 132.55 | 0, 0, 0, 132.55 | 0, 0, 0, 132.55 | 0, 0, 0, 132.55 |
| body | 0, 0, 0, 132.55 | 0, 0, 0, 132.55 | 0, 0, 0, 132.55 | 0, 0, 0, 132.55 |
| body>table:nth-child(1) | 0, 0, 0, -0.25 | 0, 0, 0, 5.75 | 0, 0, 0, 5.75 | 0, 0, 0, 5.75 |
| body>table:nth-child(1)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(1) | 0, 0, -11.09, -0.25 | 3, 3, -14.47, -0.25 | 3, 3, -14.47, -0.25 | 3, 3, -14.47, -0.25 |

## First box event a layout_normalize pass regressed

- **enter (x/y/width) body>table:nth-child(1)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(1)>div:nth-child(2)** (event #6)
- first over tolerance: **N0** — RAW BLITZ: Blitz's layout of the SOURCE HTML (N0) already differs from Chromium
- regressed by (which layer made it worse, per coordinate): **N0 dw 0→-14.47 (first layer); collapsed_table_medium_border_insets dy -2.53→-5.53**
- dominant layer (largest step of the final Δ): N0 (dw -14.47); step decomposition (sums to the final Δ): N0 dw -14.47; collapsed_table_medium_border_insets dy -3; collapsed_table_medium_border_insets_x dx -3

| layer | status | dx | dy | dw | dh | dy basis |
| --- | --- | --- | --- | --- | --- | --- |
| N0 | diverged | 3 | -2.53 | -14.47 |  |  |
| B0 | diverged | 3 | -2.53 | -14.47 |  |  |
| L0 | diverged | 3 | -2.53 | -14.47 |  |  |
| vertical_margin_collapse | diverged | 3 | -2.53 | -14.47 |  |  |
| collapsed_table_medium_border_insets | diverged | 3 | -5.53 | -14.47 |  |  |
| painted_table_cell_text_baselines | diverged | 3 | -5.53 | -14.47 |  |  |
| fixed_table_widths | diverged | 3 | -5.53 | -14.47 |  |  |
| table_percent_widths | diverged | 3 | -5.53 | -14.47 |  |  |
| auto_table_compact_columns | diverged | 3 | -5.53 | -14.47 |  |  |
| collapsed_table_medium_border_insets_x | diverged | 0 | -5.53 | -14.47 |  |  |
| N0u | diverged | 3 | -2.28 | -14.97 |  |  |
| B0u | diverged | 3 | -2.28 | -14.97 |  |  |

Ancestor chain (compared boxes, root first; deltas = vellora − Chromium, CSS px):

| ancestor | collapsed_table_medium_border_insets_x dx,dy,dw,dh | N0 dx,dy,dw,dh | B0 dx,dy,dw,dh | L0 dx,dy,dw,dh |
| --- | --- | --- | --- | --- |
| html | 0, 0, 0, 132.55 | 0, 0, 0, 132.55 | 0, 0, 0, 132.55 | 0, 0, 0, 132.55 |
| body | 0, 0, 0, 132.55 | 0, 0, 0, 132.55 | 0, 0, 0, 132.55 | 0, 0, 0, 132.55 |
| body>table:nth-child(1) | 0, 0, 0, -0.25 | 0, 0, 0, 5.75 | 0, 0, 0, 5.75 | 0, 0, 0, 5.75 |
| body>table:nth-child(1)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(1) | 0, 0, -11.09, -0.25 | 3, 3, -14.47, -0.25 | 3, 3, -14.47, -0.25 | 3, 3, -14.47, -0.25 |

## First text run a layout_normalize pass regressed

- **text "Acme Widgets LON" in body>table:nth-child(1)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(1)>div:nth-child(2)** (event #7)
- first over tolerance: **L0** — RAW BLITZ/PARLEY TEXT as read by vellora's walk (L0); no normalize pass involved
- regressed by (which layer made it worse, per coordinate): **L0 dx 0→3 (first layer); collapsed_table_medium_border_insets dy -2.53→-5.53**
- dominant layer (largest step of the final Δ): L0 (dx +3); step decomposition (sums to the final Δ): L0 dx +3; collapsed_table_medium_border_insets dy -3; collapsed_table_medium_border_insets_x dx -3
- Chromium fragment: "Acme Widgets LON" at x=0 y=72.53 w=230.48; vellora faces: LiberationSans-Bold.ttf

| layer | status | dx | dy | dw | dright | dy basis |
| --- | --- | --- | --- | --- | --- | --- |
| N0 | n/a |  |  |  |  |  |
| B0 | n/a |  |  |  |  |  |
| L0 | diverged | 3 | -2.53 | 0 | 3 | baseline |
| vertical_margin_collapse | diverged | 3 | -2.53 | 0 | 3 | baseline |
| collapsed_table_medium_border_insets | diverged | 3 | -5.53 | 0 | 3 | baseline |
| painted_table_cell_text_baselines | diverged | 3 | -5.53 | 0 | 3 | baseline |
| fixed_table_widths | diverged | 3 | -5.53 | 0 | 3 | baseline |
| table_percent_widths | diverged | 3 | -5.53 | 0 | 3 | baseline |
| auto_table_compact_columns | diverged | 3 | -5.53 | 0 | 3 | baseline |
| collapsed_table_medium_border_insets_x | diverged | 0 | -5.53 | 0 | 0 | baseline |

Ancestor chain (compared boxes, root first; deltas = vellora − Chromium, CSS px):

| ancestor | collapsed_table_medium_border_insets_x dx,dy,dw,dh | N0 dx,dy,dw,dh | B0 dx,dy,dw,dh | L0 dx,dy,dw,dh |
| --- | --- | --- | --- | --- |
| html | 0, 0, 0, 132.55 | 0, 0, 0, 132.55 | 0, 0, 0, 132.55 | 0, 0, 0, 132.55 |
| body | 0, 0, 0, 132.55 | 0, 0, 0, 132.55 | 0, 0, 0, 132.55 | 0, 0, 0, 132.55 |
| body>table:nth-child(1) | 0, 0, 0, -0.25 | 0, 0, 0, 5.75 | 0, 0, 0, 5.75 | 0, 0, 0, 5.75 |
| body>table:nth-child(1)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(1) | 0, 0, -11.09, -0.25 | 3, 3, -14.47, -0.25 | 3, 3, -14.47, -0.25 | 3, 3, -14.47, -0.25 |

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
| N0 | 313 (313/0/0) | n/a | enter (x/y/width) body>table:nth-child(1)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(1) (N0 dw 0→-14.47 (first layer)) | enter (x/y/width) body>div:nth-child(5)>p:nth-child(2) worsened dy 0→132.72 | — | — |
| B0 | 0 (0/0/0) | n/a | — | — | — | — |
| L0 | 0 (210/0/0) | 210 | — | — | text "Acme Widgets LON" in body>table:nth-child(1)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(1)>div:nth-child(2) (L0 dx 0→3 (first layer)) | text "Pagamento via transferência para a conta Banco Fictício S.A., agência 0001, conta 00012345-6. Favor informar o número da " in body>div:nth-child(5)>p:nth-child(2) worsened dy 0→132.72 |
| vertical_margin_collapse | 0 (0/0/0) | 0 | — | — | — | — |
| collapsed_table_medium_border_insets | 3 (4/1/0) | 2 | enter (x/y/width) body>table:nth-child(1)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(1)>div:nth-child(2) (collapsed_table_medium_border_insets dy -2.53→-5.53) | enter (x/y/width) body>table:nth-child(1)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(1)>div:nth-child(2) worsened dy -2.53→-5.53 | text "Acme Widgets LON" in body>table:nth-child(1)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(1)>div:nth-child(2) (collapsed_table_medium_border_insets dy -2.53→-5.53) | text "Acme Widgets LON" in body>table:nth-child(1)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(1)>div:nth-child(2) worsened dy -2.53→-5.53 |
| painted_table_cell_text_baselines | 0 (4/8/0) | 12 | — | — | text "EMITENTE" in body>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(1)>div:nth-child(1) (painted_table_cell_text_baselines overshoot dy 0.86→-1.14) | text "EMITENTE" in body>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(1)>div:nth-child(1) overshoot dy 0.86→-1.14 |
| fixed_table_widths | 0 (0/0/0) | 0 | — | — | — | — |
| table_percent_widths | 0 (0/0/0) | 0 | — | — | — | — |
| auto_table_compact_columns | 35 (35/35/0) | 35 | enter (x/y/width) body>table:nth-child(3)>thead:nth-child(1)>tr:nth-child(1)>th:nth-child(3) (auto_table_compact_columns dw 1.58→-3.34) | enter (x/y/width) body>table:nth-child(3)>thead:nth-child(1)>tr:nth-child(1)>th:nth-child(3) worsened dw 1.58→-3.34 | text "TOTAL" in body>table:nth-child(3)>thead:nth-child(1)>tr:nth-child(1)>th:nth-child(4) (auto_table_compact_columns overshoot dx -3.34→3.65) | text "TOTAL" in body>table:nth-child(3)>thead:nth-child(1)>tr:nth-child(1)>th:nth-child(4) overshoot dx -3.34→3.65 |
| collapsed_table_medium_border_insets_x | 71 (71/1/0) | 1 | enter (x/y/width) body>table:nth-child(1)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(2) (collapsed_table_medium_border_insets_x dw 5.47→8.06) | enter (x/y/width) body>table:nth-child(3)>thead:nth-child(1)>tr:nth-child(1)>th:nth-child(2) worsened dx -11.08→-14.08 | text "EM ABERTO" in body>table:nth-child(1)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(2)>div:nth-child(2)>div:nth-child(4)>span:nth-child(1) (collapsed_table_medium_border_insets_x overshoot dx -1.69→1.31) | text "EM ABERTO" in body>table:nth-child(1)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(2)>div:nth-child(2)>div:nth-child(4)>span:nth-child(1) overshoot dx -1.69→1.31 |

Events regressed by each layer after N0, in document order (first 12 per layer here, 40 in diff.json; N0 omitted: it is the list of items already over tolerance in the first layer):

| layer | event | kind | coord | from → to | first over tol. | dominant |
| --- | --- | --- | --- | --- | --- | --- |
| collapsed_table_medium_border_insets | enter (x/y/width) body>table:nth-child(1)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(1)>div:nth-child(2) | worsened | dy | -2.53 → -5.53 | N0 | N0 |
| collapsed_table_medium_border_insets | text "Acme Widgets LON" in body>table:nth-child(1)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(1)>div:nth-child(2) | worsened | dy | -2.53 → -5.53 | L0 | L0 |
| collapsed_table_medium_border_insets | enter (x/y/width) body>table:nth-child(1)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(1)>p:nth-child(3) | worsened | dy | -2.33 → -5.33 | N0 | N0 |
| collapsed_table_medium_border_insets | text "Soluções industriais sob medida" in body>table:nth-child(1)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(1)>p:nth-child(3) | worsened | dy | -2.33 → -5.33 | L0 | L0 |
| collapsed_table_medium_border_insets | enter (x/y/width) body>table:nth-child(1)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(2)>div:nth-child(2)>div:nth-child(4)>span:nth-child(1) | overshoot | dy | 1.7 → -1.3 | N0 | collapsed_table_medium_border_insets |
| painted_table_cell_text_baselines | text "EMITENTE" in body>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(1)>div:nth-child(1) | overshoot | dy | 0.86 → -1.14 | L0 | L0 |
| painted_table_cell_text_baselines | text "Acme Widgets LON" in body>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(1)>div:nth-child(2) | overshoot | dy | 0.89 → -1.11 | L0 | L0 |
| painted_table_cell_text_baselines | text "Rua das Flores, 123 — Sala 4B" in body>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(1)>p:nth-child(3) | overshoot | dy | 1.02 → -0.98 | L0 | L0 |
| painted_table_cell_text_baselines | text "São Paulo — SP" in body>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(1)>p:nth-child(4) | worsened | dy | 0.66 → -1.34 | L0 | L0 |
| painted_table_cell_text_baselines | text "CNPJ 12.345.678/0001-90" in body>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(1)>p:nth-child(6) | overshoot | dy | 0.94 → -1.06 | L0 | L0 |
| painted_table_cell_text_baselines | text "faturamento@acmewidgets.example" in body>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(1)>p:nth-child(7) | worsened | dy | 0.58 → -1.42 | L0 | L0 |
| painted_table_cell_text_baselines | text "DESTINATÁRIO" in body>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(2)>div:nth-child(1) | overshoot | dy | 0.86 → -1.14 | L0 | L0 |
| painted_table_cell_text_baselines | text "Borges & Pinto Comércio Ltda." in body>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(2)>div:nth-child(2) | overshoot | dy | 0.89 → -1.11 | L0 | L0 |
| painted_table_cell_text_baselines | text "Cliente CUST-00042" in body>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(2)>p:nth-child(3) | overshoot | dy | 1.02 → -0.98 | L0 | L0 |
| painted_table_cell_text_baselines | text "Avenida Central, 4500 — Conjunto 12" in body>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(2)>p:nth-child(4) | worsened | dy | 0.66 → -1.34 | L0 | L0 |
| painted_table_cell_text_baselines | text "13010-111, Brasil" in body>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(2)>p:nth-child(6) | overshoot | dy | 0.94 → -1.06 | L0 | L0 |
| painted_table_cell_text_baselines | text "CNPJ 98.765.432/0001-21" in body>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(2)>p:nth-child(7) | worsened | dy | 0.58 → -1.42 | L0 | L0 |
| auto_table_compact_columns | enter (x/y/width) body>table:nth-child(3)>thead:nth-child(1)>tr:nth-child(1)>th:nth-child(3) | worsened | dw | 1.58 → -3.34 | N0 | auto_table_compact_columns |
| auto_table_compact_columns | text "TOTAL" in body>table:nth-child(3)>thead:nth-child(1)>tr:nth-child(1)>th:nth-child(4) | overshoot | dx | -3.34 → 3.65 | L0 | L0 |
| auto_table_compact_columns | enter (x/y/width) body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(1)>td:nth-child(3) | worsened | dw | 1.58 → -3.34 | N0 | auto_table_compact_columns |
| auto_table_compact_columns | text "R$ 1.300,00" in body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(1)>td:nth-child(4) | overshoot | dx | -3.36 → 3.64 | L0 | L0 |
| auto_table_compact_columns | enter (x/y/width) body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(2)>td:nth-child(3) | worsened | dw | 1.58 → -3.34 | N0 | N0 |
| auto_table_compact_columns | text "R$ 472,50" in body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(2)>td:nth-child(4) | overshoot | dx | -3.36 → 3.63 | L0 | L0 |
| auto_table_compact_columns | enter (x/y/width) body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(3)>td:nth-child(3) | worsened | dw | 1.58 → -3.34 | N0 | N0 |
| auto_table_compact_columns | text "R$ 175,50" in body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(3)>td:nth-child(4) | overshoot | dx | -3.36 → 3.63 | L0 | L0 |
| auto_table_compact_columns | enter (x/y/width) body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(4)>td:nth-child(3) | worsened | dw | 1.58 → -3.34 | N0 | N0 |
| auto_table_compact_columns | text "R$ 2.832,00" in body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(4)>td:nth-child(4) | overshoot | dx | -3.36 → 3.64 | L0 | L0 |
| auto_table_compact_columns | enter (x/y/width) body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(5)>td:nth-child(3) | worsened | dw | 1.58 → -3.34 | N0 | N0 |
| auto_table_compact_columns | text "R$ 768,00" in body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(5)>td:nth-child(4) | overshoot | dx | -3.36 → 3.63 | L0 | L0 |
| collapsed_table_medium_border_insets_x | enter (x/y/width) body>table:nth-child(1)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(2) | worsened | dw | 5.47 → 8.06 | N0 | N0 |
| collapsed_table_medium_border_insets_x | text "EM ABERTO" in body>table:nth-child(1)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(2)>div:nth-child(2)>div:nth-child(4)>span:nth-child(1) | overshoot | dx | -1.69 → 1.31 | L0 | collapsed_table_medium_border_insets |
| collapsed_table_medium_border_insets_x | enter (x/y/width) body>table:nth-child(3)>thead:nth-child(1)>tr:nth-child(1)>th:nth-child(2) | worsened | dx | -11.08 → -14.08 | N0 | N0 |
| collapsed_table_medium_border_insets_x | enter (x/y/width) body>table:nth-child(3)>thead:nth-child(1)>tr:nth-child(1)>th:nth-child(4) | worsened | dx | 0.01 → -2.99 | N0 | N0 |
| collapsed_table_medium_border_insets_x | enter (x/y/width) body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(1)>td:nth-child(2) | worsened | dx | -11.08 → -14.08 | N0 | N0 |
| collapsed_table_medium_border_insets_x | enter (x/y/width) body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(1)>td:nth-child(4) | worsened | dx | 0.01 → -2.99 | N0 | N0 |
| collapsed_table_medium_border_insets_x | enter (x/y/width) body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(2)>td:nth-child(2) | worsened | dx | -11.08 → -14.08 | N0 | N0 |
| collapsed_table_medium_border_insets_x | enter (x/y/width) body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(2)>td:nth-child(4) | worsened | dx | 0.01 → -2.99 | N0 | N0 |
| collapsed_table_medium_border_insets_x | enter (x/y/width) body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(3)>td:nth-child(2) | worsened | dx | -11.08 → -14.08 | N0 | N0 |
| collapsed_table_medium_border_insets_x | enter (x/y/width) body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(3)>td:nth-child(4) | worsened | dx | 0.01 → -2.99 | N0 | N0 |
| collapsed_table_medium_border_insets_x | enter (x/y/width) body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(4)>td:nth-child(2) | worsened | dx | -11.08 → -14.08 | N0 | N0 |
| collapsed_table_medium_border_insets_x | enter (x/y/width) body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(4)>td:nth-child(4) | worsened | dx | 0.01 → -2.99 | N0 | N0 |

## First divergence per layer

The first event over tolerance (or lost) IN each layer. After the document's natural first divergence every layer usually repeats the same event; use `Regressions by layer` for what each layer changed.

| layer | first box | box Δ | first text | text Δ (dx, dy) |
| --- | --- | --- | --- | --- |
| N0 | enter (x/y/width) body>table:nth-child(1)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(1) | 3, 3, -14.47 | n/a (no text in Blitz trees) |  |
| B0 | enter (x/y/width) body>table:nth-child(1)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(1) | 3, 3, -14.47 | n/a (no text in Blitz trees) |  |
| L0 | enter (x/y/width) body>table:nth-child(1)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(1) | 3, 3, -14.47 | text "Acme Widgets LON" in body>table:nth-child(1)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(1)>div:nth-child(2) | 3, -2.53 |
| vertical_margin_collapse | enter (x/y/width) body>table:nth-child(1)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(1) | 3, 3, -14.47 | text "Acme Widgets LON" in body>table:nth-child(1)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(1)>div:nth-child(2) | 3, -2.53 |
| collapsed_table_medium_border_insets | enter (x/y/width) body>table:nth-child(1)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(1) | 3, 0, -14.47 | text "Acme Widgets LON" in body>table:nth-child(1)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(1)>div:nth-child(2) | 3, -5.53 |
| painted_table_cell_text_baselines | enter (x/y/width) body>table:nth-child(1)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(1) | 3, 0, -14.47 | text "Acme Widgets LON" in body>table:nth-child(1)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(1)>div:nth-child(2) | 3, -5.53 |
| fixed_table_widths | enter (x/y/width) body>table:nth-child(1)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(1) | 3, 0, -14.47 | text "Acme Widgets LON" in body>table:nth-child(1)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(1)>div:nth-child(2) | 3, -5.53 |
| table_percent_widths | enter (x/y/width) body>table:nth-child(1)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(1) | 3, 0, -14.47 | text "Acme Widgets LON" in body>table:nth-child(1)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(1)>div:nth-child(2) | 3, -5.53 |
| auto_table_compact_columns | enter (x/y/width) body>table:nth-child(1)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(1) | 3, 0, -14.47 | text "Acme Widgets LON" in body>table:nth-child(1)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(1)>div:nth-child(2) | 3, -5.53 |
| collapsed_table_medium_border_insets_x | enter (x/y/width) body>table:nth-child(1)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(1) | 0, 0, -11.09 | text "Acme Widgets LON" in body>table:nth-child(1)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(1)>div:nth-child(2) | 0, -5.53 |

## Per-layer error and layer effects

`moved` = boxes/runs whose geometry this layer changed vs the previous one; `better`/`worse` = max |Δ| per item moved closer to / further from Chromium; `Σ` = summed change of that max |Δ| (a few large improvements can make it negative while one box regresses); `regressed` = items this layer worsened or overshot on some coordinate by more than tolerance (classifyStep), NAMED: the first three in document order (boxes that only absorbed or followed a regressed box's change rank last) and the largest.

| layer | box events diverged | text events diverged | mean abs box Δ (px) | boxes moved/better/worse (Σ) | boxes regressed (largest) | runs moved/better/worse (Σ) | runs regressed (largest) |
| --- | --- | --- | --- | --- | --- | --- | --- |
| N0 | 313 | n/a | 61.51 |  |  |  |  |
| B0 | 313 | n/a | 61.51 | 0/0/0 (0) | 0 | 0/0/0 (0) | 0 |
| L0 | 313 | 210 | 61.51 | 0/0/0 (0) | 0 | 0/0/0 (0) | 0 |
| vertical_margin_collapse | 313 | 210 | 61.51 | 0/0/0 (0) | 0 | 0/0/0 (0) | 0 |
| collapsed_table_medium_border_insets | 310 | 210 | 54.28 | 218/181/0 (-1591.3) | 3: body>table:nth-child(1)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(1)>div:nth-child(2) dy -2.53→-5.53; body>table:nth-child(1)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(1)>p:nth-child(3) dy -2.33→-5.33; body>table:nth-child(1)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(2)>div:nth-child(2)>div:nth-child(4)>span:nth-child(1) overshoot dy 1.7→-1.3 | 210/206/2 (-1786.04) | 2: "Acme Widgets LON" dy -2.53→-5.53; "Soluções industriais" dy -2.33→-5.33 |
| painted_table_cell_text_baselines | 310 | 210 | 54.28 | 0/0/0 (0) | 0 | 190/167/3 (-330.22) | 12: "EMITENTE" overshoot dy 0.86→-1.14; "Acme Widgets LON" overshoot dy 0.89→-1.11; "Rua das Flores, 123 " overshoot dy 1.02→-0.98 |
| fixed_table_widths | 310 | 210 | 54.28 | 0/0/0 (0) | 0 | 0/0/0 (0) | 0 |
| table_percent_widths | 310 | 210 | 54.28 | 0/0/0 (0) | 0 | 0/0/0 (0) | 0 |
| auto_table_compact_columns | 310 | 210 | 52.81 | 140/27/0 (-323.73) | 35: body>table:nth-child(3)>thead:nth-child(1)>tr:nth-child(1)>th:nth-child(3) dw 1.58→-3.34; body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(1)>td:nth-child(3) dw 1.58→-3.34; body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(2)>td:nth-child(3) dw 1.58→-3.34 | 105/9/1 (-56.74) | 35: "TOTAL" overshoot dx -3.34→3.65; "R$ 1.300,00" overshoot dx -3.36→3.64; "R$ 472,50" overshoot dx -3.36→3.63 |
| collapsed_table_medium_border_insets_x | 309 | 202 | 52.77 | 194/11/0 (-9.54) | 71: body>table:nth-child(1)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(2) dw 5.47→8.06; body>table:nth-child(3)>thead:nth-child(1)>tr:nth-child(1)>th:nth-child(2) dx -11.08→-14.08; body>table:nth-child(3)>thead:nth-child(1)>tr:nth-child(1)>th:nth-child(4) dx 0.01→-2.99 | 192/14/0 (-27.75) | 1: "EM ABERTO" overshoot dx -1.69→1.31 |

## Top 20 box divergences in collapsed_table_medium_border_insets_x (absolute)

| path | dx | dy | dw | dh | regressed by | first over tol. | dominant (step) | steps |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| html | 0 | 0 | 0 | 132.55 | N0 dh 0→132.55 (first layer) | N0 | N0 (dh +132.55) | N0 dh +132.55 |
| body | 0 | 0 | 0 | 132.55 | N0 dh 0→132.55 (first layer) | N0 | N0 (dh +132.55) | N0 dh +132.55 |
| body>div:nth-child(5)>p:nth-child(2) | 0 | 114.72 | 0 | -0.78 | N0 dy 0→132.72 (first layer) | N0 | N0 (dy +132.72) | N0 dy +132.72; collapsed_table_medium_border_insets dy -18 |
| body>div:nth-child(5) | 0 | 114.22 | 0 | 0.33 | N0 dy 0→132.22 (first layer) | N0 | N0 (dy +132.22) | N0 dy +132.22; collapsed_table_medium_border_insets dy -18 |
| body>div:nth-child(5)>h3:nth-child(1) | 0 | 114.11 | 0 | 0.61 | N0 dy 0→132.11 (first layer) | N0 | N0 (dy +132.11) | N0 dy +132.11; collapsed_table_medium_border_insets dy -18 |
| body>div:nth-child(5)>p:nth-child(3) | 0 | 113.94 | 0 | 0.61 | N0 dy 0→131.94 (first layer) | N0 | N0 (dy +131.94) | N0 dy +131.94; collapsed_table_medium_border_insets dy -18 |
| body>table:nth-child(4)>tbody:nth-child(1)>tr:nth-child(4)>td:nth-child(1) | -0.44 | 113.81 | -1.56 | 0.19 | N0 dy 0→128.81 (first layer) | N0 | N0 (dy +128.81) | N0 dy +128.81; collapsed_table_medium_border_insets dy -15; collapsed_table_medium_border_insets_x dx -3 |
| body>table:nth-child(4)>tbody:nth-child(1)>tr:nth-child(4)>td:nth-child(2) | 1.07 | 113.81 | -1.07 | 0.19 | N0 dy 0→128.81 (first layer) | N0 | N0 (dy +128.81) | N0 dy +128.81; collapsed_table_medium_border_insets dy -15; collapsed_table_medium_border_insets_x dw +2.94 |
| body>table:nth-child(4)>tbody:nth-child(1)>tr:nth-child(3)>td:nth-child(1) | -0.44 | 111.22 | -1.56 | -0.41 | N0 dy 0→126.22 (first layer) | N0 | N0 (dy +126.22) | N0 dy +126.22; collapsed_table_medium_border_insets dy -15; collapsed_table_medium_border_insets_x dx -3 |
| body>table:nth-child(4)>tbody:nth-child(1)>tr:nth-child(3)>td:nth-child(2) | 1.07 | 111.22 | -1.07 | -0.41 | N0 dy 0→126.22 (first layer) | N0 | N0 (dy +126.22) | N0 dy +126.22; collapsed_table_medium_border_insets dy -15; collapsed_table_medium_border_insets_x dw +2.94 |
| body>table:nth-child(4)>tbody:nth-child(1)>tr:nth-child(2)>td:nth-child(1) | -0.44 | 108.13 | -1.56 | 0.09 | N0 dy 0→123.13 (first layer) | N0 | N0 (dy +123.13) | N0 dy +123.13; collapsed_table_medium_border_insets dy -15; collapsed_table_medium_border_insets_x dx -3 |
| body>table:nth-child(4)>tbody:nth-child(1)>tr:nth-child(2)>td:nth-child(2) | 1.07 | 108.13 | -1.07 | 0.09 | N0 dy 0→123.13 (first layer) | N0 | N0 (dy +123.13) | N0 dy +123.13; collapsed_table_medium_border_insets dy -15; collapsed_table_medium_border_insets_x dw +2.94 |
| body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(34)>td:nth-child(1) | 0 | 105.17 | -14.08 | 0.59 | N0 dy 0→114.17 (first layer) | N0 | N0 (dy +114.17) | N0 dy +114.17; collapsed_table_medium_border_insets dy -9; auto_table_compact_columns dw +22.67; collapsed_table_medium_border_insets_x dx -3 |
| body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(34)>td:nth-child(2) | -14.08 | 105.17 | 14.44 | 0.59 | N0 dy 0→114.17 (first layer); collapsed_table_medium_border_insets_x dx -11.08→-14.08 | N0 | N0 (dy +114.17) | N0 dy +114.17; collapsed_table_medium_border_insets dy -9; auto_table_compact_columns dx +19.67; collapsed_table_medium_border_insets_x dx -3 |
| body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(34)>td:nth-child(3) | 0.36 | 105.17 | -3.34 | 0.59 | N0 dy 0→114.17 (first layer); auto_table_compact_columns dw 1.58→-3.34 | N0 | N0 (dy +114.17) | N0 dy +114.17; collapsed_table_medium_border_insets dy -9; auto_table_compact_columns dx +14.92; collapsed_table_medium_border_insets_x dx -3 |
| body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(34)>td:nth-child(4) | -2.99 | 105.17 | -3.01 | 0.59 | N0 dy 0→114.17 (first layer); collapsed_table_medium_border_insets_x dx 0.01→-2.99 | N0 | N0 (dy +114.17) | N0 dy +114.17; collapsed_table_medium_border_insets dy -9; auto_table_compact_columns dx +7; collapsed_table_medium_border_insets_x dx -3 |
| body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(34)>td:nth-child(1)>span:nth-child(1) | -0.33 | 105.05 | -36.09 | 0.53 | N0 dy 0→114.05 (first layer) | N0 | N0 (dy +114.05) | N0 dy +114.05; collapsed_table_medium_border_insets dy -9; collapsed_table_medium_border_insets_x dx -3 |
| body>table:nth-child(4) | -0.44 | 105.03 | 0.44 | 8.97 | N0 dy 0→117.03 (first layer) | N0 | N0 (dy +117.03) | N0 dy +117.03; collapsed_table_medium_border_insets dy -12 |
| body>table:nth-child(4)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(1) | -0.44 | 105.03 | -1.56 | 0.09 | N0 dy 0→120.03 (first layer) | N0 | N0 (dy +120.03) | N0 dy +120.03; collapsed_table_medium_border_insets dy -15; collapsed_table_medium_border_insets_x dx -3 |
| body>table:nth-child(4)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(2) | 1.07 | 105.03 | -1.07 | 0.09 | N0 dy 0→120.03 (first layer) | N0 | N0 (dy +120.03) | N0 dy +120.03; collapsed_table_medium_border_insets dy -15; collapsed_table_medium_border_insets_x dw +2.94 |

## Top 20 LOCAL box divergences

rdx/rdy = the error a box ADDS to what it inherits: after a previous compared sibling in the same row, relative to that sibling's right edge (dx+dw) and dy; after a stacked sibling, relative to its bottom edge (dy+dh); a first child, relative to its parent's dx/dy. Isolates where cumulative drift originates.

| path | rdx | rdy | dw | dh | regressed by | first over tol. | dominant (step) |
| --- | --- | --- | --- | --- | --- | --- | --- |
| html | 0 | 0 | 0 | 132.55 | N0 dh 0→132.55 (first layer) | N0 | N0 (dh +132.55) |
| body | 0 | 0 | 0 | 132.55 | N0 dh 0→132.55 (first layer) | N0 | N0 (dh +132.55) |
| body>table:nth-child(3) | 0 | -0.02 | 0 | 103.17 | N0 dh 0→109.17 (first layer) | N0 | N0 (dh +109.17) |
| body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(1)>td:nth-child(1)>span:nth-child(1) | -0.33 | 0.38 | -36.09 | -0.47 | N0 dw 0→-36.09 (first layer) | N0 | N0 (dw -36.09) |
| body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(2)>td:nth-child(1)>span:nth-child(1) | -0.33 | -0.12 | -36.09 | 0.53 | N0 dw 0→-36.09 (first layer) | N0 | N0 (dw -36.09) |
| body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(3)>td:nth-child(1)>span:nth-child(1) | -0.33 | -0.12 | -36.09 | -0.47 | N0 dw 0→-36.09 (first layer) | N0 | N0 (dw -36.09) |
| body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(4)>td:nth-child(1)>span:nth-child(1) | -0.33 | -0.12 | -36.09 | 0.53 | N0 dw 0→-36.09 (first layer) | N0 | N0 (dw -36.09) |
| body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(5)>td:nth-child(1)>span:nth-child(1) | -0.33 | -0.12 | -36.09 | -0.47 | N0 dw 0→-36.09 (first layer) | N0 | N0 (dw -36.09) |
| body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(6)>td:nth-child(1)>span:nth-child(1) | -0.33 | -0.12 | -36.09 | -0.47 | N0 dw 0→-36.09 (first layer) | N0 | N0 (dw -36.09) |
| body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(7)>td:nth-child(1)>span:nth-child(1) | -0.33 | -0.12 | -36.09 | 0.53 | N0 dw 0→-36.09 (first layer) | N0 | N0 (dw -36.09) |
| body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(8)>td:nth-child(1)>span:nth-child(1) | -0.33 | -0.12 | -36.09 | -0.47 | N0 dw 0→-36.09 (first layer) | N0 | N0 (dw -36.09) |
| body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(9)>td:nth-child(1)>span:nth-child(1) | -0.33 | -0.12 | -36.09 | 0.53 | N0 dy 0→38.2 (first layer) | N0 | N0 (dy +38.2) |
| body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(10)>td:nth-child(1)>span:nth-child(1) | -0.33 | -0.12 | -36.09 | -0.47 | N0 dy 0→41.8 (first layer) | N0 | N0 (dy +41.8) |
| body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(11)>td:nth-child(1)>span:nth-child(1) | -0.33 | -0.12 | -36.09 | 0.53 | N0 dy 0→44.39 (first layer) | N0 | N0 (dy +44.39) |
| body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(12)>td:nth-child(1)>span:nth-child(1) | -0.33 | -0.12 | -36.09 | -0.47 | N0 dy 0→47.98 (first layer) | N0 | N0 (dy +47.98) |
| body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(13)>td:nth-child(1)>span:nth-child(1) | -0.33 | -0.12 | -36.09 | -0.47 | N0 dy 0→50.58 (first layer) | N0 | N0 (dy +50.58) |
| body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(14)>td:nth-child(1)>span:nth-child(1) | -0.33 | -0.12 | -36.09 | 0.53 | N0 dy 0→54.17 (first layer) | N0 | N0 (dy +54.17) |
| body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(15)>td:nth-child(1)>span:nth-child(1) | -0.33 | -0.12 | -36.09 | -0.47 | N0 dy 0→56.77 (first layer) | N0 | N0 (dy +56.77) |
| body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(16)>td:nth-child(1)>span:nth-child(1) | -0.33 | -0.12 | -36.09 | 0.53 | N0 dy 0→60.36 (first layer) | N0 | N0 (dy +60.36) |
| body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(17)>td:nth-child(1)>span:nth-child(1) | -0.33 | -0.12 | -36.09 | -0.47 | N0 dy 0→62.95 (first layer) | N0 | N0 (dy +62.95) |

## Top 20 text-run divergences in collapsed_table_medium_border_insets_x

| owner | text | dx | dy | dw | dright | faces | regressed by | first over tol. | dominant (step) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| body>div:nth-child(5)>p:nth-child(2) | Pagamento via transferência para a conta Banc... | 0 | 114.72 | 3.33 | 3.33 | LiberationSans-Regular.ttf | L0 dy 0→132.72 (first layer) | L0 | L0 (dy +132.72) |
| body>div:nth-child(5)>p:nth-child(2) | fatura INV-2026-00417 no campo de identificação. | 0 | 114.33 | -0.01 | -0.01 | LiberationSans-Regular.ttf | L0 dy 0→132.33 (first layer) | L0 | L0 (dy +132.33) |
| body>div:nth-child(5)>h3:nth-child(1) | INSTRUÇÕES DE PAGAMENTO | 0 | 114.11 | -0.01 | -0.01 | LiberationSans-Bold.ttf | L0 dy 0→132.11 (first layer) | L0 | L0 (dy +132.11) |
| body>div:nth-child(5)>p:nth-child(3) | Em caso de divergência nos itens, entre em co... | 0 | 113.94 | 0 | 0 | LiberationSans-Regular.ttf | L0 dy 0→131.94 (first layer) | L0 | L0 (dy +131.94) |
| body>table:nth-child(4)>tbody:nth-child(1)>tr:nth-child(3)>td:nth-child(1) | Imposto (8%) | -1.58 | 111.42 | 0.02 | -1.56 | LiberationSans-Regular.ttf | L0 dy 0→126.42 (first layer) | L0 | L0 (dy +126.42) |
| body>table:nth-child(4)>tbody:nth-child(1)>tr:nth-child(3)>td:nth-child(2) | R$ 3.757,40 | 0.43 | 111.42 | 0.01 | 0.43 | LiberationSans-Regular.ttf | L0 dy 0→126.42 (first layer) | L0 | L0 (dy +126.42) |
| body>table:nth-child(4)>tbody:nth-child(1)>tr:nth-child(4)>td:nth-child(1) | Total a pagar | -1.56 | 110.98 | 0 | -1.56 | LiberationSans-Bold.ttf | L0 dy 0→127.98 (first layer) | L0 | L0 (dy +127.98) |
| body>table:nth-child(4)>tbody:nth-child(1)>tr:nth-child(4)>td:nth-child(2) | R$ 50.724,90 | 0.43 | 110.98 | 0 | 0.43 | LiberationSans-Bold.ttf | L0 dy 0→127.98 (first layer) | L0 | L0 (dy +127.98) |
| body>table:nth-child(4)>tbody:nth-child(1)>tr:nth-child(2)>td:nth-child(1) | Desconto | -1.56 | 108.33 | 0 | -1.56 | LiberationSans-Regular.ttf | L0 dy 0→123.33 (first layer) | L0 | L0 (dy +123.33) |
| body>table:nth-child(4)>tbody:nth-child(1)>tr:nth-child(2)>td:nth-child(2) | - R$ 1.250,00 | 0.42 | 108.33 | 0.01 | 0.43 | LiberationSans-Regular.ttf | L0 dy 0→123.33 (first layer) | L0 | L0 (dy +123.33) |
| body>table:nth-child(4)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(1) | Subtotal | -1.56 | 105.23 | 0 | -1.56 | LiberationSans-Regular.ttf | L0 dy 0→120.23 (first layer) | L0 | L0 (dy +120.23) |
| body>table:nth-child(4)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(2) | R$ 48.217,50 | 0.42 | 105.23 | 0.02 | 0.43 | LiberationSans-Regular.ttf | L0 dy 0→120.23 (first layer) | L0 | L0 (dy +120.23) |
| body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(34)>td:nth-child(2) | 2 | 1.76 | 103.36 | -0.01 | 1.76 | LiberationSans-Regular.ttf | L0 dy 0→114.36 (first layer) | L0 | L0 (dy +114.36) |
| body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(34)>td:nth-child(3) | R$ 1.450,00 | 1.58 | 103.36 | 0.01 | 1.58 | LiberationSans-Regular.ttf | L0 dy 0→114.36 (first layer) | L0 | L0 (dy +114.36) |
| body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(34)>td:nth-child(4) | R$ 2.900,00 | 0.64 | 103.36 | 0.01 | 0.65 | LiberationSans-Regular.ttf | L0 dy 0→114.36 (first layer); auto_table_compact_columns overshoot dx -3.36→3.64 | L0 | L0 (dy +114.36) |
| body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(34)>td:nth-child(1)>span:nth-child(1) | SKU SV-TRN-8 | -0.33 | 103.05 | 0.04 | -0.29 | LiberationSans-Regular.ttf | L0 dy 0→114.05 (first layer) | L0 | L0 (dy +114.05) |
| body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(34)>td:nth-child(1) | Treinamento operacional (turma 8h) | -0.33 | 102.36 | 0.04 | -0.28 | LiberationSans-Regular.ttf | L0 dy 0→113.36 (first layer) | L0 | L0 (dy +113.36) |
| body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(33)>td:nth-child(1)>span:nth-child(1) | SKU SV-INST | -0.33 | 100.45 | 0.03 | -0.3 | LiberationSans-Regular.ttf | L0 dy 0→111.45 (first layer) | L0 | L0 (dy +111.45) |
| body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(33)>td:nth-child(1) | Serviço de instalação e comissionamento | -0.33 | 99.77 | 0.05 | -0.28 | LiberationSans-Regular.ttf | L0 dy 0→110.77 (first layer) | L0 | L0 (dy +110.77) |
| body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(33)>td:nth-child(2) | 1 | 1.76 | 99.77 | -0.01 | 1.76 | LiberationSans-Regular.ttf | L0 dy 0→110.77 (first layer) | L0 | L0 (dy +110.77) |

## Top 20 LOCAL text-run divergences

rdx/rdy = the run's Δ minus its owner box's dx/dy (final layer), so runs that only ride along with a shifted owner rank low (de-duplicates cascades, like the local box table).

| owner | text | rdx | rdy | dx | dy | regressed by | first over tol. | dominant (step) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| body>table:nth-child(3)>thead:nth-child(1)>tr:nth-child(1)>th:nth-child(2) | QTD. | 15.85 | -1.81 | 1.76 | 0.28 | L0 dx 0→-14.9 (first layer) | L0 | auto_table_compact_columns (dx +19.67) |
| body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(11)>td:nth-child(2) | 8 | 15.85 | -2.81 | 1.76 | 32.7 | L0 dy 0→43.7 (first layer) | L0 | L0 (dy +43.7) |
| body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(13)>td:nth-child(2) | 6 | 15.85 | -1.81 | 1.76 | 39.89 | L0 dy 0→50.89 (first layer) | L0 | L0 (dy +50.89) |
| body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(17)>td:nth-child(2) | 5 | 15.85 | -2.81 | 1.76 | 51.27 | L0 dy 0→62.27 (first layer) | L0 | L0 (dy +62.27) |
| body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(29)>td:nth-child(2) | 8 | 15.85 | -1.81 | 1.76 | 88.39 | L0 dy 0→99.39 (first layer) | L0 | L0 (dy +99.39) |
| body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(32)>td:nth-child(2) | 5 | 15.85 | -2.81 | 1.76 | 96.17 | L0 dy 0→107.17 (first layer) | L0 | L0 (dy +107.17) |
| body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(33)>td:nth-child(2) | 1 | 15.85 | -2.81 | 1.76 | 99.77 | L0 dy 0→110.77 (first layer) | L0 | L0 (dy +110.77) |
| body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(34)>td:nth-child(2) | 2 | 15.85 | -1.81 | 1.76 | 103.36 | L0 dy 0→114.36 (first layer) | L0 | L0 (dy +114.36) |
| body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(5)>td:nth-child(2) | 120 | 15.84 | -2.81 | 1.76 | 15.14 | L0 dy 0→26.14 (first layer) | L0 | L0 (dy +26.14) |
| body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(1)>td:nth-child(2) | 40 | 15.84 | -1.31 | 1.75 | 3.77 | L0 dx 0→-14.91 (first layer) | L0 | auto_table_compact_columns (dx +19.67) |
| body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(2)>td:nth-child(2) | 25 | 15.84 | -2.81 | 1.75 | 5.36 | L0 dy 0→16.36 (first layer) | L0 | auto_table_compact_columns (dx +19.67) |
| body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(3)>td:nth-child(2) | 18 | 15.84 | -2.81 | 1.75 | 8.95 | L0 dy 0→19.95 (first layer) | L0 | L0 (dy +19.95) |
| body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(4)>td:nth-child(2) | 60 | 15.84 | -2.81 | 1.75 | 11.55 | L0 dy 0→22.55 (first layer) | L0 | L0 (dy +22.55) |
| body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(6)>td:nth-child(2) | 30 | 15.84 | -1.81 | 1.75 | 18.73 | L0 dy 0→29.73 (first layer) | L0 | L0 (dy +29.73) |
| body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(7)>td:nth-child(2) | 22 | 15.84 | -2.81 | 1.75 | 21.33 | L0 dy 0→32.33 (first layer) | L0 | L0 (dy +32.33) |
| body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(8)>td:nth-child(2) | 44 | 15.84 | -1.81 | 1.75 | 24.92 | L0 dy 0→35.92 (first layer) | L0 | L0 (dy +35.92) |
| body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(9)>td:nth-child(2) | 12 | 15.84 | -2.81 | 1.75 | 26.52 | L0 dy 0→37.52 (first layer) | L0 | L0 (dy +37.52) |
| body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(10)>td:nth-child(2) | 24 | 15.84 | -2.81 | 1.75 | 30.11 | L0 dy 0→41.11 (first layer) | L0 | L0 (dy +41.11) |
| body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(12)>td:nth-child(2) | 10 | 15.84 | -2.81 | 1.75 | 36.3 | L0 dy 0→47.3 (first layer) | L0 | L0 (dy +47.3) |
| body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(14)>td:nth-child(2) | 30 | 15.84 | -2.81 | 1.75 | 42.48 | L0 dy 0→53.48 (first layer) | L0 | L0 (dy +53.48) |

## Margins (not part of the x/y/w/h attribution)

vellora margins are Blitz's resolved layout.margin as read by the walk (L0) and after the passes; Chromium values are COMPUTED margins of the element itself (not collapsed through descendants). Not part of the x/y/w/h attribution.

- boxes with vellora margins: 220; changed by the passes (L0 → final): 0
- differ from Chromium COMPUTED margins by > tolerance (L0): 3

| path | vellora L0 mt / mb | Chromium computed mt / mb |
| --- | --- | --- |
| body | 0 / 12 | 0 / 0 |
| body>table:nth-child(1)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(1)>img:nth-child(1) | 0 / 0 | 0 / 11.34 |
| body>div:nth-child(5) | 37.8 / 12 | 37.8 / 0 |


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
