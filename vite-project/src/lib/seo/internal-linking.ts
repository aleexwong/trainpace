/**
 * Internal Linking Engine
 *
 * Implements hub-and-spoke architecture for SEO:
 * - Hub pages serve as category landing pages
 * - Spoke pages link back to hubs and to related spokes
 * - Automatic related page suggestions based on content similarity
 * - Breadcrumb generation for navigation
 */

import type {
  SeoPageConfig,
  SeoToolType,
  InternalLink,
  BreadcrumbItem,
  LinkingContext,
  SeoHubConfig,
} from './types';
import { withBaseUrl } from './types';

// =============================================================================
// Hub Configuration
// =============================================================================

/**
 * Define the hub-and-spoke structure for each tool
 * Hubs are the category landing pages that link to spoke pages
 */
export const HUB_CONFIG: Record<SeoToolType, SeoHubConfig> = {
  pace: {
    id: 'pace:hub',
    slug: 'calculator',
    path: '/calculator',
    tool: 'pace',
    title: 'Pace Calculator',
    description: 'Running pace calculator with VDOT training zones',
    h1: 'Running Pace Calculator',
    intro: 'Convert any race time into personalized training paces.',
    spokePageIds: [],
    categories: [
      {
        name: 'By Distance',
        description: 'Pace calculators for specific race distances',
        pageIds: [],
      },
      {
        name: 'By Goal Time',
        description: 'Target-based pace calculators',
        pageIds: [],
      },
      {
        name: 'Training Zones',
        description: 'Specific training pace calculators',
        pageIds: [],
      },
    ],
  },
  fuel: {
    id: 'fuel:hub',
    slug: 'fuel',
    path: '/fuel',
    tool: 'fuel',
    title: 'Fuel Planner',
    description: 'Marathon and half marathon fueling calculator',
    h1: 'Race Fuel Planner',
    intro: 'Build a personalized fueling plan for race day.',
    spokePageIds: [],
    categories: [
      {
        name: 'By Distance',
        description: 'Fueling guides by race distance',
        pageIds: [],
      },
      {
        name: 'Fueling Topics',
        description: 'Specific fueling strategies and topics',
        pageIds: [],
      },
    ],
  },
  elevation: {
    id: 'elevation:hub',
    slug: 'elevationfinder',
    path: '/elevationfinder',
    tool: 'elevation',
    title: 'Elevation Finder',
    description: 'GPX elevation profile analyzer',
    h1: 'Elevation Finder',
    intro: 'Analyze route elevation and plan your pacing strategy.',
    spokePageIds: [],
    categories: [
      {
        name: 'Analysis Tools',
        description: 'GPX analysis and elevation tools',
        pageIds: [],
      },
      {
        name: 'Platform Guides',
        description: 'Guides for specific platforms (Strava, Garmin, etc.)',
        pageIds: [],
      },
      {
        name: 'Strategy Guides',
        description: 'Pacing and strategy for hilly courses',
        pageIds: [],
      },
    ],
  },
  race: {
    id: 'race:hub',
    slug: 'race',
    path: '/race',
    tool: 'race',
    title: 'Race Prep',
    description: 'Race preparation guides and tools',
    h1: 'Race Prep',
    intro: 'Prepare for your next race with pacing, fueling, and course strategy.',
    spokePageIds: [],
    categories: [
      {
        name: 'World Marathon Majors',
        description: 'Prep guides for the six World Marathon Majors',
        pageIds: [],
      },
      {
        name: 'Popular Marathons',
        description: 'Prep guides for other popular marathons',
        pageIds: [],
      },
      {
        name: 'Half Marathons',
        description: 'Prep guides for popular half marathons',
        pageIds: [],
      },
    ],
  },
  blog: {
    id: 'blog:hub',
    slug: 'blog',
    path: '/blog',
    tool: 'blog',
    title: 'Blog',
    description: 'Running tips, training guides, and race strategy',
    h1: 'TrainPace Blog',
    intro: 'Expert running tips and training guides.',
    spokePageIds: [],
    categories: [
      {
        name: 'Training',
        description: 'Training tips and guides',
        pageIds: [],
      },
      {
        name: 'Nutrition',
        description: 'Fueling and nutrition guides',
        pageIds: [],
      },
      {
        name: 'Race Strategy',
        description: 'Race day strategy and tips',
        pageIds: [],
      },
    ],
  },
};

// =============================================================================
// Breadcrumb Generation
// =============================================================================

/**
 * Generate breadcrumbs for a page based on its tool and path
 */
export function generateBreadcrumbs(page: SeoPageConfig): BreadcrumbItem[] {
  const breadcrumbs: BreadcrumbItem[] = [
    { name: 'TrainPace', url: withBaseUrl('/') },
  ];

  const hub = HUB_CONFIG[page.tool];
  if (hub) {
    breadcrumbs.push({
      name: hub.title,
      url: withBaseUrl(hub.path),
    });
  }

  // Handle nested paths (e.g., /elevationfinder/guides/slug)
  const pathParts = page.path.split('/').filter(Boolean);
  if (pathParts.length > 2) {
    // Add intermediate breadcrumbs
    if (pathParts.includes('guides')) {
      breadcrumbs.push({
        name: 'Guides',
        url: withBaseUrl(`/${pathParts[0]}/guides`),
      });
    }
  }

  // Add current page (unless it's the hub itself)
  if (page.path !== hub?.path) {
    breadcrumbs.push({
      name: page.h1,
      url: withBaseUrl(page.path),
    });
  }

  return breadcrumbs;
}

// =============================================================================
// Related Pages Engine
// =============================================================================

/**
 * Keywords/topics for matching related pages
 */
const TOPIC_KEYWORDS: Record<string, string[]> = {
  // Distances
  '5k': ['5k', '5-k', 'five-k', '5km', '5000'],
  '10k': ['10k', '10-k', 'ten-k', '10km', '10000'],
  'half': ['half', 'half-marathon', '13.1', '21k', '21.1'],
  'marathon': ['marathon', '26.2', '42k', '42.195'],
  'ultra': ['ultra', 'ultramarathon', '50k', '100k', '100-mile'],

  // Training types
  'tempo': ['tempo', 'threshold', 'lt', 'lactate'],
  'easy': ['easy', 'recovery', 'slow', 'conversational'],
  'interval': ['interval', 'speed', 'vo2', 'repeats'],
  'vdot': ['vdot', 'daniels', 'vo2max'],

  // Fueling
  'gel': ['gel', 'gels', 'gu', 'maurten'],
  'carbs': ['carb', 'carbs', 'carbohydrate', 'glycogen'],
  'fueling': ['fuel', 'fueling', 'nutrition', 'eating'],
  'hydration': ['hydrate', 'hydration', 'water', 'electrolyte'],

  // Elevation
  'elevation': ['elevation', 'altitude', 'height'],
  'hills': ['hill', 'hills', 'hilly', 'climb', 'climbing'],
  'gpx': ['gpx', 'gps', 'track', 'route'],
  'grade': ['grade', 'gradient', 'slope', 'incline'],

  // Platforms
  'strava': ['strava'],
  'garmin': ['garmin'],
  'coros': ['coros'],

  // Race locations (majors)
  'boston': ['boston'],
  'nyc': ['nyc', 'new york', 'new-york'],
  'chicago': ['chicago'],
  'berlin': ['berlin'],
  'london': ['london'],
  'tokyo': ['tokyo'],
};

/**
 * Extract topics from a page's content
 */
function extractTopics(page: SeoPageConfig): string[] {
  const topics = new Set<string>();
  const searchText = [
    page.slug,
    page.title,
    page.description,
    page.h1,
    page.intro,
    ...page.bullets,
  ]
    .join(' ')
    .toLowerCase();

  for (const [topic, keywords] of Object.entries(TOPIC_KEYWORDS)) {
    if (keywords.some((kw) => searchText.includes(kw))) {
      topics.add(topic);
    }
  }

  return Array.from(topics);
}

/**
 * Calculate relevance score between two pages based on shared topics
 */
function calculateRelevance(page1: SeoPageConfig, page2: SeoPageConfig): number {
  const topics1 = extractTopics(page1);
  const topics2 = extractTopics(page2);

  // Same tool gets a base score boost
  let score = page1.tool === page2.tool ? 0.3 : 0;

  // Calculate topic overlap
  const sharedTopics = topics1.filter((t) => topics2.includes(t));
  const totalTopics = new Set([...topics1, ...topics2]).size;

  if (totalTopics > 0) {
    score += (sharedTopics.length / totalTopics) * 0.7;
  }

  return Math.min(score, 1.0);
}

/**
 * Find related pages for a given page
 */
export function findRelatedPages(
  page: SeoPageConfig,
  allPages: SeoPageConfig[],
  options: {
    limit?: number;
    minRelevance?: number;
    sameToolOnly?: boolean;
    excludeIds?: string[];
  } = {}
): InternalLink[] {
  const { limit = 5, minRelevance = 0.2, sameToolOnly = false, excludeIds = [] } = options;

  const candidates = allPages.filter((p) => {
    // Exclude self
    if (p.id === page.id) return false;

    // Exclude specified IDs
    if (excludeIds.includes(p.id)) return false;

    // Filter by same tool if requested
    if (sameToolOnly && p.tool !== page.tool) return false;

    return true;
  });

  // Calculate relevance for all candidates
  const scored = candidates.map((p) => ({
    page: p,
    score: calculateRelevance(page, p),
  }));

  // Sort by relevance and take top N
  return scored
    .filter((s) => s.score >= minRelevance)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((s) => ({
      pageId: s.page.id,
      path: s.page.path,
      title: s.page.h1,
      relevanceScore: s.score,
    }));
}

// =============================================================================
// Cross-Tool Linking
// =============================================================================

/**
 * Generate cross-tool links for a page
 * Each tool should link to relevant pages from other tools
 */
export function generateCrossToolLinks(
  page: SeoPageConfig,
  allPages: SeoPageConfig[]
): Record<SeoToolType, InternalLink[]> {
  const result: Record<SeoToolType, InternalLink[]> = {
    pace: [],
    fuel: [],
    elevation: [],
    race: [],
    blog: [],
  };

  const topics = extractTopics(page);

  for (const toolType of Object.keys(result) as SeoToolType[]) {
    if (toolType === page.tool) continue;

    const toolPages = allPages.filter((p) => p.tool === toolType);
    const related = findRelatedPages(page, toolPages, {
      limit: 3,
      minRelevance: 0.15,
    });

    result[toolType] = related;
  }

  return result;
}

// =============================================================================
// Hub-Spoke Linking
// =============================================================================

/**
 * Get the hub page for a given spoke page
 */
export function getHubForPage(page: SeoPageConfig): InternalLink | undefined {
  const hub = HUB_CONFIG[page.tool];
  if (!hub || page.path === hub.path) return undefined;

  return {
    pageId: hub.id,
    path: hub.path,
    title: hub.title,
  };
}

/**
 * Get sibling pages (other spokes under the same hub)
 */
export function getSiblingPages(
  page: SeoPageConfig,
  allPages: SeoPageConfig[],
  limit = 6
): InternalLink[] {
  const siblings = allPages.filter(
    (p) => p.tool === page.tool && p.id !== page.id
  );

  return findRelatedPages(page, siblings, {
    limit,
    minRelevance: 0.1,
    sameToolOnly: true,
  });
}

// =============================================================================
// Complete Linking Context
// =============================================================================

/**
 * Generate complete linking context for a page
 * This includes breadcrumbs, related pages, hub, and siblings
 */
export function generateLinkingContext(
  page: SeoPageConfig,
  allPages: SeoPageConfig[]
): LinkingContext {
  return {
    currentPage: page,
    breadcrumbs: generateBreadcrumbs(page),
    relatedPages: findRelatedPages(page, allPages, { limit: 5 }),
    hubPage: getHubForPage(page),
    siblingPages: getSiblingPages(page, allPages, 4),
  };
}

// =============================================================================
// Sitemap Priority Calculation
// =============================================================================

/**
 * Calculate sitemap priority based on page importance
 */
export function calculateSitemapPriority(page: SeoPageConfig): number {
  // Hub pages get highest priority
  const hub = HUB_CONFIG[page.tool];
  if (hub && page.path === hub.path) {
    return 0.9;
  }

  // Major race pages get high priority
  const majorRaces = ['boston', 'nyc', 'chicago', 'berlin', 'london', 'tokyo'];
  if (page.tool === 'race' && majorRaces.some((r) => page.slug.includes(r))) {
    return 0.8;
  }

  // Popular distance calculators get high priority
  const popularDistances = ['marathon', 'half-marathon', '5k', '10k'];
  if (page.tool === 'pace' && popularDistances.some((d) => page.slug.includes(d))) {
    return 0.8;
  }

  // Standard SEO pages
  if (page.faq && page.faq.length > 0) {
    return 0.7; // Pages with FAQs are more valuable
  }

  return 0.6;
}

// =============================================================================
// Link Validation
// =============================================================================

export interface LinkValidationResult {
  isValid: boolean;
  brokenLinks: string[];
  orphanPages: string[]; // Pages with no incoming links
  warnings: string[];
}

/**
 * Validate internal linking structure
 */
export function validateInternalLinks(
  pages: SeoPageConfig[]
): LinkValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const brokenLinks: string[] = [];
  const pageIds = new Set(pages.map((p) => p.id));
  const linkedPageIds = new Set<string>();

  for (const page of pages) {
    // Check related page links
    if (page.relatedPageIds) {
      for (const relatedId of page.relatedPageIds) {
        if (!pageIds.has(relatedId)) {
          brokenLinks.push(`${page.id} -> ${relatedId}`);
        } else {
          linkedPageIds.add(relatedId);
        }
      }
    }

    // Check parent page link
    if (page.parentPageId && !pageIds.has(page.parentPageId)) {
      brokenLinks.push(`${page.id} -> ${page.parentPageId} (parent)`);
    }

    // Check hub page link
    if (page.hubPageId && !pageIds.has(page.hubPageId)) {
      brokenLinks.push(`${page.id} -> ${page.hubPageId} (hub)`);
    }
  }

  // Find orphan pages (no incoming links)
  const orphanPages: string[] = [];
  for (const page of pages) {
    // Skip hub pages - they don't need incoming links from other pages
    const isHub = Object.values(HUB_CONFIG).some((h) => h.path === page.path);
    if (isHub) continue;

    if (!linkedPageIds.has(page.id) && !page.relatedPageIds?.length) {
      orphanPages.push(page.id);
    }
  }

  if (orphanPages.length > 0) {
    warnings.push(`Found ${orphanPages.length} orphan pages with no incoming links`);
  }

  return {
    isValid: brokenLinks.length === 0,
    brokenLinks,
    orphanPages,
    warnings,
  };
}
