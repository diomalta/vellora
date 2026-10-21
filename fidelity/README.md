# vellora fidelity oracles

Tooling that makes native-renderer fidelity **measurable and checkable by third parties**
(WPT, Chromium, WeasyPrint, veraPDF, qpdf, barcode decoders, independent text extractors)
instead of by our own eyes. Private, unpublished, and not a root workspace member — like
`benchmarks/`, its browser and Python dependencies never reach a published package.

## Layout and ownership

| Directory | Owns |
|---|---|
| `wpt/` | WPT reftest runner over the vellora pipeline (pinned WPT commit, sparse checkout into `.cache/`). |
| `layout-diff/` | Per-box layout-tree diff: Chromium print-media DOMSnapshot vs raw Blitz vs post-normalize boxes; first-divergence report. |
| `oracles/` | External PDF oracles: veraPDF, qpdf, barcode decode, three text extractors, WeasyPrint second layout oracle. |
| `baselines/` | Committed baseline results (JSON) that the merge ratchet compares against. |
| `ACCEPTANCE.md` | Per-document-class acceptance criteria, each traced to a primary source. |

Generated output goes to `results/` and downloaded inputs to `.cache/`; both are gitignored.

## Rules

- Every number records environment (OS, CPU, Node, Rust, Chrome, tool versions), command and date.
- Claims are labelled CONFIRMED / UNVERIFIED ASSUMPTION / HYPOTHESIS / DESIGN TARGET.
- An oracle is only trusted after it has been shown to catch a deliberately broken input.
- Local macOS runs are indicative; the pinned Linux CI run is authoritative.
