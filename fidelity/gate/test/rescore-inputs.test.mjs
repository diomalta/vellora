// rescore-pdf-probe.mjs --inputs: a mapping may only fill a pdf-probe pair the run did not keep,
// with sha256-checked PDFs, and is refused for anything else (no Python needed here).
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import {
  INPUT_MAP_SCHEMA,
  loadInputMap,
  pdfInputsFor,
  portablePath,
} from "../rescore-pdf-probe.mjs";

const sha = (s) => createHash("sha256").update(s).digest("hex");

function setup() {
  const root = mkdtempSync(join(tmpdir(), "rescore-inputs-"));
  const ld = join(root, "run", "layout-diff");
  // "own": the run kept its pair; "gap": the run measured the fixture but kept no PDFs.
  mkdirSync(join(ld, "own", "run-all"), { recursive: true });
  writeFileSync(join(ld, "own", "run-all", "vellora.pdf"), "own-v");
  writeFileSync(join(ld, "own", "run-all", "chrome.pdf"), "own-c");
  mkdirSync(join(ld, "gap", "run-all"), { recursive: true });
  mkdirSync(join(root, "map", "gap"), { recursive: true });
  writeFileSync(join(root, "map", "gap", "vellora.pdf"), "map-v");
  writeFileSync(join(root, "map", "gap", "chrome.pdf"), "map-c");
  const write = (fixtures, extra = {}) => {
    const file = join(root, "map", "inputs.json");
    writeFileSync(
      file,
      JSON.stringify({ schema: INPUT_MAP_SCHEMA, why: "test", fixtures, ...extra }),
    );
    return loadInputMap(file);
  };
  const entry = (v = sha("map-v"), c = sha("map-c")) => ({
    vellora: { path: "gap/vellora.pdf", sha256: v },
    chrome: { path: "gap/chrome.pdf", sha256: c },
  });
  return { root, ld, write, entry };
}

test("without a mapping: the run's own pair, or the absent paths", () => {
  const { ld } = setup();
  assert.equal(pdfInputsFor({ fixture: "own", ld }).mapped, false);
  assert.equal(pdfInputsFor({ fixture: "gap", ld }).absent.length, 2);
});

test("a mapping fills a missing pair (paths relative to the mapping file, sha256 checked)", () => {
  const { root, ld, write, entry } = setup();
  const map = write({ gap: entry() });
  const r = pdfInputsFor({ fixture: "gap", ld, inputMap: map });
  assert.deepEqual(r, {
    vPdf: join(root, "map", "gap", "vellora.pdf"),
    cPdf: join(root, "map", "gap", "chrome.pdf"),
    mapped: true,
  });
  // Fixtures the mapping does not name are untouched.
  assert.equal(pdfInputsFor({ fixture: "own", ld, inputMap: map }).mapped, false);
});

test("a mapping is refused over the run's own PDFs, over a v1 section, or on a sha256 mismatch", () => {
  const { ld, write, entry } = setup();
  assert.throws(
    () => pdfInputsFor({ fixture: "own", ld, inputMap: write({ own: entry() }) }),
    /may only fill a missing pair/,
  );
  assert.throws(
    () => pdfInputsFor({ fixture: "gap", ld, inputMap: write({ gap: entry() }), hasV1: true }),
    /has a v1 section/,
  );
  assert.throws(
    () => pdfInputsFor({ fixture: "gap", ld, inputMap: write({ gap: entry(sha("other")) }) }),
    /mapped vellora PDF sha256/,
  );
  assert.throws(
    () => pdfInputsFor({ fixture: "gap", ld, inputMap: write({ gap: { vellora: {} } }) }),
    /needs path \+ sha256/,
  );
});

test("a mapping file needs the schema, a reason and at least one fixture", () => {
  const { write, entry } = setup();
  assert.throws(() => write({ gap: entry() }, { schema: "x" }), /schema x/);
  assert.throws(() => write({ gap: entry() }, { why: " " }), /must say why/);
  assert.throws(() => write({}), /no fixtures/);
});

test("portablePath writes home-relative paths as ~", () => {
  assert.equal(portablePath(join(homedir(), ".cache", "x")), "~/.cache/x");
  assert.equal(portablePath("/opt/x"), "/opt/x");
});
