# Releasing vellora

vellora publishes five workspace packages — `vellora`, `@vellora/native`, `@vellora/lint`,
`@vellora/cli`, `@vellora/engine-chromium` — as a **fixed** version group (they always share one
version), plus the per-platform prebuilt addon packages under `packages/native/npm/*`.

Releases are tag-driven. Publishing runs from [`.github/workflows/release.yml`](.github/workflows/release.yml)
with **npm provenance** after a GitHub Release is published. The release tag is the single source
of truth for the version: publishing `v0.1.0-alpha.1` makes every published package use
`0.1.0-alpha.1` via [`scripts/set-release-version.mjs`](scripts/set-release-version.mjs).

Manual `workflow_dispatch` runs the same build, clean-install verification, and publish dry-run
without uploading anything.

Alpha releases currently publish with the explicit npm dist-tag `latest`, because npm requires an
explicit tag for prerelease versions and the public install path is still `npm install vellora`.

## Launch matrix

| Platform tag        | Rust target                   | Runner                                  |
| ------------------- | ----------------------------- | --------------------------------------- |
| `darwin-arm64`      | `aarch64-apple-darwin`        | `macos-14`                              |
| `darwin-x64`        | `x86_64-apple-darwin`         | `macos-14` (cross-compiled)             |
| `linux-x64-gnu`     | `x86_64-unknown-linux-gnu`    | `ubuntu-24.04`                          |
| `linux-arm64-gnu`   | `aarch64-unknown-linux-gnu`   | `ubuntu-24.04-arm` (or QEMU — see below)|

**Windows is not supported yet** — `win32-*` is a planned fast-follow. The loader throws an
actionable error naming Windows as not-yet-supported, and `RESOLUTION_TABLE` reserves
`linux-x64-musl` and `linux-arm64-musl` (no published package yet — musl needs a native-musl build host).

### arm64 build without a native runner (QEMU fallback)

If `ubuntu-24.04-arm` runners are unavailable, build `aarch64-unknown-linux-gnu` under emulation:

```yaml
- uses: docker/setup-qemu-action@v3
  with:
    platforms: arm64
# then run the napi build inside an arm64 container, or use cross/zig for the target.
```

Emulated builds are slower; prefer a native arm64 runner when available.

## Cutting a release

1. **Add a changeset** describing the change and the bump level:
   ```bash
   npm run changeset        # interactive; writes a file under .changeset/
   ```
2. **Open a PR** with the changeset. Review the implied version bump:
   ```bash
   npx changeset status
   ```
3. Merge the PR to `main` after CI is green.
4. Optionally run the release workflow manually (`workflow_dispatch`) from the Actions tab. This
   builds every target, verifies a **clean install renders a PDF with no Rust toolchain** on each
   supported platform, and runs a publish dry-run without uploading anything.
5. Publish a GitHub Release with the next semver tag:
   ```bash
   gh release create v0.1.0-alpha.1 --prerelease --title "v0.1.0-alpha.1" --notes-file <notes.md>
   ```
6. The publish step is **gated** on all `build` and `verify` jobs passing. It moves the prebuilt
   `.node` files into `npm/*`, sets every published package to the release tag version, runs a
   publish dry-run with the explicit `latest` npm dist-tag, publishes with provenance, and verifies
   provenance attestations.

### Prerequisites for publishing

- An `NPM_TOKEN` repository secret (automation token) with publish rights to the `@vellora` scope.
- The `@vellora` scope created on npm; scoped packages publish publicly via
  `publishConfig.access: "public"`.
- Confirm `vellora` pins an exact `@vellora/native` version and that `optionalDependencies` match
  the `npm/*` package set 1:1 (a test enforces this: `packages/native/test/loader.test.ts`).

## Rollback: deprecate and supersede (never unpublish)

A published version is **immutable**. Do **not** `npm unpublish` or delete-and-republish a version —
it breaks consumers' lockfiles and integrity hashes, and the version number can never be reused.

To roll back a bad release:

1. **Deprecate** the bad version with a message pointing at the fix:
   ```bash
   npm deprecate vellora@<bad-version> "Broken release — upgrade to <good-version>."
   # repeat for @vellora/native, @vellora/lint, @vellora/cli, @vellora/engine-chromium,
   # and the affected @vellora/native-* prebuilds
   ```
2. **Publish a superseding patch** (new changeset → new version) with the correction.
3. Optionally move the `latest` dist-tag back to the last known-good version:
   ```bash
   npm dist-tag add vellora@<good-version> latest
   ```

This preserves immutability and integrity while steering installs to the fixed release.
