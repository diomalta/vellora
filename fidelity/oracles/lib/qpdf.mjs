// PDF validity oracle: the qpdf CLI (`--check`, `--show-xref`) plus an independent xref sanity
// pass that re-reads the bytes at every offset qpdf reports.
//
// Install route (recorded per run in `route`): QPDF_BIN or a `qpdf` on PATH first (CI: apt
// `qpdf`), otherwise the locally built tools image (docker/tools.Dockerfile, Debian trixie
// qpdf=12.2.0-1). pikepdf's bundled libqpdf was rejected: it is the library, not the qpdf CLI
// whose exit-code contract is documented.
//
// qpdf exit codes (qpdf manual, "Exit Status"): 0 = no errors or warnings, 2 = errors,
// 3 = warnings only (file still processed).
import { readFileSync } from "node:fs";
import { basename, dirname } from "node:path";
import { TOOLS_IMAGE, inspectImage, toolsRun } from "./docker.mjs";
import { findExecutable, run, versionLine } from "./exec.mjs";

async function qpdfRunner() {
  const host = await findExecutable("qpdf", "QPDF_BIN");
  if (host) {
    return {
      route: `host ${host}`,
      version: await versionLine(host),
      exec: (args, pdfPath) => run(host, [...args, pdfPath]),
    };
  }
  const image = await inspectImage(TOOLS_IMAGE);
  if (!image.available) {
    return { unavailable: `no host qpdf and ${image.reason}` };
  }
  const versionResult = await toolsRun(["qpdf", "--version"]);
  return {
    route: `docker ${TOOLS_IMAGE} (${image.id})`,
    version: versionResult.stdout.split("\n")[0].trim(),
    exec: (args, pdfPath) =>
      toolsRun(["qpdf", ...args, `/work/${basename(pdfPath)}`], {
        mounts: [{ host: dirname(pdfPath), container: "/work", readonly: true }],
      }),
  };
}

/** Parse `qpdf --show-xref` lines: "N/G: uncompressed; offset = X" / "N/G: compressed; stream = S, index = I". */
export function parseShowXref(stdout) {
  const entries = [];
  for (const line of stdout.split("\n")) {
    const uncompressed = line.match(/^(\d+)\/(\d+): uncompressed; offset = (\d+)/);
    if (uncompressed) {
      entries.push({
        object: Number(uncompressed[1]),
        generation: Number(uncompressed[2]),
        type: "uncompressed",
        offset: Number(uncompressed[3]),
      });
      continue;
    }
    const compressed = line.match(/^(\d+)\/(\d+): compressed; stream = (\d+), index = (\d+)/);
    if (compressed) {
      entries.push({
        object: Number(compressed[1]),
        generation: Number(compressed[2]),
        type: "compressed",
        stream: Number(compressed[3]),
        index: Number(compressed[4]),
      });
    }
  }
  return entries;
}

/**
 * Independent of qpdf's own (possibly reconstructing) parser: every uncompressed entry's offset
 * must lie inside the file and point at "N G obj" for the same N/G.
 */
export function xrefSanity(entries, bytes) {
  const problems = [];
  const decoder = new TextDecoder("latin1");
  for (const entry of entries) {
    if (entry.type !== "uncompressed") {
      continue;
    }
    if (entry.offset >= bytes.length) {
      problems.push(`${entry.object}/${entry.generation}: offset ${entry.offset} beyond EOF`);
      continue;
    }
    const window = decoder.decode(bytes.subarray(entry.offset, entry.offset + 32));
    const match = window.match(/^(\d+)\s+(\d+)\s+obj\b/);
    if (!match || Number(match[1]) !== entry.object || Number(match[2]) !== entry.generation) {
      problems.push(
        `${entry.object}/${entry.generation}: offset ${entry.offset} points at ${JSON.stringify(window.slice(0, 16))}`,
      );
    }
  }
  return problems;
}

export async function qpdfOracle({ pdfPath }) {
  const runner = await qpdfRunner();
  if (runner.unavailable) {
    return { oracle: "qpdf", status: "not-run", reason: runner.unavailable };
  }
  const check = await runner.exec(["--check"], pdfPath);
  const xref = await runner.exec(["--show-xref"], pdfPath);
  const pages = await runner.exec(["--show-npages"], pdfPath);
  const entries = parseShowXref(xref.stdout);
  const sanityProblems = xrefSanity(entries, readFileSync(pdfPath));
  const warnings = `${check.stdout}\n${check.stderr}`
    .split("\n")
    .filter((line) => /WARNING|error/i.test(line))
    .map((line) => line.trim());
  let status;
  if (check.code === 0 && sanityProblems.length === 0 && entries.length > 0) {
    status = "pass";
  } else if (check.code === 3 && sanityProblems.length === 0) {
    status = "warn";
  } else {
    status = "fail";
  }
  return {
    oracle: "qpdf",
    status,
    tool: { name: "qpdf", version: runner.version, route: runner.route },
    check: {
      exitCode: check.code,
      meaning: { 0: "no errors", 2: "errors", 3: "warnings" }[check.code] ?? "unexpected",
      stdout: check.stdout.trim(),
      stderr: check.stderr.trim(),
      warnings,
    },
    xref: {
      exitCode: xref.code,
      entries: entries.length,
      uncompressed: entries.filter((e) => e.type === "uncompressed").length,
      compressed: entries.filter((e) => e.type === "compressed").length,
      sanityProblems,
    },
    pages: pages.code === 0 ? Number(pages.stdout.trim()) : null,
  };
}
