# Baseline at Blitz 0.3.0-beta.4 (Phase A, measurement only)

Branch `fidelity/baseline-beta4` = `fidelity/integration` (`2c66544`) + `c0e28f9` (the mechanical
bump `dff3bc6` cherry-picked, with the stray `benchmarks/package-lock.json` dropped) + `dc535e7`
(the layout-dump hook port, `fidelity/layout-diff/patches/blitz-0.3.0-beta.4-dump-hook-port.patch`
applied unchanged, `blitz_engine.rs` only). Not for merge: it exists to measure the bump with the
same oracles as the pin baseline (`fidelity/baselines/pin/`, branch `fidelity/baseline-pin`
`8009f96`). Nothing here changes how vellora renders (see Determinism).

Local macOS + local Chrome: every number is **INDICATIVE**; the pinned Linux Chrome-for-Testing
run is a DESIGN TARGET (not run).

## Environment (CONFIRMED, recorded in `manifest.json` and every tool output)

| field | value |
|---|---|
| run-all run | `20261021T054809Z` (start Wed Oct 21 05:48:09 UTC 2026), exit 0, 17/17 steps ok |
| A/B layout-diff + pdf-probe | 2026-10-21 06:05 UTC (labels `pin` 06:05:08Z, `beta4` 06:05:12Z) |
| OS / CPU | darwin 27.0.0 arm64 (macOS 27.0.1 26A434) / Apple M5 Pro |
| node / rustc | v22.23.2 / rustc 1.96.0 (ac68faa20 2026-05-25), cargo 1.96.0 |
| Chrome | Google Chrome 155.0.8059.85 (local, `/Applications/Google Chrome.app`) |
| Blitz | blitz-dom/html/traits 0.3.0-beta.4 (crates.io); pin = git `2003ba5` (0.3.0-alpha.5) |
| tools image | `vellora-fidelity-tools:baseline-beta4` `sha256:6b648b83…` (same ID as the pin run's image) |
| veraPDF | `verapdf/cli:v1.30.3@sha256:d5650950…` (image `sha256:45b2f7cd…`, amd64 under Docker 29.8.2) |
| poppler / python | pdftoppm/pdftotext 26.06.0 / Python 3.12.13 (`fidelity/.venv`, pins of oracles + corpus requirements) |
| puppeteer-core | 25.15.0 (PUPPETEER_SKIP_DOWNLOAD=1, explicit executablePath) |
| WPT | `9d8aceec0ddc7ffe46d8f5f3f42d27a0163d6cba` (exact pin), 8047 reftests, Chrome print oracle ran |
| git | `fidelity/baseline-beta4` `dc535e7`; run-all records 1 dirty entry = the untracked `fidelity/baselines/beta4/determinism/` written before the run (results only, no source) |

Commands (from the repo root, `export PATH="$HOME/.nvm/versions/node/v22.23.2/bin:$PATH"`):

```sh
npm ci && npm run build
cargo test -p vellora-core --no-fail-fast                       # cargo-test.txt
node fidelity/baselines/beta4/determinism/render-sha-ab.mjs --a <bump-only dff3bc6 build> --b . \
  --out fidelity/baselines/beta4/determinism/hook-vs-bump-only.json
node fidelity/baselines/beta4/determinism/render-sha-ab.mjs --a <pin 2c66544 build> --b . \
  --out fidelity/baselines/beta4/determinism/pin-vs-beta4.json
node fidelity/run-all.mjs --tools-image vellora-fidelity-tools:baseline-beta4 --wpt-chrome \
  --wpt-arg --expectations --wpt-arg fidelity/baselines/wpt/blitz-2003ba5fc2d8.json \
  --wpt-arg --update-expectations
node fidelity/baselines/beta4/extract.mjs --run fidelity/results/run-all/20261021T054809Z \
  --expectations fidelity/baselines/wpt/blitz-0.3.0-beta.4.json \
  --compare fidelity/results/pin-run-20261021T054154Z/summary.json --out fidelity/baselines/beta4
node fidelity/layout-diff/run.mjs --label pin --dump-repo <pin 2c66544 checkout>  # exit 2: receipt, by design
node fidelity/layout-diff/run.mjs --label beta4                                    # exit 2: receipt, by design
node fidelity/layout-diff/pdf-probe.mjs --label pin --dump-repo <pin checkout> --fixtures invoice,receipt,boleto,notification
node fidelity/layout-diff/pdf-probe.mjs --label beta4 --fixtures invoice,receipt,boleto,notification
node fidelity/layout-diff/compare.mjs --a pin --b beta4
```

`<bump-only>`, `<pin>` and the pagination-probe checkouts were detached `git worktree`s under
`fidelity/.cache/` (gitignored), built with `npm ci && npm run build`, removed afterwards. The pin
run's `summary.json` used by `--compare` is the pin agent's run `20261021T054154Z`; its sha256
`13a001d5…` equals `fidelity/baselines/pin/manifest.json` `source.summarySha256` (CONFIRMED).

## Main result: first divergence vs Chrome and the responsible layer, pin vs beta.4

Layers: `N0` = raw Blitz on the source HTML, `B0` = Blitz on html_normalize's output, `L0` =
vellora's box walk, then the 7 `layout_normalize` passes (order in `fidelity/layout-diff/README.md`).
Pagination and PDF emit are NOT layers of the dump hook; they are covered by `pdf-probe` (PDF words
vs Chrome's PDF) and, for this report, by a scratch-only pagination probe (below). Δ = vellora −
Chromium, CSS px unless marked pt. Same templated HTML and same Chromium reference in both runs
(CONFIRMED by `compare.mjs`).

### Natural first divergence (final pre-pagination layer) — CONFIRMED

| fixture | build | first divergent box | Δ final | first over tol. / dominant | first divergent text run |
|---|---|---|---|---|---|
| invoice | pin | `body>table:nth-child(1)>tbody>tr:nth-child(1)>td:nth-child(1)` enter | dw −11.09 (N0 dx 3, dy 3, dw −14.47) | **N0 (raw Blitz)** / N0 | "Acme Widgets LON": L0 dx +3, then `collapsed_table_medium_border_insets` dy −2.53 → −5.53 |
| invoice | beta.4 | same cell, enter | dw −10.47 (N0 identical) | **N0 (raw Blitz)** / N0 | "EMITENTE": L0 dx +1.11, then `painted_table_cell_text_baselines` overshoot dy +0.86 → −1.14 |
| notification | pin | `body>table:nth-child(2)>tbody>tr:nth-child(1)>td:nth-child(1)` enter | dy +0.09, dw −48.72 (N0 dx 3, dy 3.09, dw −51.56) | **N0 (raw Blitz)** / N0 | "Acme Serviços Prediais Ltda.": L0 dy +1 |
| notification | beta.4 | same cell, enter | dy +0.09, dw −18.56 (N0 identical) | **N0 (raw Blitz)** / N0 | same run, L0 dy +1 |

The same first boxes and deltas are in the pin agent's independent run
(`fidelity/baselines/pin/fixtures/{invoice,notification}.json` `layoutDiffLayers`): CONFIRMED
reproduced across two runs/agents. The bump made raw Blitz closer to Chrome on both first boxes.

### What the bump regressed, and which layer did it — CONFIRMED (per-layer A/B)

**invoice, price columns (+9.95 pt x).** PDF words (`pdf-probe`, pdftotext, vs Chrome's PDF):
unit-price "32,50" dx +0.92 pt (pin) → **+9.96 pt** (beta.4); total "1.300,00" +0.09 → +9.13 pt;
dy unchanged within 2 pt. Pre-pagination, unit-price text dx trajectory (L0 → … → final):
pin −10.34 → +4.58 (`auto_table_compact_columns`) → +1.58 (`collapsed_table_medium_border_insets_x`);
beta.4 −10.32 → **+13.64** (`auto_table_compact_columns`) → +13.64 (inset_x no longer fires).
Build-to-build decomposition of the +12.06 px: L0 +0.02, `auto_table_compact_columns` +9.03,
`collapsed_table_medium_border_insets_x` +3.00 (all 118 x-changed runs: Σ|part| L0 298.8,
compact 922.7, inset_x 321.0 px). The first item the compact pass regresses at beta.4 is the
"PREÇO UNIT." header (L0 dx −10.33 → +13.63). The pass reacts to a raw-Blitz input change: all 217
changed boxes change first in **N0**; for the first item row, N0 `td:nth-child(1..4)` go from
dx 3/−30.75/−11.56/−6.98, dw −36.75/+16.19/+1.58/+3.98 (pin) to dx 0/−39.75/−17.56/−9.98,
dw −39.75/+22.19/+7.58/+9.98 (beta.4) — the right edge of the unit-price cell is unchanged
(dx+dw −9.98 in both), the cell grows leftwards, and the first column's N0 dx is 0 instead of
3 px; `collapsed_table_medium_border_insets_x` moved these cells −3 px at the pin and 0 at beta.4.
⇒ **The regression vs Chrome is produced by vellora post-layout passes**
(`auto_table_compact_columns`, plus `collapsed_table_medium_border_insets_x` no longer
compensating), **triggered** by a raw-Blitz (N0) column-width change; raw Blitz/Parley text x of
the price cells (L0) is unchanged by the bump. Why the compact pass moves text 9 px further than
the cell box is a HYPOTHESIS to settle in Phase B (read `auto_table_compact_columns`).

**notification, bottom text (~22.5 pt too high).** PDF: "Atenciosamente," dy −7.97 pt (pin) →
**−21.98 pt** (beta.4); "Gerente … Cobrança" −7.62 → −21.61 pt. The final pre-pagination layer
places the signature block identically in both builds (`.signature` box dy +6.5 px; signer text
lines +4.89 pt in both; the only signature box `compare.mjs` reports as changed is the 1 px
`.rule`, dy −1 px in N0). At the pin, N0 had `.signature` at dy +12.5 px and
`vertical_margin_collapse` brought it to +6.5; at beta.4 N0 is already +6.5. ⇒ **Neither raw
Blitz nor a layout_normalize pass: vellora pagination.** Mechanism, CONFIRMED with the scratch
pagination probe
(`pagination-probe/notification.md`; offset = pagination placement − Blitz flow position):

| fragment | pin gap used / flow gap | pin offset | beta.4 gap used / flow gap | beta.4 offset |
|---|---|---|---|---|
| `.body` last `<p>` ("Sendo …") | 14.667 / 14 | −2.33 | 14.667 / 15 | −6.33 |
| `.signature>p` ("Atenciosamente,") | **29.333** / 43 | **−16.00** | **14.667** / 43 | **−34.67** |
| signer lines | 5.333, 0, 0 | −16.00 | 5.333, 0, 0 | −34.66 |

−34.66 px = −26.0 pt and −16 px = −12.0 pt match `pdf-probe`'s independent "added after layout"
(PDF word y vs pre-pagination baseline) for "Mariana …" (−26.04 / −12.04 pt) and, within 0.6 pt
(different measurement bases), for the other bottom lines. The −18.67 px change decomposes into:
1. **−14.667 px**: `emit_wrapper_child_fragments` adds the flattened wrapper's Blitz
   `margin_bottom` to its last child's trailing gap (`pagination.rs:596-600`, the `+=` at line 598). Blitz reports
   `.body` (`body>div:nth-child(5)`) `margin_bottom` 14.667 at the pin (the child `<p>`'s margin
   collapsed through it) and **0 at beta.4** — beta.4's value equals Chromium's computed margin of
   that element (0, `diff.json` `chrome_margin`), i.e. Blitz got more correct and pagination's gap
   model, which depended on the old value, lost 14.667 px.
2. −3 px: the meta table's fragment span shrinks 41 → 38 px (raw Blitz fixed its +6 px height,
   N0 dh +6 → 0); pagination re-stacks heights, so the flow-position fix moves everything after it.
3. −1 px: a 1 px flow gap in `.recipient` becomes 0 (Blitz rounding).

The underlying defect predates the bump (pin is already −12 pt): pagination's inter-fragment gap
is the previous fragment's trailing gap, not the CSS 2.2 §8.3.1 collapsed gap; the flattened
`.signature` wrapper's own `margin-top` (42.667 px) is never used. Fixing it changes PDF bytes,
so it is Phase B. Related observation (CONFIRMED): at the pin, `vertical_margin_collapse`
corrected `.body` dy +6.39 → +0.39; at beta.4 Blitz collapses those margins itself (N0 dy +0.39)
and the pass is a no-op for this document.

The pagination probe is **scratch-only instrumentation** (two `eprintln!` lines inserted by
`pagination-probe/probe_pagination.py` into throw-away checkouts of `2c66544` and `dc535e7`,
reverted and deleted; nothing in `crates/` of this branch contains it). Pagination is therefore
still NOT a committed layer of the dump hook — a gap of the instrumentation, recorded here.

## Determinism — CONFIRMED

- Hook port vs bump-only (`determinism/hook-vs-bump-only.json`): every fixture under `fixtures/`
  (10 fixture/data variants × plain + PDF/A-2b = 20 PDFs) rendered through the production
  `renderPdf` → addon path of `dff3bc6` (bump only) and `dc535e7` (bump + hook port), inputs from
  this checkout: **20/20 byte-identical**; each build also renders each input twice in-process:
  stable 40/40. The port does not change PDF bytes.
- Pin vs beta.4 (`determinism/pin-vs-beta4.json`): **0/20 identical** — the bump changes every
  PDF (expected; it is a layout change). The pin's PDF/A boleto-febraban hash `0af49027…` equals
  the pin run-all's DET-1 value (cross-check of the scratch pin build).

## Tests and lint at this branch

| check | result |
|---|---|
| `cargo test -p vellora-core --no-fail-fast` | 162 passed, **1 failed**: `mixed_weight_inline_siblings_advance_by_the_first_run_width` (whitespace: "LTDA— CNPJ" vs "LTDA — CNPJ"). It fails identically on bump-only `dff3bc6` (CONFIRMED today), so it is the bump. `tests/layout_dump.rs` 6/6 pass at beta.4. Workspace `cargo test` (= `npm run test:rust`) fails only on that test, so **`npm test` fails at this branch because of the bump** (it stops after test:rust). |
| `npm run test:ts` (vitest) | 24 files, 282/282 pass (vitest include globs are `packages/*/…`, no fidelity files) |
| `npm --prefix fidelity test` (node --test) | 205 tests: 202 pass, 3 skipped (opt-in integration); with `VELLORA_ORACLE_INTEGRATION=1` oracles 64/64 pass |
| `npm run lint` | pass (clippy -D warnings, cargo fmt --check, biome check: 263 files) |

## run-all at beta.4 vs the pin baseline (`manifest.json` `comparedTo`, pin run `20261021T054154Z`)

Verdict totals are unchanged in count (all fixtures PASS 124 / FAIL 52 / WARN 4 / NOT-RUN 3;
excluding DIAGNOSTIC 105 / 44 / 4 / 3); 193 verdict rows in both runs; 24/24 detection canaries
caught (8 measurement-only canaries, as at the pin). Status changes (4):

| fixture | criterion | pin → beta.4 | value pin → beta.4 |
|---|---|---|---|
| danfe | DANFE-B3 (bar height, [8, 14.8] mm) | FAIL → PASS | 39.16 → 10.08 mm |
| danfe | DANFE-F4c (≥ 8 pt headings) | PASS → **FAIL** | 3/3 → 2/3 segments: "DOCUMENTO AUXILIAR DA NOTA FISCAL ELETRÔNICA" not found |
| danfe | DANFE-F11 (glyph coverage) | PASS → **FAIL** | 3511/3511 → 3472/3511 glyphs attributed; unattributed sample "DOCUMENTOAUXILIARDANOTAFISCALELETRÔNICA" |
| oss-sparksuite-invoice | INV-I1 (declared `<img>` painted) | FAIL → PASS | 0 → 1 image XObject (the logo is painted at beta.4) |

HYPOTHESIS (not attributed here): the two DANFE losses are the same inter-word whitespace loss as
the failing `mixed_weight_inline_siblings…` cargo test ("LTDA— CNPJ"): the glyphs are present but
the spaces between words are not.

REF-W (word positions vs the Chrome/WeasyPrint consensus, max / p95 mm): invoice 2.44/1.78 →
**3.91/3.78** (worse: the price columns), notification 3.60/3.48 → **8.54/8.42** (worse: the
signature block), boleto 15.15/15.03 → 4.64/2.48, receipt 117.48/55.29 → 101.15/4.06, danfe
157.01/40.23 → 45.69/33.25, text-stress-ptbr 112.6/108.17 → 101.6/97.36, boleto-febraban
122.27/83.01 → 120.78/83.01. Losses also in text extraction (EXT-2 / BOL-X / DANFE-X: e.g.
boleto-febraban pdftotext 13/16 → 11/16 required strings, danfe 24/26 → 22/26) and DANFE-M1
bottom margin 16.55 → 32.72 mm; full list of 45 value changes in `manifest.json`.

WPT (default suites, 8047 reftests, same WPT pin and comparator; `wpt/by-directory.json`):
pass 2578 → **2729** (32.04% → 33.91%; of evaluated 35.93% → 38.01%; clean 1988 → 2213,
24.70% → 27.50%), pass-blank 45 → 37, error 2 → 0. Ratchet vs `baselines/wpt/blitz-2003ba5fc2d8.json`:
**164 regressions** (53 of clean passes, 111 of flagged passes), 6 sightGained, 315 improvements,
3 changed, 7559 unchanged → WPT-2 FAIL by design of the ratchet. Largest directory moves (pass):
CSS2/text +53, CSS2/linebox +30, css-text +29, CSS2/generated-content +18, css-break +15,
CSS2/fonts +12, CSS2/borders +10; losses: CSS2/backgrounds −27, CSS2/abspos −3 (3 → 0),
CSS2/visudet −3, CSS2/floats-clear −3, box-display −2, floats −1, visuren −1. These totals equal
the earlier `git archive` measurement of `dff3bc6` in `fidelity/wpt/README.md` (2729 pass, 164
regressions): reproduced on a real git checkout.

## Files

- `manifest.json`, `fixtures/<key>.json`, `wpt/by-directory.json`,
  `wpt/expectations-blitz-0.3.0-beta.4.json`: same shape as `fidelity/baselines/pin/` (written by
  `extract.mjs`, a label-only copy of the pin's extractor; logic byte-identical). Use
  `layoutDiffLayers.firstBox.finalLayerDelta`, not `layoutDiff.firstBox.finalDelta` (= diagnostic
  B0u layer; known issue recorded by the pin baseline).
- `run-all/summary.json.gz` (gunzip → sha256 `832e66b5…` = `manifest.json` source), `summary.md`,
  `wpt/summary.md`, `corpus/report.md`, `corpus/audit-existing-boleto.json`,
  `layout-diff/summary-run-all.{md,json.gz}` (all 9 fixtures).
- `layout-diff-ab/`: same-day A/B (`pin` = scratch `2c66544` dump, `beta4` = this branch):
  `summary-{pin,beta4}.{md,json.gz}`, `compare-pin-vs-beta4.{md,json.gz}`, per-fixture
  `report.md`, `pdf-probe.json.gz` (4 legacy fixtures), `diff.json.gz` (invoice, notification).
- `determinism/` (script + two results), `pagination-probe/` (scratch probe script, raw stderr,
  annotator, annotated invoice/notification), `cargo-test.txt`.
- Outside this directory: `fidelity/baselines/wpt/blitz-0.3.0-beta.4.json` (written by
  `wpt/run.mjs --update-expectations`; where `--expectations auto` looks for this engine id).

## Gaps and not-run (honest list)

- Pagination/emit have no committed per-layer instrumentation; the probe above is scratch-only.
  DESIGN TARGET: a pagination layer (fragments, gaps, cursor) in the dump hook.
- No Linux / Chrome for Testing run (local Chrome 155.0.8059.85 only).
- layout-diff exits 2 by design: receipt (html_normalize `<div>`-in-`<p>` hoist: 3 self-consistency
  checks) and oss-postmark-receipt (Helvetica not in `FONT_ALIASES`: input parity fails,
  attribution INVALID for that fixture). Both identical at the pin.
- NOT-RUN verdicts (3, same as pin): danfe DANFE-B1 (Code 128 decoding not implemented),
  REF-W for oss-sparksuite-invoice and oss-postmark-receipt (0 consensus words).
- `boleto-febraban.px-grid` has no layout-diff (layout-diff measures data.json only).
- Phase B questions left open (HYPOTHESIS): why `auto_table_compact_columns` shifts right-aligned
  text further than the cell box at beta.4; the DANFE-F4c/F11 and CSS2/backgrounds losses (not
  attributed here).

## pdf-probe v2 re-score (2026-10-21)

`pdf-probe/` now holds pdf-probe semantics 2 sections for boleto, invoice, notification and
receipt (PyMuPDF baselines, position pairs; `fidelity/layout-diff/README.md`, "pdf-probe v2").
The A/B PDFs behind `layout-diff-ab/*-beta4.pdf-probe.json.gz` were not kept, so the PDFs of the
`beta4-gated` run stand in; the evidence (every v1 pair identical) is in `manifest.json
pdfProbeRescore.source.substitute`. `layout-diff-ab/` is unchanged and is the v1 history
(`loadBaselineDir(dir, { pdfProbe: "v1" })`). Details: `fidelity/baselines/port/README.md`,
"pdf-probe v2 re-score".
