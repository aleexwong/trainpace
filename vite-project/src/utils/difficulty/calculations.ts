import { Segment, ChallengeRating } from "@/types/elevation";
import { SegmentCluster } from "./clusterSegments";

export interface DifficultyGroupData {
  rating: ChallengeRating;
  clusters: SegmentCluster[];
  totalTime: number;
  totalElevationGain: number;
  percentOfTotalTime: number;
  percentOfTotalDifficulty: number;
  label: string;
  color: {
    bg: string;
    text: string;
    accent: string;
    header: string;
  };
}

/**
 * Computes the total time for an array of segments
 * @param segments - Array of segments
 * @param basePaceMinPerKm - Base pace in min/km
 * @returns Total time in minutes
 */
export function computeTotalTime(
  segments: Segment[],
  basePaceMinPerKm: number
): number {
  return segments.reduce(
    (sum, seg) =>
      sum + seg.length * basePaceMinPerKm * seg.estimatedTimeMultiplier,
    0
  );
}

/**
 * Computes difficulty weight as positive overhead beyond base pace
 * Used for computing % of total difficulty
 * @param segments - Array of segments
 * @param basePaceMinPerKm - Base pace in min/km
 * @returns Total difficulty weight
 */
export function computeDifficultyWeight(
  segments: Segment[],
  basePaceMinPerKm: number
): number {
  return segments.reduce((sum, seg) => {
    const overhead = Math.max(0, seg.estimatedTimeMultiplier - 1);
    return sum + seg.length * basePaceMinPerKm * overhead;
  }, 0);
}

/**
 * Computes the length-weighted time multiplier for a cluster
 * @param cluster - Segment cluster
 * @returns Weighted average time multiplier
 */
export function computeWeightedMultiplier(cluster: SegmentCluster): number {
  const totalLen = cluster.segments.reduce((len, s) => len + s.length, 0);
  
  if (totalLen === 0) return 0;
  
  return (
    cluster.segments.reduce(
      (sum, s) => sum + s.estimatedTimeMultiplier * s.length,
      0
    ) / totalLen
  );
}
