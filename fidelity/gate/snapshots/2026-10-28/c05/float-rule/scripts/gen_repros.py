"""Write the float-rule repros (Phase C step 5) into ../repro/."""
import os

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "repro")
os.makedirs(OUT, exist_ok=True)
HEAD = """<!doctype html><style>
body{margin:8px} .c{width:%s;white-space:%s;font-family:monospace;font-size:16px;line-height:20px}
.f{float:%s;width:%s;height:5ch;background:blue;%s}
.g{float:right;width:3ch;height:3ch;background:green}
</style>
<div class="c" id="c">%s</div>
"""
CASES = {
    "n8": ("10ch", "nowrap", "right", "5ch", "", "\n  Some <span class=f id=f></span>\n  text that overflows my parent.\n"),
    "n7": ("10ch", "nowrap", "right", "5ch", "", "S<span class=f id=f></span><span>ome</span> text that overflows my parent."),
    "n2": ("10ch", "nowrap", "right", "5ch", "", "\n  Some text that\n  <span class=f id=f></span>\n  overflows my parent.\n"),
    "n1": ("10ch", "nowrap", "right", "5ch", "", "\n  Some text that overflows my parent.\n  <span class=f id=f></span>\n"),
    "wide-right": ("30ch", "nowrap", "right", "5ch", "", "Hello world <span class=f id=f></span>and more text that overflows the box by far"),
    "wide-right-nosp": ("30ch", "nowrap", "right", "5ch", "", "Hello world<span class=f id=f></span> and more text that overflows the box by far"),
    "fit-sp": ("10ch", "nowrap", "right", "6ch", "", "Some <span class=f id=f></span>text after"),
    "fit-nosp": ("10ch", "nowrap", "right", "6ch", "", "Some<span class=f id=f></span> text after"),
    "over1": ("10ch", "nowrap", "right", "6ch", "", "Somex<span class=f id=f></span> text after"),
    "left-fit": ("20ch", "nowrap", "left", "5ch", "", "Some <span class=f id=f></span>text that overflows my parent."),
    "left-over": ("10ch", "nowrap", "left", "5ch", "", "Some text <span class=f id=f></span>that overflows my parent."),
    "margin": ("10ch", "nowrap", "right", "4ch", "margin-left:2ch", "Some <span class=f id=f></span>text after"),
    "margin-over": ("10ch", "nowrap", "right", "4ch", "margin-left:3ch", "Somex<span class=f id=f></span> text after"),
    "pre-fit": ("10ch", "pre", "right", "5ch", "", "Some <span class=f id=f></span>text that overflows"),
    "pre-over": ("10ch", "pre", "right", "5ch", "", "Some te<span class=f id=f></span>xt that overflows"),
    "two-floats": ("10ch", "nowrap", "right", "3ch", "", "Ab<span class=g id=g></span>Cd <span class=f id=f></span>more text after"),
    "short-fits": ("20ch", "nowrap", "right", "5ch", "", "Hello <span class=f id=f></span>world"),
    "pre-sp6": ("10ch", "pre", "right", "6ch", "", "Some <span class=f id=f></span>text after"),
    "nbsp6": ("10ch", "nowrap", "right", "6ch", "", "Some&nbsp;<span class=f id=f></span>text after"),
    "wide-first": ("10ch", "nowrap", "right", "12ch", "", "<span class=f id=f></span>Some text after"),
    "left-fit10": ("10ch", "nowrap", "left", "5ch", "", "Some <span class=f id=f></span>text that overflows my parent."),
    "end-sp6": ("10ch", "nowrap", "right", "6ch", "", "Some <span class=f id=f></span>"),
    "end-sp6-b": ("10ch", "nowrap", "right", "6ch", "", "Some <b>x</b> <span class=f id=f></span>"),
    "second-line": ("10ch", "nowrap", "right", "5ch", "", "Line one<br>Ab <span class=f id=f></span>cdefghijklmnop"),
}
for name, (w, ws, side, fw, extra, body) in CASES.items():
    with open(os.path.join(OUT, name + ".html"), "w") as fh:
        fh.write(HEAD % (w, ws, side, fw, extra, body))
print(len(CASES), "repros ->", os.path.abspath(OUT))
