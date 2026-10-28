# Phase C step 04 probes (fragmentation)

Small print-mode documents written to measure Chrome for Testing 155.0.8059.85 where the WPT
tests of this step needed a rule the spec leaves open. Local macOS, 2026-10-28: INDICATIVE.

- `thead-repeat.py`, `thead-repeat2.py`: when Chrome repeats a `<thead>` (pagination.rs
  `header_repeats`).
- `break-after.py`: `break-after` / `page-break-after` (break_css.rs `resolve_break_after`,
  pagination.rs `finalize_fragments`).

Run (each generator writes its HTML next to itself and prints the file names):

```sh
python3 <dir>/thead-repeat.py
ROOT=<dir> node <dir>/both.mjs <repo> <out> print <file>...   # vellora + Chrome PDFs and PNGs
python3 <dir>/firstwords.py <out> <file>...                   # pages and first words per page
python3 <dir>/montage.py <out> <file>                         # vellora row over Chrome row
```

`both.mjs` renders with the built `packages/vellora` (the WPT harness preparation,
`fidelity/wpt/lib/vellora-render.mjs`) and prints with the Chrome for Testing build under
`fidelity/.cache/chrome` through the same page geometry as `fidelity/wpt/lib/chrome.mjs`.

Results (Chrome pages | first words per page):

| probe | Chrome | vellora at phasec/04-frag |
|---|---|---|
| thead-h48 (192 px content) | 4, HEAD on every page | 4, HEAD on every page |
| thead-h49 | 3, HEAD on page 1 only | HEAD on page 1 only (4 pages: Chrome also breaks inside the rows' empty height, a separate gap) |
| thead-tall-h120 (480 px content) | HEAD on every page | HEAD on every page |
| thead-tall-h121 | HEAD on page 1 only | HEAD on page 1 only |
| thead-sp-h40 (border-spacing 0 10px) | HEAD on every page | HEAD on every page |
| thead-h20-after (`thead { page-break-after: always }`) | 1 page | 1 page |
| thead-h60-after | 2 pages: HEAD / R1 | 2 pages: HEAD / R1 |
| ba-last, ba-last-nested | 1 page | 1 page |
| ba-empty-next, ba-empty-before | 2 pages (page 2 blank) | 2 pages |
| ba-propagate, ba-wrapped, ba-margin | 2 pages | 2 pages |
| ba-abspos-next | 2: One Abs / Two | 2: One Abs / Two |
| ba-inline-block | 1 page | 1 page |
| ba-float-next (a float after the break) | 2: One / Float Two | 2: One / Float Two |
| ba-float-source (`break-after` on a float) | 1 page | 1 page (floats are laid out in flow without the blitz-dom `floats` feature, so the words differ) |
| ba-flex-row (`break-after` on a row flex item) | 2: Item1 Item2 / Item3 After | 2: Item1 Item2 / Item3 After |
