#!/usr/bin/env node
import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import { basename, dirname, join } from "node:path";
import { pathToFileURL } from "node:url";
import { parseArgs } from "node:util";
import type { Report } from "@vellora/lint";
import { asString, bool, requireSingleInput } from "./args.js";
import { DOCTOR_USAGE, handleDoctor } from "./doctor.js";
import { UsageError, formatRuntimeError, isParseArgsError, messageOf } from "./errors.js";
import { FIDELITY_USAGE, handleFidelity } from "./fidelity.js";
import { printJson } from "./format.js";
import { diffPdfPixels } from "./pixel-diff.js";
import { buildRenderInputs, readInput } from "./render-inputs.js";
import { type CliDeps, type CliIo, EXIT_CODES, type ExitCode } from "./types.js";

export { EXIT_CODES } from "./types.js";
export type { CliDeps, CliIo, ExitCode } from "./types.js";

const defaultDeps: CliDeps = {
  async renderPdf(html, data, opts) {
    const mod = await import("vellora");
    return mod.renderPdf(html, data, opts);
  },
  async diagnose(html) {
    const mod = await import("@vellora/lint");
    return mod.diagnose(html);
  },
  async fix(html) {
    const mod = await import("@vellora/lint");
    return mod.fix(html);
  },
  diffPdfs: diffPdfPixels,
};

const defaultIo: CliIo = {
  stdout(text) {
    process.stdout.write(text);
  },
  stderr(text) {
    process.stderr.write(text);
  },
  readFile(path) {
    return readFile(path);
  },
  writeFile(path, data) {
    return writeFile(path, data);
  },
  replaceFile(path, data) {
    return replaceFile(path, data);
  },
  mkdir(path) {
    return mkdir(path, { recursive: true }).then(() => undefined);
  },
  readStdin() {
    return new Promise((resolve, reject) => {
      let data = "";
      process.stdin.setEncoding("utf8");
      process.stdin.on("data", (chunk) => {
        data += chunk;
      });
      process.stdin.on("end", () => resolve(data));
      process.stdin.on("error", reject);
    });
  },
};

async function replaceFile(path: string, data: string | Uint8Array): Promise<void> {
  const tempPath = join(dirname(path), `.${basename(path)}.${process.pid}.${randomUUID()}.tmp`);
  try {
    await writeFile(tempPath, data, { flag: "wx" });
    await rename(tempPath, path);
  } catch (cause) {
    await rm(tempPath, { force: true }).catch(() => undefined);
    throw cause;
  }
}

function usage(): string {
  return `Usage:
  vellora render <input|-> --out <file> [--data data.json] [--title title] [--creation-date iso] [--no-strict] [--engine native|chromium|auto] [--template-id id] [--policy file] [--base-url url] [--image key=path] [--font path]
  vellora lint <input|-> [--json]
  vellora fix <input|-> [--write] [--json]
  vellora doctor <input|-> [--out dir] [--json] [--reference chromium] [--reference-pdf file] [--subject native|chromium] [--pixel-diff] [--pixel-budget ratio] [--template-id id] [--policy file]
  vellora fidelity --config vellora.fidelity.json [--json]

Commands:
  render   Render HTML to PDF using the public vellora API
  lint     Diagnose template subset issues via @vellora/lint
  fix      Rewrite common subset issues via @vellora/lint
  doctor   Render fidelity artifacts, optionally pixel-diff them, and emit a routing report
  fidelity Validate a fidelity policy file

Exit codes:
  0 success
  1 diagnostics found by lint
  2 invalid usage, missing input, or invalid file/JSON input
  3 render/lint/fix runtime failure
  4 requested reference engine unavailable
`;
}

function commandUsage(command: string): string {
  switch (command) {
    case "render":
      return "Usage: vellora render <input|-> --out <file> [--data data.json] [--title title] [--creation-date iso] [--no-strict] [--engine native|chromium|auto] [--template-id id] [--policy file] [--base-url url] [--image key=path] [--font path]\n";
    case "lint":
      return "Usage: vellora lint <input|-> [--json]\n";
    case "fix":
      return "Usage: vellora fix <input|-> [--write] [--json]\n";
    case "doctor":
      return DOCTOR_USAGE;
    case "fidelity":
      return FIDELITY_USAGE;
    default:
      return usage();
  }
}

function printHumanReport(report: Report): string {
  if (report.conformant || report.findings.length === 0) {
    return "No lint findings. Template is inside the supported subset.\n";
  }
  return `${report.findings.length} lint finding(s):\n${report.findings
    .map(
      (finding) =>
        `- ${finding.severity} ${finding.rule} at ${finding.location.line}:${finding.location.col} (${finding.autoFixable ? "auto-fixable" : "manual"}): ${finding.suggestedFix}`,
    )
    .join("\n")}\n`;
}

async function handleRender(args: string[], io: CliIo, deps: CliDeps): Promise<ExitCode> {
  const parsed = parseArgs({
    args,
    allowPositionals: true,
    options: {
      out: { type: "string" },
      data: { type: "string" },
      title: { type: "string" },
      "creation-date": { type: "string" },
      "no-strict": { type: "boolean" },
      engine: { type: "string" },
      "template-id": { type: "string" },
      policy: { type: "string" },
      "base-url": { type: "string" },
      image: { type: "string", multiple: true },
      font: { type: "string", multiple: true },
      help: { type: "boolean", short: "h" },
    },
  });
  if (bool(parsed.values.help)) {
    io.stdout(commandUsage("render"));
    return EXIT_CODES.success;
  }
  const input = requireSingleInput("render", parsed.positionals);
  const out = asString(parsed.values.out);
  if (!out) {
    throw new UsageError("render requires --out <file>.");
  }

  const html = await readInput(input, io);
  const { data, opts } = await buildRenderInputs(parsed.values, io);
  const pdf = await deps.renderPdf(html, data, opts);
  await io.mkdir(dirname(out));
  await io.writeFile(out, pdf);
  io.stdout(`Wrote ${pdf.length} bytes to ${out}\n`);
  return EXIT_CODES.success;
}

async function handleLint(args: string[], io: CliIo, deps: CliDeps): Promise<ExitCode> {
  const parsed = parseArgs({
    args,
    allowPositionals: true,
    options: {
      json: { type: "boolean" },
      help: { type: "boolean", short: "h" },
    },
  });
  if (bool(parsed.values.help)) {
    io.stdout(commandUsage("lint"));
    return EXIT_CODES.success;
  }
  const input = requireSingleInput("lint", parsed.positionals);
  const report = await deps.diagnose(await readInput(input, io));
  io.stdout(bool(parsed.values.json) ? printJson(report) : printHumanReport(report));
  return report.conformant ? EXIT_CODES.success : EXIT_CODES.diagnosticsFound;
}

async function handleFix(args: string[], io: CliIo, deps: CliDeps): Promise<ExitCode> {
  const parsed = parseArgs({
    args,
    allowPositionals: true,
    options: {
      write: { type: "boolean" },
      json: { type: "boolean" },
      help: { type: "boolean", short: "h" },
    },
  });
  if (bool(parsed.values.help)) {
    io.stdout(commandUsage("fix"));
    return EXIT_CODES.success;
  }
  const input = requireSingleInput("fix", parsed.positionals);
  if (input === "-" && bool(parsed.values.write)) {
    throw new UsageError("--write requires a file input; it cannot be used with stdin.");
  }
  const result = await deps.fix(await readInput(input, io));
  const write = bool(parsed.values.write);
  if (write) {
    await io.replaceFile(input, result.html);
  }
  if (bool(parsed.values.json)) {
    io.stdout(printJson(result));
  } else if (write) {
    io.stdout(`Wrote fixed HTML to ${input}\n`);
  } else {
    io.stdout(result.html);
  }
  return EXIT_CODES.success;
}

export async function runCli(
  argv: string[],
  io: CliIo = defaultIo,
  deps: CliDeps = defaultDeps,
): Promise<ExitCode> {
  const [command, ...args] = argv;
  try {
    if (!command || command === "--help" || command === "-h") {
      io.stdout(usage());
      return EXIT_CODES.success;
    }
    switch (command) {
      case "render":
        return await handleRender(args, io, deps);
      case "lint":
        return await handleLint(args, io, deps);
      case "fix":
        return await handleFix(args, io, deps);
      case "doctor":
        return await handleDoctor(args, io, deps);
      case "fidelity":
        return await handleFidelity(args, io);
      default:
        io.stderr(`Unknown command: ${command}\n${usage()}`);
        return EXIT_CODES.invalidUsage;
    }
  } catch (reason) {
    if (reason instanceof UsageError || isParseArgsError(reason)) {
      io.stderr(`${messageOf(reason)}\n`);
      return EXIT_CODES.invalidUsage;
    }
    io.stderr(`${formatRuntimeError(reason)}\n`);
    return EXIT_CODES.runtimeFailure;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exitCode = await runCli(process.argv.slice(2));
}
