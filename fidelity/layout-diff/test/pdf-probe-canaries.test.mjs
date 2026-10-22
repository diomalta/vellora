// The pdf-probe v2 canaries (lib/pdf-probe-canaries.mjs) on committed real PDFs: the notification
// fixture as port step 07 rendered it (vellora plain, its +6pt body-shift canary render) and
// Chrome 155's print of the same templated HTML, copied from the step-07 run
// (~/.cache/vellora-fidelity/run-all-07-media-print-20261021T162148Z/oracles/fixtures/:
// notification/plain/vellora.pdf, notification/reference/chrome.pdf,
// canaries/layout-shift-6pt.pdf). Needs fidelity/.venv (PyMuPDF); skipped with the reason
// otherwise. run-all runs the same canaries on every run (oracles/lib/canaries.mjs, GATE-K1).
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { pythonUnavailableReason, venvPython } from "../../oracles/lib/paths.mjs";
import { CANARY_NAMES, pdfProbeCanaries } from "../lib/pdf-probe-canaries.mjs";
import { parseBbox } from "../lib/pdf-probe-v1.mjs";
import { probeResultV2 } from "../lib/pdf-probe-v2.mjs";
import { pdfWordsV2 } from "../lib/pdf-words.mjs";

const data = join(dirname(fileURLToPath(import.meta.url)), "data");
const VELLORA = join(data, "notification-07.vellora.pdf");
const CHROME = join(data, "notification-07.chrome.pdf");
const SHIFTED = join(data, "notification-07.shift-6pt.pdf");
const python = venvPython();
const skip = python ? false : pythonUnavailableReason();
const which = (name) => {
  try {
    return execFileSync("/usr/bin/which", [name], { encoding: "utf8" }).trim() || null;
  } catch {
    return null;
  }
};
const pdftotext = process.env.PDFTOTEXT_BIN ?? which("pdftotext");

test("every pdf-probe v2 canary is caught on the committed notification PDFs", { skip }, () => {
  const dir = mkdtempSync(join(tmpdir(), "pdf-probe-canaries-"));
  try {
    const rows = pdfProbeCanaries({
      velloraPdf: VELLORA,
      chromePdf: CHROME,
      shiftedPdf: SHIFTED,
      workDir: dir,
      python,
      pdftotext,
      label: "notification",
    });
    assert.deepEqual(
      rows.map((r) => r.canary),
      Object.values(CANARY_NAMES).map((n) => `notification: ${n}`),
    );
    for (const r of rows) {
      if (r.ran === false) {
        assert.ok(!pdftotext && r.canary.includes("Ascent"), `${r.canary}: ${r.reason}`);
        continue;
      }
      assert.equal(r.caught, true, `${r.canary}: ${r.observed}`);
    }
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test(
  "D1 on real PDFs: v1's dy carries the producers' /Ascent gap, the v2 baseline does not",
  { skip: skip || (pdftotext ? false : "pdftotext not found") },
  () => {
    // Every notification word is Liberation Serif (krilla /Ascent 693.36 regular, 677.25 bold;
    // Chrome 891.11). v1 dy = v2 dy + (A_chrome - A_krilla) x size when both pick the same word.
    const v = pdfWordsV2(VELLORA, python).words;
    const c = pdfWordsV2(CHROME, python).words;
    const pairs = probeResultV2({ velloraWords: v, chromeWords: c }).pairs;
    const boxes = (p) =>
      parseBbox(execFileSync(pdftotext, ["-bbox", p, "-"], { encoding: "utf8" }));
    // The pdftotext box of a v2 word: same page, text and x, its top within one em above the
    // baseline (repeated words share an x, e.g. "Acme" in the header and the signature).
    const near = (list, w) =>
      list.find(
        (b) =>
          b.page === w.page &&
          b.text === w.text &&
          Math.abs(b.x - w.x) < 0.05 &&
          w.y - b.y > 0 &&
          w.y - b.y < 1.2 * w.size,
      );
    const vb = boxes(VELLORA);
    const cb = boxes(CHROME);
    const gaps = [];
    for (const p of pairs) {
      // Chrome prints the default-face footer in system Times-Roman (/Ascent 750), not Liberation.
      if (!/LiberationSerif/.test(p.chrome.font)) continue;
      const a = near(vb, { ...p.vellora, text: p.text });
      const b = near(cb, { ...p.chrome, text: p.text });
      if (!a || !b) continue;
      const bold = /Bold/.test(p.vellora.font);
      const expected = ((891.1133 - (bold ? 677.2461 : 693.3594)) / 1000) * p.vellora.size;
      gaps.push(a.y - b.y - p.dy_pt - expected);
    }
    assert.ok(gaps.length > 200, `${gaps.length} words with both boxes`);
    // Residual after removing the declared-ascent term: pdftotext's 0.01 pt rounding and
    // PyMuPDF's 0.001 pt rounding.
    const worst = Math.max(...gaps.map(Math.abs));
    assert.ok(
      worst < 0.05,
      `max residual ${worst} (${gaps.filter((g) => Math.abs(g) >= 0.05).length} over)`,
    );
  },
);
