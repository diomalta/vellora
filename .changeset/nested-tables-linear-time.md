---
"vellora": patch
"@vellora/native": patch
"@vellora/lint": patch
"@vellora/cli": patch
"@vellora/engine-chromium": patch
"@vellora/wasm": patch
---

Nested tables render in linear time. A walk of the layout tree reached each table subtree
twice per nesting level, so render time doubled with every level: 24 nested tables took 4.3 s
and 47 (the most the depth gate accepts) never finished, in the native and WebAssembly engines
alike, whether the document used `text-wrap: balance` or not. 47 nested tables now render in
under 10 ms. Output is unchanged (the fixture goldens stay byte-identical).
