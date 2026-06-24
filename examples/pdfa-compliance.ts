/**
 * PLANNED — NOT YET FUNCTIONAL
 *
 * PDF/A (archival) compliance — XMP metadata, embedded ICC color profile, full font
 * embedding, the PDF/A conformance flag — does NOT exist in the codebase yet. There is no
 * option to request it and no code path that emits a conformant file. This is planned.
 *
 * This file is intentionally NOT wired to an npm script and performs NO render — it
 * documents the intended shape only so the roadmap is legible.
 *
 * Intended usage (illustrative — does not work today):
 *
 *   import { renderPdf } from "vellora";
 *   const pdf = await renderPdf(template, data, {
 *     pdfa: "PDF/A-2b", // would embed XMP + ICC profile and full fonts
 *   });
 */
console.log("pdfa-compliance: PLANNED. No PDF/A code exists yet — no render performed.");
