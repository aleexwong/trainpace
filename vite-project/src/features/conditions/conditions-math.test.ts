import { describe, expect, it } from "vitest";
import { altitudeVo2Fraction, calculateConditions, dewPointC } from "./conditions-math";
import type { ConditionsInput } from "./types";

const baseline: ConditionsInput = {
  distanceMeters: 10_000,
  goalTimeSeconds: 3_000,
  tempC: 10,
  humidity: 50,
  altitudeMeters: 0,
  acclimatised: false,
};

describe("race-day pace estimates", () => {
  it("matches dew point reference values", () => {
    expect(dewPointC(30, 50)).toBeCloseTo(18.4, 1);
    expect(dewPointC(25, 100)).toBeCloseTo(25);
  });

  it("preserves the baseline in cool, sea-level conditions", () => {
    expect(calculateConditions(baseline)).toMatchObject({
      adjustedTimeSeconds: baseline.goalTimeSeconds,
      heatCostSeconds: 0,
      altitudeCostSeconds: 0,
    });
  });

  it("estimates a larger percentage slowdown for a longer effort in the same heat", () => {
    const hot = { ...baseline, tempC: 30, humidity: 75 };
    const tenK = calculateConditions(hot)!;
    const marathon = calculateConditions({
      ...hot,
      distanceMeters: 42_195,
      goalTimeSeconds: 14_400,
    })!;

    expect(tenK.heatSlowdownFraction).toBeGreaterThan(0);
    expect(marathon.heatSlowdownFraction).toBeGreaterThan(tenK.heatSlowdownFraction);
  });

  it("estimates an altitude penalty that acclimatisation reduces", () => {
    expect(altitudeVo2Fraction(1600, false)).toBeCloseTo(0.922, 3);
    expect(altitudeVo2Fraction(1600, true)).toBeGreaterThan(altitudeVo2Fraction(1600, false));
  });

  it("rejects non-finite weather input", () => {
    expect(calculateConditions({ ...baseline, tempC: NaN })).toBeNull();
  });
});
