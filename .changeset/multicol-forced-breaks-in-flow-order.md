---
"vellora": patch
"@vellora/native": patch
"@vellora/lint": patch
"@vellora/cli": patch
"@vellora/engine-chromium": patch
---

Multi-column layout: forced column breaks (`break-before: column`, and `break-after: column` on
the box before) are also taken in document order, as Chrome does. Several forced breaks whose
boxes start at the same height (flex lines made 0 px tall by negative margins, for example) now
each start a new column instead of sharing one; a forced break on a row flex item moves its whole
flex line; and a negative top margin after a forced break is kept, so the box starts above the
column's top. Documents without multi-column containers are unchanged.

Measured on the repo's fidelity harness (local macOS, Chrome for Testing 155.0.8059.85
reference; indicative, not CI): css/css-break 371 -> 372 reftest passes (WPT
css/css-break/flexbox/multi-line-row-flex-fragmentation-045 now passes), css/css-multicol 122
unchanged, no pass lost.
