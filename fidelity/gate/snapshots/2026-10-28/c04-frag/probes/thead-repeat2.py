"""Second thead repetition probe set: another page height (content 480 px: 5in x 6in page,
0.5in margins), and a header whose band (row + border-spacing) crosses a quarter of the page
while the row alone does not."""
import os
d = os.path.dirname(os.path.abspath(__file__))
def table(page, head_h, rows, row_h, css=""):
    body = "".join(f"<tr><td><div style='height:{row_h}px'>R{i}</div></td></tr>" for i in range(1, rows + 1))
    return f"""<!DOCTYPE html><html><head><style>
@page {{ size:{page}; margin:0.5in; }} body {{ margin:0 }} table {{ border-spacing:0 }} td {{ padding:0 }}
{css}</style></head><body><table><thead><tr><td><div style='height:{head_h}px;background:#ccc'>HEAD</div></td></tr></thead>
<tbody>{body}</tbody></table></body></html>"""
cases = {
    "tall-h120": table("5in 6in", 120, 20, 40),
    "tall-h121": table("5in 6in", 121, 20, 40),
    "sp-h40": table("5in 3in", 40, 12, 40, "table { border-spacing: 0 10px }"),
    "sp-h36": table("5in 3in", 36, 12, 40, "table { border-spacing: 0 10px }"),
    "sp-h30": table("5in 3in", 30, 12, 40, "table { border-spacing: 0 10px }"),
}
for k, v in cases.items():
    open(os.path.join(d, f"thead-{k}.html"), "w").write(v)
print(" ".join(f"thead-{k}.html" for k in cases))
