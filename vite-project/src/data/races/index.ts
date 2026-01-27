/**
 * Race Data Module
 *
 * Scalable architecture for marathon/race data that supports:
 * - 100,000+ races without performance issues
 * - Lazy loading of heavy route data
 * - Static metadata access for SEO
 * - Filtering, searching, and categorization
 *
 * ## Quick Start
 *
 * ```typescript
 * import {
 *   getRaceMetadata,
 *   loadRaceRoute,
 *   filterRaces,
 *   getWorldMajors,
 * } from '@/data/races';
 *
 * // Get metadata (sync - no async needed)
 * const boston = getRaceMetadata('boston');
 *
 * // Load route data (async - only when needed)
 * const route = await loadRaceRoute('boston');
 *
 * // Filter races
 * const flatRaces = filterRaces({ maxElevationGain: 100 });
 *
 * // Get World Majors
 * const majors = getWorldMajors();
 * ```
 *
 * ## Adding a New Race
 *
 * 1. Create a new file in `courses/[race-id].ts`
 * 2. Create route data in `routes/[race-id]-route.json`
 * 3. Import the course file in this index (it auto-registers)
 *
 * See `courses/boston.ts` for a complete example.
 */

// ============================================================================
// Type Exports
// ============================================================================

export type {
  // Core types
  RoutePoint,
  FAQItem,
  PaceSegment,
  PaceStrategy,
  // Region/tier/type
  RaceRegion,
  RaceTier,
  RaceType,
  // Data types
  RaceMetadata,
  RaceRouteData,
  RaceData,
  // Registry types
  RaceRegistryEntry,
  RaceLoader,
  RouteLoader,
  // Utility types
  RaceSummary,
  RaceFilters,
  RaceSortField,
  RaceSortOptions,
} from "./types";

// Export race type constants and helpers
export { RACE_DISTANCES, inferRaceType } from "./types";

// ============================================================================
// Registry Exports (Core API)
// ============================================================================

export {
  // Registration (for race modules)
  registerRace,
  registerRaces,
  // Sync queries (metadata only)
  getAllRaceIds,
  getRaceMetadata,
  getAllRaceMetadata,
  getRaceMetadataRecord,
  getRaceSummaries,
  hasRace,
  getRaceCount,
  // Async queries (with route data)
  loadRaceRoute,
  getRaceData,
  getAllRaceData,
  // Filtering & search
  filterRaces,
  sortRaces,
  // Utility queries
  clearRouteCache,
  getRacesByRegion,
  getWorldMajors,
  getFlatRaces,
  getHillyRaces,
  findRaceBySlug,
  searchRaces,
  // Race type queries
  getMarathons,
  getHalfMarathons,
  get10Ks,
  get5Ks,
  getUltras,
  getRacesByType,
} from "./registry";

// ============================================================================
// Helper Exports
// ============================================================================

export {
  // Inference helpers
  inferRegion,
  inferTier,
  // Validation
  validateMetadata,
  validateRoutePoints,
  // Transformation
  toVariableName,
  toSlug,
  simplifyRoute,
  calculateElevationGain,
  calculateElevationLoss,
  // Code generation
  generateRaceFileContent,
} from "./helpers";

// ============================================================================
// Initialize from Legacy Data (Compatibility Layer)
// ============================================================================

// Import the compatibility layer to auto-register all races from marathon-data.json
// This provides backwards compatibility while enabling the new architecture.
// As you migrate races to individual files, you can import them below instead.
import "./compat";

// ============================================================================
// Individual Race Modules (Optional - for fully migrated races)
// ============================================================================

// Uncomment these as you migrate races to the new format:
// import "./courses/boston";
// import "./courses/oslo";
// import "./courses/nyc";
// import "./courses/chicago";
// import "./courses/london";
// import "./courses/berlin";
// import "./courses/tokyo";
// import "./courses/sydney";
// import "./courses/paris";
// import "./courses/amsterdam";
// import "./courses/valencia";
// import "./courses/rotterdam";
// import "./courses/marine-corps";
// import "./courses/big-sur";
// import "./courses/california-international";

// ============================================================================
// Backwards Compatibility Layer
// ============================================================================

import { getAllRaceMetadata } from "./registry";
import type { RaceData } from "./types";

/**
 * @deprecated Use `getAllRaceMetadata()` or `getRaceData(id)` instead.
 *
 * Provides backwards compatibility with the old `marathon-data.json` import.
 * This loads all race data synchronously by requiring route data to be
 * pre-loaded, which is not recommended for large datasets.
 */
export function getLegacyMarathonData(): Record<string, RaceData> {
  console.warn(
    "getLegacyMarathonData() is deprecated. Use getAllRaceMetadata() or getRaceData(id) instead."
  );

  // Return metadata only (routes need to be loaded async)
  // This maintains type compatibility but won't have thumbnailPoints
  const metadata = getAllRaceMetadata();
  const result: Record<string, RaceData> = {};

  for (const m of metadata) {
    result[m.id] = {
      ...m,
      thumbnailPoints: [], // Empty until route is loaded
    };
  }

  return result;
}

// ============================================================================
// Migration Helper
// ============================================================================

/**
 * Helper for migrating from the old marathon-data.json format.
 * Call this with the old JSON data to register all races at once.
 */
export async function migrateFromLegacyData(
  legacyData: Record<string, any>
): Promise<void> {
  const { registerRace } = await import("./registry");
  const { inferRegion, inferTier } = await import("./helpers");

  for (const [id, data] of Object.entries(legacyData)) {
    const metadata = {
      id,
      name: data.name,
      city: data.city,
      country: data.country,
      region: inferRegion(data.country),
      tier: inferTier(data.name, data.elevationGain),
      distance: data.distance,
      elevationGain: data.elevationGain,
      elevationLoss: data.elevationLoss,
      startElevation: data.startElevation,
      endElevation: data.endElevation,
      slug: data.slug,
      raceDate: data.raceDate,
      website: data.website,
      description: data.description,
      tips: data.tips || [],
      paceStrategy: data.paceStrategy || {
        type: "even-pace",
        summary: "Run at consistent effort throughout.",
        segments: [],
      },
      fuelingNotes: data.fuelingNotes || "",
      faq: data.faq || [],
    };

    const routeData = {
      raceId: id,
      thumbnailPoints: data.thumbnailPoints || [],
    };

    registerRace(metadata as any, async () => routeData);
  }
}
