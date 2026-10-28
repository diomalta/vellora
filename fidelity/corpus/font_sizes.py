"""Font-size / font-family oracle for the corpus (pdfminer.six, independent of the renderer).

Usage:
  fidelity/.venv/bin/python -I fidelity/corpus/font_sizes.py --pdf FILE.pdf --rules RULES.json \
      [--html TEMPLATED.html]

RULES.json:
  {"page": 1,
   "rules": [{"id", "text", "count"?, "judge"?, "min_pt"?, "max_pt"?, "bold"?, "pos"?, "region"?,
              "whole_line"?}],
   "families": [str, ...] | null,
   "categories": [{"id", "moc", "min_pt", "max_pt"?, "bold"?, "caps"?}] | null,   (needs --html)
   "floor_pt": float | null}

Text is matched on pdfminer text boxes (lines of one box are joined, so wrapped text matches),
whitespace-insensitive, NFKC-normalized, and only at word boundaries ("0,00" does not match inside
"10,00"). Lengths are mm from the page's top-left corner.

rules (anchors): case-sensitive. EVERY occurrence on `page` is found; the rule fails unless exactly
  `count` (default 1) occurrences qualify, so a deleted string cannot silently re-anchor to another
  line that happens to contain it. `region` {x_min_mm, x_max_mm, top_min_mm, top_max_mm} keeps only
  occurrences whose glyph box lies inside it; `whole_line` keeps only occurrences that are an entire
  text line. Sizes / bold / `pos` are judged on all qualifying occurrences (`judge: "last"`: only
  the last one in reading order); `boxes` lists all of them in reading order (top, then x) for the
  reference comparison.
categories: every text node of the templated HTML inside an element carrying data-moc="<moc>"
  (inherited by descendants, nearest wins; <br> splits a node) is a segment of that category.
  Segments are located case-insensitively (CSS text-transform changes case) on ALL pages, longest
  first, each glyph attributed at most once; a segment that cannot be located fails its category.
  The category is judged on the minimum size over all attributed glyphs (and bold / caps / max).
floor_pt: every glyph on every page must be >= floor_pt; `coverage` reports glyphs that no category
  claimed (only meaningful with categories).
"""

import argparse
import importlib.metadata
import json
import sys
import unicodedata
from html.parser import HTMLParser

from pdfminer.high_level import extract_pages
from pdfminer.layout import LTAnno, LTChar, LTTextBox, LTTextLine

MM_PER_PT = 25.4 / 72
TOL_PT = 0.05
VOID = {"area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "source", "wbr"}


def norm(s, fold):
    s = unicodedata.normalize("NFKC", s)
    s = s.casefold() if fold else s
    return "".join(ch for ch in s if not ch.isspace())


def walk_chars(item):
    if isinstance(item, LTChar):
        yield item
        return
    try:
        children = list(item)
    except TypeError:
        return
    for child in children:
        yield from walk_chars(child)


class Page:
    """Glyphs of one page plus one searchable stream per text box."""

    def __init__(self, number, layout):
        self.number = number
        self.height = layout.height
        self.chars = []  # every LTChar on the page, including any outside a text box
        self.streams = []
        seen = set()
        for box in layout:
            if not isinstance(box, LTTextBox):
                continue
            stream = {"cs": [], "ci": [], "word": [], "line": []}
            word = 0
            for line_no, line in enumerate(l for l in box if isinstance(l, LTTextLine)):
                word += 1
                for item in line:
                    text = item.get_text()
                    if isinstance(item, LTAnno) or not text.strip():
                        word += 1
                        continue
                    if not isinstance(item, LTChar):
                        continue
                    idx = len(self.chars)
                    self.chars.append(item)
                    seen.add(id(item))
                    for ch in text:
                        stream["cs"].append(ch)
                        stream["ci"].append(idx)
                        stream["word"].append(word)
                        stream["line"].append(line_no)
            if stream["cs"]:
                self.streams.append(stream)
        for c in walk_chars(layout):
            if id(c) not in seen and c.get_text().strip():
                self.chars.append(c)  # glyph outside any text box: never matched, still floored

    def prepare(self, fold):
        """Normalized search string per stream with a map back to stream positions."""
        for s in self.streams:
            text, pos = [], []
            for i, ch in enumerate(s["cs"]):
                for n in norm(ch, fold):
                    text.append(n)
                    pos.append(i)
            s["n" + ("f" if fold else "c")] = ("".join(text), pos)

    def find(self, target, fold, used=None, bounded=True):
        """Occurrences (word-bounded unless bounded=False) of a normalized target, non-overlapping."""
        out = []
        key = "n" + ("f" if fold else "c")
        for s in self.streams:
            text, pos = s[key]
            start = 0
            while True:
                i = text.find(target, start)
                if i < 0:
                    break
                j = i + len(target)
                a, b = pos[i], pos[j - 1]
                left_ok = i == 0 or s["word"][pos[i - 1]] != s["word"][a]
                right_ok = j == len(text) or s["word"][pos[j]] != s["word"][b]
                glyphs = sorted(set(s["ci"][a : b + 1]))
                free = used is None or not any(g in used for g in glyphs)
                if (not bounded or (left_ok and right_ok)) and free:
                    lines = {s["line"][k] for k in range(a, b + 1)}
                    whole = (
                        len(lines) == 1
                        and all(s["line"][k] != s["line"][a] for k in range(0, a))
                        and all(s["line"][k] != s["line"][a] for k in range(b + 1, len(s["cs"])))
                    )
                    out.append({"glyphs": glyphs, "whole_line": whole})
                    start = j
                else:
                    start = i + 1
        return out

    def box(self, glyphs):
        cs = [self.chars[g] for g in glyphs]
        return {
            "x_mm": round(min(c.x0 for c in cs) * MM_PER_PT, 2),
            "x1_mm": round(max(c.x1 for c in cs) * MM_PER_PT, 2),
            "top_mm": round((self.height - max(c.y1 for c in cs)) * MM_PER_PT, 2),
        }


def describe(chars):
    return {
        "sizes_pt": sorted({round(c.size, 2) for c in chars}),
        "fonts": sorted({c.fontname for c in chars}),
    }


def in_region(box, region):
    return (
        box["x_mm"] >= region.get("x_min_mm", -1e9)
        and box["x1_mm"] <= region.get("x_max_mm", 1e9)
        and box["top_mm"] >= region.get("top_min_mm", -1e9)
        and box["top_mm"] <= region.get("top_max_mm", 1e9)
    )


def size_ok(sizes, rule):
    ok = min(sizes) + TOL_PT >= rule.get("min_pt", 0)
    if "max_pt" in rule:
        ok = ok and max(sizes) - TOL_PT <= rule["max_pt"]
    return ok


def eval_anchor(rule, page):
    target = norm(rule["text"], fold=False)
    hits = []
    for occ in page.find(target, fold=False) if target else []:
        box = page.box(occ["glyphs"])
        if rule.get("whole_line") and not occ["whole_line"]:
            continue
        if "region" in rule and not in_region(box, rule["region"]):
            continue
        hits.append({"glyphs": occ["glyphs"], "box": box})
    hits.sort(key=lambda h: (h["box"]["top_mm"], h["box"]["x_mm"]))
    want = rule.get("count", 1)
    entry = {**rule, "found": len(hits) > 0, "occurrences": len(hits), "expected": want}
    if not hits:
        entry["ok"] = False
        entry["reason"] = "not found" + (" in region" if "region" in rule else "")
        return entry
    # judge "last": sizes / bold / pos are judged on the last occurrence in reading order only
    # (e.g. the Ficha de Compensação copy of a string the recibo above repeats).
    judged = hits[-1:] if rule.get("judge") == "last" else hits
    chars = [page.chars[g] for h in judged for g in h["glyphs"]]
    entry.update(describe(chars))
    entry["box"] = judged[0]["box"]
    entry["boxes"] = [h["box"] for h in hits]
    ok = len(hits) == want and size_ok(entry["sizes_pt"], rule)
    if len(hits) != want:
        entry["reason"] = f"{len(hits)} occurrences (expected {want}): ambiguous or missing anchor"
    if rule.get("bold") is True:
        ok = ok and all("bold" in f.lower() for f in entry["fonts"])
    if "pos" in rule:
        dx = entry["box"]["x_mm"] - rule["pos"]["x_mm"]
        dy = entry["box"]["top_mm"] - rule["pos"]["top_mm"]
        entry["pos_error_mm"] = {"dx": round(dx, 2), "dy": round(dy, 2)}
        ok = ok and abs(dx) <= rule["pos"]["tol_mm"] and abs(dy) <= rule["pos"]["tol_mm"]
    entry["ok"] = ok
    return entry


class Segments(HTMLParser):
    """(text, moc) for every non-blank text node of <body> under an element with data-moc."""

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.stack = []
        self.in_body = False
        self.out = []
        self.untagged = []

    def handle_starttag(self, tag, attrs):
        if tag == "body":
            self.in_body = True
        if tag == "br":
            return
        if tag in VOID:
            return
        moc = dict(attrs).get("data-moc")
        parent = self.stack[-1][1] if self.stack else None
        self.stack.append((tag, moc or parent))

    def handle_endtag(self, tag):
        for i in range(len(self.stack) - 1, -1, -1):
            if self.stack[i][0] == tag:
                del self.stack[i:]
                break

    def handle_data(self, data):
        if not self.in_body or any(t in ("script", "style") for t, _ in self.stack):
            return
        if not data.strip():
            return
        moc = self.stack[-1][1] if self.stack else None
        (self.out if moc else self.untagged).append((data.strip(), moc))


def eval_categories(spec, pages, html_path):
    parser = Segments()
    with open(html_path, encoding="utf-8") as f:
        parser.feed(f.read())
    cats = {c["moc"]: c for c in spec["categories"]}
    by_key = {}
    for text, moc in parser.out:
        key = norm(text, fold=True)
        if key:
            by_key.setdefault(key, {"text": text, "mocs": []})["mocs"].append(moc)
    used = {p.number: set() for p in pages}
    glyphs = {moc: [] for moc in cats}  # moc -> [(page, glyph index, segment text)]
    located = {moc: 0 for moc in cats}
    merged = {moc: 0 for moc in cats}
    expected = {moc: 0 for moc in cats}
    unknown = sorted({m for v in by_key.values() for m in v["mocs"] if m not in cats})
    pending = {}
    for key, item in by_key.items():
        pending[key] = sorted((m for m in item["mocs"] if m in cats), key=lambda m: cats[m]["min_pt"])
        for m in pending[key]:
            expected[m] += 1
    # Pass 1 word-bounded, pass 2 (segments still missing) unbounded: a segment whose glyphs abut
    # a neighbour with no word gap is still located, and counted as `merged`. Longest text first and
    # each glyph claimed once, so "SP" cannot claim the glyphs of "SAO PAULO - SP".
    for bounded in (True, False):
        for key in sorted(by_key, key=len, reverse=True):
            need = pending[key]
            if not need:
                continue
            occs = []
            for p in pages:
                for occ in p.find(key, fold=True, used=used[p.number], bounded=bounded):
                    size = min(p.chars[g].size for g in occ["glyphs"])
                    occs.append((size, p, occ["glyphs"]))
            # More occurrences than instances (the text also sits inside another string that could
            # not be located): keep the most favourable (largest) ones; the rest stay unattributed
            # and fail `coverage`, so a sub-minimum glyph is never silently dropped.
            occs.sort(key=lambda o: -o[0])
            chosen = sorted(occs[: len(need)], key=lambda o: o[0])
            for (size, p, gl), moc in zip(chosen, need):
                used[p.number].update(gl)
                located[moc] += 1
                merged[moc] += 0 if bounded else 1
                glyphs[moc].extend((p, g, by_key[key]["text"]) for g in gl)
            pending[key] = need[len(chosen) :]
    missing = {moc: [] for moc in cats}
    for key, rest in pending.items():
        for moc in rest:
            missing[moc].append(by_key[key]["text"])
    results = []
    for moc, cat in cats.items():
        entry = {**cat, "segments_expected": expected[moc], "segments_located": located[moc]}
        if merged[moc]:
            entry["segments_merged"] = merged[moc]
        if missing[moc]:
            entry["missing"] = missing[moc][:5]
        chars = [(p.chars[g], text) for p, g, text in glyphs[moc]]
        if not chars:
            entry["ok"] = False
            entry["reason"] = "no glyph attributed"
            results.append(entry)
            continue
        entry.update(describe([c for c, _ in chars]))
        smallest = min(chars, key=lambda x: x[0].size)
        entry["smallest"] = {"pt": round(smallest[0].size, 2), "segment": smallest[1][:60]}
        ok = expected[moc] > 0 and located[moc] == expected[moc] and size_ok(entry["sizes_pt"], cat)
        if cat.get("bold") is True:
            regular = [t for c, t in chars if "bold" not in c.fontname.lower()]
            if regular:
                entry["not_bold"] = regular[0][:60]
                ok = False
        if cat.get("caps") is True:
            lower = [t for c, t in chars if c.get_text() != c.get_text().upper()]
            if lower:
                entry["not_caps"] = lower[0][:60]
                ok = False
        entry["ok"] = ok
        results.append(entry)
    total = sum(len(p.chars) for p in pages)
    claimed = sum(len(u) for u in used.values())
    sample = []
    for p in pages:
        for i, c in enumerate(p.chars):
            if i not in used[p.number] and len(sample) < 40:
                sample.append(c.get_text())
    coverage = {
        "glyphs": total,
        "unattributed": total - claimed,
        "unattributed_sample": "".join(sample),
        "untagged_html_text": [t[:60] for t, _ in parser.untagged[:5]],
        "unknown_moc": unknown,
    }
    coverage["ok"] = total > 0 and total == claimed and not parser.untagged and not unknown
    return results, coverage


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--pdf", required=True)
    ap.add_argument("--rules", required=True)
    ap.add_argument("--html")
    args = ap.parse_args()
    with open(args.rules, encoding="utf-8") as f:
        spec = json.load(f)
    pages = [Page(i, layout) for i, layout in enumerate(extract_pages(args.pdf), start=1)]
    for p in pages:
        p.prepare(fold=False)
        p.prepare(fold=True)
    page_no = spec.get("page", 1)
    out = {
        "tool": "pdfminer.six",
        "tool_version": importlib.metadata.version("pdfminer.six"),
        "pdf": args.pdf,
        "page": page_no,
        "pages": len(pages),
        "rules": [],
    }
    by_no = {p.number: p for p in pages}
    for rule in spec.get("rules", []):
        page = by_no.get(rule.get("page", page_no))
        if page is None:
            out["rules"].append({**rule, "found": False, "ok": False, "reason": "page missing"})
            continue
        out["rules"].append(eval_anchor(rule, page))
    families = spec.get("families")
    if families:
        fonts = sorted({c.fontname for p in pages for c in p.chars})
        bad = [f for f in fonts if not any(fam.lower() in f.lower() for fam in families)]
        out["families"] = {"allowed": families, "seen": fonts, "violations": bad, "ok": not bad}
    if spec.get("categories"):
        if not args.html:
            raise SystemExit("categories need --html (the templated HTML that carries data-moc)")
        out["categories"], out["coverage"] = eval_categories(spec, pages, args.html)
    all_chars = [(p, c) for p in pages for c in p.chars]
    if all_chars:
        p, c = min(all_chars, key=lambda x: x[1].size)
        out["min_glyph"] = {"pt": round(c.size, 2), "page": p.number, "char": c.get_text()}
    out["min_glyph_pt"] = out["min_glyph"]["pt"] if all_chars else 0
    if spec.get("floor_pt") is not None:
        out["floor"] = {
            "floor_pt": spec["floor_pt"],
            "min_pt": out["min_glyph_pt"],
            "ok": bool(all_chars) and out["min_glyph_pt"] + TOL_PT >= spec["floor_pt"],
        }
    json.dump(out, sys.stdout, indent=1, ensure_ascii=False)
    sys.stdout.write("\n")


if __name__ == "__main__":
    main()
