#!/usr/bin/env bash
# Host launcher for fidelity/linux/in-container.sh. Mounts, all at their HOST paths so the
# oracles' nested `docker run -v <host path>:...` calls resolve on the host daemon:
#   - the repo (read-write) and its git common dir (a worktree's .git file points there)
#   - the host Docker socket (tools image, veraPDF run as siblings, not docker-in-docker)
#   - extra read-only directories from $VELLORA_LINUX_RO (colon-separated), e.g. the run store
#     holding the --chrome-from results.json
# TMPDIR stays the container's /tmp: no oracle bind-mounts a temp dir (they mount dirs under
# --out), and 3 fidelity self-tests need a temp dir OUTSIDE any git repo.
# CARGO_BUILD_JOBS (default 8): with all 18 cores the cargo test binaries' parallel debug links
# were OOM-killed (ld signal 9) in a 15.6 GiB Docker VM (2026-10-28).
#   bash fidelity/linux/run.sh setup|test|gate <run-all args>|shell
set -euo pipefail
repo=$(cd "$(dirname "$0")/../.." && pwd)
common=$(cd "$repo" && cd "$(git rev-parse --git-common-dir)" && pwd)
platform=${VELLORA_LINUX_PLATFORM:-linux/arm64}
image=${VELLORA_LINUX_IMAGE:-vellora-fidelity-linux:155}
mounts=(-v "$repo:$repo" -v "/var/run/docker.sock:/var/run/docker.sock")
case "$common" in "$repo"/*) ;; *) mounts+=(-v "$common:$common") ;; esac
# (no empty-array expansion: macOS /bin/bash 3.2 treats "${a[@]}" of an empty array as unbound)
for d in $(echo "${VELLORA_LINUX_RO:-}" | tr ':' ' '); do mounts+=(-v "$d:$d:ro"); done
[ -t 0 ] && mounts+=(-it)
exec docker run --rm --shm-size=1g --platform "$platform" "${mounts[@]}" \
  -v vellora-linux-cargo-registry:/opt/cargo/registry \
  -e CARGO_BUILD_JOBS="${CARGO_BUILD_JOBS:-8}" \
  -e GIT_CONFIG_COUNT=1 -e GIT_CONFIG_KEY_0=safe.directory -e GIT_CONFIG_VALUE_0='*' \
  -w "$repo" "$image" bash "$repo/fidelity/linux/in-container.sh" "$@"
