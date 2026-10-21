# fidelity/wpt — WPT reftests over vellora's native pipeline

Third-party conformance oracle for the native renderer: [web-platform-tests](https://github.com/web-platform-tests/wpt)
reftests rendered **test and reference both** through vellora's real public pipeline
(`renderPdf(html, undefined, { strict: true, fonts, images, baseUrl })` with the built napi addon),
rasterized with poppler and compared with WPT's own pixel rules. An optional Chrome print oracle runs
the same tests through Chrome with the same geometry, rasterizer and comparator, so "Chrome fails
too" is distinguishable from vellora-only failures. Phase A scope: measurement only; nothing here
changes vellora's output (the runner calls the public API; since port step 08 the nodes WPT serves
as XML go through the same `renderPdf` call with its internal `_bridge` option set to a
fidelity-only XML parse, pipeline step 3).

Re-measuring a checkout from before port step 08 (`--vellora <its dist/index.js>`): it has no
`xhtml_render` example, so `run.mjs` stops. Pass `--xhtml-render <bin>` (a step-08+ binary, which
renders those nodes with that binary's code, not the old checkout's) or `--xhtml-parser html` (the
product path of that checkout, which before step 08 sniffed XHTML input itself).

Labels follow the repo rules: **CONFIRMED** (checked in this work, with the command/source),
**UNVERIFIED ASSUMPTION**, **HYPOTHESIS**, **DESIGN TARGET**.

## Run it

```sh
export PATH="$HOME/.nvm/versions/node/v22.23.2/bin:$PATH"   # Node 22 (.nvmrc); record `node -v`
npm ci && npm run build                     # the real addon is required (packages/native/*.node)
node fidelity/wpt/fetch-wpt.mjs             # sparse+partial checkout of WPT at WPT_COMMIT → fidelity/.cache/wpt
node fidelity/wpt/run.mjs                   # default suites → fidelity/results/wpt/<run-id>/
node --test 'fidelity/wpt/test/*.test.mjs'  # self-tests (unit + real-pipeline oracle checks)

# optional Chrome print oracle (puppeteer-core; never downloads a browser)
(cd fidelity/wpt && PUPPETEER_SKIP_DOWNLOAD=1 npm ci)
node fidelity/wpt/run.mjs --chrome "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
node fidelity/wpt/install-chrome.mjs --check   # CI: verify the pinned Chrome for Testing build exists
```

Useful options (`run.mjs` header has the full list): `css/CSS2/tables` (any WPT path instead of the
defaults), `--filter <regex>`, `--limit <n>`, `--jobs <n>`, `--vellora <other build>/packages/vellora/dist/index.js`
(e.g. a Blitz-bump build), `--expectations auto|none|<file>`, `--update-expectations`,
`--upstream auto|none|<blitz-sha>`, `--rasterizer pdftocairo|pdftoppm`, `--no-aa`, `--no-inline-css`,
`--artifacts fail|all|none`, `--keep-pdf`, `--label <provenance note>` (required for a build with no
git commit), `--allow-unpinned` (measure a WPT tree that is not exactly the pin; no ratchet),
`--chain-references` (follow a reference's own links — not wptrunner semantics, diagnosis only).

Requirements: Node >= 22.12, git, poppler (`pdftocairo`, `pdfinfo`; `pdftoppm` only for
`--rasterizer pdftoppm`; override paths with `PDFTOCAIRO`/`PDFINFO`/`PDFTOPPM`). Chrome only for
`--chrome`. Nothing is installed globally. The self-tests are `node --test` only; the root
`vitest run` cannot pick them up (its include globs are `packages/*/test/**/*.test.ts` and
`packages/*/src/**/*.test.ts` — CONFIRMED in `vitest.config.ts`).

## Outputs

`fidelity/results/wpt/<UTC-time>-<engine>-vellora-<sha7>/` (gitignored; the runner never deletes an
existing directory):

| file | content |
|---|---|
| `results.json` | full env (date from `date -u`, OS/CPU, node, rustc, cargo, pdftocairo/pdftoppm/pdfinfo, Chrome, WPT commit, vellora commit + dirty count, Blitz/Stylo/Taffy/Parley/krilla from `Cargo.lock`, addon sha256, argv), config, timing, and one record per reftest |
| `summary.json` | **stable** summary (no timings/dates): per-suite and total counts, pass rates, unsupported features, error kinds, skip reasons, vellora×Chrome and vellora×upstream matrices, preparation-flag breakdown |
| `summary.md` | the same as tables |
| `run-info.json` | env + config + timing without per-test records |
| `upstream.json` | cross-tab against Blitz's own published report, with per-bucket test lists and caveats |
| `ratchet.json` | comparison against the expectations file, or `status: "not-run"` with the reason (other WPT commit, unpinned tree, other comparison settings, schema 1) |
| `artifacts/<test>/` | for failures: `lhs-pN.png`, `rhs-pN.png`, `diff-pN.png` (differing pixels red), `comparison.json`; with `--artifacts all` also for every other compared test (page 1 of the test and its first reference, so a pass can be audited by eye); PDFs with `--keep-pdf` |
| `chrome-artifacts/<test>/` | the same for the Chrome oracle |

Per-test record: `test`, `suite`, `mode` (`screen`/`print`), `outcome`, `node` (`test`/`ref`, which node
was not evaluable), `cause` (`feature`/`line`/`col` for unsupported, `kind`/`message` for errors,
`reason` for skips), `comparisons` (`lhs`, `rhs`, `relation`, `pass`, `maxDifference`,
`totalPixels`, `fuzzy`, `firstDiffPage`, `pageCounts`, `pageCountMismatch`, `sizeMismatch`),
`blank`, `pageCount` (print), `prepare` (what the harness supplied/changed and the suspect-pass
flags, below), `ink` (ink signature of the test's first compared page), `inkCheck` (vellora vs
Chrome ink, passes only), `renderMs`, `rasterMs`, `durationMs`, `chrome` (Chrome oracle
outcome/comparisons/ink), `upstream` (Blitz's own status).

### Outcomes

| outcome | meaning |
|---|---|
| `pass` | WPT pass rule satisfied by a rendering that is not pure white (or that matched an empty-by-construction reference: `about:blank`, `/common/blank.html`, `css/reference/blank.html`, `blank-print-ref.html`) |
| `pass-blank` | WPT pass rule satisfied, but every compared page of the TEST rendering is pure white and the reference is not empty by construction: test and reference lost the same content. **Not a pass**: excluded from `pass` and from every pass rate. Decided from vellora's own rendering only, so it does not depend on whether an oracle ran |
| `fail` | rendered fine, comparison failed |
| `unsupported` | the strict gate rejected the test or a reference (`VelloraUnsupportedError`; `cause.feature` is the core's feature id, `node` says which) |
| `error` | `cause.kind`: `panic` (Rust panic surfaced as a rejection), `render`, `input`, `template` (`renderPdf` always runs the templating engine; `{{`/`{%` in a test would throw — an input-contract artifact, not layout; 0 occurrences on the current pin), `conformance`, `crash` (worker process died: abort/stack overflow), `raster`, `metadata`, `harness`, `chrome` |
| `timeout` | the worker exceeded the per-test budget (default 30 s, ×6 for `<meta name=timeout content=long>`) and was SIGKILLed |
| `skip` | the harness cannot run it: `non-utf8`, `needs-wptserve-substitution` (`.sub.` files), `missing-file` (reference outside the sparse checkout / not in the tree), `reference-outside-wpt-tree` |

Files that are not reftests are never run but always counted (`summary.totals.notRun`):
`testharness` (testharness.js), `css-manual` (CSSWG `flags` with `paged`, `interact`, …),
`manual`, `visual`, `crashtest`. Support files are excluded.

Pass rates: `passRate = pass / reftests`, `passRateEvaluated = pass / (pass + pass-blank + fail)`
(what vellora renders correctly among the tests it accepts) and `passRateClean = passClean / reftests`
where `passClean` = passes with no suspect flag. All three are always reported.

### Suspect-pass flags (a pass that may not show what the test asserts)

A reftest pass proves that test and reference render alike, not that either rendered what the test
asserts. CONFIRMED by the validator (2026-10-21) and re-checked here: when both lose the same content
(nothing drawn, glyphs missing, an ignored property, an offset dropped in both), WPT's rule still
passes. Such passes stay `pass` but carry flags (`summary.passFlags`, `passFlagged`/`passClean`
per row, and `suspectPasses` in the expectations file):

| flag | source | meaning |
|---|---|---|
| `uncovered-glyphs` | prepare, deterministic | visible text (character data outside `<head>`/`<script>`/`<style>`, entities decoded, plus CSS `content:` strings; white space, controls and default-ignorable codepoints excluded) contains codepoints that **no** available face maps in its `cmap` (vellora's bundled Liberation Sans/Serif/Mono + DejaVu Sans of the build being measured ∪ Ahem ∪ supplied @font-face files; vellora never consults system fonts). A lower bound: a face that covers a codepoint is not necessarily the one parley picks. `prepare.uncoveredSample` lists the first eight |
| `css-url-resource` | prepare, deterministic | CSS `url()` outside `@font-face` (backgrounds, list images, content images; non-`data:`), which vellora never loads |
| `img-without-dims` | prepare, deterministic | an `<img>` without `width`/`height` attributes (not drawn by vellora, observation 2) |
| `webfont-not-supplied` | prepare, deterministic | a WOFF/WOFF2 `@font-face` that the harness cannot supply |
| `missing-resource` | prepare, deterministic | a stylesheet, image or font that is not in the tree / sparse checkout |
| `ink-missing-vs-chrome` | `--chrome`, indicative | vellora's TEST rendering lacks ≥ 50% of Chrome's significant ink for the same test (`inkCheck.missingFrac`: 3-bit-per-channel colour histogram, colours with ≥ 50 px; the validator's thresholds, so counts are comparable) |
| `ink-displaced-vs-chrome` | `--chrome`, indicative | the ink bounding box is > 100 px away from Chrome's (`inkCheck.bboxShift`); catches content drawn in the right colours in the wrong place in both test and reference (validator fixtures val-i2/val-i3: 300 px) while staying above the 8 px page-1 body-margin offset every box shows against Chrome |

The two ink flags are HYPOTHESIS-grade attribution aids (a histogram heuristic over a print-vs-paginate
comparison) and exist only when the Chrome oracle ran; flags never change an outcome.

## What is pinned, and why

* **WPT commit** `9d8aceec0ddc7ffe46d8f5f3f42d27a0163d6cba` (`WPT_COMMIT`) — the value of
  `wpt/WPT_COMMIT` on DioxusLabs/blitz `main` at `28f848d` (CONFIRMED 2026-10-20), so pass rates are
  computed on the same test files Blitz's own CI runs today. `fetch-wpt.mjs` does a `--depth 1
  --filter=blob:none` fetch of exactly that commit plus a non-cone sparse checkout
  (`suites.mjs: SPARSE_PATTERNS`): the five suites, `css/reference`, `css/support`, `fonts/`,
  `images/`, `resources/`, `docs/writing-tests/` and the wptrunner/manifest sources the semantics
  below are taken from (≈119 MB, ≈19k files; WPT is BSD-3-Clause and is never vendored).
  Caveat (CONFIRMED from `blitz-wpt-results/summary/runs.json`): Blitz's archived report for our
  current pin `2003ba5` was produced at WPT `8eaad6beb`, and the run closest to `0.3.0-beta.4`
  (`23b9b26a9b`, beta.4 + "Delete the bump crate") at `cd1d8aa5b`. Use
  `fetch-wpt.mjs --commit <sha> --dir <dir>` + `run.mjs --wpt <dir> --allow-unpinned` for a
  same-revision comparison.
* **The pin is enforced, not just recorded.** Before rendering, `run.mjs` requires the WPT tree to be
  its own git checkout (not a directory inside another repository, whose HEAD `git -C` would
  report), with HEAD = `WPT_COMMIT`, no modified tracked files and no untracked files (e.g. injected
  fixtures); otherwise it exits 2. `--allow-unpinned` measures such a tree anyway: the problems are
  recorded in `run-info.json`/`summary.json` (`wptPin`) and `summary.md`, and no ratchet or
  expectations update is performed.
* **Suites** (`suites.mjs`, each with a one-line reason): the CSS 2.1 directories that exercise
  document layout — normal-flow, margin-padding-clear, box, box-display, visudet, visuren, linebox,
  text, fonts, tables, borders, backgrounds, colors, lists, generated-content, floats,
  floats-clear, positioning, abspos, visufx, pagination — plus `css/css-tables`, `css/css-break`,
  `css/css-page`, `css/css-text`. Excluded with reasons in `EXCLUDED_SUITES`: parser/cascade
  directories owned by Stylo (selectors, cascade, syntax, values, sec5), `@import`, the bidi
  algorithm (`CSS2/bidi-text`), UI, media queries, stacking order, legacy css1, and directories with
  no reftests at this commit. Directories are excluded by the feature they test, never by the script
  of their text: `css/css-text/i18n` (CJK/Thai/Ethiopic line breaking, 0 passes) stays in, because
  dropping a 0% directory would shrink the denominator; its tests carry the `uncovered-glyphs` flag
  (no bundled or supplied face covers those scripts), which attributes the failures and keeps any pass
  out of the clean count. DESIGN TARGET: supply a pinned font set (e.g. Noto, recorded by hash) through
  `fonts` so these tests measure layout instead of font coverage.

## Pipeline per node (test or reference)

1. **Read** the file from the WPT tree; non-UTF-8 → `skip` (vellora's input contract is UTF-8).
2. **Prepare** (`lib/prepare.mjs`; every change is recorded in the test's `prepare` field):
   * `<link rel=stylesheet>` inlined as `<style>` at the same position (cascade order unchanged),
     nested `@import` inlined up to depth 3 (`inlinedStylesheets`, `inlinedImports`). vellora never
     fetches CSS; WPT tests assume a browser does. `--no-inline-css` measures the raw contract.
   * **Fonts**: `fonts/Ahem.ttf` is always passed via `fonts` (WPT `docs/writing-tests/ahem.md`
     assumes Ahem is available). TTF/OTF `@font-face` sources found in the CSS are passed too; a
     declared family that differs from the font's intrinsic `name`-table family is recorded in
     `fontAliasMismatch` (vellora matches by intrinsic family only); WOFF/WOFF2 are recorded in
     `skippedFonts`. CONFIRMED: the self-test renders Ahem `X` at 100px and finds a solid 100px-wide
     square, i.e. the supplied face is the one drawn.
   * **Images**: every `<img src>` found in the tree is passed via `images`, keyed by
     `new URL(src, nodeUrl).href` with `baseUrl = nodeUrl` (`http://web-platform.test:8000/<path>`)
     — the same WHATWG join as `vellora-core::resolve_image_key`. `imgWithoutDimAttrs` counts
     `<img>` without `width`/`height` attributes (see observation 2).
   * **UA page box**. A `<style>@layer vellora-ua-page { @page { … } }</style>` is injected
     before the author styles: screen reftests `size: 800px 600px; margin: 0` (the 800x600 WPT
     reftest viewport; `page_css::length_px` accepts `px`, CONFIRMED by `pdfinfo` showing
     `600 x 450 pts`), print reftests the WPT print default (`docs/writing-tests/print-reftests.md`
     at the pinned commit: 5in x 3in, 0.5in margins). Since port step 06 vellora-core cascades
     every `@page` rule (`page_css`). The injected rule sits in the first cascade layer, which
     loses to every later layer and to every unlayered rule, so every author `@page` rule
     (`:first`, `:left`, `:right` and layered ones included) overrides it like a UA default. Until
     step 06 vellora read only the first `@page` block and the print default was merged into the
     start of it (`pageInjection: "merged-into-author-@page"`), which gave pages 2+ of a document
     whose first block was `@page :first` vellora's A4/16mm default. An author `@page` before the
     insertion point is noted (`authorPageBeforeUaPage`). The `<style>` goes right after `<head>`
     (else `<html>`, else the doctype), never between the doctype and an explicit `<html>`
     (observation 1).
3. **Render** with `renderPdf(..., { strict: true, ... })` in a forked worker process (one test at a
   time per worker; a timeout or native crash kills only that worker and is attributed to the test).
   **XML-served nodes** (`.xht`, `.xhtml`, `.xml`; WPT serves them as `application/xhtml+xml`, so
   Chrome parses them as XML) go through the same `renderPdf` call with `_bridge` set to
   `lib/xhtml-bridge.mjs`: one `xhtml_render` process per render (a vellora-core example next to
   `layout_dump`, built by `run.mjs` in the measured checkout), which runs
   `vellora_core::debug_render_xhtml`, `render`'s pipeline with blitz-html's XML parser (xml5ever).
   Templating, the strict orchestration and the diagnostic mapping are the product's; only the
   parser differs, and the product API cannot reach it. Since port step 08 the product parses
   every document as HTML (its input is a `text/html` string); before, blitz-html sniffed the
   content and parsed an XHTML doctype, an `<?xml` prolog or a leading `<html xmlns="…xhtml">` as
   XML. Keeping the XML parse for these nodes changes no outcome against step 07 (8047 unchanged);
   feeding them to the HTML parse would turn 1518 passes into fails (1474 clean) and 175 fails into
   passes, all of them in tests with a CDATA section
   (`baselines/port/08-html-parse/attachments/xht-parse-measurement.json`). `--xhtml-parser html`
   measures that variant; `results.json config.xmlServedNodes` records which parse a run used. Not
   part of the Chrome-reuse comparison settings: it changes vellora's renderings, not the verdict
   rules, so `HARNESS_SEMANTICS` stays 2.
4. **Rasterize** with `pdftocairo -png -r 96` (1 CSS px = 1 device px, the scale WPT's
   `print_pdf_runner.html` uses: pdf.js viewport scale 96/72). Screen: page 1 only (the viewport).
   Print: all pages (≤50 rasterized; true count from `pdfinfo` beyond that).
5. **Compare** (`lib/pixels.mjs`, `lib/refgraph.mjs`).

### Comparison semantics (primary sources at the pinned commit)

* Max per-channel RGB difference and number of differing pixels, exactly wptrunner's
  `get_differences`; equality is wptrunner `check_pass`: without fuzzy, zero differing pixels; with
  `<meta name=fuzzy>`, `(px==0 && minPx==0) || (max==0 && minMax==0) || (both within the inclusive
  ranges)`. Fuzzy values follow the manifest parser (`maxDifference=`/`totalPixels=` named or
  positional, `a-b` ranges, optional `<ref-url>:` key resolved against the node URL). For a
  comparison the LEFT node's fuzzy applies (wptrunner `get_fuzzy`), per page.
* Multiple references: "at least one `match` must match, and all `mismatch` must differ"
  (`docs/writing-tests/reftests.md`). wptrunner implements exactly that as a graph
  (`tools/wptrunner/wptrunner/wpttest.py` `ReftestTest.from_manifest`: every `==` reference is
  followed by an ANDed chain of all `!=` references, walked depth-first by
  `executors/base.py` `RefTestImplementation.run_test`); this runner evaluates the same rule
  directly. Two edge differences remain, both CONFIRMED from that source: wptrunner compares the
  mismatch chain from the matched reference (`ref != m1`, `m1 != test`, …) with no fuzzy beyond
  the first comparison, while this runner compares `test != m` with the test's fuzzy (identical
  verdicts without fuzzy, since `test == ref` exactly); and wptrunner returns ERROR as soon as any
  node of the walk fails to render, while this runner reports a non-evaluable node only when no
  alternative passes.
* A reference's own `<link rel=match|mismatch>` is **not** followed (default). CONFIRMED at the pin:
  `from_manifest` builds every nested node with references taken only from the root's mismatch
  chain, never from the reference file (the class docstring "the reference passes if it has any
  references recursively" is stale relative to that code), and `docs/writing-tests/reftests.md`
  documents no chaining. Blitz's upstream runner does not chain either. `--chain-references` opts
  into following them (cycle-safe, depth ≤ 8) for diagnosis; it is recorded in the run config,
  refused for `--update-expectations`, and a ratchet or `--chrome-from` across the two modes is
  refused. (The pre-fix harness e47e77f chained by default: 61 tests chained and 50 failed only
  through the chain, per the validator.)
* Print: page counts must match for `==`; `<meta name=reftest-pages>` selects pages per node URL
  (wptrunner `get_pages`).
* When no alternative passes and some alternative was not evaluable (unsupported/error/timeout/
  skip), the verdict is that outcome (`node: "ref"`), never a `fail` that was not observed.
* Discovery mirrors the manifest's `SourceFile.manifest_items` order (support dirs, `-manual`,
  `-visual`, crashtests, print reftests = `-print` suffix or a `print/` directory, CSSWG manual flags,
  testharness, reftests, visual) — `lib/discover.mjs`.

### Rasterizer choice — evidence (CONFIRMED 2026-10-21, same 300 reftests: first 300 of CSS2 box + linebox + margin-padding-clear)

| rasterizer | Chrome pass | vellora pass |
|---|---|---|
| `pdftoppm -r 96` (Splash) | 43.0% | 23.3% |
| `pdftoppm -r 96 -aa no -aaVector no` | 44.3% | 23.7% |
| `pdftocairo -png -r 96` (**default**) | 97.3% | 25.3% |
| `pdftocairo -png -r 96 -antialias none` | 98.0% | 25.7% |

Root cause of the Splash numbers: on the same Chrome PDF an Ahem glyph square rasterizes to
x = 7..207 while the equal CSS box rasterizes to x = 8..207 (FreeType glyph coverage one pixel
wider than the path fill), so every glyph-vs-box reftest fails regardless of layout. pdftocairo
gives 8..207 for both. A rasterizer under which Chrome passes ~97% of CSS2 reftests is the
precondition for reading vellora's failures as vellora's.

## Chrome print oracle (`--chrome`, `lib/chrome.mjs`)

Chrome renders the same test and references via `page.pdf()` (CDP `Page.printToPDF`): screen
reftests on an 800x600 CSS px sheet with zero margins and `screen` media emulated; print reftests on
5in x 3in with 0.5in margins (wptrunner's `WebDriverPrintProtocolPart.render_as_pdf`), author `@page`
size honoured (`preferCSSPageSize`), backgrounds printed (wptrunner passes `background=True`). A
local static server serves the WPT tree (127.0.0.1 only) and injects
`@font-face { font-family: Ahem; src: url(/fonts/Ahem.ttf) }` — the equivalent of the installed Ahem
WPT assumes. It waits for `load`, `document.fonts.ready`, removal of `reftest-wait` (≤5 s) and two
animation frames raced with a 100 ms timer (CONFIRMED: without the timer the first page of every
concurrent lane never received rAF callbacks and timed out). Same `pdftocairo` + comparator.
Chrome is a *print* oracle, not a screenshot: a screen reftest that depends on screen-only behaviour
can differ. Local Chrome is **indicative**; the version is recorded from `browser.version()`.

`--chrome-from <results.json>` reuses the Chrome outcomes and ink signatures of an earlier run (Chrome
does not depend on the vellora build). It is refused (exit 2) unless that run used the same WPT
commit, rasterizer configuration and comparison semantics (harness semantics version, chaining, CSS
inlining), and when that run was unpinned while this one is pinned. Results from e47e77f (semantics
1, no ink signatures) are therefore not reusable.

DESIGN TARGET (CI): pin Chrome for Testing with `node fidelity/wpt/install-chrome.mjs`
(`CHROME_FOR_TESTING_BUILD = 155.0.8059.85`, `@puppeteer/browsers` 3.2.5; CONFIRMED the mac-arm64
archive URL answers HTTP 200), then `run.mjs --chrome <printed path>`; record the build in the
results (done automatically). Not run in CI yet.

## Upstream baseline: Blitz's own WPT results

CONFIRMED (read `wpt/runner/src/**` and `.github/workflows/wpt.yml` on blitz `main` 28f848d): Blitz
runs `cargo run -rp wpt css svg` on every main push and publishes the per-test `wptreport.json` to
GitHub Pages (`https://dioxuslabs.github.io/blitz/wptreport.json`, main only) and archives one
report per tested commit in [DioxusLabs/blitz-wpt-results](https://github.com/DioxusLabs/blitz-wpt-results)
(`reports/<blitz-sha>.json.zst`, `summary/runs.json` maps each to its WPT revision; 1199 runs on
2026-10-20, our pin `2003ba5` among them; the `0.3.0-beta.4` tag commit `92b11f1` itself was not
run, the nearest run is `23b9b26a9b` = beta.4 + one non-layout commit). `run.mjs --upstream auto` downloads the report for the Blitz rev in
`Cargo.lock` into `fidelity/.cache/blitz-wpt-results/` (zstd via `node:zlib`) and cross-tabs it.

**crates.io builds** have no git rev in `Cargo.lock`. `lib/upstream-map.mjs` maps the version to its
tag commit and to the nearest upstream run, with the evidence recorded in the table (CONFIRMED
2026-10-21): `0.3.0-beta.4` = tag `v0.3.0-beta.4` (object `560b324f`) = commit
`92b11f1bd8ab7975411328b0406a95a09445b4e7`; no upstream run is keyed by it (`summary/runs.json`,
1203 runs); `23b9b26a9b` is 1 commit ahead and changes only `apps/bump`, `Cargo.toml`, `Cargo.lock`
and `justfile` (GitHub compare API), run at WPT `cd1d8aa5bfebc15d1af2af230c7ff95f9e582a4c`.
UNVERIFIED ASSUMPTION: that `Cargo.lock` change moved no dependency the renderer uses. The summary
records `upstream.via`, `sameWptRevision` and a comparability note. **Same-revision comparison**:
our pin (`9d8aceec0`) is not the upstream run's WPT revision, so test files can differ; to compare
like for like, fetch that revision and run unpinned (no ratchet):
`node fidelity/wpt/fetch-wpt.mjs --commit cd1d8aa5bfebc15d1af2af230c7ff95f9e582a4c --dir fidelity/.cache/wpt-cd1d8aa5b`
then `node fidelity/wpt/run.mjs --wpt fidelity/.cache/wpt-cd1d8aa5b --allow-unpinned --upstream auto`
(`sameWptRevision: true` in its summary).

How Blitz's runner differs from this one (all CONFIRMED from its source), which is why the upstream
number is an **upper bound**, not a like-for-like oracle:

* paints the Blitz DOM directly with `blitz-paint` + vello (CPU) into an 800x600 buffer — no
  pagination, no PDF, no vellora post-layout passes;
* builds blitz-dom with `floats`, `system-fonts`, `woff`, `svg`, … enabled; vellora builds
  `default-features = false` (no `floats`; CONFIRMED in `crates/vellora-core/Cargo.toml` and the
  blitz-dom 2003ba5 feature table);
* without `<meta name=fuzzy>`, a test passes when `dify` (threshold 0.1, anti-aliasing detection)
  finds no difference — more lenient than WPT's exact rule used here; fuzzy minimums are not
  enforced; mismatch references are AND-ed; references are not chained;
* executes scripts (`blitz-vibey-script`), loads resources through a WPT-tree net provider, waits
  for `reftest-wait`; quarantines timeout-prone tests (`timeout-quarantine.txt`: 252 entries, 251
  under `css/`, none in this runner's default suites); a blank (all-zero) test buffer is a failure.

## Expectations ratchet

Committed baselines live in `fidelity/baselines/wpt/<engine-id>.json` (the location
`fidelity/README.md` assigns to committed baselines; `engine-id` = `blitz-<first 12 of the
blitz-dom rev in Cargo.lock>`, or `blitz-<version>` for a crates.io Blitz). Schema 2 maps each
reftest path to its outcome and records the vellora commit and source hash, WPT commit, date,
command, the comparison settings the outcomes depend on (`comparison`: harness semantics version,
chaining, CSS inlining, rasterizer/DPI/antialias), `suspectPasses` (test → comma-joined flags for
every flagged `pass`) and `inkCheck` (whether Chrome-derived flags are included).

Every run compares against the file for its own engine (`--expectations auto`) or a given file
(`--expectations <file>`, e.g. the pre-bump baseline when measuring a Blitz bump) and writes
`ratchet.json`:

* **regressions** — expected `pass` → anything else, including `pass-blank` (content vanished);
  split into `regressionsOfCleanPasses` and `regressionsOfFlaggedPasses` (each regression carries
  the expected pass's flags), so a regression of a never-verified pass is not mistaken for a new bug;
* **sightGained** — expected `pass-blank` → a non-pass: the oracle now sees content it could not see
  before (not a regression);
* **improvements** (non-pass → `pass`), **changed** (non-pass → other non-pass), `added`, `missing`.

The process exits 1 when there is at least one regression. The ratchet is **refused** (`status:
"not-run"` with the reason; exit 2 when the file was given explicitly) when the WPT tree is not the
exact pin, the expectations were produced on another WPT commit, with other comparison settings, or
with schema 1. `--update-expectations` is refused (exit 2, before anything renders) for partial runs
(`--filter`, `--limit`, suites other than the default set), `--chain-references` and unpinned
trees; regenerate intentionally and commit the diff with the reason. Local macOS runs are
indicative; the authoritative baseline should come from the pinned Linux CI run (DESIGN TARGET).

**Ink data is required (2026-10-21).** Clean vs flagged passes depend on the Chrome ink flags, so:
`--update-expectations` is refused unless the run has Chrome ink data (`--chrome` or
`--chrome-from`), and the ratchet is refused on an `inkCheck` mismatch (expectations "chrome X" vs
a run without Chrome, or another Chrome). Every run writes `outcomes.json` (the expectations shape
of THIS run); the fidelity gate (`fidelity/gate/`, `run-all.mjs --gate`) compares it with the
expectations of a committed baseline directory: a lost CLEAN pass or a clean pass that becomes
suspect gates, a lost FLAGGED pass is only reported, a test that starts to error gates.

## Crashtests (`crashtests.mjs`, WPT-3)

The default suites contain 239 crashtests (`-crash` flag or a `crashtests/` directory; counted as
`notRun.crashtest` by `run.mjs`). `node fidelity/wpt/crashtests.mjs [--out <dir>]` renders each one
through the real pipeline in forked workers (`lib/crash-worker.mjs`) and records ok / panic /
crash / timeout / error / skip (`lib/crash-outcome.mjs`: a strict-gate rejection is ok; error is a
HARNESS failure). Output `crashtests.json`; `run-all.mjs` runs it and the gate ratchets each test
(ok → panic/crash/timeout gates). CONFIRMED 2026-10-21 at Blitz 0.3.0-beta.4: 239 ok (128 rendered,
111 rejected cleanly by the strict gate), after fixing a harness EISDIR crash in `lib/prepare.mjs`
(a resource URL resolving to a directory is now a missing resource).

## Results on the current pin (CONFIRMED, local macOS run — indicative, not the CI baseline)

Run `20261021T044423Z-blitz-2003ba5fc2d8-vellora-363377d`, command
`node fidelity/wpt/run.mjs --chrome "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --update-expectations`,
`date -u`: Wed Oct 21 04:44:23 UTC 2026. macOS 27.0.1 (26A434), Apple M5 Pro, 18 CPUs, 48 GiB; node
v22.23.2; rustc 1.96.0 (ac68faa20 2026-05-25); poppler pdftocairo 26.06.0; Chrome 155.0.8059.85
(local install). Engine: blitz-dom 0.3.0-alpha.5 @ `2003ba5fc2d8`, stylo 0.18.0, parley 0.10.0,
krilla 0.8.2. WPT `9d8aceec0ddc`, pin exact (own checkout, HEAD = `WPT_COMMIT`, 0 modified, 0
untracked). vellora 363377d, clean tree; rendering code identical to `main` 5810062 (this branch only
adds `fidelity/wpt/`, `fidelity/baselines/wpt/` and a `biome.json` ignore). Harness semantics 2
(no reference chaining, `pass-blank`). Runtime: vellora phase 44 s with 12 worker processes
(≈183 tests/s), Chrome phase 541 s with 6 pages; 585 s total. The committed baseline
`fidelity/baselines/wpt/blitz-2003ba5fc2d8.json` was then written by
`node fidelity/wpt/run.mjs --chrome-from fidelity/results/wpt/20261021T044423Z-blitz-2003ba5fc2d8-vellora-363377d/results.json --update-expectations`
(run `20261021T045604Z-…-vellora-985b112`, 04:56:04 UTC, same Chrome outcomes and ink signatures).

| suite | reftests | pass | pass (clean) | pass-blank | fail | unsup | error | skip | pass % | % of evaluated | clean pass % | Chrome pass % |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| css/CSS2/normal-flow | 789 | 383 | 360 | 8 | 324 | 73 | 0 | 1 | 48.54 | 53.57 | 45.63 | 99.24 |
| css/CSS2/margin-padding-clear | 682 | 404 | 391 | 0 | 277 | 1 | 0 | 0 | 59.24 | 59.32 | 57.33 | 99.12 |
| css/CSS2/box | 9 | 4 | 0 | 0 | 5 | 0 | 0 | 0 | 44.44 | 44.44 | 0 | 100 |
| css/CSS2/box-display | 120 | 49 | 49 | 0 | 35 | 35 | 1 | 0 | 40.83 | 58.33 | 40.83 | 93.33 |
| css/CSS2/visudet | 38 | 13 | 6 | 0 | 22 | 3 | 0 | 0 | 34.21 | 37.14 | 15.79 | 65.79 |
| css/CSS2/visuren | 39 | 2 | 2 | 0 | 29 | 8 | 0 | 0 | 5.13 | 6.45 | 5.13 | 94.87 |
| css/CSS2/linebox | 191 | 15 | 14 | 2 | 171 | 3 | 0 | 0 | 7.85 | 7.98 | 7.33 | 97.91 |
| css/CSS2/text | 410 | 170 | 161 | 6 | 212 | 22 | 0 | 0 | 41.46 | 43.81 | 39.27 | 81.22 |
| css/CSS2/fonts | 160 | 108 | 106 | 0 | 51 | 1 | 0 | 0 | 67.5 | 67.92 | 66.25 | 89.38 |
| css/CSS2/tables | 372 | 18 | 17 | 0 | 232 | 122 | 0 | 0 | 4.84 | 7.2 | 4.57 | 89.25 |
| css/CSS2/borders | 506 | 322 | 292 | 0 | 182 | 2 | 0 | 0 | 63.64 | 63.89 | 57.71 | 100 |
| css/CSS2/backgrounds | 336 | 179 | 60 | 2 | 152 | 3 | 0 | 0 | 53.27 | 53.75 | 17.86 | 86.31 |
| css/CSS2/colors | 19 | 6 | 6 | 0 | 13 | 0 | 0 | 0 | 31.58 | 31.58 | 31.58 | 52.63 |
| css/CSS2/lists | 156 | 67 | 39 | 0 | 88 | 1 | 0 | 0 | 42.95 | 43.23 | 25 | 100 |
| css/CSS2/generated-content | 226 | 23 | 20 | 0 | 177 | 26 | 0 | 0 | 10.18 | 11.5 | 8.85 | 87.61 |
| css/CSS2/floats | 111 | 21 | 17 | 0 | 81 | 9 | 0 | 0 | 18.92 | 20.59 | 15.32 | 84.68 |
| css/CSS2/floats-clear | 214 | 28 | 24 | 0 | 179 | 7 | 0 | 0 | 13.08 | 13.53 | 11.21 | 97.66 |
| css/CSS2/positioning | 520 | 172 | 169 | 0 | 326 | 22 | 0 | 0 | 33.08 | 34.54 | 32.5 | 98.85 |
| css/CSS2/abspos | 29 | 3 | 3 | 0 | 22 | 4 | 0 | 0 | 10.34 | 12 | 10.34 | 93.1 |
| css/CSS2/visufx | 53 | 1 | 1 | 1 | 47 | 4 | 0 | 0 | 1.89 | 2.04 | 1.89 | 100 |
| css/CSS2/pagination (print) | 43 | 19 | 17 | 0 | 24 | 0 | 0 | 0 | 44.19 | 44.19 | 39.53 | 90.7 |
| css/css-tables | 171 | 31 | 23 | 3 | 100 | 37 | 0 | 0 | 18.13 | 23.13 | 13.45 | 91.81 |
| css/css-break | 1121 | 86 | 66 | 1 | 737 | 297 | 0 | 0 | 7.67 | 10.44 | 5.89 | 88.85 |
| css/css-page (print) | 224 | 62 | 46 | 5 | 100 | 56 | 1 | 0 | 27.68 | 37.13 | 20.54 | 83.48 |
| css/css-text | 1508 | 392 | 99 | 17 | 966 | 133 | 0 | 0 | 25.99 | 28.51 | 6.56 | 78.98 |
| **total** | 8047 | 2578 | 1988 | 45 | 4552 | 869 | 2 | 1 | 32.04 | 35.93 | 24.7 | 90.27 |

8047 reftests (7712 screen, 335 print), 0 timeouts. Not run (not reftests): 629 testharness, 415
CSSWG-manual, 1913 visual, 239 crashtests, 2 manual. Errors: 2 Rust panics surfaced as rejections
(observation 8). Skip: 1 (`.sub.` file). Templating errors: 0.

* **`pass-blank` 45** (were `pass` under e47e77f). Chrome's rendering of the same test draws
  significant ink in 40 of them and is blank in 2 (`css/css-break/overflowed-abs-pos-with-percentage-height-print.html`,
  `css/css-text/text-indent/text-indent-caret-hanging-001.html` — plausibly legitimate blank passes,
  conservatively left out of `pass`: a loss of 2 we report rather than hide). 3 blank renderings
  that matched an empty-by-construction reference remain `pass` (`content-counter-001.xht` vs
  `about:blank`, `ink-overflow-001-print.html` vs `about:blank`, `zwnj-renders-invisible.html` vs
  `css/reference/blank.html`).
* **No reference chaining**: 50 tests that failed only through a chained reference under e47e77f now
  pass (all 50 had a comparison with a reference on the left). Net: pass 2573 → 2578.
* **Flagged passes: 590 of 2578** (`pass (clean)` 1988 = 24.70% of reftests). Per flag (a pass can
  carry several): `ink-missing-vs-chrome` 280, `uncovered-glyphs` 193, `css-url-resource` 162,
  `ink-displaced-vs-chrome` 100, `webfont-not-supplied` 93, `missing-resource` 28,
  `img-without-dims` 27. css-text is the extreme (392 passes, 99 clean); CSS2/backgrounds (179, 60
  clean: CSS `url()` backgrounds are never loaded) and lists (67, 39) follow.
* **Ink check** (2577 passes with ink from both engines; HYPOTHESIS-grade): share of Chrome's
  significant ink missing in vellora's test rendering < 0.1: 2098, 0.1–0.3: 141, 0.3–0.5: 58,
  0.5–0.8: 105, ≥ 0.8: 175 (validator, same metric, e47e77f passes: 254 at ≥ 0.5 among 2524
  non-blank passes; here 280 among 2577 — the 50 un-chained passes are included). Ink bounding-box
  shift: ≤ 8 px 49, 9–32 px 1968, 33–100 px 243, > 100 px 312, no ink 5 — most passes sit 9–32 px
  away from Chrome (observation 5: page-1 leading space dropped), which is why the displacement flag
  starts at 100 px.

Strict-gate rejections (`unsupported`, node rejected): `element:script` 462 (+1 ref), `css:grid` 218
(+11 ref), `css:transform` 47 (+1 ref), `element:iframe` 34, `css:page-margin-box` 29,
`element:textarea` 26, `element:canvas` 12, `css:filter` 8, `element:form` 7, `element:object` 7,
`element:input` 2, `element:video` 2, `image:unresolved` 2.

**vellora × Chrome** (tests both evaluated): vellora-only fail 4049, both fail 502, vellora pass /
Chrome fail 99, both pass 2478, vellora pass-blank 45. **vellora × Blitz's own report** for
`2003ba5` (upstream WPT `8eaad6beb`): both pass 2406, vellora fail / upstream PASS 1967, vellora pass
/ upstream not-pass 165, vellora pass-blank 44 (+1 upstream-absent), both fail 2504, vellora not
evaluated / upstream PASS 177, upstream has no result 201. **Attribution of the 4552 vellora
failures** (triage, `attribution.json` lists them): `velloraLayerSuspect` 1758 (Chrome and Blitz's
own runner both pass), `blitzLayoutSuspect` 2213 (Chrome passes, Blitz's runner does not),
`oracleInconclusive` 502 (Chrome fails too), `unattributed` 79. HYPOTHESIS-grade only: the upstream
runner is lenient (dify) and builds `floats`.

Reproducibility (CONFIRMED): the two runs above (04:44 and 04:56 UTC, separate processes) produced
identical records for all 8047 tests — outcome, `blank`, rejected feature, every comparison's
pass/maxDifference/totalPixels/firstDiffPage, the `prepare` record (flags included) and the ink
signature — and identical `results`/`suspectPasses` in the two baselines they wrote. (Under
e47e77f, Chrome flipped on 7 script-driven "dynamic" tests between two runs; vellora rejects all 7 as
`element:script`.)

### Extra measurement: the Blitz 0.3.0-beta.4 bump (research/blitz-beta4-bump `dff3bc6`)

Same harness, WPT commit, rasterizer and Chrome outcomes (`--chrome-from` the pin run above, which
carries Chrome ink signatures), build from `git archive dff3bc6` → `npm ci && npm run build` in
`/tmp/wpt-a1/beta4-src` (no git: named by its source hash `5803049f5f2c`, `--label` records the
provenance; not durable). Run `20261021T045709Z-blitz-0.3.0-beta.4-vellora-nogit-5803049`
(04:57:09 UTC, 45 s), command `node fidelity/wpt/run.mjs --vellora /tmp/wpt-a1/beta4-src/packages/vellora/dist/index.js
--chrome-from fidelity/results/wpt/20261021T044423Z-blitz-2003ba5fc2d8-vellora-363377d/results.json
--upstream 23b9b26a9b6af5947b8f003d2c2cc768bff10b8a --expectations fidelity/baselines/wpt/blitz-2003ba5fc2d8.json
--label "research/blitz-beta4-bump dff3bc6 exported with git archive to /tmp/wpt-a1/beta4-src, built with npm ci && npm run build"`
(upstream `23b9b26a9b` = nearest Blitz run to the beta.4 tag, upstream WPT `cd1d8aa5b`).

* Total pass 2578 → **2729** (32.04% → 33.91%; evaluated 35.93% → 38.01%; clean 1988 → 2213,
  24.70% → 27.50%); pass-blank 45 → 37. The ratchet against the committed baseline: **164
  regressions — 53 of clean passes, 111 of flagged passes** — 6 `sightGained` (pass-blank → fail),
  315 improvements, 3 changed, 7559 unchanged; every regression is now a `fail`. The runner exits 1
  because of the regressions, as designed. Largest moves (improvements/regressions): css-text
  +101/−72, CSS2/text +53/−0, linebox +30/−0, css-break +24/−9, generated-content +22/−4,
  backgrounds +9/−36, positioning +13/−10.
* **How much of e47e77f's "161 regressions" was oracle noise** (the validator's question): re-scored
  under the fixed semantics, 6 are `sightGained` (the pin pass was blank), 104 regress a pass that
  is flagged suspect, and 51 regress a clean pass (+2 more clean and +7 more flagged regressions
  appear because 50 un-chained tests now pass at the pin). Flags on the 111 flagged regressions:
  `ink-missing-vs-chrome` 61, `webfont-not-supplied` 54, `uncovered-glyphs` 41,
  `css-url-resource` 38, `ink-displaced-vs-chrome` 16. CONFIRMED example of the shape (builder):
  `css/CSS2/backgrounds/background-002.xht` paints with CSS `background: url(...)` (never loaded)
  against an `<img width="100%" height="50">` reference; at the pin neither was drawn, at beta.4 the
  reference image is.
* **Phase A attribution question — raw Blitz or vellora's post-layout passes?** For the 53
  regressions of clean passes: Blitz's own runner at beta.4 passes 37 and fails 16; Chrome passes 48
  (fails 4, errors 1); both pass 33. HYPOTHESIS (triage, not proof): about two thirds of the
  WPT-visible clean regressions of the bump arise in what vellora adds after Blitz layout
  (DOM-children walk missing anonymous blocks, `layout_normalize.rs`, pagination, emit), and about
  one third reproduce in raw Blitz. Caveats: the upstream runner is lenient (dify), builds `floats`,
  and ran WPT `cd1d8aa5b`, not `9d8aceec0`. The per-box layout diff (`fidelity/layout-diff`), raw
  Blitz vs post-normalize boxes, is the instrument that can confirm it per test;
  `ratchet.json` lists the 53 (`regressions` without `expectedFlags`).
* Attribution of all 4413 beta.4 failures: `velloraLayerSuspect` 2126, `blitzLayoutSuspect` 1764,
  `oracleInconclusive` 520, `unattributed` 3 (the beta.4 upstream report lacks only 38 of our tests, the pin report 201).

## Independent validation (2026-10-21) and what changed

A validator re-ran the harness from an independent build and injected defects. All but one were
caught by e47e77f; that one, and the findings below, are fixed (commits on `fidelity/wpt` after
e47e77f), each with a `node --test` regression test under `test/`:

| finding (validator) | fix | regression test |
|---|---|---|
| **major** — blank-vs-blank (and other shared-loss) pairs counted as `pass`; injected defect (a') (`text-transform-uppercase-001.xht` with an unrelated reference; body text vs other body text) passed | `pass-blank` outcome excluded from every pass rate; deterministic suspect-pass flags; Chrome ink check; expectations store flagged passes; ratchet reports `sightGained` | `blank-pass.test.mjs`, `oracle.test.mjs` (real pipeline: empty bodies → `pass-blank`, vs `/common/blank.html` → `pass`; the (a') shape is never `pass`), `flags-ink.test.mjs`, `provenance.test.mjs` |
| chained references are not wptrunner semantics; README misdescribed chaining and multiple references | no chaining by default (`--chain-references` opt-in); README corrected from `wpttest.py`/`base.py` | `refgraph.test.mjs` |
| WPT pin and tree cleanliness only warned about; ratchet ignored provenance | pin enforced (own checkout, HEAD, tracked + untracked files) unless `--allow-unpinned`; ratchet/`--chrome-from`/update refuse other WPT commits and comparison settings | `provenance.test.mjs` (real temp git repo), `cli.test.mjs` |
| `--update-expectations` overwrote the baseline on partial runs | refused before rendering for `--filter`/`--limit`/non-default suites | `cli.test.mjs` |
| `--artifacts all` wrote nothing for passes | page-1 test/reference rasters (+PDFs) for every compared test | `blank-pass.test.mjs` |
| i18n scope inconsistent (`CSS2/bidi-text` excluded, `css-text/i18n` included) | scope rule is by feature tested; i18n kept and flagged `uncovered-glyphs` (cmap coverage) | `flags-ink.test.mjs` |
| baseline location / provenance hygiene | baseline moved to `fidelity/baselines/wpt/`; run ids sanitized; builds without git need `--label` and are named by a source hash; only a 40-hex SHA counts as a commit | `provenance.test.mjs`, `cli.test.mjs` |
| engine behaviours behind false passes | re-probed and recorded below (observations 3–6, 9) | — |

**Injected defects re-run with the fixed harness** (CONFIRMED 2026-10-21 04:43 UTC, vellora 1017aa6, on
the validator's mutated tree `/tmp/val528-5/wpt-mut` = WPT 9d8aceec0 + 60 untracked fixtures + one
modified tracked file): without `--allow-unpinned` the runner now refuses that tree (exit 2: "1
modified tracked file(s); 60 untracked file(s)"). With it, `node fidelity/wpt/run.mjs css/CSS2/borders
--wpt /tmp/val528-5/wpt-mut --filter 'val-|border-bottom-color-174' --allow-unpinned --expectations
none --upstream none` gives the validator's verdict for all 40 tests except the two that were the
uncaught defect: val-a3 (`pass` → `pass-blank`) and val-a4 (`pass` → `pass-blank`). Unchanged: a0
pass, a1 fail (swapped ref), b1/b2 fail, b3 pass (mismatch AND rule), c1–c4 `unsupported`
(`css:transform`, test or ref), d1 fail (floats compiled out), e-ahem fail, the fuzzy fixtures
(g0 fail, g1 pass, g2/g3 fail, g4 fail — fuzzy in the ref is ignored, g5 pass, g5b metadata error,
g6 fail, g7/g7b pass), i1/i4/i5 fail, i2/i3 pass. With `--chrome` on the same set, i2/i3 — the
displaced-content false passes the colour metric cannot see — show `inkCheck.bboxShift` 300 and are
flagged `ink-displaced-vs-chrome`; a3/a4 show `missingFrac` 1 (Chrome draws text, vellora nothing).

## Observations surfaced by the runner (CONFIRMED with a repro; causes are HYPOTHESES)

Engine behaviours, not harness defects. They are the mechanisms behind most false passes (test and
reference lose the same thing) and belong in the layout-diff handoff. Unless noted, re-probed on
2026-10-21 04:44 UTC with `/tmp/wpt-fix-probes/probe.mjs` (the runner's own loader:
`renderPdf` strict + pdftocairo 96 DPI, 800x600 screen page) at vellora 1017aa6, whose rendering
code is identical to `main` 5810062 (Blitz 2003ba5); first reported by the validator.

1. **Blank page from a `<style>` before `<html xmlns>`.** `<!DOCTYPE html><style>…</style><html
   xmlns="http://www.w3.org/1999/xhtml"><head>…</head><body><p>Hello</p></body></html>` renders an
   empty page (1.7 KB PDF); a plain `<html>`, or a `<meta>` instead of the `<style>`, renders
   normally. The runner avoids the shape (it inserts after `<head>`). (Builder, 2026-10-21.)
2. **`<img>` without `width`/`height` is not drawn, and not rejected.** With the bytes supplied via
   `images` (correct key), `css/CSS2/reference/ref-filled-black-96px-square.xht` renders no square.
   Source: `blitz_engine.rs` resolves image bytes only during the post-layout walk, so Blitz lays the
   element out with no intrinsic size and `resolve_image_runs` skips 0-sized images before the
   unresolved-image check. Flagged per test as `imgWithoutDimAttrs` / `img-without-dims`.
   (Builder, 2026-10-21.)
3. **Inline content directly in `<body>` and the body background are not painted.**
   `<body>Hello world</body>` and `<body><span>Hello world</span></body>` rasterize pure white
   (0 non-white px) while `<body><p>Hello world</p></body>` paints 429 px at x 8..84, y 0..11;
   `<body style="background:rgb(0,128,0)">` leaves pixel (400,500) white while a `<div>` background
   paints. This is why the validator's injected defect (a') "passed" before `pass-blank` existed.
   HYPOTHESIS: the DOM-children walk that misses Blitz anonymous blocks (prior evidence) and a
   root/body background that is never emitted.
4. **`opacity` is silently ignored and not rejected.** `opacity:0.5` on a red 100px box: the strict
   gate accepts it and pixel (50,50) is rgb(255,0,0). Tests that rely on opacity pass or fail by
   accident (validator example: `abspos-in-opacity-000` passes drawing red where purple is expected).
5. **Leading vertical space before the first content on page 1 is dropped.** A 100px box as the first
   child of `<body>` paints at x 8..107, y 0..99 (Chrome 155 prints it at y 8..107: the 8px body
   margin). `body { padding-top: 40px }` changes nothing (y 0..99); `position:absolute; top:300px;
   left:0` paints at x 8..107, y 0..99 (its static position — both offsets ignored) and
   `position:relative; top:300px` at y 0..99 too; after a 10px inked spacer the same relative box is
   honoured (y 310..409). Equal for test and reference, so only Chrome (or `ink-displaced-vs-chrome`)
   sees it.
6. **Ahem glyph placement: 4px high.** Below a 20px spacer, `<div style="font:100px/1 Ahem">X</div>`
   paints x 8..107, y 16..115, where an equal 100px box paints y 20..119; horizontally the glyph is
   exactly 100px. Both rasterizers, so not a raster artifact. HYPOTHESIS: ascent/baseline metric
   choice. Every Ahem-glyph-vs-box reftest is therefore a systematic false fail (validator fixture
   val-e-ahem fails in vellora, passes in Chrome).
7. **`floats` is compiled out.** vellora-core builds blitz-dom with `default-features = false`,
   which drops `taffy/float_layout`; CSS2 floats/floats-clear score far below Chrome (table above).
   Validator fixture val-d1 (two float:left boxes vs an abs-pos reference) fails in vellora and passes
   in Chrome.
8. **Panics** in `blitz-dom/src/resolve.rs:343` (`Option::unwrap()` on `None`) on two root-element
   edge cases (`css/CSS2/box-display/root-box-003.xht`, `css/css-page/root-element-display-none-print.html`).
9. **Screen reftests that spill onto page 2.** The validator counted 111 of 6905 evaluated screen
   tests whose vellora PDF has a second page (93 fail, 18 pass); page 2 is never compared (screen =
   page 1, the viewport). Not re-measured here (the loader rasterizes only page 1 for screen tests).
   It supports the "small effect" HYPOTHESIS under Known gaps. The screen `@page` injection itself is
   faithful: `html, body { height: 100% }` and `50vh` probes resolve to 600px (validator).

## Known gaps (not silently skipped)

* XHTML (`.xht`, most of CSS2): browsers parse it as XML, and so does the harness since port step
  08 (pipeline step 3, vellora-core's fidelity-only XML parse). This bullet used to say vellora
  parsed it as HTML; that was wrong before step 08 too: blitz-html parsed 5899 of the 5906 `.xht`
  nodes as XML because of their doctype, prolog or root `xmlns`, and the other 7 (`<!DOCTYPE
  html>` first) as HTML. `xhtmlHazards` still flags the constructs whose meaning the HTML parse
  would change (CDATA, self-closing non-void elements, PIs).
* Document mode: Blitz styles and lays out every document in no-quirks mode (blitz-dom 0.3.0-beta.4
  `document.rs` `Stylist::new(.., QuirksMode::NoQuirks)`, `stylo.rs` `TDocument::quirks_mode`),
  although html5ever reports limited-quirks for an XHTML 1.0 Transitional doctype and quirks
  without a doctype, as Chrome does. Tests that rely on a quirk (e.g. the line height calculation
  quirk) cannot match Chrome there (`crates/vellora-core/tests/html_parse.rs`).
* Screen reftests are paginated at 600px: content below goes to page 2 and is not compared, and
  fragmentation can move content that a continuous viewport would not. HYPOTHESIS: small effect,
  since most reftests fit in 800x600 (validator: 111 of 6905 evaluated screen tests spill; obs. 9).
* CSS `url()` resources other than `@font-face` (backgrounds, list-style images, `@import` inside
  inline `<style>`) are never supplied: vellora has no channel for them. Tests that use them carry
  `cssUrlResources` and, when they pass, the `css-url-resource` flag.
* Glyph coverage: only vellora's bundled faces, Ahem and TTF/OTF `@font-face` files are available.
  Text in scripts none of them covers (CJK, Thai, Ethiopic, …) is flagged `uncovered-glyphs`;
  no pinned font set is supplied yet (DESIGN TARGET).
* A pass is evidence of equality, not of correctness: see "Suspect-pass flags". `pass-blank` removes
  the blank case from the pass count; flagged non-blank passes are still counted in `pass` and are
  reported separately as `passFlagged` / `passClean`. The ink flags need `--chrome`.
* WOFF/WOFF2 web fonts are not supplied (`skippedFonts`: 289 tests); `@font-face` aliasing is not
  emulated (`fontAliasMismatch`: 10 tests).
* `.sub.` (wptserve substitution) tests are skipped; `<meta name=variant>` is not expanded; scripts
  never run in vellora (the strict gate rejects `<script>`).
* The Chrome oracle prints rather than screenshots; 506 tests fail in both engines and are
  reported as inconclusive rather than blamed on either. 2 tests make Chrome's printToPDF fail.
* Upstream comparisons cross WPT revisions (`8eaad6beb` for the pin, `cd1d8aa5b` for beta.4 vs
  our `9d8aceec0`) — fetch those revisions with `fetch-wpt.mjs --commit` for a same-revision run.
* DESIGN TARGET, not done: a pinned Linux CI job (Chrome for Testing via `install-chrome.mjs`,
  poppler version pinned in the image) producing the authoritative expectations file.
