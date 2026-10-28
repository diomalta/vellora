# Phase D: Linux arm64 gated run in local Docker (2026-10-28)

Branch `phased/linux-local` from `feat/blitz-beta4-fidelity` b5c9546 (the c06 strict contract
PASS on macOS, run 20261028T084519Z). Gated source 6bcc257 = b5c9546 + `fidelity/linux/` only (no
product change). The run records 1 dirty entry: the untracked `scripts/` of this snapshot.

**Verdict on Linux: REFUSED, exit 2.** Not because vellora renders differently: **vellora's output
is byte-identical across the two hosts**. Chrome, the reference, is not: its Linux PDFs move words
by up to 0.123 pt, and it draws the `@page` margin-box footer in a different fallback font. Every
committed pdf-probe and doc-aggregate baseline was measured with macOS Chrome, so the gate refuses
the comparison as designed.

## Environment

| | value |
|---|---|
| host | darwin 27.0.0 arm64, Apple M5 Pro, OrbStack (Docker 29.8.2, 18 CPUs, 15.66 GiB VM) |
| container | `fidelity/linux/Dockerfile` at 6bcc257, local image `vellora-fidelity-linux:155` 17455593, linux/arm64, kernel 7.2.12-orbstack |
| base | `debian:trixie-slim@sha256:89c1ea91…4b31` (Debian 13.7) |
| toolchain | Node v22.23.2, rustc 1.96.0 (ac68faa20 2026-05-25), Python 3.12.13 (uv 0.11.10) |
| Chrome | Chrome for Testing 155.0.8059.85 linux-arm64, `/opt/chrome/chrome` (sha256 e5cb7cb9…70ce) |
| poppler | 25.03.0 (Debian; the macOS run used Homebrew 26.06.0) |
| fonts in the container | fonts-dejavu-core 2.37-8, fonts-dejavu-mono 2.37-8 (pulled in by fontconfig; nothing else) |
| tools image | `vellora-fidelity-tools:baseline-beta4` **502dd931** (the macOS run used c405e06c; see "Incident") |
| veraPDF image | 45b2f7cd (same digest as macOS), amd64 under emulation |
| WPT | 9d8aceec; `--chrome-from` the 10-tip run (macOS Chrome outcomes, by the chain convention) |
| addon | `vellora.linux-arm64-gnu.node` sha256 e781d321…efc4 |

linux/amd64: not run. The Dockerfile carries the amd64 sums, but a release build plus a `--raw`
WPT run (2 x 8047 renders) under emulation did not fit the 90 min time box (UNVERIFIED how long it
would take).

## Commands

```sh
docker build --platform linux/arm64 -f fidelity/linux/Dockerfile -t vellora-fidelity-linux:155 fidelity/linux
bash fidelity/linux/run.sh setup        # npm ci, npm run build, fidelity installs, WPT checkout
VELLORA_LINUX_RO=~/Repositories/vellora-fidelity-runs bash fidelity/linux/run.sh gate \
  --gate --raw --main --contract --chrome /opt/chrome/chrome \
  --baseline fidelity/baselines/port/11-phase-c \
  --chrome-from ~/Repositories/vellora-fidelity-runs/run-all-10-tip-20261023T004536Z-blitz-0.3.0-beta.4-vellora-a293cf5/wpt/results.json \
  --tools-image vellora-fidelity-tools:baseline-beta4 \
  --accept fidelity/gate/snapshots/2026-10-28/c06/accepted.json --step 16-linux-arm64 \
  --out fidelity/results/run-all/linux-arm64
```

(Inside the container the paths were given absolute; `~` is the host home.)

- **runId 20261028T113714Z**, git 6bcc257, exit 2 (REFUSED). 11/11 preflight ok, 23/23 steps ok,
  crashtests 239/239 ok, canaries 35/35 detection caught (+8 measurement-only). Verdict rows PASS
  140, FAIL 15, WARN 5, NOT-RUN 3 (macOS: 143/12/5/3; the 3 extra FAILs are the REF-W rows below).
  Copy: `~/Repositories/vellora-fidelity-runs/run-all-linux-arm64-20261028T113714Z-blitz-0.3.0-beta.4-vellora-6bcc257`
  (with `linux-env/`: env.txt incl. `dpkg-query`, setup and gate logs, the comparison JSONs).
- **npm test / npm --prefix fidelity test (step 2)**: run as the gate's `code-checks` step: cargo
  test, vitest (25 files, 287 tests), lint (clippy -D warnings, cargo fmt, biome) and the fidelity
  self-tests, all exit 0. Not run a second time standalone.

## Exit contract on Linux, per condition

| condition | status on Linux | numbers | macOS c06 |
|---|---|---|---|
| (1) pin --main: 0 (c) | **NOT MET** | (a) 5, (b) 4, **(c) 1**: `invoice\|REF-W\|oracles:layout\|plain\|criterion#1\|maxMm` 2.44 -> 2.96 mm | MET, (c) 0 |
| (2) doc aggregate >= pin per fixture | **REFUSED** (gate's condition-2 check PASS, docRegressions 0) | 7/9 fixtures: `chromeGeometrySha256 differs from the pin's` (the pin was scored on macOS Chrome) | MET 9/9 |
| (3) pages == Chrome | **MET 9/9** | contractPagesFailing 0 | MET 9/9 |
| (4) previous-link ratchets | **NOT MET vs 11-phase-c / REFUSED** | vs 11-phase-c: gating 6 (below), within tolerance 2; head vs 00-start: gating 0, debt 5 | MET |
| refusal | pdf-probe | `Chrome reference words differ for boleto (sha256 6045d6f5c8cb vs 8d75e7acfe92)` (previous link, head and pin) | none |

The 6 gating items are 3 metrics x 3 fixtures: REF-W `boleto`, `invoice`, `receipt` status PASS ->
FAIL and maxMm 0.35/0.36/0.36 -> 2.96 mm. All three are the Chrome footer below (CONFIRMED: the
vellora PDFs of the three fixtures are byte-identical to macOS; only the reference moved).

## vellora across hosts (DET across OS)

`scripts/xos-compare.py <macOS run copy> <Linux run>` (sha256 of every PDF outside `wpt/`):

- **vellora PDFs: 94 of 98 byte-identical**, including all 9 fixtures' `layout-diff/<fixture>/run-all/vellora.pdf`,
  every corpus render, the PDF/A renders and the probe fixtures. CONFIRMED.
- The other 4 are the pdf-probe canary mutation PDFs (`oracles/fixtures/canaries/pdf-probe/*`),
  the same 4 that differ between macOS runs c03 -> c04 -> c05 -> c06 (same size, all caught).
  Not a cross-OS effect.
- So no font, float-math or shaping difference reaches vellora's output: it uses only bundled
  fonts and no host font fallback (DET-1 holds across macOS arm64 and Linux arm64). Not measured:
  x86_64 (different float codegen; the open question for CI).
- WPT, rendered by vellora on Linux: **4545 passes of 8047, 0 per-test outcome changes** against
  the macOS c06 run (`results`), raw Blitz outcomes 4110 passes, 0 changes (`rawOutcomes`), 524
  suspect passes, identical. inkCheck and comparison settings identical.

## Chrome across hosts (the reference changes)

`scripts/chrome-words.py` (PyMuPDF words of all 70 Chrome PDFs pairs; JSON in the run copy):

1. **Bytes**: 70/70 differ; always at least the Creator UA string (`Macintosh; Intel Mac OS X
   10_15_7` vs `X11; Linux x86_64`, 15 bytes) and the CreationDate. Never byte-comparable.
2. **Shaping/positioning**: with the same embedded Liberation fonts, Linux Chrome moves word boxes
   horizontally by at most **0.123 pt (0.043 mm)**, dy 0 (danfe 328/630 words moved, max 0.064 pt;
   text-stress 958/1827, 0.123; boleto-febraban 71/315, 0.107). Below every position tolerance,
   but it changes `chromeGeometrySha256` and the pdf-probe reference hash, which is why the gate
   refuses. HYPOTHESIS: Skia's glyph advance rounding differs between the CoreText (macOS) and
   FreeType (Linux) font backends; not checked in Chrome's source.
3. **@page margin-box footer font**: "Página N de M" is drawn with Chrome's default font, not
   through the reference alias table. On macOS it is **Times-Roman** in all four legacy fixtures
   and `probe-f5_allowance_footer`. On Linux it is **DejaVuSans** in invoice, receipt and boleto
   (DejaVu is the only system font in the container), and **LiberationSerif** in notification and
   `probe-f5_allowance_footer`, where the page itself loads that face: same x, word box 1.69 pt
   taller (font metrics), no REF-W effect. Why Chrome picks the document's face in two fixtures
   and DejaVu in the other three is UNVERIFIED. The footer starts 8.35 pt (2.94 mm) further left on Linux (invoice p1: x 264.96 ->
   256.62 pt, baseline 822.75 -> 823.5). vellora draws it in Liberation Serif at x 264.86 on both
   hosts (0.1 pt from macOS Chrome). On Linux, Chrome and WeasyPrint (also DejaVu) now agree within
   2 pt, so these words enter REF-W's consensus set (invoice 230 -> 239 words) and give the 2.96 mm.
   The canaries' Chrome renders change too (Helvetica -> DejaVuSans, Menlo -> DejaVuSansMono;
   measurement-only rows, still all caught).

Doc aggregate per fixture (`doc-aggregate/summary.json` of both runs):

| fixture | pages (Chrome) mac / linux | median mm mac / linux | p90 mm mac / linux | <=1 mm % mac / linux | missing mac / linux | vellora PDF same | Chrome geometry same |
|---|---|---|---|---|---|---|---|
| invoice | 3 (3) / 3 (3) | 0.1 / 0.09 | 0.28 / 0.28 | 100 / 98.9 | 0 / 0 | yes | no |
| receipt | 2 (2) / 2 (2) | 0.05 / 0.06 | 0.11 / 0.15 | 100 / 97.4 | 0 / 0 | yes | no |
| boleto | 1 (1) / 1 (1) | 0.12 / 0.12 | 0.2 / 0.29 | 100 / 99.3 | 0 / 0 | yes | no |
| notification | 1 (1) / 1 (1) | 0.01 / 0.01 | 0.09 / 0.12 | 100 / 100 | 0 / 0 | yes | no |
| boleto-febraban | 1 (1) / 1 (1) | 0.08 / 0.08 | 0.28 / 0.28 | 100 / 100 | 0 / 0 | yes | no |
| danfe | 1 (1) / 1 (1) | 0.21 / 0.21 | 0.27 / 0.27 | 100 / 100 | 0 / 0 | yes | no |
| text-stress-ptbr | 7 (7) / 7 (7) | 0.02 / 0.02 | 0.27 / 0.27 | 100 / 100 | 0 / 0 | yes | no |
| oss-sparksuite-invoice | 1 (1) / 1 (1) | 0 / 0 | 0 / 0 | 100 / 100 | 0 / 0 | yes | yes |
| oss-postmark-receipt | 2 (2) / 2 (2) | 0.13 / 0.13 | 0.14 / 0.14 | 97.2 / 97.2 | 2 / 2 | yes | yes |

The <=1 mm drops on invoice/receipt/boleto are the footer words (point 3).

Not measured here: Linux Chrome's WPT outcomes. By the chain convention `--chrome-from` reuses the
macOS Chrome outcomes and ink data; a live `--wpt-chrome` run (about 9 more minutes) would measure
them, as a measure-only run (its ink data would not match this baseline's inkCheck).

## What it would take to gate on Linux (not done; decisions for the orchestrator)

- The fonts: HYPOTHESIS: installing fonts-liberation in the container (fontconfig's metric aliases
  map Times/Helvetica/Courier to Liberation Serif/Sans/Mono) would give Chrome's default font the
  Times metrics on Linux and remove the 2.96 mm footer items. Changes the reference environment, so
  it needs a re-run to confirm; not tried in the time box.
- The 0.1 pt shaping drift cannot be removed by fonts: a Linux gate needs Linux-measured baselines
  (pdf-probe, doc-aggregate pin re-score with `doc-aggregate-pin.mjs`, as the refusal says) or one
  host chosen as the authoritative reference. The README rule "the pinned Linux CI run is
  authoritative" would make it Linux, which means re-measuring the chain head's references there.

## Incident during the run

The first gated attempt (runId kept as `run-all-linux-arm64-images-pruned-20261028-REFUSED-not-comparable`
in the run store) lost both oracle images mid-run: the host's Docker images went from 51 to 20 and
the build cache to 0 B while it ran (a prune outside this task; no image events were retained).
51 rows went NOT-RUN. `vellora-fidelity-tools:baseline-beta4` was rebuilt from the committed recipe
(new ID 502dd931; the recipe pins every apt and pip version, but the image ID is not reproducible)
and veraPDF re-pulled by digest (same ID 45b2f7cd); the run above is the second attempt.
Two setup fixes were needed first (in `fidelity/linux/`, 6bcc257): a TMPDIR inside the checkout
failed 3 fidelity self-tests that need a temp dir outside any git repo, and 18 parallel debug links
were OOM-killed (ld signal 9), so cargo runs with 8 jobs.
