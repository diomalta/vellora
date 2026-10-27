---
"vellora": patch
"@vellora/native": patch
"@vellora/lint": patch
"@vellora/cli": patch
"@vellora/engine-chromium": patch
---

Move the native engine to Blitz 0.3.0-beta.4 from crates.io and port the layout layers to it.
Before this, the engine was a git revision of the 0.3.0-alpha.5 line (`2003ba5`). Layout output
changes for most documents. Outputs are still deterministic, but PDFs are not byte-identical to
those of the previous engine.

Gains, measured against the previous engine (main, Blitz git rev `2003ba5`) on the repo's
fidelity harness (local macOS, Chrome 155 reference; indicative, not CI):

- WPT reftests: 3709 of 8047 now pass (46.1%). The previous engine passed 2578 (32.0%). 1243
  tests went from fail to pass and 130 from pass to fail. The harness had already flagged 98 of
  those 130 as suspect passes (for example ink that differs from Chrome's, or a glyph or resource
  the test could not load). 128 of the 130 also fail
  in raw Blitz 0.3.0-beta.4 with no vellora code involved, for example `tab-size-integer-001..003`,
  `text-justify-and-trailing-spaces-003/004` and `css-break/ruby-003`.
- Documents are always parsed as HTML. An XHTML doctype or an `<?xml` prolog no longer switches to
  an XML parse that dropped the text after `<br>`.
- `<table cellspacing>` and `cellpadding` are applied like in Chrome.
- `@page :first`, `:left` and `:right` rules are read in cascade order. They may change the top and
  bottom margins, the page height and the margin boxes.
- `@media print` rules apply and `@media screen` rules do not.
- Table heading bands (for example in the sparksuite invoice) no longer show a 2 px gap between
  cells.

Losses and new rejections:

- A new strict-gate rejection, `css:page-varying-width`: an `@page` selector rule that gives pages
  different content widths. 10 WPT tests that rendered before are now rejected. Route such
  templates to `engine: "chromium"`.
- Some text sits further from Chrome's PDF than with the previous engine:
  - Right-aligned header text in the sparksuite invoice is 1.7 pt left of Chrome's PDF (0.2 pt
    before). vellora's layout matches the on-screen positions the harness reads from Chrome
    here, but Chrome's PDF places this right-aligned text about 2 px further right than those
    positions, and left-aligned text it does not. Which side is right is not settled yet.
  - The DANFE block titles sit up to 6.5 mm below the MOC 3.8.1 suggested positions (6.0 mm
    before). The cause is Blitz's own block placement: no vellora layer moves these titles.
- Long documents can still break pages differently from Chrome. The text-stress fixture prints 8
  pages where Chrome prints 7, as before.
