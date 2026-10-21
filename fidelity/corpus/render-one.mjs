#!/usr/bin/env node
// Render one corpus fixture with vellora (strict) and print the PDF sha256 (or the rejection).
// Used by render-corpus.mjs as a child process under a different TZ / LANG to check that the bytes
// do not depend on the host environment.
//   node fidelity/corpus/render-one.mjs <fixtureId> [dataFile]
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { renderPdf } from "vellora";
import { fixtureImages, renderOptions } from "./lib/fixture-io.mjs";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const [id, dataFile = "data.json"] = process.argv.slice(2);
const dir = join(repoRoot, "fixtures", id);
const html = readFileSync(join(dir, "index.html"), "utf8");
const data = JSON.parse(readFileSync(join(dir, dataFile), "utf8"));
try {
  const pdf = await renderPdf(html, data, renderOptions(fixtureImages(dir)));
  console.log(JSON.stringify({ ok: true, sha256: createHash("sha256").update(pdf).digest("hex") }));
} catch (e) {
  console.log(JSON.stringify({ ok: false, error: `${e.name}: ${e.message}` }));
}
