// Thin access to the built vellora packages. Oracles only READ what vellora produces; nothing
// here changes render options beyond what a normal caller passes, so PDF bytes are unaffected.
//
// Templating always uses THIS checkout's build, so every subject receives byte-identical HTML.
// The SUBJECT renderer can be swapped for another build (e.g. a research branch with a different
// Blitz pin) with VELLORA_ORACLE_SUBJECT_MODULE=/abs/path/to/packages/vellora/dist/index.js;
// that module resolves its own @vellora/native addon. The swap is recorded in every result.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { FIXED_CREATION_DATE } from "./html-prep.mjs";
import { REPO_ROOT } from "./paths.mjs";

let velloraModule;
let subjectModule;

export async function loadVellora() {
  if (!velloraModule) {
    try {
      velloraModule = await import("vellora");
    } catch (cause) {
      throw new Error("vellora is not built: run `npm ci && npm run build` at the repo root", {
        cause,
      });
    }
  }
  return velloraModule;
}

export function subjectModulePath() {
  return process.env.VELLORA_ORACLE_SUBJECT_MODULE ?? null;
}

async function loadSubject() {
  const override = subjectModulePath();
  if (!override) {
    return loadVellora();
  }
  subjectModule ??= await import(pathToFileURL(override).href);
  return subjectModule;
}

/** Render finalized (already templated) HTML with the native engine, strict, fixed date. */
export async function renderNative(html, { pdfa, title } = {}) {
  const { renderPdf } = await loadSubject();
  const opts = {
    strict: true,
    metadata: { title: title ?? "vellora-fidelity-oracle", creationDate: FIXED_CREATION_DATE },
  };
  if (pdfa) {
    opts.pdfa = pdfa;
  }
  return renderPdf(html, undefined, opts);
}

export function velloraVersion() {
  return JSON.parse(readFileSync(join(REPO_ROOT, "packages", "vellora", "package.json"), "utf8"))
    .version;
}

/** Recorded in the environment block: which build produced the subject PDFs. */
export function subjectRendererRecord() {
  const override = subjectModulePath();
  return override
    ? {
        source: "VELLORA_ORACLE_SUBJECT_MODULE",
        module: override,
        label: process.env.VELLORA_ORACLE_SUBJECT_LABEL ?? null,
      }
    : { source: "this checkout", module: "vellora (workspace build)" };
}
