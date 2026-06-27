import { parseArgs } from "node:util";
import { parseRenderEnginePolicy, summarizeRenderEnginePolicy } from "vellora";
import { asString, bool } from "./args.js";
import { UsageError, messageOf } from "./errors.js";
import { printJson } from "./format.js";
import { type CliIo, EXIT_CODES, type ExitCode } from "./types.js";

export const FIDELITY_USAGE = "Usage: vellora fidelity --config vellora.fidelity.json [--json]\n";

export async function handleFidelity(args: string[], io: CliIo): Promise<ExitCode> {
  const parsed = parseArgs({
    args,
    allowPositionals: false,
    options: {
      config: { type: "string" },
      json: { type: "boolean" },
      help: { type: "boolean", short: "h" },
    },
  });
  if (bool(parsed.values.help)) {
    io.stdout(FIDELITY_USAGE);
    return EXIT_CODES.success;
  }
  const config = asString(parsed.values.config);
  if (!config) {
    throw new UsageError("fidelity requires --config <file>.");
  }
  const text = new TextDecoder().decode(await io.readFile(config));
  try {
    const summary = summarizeRenderEnginePolicy(parseRenderEnginePolicy(text, config));
    if (bool(parsed.values.json)) {
      io.stdout(printJson({ config, valid: true, ...summary }));
    } else {
      io.stdout(
        `Fidelity policy ok: ${summary.templates} template(s), ${summary.native} native, ${summary.chromium} chromium.\n`,
      );
    }
    return EXIT_CODES.success;
  } catch (cause) {
    throw new UsageError(messageOf(cause));
  }
}
