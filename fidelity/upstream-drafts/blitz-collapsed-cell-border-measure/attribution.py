# Per-table attribution of the raw-Blitz (layout-diff N0, unrounded) vertical drift of a fixture.
#
#   python3 attribution.py <run copy>/layout-diff <fixture> [<fixture> ...]
#
# For every <table> box: Chrome y/h, N0 dy/dh, number of rows, the table's border-collapse (read
# from the fixture's vellora-dump-source.json Blitz tree is not available, so the column is the
# per-row dh), and the sum of table dh against the dy of the last box of the flow. Prints JSON.
import json
import os
import re
import sys

root, fixtures = sys.argv[1], sys.argv[2:]
out = {}
for fx in fixtures:
    d = json.load(open(os.path.join(root, fx, "run-all", "diff.json")))
    boxes = [b for b in d["boxes"] if (b["layers"].get("N0u") or b["layers"].get("N0"))]
    tables = []
    for b in boxes:
        if not re.search(r"table(:nth-child\(\d+\))?$", b["path"]):
            continue
        rows = {
            re.sub(r">td.*|>th.*", "", c["path"])
            for c in boxes
            if c["path"].startswith(b["path"] + ">") and re.search(r">tr(:nth-child\(\d+\))?$", re.sub(r">t[dh].*", "", c["path"]))
        }
        n0 = b["layers"].get("N0u") or b["layers"]["N0"]
        tables.append(
            {
                "path": b["path"],
                "chrome_y": round(b["chrome"]["y"], 2),
                "chrome_h": round(b["chrome"]["h"], 2),
                "n0_dy": round(n0["dy"], 2),
                "n0_dh": round(n0["dh"], 2),
                "rows": len(rows),
                "n0_dh_per_row": round(n0["dh"] / len(rows), 2) if rows else None,
            }
        )
    # Only top-level-ish tables (not nested in another listed table) sum into the flow.
    top = [t for t in tables if not any(t["path"].startswith(o["path"] + ">") for o in tables)]
    last = max(boxes, key=lambda b: b["chrome"]["y"] + b["chrome"]["h"] * 0)
    ln0 = last["layers"].get("N0u") or last["layers"]["N0"]
    out[fx] = {
        "tables": tables,
        "sum_top_level_table_n0_dh": round(sum(t["n0_dh"] for t in top), 2),
        "last_box": {"path": last["path"], "chrome_y": round(last["chrome"]["y"], 2), "n0_dy": round(ln0["dy"], 2)},
        "body_n0_dh": next(
            (round((b["layers"].get("N0u") or b["layers"]["N0"])["dh"], 2) for b in boxes if b["path"] == "html>body:nth-child(2)"),
            None,
        ),
    }
print(json.dumps(out, indent=1))
