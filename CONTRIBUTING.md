# Contributing to vellora

Thanks for your interest in vellora — an in-process HTML-to-PDF renderer for Node.js, built on a native (napi-rs) Rust addon. Contributions of all sizes are welcome, and first-time contributors are especially encouraged.

## Looking for a place to start?

We curate beginner-friendly tickets. Browse the **good first issue** view here:

- <https://github.com/diomalta/vellora/contribute>

Picking one of those and commenting that you'd like to take it is the easiest way in.

## Toolchain

vellora pins its toolchain so a clean clone reproduces the maintainers' environment exactly. Do not skip these — the native addon will not build with the wrong versions.

- **Node.js** — `.nvmrc` pins **22** for development; with [nvm](https://github.com/nvm-sh/nvm) installed, run `nvm use` in the repo root. The published packages support **Node >= 20** (`engines`).
- **Rust** — channel and components are pinned in [`rust-toolchain.toml`](rust-toolchain.toml) (currently **1.96.0**, with `rustfmt` and `clippy`). With [rustup](https://rustup.rs) installed, the toolchain is selected automatically when you run `cargo` in the repo; the listed components install on first use.

## Dev loop

From a clean clone, run these in order:

```bash
npm ci          # install workspace dependencies from the lockfile
npm run build   # build the Rust crate + native addon, then the TS packages
npm test        # run the Rust tests and the TypeScript tests
npm run lint    # run rustfmt/clippy and the TS linters
```

If all four pass locally, your change is in good shape to open a pull request. CI runs the same loop on the `macos-14` and `ubuntu-24.04` matrix.

## Opening a pull request

- Branch off `main` and keep the change focused.
- Make sure `npm test` and `npm run lint` pass locally before pushing.
- Fill in the pull-request checklist (tests, lint, changeset, docs) — it appears automatically when you open the PR.
- Add a changeset if your change affects a published package.

## Triage and first response

We know that a slow or unwelcoming first response is the quickest way to lose a contributor, so we commit to the opposite:

- **We aim to acknowledge new pull requests and issues within a few days** (best-effort; we're a small team).
- Your first contribution will get a friendly, constructive first response — if something needs changing, we'll explain *why* and point you at the next step rather than just closing it.
- Don't worry about getting everything perfect. Open the PR, and we'll work through it together.

## Code of Conduct

This project follows the [Contributor Covenant](CODE_OF_CONDUCT.md). By participating, you agree to uphold it.
