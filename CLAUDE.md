# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

**vellora** renders document HTML → PDF for Node.js. The default renderer is **native and
in-process, with no browser** (no Chromium / Puppeteer / wkhtmltopdf / subprocess). It is a Rust +
TypeScript monorepo: a thin Rust glue layer over Blitz (layout) + krilla (PDF emit), exposed to Node
through a napi-rs addon, with a TS public API, templating engine, dev-time HTML linter/codemod, CLI,
and an optional Chromium/Chrome fidelity engine for templates that explicitly opt into browser output.

> **Pre-release.** `README.md` / `ARCHITECTURE.md` can describe both shipped behavior and roadmap.
> Current code/tests are the source of truth. As of this worktree, the implemented surface includes
> `metadata` (`title`, `creationDate`), `pdfa: "PDF/A-2b"`, `images` + `baseUrl`, `fonts`,
> `renderPdfBatch`, `renderPdfToStream` (buffered write), `engine: "chromium"`, and
> `engine: "auto"` fidelity policies. Don't assume a documented feature is wired — check code/tests.

## Research and evidence discipline

This is a research-and-development project for a production HTML-to-PDF renderer. Facts are the core
material. Every implementation choice, benchmark claim, compatibility statement, architecture direction,
and recommendation must be traceable to current evidence.

Use this protocol before explaining, fixing, recommending, or changing direction:

- **Verify current reality first.** Read the actual code, tests, generated artifacts, benchmark output,
  upstream source/docs, specifications, papers, package metadata, or reproducible command output. Do not
  rely on docs alone; docs can describe the design target.
- **Label claims when evidence matters.** Use `CONFIRMED` for facts checked in the current turn,
  `UNVERIFIED ASSUMPTION` for plausible but unchecked claims, `HYPOTHESIS` for candidate explanations,
  and `DESIGN TARGET` for intended behavior that may not be shipped.
- **Say what is unknown.** If the evidence is missing, say "I don't know yet; here's how I'd find out"
  and name the smallest concrete check, benchmark, source read, or experiment that would settle it.
- **Research before selecting tools or approaches.** For engines, crates, PDF behavior, HTML/CSS support,
  layout algorithms, accessibility/PDF-A/PDF-UA, performance claims, or competitor comparisons, prefer
  primary sources: specs, upstream repos/docs, source code, reproducible benchmarks, issue trackers,
  changelogs, and papers.
- **Re-check drift-prone facts live.** Package availability, versions, licenses, maintainer activity,
  benchmark results, security posture, and competitor behavior can change; verify them before treating
  them as current.
- **Keep benchmark honesty strict.** Only publish numbers from the repo's reproducible harness or clearly
  label them as external/unverified. Include environment, versions, command, date, median/p95 where
  relevant, and losses as well as wins.
- **Root causes require proof.** A fix plan should identify the verified source of the behavior in code,
  data, traces, or measurements. If the cause is not proven, call it a hypothesis and design the next
  measurement before changing production logic.
- **Separate shipped reality from roadmap.** The code and tests define what works today. README,
  ARCHITECTURE, OpenSpec, and docs may describe the destination; keep that distinction explicit in every
  answer and documentation change.

## Commands

Run from the repo root. Node 22 (`.nvmrc`), Rust pinned to 1.96.0 (`rust-toolchain.toml`).

| Task | Command |
|---|---|
| Full build (Rust → addon → TS, in this order) | `npm run build` |
| Build TS only | `npm run build:ts` |
| Build the native `.node` addon only | `npm -w @vellora/native run build:addon` |
| All tests (Rust + TS) | `npm test` |
| Rust tests only | `npm run test:rust` (`cargo test`) |
| TS tests only | `npm run test:ts` (`vitest run`) |
| Lint (clippy `-D warnings` + `cargo fmt --check` + `biome check`) | `npm run lint` |
| Format (biome + `cargo fmt`) | `npm run format` |
| Remove all build output | `npm run clean` |

**Single test:**
- TS, one file: `npx vitest run packages/vellora/test/render.test.ts`
- TS, by name: `npx vitest run -t "strict validates and never mutates"` · watch: `npx vitest packages/lint`
- Rust, one crate: `cargo test -p vellora-core` · one integration file: `cargo test -p vellora-core --test pagination_correctness` · by substring: `cargo test -p vellora-core <name>`

**Build ordering matters.** The full chain is `cargo build --release` → `napi build` (emits
`packages/native/vellora.<platform>.node`) → `tsc` per package. If you change Rust, the addon is stale
until you rebuild it. Tests that use the **real** bridge (`packages/native/test/*`,
`packages/vellora/test/real-stack.test.ts`) require the `.node` to exist — run `npm run build` first or
they throw an "unsupported platform / build locally" loader error. Most other TS tests use the mock and
don't (see Testing model).

Run the end-to-end example after a build: `node examples/render-invoice.ts` (Node 22.6+ strips the TS).

## Layout

```
crates/vellora-core   Rust: the engine. Blitz layout → our pagination → krilla PDF. The hard part.
crates/vellora-napi   Rust: cdylib napi-rs binding around vellora-core (async, thread-safe).
packages/vellora      TS, published: public API (renderPdf), templating, strict orchestration.
packages/native       TS, published: loads the per-platform .node; exposes async render().
packages/lint         TS, published: DEV-TIME diagnose()/fix() codemods (parse5 + resvg).
packages/cli          TS, published: vellora render/lint/fix.
packages/engine-chromium TS, published: optional Chromium/Chrome bridge for explicit fidelity mode.
packages/test-harness  TS, private: fixture loader + byte-exact golden harness.
fixtures/             Neutral, owned HTML+JSON fixtures (invoice/receipt/boleto/notification).
openspec/             Spec-driven change workflow — see "How changes are made".
```

Dependency direction: `cli` → `vellora` → {`@vellora/native`, `@vellora/lint`, optional
`@vellora/engine-chromium`}; `@vellora/native` loads the `.node` from `vellora-napi` →
`vellora-core`.

## Architecture

**Runtime pipeline** (`renderPdf`, the hot path):
`normalizeInput` → `renderTemplate` (`{{var}}`, `{% for/if %}`, currency/date/number helpers) →
engine selection (`native`, `chromium`, or `auto` policy) → `orchestrate` (strict gate) →
`NativeBridge.render` → PDF `Uint8Array`.

**Rust core** (`crates/vellora-core/src/lib.rs::render`): `validate_css` (cheap byte scan) →
`validate_nesting_depth` (stack-overflow guard, SEC-1) → font validation →
`page_css::parse_page_box` → `blitz_engine::validate_then_lay_out` (**one** Blitz parse shared by
the element gate *and* layout, with caller-supplied images/fonts) → unresolved-image rejection →
`pagination::paginate` (page breaks, repeated `<thead>`, `counter(pages)`) → `pdf::emit` (krilla).

**napi binding** (`crates/vellora-napi/src/lib.rs`): one async `render(html, opts) → Promise<Uint8Array>`
on the libuv pool via `AsyncTask`. No shared mutable state, so N concurrent renders == N sequential. The
`!Send` Blitz document never escapes the synchronous core call. `catch_unwind` turns an unwinding panic
into a rejected promise (relies on `panic = "unwind"`).

### The swappable native bridge (most important pattern to know)

`NativeBridge` (`packages/vellora/src/types.ts`) is the single, narrow seam between TS and Rust:
`render(html: string, opts) → Promise<Uint8Array>`. Main implementations:
- `NativeAddonBridge` — production default; lazy-loads `@vellora/native` on first render.
- `MockNativeBridge` — deterministic stub PDF bytes; backs almost all TS tests.
- `@vellora/engine-chromium` — optional browser-fidelity bridge for explicit Chromium routing.

Swap it with `setNativeBridge(...)` or per-call via the internal `_bridge` option.

## Invariants — do not break these

- **Determinism: same input ⇒ byte-identical PDF.** No wall-clock, no `Math.random()`, no system-font
  fallback. An omitted creation date defaults to the fixed constant `DEFAULT_CREATION_DATE`
  (`2000-01-01`), never `new Date()`. Goldens are compared byte-for-byte.
- **Strict-by-default never mutates.** `strict: true` (default) passes templated HTML to the bridge
  byte-unchanged and **must never even import `@vellora/lint`**. Only `strict: false` lazily imports it
  and runs fixers first. `@vellora/lint` is dev-time/CI tooling, never on the render path.
- **All Blitz contact goes through `crates/vellora-core/src/blitz_engine.rs`.** Blitz is pinned to a git
  rev (pre-alpha, churns); funneling keeps an upstream break to one file. Don't import Blitz elsewhere.
- **`panic = "unwind"` in the workspace `[profile.release]` is mandatory** (it's workspace-wide, not
  per-member). The napi panic-to-rejection contract depends on it. Cargo.toml says so explicitly.
- **The located-diagnostic contract `{ feature, line, col, hint }`** crosses the napi boundary as error
  properties and becomes `VelloraUnsupportedError`. The `feature` taxonomy (`element:<tag>`,
  `css:<feature>`) must be identical whether a construct is rejected by the Rust core gate or mapped from
  a lint rule via `RULE_ID_TO_CORE_FEATURE` (`packages/vellora/src/orchestrate.ts`). Adding an
  out-of-subset rule means updating **both** the core gate and that map so they agree.

## Testing model

`vitest.config.ts` runs `packages/vellora/test/_setup-bridge.ts`, which calls
`setNativeBridge(new MockNativeBridge())` in `beforeEach`. Consequences:
- TS unit tests render against the **mock** — no Rust build required, fully deterministic.
- The mock mirrors the core gate's diagnostic **shape only**, with intentionally different feature labels
  and ordering (see its header comment). **Assert only the diagnostic shape against the mock**, never
  exact `feature`/`line`/`col`. Real source-fidelity is proven in `real-stack.test.ts` over the real addon.
- `real-stack.test.ts` and `packages/native/test/*` need the built `.node` (`npm run build` first).
- Golden files compare bytes exactly; regenerate intentionally with `UPDATE_GOLDENS=1` (never auto-written).

## How changes are made (OpenSpec)

> Note: `openspec/` is internal and not published (it is gitignored), so its files and the design
> tags below are not visible to readers of the public repo — they document the maintainers' workflow.

This repo uses a spec-driven workflow under `openspec/`. Each change lives in
`openspec/changes/<id>/` (`proposal.md`, `design.md`, `tasks.md`, `specs/`); `openspec/PLAN.md` is the
master execution plan and `openspec/specs/` holds the source-of-truth capabilities. The five changes map
to the roadmap: `scaffold-monorepo`, `core-render-invoice`, `native-render-bridge`, `lint-diagnose-fix`,
`public-api-templating`.

Source comments reference these change IDs plus design tags (`D1`, `EH-3`, `SEC-1`, `R8`, …) as
**cross-change contracts** — when a comment cites one, that behavior was deliberate and is covered by a
spec scenario; preserve it (and its regression test) rather than "simplifying" it away. Design rationale
for a non-obvious decision is usually in the relevant `openspec/changes/<id>/design.md`. The
`openspec-propose` / `opsx:apply` / `opsx:archive` skills drive this workflow.
