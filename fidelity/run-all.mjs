#!/usr/bin/env node
// Single entry point for the Phase A fidelity oracles. Runs, in this order and each as its own
// child process (so one tool crashing never hides another's results):
//
//   wpt              fidelity/wpt/run.mjs                  default WPT reftest suites + ratchet
//   corpus           fidelity/corpus/render-corpus.mjs     corpus fixtures vs ACCEPTANCE criteria
//                    fidelity/corpus/audit-existing-boleto.mjs   BOL-D1..D3 on fixtures/boleto
//   oracles-fixtures fidelity/oracles/run-fixtures.mjs     legacy fixtures x {plain, pdfa} + canaries
//   oracles-corpus   fidelity/oracles/run.mjs per corpus PDF: plain (all oracles, veraPDF as a
//                    negative control) and a PDF/A-2b render (qpdf + veraPDF), rendered here
//   layout-diff      fidelity/layout-diff/run.mjs          per-layer attribution, every fixture
//
// then writes ONE combined summary: <out>/summary.json (+ summary.md) with the environment, the
// exact commands, per-step exit codes, per-fixture per-oracle verdicts keyed by the criterion IDs
// of fidelity/ACCEPTANCE.md, and per-WPT-directory pass rates.
//
//   node fidelity/run-all.mjs [--out <dir>] [--chrome <path> | --no-chrome] [--wpt-chrome]
//     [--only wpt,corpus,oracles-fixtures,oracles-corpus,layout-diff] [--skip <steps>]
//     [--wpt-arg <arg>]... [--tools-image <ref>] [--no-canaries] [--gate]
//   npm --prefix fidelity run all -- [same options]
//
// --chrome      Chrome for every Chromium reference (default $VELLORA_FIDELITY_CHROME, else the
//               local macOS Chrome). Local Chrome results are INDICATIVE; CI passes a pinned
//               Chrome for Testing (fidelity/wpt/install-chrome.mjs, layout-diff/install-chrome.mjs).
// --wpt-chrome  also run the WPT Chrome print oracle (about 9 more minutes); without it the WPT
//               ratchet still runs (it only needs the committed baseline), but the Chrome-derived
//               suspect-pass flags are absent, so passRateClean is higher than with it.
// --wpt-arg     extra argument passed through to wpt/run.mjs (repeatable), e.g. a subset:
//               --wpt-arg css/CSS2/tables  or  --wpt-arg --filter --wpt-arg <regex>.
// --tools-image the oracles' Docker tools image (default $VELLORA_FIDELITY_TOOLS_IMAGE, else
//               vellora-fidelity-tools:local). Build it from the committed recipe first.
// --gate        exit 3 when WPT-2 (ratchet: 0 regressions) FAILS. Without it the run only measures.
//
// Exit code: 0 = every selected step ran and wrote its summary (verdicts may still contain FAIL:
// Phase A measures, it does not gate); 1 = a step crashed or did not write its summary file;
// 3 = --gate and WPT-2 failed. layout-diff's own exit 2 (a self-consistency check failed, e.g.
// receipt's known html_normalize defect) is recorded per fixture, not treated as a crash.
//
// Nothing here changes how vellora renders: every step only calls the public renderPdf / the
// debug layout dump, and the PDF/A variant is rendered with the corpus' own fixed options.
import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import {
  closeSync,
  existsSync,
  mkdirSync,
  openSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { DEFAULT_CHROME, captureEnvironment, portable, preflight } from "./combine/env.mjs";
import {
  PT_PER_MM,
  REF_W,
  annotateFontParity,
  corpusKey,
  failedControls,
  fromBoletoAudit,
  fromCorpusEntry,
  fromLayoutDiffRow,
  fromOracleRecord,
  fromWpt,
  pdfaDeterminism,
  tally,
} from "./combine/verdicts.mjs";
import { FIXTURE_IDS as LEGACY_FIXTURE_IDS } from "./oracles/lib/html-prep.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "..");
const STEP_IDS = ["wpt", "corpus", "oracles-fixtures", "oracles-corpus", "layout-diff"];
/** Fixtures under fixtures/ that are deliberately not measured, with the reason. */
const EXCLUDED_FIXTURES = {
  "invoice-broken":
    "negative fixture: the strict gate must REJECT it (asserted by packages/vellora tests); it has no rendering to measure",
  fonts: "not a fixture (bundled font files)",
};
const VERAPDF_IMAGE_DEFAULT =
  "verapdf/cli:v1.30.3@sha256:d565095c67a083e693aebf7d1a15784007370571053fc1aa5b502665b9a78f9c";

function parseArgs(argv) {
  const opts = {
    out: null,
    chrome: process.env.VELLORA_FIDELITY_CHROME ?? DEFAULT_CHROME,
    wptChrome: false,
    only: STEP_IDS,
    skip: [],
    wptArgs: [],
    toolsImage: process.env.VELLORA_FIDELITY_TOOLS_IMAGE ?? "vellora-fidelity-tools:local",
    canaries: true,
    gate: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const next = () => {
      if (argv[i + 1] === undefined) throw new Error(`${a} needs a value`);
      return argv[++i];
    };
    if (a === "--out") opts.out = resolve(next());
    else if (a === "--chrome") opts.chrome = resolve(next());
    else if (a === "--no-chrome") opts.chrome = null;
    else if (a === "--wpt-chrome") opts.wptChrome = true;
    else if (a === "--only") opts.only = next().split(",").filter(Boolean);
    else if (a === "--skip") opts.skip = next().split(",").filter(Boolean);
    else if (a === "--wpt-arg") opts.wptArgs.push(next());
    else if (a === "--tools-image") opts.toolsImage = next();
    else if (a === "--no-canaries") opts.canaries = false;
    else if (a === "--gate") opts.gate = true;
    else if (a === "--help" || a === "-h") opts.help = true;
    else throw new Error(`unknown option ${a} (see the header of fidelity/run-all.mjs)`);
  }
  for (const s of [...opts.only, ...opts.skip]) {
    if (!STEP_IDS.includes(s)) throw new Error(`unknown step ${s} (${STEP_IDS.join(", ")})`);
  }
  return opts;
}

const readJson = (path) => {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch {
    return null;
  }
};
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
const rel = (p) => relative(repoRoot, p) || ".";
const quote = (v) => (/^[\w@%+=:,./-]+$/.test(v) ? v : `'${String(v).replace(/'/g, "'\\''")}'`);

/**
 * Run `node <script> ...args` from the repo root, stdout+stderr to <logs>/<id>.log. Resolves to the
 * step record; `outputs` are the files the step must have written for its status to be "ok".
 */
function runNode({ id, script, args = [], env = {}, outputs = [], logDir, timeoutMin = 90 }) {
  mkdirSync(logDir, { recursive: true });
  const logPath = join(logDir, `${id.replace(/[^\w.-]+/g, "_")}.log`);
  const envText = Object.entries(env)
    .map(([k, v]) => `${k}=${quote(v)}`)
    .join(" ");
  const command = `${envText ? `${envText} ` : ""}node ${[script, ...args].map(quote).join(" ")}`;
  const started = Date.now();
  process.stdout.write(`run-all: [${id}] ${portable(command, repoRoot)}\n`);
  return new Promise((done) => {
    const fd = openSync(logPath, "w");
    const child = spawn(process.execPath, [join(repoRoot, script), ...args], {
      cwd: repoRoot,
      env: { ...process.env, ...env },
      stdio: ["ignore", fd, fd],
    });
    const timer = setTimeout(() => child.kill("SIGKILL"), timeoutMin * 60_000);
    const finish = (exitCode, signal, error) => {
      clearTimeout(timer);
      closeSync(fd);
      const missing = outputs.filter((p) => !existsSync(p));
      const status = !error && missing.length === 0 ? "ok" : "error";
      const reason = error
        ? `spawn failed: ${error.message}`
        : missing.length
          ? `exit ${exitCode ?? signal}; expected output missing: ${missing.map(rel).join(", ")} (see ${rel(logPath)})`
          : null;
      const durationS = Math.round((Date.now() - started) / 100) / 10;
      process.stdout.write(
        `run-all: [${id}] ${status} (exit ${exitCode ?? signal}, ${durationS}s)${reason ? ` ${reason}` : ""}\n`,
      );
      done({ id, command, exitCode, signal, status, reason, durationS, log: logPath, outputs });
    };
    child.on("error", (e) => finish(null, null, e));
    child.on("exit", (code, signal) => finish(code, signal, null));
  });
}

function notRun(id, reason) {
  process.stdout.write(`run-all: [${id}] not-run: ${reason}\n`);
  return { id, status: "not-run", reason };
}

/** Fixture directories under fixtures/ (index.html + data.json), sorted. */
function discoverFixtures() {
  const dir = join(repoRoot, "fixtures");
  return readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .filter((d) => existsSync(join(dir, d, "index.html")) && existsSync(join(dir, d, "data.json")))
    .sort();
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (opts.help) {
    const text = readFileSync(fileURLToPath(import.meta.url), "utf8").split("\n");
    process.stdout.write(
      `${text
        .slice(1)
        .filter((l, i, all) => all.slice(0, i + 1).every((x) => x.startsWith("//")))
        .map((l) => l.replace(/^\/\/ ?/, ""))
        .join("\n")}\n`,
    );
    return;
  }
  const selected = STEP_IDS.filter((s) => opts.only.includes(s) && !opts.skip.includes(s));
  const runId = new Date()
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d+Z$/, "Z");
  const outDir = opts.out ?? join(repoRoot, "fidelity", "results", "run-all", runId);
  mkdirSync(outDir, { recursive: true });
  const logDir = join(outDir, "logs");
  const command = `node fidelity/run-all.mjs ${process.argv.slice(2).map(quote).join(" ")}`.trim();
  const verapdfImage = process.env.VELLORA_FIDELITY_VERAPDF_IMAGE ?? VERAPDF_IMAGE_DEFAULT;

  const env = await captureEnvironment({
    repoRoot,
    chrome: opts.chrome,
    toolsImage: opts.toolsImage,
    verapdfImage,
    command,
  });
  const checks = preflight({ repoRoot, env, chrome: opts.chrome });
  for (const c of checks) {
    process.stdout.write(`run-all: preflight ${c.ok ? "ok  " : "FAIL"} ${c.id}: ${c.detail}\n`);
  }
  const blockedBy = (step) =>
    checks.filter((c) => c.blocks.includes(step)).map((c) => `${c.id}: ${c.detail}`);
  const chromeOk = Boolean(opts.chrome && existsSync(opts.chrome));
  const chromeEnv = chromeOk
    ? {
        VELLORA_ORACLE_CHROME: opts.chrome,
        VELLORA_CHROME: opts.chrome,
        VELLORA_FIDELITY_CHROME: opts.chrome,
      }
    : {};
  const toolEnv = {
    VELLORA_FIDELITY_TOOLS_IMAGE: opts.toolsImage,
    VELLORA_FIDELITY_VERAPDF_IMAGE: verapdfImage,
  };

  const steps = [];
  const dirs = {
    wpt: join(outDir, "wpt"),
    corpus: join(outDir, "corpus"),
    oraclesFixtures: join(outDir, "oracles", "fixtures"),
    oraclesCorpus: join(outDir, "oracles", "corpus"),
    layoutDiff: join(outDir, "layout-diff"),
  };
  const gate = (id) => {
    if (!selected.includes(id)) return "not selected (--only/--skip)";
    const b = blockedBy(id);
    return b.length ? `prerequisite failed: ${b.join("; ")}` : null;
  };

  // 1. WPT reftests (default suites unless --wpt-arg narrows them) + ratchet vs the baseline.
  {
    const why = gate("wpt");
    const args = ["--out", dirs.wpt, ...opts.wptArgs];
    if (opts.wptChrome && chromeOk) args.push("--chrome", opts.chrome);
    steps.push(
      why
        ? notRun("wpt", why)
        : await runNode({
            id: "wpt",
            script: "fidelity/wpt/run.mjs",
            args,
            outputs: [join(dirs.wpt, "summary.json")],
            logDir,
          }),
    );
  }

  // 2. Corpus: ACCEPTANCE criteria per corpus fixture (+ the audit of the legacy boleto data).
  {
    const why = gate("corpus");
    if (why) {
      steps.push(notRun("corpus", why));
    } else {
      steps.push(
        await runNode({
          id: "corpus",
          script: "fidelity/corpus/render-corpus.mjs",
          args: ["--out", dirs.corpus, ...(chromeOk ? [] : ["--no-chrome"])],
          env: chromeEnv,
          outputs: [join(dirs.corpus, "report.json")],
          logDir,
        }),
      );
      const auditStep = await runNode({
        id: "corpus-audit-existing-boleto",
        script: "fidelity/corpus/audit-existing-boleto.mjs",
        outputs: [],
        logDir,
      });
      // The audit prints its JSON report on stdout (= the log file).
      const audit = readJson(auditStep.log);
      if (audit)
        writeFileSync(join(dirs.corpus, "audit-existing-boleto.json"), readFileSync(auditStep.log));
      else Object.assign(auditStep, { status: "error", reason: "stdout is not the JSON report" });
      steps.push(auditStep);
    }
  }
  const corpusReport = readJson(join(dirs.corpus, "report.json"));
  const audit = readJson(join(dirs.corpus, "audit-existing-boleto.json"));

  // 3. Oracles over the legacy fixtures (plain + PDF/A-2b, canaries).
  {
    const why = gate("oracles-fixtures");
    steps.push(
      why
        ? notRun("oracles-fixtures", why)
        : await runNode({
            id: "oracles-fixtures",
            script: "fidelity/oracles/run-fixtures.mjs",
            args: ["--out", dirs.oraclesFixtures, ...(opts.canaries ? [] : ["--no-canaries"])],
            env: { ...chromeEnv, ...toolEnv },
            outputs: [join(dirs.oraclesFixtures, "summary.json")],
            logDir,
          }),
    );
  }
  const oraclesSummary = readJson(join(dirs.oraclesFixtures, "summary.json"));
  // The oracles' own legacy list: these fixtures always appear (as NOT-RUN when the step did not).
  const legacyIds = [...LEGACY_FIXTURE_IDS];

  // 4. Oracles over every corpus PDF: the corpus' own plain render, plus a PDF/A-2b render.
  const pdfaRenders = {};
  {
    const why = gate("oracles-corpus");
    if (why) {
      steps.push(notRun("oracles-corpus", why));
    } else if (!corpusReport) {
      steps.push(notRun("oracles-corpus", "no corpus report.json to take the PDFs from"));
    } else {
      const vellora = await import(
        pathToFileURL(join(repoRoot, "packages", "vellora", "dist", "index.js")).href
      );
      const { fixtureImages, renderOptions } = await import("./corpus/lib/fixture-io.mjs");
      for (const entry of corpusReport.fixtures) {
        const key = corpusKey(entry);
        const work = join(dirs.corpus, key);
        const dir = join(dirs.oraclesCorpus, key);
        if (entry.vellora?.strict !== "accepted") {
          steps.push(notRun(`oracles-corpus:${key}`, "vellora rejected the fixture (strict gate)"));
          continue;
        }
        mkdirSync(join(dir, "plain"), { recursive: true });
        const fxDir = join(repoRoot, "fixtures", entry.id);
        const data = JSON.parse(readFileSync(join(fxDir, entry.data), "utf8"));
        const args = [
          "--pdf",
          join(work, "vellora.pdf"),
          "--html",
          join(work, "templated.html"),
          "--base-dir",
          fxDir,
          "--class",
          entry.class,
          "--no-pdfa",
          "--out",
          join(dir, "plain"),
        ];
        if (entry.class === "boleto" && data.expected?.barcodeDigits) {
          const expectPath = join(dir, "expect.json");
          writeFileSync(
            expectPath,
            `${JSON.stringify({ barcode: { digits: data.expected.barcodeDigits }, linhaDigitavel: data.expected.linhaDigits }, null, 2)}\n`,
          );
          args.push("--expect", expectPath);
        }
        steps.push(
          await runNode({
            id: `oracles-corpus:${key}:plain`,
            script: "fidelity/oracles/run.mjs",
            args,
            env: { ...chromeEnv, ...toolEnv },
            outputs: [join(dir, "plain", "result.json")],
            logDir,
          }),
        );
        // PDF/A-2b variant: same html/data/options as the corpus render, plus pdfa.
        mkdirSync(join(dir, "pdfa"), { recursive: true });
        const html = readFileSync(join(fxDir, "index.html"), "utf8");
        const options = { ...renderOptions(fixtureImages(fxDir)), pdfa: "PDF/A-2b" };
        try {
          const a = await vellora.renderPdf(html, data, options);
          const b = await vellora.renderPdf(html, data, options);
          writeFileSync(join(dir, "pdfa", "vellora.pdf"), a);
          pdfaRenders[key] = { identical: sha256(a) === sha256(b), sha256: sha256(a) };
        } catch (e) {
          steps.push(notRun(`oracles-corpus:${key}:pdfa`, `PDF/A render failed: ${e.message}`));
          continue;
        }
        steps.push(
          await runNode({
            id: `oracles-corpus:${key}:pdfa`,
            script: "fidelity/oracles/run.mjs",
            args: [
              "--pdf",
              join(dir, "pdfa", "vellora.pdf"),
              "--pdfa",
              "PDF/A-2b",
              "--oracles",
              "qpdf,verapdf",
              "--out",
              join(dir, "pdfa"),
            ],
            env: toolEnv,
            outputs: [join(dir, "pdfa", "result.json")],
            logDir,
          }),
        );
      }
    }
  }

  // 5. layout-diff: per-layer attribution for every measured fixture (legacy + corpus ids).
  const corpusIds = (corpusReport?.fixtures ?? [])
    .map((f) => f.id)
    .filter((v, i, a) => a.indexOf(v) === i);
  const allIds = [...new Set([...legacyIds, ...corpusIds])];
  {
    const why = gate("layout-diff");
    steps.push(
      why
        ? notRun("layout-diff", why)
        : await runNode({
            id: "layout-diff",
            script: "fidelity/layout-diff/run.mjs",
            args: [
              "--fixtures",
              allIds.join(","),
              "--label",
              "run-all",
              "--out",
              dirs.layoutDiff,
              ...(chromeOk ? ["--chrome", opts.chrome] : []),
            ],
            outputs: [join(dirs.layoutDiff, "summary-run-all.json")],
            logDir,
          }),
    );
  }
  const layoutSummary = readJson(join(dirs.layoutDiff, "summary-run-all.json"));

  // 6. Combine.
  const wptSummary = readJson(join(dirs.wpt, "summary.json"));
  const wptRatchet = readJson(join(dirs.wpt, "ratchet.json"));
  const wpt = fromWpt(wptSummary, wptRatchet);
  const layoutRow = (id) => layoutSummary?.fixtures?.find((f) => f.fixture === id);
  const layoutFor = (id) => {
    if (!layoutSummary) {
      const step = steps.find((s) => s.id === "layout-diff");
      return { status: "not-run", reason: step?.reason ?? "layout-diff did not run" };
    }
    return fromLayoutDiffRow(layoutRow(id));
  };
  const oracleRecord = (...p) => readJson(join(...p, "result.json"));

  const fixtures = [];
  for (const id of legacyIds) {
    const verdicts = [];
    for (const mode of ["plain", "pdfa"]) {
      const rec = oracleRecord(dirs.oraclesFixtures, id, mode);
      verdicts.push(...fromOracleRecord(rec, { mode, docClass: id }));
    }
    if (id === "boleto" && audit) verdicts.push(...fromBoletoAudit(audit));
    const layoutDiff = layoutFor(id);
    fixtures.push({
      key: id,
      fixture: id,
      variant: "data.json",
      class: id,
      diagnostic: false,
      sources: ["oracles/run-fixtures.mjs", ...(id === "boleto" ? ["corpus/audit"] : [])],
      verdicts: annotateFontParity(verdicts, layoutDiff),
      layoutDiff,
    });
  }
  for (const entry of corpusReport?.fixtures ?? []) {
    const key = corpusKey(entry);
    const verdicts = [...fromCorpusEntry(entry)];
    const plain = oracleRecord(dirs.oraclesCorpus, key, "plain");
    const pdfa = oracleRecord(dirs.oraclesCorpus, key, "pdfa");
    if (plain || pdfa) {
      verdicts.push(...fromOracleRecord(plain, { mode: "plain", docClass: entry.class }));
      verdicts.push(...fromOracleRecord(pdfa, { mode: "pdfa", docClass: entry.class }));
      verdicts.push(pdfaDeterminism(pdfaRenders[key]));
    } else {
      const step = steps.find(
        (s) => s.id === "oracles-corpus" || s.id.startsWith(`oracles-corpus:${key}`),
      );
      verdicts.push({
        criterion: "oracles",
        oracle: "oracles",
        status: "NOT-RUN",
        value: step?.reason ?? "oracles did not run on this PDF",
        kind: "criterion",
      });
    }
    // layout-diff renders data.json only, so a data variant has no attribution of its own; its
    // font-parity result (same template, same fonts) still applies to the variant's references.
    const baseLayout = layoutFor(entry.id);
    fixtures.push({
      key,
      fixture: entry.id,
      variant: entry.data,
      variantLabel: entry.variant,
      class: entry.class,
      diagnostic: Boolean(entry.diagnostic),
      sources: ["corpus/render-corpus.mjs", "oracles/run.mjs"],
      verdicts: annotateFontParity(verdicts, baseLayout),
      layoutDiff:
        entry.data === "data.json"
          ? baseLayout
          : { status: "not-run", reason: "layout-diff measures data.json only (variant)" },
    });
  }
  const measured = new Set(fixtures.map((f) => f.fixture));
  const uncovered = discoverFixtures()
    .filter((d) => !measured.has(d) && !(d in EXCLUDED_FIXTURES))
    .map((d) => ({
      fixture: d,
      reason: "not in the oracles' legacy list nor in corpus/corpus.json",
    }));

  const crashed = steps.filter((s) => s.status === "error");
  const summary = {
    schema: "vellora-fidelity/run-all/1",
    runId,
    date: env.date,
    dateIso: env.dateIso,
    command,
    environment: env,
    preflight: checks,
    acceptance: {
      file: "fidelity/ACCEPTANCE.md",
      sha256: sha256(readFileSync(join(here, "ACCEPTANCE.md"))),
      mapping:
        "DESIGN TARGET (integration mapping): corpus verdicts are copied by criterion ID; oracles map qpdf->PDF-Q1 (warnings fail), veraPDF on the PDF/A render->PDF-A1 (on the plain render it is a negative control, kind 'control', excluded from totals), text->EXT-2 (all body tokens vs Chrome's PDF), copy-paste->EXT-3, barcode->BOL-B1 (second decoder pair), layout pages->REF-P, layout consensus->REF-W; WPT pin->WPT-1, ratchet->WPT-2. layout-diff is attribution only (no PASS/FAIL).",
      refW: {
        consensusTolPt: REF_W.consensusTolPt,
        maxMm: REF_W.maxMm,
        p95Mm: REF_W.p95Mm,
        ptPerMm: PT_PER_MM,
      },
    },
    steps: steps.map((s) => ({
      ...s,
      log: s.log ? rel(s.log) : undefined,
      outputs: s.outputs?.map(rel),
    })),
    totals: {
      all: tally(fixtures),
      excludingDiagnostic: tally(fixtures, { includeDiagnostic: false }),
      failedControls: failedControls(fixtures),
      stepsByStatus: steps.reduce((m, s) => {
        m[s.status] = (m[s.status] ?? 0) + 1;
        return m;
      }, {}),
    },
    fixtures,
    excludedFixtures: EXCLUDED_FIXTURES,
    uncoveredFixtures: uncovered,
    wpt,
    canaries: oraclesSummary?.canaries?.map((c) => ({
      oracle: c.oracle,
      canary: c.canary,
      ran: c.ran,
      caught: c.caught,
      reason: c.reason,
    })),
    outputs: Object.fromEntries(Object.entries(dirs).map(([k, v]) => [k, rel(v)])),
  };
  const portableSummary = portable(summary, repoRoot);
  writeFileSync(join(outDir, "summary.json"), `${JSON.stringify(portableSummary, null, 2)}\n`);
  writeFileSync(join(outDir, "summary.md"), renderMarkdown(portableSummary));
  process.stdout.write(`run-all: summary ${join(outDir, "summary.json")}\n`);
  const t = summary.totals.excludingDiagnostic.counts;
  process.stdout.write(
    `run-all: verdicts (non-diagnostic) ${Object.entries(t)
      .map(([k, v]) => `${k} ${v}`)
      .join(
        ", ",
      )}; WPT pass ${wpt.totals?.passRate ?? "-"}% of ${wpt.totals?.reftests ?? 0}; ${crashed.length} step(s) errored\n`,
  );
  if (crashed.length) process.exitCode = 1;
  else if (opts.gate && wpt.criteria.find((c) => c.criterion === "WPT-2")?.status === "FAIL") {
    process.exitCode = 3;
  }
}

function renderMarkdown(s) {
  const esc = (v) =>
    String(v ?? "")
      .replace(/\|/g, "\\|")
      .replace(/\n/g, " ");
  const lines = [
    "# Fidelity run-all summary",
    "",
    `Generated by \`fidelity/run-all.mjs\` (${s.environment.authority}). Criterion IDs: \`fidelity/ACCEPTANCE.md\`.`,
    `Mapping: ${s.acceptance.mapping}`,
    "",
    "| Field | Value |",
    "|---|---|",
    `| date | ${esc(s.date)} |`,
    `| command | \`${esc(s.command)}\` |`,
    `| os / cpu | ${esc(s.environment.os)} / ${esc(s.environment.cpu)} |`,
    `| node / rustc | ${esc(s.environment.node)} / ${esc(s.environment.rustc)} |`,
    `| chrome | ${esc(s.environment.chrome.version)} |`,
    `| poppler | ${esc(s.environment.poppler.pdftoppm)} |`,
    `| python | ${esc(s.environment.python.interpreter)} |`,
    `| tools image | ${esc(s.environment.docker.toolsImage.image)} ${esc(s.environment.docker.toolsImage.id ?? s.environment.docker.toolsImage.reason)} |`,
    `| veraPDF image | ${esc(s.environment.docker.verapdfImage.id ?? s.environment.docker.verapdfImage.reason)} |`,
    `| git | ${esc(s.environment.git.branch)} ${esc(s.environment.git.head)} (${esc(s.environment.git.dirtyEntries)} dirty entries) |`,
    `| blitz | ${esc(s.environment.blitz?.version)} ${esc(s.environment.blitz?.source)} |`,
    "",
    "## Steps",
    "",
    "| step | status | exit | seconds | reason |",
    "|---|---|---|---|---|",
    ...s.steps.map(
      (x) =>
        `| ${esc(x.id)} | ${esc(x.status)} | ${esc(x.exitCode ?? x.signal ?? "")} | ${esc(x.durationS ?? "")} | ${esc(x.reason ?? "")} |`,
    ),
    "",
    "## Verdict totals (criteria only; controls excluded)",
    "",
    "| scope | PASS | FAIL | WARN | INFO | N/A | NOT-RUN |",
    "|---|---|---|---|---|---|---|",
    ...[
      ["all fixtures", s.totals.all.counts],
      ["excluding DIAGNOSTIC variants", s.totals.excludingDiagnostic.counts],
    ].map(
      ([k, c]) =>
        `| ${k} | ${c.PASS} | ${c.FAIL} | ${c.WARN} | ${c.INFO} | ${c["N/A"]} | ${c["NOT-RUN"]} |`,
    ),
    "",
    `Controls not behaving as expected: ${s.totals.failedControls.length ? s.totals.failedControls.map((c) => `${c.fixture} ${c.criterion} ${c.status}`).join("; ") : "none"}.`,
    `Verdicts carrying a reference caveat (status kept): ${s.totals.all.caveated}.`,
    "",
  ];
  for (const f of s.fixtures) {
    lines.push(
      `## ${f.key}${f.diagnostic ? " (DIAGNOSTIC)" : ""} — class ${f.class}`,
      "",
      "| criterion | oracle | mode | status | value |",
      "|---|---|---|---|---|",
      ...f.verdicts.map(
        (v) =>
          `| ${esc(v.criterion)}${v.kind === "control" ? " (control)" : ""} | ${esc(v.oracle)} | ${esc(v.mode ?? "")} | ${esc(v.status)}${v.caveat ? " (caveat)" : ""} | ${esc(v.value)}${v.caveat ? ` — CAVEAT: ${esc(v.caveat)}` : ""} |`,
      ),
      "",
    );
    const l = f.layoutDiff;
    if (l?.status === "ran") {
      lines.push(
        `layout-diff (attribution, not a verdict): attribution valid ${l.attributionValid}; failed checks ${l.checksFailed.join(", ") || "none"}; first box ${l.firstBox ? `${l.firstBox.type} \`${l.firstBox.path}\` first over tolerance ${l.firstBox.firstOverTolerance}, dominant ${l.firstBox.dominantLayer}` : "none"}; first text ${l.firstText ? `"${esc(l.firstText.text)}" first over tolerance ${l.firstText.firstOverTolerance}, dominant ${l.firstText.dominantLayer}` : "none"}; regression events by layer ${Object.entries(
          l.regressionEventsByLayer,
        )
          .map(([k, v]) => `${k} ${v.box}/${v.text}`)
          .join(", ")}.`,
        "",
      );
    } else {
      lines.push(`layout-diff: ${l?.status ?? "not-run"} (${esc(l?.reason)})`, "");
    }
  }
  const w = s.wpt;
  lines.push("## WPT (per directory)", "");
  if (w.status === "ran") {
    lines.push(
      `Engine ${w.engineId}, WPT ${w.wptCommit}, Chrome oracle ${w.chromeOracle}. ${w.passRateCleanNote}.`,
      `Criteria: ${w.criteria.map((c) => `${c.criterion} ${c.status} (${esc(c.value)})`).join("; ")}.`,
      "",
      "| directory | reftests | pass | pass (clean) | pass-blank | fail | unsup | error | skip | pass % | % of evaluated | clean % |",
      "|---|---|---|---|---|---|---|---|---|---|---|---|",
      ...[...Object.entries(w.bySuite), ["**total**", w.totals]].map(
        ([k, r]) =>
          `| ${k} | ${r.reftests} | ${r.pass} | ${r.passClean} | ${r.passBlank} | ${r.fail} | ${r.unsupported} | ${r.error} | ${r.skip} | ${r.passRate} | ${r.passRateEvaluated} | ${r.passRateClean} |`,
      ),
      "",
    );
  } else {
    lines.push(`not run: ${w.criteria.map((c) => esc(c.value)).join("; ")}`, "");
  }
  if (s.uncoveredFixtures.length) {
    lines.push(
      `Uncovered fixtures: ${s.uncoveredFixtures.map((u) => `${u.fixture} (${u.reason})`).join("; ")}.`,
      "",
    );
  }
  lines.push(
    `Excluded fixtures: ${Object.entries(s.excludedFixtures)
      .map(([k, v]) => `${k} (${v})`)
      .join("; ")}.`,
    "",
  );
  return `${lines.join("\n")}\n`;
}

main().catch((error) => {
  process.stderr.write(`run-all failed: ${error?.stack ?? error}\n`);
  process.exitCode = 1;
});
