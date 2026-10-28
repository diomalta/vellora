#!/usr/bin/env python3
"""Build c05/accepted.json for the c05 tip gated run.

usage: build-accepted.py <probe accepted.json> <float-rule accepted-proposed.json> <step> <out> [--drop KEY ...]

Takes the probe's 13 entries verbatim, appends the float-rule proposal's entry verbatim, drops
any key passed with --drop (an entry whose test really passes on the merged build: precedent
monolithic-overflow-014 at c04), sets the step id and writes a note. Order is preserved.
"""
import json, sys

probe_p, float_p, step, out = sys.argv[1:5]
drop = []
rest = sys.argv[5:]
while rest:
    if rest[0] == '--drop':
        drop.append(rest[1]); rest = rest[2:]
    else:
        raise SystemExit('unknown arg ' + rest[0])
probe = json.load(open(probe_p))
flt = json.load(open(float_p))
entries = [e for e in probe['acceptedRegressions'] if e['key'] not in drop]
keys = {e['key'] for e in entries}
for e in flt['acceptedRegressions']:
    assert e['key'] not in keys, e['key']
    entries.append(e)
for e in entries:
    assert e['class'] == 'a', e['key']
    assert e.get('reason') and e.get('evidence'), e['key']
missing = [k for k in drop if k not in {e['key'] for e in probe['acceptedRegressions']}]
assert not missing, missing
note = (
    'Class-a acceptances of the Phase C step 05 tip (branch phasec/05-tip: merge of phasec/05-probe, '
    'phasec/05-float-rule and phasec/05-multicol onto phasec/04-verify 3545ce4). Built by '
    'c05/scripts/build-accepted.py from c05/accepted-probe.json (phasec/05-probe bf092bb, committed there as c05/accepted.json) (13 entries: the 12 of '
    '13-phase-c-04 with the page-name-flex reason text corrected, plus hanging-punctuation-first-002) '
    'and c05/float-rule/accepted-proposed.json (float-nowrap-8, orchestrator decision (b)), entries '
    'verbatim. '
    + ('Dropped because the test really passes on the merged build (measured in the pre-run, '
       'precedent monolithic-overflow-014 at c04): ' + ', '.join(drop) + '. ' if drop else '')
    + 'NOT entered: ruby-003 (needs ruby layout; 054/055/058 now pass by rendering) and the css/css-break passes the multicol layout '
    'loses (Chrome passes each; their old passes are genuine by GATE-A3), see c05/README.md.'
)
doc = {'step': step, 'note': note, 'acceptedRegressions': entries}
with open(out, 'w') as f:
    json.dump(doc, f, indent=2, ensure_ascii=False)
    f.write('\n')
print(len(entries), 'entries ->', out)
