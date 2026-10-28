<!-- GENERATED FILE — DO NOT EDIT BY HAND.
     Regenerate with: node scripts/gen-compatibility.mjs
     Source of truth: crates/vellora-core/src/validation.rs -->

# Compatibility reference

vellora renders a documented HTML/CSS subset and is **strict by default**. This
reference is generated mechanically from the strict subset-validation denylists
in `crates/vellora-core/src/validation.rs`, so it cannot drift from what the
renderer actually accepts.

The subset is **denylist-based**: everything that is *not* explicitly denied
below flows to the layout engine and is rendered best-effort. A denied feature
is rejected by the strict gate with a `VelloraUnsupportedError` before any PDF
is produced (unless you opt into runtime fixing with `{ strict: false }`).

## Status levels

- **Supported** — in the subset; renders.
- **Partial** — in the subset (the gate accepts it), but with a documented caveat.
- **Planned** — designed but not yet implemented; accepted by the gate but has no effect on output in the current release.
- **Unsupported** — on a denylist; the strict gate rejects it. Rewrite required.
- **Dev-time-fixable** — rejected at render time, but `@vellora/lint.fix()` can
  transform it automatically (the applicable rule is named in the Notes column).
  The `vellora fix` CLI wraps the same library rule.

## Allowed and best-effort features

These are not on any denylist, so the strict gate accepts them.

| Feature | Status | Notes |
|---|---|---|
| Block & inline text, headings, lists | Supported | Rendered via the Blitz/Stylo/Taffy layout engine. |
| Tables (incl. multi-page, repeated `<thead>`) | Supported | Headers repeat across page breaks when they are at most a quarter of the page's content height (Chrome's rule); a taller header is printed once. `<tfoot>` rows print after the body; the footer is not repeated. |
| Blocks taller than a page | Partial | A block (or layout table) taller than a page is broken across pages as Chrome breaks it: between lines and boxes, never inside a line, an image, an `inline-block` or a table row that fits on a page, with at least two lines of a paragraph on each side of a break (`orphans`/`widows` are not read: 2 always), a `break-inside: avoid` box inside it started on a fresh page, a `break-before: page` inside it honoured, a nested table's `<thead>` repeated, backgrounds and borders continued (`box-decoration-break: slice`), and the overflow of an `overflow-y` clipping box not printed. A part that paints nothing makes no blank page (Chrome prints one), and a rounded border cut by a break is drawn whole on its first page. A block that fits on a page but not in the rest of the current one still moves whole to the next page. |
| Images: data URL PNG / JPEG / GIF / WebP | Supported | Base64 `data:image/...` sources are embedded as PDF image XObjects when the `<img>` has finite laid-out dimensions. |
| Images: `src` via the `images` option (with optional `baseUrl`) | Supported | A non-`data:` `<img src>` is resolved by looking up the caller-supplied `images` map (a `Record<string, Uint8Array>` keyed by `src`, optionally normalized against `baseUrl`); the format is detected from the bytes. A renderable `<img>` whose source does not resolve is rejected. |
| Images: network fetching of remote URLs | Unsupported | The core renderer never fetches assets (determinism + no network). Provide the bytes via the `images` option, keyed by the `src` (or `baseUrl`-resolved) URL. |
| `@page` margins, page numbers, running header/footer | Supported | Page size and margins are honoured; running content is drawn in the `@top-center` and `@bottom-center` margin boxes, with `counter(page)` / `counter(pages)`. The other margin boxes are rejected (see below). |
| `@page :first` / `:left` / `:right` | Partial | Every `@page` rule of every `<style>` element is read in cascade order (selectors, cascade layers, `!important`, `@media print`). A page selector may change `margin-top`, `margin-bottom`, the page height and the margin boxes per page. A rule that gives pages different content widths (page width minus the left and right margins) is rejected as `css:page-varying-width`: the document is laid out once, at one width. Route such a template to `engine: "chromium"`. |
| HTML parsing | Supported | Every document is parsed with the HTML parser, as a browser parses `text/html`, whatever its doctype or XML prolog: an XHTML doctype or `<?xml` prolog no longer switches to an XML parse (where `<br>` is not void and the text after it was lost). |
| `<table cellspacing>` / `<table cellpadding>` | Supported | Mapped like Chrome's presentational hints: `cellspacing` to `border-spacing` (in px), `cellpadding` to the cells' padding; author CSS (`border-spacing`, cell `padding`) wins over them, and a table without the attribute keeps the user-agent 2 px spacing. |
| `@media print` / `@media screen` | Supported | Documents are styled for print media, like a browser printing: `@media print` (and `all`, `not screen`) rules apply, `@media screen` rules do not. Media features (`width`, `height`, …) are evaluated against the first page's `@page` content box (whole CSS px); browsers use their own print page size instead. `@page` rules inside an `@media` block are read by media type only: a query with a media feature does not match for them (the page box decides the content box the features are measured against). The `media` attribute of a `<style>` element is not evaluated: its rules always apply. |
| `break-inside: avoid` / `break-before: page` / `break-after: page` (and `page-break-inside` / `page-break-before` / `page-break-after`) | Partial | Read from `<style>` rules (any selector Stylo parses), at the top level or inside `@media` blocks (each query list evaluated by Stylo exactly as for the style rules next to it: media type and media features, the features against the first page's `@page` content box), and from inline `style`; rules inside `@supports`/`@layer` are ignored. `break-inside: avoid` keeps together a top-level block, a transparent wrapper (`div`/`section`/`article`/`main`), an items table, or an items-table `<tbody>`; a group taller than an empty page falls back to its rows. `break-before: page` starts a top-level block, a wrapper child, a `<tbody>` or a `<tr>` on a new page. `break-after: page` starts the next in-flow sibling on a new page (a last child's break moves to its parent; on a row flex item it goes after the line; nothing follows a break after the last box; an empty element after it still gets its page; inline-block, floated and absolutely positioned boxes ignore it). Named pages (`page: <name>`) and `orphans`/`widows` are not implemented. |
| Fonts: text shaping + subset embedding | Supported | Text is shaped and the resolved font is subset and embedded into the PDF. |
| Fonts: custom faces via the `fonts` option | Supported | Caller-supplied font faces (a `Uint8Array[]` of raw TTF/OTF bytes) register into the deterministic font context and are reachable from CSS by each face's intrinsic embedded family name (`font-family: "Inter"`); family/weight/style are read from the bytes. Custom faces never override the CSS generics, no host/system font is consulted, and bytes that are not a parseable font reject with `font:invalid`. |
| Fonts: declared family aliasing / `@font-face` `src` / subsetting config | Unsupported | A face is reachable only by its intrinsic embedded family name — the `@font-face` model (a caller-declared alias decoupled from the font's own name), resolving `@font-face` `src` URLs from the document CSS, weight/style overrides, variable-font axis selection, and font-subsetting configuration are not provided. |
| `display: flex` | Partial | Not on a denylist, so the gate accepts it, but it is not a full flexbox implementation. Prefer tables for reliable layout; `@vellora/lint.fix()` (`flex/grid-in-td`) can convert common table-cell cases. |
| Inline SVG (`<svg>`) | Dev-time-fixable | Not handled at render time; `@vellora/lint.fix()` rule `inline-svg` rasterizes it to PNG. The CLI `vellora fix` wraps the same rule. |
| `<img>` without explicit dimensions | Dev-time-fixable | `@vellora/lint.fix()` rule `img-dimension-attrs` adds intrinsic `width`/`height` so layout is deterministic. The CLI `vellora fix` wraps the same rule. |

## Unsupported HTML elements

These elements are in `DENIED_ELEMENTS` and are rejected by the strict gate.

| Feature | Status | Notes |
|---|---|---|
| `<script>` | Unsupported | Rejected by the strict gate (scripting). |
| `<canvas>` | Unsupported | Rejected by the strict gate (scripting / dynamic raster). |
| `<video>` | Unsupported | Rejected by the strict gate (media). |
| `<audio>` | Unsupported | Rejected by the strict gate (media). |
| `<iframe>` | Unsupported | Rejected by the strict gate (embedded browsing context). |
| `<object>` | Unsupported | Rejected by the strict gate (embedded content). |
| `<embed>` | Unsupported | Rejected by the strict gate (embedded content). |
| `<applet>` | Unsupported | Rejected by the strict gate (embedded content). |
| `<input>` | Unsupported | Rejected by the strict gate (interactive form control). |
| `<button>` | Unsupported | Rejected by the strict gate (interactive form control). |
| `<select>` | Unsupported | Rejected by the strict gate (interactive form control). |
| `<textarea>` | Unsupported | Rejected by the strict gate (interactive form control). |
| `<form>` | Unsupported | Rejected by the strict gate (interactive form). |
| `<marquee>` | Unsupported | Rejected by the strict gate (animation). |
| `<blink>` | Unsupported | Rejected by the strict gate (animation). |
| `<noscript>` | Unsupported | Rejected by the strict gate (scripting fallback). |

## Unsupported CSS properties

These properties are in `DENIED_CSS_PROPERTIES` and are rejected by the strict
gate. Matching is at a **property boundary**: `text-transform` is allowed even
though it contains `transform`.

| Feature | Status | Notes |
|---|---|---|
| `animation` (css:animation) | Unsupported | Rejected by the strict gate. Matched at a property boundary only — a longer property name that merely contains `animation` as a substring is unaffected. |
| `transform` (css:transform) | Unsupported | Rejected by the strict gate. Matched at a property boundary only — `text-transform` is allowed even though it contains `transform`. |
| `transition` (css:transition) | Unsupported | Rejected by the strict gate. Matched at a property boundary only — a longer property name that merely contains `transition` as a substring is unaffected. |
| `filter` (css:filter) | Unsupported | Rejected by the strict gate. Matched at a property boundary only — a longer property name that merely contains `filter` as a substring is unaffected. |
| `backdrop-filter` (css:backdrop-filter) | Unsupported | Rejected by the strict gate. Matched at a property boundary only — a longer property name that merely contains `backdrop-filter` as a substring is unaffected. |
| `perspective` (css:3d-transform) | Unsupported | Rejected by the strict gate. Matched at a property boundary only — a longer property name that merely contains `perspective` as a substring is unaffected. |

## Unsupported CSS at-rules and values

These tokens are in `DENIED_CSS_TOKENS` and are rejected by the strict gate.

| Feature | Status | Notes |
|---|---|---|
| `@keyframes` (css:keyframes) | Unsupported | Rejected by the strict gate. |
| `display:grid` (css:grid) | Dev-time-fixable | Auto-fixable via `@vellora/lint.fix()` rule `flex/grid-in-td`; the CLI `vellora fix` wraps the same rule. |

## Unsupported `@page` margin boxes

These margin boxes are in `DENIED_PAGE_MARGIN_BOXES` and are rejected by the
strict gate as `css:page-margin-box`. The native renderer draws only
`@top-center` and `@bottom-center`; use one of those, or route the template to
`engine: "chromium"`.

| Feature | Status | Notes |
|---|---|---|
| `@top-left-corner` (css:page-margin-box) | Unsupported | Rejected by the strict gate. Not drawn by the native renderer. |
| `@top-left` (css:page-margin-box) | Unsupported | Rejected by the strict gate. Not drawn by the native renderer. |
| `@top-right-corner` (css:page-margin-box) | Unsupported | Rejected by the strict gate. Not drawn by the native renderer. |
| `@top-right` (css:page-margin-box) | Unsupported | Rejected by the strict gate. Not drawn by the native renderer. |
| `@bottom-left-corner` (css:page-margin-box) | Unsupported | Rejected by the strict gate. Not drawn by the native renderer. |
| `@bottom-left` (css:page-margin-box) | Unsupported | Rejected by the strict gate. Not drawn by the native renderer. |
| `@bottom-right-corner` (css:page-margin-box) | Unsupported | Rejected by the strict gate. Not drawn by the native renderer. |
| `@bottom-right` (css:page-margin-box) | Unsupported | Rejected by the strict gate. Not drawn by the native renderer. |
| `@left-top` (css:page-margin-box) | Unsupported | Rejected by the strict gate. Not drawn by the native renderer. |
| `@left-middle` (css:page-margin-box) | Unsupported | Rejected by the strict gate. Not drawn by the native renderer. |
| `@left-bottom` (css:page-margin-box) | Unsupported | Rejected by the strict gate. Not drawn by the native renderer. |
| `@right-top` (css:page-margin-box) | Unsupported | Rejected by the strict gate. Not drawn by the native renderer. |
| `@right-middle` (css:page-margin-box) | Unsupported | Rejected by the strict gate. Not drawn by the native renderer. |
| `@right-bottom` (css:page-margin-box) | Unsupported | Rejected by the strict gate. Not drawn by the native renderer. |

## Nesting depth limit

The strict gate rejects documents whose element nesting exceeds
**192 levels** (the `MAX_NESTING_DEPTH` constant). Real documents nest only
a handful of levels deep; this cap rejects only pathologically deep markup.
