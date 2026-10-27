# repro-10: 10-tip reproduced on the rebuilt environment (2026-10-27)

**Verdict: REPRODUCED.** Every product PDF is byte-identical (DET-1 PASS). Every oracle verdict and
metric is the same. All 8047 WPT product outcomes are the same. Every gate count is the same. The
rebuilt tools image `sha256:c405e06c…` gives the same oracle results as the lost image
`sha256:6b648b83…` on this corpus. Each byte difference that remains is explained below with
evidence. None of them comes from vellora's output. Local macOS: all numbers are INDICATIVE.

| field | value |
|---|---|
| date | 2026-10-27 (repro run `20261027T130144Z`) vs tip run `20261023T004510Z` (2026-10-23) |
| branch | `phaseb/10-repro` from `phaseb/10-tip` d3fa920 (product code identical to a293cf5) |
| env | darwin 27.0.0 arm64 (macOS 27.0.1), Apple M5 Pro, Node v22.23.2, rustc 1.96.0, Docker 29.8.2, WPT 9d8aceec |
| tip run copy | `vellora-fidelity-runs/run-all-10-tip-20261023T004536Z-blitz-0.3.0-beta.4-vellora-a293cf5` (directory name carries the WPT step runId; `summary.json` runId is `20261023T004510Z`) |
| repro run copy | `vellora-fidelity-runs/run-all-10-repro-20261027T130144Z` (+ `logs/run-all-stdout.log`) |
| machine-readable | `repro-10-summary.json` (sha256 of every PDF on both sides, deltas, attributions) |

## Commands

```sh
node fidelity/wpt/install-chrome.mjs        # pinned CfT 155.0.8059.85 into fidelity/.cache/chrome
node fidelity/run-all.mjs --gate --baseline fidelity/baselines/port/09-review-fixes \
  --chrome-from <tip run copy>/wpt/results.json --tools-image vellora-fidelity-tools:baseline-beta4 \
  --chrome '<repo>/fidelity/.cache/chrome/chrome/mac_arm-155.0.8059.85/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing' \
  --out fidelity/results/run-all/10-repro                  # exit 3 (FAIL), as the tip run without acceptances
node fidelity/gate/run.mjs --baseline fidelity/baselines/port/09-review-fixes --run fidelity/results/run-all/10-repro \
  --accept fidelity/gate/snapshots/2026-10-22/10-spark/accepted.json --layout-from fidelity/results/run-all/10-repro \
  --out <scratch>/regate-accept                            # -> gate-report-repro-10-vs-09-accepted.*
python3 scripts/cmp_runs.py <tip> <repro> <scratch>/cmp.json   # sha256 of every common file + JSON diffs
python3 scripts/all_json.py <scratch>/cmp.json <tip> <repro>   # deep diff of every differing JSON, env fields ignored
python3 scripts/wpt_cmp.py <tip>/wpt/results.json <repro>/wpt/results.json
python3 scripts/deep_json.py <tip>/wpt/results.json <repro>/wpt/results.json raw,rawOutcome,durationMs,env,timing,runId,config
fidelity/.venv/bin/python -I scripts/chrome_pdf_cmp.py <scratch>/cmp.json <tip> <repro>
python3 scripts/versions.py <tip> <repro>
python3 scripts/addon_cmp.py <tip worktree>/packages/native/vellora.darwin-arm64.node packages/native/vellora.darwin-arm64.node
```

## Environment deltas (CONFIRMED from the run artefacts)

- **Tools image:** the tip used `sha256:6b648b83e2ccdb815b081936cd25b2d4d05a796f719abbc861c2108cb0dafe26` and
  the repro used `sha256:c405e06c653aa6de2e0c63fd6a87e1cd8e076f80e27086994f1b0a6156a63653`. Both
  record the same recipe sha256 (`f136dd23…`). Both sides record the same tool versions: qpdf
  12.2.0, WeasyPrint 70.0, and barcode decoders 0.23.93 + zxing-cpp 3.1.1.
- **veraPDF image:** `sha256:45b2f7cd…` (1.30.3) on both sides. This image was also gone from the
  machine. It was pulled again by digest before the run.
- **Chrome:** the local stable Chrome had auto-updated to 156.0.8078.4. The repro therefore pinned
  Chrome for Testing **155.0.8059.85** (`fidelity/wpt/install-chrome.mjs`, `CHROME_FOR_TESTING_BUILD`).
  The tip used stable Google Chrome 155.0.8059.85. Both record `browserVersion`
  `Chrome/155.0.8059.85`. A first launch with Chrome 156 was stopped during code-checks and thrown
  away, so no results come from Chrome 156.
- **WPT raw mode:** the tip ran with `--raw` and the repro did not. Only the tip side has
  `rawOutcome` fields and `wpt/raw-artifacts/` (13152 files).
- **Host tools:** the same on both sides: PyMuPDF 1.28.2, pdfminer.six 20260107, poppler 26.06.0,
  pillow 12.3.0, Python 3.12.13, puppeteer-core 25.15.0, blitz 0.3.0-beta.4, krilla 0.8.2.
- **Native addon sha256:** the tip addon is `4c423ed2…` and the repro addon is `4084e5d0…`. This is
  a build-path difference only. The addon embeds the 17-byte worktree id 4 times. After replacing
  that id, 174 bytes still differ: 16 in `LC_UUID` and 158 in `LC_CODE_SIGNATURE` (the ad-hoc
  signature). No other bytes differ. Every PDF rendered with it is byte-identical (next section).

## (1) PDFs: 168 common to both runs

| class | total | byte-identical | attribution of differences |
|---|---|---|---|
| product (`vellora.pdf`, `*.vellora.pdf`): DET-1 | 71 | **71** | none |
| WeasyPrint reference (tools image) | 10 | **10** | none: the rebuilt image prints the same bytes |
| other canaries (qpdf, veraPDF, text, layout-shift, copypaste) | 13 | 13 | none |
| Chrome reference (`chrome.pdf`, `*.chrome.pdf`) | 70 | 0 | CONFIRMED: all 70 are identical after zeroing `/CreationDate` and `/ModDate`. The only difference is print time. |
| pdf-probe canaries (`canaries/pdf-probe/*.pdf`) | 4 | 0 | CONFIRMED: only `/ID[1]` differs (29 bytes). Words and boxes are identical. These files are mutations of the byte-identical `vellora.pdf`, saved with PyMuPDF `doc.save` (`oracles/py/pdf_mutate.py`). HYPOTHESIS: MuPDF builds a new `/ID[1]` from the save time. |

## (2) Oracle verdicts and metrics

The comparison deep-diffed every `oracles/**/result.json`, `oracles/fixtures/summary.json`,
`corpus/report.json`, `layout-diff/**/{diff,pdf-probe}.json`, `layout-diff/summary-run-all.json`,
`wpt-crashtests/crashtests.json`, `code-checks/summary.json` and `summary.json`. It ignored
environment, provenance, timing and path fields. All of these files are equal. This covers the
qpdf, veraPDF, barcode, text-extractor and WeasyPrint/layout-consensus verdicts and metrics, and
the canary counts. Only these fields still differ:

- Chrome PDF sha256 fields (`chromePdf.sha256`, `meta.json chrome.pdfSha256`, `corpus/report.json
  fixtures[].chrome.sha256`). The cause is the print time (see above).
- `referenceHtmlSha256`/`htmlSha256` and layout-diff `parity[9]` (browser input sha256).
  CONFIRMED: `weasyprint-input.html` and `browser.html` are byte-identical after replacing the
  worktree id that appears in their embedded absolute paths.
- `weasyprint.key.imageId`, which is the tools image id itself.

Summary verdicts are the same on both sides. Non-diagnostic results: PASS 122, FAIL 32, WARN 6,
NOT-RUN 3. Canaries: 35/35 detections caught, plus 8 measurement-only.

## (3) WPT: 8047 tests

The product outcome is identical for all 8047 tests on both sides: pass 3709, fail 3448,
unsupported 877, pass-blank 12, skip 1. The `cause` objects are identical. Every other per-test
field is identical except `rasterMs`/`renderMs`. Throughput was 161.2 vellora tests/s on the tip
and 123.8 tests/s on the repro. That difference is timing only and is not gated. The likely cause
is machine load, because another workflow worktree was active (UNVERIFIED ASSUMPTION). Chrome
outcomes are the same because they were reused (`--chrome-from` the tip run copy).

## (4) Gate counts

| view | tip | repro |
|---|---|---|
| vs 09, no acceptances (run-all step) | improvement 93, added 5, within-tol 327, newly-measured 39, regression 3, gating 3 | identical |
| vs 09, 10-spark `accepted.json` | accepted 3, gating 0 | identical |
| head (vs port/00-start), no acceptances / with acceptances | headGating 1173 / 1170, debt 0 | identical |
| pin view | (a) 0, (b) 0, (c) 859, merge to main BLOCKED | identical |
| unchanged / withinToleranceBetter / flaggedPassLost | 14486 / 1 / 0 | identical |

`gate-report.json`, with and without acceptances, is deep-equal to the tip's report except for
`run.provenance.{runId,dateIso}`. It also lacks the per-item `rawOutcome` field, because the tip
used `--raw` and the repro did not. Code-checks inside the run passed: cargo test, vitest, lint
and fidelity tests all exited 0.

## Consequences

- The rebuilt `vellora-fidelity-tools:baseline-beta4` (`sha256:c405e06c…`) can replace the lost
  image for integration-3 and later work. On this corpus its verdicts are CONFIRMED equivalent.
- Chrome: future runs should pass the pinned CfT 155.0.8059.85 with `--chrome`. The local stable
  Chrome is now 156.0.8078.4. Comparing a Chrome 156 run against Chrome 155 baselines would mix a
  Chrome change into the gate.
