---
"vellora": patch
"@vellora/native": patch
"@vellora/wasm": patch
"@vellora/lint": patch
---

The strict gate now rejects `<link rel="stylesheet">` and `@import` as `css:external-stylesheet`, with the line and column and the hint "inline the CSS in a `<style>` tag", instead of rendering the PDF without that CSS. vellora never loads external style sheets. Other `<link>` elements (icons, preloads) are still accepted. `@vellora/lint` reports the same construct as the `external-stylesheet` rule.
