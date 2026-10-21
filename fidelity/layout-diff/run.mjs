#!/usr/bin/env node
// Per-layer layout-tree diff: Chromium continuous-flow DOMSnapshot vs vellora's layout layers
// (N0 Blitz on the source HTML, B0 Blitz on html_normalize's output, L0 box walk, one layer per
// layout_normalize pass).
//
//   node fidelity/layout-diff/run.mjs [--fixtures invoice,receipt,boleto,notification]
//     [--dump-repo <checkout>] [--label <name>] [--chrome <path>] [--out <dir>]
//     [--tolerance 0.5] [--text-tolerance 0.5] [--top 20] [--include-inline] [--no-build]
//     [--allow-check-failures]
//
// --dump-repo: checkout whose crates/vellora-core provides the layout_dump example (default: this
// one). Templating ALWAYS uses this checkout's built `vellora` package, so two dump repos (e.g. the
// Blitz pin and a Blitz bump) are compared on byte-identical HTML.
// Output: <out>/<fixture>/<label>/{native.html,browser.html,vellora-dump.json,
//         vellora-dump-source.json,chrome-snapshot.json,diff.json,report.md,report.html} and
//         <out>/summary-<label>.{json,md}. vellora-dump-source.json is the N0 dump (layout_dump
//         --no-html-normalize); a --dump-repo whose example predates that flag runs without N0
//         (reported as the not-run check `source_html_layer`, never silently).
// Exit code: 0 = every check passed (warnings allowed); 2 = at least one input-parity or
// self-consistency check FAILED (lib/checks.mjs) — all reports are still written, and failures are
// printed at the top of each report and of the summary. --allow-check-failures exits 0 anyway.
import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { runChecks, summarizeChecks } from "./lib/checks.mjs";
import {
  captureSnapshot,
  launchChrome,
  measureBaselines,
  normalizeSnapshot,
  resolveChrome,
} from "./lib/chrome-snapshot.mjs";
import { blitzLabel, captureEnv } from "./lib/env.mjs";
import { FIXTURE_IDS, prepareFixture, repoRoot } from "./lib/fixture-html.mjs";
import { bundledFontFaceCss, bundledFontHashes } from "./lib/fonts.mjs";
import { baselineSpecs, diffLayouts } from "./lib/match.mjs";
import { markdownToHtml, renderMarkdown, renderSummaryMarkdown } from "./lib/report.mjs";
import { buildDumpTool, runDump, velloraModel } from "./lib/vellora-model.mjs";

function arg(name, fallback) {
  const i = process.argv.indexOf(name);
  return i >= 0 && process.argv[i + 1] !== undefined ? process.argv[i + 1] : fallback;
}
const flag = (name) => process.argv.includes(name);

function json(path, value) {
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
}

/** "layer kind coord from->to" of the regressions of an item by layers of one kind. */
function regressedText(item, kind) {
  return item.regressed_by
    .filter((w) => !w.first && (kind !== "pass" || !["N0", "B0", "L0"].includes(w.layer)))
    .map((w) => `${w.layer} ${w.kind}${w.coord ? ` ${w.coord} ${w.from}→${w.to}` : ""}`)
    .join(" + ");
}

async function main() {
  const fixtures = arg("--fixtures", FIXTURE_IDS.join(",")).split(",").filter(Boolean);
  const dumpRepo = resolve(arg("--dump-repo", repoRoot));
  const label = arg("--label", blitzLabel(dumpRepo));
  const out = resolve(arg("--out", join(repoRoot, "fidelity", "results", "layout-diff")));
  const tolerance = Number(arg("--tolerance", "0.5"));
  const textTolerance = Number(arg("--text-tolerance", String(tolerance)));
  const top = Number(arg("--top", "20"));
  const includeInline = flag("--include-inline");
  const chromePath = resolveChrome(arg("--chrome", undefined));

  const env = await captureEnv({
    repo: dumpRepo,
    command: `node ${process.argv.slice(1).join(" ")}`,
    chromePath,
  });
  env.templating_repo = repoRoot;
  env.fonts_sha256 = bundledFontHashes(repoRoot);
  const vellora = await import(
    pathToFileURL(join(repoRoot, "packages/vellora/dist/index.js")).href
  );
  const bin = flag("--no-build")
    ? join(dumpRepo, "target", "release", "examples", "layout_dump")
    : buildDumpTool(dumpRepo);
  const fontCss = bundledFontFaceCss(repoRoot);

  const browser = await launchChrome(chromePath);
  env.chrome_user_agent = await browser.userAgent();
  const rows = [];
  try {
    for (const fixture of fixtures) {
      const dir = join(out, fixture, label);
      mkdirSync(dir, { recursive: true });
      const prepared = prepareFixture(fixture, vellora.renderTemplate, repoRoot);
      const nativePath = join(dir, "native.html");
      writeFileSync(nativePath, prepared.nativeHtml);
      writeFileSync(join(dir, "browser.html"), prepared.browserHtml);
      const dump = runDump(bin, nativePath, join(dir, "vellora-dump.json"));
      let sourceDump = null;
      let sourceNote = null;
      try {
        sourceDump = runDump(bin, nativePath, join(dir, "vellora-dump-source.json"), {
          sourceHtml: true,
        });
      } catch (err) {
        sourceNote = `layout_dump --no-html-normalize failed: ${String(err.stderr ?? err.message)
          .trim()
          .slice(0, 200)}`;
        process.stderr.write(`${fixture} [${label}] N0 NOT RUN: ${sourceNote}\n`);
      }
      const model = velloraModel(dump, { sourceDump });

      const { snapshot, probes, userAgent } = await captureSnapshot(browser, prepared.browserHtml, {
        width: dump.viewport.width_px,
        height: dump.viewport.height_px,
      });
      const records = normalizeSnapshot(snapshot);
      const specs = baselineSpecs(model.layers.find((l) => l.name === "L0").runs);
      const baselines = await measureBaselines(browser, fontCss, specs);
      json(join(dir, "chrome-snapshot.json"), {
        userAgent,
        probes,
        viewport: { width: dump.viewport.width_px, height: dump.viewport.height_px },
        baselines: Object.fromEntries(baselines),
        records,
      });

      const result = diffLayouts({
        chrome: records,
        vellora: model,
        baselines,
        tolerance,
        textTolerance,
        includeInline,
        top,
      });
      const lost = model.page.content_width - dump.viewport.width_px;
      const dejavu = Object.entries(model.faces)
        .filter(([face]) => face.startsWith("DejaVu"))
        .reduce((n, [, c]) => n + c, 0);
      const parity = [
        `@page content box ${model.page.content_width} × ${model.page.content_height} CSS px → Blitz viewport ${dump.viewport.width_px} × ${dump.viewport.height_px} (\`as u32\` truncation in resolve_and_walk drops ${Math.round(lost * 1e4) / 1e4} px of inline size; a KNOWN INPUT divergence vs Chromium print, not an engine difference). Chromium MEASURED: documentElement.clientWidth ${probes.clientWidth}, innerWidth ${probes.innerWidth}, innerHeight ${probes.innerHeight} — ${probes.clientWidth === dump.viewport.width_px && probes.innerWidth === dump.viewport.width_px && probes.innerHeight === dump.viewport.height_px ? "MATCH" : "MISMATCH: the engines laid out different viewports; attribution INVALID (check viewport_width/viewport_height)"}.`,
        `Media: Blitz evaluates stylesheets as \`${model.mediaType}\` (DocumentConfig::media_type default; build_document never sets it). Chromium emulates \`print\` (matchMedia('print') = ${probes.printMedia}). Fixture contains @media rules: ${/@media/i.test(prepared.nativeHtml) ? "YES — media-dependent rules differ" : "no (media type is inert here)"}.`,
        `Fonts: Chromium loaded ${probes.fonts.join("; ") || "(none)"} from the bundled files (sha256 in env.fonts_sha256). vellora runs by face: ${Object.entries(
          model.faces,
        )
          .map(([k, v]) => `${k} ${v}`)
          .join(", ")}. DejaVu fallback runs (no Chromium counterpart): ${dejavu}.`,
        `Baselines: Chromium ascent measured for ${baselines.size}/${specs.length} face/size specs.`,
        `html_normalize: ${model.domAlteredByHtmlNormalize ? "ALTERED the DOM" : "changed nothing"} (wrappers recorded ${model.normalize.wrappers_recorded}, located in the Blitz DOM ${model.normalize.wrappers_located}${model.normalize.wrappers_recorded === model.normalize.wrappers_located ? "" : " — MISMATCH: a wrapper is not where it was recorded, later keys shift"}). ${model.source ? "N0 (Blitz on the source HTML) present: the N0 → B0 step is html_normalize's." : `N0 NOT RUN${sourceNote ? ` (${sourceNote})` : ""}: B0 is Blitz on html_normalize's output, so html_normalize and raw Blitz are NOT separated.`}`,
        `Blitz anonymous blocks (B0 only): ${model.anonymous.length}; anonymous inline roots holding text (text Blitz shaped that vellora's DOM-children walk never reads): ${model.anonymousTextBlocks.length}${model.anonymousTextBlocks.length ? ` — ${model.anonymousTextBlocks.map((a) => `"${a.text.trim().slice(0, 40)}"`).join("; ")}` : ""}.`,
        `Dump self-checks: run-metadata misalignments ${model.runMetaMismatches.length}, layer order violations ${model.layerOrderViolations.length} (both expected 0).`,
        `Input sha256: native ${createHash("sha256").update(prepared.nativeHtml).digest("hex").slice(0, 16)}…, browser ${createHash("sha256").update(prepared.browserHtml).digest("hex").slice(0, 16)}…`,
      ];
      result.checks = runChecks({
        dump,
        model,
        probes,
        browserHtml: prepared.browserHtml,
        result,
        chromeRecords: records,
        sourceNote,
      });
      result.checks_summary = summarizeChecks(result.checks);
      const report = { fixture, label, env, parity, result };
      json(join(dir, "diff.json"), { fixture, label, env, parity, ...result });
      const md = renderMarkdown(report);
      writeFileSync(join(dir, "report.md"), md);
      writeFileSync(
        join(dir, "report.html"),
        markdownToHtml(md, `layout diff ${fixture} ${label}`),
      );
      rows.push({ fixture, result });
      const b = result.headline.box;
      const t = result.headline.text;
      const pr = result.headline.first_pass_regression;
      process.stdout.write(
        `${fixture} [${label}]${result.checks_summary.attribution_valid ? "" : " ATTRIBUTION INVALID (input parity failed)"} first box: ${b ? `${b.type} ${b.path} (first over tol. ${b.first_over_tolerance}, dominant ${b.dominant_layer})` : "none"}; first text: ${t ? `"${t.text}" (first over tol. ${t.first_over_tolerance}, dominant ${t.dominant_layer})` : "none"}; first pass regression: box ${pr.box ? `${pr.box.type} ${pr.box.path} by ${regressedText(pr.box, "pass")}` : "none"}, text ${pr.text ? `"${pr.text.text}" by ${regressedText(pr.text, "pass")}` : "none"}\n`,
      );
      for (const c of result.checks.filter((x) => x.status === "fail")) {
        process.stderr.write(
          `${fixture} [${label}] CHECK FAILED ${c.id} (${c.class}): ${c.detail}\n`,
        );
      }
    }
  } finally {
    await browser.close();
  }
  const summary = renderSummaryMarkdown({ label, env, rows });
  writeFileSync(join(out, `summary-${label}.md`), summary);
  json(join(out, `summary-${label}.json`), {
    schema: "vellora-layout-diff/summary/2",
    label,
    env,
    fixtures: rows.map((r) => ({
      fixture: r.fixture,
      first_box: r.result.headline.box,
      first_text: r.result.headline.text,
      first_pass_regression: r.result.headline.first_pass_regression,
      first_walk_regression: r.result.headline.first_walk_regression,
      first_html_normalize_regression: r.result.headline.first_html_normalize_regression,
      first_missing: r.result.headline.first_missing,
      html_normalize: r.result.html_normalize,
      attribution_valid: r.result.checks_summary.attribution_valid,
      checks: r.result.checks,
      checks_summary: r.result.checks_summary,
      first_divergence_by_layer: r.result.first_divergence_by_layer,
      layer_stats: r.result.layer_stats,
      counts: r.result.counts,
    })),
  });
  process.stdout.write(`summary: ${join(out, `summary-${label}.md`)}\n`);
  const failing = rows.filter((r) => r.result.checks_summary.failed.length);
  if (failing.length) {
    process.stderr.write(
      `CHECKS FAILED in ${failing.map((r) => `${r.fixture} (${r.result.checks_summary.failed.join(", ")})`).join("; ")}${flag("--allow-check-failures") ? " — exit 0 (--allow-check-failures)" : " — exit 2"}\n`,
    );
    if (!flag("--allow-check-failures")) process.exitCode = 2;
  }
}

main().catch((err) => {
  process.stderr.write(`layout-diff failed: ${err?.stack ?? err}\n`);
  process.exitCode = 1;
});
