/**
 * @vellora/lint — dev-time diagnose + fix for the vellora HTML/CSS subset.
 *
 * `diagnose(html)` returns a structured, AI-agent-ready report of subset violations (read-only).
 * `fix(html)` applies four deterministic, idempotent codemods (inline-svg→PNG, flex/grid-in-<td>→
 * table, img dims→CSS, sanitize invalid markup) and returns `{ html, report }`.
 *
 * This is dev-time/CI tooling and NEVER runs at render time. Importing this module is side-effect
 * free: no network, no filesystem, no work happens until `diagnose`/`fix` is called.
 */
export { diagnose } from "./diagnose.js";
export { fix } from "./fix.js";
export { COMPAT_LINKS } from "./compat.js";
export type { Finding, Report, RuleId, Severity, SourceLocation } from "./types.js";

/** Package name, retained for the scaffold smoke test. */
export const name = "@vellora/lint";
