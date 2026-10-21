#!/usr/bin/env node
// Per-layer layout-tree diff: Chromium continuous-flow DOMSnapshot vs vellora's layout layers
// (B0 raw Blitz tree, L0 box walk, one layer per layout_normalize pass).
//
//   node fidelity/layout-diff/run.mjs [--fixtures invoice,receipt,boleto,notification]
//     [--dump-repo <checkout>] [--label <name>] [--chrome <path>] [--out <dir>]
//     [--tolerance 0.5] [--text-tolerance 0.5] [--top 20] [--include-inline] [--no-build]
//
// --dump-repo: checkout whose crates/vellora-core provides the layout_dump example (default: this
// one). Templating ALWAYS uses this checkout's built `vellora` package, so two dump repos (e.g. the
// Blitz pin and a Blitz bump) are compared on byte-identical HTML.
// Output: <out>/<fixture>/<label>/{native.html,browser.html,vellora-dump.json,chrome-snapshot.json,
//         diff.json,report.md,report.html} and <out>/summary-<label>.{json,md}.
import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
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
      const model = velloraModel(dump);

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
        `@page content box ${model.page.content_width} × ${model.page.content_height} CSS px → Blitz viewport ${dump.viewport.width_px} × ${dump.viewport.height_px} (\`as u32\` truncation in resolve_and_walk drops ${Math.round(lost * 1e4) / 1e4} px of inline size; a KNOWN INPUT divergence vs Chromium print, not an engine difference). Chromium viewport set to the same ${dump.viewport.width_px} × ${dump.viewport.height_px}; documentElement.clientWidth = ${probes.clientWidth} (scrollbars hidden).`,
        `Media: Blitz evaluates stylesheets as \`${model.mediaType}\` (DocumentConfig::media_type default; build_document never sets it). Chromium emulates \`print\` (matchMedia('print') = ${probes.printMedia}). Fixture contains @media rules: ${/@media/i.test(prepared.nativeHtml) ? "YES — media-dependent rules differ" : "no (media type is inert here)"}.`,
        `Fonts: Chromium loaded ${probes.fonts.join("; ") || "(none)"} from the bundled files (sha256 in env.fonts_sha256). vellora runs by face: ${Object.entries(
          model.faces,
        )
          .map(([k, v]) => `${k} ${v}`)
          .join(", ")}. DejaVu fallback runs (no Chromium counterpart): ${dejavu}.`,
        `Baselines: Chromium ascent measured for ${baselines.size}/${specs.length} face/size specs.`,
        `html_normalize wrappers: recorded ${model.normalize.wrappers_recorded}, located in the Blitz DOM ${model.normalize.wrappers_located}${model.normalize.wrappers_recorded === model.normalize.wrappers_located ? "" : " — MISMATCH: keys under wrappers may be wrong"}.`,
        `Blitz anonymous blocks (B0 only): ${model.anonymous.length}; anonymous inline roots holding text (text Blitz shaped that vellora's DOM-children walk never reads): ${model.anonymousTextBlocks.length}${model.anonymousTextBlocks.length ? ` — ${model.anonymousTextBlocks.map((a) => `"${a.text.trim().slice(0, 40)}"`).join("; ")}` : ""}.`,
        `Dump self-checks: run-metadata misalignments ${model.runMetaMismatches.length}, layer order violations ${model.layerOrderViolations.length} (both expected 0).`,
        `Input sha256: native ${createHash("sha256").update(prepared.nativeHtml).digest("hex").slice(0, 16)}…, browser ${createHash("sha256").update(prepared.browserHtml).digest("hex").slice(0, 16)}…`,
      ];
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
      process.stdout.write(
        `${fixture} [${label}] first box: ${b ? `${b.type} ${b.path} (${b.introduced_by})` : "none"}; first text: ${t ? `"${t.text}" (${t.introduced_by})` : "none"}\n`,
      );
    }
  } finally {
    await browser.close();
  }
  const summary = renderSummaryMarkdown({ label, env, rows });
  writeFileSync(join(out, `summary-${label}.md`), summary);
  json(join(out, `summary-${label}.json`), {
    schema: "vellora-layout-diff/summary/1",
    label,
    env,
    fixtures: rows.map((r) => ({
      fixture: r.fixture,
      first_box: r.result.headline.box,
      first_text: r.result.headline.text,
      first_divergence_by_layer: r.result.first_divergence_by_layer,
      layer_stats: r.result.layer_stats,
      counts: r.result.counts,
    })),
  });
  process.stdout.write(`summary: ${join(out, `summary-${label}.md`)}\n`);
}

main().catch((err) => {
  process.stderr.write(`layout-diff failed: ${err?.stack ?? err}\n`);
  process.exitCode = 1;
});
