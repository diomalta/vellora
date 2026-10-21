#!/usr/bin/env node
// Pin the Chrome oracle to an exact Chrome for Testing build (DESIGN TARGET for CI: local Chrome
// results are indicative only because the installed browser auto-updates).
//
//   node fidelity/wpt/install-chrome.mjs --check            # HEAD-check the pinned download URL
//   node fidelity/wpt/install-chrome.mjs                    # install into fidelity/.cache/chrome
//   node fidelity/wpt/install-chrome.mjs --build <version>  # another exact Chrome for Testing build
//
// Prints the executable path; pass it to `run.mjs --chrome <path>`. Requires `npm ci` in
// fidelity/wpt (uses @puppeteer/browsers, pinned in package.json).
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

/** Pinned Chrome for Testing build. Bump deliberately and record the reason in the README. */
export const CHROME_FOR_TESTING_BUILD = "155.0.8059.85";

const here = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const flag = (n) => args.includes(n);
const value = (n, d) => (args.includes(n) ? args[args.indexOf(n) + 1] : d);

const { Browser, detectBrowserPlatform, install, computeExecutablePath, getDownloadUrl } =
  await import("@puppeteer/browsers");
const buildId = value("--build", CHROME_FOR_TESTING_BUILD);
const platform = detectBrowserPlatform();
const cacheDir = resolve(value("--cache", join(here, "..", ".cache", "chrome")));
const url = getDownloadUrl(Browser.CHROME, platform, buildId).href;

if (flag("--check")) {
  const res = await fetch(url, {
    method: "HEAD",
    headers: { "User-Agent": "vellora-fidelity-tooling" },
  });
  console.log(`install-chrome: ${platform} ${buildId} -> ${url} : HTTP ${res.status}`);
  process.exit(res.ok ? 0 : 1);
}

await install({ browser: Browser.CHROME, buildId, platform, cacheDir });
const executablePath = computeExecutablePath({
  browser: Browser.CHROME,
  buildId,
  platform,
  cacheDir,
});
console.log(executablePath);
