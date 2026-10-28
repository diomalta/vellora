# Phase C 05 probe: what the last 5 pin (c) items are (2026-10-28)

Branch `phasec/05-probe` from `phasec/04-verify` 3545ce4. No gated run was made in this step. Every
number below is from local macOS (darwin 27.0.0 arm64), Node v22.23.2, Chrome for Testing
155.0.8059.85, PyMuPDF 1.28.2, 2026-10-28, and is INDICATIVE. Probe store:
`~/Repositories/vellora-fidelity-runs/c05-probe/` (scripts, inputs, PDFs, PNGs).

The renders:

- **Published engine (pin):** v0.2.0 = 5810062, Blitz rev 2003ba5 (blitz-dom 0.3.0-alpha.5, taffy
  0.11.0-experimental-cache-fix.3, parley 0.10, stylo 0.18). It is a `git archive` export built
  with a fresh `target/` (`c05-probe/pin-src`).
- **Tip:** `phasec/04-verify` 3545ce4 (blitz 0.3.0-beta.4, taffy 0.15, parley 0.12, stylo 0.22).
- **Chrome:** CfT 155.

The WPT renders come from `fidelity/wpt/run.mjs --chrome <CfT 155> --artifacts all --keep-pdf`,
filtered to the 5 tests. The pin run used `--vellora <pin dist> --xhtml-parser html`
(`c05-probe/wpt-pin`); the tip run used the product path (`c05-probe/wpt-tip`). The pin run passed
5/5 with 0 ink flags. That equals the committed pin expectations
`baselines/wpt/blitz-2003ba5fc2d8.json`, which were produced from vellora 985b112 on the same Blitz
rev: 5/5 clean passes (CONFIRMED).

The feature-ablation variants (`c05-probe/inputs/*-nocol.html`, `*-noruby*.html`) were rendered
with `c05-probe/scripts/render-variants.mjs` (renderPdf strict, 800x600 px page, margin 0) and
`chrome-print.mjs` (the harness's screen print settings).

The pin draws every page 11.25 pt higher than Chrome and the tip: its leading `<p>` margin is lost
on the test and the reference alike. Below, "rect for rect" means after that shift.

## 1. The four multicol items: pin passes are genuine by GATE-A3, coincidental by mechanism

| test | pin test vs Chrome test | tip test | pin with the feature removed | Chrome with the feature removed | tip with the feature removed |
|---|---|---|---|---|---|
| multi-line-column-flex-fragmentation-054 | equal rect for rect: green 50x100 + 50x90 + abspos 50x10 | one flex line, 100 px wide: 100 + 10 px red gap + 90 (fail, 10000 px) | `columns` removed: same as with it (2 flex lines) | `columns` removed: one line, 100x100, gap, 100x90 | equal to Chrome rect for rect |
| ...-055 | equal rect for rect (5 green pieces) | one line (fail, 9500 px) | same as with it | one line | equal to Chrome |
| ...-058 | equal: 3 items at x 6-30.75 / 30.75-56.25 / 56.25-81 pt | 3 items stacked with 100 px gaps (fail, 40000 px) | same as with it | stacked | equal to Chrome |
| ruby-003 | equal: two contiguous 50 px inline-blocks from the box top | a 3 pt (4 px) red gap between them (fail, 800 px) | `columns` and/or `ruby`/`rt` removed: unchanged | ruby removed: second block in an overflow column (x 93-168 pt); multicol removed: annotation overflows the box top (y 25.5 pt) | ruby + multicol removed: 37.5-75 and 78-115.5 pt = Chrome rect for rect |

Notes on the table:

- 058: the pin's single green rect is three items merged by the display-list rect merge.
  CONFIRMED by a variant with items 2 and 3 in `#008001` / `#008002`: three rects at Chrome's x
  ranges.

**What the table shows (CONFIRMED on these renders):**

- The pin's test render equals Chrome's test render. It has no ink flags and equal page counts. So
  GATE-A3 (a) ("the old test render equalled the reference but not Chrome") does not apply, and no
  class-a entry is written for these four.
- The pin's render does not depend on the feature under test. Remove `columns` (or `ruby`) and
  the pin draws the same rects.
- Chrome on the same ablated markup draws what the tip draws, rect for rect.
- So the pin passed through two of its own defects, which coincide with Chrome's fragmented
  picture:
  - flex: a `flex-flow: column wrap` box with `height: auto` breaks lines at its parent's 100 px
    height. HYPOTHESIS: Taffy 0.11-experimental uses the definite available height as the line
    limit.
  - inline: no strut descent below a line of inline-blocks.
- The tip fixed both toward Chrome. That is why these tests regressed.

**Consequence:**

- To pass these four tests as Chrome does, vellora needs multi-column fragmentation:
  - column boxes;
  - `column-fill: auto`;
  - `break-before: column` (054);
  - flex fragmentation with the csswg-drafts#11520 gap suppression (054/055/058).
- ruby-003 also needs ruby layout, and needs it together with multicol: neither alone reproduces
  Chrome's picture.
- Bringing back the pin's flex or strut behaviour would make vellora differ from Chrome on content
  without multicol. That is not an option under "product target = Chrome".

## 2. hanging-punctuation-first-002: class a entered

The pin drops a line-start U+3000 whether or not the property is there (CONFIRMED). The step-4
verifier had left this UNVERIFIED.

Pin (PyMuPDF rawdict, `c05-probe/scripts/chars.py`):

- The test, the test with `hanging-punctuation: first;` deleted, and the reference all emit **no**
  U+3000 glyph.
- In all three, U+2193 is at x0 6.00 pt.

Tip:

- U+3000 at 6.00-13.50 pt, U+2193 at 36.00 pt, with and without the property.

Chrome 155:

- U+3000 at 6.00-36.00 pt, U+2193 at 36.00 pt.
- Outcome fail (265 px). CONFIRMED in this probe and in the c04 run copy.

The entry is in `accepted.json` here (orchestrator decision (a)). It starts from
`c04-text/accepted-proposed-hanging-punctuation.json` and adds the evidence above.

## 3. accepted.json

`accepted.json` (step `14-phase-c-05`) has 13 entries:

- **Carried:** the 12 entries of `c04/accepted.json`.
- **Corrected:** the page-name-flex-001/002/004 reason text. Chrome's page counts are [4, 1],
  [3, 1] and [4, 2]. The old text said "N pages for both" (step-4 verify finding 5). 004 remains a
  real gap: vellora [3, 1].
- **New:** hanging-punctuation-first-002.

`c05-probe/scripts/build-accepted.py` builds the file from the c04 inputs.

With it, pin (c) is expected to be 4 (UNVERIFIED until a re-gate): 054/055/058/ruby-003. It is
not 0.

## 4. shrink-ledger.mjs

`c03/scripts/shrink-ledger.mjs` now requires `--label "<step name>"`. The label goes into every
`closed[]` reason and into the note; the text used to be hard-coded to "Phase C 03 tip (...)". The
logic is now an exported pure `shrinkLedger()`, tested in `gate/test/shrink-ledger.test.mjs`.

Equivalence check (CONFIRMED): the c04 shrink was re-run with the new script, using:

- `--ledger c04/DEBT-c03-tip.json`
- `--run <c04 run copy>`
- `--step 13-phase-c-04`
- `--label "Phase C 04 tip (floats + text + paint + frag merge; Blitz \`floats\` feature on)"`

Its `entries` and `closed` are deep-equal to the committed `baselines/port/DEBT.json`. Only the
note's wording differs.

## 5. Multicol in strict mode, and the exact effect of rejecting it

**Today (CONFIRMED):** strict mode accepts multicol and prints it in one column.

- Neither `COMPATIBILITY.md` nor `docs/compatibility.md` mentions `columns`, `column-count` or
  `column-width`, and none of them is on a denylist.
- `COMPATIBILITY.md` defines the subset as a denylist: anything not denied is "rendered
  best-effort".
- `docs/compatibility.md` says out-of-subset input "is rejected ... rather than rendered
  incorrectly".
- Probe `c05-probe/inputs/multicol-strict.html`: the tip renders `columns: 2` on a 400 px box with
  lines running to x 292 pt, the full width.

**How the gate would classify a rejection** (`gate/wpt.mjs`):

- A test that rendered and is now `unsupported` is class `rejection`. It gates against the
  previous link and the head unless a `declaredRejections` entry of the step covers it (GATE-A2).
- This holds for pass -> unsupported and for fail -> unsupported (D5).
- `wpt/run.mjs` marks a test `unsupported` when the test *or any reference* is rejected.

**The proposal:** branch `phasec/05-multicol-reject-proposal`, not merged. It rejects the
declarations in three places:

- the core gate (`css:multicol`, value-aware: `auto` and CSS-wide keywords pass, `column-gap` etc.
  stay in the subset);
- the `multicol` lint rule;
- `RULE_ID_TO_CORE_FEATURE`.

**Measured effect:** a full default WPT run of that build (`--chrome-from` the 10-tip run).
`multicol-reject-wpt-diff.json` here holds the full list.

- 775 tests change, **all** to `unsupported` / `css:multicol`. No other test changed.
- 76 c04 passes -> unsupported.
- 699 c04 fails -> unsupported.
- In the pin view, 54 pin clean passes would become `unsupported`, including the 4 items above
  and table-border-007.
- Chrome passes 755 of the 775.
- No fixture, corpus or probe HTML uses multicol (the 33 HTML inputs of the c04 run copy and the
  repo fixtures), so no verdict row changes.

**What it would mean for the gate:**

- Landing it would add 775 gating rejections.
- Declaring them (GATE-A2) would also turn the 4 pin (c) items into declared rejections. That
  would resolve contract (1) by declaration instead of by rendering, so it is an orchestrator
  decision.
- It would hide 699 real failures under one feature id and drop 76 clean passes.
- For that reason it is reported here and not committed on this branch.
