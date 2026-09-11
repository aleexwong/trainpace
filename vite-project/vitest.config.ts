import { defineConfig } from "vitest/config";
import path from "path";

// Unit tests cover src/domain-style pure modules only: the maths behind the
// calculators. They must run in plain Node with no DOM, no Firebase, and no
// component rendering — if a test needs any of those, it belongs in the
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
