#!/usr/bin/env node
// Text-correctness probe: what text, with which spaces, at which x, does CHROME render for a small
// probe page, and what does vellora read and emit for the same bytes? Chrome decides.
//
//   node fidelity/layout-diff/text-probe.mjs [--probes crates/vellora-core/tests/fixtures/text-probes]
//     [--out fidelity/results/text-probe/text-probe.json] [--chrome <path>] [--pdftotext <bin>]
//     [--no-build]
//
// Per probe (*.html, the exact bytes the Rust regression tests render):
//   Chrome  print media, viewport = vellora's Blitz viewport, bundled Liberation faces injected as
//           @font-face (same files vellora embeds). INPUT DIFFERENCE (recorded): the CSS generic
//           `sans-serif` is rewritten to "Liberation Sans" on the Chrome side only, because vellora
//           maps the generic to its bundled Liberation Sans while Chrome would use a system face.
//           Records every rendered character of every text node (Range rects; collapsed whitespace
//           has none) with x/width/top, the measured baseline (ascent probe), the visual LINES
//           (rendered chars grouped by line, sorted by x) and `pdftotext -raw` of page.pdf().
//   vellora layout_dump example of this checkout: L0 and final-layer text runs (text, origin x,
//           baseline, advance, owner), raw Blitz runs, the visual lines built from the final runs,
//           and `pdftotext -raw` of the production render (`--pdf`).
// `agreement` compares the visual lines (trailing whitespace trimmed) and the pdftotext output
// (whitespace runs collapsed) per probe. CSS px, top-left origin of the document (both engines lay
// out from the viewport origin; vellora's @page margin is not part of these coordinates).
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import {
  baselineKey,
  launchChrome,
  measureBaselines,
  resolveChrome,
} from "./lib/chrome-snapshot.mjs";
import { captureEnv } from "./lib/env.mjs";
import { repoRoot } from "./lib/fixture-html.mjs";
import { bundledFontFaceCss, bundledFontHashes } from "./lib/fonts.mjs";
import { buildDumpTool } from "./lib/vellora-model.mjs";

function arg(name, fallback) {
  const i = process.argv.indexOf(name);
  return i >= 0 && process.argv[i + 1] !== undefined ? process.argv[i + 1] : fallback;
}

const r3 = (v) => (Number.isFinite(v) ? Math.round(v * 1000) / 1000 : null);

/** Chrome-side HTML: bundled @font-face block + `sans-serif` -> "Liberation Sans" (see header). */
export function chromeHtmlFor(html, fontCss) {
  const swapped = html.replace(/font-family:\s*sans-serif/g, 'font-family: "Liberation Sans"');
  return swapped.replace(/<head(\s[^>]*)?>/i, (tag) => `${tag}<style>${fontCss}</style>`);
}

/** Group positioned glyph items {text, x, w, line} into visual lines (sorted by x). */
export function visualLines(items, sameLine = (a, b) => Math.abs(a - b) < 2) {
  const lines = [];
  for (const it of items) {
    let line = lines.find((l) => sameLine(l.key, it.line));
    if (!line) {
      line = { key: it.line, items: [] };
      lines.push(line);
    }
    line.items.push(it);
  }
  lines.sort((a, b) => a.key - b.key);
  return lines.map((l) => ({
    line: r3(l.key),
    text: [...l.items]
      .sort((a, b) => a.x - b.x)
      .map((i) => i.text)
      .join(""),
  }));
}

/** A rendered whitespace character is a (collapsed) space; a no-break space stays one. */
export function renderedChar(ch) {
  return ch !== " " && /\s/.test(ch) ? " " : ch;
}

function groupLines(items, keyOf) {
  const lines = [];
  for (const it of items) {
    let line = lines.find((l) => Math.abs(l.key - keyOf(it)) < 2);
    if (!line) {
      line = { key: keyOf(it), items: [] };
      lines.push(line);
    }
    line.items.push(it);
  }
  lines.sort((a, b) => a.key - b.key);
  for (const l of lines) l.items.sort((a, b) => a.x - b.x);
  return lines;
}

/**
 * Per vellora run: where Chrome put the SAME characters. Visual lines are paired by order; each
 * run's text (trailing whitespace dropped, which Chrome hangs at a line end) is located in the
 * Chrome line's rendered string after the previous run's match. `dx` = vellora − Chrome for the
 * run's first glyph, `dright` for its last glyph's right edge (CSS px).
 */
export function runXDeltas(chromeChars, velloraRuns) {
  const cl = groupLines(chromeChars, (c) => c.line);
  const vl = groupLines(velloraRuns, (r) => r.baseline);
  const out = [];
  vl.forEach((line, i) => {
    const chars = cl[i]?.items ?? [];
    const str = chars.map((c) => c.ch).join("");
    let from = 0;
    for (const run of line.items) {
      const text = run.text.replace(/\s+$/, "");
      if (!text) continue;
      const k = str.indexOf(text, from);
      if (k < 0) {
        out.push({ line: i, text: run.text, vellora_x: run.x, chrome_x: null, dx: null });
        continue;
      }
      const first = chars[k];
      const last = chars[k + text.length - 1];
      // The right edge is comparable only when the run has no trailing whitespace glyph (the dump
      // records the run's total advance, not per-glyph advances).
      const comparableRight = text.length === run.text.length;
      out.push({
        line: i,
        text: run.text,
        vellora_x: run.x,
        chrome_x: r3(first.x),
        dx: r3(run.x - first.x),
        vellora_right: comparableRight ? r3(run.x + run.advance) : null,
        chrome_right: r3(last.x + last.w),
        dright: comparableRight ? r3(run.x + run.advance - (last.x + last.w)) : null,
      });
      from = k + text.length;
    }
  });
  return out;
}

export function collapse(text) {
  return String(text ?? "")
    .replace(/[\s ]+/g, " ")
    .trim();
}

async function chromeProbe(browser, html, viewport) {
  const page = await browser.newPage();
  try {
    await page.setViewport({
      width: viewport.width,
      height: viewport.height,
      deviceScaleFactor: 1,
    });
    await page.emulateMediaType("print");
    await page.setContent(html, { waitUntil: "load" });
    await page.evaluate(() => document.fonts.ready.then(() => true));
    const dom = await page.evaluate(() => {
      const pathOf = (el) => {
        const parts = [];
        for (let e = el; e && e.nodeType === 1; e = e.parentElement) {
          const k = e.parentElement ? [...e.parentElement.children].indexOf(e) + 1 : 0;
          parts.unshift(k ? `${e.localName}:nth-child(${k})` : e.localName);
        }
        return parts.join(">");
      };
      const out = { body_inner_text: document.body.innerText, text_nodes: [] };
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      for (let n = walker.nextNode(); n; n = walker.nextNode()) {
        const style = getComputedStyle(n.parentElement);
        const chars = [];
        const range = document.createRange();
        for (let i = 0; i < n.data.length; i += 1) {
          range.setStart(n, i);
          range.setEnd(n, i + 1);
          // A collapsed whitespace character keeps a zero-WIDTH caret rect; only characters
          // that advance the pen were rendered.
          const rect = [...range.getClientRects()].find((r) => r.width > 0);
          if (rect) chars.push({ i, ch: n.data[i], x: rect.x, w: rect.width, top: rect.y });
        }
        if (!chars.length) continue;
        out.text_nodes.push({
          parent: pathOf(n.parentElement),
          id: n.parentElement.closest("[id]")?.id ?? null,
          data: n.data,
          font: {
            family: style.fontFamily.split(",")[0].replaceAll('"', "").trim(),
            weight: Number(style.fontWeight),
            size: Number.parseFloat(style.fontSize),
          },
          chars,
        });
      }
      return out;
    });
    const pdf = await page.pdf({ format: "A4", preferCSSPageSize: true, printBackground: true });
    return { dom, pdf, userAgent: await browser.userAgent() };
  } finally {
    await page.close();
  }
}

async function main() {
  const probesDir = resolve(
    arg("--probes", join(repoRoot, "crates/vellora-core/tests/fixtures/text-probes")),
  );
  const out = resolve(arg("--out", join(repoRoot, "fidelity/results/text-probe/text-probe.json")));
  const pdftotext = arg("--pdftotext", "/opt/homebrew/bin/pdftotext");
  const chromePath = resolveChrome(arg("--chrome", undefined));
  const env = await captureEnv({
    repo: repoRoot,
    command: `node ${process.argv.slice(1).join(" ")}`,
    chromePath,
  });
  env.fonts_sha256 = bundledFontHashes(repoRoot);
  env.pdftotext = execFileSync(pdftotext, ["-v"], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  })
    .split("\n")[0]
    .trim();
  const bin = process.argv.includes("--no-build")
    ? join(repoRoot, "target", "release", "examples", "layout_dump")
    : buildDumpTool(repoRoot);
  const fontCss = bundledFontFaceCss(repoRoot);
  const work = join(dirname(out), "work");
  mkdirSync(work, { recursive: true });
  const browser = await launchChrome(chromePath);
  const probes = [];
  try {
    for (const file of readdirSync(probesDir)
      .filter((f) => f.endsWith(".html"))
      .sort()) {
      const id = basename(file, ".html");
      const htmlPath = join(probesDir, file);
      const html = readFileSync(htmlPath, "utf8");
      // vellora: dump (layers + raw Blitz text) and the production render of the same bytes.
      const dumpPath = join(work, `${id}.dump.json`);
      const vPdf = join(work, `${id}.vellora.pdf`);
      execFileSync(bin, ["--html", htmlPath, "--out", dumpPath, "--pdf", vPdf]);
      const dump = JSON.parse(readFileSync(dumpPath, "utf8"));
      const path = new Map(dump.nodes.map((n) => [n.id, n.path]));
      const meta = new Map(dump.runs.map((r) => [`${r.box}:${r.run}`, r]));
      const runsOf = (layer) =>
        layer.runs.map(([box, run, x, y, advance]) => {
          const m = meta.get(`${box}:${run}`);
          return {
            owner: path.get(layer.boxes[box][0]),
            text: m?.text ?? "",
            x: r3(x),
            baseline: r3(y),
            advance: r3(advance),
            right: r3(x + advance),
            face: m?.face,
          };
        });
      const finalRuns = runsOf(dump.layers.at(-1));
      const vellora = {
        viewport: dump.viewport,
        l0_runs: runsOf(dump.layers[0]),
        final_layer: dump.layers.at(-1).name,
        final_runs: finalRuns,
        blitz_runs: dump.blitz_runs.map((r) => ({
          owner: path.get(r.owner),
          text: r.text,
          x: r3(r.x),
          baseline: r3(r.y),
          advance: r3(r.advance),
        })),
        lines: visualLines(finalRuns.map((r) => ({ text: r.text, x: r.x, line: r.baseline }))),
        pdftotext_raw: execFileSync(pdftotext, ["-raw", vPdf, "-"], { encoding: "utf8" }),
      };
      // Chrome: same bytes (+ fonts, generic rewritten), same viewport.
      const { dom, pdf, userAgent } = await chromeProbe(browser, chromeHtmlFor(html, fontCss), {
        width: dump.viewport.width_px,
        height: dump.viewport.height_px,
      });
      const cPdf = join(work, `${id}.chrome.pdf`);
      writeFileSync(cPdf, pdf);
      const specs = [...new Map(dom.text_nodes.map((t) => [baselineKey(t.font), t.font])).values()];
      const baselines = await measureBaselines(browser, fontCss, specs);
      const chars = dom.text_nodes.flatMap((t) => {
        const asc = baselines.get(baselineKey(t.font))?.ascent;
        return t.chars.map((c) => ({
          ...c,
          ch: renderedChar(c.ch),
          baseline: asc === undefined ? null : c.top + asc,
        }));
      });
      const chrome = {
        user_agent: userAgent,
        body_inner_text: dom.body_inner_text,
        text_nodes: dom.text_nodes.map((t) => {
          const asc = baselines.get(baselineKey(t.font))?.ascent;
          const first = t.chars[0];
          const last = t.chars.at(-1);
          return {
            parent: t.parent,
            id: t.id,
            data: t.data,
            font: t.font,
            rendered: t.chars.map((c) => renderedChar(c.ch)).join(""),
            x: r3(first.x),
            right: r3(last.x + last.w),
            baseline: asc === undefined ? null : r3(first.top + asc),
            chars: t.chars.map((c) => ({ i: c.i, ch: c.ch, x: r3(c.x), w: r3(c.w) })),
          };
        }),
        lines: visualLines(chars.map((c) => ({ text: c.ch, x: c.x, line: c.baseline ?? c.top }))),
        pdftotext_raw: execFileSync(pdftotext, ["-raw", cPdf, "-"], { encoding: "utf8" }),
      };
      const trim = (lines) => lines.map((l) => l.text.replace(/\s+$/, ""));
      const runX = runXDeltas(
        chars.map((c) => ({ ch: c.ch, x: c.x, w: c.w, line: c.baseline ?? c.top })),
        finalRuns,
      );
      const maxAbs = (key) =>
        r3(
          Math.max(0, ...runX.filter((r) => Number.isFinite(r[key])).map((r) => Math.abs(r[key]))),
        );
      const cl = trim(chrome.lines);
      const vl = trim(vellora.lines);
      probes.push({
        id,
        file: htmlPath.slice(repoRoot.length + 1),
        agreement: {
          lines_equal: JSON.stringify(cl) === JSON.stringify(vl),
          line_diffs: cl
            .map((c, i) => ({ i, chrome: c, vellora: vl[i] ?? null }))
            .filter((d) => d.chrome !== d.vellora),
          pdftotext_equal: collapse(chrome.pdftotext_raw) === collapse(vellora.pdftotext_raw),
          runs_located_in_chrome: runX.filter((r) => r.chrome_x !== null).length,
          runs: runX.length,
          max_abs_dx: maxAbs("dx"),
          max_abs_dright: maxAbs("dright"),
          run_x: runX,
        },
        chrome,
        vellora,
      });
      process.stdout.write(
        `${id}: lines ${probes.at(-1).agreement.lines_equal ? "EQUAL" : "DIFFER"}, pdftotext ${probes.at(-1).agreement.pdftotext_equal ? "EQUAL" : "DIFFER"}, runs located ${probes.at(-1).agreement.runs_located_in_chrome}/${runX.length}, max |dx| ${probes.at(-1).agreement.max_abs_dx} px, max |dright| ${probes.at(-1).agreement.max_abs_dright} px\n`,
      );
    }
  } finally {
    await browser.close();
  }
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(
    out,
    `${JSON.stringify({ schema: "vellora-text-probe/1", env, input_difference: 'Chrome side only: CSS `font-family: sans-serif` rewritten to "Liberation Sans" (vellora maps the generic to its bundled Liberation Sans; Chrome would pick a system face). Bundled Liberation faces injected as @font-face in both directions of comparison.', probes }, null, 2)}\n`,
  );
  process.stdout.write(`${out}\n`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    process.stderr.write(`text-probe failed: ${err?.stack ?? err}\n`);
    process.exitCode = 1;
  });
}
