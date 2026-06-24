/**
 * Renderer-agnostic golden-output primitive. Given a fixture id and produced bytes, compares against
 * a stored golden and returns a pass or a structured diff. Supports an explicit update/record mode
 * (env `UPDATE_GOLDENS=1` or `options.update`) and NEVER rewrites goldens during a normal run. Format
 * agnostic: the same primitive compares PDF bytes (core) or rendered PNGs (planned visual regression).
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const DEFAULT_GOLDEN_DIR = join(dirname(fileURLToPath(import.meta.url)), "..", "goldens");

export interface GoldenResult {
  pass: boolean;
  /** Human-readable structured diff when `pass` is false; undefined on pass. */
  diff?: string;
}

export interface GoldenOptions {
  /** Directory holding `<fixtureId>.golden` files. Defaults to the harness `goldens/` dir. */
  goldenDir?: string;
  /** When true, (re)writes the golden instead of comparing. Defaults to `UPDATE_GOLDENS=1`. */
  update?: boolean;
}

function structuredDiff(golden: Buffer, produced: Buffer): string {
  if (golden.length !== produced.length) {
    return `size mismatch: golden=${golden.length} bytes, produced=${produced.length} bytes`;
  }
  for (let i = 0; i < golden.length; i++) {
    const g = golden[i] ?? 0;
    const p = produced[i] ?? 0;
    if (g !== p) {
      return `byte mismatch at offset ${i}: golden=0x${g.toString(16)} produced=0x${p.toString(16)}`;
    }
  }
  return "";
}

export function compareGolden(
  fixtureId: string,
  produced: Uint8Array,
  options: GoldenOptions = {},
): GoldenResult {
  const goldenDir = options.goldenDir ?? DEFAULT_GOLDEN_DIR;
  const update = options.update ?? process.env.UPDATE_GOLDENS === "1";
  const goldenPath = join(goldenDir, `${fixtureId}.golden`);
  const producedBuf = Buffer.from(produced);

  if (update) {
    mkdirSync(goldenDir, { recursive: true });
    writeFileSync(goldenPath, producedBuf);
    return { pass: true };
  }

  if (!existsSync(goldenPath)) {
    return {
      pass: false,
      diff: `no golden recorded for "${fixtureId}" at ${goldenPath}; run with UPDATE_GOLDENS=1 to record`,
    };
  }

  const diff = structuredDiff(readFileSync(goldenPath), producedBuf);
  return diff ? { pass: false, diff } : { pass: true };
}
