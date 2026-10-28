# When you need Chrome: the optional Chromium engine

Most document templates (invoices, receipts, statements, letters) render natively, with no browser.
A few need things vellora's native renderer does not do. You don't have to move everything to a
browser for them: send just those templates to Chrome, and keep the rest native.

## Do you need it?

Use `engine: "chromium"` for a template when it needs one of these:

- **JavaScript** that runs inside the document. Native rendering rejects `<script>`.
- **CSS grid or `transform`.** Native rendering rejects them and tells you the line and column
  (`css:grid`, `css:transform`). If you can't rewrite that part of the layout with tables, use
  Chrome.
- **Pages of different widths**, for example an `@page :first` rule that changes the left or right
  margin. Native rendering lays a document out at one width and rejects this as
  `css:page-varying-width`.
- **An arbitrary web page** you don't control, rather than a document template.

Everything else: stay native. It is the default, it starts no process, and the same input gives
the same PDF bytes. [Will my template work?](/compatibility) lists what the native renderer
supports.

## The three engine modes

| `engine` | What it does |
| --- | --- |
| `"native"` (default) | Renders inside your Node process with vellora's own engine. No browser. |
| `"chromium"` | Prints the HTML with a Chrome or Chromium binary that your machine or container already has. |
| `"auto"` | Looks the template up in a checked-in policy file and uses the engine it names. |

Native needs nothing extra:

```js
import { renderPdf } from "vellora";

const pdf = await renderPdf(html, data);
```

## Set up the Chromium engine

Install the optional package, only in projects that use it:

```sh
npm install vellora @vellora/engine-chromium
```

vellora does not download a browser. It starts the Chrome or Chromium binary you already have,
with headless print-to-PDF. It does not use Puppeteer or Playwright. It looks for the binary in
this order:

1. `chromium.executablePath`
2. the `VELLORA_CHROMIUM_EXECUTABLE` environment variable
3. common install paths: Google Chrome and Chromium on macOS, `/usr/bin/google-chrome`,
   `/usr/bin/chromium` and `/usr/bin/chromium-browser` on Linux
4. a `chromium` command on `PATH`

On a laptop with Chrome installed you usually don't need to set anything. In CI, Docker and
servers, set the path explicitly so every deploy uses the same browser:

```js
import { renderPdf } from "vellora";

const pdf = await renderPdf(html, data, {
  engine: "chromium",
  chromium: {
    executablePath: process.env.VELLORA_CHROMIUM_EXECUTABLE,
    timeoutMs: 30_000,
  },
});
```

If a render takes longer than `timeoutMs`, the browser process is killed and the promise rejects.

| Setup | Packages | Needs a browser? | Use it for |
| --- | --- | --- | --- |
| Native (default) | `vellora` | No | Document templates that use supported HTML and CSS. |
| Native + Chromium | `vellora` + `@vellora/engine-chromium` | Yes, supplied by your machine or image | The few templates that need browser printing. |

## Route each template with a policy file

With `engine: "auto"`, the choice lives in a JSON file you commit and review, not in code. By
default vellora reads `vellora.fidelity.json` from the current working directory:

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
      "reason": "needs CSS grid"
    }
  }
}
```

```js
import { renderPdf } from "vellora";

const pdf = await renderPdf(html, data, {
  engine: "auto",
  fidelity: {
    templateId: "invoice-v2",
    policyPath: "vellora.fidelity.json",
  },
});
```

Check the file in CI before you deploy it:

```sh
vellora fidelity --config vellora.fidelity.json
```

## Check a template against your old PDF {#check-a-template-against-your-old-pdf}

The quickest way to decide is to compare. Keep one PDF from your current pipeline (Puppeteer,
wkhtmltopdf, anything), then let `vellora doctor` render the same template and diff the two, page
by page:

```sh
vellora doctor invoice.html \
  --pixel-diff \
  --reference-pdf old-output.pdf \
  --pixel-budget 0.02 \
  --out artifacts \
  --json
```

It rasterizes both PDFs with `pdftoppm` (from poppler, which you need installed), writes page
images and red diff overlays to `artifacts/visual`, and recommends native or Chromium based on the
share of pixels that differ. vellora never installs or starts Puppeteer for this; the old PDF is
just a file. `vellora doctor` needs `@vellora/cli` 0.3.2, the next release (see the known issue
below).

To see how the Chromium engine does against the same old PDF, add `--subject chromium`:

```sh
vellora doctor invoice.html \
  --pixel-diff \
  --reference-pdf old-output.pdf \
  --subject chromium \
  --out artifacts \
  --json
```

<details>
<summary>More doctor options, and a known CLI issue</summary>

Compare native output with a fresh Chromium render of the same template:

```sh
vellora doctor invoice.html --reference chromium --template-id invoice-v2 --out artifacts --json
```

Useful options:

- `--pixel-budget 0.02` passes when at most 2% of pixels differ (the default).
- `--pixel-threshold 12` sets how different a pixel's colour must be to count (the default).
- `--dpi 144` sets the raster density.
- `--pdftoppm /path/to/pdftoppm` points at a specific rasterizer.

If no browser binary can be found when one is needed, `vellora doctor` exits with code `4`.

**If `npx vellora` prints nothing:** `@vellora/cli` 0.3.0 exits silently when it is run through the
installed `vellora` command. The fix is in 0.3.2, the next release. Update the CLI package once it is out.

</details>

## What it costs

The Chromium engine costs what a browser costs: a browser process per render, its memory, and its
binary in your image. The [benchmark in the blog post](/blog/html-to-pdf-nodejs-without-puppeteer#the-numbers)
shows how much.

**Next:** [How close is vellora to Chrome? →](/guide/fidelity)
