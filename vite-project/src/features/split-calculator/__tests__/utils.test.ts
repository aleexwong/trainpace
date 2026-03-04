import { describe, it, expect } from "vitest";
import {
  timeToSeconds,
  secondsToTimeString,
  validateSplitInputs,
  calculateSplits,
  convertDistance,
} from "../utils";

describe("timeToSeconds", () => {
  it("converts hours, minutes, seconds to total seconds", () => {
    expect(timeToSeconds("1", "30", "0")).toBe(5400);
    expect(timeToSeconds("0", "25", "30")).toBe(1530);
    expect(timeToSeconds("3", "59", "59")).toBe(14399);
  });

  it("handles empty strings as zero", () => {
    expect(timeToSeconds("", "", "")).toBe(0);
    expect(timeToSeconds("1", "", "")).toBe(3600);
  });
});

describe("secondsToTimeString", () => {
  it("formats time with hours", () => {
    expect(secondsToTimeString(5400)).toBe("1:30:00");
    expect(secondsToTimeString(14399)).toBe("3:59:59");
  });

  it("formats time without hours", () => {
    expect(secondsToTimeString(300)).toBe("5:00");
    expect(secondsToTimeString(90)).toBe("1:30");
  });

  it("pads minutes and seconds", () => {
    expect(secondsToTimeString(3661)).toBe("1:01:01");
  });

  it("handles fractional seconds that round up to 60", () => {
    // 59.7 seconds should become 1:00, not 0:60
    expect(secondsToTimeString(59.7)).toBe("1:00");
    // 6299.5 should be 1:45:00 not 1:44:60
    expect(secondsToTimeString(6299.5)).toBe("1:45:00");
  });
});

describe("validateSplitInputs", () => {
  it("accepts valid inputs", () => {
    const result = validateSplitInputs("42.195", "3", "30", "0");
    expect(result.isValid).toBe(true);
    expect(Object.keys(result.errors)).toHaveLength(0);
  });

  it("rejects empty distance", () => {
    const result = validateSplitInputs("", "3", "30", "0");
    expect(result.isValid).toBe(false);
    expect(result.errors.distance).toBeDefined();
  });

  it("rejects zero time", () => {
    const result = validateSplitInputs("10", "0", "0", "0");
    expect(result.isValid).toBe(false);
    expect(result.errors.time).toBeDefined();
  });

  it("rejects invalid time format", () => {
    const result = validateSplitInputs("10", "0", "61", "0");
    expect(result.isValid).toBe(false);
    expect(result.errors.time).toBeDefined();
  });
});

describe("calculateSplits", () => {
  it("generates correct number of splits for a 10K in km", () => {
    const result = calculateSplits(3000, 10, "km", "even");
    expect(result.splits).toHaveLength(10);
    expect(result.distance).toBe(10);
    expect(result.units).toBe("km");
  });

  it("generates a partial last split for marathon distance", () => {
    // 42.195 km → 42 full splits + 1 partial
    const result = calculateSplits(14400, 42.195, "km", "even");
    expect(result.splits).toHaveLength(43);
    const last = result.splits[result.splits.length - 1];
    expect(last.isPartial).toBe(true);
  });

  it("even splits produce equal split times for whole distances", () => {
    const result = calculateSplits(3000, 10, "km", "even");
    // All splits should be 5:00 (300 seconds each)
    result.splits.forEach((split) => {
      expect(split.splitTime).toBe("5:00");
    });
  });

  it("negative splits: last split is faster than first", () => {
    const result = calculateSplits(3000, 10, "km", "negative");
    const firstTime = result.splits[0].splitTime;
    const lastTime = result.splits[result.splits.length - 1].splitTime;
    // First split should be slower than last
    expect(firstTime > lastTime).toBe(true);
  });

  it("positive splits: first split is faster than last", () => {
    const result = calculateSplits(3000, 10, "km", "positive");
    const firstTime = result.splits[0].splitTime;
    const lastTime = result.splits[result.splits.length - 1].splitTime;
    // First split should be faster than last
    expect(firstTime < lastTime).toBe(true);
  });

  it("cumulative time of last split equals total time", () => {
    const totalSeconds = 3600; // 1 hour
    const result = calculateSplits(totalSeconds, 10, "km", "even");
    expect(result.totalTime).toBe("1:00:00");
    const lastSplit = result.splits[result.splits.length - 1];
    expect(lastSplit.cumulativeTime).toBe("1:00:00");
  });

  it("works with miles unit", () => {
    const result = calculateSplits(5400, 13.1, "miles", "even");
    expect(result.splits.length).toBe(14); // 13 full + 1 partial
    expect(result.units).toBe("miles");
    expect(result.averagePace).toContain("/mi");
  });

  it("preserves strategy in results", () => {
    expect(calculateSplits(3000, 10, "km", "even").strategy).toBe("even");
    expect(calculateSplits(3000, 10, "km", "negative").strategy).toBe("negative");
    expect(calculateSplits(3000, 10, "km", "positive").strategy).toBe("positive");
  });
});

describe("convertDistance", () => {
  it("returns same distance when units match", () => {
    expect(convertDistance(10, "km", "km")).toBe(10);
    expect(convertDistance(6.2, "miles", "miles")).toBe(6.2);
  });

  it("converts km to miles with smart snapping", () => {
    // 10 km → ~6.21 mi, snaps to common 6.2
    expect(convertDistance(10, "km", "miles")).toBe(6.2);
    // 42.195 km → ~26.22 mi, snaps to common 26.2
    expect(convertDistance(42.195, "km", "miles")).toBe(26.2);
    // 21.0975 km → ~13.11 mi, snaps to common 13.1
    expect(convertDistance(21.0975, "km", "miles")).toBe(13.1);
  });

  it("converts miles to km with smart snapping", () => {
    // 6.2 mi → ~9.98 km, snaps to common 10
    expect(convertDistance(6.2, "miles", "km")).toBe(10);
    // 26.2 mi → ~42.16 km, snaps to common 42.2
    expect(convertDistance(26.2, "miles", "km")).toBe(42.2);
    // 13.1 mi → ~21.08 km, snaps to common 21.1
    expect(convertDistance(13.1, "miles", "km")).toBe(21.1);
  });

  it("rounds to 1 decimal for non-common distances", () => {
    // 15 km → ~9.32 mi, no common race near this
    expect(convertDistance(15, "km", "miles")).toBe(9.3);
  });
});
