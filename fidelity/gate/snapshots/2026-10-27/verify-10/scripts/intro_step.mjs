// For every pdf-probe DEBT key: the change of its value at the link that introduced it (link
// value minus the previous link's value, committed pdf-probe sections), histogrammed per link.
// argv: <repo root>
import fs from "node:fs";
import path from "node:path";

const root = process.argv[2];
const chain = path.join(root, "fidelity/baselines/port");
const links = fs
  .readdirSync(chain)
  .filter((d) => /^\d{2}-/.test(d))
  .sort();
const cache = new Map();
const value = (link, fx, k, axis) => {
  const f = path.join(chain, link, "pdf-probe", `${fx}.json`);
  if (!cache.has(f)) {
    const j = fs.existsSync(f) ? JSON.parse(fs.readFileSync(f)) : { pairs: [] };
    cache.set(f, new Map(j.pairs.map((p) => [p.k, p])));
  }
  const p = cache.get(f).get(k);
  return p ? p[axis] : null;
};
const debt = JSON.parse(fs.readFileSync(path.join(chain, "DEBT.json")));
const hist = {};
for (const e of debt.entries)
  for (const key of e.keys) {
    if (!key.key.startsWith("pdf-probe|")) continue;
    const [, fx, page, word, axis] = key.key.split("|");
    const at = links.indexOf(e.introducedBy);
    const before = value(links[at - 1], fx, `${page}|${word}`, axis);
    const after = value(links[at], fx, `${page}|${word}`, axis);
    const g = `${e.introducedBy} ${axis}`;
    if (!hist[g]) hist[g] = {};
    const h = hist[g];
    let bin;
    if (before === null || after === null) bin = `unpaired before/after (${before}/${after})`;
    else bin = `step ${(Math.round((after - before) * 4) / 4).toFixed(2)} pt`;
    h[bin] = (h[bin] ?? 0) + 1;
  }
for (const [g, h] of Object.entries(hist)) {
  const top = Object.entries(h)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);
  console.log(g, JSON.stringify(Object.fromEntries(top)), "bins", Object.keys(h).length);
}
