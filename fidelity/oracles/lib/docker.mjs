// Docker routing for the Linux-only / JVM oracles. Nothing here pushes, logs in, or talks to a
// registry except `docker pull` of the pinned veraPDF image when the caller asks for it.
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { findExecutable, run } from "./exec.mjs";
import { ORACLES_DIR } from "./paths.mjs";

/** Locally built tools image (qpdf, zbarimg, WeasyPrint); see docker/tools.Dockerfile. */
export const TOOLS_IMAGE =
  process.env.VELLORA_FIDELITY_TOOLS_IMAGE ?? "vellora-fidelity-tools:local";
export const TOOLS_DOCKERFILE = join(ORACLES_DIR, "docker", "tools.Dockerfile");

/**
 * Official veraPDF CLI image, pinned by digest. veraPDF 1.30.3 (built 2026-10-07); the image is
 * published for linux/amd64 only, so on Apple Silicon it runs under emulation (recorded).
 */
export const VERAPDF_IMAGE =
  process.env.VELLORA_FIDELITY_VERAPDF_IMAGE ??
  "verapdf/cli:v1.30.3@sha256:d565095c67a083e693aebf7d1a15784007370571053fc1aa5b502665b9a78f9c";
export const VERAPDF_PLATFORM = "linux/amd64";

let dockerBinary;

export async function docker() {
  if (dockerBinary === undefined) {
    dockerBinary = await findExecutable("docker", "DOCKER_BIN");
  }
  return dockerBinary;
}

/** Content hash of the tools image recipe (Dockerfile + lock), recorded next to the image ID. */
export function toolsRecipeSha256() {
  const hash = createHash("sha256");
  hash.update(readFileSync(TOOLS_DOCKERFILE));
  hash.update(readFileSync(join(ORACLES_DIR, "docker", "requirements-weasyprint.txt")));
  return hash.digest("hex");
}

/**
 * Reason for a failed `docker image inspect`. "Error response from daemon: No such image" comes
 * FROM the daemon, so it means the image is missing, not that the daemon is down (the previous
 * /daemon/ test reported a missing image as "daemon not reachable").
 */
export function inspectFailureReason(image, stderr) {
  const text = String(stderr).trim();
  if (/No such image|No such object|not found/i.test(text)) {
    return `image ${image} not present locally (build/pull it first; see fidelity/oracles/README.md)`;
  }
  if (
    /Cannot connect to the Docker daemon|Is the docker daemon running|error during connect/i.test(
      text,
    )
  ) {
    return `docker daemon not reachable: ${text}`;
  }
  return `docker image inspect ${image} failed: ${text || "no output"}`;
}

/**
 * Inspect a local image. Returns { available: true, id, architecture } or
 * { available: false, reason } — callers turn the reason into a "not-run" verdict.
 */
export async function inspectImage(image) {
  const bin = await docker();
  if (!bin) {
    return { available: false, reason: "docker CLI not found on PATH (set DOCKER_BIN)" };
  }
  let result;
  try {
    result = await run(bin, ["image", "inspect", image, "--format", "{{.Id}} {{.Architecture}}"]);
  } catch (error) {
    return { available: false, reason: `cannot run ${bin}: ${error.message}` };
  }
  if (result.code !== 0) {
    return { available: false, reason: inspectFailureReason(image, result.stderr) };
  }
  const [id, architecture] = result.stdout.trim().split(" ");
  return { available: true, id, architecture };
}

/**
 * `docker run --rm --network none` with bind mounts. The network is disabled so no oracle can
 * fetch anything (WeasyPrint would otherwise resolve remote URLs).
 */
export async function dockerRun(image, args, { mounts = [], platform, timeoutMs, user } = {}) {
  const bin = await docker();
  if (!bin) {
    throw new Error("docker CLI not found");
  }
  const dockerArgs = ["run", "--rm", "--network", "none"];
  if (platform) {
    dockerArgs.push("--platform", platform);
  }
  if (user) {
    dockerArgs.push("--user", user);
  }
  for (const mount of mounts) {
    dockerArgs.push("-v", `${mount.host}:${mount.container}${mount.readonly ? ":ro" : ""}`);
  }
  dockerArgs.push(image, ...args);
  return run(bin, dockerArgs, { timeoutMs });
}

/** Run a shell entrypoint inside the tools image (its default entrypoint is the Python image's). */
export function toolsRun(args, options) {
  return dockerRun(TOOLS_IMAGE, args, options);
}
