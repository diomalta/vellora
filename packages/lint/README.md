# @vellora/lint

Dev-time HTML diagnose + fix for the [vellora](https://github.com/diomalta/vellora)
HTML/CSS subset (parse5 + resvg). Keeps your templates inside the supported subset
at authoring/CI time, like a linter, never silently during strict rendering.

> **0.x pre-1.0** — the `diagnose` / `fix` API is implemented and still evolving.

## Install

```bash
npm install @vellora/lint
```

## Usage

```ts
import { diagnose, fix } from "@vellora/lint";

const report = diagnose(html);
if (!report.conformant) {
  for (const finding of report.findings) {
    console.log(
      `${finding.severity} ${finding.rule} at ${finding.location.line}:${finding.location.col}`,
    );
    console.log(finding.suggestedFix);
  }
}

const result = fix(html);
await writeFile("template.fixed.html", result.html);
console.log(`applied ${result.report.findings.filter((f) => f.applied).length} fixes`);
```

`diagnose(html)` is read-only: it does not mutate, serialize, fetch, or read files.
`fix(html)` applies deterministic codemods and returns `{ html, report }`; running
`fix()` on its own output is a fixed point.

## Report contract

The exported `Report` type is stable for programmatic use:

```ts
interface Report {
  conformant: boolean;
  findings: Finding[];
}

interface Finding {
  rule: string;
  severity: "error" | "warning";
  autoFixable: boolean;
  location: { line: number; col: number };
  suggestedFix: string;
  snippet: string;
  compatLink: string;
  applied?: boolean;
}
```

Humans can read `suggestedFix` and `snippet`; CI and AI agents should key off
`rule`, `severity`, `autoFixable`, `location`, and `compatLink`.

## Runtime boundary

`@vellora/lint` is dev-time/CI tooling. Strict `renderPdf(..., { strict: true })`
never runs these fixers and never mutates HTML. Opt-in best-effort rendering
(`strict: false`) uses the same `fix()` path before rendering.

## License

MIT — see [LICENSE](./LICENSE).
