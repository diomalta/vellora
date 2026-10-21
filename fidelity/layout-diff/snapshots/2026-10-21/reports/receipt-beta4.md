# Layout diff — receipt (beta4)

> Continuous-flow comparison: Chromium lays the document out as ONE flow (no fragmentation) at the same viewport width vellora hands Blitz. It is comparable ONLY to vellora's PRE-pagination layers (B0, L0, layout_normalize passes) and says nothing about pagination (page breaks, repeated thead, page-local offsets, margin boxes).

Deltas are vellora − Chromium in CSS px. Paths abbreviate `html>body:nth-child(2)` as `body`.

## Environment

- date_utc: `2026-10-21T01:07:44Z`
- os: `darwin 27.0.0 arm64`
- cpu: `Apple M5 Pro`
- node: `v22.23.2`
- command: `node /Users/diomalta/Repositories/vellora/.claude/worktrees/wf_e3d702d1-528-2/fidelity/layout-diff/run.mjs --label beta4 --dump-repo /Users/diomalta/Repositories/vellora/.claude/worktrees/wf_e3d702d1-528-2/fidelity/.cache/beta4`
- repo: `/Users/diomalta/Repositories/vellora/.claude/worktrees/wf_e3d702d1-528-2/fidelity/.cache/beta4`
- rustc: `rustc 1.96.0 (ac68faa20 2026-05-25)`
- git_commit: `a704aa14767d2424b3e0097a0c2402867eba39e3`
- git_dirty: `dirty`
- blitz: `blitz-0.3.0-beta.4`
- chrome_path: `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`
- chrome_version: `Google Chrome 155.0.8059.85`
- templating_repo: `/Users/diomalta/Repositories/vellora/.claude/worktrees/wf_e3d702d1-528-2`
- chrome_user_agent: `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/155.0.0.0 Safari/537.36`
- crates: blitz-dom 0.3.0-beta.4, blitz-html 0.3.0-beta.4, blitz-traits 0.3.0-beta.4, krilla 0.8.2, parley 0.12.0, stylo 0.22.0, taffy 0.15.0
- tools: puppeteer-core 25.15.0

## Input parity

- @page content box 672.3351 × 1001.6151 CSS px → Blitz viewport 672 × 1001 (`as u32` truncation in resolve_and_walk drops 0.3351 px of inline size; a KNOWN INPUT divergence vs Chromium print, not an engine difference). Chromium viewport set to the same 672 × 1001; documentElement.clientWidth = 672 (scrollbars hidden).
- Media: Blitz evaluates stylesheets as `screen` (DocumentConfig::media_type default; build_document never sets it). Chromium emulates `print` (matchMedia('print') = true). Fixture contains @media rules: no (media type is inert here).
- Fonts: Chromium loaded Vellora Sans 400 normal; Vellora Sans 700 normal from the bundled files (sha256 in env.fonts_sha256). vellora runs by face: LiberationSans-Bold.ttf 18, LiberationSans-Regular.ttf 42. DejaVu fallback runs (no Chromium counterpart): 0.
- Baselines: Chromium ascent measured for 11/11 face/size specs.
- html_normalize wrappers: recorded 5, located in the Blitz DOM 4 — MISMATCH: keys under wrappers may be wrong.
- Blitz anonymous blocks (B0 only): 0; anonymous inline roots holding text (text Blitz shaped that vellora's DOM-children walk never reads): 0.
- Dump self-checks: run-metadata misalignments 0, layer order violations 0 (both expected 0).
- Input sha256: native 8a9d9e7bc3c09124…, browser 12921d91862d9165…

## Layers (attribution chain order)

| layer | kind | meaning |
| --- | --- | --- |
| B0 | blitz | Blitz's own layout tree: `layout_children` walk (incl. anonymous blocks), absolute border boxes from rounded `final_layout`. Raw Blitz. |
| L0 | walk | vellora's box walk (`blitz_engine::walk`, DOM `children`, accumulating `final_layout`) before any pass; text = Parley glyph runs as read by `read_text_runs`. |
| vertical_margin_collapse | pass | after this `layout_normalize` pass |
| collapsed_table_medium_border_insets | pass | after this `layout_normalize` pass |
| painted_table_cell_text_baselines | pass | after this `layout_normalize` pass |
| fixed_table_widths | pass | after this `layout_normalize` pass |
| table_percent_widths | pass | after this `layout_normalize` pass |
| auto_table_compact_columns | pass | after this `layout_normalize` pass |
| collapsed_table_medium_border_insets_x | pass | after this `layout_normalize` pass |
| B0u | blitz-unrounded | Same tree from `unrounded_layout` (Taffy before `round_layout`). Diagnostic only, not in the attribution chain. |

Tolerance: box 0.5 px, text 0.5 px. Box events: ENTER checks x/y/width (top-down), EXIT checks height (bottom-up, so html/body are not 'first' just because they absorb descendants' error). Text runs are checked between a box's enter and exit.

## Headline: first divergent box in collapsed_table_medium_border_insets_x

- **exit (height) body>div:nth-child(1)>header:nth-child(1)>address:nth-child(4)** (event #17)
- introduced by: **B0** — RAW BLITZ: Blitz's own layout tree (B0) already differs from Chromium (but the UNROUNDED tree is within tolerance: Taffy round_layout)

| layer | status | dx | dy | dw | dh | dy basis |
| --- | --- | --- | --- | --- | --- | --- |
| B0 | diverged |  |  |  | -0.56 |  |
| L0 | diverged |  |  |  | -0.56 |  |
| vertical_margin_collapse | diverged |  |  |  | -0.56 |  |
| collapsed_table_medium_border_insets | diverged |  |  |  | -0.56 |  |
| painted_table_cell_text_baselines | diverged |  |  |  | -0.56 |  |
| fixed_table_widths | diverged |  |  |  | -0.56 |  |
| table_percent_widths | diverged |  |  |  | -0.56 |  |
| auto_table_compact_columns | diverged |  |  |  | -0.56 |  |
| collapsed_table_medium_border_insets_x | diverged |  |  |  | -0.56 |  |
| B0u | ok |  |  |  | 0.04 |  |

Ancestor chain (compared boxes, root first; deltas = vellora − Chromium, CSS px):

| ancestor | collapsed_table_medium_border_insets_x dx,dy,dw,dh | B0 dx,dy,dw,dh | L0 dx,dy,dw,dh |
| --- | --- | --- | --- |
| html | 0, 0, 0, 19.44 | 0, 0, 0, 19.44 | 0, 0, 0, 19.44 |
| body | 0, 0, 0, 19.44 | 0, 0, 0, 19.44 | 0, 0, 0, 19.44 |
| body>div:nth-child(1) | -0.12, 0, 0.27, 19.44 | -0.12, 0, 0.27, 19.44 | -0.12, 0, 0.27, 19.44 |
| body>div:nth-child(1)>header:nth-child(1) | -0.12, 0, 0.27, -0.34 | -0.12, 0, 0.27, -0.34 | -0.12, 0, 0.27, -0.34 |

## First divergent text run in collapsed_table_medium_border_insets_x

- **text "CEP 01001-000" in body>div:nth-child(1)>header:nth-child(1)>address:nth-child(4)** (event #15)
- introduced by: **L0** — RAW BLITZ/PARLEY TEXT as read by vellora's walk (L0); no normalize pass involved
- Chromium fragment: "CEP 01001-000" at x=128.13 y=190.33 w=85.19; vellora faces: LiberationSans-Regular.ttf

| layer | status | dx | dy | dw | dright | dy basis |
| --- | --- | --- | --- | --- | --- | --- |
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

| ancestor | collapsed_table_medium_border_insets_x dx,dy,dw,dh | B0 dx,dy,dw,dh | L0 dx,dy,dw,dh |
| --- | --- | --- | --- |
| html | 0, 0, 0, 19.44 | 0, 0, 0, 19.44 | 0, 0, 0, 19.44 |
| body | 0, 0, 0, 19.44 | 0, 0, 0, 19.44 | 0, 0, 0, 19.44 |
| body>div:nth-child(1) | -0.12, 0, 0.27, 19.44 | -0.12, 0, 0.27, 19.44 | -0.12, 0, 0.27, 19.44 |
| body>div:nth-child(1)>header:nth-child(1) | -0.12, 0, 0.27, -0.34 | -0.12, 0, 0.27, -0.34 | -0.12, 0, 0.27, -0.34 |

## First divergence per layer

| layer | first box | box Δ | first text | text Δ (dx, dy) |
| --- | --- | --- | --- | --- |
| B0 | exit (height) body>div:nth-child(1)>header:nth-child(1)>address:nth-child(4) | -0.56 | n/a (no text in B0) |  |
| L0 | exit (height) body>div:nth-child(1)>header:nth-child(1)>address:nth-child(4) | -0.56 | text "CEP 01001-000" in body>div:nth-child(1)>header:nth-child(1)>address:nth-child(4) | -0.12, 0.67 |
| vertical_margin_collapse | exit (height) body>div:nth-child(1)>header:nth-child(1)>address:nth-child(4) | -0.56 | text "CEP 01001-000" in body>div:nth-child(1)>header:nth-child(1)>address:nth-child(4) | -0.12, 0.67 |
| collapsed_table_medium_border_insets | exit (height) body>div:nth-child(1)>header:nth-child(1)>address:nth-child(4) | -0.56 | text "CEP 01001-000" in body>div:nth-child(1)>header:nth-child(1)>address:nth-child(4) | -0.12, 0.67 |
| painted_table_cell_text_baselines | exit (height) body>div:nth-child(1)>header:nth-child(1)>address:nth-child(4) | -0.56 | text "CEP 01001-000" in body>div:nth-child(1)>header:nth-child(1)>address:nth-child(4) | -0.12, 0.67 |
| fixed_table_widths | exit (height) body>div:nth-child(1)>header:nth-child(1)>address:nth-child(4) | -0.56 | text "CEP 01001-000" in body>div:nth-child(1)>header:nth-child(1)>address:nth-child(4) | -0.12, 0.67 |
| table_percent_widths | exit (height) body>div:nth-child(1)>header:nth-child(1)>address:nth-child(4) | -0.56 | text "CEP 01001-000" in body>div:nth-child(1)>header:nth-child(1)>address:nth-child(4) | -0.12, 0.67 |
| auto_table_compact_columns | exit (height) body>div:nth-child(1)>header:nth-child(1)>address:nth-child(4) | -0.56 | text "CEP 01001-000" in body>div:nth-child(1)>header:nth-child(1)>address:nth-child(4) | -0.12, 0.67 |
| collapsed_table_medium_border_insets_x | exit (height) body>div:nth-child(1)>header:nth-child(1)>address:nth-child(4) | -0.56 | text "CEP 01001-000" in body>div:nth-child(1)>header:nth-child(1)>address:nth-child(4) | -0.12, 0.67 |

## Per-layer error and pass effects

`moved` = boxes/runs whose geometry this layer changed vs the previous one; `better`/`worse` = moved closer to / further from Chromium (max |Δ| per item); `Σ` = summed change of that error.

| layer | box events diverged | text events diverged | mean abs box Δ (px) | boxes moved/better/worse (Σ) | runs moved/better/worse (Σ) |
| --- | --- | --- | --- | --- | --- |
| B0 | 78 | n/a | 6.14 |  |  |
| L0 | 78 | 45 | 6.14 | 0/0/0 (0) | 0/0/0 (0) |
| vertical_margin_collapse | 78 | 45 | 6.14 | 0/0/0 (0) | 0/0/0 (0) |
| collapsed_table_medium_border_insets | 78 | 45 | 6.14 | 0/0/0 (0) | 0/0/0 (0) |
| painted_table_cell_text_baselines | 78 | 41 | 6.14 | 0/0/0 (0) | 27/27/0 (-46.96) |
| fixed_table_widths | 78 | 41 | 6.14 | 0/0/0 (0) | 0/0/0 (0) |
| table_percent_widths | 70 | 44 | 6.03 | 8/8/0 (-6.66) | 4/0/4 (4.19) |
| auto_table_compact_columns | 70 | 44 | 6.03 | 0/0/0 (0) | 0/0/0 (0) |
| collapsed_table_medium_border_insets_x | 70 | 44 | 6.03 | 0/0/0 (0) | 0/0/0 (0) |

## Top 20 box divergences in collapsed_table_medium_border_insets_x (absolute)

| path | dx | dy | dw | dh | introduced by |
| --- | --- | --- | --- | --- | --- |
| body>div:nth-child(1)>p:nth-child(6) | -0.12 | 10.02 | 0.27 | -46.3 | B0 |
| html | 0 | 0 | 0 | 19.44 | B0 |
| body | 0 | 0 | 0 | 19.44 | B0 |
| body>div:nth-child(1) | -0.12 | 0 | 0.27 | 19.44 | B0 |
| body>div:nth-child(1)>div:nth-child(5)>h2:nth-child(1) | -0.23 | 10.09 | 0.48 | 0.03 | B0 |
| body>div:nth-child(1)>p:nth-child(6)>span:nth-child(1) | -0.12 | 10.02 | 0.27 | -0.12 | B0 |
| body>div:nth-child(1)>div:nth-child(5)>table:nth-child(2) | -0.23 | 9.8 | 0.48 | -0.44 | B0 |
| body>div:nth-child(1)>div:nth-child(5)>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(1) | -0.23 | 9.8 | 2.72 | -0.11 | B0 |
| body>div:nth-child(1)>div:nth-child(5)>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(2) | 2.48 | 9.8 | -2.23 | -0.11 | B0 |
| body>div:nth-child(1)>div:nth-child(5)>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(2)>td:nth-child(1) | -0.23 | 9.69 | 2.72 | -0.11 | B0 |
| body>div:nth-child(1)>div:nth-child(5)>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(2)>td:nth-child(2) | 2.48 | 9.69 | -2.23 | -0.11 | B0 |
| body>div:nth-child(1)>table:nth-child(4) | -0.12 | 0.23 | 0.27 | 9.64 | B0 |
| body>div:nth-child(1)>div:nth-child(5)>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(3)>td:nth-child(1) | -0.23 | 9.58 | 2.72 | -0.11 | B0 |
| body>div:nth-child(1)>div:nth-child(5)>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(3)>td:nth-child(2) | 2.48 | 9.58 | -2.23 | -0.11 | B0 |
| body>div:nth-child(1)>div:nth-child(5)>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(4)>td:nth-child(1) | -0.23 | 9.47 | 2.72 | -0.11 | B0 |
| body>div:nth-child(1)>div:nth-child(5)>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(4)>td:nth-child(2) | 2.48 | 9.47 | -2.23 | -0.11 | B0 |
| body>div:nth-child(1)>div:nth-child(5) | -0.12 | 9.2 | 0.27 | 1.05 | B0 |
| body>div:nth-child(1)>table:nth-child(4)>tfoot:nth-child(3)>tr:nth-child(2)>td:nth-child(1) | -0.12 | 7.55 | -0.02 | -1.41 | B0 |
| body>div:nth-child(1)>table:nth-child(4)>tfoot:nth-child(3)>tr:nth-child(2)>td:nth-child(2) | -0.14 | 7.55 | 0.28 | -1.41 | B0 |
| body>div:nth-child(1)>table:nth-child(4)>tfoot:nth-child(3)>tr:nth-child(1)>td:nth-child(1) | -0.12 | 7.45 | -0.02 | -0.91 | B0 |

## Top 20 LOCAL box divergences

rdx/rdy = the error a box ADDS to what it inherits: after a previous compared sibling in the same row, relative to that sibling's right edge (dx+dw) and dy; after a stacked sibling, relative to its bottom edge (dy+dh); a first child, relative to its parent's dx/dy. Isolates where cumulative drift originates.

| path | rdx | rdy | dw | dh | introduced by |
| --- | --- | --- | --- | --- | --- |
| body>div:nth-child(1)>p:nth-child(6) | 0 | -0.23 | 0.27 | -46.3 | B0 |
| html | 0 | 0 | 0 | 19.44 | B0 |
| body | 0 | 0 | 0 | 19.44 | B0 |
| body>div:nth-child(1) | -0.12 | 0 | 0.27 | 19.44 | B0 |
| body>div:nth-child(1)>table:nth-child(4) | 0 | -0.33 | 0.27 | 9.64 | B0 |
| body>div:nth-child(1)>div:nth-child(5)>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(1) | 0 | 0 | 2.72 | -0.11 | B0 |
| body>div:nth-child(1)>div:nth-child(5)>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(2)>td:nth-child(1) | 0 | 0 | 2.72 | -0.11 | B0 |
| body>div:nth-child(1)>div:nth-child(5)>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(3)>td:nth-child(1) | 0 | 0 | 2.72 | -0.11 | B0 |
| body>div:nth-child(1)>div:nth-child(5)>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(4)>td:nth-child(1) | 0 | 0 | 2.72 | -0.11 | B0 |
| body>div:nth-child(1)>div:nth-child(5)>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(2) | 0 | 0 | -2.23 | -0.11 | B0 |
| body>div:nth-child(1)>div:nth-child(5)>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(2)>td:nth-child(2) | 0 | 0 | -2.23 | -0.11 | B0 |
| body>div:nth-child(1)>div:nth-child(5)>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(3)>td:nth-child(2) | 0 | 0 | -2.23 | -0.11 | B0 |
| body>div:nth-child(1)>div:nth-child(5)>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(4)>td:nth-child(2) | 0 | 0 | -2.23 | -0.11 | B0 |
| body>div:nth-child(1)>table:nth-child(4)>tfoot:nth-child(3)>tr:nth-child(3)>td:nth-child(1) | 0 | 1 | -0.02 | 1.73 | B0 |
| body>div:nth-child(1)>table:nth-child(4)>tfoot:nth-child(3)>tr:nth-child(3)>td:nth-child(2) | 0 | 0 | 0.28 | 1.73 | B0 |
| body>div:nth-child(1)>table:nth-child(4)>tbody:nth-child(2)>tr:nth-child(1)>td:nth-child(1)>span:nth-child(1) | 0.45 | -0.31 | -1.53 | -0.47 | B0 |
| body>div:nth-child(1)>table:nth-child(4)>tbody:nth-child(2)>tr:nth-child(2)>td:nth-child(1)>span:nth-child(1) | 0.45 | -0.31 | -1.53 | -0.47 | B0 |
| body>div:nth-child(1)>table:nth-child(4)>tbody:nth-child(2)>tr:nth-child(3)>td:nth-child(1)>span:nth-child(1) | 0.45 | -1.31 | -1.53 | 0.53 | B0 |
| body>div:nth-child(1)>table:nth-child(4)>tbody:nth-child(2)>tr:nth-child(4)>td:nth-child(1)>span:nth-child(1) | 0.45 | 0.42 | -1.53 | -0.47 | B0 |
| body>div:nth-child(1)>table:nth-child(4)>tfoot:nth-child(3)>tr:nth-child(2)>td:nth-child(1) | 0 | 1 | -0.02 | -1.41 | B0 |

## Top 20 text-run divergences in collapsed_table_medium_border_insets_x

| owner | text | dx | dy | dw | dright | faces | introduced by |
| --- | --- | --- | --- | --- | --- | --- | --- |
| body>div:nth-child(1)>div:nth-child(5)>h2:nth-child(1) | PAGAMENTO | -0.23 | 10.09 | -0.02 | -0.26 | LiberationSans-Bold.ttf | L0 |
| body>div:nth-child(1)>p:nth-child(6)>span:nth-child(1) | Obrigado pela sua compra! | -0.2 | 10.02 | 0.16 | -0.04 | LiberationSans-Bold.ttf | L0 |
| body>div:nth-child(1)>div:nth-child(5)>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(1) | Forma de pagamento | -0.23 | 9.92 | 0.11 | -0.12 | LiberationSans-Regular.ttf | L0 |
| body>div:nth-child(1)>div:nth-child(5)>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(2) | Cartão de crédito | 0.42 | 9.92 | 0.09 | 0.51 | LiberationSans-Bold.ttf | L0 |
| body>div:nth-child(1)>div:nth-child(5)>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(2)>td:nth-child(1) | Bandeira / detalhe | -0.23 | 9.81 | 0.09 | -0.14 | LiberationSans-Regular.ttf | L0 |
| body>div:nth-child(1)>div:nth-child(5)>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(2)>td:nth-child(2) | Aurora Card •••• 4242 | 0.39 | 9.81 | 0.11 | 0.51 | LiberationSans-Bold.ttf | L0 |
| body>div:nth-child(1)>div:nth-child(5)>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(3)>td:nth-child(1) | Autorização | -0.23 | 9.7 | 0.06 | -0.18 | LiberationSans-Regular.ttf | L0 |
| body>div:nth-child(1)>div:nth-child(5)>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(3)>td:nth-child(2) | AUTH-7F3A9C21 | 0.42 | 9.7 | 0.09 | 0.51 | LiberationSans-Bold.ttf | L0 |
| body>div:nth-child(1)>div:nth-child(5)>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(4)>td:nth-child(1) | Situação | -0.23 | 9.59 | 0.03 | -0.2 | LiberationSans-Regular.ttf | L0 |
| body>div:nth-child(1)>div:nth-child(5)>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(4)>td:nth-child(2) | Pago | 0.48 | 9.59 | 0.03 | 0.51 | LiberationSans-Bold.ttf | L0 |
| body>div:nth-child(1)>table:nth-child(4)>tfoot:nth-child(3)>tr:nth-child(2)>td:nth-child(1) | Desconto | 0.33 | 8 | -0.02 | 0.31 | LiberationSans-Regular.ttf | L0 |
| body>div:nth-child(1)>table:nth-child(4)>tfoot:nth-child(3)>tr:nth-child(2)>td:nth-child(2) | - R$ 5,00 | -0.29 | 8 | -0.02 | -0.31 | LiberationSans-Regular.ttf | L0 |
| body>div:nth-child(1)>table:nth-child(4)>tfoot:nth-child(3)>tr:nth-child(1)>td:nth-child(1) | Subtotal | 0.33 | 6.41 | -0.01 | 0.31 | LiberationSans-Regular.ttf | L0 |
| body>div:nth-child(1)>table:nth-child(4)>tfoot:nth-child(3)>tr:nth-child(1)>td:nth-child(2) | R$ 73,50 | -0.3 | 6.41 | -0.02 | -0.31 | LiberationSans-Regular.ttf | L0 |
| body>div:nth-child(1)>table:nth-child(4)>tfoot:nth-child(3)>tr:nth-child(3)>td:nth-child(1) | Total pago | 0.33 | 4.59 | -0.02 | 0.31 | LiberationSans-Bold.ttf | L0 |
| body>div:nth-child(1)>table:nth-child(4)>tfoot:nth-child(3)>tr:nth-child(3)>td:nth-child(2) | R$ 68,50 | -0.29 | 4.59 | -0.02 | -0.31 | LiberationSans-Bold.ttf | L0 |
| body>div:nth-child(1)>table:nth-child(4)>tbody:nth-child(2)>tr:nth-child(4)>td:nth-child(1)>span:nth-child(1) | SKU BEB-SUC-021 | 0.33 | 3.97 | 0.1 | 0.43 | LiberationSans-Regular.ttf | L0 |
| body>div:nth-child(1)>table:nth-child(4)>tbody:nth-child(2)>tr:nth-child(4)>td:nth-child(1) | Suco Natural de Laranja  | 0.33 | 3.5 | 4.2 | 4.53 | LiberationSans-Regular.ttf | L0 |
| body>div:nth-child(1)>table:nth-child(4)>tbody:nth-child(2)>tr:nth-child(4)>td:nth-child(2) | 1 | -1.24 | 3.5 | 0 | -1.23 | LiberationSans-Regular.ttf | L0 |
| body>div:nth-child(1)>table:nth-child(4)>tbody:nth-child(2)>tr:nth-child(4)>td:nth-child(3) | R$ 11,50 | -0.63 | 3.5 | 0.04 | -0.59 | LiberationSans-Regular.ttf | L0 |

## Match counts and node policy

- Chromium elements under html (head excluded) by policy: compared 63, inline-text-only 5, no-blitz-box 21
- vellora L0 boxes (elements, head excluded): 95; matched to a compared Chromium box: 62
- vellora-only — inline element (compared via text runs): 4 (e.g. body>div:nth-child(1)>header:nth-child(1)>address:nth-child(4)>br:nth-child(1); body>div:nth-child(1)>header:nth-child(1)>address:nth-child(4)>br:nth-child(2); body>div:nth-child(1)>header:nth-child(1)>address:nth-child(4)>br:nth-child(3))
- vellora-only — table row/group: not a Blitz layout node (zero box in walk): 21 (e.g. body>div:nth-child(1)>table:nth-child(2)>tbody:nth-child(1); body>div:nth-child(1)>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(1); body>div:nth-child(1)>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(2))
- vellora-only — html_normalize wrapper (no source node): 4 (e.g. body>div:nth-child(1)>table:nth-child(4)>tbody:nth-child(2)>tr:nth-child(1)>td:nth-child(1)>::vellora-wrapper(1); body>div:nth-child(1)>table:nth-child(4)>tbody:nth-child(2)>tr:nth-child(2)>td:nth-child(1)>::vellora-wrapper(1); body>div:nth-child(1)>table:nth-child(4)>tbody:nth-child(2)>tr:nth-child(3)>td:nth-child(1)>::vellora-wrapper(1))
- vellora-only — no Chromium node with this path: 4 (e.g. body>div:nth-child(1)>div:nth-child(7); body>div:nth-child(1)>p:nth-child(8); body>div:nth-child(1)>footer:nth-child(9))
- Chromium-only compared boxes (no vellora L0 box): 1 (e.g. body>div:nth-child(1)>footer:nth-child(7))
- Blitz layout-tree-only nodes (anonymous blocks / pseudo-elements the walk never visits): 0
- Policy: `inline-text-only` = Chromium `display:inline` non-replaced element (Blitz gives it no Taffy box; its text is compared as runs). `no-blitz-box` = table row/row-group that is not a Blitz layout node (zero box in the walk); listed, not scored. `no-layout` = Chromium has no layout object (display:none). Pseudo-elements are matched by `::before`/`::after` segments and never count toward `:nth-child`. Anonymous boxes: Chromium's are not exposed by DOMSnapshot; Blitz's appear only in B0 as `::blitz-anon(j)`. html_normalize wrappers are transparent in keys and listed as vellora-only.

## Text alignment

- vellora runs (non-blank, L0): 60; Chromium text fragments (non-blank): 60; matched pairs: 56 (0 joined across fragment/run boundaries)
- unmatched vellora runs: 4; unmatched Chromium fragments: 0; Chromium text with NO vellora owner (text vellora never shaped): 4

Unmatched vellora runs (first 4):

| owner | text |
| --- | --- |
| body>div:nth-child(1)>div:nth-child(7) | Volte sempre — seu próximo café especial já está esperando  |
| body>div:nth-child(1)>div:nth-child(7) | por você. |
| body>div:nth-child(1)>footer:nth-child(9) | Este recibo é um comprovante simplificado e não substitui documento fiscal. |
| body>div:nth-child(1)>footer:nth-child(9) | Cafeteria Aurora Ltda · www.cafeteria-aurora.example |

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
