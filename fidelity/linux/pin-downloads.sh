#!/usr/bin/env bash
# Prints the sha256 of every download fidelity/linux/Dockerfile pins, for both Linux arches.
# Run it when bumping a version, then copy the sums into the Dockerfile's ARGs.
#   bash fidelity/linux/pin-downloads.sh
set -euo pipefail
NODE=22.23.2 UV=0.11.10 RUSTUP=1.28.2 DOCKER_CLI=29.8.2 CHROME=155.0.8059.85
work=$(mktemp -d)
ua="User-Agent: vellora-fidelity-tooling"
sum() { curl -fsSL -H "$ua" -o "$work/f" "$1" && echo "$2 $(shasum -a 256 "$work/f" | cut -d' ' -f1)"; }
curl -fsSL -H "$ua" "https://nodejs.org/dist/v$NODE/SHASUMS256.txt" | grep -E "linux-(arm64|x64)\.tar\.xz"
for a in aarch64 x86_64; do
  sum "https://github.com/astral-sh/uv/releases/download/$UV/uv-$a-unknown-linux-gnu.tar.gz" "uv-$a"
  sum "https://static.rust-lang.org/rustup/archive/$RUSTUP/$a-unknown-linux-gnu/rustup-init" "rustup-$a"
  sum "https://download.docker.com/linux/static/stable/$a/docker-$DOCKER_CLI.tgz" "docker-$a"
done
for p in linux-arm64 linux64; do
  sum "https://storage.googleapis.com/chrome-for-testing-public/$CHROME/$p/chrome-$p.zip" "chrome-$p"
done
rm -rf "$work"
