/**
 * Vitest setup: the production default native bridge is the real `@vellora/native` addon, but unit
 * tests run against the deterministic mock. Resetting before each test means global bridge state set
 * by one test never leaks into the next. Tests that want the real addon inject it per call via
 * `_bridge` (see test/real-stack.test.ts), bypassing this default.
 */
import { beforeEach } from "vitest";
import { MockNativeBridge, setNativeBridge } from "../src/index";

beforeEach(() => {
  setNativeBridge(new MockNativeBridge());
});
