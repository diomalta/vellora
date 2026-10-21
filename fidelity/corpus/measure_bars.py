"""Measure a rendered linear barcode against the fixture's own element list (renderer-independent).

Usage:
  fidelity/.venv/bin/python -I fidelity/corpus/measure_bars.py --png PAGE.png --dpi DPI --expect EXPECT.json

EXPECT.json: {
  "elements": [{"w_mm": float, "dark": bool}, ...],  # bar/space sequence, bar first
  "x0_mm": float, "y_center_mm": float, "height_mm": float,   # expected placement, page coords
  "cut_search_mm": [y0, y1] | null                    # optional: band holding a dashed cut line
}
The barcode is searched on the WHOLE page (a misplaced symbol is still measured): every 4th row is
scanned, dark runs are split into clusters at gaps >= 1.5 mm (both symbologies have quiet zones
>= 2.6 mm and inner spaces <= 1.1 mm), and the cluster whose bar count is closest to the expected
count wins. Prints JSON: measured start/length/height/centre, placement errors, bar-edge errors vs
expected, wide/narrow ratio, dashed cut-line y. All lengths in mm, page coordinates (top-left origin).
"""

import argparse
import json
import re
import sys

from PIL import Image

MM_PER_INCH = 25.4
GAP_MM = 1.5


DARK = bytes(1 if v < 128 else 0 for v in range(256))
RUN = re.compile(rb"\x01+")


def row_runs(buf, width, y):
    """Dark runs (x_start, x_end_exclusive) of one row, threshold 50% grey."""
    row = buf[y * width : (y + 1) * width].translate(DARK)
    return [(m.start(), m.end()) for m in RUN.finditer(row)]


def clusters(runs, gap_px):
    out = []
    cur = []
    for r in runs:
        if cur and r[0] - cur[-1][1] >= gap_px:
            out.append(cur)
            cur = []
        cur.append(r)
    if cur:
        out.append(cur)
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--png", required=True)
    ap.add_argument("--dpi", type=int, required=True)
    ap.add_argument("--expect", required=True)
    args = ap.parse_args()
    with open(args.expect, encoding="utf-8") as f:
        exp = json.load(f)
    img = Image.open(args.png).convert("L")
    width, height = img.size
    buf = img.tobytes()
    px_per_mm = args.dpi / MM_PER_INCH

    def mm(px):
        return round(px / px_per_mm, 4)

    expected_bars = []
    x = 0.0
    for e in exp["elements"]:
        if e["dark"]:
            expected_bars.append((x, x + e["w_mm"]))
        x += e["w_mm"]
    length_mm = x
    n_exp = len(expected_bars)
    gap_px = GAP_MM * px_per_mm
    out = {
        "png": args.png,
        "dpi": args.dpi,
        "expected": {
            "x0_mm": exp["x0_mm"],
            "y_center_mm": exp["y_center_mm"],
            "length_mm": round(length_mm, 4),
            "height_mm": exp["height_mm"],
            "bars": n_exp,
        },
    }

    def best_cluster(y):
        cands = [c for c in clusters(row_runs(buf, width, y), gap_px) if len(c) >= n_exp * 0.6]
        if not cands:
            return None
        return min(cands, key=lambda c: abs(len(c) - n_exp))

    hits = []
    for y in range(0, height, 4):
        c = best_cluster(y)
        if c is not None:
            hits.append((y, c[0][0], c[-1][1]))
    if not hits:
        out["found"] = False
        json.dump(out, sys.stdout, indent=1)
        sys.stdout.write("\n")
        return
    # Group sampled rows into bands of similar horizontal extent; keep the tallest band.
    bands = []
    for y, x0, x1 in hits:
        if bands and y - bands[-1]["y1"] <= 8 and abs(x0 - bands[-1]["x0"]) < gap_px:
            bands[-1]["y1"] = y
        else:
            bands.append({"y0": y, "y1": y, "x0": x0})
    band = max(bands, key=lambda b: b["y1"] - b["y0"])
    mid = (band["y0"] + band["y1"]) // 2
    runs = best_cluster(mid)
    # Refine the vertical extent at the first bar's column.
    col = runs[0][0] + max(1, (runs[0][1] - runs[0][0]) // 2)
    top = mid
    while top > 0 and buf[(top - 1) * width + col] < 128:
        top -= 1
    bottom = mid
    while bottom < height - 1 and buf[(bottom + 1) * width + col] < 128:
        bottom += 1
    first = runs[0][0]
    measured = [(mm(a - first), mm(b - first)) for a, b in runs]
    # Clear space either side of the symbol on the scan row (distance to the nearest other ink).
    row_all = row_runs(buf, width, mid)
    left_ink = [b for a, b in row_all if b <= first]
    right_ink = [a for a, b in row_all if a >= runs[-1][1]]
    quiet_left = mm(first - (max(left_ink) if left_ink else 0))
    quiet_right = mm((min(right_ink) if right_ink else width) - runs[-1][1])
    out["found"] = True
    out["measured"] = {
        "x0_mm": mm(first),
        "x1_mm": mm(runs[-1][1]),
        "length_mm": mm(runs[-1][1] - first),
        "top_mm": mm(top),
        "bottom_mm": mm(bottom + 1),
        "height_mm": mm(bottom + 1 - top),
        "y_center_mm": mm((top + bottom + 1) / 2),
        "bars": len(runs),
        "quiet_left_mm": quiet_left,
        "quiet_right_mm": quiet_right,
    }
    out["placement_error_mm"] = {
        "x0": round(out["measured"]["x0_mm"] - exp["x0_mm"], 4),
        "y_center": round(out["measured"]["y_center_mm"] - exp["y_center_mm"], 4),
        "length": round(out["measured"]["length_mm"] - length_mm, 4),
        "height": round(out["measured"]["height_mm"] - exp["height_mm"], 4),
    }
    if len(measured) == n_exp:
        errs = []
        for (ma, mb), (ea, eb) in zip(measured, expected_bars):
            errs.extend([abs(ma - ea), abs(mb - eb)])
        out["edge_error_mm"] = {"max": round(max(errs), 4), "mean": round(sum(errs) / len(errs), 4)}
    else:
        out["edge_error_mm"] = None
        out["structure"] = (
            f"bar count mismatch: measured {len(measured)} vs expected {n_exp} "
            "(merged or missing bars)"
        )
    widths = []
    for i, (a, b) in enumerate(runs):
        widths.append(b - a)
        if i + 1 < len(runs):
            widths.append(runs[i + 1][0] - b)
    lo, hi = min(widths), max(widths)
    cut = (lo + hi) / 2
    narrow = [w for w in widths if w <= cut]
    wide = [w for w in widths if w > cut]
    if narrow and wide:
        out["ratio"] = {
            "narrow_mean_mm": mm(sum(narrow) / len(narrow)),
            "wide_mean_mm": mm(sum(wide) / len(wide)),
            "wide_over_narrow": round((sum(wide) / len(wide)) / (sum(narrow) / len(narrow)), 3),
            "narrow_min_mm": mm(min(narrow)),
            "narrow_max_mm": mm(max(narrow)),
            "wide_min_mm": mm(min(wide)),
            "wide_max_mm": mm(max(wide)),
        }
    if exp.get("cut_search_mm"):
        # Dashed cut line: >= 50 dashes of near-identical length spanning >= 150 mm on one row.
        # Searched on the whole page (above the barcode) so a misplaced ficha is still found.
        def dashed(y):
            short = [s for s in row_runs(buf, width, y) if (s[1] - s[0]) < 3 * px_per_mm]
            if len(short) < 50:
                return 0
            lengths = sorted(s[1] - s[0] for s in short)
            med = lengths[len(lengths) // 2]
            dashes = [s for s in short if abs((s[1] - s[0]) - med) <= max(2, 0.3 * med)]
            span = dashes[-1][1] - dashes[0][0] if dashes else 0
            return len(dashes) if len(dashes) >= 50 and span >= 150 * px_per_mm else 0

        best = None
        for y in range(0, min(height, top)):
            n = dashed(y)
            if n and (best is None or n > best[1]):
                best = (y, n)
        out["cut_line_y_mm"] = mm(best[0]) if best else None
        if best:
            last = best[0]
            while last + 1 < top and dashed(last + 1):
                last += 1
            ficha_top = mm(last + 1)
            out["ficha_relative_mm"] = {
                "ficha_top": ficha_top,
                "barcode_centre_above_ficha_bottom": round(
                    ficha_top + 105 - out["measured"]["y_center_mm"], 4
                ),
                "barcode_start_from_ficha_left": round(out["measured"]["x0_mm"] - 5, 4),
                "note": "ficha top = first row below the dashed cut line; ficha bottom = top + 105 mm "
                "(declared .ficha height); ficha left = 5 mm page margin",
            }
    json.dump(out, sys.stdout, indent=1)
    sys.stdout.write("\n")


if __name__ == "__main__":
    main()
