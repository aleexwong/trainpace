import { useMemo } from "react";
import { Helmet } from "react-helmet-async";
import { Navigate, useParams } from "react-router-dom";

import { TrainingPlanGenerator } from "@/features/plan";
import { planSeoPages, getSeoUrl } from "@/features/seo-pages/seoPages";

const planSeoPageMap = new Map(planSeoPages.map((p) => [p.slug, p]));

function buildBreadcrumbJsonLd(path: string, label: string) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "TrainPace", item: "https://trainpace.com/" },
      { "@type": "ListItem", position: 2, name: "Training Plan", item: "https://trainpace.com/plan" },
      { "@type": "ListItem", position: 3, name: label, item: getSeoUrl(path) },
    ],
  };
}

export default function PlanSeoLanding() {
  const { seoSlug } = useParams();
  const page = seoSlug ? planSeoPageMap.get(seoSlug) : undefined;

  const jsonLd = useMemo(() => {
    if (!page) return {};
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
        mainEntity: page.faq.map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: { "@type": "Answer", text: item.answer },
        })),
      });
    }

    if (page.howTo) {
      graph.push({
        "@context": "https://schema.org",
        "@type": "HowTo",
        name: page.howTo.name,
        description: page.howTo.description,
        step: page.howTo.steps.map((step, i) => ({
          "@type": "HowToStep",
          position: i + 1,
          name: step.name,
          text: step.text,
        })),
      });
    }

    return { "@context": "https://schema.org", "@graph": graph };
  }, [page]);

  if (!page) return <Navigate to="/plan" replace />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
      <Helmet>
        <title>{page.title}</title>
        <meta name="description" content={page.description} />
        <link rel="canonical" href={getSeoUrl(page.path)} />
        <meta property="og:title" content={page.title} />
        <meta property="og:description" content={page.description} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={getSeoUrl(page.path)} />
        <meta name="twitter:card" content="summary_large_image" />
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>

      {/* Breadcrumb */}
      <nav className="px-4 sm:px-6 pt-4" aria-label="Breadcrumb">
        <ol className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
          <li><a href="/" className="hover:text-gray-900 hover:underline">Home</a></li>
          <li className="text-gray-400">/</li>
          <li><a href="/plan" className="hover:text-gray-900 hover:underline">Training Plan</a></li>
          <li className="text-gray-400">/</li>
          <li className="text-gray-900 font-medium">{page.h1}</li>
        </ol>
      </nav>

      {/* Hero */}
      <section className="px-4 sm:px-6 pt-10 pb-8">
        <div className="max-w-4xl mx-auto">
          <div className="inline-flex items-center rounded-full border border-emerald-200 bg-white/80 px-4 py-2 text-sm font-semibold text-emerald-800">
            Free Training Plan Generator
          </div>
          <h1 className="mt-4 text-4xl sm:text-5xl font-bold tracking-tight text-gray-900">
            {page.h1}
          </h1>
          <p className="mt-4 text-lg text-gray-700">{page.intro}</p>
          <div className="mt-6 grid gap-2">
            {page.bullets.map((bullet) => (
              <div key={bullet} className="rounded-lg bg-white/70 border border-emerald-100 px-4 py-3 text-gray-800">
                {bullet}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tool */}
      <section className="px-4 sm:px-6 pb-12">
        <div className="max-w-7xl mx-auto">
          <TrainingPlanGenerator />
        </div>
      </section>

      {/* FAQ */}
      {page.faq && page.faq.length > 0 && (
        <section className="px-4 sm:px-6 py-12 bg-white/50">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Frequently Asked Questions</h2>
            <div className="space-y-4">
              {page.faq.map((item, i) => (
                <div key={i} className="rounded-xl bg-white border border-emerald-100 p-6">
                  <h3 className="text-lg font-semibold text-gray-900">{item.question}</h3>
                  <p className="mt-2 text-gray-700">{item.answer}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Cross-tool links */}
      <section className="px-4 sm:px-6 pb-16">
        <div className="max-w-5xl mx-auto grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <a href="/calculator" className="rounded-2xl border border-emerald-100 bg-white/70 p-6 hover:bg-white transition-colors">
            <div className="text-sm font-semibold text-emerald-700">Pacing</div>
            <div className="mt-2 text-lg font-bold text-gray-900">Training paces</div>
            <p className="mt-2 text-gray-700 text-sm">Convert any race time into Easy, Tempo, and Interval zones.</p>
          </a>
          <a href="/vdot" className="rounded-2xl border border-emerald-100 bg-white/70 p-6 hover:bg-white transition-colors">
            <div className="text-sm font-semibold text-emerald-700">VDOT</div>
            <div className="mt-2 text-lg font-bold text-gray-900">VDOT score</div>
            <p className="mt-2 text-gray-700 text-sm">Get your VDOT score and predict finish times for any race distance.</p>
          </a>
          <a href="/fuel" className="rounded-2xl border border-amber-100 bg-white/70 p-6 hover:bg-white transition-colors">
            <div className="text-sm font-semibold text-amber-700">Fueling</div>
            <div className="mt-2 text-lg font-bold text-gray-900">Gel schedule</div>
            <p className="mt-2 text-gray-700 text-sm">Estimate carbs/hour, total carbs, and how many gels to carry.</p>
          </a>
          <a href="/elevation-finder" className="rounded-2xl border border-emerald-100 bg-white/70 p-6 hover:bg-white transition-colors">
            <div className="text-sm font-semibold text-emerald-700">Course</div>
            <div className="mt-2 text-lg font-bold text-gray-900">Elevation analysis</div>
            <p className="mt-2 text-gray-700 text-sm">Upload a GPX to see elevation gain, grades, and key climbs.</p>
          </a>
        </div>
      </section>
    </div>
  );
}
