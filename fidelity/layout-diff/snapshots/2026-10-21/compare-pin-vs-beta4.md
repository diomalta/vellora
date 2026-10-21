# Layout diff comparison: pin → beta4

Same templated HTML, same Chromium reference, two vellora builds. A change is attributed to the FIRST layer (of the layers both runs have) where b's delta-vs-Chromium differs from a's by more than the tolerance: `N0` = the bump changed raw Blitz layout of the source HTML; `B0` = Blitz's layout of html_normalize's output changed (raw Blitz when N0 is absent from either run and html_normalize changed nothing); `L0` = raw Blitz/Parley text as read by the walk; a pass name = that vellora post-layout pass reacts differently to the new input. PDF rows: same-page words aligned by text from poppler `pdftotext -bbox`; `introduced_after_layout` = PDF Δ − pre-pagination Δ (both pt), i.e. what pagination/emit added.

## invoice

- Chromium reference identical across both runs: yes
|  | pin | beta4 |
| --- | --- | --- |
| first divergent box | body>table:nth-child(1)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(1) (enter) first over tol. N0 | body>table:nth-child(1)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(1) (enter) first over tol. N0 |
| first divergent text | "Acme Widgets LON" first over tol. L0 | "EMITENTE" first over tol. L0 |
| N0: box/text diverged, mean box err | 313/0, 61.514 | 309/0, 24.588 |
| B0: box/text diverged, mean box err | 313/0, 61.514 | 309/0, 24.588 |
| L0: box/text diverged, mean box err | 313/210, 61.514 | 309/200, 24.588 |
| vertical_margin_collapse: box/text diverged, mean box err | 313/210, 61.514 | 309/200, 24.588 |
| collapsed_table_medium_border_insets: box/text diverged, mean box err | 310/210, 54.28 | 309/200, 24.588 |
| painted_table_cell_text_baselines: box/text diverged, mean box err | 310/210, 54.28 | 309/165, 24.588 |
| fixed_table_widths: box/text diverged, mean box err | 310/210, 54.28 | 309/165, 24.588 |
| table_percent_widths: box/text diverged, mean box err | 310/210, 54.28 | 309/165, 24.588 |
| auto_table_compact_columns: box/text diverged, mean box err | 310/210, 52.809 | 309/176, 12.914 |
| collapsed_table_medium_border_insets_x: box/text diverged, mean box err | 309/202, 52.766 | 309/176, 12.914 |

- boxes whose final pre-pagination geometry changed: 217; by first changed layer: {"N0":217}
- text runs whose final position changed: 198; by first changed layer: {"L0":198}
  - of those, x changed: 118, first x-changing layer: {"auto_table_compact_columns":35,"L0":83}; y changed, first y-changing layer: {"L0":189}
  - where the x change comes from (Σ|part| px over those runs): {"L0":298.8,"auto_table_compact_columns":922.69,"collapsed_table_medium_border_insets_x":321.04}; y: {"L0":11939,"collapsed_table_medium_border_insets":1755}

Largest text-run X changes (px), with the x trajectory per layer (vellora − Chromium dx, L0 → final):

| owner | text | Δ final dx | Δ L0 dx | first x-changing layer | Δ dx by layer (sums to Δ final) | pin dx trajectory | beta4 dx trajectory |
| --- | --- | --- | --- | --- | --- | --- | --- |
| body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(1)>td:nth-child(3) | R$ 32,50 | 12.06 | 0.02 | auto_table_compact_columns | L0 +0.02; auto_table_compact_columns +9.03; collapsed_table_medium_border_insets_x +3 | -10.34 → -10.34 → -10.34 → -10.34 → -10.34 → -10.34 → 4.58 → 1.58 | -10.32 → -10.32 → -10.32 → -10.32 → -10.32 → -10.32 → 13.64 → 13.64 |
| body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(1)>td:nth-child(4) | R$ 1.300,00 | 12.06 | 3.03 | L0 | L0 +3.03; auto_table_compact_columns +6.04; collapsed_table_medium_border_insets_x +3 | -3.36 → -3.36 → -3.36 → -3.36 → -3.36 → -3.36 → 3.64 → 0.64 | -0.33 → -0.33 → -0.33 → -0.33 → -0.33 → -0.33 → 12.7 → 12.7 |
| body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(2)>td:nth-child(3) | R$ 18,90 | 12.06 | 0.02 | auto_table_compact_columns | L0 +0.02; auto_table_compact_columns +9.03; collapsed_table_medium_border_insets_x +3 | -10.34 → -10.34 → -10.34 → -10.34 → -10.34 → -10.34 → 4.58 → 1.58 | -10.32 → -10.32 → -10.32 → -10.32 → -10.32 → -10.32 → 13.64 → 13.64 |
| body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(2)>td:nth-child(4) | R$ 472,50 | 12.06 | 3.02 | L0 | L0 +3.02; auto_table_compact_columns +6.04; collapsed_table_medium_border_insets_x +3 | -3.36 → -3.36 → -3.36 → -3.36 → -3.36 → -3.36 → 3.63 → 0.63 | -0.34 → -0.34 → -0.34 → -0.34 → -0.34 → -0.34 → 12.69 → 12.69 |
| body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(3)>td:nth-child(4) | R$ 175,50 | 12.06 | 3.02 | L0 | L0 +3.02; auto_table_compact_columns +6.04; collapsed_table_medium_border_insets_x +3 | -3.36 → -3.36 → -3.36 → -3.36 → -3.36 → -3.36 → 3.63 → 0.63 | -0.34 → -0.34 → -0.34 → -0.34 → -0.34 → -0.34 → 12.69 → 12.69 |
| body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(4)>td:nth-child(3) | R$ 47,20 | 12.06 | 0.02 | auto_table_compact_columns | L0 +0.02; auto_table_compact_columns +9.03; collapsed_table_medium_border_insets_x +3 | -10.34 → -10.34 → -10.34 → -10.34 → -10.34 → -10.34 → 4.58 → 1.58 | -10.32 → -10.32 → -10.32 → -10.32 → -10.32 → -10.32 → 13.64 → 13.64 |
| body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(4)>td:nth-child(4) | R$ 2.832,00 | 12.06 | 3.03 | L0 | L0 +3.03; auto_table_compact_columns +6.04; collapsed_table_medium_border_insets_x +3 | -3.36 → -3.36 → -3.36 → -3.36 → -3.36 → -3.36 → 3.64 → 0.64 | -0.33 → -0.33 → -0.33 → -0.33 → -0.33 → -0.33 → 12.7 → 12.7 |
| body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(5)>td:nth-child(4) | R$ 768,00 | 12.06 | 3.02 | L0 | L0 +3.02; auto_table_compact_columns +6.04; collapsed_table_medium_border_insets_x +3 | -3.36 → -3.36 → -3.36 → -3.36 → -3.36 → -3.36 → 3.63 → 0.63 | -0.34 → -0.34 → -0.34 → -0.34 → -0.34 → -0.34 → 12.69 → 12.69 |
| body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(6)>td:nth-child(3) | R$ 28,00 | 12.06 | 0.02 | auto_table_compact_columns | L0 +0.02; auto_table_compact_columns +9.03; collapsed_table_medium_border_insets_x +3 | -10.34 → -10.34 → -10.34 → -10.34 → -10.34 → -10.34 → 4.58 → 1.58 | -10.32 → -10.32 → -10.32 → -10.32 → -10.32 → -10.32 → 13.64 → 13.64 |
| body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(6)>td:nth-child(4) | R$ 840,00 | 12.06 | 3.02 | L0 | L0 +3.02; auto_table_compact_columns +6.04; collapsed_table_medium_border_insets_x +3 | -3.36 → -3.36 → -3.36 → -3.36 → -3.36 → -3.36 → 3.63 → 0.63 | -0.34 → -0.34 → -0.34 → -0.34 → -0.34 → -0.34 → 12.69 → 12.69 |

Layer order of the trajectories: L0 → vertical_margin_collapse → collapsed_table_medium_border_insets → painted_table_cell_text_baselines → fixed_table_widths → table_percent_widths → auto_table_compact_columns → collapsed_table_medium_border_insets_x

Largest text-run changes (px; Δ = b − a of vellora−Chromium):

| owner | text | Δ final dx,dy | Δ L0 dx,dy | first changed layer | pin final dx,dy | beta4 final dx,dy |
| --- | --- | --- | --- | --- | --- | --- |
| body>table:nth-child(4)>tbody:nth-child(1)>tr:nth-child(4)>td:nth-child(1) | Total a pagar | 1.51, -111 | 1.5, -126 | L0 | -1.562, 110.984 | -0.05, -0.016 |
| body>table:nth-child(4)>tbody:nth-child(1)>tr:nth-child(4)>td:nth-child(2) | R$ 50.724,90 | -0.5, -111 | 2.5, -126 | L0 | 0.434, 110.984 | -0.066, -0.016 |
| body>div:nth-child(5)>h3:nth-child(1) | INSTRUÇÕES DE PAGAMENTO | 0, -111 | 0, -129 | L0 | 0, 114.109 | 0, 3.109 |
| body>div:nth-child(5)>p:nth-child(2) | Pagamento via transferência pa | 0, -111 | 0, -129 | L0 | 0, 114.719 | 0, 3.719 |
| body>div:nth-child(5)>p:nth-child(2) | fatura INV-2026-00417 no campo | 0, -111 | 0, -129 | L0 | 0, 114.328 | 0, 3.328 |
| body>div:nth-child(5)>p:nth-child(3) | Em caso de divergência nos ite | 0, -111 | 0, -129 | L0 | 0, 113.938 | 0, 2.938 |
| body>table:nth-child(4)>tbody:nth-child(1)>tr:nth-child(3)>td:nth-child(1) | Imposto (8%) | 1.54, -108 | 1.53, -123 | L0 | -1.58, 111.422 | -0.037, 3.422 |
| body>table:nth-child(4)>tbody:nth-child(1)>tr:nth-child(3)>td:nth-child(2) | R$ 3.757,40 | -0.47, -108 | 2.53, -123 | L0 | 0.425, 111.422 | -0.046, 3.422 |
| body>table:nth-child(4)>tbody:nth-child(1)>tr:nth-child(2)>td:nth-child(1) | Desconto | 1.53, -105 | 1.52, -120 | L0 | -1.562, 108.328 | -0.028, 3.328 |
| body>table:nth-child(4)>tbody:nth-child(1)>tr:nth-child(2)>td:nth-child(2) | - R$ 1.250,00 | -0.47, -105 | 2.53, -120 | L0 | 0.421, 108.328 | -0.047, 3.328 |

Largest box changes:

| path | Δ final dx,dy,dw,dh | first changed layer |
| --- | --- | --- |
| html | 0, 0, 0, -129 | N0 |
| body | 0, 0, 0, -129 | N0 |
| body>table:nth-child(4)>tbody:nth-child(1)>tr:nth-child(4)>td:nth-child(1) | 0, -111, 2.01, 0 | N0 |
| body>table:nth-child(4)>tbody:nth-child(1)>tr:nth-child(4)>td:nth-child(2) | -1.06, -111, 1.06, 0 | N0 |
| body>div:nth-child(5) | 0, -111, 0, 0 | N0 |
| body>div:nth-child(5)>h3:nth-child(1) | 0, -111, 0, 0 | N0 |
| body>div:nth-child(5)>p:nth-child(2) | 0, -111, 0, 0 | N0 |
| body>div:nth-child(5)>p:nth-child(3) | 0, -111, 0, 0 | N0 |
| body>table:nth-child(4)>tbody:nth-child(1)>tr:nth-child(3)>td:nth-child(1) | 0, -108, 2.01, 0 | N0 |
| body>table:nth-child(4)>tbody:nth-child(1)>tr:nth-child(3)>td:nth-child(2) | -1.06, -108, 1.06, 0 | N0 |

Top-level body children whose Blitz margins (L0 margin_top/margin_bottom, used by pagination's gaps) changed: body>div:nth-child(5) pin 37.8/12 → beta4 37.8/0

Bottom lines, PDF vs pre-pagination (pt, vellora − Chrome):

| run | line | page | PDF dy | pre-pagination dy | added after layout |
| --- | --- | --- | --- | --- | --- |
| pin | Pagamento via transferência para a conta | 3 | 5.7 | 86.04 | -80.34 |
| pin | fatura INV-2026-00417 no campo de identi | 3 | 5.7 | 85.75 | -80.05 |
| pin | Em caso de divergência nos itens, entre  | 3 | 4.95 | 85.45 | -80.5 |
| beta4 | Pagamento via transferência para a conta | 3 | -1.05 | 2.79 | -3.84 |
| beta4 | fatura INV-2026-00417 no campo de identi | 3 | -1.05 | 2.5 | -3.55 |
| beta4 | Em caso de divergência nos itens, entre  | 3 | -1.8 | 2.2 | -4 |

## receipt

- Chromium reference identical across both runs: yes
|  | pin | beta4 |
| --- | --- | --- |
| first divergent box | body>div:nth-child(1)>header:nth-child(1)>address:nth-child(4) (exit) first over tol. N0 | body>div:nth-child(1)>header:nth-child(1)>address:nth-child(4) (exit) first over tol. N0 |
| first divergent text | "CEP 01001-000" first over tol. L0 | "CEP 01001-000" first over tol. L0 |
| N0: box/text diverged, mean box err | 77/0, 45.719 | 78/0, 5.14 |
| B0: box/text diverged, mean box err | 78/0, 45.623 | 80/0, 6.135 |
| L0: box/text diverged, mean box err | 78/50, 45.623 | 80/45, 6.135 |
| vertical_margin_collapse: box/text diverged, mean box err | 78/50, 45.623 | 80/45, 6.135 |
| collapsed_table_medium_border_insets: box/text diverged, mean box err | 78/50, 38.626 | 80/45, 6.135 |
| painted_table_cell_text_baselines: box/text diverged, mean box err | 78/50, 38.626 | 80/41, 6.135 |
| fixed_table_widths: box/text diverged, mean box err | 78/50, 38.626 | 80/41, 6.135 |
| table_percent_widths: box/text diverged, mean box err | 78/50, 33.218 | 72/44, 6.028 |
| auto_table_compact_columns: box/text diverged, mean box err | 78/50, 33.218 | 72/44, 6.028 |
| collapsed_table_medium_border_insets_x: box/text diverged, mean box err | 78/50, 33.287 | 72/44, 6.028 |

- boxes whose final pre-pagination geometry changed: 57; by first changed layer: {"N0":57}
- text runs whose final position changed: 49; by first changed layer: {"L0":49}
  - of those, x changed: 26, first x-changing layer: {"L0":26}; y changed, first y-changing layer: {"L0":47}
  - where the x change comes from (Σ|part| px over those runs): {"L0":129.15,"table_percent_widths":197.12,"collapsed_table_medium_border_insets_x":54}; y: {"L0":1753,"collapsed_table_medium_border_insets":438}

Largest text-run X changes (px), with the x trajectory per layer (vellora − Chromium dx, L0 → final):

| owner | text | Δ final dx | Δ L0 dx | first x-changing layer | Δ dx by layer (sums to Δ final) | pin dx trajectory | beta4 dx trajectory |
| --- | --- | --- | --- | --- | --- | --- | --- |
| body>div:nth-child(1)>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(3)>td:nth-child(2) | Joana Pereira | 52.6 | 3.32 | L0 | L0 +3.32; table_percent_widths +49.28 | -2.88 → -2.88 → -2.88 → -2.88 → -2.88 → -51.08 → -51.08 → -51.08 | 0.44 → 0.44 → 0.44 → 0.44 → 0.44 → 1.52 → 1.52 → 1.52 |
| body>div:nth-child(1)>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(2) | REC-2026-000482 | 52.59 | 3.31 | L0 | L0 +3.31; table_percent_widths +49.28 | -2.88 → -2.88 → -2.88 → -2.88 → -2.88 → -51.08 → -51.08 → -51.08 | 0.42 → 0.42 → 0.42 → 0.42 → 0.42 → 1.5 → 1.5 → 1.5 |
| body>div:nth-child(1)>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(2)>td:nth-child(2) | 22/06/2026 14:37 | 52.59 | 3.31 | L0 | L0 +3.31; table_percent_widths +49.28 | -2.88 → -2.88 → -2.88 → -2.88 → -2.88 → -51.08 → -51.08 → -51.08 | 0.43 → 0.43 → 0.43 → 0.43 → 0.43 → 1.51 → 1.51 → 1.51 |
| body>div:nth-child(1)>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(4)>td:nth-child(2) | Cliente Final (CUST-0004 | 52.57 | 3.29 | L0 | L0 +3.29; table_percent_widths +49.28 | -2.92 → -2.92 → -2.92 → -2.92 → -2.92 → -51.12 → -51.12 → -51.12 | 0.37 → 0.37 → 0.37 → 0.37 → 0.37 → 1.45 → 1.45 → 1.45 |
| body>div:nth-child(1)>table:nth-child(4)>thead:nth-child(1)>tr:nth-child(1)>th:nth-child(2) | QTD | 13 | 10 | L0 | L0 +10; collapsed_table_medium_border_insets_x +3 | -11.23 → -11.23 → -11.23 → -11.23 → -11.23 → -11.23 → -11.23 → -14.23 | -1.23 → -1.23 → -1.23 → -1.23 → -1.23 → -1.23 → -1.23 → -1.23 |
| body>div:nth-child(1)>table:nth-child(4)>tbody:nth-child(2)>tr:nth-child(1)>td:nth-child(2) | 2 | 13 | 10 | L0 | L0 +10; collapsed_table_medium_border_insets_x +3 | -11.23 → -11.23 → -11.23 → -11.23 → -11.23 → -11.23 → -11.23 → -14.23 | -1.24 → -1.24 → -1.24 → -1.24 → -1.24 → -1.24 → -1.24 → -1.24 |
| body>div:nth-child(1)>table:nth-child(4)>tbody:nth-child(2)>tr:nth-child(2)>td:nth-child(2) | 1 | 13 | 10 | L0 | L0 +10; collapsed_table_medium_border_insets_x +3 | -11.23 → -11.23 → -11.23 → -11.23 → -11.23 → -11.23 → -11.23 → -14.23 | -1.24 → -1.24 → -1.24 → -1.24 → -1.24 → -1.24 → -1.24 → -1.24 |
| body>div:nth-child(1)>table:nth-child(4)>tbody:nth-child(2)>tr:nth-child(3)>td:nth-child(2) | 3 | 13 | 10 | L0 | L0 +10; collapsed_table_medium_border_insets_x +3 | -11.23 → -11.23 → -11.23 → -11.23 → -11.23 → -11.23 → -11.23 → -14.23 | -1.24 → -1.24 → -1.24 → -1.24 → -1.24 → -1.24 → -1.24 → -1.24 |
| body>div:nth-child(1)>table:nth-child(4)>tbody:nth-child(2)>tr:nth-child(4)>td:nth-child(2) | 1 | 13 | 10 | L0 | L0 +10; collapsed_table_medium_border_insets_x +3 | -11.23 → -11.23 → -11.23 → -11.23 → -11.23 → -11.23 → -11.23 → -14.23 | -1.24 → -1.24 → -1.24 → -1.24 → -1.24 → -1.24 → -1.24 → -1.24 |
| body>div:nth-child(1)>table:nth-child(4)>thead:nth-child(1)>tr:nth-child(1)>th:nth-child(3) | UNITÁRIO | 9 | 6 | L0 | L0 +6; collapsed_table_medium_border_insets_x +3 | -6.59 → -6.59 → -6.59 → -6.59 → -6.59 → -6.59 → -6.59 → -9.59 | -0.59 → -0.59 → -0.59 → -0.59 → -0.59 → -0.59 → -0.59 → -0.59 |

Layer order of the trajectories: L0 → vertical_margin_collapse → collapsed_table_medium_border_insets → painted_table_cell_text_baselines → fixed_table_widths → table_percent_widths → auto_table_compact_columns → collapsed_table_medium_border_insets_x

Largest text-run changes (px; Δ = b − a of vellora−Chromium):

| owner | text | Δ final dx,dy | Δ L0 dx,dy | first changed layer | pin final dx,dy | beta4 final dx,dy |
| --- | --- | --- | --- | --- | --- | --- |
| body>div:nth-child(1)>p:nth-child(6)>span:nth-child(1) | Obrigado pela sua compra! | -0.07, -57 | -0.07, -69 | L0 | -0.132, 67.016 | -0.2, 10.016 |
| body>div:nth-child(1)>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(3)>td:nth-child(2) | Joana Pereira | 52.6, -6 | 3.32, -9 | L0 | -51.079, 6.328 | 1.519, 0.328 |
| body>div:nth-child(1)>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(2) | REC-2026-000482 | 52.59, 0 | 3.31, -3 | L0 | -51.085, 0.547 | 1.504, 0.547 |
| body>div:nth-child(1)>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(2)>td:nth-child(2) | 22/06/2026 14:37 | 52.59, -3 | 3.31, -6 | L0 | -51.083, 3.438 | 1.509, 0.438 |
| body>div:nth-child(1)>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(4)>td:nth-child(2) | Cliente Final (CUST-00042) | 52.57, -9 | 3.29, -12 | L0 | -51.117, 9.219 | 1.449, 0.219 |
| body>div:nth-child(1)>div:nth-child(5)>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(4)>td:nth-child(1) | Situação | 0, -51 | -3, -66 | L0 | -0.234, 60.594 | -0.234, 9.594 |
| body>div:nth-child(1)>div:nth-child(5)>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(4)>td:nth-child(2) | Pago | 0.49, -51 | 3.49, -66 | L0 | -0.009, 60.594 | 0.479, 9.594 |
| body>div:nth-child(1)>div:nth-child(5)>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(3)>td:nth-child(1) | Autorização | 0, -48 | -3, -63 | L0 | -0.234, 57.703 | -0.234, 9.703 |
| body>div:nth-child(1)>div:nth-child(5)>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(3)>td:nth-child(2) | AUTH-7F3A9C21 | 0.46, -48 | 3.46, -63 | L0 | -0.038, 57.703 | 0.421, 9.703 |
| body>div:nth-child(1)>div:nth-child(5)>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(2)>td:nth-child(1) | Bandeira / detalhe | 0, -45 | -3, -60 | L0 | -0.234, 54.813 | -0.234, 9.813 |

Largest box changes:

| path | Δ final dx,dy,dw,dh | first changed layer |
| --- | --- | --- |
| html | 0, 0, 0, -69 | N0 |
| body | 0, 0, 0, -69 | N0 |
| body>div:nth-child(1) | 0, 0, 0, -69 | N0 |
| body>div:nth-child(1)>p:nth-child(6) | 0, -57, 0, 0 | N0 |
| body>div:nth-child(1)>p:nth-child(6)>span:nth-child(1) | 0, -57, 0, 0 | N0 |
| body>div:nth-child(1)>div:nth-child(5)>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(4)>td:nth-child(1) | 0, -51, -11.14, -1 | N0 |
| body>div:nth-child(1)>div:nth-child(5)>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(4)>td:nth-child(2) | -14.19, -51, 14.19, -1 | N0 |
| body>div:nth-child(1)>div:nth-child(5)>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(3)>td:nth-child(1) | 0, -48, -11.14, 0 | N0 |
| body>div:nth-child(1)>div:nth-child(5)>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(3)>td:nth-child(2) | -14.19, -48, 14.19, 0 | N0 |
| body>div:nth-child(1)>div:nth-child(5)>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(2)>td:nth-child(1) | 0, -45, -11.14, 0 | N0 |

Top-level body children whose Blitz margins (L0 margin_top/margin_bottom, used by pagination's gaps) changed: none

Bottom lines, PDF vs pre-pagination (pt, vellora − Chrome):

| run | line | page | PDF dy | pre-pagination dy | added after layout |
| --- | --- | --- | --- | --- | --- |
| pin | por você. | 2 | 164.37 |  |  |
| pin | Este recibo é um comprovante simplificad | 2 | 158.36 |  |  |
| pin | Cafeteria Aurora Ltda · www.cafeteria-au | 2 | 158.36 | -0.11 | 158.47 |
| beta4 | por você. | 2 | 11.77 |  |  |
| beta4 | Este recibo é um comprovante simplificad | 2 | 5.76 |  |  |
| beta4 | Cafeteria Aurora Ltda · www.cafeteria-au | 2 | 5.76 | -0.11 | 5.87 |

## boleto

- Chromium reference identical across both runs: yes
|  | pin | beta4 |
| --- | --- | --- |
| first divergent box | body>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(1) (enter) first over tol. N0 | body>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(1) (exit) first over tol. N0 |
| first divergent text | "999-9" first over tol. L0 | "999-9" first over tol. L0 |
| N0: box/text diverged, mean box err | 121/0, 33.7 | 129/0, 11.462 |
| B0: box/text diverged, mean box err | 121/0, 33.7 | 129/0, 11.462 |
| L0: box/text diverged, mean box err | 121/75, 33.7 | 129/77, 11.462 |
| vertical_margin_collapse: box/text diverged, mean box err | 121/75, 33.7 | 129/77, 11.462 |
| collapsed_table_medium_border_insets: box/text diverged, mean box err | 121/75, 33.7 | 129/77, 11.462 |
| painted_table_cell_text_baselines: box/text diverged, mean box err | 121/75, 33.7 | 129/75, 11.462 |
| fixed_table_widths: box/text diverged, mean box err | 116/72, 19.607 | 126/75, 11.462 |
| table_percent_widths: box/text diverged, mean box err | 116/72, 19.607 | 126/75, 11.462 |
| auto_table_compact_columns: box/text diverged, mean box err | 116/72, 19.612 | 126/75, 11.462 |
| collapsed_table_medium_border_insets_x: box/text diverged, mean box err | 116/72, 19.612 | 126/75, 11.462 |

- boxes whose final pre-pagination geometry changed: 81; by first changed layer: {"N0":81}
- text runs whose final position changed: 75; by first changed layer: {"L0":75}
  - of those, x changed: 27, first x-changing layer: {"L0":25,"fixed_table_widths":2}; y changed, first y-changing layer: {"L0":75}
  - where the x change comes from (Σ|part| px over those runs): {"L0":104.11,"fixed_table_widths":623,"auto_table_compact_columns":0.94}; y: {"L0":499}

Largest text-run X changes (px), with the x trajectory per layer (vellora − Chromium dx, L0 → final):

| owner | text | Δ final dx | Δ L0 dx | first x-changing layer | Δ dx by layer (sums to Δ final) | pin dx trajectory | beta4 dx trajectory |
| --- | --- | --- | --- | --- | --- | --- | --- |
| body>table:nth-child(6)>tbody:nth-child(1)>tr:nth-child(4)>td:nth-child(4)>span:nth-child(1) | (=) VALOR DO DOCUMENTO | -58.53 | -0.53 | L0 | L0 -0.53; fixed_table_widths -58 | -0.44 → -0.44 → -0.44 → -0.44 → 57.56 → 57.56 → 57.56 → 57.56 | -0.97 → -0.97 → -0.97 → -0.97 → -0.97 → -0.97 → -0.97 → -0.97 |
| body>table:nth-child(6)>tbody:nth-child(1)>tr:nth-child(5)>td:nth-child(2)>span:nth-child(1) | (-) DESCONTO / ABATIMENT | -58.53 | -0.53 | L0 | L0 -0.53; fixed_table_widths -58 | -0.45 → -0.45 → -0.45 → -0.45 → 57.55 → 57.55 → 57.55 → 57.55 | -0.98 → -0.98 → -0.98 → -0.98 → -0.98 → -0.98 → -0.98 → -0.98 |
| body>table:nth-child(6)>tbody:nth-child(1)>tr:nth-child(6)>td:nth-child(1)>span:nth-child(1) | (-) OUTRAS DEDUÇÕES | -58.52 | -0.52 | L0 | L0 -0.52; fixed_table_widths -58 | -0.43 → -0.43 → -0.43 → -0.43 → 57.57 → 57.57 → 57.57 → 57.57 | -0.95 → -0.95 → -0.95 → -0.95 → -0.95 → -0.95 → -0.95 → -0.95 |
| body>table:nth-child(6)>tbody:nth-child(1)>tr:nth-child(8)>td:nth-child(1)>span:nth-child(1) | (=) VALOR COBRADO | -58.51 | -0.51 | L0 | L0 -0.51; fixed_table_widths -58 | -0.43 → -0.43 → -0.43 → -0.43 → 57.57 → 57.57 → 57.57 → 57.57 | -0.94 → -0.94 → -0.94 → -0.94 → -0.94 → -0.94 → -0.94 → -0.94 |
| body>table:nth-child(6)>tbody:nth-child(1)>tr:nth-child(3)>td:nth-child(4)>span:nth-child(1) | NOSSO NÚMERO | -58.5 | -0.5 | L0 | L0 -0.5; fixed_table_widths -58 | -0.4 → -0.4 → -0.4 → -0.4 → 57.6 → 57.6 → 57.6 → 57.6 | -0.9 → -0.9 → -0.9 → -0.9 → -0.9 → -0.9 → -0.9 → -0.9 |
| body>table:nth-child(6)>tbody:nth-child(1)>tr:nth-child(7)>td:nth-child(1)>span:nth-child(1) | (+) MORA / MULTA | -58.5 | -0.5 | L0 | L0 -0.5; fixed_table_widths -58 | -0.4 → -0.4 → -0.4 → -0.4 → 57.6 → 57.6 → 57.6 → 57.6 | -0.91 → -0.91 → -0.91 → -0.91 → -0.91 → -0.91 → -0.91 → -0.91 |
| body>table:nth-child(6)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(2)>span:nth-child(1) | VENCIMENTO | -58.49 | -0.49 | fixed_table_widths | L0 -0.49; fixed_table_widths -58 | -0.39 → -0.39 → -0.39 → -0.39 → 57.61 → 57.61 → 57.61 → 57.61 | -0.89 → -0.89 → -0.89 → -0.89 → -0.89 → -0.89 → -0.89 → -0.89 |
| body>table:nth-child(3)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(2)>span:nth-child(1) | AGÊNCIA / CÓDIGO DO BENE | -54.76 | -0.76 | L0 | L0 -0.76; fixed_table_widths -54 | -0.35 → -0.35 → -0.35 → -0.35 → 53.65 → 53.65 → 53.65 → 53.65 | -1.11 → -1.11 → -1.11 → -1.11 → -1.11 → -1.11 → -1.11 → -1.11 |
| body>table:nth-child(3)>tbody:nth-child(1)>tr:nth-child(2)>td:nth-child(3)>span:nth-child(1) | VALOR DO DOCUMENTO | -54.73 | -0.73 | L0 | L0 -0.73; fixed_table_widths -54 | -0.31 → -0.31 → -0.31 → -0.31 → 53.69 → 53.69 → 53.69 → 53.69 | -1.03 → -1.03 → -1.03 → -1.03 → -1.03 → -1.03 → -1.03 → -1.03 |
| body>table:nth-child(7)>thead:nth-child(1)>tr:nth-child(1)>td:nth-child(3)>span:nth-child(1) | VALOR | 26.98 | -0.02 | fixed_table_widths | L0 -0.02; fixed_table_widths +27 | -0.92 → -0.92 → -0.92 → -0.92 → -27.92 → -27.92 → -27.92 → -27.92 | -0.94 → -0.94 → -0.94 → -0.94 → -0.94 → -0.94 → -0.94 → -0.94 |

Layer order of the trajectories: L0 → vertical_margin_collapse → collapsed_table_medium_border_insets → painted_table_cell_text_baselines → fixed_table_widths → table_percent_widths → auto_table_compact_columns → collapsed_table_medium_border_insets_x

Largest text-run changes (px; Δ = b − a of vellora−Chromium):

| owner | text | Δ final dx,dy | Δ L0 dx,dy | first changed layer | pin final dx,dy | beta4 final dx,dy |
| --- | --- | --- | --- | --- | --- | --- |
| body>table:nth-child(6)>tbody:nth-child(1)>tr:nth-child(4)>td:nth-child(4)>span:nth-child(1) | (=) VALOR DO DOCUMENTO | -58.53, 8 | -0.53, 8 | L0 | 57.563, -0.812 | -0.966, 7.188 |
| body>table:nth-child(6)>tbody:nth-child(1)>tr:nth-child(5)>td:nth-child(2)>span:nth-child(1) | (-) DESCONTO / ABATIMENTO | -58.53, 8 | -0.53, 8 | L0 | 57.55, 1.109 | -0.983, 9.109 |
| body>table:nth-child(6)>tbody:nth-child(1)>tr:nth-child(6)>td:nth-child(1)>span:nth-child(1) | (-) OUTRAS DEDUÇÕES | -58.52, 9 | -0.52, 9 | L0 | 57.572, 3.031 | -0.946, 12.031 |
| body>table:nth-child(6)>tbody:nth-child(1)>tr:nth-child(8)>td:nth-child(1)>span:nth-child(1) | (=) VALOR COBRADO | -58.51, 9 | -0.51, 9 | L0 | 57.572, 6.875 | -0.941, 15.875 |
| body>table:nth-child(6)>tbody:nth-child(1)>tr:nth-child(3)>td:nth-child(4)>span:nth-child(1) | NOSSO NÚMERO | -58.5, 8 | -0.5, 8 | L0 | 57.597, -2.734 | -0.905, 5.266 |
| body>table:nth-child(6)>tbody:nth-child(1)>tr:nth-child(7)>td:nth-child(1)>span:nth-child(1) | (+) MORA / MULTA | -58.5, 9 | -0.5, 9 | L0 | 57.596, 4.953 | -0.907, 13.953 |
| body>table:nth-child(6)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(2)>span:nth-child(1) | VENCIMENTO | -58.49, -3 | -0.49, -3 | L0 | 57.608, 4.734 | -0.886, 1.734 |
| body>table:nth-child(3)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(2)>span:nth-child(1) | AGÊNCIA / CÓDIGO DO BENEFICIÁR | -54.76, -2 | -0.76, -2 | L0 | 53.651, -1.016 | -1.111, -3.016 |
| body>table:nth-child(3)>tbody:nth-child(1)>tr:nth-child(2)>td:nth-child(3)>span:nth-child(1) | VALOR DO DOCUMENTO | -54.73, -2 | -0.73, -2 | L0 | 53.694, 0.906 | -1.035, -1.094 |
| body>table:nth-child(7)>thead:nth-child(1)>tr:nth-child(1)>td:nth-child(3)>span:nth-child(1) | VALOR | 26.98, 8 | -0.02, 8 | L0 | -27.924, 12.234 | -0.941, 20.234 |

Largest box changes:

| path | Δ final dx,dy,dw,dh | first changed layer |
| --- | --- | --- |
| body>table:nth-child(3)>tbody:nth-child(1)>tr:nth-child(2)>td:nth-child(2)>span:nth-child(1) | -1, -2, 59, 0 | N0 |
| body>table:nth-child(6)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(1)>span:nth-child(1) | 0, -3, 59, -1 | N0 |
| body>table:nth-child(6)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(2)>span:nth-child(1) | 0, -3, -59, -1 | N0 |
| body>table:nth-child(6)>tbody:nth-child(1)>tr:nth-child(2)>td:nth-child(1)>span:nth-child(1) | 0, -4, 59, 0 | N0 |
| body>table:nth-child(6)>tbody:nth-child(1)>tr:nth-child(2)>td:nth-child(2)>span:nth-child(1) | 0, -4, -59, 12 | N0 |
| body>table:nth-child(6)>tbody:nth-child(1)>tr:nth-child(3)>td:nth-child(4)>span:nth-child(1) | 0, 8, -59, 0 | N0 |
| body>table:nth-child(6)>tbody:nth-child(1)>tr:nth-child(4)>td:nth-child(4)>span:nth-child(1) | 0, 8, -59, 0 | N0 |
| body>table:nth-child(6)>tbody:nth-child(1)>tr:nth-child(5)>td:nth-child(1)>span:nth-child(1) | 0, 8, 59, 0 | N0 |
| body>table:nth-child(6)>tbody:nth-child(1)>tr:nth-child(5)>td:nth-child(2)>span:nth-child(1) | 0, 8, -59, 0 | N0 |
| body>table:nth-child(6)>tbody:nth-child(1)>tr:nth-child(6)>td:nth-child(1)>span:nth-child(1) | 0, 9, -59, -1 | N0 |

Top-level body children whose Blitz margins (L0 margin_top/margin_bottom, used by pagination's gaps) changed: none

Bottom lines, PDF vs pre-pagination (pt, vellora − Chrome):

| run | line | page | PDF dy | pre-pagination dy | added after layout |
| --- | --- | --- | --- | --- | --- |
| pin | 06/2026 Taxa de processamento R$ 46,50 | 1 | 8.54 | 12.12 | -3.58 |
| pin | CÓDIGO DE BARRAS (REPRESENTAÇÃO TEXTUAL  | 1 | 11.46 | 15 | -3.54 |
| pin | Documento de cobrança fictício gerado po | 1 | 12.7 | 15.68 | -2.98 |
| beta4 | 06/2026 Taxa de processamento R$ 46,50 | 1 | 15.29 | 18.87 | -3.58 |
| beta4 | CÓDIGO DE BARRAS (REPRESENTAÇÃO TEXTUAL  | 1 | 18.21 | 21.75 | -3.54 |
| beta4 | Documento de cobrança fictício gerado po | 1 | 18.7 | 21.68 | -2.98 |

## notification

- Chromium reference identical across both runs: yes
|  | pin | beta4 |
| --- | --- | --- |
| first divergent box | body>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(1) (enter) first over tol. N0 | body>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(1) (enter) first over tol. N0 |
| first divergent text | "Acme Serviços Prediais Ltda." first over tol. L0 | "Acme Serviços Prediais Ltda." first over tol. L0 |
| N0: box/text diverged, mean box err | 41/0, 30.034 | 29/0, 15.082 |
| B0: box/text diverged, mean box err | 41/0, 30.034 | 29/0, 15.082 |
| L0: box/text diverged, mean box err | 41/33, 30.034 | 29/18, 15.082 |
| vertical_margin_collapse: box/text diverged, mean box err | 41/33, 30.034 | 29/18, 15.082 |
| collapsed_table_medium_border_insets: box/text diverged, mean box err | 32/25, 26.821 | 29/18, 15.082 |
| painted_table_cell_text_baselines: box/text diverged, mean box err | 32/25, 26.821 | 29/18, 15.082 |
| fixed_table_widths: box/text diverged, mean box err | 32/25, 26.821 | 29/18, 15.082 |
| table_percent_widths: box/text diverged, mean box err | 32/24, 6.299 | 29/18, 4.089 |
| auto_table_compact_columns: box/text diverged, mean box err | 32/24, 6.299 | 29/18, 4.089 |
| collapsed_table_medium_border_insets_x: box/text diverged, mean box err | 32/21, 6.22 | 29/18, 4.089 |

- boxes whose final pre-pagination geometry changed: 9; by first changed layer: {"N0":9}
- text runs whose final position changed: 10; by first changed layer: {"L0":10}
  - of those, x changed: 3, first x-changing layer: {"L0":3}; y changed, first y-changing layer: {"L0":7}
  - where the x change comes from (Σ|part| px over those runs): {"L0":165,"table_percent_widths":162}; y: {"L0":45,"collapsed_table_medium_border_insets":42}

Largest text-run X changes (px), with the x trajectory per layer (vellora − Chromium dx, L0 → final):

| owner | text | Δ final dx | Δ L0 dx | first x-changing layer | Δ dx by layer (sums to Δ final) | pin dx trajectory | beta4 dx trajectory |
| --- | --- | --- | --- | --- | --- | --- | --- |
| body>div:nth-child(5)>table:nth-child(3)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(2) | R$ 4.875,50 | -1 | -55 | L0 | L0 -55; table_percent_widths +54 | 119.38 → 119.38 → 119.38 → 119.38 → 119.38 → -0.02 → -0.02 → -0.02 | 64.38 → 64.38 → 64.38 → 64.38 → 64.38 → -1.02 → -1.02 → -1.02 |
| body>div:nth-child(5)>table:nth-child(3)>tbody:nth-child(1)>tr:nth-child(2)>td:nth-child(2) | 15/05/2026 | -1 | -55 | L0 | L0 -55; table_percent_widths +54 | 119.38 → 119.38 → 119.38 → 119.38 → 119.38 → -0.02 → -0.02 → -0.02 | 64.38 → 64.38 → 64.38 → 64.38 → 64.38 → -1.02 → -1.02 → -1.02 |
| body>div:nth-child(5)>table:nth-child(3)>tbody:nth-child(1)>tr:nth-child(3)>td:nth-child(2) | 15 dias corridos (até 07 | -1 | -55 | L0 | L0 -55; table_percent_widths +54 | 119.38 → 119.38 → 119.38 → 119.38 → 119.38 → -0.02 → -0.02 → -0.02 | 64.38 → 64.38 → 64.38 → 64.38 → 64.38 → -1.02 → -1.02 → -1.02 |

Layer order of the trajectories: L0 → vertical_margin_collapse → collapsed_table_medium_border_insets → painted_table_cell_text_baselines → fixed_table_widths → table_percent_widths → auto_table_compact_columns → collapsed_table_medium_border_insets_x

Largest text-run changes (px; Δ = b − a of vellora−Chromium):

| owner | text | Δ final dx,dy | Δ L0 dx,dy | first changed layer | pin final dx,dy | beta4 final dx,dy |
| --- | --- | --- | --- | --- | --- | --- |
| body>div:nth-child(3)>div:nth-child(1) | AO(À) DESTINATÁRIO(A) | 0, -1 | 0, -7 | L0 | 0, -0.234 | 0, -1.234 |
| body>div:nth-child(3)>div:nth-child(2) | Comércio Faro Azul Ltda. ME | 0, 1 | 0, -5 | L0 | 0, -0.703 | 0, 0.297 |
| body>div:nth-child(3)>div:nth-child(5) | Campinas — SP, CEP 13010-000 | 0, 1 | 0, -5 | L0 | 0, -0.641 | 0, 0.359 |
| body>div:nth-child(5)>p:nth-child(2) | Conforme os registros em nosso | 0, -1 | 0, -7 | L0 | 0, 0.734 | 0, -0.266 |
| body>div:nth-child(5)>p:nth-child(2) | 15/05/2026. Solicitamos a regu | 0, -1 | 0, -7 | L0 | 0, 0.734 | 0, -0.266 |
| body>div:nth-child(5)>p:nth-child(2) | corridos, contados a partir do | 0, -1 | 0, -7 | L0 | 0, 0.734 | 0, -0.266 |
| body>div:nth-child(5)>table:nth-child(3)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(2) | R$ 4.875,50 | -1, 0 | -55, -6 | L0 | -0.025, -1.922 | -1.025, -1.922 |
| body>div:nth-child(5)>table:nth-child(3)>tbody:nth-child(1)>tr:nth-child(2)>td:nth-child(2) | 15/05/2026 | -1, 0 | -55, -6 | L0 | -0.025, 0.094 | -1.025, 0.094 |
| body>div:nth-child(5)>table:nth-child(3)>tbody:nth-child(1)>tr:nth-child(3)>td:nth-child(2) | 15 dias corridos (até 07/07/20 | -1, 0 | -55, -6 | L0 | -0.025, 2.109 | -1.025, 2.109 |
| body>div:nth-child(5)>p:nth-child(5) | Segue, em anexo, demonstrativo | 0, -1 | 0, -7 | L0 | 0, 6.813 | 0, 5.813 |

Largest box changes:

| path | Δ final dx,dy,dw,dh | first changed layer |
| --- | --- | --- |
| body>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(1) | 0, 0, 30.16, 0 | N0 |
| body>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(2) | 27.14, 0, -27.13, 0 | N0 |
| html | 0, 0, 0, -6 | N0 |
| body | 0, 0, 0, -6 | N0 |
| body>div:nth-child(3)>div:nth-child(2) | 0, 1, 0, 0 | N0 |
| body>div:nth-child(3)>div:nth-child(5) | 0, 1, 0, 0 | N0 |
| body>div:nth-child(5)>p:nth-child(2) | 0, -1, 0, 0 | N0 |
| body>div:nth-child(5)>p:nth-child(5) | 0, -1, 0, 0 | N0 |
| body>div:nth-child(6)>div:nth-child(2) | 0, -1, 0, 0 | N0 |

Top-level body children whose Blitz margins (L0 margin_top/margin_bottom, used by pagination's gaps) changed: body>div:nth-child(5) pin 0/14.67 → beta4 0/0

Bottom lines, PDF vs pre-pagination (pt, vellora − Chrome):

| run | line | page | PDF dy | pre-pagination dy | added after layout |
| --- | --- | --- | --- | --- | --- |
| pin | Sendo o que se apresenta para o momento, | 1 | 2.28 | 4.62 | -2.34 |
| pin | Mariana Oliveira Souza | 1 | -7.15 | 4.89 | -12.04 |
| pin | Gerente do Departamento de Cobrança | 1 | -7.62 | 4.89 | -12.51 |
| beta4 | Sendo o que se apresenta para o momento, | 1 | -0.73 | 4.62 | -5.35 |
| beta4 | Mariana Oliveira Souza | 1 | -21.15 | 4.89 | -26.04 |
| beta4 | Gerente do Departamento de Cobrança | 1 | -21.61 | 4.89 | -26.5 |

