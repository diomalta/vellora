# @vellora/cli

**Render, check and fix HTML-to-PDF templates from your terminal.**

[![npm](https://img.shields.io/npm/v/@vellora/cli)](https://www.npmjs.com/package/@vellora/cli)
![license: MIT](https://img.shields.io/badge/license-MIT-blue)

The `vellora` command wraps the [vellora](https://www.npmjs.com/package/vellora) renderer, which
turns HTML into PDF without a browser. Use it to try a template quickly, to lint templates in CI,
or to compare vellora's output with Chrome before you switch a template over.

## Install

```bash
npm install --global @vellora/cli
# or run it once without installing
npx @vellora/cli render invoice.html --data invoice.json --out invoice.pdf
```

## Render a PDF

```bash
vellora render templates/invoice.html \
  --data templates/invoice.json \
  --out out/invoice.pdf
```

`--data` fills the template's `{{ placeholders }}` and loops. `--out` is required so PDF bytes never
end up in your terminal. Use `-` as the input to read HTML from stdin:

```bash
cat invoice.html | vellora render - --out invoice.pdf
```

More options:

| Option | What it does |
|---|---|
| `--image <key>=<path>` | Supplies an image your `<img src="key">` uses. Repeat for each image. vellora never downloads images. |
| `--font <path>` | Adds a TTF/OTF font. Repeat for each file. |
| `--base-url <url>` | Resolves relative image paths. |
| `--title <text>` | Sets the PDF title. |
| `--creation-date <iso>` | Sets the PDF creation date (otherwise a fixed date keeps output reproducible). |
| `--engine native\|chromium\|auto` | Picks the renderer. `native` is the default. |
| `--template-id <id>` / `--policy <file>` | With `--engine auto`, choose the engine per template from a policy file. |

## Check and fix templates

```bash
vellora lint templates/invoice.html          # human-readable findings
vellora lint templates/invoice.html --json   # for scripts and CI
vellora fix templates/invoice.html           # print the fixed template
vellora fix templates/invoice.html --write   # fix the file in place
```

`vellora lint` exits with code 1 when it finds something, so it can fail a CI job as is. The checks
come from [`@vellora/lint`](https://www.npmjs.com/package/@vellora/lint).

## Compare with Chrome before switching

```bash
vellora doctor templates/invoice.html --reference chromium --pixel-diff --out artifacts
```

`doctor` renders the template with vellora, renders it again with Chrome (or compares against a PDF
you already have), and writes the images and a pixel diff to `artifacts/`. It can also suggest a
`vellora.fidelity.json` policy that sends only the templates that need Chrome to the Chromium
engine. `vellora fidelity --config vellora.fidelity.json` validates that file.

Comparing with Chrome needs the optional
[`@vellora/engine-chromium`](https://www.npmjs.com/package/@vellora/engine-chromium) and a Chrome or
Chromium already installed on the machine.

## Exit codes

| Code | Meaning |
|---|---|
| `0` | Success |
| `1` | `vellora lint` found something |
| `2` | Wrong usage, missing input, or invalid file or JSON |
| `3` | The render, lint or fix itself failed |
| `4` | The reference engine you asked for isn't available |

## License

MIT. See [LICENSE](./LICENSE).
