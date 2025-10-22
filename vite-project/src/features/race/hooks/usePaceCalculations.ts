/**
 * usePaceCalculations Hook
 *
 * Stateful wrapper for pace calculations that integrates with:
 * - Race distance and target time
 * - Elevation profile from GPX data
 * - User's fitness level (threshold pace)
 *
 * Provides methods to generate and update pace strategies
 */

import { useMemo, useCallback } from "react";
import type { PaceStrategy, PaceSplit, RaceType } from "../types";
import type { Segment } from "@/features/elevation/types";
import {
  calculateTargetPace,
  calculateTrainingPaces,
  generateEvenSplits,
  generateNegativeSplits,
  generateElevationAdjustedSplits,
  calculateRequiredBasePace,
  formatPace,
} from "../utils/paceCalculations";

export interface UsePaceCalculationsParams {
  distance: number; // km
  targetTime: number; // minutes
  raceType: RaceType;
  elevationSegments?: Segment[];
  thresholdPace?: number; // optional user's threshold pace in seconds/km
}

export interface UsePaceCalculationsReturn {
  // Current pace strategy
  paceStrategy: PaceStrategy;

  // Pace metrics
  targetPacePerKm: number; // seconds
  targetPaceFormatted: string; // "5:30/km"
  averagePaceNeeded: number; // seconds (accounting for elevation)

  // Split generation methods
  generateEvenPaceSplits: () => PaceSplit[];
  generateNegativePaceSplits: () => PaceSplit[];
  generateElevationPaceSplits: () => PaceSplit[] | null;

  // Recalculation methods
  recalculateForNewTime: (newTimeMinutes: number) => PaceStrategy;
  recalculateForNewDistance: (newDistanceKm: number) => PaceStrategy;

  // Utility
  hasElevationData: boolean;
}

export function usePaceCalculations(
  params: UsePaceCalculationsParams
): UsePaceCalculationsReturn {
  const { distance, targetTime, elevationSegments, thresholdPace } = params;

  // Calculate target pace (flat ground assumption)
  const targetPacePerKm = useMemo(() => {
    return calculateTargetPace(distance, targetTime);
  }, [distance, targetTime]);

  // Calculate average pace needed (accounting for elevation if available)
  const averagePaceNeeded = useMemo(() => {
    if (!elevationSegments || elevationSegments.length === 0) {
      return targetPacePerKm;
    }

    return calculateRequiredBasePace(elevationSegments, targetTime);
  }, [elevationSegments, targetTime, targetPacePerKm]);

  // Generate training pace zones
  const paceStrategy = useMemo(() => {
    const paceToUse = thresholdPace || targetPacePerKm;
    return calculateTrainingPaces(paceToUse);
  }, [targetPacePerKm, thresholdPace]);

  // Format target pace
  const targetPaceFormatted = useMemo(() => {
    return formatPace(targetPacePerKm);
  }, [targetPacePerKm]);

  // Check if elevation data is available
  const hasElevationData = Boolean(
    elevationSegments && elevationSegments.length > 0
  );

  // Generate even pace splits
  const generateEvenPaceSplits = useCallback(() => {
    return generateEvenSplits(distance, averagePaceNeeded);
  }, [distance, averagePaceNeeded]);

  // Generate negative splits
  const generateNegativePaceSplits = useCallback(() => {
    return generateNegativeSplits(distance, averagePaceNeeded);
  }, [distance, averagePaceNeeded]);

  // Generate elevation-adjusted splits
  const generateElevationPaceSplits = useCallback(() => {
    if (!elevationSegments || elevationSegments.length === 0) {
      return null;
    }

    return generateElevationAdjustedSplits(
      elevationSegments,
      averagePaceNeeded
    );
  }, [elevationSegments, averagePaceNeeded]);

  // Recalculate for new target time
  const recalculateForNewTime = useCallback(
    (newTimeMinutes: number) => {
      const newPace = calculateTargetPace(distance, newTimeMinutes);
      return calculateTrainingPaces(newPace);
    },
    [distance]
  );

  // Recalculate for new distance
  const recalculateForNewDistance = useCallback(
    (newDistanceKm: number) => {
      const newPace = calculateTargetPace(newDistanceKm, targetTime);
      return calculateTrainingPaces(newPace);
    },
    [targetTime]
  );

  return {
    paceStrategy,
    targetPacePerKm,
    targetPaceFormatted,
    averagePaceNeeded,
    generateEvenPaceSplits,
    generateNegativePaceSplits,
    generateElevationPaceSplits,
    recalculateForNewTime,
    recalculateForNewDistance,
    hasElevationData,
  };
}

/**
 * Helper hook for quick pace strategy generation
 * Simplified version when you just need the pace zones
 */
export function useQuickPaceStrategy(
  targetPaceSecondsPerKm: number
): PaceStrategy {
  return useMemo(() => {
    return calculateTrainingPaces(targetPaceSecondsPerKm);
  }, [targetPaceSecondsPerKm]);
}
