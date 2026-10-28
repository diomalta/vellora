---
"vellora": patch
"@vellora/native": patch
"@vellora/lint": patch
"@vellora/cli": patch
"@vellora/engine-chromium": patch
---

Paint images (`<img>` and inline `<svg>`) in their CSS painting-order layer. The PDF emitter drew
every image of a page after every background and border, so a later positioned box
(`position: relative | absolute | fixed`, `z-index` not negative) never covered an image. Now
an in-flow or floated box's image is drawn over the in-flow and float backgrounds and under the
positioned boxes, and a positioned box's image over the positioned boxes before it in tree order
and under the later ones (CSS 2.2 Appendix E). Pages without a positioned background render
byte-identical PDFs. Text still paints after every background, as before.

Measured on the repo's fidelity harness (local macOS, Chrome for Testing 155.0.8059.85 reference;
indicative, not CI), against the merge of the inline-SVG, table, column-break and ruby changes:
10 more WPT reftest passes in the default suites and none lost (css/CSS2/normal-flow
inline-replaced-* / inline-block-replaced-*, css/CSS2/positioning
absolute-replaced-width-003a/b/c).
