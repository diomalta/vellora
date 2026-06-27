export function printJson(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}
