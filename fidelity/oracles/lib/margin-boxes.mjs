// @page margin-box text (CSS Paged Media 3, "page-margin boxes"): templates come from the HTML's
// own CSS, and each instance is removed from an extraction BY POSITION (one contiguous run on the
// page it belongs to), never by token identity.
//
// Why: Chrome's PDF and a vellora PDF both carry generated text such as "Página 2 de 3" that
// innerText never contains. Cancelling it by token identity lets a deleted body "de" pair with
// the footer's "de" and disappear (validator finding, 2026-10-21). Removing the footer run itself
// leaves every body occurrence of "de" in place, so a body loss stays a loss.
import { normalizeText, tokenize } from "./tokens.mjs";

/** The 16 page-margin boxes of CSS Paged Media 3, section 5.1. */
export const MARGIN_BOX_NAMES = Object.freeze([
  "top-left-corner",
  "top-left",
  "top-center",
  "top-right",
  "top-right-corner",
  "bottom-left-corner",
  "bottom-left",
  "bottom-center",
  "bottom-right",
  "bottom-right-corner",
  "left-top",
  "left-middle",
  "left-bottom",
  "right-top",
  "right-middle",
  "right-bottom",
]);
const MARGIN_BOXES = new Set(MARGIN_BOX_NAMES);

/** Index of the closing quote of the string opened at css[start] (or css.length). */
function skipString(css, start) {
  const quote = css[start];
  for (let i = start + 1; i < css.length; i += 1) {
    if (css[i] === "\\") {
      i += 1;
    } else if (css[i] === quote || css[i] === "\n") {
      return i;
    }
  }
  return css.length;
}

/** Index of the "}" closing the block whose "{" is at css[open]; strings are skipped. */
function matchBrace(css, open) {
  let depth = 0;
  for (let i = open; i < css.length; i += 1) {
    const c = css[i];
    if (c === '"' || c === "'") {
      i = skipString(css, i);
    } else if (c === "\\") {
      i += 1;
    } else if (c === "{") {
      depth += 1;
    } else if (c === "}") {
      depth -= 1;
      if (depth === 0) {
        return i;
      }
    }
  }
  return css.length;
}

/** Split a declaration block at top-level ";" (strings and parentheses respected). */
function declarations(block) {
  const out = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < block.length; i += 1) {
    const c = block[i];
    if (c === '"' || c === "'") {
      i = skipString(block, i);
    } else if (c === "\\") {
      i += 1;
    } else if (c === "(") {
      depth += 1;
    } else if (c === ")") {
      depth = Math.max(0, depth - 1);
    } else if (c === ";" && depth === 0) {
      out.push(block.slice(start, i));
      start = i + 1;
    }
  }
  out.push(block.slice(start));
  return out
    .map((decl) => {
      const colon = decl.indexOf(":");
      return colon === -1
        ? null
        : { property: decl.slice(0, colon).trim().toLowerCase(), value: decl.slice(colon + 1) };
    })
    .filter(Boolean);
}

/** Decode a CSS string token body (CSS Syntax 3, 4.3.7 escapes; "\\" + newline = continuation). */
export function decodeCssString(body) {
  let out = "";
  for (let i = 0; i < body.length; i += 1) {
    const c = body[i];
    if (c !== "\\") {
      out += c;
      continue;
    }
    const next = body[i + 1];
    if (next === undefined) {
      break;
    }
    if (next === "\n") {
      i += 1;
      continue;
    }
    const hex = body.slice(i + 1).match(/^[0-9a-fA-F]{1,6}/);
    if (hex) {
      const code = Number.parseInt(hex[0], 16);
      out += code === 0 || code > 0x10ffff ? "\uFFFD" : String.fromCodePoint(code);
      i += hex[0].length;
      if (/\s/.test(body[i + 1] ?? "")) {
        i += 1;
      }
      continue;
    }
    out += next;
    i += 1;
  }
  return out;
}

/**
 * Parse a `content` value into parts: { text } for strings, { counter: "page" | "pages" } for
 * decimal page counters, { none: true } for none/normal, { unknown } for anything else
 * (attr(), string(), element(), non-decimal counter styles, ...).
 */
export function parseContentValue(value) {
  const parts = [];
  const v = value.replace(/!\s*important\s*$/i, "").trim();
  let i = 0;
  while (i < v.length) {
    const c = v[i];
    if (/\s/.test(c)) {
      i += 1;
      continue;
    }
    if (c === '"' || c === "'") {
      const end = skipString(v, i);
      parts.push({ text: decodeCssString(v.slice(i + 1, end)) });
      i = end + 1;
      continue;
    }
    const ident = v.slice(i).match(/^-?[a-zA-Z_][\w-]*/);
    if (ident && v[i + ident[0].length] === "(") {
      const name = ident[0].toLowerCase();
      let depth = 0;
      let end = i + ident[0].length;
      for (; end < v.length; end += 1) {
        if (v[end] === '"' || v[end] === "'") {
          end = skipString(v, end);
        } else if (v[end] === "(") {
          depth += 1;
        } else if (v[end] === ")") {
          depth -= 1;
          if (depth === 0) {
            break;
          }
        }
      }
      const args = v
        .slice(i + ident[0].length + 1, end)
        .split(",")
        .map((arg) => arg.trim().toLowerCase());
      const style = args[1] ?? "decimal";
      if (
        name === "counter" &&
        (args[0] === "page" || args[0] === "pages") &&
        style === "decimal"
      ) {
        parts.push({ counter: args[0] });
      } else {
        parts.push({ unknown: v.slice(i, end + 1) });
      }
      i = end + 1;
      continue;
    }
    if (ident) {
      const word = ident[0].toLowerCase();
      parts.push(word === "none" || word === "normal" ? { none: true } : { unknown: ident[0] });
      i += ident[0].length;
      continue;
    }
    parts.push({ unknown: c });
    i += 1;
  }
  return parts;
}

function styleSheets(html) {
  return [...String(html).matchAll(/<style\b[^>]*>([\s\S]*?)<\/style\s*>/gi)].map((m) => m[1]);
}

/**
 * Margin-box templates declared in the HTML's <style> elements, from EVERY @page rule (a second
 * @page block is exactly what a renderer can miss, so the oracle must not share that bug).
 * A template is `removable` only when it is fully understood (strings + decimal page counters)
 * and its literal text contains a letter: a counters-only template ("1", "2/3") would be located
 * by identity among body digits, which is the failure mode this module exists to avoid.
 */
export function marginBoxTemplates(html) {
  const templates = [];
  const seen = new Set();
  for (const raw of styleSheets(html)) {
    const css = raw.replace(/\/\*[\s\S]*?\*\//g, "");
    for (const page of css.matchAll(/@page\b/gi)) {
      const open = css.indexOf("{", page.index);
      if (open === -1) {
        continue;
      }
      const selector = css.slice(page.index + page[0].length, open).trim();
      const close = matchBrace(css, open);
      const block = css.slice(open + 1, close);
      for (const rule of block.matchAll(/@([a-z-]+)\s*\{/gi)) {
        const position = rule[1].toLowerCase();
        if (!MARGIN_BOXES.has(position)) {
          continue;
        }
        const ruleOpen = rule.index + rule[0].length - 1;
        const body = block.slice(ruleOpen + 1, matchBrace(block, ruleOpen));
        const content = declarations(body)
          .filter((d) => d.property === "content")
          .at(-1);
        if (!content) {
          continue;
        }
        const parts = parseContentValue(content.value);
        if (parts.length === 0 || parts.some((p) => p.none)) {
          continue;
        }
        const literal = parts
          .map((p) => p.text ?? (p.counter ? `{${p.counter}}` : `{?${p.unknown}}`))
          .join("");
        const key = `${position}\u0000${literal}`;
        if (seen.has(key)) {
          continue;
        }
        seen.add(key);
        const unknown = parts.filter((p) => p.unknown).map((p) => p.unknown);
        const literalText = parts.map((p) => p.text ?? "").join("");
        let reason = null;
        if (unknown.length > 0) {
          reason = `unsupported content part(s): ${unknown.join(" ")}`;
        } else if (!/\p{L}/u.test(literalText)) {
          reason = "no literal letter: the run could only be located by token identity";
        }
        templates.push({
          id: `${selector ? `@page ${selector}` : "@page"} @${position}`,
          position,
          pageSelector: selector,
          literal,
          parts,
          removable: reason === null,
          reason,
        });
      }
    }
  }
  return templates;
}

/** Text of a template on page `page` of `pages` (decimal counters, CSS `counter()` default). */
export function instantiate(template, page, pages) {
  return template.parts
    .map((p) => p.text ?? (p.counter === "page" ? String(page) : String(pages)))
    .join("");
}

/**
 * Split extractor output into pages. pdftotext and pdfminer.six end EVERY page with "\f";
 * extract_text.py makes PyMuPDF do the same, so exactly one trailing "\f" is dropped.
 */
export function splitPages(text) {
  const raw = String(text);
  const body = raw.endsWith("\f") ? raw.slice(0, -1) : raw;
  return body.split("\f");
}

function findRun(tokens, removed, run) {
  const wanted = run.map((t) => t.toUpperCase());
  for (let start = 0; start + wanted.length <= tokens.length; start += 1) {
    let ok = true;
    for (let k = 0; k < wanted.length; k += 1) {
      if (removed[start + k] || tokens[start + k].toUpperCase() !== wanted[k]) {
        ok = false;
        break;
      }
    }
    if (ok) {
      return start;
    }
  }
  return -1;
}

/**
 * Remove margin-box runs from one extraction. For page p of N (N = this extraction's own page
 * count) each removable template is instantiated as "<text with p and N>", tokenized like the
 * extraction, and the first contiguous case-insensitive occurrence ON THAT PAGE is removed
 * (text-transform may upper-case a margin box). Only those token positions are dropped; every
 * other occurrence of the same tokens stays in the body.
 */
export function stripMarginBoxes(text, templates) {
  const pages = splitPages(text);
  const removable = templates.filter((t) => t.removable);
  const bodyTokens = [];
  const runs = [];
  pages.forEach((pageText, index) => {
    const tokens = tokenize(pageText);
    const removed = new Array(tokens.length).fill(false);
    for (const template of removable) {
      const instance = instantiate(template, index + 1, pages.length);
      const run = tokenize(instance);
      if (run.length === 0) {
        continue;
      }
      const at = findRun(tokens, removed, run);
      if (at !== -1) {
        for (let k = 0; k < run.length; k += 1) removed[at + k] = true;
        runs.push({ template: template.id, page: index + 1, text: normalizeText(instance) });
      }
    }
    tokens.forEach((token, k) => {
      if (!removed[k]) bodyTokens.push(token);
    });
  });
  return { pages: pages.length, bodyTokens, runs };
}

/**
 * Compare margin-box runs found in the control (Chrome's PDF) and the subject, per template.
 * `absent` lists templates with fewer runs in the subject than in the control.
 */
export function compareMarginBoxes(templates, control, subject) {
  const perTemplate = templates.map((template) => {
    const inControl = control ? control.runs.filter((r) => r.template === template.id) : [];
    const inSubject = subject.runs.filter((r) => r.template === template.id);
    return {
      template: template.id,
      literal: template.literal,
      removable: template.removable,
      reason: template.reason,
      controlRuns: inControl.length,
      subjectRuns: inSubject.length,
      controlPages: control?.pages ?? null,
      subjectPages: subject.pages,
      controlExamples: inControl.slice(0, 3).map((r) => r.text),
      subjectExamples: inSubject.slice(0, 3).map((r) => r.text),
    };
  });
  const absent = perTemplate
    .filter((t) => t.controlRuns > t.subjectRuns)
    .map((t) => ({
      template: t.template,
      missingRuns: t.controlRuns - t.subjectRuns,
      controlExamples: t.controlExamples,
    }));
  return { perTemplate, absent };
}
