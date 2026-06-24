import { defineConfig } from "vitepress";

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
  // Project-page deploy: served at https://diomalta.github.io/vellora/, so all asset/link
  // URLs need the repo name as a base prefix. Drop to "/" only if a custom domain is added.
  base: "/vellora/",
  description:
    "HTML to PDF for Node.js via a native addon — in-process, no Chromium. Bring your own HTML and get a deterministic PDF.",
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
