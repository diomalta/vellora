// Second layout oracle: WeasyPrint renders the same reference HTML (same bundled font files as
// Chrome) inside the tools image, then Chrome, WeasyPrint and the subject PDF are reduced to
// word anchors and scored with consensus.mjs.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { flattenWords, scoreConsensus } from "./consensus.mjs";
import { TOOLS_IMAGE, inspectImage, toolsRun } from "./docker.mjs";
import { run } from "./exec.mjs";
import { PY_DIR, venvPython } from "./paths.mjs";

/**
 * Render reference HTML with WeasyPrint (network disabled, so only inlined data: URLs load).
 * Returns { pdfPath, tool } or { notRun: reason }.
 */
export async function renderWeasyPrint(referenceHtml, workDir) {
  const image = await inspectImage(TOOLS_IMAGE);
  if (!image.available) {
    return { notRun: image.reason };
  }
  mkdirSync(workDir, { recursive: true });
  writeFileSync(join(workDir, "weasyprint-input.html"), referenceHtml);
  const uid =
    typeof process.getuid === "function" ? `${process.getuid()}:${process.getgid()}` : undefined;
  const version = await toolsRun(["weasyprint", "--version"]);
  const fonts = await toolsRun(["fc-list", "--format", "%{family[0]}|%{file}\n"]);
  const result = await toolsRun(
    [
      "sh",
      "-c",
      "HOME=/tmp weasyprint --media-type print /work/weasyprint-input.html /work/weasyprint.pdf",
    ],
    { mounts: [{ host: workDir, container: "/work" }], user: uid, timeoutMs: 600_000 },
  );
  const pdfPath = join(workDir, "weasyprint.pdf");
  if (result.code !== 0 || !existsSync(pdfPath)) {
    return { notRun: `weasyprint exit ${result.code}: ${result.stderr.slice(0, 600)}` };
  }
  return {
    pdfPath,
    tool: {
      name: "WeasyPrint",
      version: version.stdout.trim(),
      route: `docker ${TOOLS_IMAGE} (${image.id}, ${image.architecture})`,
      systemFontsInImage: fonts.stdout.trim().split("\n").filter(Boolean),
      warnings: result.stderr
        .split("\n")
        .filter((line) => line.trim())
        .slice(0, 30),
    },
  };
}

export async function wordAnchors(pdfPath) {
  const python = venvPython();
  if (!python) {
    throw new Error("fidelity/.venv missing (see fidelity/oracles/README.md)");
  }
  const result = await run(python, ["-I", join(PY_DIR, "words.py"), pdfPath]);
  if (result.code !== 0) {
    throw new Error(`words.py failed: ${result.stderr.trim()}`);
  }
  return JSON.parse(result.stdout);
}

function pageGeometry(payload) {
  return payload.pages.map((p) => ({ page: p.page, width: p.width, height: p.height }));
}

/**
 * @param chromePdfPath Chrome's print of the reference HTML; @param weasyPdfPath optional
 * pre-rendered WeasyPrint PDF (+ weasyTool record), else rendered here from referenceHtml.
 */
export async function layoutOracle({
  pdfPath,
  chromePdfPath,
  referenceHtml,
  workDir,
  weasyPdfPath,
  weasyTool,
}) {
  const weasy = weasyPdfPath
    ? { pdfPath: weasyPdfPath, tool: weasyTool ?? null }
    : await renderWeasyPrint(referenceHtml, workDir);
  if (weasy.notRun) {
    return { oracle: "layout-consensus", status: "not-run", reason: `WeasyPrint: ${weasy.notRun}` };
  }
  if (!chromePdfPath) {
    return { oracle: "layout-consensus", status: "not-run", reason: "no Chrome reference PDF" };
  }
  const [chromeWords, weasyWords, subjectWords] = [
    await wordAnchors(chromePdfPath),
    await wordAnchors(weasy.pdfPath),
    await wordAnchors(pdfPath),
  ];
  if (workDir) {
    mkdirSync(workDir, { recursive: true });
    writeFileSync(join(workDir, "words-chrome.json"), JSON.stringify(chromeWords));
    writeFileSync(join(workDir, "words-weasyprint.json"), JSON.stringify(weasyWords));
    writeFileSync(join(workDir, "words-subject.json"), JSON.stringify(subjectWords));
  }
  const score = scoreConsensus({
    chrome: flattenWords(chromeWords),
    weasyprint: flattenWords(weasyWords),
    subject: flattenWords(subjectWords),
  });
  return {
    oracle: "layout-consensus",
    // Informational until ACCEPTANCE.md fixes per-class thresholds: the oracle measures, it does
    // not yet gate.
    status: "info",
    tools: { weasyprint: weasy.tool, words: { name: "pymupdf", version: subjectWords.version } },
    pages: {
      chrome: pageGeometry(chromeWords),
      weasyprint: pageGeometry(weasyWords),
      subject: pageGeometry(subjectWords),
    },
    wordCounts: {
      chrome: flattenWords(chromeWords).length,
      weasyprint: flattenWords(weasyWords).length,
      subject: flattenWords(subjectWords).length,
    },
    ...score,
    weasyPdfBytes: readFileSync(weasy.pdfPath).length,
  };
}
