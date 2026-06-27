# Images

vellora renders images from bytes you provide. It never fetches remote image URLs during native
rendering, which keeps output deterministic and avoids hidden network egress from document content.

## Supported sources

- Inline `data:image/...;base64,...` URLs for PNG, JPEG, GIF, and WebP.
- An `images` map keyed by the `<img src>` string.
- A relative `<img src>` normalized against `baseUrl` before the lookup.

The image format is detected from the bytes, not from the file extension or map key.

## Pass image bytes

```ts
import { readFileSync } from "node:fs";
import { renderPdf } from "vellora";

const html = `<!DOCTYPE html>
<html>
  <head>
    <style>
      @page { size: A4; margin: 18mm; }
      img.logo { width: 96px; height: 32px; }
    </style>
  </head>
  <body>
    <img class="logo" src="assets/logo.png" alt="Acme logo" />
    <h1>Invoice {{ invoice.number }}</h1>
  </body>
</html>`;

const pdf = await renderPdf(html, data, {
  images: {
    "assets/logo.png": new Uint8Array(readFileSync("./assets/logo.png")),
  },
});
```

## Use baseUrl for relative sources

If your template uses relative paths but your asset registry stores absolute URLs, pass `baseUrl`:

```ts
const pdf = await renderPdf(html, data, {
  baseUrl: "https://assets.example.test/templates/invoice/",
  images: {
    "https://assets.example.test/templates/invoice/logo.png": logoBytes,
  },
});
```

`baseUrl` only normalizes lookup keys. vellora does not fetch that URL.

## CLI usage

The CLI uses `--image key=path`:

```sh
vellora render templates/invoice.html \
  --data templates/invoice.json \
  --image assets/logo.png=assets/logo.png \
  --out out/invoice.pdf
```

Use multiple `--image` flags when a document has multiple assets.

## Failure mode

A renderable `<img>` whose source does not resolve rejects with `VelloraUnsupportedError` and
`feature: "image:unresolved"`. Hidden images that do not produce layout output are ignored.

## Not supported

- Native remote fetching of `https://...` image URLs.
- SVG rendering at runtime. Use `vellora fix` / `@vellora/lint.fix()` to rasterize inline SVG at
  authoring time when that rule applies.
