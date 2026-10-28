# @vellora/engine-chromium

**Send the one template that needs Chrome to Chrome, and keep the rest native.**

[![npm](https://img.shields.io/npm/v/@vellora/engine-chromium)](https://www.npmjs.com/package/@vellora/engine-chromium)
![license: MIT](https://img.shields.io/badge/license-MIT-blue)

[vellora](https://www.npmjs.com/package/vellora) renders HTML to PDF in-process, without a
browser. That covers most generated documents. Sometimes one template relies on something only a
browser does well, like CSS grid or `transform`. This package lets that template print
through Chrome, with the same `renderPdf` call, while every other template stays on the fast native
path.

## Install

```bash
npm install vellora @vellora/engine-chromium
```

This package **does not download Chrome**. It uses a Chrome or Chromium that is already on the
machine, for example from your Docker image or from `npx @puppeteer/browsers install chrome`.

## Render one call with Chrome

```js
import { renderPdf } from "vellora";

const pdf = await renderPdf(html, data, {
  engine: "chromium",
  chromium: {
    executablePath: process.env.VELLORA_CHROMIUM_EXECUTABLE, // optional
    timeoutMs: 30_000,
  },
});
```

Without `executablePath`, vellora looks for Chrome in this order: the `VELLORA_CHROMIUM_EXECUTABLE`
environment variable, the usual install locations, then a `chromium` command on your `PATH`.

## Choose per template with a policy file

Rather than hard-coding the engine, commit a `vellora.fidelity.json` that lists the templates that
need Chrome, and render with `engine: "auto"`:

```json
{
  "version": 1,
  "templates": {
    "invoice": { "selectedEngine": "native" },
    "sales-dashboard": {
      "selectedEngine": "chromium",
      "reason": "uses CSS grid for the chart layout",
      "reviewedAt": "2026-10-28"
    }
  }
}
```

```js
const pdf = await renderPdf(html, data, {
  engine: "auto",
  fidelity: { templateId: "sales-dashboard" }, // reads ./vellora.fidelity.json
});
```

The decision lives in your repository, so moving a template from Chrome to native shows up in code
review.

## Which templates need it?

Let the CLI tell you. `vellora doctor` renders a template both ways and writes a pixel diff:

```bash
npx @vellora/cli doctor templates/sales-dashboard.html --reference chromium --pixel-diff --out artifacts
```

If the native render is close enough, leave the template native. It is much cheaper: on the
project's benchmark, a warm 3-page invoice takes about 19 ms natively and about 636 ms through
Chrome, and Chrome's processes use about 6.8 GB at 8 renders in parallel
([details](https://github.com/diomalta/vellora#performance)).

## License

MIT. See [LICENSE](./LICENSE).
