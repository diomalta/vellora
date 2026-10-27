import fs from "node:fs";
import path from "node:path";

const [baseDir, runDir] = process.argv.slice(2);
const ms = (arr) => {
  const m = new Map();
  for (const w of arr ?? []) m.set(w.text, (m.get(w.text) ?? 0) + 1);
  return m;
};
for (const f of fs.readdirSync(baseDir).filter((x) => x.endsWith(".json"))) {
  const fx = f.replace(/\.json$/, "");
  const b = JSON.parse(fs.readFileSync(path.join(baseDir, f)));
  const rp = path.join(runDir, "layout-diff", fx, "run-all", "pdf-probe.json");
  if (!fs.existsSync(rp)) {
    console.log(fx, "RUN MISSING");
    continue;
  }
  const r = JSON.parse(fs.readFileSync(rp));
  const rPairs = new Set(r.pairs.map((p) => p.k));
  const lost = b.pairs.filter((p) => !rPairs.has(p.k)).map((p) => p.k);
  const bo = ms(b.offPage?.vellora);
  const ro = ms(r.offPage?.vellora);
  const grown = [...ro]
    .filter(([t, n]) => n > (bo.get(t) ?? 0))
    .map(([t, n]) => `${t}:${bo.get(t) ?? 0}->${n}`);
  const bChromeText = ms(b.unpairedChrome);
  const rChromeText = ms(r.unpairedChrome);
  const ucGrown = [...rChromeText]
    .filter(([t, n]) => n > (bChromeText.get(t) ?? 0))
    .map(([t, n]) => `${t}:${bChromeText.get(t) ?? 0}->${n}`);
  // Vellora text that exists in the run at all (on page or off page), per text, vs the base.
  const allV = (s) => {
    const m = ms(s.offPage?.vellora);
    for (const p of s.pairs) m.set(p.text, (m.get(p.text) ?? 0) + 1);
    for (const w of s.unpairedVellora ?? []) m.set(w.text, (m.get(w.text) ?? 0) + 1);
    return m;
  };
  const bv = allV(b);
  const rv = allV(r);
  const vanished = [...bv]
    .filter(([t, n]) => n > (rv.get(t) ?? 0))
    .map(([t, n]) => `${t}:${n}->${rv.get(t) ?? 0}`);
  console.log(
    fx,
    `pairs ${b.pairs.length}->${r.pairs.length}`,
    `unpairedChrome ${b.unpairedChrome.length}->${r.unpairedChrome.length}`,
    `offPageV ${(b.offPage?.vellora ?? []).length}->${(r.offPage?.vellora ?? []).length}`,
    `pagesV ${JSON.stringify(b.pages)}->${JSON.stringify(r.pages)}`,
  );
  if (lost.length) console.log("  lost pairs:", lost.length, lost.slice(0, 20).join(" "));
  if (grown.length) console.log("  off-page grown:", grown.join(" "));
  if (ucGrown.length) console.log("  unpairedChrome grown:", ucGrown.slice(0, 20).join(" "));
  if (vanished.length)
    console.log("  vellora text count dropped:", vanished.slice(0, 20).join(" "));
}
