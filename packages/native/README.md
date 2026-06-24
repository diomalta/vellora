# @vellora/native

Prebuilt napi-rs addon loader for [vellora](https://github.com/diomalta/vellora) —
the in-process native renderer. You normally depend on **`vellora`**, not on this
package directly.

> **Pre-release (alpha).** The per-platform prebuild distribution is wired but not yet published —
> see [`RELEASING.md`](https://github.com/diomalta/vellora/blob/main/RELEASING.md).

## Install

```bash
npm install @vellora/native
```

## Supported platforms

Prebuilt binaries target the launch matrix: macOS (`arm64`, `x64`) and Linux (`x64` glibc,
`arm64` glibc, `x64` musl/Alpine). **Windows is not supported yet** — it is a planned fast-follow.
On an unsupported platform the loader throws an actionable error; you can still build locally with
the Rust toolchain (`npm run build` at the repo root).

## Bundled font

The addon embeds **DejaVu Sans** (Regular + Bold) as its default font, so text renders
deterministically with no system fonts or `libfontconfig` — see
[THIRD-PARTY-NOTICES.md](./THIRD-PARTY-NOTICES.md).

## License

MIT — see [LICENSE](./LICENSE). Bundled third-party font licenses are in
[THIRD-PARTY-NOTICES.md](./THIRD-PARTY-NOTICES.md).
