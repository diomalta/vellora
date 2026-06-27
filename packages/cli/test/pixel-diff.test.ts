import { describe, expect, test } from "vitest";
import { pixelDiffInternals } from "../src/pixel-diff";

const { compareRgbImages, decodePpm, encodePpm } = pixelDiffInternals;

function image(
  width: number,
  height: number,
  rgb: number[],
): { width: number; height: number; data: Uint8Array } {
  return { width, height, data: new Uint8Array(rgb) };
}

describe("pixel diff primitives", () => {
  test("round-trips a PPM image used for raster comparison", () => {
    const original = image(2, 1, [255, 0, 0, 0, 0, 255]);

    const decoded = decodePpm(encodePpm(original));

    expect(decoded.width).toBe(2);
    expect(decoded.height).toBe(1);
    expect(Array.from(decoded.data)).toEqual(Array.from(original.data));
  });

  test("decodes PPM comments emitted by common tools", () => {
    const bytes = Buffer.concat([
      Buffer.from("P6\n# comment\n2 1\n255\n", "ascii"),
      Buffer.from([1, 2, 3, 4, 5, 6]),
    ]);

    const decoded = decodePpm(bytes);

    expect(decoded.width).toBe(2);
    expect(decoded.height).toBe(1);
    expect(Array.from(decoded.data)).toEqual([1, 2, 3, 4, 5, 6]);
  });

  test("counts pixels above the per-channel threshold", () => {
    const reference = image(2, 1, [255, 255, 255, 10, 10, 10]);
    const subject = image(2, 1, [250, 255, 255, 80, 10, 10]);

    const comparison = compareRgbImages(reference, subject, 12);

    expect(comparison.metrics.pixels).toBe(2);
    expect(comparison.metrics.mismatchPixels).toBe(1);
    expect(comparison.metrics.mismatchRatio).toBe(0.5);
    expect(comparison.metrics.maxChannelDelta).toBe(70);
  });

  test("dimension drift is counted as white missing pixels", () => {
    const reference = image(2, 1, [255, 255, 255, 255, 255, 255]);
    const subject = image(1, 1, [255, 255, 255]);

    const comparison = compareRgbImages(reference, subject, 0);

    expect(comparison.dimensions).toMatchObject({
      referenceWidth: 2,
      subjectWidth: 1,
      comparedWidth: 2,
    });
    expect(comparison.metrics.pixels).toBe(2);
    expect(comparison.metrics.mismatchPixels).toBe(0);
  });
});
