---
"vellora": patch
"@vellora/native": patch
"@vellora/lint": patch
"@vellora/cli": patch
"@vellora/engine-chromium": patch
---

Place and size the page content like Chrome's print. Chrome lays a document out at the page width
minus the margins rounded up to a whole CSS px (from the authored page size: 210 mm for `size: A4`)
and puts it at the margins rounded to a whole px; the native engine used the exact margins and a
width one px narrower (A4 at 16 mm margins: 672 instead of 673 px, offset 0.47 px right of and
below Chrome). In right-to-left documents the content is anchored at the right margin like Chrome.

Auto-layout tables that are wider than their content now share the spare width between their
columns in proportion to each column's content width, as browsers do; Blitz 0.3.0-beta.4 gave every
column an equal share (repro: an invoice item table of 673 px, Chrome 346 / 69 / 135 / 123 px per
column, Blitz 306 / 92 / 142 / 133). This replaces an approximation that narrowed right-aligned
columns. The input HTML is not changed.

PDFs of every document change (the page origin and layout width apply to all pages). Measured on
the repo's fidelity harness (local macOS, Chrome for Testing 155.0.8059.85 reference; indicative,
not CI): PDF words more than 1 pt from Chrome's position and worse than the published v0.2.0 went
from 254 to 16 over the nine fixtures (the 16 are on text-stress-ptbr and danfe, sub-pixel row
heights); the oss-sparksuite invoice's right-aligned column, 2.3 px left of Chrome's, now matches
it.
