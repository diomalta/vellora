/**
 * Benchmark suite configuration: tool set, pinned versions, concurrency N, run
 * count, equivalence baseline fixture.
 *
 * Versions are pinned here AND captured into every result record (see
 * lib/stats.mjs) so a published number is always traceable to the exact tool
 * build that produced it.
 */
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, "..");

/**
 * The equivalence baseline: the neutral multi-page invoice fixture. Every tool
 * renders THIS, and its output is checked against the baseline page count +
 * expected content before any timing is recorded.
 */
export const baseline = {
  name: "invoice",
  fixtureDir: join(repoRoot, "fixtures", "invoice"),
  htmlPath: join(repoRoot, "fixtures", "invoice", "index.html"),
  dataPath: join(repoRoot, "fixtures", "invoice", "data.json"),
  /**
   * Minimum page count asserted when no vellora reference render is available
   * yet; otherwise the exact reference count is enforced (see lib/equivalence.mjs).
   */
  minPages: 2,
  /** Substrings that MUST appear in the extracted text of an equivalent PDF. */
  expectedContent: ["INV-2026-00417", "Acme Widgets", "Borges & Pinto"],
};

/**
 * Run shape. N drives the concurrency RSS axis AND the warm sample count that
 * median/p95 are computed over. Kept modest so a local indicative run is
 * quick; CI can override via env.
 */
export const run = {
  concurrency: Number(process.env.BENCH_CONCURRENCY ?? 8),
  warmRuns: Number(process.env.BENCH_WARM_RUNS ?? 50),
  warmupRuns: Number(process.env.BENCH_WARMUP_RUNS ?? 5),
};

/**
 * The tool set. `kind` distinguishes how an axis applies:
 *   - "in-process"  : runs inside this Node process or a worker; Docker image
 *                     size is N/A (recorded with a reason, never zeroed).
 *   - "browser"     : long-lived browser reused across renders.
 *   - "http-service": standing HTTP service (its own container image).
 *
 * `pinnedVersion` is the documented pin; adapters also self-report the version
 * actually loaded at runtime so drift is detectable.
 */
export const tools = [
  {
    id: "vellora",
    label: "vellora",
    kind: "in-process",
    adapter: "./adapters/vellora.mjs",
    pinnedVersion: "0.1.0-alpha.0",
    longLivedMode: "in-process (public vellora API, no worker/browser)",
    isSubject: true,
  },
  {
    id: "puppeteer",
    label: "Puppeteer",
    kind: "browser",
    adapter: "./adapters/puppeteer.mjs",
    pinnedVersion: "23.6.0",
    longLivedMode: "one Chromium launched once, reused across warm renders",
  },
  {
    id: "playwright",
    label: "Playwright",
    kind: "browser",
    adapter: "./adapters/playwright.mjs",
    pinnedVersion: "1.48.2",
    longLivedMode: "one Chromium launched once, reused across warm renders",
  },
  {
    id: "gotenberg",
    label: "Gotenberg",
    kind: "http-service",
    adapter: "./adapters/gotenberg.mjs",
    pinnedVersion: "8.11.1",
    image: "gotenberg/gotenberg:8.11.1",
    endpoint: process.env.GOTENBERG_URL ?? "http://localhost:3000",
    longLivedMode: "standing HTTP service (Chromium pool inside the container)",
  },
  {
    id: "weasyprint",
    label: "WeasyPrint",
    kind: "in-process",
    adapter: "./adapters/weasyprint.mjs",
    pinnedVersion: "62.3",
    longLivedMode: "in-process inside a warm long-lived Python worker (NOT subprocess-per-render)",
  },
];

/**
 * The pdf4.dev "~3ms warm" figure. Treated as an UNVERIFIED external bar — it
 * is NEVER quoted as fact and is only ever compared against vellora's own warm
 * distribution. The reporter prints it labeled as unverified.
 */
export const externalReference = {
  source: "pdf4.dev",
  claim: "~3ms warm render",
  status:
    "UNVERIFIED — vendor benchmark with a known subprocess-per-render flaw; not a trusted datum",
  comparedAgainst: "vellora warm distribution only",
};

export const results = {
  dir: join(__dirname, "results"),
};
