#!/usr/bin/env node
/**
 * @vellora/cli executable (stub). Prints a banner; real `render`/`lint`/`fix` subcommands
 * arrive with later changes.
 */
export const banner = "vellora cli (stub) — render / lint / fix arrive in later phases";

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  process.stdout.write(`${banner}\n`);
}
