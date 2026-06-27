import { readFile } from "node:fs/promises";
import { VelloraError, VelloraInputError } from "./errors.js";
import type { PolicySelectedEngine, RenderEnginePolicy } from "./types.js";

export const DEFAULT_FIDELITY_POLICY_PATH = "vellora.fidelity.json";

export interface RenderEnginePolicySummary {
  templates: number;
  native: number;
  chromium: number;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function assertSelectedEngine(engine: unknown): asserts engine is PolicySelectedEngine {
  if (engine === "native" || engine === "chromium") {
    return;
  }
  throw new VelloraInputError(
    `fidelity policy selectedEngine must be "native" or "chromium"; received ${JSON.stringify(engine)}.`,
  );
}

export function parseRenderEnginePolicy(text: string, path: string): RenderEnginePolicy {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text) as unknown;
  } catch (cause) {
    throw new VelloraInputError(`Invalid fidelity policy JSON at ${JSON.stringify(path)}.`, {
      cause,
    });
  }
  if (!isRecord(parsed)) {
    throw new VelloraInputError(`Fidelity policy ${JSON.stringify(path)} must be a JSON object.`);
  }
  if (parsed.version !== 1) {
    throw new VelloraInputError(
      `Fidelity policy ${JSON.stringify(path)} must declare {"version":1}.`,
    );
  }
  if (!isRecord(parsed.templates)) {
    throw new VelloraInputError(
      `Fidelity policy ${JSON.stringify(path)} must contain a templates object.`,
    );
  }
  for (const [templateId, entry] of Object.entries(parsed.templates)) {
    if (!isRecord(entry)) {
      throw new VelloraInputError(
        `Fidelity policy ${JSON.stringify(path)} template ${JSON.stringify(templateId)} must be an object.`,
      );
    }
    assertSelectedEngine(entry.selectedEngine);
  }
  return parsed as unknown as RenderEnginePolicy;
}

export function summarizeRenderEnginePolicy(policy: RenderEnginePolicy): RenderEnginePolicySummary {
  let native = 0;
  let chromium = 0;
  for (const entry of Object.values(policy.templates)) {
    if (entry.selectedEngine === "native") {
      native += 1;
    } else {
      chromium += 1;
    }
  }
  return { templates: native + chromium, native, chromium };
}

export async function loadRenderEnginePolicy(
  path = DEFAULT_FIDELITY_POLICY_PATH,
  reader: (path: string) => Promise<string> = (policyPath) => readFile(policyPath, "utf8"),
): Promise<RenderEnginePolicy> {
  try {
    return parseRenderEnginePolicy(await reader(path), path);
  } catch (cause) {
    if (cause instanceof VelloraError) {
      throw cause;
    }
    throw new VelloraInputError(`Unable to read fidelity policy ${JSON.stringify(path)}.`, {
      cause,
    });
  }
}
