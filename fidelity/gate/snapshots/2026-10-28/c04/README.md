# Phase C 04 tip: merge of the four step-04 branches + one gated run (2026-10-28)

Branch `phasec/04-tip` from `phasec/03-verify` ee7f86b. Local macOS (darwin 27.0.0 arm64, Apple M5
Pro), Node v22.23.2, rustc 1.96.0, Chrome for Testing 155.0.8059.85, tools image
`vellora-fidelity-tools:baseline-beta4` (c405e06c), veraPDF image 45b2f7cd, WPT 9d8aceec. Every
number here is INDICATIVE.

The branch records stay where their workers wrote them: `c04/floats/` (this directory's
subfolder), `../c04-text/`, `../c04-frag/`, `../c04-paint/`. Nothing was moved.

## Merges (each `--no-ff`, in this order)

| branch | tip | what it brings | conflicts and how they were resolved |
|---|---|---|---|
| `phasec/04-floats` | e0fc9eb | Blitz's `floats` cargo feature, float-avoidance fixups (2 Blitz/Taffy bugs, canaries), relative-inline offsets, paint tiers, one PDF text object per continued glyph run | none |
| `phasec/04-text` | 25fb261 | tab glyphs, table-column pseudo hiding (canary), rtl L1 line-end white space (canary), atomic inlines after block backgrounds, `text-wrap: balance` (canary) | `read_text_runs`: text's per-line runs carry floats' relative-inline offset; `raw_blitz_tests.rs`: both canary sets. `balance_text_wrap_skips_what_it_cannot_place_like_chrome` drops the float's own run (with floats laid out it sits on its own baseline; the balance is still skipped) |
| `phasec/04-paint` | 6bcc489 | canvas / `@page` backgrounds, dashed and dotted borders as segments, text-decoration lines, report-only `paint-probe` step | walk sink keeps both fields; border segments carry tier 0; decorations ride on text's per-line runs, the line-end trim runs after the rtl pass, and the rtl move clears the moved space's decorations and refits whole-run lines (new test `rtl_line_end_whitespace_moves_the_decorations_with_the_glyphs`, fails without the refit); `pdf.rs`: floats' contiguous text objects plus paint's decoration rects; rects ordered by `paint_ordered_rects` (below) |
| `phasec/04-frag` | 8702f16 | `break-after`, Chrome's thead-repeat rule, tfoot order, named-page breaks | `break_css.rs` only: both sets of rule fields and declarations; frag's public `media_applies` also backs text's `applicable_wrap` |

All four were kept: each is net-positive on WPT and none changed a fixture metric for the worse.

**Interaction found and fixed before the run (a0b81a6).** Floats sort rects by paint tier; text
emits atomic-inline subtrees after the other rects. The first combined order (CSS 2.2 Appendix E:
in-flow atomic inlines after floats) lost `css/CSS2/floats/floats-wrap-bfc-003-right-overflow.xht`:
vellora does not clip `overflow: hidden`, so a 250 px inline-block in a 200 px clipped block
painted over the float (2500 px differ). In-flow atomic inlines now paint after their tier's
blocks and before floats, which is each branch's measured order; the deviation is written in
`pagination.rs` (`paint_ordered_rects`) and pinned by a unit test.

## Measured before the run (not gated)

- Full WPT `--raw --chrome-from <10-tip> --expectations none` (copies
  `~/Repositories/vellora-fidelity-runs/c04-tip-iter/w1`, `w2`): 4156 passes at the first order,
  **4157** after a0b81a6 (0 pass -> fail between them). Every gain of every branch's final run is
  kept (floats 339/339, text 36/36, frag 24/24, paint 7/7). The 13 pass -> fail vs c03 are exactly
  the union of the branches' own losses (floats 7, frag 3, paint 3).
- 9 fixtures + 37 probes (`c04-tip-iter/m1`): doc-aggregate equal to c03's in every metric on 9/9;
  paint-probe equal to paint's after-6b62178 record on 9/9; 0 words more than 1 pt from Chrome on
  the 9 fixtures; the probes keep the 10 known ones (7 r_*, f5_box_partial).
- frag's break-after and thead probes re-run with floats on (`c04-tip-iter/probes-frag`): the 12
  break-after probes have Chrome's page count and first words per page (ba-float-source now lays
  the float out); the thead probes are as frag recorded (h47/h48/h49/h60/h96 keep the known
  "breaks inside the rows' empty height" gap).

## The gated run

```sh
node fidelity/run-all.mjs --gate --main --contract --raw --chrome <Chrome for Testing 155.0.8059.85> \
  --baseline fidelity/baselines/port/10-integration \
  --chrome-from ~/Repositories/vellora-fidelity-runs/run-all-10-tip-20261023T004536Z-blitz-0.3.0-beta.4-vellora-a293cf5/wpt/results.json \
  --tools-image vellora-fidelity-tools:baseline-beta4 \
  --accept fidelity/gate/snapshots/2026-10-28/c04/accepted.json --step 13-phase-c-04 \
  --out fidelity/results/run-all/c04-tip
```

- **runId 20261028T034745Z**, git 45af35f (0 dirty), exit 3. Every preflight line ok; every step
  ok (code-checks, wpt, crashtests 239/239, corpus, oracles-fixtures, oracles-corpus incl. PDF/A-2b
  qpdf + veraPDF, layout-diff, pdf-probe, pdf-probe-suite, doc-aggregate, paint-probe). Copy:
  `~/Repositories/vellora-fidelity-runs/run-all-c04-tip-20261028T034745Z-blitz-0.3.0-beta.4-vellora-45af35f`
  (with `gate-contract/`). One launch only.
- WPT 4157 passes (c03 3762; +408, -13); identical outcomes to the pre-run `w2`. The 46 product
  PDFs are byte-identical to the pre-run `m1` (separate processes, DET-1). Against c03, 13 of 46
  PDFs changed bytes (the run merge, z-order, canvas, dashes, decorations); none changed a
  doc-aggregate metric.
- Ledger shrink (c03 recipe): `node fidelity/gate/snapshots/2026-10-28/c03/scripts/shrink-ledger.mjs
  --run <RUN> --step 13-phase-c-04 --accept .../c04/accepted.json --out fidelity/baselines/port/DEBT.json`
  -> 2 entries / 5 keys; `floats-153` and `inline-formatting-context-001` closed as fixed (head
  class none). Previous ledger frozen as `DEBT-c03-tip.json`. `debt.mjs check --base
  .../10-final/DEBT-10-integration.json --report <RUN>/gate/gate-report.json --head-dir
  fidelity/baselines/port/00-start --run <RUN>`: **0 problems**.
- Post-hoc contract re-gate (same command as c03's, `--step 13-phase-c-04`, `--accept` this
  directory's accepted.json, shrunk ledger): exit 3. Report `gate-report-c04-tip-contract.{json.gz,md}`;
  the run's own `gate-report-c04-tip-run.json.gz`.

## Exit contract, per condition (post-hoc contract re-gate)

| condition | status | numbers |
|---|---|---|
| (1) pin --main: 0 (c) | **NOT MET** | pin (a) 4, (b) 4, (c) **5**, declared 10. The 5: `css/css-break/flexbox/multi-line-column-flex-fragmentation-054/055/058.html`, `css/css-break/ruby-003.html`, `css/css-text/hanging-punctuation/hanging-punctuation-first-002.html`. 0 fixture words |
| (2) doc aggregate >= pin per fixture | MET 9/9 | docRegressions 0; table below |
| (3) pages == Chrome | MET 9/9 | contractPagesFailing 0 |
| (4) previous-link ratchets | MET outside (1) | vs 10-integration: gating 5 = the 5 pin (c) items, nothing else; head vs 00-start: PASS, headGating 0, debt 5, accepted 6 |

Verdict FAIL, so **no baseline 11-phase-c was written** and `DEBT-BASE.json` was not moved.

Of c03's 27 pin (c) items, 22 now really pass: the 9 floats items, the 12 text items and
monolithic-overflow-014 (pages [4, 4], rawOutcome pass). Why the 5 remain (from the branch
records, not re-derived here):

- 054 / 055 / 058: Blitz/taffy/stylo_taffy 0.3.0-beta.4 have no multi-column layout; the pin's
  pass came from taffy 0.11 wrapping an auto-height column flexbox, which taffy 0.15 stopped (per
  spec). Needs a multicol layout (`../c04-frag/README.md`).
- ruby-003: Blitz has no ruby layout (`../c04-frag/README.md`).
- hanging-punctuation-first-002: proposed class a (`../c04-text/accepted-proposed-hanging-punctuation.json`):
  the pin dropped a line-start U+3000 whatever the property says, neither Stylo 0.18 nor 0.22 has
  `hanging-punctuation`, and Chrome 155 fails the test. **What-if** re-gate with that entry added
  (`gate-report-c04-tip-whatif-hanging-punctuation.json.gz`, not the step's acceptance): pin (a) 5,
  (c) 4, everything else equal. Awaiting the decision.

## accepted.json (step 13-phase-c-04)

12 class-a entries: c03's 8 (2 postmark masthead pairing artefacts; 6 css/CSS2/pagination false
passes, now unused because break-after makes them pass), table-border-007 (floats) and
page-name-flex-001/002/004 (frag). monolithic-overflow-014 is not carried: it really passes.
Unused against the previous link: the 8 c03 entries.

## Doc aggregate (`doc-aggregate-c04-tip.json`; equal to c03 in every metric)

| fixture | pages (Chrome) | median mm | <=1 mm share | missing words |
|---|---|---|---|---|
| invoice | 3 (3) | 0.1 | 100 % | 0 |
| receipt | 2 (2) | 0.05 | 100 % | 0 |
| boleto | 1 (1) | 0.12 | 100 % | 0 |
| boleto-febraban | 1 (1) | 0.08 | 100 % | 0 |
| danfe | 1 (1) | 0.21 | 100 % | 0 |
| notification | 1 (1) | 0.01 | 100 % | 0 |
| text-stress-ptbr | 7 (7) | 0.02 | 100 % | 0 |
| oss-postmark-receipt | 2 (2) | 0.13 | 97.2 % | 2 (class-a text-shadow copy) |
| oss-sparksuite-invoice | 1 (1) | 0 | 100 % | 0 |

Paint probe (`paint-probe-c04-tip.json`, report-only): equal to the paint branch's after record.
Side-by-side images (Chrome | pin v0.2.0 | c04): `~/Repositories/vellora-fidelity-runs/visual-compare-c04/out/compare.html`
(+ `metrics.json`; script `visual-compare-c04/scripts/build.py`, c03's with c04 labels).
