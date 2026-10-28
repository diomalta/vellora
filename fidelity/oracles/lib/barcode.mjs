// Barcode oracle: rasterize every page at 300 dpi (poppler pdftoppm), decode the document's
// symbology with zxing-cpp (host venv) and zbarimg (tools image), compare with the expected
// digits, and validate anything decoded with the document's own check digits:
//   itf      boleto (BCB Carta-Circular 2926): FEBRABAN/BCB mod-11 general DV (lib/febraban.mjs)
//   code128  DANFE chave de acesso (MOC 7.0 Anexo II 2, CODE-128C): NF-e mod-11 cDV, reusing the
//            corpus validator (fidelity/corpus/lib/nfe.mjs, MOC Visao Geral 2.2.6.2)
import { mkdirSync, readdirSync } from "node:fs";
import { basename, join } from "node:path";
import { validateChave } from "../../corpus/lib/nfe.mjs";
import { TOOLS_IMAGE, inspectImage, toolsRun } from "./docker.mjs";
import { findExecutable, run, versionLine } from "./exec.mjs";
import { validateBoletoBarcode } from "./febraban.mjs";
import { PY_DIR, pythonUnavailableReason, venvPython } from "./paths.mjs";

export const BARCODE_DPI = 300;

/**
 * Per symbology: the zxing page key (py/decode_barcode.py), the zbar config and the validator of a
 * decoded 44-digit text ({ applicable, valid, errors }).
 */
export const SYMBOLOGIES = Object.freeze({
  itf: {
    label: "ITF",
    zxingKey: "itf",
    zbar: ["-Sdisable", "-Si25.enable"],
    validate: (text) => ({ text, ...validateBoletoBarcode(text) }),
  },
  code128: {
    label: "Code 128",
    zxingKey: "code128",
    zbar: ["-Sdisable", "-Scode128.enable"],
    validate: (text) => {
      const v = validateChave(text);
      return {
        text,
        applicable: true,
        valid: v.ok,
        errors: v.ok ? "" : (v.reason ?? `chave cDV ${v.actual}, expected ${v.expected}`),
        rule: "NF-e chave de acesso mod-11 cDV (MOC 7.0 Visao Geral 2.2.6.2)",
      };
    },
  },
});

/** Rasterize with pdftoppm; returns { pngs, dpi, tool } or { notRun: reason } (never throws). */
export async function rasterize(pdfPath, outDir, { dpi = BARCODE_DPI } = {}) {
  const pdftoppm = await findExecutable("pdftoppm", "PDFTOPPM_BIN");
  if (!pdftoppm) {
    return { notRun: "pdftoppm not found (install poppler or set PDFTOPPM_BIN)" };
  }
  mkdirSync(outDir, { recursive: true });
  const prefix = join(outDir, "page");
  let result;
  try {
    result = await run(pdftoppm, ["-r", String(dpi), "-gray", "-png", pdfPath, prefix]);
  } catch (error) {
    return { notRun: `cannot run ${pdftoppm}: ${error.message}` };
  }
  if (result.code !== 0) {
    return { notRun: `pdftoppm failed (${result.code}): ${result.stderr.trim()}` };
  }
  const pngs = readdirSync(outDir)
    .filter((name) => /^page-\d+\.png$/.test(name))
    .sort((a, b) => Number(a.match(/\d+/)[0]) - Number(b.match(/\d+/)[0]))
    .map((name) => join(outDir, name));
  return {
    pngs,
    dpi,
    tool: { name: "pdftoppm", path: pdftoppm, version: await versionLine(pdftoppm, ["-v"]) },
  };
}

async function decodeWithZxing(pngs, sym) {
  const python = venvPython();
  if (!python) {
    return { decoder: "zxing-cpp", status: "not-run", reason: pythonUnavailableReason() };
  }
  let result;
  try {
    result = await run(python, ["-I", join(PY_DIR, "decode_barcode.py"), ...pngs]);
  } catch (error) {
    return {
      decoder: "zxing-cpp",
      status: "not-run",
      reason: `cannot run ${python}: ${error.message}`,
    };
  }
  if (result.code !== 0) {
    return { decoder: "zxing-cpp", status: "not-run", reason: result.stderr.trim() };
  }
  const parsed = JSON.parse(result.stdout);
  const symbols = parsed.pages.flatMap((page) =>
    (page[sym.zxingKey] ?? []).map((symbol) => ({ page: page.page, ...symbol })),
  );
  const ownFormat = sym.zxingKey === "itf" ? "ITF" : "Code128";
  const otherLinear = parsed.pages.flatMap((page) =>
    page.anyLinear
      .filter((symbol) => symbol.format !== ownFormat)
      .map((symbol) => ({ page: page.page, ...symbol })),
  );
  return {
    decoder: "zxing-cpp",
    version: parsed.version,
    status: "ran",
    symbols: symbols.map((s) => ({ page: s.page, format: s.format, text: s.text })),
    otherLinearSymbols: otherLinear.map((s) => ({ page: s.page, format: s.format, text: s.text })),
  };
}

/**
 * zbarimg exit codes (zbarimg(1)): 0 = symbols found, 4 = no symbol found, others = error.
 * `-Sdisable -Si25.enable` restricts zbar to Interleaved 2 of 5, `-Scode128.enable` to Code 128.
 */
async function decodeWithZbar(pngs, workDir, sym) {
  const image = await inspectImage(TOOLS_IMAGE);
  if (!image.available) {
    return { decoder: "zbar", status: "not-run", reason: image.reason };
  }
  const versionResult = await toolsRun(["zbarimg", "--version"]);
  const args = ["zbarimg", "-q", ...sym.zbar, ...pngs.map((png) => `/work/${basename(png)}`)];
  const result = await toolsRun(args, {
    mounts: [{ host: workDir, container: "/work", readonly: true }],
  });
  if (result.code !== 0 && result.code !== 4) {
    return {
      decoder: "zbar",
      status: "not-run",
      reason: `zbarimg exit ${result.code}: ${result.stderr.trim()}`,
    };
  }
  const symbols = result.stdout
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const colon = line.indexOf(":");
      return { format: line.slice(0, colon), text: line.slice(colon + 1) };
    });
  return {
    decoder: "zbar",
    version: versionResult.stdout.trim(),
    route: `docker ${TOOLS_IMAGE} (${image.id})`,
    status: "ran",
    symbols,
  };
}

/**
 * @param expect { digits?: string, symbology?: "itf" | "code128" } - the 44-digit barcode the
 * document is supposed to carry and its symbology (default itf).
 * Verdicts: "pass" (an ITF symbol decoded to the expected digits by at least one decoder and no
 * decoder disagrees), "fail" (expected digits not decoded / decoders disagree / DV invalid),
 * "info" (no expectation and nothing decoded), "not-run".
 */
export async function barcodeOracle({ pdfPath, workDir, expect = {} }) {
  const symbology = expect.symbology ?? "itf";
  const sym = SYMBOLOGIES[symbology];
  if (!sym) {
    return {
      oracle: "barcode",
      status: "not-run",
      reason: `unknown symbology ${symbology}`,
      expect,
    };
  }
  const raster = await rasterize(pdfPath, workDir);
  if (raster.notRun) {
    return { oracle: "barcode", status: "not-run", reason: raster.notRun, expect };
  }
  const decoders = [
    await decodeWithZxing(raster.pngs, sym),
    await decodeWithZbar(raster.pngs, workDir, sym),
  ];
  const ran = decoders.filter((d) => d.status === "ran");
  const decodedTexts = [...new Set(ran.flatMap((d) => d.symbols.map((s) => s.text)))];
  const validations = decodedTexts.filter((text) => /^\d{44}$/.test(text)).map(sym.validate);

  const problems = [];
  if (ran.length === 0) {
    return {
      oracle: "barcode",
      status: "not-run",
      reason: decoders.map((d) => `${d.decoder}: ${d.reason}`).join("; "),
      raster: { dpi: raster.dpi, pages: raster.pngs.length, tool: raster.tool },
      decoders,
    };
  }
  if (expect.digits) {
    for (const decoder of ran) {
      const texts = decoder.symbols.map((s) => s.text);
      if (!texts.includes(expect.digits)) {
        problems.push(
          texts.length === 0
            ? `${decoder.decoder}: no ${sym.label} symbol decoded (expected ${expect.digits})`
            : `${decoder.decoder}: decoded ${JSON.stringify(texts)}, expected ${expect.digits}`,
        );
      }
    }
  }
  for (const validation of validations) {
    if (validation.applicable && !validation.valid) {
      problems.push(
        `decoded ${validation.text} fails ${symbology === "itf" ? "BCB/FEBRABAN" : "NF-e chave"} check: ${validation.errors}`,
      );
    }
  }
  let status;
  if (problems.length > 0) {
    status = "fail";
  } else if (expect.digits) {
    status = "pass";
  } else {
    status = decodedTexts.length > 0 ? "pass" : "info";
  }
  return {
    oracle: "barcode",
    status,
    symbology,
    problems,
    expect,
    decodedTexts,
    validations,
    raster: { dpi: raster.dpi, pages: raster.pngs.length, tool: raster.tool },
    decoders,
  };
}
