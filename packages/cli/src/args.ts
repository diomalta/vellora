import { UsageError } from "./errors.js";

export function asArray(value: string | string[] | boolean | undefined): string[] {
  if (value === undefined || typeof value === "boolean") {
    return [];
  }
  return Array.isArray(value) ? value : [value];
}

export function asString(value: string | string[] | boolean | undefined): string | undefined {
  return typeof value === "string" ? value : undefined;
}

export function bool(value: string | boolean | string[] | undefined): boolean {
  return value === true;
}

export function requireSingleInput(command: string, positionals: string[]): string {
  if (positionals.length === 0) {
    throw new UsageError(`${command} requires <input|->.`);
  }
  if (positionals.length > 1) {
    throw new UsageError(
      `${command} accepts exactly one <input|->, received ${positionals.length}: ${positionals.map((value) => JSON.stringify(value)).join(", ")}.`,
    );
  }
  return positionals[0] as string;
}

export function optionalPositiveNumber(
  value: string | undefined,
  name: string,
  fallback: number,
): number {
  if (value === undefined) {
    return fallback;
  }
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new UsageError(`${name} must be a positive number; received ${JSON.stringify(value)}.`);
  }
  return parsed;
}

export function optionalNonNegativeNumber(
  value: string | undefined,
  name: string,
  fallback: number,
): number {
  if (value === undefined) {
    return fallback;
  }
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new UsageError(`${name} must be a number >= 0; received ${JSON.stringify(value)}.`);
  }
  return parsed;
}
