#!/usr/bin/env python3
"""Cross-host comparison of two run-all directories (A = macOS, B = Linux).

usage: xos-compare.py <runA> <runB> [--json out.json]

Every PDF outside wpt/ is classed vellora (file name without "chrome") or chrome, hashed (sha256)
and, when the bytes differ, described: size, page count, /Producer and /CreationDate, and the
font list (pdffonts). Prints one line per differing file and the per-class counts.
"""
import hashlib, json, os, subprocess, sys

def pdfs(root):
    out = {}
    for d, _, fs in os.walk(root):
        if os.path.relpath(d, root).split(os.sep)[0] == "wpt":
            continue
        for f in fs:
            if f.endswith(".pdf"):
                p = os.path.join(d, f)
                out[os.path.relpath(p, root)] = p
    return out

def sha(p):
    return hashlib.sha256(open(p, "rb").read()).hexdigest()

def info(p):
    r = {"size": os.path.getsize(p)}
    try:
        txt = subprocess.run(["pdfinfo", p], capture_output=True, text=True, timeout=30).stdout
        for line in txt.splitlines():
            k, _, v = line.partition(":")
            if k in ("Pages", "Producer", "Creator", "CreationDate"):
                r[k] = v.strip()
        fonts = subprocess.run(["pdffonts", p], capture_output=True, text=True, timeout=30).stdout
        r["fonts"] = sorted({l.split()[0].split("+")[-1] for l in fonts.splitlines()[2:] if l.strip()})
    except Exception as e:  # noqa: BLE001
        r["error"] = str(e)
    return r

a, b = pdfs(sys.argv[1]), pdfs(sys.argv[2])
res = {"onlyA": sorted(set(a) - set(b)), "onlyB": sorted(set(b) - set(a)), "classes": {}}
for k in sorted(set(a) & set(b)):
    cls = "chrome" if "chrome" in os.path.basename(k) else "vellora"
    c = res["classes"].setdefault(cls, {"identical": 0, "differ": []})
    if sha(a[k]) == sha(b[k]):
        c["identical"] += 1
    else:
        c["differ"].append({"file": k, "A": info(a[k]), "B": info(b[k])})
for cls, c in res["classes"].items():
    print(f"{cls}: identical {c['identical']} differ {len(c['differ'])}")
    for d in c["differ"]:
        A, B = d["A"], d["B"]
        same_fonts = A.get("fonts") == B.get("fonts")
        print(f"  differ {d['file']}: size {A['size']} -> {B['size']}, pages {A.get('Pages')} -> "
              f"{B.get('Pages')}, fonts {'same' if same_fonts else str(A.get('fonts')) + ' -> ' + str(B.get('fonts'))}")
print("onlyA", len(res["onlyA"]), "onlyB", len(res["onlyB"]))
if "--json" in sys.argv:
    json.dump(res, open(sys.argv[sys.argv.index("--json") + 1], "w"), indent=1)
