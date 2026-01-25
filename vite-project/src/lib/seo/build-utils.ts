/**
 * Build Utilities for Scalable SEO
 *
 * Optimizations for handling 100,000+ pages:
 * - Chunked data loading to prevent memory issues
 * - Streaming sitemap generation
 * - Route priority calculation
 * - Build-time caching
 */

import type { SeoPageConfig, SeoToolType, DataSourceManifest } from './types';
import { BASE_URL } from './types';
import { calculateSitemapPriority } from './internal-linking';

// =============================================================================
// Data Chunking
// =============================================================================

/**
 * Configuration for data chunking
 */
export interface ChunkConfig {
  maxPagesPerChunk: number;
  chunkByTool: boolean;
}

const DEFAULT_CHUNK_CONFIG: ChunkConfig = {
  maxPagesPerChunk: 5000,
  chunkByTool: true,
};

/**
 * Split pages into chunks for efficient loading
 */
export function chunkPages(
  pages: SeoPageConfig[],
  config: Partial<ChunkConfig> = {}
): Map<string, SeoPageConfig[]> {
  const { maxPagesPerChunk, chunkByTool } = { ...DEFAULT_CHUNK_CONFIG, ...config };
  const chunks = new Map<string, SeoPageConfig[]>();

  if (chunkByTool) {
    // Group by tool first
    const byTool = new Map<SeoToolType, SeoPageConfig[]>();
    for (const page of pages) {
      if (!byTool.has(page.tool)) {
        byTool.set(page.tool, []);
      }
      byTool.get(page.tool)!.push(page);
    }

    // Then chunk each tool's pages
    for (const [tool, toolPages] of byTool) {
      for (let i = 0; i < toolPages.length; i += maxPagesPerChunk) {
        const chunkIndex = Math.floor(i / maxPagesPerChunk);
        const chunkId = `${tool}-${chunkIndex}`;
        chunks.set(chunkId, toolPages.slice(i, i + maxPagesPerChunk));
      }
    }
  } else {
    // Simple sequential chunking
    for (let i = 0; i < pages.length; i += maxPagesPerChunk) {
      const chunkIndex = Math.floor(i / maxPagesPerChunk);
      const chunkId = `chunk-${chunkIndex}`;
      chunks.set(chunkId, pages.slice(i, i + maxPagesPerChunk));
    }
  }

  return chunks;
}

/**
 * Generate a manifest file for lazy loading chunks
 */
export function generateDataManifest(
  chunks: Map<string, SeoPageConfig[]>,
  basePath = '/data/seo'
): DataSourceManifest {
  const manifest: DataSourceManifest = {
    version: '1.0.0',
    generated: new Date().toISOString(),
    chunks: [],
    totals: {
      pages: 0,
      byTool: {
        pace: 0,
        fuel: 0,
        elevation: 0,
        race: 0,
        blog: 0,
      },
    },
  };

  for (const [chunkId, pages] of chunks) {
    const tool = pages[0]?.tool;
    manifest.chunks.push({
      id: chunkId,
      path: `${basePath}/${chunkId}.json`,
      count: pages.length,
      tool,
    });

    manifest.totals.pages += pages.length;
    if (tool) {
      manifest.totals.byTool[tool] += pages.length;
    }
  }

  return manifest;
}

// =============================================================================
// Sitemap Generation
// =============================================================================

export interface SitemapUrl {
  loc: string;
  lastmod?: string;
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
}

export interface SitemapConfig {
  baseUrl?: string;
  defaultChangefreq?: SitemapUrl['changefreq'];
  defaultPriority?: number;
  maxUrlsPerSitemap?: number;
}

const DEFAULT_SITEMAP_CONFIG: Required<SitemapConfig> = {
  baseUrl: BASE_URL,
  defaultChangefreq: 'weekly',
  defaultPriority: 0.6,
  maxUrlsPerSitemap: 50000, // Google's limit
};

/**
 * Generate sitemap URLs from pages
 */
export function generateSitemapUrls(
  pages: SeoPageConfig[],
  config: SitemapConfig = {}
): SitemapUrl[] {
  const { baseUrl, defaultChangefreq } = {
    ...DEFAULT_SITEMAP_CONFIG,
    ...config,
  };

  return pages.map((page) => ({
    loc: `${baseUrl}${page.path}`,
    lastmod: page.dateModified || page.datePublished || new Date().toISOString().split('T')[0],
    changefreq: page.changefreq || defaultChangefreq,
    priority: page.priority ?? calculateSitemapPriority(page),
  }));
}

/**
 * Generate XML sitemap content
 */
export function generateSitemapXml(urls: SitemapUrl[]): string {
  const urlEntries = urls
    .map(
      (url) => `  <url>
    <loc>${escapeXml(url.loc)}</loc>
    ${url.lastmod ? `<lastmod>${url.lastmod}</lastmod>` : ''}
    ${url.changefreq ? `<changefreq>${url.changefreq}</changefreq>` : ''}
    ${url.priority !== undefined ? `<priority>${url.priority.toFixed(1)}</priority>` : ''}
  </url>`
    )
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries}
</urlset>`;
}

/**
 * Generate sitemap index for multiple sitemaps
 */
export function generateSitemapIndexXml(
  sitemapPaths: string[],
  baseUrl = BASE_URL
): string {
  const entries = sitemapPaths
    .map(
      (path) => `  <sitemap>
    <loc>${baseUrl}${path}</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
  </sitemap>`
    )
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries}
</sitemapindex>`;
}

/**
 * Split pages into multiple sitemaps if needed
 */
export function generateSitemaps(
  pages: SeoPageConfig[],
  config: SitemapConfig = {}
): Map<string, string> {
  const { maxUrlsPerSitemap } = { ...DEFAULT_SITEMAP_CONFIG, ...config };
  const sitemaps = new Map<string, string>();
  const urls = generateSitemapUrls(pages, config);

  if (urls.length <= maxUrlsPerSitemap) {
    // Single sitemap
    sitemaps.set('sitemap.xml', generateSitemapXml(urls));
  } else {
    // Multiple sitemaps with index
    const sitemapPaths: string[] = [];

    for (let i = 0; i < urls.length; i += maxUrlsPerSitemap) {
      const chunkUrls = urls.slice(i, i + maxUrlsPerSitemap);
      const sitemapPath = `/sitemap-${Math.floor(i / maxUrlsPerSitemap) + 1}.xml`;
      sitemaps.set(sitemapPath.slice(1), generateSitemapXml(chunkUrls));
      sitemapPaths.push(sitemapPath);
    }

    sitemaps.set('sitemap.xml', generateSitemapIndexXml(sitemapPaths));
  }

  return sitemaps;
}

// =============================================================================
// Route Generation
// =============================================================================

/**
 * Generate all routes for prerendering
 */
export function getAllPrerenderRoutes(pages: SeoPageConfig[]): string[] {
  return pages.map((page) => page.path);
}

/**
 * Generate routes in batches for memory-efficient builds
 */
export function* generateRoutesBatched(
  pages: SeoPageConfig[],
  batchSize = 1000
): Generator<string[], void, unknown> {
  for (let i = 0; i < pages.length; i += batchSize) {
    yield pages.slice(i, i + batchSize).map((p) => p.path);
  }
}

// =============================================================================
// Build Cache
// =============================================================================

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  hash: string;
}

/**
 * Simple content hash for cache invalidation
 */
export function hashContent(content: string): string {
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

/**
 * Check if a cached entry is still valid
 */
export function isCacheValid<T>(
  entry: CacheEntry<T> | undefined,
  currentHash: string,
  maxAgeMs = 24 * 60 * 60 * 1000 // 24 hours
): boolean {
  if (!entry) return false;
  if (entry.hash !== currentHash) return false;
  if (Date.now() - entry.timestamp > maxAgeMs) return false;
  return true;
}

// =============================================================================
// Prerender Configuration
// =============================================================================

export interface PrerenderConfig {
  /** Maximum concurrent prerenders */
  concurrency: number;
  /** Timeout per page in ms */
  timeout: number;
  /** Retry failed prerenders */
  retries: number;
  /** Delay between batches in ms */
  batchDelay: number;
}

export const DEFAULT_PRERENDER_CONFIG: PrerenderConfig = {
  concurrency: 10,
  timeout: 30000,
  retries: 2,
  batchDelay: 100,
};

/**
 * Generate optimized prerender configuration based on page count
 */
export function getOptimizedPrerenderConfig(pageCount: number): PrerenderConfig {
  if (pageCount < 1000) {
    return { ...DEFAULT_PRERENDER_CONFIG, concurrency: 20 };
  }
  if (pageCount < 10000) {
    return { ...DEFAULT_PRERENDER_CONFIG, concurrency: 10, batchDelay: 200 };
  }
  if (pageCount < 50000) {
    return { ...DEFAULT_PRERENDER_CONFIG, concurrency: 5, batchDelay: 500 };
  }
  // 50k+ pages
  return {
    concurrency: 3,
    timeout: 60000,
    retries: 3,
    batchDelay: 1000,
  };
}

// =============================================================================
// Static Page Data Export
// =============================================================================

/**
 * Export page data as JSON for static hosting
 */
export function exportPageDataAsJson(page: SeoPageConfig): string {
  return JSON.stringify(
    {
      id: page.id,
      slug: page.slug,
      path: page.path,
      tool: page.tool,
      title: page.title,
      description: page.description,
      h1: page.h1,
      intro: page.intro,
      bullets: page.bullets,
      cta: page.cta,
      faq: page.faq,
      howTo: page.howTo,
      initialInputs: page.initialInputs,
      previewRouteKey: page.previewRouteKey,
    },
    null,
    2
  );
}

/**
 * Export all pages as a single JSON file (for smaller datasets)
 */
export function exportAllPagesAsJson(pages: SeoPageConfig[]): string {
  return JSON.stringify(
    pages.map((page) => ({
      id: page.id,
      slug: page.slug,
      path: page.path,
      tool: page.tool,
      title: page.title,
      description: page.description,
    })),
    null,
    2
  );
}

// =============================================================================
// Helper Functions
// =============================================================================

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// =============================================================================
// Build Stats
// =============================================================================

export interface BuildStats {
  totalPages: number;
  pagesByTool: Record<SeoToolType, number>;
  averageTitleLength: number;
  averageDescriptionLength: number;
  pagesWithFaq: number;
  pagesWithHowTo: number;
  estimatedBuildTimeMinutes: number;
}

/**
 * Calculate build statistics
 */
export function calculateBuildStats(pages: SeoPageConfig[]): BuildStats {
  const byTool: Record<SeoToolType, number> = {
    pace: 0,
    fuel: 0,
    elevation: 0,
    race: 0,
    blog: 0,
  };

  let totalTitleLength = 0;
  let totalDescLength = 0;
  let pagesWithFaq = 0;
  let pagesWithHowTo = 0;

  for (const page of pages) {
    byTool[page.tool]++;
    totalTitleLength += page.title.length;
    totalDescLength += page.description.length;
    if (page.faq && page.faq.length > 0) pagesWithFaq++;
    if (page.howTo) pagesWithHowTo++;
  }

  // Rough estimate: 100 pages per minute with good hardware
  const estimatedBuildTimeMinutes = Math.ceil(pages.length / 100);

  return {
    totalPages: pages.length,
    pagesByTool: byTool,
    averageTitleLength: Math.round(totalTitleLength / pages.length),
    averageDescriptionLength: Math.round(totalDescLength / pages.length),
    pagesWithFaq,
    pagesWithHowTo,
    estimatedBuildTimeMinutes,
  };
}
