# Logos & images

Read the file, pass its bytes in `images`, and point `<img src>` at the same key:

```js
import { readFileSync, writeFileSync } from "node:fs";
import { renderPdf } from "vellora";

const html = `<!DOCTYPE html>
<html>
  <head>
    <style>
      @page { size: A4; margin: 18mm; }
      body { font-family: sans-serif; }
      img.logo { width: 120px; height: 40px; }
    </style>
  </head>
  <body>
    <img class="logo" src="logo.png" alt="Acme logo" />
    <h1>Invoice {{ number }}</h1>
  </body>
</html>`;

const pdf = await renderPdf(html, { number: "INV-0042" }, {
  images: {
    "logo.png": readFileSync("./assets/logo.png"),
  },
});

writeFileSync("with-logo.pdf", pdf);
```

The key is the exact `src` string. PNG, JPEG, GIF and WebP work, and the format is read from the
bytes, not from the file name.

::: warning Give every image a width and a height
In vellora 0.3.0 an `<img>` needs both, as `width` / `height` attributes or in CSS (for example
`width: 120px; height: 40px`). An image with only a width (or `height: auto`), or with no size at all, is
left out of the PDF without an error. Use the image's own aspect ratio to pick the height.
:::

## Why not just use a URL?

vellora makes no network requests while it renders. A template can't leak data to a third-party
server, a slow CDN can't hang your render, and the same bytes give the same PDF every time.

If your logo lives on a CDN, download it yourself and pass the bytes, keyed by the URL in the
template:

```js
const html = `<img src="https://cdn.example.com/brand/logo.png" width="120" height="40" />`;

const res = await fetch("https://cdn.example.com/brand/logo.png");
if (!res.ok) throw new Error(`logo download failed: ${res.status}`);
const logo = new Uint8Array(await res.arrayBuffer());

const pdf = await renderPdf(html, {}, {
  images: { "https://cdn.example.com/brand/logo.png": logo },
});
```

Fetch once and reuse the bytes across renders, or cache them however you already cache assets.

Small images can also go inline as `data:image/png;base64,...` URLs, with no `images` entry.

## Templates with relative paths: `baseUrl`

If the template says `src="logo.png"` but your asset store keys files by full URL, set `baseUrl`.
vellora joins the two to find the key (`https://assets.example.com/invoice/logo.png`). It never
downloads anything from that address.

```js
const pdf = await renderPdf(html, data, {
  baseUrl: "https://assets.example.com/invoice/",
  images: {
    "https://assets.example.com/invoice/logo.png": logoBytes,
  },
});
```

## When an image is missing

If an `<img>` would be drawn but no bytes match its `src`, the render stops instead of leaving a
blank box:

```txt
VelloraUnsupportedError: Unsupported construct "image:unresolved" at line 2, column 1:
<img> source could not be resolved: no matching `images` entry for its `src` — supply the bytes
via the `images` render option (optionally with `baseUrl`)
```

`err.feature` is `"image:unresolved"`, and `err.line` / `err.col` point at the `<img>`.

## Not supported

- Downloading `http(s)://` images during the render. Pass the bytes instead.
- SVG files as `<img>` sources or `images` entries. Inline `<svg>` elements are drawn as vector
  graphics; an `<image>` inside one must use a `data:` URL. Details in
  [COMPATIBILITY.md](https://github.com/diomalta/vellora/blob/main/COMPATIBILITY.md).

<details>
<summary>Using the CLI</summary>

`vellora render` takes one `--image key=path` flag per asset:

```sh
vellora render templates/invoice.html \
  --data templates/invoice.json \
  --image logo.png=assets/logo.png \
  --out out/invoice.pdf
```

</details>

## Next step

[Use your brand font →](/guide/fonts)
