import { expect, test } from "vitest";
import * as lint from "../src/index";

test("exposes the package name", () => {
  expect(lint.name).toBe("@vellora/lint");
});

test("exposes the public diagnose + fix surface", () => {
  expect(typeof lint.diagnose).toBe("function");
  expect(typeof lint.fix).toBe("function");
  expect(typeof lint.COMPAT_LINKS).toBe("object");
});
