import { useMemo } from "react";
import { Helmet } from "react-helmet-async";
import { Navigate, useParams } from "react-router-dom";

import { FuelPlannerV2 } from "@/features/fuel";
import { fuelSeoPageMap, getSeoUrl } from "@/features/seo-pages/seoPages";

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
        name: "Fuel Planner",
        item: "https://trainpace.com/fuel",
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

export default function FuelSeoLanding() {
  const { seoSlug } = useParams();

  const page = seoSlug ? fuelSeoPageMap.get(seoSlug) : undefined;
  if (!page) return <Navigate to="/fuel" replace />;

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
          name: "TrainPace Fuel Planner",
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
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-rose-50">
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
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-gray-900">
            {page.h1}
          </h1>
          <p className="mt-4 text-lg text-gray-700">{page.intro}</p>
          <div className="mt-6 grid gap-2">
            {page.bullets.map((b) => (
              <div
                key={b}
                className="rounded-lg bg-white/70 border border-amber-100 px-4 py-3 text-gray-800"
              >
                {b}
              </div>
            ))}
          </div>
          <div className="mt-6">
            <a
              href={page.cta.href}
              className="inline-flex items-center rounded-lg bg-amber-700 px-5 py-3 text-white font-semibold shadow hover:bg-amber-800 transition-colors"
            >
              {page.cta.label}
            </a>
          </div>
        </div>
      </section>

      <section className="px-4 sm:px-6 pb-16">
        <div className="max-w-7xl mx-auto">
          <FuelPlannerV2 seoMode="none" />
        </div>
      </section>
    </div>
  );
}
