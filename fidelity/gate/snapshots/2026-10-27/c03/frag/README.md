# Phase C step 03: oversize-fragment slicing (table fragmentation), gated run record

Branch `phasec/03-table-frag` (from `phasec/02-verify` 9e06be6): 741e544 (slicer), c7b86fd (WPT-driven
refinements), 8dd2bbd (step acceptances). The gated run ran on 8dd2bbd. Local macOS, so the numbers
are INDICATIVE.

- Command: `node fidelity/run-all.mjs --gate --main --contract --chrome <Chrome for Testing 155.0.8059.85>
  --baseline fidelity/baselines/port/10-integration --chrome-from <10-tip>/wpt/results.json
  --tools-image vellora-fidelity-tools:baseline-beta4 --accept fidelity/gate/snapshots/2026-10-27/c03/frag/accepted.json
  --step 12-table-frag --out fidelity/results/run-all/c03-frag`
- runId 20261028T005540Z, exit 3 (FAIL). The run was copied to
  `~/Repositories/vellora-fidelity-runs/run-all-c03-frag-20261028T005540Z-blitz-0.3.0-beta.4-vellora-8dd2bbd`.
- Environment: darwin 27.0.0 arm64 (Apple M5 Pro), Node v22.23.2, rustc 1.96.0, tools image c405e06c,
  2026-10-28T00:55Z.
- Files here: `gate-report-c03-frag.json.gz` (the gate report), `doc-aggregate-c03-frag.json`, and
  `accepted.json` (the step's class-a acceptances).

## What Chrome does with oss-postmark-receipt (CONFIRMED, Chrome 155 PDF and PyMuPDF words and fills)

The body holds one layout table, `table.email-wrapper`, with one row and one cell. Inside it is
`table.email-content`, with three rows: masthead, body and footer. The body row holds
`table.email-body_inner`, with one row whose cell `td.content-cell > div` holds
h1, p, p, `table.discount`, `table.purchase`, p, p ("Cheers, The [Product Name] team"),
`table.body-action` (the "Download as PDF" button) and `table.body-sub`.

- Chrome breaks inside the single rows of the three nested layout tables. The break falls between
  the "Cheers" p and `table.body-action`, a break between siblings.
- Page 1 ends with "team" (baseline 769.5 pt).
- Page 2 starts with `table.body-action`: the button's border starts at the top of the content
  box, and "Download" sits at a 46.5 pt baseline. Then come `body-sub` and the footer row.
- The white body column on page 1 runs down to the bottom of the content box (813 pt), so the
  broken box stretches to the end of the page.

Before this step, vellora placed the whole table (one oversize fragment) on page 1. Its tail was
emitted below the page edge, and 37 words were off the page.

## Results

- **oss-postmark-receipt**: 2 pages, as in Chrome (was 1).
  - Off-page words: 37 → 0.
  - pdf-probe: 178 words paired (was 138); unpaired vellora 3 → 0, unpaired Chrome 42 → 2. The 2
    remaining are Chrome's white text-shadow copy of the masthead, an artefact accepted at
    10-integration.
  - doc-aggregate: missing words 39 → 2, median 0.19 mm, 97.2 % of words within 1 mm.
- **Probes**: g_inline_body off-page 66 → 0 (3 of 3 pages), g_postmark_raw 23 → 0 (2 of 2).
- **Unchanged PDFs**: the other 8 corpus fixtures and the other 35 probes are byte-identical to
  c02-tip.
- **Contract (3), pages == Chrome**: met on 9 of 9 (`contractPagesFailing 0`).
- **Gate vs 10-integration**: gating 294, made of:
  - 127 text-stress I1 regressions (the c02 LayoutUnit residual, unchanged);
  - 167 pin-c items.
  - No item added by this step. 6 items accepted.
- **Head**: head-regression 88 → 85. The 3 postmark step-10 artefacts are gone; nothing was added.
- **Pin**: (c) 193 → 193, the same keys.
- **WPT vs c02-tip** (8047 tests): 11 pass → fail and 4 fail → pass, all in fragmentation tests.
  - Pass → fail, clean (6): float-, row-, rowgroup-2/3- and table-1/2-page-break-inside-avoid.
    Each old pass was false by page count: vellora printed 2 (row-…-2: 1) pages, Chrome prints 3.
    The test now prints Chrome's 3 pages. The references depend on `page-break-after`, which
    vellora does not implement.
  - Pass → fail, flagged (5): flex 082c/d, 060, 069c/d. These were already flagged passes
    (ink-missing vs Chrome).
  - Fail → pass (4): block-001-wm-vlr/vrl, monolithic-overflow-015 and
    collapsed-border-fragmentation-001.

## Known gaps (next steps)

- `break-after` is not implemented. Implementing it would turn the 6 accepted references into
  real passes.
- Flex items keep their margins and gaps after a break in Chrome; vellora truncates them (flex
  060/082/069).
- A fragment that fits on a page, but not in the rest of the current one, still moves whole.
  Chrome breaks it.
- A continuation that paints nothing makes no blank page; Chrome prints one.
- A rounded border that a break goes through is drawn whole on its first page.
- One cut is shared by the whole fragment, so a row taller than a page does not break per cell.
