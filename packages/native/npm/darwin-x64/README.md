# @vellora/native-darwin-x64

The prebuilt [vellora](https://www.npmjs.com/package/vellora) renderer for **macOS on Intel (x64)**
(`x86_64-apple-darwin`).

**You don't need to install this package yourself.** Run `npm install vellora` and npm picks the
right binary for your machine automatically, as an optional dependency of
[`@vellora/native`](https://www.npmjs.com/package/@vellora/native).

vellora turns HTML into PDF inside your Node.js process, with no Chromium or Puppeteer. Start with
the [vellora README](https://www.npmjs.com/package/vellora).

## What's in this package

- `vellora.darwin-x64.node`: the compiled renderer (Rust, built with napi-rs).
- The licenses of the fonts embedded in it: Liberation Sans and DejaVu Sans.

If this binary seems to be missing at runtime, the usual cause is installing with
`--no-optional` / `--omit=optional`, or copying `node_modules` from a different OS or CPU.
Reinstall on the target machine, for example in your Docker build stage.

## License

MIT. Bundled font licenses are in [THIRD-PARTY-NOTICES.md](./THIRD-PARTY-NOTICES.md).
