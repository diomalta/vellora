# Phase B port chain: `fidelity/baselines/port/`

Every Phase B port step is measured by the fidelity gate (`fidelity/gate/`, rules and tolerances
in `fidelity/ACCEPTANCE.md` section 8) against the step before it. Local macOS runs with local
Chrome are **INDICATIVE**; the pinned Linux Chrome-for-Testing run is a DESIGN TARGET (not wired).

## Chain convention

- A port step `NN-name` (two-digit ordinal + kebab-case name, e.g. `01-text-block-offset`) writes
  `fidelity/baselines/port/NN-name/` and is gated against the step directly before it. The head of
  the chain, `00-start`, is gated against `fidelity/baselines/beta4-gated`. Full chain:
  `pin` (Phase A, Blitz pin `2003ba5`) → `beta4` (Phase A, mechanical bump to 0.3.0-beta.4) →
  `beta4-gated` (hardened-gate re-baseline) → `port/00-start` → `port/01-…` → …
- One step, one gated run, one baseline:

  ```sh
  export PATH="$HOME/.nvm/versions/node/v22.23.2/bin:$PATH"
  node fidelity/run-all.mjs --gate --baseline fidelity/baselines/port/<previous step> \
    --chrome-from <wpt results.json> --tools-image vellora-fidelity-tools:baseline-beta4 \
    --out fidelity/results/run-all/<NN-name> [--accept accepted.json]
  # exit 0 = PASS. Then commit the run as the next link (--name takes no "/", so --root carries port/):
  node fidelity/gate/write-baseline.mjs --run fidelity/results/run-all/<NN-name> \
    --root fidelity/baselines/port --name <NN-name> [--accept accepted.json] \
    [--attach <report>=<name>]...
  ```

- **Merge rule.** The step merges only when its gate is PASS. A chain step is never written with
  `--force`: `manifest.json gate.writtenDespiteVerdict` must be `false` and
  `gate.baseline` must name the previous step. A value that gets worse beyond its tolerance passes
  only as an `acceptedRegressions` entry (`--accept`: key, `after`, reason, evidence) that PROVES
  the old value was wrong (false pass, oracle artefact) with Chrome + WeasyPrint consensus or WPT
  reference analysis (GATE-A1); the writer copies the list into `manifest.json`, and the same list
  goes into the step's commit message. The run's code-checks step must be green (GATE-C1:
  `cargo test --workspace`, `npm run test:ts`, `npm run lint`, `npm --prefix fidelity test`).
- **Older baselines.** Comparisons of the same run against older links (`beta4`, `pin`, …) are
  post-hoc: `node fidelity/gate/run.mjs --baseline fidelity/baselines/<old> --run <run dir> --out
  <run dir>/gate-vs-<old>`, then `--attach` the reports (`attachments/gate-report-vs-<old>.*`).
- **PDF bytes** may change when a step changes layout on purpose; they are not ratcheted. DET-1
  (two renders of one input are byte-identical) is a verdict row and must keep passing.
- **Chrome WPT data.** Chrome's WPT outcomes and ink signatures do not depend on vellora:
  `--chrome-from` reuses an earlier `results.json` when the WPT commit, `HARNESS_SEMANTICS` and the
  comparison settings are identical (`chromeReuseMismatch` in `fidelity/wpt/lib/provenance.mjs`,
  checked by `wpt/run.mjs`, which refuses a mismatch). If the harness or the WPT pin changes, run
  Chrome live once (`--wpt-chrome`) and keep that run's `wpt/results.json` as the new reuse source.
- **Run copies.** `fidelity/results/` is gitignored: copy each step's run directory to
  `~/.cache/vellora-fidelity/run-all-<NN-name>-<runId>` so later steps can re-gate or reuse it.
- **Committed-data check.** `fidelity/gate/test/committed-canary.test.mjs` re-checks `00-start`
  (integrity, PASS vs `beta4-gated`, no `--force`); a new link should add the same assertion
  against its predecessor.

## `00-start`: beta.4 + whitespace test fix + reader fix + hardened oracles

Branch `phaseb/stage1` at `5099808` = `feat/blitz-beta4-port` (`dd2c22f`) merged `--no-ff` with
`phaseb/gate` (`d0d7bb7`, hardened gate) and `phaseb/text-hook` (`4804026`, slim layout-dump hook,
Chrome-verified rewrite of the stale whitespace test, padded-inline-root `read_text_runs` fix).
The run measured that tree with 0 dirty entries.

| field | value (CONFIRMED, `manifest.json`) |
|---|---|
| run | `20261021T074902Z` (2026-10-21 07:49:02Z to 07:58:05Z), 20/20 steps ok, run-all exit 0 |
| command | `node fidelity/run-all.mjs --gate --baseline fidelity/baselines/beta4-gated --chrome-from ~/.cache/vellora-fidelity/run-all-beta4-20261021T054809Z/wpt/results.json --tools-image vellora-fidelity-tools:baseline-beta4 --out fidelity/results/run-all/s1c-00-start` |
| OS / CPU | darwin 27.0.0 arm64 (macOS 27.0.1) / Apple M5 Pro |
| node / rustc | v22.23.2 / rustc 1.96.0 (ac68faa20 2026-05-25) |
| Chrome | Google Chrome 155.0.8059.85 (local) |
| Blitz | blitz-dom 0.3.0-beta.4 (crates.io) |
| tools image | `vellora-fidelity-tools:baseline-beta4` `sha256:6b648b83…` (same image as `pin`, `beta4`, `beta4-gated`) |
| WPT | `9d8aceec0ddc7ffe46d8f5f3f42d27a0163d6cba` exact pin, 8047 reftests + 239 crashtests |
| run copy | `~/.cache/vellora-fidelity/run-all-s1c-00-start-20261021T074902Z` |

**Chrome reuse check (CONFIRMED before the run).** The `--chrome-from` file (Phase A beta.4 run
`20261021T054809Z-blitz-0.3.0-beta.4-vellora-dc535e7`) has WPT commit `9d8aceec…` (= the pin),
harness semantics 2 (= current `HARNESS_SEMANTICS`) and comparison settings
`{"semantics":2,"chainReferences":false,"inlineCss":true,"raster":{"tool":"pdftocairo","dpi":96,"antialias":true}}`,
identical to the hardened harness's (`chromeReuseMismatch` → `null` against the hardened run
`20261021T072135Z`); it covers the same 8047 tests, 8046 with a Chrome outcome, 8044 with Chrome
ink signatures, Chrome/155.0.8059.85. No reftest in it hit the `EISDIR` case the hardened
`prepare.mjs` now handles.

### Gate results

| gated against | verdict | counts |
|---|---|---|
| `beta4-gated` (previous link, in-run gate: `gate-report.{json,md}`) | **PASS** | improvement 13, gating 0, unchanged 15466 |
| `beta4` (Phase A; `attachments/gate-report-vs-beta4.*`) | **PASS** | newly-measured 1, added 13, improvement 13, not-comparable 6, gating 0, unchanged 10839 |
| `pin` (Phase A; `attachments/gate-report-vs-pin.*`) | FAIL (expected: the known beta.4 losses) | 89 gating = 53 WPT clean-pass regressions + 36 value/status regressions; improvement 353, reported 102, changed 9, newly-measured 1, added 13, not-comparable 10 |

- **vs `beta4-gated`**: the only changes are 13 WPT `css/css-text` tests fail → pass (pass 421 →
  434, clean 178 → 182): 4 clean (`word-break/word-break-break-all-inline-00{2,3,5,6}`) and 9
  flagged (`shaping/shaping-00{0,4,5,6,7}`, `shaping-01{2,3}`, `shaping_lig-000`: webfont not
  supplied + ink displaced vs Chrome; `text-encoding/shaping-tatweel-002`: webfont not supplied).
  The 9 flagged ones were passes at the pin and lost at beta.4; the 4 clean ones failed at both
  the pin and beta.4. The code checks went red → green: `beta4-gated` recorded `cargo test` red
  (`mixed_weight_inline_siblings_advance_by_the_first_run_width`), this run has all 4 green (code
  checks are absolute, so the gate lists only failures, not this recovery).
- **vs `beta4`**: the previous single gating item (`code|cargo-test`) is gone; the rest is
  `beta4-gated`'s own report (DANFE-B1 oracles:barcode newly measured → FAIL, 13 LET/TXT-B1/canary
  rows added, 6 not comparable) plus the 13 WPT improvements.
- **vs `pin`**: item for item identical to `beta4-gated/attachments/gate-report-vs-pin.json`
  except `code|cargo-test` (gone) and the 13 WPT tests (9 `reported` flagged-pass losses gone, 4
  improvements added). The 36 non-WPT regressions are unchanged, among them notification REF-W
  max/p95 3.60/3.48 → 8.54/8.42 mm, invoice 2.44/1.78 → 3.91/3.78 mm, BOL-X1 13 → 11, DANFE-X1
  24 → 22, DANFE-F4c segments 3 → 2, DANFE-F11 glyphs 3511 → 3472, DANFE-M1 bottom excess 8.55 →
  24.72 mm. These are what the port steps must win back.

### Text rows and the whitespace fix

No text row changed: every non-WPT metric (15466 unchanged items vs `beta4-gated`) has the same
value, the verdict totals are identical (all: PASS 128 / FAIL 55 / WARN 4 / NOT-RUN 3; excluding
diagnostic variants: 109 / 47 / 4 / 3), and all 29 `vellora.pdf` files of the run (6 corpus, 6
corpus PDF/A-2b, 8 legacy-fixture plain + PDF/A-2b, 9 layout-diff renders) are byte-identical to
the same files of the `beta4-gated` run (`attachments/pdf-identity-vs-beta4-gated.json`, sha256 per
path; CONFIRMED). The whitespace change of `phaseb/text-hook` was a test correction (Chrome 155
keeps the space in "LTDA — CNPJ", and so does Blitz 0.3.0-beta.4; the pin dropped it), not a
render change; BOL-X1 13 → 11 and DANFE-X1/F4c/F11 stay at their beta.4 values because they are
not whitespace losses (`phaseb/text-hook` evidence: off-page right-aligned values clipped by
pdftotext after `fixed_table_widths`, and an emitter cell narrowed by `fixed_table_widths`).

### Other values recorded (CONFIRMED, this run)

- WPT at the pin: pass 2742 / 8047 (34.07 %), clean 2217 (27.55 %), pass-blank 37, fail 4400,
  unsupported 867, skip 1, error 0, timeout 0; ink check 209 ink-missing + 98 ink-displaced of
  2742 passes (reused Chrome data). Crashtests: 239/239 ok.
- Canaries: 38 rows, 30 detection canaries all caught, 8 measurement-only.
- REF-W max/p95 (mm): invoice 3.91/3.78, notification 8.54/8.42, boleto 4.64/2.48, receipt
  101.15/4.06, danfe 45.69/33.25, text-stress-ptbr 101.6/97.36, boleto-febraban 120.78/83.01.
- layout-diff: the only check failures are the 5 allowlisted ones (receipt ×3: html_normalize
  wraps a `<div>` inside `<p>`; oss-postmark-receipt ×2: XHTML doctype parsed as XML), each with
  its expiry condition in `fidelity/layout-diff/expected-check-failures.json`.
- `acceptedRegressions: []`.
