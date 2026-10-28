---
"vellora": patch
"@vellora/native": patch
"@vellora/lint": patch
"@vellora/cli": patch
"@vellora/engine-chromium": patch
---

Lay out table captions and anonymous table boxes. The native engine (Blitz) drops a table's
captions and every child of a table, row group or row that is not a row or cell (text, or a
block): they took no space and were not drawn. vellora now builds the boxes CSS 2.2 §17.2.1 and
§17.4 call for before layout, following Chrome's print output: captions above the table
(`caption-side: top`) or below it (`bottom`), in document order, with their margins, inside a box
as wide as the table that takes the table's margins, positioning and float; an anonymous row
around a table's non-row children and an anonymous cell around a row's non-cell children. A
caption's minimum width does not widen the table yet, and rows or cells outside any table are
still laid out as blocks (see COMPATIBILITY.md). The input HTML is not changed, and documents
without captions or misplaced table children lay out as before. At a column break, a top margin
that adjoins the break through empty boxes at the top of the next column is now truncated too,
as Chrome does (a table whose first caption is empty, broken before its second caption). A
table's `break-before/after/inside` and `page` apply to the box that holds it and its captions,
and a `break-inside: avoid` box taller than a page now starts on a new page when the current one
already holds content, before it breaks (Chrome's behaviour).

Measured on the repo's fidelity harness (local macOS, Chrome for Testing 155.0.8059.85
reference; indicative, not CI): WPT reftest passes in css/css-tables, css/css-break and
css/CSS2/tables 538 -> 579 (1664 tests, none lost), css/css-multicol unchanged (122 of 467); all
default suites 4414 -> 4494 of 8047. The 15 default-suite passes lost were false passes (the
harness's ink check flagged them: test and reference both rendered without the content Chrome
draws). Twelve of them compare a caption with a reference `<img>` that has no `width`/`height`,
which vellora does not draw (a documented dev-time-fixable case); three are `inline-table` tests
whose newly drawn content shows other gaps (in one, `visibility: hidden` is not honoured).
