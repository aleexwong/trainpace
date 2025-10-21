import { Segment } from "@/types/elevation";

export interface SegmentCluster {
  startDistance: number;
  endDistance: number;
  clusterLength: number;
  startElevation: number;
  endElevation: number;
  elevationGain: number;
  avgGrade: number;
  avgPace: string;
  segmentCount: number;
  segments: Segment[];
}

interface ClusterOptions {
  gradeThreshold: number;
  adjacencyEpsilonKm: number;
}

/**
 * Clusters adjacent segments with similar grades and types
 * @param segments - Array of segments to cluster (will NOT be mutated)
 * @param options - Clustering configuration
 * @returns Array of segment clusters
 */
export function clusterSegments(
  segments: Segment[],
  options: ClusterOptions
): SegmentCluster[] {
  if (segments.length === 0) return [];

  const { gradeThreshold, adjacencyEpsilonKm } = options;

  // Sort WITHOUT mutating original
  const sorted = [...segments].sort((a, b) => a.startDistance - b.startDistance);

  const clusters: SegmentCluster[] = [];
  let currentCluster: Segment[] = [sorted[0]];

  for (let i = 1; i < sorted.length; i++) {
    const current = sorted[i];
    const prev = sorted[i - 1];

    const isAdjacent =
      Math.abs(current.startDistance - prev.endDistance) < adjacencyEpsilonKm;
    const gradeDiff = Math.abs(current.grade - prev.grade);
    const isSimilarGrade = gradeDiff <= gradeThreshold;
    const sameType = current.type === prev.type;

    if (isAdjacent && isSimilarGrade && sameType) {
      currentCluster.push(current);
    } else {
      clusters.push(buildCluster(currentCluster));
      currentCluster = [current];
    }
  }

  if (currentCluster.length > 0) {
    clusters.push(buildCluster(currentCluster));
  }

  return clusters;
}

/**
 * Builds a cluster from an array of segments
 * Correctly computes elevation gain as sum of positive deltas
 * and grade as length-weighted average
 */
export function buildCluster(segments: Segment[]): SegmentCluster {
  const startDistance = segments[0].startDistance;
  const endDistance = segments[segments.length - 1].endDistance;
  const clusterLength = endDistance - startDistance;

  const startElevation = segments[0].startElevation;
  const endElevation = segments[segments.length - 1].endElevation;

  // CORRECT: Sum positive elevation deltas across all segments
  const elevationGain = segments.reduce((sum, seg) => {
    const delta = seg.endElevation - seg.startElevation;
    return sum + Math.max(0, delta);
  }, 0);

  // CORRECT: Length-weighted average grade
  const totalLength = segments.reduce((sum, s) => sum + s.length, 0);
  const avgGrade =
    totalLength > 0
      ? segments.reduce((sum, s) => sum + s.grade * s.length, 0) / totalLength
      : 0;

  return {
    startDistance,
    endDistance,
    clusterLength,
    startElevation,
    endElevation,
    elevationGain,
    avgGrade,
    avgPace: "",
    segmentCount: segments.length,
    segments,
  };
}
