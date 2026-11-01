import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    // `vellora`'s `#runtime` subpath import points at the built `dist/` (package.json `imports`);
    // tests run from source, so resolve it to the Node runtime module there.
    alias: {
      "#runtime": fileURLToPath(new URL("./packages/vellora/src/runtime.ts", import.meta.url)),
    },
  },
  test: {
    include: ["packages/*/test/**/*.test.ts", "packages/*/src/**/*.test.ts"],
    // Native addon build + golden harness touch the filesystem; keep runs deterministic.
    pool: "forks",
    // Reset the `vellora` package's default native bridge to the deterministic mock before each test
    // (production defaults to the real `@vellora/native` addon). Harmless for other packages' tests.
    setupFiles: ["./packages/vellora/test/_setup-bridge.ts"],
  },
});
