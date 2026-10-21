# Fidelity gate report

**Verdict: PASS** (0 gating item(s)). Local macOS runs are INDICATIVE.

| field | value |
|---|---|
| date | 2026-10-21T15:52:40.862Z |
| command | `node fidelity/gate/run.mjs --baseline fidelity/baselines/port/05-walk-rewrite --run fidelity/results/run-all/06-page-rules --accept fidelity/results/run-all/06-page-rules/accepted.json --out fidelity/results/run-all/06-page-rules/gate` |
| baseline | fidelity/baselines/port/05-walk-rewrite (vellora-fidelity/baseline/2) |
| run | fidelity/results/run-all/06-page-rules (vellora-fidelity/run-all/1) |
| os / cpu | darwin 27.0.0 arm64 (macOS 27.0.1) / Apple M5 Pro |
| node / rustc | v22.23.2 / rustc 1.96.0 (ac68faa20 2026-05-25) |
| chrome | Google Chrome 155.0.8059.85 |
| blitz | 0.3.0-beta.4 registry+https://github.com/rust-lang/crates.io-index |
| git | phaseb/06-page-rules c9fe9f59755c78bbea05e7f2b7c434f103389799 (0 dirty) |

Counts: improvement 37, changed 10, reported 1, accepted 13, gating 0, unchanged 15444, withinTolerance 0.

## Absolute failures of the run (gate, cannot be accepted)

none

## Regressions beyond tolerance (gate)

none outside WPT

## Accepted regressions (acceptedRegressions, with evidence)

| group | key | before | after | tolerance | detail |
|---|---|---|---|---|---|
| wpt css/css-page | `wpt\|css/css-page/page-size-015-print.tentative.html` | pass | fail |  | pass -> fail (clean pass lost) — ACCEPTED: pass -> fail. Fits GATE-A1 (FALSE PASS): the old test equalled its reference only because both lost their page size. Chrome prints test AND reference at 540 x 432 pt (7.5in x 6in, the tentative @page width/height descriptors). Old vellora printed both at 360 x 216 pt (the 5in x 3in UA box): its @page reader did not strip the CSS comment in front of the test's `size: 1234px`, so it read the property name '/* ... */ size' and dropped the declaration; the reference has no size. Now comments are stripped and the test gets `size: 1234px` (925.5 x 925.5 pt, CSS Paged Media 3), the reference keeps 360 x 216; vellora does not implement the tentative width/height descriptors (follow-up). (evidence: pdfinfo page sizes: Chrome with the WPT harness print geometry, vellora old = step-05 addon sha256 0211dcfb... with the step-05 injection, new = c9fe9f5; Chrome 155.0.8059.85 local macOS (INDICATIVE), 2026-10-21; old = port/05 run 20261021T142201Z (e9dc7e4), new = port/06 run of c9fe9f5; numbers: attachments/accepted-evidence.json; label legend: baselines/port/README.md (06-page-rules)) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|de#33\|dx` | 200.64 | 202.42 | 1 pdf-probe-pt | "de" \|dx\| 200.64 -> 202.42 pt vs Chrome — ACCEPTED: Fits GATE-A1 (oracle artefact): the k-th-occurrence pair is two different word instances. vellora's de#33 is the page-2 FOOTER 'de' (306.55, 813.58) pt; the Chrome word it is paired with is a BODY 'de' at (104.13, 530.06) pt (vellora 8 pages vs Chrome 7, and the extractor emits the footers at different occurrence positions). The dx change (200.64 -> 202.42 pt) is the footer moving to where Chrome draws it: by position, page-2 footer 'de' vs Chrome's (307.12, 812.51) pt went \|dx\| 2.35 -> 0.57 pt, \|dy(yMin)\| 1.02 -> 1.07 pt (yMin carries each producer's declared ascent, step 04; PyMuPDF baseline of the 8pt Liberation Sans footer: Chrome 819.75, vellora 819.41 pt). (evidence: pdftotext 26.06.0 -bbox of layout-diff text-stress-ptbr chrome.pdf / vellora.pdf of both runs; Chrome 155.0.8059.85 local macOS (INDICATIVE), 2026-10-21; old = port/05 run 20261021T142201Z (e9dc7e4), new = port/06 run of c9fe9f5; numbers: attachments/accepted-evidence.json; label legend: baselines/port/README.md (06-page-rules)) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|de#33\|dy` | 281.44 | 283.52 | 1 pdf-probe-pt | "de" \|dy\| 281.44 -> 283.52 pt vs Chrome — ACCEPTED: Fits GATE-A1 (oracle artefact): the k-th-occurrence pair is two different word instances. vellora's de#33 is the page-2 FOOTER 'de' (306.55, 813.58) pt; the Chrome word it is paired with is a BODY 'de' at (104.13, 530.06) pt (vellora 8 pages vs Chrome 7, and the extractor emits the footers at different occurrence positions). The dy change (281.44 -> 283.52 pt) is the footer moving to where Chrome draws it: by position, page-2 footer 'de' vs Chrome's (307.12, 812.51) pt went \|dx\| 2.35 -> 0.57 pt, \|dy(yMin)\| 1.02 -> 1.07 pt (yMin carries each producer's declared ascent, step 04; PyMuPDF baseline of the 8pt Liberation Sans footer: Chrome 819.75, vellora 819.41 pt). (evidence: pdftotext 26.06.0 -bbox of layout-diff text-stress-ptbr chrome.pdf / vellora.pdf of both runs; Chrome 155.0.8059.85 local macOS (INDICATIVE), 2026-10-21; old = port/05 run 20261021T142201Z (e9dc7e4), new = port/06 run of c9fe9f5; numbers: attachments/accepted-evidence.json; label legend: baselines/port/README.md (06-page-rules)) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|de#61\|dx` | 200.64 | 202.42 | 1 pdf-probe-pt | "de" \|dx\| 200.64 -> 202.42 pt vs Chrome — ACCEPTED: Fits GATE-A1 (oracle artefact): the k-th-occurrence pair is two different word instances. vellora's de#61 is the page-3 FOOTER 'de' (306.55, 813.58) pt; the Chrome word it is paired with is a BODY 'de' at (104.13, 293.06) pt (vellora 8 pages vs Chrome 7, and the extractor emits the footers at different occurrence positions). The dx change (200.64 -> 202.42 pt) is the footer moving to where Chrome draws it: by position, page-3 footer 'de' vs Chrome's (307.12, 812.51) pt went \|dx\| 2.35 -> 0.57 pt, \|dy(yMin)\| 1.02 -> 1.07 pt (yMin carries each producer's declared ascent, step 04; PyMuPDF baseline of the 8pt Liberation Sans footer: Chrome 819.75, vellora 819.41 pt). (evidence: pdftotext 26.06.0 -bbox of layout-diff text-stress-ptbr chrome.pdf / vellora.pdf of both runs; Chrome 155.0.8059.85 local macOS (INDICATIVE), 2026-10-21; old = port/05 run 20261021T142201Z (e9dc7e4), new = port/06 run of c9fe9f5; numbers: attachments/accepted-evidence.json; label legend: baselines/port/README.md (06-page-rules)) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|de#61\|dy` | 518.44 | 520.52 | 1 pdf-probe-pt | "de" \|dy\| 518.44 -> 520.52 pt vs Chrome — ACCEPTED: Fits GATE-A1 (oracle artefact): the k-th-occurrence pair is two different word instances. vellora's de#61 is the page-3 FOOTER 'de' (306.55, 813.58) pt; the Chrome word it is paired with is a BODY 'de' at (104.13, 293.06) pt (vellora 8 pages vs Chrome 7, and the extractor emits the footers at different occurrence positions). The dy change (518.44 -> 520.52 pt) is the footer moving to where Chrome draws it: by position, page-3 footer 'de' vs Chrome's (307.12, 812.51) pt went \|dx\| 2.35 -> 0.57 pt, \|dy(yMin)\| 1.02 -> 1.07 pt (yMin carries each producer's declared ascent, step 04; PyMuPDF baseline of the 8pt Liberation Sans footer: Chrome 819.75, vellora 819.41 pt). (evidence: pdftotext 26.06.0 -bbox of layout-diff text-stress-ptbr chrome.pdf / vellora.pdf of both runs; Chrome 155.0.8059.85 local macOS (INDICATIVE), 2026-10-21; old = port/05 run 20261021T142201Z (e9dc7e4), new = port/06 run of c9fe9f5; numbers: attachments/accepted-evidence.json; label legend: baselines/port/README.md (06-page-rules)) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|de#87\|dx` | 200.64 | 202.42 | 1 pdf-probe-pt | "de" \|dx\| 200.64 -> 202.42 pt vs Chrome — ACCEPTED: Fits GATE-A1 (oracle artefact): the k-th-occurrence pair is two different word instances. vellora's de#87 is the page-4 FOOTER 'de' (306.55, 813.58) pt; the Chrome word it is paired with is a BODY 'de' at (104.13, 316.31) pt (vellora 8 pages vs Chrome 7, and the extractor emits the footers at different occurrence positions). The dx change (200.64 -> 202.42 pt) is the footer moving to where Chrome draws it: by position, page-4 footer 'de' vs Chrome's (307.12, 812.51) pt went \|dx\| 2.35 -> 0.57 pt, \|dy(yMin)\| 1.02 -> 1.07 pt (yMin carries each producer's declared ascent, step 04; PyMuPDF baseline of the 8pt Liberation Sans footer: Chrome 819.75, vellora 819.41 pt). (evidence: pdftotext 26.06.0 -bbox of layout-diff text-stress-ptbr chrome.pdf / vellora.pdf of both runs; Chrome 155.0.8059.85 local macOS (INDICATIVE), 2026-10-21; old = port/05 run 20261021T142201Z (e9dc7e4), new = port/06 run of c9fe9f5; numbers: attachments/accepted-evidence.json; label legend: baselines/port/README.md (06-page-rules)) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|de#87\|dy` | 495.19 | 497.27 | 1 pdf-probe-pt | "de" \|dy\| 495.19 -> 497.27 pt vs Chrome — ACCEPTED: Fits GATE-A1 (oracle artefact): the k-th-occurrence pair is two different word instances. vellora's de#87 is the page-4 FOOTER 'de' (306.55, 813.58) pt; the Chrome word it is paired with is a BODY 'de' at (104.13, 316.31) pt (vellora 8 pages vs Chrome 7, and the extractor emits the footers at different occurrence positions). The dy change (495.19 -> 497.27 pt) is the footer moving to where Chrome draws it: by position, page-4 footer 'de' vs Chrome's (307.12, 812.51) pt went \|dx\| 2.35 -> 0.57 pt, \|dy(yMin)\| 1.02 -> 1.07 pt (yMin carries each producer's declared ascent, step 04; PyMuPDF baseline of the 8pt Liberation Sans footer: Chrome 819.75, vellora 819.41 pt). (evidence: pdftotext 26.06.0 -bbox of layout-diff text-stress-ptbr chrome.pdf / vellora.pdf of both runs; Chrome 155.0.8059.85 local macOS (INDICATIVE), 2026-10-21; old = port/05 run 20261021T142201Z (e9dc7e4), new = port/06 run of c9fe9f5; numbers: attachments/accepted-evidence.json; label legend: baselines/port/README.md (06-page-rules)) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|de#115\|dx` | 200.64 | 202.42 | 1 pdf-probe-pt | "de" \|dx\| 200.64 -> 202.42 pt vs Chrome — ACCEPTED: Fits GATE-A1 (oracle artefact): the k-th-occurrence pair is two different word instances. vellora's de#115 is the page-5 FOOTER 'de' (306.55, 813.58) pt; the Chrome word it is paired with is a BODY 'de' at (104.13, 350.81) pt (vellora 8 pages vs Chrome 7, and the extractor emits the footers at different occurrence positions). The dx change (200.64 -> 202.42 pt) is the footer moving to where Chrome draws it: by position, page-5 footer 'de' vs Chrome's (307.12, 812.51) pt went \|dx\| 2.35 -> 0.57 pt, \|dy(yMin)\| 1.02 -> 1.07 pt (yMin carries each producer's declared ascent, step 04; PyMuPDF baseline of the 8pt Liberation Sans footer: Chrome 819.75, vellora 819.41 pt). (evidence: pdftotext 26.06.0 -bbox of layout-diff text-stress-ptbr chrome.pdf / vellora.pdf of both runs; Chrome 155.0.8059.85 local macOS (INDICATIVE), 2026-10-21; old = port/05 run 20261021T142201Z (e9dc7e4), new = port/06 run of c9fe9f5; numbers: attachments/accepted-evidence.json; label legend: baselines/port/README.md (06-page-rules)) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|de#115\|dy` | 460.69 | 462.77 | 1 pdf-probe-pt | "de" \|dy\| 460.69 -> 462.77 pt vs Chrome — ACCEPTED: Fits GATE-A1 (oracle artefact): the k-th-occurrence pair is two different word instances. vellora's de#115 is the page-5 FOOTER 'de' (306.55, 813.58) pt; the Chrome word it is paired with is a BODY 'de' at (104.13, 350.81) pt (vellora 8 pages vs Chrome 7, and the extractor emits the footers at different occurrence positions). The dy change (460.69 -> 462.77 pt) is the footer moving to where Chrome draws it: by position, page-5 footer 'de' vs Chrome's (307.12, 812.51) pt went \|dx\| 2.35 -> 0.57 pt, \|dy(yMin)\| 1.02 -> 1.07 pt (yMin carries each producer's declared ascent, step 04; PyMuPDF baseline of the 8pt Liberation Sans footer: Chrome 819.75, vellora 819.41 pt). (evidence: pdftotext 26.06.0 -bbox of layout-diff text-stress-ptbr chrome.pdf / vellora.pdf of both runs; Chrome 155.0.8059.85 local macOS (INDICATIVE), 2026-10-21; old = port/05 run 20261021T142201Z (e9dc7e4), new = port/06 run of c9fe9f5; numbers: attachments/accepted-evidence.json; label legend: baselines/port/README.md (06-page-rules)) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|de#155\|dx` | 200.64 | 202.42 | 1 pdf-probe-pt | "de" \|dx\| 200.64 -> 202.42 pt vs Chrome — ACCEPTED: Fits GATE-A1 (oracle artefact): the k-th-occurrence pair is two different word instances. vellora's de#155 is the page-6 FOOTER 'de' (306.55, 813.58) pt; the Chrome word it is paired with is a BODY 'de' at (104.13, 542.06) pt (vellora 8 pages vs Chrome 7, and the extractor emits the footers at different occurrence positions). The dx change (200.64 -> 202.42 pt) is the footer moving to where Chrome draws it: by position, page-6 footer 'de' vs Chrome's (307.12, 812.51) pt went \|dx\| 2.35 -> 0.57 pt, \|dy(yMin)\| 1.02 -> 1.07 pt (yMin carries each producer's declared ascent, step 04; PyMuPDF baseline of the 8pt Liberation Sans footer: Chrome 819.75, vellora 819.41 pt). (evidence: pdftotext 26.06.0 -bbox of layout-diff text-stress-ptbr chrome.pdf / vellora.pdf of both runs; Chrome 155.0.8059.85 local macOS (INDICATIVE), 2026-10-21; old = port/05 run 20261021T142201Z (e9dc7e4), new = port/06 run of c9fe9f5; numbers: attachments/accepted-evidence.json; label legend: baselines/port/README.md (06-page-rules)) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|de#155\|dy` | 269.44 | 271.52 | 1 pdf-probe-pt | "de" \|dy\| 269.44 -> 271.52 pt vs Chrome — ACCEPTED: Fits GATE-A1 (oracle artefact): the k-th-occurrence pair is two different word instances. vellora's de#155 is the page-6 FOOTER 'de' (306.55, 813.58) pt; the Chrome word it is paired with is a BODY 'de' at (104.13, 542.06) pt (vellora 8 pages vs Chrome 7, and the extractor emits the footers at different occurrence positions). The dy change (269.44 -> 271.52 pt) is the footer moving to where Chrome draws it: by position, page-6 footer 'de' vs Chrome's (307.12, 812.51) pt went \|dx\| 2.35 -> 0.57 pt, \|dy(yMin)\| 1.02 -> 1.07 pt (yMin carries each producer's declared ascent, step 04; PyMuPDF baseline of the 8pt Liberation Sans footer: Chrome 819.75, vellora 819.41 pt). (evidence: pdftotext 26.06.0 -bbox of layout-diff text-stress-ptbr chrome.pdf / vellora.pdf of both runs; Chrome 155.0.8059.85 local macOS (INDICATIVE), 2026-10-21; old = port/05 run 20261021T142201Z (e9dc7e4), new = port/06 run of c9fe9f5; numbers: attachments/accepted-evidence.json; label legend: baselines/port/README.md (06-page-rules)) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|de#168\|dx` | 3.05 | 4.83 | 1 pdf-probe-pt | "de" \|dx\| 3.05 -> 4.83 pt vs Chrome — ACCEPTED: Fits GATE-A1 (oracle artefact): the k-th-occurrence pair is two different word instances. vellora's de#168 is the page-7 FOOTER 'de' (306.55, 813.58) pt; the Chrome word it is paired with is a BODY 'de' at (301.72, 81.70) pt (vellora 8 pages vs Chrome 7, and the extractor emits the footers at different occurrence positions). The dx change (3.05 -> 4.83 pt) is the footer moving to where Chrome draws it: by position, page-7 footer 'de' vs Chrome's (307.12, 812.51) pt went \|dx\| 2.35 -> 0.57 pt, \|dy(yMin)\| 1.02 -> 1.07 pt (yMin carries each producer's declared ascent, step 04; PyMuPDF baseline of the 8pt Liberation Sans footer: Chrome 819.75, vellora 819.41 pt). (evidence: pdftotext 26.06.0 -bbox of layout-diff text-stress-ptbr chrome.pdf / vellora.pdf of both runs; Chrome 155.0.8059.85 local macOS (INDICATIVE), 2026-10-21; old = port/05 run 20261021T142201Z (e9dc7e4), new = port/06 run of c9fe9f5; numbers: attachments/accepted-evidence.json; label legend: baselines/port/README.md (06-page-rules)) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|de#168\|dy` | 729.79 | 731.88 | 1 pdf-probe-pt | "de" \|dy\| 729.79 -> 731.88 pt vs Chrome — ACCEPTED: Fits GATE-A1 (oracle artefact): the k-th-occurrence pair is two different word instances. vellora's de#168 is the page-7 FOOTER 'de' (306.55, 813.58) pt; the Chrome word it is paired with is a BODY 'de' at (301.72, 81.70) pt (vellora 8 pages vs Chrome 7, and the extractor emits the footers at different occurrence positions). The dy change (729.79 -> 731.88 pt) is the footer moving to where Chrome draws it: by position, page-7 footer 'de' vs Chrome's (307.12, 812.51) pt went \|dx\| 2.35 -> 0.57 pt, \|dy(yMin)\| 1.02 -> 1.07 pt (yMin carries each producer's declared ascent, step 04; PyMuPDF baseline of the 8pt Liberation Sans footer: Chrome 819.75, vellora 819.41 pt). (evidence: pdftotext 26.06.0 -bbox of layout-diff text-stress-ptbr chrome.pdf / vellora.pdf of both runs; Chrome 155.0.8059.85 local macOS (INDICATIVE), 2026-10-21; old = port/05 run 20261021T142201Z (e9dc7e4), new = port/06 run of c9fe9f5; numbers: attachments/accepted-evidence.json; label legend: baselines/port/README.md (06-page-rules)) |

## Reported, not gating (1)

| group | key | before | after | tolerance | detail |
|---|---|---|---|---|---|
| wpt css/css-page | `wpt\|css/css-page/page-name-001-print.html` | pass | fail |  | pass[ink-missing-vs-chrome] -> fail (flagged pass: reported, not gated) |

## Improvements (37)

| group | key | before | after | tolerance | detail |
|---|---|---|---|---|---|
| oracles:text EXT-2 | `receipt\|EXT-2\|oracles:text\|plain\|criterion#1` | WARN | PASS |  | pdftotext warn (missing 0, extra 0); pdfminer.six pass (missing 0, extra 0); pymupdf pass (missing 0, extra 0) -> pdftotext pass (missing 0, extra 0); pdfminer.six pass (missing 0, extra 0); pymupdf pass (missing 0, extra 0) |
| oracles:layout REF-W | `boleto\|REF-W\|oracles:layout\|plain\|criterion#1\|maxMm` | 4.64 | 2.62 | 0.1 position-mm | 4.64 -> 2.62 |
| oracles:layout REF-W | `boleto\|REF-W\|oracles:layout\|plain\|criterion#1\|p95Mm` | 2.58 | 2.36 | 0.1 position-mm | 2.58 -> 2.36 |
| oracles:text EXT-2 | `notification\|EXT-2\|oracles:text\|plain\|criterion#1\|statusRank.pdfminer.six` | 2 | 3 | 0 count | 2 -> 3 |
| oracles:text EXT-2 | `notification\|EXT-2\|oracles:text\|plain\|criterion#1\|statusRank.pymupdf` | 2 | 3 | 0 count | 2 -> 3 |
| oracles:text EXT-2 | `receipt\|EXT-2\|oracles:text\|plain\|criterion#1\|statusRank.pdftotext` | 2 | 3 | 0 count | 2 -> 3 |
| oracles:layout REF-W | `receipt\|REF-W\|oracles:layout\|plain\|criterion#1\|maxMm` | 1.37 | 0.77 | 0.1 position-mm | 1.37 -> 0.77 |
| pdf-probe | `pdf-probe\|boleto\|1#4\|dx` | -12.27 | -0.11 | 1 pdf-probe-pt | "1" \|dx\| 12.27 -> 0.11 pt |
| pdf-probe | `pdf-probe\|boleto\|de#11\|dx` | -15.65 | -0.11 | 1 pdf-probe-pt | "de" \|dx\| 15.65 -> 0.11 pt |
| pdf-probe | `pdf-probe\|boleto\|1#5\|dx` | -20.59 | -0.11 | 1 pdf-probe-pt | "1" \|dx\| 20.59 -> 0.11 pt |
| pdf-probe | `pdf-probe\|invoice\|Página#1\|dx` | 6.18 | -0.11 | 1 pdf-probe-pt | "Página" \|dx\| 6.18 -> 0.11 pt |
| pdf-probe | `pdf-probe\|invoice\|1#1\|dx` | -5.47 | -0.11 | 1 pdf-probe-pt | "1" \|dx\| 5.47 -> 0.11 pt |
| pdf-probe | `pdf-probe\|invoice\|de#5\|dx` | -8.84 | -0.11 | 1 pdf-probe-pt | "de" \|dx\| 8.84 -> 0.11 pt |
| pdf-probe | `pdf-probe\|invoice\|3#1\|dx` | -13.42 | -0.11 | 1 pdf-probe-pt | "3" \|dx\| 13.42 -> 0.11 pt |
| pdf-probe | `pdf-probe\|invoice\|Página#2\|dx` | 6.18 | -0.11 | 1 pdf-probe-pt | "Página" \|dx\| 6.18 -> 0.11 pt |
| pdf-probe | `pdf-probe\|invoice\|2#1\|dx` | -5.47 | -0.11 | 1 pdf-probe-pt | "2" \|dx\| 5.47 -> 0.11 pt |
| pdf-probe | `pdf-probe\|invoice\|de#12\|dx` | -8.84 | -0.11 | 1 pdf-probe-pt | "de" \|dx\| 8.84 -> 0.11 pt |
| pdf-probe | `pdf-probe\|invoice\|3#2\|dx` | -13.42 | -0.11 | 1 pdf-probe-pt | "3" \|dx\| 13.42 -> 0.11 pt |
| pdf-probe | `pdf-probe\|invoice\|Página#3\|dx` | 6.18 | -0.11 | 1 pdf-probe-pt | "Página" \|dx\| 6.18 -> 0.11 pt |
| pdf-probe | `pdf-probe\|invoice\|3#3\|dx` | -5.47 | -0.11 | 1 pdf-probe-pt | "3" \|dx\| 5.47 -> 0.11 pt |
| pdf-probe | `pdf-probe\|invoice\|de#16\|dx` | -8.84 | -0.11 | 1 pdf-probe-pt | "de" \|dx\| 8.84 -> 0.11 pt |
| pdf-probe | `pdf-probe\|invoice\|3#4\|dx` | -13.42 | -0.11 | 1 pdf-probe-pt | "3" \|dx\| 13.42 -> 0.11 pt |
| pdf-probe | `pdf-probe\|receipt\|Página#1\|dx` | 11.23 | -0.11 | 1 pdf-probe-pt | "Página" \|dx\| 11.23 -> 0.11 pt |
| pdf-probe | `pdf-probe\|receipt\|de#5\|dx` | -3.79 | -0.11 | 1 pdf-probe-pt | "de" \|dx\| 3.79 -> 0.11 pt |
| pdf-probe | `pdf-probe\|receipt\|2#2\|dx` | -8.37 | -0.11 | 1 pdf-probe-pt | "2" \|dx\| 8.37 -> 0.11 pt |
| pdf-probe | `pdf-probe\|receipt\|Página#2\|dx` | 11.23 | -0.11 | 1 pdf-probe-pt | "Página" \|dx\| 11.23 -> 0.11 pt |
| pdf-probe | `pdf-probe\|receipt\|de#6\|dx` | -3.79 | -0.11 | 1 pdf-probe-pt | "de" \|dx\| 3.79 -> 0.11 pt |
| pdf-probe | `pdf-probe\|receipt\|2#4\|dx` | -8.37 | -0.11 | 1 pdf-probe-pt | "2" \|dx\| 8.37 -> 0.11 pt |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|Página#1\|dx` | 1.81 | -0.6 | 1 pdf-probe-pt | "Página" \|dx\| 1.81 -> 0.6 pt |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|de#8\|dx` | -2.35 | -0.57 | 1 pdf-probe-pt | "de" \|dx\| 2.35 -> 0.57 pt |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|Página#2\|dx` | 1.81 | -0.6 | 1 pdf-probe-pt | "Página" \|dx\| 1.81 -> 0.6 pt |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|Página#3\|dx` | 1.81 | -0.6 | 1 pdf-probe-pt | "Página" \|dx\| 1.81 -> 0.6 pt |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|Página#4\|dx` | 1.81 | -0.6 | 1 pdf-probe-pt | "Página" \|dx\| 1.81 -> 0.6 pt |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|Página#5\|dx` | 1.81 | -0.6 | 1 pdf-probe-pt | "Página" \|dx\| 1.81 -> 0.6 pt |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|Página#6\|dx` | 1.81 | -0.6 | 1 pdf-probe-pt | "Página" \|dx\| 1.81 -> 0.6 pt |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|Página#7\|dx` | 1.81 | -0.6 | 1 pdf-probe-pt | "Página" \|dx\| 1.81 -> 0.6 pt |

WPT/crashtest improvements: 1 (listed in gate-report.json).

## changed (10)

| group | key | before | after | tolerance | detail |
|---|---|---|---|---|---|
| wpt css/css-page | `wpt\|css/css-page/layers-003-print.html` | fail | unsupported |  | fail -> unsupported |
| wpt css/css-page | `wpt\|css/css-page/layers-004-print.html` | fail | unsupported |  | fail -> unsupported |
| wpt css/css-page | `wpt\|css/css-page/page-margin-007-print.html` | fail | unsupported |  | fail -> unsupported |
| wpt css/css-page | `wpt\|css/css-page/page-size-004-print.html` | fail | unsupported |  | fail -> unsupported |
| wpt css/css-page | `wpt\|css/css-page/page-size-005-print.html` | fail | unsupported |  | fail -> unsupported |
| wpt css/css-page | `wpt\|css/css-page/page-size-009-print.html` | fail | unsupported |  | fail -> unsupported |
| wpt css/css-page | `wpt\|css/css-page/pseudo-first-margin-001-print.html` | fail | unsupported |  | fail -> unsupported |
| wpt css/css-page | `wpt\|css/css-page/pseudo-first-margin-002-print.html` | fail | unsupported |  | fail -> unsupported |
| wpt css/css-page | `wpt\|css/css-page/pseudo-first-margin-003-print.html` | fail | unsupported |  | fail -> unsupported |
| wpt css/css-page | `wpt\|css/css-page/pseudo-first-margin-004-print.html` | fail | unsupported |  | fail -> unsupported |

## WPT per directory (pass / clean pass)

| directory | pass before | pass after | clean before | clean after |
|---|---|---|---|---|
| css/CSS2/abspos | 2 | 2 | 2 | 2 |
| css/CSS2/backgrounds | 175 | 175 | 67 | 67 |
| css/CSS2/borders | 383 | 383 | 354 | 354 |
| css/CSS2/box | 4 | 4 | 0 | 0 |
| css/CSS2/box-display | 65 | 65 | 65 | 65 |
| css/CSS2/colors | 10 | 10 | 10 | 10 |
| css/CSS2/floats | 19 | 19 | 16 | 16 |
| css/CSS2/floats-clear | 38 | 38 | 33 | 33 |
| css/CSS2/fonts | 135 | 135 | 135 | 135 |
| css/CSS2/generated-content | 82 | 82 | 78 | 78 |
| css/CSS2/linebox | 126 | 126 | 124 | 124 |
| css/CSS2/lists | 67 | 67 | 40 | 40 |
| css/CSS2/margin-padding-clear | 525 | 525 | 508 | 508 |
| css/CSS2/normal-flow | 431 | 431 | 405 | 405 |
| css/CSS2/pagination | 33 | 33 | 31 | 31 |
| css/CSS2/positioning | 361 | 361 | 359 | 359 |
| css/CSS2/tables | 77 | 77 | 74 | 74 |
| css/CSS2/text | 247 | 247 | 238 | 238 |
| css/CSS2/visudet | 14 | 14 | 9 | 9 |
| css/CSS2/visufx | 2 | 2 | 2 | 2 |
| css/CSS2/visuren | 6 | 6 | 6 | 6 |
| css/css-break | 115 | 115 | 81 | 81 |
| css/css-page | 71 | 70 | 55 | 55 |
| css/css-tables | 47 | 47 | 38 | 38 |
| css/css-text | 630 | 630 | 377 | 377 |

## Per group

| group | classes |
|---|---|
| oracles:layout REF-W | improvement 3 |
| oracles:text EXT-2 | improvement 4 |
| pdf-probe | improvement 29, accepted 12 |
| wpt css/css-page | changed 10, reported 1, improvement 1, accepted 1 |

## Tolerances

| class | tolerance | label | rationale |
|---|---|---|---|
| position-mm | 0.1 mm | DESIGN TARGET | word/anchor position error vs a reference (REF-W max/p95, REF-R worst anchor, DANFE-L1, LET-1). 0.1 mm (0.28 pt, 0.38 CSS px) is 10x the 0.01 mm the values are reported with and below one CSS px (0.26 mm), the smallest step a px-snapping layout can move; the measurement is deterministic for one build and one reference (CONFIRMED: equal inputs gave equal values in the Phase A repeat run). |
| geometry-excess-mm | 0.05 mm | DESIGN TARGET | distance OUTSIDE a specification window (BOL-G*, DANFE-B*, DANFE-M1, TXT-A1). Inside the window the spec admits any value, so only the excess is ratcheted; 0.05 mm is about one 600 dpi raster pixel (0.042 mm), the measurement quantum of measure_bars.py / the page ink box. |
| font-excess-pt | 0.05 pt | SPEC-derived tolerance unit | font-size excess outside a window; 0.05 pt is the tolerance ACCEPTANCE.md already applies to every font-size criterion (BOL-T*, DANFE-F*). |
| count | 0 count | DESIGN TARGET | integer counts from deterministic tools (required strings found, extractor missing/extra tokens, segments/glyphs attributed, decoded symbols): any loss is a real change of the document. |
| page-delta | 0 pages | DESIGN TARGET | \|vellora pages - reference pages\|: a page break moving is never noise. |
| pdf-probe-pt | 1 pt | DESIGN TARGET | per-word \|dx\| / \|dy\| of vellora's PDF vs Chrome's PDF (pdftotext -bbox, same-page pairs). 1 pt (0.35 mm) is an order of magnitude below the Phase A regressions it must catch (invoice price column +9 pt, notification signature -14 pt) and above glyph-bbox rounding of pdftotext (0.01 pt) and sub-px snapping differences. |

