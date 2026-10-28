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
reference; indicative, not CI): WPT reftest passes in the default suites 4157 -> 4414 (8047
tests; gated Phase C 05 tip run 20261028T062527Z, which also carries the float rule that loses
float-nowrap-7/-8; the multi-column branch alone measured 4416); css/css-break 115 -> 371 and
css/css-multicol 60 -> 122. Six earlier css/css-break passes became failures with the columns:
their one-column renders happened to look like Chrome's (the harness's ink check), and in columns
they exposed what vellora or Blitz did not lay out as Chrome does (an inline SVG, table captions,
a non-cell table child, a float beside a line, forced breaks between items at the same height).
Five of them pass again in this release (inline SVG painting, anonymous table objects and the
caption wrapper, forced column breaks in document order; gated Phase C 06 tip run
20261028T084519Z); `css/css-break/widows-orphans-021.html` (the float beside a line) still fails.
They are listed in `fidelity/gate/snapshots/2026-10-28/c05-multicol/README.md` (evidence archive: git tag `fidelity-archive-2026-10-28`, commit `b5c9546`) and
`fidelity/gate/snapshots/2026-10-28/c06/README.md` (same archive tag).
