#!/usr/bin/env node
// Offline backfill of the EXT-2 missing-token lists into a committed baseline (2026-10-22), from
// the oracles' result.json of the run the baseline was written from. The gate ratchets the SET of
// missing tokens per extractor (gate/compare.mjs compareMissingTokens); baselines written before
// the verdicts carried `missingTokens` (combine/verdicts.mjs) only have the counts in their value
// strings. Changes nothing but a new `ext2-tokens.json` and the manifest's file hashes:
//
//   - the run is verified first: its summary.json sha256 must equal the manifest's source, and
//     every EXT-2 verdict value of the baseline must equal the value the combine step derives
//     from that result.json (textValue): proof that these records are the ones it measured;
//   - ext2-tokens.json { schema, source, command, date, rows: { "<fixture key>|<mode>":
//     { <extractor>: { tokens, count, complete } } } }, biome-formatted, then hashed; `complete`
//     is false where the record kept only the first 40 tokens (oracles/lib/text.mjs before
//     `missingAll`): the gate then falls back to the count ratchet for that extractor;
//   - manifest.ext2TokensBackfill records command, date, run, rows and incomplete lists.
//
//   node fidelity/gate/backfill-ext2-tokens.mjs --baseline fidelity/baselines/<name> --run <run-all dir>
//     [--dry-run]
import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { missingTokensOf, textValue } from "../combine/verdicts.mjs";
import { EXT2_TOKENS_FILE, EXT2_TOKENS_SCHEMA, loadBaselineDir } from "./snapshot.mjs";
import { assertFormatted, biomeFormat, biomeUnavailable, json } from "./write-baseline.mjs";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
const GATE_SCHEMA = "vellora-fidelity/baseline/2";

/** The oracles result.json of a fixture key and mode in a run dir (corpus or legacy fixture). */
export function oracleRecordPath(runDir, key, mode) {
  for (const kind of ["corpus", "fixtures"]) {
    const f = join(runDir, "oracles", kind, key, mode || "plain", "result.json");
    if (existsSync(f)) return f;
  }
  return null;
}

export function backfillExt2Tokens({
  dir,
  runDir,
  dryRun = false,
  command,
  format = biomeFormat,
  formatterUnavailable = biomeUnavailable,
}) {
  const why = formatterUnavailable();
  if (why) throw new Error(`biome is not runnable (${why}): a backfill must format before hashing`);
  const manifest = JSON.parse(readFileSync(join(dir, "manifest.json"), "utf8"));
  const want = manifest.source?.summarySha256 ?? manifest.provenance?.sourceSummarySha256;
  const got = sha256(readFileSync(join(runDir, "summary.json")));
  if (want !== got) {
    throw new Error(
      `${dir}: run summary.json sha256 ${got.slice(0, 12)} != manifest ${String(want).slice(0, 12)}`,
    );
  }
  const before = loadBaselineDir(dir);
  if (!before.integrity.ok) {
    throw new Error(`${dir}: integrity ${before.integrity.problems.join("; ")}`);
  }
  const rows = {};
  const incomplete = [];
  const missing = [];
  const differs = [];
  for (const f of before.fixtures) {
    for (const v of f.verdicts ?? []) {
      if (v.criterion !== "EXT-2" || v.oracle !== "oracles:text") continue;
      const path = oracleRecordPath(runDir, f.key, v.mode);
      if (!path) {
        missing.push(`${f.key}|${v.mode ?? ""}`);
        continue;
      }
      const text = JSON.parse(readFileSync(path, "utf8")).results?.text;
      if (textValue(text ?? {}) !== v.value) {
        differs.push(`${f.key}|${v.mode ?? ""}: "${v.value}" vs record "${textValue(text ?? {})}"`);
        continue;
      }
      const t = missingTokensOf(text);
      if (!t) continue;
      rows[`${f.key}|${v.mode ?? ""}`] = t;
      for (const [ex, x] of Object.entries(t)) {
        if (!x.complete)
          incomplete.push(`${f.key}|${v.mode ?? ""} ${ex} ${x.tokens.length}/${x.count}`);
      }
    }
  }
  if (differs.length) {
    throw new Error(`${dir}: EXT-2 values differ from the run's records: ${differs.join("; ")}`);
  }
  const record = {
    command,
    date: new Date().toISOString(),
    source: { run: runDir, summarySha256: got },
    rows: Object.keys(rows).length,
    incomplete,
    missingRecords: missing,
  };
  const doc = {
    schema: EXT2_TOKENS_SCHEMA,
    note: "EXT-2 missing-token lists per extractor, backfilled from the run's oracles result.json (fidelity/gate/backfill-ext2-tokens.mjs); read by fidelity/gate/snapshot.mjs withExt2Tokens",
    ...record,
    rows,
  };
  if (dryRun) return { record, doc };
  writeFileSync(join(dir, EXT2_TOKENS_FILE), json(doc));
  assertFormatted(format(join(dir, EXT2_TOKENS_FILE)), join(dir, EXT2_TOKENS_FILE));
  const files = {
    ...manifest.files,
    [EXT2_TOKENS_FILE]: sha256(readFileSync(join(dir, EXT2_TOKENS_FILE))),
  };
  const sorted = Object.fromEntries(Object.entries(files).sort(([a], [b]) => (a < b ? -1 : 1)));
  const gateSchema = manifest.schema === GATE_SCHEMA;
  const out = { ...manifest, files: gateSchema ? sorted : files, ext2TokensBackfill: record };
  writeFileSync(join(dir, "manifest.json"), json(out));
  assertFormatted(format(join(dir, "manifest.json")), join(dir, "manifest.json"));
  const after = loadBaselineDir(dir);
  if (!after.integrity.ok) {
    throw new Error(`${dir}: integrity after backfill: ${after.integrity.problems.join("; ")}`);
  }
  return { record, doc };
}

async function main() {
  const argv = process.argv.slice(2);
  const val = (n) => (argv.indexOf(n) >= 0 ? argv[argv.indexOf(n) + 1] : undefined);
  const dir = val("--baseline") && resolve(val("--baseline"));
  const runDir = val("--run") && resolve(val("--run"));
  if (!dir || !runDir) {
    process.stderr.write(
      "usage: backfill-ext2-tokens.mjs --baseline <dir> --run <run-all dir> [--dry-run]\n",
    );
    process.exitCode = 2;
    return;
  }
  const { record } = backfillExt2Tokens({
    dir,
    runDir,
    dryRun: argv.includes("--dry-run"),
    command: `node fidelity/gate/backfill-ext2-tokens.mjs ${argv.join(" ")}`,
  });
  process.stdout.write(
    `${relative(repoRoot, dir)}: ${record.rows} EXT-2 rows; incomplete ${record.incomplete.join(", ") || "none"}; no record ${record.missingRecords.join(", ") || "none"}\n`,
  );
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((e) => {
    process.stderr.write(`backfill-ext2-tokens failed: ${e?.stack ?? e}\n`);
    process.exitCode = 1;
  });
}
