// Snapshots: the one shape the gate compares. Loaders for
//   (a) a committed baseline directory: the Phase A shape (fidelity/baselines/pin, beta4:
//       manifest.json + fixtures/<key>.json + wpt/expectations-<engine>.json) and the gate shape
//       written by write-baseline.mjs (the same files plus wpt/crashtests.json, pdf-probe/,
//       canaries.json, code-checks.json, metrics.json), and
//   (b) a fidelity/run-all.mjs output directory (summary.json + the step outputs).
//
// Snapshot = { source, provenance, integrity, fixtures[], wpt: { expectations | reason },
//              crashtests | null, pdfProbe | null, canaries | null, codeChecks | null, steps }.
import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { basename, dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { gunzipSync } from "node:zlib";
import {
  classifyCheckFailures,
  loadExpectedFailures,
} from "../layout-diff/lib/expected-failures.mjs";
import { compactProbeV2 } from "../layout-diff/lib/pdf-probe-v2.mjs";
import { comparisonConfig } from "../wpt/lib/provenance.mjs";
import { suspectFlags, unsupportedFeature } from "../wpt/lib/report.mjs";

export const BASELINE_SCHEMA = "vellora-fidelity/baseline/2";

const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

export function readJsonMaybeGz(path) {
  if (existsSync(path)) return JSON.parse(readFileSync(path, "utf8"));
  if (existsSync(`${path}.gz`))
    return JSON.parse(gunzipSync(readFileSync(`${path}.gz`)).toString("utf8"));
  return null;
}

/** Verify manifest.files sha256s; files the manifest does not list are not checked. */
export function verifyIntegrity(dir, manifest) {
  const problems = [];
  for (const [rel, want] of Object.entries(manifest?.files ?? {})) {
    const path = join(dir, rel);
    if (!existsSync(path)) problems.push(`${rel} missing`);
    else if (sha256(readFileSync(path)) !== want)
      problems.push(`${rel} sha256 differs from manifest`);
  }
  return {
    ok: problems.length === 0,
    checked: Object.keys(manifest?.files ?? {}).length,
    problems,
  };
}

/**
 * The allowlist as committed from port/00-start to port/04-block-offset, frozen: snapshots that
 * predate the allowlist are classified with it, so their classification does not drift when the
 * live list changes (port step 05 deleted html_normalize and with it four entries the Phase A
 * baselines still need).
 */
export const PHASE_A_ALLOWLIST_FILE = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "layout-diff",
  "expected-check-failures-phase-a.json",
);

/**
 * Snapshots written before the allowlist existed (Phase A baselines, old runs) carry only
 * layoutDiff.checksFailed: classify them with the frozen allowlist of their era (see
 * PHASE_A_ALLOWLIST_FILE) so the gate applies one rule. Runs and gate-schema baselines carry
 * their own classification, made with the live allowlist when they were measured.
 */
export function withCheckAllowlist(
  fixtures,
  entries = loadExpectedFailures(PHASE_A_ALLOWLIST_FILE),
) {
  return fixtures.map((f) => {
    const l = f.layoutDiff;
    if (!l || l.status !== "ran" || "checksUnexpectedFailures" in l) return f;
    const c = classifyCheckFailures(
      f.fixture ?? f.key,
      { failed: l.checksFailed ?? [], not_run: l.checksNotRun ?? [] },
      entries,
    );
    return {
      ...f,
      layoutDiff: {
        ...l,
        checksExpectedFailures: c.expected,
        checksUnexpectedFailures: c.unexpected,
        checksExpired: c.expired,
        allowlistAppliedBy: "gate/snapshot.mjs (snapshot predates the allowlist)",
      },
    };
  });
}

/**
 * Compact pdf-probe record of a pdf-probe.json. v2 (semantics 2): the Chrome-keyed section of
 * fidelity/layout-diff/lib/pdf-probe-v2.mjs compactProbeV2. v1 (no semantics field, history):
 * one entry per aligned word, keyed by normalized text + occurrence.
 */
export function compactPdfProbe(probe) {
  if ((probe.semantics ?? 1) === 2) return compactProbeV2(probe);
  const seen = new Map();
  const pairs = (probe.pairs ?? []).map((p) => {
    const norm = p.text.normalize("NFC");
    const n = (seen.get(norm) ?? 0) + 1;
    seen.set(norm, n);
    return {
      k: `${norm}#${n}`,
      text: p.text,
      page: p.vellora?.page ?? p.page,
      samePage: p.samePage,
      dx: p.dx_pt ?? p.dx,
      dy: p.dy_pt ?? p.dy,
    };
  });
  return { pages: probe.pages, words: probe.words, pairs };
}

/**
 * EXT-2 missing-token lists backfilled into a committed baseline (gate/backfill-ext2-tokens.mjs,
 * 2026-10-22): `ext2-tokens.json` { schema, rows: { "<fixture key>|<mode>": { <extractor>:
 * { tokens, count, complete } } } }. Baselines written from runs after that date carry the
 * lists in their verdicts (`missingTokens`, combine/verdicts.mjs) and need no backfill.
 */
export const EXT2_TOKENS_FILE = "ext2-tokens.json";
export const EXT2_TOKENS_SCHEMA = "vellora-fidelity/ext2-tokens/1";

/** Attach backfilled EXT-2 token lists to the fixtures' EXT-2 verdicts (verdicts that lack them). */
export function withExt2Tokens(fixtures, doc) {
  if (!doc?.rows) return fixtures;
  return fixtures.map((f) => ({
    ...f,
    verdicts: (f.verdicts ?? []).map((v) => {
      if (v.criterion !== "EXT-2" || v.oracle !== "oracles:text" || v.missingTokens) return v;
      const t = doc.rows[`${f.key}|${v.mode ?? ""}`];
      return t ? { ...v, missingTokens: t, missingTokensFrom: EXT2_TOKENS_FILE } : v;
    }),
  }));
}

/** Directory where re-scored baselines keep their pdf-probe v1 section (history, not gated). */
export const PDF_PROBE_V1_DIR = join("attachments", "pdf-probe-v1");

function readProbeDir(path) {
  const out = {};
  for (const f of readdirSync(path)
    .filter((x) => x.endsWith(".json"))
    .sort()) {
    out[f.replace(/\.json$/, "")] = JSON.parse(readFileSync(join(path, f), "utf8"));
  }
  return out;
}

/**
 * Load a committed baseline directory (either schema). `pdfProbe`: "current" (default) loads the
 * gated section (`pdf-probe/`, else a Phase A `layout-diff-ab/` A/B probe); "v1" loads the
 * semantics-1 section the baseline was gated with when it was written (`attachments/pdf-probe-v1/`
 * after a v2 re-score, else `pdf-probe/` or `layout-diff-ab/` when those are still v1), so the
 * committed-data tests can reproduce a historical verdict exactly.
 */
export function loadBaselineDir(dir, { pdfProbe: which = "current", ext2Tokens = true } = {}) {
  const manifest = JSON.parse(readFileSync(join(dir, "manifest.json"), "utf8"));
  const fixtures = readdirSync(join(dir, "fixtures"))
    .filter((f) => f.endsWith(".json"))
    .sort()
    .map((f) => JSON.parse(readFileSync(join(dir, "fixtures", f), "utf8")));
  const wptDir = join(dir, "wpt");
  const expFile = existsSync(wptDir)
    ? readdirSync(wptDir).find((f) => /^expectations-.*\.json$/.test(f))
    : null;
  const expectations = expFile ? JSON.parse(readFileSync(join(wptDir, expFile), "utf8")) : null;
  const crashtests = existsSync(join(wptDir, "crashtests.json"))
    ? JSON.parse(readFileSync(join(wptDir, "crashtests.json"), "utf8"))
    : null;
  let pdfProbe = null;
  const v1Dir = join(dir, PDF_PROBE_V1_DIR);
  const isV1 = (m) => Object.values(m).every((x) => (x.semantics ?? 1) === 1);
  if (which === "v1" && existsSync(v1Dir)) {
    pdfProbe = readProbeDir(v1Dir);
  } else if (existsSync(join(dir, "pdf-probe"))) {
    pdfProbe = readProbeDir(join(dir, "pdf-probe"));
    if (which === "v1" && !isV1(pdfProbe)) pdfProbe = null;
  }
  if (!pdfProbe && existsSync(join(dir, "layout-diff-ab"))) {
    // Phase A beta4 baseline: its A/B pdf-probe of the SAME build is layout-diff-ab/
    // <fixture>-<dir name>.pdf-probe.json.gz (4 legacy fixtures; produced by pdf-probe.mjs with
    // the same print options the shared reference driver uses). Semantics 1.
    const label = basename(dir);
    const suffix = `-${label}.pdf-probe.json.gz`;
    for (const f of readdirSync(join(dir, "layout-diff-ab"))
      .filter((x) => x.endsWith(suffix))
      .sort()) {
      pdfProbe ??= {};
      pdfProbe[f.slice(0, -suffix.length)] = compactPdfProbe(
        JSON.parse(gunzipSync(readFileSync(join(dir, "layout-diff-ab", f))).toString("utf8")),
      );
    }
  }
  const canaries =
    readJsonMaybeGz(join(dir, "canaries.json"))?.canaries ?? manifest.canaries ?? null;
  return {
    source: { kind: "baseline", dir, schema: manifest.schema, name: manifest.name ?? null },
    provenance: manifest.provenance ?? null,
    manifest,
    integrity: verifyIntegrity(dir, manifest),
    // ext2Tokens false: the verdicts as gated when the baseline was written (history tests).
    fixtures: withExt2Tokens(
      withCheckAllowlist(fixtures),
      ext2Tokens ? readJsonMaybeGz(join(dir, EXT2_TOKENS_FILE)) : null,
    ),
    wpt: expectations
      ? { expectations, file: join("wpt", expFile) }
      : { expectations: null, reason: "baseline has no wpt/expectations-*.json" },
    crashtests,
    pdfProbe,
    canaries,
    codeChecks: readJsonMaybeGz(join(dir, "code-checks.json"))?.checks ?? null,
    steps: [],
  };
}

/** Expectations (schema 2) built from a wpt/run.mjs results.json, for runs without outcomes.json. */
export function expectationsFromResults(results) {
  const out = {};
  const suspect = {};
  const unsupported = {};
  let ink = false;
  for (const r of [...results.tests].sort((a, b) => (a.test < b.test ? -1 : 1))) {
    out[r.test] = r.outcome;
    if (r.inkCheck) ink = true;
    if (r.outcome === "pass") {
      const flags = suspectFlags(r);
      if (flags.length) suspect[r.test] = flags.join(",");
    }
    if (r.outcome === "unsupported") unsupported[r.test] = unsupportedFeature(r);
  }
  return {
    schema: 2,
    engine: results.env?.engine?.id,
    blitzDom: results.env?.engine?.blitzDom,
    vellora: results.env?.vellora?.commit,
    wptCommit: results.env?.wpt?.commit,
    generated: results.env?.date,
    suites: results.config?.suites,
    comparison: comparisonConfig(results.config ?? {}),
    inkCheck: ink ? `chrome ${results.chrome?.browserVersion}` : "not-run",
    results: out,
    suspectPasses: suspect,
    unsupportedFeatures: unsupported,
    derivedFrom: "results.json (gate/snapshot.mjs expectationsFromResults)",
  };
}

/** Load a run-all output directory. */
export function loadRunDir(dir) {
  const summary = JSON.parse(readFileSync(join(dir, "summary.json"), "utf8"));
  let wpt;
  const outcomes = join(dir, "wpt", "outcomes.json");
  const results = join(dir, "wpt", "results.json");
  if (existsSync(outcomes)) {
    wpt = { expectations: JSON.parse(readFileSync(outcomes, "utf8")), file: "wpt/outcomes.json" };
    // Runs before outcomes.json recorded unsupportedFeatures: take them from results.json.
    if (!wpt.expectations.unsupportedFeatures && existsSync(results)) {
      wpt.expectations.unsupportedFeatures = expectationsFromResults(
        JSON.parse(readFileSync(results, "utf8")),
      ).unsupportedFeatures;
      wpt.unsupportedFeaturesFrom = "wpt/results.json";
    }
  } else if (existsSync(results)) {
    wpt = {
      expectations: expectationsFromResults(JSON.parse(readFileSync(results, "utf8"))),
      file: "wpt/results.json",
    };
  } else {
    const step = summary.steps?.find((s) => s.id === "wpt");
    wpt = { expectations: null, reason: step?.reason ?? "no wpt/outcomes.json or results.json" };
  }
  const ctFile = join(dir, "wpt-crashtests", "crashtests.json");
  const crashtests = existsSync(ctFile)
    ? JSON.parse(readFileSync(ctFile, "utf8"))
    : {
        results: null,
        reason:
          summary.steps?.find((s) => s.id === "wpt-crashtests")?.reason ?? "crashtest step not run",
      };
  let pdfProbe = null;
  const ld = join(dir, "layout-diff");
  if (existsSync(ld)) {
    for (const fixture of readdirSync(ld)) {
      const p = join(ld, fixture, "run-all", "pdf-probe.json");
      if (existsSync(p)) {
        pdfProbe ??= {};
        pdfProbe[fixture] = compactPdfProbe(JSON.parse(readFileSync(p, "utf8")));
      }
    }
  }
  const code = readJsonMaybeGz(join(dir, "code-checks", "summary.json"));
  return {
    source: { kind: "run", dir, schema: summary.schema, runId: summary.runId },
    provenance: {
      runId: summary.runId,
      date: summary.date,
      dateIso: summary.dateIso,
      command: summary.command,
      environment: summary.environment,
    },
    summary,
    integrity: { ok: true, checked: 0, problems: [] },
    fixtures: withCheckAllowlist(summary.fixtures ?? []),
    wpt,
    crashtests,
    pdfProbe,
    canaries: summary.canaries ?? null,
    codeChecks: code?.checks ?? null,
    steps: summary.steps ?? [],
  };
}

/** Either loader, by what the directory contains. */
export function loadSnapshot(dir) {
  if (existsSync(join(dir, "manifest.json"))) return loadBaselineDir(dir);
  if (existsSync(join(dir, "summary.json"))) return loadRunDir(dir);
  throw new Error(
    `${dir} is neither a baseline (manifest.json) nor a run-all output (summary.json)`,
  );
}

export const relTo = (root, p) => relative(root, p) || ".";
