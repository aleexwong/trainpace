/**
 * Marathon Data Module
 *
 * Scalable architecture for managing marathon/race course data.
 *
 * @example
 * ```typescript
 * import {
 *   getMarathonData,
 *   getAllMarathonSummaries,
 *   searchMarathons,
 *   validateMarathonData,
 *   generateRacePageFromMarathonData,
 * } from '@/lib/marathon-data';
 *
 * // Get full data for a specific race
 * const boston = getMarathonData('boston');
 *
 * // Get lightweight summaries for list pages
 * const allRaces = getAllMarathonSummaries();
 *
 * // Search and filter
 * const flatRaces = searchMarathons({
 *   maxElevationGain: 100,
 *   distanceType: 'marathon',
 * });
 *
 * // Validate data quality
 * const validation = validateMarathonData(boston);
 *
 * // Generate SEO page config
 * const seoPage = generateRacePageFromMarathonData(boston);
 * ```
 */

// =============================================================================
// Types
// =============================================================================

export type {
  // Core types
  CoursePoint,
  DetailedRoutePoints,
  CourseElevation,
  PaceStrategyType,
  PaceSegment,
  PaceStrategy,
  CourseDifficulty,
  CourseProfileType,

  // Event types
  RaceEventInfo,
  RaceDistanceType,
  RaceFaq,
  RaceTips,

  // Main data types
  MarathonCourseData,
  MarathonSummary,
  MarathonRegistryEntry,
  MarathonRegion,

  // Legacy types
  LegacyMarathonData,
} from './types';

export { RACE_DISTANCES } from './types';

// =============================================================================
// Data Loading
// =============================================================================

export {
  // Registry access
  getAllRouteKeys,
  getRoutesByRegion,
  getRoutesByDistance,
  hasRoute,
  getRegistryEntry,
  getAllRegistryEntries,

  // Data loading
  getMarathonData,
  getMarathonSummary,
  getMarathonDataBatch,
  getAllMarathonSummaries,

  // Legacy format access
  getLegacyMarathonData,
  getAllLegacyMarathonData,

  // Route points
  getThumbnailPoints,
  getDisplayPoints,

  // Firebase integration
  mergeWithFirebaseData,

  // Search and filter
  searchMarathons,
  type MarathonSearchOptions,

  // Statistics
  getMarathonDataStats,
  type MarathonDataStats,

  // Cache management
  clearMarathonCache,
  clearRouteCache,
} from './loader';

// =============================================================================
// Validation
// =============================================================================

export {
  // Validation
  validateMarathonData,
  validateBatch,
  getBatchValidationSummary,

  // SEO readiness
  checkSeoReadiness,

  // Types
  type ValidationResult,
  type ValidationIssue,
  type ValidationSeverity,
  type SeoReadinessResult,
} from './validation';

// =============================================================================
// SEO Integration
// =============================================================================

export {
  // Page generation
  generateRacePageFromMarathonData,
  generateAllRacePages,
  generateRacePagesByRegion,

  // Schema generation
  toRaceEventData,

  // Related pages
  findRelatedRaces,
  getRacesByCity,
  getRacesByDistanceType,

  // Component data conversion
  toRaceRouteData,

  // URL helpers
  getRacePageUrl,
  getPreviewRouteUrl,

  // Content helpers
  getPaceStrategyDescription,
  getDifficultyDescription,
  getProfileTypeDescription,
} from './seo-integration';

// =============================================================================
// Type Utilities
// =============================================================================

export {
  toMarathonSummary,
  fromLegacyFormat,
  getRegionFromCountry,
} from './types';

// =============================================================================
// React Hooks
// =============================================================================

export {
  // Data hooks
  useMarathonData,
  useMarathonSummary,
  useMarathonDataWithFirebase,
  useMarathonList,
  useMarathonSearch,

  // Component-friendly hooks
  useRaceRouteData,
  useThumbnailPoints,

  // Utility hooks
  useRouteExists,
  useFeaturedMarathons,
  useMarathonsByRegion,

  // Types
  type UseMarathonDataResult,
  type UseMarathonWithFirebaseResult,
  type UseMarathonListResult,
} from './hooks';

// =============================================================================
// Convenience Re-exports
// =============================================================================

/**
 * Commonly used type for components expecting marathon route data
 */
export type { RaceRouteData } from '../../components/seo/RacePageTemplate';
