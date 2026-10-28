# NOTICE — oss-postmark-receipt

This fixture is adapted from **ActiveCampaign/postmark-templates** (formerly wildbit/postmark-templates).

| Field | Value |
|---|---|
| Upstream repository | https://github.com/ActiveCampaign/postmark-templates |
| Pinned commit | commit fa73527acb4eb59cf673a54572d213e908f1515c (branch `main`, fetched 2026-10-21 UTC) |
| Upstream file | `templates/basic/receipt/content.html` — sha256 `1f6a3f3168eafdcaefd3843a4dc3b6d24cc82e8f042fe59963a973bce1bdf50b` |
| Licence | MIT, verified from the repository's `LICENSE` file at that commit (sha256 `a0f51a51a3e1b378cd992ce42968b51f1699740170d33c0a66f80035ea6376d2`); copied verbatim to `LICENSE` here |
| Copyright | Copyright (c) 2015 Wildbit |

## Adaptation (diff intent)

Everything not listed is verbatim (all CSS including the inert `@media` blocks, the e-mail table
structure, the `[Product Name]` placeholders, the duplicated `class` attribute on the amount cell).

- **R1** Removed `@import url("https://fonts.googleapis.com/css?family=Nunito+Sans:400,700&display=swap");`
  — the native renderer never fetches the network (determinism). The font stack
  `"Nunito Sans", Helvetica, Arial, sans-serif` is unchanged, so both engines fall back to the bundled
  Liberation Sans (the Chromium reference maps those family names to the same Liberation files).
- **R2** The Mustachio block `{{#each receipt_details}} ... {{/each}}` became a vellora for-block over
  `receipt_details`, and the two loop fields became `item.description` / `item.amount`. All other
  variables keep their upstream names; `data.json` provides synthetic values for them.
- **R3** Added `@page { size: A4; margin: 10mm; }` so vellora and the Chromium reference print the same
  page box (upstream is an e-mail body).
