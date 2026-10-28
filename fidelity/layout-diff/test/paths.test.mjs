// DOMSnapshot -> path keys must follow the SAME scheme as the Rust dump
// (vellora_core::blitz_engine::DumpNode::dom_path; see crates/vellora-core/tests/layout_dump.rs).
import assert from "node:assert/strict";
import { test } from "node:test";
import { normalizeSnapshot } from "../lib/chrome-snapshot.mjs";

/** Minimal CDP DOMSnapshot.captureSnapshot payload builder. */
function snapshotOf(nodes, layout, textBoxes = []) {
  const strings = [];
  const s = (v) => {
    let i = strings.indexOf(v);
    if (i < 0) {
      strings.push(v);
      i = strings.length - 1;
    }
    return i;
  };
  const pseudo = nodes.map((n, i) => [i, n.pseudo]).filter(([, p]) => p);
  return {
    strings,
    documents: [
      {
        nodes: {
          parentIndex: nodes.map((n) => n.parent),
          nodeType: nodes.map((n) => n.type),
          nodeName: nodes.map((n) => s(n.name)),
          nodeValue: nodes.map((n) => s(n.value ?? "")),
          attributes: nodes.map((n) => (n.attrs ?? []).flatMap(([k, v]) => [s(k), s(v)])),
          pseudoType: { index: pseudo.map(([i]) => i), value: pseudo.map(([, p]) => s(p)) },
        },
        layout: {
          nodeIndex: layout.map((l) => l.node),
          styles: layout.map((l) => [s(l.display ?? "block"), s("static")]),
          bounds: layout.map((l) => l.bounds),
          text: layout.map((l) => (l.text === undefined ? -1 : s(l.text))),
        },
        textBoxes: {
          layoutIndex: textBoxes.map((t) => t.layout),
          bounds: textBoxes.map((t) => t.bounds),
          start: textBoxes.map((t) => t.start),
          length: textBoxes.map((t) => t.length),
        },
      },
    ],
  };
}

test("element keys count element siblings only; pseudo-elements never count", () => {
  const nodes = [
    { parent: -1, type: 9, name: "#document" }, // 0
    { parent: 0, type: 10, name: "html" }, // 1 doctype
    { parent: 0, type: 1, name: "HTML" }, // 2
    { parent: 2, type: 1, name: "HEAD" }, // 3
    { parent: 2, type: 1, name: "BODY" }, // 4
    { parent: 4, type: 3, name: "#text", value: "\n  " }, // 5
    { parent: 4, type: 1, name: "DIV", attrs: [["class", "k"]] }, // 6
    { parent: 6, type: 1, name: "::before", pseudo: "before" }, // 7
    { parent: 6, type: 3, name: "#text", value: "hi" }, // 8
    { parent: 4, type: 8, name: "#comment" }, // 9
    { parent: 4, type: 1, name: "P" }, // 10
  ];
  const layout = [
    { node: 2, bounds: [0, 0, 100, 50] },
    { node: 4, bounds: [0, 0, 100, 50] },
    { node: 6, bounds: [0, 0, 100, 20] },
    { node: 7, bounds: [0, 0, 5, 20], display: "inline" },
    { node: 8, bounds: [5, 2, 10, 16], text: "hi" },
    { node: 10, bounds: [0, 20, 100, 30] },
  ];
  const records = normalizeSnapshot(
    snapshotOf(nodes, layout, [{ layout: 4, bounds: [5, 2, 10, 16], start: 0, length: 2 }]),
  );
  const byPath = new Map(records.map((r) => [r.path, r]));
  assert.ok(byPath.has("html"));
  assert.ok(byPath.has("html>head:nth-child(1)"));
  assert.equal(byPath.get("html>body:nth-child(2)>div:nth-child(1)").class, "k");
  assert.equal(byPath.get("html>body:nth-child(2)>div:nth-child(1)>::before").kind, "pseudo");
  // The comment and whitespace text do not shift the <p>'s index; the pseudo does not either.
  assert.ok(byPath.has("html>body:nth-child(2)>p:nth-child(2)"));
  const text = byPath.get("html>body:nth-child(2)>div:nth-child(1)>#text");
  assert.equal(text.fragments.length, 1);
  assert.equal(text.fragments[0].text, "hi");
  assert.equal(byPath.get("html>head:nth-child(1)").box, null);
});
