/**
 * Marathon Data Loader
 *
 * Handles loading, caching, and accessing marathon course data.
 * Supports:
 * - Lazy loading of full course data
 * - In-memory caching with configurable TTL
 * - Legacy format compatibility
 * - Firebase data overlay
 * - Region-based data chunking
 */

import type {
  MarathonCourseData,
  MarathonSummary,
  MarathonRegistryEntry,
  MarathonRegion,
  LegacyMarathonData,
  CoursePoint,
} from './types';
import { fromLegacyFormat, toMarathonSummary, getRegionFromCountry } from './types';

// Import legacy data (will be migrated to new format)
import legacyMarathonData from '../../data/marathon-data.json';

// =============================================================================
// Cache Configuration
// =============================================================================

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

// =============================================================================
// Data Registry (Lightweight Index)
// =============================================================================

/**
 * Build registry from legacy data
 */
function buildRegistry(): Map<string, MarathonRegistryEntry> {
  const registry = new Map<string, MarathonRegistryEntry>();

  for (const [key, data] of Object.entries(legacyMarathonData)) {
    const legacy = data as LegacyMarathonData;
    registry.set(key, {
      id: legacy.id,
      routeKey: key,
      name: legacy.name,
      city: legacy.city,
      country: legacy.country,
      region: getRegionFromCountry(legacy.country),
      distanceType: legacy.distance > 42 ? 'marathon' : legacy.distance > 21 ? 'half' : '10k',
      hasFullData: true,
      dataPath: undefined, // Loaded from static import
    });
  }

  return registry;
}

// Initialize registry on module load
const marathonRegistry = buildRegistry();

// =============================================================================
// Data Cache
// =============================================================================

const dataCache = new Map<string, CacheEntry<MarathonCourseData>>();
const summaryCache = new Map<string, CacheEntry<MarathonSummary>>();

/**
 * Check if cache entry is still valid
 */
function isCacheValid<T>(entry: CacheEntry<T> | undefined): entry is CacheEntry<T> {
  if (!entry) return false;
  return Date.now() - entry.timestamp < CACHE_TTL_MS;
}

/**
 * Clear all cached data
 */
export function clearMarathonCache(): void {
  dataCache.clear();
  summaryCache.clear();
}

/**
 * Clear cache for a specific route
 */
export function clearRouteCache(routeKey: string): void {
  dataCache.delete(routeKey);
  summaryCache.delete(routeKey);
}

// =============================================================================
// Registry Access
// =============================================================================

/**
 * Get all registered route keys
 */
export function getAllRouteKeys(): string[] {
  return Array.from(marathonRegistry.keys());
}

/**
 * Get registry entries for a specific region
 */
export function getRoutesByRegion(region: MarathonRegion): MarathonRegistryEntry[] {
  return Array.from(marathonRegistry.values()).filter((entry) => entry.region === region);
}

/**
 * Get registry entries by distance type
 */
export function getRoutesByDistance(distanceType: MarathonCourseData['distanceType']): MarathonRegistryEntry[] {
  return Array.from(marathonRegistry.values()).filter(
    (entry) => entry.distanceType === distanceType
  );
}

/**
 * Check if a route key exists in the registry
 */
export function hasRoute(routeKey: string): boolean {
  return marathonRegistry.has(routeKey);
}

/**
 * Get registry entry by route key
 */
export function getRegistryEntry(routeKey: string): MarathonRegistryEntry | undefined {
  return marathonRegistry.get(routeKey);
}

/**
 * Get all registry entries
 */
export function getAllRegistryEntries(): MarathonRegistryEntry[] {
  return Array.from(marathonRegistry.values());
}

// =============================================================================
// Data Loading
// =============================================================================

/**
 * Load full marathon data by route key
 * Returns cached data if available and valid
 */
export function getMarathonData(routeKey: string): MarathonCourseData | null {
  // Check cache first
  const cached = dataCache.get(routeKey);
  if (isCacheValid(cached)) {
    return cached.data;
  }

  // Load from legacy data
  const legacyData = (legacyMarathonData as Record<string, LegacyMarathonData>)[routeKey];
  if (!legacyData) {
    return null;
  }

  // Convert to new format
  const data = fromLegacyFormat(routeKey, legacyData);

  // Cache the result
  dataCache.set(routeKey, { data, timestamp: Date.now() });

  return data;
}

/**
 * Load marathon summary (lightweight version)
 */
export function getMarathonSummary(routeKey: string): MarathonSummary | null {
  // Check summary cache first
  const cached = summaryCache.get(routeKey);
  if (isCacheValid(cached)) {
    return cached.data;
  }

  // Get full data and convert to summary
  const fullData = getMarathonData(routeKey);
  if (!fullData) {
    return null;
  }

  const summary = toMarathonSummary(fullData);

  // Cache the summary
  summaryCache.set(routeKey, { data: summary, timestamp: Date.now() });

  return summary;
}

/**
 * Load multiple marathons at once
 */
export function getMarathonDataBatch(routeKeys: string[]): Map<string, MarathonCourseData> {
  const result = new Map<string, MarathonCourseData>();

  for (const key of routeKeys) {
    const data = getMarathonData(key);
    if (data) {
      result.set(key, data);
    }
  }

  return result;
}

/**
 * Load all marathon summaries (for index pages)
 */
export function getAllMarathonSummaries(): MarathonSummary[] {
  const summaries: MarathonSummary[] = [];

  for (const key of marathonRegistry.keys()) {
    const summary = getMarathonSummary(key);
    if (summary) {
      summaries.push(summary);
    }
  }

  return summaries;
}

// =============================================================================
// Legacy Format Access (for backward compatibility)
// =============================================================================

/**
 * Get raw legacy data format
 * Use this only for components that haven't been migrated yet
 */
export function getLegacyMarathonData(routeKey: string): LegacyMarathonData | null {
  return (legacyMarathonData as Record<string, LegacyMarathonData>)[routeKey] || null;
}

/**
 * Get all legacy marathon data
 */
export function getAllLegacyMarathonData(): Record<string, LegacyMarathonData> {
  return legacyMarathonData as Record<string, LegacyMarathonData>;
}

// =============================================================================
// Route Points Access
// =============================================================================

/**
 * Get thumbnail points for a route (for map previews)
 */
export function getThumbnailPoints(routeKey: string): CoursePoint[] {
  const data = getMarathonData(routeKey);
  return data?.route?.thumbnailPoints || [];
}

/**
 * Get display points for interactive maps
 * Falls back to thumbnail points if display points aren't available
 */
export function getDisplayPoints(routeKey: string): CoursePoint[] {
  const data = getMarathonData(routeKey);
  return data?.route?.displayPoints || data?.route?.thumbnailPoints || [];
}

// =============================================================================
// Firebase Integration Helpers
// =============================================================================

/**
 * Merge Firebase data with local data
 * Firebase data takes precedence for route points and can extend other fields
 */
export function mergeWithFirebaseData(
  routeKey: string,
  firebaseData: Partial<{
    thumbnailPoints: CoursePoint[];
    displayPoints: CoursePoint[];
    elevationGain: number;
    elevationLoss: number;
    startElevation: number;
    endElevation: number;
    distance: number;
  }>
): MarathonCourseData | null {
  const localData = getMarathonData(routeKey);
  if (!localData) {
    return null;
  }

  // Create merged data (don't mutate original)
  const merged: MarathonCourseData = {
    ...localData,
    source: 'firebase',
  };

  // Override route points if provided
  if (firebaseData.thumbnailPoints || firebaseData.displayPoints) {
    merged.route = {
      thumbnailPoints: firebaseData.thumbnailPoints || localData.route?.thumbnailPoints || [],
      displayPoints: firebaseData.displayPoints || localData.route?.displayPoints,
    };
  }

  // Override elevation stats if provided
  if (
    firebaseData.elevationGain !== undefined ||
    firebaseData.elevationLoss !== undefined ||
    firebaseData.startElevation !== undefined ||
    firebaseData.endElevation !== undefined
  ) {
    merged.elevation = {
      gain: firebaseData.elevationGain ?? localData.elevation.gain,
      loss: firebaseData.elevationLoss ?? localData.elevation.loss,
      startElevation: firebaseData.startElevation ?? localData.elevation.startElevation,
      endElevation: firebaseData.endElevation ?? localData.elevation.endElevation,
      netChange:
        (firebaseData.startElevation ?? localData.elevation.startElevation) -
        (firebaseData.endElevation ?? localData.elevation.endElevation),
    };
  }

  // Override distance if provided
  if (firebaseData.distance !== undefined) {
    merged.distance = firebaseData.distance;
  }

  return merged;
}

// =============================================================================
// Search and Filter
// =============================================================================

export interface MarathonSearchOptions {
  query?: string;
  region?: MarathonRegion;
  distanceType?: MarathonCourseData['distanceType'];
  maxElevationGain?: number;
  difficulty?: MarathonCourseData['difficulty'];
  limit?: number;
}

/**
 * Search and filter marathons
 */
export function searchMarathons(options: MarathonSearchOptions): MarathonSummary[] {
  let results = getAllMarathonSummaries();

  // Filter by query (name, city, country)
  if (options.query) {
    const queryLower = options.query.toLowerCase();
    results = results.filter(
      (m) =>
        m.name.toLowerCase().includes(queryLower) ||
        m.city.toLowerCase().includes(queryLower) ||
        m.country.toLowerCase().includes(queryLower)
    );
  }

  // Filter by region
  if (options.region) {
    results = results.filter(
      (m) => getRegionFromCountry(m.country) === options.region
    );
  }

  // Filter by distance type
  if (options.distanceType) {
    results = results.filter((m) => m.distanceType === options.distanceType);
  }

  // Filter by max elevation gain
  if (options.maxElevationGain !== undefined) {
    results = results.filter((m) => m.elevationGain <= options.maxElevationGain!);
  }

  // Filter by difficulty
  if (options.difficulty) {
    results = results.filter((m) => m.difficulty === options.difficulty);
  }

  // Apply limit
  if (options.limit) {
    results = results.slice(0, options.limit);
  }

  return results;
}

// =============================================================================
// Statistics
// =============================================================================

export interface MarathonDataStats {
  totalRaces: number;
  byRegion: Record<MarathonRegion, number>;
  byDistanceType: Record<string, number>;
  byDifficulty: Record<string, number>;
  withFullRouteData: number;
}

/**
 * Get statistics about loaded marathon data
 */
export function getMarathonDataStats(): MarathonDataStats {
  const entries = getAllRegistryEntries();

  const byRegion: Record<string, number> = {};
  const byDistanceType: Record<string, number> = {};
  const byDifficulty: Record<string, number> = {};
  let withFullRouteData = 0;

  for (const entry of entries) {
    // Count by region
    byRegion[entry.region] = (byRegion[entry.region] || 0) + 1;

    // Count by distance type
    byDistanceType[entry.distanceType] = (byDistanceType[entry.distanceType] || 0) + 1;

    // Count with full data
    if (entry.hasFullData) {
      withFullRouteData++;
    }

    // Get difficulty from full data
    const summary = getMarathonSummary(entry.routeKey);
    if (summary) {
      byDifficulty[summary.difficulty] = (byDifficulty[summary.difficulty] || 0) + 1;
    }
  }

  return {
    totalRaces: entries.length,
    byRegion: byRegion as Record<MarathonRegion, number>,
    byDistanceType,
    byDifficulty,
    withFullRouteData,
  };
}
