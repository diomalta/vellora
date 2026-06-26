# Compatibility

vellora supports a **strict-by-default, documented HTML/CSS subset** built for generated document HTML. Inputs such as invoices, receipts, boletos, and notifications are representative scenarios, not domain entities or special render modes. In strict mode (the default), out-of-subset input is rejected with a `VelloraUnsupportedError` rather than rendered incorrectly.

## The canonical subset table

The exact list of supported and unsupported HTML elements and CSS properties is maintained in a single source of truth so it can never drift: the repository's [`COMPATIBILITY.md`](https://github.com/diomalta/vellora/blob/main/COMPATIBILITY.md).

This page intentionally does **not** duplicate that table — consult `COMPATIBILITY.md` for the authoritative, up-to-date matrix.

## How strictness works

- **`strict: true` (default)** — your HTML/CSS is validated against the subset and never mutated. Anything outside the subset throws `VelloraUnsupportedError`, which carries a located diagnostic (`feature`, `line`, `col`, `hint`) so you can find and fix the offending markup.
- **`strict: false`** — `@vellora/lint` fixers run first to bring common out-of-subset input back inside the supported set before rendering.

```js
import { renderPdf, VelloraUnsupportedError } from "vellora";

try {
  await renderPdf("<div><script>alert(1)</script></div>");
} catch (err) {
  if (err instanceof VelloraUnsupportedError) {
    console.log(`Rejected: feature="${err.feature}" — ${err.hint}`);
  }
}
```

See the [API Reference](/reference/) for the full error surface.
