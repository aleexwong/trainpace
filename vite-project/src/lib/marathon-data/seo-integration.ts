/**
 * Marathon Data SEO Integration
 *
 * Connects marathon course data to the SEO page generation system.
 * Provides:
 * - Automatic SEO page config generation from marathon data
 * - Schema.org SportsEvent generation
 * - Content templates with race-specific variables
 * - Related page linking
 */

import type { SeoPageConfig, SeoFaqItem, SeoHowTo, RaceEventData } from '../seo/types';
import { generatePageId, BASE_URL } from '../seo/types';
import type { MarathonCourseData, MarathonSummary, CoursePoint } from './types';
import { getMarathonData, getAllMarathonSummaries, getRegionFromCountry } from './loader';

// =============================================================================
// SEO Page Generation
// =============================================================================

/**
 * Generate SEO page config from marathon course data
 */
export function generateRacePageFromMarathonData(
  data: MarathonCourseData
): SeoPageConfig {
  const { event, elevation, distance, paceStrategy, faq, tips } = data;

  // Build description
  const description = buildRaceDescription(data);

  // Build intro
  const intro = buildRaceIntro(data);

  // Build bullets
  const bullets = buildRaceBullets(data);

  // Build FAQs
  const seoFaqs: SeoFaqItem[] = faq?.map((f) => ({
    question: f.question,
    answer: f.answer,
  })) || [];

  // Build HowTo
  const howTo = buildRaceHowTo(data);

  // Build tips array
  const tipsList = Array.isArray(tips) ? tips : tips?.general || [];

  return {
    id: generatePageId('race', data.slug),
    slug: data.slug,
    path: `/race/${data.slug}`,
    tool: 'race',

    title: `${event.name} Race Prep - Pace, Fueling & Course Strategy | TrainPace`,
    description,
    h1: `${event.name} Race Prep`,
    intro,
    bullets,

    cta: {
      href: '/calculator',
      label: 'Start With Pacing',
    },

    previewRouteKey: data.routeKey,

    faq: seoFaqs.length > 0 ? seoFaqs : undefined,
    howTo,

    // Variables for content interpolation
    variables: {
      slug: data.slug,
      name: event.name,
      displayName: event.name,
      city: event.city,
      country: event.country,
      eventName: event.name,
      eventDate: event.raceDate,
      elevationGain: elevation.gain,
      elevationLoss: elevation.loss,
      distance: `${distance.toFixed(1)} km`,
      distanceKm: distance,
      raceType: data.distanceType === 'marathon' ? 'marathon' : data.distanceType,
      difficulty: data.difficulty,
      custom: {
        profileType: data.profileType,
        paceStrategyType: paceStrategy?.type || 'even-pace',
      },
    },

    // Metadata
    schemaTypes: ['SportsEvent', 'FAQPage', 'HowTo', 'BreadcrumbList'],
    priority: data.distanceType === 'marathon' ? 0.8 : 0.7,
    changefreq: 'monthly',
  };
}

/**
 * Build race description for SEO
 */
function buildRaceDescription(data: MarathonCourseData): string {
  const { event, elevation, distance, difficulty } = data;

  const distanceStr =
    data.distanceType === 'marathon'
      ? 'marathon'
      : data.distanceType === 'half'
        ? 'half marathon'
        : `${distance.toFixed(1)}km`;

  const elevationNote =
    elevation.gain < 100
      ? 'flat course perfect for PRs'
      : elevation.gain < 200
        ? 'rolling terrain'
        : `challenging ${Math.round(elevation.gain)}m elevation gain`;

  return `${event.name} race prep: ${distanceStr} in ${event.city}. ${elevationNote}. Get training paces, build a fueling plan, and analyze the course elevation.`;
}

/**
 * Build race intro paragraph
 */
function buildRaceIntro(data: MarathonCourseData): string {
  const { event, paceStrategy } = data;

  const strategyNote = paceStrategy
    ? ` The course favors a ${paceStrategy.type.replace(/-/g, ' ')} approach.`
    : '';

  return `Use TrainPace to prepare for ${event.name}: set training paces from a recent race, build a simple fueling plan, and review the course profile.${strategyNote}`;
}

/**
 * Build race bullet points
 */
function buildRaceBullets(data: MarathonCourseData): string[] {
  const { elevation, distance } = data;

  return [
    'Pace calculator: training zones from your fitness level',
    'Fuel planner: carbs/hour target and gel timing',
    `Course: ${distance.toFixed(1)} km with ${Math.round(elevation.gain)}m gain / ${Math.round(elevation.loss)}m loss`,
  ];
}

/**
 * Build race HowTo schema content
 */
function buildRaceHowTo(data: MarathonCourseData): SeoHowTo {
  const { event } = data;

  return {
    name: `How to prepare for ${event.name}`,
    description: `Plan pacing, fueling, and course strategy for ${event.name}.`,
    totalTime: 'PT10M',
    tool: 'TrainPace',
    steps: [
      {
        name: 'Set a realistic goal time',
        text: 'Use a recent race result or time trial to establish your current fitness level.',
      },
      {
        name: 'Calculate training paces',
        text: 'Generate Easy, Tempo, Threshold, and Interval paces from your goal time.',
      },
      {
        name: 'Build a fueling plan',
        text: 'Estimate carbs per hour and create a gel timing schedule for race day.',
      },
      {
        name: 'Review the course',
        text: `Study the ${event.name} elevation profile to identify key climbs and plan pacing adjustments.`,
      },
      {
        name: 'Practice the plan',
        text: 'Test your pacing and fueling strategy in long training runs before race day.',
      },
    ],
  };
}

// =============================================================================
// RaceEventData Generation (for Schema.org)
// =============================================================================

/**
 * Generate RaceEventData for schema generation
 */
export function toRaceEventData(data: MarathonCourseData): RaceEventData {
  const { event } = data;

  return {
    name: event.name,
    description: data.description,
    city: event.city,
    country: event.country,
    raceDate: event.raceDate,
    website: event.website,
    organizer: event.organizer,
  };
}

// =============================================================================
// Batch Generation
// =============================================================================

/**
 * Generate SEO page configs for all marathons with full data
 */
export function generateAllRacePages(): SeoPageConfig[] {
  const summaries = getAllMarathonSummaries();
  const pages: SeoPageConfig[] = [];

  for (const summary of summaries) {
    const fullData = getMarathonData(summary.routeKey);
    if (fullData) {
      pages.push(generateRacePageFromMarathonData(fullData));
    }
  }

  return pages;
}

/**
 * Generate SEO page configs for a specific region
 */
export function generateRacePagesByRegion(
  region: ReturnType<typeof getRegionFromCountry>
): SeoPageConfig[] {
  const summaries = getAllMarathonSummaries();
  const pages: SeoPageConfig[] = [];

  for (const summary of summaries) {
    if (getRegionFromCountry(summary.country) === region) {
      const fullData = getMarathonData(summary.routeKey);
      if (fullData) {
        pages.push(generateRacePageFromMarathonData(fullData));
      }
    }
  }

  return pages;
}

// =============================================================================
// Related Pages
// =============================================================================

/**
 * Find related race pages based on similarity
 */
export function findRelatedRaces(
  routeKey: string,
  limit: number = 5
): MarathonSummary[] {
  const currentData = getMarathonData(routeKey);
  if (!currentData) {
    return [];
  }

  const allSummaries = getAllMarathonSummaries();
  const currentRegion = getRegionFromCountry(currentData.event.country);

  // Score each race by similarity
  const scored = allSummaries
    .filter((s) => s.routeKey !== routeKey)
    .map((summary) => {
      let score = 0;

      // Same distance type
      if (summary.distanceType === currentData.distanceType) {
        score += 3;
      }

      // Same region
      if (getRegionFromCountry(summary.country) === currentRegion) {
        score += 2;
      }

      // Similar difficulty
      if (summary.difficulty === currentData.difficulty) {
        score += 2;
      }

      // Similar elevation (within 50m)
      if (Math.abs(summary.elevationGain - currentData.elevation.gain) < 50) {
        score += 1;
      }

      // Same profile type
      if (summary.profileType === currentData.profileType) {
        score += 1;
      }

      return { summary, score };
    });

  // Sort by score and return top results
  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((s) => s.summary);
}

/**
 * Get races in the same city
 */
export function getRacesByCity(city: string): MarathonSummary[] {
  const cityLower = city.toLowerCase();
  return getAllMarathonSummaries().filter(
    (s) => s.city.toLowerCase() === cityLower
  );
}

/**
 * Get races by distance type
 */
export function getRacesByDistanceType(
  distanceType: MarathonCourseData['distanceType']
): MarathonSummary[] {
  return getAllMarathonSummaries().filter((s) => s.distanceType === distanceType);
}

// =============================================================================
// Route Data for Components
// =============================================================================

/**
 * Convert marathon data to RaceRouteData format for RacePageTemplate
 * (backward compatibility)
 */
export function toRaceRouteData(data: MarathonCourseData): {
  name: string;
  city: string;
  country: string;
  distance: number;
  elevationGain: number;
  elevationLoss: number;
  startElevation: number;
  endElevation: number;
  description: string;
  raceDate: string;
  website: string;
  tips?: string[];
  fuelingNotes?: string;
  faq?: Array<{ question: string; answer: string }>;
  thumbnailPoints: CoursePoint[];
} {
  return {
    name: data.event.name,
    city: data.event.city,
    country: data.event.country,
    distance: data.distance,
    elevationGain: data.elevation.gain,
    elevationLoss: data.elevation.loss,
    startElevation: data.elevation.startElevation,
    endElevation: data.elevation.endElevation,
    description: data.description,
    raceDate: data.event.raceDate,
    website: data.event.website,
    tips: Array.isArray(data.tips) ? data.tips : data.tips?.general,
    fuelingNotes: data.fuelingNotes,
    faq: data.faq,
    thumbnailPoints: data.route?.thumbnailPoints || [],
  };
}

// =============================================================================
// URL Helpers
// =============================================================================

/**
 * Generate canonical URL for a race page
 */
export function getRacePageUrl(routeKey: string): string {
  const data = getMarathonData(routeKey);
  if (!data) {
    return `${BASE_URL}/race/${routeKey}`;
  }
  return `${BASE_URL}/race/${data.slug}`;
}

/**
 * Generate preview route URL
 */
export function getPreviewRouteUrl(routeKey: string): string {
  return `${BASE_URL}/preview-route/${routeKey}`;
}

// =============================================================================
// Content Helpers
// =============================================================================

/**
 * Get pace strategy description for display
 */
export function getPaceStrategyDescription(
  strategyType: MarathonCourseData['paceStrategy'] extends { type: infer T } ? T : never
): string {
  const descriptions: Record<string, string> = {
    'negative-split': 'Start conservative and finish faster',
    'even-pace': 'Maintain consistent pace throughout',
    'even-effort': 'Adjust pace for terrain, maintain effort',
    'conservative-start': 'Hold back early due to course profile',
    'controlled-downhill': 'Manage downhill sections to save legs',
    'effort-based': 'Run by feel rather than pace',
  };

  return descriptions[strategyType as string] || 'Run smart';
}

/**
 * Get difficulty description
 */
export function getDifficultyDescription(
  difficulty: MarathonCourseData['difficulty']
): string {
  const descriptions: Record<string, string> = {
    easy: 'Flat, fast course - great for PRs',
    moderate: 'Gentle rolling terrain',
    challenging: 'Noticeable hills',
    hard: 'Significant elevation change',
    extreme: 'Major climbing - expect slower times',
  };

  return descriptions[difficulty] || '';
}

/**
 * Get profile type description
 */
export function getProfileTypeDescription(
  profileType: MarathonCourseData['profileType']
): string {
  const descriptions: Record<string, string> = {
    flat: 'Flat course (<50m elevation gain)',
    rolling: 'Gently rolling (50-150m gain)',
    hilly: 'Hilly course (150-300m gain)',
    mountainous: 'Mountainous (300m+ gain)',
    'net-downhill': 'Net downhill course',
    'net-uphill': 'Net uphill course',
  };

  return descriptions[profileType] || '';
}
