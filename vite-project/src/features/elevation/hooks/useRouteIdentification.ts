/**
 * useRouteIdentification Hook
 *
 * Matches uploaded GPX routes against known race courses.
 * Designed to run after GPX parsing, before or during upload.
 *
 * Usage:
 * ```tsx
 * const { match, identify, isIdentifying } = useRouteIdentification();
 *
 * // After parsing GPX
 * const result = identify(gpxPoints, metadata.totalDistance);
 * if (result.raceId) {
 *   console.log(`Matched: ${result.raceName}`);
 * }
 * ```
 */

import { useState, useCallback } from "react";
import {
  identifyUploadedRoute,
  type RouteMatchResult,
} from "../../../data/races/fingerprint-registry";

interface UseRouteIdentificationReturn {
  /** Most recent match result */
  match: RouteMatchResult | null;

  /** Whether identification is in progress */
  isIdentifying: boolean;

  /**
   * Identify a route from its GPS points and distance.
   * Returns the match result and also stores it in state.
   */
  identify: (
    points: Array<{ lat: number; lng: number; ele?: number }>,
    totalDistanceKm: number
  ) => RouteMatchResult;

  /** Clear the current match */
  clearMatch: () => void;
}

export function useRouteIdentification(): UseRouteIdentificationReturn {
  const [match, setMatch] = useState<RouteMatchResult | null>(null);
  const [isIdentifying, setIsIdentifying] = useState(false);

  const identify = useCallback(
    (
      points: Array<{ lat: number; lng: number; ele?: number }>,
      totalDistanceKm: number
    ): RouteMatchResult => {
      setIsIdentifying(true);
      try {
        const result = identifyUploadedRoute(points, totalDistanceKm);
        setMatch(result);
        return result;
      } finally {
        setIsIdentifying(false);
      }
    },
    []
  );

  const clearMatch = useCallback(() => {
    setMatch(null);
  }, []);

  return { match, isIdentifying, identify, clearMatch };
}
