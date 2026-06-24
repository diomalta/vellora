# vellora benchmark suite

A reproducible, version-pinned HTML→PDF benchmark that measures vellora against
Puppeteer, Playwright, Gotenberg, and WeasyPrint on **equivalent output**, on
the five axes that back vellora's README claims.

> **Status: scaffold — no numbers published yet.** The methodology, adapters,
> equivalence verifier, measurement, statistics, and reporting are implemented
> here. Actual **execution** (installing Puppeteer/Playwright browsers, pulling
> the Gotenberg image, installing WeasyPrint, and running) happens in CI on a
> pinned Linux container. Until that CI job runs, `benchmarks/results/` holds no
> authoritative data. vellora's own adapter is additionally gated behind the
> render path (`core-render-invoice` / `native-render-bridge`) landing.

This suite lives under `benchmarks/` with its **own `package.json`** so that
competitor dependencies (Puppeteer, Playwright) never enter the dependency graph
of any published vellora package.

## The single reproduction command

```bash
# from the repo root
node benchmarks/run.mjs
```

That one command orchestrates: adapters (long-lived mode) → equivalence check →
the five-axis measurement → median/p95 statistics → report. It writes
machine-readable results to `benchmarks/results/results-<timestamp>.json` (plus
a stable `latest.json` / `latest.md`) and prints the human-readable table.

Tunables (env): `BENCH_CONCURRENCY` (N for the RSS axis), `BENCH_WARM_RUNS`
(samples for median/p95), `BENCH_WARMUP_RUNS`.

### Out-of-band setup the run expects

The Node-native tools (vellora, Puppeteer, Playwright) come from
`benchmarks/package.json`. The other two are installed out-of-band; if they are
absent the runner records them as **pending** (never as a fabricated number):

- **Gotenberg** (standing HTTP service):
  `docker run --rm -p 3000:3000 gotenberg/gotenberg:8.11.1`
  (override the URL with `GOTENBERG_URL`).
- **WeasyPrint** (in-process Python worker): `pip install weasyprint==62.3`
  (the adapter drives `adapters/weasyprint_worker.py`; set `PYTHON` if needed).

## The five axes

1. **Docker image size** — recorded as **N/A with a reason** for in-process
   libraries (vellora, WeasyPrint-in-worker); measured from the pinned image for
   containerized tools.
2. **Cold start** — the **first** render after a fresh process/browser, reported
   separately from warm.
3. **RSS under concurrency N** — peak resident memory while N renders run
   concurrently (for the standing service, the relevant RSS lives in the
   container and is recorded as N/A here, measured separately in CI).
4. **PDF output size** — bytes of the equivalent render. The architecturally
   defensible differentiator (Chromium engines embed full fonts / rasterize).
5. **Throughput** — documents/second over the warm run set.

## Fairness rules (non-negotiable)

These are the rules that let the numbers survive a hostile technical audience:

- **Equivalent output, verified before timing.** Every tool renders the same
  neutral invoice fixture (`fixtures/invoice`); the produced PDF must match the
  baseline **page count + expected content** before any timing is recorded. A
  tool that cannot produce the equivalent document is flagged **not-comparable**
  and excluded from the head-to-head — never silently timed against a different
  document. (Equivalence is semantic, not byte-identity.)
- **Intended long-lived mode for every competitor — never subprocess-per-render.**
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

The **authoritative** numbers come from the **pinned Linux CI container** —
that is the real deployment surface (Lambda / containers), and containers run
materially slower than native macOS. A run on a native macOS host is **labeled
indicative-only** by the harness (`env.indicativeOnly`) and must not be
published as authoritative.

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
    vellora.mjs        public `vellora` API, in-process (gated on render path)
    puppeteer.mjs      one browser reused across renders
    playwright.mjs     one browser reused across renders
    gotenberg.mjs      standing HTTP service over the network
    weasyprint.mjs     warm long-lived Python worker (drives weasyprint_worker.py)
    weasyprint_worker.py
  lib/
    equivalence.mjs    page-count + content verification before timing
    measure.mjs        the five axes
    stats.mjs          median + p95; environment capture
    report.mjs         machine-readable JSON + human-readable table (flags vellora's non-wins)
  results/             committed results (.gitkeep until the CI run lands)
```
