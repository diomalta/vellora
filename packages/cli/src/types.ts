import type { Report } from "@vellora/lint";
import type { RenderData, RenderOptions } from "vellora";
import type { PdfPixelDiffReport, PixelDiffOptions } from "./pixel-diff.js";

export const EXIT_CODES = {
  success: 0,
  diagnosticsFound: 1,
  invalidUsage: 2,
  runtimeFailure: 3,
  referenceUnavailable: 4,
} as const;

export type ExitCode = (typeof EXIT_CODES)[keyof typeof EXIT_CODES];

export interface CliDeps {
  renderPdf(html: string, data?: RenderData, opts?: RenderOptions): Promise<Uint8Array>;
  diagnose(html: string): Report | Promise<Report>;
  fix(html: string): { html: string; report: Report } | Promise<{ html: string; report: Report }>;
  diffPdfs?(
    referencePdf: Uint8Array,
    subjectPdf: Uint8Array,
    options?: PixelDiffOptions,
  ): Promise<PdfPixelDiffReport>;
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
