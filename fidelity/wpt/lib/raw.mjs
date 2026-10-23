// Raw-Blitz mode (`run.mjs --raw`): every reftest rendered a second time from Blitz's own layout
// WITHOUT vellora's layout corrections, so a WPT outcome change can be attributed the way the
// layout-diff `B0` layer attributes a layer-vector item. See README "Raw-Blitz mode".
//
// The raw render is `vellora_core::debug_render_raw_blitz` (crates/vellora-core/src/lib.rs),
// reached through the `xhtml_render` example binary with request record `R` (lib/xhtml-bridge.mjs).
// Relative to the product render it turns off: the box walk's reader compensations (inline
// padding-right advance), every `layout_normalize` pass, the display-list rect merge, and
// vellora's paginator (replaced by
// `pagination::paginate_flat`: the flow cut into page-tall bands, no break rules, no <thead>
// repeat, no margin boxes). It keeps: the strict gates, the `@page` box, print media, the parser
// (XML for nodes WPT serves as XML, as in the product run), fonts, images, the walk's placement
// of Blitz's boxes and runs (Blitz's painter's) and the PDF emit.
//
// Per test, results.json gains `rawOutcome` (same vocabulary as `outcome`: pass, pass-blank,
// fail, unsupported, error, timeout, skip; `skip` = a harness-level skip, not rendered in either
// pass) and `raw` (the raw pass's comparisons / cause). outcomes.json gains `rawOutcomes`
// ({ test: rawOutcome }) and `rawMode`. Neither changes `outcome` or any ratchet input.
import { spawnSync } from "node:child_process";
import { encodeRequest } from "./xhtml-bridge.mjs";

/** The vocabulary of `rawOutcome` (identical to `outcome`'s). */
export const RAW_OUTCOMES = [
  "pass",
  "pass-blank",
  "fail",
  "unsupported",
  "error",
  "timeout",
  "skip",
];

/** The `config.raw` record of a `--raw` run. */
export function RAW_MODE_INFO({ xhtmlRender, xmlParse }) {
  return {
    enabled: true,
    field: "rawOutcome",
    render:
      "renderPdf(..., { _bridge: xhtml_render R=1 }) = vellora_core::debug_render_raw_blitz (Blitz layout as its painter places it; no reader compensations, no layout_normalize passes, no display-list rect merge, paginate_flat)",
    keeps: [
      "strict gates (validate_css, depth, fonts, element gate, unresolved images)",
      "@page box (size, margins; Blitz viewport = content box)",
      "print media",
      xmlParse
        ? "parser: XML for .xht/.xhtml/.xml nodes, HTML otherwise"
        : "parser: HTML for every node",
      "fonts, images, box walk placement (containing-block origins, block_offset), krilla emit",
    ],
    drops: [
      "reader compensation: inline padding-right advance (run_padding_right_px)",
      "layout_normalize passes (LAYOUT_NORMALIZE_PASSES)",
      "display-list rect merge (merge_adjacent_rects: touching same-colour rects)",
      "pagination: break rules, keep-together, <thead> repeat, fit tolerance, margin boxes (flat page bands instead)",
    ],
    xmlParse,
    xhtmlRender,
  };
}

/**
 * Why the binary cannot run the raw-Blitz render, or null. One probe render (HTML parse, `R`):
 * a binary built before the raw mode rejects the request (exit 2, unknown record tag).
 */
export function rawRenderProblem(bin, { spawn = spawnSync } = {}) {
  if (!bin) return "no xhtml_render binary";
  const request = encodeRequest(
    "<!DOCTYPE html><p>raw probe</p>",
    {},
    { raw: true, parser: "html" },
  );
  const out = spawn(bin, [], { input: request, maxBuffer: 64 << 20 });
  if (out.error) return `cannot run ${bin}: ${out.error.message}`;
  if (out.status !== 0) {
    const err = String(out.stderr ?? "").trim();
    return `${bin} does not run the raw-Blitz render (exit ${out.status}${err ? `: ${err}` : ""}); rebuild it from a checkout that has debug_render_raw_blitz`;
  }
  if (
    !Buffer.from(out.stdout ?? [])
      .subarray(0, 5)
      .equals(Buffer.from("%PDF-"))
  ) {
    return `${bin} answered the raw probe without a PDF`;
  }
  return null;
}

function compactRaw(r) {
  const out = { outcome: r.outcome };
  for (const k of ["node", "cause", "comparisons", "blank", "pageCount"]) {
    if (r[k] !== undefined) out[k] = r[k];
  }
  return out;
}

/**
 * Record each raw-pass result on the product result of the same test: `rawOutcome` and `raw`.
 * A harness-level skip (never rendered) is `skip` on both sides; a test the raw pass has no
 * result for (cannot happen with lib/pool.mjs, which records every task) is an `error`.
 */
export function attachRawOutcomes(results, rawByTest) {
  for (const r of results) {
    if (r.outcome === "skip") {
      r.rawOutcome = "skip";
      continue;
    }
    const raw = rawByTest.get(r.test);
    if (!raw) {
      r.rawOutcome = "error";
      r.raw = {
        outcome: "error",
        cause: { status: "error", kind: "harness", message: "no raw result" },
      };
      continue;
    }
    r.rawOutcome = raw.outcome;
    r.raw = compactRaw(raw);
  }
  return results;
}

/** Counts of `rawOutcome` and the `outcome` x `rawOutcome` matrix. */
export function rawCrossTab(results) {
  const counts = {};
  const matrix = {};
  for (const r of results) {
    if (r.rawOutcome === undefined) continue;
    counts[r.rawOutcome] = (counts[r.rawOutcome] ?? 0) + 1;
    matrix[r.outcome] ??= {};
    matrix[r.outcome][r.rawOutcome] = (matrix[r.outcome][r.rawOutcome] ?? 0) + 1;
  }
  return { counts, matrix };
}

/** outcomes.json of a `--raw` run: the expectations plus `rawMode` and `rawOutcomes`. */
export function withRawOutcomes(expectations, results, rawConfig) {
  if (!rawConfig) return expectations;
  const rawOutcomes = {};
  for (const r of [...results].sort((a, b) => (a.test < b.test ? -1 : 1))) {
    if (r.rawOutcome !== undefined) rawOutcomes[r.test] = r.rawOutcome;
  }
  return { ...expectations, rawMode: rawConfig.render, rawOutcomes };
}

/** The ink flags that make an old pass a proven false pass (fidelity/gate/tolerances.mjs). */
export const FALSE_PASS_INK_FLAGS = ["ink-missing-vs-chrome", "ink-displaced-vs-chrome"];

/**
 * Whether an OLD pass is proven false in the GATE-A1 (a) sense: test = reference != Chrome, by
 * ink (the old run flagged the pass `ink-missing-vs-chrome` / `ink-displaced-vs-chrome`) or by
 * page count (the old run's test rendering has a different page count than Chrome's).
 * `flags`: the old expectations' suspect flags of the test (comma list or array);
 * `pages`/`chromePages`: page counts of the old test rendering and of Chrome's.
 */
export function oldPassProvenFalse({ flags, pages, chromePages }) {
  const list = Array.isArray(flags)
    ? flags
    : String(flags ?? "")
        .split(",")
        .filter(Boolean);
  const ink = list.filter((f) => FALSE_PASS_INK_FLAGS.includes(f));
  const pageMismatch =
    Number.isInteger(pages) && Number.isInteger(chromePages) && pages !== chromePages;
  return { falsePass: ink.length > 0 || pageMismatch, ink, pageMismatch };
}

/**
 * The evidence class a WPT pass lost between two runs points to, from the run's `outcome` and
 * `rawOutcome`, and whether the old pass is proven false (`oldPassFalse`, see
 * [`oldPassProvenFalse`]). Attribution AID only (a candidate, not a gate verdict;
 * fidelity/ACCEPTANCE.md GATE-A1):
 *
 * - `a`: the old pass was a false pass (test = reference != Chrome by ink or page count, measured
 *   on the OLD run), so losing it is no regression evidence. Chrome failing its own reftest is NOT
 *   this criterion (it is reported beside the class as supporting evidence only);
 * - `b`: the raw-Blitz render is not a pass either, i.e. Blitz's own layout (as its painter
 *   places it) already fails without any vellora correction: an upstream-owned candidate;
 * - `c`: the raw-Blitz render passes and vellora's does not: one of vellora's layers (reader
 *   compensations, normalize passes, pagination, margin boxes) loses the pass; vellora owns it;
 * - `none`: no evidence (not a lost pass, no raw outcome, or a raw `unsupported`).
 *
 * A print-mode `b` is weaker: the raw render's flat pagination is a worse paginator than any, so
 * a raw failure there may be pagination's (see README); callers should keep `mode` beside it.
 */
export function rawCandidateClass({ outcome, rawOutcome, oldPassFalse = false }) {
  if (outcome === "pass") return "none";
  if (oldPassFalse) return "a";
  if (rawOutcome === undefined || rawOutcome === "skip") return "none";
  if (rawOutcome === "pass") return "c";
  if (["pass-blank", "fail", "error", "timeout"].includes(rawOutcome)) return "b";
  // `unsupported`: the raw render runs the product's gates, so it rejects exactly what the
  // product rejects; a rejection is judged by the declared-rejection rule, not by raw evidence.
  return "none";
}

/** The summary.md section of a `--raw` run. */
export function rawSummaryMarkdown(rawInfo) {
  const cols = RAW_OUTCOMES.filter((o) =>
    Object.values(rawInfo.matrix).some((row) => row[o] !== undefined),
  );
  const lines = [
    "",
    "## Raw-Blitz outcomes (`--raw`)",
    "",
    `Render: ${rawInfo.render}.`,
    "",
    `| outcome / rawOutcome | ${cols.join(" | ")} |`,
    `|---|${cols.map(() => "---").join("|")}|`,
  ];
  for (const [outcome, row] of Object.entries(rawInfo.matrix)) {
    lines.push(`| ${outcome} | ${cols.map((c) => row[c] ?? 0).join(" | ")} |`);
  }
  return `${lines.join("\n")}\n`;
}
