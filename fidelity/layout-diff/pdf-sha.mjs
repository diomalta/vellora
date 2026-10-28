#!/usr/bin/env node
// Determinism guard for the layout-dump hook: render the four fixtures through the PRODUCTION path
// (vellora renderPdf -> @vellora/native addon -> vellora-core::render) and print sha256 per PDF.
// Run before and after a crates/ change; the hashes must be identical.
//
//   node fidelity/layout-diff/pdf-sha.mjs [--repo <checkout>] [--out <file.json>]
//
// --repo defaults to this checkout; pointing it at another worktree hashes THAT build's addon.
import { createHash } from "node:crypto";
import { writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { captureEnv } from "./lib/env.mjs";
import { FIXED_CREATION_DATE, FIXTURE_IDS, prepareFixture, repoRoot } from "./lib/fixture-html.mjs";

function arg(name, fallback) {
  const i = process.argv.indexOf(name);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

async function main() {
  const repo = resolve(arg("--repo", repoRoot));
  const out = arg("--out", null);
  const vellora = await import(pathToFileURL(join(repo, "packages/vellora/dist/index.js")).href);
  const results = {};
  for (const id of FIXTURE_IDS) {
    const prepared = prepareFixture(id, vellora.renderTemplate, repo);
    const pdf = await vellora.renderPdf(prepared.nativeHtml, undefined, {
      strict: true,
      metadata: { title: `layout-diff-${id}`, creationDate: FIXED_CREATION_DATE },
    });
    results[id] = {
      bytes: pdf.length,
      sha256: createHash("sha256").update(pdf).digest("hex"),
    };
    process.stdout.write(`${id}\t${results[id].sha256}\t${results[id].bytes}\n`);
  }
  const report = {
    schema: "vellora-layout-diff/pdf-sha/1",
    env: await captureEnv({ repo, command: process.argv.slice(1).join(" ") }),
    results,
  };
  if (out) {
    writeFileSync(out, `${JSON.stringify(report, null, 2)}\n`);
  }
}

main().catch((err) => {
  process.stderr.write(`pdf-sha failed: ${err?.stack ?? err}\n`);
  process.exitCode = 1;
});
