# Rendering fidelity and engine strategy

vellora's current renderer is native and in-process. It is designed for generated document HTML, not for arbitrary browser-page parity.

## What ships today

- `renderPdf()` uses the native `@vellora/native` addon by default.
- `renderPdf(..., ..., { engine: "chromium" })` is available through the optional `@vellora/engine-chromium` package.
- `renderPdf(..., ..., { engine: "auto", fidelity: { templateId } })` routes through a committed `vellora.fidelity.json` policy.
- The Chromium engine launches a Chromium/Chrome executable directly with headless print-to-PDF. It does not depend on Puppeteer or Playwright.
- The native default launches no Chromium, Puppeteer, Playwright, wkhtmltopdf, Python, Java, or sidecar service.
- Strict mode validates the documented HTML/CSS subset and rejects unsupported input with `VelloraUnsupportedError`.
- Native rendering is deterministic for identical inputs.

That means vellora can be a good fit when you control the template and can keep it inside the supported subset. It also means vellora is not a drop-in pixel-perfect replacement for every Puppeteer page.

## When to expect differences

Expect review work when a template depends on:

- JavaScript execution inside the document.
- Arbitrary browser CSS outside vellora's subset.
- Layout behavior tuned by eye against Chrome.
- Remote asset fetching during render.
- Browser-specific defaults, font fallback, or print behavior.

For migration work, keep your current browser-generated PDF as the reference until each template has been accepted.

## Engine modes

Use native rendering by default:

```js
import { renderPdf } from "vellora";

const pdf = await renderPdf(html, data);
```

Use environment Chromium when a template needs browser print fidelity and your host/container already
provides Chrome or Chromium:

```js
import { renderPdf } from "vellora";

const pdf = await renderPdf(html, data, {
  engine: "chromium",
});
```

Install the optional environment engine package only in projects that use host-supplied browser fidelity:

```sh
npm install vellora @vellora/engine-chromium
```

The `vellora` package stays browserless by default. The Chromium package looks for a browser binary in
this order:

1. `chromium.executablePath`
2. `VELLORA_CHROMIUM_EXECUTABLE`
3. common local paths such as macOS Google Chrome, `/usr/bin/google-chrome`, and `/usr/bin/chromium`
4. a `chromium` command on `PATH`

For local development, that usually means no explicit path is needed if Chrome or Chromium is installed
normally. For CI, Docker, and server deploys, pin the executable path or environment variable so the
runtime is reproducible:

```js
const pdf = await renderPdf(html, data, {
  engine: "chromium",
  chromium: {
    executablePath: process.env.VELLORA_CHROMIUM_EXECUTABLE,
    timeoutMs: 30_000,
  },
});
```

This engine calls Chromium/Chrome directly with headless print-to-PDF. It does not install, import, or
drive Puppeteer.

### Installation tiers

Use one of these tiers intentionally:

| Tier | Packages | Browser requirement | Best for |
| --- | --- | --- | --- |
| Native default | `vellora` | None | Fast, browserless document rendering for templates inside the supported subset. |
| Environment Chromium | `vellora` + `@vellora/engine-chromium` | Chrome/Chromium supplied by the environment | Exact browser print fidelity without adding Puppeteer to the runtime graph. |

Use `auto` when you want production routing to come from a checked-in policy:

```json
{
  "version": 1,
  "templates": {
    "invoice-v2": {
      "selectedEngine": "native",
      "reason": "native lint and render checks passed"
    },
    "dashboard-export": {
      "selectedEngine": "chromium",
      "reason": "browser print CSS required"
    }
  }
}
```

```js
const pdf = await renderPdf(html, data, {
  engine: "auto",
  fidelity: {
    templateId: "invoice-v2",
    policyPath: "vellora.fidelity.json",
  },
});
```

## CLI checks

`vellora doctor` renders the native output, optionally renders a Chromium reference, and writes a JSON report:

```sh
vellora doctor invoice.html --reference chromium --template-id invoice-v2 --out artifacts --json
```

When Chromium is requested, the engine first tries normal discovery. Set `VELLORA_CHROMIUM_EXECUTABLE`
or pass `chromium.executablePath` when your deploy needs a fixed binary path. If no browser binary is
available, the CLI exits with code `4`.

`vellora fidelity` validates a policy file:

```sh
vellora fidelity --config vellora.fidelity.json
```

For pixel-level analysis, add `--pixel-diff`. This rasterizes the native and Chromium PDFs with `pdftoppm`, writes page images and red diff overlays to `artifacts/visual`, and uses the mismatch budget to recommend native or Chromium:

```sh
vellora doctor invoice.html \
  --pixel-diff \
  --pixel-budget 0.02 \
  --template-id invoice-v2 \
  --out artifacts \
  --json
```

Useful options:

- `--dpi 144` controls raster density.
- `--pixel-threshold 12` controls per-channel mismatch sensitivity.
- `--pixel-budget 0.02` allows up to 2% mismatched pixels.
- `--pdftoppm /path/to/pdftoppm` overrides rasterizer discovery.

Region-level analysis and direct CDP control remain roadmap work.

If you are replacing an existing Puppeteer pipeline, generate one PDF with that current pipeline and pass it as a local reference file:

```sh
vellora doctor invoice.html \
  --pixel-diff \
  --reference-pdf old-puppeteer-output.pdf \
  --pixel-budget 0.02 \
  --out artifacts \
  --json
```

This compares vellora native output against the local legacy PDF without installing, importing, or launching Puppeteer from vellora.

To compare that same legacy PDF against Vellora's Chromium engine instead of the native engine, make
the subject explicit:

```sh
vellora doctor invoice.html \
  --pixel-diff \
  --reference-pdf old-puppeteer-output.pdf \
  --subject chromium \
  --pixel-budget 0.02 \
  --out artifacts \
  --json
```

## Practical migration rule

Use native vellora when the template fits the subset and the PDF passes your visual review. Use
environment Chromium when your deployment already owns the browser and exact Chromium output matters.
