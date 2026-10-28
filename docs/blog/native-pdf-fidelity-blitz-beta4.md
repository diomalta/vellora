---
title: "Word by word against Chrome: measuring vellora's native PDFs"
description: How vellora moved its browserless renderer to Blitz 0.3.0-beta.4, built the measurement oracles first, found and compensated a table layout bug, and measured every word against Chrome.
draft: true
---

# Word by word against Chrome: measuring vellora's native PDFs

<!-- fidelity-evidence:status -->
::: warning DRAFT
**DRAFT. These results are from an unreleased branch that is not merged.** The merge is gated by a strict oracle contract, and this run does not pass it yet (gate report verdict FAIL: the strict merge contract is not met yet). INDICATIVE: local macOS measurement. Public numbers will be regenerated from the final gated run, and from Linux CI when available. The released package is vellora@0.2.0.
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

"Before" is always the published package, which is what `npm install vellora` gives you today.
"After" is a branch that has not been merged or released.

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
- **WPT:** 4,414 of 8,047 reftests pass (54.85%); 3,883 (48.25%) pass without any suspect-pass flag. 2,745 still fail and 877 are rejected as outside the strict subset.
- **Merge gate: verdict FAIL** on this run (strict contract, --contract), 6 gating items. The branch does not merge until every condition is met.
  - (1) pin view (--main): no item worse than the published package unless the gate classifies it (class a: the old pass was false; class b: provable Blitz debt): **NOT met**. 6 items worse than the published package that the gate cannot classify yet: `css/css-break/flexbox/multi-line-row-flex-fragmentation-045.html`, `css/css-break/ruby-003.html`, `css/css-break/svg-with-transform.html`, `css/css-break/table/caption-margin-002.html`, `css/css-break/table/caption-margin-005.html`, `css/css-break/table/monolithic-overflow-001.tentative.html`. Classified: 5 class a, 4 class b.
  - (2) every fixture's median error and share within 1 mm at least as good as the published package's: **met**.
  - (3) every fixture's page count equal to Chrome's: **met**.
  - (4) step-to-step ratchet: no regression against the previous gated step, and the head view (against the chain's first step) passes: **NOT met**. 5 regressions against the previous gated step: `css/css-break/flexbox/multi-line-row-flex-fragmentation-045.html`, `css/css-break/svg-with-transform.html`, `css/css-break/table/caption-margin-002.html`, `css/css-break/table/caption-margin-005.html`, `css/css-break/table/monolithic-overflow-001.tentative.html`. Head view: FAIL, 4 items (`css/css-break/svg-with-transform.html`, `css/css-break/table/caption-margin-002.html`, `css/css-break/table/caption-margin-005.html`, `css/css-break/table/monolithic-overflow-001.tentative.html`).
<!-- /fidelity-evidence:losses -->

There is also a smaller residual on the long text fixture. Its table rows are each a fraction of a
pixel taller than Chrome's. Part of that is confirmed: Chrome rounds lengths down to 1/64 px
(LayoutUnit), and Blitz does not. It stays inside 1 mm here, but the gate's step-to-step ratchet
still flags it, so it is the next measured step and not a footnote.

## WPT: coverage, not a score

<!-- fidelity-evidence:wpt-chart -->
![WPT reftests passed: vellora 0.2.0 (published) engine, vellora (unreleased branch), Chrome reference](/assets/fidelity/wpt-pass-rate.svg)
<!-- /fidelity-evidence:wpt-chart -->

<!-- fidelity-evidence:wpt -->
WPT reftests passed through the vellora pipeline, printed to PDF and compared with the reference page: coverage of the CSS test subset the harness runs, not a document-quality score.

| | Blitz 0.3.0-alpha.5 engine of vellora 0.2.0 (baseline commit with layout instrumentation) | vellora (unreleased branch) (Blitz 0.3.0-beta.4, crates.io) | Chrome/155.0.8059.85 through the same harness |
|---|---:|---:|---:|
| Reftests | 8,047 | 8,047 | 8,046 |
| Pass | 2,578 (32.04%) | 4,414 (54.85%) | 7,258 (90.21%) |
| Pass without suspect-pass flags | 1,988 (24.70%) | 3,883 (48.25%) | 7,258 (90.21%) |
| Unsupported (rejected by the strict subset) | 869 | 877 | 0 |

Commits: 2c66544 (2026-10-21T05:41:54Z), 16fa504 (2026-10-28T06:25:27Z); WPT `9d8aceec`. Chrome's outcomes were reused from an earlier run with the same WPT commit and comparison settings (--chrome-from). The 0.2.0 column was measured on a baseline commit that adds layout instrumentation to the 0.2.0 engine; its render-path equivalence to the tag is not separately verified.
<!-- /fidelity-evidence:wpt -->

The WPT number shows how much of the CSS test subset now renders the way the reference page does.
Many of those tests exercise features no invoice uses. Others are rejected on purpose by vellora's
strict subset. Read it as coverage. The document fixtures above are the measure of document output.

## Why it is not released yet

The branch merges only when a strict oracle contract passes on one gated run. Four conditions
must all hold. No measured item may be worse than in the published package unless the gate can
classify it, and such items must be fixed, not parked in the debt ledger. Every fixture's median error
and share within 1 mm must be at least as good as the published package's. Every fixture's page
count must equal Chrome's. The step-to-step ratchet must pass. This run does not pass yet, which is why every
number here is marked as a draft. When the contract passes, the same generator rebuilds this page
from that gated run, and from Linux CI once that runs the harness.

## Reproduce it

Everything above is generated from one manifest by a committed script. Prose like this paragraph
carries no measured value. The method, the full commands and the environment are in
[Measured fidelity](/guide/fidelity#measured-fidelity).

<!-- fidelity-evidence:env -->
- Status: **DRAFT** (gate report verdict FAIL: the strict merge contract is not met yet). INDICATIVE: local macOS measurement. Public numbers will be regenerated from the final gated run, and from Linux CI when available.
- Reference: Google Chrome for Testing 155.0.8059.85, headless print-to-PDF (fidelity/lib/chrome-reference.mjs).
- Before: vellora 0.2.0 (published), tag `v0.2.0`, commit `5810062`, Blitz 0.3.0-alpha.5 line, git 2003ba5. Scored 2026-10-27T22:36:58.971Z.
- After: vellora (unreleased branch) `phasec/05-tip`, commit `16fa504`, Blitz 0.3.0-beta.4, crates.io. Run `20261028T062527Z` (2026-10-28T06:25:27Z).
- Environment: darwin 27.0.0 arm64 (macOS 27.0.1), Apple M5 Pro, Node v22.23.2, rustc 1.96.0 (ac68faa20 2026-05-25), PyMuPDF 1.28.2, pdftoppm version 26.06.0.
- Word positions: fidelity/oracles/py/words.py (PyMuPDF rawdict: pen origin x, baseline y); pairing: k-th occurrence of a text key in reading order (page, baseline, x) ↔ k-th in Chrome's; quantiles: nearest rank over paired words (ceil(q*n)-th smallest).
- Run command: `node fidelity/run-all.mjs --gate --main --contract --raw --chrome '<repo>/fidelity/.cache/chrome/chrome/mac_arm-155.0.8059.85/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing' --baseline fidelity/baselines/port/10-integration --chrome-from ~/Repositories/vellora-fidelity-runs/run-all-10-tip-20261023T004536Z-blitz-0.3.0-beta.4-vellora-a293cf5/wpt/results.json --tools-image vellora-fidelity-tools:baseline-beta4 --accept fidelity/gate/snapshots/2026-10-28/c05/accepted.json --step 14-phase-c-05-tip --out fidelity/results/run-all/c05-tip`
- Gate: `node fidelity/gate/run.mjs --baseline fidelity/baselines/port/10-integration --run ~/Repositories/vellora-fidelity-runs/run-all-c05-tip-20261028T062527Z-blitz-0.3.0-beta.4-vellora-16fa504 --head fidelity/baselines/port/00-start --pin fidelity/baselines/pin --layout-from ~/Repositories/vellora-fidelity-runs/run-all-c05-tip-20261028T062527Z-blitz-0.3.0-beta.4-vellora-16fa504 --debt fidelity/baselines/port/DEBT.json --step 14-phase-c-05-tip --accept fidelity/gate/snapshots/2026-10-28/c05/accepted.json --doc-aggregate ~/Repositories/vellora-fidelity-runs/run-all-c05-tip-20261028T062527Z-blitz-0.3.0-beta.4-vellora-16fa504/doc-aggregate/summary.json --contract --out ~/Repositories/vellora-fidelity-runs/run-all-c05-tip-20261028T062527Z-blitz-0.3.0-beta.4-vellora-16fa504/gate-contract` → FAIL (2026-10-28T06:36:08.682Z).
- Paint probe (report-only): `node fidelity/oracles/paint-probe.mjs --run <repo>/fidelity/results/run-all/c05-tip --label run-all`; published package: `node fidelity/oracles/paint-probe.mjs --run ~/Repositories/vellora-fidelity-runs/run-all-c05-tip-20261028T062527Z-blitz-0.3.0-beta.4-vellora-16fa504 --subject ~/Repositories/vellora-fidelity-runs/doc-aggregate-20261027/pin-pdfs-v0.2.0 --label pin-v0.2.0 --out ~/Repositories/vellora-fidelity-runs/docs-c05/paint-probe-pin-v0.2.0.json`.
- Page images: `node fidelity/report/visual-compare.mjs --run <RUN> --pin-pdfs <doc-aggregate-pin.mjs --pdf-out dir> --out <compare dir> (pdftoppm -r 55), composed by fidelity/report/py/compose.py`
- This page: `node fidelity/report/build-site-evidence.mjs --compare ~/Repositories/vellora-fidelity-runs/docs-c05/visual-compare --run ~/Repositories/vellora-fidelity-runs/run-all-c05-tip-20261028T062527Z-blitz-0.3.0-beta.4-vellora-16fa504 --gate ~/Repositories/vellora-fidelity-runs/run-all-c05-tip-20261028T062527Z-blitz-0.3.0-beta.4-vellora-16fa504/gate-contract/gate-report.json --paint-before <repo>/fidelity/gate/snapshots/2026-10-28/c05-docs/paint-probe-pin-v0.2.0.json --pin-key pin --new-key c05 --update-docs`
- Raw values: [manifest.json](https://github.com/diomalta/vellora/blob/main/docs/assets/fidelity/manifest.json).
<!-- /fidelity-evidence:env -->

Two fixtures are adapted open-source templates:

<!-- fidelity-evidence:attribution -->
- Postmark receipt (OSS template) is adapted from [ActiveCampaign/postmark-templates](https://github.com/ActiveCampaign/postmark-templates) (commit `fa73527`), MIT licence, Copyright (c) 2015 Wildbit; see [NOTICE](https://github.com/diomalta/vellora/blob/main/fixtures/oss-postmark-receipt/NOTICE.md).
- Sparksuite simple invoice (OSS template) is adapted from [sparksuite/simple-html-invoice-template](https://github.com/sparksuite/simple-html-invoice-template) (commit `7d74fe3`), MIT licence, Copyright (c) 2021 Sparksuite; see [NOTICE](https://github.com/diomalta/vellora/blob/main/fixtures/oss-sparksuite-invoice/NOTICE.md).
<!-- /fidelity-evidence:attribution -->

If you have a document template that should fit vellora and does not, open an issue on
[GitHub](https://github.com/diomalta/vellora) with the smallest case that shows it.
