// Stratified sample: per DEBT entry with pdf-probe keys, the first, the middle and the last key
// (deterministic), as JSON lines {key, fixture, k, axis, measured} for pdf_check.py.
import fs from "node:fs";

const debt = JSON.parse(fs.readFileSync(process.argv[2]));
const out = [];
for (const e of debt.entries) {
  const ks = e.keys.filter((k) => k.key.startsWith("pdf-probe|"));
  if (!ks.length) continue;
  const pick = [...new Set([0, Math.floor(ks.length / 2), ks.length - 1])].map((i) => ks[i]);
  for (const k of pick) {
    const [, fixture, page, word, axis] = k.key.split("|");
    out.push({
      entry: e.id,
      key: k.key,
      fixture,
      k: `${page}|${word}`,
      axis,
      measured: k.measured,
    });
  }
}
fs.writeFileSync(process.argv[3], `${out.map((o) => JSON.stringify(o)).join("\n")}\n`);
console.log("sampled", out.length);
