# Layout diff comparison: pin → pin-cft-155.0.8059.84

Same templated HTML, same Chromium reference, two vellora builds. A change is attributed to the FIRST layer where b's delta-vs-Chromium differs from a's by more than the tolerance: `B0` = the bump changed raw Blitz layout; `L0` = raw Blitz/Parley text as read by the walk; a pass name = that vellora post-layout pass reacts differently to the new input. PDF rows: same-page words aligned by text from poppler `pdftotext -bbox`; `introduced_after_layout` = PDF Δ − pre-pagination Δ (both pt), i.e. what pagination/emit added.

## invoice

- Chromium reference identical across both runs: yes
|  | pin | pin-cft-155.0.8059.84 |
| --- | --- | --- |
| first divergent box | body>table:nth-child(1)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(1) (enter) by B0 | body>table:nth-child(1)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(1) (enter) by B0 |
| first divergent text | "Acme Widgets LON" by L0 | "Acme Widgets LON" by L0 |
| B0: box/text diverged, mean box err | 313/0, 61.514 | 313/0, 61.514 |
| L0: box/text diverged, mean box err | 313/210, 61.514 | 313/210, 61.514 |
| vertical_margin_collapse: box/text diverged, mean box err | 313/210, 61.514 | 313/210, 61.514 |
| collapsed_table_medium_border_insets: box/text diverged, mean box err | 310/210, 54.28 | 310/210, 54.28 |
| painted_table_cell_text_baselines: box/text diverged, mean box err | 310/210, 54.28 | 310/210, 54.28 |
| fixed_table_widths: box/text diverged, mean box err | 310/210, 54.28 | 310/210, 54.28 |
| table_percent_widths: box/text diverged, mean box err | 310/210, 54.28 | 310/210, 54.28 |
| auto_table_compact_columns: box/text diverged, mean box err | 310/210, 52.809 | 310/210, 52.809 |
| collapsed_table_medium_border_insets_x: box/text diverged, mean box err | 309/202, 52.766 | 309/202, 52.766 |

- boxes whose final pre-pagination geometry changed: 0; by first changed layer: {}
- text runs whose final position changed: 0; by first changed layer: {}
  - of those, x changed: 0, first x-changing layer: {}; y changed, first y-changing layer: {}
  - where the x change comes from (Σ|part| px over those runs): {}; y: {}

Largest text-run X changes (px), with the x trajectory per layer (vellora − Chromium dx, L0 → final):

_none_

Layer order of the trajectories: L0 → vertical_margin_collapse → collapsed_table_medium_border_insets → painted_table_cell_text_baselines → fixed_table_widths → table_percent_widths → auto_table_compact_columns → collapsed_table_medium_border_insets_x

Largest text-run changes (px; Δ = b − a of vellora−Chromium):

_none_

Largest box changes:

_none_

Top-level body children whose Blitz margins (L0 margin_top/margin_bottom, used by pagination's gaps) changed: none

Bottom lines, PDF vs pre-pagination (pt, vellora − Chrome):

| run | line | page | PDF dy | pre-pagination dy | added after layout |
| --- | --- | --- | --- | --- | --- |
| pin | Pagamento via transferência para a conta | 3 | 5.7 | 86.04 | -80.34 |
| pin | fatura INV-2026-00417 no campo de identi | 3 | 5.7 | 85.75 | -80.05 |
| pin | Em caso de divergência nos itens, entre  | 3 | 4.95 | 85.45 | -80.5 |

## receipt

- Chromium reference identical across both runs: yes
|  | pin | pin-cft-155.0.8059.84 |
| --- | --- | --- |
| first divergent box | body>div:nth-child(1)>header:nth-child(1)>address:nth-child(4) (exit) by B0 | body>div:nth-child(1)>header:nth-child(1)>address:nth-child(4) (exit) by B0 |
| first divergent text | "CEP 01001-000" by L0 | "CEP 01001-000" by L0 |
| B0: box/text diverged, mean box err | 76/0, 45.623 | 76/0, 45.623 |
| L0: box/text diverged, mean box err | 76/50, 45.623 | 76/50, 45.623 |
| vertical_margin_collapse: box/text diverged, mean box err | 76/50, 45.623 | 76/50, 45.623 |
| collapsed_table_medium_border_insets: box/text diverged, mean box err | 76/50, 38.626 | 76/50, 38.626 |
| painted_table_cell_text_baselines: box/text diverged, mean box err | 76/50, 38.626 | 76/50, 38.626 |
| fixed_table_widths: box/text diverged, mean box err | 76/50, 38.626 | 76/50, 38.626 |
| table_percent_widths: box/text diverged, mean box err | 76/50, 33.218 | 76/50, 33.218 |
| auto_table_compact_columns: box/text diverged, mean box err | 76/50, 33.218 | 76/50, 33.218 |
| collapsed_table_medium_border_insets_x: box/text diverged, mean box err | 76/50, 33.287 | 76/50, 33.287 |

- boxes whose final pre-pagination geometry changed: 0; by first changed layer: {}
- text runs whose final position changed: 0; by first changed layer: {}
  - of those, x changed: 0, first x-changing layer: {}; y changed, first y-changing layer: {}
  - where the x change comes from (Σ|part| px over those runs): {}; y: {}

Largest text-run X changes (px), with the x trajectory per layer (vellora − Chromium dx, L0 → final):

_none_

Layer order of the trajectories: L0 → vertical_margin_collapse → collapsed_table_medium_border_insets → painted_table_cell_text_baselines → fixed_table_widths → table_percent_widths → auto_table_compact_columns → collapsed_table_medium_border_insets_x

Largest text-run changes (px; Δ = b − a of vellora−Chromium):

_none_

Largest box changes:

_none_

Top-level body children whose Blitz margins (L0 margin_top/margin_bottom, used by pagination's gaps) changed: none

Bottom lines, PDF vs pre-pagination (pt, vellora − Chrome):

| run | line | page | PDF dy | pre-pagination dy | added after layout |
| --- | --- | --- | --- | --- | --- |
| pin | por você. | 2 | 164.37 |  |  |
| pin | Este recibo é um comprovante simplificad | 2 | 158.36 |  |  |
| pin | Cafeteria Aurora Ltda · www.cafeteria-au | 2 | 158.36 | -0.11 | 158.47 |

## boleto

- Chromium reference identical across both runs: yes
|  | pin | pin-cft-155.0.8059.84 |
| --- | --- | --- |
| first divergent box | body>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(1) (enter) by B0 | body>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(1) (enter) by B0 |
| first divergent text | "999-9" by L0 | "999-9" by L0 |
| B0: box/text diverged, mean box err | 121/0, 33.7 | 121/0, 33.7 |
| L0: box/text diverged, mean box err | 121/75, 33.7 | 121/75, 33.7 |
| vertical_margin_collapse: box/text diverged, mean box err | 121/75, 33.7 | 121/75, 33.7 |
| collapsed_table_medium_border_insets: box/text diverged, mean box err | 121/75, 33.7 | 121/75, 33.7 |
| painted_table_cell_text_baselines: box/text diverged, mean box err | 121/75, 33.7 | 121/75, 33.7 |
| fixed_table_widths: box/text diverged, mean box err | 116/72, 19.607 | 116/72, 19.607 |
| table_percent_widths: box/text diverged, mean box err | 116/72, 19.607 | 116/72, 19.607 |
| auto_table_compact_columns: box/text diverged, mean box err | 116/72, 19.612 | 116/72, 19.612 |
| collapsed_table_medium_border_insets_x: box/text diverged, mean box err | 116/72, 19.612 | 116/72, 19.612 |

- boxes whose final pre-pagination geometry changed: 0; by first changed layer: {}
- text runs whose final position changed: 0; by first changed layer: {}
  - of those, x changed: 0, first x-changing layer: {}; y changed, first y-changing layer: {}
  - where the x change comes from (Σ|part| px over those runs): {}; y: {}

Largest text-run X changes (px), with the x trajectory per layer (vellora − Chromium dx, L0 → final):

_none_

Layer order of the trajectories: L0 → vertical_margin_collapse → collapsed_table_medium_border_insets → painted_table_cell_text_baselines → fixed_table_widths → table_percent_widths → auto_table_compact_columns → collapsed_table_medium_border_insets_x

Largest text-run changes (px; Δ = b − a of vellora−Chromium):

_none_

Largest box changes:

_none_

Top-level body children whose Blitz margins (L0 margin_top/margin_bottom, used by pagination's gaps) changed: none

Bottom lines, PDF vs pre-pagination (pt, vellora − Chrome):

| run | line | page | PDF dy | pre-pagination dy | added after layout |
| --- | --- | --- | --- | --- | --- |
| pin | 06/2026 Taxa de processamento R$ 46,50 | 1 | 8.54 | 12.12 | -3.58 |
| pin | CÓDIGO DE BARRAS (REPRESENTAÇÃO TEXTUAL  | 1 | 11.46 | 15 | -3.54 |
| pin | Documento de cobrança fictício gerado po | 1 | 12.7 | 15.68 | -2.98 |

## notification

- Chromium reference identical across both runs: yes
|  | pin | pin-cft-155.0.8059.84 |
| --- | --- | --- |
| first divergent box | body>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(1) (enter) by B0 | body>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(1) (enter) by B0 |
| first divergent text | "Acme Serviços Prediais Ltda." by L0 | "Acme Serviços Prediais Ltda." by L0 |
| B0: box/text diverged, mean box err | 41/0, 30.034 | 41/0, 30.034 |
| L0: box/text diverged, mean box err | 41/33, 30.034 | 41/33, 30.034 |
| vertical_margin_collapse: box/text diverged, mean box err | 41/33, 30.034 | 41/33, 30.034 |
| collapsed_table_medium_border_insets: box/text diverged, mean box err | 32/25, 26.821 | 32/25, 26.821 |
| painted_table_cell_text_baselines: box/text diverged, mean box err | 32/25, 26.821 | 32/25, 26.821 |
| fixed_table_widths: box/text diverged, mean box err | 32/25, 26.821 | 32/25, 26.821 |
| table_percent_widths: box/text diverged, mean box err | 32/24, 6.299 | 32/24, 6.299 |
| auto_table_compact_columns: box/text diverged, mean box err | 32/24, 6.299 | 32/24, 6.299 |
| collapsed_table_medium_border_insets_x: box/text diverged, mean box err | 32/21, 6.22 | 32/21, 6.22 |

- boxes whose final pre-pagination geometry changed: 0; by first changed layer: {}
- text runs whose final position changed: 0; by first changed layer: {}
  - of those, x changed: 0, first x-changing layer: {}; y changed, first y-changing layer: {}
  - where the x change comes from (Σ|part| px over those runs): {}; y: {}

Largest text-run X changes (px), with the x trajectory per layer (vellora − Chromium dx, L0 → final):

_none_

Layer order of the trajectories: L0 → vertical_margin_collapse → collapsed_table_medium_border_insets → painted_table_cell_text_baselines → fixed_table_widths → table_percent_widths → auto_table_compact_columns → collapsed_table_medium_border_insets_x

Largest text-run changes (px; Δ = b − a of vellora−Chromium):

_none_

Largest box changes:

_none_

Top-level body children whose Blitz margins (L0 margin_top/margin_bottom, used by pagination's gaps) changed: none

Bottom lines, PDF vs pre-pagination (pt, vellora − Chrome):

| run | line | page | PDF dy | pre-pagination dy | added after layout |
| --- | --- | --- | --- | --- | --- |
| pin | Sendo o que se apresenta para o momento, | 1 | 2.28 | 4.62 | -2.34 |
| pin | Mariana Oliveira Souza | 1 | -7.15 | 4.89 | -12.04 |
| pin | Gerente do Departamento de Cobrança | 1 | -7.62 | 4.89 | -12.51 |

