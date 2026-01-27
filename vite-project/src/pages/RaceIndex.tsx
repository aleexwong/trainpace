import { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Search } from "lucide-react";
import { doc, getDoc } from "firebase/firestore";

import { raceSeoPages } from "@/features/seo-pages/seoPages";
import marathonData from "@/data/marathon-data.json";
import { db } from "@/lib/firebase";
import { getCurrentDocumentId } from "@/config/routes";

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
  slug: string;
  thumbnailPoints?: Array<{
    lat: number;
    lng: number;
    ele?: number;
    dist?: number;
  }>;
};

const marathonRoutesData = marathonData as Record<string, MarathonPreviewRoute>;

type FeaturedRouteLink = {
  previewKey: string;
  path: string;
  order: number;
};

type FeaturedRaceDoc = {
  staticRouteData?: {
    routeName?: string;
    totalDistance?: number;
    totalElevationGain?: number;
    totalElevationLoss?: number;
    raceDate?: string;
    city?: string;
    country?: string;
    description?: string;
    website?: string;
    elevationProfile?: Array<{ elevation: number }>;
  };
  metadata?: {
    routeName?: string;
    totalDistance?: number;
    elevationGain?: number;
    elevationLoss?: number;
  };
  thumbnailPoints?: Array<{ lat: number; lng: number; ele?: number; dist?: number }>;
  displayPoints?: Array<{ lat: number; lng: number; ele?: number; dist?: number }>;
  raceDate?: string;
  city?: string;
  country?: string;
  description?: string;
  website?: string;
};

const defaultFeaturedRoutes: FeaturedRouteLink[] = [
  { previewKey: "boston", path: "/race/boston-marathon", order: 1 },
  { previewKey: "nyc", path: "/race/nyc-marathon", order: 2 },
  { previewKey: "chicago", path: "/race/chicago-marathon", order: 3 },
  { previewKey: "berlin", path: "/race/berlin-marathon", order: 4 },
  { previewKey: "london", path: "/race/london-marathon", order: 5 },
  { previewKey: "tokyo", path: "/race/tokyo-marathon", order: 6 },
  { previewKey: "sydney", path: "/race/sydney-marathon", order: 7 },
];

export default function RaceIndex() {
  const [searchQuery, setSearchQuery] = useState("");
  const [featuredSource, setFeaturedSource] = useState<"fallback" | "firebase">(
    "fallback"
  );
  const [featuredError, setFeaturedError] = useState<string | null>(null);
  const [featuredOverrides, setFeaturedOverrides] = useState<
    Record<string, Partial<MarathonPreviewRoute>>
  >({});

  const formatWholeNumber = (value: unknown) => {
    const num = Number(value);
    if (!Number.isFinite(num)) return "0";
    return String(Math.round(num));
  };

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const isSearching = normalizedQuery.length > 0;

  useEffect(() => {
    let cancelled = false;

    const loadFeaturedRoutes = async () => {
      try {
        setFeaturedError(null);
        const results = await Promise.all(
          defaultFeaturedRoutes.map(async ({ previewKey }) => {
            const baseRoute = marathonRoutesData[previewKey];
            if (!baseRoute?.slug) return null;

            const resolvedId = getCurrentDocumentId(baseRoute.slug);
            const ref = doc(db, "gpx_uploads", resolvedId);
            const snap = await getDoc(ref);
            if (!snap.exists()) return null;

            const data = snap.data() as FeaturedRaceDoc;
            const staticData = data.staticRouteData;
            const meta = data.metadata;

            const overrides: Partial<MarathonPreviewRoute> = {
              distance: staticData?.totalDistance ?? meta?.totalDistance,
              elevationGain:
                staticData?.totalElevationGain ?? meta?.elevationGain,
              elevationLoss:
                staticData?.totalElevationLoss ?? meta?.elevationLoss,
              raceDate: data.raceDate ?? staticData?.raceDate,
              description: data.description ?? staticData?.description,
              website: data.website ?? staticData?.website,
              thumbnailPoints:
                data.thumbnailPoints?.length
                  ? data.thumbnailPoints
                  : data.displayPoints?.length
                    ? data.displayPoints
                    : undefined,
            };

            return { previewKey, overrides };
          })
        );

        if (cancelled) return;

        const nextOverrides: Record<string, Partial<MarathonPreviewRoute>> = {};
        let successCount = 0;

        results.forEach((result) => {
          if (!result) return;
          nextOverrides[result.previewKey] = result.overrides;
          successCount += 1;
        });

        if (successCount > 0) {
          setFeaturedOverrides(nextOverrides);
          setFeaturedSource("firebase");
        } else {
          setFeaturedSource("fallback");
        }
      } catch (err) {
        console.error("Failed to load featured races from Firestore:", err);
        if (!cancelled) {
          setFeaturedSource("fallback");
          setFeaturedError(err instanceof Error ? err.message : "Unknown error");
        }
      }
    };

    loadFeaturedRoutes();

    return () => {
      cancelled = true;
    };
  }, []);

  const displayedRaces = useMemo(() => {
    if (!normalizedQuery) {
      return raceSeoPages.slice(0, 36);
    }

    return raceSeoPages.filter((page) => {
      const haystacks = [page.h1, page.slug, page.description];
      return haystacks.some((value) => value.toLowerCase().includes(normalizedQuery));
    });
  }, [normalizedQuery]);

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

        {/* Search */}
        <div className="mt-8 rounded-2xl border border-orange-100 bg-white/80 p-4 sm:p-5">
          <label
            htmlFor="race-search"
            className="block text-sm font-semibold text-gray-900 mb-2"
          >
            Search Races
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              id="race-search"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Try: Boston, half marathon, Chicago..."
              className="w-full pl-10 pr-4 py-3 border border-orange-200 rounded-xl focus:ring-2 focus:ring-orange-400 focus:border-orange-400 outline-none bg-white"
            />
          </div>
          {isSearching && (
            <p className="mt-2 text-xs text-gray-600">
              {displayedRaces.length} result{displayedRaces.length === 1 ? "" : "s"}
            </p>
          )}
        </div>

        {!isSearching && (
          <div className="mt-8 rounded-3xl border border-orange-100 bg-white/70 p-6">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
              Featured Course Data
            </h2>
            <p className="mt-2 text-gray-700">
              These races include real course coordinates, elevation stats, and pacing/fueling notes.
            </p>
            <p className="mt-2 text-xs text-gray-500">
              Featured source: {featuredSource === "firebase" ? "Firebase" : "Local fallback"}
              {featuredError ? " (Firebase read failed)" : ""}
            </p>

            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {defaultFeaturedRoutes.map(({ previewKey, path }) => {
                const baseRoute = marathonRoutesData[previewKey];
                if (!baseRoute) return null;
                const route = featuredOverrides[previewKey]
                  ? { ...baseRoute, ...featuredOverrides[previewKey] }
                  : baseRoute;

                return (
                  <a
                    key={previewKey}
                    href={path}
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
                        <div className="font-bold text-gray-900">
                          {formatWholeNumber(route.distance)}
                        </div>
                      </div>
                      <div className="rounded-lg bg-orange-50 border border-orange-100 px-3 py-2">
                        <div className="text-xs font-semibold text-gray-500">Gain</div>
                        <div className="font-bold text-gray-900">
                          {formatWholeNumber(route.elevationGain)}m
                        </div>
                      </div>
                      <div className="rounded-lg bg-orange-50 border border-orange-100 px-3 py-2">
                        <div className="text-xs font-semibold text-gray-500">Loss</div>
                        <div className="font-bold text-gray-900">
                          {formatWholeNumber(route.elevationLoss)}m
                        </div>
                      </div>
                    </div>
                  </a>
                );
              })}
            </div>
          </div>
        )}

        <div className="mt-8 flex items-baseline justify-between gap-3">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
            {isSearching ? "Search Results" : "Popular Race Prep Pages"}
          </h2>
          <div className="text-xs text-gray-600">
            {displayedRaces.length} page{displayedRaces.length === 1 ? "" : "s"}
          </div>
        </div>

        {displayedRaces.length > 0 ? (
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {displayedRaces.map((p) => (
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
        ) : (
          <div className="mt-4 rounded-2xl border border-orange-100 bg-white/80 p-6 text-center">
            <div className="text-lg font-semibold text-gray-900">No races found</div>
            <p className="mt-1 text-sm text-gray-600">
              Try a city name, distance, or a major marathon.
            </p>
          </div>
        )}

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
