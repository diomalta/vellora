# @vellora/native

**The native engine behind [vellora](https://www.npmjs.com/package/vellora): HTML layout and PDF
output compiled to a Node addon.**

[![npm](https://img.shields.io/npm/v/@vellora/native)](https://www.npmjs.com/package/@vellora/native)
![license: MIT](https://img.shields.io/badge/license-MIT-blue)

> **You probably want [`vellora`](https://www.npmjs.com/package/vellora) instead.** It installs
> this package for you and gives you the friendly API: templating, validation with clear errors,
> batching and streaming. Depend on `@vellora/native` directly only if you're building your own
> wrapper.

## What's inside

A Rust engine, loaded into your Node process through [napi-rs](https://napi.rs). It parses the HTML,
lays it out with [Blitz](https://github.com/DioxusLabs/blitz), splits it into pages (repeated table
headers, page numbers, page breaks) and writes the PDF with [krilla](https://github.com/LaurenzV/krilla).
Rendering runs on Node's worker thread pool, so it doesn't block your event loop, and parallel
renders don't share state.

## Install

```bash
npm install vellora   # recommended: pulls this package in
```

npm installs only the binary for your machine, through one of these optional dependencies:

| Platform | Package |
|---|---|
| macOS, Apple Silicon | [`@vellora/native-darwin-arm64`](https://www.npmjs.com/package/@vellora/native-darwin-arm64) |
| macOS, Intel | [`@vellora/native-darwin-x64`](https://www.npmjs.com/package/@vellora/native-darwin-x64) |
| Linux x64 (glibc) | [`@vellora/native-linux-x64-gnu`](https://www.npmjs.com/package/@vellora/native-linux-x64-gnu) |
| Linux arm64 (glibc) | [`@vellora/native-linux-arm64-gnu`](https://www.npmjs.com/package/@vellora/native-linux-arm64-gnu) |

No Rust toolchain or compiler is needed. **Windows and Alpine (musl) are not supported yet.** On
those, loading fails with an error that names your platform. You can still build from source with
Rust (`npm run build` in the [repository](https://github.com/diomalta/vellora)).

If your bundler or deploy tool copies `node_modules` selectively, keep the `@vellora/*` packages
external so the platform binary ships with your app.

## Fonts included

The addon embeds **Liberation Sans** (regular and bold, metric-compatible with Arial) as the default
font and **DejaVu Sans** for wider character coverage. Text renders the same on every machine, with
no system fonts or `fontconfig`. You can add your own fonts through vellora's `fonts` option.
Font licenses are in [THIRD-PARTY-NOTICES.md](./THIRD-PARTY-NOTICES.md).

## License

MIT. See [LICENSE](./LICENSE). Bundled font licenses are in
[THIRD-PARTY-NOTICES.md](./THIRD-PARTY-NOTICES.md).
