// Build the WebAssembly engine for @vellora/wasm: `crates/vellora-wasm` → wasm32-unknown-unknown
// (workspace profile `wasm-release`) → `wasm-bindgen --target web` glue in `packages/wasm/wasm/`.
//
// Requirements (both checked below, with an actionable message):
//   rustup target add wasm32-unknown-unknown
//   cargo install wasm-bindgen-cli --version <the wasm-bindgen version in Cargo.lock> --locked
//
// `wasm-opt` is deliberately NOT run: measured on the invoice fixture it shrank the raw module
// (15.0 → 13.5 MB) but made the gzip size the Workers limit is checked against slightly LARGER
// (5.48 → 5.56 MB) and the warm render slower — see packages/wasm/README.md, "Size".
import { execFileSync } from "node:child_process";
import { readFileSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";

const PKG = join(dirname(fileURLToPath(import.meta.url)), "..");
const ROOT = join(PKG, "..", "..");
const TARGET = "wasm32-unknown-unknown";
const PROFILE = "wasm-release";
const OUT_DIR = join(PKG, "wasm");

const run = (cmd, args) => execFileSync(cmd, args, { cwd: ROOT, stdio: "inherit" });

function lockedVersion(name) {
  const lock = readFileSync(join(ROOT, "Cargo.lock"), "utf8");
  const match = lock.match(new RegExp(`name = "${name}"\\nversion = "([^"]+)"`));
  if (!match) throw new Error(`${name} is not in Cargo.lock`);
  return match[1];
}

// The CLI must match the crate byte-for-byte: wasm-bindgen refuses a schema mismatch.
const wanted = lockedVersion("wasm-bindgen");
let have = "";
try {
  have = execFileSync("wasm-bindgen", ["--version"], { encoding: "utf8" }).trim().split(" ")[1];
} catch {}
if (have !== wanted) {
  console.error(
    `error: wasm-bindgen CLI ${wanted} is required (found: ${have || "none"}). Install it with:\n` +
      `  cargo install wasm-bindgen-cli --version ${wanted} --locked`,
  );
  process.exit(1);
}

run("cargo", ["build", "-p", "vellora-wasm", "--target", TARGET, "--profile", PROFILE]);
const raw = join(ROOT, "target", TARGET, PROFILE, "vellora_wasm.wasm");
run("wasm-bindgen", [
  "--target",
  "web",
  // Generates `__wbg_reset_state()`: the wrapper re-instantiates the module after a trap (a Rust
  // panic is `abort` on wasm32 and leaves the instance's stack/heap untrustworthy).
  "--experimental-reset-state-function",
  "--out-dir",
  OUT_DIR,
  "--out-name",
  "vellora",
  raw,
]);

const wasm = join(OUT_DIR, "vellora_bg.wasm");
const bytes = readFileSync(wasm);
const mb = (n) => `${(n / 1024 / 1024).toFixed(2)} MiB`;
console.log(
  `@vellora/wasm: ${wasm}\n  raw ${mb(statSync(wasm).size)} · gzip -9 ${mb(gzipSync(bytes, { level: 9 }).length)}`,
);
