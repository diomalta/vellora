import fs from "node:fs";

const [pinFile, runFile] = process.argv.slice(2);
const pin = JSON.parse(fs.readFileSync(pinFile));
const run = JSON.parse(fs.readFileSync(runFile));
console.log("pin keys", Object.keys(pin).slice(0, 12).join(","));
// Find a test->outcome map in the pin expectations.
let pmap = null;
for (const k of Object.keys(pin)) {
  const v = pin[k];
  if (v && typeof v === "object" && !Array.isArray(v) && Object.keys(v).length > 5000) {
    pmap = v;
    console.log("pin map field", k, JSON.stringify(Object.entries(v)[0]).slice(0, 200));
    break;
  }
  if (Array.isArray(v) && v.length > 5000) {
    pmap = Object.fromEntries(v.map((t) => [t.test, t]));
    console.log("pin array field", k, JSON.stringify(v[0]).slice(0, 200));
    break;
  }
}
const oc = (x) => (typeof x === "string" ? x : (x?.outcome ?? x?.status));
const flagged = (x) => (typeof x === "object" ? (x.flags ?? x.flagged ?? x.suspect ?? null) : null);
const cnt = {};
let pinPass = 0;
let runPass = 0;
const p2f = [];
let f2p = 0;
for (const t of run.tests) {
  const p = oc(pmap?.[t.test]);
  if (p === "pass") pinPass++;
  if (t.outcome === "pass") runPass++;
  if (p === "pass" && t.outcome !== "pass") p2f.push(t);
  if (p === "fail" && t.outcome === "pass") f2p++;
  cnt[`${p}->${t.outcome}`] = (cnt[`${p}->${t.outcome}`] ?? 0) + 1;
}
console.log("tests", run.tests.length, "pinPass", pinPass, "runPass", runPass, "fail->pass", f2p);
console.log(cnt);
const p2fFail = p2f.filter((t) => t.outcome === "fail");
const rawFail = p2fFail.filter((t) => t.rawOutcome && t.rawOutcome !== "pass");
console.log(
  "pass->non-pass",
  p2f.length,
  "pass->fail",
  p2fFail.length,
  "of those raw not pass",
  rawFail.length,
);
const byOut = {};
for (const t of p2f)
  byOut[`${t.outcome}/raw:${t.rawOutcome}`] = (byOut[`${t.outcome}/raw:${t.rawOutcome}`] ?? 0) + 1;
console.log(byOut);
const sample = pmap?.[p2f[0]?.test];
console.log("pin record sample", JSON.stringify(sample).slice(0, 400));
let fl = 0;
for (const t of p2f) if (flagged(pmap[t.test])) fl++;
console.log("pin-flagged among pass->non-pass (field guess)", fl);
