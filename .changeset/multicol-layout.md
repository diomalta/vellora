---
"vellora": patch
"@vellora/native": patch
"@vellora/lint": patch
"@vellora/cli": patch
"@vellora/engine-chromium": patch
---

Lay out multi-column containers (`columns`, `column-count`, `column-width`, `column-gap`,
`column-fill`). They were accepted by the strict gate and printed in one column; the native
engine (Blitz) has no multi-column layout, so vellora now lays the columns out itself, following
Chrome's print output: the column count and width of CSS Multi-column §3.4, content broken
between columns between lines and boxes (never inside a line, an image, an `inline-block`, a
`contain: size` box or a `break-inside: avoid` box that fits a column), `break-before: column` /
`break-after: column`, `break-before/after: avoid` between columns, `orphans` / `widows` as
declared for column breaks, the space at a column break truncated, balanced columns by default
(`column-fill: balance`) and filled columns with `column-fill: auto`, and absolutely positioned
boxes placed against their containing block. `column-span: all`, `column-rule`, nested
multi-column containers and a multi-column container longer than a page are not laid out as
Chrome does yet (see COMPATIBILITY.md). The input HTML is not changed, and documents without
multi-column containers are byte-identical.

Measured on the repo's fidelity harness (local macOS, Chrome for Testing 155.0.8059.85
reference; indicative, not CI): WPT reftest passes in the default suites 4157 -> 4416 (8047
tests); css/css-break 115 -> 371 and css/css-multicol 60 -> 122. Six earlier css/css-break passes
are now failures; the old renders matched Chrome's by coincidence (one column of content that
Blitz does not lay out as Chrome does: an inline SVG, table captions, a non-cell table child, a
float beside a line, and forced breaks between items at the same height), listed in
`fidelity/gate/snapshots/2026-10-28/c05-multicol/README.md`.
