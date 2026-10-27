"""Collect every *version*-ish string field across JSON outputs on both sides; print the union with per-side values."""
import json, os, sys, re, collections
def walk(root):
    for d, _, fs in os.walk(root):
        if 'raw-artifacts' in d or '/artifacts' in d: continue
        for f in fs:
            if f.endswith('.json') and f not in ('results.json', 'browser.json'):
                yield os.path.join(d, f)
KEY = re.compile(r'(version|Version)$|^(qpdf|pdftotext|pdftoppm|pdftocairo|pdfinfo|pdffonts|pdfimages|docker|node|rustc|cargo|puppeteerCore|pymupdf|pdfminer.six|zxing-cpp|pillow|python|id|imageId|recipeSha256)$')
def collect(root):
    vals = collections.defaultdict(set)
    for p in walk(root):
        try: j = json.load(open(p))
        except Exception: continue
        def rec(x, path):
            if isinstance(x, dict):
                for k, v in x.items():
                    if isinstance(v, (str, int, float)) and KEY.search(k):
                        if k == 'id' and not str(v).startswith('sha256:'): continue
                        vals[re.sub(r'\[\d+\]', '[]', path + '/' + k)].add(str(v))
                    else:
                        rec(v, path + '/' + k)
            elif isinstance(x, list):
                for i, v in enumerate(x): rec(v, path + '[]')
        rec(j, '')
    return vals
o = collect(sys.argv[1]); n = collect(sys.argv[2])
allv = collections.defaultdict(lambda: [set(), set()])
for k, v in o.items(): allv[k][0] |= v
for k, v in n.items(): allv[k][1] |= v
# collapse by key-name tail
tail = collections.defaultdict(lambda: [set(), set()])
for k, (a, b) in allv.items():
    t = k.split('/')[-1]
    ctx = '/'.join(k.split('/')[-3:])
    tail[ctx][0] |= a; tail[ctx][1] |= b
for k in sorted(tail):
    a, b = tail[k]
    flag = 'SAME' if a == b else 'DIFF'
    print(flag, k, '| old:', sorted(a)[:4], '| new:', sorted(b)[:4])
