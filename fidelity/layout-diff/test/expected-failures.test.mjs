// The committed allowlist of expected layout-diff check failures: every entry is well-formed,
// names a real check id, and the classification enforces the expiry.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { classifyCheckFailures, loadExpectedFailures } from "../lib/expected-failures.mjs";

const here = dirname(fileURLToPath(import.meta.url));

test("every allowlist entry has fixture, check, reason, expiry and names a check lib/checks.mjs emits", () => {
  const entries = loadExpectedFailures();
  assert.ok(entries.length > 0);
  const checksSource = readFileSync(join(here, "..", "lib", "checks.mjs"), "utf8");
  for (const e of entries) {
    assert.ok(e.reason.length > 40, `${e.fixture}/${e.check}: reason too thin`);
    assert.ok(e.expires.length > 10, `${e.fixture}/${e.check}: no expiry condition`);
    assert.ok(
      checksSource.includes(`"${e.check}"`),
      `${e.check} is not a check id of lib/checks.mjs`,
    );
  }
  // Font parity of oss-postmark-receipt is fixed by the shared alias table, never allowlisted.
  assert.ok(
    !entries.some((e) => e.check === "bundled_fonts_loaded" || e.check === "platform_fonts_custom"),
  );
});

test("classification: listed failures are expected, others unexpected, passing listed checks expired", () => {
  const entries = [
    { fixture: "receipt", check: "a", reason: "r", expires: "x" },
    { fixture: "receipt", check: "b", reason: "r", expires: "x" },
    { fixture: "receipt", check: "c", reason: "r", expires: "x" },
    { fixture: "other", check: "z", reason: "r", expires: "x" },
  ];
  const c = classifyCheckFailures("receipt", { failed: ["a", "d"], not_run: ["c"] }, entries);
  assert.deepEqual(
    c.expected.map((e) => e.check),
    ["a"],
  );
  assert.deepEqual(c.unexpected, ["d"]);
  assert.deepEqual(
    c.expired.map((e) => e.check),
    ["b"],
  );
});
