# Phase C 05, float rule: the no-wrap float fixup follows Chrome, not Gecko (2026-10-28)

Branch `phasec/05-float-rule` from `phasec/04-verify` 3545ce4. Orchestrator decision (b): the
second half of `float_avoidance_fixups` (`crates/vellora-core/src/blitz_engine.rs`) used Gecko's
rule (a float after text on an unbreakable line goes below the line when ANY glyph run of that
line overlaps it). Chrome 155 keeps the float on the line when the content BEFORE it fits beside
it, and fails WPT `css/CSS2/floats/float-nowrap-8.html`. The product target is Chrome, so the
fixup now tests only the glyph runs before the float.

Local macOS (darwin 27.0.0 arm64, Apple M5 Pro), Node v22.23.2, rustc 1.96.0, Chrome for Testing
155.0.8059.85, WPT 9d8aceec, tools image `vellora-fidelity-tools:baseline-beta4`. Every number here
is INDICATIVE. Run copies are under `~/Repositories/vellora-fidelity-runs/c05-float-rule/`.

## The change

One filter in `float_avoidance_fixups`: `.filter(|run| run.0 < at)` on the line's glyph runs before
the overlap test. The "a float that starts its line keeps it" early exit is now a consequence of
the same filter (no run precedes such a float). The Blitz bug it compensates is unchanged
(blitz-dom 0.3.0-beta.4 `src/layout/inline.rs` 722-765 places a float at `state.line_y()`), and so
are the comment's citation, its repro (float-nowrap-1) and the raw canary
`blitz_still_places_a_float_over_its_nowrap_line`. The canary's message now also says to keep the
new Chrome-number test when the canary fires (a Blitz fix that follows Gecko's rule would make that
test fail).

## Chrome 155 measured on small repros

`scripts/gen_repros.py` writes 22 repros (monospace 16 px, `line-height: 20px`, a `#c` div of 10ch
unless noted); `scripts/chrome_floats.mjs` prints the float's rect relative to the div and each
text node's x in Chrome for Testing 155.0.8059.85, print media
(`chrome-155-float-repros.jsonl`, ch = 9.633 px). `float-top-chrome-vs-blitz.txt` puts the float's
top (px below the div's top) next to raw Blitz, the c04 fixup (3545ce4) and this branch:

| repro | content | Chrome | raw | c04 | c05 |
|---|---|---|---|---|---|
| n8 (= float-nowrap-8) | `Some <f 5ch>text that overflows my parent.` | 0 | 0 | 20 | 0 |
| n7 (= float-nowrap-7) | `S<f 5ch><span>ome</span> text …` | 0 | 0 | 20 | 0 |
| n1, n2 (= float-nowrap-1, -2) | 35ch / 14ch of text, then the float | 20 | 0 | 20 | 20 |
| wide-right | 30ch line: `Hello world <f 5ch>and more text that overflows the box by far` | 0 | 0 | 20 | 0 |
| fit-sp | `Some <f 6ch>text after` (4ch + 6ch fit: the collapsible space does not count) | 0 | 0 | 20 | 0 |
| over1 | `Somex<f 6ch> text after` | 20 | 0 | 20 | 20 |
| pre-sp6 | as fit-sp under `white-space: pre` (the preserved space counts) | 20 | 0 | n/a | 20 |
| nbsp6 | `Some&nbsp;<f 6ch>text after` | 20 | 0 | n/a | 20 |
| margin / margin-over | `Some <f 4ch, margin-left 2ch>` / `Somex<f 4ch, margin-left 3ch>` | 0 / 20 | 0 / 0 | 20 / 20 | 0 / 20 |
| two-floats | `Ab<g 3ch>Cd <f 3ch>more text after` | 0 | 0 | 20 | 0 |
| second-line | `Line one<br>Ab <f 5ch>cdefghijklmnop` | 20 (line 2) | 20 | 40 | 20 |
| wide-first | `<f 12ch>Some text after` | 0 | 0 | n/a | 0 |
| left-fit, left-fit10 | `Some <left f 5ch>text …` in 20ch / 10ch | 0 | 0 | 0 | 0 |
| **left-over** | `Some text <left f 5ch>that …` | **20** | 0 | 0 | **0** |

(n/a: repro added after the c04 measurement.) Float tops equal Chrome on **21/22** (c04: 7/18).
The one miss, `left-over`, is unchanged by this step and was missed at c04 too: Blitz shifts
the whole line, the text before the float included, right of a left float at the line's top, so no
run before the float overlaps it. Chrome 155 puts that float below the line with the text at
x = 0. Fixing it would need a width test plus moving the text back, so it is left as an open gap
(written in the code comment). The Blitz numbers come from a temporary `#[ignore]` probe test that
was not committed (`blitz-c04.txt`, `blitz-c05.txt` in the run store).

Unit tests (`raw_blitz_tests.rs`): new `float_avoidance_keeps_a_float_whose_preceding_text_fits`
(n8, wide-right and fit-sp stay at the line's top; over1 and pre-sp6 move to the line's bottom). It
FAILS with the Gecko rule put back (CONFIRMED, filter removed by sed, then restored). The canary
`blitz_still_places_a_float_over_its_nowrap_line` passes on raw Blitz. On a simulated Blitz fix
(`raw_layout` replaced by `product_layout` inside the canary) it FAILS with its message: float
15 px below the div's top, Chrome 15 (CONFIRMED). The canary was then restored.

## WPT: full run, every directory (`w1`)

`node fidelity/wpt/run.mjs --raw --chrome-from <10-tip>/wpt/results.json --expectations none --out
~/Repositories/vellora-fidelity-runs/c05-float-rule/w1` (8047 tests; run
20261028T042800Z; working tree on 3545ce4 plus this change; the product code equals the
committed one, later edits were comments only). Compared with the c04 gated run
20261028T034745Z (`w1-vs-c04.txt`):

- Passes 4157 -> **4155**. Outcome or rawOutcome changes: exactly **float-nowrap-7** and
  **float-nowrap-8**, both pass -> fail, both failed by Chrome 155. Across all 8047 tests, the
  product comparison signature (maxDifference, totalPixels, page counts) changed on those two
  only, and the raw signature changed on 0. All 1102 tests whose path names a float or clear
  test were checked, and so were css/CSS2/floats and css/CSS2/floats-clear.
- vellora now fails both the way Chrome does: maxDifference 255, 1169 px against
  float-nowrap-1 (Chrome 255, 1159 px); ink bbox [8,8,277,46] (Chrome [9,8,278,46]).

## Fixtures: layout-diff and doc-aggregate (`m1`)

`node fidelity/run-all.mjs --only corpus,layout-diff,pdf-probe,pdf-probe-suite,doc-aggregate
--chrome <CfT 155> --tools-image vellora-fidelity-tools:baseline-beta4` (copy `c05-float-rule/m1`):

- The 46 product PDFs (9 fixtures and the probes) are byte-identical to the c04 run copy's.
- doc-aggregate: every metric is equal on 9/9. Only `inputs.chromePdfSha256` differs, because
  Chrome's PDF bytes vary from run to run and the gate does not use them. The layout-diff reports
  equal c04's except env and command fields and the browser-input hash line.
- No fixture uses floats (step-4 finding), so this was expected.

## Gate placement and the proposed acceptance

float-nowrap-8 was **fail** at port/10-integration
(`fidelity/baselines/port/10-integration/wpt/expectations-blitz-0.3.0-beta.4.json`; 10-tip run:
outcome fail, 3045 px, rawOutcome fail) and at the head port/00-start. It is therefore NOT a
regression for the previous-link or the head ratchet. It passed only at the c04 tip, which is not
a baseline, and at the pin (published v0.2.0, 5810062), where the pass was false:

- The pin build (`c04-floats-iter/pin-src`, its `blitz_engine.rs` equal to 5810062's by sha256,
  Blitz 2003ba5, floats feature off) renders float-nowrap-8, float-nowrap-1 and
  float-nowrap-1-notref byte-identically (PDF sha256 `4b0c1ddc54a615ed…`).
- float-nowrap-1-notref is the mismatch reference that float-nowrap-1 must differ from.
- In all three renders the blue box is drawn over the start of the line.

So the only view that sees it is the pin view, where it would become a (c) item.
`accepted-proposed.json` (step id `14-c05-float-rule`, unused before) holds one class-a entry for
it. Its reason is "Chrome itself fails", Chrome's outcome is cited, and the false pin pass is the
second ground. float-nowrap-7 needs no entry: it failed at the pin, 00-start and 10-integration.

**What-if re-gate** (post-hoc, the c03/c04 contract command, `--step 14-c05-float-rule`, on a
DERIVED run: the c04 run copy with `wpt/` replaced by `w1`; the fixture side is c04's, whose PDFs
`m1` reproduced byte for byte; this is not a gated run):

| acceptance file | pin (a) | pin (b) | pin (c) | vs 10-integration gating | head |
|---|---|---|---|---|---|
| c04/accepted.json only | 4 | 4 | **6** (the 5 + float-nowrap-8) | 6 = the pin (c) items | PASS, 0 |
| c04 + this proposal (`gate-report-c05-float-whatif-contract.*`) | 5 | 4 | **5** (unchanged list) | 5 | PASS, 0 |
| c04 + this proposal + hanging-punctuation proposal | 6 | 4 | **4** (054/055/058, ruby-003) | 4 | PASS, 0 |

In every row, doc-aggregate PASS, contract conditions 2 and 3 PASS, flagged passes lost 27 (the
same as c04), and debt 5.

## Not done here

- No gated run. The merge step owns it and must pass `--accept` with this entry merged in.
- No ledger change and no DEBT key. No tolerance, I1 or oracle change.
- Open gap: a left float that does not fit after no-wrap text (see above).
