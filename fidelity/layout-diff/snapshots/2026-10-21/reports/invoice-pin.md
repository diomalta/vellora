# Layout diff — invoice (pin)

> Continuous-flow comparison: Chromium lays the document out as ONE flow (no fragmentation) at the same viewport width vellora hands Blitz. It is comparable ONLY to vellora's PRE-pagination layers (B0, L0, layout_normalize passes) and says nothing about pagination (page breaks, repeated thead, page-local offsets, margin boxes).

Deltas are vellora − Chromium in CSS px. Paths abbreviate `html>body:nth-child(2)` as `body`.

## Environment

- date_utc: `2026-10-21T01:07:39Z`
- os: `darwin 27.0.0 arm64`
- cpu: `Apple M5 Pro`
- node: `v22.23.2`
- command: `node /Users/diomalta/Repositories/vellora/.claude/worktrees/wf_e3d702d1-528-2/fidelity/layout-diff/run.mjs --label pin`
- repo: `/Users/diomalta/Repositories/vellora/.claude/worktrees/wf_e3d702d1-528-2`
- rustc: `rustc 1.96.0 (ac68faa20 2026-05-25)`
- git_commit: `a704aa14767d2424b3e0097a0c2402867eba39e3`
- git_dirty: `clean`
- blitz: `blitz-0.3.0-alpha.5+2003ba5`
- chrome_path: `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`
- chrome_version: `Google Chrome 155.0.8059.85`
- templating_repo: `/Users/diomalta/Repositories/vellora/.claude/worktrees/wf_e3d702d1-528-2`
- chrome_user_agent: `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/155.0.0.0 Safari/537.36`
- crates: blitz-dom 0.3.0-alpha.5, blitz-html 0.3.0-alpha.5, blitz-traits 0.3.0-alpha.5, krilla 0.8.2, parley 0.10.0, stylo 0.18.0, taffy 0.11.0-experimental-cache-fix.3
- tools: puppeteer-core 25.15.0

## Input parity

- @page content box 672.3351 × 1001.6151 CSS px → Blitz viewport 672 × 1001 (`as u32` truncation in resolve_and_walk drops 0.3351 px of inline size; a KNOWN INPUT divergence vs Chromium print, not an engine difference). Chromium viewport set to the same 672 × 1001; documentElement.clientWidth = 672 (scrollbars hidden).
- Media: Blitz evaluates stylesheets as `screen` (DocumentConfig::media_type default; build_document never sets it). Chromium emulates `print` (matchMedia('print') = true). Fixture contains @media rules: no (media type is inert here).
- Fonts: Chromium loaded Inter 400 normal; Inter 700 normal; Helvetica Neue 400 normal; Helvetica Neue 700 normal; Arial 400 normal; Arial 700 normal from the bundled files (sha256 in env.fonts_sha256). vellora runs by face: LiberationSans-Bold.ttf 11, LiberationSans-Regular.ttf 199. DejaVu fallback runs (no Chromium counterpart): 0.
- Baselines: Chromium ascent measured for 11/11 face/size specs.
- html_normalize wrappers: recorded 35, located in the Blitz DOM 35.
- Blitz anonymous blocks (B0 only): 0; anonymous inline roots holding text (text Blitz shaped that vellora's DOM-children walk never reads): 0.
- Dump self-checks: run-metadata misalignments 0, layer order violations 0 (both expected 0).
- Input sha256: native 99c85b4aaa8aa295…, browser ab6bbb49c6d838bb…

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

- **enter (x/y/width) body>table:nth-child(1)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(1)** (event #3)
- introduced by: **B0** — RAW BLITZ: Blitz's own layout tree (B0) already differs from Chromium
- later layers that changed its max |Δ|: `collapsed_table_medium_border_insets_x` 14.47 → 11.09

| layer | status | dx | dy | dw | dh | dy basis |
| --- | --- | --- | --- | --- | --- | --- |
| B0 | diverged | 3 | 3 | -14.47 |  |  |
| L0 | diverged | 3 | 3 | -14.47 |  |  |
| vertical_margin_collapse | diverged | 3 | 3 | -14.47 |  |  |
| collapsed_table_medium_border_insets | diverged | 3 | 0 | -14.47 |  |  |
| painted_table_cell_text_baselines | diverged | 3 | 0 | -14.47 |  |  |
| fixed_table_widths | diverged | 3 | 0 | -14.47 |  |  |
| table_percent_widths | diverged | 3 | 0 | -14.47 |  |  |
| auto_table_compact_columns | diverged | 3 | 0 | -14.47 |  |  |
| collapsed_table_medium_border_insets_x | diverged | 0 | 0 | -11.09 |  |  |
| B0u | diverged | 3 | 3 | -14.97 |  |  |

Ancestor chain (compared boxes, root first; deltas = vellora − Chromium, CSS px):

| ancestor | collapsed_table_medium_border_insets_x dx,dy,dw,dh | B0 dx,dy,dw,dh | L0 dx,dy,dw,dh |
| --- | --- | --- | --- |
| html | 0, 0, 0, 132.55 | 0, 0, 0, 132.55 | 0, 0, 0, 132.55 |
| body | 0, 0, 0, 132.55 | 0, 0, 0, 132.55 | 0, 0, 0, 132.55 |
| body>table:nth-child(1) | 0, 0, 0, -0.25 | 0, 0, 0, 5.75 | 0, 0, 0, 5.75 |

## First divergent text run in collapsed_table_medium_border_insets_x

- **text "Acme Widgets LON" in body>table:nth-child(1)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(1)>div:nth-child(2)** (event #7)
- introduced by: **L0** — RAW BLITZ/PARLEY TEXT as read by vellora's walk (L0); no normalize pass involved
- later layers that changed its max |Δ|: `collapsed_table_medium_border_insets` 3 → 5.53
- Chromium fragment: "Acme Widgets LON" at x=0 y=72.53 w=230.48; vellora faces: LiberationSans-Bold.ttf

| layer | status | dx | dy | dw | dright | dy basis |
| --- | --- | --- | --- | --- | --- | --- |
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

| ancestor | collapsed_table_medium_border_insets_x dx,dy,dw,dh | B0 dx,dy,dw,dh | L0 dx,dy,dw,dh |
| --- | --- | --- | --- |
| html | 0, 0, 0, 132.55 | 0, 0, 0, 132.55 | 0, 0, 0, 132.55 |
| body | 0, 0, 0, 132.55 | 0, 0, 0, 132.55 | 0, 0, 0, 132.55 |
| body>table:nth-child(1) | 0, 0, 0, -0.25 | 0, 0, 0, 5.75 | 0, 0, 0, 5.75 |
| body>table:nth-child(1)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(1) | 0, 0, -11.09, -0.25 | 3, 3, -14.47, -0.25 | 3, 3, -14.47, -0.25 |

## First divergence per layer

| layer | first box | box Δ | first text | text Δ (dx, dy) |
| --- | --- | --- | --- | --- |
| B0 | enter (x/y/width) body>table:nth-child(1)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(1) | 3, 3, -14.47 | n/a (no text in B0) |  |
| L0 | enter (x/y/width) body>table:nth-child(1)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(1) | 3, 3, -14.47 | text "Acme Widgets LON" in body>table:nth-child(1)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(1)>div:nth-child(2) | 3, -2.53 |
| vertical_margin_collapse | enter (x/y/width) body>table:nth-child(1)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(1) | 3, 3, -14.47 | text "Acme Widgets LON" in body>table:nth-child(1)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(1)>div:nth-child(2) | 3, -2.53 |
| collapsed_table_medium_border_insets | enter (x/y/width) body>table:nth-child(1)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(1) | 3, 0, -14.47 | text "Acme Widgets LON" in body>table:nth-child(1)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(1)>div:nth-child(2) | 3, -5.53 |
| painted_table_cell_text_baselines | enter (x/y/width) body>table:nth-child(1)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(1) | 3, 0, -14.47 | text "Acme Widgets LON" in body>table:nth-child(1)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(1)>div:nth-child(2) | 3, -5.53 |
| fixed_table_widths | enter (x/y/width) body>table:nth-child(1)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(1) | 3, 0, -14.47 | text "Acme Widgets LON" in body>table:nth-child(1)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(1)>div:nth-child(2) | 3, -5.53 |
| table_percent_widths | enter (x/y/width) body>table:nth-child(1)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(1) | 3, 0, -14.47 | text "Acme Widgets LON" in body>table:nth-child(1)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(1)>div:nth-child(2) | 3, -5.53 |
| auto_table_compact_columns | enter (x/y/width) body>table:nth-child(1)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(1) | 3, 0, -14.47 | text "Acme Widgets LON" in body>table:nth-child(1)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(1)>div:nth-child(2) | 3, -5.53 |
| collapsed_table_medium_border_insets_x | enter (x/y/width) body>table:nth-child(1)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(1) | 0, 0, -11.09 | text "Acme Widgets LON" in body>table:nth-child(1)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(1)>div:nth-child(2) | 0, -5.53 |

## Per-layer error and pass effects

`moved` = boxes/runs whose geometry this layer changed vs the previous one; `better`/`worse` = moved closer to / further from Chromium (max |Δ| per item); `Σ` = summed change of that error.

| layer | box events diverged | text events diverged | mean abs box Δ (px) | boxes moved/better/worse (Σ) | runs moved/better/worse (Σ) |
| --- | --- | --- | --- | --- | --- |
| B0 | 313 | n/a | 61.51 |  |  |
| L0 | 313 | 210 | 61.51 | 0/0/0 (0) | 0/0/0 (0) |
| vertical_margin_collapse | 313 | 210 | 61.51 | 0/0/0 (0) | 0/0/0 (0) |
| collapsed_table_medium_border_insets | 310 | 210 | 54.28 | 218/181/0 (-1591.3) | 210/206/2 (-1786.04) |
| painted_table_cell_text_baselines | 310 | 210 | 54.28 | 0/0/0 (0) | 190/167/3 (-330.22) |
| fixed_table_widths | 310 | 210 | 54.28 | 0/0/0 (0) | 0/0/0 (0) |
| table_percent_widths | 310 | 210 | 54.28 | 0/0/0 (0) | 0/0/0 (0) |
| auto_table_compact_columns | 310 | 210 | 52.81 | 140/27/0 (-323.73) | 105/9/1 (-56.74) |
| collapsed_table_medium_border_insets_x | 309 | 202 | 52.77 | 194/11/0 (-9.54) | 192/14/0 (-27.75) |

## Top 20 box divergences in collapsed_table_medium_border_insets_x (absolute)

| path | dx | dy | dw | dh | introduced by |
| --- | --- | --- | --- | --- | --- |
| html | 0 | 0 | 0 | 132.55 | B0 |
| body | 0 | 0 | 0 | 132.55 | B0 |
| body>div:nth-child(5)>p:nth-child(2) | 0 | 114.72 | 0 | -0.78 | B0 |
| body>div:nth-child(5) | 0 | 114.22 | 0 | 0.33 | B0 |
| body>div:nth-child(5)>h3:nth-child(1) | 0 | 114.11 | 0 | 0.61 | B0 |
| body>div:nth-child(5)>p:nth-child(3) | 0 | 113.94 | 0 | 0.61 | B0 |
| body>table:nth-child(4)>tbody:nth-child(1)>tr:nth-child(4)>td:nth-child(1) | -0.44 | 113.81 | -1.56 | 0.19 | B0 |
| body>table:nth-child(4)>tbody:nth-child(1)>tr:nth-child(4)>td:nth-child(2) | 1.07 | 113.81 | -1.07 | 0.19 | B0 |
| body>table:nth-child(4)>tbody:nth-child(1)>tr:nth-child(3)>td:nth-child(1) | -0.44 | 111.22 | -1.56 | -0.41 | B0 |
| body>table:nth-child(4)>tbody:nth-child(1)>tr:nth-child(3)>td:nth-child(2) | 1.07 | 111.22 | -1.07 | -0.41 | B0 |
| body>table:nth-child(4)>tbody:nth-child(1)>tr:nth-child(2)>td:nth-child(1) | -0.44 | 108.13 | -1.56 | 0.09 | B0 |
| body>table:nth-child(4)>tbody:nth-child(1)>tr:nth-child(2)>td:nth-child(2) | 1.07 | 108.13 | -1.07 | 0.09 | B0 |
| body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(34)>td:nth-child(1) | 0 | 105.17 | -14.08 | 0.59 | B0 |
| body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(34)>td:nth-child(2) | -14.08 | 105.17 | 14.44 | 0.59 | B0 |
| body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(34)>td:nth-child(3) | 0.36 | 105.17 | -3.34 | 0.59 | B0 |
| body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(34)>td:nth-child(4) | -2.99 | 105.17 | -3.01 | 0.59 | B0 |
| body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(34)>td:nth-child(1)>span:nth-child(1) | -0.33 | 105.05 | -36.09 | 0.53 | B0 |
| body>table:nth-child(4) | -0.44 | 105.03 | 0.44 | 8.97 | B0 |
| body>table:nth-child(4)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(1) | -0.44 | 105.03 | -1.56 | 0.09 | B0 |
| body>table:nth-child(4)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(2) | 1.07 | 105.03 | -1.07 | 0.09 | B0 |

## Top 20 LOCAL box divergences

rdx/rdy = the error a box ADDS to what it inherits: after a previous compared sibling in the same row, relative to that sibling's right edge (dx+dw) and dy; after a stacked sibling, relative to its bottom edge (dy+dh); a first child, relative to its parent's dx/dy. Isolates where cumulative drift originates.

| path | rdx | rdy | dw | dh | introduced by |
| --- | --- | --- | --- | --- | --- |
| html | 0 | 0 | 0 | 132.55 | B0 |
| body | 0 | 0 | 0 | 132.55 | B0 |
| body>table:nth-child(3) | 0 | -0.02 | 0 | 103.17 | B0 |
| body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(1)>td:nth-child(1)>span:nth-child(1) | -0.33 | 0.38 | -36.09 | -0.47 | B0 |
| body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(2)>td:nth-child(1)>span:nth-child(1) | -0.33 | -0.12 | -36.09 | 0.53 | B0 |
| body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(3)>td:nth-child(1)>span:nth-child(1) | -0.33 | -0.12 | -36.09 | -0.47 | B0 |
| body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(4)>td:nth-child(1)>span:nth-child(1) | -0.33 | -0.12 | -36.09 | 0.53 | B0 |
| body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(5)>td:nth-child(1)>span:nth-child(1) | -0.33 | -0.12 | -36.09 | -0.47 | B0 |
| body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(6)>td:nth-child(1)>span:nth-child(1) | -0.33 | -0.12 | -36.09 | -0.47 | B0 |
| body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(7)>td:nth-child(1)>span:nth-child(1) | -0.33 | -0.12 | -36.09 | 0.53 | B0 |
| body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(8)>td:nth-child(1)>span:nth-child(1) | -0.33 | -0.12 | -36.09 | -0.47 | B0 |
| body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(9)>td:nth-child(1)>span:nth-child(1) | -0.33 | -0.12 | -36.09 | 0.53 | B0 |
| body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(10)>td:nth-child(1)>span:nth-child(1) | -0.33 | -0.12 | -36.09 | -0.47 | B0 |
| body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(11)>td:nth-child(1)>span:nth-child(1) | -0.33 | -0.12 | -36.09 | 0.53 | B0 |
| body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(12)>td:nth-child(1)>span:nth-child(1) | -0.33 | -0.12 | -36.09 | -0.47 | B0 |
| body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(13)>td:nth-child(1)>span:nth-child(1) | -0.33 | -0.12 | -36.09 | -0.47 | B0 |
| body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(14)>td:nth-child(1)>span:nth-child(1) | -0.33 | -0.12 | -36.09 | 0.53 | B0 |
| body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(15)>td:nth-child(1)>span:nth-child(1) | -0.33 | -0.12 | -36.09 | -0.47 | B0 |
| body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(16)>td:nth-child(1)>span:nth-child(1) | -0.33 | -0.12 | -36.09 | 0.53 | B0 |
| body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(17)>td:nth-child(1)>span:nth-child(1) | -0.33 | -0.12 | -36.09 | -0.47 | B0 |

## Top 20 text-run divergences in collapsed_table_medium_border_insets_x

| owner | text | dx | dy | dw | dright | faces | introduced by |
| --- | --- | --- | --- | --- | --- | --- | --- |
| body>div:nth-child(5)>p:nth-child(2) | Pagamento via transferência para a conta Banc... | 0 | 114.72 | 3.33 | 3.33 | LiberationSans-Regular.ttf | L0 |
| body>div:nth-child(5)>p:nth-child(2) | fatura INV-2026-00417 no campo de identificação. | 0 | 114.33 | -0.01 | -0.01 | LiberationSans-Regular.ttf | L0 |
| body>div:nth-child(5)>h3:nth-child(1) | INSTRUÇÕES DE PAGAMENTO | 0 | 114.11 | -0.01 | -0.01 | LiberationSans-Bold.ttf | L0 |
| body>div:nth-child(5)>p:nth-child(3) | Em caso de divergência nos itens, entre em co... | 0 | 113.94 | 0 | 0 | LiberationSans-Regular.ttf | L0 |
| body>table:nth-child(4)>tbody:nth-child(1)>tr:nth-child(3)>td:nth-child(1) | Imposto (8%) | -1.58 | 111.42 | 0.02 | -1.56 | LiberationSans-Regular.ttf | L0 |
| body>table:nth-child(4)>tbody:nth-child(1)>tr:nth-child(3)>td:nth-child(2) | R$ 3.757,40 | 0.43 | 111.42 | 0.01 | 0.43 | LiberationSans-Regular.ttf | L0 |
| body>table:nth-child(4)>tbody:nth-child(1)>tr:nth-child(4)>td:nth-child(1) | Total a pagar | -1.56 | 110.98 | 0 | -1.56 | LiberationSans-Bold.ttf | L0 |
| body>table:nth-child(4)>tbody:nth-child(1)>tr:nth-child(4)>td:nth-child(2) | R$ 50.724,90 | 0.43 | 110.98 | 0 | 0.43 | LiberationSans-Bold.ttf | L0 |
| body>table:nth-child(4)>tbody:nth-child(1)>tr:nth-child(2)>td:nth-child(1) | Desconto | -1.56 | 108.33 | 0 | -1.56 | LiberationSans-Regular.ttf | L0 |
| body>table:nth-child(4)>tbody:nth-child(1)>tr:nth-child(2)>td:nth-child(2) | - R$ 1.250,00 | 0.42 | 108.33 | 0.01 | 0.43 | LiberationSans-Regular.ttf | L0 |
| body>table:nth-child(4)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(1) | Subtotal | -1.56 | 105.23 | 0 | -1.56 | LiberationSans-Regular.ttf | L0 |
| body>table:nth-child(4)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(2) | R$ 48.217,50 | 0.42 | 105.23 | 0.02 | 0.43 | LiberationSans-Regular.ttf | L0 |
| body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(34)>td:nth-child(2) | 2 | 1.76 | 103.36 | -0.01 | 1.76 | LiberationSans-Regular.ttf | L0 |
| body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(34)>td:nth-child(3) | R$ 1.450,00 | 1.58 | 103.36 | 0.01 | 1.58 | LiberationSans-Regular.ttf | L0 |
| body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(34)>td:nth-child(4) | R$ 2.900,00 | 0.64 | 103.36 | 0.01 | 0.65 | LiberationSans-Regular.ttf | L0 |
| body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(34)>td:nth-child(1)>span:nth-child(1) | SKU SV-TRN-8 | -0.33 | 103.05 | 0.04 | -0.29 | LiberationSans-Regular.ttf | L0 |
| body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(34)>td:nth-child(1) | Treinamento operacional (turma 8h) | -0.33 | 102.36 | 0.04 | -0.28 | LiberationSans-Regular.ttf | L0 |
| body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(33)>td:nth-child(1)>span:nth-child(1) | SKU SV-INST | -0.33 | 100.45 | 0.03 | -0.3 | LiberationSans-Regular.ttf | L0 |
| body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(33)>td:nth-child(1) | Serviço de instalação e comissionamento | -0.33 | 99.77 | 0.05 | -0.28 | LiberationSans-Regular.ttf | L0 |
| body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(33)>td:nth-child(2) | 1 | 1.76 | 99.77 | -0.01 | 1.76 | LiberationSans-Regular.ttf | L0 |

## Match counts and node policy

- Chromium elements under html (head excluded) by policy: compared 220, no-blitz-box 46, inline-text-only 3
- vellora L0 boxes (elements, head excluded): 304; matched to a compared Chromium box: 220
- vellora-only — table row/group: not a Blitz layout node (zero box in walk): 46 (e.g. body>table:nth-child(1)>tbody:nth-child(1); body>table:nth-child(1)>tbody:nth-child(1)>tr:nth-child(1); body>table:nth-child(2)>tbody:nth-child(1))
- vellora-only — html_normalize wrapper (no source node): 35 (e.g. body>table:nth-child(1)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(1)>::vellora-wrapper(1); body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(1)>td:nth-child(1)>::vellora-wrapper(1); body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(2)>td:nth-child(1)>::vellora-wrapper(1))
- vellora-only — inline element (compared via text runs): 3 (e.g. body>table:nth-child(1)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(2)>div:nth-child(2)>div:nth-child(1)>span:nth-child(1); body>table:nth-child(1)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(2)>div:nth-child(2)>div:nth-child(2)>span:nth-child(1); body>table:nth-child(1)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(2)>div:nth-child(2)>div:nth-child(3)>span:nth-child(1))
- Chromium-only compared boxes (no vellora L0 box): 0
- Blitz layout-tree-only nodes (anonymous blocks / pseudo-elements the walk never visits): 0
- Policy: `inline-text-only` = Chromium `display:inline` non-replaced element (Blitz gives it no Taffy box; its text is compared as runs). `no-blitz-box` = table row/row-group that is not a Blitz layout node (zero box in the walk); listed, not scored. `no-layout` = Chromium has no layout object (display:none). Pseudo-elements are matched by `::before`/`::after` segments and never count toward `:nth-child`. Anonymous boxes: Chromium's are not exposed by DOMSnapshot; Blitz's appear only in B0 as `::blitz-anon(j)`. html_normalize wrappers are transparent in keys and listed as vellora-only.

## Text alignment

- vellora runs (non-blank, L0): 210; Chromium text fragments (non-blank): 213; matched pairs: 210 (2 joined across fragment/run boundaries)
- unmatched vellora runs: 0; unmatched Chromium fragments: 0; Chromium text with NO vellora owner (text vellora never shaped): 0

## Caveats

- Local macOS Chrome results are INDICATIVE; the authoritative run is the pinned Chrome for Testing on Linux CI (see fidelity/layout-diff/README.md).
- Text dy compares BASELINES when Chromium's ascent for the face/size was measured (probe page, zero-size inline-block on the baseline); otherwise vellora's text top (baseline − Parley ascent) vs Chromium's text-box top (`dy basis` column).
- L0 text positions already include `read_text_runs`' inline padding-right compensation, so 'raw Parley' text is not separated from vellora's reader.
