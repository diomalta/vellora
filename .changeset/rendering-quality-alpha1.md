---
"vellora": patch
"@vellora/native": patch
"@vellora/lint": patch
"@vellora/cli": patch
---

Improve browser-compatible document rendering for invoice and boleto templates.

- Preserve anonymous inline text that appears beside block-flow children in flow containers, fixing
  table-cell label/value text and boleto barcode text that previously disappeared.
- Emit CSS backgrounds and borders into the PDF display list, restoring table headers, zebra rows,
  field grids, and boleto separators.
- Preserve top-level fragment spacing during pagination without moving totals blocks onto a
  different page.
- Add regressions for mixed-flow text, CSS-variable backgrounds, table borders, invoice header
  bands, and inter-table spacing.
