# @vellora/lint

**Catch template problems while you write them, not when a customer opens a broken PDF.**

[![npm](https://img.shields.io/npm/v/@vellora/lint)](https://www.npmjs.com/package/@vellora/lint)
![license: MIT](https://img.shields.io/badge/license-MIT-blue)

[vellora](https://www.npmjs.com/package/vellora) renders HTML to PDF without a browser, and it
supports a documented subset of HTML and CSS. `@vellora/lint` checks your templates against that
subset and rewrites the constructs that have a safe automatic fix. It's meant for your editor, your
tests and CI. It never runs on your production render path unless you ask for it.

## Install

```bash
npm install --save-dev @vellora/lint
```

## Check a template

```js
import { diagnose } from "@vellora/lint";

const report = diagnose(`<table><tr><td style="display:grid">a</td></tr></table>`);

report.conformant; // false
report.findings[0];
// {
//   rule: "flex-grid-in-td",
//   severity: "warning",
//   autoFixable: true,
//   location: { line: 1, col: 12 },
//   suggestedFix: "...",
//   snippet: "...",
//   compatLink: "...",
// }
```

`diagnose(html)` only reads. It never changes your HTML, touches the file system or goes to the
network, so it's safe to call anywhere.

## Fix it automatically

```js
import { fix } from "@vellora/lint";

const { html, report } = fix(template);
// html: the rewritten template. Here the grid cell becomes a nested table,
// which vellora lays out reliably.
// report.findings[i].applied tells you which fixes ran.
```

The fixes are deterministic. Running `fix()` on its own output changes nothing, so it's safe to run
on every commit.

## Use it in CI

Fail the build when a template drifts out of the supported subset:

```js
import { readFileSync } from "node:fs";
import { diagnose } from "@vellora/lint";

for (const file of ["templates/invoice.html", "templates/receipt.html"]) {
  const { conformant, findings } = diagnose(readFileSync(file, "utf8"));
  for (const f of findings) {
    console.log(`${file}:${f.location.line}:${f.location.col} ${f.severity} ${f.rule}`);
  }
  if (!conformant) process.exitCode = 1;
}
```

Prefer the terminal? [`@vellora/cli`](https://www.npmjs.com/package/@vellora/cli) runs the same
checks: `vellora lint templates/invoice.html` (exit code 1 when there are findings) and
`vellora fix templates/invoice.html --write`.

## The report format

```ts
interface Report {
  conformant: boolean;
  findings: Finding[];
}

interface Finding {
  rule: string; // stable id, e.g. "flex-grid-in-td"
  severity: "error" | "warning";
  autoFixable: boolean;
  location: { line: number; col: number };
  suggestedFix: string; // for humans
  snippet: string; // the offending source
  compatLink: string; // where the rule is documented
  applied?: boolean; // set by fix()
}
```

People read `suggestedFix` and `snippet`. Scripts, CI and AI agents should rely on `rule`,
`severity`, `autoFixable`, `location` and `compatLink`.

## How it relates to rendering

- `renderPdf(html)` in vellora is **strict by default**: it never imports this package and never
  changes your HTML. Out-of-subset input throws a `VelloraUnsupportedError` with the line and
  column.
- `renderPdf(html, data, { strict: false })` loads this package and applies `fix()` before
  rendering, for when you'd rather get a PDF than an error.

The linter covers the rules that have a fix or a useful warning. The renderer's own check is the
final word: some constructs, such as CSS `transform`, are only rejected at render time. The full
list is in [COMPATIBILITY.md](https://github.com/diomalta/vellora/blob/main/COMPATIBILITY.md).

## License

MIT. See [LICENSE](./LICENSE).
