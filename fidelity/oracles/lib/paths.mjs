import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const ORACLES_DIR = resolve(dirname(fileURLToPath(import.meta.url)), "..");
export const FIDELITY_DIR = resolve(ORACLES_DIR, "..");
export const REPO_ROOT = resolve(FIDELITY_DIR, "..");
export const PY_DIR = join(ORACLES_DIR, "py");
export const DEFAULT_RESULTS_DIR = join(FIDELITY_DIR, "results", "oracles");

export const VENV_PYTHON = join(FIDELITY_DIR, ".venv", "bin", "python");

/**
 * Python interpreter of fidelity/.venv (override: VELLORA_FIDELITY_PYTHON), or null when the
 * chosen path does not exist. Callers turn null into a "not-run" verdict with
 * pythonUnavailableReason(); an override that points nowhere is never spawned.
 */
export function venvPython() {
  const candidate = process.env.VELLORA_FIDELITY_PYTHON || VENV_PYTHON;
  return existsSync(candidate) ? candidate : null;
}

export function pythonUnavailableReason() {
  const override = process.env.VELLORA_FIDELITY_PYTHON;
  return override
    ? `VELLORA_FIDELITY_PYTHON=${override} does not exist`
    : "fidelity/.venv missing (see fidelity/oracles/README.md)";
}

export const DEFAULT_CHROME_PATH =
  process.platform === "darwin"
    ? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
    : "/usr/bin/google-chrome";

/** Chrome executable (override: VELLORA_ORACLE_CHROME or PUPPETEER_EXECUTABLE_PATH). */
export function chromePath() {
  return (
    process.env.VELLORA_ORACLE_CHROME ??
    process.env.PUPPETEER_EXECUTABLE_PATH ??
    DEFAULT_CHROME_PATH
  );
}
