/**
 * RaceComparison
 * Compares the analyzed route against a famous race course (default Boston),
 * normalized per km so any-length training run compares fairly. Answers the
 * runner's real question: "does my training terrain look like the race?"
 */
import { useMemo, useState } from "react";
import { Mountain, TrendingDown, TrendingUp } from "lucide-react";
import type { RouteInsights } from "@/types/elevation";
import {
  RACE_REFERENCES,
  DEFAULT_RACE_KEY,
  getRaceByKey,
  compareToRace,
  terrainLabel,
  type TerrainLabel,
} from "../raceComparison";

interface RaceComparisonProps {
  insights: RouteInsights;
}

const TERRAIN_BADGE: Record<TerrainLabel, string> = {
  Flat: "bg-emerald-100 text-emerald-800",
  Rolling: "bg-yellow-100 text-yellow-800",
  Hilly: "bg-orange-100 text-orange-800",
  Mountainous: "bg-red-100 text-red-800",
};

function TerrainBadge({ label }: { label: TerrainLabel }) {
  return (
    <span
      className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${TERRAIN_BADGE[label]}`}
    >
      {label}
    </span>
  );
}

function StatColumn({
  title,
  subtitle,
  climbPerKm,
  netDropPerKm,
}: {
  title: string;
  subtitle: string;
  climbPerKm: number;
  netDropPerKm: number;
}) {
  const netDownhill = netDropPerKm >= 0;
  return (
    <div className="flex-1 min-w-0">
      <div className="text-sm font-semibold text-gray-800 truncate">{title}</div>
      <div className="text-xs text-gray-500 mb-2">{subtitle}</div>
      <div className="mb-2">
        <TerrainBadge label={terrainLabel(climbPerKm)} />
      </div>
      <div className="flex items-center gap-1.5 text-sm text-gray-700">
        <TrendingUp className="w-4 h-4 text-red-500 shrink-0" />
        <span className="font-medium">{climbPerKm.toFixed(1)}</span>
        <span className="text-gray-500">m/km climb</span>
      </div>
      <div className="flex items-center gap-1.5 text-sm text-gray-700 mt-1">
        {netDownhill ? (
          <TrendingDown className="w-4 h-4 text-sky-600 shrink-0" />
        ) : (
          <TrendingUp className="w-4 h-4 text-amber-600 shrink-0" />
        )}
        <span className="font-medium">{Math.abs(netDropPerKm).toFixed(1)}</span>
        <span className="text-gray-500">
          m/km net {netDownhill ? "downhill" : "uphill"}
        </span>
      </div>
    </div>
  );
}

export function RaceComparison({ insights }: RaceComparisonProps) {
  const [raceKey, setRaceKey] = useState(DEFAULT_RACE_KEY);

  const race = getRaceByKey(raceKey) ?? RACE_REFERENCES[0];

  const result = useMemo(
    () =>
      race
        ? compareToRace(
            {
              distanceKm: insights.totalDistance,
              elevationGain: insights.totalElevationGain,
              elevationLoss: insights.totalElevationLoss,
            },
            race
          )
        : null,
    [insights, race]
  );

  if (!result) return null;

  return (
    <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 p-4 border-b">
        <h3 className="flex items-center gap-2 font-semibold text-gray-800">
          <Mountain className="w-4 h-4 text-emerald-600" />
          How does this route compare?
        </h3>
        <label className="flex items-center gap-2 text-sm text-gray-600">
          <span className="hidden sm:inline">Compare to</span>
          <select
            value={raceKey}
            onChange={(e) => setRaceKey(e.target.value)}
            className="rounded-md border border-gray-300 bg-white px-2 py-1 text-sm text-gray-800 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            {RACE_REFERENCES.map((r) => (
              <option key={r.key} value={r.key}>
                {r.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="p-4">
        <div className="flex gap-4 sm:gap-8">
          <StatColumn
            title="Your route"
            subtitle={`${insights.totalDistance.toFixed(1)} km`}
            climbPerKm={result.route.climbPerKm}
            netDropPerKm={result.route.netDropPerKm}
          />
          <div className="w-px bg-gray-200 self-stretch" aria-hidden="true" />
          <StatColumn
            title={race.name}
            subtitle={`${race.city} · ${race.distanceKm.toFixed(1)} km`}
            climbPerKm={race.climbPerKm}
            netDropPerKm={race.netDropPerKm}
          />
        </div>

        <p className="mt-4 text-sm text-gray-700">{result.verdict}</p>

        {result.netNote && (
          <div className="mt-3 flex items-start gap-2 rounded-md bg-amber-50 border border-amber-200 p-3 text-sm text-amber-900">
            <span aria-hidden="true">⚠️</span>
            <span>{result.netNote}</span>
          </div>
        )}

        <p className="mt-3 text-xs text-gray-400">
          Normalized per km so any-distance run compares fairly. Race elevation
          figures are course approximates.
        </p>
      </div>
    </div>
  );
}

export default RaceComparison;
