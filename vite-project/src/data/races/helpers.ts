/**
 * Race Data Helpers
 *
 * Utility functions for working with race data, including:
 * - Region/tier inference from existing data
 * - Validation helpers
 * - Data transformation utilities
 */

import type { RaceRegion, RaceTier, RaceMetadata, RoutePoint } from "./types";

// ============================================================================
// Region Inference
// ============================================================================

/** Map of countries/locations to regions */
const REGION_MAP: Record<string, RaceRegion> = {
  // North America
  "usa": "north-america",
  "united states": "north-america",
  "massachusetts": "north-america",
  "new york": "north-america",
  "illinois": "north-america",
  "california": "north-america",
  "dc": "north-america",
  "canada": "north-america",
  "mexico": "north-america",

  // Europe
  "uk": "europe",
  "england": "europe",
  "germany": "europe",
  "france": "europe",
  "spain": "europe",
  "netherlands": "europe",
  "norway": "europe",
  "sweden": "europe",
  "denmark": "europe",
  "italy": "europe",
  "portugal": "europe",
  "switzerland": "europe",
  "austria": "europe",
  "belgium": "europe",
  "ireland": "europe",
  "greece": "europe",
  "poland": "europe",

  // Asia-Pacific
  "japan": "asia-pacific",
  "china": "asia-pacific",
  "australia": "asia-pacific",
  "new zealand": "asia-pacific",
  "singapore": "asia-pacific",
  "hong kong": "asia-pacific",
  "south korea": "asia-pacific",
  "taiwan": "asia-pacific",
  "india": "asia-pacific",
  "thailand": "asia-pacific",

  // South America
  "brazil": "south-america",
  "argentina": "south-america",
  "chile": "south-america",
  "colombia": "south-america",
  "peru": "south-america",

  // Africa
  "south africa": "africa",
  "kenya": "africa",
  "ethiopia": "africa",
  "morocco": "africa",
  "egypt": "africa",

  // Middle East
  "israel": "middle-east",
  "uae": "middle-east",
  "dubai": "middle-east",
  "qatar": "middle-east",
};

/**
 * Infer region from country string.
 */
export function inferRegion(country: string): RaceRegion {
  const lower = country.toLowerCase();

  for (const [key, region] of Object.entries(REGION_MAP)) {
    if (lower.includes(key)) {
      return region;
    }
  }

  // Default to Europe if unknown
  return "europe";
}

// ============================================================================
// Tier Inference
// ============================================================================

/** World Marathon Majors */
const WORLD_MAJORS = [
  "boston",
  "new york",
  "nyc",
  "chicago",
  "london",
  "berlin",
  "tokyo",
  "sydney",
];

/** Platinum tier races (elite but not majors) */
const PLATINUM_RACES = [
  "valencia",
  "rotterdam",
  "amsterdam",
  "paris",
  "frankfurt",
  "barcelona",
  "prague",
  "seville",
];

/** Gold tier races (major national races) */
const GOLD_RACES = [
  "marine corps",
  "california international",
  "cim",
  "houston",
  "grandmas",
  "twin cities",
  "philadelphia",
  "los angeles",
  "oslo",
  "copenhagen",
  "stockholm",
  "dublin",
  "edinburgh",
];

/**
 * Infer tier from race name and characteristics.
 */
export function inferTier(name: string, elevationGain: number): RaceTier {
  const lower = name.toLowerCase();

  // Check World Majors
  if (WORLD_MAJORS.some((m) => lower.includes(m))) {
    return "world-major";
  }

  // Check Platinum
  if (PLATINUM_RACES.some((r) => lower.includes(r))) {
    return "platinum";
  }

  // Check Gold
  if (GOLD_RACES.some((r) => lower.includes(r))) {
    return "gold";
  }

  // Scenic/challenge races are typically silver
  if (elevationGain > 400) {
    return "silver";
  }

  // Default to gold for established races
  return "gold";
}

// ============================================================================
// Validation Helpers
// ============================================================================

/**
 * Validate race metadata has all required fields.
 */
export function validateMetadata(metadata: Partial<RaceMetadata>): string[] {
  const errors: string[] = [];

  const required: (keyof RaceMetadata)[] = [
    "id",
    "name",
    "city",
    "country",
    "region",
    "tier",
    "distance",
    "elevationGain",
    "elevationLoss",
    "startElevation",
    "endElevation",
    "slug",
    "raceDate",
    "website",
    "description",
    "tips",
    "paceStrategy",
    "fuelingNotes",
    "faq",
  ];

  for (const field of required) {
    if (metadata[field] === undefined || metadata[field] === null) {
      errors.push(`Missing required field: ${field}`);
    }
  }

  // Validate tips array
  if (metadata.tips && metadata.tips.length === 0) {
    errors.push("tips array should not be empty");
  }

  // Validate FAQ array
  if (metadata.faq && metadata.faq.length === 0) {
    errors.push("faq array should not be empty");
  }

  // Validate pace strategy
  if (metadata.paceStrategy) {
    if (!metadata.paceStrategy.type) {
      errors.push("paceStrategy.type is required");
    }
    if (!metadata.paceStrategy.summary) {
      errors.push("paceStrategy.summary is required");
    }
    if (!metadata.paceStrategy.segments || metadata.paceStrategy.segments.length === 0) {
      errors.push("paceStrategy.segments should not be empty");
    }
  }

  return errors;
}

/**
 * Validate route points array.
 */
export function validateRoutePoints(points: RoutePoint[]): string[] {
  const errors: string[] = [];

  if (points.length < 5) {
    errors.push("Route should have at least 5 points for a good preview");
  }

  if (points.length > 100) {
    errors.push(
      "Route has too many points for thumbnail preview. Consider simplifying."
    );
  }

  // Check for valid coordinates
  for (let i = 0; i < points.length; i++) {
    const p = points[i];
    if (p.lat < -90 || p.lat > 90) {
      errors.push(`Point ${i}: Invalid latitude ${p.lat}`);
    }
    if (p.lng < -180 || p.lng > 180) {
      errors.push(`Point ${i}: Invalid longitude ${p.lng}`);
    }
    if (p.dist < 0) {
      errors.push(`Point ${i}: Negative distance ${p.dist}`);
    }
  }

  // Check distances are ascending
  for (let i = 1; i < points.length; i++) {
    if (points[i].dist < points[i - 1].dist) {
      errors.push(
        `Point ${i}: Distance ${points[i].dist} is less than previous ${points[i - 1].dist}`
      );
    }
  }

  return errors;
}

// ============================================================================
// Transformation Utilities
// ============================================================================

/**
 * Convert a race ID to a TypeScript-safe variable name.
 */
export function toVariableName(id: string): string {
  return id
    .replace(/-/g, "_")
    .replace(/[^a-zA-Z0-9_]/g, "")
    .replace(/^(\d)/, "_$1"); // Prefix with underscore if starts with number
}

/**
 * Convert a race name to a slug.
 */
export function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Simplify a route to N points for thumbnail preview.
 */
export function simplifyRoute(points: RoutePoint[], targetCount: number): RoutePoint[] {
  if (points.length <= targetCount) {
    return points;
  }

  const result: RoutePoint[] = [points[0]]; // Always include start
  const step = (points.length - 1) / (targetCount - 1);

  for (let i = 1; i < targetCount - 1; i++) {
    const index = Math.round(i * step);
    result.push(points[index]);
  }

  result.push(points[points.length - 1]); // Always include end
  return result;
}

/**
 * Calculate total elevation gain from route points.
 */
export function calculateElevationGain(points: RoutePoint[]): number {
  let gain = 0;
  for (let i = 1; i < points.length; i++) {
    const diff = points[i].ele - points[i - 1].ele;
    if (diff > 0) {
      gain += diff;
    }
  }
  return Math.round(gain);
}

/**
 * Calculate total elevation loss from route points.
 */
export function calculateElevationLoss(points: RoutePoint[]): number {
  let loss = 0;
  for (let i = 1; i < points.length; i++) {
    const diff = points[i - 1].ele - points[i].ele;
    if (diff > 0) {
      loss += diff;
    }
  }
  return Math.round(loss);
}

// ============================================================================
// Template Generation
// ============================================================================

/**
 * Generate a TypeScript race file content from metadata.
 */
export function generateRaceFileContent(
  metadata: RaceMetadata,
  routeFileName: string
): string {
  const varName = toVariableName(metadata.id);

  return `/**
 * ${metadata.name}
 *
 * ${metadata.description.split(".")[0]}.
 */

import type { RaceMetadata, RaceRouteData } from "../types";
import { registerRace } from "../registry";

// ============================================================================
// Metadata (Static - always available)
// ============================================================================

export const ${varName}Metadata: RaceMetadata = ${JSON.stringify(metadata, null, 2)};

// ============================================================================
// Route Loader (Lazy - loaded on demand)
// ============================================================================

/**
 * Loads ${metadata.name} route data.
 * This is called lazily when the route data is actually needed.
 */
export async function load${varName.charAt(0).toUpperCase() + varName.slice(1)}Route(): Promise<RaceRouteData> {
  // Dynamic import for code splitting
  const routeData = await import("../routes/${routeFileName}");

  return {
    raceId: "${metadata.id}",
    thumbnailPoints: routeData.thumbnailPoints,
    ${metadata.slug ? `firestoreDocId: "${metadata.slug}",` : ""}
  };
}

// ============================================================================
// Register with global registry
// ============================================================================

registerRace(${varName}Metadata, load${varName.charAt(0).toUpperCase() + varName.slice(1)}Route);

// ============================================================================
// Named exports for direct imports
// ============================================================================

export default ${varName}Metadata;
`;
}
