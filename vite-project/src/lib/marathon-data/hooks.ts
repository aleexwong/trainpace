/**
 * Marathon Data React Hooks
 *
 * Provides React-friendly access to marathon data with:
 * - Loading states
 * - Error handling
 * - Firebase data overlay support
 * - Memoization for performance
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import type {
  MarathonCourseData,
  MarathonSummary,
  MarathonSearchOptions,
  CoursePoint,
} from './types';
import {
  getMarathonData,
  getMarathonSummary,
  getAllMarathonSummaries,
  searchMarathons,
  mergeWithFirebaseData,
  hasRoute,
} from './loader';
import { toRaceRouteData } from './seo-integration';
import type { RaceRouteData } from '../../components/seo/RacePageTemplate';

// =============================================================================
// Types
// =============================================================================

export interface UseMarathonDataResult {
  data: MarathonCourseData | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export interface UseMarathonWithFirebaseResult extends UseMarathonDataResult {
  isFirebaseLoading: boolean;
  hasFirebaseData: boolean;
}

export interface UseMarathonListResult {
  marathons: MarathonSummary[];
  isLoading: boolean;
  error: Error | null;
}

// =============================================================================
// Basic Hooks
// =============================================================================

/**
 * Load marathon data by route key
 *
 * @example
 * ```tsx
 * function BostonPage() {
 *   const { data, isLoading, error } = useMarathonData('boston');
 *
 *   if (isLoading) return <Spinner />;
 *   if (error) return <ErrorMessage error={error} />;
 *   if (!data) return <NotFound />;
 *
 *   return <RacePage data={data} />;
 * }
 * ```
 */
export function useMarathonData(routeKey: string | undefined): UseMarathonDataResult {
  const [data, setData] = useState<MarathonCourseData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadData = useCallback(() => {
    if (!routeKey) {
      setData(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const marathonData = getMarathonData(routeKey);
      setData(marathonData);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load marathon data'));
      setData(null);
    } finally {
      setIsLoading(false);
    }
  }, [routeKey]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return { data, isLoading, error, refetch: loadData };
}

/**
 * Load marathon summary (lightweight)
 */
export function useMarathonSummary(routeKey: string | undefined): {
  summary: MarathonSummary | null;
  isLoading: boolean;
  error: Error | null;
} {
  const [summary, setSummary] = useState<MarathonSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!routeKey) {
      setSummary(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const marathonSummary = getMarathonSummary(routeKey);
      setSummary(marathonSummary);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load summary'));
      setSummary(null);
    } finally {
      setIsLoading(false);
    }
  }, [routeKey]);

  return { summary, isLoading, error };
}

// =============================================================================
// Firebase Integration Hook
// =============================================================================

/**
 * Load marathon data with Firebase overlay
 * Fetches local data first, then overlays any Firebase enhancements
 *
 * @example
 * ```tsx
 * function RacePage({ routeKey }: { routeKey: string }) {
 *   const { data, isLoading, isFirebaseLoading, hasFirebaseData } =
 *     useMarathonDataWithFirebase(routeKey);
 *
 *   if (isLoading) return <Spinner />;
 *
 *   return (
 *     <>
 *       <RaceContent data={data} />
 *       {isFirebaseLoading && <LoadingOverlay text="Loading enhanced data..." />}
 *     </>
 *   );
 * }
 * ```
 */
export function useMarathonDataWithFirebase(
  routeKey: string | undefined
): UseMarathonWithFirebaseResult {
  const { data: localData, isLoading: localLoading, error, refetch } = useMarathonData(routeKey);
  const [mergedData, setMergedData] = useState<MarathonCourseData | null>(null);
  const [isFirebaseLoading, setIsFirebaseLoading] = useState(false);
  const [hasFirebaseData, setHasFirebaseData] = useState(false);

  useEffect(() => {
    async function loadFirebaseData() {
      if (!routeKey || !localData) {
        setMergedData(localData);
        return;
      }

      setIsFirebaseLoading(true);

      try {
        // Try to get enhanced data from Firebase
        const docRef = doc(db, 'gpx_uploads', routeKey);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const firebaseData = docSnap.data();

          // Merge Firebase data with local data
          const merged = mergeWithFirebaseData(routeKey, {
            thumbnailPoints: firebaseData.thumbnailPoints,
            displayPoints: firebaseData.displayPoints,
            elevationGain: firebaseData.elevationGain,
            elevationLoss: firebaseData.elevationLoss,
            startElevation: firebaseData.startElevation,
            endElevation: firebaseData.endElevation,
            distance: firebaseData.distance,
          });

          setMergedData(merged);
          setHasFirebaseData(true);
        } else {
          setMergedData(localData);
          setHasFirebaseData(false);
        }
      } catch (err) {
        // Fall back to local data on Firebase error
        console.warn('Firebase load failed, using local data:', err);
        setMergedData(localData);
        setHasFirebaseData(false);
      } finally {
        setIsFirebaseLoading(false);
      }
    }

    loadFirebaseData();
  }, [routeKey, localData]);

  return {
    data: mergedData,
    isLoading: localLoading,
    isFirebaseLoading,
    hasFirebaseData,
    error,
    refetch,
  };
}

// =============================================================================
// List and Search Hooks
// =============================================================================

/**
 * Get all marathon summaries
 */
export function useMarathonList(): UseMarathonListResult {
  const [marathons, setMarathons] = useState<MarathonSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setIsLoading(true);
    setError(null);

    try {
      const summaries = getAllMarathonSummaries();
      setMarathons(summaries);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load marathons'));
      setMarathons([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { marathons, isLoading, error };
}

/**
 * Search marathons with filters
 *
 * @example
 * ```tsx
 * function RaceSearch() {
 *   const [query, setQuery] = useState('');
 *   const { results, isLoading } = useMarathonSearch({
 *     query,
 *     distanceType: 'marathon',
 *     limit: 20,
 *   });
 *
 *   return (
 *     <>
 *       <input value={query} onChange={(e) => setQuery(e.target.value)} />
 *       {results.map((race) => <RaceCard key={race.id} race={race} />)}
 *     </>
 *   );
 * }
 * ```
 */
export function useMarathonSearch(options: MarathonSearchOptions): {
  results: MarathonSummary[];
  isLoading: boolean;
  error: Error | null;
} {
  const [results, setResults] = useState<MarathonSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setIsLoading(true);
    setError(null);

    try {
      const searchResults = searchMarathons(options);
      setResults(searchResults);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Search failed'));
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, [
    options.query,
    options.region,
    options.distanceType,
    options.maxElevationGain,
    options.difficulty,
    options.limit,
  ]);

  return { results, isLoading, error };
}

// =============================================================================
// Component-Friendly Hooks
// =============================================================================

/**
 * Get RaceRouteData for RacePageTemplate component
 * (backward compatible with existing components)
 *
 * @example
 * ```tsx
 * function RaceLanding({ routeKey }: { routeKey: string }) {
 *   const { routeData, isLoading, error } = useRaceRouteData(routeKey);
 *
 *   if (isLoading) return <Spinner />;
 *   if (!routeData) return <NotFound />;
 *
 *   return <RacePageTemplate page={seoPage} routeData={routeData} />;
 * }
 * ```
 */
export function useRaceRouteData(routeKey: string | undefined): {
  routeData: RaceRouteData | null;
  isLoading: boolean;
  error: Error | null;
} {
  const { data, isLoading, error } = useMarathonDataWithFirebase(routeKey);

  const routeData = useMemo(() => {
    if (!data) return null;
    return toRaceRouteData(data);
  }, [data]);

  return { routeData, isLoading, error };
}

/**
 * Get thumbnail points for map preview
 */
export function useThumbnailPoints(routeKey: string | undefined): {
  points: CoursePoint[];
  isLoading: boolean;
} {
  const { data, isLoading } = useMarathonDataWithFirebase(routeKey);

  const points = useMemo(() => {
    return data?.route?.thumbnailPoints || [];
  }, [data]);

  return { points, isLoading };
}

// =============================================================================
// Utility Hooks
// =============================================================================

/**
 * Check if a route key is valid
 */
export function useRouteExists(routeKey: string | undefined): boolean {
  return useMemo(() => {
    if (!routeKey) return false;
    return hasRoute(routeKey);
  }, [routeKey]);
}

/**
 * Get featured marathons (those with full course data)
 */
export function useFeaturedMarathons(limit: number = 7): {
  marathons: MarathonSummary[];
  isLoading: boolean;
} {
  const { marathons: all, isLoading } = useMarathonList();

  const featured = useMemo(() => {
    // Filter to only marathons with thumbnail points
    return all
      .filter((m) => m.thumbnailPoints && m.thumbnailPoints.length > 0)
      .slice(0, limit);
  }, [all, limit]);

  return { marathons: featured, isLoading };
}

/**
 * Get marathons grouped by region
 */
export function useMarathonsByRegion(): {
  regions: Map<string, MarathonSummary[]>;
  isLoading: boolean;
} {
  const { marathons, isLoading } = useMarathonList();

  const regions = useMemo(() => {
    const regionMap = new Map<string, MarathonSummary[]>();

    for (const marathon of marathons) {
      // Get region from country
      const region = getRegionFromCountryName(marathon.country);
      if (!regionMap.has(region)) {
        regionMap.set(region, []);
      }
      regionMap.get(region)!.push(marathon);
    }

    return regionMap;
  }, [marathons]);

  return { regions, isLoading };
}

// Helper function to get region (simple version)
function getRegionFromCountryName(country: string): string {
  const countryLower = country.toLowerCase();

  if (countryLower.includes('usa') || countryLower.includes('canada')) {
    return 'North America';
  }
  if (
    countryLower.includes('uk') ||
    countryLower.includes('germany') ||
    countryLower.includes('france') ||
    countryLower.includes('netherlands') ||
    countryLower.includes('norway') ||
    countryLower.includes('spain') ||
    countryLower.includes('italy')
  ) {
    return 'Europe';
  }
  if (
    countryLower.includes('japan') ||
    countryLower.includes('australia') ||
    countryLower.includes('china')
  ) {
    return 'Asia-Pacific';
  }

  return 'Other';
}
