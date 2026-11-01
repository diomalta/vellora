/**
 * vellora on Cloudflare Workers: render the example invoice to PDF per request.
 *
 * The code is the same as on Node.js. On workerd, `vellora` resolves its engine to the WebAssembly
 * build (`@vellora/wasm`, through the `workerd` export condition) instead of the native addon.
 *
 *   npm install && npm run dev      # then open http://localhost:8787/
 */
import { VelloraUnsupportedError, renderPdf } from "vellora";
import logo from "../../../fixtures/invoice/assets/logo.png";
import data from "../../../fixtures/invoice/data.json";
import template from "../../../fixtures/invoice/index.html";

const images = { "assets/logo.png": new Uint8Array(logo as ArrayBuffer) };

export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === "/strict") {
      // Out-of-subset input fails with the same typed, located error as on Node.js.
      try {
        await renderPdf("<div><script>alert(1)</script>oops</div>");
        return new Response("unexpected: rendered", { status: 500 });
      } catch (err) {
        if (err instanceof VelloraUnsupportedError) {
          return Response.json({
            feature: err.feature,
            line: err.line,
            col: err.col,
            hint: err.hint,
          });
        }
        throw err;
      }
    }

    const pdf = await renderPdf(template as string, data, {
      images,
      metadata: { title: `Fatura ${data.invoice.number}`, creationDate: "2026-06-22" },
    });
    return new Response(pdf, {
      headers: {
        "content-type": "application/pdf",
        "content-disposition": `inline; filename="${data.invoice.number}.pdf"`,
      },
    });
  },
};
