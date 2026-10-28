// Per-fixture checks that decide whether a layout diff can be trusted at all.
//
//   input-parity       Chromium and Blitz were given the SAME problem (viewport, fonts). A failure
//                      INVALIDATES the attribution: a 1 px viewport mismatch otherwise surfaces as
//                      "enter html ... RAW BLITZ", and lost font injection as large text deltas.
//   self-consistency   The vellora dump and the DOM-path keys agree with themselves and with
//                      Chromium's DOM (html_normalize wrappers located, run metadata aligned, layer
//                      order stable, every source element keyed identically on both sides).
//   coverage           Optional instruments that were (not) available for this run, e.g. the N0
//                      source-HTML layer that separates html_normalize from raw Blitz.
//
// Status: pass | fail | warn | not-run. run.mjs exits non-zero when any check fails (after writing
// every report) unless --allow-check-failures is given.
import { FONT_STYLE_MARKER } from "./fixture-html.mjs";
import { aliasFamiliesFor } from "./fonts.mjs";

const check = (id, klass, status, detail) => ({ id, class: klass, status, detail });

/** Fonts Chromium loaded, as `${family} ${weight} ${style}` strings (captureSnapshot probes). */
function loadedFace(loaded, families, weight) {
  return loaded.some((entry) => families.some((f) => entry.startsWith(`${f} ${weight} `)));
}

const HEAD = "html>head:nth-child(1)";
const notHead = (p) => p !== HEAD && !p.startsWith(`${HEAD}>`);

/** Element keys of a dump's DOM (non-synthetic, head excluded) -> {tag, id, class}. */
function dumpElementKeys(nodes) {
  const out = new Map();
  for (const n of nodes) {
    if (n.kind !== "element" || n.synthetic || !notHead(n.path)) continue;
    out.set(n.path, { tag: n.tag, id: n.id_attr ?? null, class: n.class ?? null });
  }
  return out;
}

/** Paths in a but not b, in b but not a, and common paths whose tag/id/class differ. */
function keyDiff(a, b) {
  const onlyA = [...a.keys()].filter((k) => !b.has(k));
  const onlyB = [...b.keys()].filter((k) => !a.has(k));
  const conflicts = [...a.keys()].filter((k) => {
    const y = b.get(k);
    const x = a.get(k);
    return y && (x.tag !== y.tag || x.id !== y.id || x.class !== y.class);
  });
  return { onlyA, onlyB, conflicts, common: [...a.keys()].filter((k) => b.has(k)).length };
}

const sample = (list) => list.slice(0, 4).join("; ");

export function runChecks({
  dump,
  model,
  probes,
  browserHtml,
  result,
  chromeRecords = null,
  sourceNote = null,
}) {
  const out = [];
  const vw = dump.viewport.width_px;
  const vh = dump.viewport.height_px;

  // ---- input parity ----
  out.push(
    check(
      "viewport_width",
      "input-parity",
      probes.clientWidth === vw && probes.innerWidth === vw ? "pass" : "fail",
      `Blitz viewport width ${vw} px; Chromium documentElement.clientWidth ${probes.clientWidth}, innerWidth ${probes.innerWidth}`,
    ),
  );
  out.push(
    check(
      "viewport_height",
      "input-parity",
      probes.innerHeight === vh ? "pass" : "fail",
      `Blitz viewport height ${vh} px; Chromium innerHeight ${probes.innerHeight}`,
    ),
  );
  const injected = typeof browserHtml === "string" && browserHtml.includes(FONT_STYLE_MARKER);
  out.push(
    check(
      "font_block_injected",
      "input-parity",
      injected ? "pass" : "fail",
      injected
        ? `browser HTML carries the bundled @font-face block (<style ${FONT_STYLE_MARKER}>)`
        : "browser HTML has NO bundled @font-face block: Chromium shapes with system fonts",
    ),
  );
  const needed = new Map();
  for (const run of model.layers.find((l) => l.name === "L0").runs) {
    const alias = aliasFamiliesFor(run.face);
    if (alias) needed.set(`${run.face}`, alias);
  }
  const loaded = probes.fonts ?? [];
  const notLoaded = [...needed].filter(([, a]) => !loadedFace(loaded, a.families, a.weight));
  out.push(
    check(
      "bundled_fonts_loaded",
      "input-parity",
      notLoaded.length === 0 ? "pass" : "fail",
      `vellora shaped with ${needed.size} bundled face(s); Chromium document.fonts loaded: ${loaded.join("; ") || "(none)"}${notLoaded.length ? `; NOT loaded for: ${notLoaded.map(([f]) => f).join(", ")}` : ""}`,
    ),
  );
  const pf = probes.platformFonts;
  if (!pf) {
    out.push(
      check(
        "platform_fonts_custom",
        "input-parity",
        "not-run",
        "snapshot has no CSS.getPlatformFontsForNode probe",
      ),
    );
  } else {
    const system = pf.fonts.filter((f) => !f.custom);
    const systemGlyphs = system.reduce((n, f) => n + f.glyphs, 0);
    const totalGlyphs = pf.fonts.reduce((n, f) => n + f.glyphs, 0);
    const fallbackRuns = Object.entries(model.faces)
      .filter(([face]) => face.startsWith("DejaVu"))
      .reduce((n, [, c]) => n + c, 0);
    let status = "pass";
    if (systemGlyphs > 0) status = fallbackRuns > 0 ? "warn" : "fail";
    out.push(
      check(
        "platform_fonts_custom",
        "input-parity",
        status,
        `CSS.getPlatformFontsForNode over ${pf.elements_probed} text-bearing elements: ${systemGlyphs}/${totalGlyphs} glyphs rendered with SYSTEM fonts${system.length ? ` (${system.map((f) => `${f.family} ${f.glyphs}`).join(", ")})` : ""}; vellora DejaVu fallback runs: ${fallbackRuns}${status === "warn" ? " (system glyphs may be the counterpart of vellora's fallback)" : ""}`,
      ),
    );
  }

  // ---- coverage: N0 (Blitz on the source HTML) ----
  out.push(
    check(
      "source_html_layer",
      "coverage",
      model.source ? "pass" : "not-run",
      model.source
        ? `N0 present: Blitz laid out the source HTML with html_normalize skipped; the N0 → B0 step is html_normalize's (DOM altered by html_normalize: ${model.domAlteredByHtmlNormalize ? "YES" : "no"})`
        : `no N0 layer${sourceNote ? ` (${sourceNote})` : ""}: html_normalize's effect is NOT separated from Blitz; B0 is Blitz on html_normalize's output${model.domAlteredByHtmlNormalize ? ", and html_normalize DID alter this DOM" : ""}`,
    ),
  );

  // ---- self-consistency ----
  // normalize_wrappers_located and normalize_dom_roundtrip are historical since port step 05
  // (html_normalize deleted: every dump records 0 wrappers and both parses are the same HTML, so
  // they always pass). Kept, not removed (port step 10 audit): they still judge the committed
  // Phase A dumps (test/receipt-n0.test.mjs, expected-check-failures-phase-a.json).
  const rec = model.normalize?.wrappers_recorded ?? 0;
  const loc = model.normalize?.wrappers_located ?? 0;
  out.push(
    check(
      "normalize_wrappers_located",
      "self-consistency",
      rec === loc ? "pass" : "fail",
      `html_normalize wrappers recorded ${rec}, located in the Blitz DOM ${loc}${rec === loc ? "" : " — a wrapper did not survive Blitz's re-parse where it was inserted (e.g. a <div> inside <p> is hoisted out by the HTML parser); keys of later siblings shift"}`,
    ),
  );
  out.push(
    check(
      "run_meta_alignment",
      "self-consistency",
      model.runMetaMismatches.length === 0 ? "pass" : "fail",
      `L0 boxes whose Parley runs could not be re-aligned to the walk: ${model.runMetaMismatches.length}`,
    ),
  );
  out.push(
    check(
      "layer_order",
      "self-consistency",
      model.layerOrderViolations.length === 0 ? "pass" : "fail",
      `layers whose box sequence differs from L0: ${model.layerOrderViolations.length ? model.layerOrderViolations.join(", ") : "none"}`,
    ),
  );
  if (model.source) {
    // Same input, two parses: the source HTML (N0) and html_normalize's serialized output (B0).
    // Their element keys must agree once the recorded wrappers are transparent; anything else is
    // a DOM change html_normalize did not record (e.g. a re-parse hoisting its wrapper).
    const d = keyDiff(dumpElementKeys(model.source.nodes), dumpElementKeys(dump.nodes));
    const ok = !d.onlyA.length && !d.onlyB.length && !d.conflicts.length;
    out.push(
      check(
        "normalize_dom_roundtrip",
        "self-consistency",
        ok ? "pass" : "fail",
        `element keys of the source DOM (N0) vs html_normalize's output re-parsed by Blitz (B0, wrappers transparent): ${d.common} common; only in source ${d.onlyA.length}${d.onlyA.length ? ` (${sample(d.onlyA)})` : ""}; only in normalized ${d.onlyB.length}${d.onlyB.length ? ` (${sample(d.onlyB)})` : ""}; same key, different tag/id/class ${d.conflicts.length}${d.conflicts.length ? ` (${sample(d.conflicts)})` : ""}`,
      ),
    );
  }
  if (model.source && chromeRecords) {
    const chromeKeys = new Map();
    for (const r of chromeRecords) {
      if (r.kind !== "element" || !notHead(r.path)) continue;
      chromeKeys.set(r.path, { tag: r.tag, id: r.id_attr ?? null, class: r.class ?? null });
    }
    const d = keyDiff(dumpElementKeys(model.source.nodes), chromeKeys);
    const ok = !d.onlyA.length && !d.onlyB.length && !d.conflicts.length;
    out.push(
      check(
        "source_dom_keys_vs_chromium",
        "self-consistency",
        ok ? "pass" : "fail",
        `element keys of Blitz's parse of the source HTML (N0) vs Chromium's DOM (head excluded): ${d.common} common; only in vellora ${d.onlyA.length}${d.onlyA.length ? ` (${sample(d.onlyA)})` : ""}; only in Chromium ${d.onlyB.length}${d.onlyB.length ? ` (${sample(d.onlyB)})` : ""}; same key, different tag/id/class ${d.conflicts.length}${d.conflicts.length ? ` (${sample(d.conflicts)})` : ""}`,
      ),
    );
  }
  const noChrome = result.counts.vellora_only["no Chromium node with this path"] ?? {
    count: 0,
    sample: [],
  };
  // Compared Chromium boxes whose path NO vellora DOM node has (a key problem). Boxes vellora's
  // DOM has but its walk drops (e.g. a block ::before) are missing boxes, not key failures: they
  // are scored as LOST in the diff (missing_boxes) instead.
  const unkeyed = result.counts.chrome_only_compared_unkeyed ??
    result.counts.chrome_only_compared ?? { count: 0, sample: [] };
  const dropped = (result.counts.chrome_only_compared?.count ?? 0) - unkeyed.count;
  out.push(
    check(
      "dom_key_alignment",
      "self-consistency",
      noChrome.count === 0 && unkeyed.count === 0 ? "pass" : "fail",
      `L0 boxes (vellora's render DOM) keyed only on the vellora side: ${noChrome.count}${noChrome.count ? ` (${sample(noChrome.sample)})` : ""}; compared Chromium boxes whose path no vellora DOM node has: ${unkeyed.count}${unkeyed.count ? ` (${sample(unkeyed.sample)})` : ""}${dropped ? `; plus ${dropped} keyed box(es) the walk drops (scored as LOST, not a key failure)` : ""}`,
    ),
  );
  const t = result.text;
  const unmatched =
    t.unmatched_vellora_runs_total +
    t.unmatched_chrome_fragments_total +
    t.chrome_text_without_vellora_owner_total;
  out.push(
    check(
      "text_alignment",
      "self-consistency",
      unmatched === 0 ? "pass" : "warn",
      `matched ${t.matched_pairs} pairs; unmatched vellora runs ${t.unmatched_vellora_runs_total}, unmatched Chromium fragments ${t.unmatched_chrome_fragments_total}, Chromium text with no vellora owner ${t.chrome_text_without_vellora_owner_total}`,
    ),
  );
  return out;
}

export function summarizeChecks(checks) {
  const failed = checks.filter((c) => c.status === "fail");
  return {
    // Input parity failed => the engines were not given the same problem: attribution INVALID.
    attribution_valid: !failed.some((c) => c.class === "input-parity"),
    input_parity_ok: !failed.some((c) => c.class === "input-parity"),
    self_consistency_ok: !failed.some((c) => c.class === "self-consistency"),
    failed: failed.map((c) => c.id),
    warned: checks.filter((c) => c.status === "warn").map((c) => c.id),
    not_run: checks.filter((c) => c.status === "not-run").map((c) => c.id),
  };
}
