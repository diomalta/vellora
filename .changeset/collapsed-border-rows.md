---
"vellora": patch
"@vellora/native": patch
"@vellora/lint": patch
"@vellora/cli": patch
"@vellora/engine-chromium": patch
---

Lay out `border-collapse: collapse` tables at Chrome's row height. Blitz 0.3.0-beta.4 made each
row of such a table taller than Chrome by twice the border width, so content below a bordered
table drifted down the page (repro: a 3-row table with 1 px cell borders was 118 px tall instead
of Chrome's 112 px). The native engine now applies the collapsing border model itself: it
resolves the conflicting borders of cells, rows, row groups and the table (CSS 2.1 §17.6.2), and
gives each cell and the table its share of each resolved edge before layout. The collapsed borders
are painted once, at full width, over the grid lines, in left-to-right and right-to-left tables.
In those tables a cell's `height` is now a minimum, as in Chrome: the cell grows with its
content. The input HTML is not changed.

Two older corrections for the same drift were removed: a 2 px raise of the text in painted table
rows, and a pagination rule that closed the gaps between collapsed-table rows. PDFs of documents
with bordered collapsed tables change. Documents without one are byte-identical.

Measured on the repo's fidelity harness (local macOS, Chrome for Testing 155.0.8059.85
reference; indicative, not CI), PDF words more than 1 mm from Chrome's position: danfe 470 of
590 → 0 of 630, text-stress-ptbr 412 of 751 → 0 of 1833, boleto 229 → 0, boleto-febraban 150 → 0,
notification 90 → 0. The danfe fixture now prints on 1 page like Chrome (was 2), and
text-stress-ptbr on 7 (was 8).
