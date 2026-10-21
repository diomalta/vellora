#!/usr/bin/env node
// External PDF oracles over ONE subject PDF.
//
//   node fidelity/oracles/run.mjs --pdf out.pdf [--html templated.html] [--base-dir dir]
//     [--class boleto|danfe|invoice|receipt|notification|...] [--expect expect.json]
//     [--pdfa PDF/A-2b | --no-pdfa] [--oracles qpdf,verapdf,text,barcode,layout]
//     [--out dir] [--no-font-injection]
//
// --html is the FINAL html the subject was rendered from (templated, images inlined); Chrome and
// WeasyPrint render it as the references. Without --html only qpdf / veraPDF / barcode run.
// --pdfa says the subject claims PDF/A-2b (veraPDF must pass); --no-pdfa says it does not (veraPDF
// is a negative control and must fail); neither => veraPDF only reports.
// --expect JSON: { "barcode": { "digits": "<44 digits>" }, "linhaDigitavel": "<47 digits>" }.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { launchChrome } from "./lib/chrome.mjs";
import { captureEnvironment } from "./lib/env.mjs";
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
} from "./lib/record.mjs";
import { ORACLE_IDS, referenceArtifacts, runOracles, verdictLine } from "./lib/suite.mjs";

async function main() {
  const argv = process.argv.slice(2);
  const pdfArg = argValue(argv, "--pdf", null);
  if (!pdfArg || hasFlag(argv, "--help")) {
    process.stdout.write(
      `${readFileSync(new URL(import.meta.url))
        .toString()
        .split("\n")
        .slice(1)
        .filter((line, index, lines) => lines.slice(0, index + 1).every((l) => l.startsWith("//")))
        .map((line) => line.replace(/^\/\/ ?/, ""))
        .join("\n")}\n`,
    );
    process.exitCode = pdfArg ? 0 : 2;
    return;
  }
  const pdfPath = resolve(pdfArg);
  const htmlArg = argValue(argv, "--html", null);
  const htmlPath = htmlArg ? resolve(htmlArg) : null;
  const baseDir = resolve(argValue(argv, "--base-dir", htmlPath ? dirname(htmlPath) : "."));
  const docClass = argValue(argv, "--class", null);
  const expectPath = argValue(argv, "--expect", null);
  const expect = expectPath ? JSON.parse(readFileSync(resolve(expectPath), "utf8")) : {};
  let pdfa;
  if (hasFlag(argv, "--no-pdfa")) {
    pdfa = null;
  } else {
    pdfa = argValue(argv, "--pdfa", undefined);
  }
  let only = listArg(argv, "--oracles", ORACLE_IDS);
  if (!htmlPath) {
    only = only.filter((id) => id !== "text" && id !== "layout");
  }
  const outDir = resolve(argValue(argv, "--out", join(DEFAULT_RESULTS_DIR, `single-${runId()}`)));
  mkdirSync(outDir, { recursive: true });

  const needsChrome = only.includes("text") || only.includes("layout");
  const chrome = needsChrome ? await launchChrome() : null;
  try {
    const environment = await captureEnvironment({ chrome });
    const refs = htmlPath
      ? await referenceArtifacts({
          templatedHtml: readFileSync(htmlPath, "utf8"),
          baseDir,
          refDir: join(outDir, "reference"),
          chrome,
          injectFonts: !hasFlag(argv, "--no-font-injection"),
        })
      : { expectedText: null, errors: ["no --html"], weasy: { notRun: "no --html" } };
    const results = await runOracles({
      pdfPath,
      refs,
      pdfa,
      docClass,
      expect,
      only,
      workDir: outDir,
    });
    const record = {
      schemaVersion: SCHEMA_VERSION,
      suite: "vellora-fidelity-oracles",
      command: commandLine(),
      environment,
      input: {
        pdf: fileFacts(pdfPath),
        html: htmlPath ? fileFacts(htmlPath) : null,
        class: docClass,
        pdfa: pdfa ?? null,
        expect,
        oracles: only,
      },
      results,
    };
    writeFileSync(join(outDir, "result.json"), `${JSON.stringify(portable(record), null, 2)}\n`);
    console.log(verdictLine(results));
    console.log(`result: ${join(outDir, "result.json")}`);
  } finally {
    await chrome?.close();
  }
}

main().catch((error) => {
  process.stderr.write(`oracle run failed: ${error?.stack ?? error}\n`);
  process.exitCode = 1;
});
