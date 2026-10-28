---
title: "Word by word against Chrome: measuring vellora's native PDFs"
description: How vellora moved its browserless renderer to Blitz 0.3.0-beta.4, built the measurement oracles first, compensated the Blitz layout bugs it found, turned on float layout that the published package never compiled, laid out multi-column, ruby and inline SVG itself, and measured every word and every dashed border against Chrome.
---

# Word by word against Chrome: measuring vellora's native PDFs

<!-- fidelity-evidence:status -->
::: tip PASS
**This run passes the strict merge gate (verdict PASS, --contract). The branch is not merged or released yet:** it is to be merged in vellora vX.Y.Z (placeholder; the release sets the version). INDICATIVE: local macOS measurement. The authoritative run is pinned Linux CI, which is not wired yet; these numbers will be regenerated from it when it runs. The released package is vellora@0.2.0.
:::
<!-- /fidelity-evidence:status -->

vellora renders generated document HTML (invoices, receipts, boletos, notices) to PDF inside the
Node.js process, with no browser. The obvious question about a renderer like that is how far its
output lands from what Chrome prints for the same HTML. This post answers it with measurements. It
also covers the work that moved the numbers, and the parts that are still open.

<!-- fidelity-evidence:hero -->
![DANFE (NF-e invoice), page 1, side by side: Chrome for Testing 155.0.8059.85 (reference), vellora 0.2.0 (published), vellora (unreleased branch). Synthetic document data.](/assets/fidelity/danfe-p1.jpg)

<sub>DANFE (NF-e invoice), page 1. Left to right: Chrome for Testing 155.0.8059.85 (reference), vellora 0.2.0 (published), vellora (unreleased branch). Median word-position error 17.68 mm → 0.21 mm; words within 1 mm 8.9% → 100.0%; pages 2 → 1 (Chrome: 1). Synthetic data.</sub>
<!-- /fidelity-evidence:hero -->

## The short version

<!-- fidelity-evidence:headline -->
- **8 of 9 fixtures** have every word within 1 mm of its position in Chrome for Testing 155.0.8059.85's PDF (share of word positions within 1 mm = 100%). vellora 0.2.0 (published): 0 of 9.
- **0.21 mm or less** median word-position error on every one of the 9 fixtures (largest: danfe). vellora 0.2.0 (published): up to 106.22 mm (text-stress-ptbr).
- **9 of 9 fixtures** print the same number of pages as Chrome. vellora 0.2.0 (published): 6 of 9.
<!-- /fidelity-evidence:headline -->

"Before" is always the published package, vellora 0.2.0, which is what `npm install vellora`
gives you today. "After" is a branch that passes its merge gate on the run measured here, and that
has not been merged or released yet.

## Measure first, then change the engine

A screenshot that looks right proves little. Two PDFs can look the same at thumbnail size while a
table sits a few millimetres lower on every page, and a pixel diff mixes layout errors with
anti-aliasing and font hinting. So before changing the engine, we built the instruments:

- **A word-position oracle.** It extracts every word from both PDFs, pairs each word with the same
  word in Chrome's PDF, and reports the distance in millimetres. It also reports the share of
  Chrome's words that land within 1 mm, and the page counts. A word that vellora does not print
  counts as a miss.
- **A pinned reference.** Chrome for Testing at a fixed version, headless print-to-PDF, mapped to
  the same bundled font files vellora uses. The reference does not move between runs.
- **A per-box layout diff.** It compares Chrome's layout tree with raw Blitz and with each vellora
  layout pass, so a position error can be traced to the layer that introduced it.
- **WPT reftests.** The CSS reftests the harness runs, printed to PDF and compared with the
  reference page.
- **A gate.** Every step is compared with the previous one and with the published package. A
  ledger records known differences with a ceiling that may only go down. Each oracle has canaries:
  planted bugs that it must catch.

The rest of the work was judged by these instruments, not by eye.

## Blitz 0.3.0-beta.4, from crates.io

vellora lays out HTML with [Blitz](https://github.com/DioxusLabs/blitz), and the published package
uses a git revision of Blitz's 0.3.0-alpha.5 line. The branch moves to the 0.3.0-beta.4 release
from crates.io, with no fork, and ports vellora's own layout layers to it. All Blitz access stays
behind one module of vellora, so an upstream change is contained in one file.

The upgrade alone did not fix boleto or notification: the committed snapshot of that step
([`tip-10-integration.doc-aggregate.json`](https://github.com/diomalta/vellora/blob/main/fidelity/gate/snapshots/2026-10-27/02-doc-oracle/tip-10-integration.doc-aggregate.json))
shows both below the published package. The layout diff showed why.

## The bug: bordered collapsed tables grew row by row

On documents with bordered `border-collapse: collapse` tables, the error grew down the page.
Boletos, the DANFE and the long text fixture were the worst. The layout diff pointed at table rows
and nothing else: text and line boxes matched, and every height error was in a table.

A minimal repro confirmed it. In Blitz 0.3.0-beta.4, a collapsed-border cell is measured with its
own full borders, and then the collapsed border is added again as the grid gap. Each row comes out
taller than Chrome's by twice the border width, and every table adds its rows' error to everything
below it. The cause is in `blitz-dom`'s table layout (`layout/table.rs`). The repro and the source analysis are in
[`fidelity/upstream-drafts/blitz-collapsed-cell-border-measure`](https://github.com/diomalta/vellora/tree/main/fidelity/upstream-drafts/blitz-collapsed-cell-border-measure),
written up as an upstream report that has not been filed yet.

vellora now compensates for the bug. The compensation never edits your HTML (strict mode still
passes it through unchanged). After the CSS cascade and before layout, it changes the computed
style of each bordered collapsed table to the separated border model, which Blitz lays out the
same way Chrome does. It gives the table and each cell a whole-pixel share of every resolved edge.
Conflicting borders are resolved by the rules of CSS 2.1 §17.6.2.1. Each edge is then painted
once, at full width, over its grid line.

It is a workaround, and the code says so. The comment on `compensate_collapsed_borders`
(`crates/vellora-core/src/blitz_engine.rs`) lists every function to delete when Blitz fixes the
bug. A canary test renders the repro through raw Blitz and fails as soon as Blitz stops producing
the extra height, so nobody has to remember to check.

The same rule covers the smaller compensations that followed. One example: Chrome lays boxes out
in fixed-point units of 1/64 px (LayoutUnit), and Blitz lays them out in floating point, so a long
document drifts by fractions of a pixel per row. vellora now rounds those lengths the way Chrome
does. Each compensation has a code comment that names the crate version and the source lines, and
a raw-Blitz canary test (`crates/vellora-core/src/raw_blitz_tests.rs`) that fails once Blitz
changes the behaviour.

## Floats were never laid out

Not every difference was a Blitz bug. Blitz's float layout is an opt-in cargo feature:
`floats = ["taffy/float_layout", "stylo_taffy/floats"]` in `blitz-dom`'s `Cargo.toml`, and it is
not in the default feature list. vellora 0.2.0 depends on Blitz git revision 2003ba5 with
`default-features = false` and no extra features. Blitz's float code was therefore never
compiled, and every `float: left` or `float: right` box was laid out as an ordinary in-flow
block. The step that found this is recorded in
[`fidelity/gate/snapshots/2026-10-28/c04/floats/README.md`](https://github.com/diomalta/vellora/blob/main/fidelity/gate/snapshots/2026-10-28/c04/floats/README.md).

The branch turns the feature on. That is a crates.io feature switch, not a fork. It also exposed
two bugs in the crates.io stack. One is in Taffy's fit test for a box placed next to a float. The
other is in where Blitz places a float on a line that cannot wrap. Both are compensated, with
canaries. Where engines disagree about a float on a no-wrap line, vellora follows Chrome.

None of the nine document fixtures uses a float, so their numbers do not change because of this.
WPT does change. Some of the published package's float "passes" were false: the test and its
reference page lost their floats the same way and matched by accident. The merge gate classifies
such a pass as an artefact (class a) only when there is evidence for it.

Not every lost pass was an artefact. Four float and line-box tests that the published package
passed were lost earlier, with the move to Blitz 0.3.0-beta.4, before the float feature was
turned on, and raw Blitz 0.3.0-beta.4 fails all four. Three are now fixed by rendering. Each fix
is a compensation whose comment names the Blitz or Taffy source lines, with a raw-Blitz canary:

- a float that does not fit beside its line's text is placed below the line, as in Chrome
  (`floats-placement-vertical-003`);
- a negative margin next to a zero-width float is applied the way Chrome applies it
  (`zero-width-floats`);
- an inline-block is aligned on its last line box, not its first
  (`baseline-block-with-overflow-001`).

The fourth, `flex-fragmented-with-float-descendant-001`, now passes its reftest, but the harness
flags the pass, because vellora's ink lands away from Chrome's (see "Multi-column gaps" below). It
stays in the debt ledger, and the gate lists it under "What is not done".

## What word positions cannot see

The word-position oracle reads text. A PDF can place every word exactly and still differ from
Chrome's in paint. Three paint gaps were found by looking at the pages, and all three were in
vellora's own painter, not in Blitz:

- **The page canvas.** A background colour on `html` or `body` was never painted. Chrome fills the
  page area of every page with it. vellora now does too, and `@page { background }` covers the
  whole page box, as in Chrome.
- **Dashed and dotted borders** were drawn solid. They are now drawn as segments, with dash
  lengths and gaps fitted to each side the way Chrome fits them.
- **Text decorations** (`text-decoration`: link underlines, overlines, line-through) were not
  drawn at all. They are now drawn on the decorating box's baseline, with Chrome's thickness rule.

A report-only paint probe now counts these in both PDFs. No gate rule reads it. A count equal to
Chrome's shows that the segments exist. It does not show that each one sits exactly where Chrome
puts it.

<!-- fidelity-evidence:paint -->
Vector paint read from each PDF (PyMuPDF get_drawings and text spans): dashed/dotted border segments, text-decoration underlines, and whether the page canvas colour matches Chrome's. Report-only: no gate rule reads it. Each cell reads vellora 0.2.0 (published) → vellora (unreleased branch). Both are probed against this run's Chrome PDFs (the published package's PDFs through `paint-probe.mjs --subject`; the generator checks that Chrome's side of both probes agrees).

| Fixture | Dashed/dotted border segments, vellora / Chrome | Underlines, vellora / Chrome | Pages whose canvas colour differs from Chrome's | Probe flags |
|---|---:|---:|---:|---:|
| Boleto (bank slip) (`boleto`) | 0 / 135 → 135 / 135 | 0 / 0 → 0 / 0 | none → none | dashes-missing → none |
| Boleto, FEBRABAN layout (`boleto-febraban`) | 0 / 152 → 152 / 152 | 0 / 0 → 0 / 0 | none → none | dashes-missing → none |
| DANFE (NF-e invoice) (`danfe`) | 0 / 2,052 → 2,111 / 2,052 (59 more than Chrome) | 0 / 0 → 0 / 0 | none → none | dashes-missing → none |
| Postmark receipt (OSS template) (`oss-postmark-receipt`) | 0 / 136 → 136 / 136 | 0 / 5 → 5 / 5 | pages 1, 2 → none | canvas, dashes-missing, underlines-missing → none |

The other 5 fixtures have no dashed borders, underlines or canvas colour in either PDF. A count equal to Chrome's says the segments exist, not that each one sits where Chrome's does. Method: fidelity/oracles/py/paint.py (PyMuPDF get_drawings + text spans; docstring); pymupdf 1.28.2.
<!-- /fidelity-evidence:paint -->

On the DANFE, vellora draws more dash segments than Chrome. Our working explanation, not yet
measured, is that the collapsed-border compensation extends each cell's horizontal edge across the
column lines, so the end dash of one cell overlaps the first dash of the next.

## Multi-column, ruby and inline SVG, laid out by vellora

Blitz 0.3.0-beta.4 and its layout engine, Taffy 0.15.0, have no multi-column layout and no ruby
layout. Stylo computes `column-count` and `column-width`, and nothing reads them, so a
`columns: 2` box was laid out as one column. Ruby annotations were printed inline, after their
base text. The branch lays out both in vellora, behind the same single Blitz module, following
Chrome's print output. A canary fails once Blitz lays multicol out itself.

The first multi-column step also lost some fragmentation tests that passed before. In those tests,
the one-column layout happened to produce the same picture as Chrome. With real columns, other
gaps showed. The next step fixed each of them by rendering, not by declaring them out of scope:

- **Inline SVG is drawn.** The strict gate accepted inline `<svg>` but drew nothing for it. Blitz
  now lays it out as a replaced box, and vellora draws it as PDF vector content (krilla-svg).
  Shapes, paths, gradients, clipping, masks and transforms are vectors, and `<text>` is selectable
  text set in the bundled fonts or the `fonts` option's faces. SVG filters are drawn as images.
- **Table captions and anonymous table boxes.** Blitz drops a table's captions and every child of
  a table or row that is not a row or a cell. vellora now builds the boxes that CSS 2.2 §17.2.1 and §17.4
  calls for before layout.
- **Forced column breaks** are taken in document order, so several forced breaks at one vertical
  position each start a new column.
- **Ruby layout.** Each annotation sits over its base, on the base's em box, as in Chrome.

Drawing SVG exposed one more bug in vellora's own painter. It drew every image of a page after
every background, so a later positioned box never covered an image. Images are now painted in
their CSS painting-order layer (CSS 2.2 Appendix E). Five WPT tests had passed only because the
SVG they draw was not drawn at all, and they pass again with the fix.

What this costs, and what is still missing:

- **A bigger addon.** The dependency graph now holds two versions of usvg, Blitz's for layout and
  krilla-svg's for drawing. The release notes for inline SVG
  ([`.changeset/inline-svg-native.md`](https://github.com/diomalta/vellora/blob/main/.changeset/inline-svg-native.md))
  record the size of the macOS arm64 addon before and after, measured on a local build. It is
  the main cost of inline SVG support.
- **No host fonts in SVG layout.** Blitz's own SVG parse loads the host's font list, and for an
  SVG without a `viewBox` it can size the box from the SVG's `<text>`, measured in host fonts. So
  the same document could lay out differently on two machines. vellora's render path no longer
  runs that parse. It sizes each inline `<svg>` from its own `width`, `height`, `viewBox` and
  `preserveAspectRatio` attributes and its CSS, never from its content, as Chrome does. Its
  `<text>` is set only in the bundled fonts and the `fonts` option's faces. One sizing case of a
  `viewBox`-less SVG with a percentage height is not modelled yet;
  [COMPATIBILITY.md](https://github.com/diomalta/vellora/blob/main/COMPATIBILITY.md) describes it.
- **Ruby adds an element.** vellora wraps each ruby base in a `vellora-ruby-base` element before
  the cascade. Your HTML is not changed, but a selector such as `ruby > b` no longer matches a
  `<b>` inside a base. How often that matters in real documents has not been measured. Ruby
  overhang, `ruby-align`, `ruby-position: under`, `<rtc>` and nested ruby are not implemented.
- **Multi-column gaps.** `column-span: all` and `column-rule` are not implemented, and neither is
  a multi-column box inside another one. A multi-column box longer than one page is cut across
  all its columns at once, and columns that do not fit are not moved to the next page. Chrome's
  print moves them; vellora lays them out side by side on the first page, the way Chrome lays
  them out on screen. That is why `flex-fragmented-with-float-descendant-001` is flagged. The
  harness compares only page 1 of this screen-mode test, and there vellora's ink covers more
  columns than Chrome's. vellora also does not paint `outline`, which that test uses.
  One fragmentation test that the columns exposed, with a float beside a line
  (`widows-orphans-021`), still fails. It failed in the published package too.

## Results

<!-- fidelity-evidence:charts -->
![Median word-position error per fixture, vellora 0.2.0 (published) vs vellora (unreleased branch), log scale](/assets/fidelity/median-mm.svg)

![Share of words within 1 mm of Chrome per fixture, vellora 0.2.0 (published) vs vellora (unreleased branch)](/assets/fidelity/within-1mm.svg)
<!-- /fidelity-evidence:charts -->

<!-- fidelity-evidence:table -->
Each cell reads vellora 0.2.0 (published) → vellora (unreleased branch). Reference: Chrome for Testing 155.0.8059.85.

| Fixture | Chrome words | Median error (mm) | p90 error (mm) | Words within 1 mm | Chrome words unpaired | Pages: 0.2.0 / branch / Chrome |
|---|---:|---:|---:|---:|---:|---:|
| Invoice (`invoice`) | 541 | 1.46 → 0.10 | 1.73 → 0.28 | 36.0% → 100.0% | 0 → 0 | 3 / 3 / 3 |
| Receipt (`receipt`) | 151 | 5.18 → 0.05 | 77.00 → 0.11 | 7.9% → 100.0% | 0 → 0 | 2 / 2 / 2 |
| Boleto (bank slip) (`boleto`) | 297 | 1.77 → 0.12 | 14.09 → 0.20 | 32.0% → 100.0% | 0 → 0 | 1 / 1 / 1 |
| Boleto, FEBRABAN layout (`boleto-febraban`) | 315 | 80.70 → 0.08 | 82.32 → 0.28 | 15.6% → 100.0% | 8 → 0 | 1 / 1 / 1 |
| DANFE (NF-e invoice) (`danfe`) | 630 | 17.68 → 0.21 | 37.17 → 0.27 | 8.9% → 100.0% | 1 → 0 | 2 / 1 / 1 |
| Notification letter (`notification`) | 248 | 0.41 → 0.01 | 1.02 → 0.09 | 86.7% → 100.0% | 4 → 0 | 1 / 1 / 1 |
| Long pt-BR text (stress) (`text-stress-ptbr`) | 1,833 | 106.22 → 0.02 | 221.05 → 0.27 | 1.4% → 100.0% | 7 → 0 | 8 / 7 / 7 |
| Postmark receipt (OSS template) (`oss-postmark-receipt`) | 180 | 0.66 → 0.13 | 18.19 → 0.14 | 40.0% → 97.2% | 39 → 2 | 1 / 2 / 2 |
| Sparksuite simple invoice (OSS template) (`oss-sparksuite-invoice`) | 46 | 9.87 → 0.00 | 10.95 → 0.00 | 0.0% → 100.0% | 0 → 0 | 1 / 1 / 1 |
<!-- /fidelity-evidence:table -->

## What is not done

<!-- fidelity-evidence:losses -->
- **oss-postmark-receipt: 97.2% of words within 1 mm** (vellora 0.2.0 (published): 40.0%); p90 error 0.14 mm.
- **WPT:** 4,553 of 8,047 reftests pass (56.58%); 4,028 (50.06%) pass without any suspect-pass flag. 2,608 still fail and 877 are rejected as outside the strict subset.
- **Merge gate: verdict PASS** on this run (strict contract, --contract), 0 gating items. Every condition is met. What each condition still lets through is listed with it.
  - (1) pin view (--main): no item worse than the published package unless the gate classifies it (class a: the old pass was false; class b: carried in the debt ledger): **met**. Passed with the published engine and not matched on the branch: 6 WPT tests. Class a (the old pass was false, or Chrome fails it too): `css/CSS2/floats/float-nowrap-8.html`, `css/css-page/page-name-flex-001-print.html`, `css/css-page/page-name-flex-002-print.html`, `css/css-page/page-name-flex-004-print.html`, `css/css-text/hanging-punctuation/hanging-punctuation-first-002.html`. Class b (recorded in the debt ledger, not fixed): pass on the branch with a suspect-pass flag, which the gate scores as worse than the published package's clean pass: `css/css-break/flexbox/flex-fragmented-with-float-descendant-001.html` (flag `ink-displaced-vs-chrome`; raw Blitz: fail). 10 tests that failed before are now rejected by the strict subset.
  - (2) every fixture's median error and share within 1 mm at least as good as the published package's: **met**.
  - (3) every fixture's page count equal to Chrome's: **met**.
  - (4) step-to-step ratchet: no regression against the previous gated step, and the head view (against the chain's first step) passes: **met**. Head view: PASS; 1 test carried in the debt ledger (`css/css-break/flexbox/flex-fragmented-with-float-descendant-001.html`); 5 items accepted as class a, with the evidence in the acceptance file.
<!-- /fidelity-evidence:losses -->

The postmark receipt's missing words are a known pair. Chrome's PDF draws the masthead text twice,
because of a `text-shadow` copy, and vellora draws no text shadow. The gate records that pair as
an oracle artefact.

## WPT: coverage, not a score

<!-- fidelity-evidence:wpt-chart -->
![WPT reftests passed: vellora 0.2.0 (published) engine, vellora (unreleased branch), Chrome reference](/assets/fidelity/wpt-pass-rate.svg)
<!-- /fidelity-evidence:wpt-chart -->

<!-- fidelity-evidence:wpt -->
WPT reftests passed through the vellora pipeline, printed to PDF and compared with the reference page: coverage of the CSS test subset the harness runs, not a document-quality score.

| | Blitz 0.3.0-alpha.5 engine of vellora 0.2.0 (baseline commit with layout instrumentation) | vellora (unreleased branch) (Blitz 0.3.0-beta.4, crates.io) | Chrome/155.0.8059.85 through the same harness |
|---|---:|---:|---:|
| Reftests | 8,047 | 8,047 | 8,046 |
| Pass | 2,578 (32.04%) | 4,553 (56.58%) | 7,258 (90.21%) |
| Pass without suspect-pass flags | 1,988 (24.70%) | 4,028 (50.06%) | 7,258 (90.21%) |
| Unsupported (rejected by the strict subset) | 869 | 877 | 0 |

Commits: 2c66544 (2026-10-21T05:41:54Z), aa41259 (2026-10-28T11:07:50Z); WPT `9d8aceec`. Chrome's outcomes were reused from an earlier run with the same WPT commit and comparison settings (--chrome-from). The 0.2.0 column was measured on a baseline commit that adds layout instrumentation to the 0.2.0 engine; its render-path equivalence to the tag is not separately verified.
<!-- /fidelity-evidence:wpt -->

The WPT number shows how much of the CSS test subset now renders the way the reference page does.
Many of those tests exercise features no invoice uses. Others are rejected on purpose by vellora's
strict subset. Read it as coverage. The document fixtures above are the measure of document output.

## Why it is not released yet

The branch merges only when a strict oracle contract passes on one gated run. Four conditions
must all hold:

1. No measured item may be worse than in the published package unless the gate classifies it with
   evidence. Class a means the old pass was false. Class b means it is carried in the debt
   ledger, whose entries name a Blitz cause and have a ceiling that may only go down.
2. Every fixture's median error and share within 1 mm must be at least as good as the published
   package's.
3. Every fixture's page count must equal Chrome's.
4. The step-to-step ratchet must pass.

The run measured here passes all four. The gate's own list of what it still lets through is under
"What is not done" above.

One test that the published package passed is still open: `flex-fragmented-with-float-descendant-001`.
It passes on the branch with a suspect-pass flag, and the gate counts it as class b because it is
still a debt-ledger key. That ledger entry was written when raw Blitz and the product failed the
test the same way. They no longer do: the product now passes and raw Blitz still fails. The
remaining gap points at vellora's own multi-column layer. Whether this one may merge as recorded debt,
or must be fixed first, is still under review. If it is fixed first, this page is rebuilt from
that run.

Passing the gate is not a release. The branch still goes through review
and merge, and then a release, which will set the version in the status note at the top. The
numbers are local macOS measurements. The authoritative run is pinned Linux CI, which does not
run the harness yet. When it does, this page is rebuilt from that run by the same generator.

## Reproduce it

Every table, chart, list of results and status note above is generated from one manifest by a
committed script, and the prose carries no measured value of its own. The method, the full commands and the environment are in
[Measured fidelity](/guide/fidelity#measured-fidelity).

<!-- fidelity-evidence:env -->
- Status: **PASS** (gate report verdict PASS (--contract)). INDICATIVE: local macOS measurement. The authoritative run is pinned Linux CI, which is not wired yet; these numbers will be regenerated from it when it runs.
- Reference: Google Chrome for Testing 155.0.8059.85, headless print-to-PDF (fidelity/lib/chrome-reference.mjs).
- Before: vellora 0.2.0 (published), tag `v0.2.0`, commit `5810062`, Blitz 0.3.0-alpha.5 line, git 2003ba5. Scored 2026-10-27T22:36:58.971Z.
- After: vellora (unreleased branch) `phasec/07-tip`, commit `aa41259`, Blitz 0.3.0-beta.4, crates.io. Run `20261028T110750Z` (2026-10-28T11:07:50Z).
- Environment: darwin 27.0.0 arm64 (macOS 27.0.1), Apple M5 Pro, Node v22.23.2, rustc 1.96.0 (ac68faa20 2026-05-25), PyMuPDF 1.28.2, pdftoppm version 26.06.0.
- Word positions: fidelity/oracles/py/words.py (PyMuPDF rawdict: pen origin x, baseline y); pairing: k-th occurrence of a text key in reading order (page, baseline, x) ↔ k-th in Chrome's; quantiles: nearest rank over paired words (ceil(q*n)-th smallest).
- Run command: `node fidelity/run-all.mjs --gate --main --contract --raw --chrome '<repo>/fidelity/.cache/chrome/chrome/mac_arm-155.0.8059.85/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing' --baseline fidelity/baselines/port/11-phase-c --chrome-from ~/Repositories/vellora-fidelity-runs/run-all-10-tip-20261023T004536Z-blitz-0.3.0-beta.4-vellora-a293cf5/wpt/results.json --tools-image vellora-fidelity-tools:baseline-beta4 --accept fidelity/gate/snapshots/2026-10-28/c07/accepted.json --step 16-phase-c-07-tip --out fidelity/results/run-all/c07-tip`
- Gate: `node fidelity/gate/run.mjs --baseline fidelity/baselines/port/11-phase-c --run ~/Repositories/vellora-fidelity-runs/run-all-c07-tip-20261028T110750Z-blitz-0.3.0-beta.4-vellora-aa41259 --head fidelity/baselines/port/00-start --pin fidelity/baselines/pin --layout-from ~/Repositories/vellora-fidelity-runs/run-all-c07-tip-20261028T110750Z-blitz-0.3.0-beta.4-vellora-aa41259 --debt fidelity/baselines/port/DEBT.json --step 16-phase-c-07-tip --accept fidelity/gate/snapshots/2026-10-28/c07/accepted.json --doc-aggregate ~/Repositories/vellora-fidelity-runs/run-all-c07-tip-20261028T110750Z-blitz-0.3.0-beta.4-vellora-aa41259/doc-aggregate/summary.json --contract --out ~/Repositories/vellora-fidelity-runs/c07-tip/regate-contract` → PASS (2026-10-28T11:19:27.811Z).
- Paint probe (report-only): `node fidelity/oracles/paint-probe.mjs --run <repo>/fidelity/results/run-all/c07-tip --label run-all`; published package: `node fidelity/oracles/paint-probe.mjs --run ~/Repositories/vellora-fidelity-runs/run-all-c07-tip-20261028T110750Z-blitz-0.3.0-beta.4-vellora-aa41259 --subject ~/Repositories/vellora-fidelity-runs/doc-aggregate-20261027/pin-pdfs-v0.2.0 --label pin-v0.2.0 --out ~/Repositories/vellora-fidelity-runs/docs-c07/paint-probe-pin-v0.2.0.json`.
- Page images: `node fidelity/report/visual-compare.mjs --run <RUN> --pin-pdfs <doc-aggregate-pin.mjs --pdf-out dir> --out <compare dir> (pdftoppm -r 55), composed by fidelity/report/py/compose.py`
- This page: `node fidelity/report/build-site-evidence.mjs --compare ~/Repositories/vellora-fidelity-runs/docs-c07/visual-compare --run ~/Repositories/vellora-fidelity-runs/run-all-c07-tip-20261028T110750Z-blitz-0.3.0-beta.4-vellora-aa41259 --gate ~/Repositories/vellora-fidelity-runs/run-all-c07-tip-20261028T110750Z-blitz-0.3.0-beta.4-vellora-aa41259/gate-contract/gate-report.json --paint-before <repo>/fidelity/gate/snapshots/2026-10-28/c07-docs/paint-probe-pin-v0.2.0.json --pin-key pin --new-key c07 --update-docs`
- Raw values: [manifest.json](https://github.com/diomalta/vellora/blob/main/docs/assets/fidelity/manifest.json).
<!-- /fidelity-evidence:env -->

Two fixtures are adapted open-source templates:

<!-- fidelity-evidence:attribution -->
- Postmark receipt (OSS template) is adapted from [ActiveCampaign/postmark-templates](https://github.com/ActiveCampaign/postmark-templates) (commit `fa73527`), MIT licence, Copyright (c) 2015 Wildbit; see [NOTICE](https://github.com/diomalta/vellora/blob/main/fixtures/oss-postmark-receipt/NOTICE.md).
- Sparksuite simple invoice (OSS template) is adapted from [sparksuite/simple-html-invoice-template](https://github.com/sparksuite/simple-html-invoice-template) (commit `7d74fe3`), MIT licence, Copyright (c) 2021 Sparksuite; see [NOTICE](https://github.com/diomalta/vellora/blob/main/fixtures/oss-sparksuite-invoice/NOTICE.md).
<!-- /fidelity-evidence:attribution -->

If you have a document template that should fit vellora and does not, open an issue on
[GitHub](https://github.com/diomalta/vellora) with the smallest case that shows it.
