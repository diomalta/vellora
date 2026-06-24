/**
 * PLANNED — NOT YET FUNCTIONAL
 *
 * The `opts.fonts` option is currently INERT: it is accepted and forwarded to the native
 * layer, but it has no effect on the rendered PDF (see the `RenderOptions.fonts` doc in
 * packages/vellora/src/types.ts). Embedding and subsetting custom fonts is planned.
 *
 * This file is intentionally NOT wired to an npm script and performs NO render — running a
 * real `renderPdf({ fonts })` here would imply a capability that does not exist yet. It
 * documents the intended shape only.
 *
 * Intended usage (illustrative — does not work today):
 *
 *   import { renderPdf } from "vellora";
 *   const pdf = await renderPdf(template, data, {
 *     fonts: [
 *       { family: "Inter", weight: 400, src: interRegularBytes },
 *       { family: "Inter", weight: 700, src: interBoldBytes },
 *     ],
 *   });
 */
console.log("custom-fonts: PLANNED. opts.fonts is currently inert — no render performed.");
