#!/usr/bin/env node
// Render every corpus fixture through vellora (strict: true) and a Chromium reference, then evaluate
// the fidelity/ACCEPTANCE.md criteria listed per fixture in fidelity/corpus/corpus.json with
// independent oracles: zxing-cpp (barcode decode) + the corpus check-digit validators, a
// renderer-independent ideal raster (ground truth + negative control), bar geometry from a 600 dpi
// poppler raster, three text extractors (pdftotext, pypdf, pdfminer.six), pdfminer font sizes and
// positions, page ink box (margins), money-column alignment, page count, pypdf strict parse, and
// determinism (in-process repeat + a child process under another TZ/LANG).
//
//   node fidelity/corpus/render-corpus.mjs [--fixture ID] [--no-chrome] [--out DIR] [--snapshot FILE]
//
// Prerequisites: `npm run build` (real addon), poppler (pdftoppm/pdftotext/pdfinfo/pdffonts/
// pdfimages on PATH or /opt/homebrew/bin), fidelity/.venv with fidelity/corpus/requirements.txt,
// a Chrome binary (VELLORA_CHROME or the macOS default path). Output: <out>/report.json + report.md
// (default fidelity/results/corpus/<UTC timestamp>/, gitignored). --snapshot also writes the
// markdown report to FILE (used for the committed, labelled snapshot fidelity/corpus/RESULTS.md).
import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { arch, cpus, platform, release } from "node:os";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { validateBarcode, validateLinha } from "./lib/boleto.mjs";
import { widthToMm } from "./lib/build.mjs";
import { chromePrintToPdf, chromeVersion, prepareReferenceHtml } from "./lib/chrome-ref.mjs";
import { fixtureImages, renderOptions } from "./lib/fixture-io.mjs";
import { validateChave } from "./lib/nfe.mjs";
import { resolvePath, textMatches } from "./lib/required-text.mjs";

const execFileAsync = promisify(execFile);
const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "..", "..");
const fontDir = join(repoRoot, "crates", "vellora-core", "src", "fonts");
const PY = join(repoRoot, "fidelity", ".venv", "bin", "python");
const DPI = 600;
/** Environment of the cross-process determinism render (DET-2). */
const ALT_ENV = { TZ: "America/Sao_Paulo", LANG: "pt_BR.UTF-8", LC_ALL: "pt_BR.UTF-8" };

function argValue(name, fallback) {
  const i = process.argv.indexOf(name);
  return i === -1 ? fallback : process.argv[i + 1];
}

function tool(name) {
  const brew = `/opt/homebrew/bin/${name}`;
  return existsSync(brew) ? brew : name;
}

async function run(cmd, args, opts = {}) {
  const { stdout } = await execFileAsync(cmd, args, { maxBuffer: 256 * 1024 * 1024, ...opts });
  return stdout;
}

async function runSafe(cmd, args) {
  try {
    return (await execFileAsync(cmd, args)).stdout.trim();
  } catch (e) {
    return `unavailable (${e.code ?? e.message})`;
  }
}

const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

const get = (obj, path) => path.split(".").reduce((v, k) => (v == null ? undefined : v[k]), obj);

async function environment(withChrome) {
  const [date, rustc, pdftoppm, py, gitSha, cpuBrand, osName] = await Promise.all([
    runSafe("date", ["-u", "+%Y-%m-%dT%H:%M:%SZ"]),
    runSafe("rustc", ["--version"]),
    execFileAsync(tool("pdftoppm"), ["-v"]).then(
      (r) => (r.stderr || r.stdout).split("\n")[0].trim(),
      (e) => `unavailable (${e.code})`,
    ),
    runSafe(PY, ["-I", "-c", "import platform; print(platform.python_version())"]),
    runSafe("git", ["-C", repoRoot, "rev-parse", "HEAD"]),
    runSafe("sysctl", ["-n", "machdep.cpu.brand_string"]),
    runSafe("sw_vers", ["-productVersion"]),
  ]);
  const pyVersions = await runSafe(PY, [
    "-I",
    "-c",
    "import importlib.metadata as m; print(', '.join(f'{p} {m.version(p)}' for p in ['zxing-cpp','pillow','pypdf','pdfminer.six']))",
  ]);
  return {
    date,
    os: `${platform()} ${release()} ${arch()} (macOS ${osName})`,
    cpu: cpuBrand.startsWith("unavailable") ? (cpus()[0]?.model ?? "unknown") : cpuBrand,
    node: process.version,
    rustc,
    chrome: withChrome ? await chromeVersion() : "not-run (--no-chrome)",
    poppler: pdftoppm,
    python: py,
    pythonPackages: pyVersions,
    gitHead: gitSha,
    command:
      `node ${relative(repoRoot, fileURLToPath(import.meta.url))} ${process.argv.slice(2).join(" ")}`.trim(),
    authority: "INDICATIVE (local macOS run; the pinned Linux CI run is authoritative)",
  };
}

async function pdfFacts(pdfPath) {
  const info = await run(tool("pdfinfo"), [pdfPath]);
  const pages = Number(/Pages:\s+(\d+)/.exec(info)?.[1] ?? 0);
  const text = await run(tool("pdftotext"), ["-enc", "UTF-8", pdfPath, "-"]);
  const fonts = await run(tool("pdffonts"), [pdfPath]);
  const fontNames = fonts
    .split("\n")
    .slice(2)
    .map((l) => l.trim().split(/\s+/)[0])
    .filter(Boolean)
    .map((n) => n.replace(/^[A-Z]{6}\+/, ""));
  // pdfimages -list: two header lines, then one line per image; column 3 is the type
  // (image / smask / mask) — soft masks are not separate images.
  const imageList = await run(tool("pdfimages"), ["-list", pdfPath]);
  const images = imageList
    .split("\n")
    .slice(2)
    .filter((l) => l.trim().split(/\s+/)[2] === "image").length;
  return { pages, text, fonts: [...new Set(fontNames)].sort(), images };
}

async function rasterPage1(pdfPath, outPrefix) {
  const args = ["-r", String(DPI), "-gray", "-png", "-f", "1", "-l", "1", pdfPath, outPrefix];
  await run(tool("pdftoppm"), args);
  const dir = dirname(outPrefix);
  const base = outPrefix.slice(dir.length + 1);
  const file = readdirSync(dir).find((f) => f.startsWith(`${base}-`) && f.endsWith(".png"));
  return join(dir, file);
}

async function py(script, args) {
  return JSON.parse(await run(PY, ["-I", join(here, script), ...args]));
}

function validateDigits(validator, text) {
  if (validator === "boleto") {
    return validateBarcode(text).ok;
  }
  if (validator === "nfe") {
    return validateChave(text).ok;
  }
  return false;
}

function idealSpec(data) {
  const elements = data.codigoBarras.elementos.map((e) => ({
    w_mm: widthToMm(e.w),
    dark: e.k === "b",
  }));
  const widths = [...new Set(elements.map((e) => e.w_mm))].sort((a, b) => a - b);
  return {
    elements,
    narrow_mm: widths[0],
    wide_mm: widths.at(-1),
    height_mm: data.codigoBarras.heightMm,
  };
}

/**
 * Region (mm, page coords) of a font rule, measured from the barcode geometry of the same PDF:
 * "belowBarcode" = the band directly under the measured symbol (BCB-2926 V "abaixo do código de
 * barras"). null if the symbol was not found.
 */
function resolveRegion(name, geo) {
  if (name !== "belowBarcode") {
    throw new Error(`unknown region ${name}`);
  }
  const m = geo?.found ? geo.measured : null;
  return m
    ? {
        x_min_mm: m.x0_mm - 3,
        x_max_mm: m.x1_mm,
        top_min_mm: m.bottom_mm - 0.5,
        top_max_mm: m.bottom_mm + 8,
      }
    : null;
}

async function checkPdf({ fx, data, pdfPath, work, label }) {
  const facts = await pdfFacts(pdfPath);
  const others = await py("pdf_probe.py", ["text", "--pdf", pdfPath]);
  const extractors = {
    pdftotext: textMatches(fx, data, facts.text),
    pypdf: textMatches(fx, data, others.pypdf),
    pdfminer: textMatches(fx, data, others.pdfminer),
  };
  const result = {
    pages: facts.pages,
    fonts: facts.fonts,
    images: facts.images,
    text: Object.fromEntries(
      Object.entries(extractors).map(([k, v]) => [
        k,
        {
          found: v.filter((r) => r.ok).length,
          total: v.length,
          missing: v.filter((r) => !r.ok).map((r) => r.ref),
          // Shown in reports: a string present fewer times than pinned is listed with its count.
          missingDetail: v
            .filter((r) => !r.ok)
            .map((r) => (r.occurrences > 0 ? `${r.ref} (${r.occurrences}/${r.count}×)` : r.ref)),
          occurrences: Object.fromEntries(v.map((r) => [r.ref, r.occurrences])),
        },
      ]),
    ),
    pdfStrict: await py("pdf_probe.py", ["strict", "--pdf", pdfPath]),
  };
  const needsRaster = fx.barcode || fx.criteria.some((c) => c.check === "margins");
  const png = needsRaster ? await rasterPage1(pdfPath, join(work, `${label}-p1`)) : null;
  if (fx.barcode) {
    const decoded = await py("decode_barcodes.py", ["--dpi", String(DPI), png]);
    const expected = resolvePath(data, fx.barcode.expected);
    const symbols = decoded.pages[0].symbols.filter(
      (s) => s.format.replace(/\s/g, "") === fx.barcode.format,
    );
    const hit = symbols.find((s) => s.text === expected);
    result.barcode = {
      decoder: `${decoded.decoder} ${decoded.decoder_version}`,
      symbolsFound: symbols.map((s) => s.text),
      decodesToExpected: Boolean(hit),
      validates: hit ? validateDigits(fx.barcode.validator, hit.text) : false,
    };
    const expectPath = join(work, `${label}-expect.json`);
    const expectSpec = { ...fx.barcode.geometry, elements: idealSpec(data).elements };
    writeFileSync(expectPath, JSON.stringify(expectSpec));
    const measureArgs = ["--png", png, "--dpi", String(DPI), "--expect", expectPath];
    result.barcode.geometry = await py("measure_bars.py", measureArgs);
  }
  if (png && fx.criteria.some((c) => c.check === "margins")) {
    result.inkbox = await py("pdf_probe.py", ["inkbox", "--png", png, "--dpi", String(DPI)]);
  }
  if (fx.moneyColumns) {
    const { page, headers } = fx.moneyColumns;
    const args = ["columns", "--pdf", pdfPath, "--page", String(page)];
    result.moneyColumns = await py("pdf_probe.py", [...args, "--headers", JSON.stringify(headers)]);
  }
  if (fx.fontRules) {
    const rules = {
      ...fx.fontRules,
      rules: fx.fontRules.rules.map((r0) => {
        const { regionFrom, ...r } = r0;
        const out = { ...r, text: String(resolvePath(data, r.text)) };
        if (regionFrom) {
          const region = resolveRegion(regionFrom, result.barcode?.geometry);
          // An unmeasurable region matches nothing, so the rule fails instead of falling back
          // to an unqualified (re-anchorable) search.
          out.region = region ?? { x_min_mm: Number.MAX_VALUE };
          out.regionFrom = region ? regionFrom : `${regionFrom} (not measurable)`;
        }
        return out;
      }),
    };
    const rulesPath = join(work, `${label}-fontrules.json`);
    writeFileSync(rulesPath, JSON.stringify(rules));
    const htmlArgs = fx.fontRules.categories ? ["--html", join(work, "templated.html")] : [];
    result.fontCheck = await py("font_sizes.py", [
      "--pdf",
      pdfPath,
      "--rules",
      rulesPath,
      ...htmlArgs,
    ]);
  }
  return result;
}

async function renderVellora(vellora, html, data, images, fxId, dataFile) {
  const opts = renderOptions(images);
  try {
    const a = await vellora.renderPdf(html, data, opts);
    const b = await vellora.renderPdf(html, data, opts);
    let child;
    try {
      const out = await run(process.execPath, [join(here, "render-one.mjs"), fxId, dataFile], {
        env: { ...process.env, ...ALT_ENV },
      });
      child = JSON.parse(out.trim().split("\n").at(-1));
    } catch (e) {
      child = { ok: false, error: e.message };
    }
    return {
      ok: true,
      pdf: a,
      deterministic: sha256(a) === sha256(b),
      determinismEnv: { env: ALT_ENV, ok: child.ok && child.sha256 === sha256(a), child },
    };
  } catch (e) {
    return {
      ok: false,
      error: { name: e.name, message: e.message, feature: e.feature, line: e.line, col: e.col },
    };
  }
}

/** Evaluate one criterion for one engine result -> { status: PASS|FAIL|NOT-RUN|N/A, value }. */
function evaluate(c, e, ctx) {
  if (!e || e.status) {
    return { status: "NOT-RUN", value: e?.status ?? "engine not run" };
  }
  if (e.strict === "rejected") {
    return { status: "FAIL", value: `strict gate rejected: ${e.error.feature ?? e.error.name}` };
  }
  const pass = (ok, value) => ({ status: ok ? "PASS" : "FAIL", value });
  switch (c.check) {
    case "pages":
      return pass(
        e.pages === ctx.fx.expectedPages,
        `${e.pages} (expected ${ctx.fx.expectedPages})`,
      );
    case "pagesVsReference": {
      if (ctx.engine === "chrome") {
        return { status: "N/A", value: `${e.pages} (is the reference)` };
      }
      const ref = ctx.entry.chrome;
      if (!ref || ref.status) {
        return { status: "NOT-RUN", value: "no Chrome reference" };
      }
      return pass(e.pages === ref.pages, `${e.pages} vs reference ${ref.pages}`);
    }
    case "text": {
      const t = e.text.pdftotext;
      return pass(
        t.found === t.total,
        `${t.found}/${t.total}${t.missing.length ? ` missing ${t.missingDetail.join(", ")}` : ""}`,
      );
    }
    case "textAgree": {
      const parts = Object.entries(e.text).map(([k, t]) => `${k} ${t.found}/${t.total}`);
      return pass(
        Object.values(e.text).every((t) => t.found === t.total),
        parts.join("; "),
      );
    }
    case "images":
      // ">=": Chromium also rasterizes effects such as a blurred box-shadow into image XObjects.
      return pass(
        e.images >= ctx.fx.expectedImages,
        `${e.images} (expected >= ${ctx.fx.expectedImages})`,
      );
    case "barcodeDecode": {
      const b = e.barcode;
      return pass(
        b.decodesToExpected && b.validates,
        `decodes ${b.decodesToExpected}, validates ${b.validates}`,
      );
    }
    case "linhaConsistent": {
      const linha = validateLinha(ctx.data.linhaDigitavel.formatada);
      const printed = e.text.pdftotext.occurrences["@linhaDigitavel.formatada"] > 0;
      const ok = linha.ok && linha.barcode === ctx.data.codigoBarras.digitos && printed;
      return pass(
        ok,
        `DVs ${linha.ok}, rebuilds barcode ${linha.barcode === ctx.data.codigoBarras.digitos}, printed text found ${printed}`,
      );
    }
    case "geometry": {
      const geo = e.barcode?.geometry;
      if (!geo?.found) {
        return { status: "FAIL", value: "barcode not found on page 1" };
      }
      const v = get(geo, c.path);
      if (v == null) {
        const ficha = c.path.startsWith("ficha_relative_mm.");
        const why = [
          ficha ? null : geo.structure,
          ficha && geo.cut_line_y_mm == null ? "no dashed cut line detected" : null,
        ].filter(Boolean);
        return {
          status: "FAIL",
          value: `${c.path} not measurable${why.length ? ` (${why.join("; ")})` : ""}`,
        };
      }
      if (c.target !== undefined) {
        return pass(Math.abs(v - c.target) <= c.tol, `${v} (target ${c.target} ± ${c.tol})`);
      }
      if (c.min !== undefined && c.max !== undefined) {
        return pass(v >= c.min && v <= c.max, `${v} (in [${c.min}, ${c.max}])`);
      }
      if (c.max !== undefined) {
        return pass(v <= c.max, `${v} (max ${c.max})`);
      }
      return pass(v >= c.min, `${v} (min ${c.min})`);
    }
    case "refPos": {
      // vellora vs the Chromium reference: same anchor texts, glyph-box position difference.
      if (ctx.engine === "chrome") {
        return { status: "N/A", value: "is the reference" };
      }
      const ref = ctx.entry.chrome;
      if (!ref || ref.status) {
        return { status: "NOT-RUN", value: "no Chrome reference" };
      }
      const deltas = [];
      for (const id of c.rules) {
        const a = e.fontCheck?.rules.find((x) => x.id === id);
        const b = ref.fontCheck?.rules.find((x) => x.id === id);
        if (!a?.found || !b?.found) {
          return {
            status: "FAIL",
            value: `${id}: anchor text not found in ${a?.found ? "reference" : "vellora"}`,
          };
        }
        // Every qualifying occurrence is compared in reading order; a different count is itself
        // a failure (an anchor that exists twice in one engine and once in the other).
        if (a.boxes.length !== b.boxes.length) {
          return {
            status: "FAIL",
            value: `${id}: ${a.boxes.length} occurrences vs reference ${b.boxes.length}`,
          };
        }
        a.boxes.forEach((ba, k) => {
          const bb = b.boxes[k];
          deltas.push({
            id,
            d: Math.max(Math.abs(ba.x_mm - bb.x_mm), Math.abs(ba.top_mm - bb.top_mm)),
          });
        });
      }
      const worst = deltas.reduce((m, x) => (x.d > m.d ? x : m), deltas[0]);
      return pass(worst.d <= c.tol, `worst ${worst.id} ${worst.d.toFixed(2)} mm (tol ${c.tol})`);
    }
    case "fontRule": {
      const r = e.fontCheck?.rules.find((x) => x.id === c.id);
      if (!r) {
        return { status: "NOT-RUN", value: "rule not evaluated" };
      }
      if (!r.found) {
        const where = r.regionFrom ? ` in region ${r.regionFrom}` : " on the page";
        return { status: "FAIL", value: `text not found${where}` };
      }
      const pos = r.pos_error_mm ? `; pos Δ(${r.pos_error_mm.dx}, ${r.pos_error_mm.dy}) mm` : "";
      const n =
        r.expected > 1 || r.occurrences !== 1 ? `; ${r.occurrences}/${r.expected} occurrences` : "";
      const why = r.reason ? `; ${r.reason}` : "";
      return pass(r.ok, `${r.sizes_pt.join("/")}pt ${r.fonts.join(",")}${pos}${n}${why}`);
    }
    case "fontCategory": {
      const r = e.fontCheck?.categories?.find((x) => x.id === c.id);
      if (!r) {
        return { status: "NOT-RUN", value: "category not evaluated" };
      }
      const parts = [`${r.segments_located}/${r.segments_expected} segments`];
      if (r.smallest) {
        parts.push(`min ${r.smallest.pt}pt "${r.smallest.segment}"`);
      }
      if (r.segments_merged) {
        parts.push(`${r.segments_merged} merged with a neighbour`);
      }
      if (r.missing) {
        parts.push(`missing ${r.missing.map((t) => `"${t.slice(0, 40)}"`).join(", ")}`);
      }
      if (r.not_bold) {
        parts.push(`not bold "${r.not_bold}"`);
      }
      if (r.not_caps) {
        parts.push(`not caps "${r.not_caps}"`);
      }
      if (r.reason) {
        parts.push(r.reason);
      }
      return pass(r.ok, parts.join("; "));
    }
    case "fontFloor": {
      const f = e.fontCheck?.floor;
      if (!f) {
        return { status: "NOT-RUN", value: "floor not evaluated" };
      }
      const g = e.fontCheck.min_glyph;
      return pass(f.ok, `min ${f.min_pt}pt ("${g?.char}" p${g?.page}; floor ${f.floor_pt}pt)`);
    }
    case "fontCoverage": {
      const cov = e.fontCheck?.coverage;
      if (!cov) {
        return { status: "NOT-RUN", value: "coverage not evaluated" };
      }
      const extra = [];
      if (cov.unattributed) {
        extra.push(`sample "${cov.unattributed_sample}"`);
      }
      if (cov.untagged_html_text.length) {
        extra.push(`untagged HTML text "${cov.untagged_html_text[0]}"`);
      }
      if (cov.unknown_moc.length) {
        extra.push(`unknown data-moc ${cov.unknown_moc.join(", ")}`);
      }
      return pass(
        cov.ok,
        `${cov.glyphs - cov.unattributed}/${cov.glyphs} glyphs attributed${extra.length ? `; ${extra.join("; ")}` : ""}`,
      );
    }
    case "fontFamily": {
      const f = e.fontCheck?.families;
      return f
        ? pass(f.ok, f.ok ? f.seen.join(", ") : `disallowed: ${f.violations.join(", ")}`)
        : { status: "NOT-RUN", value: "" };
    }
    case "margins": {
      const m = e.inkbox?.ink_mm;
      if (!m) {
        return { status: "FAIL", value: "empty page" };
      }
      const vals = [m.left, m.top, m.right_margin, m.bottom_margin];
      const ok = vals.every((v) => v >= c.min && v <= c.max);
      return pass(
        ok,
        `L ${m.left} T ${m.top} R ${m.right_margin} B ${m.bottom_margin} (each in [${c.min}, ${c.max}])`,
      );
    }
    case "moneyAlign": {
      const mc = e.moneyColumns;
      if (!mc || mc.error) {
        return { status: "FAIL", value: mc?.error ?? "money columns not probed" };
      }
      const cols = mc.columns.filter((x) => x.count > 0);
      if (!cols.length) {
        return { status: "FAIL", value: `no money token on page ${mc.page}` };
      }
      const worst = cols.reduce((m, x) => (x.spread_mm > m.spread_mm ? x : m), cols[0]);
      const un = mc.unassigned.length
        ? `; ${mc.unassigned.length} token(s) in no column: ${mc.unassigned
            .slice(0, 3)
            .map((t) => `${t.text} @ ${t.x1_mm}`)
            .join(", ")}`
        : "";
      return pass(
        worst.spread_mm <= c.max && mc.unassigned.length === 0,
        `${mc.tokens} tokens in ${cols.length} columns, worst right-edge spread ${worst.spread_mm} mm (${worst.header}; max ${c.max})${un}`,
      );
    }
    case "deterministic":
      return ctx.engine === "chrome"
        ? { status: "N/A", value: "" }
        : pass(e.deterministic, String(e.deterministic));
    case "determinismEnv":
      return ctx.engine === "chrome"
        ? { status: "N/A", value: "" }
        : pass(
            e.determinismEnv.ok,
            `${Object.entries(e.determinismEnv.env)
              .map(([k, v]) => `${k}=${v}`)
              .join(
                " ",
              )}: ${e.determinismEnv.ok ? "same sha256" : JSON.stringify(e.determinismEnv.child)}`,
          );
    case "pdfStrict":
      return pass(
        e.pdfStrict.ok,
        e.pdfStrict.ok ? e.pdfStrict.tool : `${e.pdfStrict.tool}: ${e.pdfStrict.error}`,
      );
    default:
      return { status: "NOT-RUN", value: `unknown check ${c.check}` };
  }
}

async function main() {
  const only = argValue("--fixture", "");
  const withChrome = !process.argv.includes("--no-chrome");
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const outDir = resolve(argValue("--out", join(repoRoot, "fidelity", "results", "corpus", stamp)));
  mkdirSync(outDir, { recursive: true });
  let vellora;
  try {
    vellora = await import("vellora");
  } catch (cause) {
    throw new Error("Build the workspace first: npm run build", { cause });
  }
  const manifest = JSON.parse(readFileSync(join(here, "corpus.json"), "utf8"));
  const report = { environment: await environment(withChrome), fixtures: [] };

  for (const fx of manifest.fixtures) {
    if (only && fx.id !== only) {
      continue;
    }
    const dir = join(repoRoot, "fixtures", fx.id);
    const html = readFileSync(join(dir, "index.html"), "utf8");
    const images = fixtureImages(dir);
    for (const variant of fx.variants) {
      const data = JSON.parse(readFileSync(join(dir, variant.data), "utf8"));
      const suffix =
        variant.data === "data.json" ? "" : `.${variant.data.replace(/^data\.|\.json$/g, "")}`;
      const key = `${fx.id}${suffix}`;
      const work = join(outDir, key);
      mkdirSync(work, { recursive: true });
      const entry = {
        id: fx.id,
        class: fx.class,
        variant: variant.label,
        data: variant.data,
        diagnostic: Boolean(variant.diagnostic),
      };
      const templated = vellora.renderTemplate(html, data);
      writeFileSync(join(work, "templated.html"), templated);

      if (fx.barcode) {
        const idealPath = join(work, "ideal.json");
        writeFileSync(idealPath, JSON.stringify(idealSpec(data)));
        const base = ["--dpi", "1200", "--ideal", idealPath];
        const ideal = await py("decode_barcodes.py", base);
        const flipped = await py("decode_barcodes.py", [...base, "--flip", "7"]);
        const expected = resolvePath(data, fx.barcode.expected);
        entry.groundTruth = {
          method: "bars drawn from data.json at 1200 dpi (no renderer), decoded by zxing-cpp",
          decodesToExpected: ideal.symbols.some((s) => s.text === expected),
          validates: validateDigits(fx.barcode.validator, expected),
          negativeControlRejected: !flipped.symbols.some((s) => s.text === expected),
        };
      }

      const v = await renderVellora(vellora, html, data, images, fx.id, variant.data);
      if (v.ok) {
        const pdfPath = join(work, "vellora.pdf");
        writeFileSync(pdfPath, v.pdf);
        entry.vellora = {
          strict: "accepted",
          sha256: sha256(v.pdf),
          bytes: v.pdf.length,
          deterministic: v.deterministic,
          determinismEnv: v.determinismEnv,
          ...(await checkPdf({ fx, data, pdfPath, work, label: "vellora" })),
        };
      } else {
        entry.vellora = { strict: "rejected", error: v.error };
      }

      if (withChrome) {
        const pdfPath = join(work, "chrome.pdf");
        const prepared = prepareReferenceHtml(templated, { fontDir, baseDir: dir });
        const { command } = await chromePrintToPdf(prepared, pdfPath);
        entry.chrome = {
          command,
          sha256: sha256(readFileSync(pdfPath)),
          ...(await checkPdf({ fx, data, pdfPath, work, label: "chrome" })),
        };
      } else {
        entry.chrome = { status: "not-run (--no-chrome)" };
      }

      entry.criteria = fx.criteria.map((c0) => {
        const c = { ...c0, ...(variant.overrides?.[c0.id] ?? {}) };
        const ctx = { fx, data, entry };
        return {
          id: c.id,
          vellora: evaluate(c, entry.vellora, { ...ctx, engine: "vellora" }),
          chrome: evaluate(c, entry.chrome, { ...ctx, engine: "chrome" }),
        };
      });
      report.fixtures.push(entry);
      console.log(`done ${key}`);
    }
  }

  writeFileSync(join(outDir, "report.json"), `${JSON.stringify(report, null, 2)}\n`);
  const md = renderMarkdown(report);
  writeFileSync(join(outDir, "report.md"), md);
  const snapshot = argValue("--snapshot", "");
  if (snapshot) {
    writeFileSync(resolve(snapshot), md);
  }
  console.log(`report: ${join(outDir, "report.md")}`);
}

const cell = (r) => `${r.status}${r.value ? ` — ${String(r.value).replace(/\|/g, "\\|")}` : ""}`;

function renderMarkdown(report) {
  const env = report.environment;
  const lines = [
    "# Corpus run report",
    "",
    `Generated by \`fidelity/corpus/render-corpus.mjs\`. Status: ${env.authority}.`,
    "Criterion IDs, sources and tolerance labels: `fidelity/ACCEPTANCE.md`. Lengths in mm.",
    "",
    "| Field | Value |",
    "|---|---|",
    ...Object.entries(env).map(([k, v]) => `| ${k} | ${String(v).replace(/\|/g, "\\|")} |`),
    "",
  ];
  const totals = { vellora: {}, chrome: {} };
  for (const f of report.fixtures) {
    for (const c of f.criteria) {
      for (const eng of ["vellora", "chrome"]) {
        totals[eng][c[eng].status] = (totals[eng][c[eng].status] ?? 0) + 1;
      }
    }
  }
  lines.push(
    "## Summary (all fixtures and variants, including DIAGNOSTIC)",
    "",
    "| Engine | PASS | FAIL | N/A | NOT-RUN |",
    "|---|---|---|---|---|",
    ...["vellora", "chrome"].map(
      (eng) =>
        `| ${eng} | ${totals[eng].PASS ?? 0} | ${totals[eng].FAIL ?? 0} | ${totals[eng]["N/A"] ?? 0} | ${totals[eng]["NOT-RUN"] ?? 0} |`,
    ),
    "",
  );
  for (const f of report.fixtures) {
    lines.push(`## ${f.id} — ${f.variant}${f.diagnostic ? " (DIAGNOSTIC)" : ""}`, "");
    const facts = [];
    if (f.groundTruth) {
      const g = f.groundTruth;
      facts.push(
        `Ground truth (${g.method}): decodes ${g.decodesToExpected}, validates ${g.validates}, negative control rejected ${g.negativeControlRejected}.`,
      );
    }
    if (f.vellora?.sha256) {
      facts.push(
        `vellora PDF sha256 \`${f.vellora.sha256}\` (${f.vellora.bytes} bytes, ${f.vellora.pages} pages, images ${f.vellora.images}, fonts ${f.vellora.fonts.join(", ")}).`,
      );
    } else if (f.vellora?.error) {
      facts.push(
        `vellora strict gate rejected: ${f.vellora.error.feature ?? ""} ${f.vellora.error.message}`,
      );
    }
    if (f.chrome?.sha256) {
      facts.push(
        `Chrome PDF sha256 \`${f.chrome.sha256}\` (${f.chrome.pages} pages, images ${f.chrome.images}, fonts ${f.chrome.fonts.join(", ")}).`,
      );
    }
    lines.push(...facts.map((x) => `- ${x}`), "");
    lines.push("| Criterion | vellora (strict) | Chrome reference |", "|---|---|---|");
    for (const c of f.criteria) {
      lines.push(`| ${c.id} | ${cell(c.vellora)} | ${cell(c.chrome)} |`);
    }
    lines.push("");
  }
  return `${lines.join("\n")}\n`;
}

await main();
