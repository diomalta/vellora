import fs from "node:fs";
import z from "node:zlib";

const rd = (p) =>
  JSON.parse(p.endsWith(".gz") ? z.gunzipSync(fs.readFileSync(p)) : fs.readFileSync(p));
for (const p of process.argv.slice(2)) {
  if (!fs.existsSync(p)) {
    console.log(p, "MISSING");
    continue;
  }
  const j = rd(p);
  const ov = j.offPage?.vellora ?? [];
  const uv = j.unpairedVellora ?? j.unpaired?.vellora ?? [];
  console.log(
    p.split("/").slice(-3).join("/"),
    "keys",
    Object.keys(j).join(","),
    "unpairedV",
    Array.isArray(uv) ? uv.length : JSON.stringify(uv).slice(0, 80),
    "offPageV",
    ov.length,
    JSON.stringify(
      ov
        .filter((w) => /Download|^as$|PDF/.test(w.text))
        .map((w) => [w.text, w.y ?? w.baseline, w.page]),
    ),
  );
}
