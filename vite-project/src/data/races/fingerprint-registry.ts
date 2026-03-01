/**
 * Route Fingerprint Registry
 *
 * Central access point for route identification. Manages the set of
 * known fingerprints and provides a simple API for matching uploaded routes.
 *
 * Usage:
 * ```typescript
 * import { identifyUploadedRoute, addFingerprint } from "@/data/races/fingerprint-registry";
 *
 * // Match an uploaded GPX against all known races
 * const match = identifyUploadedRoute(gpxPoints, totalDistanceKm);
 * if (match.raceId) {
 *   console.log(`Matched: ${match.raceName} (${match.confidence * 100}%)`);
 * }
 *
 * // Register a new race fingerprint at runtime
 * addFingerprint(newFingerprint);
 * ```
 */

import type { RouteFingerprint, RouteMatchResult, MatchConfig } from "./fingerprint-types";
import { RACE_FINGERPRINTS } from "./fingerprint-data";
import { identifyRoute } from "./fingerprint";

// ============================================================================
// Registry State
// ============================================================================

/** Mutable fingerprint array (starts with static data, can be extended) */
const fingerprints: RouteFingerprint[] = [...RACE_FINGERPRINTS];

// ============================================================================
// Public API
// ============================================================================

/**
 * Identify an uploaded route against all known race fingerprints.
 *
 * @param points - GPS points from the uploaded GPX file
 * @param totalDistanceKm - Total route distance in km (from GPX metadata)
 * @param config - Optional matching config overrides
 */
export function identifyUploadedRoute(
  points: Array<{ lat: number; lng: number; ele?: number }>,
  totalDistanceKm: number,
  config?: Partial<MatchConfig>
): RouteMatchResult {
  return identifyRoute(points, totalDistanceKm, fingerprints, config);
}

/**
 * Add a fingerprint to the registry at runtime.
 * Use this when a new race is added dynamically (e.g., from Firestore).
 */
export function addFingerprint(fp: RouteFingerprint): void {
  // Replace existing fingerprint for same raceId, or push new
  const idx = fingerprints.findIndex((f) => f.raceId === fp.raceId);
  if (idx >= 0) {
    fingerprints[idx] = fp;
  } else {
    fingerprints.push(fp);
  }
}

/**
 * Remove a fingerprint from the registry.
 */
export function removeFingerprint(raceId: string): boolean {
  const idx = fingerprints.findIndex((f) => f.raceId === raceId);
  if (idx >= 0) {
    fingerprints.splice(idx, 1);
    return true;
  }
  return false;
}

/**
 * Get all registered fingerprints.
 */
export function getAllFingerprints(): ReadonlyArray<RouteFingerprint> {
  return fingerprints;
}

/**
 * Get the number of registered fingerprints.
 */
export function getFingerprintCount(): number {
  return fingerprints.length;
}

/**
 * Get a fingerprint by race ID.
 */
export function getFingerprint(raceId: string): RouteFingerprint | undefined {
  return fingerprints.find((f) => f.raceId === raceId);
}

// ============================================================================
// Re-exports for convenience
// ============================================================================

export { generateFingerprint } from "./fingerprint";
export type {
  RouteFingerprint,
  RouteMatchResult,
  MatchScores,
  MatchConfig,
} from "./fingerprint-types";
