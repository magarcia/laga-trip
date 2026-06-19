import { defineConfig } from "vitest/config";

// Standalone Vitest config, deliberately separate from vite.config.ts: the PWA plugin there
// (generateSW/Workbox) is irrelevant to unit tests and can interfere with the test runner.
// These are pure-function tests, so the lightweight node environment is enough.
export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    globals: false,
  },
});
