---
"vellora": minor
"@vellora/native": minor
"@vellora/lint": minor
"@vellora/cli": minor
---

Native prebuilt-binary distribution and a provenance-emitting release pipeline.

- `@vellora/native` now ships per-platform prebuilt addons across the launch matrix
  (`darwin-arm64`, `darwin-x64`, `linux-x64-gnu`, `linux-arm64-gnu`, `linux-x64-musl`), so
  `npm install vellora` produces a PDF on a clean host with no Rust toolchain. Windows is a planned
  fast-follow.
- `optionalDependencies` now match the published `npm/*` platform packages 1:1, and `vellora` pins
  an exact `@vellora/native` version.
- Releases are versioned with Changesets and published with npm provenance, gated on clean-install
  verification jobs.

> Note: the packages currently carry the `0.1.0-alpha.0` prerelease version. The exact published
> version (graduating the alpha) is decided when the first official release is cut — no package is
> published by this change.
