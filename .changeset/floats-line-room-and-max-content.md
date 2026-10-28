---
"vellora": patch
"@vellora/native": patch
---

Two float fixes that match Chrome:

- **Shrink-to-fit width.** The max-content width of content that holds floats on several lines
  is now that of its widest line. Before, the native engine added up the floats of every line,
  so a float, an inline-block, an absolutely positioned box or a flex item holding them came
  out too wide.
- **First line beside a float.** A paragraph whose first line has no room for its first word
  beside a float now starts below that float. Before, the line overflowed past the float. Only
  the first line of a block is moved, and only when its text can wrap.

The input HTML is not changed.

Measured on the repo's fidelity harness (local macOS, Chrome for Testing 155.0.8059.85
reference; indicative, not CI): 3 more WPT reftests pass, none lost:
`css/css-break/flexbox/flex-fragmented-with-float-descendant-001`,
`css/css-break/break-at-end-container-edge-003` and
`css/css-text/white-space/pre-wrap-float-001`. The PDFs of the 9 fixture documents are
byte-identical.
