---
"vellora": patch
"@vellora/native": patch
"@vellora/lint": patch
"@vellora/cli": patch
"@vellora/engine-chromium": patch
---

Match Chrome's sub-pixel arithmetic. Chrome lays boxes out in 1/64 px steps and prints every
text baseline on a whole px of the page; the native engine used exact lengths and baselines on
whole px of the content box. It now truncates `padding`, `margin`, `height`/`min-height`/
`max-height`, insets and gaps given in mm, pt, em or other non-px units to 1/64 px, computes a
unitless `line-height` as Chrome does, uses whole px for `border-spacing`, and prints body and
`@page` margin-box text on whole page px. The input HTML is not changed. Widths are not
quantised (text that exactly fits a `width: <n>ch` box keeps fitting).

A table row may now end at most 0.5 px (was 12 px) past the page's content box and stay on the
page: the 12 px absorbed a row drift that no longer exists, and kept a `break-inside: avoid` row
group on a page where Chrome breaks before it.

PDFs of documents with such lengths or a fractional page margin change. Measured on the repo's
fidelity harness (local macOS, Chrome for Testing 155.0.8059.85 reference; indicative, not CI):
a text-stress-ptbr statement row is 23.8125 px like Chrome (was 23.852); the median vertical
offset of PDF words from Chrome's is 0 pt on 8 of 9 fixtures (was 0.35 pt, 1.1 pt on boleto and
text-stress-ptbr), and the per-document median distance of text-stress-ptbr drops from 0.40 to
0.08 mm.
