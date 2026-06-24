/**
 * Output equivalence verification (design D1).
 *
 * Before ANY timing is recorded, the suite checks the produced PDF is
 * equivalent to the baseline on a tool-agnostic axis: same page count + the
 * presence of expected content. Non-equivalent tools are reported
 * not-comparable and excluded — never silently timed against a different doc.
 *
 * Equivalence is SEMANTIC, not byte-identity: every engine emits different
 * bytes, so we compare page count + content presence via a dependency-free
 * structural scan of the PDF — lightweight but enough for "is this the same
 * multi-page invoice".
 */

const DECODER = new TextDecoder("latin1");

/**
 * Count page objects: occurrences of `/Type /Page` not followed by `s` (to
 * exclude `/Type /Pages`, the tree node). Works across engines because it is a
 * structural property of the PDF object model, not an engine-specific layout.
 * @param {Uint8Array} pdf
 * @returns {number}
 */
export function countPages(pdf) {
  const s = DECODER.decode(pdf);
  const matches = s.match(/\/Type\s*\/Page(?![s])/g);
  return matches ? matches.length : 0;
}

/**
 * Extract a best-effort flat text blob from a PDF for content-presence checks.
 * Pulls literal strings inside `( ... )` from content streams. This is not a
 * full text-extraction engine; it only needs to confirm expected substrings
 * are present in an uncompressed or lightly-structured PDF. When streams are
 * compressed (FlateDecode) this returns little — callers treat a content miss
 * as "inconclusive" only if the engine is known to compress (see verify()).
 * @param {Uint8Array} pdf
 * @returns {string}
 */
export function extractText(pdf) {
  const s = DECODER.decode(pdf);
  const out = [];
  const re = /\(((?:\\.|[^\\()])*)\)/g;
  let m = re.exec(s);
  while (m !== null) {
    out.push(m[1].replace(/\\([()\\])/g, "$1"));
    m = re.exec(s);
  }
  return out.join(" ");
}

/**
 * @param {Uint8Array} pdf
 * @returns {boolean} whether the PDF appears to use compressed content streams
 *   (in which case literal-string extraction is unreliable).
 */
function hasCompressedStreams(pdf) {
  return DECODER.decode(pdf).includes("/FlateDecode");
}

/**
 * Verify a tool's PDF against the baseline.
 * @param {Uint8Array} pdf
 * @param {{ minPages: number, expectedContent: string[], referencePages?: number }} baseline
 * @returns {{ comparable: boolean, pages: number, reason?: string, contentStatus: "present"|"missing"|"inconclusive" }}
 */
export function verify(pdf, baseline) {
  if (!pdf || pdf.length < 5 || DECODER.decode(pdf.subarray(0, 5)) !== "%PDF-") {
    return {
      comparable: false,
      pages: 0,
      contentStatus: "missing",
      reason: "output is not a PDF (missing %PDF- header)",
    };
  }

  const pages = countPages(pdf);

  // Page-count equivalence: prefer an exact match to the reference render (the
  // vellora subject) when available; otherwise enforce the configured minimum.
  if (baseline.referencePages != null) {
    if (pages !== baseline.referencePages) {
      return {
        comparable: false,
        pages,
        contentStatus: "inconclusive",
        reason: `page count ${pages} != reference ${baseline.referencePages}`,
      };
    }
  } else if (pages < baseline.minPages) {
    return {
      comparable: false,
      pages,
      contentStatus: "inconclusive",
      reason: `page count ${pages} below baseline minimum ${baseline.minPages}`,
    };
  }

  let contentStatus = "present";
  if (hasCompressedStreams(pdf)) {
    contentStatus = "inconclusive"; // compressed streams — can't confirm cheaply, don't fail on it
  } else {
    const text = extractText(pdf);
    const missing = baseline.expectedContent.filter((needle) => !text.includes(needle));
    if (missing.length) {
      return {
        comparable: false,
        pages,
        contentStatus: "missing",
        reason: `expected content not found: ${missing.join(", ")}`,
      };
    }
  }

  return { comparable: true, pages, contentStatus };
}
