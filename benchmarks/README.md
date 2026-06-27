# vellora benchmark suite

A reproducible, version-pinned HTML→PDF benchmark that measures vellora native,
Vellora Chromium, Puppeteer, Playwright, Gotenberg, and WeasyPrint on
**equivalent output**, on the claim-backing axes that back vellora's README.

> **Status: scaffold — no numbers published yet.** The methodology, adapters,
> equivalence verifier, measurement, statistics, and reporting are implemented
> here. Actual **execution** (installing Puppeteer/Playwright browsers, pulling
> the Gotenberg image, installing WeasyPrint when in scope, and running) happens
> in CI on a pinned Linux environment. Until that CI job runs,
> `benchmarks/results/` holds no
> authoritative data. vellora's own adapter is additionally gated behind the
> full render path landing.

This suite lives under `benchmarks/` with its **own `package.json`** so that
competitor dependencies (Puppeteer, Playwright) never enter the dependency graph
of any published vellora package.

## The single reproduction command

```bash
# from the repo root
node benchmarks/run.mjs
```

That one command orchestrates: adapters (declared mode) → package and runtime footprint →
equivalence check → resource measurement → median/p95 statistics → report. It writes
machine-readable results to `benchmarks/results/results-<timestamp>.json` (plus
a stable `latest.json` / `latest.md`) and prints the human-readable table.

Tunables (env): `BENCH_CONCURRENCY` (N for the RSS axis), `BENCH_WARM_RUNS`
(samples for median/p95), `BENCH_WARMUP_RUNS`.

### Out-of-band setup the run expects

The Node-native tools (vellora, Vellora Chromium package, Puppeteer, Playwright)
come from the workspace and `benchmarks/package.json`. The other runtime pieces are
installed out-of-band; if they are absent the runner records them as **pending**
(never as a fabricated number):

- **Gotenberg** (standing HTTP service):
  `docker run --rm -p 3000:3000 gotenberg/gotenberg:8.11.1`
  (override the URL with `GOTENBERG_URL`).
- **WeasyPrint** (in-process Python worker): `pip install weasyprint==62.3`
  (the adapter drives `adapters/weasyprint_worker.py`; set `PYTHON` if needed).
- **Environment Chromium** for `@vellora/engine-chromium`: set
  `VELLORA_CHROMIUM_EXECUTABLE` or make `chromium` available on `PATH`.

## The axes

1. **Package tarballs** — `npm pack --dry-run --json` for the Vellora package tier
   used by each Vellora record.
2. **Fresh install** — a temporary app installs local package tarballs and measures
   `node_modules`; if the current-platform native prebuild package has not been
   materialized, that omission is recorded and the native addon is measured separately.
3. **Native addon size** — current-platform `.node` size for Vellora tiers.
4. **External binary size/version** — Chrome/Chromium executable metadata for the
   optional environment-Chromium tier.
5. **Docker image size** — recorded as **N/A with a reason** when a tool is not
   represented by a standalone service image; measured from the pinned image for
   containerized tools.
6. **Cold start** — the **first** render after a fresh process/browser, reported
   separately from warm.
7. **RSS under concurrency N** — peak resident memory while N renders run
   concurrently. Browser-backed tools report client-process RSS as N/A and use a
   separate external-process RSS axis when an adapter exposes a sampler.
8. **PDF output size** — bytes of the equivalent render. The architecturally
   defensible differentiator (Chromium engines embed full fonts / rasterize).
9. **Throughput** — documents/second over the warm run set.

## Fairness rules (non-negotiable)

These are the rules that let the numbers survive a hostile technical audience:

- **Equivalent output, verified before timing.** Every tool renders the same
  neutral invoice fixture (`fixtures/invoice`); the produced PDF must match the
  baseline **page count + expected content** before any timing is recorded. A
  tool that cannot produce the equivalent document is flagged **not-comparable**
  and excluded from the head-to-head — never silently timed against a different
  document. (Equivalence is semantic, not byte-identity.)
- **Declared mode is reported, never hidden.**
  - Vellora native: in-process.
  - Vellora Chromium: direct browser executable per render in the current adapter.
  - Puppeteer / Playwright: **one** browser launched once, reused across warm
    renders.
  - Gotenberg: driven as a **standing HTTP service**.
  - **WeasyPrint: rendered in-process inside a warm, long-lived Python worker**
    (single import, many renders). Subprocess-per-render was the pdf4.dev
    methodology flaw — it measures interpreter startup, not rendering — and we
    refuse to reproduce it even in our favor.
  Each adapter records the actual long-lived mode it used.
- **Median AND p95 over N warm runs — never best-of-N.** Best-of-N (the min)
  hides tail latency; it is retained only as a clearly non-headline field.
  **Cold and warm are reported separately.**
- **Pinned versions + recorded environment.** Every tool version is pinned (see
  `config.mjs` / `package.json`) and captured into the results alongside CPU,
  cores, RAM, OS/kernel, container-vs-native, and the run date — so a number is
  interpretable and reproducible, not a context-free "fast".
- **Honest reporting, losses included.** The table shows **every** axis for
  **every** tool and explicitly **flags every axis where vellora is not the
  winner**. No axis is filtered to hide a vellora loss.

## Authoritative vs indicative

The **authoritative** numbers come from the **pinned Linux CI environment** —
that is the real deployment surface for Lambda/container-style deployments. A
run on a native macOS host is **labeled indicative-only** by the harness
(`env.indicativeOnly`) and must not be published as authoritative.

The authoritative workflow is
[`.github/workflows/resource-benchmarks.yml`](../.github/workflows/resource-benchmarks.yml).
It builds the workspace, materializes the current Linux prebuild package for
install-size measurement, installs benchmark Chromium, runs the suite with
`BENCH_AUTHORITATIVE=1`, and uploads `benchmarks/results/latest.json` /
`latest.md` as artifacts.

## Visual fidelity harness

For layout-quality work, run the visual harness against Puppeteer:

```bash
npm --prefix benchmarks install
npm run build
npm run visual:fidelity -- --fixtures invoice,boleto
```

The harness renders the same finalized HTML through vellora and the selected
reference renderer, rasterizes both PDFs with `pdftoppm`, then writes
side-by-side PNGs, a red pixel-diff overlay, and region-level metrics to
`benchmarks/results/visual-fidelity/index.html`.

To regenerate README-ready assets that compare native vellora against the
optional environment-Chromium engine:

```bash
PUPPETEER_EXECUTABLE_PATH=/path/to/chrome \
VELLORA_CHROMIUM_EXECUTABLE=/path/to/chrome \
npm run visual:fidelity -- \
  --fixtures invoice,boleto \
  --reference chromium \
  --subject vellora \
  --out docs/assets/visual-evidence \
  --dpi 96
```

For text-position debugging after a visual run, compare PDF word boxes:

```bash
npm run geometry:fidelity -- --fixture invoice --page 1
```

Useful options:

- `--fixture invoice` or `--fixtures invoice,boleto,receipt,notification`
- `--reference puppeteer|chromium|vellora`
- `--subject vellora|chromium|puppeteer`
- `--dpi 144` to control raster density
- `--threshold 12` to control per-channel pixel mismatch sensitivity
- `--fail-on-mismatch 0.02` to turn the run into a gate

## The pdf4.dev "~3 ms warm" figure

Treated as an **unverified external bar**, not a fact: pdf4.dev is a vendor
benchmark with a known subprocess-per-render flaw. It is **only** ever compared
against vellora's own warm distribution and is never quoted as a trusted datum.

## Layout

```
benchmarks/
  package.json         private; pins Puppeteer + Playwright; documents Gotenberg image + WeasyPrint version
  config.mjs           tool set, concurrency N, run count, equivalence baseline (fixtures/invoice)
  run.mjs              the single end-to-end entry / reproduction command
  adapters/
    vellora.mjs        public `vellora` API, in-process (gated on the render path)
    vellora-chromium.mjs
    puppeteer.mjs      one browser reused across renders
    playwright.mjs     one browser reused across renders
    gotenberg.mjs      standing HTTP service over the network
    weasyprint.mjs     warm long-lived Python worker (drives weasyprint_worker.py)
    weasyprint_worker.py
  lib/
    equivalence.mjs    page-count + content verification before timing
    measure.mjs        package/runtime footprint plus timing/resource axes
    stats.mjs          median + p95; environment capture
    report.mjs         machine-readable JSON + human-readable table (flags vellora's non-wins)
  results/             committed results (.gitkeep until the CI run lands)
```
