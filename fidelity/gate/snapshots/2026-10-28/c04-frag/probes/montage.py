"""montage.py <dir> <name>: rows vellora / chrome, pages side by side -> <dir>/<name>.montage.png;
prints per-page differing pixel counts (channel diff > 16)."""
import sys, glob, os
from PIL import Image, ImageChops
d, name = sys.argv[1], sys.argv[2]
def pages(kind):
    fs = sorted(glob.glob(os.path.join(d, f"{name}.{kind}-*.png")), key=lambda f: int(f.rsplit('-', 1)[1][:-4]))
    return [Image.open(f).convert("RGB") for f in fs]
v, c = pages("vellora"), pages("chrome")
n = max(len(v), len(c))
w = max(i.width for i in v + c); h = max(i.height for i in v + c)
out = Image.new("RGB", (n * (w + 6), 2 * (h + 6)), (80, 80, 80))
for row, imgs in enumerate([v, c]):
    for i, im in enumerate(imgs):
        out.paste(im, (i * (w + 6), row * (h + 6)))
out.save(os.path.join(d, f"{name}.montage.png"))
for i in range(n):
    if i < len(v) and i < len(c) and v[i].size == c[i].size:
        diff = ImageChops.difference(v[i], c[i]).convert("L").point(lambda p: 255 if p > 16 else 0)
        print(f"page {i+1}: diff px {sum(1 for p in diff.getdata() if p)} bbox {diff.getbbox()}")
    else:
        print(f"page {i+1}: only one side")
