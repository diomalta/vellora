# Rendering fidelity and engine strategy

vellora's current renderer is native and in-process. It is designed for generated document HTML, not for arbitrary browser-page parity.

## What ships today

- `renderPdf()` uses the native `@vellora/native` addon by default.
- `renderPdf(..., ..., { engine: "chromium" })` is available through the optional `@vellora/engine-chromium` package.
- `renderPdf(..., ..., { engine: "auto", fidelity: { templateId } })` routes through a committed `vellora.fidelity.json` policy.
- The Chromium engine launches a Chromium/Chrome executable directly with headless print-to-PDF. It does not depend on Puppeteer or Playwright.
- The native default launches no Chromium, Puppeteer, Playwright, wkhtmltopdf, Python, Java, or sidecar service.
- Strict mode validates the documented HTML/CSS subset and rejects unsupported input with `VelloraUnsupportedError`.
- Native rendering is deterministic for identical inputs.

That means vellora can be a good fit when you control the template and can keep it inside the supported subset. It also means vellora is not a drop-in pixel-perfect replacement for every Puppeteer page.

## When to expect differences

Expect review work when a template depends on:

- JavaScript execution inside the document.
- Arbitrary browser CSS outside vellora's subset.
- Layout behavior tuned by eye against Chrome.
- Remote asset fetching during render.
- Browser-specific defaults, font fallback, or print behavior.

For migration work, keep your current browser-generated PDF as the reference until each template has been accepted.

## Measured fidelity

This section measures how close the native PDF lands to Chrome's print-to-PDF output for the same
HTML. It compares vellora 0.2.0, the previous release, with vellora 0.3.0. The 0.3.0 numbers were
measured on commit `aa41259`, whose `crates/`, `packages/`, `Cargo.toml` and `Cargo.lock` are
identical to the `v0.3.0` release commit `c40b3c2` (`git diff --stat aa41259 c40b3c2 -- crates
packages Cargo.toml Cargo.lock` is empty). Every number on this page is generated from one manifest,
[`docs/assets/fidelity/manifest.json`](https://github.com/diomalta/vellora/blob/main/docs/assets/fidelity/manifest.json).
The tables are rewritten by the generator, so they cannot drift from it.

<!-- fidelity-evidence:status -->
::: tip Released in vellora 0.3.0
The measured run passed the strict merge gate (verdict PASS, --contract). INDICATIVE: local macOS measurement. The authoritative run is pinned Linux CI, which is not wired yet; these numbers will be regenerated from it when it runs. Before is vellora@0.2.0, the previous release.
:::
<!-- /fidelity-evidence:status -->

### Methodology

- **Reference renderer.** Chrome for Testing, headless print-to-PDF, with the harness's single
  reference setup (`fidelity/lib/chrome-reference.mjs`). It maps the fixtures' font families to the
  same bundled Liberation font files vellora uses, and every fixture sets its own `@page` box.
  Chrome is the reference by definition: its own error is 0.
- **Inputs.** Both engines get the same `native.html` for each fixture, byte for byte. The manifest
  records that both sides were scored against the same Chrome word geometry (`sameChromeGeometry`).
- **Word positions.** PyMuPDF extracts every word of each PDF with its pen origin (x) and baseline
  (y). Text is normalised (NFC, ligatures folded, whitespace removed), and pages are stacked into
  one document coordinate.
- **Pairing.** The k-th occurrence of a word in reading order is paired with the k-th occurrence
  of the same word in Chrome's PDF. A Chrome word with no counterpart is *unpaired*.
- **Median error (mm).** The median distance between paired words. Lower is better.
- **Share within 1 mm.** Paired words at most 1 mm from Chrome's position, divided by **all** of
  Chrome's words. An unpaired word counts as a miss, so a lost word cannot improve this number.
- **Page count.** Each PDF's page count, compared with Chrome's.
- **WPT.** WPT reftests are run through the same pipeline, printed to PDF and compared with the
  reference page. The pass rate measures coverage of the CSS test subset the harness runs. It is
  not a document-quality score, and Chrome itself does not pass every test through this harness.
- **Oracle.** `fidelity/oracles/doc-aggregate.mjs` is the committed document-level oracle. The
  same numbers feed the merge gate's strict exit contract.
- **Paint probe (report-only).** `fidelity/oracles/paint-probe.mjs` reads the vector paint of both
  PDFs: dashed and dotted border segments, text-decoration underlines, and the colour of the page
  canvas. It never gates. Word positions cannot see paint, so this is where a solid border that
  should be dashed, or a missing link underline, shows up.

### Results

<!-- fidelity-evidence:headline -->
- **8 of 9 fixtures** have every word within 1 mm of its position in Chrome for Testing 155.0.8059.85's PDF (share of word positions within 1 mm = 100%). vellora 0.2.0 (published): 0 of 9.
- **0.21 mm or less** median word-position error on every one of the 9 fixtures (largest: danfe). vellora 0.2.0 (published): up to 106.22 mm (text-stress-ptbr).
- **9 of 9 fixtures** print the same number of pages as Chrome. vellora 0.2.0 (published): 6 of 9.
<!-- /fidelity-evidence:headline -->

<!-- fidelity-evidence:charts -->
![Median word-position error per fixture, vellora 0.2.0 (published) vs vellora 0.3.0, log scale](/assets/fidelity/median-mm.svg)

![Share of words within 1 mm of Chrome per fixture, vellora 0.2.0 (published) vs vellora 0.3.0](/assets/fidelity/within-1mm.svg)
<!-- /fidelity-evidence:charts -->

<!-- fidelity-evidence:table -->
Each cell reads vellora 0.2.0 (published) → vellora 0.3.0. Reference: Chrome for Testing 155.0.8059.85.

| Fixture | Chrome words | Median error (mm) | p90 error (mm) | Words within 1 mm | Chrome words unpaired | Pages: 0.2.0 / 0.3.0 / Chrome |
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

### Losses and open items

<!-- fidelity-evidence:losses -->
- **oss-postmark-receipt: 97.2% of words within 1 mm** (vellora 0.2.0 (published): 40.0%); p90 error 0.14 mm.
- **WPT:** 4,553 of 8,047 reftests pass (56.58%); 4,028 (50.06%) pass without any suspect-pass flag. 2,608 still fail and 877 are rejected as outside the strict subset.
- **Merge gate: verdict PASS** on this run (strict contract, --contract), 0 gating items. Every condition is met. What each condition still lets through is listed with it.
  - (1) pin view (--main): no item worse than the published package unless the gate classifies it (class a: the old pass was false; class b: carried in the debt ledger): **met**. Passed with the published engine and not matched in 0.3.0: 6 WPT tests. Class a (the old pass was false, or Chrome fails it too): `css/CSS2/floats/float-nowrap-8.html`, `css/css-page/page-name-flex-001-print.html`, `css/css-page/page-name-flex-002-print.html`, `css/css-page/page-name-flex-004-print.html`, `css/css-text/hanging-punctuation/hanging-punctuation-first-002.html`. Class b (recorded in the debt ledger, not fixed): pass in 0.3.0 with a suspect-pass flag, which the gate scores as worse than the published package's clean pass: `css/css-break/flexbox/flex-fragmented-with-float-descendant-001.html` (flag `ink-displaced-vs-chrome`; raw Blitz: fail). 10 tests that failed before are now rejected by the strict subset.
  - (2) every fixture's median error and share within 1 mm at least as good as the published package's: **met**.
  - (3) every fixture's page count equal to Chrome's: **met**.
  - (4) step-to-step ratchet: no regression against the previous gated step, and the head view (against the chain's first step) passes: **met**. Head view: PASS; 1 test carried in the debt ledger (`css/css-break/flexbox/flex-fragmented-with-float-descendant-001.html`); 5 items accepted as class a, with the evidence in the acceptance file.
<!-- /fidelity-evidence:losses -->

### WPT subset coverage

<!-- fidelity-evidence:wpt-chart -->
![WPT reftests passed: vellora 0.2.0 (published) engine, vellora 0.3.0, Chrome reference](/assets/fidelity/wpt-pass-rate.svg)
<!-- /fidelity-evidence:wpt-chart -->

<!-- fidelity-evidence:wpt -->
WPT reftests passed through the vellora pipeline, printed to PDF and compared with the reference page: coverage of the CSS test subset the harness runs, not a document-quality score.

| | Blitz 0.3.0-alpha.5 engine of vellora 0.2.0 (baseline commit with layout instrumentation) | vellora 0.3.0 (Blitz 0.3.0-beta.4, crates.io) | Chrome/155.0.8059.85 through the same harness |
|---|---:|---:|---:|
| Reftests | 8,047 | 8,047 | 8,046 |
| Pass | 2,578 (32.04%) | 4,553 (56.58%) | 7,258 (90.21%) |
| Pass without suspect-pass flags | 1,988 (24.70%) | 4,028 (50.06%) | 7,258 (90.21%) |
| Unsupported (rejected by the strict subset) | 869 | 877 | 0 |

Commits: 2c66544 (2026-10-21T05:41:54Z), aa41259 (2026-10-28T11:07:50Z); WPT `9d8aceec`. Chrome's outcomes were reused from an earlier run with the same WPT commit and comparison settings (--chrome-from). The 0.2.0 column was measured on a baseline commit that adds layout instrumentation to the 0.2.0 engine; its render-path equivalence to the tag is not separately verified.
<!-- /fidelity-evidence:wpt -->

### Paint

<!-- fidelity-evidence:paint -->
Vector paint read from each PDF (PyMuPDF get_drawings and text spans): dashed/dotted border segments, text-decoration underlines, and whether the page canvas colour matches Chrome's. Report-only: no gate rule reads it. Each cell reads vellora 0.2.0 (published) → vellora 0.3.0. Both are probed against this run's Chrome PDFs (the published package's PDFs through `paint-probe.mjs --subject`; the generator checks that Chrome's side of both probes agrees).

| Fixture | Dashed/dotted border segments, vellora / Chrome | Underlines, vellora / Chrome | Pages whose canvas colour differs from Chrome's | Probe flags |
|---|---:|---:|---:|---:|
| Boleto (bank slip) (`boleto`) | 0 / 135 → 135 / 135 | 0 / 0 → 0 / 0 | none → none | dashes-missing → none |
| Boleto, FEBRABAN layout (`boleto-febraban`) | 0 / 152 → 152 / 152 | 0 / 0 → 0 / 0 | none → none | dashes-missing → none |
| DANFE (NF-e invoice) (`danfe`) | 0 / 2,052 → 2,111 / 2,052 (59 more than Chrome) | 0 / 0 → 0 / 0 | none → none | dashes-missing → none |
| Postmark receipt (OSS template) (`oss-postmark-receipt`) | 0 / 136 → 136 / 136 | 0 / 5 → 5 / 5 | pages 1, 2 → none | canvas, dashes-missing, underlines-missing → none |

The other 5 fixtures have no dashed borders, underlines or canvas colour in either PDF. A count equal to Chrome's says the segments exist, not that each one sits where Chrome's does. Method: fidelity/oracles/py/paint.py (PyMuPDF get_drawings + text spans; docstring); pymupdf 1.28.2.
<!-- /fidelity-evidence:paint -->

### Page by page

Each image shows Chrome (the reference) on the left, vellora 0.2.0 in the middle and vellora 0.3.0
on the right. Page 1 is shown for every fixture. Any page that exists in only
some of the three PDFs is also shown, with an explicit "no page" placeholder where a PDF has none.
The document data is synthetic.

<!-- fidelity-evidence:gallery -->
#### Invoice

![Invoice, page 1: Chrome for Testing 155.0.8059.85, vellora 0.2.0 (published), vellora 0.3.0](/assets/fidelity/invoice-p1.jpg)

#### Receipt

![Receipt, page 1: Chrome for Testing 155.0.8059.85, vellora 0.2.0 (published), vellora 0.3.0](/assets/fidelity/receipt-p1.jpg)

#### Boleto (bank slip)

![Boleto (bank slip), page 1: Chrome for Testing 155.0.8059.85, vellora 0.2.0 (published), vellora 0.3.0](/assets/fidelity/boleto-p1.jpg)

#### Boleto, FEBRABAN layout

![Boleto, FEBRABAN layout, page 1: Chrome for Testing 155.0.8059.85, vellora 0.2.0 (published), vellora 0.3.0](/assets/fidelity/boleto-febraban-p1.jpg)

#### DANFE (NF-e invoice)

![DANFE (NF-e invoice), page 1: Chrome for Testing 155.0.8059.85, vellora 0.2.0 (published), vellora 0.3.0](/assets/fidelity/danfe-p1.jpg)

![DANFE (NF-e invoice), page 2: Chrome for Testing 155.0.8059.85, vellora 0.2.0 (published), vellora 0.3.0](/assets/fidelity/danfe-p2.jpg)

#### Notification letter

![Notification letter, page 1: Chrome for Testing 155.0.8059.85, vellora 0.2.0 (published), vellora 0.3.0](/assets/fidelity/notification-p1.jpg)

#### Long pt-BR text (stress)

![Long pt-BR text (stress), page 1: Chrome for Testing 155.0.8059.85, vellora 0.2.0 (published), vellora 0.3.0](/assets/fidelity/text-stress-ptbr-p1.jpg)

![Long pt-BR text (stress), page 8: Chrome for Testing 155.0.8059.85, vellora 0.2.0 (published), vellora 0.3.0](/assets/fidelity/text-stress-ptbr-p8.jpg)

#### Postmark receipt (OSS template)

![Postmark receipt (OSS template), page 1: Chrome for Testing 155.0.8059.85, vellora 0.2.0 (published), vellora 0.3.0](/assets/fidelity/oss-postmark-receipt-p1.jpg)

![Postmark receipt (OSS template), page 2: Chrome for Testing 155.0.8059.85, vellora 0.2.0 (published), vellora 0.3.0](/assets/fidelity/oss-postmark-receipt-p2.jpg)

<sub>Postmark receipt (OSS template) is adapted from [ActiveCampaign/postmark-templates](https://github.com/ActiveCampaign/postmark-templates) (commit `fa73527`), MIT licence, Copyright (c) 2015 Wildbit; see [NOTICE](https://github.com/diomalta/vellora/blob/main/fixtures/oss-postmark-receipt/NOTICE.md).</sub>

#### Sparksuite simple invoice (OSS template)

![Sparksuite simple invoice (OSS template), page 1: Chrome for Testing 155.0.8059.85, vellora 0.2.0 (published), vellora 0.3.0](/assets/fidelity/oss-sparksuite-invoice-p1.jpg)

<sub>Sparksuite simple invoice (OSS template) is adapted from [sparksuite/simple-html-invoice-template](https://github.com/sparksuite/simple-html-invoice-template) (commit `7d74fe3`), MIT licence, Copyright (c) 2021 Sparksuite; see [NOTICE](https://github.com/diomalta/vellora/blob/main/fixtures/oss-sparksuite-invoice/NOTICE.md).</sub>
<!-- /fidelity-evidence:gallery -->

### Environment

<!-- fidelity-evidence:env -->
- Status: **PASS** (gate report verdict PASS (--contract)). INDICATIVE: local macOS measurement. The authoritative run is pinned Linux CI, which is not wired yet; these numbers will be regenerated from it when it runs.
- Reference: Google Chrome for Testing 155.0.8059.85, headless print-to-PDF (fidelity/lib/chrome-reference.mjs).
- Before: vellora 0.2.0 (published), tag `v0.2.0`, commit `5810062`, Blitz 0.3.0-alpha.5 line, git 2003ba5. Scored 2026-10-27T22:36:58.971Z.
- After: vellora 0.3.0, measured on `phasec/07-tip`, commit `aa41259`, Blitz 0.3.0-beta.4, crates.io. Run `20261028T110750Z` (2026-10-28T11:07:50Z).
- Environment: darwin 27.0.0 arm64 (macOS 27.0.1), Apple M5 Pro, Node v22.23.2, rustc 1.96.0 (ac68faa20 2026-05-25), PyMuPDF 1.28.2, pdftoppm version 26.06.0.
- Word positions: fidelity/oracles/py/words.py (PyMuPDF rawdict: pen origin x, baseline y); pairing: k-th occurrence of a text key in reading order (page, baseline, x) ↔ k-th in Chrome's; quantiles: nearest rank over paired words (ceil(q*n)-th smallest).
- Run command: `node fidelity/run-all.mjs --gate --main --contract --raw --chrome '<repo>/fidelity/.cache/chrome/chrome/mac_arm-155.0.8059.85/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing' --baseline fidelity/baselines/port/11-phase-c --chrome-from ~/Repositories/vellora-fidelity-runs/run-all-10-tip-20261023T004536Z-blitz-0.3.0-beta.4-vellora-a293cf5/wpt/results.json --tools-image vellora-fidelity-tools:baseline-beta4 --accept fidelity/gate/snapshots/2026-10-28/c07/accepted.json --step 16-phase-c-07-tip --out fidelity/results/run-all/c07-tip`
- Gate: `node fidelity/gate/run.mjs --baseline fidelity/baselines/port/11-phase-c --run ~/Repositories/vellora-fidelity-runs/run-all-c07-tip-20261028T110750Z-blitz-0.3.0-beta.4-vellora-aa41259 --head fidelity/baselines/port/00-start --pin fidelity/baselines/pin --layout-from ~/Repositories/vellora-fidelity-runs/run-all-c07-tip-20261028T110750Z-blitz-0.3.0-beta.4-vellora-aa41259 --debt fidelity/baselines/port/DEBT.json --step 16-phase-c-07-tip --accept fidelity/gate/snapshots/2026-10-28/c07/accepted.json --doc-aggregate ~/Repositories/vellora-fidelity-runs/run-all-c07-tip-20261028T110750Z-blitz-0.3.0-beta.4-vellora-aa41259/doc-aggregate/summary.json --contract --out ~/Repositories/vellora-fidelity-runs/c07-tip/regate-contract` → PASS (2026-10-28T11:19:27.811Z).
- Paint probe (report-only): `node fidelity/oracles/paint-probe.mjs --run <repo>/fidelity/results/run-all/c07-tip --label run-all`; published package: `node fidelity/oracles/paint-probe.mjs --run ~/Repositories/vellora-fidelity-runs/run-all-c07-tip-20261028T110750Z-blitz-0.3.0-beta.4-vellora-aa41259 --subject ~/Repositories/vellora-fidelity-runs/doc-aggregate-20261027/pin-pdfs-v0.2.0 --label pin-v0.2.0 --out ~/Repositories/vellora-fidelity-runs/docs-c07/paint-probe-pin-v0.2.0.json`.
- Page images: `node fidelity/report/visual-compare.mjs --run <RUN> --pin-pdfs <doc-aggregate-pin.mjs --pdf-out dir> --out <compare dir> (pdftoppm -r 55), composed by fidelity/report/py/compose.py`
- This page: `node fidelity/report/build-site-evidence.mjs --compare ~/Repositories/vellora-fidelity-runs/docs-c07/visual-compare --run ~/Repositories/vellora-fidelity-runs/run-all-c07-tip-20261028T110750Z-blitz-0.3.0-beta.4-vellora-aa41259 --gate ~/Repositories/vellora-fidelity-runs/run-all-c07-tip-20261028T110750Z-blitz-0.3.0-beta.4-vellora-aa41259/gate-contract/gate-report.json --paint-before <repo>/fidelity/gate/snapshots/2026-10-28/c07-docs/paint-probe-pin-v0.2.0.json --pin-key pin --new-key c07 --release 0.3.0 --update-docs`
- Raw values: [manifest.json](https://github.com/diomalta/vellora/blob/main/docs/assets/fidelity/manifest.json).
<!-- /fidelity-evidence:env -->

### Cross-OS check

The same gated run was repeated on Linux arm64 in a local Docker container (Debian 13, Chrome for
Testing 155.0.8059.85 linux-arm64, 2026-10-28, run `20261028T113714Z`, on the Phase C 06 tree:
the strict contract PASS before the step-07 fixes). vellora's PDFs are **byte-identical on macOS
arm64 and Linux arm64**: 94 of 98 PDFs outside WPT, including all 9 fixtures, the corpus and the
PDF/A renders; the other 4 are the pdf-probe canary mutations, which also differ between two macOS
runs. WPT on Linux: 4545 passes of 8047, 0 per-test changes against macOS. The Chrome reference is
not the same on Linux: words move by up to 0.123 pt, and the `@page` footer is drawn in another
fallback font (DejaVu Sans instead of Times in three of the four legacy fixtures). The committed baselines were measured with macOS Chrome, so the gate
refuses the Linux comparison. Gating on Linux needs baselines measured with Linux Chrome (not done
yet). x86_64 was not measured. Record:
[`fidelity/gate/snapshots/2026-10-28/linux-arm64`](https://github.com/diomalta/vellora/blob/main/fidelity/gate/snapshots/2026-10-28/linux-arm64/README.md).

### Reproduce it

The harness is in the repository (`fidelity/`). Its setup is in
[`fidelity/README.md`](https://github.com/diomalta/vellora/blob/main/fidelity/README.md) ("Run
everything"): Node 22, the native addon, a Python venv with PyMuPDF, poppler, and the oracle tools
image. Then:

```sh
# 1. The reference browser: Chrome for Testing at the pinned version.
node fidelity/wpt/install-chrome.mjs

# 2. A full measured run. The doc-aggregate step writes <run>/doc-aggregate/summary.json.
#    --wpt-chrome runs Chrome's WPT outcomes live; --chrome-from <earlier run>/wpt/results.json
#    reuses them (same WPT commit and comparison settings). --contract makes the gate report the
#    strict merge contract, which is the only report that can turn the evidence from DRAFT to PASS.
#    The run's paint-probe step writes <run>/paint-probe/summary.json (report-only).
node fidelity/run-all.mjs --gate --main --contract --chrome <Chrome for Testing> \
  --baseline fidelity/baselines/port/12-phase-c-final --wpt-chrome \
  --tools-image vellora-fidelity-tools:local --out fidelity/results/run-all/<id>

# 3. The published engine, scored on the same inputs. Build 0.2.0 in a fresh directory: a copied
#    target/ is not rebuilt by cargo.
mkdir -p /tmp/vellora-0.2.0 && git archive 5810062 | tar -x -C /tmp/vellora-0.2.0
(cd /tmp/vellora-0.2.0 && npm ci && npm run build)
node fidelity/oracles/doc-aggregate-pin.mjs --engine /tmp/vellora-0.2.0 \
  --engine-commit 5810062cd8a30d3721d3ffbf17c08bf01e4dc364 \
  --engine-blitz 2003ba5fc2d8931da9213ef26a813b0d24c83ca6 \
  --run fidelity/results/run-all/<id> --pdf-out /tmp/pin-pdfs --out /tmp/pin-doc.json
# The published engine's paint, probed against the same run's Chrome PDFs.
node fidelity/oracles/paint-probe.mjs --run fidelity/results/run-all/<id> \
  --subject /tmp/pin-pdfs --label pin-v0.2.0 --out /tmp/pin-paint.json

# 4. Page images, then this page's charts, tables and manifest.
node fidelity/report/visual-compare.mjs --run fidelity/results/run-all/<id> \
  --pin-pdfs /tmp/pin-pdfs --pin-doc /tmp/pin-doc.json --out /tmp/visual-compare
node fidelity/report/build-site-evidence.mjs --compare /tmp/visual-compare \
  --run fidelity/results/run-all/<id> --pin-doc /tmp/pin-doc.json \
  --gate fidelity/results/run-all/<id>/gate/gate-report.json \
  --paint-before /tmp/pin-paint.json --update-docs
node fidelity/report/build-site-evidence.mjs --check
```

Step 3 scores the published engine on your run's inputs. Without it, the committed pin reference
(`fidelity/baselines/pin/doc-aggregate.json`) is used, and the gate refuses the comparison under
`--main` if any fixture's `native.html` differs from the one the pin was scored on. The generator stamps the
evidence `DRAFT` unless the gate report it is given has the verdict `PASS`.

## Engine modes

Use native rendering by default:

```js
import { renderPdf } from "vellora";

const pdf = await renderPdf(html, data);
```

Use environment Chromium when a template needs browser print fidelity and your host/container already
provides Chrome or Chromium:

```js
import { renderPdf } from "vellora";

const pdf = await renderPdf(html, data, {
  engine: "chromium",
});
```

Install the optional environment engine package only in projects that use host-supplied browser fidelity:

```sh
npm install vellora @vellora/engine-chromium
```

The `vellora` package stays browserless by default. The Chromium package looks for a browser binary in
this order:

1. `chromium.executablePath`
2. `VELLORA_CHROMIUM_EXECUTABLE`
3. common local paths such as macOS Google Chrome, `/usr/bin/google-chrome`, and `/usr/bin/chromium`
4. a `chromium` command on `PATH`

For local development, that usually means no explicit path is needed if Chrome or Chromium is installed
normally. For CI, Docker, and server deploys, pin the executable path or environment variable so the
runtime is reproducible:

```js
const pdf = await renderPdf(html, data, {
  engine: "chromium",
  chromium: {
    executablePath: process.env.VELLORA_CHROMIUM_EXECUTABLE,
    timeoutMs: 30_000,
  },
});
```

This engine calls Chromium/Chrome directly with headless print-to-PDF. It does not install, import, or
drive Puppeteer.

### Installation tiers

Use one of these tiers intentionally:

| Tier | Packages | Browser requirement | Best for |
| --- | --- | --- | --- |
| Native default | `vellora` | None | Fast, browserless document rendering for templates inside the supported subset. |
| Environment Chromium | `vellora` + `@vellora/engine-chromium` | Chrome/Chromium supplied by the environment | Exact browser print fidelity without adding Puppeteer to the runtime graph. |

Use `auto` when you want production routing to come from a checked-in policy:

```json
{
  "version": 1,
  "templates": {
    "invoice-v2": {
      "selectedEngine": "native",
      "reason": "native lint and render checks passed"
    },
    "dashboard-export": {
      "selectedEngine": "chromium",
      "reason": "browser print CSS required"
    }
  }
}
```

```js
const pdf = await renderPdf(html, data, {
  engine: "auto",
  fidelity: {
    templateId: "invoice-v2",
    policyPath: "vellora.fidelity.json",
  },
});
```

## CLI checks

`vellora doctor` renders the native output, optionally renders a Chromium reference, and writes a JSON report:

```sh
vellora doctor invoice.html --reference chromium --template-id invoice-v2 --out artifacts --json
```

When Chromium is requested, the engine first tries normal discovery. Set `VELLORA_CHROMIUM_EXECUTABLE`
or pass `chromium.executablePath` when your deploy needs a fixed binary path. If no browser binary is
available, the CLI exits with code `4`.

`vellora fidelity` validates a policy file:

```sh
vellora fidelity --config vellora.fidelity.json
```

For pixel-level analysis, add `--pixel-diff`. This rasterizes the native and Chromium PDFs with `pdftoppm`, writes page images and red diff overlays to `artifacts/visual`, and uses the mismatch budget to recommend native or Chromium:

```sh
vellora doctor invoice.html \
  --pixel-diff \
  --pixel-budget 0.02 \
  --template-id invoice-v2 \
  --out artifacts \
  --json
```

Useful options:

- `--dpi 144` controls raster density.
- `--pixel-threshold 12` controls per-channel mismatch sensitivity.
- `--pixel-budget 0.02` allows up to 2% mismatched pixels.
- `--pdftoppm /path/to/pdftoppm` overrides rasterizer discovery.

Region-level analysis and direct CDP control remain roadmap work.

If you are replacing an existing Puppeteer pipeline, generate one PDF with that current pipeline and pass it as a local reference file:

```sh
vellora doctor invoice.html \
  --pixel-diff \
  --reference-pdf old-puppeteer-output.pdf \
  --pixel-budget 0.02 \
  --out artifacts \
  --json
```

This compares vellora native output against the local legacy PDF without installing, importing, or launching Puppeteer from vellora.

To compare that same legacy PDF against Vellora's Chromium engine instead of the native engine, make
the subject explicit:

```sh
vellora doctor invoice.html \
  --pixel-diff \
  --reference-pdf old-puppeteer-output.pdf \
  --subject chromium \
  --pixel-budget 0.02 \
  --out artifacts \
  --json
```

## Practical migration rule

Use native vellora when the template fits the subset and the PDF passes your visual review. Use
environment Chromium when your deployment already owns the browser and exact Chromium output matters.
