#!/usr/bin/env python3
"""Build c07/accepted.json for the Phase C step 07 tip gated run.

usage: build-accepted.py <c06 accepted.json> <step> <out>

Carries c06's class-a entries verbatim (order preserved) and sets the step id and a note. Neither
step-07 branch (phasec/07-pin-b, phasec/07-svg-fonts) proposed a new class-a entry.
"""
import json
import sys

src, step, out = sys.argv[1:4]
c06 = json.load(open(src))
entries = c06["acceptedRegressions"]
for e in entries:
    assert e["class"] == "a", e["key"]
    assert e.get("reason") and e.get("evidence"), e["key"]
note = (
    "Class-a acceptances of the Phase C step 07 tip (branch phasec/07-tip: merge of "
    "phasec/07-svg-fonts and phasec/07-pin-b onto phasec/06-verify b81811a). Built by "
    "c07/scripts/build-accepted.py from c06/accepted.json (step 15-phase-c-06-tip, "
    + str(len(entries))
    + " entries), entries verbatim; no step-07 branch proposed a new class-a entry. NOT entered: "
    "css/css-break/flexbox/flex-fragmented-with-float-descendant-001.html (a clean pass at the "
    "pin and at 00-start, now an ink-flagged pass): its old records carry no Chrome ink flag and "
    "no page count, so GATE-A3 (a) evidence does not exist; it stays a DEBT-10-wpt-1 key "
    "(see c07/README.md)."
)
doc = {"step": step, "note": note, "acceptedRegressions": entries}
with open(out, "w") as f:
    json.dump(doc, f, indent=2, ensure_ascii=False)
    f.write("\n")
print(len(entries), "entries ->", out)
