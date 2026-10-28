// The installed `vellora` command is a symlink: npm links `node_modules/.bin/vellora` (and the
// global bin) to `dist/cli.js`, so Node sees the link path in `process.argv[1]`. The CLI must still
// run. Before 0.3.2 it compared that path with `import.meta.url` and silently exited 0 when invoked
// through the link. Needs the built `dist/` (`npm run build` runs before `npm test` in CI).
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, symlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { afterAll, expect, test } from "vitest";

const cli = resolve(import.meta.dirname, "..", "dist", "cli.js");
const dir = mkdtempSync(join(tmpdir(), "vellora-bin-"));
afterAll(() => rmSync(dir, { recursive: true, force: true }));

function run(path: string) {
  return spawnSync(process.execPath, [path, "--help"], { encoding: "utf8" });
}

test("runs when invoked directly", () => {
  expect(run(cli).stdout).toContain("vellora render");
});

test("runs when invoked through a symlink, as npm installs its bin", () => {
  const link = join(dir, "vellora");
  symlinkSync(cli, link);
  expect(run(link).stdout).toContain("vellora render");
});
