# Layout diff summary (beta4)

> Continuous-flow comparison: Chromium lays the document out as ONE flow (no fragmentation) at the same viewport width vellora hands Blitz. It is comparable ONLY to vellora's PRE-pagination layers (N0, B0, L0, layout_normalize passes) and says nothing about pagination (page breaks, repeated thead, page-local offsets, margin boxes).

> **WARNING — CHECKS FAILED** in receipt (normalize_wrappers_located, normalize_dom_roundtrip, dom_key_alignment). See the checks table below and each fixture's report.

- date: `2026-10-21T06:05:12Z`; blitz: `blitz-0.3.0-beta.4`; commit: `dc535e7f9e0a3291a539b3c8597ee03472ad1aaa` (clean); chrome: `Google Chrome 155.0.8059.85`; node: `v22.23.2`; rustc: `rustc 1.96.0 (ac68faa20 2026-05-25)`
- command: `node <worktree>/fidelity/layout-diff/run.mjs --label beta4`

## Checks

| check | invoice | receipt | boleto | notification |
| --- | --- | --- | --- | --- |
| viewport_width | pass | pass | pass | pass |
| viewport_height | pass | pass | pass | pass |
| font_block_injected | pass | pass | pass | pass |
| bundled_fonts_loaded | pass | pass | pass | pass |
| platform_fonts_custom | pass | pass | pass | pass |
| source_html_layer | pass | pass | pass | pass |
| normalize_wrappers_located | pass | **FAIL** | pass | pass |
| run_meta_alignment | pass | pass | pass | pass |
| layer_order | pass | pass | pass | pass |
| normalize_dom_roundtrip | pass | **FAIL** | pass | pass |
| source_dom_keys_vs_chromium | pass | pass | pass | pass |
| dom_key_alignment | pass | **FAIL** | pass | pass |
| text_alignment | pass | warn | pass | pass |

Two attribution answers per item. **regressed by** = every layer that made the item WORSE than the previous layer, per checked coordinate: |Δ| grew by more than tolerance (`worsened`), the sign flipped with both sides over tolerance and |Δ| did not shrink by more than tolerance (`overshoot`, e.g. +6 → −6), or the layer lost the box (`LOST`); on the first layer of the chain it means 'already over tolerance vs Chromium'. This answers 'which layer changed the error', also after the document's first natural divergence. **first over tolerance** = the first layer of N0 → B0 → L0 → passes whose |Δ vs Chromium| exceeds tolerance: it answers 'is raw Blitz already off?' and NEVER blames a later layer — a pass that adds +10 px to a box already +6 px off at B0 still reads B0 there. **dominant layer** = the layer with the largest step (step = layer Δ − previous layer Δ; steps sum exactly to the final Δ). Limit: a layer that moves a box TOWARDS Chromium is an improvement by definition, whatever its cause; `compare.mjs` (build vs build) answers 'what did this code change do'.

## Natural first divergence (final layer)

| fixture | html_normalize | first divergent box | Δ | regressed by | first over tol. | first divergent text run | text Δ (dx, dy) | regressed by | matched boxes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| invoice | altered DOM; N0 run | enter (x/y/width) body>table:nth-child(1)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(1) | 0, 0, -10.47 | N0 dw 0→-10.47 (first layer) | N0 | text "EMITENTE" in body>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(1)>div:nth-child(1) | 1.11, -1.14 | L0 dx 0→1.11 (first layer); painted_table_cell_text_baselines overshoot dy 0.86→-1.14 | 220/304 |
| receipt | altered DOM; N0 run | exit (height) body>div:nth-child(1)>header:nth-child(1)>address:nth-child(4) | -0.56 | N0 dh 0→-0.56 (first layer) | N0 | text "CEP 01001-000" in body>div:nth-child(1)>header:nth-child(1)>address:nth-child(4) | -0.12, 0.67 | L0 dy 0→0.67 (first layer) | 62/95 |
| boleto | altered DOM; N0 run | exit (height) body>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(1) | -1.08 | N0 dh 0→-1.08 (first layer) | N0 | text "999-9" in body>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(2) | -1.62, -12.44 | L0 dy 0→-10.44 (first layer); painted_table_cell_text_baselines dy -10.44→-12.44 | 82/175 |
| notification | no change; N0 run | enter (x/y/width) body>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(1) | 0, 0.09, -18.56 | N0 dw 0→-18.56 (first layer) | N0 | text "Acme Serviços Prediais Ltda." in body>div:nth-child(1)>div:nth-child(1) | 0, 1 | L0 dy 0→1 (first layer) | 34/42 |

## Regressions per layer after the first layer (events that layer made worse than the previous layer)

| fixture | box events regressed, by layer | text runs regressed, by layer | first box a pass regressed | first text run a pass regressed |
| --- | --- | --- | --- | --- |
| invoice | 0 | painted_table_cell_text_baselines 8, auto_table_compact_columns 70 | none | text "EMITENTE" in body>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(1)>div:nth-child(1) (painted_table_cell_text_baselines overshoot dy 0.86→-1.14) |
| receipt | B0 6 | table_percent_widths 4 | none | text "REC-2026-000482" in body>div:nth-child(1)>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(2) (table_percent_widths dx 0.42→1.5) |
| boleto | fixed_table_widths 4 | painted_table_cell_text_baselines 11, fixed_table_widths 3 | enter (x/y/width) body>table:nth-child(6)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(1) (fixed_table_widths overshoot dw -1.25→0.75) | text "999-9" in body>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(2) (painted_table_cell_text_baselines dy -10.44→-12.44) |
| notification | 0 | painted_table_cell_text_baselines 2 | none | text "Valor em aberto" in body>div:nth-child(5)>table:nth-child(3)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(1) (painted_table_cell_text_baselines dy 0.08→-1.92) |
