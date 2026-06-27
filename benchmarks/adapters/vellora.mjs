/**
 * vellora adapter — calls the PUBLIC `vellora` API (renderPdf), in-process.
 *
 * This is the subject under test. It runs in the same Node process; there is
 * no browser to launch and no worker to warm, which is the entire point of the
 * cold-start axis.
 *
 * GATED: the full render path landing must happen before this produces a real
 * PDF. Until then create() throws a clearly-labeled "not yet available" so the
 * runner records vellora as pending rather than fabricating a number.
 */
export const meta = {
  id: "vellora",
  kind: "in-process",
  longLivedMode: "in-process (public vellora API, no worker/browser)",
};

export async function create() {
  let renderPdf;
  let fixtureImages;
  let version = "unknown";
  try {
    // The public entry point, exactly as a consumer would import it.
    ({ renderPdf } = await import("vellora"));
    ({ fixtureImages } = await import("@vellora/test-harness"));
    const pkg = await import("vellora/package.json", { with: { type: "json" } }).catch(() => null);
    version = pkg?.default?.version ?? "0.1.0-alpha.0";
  } catch (err) {
    const e = new Error(
      `vellora adapter unavailable: the public render path is not built/published yet (depends on the full render path landing). Underlying: ${err?.message ?? err}`,
    );
    e.code = "ADAPTER_PENDING";
    throw e;
  }

  return {
    mode: meta.longLivedMode,
    version,
    /** @param {string} html @param {unknown} data @returns {Promise<Uint8Array>} */
    async render(html, data) {
      return renderPdf(html, data, {
        strict: true,
        images: fixtureImages("invoice"),
        metadata: { title: "benchmark-invoice", creationDate: "2026-01-01T00:00:00.000Z" },
      });
    },
    async close() {
      /* nothing to tear down — in-process */
    },
  };
}
