# @vellora/engine-chromium

Optional Chromium-backed renderer for [vellora](https://github.com/diomalta/vellora).

Use this package only for templates that need browser print fidelity. The default `vellora` path stays
native, in-process, and browserless.

> **Pre-release (alpha)** — the bridge is implemented and evolving with the fidelity workflow.

## Install

```bash
npm install vellora @vellora/engine-chromium
```

This package does **not** install Chromium. It launches a Chromium/Chrome executable supplied by the
environment.

## Usage

```ts
import { renderPdf } from "vellora";

const pdf = await renderPdf(html, data, {
  engine: "chromium",
  chromium: {
    executablePath: process.env.VELLORA_CHROMIUM_EXECUTABLE,
    timeoutMs: 30_000,
  },
});
```

If `chromium.executablePath` is omitted, discovery checks `VELLORA_CHROMIUM_EXECUTABLE`, common local
Chrome/Chromium paths, and finally a `chromium` command on `PATH`.

## When to use it

- Use `vellora` alone when your generated document HTML fits the supported subset.
- Add this package when a specific template must match Chromium/Puppeteer print output.
- Use `vellora doctor --pixel-diff` to compare a native render against Chromium or a legacy PDF before
  committing a fidelity policy.

## License

MIT — see [LICENSE](./LICENSE).
