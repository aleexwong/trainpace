import { describe, it, expect } from "vitest";
import { downsampleProfile, computeCumulativeGain } from "./utils";

type Point = { distanceKm: number; elevation: number };

function makeLinearProfile(n: number, startEle = 0, step = 1): Point[] {
  return Array.from({ length: n }, (_, i) => ({
    distanceKm: i,
    elevation: startEle + i * step,
  }));
}

// ---------------------------------------------------------------------------
// downsampleProfile
// ---------------------------------------------------------------------------

describe("downsampleProfile — docstring claim: unchanged when already under the cap", () => {
  it("returns the exact same array reference when maxPoints >= length", () => {
    const data = makeLinearProfile(10);
    const result = downsampleProfile(data, 20);
    expect(result).toBe(data);
  });

  it("returns the same array reference when the profile is exactly at the cap", () => {
    const data = makeLinearProfile(10);
    const result = downsampleProfile(data, 10);
    expect(result).toBe(data);
  });
});

describe("downsampleProfile — docstring claim: first and last points always retained", () => {
  it("keeps the true first and last points when downsampling a larger profile", () => {
    const data = makeLinearProfile(50);
    const result = downsampleProfile(data, 10);
    expect(result[0]).toBe(data[0]);
    expect(result[result.length - 1]).toBe(data[data.length - 1]);
  });

  it("keeps the true first and last points for a profile exactly one over the cap", () => {
    const data = makeLinearProfile(11);
    const result = downsampleProfile(data, 10);
    expect(result[0]).toBe(data[0]);
    expect(result[result.length - 1]).toBe(data[data.length - 1]);
  });
});

describe("downsampleProfile — output size never exceeds maxPoints (normal range)", () => {
  it("returns exactly maxPoints entries when the profile is well over the cap", () => {
    const data = makeLinearProfile(500);
    const result = downsampleProfile(data, 50);
    expect(result.length).toBe(50);
  });

  it("returns exactly maxPoints entries for a profile exactly one over the cap", () => {
    const data = makeLinearProfile(11);
    const result = downsampleProfile(data, 10);
    expect(result.length).toBe(10);
  });

  it("handles a two-point profile without crashing (nothing to downsample)", () => {
    const data = makeLinearProfile(2);
    const result = downsampleProfile(data, 10);
    expect(result).toBe(data);
    expect(result).toHaveLength(2);
  });

  it("handles an empty profile without crashing", () => {
    const data: Point[] = [];
    const result = downsampleProfile(data, 10);
    expect(result).toEqual([]);
  });
});

describe("downsampleProfile — degenerate maxPoints values (0, 1, 2)", () => {
  // Regression guard. The early-exit guard used to read
  //   if (maxPoints >= n || maxPoints <= 2) return data;
  // so for maxPoints in {0, 1, 2} with a large n it handed back the FULL,
  // untouched input — a maxPoints of 1 against a 500-point profile returned
  // all 500. That satisfied "first and last retained" only by accident, and
  // silently broke the "at most maxPoints" contract callers depend on to cap
  // render and hit-test cost. LTTB genuinely needs three points to work, so
  // these caps are now handled directly instead of bailing out.
  it(
    "maxPoints=0 yields no points",
    () => {
      const data = makeLinearProfile(20);
      const result = downsampleProfile(data, 0);
      expect(result.length).toBeLessThanOrEqual(0);
    }
  );

  it(
    "maxPoints=1 yields at most one point",
    () => {
      const data = makeLinearProfile(20);
      const result = downsampleProfile(data, 1);
      expect(result.length).toBeLessThanOrEqual(1);
    }
  );

  it(
    "maxPoints=2 yields at most two points (first and last)",
    () => {
      const data = makeLinearProfile(20);
      const result = downsampleProfile(data, 2);
      expect(result.length).toBeLessThanOrEqual(2);
    }
  );

  it("keeps the route endpoints at the degenerate caps", () => {
    const data = makeLinearProfile(20);
    expect(downsampleProfile(data, 1)[0]).toBe(data[0]);
    const two = downsampleProfile(data, 2);
    expect(two[0]).toBe(data[0]);
    expect(two[1]).toBe(data[data.length - 1]);
  });

  it("still hands back the same array when the profile is already under the cap", () => {
    // Reference identity matters: callers use it to skip work entirely.
    const data = makeLinearProfile(5);
    expect(downsampleProfile(data, 50)).toBe(data);
  });
});

describe("downsampleProfile — LTTB preserves visual shape (a sharp spike survives)", () => {
  it("keeps a single sharp elevation spike in the downsampled output", () => {
    const n = 101;
    const spikeIndex = 50;
    const spikeElevation = 1000;
    const data: Point[] = Array.from({ length: n }, (_, i) => ({
      distanceKm: i,
      // Gentle rising baseline (0..100m) with one huge outlier spike.
      elevation: i === spikeIndex ? spikeElevation : i,
    }));

    const result = downsampleProfile(data, 15);

    const maxOutputElevation = Math.max(...result.map((p) => p.elevation));
    // The spike (1000) dwarfs the baseline (max ~100), so LTTB's
    // largest-triangle-area selection should pick it up; a naive average or
    // stride-based decimation would very likely miss a single-point spike.
    expect(maxOutputElevation).toBeGreaterThan(900);
  });
});

// ---------------------------------------------------------------------------
// computeCumulativeGain
// ---------------------------------------------------------------------------

describe("computeCumulativeGain — monotonic climb", () => {
  it("accumulates the full climb as gain, matching the total elevation delta", () => {
    const data = makeLinearProfile(6, 100, 20); // 100,120,140,160,180,200
    const result = computeCumulativeGain(data);
    expect(result.map((p) => p.gain)).toEqual([0, 20, 40, 60, 80, 100]);
  });
});

describe("computeCumulativeGain — monotonic descent", () => {
  it("registers zero gain throughout a pure descent", () => {
    const data = makeLinearProfile(6, 200, -20); // 200,180,160,140,120,100
    const result = computeCumulativeGain(data);
    expect(result.every((p) => p.gain === 0)).toBe(true);
  });
});

describe("computeCumulativeGain — flat profile", () => {
  it("registers zero gain when elevation never changes", () => {
    const data = makeLinearProfile(5, 150, 0);
    const result = computeCumulativeGain(data);
    expect(result.every((p) => p.gain === 0)).toBe(true);
  });
});

describe("computeCumulativeGain — rolling profile (hand-computed)", () => {
  it("sums only the positive deltas along an up/down/up/down route", () => {
    // Elevations: 100,150,120,180,160,200
    // Deltas:        +50, -30, +60, -20, +40
    // Gains only count positive deltas: 0,50,50,110,110,150
    const data: Point[] = [100, 150, 120, 180, 160, 200].map((elevation, i) => ({
      distanceKm: i,
      elevation,
    }));
    const result = computeCumulativeGain(data);
    expect(result.map((p) => p.gain)).toEqual([0, 50, 50, 110, 110, 150]);
  });

  it("never decreases along the route, even across descents", () => {
    const data: Point[] = [100, 150, 120, 180, 160, 200, 130, 250].map(
      (elevation, i) => ({ distanceKm: i, elevation })
    );
    const result = computeCumulativeGain(data);
    for (let i = 1; i < result.length; i++) {
      expect(result[i].gain).toBeGreaterThanOrEqual(result[i - 1].gain);
    }
  });

  it("preserves distanceKm unchanged for each point", () => {
    const data = makeLinearProfile(5, 0, 10);
    const result = computeCumulativeGain(data);
    result.forEach((p, i) => expect(p.distanceKm).toBe(data[i].distanceKm));
  });
});
