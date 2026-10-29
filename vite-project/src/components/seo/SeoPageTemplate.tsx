/**
 * Unified SEO Page Template
 *
 * A composable, reusable template for all programmatic SEO pages.
 * Designed to scale to 100,000+ pages while maintaining:
 * - Consistent SEO implementation
 * - Unique, intent-matched content
 * - Proper schema markup
 * - Intelligent internal linking
 */

import { useMemo, type ReactNode } from 'react';
import { Helmet } from 'react-helmet-async';

import {
  type SeoPageConfig,
  type SeoToolType,
  type InternalLink,
  type BreadcrumbItem,
  generateMetaTags,
  generateSchemaGraph,
  generateBreadcrumbs,
  type SchemaGeneratorOptions,
} from '../../lib/seo';

// =============================================================================
// Types
// =============================================================================

export interface SeoPageTemplateProps {
  /** Page configuration data */
  page: SeoPageConfig;

  /** Schema generation options */
  schemaOptions?: SchemaGeneratorOptions;

  /** Custom hero section content */
  heroContent?: ReactNode;

  /** Main content (calculator, form, etc.) */
  children?: ReactNode;

  /** Related pages for internal linking */
  relatedPages?: InternalLink[];

  /** Cross-tool links */
  crossToolLinks?: Record<SeoToolType, InternalLink[]>;

  /** Custom sections to render after main content */
  additionalSections?: ReactNode;

  /** FAQ items to display (uses page.faq if not provided) */
  faq?: Array<{ question: string; answer: string }>;

  /** Whether to show the FAQ section */
  showFaq?: boolean;

  /** Custom CSS classes */
  className?: string;

  /** Background gradient variant */
  variant?: 'blue' | 'orange' | 'green' | 'purple' | 'neutral';
}

// =============================================================================
// Gradient Variants
// =============================================================================

const GRADIENT_VARIANTS: Record<string, string> = {
  blue: 'from-emerald-50 dark:from-neutral-950 via-white dark:via-neutral-950 to-emerald-50 dark:to-neutral-950',
  orange: 'from-stone-50 dark:from-neutral-950 via-white dark:via-neutral-950 to-orange-50 dark:to-neutral-950',
  green: 'from-emerald-50 dark:from-neutral-950 via-white dark:via-neutral-950 to-teal-50 dark:to-neutral-950',
  purple: 'from-purple-50 dark:from-neutral-950 via-white dark:via-neutral-950 to-pink-50 dark:to-neutral-950',
  neutral: 'from-gray-50 dark:from-neutral-950 via-white dark:via-neutral-950 to-slate-50 dark:to-neutral-950',
};

const TOOL_VARIANTS: Record<SeoToolType, string> = {
  pace: 'blue',
  fuel: 'orange',
  elevation: 'green',
  race: 'orange',
  blog: 'purple',
  plan: 'green',
};

const TOOL_COLORS: Record<SeoToolType, { border: string; bg: string; text: string }> = {
  pace: { border: 'border-emerald-100 dark:border-emerald-900/60', bg: 'bg-emerald-700', text: 'text-emerald-700 dark:text-emerald-300' },
  fuel: { border: 'border-orange-100 dark:border-orange-900/60', bg: 'bg-amber-700', text: 'text-orange-800 dark:text-orange-300' },
  elevation: { border: 'border-emerald-100 dark:border-emerald-900/60', bg: 'bg-emerald-700', text: 'text-emerald-700 dark:text-emerald-300' },
  race: { border: 'border-orange-100 dark:border-orange-900/60', bg: 'bg-gray-900 dark:bg-neutral-700', text: 'text-orange-800 dark:text-orange-300' },
  blog: { border: 'border-purple-100 dark:border-purple-900/60', bg: 'bg-purple-700', text: 'text-purple-700 dark:text-purple-300' },
  plan: { border: 'border-emerald-100 dark:border-emerald-900/60', bg: 'bg-emerald-700', text: 'text-emerald-700 dark:text-emerald-300' },
};

// =============================================================================
// Sub-components
// =============================================================================

interface HeroSectionProps {
  page: SeoPageConfig;
  colors: typeof TOOL_COLORS.pace;
  customContent?: ReactNode;
}

function HeroSection({ page, colors, customContent }: HeroSectionProps) {
  return (
    <section className="px-4 sm:px-6 pt-10 pb-8">
      <div className="max-w-4xl mx-auto">
        {customContent || (
          <>
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-gray-900 dark:text-neutral-100">
              {page.h1}
            </h1>
            <p className="mt-4 text-lg text-gray-700 dark:text-neutral-300">{page.intro}</p>

            {page.bullets.length > 0 && (
              <div className="mt-6 grid gap-2">
                {page.bullets.map((bullet) => (
                  <div
                    key={bullet}
                    className={`rounded-lg bg-white/70 dark:bg-neutral-900/70 ${colors.border} border px-4 py-3 text-gray-800 dark:text-neutral-200`}
                  >
                    {bullet}
                  </div>
                ))}
              </div>
            )}

            <div className="mt-6">
              <a
                href={page.cta.href}
                className={`inline-flex items-center rounded-lg ${colors.bg} px-5 py-3 text-white font-semibold shadow hover:opacity-90 transition-opacity`}
              >
                {page.cta.label}
              </a>
            </div>
          </>
        )}
      </div>
    </section>
  );
}

interface FaqSectionProps {
  faq: Array<{ question: string; answer: string }>;
  colors: typeof TOOL_COLORS.pace;
}

function FaqSection({ faq, colors }: FaqSectionProps) {
  if (faq.length === 0) return null;

  return (
    <section className="px-4 sm:px-6 py-12">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-neutral-100 mb-6">
          Frequently Asked Questions
        </h2>
        <div className="space-y-4">
          {faq.map((item, index) => (
            <div
              key={index}
              className={`rounded-xl bg-white/80 dark:bg-neutral-900/80 ${colors.border} border p-6`}
            >
              <h3 className="text-lg font-semibold text-gray-900 dark:text-neutral-100">
                {item.question}
              </h3>
              <p className="mt-2 text-gray-700 dark:text-neutral-300">{item.answer}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

interface RelatedPagesSectionProps {
  relatedPages: InternalLink[];
  title?: string;
}

function RelatedPagesSection({
  relatedPages,
  title = 'Related Pages',
}: RelatedPagesSectionProps) {
  if (relatedPages.length === 0) return null;

  return (
    <section className="px-4 sm:px-6 py-12 bg-gray-50/50 dark:bg-neutral-950/50">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-xl font-bold text-gray-900 dark:text-neutral-100 mb-4">{title}</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {relatedPages.map((link) => (
            <a
              key={link.pageId}
              href={link.path}
              className="rounded-lg bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 p-4 hover:border-gray-300 dark:hover:border-neutral-700 hover:shadow-sm transition-all"
            >
              <span className="font-medium text-gray-900 dark:text-neutral-100">
                {link.anchor || link.title}
              </span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

interface CrossToolLinksSectionProps {
  currentTool: SeoToolType;
}

function CrossToolLinksSection({ currentTool }: CrossToolLinksSectionProps) {
  const tools = [
    {
      tool: 'pace' as const,
      href: '/calculator',
      title: 'Pacing',
      subtitle: 'Get your training paces',
      description: 'Convert any race time into Easy, Tempo, Threshold, and Interval zones.',
      colors: { border: 'border-emerald-100 dark:border-emerald-900/60', text: 'text-emerald-700 dark:text-emerald-300' },
    },
    {
      tool: 'fuel' as const,
      href: '/fuel',
      title: 'Fueling',
      subtitle: 'Build a gel schedule',
      description: 'Estimate carbs/hour, total carbs, and how many gels to carry.',
      colors: { border: 'border-amber-100 dark:border-amber-900/60', text: 'text-amber-700 dark:text-amber-300' },
    },
    {
      tool: 'elevation' as const,
      href: '/elevation-finder',
      title: 'Elevation',
      subtitle: 'Analyze hills & grades',
      description: 'Upload a GPX to see elevation gain, grades, and key climbs.',
      colors: { border: 'border-emerald-100 dark:border-emerald-900/60', text: 'text-emerald-700 dark:text-emerald-300' },
    },
    {
      tool: 'plan' as const,
      href: '/plan',
      title: 'Training Plan',
      subtitle: 'Build a training plan',
      description: '8–20 week periodized plans for 5K to Marathon with daily workouts.',
      colors: { border: 'border-emerald-100 dark:border-emerald-900/60', text: 'text-emerald-700 dark:text-emerald-300' },
    },
  ];

  const visibleTools = tools.filter((t) => t.tool !== currentTool);

  return (
    <section className="px-4 sm:px-6 pb-16">
      <div className="max-w-5xl mx-auto grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {visibleTools.map((tool) => (
          <a
            key={tool.tool}
            href={tool.href}
            className={`rounded-2xl ${tool.colors.border} border bg-white/70 dark:bg-neutral-900/70 p-6 hover:bg-white dark:hover:bg-neutral-900 transition-colors`}
          >
            <div className={`text-sm font-semibold ${tool.colors.text}`}>
              {tool.title}
            </div>
            <div className="mt-2 text-lg font-bold text-gray-900 dark:text-neutral-100">
              {tool.subtitle}
            </div>
            <p className="mt-2 text-gray-700 dark:text-neutral-300">{tool.description}</p>
          </a>
        ))}
      </div>
    </section>
  );
}

interface BreadcrumbNavProps {
  items: BreadcrumbItem[];
}

function BreadcrumbNav({ items }: BreadcrumbNavProps) {
  return (
    <nav className="px-4 sm:px-6 pt-4" aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-center gap-2 text-sm text-gray-600 dark:text-neutral-400">
        {items.map((item, index) => (
          <li key={item.url} className="flex items-center gap-2">
            {index > 0 && <span className="text-gray-400 dark:text-neutral-500">/</span>}
            {index === items.length - 1 ? (
              <span className="text-gray-900 dark:text-neutral-100 font-medium">{item.name}</span>
            ) : (
              <a href={item.url} className="hover:text-gray-900 dark:hover:text-neutral-100 hover:underline">
                {item.name}
              </a>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

// =============================================================================
// Main Component
// =============================================================================

export function SeoPageTemplate({
  page,
  schemaOptions,
  heroContent,
  children,
  relatedPages = [],
  additionalSections,
  faq,
  showFaq = true,
  className = '',
  variant,
}: SeoPageTemplateProps) {
  // Generate meta tags
  const meta = useMemo(() => generateMetaTags(page), [page]);

  // Generate schema
  const schema = useMemo(
    () => generateSchemaGraph(page, schemaOptions),
    [page, schemaOptions]
  );

  // Generate breadcrumbs
  const breadcrumbs = useMemo(() => generateBreadcrumbs(page), [page]);

  // Get colors and gradient
  const gradientVariant = variant || TOOL_VARIANTS[page.tool];
  const gradientClass = GRADIENT_VARIANTS[gradientVariant];
  const colors = TOOL_COLORS[page.tool];

  // FAQ items
  const faqItems = faq || page.faq || [];

  return (
    <div className={`min-h-screen bg-gradient-to-br ${gradientClass} ${className}`}>
      {/* SEO Meta Tags */}
      <Helmet>
        <title>{meta.title}</title>
        <meta name="description" content={meta.description} />
        <link rel="canonical" href={meta.canonical} />
        {meta.robots && <meta name="robots" content={meta.robots} />}

        {/* Open Graph */}
        <meta property="og:title" content={meta.openGraph.title} />
        <meta property="og:description" content={meta.openGraph.description} />
        <meta property="og:type" content={meta.openGraph.type} />
        <meta property="og:url" content={meta.openGraph.url} />
        <meta property="og:image" content={meta.openGraph.image} />
        <meta property="og:site_name" content={meta.openGraph.siteName} />

        {/* Twitter */}
        <meta name="twitter:card" content={meta.twitter.card} />
        <meta name="twitter:title" content={meta.twitter.title} />
        <meta name="twitter:description" content={meta.twitter.description} />
        <meta name="twitter:image" content={meta.twitter.image} />

        {/* Structured Data */}
        <script type="application/ld+json">{JSON.stringify(schema)}</script>
      </Helmet>

      {/* Breadcrumb Navigation */}
      <BreadcrumbNav items={breadcrumbs} />

      {/* Hero Section */}
      <HeroSection page={page} colors={colors} customContent={heroContent} />

      {/* Main Content */}
      {children && (
        <section className="px-4 sm:px-6 pb-16">
          <div className="max-w-7xl mx-auto">{children}</div>
        </section>
      )}

      {/* Additional Sections */}
      {additionalSections}

      {/* FAQ Section */}
      {showFaq && faqItems.length > 0 && (
        <FaqSection faq={faqItems} colors={colors} />
      )}

      {/* Related Pages */}
      {relatedPages.length > 0 && (
        <RelatedPagesSection relatedPages={relatedPages} />
      )}

      {/* Cross-Tool Links */}
      <CrossToolLinksSection currentTool={page.tool} />
    </div>
  );
}

// =============================================================================
// Convenience Exports
// =============================================================================

export { HeroSection, FaqSection, RelatedPagesSection, CrossToolLinksSection, BreadcrumbNav };
