// WPT directories run by default, with the reason each one is (or is not) in scope.
//
// Scope rule: vellora renders *documents* (invoices, receipts, boletos, notifications — see
// fixtures/). A directory is in the default run when its tests exercise layout or paint behaviour
// those documents depend on: block formatting + margin collapsing, inline/line-box layout, tables,
// boxes/borders/backgrounds, lists/generated content, positioning, floats, and fragmentation /
// paged media. Directories that mainly test the CSS parser/cascade (owned by Stylo and covered
// upstream by Servo/Stylo's own WPT runs), interactive UI, media queries or bidi/i18n (outside
// vellora's current document subset) are excluded and listed below so the omission is explicit.
// Any WPT path can still be run ad hoc: `node fidelity/wpt/run.mjs css/CSS2/selectors`.

/** @type {{ path: string, why: string }[]} */
export const DEFAULT_SUITES = [
  // --- CSS 2.1 (css/CSS2), document-layout subset ---
  { path: "css/CSS2/normal-flow", why: "block formatting context, widths/heights in flow" },
  { path: "css/CSS2/margin-padding-clear", why: "margin collapsing, padding, clearance" },
  { path: "css/CSS2/box", why: "box model basics" },
  { path: "css/CSS2/box-display", why: "display types, anonymous block/inline boxes" },
  { path: "css/CSS2/visudet", why: "visual formatting details: width/height/line-height calc" },
  { path: "css/CSS2/visuren", why: "visual formatting model: block/inline, anonymous boxes" },
  { path: "css/CSS2/linebox", why: "line boxes, vertical-align, line-height" },
  { path: "css/CSS2/text", why: "text-align/indent/white-space/letter-spacing" },
  { path: "css/CSS2/fonts", why: "font-size/weight/style/shorthand resolution" },
  { path: "css/CSS2/tables", why: "table layout (invoices/receipts are table-heavy)" },
  { path: "css/CSS2/borders", why: "border widths/styles/colours (cell rules, boleto boxes)" },
  { path: "css/CSS2/backgrounds", why: "background colours/images on boxes and cells" },
  { path: "css/CSS2/colors", why: "colour values" },
  { path: "css/CSS2/lists", why: "list markers and list layout" },
  { path: "css/CSS2/generated-content", why: "::before/::after, counters, quotes" },
  { path: "css/CSS2/floats", why: "floats (legacy templates; Blitz `floats` feature status)" },
  { path: "css/CSS2/floats-clear", why: "float clearance" },
  { path: "css/CSS2/positioning", why: "relative/absolute/fixed positioning" },
  { path: "css/CSS2/abspos", why: "absolute positioning containing blocks" },
  { path: "css/CSS2/visufx", why: "overflow/clip/visibility" },
  { path: "css/CSS2/pagination", why: "page-break-* (paged media in CSS 2.1)" },
  // --- CSS3 modules ---
  { path: "css/css-tables", why: "CSS Tables 3 (table sizing, border-collapse)" },
  { path: "css/css-break", why: "CSS Fragmentation (break-*, widows/orphans, multicol frags)" },
  { path: "css/css-page", why: "CSS Paged Media (@page size/margins, page boxes)" },
  { path: "css/css-text", why: "CSS Text 3 (white-space, wrapping, text-transform, spacing)" },
];

/** Excluded from the default run, with the reason (kept here so the omission is reviewable). */
export const EXCLUDED_SUITES = [
  { path: "css/CSS2/selectors", why: "selector matching: Stylo-owned, tested upstream" },
  { path: "css/CSS2/cascade", why: "cascade/inheritance: Stylo-owned, tested upstream" },
  { path: "css/CSS2/cascade-import", why: "@import: vellora never fetches external CSS" },
  { path: "css/CSS2/syntax", why: "CSS tokenizer/parser: Stylo-owned, tested upstream" },
  { path: "css/CSS2/values", why: "value parsing: Stylo-owned, tested upstream" },
  { path: "css/CSS2/sec5", why: "selectors section: Stylo-owned" },
  { path: "css/CSS2/css21-errata", why: "mixed errata, few tests" },
  { path: "css/CSS2/csswg-issues", why: "mixed issue repros, few tests" },
  { path: "css/CSS2/css1", why: "legacy CSS1 suite, overlaps the CSS2 directories above" },
  { path: "css/CSS2/bidi-text", why: "bidi/RTL is outside vellora's current document subset" },
  { path: "css/CSS2/i18n", why: "no reftests at the pinned commit" },
  { path: "css/CSS2/ui", why: "cursor/outline/UI: not document layout" },
  { path: "css/CSS2/media", why: "media queries/types: not layout" },
  { path: "css/CSS2/zindex", why: "stacking order: low document relevance" },
  { path: "css/CSS2/zorder", why: "stacking order: low document relevance" },
  { path: "css/CSS2/stacking-context", why: "stacking order: low document relevance" },
  { path: "css/CSS2/other-formats", why: "non-HTML formats" },
  { path: "css/CSS2/generate", why: "no reftests at the pinned commit" },
  { path: "css/CSS2/page-box", why: "no reftests at the pinned commit (manual paged tests)" },
];

/** Sparse-checkout patterns: the suites plus the shared resources their tests reference. */
export const SPARSE_PATTERNS = [
  "/css/CSS2/",
  "/css/css-tables/",
  "/css/css-break/",
  "/css/css-page/",
  "/css/css-text/",
  "/css/reference/",
  "/css/support/",
  "/fonts/",
  "/images/",
  "/resources/",
  // /common/blank.html etc. are used as references by some print/crash reftests.
  "/common/",
  "/docs/writing-tests/",
  // wptrunner/manifest sources: the primary source for the comparison semantics implemented here.
  "/tools/manifest/",
  "/tools/wptrunner/wptrunner/executors/",
  "/tools/wptrunner/wptrunner/wpttest.py",
  "/tools/wptrunner/wptrunner/print_pdf_runner.html",
  "/LICENSE.md",
];
