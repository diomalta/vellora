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
stays available and best-effort mode still runs it).

Measured on the repo's fidelity harness (local macOS, Chrome for Testing 155.0.8059.85 reference;
indicative, not CI): css/css-break + css/css-multicol 371 -> 372 passes (1121 tests, only
`css/css-break/svg-with-transform.html` changed); the WPT crashtests stay 239/239 ok. The macOS
arm64 native addon grows from 20.5 MB to 28.7 MB (the graph now holds two usvg versions: Blitz's
for layout, krilla-svg's for drawing).
