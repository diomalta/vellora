// PDF/A oracle: the official veraPDF CLI in its pinned Docker image, PDF/A-2B profile,
// machine-readable JSON report (`--format json`). Java is not required on the host.
// Parser flavour CONFIRMED 2026-10-21 by listing /opt/verapdf/bin/cli-1.30.3.jar: it bundles
// org.verapdf:parser (veraPDF's own "greenfield" COS/PD parser) and contains no
// org/apache/pdfbox classes.
//
// veraPDF CLI exit codes as OBSERVED with 1.30.3 on 2026-10-21: 0 = compliant, 1 = not compliant;
// anything else is treated as a processing failure. The verdict comes from the report's `compliant` flag, not only the
// exit code, and every failed rule is listed with its ISO 19005-2 clause and test number.
import { basename, dirname } from "node:path";
import { VERAPDF_IMAGE, VERAPDF_PLATFORM, dockerRun, inspectImage } from "./docker.mjs";

export const VERAPDF_FLAVOUR = "2b";

/** Parse the veraPDF JSON report into failed rules with clause numbers. */
export function parseVeraJson(json) {
  const report = typeof json === "string" ? JSON.parse(json) : json;
  const releases = report.report?.buildInformation?.releaseDetails ?? [];
  const job = report.report?.jobs?.[0];
  const validation = job?.validationResult?.[0] ?? job?.validationResult;
  if (!validation) {
    const exception = job?.taskException ?? report.report?.batchSummary;
    return { parsed: false, releases, exception };
  }
  const failedRules = (validation.details?.ruleSummaries ?? [])
    .filter((rule) => rule.ruleStatus === "FAILED" || rule.status === "failed")
    .map((rule) => ({
      specification: rule.specification,
      clause: rule.clause,
      testNumber: rule.testNumber,
      failedChecks: rule.failedChecks,
      description: rule.description,
      object: rule.object,
      firstContexts: (rule.checks ?? []).slice(0, 3).map((check) => ({
        context: check.context,
        errorMessage: check.errorMessage,
      })),
    }));
  return {
    parsed: true,
    releases,
    profileName: validation.profileName,
    statement: validation.statement,
    compliant: validation.compliant === true,
    passedRules: validation.details?.passedRules,
    failedRules: validation.details?.failedRules,
    passedChecks: validation.details?.passedChecks,
    failedChecks: validation.details?.failedChecks,
    rules: failedRules,
  };
}

/**
 * @param expectCompliant true for a `pdfa: "PDF/A-2b"` render, false for a plain render (the
 * negative control: a plain PDF must NOT pass), undefined to only report. status "pass" means
 * the outcome matched the expectation, so a plain render failing PDF/A-2B is a pass of the
 * control.
 */
export async function veraPdfOracle({ pdfPath, expectCompliant }) {
  const image = await inspectImage(VERAPDF_IMAGE);
  if (!image.available) {
    return { oracle: "verapdf", status: "not-run", reason: image.reason };
  }
  const started = Date.now();
  const result = await dockerRun(
    VERAPDF_IMAGE,
    ["--flavour", VERAPDF_FLAVOUR, "--format", "json", `/data/${basename(pdfPath)}`],
    {
      platform: VERAPDF_PLATFORM,
      mounts: [{ host: dirname(pdfPath), container: "/data", readonly: true }],
      timeoutMs: 600_000,
    },
  );
  const tool = {
    name: "veraPDF CLI",
    image: VERAPDF_IMAGE,
    imageId: image.id,
    imageArchitecture: image.architecture,
    emulated: process.arch === "arm64" && image.architecture === "amd64",
    flavour: `PDF/A-${VERAPDF_FLAVOUR.toUpperCase()}`,
    exitCode: result.code,
    durationMs: Date.now() - started,
  };
  let parsed;
  try {
    parsed = parseVeraJson(result.stdout);
  } catch (error) {
    return {
      oracle: "verapdf",
      status: "not-run",
      reason: `could not parse veraPDF output (exit ${result.code}): ${error.message}; stderr: ${result.stderr.slice(0, 400)}`,
      tool,
    };
  }
  if (!parsed.parsed) {
    return {
      oracle: "verapdf",
      status: "not-run",
      reason: "veraPDF produced no validation result",
      tool,
      details: parsed,
    };
  }
  tool.version = parsed.releases.find((r) => r.id === "apps")?.version ?? null;
  if (expectCompliant === undefined) {
    return {
      oracle: "verapdf",
      status: "info",
      compliant: parsed.compliant,
      role: "report-only",
      tool,
      report: parsed,
    };
  }
  const matched = parsed.compliant === expectCompliant;
  return {
    oracle: "verapdf",
    status: matched ? "pass" : "fail",
    expectCompliant,
    compliant: parsed.compliant,
    role: expectCompliant ? "conformance" : "negative-control",
    tool,
    report: parsed,
  };
}
