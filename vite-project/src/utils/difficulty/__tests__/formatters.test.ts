import { describe, it, expect } from "vitest";
import {
  formatTime,
  formatPace,
  formatDistance,
  formatElevation,
  formatPercentage,
  formatDistanceRange,
} from "../formatters";

describe("formatTime", () => {
  it("should format hours and minutes", () => {
    expect(formatTime(150)).toBe("2h 30m");
    expect(formatTime(125)).toBe("2h 5m");
  });

  it("should format hours only", () => {
    expect(formatTime(120)).toBe("2h");
    expect(formatTime(60)).toBe("1h");
  });

  it("should format minutes only", () => {
    expect(formatTime(45)).toBe("45m");
    expect(formatTime(5)).toBe("5m");
  });

  it("should round to nearest minute", () => {
    expect(formatTime(45.4)).toBe("45m");
    expect(formatTime(45.6)).toBe("46m");
  });
});

describe("formatPace", () => {
  it("should format metric pace correctly", () => {
    expect(formatPace(1, 5)).toBe("5:00/km");
    expect(formatPace(1.2, 5)).toBe("6:00/km");
    expect(formatPace(1.5, 4)).toBe("6:00/km");
  });

  it("should handle seconds correctly", () => {
    expect(formatPace(1, 5.5)).toBe("5:30/km");
    expect(formatPace(1, 5.75)).toBe("5:45/km");
  });

  it("should round seconds to nearest second", () => {
    expect(formatPace(1, 5.008)).toBe("5:00/km"); // 5 min 0.48 sec → rounds to 0
    expect(formatPace(1, 5.016)).toBe("5:01/km"); // 5 min 0.96 sec → rounds to 1
  });

  it("should handle 60 seconds rollover", () => {
    expect(formatPace(1, 5.999)).toBe("6:00/km");
  });

  it("should format imperial pace correctly", () => {
    expect(formatPace(1, 5, { units: "imperial" })).toBe("8:03/mi");
  });

  it("should pad seconds with zero", () => {
    expect(formatPace(1, 5.083)).toBe("5:05/km");
  });
});

describe("formatDistance", () => {
  it("should format metric distance with 1 decimal", () => {
    expect(formatDistance(5)).toBe("5.0 km");
    expect(formatDistance(10.5)).toBe("10.5 km");
    expect(formatDistance(42.195)).toBe("42.2 km");
  });

  it("should format imperial distance", () => {
    const result = formatDistance(5, { units: "imperial" });
    expect(result).toContain("mi");
    expect(result).toContain("3.1"); // 5km ≈ 3.1 miles
  });

  it("should use locale for number formatting", () => {
    const result = formatDistance(5.5, { locale: "de-DE" });
    expect(result).toContain("5,5"); // German uses comma
  });
});

describe("formatElevation", () => {
  it("should format metric elevation without decimals", () => {
    expect(formatElevation(100)).toBe("100m");
    expect(formatElevation(1234.5)).toBe("1235m");
  });

  it("should format imperial elevation", () => {
    const result = formatElevation(100, { units: "imperial" });
    expect(result).toContain("ft");
    expect(result).toContain("328"); // 100m ≈ 328 feet
  });

  it("should handle zero elevation", () => {
    expect(formatElevation(0)).toBe("0m");
  });
});

describe("formatPercentage", () => {
  it("should format with default 1 decimal", () => {
    expect(formatPercentage(25)).toBe("25.0%");
    expect(formatPercentage(33.333)).toBe("33.3%");
  });

  it("should format with custom decimals", () => {
    expect(formatPercentage(25, 0)).toBe("25%");
    expect(formatPercentage(33.333, 2)).toBe("33.33%");
  });

  it("should use locale for formatting", () => {
    const result = formatPercentage(25.5, 1, "de-DE");
    expect(result).toContain("25,5"); // German uses comma
  });
});

describe("formatDistanceRange", () => {
  it("should format metric distance range with KM prefix", () => {
    expect(formatDistanceRange(5, 10)).toBe("KM 5.0 − 10.0");
    expect(formatDistanceRange(0, 5.5)).toBe("KM 0.0 − 5.5");
  });

  it("should format imperial distance range with MI prefix", () => {
    const result = formatDistanceRange(5, 10, { units: "imperial" });
    expect(result).toContain("MI");
    expect(result).toContain("3.1"); // 5km
    expect(result).toContain("6.2"); // 10km
  });

  it("should use 1 decimal place", () => {
    expect(formatDistanceRange(5.123, 10.789)).toBe("KM 5.1 − 10.8");
  });

  it("should use locale for formatting", () => {
    const result = formatDistanceRange(5.5, 10.5, { locale: "de-DE" });
    expect(result).toContain("5,5");
    expect(result).toContain("10,5");
  });
});
