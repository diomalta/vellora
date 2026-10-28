import { execFile } from "node:child_process";
import { existsSync } from "node:fs";

/**
 * Run a command and resolve with its exit code and output. Never rejects on a non-zero exit:
 * oracles encode verdicts in exit codes (qpdf 2/3, zbarimg 4, veraPDF 1), so the caller decides.
 * Rejects only when the binary cannot be spawned at all (ENOENT, EACCES).
 */
export function run(command, args, { input, timeoutMs = 300_000, cwd, env } = {}) {
  return new Promise((resolvePromise, rejectPromise) => {
    const child = execFile(
      command,
      args,
      {
        cwd,
        env: env ? { ...process.env, ...env } : process.env,
        maxBuffer: 256 * 1024 * 1024,
        timeout: timeoutMs,
        encoding: "utf8",
      },
      (error, stdout, stderr) => {
        if (error && typeof error.code === "string") {
          rejectPromise(error);
          return;
        }
        resolvePromise({
          code: error ? (error.code ?? (error.killed ? "timeout" : 1)) : 0,
          signal: error?.signal ?? null,
          stdout,
          stderr,
          command: [command, ...args].join(" "),
        });
      },
    );
    if (input !== undefined) {
      child.stdin.end(input);
    }
  });
}

/** Resolve an executable from an env override or PATH; null when absent. */
export async function findExecutable(name, envName) {
  const override = envName ? process.env[envName] : undefined;
  if (override) {
    return existsSync(override) ? override : null;
  }
  try {
    const { code, stdout } = await run("/usr/bin/which", [name]);
    const resolved = stdout.trim();
    return code === 0 && resolved ? resolved : null;
  } catch {
    return null;
  }
}

/** First line of `cmd args` output (stdout, else stderr), or null when it cannot run. */
export async function versionLine(command, args = ["--version"]) {
  try {
    const { stdout, stderr } = await run(command, args, { timeoutMs: 60_000 });
    const text = (stdout || stderr).trim();
    return text ? text.split("\n")[0].trim() : null;
  } catch {
    return null;
  }
}
