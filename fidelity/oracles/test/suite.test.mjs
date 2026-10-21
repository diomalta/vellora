// Regression tests for the suite plumbing (validator findings, 2026-10-21):
// - reference artifacts were cached by DIRECTORY, so reusing --out with another --html scored
//   the subject against stale references;
// - a missing pdftotext silently turned the boleto linha search into [];
// - a missing tool could abort the whole run instead of producing a not-run verdict;
// - "No such image" was reported as "docker daemon not reachable".
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, test } from "node:test";
import { corruptLargestFlateStream, deleteBodyWord, stripEofMarker } from "../lib/canaries.mjs";
import { inspectFailureReason } from "../lib/docker.mjs";
import { installedPackageVersion } from "../lib/env.mjs";
import { pythonUnavailableReason, venvPython } from "../lib/paths.mjs";
import { checkObjects, parseOwnXref } from "../lib/qpdf.mjs";
import { boletoTextChecks, guarded, referenceArtifacts } from "../lib/suite.mjs";

const dir = mkdtempSync(join(tmpdir(), "vellora-oracle-suite-"));
after(() => rmSync(dir, { recursive: true, force: true }));

/** Fake engines that count their calls and echo the HTML they were given. */
function fakeRenderers(imageId = "sha256:tools-1") {
  const calls = { innerText: 0, pdf: 0, weasyprint: 0 };
  return {
    calls,
    renderers: {
      innerText: async (_chrome, html) => {
        calls.innerText += 1;
        return html.match(/<p>(.*?)<\/p>/)[1];
      },
      pdf: async (_chrome, html) => {
        calls.pdf += 1;
        return new TextEncoder().encode(`%PDF-fake ${html.length}`);
      },
      weasyprint: async (html, refDir) => {
        calls.weasyprint += 1;
        const pdfPath = join(refDir, "weasyprint.pdf");
        writeFileSync(pdfPath, `%PDF-weasy ${html.length}`);
        return { pdfPath, tool: { name: "WeasyPrint", version: "fake" } };
      },
      toolsImage: async () => ({ available: true, id: imageId }),
    },
  };
}
const chrome = { version: "Chrome/155.0.8059.85", executablePath: "/fake/chrome" };
const page = (text) => `<html><head></head><body><p>${text}</p></body></html>`;

test("reference cache: same HTML reuses, different HTML in the same dir re-renders", async () => {
  const refDir = join(dir, "refs");
  const fake = fakeRenderers();
  const opts = { refDir, chrome, injectFonts: false, renderers: fake.renderers };
  const first = await referenceArtifacts({ ...opts, templatedHtml: page("invoice text") });
  assert.equal(first.expectedText, "invoice text");
  assert.equal(first.cache.chrome, "miss: rendered");
  const again = await referenceArtifacts({ ...opts, templatedHtml: page("invoice text") });
  assert.equal(again.cache.chrome, "hit");
  assert.equal(again.cache.weasyprint, "hit");
  assert.deepEqual(fake.calls, { innerText: 1, pdf: 1, weasyprint: 1 });
  const other = await referenceArtifacts({ ...opts, templatedHtml: page("receipt text") });
  assert.equal(other.expectedText, "receipt text", "stale invoice reference must not be reused");
  assert.equal(other.cache.chrome, "stale: re-rendered");
  assert.deepEqual(fake.calls, { innerText: 2, pdf: 2, weasyprint: 2 });
  assert.notEqual(first.referenceHtmlSha256, other.referenceHtmlSha256);
  assert.equal(other.facts.referenceHtmlSha256, other.referenceHtmlSha256);
  assert.equal(other.facts.chromePdf.sha256.length, 64);
  const meta = JSON.parse(readFileSync(join(refDir, "meta.json"), "utf8"));
  assert.equal(meta.htmlSha256, other.referenceHtmlSha256);
});

test("reference cache: a new Chrome version, tools image or edited file re-renders", async () => {
  const refDir = join(dir, "refs-keys");
  const fake = fakeRenderers();
  const base = { refDir, injectFonts: false, templatedHtml: page("x") };
  await referenceArtifacts({ ...base, chrome, renderers: fake.renderers });
  const newer = { ...chrome, version: "Chrome/156.0.0.0" };
  const bumped = await referenceArtifacts({ ...base, chrome: newer, renderers: fake.renderers });
  assert.equal(bumped.cache.chrome, "stale: re-rendered");
  assert.equal(bumped.cache.weasyprint, "hit", "WeasyPrint key does not include Chrome");
  const otherImage = fakeRenderers("sha256:tools-2");
  const rebuilt = await referenceArtifacts({
    ...base,
    chrome: newer,
    renderers: otherImage.renderers,
  });
  assert.equal(rebuilt.cache.weasyprint, "stale: re-rendered");
  writeFileSync(join(refDir, "chrome-innertext.txt"), "tampered");
  const tampered = await referenceArtifacts({
    ...base,
    chrome: newer,
    renderers: otherImage.renderers,
  });
  assert.equal(tampered.cache.chrome, "stale: re-rendered");
  assert.equal(tampered.expectedText, "x");
});

test("reference cache: without Chrome nothing is reused and the reason is kept", async () => {
  const refDir = join(dir, "refs-nochrome");
  const fake = fakeRenderers();
  await referenceArtifacts({
    refDir,
    chrome,
    injectFonts: false,
    templatedHtml: page("y"),
    renderers: fake.renderers,
  });
  const refs = await referenceArtifacts({
    refDir,
    chrome: null,
    chromeError: "Chrome not found at /nonexistent",
    injectFonts: false,
    templatedHtml: page("y"),
    renderers: fake.renderers,
  });
  assert.equal(refs.expectedText, null);
  assert.equal(refs.chromePdfPath, null);
  assert.match(refs.errors.join(), /Chrome unavailable: Chrome not found at \/nonexistent/);
  assert.ok(refs.weasy.notRun);
});

test("reference cache: WeasyPrint is not rendered when the layout oracle is not selected", async () => {
  const fake = fakeRenderers();
  const refs = await referenceArtifacts({
    refDir: join(dir, "refs-noweasy"),
    chrome,
    injectFonts: false,
    templatedHtml: page("z"),
    withWeasyPrint: false,
    renderers: fake.renderers,
  });
  assert.equal(fake.calls.weasyprint, 0);
  assert.match(refs.weasy.notRun, /layout oracle not selected/);
  assert.equal(refs.expectedText, "z");
});

test("guarded turns an oracle exception into not-run with the reason", async () => {
  const result = await guarded("barcode", async () => {
    throw new Error("spawn /nonexistent ENOENT");
  });
  assert.deepEqual(result, {
    oracle: "barcode",
    status: "not-run",
    reason: "oracle error: spawn /nonexistent ENOENT",
  });
});

test("boleto linha search is not-run (not []) when no extractor ran", async () => {
  const none = await boletoTextChecks(
    "x.pdf",
    {},
    {
      extract: async () => [
        { name: "pdftotext", error: "pdftotext not found" },
        { name: "pymupdf", error: "fidelity/.venv missing" },
      ],
    },
  );
  assert.equal(none.linhasInExtractedText.status, "not-run");
  assert.match(none.linhasInExtractedText.reason, /pdftotext not found/);
  const linha = "03399.02826 03356.661245 57800.201014 8 20460000027371";
  const some = await boletoTextChecks(
    "x.pdf",
    {},
    {
      extract: async () => [
        { name: "pdftotext", error: "pdftotext not found" },
        { name: "pymupdf", version: "1", text: `Linha ${linha} fim` },
      ],
    },
  );
  assert.equal(some.linhasInExtractedText.status, "ran");
  assert.equal(some.linhasInExtractedText.maxOccurrences, 1);
  assert.deepEqual(
    some.linhasInExtractedText.distinct.map((l) => l.linha),
    [linha],
  );
  assert.equal(some.linhasInExtractedText.perExtractor[0].status, "not-run");
});

test("docker inspect failures are classified by what the daemon said", () => {
  assert.match(
    inspectFailureReason("img:x", "Error response from daemon: No such image: img:x"),
    /image img:x not present locally/,
  );
  assert.match(
    inspectFailureReason(
      "img:x",
      "Cannot connect to the Docker daemon at unix:///var/run/docker.sock",
    ),
    /docker daemon not reachable/,
  );
  assert.match(inspectFailureReason("img:x", "permission denied"), /inspect img:x failed/);
});

test("venvPython never returns an override that does not exist", () => {
  const saved = process.env.VELLORA_FIDELITY_PYTHON;
  try {
    process.env.VELLORA_FIDELITY_PYTHON = "/nonexistent/python";
    assert.equal(venvPython(), null);
    assert.match(pythonUnavailableReason(), /VELLORA_FIDELITY_PYTHON=\/nonexistent\/python/);
    process.env.VELLORA_FIDELITY_PYTHON = process.execPath; // any existing file
    assert.equal(venvPython(), process.execPath);
  } finally {
    if (saved === undefined) {
      // `= undefined` would store the STRING "undefined" in process.env.
      Reflect.deleteProperty(process.env, "VELLORA_FIDELITY_PYTHON");
    } else {
      process.env.VELLORA_FIDELITY_PYTHON = saved;
    }
  }
});

test("puppeteer-core version is read from the installed package", () => {
  const root = join(dir, "pkgroot");
  const pkgDir = join(root, "node_modules", "puppeteer-core");
  rmSync(pkgDir, { recursive: true, force: true });
  assert.equal(installedPackageVersion("puppeteer-core", root), null);
  mkdirSync(pkgDir, { recursive: true });
  writeFileSync(join(pkgDir, "package.json"), JSON.stringify({ version: "25.15.0" }));
  assert.equal(installedPackageVersion("puppeteer-core", root), "25.15.0");
});

test("deleteBodyWord removes one whole body word and never touches markup", () => {
  const html =
    '<html><head><title>Fatura de teste</title></head><body><!-- de --><style>.de{}</style><p class="de">Suporte de fixação</p><td>R$\u00a032,50</td><td>R$\u00a01,00</td></body></html>';
  const de = deleteBodyWord(html, "de");
  assert.equal(de.deleted, "de");
  assert.match(de.html, /<p class="de">Suporte fixação<\/p>/);
  assert.match(de.html, /<title>Fatura de teste<\/title>/);
  assert.match(de.html, /<!-- de --><style>\.de\{\}<\/style>/);
  const real = deleteBodyWord(html, "R$");
  assert.match(real.html, /<td>32,50<\/td><td>R\$\u00a01,00<\/td>/);
  assert.equal(deleteBodyWord(html, "ausente").deleted, null);
});

test("stripEofMarker and corruptLargestFlateStream produce structural problems", async () => {
  const { deflateSync } = await import("node:zlib");
  // Incompressible, deterministic payload (LCG bytes) so the stream is large enough to corrupt.
  let seed = 7;
  const payload = Buffer.alloc(4000, 0).map(() => {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    return seed >>> 16;
  });
  const data = deflateSync(payload);
  const body = `<</Length ${data.length}/Filter/FlateDecode>>\nstream\n`;
  const head = "%PDF-1.7\n";
  const obj = Buffer.concat([
    Buffer.from(`1 0 obj\n${body}`),
    data,
    Buffer.from("\nendstream\nendobj\n"),
  ]);
  const xrefAt = head.length + obj.length;
  const pdf = Buffer.concat([
    Buffer.from(head),
    obj,
    Buffer.from(
      `xref\n0 2\n0000000000 65535 f\r\n${String(head.length).padStart(10, "0")} 00000 n\r\ntrailer\n<</Size 2>>\nstartxref\n${xrefAt}\n%%EOF`,
    ),
  ]);
  const ok = parseOwnXref(pdf);
  assert.deepEqual(ok.problems, []);
  assert.deepEqual(checkObjects(pdf, ok.entries, ok.sectionOffset).problems, []);
  assert.match(parseOwnXref(stripEofMarker(pdf)).problems.join(), /%%EOF/);
  const flate = corruptLargestFlateStream(pdf);
  assert.equal(flate.length, pdf.length);
  const own = parseOwnXref(flate);
  assert.match(
    checkObjects(flate, own.entries, own.sectionOffset).problems.join(),
    /does not inflate/,
  );
});
