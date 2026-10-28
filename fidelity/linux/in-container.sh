#!/usr/bin/env bash
# Runs INSIDE vellora-fidelity-linux (started by fidelity/linux/run.sh), from the repo root.
#   setup   npm ci, npm run build, the fidelity npm/uv installs, the WPT checkout
#   test    npm test, then npm --prefix fidelity test
#   gate    fidelity/run-all.mjs with the arguments after `gate` (see README.md)
#   shell   an interactive shell
set -euo pipefail
cd "$(dirname "$0")/../.."
log=fidelity/results/linux
mkdir -p "$log"

env_report() {
  uname -a; cat /etc/debian_version; node --version; rustc --version; cargo --version
  uv --version; docker --version; "$VELLORA_FIDELITY_CHROME" --version; pdftoppm -v 2>&1 | head -1
  dpkg-query -W -f '${Package} ${Version}\n'
}

case "${1:-}" in
  setup)
    env_report > "$log/env.txt"
    npm ci
    npm run build
    npm --prefix fidelity ci
    npm --prefix fidelity/wpt ci
    npm --prefix fidelity/oracles ci
    uv venv fidelity/.venv --python 3.12 --allow-existing
    uv pip install --python fidelity/.venv/bin/python --require-hashes -r fidelity/oracles/requirements.txt
    uv pip install --python fidelity/.venv/bin/python -r fidelity/corpus/requirements.txt
    node fidelity/wpt/fetch-wpt.mjs
    ;;
  test)
    npm test
    npm --prefix fidelity test
    ;;
  gate)
    shift
    node fidelity/run-all.mjs "$@"
    ;;
  shell) exec bash ;;
  *) echo "usage: $0 setup|test|gate <run-all args>|shell" >&2; exit 64 ;;
esac
