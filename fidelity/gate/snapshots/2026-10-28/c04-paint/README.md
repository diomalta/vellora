# Phase C step 04: paint differences no oracle measured (branch `phasec/04-paint`)

Base: `phasec/03-verify` ee7f86b. Source of the task: the c03 verify finding 7. The side-by-side
images showed three paint differences that no committed oracle measured.

Environment for every number here: local macOS arm64 (darwin 27.0.0), Node v22.23.2, rustc
1.96.0, Chrome for Testing 155.0.8059.85, the fidelity reference print path
(`fidelity/lib/chrome-reference.mjs`), PyMuPDF from `fidelity/.venv`, dates 2026-10-27/28.
Local macOS numbers are INDICATIVE.

## The three differences and their cause

All three are CONFIRMED vellora gaps, not Blitz paint data. vellora does not link blitz-paint.
Its Cargo.toml has only blitz-dom, blitz-html and blitz-traits. It paints from its own display
list: `read_visuals` / `read_text_runs` produce it, and `pdf::emit` draws it. So the fixes need
normal tests. They need no raw-Blitz canary and no "delete when Blitz fixes it" comment.

| # | Difference (c03) | Minimal repro (`repro/`) | Cause | Fix (commit) |
|---|---|---|---|---|
| 1 | Body background not on the page (postmark page 2 white below the footer; Chrome grey) | `bgmulti.html`, `bghtml.html`, `bgfirst.html`, `bgbodyborder.html` | Pagination only lowers the body's children, so html/body backgrounds were painted nowhere. The canvas (CSS Backgrounds 3 §2.11.2) was not modelled. | 2496439: canvas = root bg, else HTML body bg. It fills each page's page area: `round(margin)` + `round(page-area size)`. Chrome A4 10 mm: 38..756 x 38..1085; `:first` 20 mm: 76..719 x 76..1047. The source element paints no background of its own. |
| 2 | Dashed (and dotted) borders drawn solid (danfe rows, postmark coupon, boleto cut lines) | `borders.html`, `borders2.html` | `read_visuals` and `collapsed_borders::paint_rects` emitted one solid rect per side, whatever the style. | 2496439: `src/border_pattern.rs`, Blink's rule fitted to 15 measured sides. `w < 3`: dash 3w, gap 2w. `w >= 3`: dash 2w, gap w. The gap is fitted so that whole dashes end flush with the side. Dotted: dots of w. |
| 3 | Link underlines missing | `deco.html`, `deco2.html`, `deco-sizes.html`, `deco-serif.html` | Blitz leaves decorations to its painter (blitz-dom 0.3.0-beta.4 `stylo_to_parley.rs` 509-521), and vellora had none. | 46a2d98 + 6b62178: `src/text_decoration.rs`. Lines come from the decorating boxes, with their font size, ascent, colour and baseline. They stop at inline-blocks, floats and abspos boxes. Equal to Chrome on 108 measured lines (8-48 px, Liberation Sans and Serif). |

Found and fixed by the full WPT diff (6b62178):
- Decorations sit on the decorating box's baseline, so `vertical-align` on descendants does not
  move them.
- `@page { background }` covers the whole page box. Chrome measured 0..794 x 0..1123
  (`pagebg.html`).
- A `display: none` root prints a blank page.

Known and not done:
- Chrome draws dotted borders of 4 px and wider as round dots. vellora draws them square.
- Dashed borders with a radius are still stroked solid.
- Decoration styles other than solid, `text-underline-offset` / `-position` and skip-ink are not
  modelled.
- A length `text-decoration-thickness` is used as given. This is UNVERIFIED against Chrome.
- Background images are not painted, as before.
- With `html { background }` set, the body's own background box is still not painted. This is a
  pre-existing pagination gap: body/html boxes never enter a fragment.
- `"Times New Roman"` is not aliased to Liberation Serif in vellora, as it is in the reference
  print.
- `@page { size: A5 }` is not parsed, as before.

## Measurement: paint probe (report-only, committed)

The probe is `fidelity/oracles/paint-probe.mjs` + `lib/paint-probe.mjs` + `py/paint.py`, run as
the run-all step `paint-probe`. Method and README entry: `fidelity/oracles/README.md`. No gate
rule reads it, and it always exits 0. It reads vector paint only:
- the canvas: the largest fill covering half the page, with its colour and coverage;
- dash/dot segments: filled sub-paths shaped like a dash or a dot;
- underlines: thin rects under a span's baseline, inside the span's extent.

Self-test: `fidelity/oracles/test/paint-probe.test.mjs`. It covers the synthetic comparison, and
`paint.py` on a PDF built with PyMuPDF that holds one of each paint plus its regressed form.

Before = the c03 tip run copy `run-all-c03-tip-20261028T013052Z-...-25c3f85`
(`paint-probe-before-c03-tip.json`). After = this branch at 6b62178, with layout-diff + pdf-probe
re-run on the 9 fixtures into `~/Repositories/vellora-fidelity-runs/c04-paint/after-final`
(`paint-probe-after-6b62178.json`). Format: vellora / Chrome.

| fixture | canvas mismatch pages before → after | dash segments before → after | underlines before → after |
|---|---|---|---|
| invoice | - → - | 0/0 → 0/0 | 0/0 → 0/0 |
| receipt | - → - | 0/0 → 0/0 | 0/0 → 0/0 |
| boleto | - → - | **0/135 → 135/135** | 0/0 → 0/0 |
| notification | - → - | 0/0 → 0/0 | 0/0 → 0/0 |
| boleto-febraban | - → - | **0/152 → 152/152** | 0/0 → 0/0 |
| danfe | - → - | **0/2052 → 2111/2052** | 0/0 → 0/0 |
| text-stress-ptbr | - → - | 0/0 → 0/0 | 0/0 → 0/0 |
| oss-sparksuite-invoice | - → - | 0/0 → 0/0 | 0/0 → 0/0 |
| oss-postmark-receipt | **[2] → -** | **0/136 → 136/136** | **0/5 → 5/5** |

The danfe surplus (2111 vs 2052) comes from the collapsed-border compensation. It paints each
horizontal edge extended over the vertical lines, so the corners close. Chrome's dashed segment
stops at the solid vertical border, so vellora's segments are about 1 px longer and some get
one more dash.

## No word, page or layout change on the 9 fixtures (CONFIRMED)

- PyMuPDF word origins (`oracles/py/words.py`) of every `vellora.pdf` are byte-identical to the
  c03 run's, 9/9. `native.html` is identical too.
- The layout-diff summary rows are identical, 9/9.
- doc-aggregate (`doc-aggregate-after-6b62178.json`) equals the c03 table on every fixture.
  Pages equal Chrome's 9/9. postmark is at 0.13 mm / 97.2 % / 2 missing, the known class-a
  text-shadow pair.

## WPT (all 8047 reftests)

Command: `node fidelity/wpt/run.mjs --raw --chrome-from <10-tip>/wpt/results.json
--expectations none`. Not gated. Diff vs the c03 run: `wpt-diff-c03-tip-vs-6b62178.txt`.

Passes: 3762 → 3766.

7 fail → pass:
- css/CSS2/backgrounds/background-body-001, background-root-001
- css/CSS2/normal-flow/min-height-percentage-003
- css/CSS2/visudet/height-percentage-003a
- css/css-page/basic-pagination-003-print, page-box-006-print,
  page-margin-negative-print.tentative

3 pass → fail. Each was a FLAGGED pass in the c03 run (`outcomes.json` `suspectPasses`), so
each is reported and not gating (GATE D6). Each old pass was false: vellora matched the
reference only because neither side painted what Chrome paints.

| test | c03 flags | Chrome | why it fails now |
|---|---|---|---|
| css/CSS2/backgrounds/background-root-007.xht | css-url-resource, ink-missing-vs-chrome | fail | The test's body has `background: red url(square-white.png)`. vellora paints no background images, so the canvas is now red where the reference is white. |
| css/css-page/media-queries-001-print.html | ink-missing-vs-chrome | pass | The body is red unless a print media query on the page size matches. vellora's media-query viewport (the page area of `@page { size: 10in; margin: 2in }`) does not match where Chrome's does. The red canvas is now visible; before, no body background was painted on either side. The fix belongs to media-query evaluation and is not done here: it changes the viewport every document is styled against. |
| css/css-text/word-space-transform/word-space-transform-018.html | uncovered-glyphs, ink-missing-vs-chrome | fail | `<u>` is now underlined. The test needs `word-space-transform: auto-phrase`, which vellora does not support. The Thai glyphs are not covered by the bundled fonts. The two sides now differ only in the underline's extent. |

css/CSS2/box-display/root-box-003 expects a green page for `html { display: none; background:
green }`. Chrome prints it blank and fails it. vellora follows Chrome:
css/css-page/root-element-display-none-print stays a clean pass.
