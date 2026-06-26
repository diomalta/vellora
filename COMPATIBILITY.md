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
- **Dev-time-fixable** — rejected at render time, but `vellora fix` can transform
  it automatically (the applicable rule is named in the Notes column).

## Allowed and best-effort features

These are not on any denylist, so the strict gate accepts them.

| Feature | Status | Notes |
|---|---|---|
| Block & inline text, headings, lists | Supported | Rendered via the Blitz/Stylo/Taffy layout engine. |
| Tables (incl. multi-page, repeated `<thead>`) | Supported | Headers repeat across page breaks. |
| Images: data URL PNG / JPEG / GIF / WebP | Supported | Base64 `data:image/...` sources are embedded as PDF image XObjects when the `<img>` has finite laid-out dimensions. |
| Images: relative or remote URLs | Planned | The core renderer does not fetch assets; bundle or inline them as data URLs before rendering. |
| `@page` margins, page numbers, running header/footer | Supported | Paged-media constructs are honoured. |
| Fonts: text shaping + subset embedding | Supported | Text is shaped and the resolved font is subset and embedded into the PDF. Supplying custom fonts via the `fonts` option is planned and currently inert. |
| `display: flex` | Partial | Not on a denylist, so the gate accepts it, but it is not a full flexbox implementation. Prefer tables for reliable layout; `vellora fix` (`flex/grid-in-td`) can convert it. |
| Inline SVG (`<svg>`) | Dev-time-fixable | Not handled at render time; `vellora fix` rule `inline-svg` rasterizes it to PNG. |
| `<img>` without explicit dimensions | Dev-time-fixable | `vellora fix` rule `img-dimension-attrs` adds intrinsic `width`/`height` so layout is deterministic. |

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
| `display:grid` (css:grid) | Dev-time-fixable | Auto-fixable via `vellora fix` rule `flex/grid-in-td`. |

## Nesting depth limit

The strict gate rejects documents whose element nesting exceeds
**192 levels** (the `MAX_NESTING_DEPTH` constant). Real documents nest only
a handful of levels deep; this cap rejects only pathologically deep markup.
