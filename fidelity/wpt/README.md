# fidelity/wpt — WPT reftests over vellora's native pipeline

Third-party conformance oracle for the native renderer: [web-platform-tests](https://github.com/web-platform-tests/wpt)
reftests rendered **test and reference both** through vellora's real public pipeline
(`renderPdf(html, undefined, { strict: true, fonts, images, baseUrl })` with the built napi addon),
rasterized with poppler and compared with WPT's own pixel rules. An optional Chrome print oracle runs
the same tests through Chrome with the same geometry, rasterizer and comparator, so "Chrome fails
too" is distinguishable from vellora-only failures. Phase A scope: measurement only; nothing here
changes vellora's output (the runner only calls the public API).

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
`--artifacts fail|all|none`, `--keep-pdf`, `--label <provenance note>`.

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
| `ratchet.json` | comparison against the expectations file (when present) |
| `artifacts/<test>/` | for failures: `lhs-pN.png`, `rhs-pN.png`, `diff-pN.png` (differing pixels red), `comparison.json`; PDFs with `--keep-pdf` |
| `chrome-artifacts/<test>/` | the same for the Chrome oracle |

Per-test record: `test`, `suite`, `mode` (`screen`/`print`), `outcome`, `node` (`test`/`ref`, which node
was not evaluable), `cause` (`feature`/`line`/`col` for unsupported, `kind`/`message` for errors,
`reason` for skips), `comparisons` (`lhs`, `rhs`, `relation`, `pass`, `maxDifference`,
`totalPixels`, `fuzzy`, `firstDiffPage`, `pageCounts`, `pageCountMismatch`, `sizeMismatch`),
`blank`, `pageCount` (print), `prepare` (what the harness supplied/changed, below), `renderMs`,
`rasterMs`, `durationMs`, `chrome` (Chrome oracle outcome/comparisons), `upstream` (Blitz's own status).

### Outcomes

| outcome | meaning |
|---|---|
| `pass` | WPT pass rule satisfied (`blank: true` marks a pass where every compared test page is pure white; `summary.totals.passBlank` counts them) |
| `fail` | rendered fine, comparison failed |
| `unsupported` | the strict gate rejected the test or a reference (`VelloraUnsupportedError`; `cause.feature` is the core's feature id, `node` says which) |
| `error` | `cause.kind`: `panic` (Rust panic surfaced as a rejection), `render`, `input`, `template` (`renderPdf` always runs the templating engine; `{{`/`{%` in a test would throw — an input-contract artifact, not layout; 0 occurrences on the current pin), `conformance`, `crash` (worker process died: abort/stack overflow), `raster`, `metadata`, `harness`, `chrome` |
| `timeout` | the worker exceeded the per-test budget (default 30 s, ×6 for `<meta name=timeout content=long>`) and was SIGKILLed |
| `skip` | the harness cannot run it: `non-utf8`, `needs-wptserve-substitution` (`.sub.` files), `missing-file` (reference outside the sparse checkout / not in the tree), `reference-outside-wpt-tree` |

Files that are not reftests are never run but always counted (`summary.totals.notRun`):
`testharness` (testharness.js), `css-manual` (CSSWG `flags` with `paged`, `interact`, …),
`manual`, `visual`, `crashtest`. Support files are excluded.

Pass rates: `passRate = pass / reftests` and `passRateEvaluated = pass / (pass + fail)` (what vellora
renders correctly among the tests it accepts). Both are always reported.

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
  `fetch-wpt.mjs --commit <sha> --dir <dir>` + `run.mjs --wpt <dir>` for a same-revision comparison.
* **Suites** (`suites.mjs`, each with a one-line reason): the CSS 2.1 directories that exercise
  document layout — normal-flow, margin-padding-clear, box, box-display, visudet, visuren, linebox,
  text, fonts, tables, borders, backgrounds, colors, lists, generated-content, floats,
  floats-clear, positioning, abspos, visufx, pagination — plus `css/css-tables`, `css/css-break`,
  `css/css-page`, `css/css-text`. Excluded with reasons in `EXCLUDED_SUITES`: parser/cascade
  directories owned by Stylo (selectors, cascade, syntax, values, sec5), `@import`, bidi/i18n, UI,
  media queries, stacking order, legacy css1, and directories with no reftests at this commit.

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
   * **UA page box**. Screen reftests: `@page { size: 800px 600px; margin: 0 }` (the 800x600 WPT
     reftest viewport) injected as the *first* `@page` — vellora reads only the first `@page` block
     (`page_css::extract_at_page_block`), and `page_css::length_px` accepts `px` (CONFIRMED by
     reading the source and by `pdfinfo` showing `600 x 450 pts`). Print reftests: the WPT print
     default (`docs/writing-tests/print-reftests.md` at the pinned commit: 5in x 3in, 0.5in margins)
     is merged at the *start* of the document's first `@page` block, so author declarations still
     win; with no author `@page` a new block is injected (`pageInjection`). The `<style>` goes right
     after `<head>` (else `<html>`, else the doctype) — never between the doctype and an explicit
     `<html>` (observation 1).
3. **Render** with `renderPdf(..., { strict: true, ... })` in a forked worker process (one test at a
   time per worker; a timeout or native crash kills only that worker and is attributed to the test).
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
  (`docs/writing-tests/reftests.md`). wptrunner's DFS implementation ORs every alternative instead;
  the documented rule is used and the difference only matters for nodes mixing both kinds.
* Chained references: when a `match` passes and the reference has its own references, evaluation
  continues from that reference (wptrunner `RefTestImplementation.run_test`), cycle-safe, depth ≤ 8.
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

`expectations/<engine-id>.json` (`engine-id` = `blitz-<first 12 of the blitz-dom rev in Cargo.lock>`,
or `blitz-<version>` for a crates.io Blitz) maps each reftest path to its outcome, with the vellora
commit, WPT commit, date and command that produced it. Every run compares against the file for its
own engine (`--expectations auto`) or a given file (`--expectations <file>`, e.g. the pre-bump
baseline when measuring a Blitz bump) and writes `ratchet.json` with **regressions** (expected `pass`
→ anything else), **improvements** (non-pass → `pass`), `changed` (non-pass → other non-pass),
`added`, `missing`. The process exits 1 when there is at least one regression. Regenerate
intentionally with `--update-expectations` (never automatic) and commit the diff with the reason.
Local macOS runs are indicative; the authoritative baseline should come from the pinned Linux CI
run (DESIGN TARGET).

RESULTS_PLACEHOLDER
