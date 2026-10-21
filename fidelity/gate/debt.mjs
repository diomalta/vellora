#!/usr/bin/env node
// The debt ledger (fidelity/baselines/port/DEBT.json, schema vellora-fidelity/debt/1) and the
// HEAD ratchet's coverage rules (fidelity/ACCEPTANCE.md GATE-H*, GATE-D*). Pure except loadDebt
// and the CLI.
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
// Entry: { id, keys[], class: "b", headValue, ceiling, closesAt, tolClass,
//          owner: { layer, component, upstream? },
//          layerVector: { unit, N0, B0, L0, <each layout_normalize pass>, P, run },
//          compensators[], introducedBy, evidence[], scope?: { fixture, fromPage } }
//   keys        gate-report item keys the entry covers (a page-scoped entry: the page-count
//               metric key(s) of its fixture; it then also covers that fixture's pdf-probe items
//               on pages >= scope.fromPage and its unpaired-word counts, rule vi)
//   headValue   the value at the head; ceiling: the worst value allowed now (same unit and
//               orientation as the item: |d| for pdf-probe dx/dy, the metric's own value
//               otherwise; a status / WPT outcome / "unpaired" for non-numeric items)
//   layerVector per-layer delta vs Chrome of the item (fidelity/gate/layer-vector.mjs): N0 raw
//               Blitz on the source HTML, B0 html_normalize, L0 the walk/reader, each pass, P
//               pagination, run = the value the PDF-level oracle measured
//   compensators the vellora layers (B0, L0, pass names, P, run) whose non-zero step the entry
//               relies on; owner: who owns the residual (layer "blitz:*" | "vellora:*" | ...)
//
// Rules (each with a self-test in gate/test/debt.test.mjs and a canary in gate/canaries.mjs):
//   (i)   every head-gating item matches an entry, else it gates
//   (ii)  the current value is within the entry's ceiling, else it gates (debt-exceeded)
//   (iii) across a merge (old ledger -> new ledger): the entry count and the sum of ceilings per
//         tolClass never increase, no ceiling goes up, an entry is removed only at its closesAt
//         step or with a stated reason when its key vanished from the run; the first population
//         (no previous entry at all) is exempt from the count and sum rule (DESIGN TARGET)
//   (iv)  an owner.layer "vellora:*" entry names a retirement step in closesAt (NN-name)
//   (v)   a layout_normalize pass listed as a compensator and absent from the run forces the
//         entry to be re-gated (its layer vector no longer describes the run)
//   (vi)  words displaced to another page collapse into ONE page-scoped entry per page-count
//         criterion: no two entries name the same page-count metric, and no entry lists a
//         per-word key its fixture's page-scoped entry covers
//   new entries (absent from the previous ledger) satisfy the RELAXED (b) rule: |run| <= |N0|,
//         every non-zero vellora layer step is a named compensator, the residual owner is named
//
//   node fidelity/gate/debt.mjs check [--ledger <DEBT.json>] [--base <previous DEBT.json>]
//     [--step <NN-name>]      validate a ledger (and its transition from --base); exit 0 ok, 3 not
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { STATUS_RANK, TOLERANCES, layerStepTolerance, vectorRunTolerance } from "./tolerances.mjs";

export const DEBT_SCHEMA = "vellora-fidelity/debt/1";
const here = dirname(fileURLToPath(import.meta.url));
export const BASELINES_DIR = resolve(here, "..", "baselines");
export const DEBT_FILE = join(BASELINES_DIR, "port", "DEBT.json");
export const PORT_README = join(BASELINES_DIR, "port", "README.md");

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

export function loadDebt(file = DEBT_FILE) {
  if (!file || !existsSync(file)) return null;
  const doc = JSON.parse(readFileSync(file, "utf8"));
  if (doc.schema !== DEBT_SCHEMA) {
    throw new Error(`${file}: schema ${doc.schema} (expected ${DEBT_SCHEMA})`);
  }
  return { ...doc, entries: doc.entries ?? [], closed: doc.closed ?? [] };
}

const isPassLayer = (name) => !RAW_LAYERS.has(name) && !FIXED_VELLORA_LAYERS.has(name);
const pdfProbeFixture = (key) => (key.startsWith("pdf-probe|") ? key.split("|")[1] : null);
/** Chrome page of a pdf-probe word key `pdf-probe|<fx>|p<N>|<text>#<n>|<axis>`, or null. */
export function pdfProbePage(key) {
  const m = /^pdf-probe\|[^|]+\|p(\d+)\|/.exec(key);
  return m ? Number(m[1]) : null;
}
const isPerWordKey = (key) => pdfProbePage(key) !== null;

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

/** RELAXED (b) rule for an entry (new entries must satisfy it). Returns problems (strings). */
export function relaxedB(entry) {
  const p = [];
  const v = entry.layerVector;
  if (!v || typeof v.N0 !== "number" || typeof v.run !== "number") {
    return [`${entry.id}: layerVector needs numeric N0 and run (fidelity/gate/layer-vector.mjs)`];
  }
  if (!v.unit) p.push(`${entry.id}: layerVector.unit missing`);
  const tol = layerStepTolerance(v.unit);
  const runTol = vectorRunTolerance(entry.tolClass, v.unit);
  if (Math.abs(v.run) > Math.abs(v.N0) + runTol) {
    p.push(
      `${entry.id}: |run| ${Math.abs(v.run)} > |N0| ${Math.abs(v.N0)}: vellora made the item worse than raw Blitz, not compensating drift`,
    );
  }
  const named = new Set(entry.compensators ?? []);
  for (const { layer, step } of vectorSteps(v)) {
    if (Math.abs(step) > (layer === "run" ? runTol : tol) && !named.has(layer)) {
      p.push(
        `${entry.id}: vellora layer ${layer} moves the item by ${Math.round(step * 1000) / 1000} ${v.unit} and is not a named compensator`,
      );
    }
  }
  if (!entry.owner?.layer || !entry.owner?.component) {
    p.push(`${entry.id}: the residual owner (owner.layer, owner.component) is not named`);
  }
  return p;
}

/** Shape rules every entry obeys (and rule iv). */
export function entryProblems(e) {
  const p = [];
  const id = e.id ?? "(no id)";
  if (!e.id) p.push("entry without id");
  if (!Array.isArray(e.keys) || !e.keys.length) p.push(`${id}: keys[] empty`);
  if (e.class !== "b") p.push(`${id}: class must be "b" (artefacts are acceptedRegressions)`);
  if (e.ceiling === undefined || e.headValue === undefined) {
    p.push(`${id}: headValue and ceiling are required`);
  }
  if (!e.tolClass || !TOLERANCES[e.tolClass]) p.push(`${id}: unknown tolClass ${e.tolClass}`);
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

/** Whole-ledger rules: shape, unique ids, (vi) one page-scoped entry per page-count criterion. */
export function ledgerProblems(ledger, { pageMetricKeys = null } = {}) {
  const p = [];
  const ids = new Set();
  for (const e of ledger.entries) {
    p.push(...entryProblems(e));
    if (ids.has(e.id)) p.push(`${e.id}: duplicate id`);
    ids.add(e.id);
  }
  const scoped = ledger.entries.filter((e) => e.scope);
  const byCriterion = new Map();
  for (const e of scoped) {
    for (const k of e.keys) {
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
    for (const k of e.keys) {
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
  return p;
}

const numeric = (v) => typeof v === "number" && Number.isFinite(v);

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
  if (page !== null) return page >= e.scope.fromPage;
  return /\|unpaired-(chrome|vellora)$/.test(item.key);
}

export const HEAD_GATING_CLASSES = Object.freeze(["regression", "removed", "rejection"]);

/**
 * Apply the ledger to a HEAD comparison (compareSnapshots(head, run, ...)). Returns
 * { items, problems, used } where items are the head comparison's gating items reclassified:
 *   head-regression  no entry covers it (rule i)            GATES
 *   debt             covered, within its ceiling             does not gate (counted)
 *   debt-exceeded    covered, beyond its ceiling (rule ii)   GATES
 *   debt-regate      covered, but a compensator pass is gone from the run (rule v)   GATES
 * `passes`: the run's layout_normalize pass names (null = unknown: rule v cannot be checked,
 * reported as a problem when an entry names a pass compensator).
 */
export function applyLedger(headReport, ledger, { passes = null } = {}) {
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
  const used = new Set();
  const items = [];
  for (const i of headReport.items) {
    if (!i.gating || !HEAD_GATING_CLASSES.includes(i.class)) continue;
    const e = entries.find((x) => x.keys.includes(i.key) || scopeCovers(x, i));
    const base = { ...i, headClass: i.class };
    if (!e) {
      items.push({
        ...base,
        class: "head-regression",
        gating: true,
        detail: `worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): ${i.detail}`,
      });
      continue;
    }
    used.add(e.id);
    if (missingPass.has(e.id)) {
      items.push({
        ...base,
        class: "debt-regate",
        gating: true,
        debt: e.id,
        detail: `${e.id} names compensator pass(es) ${missingPass.get(e.id).join(", ")} the run no longer has: re-measure its layer vector and re-gate (rule v)`,
      });
      continue;
    }
    // A page-scoped entry's ceiling binds its page-count metric; the words it covers ride on it.
    const bound = e.keys.includes(i.key) ? i : byKey.get(e.keys[0]);
    const ok = bound ? withinCeiling(bound, e.ceiling) : true;
    items.push({
      ...base,
      class: ok ? "debt" : "debt-exceeded",
      gating: !ok,
      debt: e.id,
      detail: ok
        ? `${e.id} (class b, owner ${e.owner?.layer}, closes at ${e.closesAt ?? "-"}): ${i.detail}`
        : `${e.id}: value ${bound.after} beyond the ceiling ${e.ceiling} (rule ii)`,
    });
  }
  // Rule ii for covered keys that improved past the head or stayed inside tolerance: nothing to
  // gate. Entries no item used are stale (reported, not gating: rule iii decides their removal).
  const unused = entries.filter((e) => !used.has(e.id)).map((e) => e.id);
  return { items, problems, unused };
}

const ceilingSums = (entries) => {
  const out = {};
  for (const e of entries)
    if (numeric(e.ceiling)) out[e.tolClass] = (out[e.tolClass] ?? 0) + e.ceiling;
  return out;
};

/**
 * Rule (iii) and the new-entry rule across a merge. `presentKeys`: item keys the run still
 * produces (null = unknown: a removal by "key vanished" cannot be verified and is a problem).
 */
export function transitionProblems(oldLedger, newLedger, { step = null, presentKeys = null } = {}) {
  const p = [];
  const before = oldLedger?.entries ?? [];
  const after = newLedger?.entries ?? [];
  const old = new Map(before.map((e) => [e.id, e]));
  const now = new Map(after.map((e) => [e.id, e]));
  const bootstrap = before.length === 0 && !(oldLedger?.closed ?? []).length;
  if (!bootstrap) {
    if (after.length > before.length) {
      p.push(
        `entry count ${before.length} -> ${after.length}: the ledger may only shrink (rule iii)`,
      );
    }
    const sb = ceilingSums(before);
    const sa = ceilingSums(after);
    for (const [cls, v] of Object.entries(sa)) {
      if (v > (sb[cls] ?? 0) + EPS) {
        p.push(`sum of ${cls} ceilings ${sb[cls] ?? 0} -> ${v}: may not increase (rule iii)`);
      }
    }
  }
  for (const [id, e] of now) {
    const o = old.get(id);
    if (!o) {
      p.push(...relaxedB(e).map((x) => `new entry ${x} (relaxed (b) rule)`));
      continue;
    }
    if (numeric(o.ceiling) && numeric(e.ceiling) && e.ceiling > o.ceiling + EPS) {
      p.push(`${id}: ceiling ${o.ceiling} -> ${e.ceiling}: ceilings only go down (rule iii)`);
    }
  }
  const closedNow = new Map((newLedger?.closed ?? []).map((c) => [c.id, c]));
  for (const [id, o] of old) {
    if (now.has(id)) continue;
    const c = closedNow.get(id);
    if (step && o.closesAt === step) continue;
    if (!c?.reason) {
      p.push(
        `${id} removed before its closesAt (${o.closesAt ?? "-"}) without a stated reason in closed[] (rule iii)`,
      );
      continue;
    }
    if (c.keyVanished) {
      if (!presentKeys) {
        p.push(`${id}: removal because its key vanished cannot be verified without the run's keys`);
      } else if (o.keys.some((k) => presentKeys.has(k))) {
        p.push(
          `${id}: removed as "key vanished" but the run still has ${o.keys.filter((k) => presentKeys.has(k)).join(", ")}`,
        );
      }
    } else {
      p.push(
        `${id}: removed before its closesAt (${o.closesAt ?? "-"}): only a vanished key is a stated reason (rule iii)`,
      );
    }
  }
  return p;
}

/** Pin view class of a pin-comparison item: (a) accepted artefact, (b) ledger, (c) otherwise. */
export function pinView(pinReport, ledger) {
  const applied = applyLedger(pinReport, ledger, { passes: null });
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
      "usage: node fidelity/gate/debt.mjs check [--ledger <DEBT.json>] [--base <previous DEBT.json>] [--step <NN-name>]\n",
    );
    process.exitCode = 2;
    return;
  }
  const ledger = loadDebt(resolve(val("--ledger") ?? DEBT_FILE)) ?? emptyLedger();
  const problems = ledgerProblems(ledger);
  if (val("--base")) {
    const base = loadDebt(resolve(val("--base"))) ?? emptyLedger();
    problems.push(...transitionProblems(base, ledger, { step: val("--step") ?? null }));
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
