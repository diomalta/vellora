// Where the WebAssembly engine's code comes from (issue #66): attributes every function body in the
// `.wasm` code section to the Rust crate that defines it, using the module's `name` section.
//
//   cargo build -p vellora-wasm --target wasm32-unknown-unknown --profile wasm-profiling
//   node packages/wasm/scripts/code-size.mjs [path/to/module.wasm] [--top N] [--json]
//   node packages/wasm/scripts/code-size.mjs --first-render [fixture]   # default fixture: invoice
//
// `--first-render` counts only the code the first render of a fixture compiles: it renders the
// fixture once in a fresh `node --trace-wasm-compilation-times` process, and keeps the functions
// V8 compiled. Needs the `wasm-bindgen` CLI and `npm run build` (the template engine and fixture
// loader). `--trace FILE` does the same from a trace you recorded yourself against THIS module.
//
// Why it matters: V8 compiles a module's functions on first call (Liftoff, then TurboFan in the
// background), so the first render in a fresh isolate pays roughly in proportion to the code it
// touches. The shipped profile (`wasm-release`) strips the name section; `wasm-profiling` inherits
// it unchanged except `strip = false`, so its code is the shipped code. Without a module path the
// script runs `wasm-bindgen` on that build first (as `npm run build:wasm` does) and measures the
// result, so it needs the `wasm-bindgen` CLI.
//
// Attribution rule: the first path segment of the demangled name (`<T as Trait>::f` counts for the
// crate of `T`). Generic code is therefore counted in the crate that DEFINES it (a `Vec<Node>`
// method is `alloc`), not the crate that instantiated it. `core`/`alloc`/`std` totals include
// monomorphized copies made for every other crate. Unnamed functions are reported as such.
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const PKG = join(dirname(fileURLToPath(import.meta.url)), "..");
const ROOT = join(PKG, "..", "..");
const args = process.argv.slice(2);
const flag = (name) => args.includes(name);
const option = (name, fallback) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : fallback;
};
const positional = args.filter(
  (a, i) => !a.startsWith("--") && !["--top", "--trace", "--first-render"].includes(args[i - 1]),
);
let wasmPath =
  positional[0] ??
  join(ROOT, "target", "wasm32-unknown-unknown", "wasm-profiling", "vellora_wasm.wasm");
const top = Number(option("--top", 30));
// `--trace FILE`: the stderr of `node --trace-wasm-compilation-times` loading THIS module. Only the
// functions V8 compiled with Liftoff are counted: with lazy compilation (V8's default) that is the
// code a workload actually ran, i.e. what the first render pays to compile.
let tracePath = option("--trace");
let scratch;
if (!positional[0]) {
  // cargo's output: post-process it as `npm run build:wasm` does, so the code measured is the
  // shipped module's (wasm-bindgen drops its describe functions and adds the JS glue imports).
  scratch = mkdtempSync(join(tmpdir(), "vellora-code-size-"));
  execFileSync(
    "wasm-bindgen",
    [
      "--target",
      "web",
      "--experimental-reset-state-function",
      "--out-dir",
      scratch,
      "--out-name",
      "vellora",
      wasmPath,
    ],
    { stdio: "inherit" },
  );
  wasmPath = join(scratch, "vellora_bg.wasm");
}
if (flag("--first-render")) {
  if (!scratch)
    throw new Error("--first-render measures the wasm-profiling build; pass no module path");
  const next = args[args.indexOf("--first-render") + 1];
  const fixture = next && !next.startsWith("--") ? next : "invoice";
  const child = `
    const [dir, root, fixture] = process.argv.slice(1);
    const { readFileSync } = await import("node:fs");
    const glue = await import(dir + "/vellora.js");
    const { renderTemplate } = await import(root + "/packages/vellora/dist/index.js");
    const { fixtureImages } = await import(root + "/packages/test-harness/dist/index.js");
    const html = renderTemplate(readFileSync(root + "/fixtures/" + fixture + "/index.html", "utf8"),
      JSON.parse(readFileSync(root + "/fixtures/" + fixture + "/data.json", "utf8")));
    await glue.default({ module_or_path: await WebAssembly.compile(readFileSync(dir + "/vellora_bg.wasm")) });
    glue.render(new TextEncoder().encode(html), { images: fixtureImages(fixture) });
  `;
  const run = spawnSync(
    process.execPath,
    [
      "--trace-wasm-compilation-times",
      "--no-wasm-tier-up",
      "--input-type=module",
      "-e",
      child,
      scratch,
      ROOT,
      fixture,
    ],
    { encoding: "utf8", maxBuffer: 256 << 20 },
  );
  if (run.status !== 0) throw new Error(`first render of ${fixture} failed: ${run.stderr}`);
  tracePath = join(scratch, "trace.txt");
  writeFileSync(tracePath, run.stdout + run.stderr);
}

const bytes = readFileSync(wasmPath);
const traceText = tracePath ? readFileSync(tracePath, "utf8") : undefined;
if (scratch) rmSync(scratch, { recursive: true, force: true });
let pos = 0;
const u8 = () => bytes[pos++];
function leb() {
  let result = 0;
  let shift = 0;
  for (;;) {
    const b = u8();
    result += (b & 0x7f) * 2 ** shift;
    shift += 7;
    if (!(b & 0x80)) return result;
  }
}
const str = () => {
  const len = leb();
  const s = bytes.toString("utf8", pos, pos + len);
  pos += len;
  return s;
};

if (bytes.readUInt32LE(0) !== 0x6d736100) throw new Error(`${wasmPath}: not a WebAssembly module`);
pos = 8;
let importedFns = 0;
const bodies = []; // byte size of each defined function body, in index order
const names = new Map(); // function index -> name
const sections = {};
while (pos < bytes.length) {
  const id = u8();
  const size = leb();
  const end = pos + size;
  if (id === 0) {
    const name = str();
    sections[`custom:${name}`] = (sections[`custom:${name}`] ?? 0) + size;
    if (name === "name") {
      while (pos < end) {
        const sub = u8();
        const subSize = leb();
        const subEnd = pos + subSize;
        if (sub === 1) {
          const count = leb();
          for (let i = 0; i < count; i++) {
            const index = leb();
            names.set(index, str());
          }
        }
        pos = subEnd;
      }
    }
  } else {
    const label =
      [
        "custom",
        "type",
        "import",
        "function",
        "table",
        "memory",
        "global",
        "export",
        "start",
        "element",
        "code",
        "data",
        "datacount",
      ][id] ?? `id${id}`;
    sections[label] = (sections[label] ?? 0) + size;
    if (id === 2) {
      const count = leb();
      for (let i = 0; i < count; i++) {
        str();
        str();
        const kind = u8();
        if (kind === 0) {
          leb();
          importedFns++;
        } else if (kind === 1) {
          u8();
          const flags = leb();
          leb();
          if (flags & 1) leb();
        } else if (kind === 2) {
          const flags = leb();
          leb();
          if (flags & 1) leb();
        } else if (kind === 3) {
          u8();
          u8();
        } else {
          throw new Error(`unknown import kind ${kind}`);
        }
      }
    } else if (id === 10) {
      const count = leb();
      for (let i = 0; i < count; i++) {
        const bodySize = leb();
        bodies.push(bodySize);
        pos += bodySize;
      }
    }
  }
  pos = end;
}

if (names.size === 0) {
  console.error(
    `${wasmPath} has no function names (the shipped build strips them). Build with names:
  cargo build -p vellora-wasm --target wasm32-unknown-unknown --profile wasm-profiling`,
  );
  process.exit(1);
}

/** Legacy Rust mangling leaves a `::h<16 hex>` hash; v0 is demangled by the linker already. */
function demangle(name) {
  if (!name.startsWith("_ZN")) return name;
  const parts = [];
  let i = 3;
  while (i < name.length && name[i] !== "E") {
    const m = name.slice(i).match(/^(\d+)/);
    if (!m) break;
    const len = Number(m[1]);
    i += m[1].length;
    parts.push(name.slice(i, i + len));
    i += len;
  }
  const escapes = {
    LT: "<",
    GT: ">",
    RF: "&",
    BP: "*",
    C: ",",
    SP: "@",
    u20: " ",
    u5b: "[",
    u5d: "]",
    u7b: "{",
    u7d: "}",
    u3b: ";",
    u27: "'",
    u22: '"',
    u7e: "~",
  };
  return parts
    .map((p) =>
      p
        .replace(/^_\$/, "$")
        .replace(/\$([A-Za-z0-9]+)\$/g, (all, e) => escapes[e] ?? all)
        .replace(/\.\./g, "::"),
    )
    .join("::");
}

function crateOf(mangled) {
  const name = demangle(mangled);
  let s = name.replace(/::h[0-9a-f]{16}$/, "");
  // `<T as Trait>::f` / `<T>::f`: the type's path; `<&T as ...>`, `<[T] as ...>` peel to `T`.
  while (s.startsWith("<") || s.startsWith("&") || s.startsWith("[") || s.startsWith("*")) {
    s = s.replace(/^(<|&mut |&|\[|\*const |\*mut |dyn )/, "");
  }
  const m = s.match(/^([A-Za-z_][A-Za-z0-9_]*)::/);
  if (m) return m[1];
  if (/^(__|_Z|wasm_bindgen|wbg)/.test(name)) return "(runtime/glue)";
  if (/^(memcpy|memmove|memset|memcmp|bcmp|strlen|dlmalloc|malloc|free|realloc|calloc)/.test(name))
    return "(libc/compiler-builtins)";
  return "(other)";
}

let compiled;
if (traceText !== undefined) {
  compiled = new Set();
  for (const m of traceText.matchAll(/#(\d+) using Liftoff/g)) {
    compiled.add(Number(m[1]));
  }
}

const byCrate = new Map();
let codeTotal = 0;
let unnamed = 0;
bodies.forEach((size, i) => {
  if (compiled && !compiled.has(importedFns + i)) return;
  const name = names.get(importedFns + i);
  const crate = name ? crateOf(name) : "(unnamed)";
  if (!name) unnamed++;
  const entry = byCrate.get(crate) ?? { bytes: 0, functions: 0 };
  entry.bytes += size;
  entry.functions++;
  byCrate.set(crate, entry);
  codeTotal += size;
});

const rows = [...byCrate.entries()].sort((a, b) => b[1].bytes - a[1].bytes);
const report = {
  module: scratch ? "wasm-profiling build, after wasm-bindgen" : wasmPath,
  sections,
  functions: bodies.length,
  ...(compiled ? { trace: tracePath, compiledFunctions: compiled.size } : {}),
  codeBytes: codeTotal,
  unnamedFunctions: unnamed,
  crates: Object.fromEntries(rows),
};
if (flag("--json")) {
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  process.exit(0);
}
const kib = (n) => `${(n / 1024).toFixed(1)} KiB`;
console.log(
  `module: ${scratch ? `${positional[0] ?? "wasm-profiling build"} (after wasm-bindgen)` : wasmPath}`,
);
console.log(
  `code section ${kib(sections.code)} (${bodies.length} functions) · data ${kib(sections.data ?? 0)}` +
    ` · name ${kib(sections["custom:name"] ?? 0)}\n`,
);
if (compiled) {
  console.log(
    `compiled by the traced workload: ${kib(codeTotal)} in ${compiled.size} functions` +
      ` (${((100 * codeTotal) / sections.code).toFixed(1)}% of the code section)\n`,
  );
}
console.log("| crate | code | share | functions |");
console.log("|---|---:|---:|---:|");
for (const [crate, e] of rows.slice(0, top)) {
  console.log(
    `| ${crate} | ${kib(e.bytes)} | ${((100 * e.bytes) / codeTotal).toFixed(1)}% | ${e.functions} |`,
  );
}
const rest = rows.slice(top);
if (rest.length) {
  const b = rest.reduce((s, [, e]) => s + e.bytes, 0);
  const f = rest.reduce((s, [, e]) => s + e.functions, 0);
  console.log(
    `| (${rest.length} more) | ${kib(b)} | ${((100 * b) / codeTotal).toFixed(1)}% | ${f} |`,
  );
}
