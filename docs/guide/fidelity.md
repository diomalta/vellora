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
HTML. It compares the published package with an unreleased branch. Every number on this page is
generated from one manifest,
[`docs/assets/fidelity/manifest.json`](https://github.com/diomalta/vellora/blob/main/docs/assets/fidelity/manifest.json).
The tables are rewritten by the generator, so they cannot drift from it.

<!-- fidelity-evidence:status -->
::: warning DRAFT
**DRAFT. These results are from an unreleased branch that is not merged.** The merge is gated by a strict oracle contract, and this run does not pass it yet (gate report verdict FAIL: the strict merge contract is not met yet). INDICATIVE: local macOS measurement. Public numbers will be regenerated from the final gated run, and from Linux CI when available. The released package is vellora@0.2.0.
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

### Results

<!-- fidelity-evidence:headline -->
- **7 of 9 fixtures** have every word within 1 mm of its position in Chrome for Testing 155.0.8059.85's PDF (share of word positions within 1 mm = 100%). vellora 0.2.0 (published): 0 of 9.
- **0.61 mm or less** median word-position error on every one of the 9 fixtures (largest: oss-sparksuite-invoice). vellora 0.2.0 (published): up to 106.22 mm (text-stress-ptbr).
- **8 of 9 fixtures** print the same number of pages as Chrome. vellora 0.2.0 (published): 6 of 9. Still open: oss-postmark-receipt prints 1 page where Chrome prints 2.
<!-- /fidelity-evidence:headline -->

<!-- fidelity-evidence:charts -->
![Median word-position error per fixture, vellora 0.2.0 (published) vs vellora (unreleased branch), log scale](/assets/fidelity/median-mm.svg)

![Share of words within 1 mm of Chrome per fixture, vellora 0.2.0 (published) vs vellora (unreleased branch)](/assets/fidelity/within-1mm.svg)
<!-- /fidelity-evidence:charts -->

<!-- fidelity-evidence:table -->
Each cell reads vellora 0.2.0 (published) → vellora (unreleased branch). Reference: Chrome for Testing 155.0.8059.85.

| Fixture | Chrome words | Median error (mm) | p90 error (mm) | Words within 1 mm | Chrome words unpaired | Pages: 0.2.0 / branch / Chrome |
|---|---:|---:|---:|---:|---:|---:|
| Invoice (`invoice`) | 541 | 1.46 → 0.19 | 1.73 → 0.64 | 36.0% → 93.2% | 0 → 0 | 3 / 3 / 3 |
| Receipt (`receipt`) | 151 | 5.18 → 0.15 | 77.00 → 0.40 | 7.9% → 100.0% | 0 → 0 | 2 / 2 / 2 |
| Boleto (bank slip) (`boleto`) | 297 | 1.77 → 0.39 | 14.09 → 0.46 | 32.0% → 100.0% | 0 → 0 | 1 / 1 / 1 |
| Boleto, FEBRABAN layout (`boleto-febraban`) | 315 | 80.70 → 0.07 | 82.32 → 0.30 | 15.6% → 100.0% | 8 → 0 | 1 / 1 / 1 |
| DANFE (NF-e invoice) (`danfe`) | 630 | 17.68 → 0.26 | 37.17 → 0.46 | 8.9% → 100.0% | 1 → 0 | 2 / 1 / 1 |
| Notification letter (`notification`) | 248 | 0.41 → 0.17 | 1.02 → 0.25 | 86.7% → 100.0% | 4 → 0 | 1 / 1 / 1 |
| Long pt-BR text (stress) (`text-stress-ptbr`) | 1,833 | 106.22 → 0.40 | 221.05 → 0.66 | 1.4% → 100.0% | 7 → 0 | 8 / 7 / 7 |
| Postmark receipt (OSS template) (`oss-postmark-receipt`) | 180 | 0.66 → 0.19 | 18.19 → 0.32 | 40.0% → 75.0% | 39 → 39 | 1 / 1 / 2 (open) |
| Sparksuite simple invoice (OSS template) (`oss-sparksuite-invoice`) | 46 | 9.87 → 0.61 | 10.95 → 0.62 | 0.0% → 100.0% | 0 → 0 | 1 / 1 / 1 |
<!-- /fidelity-evidence:table -->

### Losses and open items

<!-- fidelity-evidence:losses -->
- **invoice: 93.2% of words within 1 mm** (vellora 0.2.0 (published): 36.0%); p90 error 0.64 mm.
- **oss-postmark-receipt: 1 page, Chrome prints 2.** 39 of Chrome's 180 words have no counterpart in vellora's PDF (vellora 0.2.0 (published): 39). Tracked as table fragmentation across pages (exit-contract condition 3). Not fixed on this branch.
- **WPT:** 3,769 of 8,047 reftests pass (46.84%); 3,228 (40.11%) pass without any suspect-pass flag. 3,388 still fail and 877 are rejected as outside the strict subset.
- **Merge gate:** verdict FAIL on this run, with 295 gating items: 127 step-to-step ratchet regressions, 167 further items worse than the published package that the gate cannot classify yet, and 1 page-count item. The branch does not merge until the contract passes.
<!-- /fidelity-evidence:losses -->

### WPT subset coverage

<!-- fidelity-evidence:wpt-chart -->
![WPT reftests passed: vellora 0.2.0 (published) engine, vellora (unreleased branch), Chrome reference](/assets/fidelity/wpt-pass-rate.svg)
<!-- /fidelity-evidence:wpt-chart -->

<!-- fidelity-evidence:wpt -->
WPT reftests passed through the vellora pipeline, printed to PDF and compared with the reference page: coverage of the CSS test subset the harness runs, not a document-quality score.

| | Blitz 0.3.0-alpha.5 engine of vellora 0.2.0 (baseline commit with layout instrumentation) | vellora (unreleased branch) (Blitz 0.3.0-beta.4, crates.io) | Chrome/155.0.8059.85 through the same harness |
|---|---:|---:|---:|
| Reftests | 8,047 | 8,047 | 8,046 |
| Pass | 2,578 (32.04%) | 3,769 (46.84%) | 7,258 (90.21%) |
| Pass without suspect-pass flags | 1,988 (24.70%) | 3,228 (40.11%) | 7,258 (90.21%) |
| Unsupported (rejected by the strict subset) | 869 | 877 | 0 |

Commits: 2c66544 (2026-10-21T05:41:54Z), 4b7bcd8 (2026-10-27T23:39:13Z); WPT `9d8aceec`. Chrome's outcomes were reused from an earlier run with the same WPT commit and comparison settings (--chrome-from). The 0.2.0 column was measured on a baseline commit that adds layout instrumentation to the 0.2.0 engine; its render-path equivalence to the tag is not separately verified.
<!-- /fidelity-evidence:wpt -->

### Page by page

Each image shows Chrome (the reference) on the left, the published package in the middle and the
unreleased branch on the right. Page 1 is shown for every fixture. Any page that exists in only
some of the three PDFs is also shown, with an explicit "no page" placeholder where a PDF has none.
The document data is synthetic.

<!-- fidelity-evidence:gallery -->
#### Invoice

![Invoice, page 1: Chrome for Testing 155.0.8059.85, vellora 0.2.0 (published), vellora (unreleased branch)](/assets/fidelity/invoice-p1.jpg)

#### Receipt

![Receipt, page 1: Chrome for Testing 155.0.8059.85, vellora 0.2.0 (published), vellora (unreleased branch)](/assets/fidelity/receipt-p1.jpg)

#### Boleto (bank slip)

![Boleto (bank slip), page 1: Chrome for Testing 155.0.8059.85, vellora 0.2.0 (published), vellora (unreleased branch)](/assets/fidelity/boleto-p1.jpg)

#### Boleto, FEBRABAN layout

![Boleto, FEBRABAN layout, page 1: Chrome for Testing 155.0.8059.85, vellora 0.2.0 (published), vellora (unreleased branch)](/assets/fidelity/boleto-febraban-p1.jpg)

#### DANFE (NF-e invoice)

![DANFE (NF-e invoice), page 1: Chrome for Testing 155.0.8059.85, vellora 0.2.0 (published), vellora (unreleased branch)](/assets/fidelity/danfe-p1.jpg)

![DANFE (NF-e invoice), page 2: Chrome for Testing 155.0.8059.85, vellora 0.2.0 (published), vellora (unreleased branch)](/assets/fidelity/danfe-p2.jpg)

#### Notification letter

![Notification letter, page 1: Chrome for Testing 155.0.8059.85, vellora 0.2.0 (published), vellora (unreleased branch)](/assets/fidelity/notification-p1.jpg)

#### Long pt-BR text (stress)

![Long pt-BR text (stress), page 1: Chrome for Testing 155.0.8059.85, vellora 0.2.0 (published), vellora (unreleased branch)](/assets/fidelity/text-stress-ptbr-p1.jpg)

![Long pt-BR text (stress), page 8: Chrome for Testing 155.0.8059.85, vellora 0.2.0 (published), vellora (unreleased branch)](/assets/fidelity/text-stress-ptbr-p8.jpg)

#### Postmark receipt (OSS template)

![Postmark receipt (OSS template), page 1: Chrome for Testing 155.0.8059.85, vellora 0.2.0 (published), vellora (unreleased branch)](/assets/fidelity/oss-postmark-receipt-p1.jpg)

![Postmark receipt (OSS template), page 2: Chrome for Testing 155.0.8059.85, vellora 0.2.0 (published), vellora (unreleased branch)](/assets/fidelity/oss-postmark-receipt-p2.jpg)

<sub>Postmark receipt (OSS template) is adapted from [ActiveCampaign/postmark-templates](https://github.com/ActiveCampaign/postmark-templates) (commit `fa73527`), MIT licence, Copyright (c) 2015 Wildbit; see [NOTICE](https://github.com/diomalta/vellora/blob/main/fixtures/oss-postmark-receipt/NOTICE.md).</sub>

#### Sparksuite simple invoice (OSS template)

![Sparksuite simple invoice (OSS template), page 1: Chrome for Testing 155.0.8059.85, vellora 0.2.0 (published), vellora (unreleased branch)](/assets/fidelity/oss-sparksuite-invoice-p1.jpg)

<sub>Sparksuite simple invoice (OSS template) is adapted from [sparksuite/simple-html-invoice-template](https://github.com/sparksuite/simple-html-invoice-template) (commit `7d74fe3`), MIT licence, Copyright (c) 2021 Sparksuite; see [NOTICE](https://github.com/diomalta/vellora/blob/main/fixtures/oss-sparksuite-invoice/NOTICE.md).</sub>
<!-- /fidelity-evidence:gallery -->

### Environment

<!-- fidelity-evidence:env -->
- Status: **DRAFT** (gate report verdict FAIL: the strict merge contract is not met yet). INDICATIVE: local macOS measurement. Public numbers will be regenerated from the final gated run, and from Linux CI when available.
- Reference: Google Chrome for Testing 155.0.8059.85, headless print-to-PDF (fidelity/lib/chrome-reference.mjs).
- Before: vellora 0.2.0 (published), tag `v0.2.0`, commit `5810062`, Blitz 0.3.0-alpha.5 line, git 2003ba5. Scored 2026-10-27T22:36:58.971Z.
- After: vellora (unreleased branch) `phasec/02-tip`, commit `4b7bcd8`, Blitz 0.3.0-beta.4, crates.io. Run `20261027T233913Z` (2026-10-27T23:39:13Z).
- Environment: darwin 27.0.0 arm64 (macOS 27.0.1), Apple M5 Pro, Node v22.23.2, rustc 1.96.0 (ac68faa20 2026-05-25), PyMuPDF 1.28.2, pdftoppm version 26.06.0.
- Word positions: fidelity/oracles/py/words.py (PyMuPDF rawdict: pen origin x, baseline y); pairing: k-th occurrence of a text key in reading order (page, baseline, x) ↔ k-th in Chrome's; quantiles: nearest rank over paired words (ceil(q*n)-th smallest).
- Run command: `node fidelity/run-all.mjs --gate --main --chrome '<repo>/fidelity/.cache/chrome/chrome/mac_arm-155.0.8059.85/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing' --baseline fidelity/baselines/port/10-integration --chrome-from ~/Repositories/vellora-fidelity-runs/run-all-10-tip-20261023T004536Z-blitz-0.3.0-beta.4-vellora-a293cf5/wpt/results.json --tools-image vellora-fidelity-tools:baseline-beta4 --out fidelity/results/run-all/c02-tip`
- Gate: `node fidelity/gate/run.mjs --baseline fidelity/baselines/port/10-integration --run ~/Repositories/vellora-fidelity-runs/run-all-c02-tip-20261027T233913Z-blitz-0.3.0-beta.4-vellora-4b7bcd8 --head fidelity/baselines/port/00-start --pin fidelity/baselines/pin --layout-from ~/Repositories/vellora-fidelity-runs/run-all-c02-tip-20261027T233913Z-blitz-0.3.0-beta.4-vellora-4b7bcd8 --debt fidelity/baselines/port/DEBT.json --step 11-collapse-comp --doc-aggregate ~/Repositories/vellora-fidelity-runs/run-all-c02-tip-20261027T233913Z-blitz-0.3.0-beta.4-vellora-4b7bcd8/doc-aggregate/summary.json --contract --out ~/Repositories/vellora-fidelity-runs/run-all-c02-tip-20261027T233913Z-blitz-0.3.0-beta.4-vellora-4b7bcd8/gate-contract` → FAIL (2026-10-27T23:49:25.169Z).
- Page images: `node fidelity/report/visual-compare.mjs --run <RUN> --pin-pdfs <doc-aggregate-pin.mjs --pdf-out dir> --out <compare dir> (pdftoppm -r 55), composed by fidelity/report/py/compose.py`
- This page: `node fidelity/report/build-site-evidence.mjs --compare ~/Repositories/vellora-fidelity-runs/visual-compare-c02/out --run ~/Repositories/vellora-fidelity-runs/run-all-c02-tip-20261027T233913Z-blitz-0.3.0-beta.4-vellora-4b7bcd8 --gate ~/Repositories/vellora-fidelity-runs/run-all-c02-tip-20261027T233913Z-blitz-0.3.0-beta.4-vellora-4b7bcd8/gate-contract/gate-report.json --pin-key pin --new-key c02 --update-docs`
- Raw values: [manifest.json](https://github.com/diomalta/vellora/blob/main/docs/assets/fidelity/manifest.json).
<!-- /fidelity-evidence:env -->

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
node fidelity/run-all.mjs --gate --contract --chrome <Chrome for Testing> \
  --baseline fidelity/baselines/port/10-integration --wpt-chrome \
  --tools-image vellora-fidelity-tools:local --out fidelity/results/run-all/<id>

# 3. The published engine, scored on the same inputs. Build 0.2.0 in a fresh directory: a copied
#    target/ is not rebuilt by cargo.
mkdir -p /tmp/vellora-0.2.0 && git archive 5810062 | tar -x -C /tmp/vellora-0.2.0
(cd /tmp/vellora-0.2.0 && npm ci && npm run build)
node fidelity/oracles/doc-aggregate-pin.mjs --engine /tmp/vellora-0.2.0 \
  --engine-commit 5810062cd8a30d3721d3ffbf17c08bf01e4dc364 \
  --engine-blitz 2003ba5fc2d8931da9213ef26a813b0d24c83ca6 \
  --run fidelity/results/run-all/<id> --pdf-out /tmp/pin-pdfs --out /tmp/pin-doc.json

# 4. Page images, then this page's charts, tables and manifest.
node fidelity/report/visual-compare.mjs --run fidelity/results/run-all/<id> \
  --pin-pdfs /tmp/pin-pdfs --pin-doc /tmp/pin-doc.json --out /tmp/visual-compare
node fidelity/report/build-site-evidence.mjs --compare /tmp/visual-compare \
  --run fidelity/results/run-all/<id> --pin-doc /tmp/pin-doc.json \
  --gate fidelity/results/run-all/<id>/gate/gate-report.json --update-docs
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
