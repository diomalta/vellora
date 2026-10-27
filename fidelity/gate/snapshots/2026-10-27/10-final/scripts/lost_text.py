"""Whole-document word multisets of vellora's PDF vs Chrome's PDF for one fixture (lost-text check).

Usage (repo root): fidelity/.venv/bin/python -I <this script> <repo root> <run dir> <fixture> [word ...]

Runs the pdf-probe word extractor (fidelity/oracles/py/words.py: PyMuPDF character origins, page
words clipped to the page, plus `offPage` = unclipped words whose origin is outside the page) on
<run>/layout-diff/<fixture>/run-all/{vellora,chrome}.pdf (the PDFs pdf-probe v2 pairs) and on
<run>/corpus/<fixture>/{vellora,chrome}.pdf, and prints per PDF pair: page counts, total words,
every word Chrome draws more often than vellora over the WHOLE document (any page), vellora's
off-page words, and the counts of the named words. A word pdf-probe reports unpaired on one Chrome
page that vellora still draws on the page somewhere in the document is displaced, not lost.
"""

import collections
import json
import subprocess
import sys


def words(repo, python, path):
    out = subprocess.run(
        [python, "-I", f"{repo}/fidelity/oracles/py/words.py", path],
        check=True,
        capture_output=True,
        text=True,
    ).stdout
    doc = json.loads(out)
    on, off = collections.Counter(), collections.Counter()
    for page in doc["pages"]:
        on.update(w["text"] for w in page["words"])
        off.update(w["text"] for w in page["offPage"])
    return len(doc["pages"]), on, off


def main():
    repo, run, fixture, named = sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4:]
    out = {}
    for label, base in (
        ("layout-diff/run-all", f"{run}/layout-diff/{fixture}/run-all"),
        ("corpus", f"{run}/corpus/{fixture}"),
    ):
        vp, von, voff = words(repo, sys.executable, f"{base}/vellora.pdf")
        cp, con, _ = words(repo, sys.executable, f"{base}/chrome.pdf")
        missing = {w: con[w] - von[w] for w in con if con[w] > von[w]}
        out[label] = {
            "pages": {"vellora": vp, "chrome": cp},
            "words": {"vellora": sum(von.values()), "chrome": sum(con.values())},
            "chromeMoreOftenThanVellora": dict(sorted(missing.items())),
            "velloraOffPage": dict(sorted(voff.items())),
            "named": {w: {"vellora": von[w], "chrome": con[w]} for w in named},
        }
    print(json.dumps(out, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
