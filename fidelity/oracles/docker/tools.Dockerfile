# vellora fidelity tools image: qpdf CLI, zbarimg (second barcode decoder) and WeasyPrint
# (second layout oracle). Built locally; never pushed anywhere.
#
#   docker build -f fidelity/oracles/docker/tools.Dockerfile -t vellora-fidelity-tools:local \
#     fidelity/oracles/docker
#
# Pinning: the base is pinned by its multi-arch index digest (linux/arm64 for local Apple
# Silicon, linux/amd64 for CI). Every apt package is pinned to an exact Debian version so a
# mirror update makes the build FAIL instead of silently changing an oracle. Python packages
# are hash-locked (requirements-weasyprint.txt). The oracle runner records the image ID and the
# tools' own --version output in every result file.
FROM python:3.12-slim-trixie@sha256:a6e34c598f2467ed0e9a8d349809fcd8b5c603269512df273a0bb1784edc11b1

RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    qpdf=12.2.0-1 \
    zbar-tools=0.23.93-8 \
    libpango-1.0-0=1.56.3-1 \
    libpangoft2-1.0-0=1.56.3-1 \
    libharfbuzz-subset0=10.2.0-1+deb13u1 \
  && rm -rf /var/lib/apt/lists/*

COPY requirements-weasyprint.txt /tmp/requirements-weasyprint.txt
RUN pip install --no-cache-dir --require-hashes -r /tmp/requirements-weasyprint.txt \
  && rm /tmp/requirements-weasyprint.txt

RUN useradd --create-home oracle
USER oracle
WORKDIR /work
