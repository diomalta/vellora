// Per-fixture checks that decide whether a layout diff can be trusted at all.
//
//   input-parity       Chromium and Blitz were given the SAME problem (viewport, fonts). A failure
//                      INVALIDATES the attribution: a 1 px viewport mismatch otherwise surfaces as
//                      "enter html ... RAW BLITZ", and lost font injection as large text deltas.
//   self-consistency   The vellora dump and the DOM-path keys agree with themselves and with
//                      Chromium's DOM (html_normalize wrappers located, run metadata aligned, layer
//                      order stable, every source element keyed identically on both sides).
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

export function runChecks({ dump, model, probes, browserHtml, result }) {
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

  // ---- self-consistency ----
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
  const noChrome = result.counts.vellora_only["no Chromium node with this path"] ?? {
    count: 0,
    sample: [],
  };
  const chromeOnly = result.counts.chrome_only_compared;
  out.push(
    check(
      "dom_key_alignment",
      "self-consistency",
      noChrome.count === 0 && chromeOnly.count === 0 ? "pass" : "fail",
      `source-DOM elements keyed only on the vellora side: ${noChrome.count}${noChrome.count ? ` (${noChrome.sample.slice(0, 4).join("; ")})` : ""}; compared Chromium boxes with no vellora box: ${chromeOnly.count}${chromeOnly.count ? ` (${chromeOnly.sample.slice(0, 4).join("; ")})` : ""}`,
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
    input_parity_ok: !failed.some((c) => c.class === "input-parity"),
    self_consistency_ok: !failed.some((c) => c.class === "self-consistency"),
    failed: failed.map((c) => c.id),
    warned: checks.filter((c) => c.status === "warn").map((c) => c.id),
    not_run: checks.filter((c) => c.status === "not-run").map((c) => c.id),
  };
}
