"""Compare WPT product outcomes per test. usage: wptcmp.py OLD NEW"""
import json, sys, collections
def load(p):
    s = json.load(open(p))
    return s, {(t['test'], t.get('mode')): t for t in s['tests']}
so, o = load(sys.argv[1])
sn, n = load(sys.argv[2])
print('tests old', len(o), 'new', len(n), 'onlyOld', len(set(o) - set(n)), 'onlyNew', len(set(n) - set(o)))
diffs = []
detail = 0
for k in sorted(set(o) & set(n)):
    a, b = o[k], n[k]
    if a.get('outcome') != b.get('outcome'):
        diffs.append((k, a.get('outcome'), b.get('outcome')))
    else:
        ca = json.dumps(a.get('cause'), sort_keys=True); cb = json.dumps(b.get('cause'), sort_keys=True)
        if ca != cb:
            detail += 1
            if detail <= 10:
                print('cause differs', k, ca[:200], cb[:200])
print('product outcome diffs', len(diffs))
for d in diffs[:100]:
    print(' ', d)
print('cause-detail diffs with equal outcome', detail)
print('old outcome counts', collections.Counter(t.get('outcome') for t in o.values()))
print('new outcome counts', collections.Counter(t.get('outcome') for t in n.values()))
co = collections.Counter((t.get('chrome') or {}).get('outcome') for t in o.values())
cn = collections.Counter((t.get('chrome') or {}).get('outcome') for t in n.values())
print('chrome old', co, 'new', cn)
print('chrome reused', sn.get('chrome', {}).get('reusedRunId'), sn.get('chrome', {}).get('browserVersion'))
print('raw enabled old', (so.get('raw') or {}).get('enabled'), 'new', (sn.get('raw') or {}).get('enabled'))
