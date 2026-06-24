import { expect, test } from "vitest";
import { banner } from "../src/cli";
import { name } from "../src/index";

test("exposes the package name", () => {
  expect(name).toBe("@vellora/cli");
});

test("cli exposes a banner", () => {
  expect(banner).toContain("vellora cli");
});
