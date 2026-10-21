// A committed baseline never carries the local checkout or home path: the reports write-baseline
// COPIES (gate-report.{json,md}, --attach files) embed the run's argv verbatim, e.g. an absolute
// `--chrome-from ~/.cache/...` path, so they go through the same rewrite as the files it writes.
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { copyPortable } from "../write-baseline.mjs";

test("copyPortable rewrites the checkout and home path in text reports, copies binaries raw", () => {
  const dir = mkdtempSync(join(tmpdir(), "vellora-write-baseline-"));
  const root = join(dir, "checkout");
  const cmd = `node fidelity/run-all.mjs --chrome-from ${homedir()}/.cache/x/results.json --out ${root}/fidelity/results/r`;
  for (const ext of ["json", "md"]) {
    const src = join(dir, `src.${ext}`);
    writeFileSync(
      src,
      ext === "json" ? JSON.stringify({ command: cmd }) : `| command | \`${cmd}\` |\n`,
    );
    const dest = join(dir, `dest.${ext}`);
    copyPortable(src, dest, root);
    const out = readFileSync(dest, "utf8");
    assert.ok(!out.includes(homedir()), `${ext}: home path left in ${out}`);
    assert.ok(out.includes("--chrome-from ~/.cache/x/results.json"), out);
    assert.ok(out.includes("--out <repo>/fidelity/results/r"), out);
  }
  const bin = Buffer.from([0x25, 0x50, 0x44, 0x46, 0xff, 0x00, 0xfe]);
  writeFileSync(join(dir, "a.pdf"), bin);
  copyPortable(join(dir, "a.pdf"), join(dir, "b.pdf"), root);
  assert.deepEqual(readFileSync(join(dir, "b.pdf")), bin);
  rmSync(dir, { recursive: true, force: true });
});
