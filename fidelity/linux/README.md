# Linux fidelity environment (local Docker)

A pinned Linux container for `npm run build`, the tests and a gated `fidelity/run-all.mjs` run,
so a Linux result does not have to wait for CI. Local only; the image is never pushed.

| pin | value |
|---|---|
| base | `debian:trixie-slim@sha256:89c1ea91…4b31` (Debian 13.7, multi-arch index, 2026-10-28) |
| Rust | 1.96.0 via rustup 1.28.2 (`rust-toolchain.toml`), rustfmt + clippy |
| Node | 22.23.2 (`.nvmrc` says 22; the version the macOS runs record) |
| Chrome | Chrome for Testing 155.0.8059.85 (`linux-arm64` / `linux64` zip, the build `fidelity/wpt/install-chrome.mjs` pins), at `/opt/chrome/chrome`, also `$VELLORA_FIDELITY_CHROME` |
| Python | 3.12.13 via uv 0.11.10 (`fidelity/README.md`) |
| poppler-utils | 25.03.0-5+deb13u4 (the macOS runs use Homebrew poppler 26.06.0) |
| docker CLI | 29.8.2 static binary |

Every download is checked against a sha256 for both arches (`pin-downloads.sh` prints them). The
other apt packages (compiler toolchain, Chrome's shared libraries, and the fonts fontconfig pulls
in as a dependency) are not version pinned; `setup` writes `dpkg-query` output to
`fidelity/results/linux/env.txt`.

## How the oracles' Docker images are reached

The oracles start sibling containers (`vellora-fidelity-tools:*`, veraPDF) with
`docker run -v <path>:/work`. Instead of docker-in-docker, `run.sh` mounts the host's Docker
socket, and mounts the repo (plus its git common dir, for a worktree) **at its host path**, so
every path an oracle mounts (always a directory under the run's `--out`) exists on the host.
`TMPDIR` stays the container's `/tmp`: three fidelity self-tests need a temp dir outside any git
repo. Cargo runs with `CARGO_BUILD_JOBS=8`: with 18 parallel jobs the test binaries' debug links
were OOM-killed (ld signal 9) in a 15.6 GiB Docker VM. The tools image must
already exist on the host daemon (`fidelity/oracles/docker/tools.Dockerfile`).

## Use

```sh
docker build --platform linux/arm64 -f fidelity/linux/Dockerfile -t vellora-fidelity-linux:155 fidelity/linux
bash fidelity/linux/run.sh setup     # npm ci, npm run build, fidelity npm + uv installs, WPT checkout
bash fidelity/linux/run.sh test      # npm test, npm --prefix fidelity test
# a gated run; directories outside the repo that the command reads are mounted read-only:
VELLORA_LINUX_RO=<run store> bash fidelity/linux/run.sh gate --gate --raw --main --contract \
  --chrome /opt/chrome/chrome --baseline fidelity/baselines/port/<previous> \
  --chrome-from <run store>/<run>/wpt/results.json --tools-image vellora-fidelity-tools:baseline-beta4 \
  --accept <accepted.json> --step <NN-name> --out fidelity/results/run-all/<name>
```

Paths given to `gate` must be absolute or repo-relative (`HOME` is `/root` inside, so no `~`).
The build writes Linux artefacts into the bind-mounted checkout (`target/`, `node_modules/`,
`packages/native/vellora.linux-arm64-gnu.node`, `fidelity/.venv`): use a dedicated worktree, and
run `npm ci && npm run build` again before using that checkout on the host.

## linux/amd64

The Dockerfile carries the amd64 sums (`--platform linux/amd64`), but that build is untested here:
under emulation on an arm64 host a release build plus the `--raw` WPT run (2 x 8047 renders) did
not fit the time box of the first run (2026-10-28).
