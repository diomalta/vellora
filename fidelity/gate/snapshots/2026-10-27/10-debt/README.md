# 10-debt: first DEBT.json population and post-hoc re-gate of the 10-tip run (2026-10-27)

Branch `phaseb/10-debt` from `phaseb/10-tip` (d3fa920). No re-render: every number below is from
ONE run, `run-all-10-tip-20261023T004536Z-blitz-0.3.0-beta.4-vellora-a293cf5` (phaseb/10-tip
a293cf5, run 2026-10-23), whose only surviving copy is
`~/Repositories/vellora-fidelity-runs/run-all-10-tip-20261023T004536Z-blitz-0.3.0-beta.4-vellora-a293cf5`
(loss event: `~/.cache/vellora-fidelity` and every older run copy are gone; see
`~/Repositories/vellora-fidelity-runs/INTEGRATION-TODO.md`). Environment of the run and of this
re-gate: darwin 27.0.0 arm64 (macOS 27.0.1, Apple M5 Pro), Node v22.23.2, rustc 1.96.0, Google
Chrome 155.0.8059.85, PyMuPDF 1.28.2, pdfminer.six 20260107, WPT 9d8aceec. Local macOS data:
INDICATIVE. `<RUN>` below = that run copy.

Note: `tip-10/tip-10-summary.json` names the run `20261023T004510Z`; the surviving copy's directory
is `...T004536Z...`. CONFIRMED same run for every purpose here: the re-gate with the 10-spark
acceptances reproduces the committed round-2 counts exactly (head 1170, pin (c) 859, vs-09 gating
0). The 26 s difference between the two ids is not explained by anything in this snapshot.
Resolved by the independent verify (2026-10-27, `phaseb/10-verify`): the run copy's own
`summary.json` records `runId` `20261023T004510Z` (`dateIso` 2026-10-23T00:45:10Z), so `004510Z`
is the run and `004536Z` is only the copy's directory name (CONFIRMED).

## Verdict: FAIL (head gating 145). Baseline 10 NOT written.

| view | result |
|---|---|
| vs 09-review-fixes (previous link) | gating **0** (improvement 93, accepted 3, within-tolerance 327) |
| head vs port/00-start | gating **145**: debt 1024, accepted 4, declared 10 |
| pin view vs baselines/pin | (a) 1, (b) 641, (c) 217, declared 10 (merge to main BLOCKED) |
| ledger | 26 entries, 1024 keys, 0 problems; base: DEBT.json absent at the merge base = first population |
| gate canaries (GATE-K2) | 20/20 caught |

```
node fidelity/gate/run.mjs --baseline fidelity/baselines/port/09-review-fixes --run <RUN> \
  --accept fidelity/gate/snapshots/2026-10-27/10-debt/accepted.json \
  --head fidelity/baselines/port/00-start --pin fidelity/baselines/pin --layout-from <RUN> \
  --debt fidelity/baselines/port/DEBT.json --step 10-integration --out <scratch>/regate3
# exit 3 -> gate-report-10-integration.{json.gz,md}
```

## The residual that blocks (head, 145 items; `residual.json`)

1. `danfe|DANFE-L1d|corpus||criterion#1|posErrMm` 5.96 -> 6.49 mm. Spec-anchor vector
   (`layer-vectors-danfe-l1.json.gz`): N0 = B0 = L0 = every pass = P = 23.903 px, run 24.529 px.
   No vellora layer moves the title ("DADOS DOS PRODUTOS/SERVIÇOS", N0 11.922 px below Chrome's DOM,
   raw Blitz); the only step is P -> run = +0.626 px, the Chrome DOM-vs-PDF offset (CONFIRMED
   systematic: run - P over all 459 mapped danfe page-1 words of the head vectors has median
   +0.557 px, range -0.284..+1.113 px). The relaxed (b) rule fails because a position-mm item's
   run tolerance is max(0.5 px, 0.1 mm = 0.378 px) = 0.5 px (`gate/tolerances.mjs`
   vectorRunTolerance), below that documented spread. Not vellora-owned, so nothing to fix in
   vellora; it is a GATE-D7 / tolerance decision for the orchestrator (NOT taken here: no
   tolerance was widened). L1a-c pass the same construction (|run| - |N0| = -0.29, +0.04, +0.31 px).
2. 144 `text-stress-ptbr` pdf-probe items on Chrome pages 2-7 (94 dy, 35 dx, 15 pairing -> unpaired).
   vellora prints 8 pages, Chrome 7 (`TXT-P1` / `REF-P` pageDelta 1, head and run alike). Their
   per-word vectors do not describe the PDF (run - P: median -48.5 px, 7 of 129 within 1.333 px),
   because layout-diff's P is in-page drift against Chrome's continuous layout and the page-break
   offsets differ. Rule vi (GATE-D6) requires ONE page-scoped entry on the page-count metric, but
   GATE-D7 refuses a new key the head comparison does not have, and `TXT-P1 pageDelta` is not a
   head item (1 at 00-start, 1 now). So the rules as written admit no (b) route for them. Owner of
   the cause: vellora pagination (P) giving 8 pages vs 7; not a small fix (Phase C table/page
   fragmentation). Orchestrator decision needed: either let a page-scoped key bind a page metric
   that is unchanged vs the head (measured = the run's value) or keep these gating until pagination
   matches Chrome.

## What is covered (DEBT.json, 26 entries, 1024 keys)

Built by `fidelity/gate/debt-populate.mjs` (new, tested in `gate/test/debt-populate.test.mjs`):

```
node fidelity/gate/debt-populate.mjs \
  --report fidelity/gate/snapshots/2026-10-27/10-debt/gate-report-10-integration-nodebt.json \
  --run <RUN> --vectors fidelity/gate/snapshots/2026-10-27/10-debt/layer-vectors-head.json.gz \
  --vectors fidelity/gate/snapshots/2026-10-27/10-debt/layer-vectors-danfe-l1.json.gz \
  --accept fidelity/gate/snapshots/2026-10-27/10-debt/accepted.json --step 10-integration \
  --out <scratch>/DEBT.json --residual <scratch>/residual.json
```

(the head report is committed gzipped; the tool reads `<path>.gz` when `<path>` is absent). A key
enters only when its committed vector satisfies the relaxed (b) rule with exactly its
over-tolerance steps as compensators AND |run - P| is within the run tolerance (the vector
describes the PDF), or, for WPT, the run's raw-Blitz render fails the same way (GATE-A3 b: same
outcome and page counts). Ceiling = |measured| (no slack); introducedBy = the first committed link
01..09 whose comparison with 00-start has the key beyond tolerance.

| tolClass | keys | fixtures |
|---|---|---|
| pdf-probe-pt | 1014 | danfe 459, boleto 261, notification 102, invoice 67, boleto-febraban 63, receipt 31, text-stress-ptbr 31 (page 1) |
| position-mm | 3 | DANFE-L1a, L1b, L1c (spec-anchor vectors) |
| count (WPT) | 7 | raw Blitz fails the same way; owner `blitz:wpt-raw-fail` |

Compensators: `painted_table_cell_text_baselines` 575 keys, none 323 (the item got worse because
a head-era compensation was removed; every vellora step is within 0.5 px), `P` 103, both 23.
introducedBy: 04-block-offset 733, 03-table-passes 155, 01-pagination-gaps 131, 05-walk-rewrite 5.
Every owner is `blitz:*` (residual = raw Blitz N0), so `closesAt` is null (rule iv applies to
`vellora:*` owners only).

The 53 head "none" candidates of round 2 got hand-built vectors with two tool extensions
(`gate/layer-vector.mjs`, commit ad9d26a): 44 boleto barcode digits + 5 text-stress-ptbr words by
the page-1 geometry fallback (all 49 now (b): e.g. barcode N0 28.531 px, P 25.531, run 26.467,
compensator P), the 4 DANFE-L1 aggregates by `--spec-anchor` (L1a-c (b), L1d residual above).
The 1094 LCS-mapped vectors are byte-identical to `../../2026-10-22/tip-10/layer-vectors-head.json.gz`.

## Class (a): `accepted.json` (4)

The 3 of 10-spark (postmark `[Product#2` / `Name]#2` pairing = Chrome's white text-shadow copy;
`unpaired-vellora` 0 -> 3 = "Download as PDF" back on the page), re-checked on the 10-tip PDFs with
PyMuPDF rawdict (CONFIRMED: Chrome draws `[Product Name]` at (253.453, 58.5) #ffffff and
(253.453, 57.75) #a8aaaf, vellora once at (252.55, 57.596); vellora's "Download as PDF" baseline
815.846 pt on an 841.92 pt page). Plus `wpt|css/css-page/monolithic-overflow-014-print.html`
pass -> fail: the old pass was false by page count (2 pages vs Chrome 4). Evidence: the round-2
ledger-candidates output computed from the 00-start record (that record is gone: direct re-check
UNAVAILABLE), the port/04 record in `05-walk-rewrite/attachments/accepted-evidence.json`
(pages [2, 2] vs Chrome [4, 4]), and the run's record (pages [2, 2], Chrome [4, 4]). Not (b): raw
Blitz fails differently (pages [4, 1]).

## Pin view (c) 217, classified (`pin-classification.json`)

The ledger is HEAD debt only (GATE-D1; decision of this phase, reversible by the orchestrator):
pin-only items are not entered even when their vector would pass, because they are not worse than
the head (they would be "unused" head entries that rule iii could then only shrink).

| route | items | what |
|---|---|---|
| b-provable | 103 | 77 pdf-probe words (danfe 41, invoice 35, boleto-febraban 1) whose vector passes (b), and 26 WPT pass -> fail vs pin where raw Blitz beta.4 fails the same way (Blitz pin rev 2003ba5 -> 0.3.0-beta.4 upstream losses, e.g. tab-size-integer-001..003, text-justify-and-trailing-spaces-003/004, ruby-003) |
| page-scope | 89 | text-stress-ptbr pages >= 2 (rule vi, as in the head residual) |
| c | 17 | 16 `oss-sparksuite-invoice` dx (-0.23 -> -1.73 pt) + DANFE-L1d. The 16: every layout layer dx = 0 (vellora's layout equals Chrome's DOM), run -2.307 px. CONFIRMED on the 10-tip PDFs: Chrome's PDF puts right-aligned fragments 59 px right of its DOM x but left-aligned ones 57 px (layout-diff fragment x vs Chrome PDF x, page 1), vellora's PDF uses 56.69 px for both. HYPOTHESIS: Chrome-side DOM-vs-PDF offset for right-aligned text, i.e. an oracle-reference artefact rather than a vellora fault; unproven as (a), so (c) by the rule. Not head items (no head gating) |
| none | 8 | DANFE-M1 excessB 8.552 -> 24.173 mm (aggregate, no vector), invoice p2/p3 `QTD.#1` dx (no layout-diff mapping off page 1), 5 invoice p3 dy words (run - P 3.52 px: P is not their PDF position) |

## Files

| file | content |
|---|---|
| `accepted.json` | class-a acceptances of step 10-integration (--accept) |
| `gate-report-10-integration-nodebt.json.gz` | re-gate with `accepted.json`, empty ledger (head 1169 gating): the builder's input |
| `gate-report-10-integration.{json.gz,md}` | the final re-gate with the populated ledger (above) |
| `layer-vectors-head.json.gz` | `node fidelity/gate/layer-vector.mjs --run <RUN> --keys-from fidelity/gate/snapshots/2026-10-27/10-debt/gate-report-10-integration-nodebt.json` (1143 head word keys, 1143 mapped) |
| `layer-vectors-danfe-l1.json.gz` | `... --spec-anchor danfe:DANFE-L1a ... danfe:DANFE-L1d` |
| `layer-vectors-pin.json.gz` | `... --keys-from fidelity/gate/snapshots/2026-10-22/tip-10/pin-c-items.json` |
| `residual.json` | the 145 head items no rule covers, with the reason |
| `pin-classification.json` | the 217 pin (c) items, routed (`--pin-report` = the final report, `--pin-candidates` = round-2 ledger-candidates for WPT records of the pin run) |
