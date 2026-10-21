# Layout diff — boleto (pin)

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
- Fonts: Chromium loaded Vellora Sans 400 normal; Vellora Sans 700 normal; Arial 400 normal; Arial 700 normal; Vellora Mono 400 normal from the bundled files (sha256 in env.fonts_sha256). vellora runs by face: LiberationSans-Regular.ttf 62, LiberationSans-Bold.ttf 15, LiberationMono-Regular.ttf 2. DejaVu fallback runs (no Chromium counterpart): 0.
- Baselines: Chromium ascent measured for 12/12 face/size specs.
- html_normalize wrappers: recorded 24, located in the Blitz DOM 24.
- Blitz anonymous blocks (B0 only): 0; anonymous inline roots holding text (text Blitz shaped that vellora's DOM-children walk never reads): 0.
- Dump self-checks: run-metadata misalignments 0, layer order violations 0 (both expected 0).
- Input sha256: native 6cc266116374eef1…, browser 14b2f9840bd48f35…

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

- **enter (x/y/width) body>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(1)** (event #6)
- introduced by: **B0** — RAW BLITZ: Blitz's own layout tree (B0) already differs from Chromium
- later layers that changed its max |Δ|: `auto_table_compact_columns` 3 → 3.86

| layer | status | dx | dy | dw | dh | dy basis |
| --- | --- | --- | --- | --- | --- | --- |
| B0 | diverged | 3 | 2.94 | 0.39 |  |  |
| L0 | diverged | 3 | 2.94 | 0.39 |  |  |
| vertical_margin_collapse | diverged | 3 | 2.94 | 0.39 |  |  |
| collapsed_table_medium_border_insets | diverged | 3 | 2.94 | 0.39 |  |  |
| painted_table_cell_text_baselines | diverged | 3 | 2.94 | 0.39 |  |  |
| fixed_table_widths | diverged | 3 | 2.94 | 0.39 |  |  |
| table_percent_widths | diverged | 3 | 2.94 | 0.39 |  |  |
| auto_table_compact_columns | diverged | 3 | 2.94 | 3.86 |  |  |
| collapsed_table_medium_border_insets_x | diverged | 3 | 2.94 | 3.86 |  |  |
| B0u | diverged | 3 | 3.01 | 0.01 |  |  |

Ancestor chain (compared boxes, root first; deltas = vellora − Chromium, CSS px):

| ancestor | collapsed_table_medium_border_insets_x dx,dy,dw,dh | B0 dx,dy,dw,dh | L0 dx,dy,dw,dh |
| --- | --- | --- | --- |
| html | 0, 0, 0, 20.91 | 0, 0, 0, 20.91 | 0, 0, 0, 20.91 |
| body | 0, 0, 0, 20.91 | 0, 0, 0, 20.91 | 0, 0, 0, 20.91 |
| body>table:nth-child(2) | 0, -0.06, 0, -0.08 | 0, -0.06, 0, -0.08 | 0, -0.06, 0, -0.08 |

## First divergent text run in collapsed_table_medium_border_insets_x

- **text "999-9" in body>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(2)** (event #11)
- introduced by: **L0** — RAW BLITZ/PARLEY TEXT as read by vellora's walk (L0); no normalize pass involved
- later layers that changed its max |Δ|: `painted_table_cell_text_baselines` 7.44 → 9.44
- Chromium fragment: "999-9" at x=166.73 y=32.44 w=59.56; vellora faces: LiberationSans-Bold.ttf

| layer | status | dx | dy | dw | dright | dy basis |
| --- | --- | --- | --- | --- | --- | --- |
| B0 | n/a |  |  |  |  |  |
| L0 | diverged | 4.4 | -7.44 | 0 | 4.4 | baseline |
| vertical_margin_collapse | diverged | 4.4 | -7.44 | 0 | 4.4 | baseline |
| collapsed_table_medium_border_insets | diverged | 4.4 | -7.44 | 0 | 4.4 | baseline |
| painted_table_cell_text_baselines | diverged | 4.4 | -9.44 | 0 | 4.4 | baseline |
| fixed_table_widths | diverged | 4.4 | -9.44 | 0 | 4.4 | baseline |
| table_percent_widths | diverged | 4.4 | -9.44 | 0 | 4.4 | baseline |
| auto_table_compact_columns | diverged | 4.87 | -9.44 | 0 | 4.87 | baseline |
| collapsed_table_medium_border_insets_x | diverged | 4.87 | -9.44 | 0 | 4.87 | baseline |

Ancestor chain (compared boxes, root first; deltas = vellora − Chromium, CSS px):

| ancestor | collapsed_table_medium_border_insets_x dx,dy,dw,dh | B0 dx,dy,dw,dh | L0 dx,dy,dw,dh |
| --- | --- | --- | --- |
| html | 0, 0, 0, 20.91 | 0, 0, 0, 20.91 | 0, 0, 0, 20.91 |
| body | 0, 0, 0, 20.91 | 0, 0, 0, 20.91 | 0, 0, 0, 20.91 |
| body>table:nth-child(2) | 0, -0.06, 0, -0.08 | 0, -0.06, 0, -0.08 | 0, -0.06, 0, -0.08 |

## First divergence per layer

| layer | first box | box Δ | first text | text Δ (dx, dy) |
| --- | --- | --- | --- | --- |
| B0 | enter (x/y/width) body>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(1) | 3, 2.94, 0.39 | n/a (no text in B0) |  |
| L0 | enter (x/y/width) body>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(1) | 3, 2.94, 0.39 | text "999-9" in body>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(2) | 4.4, -7.44 |
| vertical_margin_collapse | enter (x/y/width) body>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(1) | 3, 2.94, 0.39 | text "999-9" in body>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(2) | 4.4, -7.44 |
| collapsed_table_medium_border_insets | enter (x/y/width) body>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(1) | 3, 2.94, 0.39 | text "999-9" in body>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(2) | 4.4, -7.44 |
| painted_table_cell_text_baselines | enter (x/y/width) body>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(1) | 3, 2.94, 0.39 | text "999-9" in body>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(2) | 4.4, -9.44 |
| fixed_table_widths | enter (x/y/width) body>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(1) | 3, 2.94, 0.39 | text "999-9" in body>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(2) | 4.4, -9.44 |
| table_percent_widths | enter (x/y/width) body>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(1) | 3, 2.94, 0.39 | text "999-9" in body>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(2) | 4.4, -9.44 |
| auto_table_compact_columns | enter (x/y/width) body>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(1) | 3, 2.94, 3.86 | text "999-9" in body>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(2) | 4.87, -9.44 |
| collapsed_table_medium_border_insets_x | enter (x/y/width) body>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(1) | 3, 2.94, 3.86 | text "999-9" in body>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(2) | 4.87, -9.44 |

## Per-layer error and pass effects

`moved` = boxes/runs whose geometry this layer changed vs the previous one; `better`/`worse` = moved closer to / further from Chromium (max |Δ| per item); `Σ` = summed change of that error.

| layer | box events diverged | text events diverged | mean abs box Δ (px) | boxes moved/better/worse (Σ) | runs moved/better/worse (Σ) |
| --- | --- | --- | --- | --- | --- |
| B0 | 121 | n/a | 33.7 |  |  |
| L0 | 121 | 75 | 33.7 | 0/0/0 (0) | 0/0/0 (0) |
| vertical_margin_collapse | 121 | 75 | 33.7 | 0/0/0 (0) | 0/0/0 (0) |
| collapsed_table_medium_border_insets | 121 | 75 | 33.7 | 0/0/0 (0) | 0/0/0 (0) |
| painted_table_cell_text_baselines | 121 | 75 | 33.7 | 0/0/0 (0) | 71/32/7 (-49.22) |
| fixed_table_widths | 116 | 72 | 19.61 | 61/44/0 (-1155.62) | 64/36/10 (-153.6) |
| table_percent_widths | 116 | 72 | 19.61 | 0/0/0 (0) | 0/0/0 (0) |
| auto_table_compact_columns | 116 | 72 | 19.61 | 4/0/1 (0.47) | 2/0/1 (0.47) |
| collapsed_table_medium_border_insets_x | 116 | 72 | 19.61 | 0/0/0 (0) | 0/0/0 (0) |

## Top 20 box divergences in collapsed_table_medium_border_insets_x (absolute)

| path | dx | dy | dw | dh | introduced by |
| --- | --- | --- | --- | --- | --- |
| body>table:nth-child(6)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(1)>span:nth-child(1) | 0.45 | 6.73 | -61.16 | 0.3 | B0 |
| body>table:nth-child(6)>tbody:nth-child(1)>tr:nth-child(2)>td:nth-child(1)>span:nth-child(1) | 0.45 | 9.05 | -61.16 | 0.3 | B0 |
| body>table:nth-child(6)>tbody:nth-child(1)>tr:nth-child(5)>td:nth-child(1)>span:nth-child(1) | 0.45 | 3.11 | -61.16 | 0.3 | B0 |
| body>table:nth-child(3)>tbody:nth-child(1)>tr:nth-child(2)>td:nth-child(2)>span:nth-child(1) | 0.8 | 2.91 | -60.56 | 0.3 | B0 |
| body>table:nth-child(3)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(1)>span:nth-child(1) | 0.45 | 0.98 | -57.22 | 0.3 | B0 |
| body>table:nth-child(6)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(2)>span:nth-child(1) | 1.2 | 6.73 | 56.34 | 0.3 | B0 |
| body>table:nth-child(6)>tbody:nth-child(1)>tr:nth-child(2)>td:nth-child(2)>span:nth-child(1) | 1.2 | 9.05 | 56.34 | -11.41 | B0 |
| body>table:nth-child(6)>tbody:nth-child(1)>tr:nth-child(3)>td:nth-child(4)>span:nth-child(1) | 1.2 | -0.73 | 56.34 | 0.3 | B0 |
| body>table:nth-child(6)>tbody:nth-child(1)>tr:nth-child(4)>td:nth-child(4)>span:nth-child(1) | 1.2 | 1.19 | 56.34 | 0.3 | B0 |
| body>table:nth-child(6)>tbody:nth-child(1)>tr:nth-child(5)>td:nth-child(2)>span:nth-child(1) | 1.2 | 3.11 | 56.34 | 0.3 | B0 |
| body>table:nth-child(6)>tbody:nth-child(1)>tr:nth-child(6)>td:nth-child(1)>span:nth-child(1) | 1.2 | 5.03 | 56.34 | 0.3 | B0 |
| body>table:nth-child(6)>tbody:nth-child(1)>tr:nth-child(7)>td:nth-child(1)>span:nth-child(1) | 1.2 | 6.95 | 56.34 | 0.3 | B0 |
| body>table:nth-child(6)>tbody:nth-child(1)>tr:nth-child(8)>td:nth-child(1)>span:nth-child(1) | 1.2 | 8.88 | 56.34 | -0.7 | B0 |
| body>table:nth-child(6)>tbody:nth-child(1)>tr:nth-child(3)>td:nth-child(3)>span:nth-child(1) | 0.95 | -0.73 | -54.66 | 0.3 | B0 |
| body>table:nth-child(6)>tbody:nth-child(1)>tr:nth-child(4)>td:nth-child(3)>span:nth-child(1) | 0.95 | 1.19 | -54.66 | 0.3 | B0 |
| body>table:nth-child(7)>thead:nth-child(1)>tr:nth-child(1)>td:nth-child(2)>span:nth-child(1) | 0.8 | 14.23 | 53.44 | 0.3 | B0 |
| body>table:nth-child(3)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(2)>span:nth-child(1) | 1.14 | 0.98 | 52.41 | 0.3 | B0 |
| body>table:nth-child(3)>tbody:nth-child(1)>tr:nth-child(2)>td:nth-child(3)>span:nth-child(1) | 1.14 | 2.91 | 52.41 | 0.3 | B0 |
| body>table:nth-child(7)>thead:nth-child(1)>tr:nth-child(1)>td:nth-child(1)>span:nth-child(1) | 0.45 | 14.23 | -30.56 | 0.3 | B0 |
| body>table:nth-child(7)>thead:nth-child(1)>tr:nth-child(1)>td:nth-child(3)>span:nth-child(1) | 1.14 | 14.23 | -29.59 | 0.3 | B0 |

## Top 20 LOCAL box divergences

rdx/rdy = the error a box ADDS to what it inherits: after a previous compared sibling in the same row, relative to that sibling's right edge (dx+dw) and dy; after a stacked sibling, relative to its bottom edge (dy+dh); a first child, relative to its parent's dx/dy. Isolates where cumulative drift originates.

| path | rdx | rdy | dw | dh | introduced by |
| --- | --- | --- | --- | --- | --- |
| body>table:nth-child(6)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(1)>span:nth-child(1) | 0.95 | 0.73 | -61.16 | 0.3 | B0 |
| body>table:nth-child(6)>tbody:nth-child(1)>tr:nth-child(2)>td:nth-child(1)>span:nth-child(1) | 0.95 | 0.73 | -61.16 | 0.3 | B0 |
| body>table:nth-child(6)>tbody:nth-child(1)>tr:nth-child(5)>td:nth-child(1)>span:nth-child(1) | 0.95 | 0.73 | -61.16 | 0.3 | B0 |
| body>table:nth-child(3)>tbody:nth-child(1)>tr:nth-child(2)>td:nth-child(2)>span:nth-child(1) | 0.95 | 0.73 | -60.56 | 0.3 | B0 |
| body>table:nth-child(3)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(1)>span:nth-child(1) | 0.95 | 0.73 | -57.22 | 0.3 | B0 |
| body>table:nth-child(6)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(2)>span:nth-child(1) | 0.95 | 0.73 | 56.34 | 0.3 | B0 |
| body>table:nth-child(6)>tbody:nth-child(1)>tr:nth-child(2)>td:nth-child(2)>span:nth-child(1) | 0.95 | 0.73 | 56.34 | -11.41 | B0 |
| body>table:nth-child(6)>tbody:nth-child(1)>tr:nth-child(3)>td:nth-child(4)>span:nth-child(1) | 0.95 | 0.74 | 56.34 | 0.3 | B0 |
| body>table:nth-child(6)>tbody:nth-child(1)>tr:nth-child(4)>td:nth-child(4)>span:nth-child(1) | 0.95 | 0.74 | 56.34 | 0.3 | B0 |
| body>table:nth-child(6)>tbody:nth-child(1)>tr:nth-child(5)>td:nth-child(2)>span:nth-child(1) | 0.95 | 0.73 | 56.34 | 0.3 | B0 |
| body>table:nth-child(6)>tbody:nth-child(1)>tr:nth-child(6)>td:nth-child(1)>span:nth-child(1) | 0.95 | 0.73 | 56.34 | 0.3 | B0 |
| body>table:nth-child(6)>tbody:nth-child(1)>tr:nth-child(7)>td:nth-child(1)>span:nth-child(1) | 0.95 | 0.73 | 56.34 | 0.3 | B0 |
| body>table:nth-child(6)>tbody:nth-child(1)>tr:nth-child(8)>td:nth-child(1)>span:nth-child(1) | 0.95 | 0.73 | 56.34 | -0.7 | B0 |
| body>table:nth-child(6)>tbody:nth-child(1)>tr:nth-child(3)>td:nth-child(3)>span:nth-child(1) | 0.95 | 0.74 | -54.66 | 0.3 | B0 |
| body>table:nth-child(6)>tbody:nth-child(1)>tr:nth-child(4)>td:nth-child(3)>span:nth-child(1) | 0.95 | 0.74 | -54.66 | 0.3 | B0 |
| body>table:nth-child(7)>thead:nth-child(1)>tr:nth-child(1)>td:nth-child(2)>span:nth-child(1) | 0.95 | 0.73 | 53.44 | 0.3 | B0 |
| body>table:nth-child(3)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(2)>span:nth-child(1) | 0.95 | 0.73 | 52.41 | 0.3 | B0 |
| body>table:nth-child(3)>tbody:nth-child(1)>tr:nth-child(2)>td:nth-child(3)>span:nth-child(1) | 0.95 | 0.73 | 52.41 | 0.3 | B0 |
| body>table:nth-child(7)>thead:nth-child(1)>tr:nth-child(1)>td:nth-child(1)>span:nth-child(1) | 0.95 | 0.73 | -30.56 | 0.3 | B0 |
| body>table:nth-child(7)>thead:nth-child(1)>tr:nth-child(1)>td:nth-child(3)>span:nth-child(1) | 0.95 | 0.73 | -29.59 | 0.3 | B0 |

## Top 20 text-run divergences in collapsed_table_medium_border_insets_x

| owner | text | dx | dy | dw | dright | faces | introduced by |
| --- | --- | --- | --- | --- | --- | --- | --- |
| body>table:nth-child(6)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(2)>span:nth-child(1) | VENCIMENTO | 57.61 | 4.73 | 0.03 | 57.64 | LiberationSans-Regular.ttf | L0 |
| body>table:nth-child(6)>tbody:nth-child(1)>tr:nth-child(3)>td:nth-child(4)>span:nth-child(1) | NOSSO NÚMERO | 57.6 | -2.73 | 0.04 | 57.64 | LiberationSans-Regular.ttf | L0 |
| body>table:nth-child(6)>tbody:nth-child(1)>tr:nth-child(7)>td:nth-child(1)>span:nth-child(1) | (+) MORA / MULTA | 57.6 | 4.95 | 0.04 | 57.64 | LiberationSans-Regular.ttf | L0 |
| body>table:nth-child(6)>tbody:nth-child(1)>tr:nth-child(6)>td:nth-child(1)>span:nth-child(1) | (-) OUTRAS DEDUÇÕES | 57.57 | 3.03 | 0.07 | 57.64 | LiberationSans-Regular.ttf | L0 |
| body>table:nth-child(6)>tbody:nth-child(1)>tr:nth-child(8)>td:nth-child(1)>span:nth-child(1) | (=) VALOR COBRADO | 57.57 | 6.88 | 0.07 | 57.64 | LiberationSans-Regular.ttf | L0 |
| body>table:nth-child(6)>tbody:nth-child(1)>tr:nth-child(4)>td:nth-child(4)>span:nth-child(1) | (=) VALOR DO DOCUMENTO | 57.56 | -0.81 | 0.08 | 57.64 | LiberationSans-Regular.ttf | L0 |
| body>table:nth-child(6)>tbody:nth-child(1)>tr:nth-child(5)>td:nth-child(2)>span:nth-child(1) | (-) DESCONTO / ABATIMENTO | 57.55 | 1.11 | 0.09 | 57.64 | LiberationSans-Regular.ttf | L0 |
| body>table:nth-child(3)>tbody:nth-child(1)>tr:nth-child(2)>td:nth-child(3)>span:nth-child(1) | VALOR DO DOCUMENTO | 53.69 | 0.91 | 0.07 | 53.76 | LiberationSans-Regular.ttf | L0 |
| body>table:nth-child(3)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(2)>span:nth-child(1) | AGÊNCIA / CÓDIGO DO BENEFICIÁRIO | 53.65 | -1.02 | 0.11 | 53.76 | LiberationSans-Regular.ttf | L0 |
| body>table:nth-child(7)>thead:nth-child(1)>tr:nth-child(1)>td:nth-child(3)>span:nth-child(1) | VALOR | -27.92 | 12.23 | 0.02 | -27.9 | LiberationSans-Regular.ttf | L0 |
| body>div:nth-child(9) | XXXX-TESTE. | 0.01 | 21.41 | 0 | 0.01 | LiberationSans-Regular.ttf | L0 |
| body>div:nth-child(9) | Documento de cobrança fictício gerado por vel... | 0 | 20.91 | 0 | 0 | LiberationSans-Regular.ttf | L0 |
| body>div:nth-child(8)>span:nth-child(1) | CÓDIGO DE BARRAS (REPRESENTAÇÃO TEXTUAL — NÃO... | 0 | 20 | 0.21 | 0.21 | LiberationMono-Regular.ttf | L0 |
| body>div:nth-child(8) | 99991999900000123459990000012345670000004200 | 0 | 19.53 | 0.16 | 0.16 | LiberationMono-Regular.ttf | L0 |
| body>table:nth-child(7)>tbody:nth-child(2)>tr:nth-child(3)>td:nth-child(1) | 06/2026 | -0.55 | 16.16 | 0 | -0.55 | LiberationSans-Regular.ttf | L0 |
| body>table:nth-child(7)>tbody:nth-child(2)>tr:nth-child(3)>td:nth-child(2) | Taxa de processamento | -1.2 | 16.16 | 0.03 | -1.17 | LiberationSans-Regular.ttf | L0 |
| body>table:nth-child(7)>tbody:nth-child(2)>tr:nth-child(3)>td:nth-child(3) | R$ 46,50 | 0.14 | 16.16 | 0.01 | 0.15 | LiberationSans-Regular.ttf | L0 |
| body>table:nth-child(7)>tbody:nth-child(2)>tr:nth-child(2)>td:nth-child(1) | 06/2026 | -0.55 | 14.75 | 0 | -0.55 | LiberationSans-Regular.ttf | L0 |
| body>table:nth-child(7)>tbody:nth-child(2)>tr:nth-child(2)>td:nth-child(2) | Usuários adicionais (3x) | -1.2 | 14.75 | 0.03 | -1.17 | LiberationSans-Regular.ttf | L0 |
| body>table:nth-child(7)>tbody:nth-child(2)>tr:nth-child(2)>td:nth-child(3) | R$ 297,00 | 0.14 | 14.75 | 0 | 0.14 | LiberationSans-Regular.ttf | L0 |

## Match counts and node policy

- Chromium elements under html (head excluded) by policy: compared 82, no-blitz-box 25, inline-text-only 44
- vellora L0 boxes (elements, head excluded): 175; matched to a compared Chromium box: 82
- vellora-only — table row/group: not a Blitz layout node (zero box in walk): 25 (e.g. body>table:nth-child(2)>tbody:nth-child(1); body>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(1); body>table:nth-child(3)>tbody:nth-child(1))
- vellora-only — html_normalize wrapper (no source node): 24 (e.g. body>table:nth-child(3)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(1)>::vellora-wrapper(1); body>table:nth-child(3)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(2)>::vellora-wrapper(1); body>table:nth-child(3)>tbody:nth-child(1)>tr:nth-child(2)>td:nth-child(1)>::vellora-wrapper(1))
- vellora-only — inline element (compared via text runs): 44 (e.g. body>table:nth-child(3)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(1)>span:nth-child(2); body>table:nth-child(3)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(2)>span:nth-child(2); body>table:nth-child(3)>tbody:nth-child(1)>tr:nth-child(2)>td:nth-child(1)>span:nth-child(2))
- Chromium-only compared boxes (no vellora L0 box): 0
- Blitz layout-tree-only nodes (anonymous blocks / pseudo-elements the walk never visits): 0
- Policy: `inline-text-only` = Chromium `display:inline` non-replaced element (Blitz gives it no Taffy box; its text is compared as runs). `no-blitz-box` = table row/row-group that is not a Blitz layout node (zero box in the walk); listed, not scored. `no-layout` = Chromium has no layout object (display:none). Pseudo-elements are matched by `::before`/`::after` segments and never count toward `:nth-child`. Anonymous boxes: Chromium's are not exposed by DOMSnapshot; Blitz's appear only in B0 as `::blitz-anon(j)`. html_normalize wrappers are transparent in keys and listed as vellora-only.

## Text alignment

- vellora runs (non-blank, L0): 77; Chromium text fragments (non-blank): 79; matched pairs: 76 (1 joined across fragment/run boundaries)
- unmatched vellora runs: 1; unmatched Chromium fragments: 2; Chromium text with NO vellora owner (text vellora never shaped): 0

Unmatched vellora runs (first 1):

| owner | text |
| --- | --- |
| body>table:nth-child(6)>tbody:nth-child(1)>tr:nth-child(2)>td:nth-child(2)>span:nth-child(1) | AGÊNCIA / CÓDIGO DO BENEFICIÁRIO |

Unmatched Chromium fragments (first 2):

| owner | text |
| --- | --- |
| body>table:nth-child(6)>tbody:nth-child(1)>tr:nth-child(2)>td:nth-child(2)>span:nth-child(1) | AGÊNCIA / CÓDIGO DO |
| body>table:nth-child(6)>tbody:nth-child(1)>tr:nth-child(2)>td:nth-child(2)>span:nth-child(1) | BENEFICIÁRIO |

## Caveats

- Local macOS Chrome results are INDICATIVE; the authoritative run is the pinned Chrome for Testing on Linux CI (see fidelity/layout-diff/README.md).
- Text dy compares BASELINES when Chromium's ascent for the face/size was measured (probe page, zero-size inline-block on the baseline); otherwise vellora's text top (baseline − Parley ascent) vs Chromium's text-box top (`dy basis` column).
- L0 text positions already include `read_text_runs`' inline padding-right compensation, so 'raw Parley' text is not separated from vellora's reader.
