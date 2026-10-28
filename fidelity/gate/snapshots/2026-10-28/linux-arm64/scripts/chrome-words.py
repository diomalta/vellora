#!/usr/bin/env python3
"""Chrome-vs-Chrome across hosts: word lists and word boxes of every chrome*.pdf pair.

usage: chrome-words.py <runA> <runB> [--json out.json]
For each pair: page count, word count, words whose text differs (in reading order), and the max
|dx|/|dy| (pt) of the word boxes when the word sequences are equal. Metadata (Creator UA string,
CreationDate) is ignored; bytes always differ because of it.
"""
import json, os, sys
import pymupdf

def chrome_pdfs(root):
    out = {}
    for d, _, fs in os.walk(root):
        if os.path.relpath(d, root).split(os.sep)[0] == "wpt":
            continue
        for f in fs:
            if f.endswith(".pdf") and "chrome" in f:
                out[os.path.relpath(os.path.join(d, f), root)] = os.path.join(d, f)
    return out

def words(p):
    doc = pymupdf.open(p)
    return doc.page_count, [(i, w[4], w[0], w[1], w[2], w[3]) for i, pg in enumerate(doc) for w in pg.get_text("words")]

a, b = chrome_pdfs(sys.argv[1]), chrome_pdfs(sys.argv[2])
rows = []
for k in sorted(set(a) & set(b)):
    pa, wa = words(a[k]); pb, wb = words(b[k])
    ta, tb = [(w[0], w[1]) for w in wa], [(w[0], w[1]) for w in wb]
    r = {"file": k, "pages": [pa, pb], "words": [len(wa), len(wb)], "textEqual": ta == tb}
    if ta == tb:
        r["maxDx"] = round(max([max(abs(x[2] - y[2]), abs(x[4] - y[4])) for x, y in zip(wa, wb)] or [0]), 3)
        r["maxDy"] = round(max([max(abs(x[3] - y[3]), abs(x[5] - y[5])) for x, y in zip(wa, wb)] or [0]), 3)
        r["moved"] = sum(1 for x, y in zip(wa, wb) if max(abs(x[j] - y[j]) for j in range(2, 6)) > 0.01)
    else:
        sa, sb = set(ta), set(tb)
        r["onlyA"] = [w[1] for w in ta if w not in sb][:12]
        r["onlyB"] = [w[1] for w in tb if w not in sa][:12]
    rows.append(r)
    print(json.dumps(r, ensure_ascii=False))
if "--json" in sys.argv:
    json.dump(rows, open(sys.argv[sys.argv.index("--json") + 1], "w"), indent=1, ensure_ascii=False)
