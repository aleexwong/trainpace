/**
 * Compatibility Layer
 *
 * This module provides backwards compatibility with the old marathon-data.json
 * import pattern. Use this during the migration period.
 *
 * ## Usage (in existing components):
 *
 * Before:
 * ```typescript
 * import marathonData from "@/data/marathon-data.json";
 * const route = marathonData["boston"];
 * ```
 *
 * After (option 1 - minimal change):
 * ```typescript
 * import { marathonData } from "@/data/races/compat";
 * const route = marathonData["boston"];
 * ```
 *
 * After (option 2 - recommended):
 * ```typescript
 * import { getRaceData } from "@/data/races";
 * const route = await getRaceData("boston");
 * ```
 *
 * ## Migration Path
 *
 * 1. Replace imports with compat layer (immediate, low effort)
 * 2. Gradually migrate to async getRaceData() calls
 * 3. Remove compat layer once all components are migrated
 */

import oldMarathonData from "../marathon-data.json";
import { registerRace } from "./registry";
import { inferRegion, inferTier } from "./helpers";
import type { RaceMetadata, RaceData, RaceRouteData } from "./types";
import { inferRaceType } from "./types";

// ============================================================================
// Auto-register all races from legacy data
// ============================================================================

// Track if we've already initialized
let initialized = false;

function initializeFromLegacy() {
  if (initialized) return;
  initialized = true;

  for (const [id, data] of Object.entries(oldMarathonData as Record<string, any>)) {
    // Skip if already registered (e.g., by individual course files)
    // We can't check this without importing registry, so we just register
    // and the registry will handle duplicates

    const metadata: RaceMetadata = {
      id,
      name: data.name,
      city: data.city,
      country: data.country,
      region: inferRegion(data.country),
      tier: inferTier(data.name, data.elevationGain),
      raceType: inferRaceType(data.distance),
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
        summary: "Run at consistent effort throughout the race.",
        segments: [],
      },
      fuelingNotes: data.fuelingNotes || "",
      faq: data.faq || [],
    };

    const routeData: RaceRouteData = {
      raceId: id,
      thumbnailPoints: data.thumbnailPoints || [],
      firestoreDocId: data.slug,
    };

    // Register with an immediate-resolve loader (data already loaded)
    registerRace(metadata, async () => routeData);
  }
}

// Initialize on import
initializeFromLegacy();

// ============================================================================
// Backwards-Compatible Export
// ============================================================================

/**
 * @deprecated Use `getRaceData(id)` or `getRaceMetadata(id)` from '@/data/races' instead.
 *
 * Provides the same interface as the old `marathon-data.json` import.
 * This is a synchronous object with all race data pre-loaded.
 */
export const marathonData: Record<string, RaceData> = Object.fromEntries(
  Object.entries(oldMarathonData as Record<string, any>).map(([id, data]) => [
    id,
    {
      id,
      name: data.name,
      city: data.city,
      country: data.country,
      region: inferRegion(data.country),
      tier: inferTier(data.name, data.elevationGain),
      raceType: inferRaceType(data.distance),
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
        summary: "Run at consistent effort throughout the race.",
        segments: [],
      },
      fuelingNotes: data.fuelingNotes || "",
      faq: data.faq || [],
      thumbnailPoints: data.thumbnailPoints || [],
    } as RaceData,
  ])
);

/**
 * @deprecated Use `getAllRaceIds()` from '@/data/races' instead.
 */
export const raceIds = Object.keys(marathonData);

/**
 * @deprecated Use `getRaceData(id)` from '@/data/races' instead.
 */
export function getRace(id: string): RaceData | undefined {
  return marathonData[id];
}

/**
 * @deprecated Use `getAllRaceData()` from '@/data/races' instead.
 */
export function getAllRaces(): RaceData[] {
  return Object.values(marathonData);
}

// ============================================================================
// Default export matches old import pattern
// ============================================================================

export default marathonData;
