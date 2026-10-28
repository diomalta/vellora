// Measure every variant on the reference Chrome: getBoundingClientRect of each [id] element.
//   node chrome.mjs <chrome executable>   (writes JSON to stdout; also writes <variant>.html)
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  launchReferenceChrome,
  referenceHtml,
  withPrintPage,
} from "../../../../../lib/chrome-reference.mjs";
import { VARIANTS } from "./variants.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const chrome = await launchReferenceChrome(process.argv[2]);
const out = { chrome: chrome.version };
for (const [name, html] of Object.entries(VARIANTS)) {
  writeFileSync(join(here, `${name}.html`), html);
  out[name] = await withPrintPage(chrome, referenceHtml(html), (page) =>
    page.evaluate(() => {
      const r = {};
      for (const el of document.querySelectorAll("body [id]")) {
        const b = el.getBoundingClientRect();
        r[el.id] = { x: b.left, y: b.top, w: b.width, h: b.height };
      }
      return r;
    }),
  );
}
await chrome.close();
console.log(JSON.stringify(out, null, 1));
