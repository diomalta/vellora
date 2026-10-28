"""Generate thead repetition / break-after probes (print mode, 5in x 3in page, 0.5in margins:
content box 384 x 192 CSS px)."""
import os
d = os.path.dirname(os.path.abspath(__file__))
def table(head_h, rows, row_h, css=""):
    body = "".join(f"<tr><td><div style='height:{row_h}px'>R{i}</div></td></tr>" for i in range(1, rows + 1))
    return f"""<!DOCTYPE html><html><head><style>
@page {{ size:5in 3in; margin:0.5in; }} body {{ margin:0 }} table {{ border-spacing:0 }} td {{ padding:0 }}
{css}</style></head><body><table><thead><tr><td><div style='height:{head_h}px;background:#ccc'>HEAD</div></td></tr></thead>
<tbody>{body}</tbody></table></body></html>"""
cases = {
    "h20": table(20, 12, 40),
    "h47": table(47, 12, 40),
    "h48": table(48, 12, 40),
    "h49": table(49, 12, 40),
    "h60": table(60, 12, 40),
    "h96": table(96, 12, 40),
    "h20-after": table(20, 3, 40, "thead { page-break-after: always }"),
    "h60-after": table(60, 3, 40, "thead { page-break-after: always }"),
}
for k, v in cases.items():
    open(os.path.join(d, f"thead-{k}.html"), "w").write(v)
print(" ".join(f"thead-{k}.html" for k in cases))
