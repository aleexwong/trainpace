/**
 * Marathon Data Type System
 *
 * Scalable architecture for managing marathon/race course data.
 * Designed for:
 * - 100+ race courses
 * - Modular data loading (lazy load by region/race)
 * - Type-safe access across the application
 * - Easy integration with SEO page generation
 * - Firebase/external data source compatibility
 */

// =============================================================================
// Core Geographic Types
// =============================================================================

/**
 * A single point on a race course with geographic coordinates
 */
export interface CoursePoint {
  /** Latitude in decimal degrees */
  lat: number;
  /** Longitude in decimal degrees */
  lng: number;
  /** Elevation in meters (optional for thumbnail points) */
  ele?: number;
  /** Distance from start in kilometers (optional) */
  dist?: number;
}

/**
 * Detailed route data for full course analysis
 */
export interface DetailedRoutePoints {
  /** Full resolution points (from GPX, typically 1000+ points) */
  fullPoints: CoursePoint[];
  /** Simplified points for map display (50-100 points) */
  displayPoints: CoursePoint[];
  /** Thumbnail points for previews (15-30 points) */
  thumbnailPoints: CoursePoint[];
}

// =============================================================================
// Course Characteristics
// =============================================================================

/**
 * Elevation statistics for a course
 */
export interface CourseElevation {
  /** Total elevation gain in meters */
  gain: number;
  /** Total elevation loss in meters */
  loss: number;
  /** Net elevation change (startElevation - endElevation) */
  netChange: number;
  /** Starting elevation in meters */
  startElevation: number;
  /** Finishing elevation in meters */
  endElevation: number;
  /** Highest point on course in meters */
  maxElevation?: number;
  /** Lowest point on course in meters */
  minElevation?: number;
}

/**
 * Pace strategy types supported by the system
 */
export type PaceStrategyType =
  | 'negative-split'    // Start conservative, finish faster
  | 'even-pace'         // Consistent pace throughout
  | 'even-effort'       // Consistent effort (pace varies with terrain)
  | 'conservative-start'// Hold back early due to course profile
  | 'controlled-downhill' // Manage downhill to save legs
  | 'effort-based';     // Run by feel, not pace (e.g., Big Sur)

/**
 * A segment of the course with pacing advice
 */
export interface PaceSegment {
  /** Mile range (e.g., "1-5", "10-12") */
  miles: string;
  /** Terrain description */
  terrain: string;
  /** Pacing/strategy advice for this segment */
  advice: string;
}

/**
 * Complete pacing strategy for a race
 */
export interface PaceStrategy {
  /** Strategy type */
  type: PaceStrategyType;
  /** One-sentence summary of the strategy */
  summary: string;
  /** Segment-by-segment breakdown */
  segments: PaceSegment[];
}

/**
 * Course difficulty rating
 */
export type CourseDifficulty = 'easy' | 'moderate' | 'challenging' | 'hard' | 'extreme';

/**
 * Course profile type
 */
export type CourseProfileType =
  | 'flat'              // <50m gain (Chicago, Valencia)
  | 'rolling'           // 50-150m gain (London, Paris)
  | 'hilly'             // 150-300m gain (Boston, NYC)
  | 'mountainous'       // 300-600m gain (Big Sur)
  | 'net-downhill'      // Significant net drop (CIM, St George)
  | 'net-uphill';       // Significant net gain

// =============================================================================
// Race Event Information
// =============================================================================

/**
 * Race event metadata (for SportsEvent schema)
 */
export interface RaceEventInfo {
  /** Official race name */
  name: string;
  /** City where the race takes place */
  city: string;
  /** Country (or State, Country for US races) */
  country: string;
  /** Typical race date (e.g., "April 2026", "First Sunday in November") */
  raceDate: string;
  /** Official website URL */
  website: string;
  /** Race organizer name */
  organizer?: string;
  /** Year the race was first held */
  foundedYear?: number;
  /** Typical field size */
  fieldSize?: number;
  /** Entry method */
  entryMethod?: 'lottery' | 'registration' | 'qualifying' | 'charity' | 'mixed';
}

/**
 * Race distance types
 */
export type RaceDistanceType = '5k' | '10k' | 'half' | 'marathon' | 'ultra' | 'other';

/**
 * Standard race distances in kilometers
 */
export const RACE_DISTANCES: Record<RaceDistanceType, number> = {
  '5k': 5,
  '10k': 10,
  'half': 21.0975,
  'marathon': 42.195,
  'ultra': 50, // Varies
  'other': 0,
};

// =============================================================================
// FAQ and Content
// =============================================================================

/**
 * FAQ item for a race
 */
export interface RaceFaq {
  question: string;
  answer: string;
}

/**
 * Race tips organized by category
 */
export interface RaceTips {
  /** General race tips */
  general: string[];
  /** Course-specific tips */
  course?: string[];
  /** Weather/conditions tips */
  weather?: string[];
  /** Logistics tips (travel, gear check, etc.) */
  logistics?: string[];
}

// =============================================================================
// Main Marathon Data Interface
// =============================================================================

/**
 * Complete marathon/race course data
 *
 * This is the primary interface for storing and accessing race data.
 * Designed for extensibility and partial data support.
 */
export interface MarathonCourseData {
  // --- Identity ---
  /** Unique identifier (matches key in data files) */
  id: string;
  /** URL-friendly slug for routing */
  slug: string;
  /** Maps to previewRouteKey in SEO pages */
  routeKey: string;

  // --- Event Info ---
  /** Race event information */
  event: RaceEventInfo;

  // --- Course Details ---
  /** Distance in kilometers */
  distance: number;
  /** Distance type */
  distanceType: RaceDistanceType;
  /** Elevation statistics */
  elevation: CourseElevation;
  /** Course profile type */
  profileType: CourseProfileType;
  /** Difficulty rating */
  difficulty: CourseDifficulty;

  // --- Route Data ---
  /** Route points (can be lazy-loaded) */
  route?: {
    /** Thumbnail points for quick display */
    thumbnailPoints: CoursePoint[];
    /** Display points for interactive maps */
    displayPoints?: CoursePoint[];
  };

  // --- Content ---
  /** Course description (1-3 paragraphs) */
  description: string;
  /** Pacing strategy */
  paceStrategy?: PaceStrategy;
  /** Race tips */
  tips?: RaceTips | string[];
  /** Fueling notes specific to this course */
  fuelingNotes?: string;
  /** Frequently asked questions */
  faq?: RaceFaq[];

  // --- Metadata ---
  /** Data source (local, firebase, gpx-upload) */
  source?: 'local' | 'firebase' | 'gpx-upload';
  /** When the data was last updated */
  lastUpdated?: string;
  /** Data quality/completeness score (0-100) */
  dataQuality?: number;
}

// =============================================================================
// Minimal/Partial Data Types
// =============================================================================

/**
 * Minimal race data for index pages and search
 */
export interface MarathonSummary {
  id: string;
  slug: string;
  routeKey: string;
  name: string;
  city: string;
  country: string;
  distance: number;
  distanceType: RaceDistanceType;
  elevationGain: number;
  profileType: CourseProfileType;
  difficulty: CourseDifficulty;
  raceDate: string;
  thumbnailPoints?: CoursePoint[];
}

/**
 * Convert full data to summary
 */
export function toMarathonSummary(data: MarathonCourseData): MarathonSummary {
  return {
    id: data.id,
    slug: data.slug,
    routeKey: data.routeKey,
    name: data.event.name,
    city: data.event.city,
    country: data.event.country,
    distance: data.distance,
    distanceType: data.distanceType,
    elevationGain: data.elevation.gain,
    profileType: data.profileType,
    difficulty: data.difficulty,
    raceDate: data.event.raceDate,
    thumbnailPoints: data.route?.thumbnailPoints,
  };
}

// =============================================================================
// Legacy Compatibility
// =============================================================================

/**
 * Legacy marathon-data.json format
 * Used for backward compatibility during migration
 */
export interface LegacyMarathonData {
  id: string;
  name: string;
  city: string;
  country: string;
  distance: number;
  elevationGain: number;
  elevationLoss: number;
  startElevation: number;
  endElevation: number;
  slug: string;
  raceDate: string;
  website: string;
  description: string;
  tips?: string[];
  paceStrategy?: {
    type: PaceStrategyType;
    summary: string;
    segments: PaceSegment[];
  };
  fuelingNotes?: string;
  faq?: Array<{ question: string; answer: string }>;
  thumbnailPoints: Array<{ lat: number; lng: number; ele?: number; dist?: number }>;
}

/**
 * Convert legacy format to new format
 */
export function fromLegacyFormat(
  key: string,
  legacy: LegacyMarathonData
): MarathonCourseData {
  // Determine profile type from elevation
  let profileType: CourseProfileType = 'flat';
  const netChange = legacy.startElevation - legacy.endElevation;

  if (netChange > 50) {
    profileType = 'net-downhill';
  } else if (netChange < -50) {
    profileType = 'net-uphill';
  } else if (legacy.elevationGain < 50) {
    profileType = 'flat';
  } else if (legacy.elevationGain < 150) {
    profileType = 'rolling';
  } else if (legacy.elevationGain < 300) {
    profileType = 'hilly';
  } else {
    profileType = 'mountainous';
  }

  // Determine difficulty
  let difficulty: CourseDifficulty = 'moderate';
  if (legacy.elevationGain < 50) {
    difficulty = 'easy';
  } else if (legacy.elevationGain < 150) {
    difficulty = 'moderate';
  } else if (legacy.elevationGain < 300) {
    difficulty = 'challenging';
  } else if (legacy.elevationGain < 500) {
    difficulty = 'hard';
  } else {
    difficulty = 'extreme';
  }

  return {
    id: legacy.id,
    slug: key, // Use the object key as slug
    routeKey: key,

    event: {
      name: legacy.name,
      city: legacy.city,
      country: legacy.country,
      raceDate: legacy.raceDate,
      website: legacy.website,
    },

    distance: legacy.distance,
    distanceType: legacy.distance > 42 ? 'marathon' : legacy.distance > 21 ? 'half' : '10k',

    elevation: {
      gain: legacy.elevationGain,
      loss: legacy.elevationLoss,
      netChange: legacy.startElevation - legacy.endElevation,
      startElevation: legacy.startElevation,
      endElevation: legacy.endElevation,
    },

    profileType,
    difficulty,

    route: {
      thumbnailPoints: legacy.thumbnailPoints,
    },

    description: legacy.description,
    paceStrategy: legacy.paceStrategy,
    tips: legacy.tips,
    fuelingNotes: legacy.fuelingNotes,
    faq: legacy.faq,

    source: 'local',
  };
}

// =============================================================================
// Data Registry Types
// =============================================================================

/**
 * Registry entry for lazy loading
 */
export interface MarathonRegistryEntry {
  id: string;
  routeKey: string;
  name: string;
  city: string;
  country: string;
  region: MarathonRegion;
  distanceType: RaceDistanceType;
  hasFullData: boolean;
  dataPath?: string;
}

/**
 * Geographic regions for grouping races
 */
export type MarathonRegion =
  | 'north-america'
  | 'europe'
  | 'asia-pacific'
  | 'middle-east'
  | 'south-america'
  | 'africa'
  | 'oceania';

/**
 * Determine region from country
 */
export function getRegionFromCountry(country: string): MarathonRegion {
  const countryLower = country.toLowerCase();

  // North America
  if (
    countryLower.includes('usa') ||
    countryLower.includes('united states') ||
    countryLower.includes('canada') ||
    countryLower.includes('mexico')
  ) {
    return 'north-america';
  }

  // Europe
  if (
    countryLower.includes('uk') ||
    countryLower.includes('england') ||
    countryLower.includes('germany') ||
    countryLower.includes('france') ||
    countryLower.includes('italy') ||
    countryLower.includes('spain') ||
    countryLower.includes('netherlands') ||
    countryLower.includes('norway') ||
    countryLower.includes('sweden') ||
    countryLower.includes('denmark') ||
    countryLower.includes('finland') ||
    countryLower.includes('ireland') ||
    countryLower.includes('portugal') ||
    countryLower.includes('greece') ||
    countryLower.includes('switzerland') ||
    countryLower.includes('austria') ||
    countryLower.includes('belgium') ||
    countryLower.includes('czech') ||
    countryLower.includes('iceland') ||
    countryLower.includes('turkey')
  ) {
    return 'europe';
  }

  // Asia-Pacific
  if (
    countryLower.includes('japan') ||
    countryLower.includes('china') ||
    countryLower.includes('korea') ||
    countryLower.includes('singapore') ||
    countryLower.includes('hong kong') ||
    countryLower.includes('taiwan') ||
    countryLower.includes('india') ||
    countryLower.includes('thailand')
  ) {
    return 'asia-pacific';
  }

  // Oceania
  if (countryLower.includes('australia') || countryLower.includes('new zealand')) {
    return 'oceania';
  }

  // Middle East
  if (
    countryLower.includes('dubai') ||
    countryLower.includes('uae') ||
    countryLower.includes('qatar') ||
    countryLower.includes('israel') ||
    countryLower.includes('saudi')
  ) {
    return 'middle-east';
  }

  // South America
  if (
    countryLower.includes('brazil') ||
    countryLower.includes('argentina') ||
    countryLower.includes('chile') ||
    countryLower.includes('colombia') ||
    countryLower.includes('peru')
  ) {
    return 'south-america';
  }

  // Africa
  if (
    countryLower.includes('south africa') ||
    countryLower.includes('kenya') ||
    countryLower.includes('morocco') ||
    countryLower.includes('egypt')
  ) {
    return 'africa';
  }

  // Default to Europe for unknown (common for European races)
  return 'europe';
}
