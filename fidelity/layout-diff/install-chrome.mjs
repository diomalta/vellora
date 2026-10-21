#!/usr/bin/env node
// Install a PINNED Chrome for Testing build into fidelity/.cache/chrome-for-testing (gitignored)
// with @puppeteer/browsers (a dependency of the pinned puppeteer-core), then print its executable
// path. This is the authoritative reference for CI (pinned Linux runner); a developer's local
// Chrome is only indicative.
//
//   node fidelity/layout-diff/install-chrome.mjs [--build-id 155.0.8059.84]
//   node fidelity/layout-diff/run.mjs --chrome "$(node fidelity/layout-diff/install-chrome.mjs)"
//
// Downloads come from the Chrome for Testing bucket (read-only GET); nothing is uploaded.
import { join } from "node:path";
import { repoRoot } from "./lib/fixture-html.mjs";

/** Chosen to match the local reference Chrome's major/minor (155.0.8059.x) used on 2026-10-21. */
export const PINNED_CHROME_BUILD_ID = "155.0.8059.84";

function arg(name, fallback) {
  const i = process.argv.indexOf(name);
  return i >= 0 && process.argv[i + 1] !== undefined ? process.argv[i + 1] : fallback;
}

async function main() {
  const { Browser, computeExecutablePath, detectBrowserPlatform, install } = await import(
    "@puppeteer/browsers"
  );
  const buildId = arg("--build-id", PINNED_CHROME_BUILD_ID);
  const cacheDir = join(repoRoot, "fidelity", ".cache", "chrome-for-testing");
  const platform = detectBrowserPlatform();
  await install({ browser: Browser.CHROME, buildId, cacheDir, platform });
  process.stdout.write(
    `${computeExecutablePath({ browser: Browser.CHROME, buildId, cacheDir, platform })}\n`,
  );
}

main().catch((err) => {
  process.stderr.write(`install-chrome failed: ${err?.stack ?? err}\n`);
  process.exitCode = 1;
});
