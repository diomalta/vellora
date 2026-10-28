# Fonts

vellora uses the same bundled fonts on every machine and never reads fonts installed on the host,
so there are no surprise font swaps between your laptop and your server.

## Without any setup

The CSS generic families map to bundled fonts:

| You write | You get |
|---|---|
| `font-family: sans-serif` | Liberation Sans (DejaVu Sans fills in characters it lacks) |
| `font-family: serif` | Liberation Serif |
| `font-family: monospace` | Liberation Mono |

Liberation fonts have the same character widths as Arial, Times New Roman and Courier New, so text in
templates written for those fonts takes up the same space.

## Your brand font

Read the font files and pass the bytes in `fonts`. Then use the font's own family name in CSS:

```js
import { readFileSync, writeFileSync } from "node:fs";
import { renderPdf } from "vellora";

const html = `<!DOCTYPE html>
<html>
  <body style="font-family: 'Inter', sans-serif">
    <h1>Hello, {{ name }}</h1>
    <p>Set in your brand font.</p>
  </body>
</html>`;

const pdf = await renderPdf(html, { name: "Ada" }, {
  fonts: [
    readFileSync("./fonts/Inter-Regular.ttf"),
    readFileSync("./fonts/Inter-Bold.ttf"),
  ],
});

writeFileSync("branded.pdf", pdf);
```

Each weight and style is its own file. Pass the regular, bold and italic files you use, and vellora
picks the closest match for each `font-weight` and `font-style`. TTF and OTF both work.

::: tip Coming from @font-face?
vellora doesn't load `@font-face` rules or their `src` URLs, and it doesn't let you rename a font.
Pass the bytes in `fonts` and write the name the font file itself declares. If the name doesn't
match, the text falls back to the bundled font without an error. To see a font's name, open it in
your system's font viewer, or on a machine with fontconfig run:

```sh
fc-scan --format "%{family}\n" Inter-Regular.ttf
```
:::

## Errors

- A `fonts` entry that isn't a `Uint8Array` (a `Buffer` is fine) throws `VelloraInputError`.
- Bytes that aren't a font throw `VelloraUnsupportedError` with `feature: "font:invalid"`, naming the
  position in the array, for example `fonts[0]`.

<details>
<summary>Rules and limits</summary>

- Your fonts never replace the generic families: `sans-serif` always means the bundled font. Your
  font is used only where CSS names it.
- A font you pass but never reference leaves the PDF unchanged.
- Not supported: `@font-face` aliases, loading font URLs from CSS, overriding a font's weight or
  style, choosing variable-font axes, and font-subsetting options.

</details>

## Next step

[Make an archival PDF/A file →](/guide/pdfa)
