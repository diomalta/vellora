---
"vellora": patch
"@vellora/native": patch
"@vellora/lint": patch
"@vellora/cli": patch
"@vellora/engine-chromium": patch
---

Honour `break-after: page` and `page-break-after: always`. The box that follows one with a
forced break after it now starts a new page, from `<style>` rules (also inside `@media`) and
inline `style`, as Chrome does: a break after a last child moves to its parent, a break after
an item of a row flex line goes after the whole line, nothing follows a break after the last box
(no blank trailing page), and an empty element after the break still gets its page. Inline-block,
floated and absolutely positioned boxes neither force the break nor take it.

Tables follow Chrome's print rules more closely: a `<thead>` taller than a quarter of the page's
content height is printed once instead of on every page (a forced break after it then works),
`<tfoot>` rows are printed after the body even when the footer is written first, and a
`break-inside: avoid` `<tbody>` with one row taller than a page starts on a new page before it is
split. The input HTML is not changed. Documents without these constructs are byte-identical.

Named pages force their page breaks: wherever the `page` name changes between two adjacent
blocks (`<section style="page: cover">` then `<section>`), the second starts a new page, as in
Chrome. Only the break is implemented; a named `@page cover { … }` rule does not yet change that
page's size or margins.

Measured on the repo's fidelity harness (local macOS, Chrome for Testing 155.0.8059.85
reference; indicative, not CI): WPT reftest passes 3762 -> 3783 (8047 tests), including the six
css/CSS2/pagination tests whose references use `page-break-after` and 10 css/css-page named-page
tests. Three earlier passes are now failures (css/css-page/page-name-flex-001/002/004, which
Chrome fails too); those passes were false (vellora printed 1 page where Chrome prints 3 or 4).
