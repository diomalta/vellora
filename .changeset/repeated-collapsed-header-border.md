---
"vellora": patch
"@vellora/native": patch
"@vellora/wasm": patch
"@vellora/lint": patch
"@vellora/cli": patch
"@vellora/engine-chromium": patch
---

Keep the bottom border of a repeated `<thead>` in a `border-collapse: collapse` table (#62).
The edge between the header and the first body row was painted only by that body row, so the
header repeated on the next pages came without it. The header cells now paint it too, and the
row that continues the table paints its own top edge over it, as Chrome does (measured on
Playwright Chromium 153, indicative). PDFs of collapsed tables with a bordered `<thead>` gain
these rectangles; other documents are byte-identical.
