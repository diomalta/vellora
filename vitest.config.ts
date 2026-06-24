import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["packages/*/test/**/*.test.ts", "packages/*/src/**/*.test.ts"],
    // Native addon build + golden harness touch the filesystem; keep runs deterministic.
    pool: "forks",
    // Reset the `vellora` package's default native bridge to the deterministic mock before each test
    // (production defaults to the real `@vellora/native` addon). Harmless for other packages' tests.
    setupFiles: ["./packages/vellora/test/_setup-bridge.ts"],
  },
});
