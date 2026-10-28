#!/usr/bin/env python3
"""Build c06/accepted.json for the Phase C step 06 tip gated run.

usage: build-accepted.py <c05 accepted.json> <step> <out> [--drop KEY ...]

Carries c05's class-a entries verbatim (order preserved), drops any key passed with --drop (an
entry whose test really passes on the merged build; precedent monolithic-overflow-014 at c04,
table-border-007 at c05), sets the step id and writes a note. None of the four step-06 branches
(svg, table-anon, col-breaks, ruby) proposed a new class-a entry.
"""
import json
import sys

src, step, out = sys.argv[1:4]
drop = []
rest = sys.argv[4:]
while rest:
    if rest[0] == "--drop":
        drop.append(rest[1])
        rest = rest[2:]
    else:
        raise SystemExit("unknown arg " + rest[0])
c05 = json.load(open(src))
have = {e["key"] for e in c05["acceptedRegressions"]}
missing = [k for k in drop if k not in have]
assert not missing, missing
entries = [e for e in c05["acceptedRegressions"] if e["key"] not in drop]
for e in entries:
    assert e["class"] == "a", e["key"]
    assert e.get("reason") and e.get("evidence"), e["key"]
note = (
    "Class-a acceptances of the Phase C step 06 tip (branch phasec/06-tip: merge of phasec/06-svg, "
    "phasec/06-table-anon, phasec/06-col-breaks and phasec/06-ruby onto phasec/05-verify 1ae3508). "
    "Built by c06/scripts/build-accepted.py from c05/accepted.json (step 14-phase-c-05-tip, 13 "
    "entries), entries verbatim; no step-06 branch proposed a new class-a entry. "
    + (
        "Dropped because the test really passes on the merged build (measured in the pre-run): "
        + ", ".join(drop)
        + ". "
        if drop
        else ""
    )
    + "NOT entered: the 6 step-05 blockers (fixed by rendering in step 06, see c06/README.md) and "
    "the 15 flagged passes lost by the table-anon branch (reported by the gate, not gated; "
    "evidence in c06/README.md)."
)
doc = {"step": step, "note": note, "acceptedRegressions": entries}
with open(out, "w") as f:
    json.dump(doc, f, indent=2, ensure_ascii=False)
    f.write("\n")
print(len(entries), "entries ->", out)
