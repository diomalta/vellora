---
"vellora": patch
"@vellora/native": patch
---

Place a float that does not fit beside the text before it on its line below that line, as
Chrome does. Before, the native engine put such a float at the top of the line: a left float
pushed the text before it out of the box, and a right float covered it. This is fixed when
nothing but white space or other floats follows the float in its paragraph. It is also fixed
when the text after the float on that line cannot wrap: an unbreakable word, or a
`white-space: nowrap` span. A float with wrapping text after it on its line keeps the previous
placement. The input HTML is not changed.

Measured on the repo's fidelity harness (local macOS, Chrome for Testing 155.0.8059.85
reference; indicative, not CI): 2 more WPT reftests pass
(`css/CSS2/floats/floats-placement-vertical-003` and `-004`), none lost, and the PDFs of the 9
fixture documents are byte-identical. Two tests whose references now lay out like Chrome
(`float-nowrap-3`, `white-space-processing-048`) still pass, now with Chrome's geometry on both
sides.
