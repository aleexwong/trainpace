/**
 * TerrainBreakdown
 * Two stacked-bar visualizations:
 *  1. Terrain mix — share of distance that is uphill / flat / downhill.
 *  2. Effort zones — share of estimated time spent in each difficulty band
 *     (brutal / hard / moderate / easy), the same buckets the old doughnut
 *     surfaced but laid out inline and always visible.
 */
import { useMemo } from "react";
import type { Segment, RouteInsights, ChallengeRating } from "@/types/elevation";
import { computeTotalTime, formatTime } from "@/utils/difficulty";

interface TerrainBreakdownProps {
  insights: RouteInsights;
  segments: Segment[];
  basePaceMinPerKm: number;
}

interface BarSegment {
  key: string;
  label: string;
  value: number; // raw value (km or minutes)
  pct: number;
  color: string;
  display: string;
}

function StackedBar({ title, items }: { title: string; items: BarSegment[] }) {
  const visible = items.filter((i) => i.pct > 0);
  return (
    <div>
      <h4 className="text-sm font-medium text-gray-700 mb-2">{title}</h4>
      <div className="flex w-full h-5 rounded-full overflow-hidden bg-gray-100">
        {visible.map((i) => (
          <div
            key={i.key}
            className={i.color}
            style={{ width: `${i.pct}%` }}
            title={`${i.label}: ${i.display} (${i.pct.toFixed(0)}%)`}
          />
        ))}
      </div>
      <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-600">
        {visible.map((i) => (
          <div key={i.key} className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-sm shrink-0 ${i.color}`} />
            <span className="truncate">{i.label}</span>
            <span className="ml-auto font-medium text-gray-800">
              {i.display}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

const DIFFICULTY_ORDER: ChallengeRating[] = [
  "brutal",
  "hard",
  "moderate",
  "easy",
];

const DIFFICULTY_BAR_COLOR: Record<ChallengeRating, string> = {
  brutal: "bg-red-600",
  hard: "bg-orange-500",
  moderate: "bg-yellow-400",
  easy: "bg-green-500",
};

const DIFFICULTY_LABEL: Record<ChallengeRating, string> = {
  brutal: "Brutal",
  hard: "Hard",
  moderate: "Moderate",
  easy: "Easy",
};

export function TerrainBreakdown({
  insights,
  segments,
  basePaceMinPerKm,
}: TerrainBreakdownProps) {
  const totalDist = insights.totalDistance || 1;

  const terrainItems: BarSegment[] = [
    {
      key: "uphill",
      label: "Uphill",
      value: insights.uphillDistance,
      pct: (insights.uphillDistance / totalDist) * 100,
      color: "bg-red-500",
      display: `${insights.uphillDistance.toFixed(1)} km`,
    },
    {
      key: "flat",
      label: "Flat",
      value: insights.flatDistance,
      pct: (insights.flatDistance / totalDist) * 100,
      color: "bg-gray-400",
      display: `${insights.flatDistance.toFixed(1)} km`,
    },
    {
      key: "downhill",
      label: "Downhill",
      value: insights.downhillDistance,
      pct: (insights.downhillDistance / totalDist) * 100,
      color: "bg-green-500",
      display: `${insights.downhillDistance.toFixed(1)} km`,
    },
  ];

  const effortItems: BarSegment[] = useMemo(() => {
    const byRating: Record<ChallengeRating, Segment[]> = {
      brutal: [],
      hard: [],
      moderate: [],
      easy: [],
    };
    segments.forEach((s) => byRating[s.challengeRating].push(s));

    const times = DIFFICULTY_ORDER.map((r) =>
      computeTotalTime(byRating[r], basePaceMinPerKm)
    );
    const totalTime = times.reduce((a, b) => a + b, 0) || 1;

    return DIFFICULTY_ORDER.map((rating, idx) => ({
      key: rating,
      label: DIFFICULTY_LABEL[rating],
      value: times[idx],
      pct: (times[idx] / totalTime) * 100,
      color: DIFFICULTY_BAR_COLOR[rating],
      display: formatTime(times[idx]),
    }));
  }, [segments, basePaceMinPerKm]);

  return (
    <div className="w-full bg-white rounded-lg shadow-sm border border-gray-200">
      <h3 className="px-4 py-3 border-b border-gray-200 text-base font-semibold text-gray-800">
        Terrain & Effort
      </h3>
      <div className="p-4 space-y-5">
        <StackedBar title="Terrain mix (distance)" items={terrainItems} />
        <StackedBar title="Effort zones (time)" items={effortItems} />
      </div>
    </div>
  );
}

export default TerrainBreakdown;
