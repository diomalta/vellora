import sys
# Underline / overline / line-through at many font sizes and sub-px baseline offsets, Arial and serif.
out = sys.argv[1]
rows = []
for fam in ["Arial", "Times New Roman"]:
    for i, fs in enumerate([8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 20, 22, 24, 28, 32, 40, 48]):
        for deco in ["underline", "overline", "line-through"]:
            rows.append(f'<div style="font:{fs}px \'{fam}\';line-height:1.37;padding-top:{(i*0.37)%1:.2f}px;text-decoration:{deco}">H{fs} {deco[0]} {fam[0]}</div>')
html = """<!doctype html><html><head><style>@page{size:A4;margin:0}body{margin:0}</style></head><body>%s</body></html>""" % "\n".join(rows)
open(out, "w").write(html)
