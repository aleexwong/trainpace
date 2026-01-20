import { Helmet } from "react-helmet-async";

import { raceSeoPages } from "@/features/seo-pages/seoPages";
import marathonData from "@/data/marathon-data.json";

type MarathonPreviewRoute = {
  name: string;
  city: string;
  country: string;
  distance: number;
  elevationGain: number;
  elevationLoss: number;
  raceDate: string;
  description: string;
  website: string;
};

const marathonRoutesData = marathonData as Record<string, MarathonPreviewRoute>;

const featuredPreviewRoutes: Array<{ previewKey: string; raceSlug: string }> = [
  { previewKey: "boston", raceSlug: "boston-marathon" },
  { previewKey: "nyc", raceSlug: "nyc-marathon" },
  { previewKey: "chicago", raceSlug: "chicago-marathon" },
  { previewKey: "berlin", raceSlug: "berlin-marathon" },
  { previewKey: "london", raceSlug: "london-marathon" },
  { previewKey: "tokyo", raceSlug: "tokyo-marathon" },
  { previewKey: "sydney", raceSlug: "sydney-marathon" },
];

export default function RaceIndex() {
  const featured = raceSeoPages.slice(0, 36);

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-white to-orange-50 px-4 sm:px-6 py-10">
      <Helmet>
        <title>Race Prep Pages - Pacing, Fueling, Elevation | TrainPace</title>
        <meta
          name="description"
          content="Race prep pages for popular running events. Get pacing targets, fueling basics, and course elevation strategy using TrainPace free tools."
        />
        <link rel="canonical" href="https://trainpace.com/race" />
      </Helmet>

      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-gray-900">
          Race Prep Pages
        </h1>
        <p className="mt-4 text-lg text-gray-700">
          Pick a race to get a simple plan: pacing, fueling, and course strategy.
        </p>

        <div className="mt-8 rounded-3xl border border-orange-100 bg-white/70 p-6">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
            Featured Course Data
          </h2>
          <p className="mt-2 text-gray-700">
            These races include real course coordinates, elevation stats, and pacing/fueling notes.
          </p>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {featuredPreviewRoutes.map(({ previewKey, raceSlug }) => {
              const route = marathonRoutesData[previewKey];
              if (!route) return null;

              return (
                <a
                  key={previewKey}
                  href={`/race/${raceSlug}`}
                  className="rounded-2xl border border-orange-100 bg-white p-5 hover:bg-orange-50 transition-colors"
                >
                  <div className="text-sm font-semibold text-orange-800">Course-backed</div>
                  <div className="mt-1 text-lg font-bold text-gray-900">{route.name}</div>
                  <div className="mt-2 text-sm text-gray-700">
                    {route.city}, {route.country}
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
                    <div className="rounded-lg bg-orange-50 border border-orange-100 px-3 py-2">
                      <div className="text-xs font-semibold text-gray-500">Km</div>
                      <div className="font-bold text-gray-900">{route.distance.toFixed(1)}</div>
                    </div>
                    <div className="rounded-lg bg-orange-50 border border-orange-100 px-3 py-2">
                      <div className="text-xs font-semibold text-gray-500">Gain</div>
                      <div className="font-bold text-gray-900">{route.elevationGain}m</div>
                    </div>
                    <div className="rounded-lg bg-orange-50 border border-orange-100 px-3 py-2">
                      <div className="text-xs font-semibold text-gray-500">Loss</div>
                      <div className="font-bold text-gray-900">{route.elevationLoss}m</div>
                    </div>
                  </div>
                </a>
              );
            })}
          </div>
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((p) => (
            <a
              key={p.slug}
              href={p.path}
              className="rounded-2xl border border-orange-100 bg-white/70 p-5 hover:bg-white transition-colors"
            >
              <div className="text-sm font-semibold text-orange-800">Race Prep</div>
              <div className="mt-1 text-lg font-bold text-gray-900">{p.h1}</div>
              <div className="mt-2 text-sm text-gray-700 line-clamp-2">
                {p.description}
              </div>
            </a>
          ))}
        </div>

        <div className="mt-10 rounded-2xl border border-orange-100 bg-white/70 p-6">
          <h2 className="text-xl font-bold text-gray-900">Want a specific race?</h2>
          <p className="mt-2 text-gray-700">
            If you don't see it here, try the core tools and upload a GPX for
            course analysis.
          </p>
          <div className="mt-4 flex flex-col sm:flex-row gap-3">
            <a
              href="/calculator"
              className="inline-flex justify-center rounded-lg bg-blue-700 px-5 py-3 text-white font-semibold hover:bg-blue-800 transition-colors"
            >
              Pace Calculator
            </a>
            <a
              href="/fuel"
              className="inline-flex justify-center rounded-lg bg-amber-700 px-5 py-3 text-white font-semibold hover:bg-amber-800 transition-colors"
            >
              Fuel Planner
            </a>
            <a
              href="/elevationfinder"
              className="inline-flex justify-center rounded-lg bg-emerald-700 px-5 py-3 text-white font-semibold hover:bg-emerald-800 transition-colors"
            >
              ElevationFinder
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
