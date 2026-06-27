import { join } from "node:path";
import { parseArgs } from "node:util";
import type { Report } from "@vellora/lint";
import type { RenderData, RenderOptions } from "vellora";
import {
  asString,
  bool,
  optionalNonNegativeNumber,
  optionalPositiveNumber,
  requireSingleInput,
} from "./args.js";
import { UsageError, formatRuntimeError, messageOf } from "./errors.js";
import { printJson } from "./format.js";
import { type PdfPixelDiffReport, type PixelDiffOptions, diffPdfPixels } from "./pixel-diff.js";
import { buildRenderInputs, readInput } from "./render-inputs.js";
import { type CliDeps, type CliIo, EXIT_CODES, type ExitCode } from "./types.js";

export const DOCTOR_USAGE =
  "Usage: vellora doctor <input|-> [--out dir] [--json] [--reference chromium] [--reference-pdf file] [--subject native|chromium] [--pixel-diff] [--pixel-budget ratio] [--pixel-threshold 12] [--dpi 144] [--template-id id] [--policy file]\n";

type EngineName = "native" | "chromium";

type ReferenceTarget = { type: "engine"; engine: "chromium" } | { type: "pdf"; path: string };

interface ComparisonPlan {
  subject: EngineName;
  reference?: ReferenceTarget;
  wantsPixelDiff: boolean;
  pixelOptions: PixelDiffOptions;
}

interface DoctorRenderResult {
  engine: EngineName;
  ok: boolean;
  bytes?: number;
  error?: string;
  chromiumUnavailable?: boolean;
}

interface RenderAttempt {
  result: DoctorRenderResult;
  pdf?: Uint8Array;
}

export interface DoctorReport {
  version: 1;
  status: "pass" | "needs-browser" | "fail" | "reference-unavailable" | "diff-unavailable";
  input: string;
  reference?: { type: "chromium" | "pdf"; path?: string };
  subject: { type: "engine"; engine: EngineName };
  comparison?: {
    reference: { type: "chromium" | "pdf"; path?: string };
    subject: { type: "engine"; engine: EngineName };
  };
  lint: Report;
  renders: DoctorRenderResult[];
  visualDiff?: PdfPixelDiffReport;
  recommendation: "native" | "chromium" | "manual-review";
  policySuggestion?: {
    version: 1;
    templates: Record<string, { selectedEngine: "native" | "chromium"; reason: string }>;
  };
}

function parseEngineName(value: string | undefined, flag: string): EngineName | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (value === "native" || value === "chromium") {
    return value;
  }
  throw new UsageError(`${flag} must be native or chromium; received ${JSON.stringify(value)}.`);
}

function parseReferenceEngine(value: string | undefined): "chromium" | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (value === "chromium") {
    return value;
  }
  throw new UsageError(
    `--reference currently supports only chromium; received ${JSON.stringify(value)}.`,
  );
}

function buildComparisonPlan(
  values: Record<string, string | boolean | string[] | undefined>,
  outDir: string | undefined,
): ComparisonPlan {
  const wantsPixelDiff = bool(values["pixel-diff"]);
  const referencePdfPath = asString(values["reference-pdf"]);
  const referenceEngine = parseReferenceEngine(asString(values.reference));
  const subject = parseEngineName(asString(values.subject), "--subject") ?? "native";

  if (asString(values.subject) !== undefined && !wantsPixelDiff) {
    throw new UsageError("--subject requires --pixel-diff.");
  }
  if (referencePdfPath !== undefined && !wantsPixelDiff) {
    throw new UsageError("--reference-pdf requires --pixel-diff.");
  }
  if (referencePdfPath !== undefined && referenceEngine !== undefined) {
    throw new UsageError("--reference-pdf cannot be combined with --reference.");
  }

  const reference: ReferenceTarget | undefined = referencePdfPath
    ? { type: "pdf", path: referencePdfPath }
    : referenceEngine
      ? { type: "engine", engine: referenceEngine }
      : wantsPixelDiff
        ? { type: "engine", engine: "chromium" }
        : undefined;

  if (wantsPixelDiff && reference?.type === "engine" && reference.engine === subject) {
    throw new UsageError("--reference and --subject must be different engines.");
  }

  return {
    subject,
    reference,
    wantsPixelDiff,
    pixelOptions: {
      outDir,
      pdftoppmPath: asString(values.pdftoppm),
      dpi: optionalPositiveNumber(asString(values.dpi), "--dpi", 144),
      threshold: optionalNonNegativeNumber(
        asString(values["pixel-threshold"]),
        "--pixel-threshold",
        12,
      ),
      budget: optionalNonNegativeNumber(asString(values["pixel-budget"]), "--pixel-budget", 0.02),
    },
  };
}

function reportReference(reference: ReferenceTarget | undefined): DoctorReport["reference"] {
  if (!reference) {
    return undefined;
  }
  return reference.type === "pdf"
    ? { type: "pdf", path: reference.path }
    : { type: reference.engine };
}

function comparisonReference(
  reference: ReferenceTarget,
): NonNullable<DoctorReport["comparison"]>["reference"] {
  return reference.type === "pdf"
    ? { type: "pdf", path: reference.path }
    : { type: reference.engine };
}

function renderOrder(plan: ComparisonPlan): EngineName[] {
  const engines = new Set<EngineName>([plan.subject]);
  if (plan.reference?.type === "engine") {
    engines.add(plan.reference.engine);
  }
  return (["native", "chromium"] as const).filter((engine) => engines.has(engine));
}

async function attemptRender(
  engine: EngineName,
  html: string,
  data: RenderData | undefined,
  opts: RenderOptions,
  deps: CliDeps,
): Promise<RenderAttempt> {
  try {
    const pdf = await deps.renderPdf(html, data, { ...opts, engine });
    return {
      pdf,
      result: {
        engine,
        ok: true,
        bytes: pdf.length,
      },
    };
  } catch (reason) {
    return {
      result: {
        engine,
        ok: false,
        error: formatRuntimeError(reason),
        chromiumUnavailable: engine === "chromium" && isChromiumUnavailable(reason),
      },
    };
  }
}

function isChromiumUnavailable(reason: unknown): boolean {
  const record =
    typeof reason === "object" && reason !== null ? (reason as Record<string, unknown>) : {};
  const code = typeof record.code === "string" ? record.code : "";
  const message = messageOf(reason);
  return (
    code === "VELLORA_CHROMIUM_UNAVAILABLE" ||
    message.includes("@vellora/engine-chromium") ||
    message.includes("VELLORA_CHROMIUM_UNAVAILABLE") ||
    message.includes("Set chromium.executablePath") ||
    message.includes("VELLORA_CHROMIUM_EXECUTABLE")
  );
}

async function attemptPixelDiff(
  referencePdf: Uint8Array | undefined,
  subjectPdf: Uint8Array | undefined,
  options: PixelDiffOptions,
  deps: CliDeps,
): Promise<PdfPixelDiffReport | undefined> {
  if (!referencePdf || !subjectPdf) {
    return undefined;
  }
  try {
    return await (deps.diffPdfs ?? diffPdfPixels)(referencePdf, subjectPdf, options);
  } catch (reason) {
    return {
      available: false,
      ok: false,
      dpi: options.dpi ?? 144,
      threshold: options.threshold ?? 12,
      budget: options.budget ?? 0.02,
      referencePages: 0,
      subjectPages: 0,
      comparedPages: 0,
      pageCountMismatch: false,
      dimensionMismatch: false,
      pixels: 0,
      mismatchPixels: 0,
      mismatchRatio: 1,
      meanAbsoluteError: 1,
      maxChannelDelta: 255,
      pages: [],
      error: formatRuntimeError(reason),
    };
  }
}

function buildDoctorReport(input: {
  input: string;
  plan: ComparisonPlan;
  lint: Report;
  renders: Map<EngineName, RenderAttempt>;
  visualDiff: PdfPixelDiffReport | undefined;
  templateId: string | undefined;
}): DoctorReport {
  const subject = input.renders.get(input.plan.subject);
  const subjectVisuallyAccepted = input.visualDiff === undefined || input.visualDiff.ok;
  const subjectAccepted =
    subject?.result.ok === true &&
    (input.plan.subject === "chromium" || input.lint.conformant) &&
    subjectVisuallyAccepted;
  const chromium = input.renders.get("chromium");
  const recommendation =
    input.visualDiff?.available === false
      ? "manual-review"
      : subjectAccepted
        ? input.plan.subject
        : input.plan.subject === "native" && chromium?.result.ok
          ? "chromium"
          : "manual-review";
  const chromiumUnavailable = Array.from(input.renders.values()).some(
    (render) => render.result.chromiumUnavailable,
  );
  const status = chromiumUnavailable
    ? "reference-unavailable"
    : input.visualDiff?.available === false
      ? "diff-unavailable"
      : recommendation === "native"
        ? "pass"
        : recommendation === "chromium"
          ? "needs-browser"
          : "fail";

  const reference = reportReference(input.plan.reference);
  const report: DoctorReport = {
    version: 1,
    status,
    input: input.input,
    reference,
    subject: { type: "engine", engine: input.plan.subject },
    comparison:
      input.plan.wantsPixelDiff && input.plan.reference
        ? {
            reference: comparisonReference(input.plan.reference),
            subject: { type: "engine", engine: input.plan.subject },
          }
        : undefined,
    lint: input.lint,
    renders: renderOrder(input.plan)
      .map((engine) => input.renders.get(engine)?.result)
      .filter((result): result is DoctorRenderResult => result !== undefined),
    visualDiff: input.visualDiff,
    recommendation,
  };
  if (input.templateId && (recommendation === "native" || recommendation === "chromium")) {
    report.policySuggestion = {
      version: 1,
      templates: {
        [input.templateId]: {
          selectedEngine: recommendation,
          reason:
            recommendation === "native"
              ? "native lint and render checks passed"
              : "Chromium output matched the selected fidelity reference",
        },
      },
    };
  }
  return report;
}

async function writeDoctorArtifacts(
  outDir: string,
  report: DoctorReport,
  renders: Map<EngineName, RenderAttempt>,
  referencePdf: Uint8Array | undefined,
  io: CliIo,
): Promise<void> {
  await io.mkdir(outDir);
  await io.writeFile(join(outDir, "report.json"), printJson(report));
  for (const [engine, render] of renders) {
    if (render.pdf) {
      await io.writeFile(join(outDir, `${engine}.pdf`), render.pdf);
    }
  }
  if (referencePdf) {
    await io.writeFile(join(outDir, "reference.pdf"), referencePdf);
  }
  if (report.policySuggestion) {
    await io.writeFile(join(outDir, "vellora.fidelity.json"), printJson(report.policySuggestion));
  }
}

function printHumanDoctor(report: DoctorReport): string {
  const rows = report.renders
    .map((render) =>
      render.ok
        ? `- ${render.engine}: ok (${render.bytes ?? 0} bytes)`
        : `- ${render.engine}: failed (${render.error ?? "unknown error"})`,
    )
    .join("\n");
  const comparison = report.comparison
    ? `Comparison: ${report.comparison.reference.type}${report.comparison.reference.path ? ` (${report.comparison.reference.path})` : ""} -> ${report.comparison.subject.engine}\n`
    : "";
  const visual = report.visualDiff
    ? report.visualDiff.available
      ? `Pixel diff: ${(report.visualDiff.mismatchRatio * 100).toFixed(3)}% mismatched (${report.visualDiff.mismatchPixels}/${report.visualDiff.pixels} px), budget ${(report.visualDiff.budget * 100).toFixed(3)}%\n`
      : `Pixel diff: unavailable (${report.visualDiff.error ?? "unknown error"})\n`
    : "";
  return `Fidelity doctor: ${report.status}
Recommendation: ${report.recommendation}
Subject: ${report.subject.engine}
${comparison}${rows}
${visual}
Lint findings: ${report.lint.findings.length}
`;
}

export async function handleDoctor(args: string[], io: CliIo, deps: CliDeps): Promise<ExitCode> {
  const parsed = parseArgs({
    args,
    allowPositionals: true,
    options: {
      out: { type: "string" },
      data: { type: "string" },
      title: { type: "string" },
      "creation-date": { type: "string" },
      "no-strict": { type: "boolean" },
      "template-id": { type: "string" },
      policy: { type: "string" },
      "base-url": { type: "string" },
      image: { type: "string", multiple: true },
      font: { type: "string", multiple: true },
      reference: { type: "string" },
      "reference-pdf": { type: "string" },
      subject: { type: "string" },
      "pixel-diff": { type: "boolean" },
      "pixel-budget": { type: "string" },
      "pixel-threshold": { type: "string" },
      dpi: { type: "string" },
      pdftoppm: { type: "string" },
      json: { type: "boolean" },
      help: { type: "boolean", short: "h" },
    },
  });
  if (bool(parsed.values.help)) {
    io.stdout(DOCTOR_USAGE);
    return EXIT_CODES.success;
  }

  const input = requireSingleInput("doctor", parsed.positionals);
  const out = asString(parsed.values.out);
  const plan = buildComparisonPlan(parsed.values, out);
  const html = await readInput(input, io);
  const { data, opts } = await buildRenderInputs(parsed.values, io);
  const engines = renderOrder(plan);
  const [lint, renderEntries, referencePdf] = await Promise.all([
    deps.diagnose(html),
    Promise.all(
      engines.map(
        async (engine) => [engine, await attemptRender(engine, html, data, opts, deps)] as const,
      ),
    ),
    plan.reference?.type === "pdf" ? io.readFile(plan.reference.path) : Promise.resolve(undefined),
  ]);
  const renders = new Map<EngineName, RenderAttempt>(renderEntries);
  const referencePdfForDiff =
    plan.reference?.type === "pdf"
      ? referencePdf
      : plan.reference?.type === "engine"
        ? renders.get(plan.reference.engine)?.pdf
        : undefined;
  const subjectPdf = renders.get(plan.subject)?.pdf;
  const visualDiff = plan.wantsPixelDiff
    ? await attemptPixelDiff(referencePdfForDiff, subjectPdf, plan.pixelOptions, deps)
    : undefined;
  const report = buildDoctorReport({
    input: input === "-" ? "<stdin>" : input,
    plan,
    lint,
    renders,
    visualDiff,
    templateId: asString(parsed.values["template-id"]),
  });

  if (out) {
    await writeDoctorArtifacts(out, report, renders, referencePdf, io);
  }
  io.stdout(bool(parsed.values.json) ? printJson(report) : printHumanDoctor(report));
  if (report.status === "reference-unavailable") {
    return EXIT_CODES.referenceUnavailable;
  }
  if (report.status === "diff-unavailable") {
    return EXIT_CODES.runtimeFailure;
  }
  return report.status === "pass" ? EXIT_CODES.success : EXIT_CODES.diagnosticsFound;
}
