// Shared fixture loading for the corpus scripts (mirrors packages/test-harness fixtureImages: every
// top-level or assets/ image is registered under its relative path and the ./-prefixed variant).
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

export const FIXED_CREATION_DATE = "2026-01-01T00:00:00.000Z";

export function fixtureImages(dir) {
  const images = {};
  const add = (rel) => {
    if (/\.(png|jpe?g|gif|webp)$/i.test(rel)) {
      const bytes = new Uint8Array(readFileSync(join(dir, rel)));
      images[rel] = bytes;
      images[`./${rel}`] = bytes;
    }
  };
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (e.isFile()) {
      add(e.name);
    } else if (e.isDirectory() && e.name === "assets") {
      for (const a of readdirSync(join(dir, "assets"), { withFileTypes: true })) {
        if (a.isFile()) {
          add(`assets/${a.name}`);
        }
      }
    }
  }
  return images;
}

/** The exact render options every corpus render uses (strict, fixed metadata). */
export function renderOptions(images) {
  return { strict: true, images, metadata: { title: "corpus", creationDate: FIXED_CREATION_DATE } };
}
