/**
 * Centralized SEO Meta Tag Generators
 *
 * Generates all meta tags (title, description, Open Graph, Twitter, canonical)
 * in a consistent, type-safe manner across all pages.
 */

import type { SeoPageConfig, SeoToolType } from './types';
import { BASE_URL, withBaseUrl } from './types';

// =============================================================================
// Meta Tag Types
// =============================================================================

export interface MetaTags {
  title: string;
  description: string;
  canonical: string;
  robots?: string;
  openGraph: OpenGraphTags;
  twitter: TwitterTags;
}

export interface OpenGraphTags {
  title: string;
  description: string;
  url: string;
  type: 'website' | 'article' | 'product';
  image: string;
  imageAlt?: string;
  siteName: string;
  locale?: string;
  // Article-specific
  publishedTime?: string;
  modifiedTime?: string;
  author?: string;
  section?: string;
  tags?: string[];
}

export interface TwitterTags {
  card: 'summary' | 'summary_large_image' | 'app' | 'player';
  site?: string;
  creator?: string;
  title: string;
  description: string;
  image: string;
  imageAlt?: string;
}

// =============================================================================
// Constants
// =============================================================================

const DEFAULT_OG_IMAGE = `${BASE_URL}/landing-page-2025.png`;
const DEFAULT_OG_IMAGE_ALT = 'TrainPace - Free Running Tools';
const TWITTER_SITE = '@trainpace'; // Update when available

// =============================================================================
// Title Optimization
// =============================================================================

const MAX_TITLE_LENGTH = 60;
const MAX_DESCRIPTION_LENGTH = 160;

/**
 * Ensure title is within optimal length for search engines
 * Truncates intelligently at word boundaries
 */
export function optimizeTitle(title: string): string {
  if (title.length <= MAX_TITLE_LENGTH) {
    return title;
  }

  // Remove " | TrainPace" suffix if present and title is too long
  const withoutBrand = title.replace(/ \| TrainPace$/, '');
  if (withoutBrand.length <= MAX_TITLE_LENGTH) {
    return withoutBrand;
  }

  // Truncate at word boundary
  const truncated = withoutBrand.substring(0, MAX_TITLE_LENGTH - 3);
  const lastSpace = truncated.lastIndexOf(' ');
  return lastSpace > 20 ? truncated.substring(0, lastSpace) + '...' : truncated + '...';
}

/**
 * Ensure description is within optimal length
 */
export function optimizeDescription(description: string): string {
  if (description.length <= MAX_DESCRIPTION_LENGTH) {
    return description;
  }

  const truncated = description.substring(0, MAX_DESCRIPTION_LENGTH - 3);
  const lastSpace = truncated.lastIndexOf(' ');
  const lastPeriod = truncated.lastIndexOf('.');

  // Prefer ending at a sentence
  if (lastPeriod > MAX_DESCRIPTION_LENGTH * 0.6) {
    return truncated.substring(0, lastPeriod + 1);
  }

  // Otherwise end at word boundary
  return lastSpace > 50 ? truncated.substring(0, lastSpace) + '...' : truncated + '...';
}

// =============================================================================
// Meta Tag Generators
// =============================================================================

/**
 * Generate complete meta tags for an SEO page
 */
export function generateMetaTags(
  page: SeoPageConfig,
  options: {
    ogImage?: string;
    ogType?: 'website' | 'article' | 'product';
    articleMeta?: {
      publishedTime: string;
      modifiedTime?: string;
      author?: string;
      section?: string;
      tags?: string[];
    };
  } = {}
): MetaTags {
  const url = page.canonicalUrl || withBaseUrl(page.path);
  const title = optimizeTitle(page.title);
  const description = optimizeDescription(page.description);
  const image = options.ogImage || DEFAULT_OG_IMAGE;

  return {
    title: page.title, // Full title for <title> tag
    description,
    canonical: url,
    robots: page.noIndex ? 'noindex, nofollow' : undefined,
    openGraph: {
      title,
      description,
      url,
      type: options.ogType || 'website',
      image,
      imageAlt: DEFAULT_OG_IMAGE_ALT,
      siteName: 'TrainPace',
      locale: 'en_US',
      ...(options.articleMeta && {
        publishedTime: options.articleMeta.publishedTime,
        modifiedTime: options.articleMeta.modifiedTime,
        author: options.articleMeta.author,
        section: options.articleMeta.section,
        tags: options.articleMeta.tags,
      }),
    },
    twitter: {
      card: 'summary_large_image',
      site: TWITTER_SITE,
      title,
      description,
      image,
      imageAlt: DEFAULT_OG_IMAGE_ALT,
    },
  };
}

/**
 * Generate meta tags for tool landing pages (main calculator, fuel, etc.)
 */
export function generateToolMetaTags(tool: SeoToolType): MetaTags {
  const toolMeta: Record<SeoToolType, { title: string; description: string; path: string }> = {
    pace: {
      title: 'Running Pace Calculator - VDOT Training Zones | TrainPace',
      description:
        'Free VDOT running pace calculator. Enter any race time to get Easy, Tempo, Threshold, and Interval training zones. Includes race predictor and pace charts.',
      path: '/calculator',
    },
    fuel: {
      title: 'Marathon Fuel Calculator - Gels & Carbs/Hour | TrainPace',
      description:
        'Calculate how many gels you need for your marathon or half marathon. Get a personalized fueling schedule with carb targets and timing recommendations.',
      path: '/fuel',
    },
    elevation: {
      title: 'GPX Elevation Profile Viewer - Free Route Analysis | TrainPace',
      description:
        'Free GPX elevation profile viewer. Upload any route to see elevation gain, grade percentages, and climb difficulty on an interactive map.',
      path: '/elevationfinder',
    },
    race: {
      title: 'Race Prep Pages - Pacing, Fueling & Strategy | TrainPace',
      description:
        'Race prep pages for popular running events. Plan pacing, fueling, and course strategy with free calculators and GPX elevation analysis.',
      path: '/race',
    },
    blog: {
      title: 'Running Tips & Training Guides | TrainPace Blog',
      description:
        'Expert running tips, training guides, and race strategy articles. Learn about pace zones, marathon fueling, and elevation analysis.',
      path: '/blog',
    },
  };

  const meta = toolMeta[tool];
  const url = withBaseUrl(meta.path);

  return {
    title: meta.title,
    description: meta.description,
    canonical: url,
    openGraph: {
      title: optimizeTitle(meta.title),
      description: optimizeDescription(meta.description),
      url,
      type: 'website',
      image: DEFAULT_OG_IMAGE,
      imageAlt: DEFAULT_OG_IMAGE_ALT,
      siteName: 'TrainPace',
    },
    twitter: {
      card: 'summary_large_image',
      site: TWITTER_SITE,
      title: optimizeTitle(meta.title),
      description: optimizeDescription(meta.description),
      image: DEFAULT_OG_IMAGE,
    },
  };
}

/**
 * Generate meta tags for homepage
 */
export function generateHomepageMetaTags(): MetaTags {
  const title = 'TrainPace - Free Running Pace Calculator & Race Day Tools';
  const description =
    'Free running calculator for training paces, race fueling, and GPX elevation analysis. Get VDOT-based pace zones, plan how many gels to carry, and preview marathon course profiles.';
  const url = BASE_URL;

  return {
    title,
    description,
    canonical: url,
    openGraph: {
      title,
      description,
      url,
      type: 'website',
      image: DEFAULT_OG_IMAGE,
      imageAlt: DEFAULT_OG_IMAGE_ALT,
      siteName: 'TrainPace',
    },
    twitter: {
      card: 'summary_large_image',
      site: TWITTER_SITE,
      title: optimizeTitle(title),
      description: optimizeDescription(description),
      image: DEFAULT_OG_IMAGE,
    },
  };
}

// =============================================================================
// React Helmet Integration
// =============================================================================

/**
 * Generate Helmet-compatible meta tag props
 */
export interface HelmetMetaProps {
  title: string;
  meta: Array<{
    name?: string;
    property?: string;
    content: string;
  }>;
  link: Array<{
    rel: string;
    href: string;
  }>;
}

export function generateHelmetProps(metaTags: MetaTags): HelmetMetaProps {
  const meta: HelmetMetaProps['meta'] = [
    { name: 'description', content: metaTags.description },
    // Open Graph
    { property: 'og:title', content: metaTags.openGraph.title },
    { property: 'og:description', content: metaTags.openGraph.description },
    { property: 'og:url', content: metaTags.openGraph.url },
    { property: 'og:type', content: metaTags.openGraph.type },
    { property: 'og:image', content: metaTags.openGraph.image },
    { property: 'og:site_name', content: metaTags.openGraph.siteName },
    // Twitter
    { name: 'twitter:card', content: metaTags.twitter.card },
    { name: 'twitter:title', content: metaTags.twitter.title },
    { name: 'twitter:description', content: metaTags.twitter.description },
    { name: 'twitter:image', content: metaTags.twitter.image },
  ];

  // Add optional meta tags
  if (metaTags.robots) {
    meta.push({ name: 'robots', content: metaTags.robots });
  }
  if (metaTags.openGraph.imageAlt) {
    meta.push({ property: 'og:image:alt', content: metaTags.openGraph.imageAlt });
  }
  if (metaTags.openGraph.locale) {
    meta.push({ property: 'og:locale', content: metaTags.openGraph.locale });
  }
  if (metaTags.twitter.site) {
    meta.push({ name: 'twitter:site', content: metaTags.twitter.site });
  }
  if (metaTags.twitter.imageAlt) {
    meta.push({ name: 'twitter:image:alt', content: metaTags.twitter.imageAlt });
  }

  // Article meta tags
  if (metaTags.openGraph.publishedTime) {
    meta.push({ property: 'article:published_time', content: metaTags.openGraph.publishedTime });
  }
  if (metaTags.openGraph.modifiedTime) {
    meta.push({ property: 'article:modified_time', content: metaTags.openGraph.modifiedTime });
  }
  if (metaTags.openGraph.author) {
    meta.push({ property: 'article:author', content: metaTags.openGraph.author });
  }
  if (metaTags.openGraph.section) {
    meta.push({ property: 'article:section', content: metaTags.openGraph.section });
  }
  if (metaTags.openGraph.tags) {
    metaTags.openGraph.tags.forEach((tag) => {
      meta.push({ property: 'article:tag', content: tag });
    });
  }

  return {
    title: metaTags.title,
    meta,
    link: [{ rel: 'canonical', href: metaTags.canonical }],
  };
}

// =============================================================================
// Prerender Integration
// =============================================================================

/**
 * Generate meta elements for prerender.jsx
 */
export interface PrerenderMetaElement {
  type: 'meta' | 'link' | 'script';
  props: Record<string, string>;
  children?: string;
}

export function generatePrerenderMetaElements(metaTags: MetaTags): Set<PrerenderMetaElement> {
  const elements = new Set<PrerenderMetaElement>();

  // Meta description
  elements.add({
    type: 'meta',
    props: { name: 'description', content: metaTags.description },
  });

  // Viewport
  elements.add({
    type: 'meta',
    props: { name: 'viewport', content: 'width=device-width, initial-scale=1' },
  });

  // Robots (if specified)
  if (metaTags.robots) {
    elements.add({
      type: 'meta',
      props: { name: 'robots', content: metaTags.robots },
    });
  }

  // Open Graph
  elements.add({
    type: 'meta',
    props: { property: 'og:title', content: metaTags.openGraph.title },
  });
  elements.add({
    type: 'meta',
    props: { property: 'og:description', content: metaTags.openGraph.description },
  });
  elements.add({
    type: 'meta',
    props: { property: 'og:url', content: metaTags.openGraph.url },
  });
  elements.add({
    type: 'meta',
    props: { property: 'og:type', content: metaTags.openGraph.type },
  });
  elements.add({
    type: 'meta',
    props: { property: 'og:image', content: metaTags.openGraph.image },
  });
  elements.add({
    type: 'meta',
    props: { property: 'og:site_name', content: metaTags.openGraph.siteName },
  });

  // Twitter
  elements.add({
    type: 'meta',
    props: { name: 'twitter:card', content: metaTags.twitter.card },
  });
  elements.add({
    type: 'meta',
    props: { name: 'twitter:title', content: metaTags.twitter.title },
  });
  elements.add({
    type: 'meta',
    props: { name: 'twitter:description', content: metaTags.twitter.description },
  });
  elements.add({
    type: 'meta',
    props: { name: 'twitter:image', content: metaTags.twitter.image },
  });

  // Canonical
  elements.add({
    type: 'link',
    props: { rel: 'canonical', href: metaTags.canonical },
  });

  return elements;
}

// =============================================================================
// SEO Validation
// =============================================================================

export interface MetaValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateMetaTags(metaTags: MetaTags): MetaValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Title validation
  if (!metaTags.title) {
    errors.push('Title is required');
  } else if (metaTags.title.length > 70) {
    warnings.push(`Title is ${metaTags.title.length} characters (recommended: <60)`);
  }

  // Description validation
  if (!metaTags.description) {
    errors.push('Description is required');
  } else if (metaTags.description.length > 170) {
    warnings.push(`Description is ${metaTags.description.length} characters (recommended: <160)`);
  } else if (metaTags.description.length < 50) {
    warnings.push(`Description is only ${metaTags.description.length} characters (recommended: >50)`);
  }

  // Canonical validation
  if (!metaTags.canonical) {
    errors.push('Canonical URL is required');
  } else if (!metaTags.canonical.startsWith('https://')) {
    warnings.push('Canonical URL should use HTTPS');
  }

  // Open Graph validation
  if (!metaTags.openGraph.image) {
    warnings.push('OG image is recommended for social sharing');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}
