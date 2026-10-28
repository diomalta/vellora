"""Lay every repro variant out with vellora-core's layout_dump example (N0, the source HTML) and
print the unrounded Blitz boxes of the [id] elements next to Chrome's.

  node chrome.mjs "<Chrome for Testing 155.0.8059.85>" > chrome.json   (also writes <variant>.html)
  cargo build --release -p vellora-core --example layout_dump
  python3 blitz.py <repo>/target/release/examples/layout_dump chrome.json <scratch dir>

The N0 dump runs vellora's computed-style corrections (a VELLORA_CORRECTIONS observer): at
9e06be6 that is only the collapsed-border compensation (td_extrato), so raw-blitz-vs-chrome.txt is
raw Blitz 0.3.0-beta.4 for every other variant; product-vs-chrome.txt is the same at the
LayoutUnit commit (snapping on)."""
import json
import os
import subprocess
import sys

here = os.path.dirname(os.path.abspath(__file__))
bin_, chrome_json, scratch = sys.argv[1], sys.argv[2], sys.argv[3]
os.makedirs(scratch, exist_ok=True)
chrome = json.load(open(chrome_json))
for name, cr in chrome.items():
    if name == "chrome":
        continue
    dump = os.path.join(scratch, f"{name}.json")
    subprocess.run([bin_, "--html", os.path.join(here, f"{name}.html"), "--out", dump,
                    "--no-html-normalize"], check=True, stdout=subprocess.DEVNULL)
    d = json.load(open(dump))
    ids = {n["id"]: n["id_attr"] for n in d["nodes"] if n.get("id_attr")}
    rows = {ids[b["id"]]: b for b in d["blitz_tree"] if b["id"] in ids}
    for i, c in cr.items():
        bz = rows.get(i)
        if bz is None:
            print(f"{name:24} {i:3} chrome y {c['y']:.6f} h {c['h']:.6f}  blitz -")
            continue
        print(f"{name:24} {i:3} chrome y {c['y']:10.6f} h {c['h']:10.6f} w {c['w']:10.6f} | "
              f"blitz y {bz['uy']:10.4f} h {bz['uh']:10.4f} w {bz['uw']:10.4f} | "
              f"dh {bz['uh'] - c['h']:+.4f}")
