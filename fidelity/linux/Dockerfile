# vellora fidelity: a pinned Linux environment for the full build, the tests and a gated
# fidelity run (`fidelity/run-all.mjs --gate`). Local only; never pushed anywhere.
#
#   docker build -f fidelity/linux/Dockerfile -t vellora-fidelity-linux:155 fidelity/linux
#
# The repo is NOT copied in: it is bind-mounted at its host path, and the host's Docker socket is
# mounted, so the oracles' own `docker run -v <path>:...` calls (tools image, veraPDF) resolve on
# the host daemon. See fidelity/linux/README.md for the exact `docker run` line.
#
# Pins: the base by digest (multi-arch index, Debian 13.7 trixie-slim on 2026-10-28); every
# download by version AND sha256 for both arches (sums from fidelity/linux/pin-downloads.sh);
# poppler-utils (a measurement tool: pdftoppm/pdftotext feed oracles) by exact Debian version.
# The remaining apt packages (build toolchain, Chrome's shared libraries) are not version pinned;
# the runner prints `dpkg-query` output into the run log so a drift is visible.
FROM debian:trixie-slim@sha256:89c1ea91e897f0fe0a3731595330bc45b8bdef4047464a07116f891a94054b31

ARG TARGETARCH
ARG NODE_VERSION=22.23.2
ARG NODE_SHA256_arm64=fff4078c5def658577f92c88db7db3bc0072924bfb93fe52c1e744a54e94abb8
ARG NODE_SHA256_amd64=d60acfe00a2932254bb0ad20e01b0d74397a0875595de719654b214f4b03f307
ARG UV_VERSION=0.11.10
ARG UV_SHA256_arm64=91d5f4583539640765662ef86edcf3bf4db07439b622c7bed50c961240162046
ARG UV_SHA256_amd64=077e1a0777bcf516e02f4ef245e269c8d1baa780438e4c50e09c5c997f85538a
ARG RUSTUP_VERSION=1.28.2
ARG RUSTUP_SHA256_arm64=e3853c5a252fca15252d07cb23a1bdd9377a8c6f3efa01531109281ae47f841c
ARG RUSTUP_SHA256_amd64=20a06e644b0d9bd2fbdbfd52d42540bdde820ea7df86e92e533c073da0cdd43c
ARG RUST_TOOLCHAIN=1.96.0
ARG DOCKER_CLI_VERSION=29.8.2
ARG DOCKER_SHA256_arm64=76a624e4a8e5da654d1150e808175125efb5a6f1b6aa1cbd9caee18f51047a50
ARG DOCKER_SHA256_amd64=995d1ef289677f74fd58d8d2c35727b6a4ee389c69db8638a3e42d0487aa5b0f
ARG CHROME_VERSION=155.0.8059.85
ARG CHROME_SHA256_arm64=e5cb7cb988b2de4ff924ec784109113c710ff28bbbe49c1255551ec8820870ce
ARG CHROME_SHA256_amd64=8e59438837ac4b995d01ef4026bac85c95800376bb2e3c06ac4d54af1ebd5f9d
ARG PYTHON_VERSION=3.12.13

ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    ca-certificates curl xz-utils unzip git build-essential pkg-config \
    libfontconfig1-dev libfreetype-dev \
    poppler-utils=25.03.0-5+deb13u4 \
    libasound2t64 libatk-bridge2.0-0t64 libatk1.0-0t64 libatspi2.0-0t64 libcairo2 libcups2t64 \
    libdbus-1-3 libdrm2 libexpat1 libgbm1 libglib2.0-0t64 libnspr4 libnss3 libpango-1.0-0 \
    libudev1 libvulkan1 libx11-6 libxcb1 libxcomposite1 libxdamage1 libxext6 libxfixes3 \
    libxkbcommon0 libxrandr2 fontconfig \
  && rm -rf /var/lib/apt/lists/*

# Download one pinned file and check its sha256 (the sum ARG is chosen by TARGETARCH).
RUN printf '#!/bin/sh\nset -eu\ncurl -fsSL -H "User-Agent: vellora-fidelity-tooling" -o "$2" "$1"\necho "$3  $2" | sha256sum -c -\n' \
    > /usr/local/bin/fetch-pinned && chmod +x /usr/local/bin/fetch-pinned

RUN set -eu; case "$TARGETARCH" in arm64) n=arm64; u=aarch64; s_node=$NODE_SHA256_arm64; s_uv=$UV_SHA256_arm64; s_rup=$RUSTUP_SHA256_arm64; s_dk=$DOCKER_SHA256_arm64; c=linux-arm64; s_c=$CHROME_SHA256_arm64;; \
      amd64) n=x64; u=x86_64; s_node=$NODE_SHA256_amd64; s_uv=$UV_SHA256_amd64; s_rup=$RUSTUP_SHA256_amd64; s_dk=$DOCKER_SHA256_amd64; c=linux64; s_c=$CHROME_SHA256_amd64;; \
      *) echo "unsupported arch $TARGETARCH"; exit 1;; esac; \
  cd /tmp; \
  fetch-pinned "https://nodejs.org/dist/v$NODE_VERSION/node-v$NODE_VERSION-linux-$n.tar.xz" node.tar.xz "$s_node"; \
  tar -xJf node.tar.xz -C /usr/local --strip-components=1 --exclude='*.md' --exclude=LICENSE; \
  fetch-pinned "https://github.com/astral-sh/uv/releases/download/$UV_VERSION/uv-$u-unknown-linux-gnu.tar.gz" uv.tgz "$s_uv"; \
  tar -xzf uv.tgz -C /usr/local/bin --strip-components=1; \
  fetch-pinned "https://download.docker.com/linux/static/stable/$u/docker-$DOCKER_CLI_VERSION.tgz" docker.tgz "$s_dk"; \
  tar -xzf docker.tgz -C /usr/local/bin --strip-components=1 docker/docker; \
  fetch-pinned "https://static.rust-lang.org/rustup/archive/$RUSTUP_VERSION/$u-unknown-linux-gnu/rustup-init" rustup-init "$s_rup"; \
  chmod +x rustup-init; \
  RUSTUP_HOME=/opt/rustup CARGO_HOME=/opt/cargo ./rustup-init -y --no-modify-path --profile minimal \
    --default-toolchain "$RUST_TOOLCHAIN" -c rustfmt -c clippy; \
  fetch-pinned "https://storage.googleapis.com/chrome-for-testing-public/$CHROME_VERSION/$c/chrome-$c.zip" chrome.zip "$s_c"; \
  unzip -q chrome.zip -d /opt; mv "/opt/chrome-$c" /opt/chrome; \
  rm -rf /tmp/*

ENV RUSTUP_HOME=/opt/rustup CARGO_HOME=/opt/cargo \
    PATH=/opt/cargo/bin:/usr/local/bin:/usr/bin:/bin \
    UV_PYTHON_INSTALL_DIR=/opt/uv-python UV_PYTHON_BIN_DIR=/usr/local/bin \
    VELLORA_FIDELITY_CHROME=/opt/chrome/chrome \
    PUPPETEER_SKIP_DOWNLOAD=1
# --default also links python3 into /usr/local/bin: stylo's build script runs python3.
RUN uv python install --default "$PYTHON_VERSION" && python3 --version \
  && /opt/chrome/chrome --version && node --version && rustc --version && uv --version \
  && docker --version && pdftoppm -v
