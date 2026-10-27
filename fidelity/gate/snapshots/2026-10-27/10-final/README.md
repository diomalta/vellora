# 10-final: rule decisions (i) and (ii), DEBT.json re-population, baseline `port/10-integration` (2026-10-27)

Branch `phaseb/10-final` = `phaseb/10-verify` (dc2f402) + merge of `phaseb/10-repro` (c337fbc).
No re-render: every number below is from ONE run, `20261023T004510Z` (phaseb/10-tip a293cf5,
`run-all --gate --raw`, 2026-10-23; Chrome 155.0.8059.85; the copy's directory name carries
`004536Z`, the WPT step's id). Environment of the re-gate: darwin 27.0.0 arm64 (Apple M5 Pro), Node
v22.23.2, PyMuPDF 1.28.2 (fidelity/.venv), 2026-10-27. Local macOS data: INDICATIVE.
`<RUN>` = `~/Repositories/vellora-fidelity-runs/run-all-10-tip-20261023T004536Z-blitz-0.3.0-beta.4-vellora-a293cf5`.

## Verdict: PASS vs 09 and vs the head; baseline `port/10-integration` written

| view | result (CONFIRMED, `gate-report-10-integration.{json.gz,md}`) |
|---|---|
| vs `09-review-fixes` | gating **0** (improvement 93, added 5, within-tolerance 327, newly-measured 39, accepted 3, unchanged 14486) |
| head vs `port/00-start` | gating **0**: debt 1169, accepted 4, declared 10 |
| pin view vs `baselines/pin` | (a) 1, (b) 693, (c) 165, declared 10 (merge to main BLOCKED) |
| ledger | 27 entries, 1026 keys (+144 listed scope keys), 0 problems; base: DEBT.json absent at merge-base a8b126d = first population |
| gate canaries (GATE-K2) | 22/22 caught |

```
node fidelity/gate/run.mjs --baseline fidelity/baselines/port/09-review-fixes --run <RUN> \
  --accept fidelity/gate/snapshots/2026-10-27/10-debt/accepted.json \
  --head fidelity/baselines/port/00-start --pin fidelity/baselines/pin --layout-from <RUN> \
  --debt fidelity/baselines/port/DEBT.json --step 10-integration --out <scratch>/regate
# exit 0
```

What moved vs the 10-debt re-gate (`../10-debt/gate-report-10-integration.json.gz`), item by item
(CONFIRMED, every key compared): head: exactly 145 items `head-regression -> debt`, and they are
exactly the 145 keys of `../10-debt/residual.json` (DANFE-L1d + the 144 text-stress-ptbr words on
pages 2-7); no other head item changed class, no item appeared or vanished. vs 09: 0 items changed.
Pin: 52 items `c -> b` (DANFE-L1d + 51 of the 89 text-stress-ptbr page-scope pin items, the ones
that are also head items); no other pin item changed class.

## Rule (ii): one vector run tolerance (`gate/tolerances.mjs` `VECTOR_RUN_TOLERANCE_PX`)

Measurement (CONFIRMED, 2026-10-27):

```
node fidelity/gate/snapshots/2026-10-27/10-final/scripts/run_p_spread.mjs .   # -> run-p-spread.json
```

run - P per mapped page-1 word of the committed 10-debt head vectors (`layer-vectors-head.json.gz`,
the 1014 head-gating word keys' records; a sample of head-gating words, not of every word):

| fixture | n | dy median | dy min..max | dx min..max (px) |
|---|---|---|---|---|
| danfe | 459 | +0.557 | -0.284..+1.113 | +0.447..+1.233 |
| boleto | 261 | +0.498 | -0.002..+0.960 | -0.586..+0.774 |
| notification | 102 | +0.311 | -0.033..+0.951 | -0.493..+0.813 |
| invoice | 67 | +0.764 | +0.545..+0.951 | -0.537..+0.501 |
| boleto-febraban | 63 | -0.045 | -0.607..+0.377 | -0.147..-0.097 |
| receipt | 31 | +0.654 | +0.061..+0.936 | -0.036..+0.061 |
| text-stress-ptbr | 31 | +0.873 | +0.873..+0.951 | -0.324..-0.300 |

max |run - P| 1.233 px; + the 0.01 pt (0.013 px) probe resolution = 1.246 px < 1.333 px = the
pdf-probe word run tolerance (1 pt). So the pdf-probe value covers the measured spread and becomes
the ONE constant for both vector classes (pdf-probe-pt, position-mm); position-mm was
max(0.5 px, 0.1 mm = 0.378 px) = 0.5 px. Other tolClasses keep their old formula (none has vectors).
With it the relaxed (b) rule also requires |P| <= |N0| + 0.5 px (the step tolerance): N0..P are
all measured against Chrome's DOM, so the widened run tolerance never absorbs a layout-layer
worsening. Classification changes (CONFIRMED by diffing the re-populated DEBT.json, residual and pin
classification against 10-debt's): exactly one key, `danfe|DANFE-L1d|corpus||criterion#1|posErrMm`
(head: residual -> `DEBT-10-danfe-1`, compensators none; pin: c -> b). No pdf-probe key and no other
position-mm key changed (the |P| clause refuses none of the 1014 committed word keys).

Canaries (GATE-K2 row "rule (ii)", on the DANFE-L1d vector N0 = every layer = P 23.903 px, run
24.529 px): as measured -> (b); +0.6 px at a layout pass, named or not -> (c); +1.5 px P -> run with
`run` named -> gates. `gate/test/canaries.test.mjs` shows the row uncaught without the |P| clause,
without |run| <= |N0| + tol, or with the old 0.5 px.

## Rule (i): the listed page scope (GATE-D6b, rule vi')

`DEBT-10-text-stress-ptbr-page-scope`: binds `text-stress-ptbr|TXT-P1|corpus||criterion#1|pageDelta`
(head 1 = run 1 = measured = ceiling; not a head item; no layer vector), `scope: { fixture:
text-stress-ptbr, fromPage: 2, keys: [144] }` = exactly the 144 head-gating words (94 dy, 35 dx, 15
pairing) on Chrome pages 2-7, introduced by 03-table-passes 65, 04-block-offset 79. Owner
`vellora:pagination` (Phase C), closesAt `11-pagination` (DESIGN TARGET placeholder: rule iv needs a
step). TXT-P1, not REF-P: both measure the same two page counts (vellora 8, Chrome 7) and rule vi
allows one entry per criterion.

Lost-text check of the 15 pairing items (CONFIRMED, `lost-text-text-stress-ptbr.json`):

```
fidelity/.venv/bin/python -I fidelity/gate/snapshots/2026-10-27/10-final/scripts/lost_text.py . <RUN> text-stress-ptbr de — 7 8 Página
```

Whole document, the pdf-probe extractor (`oracles/py/words.py`) on both the layout-diff and the
corpus PDF pairs: vellora 1846 words, Chrome 1833; `de` vellora 176 / Chrome 175, `—` 66 / 66, so
the 15 unpaired `de` / `—` words are displaced to another page or beyond the 36 pt pairing bound, not
lost. The only words Chrome has more often: `7` x7 = the footer "Página N de 7" (Chrome 7 pages,
vellora prints "de 8" x8). vellora has no off-page words on this fixture, and the head comparison
has no text-stress-ptbr unpaired-count or off-page item.

Canaries (GATE-K2 row "DEBT rule vi'"): page delta 1 -> 2 gates the metric and the listed word
(debt-exceeded); a page-1 word worsening beyond tolerance gates (head-regression); page delta 0
compares the listed word again (head-regression); D7 refuses a moved metric (head 1, run 2) and a
ceiling above the page delta. Shown uncaught for an unbound (old fail-open) scope, a scope listing a
page-1 word, and a D7 that skips the page metric.

## DEBT.json re-population

Same command and inputs as `../10-debt/README.md`:

```
node fidelity/gate/debt-populate.mjs \
  --report fidelity/gate/snapshots/2026-10-27/10-debt/gate-report-10-integration-nodebt.json \
  --run <RUN> --vectors fidelity/gate/snapshots/2026-10-27/10-debt/layer-vectors-head.json.gz \
  --vectors fidelity/gate/snapshots/2026-10-27/10-debt/layer-vectors-danfe-l1.json.gz \
  --accept fidelity/gate/snapshots/2026-10-27/10-debt/accepted.json --step 10-integration \
  --out <scratch>/DEBT.json --residual <scratch>/residual.json
# debt-populate: 27 entries, 1026 keys (1025 covered records + 1 page metric), 144 listed scope keys; residual 0 (0 class-a)
```

Diff vs the 10-debt ledger (CONFIRMED): `DEBT-10-danfe-1` gains the DANFE-L1d key, and the page-scope
entry is new; the other 25 entries are byte-identical (the owner-text change below touches only
fixtures with no key). `note` updated by hand. Owner text: since 10-spark N0 includes vellora's
`<table cellspacing>`/`cellpadding` UA sheet `blitz_engine::table_spacing_hints_css`; debt-populate
now says so for the fixtures whose source uses those attributes (`oss-postmark-receipt`,
`oss-sparksuite-invoice`, `probe-g_postmark_raw`; none has a DEBT key).

## Pin view (c) 165, classified (`pin-classification.json`)

Same tool with `--vectors .../10-debt/layer-vectors-pin.json.gz --pin-out ... --pin-report <the
re-gate> --pin-candidates fidelity/gate/snapshots/2026-10-22/tip-10/ledger-candidates.json.gz`:
b-provable 103 (77 words: danfe 41, invoice 35, boleto-febraban 1; 26 WPT raw-Blitz fails; not
entered, head-only policy), page-scope 38 (text-stress-ptbr pages >= 2 worse than the pin but not
than the head, so not listed), c 16 (oss-sparksuite-invoice dx; right- vs left-aligned Chrome
DOM -> PDF offset: HYPOTHESIS), none 8 (DANFE-M1 excessB 8.552 -> 24.173, no vector; invoice p2/p3
`QTD.#1` dx 1.21 -> 4.42, no mapping; invoice p3 `Total#1`, `a#1`, `pagar#1`, `R$#14`,
`50.724,90#1` dy 1.1 -> -1.15, run - P 3.52 px > 1.333 px). Rule (ii) changed none of the 165.

## Baseline `port/10-integration`: written from a derived run copy

`write-baseline.mjs` takes the gate verdict from the run directory's `gate/gate-report.json` and
refuses a FAIL without `--force`. The tip copy's own report is the run-all gate of 2026-10-23 (vs
09, no acceptances, no ledger: FAIL raw), so the baseline is written from a derived copy in the
durable store, `~/Repositories/vellora-fidelity-runs/run-all-10-integration-20261023T004510Z-regate-20261027-blitz-0.3.0-beta.4-vellora-a293cf5`
= the tip copy (`cp -cR`) with `gate/gate-report.{json,md}` replaced by the re-gate above and the
run-all report kept as `gate/run-all-gate-report-vs-09-raw.{json,md}` (attached to the baseline as
`attachments/gate-report-run-all-vs-09-raw.md`). `diff -rq` of the two copies lists only those
four `gate/` files (CONFIRMED 2026-10-27); every PDF, oracle output and WPT result is the tip run's.

```
node fidelity/gate/write-baseline.mjs --run ~/Repositories/vellora-fidelity-runs/run-all-10-integration-20261023T004510Z-regate-20261027-blitz-0.3.0-beta.4-vellora-a293cf5 \
  --root fidelity/baselines/port --name 10-integration \
  --accept fidelity/gate/snapshots/2026-10-27/10-debt/accepted.json \
  --attach <that copy>/gate/run-all-gate-report-vs-09-raw.md=gate-report-run-all-vs-09-raw.md --note "<manifest labels.note>"
# write-baseline: fidelity/baselines/port/10-integration (65 files; gate PASS)
```

## Reproduced (continuation agent, 2026-10-27)

The first 10-final agent died on a network error before committing; its uncommitted tree was
re-checked from the committed inputs on the same machine (darwin 27.0.0 arm64, Node v22.23.2) before
it was committed. CONFIRMED, each by re-running the command above into a scratch directory:

- debt-populate: DEBT.json identical except the hand-written top-level `note` and the `<scratch>`
  placeholder; residual identical (empty).
- the re-gate: every report field identical except `date` and `command`; exit 0; 22/22 canaries.
  Item-by-item vs `../10-debt/gate-report-10-integration.json.gz`: head 145 `head-regression -> debt`
  (= exactly the 145 keys of `../10-debt/residual.json`), pin 52 `pin-regression -> debt` (all
  52 are among those 145), vs 09 none; no item appeared or vanished (head 1183, pin 869, vs-09 467
  items in both).
- the pin classification: `pin-classification.json` identical (modulo `<scratch>`; the committed
  file is biome-formatted).
- `scripts/run_p_spread.mjs`: `run-p-spread.json` identical (modulo biome's array layout).
- `scripts/lost_text.py` (command above): `lost-text-text-stress-ptbr.json` identical (modulo `~`).
- `gate-report-10-integration.{json.gz,md}` = `baselines/port/10-integration/gate-report.{json,md}`
  byte for byte (gunzipped).
- write-baseline into a scratch root: `diff -rq` vs `fidelity/baselines/port/10-integration` differs
  only in `manifest.json` `provenance.command` (`--root`) and `date`.

## Independent verify (branch `phaseb/10-final-verify`, 2026-10-27)

Fresh worktree (npm ci, npm run build, fidelity deps, fidelity/.venv), darwin 27.0.0 arm64, Node
v22.23.2; local macOS, INDICATIVE. CONFIRMED by re-running every command above into scratch
directories: re-gate PASS with every report field identical except `date`/`command`/run path;
item-by-item vs `../10-debt`: head 145 `head-regression -> debt` = the 10-debt residual, pin 52
`pin-regression (c) -> debt (b)`, vs 09 none, no item appeared or vanished, no `before`/`after`
value changed; debt-populate, pin classification (b-provable 103, page-scope 38, c 16, none 8),
`run_p_spread.mjs` and `lost_text.py` outputs identical; baseline `port/10-integration` integrity
65/65, runId `20261023T004510Z`; a gate of the tip copy against `port/10-integration` is all
unchanged (15866) with the head and pin views as above; the derived copy differs from the tip copy
only in the four `gate/` files and keeps the raw run-all report byte-identical.

Each canary was also made to fire through the real gate on mutated scratch clones of the tip copy
or of DEBT.json (not stored in the run store):

| mutation | head view | gate |
|---|---|---|
| TXT-P1 `8 vs reference 7` -> `9 vs` (page delta 1 -> 2) | 145 `debt-exceeded` (metric + 144 words) | FAIL |
| TXT-P1 -> `7 vs` (page delta 0) | 144 listed words `head-regression` | FAIL |
| page-1 `Relatório#1` dy +3 pt | 1 `head-regression` | FAIL |
| DANFE-L1d vector: +0.6 px at the first layout pass (run kept), unnamed / named | ledger: \|P\| > \|N0\| + 0.5 (+ unnamed step) | FAIL / FAIL |
| DANFE-L1d vector: N0..P = run - 1.5 px, unnamed / `run` named | ledger: \|run\| > \|N0\| + 1.333 | FAIL / FAIL |
| control: DANFE-L1d vector inline, unmutated | 0 | PASS |
| listed word `p2 02/02/2026#1` dy 8.6 -> 28.6 pt, page delta still 1 | covered (debt) | FAIL only through the vs-09 view |

The last row is the rule as written (a listed word rides on the page metric with no per-word
ceiling while the delta holds); the previous-link comparison is what gates it.

Two gaps between the rule (vi') code and GATE-D6b were found and fixed (commit on this branch,
GATE-K2 row 23, canaries 23/23): (1) a listed scope binding a page metric that IS a head item
(TXT-P1 1 -> 2, entered with measured = ceiling = 2) passed the head view with no ledger problem;
(2) `fromPage` 1 was accepted, so a listed page-1 word was covered. After the fix the re-gate of
the tip copy is identical to `gate-report-10-integration.*` except the 23rd canary row; the
committed report and the baseline's `gate-report.*` record the 22-row gate as it ran.

## Files

| file | content |
|---|---|
| `gate-report-10-integration.{json.gz,md}` | the re-gate above (= `baselines/port/10-integration/gate-report.*`) |
| `residual.json` | head residual of the re-population: empty |
| `pin-classification.json` | the 165 pin (c) items, routed |
| `run-p-spread.json`, `scripts/run_p_spread.mjs` | rule (ii) measurement |
| `lost-text-text-stress-ptbr.json`, `scripts/lost_text.py` | lost-text check of the scoped words |
