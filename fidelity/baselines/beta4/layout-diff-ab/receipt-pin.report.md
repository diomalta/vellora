# Layout diff — receipt (pin)

> Continuous-flow comparison: Chromium lays the document out as ONE flow (no fragmentation) at the same viewport width vellora hands Blitz. It is comparable ONLY to vellora's PRE-pagination layers (N0, B0, L0, layout_normalize passes) and says nothing about pagination (page breaks, repeated thead, page-local offsets, margin boxes).

> **CHECKS FAILED (normalize_wrappers_located, normalize_dom_roundtrip, dom_key_alignment)** — SELF-CONSISTENCY FAILED: some DOM-path keys or dump records are wrong; results for the affected subtree are unreliable. See `Checks`.

Deltas are vellora − Chromium in CSS px. Paths abbreviate `html>body:nth-child(2)` as `body`.

## Environment

- date_utc: `2026-10-21T06:05:08Z`
- os: `darwin 27.0.0 arm64`
- cpu: `Apple M5 Pro`
- node: `v22.23.2`
- command: `node /Users/diomalta/Repositories/vellora/.claude/worktrees/wf_e3d702d1-528-15/fidelity/layout-diff/run.mjs --label pin --dump-repo fidelity/.cache/pin-src`
- repo: `/Users/diomalta/Repositories/vellora/.claude/worktrees/wf_e3d702d1-528-15/fidelity/.cache/pin-src`
- rustc: `rustc 1.96.0 (ac68faa20 2026-05-25)`
- git_commit: `2c66544f4c2a7bf44df6f25831a56ccf50d00e82`
- git_dirty: `clean`
- blitz: `blitz-0.3.0-alpha.5+2003ba5`
- chrome_path: `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`
- chrome_version: `Google Chrome 155.0.8059.85`
- templating_repo: `/Users/diomalta/Repositories/vellora/.claude/worktrees/wf_e3d702d1-528-15`
- chrome_user_agent: `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/155.0.0.0 Safari/537.36`
- crates: blitz-dom 0.3.0-alpha.5, blitz-html 0.3.0-alpha.5, blitz-traits 0.3.0-alpha.5, krilla 0.8.2, parley 0.10.0, stylo 0.18.0, taffy 0.11.0-experimental-cache-fix.3
- tools: puppeteer-core 25.15.0

## Checks (input parity, dump self-consistency, coverage)

| check | class | status | detail |
| --- | --- | --- | --- |
| viewport_width | input-parity | pass | Blitz viewport width 672 px; Chromium documentElement.clientWidth 672, innerWidth 672 |
| viewport_height | input-parity | pass | Blitz viewport height 1001 px; Chromium innerHeight 1001 |
| font_block_injected | input-parity | pass | browser HTML carries the bundled @font-face block (<style data-vellora-fidelity-fonts>) |
| bundled_fonts_loaded | input-parity | pass | vellora shaped with 2 bundled face(s); Chromium document.fonts loaded: Vellora Sans 400 normal; Vellora Sans 700 normal |
| platform_fonts_custom | input-parity | pass | CSS.getPlatformFontsForNode over 54 text-bearing elements: 0/953 glyphs rendered with SYSTEM fonts; vellora DejaVu fallback runs: 0 |
| source_html_layer | coverage | pass | N0 present: Blitz laid out the source HTML with html_normalize skipped; the N0 → B0 step is html_normalize's (DOM altered by html_normalize: YES) |
| normalize_wrappers_located | self-consistency | **FAIL** | html_normalize wrappers recorded 5, located in the Blitz DOM 4 — a wrapper did not survive Blitz's re-parse where it was inserted (e.g. a <div> inside <p> is hoisted out by the HTML parser); keys of later siblings shift |
| run_meta_alignment | self-consistency | pass | L0 boxes whose Parley runs could not be re-aligned to the walk: 0 |
| layer_order | self-consistency | pass | layers whose box sequence differs from L0: none |
| normalize_dom_roundtrip | self-consistency | **FAIL** | element keys of the source DOM (N0) vs html_normalize's output re-parsed by Blitz (B0, wrappers transparent): 87 common; only in source 2 (html>body:nth-child(2)>div:nth-child(1)>footer:nth-child(7); html>body:nth-child(2)>div:nth-child(1)>footer:nth-child(7)>br:nth-child(1)); only in normalized 4 (html>body:nth-child(2)>div:nth-child(1)>div:nth-child(7); html>body:nth-child(2)>div:nth-child(1)>p:nth-child(8); html>body:nth-child(2)>div:nth-child(1)>footer:nth-child(9); html>body:nth-child(2)>div:nth-child(1)>footer:nth-child(9)>br:nth-child(1)); same key, different tag/id/class 0 |
| source_dom_keys_vs_chromium | self-consistency | pass | element keys of Blitz's parse of the source HTML (N0) vs Chromium's DOM (head excluded): 89 common; only in vellora 0; only in Chromium 0; same key, different tag/id/class 0 |
| dom_key_alignment | self-consistency | **FAIL** | L0 boxes (vellora's render DOM) keyed only on the vellora side: 4 (html>body:nth-child(2)>div:nth-child(1)>div:nth-child(7); html>body:nth-child(2)>div:nth-child(1)>p:nth-child(8); html>body:nth-child(2)>div:nth-child(1)>footer:nth-child(9); html>body:nth-child(2)>div:nth-child(1)>footer:nth-child(9)>br:nth-child(1)); compared Chromium boxes whose path no vellora DOM node has: 1 (html>body:nth-child(2)>div:nth-child(1)>footer:nth-child(7)) |
| text_alignment | self-consistency | warn | matched 55 pairs; unmatched vellora runs 6, unmatched Chromium fragments 1, Chromium text with no vellora owner 4 |

## Input parity

- @page content box 672.3351 × 1001.6151 CSS px → Blitz viewport 672 × 1001 (`as u32` truncation in resolve_and_walk drops 0.3351 px of inline size; a KNOWN INPUT divergence vs Chromium print, not an engine difference). Chromium MEASURED: documentElement.clientWidth 672, innerWidth 672, innerHeight 1001 — MATCH.
- Media: Blitz evaluates stylesheets as `screen` (DocumentConfig::media_type default; build_document never sets it). Chromium emulates `print` (matchMedia('print') = true). Fixture contains @media rules: no (media type is inert here).
- Fonts: Chromium loaded Vellora Sans 400 normal; Vellora Sans 700 normal from the bundled files (sha256 in env.fonts_sha256). vellora runs by face: LiberationSans-Bold.ttf 18, LiberationSans-Regular.ttf 43. DejaVu fallback runs (no Chromium counterpart): 0.
- Baselines: Chromium ascent measured for 11/11 face/size specs.
- html_normalize: ALTERED the DOM (wrappers recorded 5, located in the Blitz DOM 4 — MISMATCH: a wrapper is not where it was recorded, later keys shift). N0 (Blitz on the source HTML) present: the N0 → B0 step is html_normalize's.
- Blitz anonymous blocks (B0 only): 0; anonymous inline roots holding text (text Blitz shaped that vellora's DOM-children walk never reads): 0.
- Dump self-checks: run-metadata misalignments 0, layer order violations 0 (both expected 0).
- Input sha256: native 8a9d9e7bc3c09124…, browser 8323253047079b30…

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

- **exit (height) body>div:nth-child(1)>header:nth-child(1)>address:nth-child(4)** (event #17)
- first over tolerance: **N0** — RAW BLITZ: Blitz's layout of the SOURCE HTML (N0) already differs from Chromium (but the UNROUNDED tree is within tolerance: Taffy round_layout)
- regressed by (which layer made it worse, per coordinate): **N0 dh 0→-0.56 (first layer)**
- dominant layer (largest step of the final Δ): N0 (dh -0.56); step decomposition (sums to the final Δ): N0 dh -0.56

| layer | status | dx | dy | dw | dh | dy basis |
| --- | --- | --- | --- | --- | --- | --- |
| N0 | diverged |  |  |  | -0.56 |  |
| B0 | diverged |  |  |  | -0.56 |  |
| L0 | diverged |  |  |  | -0.56 |  |
| vertical_margin_collapse | diverged |  |  |  | -0.56 |  |
| collapsed_table_medium_border_insets | diverged |  |  |  | -0.56 |  |
| painted_table_cell_text_baselines | diverged |  |  |  | -0.56 |  |
| fixed_table_widths | diverged |  |  |  | -0.56 |  |
| table_percent_widths | diverged |  |  |  | -0.56 |  |
| auto_table_compact_columns | diverged |  |  |  | -0.56 |  |
| collapsed_table_medium_border_insets_x | diverged |  |  |  | -0.56 |  |
| N0u | ok |  |  |  | 0.04 |  |
| B0u | ok |  |  |  | 0.04 |  |

Ancestor chain (compared boxes, root first; deltas = vellora − Chromium, CSS px):

| ancestor | collapsed_table_medium_border_insets_x dx,dy,dw,dh | N0 dx,dy,dw,dh | B0 dx,dy,dw,dh | L0 dx,dy,dw,dh |
| --- | --- | --- | --- | --- |
| html | 0, 0, 0, 88.44 | 0, 0, 0, 79.44 | 0, 0, 0, 88.44 | 0, 0, 0, 88.44 |
| body | 0, 0, 0, 88.44 | 0, 0, 0, 79.44 | 0, 0, 0, 88.44 | 0, 0, 0, 88.44 |
| body>div:nth-child(1) | -0.12, 0, 0.27, 88.44 | -0.12, 0, 0.27, 79.44 | -0.12, 0, 0.27, 88.44 | -0.12, 0, 0.27, 88.44 |
| body>div:nth-child(1)>header:nth-child(1) | -0.12, 0, 0.27, -0.34 | -0.12, 0, 0.27, -0.34 | -0.12, 0, 0.27, -0.34 | -0.12, 0, 0.27, -0.34 |

## First divergent text run in collapsed_table_medium_border_insets_x

- **text "CEP 01001-000" in body>div:nth-child(1)>header:nth-child(1)>address:nth-child(4)** (event #15)
- first over tolerance: **L0** — RAW BLITZ/PARLEY TEXT as read by vellora's walk (L0); no normalize pass involved
- regressed by (which layer made it worse, per coordinate): **L0 dy 0→0.67 (first layer)**
- dominant layer (largest step of the final Δ): L0 (dy +0.67); step decomposition (sums to the final Δ): L0 dy +0.67
- Chromium fragment: "CEP 01001-000" at x=128.13 y=190.33 w=85.19; vellora faces: LiberationSans-Regular.ttf

| layer | status | dx | dy | dw | dright | dy basis |
| --- | --- | --- | --- | --- | --- | --- |
| N0 | n/a |  |  |  |  |  |
| B0 | n/a |  |  |  |  |  |
| L0 | diverged | -0.12 | 0.67 | -0.01 | -0.13 | baseline |
| vertical_margin_collapse | diverged | -0.12 | 0.67 | -0.01 | -0.13 | baseline |
| collapsed_table_medium_border_insets | diverged | -0.12 | 0.67 | -0.01 | -0.13 | baseline |
| painted_table_cell_text_baselines | diverged | -0.12 | 0.67 | -0.01 | -0.13 | baseline |
| fixed_table_widths | diverged | -0.12 | 0.67 | -0.01 | -0.13 | baseline |
| table_percent_widths | diverged | -0.12 | 0.67 | -0.01 | -0.13 | baseline |
| auto_table_compact_columns | diverged | -0.12 | 0.67 | -0.01 | -0.13 | baseline |
| collapsed_table_medium_border_insets_x | diverged | -0.12 | 0.67 | -0.01 | -0.13 | baseline |

Ancestor chain (compared boxes, root first; deltas = vellora − Chromium, CSS px):

| ancestor | collapsed_table_medium_border_insets_x dx,dy,dw,dh | N0 dx,dy,dw,dh | B0 dx,dy,dw,dh | L0 dx,dy,dw,dh |
| --- | --- | --- | --- | --- |
| html | 0, 0, 0, 88.44 | 0, 0, 0, 79.44 | 0, 0, 0, 88.44 | 0, 0, 0, 88.44 |
| body | 0, 0, 0, 88.44 | 0, 0, 0, 79.44 | 0, 0, 0, 88.44 | 0, 0, 0, 88.44 |
| body>div:nth-child(1) | -0.12, 0, 0.27, 88.44 | -0.12, 0, 0.27, 79.44 | -0.12, 0, 0.27, 88.44 | -0.12, 0, 0.27, 88.44 |
| body>div:nth-child(1)>header:nth-child(1) | -0.12, 0, 0.27, -0.34 | -0.12, 0, 0.27, -0.34 | -0.12, 0, 0.27, -0.34 | -0.12, 0, 0.27, -0.34 |

## First box event a layout_normalize pass regressed

- **enter (x/y/width) body>div:nth-child(1)>table:nth-child(4)>thead:nth-child(1)>tr:nth-child(1)>th:nth-child(2)** (event #52)
- first over tolerance: **N0** — RAW BLITZ: Blitz's layout of the SOURCE HTML (N0) already differs from Chromium
- regressed by (which layer made it worse, per coordinate): **N0 dy 0→18.23 (first layer); collapsed_table_medium_border_insets_x dx -10.75→-13.75**
- dominant layer (largest step of the final Δ): N0 (dy +18.23); step decomposition (sums to the final Δ): N0 dy +18.23; collapsed_table_medium_border_insets dy -9; collapsed_table_medium_border_insets_x dx -3

| layer | status | dx | dy | dw | dh | dy basis |
| --- | --- | --- | --- | --- | --- | --- |
| N0 | diverged | -10.75 | 18.23 | -0.03 |  |  |
| B0 | diverged | -10.75 | 18.23 | -0.03 |  |  |
| L0 | diverged | -10.75 | 18.23 | -0.03 |  |  |
| vertical_margin_collapse | diverged | -10.75 | 18.23 | -0.03 |  |  |
| collapsed_table_medium_border_insets | diverged | -10.75 | 9.23 | -0.03 |  |  |
| painted_table_cell_text_baselines | diverged | -10.75 | 9.23 | -0.03 |  |  |
| fixed_table_widths | diverged | -10.75 | 9.23 | -0.03 |  |  |
| table_percent_widths | diverged | -10.75 | 9.23 | -0.03 |  |  |
| auto_table_compact_columns | diverged | -10.75 | 9.23 | -0.03 |  |  |
| collapsed_table_medium_border_insets_x | diverged | -13.75 | 9.23 | -0.03 |  |  |
| N0u | diverged | -10.23 | 18.29 | 0.09 |  |  |
| B0u | diverged | -10.23 | 18.29 | 0.09 |  |  |

Ancestor chain (compared boxes, root first; deltas = vellora − Chromium, CSS px):

| ancestor | collapsed_table_medium_border_insets_x dx,dy,dw,dh | N0 dx,dy,dw,dh | B0 dx,dy,dw,dh | L0 dx,dy,dw,dh |
| --- | --- | --- | --- | --- |
| html | 0, 0, 0, 88.44 | 0, 0, 0, 79.44 | 0, 0, 0, 88.44 | 0, 0, 0, 88.44 |
| body | 0, 0, 0, 88.44 | 0, 0, 0, 79.44 | 0, 0, 0, 88.44 | 0, 0, 0, 88.44 |
| body>div:nth-child(1) | -0.12, 0, 0.27, 88.44 | -0.12, 0, 0.27, 79.44 | -0.12, 0, 0.27, 88.44 | -0.12, 0, 0.27, 88.44 |
| body>div:nth-child(1)>table:nth-child(4) | -0.12, 9.23, 0.27, 42.64 | -0.12, 15.23, 0.27, 48.64 | -0.12, 15.23, 0.27, 48.64 | -0.12, 15.23, 0.27, 48.64 |

## First text run a layout_normalize pass regressed

- **text "REC-2026-000482" in body>div:nth-child(1)>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(2)** (event #24)
- first over tolerance: **L0** — RAW BLITZ/PARLEY TEXT as read by vellora's walk (L0); no normalize pass involved
- regressed by (which layer made it worse, per coordinate): **L0 dy 0→3.55 (first layer); table_percent_widths dx -2.88→-51.08**
- dominant layer (largest step of the final Δ): table_percent_widths (dx -48.2); step decomposition (sums to the final Δ): L0 dy +3.55; collapsed_table_medium_border_insets dy -3; table_percent_widths dx -48.2
- Chromium fragment: "REC-2026-000482" at x=438.28 y=290.45 w=105.58; vellora faces: LiberationSans-Bold.ttf

| layer | status | dx | dy | dw | dright | dy basis |
| --- | --- | --- | --- | --- | --- | --- |
| N0 | n/a |  |  |  |  |  |
| B0 | n/a |  |  |  |  |  |
| L0 | diverged | -2.88 | 3.55 | 0.05 | -2.84 | baseline |
| vertical_margin_collapse | diverged | -2.88 | 3.55 | 0.05 | -2.84 | baseline |
| collapsed_table_medium_border_insets | diverged | -2.88 | 0.55 | 0.05 | -2.84 | baseline |
| painted_table_cell_text_baselines | diverged | -2.88 | 0.55 | 0.05 | -2.84 | baseline |
| fixed_table_widths | diverged | -2.88 | 0.55 | 0.05 | -2.84 | baseline |
| table_percent_widths | diverged | -51.08 | 0.55 | 0.05 | -51.04 | baseline |
| auto_table_compact_columns | diverged | -51.08 | 0.55 | 0.05 | -51.04 | baseline |
| collapsed_table_medium_border_insets_x | diverged | -51.08 | 0.55 | 0.05 | -51.04 | baseline |

Ancestor chain (compared boxes, root first; deltas = vellora − Chromium, CSS px):

| ancestor | collapsed_table_medium_border_insets_x dx,dy,dw,dh | N0 dx,dy,dw,dh | B0 dx,dy,dw,dh | L0 dx,dy,dw,dh |
| --- | --- | --- | --- | --- |
| html | 0, 0, 0, 88.44 | 0, 0, 0, 79.44 | 0, 0, 0, 88.44 | 0, 0, 0, 88.44 |
| body | 0, 0, 0, 88.44 | 0, 0, 0, 79.44 | 0, 0, 0, 88.44 | 0, 0, 0, 88.44 |
| body>div:nth-child(1) | -0.12, 0, 0.27, 88.44 | -0.12, 0, 0.27, 79.44 | -0.12, 0, 0.27, 88.44 | -0.12, 0, 0.27, 88.44 |
| body>div:nth-child(1)>table:nth-child(2) | -0.12, 0.42, 0.27, 8.56 | -0.12, 0.42, 0.27, 14.56 | -0.12, 0.42, 0.27, 14.56 | -0.12, 0.42, 0.27, 14.56 |

## First box event vellora's walk (L0) regressed vs Blitz (B0)

None: L0 never worsened, overshot or lost a box event vs B0 by more than tolerance.

## First box event html_normalize regressed (B0 vs N0)

- **exit (height) body>div:nth-child(1)>p:nth-child(6)** (event #175)
- first over tolerance: **B0** — HTML_NORMALIZE: Blitz on the source HTML (N0) is ok, Blitz on html_normalize's output (B0) differs
- regressed by (which layer made it worse, per coordinate): **B0 dh -0.3→-46.3**
- dominant layer (largest step of the final Δ): B0 (dh -46); step decomposition (sums to the final Δ): N0 dh -0.3; B0 dh -46

| layer | status | dx | dy | dw | dh | dy basis |
| --- | --- | --- | --- | --- | --- | --- |
| N0 | ok |  |  |  | -0.3 |  |
| B0 | diverged |  |  |  | -46.3 |  |
| L0 | diverged |  |  |  | -46.3 |  |
| vertical_margin_collapse | diverged |  |  |  | -46.3 |  |
| collapsed_table_medium_border_insets | diverged |  |  |  | -46.3 |  |
| painted_table_cell_text_baselines | diverged |  |  |  | -46.3 |  |
| fixed_table_widths | diverged |  |  |  | -46.3 |  |
| table_percent_widths | diverged |  |  |  | -46.3 |  |
| auto_table_compact_columns | diverged |  |  |  | -46.3 |  |
| collapsed_table_medium_border_insets_x | diverged |  |  |  | -46.3 |  |
| N0u | ok |  |  |  | 0.06 |  |
| B0u | diverged |  |  |  | -46.16 |  |

Ancestor chain (compared boxes, root first; deltas = vellora − Chromium, CSS px):

| ancestor | collapsed_table_medium_border_insets_x dx,dy,dw,dh | N0 dx,dy,dw,dh | B0 dx,dy,dw,dh | L0 dx,dy,dw,dh |
| --- | --- | --- | --- | --- |
| html | 0, 0, 0, 88.44 | 0, 0, 0, 79.44 | 0, 0, 0, 88.44 | 0, 0, 0, 88.44 |
| body | 0, 0, 0, 88.44 | 0, 0, 0, 79.44 | 0, 0, 0, 88.44 | 0, 0, 0, 88.44 |
| body>div:nth-child(1) | -0.12, 0, 0.27, 88.44 | -0.12, 0, 0.27, 79.44 | -0.12, 0, 0.27, 88.44 | -0.12, 0, 0.27, 88.44 |

## Compared Chromium boxes with no vellora box (final layer)

1 box(es). A lost box counts as a divergence (first over tolerance / regressed by `LOST`) when an earlier layer had it, or when no vellora layer has it at all.

| path | tag | event | Chromium x,y,w,h | present in | lost at | counted |
| --- | --- | --- | --- | --- | --- | --- |
| body>div:nth-child(1)>footer:nth-child(7) | footer | #176 | 128.13, 1125.3, 415.73, 43.27 | N0, N0u | B0 | yes |

## Regressions by layer

Events each layer REGRESSED (worsened / overshoot by more than tolerance on any single checked coordinate, or lost the box) relative to the previous layer; for the first layer of the chain, vs Chromium (= already over tolerance). Independent of the first-over-tolerance label and of the headline, so a pass that worsens an already-divergent box, or any box after the first natural divergence, is listed here.

| layer | box events regressed (worsened/overshoot/lost) | text events regressed | first box regressed | largest box regression | first text regressed | largest text regression |
| --- | --- | --- | --- | --- | --- | --- |
| N0 | 77 (77/0/0) | n/a | exit (height) body>div:nth-child(1)>header:nth-child(1)>address:nth-child(4) (N0 dh 0→-0.56 (first layer)) | exit (height) body>div:nth-child(1) worsened dh 0→79.44 | — | — |
| B0 | 6 (4/0/2) | n/a | exit (height) body>div:nth-child(1)>p:nth-child(6) (B0 dh -0.3→-46.3) | exit (height) body>div:nth-child(1)>p:nth-child(6) worsened dh -0.3→-46.3 | — | — |
| L0 | 0 (50/0/0) | 50 | — | — | text "CEP 01001-000" in body>div:nth-child(1)>header:nth-child(1)>address:nth-child(4) (L0 dy 0→0.67 (first layer)) | text "Obrigado pela sua compra!" in body>div:nth-child(1)>p:nth-child(6)>span:nth-child(1) worsened dy 0→79.02 |
| vertical_margin_collapse | 0 (0/0/0) | 0 | — | — | — | — |
| collapsed_table_medium_border_insets | 0 (0/0/0) | 0 | — | — | — | — |
| painted_table_cell_text_baselines | 0 (0/0/0) | 0 | — | — | — | — |
| fixed_table_widths | 0 (0/0/0) | 0 | — | — | — | — |
| table_percent_widths | 0 (4/0/0) | 4 | — | — | text "REC-2026-000482" in body>div:nth-child(1)>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(2) (table_percent_widths dx -2.88→-51.08) | text "Joana Pereira" in body>div:nth-child(1)>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(3)>td:nth-child(2) worsened dx -2.88→-51.08 |
| auto_table_compact_columns | 0 (0/0/0) | 0 | — | — | — | — |
| collapsed_table_medium_border_insets_x | 22 (40/0/0) | 18 | enter (x/y/width) body>div:nth-child(1)>table:nth-child(4)>thead:nth-child(1)>tr:nth-child(1)>th:nth-child(2) (collapsed_table_medium_border_insets_x dx -10.75→-13.75) | enter (x/y/width) body>div:nth-child(1)>div:nth-child(5)>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(1) worsened dw 10.72→13.86 | text "QTD" in body>div:nth-child(1)>table:nth-child(4)>thead:nth-child(1)>tr:nth-child(1)>th:nth-child(2) (collapsed_table_medium_border_insets_x dx -11.23→-14.23) | text "QTD" in body>div:nth-child(1)>table:nth-child(4)>thead:nth-child(1)>tr:nth-child(1)>th:nth-child(2) worsened dx -11.23→-14.23 |

Events regressed by each layer after N0, in document order (first 12 per layer here, 40 in diff.json; N0 omitted: it is the list of items already over tolerance in the first layer):

| layer | event | kind | coord | from → to | first over tol. | dominant |
| --- | --- | --- | --- | --- | --- | --- |
| B0 | exit (height) body>div:nth-child(1)>p:nth-child(6) | worsened | dh | -0.3 → -46.3 | B0 | B0 |
| B0 | enter (x/y/width) body>div:nth-child(1)>footer:nth-child(7) | missing |  | box lost | N0 | N0 |
| B0 | exit (height) body>div:nth-child(1)>footer:nth-child(7) | missing |  | box lost | N0 | N0 |
| B0 | exit (height) body>div:nth-child(1) | worsened | dh | 79.44 → 88.44 | N0 | N0 |
| B0 | exit (height) body | worsened | dh | 79.44 → 88.44 | N0 | N0 |
| B0 | exit (height) html | worsened | dh | 79.44 → 88.44 | N0 | N0 |
| table_percent_widths | text "REC-2026-000482" in body>div:nth-child(1)>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(2) | worsened | dx | -2.88 → -51.08 | L0 | table_percent_widths |
| table_percent_widths | text "22/06/2026 14:37" in body>div:nth-child(1)>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(2)>td:nth-child(2) | worsened | dx | -2.88 → -51.08 | L0 | table_percent_widths |
| table_percent_widths | text "Joana Pereira" in body>div:nth-child(1)>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(3)>td:nth-child(2) | worsened | dx | -2.88 → -51.08 | L0 | table_percent_widths |
| table_percent_widths | text "Cliente Final (CUST-00042)" in body>div:nth-child(1)>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(4)>td:nth-child(2) | worsened | dx | -2.92 → -51.12 | L0 | table_percent_widths |
| collapsed_table_medium_border_insets_x | enter (x/y/width) body>div:nth-child(1)>table:nth-child(4)>thead:nth-child(1)>tr:nth-child(1)>th:nth-child(2) | worsened | dx | -10.75 → -13.75 | N0 | N0 |
| collapsed_table_medium_border_insets_x | text "QTD" in body>div:nth-child(1)>table:nth-child(4)>thead:nth-child(1)>tr:nth-child(1)>th:nth-child(2) | worsened | dx | -11.23 → -14.23 | L0 | L0 |
| collapsed_table_medium_border_insets_x | enter (x/y/width) body>div:nth-child(1)>table:nth-child(4)>thead:nth-child(1)>tr:nth-child(1)>th:nth-child(3) | worsened | dx | -6.78 → -9.78 | N0 | N0 |
| collapsed_table_medium_border_insets_x | text "UNITÁRIO" in body>div:nth-child(1)>table:nth-child(4)>thead:nth-child(1)>tr:nth-child(1)>th:nth-child(3) | worsened | dx | -6.59 → -9.59 | L0 | L0 |
| collapsed_table_medium_border_insets_x | enter (x/y/width) body>div:nth-child(1)>table:nth-child(4)>thead:nth-child(1)>tr:nth-child(1)>th:nth-child(4) | worsened | dx | -3.14 → -6.14 | N0 | N0 |
| collapsed_table_medium_border_insets_x | text "TOTAL" in body>div:nth-child(1)>table:nth-child(4)>thead:nth-child(1)>tr:nth-child(1)>th:nth-child(4) | worsened | dx | -3.3 → -6.3 | L0 | L0 |
| collapsed_table_medium_border_insets_x | enter (x/y/width) body>div:nth-child(1)>table:nth-child(4)>tbody:nth-child(2)>tr:nth-child(1)>td:nth-child(2) | worsened | dx | -10.75 → -13.75 | N0 | N0 |
| collapsed_table_medium_border_insets_x | text "2" in body>div:nth-child(1)>table:nth-child(4)>tbody:nth-child(2)>tr:nth-child(1)>td:nth-child(2) | worsened | dx | -11.23 → -14.23 | L0 | L0 |
| collapsed_table_medium_border_insets_x | enter (x/y/width) body>div:nth-child(1)>table:nth-child(4)>tbody:nth-child(2)>tr:nth-child(1)>td:nth-child(3) | worsened | dx | -6.78 → -9.78 | N0 | N0 |
| collapsed_table_medium_border_insets_x | text "R$ 9,50" in body>div:nth-child(1)>table:nth-child(4)>tbody:nth-child(2)>tr:nth-child(1)>td:nth-child(3) | worsened | dx | -6.6 → -9.6 | L0 | L0 |
| collapsed_table_medium_border_insets_x | enter (x/y/width) body>div:nth-child(1)>table:nth-child(4)>tbody:nth-child(2)>tr:nth-child(1)>td:nth-child(4) | worsened | dx | -3.14 → -6.14 | N0 | N0 |
| collapsed_table_medium_border_insets_x | text "R$ 19,00" in body>div:nth-child(1)>table:nth-child(4)>tbody:nth-child(2)>tr:nth-child(1)>td:nth-child(4) | worsened | dx | -3.34 → -6.34 | L0 | L0 |

## First divergence per layer

The first event over tolerance (or lost) IN each layer. After the document's natural first divergence every layer usually repeats the same event; use `Regressions by layer` for what each layer changed.

| layer | first box | box Δ | first text | text Δ (dx, dy) |
| --- | --- | --- | --- | --- |
| N0 | exit (height) body>div:nth-child(1)>header:nth-child(1)>address:nth-child(4) | -0.56 | n/a (no text in Blitz trees) |  |
| B0 | exit (height) body>div:nth-child(1)>header:nth-child(1)>address:nth-child(4) | -0.56 | n/a (no text in Blitz trees) |  |
| L0 | exit (height) body>div:nth-child(1)>header:nth-child(1)>address:nth-child(4) | -0.56 | text "CEP 01001-000" in body>div:nth-child(1)>header:nth-child(1)>address:nth-child(4) | -0.12, 0.67 |
| vertical_margin_collapse | exit (height) body>div:nth-child(1)>header:nth-child(1)>address:nth-child(4) | -0.56 | text "CEP 01001-000" in body>div:nth-child(1)>header:nth-child(1)>address:nth-child(4) | -0.12, 0.67 |
| collapsed_table_medium_border_insets | exit (height) body>div:nth-child(1)>header:nth-child(1)>address:nth-child(4) | -0.56 | text "CEP 01001-000" in body>div:nth-child(1)>header:nth-child(1)>address:nth-child(4) | -0.12, 0.67 |
| painted_table_cell_text_baselines | exit (height) body>div:nth-child(1)>header:nth-child(1)>address:nth-child(4) | -0.56 | text "CEP 01001-000" in body>div:nth-child(1)>header:nth-child(1)>address:nth-child(4) | -0.12, 0.67 |
| fixed_table_widths | exit (height) body>div:nth-child(1)>header:nth-child(1)>address:nth-child(4) | -0.56 | text "CEP 01001-000" in body>div:nth-child(1)>header:nth-child(1)>address:nth-child(4) | -0.12, 0.67 |
| table_percent_widths | exit (height) body>div:nth-child(1)>header:nth-child(1)>address:nth-child(4) | -0.56 | text "CEP 01001-000" in body>div:nth-child(1)>header:nth-child(1)>address:nth-child(4) | -0.12, 0.67 |
| auto_table_compact_columns | exit (height) body>div:nth-child(1)>header:nth-child(1)>address:nth-child(4) | -0.56 | text "CEP 01001-000" in body>div:nth-child(1)>header:nth-child(1)>address:nth-child(4) | -0.12, 0.67 |
| collapsed_table_medium_border_insets_x | exit (height) body>div:nth-child(1)>header:nth-child(1)>address:nth-child(4) | -0.56 | text "CEP 01001-000" in body>div:nth-child(1)>header:nth-child(1)>address:nth-child(4) | -0.12, 0.67 |

## Per-layer error and layer effects

`moved` = boxes/runs whose geometry this layer changed vs the previous one; `better`/`worse` = max |Δ| per item moved closer to / further from Chromium; `Σ` = summed change of that max |Δ| (a few large improvements can make it negative while one box regresses); `regressed` = items this layer worsened or overshot on some coordinate by more than tolerance (classifyStep), NAMED: the first three in document order (boxes that only absorbed or followed a regressed box's change rank last) and the largest.

| layer | box events diverged | text events diverged | mean abs box Δ (px) | boxes moved/better/worse (Σ) | boxes regressed (largest) | runs moved/better/worse (Σ) | runs regressed (largest) |
| --- | --- | --- | --- | --- | --- | --- | --- |
| N0 | 77 | n/a | 45.72 |  |  |  |  |
| B0 | 78 | n/a | 45.62 | 4/0/3 (27) | 4; 1 lost: body>div:nth-child(1) dh 79.44→88.44; body>div:nth-child(1)>p:nth-child(6) dh -0.3→-46.3; html dh 79.44→88.44 | 0/0/0 (0) | 0 |
| L0 | 78 | 50 | 45.62 | 0/0/0 (0) | 0 | 0/0/0 (0) | 0 |
| vertical_margin_collapse | 78 | 50 | 45.62 | 0/0/0 (0) | 0 | 0/0/0 (0) | 0 |
| collapsed_table_medium_border_insets | 78 | 50 | 38.63 | 54/46/0 (-433.81) | 0 | 49/49/0 (-437.68) | 0 |
| painted_table_cell_text_baselines | 78 | 50 | 38.63 | 0/0/0 (0) | 0 | 26/25/0 (-48.75) | 0 |
| fixed_table_widths | 78 | 50 | 38.63 | 0/0/0 (0) | 0 | 0/0/0 (0) | 0 |
| table_percent_widths | 78 | 50 | 33.22 | 8/8/0 (-335.27) | 0 | 4/0/4 (182.49) | 4: "REC-2026-000482" dx -2.88→-51.08; "22/06/2026 14:37" dx -2.88→-51.08; "Joana Pereira" dx -2.88→-51.08 |
| auto_table_compact_columns | 78 | 50 | 33.22 | 0/0/0 (0) | 0 | 0/0/0 (0) | 0 |
| collapsed_table_medium_border_insets_x | 78 | 50 | 33.29 | 38/0/3 (4.27) | 22: body>div:nth-child(1)>table:nth-child(4)>thead:nth-child(1)>tr:nth-child(1)>th:nth-child(2) dx -10.75→-13.75; body>div:nth-child(1)>table:nth-child(4)>thead:nth-child(1)>tr:nth-child(1)>th:nth-child(3) dx -6.78→-9.78; body>div:nth-child(1)>table:nth-child(4)>thead:nth-child(1)>tr:nth-child(1)>th:nth-child(4) dx -3.14→-6.14; largest: body>div:nth-child(1)>div:nth-child(5)>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(1) dw 10.72→13.86 | 38/0/4 (9.09) | 18: "QTD" dx -11.23→-14.23; "UNITÁRIO" dx -6.59→-9.59; "TOTAL" dx -3.3→-6.3 |

## Top 20 box divergences in collapsed_table_medium_border_insets_x (absolute)

| path | dx | dy | dw | dh | regressed by | first over tol. | dominant (step) | steps |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| html | 0 | 0 | 0 | 88.44 | N0 dh 0→79.44 (first layer); B0 dh 79.44→88.44 | N0 | N0 (dh +79.44) | N0 dh +79.44; B0 dh +9 |
| body | 0 | 0 | 0 | 88.44 | N0 dh 0→79.44 (first layer); B0 dh 79.44→88.44 | N0 | N0 (dh +79.44) | N0 dh +79.44; B0 dh +9 |
| body>div:nth-child(1) | -0.12 | 0 | 0.27 | 88.44 | N0 dh 0→79.44 (first layer); B0 dh 79.44→88.44 | N0 | N0 (dh +79.44) | N0 dh +79.44; B0 dh +9 |
| body>div:nth-child(1)>p:nth-child(6) | -0.12 | 67.02 | 0.27 | -46.3 | N0 dy 0→79.02 (first layer); B0 dh -0.3→-46.3 | N0 | N0 (dy +79.02) | N0 dy +79.02; B0 dh -46; collapsed_table_medium_border_insets dy -12 |
| body>div:nth-child(1)>p:nth-child(6)>span:nth-child(1) | -0.12 | 67.02 | 0.27 | -0.12 | N0 dy 0→79.02 (first layer) | N0 | N0 (dy +79.02) | N0 dy +79.02; collapsed_table_medium_border_insets dy -12 |
| body>div:nth-child(1)>div:nth-child(5)>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(4)>td:nth-child(1) | -0.23 | 60.47 | 13.86 | 0.89 | N0 dy 0→75.47 (first layer); collapsed_table_medium_border_insets_x dw 10.72→13.86 | N0 | N0 (dy +75.47) | N0 dy +75.47; collapsed_table_medium_border_insets dy -15; collapsed_table_medium_border_insets_x dw +3.14 |
| body>div:nth-child(1)>div:nth-child(5)>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(4)>td:nth-child(2) | 16.67 | 60.47 | -16.42 | 0.89 | N0 dy 0→75.47 (first layer) | N0 | N0 (dy +75.47) | N0 dy +75.47; collapsed_table_medium_border_insets dy -15; collapsed_table_medium_border_insets_x dw +2.81 |
| body>div:nth-child(1)>div:nth-child(5)>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(3)>td:nth-child(1) | -0.23 | 57.58 | 13.86 | -0.11 | N0 dy 0→72.58 (first layer); collapsed_table_medium_border_insets_x dw 10.72→13.86 | N0 | N0 (dy +72.58) | N0 dy +72.58; collapsed_table_medium_border_insets dy -15; collapsed_table_medium_border_insets_x dw +3.14 |
| body>div:nth-child(1)>div:nth-child(5)>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(3)>td:nth-child(2) | 16.67 | 57.58 | -16.42 | -0.11 | N0 dy 0→72.58 (first layer) | N0 | N0 (dy +72.58) | N0 dy +72.58; collapsed_table_medium_border_insets dy -15; collapsed_table_medium_border_insets_x dw +2.81 |
| body>div:nth-child(1)>div:nth-child(5)>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(2)>td:nth-child(1) | -0.23 | 54.69 | 13.86 | -0.11 | N0 dy 0→69.69 (first layer); collapsed_table_medium_border_insets_x dw 10.72→13.86 | N0 | N0 (dy +69.69) | N0 dy +69.69; collapsed_table_medium_border_insets dy -15; collapsed_table_medium_border_insets_x dw +3.14 |
| body>div:nth-child(1)>div:nth-child(5)>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(2)>td:nth-child(2) | 16.67 | 54.69 | -16.42 | -0.11 | N0 dy 0→69.69 (first layer) | N0 | N0 (dy +69.69) | N0 dy +69.69; collapsed_table_medium_border_insets dy -15; collapsed_table_medium_border_insets_x dw +2.81 |
| body>div:nth-child(1)>div:nth-child(5) | -0.12 | 52.2 | 0.27 | 15.05 | N0 dy 0→64.2 (first layer) | N0 | N0 (dy +64.2) | N0 dy +64.2; collapsed_table_medium_border_insets dy -12 |
| body>div:nth-child(1)>div:nth-child(5)>h2:nth-child(1) | -0.23 | 52.09 | 0.48 | 0.03 | N0 dy 0→64.09 (first layer) | N0 | N0 (dy +64.09) | N0 dy +64.09; collapsed_table_medium_border_insets dy -12 |
| body>div:nth-child(1)>div:nth-child(5)>table:nth-child(2) | -0.23 | 51.8 | 0.48 | 9.56 | N0 dy 0→63.8 (first layer) | N0 | N0 (dy +63.8) | N0 dy +63.8; collapsed_table_medium_border_insets dy -12 |
| body>div:nth-child(1)>div:nth-child(5)>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(1) | -0.23 | 51.8 | 13.86 | -0.11 | N0 dy 0→66.8 (first layer); collapsed_table_medium_border_insets_x dw 10.72→13.86 | N0 | N0 (dy +66.8) | N0 dy +66.8; collapsed_table_medium_border_insets dy -15; collapsed_table_medium_border_insets_x dw +3.14 |
| body>div:nth-child(1)>div:nth-child(5)>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(2) | 16.67 | 51.8 | -16.42 | -0.11 | N0 dy 0→66.8 (first layer) | N0 | N0 (dy +66.8) | N0 dy +66.8; collapsed_table_medium_border_insets dy -15; collapsed_table_medium_border_insets_x dw +2.81 |
| body>div:nth-child(1)>table:nth-child(4)>tfoot:nth-child(3)>tr:nth-child(3)>td:nth-child(1) | -0.12 | 51.14 | -9.02 | 0.73 | N0 dy 0→60.14 (first layer) | N0 | N0 (dy +60.14) | N0 dy +60.14; collapsed_table_medium_border_insets dy -9; collapsed_table_medium_border_insets_x dx -3 |
| body>div:nth-child(1)>table:nth-child(4)>tfoot:nth-child(3)>tr:nth-child(3)>td:nth-child(2) | -6.14 | 51.14 | 0.28 | 0.73 | N0 dy 0→60.14 (first layer); collapsed_table_medium_border_insets_x dx -3.14→-6.14 | N0 | N0 (dy +60.14) | N0 dy +60.14; collapsed_table_medium_border_insets dy -9; collapsed_table_medium_border_insets_x dx -3 |
| body>div:nth-child(1)>table:nth-child(4)>tfoot:nth-child(3)>tr:nth-child(2)>td:nth-child(1) | -0.12 | 48.55 | -9.02 | -0.41 | N0 dy 0→57.55 (first layer) | N0 | N0 (dy +57.55) | N0 dy +57.55; collapsed_table_medium_border_insets dy -9; collapsed_table_medium_border_insets_x dx -3 |
| body>div:nth-child(1)>table:nth-child(4)>tfoot:nth-child(3)>tr:nth-child(2)>td:nth-child(2) | -6.14 | 48.55 | 0.28 | -0.41 | N0 dy 0→57.55 (first layer); collapsed_table_medium_border_insets_x dx -3.14→-6.14 | N0 | N0 (dy +57.55) | N0 dy +57.55; collapsed_table_medium_border_insets dy -9; collapsed_table_medium_border_insets_x dx -3 |

## Top 20 LOCAL box divergences

rdx/rdy = the error a box ADDS to what it inherits: after a previous compared sibling in the same row, relative to that sibling's right edge (dx+dw) and dy; after a stacked sibling, relative to its bottom edge (dy+dh); a first child, relative to its parent's dx/dy. Isolates where cumulative drift originates.

| path | rdx | rdy | dw | dh | regressed by | first over tol. | dominant (step) |
| --- | --- | --- | --- | --- | --- | --- | --- |
| html | 0 | 0 | 0 | 88.44 | N0 dh 0→79.44 (first layer); B0 dh 79.44→88.44 | N0 | N0 (dh +79.44) |
| body | 0 | 0 | 0 | 88.44 | N0 dh 0→79.44 (first layer); B0 dh 79.44→88.44 | N0 | N0 (dh +79.44) |
| body>div:nth-child(1) | -0.12 | 0 | 0.27 | 88.44 | N0 dh 0→79.44 (first layer); B0 dh 79.44→88.44 | N0 | N0 (dh +79.44) |
| body>div:nth-child(1)>p:nth-child(6) | 0 | -0.23 | 0.27 | -46.3 | N0 dy 0→79.02 (first layer); B0 dh -0.3→-46.3 | N0 | N0 (dy +79.02) |
| body>div:nth-child(1)>table:nth-child(4) | 0 | -0.33 | 0.27 | 42.64 | N0 dh 0→48.64 (first layer) | N0 | N0 (dh +48.64) |
| body>div:nth-child(1)>table:nth-child(4)>tbody:nth-child(2)>tr:nth-child(2)>td:nth-child(1) | 0 | 3 | -15.62 | 21.17 | N0 dy 0→25.2 (first layer) | N0 | N0 (dy +25.2) |
| body>div:nth-child(1)>table:nth-child(4)>tbody:nth-child(2)>tr:nth-child(2)>td:nth-child(2) | 2 | 0 | -0.03 | 21.17 | N0 dy 0→25.2 (first layer); collapsed_table_medium_border_insets_x dx -10.75→-13.75 | N0 | N0 (dy +25.2) |
| body>div:nth-child(1)>table:nth-child(4)>tbody:nth-child(2)>tr:nth-child(2)>td:nth-child(3) | 4 | 0 | 0.64 | 21.17 | N0 dy 0→25.2 (first layer); collapsed_table_medium_border_insets_x dx -6.78→-9.78 | N0 | N0 (dy +25.2) |
| body>div:nth-child(1)>table:nth-child(4)>tbody:nth-child(2)>tr:nth-child(2)>td:nth-child(4) | 3 | 0 | 0.28 | 21.17 | N0 dy 0→25.2 (first layer); collapsed_table_medium_border_insets_x dx -3.14→-6.14 | N0 | N0 (dy +25.2) |
| body>div:nth-child(1)>table:nth-child(4)>tbody:nth-child(2)>tr:nth-child(2)>td:nth-child(1)>span:nth-child(1) | 0.45 | 20.69 | -16.53 | -0.47 | N0 dy 0→45.89 (first layer) | N0 | N0 (dy +45.89) |
| body>div:nth-child(1)>table:nth-child(4)>tbody:nth-child(2)>tr:nth-child(1)>td:nth-child(1)>span:nth-child(1) | 0.45 | -0.31 | -16.53 | -0.47 | N0 dy 0→21.72 (first layer) | N0 | N0 (dy +21.72) |
| body>div:nth-child(1)>table:nth-child(4)>tbody:nth-child(2)>tr:nth-child(3)>td:nth-child(1)>span:nth-child(1) | 0.45 | -0.31 | -16.53 | -0.47 | N0 dy 0→49.06 (first layer) | N0 | N0 (dy +49.06) |
| body>div:nth-child(1)>table:nth-child(4)>tbody:nth-child(2)>tr:nth-child(4)>td:nth-child(1)>span:nth-child(1) | 0.45 | -0.58 | -16.53 | -0.47 | N0 dy 0→51.97 (first layer) | N0 | N0 (dy +51.97) |
| body>div:nth-child(1)>div:nth-child(5)>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(2) | 3.05 | 0 | -16.42 | -0.11 | N0 dy 0→66.8 (first layer) | N0 | N0 (dy +66.8) |
| body>div:nth-child(1)>div:nth-child(5)>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(2)>td:nth-child(2) | 3.05 | 0 | -16.42 | -0.11 | N0 dy 0→69.69 (first layer) | N0 | N0 (dy +69.69) |
| body>div:nth-child(1)>div:nth-child(5)>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(3)>td:nth-child(2) | 3.05 | 0 | -16.42 | -0.11 | N0 dy 0→72.58 (first layer) | N0 | N0 (dy +72.58) |
| body>div:nth-child(1)>div:nth-child(5)>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(4)>td:nth-child(2) | 3.05 | 0 | -16.42 | 0.89 | N0 dy 0→75.47 (first layer) | N0 | N0 (dy +75.47) |
| body>div:nth-child(1)>table:nth-child(4)>thead:nth-child(1)>tr:nth-child(1)>th:nth-child(1) | 0 | 0 | -15.62 | 0.8 | N0 dy 0→18.23 (first layer) | N0 | N0 (dy +18.23) |
| body>div:nth-child(1)>table:nth-child(4)>tbody:nth-child(2)>tr:nth-child(1)>td:nth-child(1) | 0 | 3 | -15.62 | 0.17 | N0 dy 0→22.03 (first layer) | N0 | N0 (dy +22.03) |
| body>div:nth-child(1)>table:nth-child(4)>tbody:nth-child(2)>tr:nth-child(3)>td:nth-child(1) | 0 | 3 | -15.62 | 0.17 | N0 dy 0→49.38 (first layer) | N0 | N0 (dy +49.38) |

## Top 20 text-run divergences in collapsed_table_medium_border_insets_x

| owner | text | dx | dy | dw | dright | faces | regressed by | first over tol. | dominant (step) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| body>div:nth-child(1)>p:nth-child(6)>span:nth-child(1) | Obrigado pela sua compra! | -0.13 | 67.02 | 0.03 | -0.1 | LiberationSans-Bold.ttf | L0 dy 0→79.02 (first layer) | L0 | L0 (dy +79.02) |
| body>div:nth-child(1)>div:nth-child(5)>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(4)>td:nth-child(1) | Situação | -0.23 | 60.59 | 0.01 | -0.22 | LiberationSans-Regular.ttf | L0 dy 0→75.59 (first layer) | L0 | L0 (dy +75.59) |
| body>div:nth-child(1)>div:nth-child(5)>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(4)>td:nth-child(2) | Pago | -0.01 | 60.59 | 0.02 | 0.01 | LiberationSans-Bold.ttf | L0 dy 0→75.59 (first layer) | L0 | L0 (dy +75.59) |
| body>div:nth-child(1)>div:nth-child(5)>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(3)>td:nth-child(1) | Autorização | -0.23 | 57.7 | 0.03 | -0.2 | LiberationSans-Regular.ttf | L0 dy 0→72.7 (first layer) | L0 | L0 (dy +72.7) |
| body>div:nth-child(1)>div:nth-child(5)>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(3)>td:nth-child(2) | AUTH-7F3A9C21 | -0.04 | 57.7 | 0.04 | 0.01 | LiberationSans-Bold.ttf | L0 dy 0→72.7 (first layer) | L0 | L0 (dy +72.7) |
| body>div:nth-child(1)>div:nth-child(5)>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(2)>td:nth-child(1) | Bandeira / detalhe | -0.23 | 54.81 | 0.05 | -0.18 | LiberationSans-Regular.ttf | L0 dy 0→69.81 (first layer) | L0 | L0 (dy +69.81) |
| body>div:nth-child(1)>div:nth-child(5)>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(2)>td:nth-child(2) | Aurora Card •••• 4242 | -0.06 | 54.81 | 0.06 | 0.01 | LiberationSans-Bold.ttf | L0 dy 0→69.81 (first layer) | L0 | L0 (dy +69.81) |
| body>div:nth-child(1)>div:nth-child(5)>h2:nth-child(1) | PAGAMENTO | -0.23 | 52.09 | 0.01 | -0.22 | LiberationSans-Bold.ttf | L0 dy 0→64.09 (first layer) | L0 | L0 (dy +64.09) |
| body>div:nth-child(1)>div:nth-child(5)>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(1) | Forma de pagamento | -0.23 | 51.92 | 0.06 | -0.17 | LiberationSans-Regular.ttf | L0 dy 0→66.92 (first layer) | L0 | L0 (dy +66.92) |
| body>div:nth-child(1)>div:nth-child(5)>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(2) | Cartão de crédito | -0.04 | 51.92 | 0.05 | 0.01 | LiberationSans-Bold.ttf | L0 dy 0→66.92 (first layer) | L0 | L0 (dy +66.92) |
| body>div:nth-child(1)>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(4)>td:nth-child(2) | Cliente Final (CUST-00042) | -51.12 | 9.22 | 0.08 | -51.04 | LiberationSans-Bold.ttf | L0 dy 0→12.22 (first layer); table_percent_widths dx -2.92→-51.12 | L0 | table_percent_widths (dx -48.2) |
| body>div:nth-child(1)>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(2) | REC-2026-000482 | -51.08 | 0.55 | 0.05 | -51.04 | LiberationSans-Bold.ttf | L0 dy 0→3.55 (first layer); table_percent_widths dx -2.88→-51.08 | L0 | table_percent_widths (dx -48.2) |
| body>div:nth-child(1)>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(2)>td:nth-child(2) | 22/06/2026 14:37 | -51.08 | 3.44 | 0.05 | -51.04 | LiberationSans-Bold.ttf | L0 dy 0→6.44 (first layer); table_percent_widths dx -2.88→-51.08 | L0 | table_percent_widths (dx -48.2) |
| body>div:nth-child(1)>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(3)>td:nth-child(2) | Joana Pereira | -51.08 | 6.33 | 0.04 | -51.04 | LiberationSans-Bold.ttf | L0 dy 0→9.33 (first layer); table_percent_widths dx -2.88→-51.08 | L0 | table_percent_widths (dx -48.2) |
| body>div:nth-child(1)>table:nth-child(4)>tfoot:nth-child(3)>tr:nth-child(2)>td:nth-child(1) | Desconto | 0.33 | 49 | 0 | 0.33 | LiberationSans-Regular.ttf | L0 dy 0→58 (first layer) | L0 | L0 (dy +58) |
| body>div:nth-child(1)>table:nth-child(4)>tfoot:nth-child(3)>tr:nth-child(2)>td:nth-child(2) | - R$ 5,00 | -6.31 | 49 | 0 | -6.31 | LiberationSans-Regular.ttf | L0 dy 0→58 (first layer); collapsed_table_medium_border_insets_x dx -3.31→-6.31 | L0 | L0 (dy +58) |
| body>div:nth-child(1)>table:nth-child(4)>tfoot:nth-child(3)>tr:nth-child(3)>td:nth-child(1) | Total pago | 0.33 | 47.59 | 0.03 | 0.36 | LiberationSans-Bold.ttf | L0 dy 0→58.59 (first layer) | L0 | L0 (dy +58.59) |
| body>div:nth-child(1)>table:nth-child(4)>tfoot:nth-child(3)>tr:nth-child(3)>td:nth-child(2) | R$ 68,50 | -6.33 | 47.59 | 0.02 | -6.31 | LiberationSans-Bold.ttf | L0 dy 0→58.59 (first layer); collapsed_table_medium_border_insets_x dx -3.33→-6.33 | L0 | L0 (dy +58.59) |
| body>div:nth-child(1)>table:nth-child(4)>tfoot:nth-child(3)>tr:nth-child(1)>td:nth-child(1) | Subtotal | 0.33 | 45.41 | 0 | 0.33 | LiberationSans-Regular.ttf | L0 dy 0→54.41 (first layer) | L0 | L0 (dy +54.41) |
| body>div:nth-child(1)>table:nth-child(4)>tfoot:nth-child(3)>tr:nth-child(1)>td:nth-child(2) | R$ 73,50 | -6.32 | 45.41 | 0.01 | -6.31 | LiberationSans-Regular.ttf | L0 dy 0→54.41 (first layer); collapsed_table_medium_border_insets_x dx -3.32→-6.32 | L0 | L0 (dy +54.41) |

## Top 20 LOCAL text-run divergences

rdx/rdy = the run's Δ minus its owner box's dx/dy (final layer), so runs that only ride along with a shifted owner rank low (de-duplicates cascades, like the local box table).

| owner | text | rdx | rdy | dx | dy | regressed by | first over tol. | dominant (step) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| body>div:nth-child(1)>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(4)>td:nth-child(2) | Cliente Final (CUST-00042) | -51.82 | 0.13 | -51.12 | 9.22 | L0 dy 0→12.22 (first layer); table_percent_widths dx -2.92→-51.12 | L0 | table_percent_widths (dx -48.2) |
| body>div:nth-child(1)>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(2) | REC-2026-000482 | -51.79 | 0.13 | -51.08 | 0.55 | L0 dy 0→3.55 (first layer); table_percent_widths dx -2.88→-51.08 | L0 | table_percent_widths (dx -48.2) |
| body>div:nth-child(1)>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(2)>td:nth-child(2) | 22/06/2026 14:37 | -51.79 | 0.13 | -51.08 | 3.44 | L0 dy 0→6.44 (first layer); table_percent_widths dx -2.88→-51.08 | L0 | table_percent_widths (dx -48.2) |
| body>div:nth-child(1)>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(3)>td:nth-child(2) | Joana Pereira | -51.78 | 0.13 | -51.08 | 6.33 | L0 dy 0→9.33 (first layer); table_percent_widths dx -2.88→-51.08 | L0 | table_percent_widths (dx -48.2) |
| body>div:nth-child(1)>div:nth-child(5)>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(2)>td:nth-child(2) | Aurora Card •••• 4242 | -16.73 | 0.13 | -0.06 | 54.81 | L0 dy 0→69.81 (first layer) | L0 | L0 (dy +69.81) |
| body>div:nth-child(1)>div:nth-child(5)>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(2) | Cartão de crédito | -16.71 | 0.13 | -0.04 | 51.92 | L0 dy 0→66.92 (first layer) | L0 | L0 (dy +66.92) |
| body>div:nth-child(1)>div:nth-child(5)>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(3)>td:nth-child(2) | AUTH-7F3A9C21 | -16.71 | 0.13 | -0.04 | 57.7 | L0 dy 0→72.7 (first layer) | L0 | L0 (dy +72.7) |
| body>div:nth-child(1)>div:nth-child(5)>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(4)>td:nth-child(2) | Pago | -16.68 | 0.13 | -0.01 | 60.59 | L0 dy 0→75.59 (first layer) | L0 | L0 (dy +75.59) |
| body>div:nth-child(1)>table:nth-child(4)>tfoot:nth-child(3)>tr:nth-child(3)>td:nth-child(1) | Total pago | 0.45 | -3.55 | 0.33 | 47.59 | L0 dy 0→58.59 (first layer) | L0 | L0 (dy +58.59) |
| body>div:nth-child(1)>table:nth-child(4)>tfoot:nth-child(3)>tr:nth-child(3)>td:nth-child(2) | R$ 68,50 | -0.19 | -3.55 | -6.33 | 47.59 | L0 dy 0→58.59 (first layer); collapsed_table_medium_border_insets_x dx -3.33→-6.33 | L0 | L0 (dy +58.59) |
| body>div:nth-child(1)>table:nth-child(4)>tbody:nth-child(2)>tr:nth-child(1)>td:nth-child(2) | 2 | -0.48 | -3.05 | -14.23 | 9.98 | L0 dy 0→20.98 (first layer); collapsed_table_medium_border_insets_x dx -11.23→-14.23 | L0 | L0 (dy +20.98) |
| body>div:nth-child(1)>table:nth-child(4)>tbody:nth-child(2)>tr:nth-child(1)>td:nth-child(3) | R$ 9,50 | 0.18 | -3.05 | -9.6 | 9.98 | L0 dy 0→20.98 (first layer); collapsed_table_medium_border_insets_x dx -6.6→-9.6 | L0 | L0 (dy +20.98) |
| body>div:nth-child(1)>table:nth-child(4)>tbody:nth-child(2)>tr:nth-child(1)>td:nth-child(4) | R$ 19,00 | -0.2 | -3.05 | -6.34 | 9.98 | L0 dy 0→20.98 (first layer); collapsed_table_medium_border_insets_x dx -3.34→-6.34 | L0 | L0 (dy +20.98) |
| body>div:nth-child(1)>table:nth-child(4)>tbody:nth-child(2)>tr:nth-child(2)>td:nth-child(2) | 1 | -0.48 | -3.05 | -14.23 | 13.16 | L0 dy 0→24.16 (first layer); collapsed_table_medium_border_insets_x dx -11.23→-14.23 | L0 | L0 (dy +24.16) |
| body>div:nth-child(1)>table:nth-child(4)>tbody:nth-child(2)>tr:nth-child(2)>td:nth-child(3) | R$ 7,00 | 0.18 | -3.05 | -9.6 | 13.16 | L0 dy 0→24.16 (first layer); collapsed_table_medium_border_insets_x dx -6.6→-9.6 | L0 | L0 (dy +24.16) |
| body>div:nth-child(1)>table:nth-child(4)>tbody:nth-child(2)>tr:nth-child(2)>td:nth-child(4) | R$ 7,00 | -0.18 | -3.05 | -6.32 | 13.16 | L0 dy 0→24.16 (first layer); collapsed_table_medium_border_insets_x dx -3.32→-6.32 | L0 | L0 (dy +24.16) |
| body>div:nth-child(1)>table:nth-child(4)>tbody:nth-child(2)>tr:nth-child(3)>td:nth-child(2) | 3 | -0.48 | -3.05 | -14.23 | 37.33 | L0 dy 0→48.33 (first layer); collapsed_table_medium_border_insets_x dx -11.23→-14.23 | L0 | L0 (dy +48.33) |
| body>div:nth-child(1)>table:nth-child(4)>tbody:nth-child(2)>tr:nth-child(3)>td:nth-child(3) | R$ 12,00 | 0.16 | -3.05 | -9.62 | 37.33 | L0 dy 0→48.33 (first layer); collapsed_table_medium_border_insets_x dx -6.62→-9.62 | L0 | L0 (dy +48.33) |
| body>div:nth-child(1)>table:nth-child(4)>tbody:nth-child(2)>tr:nth-child(3)>td:nth-child(4) | R$ 36,00 | -0.2 | -3.05 | -6.34 | 37.33 | L0 dy 0→48.33 (first layer); collapsed_table_medium_border_insets_x dx -3.34→-6.34 | L0 | L0 (dy +48.33) |
| body>div:nth-child(1)>table:nth-child(4)>tbody:nth-child(2)>tr:nth-child(4)>td:nth-child(2) | 1 | -0.48 | -3.05 | -14.23 | 40.5 | L0 dy 0→51.5 (first layer); collapsed_table_medium_border_insets_x dx -11.23→-14.23 | L0 | L0 (dy +51.5) |

## Margins (not part of the x/y/w/h attribution)

vellora margins are Blitz's resolved layout.margin as read by the walk (L0) and after the passes; Chromium values are COMPUTED margins of the element itself (not collapsed through descendants). Not part of the x/y/w/h attribution.

- boxes with vellora margins: 62; changed by the passes (L0 → final): 0
- differ from Chromium COMPUTED margins by > tolerance (L0): 0


## Match counts and node policy

- Chromium elements under html (head excluded) by policy: compared 63, inline-text-only 5, no-blitz-box 21
- vellora L0 boxes (elements, head excluded): 95; matched to a compared Chromium box: 62; compared Chromium boxes present in N0: 63
- vellora-only — inline element (compared via text runs): 4 (e.g. body>div:nth-child(1)>header:nth-child(1)>address:nth-child(4)>br:nth-child(1); body>div:nth-child(1)>header:nth-child(1)>address:nth-child(4)>br:nth-child(2); body>div:nth-child(1)>header:nth-child(1)>address:nth-child(4)>br:nth-child(3))
- vellora-only — table row/group: not a Blitz layout node (zero box in walk): 21 (e.g. body>div:nth-child(1)>table:nth-child(2)>tbody:nth-child(1); body>div:nth-child(1)>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(1); body>div:nth-child(1)>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(2))
- vellora-only — html_normalize wrapper (no source node): 4 (e.g. body>div:nth-child(1)>table:nth-child(4)>tbody:nth-child(2)>tr:nth-child(1)>td:nth-child(1)>::vellora-wrapper(1); body>div:nth-child(1)>table:nth-child(4)>tbody:nth-child(2)>tr:nth-child(2)>td:nth-child(1)>::vellora-wrapper(1); body>div:nth-child(1)>table:nth-child(4)>tbody:nth-child(2)>tr:nth-child(3)>td:nth-child(1)>::vellora-wrapper(1))
- vellora-only — no Chromium node with this path: 4 (e.g. body>div:nth-child(1)>div:nth-child(7); body>div:nth-child(1)>p:nth-child(8); body>div:nth-child(1)>footer:nth-child(9))
- Chromium-only compared boxes (no vellora L0 box): 1 (e.g. body>div:nth-child(1)>footer:nth-child(7))
- Blitz layout-tree-only nodes (anonymous blocks / pseudo-elements the walk never visits): 0
- Policy: `inline-text-only` = Chromium `display:inline` non-replaced element (Blitz gives it no Taffy box; its text is compared as runs). `no-blitz-box` = table row/row-group that is not a Blitz layout node (zero box in the walk); listed, not scored. `no-layout` = Chromium has no layout object (display:none). Pseudo-elements are matched by `::before`/`::after` segments and never count toward `:nth-child`; their generated text is compared like any text. Anonymous boxes: Chromium's are not exposed by DOMSnapshot; Blitz's appear only in N0/B0 as `::blitz-anon(j)`. html_normalize wrappers are transparent in keys and listed as vellora-only.

## Text alignment

- vellora runs (non-blank, L0): 61; Chromium text fragments (non-blank): 60; matched pairs: 55 (0 joined across fragment/run boundaries)
- unmatched vellora runs: 6; unmatched Chromium fragments: 1; Chromium text with NO vellora owner (text vellora never shaped): 4

Unmatched vellora runs (first 6):

| owner | text |
| --- | --- |
| body>div:nth-child(1)>table:nth-child(4)>tbody:nth-child(2)>tr:nth-child(2)>td:nth-child(1) | Pão na Chapa com  |
| body>div:nth-child(1)>table:nth-child(4)>tbody:nth-child(2)>tr:nth-child(2)>td:nth-child(1) | Manteiga |
| body>div:nth-child(1)>div:nth-child(7) | Volte sempre — seu próximo café especial já está esperando  |
| body>div:nth-child(1)>div:nth-child(7) | por você. |
| body>div:nth-child(1)>footer:nth-child(9) | Este recibo é um comprovante simplificado e não substitui documento fiscal. |
| body>div:nth-child(1)>footer:nth-child(9) | Cafeteria Aurora Ltda · www.cafeteria-aurora.example |

Unmatched Chromium fragments (first 1):

| owner | text | generated |
| --- | --- | --- |
| body>div:nth-child(1)>table:nth-child(4)>tbody:nth-child(2)>tr:nth-child(2)>td:nth-child(1) | Pão na Chapa com Manteiga |  |

Chromium text with no vellora owner:

| text node | text |
| --- | --- |
| body>div:nth-child(1)>p:nth-child(6)>#text | Volte sempre — seu próximo café especial já está esperando por |
| body>div:nth-child(1)>p:nth-child(6)>#text | você. |
| body>div:nth-child(1)>footer:nth-child(7)>#text | Este recibo é um comprovante simplificado e não substitui documento fiscal. |
| body>div:nth-child(1)>footer:nth-child(7)>#text | Cafeteria Aurora Ltda · www.cafeteria-aurora.example |

## Caveats

- Local macOS Chrome results are INDICATIVE; the authoritative run is the pinned Chrome for Testing on Linux CI (see fidelity/layout-diff/README.md).
- Text dy compares BASELINES when Chromium's ascent for the face/size was measured (probe page, zero-size inline-block on the baseline); otherwise vellora's text top (baseline − Parley ascent) vs Chromium's text-box top (`dy basis` column).
- L0 text positions already include `read_text_runs`' inline padding-right compensation, so 'raw Parley' text is not separated from vellora's reader.
- A layer that moves a box TOWARDS Chromium is an improvement here, whatever its cause; for 'what did this code change do', compare two builds with compare.mjs.
