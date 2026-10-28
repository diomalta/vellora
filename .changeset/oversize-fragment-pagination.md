---
"vellora": patch
"@vellora/native": patch
"@vellora/lint": patch
"@vellora/cli": patch
"@vellora/engine-chromium": patch
---

Break content that is taller than a page across pages. Before this, a single block taller than
a page (an e-mail style layout table that holds the whole document, a body made only of inline
text, a long bordered box) was placed whole on one page, and everything past the page edge was
written outside the visible page. The native engine now breaks such a block the way Chrome does:
between lines and between boxes, keeping a table row together when it fits on a page, keeping at
least two lines of a paragraph on each side of a break, repeating a table's `<thead>` at the top
of the next page, and continuing backgrounds and borders across the break. The input HTML is not
changed. Documents with no block taller than a page are byte-identical.

Measured on the repo's fidelity harness (local macOS, Chrome for Testing 155.0.8059.85
reference; indicative, not CI): the oss-postmark-receipt fixture prints 2 pages like Chrome (was
1, with 37 words outside the page), and every word is now on a page. Differences from Chrome
that remain: a block taller than a page that paints nothing on the next page does not produce
blank pages (Chrome prints them), and a rounded border cut by a page break is drawn whole on its
first page.
