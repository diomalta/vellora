---
"vellora": patch
"@vellora/native": patch
"@vellora/lint": patch
"@vellora/cli": patch
"@vellora/engine-chromium": patch
---

Render inline `<svg>` natively. The strict gate accepted inline SVG but drew nothing for it; the
native engine now lays it out as a replaced box (an `auto` width of 300 px and height of 150 px
when it has no `viewBox`, as in Chrome) and draws it into its content box as PDF vector content
through krilla-svg: shapes, paths, gradients, clipping, masks, transforms, and `<text>` as
selectable text with the bundled fonts and the `fonts` option's faces (never a host font).
`currentColor` and the inherited `font-family` / `font-size` come from the HTML. The input HTML is
not changed.

An `<image>` / `<feImage>` inside an inline SVG whose `href` is not a `data:` URL now rejects the
render with `image:unresolved`: the engine's SVG parser would otherwise read that path from the
host filesystem. `@vellora/lint`'s `inline-svg` rule is now a `warning` (the rasterizing codemod
stays available and best-effort mode still runs it; a report with only this finding is still not
`conformant`, so `vellora lint` still exits with the diagnostics code for it). The first inline
SVG of a process costs about 20 ms more (local macOS, indicative): the engine's SVG parser loads
the host's font list once, which is never used to draw.

Measured on the repo's fidelity harness (local macOS, Chrome for Testing 155.0.8059.85 reference;
indicative, not CI): css/css-break + css/css-multicol 371 -> 372 passes (1121 tests, only
`css/css-break/svg-with-transform.html` changed). In the default suites (8047 tests) the XHTML
tests whose `<svg:svg>` replaced elements were not drawn before gain passes too: with the image
paint-order fix of the same release, 43 css/CSS2 reftests (normal-flow, positioning, floats-clear
`*-replaced-*`) pass that failed, and none is lost. The WPT crashtests stay 239/239 ok (none of them
renders an SVG); the 9 measured fixtures (no SVG) render byte-identical PDFs. The macOS
arm64 native addon grows from 20.5 MB to 28.7 MB (the graph now holds two usvg versions: Blitz's
for layout, krilla-svg's for drawing).
