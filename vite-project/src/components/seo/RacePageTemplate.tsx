/**
 * Race Page Template
 *
 * Specialized template for race preparation pages.
 * Extends SeoPageTemplate with race-specific features:
 * - Course preview map
 * - Elevation stats
 * - Race-specific tips
 * - Event schema support
 */

import { useMemo, type ReactNode } from 'react';
import { Helmet } from 'react-helmet-async';

import {
  type SeoPageConfig,
  generateMetaTags,
  generateSchemaGraph,
  generateBreadcrumbs,
  type RaceEventData,
} from '@/lib/seo';
import LeafletRoutePreview from '@/components/utils/LeafletRoutePreview';

// =============================================================================
// Types
// =============================================================================

export interface RaceRouteData {
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
  thumbnailPoints: Array<{ lat: number; lng: number; ele?: number; dist?: number }>;
}

export interface RacePageTemplateProps {
  /** Page configuration */
  page: SeoPageConfig;

  /** Race route data (from marathon-data.json) */
  routeData?: RaceRouteData;

  /** Additional content to render */
  children?: ReactNode;
}

// =============================================================================
// Sub-components
// =============================================================================

interface RouteStatCardProps {
  label: string;
  value: string;
}

function RouteStatCard({ label, value }: RouteStatCardProps) {
  return (
    <div className="rounded-2xl border border-orange-100 bg-white p-4">
      <div className="text-xs font-semibold text-gray-500">{label}</div>
      <div className="mt-1 text-lg font-bold text-gray-900">{value}</div>
    </div>
  );
}

interface TipsCardProps {
  tips: string[];
}

function TipsCard({ tips }: TipsCardProps) {
  if (tips.length === 0) return null;

  return (
    <div className="rounded-2xl border border-orange-100 bg-white p-6">
      <h3 className="text-lg font-bold text-gray-900">Quick Tips</h3>
      <div className="mt-3 space-y-2">
        {tips.slice(0, 6).map((tip) => (
          <div key={tip} className="text-gray-700">
            {tip}
          </div>
        ))}
      </div>
    </div>
  );
}

interface FuelingNoteCardProps {
  notes: string;
}

function FuelingNoteCard({ notes }: FuelingNoteCardProps) {
  return (
    <div className="rounded-2xl border border-orange-100 bg-white p-6">
      <h3 className="text-lg font-bold text-gray-900">Fueling Note</h3>
      <p className="mt-3 text-gray-700 leading-relaxed">{notes}</p>
      <div className="mt-4">
        <a
          href="/fuel"
          className="inline-flex items-center rounded-lg bg-amber-700 px-4 py-2 text-white font-semibold hover:bg-amber-800 transition-colors"
        >
          Build a Fuel Plan
        </a>
      </div>
    </div>
  );
}

// =============================================================================
// Main Component
// =============================================================================

export function RacePageTemplate({
  page,
  routeData,
  children,
}: RacePageTemplateProps) {
  // Generate meta tags
  const meta = useMemo(() => generateMetaTags(page), [page]);

  // Generate schema with race event data
  const schema = useMemo(() => {
    const raceEventData: RaceEventData | undefined = routeData
      ? {
          name: routeData.name,
          description: routeData.description,
          city: routeData.city,
          country: routeData.country,
          raceDate: routeData.raceDate,
          website: routeData.website,
        }
      : undefined;

    return generateSchemaGraph(page, { raceData: raceEventData });
  }, [page, routeData]);

  // Generate breadcrumbs
  const breadcrumbs = useMemo(() => generateBreadcrumbs(page), [page]);

  // FAQ items (from page or route data)
  const faqItems = page.faq?.length ? page.faq : routeData?.faq || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-white to-orange-50">
      {/* SEO Meta Tags */}
      <Helmet>
        <title>{meta.title}</title>
        <meta name="description" content={meta.description} />
        <link rel="canonical" href={meta.canonical} />

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
      <nav className="px-4 sm:px-6 pt-4" aria-label="Breadcrumb">
        <ol className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
          {breadcrumbs.map((item, index) => (
            <li key={item.url} className="flex items-center gap-2">
              {index > 0 && <span className="text-gray-400">/</span>}
              {index === breadcrumbs.length - 1 ? (
                <span className="text-gray-900 font-medium">{item.name}</span>
              ) : (
                <a href={item.url} className="hover:text-gray-900 hover:underline">
                  {item.name}
                </a>
              )}
            </li>
          ))}
        </ol>
      </nav>

      {/* Hero Section */}
      <section className="px-4 sm:px-6 pt-10 pb-8">
        <div className="max-w-5xl mx-auto">
          <div className="inline-flex items-center rounded-full border border-orange-200 bg-white/80 px-4 py-2 text-sm font-semibold text-orange-800">
            Race Prep Page
          </div>
          <h1 className="mt-4 text-4xl sm:text-5xl font-bold tracking-tight text-gray-900">
            {page.h1}
          </h1>
          <p className="mt-4 text-lg text-gray-700">{page.intro}</p>
          <div className="mt-6 grid gap-2">
            {page.bullets.map((bullet) => (
              <div
                key={bullet}
                className="rounded-lg bg-white/70 border border-orange-100 px-4 py-3 text-gray-800"
              >
                {bullet}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Course Data Section */}
      {routeData && (
        <section className="px-4 sm:px-6 pb-10">
          <div className="max-w-5xl mx-auto">
            <div className="rounded-3xl border border-orange-100 bg-white/70 overflow-hidden">
              {/* Header */}
              <div className="p-6 sm:p-8">
                <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                  <div>
                    <div className="text-sm font-semibold text-orange-800">
                      Featured Course Data
                    </div>
                    <h2 className="mt-2 text-2xl sm:text-3xl font-bold text-gray-900">
                      {routeData.name}
                    </h2>
                    <p className="mt-2 text-gray-700">
                      {routeData.city}, {routeData.country} - {routeData.raceDate}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {page.previewRouteKey && (
                      <a
                        href={`/preview-route/${page.previewRouteKey}`}
                        className="inline-flex items-center rounded-lg bg-gray-900 px-4 py-2 text-white font-semibold hover:bg-black transition-colors"
                      >
                        Full Course Page
                      </a>
                    )}
                    <a
                      href={routeData.website}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center rounded-lg border border-orange-200 bg-white px-4 py-2 text-orange-900 font-semibold hover:bg-orange-50 transition-colors"
                    >
                      Official Site
                    </a>
                  </div>
                </div>

                <p className="mt-4 text-gray-700 leading-relaxed">
                  {routeData.description}
                </p>

                {/* Stats Grid */}
                <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <RouteStatCard
                    label="Distance"
                    value={`${routeData.distance.toFixed(2)} km`}
                  />
                  <RouteStatCard
                    label="Elevation Gain"
                    value={`${routeData.elevationGain} m`}
                  />
                  <RouteStatCard
                    label="Elevation Loss"
                    value={`${routeData.elevationLoss} m`}
                  />
                  <RouteStatCard
                    label="Start / Finish"
                    value={`${routeData.startElevation}m - ${routeData.endElevation}m`}
                  />
                </div>
              </div>

              {/* Map */}
              <div className="border-t border-orange-100 bg-white">
                <LeafletRoutePreview
                  routePoints={routeData.thumbnailPoints}
                  height="320px"
                  interactive={false}
                  lineColor="#c2410c"
                  lineWidth={4}
                  showStartEnd={true}
                />
              </div>

              {/* Tips & Fueling Notes */}
              {(routeData.tips?.length || routeData.fuelingNotes) && (
                <div className="p-6 sm:p-8 border-t border-orange-100">
                  <div className="grid gap-6 lg:grid-cols-2">
                    {routeData.tips?.length ? (
                      <TipsCard tips={routeData.tips} />
                    ) : null}
                    {routeData.fuelingNotes ? (
                      <FuelingNoteCard notes={routeData.fuelingNotes} />
                    ) : null}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Additional Content */}
      {children}

      {/* FAQ Section */}
      {faqItems.length > 0 && (
        <section className="px-4 sm:px-6 py-12">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Frequently Asked Questions
            </h2>
            <div className="space-y-4">
              {faqItems.map((item, index) => (
                <div
                  key={index}
                  className="rounded-xl bg-white/80 border border-orange-100 p-6"
                >
                  <h3 className="text-lg font-semibold text-gray-900">
                    {item.question}
                  </h3>
                  <p className="mt-2 text-gray-700">{item.answer}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Cross-Tool Links */}
      <section className="px-4 sm:px-6 pb-16">
        <div className="max-w-5xl mx-auto grid gap-4 sm:grid-cols-3">
          <a
            href="/calculator"
            className="rounded-2xl border border-blue-100 bg-white/70 p-6 hover:bg-white transition-colors"
          >
            <div className="text-sm font-semibold text-blue-700">Pacing</div>
            <div className="mt-2 text-lg font-bold text-gray-900">
              Get your training paces
            </div>
            <p className="mt-2 text-gray-700">
              Convert any race time into Easy, Tempo, Threshold, and Interval zones.
            </p>
          </a>

          <a
            href="/fuel"
            className="rounded-2xl border border-amber-100 bg-white/70 p-6 hover:bg-white transition-colors"
          >
            <div className="text-sm font-semibold text-amber-700">Fueling</div>
            <div className="mt-2 text-lg font-bold text-gray-900">
              Build a gel schedule
            </div>
            <p className="mt-2 text-gray-700">
              Estimate carbs/hour, total carbs, and how many gels to carry.
            </p>
          </a>

          <a
            href="/elevationfinder"
            className="rounded-2xl border border-emerald-100 bg-white/70 p-6 hover:bg-white transition-colors"
          >
            <div className="text-sm font-semibold text-emerald-700">Course</div>
            <div className="mt-2 text-lg font-bold text-gray-900">
              Analyze elevation + hills
            </div>
            <p className="mt-2 text-gray-700">
              Upload a GPX to see elevation gain, grades, and key climbs.
            </p>
          </a>
        </div>
      </section>
    </div>
  );
}

export default RacePageTemplate;
