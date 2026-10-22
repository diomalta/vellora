// Declared strict-gate rejections carried along the port chain (I4, 2026-10-22).
//
// A declaredRejections entry (GATE-A2) covers a NEW strict-gate rejection the step makes on
// purpose. Against the previous link only the CURRENT step's declarations apply (an older
// rejection is not new there). Against the chain head and the pin, though, a rejection declared
// by an earlier link is still a difference: before I4, step 06's 10 `css:page-varying-width`
// rejections gated again against the head at every later step. So the head comparison merges
// the declarations of every link from the head (exclusive) to the current step (inclusive), and
// the pin view those of every link up to the current step.
//
// Sources, per link `NN-name` of fidelity/baselines/port/:
//   - its manifest.json `declaredRejections` (written by write-baseline.mjs from the step's
//     accept file);
//   - fidelity/baselines/port/declared-rejections.json `declarations[]` with `step: "NN-name"`:
//     the chain supplement for links whose manifest predates declaredRejections (06-page-rules:
//     its manifest is history, integrity-hashed, and is not rewritten);
//   - the current step: the accept file of the gated run (plus supplement entries of --step).
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
export const PORT_DIR = resolve(here, "..", "baselines", "port");
export const DECLARATIONS_FILE = join(PORT_DIR, "declared-rejections.json");
export const DECLARATIONS_SCHEMA = "vellora-fidelity/declared-rejections/1";
const STEP_RE = /^(\d{2})-[a-z0-9][a-z0-9-]*$/;

/** The ordinal of a port step name (`06-page-rules` -> 6), or null. */
export const stepOrdinal = (name) => {
  const m = STEP_RE.exec(name ?? "");
  return m ? Number(m[1]) : null;
};

/** Shape problems of a declaration (feature, reason, evidence; tests/keys/keyPrefix optional). */
export function declarationProblems(d, where) {
  return !d?.feature || !d.reason || !d.evidence
    ? [`${where}: a declaration needs feature, reason and evidence: ${JSON.stringify(d)}`]
    : [];
}

/**
 * Pure merge. `links`: [{ step, declaredRejections }] of the port chain (any order);
 * `supplement`: [{ step, ...declaration }]; `from` exclusive / `to` inclusive step ordinals
 * (null `from` = from the chain start, inclusive of 00); `current`: the current step's own
 * declarations (always included). Returns the declarations, each tagged with `declaredBy`.
 */
export function mergeChainDeclarations({
  links = [],
  supplement = [],
  from = null,
  to = null,
  current = [],
  currentStep = null,
}) {
  const inRange = (step) => {
    const n = stepOrdinal(step);
    if (n === null || to === null) return false;
    return (from === null ? n >= 0 : n > from) && n <= to;
  };
  const out = [];
  const seen = new Set();
  const push = (d, by) => {
    const id = JSON.stringify([d.feature, d.tests ?? null, d.keys ?? null, d.keyPrefix ?? null]);
    if (seen.has(id)) return;
    seen.add(id);
    out.push({ ...d, declaredBy: by });
  };
  for (const d of current) push(d, currentStep ?? "current step");
  for (const s of supplement) {
    if (s.step === currentStep || inRange(s.step)) {
      const { step, ...d } = s;
      push(d, `${step} (port/declared-rejections.json)`);
    }
  }
  for (const l of [...links].sort((a, b) => (a.step < b.step ? -1 : 1))) {
    if (!inRange(l.step)) continue;
    for (const d of l.declaredRejections ?? []) push(d, `${l.step} (manifest.json)`);
  }
  return out;
}

/** The chain supplement (empty when the file is absent). Throws on a malformed file. */
export function loadSupplement(file = DECLARATIONS_FILE) {
  if (!existsSync(file)) return [];
  const doc = JSON.parse(readFileSync(file, "utf8"));
  if (doc.schema !== DECLARATIONS_SCHEMA) {
    throw new Error(`${file}: schema ${doc.schema} (expected ${DECLARATIONS_SCHEMA})`);
  }
  const list = doc.declarations ?? [];
  const problems = list.flatMap((d, i) => [
    ...declarationProblems(d, `${file} declarations[${i}]`),
    ...(stepOrdinal(d.step) === null ? [`${file} declarations[${i}]: step must be NN-name`] : []),
  ]);
  if (problems.length) throw new Error(problems.join("; "));
  return list;
}

/** Every port link's manifest declarations: [{ step, declaredRejections }]. */
export function loadLinks(portDir = PORT_DIR) {
  if (!existsSync(portDir)) return [];
  return readdirSync(portDir)
    .filter((d) => stepOrdinal(d) !== null && existsSync(join(portDir, d, "manifest.json")))
    .map((step) => ({
      step,
      declaredRejections:
        JSON.parse(readFileSync(join(portDir, step, "manifest.json"), "utf8")).declaredRejections ??
        [],
    }));
}

/** The port step a baseline directory is (its name under portDir), or null. */
function portStepOf(dir, portDir) {
  if (!dir) return null;
  const abs = resolve(dir);
  return dirname(abs) === resolve(portDir) && stepOrdinal(basename(abs)) !== null
    ? basename(abs)
    : null;
}

/**
 * Declarations for the head and the pin comparisons of a gated run. `headDir` / `baselineDir`:
 * the chain head and the previous link; `current`: the run's own declarations; `step`: --step.
 * The current step's ordinal is `step`'s, else the previous link's + 1. Outside the port chain
 * (head or previous link not a port step) only `current` (and supplement entries of `step`).
 */
export function chainDeclarations({
  headDir,
  baselineDir,
  current = [],
  step = null,
  portDir = PORT_DIR,
  supplementFile = DECLARATIONS_FILE,
}) {
  const supplement = loadSupplement(supplementFile);
  const links = loadLinks(portDir);
  const prev = portStepOf(baselineDir, portDir);
  const headStep = portStepOf(headDir, portDir);
  const to = stepOrdinal(step) ?? (prev ? stepOrdinal(prev) + 1 : null);
  const common = { links, supplement, current, currentStep: step };
  return {
    head: mergeChainDeclarations({
      ...common,
      from: headStep ? stepOrdinal(headStep) : null,
      to: headStep && prev ? to : null,
    }),
    // The pin view needs only the current step (--step, else the previous link + 1): a run gated
    // against the pin itself (--baseline pin --main) still carries the chain's declarations.
    pin: mergeChainDeclarations({ ...common, from: null, to }),
  };
}
