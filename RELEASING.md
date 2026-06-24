# Releasing vellora

vellora publishes four packages — `vellora`, `@vellora/native`, `@vellora/lint`, `@vellora/cli` —
as a **fixed** version group (they always share one version), plus the per-platform prebuilt
addon packages under `packages/native/npm/*`. Versioning is driven by
[Changesets](https://github.com/changesets/changesets); publishing runs from
[`.github/workflows/release.yml`](.github/workflows/release.yml) with **npm provenance**.

> **Status:** no official release has been published yet. The release workflow is **dormant** — it
> only runs on a manual `workflow_dispatch`. Nothing publishes automatically.

## Launch matrix

| Platform tag        | Rust target                   | Runner                                  |
| ------------------- | ----------------------------- | --------------------------------------- |
| `darwin-arm64`      | `aarch64-apple-darwin`        | `macos-14`                              |
| `darwin-x64`        | `x86_64-apple-darwin`         | `macos-13`                              |
| `linux-x64-gnu`     | `x86_64-unknown-linux-gnu`    | `ubuntu-24.04`                          |
| `linux-arm64-gnu`   | `aarch64-unknown-linux-gnu`   | `ubuntu-24.04-arm` (or QEMU — see below)|
| `linux-x64-musl`    | `x86_64-unknown-linux-musl`   | `ubuntu-24.04` + `node:22-alpine`       |

**Windows is not supported yet** — `win32-*` is a planned fast-follow. The loader throws an
actionable error naming Windows as not-yet-supported, and `RESOLUTION_TABLE` reserves
`linux-arm64-musl` (no published package yet).

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
3. **Run the release workflow** from the Actions tab (`workflow_dispatch`):
   - Leave `dry_run = true` first. This builds every target, verifies a **clean install renders a
     PDF with no Rust toolchain** on each platform (including Alpine/musl), and runs a publish
     dry-run — without publishing anything.
   - When the dry-run is green, run again with `dry_run = false` to publish.
4. The publish step is **gated** on all `build` and `verify` jobs passing, applies the pending
   changesets (version bump + CHANGELOG), moves the prebuilt `.node` files into `npm/*`, and
   publishes with provenance.

### Prerequisites for the first real publish

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
   # repeat for @vellora/native, @vellora/lint, @vellora/cli and the affected @vellora/native-* prebuilds
   ```
2. **Publish a superseding patch** (new changeset → new version) with the correction.
3. Optionally move the `latest` dist-tag back to the last known-good version:
   ```bash
   npm dist-tag add vellora@<good-version> latest
   ```

This preserves immutability and integrity while steering installs to the fixed release.
