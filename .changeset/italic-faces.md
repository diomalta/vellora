---
"vellora": patch
"@vellora/native": patch
"@vellora/wasm": patch
"@vellora/lint": patch
"@vellora/cli": patch
"@vellora/engine-chromium": patch
---

Print `font-style: italic`, `oblique`, `<em>` and `<i>` with a real slanted face (#74). The
italic and bold italic faces of Liberation Sans, Serif and Mono are now bundled, so `<b><i>`
stays bold too. An oblique style picks the face Chrome picks (measured on Playwright Chromium
153): `oblique` and angles of 14deg or more use the italic face, smaller angles stay upright.
PDFs with italic or oblique text change; other documents are byte-identical. The WebAssembly
build grows from 5.3 MiB to 6.4 MiB gzip (the six font files), still within the Workers Paid
limit.
