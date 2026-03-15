import { useMemo } from "react";
import { Helmet } from "react-helmet-async";
import { Navigate, useParams } from "react-router-dom";

import {
  getSeoUrl,
  raceCompareSeoPageMap,
  raceCompareMetaMap,
} from "@/features/seo-pages/seoPages";
import marathonData from "@/data/marathon-data.json";

type MarathonRoute = {
  name: string;
  city: string;
  country: string;
  distance: number;
  elevationGain: number;
  elevationLoss: number;
  description: string;
  raceDate: string;
  website: string;
  tips?: string[];
};

const marathonRoutesData = marathonData as Record<string, MarathonRoute>;

function difficultyLabel(gain: number): string {
  if (gain < 50) return "Very Flat";
  if (gain < 150) return "Mostly Flat";
  if (gain < 300) return "Rolling";
  if (gain < 500) return "Hilly";
  return "Very Hilly";
}

function difficultyColor(gain: number): string {
  if (gain < 50) return "text-emerald-700 bg-emerald-50 border-emerald-200";
  if (gain < 150) return "text-green-700 bg-green-50 border-green-200";
  if (gain < 300) return "text-yellow-700 bg-yellow-50 border-yellow-200";
  if (gain < 500) return "text-orange-700 bg-orange-50 border-orange-200";
  return "text-red-700 bg-red-50 border-red-200";
}

function buildBreadcrumbJsonLd(path: string, label: string) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "TrainPace", item: "https://trainpace.com/" },
      { "@type": "ListItem", position: 2, name: "Race Prep", item: "https://trainpace.com/race" },
      { "@type": "ListItem", position: 3, name: label, item: getSeoUrl(path) },
    ],
  };
}

export default function RaceComparisonPage() {
  const { compareSlug } = useParams();
  const page = compareSlug ? raceCompareSeoPageMap.get(compareSlug) : undefined;
  const meta = compareSlug ? raceCompareMetaMap.get(compareSlug) : undefined;

  if (!page || !meta) return <Navigate to="/race" replace />;

  const race1 = marathonRoutesData[meta.race1Key];
  const race2 = marathonRoutesData[meta.race2Key];

  const jsonLd = useMemo(() => {
    const graph: unknown[] = [
      {
        "@context": "https://schema.org",
        "@type": "WebPage",
        name: page.title,
        description: page.description,
        url: getSeoUrl(page.path),
        isPartOf: { "@type": "WebSite", name: "TrainPace", url: "https://trainpace.com/" },
      },
      buildBreadcrumbJsonLd(page.path, page.h1),
    ];

    if (page.faq?.length) {
      graph.push({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: page.faq.map((q: { question: string; answer: string }) => ({
          "@type": "Question",
          name: q.question,
          acceptedAnswer: { "@type": "Answer", text: q.answer },
        })),
      });
    }

    if (page.howTo) {
      graph.push({
        "@context": "https://schema.org",
        "@type": "HowTo",
        name: page.howTo.name,
        description: page.howTo.description,
        step: page.howTo.steps.map((s: { name: string; text: string }, idx: number) => ({
          "@type": "HowToStep",
          position: idx + 1,
          name: s.name,
          text: s.text,
        })),
      });
    }

    return { "@context": "https://schema.org", "@graph": graph };
  }, [page]);

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

      {/* Hero */}
      <section className="px-4 sm:px-6 pt-10 pb-8">
        <div className="max-w-5xl mx-auto">
          <div className="inline-flex items-center rounded-full border border-orange-200 bg-white/80 px-4 py-2 text-sm font-semibold text-orange-800">
            Course Comparison
          </div>
          <h1 className="mt-4 text-4xl sm:text-5xl font-bold tracking-tight text-gray-900">
            {page.h1}
          </h1>
          <p className="mt-4 text-lg text-gray-700">{page.intro}</p>
        </div>
      </section>

      {/* Side-by-side comparison */}
      <section className="px-4 sm:px-6 pb-10">
        <div className="max-w-5xl mx-auto">
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { raceData: race1, raceMeta: { name: meta.race1Name, slug: meta.race1Slug } },
              { raceData: race2, raceMeta: { name: meta.race2Name, slug: meta.race2Slug } },
            ].map(({ raceData, raceMeta }) => (
              <div
                key={raceMeta.slug}
                className="rounded-3xl border border-orange-100 bg-white/70 p-6 sm:p-8"
              >
                <div className="flex items-start justify-between gap-4">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                    {raceMeta.name}
                  </h2>
                  <a
                    href={`/race/${raceMeta.slug}`}
                    className="shrink-0 inline-flex items-center rounded-lg border border-orange-200 bg-white px-3 py-1.5 text-sm font-semibold text-orange-900 hover:bg-orange-50 transition-colors"
                  >
                    Race Page →
                  </a>
                </div>

                {raceData ? (
                  <>
                    <p className="mt-3 text-sm text-gray-600">
                      {raceData.city}, {raceData.country} · {raceData.raceDate}
                    </p>
                    <p className="mt-3 text-gray-700 text-sm leading-relaxed line-clamp-3">
                      {raceData.description}
                    </p>

                    <div className="mt-5 grid grid-cols-2 gap-3">
                      <div className="rounded-xl border border-orange-100 bg-white p-3">
                        <div className="text-xs font-semibold text-gray-500">Distance</div>
                        <div className="mt-1 text-base font-bold text-gray-900">
                          {raceData.distance.toFixed(2)} km
                        </div>
                      </div>
                      <div className="rounded-xl border border-orange-100 bg-white p-3">
                        <div className="text-xs font-semibold text-gray-500">Elevation Gain</div>
                        <div className="mt-1 text-base font-bold text-gray-900">
                          {Math.round(raceData.elevationGain)} m
                        </div>
                      </div>
                      <div className="rounded-xl border border-orange-100 bg-white p-3">
                        <div className="text-xs font-semibold text-gray-500">Elevation Loss</div>
                        <div className="mt-1 text-base font-bold text-gray-900">
                          {Math.round(raceData.elevationLoss)} m
                        </div>
                      </div>
                      <div className="rounded-xl border border-orange-100 bg-white p-3">
                        <div className="text-xs font-semibold text-gray-500">Difficulty</div>
                        <div className={`mt-1 text-sm font-bold rounded px-2 py-0.5 inline-block border ${difficultyColor(raceData.elevationGain)}`}>
                          {difficultyLabel(raceData.elevationGain)}
                        </div>
                      </div>
                    </div>

                    {raceData.tips && raceData.tips.length > 0 && (
                      <div className="mt-5">
                        <div className="text-sm font-semibold text-gray-700 mb-2">Course Tips</div>
                        <ul className="space-y-1">
                          {raceData.tips.slice(0, 3).map((tip) => (
                            <li key={tip} className="text-sm text-gray-600 flex gap-2">
                              <span className="text-orange-500 shrink-0">·</span>
                              {tip}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="mt-4 text-sm text-gray-500">
                    Detailed course data not yet available. Visit the{" "}
                    <a href={`/race/${raceMeta.slug}`} className="text-orange-700 underline">
                      {raceMeta.name} race page
                    </a>{" "}
                    for prep guides.
                  </p>
                )}
              </div>
            ))}
          </div>

          {/* Verdict bar */}
          {race1 && race2 && (
            <div className="mt-6 rounded-2xl border border-blue-100 bg-white/70 p-6">
              <div className="text-sm font-semibold text-blue-700 mb-3">Quick Verdict</div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="text-center">
                  <div className="text-xs text-gray-500 mb-1">Faster Course</div>
                  <div className="font-bold text-gray-900">
                    {race1.elevationGain <= race2.elevationGain ? meta.race1Name : meta.race2Name}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-gray-500 mb-1">More Challenging</div>
                  <div className="font-bold text-gray-900">
                    {race1.elevationGain >= race2.elevationGain ? meta.race1Name : meta.race2Name}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-gray-500 mb-1">Elevation Gain Gap</div>
                  <div className="font-bold text-gray-900">
                    {Math.abs(Math.round(race1.elevationGain) - Math.round(race2.elevationGain))} m
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* FAQ */}
      {page.faq && page.faq.length > 0 && (
        <section className="px-4 sm:px-6 pb-12">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              {meta.race1Name} vs {meta.race2Name}: Common Questions
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {page.faq.map((item: { question: string; answer: string }) => (
                <div
                  key={item.question}
                  className="rounded-2xl border border-orange-100 bg-white/70 p-5"
                >
                  <div className="font-semibold text-gray-900 mb-2">{item.question}</div>
                  <p className="text-sm text-gray-700 leading-relaxed">{item.answer}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Tool CTAs */}
      <section className="px-4 sm:px-6 pb-16">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Plan Your Race with TrainPace
          </h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <a
              href="/calculator"
              className="rounded-2xl border border-blue-100 bg-white/70 p-6 hover:bg-white transition-colors"
            >
              <div className="text-sm font-semibold text-blue-700">Pacing</div>
              <div className="mt-2 text-lg font-bold text-gray-900">Set training paces</div>
              <p className="mt-2 text-gray-700 text-sm">
                Convert your goal time into Easy, Tempo, Threshold, and Interval zones.
              </p>
            </a>
            <a
              href="/fuel"
              className="rounded-2xl border border-amber-100 bg-white/70 p-6 hover:bg-white transition-colors"
            >
              <div className="text-sm font-semibold text-amber-700">Fueling</div>
              <div className="mt-2 text-lg font-bold text-gray-900">Build a gel schedule</div>
              <p className="mt-2 text-gray-700 text-sm">
                Estimate carbs per hour and how many gels to carry for your race distance.
              </p>
            </a>
            <a
              href="/elevationfinder"
              className="rounded-2xl border border-emerald-100 bg-white/70 p-6 hover:bg-white transition-colors"
            >
              <div className="text-sm font-semibold text-emerald-700">Course</div>
              <div className="mt-2 text-lg font-bold text-gray-900">Analyse elevation</div>
              <p className="mt-2 text-gray-700 text-sm">
                Upload a GPX file to see gain, grades, and key climbs before race day.
              </p>
            </a>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href={`/race/${meta.race1Slug}`}
              className="inline-flex items-center rounded-lg border border-orange-200 bg-white px-4 py-2 text-orange-900 font-semibold hover:bg-orange-50 transition-colors text-sm"
            >
              {meta.race1Name} Race Prep →
            </a>
            <a
              href={`/race/${meta.race2Slug}`}
              className="inline-flex items-center rounded-lg border border-orange-200 bg-white px-4 py-2 text-orange-900 font-semibold hover:bg-orange-50 transition-colors text-sm"
            >
              {meta.race2Name} Race Prep →
            </a>
            <a
              href="/race"
              className="inline-flex items-center rounded-lg border border-gray-200 bg-white px-4 py-2 text-gray-700 font-semibold hover:bg-gray-50 transition-colors text-sm"
            >
              All Race Prep Pages
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
