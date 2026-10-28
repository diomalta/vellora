# Phase C 06: inline SVG (2026-10-28)

Branch `phasec/06-svg`, from `phasec/05-verify` 1ae3508. Target: `wpt|css/css-break/svg-with-transform.html`,
a pass at pin / 10-integration / 00-start that the multi-column layout (a17ee21) turned into a
failure. No gated run was made in this step (the full gated run belongs to the merge step).
Every number below is from local macOS 27.0.1 arm64, Node v22.23.2, rustc 1.96.0, Blitz
crates.io 0.3.0-beta.4, Chrome for Testing 155.0.8059.85, 2026-10-28, and is INDICATIVE.

Run store: `~/Repositories/vellora-fidelity-runs/c06-svg/` (inputs, renders, scripts, WPT and
fixture runs). The small files in this directory are copied from there.

## How inline SVG was treated before this step (CONFIRMED by source read)

- Strict gate: `<svg>` is not in `validation.rs` `DENIED_ELEMENTS`, so strict accepted it.
- Core: no code drew it. Blitz's `svg` cargo feature was off, so an `<svg>` was a 0x0 inline
  box and its children unknown inline elements. `COMPATIBILITY.md` said "Not handled at render
  time" (status Dev-time-fixable).
- `@vellora/lint` rule `inline-svg` (severity `error`, autoFixable) rasterizes it with resvg;
  `RULE_ID_TO_CORE_FEATURE` maps it to `element:svg`, a feature the core gate never emitted.
- The WPT harness renders with `renderPdf(..., { strict: true })`, so the codemod never ran there.

So strict silently dropped inline SVG content.

## Why the test passed at pin and failed at c05 (CONFIRMED by rendering)

`px-pin-c05-c06.txt`: colored boxes at 96 dpi of the WPT test and of `svg-nocol.html` (an SVG
with a green 50x100 rect over a red 100x100 box), rendered with the pin build (v0.2.0 source,
`c05-probe/pin-src`), the c05 tip, this step, and Chrome:

- pin: `svg-nocol` is all red (the SVG is not drawn). `svg-with-transform` passes because the
  one-column layout puts the full-width green div over the whole red box. The pass was a
  coincidence, not SVG rendering.
- c05 tip: column 2 exists, the SVG in it is not drawn: red 50x100 (WPT 5000 px).
- this step: both match Chrome's boxes exactly (green 8..108 x 50..150; green 8..58 over red
  58..108).

Raw Blitz passes the test (its painter draws SVG). Chrome passes it. Not class a.

## Design choice

Inline SVG enters the native subset explicitly. Strict still passes the HTML byte-unchanged and
never imports `@vellora/lint`; the core lays out and draws the SVG from the parsed DOM. Rejecting
`<svg>` (`element:svg`) would be rejection by declaration, and drawing it as a raster at render
time is not what Chrome does (Chrome prints SVG as vector content with selectable text).

- `blitz-dom` `svg` feature on: Blitz lays an `<svg>` out as a replaced box.
- `blitz_engine::size_svgs_like_chrome` (Blitz bug compensation, comment + raw canary
  `blitz_still_sizes_an_svg_without_viewbox_to_its_content`): Blitz sizes a `viewBox`-less SVG
  to usvg's content bounding box and gives it that aspect ratio (raw: 25x50, 40x100, 60x120);
  Chrome uses the default object size (300x150, 40x150, 60x150). `chrome-rects-*.txt` hold the
  Chrome numbers; `inline_svg_*` tests in `raw_blitz_tests.rs` assert them.
- `blitz_engine::find_external_svg_image` (security gate, comment + raw canaries
  `blitz_still_reads_svg_image_sources_from_the_host`,
  `blitz_parses_inline_svg_only_when_it_builds_the_boxes`): Blitz parses each SVG with usvg's
  default options, which read a non-`data:` `<image>`/`<feImage>` `href` from the host
  filesystem (the canary writes a PNG to a temp file and finds it in Blitz's tree). Such a source
  now rejects as `image:unresolved`, on the parsed DOM, before Blitz builds any box (Blitz parses
  SVGs only in `resolve`, CONFIRMED by the second canary and by source: `resolve.rs:99` is the
  only caller of `collect_layout_children`).
- `svg.rs`, `pdf.rs`: vellora serializes the SVG from the DOM (root sized to the content box,
  `currentColor` and the inherited `font-family`/`font-size` resolved), parses it with usvg 0.47
  and its own options (bundled then caller fonts only; `data:`-only image resolver) and draws it
  with krilla-svg 0.8.1, clipped to the box.
- `@vellora/lint` `inline-svg` is a `warning` now; the codemod stays (best-effort still runs it).

## Results

- WPT css/css-break + css/css-multicol (1121 tests, `--chrome-from` the 10-tip run): 371 -> 372,
  the only change `svg-with-transform` fail -> pass (maxDifference 0, ink check clean).
  `wpt-break-multicol-vs-c05.txt`. Only that one reftest in the 8047 has an inline SVG in its
  test or reference (`c06-svg/svg-tests.txt`).
- WPT crashtests: 239/239 ok (none renders an SVG: the one with an `<svg>` is rejected for
  `<input>` first).
- 9 fixtures (corpus + layout-diff + doc-aggregate, `run-all --only corpus,layout-diff,pdf-probe,doc-aggregate,paint-probe`
  at c7d87dc): every vellora PDF (15) byte-identical to the c05 run's, doc-aggregate scores equal
  for 9/9 (only the Chrome PDF hashes differ; Chrome geometry hashes are equal).
- DET-1: 6 SVG inputs rendered in two separate processes: 6/6 byte-identical.
- First SVG of a process: about 21 ms more (Blitz's one-time host font scan), later renders
  0.8 ms (`first-svg-cost-20261028.txt`).
- Native addon (macOS arm64 release): 20,533,264 -> 28,684,320 bytes (+39.7 %): the graph holds
  usvg 0.48 (Blitz, layout) and usvg 0.47 + resvg + tiny-skia (krilla-svg, drawing).

## Not covered (documented in the code and COMPATIBILITY.md)

Page CSS rules targeting SVG elements, `<foreignObject>`, `overflow: visible` on `<svg>`, a CSS
`transform` (rejected as `css:transform`), a percentage height against an indefinite containing
block other than an `auto`-height parent, flex/grid stretch of a `viewBox`-less SVG. SVG runs are
painted in the image layer (after the page's rects, before text), like `<img>`. Observation,
UNVERIFIED: in a feature sheet (`c06-svg/inputs/svg-features.html`) Chrome's PDF, rasterized by
pdftocairo, shows no hole for an SVG `mask`, vellora's does.
