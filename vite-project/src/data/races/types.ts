/**
 * Race Data Types
 *
 * This module defines the type system for the scalable race data architecture.
 * Types are split into:
 * - Metadata: Light data that can be statically imported (good for SSG/SEO)
 * - Route data: Heavy GPS data that should be lazy-loaded
 */

// ============================================================================
// Core Types
// ============================================================================

/** GPS coordinate point with elevation and cumulative distance */
export interface RoutePoint {
  lat: number;
  lng: number;
  ele: number;
  /** Cumulative distance in km from start */
  dist: number;
}

/** FAQ item for race pages */
export interface FAQItem {
  question: string;
  answer: string;
}

/** Pacing advice for a segment of the race */
export interface PaceSegment {
  /** Mile range, e.g., "1-5" or "10-12" */
  miles: string;
  /** Terrain description */
  terrain: string;
  /** Pacing advice for this segment */
  advice: string;
}

/** Overall pacing strategy for a race */
export interface PaceStrategy {
  /** Strategy type: "even-pace", "negative-split", "even-effort", etc. */
  type: string;
  /** High-level strategy summary */
  summary: string;
  /** Segment-by-segment advice */
  segments: PaceSegment[];
}

// ============================================================================
// Race Region/Category
// ============================================================================

/** Geographic region for race categorization */
export type RaceRegion =
  | "north-america"
  | "europe"
  | "asia-pacific"
  | "south-america"
  | "africa"
  | "middle-east";

/** Race category/tier */
export type RaceTier =
  | "world-major" // 7 World Marathon Majors
  | "platinum" // Other elite-level races (Valencia, Rotterdam)
  | "gold" // Major national races (CIM, Marine Corps)
  | "silver" // Regional destination races (Big Sur)
  | "bronze"; // Local/smaller races

/** Race distance type */
export type RaceType =
  | "marathon" // 42.195 km / 26.2 miles
  | "half-marathon" // 21.0975 km / 13.1 miles
  | "10k" // 10 km / 6.2 miles
  | "5k" // 5 km / 3.1 miles
  | "ultra" // Anything longer than marathon
  | "other"; // Non-standard distances

/** Standard race distances in kilometers */
export const RACE_DISTANCES: Record<RaceType, number> = {
  "5k": 5,
  "10k": 10,
  "half-marathon": 21.0975,
  marathon: 42.195,
  ultra: 50, // Minimum ultra distance (varies)
  other: 0, // Custom distance
};

/** Helper to infer race type from distance */
export function inferRaceType(distanceKm: number): RaceType {
  if (distanceKm <= 5.5) return "5k";
  if (distanceKm <= 11) return "10k";
  if (distanceKm <= 22) return "half-marathon";
  if (distanceKm <= 43) return "marathon";
  if (distanceKm > 43) return "ultra";
  return "other";
}

// ============================================================================
// Race Metadata (Light - for static imports)
// ============================================================================

/**
 * Race metadata - the lightweight, statically-importable portion of race data.
 * This data is used for:
 * - SEO pages (title, description, FAQs)
 * - Race index/search pages
 * - Navigation dropdowns
 *
 * Does NOT include heavy route data (thumbnailPoints).
 */
export interface RaceMetadata {
  /** Unique identifier (e.g., "boston", "oslo-marathon") */
  id: string;

  /** Display name (e.g., "Boston Marathon") */
  name: string;

  /** City where the race is held */
  city: string;

  /** Country or state (e.g., "Massachusetts, USA" or "Norway") */
  country: string;

  /** Region for filtering/grouping */
  region: RaceRegion;

  /** Race tier for categorization */
  tier: RaceTier;

  /** Race type (marathon, half-marathon, 10k, 5k, etc.) */
  raceType: RaceType;

  /** Race distance in kilometers (42.195 for marathon) */
  distance: number;

  /** Total elevation gain in meters */
  elevationGain: number;

  /** Total elevation loss in meters */
  elevationLoss: number;

  /** Starting elevation in meters */
  startElevation: number;

  /** Finishing elevation in meters */
  endElevation: number;

  /** URL-friendly slug for routes (may differ from id) */
  slug: string;

  /** Next race date (e.g., "April 20, 2026") */
  raceDate: string;

  /** Official race website */
  website: string;

  /** Course description (2-3 sentences) */
  description: string;

  /** Training and race day tips */
  tips: string[];

  /** Pacing strategy */
  paceStrategy: PaceStrategy;

  /** Fueling recommendations */
  fuelingNotes: string;

  /** FAQ items for SEO/rich snippets */
  faq: FAQItem[];

  /** Keywords for search/filtering */
  keywords?: string[];

  /** ISO date of last update */
  lastUpdated?: string;
}

// ============================================================================
// Race Route Data (Heavy - lazy loaded)
// ============================================================================

/**
 * Race route data - the heavy portion containing GPS coordinates.
 * This should be lazy-loaded only when viewing the specific race page.
 */
export interface RaceRouteData {
  /** Race ID this route belongs to */
  raceId: string;

  /** Simplified route for map preview (15-30 points) */
  thumbnailPoints: RoutePoint[];

  /** Full route if available (can be hundreds/thousands of points) */
  fullRoute?: RoutePoint[];

  /** Elevation profile data points */
  elevationProfile?: Array<{
    distance: number;
    elevation: number;
  }>;

  /** Firestore document ID if data is stored in Firestore */
  firestoreDocId?: string;
}

// ============================================================================
// Combined Race Data (for backwards compatibility)
// ============================================================================

/**
 * Full race data combining metadata and route.
 * This matches the legacy marathon-data.json structure for backwards compatibility.
 */
export interface RaceData extends RaceMetadata {
  thumbnailPoints: RoutePoint[];
}

// ============================================================================
// Registry Types
// ============================================================================

/** Registry entry with metadata and optional route loader */
export interface RaceRegistryEntry {
  metadata: RaceMetadata;
  /** Async function to load route data */
  loadRoute: () => Promise<RaceRouteData>;
  /** Whether route data has been loaded */
  routeLoaded?: boolean;
  /** Cached route data after loading */
  cachedRoute?: RaceRouteData;
}

/** Function type for race data loaders */
export type RaceLoader = () => Promise<RaceData>;

/** Function type for route-only loaders */
export type RouteLoader = () => Promise<RaceRouteData>;

// ============================================================================
// Utility Types
// ============================================================================

/** Partial race data for search results / list views */
export type RaceSummary = Pick<
  RaceMetadata,
  | "id"
  | "name"
  | "city"
  | "country"
  | "region"
  | "tier"
  | "raceType"
  | "distance"
  | "elevationGain"
  | "raceDate"
  | "slug"
>;

/** Filter options for race queries */
export interface RaceFilters {
  region?: RaceRegion | RaceRegion[];
  tier?: RaceTier | RaceTier[];
  raceType?: RaceType | RaceType[];
  maxElevationGain?: number;
  minElevationGain?: number;
  minDistance?: number;
  maxDistance?: number;
  search?: string;
}

/** Sort options for race queries */
export type RaceSortField =
  | "name"
  | "raceDate"
  | "elevationGain"
  | "city"
  | "tier";

export interface RaceSortOptions {
  field: RaceSortField;
  direction: "asc" | "desc";
}
