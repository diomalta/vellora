# Phase C step 04, text / generated content / z-order (branch `phasec/04-text`)

Scope: 13 of the 26 b-provable pin (c) WPT tests of the c03 tip run (run 20261028T013052Z).
No gated run was made in this step (the full gated run belongs to the merge step). Every number
below is from local macOS (darwin 27.0.0 arm64, Node v22.23.2, rustc 1.96.0), 2026-10-28:
INDICATIVE.

## Status of the 13 tests

| Test | Status | Fix (commit) | Kind |
|---|---|---|---|
| css/css-text/tab-size/tab-size-integer-001/002/003 | pass | no glyph for a preserved tab (`pdf.rs`) | vellora painter, copies Chrome/spec, normal test |
| css/CSS2/generated-content/{after,before}-content-display-012/013 | pass | `hide_table_column_pseudos` | Blitz bug compensation, comment + raw canary |
| css/css-text/text-align/text-align-end-006 | pass | `rtl_line_end_whitespace` | Parley 0.12 bug compensation (no UAX #9 L1 per line), comment + raw canary |
| css/css-text/text-justify/text-justify-and-trailing-spaces-003/004 | pass | `rtl_line_end_whitespace` | same |
| css/CSS2/normal-flow/inline-table-zorder-001 | pass | atomic inline subtrees painted after block backgrounds (`pagination.rs`) | vellora painter, CSS 2.1 Appendix E, normal test |
| css/css-text/white-space/text-wrap-balance-text-indent-001 | pass | `balance_text_wrap` | Blitz gap compensation (Stylo parses `text-wrap` for Gecko only), comment + raw canary |
| css/css-text/hanging-punctuation/hanging-punctuation-first-002 | fail | none | class-a candidate, PROPOSED only (below) |

Each "pass" is the vellora outcome of `node fidelity/wpt/run.mjs` (vellora vs vellora reftest),
CONFIRMED on the full default suites (8047 tests, with `--raw`) at the tip of the balance commit:
36 fail -> pass against the c03 tip run's `wpt/results.json`, 0 pass -> fail; all 36 are Chrome
passes in that run. Raw outcomes: the two painter fixes apply to the raw-Blitz render too (its
painter is vellora's), the three compensations do not.

The 9 corpus fixtures and the 37 default probes, rendered at each commit and compared with the
c03 tip run copy's `vellora.pdf`: byte-identical, except `oss-postmark-receipt` and probe
`g_postmark_raw` after the z-order commit, where only the order of rects changed; their pdftoppm
96 dpi rasters are pixel-identical on every page, and text is untouched, so words, pages and the
doc aggregate cannot move (no oracle re-run here: UNVERIFIED by the gate until the merge run).

## accepted.json

`accepted.json` carries the 8 class-a entries of `2026-10-28/c03/accepted.json` verbatim and the
10-integration class-a acceptance of `wpt|css/css-page/monolithic-overflow-014-print.html` from
`2026-10-27/10-debt/accepted.json` (orchestrator decision (a); the test still fails: pages [4, 4]
equal Chrome's, pixels differ). Use it with `--step 13-phase-c-04-text` (or a successor).

## Proposed, not applied: hanging-punctuation-first-002

`accepted-proposed-hanging-punctuation.json` holds a ready class-a entry. Evidence (CONFIRMED,
2026-10-28): `hanging-punctuation` exists in neither Stylo 0.18.0 (pin) nor 0.22.0; Chrome 155
fails the test (c03 run `chrome.outcome`); the pin's pass came from dropping a U+3000 that starts a
line, with or without `hanging-punctuation` (pin build: down arrow at 51.35 pt in test and
reference; `<div>&#x3000;b</div>` alone also loses the U+3000 at the pin, while mid-line it keeps
its 1 em advance), whereas the tip keeps it (arrow at 81.00 pt vs 51.00 pt in the reference). Making the test pass
would mean implementing a property Chrome does not implement, against the "copy Chrome" rule.
The orchestrator decides whether this enters the step's `accepted.json`; until then the test is
the one pin (c) item of this scope.

## Found on the way (not changed here): Blitz float layout is compiled out

CONFIRMED: `crates/vellora-core/Cargo.toml` takes `blitz-dom = "=0.3.0-beta.4"` with
`default-features = false`, and blitz-dom's `floats` feature (`taffy/float_layout`,
`stylo_taffy/floats`) is not in its `default` list anyway, so vellora has never run Blitz's float
layout. On the reference of `monolithic-overflow-014-print` (a left float in a `flow-root`), the
layout dump puts "On the first page" at x 0, y 14 (over the float, not beside it); the paginator
then prints it on page 4 (how is not isolated: HYPOTHESIS that the slicer places it after the
oversize float). The test side (an inline-block) is fine, so 014's remaining failure is the float
side. Enabling `features = ["floats"]` (crates.io crate, no fork) is probably the common cause of
the floats-family pin (c) items too, but it changes the raw-Blitz baseline and every fixture with
a float: it needs its own step and gated run.
