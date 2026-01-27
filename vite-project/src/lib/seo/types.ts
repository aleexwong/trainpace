/**
 * Scalable SEO Type System
 *
 * Designed for 100,000+ programmatic pages with:
 * - Type-safe data structures
 * - Extensible schema definitions
 * - Content variation support
 * - Internal linking metadata
 */

// =============================================================================
// Core SEO Types
// =============================================================================

export type SeoToolType = 'pace' | 'fuel' | 'elevation' | 'race' | 'blog';

export type SchemaType =
  | 'WebPage'
  | 'FAQPage'
  | 'HowTo'
  | 'Article'
  | 'BlogPosting'
  | 'SportsEvent'
  | 'Product'
  | 'SoftwareApplication'
  | 'BreadcrumbList'
  | 'Organization'
  | 'WebSite';

export interface SeoFaqItem {
  question: string;
  answer: string;
}

export interface SeoHowToStep {
  name: string;
  text: string;
  url?: string;
  image?: string;
}

export interface SeoHowTo {
  name: string;
  description: string;
  totalTime?: string; // ISO 8601 duration (e.g., "PT5M")
  estimatedCost?: {
    currency: string;
    value: string;
  };
  tool?: string;
  supply?: string[];
  steps: SeoHowToStep[];
}

export interface SeoCta {
  href: string;
  label: string;
  variant?: 'primary' | 'secondary' | 'outline';
}

// =============================================================================
// Content Variation System
// =============================================================================

/**
 * Content variables that can be interpolated into templates
 * Enables unique content generation at scale
 */
export interface ContentVariables {
  // Core identifiers
  slug: string;
  name: string;
  displayName: string;

  // Distance/race specific
  distance?: string;
  distanceKm?: number;
  distanceMiles?: number;
  raceType?: 'marathon' | 'half' | '10k' | '5k' | 'ultra' | 'other';

  // Location specific
  city?: string;
  country?: string;
  region?: string;

  // Race/event specific
  eventName?: string;
  eventDate?: string;
  eventYear?: number;

  // Metrics
  elevationGain?: number;
  elevationLoss?: number;
  difficulty?: 'easy' | 'moderate' | 'hard' | 'expert';

  // Tool-specific
  targetPace?: string;
  targetTime?: string;
  carbsPerHour?: number;

  // Custom variables for extensibility
  custom?: Record<string, string | number | boolean>;
}

/**
 * Template strings support variable interpolation: {{variableName}}
 */
export interface ContentTemplate {
  title: string;
  description: string;
  h1: string;
  intro: string;
  bullets: string[];
}

// =============================================================================
// Page Configuration
// =============================================================================

export interface SeoPageConfig {
  // Identity
  id: string; // Unique identifier for the page
  slug: string;
  path: string;
  tool: SeoToolType;

  // Content
  title: string;
  description: string;
  h1: string;
  intro: string;
  bullets: string[];

  // CTA
  cta: SeoCta;

  // Optional structured content
  faq?: SeoFaqItem[];
  howTo?: SeoHowTo;

  // Tool-specific pre-fill data
  initialInputs?: Record<string, string | number | boolean>;

  // Related content (for internal linking)
  relatedPageIds?: string[];
  parentPageId?: string;
  hubPageId?: string;

  // External references
  externalLinks?: Array<{
    url: string;
    label: string;
    rel?: string;
  }>;

  // Preview route key (for races with course data)
  previewRouteKey?: string;

  // Content variation data
  variables?: ContentVariables;

  // SEO metadata
  canonicalUrl?: string; // Override auto-generated canonical
  noIndex?: boolean; // For thin content pages
  priority?: number; // Sitemap priority (0.0 - 1.0)
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';

  // Schema hints
  schemaTypes?: SchemaType[];

  // Timestamps
  datePublished?: string;
  dateModified?: string;
}

// =============================================================================
// Page Groups / Hubs
// =============================================================================

/**
 * Hub pages serve as category landing pages that link to related spoke pages
 * Essential for hub-and-spoke SEO architecture
 */
export interface SeoHubConfig {
  id: string;
  slug: string;
  path: string;
  tool: SeoToolType;

  // Content
  title: string;
  description: string;
  h1: string;
  intro: string;

  // Spoke pages this hub links to
  spokePageIds: string[];

  // Categorization of spokes
  categories?: Array<{
    name: string;
    description?: string;
    pageIds: string[];
  }>;

  // Featured spokes to highlight
  featuredPageIds?: string[];
}

// =============================================================================
// Internal Linking
// =============================================================================

export interface InternalLink {
  pageId: string;
  path: string;
  title: string;
  anchor?: string; // Custom anchor text
  relevanceScore?: number; // For sorting related links
}

export interface BreadcrumbItem {
  name: string;
  url: string;
}

export interface LinkingContext {
  currentPage: SeoPageConfig;
  breadcrumbs: BreadcrumbItem[];
  relatedPages: InternalLink[];
  hubPage?: InternalLink;
  siblingPages?: InternalLink[];
  childPages?: InternalLink[];
}

// =============================================================================
// Schema.org Types
// =============================================================================

export interface SchemaWebPage {
  '@context': 'https://schema.org';
  '@type': 'WebPage';
  name: string;
  description: string;
  url: string;
  isPartOf?: {
    '@type': 'WebSite';
    name: string;
    url: string;
  };
  breadcrumb?: SchemaBreadcrumbList;
  mainEntity?: unknown;
  datePublished?: string;
  dateModified?: string;
}

export interface SchemaBreadcrumbList {
  '@context': 'https://schema.org';
  '@type': 'BreadcrumbList';
  itemListElement: Array<{
    '@type': 'ListItem';
    position: number;
    name: string;
    item: string;
  }>;
}

export interface SchemaFAQPage {
  '@context': 'https://schema.org';
  '@type': 'FAQPage';
  mainEntity: Array<{
    '@type': 'Question';
    name: string;
    acceptedAnswer: {
      '@type': 'Answer';
      text: string;
    };
  }>;
}

export interface SchemaHowTo {
  '@context': 'https://schema.org';
  '@type': 'HowTo';
  name: string;
  description: string;
  totalTime?: string;
  tool?: {
    '@type': 'HowToTool';
    name: string;
  };
  step: Array<{
    '@type': 'HowToStep';
    position: number;
    name: string;
    text: string;
    url?: string;
    image?: string;
  }>;
}

export interface SchemaSportsEvent {
  '@context': 'https://schema.org';
  '@type': 'SportsEvent';
  name: string;
  description?: string;
  url?: string;
  startDate?: string;
  endDate?: string;
  sport: 'Running';
  location?: {
    '@type': 'Place';
    name: string;
    address?: {
      '@type': 'PostalAddress';
      addressLocality?: string;
      addressRegion?: string;
      addressCountry?: string;
    };
  };
  eventAttendanceMode?: string;
  organizer?: {
    '@type': 'Organization';
    name: string;
    url?: string;
  };
}

export interface SchemaArticle {
  '@context': 'https://schema.org';
  '@type': 'Article' | 'BlogPosting';
  headline: string;
  description?: string;
  url: string;
  datePublished: string;
  dateModified?: string;
  author?: {
    '@type': 'Person' | 'Organization';
    name: string;
    url?: string;
  };
  publisher?: {
    '@type': 'Organization';
    name: string;
    url?: string;
    logo?: {
      '@type': 'ImageObject';
      url: string;
    };
  };
  image?: string | string[];
  mainEntityOfPage?: {
    '@type': 'WebPage';
    '@id': string;
  };
}

export interface SchemaOrganization {
  '@context': 'https://schema.org';
  '@type': 'Organization';
  name: string;
  url: string;
  logo?: string;
  description?: string;
  sameAs?: string[];
}

export interface SchemaWebSite {
  '@context': 'https://schema.org';
  '@type': 'WebSite';
  name: string;
  url: string;
  description?: string;
  potentialAction?: {
    '@type': 'SearchAction';
    target: {
      '@type': 'EntryPoint';
      urlTemplate: string;
    };
    'query-input'?: string;
  };
}

export interface SchemaSoftwareApplication {
  '@context': 'https://schema.org';
  '@type': 'SoftwareApplication' | 'WebApplication';
  name: string;
  description: string;
  url: string;
  applicationCategory: string;
  operatingSystem?: string;
  browserRequirements?: string;
  offers?: {
    '@type': 'Offer';
    price: string;
    priceCurrency: string;
  };
}

// Union type for all schema types
export type SchemaJsonLd =
  | SchemaWebPage
  | SchemaBreadcrumbList
  | SchemaFAQPage
  | SchemaHowTo
  | SchemaSportsEvent
  | SchemaArticle
  | SchemaOrganization
  | SchemaWebSite
  | SchemaSoftwareApplication;

// Graph of multiple schemas
export interface SchemaGraph {
  '@context': 'https://schema.org';
  '@graph': SchemaJsonLd[];
}

// =============================================================================
// Data Source Types
// =============================================================================

/**
 * Pagination info for large data sets
 */
export interface PaginationInfo {
  page: number;
  pageSize: number;
  totalPages: number;
  totalItems: number;
  hasNext: boolean;
  hasPrev: boolean;
}

/**
 * Data source manifest for lazy loading
 */
export interface DataSourceManifest {
  version: string;
  generated: string;
  chunks: Array<{
    id: string;
    path: string;
    count: number;
    tool?: SeoToolType;
  }>;
  totals: {
    pages: number;
    byTool: Record<SeoToolType, number>;
  };
}

// =============================================================================
// Validation Types
// =============================================================================

export interface SeoValidationResult {
  isValid: boolean;
  errors: SeoValidationError[];
  warnings: SeoValidationWarning[];
}

export interface SeoValidationError {
  field: string;
  message: string;
  pageId?: string;
}

export interface SeoValidationWarning {
  field: string;
  message: string;
  suggestion?: string;
  pageId?: string;
}

// =============================================================================
// Export Helpers
// =============================================================================

export const BASE_URL = 'https://trainpace.com';

export function withBaseUrl(path: string): string {
  return `${BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

export function normalizeSlug(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function generatePageId(tool: SeoToolType, slug: string): string {
  return `${tool}:${slug}`;
}
