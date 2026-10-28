#!/usr/bin/env node
// Regenerate (default) or verify (--check) the derived fixture data files.
//   node fidelity/corpus/build-fixtures.mjs           # write fixtures/<id>/data*.json
//   node fidelity/corpus/build-fixtures.mjs --check   # exit 1 if any committed file drifted
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { buildBoleto, buildDanfe, buildStatement } from "./lib/build.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "..", "..");
const readInputs = (name) => JSON.parse(readFileSync(join(here, "inputs", name), "utf8"));

/** Every derived file: path relative to the repo root -> builder. */
export const TARGETS = [
  {
    path: "fixtures/boleto-febraban/data.json",
    build: () => buildBoleto(readInputs("boleto-febraban.json"), "spec"),
  },
  {
    path: "fixtures/boleto-febraban/data.px-grid.json",
    build: () => buildBoleto(readInputs("boleto-febraban.json"), "pxGrid"),
  },
  { path: "fixtures/danfe/data.json", build: () => buildDanfe(readInputs("danfe.json")) },
  {
    path: "fixtures/text-stress-ptbr/data.json",
    build: () => buildStatement(readInputs("text-stress-ptbr.json")),
  },
];

export function serialize(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function main() {
  const check = process.argv.includes("--check");
  let drift = 0;
  for (const target of TARGETS) {
    const abs = join(repoRoot, target.path);
    const next = serialize(target.build());
    if (check) {
      let current = "";
      try {
        current = readFileSync(abs, "utf8");
      } catch {
        current = "";
      }
      if (current !== next) {
        drift++;
        console.error(`DRIFT ${target.path}: committed file differs from regenerated output`);
      } else {
        console.log(`ok ${target.path}`);
      }
    } else {
      writeFileSync(abs, next);
      console.log(`wrote ${target.path}`);
    }
  }
  if (drift > 0) {
    process.exit(1);
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}
