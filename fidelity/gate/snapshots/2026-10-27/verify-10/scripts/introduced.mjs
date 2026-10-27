import fs from "node:fs";
import path from "node:path";
import { compareSnapshots } from "../../../../compare.mjs";
import { HEAD_GATING_CLASSES } from "../../../../debt.mjs";
import { loadSnapshot } from "../../../../snapshot.mjs";

const root = process.argv[2];
const chain = path.join(root, "fidelity/baselines/port");
const head = loadSnapshot(path.join(chain, "00-start"));
const links = fs
  .readdirSync(chain)
  .filter(
    (d) =>
      /^\d{2}-/.test(d) && d !== "00-start" && fs.existsSync(path.join(chain, d, "manifest.json")),
  )
  .sort();
const per = links.map((l) => {
  const r = compareSnapshots(head, loadSnapshot(path.join(chain, l)));
  return { l, m: new Map(r.items.map((i) => [i.key, i])) };
});
const debt = JSON.parse(fs.readFileSync(path.join(chain, "DEBT.json")));
let mism = 0;
let n = 0;
const firstSeen = {};
for (const e of debt.entries)
  for (const k of e.keys) {
    n++;
    const hits = per
      .filter((p) => HEAD_GATING_CLASSES.includes(p.m.get(k.key)?.class))
      .map((p) => p.l);
    const first = hits[0] ?? "10-integration";
    firstSeen[first] = (firstSeen[first] ?? 0) + 1;
    if (first !== e.introducedBy) {
      mism++;
      if (mism < 10) console.log("MISMATCH", k.key, e.introducedBy, first, hits.join(","));
    }
  }
console.log("links", links.join(","));
console.log("keys", n, "introducedBy mismatches", mism, firstSeen);
// Trajectory for a few sample keys.
for (const key of process.argv.slice(3)) {
  console.log(
    key,
    per
      .map(
        (p) =>
          `${p.l}:${p.m.get(key)?.class ?? "-"}:${JSON.stringify(p.m.get(key)?.after ?? null)}`,
      )
      .join(" "),
  );
}
