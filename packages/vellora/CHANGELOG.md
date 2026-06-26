# vellora

Versions and release notes are managed with [Changesets](../../.changeset); this file is updated
automatically on release (`changeset version`).

## Unreleased

- Initial public prerelease — see `.changeset/native-prebuild-launch.md`.
- **Image source resolution.** The `images` option is now live: a `Record<string, Uint8Array>` mapping
  an `<img>`'s `src` to raw image bytes (PNG/JPEG/GIF/WebP, format detected from the bytes). `baseUrl`
  normalizes a relative `src` into the lookup key (no network/filesystem access). Inline `data:` URLs
  continue to render. **BREAKING:** a renderable `<img>` whose `src` cannot be resolved (missing
  `images` entry, remote URL, or unsupported bytes) now rejects with a located `image:unresolved`
  diagnostic instead of rendering blank. `fonts` remains forwarded-but-inert.
