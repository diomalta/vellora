# Phase C step 04, fragmentation lane (branch phasec/04-frag)

Local macOS (darwin 27.0.0 arm64), Node v22.23.2, rustc 1.96.0, Chrome for Testing 155.0.8059.85,
2026-10-28: INDICATIVE. No gated run here: the gated run belongs to the merge step. Every WPT
number below comes from `node fidelity/wpt/run.mjs --raw --chrome-from
<10-tip>/wpt/results.json --expectations none` (the full default suites, 8047 tests), compared
per test with the c03 run 20261028T013052Z. Run copies under `~/Repositories/vellora-fidelity-runs/c04-frag-iter/`.

## What changed (product)

- `break-after` / `page-break-after` (break_css `resolve_break_after`): the next in-flow sibling
  starts a new page; a last child's break goes to its parent; a row flex item's break goes after
  its line; inline-block, floated and abspos boxes neither force nor take it; nothing follows a
  break after the last box; an empty element after the break keeps its page.
- Table headers: a `<thead>` repeats only when at most a quarter of the page's content height
  (Chrome probe, `probes/thead-repeat*.py`); `<tfoot>` rows follow the body; a one-row
  `break-inside: avoid` `<tbody>` keeps its avoid.
- Named pages (break_css `resolve_named_page_breaks`): breaks only; named `@page` rules still
  not applied.

All of it copies Chrome or the spec; none of it compensates a Blitz bug, so no raw canary
applies; tests in `crates/vellora-core/tests/fragmentation_hints.rs`.

## Results

| run | passes | vs c03 |
|---|---|---|
| c03 run 20261028T013052Z | 3762 | |
| full-4 (this branch, before the docs commits) | 3783 | 24 fail->pass, 3 pass->fail |

- The 6 class-a css/CSS2/pagination tests of c03 are real passes (pages [3,3] = Chrome).
- Flex fragmentation flagged at c02: 082c, 082d, 069c, 069d pass; 060 is multicol (below).
- Lost: css/css-page/page-name-flex-001/002/004, old vellora pass [1,1] vs Chrome [4,1] /
  [3,1] / [4,2] (Chrome fails all three): class-a entries in `accepted.json`.
- 9 fixtures and 37 probes: vellora PDFs byte-identical to the c03 run copy, so page counts and
  doc aggregates are unchanged. Crashtests 239/239 ok.

## Not fixed here, with the reason

- multi-line-column-flex-fragmentation-054/055/058 (and 060): multicol tests. blitz-dom /
  taffy / stylo_taffy 0.3.0-beta.4 have no multi-column layout (stylo_taffy convert.rs ~652:
  "if we ever implement multi-column layout"). The pin passed them because taffy
  0.11.0-experimental-cache-fix.3 (pin Cargo.lock) wrapped an auto-height column flex
  container against the ancestor's definite height (flexbox.rs 867-876); taffy 0.15.0
  flexbox.rs 1202-1210 stops that on purpose (spec-correct outside multicol). Making them pass
  needs a multicol layout, not a compensation.
- ruby-003: no ruby layout in Blitz beta.4 (the UA sheet gives `display: ruby`, the same as the
  pin's). vellora prints a 4 px gap between base and annotation (a line box with strut descent);
  why the pin did not is a HYPOTHESIS (parley 0.10 vs 0.12 line metrics), unverified.
- monolithic-overflow-014: the reference's `float: left` is not laid out as a float because
  vellora builds blitz-dom without its opt-in `floats` feature (the float lands at y -658 px
  above an 18 px flow-root, the text at x 0). With the feature on it passes [4,4]; that change
  is on branch phasec/04-floats (045498f), not here. The class-a acceptance is carried.
