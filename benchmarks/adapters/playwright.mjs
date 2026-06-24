/**
 * Playwright adapter — INTENDED LONG-LIVED MODE.
 *
 * Launches ONE Chromium instance once and reuses it across every warm render
 * (a fresh page per render, never a fresh browser). See D2.
 */
export const meta = {
  id: "playwright",
  kind: "browser",
  longLivedMode: "one Chromium launched once, reused across warm renders",
};

export async function create() {
  const { chromium } = await import("playwright");
  const version = (await import("playwright/package.json", { with: { type: "json" } })).default
    .version;

  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  });

  return {
    mode: meta.longLivedMode,
    version,
    /** @param {string} html @returns {Promise<Uint8Array>} */
    async render(html) {
      const page = await browser.newPage();
      try {
        await page.setContent(html, { waitUntil: "networkidle" });
        const pdf = await page.pdf({ format: "A4", printBackground: true });
        return new Uint8Array(pdf);
      } finally {
        await page.close();
      }
    },
    async close() {
      await browser.close();
    },
  };
}
