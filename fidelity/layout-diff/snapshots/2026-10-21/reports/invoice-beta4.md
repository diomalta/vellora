# Layout diff — invoice (beta4)

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

| layer | status | dx | dy | dw | dh | dy basis |
| --- | --- | --- | --- | --- | --- | --- |
| B0 | diverged | 0 | 0 | -10.47 |  |  |
| L0 | diverged | 0 | 0 | -10.47 |  |  |
| vertical_margin_collapse | diverged | 0 | 0 | -10.47 |  |  |
| collapsed_table_medium_border_insets | diverged | 0 | 0 | -10.47 |  |  |
| painted_table_cell_text_baselines | diverged | 0 | 0 | -10.47 |  |  |
| fixed_table_widths | diverged | 0 | 0 | -10.47 |  |  |
| table_percent_widths | diverged | 0 | 0 | -10.47 |  |  |
| auto_table_compact_columns | diverged | 0 | 0 | -10.47 |  |  |
| collapsed_table_medium_border_insets_x | diverged | 0 | 0 | -10.47 |  |  |
| B0u | diverged | 0 | 0 | -10.47 |  |  |

Ancestor chain (compared boxes, root first; deltas = vellora − Chromium, CSS px):

| ancestor | collapsed_table_medium_border_insets_x dx,dy,dw,dh | B0 dx,dy,dw,dh | L0 dx,dy,dw,dh |
| --- | --- | --- | --- |
| html | 0, 0, 0, 3.55 | 0, 0, 0, 3.55 | 0, 0, 0, 3.55 |
| body | 0, 0, 0, 3.55 | 0, 0, 0, 3.55 | 0, 0, 0, 3.55 |
| body>table:nth-child(1) | 0, 0, 0, -0.25 | 0, 0, 0, -0.25 | 0, 0, 0, -0.25 |

## First divergent text run in collapsed_table_medium_border_insets_x

- **text "EMITENTE" in body>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(1)>div:nth-child(1)** (event #41)
- introduced by: **L0** — RAW BLITZ/PARLEY TEXT as read by vellora's walk (L0); no normalize pass involved
- later layers that changed its max |Δ|: `painted_table_cell_text_baselines` 1.11 → 1.14
- Chromium fragment: "EMITENTE" at x=19.89 y=197.14 w=63.69; vellora faces: LiberationSans-Regular.ttf

| layer | status | dx | dy | dw | dright | dy basis |
| --- | --- | --- | --- | --- | --- | --- |
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

| ancestor | collapsed_table_medium_border_insets_x dx,dy,dw,dh | B0 dx,dy,dw,dh | L0 dx,dy,dw,dh |
| --- | --- | --- | --- |
| html | 0, 0, 0, 3.55 | 0, 0, 0, 3.55 | 0, 0, 0, 3.55 |
| body | 0, 0, 0, 3.55 | 0, 0, 0, 3.55 | 0, 0, 0, 3.55 |
| body>table:nth-child(2) | 0, -0.03, 0, 2.14 | 0, -0.03, 0, 2.14 | 0, -0.03, 0, 2.14 |
| body>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(1) | 0.5, 0.47, -11.5, 1.14 | 0.5, 0.47, -11.5, 1.14 | 0.5, 0.47, -11.5, 1.14 |

## First divergence per layer

| layer | first box | box Δ | first text | text Δ (dx, dy) |
| --- | --- | --- | --- | --- |
| B0 | enter (x/y/width) body>table:nth-child(1)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(1) | 0, 0, -10.47 | n/a (no text in B0) |  |
| L0 | enter (x/y/width) body>table:nth-child(1)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(1) | 0, 0, -10.47 | text "EMITENTE" in body>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(1)>div:nth-child(1) | 1.11, 0.86 |
| vertical_margin_collapse | enter (x/y/width) body>table:nth-child(1)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(1) | 0, 0, -10.47 | text "EMITENTE" in body>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(1)>div:nth-child(1) | 1.11, 0.86 |
| collapsed_table_medium_border_insets | enter (x/y/width) body>table:nth-child(1)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(1) | 0, 0, -10.47 | text "EMITENTE" in body>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(1)>div:nth-child(1) | 1.11, 0.86 |
| painted_table_cell_text_baselines | enter (x/y/width) body>table:nth-child(1)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(1) | 0, 0, -10.47 | text "EMITENTE" in body>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(1)>div:nth-child(1) | 1.11, -1.14 |
| fixed_table_widths | enter (x/y/width) body>table:nth-child(1)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(1) | 0, 0, -10.47 | text "EMITENTE" in body>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(1)>div:nth-child(1) | 1.11, -1.14 |
| table_percent_widths | enter (x/y/width) body>table:nth-child(1)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(1) | 0, 0, -10.47 | text "EMITENTE" in body>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(1)>div:nth-child(1) | 1.11, -1.14 |
| auto_table_compact_columns | enter (x/y/width) body>table:nth-child(1)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(1) | 0, 0, -10.47 | text "EMITENTE" in body>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(1)>div:nth-child(1) | 1.11, -1.14 |
| collapsed_table_medium_border_insets_x | enter (x/y/width) body>table:nth-child(1)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(1) | 0, 0, -10.47 | text "EMITENTE" in body>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(1)>div:nth-child(1) | 1.11, -1.14 |

## Per-layer error and pass effects

`moved` = boxes/runs whose geometry this layer changed vs the previous one; `better`/`worse` = moved closer to / further from Chromium (max |Δ| per item); `Σ` = summed change of that error.

| layer | box events diverged | text events diverged | mean abs box Δ (px) | boxes moved/better/worse (Σ) | runs moved/better/worse (Σ) |
| --- | --- | --- | --- | --- | --- |
| B0 | 309 | n/a | 24.59 |  |  |
| L0 | 309 | 200 | 24.59 | 0/0/0 (0) | 0/0/0 (0) |
| vertical_margin_collapse | 309 | 200 | 24.59 | 0/0/0 (0) | 0/0/0 (0) |
| collapsed_table_medium_border_insets | 309 | 200 | 24.59 | 0/0/0 (0) | 0/0/0 (0) |
| painted_table_cell_text_baselines | 309 | 165 | 24.59 | 0/0/0 (0) | 190/109/1 (-210.16) |
| fixed_table_widths | 309 | 165 | 24.59 | 0/0/0 (0) | 0/0/0 (0) |
| table_percent_widths | 309 | 165 | 24.59 | 0/0/0 (0) | 0/0/0 (0) |
| auto_table_compact_columns | 309 | 176 | 12.91 | 140/140/0 (-2568.2) | 105/35/70 (364.83) |
| collapsed_table_medium_border_insets_x | 309 | 176 | 12.91 | 0/0/0 (0) | 0/0/0 (0) |

## Top 20 box divergences in collapsed_table_medium_border_insets_x (absolute)

| path | dx | dy | dw | dh | introduced by |
| --- | --- | --- | --- | --- | --- |
| body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(1)>td:nth-child(1)>span:nth-child(1) | -0.33 | 2.45 | -39.09 | -0.47 | B0 |
| body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(2)>td:nth-child(1)>span:nth-child(1) | -0.33 | 2.05 | -39.09 | 0.53 | B0 |
| body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(3)>td:nth-child(1)>span:nth-child(1) | -0.33 | 2.64 | -39.09 | -0.47 | B0 |
| body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(4)>td:nth-child(1)>span:nth-child(1) | -0.33 | 2.23 | -39.09 | 0.53 | B0 |
| body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(5)>td:nth-child(1)>span:nth-child(1) | -0.33 | 2.83 | -39.09 | -0.47 | B0 |
| body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(6)>td:nth-child(1)>span:nth-child(1) | -0.33 | 2.42 | -39.09 | -0.47 | B0 |
| body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(7)>td:nth-child(1)>span:nth-child(1) | -0.33 | 2.02 | -39.09 | 0.53 | B0 |
| body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(8)>td:nth-child(1)>span:nth-child(1) | -0.33 | 2.61 | -39.09 | -0.47 | B0 |
| body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(9)>td:nth-child(1)>span:nth-child(1) | -0.33 | 2.2 | -39.09 | 0.53 | B0 |
| body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(10)>td:nth-child(1)>span:nth-child(1) | -0.33 | 2.8 | -39.09 | -0.47 | B0 |
| body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(11)>td:nth-child(1)>span:nth-child(1) | -0.33 | 2.39 | -39.09 | 0.53 | B0 |
| body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(12)>td:nth-child(1)>span:nth-child(1) | -0.33 | 2.98 | -39.09 | -0.47 | B0 |
| body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(13)>td:nth-child(1)>span:nth-child(1) | -0.33 | 2.58 | -39.09 | -0.47 | B0 |
| body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(14)>td:nth-child(1)>span:nth-child(1) | -0.33 | 2.17 | -39.09 | 0.53 | B0 |
| body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(15)>td:nth-child(1)>span:nth-child(1) | -0.33 | 2.77 | -39.09 | -0.47 | B0 |
| body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(16)>td:nth-child(1)>span:nth-child(1) | -0.33 | 2.36 | -39.09 | 0.53 | B0 |
| body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(17)>td:nth-child(1)>span:nth-child(1) | -0.33 | 2.95 | -39.09 | -0.47 | B0 |
| body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(18)>td:nth-child(1)>span:nth-child(1) | -0.33 | 2.55 | -39.09 | 0.53 | B0 |
| body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(19)>td:nth-child(1)>span:nth-child(1) | -0.33 | 3.14 | -39.09 | -0.47 | B0 |
| body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(20)>td:nth-child(1)>span:nth-child(1) | -0.33 | 2.73 | -39.09 | 0.53 | B0 |

## Top 20 LOCAL box divergences

rdx/rdy = the error a box ADDS to what it inherits: after a previous compared sibling in the same row, relative to that sibling's right edge (dx+dw) and dy; after a stacked sibling, relative to its bottom edge (dy+dh); a first child, relative to its parent's dx/dy. Isolates where cumulative drift originates.

| path | rdx | rdy | dw | dh | introduced by |
| --- | --- | --- | --- | --- | --- |
| body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(1)>td:nth-child(1)>span:nth-child(1) | -0.33 | 0.38 | -39.09 | -0.47 | B0 |
| body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(2)>td:nth-child(1)>span:nth-child(1) | -0.33 | -1.12 | -39.09 | 0.53 | B0 |
| body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(3)>td:nth-child(1)>span:nth-child(1) | -0.33 | -0.12 | -39.09 | -0.47 | B0 |
| body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(4)>td:nth-child(1)>span:nth-child(1) | -0.33 | -1.12 | -39.09 | 0.53 | B0 |
| body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(5)>td:nth-child(1)>span:nth-child(1) | -0.33 | -0.12 | -39.09 | -0.47 | B0 |
| body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(6)>td:nth-child(1)>span:nth-child(1) | -0.33 | -0.12 | -39.09 | -0.47 | B0 |
| body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(7)>td:nth-child(1)>span:nth-child(1) | -0.33 | -1.12 | -39.09 | 0.53 | B0 |
| body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(8)>td:nth-child(1)>span:nth-child(1) | -0.33 | -0.12 | -39.09 | -0.47 | B0 |
| body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(9)>td:nth-child(1)>span:nth-child(1) | -0.33 | -1.12 | -39.09 | 0.53 | B0 |
| body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(10)>td:nth-child(1)>span:nth-child(1) | -0.33 | -0.12 | -39.09 | -0.47 | B0 |
| body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(11)>td:nth-child(1)>span:nth-child(1) | -0.33 | -1.12 | -39.09 | 0.53 | B0 |
| body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(12)>td:nth-child(1)>span:nth-child(1) | -0.33 | -0.12 | -39.09 | -0.47 | B0 |
| body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(13)>td:nth-child(1)>span:nth-child(1) | -0.33 | -0.12 | -39.09 | -0.47 | B0 |
| body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(14)>td:nth-child(1)>span:nth-child(1) | -0.33 | -1.12 | -39.09 | 0.53 | B0 |
| body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(15)>td:nth-child(1)>span:nth-child(1) | -0.33 | -0.12 | -39.09 | -0.47 | B0 |
| body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(16)>td:nth-child(1)>span:nth-child(1) | -0.33 | -1.12 | -39.09 | 0.53 | B0 |
| body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(17)>td:nth-child(1)>span:nth-child(1) | -0.33 | -0.12 | -39.09 | -0.47 | B0 |
| body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(18)>td:nth-child(1)>span:nth-child(1) | -0.33 | -1.12 | -39.09 | 0.53 | B0 |
| body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(19)>td:nth-child(1)>span:nth-child(1) | -0.33 | -0.12 | -39.09 | -0.47 | B0 |
| body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(20)>td:nth-child(1)>span:nth-child(1) | -0.33 | -0.12 | -39.09 | 0.53 | B0 |

## Top 20 text-run divergences in collapsed_table_medium_border_insets_x

| owner | text | dx | dy | dw | dright | faces | introduced by |
| --- | --- | --- | --- | --- | --- | --- | --- |
| body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(33)>td:nth-child(3) | R$ 6.800,00 | 13.64 | 0.77 | -0.02 | 13.62 | LiberationSans-Regular.ttf | L0 |
| body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(34)>td:nth-child(3) | R$ 1.450,00 | 13.64 | 1.36 | -0.02 | 13.62 | LiberationSans-Regular.ttf | L0 |
| body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(1)>td:nth-child(3) | R$ 32,50 | 13.64 | 0.77 | -0.02 | 13.62 | LiberationSans-Regular.ttf | L0 |
| body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(2)>td:nth-child(3) | R$ 18,90 | 13.64 | 0.36 | -0.02 | 13.62 | LiberationSans-Regular.ttf | L0 |
| body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(4)>td:nth-child(3) | R$ 47,20 | 13.64 | 0.55 | -0.02 | 13.62 | LiberationSans-Regular.ttf | L0 |
| body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(6)>td:nth-child(3) | R$ 28,00 | 13.64 | 0.73 | -0.02 | 13.62 | LiberationSans-Regular.ttf | L0 |
| body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(7)>td:nth-child(3) | R$ 89,90 | 13.64 | 0.33 | -0.02 | 13.62 | LiberationSans-Regular.ttf | L0 |
| body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(8)>td:nth-child(3) | R$ 34,50 | 13.64 | 0.92 | -0.02 | 13.62 | LiberationSans-Regular.ttf | L0 |
| body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(10)>td:nth-child(3) | R$ 21,30 | 13.64 | 0.11 | -0.02 | 13.62 | LiberationSans-Regular.ttf | L0 |
| body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(12)>td:nth-child(3) | R$ 98,00 | 13.64 | 0.3 | -0.02 | 13.62 | LiberationSans-Regular.ttf | L0 |
| body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(13)>td:nth-child(3) | R$ 27,40 | 13.64 | 0.89 | -0.02 | 13.62 | LiberationSans-Regular.ttf | L0 |
| body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(14)>td:nth-child(3) | R$ 38,90 | 13.64 | 0.48 | -0.02 | 13.62 | LiberationSans-Regular.ttf | L0 |
| body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(15)>td:nth-child(3) | R$ 64,00 | 13.64 | 1.08 | -0.02 | 13.62 | LiberationSans-Regular.ttf | L0 |
| body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(16)>td:nth-child(3) | R$ 33,70 | 13.64 | 0.67 | -0.02 | 13.62 | LiberationSans-Regular.ttf | L0 |
| body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(18)>td:nth-child(3) | R$ 12,80 | 13.64 | 0.86 | -0.02 | 13.62 | LiberationSans-Regular.ttf | L0 |
| body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(19)>td:nth-child(3) | R$ 19,60 | 13.64 | 0.45 | -0.02 | 13.62 | LiberationSans-Regular.ttf | L0 |
| body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(20)>td:nth-child(3) | R$ 54,30 | 13.64 | 1.05 | -0.02 | 13.62 | LiberationSans-Regular.ttf | L0 |
| body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(21)>td:nth-child(3) | R$ 22,90 | 13.64 | 0.64 | -0.02 | 13.62 | LiberationSans-Regular.ttf | L0 |
| body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(22)>td:nth-child(3) | R$ 41,00 | 13.64 | 1.23 | -0.02 | 13.62 | LiberationSans-Regular.ttf | L0 |
| body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(23)>td:nth-child(3) | R$ 14,50 | 13.64 | 0.83 | -0.02 | 13.62 | LiberationSans-Regular.ttf | L0 |

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
