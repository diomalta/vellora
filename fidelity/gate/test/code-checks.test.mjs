// The code-checks step names the failing tests (cargo's "failures:" block), so a red gate says
// exactly which test is red; and its check list never uses `npm test` (which stops after Rust).
import assert from "node:assert/strict";
import { test } from "node:test";
import { CODE_CHECKS, cargoFailures } from "../code-checks.mjs";

const LOG = `running 163 tests
test text::mixed_weight_inline_siblings_advance_by_the_first_run_width ... FAILED

failures:

---- text::mixed_weight_inline_siblings_advance_by_the_first_run_width stdout ----
thread 'x' panicked at crates/vellora-core/tests/text.rs:10:5:
assertion failed: "LTDA— CNPJ" vs "LTDA — CNPJ"

failures:
    text::mixed_weight_inline_siblings_advance_by_the_first_run_width

test result: FAILED. 162 passed; 1 failed; 0 ignored
`;

test("cargoFailures lists the failing test names from the summary block", () => {
  assert.deepEqual(cargoFailures(LOG), [
    "text::mixed_weight_inline_siblings_advance_by_the_first_run_width",
  ]);
  assert.deepEqual(cargoFailures("test result: ok. 3 passed"), []);
});

test("the checks are cargo test (no-fail-fast), vitest, lint and the fidelity self-tests", () => {
  assert.deepEqual(
    CODE_CHECKS.map((c) => c.id),
    ["cargo-test", "vitest", "lint", "fidelity-test"],
  );
  assert.ok(CODE_CHECKS[0].args.includes("--no-fail-fast"));
  assert.ok(!CODE_CHECKS.some((c) => c.args.join(" ") === "test"));
});
