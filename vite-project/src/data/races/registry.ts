/**
 * Race Registry
 *
 * Central registry for all race data. Provides:
 * - Static access to race metadata (no async needed)
 * - Lazy loading for route data (async when needed)
 * - Filtering and search capabilities
 * - Backwards-compatible API
 */

import type {
  RaceMetadata,
  RaceRouteData,
  RaceData,
  RaceSummary,
  RaceFilters,
  RaceSortOptions,
  RaceRegistryEntry,
} from "./types";

// ============================================================================
// Registry State
// ============================================================================

/** Internal registry map */
const registry = new Map<string, RaceRegistryEntry>();

/** Route data cache */
const routeCache = new Map<string, RaceRouteData>();

// ============================================================================
// Registration API
// ============================================================================

/**
 * Register a race with the registry.
 * Called by individual race modules during import.
 */
export function registerRace(
  metadata: RaceMetadata,
  routeLoader: () => Promise<RaceRouteData>
): void {
  registry.set(metadata.id, {
    metadata,
    loadRoute: routeLoader,
    routeLoaded: false,
  });
}

/**
 * Register multiple races at once.
 * Useful for batch registration during migration.
 */
export function registerRaces(
  races: Array<{ metadata: RaceMetadata; routeLoader: () => Promise<RaceRouteData> }>
): void {
  for (const race of races) {
    registerRace(race.metadata, race.routeLoader);
  }
}

// ============================================================================
// Query API - Synchronous (Metadata Only)
// ============================================================================

/**
 * Get all registered race IDs.
 */
export function getAllRaceIds(): string[] {
  return Array.from(registry.keys());
}

/**
 * Get race metadata by ID.
 * Returns undefined if race not found.
 */
export function getRaceMetadata(id: string): RaceMetadata | undefined {
  return registry.get(id)?.metadata;
}

/**
 * Get all race metadata as an array.
 */
export function getAllRaceMetadata(): RaceMetadata[] {
  return Array.from(registry.values()).map((entry) => entry.metadata);
}

/**
 * Get race metadata as a record (backwards compatible with marathon-data.json).
 */
export function getRaceMetadataRecord(): Record<string, RaceMetadata> {
  const result: Record<string, RaceMetadata> = {};
  for (const [id, entry] of registry.entries()) {
    result[id] = entry.metadata;
  }
  return result;
}

/**
 * Get race summaries (lightweight data for lists).
 */
export function getRaceSummaries(): RaceSummary[] {
  return Array.from(registry.values()).map((entry) => ({
    id: entry.metadata.id,
    name: entry.metadata.name,
    city: entry.metadata.city,
    country: entry.metadata.country,
    region: entry.metadata.region,
    tier: entry.metadata.tier,
    distance: entry.metadata.distance,
    elevationGain: entry.metadata.elevationGain,
    raceDate: entry.metadata.raceDate,
    slug: entry.metadata.slug,
  }));
}

/**
 * Check if a race exists in the registry.
 */
export function hasRace(id: string): boolean {
  return registry.has(id);
}

/**
 * Get the total number of registered races.
 */
export function getRaceCount(): number {
  return registry.size;
}

// ============================================================================
// Query API - Asynchronous (With Route Data)
// ============================================================================

/**
 * Load route data for a race.
 * Returns cached data if already loaded.
 */
export async function loadRaceRoute(id: string): Promise<RaceRouteData | undefined> {
  // Check cache first
  if (routeCache.has(id)) {
    return routeCache.get(id);
  }

  const entry = registry.get(id);
  if (!entry) {
    return undefined;
  }

  // Load route data
  const routeData = await entry.loadRoute();
  routeCache.set(id, routeData);
  entry.routeLoaded = true;
  entry.cachedRoute = routeData;

  return routeData;
}

/**
 * Get full race data (metadata + route).
 * Route data is loaded asynchronously.
 */
export async function getRaceData(id: string): Promise<RaceData | undefined> {
  const metadata = getRaceMetadata(id);
  if (!metadata) {
    return undefined;
  }

  const routeData = await loadRaceRoute(id);
  if (!routeData) {
    return undefined;
  }

  return {
    ...metadata,
    thumbnailPoints: routeData.thumbnailPoints,
  };
}

/**
 * Get all race data (backwards compatible).
 * Warning: This loads ALL route data - use sparingly!
 */
export async function getAllRaceData(): Promise<Record<string, RaceData>> {
  const result: Record<string, RaceData> = {};
  const ids = getAllRaceIds();

  await Promise.all(
    ids.map(async (id) => {
      const data = await getRaceData(id);
      if (data) {
        result[id] = data;
      }
    })
  );

  return result;
}

// ============================================================================
// Filtering & Search API
// ============================================================================

/**
 * Filter races by criteria.
 */
export function filterRaces(filters: RaceFilters): RaceMetadata[] {
  let results = getAllRaceMetadata();

  // Filter by region
  if (filters.region) {
    const regions = Array.isArray(filters.region)
      ? filters.region
      : [filters.region];
    results = results.filter((r) => regions.includes(r.region));
  }

  // Filter by tier
  if (filters.tier) {
    const tiers = Array.isArray(filters.tier) ? filters.tier : [filters.tier];
    results = results.filter((r) => tiers.includes(r.tier));
  }

  // Filter by elevation
  if (filters.maxElevationGain !== undefined) {
    results = results.filter((r) => r.elevationGain <= filters.maxElevationGain!);
  }
  if (filters.minElevationGain !== undefined) {
    results = results.filter((r) => r.elevationGain >= filters.minElevationGain!);
  }

  // Filter by search term
  if (filters.search) {
    const searchLower = filters.search.toLowerCase();
    results = results.filter(
      (r) =>
        r.name.toLowerCase().includes(searchLower) ||
        r.city.toLowerCase().includes(searchLower) ||
        r.country.toLowerCase().includes(searchLower) ||
        r.keywords?.some((k) => k.toLowerCase().includes(searchLower))
    );
  }

  return results;
}

/**
 * Sort races by field.
 */
export function sortRaces(
  races: RaceMetadata[],
  options: RaceSortOptions
): RaceMetadata[] {
  const { field, direction } = options;
  const multiplier = direction === "asc" ? 1 : -1;

  return [...races].sort((a, b) => {
    let aVal: string | number;
    let bVal: string | number;

    switch (field) {
      case "name":
        aVal = a.name;
        bVal = b.name;
        break;
      case "city":
        aVal = a.city;
        bVal = b.city;
        break;
      case "raceDate":
        aVal = a.raceDate;
        bVal = b.raceDate;
        break;
      case "elevationGain":
        aVal = a.elevationGain;
        bVal = b.elevationGain;
        break;
      case "tier":
        // Custom tier ordering
        const tierOrder = {
          "world-major": 0,
          platinum: 1,
          gold: 2,
          silver: 3,
          bronze: 4,
        };
        aVal = tierOrder[a.tier];
        bVal = tierOrder[b.tier];
        break;
      default:
        return 0;
    }

    if (aVal < bVal) return -1 * multiplier;
    if (aVal > bVal) return 1 * multiplier;
    return 0;
  });
}

// ============================================================================
// Utility API
// ============================================================================

/**
 * Clear the route cache.
 * Useful for testing or memory management.
 */
export function clearRouteCache(): void {
  routeCache.clear();
  for (const entry of registry.values()) {
    entry.routeLoaded = false;
    entry.cachedRoute = undefined;
  }
}

/**
 * Get races by region.
 */
export function getRacesByRegion(region: string): RaceMetadata[] {
  return filterRaces({ region: region as any });
}

/**
 * Get World Marathon Majors.
 */
export function getWorldMajors(): RaceMetadata[] {
  return filterRaces({ tier: "world-major" });
}

/**
 * Get flat races (good for PRs).
 * Defined as races with less than 100m elevation gain.
 */
export function getFlatRaces(): RaceMetadata[] {
  return filterRaces({ maxElevationGain: 100 });
}

/**
 * Get hilly races (challenging courses).
 * Defined as races with more than 300m elevation gain.
 */
export function getHillyRaces(): RaceMetadata[] {
  return filterRaces({ minElevationGain: 300 });
}

/**
 * Find race by slug (for URL routing).
 */
export function findRaceBySlug(slug: string): RaceMetadata | undefined {
  return getAllRaceMetadata().find((r) => r.slug === slug);
}

/**
 * Search races by name/location.
 */
export function searchRaces(query: string): RaceMetadata[] {
  return filterRaces({ search: query });
}
