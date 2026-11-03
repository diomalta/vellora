---
"vellora": patch
"@vellora/native": patch
"@vellora/wasm": patch
"@vellora/lint": patch
"@vellora/cli": patch
"@vellora/engine-chromium": patch
---

Paint list markers with the default `list-style-position: outside` (#73). `<ul>` items rendered
without a bullet and `<ol>` items without a number, because Blitz lays an outside marker out
separately and the renderer never read it. The marker now sits where Chrome puts it (measured on
Playwright Chromium 153, indicative): its end touches the item's border box, one space after
`1.`, on the baseline of the item's first line (also inside a `<p>` child), past the right edge
under `direction: rtl`. PDFs with outside lists gain these markers; other documents are
byte-identical.
