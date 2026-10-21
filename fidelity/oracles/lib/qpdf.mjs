// PDF validity oracle: the qpdf CLI (`--check`, `--show-xref`) plus checks of the file's OWN
// structure that do not trust qpdf's (possibly reconstructed) view: the classic cross-reference
// table parsed from `startxref`, every in-use offset re-read, `%%EOF` present, and every
// FlateDecode stream inflated with its zlib Adler-32 check (ISO 32000-1 7.3.8.2, 7.4.4, 7.5.4,
// 7.5.5). qpdf repairs a damaged file silently enough that `--show-xref` returns the REPAIRED
// offsets and `--check` only warns, so a file qpdf had to reconstruct is a fail here.
//
// Install route (recorded per run in `route`): QPDF_BIN or a `qpdf` on PATH first (CI: apt
// `qpdf`), otherwise the locally built tools image (docker/tools.Dockerfile, Debian trixie
// qpdf=12.2.0-1). pikepdf's bundled libqpdf was rejected: it is the library, not the qpdf CLI
// whose exit-code contract is documented.
//
// qpdf exit codes (qpdf manual, "Exit Status"): 0 = no errors or warnings, 2 = errors,
// 3 = warnings only (file still processed).
import { readFileSync } from "node:fs";
import { basename, dirname } from "node:path";
import { inflateSync } from "node:zlib";
import { TOOLS_IMAGE, inspectImage, toolsRun } from "./docker.mjs";
import { findExecutable, run, versionLine } from "./exec.mjs";

async function qpdfRunner() {
  const host = await findExecutable("qpdf", "QPDF_BIN");
  if (host) {
    return {
      route: `host ${host}`,
      version: await versionLine(host),
      exec: (args, pdfPath) => run(host, [...args, pdfPath]),
    };
  }
  const image = await inspectImage(TOOLS_IMAGE);
  if (!image.available) {
    return { unavailable: `no host qpdf and ${image.reason}` };
  }
  const versionResult = await toolsRun(["qpdf", "--version"]);
  return {
    route: `docker ${TOOLS_IMAGE} (${image.id})`,
    version: versionResult.stdout.split("\n")[0].trim(),
    exec: (args, pdfPath) =>
      toolsRun(["qpdf", ...args, `/work/${basename(pdfPath)}`], {
        mounts: [{ host: dirname(pdfPath), container: "/work", readonly: true }],
      }),
  };
}

/** Parse `qpdf --show-xref` lines: "N/G: uncompressed; offset = X" / "N/G: compressed; stream = S, index = I". */
export function parseShowXref(stdout) {
  const entries = [];
  for (const line of stdout.split("\n")) {
    const uncompressed = line.match(/^(\d+)\/(\d+): uncompressed; offset = (\d+)/);
    if (uncompressed) {
      entries.push({
        object: Number(uncompressed[1]),
        generation: Number(uncompressed[2]),
        type: "uncompressed",
        offset: Number(uncompressed[3]),
      });
      continue;
    }
    const compressed = line.match(/^(\d+)\/(\d+): compressed; stream = (\d+), index = (\d+)/);
    if (compressed) {
      entries.push({
        object: Number(compressed[1]),
        generation: Number(compressed[2]),
        type: "compressed",
        stream: Number(compressed[3]),
        index: Number(compressed[4]),
      });
    }
  }
  return entries;
}

/**
 * Independent of qpdf's own (possibly reconstructing) parser: every uncompressed entry's offset
 * must lie inside the file and point at "N G obj" for the same N/G.
 */
export function xrefSanity(entries, bytes) {
  const problems = [];
  const decoder = new TextDecoder("latin1");
  for (const entry of entries) {
    if (entry.type !== "uncompressed") {
      continue;
    }
    if (entry.offset >= bytes.length) {
      problems.push(`${entry.object}/${entry.generation}: offset ${entry.offset} beyond EOF`);
      continue;
    }
    const window = decoder.decode(bytes.subarray(entry.offset, entry.offset + 32));
    const match = window.match(/^(\d+)\s+(\d+)\s+obj\b/);
    if (!match || Number(match[1]) !== entry.object || Number(match[2]) !== entry.generation) {
      problems.push(
        `${entry.object}/${entry.generation}: offset ${entry.offset} points at ${JSON.stringify(window.slice(0, 16))}`,
      );
    }
  }
  return problems;
}

/** Readers look for %%EOF in the last 1024 bytes (ISO 32000-1 7.5.5; Annex H implementation note). */
export const EOF_WINDOW = 1024;

/**
 * Parse the classic cross-reference section(s) of the file's own bytes: `startxref` -> "xref"
 * subsections -> trailer, following /Prev. Returns { kind, entries, trailerSize, problems };
 * kind "stream" (a cross-reference stream, ISO 32000-1 7.5.8) is reported as not parsed here.
 */
export function parseOwnXref(bytes) {
  const text = Buffer.from(bytes).toString("latin1");
  const problems = [];
  const tail = text.slice(-EOF_WINDOW);
  if (!tail.includes("%%EOF")) {
    problems.push(`no %%EOF in the last ${EOF_WINDOW} bytes`);
  }
  const at = text.lastIndexOf("startxref");
  const startxref = at === -1 ? null : text.slice(at).match(/^startxref\s+(\d+)/);
  if (!startxref) {
    problems.push("no startxref keyword with an offset");
    return { kind: "none", entries: [], problems };
  }
  const entries = [];
  const visited = new Set();
  let offset = Number(startxref[1]);
  const sectionOffset = offset;
  let trailerSize = null;
  let kind = "table";
  while (offset !== null) {
    if (visited.has(offset)) {
      problems.push(`/Prev loop at offset ${offset}`);
      break;
    }
    visited.add(offset);
    if (offset >= text.length) {
      problems.push(`xref offset ${offset} beyond EOF (${text.length} bytes)`);
      break;
    }
    const section = text.slice(offset);
    if (/^\d+\s+\d+\s+obj\b/.test(section)) {
      kind = "stream";
      break;
    }
    if (!section.startsWith("xref")) {
      problems.push(
        `startxref/Prev offset ${offset} points at ${JSON.stringify(section.slice(0, 16))}, not "xref"`,
      );
      break;
    }
    let cursor = 4;
    const trailerAt = section.indexOf("trailer");
    if (trailerAt === -1) {
      problems.push(`xref section at ${offset} has no trailer`);
      break;
    }
    const body = section.slice(cursor, trailerAt);
    const subsection = /(\d+)[ ]+(\d+)[ \t]*\r?\n/y;
    const entry = /(\d{10}) (\d{5}) ([nf])(?: \r| \n|\r\n)/y;
    cursor = 0;
    const skipWhite = () => {
      while (cursor < body.length && /\s/.test(body[cursor])) cursor += 1;
    };
    skipWhite();
    while (cursor < body.length) {
      subsection.lastIndex = cursor;
      const head = subsection.exec(body);
      if (!head) {
        problems.push(
          `xref section at ${offset}: unparsable subsection header ${JSON.stringify(body.slice(cursor, cursor + 20))}`,
        );
        break;
      }
      cursor = subsection.lastIndex;
      const first = Number(head[1]);
      const count = Number(head[2]);
      for (let k = 0; k < count; k += 1) {
        entry.lastIndex = cursor;
        const row = entry.exec(body);
        if (!row) {
          problems.push(
            `xref section at ${offset}: entry ${first + k} is not a 20-byte "nnnnnnnnnn ggggg n" row`,
          );
          cursor = body.length;
          break;
        }
        cursor = entry.lastIndex;
        entries.push({
          object: first + k,
          generation: Number(row[2]),
          type: row[3] === "n" ? "uncompressed" : "free",
          offset: Number(row[1]),
        });
      }
      skipWhite();
    }
    const trailer = section.slice(trailerAt, trailerAt + 4096);
    const size = trailer.match(/\/Size\s+(\d+)/);
    if (trailerSize === null && size) {
      trailerSize = Number(size[1]);
    }
    const prev = trailer.match(/\/Prev\s+(\d+)/);
    offset = prev ? Number(prev[1]) : null;
  }
  if (kind === "table" && trailerSize !== null) {
    const highest = entries.reduce((max, e) => Math.max(max, e.object), -1);
    if (highest + 1 > trailerSize) {
      problems.push(`xref lists object ${highest} but trailer /Size is ${trailerSize}`);
    }
  }
  return { kind, entries, trailerSize, sectionOffset, problems };
}

/** First filter name of a stream dictionary ("/Filter /F" or "/Filter [/F ...]"), or null. */
function firstFilter(dict) {
  const match = dict.match(/\/Filter\s*(?:\/([A-Za-z0-9]+)|\[\s*\/([A-Za-z0-9]+))/);
  return match ? (match[1] ?? match[2]) : null;
}

/**
 * Walk every in-use object of the parsed xref inside its own byte region (up to the next object
 * offset, or the xref section): the region must close with `endobj` (ISO 32000-1 7.3.10); a
 * stream must have `endstream` right after its /Length bytes (7.3.8.1); and every FlateDecode
 * stream must inflate with its zlib Adler-32 check (7.4.4; RFC 1950). qpdf --check does not
 * decode font streams, so a corrupt FontFile2 passed it (validator finding, CONFIRMED).
 * @param endOfObjects byte offset where the object area ends (the xref section), or EOF.
 * Returns { objects, streams, flate, problems }.
 */
export function checkObjects(bytes, entries, endOfObjects = bytes.length) {
  const buffer = Buffer.from(bytes);
  const text = buffer.toString("latin1");
  const inUse = entries
    .filter((e) => e.type === "uncompressed" && e.offset < text.length)
    .sort((a, b) => a.offset - b.offset);
  const byObject = new Map(inUse.map((e) => [e.object, e]));
  const problems = [];
  let streams = 0;
  let flate = 0;
  const resolveLength = (dict) => {
    const direct = dict.match(/\/Length\s+(\d+)(\s+(\d+)\s+R)?/);
    if (!direct) {
      return null;
    }
    if (!direct[2]) {
      return Number(direct[1]);
    }
    const target = byObject.get(Number(direct[1]));
    if (!target) {
      return null;
    }
    const value = text.slice(target.offset, target.offset + 64).match(/^\d+\s+\d+\s+obj\s+(\d+)/);
    return value ? Number(value[1]) : null;
  };
  inUse.forEach((entry, index) => {
    const header = text.slice(entry.offset, entry.offset + 32).match(/^\d+\s+\d+\s+obj\b/);
    if (!header) {
      return; // reported by xrefSanity
    }
    const next = inUse[index + 1]?.offset;
    const regionEnd = Math.min(
      next !== undefined && next > entry.offset ? next : endOfObjects,
      text.length,
    );
    const from = entry.offset + header[0].length;
    const region = text.slice(from, regionEnd);
    const keyword = region.match(/stream(\r\n|\n)/);
    const firstEndobj = region.indexOf("endobj");
    let bodyEnd = 0;
    if (keyword && (firstEndobj === -1 || keyword.index < firstEndobj)) {
      streams += 1;
      const dict = region.slice(0, keyword.index);
      const length = resolveLength(dict);
      const dataStart = from + keyword.index + keyword[0].length;
      if (length === null) {
        problems.push(`obj ${entry.object}: stream without a resolvable /Length`);
        return;
      }
      const after = text.slice(dataStart + length, dataStart + length + 12);
      if (!/^(\r\n|\r|\n)?endstream/.test(after)) {
        problems.push(
          `obj ${entry.object}: "endstream" does not follow /Length ${length} (found ${JSON.stringify(after.slice(0, 12))})`,
        );
      }
      bodyEnd = dataStart + length - from;
      if (firstFilter(dict) === "FlateDecode") {
        flate += 1;
        try {
          inflateSync(buffer.subarray(dataStart, dataStart + length));
        } catch (error) {
          problems.push(
            `obj ${entry.object}: FlateDecode data does not inflate (${error.message})`,
          );
        }
      }
    }
    if (region.indexOf("endobj", bodyEnd) === -1) {
      problems.push(`obj ${entry.object}: no "endobj" before the next object / xref section`);
    }
  });
  return { objects: inUse.length, streams, flate, problems };
}

/** qpdf output lines that mean it repaired the file instead of reading it as written. */
export const DAMAGE_PATTERN =
  /file is damaged|reconstruct|can't find startxref|xref not found|xref syntax invalid|unable to find trailer/i;

export async function qpdfOracle({ pdfPath }) {
  const runner = await qpdfRunner();
  if (runner.unavailable) {
    return { oracle: "qpdf", status: "not-run", reason: runner.unavailable };
  }
  const check = await runner.exec(["--check"], pdfPath);
  const xref = await runner.exec(["--show-xref"], pdfPath);
  const pages = await runner.exec(["--show-npages"], pdfPath);
  const bytes = readFileSync(pdfPath);
  const qpdfEntries = parseShowXref(xref.stdout);
  const own = parseOwnXref(bytes);
  // A cross-reference stream is not parsed here: fall back to re-reading qpdf's table (reported).
  const offsetEntries = own.kind === "table" ? own.entries : qpdfEntries;
  const sanityProblems = xrefSanity(offsetEntries, bytes);
  const objectCheck =
    own.kind === "none"
      ? { objects: 0, streams: 0, flate: 0, problems: [] }
      : checkObjects(bytes, offsetEntries, own.kind === "table" ? own.sectionOffset : undefined);
  const output = `${check.stdout}\n${check.stderr}`;
  const warnings = output
    .split("\n")
    .filter((line) => /WARNING|error/i.test(line))
    .map((line) => line.trim());
  const damage = output
    .split("\n")
    .filter((line) => DAMAGE_PATTERN.test(line))
    .map((line) => line.trim());
  const structuralProblems = [...own.problems, ...sanityProblems, ...objectCheck.problems];
  let status;
  if (
    check.code === 0 &&
    structuralProblems.length === 0 &&
    damage.length === 0 &&
    offsetEntries.length > 0
  ) {
    status = "pass";
  } else if (check.code === 3 && structuralProblems.length === 0 && damage.length === 0) {
    status = "warn";
  } else {
    status = "fail";
  }
  return {
    oracle: "qpdf",
    status,
    tool: { name: "qpdf", version: runner.version, route: runner.route },
    check: {
      exitCode: check.code,
      meaning: { 0: "no errors", 2: "errors", 3: "warnings" }[check.code] ?? "unexpected",
      stdout: check.stdout.trim(),
      stderr: check.stderr.trim(),
      warnings,
      damage,
    },
    xref: {
      exitCode: xref.code,
      entries: qpdfEntries.length,
      uncompressed: qpdfEntries.filter((e) => e.type === "uncompressed").length,
      compressed: qpdfEntries.filter((e) => e.type === "compressed").length,
      own: {
        kind: own.kind,
        parsedFrom:
          own.kind === "table"
            ? "the file's own classic xref table (startxref -> xref -> trailer, /Prev followed)"
            : "qpdf --show-xref (cross-reference stream: own parsing not implemented)",
        entries: own.entries.length,
        inUse: own.entries.filter((e) => e.type === "uncompressed").length,
        trailerSize: own.trailerSize ?? null,
        problems: own.problems,
      },
      sanityProblems,
    },
    objects: objectCheck,
    structuralProblems,
    pages: pages.code === 0 ? Number(pages.stdout.trim()) : null,
  };
}
