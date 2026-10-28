---
"vellora": patch
"@vellora/native": patch
"@vellora/lint": patch
"@vellora/cli": patch
"@vellora/engine-chromium": patch
---

Lay out ruby annotations (`<ruby>`, `<rt>`). They were accepted by the strict gate and printed
inline after their base text; the native engine (Blitz) has no ruby layout, so vellora now lays
each annotation out above its base, following Chrome's print output: each `<rt>` annotates the
content since the previous one, the annotation is centred over its base (or the base under a
wider annotation), its baseline sits on the base's em box, the annotations of a line share one
baseline, and the line grows only by what does not fit in its leading. A ruby is kept on one
line, and a line is never broken across columns of a multi-column container (a line taller than
its column stays whole in it, as in Chrome). Not implemented yet: ruby overhang and `ruby-align`
justification, `ruby-position: under`, `<rtc>`, nested ruby, and breaks inside a ruby (see
COMPATIBILITY.md). The input HTML is not changed, and documents without ruby or multi-column
containers are byte-identical.

Measured on the repo's fidelity harness (local macOS, Chrome for Testing 155.0.8059.85
reference; indicative, not CI): WPT reftest passes in the default suites 4414 -> 4420 (8047
tests, none lost), among them css/css-break/ruby-000, -001 and -003; css/css-ruby (not a default
suite) 31 -> 29 of 143: 5 gained, 7 lost, of which one Chrome passes with covered glyphs
(ruby-bidi-004, whose old pass rendered both sides without their `dir=rtl`). Details in
`fidelity/gate/snapshots/2026-10-28/c06-ruby/README.md` (evidence archive: git tag `fidelity-archive-2026-10-28`, commit `b5c9546`).
