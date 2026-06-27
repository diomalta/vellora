import { defineConfig } from "vitepress";

const SITE_ORIGIN = "https://diomalta.github.io";
const BASE_PATH = "/vellora/";
const DEFAULT_DESCRIPTION =
  "HTML to PDF for Node.js with a native no-browser renderer, strict document HTML subset, PDF/A, fonts, images, and optional Chromium fidelity routing.";

const pageDescriptions: Record<string, string> = {
  "index.md":
    "vellora renders generated HTML documents to PDF in Node.js with no Puppeteer on the native path, deterministic output, PDF/A, fonts, images, and optional Chromium fidelity.",
  "guide/getting-started.md":
    "Install vellora and render the first HTML to PDF document in Node.js without a Rust toolchain, Chromium, Python, or Java.",
  "guide/invoices.md":
    "Build invoice PDFs with vellora templating, tables, currency formatting, @page rules, and repeated table headers.",
  "guide/images.md":
    "Use data URL images or pass PNG, JPEG, GIF, and WebP bytes through vellora's images option with optional baseUrl normalization.",
  "guide/streaming.md":
    "Write generated PDF output to an HTTP response or writable stream with vellora's renderPdfToStream helper.",
  "guide/fonts.md":
    "Render deterministic PDFs with bundled fonts or caller-supplied TTF/OTF bytes through vellora's fonts option.",
  "guide/fidelity.md":
    "Route selected templates through vellora's optional Chromium engine when browser print fidelity is required.",
  "guide/pdfa.md": "Generate PDF/A-2b archival documents with vellora's native renderer.",
  "guide/concurrency.md":
    "Render many HTML documents to PDF with bounded concurrency using vellora's renderPdfBatch API.",
  "compatibility.md":
    "Understand vellora's strict HTML/CSS subset, supported document features, and unsupported browser-only constructs.",
  "migrating.md":
    "Switch HTML to PDF workflows from Puppeteer or wkhtmltopdf to vellora's native renderer, with Chromium opt-in for specific templates.",
  "recipes.md":
    "Runnable vellora HTML to PDF recipes for invoices, receipts, boletos, notifications, PDF/A, fonts, streaming, and fidelity checks.",
};

function canonicalUrl(relativePath: string): string {
  const route = relativePath
    .replace(/(^|\/)index\.md$/, "$1")
    .replace(/\.md$/, "")
    .replace(/\/$/, "");
  return `${SITE_ORIGIN}${BASE_PATH}${route}`;
}

/**
 * Algolia DocSearch is configured only when all three build-time env vars are present.
 * Otherwise the site falls back to VitePress's built-in local search, so the build never
 * hard-depends on external DocSearch credentials.
 */
const docsearch =
  process.env.DOCSEARCH_APP_ID && process.env.DOCSEARCH_API_KEY && process.env.DOCSEARCH_INDEX_NAME
    ? {
        provider: "algolia" as const,
        options: {
          appId: process.env.DOCSEARCH_APP_ID,
          apiKey: process.env.DOCSEARCH_API_KEY,
          indexName: process.env.DOCSEARCH_INDEX_NAME,
        },
      }
    : { provider: "local" as const };

export default defineConfig({
  title: "vellora",
  titleTemplate: ":title | HTML to PDF for Node.js",
  lang: "en-US",
  // Project-page deploy: served at https://diomalta.github.io/vellora/, so all asset/link
  // URLs need the repo name as a base prefix. Drop to "/" only if a custom domain is added.
  base: BASE_PATH,
  description: DEFAULT_DESCRIPTION,
  sitemap: {
    hostname: `${SITE_ORIGIN}${BASE_PATH}`,
  },
  head: [
    ["meta", { property: "og:site_name", content: "vellora" }],
    ["meta", { property: "og:type", content: "website" }],
    ["meta", { name: "twitter:card", content: "summary" }],
  ],
  transformPageData(pageData) {
    const description =
      pageDescriptions[pageData.relativePath] ?? pageData.description ?? DEFAULT_DESCRIPTION;
    const title =
      pageData.relativePath === "index.md"
        ? "vellora - HTML to PDF for Node.js"
        : `${pageData.title} | vellora`;
    const url = canonicalUrl(pageData.relativePath);
    pageData.description = description;
    pageData.frontmatter.head = [
      ...(pageData.frontmatter.head ?? []),
      ["link", { rel: "canonical", href: url }],
      ["meta", { property: "og:title", content: title }],
      ["meta", { property: "og:description", content: description }],
      ["meta", { property: "og:url", content: url }],
      ["meta", { name: "twitter:title", content: title }],
      ["meta", { name: "twitter:description", content: description }],
    ];
  },
  cleanUrls: true,
  themeConfig: {
    // Top navigation is capped at 3–5 entries (Diataxis); deeper structure lives in the sidebar.
    nav: [
      { text: "Guide", link: "/guide/getting-started" },
      { text: "Reference", link: "/reference/" },
      { text: "Compatibility", link: "/compatibility" },
      { text: "Switching", link: "/migrating" },
    ],
    sidebar: {
      "/guide/": [
        {
          text: "Getting Started",
          items: [{ text: "Install & first PDF", link: "/guide/getting-started" }],
        },
        {
          text: "Guides",
          items: [
            { text: "Invoices", link: "/guide/invoices" },
            { text: "Streaming", link: "/guide/streaming" },
            { text: "Fonts", link: "/guide/fonts" },
            { text: "Images", link: "/guide/images" },
            { text: "Rendering fidelity", link: "/guide/fidelity" },
            { text: "PDF/A", link: "/guide/pdfa" },
            { text: "Concurrency", link: "/guide/concurrency" },
          ],
        },
        {
          text: "More",
          items: [
            { text: "Recipes", link: "/recipes" },
            { text: "Compatibility", link: "/compatibility" },
            { text: "Switching", link: "/migrating" },
          ],
        },
      ],
      "/reference/": [
        {
          text: "API Reference",
          items: [{ text: "Overview", link: "/reference/" }],
        },
      ],
    },
    search: docsearch,
    socialLinks: [{ icon: "github", link: "https://github.com/diomalta/vellora" }],
  },
});
