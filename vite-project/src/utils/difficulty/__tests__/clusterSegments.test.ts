import { describe, it, expect } from "vitest";
import { clusterSegments, buildCluster } from "../clusterSegments";
import { Segment } from "@/types/elevation";

describe("clusterSegments", () => {
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

  it("should NOT mutate the original segments array", () => {
    const segments = [
      createSegment({ startDistance: 5, grade: 2 }),
      createSegment({ startDistance: 0, grade: 1 }),
      createSegment({ startDistance: 2, grade: 1.5 }),
    ];
    
    const originalOrder = [...segments];
    clusterSegments(segments, { gradeThreshold: 1.5, adjacencyEpsilonKm: 0.01 });
    
    expect(segments).toEqual(originalOrder);
  });

  it("should cluster adjacent segments with similar grades", () => {
    const segments = [
      createSegment({
        startDistance: 0,
        endDistance: 1,
        grade: 5,
        type: "uphill",
      }),
      createSegment({
        startDistance: 1,
        endDistance: 2,
        grade: 5.5,
        type: "uphill",
      }),
      createSegment({
        startDistance: 2,
        endDistance: 3,
        grade: 4.8,
        type: "uphill",
      }),
    ];

    const clusters = clusterSegments(segments, {
      gradeThreshold: 1,
      adjacencyEpsilonKm: 0.01,
    });

    expect(clusters).toHaveLength(1);
    expect(clusters[0].segments).toHaveLength(3);
  });

  it("should split clusters when grade difference exceeds threshold", () => {
    const segments = [
      createSegment({
        startDistance: 0,
        endDistance: 1,
        grade: 2,
        type: "uphill",
      }),
      createSegment({
        startDistance: 1,
        endDistance: 2,
        grade: 5,
        type: "uphill",
      }),
    ];

    const clusters = clusterSegments(segments, {
      gradeThreshold: 1,
      adjacencyEpsilonKm: 0.01,
    });

    expect(clusters).toHaveLength(2);
  });

  it("should split clusters when segment type changes", () => {
    const segments = [
      createSegment({
        startDistance: 0,
        endDistance: 1,
        grade: 2,
        type: "uphill",
      }),
      createSegment({
        startDistance: 1,
        endDistance: 2,
        grade: 2,
        type: "flat",
      }),
    ];

    const clusters = clusterSegments(segments, {
      gradeThreshold: 1,
      adjacencyEpsilonKm: 0.01,
    });

    expect(clusters).toHaveLength(2);
  });

  it("should split clusters when segments are not adjacent", () => {
    const segments = [
      createSegment({
        startDistance: 0,
        endDistance: 1,
        grade: 2,
        type: "uphill",
      }),
      createSegment({
        startDistance: 2,
        endDistance: 3,
        grade: 2,
        type: "uphill",
      }),
    ];

    const clusters = clusterSegments(segments, {
      gradeThreshold: 1,
      adjacencyEpsilonKm: 0.01,
    });

    expect(clusters).toHaveLength(2);
  });

  it("should use custom adjacency epsilon", () => {
    const segments = [
      createSegment({
        startDistance: 0,
        endDistance: 1,
        grade: 2,
        type: "uphill",
      }),
      createSegment({
        startDistance: 1.05,
        endDistance: 2.05,
        grade: 2,
        type: "uphill",
      }),
    ];

    // Should merge with larger epsilon
    const merged = clusterSegments(segments, {
      gradeThreshold: 1,
      adjacencyEpsilonKm: 0.1,
    });
    expect(merged).toHaveLength(1);

    // Should split with smaller epsilon
    const split = clusterSegments(segments, {
      gradeThreshold: 1,
      adjacencyEpsilonKm: 0.01,
    });
    expect(split).toHaveLength(2);
  });

  it("should handle empty array", () => {
    const clusters = clusterSegments([], {
      gradeThreshold: 1,
      adjacencyEpsilonKm: 0.01,
    });
    expect(clusters).toHaveLength(0);
  });

  it("should handle single segment", () => {
    const segments = [
      createSegment({
        startDistance: 0,
        endDistance: 1,
        grade: 5,
      }),
    ];

    const clusters = clusterSegments(segments, {
      gradeThreshold: 1,
      adjacencyEpsilonKm: 0.01,
    });

    expect(clusters).toHaveLength(1);
    expect(clusters[0].segments).toHaveLength(1);
  });
});

describe("buildCluster", () => {
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

  it("should compute elevation gain as sum of positive deltas", () => {
    const segments = [
      createSegment({
        startDistance: 0,
        endDistance: 1,
        startElevation: 100,
        endElevation: 120, // +20m
      }),
      createSegment({
        startDistance: 1,
        endDistance: 2,
        startElevation: 120,
        endElevation: 115, // -5m (should not count)
      }),
      createSegment({
        startDistance: 2,
        endDistance: 3,
        startElevation: 115,
        endElevation: 135, // +20m
      }),
    ];

    const cluster = buildCluster(segments);
    
    // Should sum only positive deltas: 20 + 0 + 20 = 40m
    expect(cluster.elevationGain).toBe(40);
    
    // NOT the naive end - start: 135 - 100 = 35m
    expect(cluster.elevationGain).not.toBe(35);
  });

  it("should compute length-weighted average grade", () => {
    const segments = [
      createSegment({
        startDistance: 0,
        endDistance: 1,
        length: 1,
        grade: 5,
      }),
      createSegment({
        startDistance: 1,
        endDistance: 4,
        length: 3,
        grade: 3,
      }),
    ];

    const cluster = buildCluster(segments);
    
    // Weighted: (5*1 + 3*3) / (1+3) = (5 + 9) / 4 = 3.5
    expect(cluster.avgGrade).toBe(3.5);
    
    // NOT simple average: (5 + 3) / 2 = 4
    expect(cluster.avgGrade).not.toBe(4);
  });

  it("should compute cluster length correctly", () => {
    const segments = [
      createSegment({
        startDistance: 5,
        endDistance: 6,
      }),
      createSegment({
        startDistance: 6,
        endDistance: 8.5,
      }),
    ];

    const cluster = buildCluster(segments);
    expect(cluster.clusterLength).toBe(3.5);
    expect(cluster.startDistance).toBe(5);
    expect(cluster.endDistance).toBe(8.5);
  });

  it("should handle zero-length cluster", () => {
    const segments = [
      createSegment({
        startDistance: 5,
        endDistance: 5,
        length: 0,
        grade: 5,
      }),
    ];

    const cluster = buildCluster(segments);
    expect(cluster.avgGrade).toBe(0);
    expect(cluster.clusterLength).toBe(0);
  });

  it("should handle flat sections with no elevation gain", () => {
    const segments = [
      createSegment({
        startDistance: 0,
        endDistance: 5,
        startElevation: 100,
        endElevation: 100,
      }),
    ];

    const cluster = buildCluster(segments);
    expect(cluster.elevationGain).toBe(0);
  });

  it("should ignore negative elevation changes in gain calculation", () => {
    const segments = [
      createSegment({
        startDistance: 0,
        endDistance: 1,
        startElevation: 100,
        endElevation: 80, // -20m
      }),
      createSegment({
        startDistance: 1,
        endDistance: 2,
        startElevation: 80,
        endElevation: 75, // -5m
      }),
    ];

    const cluster = buildCluster(segments);
    expect(cluster.elevationGain).toBe(0);
  });

  it("should count segment count correctly", () => {
    const segments = [
      createSegment({}),
      createSegment({}),
      createSegment({}),
    ];

    const cluster = buildCluster(segments);
    expect(cluster.segmentCount).toBe(3);
  });
});
