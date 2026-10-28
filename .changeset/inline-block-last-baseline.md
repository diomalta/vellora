---
"vellora": patch
"@vellora/native": patch
---

Align an `inline-block` on its last line, as Chrome does. When the inline-block's content was
block-level (two `<p>`s, a `<div>` per row), the native engine aligned it on its first line: the
layout engine reports only the first baseline of a block container. vellora now finds the last
baseline the way Chrome 155 does and shifts the box by the difference. A block with
`overflow: hidden` (or `scroll` / `auto`) counts with its bottom margin edge. Text next to such
an inline-block moves to Chrome's position. An inline-block whose last block-level child is a
flex or grid container keeps the previous placement. The input HTML is not changed.

Measured on the repo's fidelity harness (local macOS, Chrome for Testing 155.0.8059.85
reference; indicative, not CI): 2 more WPT reftests pass
(`css/CSS2/linebox/baseline-block-with-overflow-001`, `css/CSS2/visudet/inline-block-baseline-011`),
none lost, and the PDFs of the 9 fixture documents are byte-identical.
