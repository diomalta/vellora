// Per-fixture allowlist of EXPECTED layout-diff check failures
// (fidelity/layout-diff/expected-check-failures.json). A failing check listed for its fixture is
// reported as "expected" and does not make run.mjs exit 2 nor fail the gate; any other failure
// does. Every entry carries a reason and an expiry condition, and the expiry is ENFORCED: an
// allowlisted check that passes (or only warns) is "expired" and fails both run.mjs and the gate
// until the entry is removed, so the list cannot rot. An allowlisted check that did not run is
// neither expected nor expired (reported by the check's own not-run status).
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export const EXPECTED_FAILURES_FILE = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "expected-check-failures.json",
);

export function loadExpectedFailures(path = EXPECTED_FAILURES_FILE) {
  const doc = JSON.parse(readFileSync(path, "utf8"));
  for (const e of doc.entries ?? []) {
    if (!e.fixture || !e.check || !e.reason || !e.expires) {
      throw new Error(
        `${path}: entry needs fixture, check, reason and expires: ${JSON.stringify(e)}`,
      );
    }
  }
  return doc.entries ?? [];
}

/**
 * Classify a fixture's checks against the allowlist. `summary` is a checks_summary
 * ({ failed, warned, not_run }). Returns { expected: [entry], unexpected: [checkId], expired:
 * [entry] }. `entries === null` loads the committed file.
 */
export function classifyCheckFailures(fixture, summary, entries = null) {
  const list = (entries ?? loadExpectedFailures()).filter((e) => e.fixture === fixture);
  const failed = summary.failed ?? [];
  const notRun = summary.not_run ?? [];
  const byCheck = new Map(list.map((e) => [e.check, e]));
  const expected = failed.filter((c) => byCheck.has(c)).map((c) => byCheck.get(c));
  const unexpected = failed.filter((c) => !byCheck.has(c));
  const expired = list.filter((e) => !failed.includes(e.check) && !notRun.includes(e.check));
  return { expected, unexpected, expired };
}
