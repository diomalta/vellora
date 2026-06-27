# @vellora/cli

The `vellora` command line: `render`, `lint`, `fix`, `doctor`, and `fidelity` for the
[vellora](https://github.com/diomalta/vellora) HTML→PDF renderer.

> **Pre-release (alpha)** — commands are implemented and evolving with the public API.

## Install

```bash
npm install -g @vellora/cli
```

For render commands in a source checkout, build first so the native addon exists:

```bash
npm run build
```

## Usage

```bash
vellora render templates/invoice.html \
  --data templates/invoice.json \
  --title "Invoice" \
  --creation-date 2026-06-23T00:00:00.000Z \
  --image assets/logo.png=assets/logo.png \
  --font ./Inter-Regular.ttf \
  --out out/invoice.pdf

vellora lint templates/invoice.html
vellora lint templates/invoice.html --json

vellora fix templates/invoice.html
vellora fix templates/invoice.html --write

vellora doctor templates/invoice.html --reference chromium --pixel-diff --out artifacts --json
vellora fidelity --config vellora.fidelity.json
```

`render` requires `--out` so PDF bytes are not accidentally written to a terminal.
Use `-` as the input path to read HTML from stdin.

`render` also accepts `--engine native|chromium|auto`, `--template-id`, `--policy`, `--base-url`,
`--image key=path`, and `--font path`. The native engine is the default; Chromium requires optional
`@vellora/engine-chromium` and a Chrome/Chromium executable supplied by the environment.

`doctor` renders fidelity artifacts, optionally compares pixels against Chromium or a reference PDF,
and can write a suggested `vellora.fidelity.json` policy. `fidelity` validates that policy file.

## Exit Codes

| Code | Meaning |
|---|---|
| `0` | Success |
| `1` | `vellora lint` found diagnostics |
| `2` | Invalid usage, missing input, or invalid file/JSON input |
| `3` | Render/lint/fix runtime failure |
| `4` | Requested reference engine unavailable |

## License

MIT — see [LICENSE](./LICENSE).
