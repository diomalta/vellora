# Fonts

::: warning Planned
Explicit font configuration is **not implemented yet**. The `fonts` option exists on `RenderOptions` and is accepted and forwarded, but it is **currently inert** — passing it does not change output. This page documents the planned surface; do not depend on it yet.
:::

## Current behavior

Today, documents render with the default font handling of the native core. Use generic CSS font families (for example `font-family: sans-serif;`) in your HTML. The `fonts` option is reserved:

```js
import { renderPdf } from "vellora";

// `fonts` is accepted and forwarded, but currently inert — output is unchanged.
const pdf = await renderPdf(html, data, { fonts: /* planned */ undefined });
```

## Planned

A future release will let you register explicit fonts so a document embeds and shapes with exactly the typefaces you provide, independent of the host machine's installed fonts. Until then, keep typography to families the core resolves by default and track the [roadmap](https://github.com/diomalta/vellora#status--roadmap) for the shipped API.
