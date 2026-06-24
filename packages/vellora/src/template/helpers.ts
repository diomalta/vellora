/**
 * Deterministic format helpers: `currency`, `number`, `date`.
 *
 * Determinism is the hard constraint (ARCHITECTURE.md: same template + data ⇒ byte-stable PDF):
 * helpers NEVER read the host's ambient `Intl` locale or `TZ`. `currency`/`number` use
 * `Intl.NumberFormat` with an explicitly pinned locale; `date` parses the instant as UTC and formats
 * via an explicit format string in UTC. Output is escaped by the interpolation layer like any value.
 */
import { VelloraTemplateError } from "../errors.js";

/** Locale pinned per currency so output is machine-independent. Extend as currencies are added. */
const CURRENCY_LOCALE: Record<string, string> = {
  BRL: "pt-BR",
  USD: "en-US",
  EUR: "de-DE",
  GBP: "en-GB",
};

/** A built-in helper: receives the resolved value + literal args, returns a string. */
export type Helper = (
  value: unknown,
  args: unknown[],
  location: { line: number; col: number },
) => string;

function toNumber(value: unknown): number {
  if (typeof value === "number") {
    return value;
  }
  if (typeof value === "string" && value.trim() !== "") {
    const n = Number(value);
    if (!Number.isNaN(n)) {
      return n;
    }
  }
  return Number.NaN;
}

/** `currency(code)` — e.g. `currency("BRL")` ⇒ `R$ 1.234,50` (NBSP separator, per Intl pt-BR/BRL). */
const currency: Helper = (value, args, location) => {
  const code = args[0];
  if (typeof code !== "string") {
    throw new VelloraTemplateError(
      'currency() requires a currency code string, e.g. currency("BRL").',
      location,
    );
  }
  if (!/^[A-Za-z]{3}$/.test(code)) {
    throw new VelloraTemplateError(
      `currency() received an invalid currency code: ${JSON.stringify(code)}. Expected a 3-letter ISO 4217 code, e.g. currency("BRL").`,
      location,
    );
  }
  const n = toNumber(value);
  if (Number.isNaN(n)) {
    return "";
  }
  const locale = CURRENCY_LOCALE[code] ?? "en-US";
  return new Intl.NumberFormat(locale, { style: "currency", currency: code }).format(n);
};

/** `number(fractionDigits?)` — fixed fraction digits via en-US so the decimal point is `.`. */
const number: Helper = (value, args, location) => {
  const digitsArg = args[0];
  let digits: number | undefined;
  if (digitsArg !== undefined) {
    // `Intl.NumberFormat` requires `fractionDigits` to be an integer in [0, 20]; out-of-range or
    // non-integer values throw a raw `RangeError`. Validate up front for a located message.
    if (
      typeof digitsArg !== "number" ||
      !Number.isInteger(digitsArg) ||
      digitsArg < 0 ||
      digitsArg > 20
    ) {
      throw new VelloraTemplateError(
        `number() received an invalid fraction-digit count: ${JSON.stringify(digitsArg)}. Expected an integer in [0, 20].`,
        location,
      );
    }
    digits = digitsArg;
  }
  const n = toNumber(value);
  if (Number.isNaN(n)) {
    return "";
  }
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
    useGrouping: false,
  }).format(n);
};

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

/** Parse a date-ish value to UTC fields. Accepts ISO date / ISO instant / Date. NaN ⇒ undefined. */
function toUtcDate(value: unknown): Date | undefined {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? undefined : value;
  }
  if (typeof value !== "string" || value.trim() === "") {
    return undefined;
  }
  // A bare `YYYY-MM-DD` is parsed by the platform as UTC midnight; an instant carries its own zone.
  // A local datetime without zone (`YYYY-MM-DDTHH:mm:ss`) is pinned to UTC for determinism.
  const bareLocal = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?(\.\d+)?$/.test(value);
  const instant = new Date(bareLocal ? `${value}Z` : value);
  return Number.isNaN(instant.getTime()) ? undefined : instant;
}

function pad(n: number, width: number): string {
  return String(n).padStart(width, "0");
}

/**
 * `date(format)` — UTC formatting against an explicit token string so output is timezone-stable.
 * Supported tokens: `YYYY` `YY` `MM` `M` `MMMM` `DD` `D` `HH` `mm` `ss`.
 */
const date: Helper = (value, args, location) => {
  const format = args[0];
  if (typeof format !== "string") {
    throw new VelloraTemplateError(
      'date() requires a format string, e.g. date("YYYY-MM-DD").',
      location,
    );
  }
  const d = toUtcDate(value);
  if (!d) {
    return "";
  }
  const year = d.getUTCFullYear();
  const month = d.getUTCMonth() + 1;
  const day = d.getUTCDate();
  const hours = d.getUTCHours();
  const minutes = d.getUTCMinutes();
  const seconds = d.getUTCSeconds();
  // Longest tokens first so `YYYY` is not consumed as two `YY`, and `MMMM` before `MM`.
  return format.replace(/YYYY|MMMM|YY|MM|DD|HH|mm|ss|M|D/g, (token) => {
    switch (token) {
      case "YYYY":
        return pad(year, 4);
      case "YY":
        return pad(year % 100, 2);
      case "MMMM":
        return MONTHS[month - 1] ?? "";
      case "MM":
        return pad(month, 2);
      case "M":
        return String(month);
      case "DD":
        return pad(day, 2);
      case "D":
        return String(day);
      case "HH":
        return pad(hours, 2);
      case "mm":
        return pad(minutes, 2);
      case "ss":
        return pad(seconds, 2);
      default:
        return token;
    }
  });
};

/** The built-in helper registry. Unknown helper names reject with a `VelloraTemplateError`. */
export const HELPERS: Record<string, Helper> = { currency, number, date };
