# vellora benchmark results

> AUTHORITATIVE — produced in a pinned Linux CI environment.

Env: AMD EPYC 7763 64-Core Processor (4 cores), 16760.34 MB RAM, linux 7.0.0-1017-azure x64, native, Node v22.23.4. Run 2026-10-28T12:33:40.104Z.

| Tool | Version | Mode | Comparable | Package tarballs | Fresh install | Native addon | External binary | Docker image | Cold start | RSS @N | External RSS @N | PDF size | Warm median | Warm p95 | Throughput |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| vellora | 0.1.0-alpha.0 | in-process (public vellora API, no worker/browser) | yes | 98.8 kB ✓ | 39.72 MB ✓ | 33.77 MB ✓ | N/A | N/A | 47.29 ms ✓ | 117.60 MB ✓ | N/A | 44.8 kB ✓ | 19.09 ms ✓ | 23.32 ms ✓ | 51.4/s ✓ |
| Vellora Chromium (environment) | 0.1.0-alpha.0 + 0.1.0-alpha.0 | Vellora optional environment-Chromium engine (direct Chrome/Chromium executable per render) | yes | 104.3 kB | 39.74 MB | 33.77 MB | 412.28 MB | N/A | 735.01 ms | N/A | 6833.96 MB | 156.2 kB | 635.50 ms | 681.03 ms | 1.5/s |
| Puppeteer | 23.6.0 | one Chromium launched once, reused across warm renders | NO (page count 1 != reference 3) | N/A | — | — | N/A | — | 896.69 ms | — | — | — | — | — | — |
| Playwright | 1.48.2 | one Chromium launched once, reused across warm renders | NO (page count 1 != reference 3) | N/A | — | — | N/A | — | 592.42 ms | — | — | — | — | — | — |
| Gotenberg | 8.11.1 | — | NO (adapter pending (tool not installed / render path not landed)) | N/A | — | — | — | — | — | — | — | — | — | — | — |
| WeasyPrint | 62.3 | — | NO (adapter pending (tool not installed / render path not landed)) | N/A | — | — | — | — | — | — | — | — | — | — | — |

## Axes where vellora is NOT the winner
- (none yet — or vellora not yet measured; see Comparable column)

## External reference (UNVERIFIED)
- pdf4.dev: "~3ms warm render" — UNVERIFIED — vendor benchmark with a known subprocess-per-render flaw; not a trusted datum. Compared only against vellora warm distribution only; never quoted as fact.
