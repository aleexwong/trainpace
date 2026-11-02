import { defineConfig } from "vitest/config";
import path from "path";

// Unit tests cover the pure maths behind the calculators. The default
// environment is plain Node: no Firebase, no component rendering.
//
// The one exception is DOM parsing. gpxMetaData.ts uses DOMParser, so
// gpxMetaData.test.ts opts into jsdom with a per-file
//   /** @vitest-environment jsdom */
// docblock. That is deliberate and narrow — do NOT switch the global
// environment to jsdom to accommodate it, which would slow every other file
// and hide accidental DOM dependencies in modules that should stay pure.
// Anything needing a real browser (rendering, layout, fonts) belongs in the
// Playwright suite instead (e2e/).
export default defineConfig({
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    // e2e/ is Playwright's; vitest must not try to run those specs.
    exclude: ["e2e/**", "node_modules/**", "dist/**"],
    coverage: {
      provider: "v8",
      include: [
        "src/features/plan/plan-math.ts",
        "src/features/fuel/fuel-math.ts",
        "src/features/vdot-calculator/vdot-math.ts",
        "src/features/pace-calculator/utils.ts",
        "src/features/elevation/utils.ts",
        "src/lib/gpxMetaData.ts",
      ],
      thresholds: { lines: 85, functions: 85, branches: 75 },
    },
  },
});
