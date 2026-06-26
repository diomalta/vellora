@/Users/diomalta/.codex/RTK.md

# AGENTS.md

This repository also keeps durable agent guidance in `CLAUDE.md`. Read it before
making changes; it is the source of truth for the product shape, commands,
architecture, invariants, testing model, and research discipline.

## Core Operating Rule

vellora is a research-and-development project for production HTML-to-PDF
rendering. Facts are the core material here. Before giving an explanation, fix,
recommendation, benchmark claim, architecture direction, or tool choice, verify
the real source: code, tests, generated artifacts, benchmark output, upstream
source/docs, specifications, papers, package metadata, or reproducible commands.

Label claims explicitly when the answer depends on evidence:

- `CONFIRMED` - backed by current evidence you checked in this turn.
- `UNVERIFIED ASSUMPTION` - plausible, but not checked.
- `HYPOTHESIS` - a candidate explanation that still needs proof.
- `DESIGN TARGET` - intended behavior that may not be shipped yet.

If you cannot verify something, say: "I don't know yet; here's how I'd find out."
Then name the smallest concrete check, measurement, benchmark, source read, or
experiment that would settle it.

## Research Standard

- Prefer primary sources: specs, upstream repositories, upstream docs, source
  code, benchmark harnesses, issue trackers, changelogs, and papers.
- Re-check drift-prone facts live: package availability, versions, licenses,
  project activity, benchmarks, security posture, and competitor behavior.
- Never publish or repeat performance numbers unless they come from the
  repository benchmark harness or are clearly labeled as external and
  unverified.
- Keep shipped reality separate from roadmap/design target. `README.md`,
  `ARCHITECTURE.md`, and docs can describe intent; the code and tests define
  what works today.
- Root-cause work requires evidence. Read the actual code/data, reproduce the
  failure, or state exactly what is still unknown.
- For PDF/CSS/layout behavior, verify against the implementation, generated
  artifacts, the relevant specs, and a real comparison target such as Chromium
  through the existing fidelity harness when appropriate.
