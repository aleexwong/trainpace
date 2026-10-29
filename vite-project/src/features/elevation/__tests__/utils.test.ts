import { describe, expect, it } from "vitest";
import { formatSplitKm, terrainDistances } from "../utils";

describe("formatSplitKm", () => {
  it("keeps half-km boundaries distinct", () => {
    const labels = [
      [0, 0.5],
      [0.5, 1],
      [1, 1.5],
    ].map(([a, b]) => `${formatSplitKm(a)}–${formatSplitKm(b)}`);
    expect(labels).toEqual(["0–0.5", "0.5–1", "1–1.5"]);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("shows a short final split at its real end", () => {
    expect(formatSplitKm(3.41)).toBe("3.41");
    expect(formatSplitKm(3.4099999)).toBe("3.41");
  });
});

describe("terrainDistances", () => {
  it("sums to the route distance when the last split is short", () => {
    const segments = [
      { startDistance: 0, endDistance: 0.5, type: "flat" as const },
      { startDistance: 0.5, endDistance: 1, type: "uphill" as const },
      { startDistance: 1, endDistance: 1.5, type: "uphill" as const },
      { startDistance: 1.5, endDistance: 1.91, type: "downhill" as const },
    ];
    const t = terrainDistances(segments);
    expect(t.flat).toBeCloseTo(0.5);
    expect(t.uphill).toBeCloseTo(1);
    expect(t.downhill).toBeCloseTo(0.41);
    expect(t.uphill + t.flat + t.downhill).toBeCloseTo(1.91);
  });

  it("returns zeros for no segments", () => {
    expect(terrainDistances([])).toEqual({ uphill: 0, flat: 0, downhill: 0 });
  });
});
