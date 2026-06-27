# @vellora/cli

The `vellora` command line: `render` / `lint` / `fix` for the
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
  --out out/invoice.pdf

vellora lint templates/invoice.html
vellora lint templates/invoice.html --json

vellora fix templates/invoice.html
vellora fix templates/invoice.html --write
```

`render` requires `--out` so PDF bytes are not accidentally written to a terminal.
Use `-` as the input path to read HTML from stdin.

## Exit Codes

| Code | Meaning |
|---|---|
| `0` | Success |
| `1` | `vellora lint` found diagnostics |
| `2` | Invalid usage, missing input, or invalid file/JSON input |
| `3` | Render/lint/fix runtime failure |

## License

MIT — see [LICENSE](./LICENSE).
