"""Compare two run-all directories file by file.
usage: cmp.py OLD NEW OUTJSON
"""
import hashlib, json, os, re, sys, gzip

OLD, NEW, OUT = sys.argv[1], sys.argv[2], sys.argv[3]

def walk(root):
    out = {}
    for d, _, fs in os.walk(root):
        for f in fs:
            p = os.path.join(d, f)
            out[os.path.relpath(p, root)] = p
    return out

def sha(p):
    h = hashlib.sha256()
    with open(p, 'rb') as fh:
        for b in iter(lambda: fh.read(1 << 20), b''):
            h.update(b)
    return h.hexdigest()

VOLATILE = re.compile(r'(date|time|duration|elapsed|ms$|Ms$|^ms|seconds|startedAt|finishedAt|runId|started|finished|wall)', re.I)
PATHLIKE = re.compile(r'(/Users/[^\s"\']*|/private/[^\s"\']*|/var/folders/[^\s"\']*|/tmp/[^\s"\']*)')

def norm_str(s):
    s = PATHLIKE.sub('<path>', s).replace('10-tip', '10-X').replace('10-repro', '10-X').replace('wf_419cd5d5-4b5-4','WT').replace('wf_d4c5e26a-90e-2','WT').replace('6b648b83e2ccdb815b081936cd25b2d4d05a796f719abbc861c2108cb0dafe26','TOOLSID').replace('c405e06c653aa6de2e0c63fd6a87e1cd8e076f80e27086994f1b0a6156a63653','TOOLSID')
    s = re.sub(r'\d{8}T\d{6}Z', '<runid>', s)
    s = re.sub(r'\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z', '<iso>', s)
    return s

def diff(a, b, path, out, limit=400):
    if len(out) >= limit:
        return
    if isinstance(a, dict) and isinstance(b, dict):
        for k in sorted(set(a) | set(b)):
            if k not in a or k not in b:
                out.append((path + '/' + k, 'missing-old' if k not in a else 'missing-new', None))
                continue
            diff(a[k], b[k], path + '/' + str(k), out, limit)
    elif isinstance(a, list) and isinstance(b, list):
        if len(a) != len(b):
            out.append((path, 'len', [len(a), len(b)]))
        for i, (x, y) in enumerate(zip(a, b)):
            diff(x, y, path + '[' + str(i) + ']', out, limit)
    else:
        if isinstance(a, str) and isinstance(b, str):
            if norm_str(a) == norm_str(b):
                return
        if a != b:
            out.append((path, 'value', [a if not isinstance(a, str) else a[:300], b if not isinstance(b, str) else b[:300]]))

def volatile_path(p):
    last = re.split(r'[/\[]', p)[-1]
    return bool(VOLATILE.search(last))

def load(p):
    if p.endswith('.gz'):
        return json.load(gzip.open(p))
    return json.load(open(p))

o, n = walk(OLD), walk(NEW)
res = {'onlyOld': sorted(set(o) - set(n)), 'onlyNew': sorted(set(n) - set(o)), 'identical': [], 'different': {}}
for rel in sorted(set(o) & set(n)):
    so, sn = sha(o[rel]), sha(n[rel])
    if so == sn:
        res['identical'].append([rel, so])
        continue
    ent = {'old': so, 'new': sn}
    if rel.endswith('.json') or rel.endswith('.json.gz'):
        try:
            d = []
            diff(load(o[rel]), load(n[rel]), '', d)
            sub = [x for x in d if not volatile_path(x[0])]
            ent['jsonDiffs'] = len(d)
            ent['nonVolatileDiffs'] = len(sub)
            ent['sample'] = sub[:60]
        except Exception as e:
            ent['err'] = str(e)
    res['different'][rel] = ent
json.dump(res, open(OUT, 'w'), indent=1)
print('onlyOld', len(res['onlyOld']), 'onlyNew', len(res['onlyNew']), 'identical', len(res['identical']), 'different', len(res['different']))
pdfs = [k for k in set(o) & set(n) if k.endswith('.pdf')]
print('pdf common', len(pdfs), 'pdf different', sorted(k for k in res['different'] if k.endswith('.pdf')))
for k, v in res['different'].items():
    if not k.endswith('.pdf'):
        print(k, v.get('jsonDiffs'), v.get('nonVolatileDiffs'), v.get('err', ''))
