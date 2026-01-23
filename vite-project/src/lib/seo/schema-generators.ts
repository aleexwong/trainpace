/**
 * Centralized Schema.org JSON-LD Generators
 *
 * Provides type-safe schema generation for all page types.
 * Eliminates duplication across components and ensures consistency.
 */

import type {
  SeoPageConfig,
  SeoFaqItem,
  SeoHowTo,
  BreadcrumbItem,
  SchemaWebPage,
  SchemaBreadcrumbList,
  SchemaFAQPage,
  SchemaHowTo,
  SchemaSportsEvent,
  SchemaArticle,
  SchemaOrganization,
  SchemaWebSite,
  SchemaSoftwareApplication,
  SchemaGraph,
  SchemaJsonLd,
  SeoToolType,
} from './types';
import { BASE_URL, withBaseUrl } from './types';

// =============================================================================
// Organization & Website Schemas (Site-wide)
// =============================================================================

export function generateOrganizationSchema(): SchemaOrganization {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'TrainPace',
    url: BASE_URL,
    logo: `${BASE_URL}/trainpace-logo.png`,
    description:
      'Free running tools for pace calculation, race fueling, and elevation analysis.',
    sameAs: [
      // Add social profiles when available
    ],
  };
}

export function generateWebSiteSchema(): SchemaWebSite {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'TrainPace',
    url: BASE_URL,
    description:
      'Free running pace calculator, marathon fuel planner, and GPX elevation analyzer.',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${BASE_URL}/calculator?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

// =============================================================================
// Page-Level Schemas
// =============================================================================

export function generateWebPageSchema(
  page: SeoPageConfig,
  breadcrumbs?: BreadcrumbItem[]
): SchemaWebPage {
  const schema: SchemaWebPage = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: page.title.replace(' | TrainPace', ''),
    description: page.description,
    url: page.canonicalUrl || withBaseUrl(page.path),
    isPartOf: {
      '@type': 'WebSite',
      name: 'TrainPace',
      url: BASE_URL,
    },
  };

  if (page.datePublished) {
    schema.datePublished = page.datePublished;
  }
  if (page.dateModified) {
    schema.dateModified = page.dateModified;
  }

  return schema;
}

export function generateBreadcrumbSchema(
  items: BreadcrumbItem[]
): SchemaBreadcrumbList {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, idx) => ({
      '@type': 'ListItem' as const,
      position: idx + 1,
      name: item.name,
      item: item.url.startsWith('http') ? item.url : withBaseUrl(item.url),
    })),
  };
}

export function generateFAQSchema(faqItems: SeoFaqItem[]): SchemaFAQPage {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqItems.map((faq) => ({
      '@type': 'Question' as const,
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer' as const,
        text: faq.answer,
      },
    })),
  };
}

export function generateHowToSchema(
  howTo: SeoHowTo,
  toolName = 'TrainPace'
): SchemaHowTo {
  return {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: howTo.name,
    description: howTo.description,
    totalTime: howTo.totalTime || 'PT2M',
    tool: {
      '@type': 'HowToTool',
      name: howTo.tool || toolName,
    },
    step: howTo.steps.map((step, idx) => ({
      '@type': 'HowToStep' as const,
      position: idx + 1,
      name: step.name,
      text: step.text,
      ...(step.url && { url: step.url }),
      ...(step.image && { image: step.image }),
    })),
  };
}

// =============================================================================
// Sports Event Schema (for Race Pages)
// =============================================================================

export interface RaceEventData {
  name: string;
  description?: string;
  city: string;
  country: string;
  raceDate?: string;
  website?: string;
  organizer?: string;
}

export function generateSportsEventSchema(
  race: RaceEventData
): SchemaSportsEvent {
  return {
    '@context': 'https://schema.org',
    '@type': 'SportsEvent',
    name: race.name,
    description: race.description,
    url: race.website,
    startDate: race.raceDate,
    sport: 'Running',
    location: {
      '@type': 'Place',
      name: `${race.city}, ${race.country}`,
      address: {
        '@type': 'PostalAddress',
        addressLocality: race.city,
        addressCountry: race.country,
      },
    },
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    ...(race.organizer && {
      organizer: {
        '@type': 'Organization',
        name: race.organizer,
        url: race.website,
      },
    }),
  };
}

// =============================================================================
// Article/Blog Schema
// =============================================================================

export interface ArticleData {
  headline: string;
  description?: string;
  url: string;
  datePublished: string;
  dateModified?: string;
  authorName: string;
  authorUrl?: string;
  image?: string;
}

export function generateArticleSchema(
  article: ArticleData,
  type: 'Article' | 'BlogPosting' = 'BlogPosting'
): SchemaArticle {
  return {
    '@context': 'https://schema.org',
    '@type': type,
    headline: article.headline,
    description: article.description,
    url: article.url.startsWith('http') ? article.url : withBaseUrl(article.url),
    datePublished: article.datePublished,
    dateModified: article.dateModified || article.datePublished,
    author: {
      '@type': 'Person',
      name: article.authorName,
      ...(article.authorUrl && { url: article.authorUrl }),
    },
    publisher: {
      '@type': 'Organization',
      name: 'TrainPace',
      url: BASE_URL,
      logo: {
        '@type': 'ImageObject',
        url: `${BASE_URL}/trainpace-logo.png`,
      },
    },
    ...(article.image && { image: article.image }),
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': article.url.startsWith('http') ? article.url : withBaseUrl(article.url),
    },
  };
}

// =============================================================================
// Software Application Schema
// =============================================================================

export function generateSoftwareApplicationSchema(
  tool: SeoToolType
): SchemaSoftwareApplication {
  const toolData: Record<
    SeoToolType,
    { name: string; description: string; url: string }
  > = {
    pace: {
      name: 'TrainPace Running Pace Calculator',
      description:
        'Free VDOT running pace calculator. Convert race times to training paces.',
      url: `${BASE_URL}/calculator`,
    },
    fuel: {
      name: 'TrainPace Marathon Fuel Planner',
      description:
        'Calculate gels needed and build a fueling schedule for marathons.',
      url: `${BASE_URL}/fuel`,
    },
    elevation: {
      name: 'TrainPace GPX Elevation Analyzer',
      description:
        'Upload GPX files to analyze elevation gain, grades, and route difficulty.',
      url: `${BASE_URL}/elevationfinder`,
    },
    race: {
      name: 'TrainPace Race Prep Tools',
      description:
        'Plan pacing, fueling, and course strategy for any running race.',
      url: `${BASE_URL}/race`,
    },
    blog: {
      name: 'TrainPace Running Blog',
      description:
        'Expert running tips, training guides, and race strategy articles.',
      url: `${BASE_URL}/blog`,
    },
  };

  const data = toolData[tool];

  return {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: data.name,
    description: data.description,
    url: data.url,
    applicationCategory: 'HealthApplication',
    operatingSystem: 'Any',
    browserRequirements: 'Requires JavaScript',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
  };
}

// =============================================================================
// Breadcrumb Generators by Tool Type
// =============================================================================

const TOOL_BREADCRUMB_CONFIG: Record<
  SeoToolType,
  { name: string; path: string }
> = {
  pace: { name: 'Pace Calculator', path: '/calculator' },
  fuel: { name: 'Fuel Planner', path: '/fuel' },
  elevation: { name: 'Elevation Finder', path: '/elevationfinder' },
  race: { name: 'Race Prep', path: '/race' },
  blog: { name: 'Blog', path: '/blog' },
};

export function generateBreadcrumbsForPage(
  page: SeoPageConfig
): BreadcrumbItem[] {
  const breadcrumbs: BreadcrumbItem[] = [
    { name: 'TrainPace', url: '/' },
  ];

  const toolConfig = TOOL_BREADCRUMB_CONFIG[page.tool];
  if (toolConfig) {
    breadcrumbs.push({
      name: toolConfig.name,
      url: toolConfig.path,
    });
  }

  // Add intermediate breadcrumb for guides
  if (page.path.includes('/guides/')) {
    breadcrumbs.push({
      name: 'Guides',
      url: `${toolConfig.path}/guides`,
    });
  }

  // Add current page
  breadcrumbs.push({
    name: page.h1,
    url: page.path,
  });

  return breadcrumbs;
}

// =============================================================================
// Complete Schema Graph Generator
// =============================================================================

export interface SchemaGeneratorOptions {
  includeOrganization?: boolean;
  includeWebSite?: boolean;
  includeSoftwareApplication?: boolean;
  raceData?: RaceEventData;
  articleData?: ArticleData;
}

export function generateSchemaGraph(
  page: SeoPageConfig,
  options: SchemaGeneratorOptions = {}
): SchemaGraph {
  const schemas: SchemaJsonLd[] = [];

  // Add organization schema (typically only on homepage)
  if (options.includeOrganization) {
    schemas.push(generateOrganizationSchema());
  }

  // Add website schema (typically only on homepage)
  if (options.includeWebSite) {
    schemas.push(generateWebSiteSchema());
  }

  // Generate breadcrumbs
  const breadcrumbs = generateBreadcrumbsForPage(page);
  schemas.push(generateBreadcrumbSchema(breadcrumbs));

  // Add WebPage schema
  schemas.push(generateWebPageSchema(page, breadcrumbs));

  // Add FAQ schema if page has FAQs
  if (page.faq && page.faq.length > 0) {
    schemas.push(generateFAQSchema(page.faq));
  }

  // Add HowTo schema if page has how-to content
  if (page.howTo) {
    const toolName =
      page.tool === 'pace'
        ? 'TrainPace Pace Calculator'
        : page.tool === 'fuel'
          ? 'TrainPace Fuel Planner'
          : page.tool === 'elevation'
            ? 'TrainPace Elevation Finder'
            : 'TrainPace';
    schemas.push(generateHowToSchema(page.howTo, toolName));
  }

  // Add SportsEvent schema for race pages
  if (options.raceData) {
    schemas.push(generateSportsEventSchema(options.raceData));
  }

  // Add Article schema for blog posts
  if (options.articleData) {
    schemas.push(generateArticleSchema(options.articleData));
  }

  // Add SoftwareApplication schema if requested
  if (options.includeSoftwareApplication) {
    schemas.push(generateSoftwareApplicationSchema(page.tool));
  }

  return {
    '@context': 'https://schema.org',
    '@graph': schemas,
  };
}

// =============================================================================
// Schema Validation
// =============================================================================

export interface SchemaValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateSchema(schema: SchemaJsonLd): SchemaValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check for required @context
  if (!('@context' in schema) || schema['@context'] !== 'https://schema.org') {
    errors.push('Missing or invalid @context property');
  }

  // Check for required @type
  if (!('@type' in schema) || !schema['@type']) {
    errors.push('Missing @type property');
  }

  // Type-specific validation
  if ('@type' in schema) {
    switch (schema['@type']) {
      case 'FAQPage':
        if (
          !('mainEntity' in schema) ||
          !Array.isArray((schema as SchemaFAQPage).mainEntity) ||
          (schema as SchemaFAQPage).mainEntity.length === 0
        ) {
          errors.push('FAQPage must have at least one FAQ item');
        }
        break;
      case 'HowTo':
        if (
          !('step' in schema) ||
          !Array.isArray((schema as SchemaHowTo).step) ||
          (schema as SchemaHowTo).step.length === 0
        ) {
          errors.push('HowTo must have at least one step');
        }
        break;
      case 'BreadcrumbList':
        if (
          !('itemListElement' in schema) ||
          !Array.isArray((schema as SchemaBreadcrumbList).itemListElement)
        ) {
          errors.push('BreadcrumbList must have itemListElement array');
        }
        break;
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

export function validateSchemaGraph(graph: SchemaGraph): SchemaValidationResult {
  const allErrors: string[] = [];
  const allWarnings: string[] = [];

  if (!graph['@graph'] || !Array.isArray(graph['@graph'])) {
    return {
      isValid: false,
      errors: ['Schema graph must have @graph array'],
      warnings: [],
    };
  }

  for (const schema of graph['@graph']) {
    const result = validateSchema(schema);
    allErrors.push(...result.errors);
    allWarnings.push(...result.warnings);
  }

  return {
    isValid: allErrors.length === 0,
    errors: allErrors,
    warnings: allWarnings,
  };
}
