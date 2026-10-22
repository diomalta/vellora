# Baseline `beta4-gated`: the hardened gate's re-baseline of the Blitz 0.3.0-beta.4 base

Written by `fidelity/gate/write-baseline.mjs` (schema `vellora-fidelity/baseline/2`) from ONE
`run-all.mjs --gate` run of branch `phaseb/gate` at `fb2924a` (0 dirty entries) = base
`feat/blitz-beta4-port` `dd2c22f` + fidelity-only changes (no `crates/`, no `packages/` change).
This is the baseline the next Phase B step gates against:
`node fidelity/run-all.mjs --gate --baseline fidelity/baselines/beta4-gated --chrome-from <wpt results.json>`.

Local macOS + local Chrome: every number is **INDICATIVE**; the pinned Linux Chrome-for-Testing run
is a DESIGN TARGET (not run).

## Environment (CONFIRMED, in `manifest.json`)

| field | value |
|---|---|
| run | `20261021T072047Z` (Wed Oct 21 07:20:47 UTC 2026), 20/20 steps ok, exit 3 (gate FAIL, see below) |
| command | `node fidelity/run-all.mjs --gate --baseline fidelity/baselines/beta4 --chrome-from ~/.cache/vellora-fidelity/run-all-beta4-20261021T054809Z/wpt/results.json --tools-image vellora-fidelity-tools:baseline-beta4 --out fidelity/results/run-all/gated-1` |
| OS / CPU | darwin 27.0.0 arm64 (macOS 27.0.1) / Apple M5 Pro |
| node / rustc | v22.23.2 / rustc 1.96.0 (ac68faa20 2026-05-25) |
| Chrome | Google Chrome 155.0.8059.85 (local); WPT Chrome outcomes + ink reused from the Phase A beta.4 run via `--chrome-from` (Chrome's results do not depend on vellora; same WPT commit and comparison settings, checked by `chromeReuseMismatch`) |
| Blitz | blitz-dom 0.3.0-beta.4 (crates.io) = tag `v0.3.0-beta.4` = `92b11f1` |
| tools image | `vellora-fidelity-tools:baseline-beta4` `sha256:6b648b83…` (same image as both Phase A baselines) |
| veraPDF | `verapdf/cli:v1.30.3@sha256:d5650950…` |
| WPT | `9d8aceec0ddc7ffe46d8f5f3f42d27a0163d6cba` exact pin, 8047 reftests + 239 crashtests |

Post-hoc gate reports (same run, `node fidelity/gate/run.mjs --baseline … --run fidelity/results/run-all/gated-1`)
were regenerated after one loader change (the Phase A beta4 baseline's own `layout-diff-ab`
pdf-probe is now read, so 4 more fixtures are compared per word); the run itself is unchanged. A
copy of the full run directory is in `~/.cache/vellora-fidelity/run-all-gated-beta4-20261021T072047Z`.

## Proof 1 — the gate catches what the status ratchet missed (`attachments/gate-report-vs-pin.*`)

This beta.4 build gated against `fidelity/baselines/pin`: **FAIL**, 90 gating items. Among them
(CONFIRMED, values before → after):

| metric | pin | beta.4 | tolerance |
|---|---|---|---|
| notification REF-W max | 3.60 mm | **8.54 mm** | 0.1 mm |
| notification REF-W p95 | 3.48 mm | **8.42 mm** | 0.1 mm |
| invoice REF-W max | 2.44 mm | **3.91 mm** | 0.1 mm |
| invoice REF-W p95 | 1.78 mm | **3.78 mm** | 0.1 mm |
| WPT clean-pass regressions | — | **53 gate** (111 flagged-pass regressions reported only) | 0 |

plus the text-extraction and DANFE losses the Phase A report listed as "value changes" (e.g.
boleto-febraban BOL-X1 13 → 11 required strings, DANFE-F4c/F11 PASS → FAIL, DANFE-M1 bottom excess
8.55 → 24.72 mm, EXT-2 pdftotext missing tokens up on 5 fixtures, TXT-R1 11.24 → 11.86 mm, postmark
INV-R1 5.50 → 9.20 mm). The verdict TOTALS of the two Phase A runs were identical; the status-only
ratchet passed them. The same flags are asserted on the committed data by
`fidelity/gate/test/committed-canary.test.mjs` (`baselines/beta4` vs `baselines/pin`, no render).

## Proof 2 — beta.4 gated against `fidelity/baselines/beta4` (`gate-report.md`)

**FAIL with exactly ONE gating item**, an absolute failure that is correct behaviour:
`code|cargo-test`: `cargo test --workspace --no-fail-fast` exit 101, failing
`mixed_weight_inline_siblings_advance_by_the_first_run_width` (red at the base; fixed in parallel
by another agent). That is why this baseline was written with `--force`
(`manifest.json gate.writtenDespiteVerdict: true`). Everything else, listed exactly:

- **unchanged: 10852** verdict rows, metrics, WPT tests (8047, ratchet 0 regressions / 0
  improvements) and per-word pdf-probe axes of the 4 legacy fixtures. Vellora's PDFs are
  byte-identical to the Phase A beta.4 run (corpus `vellora.pdf` sha256 equal for all 6 corpus
  fixtures; every DET-1 PASS).
- **newly measured (1)**: `danfe DANFE-B1 oracles:barcode` NOT-RUN → **FAIL** — Code 128 decoding
  now exists in the oracles; neither zxing-cpp nor zbar finds a Code 128 symbol in vellora's DANFE,
  while both decode Chrome's DANFE to the chave and the NF-e cDV validates (CONFIRMED on the same
  PDFs). Same finding as the corpus' DANFE-B1 ("decodes false").
- **added (13)**: LET-1 FAIL (−8.54 mm, "Atenciosamente,"), LET-2 PASS (6/6 paragraphs), LET-3 PASS
  for notification; LET-1 NOT-RUN (its only anchor is disputed: Chrome and WeasyPrint differ by
  > 2 pt), LET-2 PASS (2 compared, 1 disputed), LET-3 FAIL (= TXT-P1, 8 vs 7 pages), TXT-B1 PASS
  (6 statement pages, header on every one, no month split) for text-stress-ptbr; 6 new detection
  canaries, all caught (veraPDF: OutputIntent removed → rule 6.2.10-2, font program un-embedded →
  6.2.11.4.1-1; Code 128 valid / wrong-cDV, vellora and Chrome).
- **not comparable (6)**: crashtests (the Phase A baseline has none; this run: 239/239 ok, 128
  rendered and 111 rejected cleanly), pdf-probe of the 5 corpus fixtures (Phase A had it for the 4
  legacy fixtures only).
- **No regression, nothing accepted** (`acceptedRegressions: []`).

Reference changes in this step, and why no value moved: the corpus now prints Chrome through the
shared puppeteer path instead of the Chrome CLI (every corpus value, vellora's and Chrome's,
identical to Phase A; Chrome PDF bytes differ), and the shared alias table maps Helvetica / Nunito
Sans / Tahoma to Liberation Sans. oss-postmark-receipt's layout-diff input parity now PASSES
(Phase A: 1141/1141 glyphs drawn with system Helvetica) and its 4 caveated verdicts lost the caveat
(caveated 4 → 0); its values did not change (Liberation Sans is metric-compatible with Helvetica).
Its two remaining layout-diff failures are allowlisted (XHTML doctype → Blitz parses the source as
XML, no implied `<tbody>`; `layout-diff/expected-check-failures.json`).

## Tests and lint at `fb2924a` (the code-checks step of the run)

| check | result |
|---|---|
| `cargo test --workspace --no-fail-fast` | **FAIL** (exit 101): 1 failing test, `mixed_weight_inline_siblings_advance_by_the_first_run_width` (red at the base) |
| `npm run test:ts` (vitest) | pass |
| `npm run lint` | pass |
| `npm --prefix fidelity test` | pass (gate, combine, layout-diff, wpt, oracles, corpus self-tests) |

`npm test` (= test:rust && test:ts) is therefore red at this base for the same single reason.

## Other measurements recorded here

- `attachments/wpt-same-revision-cd1d8aa5b-summary.json`: the same build run on WPT
  `cd1d8aa5bfebc15d1af2af230c7ff95f9e582a4c`, the revision of Blitz's own nearest upstream run
  (`23b9b26a9b`, 1 commit after the beta.4 tag commit `92b11f1`), `--allow-unpinned --upstream
  auto`: `sameWptRevision: true`; vellora 2728 pass of 8025 reftests (33.99 %); cross-tab with
  Blitz's own runner: both pass 2607, vellora fail / upstream pass 2345, vellora pass / upstream
  fail 121, vellora not evaluated (unsupported/skip) / upstream pass 325, upstream absent 16.
  Upstream is an upper bound (blitz-paint screen paint, `floats` feature, dify comparator).
- WPT at the pin: 2729 / 8047 pass (33.91 %), 2213 clean, ink check 209 ink-missing + 90
  ink-displaced of 2729 passes (reused Chrome data).

## pdf-probe v2 re-score (2026-10-21)

`pdf-probe/` now holds the pdf-probe semantics 2 sections re-scored from this run's PDFs
(`fidelity/gate/rescore-pdf-probe.mjs`, recorded in `manifest.json pdfProbeRescore`); the v1
files this baseline was written with moved unchanged to `attachments/pdf-probe-v1/`. Details:
`fidelity/baselines/port/README.md`, "pdf-probe v2 re-score".
