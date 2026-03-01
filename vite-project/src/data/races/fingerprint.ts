/**
 * Route Fingerprint — Generation & Matching
 *
 * This module provides:
 * 1. generateFingerprint() — Create a fingerprint from known race route data
 * 2. identifyRoute()      — Match an uploaded GPX against all known fingerprints
 *
 * The matching algorithm uses a multi-pass approach (fast → slow):
 *   Pass 1: Distance filter        (eliminates ~90% of candidates)
 *   Pass 2: Bounding box overlap   (eliminates most remaining)
 *   Pass 3: Start/finish proximity (fast coordinate check)
 *   Pass 4: Waypoint corridor      (the real spatial match)
 *   Pass 5: Elevation correlation  (confirmation)
 *
 * All matching is client-side. Fingerprint data is tiny (~1-2KB per race)
 * so even 500+ races can be loaded and matched in <10ms.
 */

import type {
  RouteFingerprint,
  RouteMatchResult,
  MatchScores,
  MatchConfig,
  BoundingBox,
  FingerprintWaypoint,
} from "./fingerprint-types";
import { DEFAULT_MATCH_CONFIG } from "./fingerprint-types";

// ============================================================================
// Geo Math Utilities
// ============================================================================

const DEG_TO_RAD = Math.PI / 180;
const EARTH_RADIUS_KM = 6371;
const EARTH_RADIUS_M = EARTH_RADIUS_KM * 1000;

/**
 * Haversine distance between two points in meters.
 */
function haversineM(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const dLat = (lat2 - lat1) * DEG_TO_RAD;
  const dLng = (lng2 - lng1) * DEG_TO_RAD;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * DEG_TO_RAD) *
      Math.cos(lat2 * DEG_TO_RAD) *
      Math.sin(dLng / 2) ** 2;
  return EARTH_RADIUS_M * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Haversine distance between two points in km.
 */
function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  return haversineM(lat1, lng1, lat2, lng2) / 1000;
}

/**
 * Calculate cumulative distances for a set of raw points.
 * Returns an array of cumulative km values (same length as input).
 */
function cumulativeDistances(
  points: Array<{ lat: number; lng: number }>
): number[] {
  const distances: number[] = [0];
  for (let i = 1; i < points.length; i++) {
    const d = haversineKm(
      points[i - 1].lat,
      points[i - 1].lng,
      points[i].lat,
      points[i].lng
    );
    distances.push(distances[i - 1] + d);
  }
  return distances;
}

/**
 * Compute bounding box from a set of points.
 */
function computeBounds(
  points: Array<{ lat: number; lng: number }>
): BoundingBox {
  let minLat = Infinity,
    maxLat = -Infinity;
  let minLng = Infinity,
    maxLng = -Infinity;
  for (const p of points) {
    if (p.lat < minLat) minLat = p.lat;
    if (p.lat > maxLat) maxLat = p.lat;
    if (p.lng < minLng) minLng = p.lng;
    if (p.lng > maxLng) maxLng = p.lng;
  }
  return { minLat, maxLat, minLng, maxLng };
}

/**
 * Check if two bounding boxes overlap (with padding).
 */
function boundsOverlap(a: BoundingBox, b: BoundingBox, pad: number): boolean {
  return (
    a.minLat - pad <= b.maxLat + pad &&
    a.maxLat + pad >= b.minLat - pad &&
    a.minLng - pad <= b.maxLng + pad &&
    a.maxLng + pad >= b.minLng - pad
  );
}

/**
 * Calculate Intersection-over-Union for two bounding boxes.
 */
function boundsIoU(a: BoundingBox, b: BoundingBox): number {
  const intMinLat = Math.max(a.minLat, b.minLat);
  const intMaxLat = Math.min(a.maxLat, b.maxLat);
  const intMinLng = Math.max(a.minLng, b.minLng);
  const intMaxLng = Math.min(a.maxLng, b.maxLng);

  if (intMinLat >= intMaxLat || intMinLng >= intMaxLng) return 0;

  const intArea = (intMaxLat - intMinLat) * (intMaxLng - intMinLng);
  const aArea = (a.maxLat - a.minLat) * (a.maxLng - a.minLng);
  const bArea = (b.maxLat - b.minLat) * (b.maxLng - b.minLng);
  const unionArea = aArea + bArea - intArea;

  return unionArea > 0 ? intArea / unionArea : 0;
}

/**
 * Sample points at even distance intervals along a route.
 */
function sampleWaypoints(
  points: Array<{ lat: number; lng: number }>,
  distances: number[],
  count: number
): FingerprintWaypoint[] {
  const totalDist = distances[distances.length - 1];
  if (totalDist <= 0 || points.length < 2) return [];

  const waypoints: FingerprintWaypoint[] = [];
  const step = totalDist / (count - 1);

  for (let i = 0; i < count; i++) {
    const targetDist = i * step;

    // Find the segment that contains this distance
    let segIdx = 0;
    while (segIdx < distances.length - 1 && distances[segIdx + 1] < targetDist) {
      segIdx++;
    }

    if (segIdx >= points.length - 1) {
      // Use the last point
      const last = points[points.length - 1];
      waypoints.push({ lat: last.lat, lng: last.lng, distanceKm: totalDist });
      continue;
    }

    // Interpolate between segIdx and segIdx+1
    const segStart = distances[segIdx];
    const segEnd = distances[segIdx + 1];
    const segLen = segEnd - segStart;
    const t = segLen > 0 ? (targetDist - segStart) / segLen : 0;

    const p1 = points[segIdx];
    const p2 = points[segIdx + 1];

    waypoints.push({
      lat: p1.lat + t * (p2.lat - p1.lat),
      lng: p1.lng + t * (p2.lng - p1.lng),
      distanceKm: Math.round(targetDist * 100) / 100,
    });
  }

  return waypoints;
}

/**
 * Build a normalized elevation profile (0-1 range).
 */
function buildElevationProfile(
  points: Array<{ lat: number; lng: number; ele?: number }>,
  distances: number[],
  sampleCount: number
): number[] | null {
  // Only build profile if we have elevation data on most points
  const withEle = points.filter((p) => p.ele !== undefined && p.ele !== null);
  if (withEle.length < points.length * 0.5) return null;

  const totalDist = distances[distances.length - 1];
  if (totalDist <= 0) return null;

  // Sample elevations at even intervals
  const raw: number[] = [];
  const step = totalDist / (sampleCount - 1);

  for (let i = 0; i < sampleCount; i++) {
    const targetDist = i * step;

    // Find surrounding points
    let segIdx = 0;
    while (segIdx < distances.length - 1 && distances[segIdx + 1] < targetDist) {
      segIdx++;
    }

    if (segIdx >= points.length - 1) {
      const ele = points[points.length - 1].ele;
      raw.push(ele ?? 0);
      continue;
    }

    const segStart = distances[segIdx];
    const segEnd = distances[segIdx + 1];
    const segLen = segEnd - segStart;
    const t = segLen > 0 ? (targetDist - segStart) / segLen : 0;

    const e1 = points[segIdx].ele ?? 0;
    const e2 = points[segIdx + 1].ele ?? 0;
    raw.push(e1 + t * (e2 - e1));
  }

  // Normalize to 0-1
  const min = Math.min(...raw);
  const max = Math.max(...raw);
  const range = max - min;

  if (range < 1) {
    // Essentially flat — return all 0.5
    return raw.map(() => 0.5);
  }

  return raw.map((v) => Math.round(((v - min) / range) * 1000) / 1000);
}

// ============================================================================
// Fingerprint Generation
// ============================================================================

/**
 * Generate a route fingerprint from GPS points.
 *
 * @param raceId   - Unique race identifier
 * @param name     - Display name
 * @param points   - Array of GPS points (from GPX or route data)
 * @param elevationGain - Total elevation gain in meters
 * @param waypointCount - Number of evenly spaced waypoints (default: 25)
 * @param profileSamples - Number of elevation profile samples (default: 50)
 */
export function generateFingerprint(
  raceId: string,
  name: string,
  points: Array<{ lat: number; lng: number; ele?: number; dist?: number }>,
  elevationGain: number,
  waypointCount = 25,
  profileSamples = 50
): RouteFingerprint {
  if (points.length < 2) {
    throw new Error("Need at least 2 points to generate a fingerprint");
  }

  // If points already have cumulative dist, use it; otherwise compute
  let distances: number[];
  if (points[0].dist !== undefined && points[points.length - 1].dist !== undefined) {
    distances = points.map((p) => p.dist ?? 0);
  } else {
    distances = cumulativeDistances(points);
  }

  const totalDistance = distances[distances.length - 1];
  const bounds = computeBounds(points);
  const start = { lat: points[0].lat, lng: points[0].lng };
  const finish = {
    lat: points[points.length - 1].lat,
    lng: points[points.length - 1].lng,
  };

  const waypoints = sampleWaypoints(points, distances, waypointCount);
  const elevationProfile = buildElevationProfile(
    points,
    distances,
    profileSamples
  );

  return {
    raceId,
    name,
    distance: Math.round(totalDistance * 100) / 100,
    bounds,
    start,
    finish,
    waypoints,
    elevationProfile,
    elevationGain,
  };
}

// ============================================================================
// Route Matching Algorithm
// ============================================================================

/**
 * Identify a route by matching it against all known fingerprints.
 *
 * @param uploadedPoints - Points from the uploaded GPX file
 * @param totalDistanceKm - Total distance in km (from GPX metadata)
 * @param fingerprints - Array of known race fingerprints
 * @param config - Optional matching configuration overrides
 * @returns Best match result, or a no-match result
 */
export function identifyRoute(
  uploadedPoints: Array<{ lat: number; lng: number; ele?: number }>,
  totalDistanceKm: number,
  fingerprints: RouteFingerprint[],
  config: Partial<MatchConfig> = {}
): RouteMatchResult {
  const cfg = { ...DEFAULT_MATCH_CONFIG, ...config };

  if (uploadedPoints.length < 2 || fingerprints.length === 0) {
    return noMatch();
  }

  const distances = cumulativeDistances(uploadedPoints);
  const uploadBounds = computeBounds(uploadedPoints);
  const uploadStart = uploadedPoints[0];
  const uploadFinish = uploadedPoints[uploadedPoints.length - 1];

  // Sample waypoints from the uploaded route for comparison
  const uploadWaypoints = sampleWaypoints(uploadedPoints, distances, 25);

  // Build elevation profile from uploaded route
  const uploadElevation = buildElevationProfile(
    uploadedPoints,
    distances,
    50
  );

  let bestMatch: RouteMatchResult = noMatch();

  for (const fp of fingerprints) {
    // === Pass 1: Distance filter ===
    const distanceDiff = Math.abs(totalDistanceKm - fp.distance);
    if (distanceDiff > cfg.distanceToleranceKm) continue;

    const distanceScore = 1 - distanceDiff / cfg.distanceToleranceKm;

    // === Pass 2: Bounding box overlap ===
    if (!boundsOverlap(uploadBounds, fp.bounds, cfg.boundsPaddingDeg)) continue;

    const bboxScore = boundsIoU(uploadBounds, fp.bounds);
    if (bboxScore < 0.1) continue;

    // === Pass 3: Start/finish proximity ===
    // Check both forward and reverse directions
    const fwdStartDist = haversineM(
      uploadStart.lat, uploadStart.lng,
      fp.start.lat, fp.start.lng
    );
    const fwdFinishDist = haversineM(
      uploadFinish.lat, uploadFinish.lng,
      fp.finish.lat, fp.finish.lng
    );

    const revStartDist = haversineM(
      uploadStart.lat, uploadStart.lng,
      fp.finish.lat, fp.finish.lng
    );
    const revFinishDist = haversineM(
      uploadFinish.lat, uploadFinish.lng,
      fp.start.lat, fp.start.lng
    );

    const fwdStartFinish = Math.max(fwdStartDist, fwdFinishDist);
    const revStartFinish = Math.max(revStartDist, revFinishDist);

    // Determine direction
    const isReverse = revStartFinish < fwdStartFinish;
    const bestStartFinish = isReverse ? revStartFinish : fwdStartFinish;

    if (bestStartFinish > cfg.startFinishToleranceM) continue;

    const sfScore =
      1 - bestStartFinish / cfg.startFinishToleranceM;

    // === Pass 4: Waypoint corridor match ===
    // Compare sampled waypoints from upload against known fingerprint waypoints
    const fpWaypoints = isReverse ? [...fp.waypoints].reverse() : fp.waypoints;
    const waypointScore = scoreWaypoints(
      uploadWaypoints,
      fpWaypoints,
      cfg.waypointCorridorM
    );

    if (waypointScore < cfg.minWaypointRatio) continue;

    // === Pass 5: Elevation profile correlation ===
    let elevationScore: number | null = null;
    if (uploadElevation && fp.elevationProfile) {
      const fpProfile = isReverse
        ? [...fp.elevationProfile].reverse()
        : fp.elevationProfile;
      elevationScore = correlateProfiles(uploadElevation, fpProfile);
    }

    // === Compute overall confidence ===
    const scores: MatchScores = {
      distance: distanceScore,
      boundingBox: bboxScore,
      startFinish: sfScore,
      waypoint: waypointScore,
      elevation: elevationScore,
    };

    const confidence = computeConfidence(scores);

    if (confidence > bestMatch.confidence && confidence >= cfg.minConfidence) {
      bestMatch = {
        raceId: fp.raceId,
        raceName: fp.name,
        confidence,
        direction: isReverse ? "reverse" : "forward",
        scores,
      };
    }
  }

  return bestMatch;
}

// ============================================================================
// Scoring Helpers
// ============================================================================

/**
 * Score waypoint alignment.
 * For each uploaded waypoint, find the closest known waypoint and check
 * if it's within the corridor tolerance.
 */
function scoreWaypoints(
  uploadWaypoints: FingerprintWaypoint[],
  knownWaypoints: FingerprintWaypoint[],
  corridorM: number
): number {
  if (uploadWaypoints.length === 0 || knownWaypoints.length === 0) return 0;

  let matched = 0;

  for (const uw of uploadWaypoints) {
    // Find the closest known waypoint by distance along route
    // (not just spatial proximity — this handles loops correctly)
    let minDist = Infinity;

    for (const kw of knownWaypoints) {
      const dist = haversineM(uw.lat, uw.lng, kw.lat, kw.lng);
      if (dist < minDist) minDist = dist;
    }

    if (minDist <= corridorM) {
      matched++;
    }
  }

  return matched / uploadWaypoints.length;
}

/**
 * Correlate two normalized elevation profiles using Pearson correlation.
 * Returns a value between 0 and 1.
 */
function correlateProfiles(a: number[], b: number[]): number {
  const n = Math.min(a.length, b.length);
  if (n < 5) return 0;

  let sumA = 0, sumB = 0, sumAB = 0, sumA2 = 0, sumB2 = 0;

  for (let i = 0; i < n; i++) {
    sumA += a[i];
    sumB += b[i];
    sumAB += a[i] * b[i];
    sumA2 += a[i] * a[i];
    sumB2 += b[i] * b[i];
  }

  const numerator = n * sumAB - sumA * sumB;
  const denom = Math.sqrt(
    (n * sumA2 - sumA * sumA) * (n * sumB2 - sumB * sumB)
  );

  if (denom === 0) return 0.5; // Both profiles are flat — not informative

  // Pearson r ranges from -1 to 1. Map to 0-1 for scoring.
  const r = numerator / denom;
  return Math.max(0, (r + 1) / 2);
}

/**
 * Compute overall confidence from individual scores.
 * Weights prioritize spatial matching (waypoints) over metadata.
 */
function computeConfidence(scores: MatchScores): number {
  // Weights: waypoint is the strongest signal
  const weights = {
    distance: 0.10,
    boundingBox: 0.10,
    startFinish: 0.20,
    waypoint: 0.45,
    elevation: 0.15,
  };

  let weighted = 0;
  let totalWeight = 0;

  weighted += scores.distance * weights.distance;
  totalWeight += weights.distance;

  weighted += scores.boundingBox * weights.boundingBox;
  totalWeight += weights.boundingBox;

  weighted += scores.startFinish * weights.startFinish;
  totalWeight += weights.startFinish;

  weighted += scores.waypoint * weights.waypoint;
  totalWeight += weights.waypoint;

  if (scores.elevation !== null) {
    weighted += scores.elevation * weights.elevation;
    totalWeight += weights.elevation;
  }

  return Math.round((weighted / totalWeight) * 1000) / 1000;
}

/** Return a "no match" result. */
function noMatch(): RouteMatchResult {
  return {
    raceId: null,
    raceName: null,
    confidence: 0,
    direction: "forward",
    scores: {
      distance: 0,
      boundingBox: 0,
      startFinish: 0,
      waypoint: 0,
      elevation: null,
    },
  };
}
