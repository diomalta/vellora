---
"vellora": patch
"@vellora/native": patch
"@vellora/lint": patch
"@vellora/cli": patch
"@vellora/engine-chromium": patch
---

A percentage `width` on a table cell now sizes its whole column, as in CSS 2.2 §17.5.2 and Chrome
(#75). Before, only the rows holding a percentage cell were resized: with `td.desc { width: 50% }`
and no width on the matching `<th>`, the `<thead>` row kept the auto column widths and its labels
drifted off the body's columns (header "Qty." centred 77 px left of the body's "145"). Now every
row, the header included, shares the same column edges. The rest of the table's width goes to the
other columns in proportion to their content width, and `border-spacing` gaps are kept outside the
percentage base, as Chrome does (issue table, 657 px wide: Chrome 328.5 / 58.25 / 119.98 /
150.27 px per column, vellora now within 1 px). `table-layout: fixed` tables are unchanged. The
input HTML is not changed.
