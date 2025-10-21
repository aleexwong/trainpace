import { describe, it, expect } from "vitest";
import {
  computeTotalTime,
  computeDifficultyWeight,
  computeWeightedMultiplier,
} from "../calculations";
import { buildCluster } from "../clusterSegments";
import { Segment } from "@/types/elevation";

describe("calculations", () => {
  const createSegment = (overrides: Partial<Segment>): Segment => ({
    startDistance: 0,
    endDistance: 1,
    length: 1,
    startElevation: 0,
    endElevation: 0,
    grade: 0,
    type: "flat",
    challengeRating: "easy",
    estimatedTimeMultiplier: 1,
    pacingAdvice: "",
    ...overrides,
  });

  describe("computeTotalTime", () => {
    it("should compute total time for segments", () => {
      const segments = [
        createSegment({ length: 2, estimatedTimeMultiplier: 1 }),
        createSegment({ length: 3, estimatedTimeMultiplier: 1.5 }),
      ];

      const basePace = 5; // 5 min/km
      const totalTime = computeTotalTime(segments, basePace);

      // (2 * 5 * 1) + (3 * 5 * 1.5) = 10 + 22.5 = 32.5
      expect(totalTime).toBe(32.5);
    });

    it("should handle empty array", () => {
      expect(computeTotalTime([], 5)).toBe(0);
    });

    it("should handle zero-length segments", () => {
      const segments = [createSegment({ length: 0, estimatedTimeMultiplier: 1 })];
      expect(computeTotalTime(segments, 5)).toBe(0);
    });
  });

  describe("computeDifficultyWeight", () => {
    it("should compute positive overhead only", () => {
      const segments = [
        createSegment({ length: 1, estimatedTimeMultiplier: 1.5 }), // +0.5 overhead
        createSegment({ length: 2, estimatedTimeMultiplier: 0.8 }), // 0 overhead (negative ignored)
        createSegment({ length: 3, estimatedTimeMultiplier: 2.0 }), // +1.0 overhead
      ];

      const basePace = 5;
      const weight = computeDifficultyWeight(segments, basePace);

      // (1 * 5 * 0.5) + (2 * 5 * 0) + (3 * 5 * 1.0)
      // = 2.5 + 0 + 15 = 17.5
      expect(weight).toBe(17.5);
    });

    it("should return 0 when all multipliers are <= 1", () => {
      const segments = [
        createSegment({ length: 1, estimatedTimeMultiplier: 1.0 }),
        createSegment({ length: 2, estimatedTimeMultiplier: 0.9 }),
      ];

      expect(computeDifficultyWeight(segments, 5)).toBe(0);
    });

    it("should handle empty array", () => {
      expect(computeDifficultyWeight([], 5)).toBe(0);
    });
  });

  describe("computeWeightedMultiplier", () => {
    it("should compute length-weighted multiplier", () => {
      const segments = [
        createSegment({ length: 1, estimatedTimeMultiplier: 1.5 }),
        createSegment({ length: 3, estimatedTimeMultiplier: 2.0 }),
      ];

      const cluster = buildCluster(segments);
      const weighted = computeWeightedMultiplier(cluster);

      // (1.5 * 1 + 2.0 * 3) / (1 + 3) = (1.5 + 6.0) / 4 = 7.5 / 4 = 1.875
      expect(weighted).toBe(1.875);
    });

    it("should handle zero total length", () => {
      const segments = [createSegment({ length: 0, estimatedTimeMultiplier: 1.5 })];
      const cluster = buildCluster(segments);
      expect(computeWeightedMultiplier(cluster)).toBe(0);
    });

    it("should handle single segment", () => {
      const segments = [createSegment({ length: 5, estimatedTimeMultiplier: 1.8 })];
      const cluster = buildCluster(segments);
      expect(computeWeightedMultiplier(cluster)).toBe(1.8);
    });
  });

  describe("integration: percentage calculations", () => {
    it("should ensure percentages sum to ~100%", () => {
      const segments = [
        createSegment({
          length: 10,
          estimatedTimeMultiplier: 1.0,
          challengeRating: "easy",
        }),
        createSegment({
          length: 5,
          estimatedTimeMultiplier: 1.5,
          challengeRating: "moderate",
        }),
        createSegment({
          length: 3,
          estimatedTimeMultiplier: 2.0,
          challengeRating: "hard",
        }),
      ];

      const basePace = 5;
      const totalTime = computeTotalTime(segments, basePace);

      const easyTime = segments[0].length * basePace * segments[0].estimatedTimeMultiplier;
      const moderateTime = segments[1].length * basePace * segments[1].estimatedTimeMultiplier;
      const hardTime = segments[2].length * basePace * segments[2].estimatedTimeMultiplier;

      const easyPercent = (easyTime / totalTime) * 100;
      const moderatePercent = (moderateTime / totalTime) * 100;
      const hardPercent = (hardTime / totalTime) * 100;

      const sum = easyPercent + moderatePercent + hardPercent;

      // Should sum to 100% (within floating point tolerance)
      expect(sum).toBeCloseTo(100, 10);
    });

    it("should compute difficulty percentages correctly", () => {
      const segments = [
        createSegment({
          length: 10,
          estimatedTimeMultiplier: 1.0, // No overhead
          challengeRating: "easy",
        }),
        createSegment({
          length: 5,
          estimatedTimeMultiplier: 1.5, // 0.5 overhead
          challengeRating: "moderate",
        }),
        createSegment({
          length: 3,
          estimatedTimeMultiplier: 2.0, // 1.0 overhead
          challengeRating: "hard",
        }),
      ];

      const basePace = 5;
      const totalWeight = computeDifficultyWeight(segments, basePace);

      const easyWeight = computeDifficultyWeight([segments[0]], basePace);
      const moderateWeight = computeDifficultyWeight([segments[1]], basePace);
      const hardWeight = computeDifficultyWeight([segments[2]], basePace);

      const easyPercent = (easyWeight / totalWeight) * 100;
      const moderatePercent = (moderateWeight / totalWeight) * 100;
      const hardPercent = (hardWeight / totalWeight) * 100;

      // Easy has no overhead, so 0%
      expect(easyPercent).toBe(0);

      // Moderate: (5 * 5 * 0.5) = 12.5
      // Hard: (3 * 5 * 1.0) = 15
      // Total: 27.5
      // Moderate: 12.5 / 27.5 ≈ 45.45%
      // Hard: 15 / 27.5 ≈ 54.55%
      expect(moderatePercent).toBeCloseTo(45.45, 2);
      expect(hardPercent).toBeCloseTo(54.55, 2);

      const sum = easyPercent + moderatePercent + hardPercent;
      expect(sum).toBeCloseTo(100, 10);
    });
  });
});
