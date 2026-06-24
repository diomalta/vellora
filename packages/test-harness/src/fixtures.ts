/**
 * Fixture loader. Enumerates the neutral, owned document fixtures and resolves them by id, returning
 * `{ id, html, data, conformant }`. Renderer-agnostic and path-free so sibling changes drive the
 * renderer without hardcoding paths.
 */
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

// Both `src/` (vitest) and `dist/` (built) sit one level under the package, so `../../../fixtures`
// reaches the repo-root `fixtures/` directory in both cases.
const FIXTURES_DIR = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..", "fixtures");

/** The four subset-conforming fixtures. */
export const CONFORMANT_FIXTURE_IDS = ["invoice", "receipt", "boleto", "notification"] as const;
/** The intentionally-broken variant(s), used by lint diagnose/fix + strict-gate rejection. */
export const BROKEN_FIXTURE_IDS = ["invoice-broken"] as const;

export type FixtureId =
  | (typeof CONFORMANT_FIXTURE_IDS)[number]
  | (typeof BROKEN_FIXTURE_IDS)[number];

export interface Fixture {
  id: string;
  html: string;
  data: unknown;
  conformant: boolean;
}

function readFixture(id: string, conformant: boolean): Fixture {
  const dir = join(FIXTURES_DIR, id);
  const htmlPath = join(dir, "index.html");
  const dataPath = join(dir, "data.json");
  if (!existsSync(htmlPath) || !existsSync(dataPath)) {
    throw new Error(`Fixture "${id}" is missing index.html or data.json at ${dir}`);
  }
  return {
    id,
    html: readFileSync(htmlPath, "utf8"),
    data: JSON.parse(readFileSync(dataPath, "utf8")),
    conformant,
  };
}

/** List the four conformant fixtures (invoice, receipt, boleto, notification). */
export function list(): Fixture[] {
  return CONFORMANT_FIXTURE_IDS.map((id) => readFixture(id, true));
}

/** List every fixture, including the intentionally-broken variant (flagged `conformant: false`). */
export function listAll(): Fixture[] {
  return [
    ...CONFORMANT_FIXTURE_IDS.map((id) => readFixture(id, true)),
    ...BROKEN_FIXTURE_IDS.map((id) => readFixture(id, false)),
  ];
}

/** Resolve a fixture by id (conformant or broken). Throws a clear error for an unknown id. */
export function resolveById(id: string): Fixture {
  const conformant = (CONFORMANT_FIXTURE_IDS as readonly string[]).includes(id);
  const broken = (BROKEN_FIXTURE_IDS as readonly string[]).includes(id);
  if (!conformant && !broken) {
    const known = [...CONFORMANT_FIXTURE_IDS, ...BROKEN_FIXTURE_IDS].join(", ");
    throw new Error(`Unknown fixture id "${id}". Known fixtures: ${known}.`);
  }
  return readFixture(id, conformant);
}
