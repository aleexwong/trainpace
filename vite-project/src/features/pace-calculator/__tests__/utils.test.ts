import { describe, it, expect } from "vitest";
import {
  timeToSeconds,
  secondsToTimeString,
  convertPace,
  convertDistance,
  calculateTrainingPaces,
  validatePaceInputs,
  calculateHeartRateZones,
  calculateWeatherAdjustment,
} from "../utils";

describe("timeToSeconds", () => {
  it("converts h/m/s strings to total seconds", () => {
    expect(timeToSeconds("1", "30", "15")).toBe(1 * 3600 + 30 * 60 + 15);
  });

  it("treats empty fields as zero", () => {
    expect(timeToSeconds("", "45", "")).toBe(45 * 60);
    expect(timeToSeconds("", "", "")).toBe(0);
  });
});

describe("secondsToTimeString", () => {
  it("formats sub-hour durations as M:SS", () => {
    expect(secondsToTimeString(125)).toBe("2:05");
  });

  it("formats hour-plus durations as H:MM:SS", () => {
    expect(secondsToTimeString(3725)).toBe("1:02:05");
  });
});

describe("convertPace", () => {
  it("returns the same value when units match", () => {
    expect(convertPace(300, "km", "km")).toBe(300);
  });

  it("converts between km and miles pace consistently in both directions", () => {
    const kmPace = 300; // 5:00/km
    const milePace = convertPace(kmPace, "km", "Miles");
    const roundTrip = convertPace(milePace, "miles", "km");
    expect(roundTrip).toBeCloseTo(kmPace, 5);
  });
});

describe("convertDistance", () => {
  it("returns the same value when units match", () => {
    expect(convertDistance(10, "km", "km")).toBe(10);
  });

  it("snaps a converted marathon distance to the common race distance", () => {
    // 42.195km marathon -> ~26.2 miles, within 2% of the common 26.2mi entry
    const converted = convertDistance(42.195, "km", "miles");
    expect(converted).toBe(26.2);
  });

  it("rounds non-race distances to 1 decimal place", () => {
    const converted = convertDistance(7, "km", "miles");
    expect(converted).toBeCloseTo(4.3, 1);
  });
});

describe("calculateTrainingPaces", () => {
  it("computes a race pace equal to time/distance", () => {
    // 50:00 10K -> 5:00/km race pace
    const results = calculateTrainingPaces(50 * 60, 10, "km", "km");
    expect(results.race).toBe("5:00-5:00 min/km");
  });

  it("orders training paces from fastest to slowest: speed < interval < tempo < easy", () => {
    const results = calculateTrainingPaces(50 * 60, 10, "km", "km");
    const fastEnd = (pace: string) => {
      const [min] = pace.split("-");
      const [m, s] = min.split(":").map(Number);
      return m * 60 + s;
    };

    expect(fastEnd(results.speed)).toBeLessThan(fastEnd(results.interval));
    expect(fastEnd(results.interval)).toBeLessThan(fastEnd(results.tempo));
    expect(fastEnd(results.tempo)).toBeLessThan(fastEnd(results.easy));
  });

  it("adds heart rate zones only when age is provided", () => {
    const withAge = calculateTrainingPaces(50 * 60, 10, "km", "km", {
      age: 30,
    });
    const withoutAge = calculateTrainingPaces(50 * 60, 10, "km", "km");

    expect(withAge.heartRateZones).toBeDefined();
    expect(withAge.heartRateZones?.maxHR).toBe(190);
    expect(withoutAge.heartRateZones).toBeUndefined();
  });

  it("adds a weather adjustment only when temperature is provided", () => {
    const withTemp = calculateTrainingPaces(50 * 60, 10, "km", "km", {
      temperature: 85,
    });
    const withoutTemp = calculateTrainingPaces(50 * 60, 10, "km", "km");

    expect(withTemp.adjustments?.weather).toBeDefined();
    expect(withoutTemp.adjustments).toBeUndefined();
  });
});

describe("validatePaceInputs", () => {
  it("requires a distance", () => {
    const { isValid, errors } = validatePaceInputs("", "0", "30", "0");
    expect(isValid).toBe(false);
    expect(errors.distance).toBeTruthy();
  });

  it("rejects a non-positive distance", () => {
    const { isValid, errors } = validatePaceInputs("0", "0", "30", "0");
    expect(isValid).toBe(false);
    expect(errors.distance).toBeTruthy();
  });

  it("requires a non-zero time", () => {
    const { isValid, errors } = validatePaceInputs("10", "0", "0", "0");
    expect(isValid).toBe(false);
    expect(errors.time).toBeTruthy();
  });

  it("rejects minutes or seconds of 60 or more", () => {
    expect(validatePaceInputs("10", "0", "60", "0").isValid).toBe(false);
    expect(validatePaceInputs("10", "0", "30", "60").isValid).toBe(false);
  });

  it("rejects more than 24 hours (B6)", () => {
    const { isValid, errors } = validatePaceInputs("10", "99", "0", "0");
    expect(isValid).toBe(false);
    expect(errors.time).toBeTruthy();
  });

  it("accepts exactly 24 hours", () => {
    const { isValid } = validatePaceInputs("10", "24", "0", "0");
    expect(isValid).toBe(true);
  });

  it("accepts a valid distance and time", () => {
    const { isValid, errors } = validatePaceInputs("10", "0", "45", "0");
    expect(isValid).toBe(true);
    expect(errors).toEqual({});
  });
});

describe("calculateHeartRateZones", () => {
  it("derives max HR from 220 - age", () => {
    const zones = calculateHeartRateZones(30);
    expect(zones.maxHR).toBe(190);
  });
});

describe("calculateWeatherAdjustment", () => {
  it("makes no adjustment below 80F", () => {
    const result = calculateWeatherAdjustment("9:00-9:30 min/mi", 70, "Miles");
    expect(result?.adjustedEasyPace).toBeUndefined();
  });

  it("slows the easy pace by 30s/mi at 80F and above", () => {
    const result = calculateWeatherAdjustment("9:00-9:30 min/mi", 85, "Miles");
    expect(result?.adjustedEasyPace).toBe("9:30-10:00 min/miles");
  });
});
