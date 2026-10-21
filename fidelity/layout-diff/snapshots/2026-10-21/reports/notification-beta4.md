# Layout diff — notification (beta4)

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
- Fonts: Chromium loaded Liberation Serif 400 normal; Liberation Serif 700 normal; Georgia 400 normal; Georgia 700 normal from the bundled files (sha256 in env.fonts_sha256). vellora runs by face: LiberationSerif-Bold.ttf 7, LiberationSerif-Regular.ttf 28. DejaVu fallback runs (no Chromium counterpart): 0.
- Baselines: Chromium ascent measured for 7/7 face/size specs.
- html_normalize wrappers: recorded 0, located in the Blitz DOM 0.
- Blitz anonymous blocks (B0 only): 0; anonymous inline roots holding text (text Blitz shaped that vellora's DOM-children walk never reads): 0.
- Dump self-checks: run-metadata misalignments 0, layer order violations 0 (both expected 0).
- Input sha256: native e644692f09436522…, browser 5223c72b4fa5e97b…

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

- **enter (x/y/width) body>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(1)** (event #12)
- introduced by: **B0** — RAW BLITZ: Blitz's own layout tree (B0) already differs from Chromium

| layer | status | dx | dy | dw | dh | dy basis |
| --- | --- | --- | --- | --- | --- | --- |
| B0 | diverged | 0 | 0.09 | -18.56 |  |  |
| L0 | diverged | 0 | 0.09 | -18.56 |  |  |
| vertical_margin_collapse | diverged | 0 | 0.09 | -18.56 |  |  |
| collapsed_table_medium_border_insets | diverged | 0 | 0.09 | -18.56 |  |  |
| painted_table_cell_text_baselines | diverged | 0 | 0.09 | -18.56 |  |  |
| fixed_table_widths | diverged | 0 | 0.09 | -18.56 |  |  |
| table_percent_widths | diverged | 0 | 0.09 | -18.56 |  |  |
| auto_table_compact_columns | diverged | 0 | 0.09 | -18.56 |  |  |
| collapsed_table_medium_border_insets_x | diverged | 0 | 0.09 | -18.56 |  |  |
| B0u | diverged | 0 | 0.04 | -18.56 |  |  |

Ancestor chain (compared boxes, root first; deltas = vellora − Chromium, CSS px):

| ancestor | collapsed_table_medium_border_insets_x dx,dy,dw,dh | B0 dx,dy,dw,dh | L0 dx,dy,dw,dh |
| --- | --- | --- | --- |
| html | 0, 0, 0, 6.52 | 0, 0, 0, 6.52 | 0, 0, 0, 6.52 |
| body | 0, 0, 0, 6.52 | 0, 0, 0, 6.52 | 0, 0, 0, 6.52 |
| body>table:nth-child(2) | 0, 0.09, 0, 0 | 0, 0.09, 0, 0 | 0, 0.09, 0, 0 |

## First divergent text run in collapsed_table_medium_border_insets_x

- **text "Acme Serviços Prediais Ltda." in body>div:nth-child(1)>div:nth-child(1)** (event #4)
- introduced by: **L0** — RAW BLITZ/PARLEY TEXT as read by vellora's walk (L0); no normalize pass involved
- Chromium fragment: "Acme Serviços Prediais Ltda." at x=0 y=3 w=286.05; vellora faces: LiberationSerif-Bold.ttf

| layer | status | dx | dy | dw | dright | dy basis |
| --- | --- | --- | --- | --- | --- | --- |
| B0 | n/a |  |  |  |  |  |
| L0 | diverged | 0 | 1 | 0.17 | 0.17 | baseline |
| vertical_margin_collapse | diverged | 0 | 1 | 0.17 | 0.17 | baseline |
| collapsed_table_medium_border_insets | diverged | 0 | 1 | 0.17 | 0.17 | baseline |
| painted_table_cell_text_baselines | diverged | 0 | 1 | 0.17 | 0.17 | baseline |
| fixed_table_widths | diverged | 0 | 1 | 0.17 | 0.17 | baseline |
| table_percent_widths | diverged | 0 | 1 | 0.17 | 0.17 | baseline |
| auto_table_compact_columns | diverged | 0 | 1 | 0.17 | 0.17 | baseline |
| collapsed_table_medium_border_insets_x | diverged | 0 | 1 | 0.17 | 0.17 | baseline |

Ancestor chain (compared boxes, root first; deltas = vellora − Chromium, CSS px):

| ancestor | collapsed_table_medium_border_insets_x dx,dy,dw,dh | B0 dx,dy,dw,dh | L0 dx,dy,dw,dh |
| --- | --- | --- | --- |
| html | 0, 0, 0, 6.52 | 0, 0, 0, 6.52 | 0, 0, 0, 6.52 |
| body | 0, 0, 0, 6.52 | 0, 0, 0, 6.52 | 0, 0, 0, 6.52 |
| body>div:nth-child(1) | 0, 0, 0, 0.09 | 0, 0, 0, 0.09 | 0, 0, 0, 0.09 |

## First divergence per layer

| layer | first box | box Δ | first text | text Δ (dx, dy) |
| --- | --- | --- | --- | --- |
| B0 | enter (x/y/width) body>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(1) | 0, 0.09, -18.56 | n/a (no text in B0) |  |
| L0 | enter (x/y/width) body>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(1) | 0, 0.09, -18.56 | text "Acme Serviços Prediais Ltda." in body>div:nth-child(1)>div:nth-child(1) | 0, 1 |
| vertical_margin_collapse | enter (x/y/width) body>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(1) | 0, 0.09, -18.56 | text "Acme Serviços Prediais Ltda." in body>div:nth-child(1)>div:nth-child(1) | 0, 1 |
| collapsed_table_medium_border_insets | enter (x/y/width) body>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(1) | 0, 0.09, -18.56 | text "Acme Serviços Prediais Ltda." in body>div:nth-child(1)>div:nth-child(1) | 0, 1 |
| painted_table_cell_text_baselines | enter (x/y/width) body>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(1) | 0, 0.09, -18.56 | text "Acme Serviços Prediais Ltda." in body>div:nth-child(1)>div:nth-child(1) | 0, 1 |
| fixed_table_widths | enter (x/y/width) body>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(1) | 0, 0.09, -18.56 | text "Acme Serviços Prediais Ltda." in body>div:nth-child(1)>div:nth-child(1) | 0, 1 |
| table_percent_widths | enter (x/y/width) body>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(1) | 0, 0.09, -18.56 | text "Acme Serviços Prediais Ltda." in body>div:nth-child(1)>div:nth-child(1) | 0, 1 |
| auto_table_compact_columns | enter (x/y/width) body>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(1) | 0, 0.09, -18.56 | text "Acme Serviços Prediais Ltda." in body>div:nth-child(1)>div:nth-child(1) | 0, 1 |
| collapsed_table_medium_border_insets_x | enter (x/y/width) body>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(1) | 0, 0.09, -18.56 | text "Acme Serviços Prediais Ltda." in body>div:nth-child(1)>div:nth-child(1) | 0, 1 |

## Per-layer error and pass effects

`moved` = boxes/runs whose geometry this layer changed vs the previous one; `better`/`worse` = moved closer to / further from Chromium (max |Δ| per item); `Σ` = summed change of that error.

| layer | box events diverged | text events diverged | mean abs box Δ (px) | boxes moved/better/worse (Σ) | runs moved/better/worse (Σ) |
| --- | --- | --- | --- | --- | --- |
| B0 | 29 | n/a | 15.08 |  |  |
| L0 | 29 | 18 | 15.08 | 0/0/0 (0) | 0/0/0 (0) |
| vertical_margin_collapse | 29 | 18 | 15.08 | 0/0/0 (0) | 0/0/0 (0) |
| collapsed_table_medium_border_insets | 29 | 18 | 15.08 | 0/0/0 (0) | 0/0/0 (0) |
| painted_table_cell_text_baselines | 29 | 18 | 15.08 | 0/0/0 (0) | 6/2/1 (-2.17) |
| fixed_table_widths | 29 | 18 | 15.08 | 0/0/0 (0) | 0/0/0 (0) |
| table_percent_widths | 29 | 18 | 4.09 | 6/6/0 (-373.75) | 3/3/0 (-188.07) |
| auto_table_compact_columns | 29 | 18 | 4.09 | 0/0/0 (0) | 0/0/0 (0) |
| collapsed_table_medium_border_insets_x | 29 | 18 | 4.09 | 0/0/0 (0) | 0/0/0 (0) |

## Top 20 box divergences in collapsed_table_medium_border_insets_x (absolute)

| path | dx | dy | dw | dh | introduced by |
| --- | --- | --- | --- | --- | --- |
| body>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(2) | -18.56 | 0.09 | 18.56 | 0 | B0 |
| body>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(1) | 0 | 0.09 | -18.56 | 0 | B0 |
| html | 0 | 0 | 0 | 6.52 | B0 |
| body | 0 | 0 | 0 | 6.52 | B0 |
| body>div:nth-child(6)>div:nth-child(3) | 0 | 6.52 | 0 | 0 | B0 |
| body>div:nth-child(6)>div:nth-child(4) | 0 | 6.52 | 0 | 0 | B0 |
| body>div:nth-child(6)>div:nth-child(5) | 0 | 6.52 | 0 | 0 | B0 |
| body>div:nth-child(6) | 0 | 6.5 | 0 | 0.02 | B0 |
| body>div:nth-child(6)>p:nth-child(1) | 0 | 6.5 | 0 | 0 | B0 |
| body>div:nth-child(5)>p:nth-child(4) | 0 | 6.47 | 0 | 0 | B0 |
| body>div:nth-child(5)>p:nth-child(6) | 0 | 6.16 | 0 | 0 | B0 |
| body>div:nth-child(5)>table:nth-child(3) | 0 | 0.08 | 0 | 6.05 | B0 |
| body>div:nth-child(6)>div:nth-child(2) | 0 | 5.84 | 0.23 | 0 | B0 |
| body>div:nth-child(5)>p:nth-child(5) | 0 | 5.81 | 0 | 0 | B0 |
| body>div:nth-child(5) | 0 | 0.39 | 0 | 5.77 | B0 |
| body>div:nth-child(5)>table:nth-child(3)>tbody:nth-child(1)>tr:nth-child(3)>td:nth-child(1) | 0.5 | 4.61 | -0.37 | 1.02 | B0 |
| body>div:nth-child(5)>table:nth-child(3)>tbody:nth-child(1)>tr:nth-child(3)>td:nth-child(2) | 0.13 | 4.61 | -0.63 | 1.02 | B0 |
| body>div:nth-child(5)>table:nth-child(3)>tbody:nth-child(1)>tr:nth-child(2)>td:nth-child(1) | 0.5 | 2.59 | -0.37 | 1.02 | B0 |
| body>div:nth-child(5)>table:nth-child(3)>tbody:nth-child(1)>tr:nth-child(2)>td:nth-child(2) | 0.13 | 2.59 | -0.63 | 1.02 | B0 |
| body>div:nth-child(5)>table:nth-child(3)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(1) | 0.5 | 0.58 | -0.37 | 1.02 | B0 |

## Top 20 LOCAL box divergences

rdx/rdy = the error a box ADDS to what it inherits: after a previous compared sibling in the same row, relative to that sibling's right edge (dx+dw) and dy; after a stacked sibling, relative to its bottom edge (dy+dh); a first child, relative to its parent's dx/dy. Isolates where cumulative drift originates.

| path | rdx | rdy | dw | dh | introduced by |
| --- | --- | --- | --- | --- | --- |
| body>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(2) | 0 | 0 | 18.56 | 0 | B0 |
| body>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(1) | 0 | 0 | -18.56 | 0 | B0 |
| html | 0 | 0 | 0 | 6.52 | B0 |
| body | 0 | 0 | 0 | 6.52 | B0 |
| body>div:nth-child(5)>table:nth-child(3) | 0 | 0.34 | 0 | 6.05 | B0 |
| body>div:nth-child(5) | 0 | 0.34 | 0 | 5.77 | B0 |
| body>div:nth-child(5)>table:nth-child(3)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(1) | 0.5 | 0.5 | -0.37 | 1.02 | B0 |
| body>div:nth-child(5)>table:nth-child(3)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(2) | 0 | 0 | -0.63 | 1.02 | B0 |
| body>div:nth-child(5)>table:nth-child(3)>tbody:nth-child(1)>tr:nth-child(2)>td:nth-child(1) | 0.5 | 1 | -0.37 | 1.02 | B0 |
| body>div:nth-child(5)>table:nth-child(3)>tbody:nth-child(1)>tr:nth-child(2)>td:nth-child(2) | 0 | 0 | -0.63 | 1.02 | B0 |
| body>div:nth-child(5)>table:nth-child(3)>tbody:nth-child(1)>tr:nth-child(3)>td:nth-child(1) | 0.5 | 1 | -0.37 | 1.02 | B0 |
| body>div:nth-child(5)>table:nth-child(3)>tbody:nth-child(1)>tr:nth-child(3)>td:nth-child(2) | 0 | 0 | -0.63 | 1.02 | B0 |
| body>div:nth-child(3)>div:nth-child(4) | 0 | 0 | 0 | 0.69 | B0 |
| body>div:nth-child(6)>div:nth-child(3) | 0 | 0.67 | 0 | 0 | B0 |
| body>div:nth-child(5)>p:nth-child(2) | 0 | -0.66 | 0 | 0 |  |
| body>div:nth-child(5)>p:nth-child(5) | 0 | -0.66 | 0 | 0 | B0 |
| body>div:nth-child(6)>div:nth-child(2) | 0 | -0.66 | 0.23 | 0 | B0 |
| body>div:nth-child(3)>div:nth-child(1) | 0 | 0 | 0 | 0.53 | B0 |
| body>div:nth-child(1)>div:nth-child(2) | 0 | 0 | 0 | 0.41 |  |
| body>div:nth-child(5)>p:nth-child(4) | 0 | 0.34 | 0 | 0 | B0 |

## Top 20 text-run divergences in collapsed_table_medium_border_insets_x

| owner | text | dx | dy | dw | dright | faces | introduced by |
| --- | --- | --- | --- | --- | --- | --- | --- |
| body>div:nth-child(6)>div:nth-child(3) | Mariana Oliveira Souza | 0 | 6.52 | -0.01 | -0.01 | LiberationSerif-Bold.ttf | L0 |
| body>div:nth-child(6)>div:nth-child(4) | Gerente do Departamento de Cobrança | 0 | 6.52 | 0 | 0 | LiberationSerif-Regular.ttf | L0 |
| body>div:nth-child(6)>div:nth-child(5) | Acme Serviços Prediais Ltda. | 0 | 6.52 | -0.01 | -0.01 | LiberationSerif-Regular.ttf | L0 |
| body>div:nth-child(6)>p:nth-child(1) | Atenciosamente, | 0 | 6.5 | 0.07 | 0.07 | LiberationSerif-Regular.ttf | L0 |
| body>div:nth-child(5)>p:nth-child(4) | Permanecendo a situação sem a devida regulari... | 0 | 6.47 | 3.67 | 3.67 | LiberationSerif-Regular.ttf | L0 |
| body>div:nth-child(5)>p:nth-child(4) | adotadas as providências cabíveis previstas e... | 0 | 6.47 | 3.67 | 3.67 | LiberationSerif-Regular.ttf | L0 |
| body>div:nth-child(5)>p:nth-child(4) | outras medidas. Em caso de pagamento já efetu... | 0 | 6.47 | 3.67 | 3.67 | LiberationSerif-Regular.ttf | L0 |
| body>div:nth-child(5)>p:nth-child(4) | respectivo comprovante para cobranca@exemplo-... | 0 | 6.47 | 0.28 | 0.28 | LiberationSerif-Regular.ttf | L0 |
| body>div:nth-child(5)>p:nth-child(6) | Sendo o que se apresenta para o momento, colo... | 0 | 6.16 | 3.67 | 3.67 | LiberationSerif-Regular.ttf | L0 |
| body>div:nth-child(5)>p:nth-child(6) | necessários. | 0 | 6.16 | 0.04 | 0.04 | LiberationSerif-Regular.ttf | L0 |
| body>div:nth-child(5)>p:nth-child(5) | Segue, em anexo, demonstrativo detalhado do d... | 0 | 5.81 | 0.35 | 0.35 | LiberationSerif-Regular.ttf | L0 |
| body>div:nth-child(5)>table:nth-child(3)>tbody:nth-child(1)>tr:nth-child(3)>td:nth-child(1) | Prazo para regularização | 0.34 | 2.11 | -0.03 | 0.32 | LiberationSerif-Bold.ttf | L0 |
| body>div:nth-child(5)>table:nth-child(3)>tbody:nth-child(1)>tr:nth-child(3)>td:nth-child(2) | 15 dias corridos (até 07/07/2026) | -1.02 | 2.11 | -0.04 | -1.06 | LiberationSerif-Regular.ttf | L0 |
| body>div:nth-child(5)>table:nth-child(3)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(1) | Valor em aberto | 0.34 | -1.92 | -0.03 | 0.32 | LiberationSerif-Bold.ttf | painted_table_cell_text_baselines |
| body>div:nth-child(5)>table:nth-child(3)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(2) | R$ 4.875,50 | -1.02 | -1.92 | -0.01 | -1.04 | LiberationSerif-Regular.ttf | L0 |
| body>div:nth-child(3)>div:nth-child(1) | AO(À) DESTINATÁRIO(A) | 0 | -1.23 | 0.13 | 0.13 | LiberationSerif-Regular.ttf | L0 |
| body>div:nth-child(5)>table:nth-child(3)>tbody:nth-child(1)>tr:nth-child(2)>td:nth-child(2) | 15/05/2026 | -1.02 | 0.09 | -0.02 | -1.04 | LiberationSerif-Regular.ttf | L0 |
| body>div:nth-child(1)>div:nth-child(1) | Acme Serviços Prediais Ltda. | 0 | 1 | 0.17 | 0.17 | LiberationSerif-Bold.ttf | L0 |
| body>div:nth-child(5)>p:nth-child(1) | Prezado(a) Comércio Faro Azul Ltda. ME, na qu... | 0 | 0.39 | 3.67 | 3.67 | LiberationSerif-Regular.ttf |  |
| body>div:nth-child(5)>p:nth-child(1) | desta NOTIFICAR Vossa Senhoria a respeito de ... | 0 | 0.39 | 3.67 | 3.67 | LiberationSerif-Regular.ttf |  |

## Match counts and node policy

- Chromium elements under html (head excluded) by policy: compared 34, inline-text-only 2, no-blitz-box 6
- vellora L0 boxes (elements, head excluded): 42; matched to a compared Chromium box: 34
- vellora-only — inline element (compared via text runs): 2 (e.g. body>div:nth-child(1)>div:nth-child(2)>br:nth-child(1); body>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(1)>br:nth-child(1))
- vellora-only — table row/group: not a Blitz layout node (zero box in walk): 6 (e.g. body>table:nth-child(2)>tbody:nth-child(1); body>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(1); body>div:nth-child(5)>table:nth-child(3)>tbody:nth-child(1))
- Chromium-only compared boxes (no vellora L0 box): 0
- Blitz layout-tree-only nodes (anonymous blocks / pseudo-elements the walk never visits): 0
- Policy: `inline-text-only` = Chromium `display:inline` non-replaced element (Blitz gives it no Taffy box; its text is compared as runs). `no-blitz-box` = table row/row-group that is not a Blitz layout node (zero box in the walk); listed, not scored. `no-layout` = Chromium has no layout object (display:none). Pseudo-elements are matched by `::before`/`::after` segments and never count toward `:nth-child`. Anonymous boxes: Chromium's are not exposed by DOMSnapshot; Blitz's appear only in B0 as `::blitz-anon(j)`. html_normalize wrappers are transparent in keys and listed as vellora-only.

## Text alignment

- vellora runs (non-blank, L0): 35; Chromium text fragments (non-blank): 48; matched pairs: 35 (11 joined across fragment/run boundaries)
- unmatched vellora runs: 0; unmatched Chromium fragments: 0; Chromium text with NO vellora owner (text vellora never shaped): 0

## Caveats

- Local macOS Chrome results are INDICATIVE; the authoritative run is the pinned Chrome for Testing on Linux CI (see fidelity/layout-diff/README.md).
- Text dy compares BASELINES when Chromium's ascent for the face/size was measured (probe page, zero-size inline-block on the baseline); otherwise vellora's text top (baseline − Parley ascent) vs Chromium's text-box top (`dy basis` column).
- L0 text positions already include `read_text_runs`' inline padding-right compensation, so 'raw Parley' text is not separated from vellora's reader.
