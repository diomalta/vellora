# Fonts

vellora renders text with a set of **bundled** faces (Liberation Sans/Serif/Mono + DejaVu Sans) and never consults the host machine's installed fonts — that is what makes output deterministic and free of any system font dependency. To use your own typeface, pass its bytes through the `fonts` option.

## Bundled families

Without any configuration, the CSS generics resolve to the bundled faces:

- `font-family: sans-serif` → Liberation Sans (DejaVu Sans fallback for broad glyph coverage)
- `font-family: serif` → Liberation Serif
- `font-family: monospace` → Liberation Mono

These are metrically compatible with Arial / Times New Roman / Courier, so most document HTML renders as expected with no `fonts` option at all.

## Custom fonts

`fonts` is a `Uint8Array[]` of raw font-face bytes (TTF/OTF). Each face registers into the font context and becomes reachable from your document's CSS by its **intrinsic embedded family name** — the family/weight/style are read from the font's own metadata, so you reference it with the exact name the font ships with:

```js
import { readFileSync } from "node:fs";
import { renderPdf } from "vellora";

const inter = new Uint8Array(readFileSync("./Inter-Regular.ttf"));
const interBold = new Uint8Array(readFileSync("./Inter-Bold.ttf"));

const html = `<p style="font-family: 'Inter'">Hello</p>`;
const pdf = await renderPdf(html, data, { fonts: [inter, interBold] });
```

Each weight/style is its own face — supply the regular and bold (and italic) files you need; the engine selects the best match per `font-weight` / `font-style`.

## Rules and guarantees

- **Reference a face by its real embedded family name.** A `font-family` that matches no registered face simply falls back to the bundled generic (not an error). If your text doesn't pick up the custom face, check the family name the font actually ships with.
- **Custom faces never override the generics.** `font-family: sans-serif` always stays bundled; a custom face is reached only by an explicit `font-family: "<embedded name>"`.
- **No host/system fonts, no I/O.** Registration draws only on the bytes you pass — no network or filesystem access — so identical inputs (including identical `fonts` bytes) produce byte-identical PDFs. An unreferenced face leaves output unchanged.
- **Invalid input is rejected, not ignored.** A non-`Uint8Array` entry rejects with `VelloraInputError`; bytes that are not a parseable font reject with a `font:invalid` diagnostic (`VelloraUnsupportedError`), naming the offending index.

## Not supported

A face is reachable only by its intrinsic family name. The `@font-face` model (a caller-declared alias decoupled from the font's own name), resolving `@font-face` `src` URLs from document CSS, explicit weight/style overrides, variable-font axis selection, and font-subsetting configuration are out of scope.
