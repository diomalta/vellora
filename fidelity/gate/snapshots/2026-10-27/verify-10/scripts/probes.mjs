import fs from "node:fs";
import path from "node:path";

const dir = path.join(process.argv[2], "layout-diff");
for (const d of fs.readdirSync(dir).filter((x) => x.startsWith("probe-"))) {
  const j = JSON.parse(fs.readFileSync(path.join(dir, d, "run-all", "pdf-probe.json")));
  const off = (j.offPage?.vellora ?? []).length;
  const offC = (j.offPage?.chrome ?? []).length;
  if (off || offC || j.unpairedChrome.length)
    console.log(
      d,
      "offV",
      off,
      "offC",
      offC,
      "unpairedChrome",
      j.unpairedChrome.length,
      "pairs",
      j.pairs.length,
    );
}
console.log("done");
