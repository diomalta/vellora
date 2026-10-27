"""Re-derive sampled pdf-probe dx/dy from the PDFs with PyMuPDF rawdict (first-glyph pen origin,
baseline), independently of words.py: find, on the recorded page, a glyph sequence equal to the
word text whose first-glyph origin is the one pdf-probe recorded, in both PDFs."""
import json
import sys

import pymupdf

run, sample = sys.argv[1], sys.argv[2]
docs = {}


def glyph_words(path, pno):
    key = (path, pno)
    if key in docs:
        return docs[key]
    page = pymupdf.open(path)[pno - 1]
    words = []
    for b in page.get_text("rawdict", flags=0)["blocks"]:
        for line in b.get("lines", []):
            for s in line["spans"]:
                cur = []
                for c in s["chars"]:
                    if c["c"].isspace():
                        if cur:
                            words.append(cur)
                        cur = []
                    else:
                        cur.append(c)
                if cur:
                    words.append(cur)
    out = [("".join(c["c"] for c in w), w[0]["origin"]) for w in words]
    docs[key] = out
    return out


bad = 0
n = 0
for line in open(sample):
    s = json.loads(line)
    n += 1
    d = f"{run}/layout-diff/{s['fixture']}/run-all"
    probe = json.load(open(f"{d}/pdf-probe.json"))
    pair = next(p for p in probe["pairs"] if p["k"] == s["k"])
    found = {}
    for side, pdf in (("vellora", "vellora.pdf"), ("chrome", "chrome.pdf")):
        rec = pair[side]
        cands = [o for t, o in glyph_words(f"{d}/{pdf}", rec["page"]) if t.startswith(s["k"].split("|")[1].rsplit("#", 1)[0])]
        best = min(cands, key=lambda o: abs(o[0] - rec["x"]) + abs(o[1] - rec["y"]), default=None)
        found[side] = best
    v, c = found["vellora"], found["chrome"]
    if v is None or c is None:
        print("NOT FOUND", s["key"], v, c)
        bad += 1
        continue
    d_ = (v[0] - c[0]) if s["axis"] == "dx" else (v[1] - c[1])
    ok = abs(round(d_, 2) - s["measured"]) <= 0.011
    gap = max(abs(v[0] - pair["vellora"]["x"]), abs(v[1] - pair["vellora"]["y"]), abs(c[0] - pair["chrome"]["x"]), abs(c[1] - pair["chrome"]["y"]))
    if not ok or gap > 0.01:
        bad += 1
    print("OK " if ok and gap <= 0.01 else "BAD", s["entry"], s["key"], "pdf", round(d_, 3), "ledger", s["measured"], "originGap", round(gap, 4))
print("sampled", n, "bad", bad)
