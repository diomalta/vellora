import type { RenderData, RenderOptions } from "vellora";
import { asArray, asString, bool } from "./args.js";
import { UsageError, messageOf } from "./errors.js";
import type { CliIo } from "./types.js";

export async function readInput(input: string, io: CliIo): Promise<string> {
  if (input === "-") {
    return io.readStdin();
  }
  return new TextDecoder().decode(await io.readFile(input));
}

async function readJson(path: string, io: CliIo): Promise<RenderData> {
  const text = new TextDecoder().decode(await io.readFile(path));
  try {
    const parsed = JSON.parse(text) as unknown;
    if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new Error("expected a JSON object");
    }
    return parsed as RenderData;
  } catch (cause) {
    throw new UsageError(`Invalid JSON data file ${JSON.stringify(path)}: ${messageOf(cause)}`);
  }
}

async function readImages(
  entries: string[],
  io: CliIo,
): Promise<Record<string, Uint8Array> | undefined> {
  if (entries.length === 0) {
    return undefined;
  }
  const images: Record<string, Uint8Array> = {};
  for (const entry of entries) {
    const split = entry.indexOf("=");
    if (split <= 0 || split === entry.length - 1) {
      throw new UsageError(`--image expects key=path, received ${JSON.stringify(entry)}`);
    }
    const key = entry.slice(0, split);
    const path = entry.slice(split + 1);
    images[key] = await io.readFile(path);
  }
  return images;
}

async function readFonts(paths: string[], io: CliIo): Promise<Uint8Array[] | undefined> {
  if (paths.length === 0) {
    return undefined;
  }
  return Promise.all(paths.map((path) => io.readFile(path)));
}

function parseEngine(value: string | undefined): RenderOptions["engine"] | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (value === "native" || value === "chromium" || value === "auto") {
    return value;
  }
  throw new UsageError(
    `--engine must be one of native, chromium, or auto; received ${JSON.stringify(value)}.`,
  );
}

function attachFidelityOptions(
  opts: RenderOptions,
  templateId: string | undefined,
  policyPath: string | undefined,
): void {
  if (templateId === undefined && policyPath === undefined) {
    return;
  }
  opts.fidelity = {};
  if (templateId !== undefined) {
    opts.fidelity.templateId = templateId;
  }
  if (policyPath !== undefined) {
    opts.fidelity.policyPath = policyPath;
  }
}

export async function buildRenderInputs(
  values: Record<string, string | boolean | string[] | undefined>,
  io: CliIo,
): Promise<{ data: RenderData | undefined; opts: RenderOptions }> {
  const data = values.data ? await readJson(String(values.data), io) : undefined;
  const opts: RenderOptions = {
    strict: !bool(values["no-strict"]),
  };
  const engine = parseEngine(asString(values.engine));
  if (engine !== undefined) {
    opts.engine = engine;
  }
  attachFidelityOptions(opts, asString(values["template-id"]), asString(values.policy));
  const title = asString(values.title);
  const creationDate = asString(values["creation-date"]);
  if (title !== undefined || creationDate !== undefined) {
    opts.metadata = {};
    if (title !== undefined) {
      opts.metadata.title = title;
    }
    if (creationDate !== undefined) {
      opts.metadata.creationDate = creationDate;
    }
  }
  const baseUrl = asString(values["base-url"]);
  if (baseUrl !== undefined) {
    opts.baseUrl = baseUrl;
  }
  const images = await readImages(asArray(values.image), io);
  if (images !== undefined) {
    opts.images = images;
  }
  const fonts = await readFonts(asArray(values.font), io);
  if (fonts !== undefined) {
    opts.fonts = fonts;
  }
  return { data, opts };
}
