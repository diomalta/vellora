import { readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";
import { chromiumEngine, chromiumEngineInternals } from "../src/index";

function printToPdfPath(args: string[]): string {
  const flag = args.find((arg) => arg.startsWith("--print-to-pdf="));
  if (!flag) {
    throw new Error("missing --print-to-pdf");
  }
  return flag.slice("--print-to-pdf=".length);
}

function inputHtmlPath(args: string[]): string {
  const input = args.at(-1);
  if (!input) {
    throw new Error("missing input URL");
  }
  return fileURLToPath(input);
}

describe("chromiumEngine", () => {
  test("renders through an injected Chromium runner without an automation library", async () => {
    const seen: { executablePath?: string; args?: string[]; html?: string } = {};
    const engine = chromiumEngine({
      executablePath: "/opt/chromium",
      async runChromium(executablePath, args) {
        seen.executablePath = executablePath;
        seen.args = args;
        seen.html = await readFile(inputHtmlPath(args), "utf8");
        const pdfPath = printToPdfPath(args);
        await writeFile(pdfPath, new TextEncoder().encode("%PDF-CHROMIUM"));
      },
    });

    const pdf = await engine.render('<img src="logo.png"><p>ok</p>', {
      metadata: { creationDate: "2000-01-01T00:00:00.000Z" },
      images: { "logo.png": new Uint8Array([0x89, 0x50, 0x4e, 0x47]) },
      chromium: { pdf: { landscape: true } },
    });

    expect(new TextDecoder().decode(pdf)).toBe("%PDF-CHROMIUM");
    expect(seen.executablePath).toBe("/opt/chromium");
    expect(seen.html).toBe('<img src="logo.png"><p>ok</p>');
    expect(seen.args).toEqual(
      expect.arrayContaining([
        "--headless=new",
        "--disable-gpu",
        "--allow-file-access-from-files",
        "--landscape",
      ]),
    );
    expect(seen.args?.some((arg) => arg.includes("--print-to-pdf="))).toBe(true);
  });

  test("materializes relative image assets beside the temporary HTML", async () => {
    let assetBytes: Uint8Array | undefined;
    const engine = chromiumEngine({
      executablePath: "/opt/chromium",
      async runChromium(_executablePath, args) {
        const htmlPath = inputHtmlPath(args);
        assetBytes = await readFile(`${dirname(htmlPath)}/nested/logo.png`);
        await writeFile(printToPdfPath(args), new TextEncoder().encode("%PDF-ASSET"));
      },
    });

    await engine.render('<img src="nested/logo.png">', {
      metadata: { creationDate: "2000-01-01T00:00:00.000Z" },
      images: { "nested/logo.png": new Uint8Array([0x89, 0x50, 0x4e, 0x47]) },
    });

    expect(Array.from(assetBytes ?? [])).toEqual([0x89, 0x50, 0x4e, 0x47]);
  });

  test("wraps runner failures as explicit Chromium availability errors", async () => {
    const engine = chromiumEngine({
      executablePath: "/missing/chromium",
      async runChromium() {
        throw new Error("ENOENT");
      },
    });

    await expect(
      engine.render("<p>ok</p>", {
        metadata: { creationDate: "2000-01-01T00:00:00.000Z" },
      }),
    ).rejects.toMatchObject({
      code: "VELLORA_CHROMIUM_UNAVAILABLE",
    });
  });

  test("keeps unsafe asset paths inside the temporary directory", () => {
    expect(chromiumEngineInternals.safeRelativeAssetPath("../logo.png", new Uint8Array([1]))).toBe(
      "logo.png",
    );
  });
});
