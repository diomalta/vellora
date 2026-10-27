"""Full deep diff of one JSON file pair with ignore keys. usage: deep.py OLD NEW ignorekey1,ignorekey2 [maxprint]"""
import json, sys, re, gzip, collections
def load(p):
    return json.load(gzip.open(p)) if p.endswith('.gz') else json.load(open(p))
ign = set(sys.argv[3].split(',')) if len(sys.argv) > 3 and sys.argv[3] else set()
mx = int(sys.argv[4]) if len(sys.argv) > 4 else 40
def norm(s):
    s = re.sub(r'(/Users/[^\s"\']*|/private/[^\s"\']*|/var/folders/[^\s"\']*)', '<path>', s)
    for a in ('10-tip', '10-repro'): s = s.replace(a, '10-X')
    for a in ('wf_419cd5d5-4b5-4', 'wf_d4c5e26a-90e-2'): s = s.replace(a, 'WT')
    return s
out = []
def d(a, b, p):
    if isinstance(a, dict) and isinstance(b, dict):
        for k in sorted(set(a) | set(b)):
            if k in ign: continue
            if k not in a or k not in b:
                out.append((p + '/' + k, 'missing-' + ('old' if k not in a else 'new'))); continue
            d(a[k], b[k], p + '/' + k)
    elif isinstance(a, list) and isinstance(b, list):
        if len(a) != len(b): out.append((p, 'len %d %d' % (len(a), len(b))))
        for i, (x, y) in enumerate(zip(a, b)): d(x, y, p + '[%d]' % i)
    elif isinstance(a, str) and isinstance(b, str):
        if norm(a) != norm(b): out.append((p, a[:250], b[:250]))
    elif a != b:
        out.append((p, a, b))
d(load(sys.argv[1]), load(sys.argv[2]), '')
print('diffs', len(out))
shape = collections.Counter(re.sub(r'\[\d+\]', '[]', x[0]) for x in out)
for k, v in shape.most_common(60): print('  %5d %s' % (v, k))
for x in out[:mx]: print('   ', json.dumps(x)[:500])
