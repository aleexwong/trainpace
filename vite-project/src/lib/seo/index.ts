/**
 * Scalable SEO Module
 *
 * Central export for all SEO utilities designed to handle 100,000+ pages.
 *
 * Architecture Overview:
 * - types.ts: Type definitions for all SEO data structures
 * - schema-generators.ts: JSON-LD schema generation utilities
 * - meta-generators.ts: Meta tag generation (title, description, OG, Twitter)
 * - internal-linking.ts: Hub-spoke architecture and related page engine
 * - content-generators.ts: Content variation system for unique content at scale
 *
 * Usage Example:
 * ```tsx
 * import {
 *   generateSchemaGraph,
 *   generateMetaTags,
 *   generateLinkingContext,
 *   type SeoPageConfig
 * } from '@/lib/seo';
 *
 * const page: SeoPageConfig = { ... };
 * const schemas = generateSchemaGraph(page);
 * const meta = generateMetaTags(page);
 * const links = generateLinkingContext(page, allPages);
 * ```
 */

// =============================================================================
// Type Exports
// =============================================================================

export type {
  // Core types
  SeoToolType,
  SchemaType,
  SeoFaqItem,
  SeoHowToStep,
  SeoHowTo,
  SeoCta,
  SeoPageConfig,
  SeoHubConfig,

  // Content variation
  ContentVariables,
  ContentTemplate,

  // Internal linking
  InternalLink,
  BreadcrumbItem,
  LinkingContext,

  // Schema types
  SchemaWebPage,
  SchemaBreadcrumbList,
  SchemaFAQPage,
  SchemaHowTo,
  SchemaSportsEvent,
  SchemaArticle,
  SchemaOrganization,
  SchemaWebSite,
  SchemaSoftwareApplication,
  SchemaJsonLd,
  SchemaGraph,

  // Data source types
  PaginationInfo,
  DataSourceManifest,

  // Validation types
  SeoValidationResult,
  SeoValidationError,
  SeoValidationWarning,
} from './types';

// Utility exports from types
export { BASE_URL, withBaseUrl, normalizeSlug, generatePageId } from './types';

// =============================================================================
// Schema Generator Exports
// =============================================================================

export {
  // Site-wide schemas
  generateOrganizationSchema,
  generateWebSiteSchema,

  // Page-level schemas
  generateWebPageSchema,
  generateBreadcrumbSchema,
  generateFAQSchema,
  generateHowToSchema,
  generateSportsEventSchema,
  generateArticleSchema,
  generateSoftwareApplicationSchema,

  // Breadcrumb generation
  generateBreadcrumbsForPage,

  // Complete graph generation
  generateSchemaGraph,

  // Validation
  validateSchema,
  validateSchemaGraph,

  // Types for options
  type SchemaGeneratorOptions,
  type RaceEventData,
  type ArticleData,
  type SchemaValidationResult,
} from './schema-generators';

// =============================================================================
// Meta Generator Exports
// =============================================================================

export {
  // Meta tag generation
  generateMetaTags,
  generateToolMetaTags,
  generateHomepageMetaTags,

  // Title/description optimization
  optimizeTitle,
  optimizeDescription,

  // Helmet integration
  generateHelmetProps,

  // Prerender integration
  generatePrerenderMetaElements,

  // Validation
  validateMetaTags,

  // Types
  type MetaTags,
  type OpenGraphTags,
  type TwitterTags,
  type HelmetMetaProps,
  type PrerenderMetaElement,
  type MetaValidationResult,
} from './meta-generators';

// =============================================================================
// Internal Linking Exports
// =============================================================================

export {
  // Hub configuration
  HUB_CONFIG,

  // Breadcrumb generation
  generateBreadcrumbs,

  // Related page finding
  findRelatedPages,
  generateCrossToolLinks,

  // Hub-spoke helpers
  getHubForPage,
  getSiblingPages,

  // Complete linking context
  generateLinkingContext,

  // Sitemap helpers
  calculateSitemapPriority,

  // Validation
  validateInternalLinks,

  // Types
  type LinkValidationResult,
} from './internal-linking';

// =============================================================================
// Content Generator Exports
// =============================================================================

export {
  // Template interpolation
  interpolate,
  interpolateTemplate,

  // Page config generation
  generateDistancePageConfig,
  generateRacePageConfig,

  // Content generation
  generateFaqs,
  generateHowTo,

  // Content variations
  TITLE_VARIATIONS,
  DESCRIPTION_VARIATIONS,

  // Validation
  validateContentUniqueness,
  detectCannibalization,

  // Types
  type RaceData,
  type ContentUniquenessResult,
  type CannibalizationResult,
} from './content-generators';

// =============================================================================
// Combined Utilities
// =============================================================================

import type { SeoPageConfig } from './types';
import { generateSchemaGraph, type SchemaGeneratorOptions } from './schema-generators';
import { generateMetaTags, generateHelmetProps } from './meta-generators';
import { generateLinkingContext } from './internal-linking';

/**
 * Generate all SEO data for a page in one call
 * Useful for components that need everything at once
 */
export interface CompleteSeoData {
  meta: ReturnType<typeof generateMetaTags>;
  helmet: ReturnType<typeof generateHelmetProps>;
  schema: ReturnType<typeof generateSchemaGraph>;
  linking: ReturnType<typeof generateLinkingContext>;
}

export function generateCompleteSeoData(
  page: SeoPageConfig,
  allPages: SeoPageConfig[],
  schemaOptions?: SchemaGeneratorOptions
): CompleteSeoData {
  const meta = generateMetaTags(page);
  return {
    meta,
    helmet: generateHelmetProps(meta),
    schema: generateSchemaGraph(page, schemaOptions),
    linking: generateLinkingContext(page, allPages),
  };
}

// =============================================================================
// Validation Exports
// =============================================================================

export {
  // Thresholds
  SEO_THRESHOLDS,

  // Page validation
  validatePage,
  validateAllPages,

  // Quality reports
  generateQualityReport,

  // Pre-publish checks
  runPrePublishChecks,

  // CI integration
  formatForCI,
  getCIExitCode,

  // Types
  type PageValidationResult,
  type BatchValidationResult,
  type QualityReport,
  type PrePublishCheckResult,
} from './validation';

// =============================================================================
// Build Utilities Exports
// =============================================================================

export {
  // Data chunking
  chunkPages,
  generateDataManifest,

  // Sitemap generation
  generateSitemapUrls,
  generateSitemapXml,
  generateSitemapIndexXml,
  generateSitemaps,

  // Route generation
  getAllPrerenderRoutes,
  generateRoutesBatched,

  // Caching
  hashContent,
  isCacheValid,

  // Prerender config
  DEFAULT_PRERENDER_CONFIG,
  getOptimizedPrerenderConfig,

  // Export utilities
  exportPageDataAsJson,
  exportAllPagesAsJson,

  // Build stats
  calculateBuildStats,

  // Types
  type ChunkConfig,
  type SitemapUrl,
  type SitemapConfig,
  type CacheEntry,
  type PrerenderConfig,
  type BuildStats,
} from './build-utils';

// =============================================================================
// Batch Processing Utilities
// =============================================================================

/**
 * Process pages in batches for memory efficiency
 * Essential for handling 100,000+ pages
 */
export async function processPagesInBatches<T>(
  pages: SeoPageConfig[],
  processor: (page: SeoPageConfig, index: number) => T | Promise<T>,
  options: {
    batchSize?: number;
    onBatchComplete?: (batchIndex: number, results: T[]) => void;
  } = {}
): Promise<T[]> {
  const { batchSize = 1000, onBatchComplete } = options;
  const results: T[] = [];

  for (let i = 0; i < pages.length; i += batchSize) {
    const batch = pages.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map((page, idx) => processor(page, i + idx))
    );
    results.push(...batchResults);

    if (onBatchComplete) {
      onBatchComplete(Math.floor(i / batchSize), batchResults);
    }
  }

  return results;
}

/**
 * Create a page lookup map for efficient access
 */
export function createPageLookup(
  pages: SeoPageConfig[]
): Map<string, SeoPageConfig> {
  return new Map(pages.map((p) => [p.id, p]));
}

/**
 * Create lookups by slug and path for routing
 */
export function createRoutingLookups(pages: SeoPageConfig[]): {
  bySlug: Map<string, SeoPageConfig>;
  byPath: Map<string, SeoPageConfig>;
} {
  return {
    bySlug: new Map(pages.map((p) => [p.slug, p])),
    byPath: new Map(pages.map((p) => [p.path, p])),
  };
}
