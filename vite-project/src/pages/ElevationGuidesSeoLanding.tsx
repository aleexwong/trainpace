import { useMemo } from "react";
import { Helmet } from "react-helmet-async";
import { Navigate, useParams } from "react-router-dom";

import {
  elevationGuideSeoPageMap,
  getSeoUrl,
} from "@/features/seo-pages/seoPages";

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
        name: "ElevationFinder",
        item: "https://trainpace.com/elevationfinder",
      },
      {
        "@type": "ListItem",
        position: 3,
        name: "Guides",
        item: "https://trainpace.com/elevationfinder/guides",
      },
      {
        "@type": "ListItem",
        position: 4,
        name: label,
        item: getSeoUrl(path),
      },
    ],
  };
}

export default function ElevationGuidesSeoLanding() {
  const { seoSlug } = useParams();

  const page = seoSlug ? elevationGuideSeoPageMap.get(seoSlug) : undefined;
  if (!page) return <Navigate to="/elevationfinder" replace />;

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

    if (page.howTo) {
      graph.push({
        "@context": "https://schema.org",
        "@type": "HowTo",
        name: page.howTo.name,
        description: page.howTo.description,
        totalTime: "PT1M",
        tool: {
          "@type": "HowToTool",
          name: "TrainPace ElevationFinder",
        },
        step: page.howTo.steps.map((s, idx) => ({
          "@type": "HowToStep",
          position: idx + 1,
          name: s.name,
          text: s.text,
        })),
      });
    }

    if (page.faq?.length) {
      graph.push({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: page.faq.map((q) => ({
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
  }, [page]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-sky-50">
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

      <section className="px-4 sm:px-6 pt-10 pb-16">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-gray-900">
            {page.h1}
          </h1>
          <p className="mt-4 text-lg text-gray-700">{page.intro}</p>

          <div className="mt-6 grid gap-2">
            {page.bullets.map((b) => (
              <div
                key={b}
                className="rounded-lg bg-white/70 border border-emerald-100 px-4 py-3 text-gray-800"
              >
                {b}
              </div>
            ))}
          </div>

          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <a
              href={page.cta.href}
              className="inline-flex justify-center rounded-lg bg-emerald-700 px-5 py-3 text-white font-semibold shadow hover:bg-emerald-800 transition-colors"
            >
              {page.cta.label}
            </a>
            <a
              href="/preview-route/boston"
              className="inline-flex justify-center rounded-lg border border-emerald-200 bg-white px-5 py-3 text-emerald-800 font-semibold hover:bg-emerald-50 transition-colors"
            >
              See a Marathon Example
            </a>
          </div>

          <div className="mt-8 rounded-2xl border border-emerald-100 bg-white/70 p-6">
            <h2 className="text-xl font-semibold text-gray-900">Next step</h2>
            <p className="mt-2 text-gray-700">
              Upload your GPX route to get an interactive elevation profile,
              grade breakdown, and climb difficulty.
            </p>
            <div className="mt-4">
              <a
                href="/elevationfinder"
                className="inline-flex items-center rounded-lg bg-gray-900 px-4 py-2 text-white font-semibold hover:bg-black transition-colors"
              >
                Open ElevationFinder
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
