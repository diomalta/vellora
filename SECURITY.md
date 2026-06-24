# Security Policy

vellora renders HTML/CSS to PDF **in-process** via a native (napi-rs) addon — there is no separate browser or sandbox process. When the HTML/CSS you pass to vellora is **untrusted**, it is parsed and laid out inside your own Node.js process (which may be a Lambda, an edge worker, or a long-lived API server). That changes the security posture from "a rendering bug" to "a potential host-process compromise vector," so we take reports seriously and ask you to disclose them privately.

## Reporting a Vulnerability

**Please do not open a public issue for security vulnerabilities.**

Report privately through **GitHub Private Vulnerability Reporting**:

1. Go to <https://github.com/diomalta/vellora/security/advisories/new>.
2. Describe the issue, the affected version(s), and reproduction steps (a minimal HTML/CSS input is ideal).

This keeps the report, triage discussion, fix, and any resulting advisory/CVE in one place tied to the repository.

If GitHub Private Vulnerability Reporting is unavailable to you, contact the maintainer at **diohmalta@gmail.com** with `vellora security` in the subject line, and we will open a private advisory on your behalf.

## Response SLA

vellora is a pre-release (`0.1.0-alpha`) project maintained by a small team, so the following are **best-effort, conservative targets**:

| Stage | Target |
| --- | --- |
| Acknowledge report | within 5 business days |
| Initial assessment / severity | within 10 business days |
| Fix or mitigation plan | depends on severity; communicated after assessment |

We will keep you informed through the advisory thread and credit you in the advisory unless you ask otherwise.

## Supported Versions

While vellora is in the `0.1.0-alpha` line, security fixes are applied to the **latest published release only**. Once a stable `1.x` line ships, this table will be expanded.

| Version | Supported |
| --- | --- |
| latest `0.1.0-alpha.*` | yes |
| older pre-releases | no |

## Threat Model

vellora's defining characteristic is that **untrusted HTML/CSS is parsed in the host process**. The relevant attack surfaces are:

### (a) Worker-thread panic

Malformed or adversarial HTML/CSS could trigger a panic inside the Rust addon. The addon runs rendering on a libuv worker thread and converts Rust errors into JavaScript exceptions rather than aborting; a panic that escaped this boundary could still terminate the host process. Reports of inputs that cause a panic (rather than a caught `VelloraError`) are in scope.

### (b) Denial of service (unbounded CPU/memory)

Pathological input — deeply nested elements, enormous documents, or layout that explodes combinatorially — could consume unbounded CPU or memory in the host process. As a first-line mitigation, vellora rejects pathological nesting **before** recursive layout: the `MAX_NESTING_DEPTH = 192` gate in [`crates/vellora-core/src/validation.rs`](crates/vellora-core/src/validation.rs) rejects documents whose element nesting exceeds that depth, preventing stack-exhaustion via recursion. Inputs that achieve unbounded CPU/memory consumption *despite* the validation gates are in scope.

### (c) Memory safety

The addon is written in Rust and uses `unsafe`/FFI at the napi boundary and depends on upstream rendering crates. Any memory-safety defect (use-after-free, out-of-bounds access, uninitialized reads) reachable from untrusted input is a high-severity issue and is in scope.

### (d) SSRF (remote image/font fetching)

**Current policy: vellora does not fetch remote resources.** Remote image and font URLs embedded in untrusted HTML/CSS are **not** fetched by the renderer; there is no network egress triggered by document content. This means a document cannot, today, be used to drive Server-Side Request Forgery through vellora. If a future release introduces opt-in remote fetching, it will be off by default and gated behind an explicit option, and this policy will be updated. A report demonstrating that document content triggers an unexpected network request is in scope.

## Out of Scope

- Vulnerabilities in your own application code or in how you source/sanitize the HTML you pass to vellora.
- Issues that require passing already-trusted, attacker-controlled configuration (not document content).
- Denial of service achieved only by passing inputs far larger than any documented limit on hardware you control, where the limits behaved as documented.
