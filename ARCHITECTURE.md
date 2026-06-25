# Architecture

> **Status: pre-release / in active development.** This document describes the **design target** —
> not all of it is shipped. See the [status section](./README.md#status--roadmap) for what works today; forward-looking
> items below are marked _planned_.

## What vellora is

vellora renders **HTML to PDF for Node.js without a browser** — no Chromium, Puppeteer,
Playwright, wkhtmltopdf, or OS-level packages. `npm install` and it works.

It is built for **generated document HTML** — the input might be an invoice, receipt, statement,
boleto, notification, or another static template — **not** arbitrary interactive web pages. The
promise is narrow on purpose:
> Pass document HTML in, get a deterministic PDF out, with zero external runtime dependencies.

## Principles

1. **No browser, no `apt`, no sidecar.** A native addon ships inside the npm package; install just works.
2. **In-process.** Rendering runs *inside* the Node process via a napi-rs addon — no subprocess per render. Result: ~0 cold start, bounded memory, real concurrency. (This is the core difference from CLI-based tools that spawn a process per render.)
3. **Honest, curated subset.** vellora is not a browser clone. It renders a documented HTML/CSS subset and tells you — precisely — when your input leaves it. **Strict by default.**
4. **Deterministic.** Same template + data ⇒ byte-stable PDF. Fonts are bundled explicitly; system-font fallback is a warning/error, never silent.
5. **Own the glue, reuse the engine.** vellora owns a *thin* Rust integration layer over broad, battle-tested crates. It does **not** reimplement a layout engine.
6. **Performance first.** The render hot path does no template mutation. Diagnostics and structural fixes are a separate **dev-time** tool.

## Layered architecture

```
┌─ TypeScript (published) ─────────────────────────────────────────┐
│  vellora            renderPdf(html, data?, opts) → Uint8Array     │
│                     renderPdfToStream(html, writable, data?, opts) │
│                     templating: {{var}} · {% for/if %} ·          │
│                       helpers (currency / date / number)           │
│                     strict (default: validate, never mutate)       │
│                       · best-effort opt-in { strict: false }       │
│                                                                    │
│  @vellora/lint      DEV-TIME ONLY (never runs at render time):     │
│                     diagnose(html) → report   (rich, AI-agent-ready)│
│                     fix(html) → { html, report }                   │
│                       rules: inline-svg→PNG (resvg) · flex/grid-in- │
│                       td→table · img dims→CSS · asset bundling ·    │
│                       sanitize invalid markup                      │
│                                                                    │
│  @vellora/cli       vellora render · lint · fix --write            │
├─ native bridge ──────────────────────────────────────────────────┤
│  @vellora/native    napi-rs addon, in-process, async (libuv pool), │
│                     bounded + configurable concurrency, thread-safe │
│                     prebuilt: linux gnu+musl (x64/arm64), macOS     │
│                     (x64/arm64). No WASM, no Windows (for now).     │
├─ Rust core (ours) ───────────────────────────────────────────────┤
│  vellora-core       Blitz (html5ever + Stylo + Taffy + Parley)     │
│                       → OUR pagination layer (@page, fragmentation)│
│                       → krilla (font subset, tagged, PDF/A, PDF/UA)│
└──────────────────────────────────────────────────────────────────┘
       ▲ we own this          ▲ we reuse this (do not reimplement)
```

## Packages

| Package | Language | Published | Responsibility | Depends on |
|---|---|---|---|---|
| `vellora-core` | Rust | no (crate) | Drive Blitz headless → paginate → emit PDF via krilla. Strict-validation gate. The hard, valuable part. | Blitz, krilla, resvg |
| `vellora-napi` | Rust | no | napi-rs bindings around `vellora-core`; builds the `.node` addon. | vellora-core, napi |
| `@vellora/native` | prebuilt binaries | yes | Per-platform `.node` addons via `optionalDependencies`; tiny loader. No build tools for consumers. | — |
| `vellora` | TS | yes | Public API + templating engine. Orchestrates validation → native render. | @vellora/native, (@vellora/lint for best-effort) |
| `@vellora/lint` | TS | yes | **Dev-time** diagnose + fix (codemod). parse5 DOM + the fix rules. | parse5, @resvg/resvg-js |
| `@vellora/cli` | TS | yes | `render` / `lint` / `fix` commands for dev + CI. | vellora, @vellora/lint |

## Two pipelines, two moments

**Runtime — `renderPdf` (hot path, never mutates in strict):**
```
HTML + data
  → templating (interpolate {{var}}, {% for/if %}, format helpers)
  → strict validation gate (in vellora-core; cheap, parse already happens)
      └─ out-of-subset ⇒ throw VelloraUnsupportedError (points at node + "run vellora fix")
  → Blitz: parse → style (Stylo) → layout (Taffy) → text (Parley)
  → pagination: @page boxes (Página X de Y, running header/footer), fragmentation
  → krilla: font subset, selectable text, metadata (tagged / PDF-A / PDF-UA, bookmarks — planned)
  → Uint8Array  (or streamed)
```
`{ strict: false }` (best-effort) runs the `@vellora/lint` fixers *before* the core — for previews / non-critical output, paying the cost knowingly.

**Dev-time — `@vellora/lint` (authoring & CI, never at render):**
```
HTML
  → parse5 DOM
  → rules: inline-svg → PNG (resvg, in-process)
           flex/grid in <td> → nested table
           <img> width/height attrs → CSS
           remote assets → bundled; remote @font-face → warn ("provide via opts.fonts")
           sanitize invalid markup (mis-nested tags, malformed style=)
  → diagnose(): report only  |  fix(): { html, report }
```
The **report** is structured for AI agents: `{ rule, severity, autoFixable, location {line,col}, suggestedFix, snippet, compatLink }`. Run it via `vellora lint` / `vellora fix --write` locally and in CI; commit clean, subset-conforming templates.

> **Why dev-time, not runtime?** This is the linter/codemod model (ESLint `--fix`, Prettier, jscodeshift), the market norm for **trusted content you control**. Runtime rewriting (DOMPurify-style) is for *untrusted/dynamic* input. Fixing at authoring time gives performance (no fix cost per render), determinism (committed template = rendered output), and auditability (no silent changes to financial documents).

## Input & streaming

`renderPdf(html, data?, opts)` accepts `html` as **`string | Uint8Array | Readable`** — always
*content*, never a file path (no content-vs-path guessing, no path traversal). A `Readable` is a
convenience and is **buffered in full before rendering**. File paths are handled explicitly by the
CLI (`vellora render file.html`) or a helper (`vellora.fromFile(path)`).

There is **no constant-memory end-to-end stream** for HTML→PDF, by nature: layout and pagination
need the **complete** DOM (table column widths, fragmentation), and `counter(pages)` ("Página X de
Y") needs the **total** page count. Therefore:

- **Input is always fully buffered**, then parsed.
- **Output (today):** `renderPdfToStream(html, writable, …)` produces the complete PDF, then writes
  it to the Writable in a single write-and-end. The signature is the streaming-ready surface; the
  progressive emission below is the planned design.
- **Output (planned):** the engine lays out all pages, then emits page-by-page to the Writable
  (freeing each page's bytes) and finalizes the xref/trailer at the end, so the whole PDF is never
  held in memory — the footprint becomes the layout tree, not the serialized PDF.

For mass generation of *small* documents the win is **bounded concurrency + not buffering each PDF**,
not streaming.

## Dependency stack

The durable engineering lives in broad, well-backed crates that anyone can reuse:

- **Blitz** (DioxusLabs) — modular HTML/CSS renderer = `html5ever` (WHATWG parser, Servo) + **Stylo** (CSS cascade, powers Firefox) + **Taffy** (block/flex/grid layout; used by Zed, Bevy) + **Parley** + `harfrust` + `fontique` (text layout/shaping/fonts, Linebender). *Pre-alpha but actively funded.*
- **krilla** (Typst ecosystem) — high-level PDF: font subsetting, tagged PDF, PDF/A, PDF/UA, SVG; on top of `pdf-writer`. *Production.*
- **resvg** — strict SVG rasterizer (used at dev-time fix to turn inline SVG into PNG).

vellora composes these crates itself behind an **in-process napi addon**, rather than shelling out to an external CLI per render. That is what gives it the cold-start, memory, and concurrency profile of an in-process library. On top of the raw stack it adds the parts that make it a product: a **dev-time normalization + diagnostics** layer, **strict-by-default** behavior for documents, and a **public, versioned API** with a compatibility table.

## Performance model

- **Async on the libuv threadpool** — the addon never blocks the Node event loop; each render is isolated and thread-safe.
- **Bounded, configurable concurrency** — _planned_; per-render isolation and thread-safety already hold, which is what avoids the Puppeteer OOM failure mode.
- **Cache by content hash** — _planned_; parsed CSS, font metrics, and decoded image dimensions reused across renders of the same template/font/image (e.g. mass boleto generation from one template).
- **Streaming output** — _planned_; large documents written progressively (pairs with `renderPdfToStream`).
- **Phase timings** (`parse / style / layout / pagination / pdf`) — _planned_; available on demand, off the hot path.

## Non-goals

JavaScript execution · arbitrary web pages / pixel-parity with Chrome · CSS features outside the documented subset (full Grid, advanced multicol, 3D transforms, filters, animations) · a bundled-Chromium fallback (intentionally excluded) · a WASM build (Node-native only for now) · Windows prebuilds (for now).

## Honest risks

- **Blitz is pre-alpha** — layout fidelity is capped by Blitz; expect upstream churn.
- **The core integration is the real work** — driving Blitz headless into a paginated display list fed to krilla, plus thread-safety for concurrent napi calls, is where the engineering cost concentrates.
- **Subset coverage** — managed by an explicit, generated **compatibility table** and **strict diagnostics**, so expectations never silently mismatch Chrome.
