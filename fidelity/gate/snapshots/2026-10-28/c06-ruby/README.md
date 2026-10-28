# Phase C 06: ruby layout (2026-10-28)

Branch `phasec/06-ruby`, from `phasec/05-verify` 1ae3508. No gated run was made in this step
(the full gated run belongs to the merge step). Every number below is from local macOS (darwin
arm64), Node v22.23.2, rustc 1.96.0, Chrome for Testing 155.0.8059.85, WPT 9d8aceec,
2026-10-28, and is INDICATIVE.

Run store: `~/Repositories/vellora-fidelity-runs/c06-ruby/` (WPT before/after runs, probes,
the Chromium sources read, scripts).

## Target

`wpt|css/css-break/ruby-003.html`, a pin (c) item since c04: a `columns: 1; column-fill: auto;
height: 60px` box holding a ruby whose base and annotation are both 100x50 inline-blocks. Chrome
draws the annotation block right on top of the base one (a 100x100 green square). Two defects
made vellora fail it:

1. no ruby layout: the `<rt>` laid out inline after its base, so the two blocks were two lines
   with the 4 px strut descent between them (CONFIRMED by the c05 probe);
2. a line taller than its column was cut by the column slicer: a single 104 px inline-block in a
   60 px `column-fill: auto` column was printed 60 px in column 1 and 44 px in column 2, where
   Chrome keeps the line whole in column 1, overflowing (CONFIRMED, probe `q1.html` in the run
   store; Chrome: `probes/p1.html`, `mc` content at y 50-150 over a 60 px box).

## Cause in Blitz (CONFIRMED by source read)

Blitz 0.3.0-beta.4 has no ruby layout. Stylo 0.22.0 parses `display: ruby`, `ruby-base`,
`ruby-text` only with the `gecko` feature (`stylo-0.22.0/values/specified/box.rs:513-541`), so
Blitz's own UA rules (`blitz-dom-0.3.0-beta.4/assets/default.css:1006-1021`) are dropped and
`<ruby>` / `<rt>` are plain inlines. `ruby-position`, `ruby-align` and `ruby-overhang` are
`engine = "gecko"` longhands (`stylo-0.22.0/properties/longhands.toml:2572, 3968`): they do not
reach the computed style. The raw-Blitz canary `raw_blitz_tests.rs`
`blitz_still_lays_ruby_text_out_inline` fails when Blitz starts laying ruby out.

Parley 0.12.0 breaks a line between two inline boxes whatever the `white-space` of the text
around them (`parley-0.12.0/src/layout/line_break.rs:1097-1104`: the wrap mode is the line
state's, set by the last text run), and keeps the inline boxes of a `dir=rtl` inline-block in
logical order (measured, ruby-bidi-004's first ruby). Blitz ignores `dir` on inline elements
(probe `bidi.html`: `<span dir=rtl>` digits stay left to right, before and after this change).

## Chrome's model (CONFIRMED by source read and measurement)

Chromium `third_party/blink/renderer/core/layout/inline/ruby_utils.cc` and
`platform/fonts/simple_font_data.cc` (main, read 2026-10-28; copies in the run store):

- `ComputeEmHeight`: a text item's em box is the font's OS/2 `sTypoAscender`:`sTypoDescender`
  ratio scaled to the font size (`TrySetNormalizedTypoAscentAndDescent`, ascent rounded to
  1/64 px), each side ceiled and capped by the font's ascent/descent; an atomic inline's is its
  box above/below its baseline.
- `RubyBlockPositionCalculator::ComputeRelativeOffsets`: the annotation line's baseline sits at
  `-(base em ascent) - (annotation em descent)` from the base baseline; one annotation line per
  level per line box (the columns of a line share it).
- `ComputeAnnotationOverflow`: the line box grows by what of the annotation's em box lies above
  the line's own top.

Measured with `probes/chrome-rects.mjs` (getBoundingClientRect, print media; output
`probes/chrome-rects.txt`), Liberation Serif:

| Probe | Chrome 155 | vellora (this branch) |
|---|---|---|
| p1 `nomc` (ruby-003's ruby, no columns) | annotation block 128-178, base 178-228, box 104 tall | same (tests/ruby.rs) |
| p1 `mc` (ruby-003) | annotation 50-100, base 100-150, both column 1 | same |
| p2 d1 (20 px base, 10 px rt), first line | base baseline 26, rt baseline 8, line 31 px | same |
| p2 d7 `line-height: 3` | line 60 px (annotation fits in the leading), rt 18 px above | same |
| p2 d4 `<rb>A</rb><rb>BBBB</rb><rt>x</rt><rt>yy</rt>` | "x" over both rbs (25-92.81), "yy" a base-less column 92.81-102.81 | same within 0.6 px |
| p2 d11 two-column ruby at a line end | the whole ruby on the next line | same |
| p3 a2..a8 (a ruby line after another ruby line) | line 30 px, the annotation 1 px into the previous line's leading | 31 px (not modelled) |
| p2 d2 (annotation wider than its base) | 5 px overhang into the spaces on each side; " yy" at 57.2 | centred, no overhang; " yy" at 68 (not modelled) |

Chrome's pairing (d4): each `<rt>` takes as base everything since the previous `<rt>`; `<rb>`
pairs nothing. `<rp>` is `display: none` (Blitz's UA sheet already).

## What changed

- `crates/vellora-core/src/ruby.rs` (no Blitz types): font table read (`head`, `hhea`, `OS/2`,
  `ttcf`), Blink's em box, and the placement of each column (`place`).
- `blitz_engine.rs` (the only Blitz contact), all off in the raw-Blitz render:
  - `wrap_ruby_bases`: before the cascade, the base of each column (the children since the
    previous `<rt>`, white space included) is moved into a `vellora-ruby-base` element. The input
    HTML is not changed (strict still passes it byte-unchanged); the Blitz tree gets the wrapper,
    as Chrome's box tree gets an anonymous ruby-base box. Author selectors that match a base
    element through `ruby > x` or a structural pseudo-class no longer match it (UNVERIFIED in
    real documents; none of the fixtures or corpus inputs uses ruby).
  - `RUBY_UA_CSS`: `ruby { white-space: nowrap }`, `ruby > vellora-ruby-base, ruby > rt
    { display: inline-block; text-indent: 0 }`.
  - `ruby_containers_atomic`: an inline `<ruby>` with columns becomes an inline-block (computed
    style, between cascade and layout), so Parley never breaks it.
  - `lay_out_ruby`: after the first layout, measures each base and `<rt>` (widths, last
    baselines, em boxes from the runs' fonts and the atomic inlines), writes margins and a
    `vertical-align` length into their computed styles, and the document is laid out again
    (non-incremental, as for the float fix-ups).
  - `LaidOutBox::line_span`: the line box of an atomic inline, relative to its own top.
- `pagination::column_items`: an atomic inline's line box is a monolithic item of the column
  breaks, whatever its height (pages unchanged: `slice_items` is not touched).

The strict subset and the diagnostic taxonomy are unchanged: ruby was accepted before and is
accepted now; nothing was added to the core gate, the lint rules or `RULE_ID_TO_CORE_FEATURE`.
The features below are documented as not implemented (COMPATIBILITY.md row "Ruby annotations",
Partial) rather than rejected, as for multicol in c05.

## Not implemented (each with the evidence that it differs)

- Ruby overhang and `ruby-align: space-around` justification (p2 d2: Chrome overhangs 5 px on
  each side; css/css-ruby/ruby-overhang-* and ruby-align-* fail).
- `ruby-position: under` / `alternate` (gecko-only longhand in Stylo; css/css-break/ruby-002
  still fails, 6250 px).
- `<rtc>`, nested ruby (nested-ruby-pairing-001), margins on `<rt>` (ruby-annotation-with-margin),
  `display: block` ruby (block-ruby-*), vertical writing modes.
- Breaking inside a ruby (css/css-ruby/break-within-bases/*: Chrome breaks within bases).
- The previous line's spare leading taken by an annotation (p3: 1 px per such line).
- Inline `dir` inside a base (Blitz ignores `dir` on inline elements, see above).

## WPT

Before: `node fidelity/wpt/run.mjs css/css-ruby css/css-break css/css-multicol --chrome <CfT 155>
--expectations none` on 1ae3508 (run store `wpt-before`, Chrome live). After: the same suites
with `--chrome-from wpt-before/results.json` (`wpt-final`); diff in
`wpt-ruby-break-multicol-vs-before.txt`.

| Suite | Before | After |
|---|---|---|
| css/css-ruby (143, not a default suite) | 31 | 29 |
| css/css-break (1121) | 371 | 376 |
| css/css-multicol (467) | 122 | 122 |

- css/css-break gained ruby-000, ruby-001, ruby-003, tall-line-in-short-fragmentainer-000/001
  (Chrome passes all five); none lost.
- css/css-ruby gained 5 (rt-text-indent-001, ruby-tab-in-base-001/003 Chrome passes;
  empty-ruby-base-container, ruby-base-container-abs Chrome fails) and lost 7:
  - 4 Chrome fails too: improperly-contained-annotation-001, ruby-float-handling-001,
    ruby-intra-level-whitespace-001, nested-ruby-pairing-001 (also uncoveredCodepoints-flagged);
  - 2 flagged (uncovered CJK codepoints) that need overhang: ruby-overhang-spaces-010,
    ruby-overhang-spaces-align-003;
  - 1 clean Chrome pass: ruby-bidi-004. Its old pass rendered the test and the reference the same
    wrong way: the reference's `<ruby dir=rtl>` was an inline whose `dir` Blitz ignores, so its
    Persian digits ran left to right (HYPOTHESIS from the `bidi.html` probe, the old render was
    not re-rasterized). Now the reference's ruby is an inline-block and its digits run right to
    left as in Chrome, while the test's `<span dir=rtl>` / `<rb dir=rtl>` bases still do not.

Full default suites (`--raw --chrome-from <10-tip>/wpt/results.json --expectations none`,
`wpt-default-final`) against the c05 gated run copy (20261028T062527Z), diff in
`wpt-default-vs-c05.txt`: passes 4414 -> 4420 of 8047, 6 gained, 0 lost (CONFIRMED by the diff
over all 8047 tests). The gains are the five css/css-break tests above and
css/css-text/letter-spacing/letter-spacing-212 (which uses ruby; its pass has a 20 px ink bbox
shift against Chrome, so it may count as flagged).

## Pages

`slice_items` (page breaks) is unchanged. A ruby with columns is one inline-block, so the page
slicer already treats it as one monolithic item: probes `pb574..pb594.html` in the run store (a
`line-height: 1` ruby line, 20 px, moved across the 600 px page bottom in 4 px steps) print the
annotation and its base on the same page every time (page 2, baselines 8 and 26) (CONFIRMED).
A `display: block` ruby (not modelled) has no such guarantee.

## Cost

`LaidOutBox::line_span` is read for every atomic inline of every document, so its lookup reads
each inline root's lines once (`atomic_line_span`'s memo); a first version that searched the
lines per box took a 2000-inline-block paragraph from 27.5 to 87.7 ms. renderPdf median of 5
(`c06-ruby/scripts/perf.mjs`), this branch vs the c05 tip build (worktree on `phasec/05-tip`
1ae3508):

| Document | c05 tip | this branch |
|---|---|---|
| 1 paragraph, 2000 inline-blocks | 18.4-18.5 ms | 18.6-20.0 ms |
| 200 paragraphs, 10 inline-blocks each | 17.2-18.8 ms | 17.2 ms |
| 1 paragraph, 500 ruby | 4.1-4.2 ms (no ruby layout) | 13.7-13.8 ms |
| 300 paragraphs, no inline-block | 3.7 ms | 3.4 ms |

A document with ruby is laid out twice (the second layout after the ruby edits).

## Fixtures and determinism

- The 9 layout-diff fixtures of the c05 run copy, re-rendered twice in separate processes with
  `layout_dump` (`c03-verify-det/det.mjs`): 9/9 byte-identical to each other and to the c05
  run's `vellora.pdf` (CONFIRMED). No fixture, corpus or probe input contains `<ruby>`.
- `tests/ruby.rs` `ruby_renders_byte_identically`: two renders of a mixed ruby document are
  byte-identical. The font-metrics map of `lay_out_ruby` and the line-span memo are lookup-only
  (DET-1).
- Six WPT inputs (css-break ruby-000, ruby-003; css-ruby ruby-bidi-004, ruby-align-001,
  rt-text-indent-001, ruby-tab-in-base-001), each rendered twice in separate `layout_dump`
  processes (`c06-ruby/scripts/det2.mjs`): 6/6 byte-identical (CONFIRMED).
