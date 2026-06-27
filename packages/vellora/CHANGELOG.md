# vellora

Versions and release notes are managed with [Changesets](../../.changeset); this file is updated
automatically on release (`changeset version`).

## Unreleased

- Initial public prerelease.
- **Bounded batch rendering.** `renderPdfBatch(items, { concurrency })` renders many documents with a
  positive safe-integer concurrency cap, keeps output order aligned with the input order, and rejects
  with the first render error without starting additional queued items.
- **Image source resolution.** The `images` option is now live: a `Record<string, Uint8Array>` mapping
  an `<img>`'s `src` to raw image bytes (PNG/JPEG/GIF/WebP, format detected from the bytes). `baseUrl`
  normalizes a relative `src` into the lookup key (no network/filesystem access). Inline `data:` URLs
  continue to render. **BREAKING:** a renderable `<img>` whose `src` cannot be resolved (missing
  `images` entry, remote URL, or unsupported bytes) now rejects with a located `image:unresolved`
  diagnostic instead of rendering blank.
- **Custom fonts.** The `fonts` option is now live: a `Uint8Array[]` of raw TTF/OTF font faces. Each
  registers into the deterministic font context (after the bundled faces) and is reachable from the
  document's CSS by its **intrinsic embedded family name** (`font-family: "Inter"`); family/weight/style
  are read from the bytes. Custom faces never override the CSS generics, no host/system font is ever
  consulted, and an unreferenced face leaves output byte-identical. **BREAKING:** `fonts` was previously
  forwarded-but-inert and accepted any value; it is now typed `Uint8Array[]` — a non-`Uint8Array` entry
  rejects with `VelloraInputError`, and bytes that are not a parseable font reject with a `font:invalid`
  diagnostic.
- **Explicit render-engine routing.** `engine: "native"` remains the default no-browser path;
  `engine: "chromium"` routes through optional `@vellora/engine-chromium`, and `engine: "auto"` uses a
  checked-in fidelity policy keyed by `fidelity.templateId`.
