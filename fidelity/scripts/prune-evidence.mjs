#!/usr/bin/env node
// Keep-latest rule for the committed fidelity evidence (2026-10-28 lean-PR prune).
//
//   node fidelity/scripts/prune-evidence.mjs --keep-latest [--apply] [--json] [--root <repo>]
//
// Without --apply it only lists what the rule keeps and what it would delete (dry run). With
// --apply it deletes the files from the working tree (stage with `git add -A fidelity`). Pruned
// evidence stays recoverable from git history; the 2026-10-28 prune left the full tree at the
// local tag `fidelity-archive-2026-10-28` (b5c95460eebedcc86a6dce3c0e262a940b0a8c27).
//
// What the gate needs going forward, and what a third party needs to re-check the published
// claims (docs/assets/fidelity/manifest.json), is KEPT:
//   fidelity/baselines/pin/                       the pin view (--pin default, GATE-H3) and the
//                                                 docs' "before" side (pin doc-aggregate, by-directory)
//   fidelity/baselines/port/*  (files)            README.md (names the chain head), DEBT.json,
//                                                 DEBT-BASE.json, declared-rejections.json
//   fidelity/baselines/port/<chain head>/         the --head default (README "**Chain head**")
//   fidelity/baselines/port/<latest link>/        the highest-ordinal NN-name link: the next
//                                                 step's --baseline
//   fidelity/baselines/port/<latest's baseline>/  the link the latest one was gated against
//                                                 (its manifest.json gate.baseline): re-running
//                                                 the published gate needs it
//   fidelity/baselines/wpt/<engine>.json          wpt/run.mjs's default expectations, for the
//                                                 engine of the latest link's expectations file
//   fidelity/gate/snapshots/<dir of DEBT-BASE>/   the snapshot holding the frozen rule-iii ledger
//                                                 DEBT-BASE.json names (the latest gated step's
//                                                 record: README, accepted.json, gate reports)
//   fidelity/gate/snapshots/<file cited>          every snapshot path docs/assets/fidelity/
//                                                 manifest.json cites (e.g. paint-probe pin side)
//                                                 or a published docs page (docs/**/*.md) cites
//                                                 (e.g. the cross-OS record in guide/fidelity.md)
// Everything else under the managed roots is DELETED: other port links, other fidelity/baselines/*
// directories (beta4, beta4-gated, ...), other baselines/wpt files, other gate snapshots, and all
// of fidelity/layout-diff/snapshots, fidelity/combine/snapshots, fidelity/oracles/reports and
// fidelity/upstream-drafts.
import { existsSync, readFileSync, readdirSync, rmSync, statSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";

export const ARCHIVE_TAG = "fidelity-archive-2026-10-28";
export const ARCHIVE_SHA = "b5c95460eebedcc86a6dce3c0e262a940b0a8c27";

const STEP_RE = /^(\d{2})-[a-z0-9][a-z0-9-]*$/;
/** Roots removed entirely (their content is history; it lives in the run store / archive). */
export const DROPPED_ROOTS = [
  "fidelity/layout-diff/snapshots",
  "fidelity/combine/snapshots",
  "fidelity/oracles/reports",
  "fidelity/upstream-drafts",
];
const SNAPSHOTS = "fidelity/gate/snapshots";
const BASELINES = "fidelity/baselines";
const PORT = `${BASELINES}/port`;
const DOCS_MANIFEST = "docs/assets/fidelity/manifest.json";
const DOCS_PAGES = "docs";

const toPosix = (p) => p.split(sep).join("/");

function walk(abs) {
  if (!existsSync(abs)) return [];
  if (!statSync(abs).isDirectory()) return [abs];
  return readdirSync(abs).flatMap((n) => walk(join(abs, n)));
}

/** The chain head link name (`00-start`) from port/README.md, as gate/debt.mjs chainHead reads it. */
export function chainHeadName(root) {
  const text = readFileSync(join(root, PORT, "README.md"), "utf8");
  const m = /\*\*Chain head\*\*[^)]*\):\s*`([^`]+)`/.exec(text);
  if (!m) throw new Error(`${PORT}/README.md names no "**Chain head**"`);
  const [top, name] = m[1].split("/");
  if (top !== "port" || !STEP_RE.test(name ?? ""))
    throw new Error(`chain head ${m[1]} is not port/NN-name`);
  return name;
}

/** The keep set: { keep: [repo-relative dir or file], why: { path: reason } }. */
export function keepSet(root) {
  const why = {};
  const add = (p, reason) => {
    if (!why[p]?.includes(reason)) why[p] = why[p] ? `${why[p]}; ${reason}` : reason;
  };
  add(`${BASELINES}/pin`, "pin view (--pin default) and the docs' before side");
  for (const f of readdirSync(join(root, PORT))) {
    if (!statSync(join(root, PORT, f)).isDirectory()) add(`${PORT}/${f}`, "port chain file");
  }
  const links = readdirSync(join(root, PORT))
    .filter((d) => STEP_RE.test(d) && existsSync(join(root, PORT, d, "manifest.json")))
    .sort();
  if (!links.length) throw new Error(`${PORT} has no NN-name link`);
  const head = chainHeadName(root);
  add(`${PORT}/${head}`, "chain head (--head default)");
  const latest = links.at(-1);
  add(`${PORT}/${latest}`, "latest link (next step's --baseline)");
  const manifest = JSON.parse(readFileSync(join(root, PORT, latest, "manifest.json"), "utf8"));
  const prev = manifest.gate?.baseline;
  if (prev?.startsWith(`${PORT}/`)) {
    add(prev, `${latest}'s gate.baseline (re-running its published gate)`);
  }
  const latestWpt = join(root, PORT, latest, "wpt");
  for (const f of existsSync(latestWpt) ? readdirSync(latestWpt) : []) {
    const m = /^expectations-(.+\.json)$/.exec(f);
    if (m && existsSync(join(root, BASELINES, "wpt", m[1]))) {
      add(`${BASELINES}/wpt/${m[1]}`, "wpt/run.mjs default expectations of the latest engine");
    }
  }
  const basePtr = join(root, PORT, "DEBT-BASE.json");
  if (existsSync(basePtr)) {
    const ledger = JSON.parse(readFileSync(basePtr, "utf8")).ledger;
    if (ledger?.startsWith(`${SNAPSHOTS}/`))
      add(toPosix(dirname(ledger)), "holds the DEBT-BASE.json ledger");
  }
  const pages = walk(join(root, DOCS_PAGES))
    .map((abs) => toPosix(relative(root, abs)))
    .filter((rel) => rel.endsWith(".md") && !/\/(node_modules|\.vitepress)\//.test(rel))
    .sort();
  for (const rel of [DOCS_MANIFEST, ...pages]) {
    if (!existsSync(join(root, rel))) continue;
    const text = readFileSync(join(root, rel), "utf8");
    for (const m of text.matchAll(/fidelity\/gate\/snapshots\/[A-Za-z0-9._\/-]+/g)) {
      // A citation can end a sentence or name a directory: "…/linux-arm64/." -> "…/linux-arm64".
      const p = m[0].replace(/[./]+$/, "");
      if (existsSync(join(root, p))) add(p, `cited by ${rel}`);
    }
  }
  // A path inside a kept directory is not listed on its own (its reason joins the directory's).
  const paths = Object.keys(why).sort();
  const keep = paths.filter((p) => !paths.some((q) => q !== p && p.startsWith(`${q}/`)));
  for (const p of paths) {
    const parent = keep.find((q) => q !== p && p.startsWith(`${q}/`));
    if (parent && !why[parent].includes(why[p]))
      why[parent] += `; ${p.slice(parent.length + 1)} ${why[p]}`;
  }
  return {
    keep,
    why: Object.fromEntries(keep.map((k) => [k, why[k]])),
    head,
    latest,
    previous: prev ?? null,
  };
}

/** Files under the managed roots the rule deletes (repo-relative, sorted). */
export function pruneList(root) {
  const { keep } = keepSet(root);
  const kept = (rel) => keep.some((k) => rel === k || rel.startsWith(`${k}/`));
  const managed = [BASELINES, SNAPSHOTS, ...DROPPED_ROOTS];
  return managed
    .flatMap((m) => walk(join(root, m)))
    .map((abs) => toPosix(relative(root, abs)))
    .filter((rel) => !kept(rel))
    .sort();
}

function main() {
  const { values: a } = parseArgs({
    options: {
      "keep-latest": { type: "boolean", default: false },
      apply: { type: "boolean", default: false },
      json: { type: "boolean", default: false },
      root: { type: "string" },
    },
  });
  if (!a["keep-latest"]) {
    console.error("usage: prune-evidence.mjs --keep-latest [--apply] [--json] [--root <repo>]");
    process.exit(2);
  }
  const root = resolve(a.root ?? join(dirname(fileURLToPath(import.meta.url)), "..", ".."));
  const ks = keepSet(root);
  const del = pruneList(root);
  if (a.apply) for (const rel of del) rmSync(join(root, rel), { force: true });
  if (a.json) {
    console.log(JSON.stringify({ ...ks, delete: del, applied: a.apply }, null, 2));
    return;
  }
  for (const k of ks.keep) console.log(`keep   ${k}  (${ks.why[k]})`);
  console.log(`${a.apply ? "deleted" : "would delete"} ${del.length} files`);
  if (!a.apply) for (const d of del) console.log(`delete ${d}`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
