# NOTICE — oss-sparksuite-invoice

This fixture is adapted from **sparksuite/simple-html-invoice-template**.

| Field | Value |
|---|---|
| Upstream repository | https://github.com/sparksuite/simple-html-invoice-template |
| Pinned commit | commit 7d74fe34c862b7712f1a23a3f12147a4a8bd53e1 (branch `master`, fetched 2026-10-21 UTC) |
| Upstream file | `invoice.html` — sha256 `a7fe870a3e9bd20e6c3bacacdee648e93ef2976ec587d47b7c84b1b84b5f48bc` |
| Licence | MIT, verified from the repository's `LICENSE` file at that commit (sha256 `c8ad2d5202a41fe59c78d51327a7050f933faee646acc0ec869d745e73a43b03`); copied verbatim to `LICENSE` here |
| Copyright | Copyright (c) 2021 Sparksuite |

## Adaptation (diff intent)

Everything not listed is verbatim (CSS, markup structure, sample content).

- **A1** Hard-coded sample text moved to `data.json` and re-inserted with vellora interpolations and
  one for-block over `items`; `data.json` reproduces the upstream text exactly (invoice 123, Sparksuite
  / Acme sample parties, three items, total $385.00). The `item last` row class is carried by data.
- **A2** The upstream logo is a remote URL (`https://sparksuite.github.io/.../logo.png`, the Sparksuite
  brand). Replaced by a neutral, self-made placeholder `assets/logo.png` (600 x 180, no text; generated
  by `fidelity/corpus/make_placeholder_logo.py`, CC0) because vellora never fetches the network and the
  brand logo is not part of the MIT grant's intent. `width="300" height="90"` attributes were added so
  the image has intrinsic dimensions; the upstream inline style (`width: 100%; max-width: 300px`) is kept.
- **A3** Added `@page { size: A4; margin: 15mm; }` so vellora and the Chromium reference print the same
  page box (upstream is a screen template and Chromium's default paper is locale-dependent).
