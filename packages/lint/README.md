# @vellora/lint

Dev-time HTML diagnose + fix for the [vellora](https://github.com/diomalta/vellora)
HTML/CSS subset (parse5 + resvg). Keeps your templates inside the supported subset
at authoring/CI time — like a linter, never silently at render time.

> **Pre-release (alpha)** — the `diagnose` / `fix` API is under active
> development.

## Install

```bash
npm install @vellora/lint
```

## Usage

```ts
import { diagnose, fix } from "@vellora/lint";

const report = diagnose(html);
```

## License

MIT — see [LICENSE](./LICENSE).
