/**
 * Content Variation System
 *
 * Generates unique, intent-matched content at scale using:
 * - Template interpolation with variables
 * - Content variations to avoid duplication
 * - Dynamic FAQ and HowTo generation
 * - Keyword cannibalization prevention
 */

import type {
  SeoPageConfig,
  SeoFaqItem,
  SeoHowTo,
  ContentVariables,
  ContentTemplate,
  SeoToolType,
  SeoCta,
} from './types';
import { generatePageId } from './types';

// =============================================================================
// Template Interpolation
// =============================================================================

/**
 * Interpolate variables into a template string
 * Supports {{variableName}} syntax
 */
export function interpolate(
  template: string,
  variables: ContentVariables
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    if (key in variables) {
      const value = variables[key as keyof ContentVariables];
      return String(value ?? match);
    }
    if (variables.custom && key in variables.custom) {
      return String(variables.custom[key]);
    }
    return match; // Keep original if no variable found
  });
}

/**
 * Interpolate an entire content template
 */
export function interpolateTemplate(
  template: ContentTemplate,
  variables: ContentVariables
): ContentTemplate {
  return {
    title: interpolate(template.title, variables),
    description: interpolate(template.description, variables),
    h1: interpolate(template.h1, variables),
    intro: interpolate(template.intro, variables),
    bullets: template.bullets.map((b) => interpolate(b, variables)),
  };
}

// =============================================================================
// Content Variation Templates
// =============================================================================

/**
 * Title variations to avoid duplicate titles
 * Each variation targets slightly different search intent
 */
export const TITLE_VARIATIONS = {
  calculator: [
    '{{name}} Calculator - Training Paces + Pace Chart | TrainPace',
    '{{name}} Pace Calculator - VDOT Training Zones | TrainPace',
    'Free {{name}} Calculator - Easy to Interval Paces | TrainPace',
    '{{name}} Training Pace Calculator (Free) | TrainPace',
  ],
  fuel: [
    '{{name}} Fueling Plan - Gels, Carbs & Timing | TrainPace',
    '{{name}} Fuel Calculator - How Many Gels? | TrainPace',
    'Free {{name}} Fueling Guide - Carbs/Hour | TrainPace',
    '{{name}} Nutrition Plan - Gel Schedule | TrainPace',
  ],
  race: [
    '{{name}} - Pace, Fueling & Course Strategy | TrainPace',
    '{{name}} Race Prep - Training Paces & Tips | TrainPace',
    '{{name}} Guide - Pacing, Fueling, Elevation | TrainPace',
    'Prepare for {{name}} - Free Race Tools | TrainPace',
  ],
  elevation: [
    '{{name}} - Elevation Profile & Route Analysis | TrainPace',
    '{{name}} - Free GPX Analyzer | TrainPace',
    '{{name}} - Hills, Grades & Climb Stats | TrainPace',
    '{{name}} Guide - Elevation Analysis | TrainPace',
  ],
};

/**
 * Description variations
 */
export const DESCRIPTION_VARIATIONS = {
  calculator: [
    'Free {{name}} pace calculator. Enter your {{distance}} time to get VDOT-based Easy, Tempo, Threshold, and Interval training paces.',
    'Calculate your {{name}} training paces. Convert your race time into Easy, Tempo, Threshold, and Interval zones using VDOT methodology.',
    '{{name}} calculator for runners. Use your {{distance}} time to generate personalized training paces for all your workouts.',
  ],
  fuel: [
    'Build your {{name}} fueling plan. Calculate carbs per hour, gel count, and timing schedule to avoid hitting the wall.',
    '{{name}} nutrition guide. Estimate how many gels you need and when to take them for optimal race-day fueling.',
    'Free {{name}} fuel calculator. Get a personalized carb target and gel schedule based on your finish time.',
  ],
  race: [
    '{{name}} race prep: set training paces, build a fueling plan, and analyze the course elevation. Free tools for self-coached runners.',
    'Prepare for {{name}} with TrainPace. Get pacing targets, fueling guidance, and course strategy in one place.',
    '{{name}} preparation guide. Use free calculators for pacing, nutrition, and elevation analysis.',
  ],
};

/**
 * Select a variation based on page slug (deterministic to ensure consistency)
 */
function selectVariation<T>(variations: T[], slug: string): T {
  // Use string hash to select variation deterministically
  let hash = 0;
  for (let i = 0; i < slug.length; i++) {
    hash = (hash << 5) - hash + slug.charCodeAt(i);
    hash = hash & hash; // Convert to 32-bit integer
  }
  const index = Math.abs(hash) % variations.length;
  return variations[index];
}

// =============================================================================
// Dynamic Content Generators
// =============================================================================

/**
 * Generate page config from a distance-based template
 */
export function generateDistancePageConfig(
  distance: {
    name: string;
    slug: string;
    km: number;
    displayDistance: string;
  },
  tool: SeoToolType
): SeoPageConfig {
  const variables: ContentVariables = {
    slug: distance.slug,
    name: distance.name,
    displayName: distance.name,
    distance: distance.displayDistance,
    distanceKm: distance.km,
    distanceMiles: distance.km / 1.60934,
  };

  // Select variations
  const titleTemplate = selectVariation(
    TITLE_VARIATIONS[tool as keyof typeof TITLE_VARIATIONS] || TITLE_VARIATIONS.calculator,
    distance.slug
  );
  const descTemplate = selectVariation(
    DESCRIPTION_VARIATIONS[tool as keyof typeof DESCRIPTION_VARIATIONS] || DESCRIPTION_VARIATIONS.calculator,
    distance.slug
  );

  const path = tool === 'pace'
    ? `/calculator/${distance.slug}-pace-calculator`
    : tool === 'fuel'
      ? `/fuel/${distance.slug}-fueling-plan`
      : `/${tool}/${distance.slug}`;

  return {
    id: generatePageId(tool, distance.slug),
    slug: distance.slug,
    path,
    tool,
    title: interpolate(titleTemplate, variables),
    description: interpolate(descTemplate, variables),
    h1: `${distance.name} ${tool === 'pace' ? 'Pace Calculator' : 'Fueling Plan'}`,
    intro: generateIntro(tool, variables),
    bullets: generateBullets(tool, variables),
    cta: generateCta(tool),
    initialInputs: { distance: String(distance.km) },
    variables,
    faq: generateFaqs(tool, variables),
    howTo: generateHowTo(tool, variables),
  };
}

/**
 * Generate intro paragraph with variation
 */
function generateIntro(tool: SeoToolType, variables: ContentVariables): string {
  const intros: Record<SeoToolType, string[]> = {
    pace: [
      `Use a recent {{name}} result to generate science-backed training paces for easy runs, tempo efforts, thresholds, and intervals.`,
      `Your {{name}} time is a great predictor of fitness. Convert it into training paces you can use for every workout.`,
      `Enter your {{name}} finish time to get personalized training zones based on VDOT methodology.`,
    ],
    fuel: [
      `Calculate how many gels you need for your {{name}} and build a simple timing schedule to stay fueled.`,
      `Use your {{name}} goal time to estimate carbs per hour, gel count, and race-day timing.`,
      `Build a {{name}} fueling plan that keeps energy steady and helps you avoid hitting the wall.`,
    ],
    race: [
      `Use TrainPace to plan a simple, repeatable strategy for {{name}}: pacing targets, fueling basics, and course awareness.`,
      `Prepare for {{name}} with free tools for pacing, fueling, and elevation analysis.`,
    ],
    elevation: [
      `Analyze the elevation profile and grades for {{name}} to plan your pacing strategy.`,
      `Upload a GPX to see elevation gain, grades, and key climbs for {{name}}.`,
    ],
    blog: [
      `Learn more about {{name}} with expert tips and training guidance.`,
    ],
  };

  const intro = selectVariation(intros[tool], variables.slug);
  return interpolate(intro, variables);
}

/**
 * Generate bullet points with variation
 */
function generateBullets(tool: SeoToolType, variables: ContentVariables): string[] {
  const bullets: Record<SeoToolType, string[][]> = {
    pace: [
      [
        'VDOT-style training zones from your {{name}} time',
        'Easy, Tempo, Threshold, Interval, Long Run paces',
        'Works in min/km or min/mile',
      ],
      [
        'Personalized training paces from your {{name}}',
        'Easy pace for recovery, Tempo for threshold development',
        'Interval targets for speed work',
      ],
      [
        'Convert {{name}} time to training zones',
        'Get Easy, Tempo, Threshold, and Interval paces',
        'Print or save your pace chart',
      ],
    ],
    fuel: [
      [
        'Carbs/hour target + total carbs for {{name}}',
        'Gel count estimate based on your finish time',
        'Simple race-day timing guidance',
      ],
      [
        'Calculate gels needed for your {{name}}',
        'Build a timing schedule that works',
        'Adjust for your products and preferences',
      ],
    ],
    race: [
      [
        'Pace calculator: training zones + race pace',
        'Fuel planner: carbs/hour + gel timing',
        'Elevation analysis: hills, grades, and difficulty',
      ],
    ],
    elevation: [
      [
        'Interactive elevation profile and map',
        'Total gain/loss and grade breakdown',
        'Identify key climbs and descents',
      ],
    ],
    blog: [
      [
        'Expert training tips',
        'Science-backed advice',
        'Practical race-day strategies',
      ],
    ],
  };

  const bulletSet = selectVariation(bullets[tool], variables.slug);
  return bulletSet.map((b) => interpolate(b, variables));
}

/**
 * Generate CTA based on tool type
 */
function generateCta(tool: SeoToolType): SeoCta {
  const ctas: Record<SeoToolType, SeoCta> = {
    pace: { href: '/calculator', label: 'Open the Pace Calculator' },
    fuel: { href: '/fuel', label: 'Open the Fuel Planner' },
    race: { href: '/calculator', label: 'Start With Pacing' },
    elevation: { href: '/elevationfinder', label: 'Open Elevation Finder' },
    blog: { href: '/blog', label: 'Read More Articles' },
  };
  return ctas[tool];
}

// =============================================================================
// FAQ Generation
// =============================================================================

/**
 * FAQ templates by topic
 */
const FAQ_TEMPLATES: Record<string, SeoFaqItem[]> = {
  pace_general: [
    {
      question: 'How often should I update my training paces?',
      answer: 'Update your training paces after any meaningful PR or when fitness changes significantly - typically every 4-8 weeks during a training block.',
    },
    {
      question: 'Should easy pace feel slow?',
      answer: 'Yes. Easy pace should feel conversational and relaxed. It builds aerobic fitness and allows recovery so you can hit your harder workouts.',
    },
    {
      question: 'What if I can\'t hit my tempo pace?',
      answer: 'If tempo pace feels impossible, your training paces may be based on an outdated race result. Re-calculate using a recent effort, or adjust training to build fitness.',
    },
  ],
  pace_5k: [
    {
      question: 'What is a good 5K pace?',
      answer: 'A "good" 5K pace depends on experience and age. The useful thing is consistency: use your current 5K time to set training paces you can repeat week after week.',
    },
    {
      question: 'How do I pace a 5K race?',
      answer: 'Start controlled (not too fast), settle into your goal pace by kilometer 1, and save energy for a strong finish. Negative splits are ideal but not required.',
    },
  ],
  pace_marathon: [
    {
      question: 'How do I pace a marathon evenly?',
      answer: 'Start slightly conservative, settle into goal effort, and avoid surges early. If the course is hilly, adjust effort (not pace) on climbs.',
    },
    {
      question: 'Can a shorter race predict marathon pace?',
      answer: 'Yes. 10K and half marathon times are useful predictors, especially when combined with consistent long-run training.',
    },
  ],
  fuel_general: [
    {
      question: 'How many carbs per hour should I target?',
      answer: 'Most runners do well with 60-90g/hour. Start lower and increase gradually based on gut tolerance. Practice in training.',
    },
    {
      question: 'When should I take my first gel?',
      answer: 'Many runners start early (around 20-30 minutes) to stay ahead of energy needs, then follow a steady schedule.',
    },
  ],
  fuel_marathon: [
    {
      question: 'How many gels for a marathon?',
      answer: 'It depends on your finish time and carb target. A 4-hour marathon at 60g/hour needs about 240g total carbs - roughly 8-10 standard gels.',
    },
    {
      question: 'Is the wall only about fueling?',
      answer: 'No. Pacing and conditioning matter a lot. But fueling is the most controllable lever on race day.',
    },
  ],
};

/**
 * Generate FAQs for a page based on tool and content
 */
export function generateFaqs(
  tool: SeoToolType,
  variables: ContentVariables,
  maxItems = 3
): SeoFaqItem[] {
  const faqs: SeoFaqItem[] = [];

  // Add tool-specific general FAQs
  const generalKey = `${tool}_general`;
  if (FAQ_TEMPLATES[generalKey]) {
    faqs.push(...FAQ_TEMPLATES[generalKey].slice(0, 2));
  }

  // Add distance-specific FAQs
  if (variables.distanceKm) {
    if (variables.distanceKm <= 5) {
      faqs.push(...(FAQ_TEMPLATES['pace_5k'] || []).slice(0, 1));
    } else if (variables.distanceKm >= 42) {
      if (tool === 'pace') {
        faqs.push(...(FAQ_TEMPLATES['pace_marathon'] || []).slice(0, 1));
      } else if (tool === 'fuel') {
        faqs.push(...(FAQ_TEMPLATES['fuel_marathon'] || []).slice(0, 1));
      }
    }
  }

  // Interpolate variables into FAQ answers
  return faqs.slice(0, maxItems).map((faq) => ({
    question: interpolate(faq.question, variables),
    answer: interpolate(faq.answer, variables),
  }));
}

// =============================================================================
// HowTo Generation
// =============================================================================

/**
 * HowTo templates by tool type
 */
const HOWTO_TEMPLATES: Record<SeoToolType, SeoHowTo> = {
  pace: {
    name: 'How to calculate your {{name}} training paces',
    description: 'Enter your {{name}} distance and finish time to get personalized training zones.',
    totalTime: 'PT1M',
    tool: 'TrainPace Pace Calculator',
    steps: [
      { name: 'Enter {{name}} distance', text: 'Set the distance to {{distance}}.' },
      { name: 'Enter your finish time', text: 'Type your most recent {{name}} time (HH:MM:SS).' },
      { name: 'Calculate training zones', text: 'Generate Easy, Tempo, Threshold, and Interval paces.' },
    ],
  },
  fuel: {
    name: 'How to build your {{name}} fueling plan',
    description: 'Enter your {{name}} finish time and preferences to get a gel count and schedule.',
    totalTime: 'PT2M',
    tool: 'TrainPace Fuel Planner',
    steps: [
      { name: 'Enter finish time', text: 'Use your realistic goal time for the {{name}}.' },
      { name: 'Set carb target', text: 'Choose a carbs/hour target (60-90g/hr recommended).' },
      { name: 'Generate the plan', text: 'Get gel count, timing schedule, and total carbs needed.' },
    ],
  },
  race: {
    name: 'How to prepare for {{name}}',
    description: 'Plan pacing, fueling, and course strategy for {{name}}.',
    totalTime: 'PT5M',
    tool: 'TrainPace',
    steps: [
      { name: 'Pick a realistic goal time', text: 'Use a recent race result or time trial.' },
      { name: 'Set training paces', text: 'Calculate easy, tempo, threshold, and interval paces.' },
      { name: 'Build a fueling plan', text: 'Estimate carbs/hour and gel timing.' },
      { name: 'Review course elevation', text: 'Upload a GPX to spot key climbs and plan pacing.' },
    ],
  },
  elevation: {
    name: 'How to analyze {{name}} elevation',
    description: 'Upload a GPX file to see elevation profile, grades, and key climbs.',
    totalTime: 'PT2M',
    tool: 'TrainPace Elevation Finder',
    steps: [
      { name: 'Export GPX', text: 'Download your GPX from Strava, Garmin, or your device.' },
      { name: 'Upload file', text: 'Drop the GPX into Elevation Finder.' },
      { name: 'Review climbs', text: 'Use the profile to spot key hills and plan pacing.' },
    ],
  },
  blog: {
    name: 'How to use this guide',
    description: 'Learn the key concepts and apply them to your training.',
    steps: [
      { name: 'Read the guide', text: 'Understand the main concepts.' },
      { name: 'Apply to training', text: 'Use the tips in your next workout or race.' },
    ],
  },
};

/**
 * Generate HowTo schema content
 */
export function generateHowTo(
  tool: SeoToolType,
  variables: ContentVariables
): SeoHowTo {
  const template = HOWTO_TEMPLATES[tool];
  return {
    name: interpolate(template.name, variables),
    description: interpolate(template.description, variables),
    totalTime: template.totalTime,
    tool: template.tool,
    steps: template.steps.map((step) => ({
      name: interpolate(step.name, variables),
      text: interpolate(step.text, variables),
    })),
  };
}

// =============================================================================
// Race Page Generation
// =============================================================================

export interface RaceData {
  name: string;
  slug: string;
  city?: string;
  country?: string;
  raceDate?: string;
  distance?: 'marathon' | 'half' | '10k' | '5k';
  previewRouteKey?: string;
}

/**
 * Generate a complete race page configuration
 */
export function generateRacePageConfig(race: RaceData): SeoPageConfig {
  const variables: ContentVariables = {
    slug: race.slug,
    name: race.name,
    displayName: race.name,
    city: race.city,
    country: race.country,
    eventName: race.name,
    eventDate: race.raceDate,
    raceType: race.distance || 'marathon',
  };

  const titleTemplate = selectVariation(TITLE_VARIATIONS.race, race.slug);
  const descTemplate = selectVariation(DESCRIPTION_VARIATIONS.race, race.slug);

  return {
    id: generatePageId('race', race.slug),
    slug: race.slug,
    path: `/race/${race.slug}`,
    tool: 'race',
    title: interpolate(titleTemplate, variables),
    description: interpolate(descTemplate, variables),
    h1: `${race.name} Race Prep`,
    intro: generateIntro('race', variables),
    bullets: generateBullets('race', variables),
    cta: { href: '/calculator', label: 'Start With Pacing' },
    previewRouteKey: race.previewRouteKey,
    variables,
    howTo: generateHowTo('race', variables),
  };
}

// =============================================================================
// Content Uniqueness Validation
// =============================================================================

export interface ContentUniquenessResult {
  isUnique: boolean;
  duplicates: Array<{
    field: 'title' | 'description' | 'h1';
    pageIds: string[];
  }>;
  similarContent: Array<{
    pageId1: string;
    pageId2: string;
    similarity: number;
  }>;
}

/**
 * Calculate similarity between two strings (Jaccard similarity of words)
 */
function calculateSimilarity(str1: string, str2: string): number {
  const words1 = new Set(str1.toLowerCase().split(/\s+/));
  const words2 = new Set(str2.toLowerCase().split(/\s+/));
  const intersection = new Set([...words1].filter((w) => words2.has(w)));
  const union = new Set([...words1, ...words2]);
  return intersection.size / union.size;
}

/**
 * Check content uniqueness across all pages
 */
export function validateContentUniqueness(
  pages: SeoPageConfig[],
  similarityThreshold = 0.8
): ContentUniquenessResult {
  const duplicates: ContentUniquenessResult['duplicates'] = [];
  const similarContent: ContentUniquenessResult['similarContent'] = [];

  // Check for duplicate titles
  const titleMap = new Map<string, string[]>();
  for (const page of pages) {
    const title = page.title.toLowerCase();
    if (!titleMap.has(title)) {
      titleMap.set(title, []);
    }
    titleMap.get(title)!.push(page.id);
  }
  for (const [, pageIds] of titleMap) {
    if (pageIds.length > 1) {
      duplicates.push({ field: 'title', pageIds });
    }
  }

  // Check for duplicate descriptions
  const descMap = new Map<string, string[]>();
  for (const page of pages) {
    const desc = page.description.toLowerCase();
    if (!descMap.has(desc)) {
      descMap.set(desc, []);
    }
    descMap.get(desc)!.push(page.id);
  }
  for (const [, pageIds] of descMap) {
    if (pageIds.length > 1) {
      duplicates.push({ field: 'description', pageIds });
    }
  }

  // Check for similar content (comparing intro paragraphs)
  for (let i = 0; i < pages.length; i++) {
    for (let j = i + 1; j < pages.length; j++) {
      const similarity = calculateSimilarity(pages[i].intro, pages[j].intro);
      if (similarity >= similarityThreshold) {
        similarContent.push({
          pageId1: pages[i].id,
          pageId2: pages[j].id,
          similarity,
        });
      }
    }
  }

  return {
    isUnique: duplicates.length === 0 && similarContent.length === 0,
    duplicates,
    similarContent,
  };
}

// =============================================================================
// Keyword Cannibalization Detection
// =============================================================================

export interface CannibalizationResult {
  hasIssues: boolean;
  conflicts: Array<{
    keyword: string;
    pageIds: string[];
    suggestion: string;
  }>;
}

/**
 * Extract primary keywords from title and H1
 */
function extractPrimaryKeywords(page: SeoPageConfig): string[] {
  const combined = `${page.title} ${page.h1}`.toLowerCase();
  // Extract key phrases (2-3 word combinations)
  const words = combined.split(/[^a-z0-9]+/).filter((w) => w.length > 2);
  const keywords: string[] = [];

  for (let i = 0; i < words.length - 1; i++) {
    keywords.push(`${words[i]} ${words[i + 1]}`);
    if (i < words.length - 2) {
      keywords.push(`${words[i]} ${words[i + 1]} ${words[i + 2]}`);
    }
  }

  return keywords;
}

/**
 * Detect keyword cannibalization across pages
 */
export function detectCannibalization(
  pages: SeoPageConfig[]
): CannibalizationResult {
  const keywordMap = new Map<string, string[]>();

  for (const page of pages) {
    const keywords = extractPrimaryKeywords(page);
    for (const kw of keywords) {
      if (!keywordMap.has(kw)) {
        keywordMap.set(kw, []);
      }
      keywordMap.get(kw)!.push(page.id);
    }
  }

  const conflicts: CannibalizationResult['conflicts'] = [];

  for (const [keyword, pageIds] of keywordMap) {
    // Ignore common words and phrases
    if (['pace calculator', 'training paces', 'trainpace'].includes(keyword)) {
      continue;
    }

    // Flag keywords appearing in multiple pages
    if (pageIds.length > 1 && keyword.split(' ').length >= 2) {
      conflicts.push({
        keyword,
        pageIds,
        suggestion: `Consider differentiating titles/H1s for pages targeting "${keyword}"`,
      });
    }
  }

  return {
    hasIssues: conflicts.length > 0,
    conflicts: conflicts.slice(0, 20), // Limit to top 20 issues
  };
}
