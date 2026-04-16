import { Helmet } from "react-helmet-async";
import WorldRaceMap from "@/components/WorldRaceMap";
import { worldRaceCount } from "@/data/world-races";

export default function WorldRaceMapPage() {
  return (
    <>
      <Helmet>
        <title>{`World Race Map - Explore ${worldRaceCount}+ Running Races | TrainPace`}</title>
        <meta
          name="description"
          content={`Explore ${worldRaceCount}+ running races worldwide on an interactive map. Find marathons, half marathons, and more across 6 continents. Filter by region, tier, and distance.`}
        />
      </Helmet>

      <div className="flex flex-col" style={{ height: "calc(100vh - 64px)" }}>
        {/* Header */}
        <div className="px-6 pt-6 pb-4">
          <h1 className="text-2xl font-bold text-gray-900">World Race Map</h1>
          <p className="text-gray-500 mt-1">
            Explore {worldRaceCount}+ running races across 6 continents. Click a
            pin to view race details.
          </p>
        </div>

        {/* Map fills remaining space */}
        <div className="flex-1 px-6 pb-6">
          <div className="h-full rounded-lg overflow-hidden border border-gray-200 shadow-sm">
            <WorldRaceMap />
          </div>
        </div>
      </div>
    </>
  );
}
