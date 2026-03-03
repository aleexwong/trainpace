import { describe, it, expect } from "vitest";
import {
  timeToSeconds,
  secondsToTimeString,
  validateSplitInputs,
  calculateSplits,
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
