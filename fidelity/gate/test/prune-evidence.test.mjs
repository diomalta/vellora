// The keep-latest rule of fidelity/scripts/prune-evidence.mjs on a planted tree (every rule, and
// --apply through the CLI) and, on the real checkout, that the keep set holds every input the
// gate reads by default. The real tree is NOT required to be already pruned: a step that merges a
// new link and its snapshot is pruned afterwards, and a red fidelity test would fail its gated run.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, relative, resolve } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { keepSet, pruneList } from "../../scripts/prune-evidence.mjs";
import { chainHead } from "../debt.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, "..", "..", "..");
const SCRIPT = join(repo, "fidelity", "scripts", "prune-evidence.mjs");

function plant() {
  const root = mkdtempSync(join(tmpdir(), "prune-evidence-"));
  const put = (rel, body = "{}\n") => {
    mkdirSync(dirname(join(root, rel)), { recursive: true });
    writeFileSync(join(root, rel), typeof body === "string" ? body : JSON.stringify(body));
  };
  const B = "fidelity/baselines";
  const S = "fidelity/gate/snapshots";
  put(`${B}/pin/manifest.json`);
  put(`${B}/beta4/manifest.json`);
  put(`${B}/port/README.md`, "- **Chain head** (the `--head` default): `port/00-start`. More.\n");
  put(`${B}/port/DEBT.json`);
  put(`${B}/port/DEBT-BASE.json`, { ledger: `${S}/2026-01-02/c2/DEBT-c2.json` });
  put(`${B}/port/declared-rejections.json`);
  put(`${B}/port/00-start/manifest.json`);
  put(`${B}/port/01-a/manifest.json`, { gate: { baseline: `${B}/port/00-start` } });
  put(`${B}/port/02-b/manifest.json`, { gate: { baseline: `${B}/port/01-a` } });
  put(`${B}/port/02-b/wpt/expectations-eng-1.json`);
  put(`${B}/port/03-c/manifest.json`, { gate: { baseline: `${B}/port/02-b` } });
  put(`${B}/port/03-c/wpt/expectations-eng-2.json`);
  put(`${B}/port/03-c/attachments/r.md`, "r\n");
  put(`${B}/port/04-no-manifest/x.json`);
  put(`${B}/wpt/eng-1.json`);
  put(`${B}/wpt/eng-2.json`);
  put(`${S}/2026-01-01/c1/README.md`, "x\n");
  put(`${S}/2026-01-02/c2/DEBT-c2.json`);
  put(`${S}/2026-01-02/c2/accepted.json`);
  put(`${S}/2026-01-02/c2-docs/cited.json`);
  put(`${S}/2026-01-02/c2-docs/other.json`);
  put(`${S}/2026-01-02/c2-svg/README.md`, "x\n");
  put("fidelity/layout-diff/snapshots/2026-01-01/a.json");
  put("fidelity/combine/snapshots/2026-01-01/a.json");
  put("fidelity/oracles/reports/a.md", "x\n");
  put("fidelity/upstream-drafts/a/README.md", "x\n");
  put("fidelity/gate/compare.mjs", "// tooling, outside the managed roots\n");
  put("docs/assets/fidelity/manifest.json", {
    paint: `<repo>/${S}/2026-01-02/c2-docs/cited.json`,
    accept: `--accept ${S}/2026-01-02/c2/accepted.json --step x`,
  });
  return root;
}

const KEEP = [
  "fidelity/baselines/pin",
  "fidelity/baselines/port/00-start",
  "fidelity/baselines/port/02-b",
  "fidelity/baselines/port/03-c",
  "fidelity/baselines/port/DEBT-BASE.json",
  "fidelity/baselines/port/DEBT.json",
  "fidelity/baselines/port/README.md",
  "fidelity/baselines/port/declared-rejections.json",
  "fidelity/baselines/wpt/eng-2.json",
  "fidelity/gate/snapshots/2026-01-02/c2",
  "fidelity/gate/snapshots/2026-01-02/c2-docs/cited.json",
];
const DELETE = [
  "fidelity/baselines/beta4/manifest.json",
  "fidelity/baselines/port/01-a/manifest.json",
  "fidelity/baselines/port/04-no-manifest/x.json",
  "fidelity/baselines/wpt/eng-1.json",
  "fidelity/combine/snapshots/2026-01-01/a.json",
  "fidelity/gate/snapshots/2026-01-01/c1/README.md",
  "fidelity/gate/snapshots/2026-01-02/c2-docs/other.json",
  "fidelity/gate/snapshots/2026-01-02/c2-svg/README.md",
  "fidelity/layout-diff/snapshots/2026-01-01/a.json",
  "fidelity/oracles/reports/a.md",
  "fidelity/upstream-drafts/a/README.md",
];

test("keep-latest: pin, port files, chain head, latest link and its gate.baseline, its engine's WPT expectations, the DEBT-BASE snapshot, docs-cited snapshot files", () => {
  const root = plant();
  const ks = keepSet(root);
  assert.deepEqual(ks.keep, KEEP);
  assert.equal(ks.head, "00-start");
  assert.equal(ks.latest, "03-c");
  assert.equal(ks.previous, "fidelity/baselines/port/02-b");
  // A path inside a kept directory is folded into it (c2/accepted.json is cited by the docs).
  assert.match(ks.why["fidelity/gate/snapshots/2026-01-02/c2"], /accepted\.json cited by/);
});

test("keep-latest deletes everything else under the managed roots, nothing outside them", () => {
  const root = plant();
  // 02-b is kept as a whole directory (03-c's gate.baseline), its old expectations included.
  assert.deepEqual(pruneList(root), DELETE);
});

test("--apply through the CLI deletes exactly the listed files; a re-run deletes nothing", () => {
  const root = plant();
  const dry = spawnSync(process.execPath, [SCRIPT, "--keep-latest", "--json", "--root", root], {
    encoding: "utf8",
  });
  assert.equal(dry.status, 0, dry.stderr);
  const plan = JSON.parse(dry.stdout);
  assert.equal(plan.applied, false);
  assert.ok(
    plan.delete.every((f) => existsSync(join(root, f))),
    "a dry run deletes nothing",
  );
  const run = spawnSync(
    process.execPath,
    [SCRIPT, "--keep-latest", "--apply", "--json", "--root", root],
    { encoding: "utf8" },
  );
  assert.equal(run.status, 0, run.stderr);
  for (const f of plan.delete) assert.equal(existsSync(join(root, f)), false, f);
  for (const k of KEEP) assert.ok(existsSync(join(root, k)), k);
  assert.ok(existsSync(join(root, "fidelity/gate/compare.mjs")));
  assert.deepEqual(pruneList(root), []);
  // Without --keep-latest the script refuses (the only rule it knows).
  assert.equal(spawnSync(process.execPath, [SCRIPT, "--root", root]).status, 2);
});

test("on this checkout the keep set holds every input the gate reads by default", () => {
  const ks = keepSet(repo);
  const kept = (rel) => ks.keep.some((k) => rel === k || rel.startsWith(`${k}/`));
  // --head (port README chain head), --pin, --debt, rule-iii pointer and its frozen ledger.
  assert.ok(kept(relative(repo, chainHead()).split("\\").join("/")));
  assert.ok(kept("fidelity/baselines/pin"));
  assert.ok(kept("fidelity/baselines/port/DEBT.json"));
  assert.ok(kept("fidelity/baselines/port/declared-rejections.json"));
  const pointer = JSON.parse(
    readFileSync(join(repo, "fidelity/baselines/port/DEBT-BASE.json"), "utf8"),
  );
  assert.ok(kept(pointer.ledger), pointer.ledger);
  // The latest link and the one it was gated against (the published re-gate needs both).
  assert.ok(kept(`fidelity/baselines/port/${ks.latest}`));
  assert.ok(ks.previous && kept(ks.previous), ks.previous);
  // Every snapshot path the published docs manifest cites.
  const docs = readFileSync(join(repo, "docs/assets/fidelity/manifest.json"), "utf8");
  for (const m of docs.matchAll(/fidelity\/gate\/snapshots\/[A-Za-z0-9._/-]+/g)) {
    assert.ok(kept(m[0]), m[0]);
  }
  // wpt/run.mjs's default expectations for the engine of the latest link.
  assert.ok(ks.keep.some((k) => k.startsWith("fidelity/baselines/wpt/")));
});
