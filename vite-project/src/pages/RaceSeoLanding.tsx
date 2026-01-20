import { useMemo } from "react";
import { Helmet } from "react-helmet-async";
import { Navigate, useParams } from "react-router-dom";

import { getSeoUrl, raceSeoPageMap } from "@/features/seo-pages/seoPages";
import marathonData from "@/data/marathon-data.json";
import LeafletRoutePreview from "@/components/utils/LeafletRoutePreview";

type MarathonPreviewRoute = {
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
  tips: string[];
  fuelingNotes?: string;
  faq?: Array<{ question: string; answer: string }>;
  thumbnailPoints: Array<{ lat: number; lng: number; ele?: number; dist?: number }>;
};

const marathonRoutesData = marathonData as Record<string, MarathonPreviewRoute>;

function buildBreadcrumbJsonLd(path: string, label: string) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "TrainPace",
        item: "https://trainpace.com/",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Race Prep",
        item: "https://trainpace.com/race",
      },
      {
        "@type": "ListItem",
        position: 3,
        name: label,
        item: getSeoUrl(path),
      },
    ],
  };
}

export default function RaceSeoLanding() {
  const { raceSlug } = useParams();

  const page = raceSlug ? raceSeoPageMap.get(raceSlug) : undefined;
  if (!page) return <Navigate to="/" replace />;

  const previewRoute = page.previewRouteKey
    ? marathonRoutesData[page.previewRouteKey]
    : undefined;

  const jsonLd = useMemo(() => {
    const graph: unknown[] = [
      {
        "@context": "https://schema.org",
        "@type": "WebPage",
        name: page.title,
        description: page.description,
        url: getSeoUrl(page.path),
        isPartOf: {
          "@type": "WebSite",
          name: "TrainPace",
          url: "https://trainpace.com/",
        },
      },
      buildBreadcrumbJsonLd(page.path, page.h1),
    ];

    if (previewRoute) {
      graph.push({
        "@context": "https://schema.org",
        "@type": "SportsEvent",
        name: previewRoute.name,
        description: previewRoute.description,
        url: previewRoute.website,
        startDate: previewRoute.raceDate,
        sport: "Running",
        location: {
          "@type": "Place",
          name: `${previewRoute.city}, ${previewRoute.country}`,
          address: {
            "@type": "PostalAddress",
            addressLocality: previewRoute.city,
            addressCountry: previewRoute.country,
          },
        },
        eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
      });
    }

    if (page.howTo) {
      graph.push({
        "@context": "https://schema.org",
        "@type": "HowTo",
        name: page.howTo.name,
        description: page.howTo.description,
        totalTime: "PT5M",
        tool: {
          "@type": "HowToTool",
          name: "TrainPace",
        },
        step: page.howTo.steps.map((s: { name: string; text: string }, idx: number) => ({
          "@type": "HowToStep",
          position: idx + 1,
          name: s.name,
          text: s.text,
        })),
      });
    }

    const faqItems =
      page.faq?.length
        ? page.faq
        : previewRoute?.faq?.length
          ? previewRoute.faq
          : undefined;

    if (faqItems?.length) {
      graph.push({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faqItems.map((q: { question: string; answer: string }) => ({
          "@type": "Question",
          name: q.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: q.answer,
          },
        })),
      });
    }

    return {
      "@context": "https://schema.org",
      "@graph": graph,
    };
  }, [page, previewRoute]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-white to-orange-50">
      <Helmet>
        <title>{page.title}</title>
        <meta name="description" content={page.description} />
        <link rel="canonical" href={getSeoUrl(page.path)} />
        <meta property="og:title" content={page.title} />
        <meta property="og:description" content={page.description} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={getSeoUrl(page.path)} />
        <meta property="og:image" content="https://trainpace.com/landing-page-2025.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={page.title} />
        <meta name="twitter:description" content={page.description} />
        <meta name="twitter:image" content="https://trainpace.com/landing-page-2025.png" />
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>

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
            {page.bullets.map((b: string) => (
              <div
                key={b}
                className="rounded-lg bg-white/70 border border-orange-100 px-4 py-3 text-gray-800"
              >
                {b}
              </div>
            ))}
          </div>
        </div>
      </section>

      {previewRoute && (
        <section className="px-4 sm:px-6 pb-10">
          <div className="max-w-5xl mx-auto">
            <div className="rounded-3xl border border-orange-100 bg-white/70 overflow-hidden">
              <div className="p-6 sm:p-8">
                <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                  <div>
                    <div className="text-sm font-semibold text-orange-800">
                      Featured Course Data
                    </div>
                    <h2 className="mt-2 text-2xl sm:text-3xl font-bold text-gray-900">
                      {previewRoute.name}
                    </h2>
                    <p className="mt-2 text-gray-700">
                      {previewRoute.city}, {previewRoute.country} - {previewRoute.raceDate}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <a
                      href={`/preview-route/${page.previewRouteKey}`}
                      className="inline-flex items-center rounded-lg bg-gray-900 px-4 py-2 text-white font-semibold hover:bg-black transition-colors"
                    >
                      Full Course Page
                    </a>
                    <a
                      href={previewRoute.website}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center rounded-lg border border-orange-200 bg-white px-4 py-2 text-orange-900 font-semibold hover:bg-orange-50 transition-colors"
                    >
                      Official Site
                    </a>
                  </div>
                </div>

                <p className="mt-4 text-gray-700 leading-relaxed">
                  {previewRoute.description}
                </p>

                <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-2xl border border-orange-100 bg-white p-4">
                    <div className="text-xs font-semibold text-gray-500">Distance</div>
                    <div className="mt-1 text-lg font-bold text-gray-900">
                      {previewRoute.distance.toFixed(2)} km
                    </div>
                  </div>
                  <div className="rounded-2xl border border-orange-100 bg-white p-4">
                    <div className="text-xs font-semibold text-gray-500">Elevation Gain</div>
                    <div className="mt-1 text-lg font-bold text-gray-900">
                      {previewRoute.elevationGain} m
                    </div>
                  </div>
                  <div className="rounded-2xl border border-orange-100 bg-white p-4">
                    <div className="text-xs font-semibold text-gray-500">Elevation Loss</div>
                    <div className="mt-1 text-lg font-bold text-gray-900">
                      {previewRoute.elevationLoss} m
                    </div>
                  </div>
                  <div className="rounded-2xl border border-orange-100 bg-white p-4">
                    <div className="text-xs font-semibold text-gray-500">Start / Finish</div>
                    <div className="mt-1 text-lg font-bold text-gray-900">
                      {previewRoute.startElevation}m - {previewRoute.endElevation}m
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-orange-100 bg-white">
                <LeafletRoutePreview
                  routePoints={previewRoute.thumbnailPoints}
                  height="320px"
                  interactive={false}
                  lineColor="#c2410c"
                  lineWidth={4}
                  showStartEnd={true}
                />
              </div>

              {(previewRoute.tips?.length || previewRoute.fuelingNotes) && (
                <div className="p-6 sm:p-8 border-t border-orange-100">
                  <div className="grid gap-6 lg:grid-cols-2">
                    {previewRoute.tips?.length ? (
                      <div className="rounded-2xl border border-orange-100 bg-white p-6">
                        <h3 className="text-lg font-bold text-gray-900">Quick Tips</h3>
                        <div className="mt-3 space-y-2">
                          {previewRoute.tips.slice(0, 6).map((t) => (
                            <div key={t} className="text-gray-700">
                              {t}
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    {previewRoute.fuelingNotes ? (
                      <div className="rounded-2xl border border-orange-100 bg-white p-6">
                        <h3 className="text-lg font-bold text-gray-900">Fueling Note</h3>
                        <p className="mt-3 text-gray-700 leading-relaxed">
                          {previewRoute.fuelingNotes}
                        </p>
                        <div className="mt-4">
                          <a
                            href="/fuel"
                            className="inline-flex items-center rounded-lg bg-amber-700 px-4 py-2 text-white font-semibold hover:bg-amber-800 transition-colors"
                          >
                            Build a Fuel Plan
                          </a>
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

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
