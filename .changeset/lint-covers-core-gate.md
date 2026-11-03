---
"@vellora/lint": patch
"@vellora/cli": patch
"vellora": patch
---

`vellora lint` now reports every element and CSS feature the strict render rejects, so it no longer calls a template conformant that `renderPdf` refuses (#60). New rules: `unsupported-css` (`transform`, `transition`, `filter`, `backdrop-filter`, `perspective`, `display: grid` outside a `<td>`) and `unsupported-element` (`<canvas>`, `<iframe>`, form controls, `<noscript>`, …). `css-animation` now also checks `style` attributes. Each finding that the strict render rejects carries the render's `feature` id (`Finding.feature`, e.g. `css:transform`), which `vellora lint` prints and `strict: false` uses for its `VelloraUnsupportedError`. `@keyframes` is now reported as `css:keyframes`, like the strict render. `animation-name` alone is no longer flagged, because the strict render accepts it.
