#!/usr/bin/env node
// Value-ratchet gate over an EXISTING run: compare a fidelity/run-all.mjs output directory (or
// any snapshot directory) with a committed baseline directory, write gate-report.{json,md}, and
// exit non-zero on any regression beyond tolerance. `node fidelity/run-all.mjs --gate --baseline
// <dir>` runs the same evaluation at the end of a fresh run.
//
//   node fidelity/gate/run.mjs --baseline <fidelity/baselines/<name>> --run <run-all out dir>
//     [--accept <accepted.json>] [--out <dir>] [--head <baseline dir> | --no-head]
//     [--pin <baseline dir> | --no-pin] [--main] [--debt <DEBT.json>] [--debt-base <DEBT.json>]
//     [--step <NN-name>] [--layout-from <run-all dir>] [--contract] [--doc-aggregate <file>]
//
// --baseline the previous link (GATE-S1..R1, per-step tolerances).
// --head     the chain head (default: the "**Chain head**" named in fidelity/baselines/port/
//            README.md, port/00-start): an item worse than the HEAD beyond its tolerance gates
//            unless a class-"a" acceptedRegressions entry of THIS step or a DEBT.json entry
//            within its ceiling covers it (GATE-H1, GATE-D*). Legacy entries without "class"
//            cover the previous link only. --no-head turns it off (history / post-hoc reports).
// --pin      the shipped main (default fidelity/baselines/pin): the PIN VIEW classes every item
//            worse than it (a) artefact / (b) ledger debt / (c) neither; --main makes (c) gate
//            (a merge to main, GATE-H3). --no-pin skips it.
// --debt     the ledger (default fidelity/baselines/port/DEBT.json); --debt-base the ledger at
//            the merge base (default: DEBT.json at `git merge-base HEAD main`, absent there = the
//            first population; a base that cannot be determined REFUSES the gate, I2): checks
//            rule iii (count, ceilings, removals) and that new entries satisfy the relaxed (b) rule.
// --step     the step id (NN-name) the run measures: an entry may close at its closesAt step.
//            The head comparison merges the declaredRejections of every port link from the head
//            (exclusive) to this step (inclusive), the pin view those of every link up to it
//            (manifests + baselines/port/declared-rejections.json; I4, gate/declarations.mjs).
// --contract the strict exit contract (ACCEPTANCE.md "Strict exit contract"): implies --main and
//            also gates DOC-4, the page count of every fixture equal to Chrome's (condition 3).
// --doc-aggregate  the run's document aggregate (default <run>/doc-aggregate/summary.json, written
//            by the run-all step doc-aggregate); compared with <pin>/doc-aggregate.json (DOC-1..4,
//            gate/doc-aggregate.mjs): reported always, gating under --main.
// --layout-from  a run-all dir whose layout-diff dumps give the run's layout_normalize passes
//            (rule v) when the snapshot does not record them (baselines written before
//            2026-10-21, or a committed baseline used as --run).
//
// --accept  JSON { "acceptedRegressions": [{ "key" | "keyPrefix", "after"?, "reason",
//           "evidence", "label"?, "class"?: "a" }], "declaredRejections": [{ "feature",
//           "reason", "evidence", "tests"? | "keys"? | "keyPrefix"? }] } (a baseline's
//           manifest.json has the same fields): regressions PROVEN to be corrections of a wrong
//           old value (class a: false pass, oracle artefact) and new strict-gate rejections the
//           step makes on purpose (fidelity/ACCEPTANCE.md GATE-A1).
// Exit: 0 PASS; 3 FAIL (regression beyond tolerance, or an absolute failure of the run: red code
// check, uncaught canary, unexpected layout-diff check failure, expired allowlist entry, crashed
// step); 2 REFUSED (not comparable: WPT commit / settings / ink data differ, baseline integrity);
// 1 the gate itself crashed.
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { gateCanaryItems, runGateCanaries } from "./canaries.mjs";
import { compareSnapshots, snapshotKeys } from "./compare.mjs";
import {
  BASELINES_DIR,
  DEBT_FILE,
  applyLedger,
  chainHead,
  emptyLedger,
  ledgerProblems,
  loadDebt,
  pinView,
  resolveLedgerBase,
  runGit,
  transitionProblems,
} from "./debt.mjs";
import { chainDeclarations } from "./declarations.mjs";
import {
  evaluateDocAggregate,
  loadPinDocAggregate,
  loadRunDocAggregate,
} from "./doc-aggregate.mjs";
import { verdictIndex } from "./metrics.mjs";
import { renderGateMarkdown } from "./report.mjs";
import { loadSnapshot } from "./snapshot.mjs";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
// A path outside the checkout (the durable run store) is written as ~/... rather than a "../.."
// path that depends on where the checkout or worktree sits.
const rel = (p) => {
  const r = relative(repoRoot, p) || ".";
  return r.startsWith("..") ? resolve(p).split(homedir()).join("~") : r;
};

export const GATE_EXIT = Object.freeze({ PASS: 0, FAIL: 3, REFUSED: 2 });

/** wpt/run.mjs options that take a value (their value is not a suite path). */
const WPT_VALUE_OPTIONS = new Set([
  "--wpt",
  "--out",
  "--jobs",
  "--timeout-ms",
  "--artifacts",
  "--rasterizer",
  "--vellora",
  "--expectations",
  "--upstream",
  "--chrome-jobs",
  "--chrome-from",
  "--label",
]);

/** The first --wpt-arg that narrows the default suites (--filter, --limit, a suite path), or null. */
export function wptNarrowing(args) {
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === "--filter" || a === "--limit") return a;
    if (WPT_VALUE_OPTIONS.has(a)) {
      i++;
      continue;
    }
    if (!a.startsWith("--")) return a;
  }
  return null;
}

/**
 * Why `run-all.mjs --gate` cannot start, checked BEFORE the 10+ minute WPT step (null = ok).
 * opts: { baseline, accept, wptArgs, chromeFrom, wptChrome, chrome }; selected: step ids.
 */
export function gateRefusal(opts, selected, exists = existsSync) {
  if (!opts.baseline) return "--gate needs --baseline <fidelity/baselines/<name>>";
  if (!exists(join(opts.baseline, "manifest.json"))) {
    return `${opts.baseline} has no manifest.json (not a baseline directory)`;
  }
  if (opts.accept && !exists(opts.accept)) return `--accept ${opts.accept} does not exist`;
  const g = gateOptions(opts.gateArgs ?? []);
  for (const [flag, dir] of [
    ["--head", g.headDir],
    ["--pin", g.pinDir],
  ]) {
    if (dir && !exists(join(dir, "manifest.json"))) {
      return `${flag} ${dir} has no manifest.json (not a baseline directory)`;
    }
  }
  if (g.headDir === undefined) {
    try {
      const head = chainHead();
      if (!exists(join(head, "manifest.json")))
        return `the chain head ${head} has no manifest.json`;
    } catch (e) {
      return e.message;
    }
  }
  // A --debt-base file that does not exist is the ledger's first population (loadDebt -> null);
  // without --debt-base the base is DEBT.json at `git merge-base HEAD main` (I2), which must be
  // determinable before the 10+ minute run starts.
  if (g.debtBase === undefined) {
    const why = (opts.resolveBase ?? resolveLedgerBase)({}).refusal;
    if (why) return why;
  }
  if ((opts.wptArgs ?? []).includes("--update-expectations")) {
    return "a gated run never rewrites committed expectations (drop --wpt-arg --update-expectations)";
  }
  // Every step feeds a gated section (code checks, WPT, crashtests, canaries, pdf-probe, ...):
  // skipping one would silently drop its checks.
  const missing = (opts.allSteps ?? []).filter((s) => !selected.includes(s));
  if (missing.length) {
    return `a gated run runs every step; not selected: ${missing.join(", ")} (drop --only/--skip)`;
  }
  if (opts.canaries === false) return "a gated run runs the canaries (drop --no-canaries)";
  const narrowing = wptNarrowing(opts.wptArgs ?? []);
  if (narrowing) {
    return `a gated run measures the full default WPT suites (--wpt-arg ${narrowing} narrows them)`;
  }
  if (selected.includes("wpt")) {
    if (opts.chromeFrom && !exists(opts.chromeFrom)) {
      return `--chrome-from ${opts.chromeFrom} does not exist`;
    }
    const liveChrome = opts.wptChrome && opts.chrome && exists(opts.chrome);
    if (!opts.chromeFrom && !liveChrome) {
      return "the WPT ratchet needs Chrome ink data: pass --wpt-chrome (live Chrome) or --chrome-from <wpt results.json>";
    }
  }
  return null;
}

export function readAcceptances(file) {
  if (!file) return [];
  const doc = JSON.parse(readFileSync(file, "utf8"));
  const list = Array.isArray(doc) ? doc : (doc.acceptedRegressions ?? []);
  for (const e of list) {
    if (!(e.key || e.keyPrefix) || !e.reason || !e.evidence) {
      throw new Error(
        `acceptance entry needs key|keyPrefix, reason and evidence: ${JSON.stringify(e)}`,
      );
    }
    // GATE-A1: compensating drift (class b) is entered in DEBT.json, never accepted.
    if (e.class !== undefined && e.class !== "a") {
      throw new Error(
        `acceptance entry of class "${e.class}": only class "a" (artefact: the OLD value is proven wrong) is accepted; compensating drift (class b) goes into fidelity/baselines/port/DEBT.json: ${JSON.stringify(e.key ?? e.keyPrefix)}`,
      );
    }
  }
  return list;
}

/**
 * declaredRejections of the same file (an accepted.json, or a baseline's manifest.json): new
 * strict-gate rejections the step makes on purpose (GATE-A1, D5). Each: feature (the core gate's
 * `feature` id, e.g. "css:page-varying-width"), reason, evidence, and optionally tests (WPT),
 * keys / keyPrefix (verdict rows, metrics).
 */
export function readDeclarations(file) {
  if (!file) return [];
  const doc = JSON.parse(readFileSync(file, "utf8"));
  const list = Array.isArray(doc) ? [] : (doc.declaredRejections ?? []);
  for (const d of list) {
    if (!d.feature || !d.reason || !d.evidence) {
      throw new Error(
        `declaredRejections entry needs feature, reason and evidence: ${JSON.stringify(d)}`,
      );
    }
  }
  return list;
}

/** Page-count (page-delta) metric keys of a snapshot (rule vi: what a page-scoped entry may name). */
export function pageMetricKeys(snapshot) {
  const { metrics } = verdictIndex(snapshot.fixtures ?? []);
  return new Set([...metrics].filter(([, m]) => m.tolClass === "page-delta").map(([k]) => k));
}

/** Page-count (page-delta) metric values of a snapshot: Map(key -> value) (rule vi' binds them). */
export function pageMetricValues(snapshot) {
  const { metrics } = verdictIndex(snapshot?.fixtures ?? []);
  return new Map(
    [...metrics]
      .filter(([, m]) => m.tolClass === "page-delta" && typeof m.value === "number")
      .map(([k, m]) => [k, m.value]),
  );
}

/** The layout_normalize pass names a snapshot recorded (fixtures' layoutDiff.passes), or null. */
export function snapshotPasses(snapshot, layoutFrom = null) {
  const out = new Set();
  for (const f of snapshot.fixtures ?? []) for (const p of f.layoutDiff?.passes ?? []) out.add(p);
  if (!out.size && layoutFrom && existsSync(join(layoutFrom, "layout-diff"))) {
    // Older runs/baselines: the run's own layout-diff dumps (diff.json `layers`, kind "pass").
    for (const fx of readdirSync(join(layoutFrom, "layout-diff"))) {
      const f = join(layoutFrom, "layout-diff", fx, "run-all", "diff.json");
      if (!existsSync(f)) continue;
      for (const l of JSON.parse(readFileSync(f, "utf8")).layers ?? []) {
        if (l.kind === "pass") out.add(l.name);
      }
    }
  }
  return out.size ? [...out].sort() : null;
}

const gatingOf = (items) => items.filter((i) => i.gating);
const countClasses = (items) => {
  const out = {};
  for (const i of items) out[i.class] = (out[i.class] ?? 0) + 1;
  return out;
};

/**
 * The whole gate on loaded snapshots (pure apart from nothing: every input is passed in).
 *   before/after  previous link / run: compareSnapshots (GATE-S1, V1, W1, P1, K1, C1, L1, R1)
 *   head          the chain head (GATE-H1): every item worse than it beyond tolerance must be a
 *                 class-a acceptance of the CURRENT step or a DEBT.json entry within its ceiling
 *   pin           the shipped main (GATE-H3, pin view): every item worse than it is classed
 *                 (a) / (b) / (c); with `main` a (c) item gates (a merge to main)
 *   ledger        DEBT.json (GATE-D1..D7); ledgerBase: the ledger at the merge base (rule iii)
 *   docAggregate  { run, pin } document aggregates (DOC-1..DOC-4; a null member = absent, which
 *                 REFUSES under main); undefined = the section is not evaluated (pure callers)
 *   contract      the strict exit contract: DOC-4 (pages == Chrome's) gates as well
 * Returns the report (compareSnapshots shape + head, pin, ledger, gateCanaries sections).
 */
export function evaluateGate({
  before,
  after,
  head = null,
  pin = null,
  accept = [],
  declared = [],
  headDeclared = declared,
  pinDeclared = declared,
  ledger = null,
  ledgerBase = undefined,
  ledgerBaseSource = null,
  step = null,
  passes = null,
  main = false,
  contract = false,
  docAggregate = undefined,
  canaries = true,
}) {
  const report = compareSnapshots(before, after, { accept, declared });
  const classA = accept.filter((e) => e.class === "a");
  const doc = ledger ?? emptyLedger();
  const problems = ledgerProblems(doc, { pageMetricKeys: pageMetricKeys(after) });
  // I2: rule iii always runs. `ledgerBase` null = first population (no ledger at the merge base);
  // undefined = not determined, which REFUSES the gate (runGate resolves it with
  // resolveLedgerBase: --debt-base, else DEBT.json at `git merge-base HEAD main`).
  // The head comparison first: GATE-D7 ties a new ledger key's measured value to its item (I3).
  // I4: the head and the pin see the declarations carried along the chain (declarations.mjs).
  const hr = head
    ? compareSnapshots(head.snapshot, after, { accept: classA, declared: headDeclared })
    : null;
  if (ledgerBase === undefined) {
    report.refusals.push(
      ledgerBaseSource ??
        "the ledger base (DEBT rule iii) is not determined: pass ledgerBase (null = first population)",
    );
  } else {
    problems.push(
      ...transitionProblems(ledgerBase ?? emptyLedger(), doc, {
        step,
        presentKeys: snapshotKeys(after),
        headItems: hr ? new Map(hr.items.map((i) => [i.key, i])) : null,
        headPageValues: head ? pageMetricValues(head.snapshot) : null,
        runPageValues: pageMetricValues(after),
      }),
    );
  }
  if (head) {
    const applied = applyLedger(hr, doc, { passes, pageValues: pageMetricValues(after) });
    problems.push(...applied.problems);
    const items = [
      ...applied.items,
      ...hr.items.filter((i) => i.class === "accepted" || i.class === "declared"),
    ];
    report.head = {
      baseline: head.dir,
      refusals: hr.refusals,
      verdict: hr.refusals.length ? "REFUSED" : gatingOf(items).length ? "FAIL" : "PASS",
      counts: {
        ...countClasses(items),
        gating: gatingOf(items).length,
        improvement: hr.counts.improvement ?? 0,
        withinTolerance: hr.counts.withinTolerance,
        flaggedPassLost: hr.counts.flaggedPassLost,
      },
      items,
      unusedEntries: applied.unused,
      acceptancesCounted: classA.length,
      acceptancesIgnored: accept.length - classA.length,
      declarationsCarried: headDeclared.length - declared.length,
    };
    report.refusals.push(...hr.refusals.map((r) => `head ${head.dir}: ${r}`));
  }
  report.ledger = {
    schema: doc.schema,
    entries: doc.entries.length,
    problems,
    transitionChecked: ledgerBase !== undefined,
    base: ledgerBaseSource,
    passes,
  };
  for (const [n, p] of problems.entries()) {
    report.items.push({
      key: `debt|ledger#${n + 1}`,
      group: "debt ledger",
      check: "debt",
      class: "failure",
      gating: true,
      before: "-",
      after: "invalid",
      detail: p,
    });
  }
  if (docAggregate !== undefined) {
    const d = evaluateDocAggregate({ ...docAggregate, main: main || contract, contract });
    report.docAggregate = d;
    report.items.push(...d.items);
    report.refusals.push(...d.refusals.map((r) => `doc-aggregate: ${r}`));
  }
  if (canaries) {
    report.gateCanaries = runGateCanaries({
      run: after,
      passes,
      docAggregate: docAggregate?.run ?? null,
    });
    report.items.push(...gateCanaryItems(report.gateCanaries));
  }
  if (pin) {
    const pr = compareSnapshots(pin.snapshot, after, { accept: classA, declared: pinDeclared });
    report.pin = {
      baseline: pin.dir,
      ...pinView(pr, doc, { pageValues: pageMetricValues(after) }),
      main,
    };
    if (main) {
      // When --baseline is the pin itself the same items already gate: do not count them twice.
      const gatingKeys = new Set(report.items.filter((i) => i.gating).map((i) => i.key));
      for (const i of report.pin.items.filter(
        (x) => x.pinClass === "c" && !gatingKeys.has(x.key),
      )) {
        report.items.push({
          ...i,
          key: `pin|${i.key}`,
          class: "pin-c",
          gating: true,
          detail: `worse than the shipped main (pin) and neither an artefact nor ledger debt: ${i.detail}`,
        });
      }
    }
    report.refusals.push(...(main ? pr.refusals.map((r) => `pin ${pin.dir}: ${r}`) : []));
  }
  const gating = gatingOf(report.items).length;
  const headGating = report.head ? report.head.counts.gating : 0;
  report.counts = {
    ...countClasses(report.items),
    gating,
    headGating,
    debt: report.head?.counts.debt ?? 0,
    flaggedPassLost: report.counts.flaggedPassLost,
    unchanged: report.counts.unchanged,
    withinTolerance: report.counts.withinTolerance,
    withinToleranceBetter: report.counts.withinToleranceBetter,
    missingTokensNotComparable: report.counts.missingTokensNotComparable,
    ...(report.pin
      ? { pinA: report.pin.counts.a, pinB: report.pin.counts.b, pinC: report.pin.counts.c }
      : {}),
    ...(report.docAggregate?.counts
      ? {
          docRegressions: report.docAggregate.counts.regressions,
          contractPagesFailing: report.docAggregate.counts.contractPagesFailing,
        }
      : {}),
  };
  const byGroup = {};
  for (const i of report.items) {
    byGroup[i.group] ??= {};
    byGroup[i.group][i.class] = (byGroup[i.group][i.class] ?? 0) + 1;
  }
  report.byGroup = byGroup;
  report.verdict = report.refusals.length ? "REFUSED" : gating + headGating ? "FAIL" : "PASS";
  return report;
}

const loadOptional = (dir) => (dir ? { dir: rel(dir), snapshot: loadSnapshot(dir) } : null);

/**
 * Evaluate and write gate-report.{json,md} into outDir. Returns { report, exitCode }.
 * headDir / pinDir: undefined = the default (chain head named in baselines/port/README.md;
 * fidelity/baselines/pin), null = off.
 */
export function runGate({
  baselineDir,
  runDir,
  acceptFile = null,
  outDir,
  command,
  date,
  headDir = undefined,
  pinDir = undefined,
  debtFile = DEBT_FILE,
  debtBase = undefined,
  step = null,
  layoutFrom = null,
  main = false,
  contract = false,
  docAggregateFile = null,
  git = runGit,
}) {
  const before = loadSnapshot(baselineDir);
  const after = loadSnapshot(runDir);
  const accept = readAcceptances(acceptFile);
  const declared = readDeclarations(acceptFile);
  const resolvedHead = headDir === undefined ? chainHead() : headDir;
  const head = loadOptional(resolvedHead);
  const carried = chainDeclarations({
    headDir: resolvedHead,
    baselineDir,
    current: declared,
    step,
  });
  const resolvedPin = pinDir === undefined ? join(BASELINES_DIR, "pin") : pinDir;
  const pin = loadOptional(resolvedPin);
  // DOC-*: the pin reference lives in the pin baseline; --no-pin leaves it absent (REFUSED under
  // --main, like every other missing doc-aggregate input).
  const docAggregate = {
    run: loadRunDocAggregate(runDir, docAggregateFile),
    pin: loadPinDocAggregate(resolvedPin),
  };
  const ledger = loadDebt(debtFile);
  const base = resolveLedgerBase({ debtBase, git });
  const ledgerBase = base.refusal ? undefined : base.ledger;
  const passes = snapshotPasses(after, layoutFrom ?? (after.source.kind === "run" ? runDir : null));
  const report = evaluateGate({
    before,
    after,
    head,
    pin,
    accept,
    declared,
    headDeclared: carried.head,
    pinDeclared: carried.pin,
    ledger,
    ledgerBase,
    ledgerBaseSource: base.refusal ?? base.source,
    step,
    passes,
    main,
    contract,
    docAggregate,
  });
  const meta = {
    date: date ?? new Date().toISOString(),
    command,
    baseline: {
      dir: rel(baselineDir),
      schema: before.source.schema,
      provenance: before.provenance ?? null,
      integrity: before.integrity,
    },
    run: { dir: rel(runDir), schema: after.source.schema, provenance: after.provenance ?? null },
    acceptFile: acceptFile ? rel(acceptFile) : null,
    debtFile: debtFile ? rel(debtFile) : null,
    debtBase: debtBase ? rel(debtBase) : null,
    ledgerBase: base.refusal ?? base.source,
    step,
    layoutFrom: layoutFrom ? rel(layoutFrom) : null,
    docAggregateFile: docAggregateFile ? rel(docAggregateFile) : null,
    contract,
  };
  mkdirSync(outDir, { recursive: true });
  writeFileSync(
    join(outDir, "gate-report.json"),
    `${JSON.stringify({ ...meta, ...report }, null, 2)}\n`,
  );
  writeFileSync(
    join(outDir, "gate-report.md"),
    renderGateMarkdown(report, {
      baseline: `${meta.baseline.dir} (${before.source.schema})`,
      run: `${meta.run.dir} (${after.source.schema})`,
      command,
      date: meta.date,
      environment: after.provenance?.environment ?? null,
    }),
  );
  return { report, exitCode: GATE_EXIT[report.verdict] ?? 1 };
}

/**
 * --head/--no-head, --pin/--no-pin, --debt, --debt-base, --step, --layout-from, --main, --contract
 * (implies --main), --doc-aggregate.
 */
export function gateOptions(argv) {
  const val = (name) => {
    const i = argv.indexOf(name);
    return i >= 0 ? argv[i + 1] : undefined;
  };
  const dir = (name, off) =>
    argv.includes(off) ? null : val(name) !== undefined ? resolve(val(name)) : undefined;
  return {
    headDir: dir("--head", "--no-head"),
    pinDir: dir("--pin", "--no-pin"),
    debtFile: val("--debt") ? resolve(val("--debt")) : DEBT_FILE,
    debtBase: val("--debt-base") ? resolve(val("--debt-base")) : undefined,
    step: val("--step") ?? null,
    layoutFrom: val("--layout-from") ? resolve(val("--layout-from")) : null,
    main: argv.includes("--main") || argv.includes("--contract"),
    contract: argv.includes("--contract"),
    docAggregateFile: val("--doc-aggregate") ? resolve(val("--doc-aggregate")) : null,
  };
}

async function main() {
  const argv = process.argv.slice(2);
  const val = (name) => {
    const i = argv.indexOf(name);
    return i >= 0 ? argv[i + 1] : undefined;
  };
  if (argv.includes("--help") || !val("--baseline") || !val("--run")) {
    process.stdout.write(
      `${readFileSync(fileURLToPath(import.meta.url), "utf8")
        .split("\n")
        .slice(1)
        .filter((l, i, all) => all.slice(0, i + 1).every((x) => x.startsWith("//")))
        .map((l) => l.replace(/^\/\/ ?/, ""))
        .join("\n")}\n`,
    );
    process.exitCode = argv.includes("--help") ? 0 : 2;
    return;
  }
  const runDir = resolve(val("--run"));
  const outDir = resolve(val("--out") ?? join(runDir, "gate"));
  const { report, exitCode } = runGate({
    baselineDir: resolve(val("--baseline")),
    runDir,
    acceptFile: val("--accept") ? resolve(val("--accept")) : null,
    outDir,
    command: `node fidelity/gate/run.mjs ${argv.join(" ")}`,
    ...gateOptions(argv),
  });
  process.stdout.write(
    `gate: ${report.verdict}; ${Object.entries(report.counts)
      .map(([k, v]) => `${k} ${v}`)
      .join(", ")}\n${
      report.head
        ? `gate: head ${report.head.baseline} ${report.head.verdict}; ${Object.entries(
            report.head.counts,
          )
            .map(([k, v]) => `${k} ${v}`)
            .join(", ")}\n`
        : ""
    }${
      report.pin
        ? `gate: pin view ${report.pin.baseline}: (a) ${report.pin.counts.a}, (b) ${report.pin.counts.b}, (c) ${report.pin.counts.c}, declared ${report.pin.counts.declared}; merge to main ${report.pin.mainMerge}\n`
        : ""
    }${
      report.docAggregate
        ? `gate: doc-aggregate ${report.docAggregate.verdict}; contract condition 2 ${report.docAggregate.condition2 ?? "-"}, condition 3 ${report.docAggregate.condition3 ?? "-"}\n`
        : ""
    }${report.refusals.map((r) => `gate: REFUSED ${r}\n`).join("")}gate: report ${join(outDir, "gate-report.md")}\n`,
  );
  process.exitCode = exitCode;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((e) => {
    process.stderr.write(`gate failed: ${e?.stack ?? e}\n`);
    process.exitCode = 1;
  });
}
