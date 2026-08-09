import { useCallback, useMemo } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useSearchParams } from "react-router-dom";
import { Globe2 } from "lucide-react";

import {
  GlobeMap,
  RaceDetailPanel,
  RaceList,
  abbottMajors,
  majorRaceById,
  majorRaces,
  useGpxRoute,
} from "@/features/majors";

const PAGE_TITLE = "World Marathon Majors Map – Course Globe | TrainPace";
const PAGE_DESCRIPTION =
  "Spin an interactive globe of the World Marathon Majors. Draw each course from its GPX file and jump to elevation profiles, pacing, and race prep.";
const CANONICAL = "https://trainpace.com/majors";

export default function WorldMajorsGlobe() {
  const [searchParams, setSearchParams] = useSearchParams();

  const requestedId = searchParams.get("race");
  const selectedRace = requestedId ? majorRaceById.get(requestedId) ?? null : null;

  const route = useGpxRoute(selectedRace?.gpxUrl ?? null);

  const handleSelect = useCallback(
    (id: string) => {
      const next = new URLSearchParams(searchParams);
      next.set("race", id);
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams]
  );

  const handleReset = useCallback(() => {
    const next = new URLSearchParams(searchParams);
    next.delete("race");
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);

  const structuredData = useMemo(
    () => ({
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "WebPage",
          name: PAGE_TITLE,
          description: PAGE_DESCRIPTION,
          url: CANONICAL,
          isPartOf: {
            "@type": "WebSite",
            name: "TrainPace",
            url: "https://trainpace.com/",
          },
        },
        {
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
              name: "World Marathon Majors Map",
              item: CANONICAL,
            },
          ],
        },
        {
          "@type": "ItemList",
          name: "Abbott World Marathon Majors",
          itemListElement: abbottMajors.map((race, index) => ({
            "@type": "ListItem",
            position: index + 1,
            item: {
              "@type": "SportsEvent",
              name: race.name,
              sport: "Running",
              url: `https://trainpace.com${race.previewPath}`,
              ...(race.raceDateIso ? { startDate: race.raceDateIso } : {}),
              location: {
                "@type": "Place",
                name: `${race.city}, ${race.country}`,
                address: {
                  "@type": "PostalAddress",
                  addressLocality: race.city,
                  addressCountry: race.country,
                },
              },
            },
          })),
        },
      ],
    }),
    []
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-emerald-50/40 px-4 py-10 text-left sm:px-6">
      <Helmet>
        <title>{PAGE_TITLE}</title>
        <meta name="description" content={PAGE_DESCRIPTION} />
        <link rel="canonical" href={CANONICAL} />
        <meta property="og:title" content={PAGE_TITLE} />
        <meta property="og:description" content={PAGE_DESCRIPTION} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={CANONICAL} />
        <script type="application/ld+json">{JSON.stringify(structuredData)}</script>
      </Helmet>

      <div className="mx-auto max-w-6xl">
        <nav className="text-sm text-slate-500" aria-label="Breadcrumb">
          <ol className="flex items-center gap-2">
            <li>
              <Link to="/" className="hover:text-emerald-600">
                Home
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li className="text-slate-900">World Majors Map</li>
          </ol>
        </nav>

        <header className="mt-4">
          <span className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white">
            <Globe2 className="h-3.5 w-3.5" aria-hidden="true" />
            Interactive globe
          </span>
          <h1 className="mt-3 font-display text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            World Marathon Majors, on a globe
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-slate-700">
            Every course on this map is drawn from a GPX file. Spin the globe,
            pick a race, and it flies to the city and traces the route — then
            step into the full elevation profile, pacing, and fueling plan.
          </p>

          <ul className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-slate-600">
            <li className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 rounded-full bg-emerald-500"
                aria-hidden="true"
              />
              Abbott World Marathon Major
            </li>
            <li className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 rounded-full bg-amber-400"
                aria-hidden="true"
              />
              Featured course
            </li>
            <li className="font-display tabular-nums">
              {majorRaces.length} courses mapped
            </li>
          </ul>
          <p className="mt-2 text-xs text-slate-500">
            Majors stay pinned on the globe; featured courses appear as you zoom
            in, and the list on the left always selects exactly one.
          </p>
        </header>

        <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)]">
          <section
            aria-label="Course globe"
            className="relative h-[380px] sm:h-[480px] lg:col-start-2 lg:row-start-1 lg:h-[540px]"
          >
            <GlobeMap
              races={majorRaces}
              selectedRace={selectedRace}
              routePoints={route.points}
              routeStatus={route.status}
              routeError={route.error}
              onSelectRace={handleSelect}
            />
            {selectedRace && (
              <button
                type="button"
                onClick={handleReset}
                className="absolute left-3 top-3 rounded-lg bg-white/90 px-3 py-1.5 text-sm font-semibold text-slate-800 shadow-lg backdrop-blur transition-colors hover:bg-white"
              >
                ← Back to globe
              </button>
            )}
          </section>

          <div className="lg:col-start-2 lg:row-start-2">
            <RaceDetailPanel
              race={selectedRace}
              routeStatus={route.status}
              pointCount={route.points.length}
            />
          </div>

          <aside className="lg:col-start-1 lg:row-start-1 lg:row-span-2">
            <RaceList
              races={majorRaces}
              selectedId={selectedRace?.id ?? null}
              onSelect={handleSelect}
            />
          </aside>
        </div>

        <section className="mt-10 rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="font-display text-xl font-bold text-slate-900">
            Turn a course into a race plan
          </h2>
          <p className="mt-2 max-w-2xl text-slate-700">
            The globe is the overview. When you have picked your race, these
            tools do the work: paces from your goal time, a fueling schedule you
            can rehearse, and hill-by-hill course analysis from any GPX.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              to="/calculator"
              className="rounded-lg bg-emerald-600 px-5 py-3 font-semibold text-white transition-colors hover:bg-emerald-700"
            >
              Pace Calculator
            </Link>
            <Link
              to="/fuel"
              className="rounded-lg bg-amber-600 px-5 py-3 font-semibold text-white transition-colors hover:bg-amber-700"
            >
              Fuel Planner
            </Link>
            <Link
              to="/elevation-finder"
              className="rounded-lg border border-slate-200 px-5 py-3 font-semibold text-slate-700 transition-colors hover:bg-slate-50"
            >
              Analyze your own GPX
            </Link>
            <Link
              to="/race"
              className="rounded-lg border border-slate-200 px-5 py-3 font-semibold text-slate-700 transition-colors hover:bg-slate-50"
            >
              All race prep pages
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
