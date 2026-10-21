// HTML preparation shared by every oracle: template a fixture, inline its local images, and
// give the reference engines (Chrome, WeasyPrint) the SAME font files vellora bundles.
//
// The font alias table, the reference-HTML builder and the image inliner live in the ONE shared
// Chromium reference setup, fidelity/lib/chrome-reference.mjs (also used by the corpus and
// layout-diff); they are re-exported here so oracle code and tests keep their imports.
// test/html-prep.test.mjs reads benchmarks/visual-fidelity.mjs as TEXT and fails when one of its
// aliases maps to a different file in the shared table (importing that module would run it).
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  BUNDLED_FONT_DIR,
  FONT_ALIASES,
  bundledFontFaceCss,
  inlineLocalImageSources,
  referenceHtml,
} from "../../lib/chrome-reference.mjs";
import { REPO_ROOT } from "./paths.mjs";

export { BUNDLED_FONT_DIR, FONT_ALIASES, bundledFontFaceCss, inlineLocalImageSources };

export const FIXTURE_IDS = Object.freeze(["invoice", "receipt", "boleto", "notification"]);

/** Fixed creation date so a fixture render is byte-reproducible (determinism invariant). */
export const FIXED_CREATION_DATE = "2026-06-25T00:00:00.000Z";

/**
 * HTML for the reference engines: the exact templated HTML vellora received (local images
 * inlined), plus a `<base>` and the bundled-font `@font-face` block. `injectFonts: false` is for
 * caller HTML that already ships its own fonts.
 */
export function referenceEngineHtml(templatedHtml, { baseDir, injectFonts = true } = {}) {
  return referenceHtml(templatedHtml, { baseDir, injectFonts });
}

/** Load a repo fixture (template + data) without rendering it. */
export function loadFixture(id) {
  const dir = join(REPO_ROOT, "fixtures", id);
  return {
    id,
    dir,
    template: readFileSync(join(dir, "index.html"), "utf8"),
    data: JSON.parse(readFileSync(join(dir, "data.json"), "utf8")),
  };
}

/** Template a fixture with vellora's own engine and inline its images (what vellora renders). */
export function templatedFixtureHtml(fixture, renderTemplate) {
  return inlineLocalImageSources(renderTemplate(fixture.template, fixture.data), fixture.dir);
}
