#!/usr/bin/env node
// Run every external oracle over the repo fixtures at the current pin, in both render modes
// (plain, and pdfa: "PDF/A-2b"), plus the canaries that prove each oracle catches broken input.
//
//   node fidelity/oracles/run-fixtures.mjs [--fixtures invoice,receipt,boleto,notification]
//     [--modes plain,pdfa] [--oracles qpdf,verapdf,text,barcode,layout] [--no-canaries]
//     [--out fidelity/results/oracles/<run-id>]
//
// Requires: `npm run build` (vellora native addon), fidelity/.venv (requirements.txt), the tools
// image (docker/tools.Dockerfile) and the pinned veraPDF image. A missing tool is reported as
// not-run with its reason; it is never skipped silently.
import { mkdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { runCanaries } from "./lib/canaries.mjs";
import { launchChrome } from "./lib/chrome.mjs";
import { captureEnvironment } from "./lib/env.mjs";
import { FIXTURE_IDS, loadFixture, templatedFixtureHtml } from "./lib/html-prep.mjs";
import { DEFAULT_RESULTS_DIR } from "./lib/paths.mjs";
import {
  SCHEMA_VERSION,
  argValue,
  commandLine,
  fileFacts,
  hasFlag,
  listArg,
  portable,
  runId,
  sha256,
} from "./lib/record.mjs";
import { ORACLE_IDS, referenceArtifacts, runOracles, verdictLine } from "./lib/suite.mjs";
import { loadVellora, renderNative } from "./lib/vellora.mjs";

const MODES = Object.freeze({ plain: null, pdfa: "PDF/A-2b" });

function expectationsFor(fixture) {
  if (fixture.id === "boleto") {
    return {
      barcode: { digits: fixture.data.documento.codigoBarras },
      linhaDigitavel: fixture.data.documento.linhaDigitavel,
      note: "fixtures/boleto prints the barcode as TEXT ('representação textual — não escaneável'), so no ITF symbol is expected to decode; the oracle reports that as a fail of the expectation.",
    };
  }
  return {};
}

/** Linha occurrences found in the PDF text (max over extractors), or "not-run: <reason>". */
function linhaCount(search) {
  if (!search) {
    return null;
  }
  return search.status === "ran" ? search.maxOccurrences : `not-run: ${search.reason}`;
}

function summarizeResult(results) {
  const text = results.text?.extractors?.map((e) => ({
    extractor: e.name,
    status: e.status,
    orderedRecall: e.subject?.orderedRecall,
    bagRecall: e.subject?.bagRecall,
    reference: e.reference,
    subjectOnlyMissing: e.subjectOnly?.missingCount,
    subjectOnlyMissingTokens: e.subjectOnly?.missing?.slice(0, 10),
    subjectOnlyExtra: e.subjectOnly?.extraCount,
    subjectOnlyReordered: e.subjectOnly?.reorderedCount,
    marginBoxRuns: e.marginBoxes?.perTemplate?.map((t) => ({
      template: t.template,
      control: t.controlRuns,
      subject: t.subjectRuns,
    })),
    marginBoxTextAbsent: e.marginBoxes?.absent,
    copyPaste: e.copyPaste?.pass,
    copyPasteFailures: e.copyPaste?.subject?.failures,
  }));
  const layout = results.layout;
  return {
    qpdf: results.qpdf.status,
    verapdf: results.verapdf.status,
    verapdfCompliant: results.verapdf.compliant ?? null,
    verapdfFailedRules:
      results.verapdf.report?.rules?.map((r) => `${r.clause}-${r.testNumber}`) ?? [],
    text: results.text.status,
    textPerExtractor: text ?? [],
    barcode: results.barcode.status,
    barcodeProblems: results.barcode.problems ?? [],
    barcodeDocumentData: results.barcode.documentData
      ? {
          expectedBarcodeValid: results.barcode.documentData.expectedBarcode?.valid ?? null,
          expectedBarcodeErrors: results.barcode.documentData.expectedBarcode?.errors ?? [],
          expectedLinhaValid: results.barcode.documentData.expectedLinhaDigitavel?.valid ?? null,
          expectedLinhaErrors: results.barcode.documentData.expectedLinhaDigitavel?.errors ?? [],
          linhaMatchesBarcode: results.barcode.documentData.linhaMatchesBarcode,
          linhasFoundInPdfText: linhaCount(results.barcode.documentData.linhasInExtractedText),
        }
      : null,
    layout: layout.status,
    layoutPages: layout.pages ?? null,
    layoutBuckets: layout.buckets
      ? {
          matchedTriples: layout.buckets.matchedTriples,
          pageMismatch: layout.buckets.pageMismatch,
          referenceCountMismatch: layout.buckets.referenceCountMismatch,
          subjectCountMismatch: layout.buckets.subjectCountMismatch,
          subjectCountMismatchExamples: layout.buckets.subjectCountMismatchExamples.slice(0, 5),
        }
      : null,
    layoutByTolerance:
      layout.tolerances?.map((t) => ({
        tol: t.tol,
        coverage: t.coverage,
        consensus: t.consensus,
        disputed: t.disputed,
        subjectWithinTol: t.subjectWithinTol,
        medianDx: t.subjectError.medianDx,
        medianDy: t.subjectError.medianDy,
        p95Distance: t.subjectError.p95Distance,
        maxDistance: t.subjectError.maxDistance,
        xAxis: {
          coverage: t.perAxis.x.coverage,
          withinTol: t.perAxis.x.subjectWithinTol,
          p95AbsDx: t.perAxis.x.subjectError.p95Distance,
        },
        yAxis: {
          coverage: t.perAxis.y.coverage,
          withinTol: t.perAxis.y.subjectWithinTol,
          p95AbsDy: t.perAxis.y.subjectError.p95Distance,
        },
      })) ?? null,
    layoutWorst: layout.worst?.slice(0, 5).map((w) => ({
      text: w.text,
      page: w.page,
      dx: w.dx,
      dy: w.dy,
      referenceDisagreement: w.referenceDisagreement,
    })),
  };
}

async function main() {
  const argv = process.argv.slice(2);
  const fixtures = listArg(argv, "--fixtures", [...FIXTURE_IDS]);
  const modes = listArg(argv, "--modes", Object.keys(MODES));
  const only = listArg(argv, "--oracles", ORACLE_IDS);
  for (const id of fixtures) {
    if (!FIXTURE_IDS.includes(id)) throw new Error(`unknown fixture ${id}`);
  }
  for (const mode of modes) {
    if (!(mode in MODES)) throw new Error(`unknown mode ${mode} (plain|pdfa)`);
  }
  const outDir = resolve(argValue(argv, "--out", join(DEFAULT_RESULTS_DIR, runId())));
  mkdirSync(outDir, { recursive: true });

  const { renderTemplate } = await loadVellora();
  let chrome = null;
  let chromeError = null;
  try {
    chrome = await launchChrome();
  } catch (error) {
    // Reported, not fatal: qpdf / veraPDF / barcode still run; text and layout are not-run.
    chromeError = error?.message ?? String(error);
    console.log(`Chrome unavailable: ${chromeError}`);
  }
  const summary = {
    schemaVersion: SCHEMA_VERSION,
    suite: "vellora-fidelity-oracles/fixtures",
    command: commandLine(),
    environment: null,
    fixtures: [],
    canaries: [],
  };
  try {
    summary.environment = await captureEnvironment({ chrome, chromeError });
    const processed = new Map();
    for (const id of fixtures) {
      const fixture = loadFixture(id);
      const templatedHtml = templatedFixtureHtml(fixture, renderTemplate);
      const fixtureDir = join(outDir, id);
      mkdirSync(fixtureDir, { recursive: true });
      const htmlPath = join(fixtureDir, "templated.html");
      writeFileSync(htmlPath, templatedHtml);
      const refs = await referenceArtifacts({
        templatedHtml,
        baseDir: fixture.dir,
        refDir: join(fixtureDir, "reference"),
        chrome,
        chromeError,
        withWeasyPrint: only.includes("layout"),
      });
      const expect = expectationsFor(fixture);
      processed.set(id, { fixtureId: id, templatedHtml, refs });
      for (const mode of modes) {
        const modeDir = join(fixtureDir, mode);
        mkdirSync(modeDir, { recursive: true });
        const pdfa = MODES[mode];
        const first = await renderNative(templatedHtml, { pdfa: pdfa ?? undefined });
        const second = await renderNative(templatedHtml, { pdfa: pdfa ?? undefined });
        const pdfPath = join(modeDir, "vellora.pdf");
        writeFileSync(pdfPath, first);
        if (mode === "plain") {
          Object.assign(processed.get(id), {
            velloraPlainPdfPath: pdfPath,
            velloraPlainPdfBytes: first,
          });
        }
        const results = await runOracles({
          pdfPath,
          refs,
          pdfa,
          docClass: id,
          expect,
          only,
          workDir: modeDir,
        });
        const record = {
          schemaVersion: SCHEMA_VERSION,
          suite: "vellora-fidelity-oracles",
          command: commandLine(),
          environment: summary.environment,
          input: {
            fixture: id,
            mode,
            pdf: fileFacts(pdfPath),
            html: fileFacts(htmlPath),
            deterministic: sha256(first) === sha256(second),
            class: id,
            pdfa,
            expect,
            oracles: only,
            references: refs.facts,
          },
          results,
        };
        writeFileSync(
          join(modeDir, "result.json"),
          `${JSON.stringify(portable(record), null, 2)}\n`,
        );
        summary.fixtures.push({
          fixture: id,
          mode,
          pdfSha256: record.input.pdf.sha256,
          deterministic: record.input.deterministic,
          ...summarizeResult(results),
        });
        console.log(`${id.padEnd(13)} ${mode.padEnd(6)} ${verdictLine(results)}`);
      }
    }
    if (!hasFlag(argv, "--no-canaries")) {
      const textFixture = processed.get("boleto") ?? [...processed.values()][0];
      const layoutFixture = processed.get("notification") ?? [...processed.values()][0];
      const deletionFixture = processed.get("invoice") ?? textFixture;
      if (textFixture?.velloraPlainPdfBytes) {
        summary.canaries = await runCanaries({
          outDir: join(outDir, "canaries"),
          chrome,
          chromeError,
          textFixture,
          layoutFixture,
          deletionFixture,
        });
        for (const canary of summary.canaries) {
          const verdict =
            canary.caught === null
              ? "MEASURED"
              : canary.caught
                ? "CAUGHT"
                : canary.ran
                  ? "MISSED"
                  : "NOT-RUN";
          console.log(`canary ${verdict.padEnd(8)} ${canary.oracle}: ${canary.canary}`);
        }
      } else {
        summary.canaries = [
          { canary: "all", ran: false, reason: "canaries need a plain-mode render" },
        ];
      }
    }
  } finally {
    await chrome?.close();
  }
  writeFileSync(join(outDir, "summary.json"), `${JSON.stringify(portable(summary), null, 2)}\n`);
  console.log(`summary: ${join(outDir, "summary.json")}`);
}

main().catch((error) => {
  process.stderr.write(`fixture oracle run failed: ${error?.stack ?? error}\n`);
  process.exitCode = 1;
});
