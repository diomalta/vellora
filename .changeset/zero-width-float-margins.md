---
"vellora": patch
"@vellora/native": patch
---

Apply a negative margin next to a zero-width float, as Chrome does. This applies to a box that
starts its own formatting context, such as `overflow: hidden`, `display: flow-root` or a
table, when it sits beside a float whose width is 0 at the edge of its container. Before, the
native engine stopped the box's negative margin at the float's edge. Chrome treats a zero-width
float at the edge as no float at all, and vellora now does the same. A box with zero-width
floats on both sides keeps the previous placement. The input HTML is not changed.

Measured on the repo's fidelity harness (local macOS, Chrome for Testing 155.0.8059.85
reference; indicative, not CI): 1 more WPT reftest passes
(`css/CSS2/floats/zero-width-floats`), none lost, and the PDFs of the 9 fixture documents are
byte-identical.
