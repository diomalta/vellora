// The value ratchet: compare a run snapshot with a committed baseline snapshot. Pure: no I/O, so
// every rule is unit-tested (gate/test/*.test.mjs) on planted and on committed data.
//
// Item classes:
//   regression      moved the bad way beyond its tolerance; GATES unless accepted
//   accepted        a regression matched by an acceptedRegressions entry (reason + evidence)
//   failure         an absolute failure of the run itself (red code check, uncaught detection
//                   canary, unexpected layout-diff check failure, expired allowlist entry, step
//                   crash); GATES, cannot be accepted
//   removed         measured in the baseline, absent from the run (never silently absent); GATES
//   reported        a regression that is shown but does not gate (WPT flagged passes)
//   improvement | newly-measured | added | changed | not-comparable   never gate
import { pdfProbeComparability, sectionSemantics } from "../layout-diff/lib/pdf-probe-v2.mjs";
import { verdictIndex } from "./metrics.mjs";
import { CRASH_BAD, STATUS_RANK, TOLERANCES, UNMEASURED } from "./tolerances.mjs";
import { compareCrashtests, compareWpt } from "./wpt.mjs";

const isUnmeasured = (s) => UNMEASURED.includes(s) || s === undefined;
const fmt = (v) => (typeof v === "number" ? String(Math.round(v * 1e4) / 1e4) : String(v ?? "-"));

function groupOf(row) {
  if (row.oracle === "corpus" || row.oracle === "corpus:audit" || row.oracle === "run-all") {
    return `${row.oracle} ${row.criterion.replace(/\d.*$/, "")}`;
  }
  return `${row.oracle} ${row.criterion}`;
}

/** Status ratchet over verdict rows. */
function compareRows(before, after, items, counts) {
  for (const [key, b] of before.rows) {
    const a = after.rows.get(key);
    const group = groupOf(b);
    if (!a) {
      items.push({
        key,
        group,
        check: "status",
        class: isUnmeasured(b.status) ? "changed" : "removed",
        gating: !isUnmeasured(b.status),
        before: b.status,
        after: "absent",
        detail: "verdict row missing from the run (never silently absent)",
      });
      continue;
    }
    if (a.status === b.status) {
      counts.unchanged++;
      continue;
    }
    const base = { key, group, check: "status", before: b.status, after: a.status };
    if (isUnmeasured(b.status) && !isUnmeasured(a.status)) {
      items.push({
        ...base,
        class: "newly-measured",
        gating: false,
        detail: `now measured: ${a.value}`,
      });
    } else if (!isUnmeasured(b.status) && isUnmeasured(a.status)) {
      items.push({
        ...base,
        class: "regression",
        gating: true,
        detail: `no longer measured: ${a.value}`,
      });
    } else if (isUnmeasured(b.status) && isUnmeasured(a.status)) {
      items.push({ ...base, class: "changed", gating: false, detail: String(a.value ?? "") });
    } else {
      const worse = (STATUS_RANK[a.status] ?? 0) < (STATUS_RANK[b.status] ?? 0);
      items.push({
        ...base,
        class: worse ? "regression" : "improvement",
        gating: worse,
        detail: `${b.value ?? ""} -> ${a.value ?? ""}`,
      });
    }
  }
  for (const [key, a] of after.rows) {
    if (!before.rows.has(key)) {
      items.push({
        key,
        group: groupOf(a),
        check: "status",
        class: "added",
        gating: false,
        before: "absent",
        after: a.status,
        detail: String(a.value ?? ""),
      });
    }
  }
}

/** Value ratchet over verdict metrics. */
function compareMetrics(before, after, items, counts) {
  for (const [key, b] of before.metrics) {
    const a = after.metrics.get(key);
    const group = groupOf(b.row);
    if (b.better === "info") continue;
    const tolClass = b.tolClass ?? a?.tolClass;
    const tol = TOLERANCES[tolClass]?.tol ?? 0;
    const base = {
      key,
      group,
      check: "value",
      tolClass,
      tol,
      before: b.value,
      after: a?.value ?? null,
    };
    if (!a) {
      // The row itself is reported by the status ratchet when it disappeared or went unmeasured.
      const rowNow = after.rows.get(b.rowKey);
      if (b.value !== null && rowNow && !isUnmeasured(rowNow.status)) {
        items.push({
          ...base,
          class: "regression",
          gating: true,
          detail: `metric no longer reported (row value now "${rowNow.value}")`,
        });
      }
      continue;
    }
    if (b.value === null && a.value === null) {
      counts.unchanged++;
      continue;
    }
    if (b.value === null) {
      items.push({
        ...base,
        class: "newly-measured",
        gating: false,
        detail: `was ${b.unmeasured ?? "not measurable"}`,
      });
      continue;
    }
    if (a.value === null) {
      items.push({
        ...base,
        class: "regression",
        gating: true,
        detail: `no longer measurable: ${a.unmeasured ?? "no value"}`,
      });
      continue;
    }
    const delta = a.value - b.value;
    const bad = b.better === "lower" ? delta : -delta;
    const eps = 1e-9;
    if (bad > tol + eps) {
      items.push({
        ...base,
        delta,
        class: "regression",
        gating: true,
        detail: `${fmt(b.value)} -> ${fmt(a.value)} (tolerance ${tol} ${TOLERANCES[tolClass]?.unit ?? ""})`,
      });
    } else if (bad < -(tol + eps)) {
      items.push({
        ...base,
        delta,
        class: "improvement",
        gating: false,
        detail: `${fmt(b.value)} -> ${fmt(a.value)}`,
      });
    } else {
      counts.unchanged++;
      if (Math.abs(delta) > eps) counts.withinTolerance++;
    }
  }
}

/** Canary ratchet + absolute rule: every detection canary of the run must be caught. */
function compareCanaries(before, after, items, counts) {
  const key = (c) => `canary|${c.oracle}|${c.canary}`;
  const was = new Map((before ?? []).map((c) => [key(c), c]));
  for (const c of after ?? []) {
    const k = key(c);
    const b = was.get(k);
    if (c.caught === null) continue; // measurement-only rows
    if (c.ran === false) {
      items.push({
        key: k,
        group: "canaries",
        check: "canary",
        class: "failure",
        gating: true,
        before: b?.caught ?? "absent",
        after: "not run",
        detail: c.reason ?? "canary did not run",
      });
    } else if (c.caught !== true) {
      items.push({
        key: k,
        group: "canaries",
        check: "canary",
        class: "failure",
        gating: true,
        before: b?.caught ?? "absent",
        after: c.caught,
        detail: "detection canary NOT caught: the oracle is not trusted",
      });
    } else if (!b) {
      items.push({
        key: k,
        group: "canaries",
        check: "canary",
        class: "added",
        gating: false,
        before: "absent",
        after: true,
        detail: "new detection canary, caught",
      });
    } else {
      counts.unchanged++;
    }
  }
  const now = new Set((after ?? []).map(key));
  for (const [k, b] of was) {
    if (!now.has(k) && b.caught !== null && after) {
      items.push({
        key: k,
        group: "canaries",
        check: "canary",
        class: "removed",
        gating: true,
        before: b.caught,
        after: "absent",
        detail: "canary missing from the run",
      });
    }
  }
}

/**
 * Per-word pdf-probe ratchet. Dispatches on the sections' semantics (the caller refused mixed
 * semantics first, see pdfProbeComparability): v1 = k-th occurrence pairs, pdftotext bbox tops;
 * v2 = Chrome-keyed position pairs, PyMuPDF baselines (fidelity/layout-diff/lib/pdf-probe-v2.mjs).
 */
export function comparePdfProbe(before, after, items, counts) {
  const semantics = sectionSemantics(Object.values(after ?? {})[0]);
  if (semantics === 2) comparePdfProbeV2(before, after, items, counts);
  else comparePdfProbeV1(before, after, items, counts);
}

/**
 * pdf-probe v2 (semantics 2). Keys are Chrome words (`p<page>|<text>#<n>`), identical across runs
 * of the same Chrome and templated HTML, so the same key is the same word on both sides.
 *   both paired            |dx|, |dy| may not grow by more than pdf-probe-pt (1 pt); a smaller
 *                          move counts as withinTolerance
 *   paired -> unpaired     regression: the word is missing, on another page than Chrome's, or
 *                          farther than settings.maxDistancePt from every same-text Chrome word
 *   unpaired -> paired     newly-measured
 *   unpaired-chrome /      per-fixture counts (Chrome words vellora lacks / vellora words Chrome
 *   unpaired-vellora       lacks), count class: any increase gates
 *   fixture missing        removed (gates)
 */
function comparePdfProbeV2(before, after, items, counts) {
  const tol = TOLERANCES["pdf-probe-pt"].tol;
  const eps = 1e-9;
  const base = { group: "pdf-probe", check: "pdf-probe" };
  for (const [fixture, a] of Object.entries(after ?? {})) {
    const b = before?.[fixture];
    if (!b) {
      items.push({
        ...base,
        key: `pdf-probe|${fixture}`,
        class: "not-comparable",
        gating: false,
        before: "absent",
        after: `${a.pairs.length} pairs`,
        detail: "baseline has no pdf-probe for this fixture",
      });
      continue;
    }
    const bound = a.settings?.maxDistancePt;
    const was = new Map(b.pairs.map((p) => [p.k, p]));
    const now = new Set(a.pairs.map((p) => p.k));
    for (const p of a.pairs) {
      const key = `pdf-probe|${fixture}|${p.k}`;
      const q = was.get(p.k);
      if (!q) {
        items.push({
          ...base,
          key: `${key}|pairing`,
          class: "newly-measured",
          gating: false,
          before: "unpaired",
          after: `dx ${p.dx} dy ${p.dy}`,
          detail: `Chrome's "${p.text}" (page ${p.page}) now has a vellora counterpart`,
        });
        continue;
      }
      for (const axis of ["dx", "dy"]) {
        const d = Math.abs(p[axis]) - Math.abs(q[axis]);
        const item = {
          ...base,
          key: `${key}|${axis}`,
          tolClass: "pdf-probe-pt",
          tol,
          before: q[axis],
          after: p[axis],
          delta: d,
        };
        if (d > tol + eps) {
          items.push({
            ...item,
            class: "regression",
            gating: true,
            detail: `"${p.text}" |${axis}| ${fmt(Math.abs(q[axis]))} -> ${fmt(Math.abs(p[axis]))} pt vs Chrome (baseline)`,
          });
        } else if (d < -(tol + eps)) {
          items.push({
            ...item,
            class: "improvement",
            gating: false,
            detail: `"${p.text}" |${axis}| ${fmt(Math.abs(q[axis]))} -> ${fmt(Math.abs(p[axis]))} pt`,
          });
        } else {
          counts.unchanged++;
          if (Math.abs(p[axis] - q[axis]) > eps) counts.withinTolerance++;
        }
      }
    }
    for (const q of b.pairs) {
      if (now.has(q.k)) continue;
      items.push({
        ...base,
        key: `pdf-probe|${fixture}|${q.k}|pairing`,
        class: "regression",
        gating: true,
        before: `dx ${q.dx} dy ${q.dy}`,
        after: "unpaired",
        detail: `Chrome's "${q.text}" (page ${q.page}) lost its vellora counterpart: missing, on another page, or more than ${bound ?? "?"} pt away`,
      });
    }
    for (const [field, name, what] of [
      ["unpairedChrome", "unpaired-chrome", "Chrome words vellora lacks"],
      ["unpairedVellora", "unpaired-vellora", "vellora words Chrome lacks"],
    ]) {
      const bv = b.words?.[field];
      const av = a.words?.[field];
      const item = {
        ...base,
        key: `pdf-probe|${fixture}|${name}`,
        tolClass: "count",
        tol: TOLERANCES.count.tol,
        before: bv,
        after: av,
        delta: av - bv,
      };
      if (typeof bv !== "number" || typeof av !== "number") {
        items.push({
          ...item,
          class: "regression",
          gating: true,
          detail: `${what}: count missing`,
        });
      } else if (av - bv > TOLERANCES.count.tol) {
        const was2 = new Set((b[field] ?? []).map((w) => w.k ?? `${w.page}|${w.text}`));
        const added = (a[field] ?? []).filter((w) => !was2.has(w.k ?? `${w.page}|${w.text}`));
        items.push({
          ...item,
          class: "regression",
          gating: true,
          detail: `${what}: ${bv} -> ${av}${
            added.length
              ? ` (e.g. ${added
                  .slice(0, 5)
                  .map((w) => `"${w.text}" p${w.page}`)
                  .join(", ")})`
              : ""
          }`,
        });
      } else if (av < bv) {
        items.push({
          ...item,
          class: "improvement",
          gating: false,
          detail: `${what}: ${bv} -> ${av}`,
        });
      } else counts.unchanged++;
    }
  }
  for (const [fixture, b] of Object.entries(before ?? {})) {
    if (after?.[fixture]) continue;
    items.push({
      ...base,
      key: `pdf-probe|${fixture}`,
      class: "removed",
      gating: true,
      before: `${b.pairs.length} pairs`,
      after: "absent",
      detail: "fixture measured by the baseline's pdf-probe is missing from the run",
    });
  }
}

/** pdf-probe v1 (semantics 1, history): |dx|, |dy| of same-page k-th occurrence pairs, page moves. */
function comparePdfProbeV1(before, after, items, counts) {
  const tol = TOLERANCES["pdf-probe-pt"].tol;
  for (const [fixture, a] of Object.entries(after ?? {})) {
    const b = before?.[fixture];
    if (!b) {
      items.push({
        key: `pdf-probe|${fixture}`,
        group: "pdf-probe",
        check: "pdf-probe",
        class: "not-comparable",
        gating: false,
        before: "absent",
        after: `${a.pairs.length} pairs`,
        detail: "baseline has no pdf-probe for this fixture",
      });
      continue;
    }
    const was = new Map(b.pairs.map((p) => [p.k, p]));
    for (const p of a.pairs) {
      const q = was.get(p.k);
      if (!q) continue;
      const key = `pdf-probe|${fixture}|${p.k}`;
      if (q.samePage && !p.samePage) {
        items.push({
          key,
          group: "pdf-probe",
          check: "pdf-probe",
          class: "regression",
          gating: true,
          before: `page ${q.page}`,
          after: `page ${p.page}`,
          detail: `"${p.text}" moved to another page than Chrome's`,
        });
        continue;
      }
      if (!q.samePage || !p.samePage) continue;
      for (const axis of ["dx", "dy"]) {
        const d = Math.abs(p[axis]) - Math.abs(q[axis]);
        if (d > tol + 1e-9) {
          items.push({
            key: `${key}|${axis}`,
            group: "pdf-probe",
            check: "pdf-probe",
            class: "regression",
            gating: true,
            tolClass: "pdf-probe-pt",
            tol,
            before: q[axis],
            after: p[axis],
            delta: d,
            detail: `"${p.text}" |${axis}| ${fmt(Math.abs(q[axis]))} -> ${fmt(Math.abs(p[axis]))} pt vs Chrome`,
          });
        } else if (d < -(tol + 1e-9)) {
          items.push({
            key: `${key}|${axis}`,
            group: "pdf-probe",
            check: "pdf-probe",
            class: "improvement",
            gating: false,
            tolClass: "pdf-probe-pt",
            tol,
            before: q[axis],
            after: p[axis],
            delta: d,
            detail: `"${p.text}" |${axis}| ${fmt(Math.abs(q[axis]))} -> ${fmt(Math.abs(p[axis]))} pt`,
          });
        } else counts.unchanged++;
      }
    }
    const lost = b.pairs.filter((q) => !a.pairs.some((p) => p.k === q.k)).length;
    if (lost) {
      items.push({
        key: `pdf-probe|${fixture}|unpaired`,
        group: "pdf-probe",
        check: "pdf-probe",
        class: "changed",
        gating: false,
        before: b.pairs.length,
        after: a.pairs.length,
        detail: `${lost} word(s) aligned in the baseline are no longer aligned with Chrome's (text or occurrence count changed)`,
      });
    }
  }
}

/** Absolute checks of the run itself: code checks, steps, layout-diff checks vs the allowlist. */
function absoluteChecks(after, items) {
  for (const c of after.codeChecks ?? []) {
    if (c.status !== "pass") {
      items.push({
        key: `code|${c.id}`,
        group: "code-checks",
        check: "code",
        class: "failure",
        gating: true,
        before: "-",
        after: c.status,
        detail: `${c.command}: exit ${c.exitCode}${c.failures?.length ? `; failing: ${c.failures.join(", ")}` : ""}`,
      });
    }
  }
  for (const s of after.steps ?? []) {
    if (s.status === "error") {
      items.push({
        key: `step|${s.id}`,
        group: "steps",
        check: "step",
        class: "failure",
        gating: true,
        before: "-",
        after: "error",
        detail: s.reason ?? "step errored",
      });
    }
  }
  for (const f of after.fixtures ?? []) {
    const l = f.layoutDiff;
    if (!l || l.status !== "ran") continue;
    for (const id of l.checksUnexpectedFailures ?? l.checksFailed ?? []) {
      items.push({
        key: `layout-diff|${f.key}|${id}`,
        group: "layout-diff checks",
        check: "layout-check",
        class: "failure",
        gating: true,
        before: "-",
        after: "fail",
        detail:
          "layout-diff check failed and is not in fidelity/layout-diff/expected-check-failures.json",
      });
    }
    for (const e of l.checksExpired ?? []) {
      items.push({
        key: `layout-diff|${f.key}|${e.check}`,
        group: "layout-diff checks",
        check: "layout-check",
        class: "failure",
        gating: true,
        before: "expected-fail",
        after: "pass",
        detail: `allowlist entry expired (${e.expires}): the check passes now, remove the entry`,
      });
    }
  }
}

const present = (v) =>
  Boolean(v) && (Array.isArray(v) ? v.length > 0 : Object.keys(v.results ?? v).length > 0);

/**
 * A section the baseline measured and the run lacks would otherwise compare as "nothing to
 * check" (e.g. `--skip code-checks` or `--no-canaries`): REFUSED, like missing WPT outcomes. A
 * fidelity/run-all.mjs RUN must always carry code checks, canaries and crashtests, whatever the
 * baseline has (the Phase A baselines have no code-checks or crashtest record).
 */
export function missingSections(before, after) {
  const out = [];
  const isRun = after.source?.kind === "run";
  const sections = [
    ["codeChecks", "code checks (cargo test, vitest, lint, fidelity tests)", true],
    ["canaries", "oracle canaries", true],
    ["crashtests", "WPT crashtests", true],
    ["pdfProbe", "pdf-probe", false],
  ];
  for (const [field, label, requiredInRun] of sections) {
    const field2 = field === "crashtests" ? (s) => s.crashtests?.results : (s) => s[field];
    if (present(field2(after))) continue;
    if (present(field2(before))) {
      out.push(
        `${label}: the baseline has them, the run does not (a gated run must not skip them)`,
      );
    } else if (isRun && requiredInRun) {
      out.push(`${label}: missing from the run (a gated run must run every step)`);
    }
  }
  return out;
}

function matchesAcceptance(item, entry) {
  if (
    entry.key ? entry.key !== item.key : !(entry.keyPrefix && item.key.startsWith(entry.keyPrefix))
  ) {
    return false;
  }
  if (entry.after === undefined) return true;
  if (typeof entry.after === "number" && typeof item.after === "number") {
    return Math.abs(item.after - entry.after) <= (item.tol ?? 0) + 1e-9;
  }
  return String(entry.after) === String(item.after);
}

/**
 * Compare two snapshots. `accept`: [{ key | keyPrefix, after?, reason, evidence, label? }].
 * Returns the full report object (see report.mjs for rendering).
 */
export function compareSnapshots(before, after, { accept = [] } = {}) {
  const items = [];
  const counts = { unchanged: 0, withinTolerance: 0 };
  const refusals = [];
  const bi = verdictIndex(before.fixtures ?? []);
  const ai = verdictIndex(after.fixtures ?? []);
  compareRows(bi, ai, items, counts);
  compareMetrics(bi, ai, items, counts);

  let wpt = null;
  if (before.wpt?.expectations && after.wpt?.expectations) {
    wpt = compareWpt(before.wpt.expectations, after.wpt.expectations);
    if (!wpt.comparable) refusals.push(`WPT: ${wpt.reason}`);
    for (const i of wpt.items) items.push({ ...i, group: `wpt ${i.suite}`, check: "wpt" });
    counts.unchanged += wpt.unchanged;
  } else if (before.wpt?.expectations && !after.wpt?.expectations) {
    refusals.push(
      `WPT: the baseline has per-test outcomes but the run has none (${after.wpt?.reason ?? "wpt step not run"})`,
    );
  } else if (after.wpt?.expectations) {
    items.push({
      key: "wpt",
      group: "wpt",
      check: "wpt",
      class: "not-comparable",
      gating: false,
      before: "absent",
      after: "outcomes",
      detail: "the baseline has no WPT outcomes",
    });
  }

  let crash = null;
  if (after.crashtests?.results) {
    if (before.crashtests?.results) {
      crash = compareCrashtests(before.crashtests, after.crashtests, CRASH_BAD);
      for (const i of crash.items)
        items.push({ ...i, group: "wpt crashtests", check: "crashtest" });
      counts.unchanged += crash.unchanged;
    } else {
      const bad = Object.entries(after.crashtests.results).filter(([, o]) => CRASH_BAD.includes(o));
      items.push({
        key: "wpt-crash",
        group: "wpt crashtests",
        check: "crashtest",
        class: "not-comparable",
        gating: false,
        before: "absent",
        after: `${bad.length} panic/crash/timeout`,
        detail: `baseline has no crashtest record; the run has ${bad.length} non-ok: ${bad
          .slice(0, 5)
          .map(([t, o]) => `${t} ${o}`)
          .join("; ")}`,
      });
    }
  } else if (before.crashtests?.results) {
    refusals.push(
      `crashtests: the baseline has crashtest outcomes but the run has none (${after.crashtests?.reason ?? "crashtest step not run"})`,
    );
  }

  compareCanaries(before.canaries, after.canaries, items, counts);
  if (after.pdfProbe) {
    // Like WPT's inkCheck/HARNESS_SEMANTICS: sections measured with different semantics or
    // settings are not comparable; the gate refuses instead of producing items.
    const why = pdfProbeComparability(before.pdfProbe, after.pdfProbe);
    if (why) refusals.push(`pdf-probe: ${why}`);
    else comparePdfProbe(before.pdfProbe, after.pdfProbe, items, counts);
  }
  absoluteChecks(after, items);
  refusals.push(...missingSections(before, after));
  if (before.integrity && !before.integrity.ok) {
    refusals.push(`baseline integrity: ${before.integrity.problems.join("; ")}`);
  }

  // Acceptances: only regressions / removals can be accepted; failures never.
  const used = new Set();
  for (const item of items) {
    if (!(item.gating && (item.class === "regression" || item.class === "removed"))) continue;
    const idx = accept.findIndex((e) => matchesAcceptance(item, e));
    if (idx >= 0) {
      used.add(idx);
      const e = accept[idx];
      Object.assign(item, {
        class: "accepted",
        gating: false,
        acceptedAs: { reason: e.reason, evidence: e.evidence, label: e.label ?? null },
      });
    }
  }
  const unusedAcceptances = accept.filter((_, i) => !used.has(i));

  const gatingItems = items.filter((i) => i.gating);
  const verdict = refusals.length ? "REFUSED" : gatingItems.length ? "FAIL" : "PASS";
  const byGroup = {};
  for (const i of items) {
    byGroup[i.group] ??= {};
    byGroup[i.group][i.class] = (byGroup[i.group][i.class] ?? 0) + 1;
  }
  const byClass = {};
  for (const i of items) byClass[i.class] = (byClass[i.class] ?? 0) + 1;
  return {
    schema: "vellora-fidelity/gate-report/1",
    verdict,
    refusals,
    counts: {
      ...byClass,
      gating: gatingItems.length,
      unchanged: counts.unchanged,
      withinTolerance: counts.withinTolerance,
    },
    byGroup,
    wptPerSuite: wpt?.perSuite ?? null,
    items,
    unusedAcceptances,
    tolerances: TOLERANCES,
  };
}
