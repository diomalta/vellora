"""break-after probes (print mode, 5in x 3in, 0.5in margins)."""
import os
d = os.path.dirname(os.path.abspath(__file__))
def doc(body, css=""):
    return f"""<!DOCTYPE html><html><head><style>@page {{ size:5in 3in; margin:0.5in; }} {css}</style></head><body>{body}</body></html>"""
cases = {
    "last": doc("<p>One</p><p style='break-after:page'>Two</p>"),
    "last-nested": doc("<div><p>One</p><p style='break-after:page'>Two</p></div>"),
    "empty-next": doc("<p style='break-after:page'>One</p><div></div>"),
    "empty-before": doc("<p>One</p><div style='break-before:page'></div>"),
    "propagate": doc("<section><p>First</p><p style='break-after:page'>Last child</p></section><p>Next</p>"),
    "wrapped": doc("<div><p>Alpha</p><p style='break-after:page'>Beta</p><p>Gamma</p></div>"),
    "margin": doc("<p style='break-after:page;margin-bottom:40px'>One</p><p style='margin-top:30px'>Two</p>"),
    "abspos-next": doc("<div style='position:relative'><p style='break-after:page'>One</p><div style='position:absolute;top:0;left:200px'>Abs</div><p>Two</p></div>"),
    "inline-block": doc("<p>One <span style='display:inline-block;break-after:page'>IB</span> Two</p><p>Three</p>"),
}
for k, v in cases.items():
    open(os.path.join(d, f"ba-{k}.html"), "w").write(v)
print(" ".join(f"ba-{k}.html" for k in cases))
