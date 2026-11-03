---
"vellora": patch
"@vellora/native": patch
"@vellora/lint": patch
"@vellora/cli": patch
"@vellora/engine-chromium": patch
---

Continue multi-column containers across pages and paint `outline` (issue #52).

A multi-column container longer than the rest of its page was balanced as one block and then cut
through all of its columns at the page end, so each column continued at the top of the next page
(css-multicol-1 §8.2). It now continues on the next page the way Chrome prints it: each page holds
one row of the container's columns, as tall as the room the page leaves, the content fills the
columns of one page before the next, and the last page's columns are balanced. A fixed-height
container continues until its height is used up. Repro: 20 blocks of 50 px in `columns: 2` on
300 px pages now print blocks 0-5 and 6-11 side by side on page 1 and 12-15 / 16-19 on page 2.

`outline`, `outline-width`, `outline-style`, `outline-color` and `outline-offset` are now painted:
outside the border box, over the content, around each fragment of a box broken across pages or
columns, and clipped by an `overflow` clipping ancestor (`dashed` / `dotted` as border sides are;
rounded corners are not modelled and `outline-style: auto` is not painted).

PDFs of documents with an outline, or with a multi-column container that crosses a page end,
change. Other documents are byte-identical.
