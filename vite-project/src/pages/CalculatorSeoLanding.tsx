import { useMemo } from "react";
import { Helmet } from "react-helmet-async";
import { Navigate, useParams } from "react-router-dom";

import { PaceCalculatorV2 } from "@/features/pace-calculator";
import {
  calculatorSeoPageMap,
} from "@/features/seo-pages/seoPages";
import {
  generateMetaTags,
  generateSchemaGraph,
  generateBreadcrumbs,
} from "@/lib/seo";
import { BreadcrumbNav } from "@/components/seo";

export default function CalculatorSeoLanding() {
  const { seoSlug } = useParams();

  const page = seoSlug ? calculatorSeoPageMap.get(seoSlug) : undefined;
  if (!page) return <Navigate to="/calculator" replace />;

  const meta = useMemo(() => generateMetaTags(page), [page]);
  const schema = useMemo(() => generateSchemaGraph(page), [page]);
  const breadcrumbs = useMemo(() => generateBreadcrumbs(page), [page]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
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
      <BreadcrumbNav items={breadcrumbs} />

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
                className="rounded-lg bg-white/70 border border-blue-100 px-4 py-3 text-gray-800"
              >
                {b}
              </div>
            ))}
          </div>
          <div className="mt-6">
            <a
              href={page.cta.href}
              className="inline-flex items-center rounded-lg bg-blue-700 px-5 py-3 text-white font-semibold shadow hover:bg-blue-800 transition-colors"
            >
              {page.cta.label}
            </a>
          </div>
        </div>
      </section>

      <section className="px-4 sm:px-6 pb-16">
        <div className="max-w-7xl mx-auto">
          <PaceCalculatorV2
            seoMode="none"
            initialInputs={
              page.initialInputs?.distance
                ? { distance: String(page.initialInputs.distance), units: "km" }
                : undefined
            }
          />
        </div>
      </section>
    </div>
  );
}
