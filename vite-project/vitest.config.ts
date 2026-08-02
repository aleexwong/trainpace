/// <reference types="vitest" />
import { defineConfig } from "vitest/config";
import path from "path";

/**
 * Unit-test config, separate from vite.config.ts.
 *
 * Kept separate so the test run doesn't load the prerender plugin (which walks
 * every SEO route on startup) and so `e2e/` stays exclusively Playwright's —
 * vitest picking up `*.spec.ts` there fails with "Playwright Test did not
 * expect test.describe() to be called here".
 *
 * Unit tests: `src/**\/*.test.ts`  → npm test
 * E2E tests:  `e2e/**\/*.spec.ts`  → npm run test:e2e
 */
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    exclude: ["node_modules", "dist", "e2e"],
    environment: "node",
  },
});
