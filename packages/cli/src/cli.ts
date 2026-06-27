#!/usr/bin/env node
import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import { basename, dirname, join } from "node:path";
import { pathToFileURL } from "node:url";
import { parseArgs } from "node:util";
import type { Report } from "@vellora/lint";
import type { RenderData, RenderOptions } from "vellora";

export const EXIT_CODES = {
  success: 0,
  diagnosticsFound: 1,
  invalidUsage: 2,
  runtimeFailure: 3,
} as const;

export type ExitCode = (typeof EXIT_CODES)[keyof typeof EXIT_CODES];

export interface CliDeps {
  renderPdf(html: string, data?: RenderData, opts?: RenderOptions): Promise<Uint8Array>;
  diagnose(html: string): Report | Promise<Report>;
  fix(html: string): { html: string; report: Report } | Promise<{ html: string; report: Report }>;
}

export interface CliIo {
  stdout(text: string): void;
  stderr(text: string): void;
  readFile(path: string): Promise<Uint8Array>;
  writeFile(path: string, data: string | Uint8Array): Promise<void>;
  replaceFile(path: string, data: string | Uint8Array): Promise<void>;
  mkdir(path: string): Promise<void>;
  readStdin(): Promise<string>;
}

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
  vellora render <input|-> --out <file> [--data data.json] [--title title] [--creation-date iso] [--no-strict] [--base-url url] [--image key=path] [--font path]
  vellora lint <input|-> [--json]
  vellora fix <input|-> [--write] [--json]

Commands:
  render   Render HTML to PDF using the public vellora API
  lint     Diagnose template subset issues via @vellora/lint
  fix      Rewrite common subset issues via @vellora/lint

Exit codes:
  0 success
  1 diagnostics found by lint
  2 invalid usage, missing input, or invalid file/JSON input
  3 render/lint/fix runtime failure
`;
}

function commandUsage(command: string): string {
  switch (command) {
    case "render":
      return "Usage: vellora render <input|-> --out <file> [--data data.json] [--title title] [--creation-date iso] [--no-strict] [--base-url url] [--image key=path] [--font path]\n";
    case "lint":
      return "Usage: vellora lint <input|-> [--json]\n";
    case "fix":
      return "Usage: vellora fix <input|-> [--write] [--json]\n";
    default:
      return usage();
  }
}

function asArray(value: string | string[] | boolean | undefined): string[] {
  if (value === undefined || typeof value === "boolean") {
    return [];
  }
  return Array.isArray(value) ? value : [value];
}

function asString(value: string | string[] | boolean | undefined): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function bool(value: string | boolean | string[] | undefined): boolean {
  return value === true;
}

function requireSingleInput(command: string, positionals: string[]): string {
  if (positionals.length === 0) {
    throw new UsageError(`${command} requires <input|->.`);
  }
  if (positionals.length > 1) {
    throw new UsageError(
      `${command} accepts exactly one <input|->, received ${positionals.length}: ${positionals.map((value) => JSON.stringify(value)).join(", ")}.`,
    );
  }
  return positionals[0] as string;
}

async function readInput(input: string, io: CliIo): Promise<string> {
  if (input === "-") {
    return io.readStdin();
  }
  return new TextDecoder().decode(await io.readFile(input));
}

async function readJson(path: string, io: CliIo): Promise<RenderData> {
  const text = new TextDecoder().decode(await io.readFile(path));
  try {
    const parsed = JSON.parse(text) as unknown;
    if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new Error("expected a JSON object");
    }
    return parsed as RenderData;
  } catch (cause) {
    throw new UsageError(`Invalid JSON data file ${JSON.stringify(path)}: ${messageOf(cause)}`);
  }
}

async function readImages(
  entries: string[],
  io: CliIo,
): Promise<Record<string, Uint8Array> | undefined> {
  if (entries.length === 0) {
    return undefined;
  }
  const images: Record<string, Uint8Array> = {};
  for (const entry of entries) {
    const split = entry.indexOf("=");
    if (split <= 0 || split === entry.length - 1) {
      throw new UsageError(`--image expects key=path, received ${JSON.stringify(entry)}`);
    }
    const key = entry.slice(0, split);
    const path = entry.slice(split + 1);
    images[key] = await io.readFile(path);
  }
  return images;
}

async function readFonts(paths: string[], io: CliIo): Promise<Uint8Array[] | undefined> {
  if (paths.length === 0) {
    return undefined;
  }
  return Promise.all(paths.map((path) => io.readFile(path)));
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

function printJson(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}

class UsageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UsageError";
  }
}

function messageOf(reason: unknown): string {
  return reason instanceof Error ? reason.message : String(reason);
}

function formatRuntimeError(reason: unknown): string {
  const record =
    typeof reason === "object" && reason !== null ? (reason as Record<string, unknown>) : {};
  const code = typeof record.code === "string" ? `${record.code}: ` : "";
  const feature = typeof record.feature === "string" ? ` feature=${record.feature}` : "";
  return `${code}${messageOf(reason)}${feature}`;
}

function isParseArgsError(reason: unknown): boolean {
  if (!(reason instanceof TypeError)) {
    return false;
  }
  const code = (reason as { code?: unknown }).code;
  return typeof code === "string" && code.startsWith("ERR_PARSE_ARGS");
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
  const data = parsed.values.data ? await readJson(String(parsed.values.data), io) : undefined;
  const opts: RenderOptions = {
    strict: !bool(parsed.values["no-strict"]),
  };
  const title = asString(parsed.values.title);
  const creationDate = asString(parsed.values["creation-date"]);
  if (title !== undefined || creationDate !== undefined) {
    opts.metadata = {};
    if (title !== undefined) {
      opts.metadata.title = title;
    }
    if (creationDate !== undefined) {
      opts.metadata.creationDate = creationDate;
    }
  }
  const baseUrl = asString(parsed.values["base-url"]);
  if (baseUrl !== undefined) {
    opts.baseUrl = baseUrl;
  }
  const images = await readImages(asArray(parsed.values.image), io);
  if (images !== undefined) {
    opts.images = images;
  }
  const fonts = await readFonts(asArray(parsed.values.font), io);
  if (fonts !== undefined) {
    opts.fonts = fonts;
  }

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
