import { describe, it, expect } from "vitest";
import {
  calculateVdot,
  predictRaceTime,
  velocityToPacePerKm,
  velocityToPacePerMile,
  formatTime,
  formatPace,
  trainingVelocity,
  calculateTrainingZones,
} from "../vdot-math";

describe("calculateVdot", () => {
  it("returns a VDOT in the expected range for a 40-minute 10K", () => {
    const vdot = calculateVdot(10000, 40 * 60);
    // A 40:00 10K works out to ~52 VDOT under the Daniels formula
    expect(vdot).toBeGreaterThan(50);
    expect(vdot).toBeLessThan(54);
  });

  it("gives a higher VDOT for a faster time over the same distance", () => {
    const slower = calculateVdot(10000, 50 * 60);
    const faster = calculateVdot(10000, 40 * 60);
    expect(faster).toBeGreaterThan(slower);
  });

  it("gives a higher VDOT for a longer distance in the same time", () => {
    const shorter = calculateVdot(5000, 30 * 60);
    const longer = calculateVdot(10000, 30 * 60);
    expect(longer).toBeGreaterThan(shorter);
  });
});

describe("predictRaceTime", () => {
  it("round-trips through calculateVdot for a marathon", () => {
    const vdot = 50;
    const predictedSeconds = predictRaceTime(vdot, 42195);
    const roundTripVdot = calculateVdot(42195, predictedSeconds);
    expect(roundTripVdot).toBeCloseTo(vdot, 1);
  });

  it("predicts a longer time for a longer distance at the same VDOT", () => {
    const vdot = 50;
    const time10k = predictRaceTime(vdot, 10000);
    const timeMarathon = predictRaceTime(vdot, 42195);
    expect(timeMarathon).toBeGreaterThan(time10k);
  });
});

describe("velocityToPacePerKm / velocityToPacePerMile", () => {
  it("converts velocity to a slower pace as velocity decreases", () => {
    const fastPace = velocityToPacePerKm(300);
    const slowPace = velocityToPacePerKm(150);
    expect(slowPace).toBeGreaterThan(fastPace);
  });

  it("returns 0 for non-positive velocity", () => {
    expect(velocityToPacePerKm(0)).toBe(0);
    expect(velocityToPacePerKm(-5)).toBe(0);
    expect(velocityToPacePerMile(0)).toBe(0);
  });

  it("mile pace is longer in seconds than km pace for the same velocity", () => {
    const velocity = 200;
    expect(velocityToPacePerMile(velocity)).toBeGreaterThan(
      velocityToPacePerKm(velocity)
    );
  });
});

describe("formatTime", () => {
  it("formats sub-hour durations as M:SS", () => {
    expect(formatTime(125)).toBe("2:05");
  });

  it("formats hour-plus durations as H:MM:SS", () => {
    expect(formatTime(3725)).toBe("1:02:05");
  });
});

describe("formatPace", () => {
  it("formats seconds as M:SS", () => {
    expect(formatPace(305)).toBe("5:05");
    expect(formatPace(60)).toBe("1:00");
  });
});

describe("trainingVelocity", () => {
  it("increases with intensity for a fixed VDOT", () => {
    const vdot = 50;
    const easy = trainingVelocity(vdot, 0.65);
    const hard = trainingVelocity(vdot, 0.95);
    expect(hard).toBeGreaterThan(easy);
  });
});

describe("calculateTrainingZones", () => {
  it("returns all 5 Daniels zones with faster pace before slower pace", () => {
    const zones = calculateTrainingZones(50);
    expect(zones).toHaveLength(5);
    expect(zones.map((z) => z.shortName)).toEqual(["E", "M", "T", "I", "R"]);

    for (const zone of zones) {
      const [fast, slow] = zone.pacePerKmSeconds;
      expect(fast).toBeLessThanOrEqual(slow);
    }
  });

  it("produces faster paces for a higher VDOT", () => {
    const lowVdot = calculateTrainingZones(35);
    const highVdot = calculateTrainingZones(60);

    const lowEasyPace = lowVdot[0].pacePerKmSeconds[0];
    const highEasyPace = highVdot[0].pacePerKmSeconds[0];
    expect(highEasyPace).toBeLessThan(lowEasyPace);
  });
});
