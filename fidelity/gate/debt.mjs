#!/usr/bin/env node
// The debt ledger (fidelity/baselines/port/DEBT.json, schema vellora-fidelity/debt/2) and the
// HEAD ratchet's coverage rules (fidelity/ACCEPTANCE.md GATE-H*, GATE-D*). Pure except loadDebt,
// the git helpers and the CLI.
//
// Why. Each port step used to be compared with the previous link only, with a per-step tolerance,
// so sub-tolerance worsening accumulated (D4: 2 notification words +1.11 pt over steps 01 + 04,
// never gated) and compensating drift (two errors cancelling) was accepted as if it were an
// artefact. Now every run is ALSO compared with the chain head (`port/00-start`, named in
// fidelity/baselines/port/README.md): an item worse than the head beyond its tolerance passes
// only as
//   (a) an artefact: an acceptedRegressions entry of the CURRENT step with class "a" (the OLD
//       value is proven wrong), or
//   (b) compensating drift: an entry of this ledger (class "b"), within its ceiling.
// Anything else gates.
//
// Entry (debt/2, 2026-10-22): an entry GROUPS keys that share owner, compensators, closesAt and
// introducedBy; every key carries its own values:
//   { id, class: "b", owner: { layer, component, upstream? }, compensators[], closesAt,
//     introducedBy, evidence[], scope?: { fixture, fromPage },
//     keys: [{ key, tolClass, headValue, ceiling, measured, layerVectorRef }] }
//   key         a gate-report item key the entry covers (a page-scoped entry: the page-count
//               metric key of its fixture; it then also covers that fixture's pdf-probe items on
//               pages >= scope.fromPage and its unpaired-word counts, rule vi)
//   headValue   the value at the head; ceiling: the worst value allowed now (same unit and
//               orientation as the item: |d| for pdf-probe dx/dy, the metric's own value
//               otherwise; a status / WPT outcome / "unpaired" for non-numeric items)
//   measured    the value the gate measured when the key was entered (the head comparison's
//               `after`, signed for pdf-probe dx/dy)
//   layerVectorRef  the key's layer vector (fidelity/gate/layer-vector.mjs): either inline
//               { unit, N0, B0, L0, <each layout_normalize pass>, P, run } or a string
//               "<repo-relative file>#<item key>" naming a committed layer-vector.mjs output
//               (`words[]` record with that `item`, its `<axis>.vector`) or a { vectors: { key:
//               vector } } file (.json or .json.gz). N0 raw Blitz on the source HTML, B0
//               html_normalize, L0 the walk/reader, each pass, P pagination, run = the value the
//               PDF-level oracle measured. Resolved at load into `layerVector`.
//   compensators the vellora layers (B0, L0, pass names, P, run) whose non-zero step the entry
//               relies on; owner: who owns the residual (layer "blitz:*" | "vellora:*" | ...)
//   WPT keys    (`wpt|<test>`, GATE-A3 route b, gate/wpt-route.mjs) have no layer vector: they carry
//               `rawOutcome` (the raw-Blitz render's outcome) instead of layerVectorRef, the
//               entry's owner.layer is "blitz:*", and GATE-D7 requires rawOutcome = measured = the
//               run's outcome = the run's recorded raw outcome
// debt/1 ledgers (one headValue / ceiling / layerVector per entry) are read by migrating each key
// to its own record with the entry's values and measured: null (a new key then fails GATE-D7).
//
// Rules (each with a self-test in gate/test/debt.test.mjs and a canary in gate/canaries.mjs):
//   (i)   every head-gating item matches an entry key, else it gates
//   (ii)  the current value is within the KEY's ceiling, else it gates (debt-exceeded)
//   (iii) across a merge (old ledger -> new ledger; the old ledger defaults to DEBT.json at
//         `git merge-base HEAD main`, resolveLedgerBase, and an undeterminable base REFUSES the
//         gate, I2), per key: the entry count, the key count and the sum of ceilings per tolClass
//         never increase, no key's ceiling goes up, a key is removed only at its entry's closesAt
//         step or with a stated reason when it vanished from the run; the first population (no
//         previous key at all) is exempt from the count and sum rule (DESIGN TARGET)
//   (iv)  an owner.layer "vellora:*" entry names a retirement step in closesAt (NN-name)
//   (v)   a layout_normalize pass listed as a compensator and absent from the run forces the
//         entry to be re-gated (its layer vectors no longer describe the run)
//   (vi)  words displaced to another page collapse into ONE page-scoped entry per page-count
//         criterion: no two entries name the same page-count metric, and no entry lists a
//         per-word key its fixture's page-scoped entry covers
//   (vi') the LISTED page-scope route (rule (i) of Phase B integration 5, 2026-10-27; GATE-D6b): a
//         page-scoped entry with `scope.keys` (the per-word keys it scopes out) may bind a
//         page-count metric that is NOT a head item, i.e. whose run value equals its head value
//         (measured = headValue = the run's value = ceiling >= 1; no layer vector). It covers ONLY
//         the listed keys (on pages >= fromPage of its fixture) and only while the run's value of
//         its metric is >= 1 and <= its ceiling: above the ceiling the words and the metric gate
//         (debt-exceeded); at 0 (pagination matches the reference) the listed keys are compared
//         again (head-regression when still worse than the head). The list never grows (rule iii)
//   new keys (absent from the previous ledger) satisfy the RELAXED (b) rule on their vector:
//         |run| <= |N0| (+ run tolerance), every non-zero vellora layer step is a named
//         compensator, the residual owner is named; and GATE-D7 ties them to the run (I3):
//         measured = the head comparison's value of the key, ceiling <= |measured| + the
//         metric's resolution (no tolerance slack), |layerVector.run| in the gate's unit =
//         measured within the resolution
//
//   node fidelity/gate/debt.mjs check [--ledger <DEBT.json>] [--base <previous DEBT.json>]
//     [--step <NN-name>] [--report <gate-report.json>]   validate a ledger (and its transition
//     from --base; --report gives the head items GATE-D7 ties new keys to; [--head-dir <baseline>]
//     [--run <run dir>] give the page metrics a listed page scope binds, rule vi'); exit 0 ok, 3 not
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { gunzipSync } from "node:zlib";
import {
  STATUS_RANK,
  TOLERANCES,
  convertUnit,
  layerStepTolerance,
  vectorRunTolerance,
} from "./tolerances.mjs";

export const DEBT_SCHEMA = "vellora-fidelity/debt/2";
export const DEBT_SCHEMA_V1 = "vellora-fidelity/debt/1";
const here = dirname(fileURLToPath(import.meta.url));
export const BASELINES_DIR = resolve(here, "..", "baselines");
export const DEBT_FILE = join(BASELINES_DIR, "port", "DEBT.json");
export const PORT_README = join(BASELINES_DIR, "port", "README.md");
const REPO_ROOT = resolve(here, "..", "..");

/** Layers of a vector that are not vellora's (raw Blitz). */
const RAW_LAYERS = new Set(["N0", "unit"]);
/** Non-pass vellora layers (always present in a run): html_normalize, walk/reader, pagination, PDF. */
const FIXED_VELLORA_LAYERS = new Set(["B0", "L0", "P", "run"]);
const STEP_RE = /^\d{2}-[a-z0-9][a-z0-9-]*$/;
const EPS = 1e-6;

/**
 * The chain head named in fidelity/baselines/port/README.md ("**Chain head** ...: `port/00-start`"),
 * as a directory under fidelity/baselines. The default of --head.
 */
export function chainHead(readme = PORT_README) {
  const text = readFileSync(readme, "utf8");
  // "- **Chain head** (...): `port/00-start`." The value is the first code span after "):".
  const m = /\*\*Chain head\*\*[^)]*\):\s*`([^`]+)`/.exec(text);
  if (!m) throw new Error(`${readme} names no "**Chain head**" (the --head default)`);
  return join(BASELINES_DIR, ...m[1].split("/"));
}

export function emptyLedger() {
  return { schema: DEBT_SCHEMA, entries: [], closed: [] };
}

export function loadDebt(file = DEBT_FILE, { root = REPO_ROOT } = {}) {
  if (!file || !existsSync(file)) return null;
  return parseDebt(readFileSync(file, "utf8"), file, { root });
}

const readJsonFile = (path) =>
  JSON.parse(
    path.endsWith(".gz")
      ? gunzipSync(readFileSync(path)).toString("utf8")
      : readFileSync(path, "utf8"),
  );

/**
 * The vector a layerVectorRef names: an inline vector object, or "<file>#<item key>" (file
 * relative to `root`): a layer-vector.mjs output (`words[]` with `item` = key: its `<axis>`
 * vector) or a { vectors: { <key>: vector } } file. Returns { vector } or { error }.
 */
export function resolveVectorRef(ref, { root = REPO_ROOT, cache = new Map() } = {}) {
  if (ref && typeof ref === "object") return { vector: ref };
  if (typeof ref !== "string" || !ref.includes("#")) {
    return {
      error: `layerVectorRef ${JSON.stringify(ref)} is neither a vector nor "<file>#<key>"`,
    };
  }
  const at = ref.indexOf("#");
  const file = resolve(root, ref.slice(0, at));
  const key = ref.slice(at + 1);
  if (!existsSync(file)) return { error: `layerVectorRef file ${ref.slice(0, at)} does not exist` };
  if (!cache.has(file)) cache.set(file, readJsonFile(file));
  const doc = cache.get(file);
  const fromMap = doc.vectors?.[key];
  if (fromMap) return { vector: fromMap };
  const w = (doc.words ?? []).find((x) => x.item === key);
  const v = w?.[w.axis]?.vector;
  if (v) return { vector: v };
  return { error: `layerVectorRef ${ref}: no vector for ${key} in that file` };
}

/** A debt/1 entry as a debt/2 entry: one key record per key, measured unknown. */
export function migrateEntryV1(e) {
  const { headValue, ceiling, tolClass, layerVector, keys, ...rest } = e;
  return {
    ...rest,
    keys: (keys ?? []).map((key) => ({
      key,
      tolClass,
      headValue,
      ceiling,
      measured: null,
      layerVectorRef: layerVector ?? null,
    })),
  };
}

/** A ledger document from its JSON text (`where` names it in errors). */
export function parseDebt(text, where = "DEBT.json", { root = REPO_ROOT } = {}) {
  const doc = JSON.parse(text);
  if (doc.schema !== DEBT_SCHEMA && doc.schema !== DEBT_SCHEMA_V1) {
    throw new Error(`${where}: schema ${doc.schema} (expected ${DEBT_SCHEMA})`);
  }
  const cache = new Map();
  const entries = (doc.entries ?? [])
    .map((e) => (doc.schema === DEBT_SCHEMA_V1 ? migrateEntryV1(e) : e))
    .map((e) => resolveEntryVectors(e, { root, cache }));
  return {
    ...doc,
    ...(doc.schema === DEBT_SCHEMA_V1 ? { migratedFrom: DEBT_SCHEMA_V1, schema: DEBT_SCHEMA } : {}),
    entries,
    closed: doc.closed ?? [],
  };
}

/** Resolve every key's layerVectorRef into `layerVector` (or `layerVectorError`). */
export function resolveEntryVectors(e, opts = {}) {
  if (!Array.isArray(e.keys)) return e;
  return {
    ...e,
    keys: e.keys.map((k) => {
      if (!k || typeof k !== "object" || k.layerVectorRef === undefined) return k;
      if (k.layerVectorRef === null && isPageScopeKey(e, k)) return k;
      const r = resolveVectorRef(k.layerVectorRef, opts);
      return r.vector ? { ...k, layerVector: r.vector } : { ...k, layerVectorError: r.error };
    }),
  };
}

/** The ledger's path inside the repository (what `git show <rev>:<path>` reads). */
export const DEBT_REPO_PATH = "fidelity/baselines/port/DEBT.json";

/** `git <args>` in the repository: { status, stdout, stderr } (injectable for the self-tests). */
export function runGit(args, cwd = REPO_ROOT) {
  const r = spawnSync("git", args, { cwd, encoding: "utf8" });
  return {
    status: r.error ? -1 : r.status,
    stdout: r.stdout ?? "",
    stderr: r.error ? r.error.message : (r.stderr ?? ""),
  };
}

/**
 * The ledger rule iii compares against (I2, 2026-10-22): `debtBase` when given (a file that does
 * not exist is the ledger's first population), else DEBT.json at `git merge-base HEAD <ref>`
 * (absent there = first population). Rule iii used to run only with an explicit --debt-base, so
 * a raised ceiling passed silently. Returns { ledger (null = first population), source, refusal }:
 * a non-null refusal means the base cannot be determined and a gated run is REFUSED.
 */
export function resolveLedgerBase({ debtBase = undefined, git = runGit, ref = "main" } = {}) {
  if (debtBase !== undefined && debtBase !== null) {
    return { ledger: loadDebt(debtBase), source: `--debt-base ${debtBase}`, refusal: null };
  }
  const mb = git(["merge-base", "HEAD", ref]);
  const sha = String(mb.stdout ?? "").trim();
  if (mb.status !== 0 || !/^[0-9a-f]{7,64}$/.test(sha)) {
    return {
      ledger: undefined,
      source: null,
      refusal: `the ledger base (DEBT rule iii) cannot be determined: git merge-base HEAD ${ref} failed (${
        String(mb.stderr ?? "")
          .trim()
          .slice(0, 200) || `exit ${mb.status}`
      }); pass --debt-base <DEBT.json at the merge base> (a missing file = first population)`,
    };
  }
  const has = git(["cat-file", "-e", `${sha}:${DEBT_REPO_PATH}`]);
  if (has.status !== 0) {
    return {
      ledger: null,
      source: `${DEBT_REPO_PATH} absent at merge-base ${sha.slice(0, 12)} (HEAD, ${ref}): first population`,
      refusal: null,
    };
  }
  const show = git(["show", `${sha}:${DEBT_REPO_PATH}`]);
  if (show.status !== 0) {
    return {
      ledger: undefined,
      source: null,
      refusal: `the ledger base cannot be read: git show ${sha.slice(0, 12)}:${DEBT_REPO_PATH} exit ${show.status}`,
    };
  }
  return {
    ledger: parseDebt(show.stdout, `${sha.slice(0, 12)}:${DEBT_REPO_PATH}`),
    source: `${DEBT_REPO_PATH} at merge-base ${sha.slice(0, 12)} (HEAD, ${ref})`,
    refusal: null,
  };
}

const isPassLayer = (name) => !RAW_LAYERS.has(name) && !FIXED_VELLORA_LAYERS.has(name);
const pdfProbeFixture = (key) => (key.startsWith("pdf-probe|") ? key.split("|")[1] : null);
/** Chrome page of a pdf-probe word key `pdf-probe|<fx>|p<N>|<text>#<n>|<axis>`, or null. */
export function pdfProbePage(key) {
  const m = /^pdf-probe\|[^|]+\|p(\d+)\|/.exec(key);
  return m ? Number(m[1]) : null;
}
const isPerWordKey = (key) => pdfProbePage(key) !== null;
/** A WPT key carrying raw-Blitz evidence instead of a layer vector (GATE-A3 route b). */
const isWptRawKey = (rec) => String(rec?.key ?? "").startsWith("wpt|");
/** An entry of the LISTED page-scope route (rule vi', GATE-D6b): a scope with a per-word key list. */
export const isListedPageScope = (e) => Boolean(e?.scope) && Array.isArray(e.scope.keys);
/** The page-count key of a listed page-scope entry: no layer vector (rule vi', GATE-D6b). */
const isPageScopeKey = (e, rec) => isListedPageScope(e) && rec?.tolClass === "page-delta";
/** Key records of an entry (debt/2); [] for a malformed one. */
const keyRecs = (e) =>
  Array.isArray(e?.keys) ? e.keys.filter((k) => k && typeof k === "object") : [];
/** Item keys of an entry. */
export const entryKeys = (e) => keyRecs(e).map((k) => k.key);

/** Vellora layer steps of a vector: [{ layer, step }] in vector order (N0 is raw Blitz). */
export function vectorSteps(vector) {
  const names = Object.keys(vector).filter((k) => k !== "unit");
  const out = [];
  let prev = null;
  for (const name of names) {
    const v = vector[name];
    if (typeof v !== "number") continue;
    if (prev !== null) out.push({ layer: name, step: v - prev });
    prev = v;
  }
  return out;
}

/** RELAXED (b) rule of one key of an entry. Returns problems (strings). */
function relaxedBKey(entry, rec) {
  const p = [];
  const id = `${entry.id} ${rec.key}`;
  if (isWptRawKey(rec)) {
    // GATE-A3 (b): raw Blitz fails the same way; the residual is upstream's.
    if (typeof rec.rawOutcome !== "string") {
      p.push(`${id}: a WPT key needs rawOutcome (the raw-Blitz render's outcome, GATE-A3)`);
    }
    if (!String(entry.owner?.layer ?? "").startsWith("blitz:")) {
      p.push(
        `${id}: a WPT key's residual is upstream's: owner.layer must be "blitz:*" (GATE-A3), not ${entry.owner?.layer}`,
      );
    }
    return p;
  }
  if (isPageScopeKey(entry, rec)) {
    // Rule vi' (GATE-D6b): the page-count metric has no layer vector; its evidence is that it is
    // unchanged vs the head, which GATE-D7 checks (pageScopeD7Problems).
    return p;
  }
  const v = rec.layerVector;
  if (!v || typeof v.N0 !== "number" || typeof v.run !== "number") {
    return [
      `${id}: layerVector needs numeric N0 and run (fidelity/gate/layer-vector.mjs)${rec.layerVectorError ? `: ${rec.layerVectorError}` : ""}`,
    ];
  }
  if (!v.unit) p.push(`${id}: layerVector.unit missing`);
  const tol = layerStepTolerance(v.unit);
  const runTol = vectorRunTolerance(rec.tolClass, v.unit);
  if (Math.abs(v.run) > Math.abs(v.N0) + runTol) {
    p.push(
      `${id}: |run| ${Math.abs(v.run)} > |N0| ${Math.abs(v.N0)}: vellora made the item worse than raw Blitz, not compensating drift`,
    );
  }
  // Rule (ii), 2026-10-27: the run tolerance covers only Chrome's DOM-vs-PDF offset (the P -> run
  // reference change). vellora's layout layers end at P, measured against the SAME reference as
  // N0 (Chrome's DOM), so |P| may exceed |N0| by the step tolerance only.
  if (typeof v.P === "number" && Math.abs(v.P) > Math.abs(v.N0) + tol + EPS) {
    p.push(
      `${id}: |P| ${Math.abs(v.P)} > |N0| ${Math.abs(v.N0)} + ${tol}: vellora's layout made the item worse than raw Blitz (the run tolerance covers only Chrome's DOM-vs-PDF offset), not compensating drift`,
    );
  }
  const named = new Set(entry.compensators ?? []);
  for (const { layer, step } of vectorSteps(v)) {
    if (Math.abs(step) > (layer === "run" ? runTol : tol) && !named.has(layer)) {
      p.push(
        `${id}: vellora layer ${layer} moves the item by ${Math.round(step * 1000) / 1000} ${v.unit} and is not a named compensator`,
      );
    }
  }
  return p;
}

/**
 * RELAXED (b) rule for an entry (new keys must satisfy it): per key on its vector, plus the
 * residual owner once. `only`: restrict to these key strings (the new keys of an entry).
 */
export function relaxedB(entry, { only = null } = {}) {
  const p = [];
  for (const rec of keyRecs(entry)) {
    if (only && !only.has(rec.key)) continue;
    p.push(...relaxedBKey(entry, rec));
  }
  if (!entry.owner?.layer || !entry.owner?.component) {
    p.push(`${entry.id}: the residual owner (owner.layer, owner.component) is not named`);
  }
  return p;
}

const numeric = (v) => typeof v === "number" && Number.isFinite(v);

/**
 * GATE-D7 for a NEW key (I3, 2026-10-22): the key's values are tied to the run. `item` is the head
 * comparison's item of the key (null: no head comparison or no such item). Returns problems.
 *   measured   = item.after (within the metric's resolution; strings equal)
 *   ceiling    <= |measured| + resolution (lower-abs), measured + resolution (lower),
 *              >= measured - resolution (higher), = measured (non-numeric): no tolerance slack
 *   vector     run converted from the vector's unit to the gate's = measured within resolution
 */
export function d7KeyProblems(entry, rec, item) {
  const id = `${entry.id} ${rec.key}`;
  const t = TOLERANCES[rec.tolClass];
  if (!t) return [`${id}: unknown tolClass ${rec.tolClass} (GATE-D7)`];
  const res = t.resolution ?? 0;
  if (!item) {
    return [
      `${id}: a new key must be an item of the head comparison it covers (GATE-D7: measured is tied to the run); none found`,
    ];
  }
  const p = [];
  const m = rec.measured;
  if (isWptRawKey(rec)) {
    // GATE-A3 (b): measured = the run's outcome = the run's raw-Blitz outcome = rawOutcome.
    if (String(m) !== String(item.after)) {
      p.push(`${id}: measured ${m} is not the run's outcome ${item.after} (GATE-D7)`);
    }
    if (rec.rawOutcome !== item.rawOutcome || rec.rawOutcome !== item.after) {
      p.push(
        `${id}: rawOutcome ${rec.rawOutcome} must be the run's raw-Blitz outcome ${item.rawOutcome ?? "(not recorded)"} and its outcome ${item.after} (GATE-D7, GATE-A3)`,
      );
    }
    if (String(rec.ceiling) !== String(m)) {
      p.push(`${id}: ceiling ${rec.ceiling} is not the measured value ${m} (GATE-D7)`);
    }
    return p;
  }
  if (numeric(m) && numeric(item.after)) {
    if (Math.abs(m - item.after) > res + EPS) {
      p.push(
        `${id}: measured ${m} is not the run's value ${item.after} (resolution ${res} ${t.unit}, GATE-D7)`,
      );
    }
  } else if (String(m) !== String(item.after)) {
    p.push(`${id}: measured ${m} is not the run's value ${item.after} (GATE-D7)`);
  }
  const c = rec.ceiling;
  if (numeric(m) && numeric(c)) {
    const better = item.better ?? "lower";
    const bad =
      better === "higher"
        ? c < m - res - EPS
        : c > (better === "lower-abs" ? Math.abs(m) : m) + res + EPS;
    if (bad) {
      p.push(
        `${id}: ceiling ${c} is not the measured value ${m} (+ resolution ${res} ${t.unit}; no tolerance slack, GATE-D7)`,
      );
    }
    const v = rec.layerVector;
    if (v && numeric(v.run)) {
      const run = convertUnit(v.run, v.unit ?? "px", t.unit);
      if (run === null) {
        p.push(
          `${id}: layerVector unit ${v.unit} cannot be expressed in the gate's unit ${t.unit} (GATE-D7)`,
        );
      } else if (Math.abs(run - m) > res + EPS) {
        p.push(
          `${id}: layerVector.run ${v.run} ${v.unit} = ${Math.round(run * 1000) / 1000} ${t.unit} is not the measured ${m} (resolution ${res}, GATE-D7)`,
        );
      }
    }
  } else if (String(c) !== String(m)) {
    p.push(`${id}: ceiling ${c} is not the measured value ${m} (GATE-D7)`);
  }
  return p;
}

/**
 * GATE-D7 for the NEW page-count key of a listed page scope (rule vi', GATE-D6b; rule (i) of Phase
 * B integration 5, 2026-10-27) whose metric is NOT a head item (unchanged vs the head): the key is
 * tied to the run by the snapshots instead. `headValues` / `runValues`: Map(page-delta metric key
 * -> value) of the head and of the run. measured = headValue = the head's value = the run's value,
 * ceiling = measured (the current page delta, no slack), measured >= 1, and every listed per-word
 * key is a gating item of the head comparison (`headItems`). Returns problems.
 */
export function pageScopeD7Problems(
  entry,
  rec,
  { headValues = null, runValues = null, headItems = null } = {},
) {
  const id = `${entry.id} ${rec.key}`;
  const p = [];
  const h = headValues?.get(rec.key);
  const r = runValues?.get(rec.key);
  if (!numeric(h) || !numeric(r)) {
    return [
      `${id}: the head's and the run's values of the page-count metric are needed (rule vi', GATE-D7); head ${h ?? "unknown"}, run ${r ?? "unknown"}`,
    ];
  }
  if (h !== r)
    p.push(
      `${id}: head ${h} != run ${r}: only an unchanged page metric binds without a head item (rule vi')`,
    );
  if (rec.headValue !== h)
    p.push(`${id}: headValue ${rec.headValue} is not the head's value ${h} (GATE-D7)`);
  if (rec.measured !== r)
    p.push(`${id}: measured ${rec.measured} is not the run's value ${r} (GATE-D7)`);
  if (rec.ceiling !== r)
    p.push(`${id}: ceiling ${rec.ceiling} is not the run's page delta ${r} (GATE-D7, rule vi')`);
  if (!(r >= 1)) p.push(`${id}: page delta ${r}: nothing to scope out (rule vi')`);
  for (const k of entry.scope?.keys ?? []) {
    const item = headItems?.get(k);
    if (!item || !HEAD_GATING_CLASSES.includes(item.headClass ?? item.class)) {
      p.push(
        `${id}: scope.keys ${k} is not a gating item of the head comparison (GATE-D7, rule vi')`,
      );
    }
  }
  return p;
}

/** Shape rules every entry obeys (and rule iv). */
export function entryProblems(e) {
  const p = [];
  const id = e.id ?? "(no id)";
  if (!e.id) p.push("entry without id");
  if (!Array.isArray(e.keys) || !e.keys.length) p.push(`${id}: keys[] empty`);
  for (const k of e.keys ?? []) {
    if (!k || typeof k !== "object" || typeof k.key !== "string") {
      p.push(
        `${id}: every key is a record { key, tolClass, headValue, ceiling, measured, layerVectorRef } (debt/2): ${JSON.stringify(k)}`,
      );
      continue;
    }
    if (!k.tolClass || !TOLERANCES[k.tolClass]) {
      p.push(`${id} ${k.key}: unknown tolClass ${k.tolClass}`);
    }
    const evidence = k.key.startsWith("wpt|") ? "rawOutcome" : "layerVectorRef";
    for (const f of ["headValue", "ceiling", "measured", evidence]) {
      if (k[f] === undefined) p.push(`${id} ${k.key}: ${f} is required`);
    }
    if (k.layerVectorError) p.push(`${id} ${k.key}: ${k.layerVectorError}`);
  }
  if (e.class !== "b") p.push(`${id}: class must be "b" (artefacts are acceptedRegressions)`);
  if (!e.introducedBy) p.push(`${id}: introducedBy missing`);
  if (!Array.isArray(e.evidence) || !e.evidence.length) p.push(`${id}: evidence[] empty`);
  if (!Array.isArray(e.compensators)) p.push(`${id}: compensators[] missing`);
  if (String(e.owner?.layer ?? "").startsWith("vellora:") && !STEP_RE.test(e.closesAt ?? "")) {
    p.push(
      `${id}: owner ${e.owner.layer} is vellora's: closesAt must name a retirement step (NN-name)`,
    );
  }
  if (e.scope && !(e.scope.fixture && Number.isInteger(e.scope.fromPage))) {
    p.push(`${id}: scope needs fixture and an integer fromPage`);
  }
  return p;
}

/** Whole-ledger rules: shape, unique ids and keys, (vi) one page-scoped entry per criterion. */
export function ledgerProblems(ledger, { pageMetricKeys = null } = {}) {
  const p = [];
  const ids = new Set();
  const keyOwner = new Map();
  for (const e of ledger.entries) {
    p.push(...entryProblems(e));
    if (ids.has(e.id)) p.push(`${e.id}: duplicate id`);
    ids.add(e.id);
    for (const k of entryKeys(e)) {
      if (keyOwner.has(k) && keyOwner.get(k) !== e.id) {
        p.push(`${e.id}: key ${k} already in ${keyOwner.get(k)} (one entry per key)`);
      } else if (keyOwner.has(k)) p.push(`${e.id}: key ${k} listed twice`);
      keyOwner.set(k, e.id);
    }
  }
  const scoped = ledger.entries.filter((e) => e.scope);
  const byCriterion = new Map();
  for (const e of scoped) {
    for (const k of entryKeys(e)) {
      if (pageMetricKeys && !pageMetricKeys.has(k)) {
        p.push(`${e.id}: page-scoped entry key ${k} is not a page-count (page-delta) metric`);
      }
      if (byCriterion.has(k)) {
        p.push(
          `${e.id}: page-count criterion ${k} already collapsed into ${byCriterion.get(k)} (rule vi)`,
        );
      } else byCriterion.set(k, e.id);
    }
  }
  for (const e of ledger.entries) {
    for (const k of entryKeys(e)) {
      if (!isPerWordKey(k)) continue;
      const s = scoped.find(
        (x) =>
          x !== e && x.scope.fixture === pdfProbeFixture(k) && pdfProbePage(k) >= x.scope.fromPage,
      );
      if (s)
        p.push(
          `${e.id}: ${k} is a word displaced to another page: collapsed into ${s.id} (rule vi)`,
        );
    }
  }
  // Rule vi' (GATE-D6b): a listed page scope binds exactly one page-count key and lists per-word
  // keys of its own fixture on pages >= fromPage, each once.
  for (const e of scoped.filter(isListedPageScope)) {
    const recs = keyRecs(e);
    if (recs.length !== 1 || recs[0].tolClass !== "page-delta") {
      p.push(`${e.id}: a listed page scope binds exactly one page-delta key (rule vi')`);
    }
    if (!e.scope.keys.length) p.push(`${e.id}: scope.keys is empty (rule vi')`);
    const seen = new Set();
    for (const k of e.scope.keys) {
      if (
        typeof k !== "string" ||
        !isPerWordKey(k) ||
        pdfProbeFixture(k) !== e.scope.fixture ||
        pdfProbePage(k) < e.scope.fromPage
      ) {
        p.push(
          `${e.id}: scope.keys ${JSON.stringify(k)} is not a per-word key of ${e.scope.fixture} on a page >= ${e.scope.fromPage} (rule vi')`,
        );
      }
      if (seen.has(k)) p.push(`${e.id}: scope.keys lists ${k} twice (rule vi')`);
      seen.add(k);
    }
  }
  return p;
}

/** Is the item's current value within the ceiling (rule ii)? */
export function withinCeiling(item, ceiling) {
  const v = item.after;
  if (numeric(ceiling) && numeric(v)) {
    if (item.better === "higher") return v >= ceiling - EPS;
    const mag = item.better === "lower-abs" ? Math.abs(v) : v;
    return mag <= ceiling + EPS;
  }
  if (typeof ceiling === "string" && STATUS_RANK[ceiling] && STATUS_RANK[v]) {
    return STATUS_RANK[v] >= STATUS_RANK[ceiling];
  }
  if (item.check === "wpt") return v === "pass" || v === ceiling;
  return String(v) === String(ceiling);
}

/** Does a page-scoped entry cover this item (rule vi)? */
function scopeCovers(e, item) {
  if (!e.scope) return false;
  const fx = pdfProbeFixture(item.key);
  if (fx !== e.scope.fixture) return false;
  const page = pdfProbePage(item.key);
  // Rule vi' (GATE-D6b): a listed scope covers exactly its listed keys.
  if (isListedPageScope(e))
    return page !== null && page >= e.scope.fromPage && e.scope.keys.includes(item.key);
  if (page !== null) return page >= e.scope.fromPage;
  return /\|unpaired-(chrome|vellora)$/.test(item.key);
}

export const HEAD_GATING_CLASSES = Object.freeze(["regression", "removed", "rejection"]);

/**
 * Apply the ledger to a HEAD comparison (compareSnapshots(head, run, ...)). Returns
 * { items, problems, unused } where items are the head comparison's gating items reclassified:
 *   head-regression  no entry key covers it (rule i)        GATES
 *   debt             covered, within its key's ceiling     does not gate (counted)
 *   debt-exceeded    covered, beyond its key's ceiling (rule ii)   GATES
 *   debt-regate      covered, but a compensator pass is gone from the run (rule v)   GATES
 * `passes`: the run's layout_normalize pass names (null = unknown: rule v cannot be checked,
 * reported as a problem when an entry names a pass compensator). `pageValues`: Map(page-delta
 * metric key -> the RUN's value), what a listed page scope (rule vi') binds when its metric is not
 * a head item (unchanged vs the head); unknown = the scope covers nothing and is a problem.
 */
export function applyLedger(headReport, ledger, { passes = null, pageValues = null } = {}) {
  const entries = ledger?.entries ?? [];
  const problems = [];
  const missingPass = new Map();
  for (const e of entries) {
    const gone = (e.compensators ?? []).filter(
      (c) => isPassLayer(c) && passes && !passes.includes(c),
    );
    if (gone.length) missingPass.set(e.id, gone);
    if (!passes && (e.compensators ?? []).some(isPassLayer)) {
      problems.push(
        `${e.id}: compensator pass(es) ${e.compensators.filter(isPassLayer).join(", ")} cannot be checked: the run records no layout_normalize pass list (rule v)`,
      );
    }
  }
  const byKey = new Map(headReport.items.map((i) => [i.key, i]));
  const recOf = new Map();
  for (const e of entries) for (const k of keyRecs(e)) recOf.set(k.key, { e, rec: k });
  const used = new Set();
  const scopeUnknown = new Set();
  const items = [];
  for (const i of headReport.items) {
    if (!i.gating || !HEAD_GATING_CLASSES.includes(i.class)) continue;
    let hit = recOf.get(i.key);
    let listedBound = null;
    if (!hit) {
      const e = entries.find((x) => scopeCovers(x, i));
      // A page-scoped entry's ceiling binds its page-count metric; the words it covers ride on it.
      if (e) hit = { e, rec: keyRecs(e)[0], scoped: true };
      if (e && isListedPageScope(e)) {
        // Rule vi': the run's value of the bound metric, from the head item when it moved, else
        // from the run (unchanged vs the head). Unknown or 0: the scope covers nothing.
        const k = keyRecs(e)[0]?.key;
        const after = byKey.get(k)?.after ?? pageValues?.get(k);
        if (typeof after !== "number") {
          scopeUnknown.add(
            `${e.id}: the run's value of ${k} is unknown: the listed page scope covers nothing (rule vi')`,
          );
          hit = null;
        } else if (!(after >= 1)) {
          hit = null; // pagination now matches the reference: compare the listed keys again
        } else {
          listedBound = { key: k, after, better: "lower" };
        }
      }
    }
    const base = { ...i, headClass: i.class };
    if (!hit) {
      items.push({
        ...base,
        class: "head-regression",
        gating: true,
        detail: `worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): ${i.detail}`,
      });
      continue;
    }
    const { e, rec } = hit;
    used.add(e.id);
    if (missingPass.has(e.id)) {
      items.push({
        ...base,
        class: "debt-regate",
        gating: true,
        debt: e.id,
        detail: `${e.id} names compensator pass(es) ${missingPass.get(e.id).join(", ")} the run no longer has: re-measure its layer vectors and re-gate (rule v)`,
      });
      continue;
    }
    const bound = hit.scoped ? (listedBound ?? byKey.get(rec?.key)) : i;
    const ok = bound && rec ? withinCeiling(bound, rec.ceiling) : true;
    items.push({
      ...base,
      class: ok ? "debt" : "debt-exceeded",
      gating: !ok,
      debt: e.id,
      detail: ok
        ? `${e.id} (class b, owner ${e.owner?.layer}, closes at ${e.closesAt ?? "-"}): ${i.detail}`
        : `${e.id}: ${rec.key} value ${bound.after} beyond its ceiling ${rec.ceiling} (rule ii)`,
    });
  }
  // Rule ii for covered keys that improved past the head or stayed inside tolerance: nothing to
  // gate. Entries no item used are stale (reported, not gating: rule iii decides their removal).
  const unused = entries.filter((e) => !used.has(e.id)).map((e) => e.id);
  problems.push(...scopeUnknown);
  return { items, problems, unused };
}

const ceilingSums = (entries) => {
  const out = {};
  for (const e of entries) {
    for (const k of keyRecs(e)) {
      if (numeric(k.ceiling)) out[k.tolClass] = (out[k.tolClass] ?? 0) + k.ceiling;
    }
  }
  return out;
};
const keyMap = (entries) => {
  const out = new Map();
  for (const e of entries) for (const k of keyRecs(e)) out.set(k.key, { e, rec: k });
  return out;
};

/**
 * Rule (iii), the relaxed (b) rule and GATE-D7 across a merge, per key. `presentKeys`: item keys
 * the run still produces (null = unknown: a removal by "key vanished" cannot be verified and is a
 * problem). `headItems`: Map(item key -> head comparison item), what a new key's measured value
 * is tied to (null = no head comparison: every new key is a problem).
 */
export function transitionProblems(
  oldLedger,
  newLedger,
  {
    step = null,
    presentKeys = null,
    headItems = null,
    headPageValues = null,
    runPageValues = null,
  } = {},
) {
  const p = [];
  const before = oldLedger?.entries ?? [];
  const after = newLedger?.entries ?? [];
  const oldKeys = keyMap(before);
  const newKeys = keyMap(after);
  const bootstrap = oldKeys.size === 0 && !(oldLedger?.closed ?? []).length;
  if (!bootstrap) {
    if (after.length > before.length) {
      p.push(
        `entry count ${before.length} -> ${after.length}: the ledger may only shrink (rule iii)`,
      );
    }
    if (newKeys.size > oldKeys.size) {
      p.push(`key count ${oldKeys.size} -> ${newKeys.size}: the ledger may only shrink (rule iii)`);
    }
    const sb = ceilingSums(before);
    const sa = ceilingSums(after);
    for (const [cls, v] of Object.entries(sa)) {
      if (v > (sb[cls] ?? 0) + EPS) {
        p.push(`sum of ${cls} ceilings ${sb[cls] ?? 0} -> ${v}: may not increase (rule iii)`);
      }
    }
  }
  const fresh = new Map();
  for (const [key, { e, rec }] of newKeys) {
    const o = oldKeys.get(key);
    if (!o) {
      if (!fresh.has(e.id)) fresh.set(e.id, { e, keys: new Set() });
      fresh.get(e.id).keys.add(key);
      const hi = headItems?.get(key) ?? null;
      const d7 =
        isPageScopeKey(e, rec) && !hi
          ? pageScopeD7Problems(e, rec, {
              headValues: headPageValues,
              runValues: runPageValues,
              headItems,
            })
          : d7KeyProblems(e, rec, hi);
      p.push(...d7.map((x) => `new key ${x}`));
      continue;
    }
    if (isListedPageScope(e)) {
      // Rule iii for rule vi': the listed keys of a page scope never grow.
      const was = new Set(isListedPageScope(o.e) ? o.e.scope.keys : []);
      const grown = e.scope.keys.filter((k) => !was.has(k));
      if (grown.length) {
        p.push(
          `${e.id} ${key}: scope.keys grew by ${grown.length} (${grown.slice(0, 3).join(", ")}${grown.length > 3 ? ", ..." : ""}): a listed page scope may only shrink (rule iii, rule vi')`,
        );
      }
    }
    if (numeric(o.rec.ceiling) && numeric(rec.ceiling) && rec.ceiling > o.rec.ceiling + EPS) {
      p.push(
        `${e.id} ${key}: ceiling ${o.rec.ceiling} -> ${rec.ceiling}: ceilings only go down (rule iii)`,
      );
    }
  }
  for (const { e, keys } of fresh.values()) {
    p.push(...relaxedB(e, { only: keys }).map((x) => `new key ${x} (relaxed (b) rule)`));
  }
  const closedNow = newLedger?.closed ?? [];
  for (const [key, { e: o }] of oldKeys) {
    if (newKeys.has(key)) continue;
    if (step && o.closesAt === step) continue;
    const c =
      closedNow.find((x) => x.key === key) ?? closedNow.find((x) => x.id === o.id && !x.key);
    if (!c?.reason) {
      p.push(
        `${o.id} ${key} removed before its closesAt (${o.closesAt ?? "-"}) without a stated reason in closed[] (rule iii)`,
      );
      continue;
    }
    if (c.keyVanished) {
      if (!presentKeys) {
        p.push(
          `${o.id} ${key}: removal because the key vanished cannot be verified without the run's keys`,
        );
      } else if (presentKeys.has(key)) {
        p.push(`${o.id}: ${key} removed as "key vanished" but the run still has it`);
      }
    } else {
      p.push(
        `${o.id} ${key}: removed before its closesAt (${o.closesAt ?? "-"}): only a vanished key is a stated reason (rule iii)`,
      );
    }
  }
  return p;
}

/** Pin view class of a pin-comparison item: (a) accepted artefact, (b) ledger, (c) otherwise. */
export function pinView(pinReport, ledger, { pageValues = null } = {}) {
  const applied = applyLedger(pinReport, ledger, { passes: null, pageValues });
  const items = [];
  for (const i of pinReport.items) {
    if (i.class === "accepted") items.push({ ...i, pinClass: "a" });
    if (i.class === "declared") items.push({ ...i, pinClass: "declared" });
  }
  for (const i of applied.items) {
    const b = i.class === "debt";
    items.push({ ...i, class: b ? "debt" : "pin-regression", pinClass: b ? "b" : "c" });
  }
  const counts = { a: 0, b: 0, c: 0, declared: 0 };
  for (const i of items) counts[i.pinClass]++;
  return {
    counts,
    mainMerge: counts.c ? "BLOCKED" : "OK",
    items,
    refusals: pinReport.refusals,
  };
}

async function main() {
  const argv = process.argv.slice(2);
  const val = (n) => (argv.indexOf(n) >= 0 ? argv[argv.indexOf(n) + 1] : undefined);
  if (argv[0] !== "check") {
    process.stdout.write(
      "usage: node fidelity/gate/debt.mjs check [--ledger <DEBT.json>] [--base <previous DEBT.json>] [--step <NN-name>] [--report <gate-report.json>] [--head-dir <baseline dir>] [--run <run dir>]\n",
    );
    process.exitCode = 2;
    return;
  }
  const ledger = loadDebt(resolve(val("--ledger") ?? DEBT_FILE)) ?? emptyLedger();
  const problems = ledgerProblems(ledger);
  if (val("--base")) {
    const base = loadDebt(resolve(val("--base"))) ?? emptyLedger();
    const rep = val("--report") ? readJsonFile(resolve(val("--report"))) : null;
    const headItems = rep?.head ? new Map(rep.head.items.map((i) => [i.key, i])) : null;
    // Rule vi': a listed page scope's metric is read from the head and run snapshots.
    let headPageValues = null;
    let runPageValues = null;
    if (val("--head-dir") || val("--run")) {
      const { loadSnapshot } = await import("./snapshot.mjs");
      const { pageMetricValues } = await import("./run.mjs");
      if (val("--head-dir"))
        headPageValues = pageMetricValues(loadSnapshot(resolve(val("--head-dir"))));
      if (val("--run")) runPageValues = pageMetricValues(loadSnapshot(resolve(val("--run"))));
    }
    problems.push(
      ...transitionProblems(base, ledger, {
        step: val("--step") ?? null,
        headItems,
        headPageValues,
        runPageValues,
      }),
    );
  }
  for (const x of problems) process.stdout.write(`debt: ${x}\n`);
  process.stdout.write(
    `debt: ${ledger.entries.length} entr${ledger.entries.length === 1 ? "y" : "ies"}, ${problems.length} problem(s)\n`,
  );
  process.exitCode = problems.length ? 3 : 0;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((e) => {
    process.stderr.write(`debt check failed: ${e?.stack ?? e}\n`);
    process.exitCode = 1;
  });
}
