/**
 * Gotenberg adapter — INTENDED LONG-LIVED MODE.
 *
 * Gotenberg's production shape is a STANDING HTTP SERVICE (a container holding
 * a warm Chromium pool). This adapter drives that service over HTTP; it does
 * NOT spawn a process per render. The container is started out-of-band:
 *
 *   docker run --rm -p 3000:3000 gotenberg/gotenberg:8.11.1
 *
 * The endpoint is read from config (GOTENBERG_URL). create() probes /health so
 * a missing service surfaces as ADAPTER_PENDING rather than a timing of zero.
 */
export const meta = {
  id: "gotenberg",
  kind: "http-service",
  longLivedMode: "standing HTTP service (Chromium pool inside the container)",
};

/**
 * @param {{ endpoint?: string, image?: string }} [opts]
 */
export async function create(opts = {}) {
  const endpoint = opts.endpoint ?? process.env.GOTENBERG_URL ?? "http://localhost:3000";
  const image = opts.image ?? "gotenberg/gotenberg:8.11.1";

  let version = image; // fall back to the pinned image tag as the version identity
  try {
    const health = await fetch(`${endpoint}/health`);
    if (!health.ok) throw new Error(`health ${health.status}`);
    const ver = await fetch(`${endpoint}/version`).catch(() => null);
    if (ver?.ok) version = (await ver.text()).trim() || image;
  } catch (err) {
    const e = new Error(
      `Gotenberg service not reachable at ${endpoint}. ` +
        `Start it with: docker run --rm -p 3000:3000 ${image}. ` +
        `Underlying: ${err?.message ?? err}`,
    );
    e.code = "ADAPTER_PENDING";
    throw e;
  }

  return {
    mode: meta.longLivedMode,
    version,
    image,
    /** @param {string} html @returns {Promise<Uint8Array>} */
    async render(html) {
      const form = new FormData();
      // Gotenberg's Chromium route expects an index.html part.
      form.append("files", new Blob([html], { type: "text/html" }), "index.html");
      form.append("paperWidth", "8.27"); // A4 inches
      form.append("paperHeight", "11.69");
      const res = await fetch(`${endpoint}/forms/chromium/convert/html`, {
        method: "POST",
        body: form,
      });
      if (!res.ok) throw new Error(`Gotenberg convert failed: ${res.status}`);
      return new Uint8Array(await res.arrayBuffer());
    },
    async close() {
      /* the service is owned/torn down externally (CI / docker) */
    },
  };
}
