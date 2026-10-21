#!/usr/bin/env node
// Download every primary source listed in fidelity/corpus/sources.json into
// fidelity/.cache/corpus/sources/ (gitignored) and verify its sha256, so a third party can check
// that the documents cited in SOURCES.md / ACCEPTANCE.md are byte-identical to the ones used.
//   node fidelity/corpus/fetch-sources.mjs [--verify-only]
// Read-only network access; the only request header set is the tooling User-Agent.
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const cacheDir = resolve(
  process.env.VELLORA_CORPUS_CACHE ?? join(here, "..", ".cache", "corpus", "sources"),
);
const USER_AGENT = "vellora-fidelity-tooling";
const sources = JSON.parse(readFileSync(join(here, "sources.json"), "utf8"));
const sha256 = (b) => createHash("sha256").update(b).digest("hex");

/** fetch with manual redirects and a cookie jar (ASP.NET cookie-detection redirects need it). */
async function download(url) {
  const jar = new Map();
  let current = url;
  for (let hop = 0; hop < 10; hop++) {
    const cookie = [...jar].map(([k, v]) => `${k}=${v}`).join("; ");
    const res = await fetch(current, {
      redirect: "manual",
      headers: { "User-Agent": USER_AGENT, ...(cookie ? { Cookie: cookie } : {}) },
    });
    for (const c of res.headers.getSetCookie?.() ?? []) {
      const [pair] = c.split(";");
      const i = pair.indexOf("=");
      jar.set(pair.slice(0, i).trim(), pair.slice(i + 1).trim());
    }
    if (res.status >= 300 && res.status < 400 && res.headers.get("location")) {
      current = new URL(res.headers.get("location"), current).href;
      continue;
    }
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} for ${current}`);
    }
    return new Uint8Array(await res.arrayBuffer());
  }
  throw new Error(`too many redirects for ${url}`);
}

const verifyOnly = process.argv.includes("--verify-only");
mkdirSync(cacheDir, { recursive: true });
let failures = 0;
for (const doc of sources.documents) {
  const path = join(cacheDir, doc.file);
  try {
    let bytes;
    if (existsSync(path)) {
      bytes = readFileSync(path);
    } else if (verifyOnly) {
      throw new Error("missing (run without --verify-only to download)");
    } else {
      bytes = await download(doc.url);
      writeFileSync(path, bytes);
    }
    const got = sha256(bytes);
    if (got !== doc.sha256) {
      failures++;
      console.error(
        `MISMATCH ${doc.id} ${doc.file}: ${got} != ${doc.sha256} (document changed upstream?)`,
      );
    } else {
      console.log(`ok ${doc.id} ${doc.file} ${got}`);
    }
  } catch (e) {
    failures++;
    console.error(`FAIL ${doc.id} ${doc.file}: ${e.message}`);
  }
}
process.exit(failures ? 1 : 0);
