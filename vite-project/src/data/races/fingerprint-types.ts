/**
 * Route Fingerprint Types
 *
 * Type definitions for the GPX route identification system.
 * A fingerprint is a compact representation of a known race course
 * that allows uploaded GPX files to be automatically matched.
 */

// ============================================================================
// Core Fingerprint Types
// ============================================================================

/** A GPS coordinate used in fingerprinting */
export interface FingerprintCoord {
  lat: number;
  lng: number;
}

/** A waypoint sampled at a known distance along the route */
export interface FingerprintWaypoint extends FingerprintCoord {
  /** Distance from start in km */
  distanceKm: number;
}

/** Geographic bounding box */
export interface BoundingBox {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}

/**
 * Route fingerprint — a compact signature of a known race course.
 *
 * Stored per-race and used for multi-pass matching against uploaded GPX files.
 * Designed to be small (~1-2KB per race) so all fingerprints can be loaded
 * into memory at once for client-side matching.
 */
export interface RouteFingerprint {
  /** Race ID matching the registry (e.g., "boston") */
  raceId: string;

  /** Race name for display */
  name: string;

  /** Total route distance in km */
  distance: number;

  /** Geographic bounding box for fast spatial pre-filtering */
  bounds: BoundingBox;

  /** Starting coordinate */
  start: FingerprintCoord;

  /** Finishing coordinate */
  finish: FingerprintCoord;

  /** Evenly spaced waypoints along the route (20-30 points) */
  waypoints: FingerprintWaypoint[];

  /**
   * Normalized elevation profile (50 samples).
   * Values are normalized to 0-1 range relative to min/max elevation.
   * Null if the race has no meaningful elevation data.
   */
  elevationProfile: number[] | null;

  /** Total elevation gain in meters */
  elevationGain: number;
}

// ============================================================================
// Match Result Types
// ============================================================================

/** Result of matching an uploaded route against known fingerprints */
export interface RouteMatchResult {
  /** Matched race ID, or null if no match */
  raceId: string | null;

  /** Race name if matched */
  raceName: string | null;

  /** Overall confidence score (0.0 - 1.0) */
  confidence: number;

  /** Whether the route appears to be in the reverse direction */
  direction: "forward" | "reverse";

  /** Breakdown of individual pass scores */
  scores: MatchScores;
}

/** Individual scores from each matching pass */
export interface MatchScores {
  /** Distance similarity (0-1) */
  distance: number;
  /** Bounding box overlap (0-1) */
  boundingBox: number;
  /** Start/finish proximity (0-1) */
  startFinish: number;
  /** Waypoint corridor match (0-1) */
  waypoint: number;
  /** Elevation profile correlation (0-1), null if unavailable */
  elevation: number | null;
}

// ============================================================================
// Configuration
// ============================================================================

/** Tunable thresholds for the matching algorithm */
export interface MatchConfig {
  /** Distance tolerance in km (default: 2.0) */
  distanceToleranceKm: number;

  /** Bounding box padding in degrees (default: 0.01 ~1.1km) */
  boundsPaddingDeg: number;

  /** Max distance in meters from start/finish to known points (default: 500) */
  startFinishToleranceM: number;

  /** Max distance in meters from waypoint to known corridor (default: 200) */
  waypointCorridorM: number;

  /** Minimum confidence to consider a match (default: 0.80) */
  minConfidence: number;

  /** Minimum waypoint match ratio to proceed (default: 0.6) */
  minWaypointRatio: number;
}

/** Default matching configuration */
export const DEFAULT_MATCH_CONFIG: MatchConfig = {
  distanceToleranceKm: 2.0,
  boundsPaddingDeg: 0.01,
  startFinishToleranceM: 500,
  waypointCorridorM: 200,
  minConfidence: 0.80,
  minWaypointRatio: 0.6,
};
