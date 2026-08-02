import { describe, it, expect } from "vitest";
import {
  timeToSeconds,
  secondsToTimeString,
  convertPace,
  convertDistance,
  validatePaceInputs,
} from "../utils";

describe("timeToSeconds", () => {
  it("sums hours, minutes and seconds", () => {
    expect(timeToSeconds("1", "30", "45")).toBe(5445);
  });

  it("treats empty fields as zero", () => {
    expect(timeToSeconds("", "20", "")).toBe(1200);
    expect(timeToSeconds("", "", "")).toBe(0);
  });
});

describe("secondsToTimeString", () => {
  it("omits the hours component under an hour", () => {
    expect(secondsToTimeString(125)).toBe("2:05");
  });

  it("includes hours and zero-pads once past an hour", () => {
    expect(secondsToTimeString(5445)).toBe("1:30:45");
    expect(secondsToTimeString(3605)).toBe("1:00:05");
  });

  it("handles zero", () => {
    expect(secondsToTimeString(0)).toBe("0:00");
  });
});

describe("convertPace", () => {
  it("returns the input when units already match", () => {
    expect(convertPace(300, "km", "km")).toBe(300);
  });

  it("converts sec/mile to sec/km (a km is shorter, so the pace is faster)", () => {
    // 8:00/mile ≈ 4:58/km
    const result = convertPace(480, "miles", "km");
    expect(result).toBeCloseTo(298.26, 1);
    expect(result).toBeLessThan(480);
  });

  // Note the capital M: PaceUnit is "km" | "Miles" while DistanceUnit is
  // "km" | "miles". convertPace lowercases toUnit to bridge the two.
  it("converts sec/km to sec/mile (a mile is longer, so the pace is slower)", () => {
    // 5:00/km ≈ 8:03/mile
    const result = convertPace(300, "km", "Miles");
    expect(result).toBeCloseTo(482.8, 1);
    expect(result).toBeGreaterThan(300);
  });

  it("round-trips within rounding error", () => {
    expect(convertPace(convertPace(300, "km", "Miles"), "miles", "km")).toBeCloseTo(300, 6);
  });
});

describe("convertDistance", () => {
  it("returns the input when units match", () => {
    expect(convertDistance(10, "km", "km")).toBe(10);
  });

  it("snaps to a common race distance when within 2%", () => {
    // 42.195 km -> 26.2187 mi, which is inside 2% of the 26.2 mi marathon
    expect(convertDistance(42.195, "km", "miles")).toBe(26.2);
    // 13.1 mi -> 21.08 km, inside 2% of the 21.1 km half
    expect(convertDistance(13.1, "miles", "km")).toBe(21.1);
  });

  it("rounds to one decimal when not near a common distance", () => {
    expect(convertDistance(7, "km", "miles")).toBe(4.3);
  });
});

describe("validatePaceInputs", () => {
  it("accepts a normal race time", () => {
    const { isValid, errors } = validatePaceInputs("10", "0", "45", "0");
    expect(isValid).toBe(true);
    expect(errors).toEqual({});
  });

  it("requires a distance", () => {
    expect(validatePaceInputs("", "0", "45", "0").errors.distance).toBe(
      "Distance is required"
    );
  });

  it("rejects a non-positive or non-numeric distance", () => {
    expect(validatePaceInputs("0", "0", "45", "0").errors.distance).toBeDefined();
    expect(validatePaceInputs("-5", "0", "45", "0").errors.distance).toBeDefined();
    expect(validatePaceInputs("abc", "0", "45", "0").errors.distance).toBeDefined();
  });

  it("rejects an all-zero time", () => {
    expect(validatePaceInputs("10", "0", "0", "0").errors.time).toBe(
      "Please enter a valid time"
    );
  });

  it("rejects out-of-range minutes and seconds", () => {
    expect(validatePaceInputs("10", "0", "60", "0").errors.time).toBe(
      "Invalid time format"
    );
    expect(validatePaceInputs("10", "0", "0", "60").errors.time).toBe(
      "Invalid time format"
    );
  });

  // Regression: hours was previously unbounded, so a 99-hour 5K validated fine
  // and produced nonsense paces with no warning (ROADMAP B6).
  it("rejects an absurd hours value", () => {
    const { isValid, errors } = validatePaceInputs("5", "99", "0", "0");
    expect(isValid).toBe(false);
    expect(errors.time).toBe("Race time must be under 24 hours");
  });

  it("allows an ultra-length but plausible time at the boundary", () => {
    expect(validatePaceInputs("100", "24", "0", "0").isValid).toBe(true);
  });
});
