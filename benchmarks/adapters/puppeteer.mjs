/**
 * Puppeteer adapter — INTENDED LONG-LIVED MODE.
 *
 * Launches ONE Chromium instance once and reuses it across every warm render
 * (a fresh page per render, but never a fresh browser). Spawning a browser per
 * render would be the unfair strawman the suite explicitly avoids (see D2).
 */
export const meta = {
  id: "puppeteer",
  kind: "browser",
  longLivedMode: "one Chromium launched once, reused across warm renders",
};

export async function create() {
  const puppeteer = (await import("puppeteer")).default;
  const version = (await import("puppeteer/package.json", { with: { type: "json" } })).default
    .version;

  const browser = await puppeteer.launch({
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
        await page.setContent(html, { waitUntil: "networkidle0" });
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
